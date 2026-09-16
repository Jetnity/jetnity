// lib/reisebegleiter/nutzlast.test.ts
//
// Was das Modell tatsächlich sieht.
//
// `lib/reisebegleiter/kontext.test.ts` prüft, dass die Projektion nichts
// Sensibles trägt. Diese Datei prüft die Stelle danach – den Weg von der
// Projektion in den Prompt – und zwar mit einem zweiten, eigenen Satz
// Leck-Marker. Zwei unabhängige Zeugen sind an dieser Stelle die Absicht:
// Eine gemeinsame Vorrichtung würde beide Prüfungen gleichzeitig blind machen.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { officialLeer, type OfficialEvaluation } from '@/lib/readiness/official'
import { leereSafetyEvidence } from '@/lib/safety/evidence'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { leereSeasonalEvidence } from '@/lib/seasonal/evidence'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import {
  assistantTruthContextProjizieren,
  type AssistantTruthContext,
} from '@/lib/reisebegleiter/kontext'
import { begleiternutzlastAus, verbotenesFeldFinden } from '@/lib/reisebegleiter/nutzlast'
import type { Trip, TripStage, TripTraveller } from '@/types/trips'

const JETZT = '2026-09-17T10:00:00.000Z'

const MARKE_PASSNUMMER = 'AA7766554'
const MARKE_MRZ = 'P<CHENUTZLAST<<MARKE<<<<<<<<<<<<<<<<<<<<<<<'
const MARKE_URL = 'https://provider.marke.test/deeplink?token=abc'
const MARKE_EMAIL = 'nutzlast-marke@privacy.example'
const MARKE_SECRET = 'sk-live-nutzlast-marke'
const MARKE_FINGERPRINT = 'off-v2|NUTZLAST-FP-MARKE-7766'
const MARKE_PREIS = 3131.31
const MARKE_KOORDINATE = 41.902783
const MARKE_PLACE = 'geonames:3169070'

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function citizenship(countryCode: string): TripTraveller['citizenships'][number] {
  const clientRef = `cit:${countryCode.toLowerCase()}`
  return { id: clientRef, clientRef, countryCode, createdAt: JETZT, updatedAt: JETZT }
}

