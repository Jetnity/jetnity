// app/(admin)/admin/content/page.tsx
export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  return (
    <div className="grid gap-6">
      <section className="space-y-4">
        <h1 className="text-lg font-semibold">Inhalte & Uploads</h1>
        <p className="text-sm text-muted-foreground">Content-Verwaltung (Listen, Filter, Status) – folgt.</p>
      </section>
    </div>
  )
}
