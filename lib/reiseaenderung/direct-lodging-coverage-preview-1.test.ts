import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReiseAenderungAuswirkungen from '@/components/trips/ReiseAenderungAuswirkungen'
import { manuellerEntwurf, vorschauKennungen } from '@/lib/reiseaenderung/direct/entwurf'
import { auswirkungen } from '@/lib/reiseaenderung/direct/auswirkungen'
import { naechteHalboffen, unterkunftAbdeckung, type UnterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import { datumVerschieben } from '@/lib/trips/tage'
import { fixture } from '@/scripts/direct-trip-editing-1/fixture'
import type { Trip, TripItem } from '@/types/trips'

const seed = '817a7ff5-1359-48d8-952c-893932c2b741'
const TITEL = 'Unterkunftsplanung nach der Änderung'

function vorschlag(trip: Trip, input: unknown, quelle: 'guest' | 'account' = 'guest'): Trip {
  const ergebnis = manuellerEntwurf(trip, input, vorschauKennungen(seed), quelle)
  assert.equal(ergebnis.ok, true, !ergebnis.ok ? ergebnis.meldung : '')
  if (!ergebnis.ok) throw new Error('unreachable')
  return ergebnis.nachher
}

function textVon(vorher: Trip, nachher: Trip, lesen?: (reise: Trip) => UnterkunftAbdeckung): string {
  return auswirkungen(vorher, nachher, lesen).find(gruppe => gruppe.titel === TITEL)?.zeilen.map(zeile => zeile.text).join('\n') ?? ''
}

function zeilenVon(vorher: Trip, nachher: Trip) {
  return auswirkungen(vorher, nachher).find(gruppe => gruppe.titel === TITEL)?.zeilen ?? []
}

function spiegelt(text: string, label: string, wert: UnterkunftAbdeckung) {
  assert.equal(wert.bekannt, true)
  assert.match(text, new RegExp(`${label}: ${wert.naechteAbgedeckt} von ${wert.naechteGesamt} Nächten im aufgezeichneten Plan abgedeckt, ${wert.naechteGebucht} vom Nutzer als gebucht markiert, ${wert.naechteAusgewaehlt} ausgewählt`))
  assert.match(text, /Die Check-in-Nacht zählt, die Check-out-Nacht nicht/)
  assert.match(text, /keine Anbieterbestätigung, keine Verfügbarkeit und keine Reisebereitschaft/)
  for (const luecke of wert.luecken) {
    assert.ok(text.includes(`${label}, Lücke: Check-in ${luecke.start}, Check-out ${luecke.end}, ${luecke.naechte} Nächte`))
    if (luecke.stageId) assert.ok(text.includes(`Etappe ${luecke.stageId}`))
    else assert.ok(text.includes('ohne Etappenzuordnung'))
  }
  const ohneTag = wert.aufenthalte.filter(aufenthalt => aufenthalt.item.dayId === null).length
  assert.ok(text.includes(`${label}: ${wert.aufenthalte.length} aufgezeichnete Unterkünfte, davon ${ohneTag} ohne Tag, jede davon genau einmal gezählt`))
}

function aufenthalt(basis: TripItem, teil: Partial<TripItem> & Pick<TripItem, 'id' | 'startsOn' | 'endsOn'>): TripItem {
  return {
    ...basis,
    dayId: null,
    stageId: null,
    title: teil.id,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    ...teil,
  }
}

test('date shift keeps protected stay dates and shows canonical before/after coverage', () => {
  const before = fixture()
  const originalStay = structuredClone(before.days[3].items[0])
  const after = vorschlag(before, { startDate: '2026-10-09' })
  const stay = [...after.days.flatMap(tag => tag.items), ...after.ohneTag].find(punkt => punkt.id === 'item-4')
  assert.deepEqual(stay && { startsOn: stay.startsOn, endsOn: stay.endsOn, priceAmount: stay.priceAmount, bookingStatus: stay.bookingStatus, bookingUrl: stay.bookingUrl }, {
    startsOn: originalStay.startsOn, endsOn: originalStay.endsOn, priceAmount: originalStay.priceAmount, bookingStatus: originalStay.bookingStatus, bookingUrl: originalStay.bookingUrl,
  })
  const vorher = unterkunftAbdeckung(before)
  const nachher = unterkunftAbdeckung(after)
  assert.notDeepEqual(
    [vorher.naechteAbgedeckt, vorher.luecken.map(luecke => [luecke.stageId, luecke.start, luecke.end])],
    [nachher.naechteAbgedeckt, nachher.luecken.map(luecke => [luecke.stageId, luecke.start, luecke.end])],
  )
  const text = textVon(before, after)
  spiegelt(text, 'Bisheriger gespeicherter Plan', vorher)
  spiegelt(text, 'Vorschau nach deiner Änderung', nachher)
  assert.match(text, /Etappe stage-1 „Florenz“/)
  assert.match(text, /Etappe stage-2 „Florenz“/)
  assert.doesNotMatch(text, /Ein Vergleich der beiden Seiten ist nicht möglich/)
  assert.deepEqual(before.days[3].items[0], originalStay)
})

test('stage duration changes use the canonical reader and do not rewrite the protected stay', () => {
  const before = fixture()
  const longer = vorschlag(before, { duration: 6 })
  const stayBefore = before.days[3].items[0]
  const stayAfter = [...longer.days.flatMap(tag => tag.items), ...longer.ohneTag].find(punkt => punkt.id === stayBefore.id)
  assert.equal(stayAfter?.startsOn, stayBefore.startsOn)
  assert.equal(stayAfter?.endsOn, stayBefore.endsOn)
  assert.equal(stayAfter?.priceAmount, stayBefore.priceAmount)
  const text = textVon(before, longer)
  spiegelt(text, 'Bisheriger gespeicherter Plan', unterkunftAbdeckung(before))
  spiegelt(text, 'Vorschau nach deiner Änderung', unterkunftAbdeckung(longer))

  const shortened = vorschlag(before, { stages: [{ id: 'stage-1', days: 1 }], duration: 3 })
  const shortenedStay = [...shortened.days.flatMap(tag => tag.items), ...shortened.ohneTag].find(punkt => punkt.id === stayBefore.id)
  assert.equal(shortenedStay?.startsOn, stayBefore.startsOn)
  assert.equal(shortenedStay?.endsOn, stayBefore.endsOn)
  const nachher = unterkunftAbdeckung(shortened)
  assert.equal(nachher.bekannt, false)
  const shortenedText = textVon(before, shortened)
  spiegelt(shortenedText, 'Bisheriger gespeicherter Plan', unterkunftAbdeckung(before))
  assert.match(shortenedText, /Vorschau nach deiner Änderung: Unterkunftsstand noch unklar/)
  assert.match(shortenedText, /Ein Vergleich der beiden Seiten ist nicht möglich/)
  assert.doesNotMatch(shortenedText, /Vorschau nach deiner Änderung: \d+ von \d+ Nächten/)
})

test('overlapping stays use the canonical union, not the sum of stay nights', () => {
  const basis = fixture()
  const before = fixture()
  before.startDate = '2026-08-30'
  before.endDate = '2026-09-13'
  before.days = []
  before.stages = [{ ...basis.stages[0], id: 'stage-bali', name: 'Bali', arrivalDate: '2026-08-30', departureDate: '2026-09-13' }]
  before.ohneTag = [
    aufenthalt(basis.days[3].items[0], { id: 'stay-a', startsOn: '2026-08-30', endsOn: '2026-09-08' }),
    aufenthalt(basis.days[3].items[0], { id: 'stay-b', startsOn: '2026-09-03', endsOn: '2026-09-13', position: 2 }),
  ]
  const after = structuredClone(before)
  after.endDate = '2026-09-05'
  after.stages[0].departureDate = '2026-09-05'
  const vorher = unterkunftAbdeckung(before)
  const summe = naechteHalboffen('2026-08-30', '2026-09-08').length + naechteHalboffen('2026-09-03', '2026-09-13').length
  assert.notEqual(vorher.naechteAbgedeckt, summe)
  const text = textVon(before, after)
  spiegelt(text, 'Bisheriger gespeicherter Plan', vorher)
  spiegelt(text, 'Vorschau nach deiner Änderung', unterkunftAbdeckung(after))
})

test('incomplete stage dates and unknown stay dates stay unknown, without a conclusive comparison', () => {
  const incomplete = fixture()
  incomplete.stages[1].departureDate = null
  const complete = structuredClone(incomplete)
  complete.stages[1].departureDate = '2026-10-10'
  const incompleteText = textVon(incomplete, complete)
  assert.match(incompleteText, /Bisheriger gespeicherter Plan: Unterkunftsstand noch unklar/)
  assert.match(incompleteText, /Eine Gesamtaussage zur Abdeckung ist nicht möglich/)
  assert.match(incompleteText, /Ein Vergleich der beiden Seiten ist nicht möglich\. Jede Seite gilt nur für sich\./)
  assert.doesNotMatch(incompleteText, /Bisheriger gespeicherter Plan: \d+ von \d+ Nächten/)
  spiegelt(incompleteText, 'Vorschau nach deiner Änderung', unterkunftAbdeckung(complete))

  const unknown = fixture()
  unknown.days[3].items[0].startsOn = null
  unknown.days[3].items[0].endsOn = null
  const shifted = vorschlag(unknown, { startDate: '2026-10-09' })
  const unknownText = textVon(unknown, shifted)
  assert.match(unknownText, /Bisheriger gespeicherter Plan: Unterkunftsstand noch unklar/)
  assert.match(unknownText, /Vorschau nach deiner Änderung: Unterkunftsstand noch unklar/)
  assert.doesNotMatch(unknownText, /\d+ von \d+ Nächten/)
  assert.match(unterkunftAbdeckung(unknown).zusammenfassung, /unklar/)
  assert.notEqual(unterkunftAbdeckung(unknown).naechteGesamt, null)
})

test('repeated stage names stay distinguished by stage id', () => {
  const before = fixture()
  assert.equal(before.stages[0].name, before.stages[1].name)
  assert.notEqual(before.stages[0].id, before.stages[1].id)
  const text = textVon(before, vorschlag(before, { startDate: '2026-10-09' }))
  assert.match(text, /Etappe stage-1 „Florenz“/)
  assert.match(text, /Etappe stage-2 „Florenz“/)
  const ids = new Set(zeilenVon(before, vorschlag(fixture(), { startDate: '2026-10-09' })).map(zeile => zeile.id))
  assert.equal(ids.size, zeilenVon(before, vorschlag(fixture(), { startDate: '2026-10-09' })).length)
})

test('an unassigned stay is counted once', () => {
  const before = fixture()
  const stay = before.days[3].items[0]
  before.days[3].items = []
  before.ohneTag = [{ ...stay, dayId: null, stageId: null }]
  const after = vorschlag(before, { startDate: '2026-10-09' })
  const kanonisch = unterkunftAbdeckung(after)
  assert.equal(kanonisch.aufenthalte.length, 1)
  assert.equal(kanonisch.aufenthalte[0]?.item.id, stay.id)
  assert.equal(unterkunftAbdeckung(after, [...after.ohneTag, ...after.ohneTag]).aufenthalte.length, 2)
  const text = textVon(before, after)
  assert.match(text, /1 aufgezeichnete Unterkünfte, davon 1 ohne Tag, jede davon genau einmal gezählt/)
  spiegelt(text, 'Vorschau nach deiner Änderung', kanonisch)
})

test('title and budget edits do not invent lodging impact or call the reader', () => {
  const before = fixture()
  const after = vorschlag(before, { title: 'Nur ein Titel', budgetAmount: 40 })
  let aufrufe = 0
  const gruppen = auswirkungen(before, after, () => { aufrufe += 1; return unterkunftAbdeckung(before) })
  assert.equal(aufrufe, 0)
  assert.equal(gruppen.some(gruppe => gruppe.titel === TITEL), false)
  assert.equal(gruppen.some(gruppe => gruppe.titel === 'Grunddaten und Zeitraum'), true)
})

test('guest and account previews match, and the preview does not persist or mutate', () => {
  const input = { startDate: '2026-10-09' }
  const guestBefore = fixture()
  const accountBefore = fixture()
  const guest = vorschlag(guestBefore, input, 'guest')
  const account = vorschlag(accountBefore, input, 'account')
  assert.deepEqual(auswirkungen(guestBefore, guest), auswirkungen(accountBefore, account))
  const before = fixture()
  const after = vorschlag(before, input)
  const frozenBefore = structuredClone(before)
  const frozenAfter = structuredClone(after)
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const map = new Map<string, string>()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
  } } })
  try {
    auswirkungen(before, after)
    assert.equal(map.size, 0)
    assert.deepEqual(before, frozenBefore)
    assert.deepEqual(after, frozenAfter)
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('an excessive stay or stage span is unavailable and the reader is not called for that side', () => {
  const before = fixture()
  const hugeStay = structuredClone(before)
  hugeStay.days[3].items[0] = { ...hugeStay.days[3].items[0], startsOn: '1000-01-01', endsOn: '2000-01-01' }
  const seenStay: Trip[] = []
  const stayText = textVon(before, hugeStay, reise => { seenStay.push(reise); return unterkunftAbdeckung(fixture()) })
  assert.deepEqual(seenStay.map(reise => reise.days[3].items[0].startsOn), [before.days[3].items[0].startsOn])
  assert.match(stayText, /Vorschau nach deiner Änderung: Unterkunftsplanung nicht verfügbar\. Es wird keine Abdeckung von 0 angenommen\./)
  assert.match(stayText, /Jede Seite gilt nur für sich/)
  assert.doesNotMatch(stayText, /0 von \d+ Nächten/)
  const realStayText = textVon(before, hugeStay)
  assert.match(realStayText, /Unterkunftsplanung nicht verfügbar/)
  assert.doesNotMatch(realStayText, /0 von \d+ Nächten/)

  const hugeStage = structuredClone(before)
  hugeStage.stages = [{ ...hugeStage.stages[0], arrivalDate: '2026-01-01', departureDate: datumVerschieben('2026-01-01', 366)! }]
  const seenStage: string[] = []
  const stageText = textVon(before, hugeStage, reise => { seenStage.push(reise.stages.map(etappe => etappe.departureDate).join(',')); return unterkunftAbdeckung(fixture()) })
  assert.deepEqual(seenStage, [before.stages.map(etappe => etappe.departureDate).join(',')])
  assert.match(stageText, /Vorschau nach deiner Änderung: Unterkunftsplanung nicht verfügbar/)
  assert.match(textVon(before, hugeStage), /Unterkunftsplanung nicht verfügbar/)
})

test('excessive aggregate work admits neither side and still does not block the edit', () => {
  const schwer = (naechte: number) => {
    const reise = fixture()
    const ende = datumVerschieben('2026-01-01', naechte)!
    reise.stages = Array.from({ length: 22 }, (_, index) => ({
      ...reise.stages[0], id: `stage-span-${index}`, name: 'Florenz', position: index + 1,
      arrivalDate: '2026-01-01', departureDate: ende,
    }))
    return reise
  }
  const before = schwer(360)
  const after = schwer(300)
  const seen: string[] = []
  const text = textVon(before, after, reise => { seen.push(reise.stages[0]?.departureDate ?? ''); return unterkunftAbdeckung(fixture()) })
  assert.deepEqual(seen, [])
  assert.match(text, /Bisheriger gespeicherter Plan: Unterkunftsplanung nicht verfügbar/)
  assert.match(text, /Vorschau nach deiner Änderung: Unterkunftsplanung nicht verfügbar/)
  assert.match(text, /keine Abdeckung von 0 angenommen/)
  assert.doesNotMatch(text, /\d+ von \d+ Nächten/)
  assert.equal(manuellerEntwurf(fixture(), { startDate: '2026-10-09' }, vorschauKennungen(seed)).ok, true)
  assert.doesNotThrow(() => auswirkungen(before, after))
})

test('a repository-max span is admitted, and more than twenty gap rows stay intact for the existing pager', () => {
  const before = fixture()
  before.stages = [{ ...before.stages[0], arrivalDate: '2026-01-01', departureDate: datumVerschieben('2026-01-01', 365)! }]
  const after = structuredClone(before)
  after.startDate = datumVerschieben(before.startDate, 1)
  after.endDate = datumVerschieben(before.endDate, 1)
  let aufrufe = 0
  const gruppen = auswirkungen(before, after, reise => { aufrufe += 1; return unterkunftAbdeckung(reise) })
  assert.equal(aufrufe, 2)
  assert.equal(gruppen.some(gruppe => gruppe.titel === TITEL), false)

  const fragmented = fixture()
  fragmented.days = []
  fragmented.ohneTag = []
  fragmented.startDate = '2026-01-01'
  fragmented.endDate = datumVerschieben('2026-01-01', 42)
  fragmented.stages = [{ ...fixture().stages[0], id: 'stage-fragment', name: 'Florenz', arrivalDate: '2026-01-01', departureDate: fragmented.endDate! }]
  for (let offset = 0; offset < 42; offset += 2) {
    const start = datumVerschieben('2026-01-01', offset)!
    fragmented.ohneTag.push(aufenthalt(fixture().days[3].items[0], {
      id: `stay-${offset}`, startsOn: start, endsOn: datumVerschieben(start, 1)!, position: offset + 1,
    }))
  }
  const changed = structuredClone(fragmented)
  changed.stages[0].departureDate = datumVerschieben(fragmented.stages[0].departureDate, -1)
  changed.endDate = changed.stages[0].departureDate
  const rows = zeilenVon(fragmented, changed)
  assert.ok(rows.length > 20)
  assert.equal(new Set(rows.map(zeile => zeile.id)).size, rows.length)
  const html = renderToStaticMarkup(createElement(ReiseAenderungAuswirkungen, { vorher: fragmented, nachher: changed }))
  assert.match(html, new RegExp(`Unterkunftsplanung nach der Änderung \\(${rows.length}\\)`))
  assert.match(html, /Grunddaten und Zeitraum/)
  assert.match(html, /Buchungen werden weder umgebucht noch storniert/)
  assert.equal(html.includes('Check-in 2026-01-02'), false)
})

test('a reader failure degrades to an unknown preview and does not fail the edit', () => {
  const before = fixture()
  const after = vorschlag(before, { startDate: '2026-10-09' })
  const text = textVon(before, after, () => { throw new Error('reader down') })
  assert.match(text, /Bisheriger gespeicherter Plan: Unterkunftsplanung nicht verfügbar/)
  assert.match(text, /Vorschau nach deiner Änderung: Unterkunftsplanung nicht verfügbar/)
  assert.doesNotMatch(text, /0 von \d+ Nächten/)
  assert.equal(vorschlag(fixture(), { title: 'Weiterhin bestätigbar' }).title, 'Weiterhin bestätigbar')
})
