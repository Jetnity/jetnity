# Jetnity – verbindlicher Standard für unabhängige Review-Tiefe

Stand: 22. August 2026

## Status

**Verbindlich für jeden neuen und bestehenden ChatGPT-Chat sowie für Cursor und andere Coding-/Review-Agents, sobald Jetnity entwickelt, geprüft, abgeschlossen, gemergt oder auf Production gebracht wird.**

Dieser Standard beschreibt nicht einen einzelnen Foundation-Review, sondern die dauerhaft erwartete Arbeitsqualität.

> **Grün ist ein Nachweis. Grün ist kein Beweis, dass kein Fehler mehr existiert.**

> **Ein Review ist erst unabhängig, wenn es aktiv versucht, die Implementierung zu widerlegen.**

---

## 1. Grundregel

Ein neuer Chat oder Agent darf einen bestehenden Abschlussbericht, grüne Tests, CI, Preview, eine Acceptance-Datei oder die Aussage eines vorherigen Agents nicht einfach übernehmen.

Vor einer Merge-, Production-, Architektur- oder fachlich kritischen Freigabe muss er den tatsächlichen aktuellen Zustand selbst prüfen und gezielt nach Fehlern suchen, die die vorhandenen Tests noch nicht abdecken.

Der Anspruch ist mindestens die Tiefe eines Senior Product / Architecture / Logic / Security / Data / UX Reviews.

---

## 2. Tatsächlichen Zustand zuerst verifizieren

Vor einer Freigabe mindestens prüfen, soweit für den Block relevant:

- aktueller Branch, PR und exakter Head-SHA
- aktueller `main`-Stand und Merge-/Sync-Zustand
- tatsächliche geänderte Dateien / Codepfade
- CI und Preview auf **genau diesem Head**
- Development-vs.-Production-Migrationsstand
- Live-DB-Schema, Constraints, Trigger, Funktionen, RLS/Rechte, wenn Datenbank betroffen ist
- Provider-/Secret-/Kill-Switch-/Kosten-Grenzen
- aktuelle Handoff-/Acceptance-/Review-Dokumentation

Nicht aus Screenshots, alten Commits oder Abschlussberichten auf den aktuellen Zustand schließen, wenn der aktuelle Zustand direkt prüfbar ist.

---

## 3. Tests nicht mit Fehlerfreiheit verwechseln

Grüne Unit-, Integration-, E2E-, UI-, Security- oder DB-Tests sind notwendige Evidenz, aber kein Freibrief.

Der unabhängige Reviewer muss zusätzlich fragen:

- Welcher reale Fehler könnte trotz dieser Tests noch existieren?
- Welche Annahme testen wir nur indirekt oder gar nicht?
- Kann ein alter Wert, Legacy-Feld oder Fallback die neue Source of Truth wieder überschreiben?
- Was passiert beim Löschen des letzten Elements, nicht nur beim Hinzufügen?
- Was passiert bei Wechsel, Retry, Reload, Parallelität, Teilerfolg oder veralteten Daten?
- Was passiert auf Production, wenn Code und Migration nicht exakt gleichzeitig verfügbar sind?

Wenn ein solcher Fall fachlich relevant ist, muss er entweder nachgewiesen oder vor Freigabe behoben werden.

---

## 4. Source-of-Truth- und Legacy-Prüfung

Bei jeder Änderung an Datenmodellen oder fachlicher Wahrheit prüfen:

- Was ist danach die **kanonische Source of Truth**?
- Gibt es alte Felder, Fallbacks, Caches oder Mapper, die gelöschte/ersetzte Wahrheit wiederherstellen können?
- Können zwei Modelle gleichzeitig unterschiedliche Antworten liefern?
- Wird `unknown` wirklich als unknown behandelt?
- Erfindet irgendein Mapping eine Beziehung, die der Nutzer oder Provider nie bestätigt hat?
- Werden Migrations-/Backfill-Daten korrekt als historisch/legacy und nicht als neue explizite Wahrheit behandelt?

**Bewusst gelöschte oder geänderte Nutzerwahrheit darf niemals durch Legacy-Daten wieder „auferstehen“.**

