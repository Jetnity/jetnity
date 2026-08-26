# Jetnity – TW6-B Runtime – Progressive Ziele / bestehende Trip-Stages – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (Draft gegen `main`)  
Auftrag: `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_TASK.md`  
Status: **IMPLEMENTIERT, NICHT READY, NICHT GEMERGT.** Kein TW-7/TW-8/TW-9. Kein Folgeslice.

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Live-Baseline

Live geprüft, nicht aus dem Prompt übernommen.

| Fakt | Wert |
| --- | --- |
| Live `origin/main` | `9e1868ea2b78b714e1c2f3ea1e1e2fd8ed5b6ae6` — Merge PR #85: final continuity handoff |
| Merge-Base | `9e1868ea2b78b714e1c2f3ea1e1e2fd8ed5b6ae6` |
| Task-Commit des Technical Lead | `f530fadb66222771efb0e23f1ce6a818d5fe188b` |
| Runtime-Commit | `0927ad70c3354adc39955e571babb8eae96c2b90` |
| Status-Head mit Exact-Head-Gates | `9534b0b6e6e7e2e9d28cf06a5713d3a47a944e50` |
| Ahead / Behind vs `origin/main` bei diesen Gates | **3 / 0** |
| Offene parallele Draft-PRs (nicht dieser Slice) | #52, #50, #40, #39, #28 |
| TW6-A | integriert auf `main` über PR #82 |

`main` ist seit dem vorbereiteten Task nicht weitergelaufen. Keine Shared-Contract-Kollision mit den historischen Audit-PRs.

## 2. Changed Files

Gegen `origin/main`:

- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_TASK.md`
- `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md`
- `components/trips/TripPlanner.tsx`
- `lib/formular/feldfehler.ts`
- `lib/formular/feldfehler.test.ts`
- `lib/places/aktionen.ts`
- `lib/places/reiseziele.ts`
- `lib/places/reiseziele.test.ts`
- `lib/trips/aktionen.ts`
- `lib/trips/create-stages.ts`
- `lib/trips/create-stages.test.ts`
- `lib/trips/create-entry.test.ts`
- `lib/trips/gastspeicher.ts`
- `lib/trips/gastspeicher.test.ts`
- `lib/trips/schema.ts`
- `lib/trips/schema.test.ts`
- `types/trips.ts`

Nicht geändert: `docs/ACTIVE_WORK_STATUS.md`, `lib/trips/zuordnung.ts`, `lib/trips/uebernahme.ts`, `lib/trips/anlegen.ts`, SQL/`reise_anlegen`, RLS, Auth/MFA, Traveller, Route, Provider, Commercial, D0 robots/sitemap/canonical, Homepage.

## 3. Architekturentscheidungen

1. Eine geordnete kanonische Zielliste nach Places-Bestätigung ist die einzige Create-Wahrheit. Guest und Account bauen denselben Graph über `createZieleGraph`.
2. Persistenz bleibt auf vorhandenem `trip_stages` / `public.reise_anlegen()` / Gastspeicher. Kein neues Stage-Modell.
3. Zusätzliche Ziele sind optionales `weitereDestinationPlaceIds` am bestehenden `neueReiseSchema`. Duplikate sind erlaubt. Maximum ist `GRENZEN.etappenJeReise` (50).
4. Places-Bestätigung ist bounded/batched: eine `.in('id', uniqueIds)`-Abfrage, danach Mapping in Eingabereihenfolge inklusive Duplikate.
5. Client-Name, Land und Koordinaten werden nicht als Hard Truth übernommen.
6. `Reiseidee` bleibt der zweite Create-Weg und erhält keine Extra-Ziele.
7. `zielId`/`idee` vorbelegen weiter nur das erste Ziel.

## 4. Truth-Semantik

- Erstes Ziel bleibt Pflicht. Freitext ohne `geonames:`-ID scheitert am Feld.
- Jedes persistierte Ziel braucht eine bestätigte Places-Zeile und die Rolle `ziel` (kein Flughafen).
- Unbekannte/manipulierte IDs sind fail-closed.
- Paris → Rom → Paris bleibt drei Stages.
- Titel bleibt der Name des ersten bestätigten Ziels. Kein Marketing-Mashup.
- Origin bleibt Pflichtauswahl und wird nicht zu ZRH ergänzt.
- Keine Citizenship-/Document-Erhebung.
- Kein zusätzlicher Modellaufruf nur wegen weiterer Ziele.
- Tempo bleibt unsichtbarer Persistenzdefault `balanced`.

## 5. Guest-/Account-Parität

| Schritt | Guest | Account |
| --- | --- | --- |
| Gate | `gastCreateGate` + `gastCreateVorNetzschritt` vor Places | Gate immer erlaubt |
| Places | dieselbe Server-Action `reiseorteBestaetigen` | dieselbe Action |
| Graph | `createZieleGraph` | `createZieleGraph` |
| Persistenz | `gastreiseAnlegen` / localStorage | `reiseAusNutzlastAnlegen` / `public.reise_anlegen()` |
| One-Trip | unverändert, zweite Reise wirft | mehrere Reisen erlaubt |
| `clientRef` | Formular-Kennung = Entwurf-ID | `unique (user_id, client_ref)` |

Guest→Account (`alsNutzlast`) übernimmt die Stages verlustfrei in derselben Reihenfolge. Der Transferfluss selbst ist unverändert. `nutzlastOrtePruefen` bestätigt jetzt alle Stage-`place_id`s gebündelt, nicht nur die erste.

## 6. Day→Stage-Semantik und Evidence

Adversarial gegen `public.reise_anlegen()` (`supabase/migrations/20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis.sql`), `lib/trips/zuordnung.ts` und `lib/trips/abbildung.ts`:

**Ein Ziel (Regression, unverändert fachlich wahr):**

- Stage `arrival_date`/`departure_date` = Reisezeitraum.
- Alle Tage `stage_position = 1` bzw. Guest-`stageId` der einen Stage.

**Mehrere Ziele (keine erfundenen Aufenthalte):**

- Stage-Daten bleiben `null`. Der globale Reisezeitraum bleibt Trip-Wahrheit.
- Create persistiert Tage ohne `stage_position` / ohne `stageId`.
- Die UI behauptet ausdrücklich: „Aufenthalte werden hier nicht festgelegt.“
- SQL und Guest-`tageEtappenZuordnen` wenden danach den **bestehenden technischen** proportionalen Fallback an, sobald Tage ohne Zuordnung und Stages ohne Daten vorliegen.
- Das ist kein neuer Product-Entscheid und keine Nutzerwahl. Eine saubere fachliche Tageszuordnung würde neue Stage-Daten oder eine neue Nutzerentscheidung brauchen – beides wäre STOP / neuer Slice.

Kein STOP in diesem Slice, weil die Option-1-Abbildung auf vorhandene `trip_stages` ohne Migration und ohne neue Stage-Wahrheit möglich ist. Der Fallback wird nicht als gewählte Aufenthaltsdauer verkauft.

## 7. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| — | P0 | keine | — |
| — | P1 | keine produktive Create-Regression gefunden | — |
| TW6-B-P2-01 | P2 | Bestehender proportionaler Day→Stage-Fallback wird nach Persistenz/Laden sichtbar, ohne dass der Nutzer Aufenthalte gewählt hat | akzeptiert / dokumentiert; kein neuer Vertrag |
| TW6-B-P2-02 | P2 | Guest-Load wendet `tageEtappenZuordnen` an; eine spätere Guest→Account-Nutzlast kann daher technische `stage_position`s tragen. Stages selbst bleiben vollständig und geordnet | bestehender Vertrag, nicht umgebaut |
| TW6-B-P3-01 | P3 | Kein Reorder; Reihenfolge = Eingabe | bewusst out of scope |
| TW6-B-P3-02 | P3 | `Reiseidee` erzeugt weiter genau ein Ziel | bewusst out of scope |

## 8. Lokale Tests / Gates

Lokal auf dem Runtime-Head `0927ad70` ausgeführt:

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 warnings |
| `npm test` | **2221/2221 PASS** |
| `npm run build` | PASS, `/planen` 15.4 kB |
| `check:setup:ci` | PASS, 1 Warning: keine `.env/.local` im Cloud-Agent |
| `check:dead` | PASS (1 begründetes Cookie-Banner) |
| `check:exports` | PASS, 0 tote Exporte |
| `check:deps` | PASS |
| `check:api-schutz` | PASS, 12 Admin-Routen |
| `check:schema-bezug` | PASS |
| `auth:pruefen` | PASS, 55 Werte / 242 Schlüssel |

Adversarial abgedeckt:

1. Single-Destination-Regression
2. Drei Ziele, gleiche Reihenfolge Guest/Account-Graph
3. Paris → Rom → Paris = 3 Stages, keine Dedup
4. Extra-Freitext ohne ID scheitert am Feld, nichts persistiert
5. Unbekannte/manipulierte/rollenfremde ID fail-closed
6. `GRENZEN.etappenJeReise` max / max+1
7. Guest-Gate vor Places (`gastCreateGate` und `gastCreateVorNetzschritt`)
8. Kein `vorschlagErzeugen` im TripPlanner-Submit
9. Kein ZRH / kein erfundener Origin
10. Keine Citizenship-/Pass-Erhebung
11. Keine erfundenen Stage-Daten; Copy verkauft den Fallback nicht
12. Guest→Account-Nutzlast behält mehrere Stages
13. `clientRef`-Idempotenz
14. D0 robots/sitemap/`/planen`-Metadata unverändert
15. Bestehende Route-/Traveller-/Commercial-Tests im vollen Suite-Lauf grün

Tests selbst hinterfragt: Sie zementieren nicht, dass proportional = Nutzerwahl. Sie prüfen Persistenz ohne Stage-Daten und die bestehende Grenze.

Lokales `/planen` im schon erstellt laufenden `next dev` lieferte nach dem Production-Build `500` (`MODULE_NOT_FOUND` durch überschriebenes `.next`). Das ist eine Cloud-Agent-Umgebungscollision, kein Produktfehler. Der Production-Bundle für `/planen` enthält `weitereDestinationPlaceIds` und den Aufenthalts-Hinweis. Vercel-Preview-HTML war hinter SSO nicht unabhängig walkthrough-bar.

## 9. GitHub Actions / Vercel Exact Head

Exact Head `9534b0b6e6e7e2e9d28cf06a5713d3a47a944e50` (Runtime `0927ad70` + dieser Status):

| System | Evidence | Stand |
| --- | --- | --- |
| GitHub Actions | Run `33002791587` | **SUCCESS** auf exakt `9534b0b6`. Jobs: Typecheck/Lint/Build **SUCCESS** (2m22s), Auth-Konfiguration **SUCCESS**. |
| Vercel Preview | `FzMreZvc5VmiskcCtGg9HEjFx5ZG` | **SUCCESS / READY** auf exakt `9534b0b6`. Dashboard: `https://vercel.com/jetnity-e1b93c82/jetnity-app/FzMreZvc5VmiskcCtGg9HEjFx5ZG` |
| Vorheriger Runtime-Head | `0927ad70` / Vercel `7KY9oPFk9DnepmEGoNA4dYW1UzgH` | ebenfalls Preview-READY |

Ein nachfolgender reiner Evidence-Commit ändert den Exact Head erneut. Technical Lead gatet den dann aktuellen Head unabhängig. Der Runtime-Diff ändert sich dadurch nicht.

## 10. Offene Restpunkte

- Independent Technical-Lead-Finalreview von Diff, Truth, Tests, Exact-Head-CI und Exact-Head-Vercel.
- **Nicht Ready setzen. Nicht mergen.**
- Kein TW-7, kein TW-8, kein TW-9, kein Folgeslice.
- Day→Stage-Fallback bleibt bekannte Produktgrenze, bis ein späterer genehmigter Slice Aufenthalte wirklich entscheidbar macht.
- Zentrale Continuity (`docs/ACTIVE_WORK_STATUS.md`) zieht der Technical Lead nach Integration nach.

## 11. STOP

Dieser Slice ist review-bereit, nicht merge-bereit.

Kein Ready. Kein Merge. Kein Folgeslice.
