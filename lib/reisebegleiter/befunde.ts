// lib/reisebegleiter/befunde.ts
//
// Was eine Auskunft sagen kann – als geschlossener Katalog, nicht als Sprache.
//
// ---------------------------------------------------------------------------
// Warum das Modell keine Sätze mehr schreibt
// ---------------------------------------------------------------------------
//
// Sieben Fassungen haben versucht, Freitext des Modells so einzuschränken, dass
// darin keine amtliche Anforderung ausdrückbar ist: deutsche Muster,
// mehrsprachige Verbotslisten, eine Spracherkennung, eine Erlaubnisliste über
// dem Wortschatz, zuletzt eine Erlaubnisliste ohne amtliche Substantive. Jede
// wurde widerlegt, und die achte Widerlegung brauchte kein exotisches
// Beispiel – nur gewöhnliche Wörter:
//
//   `Du musst ein gültiges Reisedokument haben.`
//
// `muss`, `gültig`, `Reisedokument`, `haben` waren alle geführt, und der Satz
// ist trotzdem eine Dokumentenanforderung. Das war vorhersehbar: Jede dieser
// Fassungen behauptete, **kein aus dieser Wortmenge bildbarer Satz** sei eine
// amtliche Aussage. Das ist eine Behauptung über einen unendlichen Satzraum aus
// einem endlichen Wortschatz, und Sprache komponiert. Eine solche Behauptung
// lässt sich nicht belegen, nur wiederholt widerlegen – siebenmal geschehen.
//
// Deshalb schreibt das Modell hier keine Sätze mehr. Es **wählt aus**.
//
//   · Jeden Satz, den ein Nutzer zu sehen bekommt, schreibt Jetnity. Er steht
//     unten in `BEFUNDE` oder in `lib/reisebegleiter/aussagen.ts`.
//   · Das Modell wählt Schlüssel und Bezug. `lib/reisebegleiter/schema.ts` hat
//     kein Freitextfeld mehr – kein `antwort`, kein `unsicherheiten`, kein
//     `naechsteSchritte`. Der Satz oben ist nicht mehr *abgelehnt*, er ist
//     **nicht darstellbar**.
//   · Gewählt werden darf nur, was Jetnity vorher als zutreffend berechnet hat:
//     `angeboteneBefunde()` prüft jeden Katalogeintrag gegen die akzeptierte
//     Projektion und gibt nur die wahren Paare aus (Schlüssel + Bezug). Die
//     Nutzlast zeigt dem Modell genau dieses Angebot.
//
// Das ist der Unterschied zu allen sieben Vorfassungen: Die Zusicherung hängt
// nicht mehr daran, ob eine Wortmenge semantisch vollständig beschrieben ist.
// Sie ist am Typ ablesbar, und `lib/reisebegleiter/schema.test.ts` liest sie
// dort ab.
//
// ---------------------------------------------------------------------------
// Was das kostet – ausdrücklich, weil es eine Produktfrage ist
// ---------------------------------------------------------------------------
//
// Der Reisebegleiter formuliert nicht mehr frei. Er wählt aus Jetnity-eigenen
// Aussagen die aus, die zur Frage passen, und ordnet sie. Für die
// Wahrheitsklasse „Generated Suggestion" ist das die ehrliche Bauform, aber es
// ist eine sichtbare Produktänderung gegenüber einer frei formulierten Antwort.
// Die Entscheidung darüber gehört dem Product Owner; sie ist in
// DECISIONS.md ADR-0212 Punkt 9 und im SELF_REVIEW als offener Punkt benannt.
//
// ---------------------------------------------------------------------------
// Warum der Katalog über Jetnity-Daten spricht und nicht über Amtliches
// ---------------------------------------------------------------------------
//
// „Für diese Person ist noch kein Reisedokument hinterlegt" ist eine Aussage
// über **Jetnitys eigenen Datenstand**, nachrechenbar aus der Projektion, und
// Jetnity trägt sie selbst. „Du brauchst ein Reisedokument" wäre eine Aussage
// über eine amtliche Anforderung – die gibt es hier nicht, in keinem Eintrag.
// Amtliche Lagen laufen ausschliesslich über `amtlicheHinweise`.
//
// Frei von Next, Supabase und `process.env`.

import type { AssistantTruthContext } from '@/lib/reisebegleiter/kontext'

/**
 * Die drei Gruppen der Anzeige: was feststeht, was offen ist, was man tun kann.
 *
 * Die Rolle steht im Katalog und nicht in der Modellantwort – das Modell wählt
 * Aussagen, nicht ihre Einordnung.
 */
