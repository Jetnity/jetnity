// lib/account/besuche-copy.ts
//
// Die Worte der Besuchshistorie an einer Stelle, damit Karte, Liste und
// Formular dieselbe Wahrheit gleich benennen.
//
// Zwei Formulierungen tragen hier Gewicht und sind bewusst so gewählt:
// „bestätigen“ statt „hinzufügen“, weil der Nutzer nichts einträgt, sondern
// etwas bezeugt; und „widerrufen“ statt „löschen“, weil eine Bestätigung
// zurückgenommen und nicht ein Erlebnis entfernt wird.

export const BESUCHE_COPY = {
  einstieg: 'Besuchte Orte verwalten',
  seitenEyebrow: 'Deine Welt',
  seitenTitel: 'Wo du schon warst',
  seitenLead:
    'Trage hier ein, wo du wirklich gewesen bist – auch Reisen von lange vor Jetnity. Nur was du hier bestätigst, färbt deine Karte.',
  seitenHinweis:
    'Jetnity leitet daraus nichts ab: keine Reise wird verändert, kein geplanter Ort wird dadurch besucht und kein Besuch wird aus einer Reise erzeugt.',

  anlegenTitel: 'Besuchten Ort hinzufügen',
  anlegenAktion: 'Besuch bestätigen',
  aendernTitel: 'Besuch bearbeiten',
  aendernAktion: 'Änderung speichern',
  abbrechen: 'Abbrechen',
  bearbeiten: 'Bearbeiten',
  widerrufen: 'Besuch widerrufen',
  widerrufenFrage: 'Diesen bestätigten Besuch widerrufen?',
  widerrufenBestaetigen: 'Ja, widerrufen',

  ortLabel: 'Ort',
  ortPlatzhalter: 'Stadt, Region oder Insel suchen',
  ortHinweis:
    'Wähle einen Vorschlag aus der Suche. Freier Text wird nicht als Ort gespeichert – Jetnity rät keine Geografie.',
  landLabel: 'Oder nur das Land',
  landHinweis:
    'Wenn du den Ort nicht mehr weisst, reicht das Land. Der Besuch zählt dann als Land, nicht als Ort.',
  zeitTitel: 'Wann war das?',
  zeitHinweis:
    'Alles darf leer bleiben. Ein ungefähres Jahr ist ehrlicher als ein erfundenes Datum.',
  jahrLabel: 'Jahr',
  monatLabel: 'Monat',
  tagLabel: 'Tag',
  monatOhneAngabe: 'Weiss ich nicht mehr',

  listeTitel: 'Bestätigte Besuche',
  leerTitel: 'Noch keine Besuche bestätigt',
  leerText:
    'Deine Karte bleibt neutral, bis du den ersten Besuch bestätigst. Das ist kein leerer Punktestand, sondern schlicht: Jetnity weiss es noch nicht.',
  fehlerTitel: 'Deine Besuche konnten nicht gelesen werden.',
  fehler500:
    'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.',
  fehler503:
    'Wir konnten deinen Speicherstand gerade nicht prüfen; bitte lade die Seite später neu.',

  erfolgBestaetigt: 'Besuch bestätigt.',
  erfolgGeaendert: 'Besuch geändert.',
  erfolgWiderrufen: 'Besuch widerrufen.',
} as const
