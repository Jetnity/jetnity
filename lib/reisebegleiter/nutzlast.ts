// lib/reisebegleiter/nutzlast.ts
//
// Vom akzeptierten Truth-Context zu dem, was das Modell tatsächlich sieht.
//
// ---------------------------------------------------------------------------
// Diese Datei erweitert die Erlaubnisliste nicht
// ---------------------------------------------------------------------------
//
// `assistantTruthContextProjizieren()` in `lib/reisebegleiter/kontext.ts` ist
// die eine akzeptierte Quelle des Assistant-Kontexts (Assistant Truth
// Context 1). Diese Datei liest ausschliesslich deren Ergebnis und darf in
// genau eine Richtung abweichen: **enger**.
//
// Sie nimmt weg und legt nichts dazu. Weggenommen werden
//
//   · `placeId`, `latitude`, `longitude` – ein Ortsschlüssel und zwei
//     Koordinaten sagen einem Sprachmodell nichts, was der Etappenname nicht
//     besser sagt, und sie sind der einzige quasi-geografische Rohwert der
//     Projektion. Datenminimierung kostet hier nichts;
//   · `unfilledTruthClasses` und `generatedSuggestion` – sie sind eine Aussage
//     über den Vertrag, nicht über die Reise;
//   · jeder Freitext, der wie ein Link aussieht – Etappenname, Reisenden-Label,
//     `authority`, `ruleReference`. Official-Quell-URLs gehören nicht in den
//     Modelleingang, und ein Nutzer darf eine Etappe nennen, wie er will.
//
// Dazugelegt wird genau ein Feld, und es trägt keine Wahrheit: `ref`. Es ist
// die Kennung, mit der das Modell auf einen Eintrag **zeigen** darf. Den
// Zustand dieses Eintrags formuliert nicht das Modell, sondern
// `bezuege` unten – abgeleitet aus derselben Projektion, angezeigt von der
// Oberfläche. Ein Modell, das den Zustand nicht schreiben darf, kann ihn nicht
// verfälschen.
//
// ---------------------------------------------------------------------------
// Die Reissleine
// ---------------------------------------------------------------------------
//
// `verbotenesFeldFinden()` läuft über die fertige Nutzlast und sucht nach
// Feldnamen und Wertmustern, die dort nie stehen dürfen – Passnummer, MRZ,
// Scan, Biometrie, Gesundheitsdaten, Sitzungs-/Kontokennungen, Links, Beträge.
//
// Sie ist keine zweite Erlaubnisliste. Sie ist die Antwort auf die Frage, was
// passiert, wenn die Projektion später erweitert wird und niemand an diesen
// Weg denkt: Der Aufruf kommt nicht zustande. Ein stiller Abfluss ist teurer
// als eine ausgefallene Auskunft.
//
// Frei von Next, Supabase und `process.env`.

import { COUNTRY_UI_LOCALE, landName } from '@/lib/country/darstellung'
import {
  OFFICIAL_ERGEBNIS_BEZEICHNUNG,
  officialAnforderungTitel,
  officialFehlendeAngabenText,
  officialFreshnessText,
} from '@/lib/readiness/bezeichnungen'
import {
  SAFETY_FRISCHE_TEXT,
  SAFETY_KATEGORIE_TEXT,
  SAFETY_KLASSE_TEXT,
  SAFETY_RELEVANZ_TEXT,
} from '@/lib/safety/anzeige'
import {
  SEASONAL_FRISCHE_TEXT,
  SEASONAL_KATEGORIE_TEXT,
  SEASONAL_KLASSE_TEXT,
  SEASONAL_RELEVANZ_TEXT,
} from '@/lib/seasonal/anzeige'
import type {
  AssistantOfficialContext,
  AssistantSafetyContext,
  AssistantSeasonalContext,
  AssistantStageContext,
  AssistantTravellerContext,
  AssistantTruthContext,
} from '@/lib/reisebegleiter/kontext'
import { traegtLink } from '@/lib/reisebegleiter/schema'

