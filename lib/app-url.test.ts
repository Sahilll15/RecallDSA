import { describe, expect, it } from 'vitest';
import { resolveAppUrl } from './app-url';

describe('resolveAppUrl', () => {
  it('uses an explicitly configured public url', () => {
    expect(resolveAppUrl({ NEXT_PUBLIC_APP_URL: 'https://recalldsa.app' })).toBe(
      'https://recalldsa.app',
    );
  });

  it('ignores a leftover localhost value when the platform knows better', () => {
    expect(
      resolveAppUrl({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        VERCEL_PROJECT_PRODUCTION_URL: 'recall-dsa.vercel.app',
      }),
    ).toBe('https://recall-dsa.vercel.app');
  });

  it('treats every loopback spelling as local', () => {
    for (const host of ['http://127.0.0.1:3000', 'http://0.0.0.0:3000']) {
      expect(
        resolveAppUrl({
          NEXT_PUBLIC_APP_URL: host,
          VERCEL_PROJECT_PRODUCTION_URL: 'recall-dsa.vercel.app',
        }),
      ).toBe('https://recall-dsa.vercel.app');
    }
  });

  it('keeps localhost when nothing better exists, so local development works', () => {
    expect(resolveAppUrl({ NEXT_PUBLIC_APP_URL: 'http://localhost:3000' })).toBe(
      'http://localhost:3000',
    );
  });

  it('falls back to the deployment url when no production domain is set', () => {
    expect(resolveAppUrl({ VERCEL_URL: 'recall-abc123.vercel.app' })).toBe(
      'https://recall-abc123.vercel.app',
    );
  });

  it('prefers the stable production domain over the deployment url', () => {
    expect(
      resolveAppUrl({
        VERCEL_PROJECT_PRODUCTION_URL: 'recall-dsa.vercel.app',
        VERCEL_URL: 'recall-abc123.vercel.app',
      }),
    ).toBe('https://recall-dsa.vercel.app');
  });

  it('adds a protocol to a bare platform host', () => {
    expect(resolveAppUrl({ VERCEL_URL: 'x.vercel.app' })).toBe('https://x.vercel.app');
  });

  it('strips a trailing slash so joined paths do not double up', () => {
    expect(resolveAppUrl({ NEXT_PUBLIC_APP_URL: 'https://recalldsa.app/' })).toBe(
      'https://recalldsa.app',
    );
  });

  it('falls back to localhost when nothing is configured at all', () => {
    expect(resolveAppUrl({})).toBe('http://localhost:3000');
  });
});
