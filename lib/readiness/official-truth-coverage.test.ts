import { r2IdentityFixture } from './official-truth-content-identity-r2.test'
import { contentIdentityBinding } from './official-truth-content-identity'
// lib/readiness/official-truth-coverage.test.ts
//
// Abdeckung und Frische. Eine fehlende Aussage bleibt eine Lücke.
// Kein Netz, keine Datenbank, kein Provider, kein Modell.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import type { EvidenceLifecycle, EvidenceValidationState } from '@/lib/readiness/evidence'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { REGEL_FAKT_ARTEN, REGEL_SCOPE_PRAEFIX, REGEL_SUPPORT_MAX, type RegelFaktArt } from '@/lib/readiness/rule-claims'
import {
  officialTruthAbdeckungBewerten,
  type OfficialTruthAbdeckung,
  type OfficialTruthAbdeckungAnfrage,
  type OfficialTruthAbdeckungClaim,
  type OfficialTruthAbdeckungStuetze,
} from '@/lib/readiness/official-truth-coverage'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const REFERENZ = '2026-10-01T12:00:00.000Z'
const ABGERUFEN = '2026-09-01T12:00:00.000Z'
const SCOPE = `${REGEL_SCOPE_PRAEFIX}${'a'.repeat(64)}`
const ANDERER_SCOPE = `${REGEL_SCOPE_PRAEFIX}${'b'.repeat(64)}`

type SchluesselTiefe<T> = T extends readonly (infer U)[]
  ? SchluesselTiefe<U>
  : T extends object
    ? { [K in keyof T & string]: K | SchluesselTiefe<T[K]> }[keyof T & string]
    : never

type Personenfeld = 'passportNumber' | 'userId' | 'mrz' | 'email' | 'travellerClientRef' | 'dateOfBirth'
type PersonenUnmoeglich = Extract<SchluesselTiefe<OfficialTruthAbdeckungAnfrage>, Personenfeld> extends never ? true : never
type WirkungUnmoeglich = Extract<OfficialTruthAbdeckung['status'], 'required' | 'not_required' | 'conditional'> extends never ? true : never

const personenFelderUnmoeglich: PersonenUnmoeglich = true
const wirkungUnmoeglich: WirkungUnmoeglich = true

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function version(zeichen: string): string {
  return r2IdentityFixture(zeichen).versionId
}

function stuetze(teil?: Partial<OfficialTruthAbdeckungStuetze> & { versionId?: string }): OfficialTruthAbdeckungStuetze {
  return {
    ...contentIdentityBinding(r2IdentityFixture(['a', 'b', 'c', '1', '2', '3', '4', '5', '6', '7', '8', '9'].find((token) => version(token) === teil?.versionId) ?? 'a')),
    identitySchema: 2,
    versionId: teil?.versionId ?? version('a'),
    ruleScopeKey: teil?.ruleScopeKey ?? SCOPE,
    lifecycle: teil?.lifecycle ?? 'accepted',
    validationState: teil?.validationState ?? 'valid',
    retrievedAt: teil?.retrievedAt ?? ABGERUFEN,
    validFrom: teil && 'validFrom' in teil ? (teil.validFrom ?? null) : null,
    validUntil: teil && 'validUntil' in teil ? (teil.validUntil ?? null) : null,
    sourceId: teil?.sourceId ?? 'example-border-authority',
  }
}

function claim(ids: readonly string[], teil?: Partial<OfficialTruthAbdeckungClaim>): OfficialTruthAbdeckungClaim {
  return {
    lifecycle: teil?.lifecycle ?? 'accepted',
    validationState: teil?.validationState ?? 'valid',
    ruleScopeKey: teil?.ruleScopeKey ?? SCOPE,
    factKind: teil?.factKind ?? 'stay_limit',
    supportVersionIds: ids,
  }
}

