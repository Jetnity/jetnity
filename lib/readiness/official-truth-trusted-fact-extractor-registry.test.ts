import { r2Registry, r2Binding, r2Ref } from './official-truth-content-identity-r2.test'
// lib/readiness/official-truth-trusted-fact-extractor-registry.test.ts
//
// Synthetische Extraktor-Definitionen prüfen nur den Rahmen.
// Sie sind keine Behördenparser und stehen nicht im Produktionsregister.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import {
  OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY,
  officialTruthExtractorDefinitionenPruefen,
  officialTruthExtractorEingefroreneAusfuehrung,
  officialTruthTrustedFactExtrahieren,
  officialTruthTrustedFactExtrahierenMitDefinitionen,
  type OfficialTruthExtractorDefinition,
  type OfficialTruthExtractorKontext,
} from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import { regelScopeAusEvidenceScope, type RegelScope } from '@/lib/readiness/rule-claims'
import { quellenRegistryErstellen, type QuellenRegistry } from '@/lib/readiness/source-registry'

const DATEI = 'lib/readiness/official-truth-trusted-fact-extractor-registry.ts'
// #899 permits this one fixed-corpus developer execution, never a live importer.
const FIXTURE_IMPORTER = [DATEI, 'scripts/official-truth-integrated-pilot-1/engine.ts']
function fixtureImporterErlaubt(path: string): boolean { return FIXTURE_IMPORTER.includes(path) }
const ZEIT = '2026-10-03T00:00:00.000Z'
const SCOPE = `rule-scope:v1:${'a'.repeat(64)}`
const SEITEN_ID = 'ev2_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const GRENZE_ID = 'ev2_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const INNEN_ID = 'ev2_cccccccccccccccccccccccccccccccc'
const AMT = 'example-border-authority'
const INNEN = 'example-interior-authority'
const LIZENZ = 'example-licensed-provider'
const SEITEN_URL = 'https://www.gov.example/pages'
const GRENZE_URL = 'https://www.gov.example/effect'
const INNEN_URL = 'https://www.interior.example/effect'
const LIZENZ_URL = 'https://provider.example/rules'
const SEITEN_TEXT = 'EXAMPLE-SNAPSHOT-91f3'
const GRENZE_TEXT = 'EXAMPLE-BORDER-91f3'
const INNEN_TEXT = 'EXAMPLE-INTERIOR-91f3'

type Zaehler = { match: number; extract: number }

function datei(relativ: string): string {
  return readFileSync(join(process.cwd(), relativ), 'utf8')
}

function dateienUnter(relativ: string): string[] {
  const wurzel = join(process.cwd(), relativ)
  const fund: string[] = []
  const stapel = [wurzel]
  while (stapel.length > 0) {
    const aktuell = stapel.pop()
    if (!aktuell) break
    let eintraege: { name: string; isDirectory(): boolean }[]
    try {
      eintraege = readdirSync(aktuell, { withFileTypes: true })
    } catch {
      continue
    }
    for (const eintrag of eintraege) {
      if (eintrag.name === 'node_modules' || eintrag.name.startsWith('.')) continue
      const pfad = join(aktuell, eintrag.name)
      if (eintrag.isDirectory()) stapel.push(pfad)
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(eintrag.name)) fund.push(pfad)
    }
  }
  return fund
}

function registry(): QuellenRegistry {
  const ergebnis = quellenRegistryErstellen([
    {
      sourceId: AMT,
      sourceClass: 'official_authority',
      publisherName: 'Example Border Authority',
      authorityName: 'Example Border Authority',
      domains: ['gov.example'],
    },
    {
      sourceId: INNEN,
      sourceClass: 'official_authority',
      publisherName: 'Example Interior Authority',
      authorityName: 'Example Interior Authority',
      domains: ['interior.example'],
    },
    {
      sourceId: LIZENZ,
      sourceClass: 'licensed_evidence_provider',
      publisherName: 'Example Licensed Publisher',
      domains: ['provider.example'],
    },
  ])
  assert.equal(ergebnis.ok, true)
  if (!ergebnis.ok) throw new Error('registry')
  return r2Registry(ergebnis.registry, R2_PUBLICATIONS)
}

function abruf(
  sourceId: string,
  canonicalUrl: string,
  sourceSnapshot: string,
  contentType: string | null = 'application/json',
  sourceContentHash = evidenceQuellenFingerprint(sourceSnapshot),
) {
  return { ...r2Binding(registry(), sourceId === LIZENZ ? SEITEN_URL : canonicalUrl), identitySchema: 2 as const,
    status: 'server_owned_official_retrieval' as const,
    sourceId,
    canonicalUrl,
    retrievedAt: ZEIT,
    contentType,
    sourceSnapshot,
    sourceContentHash,
    redirectCount: 0,
  }
}

function stuetze(
  versionId: string,
  sourceId: string,
  canonicalUrl: string,
  sourceSnapshot: string,
  contentType: string | null = 'application/json',
  sourceContentHash?: string | null,
) {
  return {
    versionId,
    sourceId,
    retrieval: abruf(sourceId, canonicalUrl, sourceSnapshot, contentType, sourceContentHash ?? undefined),
  }
}

function zellenScope(requirementType: string, teil?: Record<string, unknown>): Record<string, unknown> {
  return {
    destinationCountryCode: 'JP',
    transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
    credentialOption: {
      mode: 'option',
      documentType: 'passport',
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: null,
    },
    residence: { mode: 'not_applicable' },
    requirementType,
    validity: { mode: 'not_applicable' },
    ...teil,
  }
}

function schluesselFuer(scope: unknown): string {
  const gelesen = regelScopeAusEvidenceScope(scope)
  if (!gelesen.ok) return SCOPE
  return gelesen.key
}

function mitScope(
  basis: Record<string, unknown>,
  teil?: Record<string, unknown>,
  requirementType = 'blank_passport_pages',
): Record<string, unknown> {
  const scope = teil && Object.hasOwn(teil, 'scope') ? teil.scope : zellenScope(requirementType)
  const scopeKey = teil && Object.hasOwn(teil, 'scopeKey') ? teil.scopeKey : schluesselFuer(scope)
  return { ...basis, ...teil, requirementType, scope, scopeKey }
}

function eingabe(teil?: Record<string, unknown>) {
  const requirementType = typeof teil?.requirementType === 'string' ? teil.requirementType : 'blank_passport_pages'
  return mitScope(
    {
      factKind: 'blank_passport_pages',
      requirementType,
      evidenceQuality: 'explicit_primary_statement',
      supports: [stuetze(SEITEN_ID, AMT, SEITEN_URL, SEITEN_TEXT)],
      policy: null,
      registry: registry(),
    },
    teil,
    requirementType,
  )
}