export type Befundrolle = 'offen' | 'stand' | 'schritt'

/** Worauf ein Befund zeigt. `null`: auf die Reise als Ganzes. */
export type Befundbezugsart = 'etappe' | 'reisende' | null

type Befundeintrag = {
  schluessel: string
  rolle: Befundrolle
  /** Der Satz. Von Jetnity, nicht vom Modell. */
  text: string
  bezugsart: Befundbezugsart
}

/**
 * Der geschlossene Katalog.
 *
 * Reihenfolge ist Anzeigereihenfolge innerhalb einer Rolle; die Auswahl des
 * Modells bestimmt, *welche* erscheinen, nicht wie sie lauten.
 */
export const BEFUNDE = [
  // --- Die Reise als Ganzes ------------------------------------------------
  {
    schluessel: 'reise_ohne_zeitraum',
    rolle: 'offen',
    text: 'Für diese Reise fehlt noch der Zeitraum.',
    bezugsart: null,
  },
  {
    schluessel: 'reise_ohne_etappen',
    rolle: 'offen',
    text: 'Diese Reise hat noch keine Etappen.',
    bezugsart: null,
  },
  {
    schluessel: 'reise_ohne_reisende',
    rolle: 'offen',
    text: 'Für diese Reise sind noch keine Reisenden hinterlegt.',
    bezugsart: null,
  },
  {
    schluessel: 'reise_zeitraum_steht',
    rolle: 'stand',
    text: 'Der Zeitraum dieser Reise steht.',
    bezugsart: null,
  },
  {
    schluessel: 'reise_bereiche_ungeprueft',
    rolle: 'offen',
    text: 'Für einige Bereiche dieser Reise hat Jetnity noch keinen geprüften Stand.',
    bezugsart: null,
  },
  {
    schluessel: 'reise_ohne_route',
    rolle: 'offen',
    text: 'Für diese Reise liegt noch keine abgeleitete Route vor.',
    bezugsart: null,
  },
  {
    schluessel: 'reise_mit_transit',
    rolle: 'stand',
    text: 'Diese Route führt durch mindestens ein Land, das nur durchreist wird.',
    bezugsart: null,
  },
  {
    schluessel: 'reise_ohne_offene_angaben',
    rolle: 'stand',
    text: 'Jetnity sieht bei den Angaben dieser Reise derzeit nichts Offenes.',
    bezugsart: null,
  },

  // --- Etappen -------------------------------------------------------------
  {
    schluessel: 'etappe_ohne_daten',
    rolle: 'offen',
    text: 'Für diese Etappe fehlen noch Daten.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'etappe_ohne_land',
    rolle: 'offen',
    text: 'Für diese Etappe fehlt noch das Land.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'etappe_ohne_namen',
    rolle: 'offen',
    text: 'Diese Etappe hat noch keinen Namen.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'etappe_daten_stehen',
    rolle: 'stand',
    text: 'Die Daten dieser Etappe stehen.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'etappe_hoechstens_eine_nacht',
    rolle: 'offen',
    text: 'Diese Etappe ist auf höchstens eine Nacht angelegt.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'etappe_ab_einer_woche',
    rolle: 'stand',
    text: 'Diese Etappe ist auf eine Woche oder länger angelegt.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'etappe_ausserhalb_zeitraum',
    rolle: 'offen',
    text: 'Diese Etappe liegt ausserhalb des Reisezeitraums.',
    bezugsart: 'etappe',
  },

  // --- Reisende ------------------------------------------------------------
  {
    schluessel: 'reisende_ohne_dokument',
    rolle: 'offen',
    text: 'Für diese Person ist in Jetnity noch kein Reisedokument hinterlegt.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'reisende_ohne_staatsangehoerigkeit',
    rolle: 'offen',
    text: 'Für diese Person ist in Jetnity noch keine Staatsangehörigkeit hinterlegt.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'reisende_ohne_wohnsitz',
    rolle: 'offen',
    text: 'Für diese Person ist in Jetnity noch kein Wohnsitz hinterlegt.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'reisende_mehrere_staatsangehoerigkeiten',
    rolle: 'stand',
    text: 'Für diese Person sind mehrere Staatsangehörigkeiten hinterlegt. Jetnity behandelt sie als gleichrangige Optionen.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'reisende_dokument_ohne_ablaufdatum',
    rolle: 'offen',
    text: 'Für ein hinterlegtes Reisedokument dieser Person fehlt das Ablaufdatum.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'reisende_dokument_ablauf_vor_reiseende',
    rolle: 'offen',
    text: 'Ein hinterlegtes Reisedokument dieser Person hat ein Ablaufdatum vor dem Ende der Reise.',
    bezugsart: 'reisende',
  },

  // --- Mögliche nächste Schritte in Jetnity --------------------------------
  //
  // Vorschläge für Wege in der Oberfläche. Sie sagen, was der Nutzer in Jetnity
  // tun kann – nicht, was eine Behörde verlangt.
  {
    schluessel: 'schritt_zeitraum_ergaenzen',
    rolle: 'schritt',
    text: 'Den Zeitraum der Reise in der Reiseplanung ergänzen.',
    bezugsart: null,
  },
  {
    schluessel: 'schritt_etappe_ergaenzen',
    rolle: 'schritt',
    text: 'Eine erste Etappe in der Reiseplanung anlegen.',
    bezugsart: null,
  },
  {
    schluessel: 'schritt_reisende_ergaenzen',
    rolle: 'schritt',
    text: 'Die Reisenden in der Reiseplanung ergänzen.',
    bezugsart: null,
  },
  {
    schluessel: 'schritt_etappendaten_ergaenzen',
    rolle: 'schritt',
    text: 'Die Daten dieser Etappe ergänzen.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'schritt_etappenland_ergaenzen',
    rolle: 'schritt',
    text: 'Das Land dieser Etappe ergänzen.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'schritt_etappe_benennen',
    rolle: 'schritt',
    text: 'Dieser Etappe einen Namen geben.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'schritt_etappe_verlaengern',
    rolle: 'schritt',
    text: 'Diese Etappe um einen oder mehrere Tage verlängern.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'schritt_etappe_in_zeitraum_legen',
    rolle: 'schritt',
    text: 'Diese Etappe in den Reisezeitraum legen.',
    bezugsart: 'etappe',
  },
  {
    schluessel: 'schritt_dokument_ergaenzen',
    rolle: 'schritt',
    text: 'Für diese Person ein Reisedokument in der Reisevorbereitung ergänzen.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'schritt_staatsangehoerigkeit_ergaenzen',
    rolle: 'schritt',
    text: 'Für diese Person die Staatsangehörigkeit in der Reisevorbereitung ergänzen.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'schritt_wohnsitz_ergaenzen',
    rolle: 'schritt',
    text: 'Für diese Person den Wohnsitz in der Reisevorbereitung ergänzen.',
    bezugsart: 'reisende',
  },
  {
    schluessel: 'schritt_ablaufdatum_ergaenzen',
    rolle: 'schritt',
    text: 'Für das hinterlegte Reisedokument dieser Person das Ablaufdatum ergänzen.',
    bezugsart: 'reisende',
  },
] as const satisfies readonly Befundeintrag[]

