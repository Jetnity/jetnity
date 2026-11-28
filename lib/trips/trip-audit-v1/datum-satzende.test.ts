// lib/trips/trip-audit-v1/datum-satzende.test.ts
//
// Work-Endtest 27.11.2026: «Zürich → Zermatt · 19. Dez..» in der Reiseprüfung.
// `datumKurz` liefert den Abkürzungspunkt («Dez.») selbst; der Satzpunkt darf ihn nicht
// verdoppeln. Geprüft wird der sichtbare Text der echten Befunde, nicht nur der Helfer.

import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TripAuditFinding } from '@/components/trips/TripAuditV1Panel'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { datumKurz } from '@/lib/trips/datum-anzeige'
import { tripAuditV1, type AuditFinding } from './audit'
import type { Trip, TripItem } from '@/types/trips'

const DOPPELPUNKT = /(?<!\.)\.\.(?!\.)/
const MONATE = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const

function imMonat(reise: Trip, monat: string): Trip {
  return JSON.parse(JSON.stringify(reise).replaceAll('2026-09-', `2026-${monat}-`)) as Trip
}

function offeneReise(monat: string): Trip {
  return imMonat(beispielreise(), monat)
}

function reiseMitBodenverbindung(monat: string): Trip {
  const reise = beispielreise()
  reise.originPlaceId = 'place:zurich'
  reise.stages = [
    { ...reise.stages[0], placeId: 'place:florence', countryCode: 'IT' },
    { ...reise.stages[1], placeId: 'place:rome', countryCode: 'IT' },
  ]
  const bahn: TripItem = {
    ...reise.days[0].items[0], id: 'rail-1', title: 'Zug Florenz–Rom', kind: 'transfer', note: null, position: 1,
    startsOn: '2026-09-15', startsAt: '08:00', endsOn: '2026-09-15', endsAt: '09:40',
    priceAmount: null, priceCurrency: null, provider: null, externalRef: null, bookingUrl: null,
    bookingStatus: 'unconfirmed', bookingSource: null, bookingConfirmedAt: null, mobilityMode: 'rail',
    originPlaceId: 'place:florence', destinationPlaceId: 'place:rome', originName: 'Nicht Florenz',
    destinationName: 'Nicht Rom', connectionRef: null, mobilityChanges: null, mobilityEvidence: 'user',
    stageId: 'stage-2',
  }
  reise.days = reise.days.map((tag, index) => ({ ...tag, items: index === 0 ? [bahn] : [] }))
  return imMonat(reise, monat)
}

function befund(bericht: ReturnType<typeof tripAuditV1>, domain: AuditFinding['domain'], abschnitt: string) {
  return bericht.findings.find((eintrag) => eintrag.domain === domain && eintrag.refs.sectionId === abschnitt)
}

