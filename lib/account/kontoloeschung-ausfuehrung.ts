// lib/account/kontoloeschung-ausfuehrung.ts
//
// Orchestriert eine Kontolöschung, ohne selbst Schlüssel, HTTP oder Storage
// anzufassen. Die Edge Function setzt die Abhängigkeiten.
//
// Die Löschung ist nicht atomar: Storage muss vor dem Auth-Nutzer weg sein.
// Schlägt ein späterer Schritt fehl, bleibt das Konto bestehen, obwohl schon
// Daten entfernt sein können. Das ist `teilweise_entfernt`, nicht „nichts
// geändert“. Ein Fehler vor dem ersten Remove bestätigt keine Datenänderung.

import {
  LOESCH_STATUS,
  jwtAnspruecheLesen,
  loeschAnfragePruefen,
  loeschBerechtigungPruefen,
  loeschUmgebungErlaubt,
  type LoeschKlasse,
// `.ts` ist die Auflösung des Deno-Bundlers. Ohne Endung bricht das Development-Deploy ab.
} from './kontoloeschung-vertrag.ts'

export type LoeschNutzerErgebnis =
  | { art: 'ok'; id: string; providers: string[] | null }
  | { art: 'nicht_angemeldet' }
  | { art: 'nicht_gefunden' }
  | { art: 'nicht_verfuegbar' }

export type LoeschAbhaengigkeiten = {
  jetztSekunden: () => number
  nutzer: (jwt: string) => Promise<LoeschNutzerErgebnis>
  faktoren: (userId: string) => Promise<number | null>
  speicherLoeschen: (userId: string) => Promise<'ok' | 'fehler' | 'teilweise'>
  ereignisseLoeschen: (userId: string) => Promise<'ok' | 'fehler'>
  nutzerLoeschen: (userId: string) => Promise<'ok' | 'nicht_gefunden' | 'fehler'>
}

export type LoeschErgebnis = {
  status: number
  klasse: LoeschKlasse
  schritt: string
}

export async function kontoLoeschungAusfuehren(eingabe: {
  jwt: string | null
  koerper: unknown
  supabaseUrl: string | null
  deps: LoeschAbhaengigkeiten
}): Promise<LoeschErgebnis> {
  if (!eingabe.jwt) return ergebnis('nicht_angemeldet', 'anfrage')
  if (!loeschAnfragePruefen(eingabe.koerper).ok) return ergebnis('anfrage_ungueltig', 'anfrage')
  if (!loeschUmgebungErlaubt(eingabe.supabaseUrl)) return ergebnis('umgebung_gesperrt', 'umgebung')

  const nutzer = await eingabe.deps.nutzer(eingabe.jwt)
  if (nutzer.art === 'nicht_gefunden') return ergebnis('nicht_gefunden', 'identitaet')
  if (nutzer.art === 'nicht_verfuegbar') return ergebnis('nicht_verfuegbar', 'identitaet')
  if (nutzer.art !== 'ok') return ergebnis('nicht_angemeldet', 'identitaet')

  const ansprueche = jwtAnspruecheLesen(eingabe.jwt)
  if (!ansprueche) return ergebnis('beweis_unvollstaendig', 'beweis')

  if (nutzer.providers && nutzer.providers.length > 0 && !nutzer.providers.includes('email')) {
    return ergebnis('oauth_nicht_unterstuetzt', 'beweis')
  }
  if (!nutzer.providers || !nutzer.providers.includes('email')) {
    return ergebnis('beweis_unvollstaendig', 'beweis')
  }

  const faktoren = await eingabe.deps.faktoren(nutzer.id)
  const berechtigt = loeschBerechtigungPruefen({
    userId: nutzer.id,
    tokenSub: ansprueche.sub,
    providers: nutzer.providers,
    aal: ansprueche.aal,
    amr: ansprueche.amr,
    verifiedFactorCount: faktoren,
    jetztSekunden: eingabe.deps.jetztSekunden(),
  })
  if (!berechtigt.ok) return ergebnis(berechtigt.klasse, 'beweis')

  const speicher = await eingabe.deps.speicherLoeschen(nutzer.id)
  if (speicher === 'teilweise') return ergebnis('teilweise_entfernt', 'speicher')
  if (speicher !== 'ok') return ergebnis('aufraeumen_fehlgeschlagen', 'speicher')

  const ereignisse = await eingabe.deps.ereignisseLoeschen(nutzer.id)
  if (ereignisse !== 'ok') return ergebnis('teilweise_entfernt', 'ereignisse')

  const geloescht = await eingabe.deps.nutzerLoeschen(nutzer.id)
  if (geloescht === 'nicht_gefunden') return ergebnis('nicht_gefunden', 'konto')
  if (geloescht !== 'ok') return ergebnis('teilweise_entfernt', 'konto')
  return ergebnis('geloescht', 'fertig')
}

function ergebnis(klasse: LoeschKlasse, schritt: string): LoeschErgebnis {
  return { status: LOESCH_STATUS[klasse], klasse, schritt }
}
