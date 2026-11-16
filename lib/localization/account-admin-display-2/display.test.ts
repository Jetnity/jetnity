// Actual Server/Client component rendering without a network, browser or DB.
// This proves presentation semantics, not authenticated Dev acceptance.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AccountBuchungen, { BuchungenLadeanzeige } from '@/components/account/AccountBuchungen'
import BuchungenFilter from '@/components/account/BuchungenFilter'
import AdminSnapshotRefresh from '@/components/admin/AdminSnapshotRefresh'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import TravelAnalytics from '@/components/admin/analytics/TravelAnalytics'
import { ausProblem } from '@/lib/admin/ladezustand'
import { BUCHUNGEN_COPY, buchungZeittext } from '@/lib/account/buchungen'
import { BUCHUNGEN_SCHLUESSEL, BUCHUNGEN_TEXTE, buchungenZeitAnzeigen } from '@/lib/localization/buchungen-texte'
import { ANALYTICS_SCHLUESSEL, ANALYTICS_TEXTE } from '@/lib/localization/analytics-texte'
import { analyticsFixture, bookingsFixture, BOOKING, OBSERVED_AT, ORIGINAL_DIAGNOSTIC, type BookingsFixtureState } from './fixtures'

function hrefs(html: string) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1].replaceAll('&amp;', '&'))
}

test('Optional display language keeps existing German callers and booking copy compatible', () => {
  const report = analyticsFixture()
  const ansicht = bookingsFixture()
  const fehler = ausProblem({ status: 503, message: ORIGINAL_DIAGNOSTIC })
  const filters = { titel: 'Ein Titel', art: 'flight', archiv: 'archiviert' as const, zurueckHref: '/account/bookings', standHref: '/account/bookings?art=flight' }
  assert.equal(renderToStaticMarkup(createElement(TravelAnalytics, { report })), renderToStaticMarkup(createElement(TravelAnalytics, { report, sprache: 'de' })))
  assert.equal(renderToStaticMarkup(createElement(AccountBuchungen, { ansicht })), renderToStaticMarkup(createElement(AccountBuchungen, { ansicht, sprache: 'de' })))
  assert.equal(renderToStaticMarkup(createElement(Fehlerflaeche, { fehler })), renderToStaticMarkup(createElement(Fehlerflaeche, { fehler, sprache: 'de' })))
  assert.equal(renderToStaticMarkup(createElement(AdminSnapshotRefresh, { observedAt: OBSERVED_AT })), renderToStaticMarkup(createElement(AdminSnapshotRefresh, { observedAt: OBSERVED_AT, sprache: 'de' })))
  assert.equal(renderToStaticMarkup(createElement(BuchungenFilter, filters)), renderToStaticMarkup(createElement(BuchungenFilter, { ...filters, sprache: 'de' })))
  for (const key of Object.keys(BUCHUNGEN_COPY) as (keyof typeof BUCHUNGEN_COPY)[]) {
    assert.equal(BUCHUNGEN_TEXTE.de[key], BUCHUNGEN_COPY[key], key)
  }
})

