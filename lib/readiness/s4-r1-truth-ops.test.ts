import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  REQUIREMENTS_PROVIDER_TIMEOUT_MS,
  requirementsFreshnessAusFehlerArt,
  requirementsProviderAbrufen,
  requirementsTimeoutBegrenzen,
} from '@/lib/readiness/abruf'
import { requirementsAuswerten } from '@/lib/readiness/engine'
import {
  OFFICIAL_CHECKED_AT_MAX_AGE_MS,
  officialCheckedAtMaxAgeMs,
  officialFrische,
} from '@/lib/readiness/official'
import { requirementsProviderAus, type RequirementsAnfrage, type RequirementsProvider } from '@/lib/readiness/provider'

const JETZT = '2026-08-30T12:00:00.000Z'
const FINGERPRINT = 'off-v2|t=traveller:1|opt=|cit=CH|res=|docs=|orig=CH|dest=US|tr=|start=2026-09-12|end=2026-09-16|type=visa'

const anfrage: RequirementsAnfrage = {
  originCountryCode: 'CH',
  destinationCountryCodes: ['US'],
  transitCountryCodes: [],
  startDate: '2026-09-12',
  endDate: '2026-09-16',
  travellers: [
    {
      clientRef: 'traveller:1',
      residenceCountryCode: 'CH',
      citizenshipCountryCodes: ['CH'],
      documents: [],
      credentialOptions: [
        {
          optionRef: 'traveller:1:none',
          documentClientRef: null,
          documentType: null,
          issuingCountryCode: null,
          expiresOn: null,
          relatedCitizenshipCountryCode: null,
        },
      ],
    },
  ],
}

function haengend(
  onSignal?: (signal: AbortSignal) => void,
): RequirementsProvider {
  return {
    name: 'hang-double',
    evaluate(_anfrage, signal) {
      onSignal?.(signal)
      return new Promise(() => {
        /* hängt absichtlich, bis das Domain-Timeout abbricht */
      })
    },
  }
}

