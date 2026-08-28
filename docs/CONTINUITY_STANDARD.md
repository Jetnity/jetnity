# Jetnity – verbindlicher Kontinuitätsstandard

Stand: 26. August 2026

## Status

**Verbindlich für ChatGPT als Produkt-/Architektursteuerung und für Cursor bzw. andere Coding Agents.**

Jetnity darf nicht davon abhängen, dass ein einzelner Chat, Agent oder eine einzelne Sitzung den vollständigen Gesprächskontext behält.

Die Projektdokumentation im Repository ist die dauerhafte Source of Truth für Fortschritt, Architektur, Produktvision, Entscheidungen, offene Abhängigkeiten und nächste Schritte.

---

## 1. Grundregel

Nach jeder relevanten Entwicklungsarbeit muss Jetnity so dokumentiert sein, dass ein neuer Agent oder ein neuer Chat die Arbeit ohne Rätselraten fortsetzen kann.

Der Nutzer muss den Projektstand, frühere Entscheidungen oder bereits bekannte Blocker **nicht erneut erklären**.

Wenn Kontext fehlt, muss der Agent zuerst die dokumentierten Projektquellen lesen bzw. den aktuellen Repository-Stand prüfen, statt den Nutzer um eine Wiederholung zu bitten oder aus Erinnerung zu raten.

---

## 2. Was dauerhaft dokumentiert werden muss

Mindestens bei jeder größeren Phase oder relevanten Änderung:

- aktueller Entwicklungsstand und abgeschlossene Phasen
- aktueller Branch / PR / Head-Commit, wenn relevant
- was bereits in `main` bzw. Production ist
- was nur Preview/Draft ist
- offene Provider-/API-/Key-Abhängigkeiten
- bewusst deaktivierte Production-Funktionen / Kill Switches
- wichtige Architektur- und Security-Grenzen
- relevante Datenbank-/RLS-/Migrationsentscheidungen
- bekannte Risiken und technische Schulden
- Kostenfolgen bzw. ausdrücklich keine neuen laufenden Kosten
- Tests, CI, Build und relevante UI-/Mobile-Audits
- bewusste Nicht-Ziele und verschobene Punkte
- der konkrete nächste empfohlene Schritt
- relevante neue Produktprinzipien, die die langfristige Jetnity-Vision verändern oder präzisieren
- fachliche Invarianten und Logic-/Truth-Regeln, wenn eine Phase neue bereichsübergreifende Logik einführt oder verändert

Keine Phase gilt als sauber abgeschlossen, wenn dieser Übergabestand nicht nachvollziehbar ist.

---

## 3. Verbindliche Projektquellen

Je nach Änderung müssen insbesondere aktuell gehalten werden:

