# Jetnity – TW-1 Shell & Geräteparität – kontrollierter Implementierungsauftrag

Stand: 25. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw1-shell-device-parity`  
Ziel-ADR: `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`  
Status: **zum Start freigegeben; Draft-Workflow; kein Mark Ready, kein Merge**

## 1. Auftrag

Implementiere ausschließlich **TW-1 – Shell & Geräteparität** aus `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md` auf dem aktuellen `main`.

Produktziel dieses Slices:

> Dieselbe Reise muss auf Smartphone, Tablet, Laptop und Desktop dieselbe grundlegende Orientierung und dieselbe Nutzerkontrolle besitzen. Desktop darf die Reise-Ebene nicht verlieren.

TW-1 ist bewusst **kein** kompletter Workspace-Umbau und **kein** TW-2.

## 2. Pflichtlektüre vor Code

Mindestens:

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`
- `docs/TRIP_WORKSPACE_AUDIT.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `docs/TRIP_WORKSPACE_HANDOFF.md`
- `docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`

Vor dem ersten Runtime-Commit `origin/main` live prüfen. Falls `main` seit Branch-Erstellung weitergezogen ist, kontrolliert synchronisieren; keine fremden Slices zurückspulen.

## 3. In Scope

### 3.1 Reise-Ebene auf allen Geräten

- `TripWorkspace` so komponieren, dass die Reise-Ebene / Übersicht nicht ab Desktop-Breakpoint verschwindet.
- Desktop bekommt dieselbe grundlegende Reiseorientierung wie Mobile; mehr Platz darf genutzt werden, aber keine zweite Produktlogik.
- Bestehende Reise-Kopf-/Übersichtsbausteine dürfen für Geräteparität neu komponiert werden, solange keine neue Fachwahrheit entsteht.

### 3.2 Navigation / Shell

- Die Shell auf die angenommene Zielrichtung vorbereiten: Reiseorientierung vor Domainorientierung.
- Bestehende Flight-/Hotel-/Activities-/Mobility-Funktionen müssen auf allen relevanten Geräten weiterhin erreichbar bleiben.
- Domain-Bereiche dürfen in diesem Slice nicht fachlich neu implementiert werden.
- Bestehende Lazy-/Mount-/Hidden-/Inert-Mechanismen nur so ändern, wie es für korrekte Geräteparität und Bedienbarkeit nötig ist.

### 3.3 Geräteparität

Mindestens prüfen:

- iPhone/schmal
- Tablet
- Laptop
- Desktop breit

Gleiche Reise, gleiche Wahrheit, gleiche Nutzerkontrolle. Unterschiedlich ist nur die Flächennutzung.

## 4. Explizit nicht in Scope

Nicht implementieren oder still vorziehen:

- **TW-2 Reiseübersicht** mit neuen Gesamtstatus-/Fortschrittsableitungen
- **TW-3 Timeline**
- **TW-4 `Jetzt wichtig` / Attention-Aggregator**
- TW-5 bis TW-9
- Safety-/Seasonal-Orchestrierung als neue Fachlogik
- neue Provider-/Search-Orchestrierung
- Create-Flow / `/planen` / Multi-Destination
- Account-Hub- oder Archiv-Logik
- AP-4, Admin Slice D, Provider S4
- DB-Migration, Schema, RLS, Auth, MFA/AAL, Service Role
- Traveller-Registry, Citizenship-/Document-Neumodellierung
- Route-/Readiness-/Safety-/Seasonal-Truth-Vertragsänderungen
- Provideraktivierung, Secrets, API-Keys, Verträge, bezahlte Calls
- Homepage/Marketing
- neue persistierte Workspace-Wahrheit

Wenn TW-1 nur durch einen dieser Punkte lösbar scheint: **STOPP und Technical Lead informieren. Nicht Scope erweitern.**

## 5. Wahrheits- und Sicherheitsgrenzen

Unverändert:

- `unknown` bleibt `unknown`.
- Error ≠ Empty ≠ Stale ≠ Unavailable ≠ ungeprüft ≠ clean.
- Browser-/LLM-Daten dürfen keine Provider- oder regulatorische Wahrheit erzeugen.
- Mehrere Citizenships/Dokumente dürfen nicht auf `[0]` oder einen impliziten Standard reduziert werden.
- Guest und Account bleiben dieselbe fachliche Trip-Form mit unterschiedlicher Ablage/Autorität.
- Keine Service-Role-Abkürzung.
- Keine Änderung an Ownership/RLS/Auth-Verträgen.

## 6. Bekannte Audit-Befunde, die für TW-1 relevant sind

### Muss TW-1 schließen

- **Desktop ohne Reise-Übersicht / Reise-Ebene** ist ein P0-Produktfehler und Kern dieses Slices.
- Mobile und Desktop dürfen keine zwei unterschiedlichen Workspace-Produkte bleiben.

### Darf TW-1 nicht eigenmächtig lösen

- Safety-/Seasonal-Stille bleibt ein P0-Befund, wird aber erst in den dafür vorgesehenen späteren Slices fachlich orchestriert.
- `Jetzt wichtig` ist TW-4.
- neue Gesamtstatus-/Fortschrittslogik ist TW-2.
- Create-Flow-Chips/`balanced` sind TW-6.

TW-1 darf diese späteren Lösungen **nicht vortäuschen**.

## 7. Akzeptanzkriterien

TW-1 ist technisch reviewbereit, wenn alle Punkte erfüllt sind:

1. Desktop zeigt eine echte Reise-Ebene/Übersicht; sie wird nicht aufgrund des Desktop-Breakpoints aus dem Produkt entfernt.
2. Mobile behält die Reise-Ebene und verliert keine bisher erreichbare Kernfunktion.
3. Flight, Unterkunft, Aktivitäten und Mobilität bleiben auf Mobile und Desktop erreichbar.
4. Keine neue persistierte Wahrheit, kein neues Shadow Model und keine neue Domain-Autorität.
5. Kein Safety-/Seasonal-„alles gut“ aus fehlender Evaluation.
6. Keine Multi-Citizenship-Regression.
7. Guest/Account-Verhalten und Ownership-Grenzen bleiben unverändert.
8. Keine DB-/RLS-/Auth-/Provider-/Secret-/Kostenänderung.
9. Responsive Layout, Fokusführung, `hidden`/`inert`, Tastatur- und Screenreader-Grundlagen sind konsistent; keine unsichtbar fokussierbaren doppelten Flächen.
10. Der Diff bleibt TW-1-spezifisch; keine stillen TW-2/TW-4-Änderungen.

## 8. Tests / Gates

Mindestens:

- betroffene Unit-/Integrationstests erweitern, insbesondere `lib/trips/arbeitsbereich.test.ts` bzw. aktuelle äquivalente Workspace-Tests
- Desktop: Reise-Ebene wird gemountet/ist erreichbar
- Mobile: Graph/Reise-Ebene bleibt erreichbar
- Domain-Funktionen bleiben erreichbar
- Regression für Breakpoint-/Mount-Verhalten
- TypeScript
- Lint
- vollständiges `npm test`
- Hygiene: dead / exports / deps / api-schutz / schema-bezug gemäß Repo
- Production Build
- vorhandenen `audit:trip-workspace` ergänzend ausführen, aber nie als alleinigen Wahrheitsbeweis verwenden
- Exact-Head GitHub Actions SUCCESS
- Exact-Head Vercel Preview READY/SUCCESS, falls Preview erzeugt wird

Keine alten grünen Runs auf einen neuen Head übertragen.

## 9. Arbeitsweise

1. Ist-Code gegen aktuellen `main` erneut verifizieren.
2. Kleinste saubere TW-1-Lösung implementieren.
3. Tests ergänzen.
4. Adversarial Self-Review: Truth, UX, Device Parity, Security, Guest/Account, Cross-Domain, Accessibility.
5. Vollständige lokale Gates.
6. Draft-PR gegen `main` erstellen/aktualisieren.
7. CI/Vercel Exact Head abwarten und dokumentieren.
8. Status/Handoff dieses Slices im Repo aktualisieren, ohne historische Evidence umzuschreiben.
9. **STOPP für unabhängigen ChatGPT/Technical-Lead-Re-Review.**

## 10. Governance

Die Product-Owner-Freigabe vom 25. August 2026 gilt nur für den **Start von TW-1** und die angenommene Ziel-IA.

Sie ist ausdrücklich **keine** Freigabe für:

- Mark Ready
- Merge
- TW-2+
- Production-Migration
- Provider-/Secret-/Vertrags-/Kostenaktivierung

Nach Technical Closure benötigt Mark Ready eine neue ausdrückliche aktuelle Product-Owner-Freigabe. Merge benötigt danach nochmals eine separate ausdrückliche aktuelle Freigabe.

## 11. Erwartetes Abschlussformat des Agenten

Am Ende berichten:

- Status
- Exact Head
- Basis / Merge-Base / ahead-behind
- exakt geänderte Runtime-Dateien
- Tests mit Zahlen
- Build
- GitHub Actions
- Vercel
- Security/DB/Provider/Kosten: ausdrücklich unverändert oder konkret benennen
- offene Risiken / bewusst nicht gelöste Audit-Befunde
- Self-Review-Ergebnis
- exakter nächster Schritt: **unabhängiger Technical-Lead-Re-Review; kein Ready, kein Merge, kein TW-2**