test('English changes labels without altering analytics data, selected ranges or calendar dates', () => {
  const report = analyticsFixture()
  const de = renderToStaticMarkup(createElement(TravelAnalytics, { report }))
  const en = renderToStaticMarkup(createElement(TravelAnalytics, { report, sprache: 'en' }))
  assert.deepEqual(hrefs(en), ['/admin/analytics?tage=7', '/admin/analytics?tage=30', '/admin/analytics?tage=90'])
  assert.deepEqual(hrefs(en), hrefs(de))
  assert.match(en, /lang="en"/)
  assert.match(en, /Trip activity/)
  assert.match(en, />1,234<\/dd>/)
  assert.match(en, /2026-11-09: 1 trip"/)
  assert.match(en, /2026-11-15: 7 trips/)
  assert.match(en, /<strong[^>]*>28<\/strong> new trips from 2026-11-09 to 2026-11-15/)
  assert.match(en, /neither the total number of registered accounts nor visitor statistics/)
  assert.match(en, /Revenue, bookings and conversion are not derived/)
  assert.match(en, /datetime="2026-11-15T12:00:00.000Z"/i)
  assert.match(en, /13:00:00/)
  assert.match(en, /Zurich/)
  assert.doesNotMatch(en, /Reiseaktivität|Gespeicherte Reisen|Tageswerte anzeigen/)
})

for (const sprache of ['de', 'en'] as const) {
  test(`Analytics ${sprache} preserves unavailable, partial source errors and confirmed zero`, () => {
    const unavailable = renderToStaticMarkup(createElement(TravelAnalytics, { report: analyticsFixture('unavailable'), sprache }))
    assert.doesNotMatch(unavailable, /<dd\b|<tbody\b/)
    assert.match(unavailable, sprache === 'en' ? /unavailable for this session/ : /keine Betriebszahlen verfügbar/)
    assert.doesNotMatch(unavailable, sprache === 'en' ? /No new trips were recorded/ : /keine neuen Reisen erfasst/)
    const partial = renderToStaticMarkup(createElement(TravelAnalytics, { report: analyticsFixture('partial'), sprache }))
    assert.match(partial, /role="alert"/)
    assert.match(partial, /Synthetischer Quellfehler &lt;unverändert&gt;/)
    assert.equal((partial.match(/<tr\b/g) ?? []).length, 8)
    assert.doesNotMatch(partial, /<dd\b/)
    const zero = renderToStaticMarkup(createElement(TravelAnalytics, { report: analyticsFixture('zero'), sprache }))
    assert.match(zero, sprache === 'en' ? /No new trips were recorded/ : /keine neuen Reisen erfasst/)
    assert.equal((zero.match(/>0<\/dd>/g) ?? []).length, 3)
    assert.doesNotMatch(zero, /role="alert"/)
  })

  test(`Admin error framing ${sprache} preserves source diagnostics, stale status and 503-only retry hint`, () => {
    for (const status of [500, 503] as const) {
      const html = renderToStaticMarkup(createElement(Fehlerflaeche, {
        fehler: ausProblem({ status, message: ORIGINAL_DIAGNOSTIC }), veraltet: true, sprache,
      }))
      assert.match(html, /role="alert"/)
      assert.match(html, /Synthetischer Quellfehler &lt;unverändert&gt;/)
      assert.match(html, sprache === 'en' ? /The refresh failed/ : /Die Aktualisierung ist fehlgeschlagen/)
      assert.match(html, sprache === 'en' ? /displayed data is older/ : /angezeigten Daten sind älter/)
      const hint = sprache === 'en' ? /Trying again may help/ : /Ein zweiter Versuch kann helfen/
      if (status === 503) assert.match(html, hint)
      else assert.doesNotMatch(html, hint)
      assert.doesNotMatch(html, /<button\b/, 'No callback means no retry action, in either language')
    }
  })

  const states = ['ungueltig', 'fehler', 'fehler503', 'leer', 'keine', 'fortsetzungLeer'] as const satisfies readonly BookingsFixtureState[]
  for (const state of states) {
    test(`Bookings ${sprache} keeps ${state} distinct from all other states`, () => {
      const html = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht: bookingsFixture(state), sprache }))
      const expected = {
        ungueltig: ['This address cannot be read.', 'Diese Adresse lässt sich nicht lesen.'],
        fehler: ['This is an error on our side, not in your data.', 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten.'],
        fehler503: ['We could not check your current records just now', 'Wir konnten deinen aktuellen Stand gerade nicht prüfen'],
        leer: ['No confirmed bookings yet.', 'Noch keine bestätigten Buchungen.'],
        keine: ['No booking matches this search.', 'Keine Buchung passt zu dieser Suche.'],
        fortsetzungLeer: ['This does not mean the account is empty', 'Das Konto ist deshalb nicht leer'],
      }[state][sprache === 'en' ? 0 : 1]
      assert.ok(html.includes(expected), expected)
      assert.match(html, new RegExp(`data-buchungen="${state === 'fehler503' ? 'fehler' : state}"`))
      assert.match(html, state === 'ungueltig' || state.startsWith('fehler') ? /role="alert"/ : /role="status"/)
      if (state !== 'leer') assert.doesNotMatch(html, /Noch keine bestätigten Buchungen\.|No confirmed bookings yet\./)
      assert.deepEqual(hrefs(html), hrefs(renderToStaticMarkup(createElement(AccountBuchungen, { ansicht: bookingsFixture(state) }))))
    })
  }

  test(`Bookings ${sprache} preserves user text, booking links, legacy props and loading semantics`, () => {
    const ansicht = bookingsFixture()
    const html = renderToStaticMarkup(createElement(AccountBuchungen, { ansicht, sprache }))
    assert.match(html, /Synthetischer Flug &amp; eigener Titel/)
    assert.match(html, /Eigene Reise nach Zürich/)
    assert.ok(html.includes(sprache === 'en' ? '2026-12-01, 07:15' : buchungZeittext(BOOKING)!))
    assert.deepEqual(hrefs(html), hrefs(renderToStaticMarkup(createElement(AccountBuchungen, { ansicht }))))
    assert.match(html, sprache === 'en' ? /not confirmation from an airline, hotel or other supplier/ : /keine Bestätigung durch eine Airline/)
    assert.match(html, sprache === 'en' ? />Archived<\/p>/ : />Archiviert<\/p>/)
    const legacy = renderToStaticMarkup(createElement(AccountBuchungen, { problem: null, buchungen: [BOOKING], abgeschnitten: false, sprache }))
    assert.match(legacy, /data-buchungen="liste"/)
    assert.match(legacy, /Synthetischer Flug &amp; eigener Titel/)
    const loading = renderToStaticMarkup(createElement(BuchungenLadeanzeige, { sprache }))
    assert.match(loading, /aria-busy="true" aria-live="polite"/)
    assert.match(loading, sprache === 'en' ? /Loading bookings\./ : /Buchungen werden geladen\./)
    assert.match(loading, new RegExp(`lang="${sprache}"`))
  })
}

