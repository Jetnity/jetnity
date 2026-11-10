import assert from 'node:assert/strict'
import test from 'node:test'
import { bookingFlugSuche } from './booking-flug'
import { kategorieFuerBereich, modusAusQuery, modusUrl } from '../workspace-mode'

const basis = {
  von: 'ZRH',
  nach: 'BKK',
  rueckflugAb: 'HKT',
  hin: '2027-03-12',
  rueck: '2027-03-19',
  gaeste: 2,
  kabine: 'business' as const,
  direkt: true,
  waehrung: 'CHF',
}
const heute = '2027-01-01'

test('Booking übernimmt Termine, Strecke, Klasse und Direktflugwahl für jede Reiseart', () => {
  for (const art of ['einfach', 'retour', 'gabel'] as const) {
    const suche = bookingFlugSuche({ ...basis, art }, heute)
    assert.ok('ziel' in suche)
    const url = new URL(suche.ziel)
    assert.equal(url.hostname, 'flights.booking.com')
    const query = url.searchParams
    assert.equal(query.get('adults'), '2')
    assert.equal(query.get('cabinClass'), 'BUSINESS')
    assert.equal(query.get('currency'), 'CHF')
    assert.equal(query.get('stops'), '0')
    assert.equal(query.get('from'), art === 'gabel' ? 'ZRH.AIRPORT|HKT.AIRPORT' : 'ZRH.AIRPORT')
    assert.equal(query.get('to'), art === 'gabel' ? 'BKK.AIRPORT|ZRH.AIRPORT' : 'BKK.AIRPORT')
    assert.equal(query.get('multiStopDates'), art === 'gabel' ? '2027-03-12|2027-03-19' : null)
    assert.equal(query.get('return'), art === 'retour' ? basis.rueck : null)
  }
})

test('Eine ungültige Strecke oder unvollständige Daten erzeugen keinen Partnerlink', () => {
  for (const felder of [
    { hin: '2027-02-31' },
    { rueck: '2027-02-01' },
    { nach: 'ZRH' },
    { rueckflugAb: '' },
    { gaeste: 0 },
    { von: 'ZH?' },
  ]) {
    assert.ok('fehler' in bookingFlugSuche({ ...basis, art: 'gabel', ...felder }, heute))
  }
})

test('Neue Kategorien und bestehende Bereichslinks öffnen denselben Organisationsreiter', () => {
  for (const bereich of ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'] as const) {
    const vorher = modusAusQuery(new URLSearchParams({ ansicht: 'organisieren', bereich }))
    assert.equal(kategorieFuerBereich(vorher.bereich), bereich === 'mobilitaet' ? 'verbindungen' : bereich)
  }
  const modus = modusAusQuery(new URLSearchParams('ansicht=organisieren&kategorie=mietwagen'))
  assert.equal(modus.kategorie, 'mietwagen')
  assert.equal(modusUrl('/reisen/test', modus), '/reisen/test?ansicht=organisieren&kategorie=mietwagen')
  assert.equal(
    modusUrl('/reisen/test?ansicht=organisieren&kategorie=mietwagen', {
      ansicht: 'uebersicht',
      bereich: null,
    }),
    '/reisen/test',
  )
})
