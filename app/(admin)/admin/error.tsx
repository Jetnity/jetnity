// app/(admin)/admin/error.tsx
'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="text-lg font-semibold text-destructive">Es ist ein Fehler aufgetreten</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || 'Unbekannter Fehler.'}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">Ref: {error.digest}</p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        >
          Neu laden
        </button>
        <a
          href="/admin"
          className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        >
          Zum Dashboard
        </a>
      </div>
    </div>
  )
}
