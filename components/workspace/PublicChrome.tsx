'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import BackToTop from '@/components/layout/BackToTop'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import WorkspaceShell from './WorkspaceShell'

export default function PublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const workspace = pathname === '/planen' || pathname === '/reisen' || pathname.startsWith('/reisen/')
  if (workspace) return <WorkspaceShell contentId="public-content">{children}</WorkspaceShell>
  return <>
    <SkipToContentLink targetId="public-content" />
    <div className="relative min-h-screen bg-surface-75">
      <PublicNavbar />
      <div id="public-content" tabIndex={-1} className="min-h-[60dvh] outline-none">{children}</div>
      <Footer /><BackToTop />
    </div>
  </>
}
