import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fixture } from '@/scripts/direct-trip-editing-1/fixture'
import { datumMitWochentag } from '@/lib/trips/datum-anzeige'
import type { TripItem } from '@/types/trips'
import { buchungsEinordnung, buchungsHinweise, gespeicherterAnbieterLink, preisEinordnung } from './buchungs-hinweise'

const old = () => fixture()
const ändern = () => {
  const vorher = old()
  const nachher = structuredClone(vorher)
  nachher.startDate = '2026-10-08'
  nachher.endDate = '2026-10-11'
  nachher.days.forEach((d, i) => { d.dayDate = `2026-10-${String(8 + i).padStart(2, '0')}` })
  return { vorher, nachher }
}
const unterkunft = (): TripItem => structuredClone(old().days[3].items[0])

test('W2 #1299: user-marked booking is NOT provider-confirmed, regardless of the stored price', () => {
  const { vorher, nachher } = ändern()
  const ursprünglicher = structuredClone(vorher), vorgeschlagener = structuredClone(nachher)
  const rows = buchungsHinweise(vorher, nachher)
  assert.equal(rows.length, 1)
  const row = rows[0]!
  assert.equal(row.id, 'item-4')
  assert.equal(row.status, 'vom_nutzer_markiert')
  assert.match(row.label, /Von dir als gebucht markiert/)
  assert.match(row.label, /nicht vom Anbieter bestätigt/)
  assert.match(row.handlung, /Prüfe deine eigene Buchungsbestätigung/)
  assert.match(row.handlung, /kontaktiere den Anbieter/)
  assert.equal(row.link, null)
  assert.match(row.preisHinweis, /Zuletzt gespeicherter Betrag: 0 CHF/)
  assert.match(row.preisHinweis, /Preisstand mit Datum und Uhrzeit.*nicht vor/) // no invented date
  assert.match(row.preisHinweis, /Preis kann sich ändern/)
  assert.ok(row.vorher.includes(datumMitWochentag('2026-10-10')!), 'bisheriges Datum im Feinschliff-Format')
  assert.ok(row.nachher.includes(datumMitWochentag('2026-10-11')!), 'neues Datum im Feinschliff-Format')
  assert.doesNotMatch(row.vorher + row.nachher, /2026-10-\d{2}/, 'keine ISO-Datumsanzeige')
  assert.deepEqual(vorher, ursprünglicher, 'no mutation of the original trip')
  assert.deepEqual(nachher, vorgeschlagener, 'no mutation of the proposed trip')
})

test('W2 #1299: saved commercial offer never becomes a confirmed booking', () => {
  const { vorher, nachher } = ändern()
  const offer = vorher.days[0].items[0]
  Object.assign(offer, {
    kind: 'activity', title: 'Angebot', bookingStatus: 'unconfirmed', bookingSource: null,
    provider: 'viator', priceAmount: 123.5, priceCurrency: 'CHF',
    bookingUrl: 'https://www.viator.com/tours/activity?aid=jetnity',
  })
  Object.assign(nachher.days[0].items[0], { ...offer, dayId: nachher.days[0].id })
  const rows = buchungsHinweise(vorher, nachher)
  assert.equal(rows.length, 2)
  const row = rows.find(r => r.id === offer.id)!
  assert.equal(row.status, 'unverbindliches_angebot')
  assert.equal(row.label, 'Unverbindliches Angebot – nicht gebucht')
  assert.match(row.handlung, /Preis und Verfügbarkeit erneut direkt beim Anbieter/)
  assert.equal(row.link, 'https://www.viator.com/tours/activity?aid=jetnity')
  assert.doesNotMatch(row.label, /bestätigte Buchung/)
  assert.match(row.preisHinweis, /123.5 CHF|123,5 CHF/)
  assert.match(row.preisHinweis, /Preis kann sich ändern/)
  assert.doesNotMatch(row.preisHinweis, /Aktualisiert am |Stand vom \d/)
})

test('W2 #1299: stored provider links are fail-closed with exact host-bound URLs', () => {
  const p = unterkunft()
  p.provider = 'viator'
  const safe = 'https://www.viator.com/booking/123'
  p.bookingUrl = safe
  assert.equal(gespeicherterAnbieterLink(p), safe)
  for (const bad of [
    'http://www.viator.com/booking',
    'https://user:secret@www.viator.com/booking',
    'https://viator.com.evil.example/booking',
    'https://notviator.com/booking',
    'https://127.0.0.1/booking',
    'https://viator.com:8080/booking',
    'javascript:alert(1)',
    'https://localhost/booking',
    'https://www.omio.com/booking',
  ]) {
    p.bookingUrl = bad
    assert.equal(gespeicherterAnbieterLink(p), null, bad)
  }
  p.bookingUrl = safe
  p.provider = null
  assert.equal(gespeicherterAnbieterLink(p), null)
  p.provider = 'unsupported-provider'
  assert.equal(gespeicherterAnbieterLink(p), null)
})

test('W2 #1299: price amount is not price freshness and never implies live availability', () => {
  const p = unterkunft()
  p.bookingStatus = 'unconfirmed'
  assert.equal(buchungsEinordnung(p).status, 'unverbindliches_angebot')
  p.priceAmount = 450
  const oldPrice = preisEinordnung(p)
  assert.match(oldPrice, /Preisstand mit Datum und Uhrzeit/)
  assert.match(oldPrice, /Preis kann sich ändern/)
  p.priceCurrency = null
  assert.doesNotMatch(preisEinordnung(p), /450 CHF/)
  p.priceAmount = null
  assert.doesNotMatch(preisEinordnung(p), /Zuletzt gespeicherter Betrag/)
})

test('W2 #1299: cosmetic trip title change does not imply provider effects', () => {
  const vorher = old()
  const nachher = { ...structuredClone(vorher), title: 'Neuer Reisetitel' }
  assert.deepEqual(buchungsHinweise(vorher, nachher), [])
})

test('W2 #1299: affected protected item selected but not booked still has honest guidance', () => {
  const { vorher, nachher } = ändern()
  const stay = vorher.days[3].items[0], afterStay = nachher.days[3].items[0]
  stay.bookingStatus = afterStay.bookingStatus = 'unconfirmed'
  stay.bookingSource = afterStay.bookingSource = null
  stay.priceAmount = afterStay.priceAmount = 75
  stay.priceCurrency = afterStay.priceCurrency = 'CHF'
  const one = buchungsHinweise(vorher, nachher)
  assert.equal(one.length, 1)
  assert.equal(one[0].status, 'unverbindliches_angebot')
  assert.match(one[0].handlung, /keine bestätigte Buchung/)
  assert.equal(one[0].link, null)
})
