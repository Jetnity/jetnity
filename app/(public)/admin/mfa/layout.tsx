import type { Metadata } from 'next'

import { NICHT_INDEXIEREN } from '@/lib/seo/index-grenze'

export const metadata: Metadata = {
  robots: NICHT_INDEXIEREN,
}

export default function AdminMfaLayout({ children }: { children: React.ReactNode }) {
  return children
}
