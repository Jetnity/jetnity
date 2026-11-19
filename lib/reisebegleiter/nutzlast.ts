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
import {
  angeboteneBefunde,
  befundEintrag,
  type Befundangebot,
} from '@/lib/reisebegleiter/befunde'
import { traegtLink } from '@/lib/reisebegleiter/schema'

export type BegleiterBezugArt = 'etappe' | 'reisende' | 'official' | 'safety' | 'seasonal'

/**
 * Ein Eintrag, auf den das Modell zeigen darf – mit dem Zustand, den Jetnity
 * ihm gibt.
 *
 * `belegt` ist bewusst eng: Nur eine Lage, die aus einer aktuellen, erreichbaren
 * Quelle stammt, gilt als belegt. `unknown`, `unavailable`, `stale`,
 * `recheck_needed` und `never_checked` sind es nicht – und dürfen es auch dann
 * nicht werden, wenn eine Auskunft selbstsicher klingt.
 */
/**
 * Die maschinenlesbare Identität einer amtlichen Anforderung.
 *
 * Sie kommt unverändert aus der akzeptierten Projektion und wird **nicht** aus
 * dem Anzeigetext zurückgelesen: `titel` ist lokalisierte Copy, und eine
 * Textänderung darf keine Wahrheitsentscheidung verschieben.
 *
 * `lib/reisebegleiter/pruefung.ts` braucht sie, um eine Gewissheit an die
 * Anforderung zu binden, über die sie spricht. Ohne sie liesse sich „kein
 * Visum erforderlich" durch eine aktuelle Impfanforderung stützen.
 */
export type OfficialAnforderung = {
  requirementType: AssistantOfficialContext['requirementType']
  scope: AssistantOfficialContext['scope']
  visaMode: AssistantOfficialContext['visaMode']
  /** Das Ergebnis der Prüfung. Bindet die `geprueft_*`-Aussagen. */
  ergebnis: AssistantOfficialContext['result']
  /** Die Aktualität. Bindet `quelle_nicht_erreichbar` und `erneut_pruefen`. */
  frische: AssistantOfficialContext['freshness']
  /** Ob der Prüfung Angaben fehlen. Bindet `angaben_fehlen`. */
  fehlendeAngaben: boolean
}

export type BegleiterBezug = {
  ref: string
  art: BegleiterBezugArt
  titel: string
  lage: string
  belegt: boolean
  /** Nur bei `art === 'official'` gesetzt, sonst `null`. */
  anforderung: OfficialAnforderung | null
}

export type Begleiternutzlast = {
  /** Was in die Systemregeln geht. Reines JSON, ohne Nutzertext. */
  kontext: string
  bezuege: BegleiterBezug[]
  /**
   * Die Jetnity-Aussagen, die auf diese Reise zutreffen.
   *
   * Dieselbe Liste steht im `kontext` für das Modell und dient in
   * `lib/reisebegleiter/pruefung.ts` als Prüfmenge für seine Auswahl.
   */
  angebot: Befundangebot[]
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

function reisendeFuerModell(
  traveller: AssistantTravellerContext,
  ref: string,
  kennungen: ReadonlyMap<string, string>,
) {
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
      // Kurze Kennung statt der internen Optionsreferenz. Dieselbe Kennung
      // steht in den Official-Zeilen. Sie trägt keine eigene Wahrheit.
      kennung: kennungen.get(option.optionRef) ?? null,
      citizenshipCountryCodes: [...option.citizenshipCountryCodes],
      issuingCountryCode: option.issuingCountryCode,
      expiresOn: option.expiresOn,
    })),
  }
}

/**
 * Spalten einer Official-Zeile. `stand` der Gruppe trägt den Prüfstand,
 * die Zeile nur, welche Lage es ist.
 */
const OFFICIAL_ZEILEN_FELDER = [
  'ref',
  'typ',
  'reisende',
  'option',
  'ziel',
  'transit',
  'etappen',
] as const

function refNummer(ref: string): number {
  const zahl = /\d+$/.exec(ref)
  return zahl ? Number(zahl[0]) : 0
}

