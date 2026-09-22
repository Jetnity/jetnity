import { loadAdminAccountCounts } from '@/lib/admin/account-counts-delivery/reader'
import type {
  AdminAccountCountsMeasures,
  AdminAccountCountsReadResult,
} from '@/lib/admin/account-counts-delivery/contract'
import { ADMIN_ACCOUNT_COUNTS_WINDOW_HOURS } from '@/lib/admin/account-counts-delivery/contract'

export const ADMIN_ACCOUNT_COUNTS_COPY = {
  titel: 'Registrierte Konten',
  hinweis:
    'Zwei Roh-Aggregate aus der lokalen, nicht angewendeten Zählfunktion. Keine Besucher, keine aktiven Nutzer, kein Partnerverkehr und kein Umsatz.',
  presentLabel: 'Registrierte Konten (aktuell)',
  presentDefinition:
    'Vorhandene auth.users-Zeilen, die nicht gelöscht und nicht anonym sind. Konten ohne Profil zählen mit.',
  windowLabel: `Neu in den letzten ${ADMIN_ACCOUNT_COUNTS_WINDOW_HOURS} Stunden`,
  windowDefinition:
    'Teilmenge der aktuellen Konten, deren ursprünglicher created_at in dem von der Datenbank gemessenen Fenster liegt. Nicht die letzten Kalendertage und nicht ein Konversionszeitpunkt.',
  standLabel: 'Stand der Datenbankuhr',
  fensterLabel: 'Fensterbeginn',
  caveats:
    'Rohkonten, keine bereinigten Menschen. Interne, unbestätigte und gesperrte Profile bleiben enthalten, solange das Konto vorhanden ist. Das aufrufende Konto zählt in der Gegenwart mit; das Fenster kann 0 sein. Keine Live-Statistik und keine Production-Aktivierung.',
  forbidden:
    'Für diese Kontenzahlen fehlt eine rollengebundene Berechtigung „konten-verwalten“ mit aktueller AAL2. Notzugang über die Oberfläche reicht nicht.',
  unavailable:
    'Die lokale Zählfunktion ist in dieser Umgebung nicht vorhanden. Das ist keine leere Statistik.',
  failed:
    'Die Kontenzahlen konnten nicht zuverlässig gelesen werden. Es wird keine Null angezeigt.',
} as const

export function formatExactAccountCount(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function Masszahl({
  id,
  label,
  value,
  definition,
}: {
  id: string
  label: string
  value: string
  definition: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background p-4">
      <p id={id} className="text-sm text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-all text-2xl font-semibold tabular-nums" aria-labelledby={id}>
        {formatExactAccountCount(value)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{definition}</p>
    </div>
  )
}

function Erfolg({ measures }: { measures: AdminAccountCountsMeasures }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Masszahl
        id="admin-account-counts-present"
        label={ADMIN_ACCOUNT_COUNTS_COPY.presentLabel}
        value={measures.presentRegisteredAccounts}
        definition={ADMIN_ACCOUNT_COUNTS_COPY.presentDefinition}
      />
      <Masszahl
        id="admin-account-counts-window"
        label={ADMIN_ACCOUNT_COUNTS_COPY.windowLabel}
        value={measures.createdInPrior30Days}
        definition={ADMIN_ACCOUNT_COUNTS_COPY.windowDefinition}
      />
      <p className="min-w-0 text-xs text-muted-foreground sm:col-span-2">
        <span className="font-medium text-foreground">{ADMIN_ACCOUNT_COUNTS_COPY.standLabel}: </span>
        <time dateTime={measures.measuredAt}>{measures.measuredAt}</time>
        <span className="mx-2">·</span>
        <span className="font-medium text-foreground">{ADMIN_ACCOUNT_COUNTS_COPY.fensterLabel}: </span>
        <time dateTime={measures.windowStart}>{measures.windowStart}</time>
        <span className="mx-2">·</span>
        genau {ADMIN_ACCOUNT_COUNTS_WINDOW_HOURS} Stunden, halboffen.
      </p>
    </div>
  )
}

export function AdminAccountCountsAnsicht({ result }: { result: AdminAccountCountsReadResult }) {
  if (result.status === 'disabled') return null

  const meldung =
    result.status === 'forbidden'
      ? ADMIN_ACCOUNT_COUNTS_COPY.forbidden
      : result.status === 'unavailable'
        ? ADMIN_ACCOUNT_COUNTS_COPY.unavailable
        : result.status === 'failed'
          ? ADMIN_ACCOUNT_COUNTS_COPY.failed
          : null

  return (
    <div className="min-w-0 w-full max-w-full" aria-labelledby="admin-account-counts-titel">
      <h2 id="admin-account-counts-titel" className="text-lg font-semibold">
        {ADMIN_ACCOUNT_COUNTS_COPY.titel}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{ADMIN_ACCOUNT_COUNTS_COPY.hinweis}</p>
      {result.status === 'available' ? (
        <div className="mt-4">
          <Erfolg measures={result.measures} />
          <p className="mt-3 text-xs text-muted-foreground">{ADMIN_ACCOUNT_COUNTS_COPY.caveats}</p>
        </div>
      ) : (
        <p role="status" className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          {meldung}
        </p>
      )}
    </div>
  )
}

export default async function AdminAccountCounts() {
  try {
    const result = await loadAdminAccountCounts()
    if (result.status === 'disabled') return null
    return <AdminAccountCountsAnsicht result={result} />
  } catch {
    return <AdminAccountCountsAnsicht result={{ status: 'failed' }} />
  }
}
