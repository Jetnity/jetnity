// lib/reisebegleiter/wortschatz.ts
//
// Der Wortschatz, aus dem eine Assistant-Auskunft bestehen darf.
//
// ---------------------------------------------------------------------------
// Warum eine Erlaubnisliste und nicht noch eine Verbotsliste
// ---------------------------------------------------------------------------
//
// Drei Runden lang wurde versucht, erfundene amtliche Wahrheit an ihren Wörtern
// zu erkennen: erst auf Deutsch, dann in den Sprachen, die Jetnity führt, dann
// über eine Spracherkennung. Jede Fassung war eine **Verbotsliste über einer
// offenen Menge**, und jede war damit widerlegbar – zuletzt durch
// `Das ist so: İtalya için vize gerekli.`: genug deutsche Markerwörter, um für
// deutsch zu gelten, und eine amtliche Behauptung in einer Sprache, die in
// keiner Liste steht.
//
// Über einer offenen Menge gibt es keine vollständige Verbotsliste. Es gibt nur
// eine vollständige **Erlaubnisliste**. Deshalb steht die Frage jetzt umgekehrt:
// Nicht „enthält dieser Text ein verbotenes Wort?", sondern „besteht dieser
// Text ausschliesslich aus Wörtern, die Jetnity kennt?"
//
// ---------------------------------------------------------------------------
// Woher der Wortschatz kommt
// ---------------------------------------------------------------------------
//
// Aus Jetnity selbst. Zulässig ist, was
//
//   · hier als Wortstamm steht – der Register, den die Systemregeln vom Modell
//     verlangen: Reise, Zeit, Ort, Vorbereitung, amtliche Anforderungen,
//     Funktionswörter;
//   · im **serverseitig abgeleiteten Kontext** vorkommt – Etappennamen,
//     Ländernamen, Reisenden-Label, Daten. Diese Wörter stammen aus der
//     akzeptierten Projektion und nicht aus dem Modell;
//   · eine Zahl, ein Datum oder ein einzelner Buchstabe ist. Damit lässt sich
//     keine Anforderung behaupten.
//
// Alles andere ist unbelegt, und eine Auskunft mit einem unbelegten Wort wird
// verworfen. Das ist die Aussage, die vorher fehlte: Sie hängt nicht daran,
// welche Sprachen aufgezählt sind, sondern daran, dass **nichts** zulässig ist,
// was nicht aufgezählt ist.
//
// ---------------------------------------------------------------------------
// Was das kostet
// ---------------------------------------------------------------------------
//
// Recall. Ein gültiger deutscher Satz mit einem Wort ausserhalb dieses Registers
// fällt durch. Das ist der Preis einer Erlaubnisliste, er ist bewusst bezahlt,
// und er zeigt in die sichere Richtung: eine abgelehnte Auskunft ist ein
// ausgefallenes Merkmal, eine erfundene Einreiseanforderung ist ein Schaden.
//
// Zwei Zugeständnisse heben den Recall, ohne die Menge zu öffnen:
//
//   · **Stammerkennung.** Deutsche Flexion wird abgetragen, bevor verglichen
//     wird: `geprüfte`, `geprüften`, `prüfung` treffen alle `pruef`.
//   · **Komposita.** Ein Wort aus zwei oder drei belegten Stämmen ist belegt –
//     `Reisevorbereitung`, `Einreiseformular`. Zusammensetzen lässt sich nur,
//     was einzeln schon erlaubt war.
//
// Beides erweitert die Menge nicht: Es sind dieselben Stämme, nur gebeugt und
// zusammengesetzt. `gerekli` bleibt unbelegt, weil kein Stamm darin steckt.
//
// Frei von Next, Supabase und `process.env`.

