// app/(admin)/admin/not-found.tsx
import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="rounded-2xl border border-border p-6 bg-card">
      <h1 className="text-lg font-semibold">Seite nicht gefunden</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Diese Admin-Seite existiert (noch) nicht.
      </p>
      <div className="mt-4">
        <Link href="/admin" className="underline">Zurück zum Dashboard</Link>
      </div>
    </div>
  )
}
