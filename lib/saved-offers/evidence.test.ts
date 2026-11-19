import { test } from 'node:test'
import assert from 'node:assert/strict'
import { savedOfferEvidence } from './evidence'

test('manuelle und Anbieterreferenzen unterscheiden echte Herkunft und fehlenden Preis', () => {
  const manual = savedOfferEvidence({ source: 'manual', provider: 'booking.com', expires_at: null }, 1000)
  assert.match(manual.herkunft, /selbst erfasster/)
  assert.match(manual.preis, /nicht geprüft/)
  assert.match(manual.frist, /Ohne Anbieter-Gültigkeitsnachweis/)
  assert.match(manual.buchung, /nicht gebucht/)
  const auto = savedOfferEvidence({ source: 'discovercars', provider: 'DiscoverCars', expires_at: '2026-11-22T00:00:00.000Z' }, Date.parse('2026-11-19T12:00:00Z'))
  assert.match(auto.herkunft, /DiscoverCars/)
  assert.match(auto.frist, /kein aktueller Preisnachweis/)
  assert.equal(auto.buchung, manual.buchung)
})

test('abgelaufene Referenzen werden nie als frisch oder gebucht ausgegeben', () => {
  const expired = savedOfferEvidence({ source: 'discovercars', provider: 'DiscoverCars', expires_at: '2026-11-18T00:00:00Z' }, Date.parse('2026-11-19T00:00:00Z'))
  assert.match(expired.frist, /abgelaufen/)
  assert.match(expired.preis, /nicht geprüft/)
  assert.match(expired.buchung, /nicht gebucht/)
  const malformed = savedOfferEvidence({ source: 'manual', provider: 'x.example', expires_at: 'broken' }, Date.now())
  assert.match(malformed.frist, /Ohne Anbieter-Gültigkeitsnachweis/)
  assert.doesNotMatch(malformed.frist, /frisch|bestätigt/)
})
