import AdminEvidenceDetails from '@/components/admin/home/AdminEvidenceDetails'

type Evidence = {
  name: string
  source: string
  summary: string
  proves: string
  doesNotProve: string
  detail?: string
  metadata?: Record<string, string | null>
  checks?: Evidence[]
}

/** Preserve the complete source evidence without repeating it in every status row. */
export default function OperationsEvidence({ item }: { item: Evidence }) {
  return (
    <AdminEvidenceDetails>
      <p>{item.summary}</p>
      <p><span className="font-medium text-foreground">Quelle: </span>{item.source}</p>
      <p><span className="font-medium text-foreground">Belegt: </span>{item.proves}</p>
      <p><span className="font-medium text-foreground">Grenzen: </span>{item.doesNotProve}</p>
      {item.detail ? <p>{item.detail}</p> : null}
      {item.checks?.map(check => (
        <div key={check.name} className="space-y-1 border-t pt-2">
          <p className="font-medium text-foreground">{check.name}</p>
          <p>{check.summary}</p>
          <p>Quelle: {check.source}</p>
          <p>Belegt: {check.proves}</p>
          <p>Grenzen: {check.doesNotProve}</p>
        </div>
      ))}
      {item.metadata ? (
        <dl className="grid gap-2 border-t pt-2 sm:grid-cols-2">
          {Object.entries(item.metadata).map(([key, value]) => (
            <div key={key} className="min-w-0"><dt>{key}</dt><dd className="break-all font-mono">{value ?? '—'}</dd></div>
          ))}
        </dl>
      ) : null}
    </AdminEvidenceDetails>
  )
}
