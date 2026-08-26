# Jetnity – TW6-B Runtime – Progressive Ziele + Day→Stage Mode Contract – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (Draft gegen `main`)  
Auftrag: `docs/TRIP_WORKSPACE_TW6_DAY_STAGE_MODE_CONTRACT_TASK.md`  
Folgetask: `docs/TRIP_WORKSPACE_TW6_PRODUCTION_ROLLOUT_PLAN_TASK.md`  
Status: **MODE CONTRACT AUF DEVELOPMENT AKZEPTIERT / PRODUCTION ROLLOUT PLAN ERSTELLT / NICHT MERGEFÄHIG**

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

- Unabhängiger Technical-Lead-Finalreview des Production-Rollout-Plans.
- Getrennte Product-Owner-Freigaben: erst Commercial-Paar, dann TW6-B-Replay, dann Merge. Siehe Abschnitt 10.
- Separate Assignment-Provenance, falls später Herkunft von `explicit` unterschieden werden muss.
- Direction A (Aufenthaltseditor) bleibt eigener Slice.
- Admin/AAL-`db:sicherheit`-Fälle bleiben vorbestehend offen und sind nicht Teil dieses Slice.

## 9. STOP dieses Mode-Contract-Slice

**NICHT READY / NICHT MERGEFÄHIG.**

Kein Ready. Kein Merge. Kein Folgeslice. Keine Production-Migration in diesem Agent-Lauf. Keine Aufenthalts-UX. Kein fünfter Mode. Keine Provenance-Spalte.

## 10. Production-Rollout-Plan (PLAN ONLY, 26. August 2026)

Auftrag: `docs/TRIP_WORKSPACE_TW6_PRODUCTION_ROLLOUT_PLAN_TASK.md`.  
**In diesem Lauf wurde Production nicht geschrieben.** Kein `--produktion`. Kein Branch-Merge nach Production. Kein AAL2.

### 10.1 Live-Git, erneut geprüft

| Fakt | Wert |
| --- | --- |
| `origin/main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Merge-Base | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Task-Commit dieses Plans | `c919d1267cb245f11adead2ef41dcf6acc7c3ed3` |
| Ahead / Behind vor diesem Docs-Nachzug | **18 / 0** |
| PR #87 | Draft, open, `mergeable` ist keine Merge-Freigabe |

Live-Git erneut geprüft nach dem Task-Commit: `origin/main` unverändert, Merge-Base identisch, Branch 18/0. `create-stages.ts` / `weitereDestinationPlaceIds` existieren **nicht** auf `main`. Die Multi-Ziel-UI liegt nur auf PR #87.

### 10.2 Production vs Development – Migrationsmatrix (live SELECT)

Production-Elternprojekt und Development-Branch wurden über die Management API **nur lesend** unterschieden und in diesem Lauf erneut per SELECT bestätigt. Der Development-Ref ist der Supabase-Branch `develop` (Prefix `yfvb`). Das Elternprojekt ist das eigenständige Production-Projekt `Jetnity's Project` (Prefix `qscb`). Keine Secrets protokolliert. Kein `--produktion`. Production-Schreibpfad nicht benutzt.

| Version | Name | Production | Development | Klasse |
| --- | --- | --- | --- | --- |
| `20260824140000` | `flug_route_itinerary_untrusted_surface` | angewendet, **letzte Version** | angewendet | gemeinsame Basis |
| `20260824160000` | `reise_anlegen_flug_handelsfelder_ohne_nachweis` | **fehlt** | angewendet | Commercial S2-B1, nicht TW6-B |
| `20260824180000` | `trip_items_flug_handelsfelder_guard` | **fehlt** | angewendet | Commercial S2-B2, nicht TW6-B |
| `20260826052735` | `admin_aal2_data_plane` | **fehlt** | angewendet | AAL2-Gate |
| `20260826090000` | Repo-Datei `admin_aal2_data_plane.sql` | nicht angewendet | **nicht** als diese Version angewendet | dieselbe AAL2-Semantik, andere Versionsnummer |
| `20260826220000` | `trip_day_stage_assignment_source` | **fehlt** | angewendet | TW6-B Historie |
| `20260826230000` | `trip_day_stage_assignment_source_fail_closed` | **fehlt** | angewendet | TW6-B Historie |
| `20260826240000` | `trip_day_stage_assignment_mode` | **fehlt** | angewendet | TW6-B Mode |

Production hat **keine** `day_stage_*`-Spalte. Development hat `day_stage_assignment_mode`.

