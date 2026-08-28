# Jetnity – Project Progress Persistence Policy

Stand: 22. August 2026  
Status: **dauerhaft verbindlich für ChatGPT, Cursor und alle anderen Coding Agents**

## 1. Harte Grundregel

Jetnity darf **keinen relevanten Entwicklungsfortschritt nur in einem Chat, Agentenfenster, lokalen Scratchpad oder kurzfristigen Session-Kontext halten**.

Jeder relevante Fortschritt muss so im Repository versioniert sein, dass ein neuer Chat oder Agent die Arbeit ohne Wissensverlust fortsetzen kann.

> **Was für die Fortsetzung wichtig ist, gehört ins Repository.**

Das bedeutet nicht, dass jeder Tastendruck oder jeder Zwischenversuch dokumentiert werden muss. Dokumentiert werden muss jeder **fachlich, technisch oder operativ relevante Zustandswechsel**, der die Fortsetzung, Bewertung oder Freigabe beeinflusst.

## 2. Was zwingend gespeichert werden muss

Mindestens folgende Fortschritte sind versionierungspflichtig:

- neue oder geänderte Produktentscheidungen des Product Owners;
- neue Architektur-, Datenmodell-, Security-, UX-, Logic- oder Truth-Entscheidungen;
- abgeschlossene Implementierungsmeilensteine;
- relevante Refactorings, wenn sie Architektur oder Schnittstellen verändern;
- neue/angepasste Migrationen, RLS-Policies, DB-Schemata oder Datenflüsse;
- neue oder geänderte Provider-/API-Abhängigkeiten;
- externe Blocker, fehlende Keys, Verträge oder Zugänge;
- neue Kosten oder potenzielle laufende Kosten;
- Tests, Audits, Build-, CI- und Preview-Ergebnisse, sobald sie als Nachweis für einen Meilenstein dienen;
- bekannte Fehler, Risiken, technische Schulden und bewusst verschobene Punkte;
- Nutzerfeedback oder gewünschte Änderungen während eines laufenden PRs;
- Review-Funde und verbindliche Review-Fixes;
- aktueller Branch, PR, Head-Commit und Merge-/Production-Grenze;
- exakter nächster Schritt;
- noch fehlende Product-Owner-, Production- oder Kostenfreigaben.

## 3. Wo Fortschritt gespeichert wird

### Dauerhafte globale Wahrheit auf `main`

Für projektweite, längerfristige Regeln und abgeschlossene Zustände:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- diese Policy
- Fach- und Acceptance-Dokumente.

### Aktive Arbeit im Feature-Branch

Während eines laufenden Arbeitsblocks ist der Feature-Branch die aktuelle Arbeitswahrheit. Dort müssen liegen:

- verbindlicher `docs/CURSOR_<THEMA>_TASK.md`;
- alle neueren Amendments/Review-Aufträge;
- `docs/ACTIVE_WORK_STATUS.md` als kompakter Live-Handoff des aktuell aktiven Blocks;
- relevante Fach-/ADR-/Architektur-Updates;
- tatsächlicher Code und Tests.

Der aktive Branch darf dem nächsten Agenten niemals nur einen großen Diff ohne verständlichen Status hinterlassen.

## 4. Pflichtinhalt von `docs/ACTIVE_WORK_STATUS.md`

Bei einem laufenden größeren Block muss die Datei mindestens enthalten:

1. **Arbeitsblock / Ziel**
2. **Branch / PR / aktueller Head**
3. **Status**: geplant / in Arbeit / technisch review-bereit / wartet auf Product Owner / blockiert
4. **Bereits umgesetzt**
5. **Gerade offen / noch nicht umgesetzt**
6. **Letzte relevanten Änderungen**
7. **Tests / CI / Preview** mit echtem Stand
8. **DB / RLS / Production-Grenze**
9. **Kosten / Provider / Secrets**
10. **Bekannte Risiken / Review-Funde**
11. **Offene Nutzerentscheidungen / Freigaben**
12. **Exakter nächster Schritt**
13. **Welche Dateien zuerst gelesen werden müssen**

Die Datei muss aktualisiert werden, wenn sich einer dieser Punkte wesentlich ändert.

## 5. Verbindliche Checkpoints

Ein Progress-Checkpoint ist spätestens erforderlich:

- nach einer neuen verbindlichen Nutzerentscheidung;
- nach einem größeren Implementierungsmeilenstein;
- bevor ein Agent pausiert, geschlossen oder gewechselt wird;
- nach einem Human-/Architecture-/Security-/UX-Review;
- nach einem relevanten Test-/CI-/Preview-Durchlauf;
- nach einer DB-/Migration-/Production-Änderung;
- wenn ein neuer Blocker oder eine neue externe Abhängigkeit entsteht;
- bevor der Product Owner über Merge oder weitere Änderungen entscheidet;
- unmittelbar nach Merge/Production-Acceptance.

## 6. Neuer Chat / neuer Agent

Ein neuer Chat oder Agent muss **zuerst rekonstruieren**, nicht raten.

Reihenfolge bei aktiver Arbeit:

1. `JETNITY_PRODUCT_MANDATE.md`
2. `JETNITY_HANDOFF.md`
3. `ROADMAP.md`
4. `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
5. `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
6. aktueller PR + Branch
7. `docs/ACTIVE_WORK_STATUS.md` im aktiven Branch
8. aktueller Cursor-Task und neuere Amendments/Reviews
9. relevante Fach-/Architektur-/Logic-/UX-Dokumente
10. realen Git-/CI-/Preview-/Development-/Production-Stand verifizieren.

Der Nutzer soll **nicht** den bisherigen Projektverlauf erneut erzählen müssen.

## 7. Keine Scheinsicherheit

Dokumentation muss den realen Stand spiegeln.

Verboten:

- `fertig` schreiben, wenn nur ein Teil implementiert ist;
- grüne Tests dokumentieren, die nicht gelaufen sind;
- Production behaupten, wenn nur Preview/Development betroffen ist;
- offene Blocker aus dem Handoff entfernen, nur weil gerade an einem anderen Bereich gearbeitet wird;
- alte Statusangaben stehen lassen, wenn sie durch neue Arbeit falsch geworden sind.

Wenn Status und Repository widersprechen, wird zuerst der reale Stand geprüft und anschließend die Dokumentation korrigiert.

## 8. Merge-Gate bleibt getrennt

Gespeicherter Fortschritt oder ein technisch review-bereiter Status ist **keine Merge-Freigabe**.

Es gilt zusätzlich immer `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`:

> **Technisch fertig bedeutet review-bereit. Gemergt wird erst nach ausdrücklicher Freigabe des Product Owners.**

## 9. Definition of Done für Kontinuität

Ein Arbeitsblock ist aus Kontinuitätssicht erst sauber übergabefähig, wenn ein neuer Chat oder Agent ohne zusätzliche Erklärung beantworten kann:

- Was ist Jetnity?
- Was ist bereits stabil gebaut?
- Was ist aktuell in Arbeit?
- Was wurde im aktiven Block schon umgesetzt?
- Was fehlt noch?
- Was ist blockiert?
- Was ist nur Preview/Development und was Production?
- Welche Entscheidungen sind verbindlich?
- Welche Freigabe fehlt noch?
- Was ist der exakt nächste Schritt?

Wenn eine dieser Antworten nur im Kopf eines Agents oder im Chat steht, ist die Dokumentation unvollständig.

## 10. Merksatz

> **Kein relevanter Fortschritt darf beim Wechsel von Chat, Agent oder Sitzung verloren gehen. Der aktuelle Zustand muss im Repository klar, kompakt und überprüfbar weiterleben.**
