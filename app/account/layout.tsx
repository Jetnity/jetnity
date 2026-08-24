// app/account/layout.tsx
//
// Account-Shell: öffentliche Leiste plus kompakte Konto-Navigation.
// Kein zweites Workspace-Dashboard.

import type { Metadata } from 'next'

import AccountNavigation from '@/components/account/AccountNavigation'
import Footer from '@/components/layout/Footer'
import PublicNavbar from '@/components/layout/PublicNavbar'
import SkipToContentLink from '@/components/layout/SkipToContentLink'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContentLink targetId="account-content" />
      <div className="relative min-h-screen bg-surface-75">
        <PublicNavbar />
        <AccountNavigation />
        <div id="account-content" className="min-h-[60dvh]">
          {children}
        </div>
        <Footer />
      </div>
    </>
  )
}
