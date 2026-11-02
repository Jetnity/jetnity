'use client'
/* eslint-disable @next/next/no-img-element -- Provider images are allowlisted, transient and loaded directly without extending the image-optimizer trust boundary. */
import { Car, ExternalLink, Luggage, Users } from 'lucide-react'
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
export function OfferCard({ offer: o, selected, onCompare, onDetails, expired }: { offer: RentalOffer; selected: boolean; onCompare: () => void; onDetails: () => void; expired: boolean }) {
  return <article className="grid min-w-0 gap-4 rounded-3xl border border-line-200 bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,200px)]">
    <div className="relative flex min-h-32 items-center justify-center rounded-2xl bg-surface-25">
      {o.car.image ? <img src={o.car.image} alt={o.car.name} width={260} height={160} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-36 w-full object-contain" /> : <Car className="h-14 w-14 text-brand-600" aria-hidden="true" />}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-ink-600">{CATEGORY[o.car.category ?? ''] ?? 'Mietwagen'}{o.supplier?.name ? ` · ${o.supplier.name}` : ''}</p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-brand-800">{o.car.name}</h3>
      {o.guaranteed_model !== true ? <p className="text-xs text-ink-600">oder ähnliches Modell</p> : <p className="text-xs text-ink-600">Garantiertes Modell</p>}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-800">
        {o.car.seats != null ? <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" aria-hidden="true" />{o.car.seats} Sitze</span> : null}
        {o.car.bags != null ? <span className="inline-flex items-center gap-1"><Luggage className="h-4 w-4" aria-hidden="true" />{o.car.bags} Gepäck</span> : null}
        {o.car.transmission && TRANSMISSION[o.car.transmission] ? <span>{TRANSMISSION[o.car.transmission]}</span> : null}
      </div>
      <p className="mt-3 text-sm text-brand-800">{mileage(o)}</p>
      <p className="mt-1 text-sm text-brand-800">{cancellation(o)}</p>
      {o.supplier?.rating != null ? <p className="mt-2 text-xs text-ink-600">Vermieterbewertung {o.supplier.rating.toLocaleString('de-CH', { maximumFractionDigits: 1 })}{o.supplier.review_count != null ? ` · ${o.supplier.review_count} Bewertungen` : ''} · DiscoverCars</p> : null}
    </div>
    <div className="flex min-w-0 flex-col justify-between gap-3 border-t border-line-200 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
      <div><p className="text-xs text-ink-600">Gesamter Mietzeitraum</p><p className="mt-1 text-2xl font-bold tracking-tight text-brand-800">{money(o.price.total, o.price.currency)}</p></div>
      <button className={PRIMARY} type="button" disabled={expired} onClick={onDetails}>Angebot ansehen</button>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-brand-800"><input type="checkbox" checked={selected} disabled={expired} onChange={onCompare} className="h-4 w-4 accent-brand-800" />Vergleichen<span className="sr-only">: {o.car.name} bei {o.supplier?.name}</span></label>
    </div>
  </article>
}

export function OfferComparison({ offers, onClose }: { offers: RentalOffer[]; onClose: () => void }) {
  return <section aria-label="Mietwagenvergleich" className="rounded-3xl border border-line-200 bg-white p-4 sm:p-5">
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
    <div><p className="text-2xl font-bold text-brand-800">{money(o.price.total, o.price.currency)}</p><p>Gesamtpreis laut Anbieter für den ausgewählten Mietzeitraum.</p>
      <p className="mt-1 text-xs leading-5 text-ink-600">Obligatorische Steuern und Gebühren sind laut DiscoverCars enthalten. Optionale Extras und bestimmte örtliche Rückgabegebühren können zusätzlich anfallen.</p>
    </div>
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{facts(o).map(([k, v]) => <div key={k} className="border-b border-line-200 pb-3"><dt className="text-xs text-ink-600">{k}</dt><dd className="mt-1 font-medium text-brand-800">{v}</dd></div>)}</dl>
    <div className="grid gap-4 sm:grid-cols-2">{([['Abholung', o.pickup], ['Rückgabe', o.dropoff]] as const).map(([label, place]) => <div key={label} className="rounded-2xl bg-surface-25 p-4"><h4 className="font-semibold text-brand-800">{label}</h4><p className="mt-2">{place?.location ?? UNKNOWN}</p><p>{place?.address}</p>{place?.instructions ? <p className="mt-2 leading-6">{place.instructions}</p> : null}{place?.opening_hours ? <details className="mt-3"><summary className="cursor-pointer py-2 font-semibold">Öffnungszeiten</summary>{Object.entries(place.opening_hours).map(([day, times]) => <p key={day}>{({ Mon: 'Montag', Tue: 'Dienstag', Wed: 'Mittwoch', Thu: 'Donnerstag', Fri: 'Freitag', Sat: 'Samstag', Sun: 'Sonntag' } as Record<string, string>)[day] ?? day}: {times}</p>)}</details> : null}</div>)}</div>
    {(o.included_options?.length ?? 0) > 0 ? <div><h4 className="font-semibold text-brand-800">Enthalten laut Vermieter</h4><ul className="mt-2 list-inside list-disc leading-7">{o.included_options?.map((x, i) => <li key={i}>{x.name}</li>)}</ul></div> : null}
    {([['Optionale Extras', o.extras], ['Pflichtextras laut Vermieter', o.mandatory_extras]] as const).map(([title, extras]) => extras?.length ? <div key={title}><h4 className="font-semibold text-brand-800">{title}</h4><ul className="mt-2 divide-y divide-line-200">{extras.map((x, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-2"><span>{x.name}</span><span>{money(x.price, o.price.currency)}{x.price_period === 'per_rental' ? ' / Anmietung' : x.price_period === 'per_day' ? ' / Tag' : ''}{x.payable === 'at_pickup' ? ' · vor Ort' : ''}</span></li>)}</ul></div> : null)}
    <div className="grid gap-3 sm:grid-cols-2"><p><strong>Grenzübertritt:</strong><br />{yesNo(o.cross_border?.allowed)}</p><p><strong>Fähren:</strong><br />{yesNo(o.cross_border?.ferry_allowed)}</p></div>
    {o.payment_methods?.length ? <div><h4 className="font-semibold text-brand-800">Zahlungsmittel laut Vermieter</h4><ul className="mt-2 divide-y divide-line-200">{o.payment_methods.filter(x => x.name).map((x, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-2"><span>{x.name}</span><span>{({ paydeposit: 'Zahlung und Kaution', pay: 'Zahlung', deposit: 'Kaution', notaccepted: 'Nicht akzeptiert' } as Record<string, string>)[x.status ?? ''] ?? 'Bitte Mietbedingungen prüfen'}</span></li>)}</ul></div> : null}
    {o.coverage?.price != null ? <p><strong>Zusätzlicher Schutz:</strong> {money(o.coverage.price, o.coverage.currency)}. Umfang und Bedingungen beim Anbieter prüfen.</p> : null}
    {o.url.rental_conditions ? <a href={o.url.rental_conditions} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-800 underline">Vollständige Mietbedingungen<ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only">, neuer Tab</span></a> : null}
    {expired ? <p role="status">Das Suchergebnis ist abgelaufen. Bitte suche erneut.</p> : o.url.web ? <a href={o.url.web} target="_blank" rel="noopener noreferrer sponsored" referrerPolicy="no-referrer" onClick={e => { if (Date.now() >= expiresAt) { e.preventDefault(); onExpired() } }} className={PRIMARY}>Bei DiscoverCars buchen<ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only">, neuer Tab</span></a> : <p>Für dieses Angebot ist gerade kein Buchungslink verfügbar. Bitte suche erneut.</p>}
    <p className="text-xs leading-5 text-ink-600">Die Buchung wird bei DiscoverCars abgeschlossen. Einige Vermieterangaben werden in ihrer Originalsprache angezeigt. Massgeblich sind die Bedingungen des ausgewählten Angebots.</p>
  </div>
}
