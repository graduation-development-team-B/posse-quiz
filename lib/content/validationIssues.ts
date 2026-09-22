import type { ValidationIssue } from '@/types/content';

export type ValidationEntityType = NonNullable<ValidationIssue['entityType']>;

export interface ValidationEntity {
  entityType: ValidationEntityType;
  entityId?: string;
}

/** 検証エラーを画面表示用の文字列と分離した構造化形式で生成する。 */
export function createValidationIssue(
  code: string,
  message: string,
  entity?: ValidationEntity,
): ValidationIssue {
  return {
    code,
    message,
    ...(entity?.entityType ? { entityType: entity.entityType } : {}),
    ...(entity?.entityId ? { entityId: entity.entityId } : {}),
  };
}

/** 開発者ログで問題IDを追跡しやすい形にする。 */
export function formatValidationIssue(issue: ValidationIssue): string {
  const entity = issue.entityType
    ? ` [${issue.entityType}${issue.entityId ? `:${issue.entityId}` : ''}]`
    : '';
  return `${issue.code}: ${issue.message}${entity}`;
}
