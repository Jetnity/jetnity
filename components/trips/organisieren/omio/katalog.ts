export type Modus = 'train' | 'bus' | 'flight' | 'ferry'
export const namen: Record<Modus, string> = { train: 'Zug', bus: 'Bus', flight: 'Flug', ferry: 'Fähre' }
export type Ort = {
  id: string
  name: string
  country: string
  lat: number | null
  lng: number | null
  weight?: number
}
export type Paar = [number | null, number | null]
export type Katalog = {
  date: string
  publisher: string
  places: Ort[]
  routes: Record<string, Partial<Record<Modus, Paar>>>
}
export type Abschnitt = { von: Ort; nach: Ort; datum: string }
export type Wahl = { mode: Modus; preis: number | null; minuten: number | null }
export const normal = (s: string) =>
  s.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss')
const laender = new Intl.DisplayNames(['de-CH'], { type: 'region' })
export const land = (o: Ort) => (/^[A-Z]{2}$/.test(o.country) ? laender.of(o.country) || o.country : '')
export const geld = (cent: number) =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(cent / 100)
export const dauer = (min: number) =>
  [min >= 60 ? Math.floor(min / 60) + ' Std.' : '', min % 60 || min === 0 ? (min % 60) + ' Min.' : '']
    .filter(Boolean)
    .join(' ')
export function heute(d = new Date()) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}
export function tag(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const date = new Date(s + 'T12:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(s + 'T')
}
export const datumText = (s: string) =>
  tag(s)
    ? new Intl.DateTimeFormat('de-CH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(s + 'T12:00:00Z'))
    : 'Datum offen'
export function gleich(a: Ort, b: Ort) {
  return a.id === b.id || (a.name === b.name && a.country === b.country && a.lat === b.lat && a.lng === b.lng)
}
export function ausEtappe(orte: Ort[], ort: Ort) {
  const direkt = orte.find((p) => p.id === ort.id)
  if (direkt) return direkt
  const treffer = orte.filter(
    (p) => normal(p.name) === normal(ort.name) && (!ort.country || p.country === ort.country),
  )
  if (treffer.length !== 1) return ort
  const kandidat = treffer[0]!
  if (
    ort.lat !== null &&
    ort.lng !== null &&
    kandidat.lat !== null &&
    kandidat.lng !== null &&
    (Math.abs(ort.lat - kandidat.lat) > 0.65 || Math.abs(ort.lng - kandidat.lng) > 0.65)
  )
    return ort
  return kandidat
}
export function angebote(katalog: Katalog, von: Ort, nach: Ort): Wahl[] {
  const row = katalog.routes[von.id + '/' + nach.id] || {}
  return (Object.keys(namen) as Modus[]).flatMap((mode) => {
    const pair = row[mode]
    return pair ? [{ mode, preis: pair[0], minuten: pair[1] }] : []
  })
}
export function partnerlink(id: string, von: Ort, nach: Ort, datum: string, mode?: Modus) {
  if (!/^\d+$/.test(id) || !tag(datum) || datum < heute() || gleich(von, nach)) return null
  const destination = new URL('https://www.omio.com/links/626fa8a9-f982-43d0-ace9-9a13f6b14612')
  destination.search = new URLSearchParams({
    departurePosTerm: von.name,
    arrivalPosTerm: nach.name,
    departureDate: datum,
    locale: 'de',
    currency: 'CHF',
  }).toString()
  if (mode) destination.searchParams.set('travelMode', mode.toUpperCase())
  const url = new URL('https://omio.sjv.io/c/' + id + '/4057579/7385')
  url.searchParams.set('u', destination.href)
  return url.href
}
