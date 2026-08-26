# Jetnity – TW6-B Runtime – Progressive Ziele + Day→Stage Mode Contract – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (Draft gegen `main`)  
Auftrag: `docs/TRIP_WORKSPACE_TW6_DAY_STAGE_MODE_CONTRACT_TASK.md`  
Status: **MODE CONTRACT UMGESETZT / AWAITING TECHNICAL-LEAD FINALREVIEW**

Kein Ready. Kein Merge. Kein TW-7/TW-8/TW-9. Kein Folgeslice.  
`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Live-Baseline

Live geprüft, nicht aus dem Prompt übernommen.

| Fakt | Wert |
| --- | --- |
| Live `origin/main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Merge-Base | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Task-Commit / vorheriger PR-Head | `dbfb7be8478f9dd4582eb46495323b498513b55b` |
| Exact Head (Runtime + Docs vor CI-Nachzug) | `3b0b475e41cc7265f2796c8b4c4543da40bfcd83` |
| Offene parallele Draft-PRs | #52, #50, #40, #39, #28 |
| Shared-Contract-Kollision | keine offenen PRs treffen `zuordnung`, `reise_anlegen`, Timeline oder Assignment-Mode |

`main` hat sich in diesem Slice nicht bewegt.

## 2. Finaler Mode-Contract

**Mode != Provenance.**

Spalte: `public.trips.day_stage_assignment_mode`  
Kanonische Ableitung: `lib/trips/day-stage-assignment.ts` (`dayStageAssignmentModeAbleiten`) und `public.reise_anlegen()` (`20260826240000`).

| Mode | Bedeutung | Wer darf ihn erzeugen |
| --- | --- | --- |
| `legacy_fallback` | nur bereits persistierter historischer DB-Bestand | nur Migration/Backfill / Default bestehender Rows |
| `unassigned` | mehrere Ziele, keine Day→Stage-Zuordnung | neue Requests ohne gültige Position |
| `single_destination` | genau eine Stage | neue Requests mit `stages <= 1` |
| `explicit` | konkrete gültige Positionen aus der bestätigten Nutzlast | neue Requests mit ≥1 gültiger Position |

`explicit` bedeutet **nicht** „manuell vom Nutzer editiert“. Herkunft bleibt ein späterer, getrennter Provenance-Contract. `user` ist kein persistierbarer Mode.

Server-Ableitung für **neue** Create-/Transfer-Requests:

| stages | gültige Positionen | unbekannter Claim | Ergebnis |
| --- | --- | --- | --- |
| <= 1 | * | bekannt oder fehlend | `single_destination` |
| > 1 | mindestens eine | bekannt oder fehlend | `explicit` |
| > 1 | keine | bekannt oder fehlend | `unassigned` |
| * | out-of-range / ungültig | * | `22023` / `DayStageAssignmentFehler` |
| * | * | unbekannt | `22023` / `DayStageAssignmentFehler` |

Claims `legacy_fallback`, `user`, `unassigned`, `explicit` und der alte JSON-Schlüssel `day_stage_assignment_source` werden nicht als Wahrheit übernommen. Neue Requests minten **niemals** `legacy_fallback`.

TypeScript und SQL teilen dieselbe Tabelle. `public.reise_anlegen()` bleibt `SECURITY INVOKER` mit `EXECUTE` für `authenticated`. Die TypeScript-Action ist keine Trust-Grenze.

## 3. Read / Timeline

| Mode | Zuordnung |
| --- | --- |
| `legacy_fallback` | bisheriger proportionaler Fallback bleibt erlaubt |
| `unassigned` | niemals proportional |
| `single_destination` | einzige Stage deterministisch |
| `explicit` | nur gespeicherte konkrete Zuordnungen; keine Lückenfüllung |

Timeline zeigt unassigned Resttage als **„Noch keinem Ziel zugeordnet“**. Nur `legacy_fallback` behält die alte Bezeichnung „Ohne Etappe“.

## 4. Caller-Audit `reise_anlegen()`

Nur ein RPC-Aufruf: `lib/trips/anlegen.ts` → `supabase.rpc('reise_anlegen')`.

| Pfad | Semantik nach Mode-Contract |
| --- | --- |
| `/planen` Account/Guest Create | 1 Stage → `single_destination`; Multi ohne Positionen → `unassigned` |
| Guest→Account ohne Positionen | `unassigned` |
| Guest→Account alter JSON mit Positionen | `explicit`, nicht Legacy-Provenance |
| Accepted Reisevorschlag | Positionen → `explicit`; Teilpositionen bleiben Lücken |
| Historische persistierte DB-Reise | bleibt `legacy_fallback` |

Browser-/localStorage-Daten dürfen historische DB-Provenance nicht minten. Kein Secret/HMAC/Service-Role.

## 5. Migration / Production

Neue Development-Migration **nach** den bereits angewendeten `20260826220000` / `20260826230000`:

`supabase/migrations/20260826240000_trip_day_stage_assignment_mode.sql`

- Rename `day_stage_assignment_source` → `day_stage_assignment_mode`
- CHECK: die vier Modes, **kein** `user`
- Function-Replace von `reise_anlegen()` auf Mode-Ableitung
- kein proportionaler CTE mehr im Create-Pfad
- kein Schattenmodell, keine zweite Stage-Tabelle

