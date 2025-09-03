// app/layout.tsx
import '../styles/globals.css'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'

export const runtime = 'nodejs' // gesamte App standardmäßig auf Node.js

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: 'Jetnity',
  title: {
    template: '%s – Jetnity',
    default: 'Jetnity – KI-Reiseplattform',
  },
  description: 'Flüge, Hotels, Inspiration & Creator – alles auf einer Plattform',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'Jetnity',
    title: 'Jetnity – KI-Reiseplattform',
    description: 'Flüge, Hotels, Inspiration & Creator – alles auf einer Plattform',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Jetnity' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jetnity – KI-Reiseplattform',
    description: 'Flüge, Hotels, Inspiration & Creator – alles auf einer Plattform',
    images: ['/og-default.png'],
  },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  manifest: '/site.webmanifest',
  // themeColor gehört in das viewport-Export (siehe unten)
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton expand />
        <div id="portal-root" />
      </body>
    </html>
  )
}
