import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Trip } from '@/types/trips'
import { fixture } from '@/scripts/direct-trip-editing-1/fixture'
import { manuellVorschau } from './speichern'
import { rueckgabePlanen, rueckgaengigSpeichern, RUECKNAHME_FRIST_MS } from './rueckgaengig'
import { bedeutung } from './bestaetigung'

const SEED = '817a7ff5-1359-48d8-952c-893932c2b741'
const SAVED_AT = '2026-10-07T10:01:00.000Z'
const NOW = Date.parse(SAVED_AT) + 5_000

async function setup(eingabe: unknown = { title: 'Geänderter Testtitel' }, quelle: 'guest' | 'account' = 'account') {
  const vorher = fixture()
  const v = await manuellVorschau(vorher, eingabe, SEED, quelle)
  assert(v.ok)
  const nachher = {
    ...v.vorschau.nachher, revision: vorher.revision + 1,
    lastMutationId: 'confirmed-w2-test-mutation', updatedAt: SAVED_AT,
  }
  let current: Trip = structuredClone(nachher)
  let writes = 0
  let throwAfterWrite = false
  let cannotReadBack = false
  const ports = {
    quelle, jetzt: () => NOW,
    lesen: async () => {
      if (cannotReadBack && writes) throw Error('temporary readback outage')
      return current
    },
    schreiben: async (graph: Trip, mutation: string, revision: number) => {
      writes++
      current = { ...graph, revision: revision + 1, lastMutationId: mutation,
        updatedAt: '2026-10-07T10:01:03.000Z' }
      if (throwAfterWrite) throw Error('acknowledgement lost after commit')
      return { konflikt: false }
    },
  }
  return {
    vorher, nachher, ports, get: () => current, writes: () => writes,
    konkurrieren: (graph: Trip) => { current = graph },
    antwortVerlieren: () => { throwAfterWrite = true },
    readbackAusfall: () => { cannotReadBack = true },
  }
}

test('W2 #1299: explicit title edit is reversible once, with original booking unchanged and idempotent retry', async () => {
  const t = await setup()
  assert(rueckgabePlanen(t.vorher, t.nachher, 'account', SEED).ok)
  const req = { vorher: t.vorher, nachher: t.nachher, seed: SEED }
  const r = await rueckgaengigSpeichern(req, t.ports)
  assert(r.ok)
  assert.equal(t.writes(), 1)
  assert.equal(bedeutung(r.reise), bedeutung(t.vorher))
  assert.deepEqual(r.reise.days[3].items[0], t.vorher.days[3].items[0],
    'the user-marked booked stay is never modified')
  const twice = await rueckgaengigSpeichern(req, t.ports)
  assert(twice.ok)
  assert.equal(t.writes(), 1, 'same request is never written twice')
})

test('W2 #1299: competing tab revision and same-revision content change fail without writing', async () => {
  const a = await setup()
  a.konkurrieren({ ...a.get(), revision: a.get().revision + 1, lastMutationId: 'other-tab' })
  const x = await rueckgaengigSpeichern({ vorher: a.vorher, nachher: a.nachher, seed: SEED }, a.ports)
  assert.equal(x.ok, false)
  assert.equal(a.writes(), 0)
  const b = await setup()
  b.konkurrieren({ ...b.get(), title: 'Unbemerkt geändert' })
  const y = await rueckgaengigSpeichern({ vorher: b.vorher, nachher: b.nachher, seed: SEED }, b.ports)
  assert.equal(y.ok, false)
  assert.equal(b.writes(), 0)
})

test('W2 #1299: undo expiry is enforced by authoritative time, never just the browser button', async () => {
  const t = await setup()
  const r = await rueckgaengigSpeichern({ vorher: t.vorher, nachher: t.nachher, seed: SEED }, {
    ...t.ports, jetzt: () => Date.parse(SAVED_AT) + RUECKNAHME_FRIST_MS + 1,
  })
  assert.equal(r.ok, false)
  assert.equal(t.writes(), 0)
})

test('W2 #1299: booked/price/booking-source alteration refuses even a forged before snapshot', async () => {
  const t = await setup()
  const vorher = structuredClone(t.vorher)
  vorher.days[3].items[0].bookingStatus = 'unconfirmed'
  vorher.days[3].items[0].bookingSource = null
  assert.equal(rueckgabePlanen(vorher, t.nachher, 'account', SEED).ok, false)
  const r = await rueckgaengigSpeichern({ vorher, nachher: t.nachher, seed: SEED }, t.ports)
  assert.equal(r.ok, false)
  assert.equal(t.writes(), 0)
  const other = structuredClone(t.vorher)
  other.days[3].items[0].priceAmount = 100
  assert.equal(rueckgabePlanen(other, t.nachher, 'account', SEED).ok, false)
})

test('W2 #1299: lost acknowledgement is recovered only from exact independent readback', async () => {
  const t = await setup({ title: 'Test' })
  t.antwortVerlieren()
  const r = await rueckgaengigSpeichern({ vorher: t.vorher, nachher: t.nachher, seed: SEED }, t.ports)
  assert(r.ok)
  assert.equal(t.writes(), 1)
  assert.equal(bedeutung(t.get()), bedeutung(t.vorher))
})

test('W2 #1299: unavailable readback never implies success and explicit check does not write again', async () => {
  const t = await setup()
  t.readbackAusfall()
  const req = { vorher: t.vorher, nachher: t.nachher, seed: SEED }
  const result = await rueckgaengigSpeichern(req, t.ports)
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.art, 'ungewiss')
  assert.equal(t.writes(), 1)
  const retry = await rueckgaengigSpeichern({ ...req, nurPruefen: true }, {
    ...t.ports, lesen: async () => t.get(),
  })
  assert(retry.ok)
  assert.equal(t.writes(), 1)
})

test('W2 #1299: guest and account date shift reverse only with original IDs, no booking edits', async () => {
  for (const quelle of ['guest', 'account'] as const) {
    const t = await setup({ startDate: '2026-10-09' }, quelle)
    const reversibel = rueckgabePlanen(t.vorher, t.nachher, quelle, SEED)
    assert(reversibel.ok, `date shift must be reversible without touching bookings (${quelle})`)
    const r = await rueckgaengigSpeichern({ vorher: t.vorher, nachher: t.nachher, seed: SEED }, t.ports)
    assert(r.ok)
    assert.equal(bedeutung(r.reise), bedeutung(t.vorher))
  }
})

test('W2 #1299: generated/removed IDs and unsupported old null value never pretend safe undo', async () => {
  const v = await setup({ duration: 3 })
  assert.equal(rueckgabePlanen(v.vorher, v.nachher, 'account', SEED).ok, false)
  const t = await setup({ title: 'Neu' })
  const vorher = structuredClone(t.vorher)
  vorher.budgetAmount = null
  assert.equal(rueckgabePlanen(vorher, t.nachher, 'account', SEED).ok, false)
})

test('W2 #1299: unknown fields, unconfirmed forward edit and wrong trip never write', async () => {
  const t = await setup()
  const req = { vorher: t.vorher, nachher: t.nachher, seed: SEED }
  assert.equal((await rueckgaengigSpeichern({ ...req, provider: 'pretend' }, t.ports)).ok, false)
  assert.equal((await rueckgaengigSpeichern({ ...req, nachher: { ...t.nachher, lastMutationId: null } }, t.ports)).ok, false)
  assert.equal((await rueckgaengigSpeichern({ ...req, vorher: { ...t.vorher, id: 'other-trip' } }, t.ports)).ok, false)
  assert.equal(t.writes(), 0)
})
