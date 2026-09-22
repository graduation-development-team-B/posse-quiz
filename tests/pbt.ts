/** Property-Based Test 共通設定。設計書の全 Property を最低100回実行する。 */

import fc from 'fast-check';

export const PBT_NUM_RUNS = 100;

export function assertProperty<T>(
  property: fc.IProperty<T>,
  parameters: Omit<fc.Parameters<T>, 'numRuns'> = {},
): void {
  fc.assert(property, { ...parameters, numRuns: PBT_NUM_RUNS });
}
