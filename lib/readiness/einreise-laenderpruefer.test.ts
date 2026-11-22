import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Ladung } from '@/lib/admin/ladezustand'
import { landAnzeigeText } from '@/lib/country/darstellung'
import { EINREISE_AMPEL_TEXT } from '@/lib/readiness/einreise-kundenanzeige'
import { atBmiSourceReview } from '@/lib/readiness/official-truth-at-method-v1/at-bmi-visa-groups-v1'
import { einreisePrueferLaden, einreisePrueferSicht } from '@/lib/readiness/einreise-laenderpruefer'
import { createV3VisitorController, type V3VisitorTimers, type V3VisitorUiState } from '@/lib/readiness/official-truth-product-v3/visitor/controller'
import type { V3VisitorInput } from '@/lib/readiness/official-truth-product-v3/contract'
import type { V3VisitorView, V3VisitorViewResult } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'

const CH_DE: V3VisitorInput = { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
const JAPAN: V3VisitorInput = { destinationCountryCode: 'JP', citizenshipCountryCodes: ['FR'] }
const QUELLE = 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'
const BASE = Date.parse('2026-11-09T08:04:00.000Z')

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}
async function flush() { for (let turn = 0; turn < 8; turn += 1) await Promise.resolve() }
class Clock implements V3VisitorTimers {
  time = 0
  private sequence = 0
  private readonly tasks = new Map<number, { at: number; callback: () => void }>()
  now = () => this.time
  after(milliseconds: number, callback: () => void) {
    const id = ++this.sequence
    this.tasks.set(id, { at: this.time + milliseconds, callback })
    return () => { this.tasks.delete(id) }
  }
  async advance(milliseconds: number) {
    const until = this.time + milliseconds
    while (true) {
      const next = [...this.tasks].sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0]
      if (!next || next[1].at > until) break
      this.time = next[1].at
      this.tasks.delete(next[0])
      next[1].callback()
      await flush()
    }
    this.time = until
    await flush()
  }
}

function frei(clock: Clock, ttl: number): V3VisitorViewResult {
  return {
    status: 'accepted',
    title: 'Visum',
    informationTopic: 'visa',
    conditions: ['Direkte Einreise'],
    statements: [{ text: 'Nicht erforderlich · Visumfreie Einreise', when: null, href: null }],
    source: { label: 'Auswärtiges Amt', href: QUELLE },
    checkedAtText: 'Stand vom 02.11.2026, 10:00 UTC',
    validityText: 'Gültigkeit',
    ruleVersion: 1,
    expiresAt: new Date(BASE + clock.time + ttl).toISOString(),
  }
}
function antwort(clock: Clock, input: V3VisitorInput, ergebnis: V3VisitorViewResult): Ladung<V3VisitorView> {
  return {
    daten: {
      input,
      generatedAt: new Date(BASE + clock.time).toISOString(),
      synthetic: false,
      cells: [{ country: 'CH', label: 'Schweiz', results: [ergebnis] }],
    },
    fehler: null,
  }
}

test('ein Länderwechsel verwirft die laufende CH→DE-Antwort, auch wenn sie später visumfrei eintrifft', async () => {
  const clock = new Clock()
  const wartend = deferred<Ladung<V3VisitorView>>()
  const changes: V3VisitorUiState[] = []
  let aufrufe = 0
  let signal: AbortSignal | undefined
  const laden = einreisePrueferLaden(async (_input, current) => {
    aufrufe += 1
    signal = current
    return wartend.promise
  })
  const controller = createV3VisitorController(laden, (state) => changes.push(state), clock)
  const erste = controller.submit(CH_DE)
  assert.equal(changes.at(-1)?.phase, 'loading')
  controller.invalidate()
  assert.equal(signal?.aborted, true)
  assert.equal(einreisePrueferSicht(changes.at(-1)!), null)
  wartend.resolve(antwort(clock, CH_DE, frei(clock, 60_000)))
  await erste
  assert.equal(changes.at(-1)?.phase, 'idle')
  assert.equal(einreisePrueferSicht(changes.at(-1)!), null)

  const japan = controller.submit(JAPAN)
  await japan
  const sicht = einreisePrueferSicht(changes.at(-1)!)
  assert.equal(sicht?.zielCode, 'JP')
  assert.match(sicht?.zielLabel ?? '', /Japan/)
  assert.equal(sicht?.anzeige.paare[0]?.ampel, 'neutral')
  assert.equal(sicht?.anzeige.paare[0]?.ampelText, EINREISE_AMPEL_TEXT.neutral)
  assert.equal(JSON.stringify(sicht).includes('Kein Visum nötig'), false)
  assert.equal(JSON.stringify(sicht).includes('Visumfreie Einreise'), false)
  assert.equal(aufrufe, 1)
  controller.dispose()
})

