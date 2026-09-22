/**
 * ProgressStore: 学習進捗の保存・復元・記録
 * - Content_Cache とは別キー領域（progress:*）に保存
 * - 保存失敗時はメモリ上の直前 Snapshot と既存 Storage を保持
 * - 復元不能・schemaVersion不一致は初期化して日本語メッセージを出す
 */

import type { ProgressSnapshot, RestoreResult, ReviewEntry } from '@/types/progress';
import type { WeekKey } from '@/types/content';
import type { AnswerRecord } from '@/types/session';
import type { StorageAdapter } from '@/lib/storage/StorageAdapter';
import { PROGRESS_SNAPSHOT_KEY } from '@/lib/storage/cacheKeys';
import { DRILL_STORAGE_PREFIX } from '@/lib/quiz/previewDrill';
import { PROGRESS_RESTORE_TIMEOUT_MS, STREAK_MAX } from '@/lib/constants';
import { createInitialProgressSnapshot } from './progressDefaults';
import {
  deserializeProgressSnapshot,
  ProgressSerializationError,
  serializeProgressSnapshot,
} from './progressSerialization';

const PROGRESS_COUNT_MAX = 99_999;

export type ProgressNotice =
  | { kind: 'restored'; message: string }
  | { kind: 'initialized'; message?: string }
  | { kind: 'saved'; message?: string }
  | { kind: 'save-failed'; message: string }
  | { kind: 'reset'; message: string }
  | { kind: 'reset-cancelled'; message: string };

export interface ProgressStoreOptions {
  onNotice?: (notice: ProgressNotice) => void;
}

/** ProgressStore インターフェース */
export interface IProgressStore {
  restore(): Promise<RestoreResult>;
  recordAnswer(input: AnswerRecord & { weekKey: WeekKey }): Promise<void>;
  updateReviewQueue(queue: readonly ReviewEntry[]): Promise<void>;
  save(snapshot?: ProgressSnapshot): Promise<void>;
  getSnapshot(): ProgressSnapshot;
  serialize(snapshot: ProgressSnapshot): string;
  deserialize(json: string): ProgressSnapshot;
  /** confirmed=false の場合は Storage とメモリを変更しない。 */
  reset(confirmed?: boolean): Promise<void>;
}

export class ProgressStore implements IProgressStore {
  private snapshot: ProgressSnapshot;
  private readonly adapter: StorageAdapter;
  private readonly onNotice?: (notice: ProgressNotice) => void;
  private lastSaveSucceeded = true;

  constructor(adapter: StorageAdapter, options: ProgressStoreOptions = {}) {
    this.adapter = adapter;
    this.onNotice = options.onNotice;
    this.snapshot = createInitialProgressSnapshot();
  }

  /** ストレージから Progress_Snapshot を復元する。読み込みは2秒以内で打ち切る。 */
  async restore(): Promise<RestoreResult> {
    try {
      const raw = await withTimeout(
        this.adapter.getItem(PROGRESS_SNAPSHOT_KEY),
        PROGRESS_RESTORE_TIMEOUT_MS,
      );

      if (raw === null) {
        this.snapshot = createInitialProgressSnapshot();
        this.emit({ kind: 'initialized' });
        return { status: 'empty', snapshot: this.snapshot };
      }

      let restored: ProgressSnapshot;
      try {
        restored = this.deserialize(raw);
      } catch (error) {
        const reason = error instanceof ProgressSerializationError
          ? error.message
          : '学習記録の解析に失敗しました。';
        return this.resetAfterRestoreFailure(reason);
      }

      // 保存フォーマットは0〜9999を受理するが、実行時のStreak上限は999に保つ。
      this.snapshot = {
        ...restored,
        streakCount: Math.min(restored.streakCount, STREAK_MAX),
      };
      this.emit({ kind: 'restored', message: '学習記録を復元しました。' });
      return { status: 'ok', snapshot: this.snapshot };
    } catch (error) {
      // 読み込み障害では既存値を削除せず、利用可能な初期状態へ退避する。
      console.warn('学習記録の読み込みに失敗しました。学習記録を初期化しました。', error);
      this.snapshot = createInitialProgressSnapshot();
      const reason = '学習記録の読み込みに失敗しました。学習記録を初期化しました。';
      this.emit({ kind: 'initialized', message: reason });
      return { status: 'reset', snapshot: this.snapshot, reason };
    }
  }

