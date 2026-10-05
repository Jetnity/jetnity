// lib/api/suchfilter.ts
//
// Suchausdrücke für PostgREST.
//
// Zwei Fehler steckten in den handgeschriebenen Ausdrücken der Admin-Routen,
// und beide blieben unsichtbar, solange die Routen ihre Fehler verschluckten:
//
//   · `security_events.user_id` ist `uuid`. `ilike` gibt es dafür nicht, die
//     Datenbank lehnte jede Suche mit „operator does not exist: uuid ~~*
//     unknown“ ab. Die Ereignissuche fand deshalb nie etwas – sie suchte gar
//     nicht.
//   · Komma, Klammer und Punkt trennen in PostgREST die Glieder eines
//     `or`-Ausdrucks. Ein Suchbegriff, der eines davon enthält, zerlegte den
//     Ausdruck. Aus einer Suche nach `a,b` wurde eine andere Abfrage als die
//     gemeinte.
//
// Beides ist hier einmal gelöst statt an jeder Fundstelle.

/** Genau die Form, die Postgres als `uuid` annimmt. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Setzt einen Wert in Anführungszeichen, damit PostgREST ihn als einen Wert
 * liest und nicht als weitere Glieder des Ausdrucks.
 */
function zitiere(wert: string): string {
  return `"${wert.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/** `ilike` über mehrere Textspalten, mit `oder` verbunden. */
export function textSuchfilter(spalten: readonly string[], suche: string): string {
  const wert = zitiere(`%${suche}%`)
  return spalten.map(spalte => `${spalte}.ilike.${wert}`).join(',')
}

/**
 * Suche über die Sicherheitsereignisse.
 *
 * Über `user_id` wird nur gesucht, wenn der Begriff eine vollständige UUID
 * ist – dann exakt. Ein Teilstück einer UUID zu suchen ist kein Bedarf, den
 * jemand hat, und wäre der Grund, wieder eine Umwandlung einzubauen, die
 * PostgREST im `or`-Baum nicht annimmt.
 */
export function ereignisSuchfilter(suche: string): string {
  const ueberText = textSuchfilter(['type', 'ip'], suche)
  return UUID.test(suche) ? `${ueberText},user_id.eq.${suche}` : ueberText
}