Production-Daten live: **4 Trips, 4 Stages, 4 Single-Stage, 0 Multi-Stage.**  
Development-Daten live: 1 Multi-Stage-Trip, Mode `legacy_fallback`.

`db:anwenden --produktion --bis 20260820130000` kann **keine** dieser Versionen ausspielen. Das Phase-3.1-Playbook reicht für TW6-B nicht.

### 10.3 Production vs Development – RPC-Diff (live `pg_get_functiondef`)

Production `public.reise_anlegen(jsonb)` (17466 Zeichen, Kommentar ohne Mode):

- kein Mode/Source-Feld
- liest `stage_position`
- eine Stage → Position 1
- danach Datums-UPDATE
- danach proportionaler CTE (`ceil` / `row_number`)
- **nullt Flug-Handelsfelder nicht**
- Trigger `trip_items_flug_handelsfelder_schuetzen` **fehlt**

Development (19061 Zeichen, Mode-Kommentar):

- leitet `day_stage_assignment_mode` ab
- kein Datums-UPDATE, kein proportionaler CTE
- nullt Flug-Handelsfelder (`24160000`)
- Trigger `trip_items_flug_handelsfelder_schuetzen` vorhanden (`24180000`)

Die Dateien `20260826220000` / `20260826230000` / `20260826240000` ersetzen `reise_anlegen` vollständig und enthalten bereits die Flug-Nullung aus `24160000`. Sie auf Production anzuwenden, **ohne** `24180000`, erzeugte einen Teil-Commercial-Vertrag: RPC nullt, direkter `trip_items`-INSERT nicht.

`20260826240000` macht `rename column day_stage_assignment_source`. Auf Production existiert diese Spalte nicht. Ein replay-fremdes Anwenden nur dieser Datei **scheitert**.

### 10.4 Required vs excluded

**Für einen history-treuen Replay der bestehenden TW6-B-Dateien auf Production zwingend davor:**

1. `20260824160000`
2. `20260824180000`  
   Beide **zusammen**. Kein RPC ohne Guard, kein Guard ohne RPC.

**Danach TW6-B-Replay, in dieser Reihenfolge:**

3. `20260826220000` (add `day_stage_assignment_source`, Default `legacy_fallback`)
4. `20260826230000` (fail-closed Source-RPC)
5. `20260826240000` (Rename → Mode, Mode-RPC)

**Ausgeschlossen, auch wenn `db:anwenden` sie als offen zeigen würde:**

- `20260826052735` / Repo-Datei `20260826090000` Admin-AAL2
- Auth/MFA/AAL/Session
- Provider, Payments, Domain, Public Indexing
- Direction A
- TW-7 / TW-8 / TW-9

Eine einzelne „Production-only“-Function, die Mode einführt und Production-Flugfelder unverändert lässt, wäre auf Development eine Regression der Commercial-Nullung. Deshalb: **kein stiller Fork der Function-Texte in diesem Slice.** Entweder Commercial-Paar plus bestehendes TW6-B-Replay, oder ein späterer, eigens freigegebener Reconcile-Slice.

### 10.5 Zero-false-truth Deploy-Reihenfolge

Aktuelles `main` hat keine Multi-Ziel-UI. PR #87 würde sie gegen den **alten** proportionalen Production-RPC ausliefern. Das ist verboten.

1. **Preflight (read-only)**  
   Production endet bei `20260824140000`. Keine Mode-Spalte. 4 Single-Stage-Trips. AAL2 fehlt. Commercial-Paar fehlt.
2. **Abort, wenn** irgendetwas davon abweicht oder ein Multi-Stage-Account-Trip existiert.
3. **Gate A – Commercial, eigene PO-Freigabe, nicht Teil der TW6-B-Merge-Freigabe**  
   `24160000` dann `24180000`. Verify: RPC nullt Flugfelder; Trigger existiert; bestehende 4 Trips unverändert.
4. **Abort nach Gate A**, wenn Trigger oder RPC-Nullung fehlt. Nicht mit TW6-B weitermachen.
5. **Gate B – TW6-B, eigene PO-Freigabe**  
   `26220000` → `26230000` → `26240000`.  
   Verify: Spalte heisst `day_stage_assignment_mode`; die 4 bestehenden Trips sind `legacy_fallback`; Single-Destination-Create → `single_destination`; Multi ohne Positionen → `unassigned`, keine 2/2/2; claimed `legacy_fallback` + Positionen → `explicit`; out-of-range → `22023`; proportionaler CTE weg.