const BEZUG_ARTEN = ['etappe', 'reisende', 'official', 'safety', 'seasonal'] as const
export type BegleiterBezugArt = (typeof BEZUG_ARTEN)[number]

/**
 * Ein Eintrag, auf den das Modell zeigen darf – mit dem Zustand, den Jetnity
 * ihm gibt.
 *
 * `belegt` ist bewusst eng: Nur eine Lage, die aus einer aktuellen, erreichbaren
 * Quelle stammt, gilt als belegt. `unknown`, `unavailable`, `stale`,
 * `recheck_needed` und `never_checked` sind es nicht – und dürfen es auch dann
 * nicht werden, wenn eine Auskunft selbstsicher klingt.
 */
export type BegleiterBezug = {
  ref: string
  art: BegleiterBezugArt
  titel: string
  lage: string
  belegt: boolean
}

export type Begleiternutzlast = {
  /** Was in die Systemregeln geht. Reines JSON, ohne Nutzertext. */
  kontext: string
  bezuege: BegleiterBezug[]
}

export type Nutzlastergebnis =
  | { ok: true; nutzlast: Begleiternutzlast }
  | { ok: false; feld: string }

/** Ein Freitext, der wie ein Link aussieht, verlässt die Nutzlast. */
function ohneLink(wert: string | null): string | null {
  if (wert === null) return null
  return traegtLink(wert) ? null : wert
}

function landText(code: string | null): string | null {
  return code ? landName(code, COUNTRY_UI_LOCALE) : null
}

// ---------------------------------------------------------------------------
// Nutzlast je Bereich
// ---------------------------------------------------------------------------

function etappeFuerModell(stage: AssistantStageContext, ref: string) {
  return {
    ref,
    position: stage.position,
    name: ohneLink(stage.name),
    countryCode: stage.countryCode,
    arrivalDate: stage.arrivalDate,
    departureDate: stage.departureDate,
  }
}

function reisendeFuerModell(traveller: AssistantTravellerContext, ref: string) {
  return {
    ref,
    residenceCountryCode: traveller.residenceCountryCode,
    citizenshipCountryCodes: traveller.citizenships.map((eintrag) => eintrag.countryCode),
    // Dokumente bleiben Typ, Ausstellungsland, zugeordnete Staatsangehörigkeit
    // und Ablaufdatum. Eine Dokumentnummer gibt es in der Projektion nicht und
    // soll es hier auch nicht geben.
    documents: traveller.documents.map((document) => ({
      documentType: document.documentType,
      issuingCountryCode: document.issuingCountryCode,
      citizenshipCountryCode: document.citizenshipCountryCode,
      expiresOn: document.expiresOn,
    })),
    credentialOptions: traveller.credentialOptions.map((option) => ({
      citizenshipCountryCodes: [...option.citizenshipCountryCodes],
      issuingCountryCode: option.issuingCountryCode,
      expiresOn: option.expiresOn,
    })),
  }
}

function officialFuerModell(
  official: AssistantOfficialContext,
  ref: string,
  reisendenRef: (clientRef: string | null) => string | null,
  etappenRef: (stageId: string) => string | null,
) {
  return {
    ref,
    truthClass: official.truthClass,
    scope: official.scope,
    reisendeRef: reisendenRef(official.travellerClientRef),
    credentialOptionRef: official.credentialOptionRef,
    destinationCountryCode: official.destinationCountryCode,
    transitCountryCode: official.transitCountryCode,
    etappenRefs: official.boundStageIds.map(etappenRef).filter((wert): wert is string => wert !== null),
    requirementType: official.requirementType,
    result: official.result,
    status: official.status,
    freshness: official.freshness,
    officialClass: official.officialClass,
    visaMode: official.visaMode,
    optionEligibility: official.optionEligibility,
    optionMandate: official.optionMandate,
    missingFacts: [...official.missingFacts],
    checkedAt: official.checkedAt,
    validFrom: official.validFrom,
    validUntil: official.validUntil,
    authority: ohneLink(official.authority),
    ruleReference: ohneLink(official.ruleReference),
    temporalRule: official.temporalRule,
  }
}

