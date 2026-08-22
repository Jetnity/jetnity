import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { rentalCarManuellSchema, rentalCarSucheEingabeSchema, rentalTitelAus } from '@/lib/rental-cars/schema'

describe('Mietwagen-Schema', () => {
  test('gleicher Abhol- und Rückgabeort ist erlaubt', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich Flughafen',
      dropoffName: 'Zürich Flughafen',
      pickupOn: '2026-09-12',
      pickupAt: '09:00',
      dropoffOn: '2026-09-16',
      dropoffAt: '18:00',
    })
    assert.equal(geprueft.success, true)
  })

  test('One-way ist erlaubt', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich Flughafen',
      dropoffName: 'Lugano Zentrum',
      pickupOn: '2026-09-12',
      dropoffOn: '2026-09-16',
    })
    assert.equal(geprueft.success, true)
  })

  test('Rückgabe vor Abholung wird abgewiesen', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich',
      dropoffName: 'Lugano',
      pickupOn: '2026-09-16',
      dropoffOn: '2026-09-12',
    })
    assert.equal(geprueft.success, false)
  })

  test('gleiche Uhrzeit am selben Tag wird abgewiesen', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich',
      dropoffName: 'Zürich',
      pickupOn: '2026-09-12',
      pickupAt: '09:00',
      dropoffOn: '2026-09-12',
      dropoffAt: '09:00',
    })
    assert.equal(geprueft.success, false)
  })

  test('unbekannte Uhrzeit am selben Tag bleibt erlaubt', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich',
      dropoffName: 'Zürich',
      pickupOn: '2026-09-12',
      dropoffOn: '2026-09-12',
    })
    assert.equal(geprueft.success, true)
  })

  test('über Mitternacht ist erlaubt', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich',
      dropoffName: 'Lugano',
      pickupOn: '2026-09-12',
      pickupAt: '23:00',
      dropoffOn: '2026-09-13',
      dropoffAt: '01:00',
    })
    assert.equal(geprueft.success, true)
  })

  test('nur Datum ohne Uhrzeit ist erlaubt', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich Flughafen',
      dropoffName: 'Lugano Zentrum',
      pickupOn: '2026-09-12',
      dropoffOn: '2026-09-16',
    })
    assert.equal(geprueft.success, true)
  })

  test('eine zu lange Mietdauer wird abgewiesen', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich',
      dropoffName: 'Lugano',
      pickupOn: '2026-01-01',
      dropoffOn: '2027-02-02',
    })
    assert.equal(geprueft.success, false)
  })

  test('Preis ohne Währung wird abgewiesen', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich',
      dropoffName: 'Lugano',
      priceAmount: 240,
    })
    assert.equal(geprueft.success, false)
  })

  test('eine unbekannte Fahrzeugklasse wird abgewiesen', () => {
    const geprueft = rentalCarManuellSchema.safeParse({
      pickupName: 'Zürich',
      dropoffName: 'Lugano',
      vehicleClass: 'sportscar',
    })
    assert.equal(geprueft.success, false)
  })

  test('der Titel entsteht aus den Orten, wenn keiner gesetzt ist', () => {
    assert.equal(
      rentalTitelAus({ title: null, pickupName: 'Zürich Flughafen', dropoffName: 'Lugano Zentrum' }),
      'Mietwagen Zürich Flughafen → Lugano Zentrum',
    )
  })

  test('eine Suchanfrage ohne Namen scheitert', () => {
    const geprueft = rentalCarSucheEingabeSchema.safeParse({ pickupName: '', dropoffName: 'Lugano' })
    assert.equal(geprueft.success, false)
  })
})