- `JETNITY_START_HERE.md` – kanonischer erster Einstieg für neue Chats und Agenten
- `JETNITY_VISION.md` – verbindlicher Produkt-Nordstern; was Jetnity ist, was es nicht ist und welche Nutzerentlastung das Produkt erreichen soll
- `JETNITY_HANDOFF.md` – kompakter aktueller Übergabestand. Operative Git-/PR-Wahrheit steht hier, in `docs/ACTIVE_WORK_STATUS.md` und im jeweils neuesten `docs/CHATGPT_*_CHECKPOINT_*.md`, nicht in historischen Slice-/Provider-Statusdateien
- `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md` – aktueller Continuity-Checkpoint am 26. August 2026; ältere Checkpoints bleiben historical evidence
- `ROADMAP.md` – fertig / in Arbeit / als Nächstes / blockiert / bewusst verschoben
- `ARCHITECTURE.md` – aktuelle System- und Datenflussarchitektur
- `DECISIONS.md` – ADRs für wichtige Entscheidungen
- `DESIGN_SYSTEM.md` – verbindliche UI-/UX-Regeln
- `docs/PRODUCT_QUALITY_STANDARD.md` – Produktqualitätsanforderungen
- `docs/LOGIC_STANDARD.md` – verbindliche Regeln für Datenwahrheit, Source of Truth, fachliche Invarianten, Zustände und bereichsübergreifende Konsistenz
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` – verbindliche Tiefe für unabhängige Reviews, Re-Reviews, Merge- und Production-Empfehlungen
- fachliche Modul-Dokumente, z. B. `docs/HOTELS.md`, `docs/ACTIVITIES.md`, `docs/MOBILITY.md`, `docs/RENTAL_CARS.md`, `docs/TRAVEL_READINESS.md`, `docs/ROUTE_TRANSIT_INTELLIGENCE.md`, `docs/TRAVELLER_CONTEXT.md`, `docs/TRAVEL_SAFETY_DISRUPTION.md`, `docs/TRAVEL_TIMING_SEASONAL.md`
- Trip Workspace: `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`, `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`, `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`, `docs/TRIP_WORKSPACE_TW1_TASK.md`, `docs/TRIP_WORKSPACE_TW1_STATUS.md`, `docs/TRIP_WORKSPACE_TW2_TASK.md`, `docs/TRIP_WORKSPACE_TW2_STATUS.md`, `docs/TRIP_WORKSPACE_TW4_TASK.md`, `docs/TRIP_WORKSPACE_TW4_STATUS.md`, plus Audit-Evidence `docs/TRIP_WORKSPACE_AUDIT.md`, `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`, `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`, `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`, `docs/TRIP_WORKSPACE_HANDOFF.md`
- Provider-Readiness-Audit: `docs/PROVIDER_READINESS_AUDIT.md`, `docs/PROVIDER_READINESS_MATRIX.md`, `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md`, `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`
- Admin Slice B: `docs/ADMIN_PLATFORM_SLICE_B_STATUS.md`, `docs/ADMIN_PLATFORM_SLICE_B_HANDOFF.md`, `docs/ADR_0159_ADMIN_SLICE_B.md`
- Admin Slice C: `docs/ADMIN_PLATFORM_SLICE_C_STATUS.md`, `docs/ADMIN_PLATFORM_SLICE_C_HANDOFF.md`, `docs/ADR_0162_ADMIN_SLICE_C.md`
- Admin AAL2 Production Alignment (`P1-AAL2-PROD-01`): `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_IMPLEMENTATION_TASK_2026-08-27.md`, `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_STATUS_2026-08-27.md`, `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_PLAYBOOK_2026-08-27.md`, `docs/QS2_ADMIN_AAL2_PRODUCTION_RECONCILIATION_TASK_2026-08-27.md`. Operative Git-/PR-Wahrheit bleibt Technical-Lead-Continuity (`JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`); dieser Slice ändert jene Dateien nicht.
- Account AP-3: `docs/ACCOUNT_AP3_STATUS.md`, `docs/ACCOUNT_AP3_HANDOFF.md`
- Provider-Readiness S3: `docs/PROVIDER_READINESS_S3_STATUS.md`, `docs/PROVIDER_READINESS_S3_HANDOFF.md`, `docs/PROVIDER_READINESS_S3_SELF_REVIEW.md`
- dieser `docs/CONTINUITY_STANDARD.md`

Aufgaben für Coding Agents sollen diese Quellen passend zum Auftrag ausdrücklich einbeziehen.

Vor jeder größeren Produkt-, UX-, Logik- oder Architekturentscheidung müssen `JETNITY_VISION.md` und `docs/LOGIC_STANDARD.md` gelesen werden. Vor unabhängigen Abschlussreviews, Merge-/Production-Empfehlungen und Re-Reviews muss zusätzlich `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` gelesen und angewendet werden. Eine lokale technische Verbesserung darf den Produkt-Nordstern oder die fachliche Konsistenz nicht unbemerkt verschlechtern.

---

## 4. Produkt-Nordstern darf nicht verloren gehen

Unabhängig von Phase oder Agent gelten dauerhaft folgende Leitplanken:

- Jetnity ist ein **zusammenhängendes Reisesystem**, keine Sammlung isolierter Flug-, Hotel- und Aktivitätssuchen.
- Der gemeinsame Reisegraph ist die fachliche Grundlage für bereichsübergreifende Entscheidungen.
- **Logik, Datenwahrheit und bereichsübergreifende Konsistenz gehören zu den höchsten Entwicklungsprioritäten – auf derselben Ebene wie Security, Datenintegrität und Produktqualität.**
- Für dieselbe fachliche Information soll es genau eine maßgebliche Source of Truth geben; konkurrierende Parallelwahrheiten sind zu vermeiden.
- Unbekannt bleibt unbekannt. Jetnity darf nie mehr behaupten, als vertrauenswürdige strukturierte Daten oder ausdrücklich gekennzeichnete Nutzerangaben belegen.
- Kein bekannter fachlicher Wahrheits- oder Logikfehler darf als „spätere Optimierung“ in einen Merge verschoben werden, wenn er falsche Nutzerentscheidungen verursachen kann.
- Vorhandener Reisekontext soll wiederverwendet werden, statt den Nutzer dieselben Informationen erneut eingeben oder selbst zusammenführen zu lassen.
- Jetnity soll konkret **Zeit, Suchaufwand, Doppelarbeit, Entscheidungsstress und organisatorische Reibung** reduzieren.
- Änderungen an einem Reisebestandteil sollen auf Auswirkungen auf die Gesamtreise geprüft werden.
- Jetnity analysiert, erklärt und empfiehlt; wichtige Änderungen werden nicht still vorgenommen.
- Nutzerbindung soll aus echtem Nutzen, Vertrauen, Zeitersparnis und geringerem Reisestress entstehen – nicht aus Dark Patterns oder künstlicher Abhängigkeit.
- Die erste vollständig mit Jetnity geplante/begleitete Reise ist ein zentraler Produkttest: Der Nutzer soll deutlich erleben, wie viel Arbeit Jetnity abnimmt, und Jetnity bei der nächsten Reise als natürlichen Ausgangspunkt wählen wollen.
- Vor und während der Reise soll Jetnity langfristig proaktiv mitdenken, aber nur auf Basis belastbarer Daten; unbekannt bleibt unbekannt.

Wenn eine neue Funktion diesem Nordstern nicht dient und auch keinen notwendigen technischen Unterbau für den Produktkern liefert, soll sie nicht gebaut werden.

---

## 5. Übergabe nach jeder Phase

Der Abschluss einer Phase muss mindestens beantworten:

1. Was wurde umgesetzt?
2. Was wurde bewusst nicht umgesetzt?
3. Welche Dateien / Module / Schnittstellen sind maßgeblich?
4. Welche Tests und Audits sind grün?
5. Welche Risiken oder Einschränkungen bleiben?
6. Gibt es fehlende Provider-Zugänge, Keys oder externe Freigaben?
7. Was ist Preview-only bzw. Production-off?
8. Entstehen neue laufende Kosten?
9. Was ist der nächste konkrete Schritt?
10. Welche Entscheidung braucht noch eine Nutzerfreigabe?
11. Wurde die Produktvision durch diese Phase verändert oder präzisiert, und falls ja: ist `JETNITY_VISION.md` aktualisiert?
12. Welche fachlichen Invarianten / Truth-Regeln gelten und sind sie in `docs/LOGIC_STANDARD.md`, ADRs oder dem zuständigen Moduldokument nachvollziehbar?

---

## 6. Externe Abhängigkeiten nicht vergessen

Fehlende externe Zugänge oder Freigaben dürfen niemals durch spätere Arbeiten „aus der Dokumentation verschwinden“.

Beispiele:

- Booking.com Demand API / Managed Affiliate Partner Zugang
- HBX als Hotel-Backup
- Duffel Production-Zugang
- erster echter Activity-Provider
- Provider-Keys / Secrets

Solange eine solche Abhängigkeit offen ist, muss sie im Handoff/Roadmap oder zuständigen Moduldokument sichtbar bleiben, bis sie nachweislich erledigt wurde.

---

## 7. Keine Scheinsicherheit durch Chat-Erinnerung

ChatGPT und Coding Agents dürfen sich nicht ausschließlich auf Gesprächserinnerung oder Session-Kontext verlassen.

Vor einer größeren Weiterentwicklung oder vor Merge-/Production-Entscheidungen muss der aktuelle Repository-/PR-/CI-Stand geprüft werden.

Wenn Erinnerung und Repository widersprechen, gilt nicht automatisch die Erinnerung. Der Widerspruch muss geprüft und geklärt werden.

---

## 8. Neue Chats / neue Agents

Ein neuer Chat oder Agent soll Jetnity anhand der Repository-Dokumentation übernehmen können.

Mindestens zu Beginn einer größeren Jetnity-Arbeit sollen `JETNITY_VISION.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `docs/PRODUCT_QUALITY_STANDARD.md`, `docs/LOGIC_STANDARD.md`, `docs/CONTINUITY_STANDARD.md`, `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und die für die Aufgabe relevanten Architektur-/Entscheidungs-/Moduldokumente gelesen werden.

Der Nutzer soll dafür **nicht erneut sagen müssen**, dass sauber dokumentiert werden soll, welches übergeordnete Produktziel Jetnity verfolgt, dass Logik und bereichsübergreifende Konsistenz höchste Priorität haben oder dass unabhängige Reviews kritisch und tief statt als bloße Bestätigung grüner Tests durchgeführt werden sollen.

Jeder neue ChatGPT-Chat übernimmt ausdrücklich dieselbe Review-Verantwortung: tatsächlichen Head/Repo/CI/DB-/Production-Stand selbst prüfen, vorhandene Abschlussmeldungen nicht ungeprüft übernehmen, grüne Tests als Evidenz statt als Fehlerfreiheitsbeweis behandeln und aktiv nach Source-of-Truth-, Legacy-, Deployment-, Parallelitäts-, Provider-, Cross-Domain- und Edge-Case-Fehlern suchen.

Diese Regel gilt dauerhaft als Teil des Jetnity-Entwicklungsprozesses.

---

## 9. Dokumentation ist kein Ersatz für Tests

Dokumentation darf nur bestätigte Tatsachen als fertig markieren.

- keine grünen Tests erfinden
- keine Provider-Integration behaupten, wenn nur die Foundation existiert
- keine Production-Aktivierung behaupten, wenn ein Kill Switch aktiv ist
- keine Migrations-/RLS-Verifikation behaupten, wenn sie nicht durchgeführt wurde
- keine UI-Qualität behaupten, wenn der erforderliche Audit fehlt
- keine fachliche Abdeckung oder Buchung behaupten, wenn die zugrunde liegenden Daten den Zustand nicht sicher beweisen

Dokumentation muss den tatsächlichen Stand abbilden, nicht den gewünschten Stand.

Produktvision und Zielbild dürfen dagegen ausdrücklich Zukunftszustände beschreiben, müssen aber klar als Vision/Ziel und nicht als bereits umgesetzte Funktion gekennzeichnet sein.

---

## 10. Verbindliche Arbeitsweise für ChatGPT

Bei Jetnity soll ChatGPT dauerhaft:

- als Produkt-/Architektursteuerung den Gesamtfaden halten
- `JETNITY_VISION.md` als oberste Produktleitplanke bei neuen Funktionen und Architekturentscheidungen berücksichtigen
- `docs/LOGIC_STANDARD.md` als verbindliche Leitplanke für fachliche Wahrheit, Source of Truth und bereichsübergreifende Konsistenz anwenden
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` als verbindliche Mindesttiefe für Reviews, Re-Reviews und Merge-/Production-Empfehlungen anwenden
- größere Cursor-Aufträge so formulieren, dass Dokumentation und Logic-/Truth-Prüfung Teil der Definition of Done sind
- nach Cursor-Abschluss Code, Security, CI, Produktqualität und fachliche Annahmen unabhängig prüfen
- dabei nicht nur kontrollieren, ob der Auftrag formal erfüllt ist, sondern aktiv versuchen, die Implementierung durch Gegenbeispiele, negative Fälle, alte Fallbacks, Lösch-/Reload-/Retry-/Parallelitäts- und Deployment-Szenarien zu widerlegen
- wichtige offene Punkte in den dauerhaften Projektquellen sichern
- neue verbindliche Produktprinzipien aus Nutzerentscheidungen in der Vision/Handoff-Dokumentation festhalten
- vor Merge und Production den aktuellen technischen und fachlichen Stand erneut verifizieren
- den Nutzer nicht mit bereits dokumentierten Projektfragen belasten, wenn sie aus dem Repo beantwortet werden können