function definition(
  ueber: Partial<OfficialTruthExtractorDefinition> & { zaehler?: Zaehler } = {},
): OfficialTruthExtractorDefinition {
  const { zaehler: zaehlerRoh, ...rest } = ueber
  const zaehler = zaehlerRoh ?? { match: 0, extract: 0 }
  const basis: OfficialTruthExtractorDefinition = { representations: [AMT].map(fixtureRef).map((ref) => fixturePin(ref.sourceId)),
    extractorId: 'otx_example_pages',
    extractorVersion: 1,
    current: true,
    factKind: 'blank_passport_pages',
    sourceFamilyId: 'otf_example_pages',
    contentItemRefs: [AMT].map(fixtureRef),
    urlAllowlist: [{ kind: 'exact', canonicalUrl: SEITEN_URL }],
    contentTypes: ['application/json'],
    schemaFamily: 'ots_example_pages',
    policyId: null,
    policyVersion: null,
    requiredFieldPaths: [],
    match: () => {
      zaehler.match += 1
      return { ok: true }
    },
    extract: () => {
      zaehler.extract += 1
      return { ok: true, fact: { kind: 'blank_passport_pages', minimumPages: 2 } }
    },
  }
  return { ...basis, ...rest, match: rest.match ?? basis.match, extract: rest.extract ?? basis.extract }
}

function seitenDefinition(zaehler: Zaehler, ueber: Partial<OfficialTruthExtractorDefinition> = {}) {
  return definition({
    zaehler,
    ...ueber,
    match:
      ueber.match ??
      ((kontext) => {
        zaehler.match += 1
        if (kontext.supports.length !== 1 || kontext.supports[0]?.sourceSnapshot !== SEITEN_TEXT) {
          return { ok: false, reason: 'structure_not_recognized' }
        }
        return { ok: true }
      }),
    extract:
      ueber.extract ??
      (() => {
        zaehler.extract += 1
        return { ok: true, fact: { kind: 'blank_passport_pages', minimumPages: 2 } }
      }),
  })
}

function wirkungDefinition(zaehler: Zaehler, ueber: Partial<OfficialTruthExtractorDefinition> = {}) {
  return definition({ representations: [r2Binding(registry(), GRENZE_URL), r2Binding(registry(), INNEN_URL)],
    extractorId: 'otx_example_effect',
    extractorVersion: 1,
    factKind: 'requirement_effect',
    sourceFamilyId: 'otf_example_effect',
    contentItemRefs: [r2Ref(registry(), GRENZE_URL), r2Ref(registry(), INNEN_URL)],
    urlAllowlist: [
      { kind: 'exact', canonicalUrl: GRENZE_URL },
      { kind: 'path', host: 'www.interior.example', path: '/effect' },
    ],
    schemaFamily: 'ots_example_effect',
    policyId: 'otp_example_effect',
    policyVersion: 1,
    requiredFieldPaths: ['effect', 'visaMode'],
    match: (kontext) => {
      zaehler.match += 1
      const grenze = kontext.supports.find((eintrag) => eintrag.sourceId === AMT)
      const innen = kontext.supports.find((eintrag) => eintrag.sourceId === INNEN)
      if (grenze?.sourceSnapshot !== GRENZE_TEXT || innen?.sourceSnapshot !== INNEN_TEXT) {
        return { ok: false, reason: 'structure_not_recognized' }
      }
      return { ok: true }
    },
    extract: () => {
      zaehler.extract += 1
      return { ok: true, fact: { kind: 'requirement_effect', effect: 'required', visaMode: null } }
    },
    ...ueber,
  })
}

function komposition(teil?: Record<string, unknown>) {
  const requirementType = typeof teil?.requirementType === 'string' ? teil.requirementType : 'health'
  return mitScope(
    {
      factKind: 'requirement_effect',
      requirementType,
      evidenceQuality: 'composed_from_multiple_primary_sources',
      supports: [
        stuetze(GRENZE_ID, AMT, GRENZE_URL, GRENZE_TEXT),
        stuetze(INNEN_ID, INNEN, INNEN_URL, INNEN_TEXT),
      ],
      policy: null,
      registry: registry(),
    },
    teil,
    requirementType,
  )
}

const SERVER_POLITIK = {
  policyId: 'otp_example_effect',
  policyVersion: 1,
  assignments: [
    { fieldPath: 'effect', sourceId: AMT, contentItemId: 'synthetic_effect' },
    { fieldPath: 'visaMode', sourceId: INNEN, contentItemId: 'synthetic_effect' },
  ],
}

function grund(ergebnis: { status: string; reason?: string }): string | undefined {
  return ergebnis.status === 'blocked' ? ergebnis.reason : undefined
}

// Explicit synthetic v2 publications.
const R2_PUBLICATIONS = [
  {
    "url": "https://provider.example/rules",
    "mediaType": "application/json",
    "itemId": "synthetic_effect",
    "representationId": "synthetic_rep_0"
  },
  {
    "url": "https://www.gov.example/effect",
    "mediaType": "application/json",
    "itemId": "synthetic_effect",
    "representationId": "synthetic_rep_1"
  },
  {
    "url": "https://www.gov.example/other",
    "mediaType": "application/json",
    "itemId": "synthetic_effect",
    "representationId": "synthetic_rep_2"
  },
  {
    "url": "https://www.gov.example/pages",
    "mediaType": "application/json",
    "itemId": "synthetic_pages",
    "representationId": "synthetic_rep_3"
  },
  {
    "url": "https://www.gov.example/pages?lang=en",
    "mediaType": "application/json",
    "itemId": "synthetic_pages",
    "representationId": "synthetic_rep_4"
  },
  {
    "url": "https://www.gov.example/pages?type=visa&country=jp",
    "mediaType": "application/json",
    "itemId": "synthetic_pages",
    "representationId": "synthetic_rep_5"
  },
  {
    "url": "https://www.interior.example/effect",
    "mediaType": "application/json",
    "itemId": "synthetic_effect",
    "representationId": "synthetic_rep_6"
  }
] as const


