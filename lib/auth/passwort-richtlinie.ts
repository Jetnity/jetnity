// lib/auth/passwort-richtlinie.ts
//
// Die Passwortregel, die die Formulare anzeigen und prüfen – an einer Stelle.
//
// Vorher stand sie zweimal im Code und beide Male anders: `RegisterForm`
// verlangte zwölf Zeichen aus vier Gruppen, die Seite für das neue Passwort
// nach dem Rücksetzlink acht Zeichen ohne Gruppen. Der Auth-Server verlangt
// zwölf Zeichen aus vier Gruppen. Die zweite Maske versprach damit ein
// Passwort, das der Server ablehnt – und zeigte die Ablehnung anschliessend
// unübersetzt an, samt der rohen Liste erlaubter Sonderzeichen.
//
// Die Zahlen stehen nicht hier, weil jemand sie gewählt hat, sondern weil
// `supabase/config.toml` sie so festlegt. `lib/auth/passwort-richtlinie.test.ts`
// vergleicht beide Seiten bei jedem `npm test`, ohne Datenbank und ohne Netz.

export type Zeichengruppe = {
  /** Kurzer Text unter dem Feld. */
  text: string
  pruefe: (passwort: string) => boolean
}

export const PASSWORT_RICHTLINIE = {
  /** `auth.minimum_password_length` in `supabase/config.toml`. */
  mindestlaenge: 12,
  /** Entspricht `auth.password_requirements = "lower_upper_letters_digits_symbols"`. */
  gruppen: [
    { text: 'Groß- & Kleinbuchstaben', pruefe: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { text: 'Mind. 1 Zahl', pruefe: (pw: string) => /\d/.test(pw) },
    { text: 'Mind. 1 Symbol (z. B. !?@#)', pruefe: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ] as Zeichengruppe[],
} as const

/**
 * Zahl der Zeichengruppen, die der Auth-Server verlangt.
 *
 * Nicht `gruppen.length`: Die Anzeige fasst Gross- und Kleinbuchstaben zu einer
 * Zeile zusammen, weil zwei Zeilen dafür die Liste unnötig lang machen. Der
 * Server zählt sie getrennt – vier Gruppen. Der Abgleich mit `config.toml`
 * braucht diese Zahl, nicht die der Zeilen.
 */
export const GEFORDERTE_GRUPPEN = 4

/** Erfüllt das Passwort, was der Auth-Server verlangt? */
export function erfuelltRichtlinie(passwort: string): boolean {
  return (
    passwort.length >= PASSWORT_RICHTLINIE.mindestlaenge &&
    PASSWORT_RICHTLINIE.gruppen.every((gruppe) => gruppe.pruefe(passwort))
  )
}

/**
 * Bewertung von 0 bis 5 für den Balken: die geforderte Länge, ein Bonus für 16
 * Zeichen, gemischte Gross- und Kleinschreibung, eine Zahl, ein Symbol.
 */
export function passwortStaerke(passwort: string): number {
  let punkte = 0
  if (passwort.length >= PASSWORT_RICHTLINIE.mindestlaenge) punkte++
  if (passwort.length >= 16) punkte++
  for (const gruppe of PASSWORT_RICHTLINIE.gruppen) {
    if (gruppe.pruefe(passwort)) punkte++
  }
  return Math.max(0, Math.min(punkte, 5))
}

export function staerkeText(punkte: number): string {
  return ['Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark'][Math.max(0, punkte - 1)] || 'Sehr schwach'
}

/**
 * Farbe des Balkens.
 *
 * Ein Balken, der auf jeder Stufe im Markengrün steht, meldet durchgehend
 * „gut" – bei einem schwachen Passwort das falsche Signal. Die Bewertung steht
 * zusätzlich als Text daneben; die Farbe ist also nicht der einzige Träger.
 */
export function staerkeFarbe(punkte: number): string {
  if (punkte <= 2) return 'bg-destructive'
  if (punkte <= 3) return 'bg-citrus-500'
  return 'bg-primary'
}

/** Der Text, der die Anforderungen in einem Satz zusammenfasst. */
export const RICHTLINIE_TEXT = `Bitte nutze mind. ${PASSWORT_RICHTLINIE.mindestlaenge} Zeichen inkl. Groß-/Kleinbuchstaben, Zahl und Symbol.`

/** Was unter dem Feld steht, abgeleitet aus derselben Regel. */
export const RICHTLINIE_PUNKTE = [
  `Mind. ${PASSWORT_RICHTLINIE.mindestlaenge} Zeichen`,
  ...PASSWORT_RICHTLINIE.gruppen.map((g) => g.text),
]

/**
 * Warum der Auth-Server ein Passwort abgelehnt hat.
 *
 * Zwei Ablehnungen kommen aus derselben Prüfung und bedeuten Verschiedenes.
 * Die eine sagt: Die Regel ist nicht erfüllt. Die andere sagt: Die Regel ist
 * erfüllt, das Passwort steht aber in einem bekannten Datenleck. Wer beide
 * gleich beantwortet, schickt Reisende in eine Sackgasse – sie erfüllen die
 * angezeigte Liste ja bereits und probieren Varianten, die genauso scheitern.
 *
 * Seit Phase 1.4c prüft der Branch gegen HaveIBeenPwned
 * (`password_hibp_enabled`). Die Meldung dafür lautet wörtlich „Password is
 * known to be weak and easy to guess" – sie enthält weder „leaked" noch
 * „pwned" noch „breach". Nachgemessen am Development-Branch, nicht vermutet.
 *
 * Rückgabe `null`, wenn die Meldung nichts über das Passwort sagt; dann bleibt
 * die Einordnung beim Aufrufer.
 */
export function passwortAblehnung(meldung?: string | null): string | null {
  const text = (meldung || '').toLowerCase()
  if (!text) return null

  if (text.includes('known to be weak') || text.includes('easy to guess')) {
    return 'Dieses Passwort steht in einem bekannten Datenleck. Bitte wähle ein anderes.'
  }
  if (text.includes('leaked') || text.includes('pwned') || text.includes('data breach')) {
    return 'Dieses Passwort steht in einem bekannten Datenleck. Bitte wähle ein anderes.'
  }
  if (text.includes('should be at least') && text.includes('character')) {
    return RICHTLINIE_TEXT
  }
  if (text.includes('should contain at least one character')) {
    return RICHTLINIE_TEXT
  }
  if (text.includes('weak password')) {
    return RICHTLINIE_TEXT
  }

  return null
}
