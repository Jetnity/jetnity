// app/(public)/layout.tsx
import type { Metadata } from 'next'

import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import BackToTop from '@/components/layout/BackToTop'
import { oeffentlicherOrigin } from '@/lib/seo/oeffentlicher-origin'

const { origin: OEFFENTLICHER_ORIGIN } = oeffentlicherOrigin()

export const metadata: Metadata = {
  // metadataBase aus dem D0-2-Origin-Vertrag, damit OG/Twitter und Canonicals
  // dieselbe technische Origin verwenden.
  metadataBase: new URL(OEFFENTLICHER_ORIGIN),
  title: {
    template: '%s – Jetnity',
    default: 'Jetnity – Deine ganze Reise',
  },
  description:
    'Plane, organisiere und erlebe deine Reise an einem Ort – übersichtlich, persönlich und sicher.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Jetnity',
    title: 'Jetnity – Deine ganze Reise',
    description:
      'Plane, organisiere und erlebe deine Reise an einem Ort – übersichtlich, persönlich und sicher.',
    images: [
      {
        url: '/images/hero-bali.png',
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
    images: ['/images/hero-bali.png'],
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