describe('deterministischer Vertrauensfakt-Extraktor', () => {
  test('1 Produktionsregister hat null Definitionen', () => {
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
    assert.equal(Object.isFrozen(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY), true)
    assert.throws(() => {
      ;(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY as unknown as string[]).push('otx_example_pages')
    })
    const text = datei(DATEI)
    assert.match(text, /OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY[\s\S]*?Object\.freeze\(\[\]\)/)
    assert.doesNotMatch(text, /gov\.uk|ica\.gov\.sg|sherpa|timatic|iata|ch-0/i)
  })

  test('2 Produktions-Einstieg liefert extractor_not_registered', () => {
    const ergebnis = officialTruthTrustedFactExtrahieren(eingabe())
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'extractor_not_registered' })
    assert.equal(JSON.stringify(ergebnis).includes(SEITEN_TEXT), false)
  })

  test('3 Aufrufer wählt weder Extraktor noch Schema noch Politikversion', () => {
    const zaehler = { match: 0, extract: 0 }
    const definitionen = [seitenDefinition(zaehler)]
    assert.equal(grund(officialTruthTrustedFactExtrahieren({ ...eingabe(), extractorId: 'otx_example_pages' })), 'unexpected_fields')
    assert.equal(
      grund(officialTruthTrustedFactExtrahierenMitDefinitionen({ ...eingabe(), extractorVersion: 1 }, definitionen)),
      'unexpected_fields',
    )
    assert.equal(
      grund(officialTruthTrustedFactExtrahierenMitDefinitionen({ ...eingabe(), schemaFamily: 'ots_example_pages' }, definitionen)),
      'unexpected_fields',
    )
    assert.equal(zaehler.match, 0)
    assert.equal(zaehler.extract, 0)
  })

  test('4 eingereichtes Abrufmaterial ist keine Quelle', () => {
    const zaehler = { match: 0, extract: 0 }
    const hash = evidenceQuellenFingerprint(SEITEN_TEXT)
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({
        supports: [
          {
            versionId: SEITEN_ID,
            sourceId: AMT,
            retrieval: {
              status: 'retrieved_material',
              requestKey: 'research-request:v1:example',
              ruleScopeKey: SCOPE,
              sourceId: AMT,
              canonicalUrl: SEITEN_URL,
              retrievedAt: ZEIT,
              sourceContentHash: hash,
              material: { contentType: 'text/plain', canonicalUrl: SEITEN_URL, retrievedAt: ZEIT, sourceSnapshot: SEITEN_TEXT },
            },
          },
        ],
      }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'representation_not_eligible')
    assert.equal(zaehler.match, 0)
    assert.equal(JSON.stringify(ergebnis).includes(SEITEN_TEXT), false)
  })

  test('5 gefälschter Status scheitert geschlossen', () => {
    const zaehler = { match: 0, extract: 0 }
    const retrieval = abruf(AMT, SEITEN_URL, SEITEN_TEXT)
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({
        supports: [{ versionId: SEITEN_ID, sourceId: AMT, retrieval: { ...retrieval, status: 'blocked' } }],
      }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'unexpected_fields')
    assert.equal(zaehler.match, 0)
  })

  test('6 Hash-Abweichung stoppt vor Matcher und Extraktor', () => {
    const zaehler = { match: 0, extract: 0 }
    const hash = evidenceQuellenFingerprint(SEITEN_TEXT)
    assert.ok(hash)
    const falsch = `${hash.slice(0, 63)}${hash.endsWith('a') ? 'b' : 'a'}`
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ supports: [stuetze(SEITEN_ID, AMT, SEITEN_URL, SEITEN_TEXT, 'application/json', falsch)] }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'snapshot_hash_mismatch')
    assert.equal(zaehler.match, 0)
    assert.equal(zaehler.extract, 0)
    assert.equal(JSON.stringify(ergebnis).includes(SEITEN_TEXT), false)
  })

  test('7 Inhaltstyp außerhalb der Definition scheitert', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ supports: [stuetze(SEITEN_ID, AMT, SEITEN_URL, SEITEN_TEXT, 'text/html')] }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'representation_not_eligible')
    assert.equal(zaehler.match, 0)
  })

  test('8 Quellen-Id der Stütze und des Abrufs müssen gleich sein', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({
        supports: [
          {
            versionId: SEITEN_ID,
            sourceId: AMT,
            retrieval: abruf(INNEN, INNEN_URL, SEITEN_TEXT),
          },
        ],
      }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'source_not_allowlisted')
    assert.equal(zaehler.match, 0)
  })

  test('9 ein lizenzierter Anbieter ist keine amtliche Quelle', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ supports: [stuetze(SEITEN_ID, LIZENZ, LIZENZ_URL, SEITEN_TEXT)] }),
      [seitenDefinition(zaehler, { contentItemRefs: [LIZENZ].map(fixtureRef), representations: [fixturePin(LIZENZ)], urlAllowlist: [{ kind: 'exact', canonicalUrl: LIZENZ_URL }] })],
    )
    assert.equal(grund(ergebnis), 'source_not_allowlisted')
    assert.equal(zaehler.match, 0)
  })

  test('10 keine passende aktuelle Definition ist nicht registriert', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ factKind: 'visa_options', requirementType: 'visa' }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'extractor_not_registered')
    assert.equal(zaehler.match, 0)
  })

  test('11 zwei aktuelle Extraktoren derselben Faktart und Quellenmenge sind duplicate_extractor_match', () => {
    const erste = { match: 0, extract: 0 }
    const zweite = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [
      seitenDefinition(erste, { extractorId: 'otx_example_pages' }),
      seitenDefinition(zweite, { extractorId: 'otx_example_pages_b', schemaFamily: 'ots_example_pages_b' }),
    ])
    assert.equal(grund(ergebnis), 'duplicate_extractor_match')
    assert.equal(erste.match + zweite.match, 0)
    assert.equal(erste.extract + zweite.extract, 0)
  })

  test('12 eine historische Version wird nicht gewählt', () => {
    const alt = { match: 0, extract: 0 }
    const neu = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [
      seitenDefinition(alt, {
        extractorVersion: 1,
        current: false,
        match: () => {
          alt.match += 1
          throw new Error('historische Version')
        },
      }),
      seitenDefinition(neu, { extractorVersion: 2, current: true }),
    ])
    assert.equal(ergebnis.status, 'trusted_fact_extracted')
    if (ergebnis.status !== 'trusted_fact_extracted') return
    assert.equal(ergebnis.extractorId, 'otx_example_pages')
    assert.equal(ergebnis.extractorVersion, 2)
    assert.equal(alt.match, 0)
    assert.equal(neu.extract, 1)
  })

  test('13 ungültige Id, Version oder Schema-Familie scheitert', () => {
    const gueltig = seitenDefinition({ match: 0, extract: 0 })
    assert.equal(officialTruthExtractorDefinitionenPruefen([{ ...gueltig, extractorId: 'gov-uk' }]).ok, false)
    assert.equal(officialTruthExtractorDefinitionenPruefen([{ ...gueltig, extractorVersion: 0 }]).ok, false)
    assert.equal(officialTruthExtractorDefinitionenPruefen([{ ...gueltig, schemaFamily: 'html' }]).ok, false)
    assert.equal(
      grund(officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [{ ...gueltig, extractorVersion: 1.5 }])),
      'invalid_extractor_definition',
    )
  })

  test('14 dieselbe Id und Version darf nur einmal stehen', () => {
    const links = seitenDefinition({ match: 0, extract: 0 })
    const rechts = seitenDefinition({ match: 0, extract: 0 }, { current: false })
    const ergebnis = officialTruthExtractorDefinitionenPruefen([links, rechts])
    assert.deepEqual(ergebnis, { ok: false, reason: 'duplicate_extractor_version' })
  })

  test('14b zwei aktuelle Extraktoren mit derselben Faktart und Quellenmenge sind duplicate_extractor_match', () => {
    const links = seitenDefinition({ match: 0, extract: 0 }, { contentTypes: ['text/plain'] })
    const rechts = seitenDefinition({ match: 0, extract: 0 }, {
      extractorId: 'otx_example_pages_html',
      extractorVersion: 2,
      contentTypes: ['text/html'],
    })
    assert.deepEqual(officialTruthExtractorDefinitionenPruefen([links, rechts]), { ok: false, reason: 'duplicate_extractor_match' })
    const historisch = seitenDefinition({ match: 0, extract: 0 }, { extractorVersion: 3, current: false, contentTypes: ['text/html'] })
    assert.equal(officialTruthExtractorDefinitionenPruefen([links, historisch]).ok, true)
  })

  test('15 eine explizite Primärquelle ergibt genau einen kanonischen Fakt', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [seitenDefinition(zaehler)])
    assert.equal(ergebnis.status, 'trusted_fact_extracted')
    if (ergebnis.status !== 'trusted_fact_extracted') return
    assert.deepEqual(ergebnis.fact, { kind: 'blank_passport_pages', minimumPages: 2 })
    assert.equal(ergebnis.extractorId, 'otx_example_pages')
    assert.equal(ergebnis.extractorVersion, 1)
    assert.equal(ergebnis.policyId, null)
    assert.equal(ergebnis.policyVersion, null)
    assert.deepEqual(ergebnis.contentItemRefs, [fixtureRef(AMT)])
    assert.deepEqual(ergebnis.supportVersionIds, [SEITEN_ID])
    assert.equal(zaehler.match, 1)
    assert.equal(zaehler.extract, 1)
    assert.equal(JSON.stringify(ergebnis).includes(SEITEN_TEXT), false)
    assert.equal(officialTruthTrustedFactExtrahieren(eingabe()).status, 'blocked')
  })

  test('16 ein Strukturfehler ruft den Extraktor nicht auf und liefert keinen Fakt', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ supports: [stuetze(SEITEN_ID, AMT, SEITEN_URL, 'OTHER-BYTES')] }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'structure_not_recognized')
    assert.equal(zaehler.match, 1)
    assert.equal(zaehler.extract, 0)
    assert.equal('fact' in ergebnis, false)
  })

  test('17 ein unvollständiger Fakt fällt durch die kanonische Prüfung', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe(),
      [
        seitenDefinition(zaehler, {
          extract: () => {
            zaehler.extract += 1
            return { ok: true, fact: { kind: 'blank_passport_pages', minimumPages: 2, note: 'model' } }
          },
        }),
      ],
    )
    assert.equal(grund(ergebnis), 'invalid_fact')
    assert.equal('fact' in ergebnis, false)
  })

  test('18 Vorschlag, Suggestion und Modell dürfen den Fakt nicht beeinflussen', () => {
    const zaehler = { match: 0, extract: 0 }
    const definitionen = [seitenDefinition(zaehler)]
    assert.equal(grund(officialTruthTrustedFactExtrahierenMitDefinitionen({ ...eingabe(), proposal: { minimumPages: 1 } }, definitionen)), 'unexpected_fields')
    assert.equal(
      grund(
        officialTruthTrustedFactExtrahierenMitDefinitionen(
          { ...eingabe(), suggestion: { effect: 'not_required' } },
          definitionen,
        ),
      ),
      'unexpected_fields',
    )
    assert.equal(grund(officialTruthTrustedFactExtrahierenMitDefinitionen({ ...eingabe(), model: { fact: true } }, definitionen)), 'unexpected_fields')
    assert.equal(zaehler.match, 0)
    assert.equal(zaehler.extract, 0)
  })

  test('19 die Stützen-Reihenfolge ändert die Auswahl nicht', () => {
    const vorwaerts = { match: 0, extract: 0 }
    const rueckwaerts = { match: 0, extract: 0 }
    const basis = komposition()
    const links = officialTruthTrustedFactExtrahierenMitDefinitionen(basis, [wirkungDefinition(vorwaerts)], SERVER_POLITIK)
    const rechts = officialTruthTrustedFactExtrahierenMitDefinitionen(
      komposition({ supports: [...(basis.supports as unknown[])].reverse() }),
      [wirkungDefinition(rueckwaerts)],
      SERVER_POLITIK,
    )
    assert.equal(links.status, 'trusted_fact_extracted')
    assert.deepEqual(links, rechts)
  })

  test('20 Komposition braucht mindestens zwei Quellen und eine Politik', () => {
    const zaehler = { match: 0, extract: 0 }
    const definitionen = [wirkungDefinition(zaehler)]
    const eine = officialTruthTrustedFactExtrahierenMitDefinitionen(
      komposition({ supports: [stuetze(GRENZE_ID, AMT, GRENZE_URL, GRENZE_TEXT)] }),
      definitionen,
    )
    assert.equal(grund(eine), 'insufficient_support')
    const ohnePolitik = officialTruthTrustedFactExtrahierenMitDefinitionen(komposition({ policy: null }), definitionen)
    assert.equal(grund(ohnePolitik), 'policy_required')
    const aufrufer = officialTruthTrustedFactExtrahierenMitDefinitionen(
      komposition({ policy: SERVER_POLITIK }),
      definitionen,
      SERVER_POLITIK,
    )
    assert.equal(grund(aufrufer), 'unexpected_fields')
    assert.equal(zaehler.extract, 0)
  })

  test('21 dieselbe Quelle gilt nicht als Komposition', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      komposition({
        supports: [
          stuetze(GRENZE_ID, AMT, GRENZE_URL, GRENZE_TEXT),
          stuetze(INNEN_ID, AMT, GRENZE_URL, GRENZE_TEXT),
        ],
      }),
      [wirkungDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'same_content_item_composition')
    assert.equal(zaehler.match, 0)
  })

  test('22 eine andere Politikversion scheitert ohne Teilfakt', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      komposition(),
      [wirkungDefinition(zaehler)],
      {
        policyId: 'otp_example_effect',
        policyVersion: 2,
        assignments: [
          { fieldPath: 'effect', sourceId: AMT, contentItemId: 'synthetic_effect' },
          { fieldPath: 'visaMode', sourceId: INNEN, contentItemId: 'synthetic_effect' },
        ],
      },
    )
    assert.equal(grund(ergebnis), 'policy_version_mismatch')
    assert.equal(zaehler.extract, 0)
    assert.equal('fact' in ergebnis, false)
  })

  test('23 eine fehlende Feldzuweisung ergibt keinen Teilfakt', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(komposition(), [wirkungDefinition(zaehler)], {
      policyId: 'otp_example_effect',
      policyVersion: 1,
      assignments: [{ fieldPath: 'effect', sourceId: AMT, contentItemId: 'synthetic_effect' }],
    })
    assert.equal(grund(ergebnis), 'policy_field_unassigned')
    assert.equal(zaehler.match, 0)
    assert.equal(zaehler.extract, 0)
    assert.equal('fact' in ergebnis, false)
  })

  test('24 kein Netz, keine Uhr, kein Modell und kein Speicher', () => {
    const text = datei(DATEI)
    assert.match(text, /^import 'server-only'$/m)
    assert.doesNotMatch(text, /from ['"]node:(https|http|dns|net)['"]/)
    assert.doesNotMatch(text, /from ['"]@\/lib\/supabase|from ['"]pg['"]|from ['"]node:sqlite['"]/)
    assert.doesNotMatch(text, /\bfetch\s*\(/)
    assert.doesNotMatch(text, /\bDate\b/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren|evidenceKandidatAkzeptieren|akzeptierteRegelClaimSpeichern/)
    assert.doesNotMatch(text, /official-truth-store|official-truth-server-owned-retrieval|official-truth-review-suggestion/)
    assert.doesNotMatch(text, /from ['"]@\/app\//)
  })

  test('25 keine App-Route importiert den Rahmen', () => {
    for (const pfad of dateienUnter('app')) {
      assert.equal(readFileSync(pfad, 'utf8').includes('official-truth-trusted-fact-extractor-registry'), false, pfad)
    }
  })

  test('26 Erfolg und Herkunft sind tief eingefroren', () => {
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [
      seitenDefinition({ match: 0, extract: 0 }),
    ])
    assert.equal(ergebnis.status, 'trusted_fact_extracted')
    if (ergebnis.status !== 'trusted_fact_extracted') return
    assert.equal(Object.isFrozen(ergebnis), true)
    assert.equal(Object.isFrozen(ergebnis.fact), true)
    assert.equal(Object.isFrozen(ergebnis.provenance), true)
    assert.equal(Object.isFrozen(ergebnis.contentItemRefs), true)
    assert.equal(Object.isFrozen(ergebnis.supportVersionIds), true)
    assert.equal(Object.isFrozen(ergebnis.provenance[0]), true)
    assert.throws(() => {
      ;(ergebnis.fact as { minimumPages: number }).minimumPages = 9
    })
    assert.throws(() => {
      ;(ergebnis.provenance[0] as { fieldPath: string }).fieldPath = 'effect'
    })
    assert.equal(ergebnis.fact.kind === 'blank_passport_pages' && ergebnis.fact.minimumPages, 2)
  })

  test('R1 eine Pfadregel gilt nur ohne Query, eine exakte URL darf eine Query nennen', () => {
    const pfad = { match: 0, extract: 0 }
    const mitSprache = 'https://www.gov.example/pages?lang=en'
    const andereQuery = 'https://www.gov.example/pages?type=visa&country=jp'
    const definitionPfad = seitenDefinition(pfad, {
      urlAllowlist: [{ kind: 'path', host: 'www.gov.example', path: '/pages' }],
      representations: R2_PUBLICATIONS.filter((row) => row.itemId === 'synthetic_pages').map((row) => r2Binding(registry(), row.url)),
    })
    const ohne = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [definitionPfad])
    assert.equal(ohne.status, 'trusted_fact_extracted')
    const sprache = stuetze(SEITEN_ID, AMT, mitSprache, SEITEN_TEXT)
    const mitLang = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ supports: [sprache] }), [definitionPfad])
    assert.equal(grund(mitLang), 'domain_or_path_not_allowlisted')
    assert.equal(sprache.retrieval.canonicalUrl, mitSprache)
    const beliebig = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ supports: [stuetze(SEITEN_ID, AMT, andereQuery, SEITEN_TEXT)] }),
      [definitionPfad],
    )
    assert.equal(grund(beliebig), 'domain_or_path_not_allowlisted')
    assert.equal(pfad.match, 1)
    assert.equal(pfad.extract, 1)

    const exaktZaehler = { match: 0, extract: 0 }
    const exakt = seitenDefinition(exaktZaehler, {
      urlAllowlist: [{ kind: 'exact', canonicalUrl: mitSprache }],
      representations: [r2Binding(registry(), mitSprache)],
    })
    const erlaubt = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ supports: [stuetze(SEITEN_ID, AMT, mitSprache, SEITEN_TEXT)] }),
      [exakt],
    )
    assert.equal(erlaubt.status, 'trusted_fact_extracted')
    assert.equal(grund(officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [exakt])), 'representation_not_eligible')
    assert.equal(
      grund(
        officialTruthTrustedFactExtrahierenMitDefinitionen(
          eingabe({ supports: [stuetze(SEITEN_ID, AMT, andereQuery, SEITEN_TEXT)] }),
          [exakt],
        ),
      ),
      'representation_not_eligible',
    )
    assert.equal(exaktZaehler.match, 1)
    assert.equal(exaktZaehler.extract, 1)
  })

  test('ein nicht gelisteter Pfad scheitert ohne Extraktor', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ supports: [stuetze(SEITEN_ID, AMT, 'https://www.gov.example/other', SEITEN_TEXT)] }),
      [seitenDefinition(zaehler)],
    )
    assert.equal(grund(ergebnis), 'extractor_not_registered')
    assert.equal(zaehler.match, 0)
  })

  test('research_gap bleibt ein Sperrgrund und wird kein Fakt', () => {
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ evidenceQuality: 'research_gap' }),
      [seitenDefinition({ match: 0, extract: 0 })],
    )
    assert.equal(grund(ergebnis), 'quality_not_acceptable')
    assert.equal('fact' in ergebnis, false)
  })

  test('der Produktions-Einstieg wird außerhalb von Tests nur von der gleichen-Request-Bindung importiert', () => {
    const erlaubt = [
      'lib/readiness/official-truth-trusted-fact-extractor-registry.ts',
      'lib/readiness/official-truth-same-request-extraction-server.ts',
    ]
    const produktion: string[] = []
    const naht: string[] = []
    for (const start of ['app', 'components', 'hooks', 'lib', 'types', 'scripts']) {
      for (const pfad of dateienUnter(start)) {
        const relativ = pfad.slice(process.cwd().length + 1)
        if (relativ.includes('.test.')) continue
        const text = readFileSync(pfad, 'utf8')
        if (/officialTruthTrustedFactExtrahieren(?!MitDefinitionen)/.test(text)) produktion.push(relativ)
        if (text.includes('officialTruthTrustedFactExtrahierenMitDefinitionen')) naht.push(relativ)
      }
    }
    assert.deepEqual(produktion.sort(), [...erlaubt].sort())
    for (const importer of naht) assert.ok(fixtureImporterErlaubt(importer), `nicht geprüfter Fixture-Importer ${importer}`)
    assert.deepEqual(naht.sort(), [...FIXTURE_IMPORTER].sort())
    for (const pfad of dateienUnter('app')) {
      const text = readFileSync(pfad, 'utf8')
      assert.equal(text.includes('officialTruthTrustedFactExtrahieren'), false, pfad)
      assert.equal(text.includes('official-truth-trusted-fact-extractor-registry'), false, pfad)
    }
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
  })

  test('die endliche Fixture-Importer-Liste erlaubt weder Routen noch Namensähnlichkeit', () => {
    assert.equal(fixtureImporterErlaubt('scripts/official-truth-integrated-pilot-1/engine.ts'), true)
    for (const path of ['app/api/official-truth/route.ts', 'lib/readiness/unknown.ts',
      'scripts/official-truth-integrated-pilot-1/official-source.ts', 'scripts/official-truth-integrated-pilot-1/unknown.ts',
      'scripts/official-truth-integrated-pilot-2/engine.ts', 'scripts/official-truth-integrated-pilot-1/engine.ts/../unknown.ts',
      'app/scripts/official-truth-integrated-pilot-1/engine.ts']) assert.equal(fixtureImporterErlaubt(path), false, path)
  })

  test('der kanonische Scope erreicht den Matcher unverändert und ohne Auswahl', () => {
    const gesehen: RegelScope[] = []
    const zaehler = { match: 0, extract: 0 }
    const paare = [
      zellenScope('blank_passport_pages', { citizenship: { mode: 'required', countryCodes: ['RS', 'CH'] } }),
      zellenScope('blank_passport_pages'),
    ]
    for (const scope of paare) {
      const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ scope }), [
        seitenDefinition(zaehler, {
          match: (kontext) => {
            zaehler.match += 1
            gesehen.push(kontext.scope)
            return { ok: true }
          },
        }),
      ])
      assert.equal(ergebnis.status, 'trusted_fact_extracted')
    }
    assert.equal(gesehen.length, 2)
    const links = gesehen[0]
    const rechts = gesehen[1]
    if (!links || !rechts) return
    assert.deepEqual(links, rechts)
    assert.equal(links.citizenship.mode, 'required')
    if (links.citizenship.mode !== 'required' || rechts.citizenship.mode !== 'required') return
    assert.deepEqual(links.citizenship.countryCodes, ['CH', 'RS'])
    assert.deepEqual(rechts.citizenship.countryCodes, ['CH', 'RS'])
    assert.equal(links.citizenship.countryCodes.length, 2)
    assert.equal(schluesselFuer(paare[0]), schluesselFuer(paare[1]))
    assert.equal('sourceId' in links, false)
    assert.equal(JSON.stringify(links).includes('preferred'), false)
  })

  test('Ausstellerland, Bezug, Dokument, Wohnsitz und Reisedatum bleiben getrennte Felder', () => {
    const fund: { scope: OfficialTruthExtractorKontext['scope'] | null } = { scope: null }
    const scope = zellenScope('blank_passport_pages', {
      transitCountryCode: 'SG',
      credentialOption: {
        mode: 'option',
        documentType: 'national_id',
        issuingCountryCode: 'DE',
        relatedCitizenshipCountryCode: null,
      },
      residence: { mode: 'required', countryCode: 'TH' },
      validity: { mode: 'travel_date', travelDate: '2026-10-03' },
    })
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ scope }), [
      seitenDefinition(
        { match: 0, extract: 0 },
        {
          match: (kontext) => {
            fund.scope = kontext.scope
            assert.equal('travelDate' in kontext, false)
            return { ok: true }
          },
        },
      ),
    ])
    assert.equal(ergebnis.status, 'trusted_fact_extracted')
    const gesehen = fund.scope
    assert.ok(gesehen)
    if (!gesehen || gesehen.citizenship.mode !== 'required' || gesehen.credentialOption.mode !== 'option') return
    assert.deepEqual(gesehen.citizenship.countryCodes, ['CH', 'RS'])
    assert.equal(gesehen.credentialOption.documentType, 'national_id')
    assert.equal(gesehen.credentialOption.issuingCountryCode, 'DE')
    assert.equal(gesehen.credentialOption.relatedCitizenshipCountryCode, null)
    assert.equal(gesehen.residence.mode, 'required')
    if (gesehen.residence.mode !== 'required') return
    assert.equal(gesehen.residence.countryCode, 'TH')
    assert.equal(gesehen.destinationCountryCode, 'JP')
    assert.equal(gesehen.transitCountryCode, 'SG')
    assert.equal(gesehen.validity.mode, 'travel_date')
    if (gesehen.validity.mode !== 'travel_date') return
    assert.equal(gesehen.validity.travelDate, '2026-10-03')

    const bezogen = zellenScope('blank_passport_pages', {
      credentialOption: {
        mode: 'option',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        relatedCitizenshipCountryCode: 'RS',
      },
    })
    const bezugsFund: { scope: RegelScope | null } = { scope: null }
    const mitBezug = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ scope: bezogen }), [
      seitenDefinition(
        { match: 0, extract: 0 },
        {
          match: (kontext) => {
            bezugsFund.scope = kontext.scope
            return { ok: true }
          },
        },
      ),
    ])
    assert.equal(mitBezug.status, 'trusted_fact_extracted')
    const bezug = bezugsFund.scope
    assert.equal(bezug?.credentialOption.mode, 'option')
    if (bezug?.credentialOption.mode !== 'option') return
    assert.equal(bezug.credentialOption.relatedCitizenshipCountryCode, 'RS')
    assert.notEqual(schluesselFuer(bezogen), schluesselFuer(zellenScope('blank_passport_pages')))

    const ohneDatum = zellenScope('blank_passport_pages', { validity: { mode: 'not_applicable' } })
    const ohneFund: { scope: RegelScope | null } = { scope: null }
    const nichtAnwendbar = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ scope: ohneDatum }), [
      seitenDefinition(
        { match: 0, extract: 0 },
        {
          match: (kontext) => {
            ohneFund.scope = kontext.scope
            return { ok: true }
          },
        },
      ),
    ])
    assert.equal(nichtAnwendbar.status, 'trusted_fact_extracted')
    const ohne = ohneFund.scope
    assert.equal(ohne?.validity.mode, 'not_applicable')
    assert.equal(ohne?.validity.mode === 'not_applicable' && 'travelDate' in ohne.validity, false)
  })

  test('ein synthetischer datumsgebundener Satz liest nur den kanonischen Scope', () => {
    const wirksam = '2026-06-01'
    const text = JSON.stringify({
      marker: 'EXAMPLE-POSITIVE-RULE',
      effectiveOn: wirksam,
      effect: 'required',
      visaMode: null,
    })
    const zaehler = { match: 0, extract: 0 }
    const definitionDatum: OfficialTruthExtractorDefinition = definition({
      zaehler,
      extractorId: 'otx_example_dated_rule',
      factKind: 'requirement_effect',
      sourceFamilyId: 'otf_example_dated_rule',
      schemaFamily: 'ots_example_dated_rule',
      match: (kontext) => {
        zaehler.match += 1
        if (kontext.supports[0]?.sourceSnapshot !== text) return { ok: false, reason: 'structure_not_recognized' }
        if (kontext.scope.validity.mode !== 'travel_date') return { ok: false, reason: 'source_epoch_unreadable' }
        assert.equal('travelDate' in kontext, false)
        return { ok: true }
      },
      extract: (kontext) => {
        zaehler.extract += 1
        if (kontext.scope.validity.mode !== 'travel_date') return { ok: false, reason: 'source_epoch_unreadable' }
        const quelle = JSON.parse(kontext.supports[0]?.sourceSnapshot ?? '') as { effectiveOn?: string }
        if (kontext.scope.validity.travelDate < (quelle.effectiveOn ?? '')) {
          return { ok: false, reason: 'source_epoch_unreadable' }
        }
        return { ok: true, fact: { kind: 'requirement_effect', effect: 'required', visaMode: null } }
      },
    })
    const huelle = (travelDate: string, extra?: Record<string, unknown>) =>
      eingabe({
        factKind: 'requirement_effect',
        requirementType: 'visa',
        scope: zellenScope('visa', { validity: { mode: 'travel_date', travelDate } }),
        supports: [stuetze(SEITEN_ID, AMT, SEITEN_URL, text)],
        ...extra,
      })
    const spaet = officialTruthTrustedFactExtrahierenMitDefinitionen(huelle('2026-06-01'), [definitionDatum])
    assert.equal(spaet.status, 'trusted_fact_extracted')
    if (spaet.status !== 'trusted_fact_extracted') return
    assert.deepEqual(spaet.fact, { kind: 'requirement_effect', effect: 'required', visaMode: null })
    const frueh = officialTruthTrustedFactExtrahierenMitDefinitionen(huelle('2026-05-31'), [definitionDatum])
    assert.equal(grund(frueh), 'source_epoch_unreadable')
    assert.equal('fact' in frueh, false)
    const fremd = { match: 0, extract: 0 }
    const abgelehnt = officialTruthTrustedFactExtrahierenMitDefinitionen(huelle('2026-06-01', { travelDate: '2026-06-01' }), [
      definition({ ...definitionDatum, zaehler: fremd }),
    ])
    assert.equal(grund(abgelehnt), 'unexpected_fields')
    assert.equal(fremd.match, 0)
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
    assert.doesNotMatch(datei(DATEI), /gov\.uk|EXAMPLE-POSITIVE-RULE|effectiveOn/i)
  })

  test('ein abweichender oder verbotener Scope blockiert vor Matcher und Extraktor', () => {
    const zaehler = { match: 0, extract: 0 }
    const seiten = () => [seitenDefinition(zaehler)]
    const falsch = `rule-scope:v1:${'b'.repeat(64)}`
    assert.equal(grund(officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ scopeKey: falsch }), seiten())), 'scope_mismatch')
    assert.equal(
      grund(
        officialTruthTrustedFactExtrahierenMitDefinitionen(
          eingabe({
            factKind: 'requirement_effect',
            requirementType: 'visa',
            scope: zellenScope('health'),
          }),
          [
            definition({
              zaehler,
              extractorId: 'otx_example_effect',
              factKind: 'requirement_effect',
              sourceFamilyId: 'otf_example_effect',
              schemaFamily: 'ots_example_effect',
            }),
          ],
        ),
      ),
      'requirement_type_mismatch',
    )
    assert.equal(
      grund(
        officialTruthTrustedFactExtrahierenMitDefinitionen(
          eingabe({ scope: { ...zellenScope('blank_passport_pages'), sourceId: AMT } }),
          seiten(),
        ),
      ),
      'unexpected_fields',
    )
    assert.equal(
      grund(
        officialTruthTrustedFactExtrahierenMitDefinitionen(
          eingabe({ scope: { ...zellenScope('blank_passport_pages'), note: 'caller' } }),
          seiten(),
        ),
      ),
      'unexpected_fields',
    )
    assert.equal(
      grund(
        officialTruthTrustedFactExtrahierenMitDefinitionen(
          eingabe({ scope: { ...zellenScope('blank_passport_pages'), passportNumber: 'X123' } }),
          seiten(),
        ),
      ),
      'personal_identifier_forbidden',
    )
    for (const scope of [
      zellenScope('blank_passport_pages', { destinationCountryCode: 'japan' }),
      zellenScope('blank_passport_pages', {
        credentialOption: {
          mode: 'option',
          documentType: 'booklet',
          issuingCountryCode: 'CH',
          relatedCitizenshipCountryCode: null,
        },
      }),
      zellenScope('blank_passport_pages', { validity: { mode: 'travel_date', travelDate: '2026-02-31' } }),
      zellenScope('blank_passport_pages', { citizenship: { mode: 'required', countryCodes: ['CHH'] } }),
    ]) {
      assert.equal(grund(officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ scope }), seiten())), 'invalid_scope')
    }
    const unvollstaendig = zellenScope('blank_passport_pages')
    delete unvollstaendig.validity
    assert.equal(
      grund(officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe({ scope: unvollstaendig }), seiten())),
      'unexpected_fields',
    )
    assert.equal(zaehler.match, 0)
    assert.equal(zaehler.extract, 0)
  })

  test('eine Mutation nach der Kanonisierung ändert Kontext und Fakt nicht', () => {
    const roh = zellenScope('blank_passport_pages', {
      citizenship: { mode: 'required', countryCodes: ['RS', 'CH'] },
      validity: { mode: 'travel_date', travelDate: '2026-10-03' },
    })
    const input = eingabe({ scope: roh })
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(input, [
      seitenDefinition(
        { match: 0, extract: 0 },
        {
          match: (kontext) => {
            const citizenship = roh.citizenship as { countryCodes: string[] }
            citizenship.countryCodes.push('US')
            ;(roh.validity as { travelDate: string }).travelDate = '1999-01-01'
            ;(input.scope as { destinationCountryCode: string }).destinationCountryCode = 'TH'
            const vorher = kontext.scope.destinationCountryCode
            try {
              ;(kontext.scope as { destinationCountryCode: string }).destinationCountryCode = 'TH'
            } catch {
              // die Kopie ist eingefroren
            }
            assert.equal(kontext.scope.destinationCountryCode, vorher)
            return { ok: true }
          },
          extract: (kontext) => {
            assert.equal(kontext.scope.destinationCountryCode, 'JP')
            assert.equal(kontext.scope.citizenship.mode, 'required')
            if (kontext.scope.citizenship.mode !== 'required') return { ok: false, reason: 'fact_incomplete' }
            assert.deepEqual(kontext.scope.citizenship.countryCodes, ['CH', 'RS'])
            assert.equal(kontext.scope.validity.mode, 'travel_date')
            if (kontext.scope.validity.mode !== 'travel_date') return { ok: false, reason: 'fact_incomplete' }
            assert.equal(kontext.scope.validity.travelDate, '2026-10-03')
            return { ok: true, fact: { kind: 'blank_passport_pages', minimumPages: 2 } }
          },
        },
      ),
    ])
    assert.equal(ergebnis.status, 'trusted_fact_extracted')
    if (ergebnis.status !== 'trusted_fact_extracted') return
    assert.equal(ergebnis.fact.kind === 'blank_passport_pages' && ergebnis.fact.minimumPages, 2)
  })

  test('eine synthetische Schema-1-Wirkung läuft durch den kanonischen Parser', () => {
    const fakt = {
      kind: 'requirement_effect' as const,
      schema: 1 as const,
      applicability: { schema: 1 as const, kind: 'unconditional' as const },
      effect: 'required' as const,
      visaMode: null,
    }
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(
      eingabe({ factKind: 'requirement_effect', requirementType: 'health' }),
      [
        seitenDefinition(zaehler, {
          factKind: 'requirement_effect',
          extract: () => {
            zaehler.extract += 1
            return { ok: true, fact: fakt }
          },
        }),
      ],
    )
    assert.equal(ergebnis.status, 'trusted_fact_extracted')
    if (ergebnis.status !== 'trusted_fact_extracted') return
    assert.deepEqual(ergebnis.fact, fakt)
    assert.equal(zaehler.extract, 1)
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
    assert.equal(Object.isFrozen(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY), true)
    assert.equal(officialTruthTrustedFactExtrahieren.length, 1)
    assert.deepEqual(officialTruthTrustedFactExtrahieren(eingabe()), {
      status: 'blocked',
      reason: 'extractor_not_registered',
    })
    const text = datei(DATEI)
    assert.match(text, /OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY[\s\S]*?Object\.freeze\(\[\]\)/)
    assert.equal(text.includes('regelKandidatAkzeptieren'), false)
    assert.match(text, /regelFaktKanonischLesen\(/)
  })
})

