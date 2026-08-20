// lib/trips/gastspeicher.ts
//
// Die Reise eines Gastes – im Browser, nicht auf dem Server.
//
// Ein Gast hat serverseitig bewusst keine Identität (ADR-0042). Seine Reise
// liegt deshalb im `localStorage`, und diese Datei ist die einzige Stelle, die
// ihn anfasst.
//
// ---------------------------------------------------------------------------
// Genau eine aktive Gastreise
// ---------------------------------------------------------------------------
//
// Die Produktregel lautet: ohne Konto eine Reise, mehrere Reisen mit Konto.
// Bis Phase 1.5 lagen bis zu zwanzig Entwürfe unter einem Schlüssel – die Regel
// existierte, nur nicht im Code. Sie steht jetzt in `gastreiseAnlegen()` und
// scheitert dort mit einer Meldung, die den Weg nennt, statt still den
// einundzwanzigsten Entwurf zu verwerfen.
//
// ---------------------------------------------------------------------------
// Was mit den alten Entwürfen passiert
// ---------------------------------------------------------------------------
//
// Wer die Anwendung vor dieser Phase benutzt hat, kann mehrere Entwürfe unter
// `jetnity:guest-trips:v2` haben. Sie zu verwerfen wäre der bequeme Weg und
// eine stille Datenlöschung. Sie alle als aktiv zu führen widerspräche der
// Regel. Deshalb:
//
//   · der zuletzt geänderte Entwurf wird die aktive Gastreise,
//   · die übrigen wandern in eine Warteschlange. Sie sind nicht bearbeitbar
//     und werden mit dem nächsten Login vollständig ins Konto übernommen.
//
// Der alte Schlüssel wird erst gelöscht, wenn der neue **bestätigt** geschrieben
// ist. Bricht der Vorgang dazwischen ab, läuft er beim nächsten Laden erneut.
//
// ---------------------------------------------------------------------------
// Kein Erfolg ohne bestätigte Ablage
// ---------------------------------------------------------------------------
//
// Der `localStorage` kann voll, gesperrt oder – im privaten Modus mancher
// Browser – stumm sein: `setItem` wirft dann nicht, behält aber auch nichts.
// Bis zum Nachtrag dieser Phase verschluckte diese Datei jeden Schreibfehler.
// Die Oberfläche meldete danach Erfolg und navigierte weiter, während im
// Browser nichts lag – und beim nächsten Laden war die Reise „verschwunden“.
//
// Für eine Reise, die es nur hier gibt, ist das die falsche Reihenfolge.
// Deshalb gilt jetzt:
//
//   · Jeder Schreibvorgang wird zurückgelesen. Erst was wieder herauskommt,
//     gilt als abgelegt (`schreibenVersuch`).
//   · Ein fehlgeschlagener Schreibvorgang wirft `SpeicherFehler`. Die
//     Oberfläche zeigt den Fehler statt eines gespeicherten Zustands.
//   · Gelöscht wird nur, was nachweislich anderswo liegt: der alte Schlüssel
//     erst nach bestätigtem Schreiben der neuen Ablage, ein übernommener
//     Entwurf erst nach der Kennung aus dem Konto.

import { operationenAnwenden } from '@/lib/reiseaenderung/anwenden'
import type { Modelloperation } from '@/lib/reiseaenderung/schema'
import { interesseLesen, tempoLesen } from '@/lib/trips/bezeichnungen'
import {
  activityReisegraphMitTimeslotPruefen,
} from '@/lib/activities/reisegraph'
import type { ActivityMomentaufnahme } from '@/lib/activities/uebernahme'
import { activityMomentaufnahmeAlsPunkt } from '@/lib/activities/uebernahme'
import type { FlugMomentaufnahme } from '@/lib/flights/uebernahme'
import { momentaufnahmeAlsPunkt } from '@/lib/flights/uebernahme'
import { hotelReisegraphPruefen } from '@/lib/hotels/reisegraph'
import type { HotelMomentaufnahme } from '@/lib/hotels/uebernahme'
import { hotelMomentaufnahmeAlsPunkt } from '@/lib/hotels/uebernahme'
import { reiseLesen, type PlanpunktFormular } from '@/lib/trips/schema'
import { reisetageBauen } from '@/lib/trips/tage'
import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import type { Ort } from '@/lib/places/domain'
import { reiseMitKanonischenOrten, type KanonischeOrte } from '@/lib/places/kanon'
import type { CreateTripInput, Trip, TripDay, TripItem } from '@/types/trips'

