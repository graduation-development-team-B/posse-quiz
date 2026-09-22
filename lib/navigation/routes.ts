/**
 * Expo Routerへ渡すパラメータの境界。
 * 大きなCatalogやQuizSession本体はURLへ渡さず、安定したIDだけを渡す。
 */

export type SessionRouteParams = Readonly<{ sessionId: string }>;
export type TermRouteParams = Readonly<{ termId: string }>;
export type QuizRoute = Readonly<{
  pathname: '/quiz/[sessionId]';
  params: SessionRouteParams;
}>;
export type ResultRoute = Readonly<{
  pathname: '/result/[sessionId]';
  params: SessionRouteParams;
}>;
export type ImmediateReviewRoute = Readonly<{
  pathname: '/immediate-review/[sessionId]';
  params: SessionRouteParams;
}>;
export type TermRoute = Readonly<{
  pathname: '/term/[termId]';
  params: TermRouteParams;
}>;

export function createQuizRoute(sessionId: string): QuizRoute {
  return {
    pathname: '/quiz/[sessionId]',
    params: { sessionId: requireRouteId(sessionId, 'sessionId') },
  };
}

export function createResultRoute(sessionId: string): ResultRoute {
  return {
    pathname: '/result/[sessionId]',
    params: { sessionId: requireRouteId(sessionId, 'sessionId') },
  };
}

export function createImmediateReviewRoute(sessionId: string): ImmediateReviewRoute {
  return {
    pathname: '/immediate-review/[sessionId]',
    params: { sessionId: requireRouteId(sessionId, 'sessionId') },
  };
}
export function createTermRoute(termId: string): TermRoute {
  return {
    pathname: '/term/[termId]',
    params: { termId: requireRouteId(termId, 'termId') },
  };
}


/** URLパラメータからSession IDだけを安全に取り出す。 */
export function readSessionId(params: unknown): string | null {
  return readRouteId(params, 'sessionId');
}

/** URLパラメータからTerm IDだけを安全に取り出す。 */
export function readTermId(params: unknown): string | null {
  return readRouteId(params, 'termId');
}

function readRouteId(params: unknown, key: 'sessionId' | 'termId'): string | null {
  if (!params || typeof params !== 'object') return null;
  const value = (params as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function requireRouteId(value: string, key: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} は空にできません`);
  }
  return value;
}
