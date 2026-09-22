import type { ValidationIssue } from '@/types/content';
import { formatValidationIssue } from './validationIssues';

/**
 * APIレスポンスの検証失敗を利用者向けメッセージと分離して扱うための固定文言。
 * 問題ID、Issue code、レスポンス内容などの内部情報は含めない。
 */
export const CONTENT_VALIDATION_ERROR_MESSAGE =
  '教材を取得できませんでした。通信を確認して再試行してください';

export interface ValidationLogger {
  error(message: string): void;
}

/**
 * 検証Issueを開発者ログへ出力する。
 * Issueの構造化情報（特に問題ID）はログに残すが、画面表示用の文言は出力しない。
 */
export function logValidationIssues(
  issues: readonly ValidationIssue[],
  logger: ValidationLogger = console,
): void {
  for (const issue of issues) {
    logger.error(formatValidationIssue(issue));
  }
}

/** 利用者向けエラー文言を返す。検証の詳細や内部IDは公開しない。 */
export function getContentValidationErrorMessage(): string {
  return CONTENT_VALIDATION_ERROR_MESSAGE;
}
