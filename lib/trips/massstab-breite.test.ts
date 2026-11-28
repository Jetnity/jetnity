import assert from 'node:assert/strict'
import test from 'node:test'
import { massstabBreite } from '@/lib/trips/massstab-breite'

test('Massstabsleiste: Breite wächst mit der Wurzelschrift, damit die Beschriftung im Strich bleibt', () => {
  assert.equal(massstabBreite(16, 900), 100)
  assert.equal(massstabBreite(24, 900), 150)
  assert.equal(massstabBreite(32, 900), 200)
})

test('Massstabsleiste: kleinere Schrift als 100 % macht den Strich nicht schmaler', () => {
  assert.equal(massstabBreite(12, 900), 100)
})

test('Massstabsleiste: eine schmale Karte begrenzt die Breite, aber nicht unter 80 px', () => {
  assert.equal(massstabBreite(32, 288), 200)
  assert.equal(massstabBreite(32, 220), 196)
  assert.equal(massstabBreite(32, 100), 80)
})

test('Massstabsleiste: unbekannte Werte fallen auf die Basisbreite zurück', () => {
  assert.equal(massstabBreite(Number.NaN, Number.NaN), 100)
  assert.equal(massstabBreite(16, 0), 100)
})
