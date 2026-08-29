// lib/traveller/account-registry-trip-copy.ts
//
// Sichtbare AP-7-S4-Texte. Loading, Empty und Error bleiben getrennte
// Aussagen. Kein Default-/Primary-Passwortlaut, keine Live-Verknüpfung.

export const REGISTRY_TRIP_COPY = {
  titel: 'Gespeicherten Reisenden hinzufügen',
  hinweis:
    'Es entsteht eine Kopie nur für diese Reise. Spätere Änderungen oder das Löschen des gespeicherten Reisenden ändern diese Reise nicht automatisch.',
  aktion: 'In diese Reise übernehmen',
  bestaetigen: 'Kopie für diese Reise erzeugen',
  abbrechen: 'Abbrechen',
  pending: 'Reisender wird übernommen …',
  leerTitel: 'Noch keine gespeicherten Reisenden.',
  leerText:
    'Lege zuerst eine Person unter Konto → Reisende an. Das ist kein Ladefehler und erzeugt noch keine Reise-Kopie.',
  leerLink: 'Gespeicherte Reisende verwalten',
  fehlerTitel: 'Gespeicherte Reisende konnten nicht geladen werden.',
  fehler503: 'Wir konnten deinen aktuellen Speicherstand gerade nicht prüfen; bitte lade später neu.',
  fehler500: 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.',
  limit:
    'Diese Reise hat bereits die maximale Anzahl Reisender. Entferne zuerst ein Profil, bevor du eine gespeicherte Person übernimmst.',
  erfolg: 'Die Person wurde als eigenständiger Snapshot in diese Reise übernommen.',
  nichtAngemeldet: 'Für diesen Schritt ist eine Anmeldung erforderlich. Bitte melde dich erneut an.',
  eingabeUngueltig: 'Diese Übernahme ist ungültig.',
  nichtGefunden: 'Dieser gespeicherte Reisende wurde nicht gefunden.',
  ungueltig: 'Dieser gespeicherte Reisende konnte nicht sicher gelesen werden. Es wurde nichts gespeichert.',
  lesefehler503:
    'Der gespeicherte Reisende konnte gerade nicht geladen werden. Bitte versuche es in einem Moment erneut.',
  lesefehler500: 'Der gespeicherte Reisende konnte nicht geladen werden. Es wurde nichts gespeichert.',
  reiseFehlt: 'Diese Reise wurde nicht gefunden.',
  reiseLesefehler503:
    'Die Reise konnte gerade nicht geladen werden. Bitte versuche es in einem Moment erneut.',
  reiseLesefehler500: 'Die Reise konnte nicht geladen werden.',
  projektion:
    'Die Angaben konnten nicht als unabhängige Reise-Kopie erzeugt werden. Es wurde nichts gespeichert.',
  staatsbuergerschaften: 'Staatsbürgerschaften',
  dokumente: 'Reisedokumente',
  wohnsitz: 'Wohnsitz',
  wohnsitzLeer: 'Wohnsitz nicht hinterlegt',
  ohneBezeichnung: 'Reisender ohne Bezeichnung',
} as const