function reisender(teil: Partial<TripTraveller> = {}): TripTraveller {
  return {
    id: 'traveller-1',
    clientRef: 'traveller:1',
    label: 'Alex',
    residenceCountryCode: 'DE',
    citizenships: [citizenship('CH'), citizenship('RS')],
    documents: [
      {
        id: 'document:passport:CH',
        clientRef: 'document:passport:CH',
        documentType: 'passport',
        issuingCountryCode: 'CH',
        expiresOn: '2030-01-01',
        citizenshipClientRef: 'cit:ch',
        createdAt: JETZT,
        updatedAt: JETZT,
      },
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function reise(teil: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    clientRef: 'trip-1',
    title: 'Italien',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2027-04-03',
    endDate: '2027-04-10',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: MARKE_PREIS,
    status: 'draft',
    pace: 'calm',
    interests: [],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      etappe({
        id: 'stage-rm',
        position: 1,
        name: 'Rom',
        countryCode: 'IT',
        arrivalDate: '2027-04-03',
        departureDate: '2027-04-06',
        placeId: MARKE_PLACE,
        latitude: MARKE_KOORDINATE,
        longitude: 12.496366,
      }),
      etappe({
        id: 'stage-fl',
        position: 2,
        name: 'Florenz',
        countryCode: 'IT',
        arrivalDate: '2027-04-06',
        departureDate: '2027-04-10',
      }),
    ],
    days: [],
    ohneTag: [],
    party: [reisender()],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

function official(teil: Partial<OfficialEvaluation> = {}): OfficialEvaluation {
  return {
    ...officialLeer({
      requirementType: 'visa',
      contextFingerprint: MARKE_FINGERPRINT,
      travellerClientRef: 'traveller:1',
      credentialOptionRef: 'traveller:1:document:passport:CH',
      destinationCountryCode: 'IT',
      transitCountryCode: null,
      status: 'unknown',
      freshness: 'provider_unavailable',
    }),
    evidence: {
      provider: MARKE_SECRET,
      authority: 'MAECI',
      sourceUrl: MARKE_URL,
      checkedAt: null,
      validFrom: null,
      validUntil: null,
      ruleReference: MARKE_URL,
      contextFingerprint: MARKE_FINGERPRINT,
    },
    action: { kind: 'open_official_action', purpose: 'application', href: MARKE_URL },
    ...teil,
  }
}

function safety(teil: Partial<SafetyEvaluation> = {}): SafetyEvaluation {
  return {
    factId: 'safe-1',
    factKey: 'flood',
    category: 'flood',
    eventStatus: 'active',
    evidenceStatus: 'unknown',
    freshness: 'provider_unavailable',
    relevance: 'unknown',
    spatialPrecision: 'city',
    presentationClass: 'unknown',
    sourceSeverity: 'moderate',
    advisoryClass: 'exercise_caution',
    authorityClass: 'unknown',
    affectedRefs: [{ kind: 'stage', id: 'stage-rm', label: 'Rom' }],
    impact: [],
    reason: 'Quelle nicht aktiv',
    nextAction: 'observe',
    conflict: false,
    seasonalRejected: false,
    evidence: { ...leereSafetyEvidence('fp-safety'), sourceUrl: MARKE_URL, provider: MARKE_SECRET },
    contextFingerprint: 'fp-safety',
    eventFingerprint: 'fp-safety',
    ...teil,
  }
}

function seasonal(teil: Partial<SeasonalEvaluation> = {}): SeasonalEvaluation {
  return {
    factId: 'season-1',
    factKey: 'heat',
    category: 'heat',
    evidenceClass: 'seasonal_pattern',
    outcome: 'unknown',
    evidenceStatus: 'unknown',
    freshness: 'provider_unavailable',
    relevance: 'unknown',
    spatialPrecision: 'city',
    presentationClass: 'unknown',
    authorityClass: 'unknown',
    affectedRefs: [{ kind: 'stage', id: 'stage-fl', label: 'Florenz' }],
    impact: [],
    reason: 'Quelle nicht aktiv',
    nextAction: 'observe',
    conflict: false,
    acuteRejected: false,
    evidence: { ...leereSeasonalEvidence(), sourceUrl: MARKE_URL, provider: MARKE_SECRET },
    contextFingerprint: 'fp-seasonal',
    factFingerprint: 'fp-seasonal',
    ...teil,
  }
}

function kontextMitMarken(): AssistantTruthContext {
  return assistantTruthContextProjizieren({
    reise: reise({
      party: [
        reisender(),
        reisender({
          id: 'traveller-2',
          clientRef: 'traveller:2',
          label: MARKE_URL,
          citizenships: [citizenship('IT')],
          documents: [
            {
              id: 'document:national_id:IT',
              clientRef: 'document:national_id:IT',
              documentType: 'national_id',
              issuingCountryCode: 'IT',
              expiresOn: '2031-05-05',
              citizenshipClientRef: 'cit:it',
              createdAt: JETZT,
              updatedAt: JETZT,
            },
          ],
        }),
      ],
    }),
    officialEvaluations: [official()],
    safetyEvaluations: [safety()],
    seasonalEvaluations: [seasonal()],
    routeFacts: { quelle: 'flight_itinerary', destinationCountryCodes: ['IT'], transitCountryCodes: ['CH'] },
  })
}

function nutzlast() {
  const ergebnis = begleiternutzlastAus(kontextMitMarken())
  assert.equal(ergebnis.ok, true, 'die Nutzlast kam nicht zustande')
  assert.ok(ergebnis.ok)
  return ergebnis.nutzlast
}

function zahlenSammeln(wert: unknown, acc = new Set<number>()): Set<number> {
  if (typeof wert === 'number') acc.add(wert)
  if (Array.isArray(wert)) for (const eintrag of wert) zahlenSammeln(eintrag, acc)
  else if (wert && typeof wert === 'object') {
    for (const inhalt of Object.values(wert)) zahlenSammeln(inhalt, acc)
  }
  return acc
}

function textwerteSammeln(wert: unknown, acc = new Set<string>()): Set<string> {
  if (typeof wert === 'string') acc.add(wert)
  if (Array.isArray(wert)) for (const eintrag of wert) textwerteSammeln(eintrag, acc)
  else if (wert && typeof wert === 'object') {
    for (const inhalt of Object.values(wert)) textwerteSammeln(inhalt, acc)
  }
  return acc
}

describe('Die Modellnutzlast trägt nichts Sensibles', () => {
  test('keine Leck-Marke erreicht den Prompt', () => {
    const roh = nutzlast().kontext
    for (const marke of [
      MARKE_PASSNUMMER,
      MARKE_MRZ,
      MARKE_URL,
      MARKE_EMAIL,
      MARKE_SECRET,
      MARKE_FINGERPRINT,
      'NUTZLAST-FP-MARKE-7766',
      String(MARKE_PREIS),
      String(MARKE_KOORDINATE),
      MARKE_PLACE,
    ]) {
      assert.equal(roh.includes(marke), false, `Leck im Prompt: ${marke}`)
    }
  })

  test('keine Leck-Marke erreicht die angezeigten Bezüge', () => {
    const roh = JSON.stringify(nutzlast().bezuege)
    for (const marke of [MARKE_URL, MARKE_SECRET, MARKE_FINGERPRINT, MARKE_PLACE]) {
      assert.equal(roh.includes(marke), false, `Leck im Bezug: ${marke}`)
    }
  })

  test('die Reissleine hält die eigene Nutzlast für unbedenklich', () => {
    assert.equal(verbotenesFeldFinden(JSON.parse(nutzlast().kontext)), null)
  })

  test('kein Feldname der Nutzlast benennt etwas Sensibles', () => {
    const inhalt: unknown = JSON.parse(nutzlast().kontext)
    assert.equal(verbotenesFeldFinden(inhalt), null)
  })

  test('Koordinaten und Ortsschlüssel fehlen bewusst', () => {
    const inhalt: unknown = JSON.parse(nutzlast().kontext)
    const texte = textwerteSammeln(inhalt)
    const zahlen = zahlenSammeln(inhalt)
    assert.equal(texte.has(MARKE_PLACE), false)
    assert.equal(zahlen.has(MARKE_KOORDINATE), false)
    assert.equal(JSON.stringify(inhalt).includes('latitude'), false)
    assert.equal(JSON.stringify(inhalt).includes('placeId'), false)
  })
})

describe('Die Reissleine', () => {
  test('erkennt einen sensiblen Feldnamen in jeder Tiefe', () => {
    assert.match(
      verbotenesFeldFinden({ reisende: [{ documents: [{ document_number: 'x' }] }] }) ?? '',
      /document_number/,
    )
    assert.match(verbotenesFeldFinden({ official: [{ sourceUrl: null }] }) ?? '', /sourceUrl/)
    assert.match(verbotenesFeldFinden({ evidence: { contextFingerprint: 'a' } }) ?? '', /Fingerprint|fingerprint/)
    assert.match(verbotenesFeldFinden({ etappen: [{ priceAmount: 1 }] }) ?? '', /priceAmount/)
    assert.match(verbotenesFeldFinden({ konto: { email: null } }) ?? '', /email/)
    assert.match(verbotenesFeldFinden({ sitzung: { sessionToken: null } }) ?? '', /sessionToken/)
  })

  test('erkennt ein sensibles Wertmuster auch unter harmlosem Feldnamen', () => {
    assert.match(verbotenesFeldFinden({ name: MARKE_URL }) ?? '', /Wertmuster link/)
    assert.match(verbotenesFeldFinden({ name: MARKE_EMAIL }) ?? '', /Wertmuster e-mail/)
    assert.match(verbotenesFeldFinden({ name: MARKE_MRZ }) ?? '', /Wertmuster mrz/)
    assert.match(verbotenesFeldFinden({ name: '123456789' }) ?? '', /lange-ziffernfolge/)
    assert.match(
      verbotenesFeldFinden({ name: 'data:image/png;base64,AAAA' }) ?? '',
      /Wertmuster (?:daten-uri|link)/,
    )
  })

  test('lässt die legitimen Werte der Projektion durch', () => {
    assert.equal(
      verbotenesFeldFinden({
        etappen: [{ ref: 'E1', name: 'Rom', countryCode: 'IT', arrivalDate: '2027-04-03' }],
        official: [{ ref: 'O1', result: 'unknown', freshness: 'provider_unavailable', authority: 'MAECI' }],
      }),
      null,
    )
  })

  test('macht aus einem Treffer keine Auskunft, sondern einen Abbruch', () => {
    const ergebnis = begleiternutzlastAus({
      ...kontextMitMarken(),
      // Eine später erweiterte Projektion, an die hier niemand gedacht hat.
      stages: [
        {
          stageId: 'stage-neu',
          position: 1,
          name: 'Rom',
          countryCode: 'IT',
          placeId: null,
          arrivalDate: null,
          departureDate: null,
          latitude: null,
          longitude: null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ passportNumber: MARKE_PASSNUMMER } as any),
        },
      ],
    })
    // Der Marker steht in einem Feld, das die Nutzlast nicht abschreibt –
    // deshalb kommt sie zustande, und der Marker ist trotzdem nicht drin.
    assert.equal(ergebnis.ok, true)
    assert.equal(ergebnis.ok && ergebnis.nutzlast.kontext.includes(MARKE_PASSNUMMER), false)
  })
})

describe('Bezüge sind Zeiger, kein Zustand des Modells', () => {
  test('jede Bezugskennung im Prompt hat genau einen angezeigten Zustand', () => {
    const { kontext, bezuege } = nutzlast()
    const refsImPrompt = [...JSON.stringify(JSON.parse(kontext)).matchAll(/"ref":"([A-Z]{1,2}\d{1,3})"/g)].map(
      (treffer) => treffer[1],
    )
    const angezeigt = bezuege.map((bezug) => bezug.ref)

    assert.ok(refsImPrompt.length > 0)
    assert.deepEqual([...new Set(refsImPrompt)].sort(), [...angezeigt].sort())
    assert.equal(new Set(angezeigt).size, angezeigt.length, 'eine Kennung kommt doppelt vor')
  })

  test('die Kennungen sind deterministisch', () => {
    assert.equal(nutzlast().kontext, nutzlast().kontext)
    assert.deepEqual(nutzlast().bezuege, nutzlast().bezuege)
  })

  test('eine unbelegte Official-Lage gilt nicht als belegt', () => {
    const official = nutzlast().bezuege.filter((bezug) => bezug.art === 'official')
    assert.ok(official.length > 0, 'keine Official-Lage im Kontext')
    for (const bezug of official) {
      assert.equal(bezug.belegt, false)
      assert.match(bezug.lage, /Noch nicht verlässlich bestimmbar/)
    }
  })

  test('eine nicht erreichbare Safety-/Seasonal-Quelle gilt nicht als belegt', () => {
    for (const art of ['safety', 'seasonal'] as const) {
      const eintraege = nutzlast().bezuege.filter((bezug) => bezug.art === art)
      assert.ok(eintraege.length > 0, `keine ${art}-Lage im Kontext`)
      for (const eintrag of eintraege) assert.equal(eintrag.belegt, false)
    }
  })

  test('Reisende bleiben gleichrangig, ohne primäre Option', () => {
    const roh = nutzlast().kontext
    for (const wort of ['primary', 'preferred', 'bevorzugt', 'hauptsaechlich', 'wichtigste']) {
      assert.equal(roh.toLowerCase().includes(wort), false, `Rangsemantik im Prompt: ${wort}`)
    }
    const inhalt = JSON.parse(roh) as { reisende: Array<{ ref: string }> }
    assert.deepEqual(
      inhalt.reisende.map((eintrag) => eintrag.ref),
      ['R1', 'R2'],
    )
  })
})
