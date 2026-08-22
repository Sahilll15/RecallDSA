import type { MetadataRoute } from 'next';

const BASE_URL = 'https://recall-dsa.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  // Every other route sits behind a GitHub session, so the landing page is
  // the only URL worth telling a crawler about.
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
