import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static deployment policy', () => {
  const config = JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));

  it('serves assets immutably with hardened browser policies', () => {
    expect(config.routes).toContainEqual(expect.objectContaining({
      route: '/assets/*',
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }));
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('payment=()');
  });

  it('declares correct manifest and AVIF MIME types and ships a mobile AVIF', () => {
    expect(config.mimeTypes).toMatchObject({
      '.avif': 'image/avif',
      '.webmanifest': 'application/manifest+json',
    });
    expect(statSync(new URL('../public/assets/due-board-material-768.avif', import.meta.url)).size).toBeLessThan(100_000);
  });
});
