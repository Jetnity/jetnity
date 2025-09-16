// components/layout/AdminLayout.tsx
'use client'

import * as React from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminTopbar from '@/components/layout/AdminTopbar'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Body-Scroll sperren, wenn Drawer offen ist
  React.useEffect(() => {
    if (mobileOpen) {
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
    }
    return () => { document.documentElement.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Overlay für Mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar: dauerhaft ab md, mobil als Drawer */}
        <AdminSidebar
          className={cn(
            'hidden md:block',
            mobileOpen && 'fixed left-0 top-0 z-50 block h-[100dvh] w-72 md:static'
          )}
        />

        {/* Hauptbereich */}
        <div className="flex-1 flex flex-col">
          <AdminTopbar
            onToggleSidebar={() => setMobileOpen((v) => !v)}
            showMenuButton={true}
          />
          <main role="main" className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
