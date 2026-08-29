// lib/traveller/account-registry-copy.ts
//
// Sichtbare Registry-Texte an einer Stelle. Loading, Empty und Error bleiben
// getrennte Aussagen. Kein Default-/Primary-Passwortlaut, keine Trip-Löschung.

export const REGISTRY_COPY = {
  seitenEyebrow: 'Konto',
  seitenTitel: 'Reisende',
  seitenLead:
    'Hier liegen wiederverwendbare aktuelle Angaben zu Personen in deinem Konto. Bereits angelegte Reisen behalten ihre eigenen Reisenden-Snapshots und werden durch Änderungen hier nicht umgeschrieben.',
  dualAuthorityHinweis:
    'Diese Registry ist kein Reiseplan. Eine konkrete Reise bleibt die einzige Current Truth für ihre Reisenden.',
  ladenTitel: 'Reisende werden geladen.',
  ladenText: 'Wir prüfen deinen aktuellen Speicherstand.',
  leerTitel: 'Noch keine Reisenden in deinem Konto.',
  leerText:
    'Lege eine Person an, um Staatsbürgerschaften und Dokument-Metadaten wiederverwendbar zu hinterlegen. Das erzeugt noch keine Reise und ändert vorhandene Reisen nicht.',
  fehlerTitel: 'Deine Reisenden konnten nicht geladen werden.',
  fehler503: 'Wir konnten deinen aktuellen Speicherstand gerade nicht prüfen; bitte lade später neu.',
  fehler500: 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.',
  anlegenTitel: 'Person hinzufügen',
  anlegenAktion: 'Reisenden anlegen',
  speichern: 'Speichern',
  abbrechen: 'Abbrechen',
  aendern: 'Angaben ändern',
  loeschen: 'Löschen',
  loeschenTitel: 'Registry-Eintrag löschen?',
  loeschenText:
    'Nur dieser Konto-Eintrag wird gelöscht. Bereits vorhandene Reisen und ihre Reisenden-Snapshots werden dadurch nicht umgeschrieben oder gelöscht.',
  loeschenBestaetigen: 'Eintrag löschen',
  ohneBezeichnung: 'Reisender ohne Bezeichnung',
  bezeichnungLabel: 'Bezeichnung',
  bezeichnungHinweis: 'Kurz und datensparsam. Keine Ausweisnummer, kein Geburtsdatum, keine Gesundheitsdaten.',
  wohnsitzLabel: 'Wohnsitzland (ISO-2)',
  staatsbuergerschaftenTitel: 'Staatsbürgerschaften',
  staatsbuergerschaftenHinweis:
    'Mehrere Staatsbürgerschaften sind gleichrangig. Es gibt keine primäre oder bevorzugte Staatsbürgerschaft.',
  staatsbuergerschaftHinzufuegen: 'Staatsbürgerschaft hinzufügen',
  staatsbuergerschaftEntfernen: 'Staatsbürgerschaft entfernen',
  staatsbuergerschaftLoeschenHinweis:
    'Dokumente, die dieser Staatsbürgerschaft zugeordnet waren, behalten ihre übrigen Angaben; die Zuordnung wird gelöst.',
  staatsbuergerschaftLimit: 'Höchstens 8 Staatsbürgerschaften.',
  staatsbuergerschaftDoppelt: 'Diese Staatsbürgerschaft ist bereits hinterlegt.',
  dokumenteTitel: 'Reisedokumente',
  dokumenteHinweis:
    'Nur Metadaten. Ausstellungsland und Staatsbürgerschaft sind unabhängig und werden nicht aus dem jeweils anderen Feld abgeleitet.',
  dokumentHinzufuegen: 'Dokument hinzufügen',
  dokumentEntfernen: 'Dokument entfernen',
  dokumentAendern: 'Dokument ändern',
  dokumentLimit: 'Höchstens 12 Reisedokumente.',
  dokumentTypLabel: 'Dokumenttyp',
  dokumentTypPlatzhalter: 'Typ wählen',
  dokumentTypPassport: 'Reisepass',
  dokumentTypNationalId: 'Personalausweis',
  dokumentTypUnknown: 'Unbekannt',
  dokumentIssuerLabel: 'Ausstellungsland (ISO-2)',
  dokumentIssuerHinweis: 'Kann vom Wohnsitz und von jeder Staatsbürgerschaft abweichen.',
  dokumentCitizenshipLabel: 'Zugeordnete Staatsbürgerschaft',
  dokumentCitizenshipHinweis: 'Optional. Keine Vorauswahl – auch bei nur einer Staatsbürgerschaft bleibt die Zuordnung leer, bis du sie setzt.',
  dokumentKeineZuordnung: 'Keine Zuordnung',
  dokumentGueltigLabel: 'Gültig bis',
  wohnsitzLeer: 'Wohnsitz nicht hinterlegt',
  erfolgAngelegt: 'Der Registry-Eintrag wurde angelegt.',
  erfolgGeaendert: 'Die Angaben wurden gespeichert.',
  erfolgGeloescht: 'Der Registry-Eintrag wurde gelöscht. Vorhandene Reisen bleiben unverändert.',
  erfolgCitizenship: 'Die Staatsbürgerschaft wurde gespeichert.',
  erfolgCitizenshipEntfernt: 'Die Staatsbürgerschaft wurde entfernt. Zugeordnete Dokumente behalten ihre übrigen Angaben.',
  erfolgDokument: 'Die Dokument-Metadaten wurden gespeichert.',
  erfolgDokumentEntfernt: 'Die Dokument-Metadaten wurden entfernt.',
} as const

export const REGISTRY_DOKUMENT_TYP_LABEL = {
  passport: REGISTRY_COPY.dokumentTypPassport,
  national_id: REGISTRY_COPY.dokumentTypNationalId,
  unknown: REGISTRY_COPY.dokumentTypUnknown,
} as const
