// app/blog/layout.tsx
import type { Metadata } from 'next'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://jetnity.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Jetnity Blog',
    template: '%s – Jetnity Blog',
  },
  description:
    'Reisegeschichten, Guides und Creator-Insights aus der Jetnity Community.',
  alternates: {
    canonical: '/blog',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/blog`,
    siteName: 'Jetnity',
    title: 'Jetnity Blog',
    description:
      'Reisegeschichten, Guides und Creator-Insights aus der Jetnity Community.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jetnity Blog',
    description:
      'Reisegeschichten, Guides und Creator-Insights aus der Jetnity Community.',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Bewusst keine zusätzliche Container-Breite,
  // damit die Child-Pages (Index/Detail) ihr eigenes Layout steuern.
  return <>{children}</>
}
