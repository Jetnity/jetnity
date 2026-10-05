# Jetnity – Citizenship Requirement Policy

Stand: 23. August 2026
Status: **verbindliche Product-Owner-Entscheidung**

## Entscheidung

Die Staatsbürgerschaft ist **keine globale Pflichtangabe beim einfachen Reise-Start**. Sie wird jedoch zur **harten fachlichen Pflichtvoraussetzung**, sobald Jetnity eine Funktion ausführen soll, deren rechtliches, regulatorisches oder offizielles Ergebnis von der Staatsbürgerschaft abhängt.

Leitsatz:

> **So wenig Fragen wie möglich. So viele wie nötig. Erst dann fragen, wenn die Antwort eine echte Entscheidung verbessert.**

## Beim Reise-Start

Jetnity darf eine Reise weiterhin ohne Staatsbürgerschaft anlegen und nicht-regulatorische Bereiche verwenden, sofern deren Ergebnis nicht davon abhängt.

Die Staatsbürgerschaft darf insbesondere nicht still aus folgenden Daten abgeleitet werden:

- Wohnsitz
- aktueller Standort
- Abflugland
- Sprache
- Profil-/Marktregion
- Domain (`jetnity.ch` etc.)

Wohnsitz, Route und Staatsbürgerschaft sind getrennte Wahrheiten.

## Wann Staatsbürgerschaft zwingend wird

Sobald Jetnity eine verlässliche staatsbürgerschaftsabhängige Official-/Regulatory-Aussage treffen soll, muss für jeden betroffenen Traveller die dafür erforderliche Citizenship-Truth vorliegen. Beispiele:

- Visum / Visa-Befreiung
- ETA / eTA / ESTA / elektronische Reisegenehmigung
- Einreiseberechtigung
- Transitbestimmungen
- Pass-/Dokumentanforderungen, wenn staatsbürgerschaftsabhängig
- Health-/Vaccination-/Health-Document-Anforderungen, wenn staatsbürgerschaftsabhängig
- andere regulatorische Requirements mit Citizenship-Abhängigkeit

Fehlt die notwendige Staatsbürgerschaft, darf Jetnity **keine definitive Official-Entscheidung erfinden**. Die Funktion muss gezielt die fehlende Information anfordern bzw. `insufficient_context` / `unknown` verwenden.

## Mehrere Staatsbürgerschaften

Die UI fragt fachlich nicht einfach nach „der Staatsbürgerschaft“, sondern unterstützt mehrere vorhandene Staatsbürgerschaften pro Traveller. Foundation E ist dafür die kanonische Source of Truth (`citizenships[]`).

Jetnity darf keine „beste“ Staatsbürgerschaft oder kein Reisedokument automatisch auswählen, wenn dafür keine belastbare Official Evidence und zulässige option-level Semantik vorliegt.

## Progressive Disclosure / UX

Die Staatsbürgerschaft soll genau dann prominent abgefragt werden, wenn sie eine bevorstehende Entscheidung verbessert. Beispielcopy:

> **Damit wir deine Einreise-, Transit- und Gesundheitsanforderungen zuverlässig prüfen können, benötigen wir die Staatsbürgerschaft der betroffenen Reisenden.**

Bei mehreren Reisenden muss Jetnity die fehlenden Angaben traveller-spezifisch auflösen können.

## Weitere fehlende Fakten

Auch eine vorhandene Staatsbürgerschaft ist nicht immer ausreichend. Wenn eine konkrete Official Evaluation zusätzlich z. B. Wohnsitz, verwendetes Credential, Route/Transit oder andere belastbare Fakten benötigt, fragt Jetnity nur diese tatsächlich entscheidungsrelevanten Fakten nach.

## Truth-/Privacy-Grenze

- keine erfundene Default-Citizenship
- kein automatisches Gleichsetzen von Residence und Citizenship
- keine Passnummern, Scans, MRZ oder biometrischen Daten für diese Entscheidung erforderlich
- `unknown` bleibt `unknown`, wenn notwendige Fakten oder Official Evidence fehlen

Diese Policy ergänzt `docs/TRAVELLER_CONTEXT.md`, `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md` und `docs/TRAVEL_READINESS.md`.
