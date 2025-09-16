// app/(admin)/admin/security/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdmin } from '@/lib/auth/requireAdmin'
import SecurityWidget from '@/components/admin/security/SecurityWidget'

export default async function SecurityPage() {
  await requireAdmin()

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Jetnity Security Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Live-Überwachung, Blocklist & schnelle Gegenmaßnahmen.
          </p>
        </div>
      </header>

      <SecurityWidget />
    </main>
  )
}
