'use client'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ExternalLink, Loader2, Search, X } from 'lucide-react'
import LandFeld from '@/components/country/LandFeld'
import DiscoverCarsSuche from '@/components/trips/DiscoverCarsSuche'
import { DISCOVERCARS_GENERISCH_HREF } from '@/lib/providers/discovercars/affiliate/ziel'
import { offersForView, SEARCH_CURRENCIES, searchInput, type RentalResults, type RentalStation, type RentalOffer } from '@/lib/providers/discovercars/search/contract'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import type { Trip } from '@/types/trips'
import StationField from './StationField'
import { OfferCard, OfferComparison, OfferDetails } from './Offers'
import { BUTTON, CATEGORY, FIELD, PRIMARY, rentalRequest } from './client'

export default function DiscoverCarsMietwagen({ reise }: { reise: Trip }) {
  const id = useId()
  const [pickup, setPickup] = useState<RentalStation | null>(null)
  const [dropoff, setDropoff] = useState<RentalStation | null>(null)
  const [pickupQuery, setPickupQuery] = useState('')
  const [dropoffQuery, setDropoffQuery] = useState('')
  const [oneWay, setOneWay] = useState(false)
  const [pickupDate, setPickupDate] = useState(reise.startDate ?? '')
  const [dropoffDate, setDropoffDate] = useState(reise.endDate ?? '')
  const [pickupTime, setPickupTime] = useState('')
  const [dropoffTime, setDropoffTime] = useState('')
  const [age, setAge] = useState('')
  const [residence, setResidence] = useState('')
  const [currency, setCurrency] = useState<string>((SEARCH_CURRENCIES as readonly string[]).includes(reise.currency) ? reise.currency : 'CHF')
  const [result, setResult] = useState<RentalResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [transmission, setTransmission] = useState('')
  const [category, setCategory] = useState('')
  const [order, setOrder] = useState('price')
  const [limit, setLimit] = useState(12)
  const [compare, setCompare] = useState<string[]>([])
  const [selected, setSelected] = useState<RentalOffer | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailMessage, setDetailMessage] = useState('')
  const [now, setNow] = useState(0)
  const request = useRef<AbortController | null>(null)
  const detailRequest = useRef<AbortController | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const expired = !!result && now >= result.expiresAt

  useEffect(() => {
    return () => { request.current?.abort(); detailRequest.current?.abort() }
  }, [])
  useEffect(() => {
    if (!result) return
    const checkExpiry = () => setNow(Date.now())
    const timer = setTimeout(checkExpiry, Math.max(0, result.expiresAt - Date.now()))
    window.addEventListener('focus', checkExpiry)
    document.addEventListener('visibilitychange', checkExpiry)
    return () => { clearTimeout(timer); window.removeEventListener('focus', checkExpiry); document.removeEventListener('visibilitychange', checkExpiry) }
  }, [result])
  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal()
    if (!selected) dialog.current?.close()
  }, [selected])
  const close = () => { detailRequest.current?.abort(); setSelected(null); setDetailMessage('') }
  const invalidate = () => {
    request.current?.abort(); detailRequest.current?.abort(); setLoading(false); setResult(null)
    setCompare([]); setSelected(null); setMessage(''); setUnavailable(false); setLimit(12)
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); invalidate()
    if (!pickup || (oneWay && !dropoff)) { setMessage('Bitte wähle die Abholstation und gegebenenfalls die Rückgabestation aus den Ortsvorschlägen.'); return }
    const input = searchInput.safeParse({ pickup, dropoff: oneWay ? dropoff : null, pickupDate, pickupTime, dropoffDate, dropoffTime, age: Number(age), residence, currency })
    if (!input.success) { setMessage('Bitte prüfe Mietdaten, Uhrzeiten, Fahreralter (18–99 Jahre) und Wohnsitzland. Die Rückgabe muss nach der Abholung liegen.'); return }
    const controller = new AbortController(); request.current = controller; setLoading(true)
    try {
      const data = await rentalRequest({ action: 'search', search: input.data }, controller.signal)
      if (controller.signal.aborted) return
      if (data.status === 'ok' && data.kind === 'search') {
        setResult(data.result); setNow(Date.now()); setCategory(''); setTransmission(''); setOrder('price')
        requestAnimationFrame(() => resultHeading.current?.focus({ preventScroll: true }))
      } else if (data.status !== 'ok') { setMessage(data.message); setUnavailable(data.status === 'unavailable') }
    } catch { if (!controller.signal.aborted) setMessage('Die Verbindung wurde unterbrochen. Bitte versuche die Suche erneut.') }
    finally { if (!controller.signal.aborted) setLoading(false) }
  }
  const handleOfferDetails = useCallback(async (offer: RentalOffer) => {
    if (!result || Date.now() >= result.expiresAt) { setNow(Date.now()); return }
    detailRequest.current?.abort(); const controller = new AbortController(); detailRequest.current = controller
    setSelected(offer); setDetailLoading(true); setDetailMessage('')
    try {
      const data = await rentalRequest({ action: 'detail', token: offer.token }, controller.signal)
      if (controller.signal.aborted) return
      if (data.status === 'ok' && data.kind === 'detail') {
        setSelected(data.offer)
        setResult(r => r ? { ...r, offers: r.offers.map(o => o.offer_id === data.offer.offer_id ? data.offer : o) } : null)
      } else if (data.status !== 'ok') setDetailMessage(data.message)
    } catch { if (!controller.signal.aborted) setDetailMessage('Die Fahrzeugdetails konnten nicht geladen werden. Bitte versuche es erneut.') }
    finally { if (!controller.signal.aborted) setDetailLoading(false) }
  }, [result])
  const visible = result ? offersForView(result.offers, transmission, category, order) : []
  const comparison = result?.offers.filter(o => compare.includes(o.offer_id)) ?? []
  const categories = [...new Set(result?.offers.map(o => o.car.category).filter((c): c is string => !!c) ?? [])]
  return <section aria-label="Mietwagen suchen und vergleichen" data-discovercars-native="1" className={ORGANISIEREN_FLAECHE_KLASSE}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Passend zu deiner Reise</p>
    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-brand-800">Dein Mietwagen. Hier im Vergleich.</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-800">Finde Fahrzeuge, vergleiche Gesamtpreise und prüfe die Mietbedingungen direkt in Jetnity. Dein ausgewähltes Angebot buchst du anschliessend bei DiscoverCars.</p>
    <form onSubmit={submit} className="mt-6 grid min-w-0 gap-5" onChangeCapture={invalidate}>
      {reise.stages.length ? <div><p className="text-xs text-ink-600">Orte aus deiner Reise</p><div className="mt-2 flex flex-wrap gap-2">{reise.stages.map(s => <button key={s.id} type="button" className={BUTTON} onClick={() => { invalidate(); setPickup(null); setPickupQuery(s.name); setPickupDate(s.arrivalDate ?? reise.startDate ?? ''); setDropoffDate(s.departureDate ?? reise.endDate ?? '') }}>{s.name}</button>)}</div></div> : null}
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <StationField label="Abholstation" query={pickupQuery} value={pickup} onQuery={s => { invalidate(); setPickupQuery(s); setPickup(null) }} onSelect={s => { invalidate(); setPickup(s); setPickupQuery(s.name) }} />
        {oneWay ? <StationField label="Rückgabestation" query={dropoffQuery} value={dropoff} onQuery={s => { invalidate(); setDropoffQuery(s); setDropoff(null) }} onSelect={s => { invalidate(); setDropoff(s); setDropoffQuery(s.name) }} /> : <label className="flex min-h-11 items-center gap-2 text-sm text-brand-800"><input type="checkbox" checked={oneWay} onChange={e => setOneWay(e.target.checked)} className="h-4 w-4 accent-brand-800" />An einem anderen Ort zurückgeben</label>}
      </div>
      {oneWay ? <label className="flex min-h-11 items-center gap-2 text-sm text-brand-800"><input type="checkbox" checked={oneWay} onChange={e => setOneWay(e.target.checked)} className="h-4 w-4 accent-brand-800" />An einem anderen Ort zurückgeben</label> : null}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Abholdatum<input required type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={FIELD} /></label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Abholzeit<input required type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className={FIELD} /></label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Rückgabedatum<input required type="date" value={dropoffDate} min={pickupDate} onChange={e => setDropoffDate(e.target.value)} className={FIELD} /></label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Rückgabezeit<input required type="time" value={dropoffTime} onChange={e => setDropoffTime(e.target.value)} className={FIELD} /></label>
      </div>
      <p className="-mt-2 text-xs leading-5 text-ink-600">Reisedaten sind als Vorschlag übernommen. Bitte prüfe deinen Mietzeitraum. Uhrzeiten gelten am jeweiligen Abhol- und Rückgabeort.</p>
      <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <LandFeld label="Wohnsitzland des Fahrers" value={residence} onChange={v => { invalidate(); setResidence(v) }} optional={false} />
        <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Alter des Fahrers<input required type="number" inputMode="numeric" min={18} max={99} value={age} onChange={e => setAge(e.target.value)} className={FIELD} /></label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Währung<select value={currency} onChange={e => setCurrency(e.target.value)} className={FIELD}>{SEARCH_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"><button type="submit" disabled={loading} className={PRIMARY}>{loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}{loading ? 'Mietwagen werden gesucht …' : 'Mietwagen vergleichen'}</button><p className="max-w-xl text-xs leading-5 text-ink-600">Für die Suche übermittelt Jetnity die ausgewählten Suchangaben an DiscoverCars. Deine gespeicherte Reise bleibt in Jetnity.</p></div>
    </form>
    {loading ? <p role="status" className="mt-4 text-sm text-ink-800">Verfügbare Fahrzeuge und aktuelle Preise werden abgefragt. Das kann einige Sekunden dauern.</p> : null}
    {message ? <p role="alert" className="mt-4 rounded-2xl bg-surface-50 p-4 text-sm text-brand-800">{message}</p> : null}
    {unavailable ? <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-brand-800">Alternatives Suchformular öffnen</summary><DiscoverCarsSuche /></details> : null}
    {result ? <div className="mt-8 grid min-w-0 gap-5" aria-busy={loading}>
      <div><h3 ref={resultHeading} tabIndex={-1} className="text-xl font-semibold text-brand-800 focus:outline-none">{result.offers.length ? `${result.offers.length} Mietwagenangebote` : 'Keine Mietwagen für diese Suche'}</h3><p className="mt-1 text-sm text-ink-800">{pickup?.name} · {pickupDate} {pickupTime} – {dropoffDate} {dropoffTime}{oneWay ? ` · Rückgabe: ${dropoff?.name}` : ''}</p><p className="mt-1 text-xs text-ink-600">Preise für den gesamten Mietzeitraum · abgefragt um {new Date(result.searchedAt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} · Angebote von DiscoverCars</p></div>
      {expired ? <p role="status" className="rounded-2xl bg-surface-50 p-4 text-sm text-brand-800">Diese Suche ist abgelaufen. Starte „Mietwagen vergleichen“ erneut, um aktuelle Preise und Verfügbarkeit zu erhalten.</p> : null}
      {result.omitted > 0 ? <p className="text-sm text-ink-600">Einige unvollständige Angebote konnten nicht angezeigt werden.</p> : null}
      {!result.offers.length ? <p className="text-sm text-ink-800">Versuche eine andere Station oder einen anderen Mietzeitraum.</p> : <>
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <label className="grid min-w-0 gap-1 text-sm text-brand-800">Getriebe<select className={FIELD} value={transmission} onChange={e => { setTransmission(e.target.value); setLimit(12) }}><option value="">Alle</option><option value="automatic">Automatik</option><option value="manual">Schaltung</option></select></label>
          <label className="grid min-w-0 gap-1 text-sm text-brand-800">Fahrzeugklasse<select className={FIELD} value={category} onChange={e => { setCategory(e.target.value); setLimit(12) }}><option value="">Alle</option>{categories.map(c => <option key={c} value={c}>{CATEGORY[c] ?? c}</option>)}</select></label>
          <label className="grid min-w-0 gap-1 text-sm text-brand-800">Sortieren<select className={FIELD} value={order} onChange={e => setOrder(e.target.value)}><option value="price">Niedrigster Gesamtpreis</option><option value="rating">Beste Vermieterbewertung</option></select></label>
        </div>
        {comparison.length ? <OfferComparison offers={comparison} onClose={() => setCompare([])} /> : null}
        <p role="status" className="text-sm text-ink-600">{visible.length} passende Angebote · bis zu drei Fahrzeuge vergleichen</p>
        {!visible.length ? <p className="text-sm text-ink-800">Zu diesen Filtern gibt es keine Treffer. Ändere Getriebe oder Fahrzeugklasse.</p> : null}
        {visible.slice(0, limit).map(o => <OfferCard key={o.offer_id} offer={o} selected={compare.includes(o.offer_id)} expired={expired} onDetails={() => void handleOfferDetails(o)} onCompare={() => setCompare(ids => ids.includes(o.offer_id) ? ids.filter(x => x !== o.offer_id) : ids.length < 3 ? [...ids, o.offer_id] : ids)} />)}
        {compare.length === 3 ? <p role="status" className="text-sm text-ink-600">Drei Fahrzeuge sind ausgewählt. Entferne eines, um ein anderes hinzuzufügen.</p> : null}
        {visible.length > limit ? <button type="button" className={`${BUTTON} justify-self-start`} onClick={() => setLimit(x => x + 12)}>Weitere Angebote anzeigen ({visible.length - limit})</button> : null}
      </>}
    </div> : null}
    <div className="mt-6 border-t border-line-200 pt-4"><a href={DISCOVERCARS_GENERISCH_HREF} target="_blank" rel="noopener noreferrer sponsored" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-800 underline underline-offset-4">Direkt bei DiscoverCars suchen<ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only">, neuer Tab</span></a><p className="text-xs leading-5 text-ink-600">Partnerangebot: Jetnity kann bei einer Buchung eine Provision erhalten.</p></div>
    <dialog ref={dialog} aria-labelledby={`${id}-detail-title`} onCancel={close} onKeyDown={e => { if (e.key === 'Escape') e.stopPropagation() }} onClick={e => { if (e.target === e.currentTarget) close() }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl border border-line-200 bg-white p-0 backdrop:bg-brand-950/50">
      {selected ? <div className="p-5 sm:p-8"><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-sm text-ink-600">{selected.supplier?.name}</p><h3 id={`${id}-detail-title`} className="text-2xl font-semibold text-brand-800">{selected.car.name}</h3>{selected.guaranteed_model !== true ? <p className="text-sm text-ink-600">oder ähnliches Modell</p> : null}</div><button type="button" onClick={close} className={BUTTON} aria-label="Fahrzeugdetails schliessen"><X className="h-5 w-5" aria-hidden="true" /></button></div>
        {detailLoading ? <p role="status" className="flex items-center gap-2 py-6 text-brand-800"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />Fahrzeugdetails werden geladen …</p> : detailMessage ? <div role="alert"><p className="text-sm text-ink-800">{detailMessage}</p><button type="button" className={`${BUTTON} mt-3`} onClick={() => void handleOfferDetails(selected)}>Erneut versuchen</button></div> : <OfferDetails offer={selected} expired={expired} expiresAt={result?.expiresAt ?? 0} onExpired={() => setNow(Date.now())} />}
      </div> : null}
    </dialog>
  </section>
}