function safetyFuerModell(
  safety: AssistantSafetyContext,
  ref: string,
  etappenRef: (stageId: string) => string | null,
) {
  return {
    ref,
    domain: safety.domain,
    category: safety.category,
    evidenceStatus: safety.evidenceStatus,
    freshness: safety.freshness,
    relevance: safety.relevance,
    presentationClass: safety.presentationClass,
    authorityClass: safety.authorityClass,
    etappenRefs: safety.boundStageIds.map(etappenRef).filter((wert): wert is string => wert !== null),
    conflict: safety.conflict,
    seasonalRejected: safety.seasonalRejected,
  }
}

function seasonalFuerModell(
  seasonal: AssistantSeasonalContext,
  ref: string,
  etappenRef: (stageId: string) => string | null,
) {
  return {
    ref,
    domain: seasonal.domain,
    category: seasonal.category,
    evidenceStatus: seasonal.evidenceStatus,
    freshness: seasonal.freshness,
    relevance: seasonal.relevance,
    presentationClass: seasonal.presentationClass,
    authorityClass: seasonal.authorityClass,
    etappenRefs: seasonal.boundStageIds.map(etappenRef).filter((wert): wert is string => wert !== null),
    conflict: seasonal.conflict,
    acuteRejected: seasonal.acuteRejected,
  }
}

// ---------------------------------------------------------------------------
// Der Zustand, den Jetnity anzeigt – nicht das Modell
// ---------------------------------------------------------------------------

function etappenBezug(stage: AssistantStageContext, ref: string): BegleiterBezug {
  const ort = [ohneLink(stage.name), landText(stage.countryCode)].filter(Boolean).join(', ')
  const zeitraum =
    stage.arrivalDate && stage.departureDate
      ? `${stage.arrivalDate} bis ${stage.departureDate}`
      : (stage.arrivalDate ?? stage.departureDate ?? 'Zeitraum offen')

  return {
    ref,
    art: 'etappe',
    titel: `Etappe ${stage.position}${ort ? ` · ${ort}` : ''}`,
    lage: zeitraum,
    // Der Reisegraph ist Jetnity-Wahrheit, keine geprüfte Aussenwahrheit.
    belegt: true,
  }
}

function reisendenBezug(traveller: AssistantTravellerContext, ref: string): BegleiterBezug {
  const staaten = traveller.citizenships.map((eintrag) => landText(eintrag.countryCode)).filter(Boolean)
  const optionen = traveller.credentialOptions.length

  return {
    ref,
    art: 'reisende',
    titel: ohneLink(traveller.label) ?? `Reisende ${ref}`,
    lage:
      staaten.length === 0
        ? 'Staatsangehörigkeit nicht angegeben'
        : `${staaten.join(' · ')} · ${optionen} ${optionen === 1 ? 'Dokument-Option' : 'Dokument-Optionen'} als gleichrangige Wahl`,
    belegt: true,
  }
}

function officialIstBelegt(official: AssistantOfficialContext): boolean {
  return (
    official.status === 'current' &&
    official.freshness === 'current' &&
    official.result !== 'unknown'
  )
}

