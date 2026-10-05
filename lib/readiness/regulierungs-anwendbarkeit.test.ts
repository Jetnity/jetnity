// lib/readiness/regulierungs-anwendbarkeit.test.ts
//
// Schlafende Anwendbarkeit. Keine Annahme, kein Speicher, kein Netz.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { TRAVELLER_CONTEXT_GRENZEN } from '@/lib/readiness/domain'
import {
  DOKUMENT_KLASSEN,
  INSTITUTIONS_STATUS,
  NATIONALITAETS_STATUS_KLASSEN,
  REGULIERUNGS_ALTER_MAX,
  REGULIERUNGS_FEHLENDE_FAKTEN,
  REGULIERUNGS_GRUPPE_KONTEXT_MAX,
  REGULIERUNGS_GRUPPE_SCHWELLE_MAX,
  REGULIERUNGS_KNOTEN_MAX,
  REGULIERUNGS_OPERANDE_MAX,
  REGULIERUNGS_REGION_PINS,
  REGULIERUNGS_REGIONEN,
  REGULIERUNGS_SCHEMA,
  REGULIERUNGS_TIEFE_MAX,
  REGULIERUNGS_ZWEIGE_MAX,
  REISEZWECKE,
  ZIEL_ERLAUBNIS_KLASSEN,
  regelAnwendbarkeitFingerprint,
  regulierungsAnwendbarkeitVisaOptionLesen,
  regulierungsAnwendbarkeitWirkungLesen,
  regulierungsAusdruckAuswerten,
  regulierungsAusdruckLesen,
  regulierungsKontextLesen,
  regulierungsVisaOptionAuswerten,
  regulierungsAusdruckStrukturSchluessel,
  regulierungsWirkungAuswerten,
  type AnforderungswirkungFakt,
  type RegulierungsAusdruck,
  type RegulierungsKontext,
  type RegulierungsLesefehler,
  type WirkungsLesergebnis,
} from '@/lib/readiness/regulierungs-anwendbarkeit'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function ev(n: number): string {
  return `ev2_${n.toString(16).padStart(32, '0')}`
}

function atom(praedikat: Record<string, unknown>, support?: string[]): Record<string, unknown> {
  return support ? { op: 'atomic', predicate: praedikat, supportVersionIds: support } : { op: 'atomic', predicate: praedikat }
}

function staatsbuergerschaft(land: string): Record<string, unknown> {
  return atom({ kind: 'citizenship_includes', countryCode: land })
}

function aussteller(land: string): Record<string, unknown> {
  return atom({ kind: 'issuing_country', countryCode: land })
}

function verknuepfung(land: string): Record<string, unknown> {
  return atom({ kind: 'credential_citizenship_link', countryCode: land })
}

function erlaubnis(land = 'GB', klasse = 'entry_clearance'): Record<string, unknown> {
  return atom({
    kind: 'destination_permission',
    destinationCountryCode: land,
    permissionClass: klasse,
    validity: 'valid_on_travel_date',
  })
}

function status(name = 'british_overseas_territory_citizen'): Record<string, unknown> {
  return atom({ kind: 'nationality_status', status: name })
}

function alter(jahre = 18, vergleich = 'at_most'): Record<string, unknown> {
  return atom({ kind: 'age_on_travel_date', comparison: vergleich, years: jahre })
}

function zweck(purpose = 'visitor'): Record<string, unknown> {
  return atom({ kind: 'travel_purpose', purpose })
}

function klasse(documentClass = 'ordinary'): Record<string, unknown> {
  return atom({ kind: 'document_class', documentClass })
}

function region(): Record<string, unknown> {
  return atom({ kind: 'journey_origin', place: { kind: 'region', regionCode: 'common_travel_area' } })
}

function fakt<T>(value: T, provenance: 'user_asserted' | 'trip_context' = 'user_asserted'): { value: T; provenance: typeof provenance } {
  return { value, provenance }
}

function rohKontext(teil?: Record<string, unknown>): Record<string, unknown> {
  return {
    schema: 1,
    recordedContextProvenance: 'account_profile',
    citizenshipCountryCodes: ['CH'],
    credential: {
      documentType: 'passport',
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: 'CH',
    },
    residenceCountryCode: 'CH',
    journeyOriginCountryCode: null,
    ageOnTravelDate: null,
    travelPurpose: null,
    documentClass: null,
    destinationPermissions: [],
    lawfulResidence: [],
    nationalityStatuses: [],
    schoolParty: null,
    ...teil,
  }
}

function kontext(teil?: Record<string, unknown>): RegulierungsKontext {
  const gelesen = regulierungsKontextLesen(rohKontext(teil))
  if (!gelesen.ok) throw new Error(gelesen.reason)
  return gelesen.wert
}

function ausdruck(roh: unknown): RegulierungsAusdruck {
  const gelesen = regulierungsAusdruckLesen(roh)
  if (!gelesen.ok) throw new Error(gelesen.reason)
  return gelesen.wert
}

function fehler(roh: unknown): RegulierungsLesefehler {
  const gelesen = regulierungsAusdruckLesen(roh)
  assert.equal(gelesen.ok, false)
  if (gelesen.ok) throw new Error('erwartet Fehler')
  return gelesen.reason
}

function wirkung(roh: unknown, requirementType: 'visa' | 'passport' | 'electronic_travel_authorization' = 'passport'): WirkungsLesergebnis {
  return regulierungsAnwendbarkeitWirkungLesen(roh, requirementType)
}

function zweig(
  id: string,
  when: Record<string, unknown>,
  outcome: Record<string, unknown>,
  support: string[] = [ev(1)],
): Record<string, unknown> {
  return { id, when, outcome, supportVersionIds: support }
}

function wirkungsFakt(zweige: Record<string, unknown>[]): Record<string, unknown> {
  return {
    kind: 'requirement_effect',
    schema: 1,
    applicability: { schema: 1, kind: 'branches', branches: zweige },
  }
}

function faktLesen(roh: unknown, requirementType: 'visa' | 'passport' | 'electronic_travel_authorization' = 'electronic_travel_authorization'): AnforderungswirkungFakt {
  const gelesen = wirkung(roh, requirementType)
  if (!gelesen.ok) throw new Error(gelesen.reason)
  return gelesen.fakt
}