/** Die aktive Gastreise. Höchstens eine. */
const SCHLUESSEL_AKTIV = 'jetnity:reise:v3'

/**
 * Reisen, die auf ein Konto warten.
 *
 * Wird ausschliesslich von der Übernahme der Fassung v2 gefüllt. Im laufenden
 * Betrieb bleibt sie leer: Ein Gast legt keine zweite Reise an.
 */
const SCHLUESSEL_WARTESCHLANGE = 'jetnity:reisen-warteschlange:v3'

/** Der Schlüssel der Fassung bis Phase 1.5. */
const SCHLUESSEL_LEGACY = 'jetnity:guest-trips:v2'

/** Obergrenze der Warteschlange – dieselbe wie die alte Obergrenze der Liste. */
const WARTESCHLANGE_MAXIMUM = 20

/**
 * Wird geworfen, wenn der Browserspeicher die Reise nicht behalten hat.
 *
 * Der Fall ist selten und teuer: Ohne Konto ist der `localStorage` der einzige
 * Ort, an dem die Reise existiert. Eine Ausnahme mitten in einer Eingabe ist
 * unangenehm – ein „gespeichert“, das nicht stimmt, ist schlimmer.
 */
export class SpeicherFehler extends Error {
  constructor() {
    super(
      'Diese Reise konnte auf diesem Gerät nicht gespeichert werden. Der Browserspeicher ist voll ' +
        'oder gesperrt. Mit einem Konto liegt deine Reise auf dem Server.',
    )
    this.name = 'SpeicherFehler'
  }
}

/** Wird geworfen, wenn schon eine Gastreise besteht. */
export class GastreiseBestehtFehler extends Error {
  readonly bestehendeId: string

  constructor(bestehendeId: string) {
    super(
      'Ohne Konto lässt sich eine Reise planen. Öffne deinen bestehenden Entwurf oder erstelle ein ' +
        'Konto, um mehrere Reisen zu speichern.',
    )
    this.name = 'GastreiseBestehtFehler'
    this.bestehendeId = bestehendeId
  }
}

/**
 * Die Gastreise im Speicher ist eine neuere Fassung als der Vorschlag.
 *
 * Dieselbe Meldung wie bei einer veralteten `trips.revision` im Konto. Die
 * Oberfläche soll die Vorschau nicht still überschreiben.
 */
export class VeralteteFassungFehler extends Error {
  constructor() {
    super(
      'Diese Reise hat sich inzwischen geändert. Bitte verwirf die Vorschau und formuliere den Wunsch erneut.',
    )
    this.name = 'VeralteteFassungFehler'
  }
}

export type Gastspeicher = {
  /** Die eine Reise, die ein Gast bearbeiten darf. */
  aktiv: Trip | null
  /** Reisen aus der Fassung v2, die auf ein Konto warten. */
  warteschlange: Trip[]
}

