'use client'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Car, ExternalLink, Loader2, Search, X } from 'lucide-react'
import { SucheKnopf } from '@/components/trips/organisieren/Suchfelder'
import Suchkalender from '@/components/trips/organisieren/auswahl/Suchkalender'
import { useSuchbereichAktiv } from '@/components/trips/organisieren/SuchbereichKontext'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { hotelDaten } from '@/lib/trips/organisieren/katalog'
import LandFeld from '@/components/country/LandFeld'
import DiscoverCarsSuche from '@/components/trips/DiscoverCarsSuche'
import { DISCOVERCARS_GENERISCH_HREF } from '@/lib/providers/discovercars/affiliate/ziel'
import { offersForView, SEARCH_CURRENCIES, searchInput, type RentalResults, type RentalStation, type RentalOffer } from '@/lib/providers/discovercars/search/contract'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import type { Trip } from '@/types/trips'
import StationField from './StationField'
import RentalHeart from '@/components/saved-offers/RentalHeart'
import RentalHearts from '@/components/saved-offers/RentalHearts'
import { OfferCard, OfferComparison, OfferDetails } from './Offers'
import { BUTTON, CATEGORY, FIELD, PRIMARY, rentalDate, rentalRequest } from './client'

export default function DiscoverCarsMietwagen({ reise, zentral = false }: { reise: Trip; zentral?: boolean }) {
  const id = useId()
  const zeitraum = hotelDaten(reise, reise.stages[0])
  const [pickup, setPickup] = useState<RentalStation | null>(null)
  const [dropoff, setDropoff] = useState<RentalStation | null>(null)
  const [pickupQuery, setPickupQuery] = useState(zentral ? reise.stages[0]?.name ?? '' : '')
  const [dropoffQuery, setDropoffQuery] = useState('')
  const [oneWay, setOneWay] = useState(false)
  const [pickupDate, setPickupDate] = useState(zentral ? zeitraum.anreise : reise.startDate ?? '')
  const [dropoffDate, setDropoffDate] = useState(zentral ? zeitraum.abreise : reise.endDate ?? '')
  const [pickupTime, setPickupTime] = useState(zentral ? '10:00' : '')
  const [dropoffTime, setDropoffTime] = useState(zentral ? '10:00' : '')
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
  const aktiv = useSuchbereichAktiv()
  if (!aktiv && selected) setSelected(null)
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
    if (!aktiv) detailRequest.current?.abort()
  }, [aktiv])
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
  return <section aria-label="Mietwagen suchen und vergleichen" data-discovercars-native="1" className="grid min-w-0 gap-7">
    <div className={zentral ? 'org-form' : ORGANISIEREN_FLAECHE_KLASSE}>
      {zentral ? <form onSubmit={submit} onChangeCapture={invalidate}>
        <div className="org-formtop"><h2>Mietwagen suchen</h2><label className="org-check"><input type="checkbox" checked={oneWay} onChange={e => setOneWay(e.target.checked)}/> Andere Rückgabestation</label></div>
        <div className={'org-fields org-rentalfields ' + (oneWay ? 'org-four' : '')}>
          <div className="org-station"><StationField nurBeiFokus label="Abholstation" query={pickupQuery} value={pickup} onQuery={q=>{invalidate();setPickupQuery(q);setPickup(null)}} onSelect={s=>{invalidate();setPickup(s);setPickupQuery(s.name)}}/></div>
          {oneWay&&<div className="org-station"><StationField nurBeiFokus label="Rückgabestation" query={dropoffQuery} value={dropoff} onQuery={q=>{invalidate();setDropoffQuery(q);setDropoff(null)}} onSelect={s=>{invalidate();setDropoff(s);setDropoffQuery(s.name)}}/></div>}
          <Suchkalender start={pickupDate} ende={dropoffDate} startLabel="Abholung" endeLabel="Rückgabe"
            min={heutigesDatum()} max="9999-12-31" minTage={0} maxTage={365} dauerAnzeigen={false} kontext="Dein Mietzeitraum"
            setzen={(start, ende) => { invalidate(); setPickupDate(start); setDropoffDate(ende) }} />
          <SucheKnopf busy={loading}/>
        </div>
        <div className="org-sub org-rentalsub">
          <label>Abholzeit <input required type="time" value={pickupTime} onChange={e=>setPickupTime(e.target.value)}/></label>
          <label>Rückgabezeit <input required type="time" value={dropoffTime} onChange={e=>setDropoffTime(e.target.value)}/></label>
          <label>Fahreralter <input required type="number" min={18} max={99} value={age} placeholder="Alter" onChange={e=>setAge(e.target.value)}/></label>
          <LandFeld label="Wohnsitzland" value={residence} onChange={v=>{invalidate();setResidence(v)}} optional={false} searchable={false}/>
          <label>Währung <select value={currency} onChange={e=>setCurrency(e.target.value)}>{SEARCH_CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></label>
        </div>
      </form> : <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-700"><Car className="h-6 w-6" aria-hidden="true" /></span>
          <div><h2 className="text-2xl font-semibold tracking-tight text-brand-800">Finde deinen Mietwagen</h2><p className="mt-1 text-sm text-ink-800">Hier vergleichen. Dein Angebot bei DiscoverCars buchen.</p></div>
        </div>
        <span className="rounded-full bg-surface-50 px-3 py-2 text-xs font-medium text-brand-700">Angebote von DiscoverCars</span>
      </div>
      <form onSubmit={submit} className="mt-5 grid min-w-0 gap-4" onChangeCapture={invalidate}>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <fieldset className="min-w-0 rounded-2xl bg-surface-50 p-4">
            <legend className="sr-only">Mietstationen</legend>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Mietstationen</p>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-brand-800"><input type="checkbox" checked={oneWay} onChange={e => setOneWay(e.target.checked)} className="h-4 w-4 shrink-0 accent-brand-800" />Andere Rückgabestation</label>
            </div>
            <div className={`grid min-w-0 gap-3 ${oneWay ? 'sm:grid-cols-2' : ''}`}>
              <StationField label="Abholstation" query={pickupQuery} value={pickup} onQuery={s => { invalidate(); setPickupQuery(s); setPickup(null) }} onSelect={s => { invalidate(); setPickup(s); setPickupQuery(s.name) }} />
              {oneWay ? <StationField label="Rückgabestation" query={dropoffQuery} value={dropoff} onQuery={s => { invalidate(); setDropoffQuery(s); setDropoff(null) }} onSelect={s => { invalidate(); setDropoff(s); setDropoffQuery(s.name) }} /> : null}
            </div>
            {reise.stages.length ? <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-xs text-ink-600">Deine Reiseorte:</span>{reise.stages.map(s => <button key={s.id} type="button" className="min-h-11 rounded-full px-3 text-sm font-semibold text-brand-700 underline decoration-line-300 underline-offset-4 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600" onClick={() => { invalidate(); setPickup(null); setPickupQuery(s.name); setPickupDate(s.arrivalDate ?? reise.startDate ?? ''); setDropoffDate(s.departureDate ?? reise.endDate ?? '') }}>{s.name}</button>)}</div> : null}
          </fieldset>
          <fieldset className="min-w-0 rounded-2xl bg-surface-50 p-4">
            <legend className="sr-only">Mietzeitraum</legend>
            <p className="mb-3 flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Mietzeitraum</p>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Suchkalender start={pickupDate} ende={dropoffDate} startLabel="Abholung" endeLabel="Rückgabe"
                min={heutigesDatum()} max="9999-12-31" minTage={0} maxTage={365} dauerAnzeigen={false} kontext="Dein Mietzeitraum"
                setzen={(start, ende) => { invalidate(); setPickupDate(start); setDropoffDate(ende) }} />
              <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Abholzeit<input aria-label="Abholzeit" required type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className={FIELD} /></label>
              <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Rückgabezeit<input aria-label="Rückgabezeit" required type="time" value={dropoffTime} onChange={e => setDropoffTime(e.target.value)} className={FIELD} /></label>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-600">Reisedaten als Vorschlag · bitte prüfen. Uhrzeiten gelten vor Ort.</p>
          </fieldset>
        </div>
        <div className="grid min-w-0 items-start gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <LandFeld label="Wohnsitzland des Fahrers" value={residence} onChange={v => { invalidate(); setResidence(v) }} optional={false} searchable={false} />
          <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Alter des Fahrers<input required type="number" inputMode="numeric" min={18} max={99} value={age} onChange={e => setAge(e.target.value)} placeholder="18–99 Jahre" className={FIELD} /></label>
          <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">Währung<select value={currency} onChange={e => setCurrency(e.target.value)} className={FIELD}>{SEARCH_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-line-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-ink-600">Für die Suche werden nur deine Suchangaben an DiscoverCars übermittelt. Deine gespeicherte Reise bleibt in Jetnity.</p>
          <button type="submit" disabled={loading} className={`${PRIMARY} shrink-0`}>{loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}{loading ? 'Mietwagen werden gesucht …' : 'Mietwagen vergleichen'}</button>
        </div>
      </form></>}
      {loading ? <p role="status" className="mt-4 text-sm text-ink-800">Verfügbare Fahrzeuge und aktuelle Preise werden abgefragt. Das kann einige Sekunden dauern.</p> : null}
      {message ? <p role="alert" className="mt-4 rounded-2xl bg-surface-50 p-4 text-sm text-brand-800">{message}</p> : null}
      {unavailable ? <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-brand-800">Alternatives Suchformular öffnen</summary><DiscoverCarsSuche /></details> : null}
    </div>
    {result ? <div className="grid min-w-0 gap-4" aria-busy={loading}>
      <div><h3 ref={resultHeading} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-brand-800 focus:outline-none">{result.offers.length ? `${result.offers.length} Mietwagenangebote` : 'Keine Mietwagen für diese Suche'}</h3><p className="mt-1 text-sm text-ink-800">{pickup?.name} · {rentalDate(pickupDate)} {pickupTime} – {rentalDate(dropoffDate)} {dropoffTime}{oneWay ? ` · Rückgabe: ${dropoff?.name}` : ''}</p><p className="mt-1 text-xs text-ink-600">Gesamtpreise · Stand {new Date(result.searchedAt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} · DiscoverCars</p></div>
      {expired ? <p role="status" className="rounded-2xl bg-surface-50 p-4 text-sm text-brand-800">Diese Suche ist abgelaufen. Starte „Mietwagen vergleichen“ erneut, um aktuelle Preise und Verfügbarkeit zu erhalten.</p> : null}
      {result.omitted > 0 ? <p className="text-sm text-ink-600">Einige unvollständige Angebote konnten nicht angezeigt werden.</p> : null}
      {!result.offers.length ? <p className="text-sm text-ink-800">Versuche eine andere Station oder einen anderen Mietzeitraum.</p> : <>
        <div className="grid min-w-0 gap-3 rounded-2xl border border-line-200 bg-white p-4 sm:grid-cols-3">
          <label className="grid min-w-0 gap-1 text-sm text-brand-800">Getriebe<select className={FIELD} value={transmission} onChange={e => { setTransmission(e.target.value); setLimit(12) }}><option value="">Alle</option><option value="automatic">Automatik</option><option value="manual">Schaltung</option></select></label>
          <label className="grid min-w-0 gap-1 text-sm text-brand-800">Fahrzeugklasse<select className={FIELD} value={category} onChange={e => { setCategory(e.target.value); setLimit(12) }}><option value="">Alle</option>{categories.map(c => <option key={c} value={c}>{CATEGORY[c] ?? c}</option>)}</select></label>
          <label className="grid min-w-0 gap-1 text-sm text-brand-800">Sortieren<select className={FIELD} value={order} onChange={e => setOrder(e.target.value)}><option value="price">Niedrigster Gesamtpreis</option><option value="rating">Beste Vermieterbewertung</option></select></label>
        </div>
        {comparison.length ? <OfferComparison offers={comparison} onClose={() => setCompare([])} /> : null}
        <p role="status" className="text-sm text-ink-600">{visible.length} passende Angebote · bis zu drei Fahrzeuge vergleichen</p>
        {!visible.length ? <p className="text-sm text-ink-800">Zu diesen Filtern gibt es keine Treffer. Ändere Getriebe oder Fahrzeugklasse.</p> : null}
        <RentalHearts key={result.searchedAt} offers={result.offers.map(o => o.offer_id)} timing={{ starts_on: pickupDate || null, ends_on: dropoffDate || null, starts_at: pickupTime || null, ends_at: dropoffTime || null }}>
        <div data-rental-grid className="grid min-w-0 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.slice(0, limit).map(o => <OfferCard key={o.offer_id} offer={o} saveAction={<RentalHeart offerId={o.offer_id} token={o.token} title={o.car.name} disabled={expired} context={{ destination: pickup?.name ?? null, starts_on: pickupDate || null, ends_on: dropoffDate || null, starts_at: pickupTime || null, ends_at: dropoffTime || null }} />} selected={compare.includes(o.offer_id)} expired={expired} onDetails={() => void handleOfferDetails(o)} onCompare={() => setCompare(ids => ids.includes(o.offer_id) ? ids.filter(x => x !== o.offer_id) : ids.length < 3 ? [...ids, o.offer_id] : ids)} />)}
        </div>
        </RentalHearts>
        {compare.length === 3 ? <p role="status" className="text-sm text-ink-600">Drei Fahrzeuge sind ausgewählt. Entferne eines, um ein anderes hinzuzufügen.</p> : null}
        {visible.length > limit ? <button type="button" className={`${BUTTON} justify-self-center`} onClick={() => setLimit(x => x + 12)}>Weitere Angebote anzeigen ({visible.length - limit})</button> : null}
      </>}
    </div> : null}
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 px-1"><p className="text-xs leading-5 text-ink-600">Partnerangebot · Jetnity kann bei einer Buchung eine Provision erhalten.</p><a href={DISCOVERCARS_GENERISCH_HREF} target="_blank" rel="noopener noreferrer sponsored" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand-800 underline underline-offset-4">Direkt bei DiscoverCars suchen<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">, neuer Tab</span></a></div>
    <dialog ref={dialog} aria-labelledby={`${id}-detail-title`} onCancel={close} onKeyDown={e => { if (e.key === 'Escape') e.stopPropagation() }} onClick={e => { if (e.target === e.currentTarget) close() }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-3xl border border-line-200 bg-white p-0 backdrop:bg-brand-950/50">
      {selected ? <><div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line-200 bg-white px-5 py-3 sm:px-6"><div className="min-w-0"><p className="text-xs text-ink-600">{selected.supplier?.name} · Fahrzeugdetails</p><h3 id={`${id}-detail-title`} className="text-xl font-semibold text-brand-800">{selected.car.name}</h3></div><button type="button" onClick={close} className={`${BUTTON} shrink-0 px-3`} aria-label="Fahrzeugdetails schliessen"><X className="h-5 w-5" aria-hidden="true" /></button></div>
        <div className="p-5 sm:p-6">{detailLoading ? <p role="status" className="flex items-center gap-2 py-6 text-brand-800"><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />Fahrzeugdetails werden geladen …</p> : detailMessage ? <div role="alert"><p className="text-sm text-ink-800">{detailMessage}</p><button type="button" className={`${BUTTON} mt-3`} onClick={() => void handleOfferDetails(selected)}>Erneut versuchen</button></div> : <OfferDetails offer={selected} expired={expired} expiresAt={result?.expiresAt ?? 0} onExpired={() => setNow(Date.now())} />}</div>
      </> : null}
    </dialog>
  </section>
}