  /** 回答確定時の週別成績とStreakを記録する。 */
  async recordAnswer(
    input: AnswerRecord & { weekKey: WeekKey },
  ): Promise<void> {
    const { weekKey, isCorrect, answeredAt } = input;
    const incrementedQuestionCount = (count: number) =>
      Math.min(count + 1, PROGRESS_COUNT_MAX);

    const weekProgress = this.snapshot.weekProgress.map((progress) => {
      if (progress.weekKey !== weekKey) return progress;
      const questionCount = incrementedQuestionCount(progress.questionCount);
      return {
        ...progress,
        questionCount,
        correctCount: isCorrect
          ? Math.min(progress.correctCount + 1, questionCount)
          : progress.correctCount,
        lastAnsweredAt: answeredAt,
      };
    });

    this.snapshot = {
      ...this.snapshot,
      // WeekKeyは型で対応週に限定されるため、未知キーを追加せず週構造を維持する。
      weekProgress,
      streakCount: isCorrect
        ? Math.min(this.snapshot.streakCount + 1, STREAK_MAX)
        : 0,
    };

    // 保存失敗はsave内部で通知し、メモリ上の更新は保持したまま進行する。
    await this.save();
  }

  /** Review_Queueだけを更新し、他の進捗フィールドを保持して保存する。 */
  async updateReviewQueue(queue: readonly ReviewEntry[]): Promise<void> {
    this.snapshot = {
      ...this.snapshot,
      reviewQueue: [...queue],
    };
    await this.save();
  }

  /** 現在の Snapshot を取得する。 */
  getSnapshot(): ProgressSnapshot {
    return this.snapshot;
  }

  /** Progress_Snapshot を保存する。既存値を先に削除しない。 */
  async save(snapshot?: ProgressSnapshot): Promise<void> {
    const target = snapshot ?? this.snapshot;
    try {
      const json = this.serialize(target);
      await withTimeout(
        this.adapter.setItem(PROGRESS_SNAPSHOT_KEY, json),
        PROGRESS_RESTORE_TIMEOUT_MS,
      );
      this.lastSaveSucceeded = true;
      this.emit({ kind: 'saved' });
    } catch (error) {
      this.lastSaveSucceeded = false;
      // setItemが失敗した場合、既存キーには触れずメモリ状態を維持する。
      console.warn('学習記録の保存に失敗しました。セッションを継続します。', error);
      this.emit({
        kind: 'save-failed',
        message: '学習記録を保存できませんでした。学習は続けられます。',
      });
    }
  }

  /** ProgressSnapshot を JSON 文字列にシリアライズする。 */
  serialize(snapshot: ProgressSnapshot): string {
    return serializeProgressSnapshot(snapshot);
  }

  /** JSON文字列を検証して ProgressSnapshot に復元する。 */
  deserialize(json: string): ProgressSnapshot {
    return deserializeProgressSnapshot(json);
  }

  /**
   * 学習記録を全初期化する。
   * 確認前に呼び出さない。confirmed=false は取消しとして完全なno-opにする。
   */
  async reset(confirmed = true): Promise<void> {
    if (!confirmed) {
      this.emit({ kind: 'reset-cancelled', message: '学習記録の削除を取り消しました。' });
      return;
    }

    this.snapshot = createInitialProgressSnapshot();
    // 保存に成功した場合だけ削除完了を通知し、失敗時はsave-failed通知を最後にする。
    await this.save();
    if (this.lastSaveSucceeded) {
      try {
        const keys = await withTimeout(this.adapter.getAllKeys(), PROGRESS_RESTORE_TIMEOUT_MS);
        await withTimeout(Promise.all(keys.filter(key => key.startsWith(DRILL_STORAGE_PREFIX)).map(key => this.adapter.removeItem(key))), PROGRESS_RESTORE_TIMEOUT_MS);
      } catch {
        this.emit({ kind: 'save-failed', message: 'ドリルの作業記録を削除できませんでした。もう一度お試しください。' });
        return;
      }
      this.emit({ kind: 'reset', message: '学習記録を削除して初期化しました。' });
    }
  }

  private emit(notice: ProgressNotice): void {
    this.onNotice?.(notice);
  }

  private async resetAfterRestoreFailure(reason: string): Promise<RestoreResult> {
    this.snapshot = createInitialProgressSnapshot();
    const message = `${reason}学習記録を初期化しました。`;
    console.warn(message);
    // 保存成功時は初期化結果を最後に、失敗時はsave-failed通知を最後にする。
    await this.save();
    if (this.lastSaveSucceeded) {
      this.emit({ kind: 'initialized', message });
    }
    return { status: 'reset', snapshot: this.snapshot, reason: message };
  }

}

/** 非null値のPromiseを指定時間で打ち切る。 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Storage operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