function anfrage(teil?: Partial<OfficialTruthAbdeckungAnfrage> & { support?: readonly OfficialTruthAbdeckungStuetze[] }): OfficialTruthAbdeckungAnfrage {
  const ids = teil?.claim === undefined ? [version('a')] : teil.claim?.supportVersionIds
  return {
    ruleScopeKey: teil?.ruleScopeKey ?? SCOPE,
    factKind: teil?.factKind ?? 'stay_limit',
    claim: teil && 'claim' in teil ? (teil.claim ?? null) : claim(ids ?? [version('a')]),
    support: teil?.support ?? (ids ? ids.map((id, index) => stuetze({ versionId: id, sourceId: index === 0 ? 'example-border-authority' : 'example-interior-authority' })) : []),
    referenceTime: teil?.referenceTime ?? REFERENZ,
    ...(teil && 'maxAgeMs' in teil ? { maxAgeMs: teil.maxAgeMs } : {}),
  }
}

describe('Official Truth coverage and freshness', () => {
  test('Personenfelder und Anforderungswirkungen sind im Vertrag nicht ausdrückbar', () => {
    assert.equal(personenFelderUnmoeglich, true)
    assert.equal(wirkungUnmoeglich, true)
    const text = quelle('lib/readiness/official-truth-coverage.ts')
    assert.doesNotMatch(text, /not_required|'required'|"required"|conditional/)
    assert.doesNotMatch(text, /officialFrische|officialCheckedAtMaxAgeMs|OFFICIAL_CHECKED_AT_MAX_AGE_MS/)
    assert.doesNotMatch(text, /from '@\/lib\/readiness\/(engine|provider|official-truth-store-server)'/)
    assert.doesNotMatch(text, /supabase|openai|Date\.now|fetch\(/)
    assert.equal(requirementsProviderAus(), null)
  })

  test('die Kennungsmenge bleibt an den bestehenden Claim-Vertrag gebunden', () => {
    const claims = quelle('lib/readiness/rule-claims.ts')
    const coverage = quelle('lib/readiness/official-truth-coverage.ts')
    const registry = quelle('lib/readiness/source-registry.ts')
    const start = claims.indexOf('const PERSONEN_SCHLUESSEL = new Set([')
    const ende = claims.indexOf('])', start)
    const schluessel = [...claims.slice(start, ende).matchAll(/'([^']+)'/g)].map((treffer) => treffer[1])
    assert.ok(schluessel.length >= 30)
    for (const schluesselName of schluessel) {
      assert.equal(coverage.includes(`'${schluesselName}'`), true, schluesselName)
    }
    assert.equal(claims.includes('const VERSION_ID = /^ev2_[a-f0-9]{32}$/'), true)
    assert.equal(coverage.includes('const VERSION_ID = /^ev2_[a-f0-9]{32}$/'), true)
    assert.equal(registry.includes('return /^[a-z][a-z0-9_-]{1,63}$/.test(id)'), true)
    assert.equal(coverage.includes('const QUELLEN_ID = /^[a-z][a-z0-9_-]{1,63}$/'), true)
    assert.deepEqual(REGEL_FAKT_ARTEN.includes('stay_limit'), true)
  })

  test('ohne Aussage bleibt die angeforderte Faktart eine Lücke', () => {
    const ergebnis = officialTruthAbdeckungBewerten(anfrage({ claim: null, support: [] }))
    assert.deepEqual(ergebnis, { status: 'missing', ruleScopeKey: SCOPE, factKind: 'stay_limit' })
    assert.equal('reason' in ergebnis, false)
    assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
  })

  test('eine herumliegende Kandidatenstütze füllt die Lücke nicht', () => {
    const ergebnis = officialTruthAbdeckungBewerten(
      anfrage({
        claim: null,
        support: [stuetze({ lifecycle: 'candidate', validationState: 'pending' })],
      }),
    )
    assert.equal(ergebnis.status, 'missing')
  })

  test('akzeptierte Aussage ohne Höchstalter bleibt auch nach langer Abrufzeit aktuell', () => {
    const ergebnis = officialTruthAbdeckungBewerten(
      anfrage({
        support: [stuetze({ retrievedAt: '2020-01-01T00:00:00.000Z' })],
      }),
    )
    assert.deepEqual(ergebnis, {
      status: 'current',
      ruleScopeKey: SCOPE,
      factKind: 'stay_limit',
      supportVersionIds: [version('a')],
    })
  })

  test('Höchstalter wird nur überschritten, wenn der Abstand echt grösser ist', () => {
    const abgerufen = '2026-10-01T11:00:00.000Z'
    const basis = anfrage({ support: [stuetze({ retrievedAt: abgerufen })] })
    assert.equal(officialTruthAbdeckungBewerten({ ...basis, maxAgeMs: 3_600_000 }).status, 'current')
    const darueber = officialTruthAbdeckungBewerten({ ...basis, maxAgeMs: 3_599_999 })
    assert.deepEqual(darueber, {
      status: 'recheck_needed',
      ruleScopeKey: SCOPE,
      factKind: 'stay_limit',
      reason: 'max_age_exceeded',
    })
  })

  test('ein altes Glied einer zusammengesetzten Aussage zieht die ganze Aussage nach', () => {
    const erste = version('a')
    const zweite = version('b')
    const ergebnis = officialTruthAbdeckungBewerten(
      anfrage({
        claim: claim([erste, zweite]),
        support: [
          stuetze({ versionId: zweite, retrievedAt: '2026-10-01T11:59:00.000Z', sourceId: 'example-interior-authority' }),
          stuetze({ versionId: erste, retrievedAt: '2026-10-01T10:00:00.000Z' }),
        ],
        maxAgeMs: 60 * 60 * 1000,
      }),
    )
    assert.equal(ergebnis.status, 'recheck_needed')
    if (ergebnis.status === 'recheck_needed') assert.equal(ergebnis.reason, 'max_age_exceeded')
  })

  test('kaputte und fehlende Zeitstempel sind ungültig', () => {
    const kaputt = ['', '2026-10-01', 'gestern', '2026-13-40T99:99:99Z', '2026-10-01T12:00:00+00:00', '2026-10-01T12:00:00.0000Z']
    for (const retrievedAt of kaputt) {
      const ergebnis = officialTruthAbdeckungBewerten(anfrage({ support: [stuetze({ retrievedAt })] }))
      assert.equal(ergebnis.status, 'invalid', retrievedAt)
      if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'invalid_timestamp')
    }
    for (const referenceTime of ['', '2026-10-01', 'now']) {
      const ergebnis = officialTruthAbdeckungBewerten(anfrage({ referenceTime }))
      assert.equal(ergebnis.status, 'invalid', referenceTime)
      if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'invalid_reference_time')
    }
    for (const fenster of [
      { validFrom: 'morgen', validUntil: null },
      { validFrom: null, validUntil: '2026-10-01T12:00:00' },
      { validFrom: '2026-10-03', validUntil: '2026-10-02' },
    ]) {
      const ergebnis = officialTruthAbdeckungBewerten(anfrage({ support: [stuetze(fenster)] }))
      assert.equal(ergebnis.status, 'invalid')
      if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'invalid_timestamp')
    }
  })

  test('Abruf in der Zukunft ist ungültig, Gleichstand bleibt gültig', () => {
    const zukunft = officialTruthAbdeckungBewerten(
      anfrage({ support: [stuetze({ retrievedAt: '2026-10-01T12:00:00.001Z' })] }),
    )
    assert.equal(zukunft.status, 'invalid')
    if (zukunft.status === 'invalid') assert.equal(zukunft.reason, 'retrieved_at_in_future')
    const gleich = officialTruthAbdeckungBewerten(
      anfrage({ support: [stuetze({ retrievedAt: REFERENZ })] }),
    )
    assert.equal(gleich.status, 'current')
  })

  test('ein noch nicht begonnenes oder schon beendetes Fenster braucht eine neue Prüfung', () => {
    const davor = officialTruthAbdeckungBewerten(
      anfrage({ support: [stuetze({ validFrom: '2026-10-02', validUntil: '2026-10-09' })] }),
    )
    assert.equal(davor.status, 'recheck_needed')
    if (davor.status === 'recheck_needed') assert.equal(davor.reason, 'valid_from_in_future')

    const begonnen = officialTruthAbdeckungBewerten(
      anfrage({ support: [stuetze({ validFrom: REFERENZ, validUntil: '2026-10-09T00:00:00.000Z' })] }),
    )
    assert.equal(begonnen.status, 'current')

    const danach = officialTruthAbdeckungBewerten(
      anfrage({ support: [stuetze({ validFrom: '2026-09-01', validUntil: '2026-10-01T11:59:59.000Z' })] }),
    )
    assert.equal(danach.status, 'recheck_needed')
    if (danach.status === 'recheck_needed') assert.equal(danach.reason, 'valid_until_elapsed')

    const bisJetzt = officialTruthAbdeckungBewerten(
      anfrage({ support: [stuetze({ validUntil: REFERENZ })] }),
    )
    assert.equal(bisJetzt.status, 'current')
  })

  test('ein ungültiges Fenster schlägt eine blosse Neu-Prüfung, unabhängig von der Reihenfolge', () => {
    const erste = stuetze({ versionId: version('a'), validFrom: '2026-12-01' })
    const zweite = stuetze({
      versionId: version('b'),
      retrievedAt: '2026-10-01T13:00:00.000Z',
      sourceId: 'example-interior-authority',
    })
    const hin = officialTruthAbdeckungBewerten(anfrage({ claim: claim([erste.versionId, zweite.versionId]), support: [erste, zweite] }))
    const her = officialTruthAbdeckungBewerten(anfrage({ claim: claim([zweite.versionId, erste.versionId]), support: [zweite, erste] }))
    assert.deepEqual(hin, her)
    assert.equal(hin.status, 'invalid')
    if (hin.status === 'invalid') assert.equal(hin.reason, 'retrieved_at_in_future')
  })

  test('fehlende, doppelte und überzählige Stützung ist ungültig', () => {
    const einzige = version('a')
    const andere = version('b')
    const fehlt = officialTruthAbdeckungBewerten(
      anfrage({ claim: claim([einzige, andere]), support: [stuetze({ versionId: einzige })] }),
    )
    assert.equal(fehlt.status, 'invalid')
    if (fehlt.status === 'invalid') assert.equal(fehlt.reason, 'incomplete_support')

    const doppelt = officialTruthAbdeckungBewerten(
      anfrage({
        claim: claim([einzige]),
        support: [stuetze({ versionId: einzige }), stuetze({ versionId: einzige, sourceId: 'example-interior-authority' })],
      }),
    )
    assert.equal(doppelt.status, 'invalid')
    if (doppelt.status === 'invalid') assert.equal(doppelt.reason, 'duplicate_support')

    const imClaim = officialTruthAbdeckungBewerten(
      anfrage({ claim: claim([einzige, einzige]), support: [stuetze({ versionId: einzige })] }),
    )
    assert.equal(imClaim.status, 'invalid')
    if (imClaim.status === 'invalid') assert.equal(imClaim.reason, 'duplicate_support')

    const erstKaputt = officialTruthAbdeckungBewerten(
      anfrage({ claim: claim(['keine-version', einzige, einzige]), support: [stuetze({ versionId: einzige })] }),
    )
    const erstDoppelt = officialTruthAbdeckungBewerten(
      anfrage({ claim: claim([einzige, einzige, 'keine-version']), support: [stuetze({ versionId: einzige })] }),
    )
    assert.deepEqual(erstKaputt, erstDoppelt)
    assert.equal(erstKaputt.status, 'invalid')
    if (erstKaputt.status === 'invalid') assert.equal(erstKaputt.reason, 'invalid_support')

    const extra = officialTruthAbdeckungBewerten(
      anfrage({
        claim: claim([einzige]),
        support: [stuetze({ versionId: einzige }), stuetze({ versionId: andere, sourceId: 'example-interior-authority' })],
      }),
    )
    assert.equal(extra.status, 'invalid')
    if (extra.status === 'invalid') assert.equal(extra.reason, 'support_mismatch')

    const leer = officialTruthAbdeckungBewerten(anfrage({ claim: claim([]), support: [] }))
    assert.equal(leer.status, 'invalid')
    if (leer.status === 'invalid') assert.equal(leer.reason, 'invalid_support')
  })

  test('die Reihenfolge der Stützung ändert weder Status noch sortierte Ids', () => {
    const erste = version('c')
    const zweite = version('a')
    const dritte = version('b')
    const ids = [erste, zweite, dritte]
    const quellen = ['example-border-authority', 'example-interior-authority', 'example-visa-portal']
    const vorwaerts = ids.map((id, index) => stuetze({ versionId: id, sourceId: quellen[index] }))
    const rueckwaerts = [...vorwaerts].reverse()
    const links = officialTruthAbdeckungBewerten(anfrage({ claim: claim(ids), support: vorwaerts }))
    const rechts = officialTruthAbdeckungBewerten(anfrage({ claim: claim([...ids].reverse()), support: rueckwaerts }))
    assert.deepEqual(links, rechts)
    assert.deepEqual(links, {
      status: 'current',
      ruleScopeKey: SCOPE,
      factKind: 'stay_limit',
      supportVersionIds: [version('a'), version('b'), version('c')].sort(),
    })
  })

  test('Kandidat, ausstehend, abgelehnt und Konflikt werden nicht als Stützung gelesen', () => {
    const faelle: Array<{ lifecycle: EvidenceLifecycle; validationState: EvidenceValidationState }> = [
      { lifecycle: 'candidate', validationState: 'pending' },
      { lifecycle: 'accepted', validationState: 'pending' },
      { lifecycle: 'accepted', validationState: 'rejected' },
      { lifecycle: 'conflicted', validationState: 'valid' },
      { lifecycle: 'superseded', validationState: 'valid' },
    ]
    for (const fall of faelle) {
      const ergebnis = officialTruthAbdeckungBewerten(anfrage({ support: [stuetze(fall)] }))
      assert.equal(ergebnis.status, 'invalid', `${fall.lifecycle}/${fall.validationState}`)
      if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'support_not_accepted')
    }
  })

  test('eine nicht angenommene oder fachfremde Aussage ist keine Lücke und keine Wirkung', () => {
    const kandidat = officialTruthAbdeckungBewerten(
      anfrage({ claim: claim([version('a')], { lifecycle: 'candidate', validationState: 'pending' }) }),
    )
    assert.equal(kandidat.status, 'invalid')
    if (kandidat.status === 'invalid') assert.equal(kandidat.reason, 'claim_not_accepted')

    const abgelehnt = officialTruthAbdeckungBewerten(
      anfrage({ claim: claim([version('a')], { validationState: 'rejected' }) }),
    )
    assert.equal(abgelehnt.status, 'invalid')
    if (abgelehnt.status === 'invalid') assert.equal(abgelehnt.reason, 'claim_not_accepted')

    const andereArt = officialTruthAbdeckungBewerten(
      anfrage({ factKind: 'passport_validity', claim: claim([version('a')], { factKind: 'stay_limit' }) }),
    )
    assert.equal(andereArt.status, 'invalid')
    if (andereArt.status === 'invalid') assert.equal(andereArt.reason, 'fact_kind_mismatch')

    const andererRaum = officialTruthAbdeckungBewerten(
      anfrage({ claim: claim([version('a')], { ruleScopeKey: ANDERER_SCOPE }) }),
    )
    assert.equal(andererRaum.status, 'invalid')
    if (andererRaum.status === 'invalid') assert.equal(andererRaum.reason, 'scope_mismatch')

    const andereStuetze = officialTruthAbdeckungBewerten(
      anfrage({ support: [stuetze({ ruleScopeKey: ANDERER_SCOPE })] }),
    )
    assert.equal(andereStuetze.status, 'invalid')
    if (andereStuetze.status === 'invalid') assert.equal(andereStuetze.reason, 'scope_mismatch')
  })

  test('Personenkennungen werden zur Laufzeit abgewiesen', () => {
    const mitPass = {
      ...anfrage(),
      passportNumber: 'X',
    }
    const ergebnis = officialTruthAbdeckungBewerten(mitPass)
    assert.equal(ergebnis.status, 'invalid')
    if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'personal_identifier_forbidden')

    const verschachtelt = officialTruthAbdeckungBewerten({
      ...anfrage(),
      support: [{ ...stuetze(), scan: 'bild' } as OfficialTruthAbdeckungStuetze],
    })
    assert.equal(verschachtelt.status, 'invalid')
    if (verschachtelt.status === 'invalid') assert.equal(verschachtelt.reason, 'personal_identifier_forbidden')
  })

  test('ein mitgelieferter Fakt wird nicht gelesen und nicht zur Wirkung', () => {
    const mitFakt = {
      ...claim([version('a')]),
      fact: { kind: 'stay_limit', effect: 'not_required' },
    }
    const ergebnis = officialTruthAbdeckungBewerten({
      ...anfrage(),
      claim: mitFakt as OfficialTruthAbdeckungClaim,
    })
    assert.equal(ergebnis.status, 'invalid')
    if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'unexpected_fields')
    assert.equal(JSON.stringify(ergebnis).includes('not_required'), false)
  })

  test('ungültiges Höchstalter, Schlüssel und Quellen-Id scheitern geschlossen', () => {
    for (const maxAgeMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, null] as const) {
      const ergebnis = officialTruthAbdeckungBewerten({ ...anfrage(), maxAgeMs: maxAgeMs as number })
      assert.equal(ergebnis.status, 'invalid', String(maxAgeMs))
      if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'invalid_max_age')
    }
    const schluessel = officialTruthAbdeckungBewerten(anfrage({ ruleScopeKey: 'evidence-key:v2:aaaaaaaa' }))
    assert.equal(schluessel.status, 'invalid')
    if (schluessel.status === 'invalid') assert.equal(schluessel.reason, 'invalid_rule_scope_key')

    const art = officialTruthAbdeckungBewerten(anfrage({ factKind: 'visa_exemption' as RegelFaktArt }))
    assert.equal(art.status, 'invalid')
    if (art.status === 'invalid') assert.equal(art.reason, 'invalid_fact_kind')

    const quelleId = officialTruthAbdeckungBewerten(anfrage({ support: [stuetze({ sourceId: 'Example Authority' })] }))
    assert.equal(quelleId.status, 'invalid')
    if (quelleId.status === 'invalid') assert.equal(quelleId.reason, 'invalid_support')
  })

  test('mehr als die bestehende Stützungsgrenze ist ungültig', () => {
    const ids = Array.from({ length: REGEL_SUPPORT_MAX + 1 }, (_, index) => version((index + 1).toString(16)))
    const ergebnis = officialTruthAbdeckungBewerten(
      anfrage({
        claim: claim(ids),
        support: ids.map((id, index) => stuetze({ versionId: id, sourceId: `source-${index + 1}` })),
      }),
    )
    assert.equal(ergebnis.status, 'invalid')
    if (ergebnis.status === 'invalid') assert.equal(ergebnis.reason, 'invalid_support')
    assert.equal(REGEL_SUPPORT_MAX, 8)
  })

  test('ein noch nicht wirksames Fenster hat Vorrang vor dem Höchstalter', () => {
    const ergebnis = officialTruthAbdeckungBewerten(
      anfrage({
        support: [stuetze({ retrievedAt: '2020-01-01T00:00:00.000Z', validFrom: '2026-12-01' })],
        maxAgeMs: 1,
      }),
    )
    assert.equal(ergebnis.status, 'recheck_needed')
    if (ergebnis.status === 'recheck_needed') assert.equal(ergebnis.reason, 'valid_from_in_future')
  })

  test('die Eingabe wird nicht verändert', () => {
    const support = [stuetze({ versionId: version('b') }), stuetze({ versionId: version('a'), sourceId: 'example-interior-authority' })]
    const eingabe = anfrage({ claim: claim([version('b'), version('a')]), support })
    const vorher = JSON.stringify(eingabe)
    officialTruthAbdeckungBewerten(eingabe)
    assert.equal(JSON.stringify(eingabe), vorher)
  })
})
