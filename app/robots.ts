import type { MetadataRoute } from 'next';

const BASE_URL = 'https://recall-dsa.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Every route past the landing page needs a signed-in session; keep
      // crawlers off account-scoped pages and API routes entirely.
      disallow: ['/dashboard', '/problems', '/revision', '/design', '/settings', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
