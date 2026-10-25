import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { gastReadinessSetzen } from '@/lib/readiness/gast'
import { READINESS_GRENZEN } from '@/lib/readiness/domain'
import { readinessAnsicht } from '@/lib/readiness/status'
import {
  annehmen,
  entscheiden,
  entwurfGeaendert,
  gastErgebnis,
  kontoBeobachten,
  leerLedger,
  manuellLesen,
  scheitern,
  PERSONAL_ABGESTIMMT,
  PERSONAL_AUSSTEHEND,
  PERSONAL_BARRIERE,
  PERSONAL_BESTAETIGT,
  PERSONAL_ERST_LESEN,
  PERSONAL_KONTEXT,
  PERSONAL_UNKLAR,
  PERSONAL_UNSICHER,
  PERSONAL_VERALTET,
  PERSONAL_VERWORFEN,
  PERSONAL_ZIEL_WEG,
  interaktion,
  preparationEpoch,
  sichtMeldung,
  type PersonalIntent,
  type PersonalLedger,
} from '@/lib/readiness/personal-preparation-workflow'
import type { ReadinessUserStatus, Trip, TripReadinessItem } from '@/types/trips'

function punkt(reise: Trip, clientRef: string, title: string, userStatus: ReadinessUserStatus = 'open', fingerprint?: string): TripReadinessItem {
  const roh: TripReadinessItem = {
    id: clientRef,
    clientRef,
    kind: 'preparation',
    userStatus,
    evidence: 'user',
    countryCode: null,
    tripItemId: null,
    title,
    travellerClientRef: null,
    contextFingerprint: 'platzhalter',
    createdAt: '2026-10-04T20:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
  }
  return { ...roh, contextFingerprint: fingerprint ?? preparationEpoch(reise, roh) }
}

function reiseMit(basis: Trip, items: TripReadinessItem[]): Trip {
  return beispielreise({
    id: basis.id,
    startDate: basis.startDate,
    endDate: basis.endDate,
    travellers: basis.travellers,
    readinessItems: items,
  })
}

function anlegen(title: string, status: ReadinessUserStatus = 'open', fingerprint?: string): Trip {
  const basis = beispielreise()
  const item = punkt(basis, 'preparation-adapter', title, status, fingerprint)
  return reiseMit(basis, [item])
}

function letzter(ledger: PersonalLedger): PersonalIntent {
  const intent = ledger.intents.at(-1)
  assert.ok(intent)
  return intent
}

function letzteId(ledger: PersonalLedger): string {
  return letzter(ledger).id
}

