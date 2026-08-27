# Jetnity – Trip Workspace Implementierungsplan

Stand: 27. August 2026  
Status: **Ziel-IA angenommen (ADR-0163). TW-1, TW-2, TW-4, TW-3, TW-5, TW6-A, TW6-B Runtime und TW7-A Runtime sind auf `main` integriert. TW-7-Start-Gate ist erfüllt; Slice-Spec steht in `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`. PR #106 ist das Integrationsvehikel.**  
Audit: `docs/TRIP_WORKSPACE_AUDIT.md`  
Ziel: `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`  
Abhängigkeiten: `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`

Kein Monster-PR. Jeder Slice bleibt klein, reviewbar und konfliktarm gegenüber Account, Admin, Provider und Shared Contracts.

## 1. Grundregeln

Ein Runtime-Slice darf nur ändern, was in seinem versionierten Auftrag freigegeben ist.

Pflicht:

- bestehende kanonische Trip-/Graph-/Traveller-/Readiness-/Safety-/Seasonal-/Provider-Contracts wiederverwenden;
- keine zweite Produkt-/Timeline-/Status-/Traveller-/Provider-Wahrheit;
- `error`, `empty`, `unknown`, `stale`, `unavailable`, `insufficient_context` getrennt halten;
- Guest und Account auf derselben fachlichen Trip-Form halten;
- Mobile/Tablet/Desktop dieselbe Produktlogik geben;
- Scope/Non-Scope, Acceptance und STOPP-Punkt versionieren;
- relevante Unit-/Integration-/UI-/Regressionstests;
- vollständige Exact-Head-Gates, GitHub Actions, Vercel und unabhängiger Technical-Lead-Review.

Ohne separates Gate verboten:

- DB-/Production-Migrationen;
- RLS/Auth/MFA/AAL-/Identity-Umbau;
- Traveller-/Citizenship-/Document-Kernmodell-Umbau;
- Route-/Transit-Shared-Contract-Umbau;
- Provideraktivierung, Secrets, Verträge oder paid calls;
- neue Production-/Public-Aktivierung;
- Scope-Creep in Guardian/Simulator/Marketing/Homepage.

Normale scope-treue Ready-/Merge-Schritte folgen `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

## 2. Slice-Reihenfolge

```text
TW-0  Audit / Zielarchitektur ✅
  │
  ▼
TW-1  Shell & Geräteparität ✅
  │
  ▼
TW-2  Reiseübersicht ✅
  │
  ├──────────────┐
  ▼              ▼
TW-3 Timeline ✅  TW-4 Aufmerksamkeit ✅
  │              │
  └──────┬───────┘
         ▼
TW-5 Item- und Gap-Details ✅  PR #66 / Merge 6f2beecc
         │
         ├── TW-6 Create-Entry
         │      Abhängigkeit: dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag
         │
         ├── TW-7 Hub-Anschluss
         │      Abhängigkeit: Account-/Hub-Grenzen, AP-3 nicht überschreiben
         │
         ├── TW-8 Commercial-Surfaces
         │      Abhängigkeit: Provider S5 / reale Commercial Provenance
         │
         ▼
TW-9 Polish, Evidence, Closure
         │
         ▼
