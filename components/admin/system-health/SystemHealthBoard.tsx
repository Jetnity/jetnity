'use client'

import { useState } from 'react'
import {
  FRESHNESS_LABEL,
  HEALTH_STATUS_LABEL,
  SYSTEM_HEALTH_API_PFAD,
  healthKarteIstGruen,
  sichtbarerKartenClaim,
  type SystemHealthBericht,
  type SystemHealthCheck,
  type SystemHealthItem,
} from '@/lib/admin/system-health'
import { cn } from '@/lib/utils'

function statusKlassen(item: Pick<SystemHealthItem, 'status' | 'freshness'>): string {
  if (healthKarteIstGruen(item)) {
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-800 dark:text-emerald-200'
  }
  if (item.freshness.state === 'stale' || item.status === 'degraded') {
    return 'border-amber-400/30 bg-amber-400/10 text-amber-800 dark:text-amber-200'
  }
  if (item.status === 'unavailable') {
    return 'border-rose-400/30 bg-rose-400/10 text-rose-800 dark:text-rose-200'
  }
  return 'border-border bg-muted text-foreground'
}

function CheckZeile({ check }: { check: SystemHealthCheck }) {
  const statusText = HEALTH_STATUS_LABEL[check.status]
  const frischeText = FRESHNESS_LABEL[check.freshness.state]
  return (
    <li
      className="rounded-xl border border-border bg-background px-3 py-2"
      data-health-check={check.id}
      data-health-status={check.status}
      data-health-green={healthKarteIstGruen(check) ? 'true' : 'false'}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium">{check.name}</p>
        <p className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', statusKlassen(check))}>
          <span>{statusText}</span>
          <span className="mx-1" aria-hidden>
            ·
          </span>
          <span>{frischeText}</span>
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{check.summary}</p>
    </li>
  )
}

function HealthKarte({ item }: { item: SystemHealthItem }) {
  const [offen, setOffen] = useState(false)
  const statusText = HEALTH_STATUS_LABEL[item.status]
  const frischeText = FRESHNESS_LABEL[item.freshness.state]
  const claim = sichtbarerKartenClaim(item)
  const beschriftung = `${claim}, Quelle ${item.source}, ${frischeText}`
  const gruen = healthKarteIstGruen(item)

  return (
    <article
      className="rounded-2xl border border-border bg-card p-4"
      aria-label={beschriftung}
      data-health-id={item.id}
      data-health-status={item.status}
      data-health-freshness={item.freshness.state}
      data-health-green={gruen ? 'true' : 'false'}
      data-health-claim={claim}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
        </div>
        <p className={cn('rounded-md border px-2 py-1 text-xs font-medium', statusKlassen(item))}>
          <span>{statusText}</span>
          <span className="mx-1" aria-hidden>
            ·
          </span>
          <span>{frischeText}</span>
        </p>
      </div>
      {item.checks?.length ? (
        <ul className="mt-3 grid gap-2" aria-label={`Teilprüfungen ${item.name}`}>
          {item.checks.map((teil) => (
            <CheckZeile key={teil.id} check={teil} />
          ))}
        </ul>
      ) : null}
      <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="font-medium text-foreground">Quelle</dt>
          <dd>{item.source}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Geprüft</dt>
          <dd>{new Date(item.checkedAt).toLocaleString('de-CH')}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:no-underline"
        aria-expanded={offen}
        onClick={() => setOffen((wert) => !wert)}
      >
        {offen ? 'Details schliessen' : 'Details'}
      </button>
      {offen ? (
        <div className="mt-3 space-y-2 text-sm text-muted-foreground" data-health-detail>
          <p>
            <span className="font-medium text-foreground">Beweist: </span>
            {item.proves}
          </p>
          <p>
            <span className="font-medium text-foreground">Beweist nicht: </span>
            {item.doesNotProve}
          </p>
          {item.detail ? <p>{item.detail}</p> : null}
          {item.metadata ? (
            <ul className="font-mono text-xs">
              {Object.entries(item.metadata).map(([schluessel, wert]) => (
                <li key={schluessel}>
                  {schluessel}: {wert ?? '—'}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export default function SystemHealthBoard({
  anfang,
  endpunkt = SYSTEM_HEALTH_API_PFAD,
  aktualisierenErlaubt = true,
}: {
  anfang: SystemHealthBericht
  endpunkt?: string
  aktualisierenErlaubt?: boolean
}) {
  const [bericht, setBericht] = useState(anfang)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const aktualisieren = async () => {
    if (laeuft || !aktualisierenErlaubt) return
    setLaeuft(true)
    setFehler(null)
    try {
      const res = await fetch(endpunkt, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'Health konnte nicht gelesen werden.')
      }
      setBericht(json as SystemHealthBericht)
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Health konnte nicht gelesen werden.')
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Geprüft {new Date(bericht.checkedAt).toLocaleString('de-CH')}. Keine Schreibaktion. Kein
          automatisches Sekunden-Polling.
        </p>
        {aktualisierenErlaubt ? (
          <button
            type="button"
            onClick={aktualisieren}
            disabled={laeuft}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted disabled:opacity-60"
          >
            {laeuft ? 'Aktualisiert…' : 'Erneut prüfen'}
          </button>
        ) : null}
      </div>
      {fehler ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
        >
          {fehler}
        </p>
      ) : null}
      <div className="grid gap-4">
        {bericht.items.map((item) => (
          <HealthKarte key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
