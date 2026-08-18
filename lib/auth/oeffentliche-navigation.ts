// lib/auth/oeffentliche-navigation.ts
//
// Was die öffentliche Leiste zeigt, wenn eine Sitzung besteht – und was nicht.
//
// ---------------------------------------------------------------------------
// Warum das eine eigene Datei ist
// ---------------------------------------------------------------------------
//
// Bis zum Nachtrag der Phase 1.5 zeigte `PublicNavbar` immer „Anmelden“ und nie
// „Abmelden“, obwohl `signOutAction()` seit Phase 1.3 existiert. Solange dort
// nur Marketingseiten lagen, war das eine Kosmetikfrage. Mit persistenten
// privaten Reisen ist es keine mehr: Auf einem geteilten Gerät bleibt eine
// Sitzung offen, deren einziger sichtbarer Ausweg der Administrationsbereich
// wäre – den ein gewöhnliches Konto nicht betreten darf.
//
// Die Entscheidung, was in der Leiste steht, ist damit eine Regel und keine
// Darstellung. Sie steht hier, weil sie sich hier ohne Browser prüfen lässt.
//
// ---------------------------------------------------------------------------
// Drei Zustände, nicht zwei
// ---------------------------------------------------------------------------
//
// Die Leiste liegt in einem statisch ausgelieferten Layout. Die Sitzung kennt
// sie erst, wenn der Browser sie gelesen hat – für einen Moment weiss sie es
// also nicht. `unbekannt` ist deshalb ein eigener Zustand: In ihm behauptet die
// Leiste nichts. Ein „Anmelden“ als Zwischenstand wäre für ein angemeldetes
// Konto eine falsche Auskunft, und ein „Abmelden“ für einen Gast ein Angebot,
// das ins Leere führt.

export type Sitzungsstand =
  /** Noch nicht gelesen. Die Leiste sagt nichts über die Sitzung. */
  | 'unbekannt'
  /** Keine Sitzung. */
  | 'gast'
  /** Angemeldet. */
  | 'konto'

export type Navigationseintrag =
  | { art: 'link'; label: string; href: string }
  /**
   * Ein Vorgang, kein Ziel.
   *
   * Abmelden ist bewusst kein Link: Next.js lädt Links voraus und Browser holen
   * sie vor – eine Adresse, die beim Aufruf abmeldet, beendet die Sitzung, ohne
   * dass jemand geklickt hat. Der Eintrag wird deshalb als Formular mit
   * `signOutAction()` gerendert (siehe `app/auth/sign-out.ts`).
   */
  | { art: 'aktion'; label: string; aktion: 'abmelden' }

/** Die Ziele, die für alle gelten. Unabhängig von der Sitzung. */
export const HAUPTNAVIGATION = [
  { label: 'Entdecken', href: '/#entdecken' },
  { label: 'Meine Reisen', href: '/reisen' },
  { label: 'Jetnity Pro', href: '/#pro' },
] as const

/**
 * Die sitzungsabhängigen Einträge der öffentlichen Leiste.
 *
 * „Reise planen“ steht nicht darin: Der Ruf gilt in jedem Zustand und ist keine
 * Aussage über die Sitzung.
 */
export function sitzungseintraege(stand: Sitzungsstand): Navigationseintrag[] {
  switch (stand) {
    case 'konto':
      return [{ art: 'aktion', label: 'Abmelden', aktion: 'abmelden' }]
    case 'gast':
      return [{ art: 'link', label: 'Anmelden', href: '/login' }]
    case 'unbekannt':
      return []
  }
}
