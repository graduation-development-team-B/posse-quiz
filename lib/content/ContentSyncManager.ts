/**
 * Content_Cache と Content_API の同期オーケストレーター。
 *
 * Cacheの読み込みとProgress復元を先に並行開始し、Cacheがあれば教材を
 * すぐに公開したうえでAPI更新をバックグラウンドで実行する。APIレスポンスは
 * 必ず全体検証し、CacheStoreのatomic commit完了後にだけメモリを切り替える。
 */

import { CONTENT_API_CONFIG } from '@/lib/config';
import type { ContentCache, ContentCatalog } from '@/types/content';
import type {
  ContentApiClient,
  ContentCacheStore,
  ContentSyncManager as ContentSyncManagerContract,
  RefreshReason,
  SyncEvent,
  SyncState,
} from '@/types/sync';
import { validateApiResponse } from './validateApiResponse';
import type { IProgressStore } from '@/lib/progress/ProgressStore';

export interface ContentSyncManagerOptions {
  readonly apiClient: ContentApiClient;
  readonly cacheStore: ContentCacheStore;
  /** 起動時のProgress復元。Contextから共有ProgressStoreを渡せる。 */
  readonly progressStore?: Pick<IProgressStore, 'restore'>;
  readonly apiVersion?: string;
  readonly now?: () => string;
}

export type SyncListener = (event: SyncEvent) => void;

/** 問題IDを含む検証失敗を同期エラーとして扱うためのError。 */
export class ContentSyncValidationError extends Error {
  readonly issues: ReturnType<typeof validateApiResponse> extends { ok: false; issues: infer I } ? I : never;

  constructor(issues: Extract<ReturnType<typeof validateApiResponse>, { ok: false }>['issues']) {
    super('教材APIレスポンスの検証に失敗しました。');
    this.name = 'ContentSyncValidationError';
    this.issues = issues as ContentSyncValidationError['issues'];
  }
}

export class ContentSyncManagerImpl implements ContentSyncManagerContract {
  private readonly apiClient: ContentApiClient;
  private readonly cacheStore: ContentCacheStore;
  private readonly progressStore?: Pick<IProgressStore, 'restore'>;
  private readonly apiVersion: string;
  private readonly now: () => string;
  private readonly listeners = new Set<SyncListener>();

  private state: SyncState = 'uninitialized';
  private catalog: ContentCatalog | null = null;
  private currentCache: ContentCache | null = null;
  private message: string | undefined;
  private error: Error | undefined;
  private initializePromise: Promise<void> | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(options: ContentSyncManagerOptions) {
    this.apiClient = options.apiClient;
    this.cacheStore = options.cacheStore;
    this.progressStore = options.progressStore;
    this.apiVersion = options.apiVersion
      ?? getApiVersion(options.apiClient)
      ?? CONTENT_API_CONFIG.apiVersion;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  /**
   * Cache read とProgress restoreは同じtickで開始する。
   * このメソッドはAPI取得完了を待たず、起動時のCache確認後に戻る。
   */
  initialize(): Promise<void> {
    if (this.initializePromise) return this.initializePromise;
    this.initializePromise = this.initializeInternal();
    return this.initializePromise;
  }

  /** API更新を実行する。失敗は状態へ反映し、呼び出し元へrejectしない。 */
  refresh(reason: RefreshReason): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;

    const refreshPromise = this.refreshInternal(reason);
    this.refreshPromise = refreshPromise;
    void refreshPromise.finally(() => {
      if (this.refreshPromise === refreshPromise) this.refreshPromise = null;
    });
    return refreshPromise;
  }

  /** 手動再試行の明示的な別名。 */
  retry(): Promise<void> {
    return this.refresh('manual');
  }

  getCatalog(): ContentCatalog | null {
    return this.catalog;
  }

  getState(): SyncState {
    return this.state;
  }

  getMessage(): string | undefined {
    return this.message;
  }