---

## 11. Verbindliche Arbeitsweise für Cursor / Coding Agents

Ein Coding Agent darf eine größere Aufgabe nicht als vollständig abgeschlossen melden, solange relevante Dokumentation veraltet ist.

Vor größeren Aufgaben muss der Agent prüfen, ob seine Lösung mit dem Produkt-Nordstern und `docs/LOGIC_STANDARD.md` vereinbar ist. Insbesondere darf ein Agent Jetnity nicht unbeabsichtigt in getrennte, voneinander unabhängige Suchprodukte oder konkurrierende fachliche Wahrheiten zerlegen, wenn derselbe Reisegraph die Bereiche verbinden soll.

Bei neuer oder geänderter Kernlogik muss der Agent außerdem negative und mehrdeutige Fälle prüfen und dokumentieren: fehlende Daten, falsche Route, gleicher Tag aber anderer Zusammenhang, Mehrfachtreffer, Zustandswechsel sowie Fehler-vs.-Leerzustände, soweit fachlich relevant.

Im Abschlussbericht müssen mindestens enthalten sein:

- Umgesetzt
- Tests / CI / Build
- Security
- Datenbank / Migration / RLS
- Logic / Truth / bereichsübergreifende Auswirkungen
- Kosten
- Dokumentation
- offene Risiken
- externe Abhängigkeiten
- nächster Schritt

