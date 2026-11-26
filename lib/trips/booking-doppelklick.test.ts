import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  BUCHUNG_DOPPELKLICK_MS,
  type BookingZeiger,
  createBookingMemory,
  dropBookingOwnership,
  startBookingAction,
} from '@/components/trips/useBookingActionLifecycle'

const maus = (detail = 1): BookingZeiger => ({ detail, art: 'mouse' })
const touch = (): BookingZeiger => ({ detail: 1, art: 'touch' })
const taste = (): BookingZeiger => ({ detail: 0, art: 'keyboard' })
const direkt = (): BookingZeiger => ({ detail: 0, art: 'direct' })

async function tick() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function protokoll() {
  const writes: Array<[string, boolean]> = []
  let outcome: 'ok' | 'error' | 'hold' = 'ok'
  let release: (value: string | null) => void = () => {}
  const run = (itemId: string, gebucht: boolean) => {
    writes.push([itemId, gebucht])
    if (outcome === 'error') return Promise.resolve('Speichern abgelehnt.')
    if (outcome === 'hold') return new Promise<string | null>((resolve) => { release = resolve })
    return Promise.resolve(null)
  }
  return {
    writes,
    run,
    arm(next: 'ok' | 'error' | 'hold') { outcome = next },
    settle() { release(null) },
  }
}

test('Maus-Doppelklick und Touch-Doppeltap schreiben genau einmal und kippen das Ziel nicht', async () => {
  const memory = createBookingMemory()
  const probe = protokoll()
  const publish: string[] = []
  startBookingAction(memory, probe.run, 'flug', true, null, (pending) => { publish.push(pending ?? 'fertig') }, maus(1))
  await tick()
  startBookingAction(memory, probe.run, 'flug', false, null, () => {}, maus(2))
  startBookingAction(memory, probe.run, 'flug', false, null, () => {}, maus(1))
  startBookingAction(memory, probe.run, 'flug', false, null, () => {}, touch())
  assert.deepEqual(probe.writes, [['flug', true]])
  assert.equal(memory.gesture?.intent, true)

  memory.gesture = { itemId: 'flug', intent: true, at: Date.now() - BUCHUNG_DOPPELKLICK_MS - 1 }
  startBookingAction(memory, probe.run, 'flug', false, null, () => {}, maus(1))
  await tick()
  assert.deepEqual(probe.writes, [['flug', true], ['flug', false]])
})

test('ein Fehler blockiert den Doppelklick, ein späterer Einzelversuch schreibt erneut', async () => {
  const memory = createBookingMemory()
  const probe = protokoll()
  probe.arm('error')
  const messages: Array<string | null> = []
  startBookingAction(memory, probe.run, 'stay', true, null, (_pending, message) => { messages.push(message) }, maus(1))
  await tick()
  startBookingAction(memory, probe.run, 'stay', true, null, () => {}, maus(2))
  assert.deepEqual(probe.writes, [['stay', true]])
  assert.equal(messages.at(-1), 'Speichern abgelehnt.')

  probe.arm('ok')
  startBookingAction(memory, probe.run, 'stay', true, null, () => {}, direkt())
  await tick()
  assert.deepEqual(probe.writes, [['stay', true], ['stay', true]])
})

test('Tastatur, anderer Eintrag und Reisewechsel bleiben eigene Aktionen', async () => {
  const memory = createBookingMemory()
  const probe = protokoll()
  startBookingAction(memory, probe.run, 'flug', true, null, () => {}, taste())
  await tick()
  startBookingAction(memory, probe.run, 'flug', false, null, () => {}, taste())
  await tick()
  startBookingAction(memory, probe.run, 'hotel', true, null, () => {}, maus(1))
  await tick()
  dropBookingOwnership(memory)
  startBookingAction(memory, probe.run, 'flug', true, null, () => {}, maus(1))
  await tick()
  assert.deepEqual(probe.writes, [
    ['flug', true],
    ['flug', false],
    ['hotel', true],
    ['flug', true],
  ])
})

test('ein laufender Schreibvorgang sperrt den zweiten Eintrag, bis er fertig ist', async () => {
  const memory = createBookingMemory()
  const probe = protokoll()
  probe.arm('hold')
  startBookingAction(memory, probe.run, 'flug', true, null, () => {}, maus(1))
  startBookingAction(memory, probe.run, 'hotel', false, null, () => {}, maus(1))
  assert.deepEqual(probe.writes, [['flug', true]])
  probe.settle()
  await tick()
  startBookingAction(memory, probe.run, 'hotel', false, null, () => {}, direkt())
  await tick()
  assert.deepEqual(probe.writes, [['flug', true], ['hotel', false]])
})