/**
 * Die Wortstämme, aus denen eine Auskunft bestehen darf.
 *
 * Kleingeschrieben und ungebeugt. Gruppiert, damit ein Review sie lesen kann;
 * die Gruppen haben keine Bedeutung für die Prüfung.
 *
 * Amtliche Begriffe stehen hier **mit Absicht**: Ohne sie käme die inhaltliche
 * Prüfung in `lib/reisebegleiter/pruefung.ts` nie zum Zug, weil das Wort schon
 * an dieser Schranke fiele. Erlaubt ist hier die Möglichkeit, über eine
 * Anforderung zu *sprechen*; ob eine Aussage darüber belegt ist, entscheidet
 * die Prüfung danach.
 */
export const ASSISTANT_WORTSTAEMME: readonly string[] = [
  // --- Funktionswörter, Pronomen, Konjunktionen ---------------------------
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem',
  'einer', 'eines', 'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines',
  'und', 'oder', 'aber', 'denn', 'sondern', 'sowie', 'beziehungsweise',
  'als', 'wie', 'wenn', 'falls', 'sofern', 'weil', 'dass', 'damit', 'ob',
  'auch', 'noch', 'nur', 'schon', 'bereits', 'erst', 'wieder', 'erneut',
  'nicht', 'nichts', 'etwas', 'alles', 'viel', 'viele', 'wenig', 'wenige',
  'mehr', 'meist', 'meiste', 'jede', 'jeder', 'jedes', 'alle', 'allen',
  'beide', 'beiden', 'einige', 'mehrere', 'manche', 'andere', 'anderen',
  'dies', 'diese', 'dieser', 'dieses', 'diesen', 'jen', 'jene',
  'ich', 'du', 'dir', 'dich', 'dein', 'deine', 'deinen', 'deinem', 'deiner',
  'wir', 'uns', 'unser', 'unsere', 'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer',
  'sie', 'es', 'er', 'sich', 'man', 'wer', 'was', 'wo', 'wann', 'warum',
  'welche', 'welcher', 'welches', 'wieviel',
  'in', 'im', 'an', 'am', 'auf', 'aus', 'bei', 'beim', 'mit', 'nach', 'von',
  'vom', 'vor', 'zu', 'zum', 'zur', 'ueber', 'über', 'unter', 'zwischen',
  'ohne', 'gegen', 'fuer', 'für', 'seit', 'bis', 'waehrend', 'während',
  'innerhalb', 'ausserhalb', 'außerhalb', 'neben', 'hinter', 'durch', 'pro',
  'hier', 'dort', 'dann', 'danach', 'davor', 'dabei', 'dazu', 'dafuer',
  'dafür', 'darum', 'deshalb', 'deswegen', 'somit', 'also', 'jedoch',
  'allerdings', 'zudem', 'ausserdem', 'außerdem', 'weiterhin', 'zuerst',
  'zunaechst', 'zunächst', 'schliesslich', 'schließlich', 'insgesamt',
  'bitte', 'gern', 'gerne', 'sehr', 'etwa', 'circa', 'ungefaehr', 'ungefähr',
  'mindestens', 'hoechstens', 'höchstens', 'ausreichend', 'genug',
  'moeglicherweise', 'möglicherweise', 'eventuell', 'vielleicht',
  'gegebenenfalls', 'voraussichtlich', 'ueblicherweise', 'üblicherweise',
  'typisch', 'typischerweise', 'regel', 'umstand', 'umstaende', 'umstände',
  'derzeit', 'zurzeit', 'momentan', 'inzwischen', 'bislang', 'bisher',
  'ja', 'nein', 'kaum', 'fast', 'eher', 'besser', 'gut', 'schlecht',

  // --- Verben des Registers ----------------------------------------------
  'sein', 'ist', 'sind', 'war', 'waren', 'bin', 'bist', 'gewesen',
  'haben', 'hat', 'hab', 'hatte', 'hatten', 'gehabt',
  'werden', 'wird', 'wurde', 'wurden', 'worden',
  'koennen', 'können', 'kann', 'konnte', 'muessen', 'müssen', 'muss',
  'sollen', 'soll', 'sollte', 'duerfen', 'dürfen', 'darf', 'mag', 'moechte',
  'koennte', 'könnte', 'koenntest', 'könntest', 'umfassen', 'umfasst', 'bemessen',
  'möchte', 'wollen', 'will', 'brauchen', 'braucht', 'brauchst',
  'benoetigen', 'benötigen', 'benoetigt', 'benötigt',
  'pruefen', 'prüfen', 'geprueft', 'geprüft', 'ungeprueft', 'ungeprüft',
  'klaeren', 'klären', 'geklaert', 'geklärt', 'ungeklaert', 'ungeklärt',
  'ergaenzen', 'ergänzen', 'eintragen', 'hinterlegen', 'erfassen',
  'anpassen', 'aendern', 'ändern', 'verschieben', 'verlaengern', 'verlängern',
  'kuerzen', 'kürzen', 'planen', 'geplant', 'einplanen', 'ansehen',
  'lesen', 'oeffnen', 'öffnen', 'schliessen', 'schließen', 'waehlen', 'wählen',
  'entscheiden', 'ueberlegen', 'überlegen', 'beachten', 'bedenken',
  'achten', 'merken', 'wissen', 'weiss', 'weiß', 'kennen', 'kennt',
  'liegen', 'liegt', 'stehen', 'steht', 'bleiben', 'bleibt', 'gelten', 'gilt',
  'fehlen', 'fehlt', 'geben', 'gibt', 'nehmen', 'machen',
  'tun', 'lassen', 'laesst', 'lässt', 'zeigen', 'zeigt', 'nennen', 'nennt',
  'sagen', 'sagt', 'heissen', 'heißen', 'heisst', 'heißt', 'bedeuten',
  'bedeutet', 'ergeben', 'ergibt', 'entstehen', 'entsteht', 'reichen',
  'reicht', 'dauern', 'dauert', 'beginnen', 'beginnt', 'enden', 'endet',
  'ankommen', 'abreisen', 'reisen', 'fahren', 'fliegen', 'uebernachten',
  'übernachten',
  'empfehlen', 'empfohlen', 'vermeiden',
  'entfallen', 'entfaellt',
  'entfällt', 'befreien', 'befreit',

  // --- Reise, Zeit, Ort ---------------------------------------------------
  'reise', 'reisend', 'reisende', 'mitreisend', 'gruppe',
  'etappe', 'etappen', 'ziel', 'ziele', 'zielland', 'route',
  'abreise', 'anreise',
  'flug', 'fluege', 'flüge',
  'unterkunft', 'unterkuenfte', 'unterkünfte', 'hotel', 'nacht', 'naechte',
  'nächte', 'aktivitaet', 'aktivität', 'aktivitaeten', 'aktivitäten',
  'mobilitaet', 'mobilität', 'transfer', 'mietwagen', 'zug', 'bus', 'faehre',
  'fähre', 'strecke', 'verbindung',
  'tag', 'tage', 'woche', 'wochen', 'monat', 'monate', 'jahr', 'jahre',
  'datum', 'daten', 'zeit', 'zeitraum', 'zeitpunkt', 'saison', 'jahreszeit',
  'frueh', 'früh', 'spaet', 'spät', 'heute', 'morgen', 'bald', 'aktuell',
  'ort', 'orte', 'stadt', 'staedte', 'städte', 'land', 'laender', 'länder',
  'region', 'gebiet', 'umgebung', 'naehe', 'nähe',
  'plan', 'planung', 'planpunkt', 'planpunkte', 'programm', 'punkt', 'punkte',
  'budget', 'preis', 'kosten', 'anbieter',
  'wunsch', 'wuensche', 'wünsche', 'interesse', 'interessen', 'tempo',
  'vorbereitung', 'uebersicht', 'übersicht', 'arbeitsbereich', 'jetnity',

  // --- Reisenden- und Dokumentfelder, die Jetnity selbst anzeigt ----------
  //
  // Bereichsneutral: Keines dieser Wörter trifft ein Anforderungsmuster, und
  // `wortschatz.test.ts` prüft das. Sie benennen Felder der Reise, nicht
  // amtliche Anforderungen.
  'staatsangehoerigkeit', 'staatsangehörigkeit', 'wohnsitz', 'dokument',
  'dokumente', 'reisedokument', 'reisedokumente', 'formular', 'option',
  'optionen', 'gleichrangig', 'gueltig', 'gültig', 'gueltigkeit', 'gültigkeit',
  'ablauf', 'ablaufdatum',

  // --- Bewusst NICHT geführt: amtliches Vokabular --------------------------
  //
  // Hier stand bis Runde 7 der amtliche Wortschatz – Visum, Pass, Impfung,
  // Versicherung, Einreiseformular, Nachweis, Pflicht, erforderlich. Er ist
  // entfernt, und das ist der Kern der Lösung: Prosa kann keine amtliche
  // Anforderung erfinden, wenn sie sie nicht benennen kann. Über amtliche
  // Lagen spricht die Auskunft ausschliesslich über den typisierten Kanal in
  // `lib/reisebegleiter/aussagen.ts`, dessen Sätze Jetnity schreibt.
  //
  // `lib/reisebegleiter/wortschatz.test.ts` prüft diese Eigenschaft gegen die
  // Bereichsmuster in `lib/reisebegleiter/pruefung.ts` selbst: Kein geführtes
  // Wort und kein Kompositum daraus darf einen Anforderungsbereich treffen.

  // --- Lage, Bewertung, Unsicherheit --------------------------------------
  'lage', 'stand', 'status', 'ergebnis', 'quelle', 'quellen', 'evidenz',
  'hinweis', 'hinweise', 'warnung', 'warnungen', 'risiko', 'sicherheit',
  'sicherheitslage', 'unsicher', 'unsicherheit', 'unklar', 'offen',
  'bekannt', 'unbekannt', 'verlaesslich', 'verlässlich', 'bestimmbar',
  'belegt', 'unbelegt', 'aktualitaet', 'aktualität', 'veraltet', 'frisch',
  'erreichbar', 'verfuegbar', 'verfügbar', 'aktiv', 'inaktiv',
  'automatisch', 'manuell', 'moeglich', 'möglich',
  'relevant', 'wichtig', 'sinnvoll', 'geeignet', 'knapp',
  'umfangreich', 'kurz', 'lang', 'laenger', 'länger', 'kuerzer', 'kürzer',
  'ruhig', 'entspannt', 'dicht', 'frei', 'voll', 'leer',
  'angabe', 'angaben', 'auskunft', 'vorschlag', 'vorschlaege', 'vorschläge',
  'schritt', 'schritte', 'naechste', 'nächste', 'weitere', 'zusaetzlich',
  'zusätzlich', 'bedingung', 'voraussetzung', 'grund', 'gruende', 'gründe',
  'frage', 'antwort', 'beispiel', 'teil', 'anzahl', 'zahl', 'summe',
  'aenderung', 'änderung', 'anpassung', 'ueberblick', 'überblick',
  'annahme', 'annahmen', 'vermutung', 'wahrheit', 'herkunft',

  // --- Zahlwörter, Mengen, Reihenfolge ------------------------------------
  'eins', 'zwei', 'drei', 'vier', 'fuenf', 'fünf', 'sechs', 'sieben', 'acht',
  'neun', 'zehn', 'elf', 'zwoelf', 'zwölf', 'erste', 'zweite', 'dritte',
  'letzte', 'halb', 'doppelt', 'einzeln', 'gesamt', 'teilweise',

  // --- Verben und Formen mit Ablaut, die keine Endung abträgt -------------
  'einordnen', 'entfernen', 'entfernt', 'speichern', 'gespeichert',
  'hinzufuegen', 'hinzufügen', 'hinzugefuegt', 'hinzugefügt',
  'verschoben', 'versehen', 'rechnen', 'schreiben', 'schreibe',
  'ignorieren', 'ignoriere', 'kommen', 'kommst', 'geworden', 'gegeben',
  'genommen', 'gelassen', 'gesehen', 'gewusst', 'gehalten',
  'elektronisch', 'unwichtig', 'anweisung', 'neu', 'neue',
  'um', 'ins', 'je', 'her', 'hin', 'weg', 'mal', 'bzw',
]

