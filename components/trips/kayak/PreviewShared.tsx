'use client'

import * as React from 'react'
import { FlaskConical, Loader2, Search } from 'lucide-react'
import type { KayakPreview, KayakSearch } from '@/lib/providers/kayak/contract'
import { ORGANISIEREN_PRIMAR_KLASSE } from '@/lib/trips/organize-premium-experience-6'

export function PreviewNotice() {
  return <div className="flex gap-3 rounded-2xl border border-line-200 bg-surface-25 p-4 text-sm leading-6 text-ink-800">
    <FlaskConical className="mt-1 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
    <div><p className="font-semibold text-brand-800">KAYAK · Testvorschau</p><p>Entdecke die neue Suche mit Beispieldaten. Orte, Termine und Preise der Ergebnisse können von deiner Suche abweichen. Diese Angebote sind nicht buchbar und werden nicht in deiner Reise gespeichert.</p></div>
  </div>
}

export function useKayakPreview() {
  const [data, setData] = React.useState<KayakPreview | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const controller = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => controller.current?.abort(), [])
  const reset = React.useCallback(() => {
    controller.current?.abort(); controller.current = null
    setData(null); setError(''); setBusy(false)
  }, [])
  async function search(input: KayakSearch) {
    controller.current?.abort()
    const current = new AbortController(); controller.current = current
    setData(null); setError(''); setBusy(true)
    try {
      const response = await fetch('/api/kayak/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: current.signal })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Die Testsuche ist gerade nicht verfügbar.')
      if (result.mode !== 'sandbox' || result.kind !== input.kind || !Array.isArray(result.hotels) || !Array.isArray(result.flights)) throw new Error('Die Testantwort konnte nicht gelesen werden.')
      if (controller.current === current) setData(result)
    } catch (failure) {
      if (!current.signal.aborted) setError(failure instanceof Error ? failure.message : 'Bitte versuche es später erneut.')
    } finally { if (controller.current === current) { controller.current = null; setBusy(false) } }
  }
  return { data, busy, error, search, reset, setError }
}

export function PreviewSearchButton({ busy }: { busy: boolean }) {
  return <button type="submit" disabled={busy} className={ORGANISIEREN_PRIMAR_KLASSE}>
    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
    {busy ? 'Testangebote werden geladen …' : 'Testangebote ansehen'}
  </button>
}

export function PreviewFeedback({ busy, error, complete }: { busy: boolean; error: string; complete?: boolean }) {
  return <div aria-live="polite" aria-atomic="true" className="text-sm leading-6 text-ink-800">
    {busy && <p className="mt-4">KAYAK stellt die Vorschau zusammen. Das kann einige Sekunden dauern.</p>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-line-200 bg-surface-25 p-4">{error}</p>}
    {complete === false && <p className="mt-4">Die Testsuche ist noch nicht vollständig. Du siehst den bisher gelieferten Stand und kannst die Suche erneut starten.</p>}
  </div>
}

export function previewMoney(price: number | null, currency: string) {
  if (price === null || !currency) return 'Preis nicht verfügbar'
  try { return new Intl.NumberFormat('de-CH', { style: 'currency', currency }).format(price) } catch { return 'Preis nicht verfügbar' }
}

export function ExistingSearch({ children, label }: { children: React.ReactNode; label: string }) {
  const [open, setOpen] = React.useState(false)
  return <div className="rounded-2xl border border-line-200 bg-white p-4">
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="min-h-11 w-full text-left text-sm font-semibold text-brand-800">{label} <span aria-hidden="true">{open ? '−' : '+'}</span></button>
    {open && <div className="mt-4">{children}</div>}
  </div>
}