test('English filter labels retain the original field names, enum values, selected values and limits', () => {
  const html = renderToStaticMarkup(createElement(BuchungenFilter, {
    titel: 'Eigener Titel & mehr', art: 'rental_car', archiv: 'archiviert',
    zurueckHref: '/account/bookings', standHref: '/account/bookings?art=rental_car&archiv=archiviert', sprache: 'en',
  }))
  assert.match(html, /<form\b[^>]*method="get"/i)
  assert.match(html, /<form\b[^>]*action="\/account\/bookings"/i)
  assert.match(html, /<input\b(?=[^>]*name="titel")(?=[^>]*maxlength="120")(?=[^>]*value="Eigener Titel &amp; mehr")[^>]*>/i)
  assert.match(html, /name="art"/)
  assert.match(html, /name="archiv"/)
  assert.match(html, /<option\b(?=[^>]*value="rental_car")(?=[^>]*selected="")[^>]*>Rental car<\/option>/)
  assert.match(html, /<option\b(?=[^>]*value="archiviert")(?=[^>]*selected="")[^>]*>Archived trips<\/option>/)
  assert.deepEqual([...html.matchAll(/<option\b[^>]*value="([^"]*)"/g)].map((match) => match[1]),
    ['', 'flight', 'stay', 'transfer', 'rental_car', 'alle', 'aktiv', 'archiviert'])
})

test('English date presentation keeps exact stored days and missing endpoints without timezone or year inference', () => {
  const cases = [
    [{ startsOn: '2026-12-31', startsAt: '23:45', endsOn: '2027-01-01' }, '2026-12-31, 23:45 – 2027-01-01'],
    [{ startsOn: '2026-12-31', startsAt: null, endsOn: '2026-12-31' }, '2026-12-31'],
    [{ startsOn: null, startsAt: null, endsOn: '2027-01-01' }, '2027-01-01'],
    [{ startsOn: null, startsAt: '07:15', endsOn: null }, '07:15'],
    [{ startsOn: null, startsAt: null, endsOn: null }, null],
  ] as const
  for (const [input, expected] of cases) {
    assert.equal(buchungenZeitAnzeigen(input, 'en'), expected)
    assert.equal(buchungenZeitAnzeigen(input, 'de'), buchungZeittext(input))
  }
})

test('Catalog exports only implemented booking labels and preserves analytics placeholder facts', () => {
  const keys: readonly string[] = BUCHUNGEN_SCHLUESSEL
  for (const outside of ['einstieg', 'einstiegHinweis', 'offenGruppe', 'archivGruppe', 'archivHinweis', 'art.activity', 'art.note']) {
    assert.equal(keys.includes(outside), false, `Unchanged surface must not be included: ${outside}`)
  }
  for (const key of ANALYTICS_SCHLUESSEL) {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
    assert.deepEqual(placeholders(ANALYTICS_TEXTE.en[key]), placeholders(ANALYTICS_TEXTE.de[key]), key)
  }
})
