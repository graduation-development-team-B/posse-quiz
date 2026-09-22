/** ContentSyncManagerの状態と教材取得操作をUIへ公開するhook。 */

import { useContent } from '@/contexts/ContentContext';

export function useContentSync() {
  const content = useContent();
  return {
    catalog: content.catalog,
    state: content.state,
    message: content.message,
    error: content.error,
    isLoading: content.isLoading,
    isContentAvailable: content.isContentAvailable,
    refresh: content.refresh,
    retry: content.retry,
    getManager: content.getManager,
  };
}
