import catalog from '@/mock-api/catalog.json';

/** デモ用の教材カタログを同一オリジンから返すAPI Route。 */
export function GET() {
  return Response.json(catalog, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}