---

## 5. Datenbank-, Transaktions- und Parallelitätsprüfung

Wenn DB-Logik betroffen ist, darf ein Review nicht bei TypeScript aufhören.

Prüfen, soweit relevant:

- FK-Semantik inklusive `ON DELETE` / `ON UPDATE`
- NOT-NULL-/Unique-/Check-Invarianten
- RLS und Tabellen-/Funktionsrechte
- `SECURITY INVOKER` / `SECURITY DEFINER` und `search_path`
- atomare Schreibgrenzen
- Retry-/Idempotenz-Verhalten
- Teilfehler und Rollback
- konkurrierende Inserts/Updates/Deletes
- Lock-Reihenfolge und Deadlock-Risiko
- Limits unter Parallelität, nicht nur seriell
- direkte DB-/RPC-Umgehungswege außerhalb der UI

Ein lokaler Happy Path ersetzt keinen Live-Schema-Nachweis auf Development.

---

## 6. Provider-, Evidence- und Truth-Grenzen

Bei provider-neutralen oder echten externen Datenfunktionen prüfen:

- Ist der Provider-Port vollständig genug, damit ein echter Adapter später keinen Produktumbau erzwingt?
- Werden Providerdaten normalisiert und validiert?
- Sind Authority, Evidence, Freshness und Trust getrennt von Erklärung/LLM?
- Kann untrusted/stale/unknown Data versehentlich als `current` oder als Empfehlung verwendet werden?
- Enthält der Fingerprint alle Fakten, deren Änderung einen alten Nachweis ungültig machen muss?
- Werden mehrere Traveller/Credentials/Etappen/Transits getrennt statt pauschal bewertet?
- Wird aus einem Requirement-Ergebnis keine zusätzliche Pflicht/Eligibility erfunden?

LLM-Ausgaben sind niemals regulatorische, Safety-, Preis-, Verfügbarkeits- oder Provider-Truth.

---

## 7. Cross-Domain- und End-to-End-Prüfung

Eine Funktion ist nicht fertig, wenn sie nur isoliert korrekt ist.

Der Reviewer muss bei relevanten Änderungen prüfen, ob Folgen korrekt mit anderen Bereichen zusammenspielen, z. B.:

- Route / Transit
- Traveller Context
- Readiness / Entry Requirements
- Flights
- Accommodation
- Activities
- Mobility / Transfers
- Rental Cars
- Tagesplan
- Guest / Account / Guest→Account
- Multi-Destination
- Booking-/Planstatus
- Safety / Seasonal Intelligence, sobald vorhanden

Auch sequenzielle Änderungen prüfen: z. B. erst Traveller ändern, dann Route ändern, dann Reload, dann Account-Übernahme.

---

## 8. UX-/Geräteprüfung

Wenn Nutzeroberfläche oder Nutzerverständnis betroffen ist:

- Smartphone, Tablet, Landscape und Desktop gemäß Jetnity-Viewport-Standard prüfen
- nicht nur Layout, sondern Bedeutung, Status, Nutzerkontrolle und nächste Aktion
- lange Texte/Labels, leere Zustände, Fehler, unknown/stale, mehrere Traveller/Ziele
- Touch/Keyboard/Browser-spezifische Fälle soweit relevant
- keine Freigabe nur aufgrund eines einzelnen iPhone-/Desktop-Screenshots

> **Gleiche Reise. Gleiche Wahrheit. Gleiche Nutzerkontrolle. Gleich verständlich auf jedem Gerät.**

---

## 9. Deployment- und Production-Reihenfolge ist Teil des Reviews

Ein Feature kann lokal und im Preview korrekt sein und trotzdem nicht sicher deploybar.

Vor Merge/Production prüfen:

- Erwartet neuer Code bereits Tabellen, Spalten, Funktionen oder Provider, die Production noch nicht besitzt?
- Ist die Reihenfolge `expand → kompatibler Code → backfill → contract` korrekt?
- Gibt es einen Zeitraum, in dem alter Code mit neuem Schema oder neuer Code mit altem Schema bricht?
- Müssen Migration und Code in einer bestimmten Reihenfolge freigegeben werden?
- Ist ein Rollback oder ein sicherer Fallback vorhanden, wenn nötig?

