# Jetnity – Trip Workspace Implementierungsplan

Stand: 25. August 2026  
Status: **Ziel-IA angenommen (ADR-0163). TW-1 bis TW-4 sind auf `main`. TW-5 Runtime liegt auf Draft-PR #66 und wartet auf Technical-Lead-Review. Kein TW-6.**  
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

Normale scope-treue Ready-/Merge-Schritte folgen der aktuellen `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`; ältere pauschale PO-Merge-Pflichten sind für normale PRs superseded.

## 2. Aktuelle Slice-Reihenfolge

```text
TW-0  Audit / Zielarchitektur
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
      TW-5 Item- und Gap-Details ← Draft-PR #66, Review-STOPP
         │
         ├── TW-6 Create-Entry  (nach dokumentiertem PO-Schnitt; nicht Homepage)
         ├── TW-7 Hub-Anschluss (AP-3 nicht überschreiben; Archiv nach AP-4)
         ├── TW-8 Commercial-Surfaces (nach Provider S5)
         ▼
      TW-9 Polish, Evidence, Closure
         │
         ▼
 finaler Function-by-Function-/Intelligence-Audit
```

## 3. Slice-Definitionen

### TW-0 – Audit / IA / Plan

**Status:** abgeschlossen und integriert.

Deliverables: Audit, Zielarchitektur, Dependency Matrix, Implementierungsplan und Handoff.

### TW-1 – Shell & Geräteparität

