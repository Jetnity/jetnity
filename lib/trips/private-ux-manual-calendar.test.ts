import test from 'node:test'
import assert from 'node:assert/strict'
import { zeitraumGueltig } from './suchkalender'
import { unterkunftZeitraumSchema } from './schema'
import { manuellerInhaltSchema } from './trip-plan-integrated/manual'
import { rentalCarManuellSchema } from '../rental-cars/schema'
import { mobilityManuellSchema } from '../mobility/schema'

const historisch = { min: '1900-01-01', max: '9999-12-31', minTage: 0, einzeln: true }

test('manual calendars admit historical dates without requiring an end date', () => {
  assert.equal(zeitraumGueltig('2005-07-11', '', historisch), true)
  const point = manuellerInhaltSchema.parse({ kind: 'note', title: 'Erinnerung', startsOn: '2005-07-11' })
  assert.equal(point.startsOn, '2005-07-11')
  assert.equal(point.endsOn, undefined)
  assert.equal(point.startsAt, null)
  assert.equal(manuellerInhaltSchema.safeParse({ kind: 'note', title: 'Ungeplant', startsOn: null, endsOn: null }).success, true)
})
test('optional rental dates stay unknown until explicitly entered', () => {
  const point = rentalCarManuellSchema.parse({ pickupName: 'Paris', dropoffName: 'Paris' })
  assert.equal(point.pickupOn, null)
  assert.equal(point.dropoffOn, null)
  const historical = rentalCarManuellSchema.parse({ pickupName: 'Paris', dropoffName: 'Paris', pickupOn: '2005-07-11', pickupAt: '10:00' })
  assert.equal(historical.pickupOn, '2005-07-11')
  assert.equal(historical.dropoffOn, null)
})
test('manual overnight connection preserves explicit local dates and times', () => {
  const connection = { mode: 'rail', originName: 'Paris', destinationName: 'Berlin', startsOn: '2005-07-11', startsAt: '22:30', endsOn: '2005-07-12', endsAt: '08:00' }
  const point = mobilityManuellSchema.parse(connection)
  assert.equal(point.startsOn, connection.startsOn)
  assert.equal(point.endsOn, connection.endsOn)
  assert.equal(point.startsAt, connection.startsAt)
  assert.equal(point.endsAt, connection.endsAt)
  assert.equal(mobilityManuellSchema.safeParse({ ...connection, endsOn: '2005-07-11' }).success, false)
})
test('historical hotel edits still require at least one real night', () => {
  assert.equal(unterkunftZeitraumSchema.safeParse({ startsOn: '2005-07-11', endsOn: '2005-07-12' }).success, true)
  assert.equal(unterkunftZeitraumSchema.safeParse({ startsOn: '2005-07-11', endsOn: '2005-07-11' }).success, false)
  assert.equal(unterkunftZeitraumSchema.safeParse({ startsOn: '2005-07-11', endsOn: '' }).success, false)
})
