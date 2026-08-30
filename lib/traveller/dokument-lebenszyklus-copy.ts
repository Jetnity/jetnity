// lib/traveller/dokument-lebenszyklus-copy.ts
//
// Sichtbare TA-DL1-Texte. Nur Kalenderdatum gegen einen expliziten Kontext.
// Keine Einreise-/Visum-/Bordkarten-Aussage, kein Default-/Primary-Credential.

export const DOKUMENT_LEBENSZYKLUS_COPY = {
  kontoFehlt: 'Ablaufdatum nicht hinterlegt.',
  kontoUngueltig: 'Gespeichertes Ablaufdatum ist nicht als Kalendertag lesbar.',
  kontoOhneReferenz: 'Ohne heutigen Kalendertag keine Ablauf-Einordnung.',
  kontoAbgelaufen: 'Dieses Dokument ist vor dem heutigen Kalendertag abgelaufen.',
  kontoNichtAbgelaufen: 'Das Ablaufdatum liegt nicht vor dem heutigen Kalendertag.',
  kontoHinweis:
    'Nur das gespeicherte Ablaufdatum relativ zum heutigen Kalendertag. Keine Aussage, ob das Dokument genügt.',
  reiseVorBeginn: 'Das Ablaufdatum liegt vor Reisebeginn.',
  reiseWaehrend: 'Das Ablaufdatum liegt während der Reise und vor Reiseende.',
  reiseNichtVorEnde:
    'Das Ablaufdatum liegt nicht vor Reiseende. Das ist kein Nachweis, dass das Dokument genügt.',
  reiseFehlt: 'Ablaufdatum nicht hinterlegt.',
  reiseUngueltig: 'Gespeichertes Ablaufdatum ist nicht als Kalendertag lesbar.',
  reiseOhneZeitraum:
    'Ohne vollständigen Reisezeitraum kann das Ablaufdatum nicht zur Reise eingeordnet werden.',
  reiseHinweis:
    'Jedes Dokument wird einzeln nur mit den Reisedaten verglichen. Keine automatische Dokumentwahl.',
} as const
