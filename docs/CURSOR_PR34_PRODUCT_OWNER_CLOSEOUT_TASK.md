# Cursor-Auftrag – PR #34 Product-Owner-Closeout und Merge-Vorbereitung

Stand: 22. August 2026  
Status: **verbindlicher Abschlussauftrag / KEINE Merge-Freigabe**

## Rolle

Du arbeitest als Senior Staff Engineer / Architecture / Security / QA Agent für Jetnity.

Lies vor Beginn vollständig:

- `AGENTS.md`
- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PRODUCT_OWNER_PR34_ACCEPTANCE_NOTES.md`
- `docs/PRODUCT_OWNER_PR34_ACCEPTANCE_CLOSURE.md`
- `docs/PRODUCT_OWNER_PR34_DEVICE_PARITY_ADDENDUM.md`
- `docs/PRODUCT_OWNER_PR34_CURRENT_STANDARD_ADDENDUM.md`
- `docs/PRODUCT_OWNER_PR34_TRAVEL_SAFETY_ADDENDUM.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`
- alle Foundation-D-Review-/Acceptance-Dokumente.

## Ausgangslage

- Branch: `feat/route-transit-intelligence`
- PR: #34 – Foundation D – Route & Transit Intelligence
- Product-Owner-Rundgang ist abgeschlossen.
- Merge ist **nicht** freigegeben.
- Production-Migration ist **nicht** freigegeben.
- Foundation-D-Code war vor den späteren Product-Owner-Dokumentationsänderungen technisch review-bestanden.
- Während des Rundgangs wurden wichtige produktweite Anforderungen bestätigt. Diese sind für spätere Blöcke verbindlich, sollen aber nicht als unkontrollierter Workspace-Rewrite in PR #34 implementiert werden.
- `main` wurde während der Abnahme um neue globale Produkt-/UX-/Audit-/Safety-/Seasonality-/Homepage-Regeln erweitert. Der PR ist aktuell nicht sauber mergebar und muss vor einer späteren Merge-Entscheidung synchronisiert werden.

## Ziel dieses Auftrags

PR #34 in einen **sauberen, reproduzierbar verifizierten, mit aktuellem `main` synchronisierten Entscheidungszustand** bringen, ohne den Product-Owner-Merge-Gate zu umgehen und ohne den späteren Workspace-Umbau vorwegzunehmen.

Am Ende muss ChatGPT/Hauptentwickler dem Product Owner einen belastbaren finalen Status vorlegen können und erst dann separat um Merge-Freigabe fragen.

## Phase 1 – Zustand feststellen

1. `git status`, aktuellen Branch und HEAD prüfen.
2. `origin/main` und `origin/feat/route-transit-intelligence` frisch fetchen.
3. tatsächlichen Ahead/Behind-/Merge-Base-Stand dokumentieren.
4. prüfen, warum GitHub PR #34 aktuell `mergeable=false` meldet.
5. alle Änderungen seit dem letzten vollständig verifizierten Foundation-D-Code-Head kategorisieren:
   - Foundation-D-Code,
   - Tests,
   - Migrationen,
   - Dokumentation/Governance,
   - Product-Owner-Addenda.

Nicht raten.

## Phase 2 – Branch mit aktuellem `main` synchronisieren

Branch sauber mit aktuellem `origin/main` synchronisieren.

Bevorzugt eine nachvollziehbare Merge-/Rebase-Strategie entsprechend bestehendem Repo-Workflow; keine Force-Push-Überraschungen und keine Historie zerstören, falls nicht notwendig.

Bei Konflikten:

- neuere gültige globale Wahrheit aus `main` erhalten,
- Foundation-D-Fachwahrheit aus dem Branch erhalten,
- Product-Owner-Abnahme-/Addendum-Dokumente erhalten,
- keine Datei blind mit `ours`/`theirs` überschreiben,
- semantisch zusammenführen.

Besonders auf Konflikte/Drift prüfen in:

- `ROADMAP.md`
- `JETNITY_HANDOFF.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `AGENTS.md`
- UX-/Quality-/Traveller-/Safety-/Seasonality-/Homepage-/Audit-Dokumenten
- `.cursor/rules/*`

## Phase 3 – Scope-Gate

Die folgenden bestätigten Product-Owner-Anforderungen **nicht** jetzt als großen Code-Umbau in PR #34 implementieren:

- kompletter Multi-Destination-Trip-Builder-Umbau,
- Guest-UX-Rework,
- Entfernung/Neutralisierung des ganzen Pace-/Interest-Modells,
- vollständiger Workspace-/Overview-Neuaufbau,
- Foundation E,
- Travel Safety & Disruption Intelligence,
- Travel Timing & Seasonal Intelligence,
- finale Startseiten-Positionierungs-/Kommunikationsoptimierung.

Diese Anforderungen bleiben verbindlich und sind über die Product-Owner-Dokumente auf dem Branch sowie die globalen Policies/Roadmap auf `main` für die nächsten Blöcke gesichert.

Nur dann Code in PR #34 ändern, wenn die Synchronisierung einen echten Foundation-D-Regressions-/Integrationsfehler erzeugt oder ein bereits bestätigter Foundation-D-Truth-/Security-Blocker sichtbar wird. In diesem Fall Fund dokumentieren und sauber beheben.

## Phase 4 – Regressions- und Integrationsprüfung

