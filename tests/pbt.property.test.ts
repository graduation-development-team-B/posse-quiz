import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { assertProperty, PBT_NUM_RUNS } from './pbt';
import { validContentCatalogArb } from './generators';

describe('PBT 実行基盤', () => {
  it('設計プロパティを最低100回実行する共通ヘルパーを提供する', () => {
    let runs = 0;

    assertProperty(
      fc.property(fc.integer(), (value) => {
        runs += 1;
        return Number.isInteger(value);
      }),
    );

    expect(PBT_NUM_RUNS).toBe(100);
    expect(runs).toBe(100);
  });

  it('Content_Catalog generator は各週の最小構成を作る', () => {
    assertProperty(
      fc.property(validContentCatalogArb(), (catalog) => {
        expect(catalog.weekUnits).toHaveLength(6);
        for (const weekUnit of catalog.weekUnits) {
          const questions = catalog.questions.filter((question) => question.weekUnitId === weekUnit.id);
          expect(questions.length).toBeGreaterThanOrEqual(15);
        }
      }),
    );
  });
});
