# Jetnity – verbindlicher Kontinuitätsstandard

Stand: 21. August 2026

## Status

**Verbindlich für ChatGPT als Produkt-/Architektursteuerung und für Cursor bzw. andere Coding Agents.**

Jetnity darf nicht davon abhängen, dass ein einzelner Chat, Agent oder eine einzelne Sitzung den vollständigen Gesprächskontext behält.

Die Projektdokumentation im Repository ist die dauerhafte Source of Truth für Fortschritt, Architektur, Entscheidungen, offene Abhängigkeiten und nächste Schritte.

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

Keine Phase gilt als sauber abgeschlossen, wenn dieser Übergabestand nicht nachvollziehbar ist.

---

## 3. Verbindliche Projektquellen

Je nach Änderung müssen insbesondere aktuell gehalten werden:

- `JETNITY_HANDOFF.md` – kompakter aktueller Übergabestand
- `ROADMAP.md` – fertig / in Arbeit / als Nächstes / blockiert / bewusst verschoben
- `ARCHITECTURE.md` – aktuelle System- und Datenflussarchitektur
- `DECISIONS.md` – ADRs für wichtige Entscheidungen
- `DESIGN_SYSTEM.md` – verbindliche UI-/UX-Regeln
- `docs/PRODUCT_QUALITY_STANDARD.md` – Produktqualitätsanforderungen
- fachliche Modul-Dokumente, z. B. `docs/HOTELS.md`, `docs/ACTIVITIES.md`
- dieser `docs/CONTINUITY_STANDARD.md`

Aufgaben für Coding Agents sollen diese Quellen passend zum Auftrag ausdrücklich einbeziehen.

---

## 4. Übergabe nach jeder Phase

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

---

## 5. Externe Abhängigkeiten nicht vergessen

Fehlende externe Zugänge oder Freigaben dürfen niemals durch spätere Arbeiten „aus der Dokumentation verschwinden“.

Beispiele:

- Booking.com Demand API / Managed Affiliate Partner Zugang
- HBX als Hotel-Backup
- Duffel Production-Zugang
- erster echter Activity-Provider
- Provider-Keys / Secrets

Solange eine solche Abhängigkeit offen ist, muss sie im Handoff/Roadmap oder zuständigen Moduldokument sichtbar bleiben, bis sie nachweislich erledigt wurde.

---

## 6. Keine Scheinsicherheit durch Chat-Erinnerung

ChatGPT und Coding Agents dürfen sich nicht ausschließlich auf Gesprächserinnerung oder Session-Kontext verlassen.

Vor einer größeren Weiterentwicklung oder vor Merge-/Production-Entscheidungen muss der aktuelle Repository-/PR-/CI-Stand geprüft werden.

Wenn Erinnerung und Repository widersprechen, gilt nicht automatisch die Erinnerung. Der Widerspruch muss geprüft und geklärt werden.

---

## 7. Neue Chats / neue Agents

Ein neuer Chat oder Agent soll Jetnity anhand der Repository-Dokumentation übernehmen können.

Der Nutzer soll dafür **nicht erneut sagen müssen**, dass sauber dokumentiert werden soll.

Diese Regel gilt dauerhaft als Teil des Jetnity-Entwicklungsprozesses.

---

## 8. Dokumentation ist kein Ersatz für Tests

Dokumentation darf nur bestätigte Tatsachen als fertig markieren.

- keine grünen Tests erfinden
- keine Provider-Integration behaupten, wenn nur die Foundation existiert
- keine Production-Aktivierung behaupten, wenn ein Kill Switch aktiv ist
- keine Migrations-/RLS-Verifikation behaupten, wenn sie nicht durchgeführt wurde
- keine UI-Qualität behaupten, wenn der erforderliche Audit fehlt

Dokumentation muss den tatsächlichen Stand abbilden, nicht den gewünschten Stand.

---

## 9. Verbindliche Arbeitsweise für ChatGPT

Bei Jetnity soll ChatGPT dauerhaft:

- als Produkt-/Architektursteuerung den Gesamtfaden halten
- größere Cursor-Aufträge so formulieren, dass Dokumentation Teil der Definition of Done ist
- nach Cursor-Abschluss Code, Security, CI und Produktqualität prüfen
- wichtige offene Punkte in den dauerhaften Projektquellen sichern
- vor Merge und Production den aktuellen technischen Stand erneut verifizieren
- den Nutzer nicht mit bereits dokumentierten Projektfragen belasten, wenn sie aus dem Repo beantwortet werden können

---

## 10. Verbindliche Arbeitsweise für Cursor / Coding Agents

Ein Coding Agent darf eine größere Aufgabe nicht als vollständig abgeschlossen melden, solange relevante Dokumentation veraltet ist.

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

## 11. Ziel

Jetnity soll über Monate und Jahre konsistent weiterentwickelt werden können, auch wenn Chats gewechselt werden, Agenten neu gestartet werden oder einzelne Beteiligte den unmittelbaren Gesprächskontext verlieren.

**Der Projektfaden gehört ins Repository, nicht nur in den Kopf eines Agents oder in einen einzelnen Chat.**