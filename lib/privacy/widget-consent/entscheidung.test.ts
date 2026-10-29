import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  applyWidgetConsentCommand,
  commandForAction,
  createWidgetConsentState,
  individuelleZweckwahl,
  vendorScriptMayExecute,
  type WidgetConsentState,
} from '@/lib/privacy/widget-consent/entscheidung'
import { WIDGET_CONSENT_PURPOSES, type WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

function offen(providerId: WidgetConsentProviderId = 'discovercars', scopeKey = 'scope-alpha') {
  return createWidgetConsentState(providerId, scopeKey)
}

describe('widget consent entscheidung', () => {
  test('startet unentschieden, Panel offen, Ausführung aus', () => {
    const state = offen()
    assert.equal(state.informative, 'not_decided')
    assert.equal(state.panel, 'open')
    assert.equal(state.generation, 1)
    assert.equal(state.effectiveVendorExecution, false)
    assert.equal(vendorScriptMayExecute(state), false)
    for (const zweck of WIDGET_CONSENT_PURPOSES) {
      assert.equal(state.purposes[zweck], 'not_decided')
    }
  })

  test('lehnt unbekannte Anbieter und leere Bereiche ab', () => {
    assert.throws(
      () => createWidgetConsentState('gyg' as WidgetConsentProviderId, 'scope-alpha'),
      /widget_consent_provider_rejected/,
    )
    assert.throws(() => createWidgetConsentState('twelvego', '   '), /widget_consent_scope_required/)
  })

  test('Ablehnen und informatives Zustimmen ändern die Ausführung nicht', () => {
    const start = offen()
    const abgelehnt = applyWidgetConsentCommand(start, commandForAction(start, 'refuse'))
    assert.equal(abgelehnt.applied, true)
    assert.equal(abgelehnt.event, 'informative_refused')
    assert.equal(abgelehnt.state.informative, 'refused')
    assert.equal(abgelehnt.state.panel, 'closed')
    assert.equal(vendorScriptMayExecute(abgelehnt.state, { enabled: true }), false)

    const erneut = applyWidgetConsentCommand(abgelehnt.state, commandForAction(abgelehnt.state, 'reopen'))
    const zugestimmt = applyWidgetConsentCommand(erneut.state, commandForAction(erneut.state, 'grant_informative'))
    assert.equal(zugestimmt.event, 'informative_granted')
    assert.equal(zugestimmt.state.informative, 'granted')
    for (const zweck of WIDGET_CONSENT_PURPOSES) {
      assert.equal(zugestimmt.state.purposes[zweck], 'granted')
    }
    assert.equal(zugestimmt.state.effectiveVendorExecution, false)
    assert.equal(vendorScriptMayExecute(zugestimmt.state, { enabled: true }), false)
  })

  test('ein gesetztes enabled und ein gefälschter Zustand bleiben aus', () => {
    const start = offen('twelvego')
    const zugestimmt = applyWidgetConsentCommand(start, commandForAction(start, 'grant_informative'))
    const faelschung = {
      ...zugestimmt.state,
      effectiveVendorExecution: true,
      informative: 'granted',
    } as unknown as WidgetConsentState
    assert.equal(vendorScriptMayExecute(faelschung, { enabled: true }), false)
  })

  test('einzelne Zweckwahl ist immer abgelehnt', () => {
    const resultat = individuelleZweckwahl('discovercars', 'advertising_marketing', 'granted')
    assert.deepEqual(resultat, { ok: false, reason: 'purpose_separation_unverified' })
    assert.deepEqual(individuelleZweckwahl('twelvego', 'functional_load', 'refused'), {
      ok: false,
      reason: 'purpose_separation_unverified',
    })
  })

  test('veraltete Antwort greift nicht, auch nicht als Zustimmung', () => {
    const start = offen()
    const geschlossen = applyWidgetConsentCommand(start, commandForAction(start, 'close'))
    assert.equal(geschlossen.event, 'closed_without_grant')
    assert.equal(geschlossen.state.informative, 'not_decided')
    const spaet = applyWidgetConsentCommand(geschlossen.state, {
      type: 'grant_informative',
      generation: start.generation,
    })
    assert.equal(spaet.stale, true)
    assert.equal(spaet.applied, false)
    assert.equal(spaet.event, 'stale_ignored')
    assert.equal(spaet.state, geschlossen.state)
    assert.equal(spaet.state.informative, 'not_decided')
  })

  test('Zurücknehmen, Schliessen und erneutes Öffnen laden nichts nach', () => {
    const start = offen()
    const zugestimmt = applyWidgetConsentCommand(start, commandForAction(start, 'grant_informative'))
    const offenWieder = applyWidgetConsentCommand(
      zugestimmt.state,
      commandForAction(zugestimmt.state, 'reopen'),
    )
    assert.equal(offenWieder.state.informative, 'granted')
    assert.equal(offenWieder.state.panel, 'open')
    const zurueck = applyWidgetConsentCommand(offenWieder.state, commandForAction(offenWieder.state, 'withdraw'))
    assert.equal(zurueck.event, 'withdrawn')
    assert.equal(zurueck.state.informative, 'not_decided')
    assert.equal(zurueck.state.panel, 'open')
    assert.equal(vendorScriptMayExecute(zurueck.state), false)
    const zu = applyWidgetConsentCommand(zurueck.state, commandForAction(zurueck.state, 'close'))
    assert.equal(zu.state.informative, 'not_decided')
    assert.equal(zu.state.panel, 'closed')
  })

  test('gleicher Bereich bleibt, Reisewechsel und Reihenfolge setzen zurück', () => {
    const start = offen()
    const zugestimmt = applyWidgetConsentCommand(start, commandForAction(start, 'grant_informative')).state
    const gleich = applyWidgetConsentCommand(zugestimmt, {
      type: 'reset_context',
      generation: zugestimmt.generation,
      reason: 'scope_changed',
      scopeKey: 'scope-alpha',
    })
    assert.equal(gleich.event, 'same_scope_ignored')
    assert.equal(gleich.state.informative, 'granted')

    const wechsel = applyWidgetConsentCommand(zugestimmt, {
      type: 'reset_context',
      generation: zugestimmt.generation,
      reason: 'scope_changed',
      scopeKey: 'scope-beta',
    })
    assert.equal(wechsel.event, 'context_reset')
    assert.equal(wechsel.state.scopeKey, 'scope-beta')
    assert.equal(wechsel.state.informative, 'not_decided')
    assert.equal(vendorScriptMayExecute(wechsel.state, { enabled: true }), false)

    const neu = applyWidgetConsentCommand(wechsel.state, commandForAction(wechsel.state, 'grant_informative')).state
    const reihenfolge = applyWidgetConsentCommand(neu, {
      type: 'reset_context',
      generation: neu.generation,
      reason: 'reorder',
    })
    assert.equal(reihenfolge.state.scopeKey, 'scope-beta')
    assert.equal(reihenfolge.state.informative, 'not_decided')
    assert.equal(reihenfolge.state.generation > neu.generation, true)
  })

  test('zwei Zustände teilen sich nichts, auch nicht nach Demontage des ersten', () => {
    const erster = offen('discovercars', 'scope-alpha')
    applyWidgetConsentCommand(erster, commandForAction(erster, 'grant_informative'))
    const zweiter = createWidgetConsentState('discovercars', 'scope-alpha')
    assert.equal(zweiter.informative, 'not_decided')
    assert.equal(zweiter.generation, 1)
    assert.notEqual(erster, zweiter)
  })

  test('leerer Reisewechsel wirft, statt still zuzustimmen', () => {
    const start = offen()
    assert.throws(
      () =>
        applyWidgetConsentCommand(start, {
          type: 'reset_context',
          generation: start.generation,
          reason: 'scope_changed',
          scopeKey: ' ',
        }),
      /widget_consent_scope_required/,
    )
  })
})