/**
 * Stabile Kurzkennungen für Dokument-Optionen, in Projektionsreihenfolge.
 *
 * Die interne `optionRef` bleibt in der Projektion und wird hier nicht
 * wiederholt: Staatsangehörigkeiten, Ausstellungsland und Ablaufdatum stehen
 * an der Option selbst.
 */
function optionKennungen(kontext: AssistantTruthContext): Map<string, string> {
  const kennungen = new Map<string, string>()
  let nummer = 0
  for (const traveller of kontext.travellers) {
    for (const option of traveller.credentialOptions) {
      if (kennungen.has(option.optionRef)) continue
      nummer += 1
      kennungen.set(option.optionRef, `K${nummer}`)
    }
  }
  return kennungen
}

type OfficialStand = {
  scope: AssistantOfficialContext['scope']
  result: AssistantOfficialContext['result']
  status: AssistantOfficialContext['status']
  freshness: AssistantOfficialContext['freshness']
  officialClass: AssistantOfficialContext['officialClass']
  visaMode?: NonNullable<AssistantOfficialContext['visaMode']>
  optionEligibility?: NonNullable<AssistantOfficialContext['optionEligibility']>
  optionMandate?: NonNullable<AssistantOfficialContext['optionMandate']>
  missingFacts?: AssistantOfficialContext['missingFacts']
  checkedAt?: string
  validFrom?: string
  validUntil?: string
  authority?: string
  ruleReference?: string
  temporalRule?: NonNullable<AssistantOfficialContext['temporalRule']>
}

/**
 * Der Prüfstand, einmal je unterscheidbarer Lage.
 *
 * Fehlende optionale Felder sind in der Projektion `null` oder leer. Sie
 * wegzulassen ändert den Stand nicht: die Regeln lesen Abwesenheit als null
 * und als „keine fehlenden Angaben“. Gesetzte Werte bleiben wörtlich.
 */
function officialStand(official: AssistantOfficialContext): OfficialStand {
  const authority = ohneLink(official.authority)
  const ruleReference = ohneLink(official.ruleReference)
  return {
    scope: official.scope,
    result: official.result,
    status: official.status,
    freshness: official.freshness,
    officialClass: official.officialClass,
    ...(official.visaMode ? { visaMode: official.visaMode } : {}),
    ...(official.optionEligibility ? { optionEligibility: official.optionEligibility } : {}),
    ...(official.optionMandate ? { optionMandate: official.optionMandate } : {}),
    ...(official.missingFacts.length > 0 ? { missingFacts: [...official.missingFacts] } : {}),
    ...(official.checkedAt ? { checkedAt: official.checkedAt } : {}),
    ...(official.validFrom ? { validFrom: official.validFrom } : {}),
    ...(official.validUntil ? { validUntil: official.validUntil } : {}),
    ...(authority ? { authority } : {}),
    ...(ruleReference ? { ruleReference } : {}),
    ...(official.temporalRule ? { temporalRule: official.temporalRule } : {}),
  }
}

type OfficialZeile = [
  string,
  AssistantOfficialContext['requirementType'],
  string | null,
  string | null,
  string | null,
  string | null,
  string[],
]

/**
 * Alle Official-Lagen, nach gleichem Prüfstand gruppiert.
 *
 * Jede Lage bleibt eine eigene Zeile mit eigener `ref`. Die Gruppe spart nur
 * den Prüfstand, der sich sonst auf jeder Zeile wiederholt. Keine Zeile, kein
 * Anforderungstyp und keine Dokument-Option fällt weg.
 */