Nach Synchronisierung den Umfang der tatsächlichen Änderungen bestimmen.

Mindestens ausführen:

- vollständiger Typecheck
- Lint
- Hygiene
- Production Build
- vollständige Unit-/Domain-Tests
- Foundation-D-spezifische Route-/Transit-Tests
- Readiness-Regression rund um Route/Transit
- Guest→Account-Persistenztests
- Auth-/RLS-/DB-Rechte-/DB-Security-Prüfungen, soweit im Repo vorhanden
- Trip-Workspace UI-Audit mindestens in dem bereits für Foundation D verwendeten WebKit-/Chromium-Umfang

Wenn Synchronisierung oder Fixes Code/DB-Verhalten betreffen, zusätzlich die früheren Foundation-D-Sicherheitsnachweise erneut vollständig laufen lassen, inklusive direkter INSERT/UPDATE-Manipulation der Route-Metadata.

Keine Testzahlen aus alten Dokumenten kopieren. Nur tatsächlich neu ausgeführte Ergebnisse berichten.

## Phase 5 – Migrationen und Umgebungen

Verifizieren:

- Development enthält weiterhin die Foundation-D-Migrationen `20260822130000`, `20260822140000`, `20260822150000` bzw. deren tatsächlich gültige Dateien.
- Production enthält Foundation D weiterhin **nicht**, sofern keine separate Product-Owner-Freigabe vorliegt.
- keine Secrets/Provider/Kosten wurden durch diesen Closeout aktiviert.

Keine Production-Migration durchführen.

## Phase 6 – CI / Preview

1. Branch pushen.
2. GitHub Actions auf dem finalen synchronisierten Head vollständig abwarten/prüfen.
3. Vercel Preview auf exakt diesem Head prüfen.
4. Wenn ein Check nicht grün ist: nicht als merge-bereit melden.

## Phase 7 – Dokumentation aktualisieren

Nach erfolgreicher Verifikation mindestens aktualisieren:

### `docs/ACTIVE_WORK_STATUS.md`
Muss enthalten:

- exakten finalen Branch-/PR-Head,
- Product-Owner-Rundgang abgeschlossen,
- Merge-Freigabe weiterhin ausstehend,
- tatsächlichen Sync-Stand mit `main`,
- tatsächliche neue Tests/CI/Preview-Ergebnisse,
- DB Development/Production-Grenze,
- keine neuen Kosten/Secrets/Provider,
- bestätigte spätere Produktblöcke,
- exakten nächsten Schritt: Product Owner entscheidet separat über Merge.

### `JETNITY_HANDOFF.md`
Nur echte Änderungen am Projektstand eintragen; keine zukünftigen Funktionen als implementiert darstellen.

### relevante Acceptance-/Review-Dokumente
Finalen Head und Verifikationsstand nachziehen.

### `ROADMAP.md`
Nur falls durch Sync/Closeout nötig. Reihenfolge muss weiterhin klar sein:

1. Foundation D abschließen,
2. Foundation E Traveller Context / Multi-Citizenship,
3. zentraler Workspace-Umbau,
4. Travel Safety & Disruption + Travel Timing & Seasonal Intelligence professionell integrieren,
5. finaler Workspace Intelligence Audit,
6. nach Integration des Kernprodukts finale Startseiten-Positionierung/-Kommunikation.

## Phase 8 – Abschlussbericht

Erstelle einen versionierten Abschlussbericht, z. B.:

`docs/PR34_PRODUCT_OWNER_CLOSEOUT_REPORT.md`

Mindestens:

- finaler Head
- Sync mit main
- Konflikte und deren Auflösung
- Codeänderungen ja/nein und warum
- Tests mit exakten Ergebnissen
- Build
- CI
- Vercel Preview
- DB Development/Production
- Security
- Kosten/Secrets/Provider
- Product-Owner-Anforderungen aus Rundgang: wo dauerhaft gesichert
- offene Blocker
- spätere Follow-ups
- klare Aussage, ob aus technischer Sicht ein Foundation-D-Merge-Entscheid möglich ist
- explizit: **Merge-Freigabe des Product Owners noch nicht erteilt**

## Harte Gates

- NICHT mergen.
- NICHT `Mark Ready`, außer ChatGPT/Product Owner weist später ausdrücklich dazu an.
- KEINE Production-Migration.
- KEIN Provider aktivieren.
- KEINE neuen laufenden Kosten.
- KEINE spätere Workspace-/Foundation-E-/Safety-/Seasonality-/Homepage-Funktion vorwegnehmen.
- Wenn beim Sync ein neuer schwerer Foundation-D-Logic-/Truth-/Security-Blocker gefunden wird, stoppen, dokumentieren und als Blocker melden statt ihn zu verschweigen.

## Definition of Done dieses Closeouts

Der Auftrag ist fertig, wenn:

- Branch mit aktuellem `main` sauber synchronisiert ist,
- PR-Konflikte behoben sind,
- der finale Head reproduzierbar getestet ist,
- CI und Preview auf diesem Head grün sind,
- Development/Production-Grenzen verifiziert sind,
- alle Product-Owner-Rundgangsentscheidungen dauerhaft gesichert sind,
- Dokumentation den realen Zustand wiedergibt,
- und der einzige nächste Governance-Schritt die **separate ausdrückliche Merge-Entscheidung des Product Owners** ist.
