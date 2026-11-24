// W2 #1299: truthful visitor guidance for commercial points affected by a
// proposed itinerary change. Pure projection: no booking, provider call or IO.
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import type { Trip, TripItem } from '@/types/trips'

export type BuchungsHinweis = {
  id: string
  titel: string
  status: 'unverbindliches_angebot' | 'vom_nutzer_markiert'
  label: string
  preisHinweis: string
  vorher: string
  nachher: string
  handlung: string
  link: string | null
}

const PREIS_UNBEKANNT = 'Ein verlässlicher Preisstand mit Datum und Uhrzeit liegt für diesen gespeicherten Planpunkt nicht vor.'
const ANBIETER_HOSTS: Readonly<Record<string, readonly string[]>> = {
  viator: ['viator.com'],
  getyourguide: ['getyourguide.com'],
  gyg: ['getyourguide.com'],
  booking: ['booking.com'],
  bookingcom: ['booking.com'],
  stay22: ['stay22.com'],
  discovercars: ['discovercars.com'],
  '12go': ['12go.asia'],
  omio: ['omio.com'],
}

function hostErlaubt(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/** A stored booking URL does not establish booking or provider confirmation. */
export function gespeicherterAnbieterLink(punkt: TripItem): string | null {
  const hosts = ANBIETER_HOSTS[punkt.provider?.toLowerCase() ?? '']
  if (!hosts || !punkt.bookingUrl) return null
  try {
    const url = new URL(punkt.bookingUrl)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')
      || !hosts.some(domain => hostErlaubt(host, domain))) return null
    return punkt.bookingUrl
  } catch { return null }
}

export function preisEinordnung(punkt: TripItem): string {
  const preis = punkt.priceAmount, waehrung = punkt.priceCurrency
  const betrag = preis !== null && Number.isFinite(preis) && preis >= 0
    && typeof waehrung === 'string' && /^[A-Z]{3}$/.test(waehrung)
    ? `Zuletzt gespeicherter Betrag: ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 }).format(preis)} ${waehrung}. `
    : ''
  return betrag + PREIS_UNBEKANNT + ' Preis kann sich ändern.'
}

/** Deliberately never calls a user-marked booking a provider-confirmed booking. */
export function buchungsEinordnung(punkt: TripItem): Pick<BuchungsHinweis, 'status' | 'label'> {
  return punkt.bookingStatus === 'booked'
    ? { status: 'vom_nutzer_markiert', label: 'Von dir als gebucht markiert – nicht vom Anbieter bestätigt' }
    : { status: 'unverbindliches_angebot', label: 'Unverbindliches Angebot – nicht gebucht' }
}

function kontext(reise: Trip, punkt: TripItem): string {
  const d = reise.days.find(tag => tag.id === punkt.dayId)
  const s = reise.stages.find(stage => stage.id === punkt.stageId)
  return `${d ? `Tag ${d.dayIndex}, ${d.dayDate ?? 'Datum offen'}` : 'Ohne Reisetag'} · ${s?.name ?? 'Ziel offen'} · ${punkt.startsOn ?? 'Termin offen'} bis ${punkt.endsOn ?? 'Termin offen'}`
}

function betrifft(vorher: Trip, nachher: Trip, alt: TripItem, neu: TripItem | undefined): boolean {
  if (!neu) return true
  if (vorher.startDate !== nachher.startDate || vorher.endDate !== nachher.endDate) return true
  if (alt.dayId !== neu.dayId || alt.stageId !== neu.stageId
    || alt.startsOn !== neu.startsOn || alt.endsOn !== neu.endsOn
    || alt.startsAt !== neu.startsAt || alt.endsAt !== neu.endsAt) return true
  const d1 = vorher.days.find(d => d.id === alt.dayId), d2 = nachher.days.find(d => d.id === neu.dayId)
  if (d1?.dayDate !== d2?.dayDate || d1?.dayIndex !== d2?.dayIndex) return true
  const s1 = vorher.stages.find(s => s.id === alt.stageId), s2 = nachher.stages.find(s => s.id === neu.stageId)
  return s1?.arrivalDate !== s2?.arrivalDate || s1?.departureDate !== s2?.departureDate
    || s1?.name !== s2?.name
}

export function buchungsHinweise(vorher: Trip, nachher: Trip): BuchungsHinweis[] {
  const alt = [...vorher.days.flatMap(d => d.items), ...vorher.ohneTag]
  const neu = new Map([...nachher.days.flatMap(d => d.items), ...nachher.ohneTag].map(p => [p.id, p]))
  const reihe: BuchungsHinweis[] = []
  const gesehen = new Set<string>()
  for (const item of alt) {
    if (gesehen.has(item.id)) continue
    gesehen.add(item.id)
    if (!istKommerziell(item) || !betrifft(vorher, nachher, item, neu.get(item.id))) continue
    const status = buchungsEinordnung(item), link = gespeicherterAnbieterLink(item)
    const gebucht = item.bookingStatus === 'booked'
    reihe.push({
      id: item.id,
      titel: item.title,
      ...status,
      preisHinweis: preisEinordnung(item),
      vorher: kontext(vorher, item),
      nachher: neu.get(item.id) ? kontext(nachher, neu.get(item.id)!) : 'Planpunkt nicht mehr zugeordnet',
      handlung: gebucht
        ? link
          ? 'Prüfe deine Buchungsbestätigung und kontaktiere den Anbieter, falls du Termine oder Leistungen anpassen musst. Der gespeicherte Link ist kein bestätigter Umbuchungslink.'
          : 'Prüfe deine eigene Buchungsbestätigung und kontaktiere den Anbieter direkt, falls du Termine oder Leistungen anpassen musst. Jetnity besitzt keine Anbieterbestätigung.'
        : link
          ? 'Prüfe Preis und Verfügbarkeit erneut direkt beim Anbieter, bevor du etwas buchst. Es liegt keine bestätigte Buchung vor.'
          : 'Prüfe Preis und Verfügbarkeit selbst beim Anbieter. Es liegt keine bestätigte Buchung und kein geprüfter Anbieterlink vor.',
      link,
    })
  }
  return reihe
}
