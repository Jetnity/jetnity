'use client'

import { useState } from 'react'
import {
  FRESHNESS_LABEL,
  PROVIDER_OPS_BOARD_API_PFAD,
  PROVIDER_OPS_BOARD_STATUS_LABEL,
  providerOpsKarteIstGruen,
  sichtbarerKartenClaim,
  type ProviderOpsBoardBericht,
  type ProviderOpsBoardCheck,
  type ProviderOpsBoardItem,
} from '@/lib/admin/provider-ops-board'
import OperationsEvidence from '@/components/admin/OperationsEvidence'
import { cn } from '@/lib/utils'

function statusKlassen(item: {
  id: string
  status: ProviderOpsBoardItem['status']
  freshness: ProviderOpsBoardItem['freshness']
}): string {
  if (providerOpsKarteIstGruen(item)) {
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-800 dark:text-emerald-200'
  }
  if (item.freshness.state === 'stale') {
    return 'border-amber-400/30 bg-amber-400/10 text-amber-800 dark:text-amber-200'
  }
  if (item.status === 'unavailable') {
    return 'border-rose-400/30 bg-rose-400/10 text-rose-800 dark:text-rose-200'
  }
  return 'border-border bg-background text-muted-foreground'
}

function statusLabel(status: ProviderOpsBoardItem['status'], id: string): string {
  if (status === 'foundation_only') return 'Technisch vorbereitet'
  if (status === 'available') return id === 'model-usage' ? 'Protokoll lesbar' : 'Belegte Test-Capability'
  return PROVIDER_OPS_BOARD_STATUS_LABEL[status]
}

function kurztext(item: ProviderOpsBoardItem): string {
  if (item.status === 'foundation_only') {
    if (item.id === 'provider-ops') return 'Technische Grundlage vorhanden. Keine Live-Provider-Freigabe.'
    if (item.id === 'kill-switch') return 'Globale, dauerhafte Durchsetzung ist nicht belegt.'
    if (item.id === 'cost-guard') return 'Kein globales, dauerhaftes Budgetlimit.'
  }
  if (item.id === 'model-usage') {
    if (item.status === 'empty') return 'Keine aufgezeichneten Modellaufrufe im gelesenen Zeitraum. Kein Beleg für null Ausgaben.'
    if (item.status === 'available') return 'Aufgezeichnete Modellaufrufe sind lesbar. Kostenabdeckung bleibt unvollständig.'
    if (item.status === 'unavailable') return 'Das Nutzungsprotokoll konnte nicht gelesen werden.'
    if (item.status === 'unknown') return 'Es liegt kein belastbarer Nutzungsstand vor.'
  }
  return item.summary
}

function CheckZeile({ check }: { check: ProviderOpsBoardCheck }) {
  const statusText = statusLabel(check.status, check.id)
  const frischeText = FRESHNESS_LABEL[check.freshness.state]
  return (
    <li
      className="min-w-0 border-b border-border px-1 py-3 last:border-b-0"
      data-ops-check={check.id}
      data-ops-status={check.status}
      data-ops-green={providerOpsKarteIstGruen(check) ? 'true' : 'false'}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium">{check.name}</p>
        <p className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', statusKlassen(check))}>
          <span>{statusText}</span>
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Nachweis: {frischeText}</p>
      {check.status !== 'disabled' ? <p className="mt-1 text-xs text-muted-foreground">{check.summary}</p> : null}
    </li>
  )
}

function OpsKarte({ item }: { item: ProviderOpsBoardItem }) {
  const statusText = statusLabel(item.status, item.id)
  const frischeText = FRESHNESS_LABEL[item.freshness.state]
  const claim = sichtbarerKartenClaim(item)
  const beschriftung = `${claim}, ${frischeText}`
  const gruen = providerOpsKarteIstGruen(item)

  return (
    <article
      className="min-w-0 rounded-2xl border border-border bg-card px-4 pt-4 sm:px-5"
      aria-label={beschriftung}
      data-ops-id={item.id}
      data-ops-status={item.status}
      data-ops-freshness={item.freshness.state}
      data-ops-green={gruen ? 'true' : 'false'}
      data-ops-claim={claim}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
        <div className="min-w-0">
          {item.id === 'kill-switch' || item.id === 'cost-guard' ? <p className="mb-1 text-xs text-muted-foreground">Technische Grundlage</p> : null}
          <h3 className="text-base font-semibold">{item.id === 'provider-ops' ? 'Provider-Bereiche' : item.id === 'kill-switch' ? 'Notabschaltung' : item.id === 'cost-guard' ? 'Kostenbegrenzung' : item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{kurztext(item)}</p>
        </div>
        <p className={cn('rounded-md border px-2 py-1 text-xs font-medium', statusKlassen(item))}>
          <span>{statusText}</span>
        </p>
      </div>
      {item.id === 'model-usage' ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Gelesener Ausschnitt: letzte 30 Tage · höchstens 200 Einträge
          {item.status === 'available' && item.metadata?.zeilen ? <span className="mt-2 block text-sm font-medium text-foreground">{item.metadata.zeilen} aufgezeichnete Einträge</span> : null}
        </p>
      ) : null}
      {item.checks?.length ? (
        <ul className="mb-3 grid gap-x-6 border-t sm:grid-cols-2" aria-label={`Teilprüfungen ${item.name}`}>
          {item.checks.map((teil) => (
            <CheckZeile key={teil.id} check={teil} />
          ))}
        </ul>
      ) : null}
      <p className="mb-3 text-xs text-muted-foreground">
        Geprüft {new Date(item.checkedAt).toLocaleString('de-CH')} · Nachweis {frischeText}
      </p>
      <OperationsEvidence item={item} />
    </article>
  )
}

export default function ProviderOpsBoard({
  anfang,
  endpunkt = PROVIDER_OPS_BOARD_API_PFAD,
  aktualisierenErlaubt = true,
}: {
  anfang: ProviderOpsBoardBericht
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
        throw new Error(json?.message || json?.error || 'Provider-Ops konnte nicht gelesen werden.')
      }
      setBericht(json as ProviderOpsBoardBericht)
    } catch (error) {
      setFehler(error instanceof Error ? error.message : 'Provider-Ops konnte nicht gelesen werden.')
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="mr-2 rounded-md border bg-card px-2 py-1 text-xs">Read-only</span>
          Geprüft {new Date(bericht.checkedAt).toLocaleString('de-CH')}
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
          {fehler} Angezeigt bleibt der vorherige Prüfstand.
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">Kostenabdeckung unvollständig · Kein vollständiges Ausgabenbild und kein globales Budget.</p>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        {bericht.items.filter(item => item.id === 'model-usage').map(item => <OpsKarte key={item.id} item={item} />)}
        <div className="space-y-4 xl:row-span-3">
          {bericht.items.filter(item => item.id === 'provider-ops').map(item => <OpsKarte key={item.id} item={item} />)}
        </div>
        {bericht.items.filter(item => item.id !== 'model-usage' && item.id !== 'provider-ops').map(item => <OpsKarte key={item.id} item={item} />)}
      </div>
    </div>
  )
}
