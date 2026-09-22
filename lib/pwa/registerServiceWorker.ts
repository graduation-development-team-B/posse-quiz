export const SERVICE_WORKER_URL = '/service-worker.js';

/**
 * Returns false on native platforms and browsers without Service Worker support.
 * No browser globals are accessed until after the guards pass.
 */
export function isServiceWorkerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  );
}

/**
 * Register only the static asset worker. Unsupported browsers continue normally.
 * Registration failures are intentionally non-fatal for the application.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;

  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
  } catch {
    return null;
  }
}
