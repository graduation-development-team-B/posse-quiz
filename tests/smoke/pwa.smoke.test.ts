import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  CONTENT_CACHE_CURRENT_KEY,
  PROGRESS_SNAPSHOT_KEY,
  buildContentCacheVersionKey,
  isContentCacheKey,
  isProgressKey,
} from '@/lib/storage/cacheKeys';

const projectRoot = resolve(__dirname, '../..');
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('PWA shell assets', () => {
  it('publishes an installable manifest with the required icon sizes', () => {
    const manifest = JSON.parse(readProjectFile('public/manifest.json')) as {
      name: string;
      short_name: string;
      display: string;
      theme_color: string;
      background_color: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
    };

    expect(existsSync(resolve(projectRoot, 'public/icons/icon-192.png'))).toBe(true);
    expect(existsSync(resolve(projectRoot, 'public/icons/icon-512.png'))).toBe(true);
    expect(JSON.parse(readProjectFile('app.json')).expo.web.output).toBe('server');
    expect(manifest.name.length).toBeGreaterThanOrEqual(1);
    expect(manifest.name.length).toBeLessThanOrEqual(30);
    expect(manifest.short_name.length).toBeGreaterThanOrEqual(1);
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }),
      ]),
    );
  });

  it('limits the Service Worker to same-origin static assets', () => {
    const worker = readProjectFile('public/service-worker.js');

    expect(worker).toContain("request.method !== 'GET'");
    expect(worker).toContain('url.origin !== self.location.origin');
    expect(worker).toContain("url.pathname.startsWith('/api/')");
    expect(worker).toContain("url.pathname.startsWith('/content/')");
    expect(worker).toContain("url.pathname.startsWith('/progress/')");
    expect(worker).toContain('request.destination');
    expect(worker).toContain("ASSET_CACHE_PREFIX = 'posse-quiz-app-assets-'");
  });

  it('keeps registration optional for unsupported browsers', () => {
    const html = readProjectFile('app/+html.tsx');
    const registration = readProjectFile('lib/pwa/registerServiceWorker.ts');

    expect(html).toContain('<link rel="manifest" href="/manifest.json" />');
    expect(registration).toContain("'serviceWorker' in navigator");
    expect(registration).toContain('return null;');
    expect(registration).toContain("'/service-worker.js'");
  });

  it('keeps Content_Cache and Progress_Snapshot in separate key namespaces', () => {
    const contentVersionKey = buildContentCacheVersionKey('2025-10-01.1');

    expect(isContentCacheKey(CONTENT_CACHE_CURRENT_KEY)).toBe(true);
    expect(isContentCacheKey(contentVersionKey)).toBe(true);
    expect(isProgressKey(PROGRESS_SNAPSHOT_KEY)).toBe(true);
    expect(isContentCacheKey(PROGRESS_SNAPSHOT_KEY)).toBe(false);
    expect(isProgressKey(CONTENT_CACHE_CURRENT_KEY)).toBe(false);
  });
});
