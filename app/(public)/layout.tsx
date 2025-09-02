// app/(public)/layout.tsx
import '@/styles/globals.css'
import type { Metadata } from 'next'

import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import BackToTop from '@/components/layout/BackToTop'
import CookieConsent from '@/components/layout/CookieConsent'
import { Suspense } from 'react'

export const metadata: Metadata = {
  // >>> WICHTIG: metadataBase setzen, damit Next absolute OG/Twitter-URLs baut
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    template: '%s – Jetnity',
    default: 'Jetnity – Reise-Stories & Inspiration',
  },
  description:
    'Entdecke authentische Reise-Stories auf Jetnity – inspirierende Bilder, kompakte Text-Snippets und Impact-Metriken.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Jetnity',
    title: 'Jetnity – Reise-Stories & Inspiration',
    description:
      'Entdecke authentische Reise-Stories auf Jetnity – inspirierende Bilder, kompakte Text-Snippets und Impact-Metriken.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jetnity – Reise-Stories & Inspiration',
    description:
      'Entdecke authentische Reise-Stories auf Jetnity – inspirierende Bilder, kompakte Text-Snippets und Impact-Metriken.',
  },
}

function PublicSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="h-8 w-60 rounded bg-muted animate-pulse mb-6" />
      <div className="h-56 w-full rounded-xl bg-muted animate-pulse" />
    </div>
  )
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContentLink targetId="public-content" />
      <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-background/95">
        <PublicNavbar />
        <main id="public-content" role="main" className="min-h-[60vh]">
          <Suspense fallback={<PublicSkeleton />}>{children}</Suspense>
        </main>
        <Footer />
        <BackToTop />
        <CookieConsent />
      </div>
    </>
  )
}