describe('eine eingefrorene Ausführungsnaht', () => {
  const BEOBACHTUNGEN = [
    { contentItemId: r2Ref(registry(), GRENZE_URL).contentItemId, targetKey: 'ziel:effect', sourceId: AMT, canonical: 'required' },
    { contentItemId: fixtureRef(INNEN).contentItemId, targetKey: 'ziel:visaMode', sourceId: INNEN, canonical: 'none' },
  ]

  function naht(ueber?: {
    definition?: OfficialTruthExtractorDefinition
    supports?: unknown
    scope?: unknown
    scopeKey?: unknown
    requirementType?: unknown
    registry?: unknown
    zaehler?: Zaehler
    observations?: unknown
  }) {
    const zaehler = ueber?.zaehler ?? { match: 0, extract: 0 }
    const basis =
      ueber?.definition ??
      wirkungDefinition(zaehler, {
        extract: () => {
          zaehler.extract += 1
          return {
            ok: true,
            fact: { kind: 'requirement_effect', effect: 'required', visaMode: null },
            ...(ueber && Object.hasOwn(ueber, 'observations')
              ? { observations: ueber.observations }
              : { observations: BEOBACHTUNGEN }),
          }
        },
      })
    const scope = ueber && Object.hasOwn(ueber, 'scope') ? ueber.scope : zellenScope('health')
    return {
      zaehler,
      ergebnis: officialTruthExtractorEingefroreneAusfuehrung({
        definition: basis,
        factKind: 'requirement_effect',
        requirementType: ueber?.requirementType ?? 'health',
        scopeKey: ueber && Object.hasOwn(ueber, 'scopeKey') ? ueber.scopeKey : schluesselFuer(scope),
        scope,
        supports:
          ueber?.supports ?? [
            stuetze(GRENZE_ID, AMT, GRENZE_URL, GRENZE_TEXT),
            stuetze(INNEN_ID, INNEN, INNEN_URL, INNEN_TEXT),
          ],
        registry: ueber?.registry ?? registry(),
      }),
    }
  }

  function sperrgrund(ergebnis: { ok: boolean; reason?: string }): string | undefined {
    return ergebnis.ok ? undefined : ergebnis.reason
  }

  test('ein Lauf liefert einen tief eingefrorenen Fakt, Beobachtungen und gebundene Stützen', () => {
    const lauf = naht()
    assert.equal(lauf.ergebnis.ok, true, sperrgrund(lauf.ergebnis))
    if (!lauf.ergebnis.ok) return
    assert.equal(lauf.zaehler.match, 1)
    assert.equal(lauf.zaehler.extract, 1)
    assert.equal(Object.isFrozen(lauf.ergebnis.fact), true)
    assert.equal(Object.isFrozen(lauf.ergebnis.observations), true)
    assert.equal(Object.isFrozen(lauf.ergebnis.supports), true)
    assert.throws(() => {
      ;(lauf.ergebnis as { ok: boolean }).ok = false
    })
    assert.deepEqual([...lauf.ergebnis.observations], BEOBACHTUNGEN)
    assert.deepEqual(
      lauf.ergebnis.supports.map((eintrag) => eintrag.sourceId).sort(),
      [AMT, INNEN].sort(),
    )
    // Das Produktionsregister bleibt leer; die Naht sucht dort nichts.
    assert.equal(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY.length, 0)
  })

  test('die Naht wählt weder Definition noch Medientyp neu', () => {
    const fremderTyp = naht({
      supports: [
        stuetze(GRENZE_ID, AMT, GRENZE_URL, GRENZE_TEXT, 'text/html'),
        stuetze(INNEN_ID, INNEN, INNEN_URL, INNEN_TEXT, 'text/html'),
      ],
    })
    assert.equal(sperrgrund(fremderTyp.ergebnis), 'representation_not_eligible')
    assert.equal(fremderTyp.zaehler.match, 0)

    const zaehler = { match: 0, extract: 0 }
    const fremdeUrl = naht({
      zaehler,
      definition: wirkungDefinition(zaehler, {
        urlAllowlist: [{ kind: 'exact', canonicalUrl: 'https://www.gov.example/other' }],
      }),
    })
    assert.equal(sperrgrund(fremdeUrl.ergebnis), 'domain_or_path_not_allowlisted')
    assert.equal(zaehler.match, 0)

    const einzeln = naht({
      supports: [stuetze(GRENZE_ID, AMT, GRENZE_URL, GRENZE_TEXT)],
    })
    assert.equal(sperrgrund(einzeln.ergebnis), 'same_content_item_composition')

    const ohnePolitik = naht({
      definition: wirkungDefinition({ match: 0, extract: 0 }, { policyId: null, policyVersion: null }),
    })
    assert.equal(sperrgrund(ohnePolitik.ergebnis), 'invalid_extractor_definition')

    const nichtAktuell = naht({ definition: wirkungDefinition({ match: 0, extract: 0 }, { current: false }) })
    assert.equal(sperrgrund(nichtAktuell.ergebnis), 'invalid_extractor_definition')
  })

  test('Beobachtungen entstehen nur im Code und nur über frische Stützen', () => {
    assert.equal(sperrgrund(naht({ observations: undefined }).ergebnis), 'fact_incomplete')
    assert.equal(sperrgrund(naht({ observations: [] }).ergebnis), 'fact_incomplete')
    assert.equal(
      sperrgrund(naht({ observations: [{ contentItemId: fixtureRef(LIZENZ).contentItemId, targetKey: 'ziel:effect', sourceId: LIZENZ, canonical: 'required' }] }).ergebnis),
      'source_not_allowlisted',
    )
    assert.equal(
      sperrgrund(
        naht({ observations: [{ contentItemId: r2Ref(registry(), GRENZE_URL).contentItemId, targetKey: 'ziel:effect', sourceId: AMT, canonical: 'required', extra: 1 }] }).ergebnis,
      ),
      'unexpected_fields',
    )
    assert.equal(
      sperrgrund(naht({ observations: [{ contentItemId: r2Ref(registry(), GRENZE_URL).contentItemId, targetKey: '', sourceId: AMT, canonical: 'required' }] }).ergebnis),
      'unexpected_fields',
    )
    assert.equal(
      sperrgrund(
        naht({
          observations: Array.from({ length: 257 }, () => ({ contentItemId: r2Ref(registry(), GRENZE_URL).contentItemId, targetKey: 'ziel:effect', sourceId: AMT, canonical: 'x' })),
        }).ergebnis,
      ),
      'snapshot_bound_exceeded',
    )
  })

  test('Atom-Marker im Rohfakt sperren die zusammengesetzte Naht', () => {
    const zaehler = { match: 0, extract: 0 }
    const lauf = naht({
      zaehler,
      definition: wirkungDefinition(zaehler, {
        extract: () => {
          zaehler.extract += 1
          return {
            ok: true,
            fact: { kind: 'requirement_effect', effect: 'required', visaMode: null, atomLocator: 'branch:a/atom' },
            observations: BEOBACHTUNGEN,
          }
        },
      }),
    })
    assert.equal(sperrgrund(lauf.ergebnis), 'unexpected_fields')
  })

  test('der explizite Einzelquellenpfad kennt keine Beobachtungen', () => {
    const zaehler = { match: 0, extract: 0 }
    const ergebnis = officialTruthTrustedFactExtrahierenMitDefinitionen(eingabe(), [
      seitenDefinition(zaehler, {
        extract: () => {
          zaehler.extract += 1
          return { ok: true, fact: { kind: 'blank_passport_pages', minimumPages: 2 }, observations: [] }
        },
      }),
    ])
    assert.deepEqual(ergebnis, { status: 'blocked', reason: 'fact_incomplete' })
  })
})


function fixturePin(sourceId: string) {
  return { ...r2Binding(registry(), sourceId === INNEN ? INNEN_URL : SEITEN_URL), sourceId }
}
function fixtureRef(sourceId: string) {
  const { contentItemId } = fixturePin(sourceId)
  return { sourceId, contentItemId }
}
