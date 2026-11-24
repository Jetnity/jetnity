'use client'

import * as React from 'react'
import { manuelleAenderungRueckgaengig } from '@/lib/reiseaenderung/aktionen'
import { gastManuellRueckgaengig } from '@/lib/reiseaenderung/direct/gast'
import { rueckgabePlanen, RUECKNAHME_FRIST_MS } from '@/lib/reiseaenderung/direct/rueckgaengig'
import type { Trip, TripSource } from '@/types/trips'

const taste = 'min-h-11 rounded-full border border-line-300 px-4 py-2 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50'

/**
 * Short-lived, explicit second action after a confirmed trip edit.
 * No implicit rollback and no claim about provider/real booking state.
 */
export default function ReiseAenderungRuecknahme({ vorher, nachher, quelle, onGespeichert, onBeschaeftigt }: {
  vorher: Trip
  nachher: Trip
  quelle: TripSource
  onGespeichert: (graph: Trip) => void
  onBeschaeftigt?: (busy: boolean) => void
}) {
  // Deterministic across SSR/hydration and explicit retries. The mutation ID
  // still binds the trip, revision, exact last mutation and both graph hashes.
  const seed = '00000000-0000-4000-8000-000000000000'
  const [bestaetigen, setBestaetigen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [ungewiss, setUngewiss] = React.useState(false)
  const [fertig, setFertig] = React.useState(false)
  const [meldung, setMeldung] = React.useState('')
  const [fristOffen, setFristOffen] = React.useState(() => Date.now() - Date.parse(nachher.updatedAt) <= RUECKNAHME_FRIST_MS)
  const alive = React.useRef(true)
  const schreibt = React.useRef(false)
  const moeglich = React.useMemo(() => rueckgabePlanen(vorher, nachher, quelle, seed), [vorher, nachher, quelle, seed])

  React.useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  React.useEffect(() => {
    const ende = Date.parse(nachher.updatedAt) + RUECKNAHME_FRIST_MS
    const rest = ende - Date.now()
    if (!Number.isFinite(rest) || rest <= 0) { setFristOffen(false); return }
    const ablauf = window.setTimeout(() => { if (alive.current) setFristOffen(false) }, rest)
    return () => window.clearTimeout(ablauf)
  }, [nachher.updatedAt])
  React.useEffect(() => {
    if (meldung) document.querySelector<HTMLElement>('[data-w2-ruecknahme-meldung]')?.focus()
  }, [meldung])

  const ausfuehren = async (nurPruefen = false) => {
    if (!moeglich.ok || schreibt.current || fertig || (!fristOffen && !ungewiss)) return
    schreibt.current = true
    setPending(true)
    onBeschaeftigt?.(true)
    setMeldung('')
    try {
      const anfrage = { vorher, nachher, seed, nurPruefen }
      const ergebnis = quelle === 'guest'
        ? await gastManuellRueckgaengig(anfrage)
        : await manuelleAenderungRueckgaengig(anfrage)
      if (!alive.current) return
      if (!ergebnis.ok) {
        setUngewiss(ergebnis.art === 'ungewiss')
        setMeldung(ergebnis.meldung)
        return
      }
      setUngewiss(false)
      setBestaetigen(false)
      setFertig(true)
      onGespeichert(ergebnis.reise)
    } catch {
      if (alive.current) {
        setUngewiss(true)
        setMeldung('Das Ergebnis ist noch unklar. Bitte prüfe, ob deine Reise bereits zurückgesetzt wurde.')
      }
    } finally {
      schreibt.current = false
      if (alive.current) { setPending(false); onBeschaeftigt?.(false) }
    }
  }

  return <section aria-label="Letzte Änderung rückgängig machen" data-w2-ruecknahme="" className="mt-4 grid gap-3 rounded-2xl border border-line-200 bg-surface-25 p-4">
    {fertig ? <p role="status" className="font-semibold text-brand-800">Änderung rückgängig gemacht. Deine Reise wurde erneut gelesen und gespeichert.</p>
      : !moeglich.ok ? <p className="text-sm leading-6">{moeglich.meldung}</p>
      : !fristOffen && !ungewiss ? <p className="text-sm leading-6">Das kurze Zeitfenster für «Änderung rückgängig» ist vorbei. Deine Reise bleibt gespeichert.</p>
      : <>
        <p className="text-sm leading-6">Du kannst die letzte Änderung kurz nach dem Speichern zurücknehmen. Bereits gebuchte Leistungen oder Buchungen bei Anbietern werden nicht geändert.</p>
        {!bestaetigen && !ungewiss && <div><button type="button" className={taste} disabled={pending} onClick={() => setBestaetigen(true)}>Änderung rückgängig</button></div>}
        {bestaetigen && !ungewiss && <div className="grid gap-3 rounded-xl border border-line-300 bg-white p-3">
          <p className="text-sm font-medium">Möchtest du die letzte Änderung deiner Reise wirklich rückgängig machen? Externe Buchungen bleiben unverändert.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={taste + ' bg-brand-800 text-white'} disabled={pending} onClick={() => void ausfuehren()}>Ja, Änderung rückgängig machen</button>
            <button type="button" className={taste} disabled={pending} onClick={() => setBestaetigen(false)}>Abbrechen</button>
          </div>
        </div>}
        {ungewiss && <button type="button" className={taste} disabled={pending} onClick={() => void ausfuehren(true)}>Ergebnis erneut prüfen</button>}
      </>}
    {pending && <p role="status">Rücknahme wird geprüft …</p>}
    {meldung && <p role="alert" tabIndex={-1} data-w2-ruecknahme-meldung="" className="text-sm text-red-700">{meldung}</p>}
  </section>
}
