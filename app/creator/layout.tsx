import type { ReactNode } from 'react'
import CreatorSidebar from '@/components/creator/CreatorSidebar'

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[auto_1fr]">
      <CreatorSidebar />                 {/* Client-Komponente */}
      <main className="h-full overflow-y-auto">{children}</main>
    </div>
  )
}
