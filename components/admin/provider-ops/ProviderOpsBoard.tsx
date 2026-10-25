'use client'

import { useCallback } from 'react'
import {
  FRESHNESS_LABEL,
  PROVIDER_OPS_BOARD_API_PFAD,
  PROVIDER_OPS_BOARD_STATUS_LABEL,
  providerOpsKarteIstGruen,
  sichtbarerKartenClaim,
  wendeEvidenceAlterAn,
  type ProviderOpsBoardBericht,
  type ProviderOpsBoardCheck,
  type ProviderOpsBoardItem,
} from '@/lib/admin/provider-ops-board'
import { deuteProviderOps } from '@/lib/admin/operations-report-validation'
import OperationsEvidence from '@/components/admin/OperationsEvidence'
import { HISTORISCHER_SATZ, useOperationsReport, type OperationsHinweis } from '@/components/admin/operations/useOperationsReport'
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

function alterWert(ageMs: number | null): string {
  return ageMs === null ? '' : String(ageMs)
}

function CheckZeile({ check, checkedAt }: { check: ProviderOpsBoardCheck; checkedAt: string }) {
  const statusText = statusLabel(check.status, check.id)
  const frischeText = FRESHNESS_LABEL[check.freshness.state]
  return (
    <li
      className="min-w-0 break-words border-b border-border px-1 py-3 last:border-b-0"
      data-ops-check={check.id}
      data-ops-status={check.status}
      data-ops-freshness={check.freshness.state}
      data-ops-age-ms={alterWert(check.freshness.ageMs)}
      data-ops-checked-at={checkedAt}
      data-ops-green={providerOpsKarteIstGruen(check) ? 'true' : 'false'}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-medium">{check.name}</p>
        <p className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', statusKlassen(check))}>
          <span>{statusText}</span>
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Nachweis: {frischeText}</p>
      {check.status !== 'disabled' ? <p className="mt-1 break-words text-xs text-muted-foreground">{check.summary}</p> : null}
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
      className="min-w-0 break-words rounded-2xl border border-border bg-card px-4 pt-4 sm:px-5"
      aria-label={beschriftung}
      data-ops-id={item.id}
      data-ops-status={item.status}
      data-ops-freshness={item.freshness.state}
      data-ops-age-ms={alterWert(item.freshness.ageMs)}
      data-ops-checked-at={item.checkedAt}
      data-ops-green={gruen ? 'true' : 'false'}
      data-ops-claim={claim}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 pb-3">
        <div className="min-w-0 break-words">
          {item.id === 'kill-switch' || item.id === 'cost-guard' ? <p className="mb-1 text-xs text-muted-foreground">Technische Grundlage</p> : null}
          <h3 className="break-words text-base font-semibold">{item.id === 'provider-ops' ? 'Provider-Bereiche' : item.id === 'kill-switch' ? 'Notabschaltung' : item.id === 'cost-guard' ? 'Kostenbegrenzung' : item.name}</h3>
          <p className="mt-1 break-words text-sm text-muted-foreground">{kurztext(item)}</p>
        </div>
        <p className={cn('rounded-md border px-2 py-1 text-xs font-medium', statusKlassen(item))}>
          <span>{statusText}</span>
        </p>
      </div>
      {item.id === 'model-usage' ? (
        <p className="mb-3 break-words text-xs text-muted-foreground">
          Gelesener Ausschnitt: letzte 30 Tage · höchstens 200 Einträge
          {item.status === 'available' && item.metadata?.zeilen ? <span className="mt-2 block text-sm font-medium text-foreground">{item.metadata.zeilen} aufgezeichnete Einträge</span> : null}
        </p>
      ) : null}
      {item.checks?.length ? (
        <ul className="mb-3 grid min-w-0 gap-x-6 border-t sm:grid-cols-2" aria-label={`Teilprüfungen ${item.name}`}>
          {item.checks.map((teil) => (
            <CheckZeile key={teil.id} check={teil} checkedAt={item.checkedAt} />
          ))}
        </ul>
      ) : null}
      <p className="mb-3 break-words text-xs text-muted-foreground">
        Geprüft {new Date(item.checkedAt).toLocaleString('de-CH')} · Nachweis {frischeText}
      </p>
      <div className="min-w-0 break-words">
        <OperationsEvidence item={item} />
      </div>
    </article>
  )
}

export function ProviderOpsAnsicht({ bericht }: { bericht: ProviderOpsBoardBericht }) {
  return (
    <>
      <p className="break-words text-sm text-muted-foreground">Kostenabdeckung unvollständig · Kein vollständiges Ausgabenbild und kein globales Budget.</p>
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        {bericht.items.filter((item) => item.id === 'model-usage').map((item) => <OpsKarte key={item.id} item={item} />)}
        <div className="min-w-0 space-y-4 xl:row-span-3">
          {bericht.items.filter((item) => item.id === 'provider-ops').map((item) => <OpsKarte key={item.id} item={item} />)}
        </div>
        {bericht.items.filter((item) => item.id !== 'model-usage' && item.id !== 'provider-ops').map((item) => <OpsKarte key={item.id} item={item} />)}
      </div>
    </>
  )
}

function hinweis(bericht: ProviderOpsBoardBericht, wand: number): OperationsHinweis[] {
  return bericht.items.map((item) => {
    const gewendet = wendeEvidenceAlterAn(item, wand)
    const checks = gewendet.checks ?? []
    return {
      id: item.id,
      state: gewendet.freshness.state,
      ageMs: gewendet.freshness.ageMs,
      checks: (item.checks ?? []).map((check, index) => ({
        id: check.id,
        state: checks[index]?.freshness.state ?? check.freshness.state,
        ageMs: checks[index]?.freshness.ageMs ?? check.freshness.ageMs,
      })),
    }
  })
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
  const deute = useCallback((wert: unknown) => deuteProviderOps(wert), [])
  const { phase, pending, meldung, anzeige, erneut } = useOperationsReport({
    anfang,
    endpunkt,
    aktualisierenErlaubt,
    deute,
    hinweis,
  })

  return (
    <section
      className="min-w-0 space-y-4 break-words"
      data-operations-phase={phase}
      data-operations-endpoint={endpunkt}
      data-operations-pending={pending ? 'true' : 'false'}
      aria-busy={pending}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 break-words text-sm text-muted-foreground">
          <span className="mr-2 rounded-md border bg-card px-2 py-1 text-xs">Read-only</span>
          {anzeige ? `Geprüft ${new Date(anzeige.checkedAt).toLocaleString('de-CH')}` : phase === 'prueft' ? 'Prüfung wird gelesen.' : 'Kein bestätigter Prüfstand.'}
        </p>
        {aktualisierenErlaubt ? (
          <button
            type="button"
            onClick={erneut}
            disabled={pending}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            {pending ? 'Aktualisiert…' : 'Erneut prüfen'}
          </button>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">{pending ? 'Aktualisiert…' : ''}</p>
      {meldung && phase !== 'aktuell' && phase !== 'prueft' ? (
        <p
          role="alert"
          className="break-words rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
        >
          {meldung}
        </p>
      ) : null}
      {phase === 'historisch' ? <p>{HISTORISCHER_SATZ}</p> : null}
      {anzeige ? <ProviderOpsAnsicht bericht={anzeige} /> : null}
    </section>
  )
}
