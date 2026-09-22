/**
 * プラットフォーム共通のキー値ストレージ境界。
 * Content_Cache と Progress_Snapshot はこの境界だけを利用し、
 * localStorageやネイティブAPIへ直接依存しない。
 */

export interface StorageAdapter {
  /** 値を取得する。存在しない場合はnullを返す。 */
  getItem(key: string): Promise<string | null>;
  /** 値を保存する。 */
  setItem(key: string, value: string): Promise<void>;
  /** キーを削除する。 */
  removeItem(key: string): Promise<void>;
  /** ストレージ内のキーを取得する。 */
  getAllKeys(): Promise<string[]>;
}
