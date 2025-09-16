// app/(admin)/admin/domains-email/error.tsx
'use client'

export default function Error({ error, reset }: { error: any; reset: () => void }) {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Domains & E-Mail – Fehler</h1>
      <p className="text-sm text-muted-foreground">
        Beim Laden ist ein Fehler aufgetreten. {String(error?.message ?? '')}
      </p>
      <button className="mt-4 rounded-md border px-3 py-1.5" onClick={() => reset()}>
        Nochmal versuchen
      </button>
    </div>
  )
}
