import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RecallDSA - Reconstruct, don't just remember",
    short_name: 'RecallDSA',
    description:
      'Syncs solved DSA problems from GitHub and trains you to reconstruct them: pattern recognition, active recall sessions, and true spaced repetition.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0c10',
    theme_color: '#0a0c10',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