export type Befundschluessel = (typeof BEFUNDE)[number]['schluessel']

export const BEFUND_SCHLUESSEL = BEFUNDE.map((befund) => befund.schluessel) as [
  Befundschluessel,
  ...Befundschluessel[],
]

const NACH_SCHLUESSEL = new Map<string, Befundeintrag>(
  BEFUNDE.map((befund) => [befund.schluessel, befund]),
)

export function befundEintrag(schluessel: Befundschluessel): Befundeintrag {
  return NACH_SCHLUESSEL.get(schluessel) as Befundeintrag
}

/** Ein zutreffender Befund mit dem Bezug, für den er zutrifft. */
export type Befundangebot = {
  schluessel: Befundschluessel
  /** `null` bei Befunden über die Reise als Ganzes. */
  ref: string | null
}

function tage(von: string, bis: string): number | null {
  const a = Date.parse(`${von}T00:00:00Z`)
  const b = Date.parse(`${bis}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.round((b - a) / 86_400_000)
}

/**
 * Die Befunde, die auf diese Reise zutreffen – berechnet, nicht behauptet.
 *
 * Das Modell bekommt genau diese Liste und darf nur daraus wählen. Ein
 * Schlüssel-Bezug-Paar, das hier nicht steht, verwirft die Auskunft
 * (`lib/reisebegleiter/pruefung.ts`).
 *
 * Die Refs folgen derselben Zählung wie `begleiternutzlastAus()`: Etappen in
 * Projektionsreihenfolge `E1…`, Reisende `R1…`.
 */
export function angeboteneBefunde(kontext: AssistantTruthContext): Befundangebot[] {
  const angebot: Befundangebot[] = []
  const reise = (schluessel: Befundschluessel) => angebot.push({ schluessel, ref: null })
  const zu = (schluessel: Befundschluessel, ref: string) => angebot.push({ schluessel, ref })

  const zeitraumSteht = kontext.trip.startDate !== null && kontext.trip.endDate !== null
  if (zeitraumSteht) reise('reise_zeitraum_steht')
  else {
    reise('reise_ohne_zeitraum')
    reise('schritt_zeitraum_ergaenzen')
  }

  if (kontext.stages.length === 0) {
    reise('reise_ohne_etappen')
    reise('schritt_etappe_ergaenzen')
  }

  if (kontext.travellers.length === 0) {
    reise('reise_ohne_reisende')
    reise('schritt_reisende_ergaenzen')
  }

  if (kontext.unfilledTruthClasses.length > 0) reise('reise_bereiche_ungeprueft')

  if (!kontext.route.vorhanden) reise('reise_ohne_route')
  else if (kontext.route.transitCountryCodes.length > 0) reise('reise_mit_transit')

  let etwasOffen =
    !zeitraumSteht ||
    kontext.stages.length === 0 ||
    kontext.travellers.length === 0 ||
    !kontext.route.vorhanden

  kontext.stages.forEach((stage, stelle) => {
    const ref = `E${stelle + 1}`

    if (stage.arrivalDate === null && stage.departureDate === null) {
      zu('etappe_ohne_daten', ref)
      zu('schritt_etappendaten_ergaenzen', ref)
      etwasOffen = true
    } else if (stage.arrivalDate !== null && stage.departureDate !== null) {
      zu('etappe_daten_stehen', ref)

      const dauer = tage(stage.arrivalDate, stage.departureDate)
      if (dauer !== null && dauer <= 1) {
        zu('etappe_hoechstens_eine_nacht', ref)
        zu('schritt_etappe_verlaengern', ref)
      }
      if (dauer !== null && dauer >= 7) zu('etappe_ab_einer_woche', ref)

      if (
        kontext.trip.startDate !== null &&
        kontext.trip.endDate !== null &&
        (stage.arrivalDate < kontext.trip.startDate || stage.departureDate > kontext.trip.endDate)
      ) {
        zu('etappe_ausserhalb_zeitraum', ref)
        zu('schritt_etappe_in_zeitraum_legen', ref)
        etwasOffen = true
      }
    } else {
      zu('etappe_ohne_daten', ref)
      zu('schritt_etappendaten_ergaenzen', ref)
      etwasOffen = true
    }

    if (stage.countryCode === null) {
      zu('etappe_ohne_land', ref)
      zu('schritt_etappenland_ergaenzen', ref)
      etwasOffen = true
    }

    if (stage.name === null) {
      zu('etappe_ohne_namen', ref)
      zu('schritt_etappe_benennen', ref)
      etwasOffen = true
    }
  })

  kontext.travellers.forEach((traveller, stelle) => {
    const ref = `R${stelle + 1}`

    if (traveller.documents.length === 0) {
      zu('reisende_ohne_dokument', ref)
      zu('schritt_dokument_ergaenzen', ref)
      etwasOffen = true
    }

    if (traveller.citizenships.length === 0) {
      zu('reisende_ohne_staatsangehoerigkeit', ref)
      zu('schritt_staatsangehoerigkeit_ergaenzen', ref)
      etwasOffen = true
    } else if (traveller.citizenships.length > 1) {
      zu('reisende_mehrere_staatsangehoerigkeiten', ref)
    }

    if (traveller.residenceCountryCode === null) {
      zu('reisende_ohne_wohnsitz', ref)
      zu('schritt_wohnsitz_ergaenzen', ref)
      etwasOffen = true
    }

    if (traveller.documents.some((dokument) => dokument.expiresOn === null)) {
      zu('reisende_dokument_ohne_ablaufdatum', ref)
      zu('schritt_ablaufdatum_ergaenzen', ref)
      etwasOffen = true
    }

    const reiseEnde = kontext.trip.endDate
    if (
      reiseEnde !== null &&
      traveller.documents.some(
        (dokument) => dokument.expiresOn !== null && dokument.expiresOn < reiseEnde,
      )
    ) {
      zu('reisende_dokument_ablauf_vor_reiseende', ref)
      etwasOffen = true
    }
  })

  if (!etwasOffen) reise('reise_ohne_offene_angaben')

  return angebot
}

/** Vergleichsschlüssel für die Angebotsprüfung. */
export function befundMarke(schluessel: string, ref: string | null): string {
  return `${schluessel}@${ref ?? '-'}`
}