describe('personal preparation workflow', () => {
  test('epoch follows the stored title and the existing preparation facts', () => {
    const basis = anlegen('Reiseadapter einpacken')
    const item = basis.readinessItems![0]!
    const erste = preparationEpoch(basis, item)
    const spaeter = preparationEpoch(beispielreise({ id: basis.id, startDate: '2026-11-01', endDate: basis.endDate }), item)
    const route = preparationEpoch(beispielreise({
      id: basis.id,
      startDate: basis.startDate,
      endDate: basis.endDate,
      stages: basis.stages.map((stage, index) => index === 0 ? { ...stage, countryCode: 'FR' } : stage),
    }), item)
    assert.notEqual(erste, spaeter)
    assert.notEqual(erste, route)
    assert.equal(preparationEpoch(basis, { ...item, title: '  Reiseadapter einpacken  ' }), erste)
    assert.notEqual(preparationEpoch(basis, { ...item, title: 'Anderer Titel' }), erste)
  })

  test('create payload keeps the raw title and carries no fingerprint', () => {
    const reise = beispielreise()
    const ergebnis = entscheiden(leerLedger(reise.id), { art: 'create', title: '  Reiseadapter einpacken  ', filter: 'alle' }, reise, null)
    assert.ok(ergebnis.auftrag?.payload)
    assert.equal(ergebnis.auftrag.payload.title, '  Reiseadapter einpacken  ')
    assert.equal(ergebnis.auftrag.payload.kind, 'preparation')
    assert.equal(ergebnis.auftrag.payload.userStatus, 'open')
    assert.equal(ergebnis.auftrag.payload.countryCode, null)
    assert.equal(ergebnis.auftrag.payload.tripItemId, null)
    assert.equal('contextFingerprint' in ergebnis.auftrag.payload, false)
    assert.equal(ergebnis.auftrag.payload.clientRef.startsWith('preparation-'), true)
  })

  test('a pending create locks the composer; a field edit opens a new intent', () => {
    const reise = beispielreise()
    const erste = entscheiden(leerLedger(reise.id), { art: 'create', title: 'Adapter', filter: 'alle' }, reise, null)
    const zweite = entscheiden(erste.ledger, { art: 'create', title: 'Adapter', filter: 'alle' }, reise, null)
    assert.equal(zweite.auftrag, null)
    assert.equal(zweite.ledger.intents.length, 1)
    const nachEdit = entwurfGeaendert(erste.ledger)
    const dritte = entscheiden(nachEdit, { art: 'create', title: 'Adapter', filter: 'alle' }, reise, null)
    assert.notEqual(dritte.auftrag?.clientRef, erste.auftrag?.clientRef)
    assert.equal(dritte.ledger.intents.length, 2)
  })

  test('done and skipped stay bound to the preparation epoch, including stale to stale', () => {
    const aktuell = anlegen('Adapter', 'done', 'v4|sha256:alt')
    const item = aktuell.readinessItems![0]!
    const ledger = leerLedger(aktuell.id)
    const epoch = preparationEpoch(aktuell, item)
    const offen = entscheiden(ledger, {
      art: 'edit', clientRef: item.clientRef, title: item.title ?? '', userStatus: 'done', boundEpoch: epoch, editorGeneration: 1, filter: 'erneut',
    }, aktuell, null)
    assert.ok(offen.auftrag)
    const verschoben = beispielreise({ id: aktuell.id, startDate: '2026-12-01', endDate: '2026-12-05', readinessItems: aktuell.readinessItems })
    assert.equal(preparationEpoch(verschoben, item) === epoch, false)
    assert.equal(aktuell.readinessItems![0]!.countryCode, verschoben.readinessItems![0]!.countryCode)
    const block = entscheiden(ledger, {
      art: 'edit', clientRef: item.clientRef, title: item.title ?? '', userStatus: 'done', boundEpoch: epoch, editorGeneration: 1, filter: 'erneut',
    }, verschoben, null)
    assert.equal(block.auftrag, null)
    const weg = entscheiden(ledger, {
      art: 'edit', clientRef: 'fehlt', title: 'Adapter', userStatus: 'open', boundEpoch: epoch, editorGeneration: 1, filter: 'alle',
    }, aktuell, null)
    assert.equal(weg.auftrag, null)
  })

  test('a failed guest read blocks every later personal dispatch until the same trip is read', () => {
    const reise = anlegen('Adapter')
    const item = reise.readinessItems![0]!
    let ledger = entscheiden(leerLedger(reise.id), { art: 'create', title: 'Zweite', filter: 'offen' }, reise, null).ledger
    const intent = letzter(ledger)
    const angenommen = annehmen(ledger, intent.id, intent.lauf)
    ledger = gastErgebnis(angenommen.ledger, intent.id, intent.lauf, { art: 'wrong_trip' }, reise.id)
    assert.equal(ledger.barrier, true)
    assert.equal(ledger.hinweis, PERSONAL_BARRIERE)
    ledger = entscheiden(ledger, { art: 'discard', intentId: intent.id }, reise, null).ledger
    assert.equal(ledger.barrier, true)
    for (const dispatch of [
      { art: 'create' as const, title: 'Neu', filter: 'alle' as const },
      { art: 'edit' as const, clientRef: item.clientRef, title: 'Adapter', userStatus: 'done' as const, boundEpoch: preparationEpoch(reise, item), editorGeneration: 2, filter: 'alle' as const },
      { art: 'delete' as const, clientRef: item.clientRef, filter: 'alle' as const, editorGeneration: 2 },
    ]) {
      const versuch = entscheiden(ledger, dispatch, reise, null)
      assert.equal(versuch.auftrag, null)
      ledger = versuch.ledger
    }
    ledger = manuellLesen(ledger, { art: 'unreadable' }, reise.id)
    assert.equal(ledger.barrier, true)
    ledger = manuellLesen(ledger, { art: 'success', reise }, reise.id)
    assert.equal(ledger.barrier, false)
    const danach = entscheiden(ledger, { art: 'create', title: 'Neu', filter: 'alle' }, reise, null)
    assert.ok(danach.auftrag)
  })

  test('account confirmation needs a delivery after acceptance, and one continuation is marked first', () => {
    const reise = anlegen('Adapter', 'open')
    let ledger = kontoBeobachten(leerLedger(reise.id), reise)
    assert.equal(ledger.lieferung, 1)
    const erzeugt = entscheiden(ledger, { art: 'edit', clientRef: 'preparation-adapter', title: 'Adapter', userStatus: 'done', boundEpoch: preparationEpoch(reise, reise.readinessItems![0]!), editorGeneration: 1, filter: 'alle' }, reise, reise)
    ledger = erzeugt.ledger
    const intent = letzter(ledger)
    ledger = kontoBeobachten(ledger, anlegen('Adapter', 'done'))
    assert.equal(letzter(ledger).phase, 'pending')
    const angenommen = annehmen(ledger, intent.id, intent.lauf)
    assert.equal(angenommen.lesen, true)
    assert.equal(letzter(angenommen.ledger).continuationUsed, true)
    assert.equal(letzter(angenommen.ledger).responseLieferung, ledger.lieferung)
    assert.equal(letzter(angenommen.ledger).phase, 'awaiting')
    const nochmal = annehmen(angenommen.ledger, intent.id, intent.lauf)
    assert.equal(nochmal.lesen, false)
    const bestaetigt = kontoBeobachten(angenommen.ledger, anlegen('Adapter', 'done'))
    assert.equal(letzter(bestaetigt).phase, 'confirmed')
    assert.equal(letzter(bestaetigt).meldung, PERSONAL_BESTAETIGT)
  })

  test('a row that already matched and a still-stale readback do not confirm the write', () => {
    const offen = anlegen('Adapter', 'open')
    const erledigt = anlegen('Adapter', 'done')
    const stale = anlegen('Adapter', 'done', 'v4|sha256:alt')
    const bound = preparationEpoch(stale, stale.readinessItems![0]!)
    const schon = entscheiden(leerLedger(erledigt.id), {
      art: 'edit', clientRef: 'preparation-adapter', title: 'Adapter', userStatus: 'done', boundEpoch: preparationEpoch(erledigt, erledigt.readinessItems![0]!), editorGeneration: 1, filter: 'alle',
    }, erledigt, erledigt)
    let ledger = annehmen(schon.ledger, letzter(schon.ledger).id, letzter(schon.ledger).lauf).ledger
    ledger = kontoBeobachten(ledger, erledigt)
    assert.equal(letzter(ledger).phase, 'reconciled')
    const pruefung = entscheiden(leerLedger(stale.id), {
      art: 'edit', clientRef: 'preparation-adapter', title: 'Adapter', userStatus: 'done', boundEpoch: bound, editorGeneration: 1, filter: 'erneut',
    }, stale, null)
    ledger = annehmen(pruefung.ledger, letzter(pruefung.ledger).id, letzter(pruefung.ledger).lauf).ledger
    ledger = gastErgebnis(ledger, letzter(ledger).id, letzter(ledger).lauf, { art: 'success', reise: stale }, stale.id)
    assert.equal(letzter(ledger).phase, 'stale_unconfirmed')
    assert.equal(letzter(ledger).meldung, PERSONAL_VERALTET)
    assert.equal(offen.readinessItems![0]!.userStatus, 'open')
  })

  test('personal done leaves the official result unknown', () => {
    const reise = anlegen('Adapter', 'done')
    const ansicht = readinessAnsicht(reise)
    assert.equal(ansicht.summary.officialResult, 'unknown')
    assert.equal(ansicht.items.find((item) => item.kind === 'preparation')?.evidence, 'user')
    assert.equal(ansicht.items.find((item) => item.kind === 'entry_check')?.userStatus, 'open')
  })

  test('the owned messages stay the task sentences', () => {
    assert.match(PERSONAL_UNSICHER, /kein Beweis/)
    assert.match(PERSONAL_ABGESTIMMT, /belegt nicht/)
    assert.match(PERSONAL_AUSSTEHEND, /noch nicht neu gelesen/)
    assert.match(PERSONAL_VERWORFEN, /nicht zurückgenommen/)
    assert.match(PERSONAL_ZIEL_WEG, /nicht neu angelegt/)
    assert.match(PERSONAL_KONTEXT, /älteren Reisekontext/)
    assert.match(PERSONAL_ERST_LESEN, /Lies zuerst/)
  })

  test('an unclear outcome cannot write again until a later read, and a match is only reconciled', () => {
    const reise = anlegen('Adapter')
    const item = reise.readinessItems![0]!
    const erste = entscheiden(leerLedger(reise.id), {
      art: 'edit', clientRef: item.clientRef, title: 'Adapter', userStatus: 'done', boundEpoch: preparationEpoch(reise, item), editorGeneration: 1, filter: 'alle',
    }, reise, null)
    assert.ok(erste.auftrag)
    let ledger = scheitern(erste.ledger, letzteId(erste.ledger), 1, PERSONAL_UNKLAR, 'unclear')
    const retry = entscheiden(ledger, { art: 'retry', intentId: letzteId(ledger) }, reise, null)
    assert.equal(retry.auftrag, null)
    assert.equal(retry.ledger.hinweis, PERSONAL_ERST_LESEN)
    const nochmal = entscheiden(retry.ledger, {
      art: 'edit', clientRef: item.clientRef, title: 'Adapter', userStatus: 'open', boundEpoch: preparationEpoch(reise, item), editorGeneration: 2, filter: 'alle',
    }, reise, null)
    assert.equal(nochmal.auftrag, null)
    const loeschen = entscheiden(nochmal.ledger, { art: 'delete', clientRef: item.clientRef, filter: 'alle', editorGeneration: 2 }, reise, null)
    assert.equal(loeschen.auftrag, null)
    ledger = loeschen.ledger
    ledger = manuellLesen(ledger, { art: 'wrong_trip' }, reise.id)
    ledger = manuellLesen(ledger, { art: 'missing' }, reise.id)
    assert.equal(entscheiden(ledger, { art: 'retry', intentId: letzteId(ledger) }, reise, null).auftrag, null)
    const fremd = kontoBeobachten(ledger, beispielreise({ id: 'andere-reise' }))
    assert.equal(letzter(fremd).phase, 'unclear')
    assert.equal(fremd.lieferung, ledger.lieferung)
    const konfliktReise = anlegen('Anders', 'done')
    ledger = manuellLesen(ledger, { art: 'success', reise: konfliktReise }, reise.id)
    assert.equal(letzter(ledger).phase, 'conflict')
    const bewusst = entscheiden(ledger, { art: 'retry', intentId: letzteId(ledger) }, reise, null)
    assert.equal(bewusst.auftrag?.clientRef, item.clientRef)
    assert.equal(letzter(bewusst.ledger).meldung, PERSONAL_UNSICHER)
    const passend = anlegen('Adapter', 'done')
    const abgestimmt = manuellLesen(scheitern(erste.ledger, letzteId(erste.ledger), 1, PERSONAL_UNKLAR, 'unclear'), { art: 'success', reise: passend }, reise.id)
    assert.equal(letzter(abgestimmt).phase, 'reconciled')
    assert.equal(letzter(abgestimmt).meldung, PERSONAL_ABGESTIMMT)
    const neu = entscheiden(entwurfGeaendert({ ...abgestimmt, composerLock: true, composerRef: 'alt' }), { art: 'create', title: 'Beta', filter: 'alle' }, reise, null)
    assert.equal(letzter(neu.ledger).phase, 'pending')
    const spaet = manuellLesen(neu.ledger, { art: 'success', reise: passend }, reise.id)
    assert.equal(letzter(spaet).phase, 'pending')
    assert.equal(spaet.draft, neu.ledger.draft)
  })

  test('a later canonical snapshot recovers an accepted absence or conflict without confirming an unknown match', () => {
    const leer = beispielreise({ id: 'konto', readinessItems: [] })
    const erzeugt = entscheiden(leerLedger(leer.id), { art: 'create', title: 'Adapter', filter: 'alle' }, leer, null)
    const ref = erzeugt.auftrag!.clientRef
    let ledger = annehmen(erzeugt.ledger, letzteId(erzeugt.ledger), 1).ledger
    ledger = kontoBeobachten(ledger, leer)
    assert.equal(letzter(ledger).phase, 'absent_uncertain')
    const da = anlegen('Adapter')
    const mitPunkt = beispielreise({ id: leer.id, readinessItems: [{ ...da.readinessItems![0]!, clientRef: ref, id: ref, title: 'Adapter', userStatus: 'open' }] })
    ledger = kontoBeobachten(ledger, mitPunkt)
    assert.equal(letzter(ledger).phase, 'confirmed')
    const offen = anlegen('Adapter', 'open')
    const edit = entscheiden(leerLedger(offen.id), {
      art: 'edit', clientRef: 'preparation-adapter', title: 'Adapter', userStatus: 'done', boundEpoch: preparationEpoch(offen, offen.readinessItems![0]!), editorGeneration: 1, filter: 'alle',
    }, offen, offen)
    ledger = annehmen(edit.ledger, letzteId(edit.ledger), 1).ledger
    ledger = kontoBeobachten(ledger, offen)
    assert.equal(letzter(ledger).phase, 'conflict')
    ledger = kontoBeobachten(ledger, anlegen('Adapter', 'done'))
    assert.equal(letzter(ledger).phase, 'confirmed')
    const unklar = scheitern(erzeugt.ledger, letzteId(erzeugt.ledger), 1, PERSONAL_UNKLAR, 'unclear')
    const gast = manuellLesen(unklar, { art: 'success', reise: mitPunkt }, leer.id)
    assert.equal(letzter(gast).phase, 'reconciled')
    const konto = kontoBeobachten(unklar, mitPunkt)
    assert.equal(letzter(konto).phase, 'reconciled')
    const weg = interaktion(annehmen(erzeugt.ledger, letzteId(erzeugt.ledger), 1).ledger)
    const ohneFokus = gastErgebnis(weg, letzteId(weg), 1, { art: 'success', reise: mitPunkt }, leer.id)
    assert.equal(ohneFokus.fokusIntentId, null)
  })

  test('an older read cannot unlock a newer operation on the same ref', () => {
    const offen = anlegen('Adapter', 'open')
    const item = offen.readinessItems![0]!
    const alt = entscheiden(leerLedger(offen.id), {
      art: 'edit', clientRef: item.clientRef, title: 'Adapter', userStatus: 'done', boundEpoch: preparationEpoch(offen, item), editorGeneration: 1, filter: 'alle',
    }, offen, offen)
    let ledger = annehmen(alt.ledger, letzteId(alt.ledger), 1).ledger
    ledger = kontoBeobachten(ledger, offen)
    assert.equal(letzter(ledger).phase, 'conflict')
    assert.equal(ledger.locks.includes(item.clientRef), false)
    const neu = entscheiden(ledger, {
      art: 'edit', clientRef: item.clientRef, title: 'Adapter', userStatus: 'open', boundEpoch: preparationEpoch(offen, item), editorGeneration: 2, filter: 'alle',
    }, offen, offen)
    assert.ok(neu.auftrag)
    ledger = neu.ledger
    assert.equal(ledger.locks.includes(item.clientRef), true)
    ledger = kontoBeobachten(ledger, offen)
    const pending = ledger.intents.find((eintrag) => eintrag.phase === 'pending')
    assert.equal(pending?.clientRef, item.clientRef)
    assert.equal(ledger.locks.includes(item.clientRef), true)
    const loeschen = entscheiden(ledger, { art: 'delete', clientRef: item.clientRef, filter: 'alle', editorGeneration: 2 }, offen, offen)
    assert.equal(loeschen.auftrag, null)
    const erneut = entscheiden(ledger, { art: 'retry', intentId: letzteId(alt.ledger) }, offen, offen)
    assert.equal(erneut.auftrag, null)

    const betaItem = punkt(offen, 'preparation-beta', 'Beta')
    const mitBeta = reiseMit(offen, [item, betaItem])
    const beta = entscheiden(leerLedger(mitBeta.id), {
      art: 'edit', clientRef: betaItem.clientRef, title: 'Beta', userStatus: 'done', boundEpoch: preparationEpoch(mitBeta, betaItem), editorGeneration: 1, filter: 'alle',
    }, mitBeta, mitBeta)
    let gemischt = annehmen(beta.ledger, letzteId(beta.ledger), 1).ledger
    gemischt = kontoBeobachten(gemischt, mitBeta)
    assert.equal(gemischt.intents.find((eintrag) => eintrag.clientRef === betaItem.clientRef)?.phase, 'conflict')
    const alpha = entscheiden(gemischt, {
      art: 'edit', clientRef: item.clientRef, title: 'Adapter', userStatus: 'open', boundEpoch: preparationEpoch(mitBeta, item), editorGeneration: 3, filter: 'alle',
    }, mitBeta, mitBeta)
    assert.ok(alpha.auftrag)
    gemischt = kontoBeobachten(alpha.ledger, mitBeta)
    assert.equal(gemischt.intents.find((eintrag) => eintrag.clientRef === item.clientRef && eintrag.phase === 'pending')?.art, 'edit')
    assert.equal(gemischt.locks.includes(item.clientRef), true)
    assert.equal(gemischt.locks.includes(betaItem.clientRef), false)
    const status = entscheiden(gemischt, {
      art: 'edit', clientRef: betaItem.clientRef, title: 'Beta', userStatus: 'skipped', boundEpoch: preparationEpoch(mitBeta, betaItem), editorGeneration: 4, filter: 'alle',
    }, mitBeta, mitBeta)
    assert.ok(status.auftrag)
    assert.equal(status.ledger.locks.includes(item.clientRef), true)
    assert.equal(status.ledger.intents.find((eintrag) => eintrag.phase === 'pending' && eintrag.clientRef === item.clientRef)?.art, 'edit')
  })

  test('the existing guest writer still rejects a 51st point and accepts an exact edit', () => {
    const basis = beispielreise()
    const items = Array.from({ length: READINESS_GRENZEN.itemsJeReise }, (_, index) => punkt(basis, `preparation-${index}`, `Punkt ${index}`))
    const voll = reiseMit(basis, items)
    const ablage = new Map<string, string>()
    const vorher = globalThis.window
    Object.assign(globalThis, {
      window: {
        localStorage: {
          getItem: (key: string) => ablage.get(key) ?? null,
          setItem: (key: string, value: string) => { ablage.set(key, value) },
          removeItem: (key: string) => { ablage.delete(key) },
        },
      },
    })
    try {
      assert.throws(
        () => gastReadinessSetzen(voll, { clientRef: 'preparation-neu', kind: 'preparation', userStatus: 'open', countryCode: null, tripItemId: null, title: 'Zu viel' }),
        /höchstens 50/,
      )
      const gespeichert = gastReadinessSetzen(voll, { clientRef: 'preparation-0', kind: 'preparation', userStatus: 'done', countryCode: null, tripItemId: null, title: 'Punkt 0' })
      assert.equal(gespeichert.readinessItems?.length, 50)
      assert.equal(gespeichert.readinessItems?.find((item) => item.clientRef === 'preparation-0')?.userStatus, 'done')
    } finally {
      if (vorher === undefined) delete (globalThis as { window?: unknown }).window
      else globalThis.window = vorher
    }
  })

  test('a later absence keeps the confirmed receipt but drops the current-visibility claim', () => {
    const leer = beispielreise({ id: 'abwesend', readinessItems: [] })
    const erzeugt = entscheiden(leerLedger(leer.id), { art: 'create', title: 'Adapter', filter: 'alle' }, leer, null)
    const ref = erzeugt.auftrag!.clientRef
    let ledger = annehmen(erzeugt.ledger, letzteId(erzeugt.ledger), 1).ledger
    const da = beispielreise({ id: leer.id, readinessItems: [punkt(leer, ref, 'Adapter')] })
    ledger = kontoBeobachten(ledger, da)
    assert.equal(letzter(ledger).phase, 'confirmed')
    assert.equal(sichtMeldung(letzter(ledger), ledger.beobachteteRefs), PERSONAL_BESTAETIGT)
    assert.deepEqual(ledger.beobachteteRefs, [ref])
    const weg = beispielreise({ id: leer.id, readinessItems: [] })
    ledger = kontoBeobachten(ledger, weg)
    assert.equal(letzter(ledger).phase, 'confirmed')
    assert.equal(letzter(ledger).meldung, PERSONAL_BESTAETIGT)
    assert.deepEqual(ledger.beobachteteRefs, [])
    assert.equal(sichtMeldung(letzter(ledger), ledger.beobachteteRefs), PERSONAL_ZIEL_WEG)
    const verworfen = entscheiden(ledger, { art: 'discard', intentId: 'fehlt' }, weg, null)
    assert.equal(verworfen.ledger.beobachteteRefs?.length, 0)
  })
})