Development-Daten **vor** der Transformation: 1 Trip, `legacy_fallback`, 2 Stages, 7 zugeordnete Tage, **keine** `user`-Rows. Nach Rename bleibt derselbe Trip `legacy_fallback`.

`20260826090000_admin_aal2_data_plane.sql` bleibt offen und wurde **nicht** angewendet.

**Production-Migration wurde NICHT angewendet.** Kein `--produktion`. Keine Production-RLS-/Ownership-Änderung. Production hat die Spalte weiterhin nicht; Account-Reads nutzen `select *` und `dayStageAssignmentModeLesenDb(fehlend) → legacy_fallback`.

## 6. Tests / Gates

Lokale Gates auf dem Mode-Contract-Head:

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **2255/2255 PASS** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 warnings |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run check:setup:ci` | PASS, 1 Warning: keine `.env` |
| `npm run build` | PASS, Next.js 14.2.32 |
| `npm run auth:pruefen` | PASS |
| `db:rechte` | PASS |
| `db:rls` | PASS |
| `db:sicherheit` | 203/234 – alle neuen TW6-B-RPC-Fälle **ok**; Rest Admin/AAL wie zuvor |

Development-RPC (echte Function, nicht nachgebaute JS-IFs):

1. Paris→Rom→Paris, 12.–17. September, keine Positionen → `unassigned`, 3 Stages, 6 Tage, alle ohne `stage_id`
2. Multi-Stage + vollständige Positionen → `explicit`, exakt `[1,1,2,2,3,3]`
3. Multi-Stage + Teilpositionen → `explicit`, gesetzte Tage exakt, Rest `stage_id` null
4. claimed `legacy_fallback` + Positionen → **nicht** `legacy_fallback`, sondern `explicit`
5. claimed `legacy_fallback` ohne Positionen → `unassigned`
6. alter claimed `user` + Positionen → `explicit`
7. unbekannter Claim → `22023 Die Tageszuordnung ist ungültig.`, nie `legacy_fallback`
8. out-of-range `stage_position` → `22023`, keine Hard Truth
9. Single-Destination → `single_destination`, 3 Tage zugeordnet
10. historische Fixture → `legacy_fallback` unverändert
11. Accepted-Vorschlag-Nutzlast mit Positionen → `explicit`

Guest/Account/Guest→Account und Reload sind in den TypeScript-Vertragstests abgedeckt (`day-stage-truth-contract`, `gastspeicher`, `reisevorschlag/abbildung`). Guest-One-Trip, clientRef, Places, RLS/Ownership, Traveller, Route, Commercial und D0 wurden in diesem Slice nicht angefasst; die bestehenden Suite-/RPC-Regressionen sind grün.

Exact-Head GitHub Actions [33016435981](https://github.com/Jetnity/jetnity/actions/runs/33016435981) **SUCCESS** auf `3b0b475e`.  
Exact-Head Vercel Preview `4nj2DRqn3DsMPxXB8wQASrZ8bRgu` **SUCCESS** auf demselben SHA (`https://jetnity-jvn4fqqwq-jetnity-e1b93c82.vercel.app`).

Der SUCCESS auf Task-Commit `dbfb7be8` und der Typecheck-FAILURE auf Zwischen-Head `8a2b1688` gelten nicht als Evidence für den aktuellen Head.

## 7. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| TW6-B-P1-01 | P1 | Automatische 2/2/2-Erfindung im neuen Multi-Ziel-Create | Runtime geschlossen |
| TW6-B-P1-04 | P1 | SQL hat `user`+Positionen als `legacy_fallback` persistiert | geschlossen |
| TW6-B-P1-05 | P1 | Direkter Client mintet `legacy_fallback` | **technisch geschlossen** durch Mode-Ableitung; TL-Finalreview ausstehend |
| TW6-B-P1-06 | P1 | Accepted Reisevorschlag bekam falsche Legacy-Provenance | **technisch geschlossen** (`explicit`); TL-Finalreview ausstehend |
| TW6-B-P2-02 | P2 | Guest-Load schrieb Erfindung in Guest→Account | geschlossen für neue unassigned Reisen; alter Browser-JSON ohne Positionen wird `unassigned` |
| — | P0 | keine | — |
| TW6-B-P3-01 / P3-02 | P3 | Reorder / Reiseidee ein Ziel | out of scope |
| TW6-B-P3-03 | P3 | localStorage-Tamper als historische Provenance | **superseded**: Browser kann `legacy_fallback` nicht mehr minten |

## 8. Offene Restpunkte

- Unabhängiger Technical-Lead-Finalreview von PR #87.
- Separate Assignment-Provenance, falls später Herkunft von `explicit` unterschieden werden muss.
- Direction A (Aufenthaltseditor) bleibt eigener Slice.
- Production-Migration der Mode-Spalte braucht eine eigene Product-Owner-Freigabe.
- Admin/AAL-`db:sicherheit`-Fälle bleiben vorbestehend offen und sind nicht Teil dieses Slice.

## 9. STOP

**NICHT READY / NICHT MERGEFÄHIG.**

Kein Ready. Kein Merge. Kein Folgeslice. Keine Production-Migration. Keine Aufenthalts-UX. Kein fünfter Mode. Keine Provenance-Spalte.