function officialFuerModell(
  kontext: AssistantTruthContext,
  kennungen: ReadonlyMap<string, string>,
  reisendenRefs: ReadonlyMap<string, string>,
  etappenRefs: ReadonlyMap<string, string>,
) {
  const gruppen = new Map<string, { stand: OfficialStand; zeilen: OfficialZeile[] }>()

  kontext.official.forEach((official, stelle) => {
    const ref = `O${stelle + 1}`
    const stand = officialStand(official)
    const schluessel = JSON.stringify(stand)
    let gruppe = gruppen.get(schluessel)
    if (!gruppe) {
      gruppe = { stand, zeilen: [] }
      gruppen.set(schluessel, gruppe)
    }
    const reisende =
      official.travellerClientRef === null
        ? null
        : (reisendenRefs.get(official.travellerClientRef) ?? null)
    const option =
      official.credentialOptionRef === null
        ? null
        : (kennungen.get(official.credentialOptionRef) ?? null)
    gruppe.zeilen.push([
      ref,
      official.requirementType,
      reisende,
      option,
      official.destinationCountryCode,
      official.transitCountryCode,
      official.boundStageIds
        .map((stageId) => etappenRefs.get(stageId) ?? null)
        .filter((wert): wert is string => wert !== null),
    ])
  })

  const liste = [...gruppen.values()]
  for (const gruppe of liste) {
    gruppe.zeilen.sort((links, rechts) => refNummer(links[0]) - refNummer(rechts[0]))
  }
  liste.sort((links, rechts) => refNummer(links.zeilen[0][0]) - refNummer(rechts.zeilen[0][0]))

  return { felder: OFFICIAL_ZEILEN_FELDER, gruppen: liste }
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
    anforderung: null,
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
    anforderung: null,
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

  return {
    ref,
    art: 'official',
    titel,
    lage,
    belegt: officialIstBelegt(official),
    anforderung: {
      requirementType: official.requirementType,
      scope: official.scope,
      visaMode: official.visaMode,
      ergebnis: official.result,
      frische: official.freshness,
      fehlendeAngaben: official.missingFacts.length > 0,
    },
  }
}

function safetyBezug(safety: AssistantSafetyContext, ref: string): BegleiterBezug {
  return {
    ref,
    art: 'safety',
    titel: `${SAFETY_KLASSE_TEXT[safety.presentationClass]} · ${SAFETY_KATEGORIE_TEXT[safety.category]}`,
    lage: `${SAFETY_RELEVANZ_TEXT[safety.relevance]} · ${SAFETY_FRISCHE_TEXT[safety.freshness]}`,
    belegt: safety.freshness === 'current' && safety.evidenceStatus === 'current',
    anforderung: null,
  }
}

function seasonalBezug(seasonal: AssistantSeasonalContext, ref: string): BegleiterBezug {
  return {
    ref,
    art: 'seasonal',
    titel: `${SEASONAL_KLASSE_TEXT[seasonal.presentationClass]} · ${SEASONAL_KATEGORIE_TEXT[seasonal.category]}`,
    lage: `${SEASONAL_RELEVANZ_TEXT[seasonal.relevance]} · ${SEASONAL_FRISCHE_TEXT[seasonal.freshness]}`,
    belegt: seasonal.freshness === 'current' && seasonal.evidenceStatus === 'current',
    anforderung: null,
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
  // Das Angebot: die Jetnity-Aussagen, die auf diese Reise zutreffen. Das
  // Modell sieht genau diese Liste und darf nur daraus wählen – deshalb steht
  // sie in der Nutzlast und nicht nur in der Prüfung.
  const angebot = angeboteneBefunde(kontext)
  const etappenRefs = new Map<string, string>()
  kontext.stages.forEach((stage, stelle) => etappenRefs.set(stage.stageId, `E${stelle + 1}`))

  const reisendenRefs = new Map<string, string>()
  kontext.travellers.forEach((traveller, stelle) =>
    reisendenRefs.set(traveller.travellerClientRef, `R${stelle + 1}`),
  )

  const kennungen = optionKennungen(kontext)
  const etappenRef = (stageId: string) => etappenRefs.get(stageId) ?? null

  const inhalt = {
    kontextFassung: kontext.version,
    angebot: angebot.map((eintrag) => ({
      schluessel: eintrag.schluessel,
      ref: eintrag.ref,
      text: befundEintrag(eintrag.schluessel).text,
      rolle: befundEintrag(eintrag.schluessel).rolle,
    })),
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
      reisendeFuerModell(
        traveller,
        reisendenRefs.get(traveller.travellerClientRef) as string,
        kennungen,
      ),
    ),
    official: officialFuerModell(kontext, kennungen, reisendenRefs, etappenRefs),
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

  return { ok: true, nutzlast: { kontext: JSON.stringify(inhalt), bezuege, angebot } }
}
