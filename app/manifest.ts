import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jetnity – Deine ganze Reise',
    short_name: 'Jetnity',
    description: 'Persönliche Reiseplanung und Reisebegleitung an einem Ort.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f4ee',
    theme_color: '#153a33',
    lang: 'de',
    categories: ['travel', 'lifestyle', 'productivity'],
    icons: [
      {
        src: '/icons/jetnity-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/jetnity-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/jetnity-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
