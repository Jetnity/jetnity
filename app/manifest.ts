import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jetnity – Deine ganze Reise',
    short_name: 'Jetnity',
    description: 'Persönliche Reiseplanung und Reisebegleitung an einem Ort.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f4ee',
    theme_color: '#153a33',
    lang: 'de',
    categories: ['travel', 'lifestyle', 'productivity'],
  }
}
