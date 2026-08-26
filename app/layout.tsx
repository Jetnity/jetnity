// app/layout.tsx
import '../styles/globals.css'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'

import { htmlRobots, oeffentlicheMetadataOrigin } from '@/lib/seo/oeffentliche-metadata'

export const runtime = 'nodejs' // gesamte App standardmäßig auf Node.js

const OEFFENTLICHE_METADATA_ORIGIN = oeffentlicheMetadataOrigin()

export const metadata: Metadata = {
  metadataBase: new URL(OEFFENTLICHE_METADATA_ORIGIN),
  applicationName: 'Jetnity',
  title: {
    template: '%s – Jetnity',
    default: 'Jetnity – Deine ganze Reise',
  },
  description: 'Plane, organisiere und erlebe deine Reise an einem Ort.',
  robots: htmlRobots(),
  openGraph: {
    type: 'website',
    url: OEFFENTLICHE_METADATA_ORIGIN,
    siteName: 'Jetnity',
    title: 'Jetnity – Deine ganze Reise',
    description: 'Plane, organisiere und erlebe deine Reise an einem Ort.',
    images: [{ url: `${OEFFENTLICHE_METADATA_ORIGIN}/images/hero-bali.png`, width: 1536, height: 1024, alt: 'Jetnity' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jetnity – Deine ganze Reise',
    description: 'Plane, organisiere und erlebe deine Reise an einem Ort.',
    images: [`${OEFFENTLICHE_METADATA_ORIGIN}/images/hero-bali.png`],
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#f5f4ee',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      {/* Die Flaeche des Dokuments liegt auf <html> (siehe globals.css), damit
          sie auch beim Ueberdehnen des Scrollbereichs auf iOS und unterhalb
          kurzer Seiten zur warmen V2-Flaeche passt. */}
      <body className="min-h-screen text-foreground antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton expand />
        <div id="portal-root" />
      </body>
    </html>
  )
}
