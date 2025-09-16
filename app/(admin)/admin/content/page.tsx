// app/(admin)/admin/content/page.tsx
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import CopilotDockPanel from '@/components/admin/CopilotDockPanel'

export default async function ContentPage() {
  await requireAdmin()
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2 space-y-4">
        <h1 className="text-lg font-semibold">Inhalte & Uploads</h1>
        <p className="text-sm text-muted-foreground">Content-Verwaltung (Listen, Filter, Status) – folgt.</p>
      </section>
      <aside><CopilotDockPanel /></aside>
    </div>
  )
}