**Deployment-Kompatibilität ist Produktkorrektheit.**

---

## 10. Re-Review nach Fixes

Wenn ein Review Blocker findet und Cursor sie behebt, darf der nächste Review nicht nur kontrollieren, ob die drei genannten Zeilen geändert wurden.

Er muss erneut fragen:

- Hat der Fix den ursprünglichen Fehler vollständig an allen Grenzen geschlossen?
- Hat der Fix einen neuen Fehler erzeugt?
- Gibt es noch einen tieferen Pfad derselben Problemklasse?
- Sind neue Tests echte Regressionstests oder bestätigen sie nur die Implementierung selbst?
- Ist der aktuelle Head nach den Fixes wieder vollständig geprüft?

Mehrere Review-Runden sind ausdrücklich erwünscht, wenn jede Runde neue reale Risiken findet. Geschwindigkeit hat hier geringere Priorität als belastbare Produktwahrheit.

---

## 11. Merge-/Production-Gate

Ein unabhängiger Reviewer darf Merge oder Production nicht empfehlen, wenn ein bekannter hochwirksamer Fehler offen ist, insbesondere bei:

- falscher Nutzer-/Reisewahrheit
- Datenverlust oder Wiederauferstehen gelöschter Daten
- Security/RLS/Rechte-Fehlern
- falscher regulatorischer/Safety-/Provider-Aussage
- Cross-Domain-Inkonsistenz
- nicht sicherer Deployment-Reihenfolge
- relevanter Parallelitäts-/Transaktionslücke
- fehlendem vorgeschriebenem Device-/UI-/E2E-Nachweis

Grüne Tests dürfen einen solchen bekannten Fehler nicht überstimmen.

Product-Owner-Merge-Freigabe bleibt zusätzlich immer separat erforderlich für besondere Gates. Für normale scope-treue PRs gilt seit 26./28. August 2026 die Technical-Lead-Merge-Autonomie: nur ChatGPT / Technical Lead darf Ready/Merge; Cursor-Agenten niemals. Siehe `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`. Der übrige Review-Body bleibt Evidence und wird nicht kosmetisch umgeschrieben.

---

## 12. Dokumentationspflicht

Relevante Review-Funde, Fix-Aufträge und Abschlussbewertungen werden versioniert im Repository gespeichert.

Ein neuer Chat muss erkennen können:

- welche Review-Runden bereits erfolgt sind
- welche Blocker gefunden wurden
- wie sie behoben wurden
- welche Risiken bewusst offen bleiben
- welcher exakte Head zuletzt geprüft wurde
- ob Merge und Production jeweils freigegeben oder noch offen sind

Kein wichtiger Review-Fund darf nur im Chat verschwinden.

---

## 13. Pflicht für neue Chats und Agents

Jeder neue ChatGPT-Chat, der Jetnity übernimmt, muss diese Review-Tiefe als **verbindliche Arbeitsweise** übernehmen.

Er soll nicht versuchen, schneller zu wirken, indem er vorhandene Statusmeldungen ungeprüft akzeptiert. Er soll selbstständig, kritisch und konstruktiv prüfen und bei Bedarf zusätzliche Tests/Fixes verlangen.

Das gilt auch dann, wenn:

- der vorherige Agent „fertig“ meldet
- alle Tests grün sind
- CI und Vercel grün sind
- eine Acceptance-Datei vollständig aussieht
- der Product Owner mit dem sichtbaren Ergebnis zufrieden ist

Die Aufgabe des unabhängigen Reviews ist gerade, die nicht sichtbaren Fehler vor Merge/Production zu finden.

---

## 14. Merksätze

> **Nicht bestätigen, dass es funktioniert. Versuchen zu beweisen, wo es noch brechen kann.**

> **Tests prüfen bekannte Erwartungen. Ein Senior-Review sucht zusätzlich unbekannte Fehlannahmen.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**