function sichtbarerText(eintrag: AuditFinding): string {
  return renderToStaticMarkup(createElement(TripAuditFinding, { finding: eintrag }))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

test('Reiseprüfung: der 19. Dezember steht mit genau einem Punkt am Satzende', () => {
  const bericht = tripAuditV1(imMonat(beispielreise(), '12'))
  assert.equal(befund(bericht, 'flights', 'connection:stage-1:stage-2')?.detail, 'Florenz → Rom · 15. Dez.')
  assert.equal(befund(bericht, 'mobility', 'connection:stage-1:stage-2')?.detail, 'Florenz → Rom · 15. Dez.')
  assert.equal(befund(bericht, 'flights', 'outbound:stage-1')?.detail, 'Zürich → Florenz · 12. Dez.')
  assert.equal(befund(bericht, 'mobility', 'return:stage-2')?.detail, 'Rom → Zürich · 16. Dez.')
})

test('Reiseprüfung: März und Mai bleiben voll ausgeschrieben und bekommen den Satzpunkt', () => {
  const maerz = tripAuditV1(offeneReise('03'))
  assert.equal(befund(maerz, 'mobility', 'connection:stage-1:stage-2')?.detail, 'Florenz → Rom · 15. März.')
  const mai = tripAuditV1(offeneReise('05'))
  assert.equal(befund(mai, 'flights', 'outbound:stage-1')?.detail, 'Zürich → Florenz · 12. Mai.')
})

test('Reiseprüfung: kein Befund und kein Bereich enthält in einem der zwölf Monate «..»', () => {
  for (const monat of MONATE) {
    for (const reise of [offeneReise(monat), reiseMitBodenverbindung(monat)]) {
      const bericht = tripAuditV1(reise)
      const texte = [
        ...bericht.findings.map((eintrag) => eintrag.detail),
        ...bericht.sections.map((bereich) => bereich.detail),
      ]
      assert.ok(bericht.findings.some((eintrag) => eintrag.domain === 'flights'), `Monat ${monat}: Flugbefund vorhanden`)
      for (const text of texte) assert.doesNotMatch(text, DOPPELPUNKT, `Monat ${monat}: ${text}`)
      for (const eintrag of bericht.findings) {
        const sichtbar = sichtbarerText(eintrag)
        assert.doesNotMatch(sichtbar, DOPPELPUNKT, `Monat ${monat}: sichtbar «${sichtbar}»`)
      }
      for (const eintrag of bericht.findings.filter((e) => e.domain === 'flights' || e.domain === 'mobility')) {
        if (!eintrag.refs.sectionId) continue
        const etikett = datumKurz(`2026-${monat}-${eintrag.detail.match(/(\d{1,2})\. /)?.[1]?.padStart(2, '0') ?? '12'}`)
        assert.equal(eintrag.detail.includes(` · ${etikett}`), true, `Monat ${monat}: Datum unverändert (${eintrag.detail})`)
      }
    }
  }
})

test('Reiseprüfung: der sichtbare Text und der Name im Zugänglichkeitsbaum nennen das Datum einmal mit Punkt', () => {
  const bericht = tripAuditV1(imMonat(beispielreise(), '12'))
  const eintrag = befund(bericht, 'mobility', 'connection:stage-1:stage-2')!
  const markup = renderToStaticMarkup(createElement(TripAuditFinding, { finding: eintrag }))
  assert.match(markup, /<p[^>]*>Florenz → Rom · 15\. Dez\.<\/p>/)
  assert.doesNotMatch(markup, /aria-label|aria-description|title=/)
  assert.equal(sichtbarerText(eintrag), 'Planungslücke Keine Verbindung für diesen Abschnitt im Plan Florenz → Rom · 15. Dez.')
})

test('Reiseprüfung: Bodenverbindung nennt das Datum, danach beginnt ein neuer Satz ohne Doppelpunkt', () => {
  const bericht = tripAuditV1(reiseMitBodenverbindung('12'))
  const boden = befund(bericht, 'flights', 'connection:stage-1:stage-2')
  assert.equal(boden?.title, 'Bodenverbindung geplant, Flugbedarf nicht belegt')
  assert.match(boden?.detail ?? '', /^Florenz → Rom · 15\. Dez\. Im Plan ist eine Bodenverbindung für diesen Abschnitt gespeichert\./)
  const maerz = befund(tripAuditV1(reiseMitBodenverbindung('03')), 'flights', 'connection:stage-1:stage-2')
  assert.match(maerz?.detail ?? '', /^Florenz → Rom · 15\. März\. Im Plan ist eine Bodenverbindung/)
})

test('Reiseprüfung: fehlendes Datum endet ebenfalls mit genau einem Punkt', () => {
  const reise = beispielreise()
  reise.stages = reise.stages.map((etappe) => ({ ...etappe, arrivalDate: null, departureDate: null }))
  reise.days = reise.days.map((tag) => ({ ...tag, dayDate: null as unknown as string }))
  const bericht = tripAuditV1(reise)
  assert.equal(befund(bericht, 'flights', 'connection:stage-1:stage-2')?.detail, 'Florenz → Rom · Datum unbekannt.')
  assert.equal(befund(bericht, 'mobility', 'connection:stage-1:stage-2')?.detail, 'Florenz → Rom · Datum unbekannt.')
  for (const eintrag of bericht.findings.filter((e) => e.domain === 'flights' || e.domain === 'mobility')) {
    assert.doesNotMatch(eintrag.detail, DOPPELPUNKT, eintrag.detail)
  }
})
