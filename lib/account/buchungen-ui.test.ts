import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ACCOUNT_NAVIGATION } from '@/lib/account/navigation'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const RUNTIME = [
  '../../lib/account/buchungen.ts',
  '../../lib/account/buchungen-daten.ts',
  '../../components/account/AccountBuchungen.tsx',
  '../../app/account/bookings/page.tsx',
  '../../app/account/bookings/loading.tsx',
  '../../components/account/AccountUebersicht.tsx',
]

describe('AP-10-S1 Buchungsordner Vertrag', () => {
  test('Account-Navigation bleibt genau vier Punkte', () => {
    assert.deepEqual(
      ACCOUNT_NAVIGATION.map((eintrag) => eintrag.label),
      ['Übersicht', 'Reisen', 'Reisende', 'Einstellungen'],
    )
    const hrefs: string[] = ACCOUNT_NAVIGATION.map((eintrag) => eintrag.href)
    assert.equal(hrefs.includes('/account/bookings'), false)
  })

  test('Route existiert und bleibt hinter der Account-Auth', () => {
    const seite = quelle('../../app/account/bookings/page.tsx')
    const proxy = quelle('../../proxy.ts')
    assert.match(seite, /buchungenLaden/)
    assert.match(seite, /AccountBuchungen/)
    assert.match(seite, /force-dynamic/)
    assert.match(proxy, /pathname\.startsWith\('\/account'\)/)
    assert.match(proxy, /redirectToLogin\(req, '\/login'\)/)
    assert.equal(seite.includes('createServiceRole'), false)
    assert.equal(seite.includes('SERVICE_ROLE'), false)
  })

  test('liest owner-scoped über authenticated RLS und nicht über Service Role', () => {
    const laden = quelle('../../lib/account/buchungen-daten.ts')
    assert.match(laden, /import 'server-only'/)
    assert.match(laden, /createServerComponentClient/)
    assert.match(laden, /problemAus/)
    assert.match(laden, /booking_status/)
    assert.match(laden, /trips!inner\(id, title, status\)/)
    assert.match(laden, /order\('booking_confirmed_at', \{ ascending: false, nullsFirst: false \}\)/)
    assert.match(laden, /order\('id', \{ ascending: true \}\)/)
    const ordnung = laden.indexOf("order('booking_confirmed_at'")
    const grenze = laden.indexOf('.limit(')
    assert.equal(ordnung >= 0 && grenze > ordnung, true)
    assert.equal(laden.includes("eq('user_id'"), false)
    assert.equal(laden.includes('createServiceRole'), false)
    assert.equal(laden.includes('SERVICE_ROLE'), false)
    assert.equal(laden.includes('createAdminClient'), false)
    assert.equal(/insert\(|update\(|delete\(|rpc\(/.test(laden), false)
    assert.equal(laden.includes('price_amount'), false)
    assert.equal(laden.includes('booking_url'), false)
    assert.equal(laden.includes('provider'), false)
    assert.equal(laden.includes('account_traveller'), false)
    assert.equal(laden.includes('citizenship'), false)
  })

  test('Empty und Error bleiben in der Oberfläche getrennt', () => {
    const ui = quelle('../../components/account/AccountBuchungen.tsx')
    assert.match(ui, /role="alert"/)
    assert.match(ui, /BUCHUNGEN_COPY.fehlerTitel/)
    assert.match(ui, /BUCHUNGEN_COPY.leerTitel/)
    assert.match(ui, /buchungReisePfad/)
    assert.match(ui, /archivKennzeichen/)
    assert.equal(ui.includes('Keine Buchungen konnten nicht'), false)
    assert.doesNotMatch(ui, /priceAmount|price_amount|CHF |Affiliate|booking_url|bookingUrl/)
  })

  test('Übersicht bleibt ohne Booking-Dashboard', () => {
    const uebersicht = quelle('../../components/account/AccountUebersicht.tsx')
    assert.match(uebersicht, /\/account\/bookings/)
    assert.match(uebersicht, /BUCHUNGEN_COPY.einstieg/)
    assert.equal(uebersicht.includes('AccountBuchungen'), false)
    assert.equal(uebersicht.includes('FlugSuche'), false)
  })

  test('Runtime enthält keinen Write-Pfad und keine Traveller-PII', () => {
    for (const datei of RUNTIME) {
      const text = quelle(datei)
      assert.equal(text.includes('createServiceRole'), false, datei)
      assert.equal(text.includes('SUPABASE_SERVICE_ROLE_KEY'), false, datei)
      assert.doesNotMatch(text, /from\('account_travellers'\)/)
      assert.doesNotMatch(text, /from\('payments'\)/)
    }
  })

  test('verwendet den bestehenden Booking-Vertrag statt einer zweiten Wahrheit', () => {
    const abbildung = quelle('../../lib/account/buchungen.ts')
    assert.match(abbildung, /kannBuchungMarkieren/)
    assert.match(abbildung, /istGebucht/)
    assert.match(abbildung, /istArchiviert/)
    assert.match(abbildung, /ART_BEZEICHNUNG/)
    assert.match(abbildung, /tripStatusLesen/)
    assert.match(abbildung, /TRIP_STATUSES/)
    assert.equal(abbildung.includes(": 'draft'"), false)
    assert.equal(abbildung.includes("booking_status = 'confirmed'"), false)
    const ui = quelle('../../components/account/AccountBuchungen.tsx')
    assert.doesNotMatch(ui, /bookingConfirmedAt|booking_confirmed_at/)
    assert.match(abbildung, /export type KontoBuchung = \{[^}]*tripArchived: boolean\n\}/)
    assert.doesNotMatch(abbildung, /export type KontoBuchung = \{[^}]*bookingConfirmedAt/)
  })
})