finaler Function-by-Function-/Intelligence-Audit
```

Die Pfeile bedeuten Abhängigkeiten, nicht automatische Startfreigabe. Vor jedem neuen Slice Live-Stand und Gate prüfen.

## 3. Abgeschlossene Slices

### TW-0 – Audit / IA / Plan

✅ abgeschlossen und integriert.

### TW-1 – Shell & Geräteparität

✅ PR #56 auf `main`.

Eine Produktlogik auf Mobile und Desktop; keine zweite modulzentrierte Präsentationswelt.

### TW-2 – Reiseübersicht

✅ PR #58 auf `main`.

Reiseidentität, Ziele, Zeitraum, Party-Kontext und Coverage ehrlich verdichtet.

### TW-4 – Aufmerksamkeit / `Jetzt wichtig`

✅ PR #60, Merge `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`.

Vorhandene Graph-/Coverage-/Readiness-/Safety-/Seasonal-/Official-Signale deterministisch priorisiert; keine Fake-Clean-Aussage.

### TW-3 – Timeline / Etappe / Tag

✅ PR #64, Merge `16a4c77a53cff9e8638a68f5dd8c77122bf13b48`.

Finaler Exact Head `f55db2b0682981f293390b44e704b513476703bf`. Independent TL: **PASS / Technical Integration Closure**.

Kern: Etappen/Tage aus kanonischem Trip-Graph, stabile Tag-Auswahl, `ohneTag` ungeplant, Transit nicht als Nutzeretappe, eine Mobile/Desktop-Ableitung.

### TW-5 – Item- und Gap-Details

✅ PR #66, Merge `6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`.

Runtime-Head `8183782fc08c486949212b0e78b9f4ce938aa0dd`. Persist-Head `49aa04d99a5eb33a89fa624f1d096f7c5400698f`. Independent TL: **PASS / Technical Integration Closure**.

Kern:

- Domain-Tabs als primäre IA entfernt;
- Flight/Stay/Activities/Mobility als Gap-/Item-Details;
- vorhandene Bestands-/Search-Flächen wiederverwendet;
- Search explizit lazy/on-demand;
- `0 Aktivitäten` keine Pflichtlücke;
- alle sechs Item-Kinds inkl. `ohneTag`;
- tote refs deterministisch;
- Guest/Account gleich;
- Mobile/Desktop gleiche State Machine;
- kein stilles ZRH;
- kein Shared-Contract-/DB-/Provider-Umbau.

P1-QS1-01 wurde vor Merge geschlossen: genau eine ungeplante Liste geht in Route/Coverage/Status. Regression ZRH→DOH→BKK: eine Source-ID, 2 Segmente, 1 Connection, Route einmal, kein künstliches `Reihenfolge unbekannt`.

Evidence:

- gezielte Tests 112/112;
- `npm test` 1994/1994;
- Build grün;
- UI Audit 1018/1018, 0 Fehler;
- Actions Runtime + Persist SUCCESS;
- Vercel Runtime + Persist + Production READY;
- 0 offene Review-Threads beim Merge.

Details: `docs/TRIP_WORKSPACE_TW5_STATUS.md` und `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`.

## 4. Noch nicht freigegebene abhängige Slices

### TW-6 – Create-Entry angleichen

**Ziel:** einfacher Einstieg + progressive weitere Ziele + keine Tempo-/Interessen-Chips + kein implizites `balanced`.

**Darf:** `/planen` und funktionale Zielübergabe von der Startseite; vorhandene `trip_stages` wiederverwenden.

**Nicht:** Homepage-Positionierung/Hero/Marketing-Copy; Citizenship beim Start global erzwingen.

**Abhängigkeit / Start-Gate:** **dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag.**

Vor Start muss der Technical Lead den exakten benötigten Product-Owner-Schnitt aus den aktuellen Contracts rekonstruieren. Diese Abhängigkeit darf nicht still als erfüllt angenommen werden.

### TW-7 – Hub-Anschluss

**Ziel:** Workspace und `Meine Reisen` bleiben ein Weg.

**Darf:** nur angleichen, was AP-3 nicht besitzt.

**Nicht:** gespeicherten Lifecycle, Archiv oder zweite-Reise-Regeln überschreiben. Archiv bleibt AP-4.

**Start-Gate:** Account-/Hub-Verträge und aktueller AP-Stand erneut prüfen.

**Start-Gate-Ergebnis, 27. August 2026, `main` `beaef64a`:** erfüllt. Hub-Code unverändert seit der Prüfung auf `84f54194`. Der Weg `/account` → `/reisen` → `/reisen/[tripId]` → `TripWorkspace` ist bereits einer. AP-3 besitzt die ableitende Lage; TW-2 besitzt dieselbe Lage im Workspace. Der verbleibende Gap ist die Mehrziel-Kartenidentität plus Gast-`itemCount`, nicht eine zweite Hub-Architektur.

Verbindliche Slice-Spec: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`. Spec-Status: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_STATUS.md`. Runtime-Status: `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`. TW-7-Gap / ADR-0176 / TW7-A-Spec sind durch PR #100 versioniert. **TW7-A Runtime ist durch PR #106 integriert.** Issue #103 ist CLOSED / completed. Ältere „Draft / nicht auf main“-Zeilen sind Pre-Merge-Evidence.

### TW-8 – Commercial Surfaces

**Ziel:** Preise, Freshness, Provenance und Übernahme ehrlich an echte Nachweise koppeln.

**Start-Gate:** Provider S5 / reale Commercial-Provenance-Verträge.

**Nicht:** Secrets, Live-Calls, Fake-Angebote oder `booking_url` erfinden.

### TW-9 – Polish, Evidence, Closure

**Ziel:** mobile Dichte, Accessibility, Performance, Robustheit und vollständige Function-by-Function-Evidence-Matrix.

Start erst, wenn die für den Workspace tatsächlich erforderlichen abhängigen Runtime-Slices geklärt/integriert sind.

Danach zwingend:

- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`