/** Nachgestellte Endungen, die deutsche Flexion abtragen. Längste zuerst. */
/**
 * Formen, die **nur genau so** zulässig sind.
 *
 * `passt` und `passen` sind gewöhnliches Deutsch – „der Zeitraum passt" –, aber
 * ihr Stamm ist `pass`, und damit liesse sich `Reisepass` zusammensetzen. Sie
 * stehen deshalb hier: exakt erlaubt, ohne Stammbildung und ohne Beitrag zu
 * Komposita. Ein Stamm, der ein amtliches Wort ergibt, darf keiner sein.
 */
const ASSISTANT_WORTFORMEN: readonly string[] = ['passt', 'passen', 'passend', 'passende']

const NUR_FORM = new Set(ASSISTANT_WORTFORMEN)

const ENDUNGEN: readonly string[] = [
  'ungen', 'lichen', 'ischen', 'keiten', 'heiten', 'ender', 'endes', 'enden',
  'erung', 'ungs', 'lich', 'isch', 'keit', 'heit', 'bar', 'end', 'ung',
  'este', 'sten', 'ste', 'est', 'ern', 'em', 'en', 'er', 'es', 'et', 'st',
  'te', 'ten', 'nd', 'e', 'n', 's', 't', 'm', 'r',
]

/** Umlaute zusätzlich in Umschrift, damit `für` und `fuer` denselben Stamm treffen. */
function umschrift(wort: string): string {
  return wort
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

/**
 * Die geführten Formen plus ihre abgetragenen Stämme.
 *
 * Oben steht, was ein Mensch lesen kann – `prüfen`, `ergänzen`, `Reise`. Für
 * Flexion und Komposita braucht der Vergleich den Stamm: `prüf`, `ergänz`,
 * `reis`. Er wird hier einmal abgeleitet, statt die Liste doppelt zu führen.
 * Vier Zeichen sind das Minimum; kürzere Reste wären keine Stämme mehr,
 * sondern Silben, und Silben lassen jedes Wort zu.
 */
function belegteFormen(): ReadonlySet<string> {
  const formen = new Set<string>()
  const merken = (wort: string) => {
    formen.add(wort)
    formen.add(umschrift(wort))
  }

  for (const eintrag of ASSISTANT_WORTSTAEMME) {
    merken(eintrag)
    for (const endung of ENDUNGEN) {
      if (!eintrag.endsWith(endung)) continue
      const stamm = eintrag.slice(0, eintrag.length - endung.length)
      if (stamm.length >= 4) merken(stamm)
    }
  }

  return formen
}

const BELEGT = belegteFormen()


/**
 * Ob ein Wort auf einen geführten Stamm zurückgeht – ohne Kontextzusatz.
 *
 * Gemerkt, weil dieselben Wörter in jeder Auskunft wiederkehren und die
 * Zerlegung unten dieselbe Frage vielfach stellt.
 */
const stammGemerkt = new Map<string, boolean>()

function trifftStammRein(wort: string): boolean {
  const gemerkt = stammGemerkt.get(wort)
  if (gemerkt !== undefined) return gemerkt

  let treffer = false
  for (const form of new Set([wort, umschrift(wort)])) {
    if (BELEGT.has(form)) {
      treffer = true
      break
    }
    for (const endung of ENDUNGEN) {
      if (form.length - endung.length < 3) continue
      if (!form.endsWith(endung)) continue
      if (BELEGT.has(form.slice(0, form.length - endung.length))) {
        treffer = true
        break
      }
    }
    if (treffer) break
  }

  stammGemerkt.set(wort, treffer)
  return treffer
}

/**
 * Ob ein Wort aus geführten Stämmen zusammengesetzt ist.
 *
 * Deutsche Komposita sind der Regelfall, nicht die Ausnahme:
 * `Reisevorbereitung`, `Einreiseformular`, `Buchungsnachweis`. Die Menge bleibt
 * geschlossen, weil sich nur zusammensetzen lässt, was einzeln schon erlaubt
 * war, und weil jeder Teil mindestens vier Zeichen hat – `gerekli` lässt sich
 * so nicht in deutsche Stämme zerlegen.
 *
 * Bewusst ohne Kontextzusatz: Eigennamen stehen für sich, und ein Bindestrich
 * trennt sie ohnehin. Damit bleibt diese Prüfung rein lexikalisch und ist
 * memoisierbar.
 */
const zerlegungGemerkt = new Map<string, boolean>()

function zerlegbar(wort: string): boolean {
  if (trifftStammRein(wort)) return true
  if (wort.length < 8) return false

  const gemerkt = zerlegungGemerkt.get(wort)
  if (gemerkt !== undefined) return gemerkt

  // Vorbelegt, damit ein Zyklus über die Fugen nicht zurückläuft.
  zerlegungGemerkt.set(wort, false)

  let treffer = false
  for (let schnitt = 4; schnitt <= wort.length - 4 && !treffer; schnitt += 1) {
    if (!trifftStammRein(wort.slice(0, schnitt))) continue
    for (const fuge of ['', 's', 'n', 'en']) {
      if (wort.slice(schnitt, schnitt + fuge.length) !== fuge) continue
      const hinten = wort.slice(schnitt + fuge.length)
      if (hinten.length < 4) continue
      if (trifftStammRein(hinten) || zerlegbar(hinten)) {
        treffer = true
        break
      }
    }
  }

  zerlegungGemerkt.set(wort, treffer)
  return treffer
}

/**
 * Zahlen und Daten.
 *
 * Die frühere Ausnahme für einzelne Buchstaben ist entfernt: `V I S U M ist
 * P F L I C H T.` bestand aus lauter einzelnen Buchstaben, war damit
 * durchgelassen und für einen Leser trotzdem ein Satz. Ein Buchstabe ist nur
 * für sich harmlos, nicht in Folge. Jedes Wort muss deshalb geführt sein,
 * auch ein einbuchstabiges.
 */
function istUnbedenklich(wort: string): boolean {
  return /^[0-9]+$/.test(wort)
}

/**
 * Die Wörter eines Textes, die Jetnity nicht kennt.
 *
 * Ohne Zusatz aus dem Kontext, und das ist Absicht. Bis Runde 7 erweiterte
 * `kontextwortschatz()` die Menge um jedes Wort aus `titel` und `lage` der
 * Bezüge – darin stecken `stage.name` und `traveller.label`, und die schreibt
 * der Nutzer. Ein Etappenname `No visa is required` brachte seine eigenen
 * Wörter mit. Eine Erlaubnisliste, die der Eingang erweitern kann, ist keine.
 *
 * Eigennamen der Reise stehen deshalb nicht in der Prosa, sondern in den
 * Bezügen, die Jetnity selbst anzeigt. Die Auskunft verweist auf „die erste
 * Etappe"; wie sie heisst, schreibt Jetnity daneben.
 */
export function unbelegteWoerter(text: string): string[] {
  const unbelegt: string[] = []
  for (const roh of text.split(/[^\p{L}\p{N}]+/u)) {
    if (roh.length === 0) continue
    const wort = roh.toLocaleLowerCase('de-DE')
    if (istUnbedenklich(wort)) continue
    if (NUR_FORM.has(wort)) continue
    if (zerlegbar(wort)) continue
    if (!unbelegt.includes(roh)) unbelegt.push(roh)
  }
  return unbelegt
}
