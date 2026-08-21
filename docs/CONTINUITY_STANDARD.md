# Jetnity – verbindlicher Kontinuitätsstandard

Stand: 21. August 2026

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

Keine Phase gilt als sauber abgeschlossen, wenn dieser Übergabestand nicht nachvollziehbar ist.

---

## 3. Verbindliche Projektquellen

Je nach Änderung müssen insbesondere aktuell gehalten werden:

- `JETNITY_VISION.md` – verbindlicher Produkt-Nordstern; was Jetnity ist, was es nicht ist und welche Nutzerentlastung das Produkt erreichen soll
- `JETNITY_HANDOFF.md` – kompakter aktueller Übergabestand
- `ROADMAP.md` – fertig / in Arbeit / als Nächstes / blockiert / bewusst verschoben
- `ARCHITECTURE.md` – aktuelle System- und Datenflussarchitektur
- `DECISIONS.md` – ADRs für wichtige Entscheidungen
- `DESIGN_SYSTEM.md` – verbindliche UI-/UX-Regeln
- `docs/PRODUCT_QUALITY_STANDARD.md` – Produktqualitätsanforderungen
- fachliche Modul-Dokumente, z. B. `docs/HOTELS.md`, `docs/ACTIVITIES.md`
- dieser `docs/CONTINUITY_STANDARD.md`

Aufgaben für Coding Agents sollen diese Quellen passend zum Auftrag ausdrücklich einbeziehen.

Vor jeder größeren Produkt-, UX- oder Architekturentscheidung muss `JETNITY_VISION.md` gelesen werden. Eine lokale technische Verbesserung darf den Produkt-Nordstern nicht unbemerkt verschlechtern.

---

## 4. Produkt-Nordstern darf nicht verloren gehen

Unabhängig von Phase oder Agent gelten dauerhaft folgende Leitplanken:

- Jetnity ist ein **zusammenhängendes Reisesystem**, keine Sammlung isolierter Flug-, Hotel- und Aktivitätssuchen.
- Der gemeinsame Reisegraph ist die fachliche Grundlage für bereichsübergreifende Entscheidungen.
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

Mindestens zu Beginn einer größeren Jetnity-Arbeit sollen `JETNITY_VISION.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md` und die für die Aufgabe relevanten Architektur-/Entscheidungs-/Qualitätsdokumente gelesen werden.

Der Nutzer soll dafür **nicht erneut sagen müssen**, dass sauber dokumentiert werden soll oder welches übergeordnete Produktziel Jetnity verfolgt.

Diese Regel gilt dauerhaft als Teil des Jetnity-Entwicklungsprozesses.

---

## 9. Dokumentation ist kein Ersatz für Tests

Dokumentation darf nur bestätigte Tatsachen als fertig markieren.

- keine grünen Tests erfinden
- keine Provider-Integration behaupten, wenn nur die Foundation existiert
- keine Production-Aktivierung behaupten, wenn ein Kill Switch aktiv ist
- keine Migrations-/RLS-Verifikation behaupten, wenn sie nicht durchgeführt wurde
- keine UI-Qualität behaupten, wenn der erforderliche Audit fehlt

Dokumentation muss den tatsächlichen Stand abbilden, nicht den gewünschten Stand.

Produktvision und Zielbild dürfen dagegen ausdrücklich Zukunftszustände beschreiben, müssen aber klar als Vision/Ziel und nicht als bereits umgesetzte Funktion gekennzeichnet sein.

---

## 10. Verbindliche Arbeitsweise für ChatGPT

Bei Jetnity soll ChatGPT dauerhaft:

- als Produkt-/Architektursteuerung den Gesamtfaden halten
- `JETNITY_VISION.md` als oberste Produktleitplanke bei neuen Funktionen und Architekturentscheidungen berücksichtigen
- größere Cursor-Aufträge so formulieren, dass Dokumentation Teil der Definition of Done ist
- nach Cursor-Abschluss Code, Security, CI und Produktqualität prüfen
- wichtige offene Punkte in den dauerhaften Projektquellen sichern
- neue verbindliche Produktprinzipien aus Nutzerentscheidungen in der Vision/Handoff-Dokumentation festhalten
- vor Merge und Production den aktuellen technischen Stand erneut verifizieren
- den Nutzer nicht mit bereits dokumentierten Projektfragen belasten, wenn sie aus dem Repo beantwortet werden können

---

## 11. Verbindliche Arbeitsweise für Cursor / Coding Agents

Ein Coding Agent darf eine größere Aufgabe nicht als vollständig abgeschlossen melden, solange relevante Dokumentation veraltet ist.

Vor größeren Aufgaben muss der Agent prüfen, ob seine Lösung mit dem Produkt-Nordstern vereinbar ist. Insbesondere darf ein Agent Jetnity nicht unbeabsichtigt in getrennte, voneinander unabhängige Suchprodukte zerlegen, wenn derselbe Reisegraph die Bereiche verbinden soll.

Im Abschlussbericht müssen mindestens enthalten sein:

- Umgesetzt
- Tests / CI / Build
- Security
- Datenbank / Migration / RLS
- Kosten
- Dokumentation
- offene Risiken
- externe Abhängigkeiten
- nächster Schritt

Wenn ein Punkt nicht zutrifft, ausdrücklich `keine` bzw. `nicht Teil dieser Phase` schreiben, statt ihn wegzulassen.

---

## 12. Ziel

Jetnity soll über Monate und Jahre konsistent weiterentwickelt werden können, auch wenn Chats gewechselt werden, Agenten neu gestartet werden oder einzelne Beteiligte den unmittelbaren Gesprächskontext verlieren.

**Der Projektfaden und der Produkt-Nordstern gehören ins Repository, nicht nur in den Kopf eines Agents oder in einen einzelnen Chat.**
