/**
 * 自由入力の判定前に許可された境界文字だけを除去する。
 *
 * JavaScript の String.prototype.trim() は NBSP なども除去するため、
 * 要件で指定された半角空白・全角空白・タブ・改行だけを対象にする。
 */
const FREE_TEXT_BOUNDARY_WHITESPACE = /^[ \u3000\t\r\n]+|[ \u3000\t\r\n]+$/g;

export function normalizeFreeText(input: string): string {
  return input.replace(FREE_TEXT_BOUNDARY_WHITESPACE, '');
}

export default normalizeFreeText;
