// app/layout.tsx
import '../styles/globals.css'
/* Homepage and light-workspace presentation only. Green workspace, metadata and providers stay in their own files. */
import '../styles/white-mint.css'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'

import { PrivacyBeeCmpBoundary } from '@/components/privacy/PrivacyBeeCmpBoundary'
import { productionBootstrapSource } from '@/lib/privacy/privacybee-cmp/bootstrap'
import { htmlRobots, oeffentlicheMetadataOrigin } from '@/lib/seo/oeffentliche-metadata'

const CMP_BOOTSTRAP = productionBootstrapSource()

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
  appleWebApp: {
    capable: true,
    title: 'Jetnity',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#F7FCF9',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Die Dokumentflaeche bleibt das gemeinsame Token in globals.css.
          styles/white-mint.css faerbt Ueberdehnen und Koernung nur, solange
          die Startseite oder der helle Workspace sichtbar sind. */}
      <body className="min-h-screen text-foreground antialiased">
        <script id="jetnity-cmp-bootstrap" dangerouslySetInnerHTML={{ __html: CMP_BOOTSTRAP }} />
        <PrivacyBeeCmpBoundary />
        {children}
        <Toaster position="top-right" richColors closeButton expand />
        <div id="portal-root" />
      </body>
    </html>
  )
}
