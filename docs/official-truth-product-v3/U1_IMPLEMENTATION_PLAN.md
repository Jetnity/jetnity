# U1 — Besucher und Cache, Umsetzungsplan V1

Datum: 9. November 2026. Autor: Jetnity Official Truth V3 Visitor Cache 1 — Codex Generation 1, Session `/root/v3_visitor_writer`. Auftrag: #1162 / Draft #1165, `U1_TASK_V1.md` mit `U1_TASK_R2.md`. Ursprünglicher Plan auf `19c4736a73f639daaf5337465386155607792a4f`; aktualisierte verbindliche S0-R3-Basis `ab26914ff01dde64020879b9e41cea8b1e1738aa`, von Root in U1-HEAD `851876cafa78480fa5a405fcd7251ac827660b6b` integriert. Keine Ready-/Merge-/Aktivierungsentscheidung.

## Ziel und Module

Der ruhende serverseitige Leser verbindet einen vorberechneten Cache je Ziel/Staatsangehörigkeit mit getrennten aktuellen Methoden-/Versionsnachweisen. Echte erfolgreiche Leere darf begrenzt einen bestätigten Rechercheauftrag auslösen; technischer Fehler darf das nicht. Mehrere Staatsangehörigkeiten bleiben getrennte Antwortzellen. Quelle und tatsächliche Quellenzeit werden aus exakten kanonischen Pins angezeigt.

Dateien innerhalb eigener Ownership: `visitor/query.ts` (server-only Orchestrierung), `visitor/presentation.ts` (reine vollständige Darstellung), `visitor/controller.ts` (Abbruch und Antwortreihenfolge), zugehörige Tests und `components/readiness/OfficialTruthVisitorV3.tsx`. Der isolierte Harness unter `scripts/official-truth-product-v3-ui/` bündelt die echte Komponente mit vorhandener esbuild-Instanz aus tsx und den bestehenden Tailwind-/CSS-Tokens. Er bindet ausschließlich Loopback und synthetische Testantworten; Root hat diesen konkreten Plan bestätigt. Keine neue Framework-/Dependency-/Lockfileänderung.

## Datenfluss und Grenzen

Der bereits genehmigte Entwicklungsvertrag wird nur gelesen. Produktionsfactory bleibt ohne Reader, Methode, Coverageplan, Queue und Reproof. Testadapter werden explizit isoliert. Aktuelle accepted Pointer, Evidence-/Decision-/Methodenbindung und Frist müssen vor Ausgabe bestätigt werden. Ein S0-JSON-Reader erzeugt keine Autorität. „Stand vom“ bezeichnet ausschließlich die gespeicherte Quellenprüfung.

Coverage-/Methodenpläne liefern explizite bekannte globale Kontext-/Faktziele. Aus Zielland/Staatsangehörigkeit wird kein Pass, keine Reiseroute, kein Zweck und keine Frist erfunden. Ein echter Miss eines solchen Ziels wird über den abgestimmten Regelqueue-Port enqueued; „Wird geprüft“ folgt erst auf einen passenden aktiven S0-Jobrecord. Bei erfolgreich leerem Kontextplan wird seit TASK R2 die eigene neutrale S0-Combination-Discovery über einen getrennten Enqueue-Port ausgelöst. Sie enthält nur Ziel, eine Staatsangehörigkeit und Methode. Auch dort gilt echter Queue-ACK, exakte Identität und aktueller Methodenproof. Fehlerhafte Coverage-Lesung bleibt Fehler. Nicht gebundene Queue bleibt nicht verfügbar. M1 hat die Schnittstelle bestätigt; E1 verbindet die separat implementierten Module.

Kein Datenbank-/API-Routen-/Auth-/RLS-/ACL-/Credential-/Provider-/Scheduler-/Production-Eingriff, keine neuen laufenden Kosten. Keine Trips oder Personenkennungen. Keine Passnummern/MRZ/Fotos und keine Benutzer-/Session-/Reisedaten. Keine aktuelle Live-DB-Wahrheit wird aus dem lokalen Cachetest abgeleitet. #917-STOP wird nicht wiederholt, umformuliert, delegiert oder über menschliches SQL umgangen; #1131 bleibt STOP und #1135 separat.

## Prüfungen

Node-22-Tests: echte Cachetreffer und Misses, Fehler/Leere, bestätigte Queue vs Ausfall, falscher Pointer/Methodenwechsel, Ablauf während Await, getrennte Nationalitäten, Quellenpin/-zeit, Abbruch und verspätete Antworten, private oder unerwartete Eingaben. Lokaler Benchmark misst ausschließlich den Prozesspfad; öffentliches End-to-End-p95 bleibt offen. Browserharness prüft Bedienung, sichtbare Zustände, mobile Breiten und Responsewechsel mit synthetischem Material. tsc und Lint auf konkreten Dateien; vollständiger Build/CI/Preview und unabhängige Abnahme bleiben Root-Gates. Tatsächliche Ergebnisse und fehlende Bindungen werden im U1-Handoff dokumentiert.

## STOP

Kein eigener Commit/Push oder GitHubwrite, kein Ready/Merge, kein Folgeslice. Bei konkretem Reviewbefund unmittelbarer Fix in derselben Session. Root besitzt gemeinsame Architektur-/Statusdateien und die Integration mit I1/M1/E1.