**Status:** ✅ auf `main` (PR #56).

**Ziel:** Eine Produktlogik auf Mobile und Desktop; Desktop besitzt eine echte Reise-Ebene statt einer separaten modulzentrierten Präsentationswelt.

**Nicht:** neue Attention-Truth, Provider-Orchestrierung, Planner-Chips oder Account-Hub.

### TW-2 – Reiseübersicht

**Status:** ✅ auf `main` (PR #58).

**Ziel:** Die ersten Sekunden beantworten „Was ist diese Reise?“ ohne Dashboard-/Feature-Wand.

**Kern:** Reiseidentität, Ziele, Zeitraum, Personen-/Party-Kontext und vorhandene Coverage ehrlich verdichten.

**Nicht:** neuen `trips.status` erfinden, Citizenship defaulten oder ungeprüfte Safety als clean darstellen.

### TW-4 – Aufmerksamkeit / `Jetzt wichtig`

**Status:** ✅ auf `main` (PR #60, Merge `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`).

**Ziel:** vorhandene Graph-/Coverage-/Readiness-/Safety-/Seasonal-/Official-Signale deterministisch priorisieren.

**Kern:** keine Fake-Clean-Aussage; Multi-Citizenship/Official-Completeness fail-closed; degradierte Zustände maschinenlesbar getrennt.

**Nicht:** Persistenz, LLM-Score, neuer `trips.status`, neue Provider-Truth.

### TW-3 – Timeline / Etappe / Tag

**Status:** ✅ auf `main` (PR #64, Merge `16a4c77a53cff9e8638a68f5dd8c77122bf13b48`).

Finaler Exact Head:

`f55db2b0682981f293390b44e704b513476703bf`

Independent Technical-Lead Result: **PASS / Technical Integration Closure**.

**Ziel:** Reiseverlauf statt Modulwechsel.

Umgesetzt:

- Etappen und Tage als zusammenhängende Timeline aus dem kanonischen Trip-Graphen;
- `gewaehlterTagId` bleibt die einzige Tag-Auswahlquelle;
- gültige Auswahl bleibt bei Graph-Mutationen erhalten, sonst deterministischer Fallback;
- `ohneTag` bleibt ungeplant;
- Flight-Transitländer werden nicht zu Nutzerzielen/Etappen;
- Mobile/Tablet/Desktop verwenden dieselbe fachliche Timeline-Ableitung.

Evidence:

- gezielte TW-3-Tests 10/10;
- `npm test` 1953/1953;
- Production Build grün;
- Workspace Audit 1018/1018, 0 Fehler;
- GitHub Actions CI `32861784215` SUCCESS;
- Vercel Exact-Head Preview READY;
- keine offenen Review-Threads.

### TW-5 – Item- und Gap-Details

**Status:** Draft-PR #66; Runtime implementiert; STOPP für Technical-Lead-Review. Kein Ready, kein Merge, kein TW-6.

Agent:

`Trip workspace audit architecture`

Vorbereiteter Branch:

`feat/trip-workspace-tw5-item-gap-details`

**Ziel:** Flüge, Unterkunft, Aktivitäten und Mobilität als Details einer konkreten Lücke, Coverage- oder Attention-Situation in der Reiseoberfläche einhängen, statt diese Bereiche erneut als konkurrierende Haupt-IA aufzubauen.

**Darf:**

- bestehende `FlugBestand`, `HotelBereich`, `AktivitaetenBereich`, `MobilitaetBereich` wiederverwenden;
- bestehende Detail-/Suchflächen kontextbezogen aus der Reiseoberfläche öffnen;
- Lazy-Mount der Suche beibehalten;
- vorhandene maschinenlesbare Coverage-/Attention-/Trip-Ableitungen für Navigation/Presentation nutzen, ohne neue Truth zu speichern;
- Mobile/Tablet/Desktop dieselbe fachliche Kontrolle geben.

**Nicht:**

- Live-Provider oder Provideraktivierung;
- Fake-Preise/Fake-Verfügbarkeit/Fake-Provider-Health;
- Live-Mobility-/Rental-Adapter vortäuschen, solange nur fail-closed Nachweisnaht existiert;
- manuelle Flüge als nachgewiesene Providerangebote darstellen;
- stilles `ZRH` oder irgendeine andere erfundene Suchherkunft;
- neue DB/Migration/RLS/Auth/Traveller-/Route-Verträge;
- neuer `trips.status` oder neue persistierte Gap-/Detail-Truth;
- Guardian/Simulator/Value-Optimizer-Runtime;
- Multi-Destination-Create / TW-6;
- Homepage-/Marketing-/Growth-Runtime;
- Provider S4+ oder Commercial Slices hineinziehen.

**Vor Implementierung zwingend:**

- eigener versionierter ADR/Entscheidungsrahmen;
- `docs/TRIP_WORKSPACE_TW5_TASK.md`;
- `docs/TRIP_WORKSPACE_TW5_STATUS.md`;
- Draft-PR;
- Acceptance Criteria für mindestens Flight/Hotel/Activities/Mobility, Guest/Account, mehrere Stages/Tage, ungeplante Items, leere/unknown/unavailable/error Zustände, Geräteparität, Lazy-Mount und keine stillen Defaults;
- STOPP nach Agent-Self-Review/Exact-Head-Evidence für unabhängigen Technical-Lead-Review.

### TW-6 – Create-Entry angleichen

**Ziel:** einfacher Einstieg + progressive weitere Ziele + keine Tempo-/Interessen-Chips + kein implizites `balanced`.

**Darf:** `/planen` und funktionale Zielübergabe von der Startseite; vorhandene `trip_stages` wiederverwenden.

**Nicht:** Homepage-Positionierung/Hero/Marketing-Copy; Citizenship beim Start global erzwingen.

**Abhängigkeit:** dokumentierter Product-Owner-Schnitt und Guest-One-Trip-Vertrag.

### TW-7 – Hub-Anschluss

**Ziel:** Workspace und `Meine Reisen` bleiben ein Weg.

**Darf:** nur angleichen, was AP-3 nicht besitzt.

**Nicht:** gespeicherten Lifecycle, Archiv oder zweite-Reise-Regeln überschreiben. Archiv bleibt AP-4.

### TW-8 – Commercial Surfaces

**Ziel:** Preise, Freshness, Provenance und Übernahme ehrlich an echte Nachweise koppeln.

**Abhängigkeit:** Provider S5 / reale Commercial-Provenance-Verträge.

**Nicht:** Secrets, Live-Calls, Fake-Angebote oder `booking_url` erfinden.

### TW-9 – Polish, Evidence, Closure

**Ziel:** mobile Dichte, Accessibility, Performance, Robustheit und vollständige Function-by-Function-Evidence-Matrix.

**Nicht:** neue Produktmodule nachschieben.

Danach zwingend:

- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`

TW-0 bis TW-9 ersetzen diesen Abschlussaudit nicht.

## 4. Aktueller Integrationscheckpoint

Erreicht:

**TW-4 ✅ → TW-3 ✅ → Technical-Lead-Integrationscheckpoint**

Damit darf konfliktarme Parallelisierung geprüft werden. Sie ist nicht automatisch freigegeben. Der Technical Lead prüft vor jedem parallelen Runtime-Slice Shared Contracts, File-/Surface-Überschneidung, Branch/Draft-PR-Trennung und Merge-Reihenfolge.

## 5. Tests und Gates je Runtime-Slice

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

Wenn `main` während des Slices weiterläuft: synchronisieren, fachlich Konflikte prüfen, neuen Exact Head vollständig re-gaten und erneut reviewen.

## 6. Abbruchkriterien

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

## 7. Continuity

Aktueller operativer Stand steht zusätzlich in:

- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`

Historische Statusdateien bleiben Evidence ihres Zeitpunkts. Live-Systeme müssen vor jeder neuen Arbeit erneut verifiziert werden.