6. **Abort nach Gate B**, wenn Mode-Spalte fehlt, Alt-Trips umgedeutet wurden oder der CTE noch läuft. App nicht mergen.
7. **Erst danach** Draft-PR #87 durch unabhängigen TL-Finalreview und ausdrückliche Merge-Freigabe.
8. **App nach DB.** Niemals App-first.
9. **Post-Merge** Preview/Production-Create: 1 Ziel regressionsfrei; Paris→Rom→Paris ehrlich `unassigned`.

DB-first gegen aktuelles `main` ist **sicher**, sobald Gate B steht: `main` erzeugt nur ein Ziel. `legacy_fallback` Default auf den 4 bestehenden Single-Stage-Trips plus Read-Fallback bleibt wahr. Der neue RPC ordnet eine Stage weiterhin deterministisch zu, ohne CTE.

### 10.6 Rollback / Abort

| Checkpoint | Rollback |
| --- | --- |
| Vor Gate A | nichts tun |
| Nach `24160000`, vor `24180000` | **sofort aborten**. Nicht offen lassen. Function auf den Production-Stand vor `24160000` zurücksetzen. |
| Nach Gate A | Commercial-Function und Trigger entfernen/ersetzen nur mit eigener Commercial-Rollback-Freigabe. TW6-B nicht starten. |
| Nach `26220000`, vor `26240000` | Spalte `day_stage_assignment_source` darf additiv bleiben. Function auf Gate-A-Stand zurücksetzen. App nicht mergen. |
| Nach Gate B, vor Merge | Mode-Spalte additiv belassen. Function auf Gate-A-Stand zurücksetzen. PR bleibt Draft. |
| Nach Merge | App-Revert ist kein Ersatz für RPC-Rollback. Zuerst RPC, dann App. |

Kein `DROP COLUMN` ohne eigene Freigabe. Kein Supabase-Branch-Merge nach Production.

### 10.7 Empfohlener Product-Owner-Text

Drei getrennte Sätze, keine Sammelfreigabe:

1. **Commercial Production:** „Ich gebe frei, auf Production nacheinander `20260824160000` und `20260824180000` anzuwenden. Das ist keine Freigabe für TW6-B, AAL2 oder den Merge von PR #87.“
2. **TW6-B Production:** „Ich gebe frei, auf Production nacheinander `20260826220000`, `20260826230000` und `20260826240000` anzuwenden, nachdem Gate A verifiziert ist. Das ist keine Merge-Freigabe.“
3. **Merge PR #87:** „Ich gebe frei, Draft-PR #87 nach verifiziertem Gate B zu mergen. Das ist keine Freigabe für AAL2, Direction A oder TW-7/8/9.“

Ohne Satz 1 darf Satz 2 nicht ausgeführt werden. Ohne Satz 2 darf Satz 3 nicht ausgeführt werden.

### 10.8 P0 / P1 / P2 / P3 für den Rollout

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| TW6-B-ROLLOUT-P0-01 | P0 | PR #87 vor Production-Mode-RPC mergen würde Multi-Ziel-UI gegen proportionalen CTE ausliefern | **offen, blockiert Merge** |
| TW6-B-ROLLOUT-P1-01 | P1 | Bestehende TW6-B-Dateien setzen Commercial-Nullung voraus; ohne `24180000` Teilvertrag | **offen, eigener PO-Satz** |
| TW6-B-ROLLOUT-P1-02 | P1 | `20260826240000` allein auf Production ist kein gültiger Replay (`rename` einer fehlenden Spalte) | **offen, Replay-Reihenfolge bindend** |
| TW6-B-ROLLOUT-P1-03 | P1 | Repo-Datei `20260826090000` ≠ angewendete Dev-Version `20260826052735`; blindes Anwenden wäre AAL2 | **ausgeschlossen** |
| TW6-B-ROLLOUT-P2-01 | P2 | Phase-3.1-`--bis 20260820130000` kann TW6-B nicht ausspielen | neues bounded Playbook nötig, nicht in diesem Lauf gebaut |
| — | P0 Daten | Production hat 0 Multi-Stage-Account-Trips; Default `legacy_fallback` ist für die 4 Single-Stage-Trips wahr | live bestätigt |

### 10.9 Was dieser Lauf nicht getan hat

- keine Production-Migration
- kein `--produktion`
- kein Ready
- kein Merge
- kein AAL2
- kein Direction-A
- kein neues Migrationsfile (würde ohne die zwei PO-Sätze nur Scheinsicherheit erzeugen)
