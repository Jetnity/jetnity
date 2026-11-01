# Ortssuche und Reiseplanung — Qualitätsauftrag

Stand: 1. November 2026. Owner-Auftrag: bestehende Ortssuche verbessern, ausdrücklich bereits beim Reiseplanen einschließlich Länder und Orte. Basis `main@0d813e8229f672438c59c01ffe58de53fbfbf7db` (#1102), live neu gelesen; Modus NORMAL. Keine überlappende offene Places-PR. Codex bleibt der einzige Writer und Technical Lead gemäß der übernommenen Owner-Beauftragung.

## Ziel und Umfang

Ein gemeinsamer, verständlicher und zuverlässiger Ortsweg von Startseite und `/planen` über bestätigte Auswahl, Reise-Erstellung und spätere Bearbeitung. GeoNames/OurAirports und stabile Place-IDs bleiben die Referenz. Keine neue Providerintegration, keine Buchung, kein kostenpflichtiger Dienst. Perfektion wird nicht behauptet; Abnahme erfolgt an konkreten fachlichen Invarianten und echten Abläufen.

1. Gezieltes, begrenztes Retrieval vor Ranking: exakte Treffer dürfen nicht durch beliebige Datenbankreihenfolge verschwinden; Länder-Aliase bleiben vollständig; freie Texte werden nicht zu bestätigten Orten.
2. Relevanz und Darstellung: Stadt/Region/Insel unterscheiden, verständliche Länder-/Regionsnamen; passende Schreibvarianten, Länder und Ortskontext; keine technischen Codes als vermeintliche Regionsnamen.
3. Datenbasis: aktuelle GeoNames-Verwaltungshierarchie und Suchmetadaten prüfen; Inseln nicht allein wegen fehlender Einwohnerzahl verwerfen; kontrollierter und nachvollziehbarer Import mit stabilen IDs, ohne Löschung oder Änderung persönlicher Reisen.
4. Eingabe und Bestätigung: Länder-/Ortsauswahl auch auf Startseite und im manuellen Planer prüfen; Änderungen, Reload und mehrteilige Routen behalten die bestätigte Identität. Modellauflösung bleibt konservativ und wählt keine mehrdeutigen Orte anhand des Suchrangs aus.
5. Fehler und Geschwindigkeit: bounded input/queries, tatsächliche Datenbankfehler von leeren Treffern unterscheiden; verspätete Antworten dürfen aktuelle Auswahl nicht überschreiben.

## Betroffene Flächen und Grenzen

Primär `lib/places/**`, `app/api/search/places/route.ts`, `scripts/places/importieren.ts`, gegebenenfalls additive Referenzdaten-Migration/Typen sowie `components/places/**`. Planer/Create/Änderung nur an belegten Integrationslücken. Bestehende Länder-Darstellung wiederverwenden. Runtime- und Datenverträglichkeit ausdrücklich prüfen. Keine neue Namensheuristik in 12Go, keine Änderung von Auth/RLS/Trip-Schema oder bestehender fremder STOP/HOLD-Arbeit.

Schema-/Referenzdatenänderungen werden zunächst konkret vorbereitet und lokal bzw. Development verifiziert. Eine nach Projektstandard gesondert erforderliche Production-Datenfreigabe wird erst mit geprüftem Änderungsumfang eingeholt. Normale scope-treue Codeintegration bleibt Technical-Lead-autonom. Kein Bypass.

## Arbeitsaufteilung und Prüfplan

MULTI_AGENT, one-writer/many-readers: Root implementiert und konsolidiert; unabhängige Leser prüfen Such-/Datenverträge sowie Planer-/UX-Integration. Kein Reviewer schreibt oder veröffentlicht. Keine Guardian-Identität behauptet.

Vor Änderung Regressionen reproduzieren. Tests für Länderpräfixe und -aliase (auch mehrdeutig), Bangkok/Paris Stadt und Region, Zürich/Umlaute, Inseln ohne Einwohnerzahl, gleichnamige Orte unterschiedlicher Länder, Rollen Ziel/Abreise, manipulierte Eingaben, Fehler/Leerzustand, Wechsel/Abbruch und bestätigte IDs. Datenbank- und Querypläne prüfen, wenn betroffen. Isolierter Browser: Startseite → Planen → künstliche Gastreise → Bearbeitung/Reload, Tastatur, Smartphone/Tablet/Desktop, lange Namen. Keine privaten Reisen und kein kostenpflichtiger Modellaufruf für den Test.

Abnahme: gezielte und relevante Integrationstests, Typecheck, Lint, Hygiene, Build, unabhängiger Review, native Exact-Head-CI, gehostete Vorschau, anschließend normaler Release und begrenzte Live-Nachkontrolle soweit alle dafür erforderlichen Gates vorliegen. Dokumentation/ADR/Roadmap/Continuity festhalten. Neue laufende Kosten: keine geplant. Risiken: weltweite Mehrdeutigkeit, Importmenge, Retrieval-Grenzen, Deployment-Reihenfolge, Bestandskompatibilität; sichtbar prüfen statt verdecken.