function verfuegbar(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Eine lokale Kennung, etwa `trip-8f2c…`.
 *
 * Das Präfix hält die Kennung einer Gastreise von einer UUID der Datenbank
 * unterscheidbar: `/reisen/[tripId]` entscheidet daran, ob es im Konto oder im
 * Browser nachsieht (`lib/trips/daten.ts`, `istKontoKennung`).
 *
 * Exportiert, weil das Formular unter /planen die Kennung schon braucht, bevor
 * klar ist, ob die Reise im Browser oder im Konto entsteht.
 */
export function kennungErzeugen(prefix: string): string {
  const zufall =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${prefix}-${zufall}`
}

function rohLesen(schluessel: string): unknown {
  try {
    const roh = window.localStorage.getItem(schluessel)
    return roh ? (JSON.parse(roh) as unknown) : null
  } catch {
    // Ein unlesbarer Eintrag ist kein Grund, die Seite abzubrechen.
    return null
  }
}

/**
 * Schreibt und liest zurück. Liefert, ob der Wert wirklich abgelegt wurde.
 *
 * Das Zurücklesen ist kein Misstrauen gegen `setItem`, sondern gegen die
 * Browser, in denen es nichts tut: Im privaten Modus mancher Fassungen nimmt
 * der Speicher den Wert an und liefert danach `null`. Ein `try/catch` allein
 * würde diesen Fall als Erfolg zählen.
 */
function schreibenVersuch(schluessel: string, wert: unknown): boolean {
  try {
    if (wert === null) {
      window.localStorage.removeItem(schluessel)
      return window.localStorage.getItem(schluessel) === null
    }

    const roh = JSON.stringify(wert)
    window.localStorage.setItem(schluessel, roh)
    return window.localStorage.getItem(schluessel) === roh
  } catch {
    // Voller oder gesperrter Speicher.
    return false
  }
}

/** Wie `schreibenVersuch`, aber ein Fehlschlag ist ein Fehler. */
function schreibenMuss(schluessel: string, wert: unknown) {
  if (!schreibenVersuch(schluessel, wert)) throw new SpeicherFehler()
}

// ---------------------------------------------------------------------------
// Übernahme der Fassung v2
// ---------------------------------------------------------------------------

type LegacyPunkt = { title?: unknown; note?: unknown; time?: unknown }
type LegacyTag = { date?: unknown; items?: unknown }

/** Formt einen Entwurf der Fassung v2 in das Modell dieser Phase. */
function ausLegacy(wert: unknown): Trip | null {
  if (!wert || typeof wert !== 'object') return null
  const alt = wert as Record<string, unknown>

  const id = typeof alt.id === 'string' && alt.id ? alt.id.slice(0, 64) : kennungErzeugen('trip')
  const jetzt = new Date().toISOString()

  const tage: TripDay[] = Array.isArray(alt.days)
    ? alt.days.map((rohTag, index) => {
        const tag = (rohTag ?? {}) as LegacyTag
        const punkte = Array.isArray(tag.items) ? tag.items : []

        return {
          id: kennungErzeugen('day'),
          stageId: null,
          dayIndex: index + 1,
          dayDate: typeof tag.date === 'string' ? tag.date : null,
          title: null,
          items: punkte.map((rohPunkt, stelle) => {
            const punkt = (rohPunkt ?? {}) as LegacyPunkt
            return {
              id: kennungErzeugen('item'),
              dayId: null,
              stageId: null,
              // Die Fassung v2 kannte keine Arten. Alles darin war ein
              // freier Eintrag, und `note` ist genau das.
              kind: 'note' as const,
              title: typeof punkt.title === 'string' ? punkt.title : '',
              note: typeof punkt.note === 'string' ? punkt.note : null,
              position: stelle + 1,
              startsOn: null,
              startsAt: typeof punkt.time === 'string' ? punkt.time : null,
              endsOn: null,
              endsAt: null,
              priceAmount: null,
              priceCurrency: null,
              provider: null,
              externalRef: null,
              bookingUrl: null,
            } satisfies TripItem
          }),
        }
      })
    : []

  // `destination` war ein einzelnes Feld. Im neuen Modell ist ein Ziel eine
  // Etappe – so bleibt die Angabe erhalten und ist gleichzeitig erweiterbar.
  const ziel = typeof alt.destination === 'string' ? alt.destination.trim() : ''

  const entwurf = {
    id,
    clientRef: id,
    title: typeof alt.title === 'string' ? alt.title : ziel,
    origin: typeof alt.origin === 'string' ? alt.origin : null,
    startDate: typeof alt.startDate === 'string' ? alt.startDate : null,
    endDate: typeof alt.endDate === 'string' ? alt.endDate : null,
    travellers: typeof alt.travelers === 'number' ? alt.travelers : 1,
    currency: 'CHF',
    budgetAmount: typeof alt.budget === 'number' ? alt.budget : null,
    status: 'draft' as const,
    pace: tempoLesen(alt.pace) ?? 'balanced',
    interests: Array.isArray(alt.interests)
      ? alt.interests.map(interesseLesen).filter((eintrag) => eintrag !== null)
      : [],
    travelWish: typeof alt.travelWish === 'string' ? alt.travelWish : null,
    revision: 1,
    lastMutationId: null,
    stages: ziel ? [einzelneEtappe(ziel)] : [],
    days: tage,
    ohneTag: [],
    createdAt: typeof alt.createdAt === 'string' ? alt.createdAt : jetzt,
    updatedAt: typeof alt.updatedAt === 'string' ? alt.updatedAt : jetzt,
  }

  // Auch der geformte Entwurf läuft durch das Schema: Ein Feld, das die alte
  // Fassung nie geprüft hat – etwa ein Titel mit 400 Zeichen –, würde sonst erst
  // bei der Übernahme auffallen.
  return reiseLesen(entwurf)
}

function einzelneEtappe(
  name: string,
  arrivalDate: string | null = null,
  departureDate: string | null = null,
  extra?: {
    countryCode?: string | null
    latitude?: number | null
    longitude?: number | null
    placeId?: string | null
  },
) {
  return {
    id: kennungErzeugen('stage'),
    position: 1,
    name,
    countryCode: extra?.countryCode ?? null,
    arrivalDate,
    departureDate,
    latitude: extra?.latitude ?? null,
    longitude: extra?.longitude ?? null,
    placeId: extra?.placeId ?? null,
  }
}

/**
 * Holt die Entwürfe der Fassung v2 herüber, falls es welche gibt.
 *
 * Läuft genau einmal – aber nur, wenn sie gelingt. Der alte Schlüssel fällt
 * ausschliesslich dann weg, wenn beide neuen Schlüssel bestätigt geschrieben
 * sind. Gelingt das nicht, bleibt alles liegen und der Vorgang läuft beim
 * nächsten Laden erneut; die Entwürfe dieses Laufs sind trotzdem sichtbar, sie
 * kommen aus dem Speicher des Fensters.
 *
 * Ein unbrauchbarer alter Eintrag wird nicht mehr weggeräumt: Es gäbe nichts,
 * wohin er geschrieben wäre, und ein Löschen ohne Ziel ist genau der Vorgang,
 * den diese Datei nicht mehr macht. Er kostet je Laden ein `JSON.parse`.
 */
function legacyUebernehmen(): Gastspeicher | null {
  const roh = rohLesen(SCHLUESSEL_LEGACY)
  if (!Array.isArray(roh)) return null

  const entwuerfe = roh
    .map(ausLegacy)
    .filter((entwurf): entwurf is Trip => entwurf !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  if (entwuerfe.length === 0) return null

  const [neuester, ...uebrige] = entwuerfe
  const bereitsAktiv = reiseLesen(rohLesen(SCHLUESSEL_AKTIV))

  // Steht schon eine Reise unter dem neuen Schlüssel, gewinnt sie: Sie ist in
  // dieser Fassung entstanden und wird gerade bearbeitet.
  const aktiv = bereitsAktiv ?? neuester

  // Die Warteschlange darf die aktive Reise nicht doppelt führen. Ohne diesen
  // Abgleich stünde ein Entwurf zweimal im Speicher, sobald ein Lauf zwischen
  // den beiden Schlüsseln abbricht und der nächste ihn erneut einreiht.
  const aktivRef = kennungVon(aktiv)
  const gesehen = new Set<string>([aktivRef])
  const warteschlange = [...bestandWarteschlange(), ...(bereitsAktiv ? entwuerfe : uebrige)]
    .filter((eintrag) => {
      const ref = kennungVon(eintrag)
      if (gesehen.has(ref)) return false
      gesehen.add(ref)
      return true
    })
    .slice(0, WARTESCHLANGE_MAXIMUM)

  const abgelegt =
    schreibenVersuch(SCHLUESSEL_AKTIV, aktiv) &&
    schreibenVersuch(SCHLUESSEL_WARTESCHLANGE, warteschlange.length ? warteschlange : null)

  // Nur jetzt. Ein `removeItem`, das nach einem gescheiterten `setItem` gelingt,
  // wäre die eine Stelle in dieser Anwendung, an der Reisedaten wirklich
  // verloren gehen.
  if (abgelegt) schreibenVersuch(SCHLUESSEL_LEGACY, null)

  return {
    aktiv: mitZuordnung(aktiv),
    warteschlange: warteschlange.map((reise) => mitZuordnung(reise)).filter((reise): reise is Trip => reise !== null),
  }
}

function mitZuordnung(reise: Trip | null): Trip | null {
  return reise ? tageEtappenZuordnen(reise) : null
}

/** Die Kennung, unter der eine Reise im Konto ankommt. */
function kennungVon(reise: Trip): string {
  return reise.clientRef ?? reise.id
}

function bestandWarteschlange(): Trip[] {
  const roh = rohLesen(SCHLUESSEL_WARTESCHLANGE)
  if (!Array.isArray(roh)) return []
  return roh
    .map((eintrag) => mitZuordnung(reiseLesen(eintrag)))
    .filter((eintrag): eintrag is Trip => eintrag !== null)
    .slice(0, WARTESCHLANGE_MAXIMUM)
}

// ---------------------------------------------------------------------------
// Lesen und Schreiben
// ---------------------------------------------------------------------------

/** Der gesamte Gastspeicher. Führt bei Bedarf die Übernahme aus v2 aus. */
export function gastspeicherLaden(): Gastspeicher {
  if (!verfuegbar()) return { aktiv: null, warteschlange: [] }

  const uebernommen = legacyUebernehmen()
  if (uebernommen) return uebernommen

  return {
    aktiv: mitZuordnung(reiseLesen(rohLesen(SCHLUESSEL_AKTIV))),
    warteschlange: bestandWarteschlange(),
  }
}

/** Die aktive Gastreise, oder `null`. */
function gastreiseLaden(): Trip | null {
  return gastspeicherLaden().aktiv
}

/** Die aktive Gastreise, wenn ihre Kennung passt. Sonst `null`. */
export function gastreiseLadenNach(id: string): Trip | null {
  const aktiv = gastreiseLaden()
  return aktiv && aktiv.id === id ? aktiv : null
}

/**
 * Schreibt die aktive Gastreise zurück und zieht `updatedAt` nach.
 *
 * Wirft, wenn nichts abgelegt werden konnte. Der Aufrufer darf die Rückgabe
 * deshalb als gespeicherten Stand behandeln – und nur sie.
 */
export function gastreiseSpeichern(reise: Trip): Trip {
  if (!verfuegbar()) throw new SpeicherFehler()

  // Auch der eigene Schreibweg läuft durch das Schema. Wäre in der Oberfläche
  // ein Feld über seine Grenze gewachsen, fiele es hier auf und nicht erst
  // beim Login.
  const geprueft = reiseLesen({ ...reise, updatedAt: new Date().toISOString() })
  if (!geprueft) {
    throw new Error('Diese Änderung ergibt keine gültige Reise und wurde nicht gespeichert.')
  }

  schreibenMuss(SCHLUESSEL_AKTIV, geprueft)
  return geprueft
}

/**
 * Übernimmt eine bestätigte Sprachänderung in den Gastspeicher.
 *
 * Derselbe fachliche Ablauf wie `public.reise_aendern()`: aktuelle Fassung
 * laden, dieselbe Mutation idempotent zurückgeben, eine veraltete Basis
 * ablehnen, Operationen erneut anwenden, Revision erhöhen. Ungeplante
 * Planpunkte bleiben ungeplant – Konto und Gast teilen denselben Graphen.
 */
export function gastreiseAendern(eingabe: {
  mutationId: string
  basisRevision: number
  operationen: Modelloperation[]
  orte?: KanonischeOrte
}): Trip {
  if (!verfuegbar()) throw new SpeicherFehler()

  const aktuell = gastreiseLaden()
  if (!aktuell) {
    throw new Error('Diese Reise ist auf diesem Gerät nicht mehr vorhanden.')
  }

  if (aktuell.lastMutationId === eingabe.mutationId) return aktuell
  if (aktuell.revision !== eingabe.basisRevision) throw new VeralteteFassungFehler()

  const angewandt = operationenAnwenden(aktuell, eingabe.operationen, kennungErzeugen)
  if (!angewandt.ok) throw new Error(angewandt.fehler.meldung)
  const graph = eingabe.orte
    ? reiseMitKanonischenOrten(angewandt.reise, eingabe.orte)
    : angewandt.reise

  return gastreiseSpeichern({
    ...graph,
    revision: aktuell.revision + 1,
    lastMutationId: eingabe.mutationId,
  })
}

/**
 * Legt die eine Gastreise an.
 *
 * Besteht schon eine, wirft die Funktion `GastreiseBestehtFehler`. Lässt sich
 * die neue nicht ablegen, wirft sie `SpeicherFehler` – die Oberfläche darf in
 * diesem Fall nicht in den Arbeitsbereich einer Reise wechseln, die es nirgends
 * gibt.
 */
export function gastreiseAnlegen(
  eingabe: CreateTripInput,
  bestaetigt?: { ziel: Ort; abreise: Ort },
): Trip {
  if (!verfuegbar()) throw new SpeicherFehler()

  const bestehend = gastreiseLaden()
  if (bestehend) throw new GastreiseBestehtFehler(bestehend.id)

  const jetzt = new Date().toISOString()

  // Die Kennung des Formulars wird die Kennung des Entwurfs. Damit trägt sie
  // die Idempotenz weiter: Wird dieser Entwurf später ins Konto übernommen, ist
  // es dieselbe Kennung, die dort `unique (user_id, client_ref)` prüft.
  const id = eingabe.clientRef
  const zielName = bestaetigt?.ziel.name ?? eingabe.destination
  const abreiseName = bestaetigt?.abreise.name ?? eingabe.origin
  const zielId = bestaetigt?.ziel.id ?? eingabe.destinationPlaceId
  const abreiseId = bestaetigt?.abreise.id ?? eingabe.originPlaceId

  const etappe = zielName
    ? einzelneEtappe(zielName, eingabe.startDate, eingabe.endDate, {
        countryCode: bestaetigt?.ziel.countryCode ?? null,
        latitude: bestaetigt?.ziel.lat ?? null,
        longitude: bestaetigt?.ziel.lon ?? null,
        placeId: zielId,
      })
    : null

  const entwurf = {
    id,
    clientRef: id,
    title: bestaetigt?.ziel.name ?? eingabe.title,
    origin: abreiseName,
    originPlaceId: abreiseId,
    startDate: eingabe.startDate,
    endDate: eingabe.endDate,
    travellers: eingabe.travellers,
    currency: eingabe.currency,
    budgetAmount: eingabe.budgetAmount,
    status: 'draft' as const,
    pace: eingabe.pace,
    interests: eingabe.interests,
    travelWish: eingabe.travelWish,
    revision: 1,
    lastMutationId: null,
    stages: etappe ? [etappe] : [],
    days: tageMitKennung(eingabe.startDate, eingabe.endDate, etappe?.id ?? null),
    ohneTag: [],
    createdAt: jetzt,
    updatedAt: jetzt,
  }

  const geprueft = reiseLesen(entwurf)
  if (!geprueft) throw new Error('Aus diesen Angaben entsteht keine gültige Reise.')

  schreibenMuss(SCHLUESSEL_AKTIV, geprueft)
  return geprueft
}

/**
 * Legt eine fertig geformte Reise als die eine Gastreise ab.
 *
 * Der Weg eines übernommenen Reisevorschlags (Phase 2.1). Er braucht eine eigene
 * Funktion und nicht `gastreiseAnlegen()`, weil ein Vorschlag mehr mitbringt als
 * ein Formular – Etappen, Tage, Planpunkte – und weniger verlangt: Ein Vorschlag
 * ohne Zeitraum ist zulässig, `CreateTripInput` schreibt zwei Daten vor.
 *
 * Ein zweiter Anlauf mit derselben Kennung liefert die abgelegte Reise zurück,
 * statt `GastreiseBestehtFehler` zu werfen. Das ist derselbe Vertrag, den
 * `public.reise_anlegen()` über `client_ref` im Konto hat: Doppelklick, Reload
 * und Retry ergeben eine Reise. `gastreiseAnlegen()` bleibt unverändert – dort
 * navigiert die Oberfläche nach dem ersten Anlauf weg.
 */
export function gastreiseAblegen(entwurf: Trip): Trip {
  if (!verfuegbar()) throw new SpeicherFehler()

  const bestehend = gastreiseLaden()
  if (bestehend) {
    if (kennungVon(bestehend) === kennungVon(entwurf)) return bestehend
    throw new GastreiseBestehtFehler(bestehend.id)
  }

  const geprueft = reiseLesen(entwurf)
  if (!geprueft) throw new Error('Aus diesem Vorschlag entsteht keine gültige Reise.')

  schreibenMuss(SCHLUESSEL_AKTIV, geprueft)
  return geprueft
}

/** Hängt einen Planpunkt an einen Tag der aktiven Gastreise. */
export function gastPlanpunktAnlegen(
  reise: Trip,
  eingabe: PlanpunktFormular & { dayId: string },
): Trip {
  const tag = reise.days.find((eintrag) => eintrag.id === eingabe.dayId)
  if (!tag) throw new Error('Dieser Tag gehört nicht zur Reise.')

  const punkt: TripItem = {
    id: kennungErzeugen('item'),
    dayId: tag.id,
    stageId: tag.stageId,
    kind: eingabe.kind,
    title: eingabe.title,
    note: eingabe.note,
    position: tag.items.length + 1,
    startsOn: tag.dayDate,
    startsAt: eingabe.startsAt,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
  }

  return gastreiseSpeichern({
    ...reise,
    revision: reise.revision + 1,
    days: reise.days.map((eintrag) =>
      eintrag.id === tag.id ? { ...eintrag, items: [...eintrag.items, punkt] } : eintrag,
    ),
  })
}

/** Übernimmt eine geprüfte Flugoption als kommerziellen Planpunkt. */
export function gastFlugUebernehmen(
  reise: Trip,
  aufnahme: FlugMomentaufnahme,
  dayId: string | null,
): Trip {
  const tag = dayId ? reise.days.find((eintrag) => eintrag.id === dayId) : undefined
  if (dayId && !tag) throw new Error('Dieser Tag gehört nicht zur Reise.')

  const punkt = momentaufnahmeAlsPunkt(aufnahme, {
    id: kennungErzeugen('item'),
    dayId: tag?.id ?? null,
    stageId: tag?.stageId ?? null,
    position: tag ? tag.items.length + 1 : reise.ohneTag.length + 1,
  })

  return gastreiseSpeichern({
    ...reise,
    revision: reise.revision + 1,
    days: tag
      ? reise.days.map((eintrag) =>
          eintrag.id === tag.id ? { ...eintrag, items: [...eintrag.items, punkt] } : eintrag,
        )
      : reise.days,
    ohneTag: tag ? reise.ohneTag : [...reise.ohneTag, punkt],
  })
}

/**
 * Übernimmt eine Hoteloption in die Gastreise.
 *
 * LocalStorage bleibt vom Nutzer manipulierbar. Die UI darf nur Optionen aus
 * der Jetnity-Suche übergeben; das ist keine serverseitige Verifikation.
 */
export function gastHotelUebernehmen(
  reise: Trip,
  aufnahme: HotelMomentaufnahme,
  stageId: string,
  dayId: string | null,
): Trip {
  const graph = hotelReisegraphPruefen(reise, { tripId: reise.id, stageId, dayId })
  if (!graph.ok) throw new Error(graph.message)
  if (aufnahme.startsOn !== graph.checkIn || aufnahme.endsOn !== graph.checkOut) {
    throw new Error('Der Zeitraum dieser Unterkunft passt nicht zur Etappe.')
  }

  const tag = graph.tag
  const punkt = hotelMomentaufnahmeAlsPunkt(aufnahme, {
    id: kennungErzeugen('item'),
    dayId: tag?.id ?? null,
    stageId: graph.etappe.id,
    position: tag ? tag.items.length + 1 : reise.ohneTag.length + 1,
  })

  return gastreiseSpeichern({
    ...reise,
    revision: reise.revision + 1,
    days: tag
      ? reise.days.map((eintrag) =>
          eintrag.id === tag.id ? { ...eintrag, items: [...eintrag.items, punkt] } : eintrag,
        )
      : reise.days,
    ohneTag: tag ? reise.ohneTag : [...reise.ohneTag, punkt],
  })
}

/**
 * Übernimmt eine Aktivitätsoption in die Gastreise.
 *
 * LocalStorage bleibt vom Nutzer manipulierbar. Die UI darf nur Optionen aus
 * der Jetnity-Suche übergeben; das ist keine serverseitige Verifikation.
 */
export function gastAktivitaetUebernehmen(
  reise: Trip,
  aufnahme: ActivityMomentaufnahme,
  stageId: string,
  dayId: string,
): Trip {
  const timeslot =
    aufnahme.startsOn && aufnahme.startsAt
      ? {
          startsOn: aufnahme.startsOn,
          startsAt: aufnahme.startsAt,
          endsOn: aufnahme.endsOn,
          endsAt: aufnahme.endsAt,
        }
      : null
  const graph = activityReisegraphMitTimeslotPruefen(
    reise,
    { tripId: reise.id, stageId, dayId },
    timeslot,
  )
  if (!graph.ok) throw new Error(graph.message)

  const punkt = activityMomentaufnahmeAlsPunkt(aufnahme, {
    id: kennungErzeugen('item'),
    dayId: graph.tag.id,
    stageId: graph.etappe.id,
    position: graph.tag.items.length + 1,
  })

  return gastreiseSpeichern({
    ...reise,
    revision: reise.revision + 1,
    days: reise.days.map((eintrag) =>
      eintrag.id === graph.tag.id ? { ...eintrag, items: [...eintrag.items, punkt] } : eintrag,
    ),
  })
}

/** Nimmt einen Planpunkt aus der aktiven Gastreise. */
export function gastPlanpunktEntfernen(reise: Trip, punktId: string): Trip {
  return gastreiseSpeichern({
    ...reise,
    revision: reise.revision + 1,
    days: reise.days.map((tag) => ({
      ...tag,
      items: tag.items
        .filter((punkt) => punkt.id !== punktId)
        .map((punkt, stelle) => ({ ...punkt, position: stelle + 1 })),
    })),
    ohneTag: reise.ohneTag.filter((punkt) => punkt.id !== punktId),
  })
}

/**
 * Entfernt die aktive Gastreise.
 *
 * Wirft, wenn der Entwurf danach noch da ist: Ein „verworfen“, nach dem die
 * Reise beim nächsten Laden wieder auftaucht, wäre dieselbe falsche Auskunft
 * wie ein „gespeichert“ ohne Ablage – nur in die andere Richtung.
 */
export function gastreiseEntfernen() {
  if (!verfuegbar()) throw new SpeicherFehler()
  schreibenMuss(SCHLUESSEL_AKTIV, null)
}

/**
 * Alles, was auf ein Konto wartet: die aktive Reise und die Warteschlange.
 *
 * Die Reihenfolge ist die der Übernahme. Die aktive Reise steht vorn, damit
 * sie zuerst im Konto liegt, wenn der Rest scheitert.
 */
export function zurUebernahme(): Trip[] {
  const { aktiv, warteschlange } = gastspeicherLaden()
  return aktiv ? [aktiv, ...warteschlange] : warteschlange
}

/**
 * Streicht eine übernommene Reise aus dem Speicher – und **nur** eine bestätigt
 * übernommene.
 *
 * Der Aufrufer ruft das je Reise einzeln, nachdem der Server ihre Kennung
 * gemeldet hat. Alles auf einmal zu löschen wäre die Annahme, es habe alles
 * geklappt.
 *
 * Hier darf ein Fehlschlag ohne Ausnahme bleiben, und nur hier: Die Reise liegt
 * bestätigt im Konto. Bleibt der Entwurf im Browser liegen, schickt ihn die
 * nächste Übernahme erneut – und `public.reise_anlegen()` ist über
 * `client_ref` idempotent, es entsteht keine zweite Reise.
 */
export function uebernommenStreichen(clientRef: string) {
  if (!verfuegbar()) return

  const aktiv = reiseLesen(rohLesen(SCHLUESSEL_AKTIV))
  if (aktiv && kennungVon(aktiv) === clientRef) {
    schreibenVersuch(SCHLUESSEL_AKTIV, null)
    return
  }

  const warteschlange = bestandWarteschlange()
  const verbleibend = warteschlange.filter((reise) => kennungVon(reise) !== clientRef)
  if (verbleibend.length !== warteschlange.length) {
    schreibenVersuch(SCHLUESSEL_WARTESCHLANGE, verbleibend.length ? verbleibend : null)
  }
}

/** Die Tage einer Gastreise: dieselbe Aufteilung wie im Konto, plus lokale Kennungen. */
function tageMitKennung(startDate: string, endDate: string, stageId: string | null): TripDay[] {
  return reisetageBauen(startDate, endDate).map((tag) => ({
    id: kennungErzeugen('day'),
    stageId,
    dayIndex: tag.dayIndex,
    dayDate: tag.dayDate,
    title: null,
    items: [],
  }))
}

/** Nur für Tests: die Schlüssel, unter denen dieser Speicher arbeitet. */
export const SCHLUESSEL = {
  aktiv: SCHLUESSEL_AKTIV,
  warteschlange: SCHLUESSEL_WARTESCHLANGE,
  legacy: SCHLUESSEL_LEGACY,
} as const