function dateien(dir: string, aus: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === '.git' || name === 'dist' || name === 'coverage') continue
    const pfad = join(dir, name)
    if (statSync(pfad).isDirectory()) dateien(pfad, aus)
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(name)) aus.push(pfad)
  }
  return aus
}

describe('regulierungs-anwendbarkeit', () => {
  test('Grenzen und leere Regionspins', () => {
    assert.equal(REGULIERUNGS_SCHEMA, 1)
    assert.equal(REGULIERUNGS_TIEFE_MAX, 4)
    assert.equal(REGULIERUNGS_KNOTEN_MAX, 16)
    assert.equal(REGULIERUNGS_OPERANDE_MAX, 8)
    assert.equal(REGULIERUNGS_ZWEIGE_MAX, 8)
    assert.equal(REGULIERUNGS_ALTER_MAX, 120)
    assert.equal(REGULIERUNGS_GRUPPE_SCHWELLE_MAX, 50)
    assert.equal(REGULIERUNGS_GRUPPE_KONTEXT_MAX, 500)
    assert.equal(REGULIERUNGS_REGION_PINS.length, 0)
    assert.equal(REGULIERUNGS_REGIONEN[0], 'common_travel_area')
    assert.equal(ZIEL_ERLAUBNIS_KLASSEN.includes('entry_clearance'), true)
    assert.equal(REISEZWECKE.includes('other'), true)
    assert.equal(DOKUMENT_KLASSEN.includes('ordinary'), true)
    assert.equal(NATIONALITAETS_STATUS_KLASSEN.length, 2)
    assert.equal(INSTITUTIONS_STATUS.length, 2)
    assert.equal(REGULIERUNGS_FEHLENDE_FAKTEN.includes('school_party_context'), true)
  })

  test('1–3 Wahrheitswerte, NOT unknown und sonst-Zweig', () => {
    const basis = kontext()
    const ohneAlter = kontext()
    const alt = kontext({ ageOnTravelDate: fakt(30) })
    const jung = kontext({ ageOnTravelDate: fakt(10) })
    const ch = ausdruck(staatsbuergerschaft('CH'))
    const zz = ausdruck(staatsbuergerschaft('ZZ'))
    const jahre = ausdruck(alter())
    assert.equal(regulierungsAusdruckAuswerten(ausdruck({ op: 'not', operand: staatsbuergerschaft('CH') }), basis).wert, 'false')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck({ op: 'not', operand: staatsbuergerschaft('ZZ') }), basis).wert, 'true')
    const notUnbekannt = regulierungsAusdruckAuswerten(ausdruck({ op: 'not', operand: alter() }), ohneAlter)
    assert.equal(notUnbekannt.wert, 'unknown')
    assert.deepEqual(notUnbekannt.fehlendeFakten, ['age_on_travel_date'])
    assert.equal(regulierungsAusdruckAuswerten(ausdruck({ op: 'all', operands: [staatsbuergerschaft('ZZ'), alter()] }), ohneAlter).wert, 'false')
    const allOffen = regulierungsAusdruckAuswerten(ausdruck({ op: 'all', operands: [staatsbuergerschaft('CH'), alter()] }), ohneAlter)
    assert.equal(allOffen.wert, 'unknown')
    assert.deepEqual(allOffen.fehlendeFakten, ['age_on_travel_date'])
    assert.equal(regulierungsAusdruckAuswerten(ausdruck({ op: 'all', operands: [staatsbuergerschaft('CH'), aussteller('CH')] }), basis).wert, 'true')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck({ op: 'any', operands: [staatsbuergerschaft('CH'), alter()] }), ohneAlter).wert, 'true')
    const anyOffen = regulierungsAusdruckAuswerten(ausdruck({ op: 'any', operands: [staatsbuergerschaft('ZZ'), alter()] }), ohneAlter)
    assert.equal(anyOffen.wert, 'unknown')
    assert.notEqual(anyOffen.wert, 'false')
    assert.equal(
      regulierungsAusdruckAuswerten(ausdruck({ op: 'any', operands: [staatsbuergerschaft('ZZ'), aussteller('DE')] }), basis).wert,
      'false',
    )
    assert.equal(regulierungsAusdruckAuswerten(jahre, alt).wert, 'false')
    assert.equal(regulierungsAusdruckAuswerten(jahre, jung).wert, 'true')
    assert.equal(regulierungsAusdruckAuswerten(ch, basis).wert, 'true')
    assert.equal(regulierungsAusdruckAuswerten(zz, basis).wert, 'false')

    const bedingt = faktLesen(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: erlaubnis() }, { effect: 'not_required', visaMode: null }),
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }),
      ]),
    )
    const offen = regulierungsWirkungAuswerten(bedingt, basis)
    assert.equal(offen.status, 'insufficient_context')
    if (offen.status !== 'insufficient_context') return
    assert.equal(offen.reason, 'predicate_unknown')
    assert.deepEqual(offen.missingFacts, ['destination_permission_status'])
    assert.equal(offen.binding, null)
  })

  test('4–5 ausdrückliches Falsch und Abwesenheit', () => {
    const ohne = kontext()
    const ungueltig = kontext({
      destinationPermissions: [
        fakt({ destinationCountryCode: 'GB', permissionClass: 'entry_clearance', validity: 'not_valid' }),
      ],
    })
    const gueltig = kontext({
      destinationPermissions: [
        fakt({ destinationCountryCode: 'GB', permissionClass: 'entry_clearance', validity: 'valid_on_travel_date' }),
      ],
    })
    const erlaubnisAusdruck = ausdruck(erlaubnis())
    assert.equal(regulierungsAusdruckAuswerten(erlaubnisAusdruck, ungueltig).wert, 'false')
    assert.equal(regulierungsAusdruckAuswerten(erlaubnisAusdruck, ohne).wert, 'unknown')
    assert.equal(regulierungsAusdruckAuswerten(erlaubnisAusdruck, gueltig).wert, 'true')
    assert.deepEqual(regulierungsAusdruckAuswerten(erlaubnisAusdruck, ohne).fehlendeFakten, ['destination_permission_status'])

    const statusAusdruck = ausdruck(status())
    const nichtGehalten = kontext({
      nationalityStatuses: [fakt({ status: 'british_overseas_territory_citizen', holding: 'not_held' })],
    })
    const gehalten = kontext({
      nationalityStatuses: [fakt({ status: 'british_overseas_territory_citizen', holding: 'held' })],
    })
    assert.equal(regulierungsAusdruckAuswerten(statusAusdruck, nichtGehalten).wert, 'false')
    assert.equal(regulierungsAusdruckAuswerten(statusAusdruck, ohne).wert, 'unknown')
    assert.equal(regulierungsAusdruckAuswerten(statusAusdruck, gehalten).wert, 'true')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(status('british_national_overseas')), gehalten).wert, 'unknown')

    const wohnsitz = ausdruck({
      op: 'atomic',
      predicate: { kind: 'lawful_residence', countryCode: 'IE', entitlement: 'entitled_to_reside', departure: 'unrestricted' },
    })
    const nurLand = kontext({ residenceCountryCode: 'IE', lawfulResidence: [] })
    assert.equal(regulierungsAusdruckAuswerten(wohnsitz, nurLand).wert, 'unknown')
    const gegenteil = kontext({
      residenceCountryCode: 'IE',
      lawfulResidence: [fakt({ countryCode: 'IE', entitlement: 'not_entitled', departure: 'unrestricted' })],
    })
    assert.equal(regulierungsAusdruckAuswerten(wohnsitz, gegenteil).wert, 'false')
    const beschraenkt = kontext({
      lawfulResidence: [fakt({ countryCode: 'IE', entitlement: 'entitled_to_reside', departure: 'restricted' })],
    })
    assert.equal(regulierungsAusdruckAuswerten(wohnsitz, beschraenkt).wert, 'false')
    const berechtigt = kontext({
      lawfulResidence: [fakt({ countryCode: 'IE', entitlement: 'entitled_to_reside', departure: 'unrestricted' })],
    })
    assert.equal(regulierungsAusdruckAuswerten(wohnsitz, berechtigt).wert, 'true')
    const konflikt = regulierungsKontextLesen(
      rohKontext({
        destinationPermissions: [
          fakt({ destinationCountryCode: 'GB', permissionClass: 'visa', validity: 'valid_on_travel_date' }),
          fakt({ destinationCountryCode: 'GB', permissionClass: 'visa', validity: 'not_valid' }),
        ],
      }),
    )
    assert.equal(konflikt.ok, false)
    if (!konflikt.ok) assert.equal(konflikt.reason, 'context_conflict')
  })

  test('6 zwei verneinte Nutzeraussagen tragen otherwise und context_asserted', () => {
    const faktum = faktLesen(
      wirkungsFakt([
        zweig('held_permission', { kind: 'expression', expression: erlaubnis() }, { effect: 'not_required', visaMode: null }),
        zweig('status_row', { kind: 'expression', expression: status() }, { effect: 'not_required', visaMode: null }),
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }),
      ]),
    )
    const lage = kontext({
      destinationPermissions: [
        fakt({ destinationCountryCode: 'GB', permissionClass: 'entry_clearance', validity: 'not_valid' }),
      ],
      nationalityStatuses: [fakt({ status: 'british_overseas_territory_citizen', holding: 'not_held' })],
    })
    const auswertung = regulierungsWirkungAuswerten(faktum, lage)
    assert.equal(auswertung.status, 'decided')
    if (auswertung.status !== 'decided') return
    assert.deepEqual(auswertung.outcome, { effect: 'required', visaMode: null })
    assert.equal(auswertung.binding, 'context_asserted')
    assert.equal(auswertung.reason, 'branch_matched')
    assert.deepEqual(auswertung.missingFacts, [])
    assert.deepEqual(auswertung.decisionTrace.dependencies, [
      { predicateKind: 'destination_permission', provenance: 'user_asserted', polarity: 'false' },
      { predicateKind: 'nationality_status', provenance: 'user_asserted', polarity: 'false' },
    ])
    const spur = JSON.stringify(auswertung.decisionTrace)
    assert.equal(spur.includes('GB'), false)
    assert.equal(spur.includes('entry_clearance'), false)
    assert.equal(spur.includes('british_overseas_territory_citizen'), false)
    assert.equal(spur.includes('not_valid'), false)
    assert.equal(spur.includes('not_held'), false)
  })

  test('7–10 Kurzschluss, NOT-Polarität, aufgezeichnet und unbedingt', () => {
    const kurz = ausdruck({ op: 'all', operands: [verknuepfung('DE'), erlaubnis()] })
    const lage = kontext({
      destinationPermissions: [
        fakt({ destinationCountryCode: 'GB', permissionClass: 'entry_clearance', validity: 'not_valid' }),
      ],
    })
    const ergebnis = regulierungsAusdruckAuswerten(kurz, lage)
    assert.equal(ergebnis.wert, 'false')
    assert.deepEqual(ergebnis.abhaengigkeiten, [
      { predicateKind: 'credential_citizenship_link', provenance: 'account_profile', polarity: 'false' },
    ])
    assert.deepEqual(ergebnis.fehlendeFakten, [])

    const verneint = regulierungsAusdruckAuswerten(ausdruck({ op: 'not', operand: erlaubnis() }), lage)
    assert.equal(verneint.wert, 'true')
    assert.deepEqual(verneint.abhaengigkeiten, [
      { predicateKind: 'destination_permission', provenance: 'user_asserted', polarity: 'false' },
    ])

    const aufgezeichnet = faktLesen(
      wirkungsFakt([
        zweig('citizen', { kind: 'expression', expression: staatsbuergerschaft('CH') }, { effect: 'not_required', visaMode: null }),
      ]),
    )
    const entschieden = regulierungsWirkungAuswerten(aufgezeichnet, kontext({ citizenshipCountryCodes: ['DE', 'CH'] }))
    assert.equal(entschieden.status, 'decided')
    if (entschieden.status !== 'decided') return
    assert.equal(entschieden.binding, 'context_recorded')
    assert.deepEqual(entschieden.decisionTrace.dependencies, [
      { predicateKind: 'citizenship_includes', provenance: 'account_profile', polarity: 'true' },
    ])

    const unbedingt = faktLesen(
      { kind: 'requirement_effect', effect: 'required', visaMode: null },
      'passport',
    )
    const basis = regulierungsWirkungAuswerten(unbedingt, lage)
    assert.equal(basis.status, 'decided')
    if (basis.status !== 'decided') return
    assert.equal(basis.binding, null)
    assert.equal(basis.reason, 'unconditional')
    assert.deepEqual(basis.decisionTrace.dependencies, [])
    assert.deepEqual(basis.outcome, { effect: 'required', visaMode: null })
  })

  test('11–14 Konflikt, kein Zweig, fehlende Fakten, ungepinnte Region', () => {
    const konflikt = regulierungsWirkungAuswerten(
      faktLesen(
        wirkungsFakt([
          zweig('aaa', { kind: 'expression', expression: staatsbuergerschaft('CH') }, { effect: 'not_required', visaMode: null }),
          zweig('bbb', { kind: 'expression', expression: aussteller('CH') }, { effect: 'required', visaMode: null }),
        ]),
      ),
      kontext(),
    )
    assert.equal(konflikt.status, 'insufficient_context')
    if (konflikt.status !== 'insufficient_context') return
    assert.equal(konflikt.reason, 'branch_conflict')
    assert.deepEqual(konflikt.missingFacts, [])

    const keiner = regulierungsWirkungAuswerten(
      faktLesen(
        wirkungsFakt([
          zweig('aaa', { kind: 'expression', expression: staatsbuergerschaft('ZZ') }, { effect: 'not_required', visaMode: null }),
        ]),
      ),
      kontext(),
    )
    assert.equal(keiner.status, 'insufficient_context')
    if (keiner.status !== 'insufficient_context') return
    assert.equal(keiner.reason, 'no_applicable_branch')
    assert.deepEqual(keiner.missingFacts, [])

    const doppelt = regulierungsAusdruckAuswerten(
      ausdruck({ op: 'all', operands: [erlaubnis('GB', 'visa'), erlaubnis('GB', 'residence_permit'), alter(), zweck()] }),
      kontext(),
    )
    assert.equal(doppelt.wert, 'unknown')
    assert.deepEqual(doppelt.fehlendeFakten, ['age_on_travel_date', 'destination_permission_status', 'travel_purpose'])
    const schule = regulierungsAusdruckAuswerten(
      ausdruck({
        op: 'all',
        operands: [
          alter(18),
          atom({ kind: 'group_size_at_least', count: 5 }),
          atom({ kind: 'institution_status', status: 'french_ministry_of_education_school' }),
          zweck('visitor'),
        ],
      }),
      kontext({ schoolParty: null }),
    )
    assert.deepEqual(schule.fehlendeFakten, ['age_on_travel_date', 'school_party_context', 'travel_purpose'])
    const zweckAndere = regulierungsAusdruckAuswerten(ausdruck(zweck('other')), kontext())
    assert.equal(zweckAndere.wert, 'unknown')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(zweck('other')), kontext({ travelPurpose: fakt('other') })).wert, 'true')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(zweck('other')), kontext({ travelPurpose: fakt('visitor') })).wert, 'false')

    const ungepinnt = regulierungsWirkungAuswerten(
      faktLesen(
        wirkungsFakt([
          zweig('cta', { kind: 'expression', expression: region() }, { effect: 'not_required', visaMode: null }),
          zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }),
        ]),
      ),
      kontext({ journeyOriginCountryCode: fakt('IE', 'trip_context') }),
    )
    assert.equal(ungepinnt.status, 'insufficient_context')
    if (ungepinnt.status !== 'insufficient_context') return
    assert.equal(ungepinnt.reason, 'region_membership_unpinned')
    assert.deepEqual(ungepinnt.missingFacts, [])
    const ohneStart = regulierungsAusdruckAuswerten(ausdruck(region()), kontext())
    assert.equal(ohneStart.grund, null)
    assert.deepEqual(ohneStart.fehlendeFakten, ['journey_origin'])
    const herkunftLand = ausdruck({ op: 'atomic', predicate: { kind: 'journey_origin', place: { kind: 'country', countryCode: 'IE' } } })
    const nurWohnsitz = kontext({ residenceCountryCode: 'IE', journeyOriginCountryCode: null })
    assert.equal(regulierungsAusdruckAuswerten(herkunftLand, nurWohnsitz).wert, 'unknown')
    const andereHerkunft = kontext({
      residenceCountryCode: 'IE',
      journeyOriginCountryCode: fakt('FR', 'trip_context'),
    })
    assert.equal(regulierungsAusdruckAuswerten(herkunftLand, andereHerkunft).wert, 'false')
  })

  test('15–19 Staatsangehörigkeit, Aussteller, Verknüpfung und Dokumentklasse', () => {
    const gelesen = kontext({ citizenshipCountryCodes: ['fr', 'de', 'ch', 'DE'] })
    assert.deepEqual(gelesen.citizenshipCountryCodes, ['CH', 'DE', 'FR'])
    const menge = kontext({ citizenshipCountryCodes: ['CH', 'DE', 'FR'], credential: {
      documentType: 'passport',
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: null,
    } })
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(staatsbuergerschaft('DE')), menge).wert, 'true')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(staatsbuergerschaft('IT')), menge).wert, 'false')
    assert.deepEqual(menge.citizenshipCountryCodes, ['CH', 'DE', 'FR'])
    const nurAussteller = kontext({
      citizenshipCountryCodes: ['DE'],
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null },
    })
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(staatsbuergerschaft('CH')), nurAussteller).wert, 'false')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(aussteller('CH')), nurAussteller).wert, 'true')
    const leer = kontext({
      citizenshipCountryCodes: [],
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null },
    })
    assert.deepEqual(regulierungsAusdruckAuswerten(ausdruck(staatsbuergerschaft('CH')), leer).fehlendeFakten, ['nationality'])
    const ohneLink = regulierungsAusdruckAuswerten(ausdruck(verknuepfung('CH')), menge)
    assert.equal(ohneLink.wert, 'unknown')
    assert.deepEqual(ohneLink.fehlendeFakten, ['credential_citizenship_link'])
    assert.equal(
      regulierungsAusdruckAuswerten(ausdruck(verknuepfung('DE')), kontext({
        credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
      })).wert,
      'false',
    )
    const passKontext = kontext({
      documentClass: null,
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    })
    const pass = regulierungsAusdruckAuswerten(ausdruck(klasse('ordinary')), passKontext)
    assert.equal(pass.wert, 'unknown')
    assert.deepEqual(pass.fehlendeFakten, ['document_class'])
    const ohneTyp = kontext({
      credential: { documentType: 'unknown', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
      documentClass: fakt('ordinary'),
    })
    assert.deepEqual(regulierungsAusdruckAuswerten(ausdruck(klasse('ordinary')), ohneTyp).fehlendeFakten, ['document_type'])
    assert.deepEqual(regulierungsAusdruckAuswerten(ausdruck(aussteller('CH')), ohneTyp).fehlendeFakten, ['document_type'])
  })

  test('kanonische Staatsangehörigkeit und Dokumentbezug', () => {
    const grenze = TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller
    const codes = (anzahl: number) => Array.from({ length: anzahl }, (_, index) => `${String.fromCharCode(65 + index)}A`)
    const ohneBezug = {
      documentType: 'passport' as const,
      issuingCountryCode: 'CH',
      relatedCitizenshipCountryCode: null,
    }
    const zuBreit = regulierungsKontextLesen(rohKontext({
      citizenshipCountryCodes: codes(grenze + 1),
      credential: ohneBezug,
    }))
    assert.equal(zuBreit.ok, false)
    if (!zuBreit.ok) assert.equal(zuBreit.reason, 'invalid_fact')
    const acht = kontext({
      citizenshipCountryCodes: [...codes(grenze).slice(1), 'aa', codes(grenze)[0]],
      credential: ohneBezug,
    })
    assert.equal(acht.citizenshipCountryCodes.length, grenze)
    assert.deepEqual(acht.citizenshipCountryCodes, codes(grenze))

    const fremd = regulierungsKontextLesen(rohKontext({
      citizenshipCountryCodes: ['CH'],
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'DE' },
    }))
    assert.equal(fremd.ok, false)
    if (!fremd.ok) assert.equal(fremd.reason, 'invalid_fact')
    const enthalten = kontext({
      citizenshipCountryCodes: ['CH', 'DE'],
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'DE' },
    })
    assert.equal(enthalten.credential.relatedCitizenshipCountryCode, 'DE')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(verknuepfung('DE')), enthalten).wert, 'true')

    const leereVerknuepfung = regulierungsKontextLesen(rohKontext({
      citizenshipCountryCodes: [],
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    }))
    assert.equal(leereVerknuepfung.ok, false)
    if (!leereVerknuepfung.ok) assert.equal(leereVerknuepfung.reason, 'invalid_fact')
    const leer = kontext({
      citizenshipCountryCodes: [],
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null },
    })
    assert.deepEqual(leer.citizenshipCountryCodes, [])

    const ohneDokument = regulierungsKontextLesen(rohKontext({
      citizenshipCountryCodes: ['CH'],
      credential: { documentType: null, issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    }))
    assert.equal(ohneDokument.ok, false)
    if (!ohneDokument.ok) assert.equal(ohneDokument.reason, 'invalid_fact')

    const nurAussteller = kontext({
      citizenshipCountryCodes: ['DE'],
      credential: { documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null },
    })
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(staatsbuergerschaft('CH')), nurAussteller).wert, 'false')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(staatsbuergerschaft('DE')), nurAussteller).wert, 'true')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(verknuepfung('CH')), nurAussteller).wert, 'unknown')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(verknuepfung('DE')), nurAussteller).wert, 'unknown')
    assert.equal(regulierungsAusdruckAuswerten(ausdruck(aussteller('CH')), nurAussteller).wert, 'true')
  })

  test('20–22 Personen, Herkunft und Grenzen', () => {
    for (const schluessel of ['schoolName', 'institutionName', 'permitNumber', 'visaNumber', 'documentNumber', 'dateOfBirth', 'passportNumber', 'mrz', 'biometric', 'health', 'healthRecord']) {
      const gelesen = regulierungsKontextLesen(rohKontext({ [schluessel]: 'x' }))
      assert.equal(gelesen.ok, false)
      if (!gelesen.ok) assert.equal(gelesen.reason, 'personal_identifier_forbidden')
    }
    const herkunft = regulierungsKontextLesen(
      rohKontext({ journeyOriginCountryCode: { value: 'IE', provenance: 'licensed_provider_confirmed' } }),
    )
    assert.equal(herkunft.ok, false)
    if (!herkunft.ok) assert.equal(herkunft.reason, 'provenance_not_authorized')
    const schluessel = regulierungsKontextLesen(rohKontext({ official_document_verified: true }))
    assert.equal(schluessel.ok, false)
    if (!schluessel.ok) assert.equal(schluessel.reason, 'provenance_not_authorized')
    const profilAlter = regulierungsKontextLesen(rohKontext({ ageOnTravelDate: { value: 18, provenance: 'account_profile' } }))
    assert.equal(profilAlter.ok, false)
    if (!profilAlter.ok) assert.equal(profilAlter.reason, 'invalid_fact')

    const kern = staatsbuergerschaft('CH')
    let tief: unknown = kern
    for (let i = 0; i < 4; i += 1) tief = { op: 'not', operand: tief }
    assert.equal(fehler(tief), 'depth_exceeded')
    let erlaubt: unknown = kern
    for (let i = 0; i < 3; i += 1) erlaubt = { op: 'not', operand: erlaubt }
    assert.equal(ausdruck(erlaubt).op, 'not')

    const viele = Array.from({ length: 8 }, (_, index) => staatsbuergerschaft(String.fromCharCode(65 + index) + 'A'))
    const zuBreit = {
      op: 'all',
      operands: [...viele.slice(0, 7), { op: 'all', operands: Array.from({ length: 8 }, (_, index) => staatsbuergerschaft(`B${String.fromCharCode(65 + index)}`)) }],
    }
    assert.equal(fehler(zuBreit), 'node_bound_exceeded')
    assert.equal(fehler({ op: 'all', operands: Array.from({ length: 9 }, (_, index) => staatsbuergerschaft(`C${String.fromCharCode(65 + index)}`)) }), 'operand_bound_exceeded')
    const flach = {
      op: 'all',
      operands: [
        { op: 'all', operands: [staatsbuergerschaft('AA'), staatsbuergerschaft('AB')] },
        { op: 'all', operands: [staatsbuergerschaft('AC'), staatsbuergerschaft('AD')] },
        { op: 'all', operands: [staatsbuergerschaft('AE'), staatsbuergerschaft('AF')] },
        { op: 'all', operands: [staatsbuergerschaft('AG'), staatsbuergerschaft('AH')] },
        staatsbuergerschaft('AI'),
      ],
    }
    assert.equal(fehler(flach), 'operand_bound_exceeded')
    const zweige = Array.from({ length: 9 }, (_, index) =>
      zweig(`b${index}`, { kind: 'expression', expression: staatsbuergerschaft('CH') }, { effect: 'required', visaMode: null }),
    )
    const zuViele = wirkung(wirkungsFakt(zweige))
    assert.equal(zuViele.ok, false)
    if (!zuViele.ok) assert.equal(zuViele.reason, 'branch_bound_exceeded')
    assert.equal(fehler('citizenship == CH'), 'invalid_fact')
    assert.equal(fehler(/CH/), 'invalid_fact')
    assert.equal(fehler(() => true), 'invalid_fact')
    assert.equal(regulierungsKontextLesen([]).ok, false)
    assert.equal(wirkung([]).ok, false)
  })

  test('23–26 Normalisierung, Fingerabdruck und Stützen', () => {
    const normal = ausdruck({
      op: 'all',
      operands: [
        { op: 'not', operand: { op: 'not', operand: staatsbuergerschaft('DE') } },
        { op: 'all', operands: [staatsbuergerschaft('CH'), staatsbuergerschaft('CH')] },
      ],
    })
    assert.equal(normal.op, 'all')
    if (normal.op !== 'all') return
    assert.deepEqual(
      normal.operands.map((operand) => (operand.op === 'atomic' && operand.predicate.kind === 'citizenship_includes' ? operand.predicate.countryCode : '')),
      ['CH', 'DE'],
    )
    const entpackt = ausdruck({
      op: 'all',
      operands: [
        { op: 'not', operand: { op: 'not', operand: staatsbuergerschaft('CH') } },
        { op: 'all', operands: [staatsbuergerschaft('CH')] },
      ],
    })
    assert.equal(entpackt.op, 'atomic')
    const verteilt = ausdruck({ op: 'not', operand: { op: 'all', operands: [staatsbuergerschaft('CH'), staatsbuergerschaft('DE')] } })
    assert.equal(verteilt.op, 'not')
    if (verteilt.op === 'not') assert.equal(verteilt.operand.op, 'all')

    const links = faktLesen(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: { op: 'all', operands: [staatsbuergerschaft('DE'), staatsbuergerschaft('CH')] } }, { effect: 'not_required', visaMode: null }, [ev(2), ev(1), ev(1)]),
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }, [ev(3)]),
      ]),
    )
    const rechts = faktLesen(
      wirkungsFakt([
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }, [ev(3)]),
        zweig('held', { kind: 'expression', expression: { op: 'all', operands: [staatsbuergerschaft('CH'), { op: 'not', operand: { op: 'not', operand: staatsbuergerschaft('DE') } }] } }, { effect: 'not_required', visaMode: null }, [ev(1), ev(2)]),
      ]),
    )
    if (!('applicability' in links) || links.applicability.kind !== 'branches') throw new Error('links')
    if (!('applicability' in rechts) || rechts.applicability.kind !== 'branches') throw new Error('rechts')
    const gleich = regelAnwendbarkeitFingerprint(links.applicability)
    assert.equal(gleich, regelAnwendbarkeitFingerprint(rechts.applicability))
    assert.match(gleich, /^rule-applicability:v1:[a-f0-9]{64}$/)
    const andereWirkung = faktLesen(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: { op: 'all', operands: [staatsbuergerschaft('DE'), staatsbuergerschaft('CH')] } }, { effect: 'required', visaMode: null }, [ev(1), ev(2)]),
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }, [ev(3)]),
      ]),
    )
    const anderesPraedikat = faktLesen(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: { op: 'all', operands: [staatsbuergerschaft('FR'), staatsbuergerschaft('CH')] } }, { effect: 'not_required', visaMode: null }, [ev(1), ev(2)]),
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }, [ev(3)]),
      ]),
    )
    const andereStuetze = faktLesen(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: { op: 'all', operands: [staatsbuergerschaft('DE'), staatsbuergerschaft('CH')] } }, { effect: 'not_required', visaMode: null }, [ev(9)]),
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }, [ev(3)]),
      ]),
    )
    if (!('applicability' in andereWirkung) || !('applicability' in anderesPraedikat) || !('applicability' in andereStuetze)) {
      throw new Error('fingerprint')
    }
    assert.notEqual(regelAnwendbarkeitFingerprint(andereWirkung.applicability), gleich)
    assert.notEqual(regelAnwendbarkeitFingerprint(anderesPraedikat.applicability), gleich)
    assert.notEqual(regelAnwendbarkeitFingerprint(andereStuetze.applicability), gleich)
    const gehalten = links.applicability.branches.find((eintrag) => eintrag.id === 'held')
    assert.ok(gehalten)
    if (!gehalten || gehalten.when.kind !== 'expression' || gehalten.when.expression.op !== 'all') return
    const erste = gehalten.when.expression.operands[0]
    assert.ok(erste && erste.op === 'atomic')
    if (erste && erste.op === 'atomic') assert.deepEqual(erste.supportVersionIds, undefined)
    assert.deepEqual(gehalten.supportVersionIds, [ev(1), ev(2)])
    const zuViel = wirkung(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: staatsbuergerschaft('CH') }, { effect: 'required', visaMode: null }, Array.from({ length: 9 }, (_, index) => ev(index + 1))),
      ]),
    )
    assert.equal(zuViel.ok, false)
    if (!zuViel.ok) assert.equal(zuViel.reason, 'support_bound_exceeded')
    const ungueltig = wirkung(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: staatsbuergerschaft('CH') }, { effect: 'required', visaMode: null }, ['EV1_' + 'a'.repeat(32)]),
      ]),
    )
    assert.equal(ungueltig.ok, false)
    if (!ungueltig.ok) assert.equal(ungueltig.reason, 'invalid_support')
  })

  test('27–35 Wirkungs- und Visa-Formen', () => {
    const legacy = faktLesen({ kind: 'requirement_effect', effect: 'not_required', visaMode: null }, 'passport')
    const legacyAuswertung = regulierungsWirkungAuswerten(legacy, kontext())
    assert.equal(legacyAuswertung.status, 'decided')
    if (legacyAuswertung.status === 'decided') {
      assert.equal(legacyAuswertung.binding, null)
      assert.deepEqual(legacyAuswertung.outcome, { effect: 'not_required', visaMode: null })
    }
    const conditional = wirkung({ kind: 'requirement_effect', effect: 'conditional', visaMode: null }, 'electronic_travel_authorization')
    assert.equal(conditional.ok, false)
    if (!conditional.ok && conditional.reason === 'legacy_conditional_without_payload') {
      assert.equal(conditional.auswertung.status, 'insufficient_context')
      assert.equal(conditional.auswertung.reason, 'legacy_conditional_without_payload')
      assert.equal(conditional.auswertung.outcome, null)
    } else {
      assert.fail('conditional')
    }
    const gemischt = wirkung({
      kind: 'requirement_effect',
      schema: 1,
      applicability: {
        schema: 1,
        kind: 'branches',
        branches: [zweig('held', { kind: 'expression', expression: staatsbuergerschaft('CH') }, { effect: 'required', visaMode: null })],
      },
      effect: 'required',
      visaMode: null,
    })
    assert.equal(gemischt.ok, false)
    if (!gemischt.ok) assert.equal(gemischt.reason, 'mixed_outcome')
    const unbedingt = faktLesen(
      {
        kind: 'requirement_effect',
        schema: 1,
        applicability: { schema: 1, kind: 'unconditional' },
        effect: 'required',
        visaMode: null,
      },
      'electronic_travel_authorization',
    )
    const schemaAuswertung = regulierungsWirkungAuswerten(unbedingt, kontext())
    assert.equal(schemaAuswertung.status, 'decided')
    if (schemaAuswertung.status === 'decided') assert.equal(schemaAuswertung.reason, 'unconditional')
    const verzweigt = faktLesen(
      wirkungsFakt([
        zweig('held', { kind: 'expression', expression: erlaubnis() }, { effect: 'not_required', visaMode: null }),
        zweig('base', { kind: 'otherwise' }, { effect: 'required', visaMode: null }),
      ]),
    )
    assert.equal('effect' in verzweigt, false)
    const widerspruch = wirkung({ kind: 'requirement_effect', effect: 'required', visaMode: 'visa_exempt' }, 'visa')
    assert.equal(widerspruch.ok, false)
    if (!widerspruch.ok) assert.equal(widerspruch.reason, 'visa_contradiction')
    const pflicht = wirkung({ kind: 'requirement_effect', effect: 'not_required', visaMode: 'electronic_visa' }, 'visa')
    assert.equal(pflicht.ok, false)
    if (!pflicht.ok) assert.equal(pflicht.reason, 'visa_contradiction')
    const verboten = wirkung({ kind: 'requirement_effect', effect: 'required', visaMode: 'visa_exempt' }, 'passport')
    assert.equal(verboten.ok, false)
    if (!verboten.ok) assert.equal(verboten.reason, 'visa_mode_forbidden')

    const altOptionen = regulierungsAnwendbarkeitVisaOptionLesen({
      kind: 'visa_options',
      options: [
        { visaMode: 'electronic_visa', eligibility: 'allowed', mandate: 'mandatory' },
        { visaMode: 'visa_exempt', eligibility: 'not_allowed', mandate: 'unknown' },
      ],
    })
    assert.equal(altOptionen.ok, true)
    if (altOptionen.ok && altOptionen.wert.kind === 'visa_options' && !('schema' in altOptionen.wert)) {
      assert.deepEqual(altOptionen.wert.options.map((option) => option.visaMode), ['visa_exempt', 'electronic_visa'])
      const unbekannt = regulierungsVisaOptionAuswerten(altOptionen.wert.options[0]!, kontext())
      assert.equal(unbekannt.status, 'auswertung')
    }
    const schemaFrei = regulierungsAnwendbarkeitVisaOptionLesen({
      kind: 'visa_options',
      schema: 1,
      options: [
        {
          visaMode: 'electronic_visa',
          eligibility: 'allowed',
          mandate: 'not_mandatory',
          applicability: { schema: 1, kind: 'unconditional' },
        },
      ],
    })
    assert.equal(schemaFrei.ok, true)
    if (schemaFrei.ok && schemaFrei.wert.kind === 'visa_options' && 'schema' in schemaFrei.wert) {
      const option = schemaFrei.wert.options[0]
      assert.ok(option && 'eligibility' in option)
      if (option && 'eligibility' in option) {
        const bewertet = regulierungsVisaOptionAuswerten(option, kontext())
        assert.equal(bewertet.status, 'auswertung')
        if (bewertet.status === 'auswertung' && bewertet.auswertung.status === 'decided') {
          assert.deepEqual(bewertet.auswertung.outcome, { eligibility: 'allowed', mandate: 'not_mandatory' })
          assert.equal(bewertet.auswertung.binding, null)
        }
      }
    }
    const schemaZweig = regulierungsAnwendbarkeitVisaOptionLesen({
      kind: 'visa_options',
      schema: 1,
      options: [
        {
          visaMode: 'electronic_visa',
          applicability: {
            schema: 1,
            kind: 'branches',
            branches: [
              zweig('excluded', { kind: 'expression', expression: klasse('diplomatic') }, { eligibility: 'not_allowed', mandate: 'unknown' }),
              zweig('base', { kind: 'otherwise' }, { eligibility: 'allowed', mandate: 'unknown' }),
            ],
          },
        },
      ],
    })
    assert.equal(schemaZweig.ok, true)
    if (schemaZweig.ok && schemaZweig.wert.kind === 'visa_options' && 'schema' in schemaZweig.wert) {
      const option = schemaZweig.wert.options[0]
      assert.ok(option && !('eligibility' in option))
      if (option && !('eligibility' in option)) {
        const diplomatisch = regulierungsVisaOptionAuswerten(
          option,
          kontext({ documentClass: fakt('diplomatic') }),
        )
        assert.equal(diplomatisch.status, 'auswertung')
        if (diplomatisch.status === 'auswertung' && diplomatisch.auswertung.status === 'decided') {
          assert.equal(diplomatisch.auswertung.outcome.eligibility, 'not_allowed')
          assert.equal('effect' in diplomatisch.auswertung.outcome, false)
        }
        const offen = regulierungsVisaOptionAuswerten(option, kontext())
        assert.equal(offen.status, 'auswertung')
        if (offen.status === 'auswertung') assert.equal(offen.auswertung.status, 'insufficient_context')
      }
    }
    const optionGemischt = regulierungsAnwendbarkeitVisaOptionLesen({
      kind: 'visa_options',
      schema: 1,
      options: [
        {
          visaMode: 'electronic_visa',
          eligibility: 'allowed',
          mandate: 'unknown',
          applicability: {
            schema: 1,
            kind: 'branches',
            branches: [zweig('base', { kind: 'expression', expression: klasse('ordinary') }, { eligibility: 'allowed', mandate: 'unknown' })],
          },
        },
      ],
    })
    assert.equal(optionGemischt.ok, false)
    if (!optionGemischt.ok) assert.equal(optionGemischt.reason, 'mixed_outcome')
    const amtlichUnbekannt = regulierungsAnwendbarkeitVisaOptionLesen({
      kind: 'visa_options',
      options: [{ visaMode: 'visa_before_travel', eligibility: 'unknown', mandate: 'unknown' }],
    })
    assert.equal(amtlichUnbekannt.ok, true)
    if (amtlichUnbekannt.ok && !('schema' in amtlichUnbekannt.wert)) {
      const bewertet = regulierungsVisaOptionAuswerten(amtlichUnbekannt.wert.options[0]!, kontext())
      assert.equal(bewertet.status, 'official_unknown')
      assert.notEqual(bewertet.status, 'auswertung')
    }
  })

  test('36–40 Quelle bleibt ohne Quellenvokabular, Kontext-Hash und Importeur', () => {
    const quelle = readFileSync(join(hier, 'regulierungs-anwendbarkeit.ts'), 'utf8')
    assert.equal(/gov\.?uk|india|saudi|govuk/i.test(quelle), false)
    assert.equal(quelle.includes('reg-eval-ctx:v1'), false)
    const importe = [...quelle.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((treffer) => treffer[1])
    assert.deepEqual(importe, [
      '@/lib/readiness/official-truth-content-identity',
      '@/lib/readiness/domain',
      '@/lib/readiness/digest',
      '@/lib/readiness/official',
      '@/types/trips',
    ])
    assert.equal(/from\s+['"][^'"]*(?:supabase|provider|extractor|rule-claims|store|acceptance)[^'"]*['"]/.test(quelle), false)
    assert.equal(/\bfetch\s*\(/.test(quelle), false)
    assert.equal(/\bDate\b/.test(quelle), false)
    assert.equal(/Math\.random/.test(quelle), false)
    assert.equal(/process\.env/.test(quelle), false)
    assert.equal(quelle.includes('server-only'), false)
    const eigene = new Set([
      join(hier, 'regulierungs-anwendbarkeit.ts'),
      join(hier, 'regulierungs-anwendbarkeit.test.ts'),
      // R1's exact importer inventory mentions the module without importing it.
      join(hier, 'official-truth-content-identity.test.ts'),
      join(hier, 'official-truth-content-identity-r2.test.ts'),
      join(hier, 'rule-claims.ts'),
      join(hier, 'official-truth-composition-policy-registry.ts'),
      join(hier, 'official-truth-composition-policy-registry.test.ts'),
    ])
    const fremd = dateien(wurzel).filter((pfad) => !eigene.has(pfad) && readFileSync(pfad, 'utf8').includes('regulierungs-anwendbarkeit'))
    assert.deepEqual(fremd, [])
    const produktion = dateien(wurzel).filter(
      (pfad) => !pfad.endsWith('.test.ts') && !pfad.endsWith('.test.tsx') && readFileSync(pfad, 'utf8').includes('regulierungs-anwendbarkeit'),
    )
    assert.deepEqual(
      produktion.sort(),
      [
        join(hier, 'regulierungs-anwendbarkeit.ts'),
        join(hier, 'rule-claims.ts'),
        join(hier, 'official-truth-composition-policy-registry.ts'),
      ].sort(),
    )
    const claims = readFileSync(join(hier, 'rule-claims.ts'), 'utf8')
    for (const name of [
      'regulierungsKontextLesen',
      'regulierungsWirkungAuswerten',
      'regulierungsVisaOptionAuswerten',
      'regulierungsAusdruckAuswerten',
      'regelAnwendbarkeitFingerprint',
    ]) {
      assert.equal(claims.includes(name), false, name)
    }
    const politik = readFileSync(join(hier, 'official-truth-composition-policy-registry.ts'), 'utf8')
    assert.equal(politik.includes('regulierungsAusdruckStrukturSchluessel'), true)
    assert.equal(politik.includes('regulierungsAusdruckAuswerten'), false)
    assert.equal(politik.includes('regulierungsWirkungAuswerten'), false)
    for (const datei of [
      'official-truth-store-server.ts',
      'official-truth-trusted-fact-extractor-registry.ts',
      'official-truth-same-request-extraction-server.ts',
    ]) {
      assert.equal(readFileSync(join(hier, datei), 'utf8').includes('regulierungs-anwendbarkeit'), false, datei)
    }
  })

  test('der support-freie Strukturschlüssel ignoriert Stütz-IDs und Operandenfolge', () => {
    const atom = (purpose: string, support?: string) => ({
      op: 'atomic' as const,
      predicate: { kind: 'travel_purpose' as const, purpose },
      ...(support ? { supportVersionIds: [support] } : {}),
    })
    const links = regulierungsAusdruckLesen({
      op: 'all',
      operands: [atom('visitor', ev(1)), atom('business', ev(2))],
    })
    const rechts = regulierungsAusdruckLesen({
      op: 'all',
      operands: [atom('business', ev(9)), atom('visitor', ev(3))],
    })
    assert.equal(links.ok && rechts.ok, true)
    if (!links.ok || !rechts.ok) return
    assert.equal(regulierungsAusdruckStrukturSchluessel(links.wert), regulierungsAusdruckStrukturSchluessel(rechts.wert))
    const verschachtelt = regulierungsAusdruckLesen({ op: 'not', operand: atom('visitor', ev(4)) })
    const gleich = regulierungsAusdruckLesen({ op: 'not', operand: atom('visitor', ev(5)) })
    assert.equal(verschachtelt.ok && gleich.ok, true)
    if (!verschachtelt.ok || !gleich.ok) return
    assert.equal(
      regulierungsAusdruckStrukturSchluessel(verschachtelt.wert),
      regulierungsAusdruckStrukturSchluessel(gleich.wert),
    )
    const andere = regulierungsAusdruckLesen({ op: 'all', operands: [atom('study'), atom('business')] })
    assert.equal(andere.ok, true)
    if (!andere.ok) return
    assert.notEqual(regulierungsAusdruckStrukturSchluessel(links.wert), regulierungsAusdruckStrukturSchluessel(andere.wert))
  })
})
