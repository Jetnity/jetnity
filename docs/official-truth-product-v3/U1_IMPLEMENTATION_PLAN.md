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

## R3 — bestätigter enger Folgeauftrag im selben U1

Root bestätigte den Plan vor Code am 9. November 2026. Neue veröffentlichte Arbeitsbasis: `2489eb19ea16308e5d84ec96bada3edc09a76688`, Tree `c9b91a783c6fd714e01c7cd55909bb2e9d433676`; Vertrag `U1_TASK_R3.md`, #1165 Kommentar 6729484014. S0 bleibt unverändert. Zusätzlich erlaubt ist ausschließlich die additive Anpassung von `.github/workflows/ci.yml` für den eigenen isolierten UI-Job und dessen strikte Pflicht im Aggregat.

1. Bestätigtes Pending startet im vorhandenen Controller maximal sechs zusätzliche Abfragen über denselben Querypfad, mit Backoff 2/4/8/16/30/45 Sekunden und harter Gesamtdauer 120 Sekunden pro ausdrücklicher Abfrage. Keine überlappenden Requests. Auswahlwechsel, Unmount, manuelle neue Abfrage, terminaler Zustand oder Fehler beendet den Zyklus. Timer/Uhr sind für deterministische Tests injizierbar, keine neue Autorität.
2. Hintergrundabfragen behalten den Ergebnisrahmen und die Pending-Zellen, erzeugen keinen neuen Ganzseiten-Ladebildschirm und versetzen den Fokus nicht. Vorherige positive Inhalte werden während Revalidierung nicht als aktuelle Fallbacks gezeigt. Reine Anzeigefelder für Antwortzeit/Projektionsablauf begrenzen außerdem ihre Anzeigezeit; keine Änderung am S0-Vertrag. Jede neue Antwort ersetzt den vorigen Satz vollständig. Nach Budgetende ehrlicher Hinweis und vorhandene manuelle erneute Abfrage.
3. Deterministische Tests prüfen Pending→Accepted/Conflict, sechs Polls/Backoff/120-s-Grenze, Timeout, Wechsel/Unmount, verspätete Antworten, fehlende Überlappung und abgelaufene positive Anzeige. Der synthetische Harness prüft Pending→Cachetreffer tatsächlich montiert, Fokus und bestehende Layout-/Tastatur-/Privacyfälle.
4. Vor dem einzigen Browserlaunch wird ein vorhandener ausführbarer Systembrowser aus dem festgelegten nativen Muster gewählt: `/usr/bin/google-chrome`, `/usr/bin/chromium`, `/usr/bin/chromium-browser`. `chromiumSandbox: true`, keine zusätzlichen Schutz-abschwächenden Flags, kein Catch-Launch, Download oder lokaler Wiederholungsversuch der bekannten Sperre. Fehlender Browser/Launchfehler bleibt FAIL mit Artefakt.
5. Der zusätzliche CI-Job verwendet Node22, vorhandene Dependencies, Setup-/Operating-mode-Gates, U1-Tests, Harness-Typprüfung, Loopback-HTTP-Smoke, lokalen Prozessbenchmark und UI-Audit. Audit-/PNG-Artefakte sind an tatsächlichen Run und Checkout-Head gebunden und werden auch bei Fehlern gesichert. Die alten vier Jobfamilien bleiben unverändert; das bestehende Aggregat verlangt zusätzlich explizit `success` vom neuen UI-Job. Auth bleibt unverändert.
6. Lokale Tests/Types/Lint/HTTP-Smoke/YAML-/Aggregateprüfung; tatsächliche CI-Ausführung und Browserartefaktabnahme durch Root. Danach Handoff/Manifest aktualisieren und STOP. Keine Datenbank, Provider, Next-Route, Navigation, eigene GitHubmutation, Commit, Push oder Aktivierung.
