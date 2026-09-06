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

  it('maps the demo route and renders a dedicated 404 response', () => {
    expect(config.routes).toContainEqual(expect.objectContaining({ route: '/demo', rewrite: '/index.html' }));
    expect(config.responseOverrides).toMatchObject({ '404': { rewrite: '/404.html' } });
    const notFound = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8');
    expect(notFound).toContain('<title>Page not found — Due Board</title>');
    expect(notFound).toContain('<h1>This Due Board page was not found</h1>');
  });

  it('ships route metadata, a social image, and a sitemap for public pages', () => {
    for (const path of ['../index.html', '../public/privacy/index.html', '../public/terms/index.html']) {
      const markup = readFileSync(new URL(path, import.meta.url), 'utf8');
      expect(markup).toContain('name="description"');
      expect(markup).toContain('rel="canonical"');
      expect(markup).toContain('property="og:title"');
      expect(markup).toContain('name="twitter:card"');
      expect(markup).toContain('apple-touch-icon');
    }
    expect(statSync(new URL('../public/social-card.jpg', import.meta.url)).size).toBeGreaterThan(1_000);
    const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
    expect(sitemap).toContain('https://supplier-due-board.sociobot.in/demo');
    expect(readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8')).toContain('Sitemap:');
  });
});