test('ein abgelaufenes akzeptiertes Ergebnis wird nicht mehr als visumfrei angezeigt', async () => {
  const clock = new Clock()
  const changes: V3VisitorUiState[] = []
  const controller = createV3VisitorController(
    einreisePrueferLaden(async () => antwort(clock, CH_DE, frei(clock, 1_000))),
    (state) => changes.push(state),
    clock,
  )
  await controller.submit(CH_DE)
  const frisch = einreisePrueferSicht(changes.at(-1)!)
  assert.equal(frisch?.anzeige.paare[0]?.ampel, 'gruen')
  assert.equal(frisch?.zielCode, 'DE')
  await clock.advance(1_000)
  const abgelaufen = einreisePrueferSicht(changes.at(-1)!)
  assert.equal(abgelaufen?.anzeige.paare[0]?.ampel, 'neutral')
  assert.equal(abgelaufen?.anzeige.satz, 'Die Visumlage ist noch nicht bestätigt.')
  assert.match(abgelaufen?.hinweis ?? '', /abgelaufen/)
  assert.equal(JSON.stringify(abgelaufen?.anzeige).includes('Kein Visum nötig'), false)
  controller.dispose()
})

test('amtliche AT-Quellenhinweise verwenden die tatsächlich beantworteten Passcodes statt des Ziellands', () => {
  const input: V3VisitorInput = { destinationCountryCode: 'AT', citizenshipCountryCodes: ['DE', 'IN', 'UA'] }
  const state: V3VisitorUiState = {
    phase: 'ready', refresh: 'off', focusResult: false, message: null,
    view: { input, synthetic: false, generatedAt: '2026-11-19T19:30:00.000Z',
      cells: input.citizenshipCountryCodes.map(country => ({
        country, label: country,
        results: [{ status: 'unavailable' as const, title: 'Derzeit nicht verfügbar', message: 'Noch nicht freigegeben' }],
      })) },
  }
  const sicht = einreisePrueferSicht(state)
  assert.ok(sicht)
  assert.deepEqual(sicht.citizenshipCodes, ['DE', 'IN', 'UA'])
  assert.deepEqual(sicht.citizenshipCodes.map(code => atBmiSourceReview(code)?.group), ['F', 'V', 'E'])
  assert.equal(sicht.anzeige.paare.length, 3)
  // The existing pair.landCode is the *destination* for trip UI consumers.
  // It must never be repurposed as the passport for source reviews.
  assert.deepEqual(sicht.anzeige.paare.map(paar => paar.landCode), ['AT', 'AT', 'AT'])
  assert.equal(sicht.anzeige.paare.every(paar => paar.ampel === 'neutral'), true)
  assert.equal(sicht.anzeige.paare.every(paar => paar.themen.length === 0), true)
})

test('Ergebniskarten nennen die Reisenden des Passes, ohne Zuordnung bleibt es das Passland', () => {
  const input: V3VisitorInput = { destinationCountryCode: 'AT', citizenshipCountryCodes: ['CH', 'RS'] }
  const state: V3VisitorUiState = {
    phase: 'ready', refresh: 'off', focusResult: false, message: null,
    view: { input, synthetic: false, generatedAt: '2026-11-19T19:30:00.000Z',
      cells: input.citizenshipCountryCodes.map(country => ({
        country, label: country,
        results: [{ status: 'unavailable' as const, title: 'Derzeit nicht verfügbar', message: 'Noch nicht freigegeben' }],
      })) },
  }
  const mit = einreisePrueferSicht(state, { CH: 'Reisende 1 und Reisende 2' })
  assert.deepEqual(mit?.anzeige.paare.map(paar => paar.reisende), ['Reisende 1 und Reisende 2', landAnzeigeText('RS')])
  assert.deepEqual(mit?.anzeige.paare.map(paar => paar.dokument), ['Schweiz', 'Serbien'])
  const ohne = einreisePrueferSicht(state)
  assert.deepEqual(ohne?.anzeige.paare.map(paar => paar.reisende), [landAnzeigeText('CH'), landAnzeigeText('RS')])
})
