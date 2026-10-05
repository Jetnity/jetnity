// lib/readiness/official-truth-candidate-batch.test.ts
//
// Synthetische Forschungs-Chargen. Keine echte Ländercharge, keine Reisedokumente,
// keine Behörden-URL. Die Uhr ist injiziert.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import { requirementsProviderAus } from '@/lib/readiness/provider'
import { REGEL_EVIDENCE_QUALITAETEN } from '@/lib/readiness/rule-claims'
import { TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'
import {
  KANDIDATEN_CHARGE_DATENBANK,
  KANDIDATEN_CHARGE_FORSCHUNG,
  kandidatenChargeValidieren,
  type KandidatenChargeBefund,
  type KandidatenChargeErgebnis,
} from '@/lib/readiness/official-truth-candidate-batch'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const UHR = '2026-10-01T12:00:00.000Z'
const ABGERUFEN = '2026-09-01T00:00:00.000Z'
const QUELLE = 'https://gov.example/entry'
const ZWEITE = 'https://interior.example/rule'
const AKTION = 'https://gov.example/apply'

function uhr(instant = UHR): () => Date {
  return () => new Date(instant)
}

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function eintrag(teil?: Record<string, unknown>): Record<string, unknown> {
  return {
    destinationCountryCode: 'XB',
    evidenceQuality: 'explicit_primary_statement',
    officialSourceUrl: QUELLE,
    additionalOfficialSourceUrl: [],
    officialActionLink: null,
    retrievedAt: ABGERUFEN,
    validFrom: null,
    validUntil: null,
    ...teil,
  }
}

function charge(teil?: Record<string, unknown>, ziele?: readonly Record<string, unknown>[]): Record<string, unknown> {
  return {
    researchStatus: KANDIDATEN_CHARGE_FORSCHUNG,
    databaseImportStatus: KANDIDATEN_CHARGE_DATENBANK,
    citizenshipCountryCode: 'AA',
    documentType: 'passport',
    destinations: ziele ?? [eintrag()],
    ...teil,
  }
}

function pruefen(eingabe: unknown, instant = UHR): KandidatenChargeErgebnis {
  return kandidatenChargeValidieren(eingabe, uhr(instant))
}

function codes(ergebnis: KandidatenChargeErgebnis): string[] {
  return ergebnis.ok ? [] : ergebnis.findings.map((befund) => befund.code)
}

function hat(ergebnis: KandidatenChargeErgebnis, code: KandidatenChargeBefund['code'], path?: string): boolean {
  return !ergebnis.ok && ergebnis.findings.some((befund) => befund.code === code && (path === undefined || befund.path === path))
}

describe('Official Truth candidate batch validator', () => {
  test('der Validator hat keinen Import-, Netz- oder Datenbankpfad', () => {
    const text = quelle('lib/readiness/official-truth-candidate-batch.ts')
    assert.equal(requirementsProviderAus(), null)
    assert.doesNotMatch(text, /supabase|openai|fetch\(|Date\.now|new Date\(|evidenceKandidatAkzeptieren|regelKandidatAkzeptieren|requirementsProviderAus|official_truth_store|createClient/)
    assert.doesNotMatch(text, /\bINSERT\b|\bSELECT\b|\bUPDATE\b|\bDELETE\b/)
    assert.equal(text.includes("promotion: 'not_performed'"), true)
    assert.equal(text.includes('importReady'), false)
    assert.equal(text.includes('RESEARCH_ONLY'), true)
    assert.equal(text.includes('NOT_APPROVED_FOR_DATABASE_IMPORT'), true)
    assert.equal(text.includes('REGEL_EVIDENCE_QUALITAETEN'), true)
    assert.equal(text.includes("'ordinary_passport'"), true)
    assert.equal(text.includes('TRAVELLER_DOCUMENT_TYPES'), false)
    assert.equal(text.includes("ordinary_passport' ? 'passport'"), false)
    assert.equal((TRAVELLER_DOCUMENT_TYPES as readonly string[]).includes('ordinary_passport'), false)
    assert.deepEqual(REGEL_EVIDENCE_QUALITAETEN, [
      'explicit_primary_statement',
      'composed_from_multiple_primary_sources',
      'stale_primary_evidence',
      'unresolved_conflict',
      'research_gap',
    ])
    assert.equal(TRAVELLER_DOCUMENT_TYPES.includes('passport'), true)
    assert.equal(TRAVELLER_DOCUMENT_TYPES.includes('national_id'), true)
    assert.equal(TRAVELLER_DOCUMENT_TYPES.includes('unknown'), true)
  })

  test('genaue Forschungsstatus werden angenommen und nicht als Import ausgegeben', () => {
    const ergebnis = pruefen(charge())
    assert.equal(ergebnis.ok, true)
    if (!ergebnis.ok) return
    assert.equal(ergebnis.researchStatus, 'RESEARCH_ONLY')
    assert.equal(ergebnis.databaseImportStatus, 'NOT_APPROVED_FOR_DATABASE_IMPORT')
    assert.equal(ergebnis.citizenshipCountryCode, 'AA')
    assert.equal(ergebnis.documentType, 'passport')
    assert.equal(ergebnis.destinations[0]?.officialSourceUrl, QUELLE)
    assert.equal(ergebnis.destinations.length, 1)
    assert.equal(ergebnis.destinations[0]?.promotion, 'not_performed')
    assert.equal(ergebnis.destinations[0]?.truthDisposition, 'review_only')
    assert.deepEqual(ergebnis.destinations[0]?.supportingOfficialSourceUrls, [QUELLE])
    assert.equal(ergebnis.destinations[0]?.officialActionLink, null)
    const json = JSON.stringify(ergebnis)
    assert.equal(json.includes('"importReady"'), false)
    assert.equal(json.includes('"APPROVED_FOR_DATABASE_IMPORT"'), false)
    assert.equal(json.includes('OFFICIAL_TRUTH'), false)
    assert.equal(json.includes('"promotable":true'), false)
  })

  test('Import, Official Truth und Annahme werden abgelehnt', () => {
    const faelle: Array<{ wert: Record<string, unknown>; path: string }> = [
      { wert: { researchStatus: 'APPROVED' }, path: 'researchStatus' },
      { wert: { researchStatus: 'IMPORT-READY' }, path: 'researchStatus' },
      { wert: { researchStatus: 'OFFICIAL_TRUTH' }, path: 'researchStatus' },
      { wert: { databaseImportStatus: 'APPROVED_FOR_DATABASE_IMPORT' }, path: 'databaseImportStatus' },
      { wert: { importReady: true }, path: 'importReady' },
      { wert: { officialTruth: true }, path: 'officialTruth' },
      { wert: { accepted: true }, path: 'accepted' },
    ]
    for (const fall of faelle) {
      const ergebnis = pruefen(charge(fall.wert))
      assert.equal(ergebnis.ok, false, JSON.stringify(fall.wert))
      assert.equal(hat(ergebnis, 'forbidden_claim', fall.path), true, JSON.stringify(ergebnis))
    }
    const anders = pruefen(charge({ researchStatus: 'MAYBE' }))
    assert.equal(hat(anders, 'research_status_invalid', 'researchStatus'), true)
    const leer = pruefen(charge({ databaseImportStatus: 'NO' }))
    assert.equal(hat(leer, 'database_import_status_invalid', 'databaseImportStatus'), true)
  })

  test('explizite und zusammengesetzte Quellen haben die kanonische Mindestzahl', () => {
    const ohne = pruefen(charge({}, [eintrag({ officialSourceUrl: null })]))
    assert.equal(hat(ohne, 'primary_official_source_required', 'destinations[0].officialSourceUrl'), true)
    assert.equal(ohne.ok, false)

    const eine = pruefen(
      charge({}, [eintrag({ evidenceQuality: 'composed_from_multiple_primary_sources', officialSourceUrl: QUELLE })]),
    )
    assert.equal(hat(eine, 'insufficient_official_sources'), true)

    const zwei = pruefen(
      charge({}, [
        eintrag({
          evidenceQuality: 'composed_from_multiple_primary_sources',
          officialSourceUrl: QUELLE,
          additionalOfficialSourceUrl: [ZWEITE],
        }),
      ]),
    )
    assert.equal(zwei.ok, true)
    if (zwei.ok) {
      assert.equal(zwei.destinations[0]?.officialSourceUrl, QUELLE)
      assert.deepEqual(zwei.destinations[0]?.supportingOfficialSourceUrls, [QUELLE, ZWEITE])
      assert.equal(zwei.destinations[0]?.truthDisposition, 'review_only')
      assert.equal(zwei.destinations[0]?.promotion, 'not_performed')
    }

    const doppelt = pruefen(
      charge({}, [
        eintrag({
          evidenceQuality: 'composed_from_multiple_primary_sources',
          officialSourceUrl: QUELLE,
          additionalOfficialSourceUrl: [QUELLE],
        }),
      ]),
    )
    assert.equal(hat(doppelt, 'duplicate_official_source', 'destinations[0].additionalOfficialSourceUrl[0]'), true)

    const nurZusatz = pruefen(charge({}, [eintrag({ officialSourceUrl: null, additionalOfficialSourceUrl: [ZWEITE] })]))
    assert.equal(nurZusatz.ok, false)
    assert.equal(hat(nurZusatz, 'primary_official_source_required', 'destinations[0].officialSourceUrl'), true)
    assert.equal(JSON.stringify(nurZusatz).includes(ZWEITE), false)

    const altOhnePrimaer = pruefen(
      charge({}, [eintrag({ evidenceQuality: 'stale_primary_evidence', officialSourceUrl: null, additionalOfficialSourceUrl: [ZWEITE] })]),
    )
    assert.equal(hat(altOhnePrimaer, 'primary_official_source_required', 'destinations[0].officialSourceUrl'), true)
  })

  test('ein Aktionslink stützt keine Quelle und wird nicht umgeschrieben', () => {
    const nurAktion = pruefen(charge({}, [eintrag({ officialSourceUrl: null, officialActionLink: AKTION })]))
    assert.equal(nurAktion.ok, false)
    assert.equal(hat(nurAktion, 'primary_official_source_required', 'destinations[0].officialSourceUrl'), true)
    assert.equal(JSON.stringify(nurAktion).includes(AKTION), false)

    const zusammengesetzt = pruefen(
      charge({}, [
        eintrag({
          evidenceQuality: 'composed_from_multiple_primary_sources',
          officialSourceUrl: QUELLE,
          officialActionLink: AKTION,
        }),
      ]),
    )
    assert.equal(hat(zusammengesetzt, 'insufficient_official_sources'), true)

    const geschrieben = 'https://GOV.example/entry'
    const behalten = pruefen(charge({}, [eintrag({ officialSourceUrl: geschrieben, officialActionLink: AKTION })]))
    assert.equal(behalten.ok, true)
    if (behalten.ok) {
      assert.deepEqual(behalten.destinations[0]?.supportingOfficialSourceUrls, [geschrieben])
      assert.equal(behalten.destinations[0]?.officialActionLink, AKTION)
      assert.equal(behalten.destinations[0]?.supportingOfficialSourceUrls.includes(AKTION), false)
    }
  })

  test('utm-Parameter scheitern, ohne den Parameterwert zu wiederholen', () => {
    const geheim = 'newsletter-token-should-not-echo'
    const ergebnis = pruefen(
      charge({}, [eintrag({ officialSourceUrl: `https://gov.example/entry?utm_source=${geheim}` })]),
    )
    assert.equal(hat(ergebnis, 'tracking_parameter', 'destinations[0].officialSourceUrl'), true)
    assert.equal(JSON.stringify(ergebnis).includes(geheim), false)

    const gross = pruefen(charge({}, [eintrag({ additionalOfficialSourceUrl: ['https://interior.example/rule?UTM_medium=mail'] })]))
    assert.equal(hat(gross, 'tracking_parameter', 'destinations[0].additionalOfficialSourceUrl[0]'), true)

    const aktion = pruefen(charge({}, [eintrag({ officialActionLink: 'https://gov.example/apply?utm_campaign=spring' })]))
    assert.equal(hat(aktion, 'tracking_parameter', 'destinations[0].officialActionLink'), true)

    const erlaubt = pruefen(charge({}, [eintrag({ officialSourceUrl: 'https://gov.example/entry?lang=en' })]))
    assert.equal(erlaubt.ok, true)
    if (erlaubt.ok) assert.equal(erlaubt.destinations[0]?.supportingOfficialSourceUrls[0], 'https://gov.example/entry?lang=en')

    const verweis = pruefen(charge({}, [eintrag({ officialSourceUrl: 'https://gov.example/entry?ref=toc' })]))
    assert.equal(verweis.ok, true)

    const ohneStrich = pruefen(charge({}, [eintrag({ officialSourceUrl: 'https://gov.example/entry?utm=1' })]))
    assert.equal(ohneStrich.ok, true)

    const geheimTracker = 'click-secret-should-not-echo'
    for (const name of ['gclid', 'dclid', 'fbclid', 'msclkid', 'gbraid', 'wbraid', 'mc_cid', 'mc_eid', 'GCLID', 'Mc_Eid']) {
      const tracker = pruefen(charge({}, [eintrag({ officialSourceUrl: `https://gov.example/entry?${name}=${geheimTracker}` })]))
      assert.equal(hat(tracker, 'tracking_parameter', 'destinations[0].officialSourceUrl'), true, name)
      assert.equal(JSON.stringify(tracker).includes(geheimTracker), false, name)
    }
  })

  test('retrievedAt nutzt nur die injizierte UTC-Uhr', () => {
    const gleich = pruefen(charge({}, [eintrag({ retrievedAt: UHR })]), UHR)
    assert.equal(gleich.ok, true)

    const spaeter = pruefen(charge({}, [eintrag({ retrievedAt: '2026-10-01T12:00:00.001Z' })]), UHR)
    assert.equal(hat(spaeter, 'retrieved_at_in_future', 'destinations[0].retrievedAt'), true)

    const frueherUhr = pruefen(charge(), '2026-01-01T00:00:00.000Z')
    assert.equal(hat(frueherUhr, 'retrieved_at_in_future'), true)

    const versatz = pruefen(charge({}, [eintrag({ retrievedAt: '2026-09-01T00:00:00+00:00' })]))
    assert.equal(hat(versatz, 'invalid_retrieved_at'), true)

    const klein = pruefen(charge({}, [eintrag({ retrievedAt: '2026-09-01T00:00:00.000z' })]))
    assert.equal(hat(klein, 'invalid_retrieved_at'), true)

    const datum = pruefen(charge({}, [eintrag({ retrievedAt: '2026-09-01' })]))
    assert.equal(hat(datum, 'invalid_retrieved_at'), true)

    const leerzeichen = pruefen(charge({}, [eintrag({ retrievedAt: ` ${ABGERUFEN}` })]))
    assert.equal(hat(leerzeichen, 'invalid_retrieved_at'), true)

    const februar = pruefen(charge({}, [eintrag({ retrievedAt: '2023-02-29T00:00:00.000Z' })]))
    assert.equal(hat(februar, 'invalid_retrieved_at'), true)

    const schalt = pruefen(charge({}, [eintrag({ retrievedAt: '2024-02-29T00:00:00.000Z' })]))
    assert.equal(schalt.ok, true)

    const ohneUhr = kandidatenChargeValidieren(charge(), undefined as unknown as () => Date)
    assert.equal(hat(ohneUhr, 'invalid_validation_clock', '$uhr'), true)
  })

  test('Gültigkeit bleibt leer oder datumsgenau und geordnet', () => {
    const leer = pruefen(charge({}, [eintrag({ validFrom: null, validUntil: null })]))
    assert.equal(leer.ok, true)
    if (leer.ok) {
      assert.equal(leer.destinations[0]?.validFrom, null)
      assert.equal(leer.destinations[0]?.validUntil, null)
    }

    const fenster = pruefen(charge({}, [eintrag({ validFrom: '2026-01-01', validUntil: '2026-12-31' })]))
    assert.equal(fenster.ok, true)

    const gleich = pruefen(charge({}, [eintrag({ validFrom: '2026-06-01', validUntil: '2026-06-01' })]))
    assert.equal(gleich.ok, true)

    const tausch = pruefen(charge({}, [eintrag({ validFrom: '2026-12-31', validUntil: '2026-01-01' })]))
    assert.equal(hat(tausch, 'validity_order', 'destinations[0].validUntil'), true)

    const ueberlauf = pruefen(charge({}, [eintrag({ validFrom: '2026-02-31', validUntil: null })]))
    assert.equal(hat(ueberlauf, 'invalid_validity', 'destinations[0].validFrom'), true)

    const instant = pruefen(charge({}, [eintrag({ validUntil: '2026-12-31T00:00:00.000Z' })]))
    assert.equal(hat(instant, 'invalid_validity', 'destinations[0].validUntil'), true)

    assert.equal(pruefen(charge({}, [eintrag({ validFrom: '2024-02-29', validUntil: null })])).ok, true)
    assert.equal(hat(pruefen(charge({}, [eintrag({ validFrom: '2023-02-29', validUntil: null })])), 'invalid_validity'), true)
    assert.equal(hat(pruefen(charge({}, [eintrag({ validFrom: '1900-02-29', validUntil: null })])), 'invalid_validity'), true)
    assert.equal(pruefen(charge({}, [eintrag({ validFrom: '2000-02-29', validUntil: '2000-02-29' })])).ok, true)
  })

  test('Lücke, Widerspruch und veraltete Primärquelle werden nicht zu Wahrheit', () => {
    const luecke = pruefen(
      charge({}, [
        eintrag({
          evidenceQuality: 'research_gap',
          officialSourceUrl: null,
          retrievedAt: null,
        }),
      ]),
    )
    assert.equal(luecke.ok, true)
    if (luecke.ok) {
      assert.equal(luecke.destinations[0]?.truthDisposition, 'not_importable_truth')
      assert.equal(luecke.destinations[0]?.promotion, 'not_performed')
      assert.equal(JSON.stringify(luecke).includes('not_required'), false)
    }

    const verboten = pruefen(
      charge({}, [
        eintrag({
          evidenceQuality: 'research_gap',
          officialSourceUrl: null,
          retrievedAt: null,
          not_required: 'secret-gap-value',
        }),
      ]),
    )
    assert.equal(hat(verboten, 'research_gap_not_required_forbidden', 'destinations[0].not_required'), true)
    assert.equal(JSON.stringify(verboten).includes('secret-gap-value'), false)

    const widerspruch = pruefen(
      charge({}, [
        eintrag({
          evidenceQuality: 'unresolved_conflict',
          officialSourceUrl: QUELLE,
          additionalOfficialSourceUrl: [ZWEITE],
        }),
      ]),
    )
    assert.equal(widerspruch.ok, true)
    if (widerspruch.ok) {
      assert.equal(widerspruch.destinations[0]?.truthDisposition, 'not_importable_truth')
      assert.equal(widerspruch.destinations[0]?.promotion, 'not_performed')
    }
    const geloest = pruefen(
      charge({}, [
        eintrag({
          evidenceQuality: 'unresolved_conflict',
          resolved: true,
        }),
      ]),
    )
    assert.equal(hat(geloest, 'conflict_resolved_forbidden', 'destinations[0].resolved'), true)

    const alt = pruefen(charge({}, [eintrag({ evidenceQuality: 'stale_primary_evidence' })]))
    assert.equal(alt.ok, true)
    if (alt.ok) {
      assert.equal(alt.destinations[0]?.truthDisposition, 'not_importable_truth')
      assert.equal(alt.destinations[0]?.promotion, 'not_performed')
      assert.equal(JSON.stringify(alt).includes('"current"'), false)
    }
    const aktuell = pruefen(charge({}, [eintrag({ evidenceQuality: 'stale_primary_evidence', current: true })]))
    assert.equal(hat(aktuell, 'stale_as_current_forbidden', 'destinations[0].current'), true)

    const ohneQuelle = pruefen(charge({}, [eintrag({ evidenceQuality: 'stale_primary_evidence', officialSourceUrl: null })]))
    assert.equal(hat(ohneQuelle, 'primary_official_source_required', 'destinations[0].officialSourceUrl'), true)
  })

  test('persönliche Schlüssel scheitern ohne Wert-Echo', () => {
    const geheim = 'P-991122-DO-NOT-ECHO'
    const schluessel = [
      'passportNumber',
      'document_number',
      'MRZ',
      'passportScan',
      'documentScan',
      'image',
      'biometric',
      'face',
      'fingerprint',
      'health',
      'vaccinationRecord',
      'birthDate',
      'dateOfBirth',
      'travellerName',
      'fullName',
      'email',
      'accountId',
      'userId',
    ]
    for (const name of schluessel) {
      const ergebnis = pruefen(charge({ [name]: geheim }))
      assert.equal(hat(ergebnis, 'sensitive_personal_field', name), true, name)
      assert.equal(JSON.stringify(ergebnis).includes(geheim), false, name)
    }

    const verschachtelt = pruefen({
      ...charge(),
      destinations: [eintrag(), { meta: { passportNumber: geheim } }],
    })
    assert.equal(hat(verschachtelt, 'sensitive_personal_field', 'destinations[1].meta.passportNumber'), true)
    assert.equal(JSON.stringify(verschachtelt).includes(geheim), false)
  })

  test('Staatsbürgerschaft wird nicht aus Wohnsitz oder Aussteller gelesen', () => {
    const wohnsitz = pruefen({
      researchStatus: KANDIDATEN_CHARGE_FORSCHUNG,
      databaseImportStatus: KANDIDATEN_CHARGE_DATENBANK,
      residenceCountryCode: 'AA',
      documentType: 'passport',
      destinations: [eintrag()],
    })
    assert.equal(wohnsitz.ok, false)
    assert.equal(hat(wohnsitz, 'citizenship_required', 'citizenshipCountryCode'), true)
    assert.equal(hat(wohnsitz, 'citizenship_not_derivable', 'residenceCountryCode'), true)
    assert.equal(JSON.stringify(wohnsitz).includes('"citizenshipCountryCode":"AA"'), false)

    const aussteller = pruefen(charge({ issuingCountryCode: 'AA' }))
    assert.equal(hat(aussteller, 'citizenship_not_derivable', 'issuingCountryCode'), true)
    if (!aussteller.ok) {
      assert.equal(JSON.stringify(aussteller).includes('"citizenshipCountryCode"'), false)
    }

    const explizit = pruefen(charge({ citizenshipCountryCode: ' aa ' }))
    assert.equal(explizit.ok, true)
    if (explizit.ok) assert.equal(explizit.citizenshipCountryCode, 'AA')

    const unbekannt = pruefen(charge({ documentType: 'unknown' }))
    assert.equal(hat(unbekannt, 'document_type_not_explicit', 'documentType'), true)
    const ohneDokument = charge()
    delete ohneDokument.documentType
    const fehlt = pruefen(ohneDokument)
    assert.equal(hat(fehlt, 'document_type_required', 'documentType'), true)
    const personalausweis = pruefen(charge({ documentType: 'national_id' }))
    assert.equal(personalausweis.ok, true)
    if (personalausweis.ok) assert.equal(personalausweis.documentType, 'national_id')

    const forschung = pruefen(charge({ documentType: 'ordinary_passport' }))
    assert.equal(forschung.ok, true)
    if (forschung.ok) {
      assert.equal(forschung.documentType, 'ordinary_passport')
      assert.equal(JSON.stringify(forschung).includes('"documentType":"passport"'), false)
    }
    const umgeschrieben = pruefen(charge({ documentType: 'Ordinary_Passport' }))
    assert.equal(hat(umgeschrieben, 'invalid_document_type', 'documentType'), true)
  })

  test('mehrere Ziele bleiben in der gegebenen Reihenfolge und die Eingabe bleibt unverändert', () => {
    const eingabe = charge({}, [
      eintrag({ destinationCountryCode: 'XB' }),
      eintrag({ destinationCountryCode: 'xc', evidenceQuality: 'research_gap', officialSourceUrl: null, retrievedAt: null }),
    ])
    const vorher = JSON.stringify(eingabe)
    const ergebnis = pruefen(eingabe)
    assert.equal(JSON.stringify(eingabe), vorher)
    assert.equal(ergebnis.ok, true)
    if (ergebnis.ok) {
      assert.deepEqual(
        ergebnis.destinations.map((ziel) => ziel.destinationCountryCode),
        ['XB', 'XC'],
      )
      assert.equal(ergebnis.destinations[1]?.truthDisposition, 'not_importable_truth')
    }
  })

  test('unsichere oder lokale URLs scheitern, ohne Geheimnisse zu wiederholen', () => {
    const token = 'secret-token-should-not-echo'
    const login = pruefen(charge({}, [eintrag({ officialSourceUrl: `https://user:${token}@gov.example/a` })]))
    assert.equal(hat(login, 'invalid_url', 'destinations[0].officialSourceUrl'), true)
    assert.equal(JSON.stringify(login).includes(token), false)

    assert.equal(hat(pruefen(charge({}, [eintrag({ officialSourceUrl: 'http://gov.example/entry' })])), 'invalid_url'), true)
    assert.equal(hat(pruefen(charge({}, [eintrag({ officialSourceUrl: 'https://localhost/entry' })])), 'invalid_url'), true)
    assert.equal(hat(pruefen(charge({}, [eintrag({ officialSourceUrl: ' HTTPS://gov.example/entry' })])), 'invalid_url'), true)
    assert.equal(codes(pruefen(null)).includes('invalid_batch'), true)
    assert.equal(hat(pruefen(charge({ destinations: [] })), 'destinations_required', 'destinations'), true)
  })
})
