// app/(admin)/admin/loading.tsx
export default function AdminLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-5 bg-card">
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <div className="mt-4 h-24 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <aside className="space-y-6">
        <div className="rounded-2xl border border-border p-5 bg-card">
          <div className="h-5 w-28 rounded bg-muted animate-pulse" />
          <div className="mt-4 h-48 rounded bg-muted animate-pulse" />
        </div>
      </aside>
    </div>
  )
}