describe('Requirements Truth-Ops S4-R1', () => {
  test('Provider-Port erhält ein AbortSignal', async () => {
    let gesehen: AbortSignal | undefined
    let abortedWaehrendCall = true
    const provider: RequirementsProvider = {
      name: 'signal-double',
      async evaluate(_anfrage, signal) {
        gesehen = signal
        abortedWaehrendCall = signal.aborted
        return []
      },
    }
    await requirementsAuswerten(anfrage, provider, null, { now: JETZT })
    assert.equal(gesehen instanceof AbortSignal, true)
    assert.equal(abortedWaehrendCall, false)
  })

  test('Domain-Timeout abortet einen hängenden Provider fail closed', async () => {
    let signal: AbortSignal | undefined
    const start = Date.now()
    const abruf = await requirementsProviderAbrufen(haengend((wert) => {
      signal = wert
    }), anfrage, { timeoutMs: 25 })
    const evaluations = await requirementsAuswerten(anfrage, haengend(), null, {
      timeoutMs: 25,
      now: JETZT,
    })
    assert.ok(Date.now() - start < 1_000)
    assert.equal(abruf.ok, false)
    if (!abruf.ok) assert.equal(abruf.art, 'timeout')
    assert.equal(signal?.aborted, true)
    assert.ok(evaluations.length > 0)
    assert.ok(evaluations.every((eintrag) => eintrag.result === 'unknown'))
    assert.ok(
      evaluations.every(
        (eintrag) =>
          eintrag.result !== 'required' &&
          eintrag.result !== 'not_required' &&
          eintrag.result !== 'conditional',
      ),
    )
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
  })

  test('bereits abgebrochenes Signal startet den Provider nicht', async () => {
    let aufrufe = 0
    const steuer = new AbortController()
    steuer.abort()
    const provider: RequirementsProvider = {
      name: 'count-double',
      async evaluate() {
        aufrufe += 1
        return []
      },
    }
    const abruf = await requirementsProviderAbrufen(provider, anfrage, { signal: steuer.signal })
    const evaluations = await requirementsAuswerten(anfrage, provider, null, {
      signal: steuer.signal,
      now: JETZT,
    })
    assert.equal(aufrufe, 0)
    assert.deepEqual(abruf, { ok: false, art: 'aborted' })
    assert.ok(evaluations.every((eintrag) => eintrag.result === 'unknown'))
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
  })

  test('externes AbortSignal bricht eine laufende Provider-Ausführung ab', async () => {
    const steuer = new AbortController()
    let gesehen: AbortSignal | undefined
    const provider: RequirementsProvider = {
      name: 'abort-double',
      evaluate(_anfrage, signal) {
        gesehen = signal
        return new Promise(() => {
          /* wartet auf Abort */
        })
      },
    }
    const lauf = requirementsProviderAbrufen(provider, anfrage, {
      signal: steuer.signal,
      timeoutMs: 2_000,
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
    steuer.abort()
    const abruf = await lauf
    assert.equal(gesehen?.aborted, true)
    assert.deepEqual(abruf, { ok: false, art: 'aborted' })
  })

  test('Timeout, Abort, temporary unavailable und unavailable bleiben unterscheidbar', async () => {
    const timeout = await requirementsProviderAbrufen(haengend(), anfrage, { timeoutMs: 20 })
    assert.equal(timeout.ok, false)
    if (!timeout.ok) assert.equal(timeout.art, 'timeout')

    const abortSteuer = new AbortController()
    abortSteuer.abort()
    const aborted = await requirementsProviderAbrufen(haengend(), anfrage, { signal: abortSteuer.signal })
    assert.deepEqual(aborted, { ok: false, art: 'aborted' })

    const temp: RequirementsProvider = {
      name: 'temp-double',
      async evaluate() {
        throw Object.assign(new Error('vendor-timeout'), { availability: 'temporarily_unavailable' })
      },
    }
    const tot: RequirementsProvider = {
      name: 'dead-double',
      async evaluate() {
        throw Object.assign(new Error('vendor-down'), { availability: 'unavailable' })
      },
    }
    const tempAbruf = await requirementsProviderAbrufen(temp, anfrage)
    const totAbruf = await requirementsProviderAbrufen(tot, anfrage)
    assert.deepEqual(tempAbruf, { ok: false, art: 'temporarily_unavailable' })
    assert.deepEqual(totAbruf, { ok: false, art: 'unavailable' })
    assert.equal(requirementsFreshnessAusFehlerArt('timeout'), 'source_temporarily_unavailable')
    assert.equal(requirementsFreshnessAusFehlerArt('aborted'), 'source_temporarily_unavailable')
    assert.equal(requirementsFreshnessAusFehlerArt('temporarily_unavailable'), 'source_temporarily_unavailable')
    assert.equal(requirementsFreshnessAusFehlerArt('unavailable'), 'provider_unavailable')
  })

  test('technische Fehler minten keine Hard Truth und leaken keine Raw-Errors', async () => {
    const provider: RequirementsProvider = {
      name: 'secret-throw',
      async evaluate() {
        throw Object.assign(new Error('sk_live_leaked_vendor_secret'), {
          availability: 'temporarily_unavailable',
        })
      },
    }
    const evaluations = await requirementsAuswerten(anfrage, provider, null, { now: JETZT })
    const serialisiert = JSON.stringify(evaluations)
    assert.ok(evaluations.every((eintrag) => eintrag.result === 'unknown'))
    assert.equal(evaluations[0]?.freshness, 'source_temporarily_unavailable')
    assert.equal(evaluations[0]?.evidence.provider, null)
    assert.equal(evaluations[0]?.evidence.checkedAt, null)
    assert.doesNotMatch(serialisiert, /sk_live_leaked_vendor_secret/)
    assert.doesNotMatch(serialisiert, /vendor-timeout|vendor-down/)
  })

  test('Factory bleibt null', () => {
    assert.equal(requirementsProviderAus(), null)
  })

  test('Requirements-Route propagiert req.signal und bleibt hinter dem Kill-Switch', () => {
    const route = readFileSync(join(process.cwd(), 'app/api/readiness/requirements/route.ts'), 'utf8')
    assert.match(route, /export const maxDuration = 10/)
    assert.match(route, /signal:\s*req\.signal/)
    assert.match(route, /requirementsProviderNachZustand\(requirementsProviderAus\(\)\)/)
    assert.doesNotMatch(route, /runtime\s*=\s*['"]edge['"]/)
  })

  test('Production-Timeout bleibt begrenzt und Client-Werte werden gekappt', () => {
    assert.equal(REQUIREMENTS_PROVIDER_TIMEOUT_MS, 4_000)
    assert.equal(requirementsTimeoutBegrenzen(undefined), 4_000)
    assert.equal(requirementsTimeoutBegrenzen(20_000), 4_000)
    assert.equal(requirementsTimeoutBegrenzen(-1), 4_000)
    assert.equal(requirementsTimeoutBegrenzen(25), 25)
  })

  test('officialFrische: Evidence unter 60 min kann current sein', () => {
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T11:30:00.000Z',
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: true,
      }),
      'current',
    )
  })

  test('officialFrische: exakte TTL-Grenze und darüber sind recheck_needed', () => {
    const Grenze = '2026-08-30T11:00:00.000Z'
    assert.equal(OFFICIAL_CHECKED_AT_MAX_AGE_MS, 60 * 60 * 1000)
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: Grenze,
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: true,
      }),
      'recheck_needed',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T10:59:59.000Z',
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: true,
      }),
      'recheck_needed',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T11:00:00.001Z',
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: true,
      }),
      'current',
    )
  })

  test('officialFrische: zu alte Evidence und injizierte Max-Age bleiben fail closed', () => {
    assert.equal(officialCheckedAtMaxAgeMs(24 * 60 * 60 * 1000), OFFICIAL_CHECKED_AT_MAX_AGE_MS)
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T11:59:59.000Z',
        validUntil: '2026-12-31',
        now: JETZT,
        maxAgeMs: 500,
        hasProvider: true,
      }),
      'recheck_needed',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: 'nicht-eine-zeit',
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: true,
      }),
      'never_checked',
    )
  })

  test('validUntil, Fingerprint und temporary-unavailable bleiben fail closed', () => {
    assert.equal(
      officialFrische({
        storedFingerprint: 'alt',
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T11:30:00.000Z',
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: true,
      }),
      'stale',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T11:30:00.000Z',
        validUntil: '2026-01-01',
        now: JETZT,
        hasProvider: true,
      }),
      'recheck_needed',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T11:30:00.000Z',
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: true,
        sourceAvailable: false,
      }),
      'source_temporarily_unavailable',
    )
    assert.equal(
      officialFrische({
        storedFingerprint: FINGERPRINT,
        currentFingerprint: FINGERPRINT,
        checkedAt: '2026-08-30T11:30:00.000Z',
        validUntil: '2026-12-31',
        now: JETZT,
        hasProvider: false,
      }),
      'provider_unavailable',
    )
  })

  test('alte Provider-Evidence wird nicht als current Hard Truth übernommen', async () => {
    const provider: RequirementsProvider = {
      name: 'stale-double',
      async evaluate() {
        return [
          {
            travellerClientRef: 'traveller:1',
            destinationCountryCode: 'US',
            requirementType: 'visa',
            result: 'required',
            authority: 'Test',
            sourceUrl: 'https://example.test/visa',
            checkedAt: '2026-08-30T10:00:00.000Z',
            validUntil: '2026-12-31',
          },
        ]
      },
    }
    const evaluations = await requirementsAuswerten(anfrage, provider, null, { now: JETZT })
    const visa = evaluations.find((eintrag) => eintrag.requirementType === 'visa')
    assert.equal(visa?.result, 'unknown')
    assert.equal(visa?.freshness, 'recheck_needed')
    assert.notEqual(visa?.status, 'current')
  })
})
