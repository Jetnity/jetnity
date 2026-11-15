'use client'
/* eslint-disable @next/next/no-img-element -- Provider images are allowlisted, transient and loaded directly without extending the image-optimizer trust boundary. */
import { useState, type ReactNode } from 'react'
import { ArrowRight, Car, ExternalLink, Gauge, Luggage, ShieldCheck, Star, Users } from 'lucide-react'
import type { RentalOffer } from '@/lib/providers/discovercars/search/contract'
import { BUTTON, CATEGORY, money, PRIMARY, TRANSMISSION } from './client'

const UNKNOWN = 'Nicht angegeben'
function range(value: RentalOffer['deposit']) {
  if (value?.min == null || value.max == null) return UNKNOWN
  return value.min === value.max ? money(value.min, value.currency) : `${money(value.min, value.currency)} – ${money(value.max, value.currency)}`
}
function cancellation(o: RentalOffer) {
  if (o.cancellation?.type !== 'free') return o.cancellation?.type === 'non_refundable' ? 'Nicht erstattbar' : 'Siehe Mietbedingungen'
  const hours = o.cancellation.details?.hours_before_pickup
  return hours == null ? 'Kostenfrei gemäss Mietbedingungen' : `Kostenfrei bis ${hours} Std. vor Abholung`
}
function mileage(o: RentalOffer) {
  if (o.mileage?.unlimited === true) return 'Alle Kilometer frei'
  return o.mileage?.included_limit != null && o.mileage.unit ? `${o.mileage.included_limit} ${o.mileage.unit} inklusive` : UNKNOWN
}
function facts(o: RentalOffer) {
  return [
    ['Getriebe', TRANSMISSION[o.car.transmission ?? ''] ?? UNKNOWN],
    ['Sitze / Gepäck', `${o.car.seats ?? '–'} Sitze · ${o.car.bags ?? '–'} Gepäckstücke`],
    ['Kilometer', mileage(o)],
    ['Tankregelung', o.car.fuel === 'full_to_full' ? 'Voll / voll' : o.car.fuel === 'same_to_same' ? 'Gleicher Tankstand' : 'Siehe Mietbedingungen'],
    ['Kaution', range(o.deposit)], ['Selbstbeteiligung', range(o.excess)],
    ['Stornierung', cancellation(o)],
  ]
}
export function OfferCard({ offer: o, selected, onCompare, onDetails, expired, saveAction }: { offer: RentalOffer; selected: boolean; onCompare: () => void; onDetails: () => void; expired: boolean; saveAction?: ReactNode }) {
  return <article className={`flex min-w-0 flex-col rounded-3xl border bg-white p-4 transition sm:p-5 ${selected ? 'border-brand-600 ring-1 ring-brand-600' : 'border-line-200 hover:border-line-400'}`}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-600">
      <span className="rounded-full bg-surface-50 px-2.5 py-1.5 font-medium text-brand-700">{CATEGORY[o.car.category ?? ''] ?? 'Mietwagen'}</span>
      {o.supplier?.rating != null ? <span className="inline-flex items-center gap-1 font-semibold text-brand-800" aria-label={`Vermieterbewertung ${o.supplier.rating} bei DiscoverCars`}><Star className="h-3.5 w-3.5" aria-hidden="true" />{o.supplier.rating.toLocaleString('de-CH', { maximumFractionDigits: 1 })}</span> : null}
    </div>
    <div className="my-3 flex h-36 items-center justify-center rounded-2xl bg-surface-25">
      <VehicleImage offer={o} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-ink-600">{o.supplier?.name ?? 'DiscoverCars'}{o.supplier?.review_count != null ? ` · ${o.supplier.review_count} Bewertungen` : ''}</p>
      <h3 className="mt-1 break-words text-xl font-semibold tracking-tight text-brand-800">{o.car.name}</h3>
      <p className="mt-0.5 text-xs text-ink-600">{o.guaranteed_model === true ? 'Garantiertes Modell' : 'oder ähnliches Modell'}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 border-y border-line-200 py-3 text-xs text-ink-800">
        {o.car.seats != null ? <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" aria-hidden="true" />{o.car.seats} Sitze</span> : null}
        {o.car.bags != null ? <span className="inline-flex items-center gap-1"><Luggage className="h-4 w-4" aria-hidden="true" />{o.car.bags} Gepäck</span> : null}
        {o.car.transmission && TRANSMISSION[o.car.transmission] ? <span>{TRANSMISSION[o.car.transmission]}</span> : null}
      </div>
      <div className="mt-3 grid gap-2 text-xs leading-5 text-brand-800">
        <p className="flex items-start gap-2"><Gauge className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{mileage(o)}</p>
        <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{cancellation(o)}</p>
      </div>
    </div>
    <div className="mt-5 border-t border-line-200 pt-4">
      <p className="text-xs text-ink-600">Gesamtpreis für deinen Mietzeitraum</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-brand-800">{money(o.price.total, o.price.currency)}</p>
      <button className={`${PRIMARY} mt-3 w-full`} type="button" disabled={expired} onClick={onDetails}>Angebot ansehen<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
      {saveAction}
      <label className="mt-1 flex min-h-11 cursor-pointer items-center justify-center gap-2 text-sm font-medium text-brand-800"><input type="checkbox" checked={selected} disabled={expired} onChange={onCompare} className="h-4 w-4 accent-brand-800" />Vergleichen<span className="sr-only">: {o.car.name} bei {o.supplier?.name}</span></label>
    </div>
  </article>
}

function VehicleImage({ offer: o, eager = false }: { offer: RentalOffer; eager?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return o.car.image && failedUrl !== o.car.image
    ? <img src={o.car.image} alt={o.car.name} width={300} height={180} loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(o.car.image ?? null)} className="h-full max-h-44 w-full object-contain p-2" />
    : <div className="flex flex-col items-center gap-2 text-ink-600"><Car className="h-14 w-14 text-brand-600" aria-hidden="true" /><span className="text-xs">Kein Fahrzeugbild verfügbar</span></div>
}

export function OfferComparison({ offers, onClose }: { offers: RentalOffer[]; onClose: () => void }) {
  return <section aria-label="Mietwagenvergleich" className="min-w-0 rounded-3xl border border-line-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold text-brand-800">Dein Vergleich</h3><button type="button" onClick={onClose} className={BUTTON}>Vergleich leeren</button></div>
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Vergleichstabelle, bei Bedarf seitlich scrollen">
      <table className="w-full text-left text-sm text-ink-800"><caption className="sr-only">Ausgewählte Mietwagen und ihre Bedingungen</caption><thead><tr><th className="p-3">Angebot</th>{offers.map(o => <th key={o.offer_id} scope="col" className="min-w-44 p-3 text-brand-800">{o.car.name}<span className="block font-normal">{o.supplier?.name}</span></th>)}</tr></thead>
        <tbody>{['Gesamtpreis', ...facts(offers[0]).map(f => f[0])].map((label, i) => <tr key={label} className="border-t border-line-200"><th scope="row" className="p-3 font-medium">{label}</th>{offers.map(o => <td key={o.offer_id} className="p-3">{i === 0 ? money(o.price.total, o.price.currency) : facts(o)[i - 1][1]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>
}

export function OfferDetails({ offer: o, expired, expiresAt, onExpired }: { offer: RentalOffer; expired: boolean; expiresAt: number; onExpired: () => void }) {
  const yesNo = (value: boolean | null | undefined) => value == null ? UNKNOWN : value ? 'Erlaubt gemäss Mietbedingungen' : 'Nicht erlaubt'
  return <div className="grid gap-5 text-sm text-ink-800">
    <div className="grid min-w-0 items-center gap-5 rounded-2xl bg-surface-50 p-4 sm:grid-cols-[1fr_1.3fr] sm:p-5">
      <div className="flex h-40 items-center justify-center rounded-2xl bg-white"><VehicleImage offer={o} eager /></div>
      <div><p className="text-xs font-medium text-brand-700">{CATEGORY[o.car.category ?? ''] ?? 'Mietwagen'} · {o.guaranteed_model === true ? 'Garantiertes Modell' : 'oder ähnliches Modell'}</p><p className="mt-2 text-3xl font-bold tracking-tight text-brand-800">{money(o.price.total, o.price.currency)}</p><p className="mt-1 text-sm">Gesamtpreis für deinen Mietzeitraum</p>
        <p className="mt-2 text-xs leading-5 text-ink-600">Obligatorische Steuern und Gebühren sind laut DiscoverCars enthalten. Optionale Extras und bestimmte örtliche Rückgabegebühren können zusätzlich anfallen.</p>
      </div>
    </div>
    <section><h4 className="mb-3 text-base font-semibold text-brand-800">Dein Angebot auf einen Blick</h4><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{facts(o).map(([k, v]) => <div key={k} className="rounded-2xl border border-line-200 p-3"><dt className="text-xs text-ink-600">{k}</dt><dd className="mt-1 font-medium text-brand-800">{v}</dd></div>)}</dl></section>
    <div className="grid gap-4 sm:grid-cols-2">{([['Abholung', o.pickup], ['Rückgabe', o.dropoff]] as const).map(([label, place]) => <div key={label} className="rounded-2xl bg-surface-25 p-4"><h4 className="font-semibold text-brand-800">{label}</h4><p className="mt-2">{place?.location ?? UNKNOWN}</p><p>{place?.address}</p>{place?.instructions ? <p className="mt-2 leading-6">{place.instructions}</p> : null}{place?.opening_hours ? <details className="mt-3"><summary className="cursor-pointer py-2 font-semibold">Öffnungszeiten</summary>{Object.entries(place.opening_hours).map(([day, times]) => <p key={day}>{({ Mon: 'Montag', Tue: 'Dienstag', Wed: 'Mittwoch', Thu: 'Donnerstag', Fri: 'Freitag', Sat: 'Samstag', Sun: 'Sonntag' } as Record<string, string>)[day] ?? day}: {times}</p>)}</details> : null}</div>)}</div>
    <details className="rounded-2xl border border-line-200 p-4"><summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-brand-800">Leistungen, Extras & Zahlungsbedingungen</summary><div className="mt-3 grid gap-5">
    {(o.included_options?.length ?? 0) > 0 ? <div><h4 className="font-semibold text-brand-800">Enthalten laut Vermieter</h4><ul className="mt-2 list-inside list-disc leading-7">{o.included_options?.map((x, i) => <li key={i}>{x.name}</li>)}</ul></div> : null}
    {([['Optionale Extras', o.extras], ['Pflichtextras laut Vermieter', o.mandatory_extras]] as const).map(([title, extras]) => extras?.length ? <div key={title}><h4 className="font-semibold text-brand-800">{title}</h4><ul className="mt-2 divide-y divide-line-200">{extras.map((x, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-2"><span>{x.name}</span><span>{money(x.price, o.price.currency)}{x.price_period === 'per_rental' ? ' / Anmietung' : x.price_period === 'per_day' ? ' / Tag' : ''}{x.payable === 'at_pickup' ? ' · vor Ort' : ''}</span></li>)}</ul></div> : null)}
    <div className="grid gap-3 sm:grid-cols-2"><p><strong>Grenzübertritt:</strong><br />{yesNo(o.cross_border?.allowed)}</p><p><strong>Fähren:</strong><br />{yesNo(o.cross_border?.ferry_allowed)}</p></div>
    {o.payment_methods?.length ? <div><h4 className="font-semibold text-brand-800">Zahlungsmittel laut Vermieter</h4><ul className="mt-2 divide-y divide-line-200">{o.payment_methods.filter(x => x.name).map((x, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-2"><span>{x.name}</span><span>{({ paydeposit: 'Zahlung und Kaution', pay: 'Zahlung', deposit: 'Kaution', notaccepted: 'Nicht akzeptiert' } as Record<string, string>)[x.status ?? ''] ?? 'Bitte Mietbedingungen prüfen'}</span></li>)}</ul></div> : null}
    {o.coverage?.price != null ? <p><strong>Zusätzlicher Schutz:</strong> {money(o.coverage.price, o.coverage.currency)}. Umfang und Bedingungen beim Anbieter prüfen.</p> : null}
    </div></details>
    {o.url.rental_conditions ? <a href={o.url.rental_conditions} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-800 underline">Vollständige Mietbedingungen<ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only">, neuer Tab</span></a> : null}
    {expired ? <p role="status">Das Suchergebnis ist abgelaufen. Bitte suche erneut.</p> : o.url.web ? <a href={o.url.web} target="_blank" rel="noopener noreferrer sponsored" referrerPolicy="no-referrer" onClick={e => { if (Date.now() >= expiresAt) { e.preventDefault(); onExpired() } }} className={PRIMARY}>Bei DiscoverCars buchen<ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only">, neuer Tab</span></a> : <p>Für dieses Angebot ist gerade kein Buchungslink verfügbar. Bitte suche erneut.</p>}
    <p className="text-xs leading-5 text-ink-600">Die Buchung wird bei DiscoverCars abgeschlossen. Einige Vermieterangaben werden in ihrer Originalsprache angezeigt. Massgeblich sind die Bedingungen des ausgewählten Angebots.</p>
  </div>
}
