import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { vendorScriptMayExecute, createWidgetConsentState } from '@/lib/privacy/widget-consent/entscheidung'
import { CMP_OPTIONAL_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import { decideBundle, productionPolicy, type ReviewedPolicy } from '@/lib/privacy/privacybee-cmp/bundle'
import {
  acceptPending,
  bindReviewedPolicy,
  createController,
  dispatchChoice,
  ingestApi,
  issueWork,
  productionStart,
  releaseMountedContext,
  selectProvider,
  startLocalContext,
  type WorkToken,
} from '@/lib/privacy/privacybee-cmp/steuerung'

const POLICY: ReviewedPolicy = Object.freeze({
  id: 's2-test-policy',
  requiredOptional: Object.freeze([...CMP_OPTIONAL_CATEGORIES]),
})

const ANALYTICS_ONLY: ReviewedPolicy = Object.freeze({
  id: 's2-analytics-only',
  requiredOptional: Object.freeze(['ANALYTICS_STORAGE']),
})

function werte(analytics: boolean) {
  return {
    SECURITY_STORAGE: true,
    FUNCTIONALITY_STORAGE: true,
    ANALYTICS_STORAGE: analytics,
    AD_STORAGE: true,
    AD_USER_DATA: true,
    AD_PERSONALIZATION: true,
    PERSONALIZATION_STORAGE: true,
  }
}

function api(analytics = true, explicit = true, extra: Partial<ReturnType<typeof werte>> = {}) {
  const consents = { ...werte(analytics), ...extra }
  return {
    getAllConsents: () => consents,
    getConsent: (category: string) => consents[category as keyof typeof consents],
    hasExplicitConsent: () => explicit,
  }
}

function bereit() {
  return selectProvider(ingestApi(createController(), api()), 'discovercars')
}

function gebunden(state: ReturnType<typeof bereit>) {
  return bindReviewedPolicy(state, 'discovercars', POLICY)
}

function starten(state: ReturnType<typeof bereit>, token: WorkToken | null = issueWork(state, 'discovercars')) {
  return startLocalContext(state, 'discovercars', POLICY, api(), 'jetnity.com', token)
}

describe('cmp entscheidung und steuerung', () => {
  test('Produktionspolitik bleibt null und verweigert trotz enabled', () => {
    assert.equal(productionPolicy('discovercars'), null)
    const entscheidung = decideBundle({
      policy: null,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 1,
      consents: werte(true),
      snapshotUsable: true,
      hostname: 'jetnity.com',
    })
    assert.equal(entscheidung.localContext, false)
    assert.equal(entscheidung.productionExecute, false)
    assert.equal(entscheidung.reason, 'production_policy_unreviewed')
    assert.equal(vendorScriptMayExecute(createWidgetConsentState('discovercars', 'scope-alpha'), { enabled: true }), false)
  })

  test('dieselbe Funktion lehnt leere, nur-notwendige und widersprüchliche Karten ab', () => {
    const basis = {
      providerId: 'discovercars' as const,
      intent: 'selected' as const,
      generation: 1,
      expectedGeneration: 1,
      snapshotUsable: true,
      hostname: 'jetnity.com',
    }
    assert.equal(decideBundle({ ...basis, policy: { id: 'leer', requiredOptional: [] }, consents: werte(true) }).reason, 'empty_required_categories')
    assert.equal(decideBundle({
      ...basis,
      policy: { id: 'pflicht', requiredOptional: ['SECURITY_STORAGE'] },
      consents: werte(true),
    }).reason, 'necessary_only_policy')
    assert.equal(decideBundle({
      ...basis,
      policy: POLICY,
      consents: werte(false),
    }).reason, 'optional_category_refused')
    assert.equal(decideBundle({
      ...basis,
      policy: POLICY,
      consents: werte(true),
      hostname: '127.0.0.1',
    }).reason, 'host_unlicensed')
  })

  test('ohne zuvor ausgegebenes Token bleibt der Generationsvergleich keine Tautologie', () => {
    const state = bereit()
    const ohneToken = startLocalContext(state, 'discovercars', POLICY, api(), 'jetnity.com')
    assert.equal(ohneToken.created, false)
    assert.equal(ohneToken.decision.reason, 'stale_generation')
    assert.equal(ohneToken.state.live, null)
    const falsch = startLocalContext(state, 'discovercars', POLICY, api(), 'jetnity.com', {
      providerId: 'discovercars',
      epoch: 99,
      scopeKey: 'scope-alpha',
      policyId: POLICY.id,
      requiredOptional: [...POLICY.requiredOptional],
    })
    assert.equal(falsch.created, false)
    assert.equal(falsch.decision.reason, 'stale_generation')
    assert.equal(falsch.state.slots.discovercars.requiredOptional, null)
    const prod = productionStart(state, 'discovercars', api(), 'jetnity.com')
    assert.equal(prod.created, false)
    assert.equal(prod.decision.reason, 'production_policy_unreviewed')
    assert.equal(prod.decision.productionExecute, false)
  })

  test('informative Zustimmung startet nichts und lässt Zwecke unentschieden', () => {
    let state = ingestApi(createController(), api(true, true))
    const generation = state.slots.discovercars.consent.generation
    state = dispatchChoice(state, 'discovercars', { type: 'grant_informative', generation })
    assert.equal(state.slots.discovercars.consent.informative, 'granted')
    assert.equal(state.slots.discovercars.consent.purposes.functional_load, 'not_decided')
    assert.equal(state.slots.discovercars.consent.purposes.advertising_marketing, 'not_decided')
    assert.equal(state.slots.discovercars.intent, 'none')
    assert.equal(state.live, null)
    const ohneAbsicht = startLocalContext(state, 'discovercars', POLICY, api(), 'jetnity.com', issueWork(state, 'discovercars'))
    assert.equal(ohneAbsicht.created, false)
    assert.equal(issueWork(state, 'discovercars'), null)
  })

  test('gemerkte Arbeit vor dem iframe stirbt bei Kategorieverlust und bleibt nach Regrant tot', () => {
    let state = bindReviewedPolicy(bereit(), 'discovercars', POLICY)
    const pending = issueWork(state, 'discovercars')
    assert.ok(pending)
    assert.equal(acceptPending(state, pending), false)
    state = ingestApi(state, api(false, true))
    assert.equal(state.slots.discovercars.intent, 'withdrawn')
    assert.equal(state.live, null)
    assert.equal(acceptPending(state, pending), false)
    state = ingestApi(state, api(true, true))
    const ohneAuswahl = startLocalContext(state, 'discovercars', POLICY, api(true), 'jetnity.com', pending)
    assert.equal(ohneAuswahl.created, false)
    assert.equal(ohneAuswahl.state.live, null)
    state = selectProvider(ohneAuswahl.state, 'discovercars')
    assert.equal(issueWork(state, 'discovercars'), null)
    state = gebunden(state)
    const neu = issueWork(state, 'discovercars')
    assert.ok(neu)
    assert.notEqual(neu.epoch, pending.epoch)
    const gestartet = starten(state, neu)
    assert.equal(gestartet.created, true)
    assert.equal(acceptPending(gestartet.state, pending), false)
    assert.equal(acceptPending(gestartet.state, neu), true)
  })

  test('Kategorieverlust, Entzug, Close und veraltete Kommandos setzen die Epoche dauerhaft ausser Kraft', () => {
    let state = gebunden(bereit())
    const token = issueWork(state, 'discovercars')
    assert.ok(token)
    state = starten(state, token).state
    assert.equal(state.live?.epoch, token.epoch)
    const liveGeneration = state.live?.generation
    const verloren = ingestApi(state, api(false, true))
    assert.equal(verloren.phase, 'ready')
    assert.equal(verloren.live, null)
    assert.equal(verloren.slots.discovercars.intent, 'withdrawn')
    assert.equal(acceptPending(verloren, token), false)
    const wiederTrue = ingestApi(verloren, api(true, true))
    const ohneNeu = starten(wiederTrue, token)
    assert.equal(ohneNeu.created, false)
    assert.equal(ohneNeu.state.slots.discovercars.intent, 'withdrawn')

    state = selectProvider(ohneNeu.state, 'discovercars')
    assert.equal(issueWork(state, 'discovercars'), null)
    state = gebunden(state)
    const zweit = issueWork(state, 'discovercars')
    assert.ok(zweit)
    state = starten(state, zweit).state
    assert.equal(acceptPending(state, token), false)
    assert.equal(acceptPending(state, zweit), true)
    assert.notEqual(state.live?.epoch, token.epoch)

    const vorStale = state
    const stale = dispatchChoice(state, 'discovercars', { type: 'reset_context', generation: 0, reason: 'reorder' })
    assert.equal(stale, vorStale)
    assert.equal(stale.live?.epoch, zweit.epoch)
    assert.equal(acceptPending(stale, zweit), true)

    const nachGrant = dispatchChoice(stale, 'discovercars', {
      type: 'grant_informative',
      generation: stale.slots.discovercars.consent.generation,
    })
    assert.equal(nachGrant.live?.epoch, zweit.epoch)
    assert.notEqual(nachGrant.slots.discovercars.consent.generation, liveGeneration)
    assert.equal(acceptPending(nachGrant, zweit), true)
    assert.equal(acceptPending(nachGrant, {
      providerId: 'discovercars',
      epoch: nachGrant.slots.discovercars.consent.generation,
      scopeKey: 'scope-alpha',
      policyId: zweit.policyId,
      requiredOptional: zweit.requiredOptional,
    }), false)

    const geschlossen = dispatchChoice(nachGrant, 'discovercars', {
      type: 'close',
      generation: nachGrant.slots.discovercars.consent.generation,
    })
    assert.equal(geschlossen.live, null)
    assert.equal(geschlossen.slots.discovercars.intent, 'withdrawn')
    assert.equal(acceptPending(geschlossen, zweit), false)

    state = gebunden(selectProvider(geschlossen, 'discovercars'))
    const dritt = issueWork(state, 'discovercars')
    assert.ok(dritt)
    state = starten(state, dritt).state
    const umsortiert = dispatchChoice(state, 'discovercars', {
      type: 'reset_context',
      generation: state.slots.discovercars.consent.generation,
      reason: 'reorder',
    })
    assert.equal(umsortiert.live, null)
    assert.equal(umsortiert.slots.discovercars.intent, 'none')
    assert.equal(acceptPending(umsortiert, dritt), false)
    const gleicherScope = dispatchChoice(state, 'discovercars', {
      type: 'reset_context',
      generation: state.slots.discovercars.consent.generation,
      reason: 'scope_changed',
      scopeKey: 'scope-alpha',
    })
    assert.equal(gleicherScope.live?.epoch, dritt.epoch)
    const neuerScope = dispatchChoice(state, 'discovercars', {
      type: 'reset_context',
      generation: state.slots.discovercars.consent.generation,
      reason: 'scope_changed',
      scopeKey: 'scope-beta',
    })
    assert.equal(neuerScope.live, null)
    assert.equal(neuerScope.slots.discovercars.consent.scopeKey, 'scope-beta')
    assert.equal(neuerScope.slots.discovercars.intent, 'none')
    assert.equal(acceptPending(neuerScope, dritt), false)
  })

  test('ungültige API, Ablehnung und Unmount ziehen auch eine noch nicht gerahmte Auswahl ein', () => {
    let state = gebunden(bereit())
    const token = issueWork(state, 'discovercars')
    assert.ok(token)
    const kaputt = ingestApi(state, {
      getAllConsents() { throw new Error('load') },
      getConsent() { return true },
      hasExplicitConsent() { return true },
    })
    assert.equal(kaputt.phase, 'error')
    assert.equal(kaputt.slots.discovercars.intent, 'withdrawn')
    assert.equal(acceptPending(kaputt, token), false)
    assert.equal(startLocalContext(kaputt, 'discovercars', POLICY, api(), 'jetnity.com', token).created, false)

    state = gebunden(bereit())
    const offen = issueWork(state, 'discovercars')
    assert.ok(offen)
    state = starten(state, offen).state
    const abgelehnt = dispatchChoice(state, 'discovercars', {
      type: 'refuse',
      generation: state.slots.discovercars.consent.generation,
    })
    assert.equal(abgelehnt.live, null)
    assert.equal(acceptPending(abgelehnt, offen), false)

    state = gebunden(bereit())
    const gemerkt = issueWork(state, 'discovercars')
    assert.ok(gemerkt)
    const demontiert = releaseMountedContext(state, 'discovercars')
    assert.equal(demontiert.live, null)
    assert.equal(demontiert.slots.discovercars.intent, 'withdrawn')
    assert.equal(acceptPending(demontiert, gemerkt), false)
    assert.equal(releaseMountedContext(demontiert, 'discovercars'), demontiert)
    assert.equal(demontiert.slots.twelvego.intent, 'none')
  })

  test('eine schmale Politik überlebt fremde Werbekategorien und verliert nur ihre eigene', () => {
    const nurStatistik = api(true, true, {
      AD_STORAGE: false,
      AD_USER_DATA: false,
      AD_PERSONALIZATION: false,
      PERSONALIZATION_STORAGE: false,
    })
    const erlaubt = decideBundle({
      policy: ANALYTICS_ONLY,
      providerId: 'discovercars',
      intent: 'selected',
      generation: 1,
      expectedGeneration: 1,
      consents: nurStatistik.getAllConsents(),
      snapshotUsable: true,
      hostname: 'jetnity.com',
    })
    assert.equal(erlaubt.reason, 'local_context_allowed')
    assert.equal(erlaubt.localContext, true)

    let state = selectProvider(ingestApi(createController(), nurStatistik), 'discovercars')
    assert.equal(issueWork(state, 'discovercars'), null)
    const ungebunden = {
      providerId: 'discovercars' as const,
      epoch: state.slots.discovercars.epoch,
      scopeKey: state.slots.discovercars.consent.scopeKey,
      policyId: ANALYTICS_ONLY.id,
      requiredOptional: ['ANALYTICS_STORAGE'] as const,
    }
    state = ingestApi(state, api(false, true))
    state = ingestApi(state, api(true, true))
    assert.equal(state.slots.discovercars.intent, 'selected')
    assert.equal(state.slots.discovercars.epoch, ungebunden.epoch)
    const retro = startLocalContext(state, 'discovercars', ANALYTICS_ONLY, nurStatistik, 'jetnity.com', ungebunden)
    assert.equal(retro.created, false)
    assert.equal(retro.state.live, null)
    assert.equal(retro.state.slots.discovercars.requiredOptional, null)
    assert.equal(acceptPending(retro.state, ungebunden), false)
    state = bindReviewedPolicy(retro.state, 'discovercars', ANALYTICS_ONLY)
    const token = issueWork(state, 'discovercars')
    assert.ok(token)
    const gestartet = startLocalContext(state, 'discovercars', ANALYTICS_ONLY, nurStatistik, 'jetnity.com', token)
    assert.equal(gestartet.created, true)
    assert.equal(gestartet.state.slots.discovercars.epoch, token.epoch)
    assert.equal(gestartet.decision.reason, 'local_context_allowed')
    assert.deepEqual(gestartet.state.live?.requiredOptional, ['ANALYTICS_STORAGE'])

    const fremd = ingestApi(gestartet.state, nurStatistik)
    assert.equal(fremd.live?.epoch, token.epoch)
    assert.equal(fremd.slots.discovercars.intent, 'selected')
    assert.equal(acceptPending(fremd, token), true)

    const ohneRahmen = bindReviewedPolicy(selectProvider(ingestApi(createController(), api()), 'discovercars'), 'discovercars', ANALYTICS_ONLY)
    const pending = issueWork(ohneRahmen, 'discovercars')
    assert.ok(pending)
    const werbungAus = ingestApi(ohneRahmen, nurStatistik)
    assert.equal(werbungAus.slots.discovercars.intent, 'selected')
    assert.equal(werbungAus.slots.discovercars.epoch, pending.epoch)
    assert.equal(werbungAus.retired.some((eintrag) => eintrag.epoch === pending.epoch), false)
    const pflichtWeg = ingestApi(werbungAus, api(false, true))
    assert.equal(pflichtWeg.slots.discovercars.intent, 'withdrawn')
    assert.equal(pflichtWeg.live, null)
    assert.equal(acceptPending(pflichtWeg, pending), false)
    const ohneNeu = startLocalContext(pflichtWeg, 'discovercars', ANALYTICS_ONLY, api(true), 'jetnity.com', pending)
    assert.equal(ohneNeu.created, false)

    state = bindReviewedPolicy(selectProvider(ingestApi(createController(), api()), 'discovercars'), 'discovercars', ANALYTICS_ONLY)
    const voll = issueWork(state, 'discovercars')
    assert.ok(voll)
    state = startLocalContext(state, 'discovercars', ANALYTICS_ONLY, api(), 'jetnity.com', voll).state
    const nurWerbung = ingestApi(state, api(true, true, { AD_STORAGE: false }))
    assert.equal(nurWerbung.live?.epoch, voll.epoch)
    assert.equal(acceptPending(nurWerbung, voll), true)
    const statistikWeg = ingestApi(nurWerbung, api(false, true, { AD_STORAGE: false }))
    assert.equal(statistikWeg.live, null)
    assert.equal(statistikWeg.slots.discovercars.intent, 'withdrawn')
    assert.equal(acceptPending(statistikWeg, voll), false)
  })
})