TW-0 bis TW-9 ersetzen diesen Abschlussaudit nicht.

## 5. Aktueller Integrationscheckpoint

Erreicht:

**TW-1 ✅ → TW-2 ✅ → TW-4/TW-3 ✅ → TW-5 ✅ → Post-TW-5 Integrationscheckpoint**

Damit darf konfliktarme Parallelisierung geprüft werden. Sie ist nicht automatisch freigegeben. Der Technical Lead prüft vor jedem parallelen Runtime-/Audit-Slice Shared Contracts, Abhängigkeiten, File-/Surface-Überschneidung, Branch/Draft-PR-Trennung und Merge-Reihenfolge.

## 6. Tests und Gates je Runtime-Slice

Mindestens, soweit relevant:

- `check:setup:ci`
- TypeScript / Typecheck
- Lint
- `npm test`
- betroffene Domain-/Ableitungs-Unit-Tests
- `npm run audit:trip-workspace` zusätzlich, nie als alleiniger Wahrheitsbeweis
- Production Build
- Hygiene-/API-/Schema-/Dead-/Export-/Dependency-Checks gemäß Repo-Stand
- GitHub Actions auf Exact Head SUCCESS
- Vercel Preview auf Exact Head READY, falls erzeugt
- adversarial Agent-Self-Review
- unabhängiger ChatGPT/Technical-Lead-Review

Wenn `main` während eines Slices weiterläuft: synchronisieren, fachliche Konflikte prüfen, neuen Exact Head vollständig re-gaten und erneut reviewen.

## 7. Abbruchkriterien

Slice stoppen und Technical Lead informieren, wenn die Lösung nur möglich wäre durch:

- Migration / RLS / Auth / Identity-Änderung;
- neue Traveller-/Citizenship-/Document-Truth;
- Route-/Transit-Shared-Contract-Umbau;
- Provideraktivierung, Secret, Vertrag oder paid call;
- Überschreiben von Account-/Admin-/Provider-Contracts;
- neue persistierte Schattenwahrheit;
- einen universellen Mega-Typ/Mega-PR;
- Scope-Creep in nachgelagerte Slices;
- einen besseren angezeigten Zustand als die vorhandene Evidence trägt.

## 8. Continuity

Aktueller operativer Stand steht zusätzlich in:

- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`

Historische Statusdateien/PR-Bodies bleiben Evidence ihres Zeitpunkts. Live-Systeme müssen vor jeder neuen Arbeit erneut verifiziert werden.