// app/(public)/layout.tsx
import type { Metadata } from 'next'

import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import BackToTop from '@/components/layout/BackToTop'
import { htmlRobots, oeffentlicheMetadataOrigin } from '@/lib/seo/oeffentliche-metadata'

const OEFFENTLICHE_METADATA_ORIGIN = oeffentlicheMetadataOrigin()

export const metadata: Metadata = {
  // metadataBase und robots teilen die D0-2-Wahrheit: öffentliche URLs immer
  // https://jetnity.com, Indexing nur wenn darfIndexieren wahr ist.
  metadataBase: new URL(OEFFENTLICHE_METADATA_ORIGIN),
  title: {
    template: '%s – Jetnity',
    default: 'Jetnity – Deine ganze Reise',
  },
  description:
    'Plane, organisiere und erlebe deine Reise an einem Ort – übersichtlich, persönlich und sicher.',
  robots: htmlRobots(),
  openGraph: {
    type: 'website',
    siteName: 'Jetnity',
    title: 'Jetnity – Deine ganze Reise',
    description:
      'Plane, organisiere und erlebe deine Reise an einem Ort – übersichtlich, persönlich und sicher.',
    images: [
      {
        url: `${OEFFENTLICHE_METADATA_ORIGIN}/images/hero-bali.png`,
        width: 1536,
        height: 1024,
        alt: 'Jetnity – Reiseplanung und Reisebegleitung',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jetnity – Deine ganze Reise',
    description:
      'Plane, organisiere und erlebe deine Reise an einem Ort – übersichtlich, persönlich und sicher.',
    images: [`${OEFFENTLICHE_METADATA_ORIGIN}/images/hero-bali.png`],
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContentLink targetId="public-content" />
      <div className="relative min-h-screen bg-surface-75">
        <PublicNavbar />
        <div id="public-content" className="min-h-[60dvh]">{children}</div>
        <Footer />
        <BackToTop />
      </div>
    </>
  )
}
