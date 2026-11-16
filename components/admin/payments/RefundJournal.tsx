'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import type { Fehler } from '@/lib/admin/ladezustand'
import {
  appendRefundJournalPage, parseRefundJournalPage, parseRefundJournalQuery, refundJournalAmount,
  refundJournalFilter, refundJournalTime, refundJournalUrl, type RefundJournalPage,
} from '@/lib/admin/payments/refund-journal'
import { usePaymentRead } from './usePaymentRead'

const buttonClass = 'h-auto min-h-11 min-w-0 max-w-full whitespace-normal transition-colors pointer-fine:h-auto pointer-fine:min-h-11 [&>span:last-child]:min-w-0 [&>span:last-child]:break-words'

export default function RefundJournal({ onDenied }: { onDenied: () => void }) {
  const [draft, setDraft] = useState('')
  const [applied, setApplied] = useState('')
  const [snapshot, setSnapshot] = useState<RefundJournalPage | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Fehler | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [retry, setRetry] = useState<{ filter: string; previous: RefundJournalPage | null } | null>(null)
  const reading = useRef(false)
  const read = usePaymentRead(onDenied)

  const load = useCallback(async (filter: string, previous: RefundJournalPage | null = null) => {
    // A ref closes the same-event double-click gap before disabled is rendered.
    if (previous && reading.current) return
    reading.current = true
    setBusy(true); setError(null); setRetry({ filter, previous })
    const url = refundJournalUrl(filter, previous?.next_cursor ?? null)
    const query = parseRefundJournalQuery(new URL(url, 'https://journal.invalid').searchParams)
    const result = await read(url, body => parseRefundJournalPage(body, query))
    if (!result) return
    reading.current = false
    setBusy(false)
    if (result.fehler) { setError(result.fehler); return }
    try { setSnapshot(previous ? appendRefundJournalPage(previous, result.daten) : result.daten) }
    catch { setError({ meldung: 'Die Folgeseite passt nicht zur angezeigten Liste. Bitte aktualisieren.', wiederholbar: false }) }
  }, [read])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load('') }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  function apply(value: string) {
    let filter: string
    try { filter = refundJournalFilter(value) }
    catch (failure) {
      setFormError(failure instanceof Error ? failure.message : 'Die Zahlungs-ID ist ungültig.')
      return
    }
    setFormError(null)
    setDraft(filter)
    if (filter !== applied) setSnapshot(null)
    setApplied(filter)
    void load(filter)
  }

  return (
    <section aria-labelledby="refund-journal-title" className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 [overflow-wrap:anywhere] sm:p-5">
      <div>
        <h2 id="refund-journal-title" className="text-lg font-semibold">Gespeicherte Erstattungsnotizen</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lokale Einträge, neueste zuerst. Eine Notiz bestätigt keine Geldbewegung beim Zahlungsanbieter.</p>
      </div>
      <form onSubmit={event => { event.preventDefault(); apply(draft) }} className="flex min-w-0 flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-60 text-sm">
          <Input label="Exakte Zahlungs-ID" value={draft} fieldSize="lg" error={formError ?? undefined}
            onChange={event => { setDraft(event.target.value); setFormError(null) }} placeholder="Alle Zahlungen"
            containerClassName={formError ? 'min-w-0' : 'min-w-0 [&>div:last-child]:hidden'} />
        </div>
        <Button type="submit" className={buttonClass}>Filtern</Button>
        <Button type="button" variant="outline" className={buttonClass} onClick={() => apply('')}>Zurücksetzen</Button>
        <Button type="button" variant="outline" className={buttonClass} onClick={() => { void load(applied) }}>Journal aktualisieren</Button>
      </form>
      <div className="min-w-0 break-words text-sm text-muted-foreground" aria-live="polite">
        <p>Angewendeter Filter: {applied ? <span className="break-all font-medium text-foreground">{applied}</span> : 'Alle Zahlungen'}</p>
        {draft.trim() !== applied && <p>Die Eingabe ist noch nicht angewendet. Weitere Seiten gehören zum angezeigten Filter.</p>}
        {snapshot && <p>{snapshot.rows.length} Notizen geladen · zuletzt <time dateTime={snapshot.loaded_at}>{refundJournalTime(snapshot.loaded_at)}</time></p>}
      </div>
      {error && <div className="min-w-0 space-y-3">
        <Fehlerflaeche fehler={error} veraltet={snapshot !== null} className="min-w-0 [&_div]:min-w-0 [&_p]:[overflow-wrap:anywhere]" />
        {error.wiederholbar && retry && <Button variant="outline" type="button" disabled={busy} className={buttonClass}
          onClick={() => { void load(retry.filter, retry.previous) }}>Erneut versuchen</Button>}
      </div>}
      {busy && <p role="status" className="text-sm">Erstattungsnotizen werden geladen …</p>}
      {!snapshot && !error && !busy && <p role="status" className="text-sm">Erstattungsnotizen werden vorbereitet …</p>}
      {snapshot?.rows.length === 0 && !error && <p role="status" className="rounded-xl bg-muted p-4 text-sm">{applied ? 'Keine Erstattungsnotizen für diese Zahlungs-ID gefunden.' : 'Keine Erstattungsnotizen vorhanden.'}</p>}
      {snapshot && snapshot.rows.length > 0 && <ol aria-label="Gespeicherte Notizen" className="space-y-3">
        {snapshot.rows.map(row => {
          const amount = refundJournalAmount(row.amount_chf)
          return <li key={row.id} className="min-w-0 rounded-xl border border-border p-3 sm:p-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 break-all font-semibold tabular-nums">{amount.text}</p>
              <time dateTime={row.created_at} title={row.created_at} className="text-sm text-muted-foreground">{refundJournalTime(row.created_at)}</time>
            </div>
            {!amount.valid && <p className="mt-1 text-sm text-destructive">Gespeicherten Betrag prüfen: kein gültiger positiver Rappenbetrag. Der Originalwert wird unverändert gezeigt.</p>}
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Zahlungs-ID</dt><dd className="break-all font-mono">{row.payment_id}</dd></div>
              <div><dt className="text-muted-foreground">Notiz-ID</dt><dd className="break-all font-mono">{row.id}</dd></div>
              <div><dt className="text-muted-foreground">Grund</dt><dd className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{row.reason?.trim() ? row.reason : 'Kein Grund angegeben.'}</dd></div>
            </dl>
          </li>
        })}
      </ol>}
      {snapshot?.next_cursor && <Button type="button" variant="outline" disabled={busy} className={buttonClass}
        onClick={() => { void load(applied, snapshot) }}>Weitere Notizen laden</Button>}
      <p className="text-xs text-muted-foreground">Diese Liste enthält gespeicherte Notizen. Aus einer geladenen Seite lassen sich kein Restbetrag und kein vollständiger Erstattungsstatus ableiten. Neue Einträge erscheinen nach dem Aktualisieren.</p>
    </section>
  )
}
