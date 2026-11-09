'use client'

import * as React from 'react'
import { BedDouble, Check, MapPin, Star } from 'lucide-react'
import type { Trip } from '@/types/trips'
import { hotelZeitraumAusEtappe } from '@/lib/hotels/reisegraph'
import { HOTELZEITRAUM_OFFEN, naechteZwischen } from '@/lib/hotels/quartier-kontext'
import { ORGANISIEREN_EINGABE_KLASSE as inputClass, ORGANISIEREN_FLAECHE_KLASSE as panelClass } from '@/lib/trips/organize-premium-experience-6'
import BookingSearchForm from '../BookingSearchForm'
import { bookingHandoff, bookingStartPages } from '@/lib/providers/booking/search'
import { PreviewFeedback, previewMoney, useKayakPreview } from './PreviewShared'

export default function KayakHotels({ reise }: { reise: Trip }) {
  const [stageId, setStageId] = React.useState(reise.stages[0]?.id ?? '')
  const stage = reise.stages.find((item) => item.id === stageId)
  const initialDates = stage ? hotelZeitraumAusEtappe(reise, stage) : null
  const [checkIn, setCheckIn] = React.useState(initialDates?.checkIn ?? '')
  const [checkOut, setCheckOut] = React.useState(initialDates?.checkOut ?? '')
  const [adults, setAdults] = React.useState(Math.min(9, Math.max(1, reise.travellers)))
  const [rooms, setRooms] = React.useState(1)
  const [sort, setSort] = React.useState('price')
  const [rating, setRating] = React.useState('all')
  const preview = useKayakPreview()
  const id = React.useId()
  const hotels = [...(preview.data?.hotels ?? [])].filter((hotel) => rating === 'all' || (hotel.rating ?? 0) >= 8).sort((a, b) => sort === 'rating' ? (b.rating ?? -1) - (a.rating ?? -1) : (a.price ?? Infinity) - (b.price ?? Infinity))
  const coordinates = stage && Number.isFinite(stage.latitude) && Number.isFinite(stage.longitude) && stage.latitude !== null && stage.longitude !== null
  return <section aria-label="Unterkunftssuche" className="grid min-w-0 gap-5">
    <div className={panelClass}>
      <div className="mb-5 flex items-start gap-3"><span className="rounded-2xl bg-surface-50 p-3 text-brand-800"><BedDouble aria-hidden="true" className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Dein Aufenthalt</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-brand-800">Unterkunft suchen</h2><p className="mt-2 text-sm leading-6 text-ink-800">Wähle eine Etappe und vergleiche verfügbare Unterkünfte auf Booking.com.</p></div></div>
      <BookingSearchForm
        handoff={bookingHandoff({ kind: 'hotels', place: stage?.name ?? '', country: stage?.countryCode ?? null, checkIn, checkOut, adults, rooms, currency: reise.currency })}
        label="Unterkünfte bei Booking.com suchen"
        startPage={bookingStartPages.hotels}
        previewHint="Maximal 30 Übernachtungen. Beispielpreise in USD."
        busy={preview.busy}
        onChange={preview.reset}
        onError={preview.setError}
        onPreview={() => {
          if (!coordinates || !stage) { preview.setError('Für dieses Reiseziel fehlt der genaue Ort. Bitte bestätige das Ziel zuerst unter „Reise ändern“.'); return }
          void preview.search({ kind: 'hotels', latitude: stage.latitude!, longitude: stage.longitude!, checkIn, checkOut, adults, rooms })
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-brand-800 xl:col-span-2" htmlFor={`${id}-place`}>Reiseziel<select id={`${id}-place`} className={inputClass} value={stageId} required onChange={(event) => {
            setStageId(event.target.value)
            const nextStage = reise.stages.find((item) => item.id === event.target.value)
            const dates = nextStage ? hotelZeitraumAusEtappe(reise, nextStage) : null
            setCheckIn(dates?.checkIn ?? ''); setCheckOut(dates?.checkOut ?? '')
          }}>{!reise.stages.length && <option value="">Zuerst ein Reiseziel hinzufügen</option>}{reise.stages.map((item) => {
            const dates = hotelZeitraumAusEtappe(reise, item)
            const nights = dates ? naechteZwischen(dates.checkIn, dates.checkOut) : null
            return <option key={item.id} value={item.id}>{item.name} · {nights ? `${nights} ${nights === 1 ? 'Nacht' : 'Nächte'}` : HOTELZEITRAUM_OFFEN}</option>
          })}</select></label>
          <label className="grid gap-2 text-sm font-medium text-brand-800">Anreise<input type="date" className={inputClass} required value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label>
          <label className="grid gap-2 text-sm font-medium text-brand-800">Abreise<input type="date" className={inputClass} required min={checkIn} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-brand-800">Erwachsene<input type="number" min={1} max={9} required className={inputClass} value={adults} onChange={(event) => setAdults(Number(event.target.value))} /></label>
          <label className="grid gap-2 text-sm font-medium text-brand-800">Zimmer<input type="number" min={1} max={Math.min(4, adults)} required className={inputClass} value={rooms} onChange={(event) => setRooms(Number(event.target.value))} /></label>
        </div>
      </BookingSearchForm>
      <PreviewFeedback busy={preview.busy} error={preview.error} complete={preview.data?.complete} />
    </div>
    {preview.data && <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Beispielergebnisse</p><h3 className="mt-1 text-xl font-semibold text-brand-800">{hotels.length} Unterkünfte zum Entdecken</h3><p className="mt-1 text-sm text-ink-600">KAYAK-Testdaten · keine aktuelle Verfügbarkeit</p></div><div className="flex flex-wrap gap-3"><label className="grid gap-1 text-xs text-ink-800">Bewertung<select className={inputClass} value={rating} onChange={(e) => setRating(e.target.value)}><option value="all">Alle Bewertungen</option><option value="8">Ab 8 von 10</option></select></label><label className="grid gap-1 text-xs text-ink-800">Sortieren<select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value)}><option value="price">Niedrigster Preis</option><option value="rating">Höchste Bewertung</option></select></label></div></div>
      {!hotels.length && <p className={panelClass}>{preview.data.hotels.length ? 'Keine Beispielunterkunft passt zu diesem Filter.' : 'KAYAK hat für diese Testsuche keine Beispielunterkünfte geliefert.'}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{hotels.map((hotel) => <article key={hotel.id} className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-line-200 bg-white shadow-sm">
        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-surface-50 text-brand-600">
          {hotel.image ? <HotelImage src={hotel.image} name={hotel.name} /> : <BedDouble className="h-12 w-12" aria-hidden="true" />}
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">Testangebot</span>
        </div>
        <div className="flex flex-1 flex-col p-4"><div className="mb-2 flex items-center justify-between gap-2 text-xs text-ink-600">{hotel.stars ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" aria-hidden="true" />{hotel.stars} Sterne</span> : <span>Unterkunft</span>}{hotel.rating !== null && <span className="rounded-lg bg-surface-50 px-2 py-1 font-semibold text-brand-800">{hotel.rating.toLocaleString('de-CH')} / 10</span>}</div>
          <h4 className="text-lg font-semibold leading-6 text-brand-800">{hotel.name}</h4>{hotel.address && <p className="mt-2 flex gap-1.5 text-sm leading-5 text-ink-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{hotel.address}</p>}
          {hotel.room && <p className="mt-3 text-sm text-ink-800">{hotel.room}</p>}{hotel.freeCancellation && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-600"><Check className="h-4 w-4" aria-hidden="true" />Stornierung im Testangebot enthalten</p>}
          <div className="mt-auto pt-5"><div className="border-t border-line-200 pt-4"><p className="text-xs text-ink-600">Beispielpreis · gesamter Aufenthalt</p><p className="mt-1 text-2xl font-semibold tracking-tight text-brand-800">{previewMoney(hotel.price, hotel.currency)}</p><p className="mt-2 text-xs text-ink-600">{hotel.provider ? `${hotel.provider} · ` : ''}Nicht buchbar</p></div></div>
        </div>
      </article>)}</div>
    </div>}
  </section>
}

function HotelImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return <BedDouble className="h-12 w-12" aria-label="Kein Hotelbild verfügbar" />
  // KAYAK images are server-allowlisted; no third-party image is requested before an explicit test search.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailed(true)} />
}