  getError(): Error | undefined {
    return this.error;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async initializeInternal(): Promise<void> {
    // Promiseを個別に生成してからawaitすることで、両方のI/Oを並行開始する。
    const cachePromise = this.cacheStore.read().catch((reason: unknown) => {
      console.warn('教材キャッシュの読み込みに失敗しました。API更新を続行します。', reason);
      return null;
    });
    const progressPromise = this.progressStore
      ? this.progressStore.restore().catch((reason: unknown) => {
        // Progressの復元失敗はProgressStoreの責務で初期化されるため、教材起動を止めない。
        console.warn('学習記録の復元に失敗しました。教材同期を続行します。', reason);
      })
      : Promise.resolve();

    // Progressの復元完了を待たず、Cacheだけ先に公開する。
    const cache = await cachePromise;
    if (cache) {
      this.currentCache = cache;
      this.catalog = cache.response.catalog;
      this.setState('using-cache', '前回の教材を利用中です。最新教材を確認しています。');
    } else {
      this.setState('loading', '教材を確認しています。');
    }

    // Cacheを表示したままAPI確認を開始し、UI操作をAPI待ちにしない。
    void this.refresh('startup');
    // Progress復元もCache readと同時に開始済みで、教材の表示をブロックしない。
    void progressPromise;
  }

  private async refreshInternal(_reason: RefreshReason): Promise<void> {
    if (this.catalog) {
      this.setState('using-cache', '前回の教材を利用中です。最新教材を確認しています。');
    } else {
      this.setState('loading', '教材を取得しています。');
    }

    try {
      const rawResponse = await this.apiClient.fetchCatalog();
      const validation = validateApiResponse(rawResponse);
      if (!validation.ok) {
        this.logValidationIssues(validation.issues);
        throw new ContentSyncValidationError(validation.issues);
      }

      const response = validation.response;
      if (
        this.currentCache &&
        this.currentCache.apiVersion === this.apiVersion &&
        this.currentCache.response.contentVersion === response.contentVersion
      ) {
        // 同一API_VersionとcontentVersionでは再保存も参照切替も行わない。
        this.error = undefined;
        this.setState('ready', '教材は最新です。');
        return;
      }

      const nextCache: ContentCache = {
        response,
        apiVersion: this.apiVersion,
        cachedAt: this.now(),
      };
      const hadCurrentCatalog = this.catalog !== null;

      // CacheStoreがstaging/readback/pointer切替を完了するまでメモリを変更しない。
      await this.cacheStore.writeAtomically(nextCache);

      this.currentCache = nextCache;
      this.catalog = response.catalog;
      this.error = undefined;
      this.setState(hadCurrentCatalog ? 'updated' : 'ready', hadCurrentCatalog
        ? '教材を更新しました。'
        : '教材を利用できます。');

      // cleanupはcommit後のbest effort。失敗しても新しい教材とProgressは有効なまま。
      try {
        await this.cacheStore.removePreviousAfterCommit(response.contentVersion);
      } catch (cleanupError) {
        console.warn('旧教材キャッシュの掃除に失敗しました。新しい教材は利用可能です。', cleanupError);
      }
    } catch (reason: unknown) {
      const failure = toError(reason);
      this.error = failure;
      if (this.currentCache && this.catalog) {
        this.setState('using-cache', '教材を取得できないため、前回の教材を利用中です。');
      } else {
        this.setState('error', '教材を取得できませんでした。通信を確認して再試行してください。');
      }
    }
  }

  private setState(state: SyncState, message?: string, error?: Error): void {
    this.state = state;
    this.message = message;
    if (error !== undefined) this.error = error;
    const event: SyncEvent = {
      state,
      message,
      error: this.error,
    };
    for (const listener of this.listeners) listener(event);
  }

  private logValidationIssues(issues: Extract<ReturnType<typeof validateApiResponse>, { ok: false }>['issues']): void {
    for (const issue of issues) {
      console.warn('Content_API validation issue', {
        phase: 'validate',
        issueCode: issue.code,
        entityType: issue.entityType,
        entityId: issue.entityId,
      });
    }
  }
}

/** 型境界の名称を満たす公開クラス。 */
export class ContentSyncManager extends ContentSyncManagerImpl {}

function getApiVersion(apiClient: ContentApiClient): string | undefined {
  const candidate = apiClient as ContentApiClient & { config?: { apiVersion?: unknown } };
  return typeof candidate.config?.apiVersion === 'string' && candidate.config.apiVersion.trim().length > 0
    ? candidate.config.apiVersion
    : undefined;
}

function toError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === 'string' ? reason : '教材同期に失敗しました。');
}
