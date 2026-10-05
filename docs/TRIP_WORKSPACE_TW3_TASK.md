# Trip Workspace TW-3 – Implementierungsauftrag

Stand: 25. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw3-timeline`  
ADR: `docs/ADR_0166_TRIP_WORKSPACE_TW3_TIMELINE.md`  
Status: **Runtime umgesetzt in Draft-PR #64; STOPP für unabhängigen Technical-Lead-Re-Review**

## Ziel

Baue den **Verlauf** der Reise: Etappen und Tage als eine zusammenhängende Timeline aus dem kanonischen Trip-Graphen. Der Nutzer soll verstehen, wo die Reise entlanggeht, welcher Tag gewählt ist und welche Punkte noch nicht eingeplant sind – ohne zweite Wahrheitsquelle.

TW-3 ist **keine neue Truth-Domäne**. Es ist eine deterministische Presentation-/Aggregationsebene über `stages`, `days`, `items` und `ohneTag`.

## Vor Beginn verpflichtend lesen

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_BINDING_BUILD_ORDER.md`
3. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
4. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
5. `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
6. `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` – besonders §3 und §6
7. `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`
8. `docs/ADR_0166_TRIP_WORKSPACE_TW3_TIMELINE.md`
9. `docs/ACTIVE_WORK_STATUS.md`
10. vorhandene Graph-/Stage-/Day-/`gewaehlterTagId`-Pfade im Code

Danach den tatsächlichen aktuellen Code auf diesem Branch selbst verifizieren.

## Pflichtarbeit

### 1. Ist-Code auditieren

Vor Runtime-Änderung feststellen und im TW-3-Status dokumentieren:

- wo `stages`, `days`, `ohneTag` und `gewaehlterTagId` heute gelesen werden;
- wie Mobile/Desktop den Plan komponieren;
- ob Transit irgendwo als Ziel auftaucht;
- ob eine zweite Auswahlquelle (URL, Local Storage, paralleler State) existiert;
- erkennbare P0/P1-Probleme.

### 2. Timeline-Contract implementieren

- Etappen und Tage als eine Timeline aus dem Graphen;
- ungeplante Punkte ehrlich sichtbar;
- `gewaehlterTagId` bleibt die einzige Auswahlquelle;
- nach Graph-Änderung gültigen Tag behalten oder deterministisch zurückfallen;
- Transit niemals als Nutzerziel;
- dieselbe fachliche Logik auf Mobile/Tablet/Desktop;
- bestehende Audit-Anker (`aria-label="Tagesplan"`, `data-tagesplan-modul="ein"`) nicht ohne Ersatz zerbrechen.

### 3. Tests

Mindestens:

- Multi-Stage / Multi-Destination
- Tage ohne Items
- Items ohne Tag, soweit der Graph das unterstützt
- Wechsel zwischen Etappen/Tagen
- Graph-Mutation mit weiterhin gültigem ausgewähltem Tag
- Graph-Mutation mit entferntem ausgewähltem Tag
- Guest/Account gleicher Graph → gleiche fachliche Timeline
- Mobile/Desktop-Geräteparität der Ableitung

## Explizit nicht in Scope

- TW-5+
- Multi-Destination-Create / TW-6
- DB/Migration/RLS/Auth/Traveller-/Route-Neumodellierung
- neuer `trips.status`
- Provider-Aktivierung / Secrets / paid calls
- Guardian / Simulator
- Homepage / Marketing

## Gates

Typecheck, Lint, `npm test`, Hygiene-Checks, Production-Build, `audit:trip-workspace`, GitHub Actions und Vercel auf Exact Head. Danach STOPP für unabhängigen Technical-Lead-Re-Review. Kein Ready, kein Merge, kein TW-5.