Wenn ein Punkt nicht zutrifft, ausdrücklich `keine` bzw. `nicht Teil dieser Phase` schreiben, statt ihn wegzulassen.

---

## 12. Ziel

Jetnity soll über Monate und Jahre konsistent weiterentwickelt werden können, auch wenn Chats gewechselt werden, Agenten neu gestartet werden oder einzelne Beteiligte den unmittelbaren Gesprächskontext verlieren.

**Der Projektfaden, der Produkt-Nordstern, die fachlichen Wahrheitsregeln und die Review-Tiefe gehören ins Repository, nicht nur in den Kopf eines Agents oder in einen einzelnen Chat.**

Verbindlicher Merksatz aus `docs/LOGIC_STANDARD.md`:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

---

## 13. Operativer Handoff zwischen ChatGPT und Cursor

Für jeden größeren neuen Entwicklungsblock gilt zusätzlich verbindlich:

1. **ChatGPT prüft zuerst den tatsächlichen Repository-/PR-/CI-/Production-Stand**, statt nur aus Gesprächserinnerung fortzusetzen.
2. Der konkrete Arbeitsauftrag für Cursor wird **dauerhaft im Repository** auf dem zuständigen Feature-Branch hinterlegt, bevorzugt unter `docs/CURSOR_<THEMA>_TASK.md` bzw. als ausdrücklich verlinkter verbindlicher Nachtrag.
3. Der Draft-PR verweist auf diesen Auftrag als maßgebliche Arbeitsgrundlage.
4. Neue Produktentscheidungen des Nutzers, die den laufenden Auftrag verändern, werden **nicht nur im Chat belassen**, sondern als versionierter Nachtrag/ADR/Handoff im Repository gesichert. Bei Widerspruch muss klar dokumentiert sein, welche neuere Quelle gilt.
5. Cursor soll bei einem laufenden Auftrag bereits begonnene valide Arbeit **nicht unnötig neu aufbauen**, sondern den Branch synchronisieren und gegen den neueren Auftrag prüfen/refactoren.
6. Nach Abschluss oder vor einem Agent-/Chat-Wechsel müssen `JETNITY_HANDOFF.md`, `ROADMAP.md` und die relevanten Fach-/ADR-Dokumente den tatsächlichen Stand enthalten: Branch, PR, Head, Development/Production-Grenze, Tests, offene externe Abhängigkeiten, Kosten, Risiken und nächster Schritt.
7. Ein neuer ChatGPT-Chat oder Cursor-Agent soll danach anhand des Repositorys feststellen können:
   - **wo Jetnity steht**,
   - **wie gearbeitet werden soll**,
   - **welcher Auftrag aktuell gilt**,
   - **was nicht erneut gebaut werden darf**,
   - **welche Entscheidungen bereits verbindlich sind**,
   - **welche Freigaben noch fehlen**,
   ohne dass der Nutzer den Projektverlauf erneut erzählen muss.

