// app/(public)/layout.tsx
import '@/styles/globals.css'

import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen" role="main">{children}</main>
      <Footer />
    </>
  )
}