function officialBezug(official: AssistantOfficialContext, ref: string): BegleiterBezug {
  const ort = landText(official.transitCountryCode ?? official.destinationCountryCode)
  const titel = [
    officialAnforderungTitel(official.requirementType, official.visaMode),
    official.scope === 'transit' ? 'Transit' : null,
    ort,
  ]
    .filter(Boolean)
    .join(' · ')

  const lage = [
    OFFICIAL_ERGEBNIS_BEZEICHNUNG[official.result],
    officialFreshnessText(official.freshness),
    official.missingFacts.length > 0 ? officialFehlendeAngabenText(official.missingFacts) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return { ref, art: 'official', titel, lage, belegt: officialIstBelegt(official) }
}

function safetyBezug(safety: AssistantSafetyContext, ref: string): BegleiterBezug {
  return {
    ref,
    art: 'safety',
    titel: `${SAFETY_KLASSE_TEXT[safety.presentationClass]} · ${SAFETY_KATEGORIE_TEXT[safety.category]}`,
    lage: `${SAFETY_RELEVANZ_TEXT[safety.relevance]} · ${SAFETY_FRISCHE_TEXT[safety.freshness]}`,
    belegt: safety.freshness === 'current' && safety.evidenceStatus === 'current',
  }
}

function seasonalBezug(seasonal: AssistantSeasonalContext, ref: string): BegleiterBezug {
  return {
    ref,
    art: 'seasonal',
    titel: `${SEASONAL_KLASSE_TEXT[seasonal.presentationClass]} · ${SEASONAL_KATEGORIE_TEXT[seasonal.category]}`,
    lage: `${SEASONAL_RELEVANZ_TEXT[seasonal.relevance]} · ${SEASONAL_FRISCHE_TEXT[seasonal.freshness]}`,
    belegt: seasonal.freshness === 'current' && seasonal.evidenceStatus === 'current',
  }
}

// ---------------------------------------------------------------------------
// Die Reissleine
// ---------------------------------------------------------------------------

/**
 * Feldnamen, die in einer Assistant-Nutzlast nie vorkommen dürfen.
 *
 * Verglichen wird auf dem Feldnamen ohne Trennzeichen und in Kleinschreibung,
 * als Teilstring: `document_number`, `documentNumber` und `DocumentNumber`
 * treffen alle dieselbe Zeile.
 */
const VERBOTENE_FELDER = [
  'passnummer',
  'passportnumber',
  'documentnumber',
  'dokumentnummer',
  'mrz',
  'scan',
  'biometr',
  'health',
  'gesundheit',
  'email',
  'session',
  'token',
  'secret',
  'apikey',
  'password',
  'passwort',
  'bookingurl',
  'sourceurl',
  'href',
  'fingerprint',
  'price',
  'preis',
  'currency',
  'waehrung',
  'userid',
  'accountid',
  'iban',
  'creditcard',
] as const

/**
 * Wertmuster, die in einer Assistant-Nutzlast nie vorkommen dürfen.
 *
 * Die lange Ziffernfolge ist der Ersatz für „Dokumentnummer“: Ein Datum trägt
 * Trenner, eine Position ist kurz, und neun zusammenhängende Ziffern hat in
 * dieser Projektion nichts Legitimes.
 */
const VERBOTENE_WERTE: ReadonlyArray<{ name: string; muster: RegExp }> = [
  { name: 'link', muster: /https?:\/\/|\bwww\./i },
  { name: 'daten-uri', muster: /^data:/i },
  { name: 'e-mail', muster: /[^\s@]+@[^\s@]+\.[^\s@]+/ },
  { name: 'json-web-token', muster: /^ey[A-Za-z0-9_-]{10,}\./ },
  { name: 'mrz', muster: /[A-Z0-9<]{25,}/ },
  { name: 'lange-ziffernfolge', muster: /\d{9,}/ },
]

function feldnameNormalisiert(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Der erste verbotene Feldname oder Wert in einem Objektbaum – oder `null`.
 *
 * Der zurückgegebene Pfad ist für das Protokoll und für Tests. Er enthält
 * Feldnamen und Indizes, aber keinen Wert: Was verboten ist, wird nicht
 * mitzitiert.
 */
export function verbotenesFeldFinden(wert: unknown, pfad = ''): string | null {
  if (Array.isArray(wert)) {
    for (const [stelle, eintrag] of wert.entries()) {
      const treffer = verbotenesFeldFinden(eintrag, `${pfad}[${stelle}]`)
      if (treffer) return treffer
    }
    return null
  }

  if (wert && typeof wert === 'object') {
    for (const [name, inhalt] of Object.entries(wert as Record<string, unknown>)) {
      const normalisiert = feldnameNormalisiert(name)
      const verboten = VERBOTENE_FELDER.find((eintrag) => normalisiert.includes(eintrag))
      if (verboten) return `${pfad}.${name} (Feldname ${verboten})`

      const treffer = verbotenesFeldFinden(inhalt, `${pfad}.${name}`)
      if (treffer) return treffer
    }
    return null
  }

  if (typeof wert === 'string') {
    const verboten = VERBOTENE_WERTE.find((eintrag) => eintrag.muster.test(wert))
    if (verboten) return `${pfad} (Wertmuster ${verboten.name})`
  }

  return null
}

// ---------------------------------------------------------------------------
// Eintritt
// ---------------------------------------------------------------------------

/**
 * Formt die Modellnutzlast aus der akzeptierten Projektion.
 *
 * Schlägt fehl, wenn die Reissleine anspringt. Das ist kein Laufzeitfehler,
 * sondern die vorgesehene Antwort: Ein Aufruf kommt dann nicht zustande.
 */
export function begleiternutzlastAus(kontext: AssistantTruthContext): Nutzlastergebnis {
  const etappenRefs = new Map<string, string>()
  kontext.stages.forEach((stage, stelle) => etappenRefs.set(stage.stageId, `E${stelle + 1}`))

  const reisendenRefs = new Map<string, string>()
  kontext.travellers.forEach((traveller, stelle) =>
    reisendenRefs.set(traveller.travellerClientRef, `R${stelle + 1}`),
  )

  const etappenRef = (stageId: string) => etappenRefs.get(stageId) ?? null
  const reisendeRef = (clientRef: string | null) =>
    clientRef === null ? null : (reisendenRefs.get(clientRef) ?? null)

  const inhalt = {
    kontextFassung: kontext.version,
    wahrheitsklassen: {
      etappen: 'trip',
      reisende: 'trip',
      official: 'official',
      safety: 'official',
      seasonal: 'official',
    },
    reise: { startDate: kontext.trip.startDate, endDate: kontext.trip.endDate },
    route: {
      vorhanden: kontext.route.vorhanden,
      quelle: kontext.route.quelle,
      destinationCountryCodes: [...kontext.route.destinationCountryCodes],
      transitCountryCodes: [...kontext.route.transitCountryCodes],
    },
    etappen: kontext.stages.map((stage) =>
      etappeFuerModell(stage, etappenRefs.get(stage.stageId) as string),
    ),
    reisende: kontext.travellers.map((traveller) =>
      reisendeFuerModell(traveller, reisendenRefs.get(traveller.travellerClientRef) as string),
    ),
    official: kontext.official.map((official, stelle) =>
      officialFuerModell(official, `O${stelle + 1}`, reisendeRef, etappenRef),
    ),
    safety: kontext.safety.map((safety, stelle) =>
      safetyFuerModell(safety, `S${stelle + 1}`, etappenRef),
    ),
    seasonal: kontext.seasonal.map((seasonal, stelle) =>
      seasonalFuerModell(seasonal, `Z${stelle + 1}`, etappenRef),
    ),
  }

  const verboten = verbotenesFeldFinden(inhalt)
  if (verboten) return { ok: false, feld: verboten }

  const bezuege: BegleiterBezug[] = [
    ...kontext.stages.map((stage) => etappenBezug(stage, etappenRefs.get(stage.stageId) as string)),
    ...kontext.travellers.map((traveller) =>
      reisendenBezug(traveller, reisendenRefs.get(traveller.travellerClientRef) as string),
    ),
    ...kontext.official.map((official, stelle) => officialBezug(official, `O${stelle + 1}`)),
    ...kontext.safety.map((safety, stelle) => safetyBezug(safety, `S${stelle + 1}`)),
    ...kontext.seasonal.map((seasonal, stelle) => seasonalBezug(seasonal, `Z${stelle + 1}`)),
  ]

  return { ok: true, nutzlast: { kontext: JSON.stringify(inhalt), bezuege } }
}