Dieser operative Handoff ist kein optionaler Komfort, sondern Teil der Definition of Done für größere Jetnity-Arbeiten.

---

## 14. Verbindliche Review-Tiefe über Chat-/Agent-Wechsel

Der Product Owner hat ausdrücklich festgelegt, dass jeder neue Chat und Agent mindestens dieselbe kritische Gründlichkeit beibehalten muss wie ein guter unabhängiger Senior-Review.

Verbindliche Detailregel: `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`.

Das bedeutet insbesondere:

- Abschlussberichte und grüne Tests werden **nicht** als Ersatz für einen eigenen Review akzeptiert.
- Der Reviewer prüft den exakten aktuellen Head und relevante Live-Grenzen selbst.
- Er sucht aktiv nach Fehlern außerhalb der bestehenden Tests.
- Source-of-Truth-/Legacy-Wiederauferstehung, Delete/Reload, Guest→Account, Cross-Domain, Provider-/Evidence-/Fingerprint, DB-/RLS-/Transaktion/Parallelität, Device-UX und Deployment-Reihenfolge gehören je nach Scope ausdrücklich zur Prüfung.
- Fixes werden re-reviewed; dabei wird auch geprüft, ob sie neue oder tiefere Fehler derselben Problemklasse erzeugt haben.
- Ein bekannter hochwirksamer Fehler darf nicht durch „alles grün“ überstimmt werden.
- Relevante Findings werden versioniert, damit der nächste Chat nicht wieder bei null beginnt.

> **Nicht nur bestätigen, dass es funktioniert. Aktiv prüfen, wo es noch brechen kann.**
