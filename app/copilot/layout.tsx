// app/copilot/layout.tsx
import type { Viewport, Metadata } from 'next'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0b1220' },
  ],
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  title: 'CoPilot Empfehlungen • Jetnity',
  description: 'Personalisierte Vorschläge aus deinem Jetnity-Kosmos.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
