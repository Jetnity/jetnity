# Jetnity – TW6-B Runtime – Progressive Ziele + Day→Stage Mode Contract – Status

Stand: 27. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-rest-progressive-stages`  
PR: **#87** (Draft gegen `main`)  
Auftrag: Technical-Lead Re-Review nach Production Gate B – Workspace-Tempo-Wahrheit  
Status: **MIT MAIN `d28e11be` SYNCHRON / GATE B LAUT TL PASS / P1 TEMPO-UI KORRIGIERT / NICHT MERGEFÄHIG**

Kein Ready. Kein Merge. Kein weiterer Production-Write. Kein AAL2. Keine Direction A. Kein TW-7/TW-8/TW-9. Kein Folgeslice.

## 1. Live-Baseline

Live geprüft, nicht aus dem Prompt übernommen.

| Fakt | Wert |
| --- | --- |
| Live `origin/main` | `d28e11be2778fd0c5f60e436029d4dc04aea5615` |
| Merge-Base nach Sync | `d28e11be2778fd0c5f60e436029d4dc04aea5615` |
| Sync-Merge | `0ca6de94` (merge `origin/main` in `feat/tw6-rest-progressive-stages`) |
| Vorheriger PR-Head | `b93a6fff213b3bb61a9efde84050f46fc0673cf4` |
| Gate 0 | auf `main` durch PR #89 |
| Gate 0B Vier-Datei-Vertrag | auf `main` durch PR #91 / Continuity PR #92 |
| Production Gate A | **PASS** (`20260824160000` dann `20260824180000`) |
| Production Gate B | **PASS** laut Technical-Lead Re-Review 27. August 2026 (Vier-Datei-Vertrag angewendet) |
| AAL2 / Direction A | **nicht** angewendet |

`20260827010000_reise_anlegen_zero_stage_fail_closed.sql` ist auf `main` und in diesem Branch **byte-identisch** (`b516bfff24e9e6f5dd909a9cfd4e76aa1a54708b067d1a5d3e935b8482c6adf1`). Der PR-Diff gegen `main` enthält **keine** Migrationsdatei und keine Playbook-Änderung.

Ältere Ahead/Behind- und CI-Angaben in diesem Dokument sind historisch und gelten nicht als Evidence für den neuen Exact Head.

## 2. Finaler Mode-Contract

**Mode != Provenance.**

Spalte: `public.trips.day_stage_assignment_mode`  
Kanonische Ableitung: `lib/trips/day-stage-assignment.ts` (`dayStageAssignmentModeAbleiten`) und `public.reise_anlegen()` (aktueller Function-Text: `20260827010000`; `20260826240000` bleibt unverändert).

| Mode | Bedeutung | Wer darf ihn erzeugen |
| --- | --- | --- |
| `legacy_fallback` | nur bereits persistierter historischer DB-Bestand | nur Migration/Backfill / Default bestehender Rows |
| `unassigned` | mehrere Ziele, keine Day→Stage-Zuordnung | neue Requests ohne gültige Position |
| `single_destination` | genau eine Stage | neue Requests mit genau einer Stage |
| `explicit` | konkrete gültige Positionen aus der bestätigten Nutzlast | neue Requests mit ≥1 gültiger Position |

`explicit` bedeutet **nicht** „manuell vom Nutzer editiert“. Herkunft bleibt ein späterer, getrennter Provenance-Contract. `user` ist kein persistierbarer Mode.

Server-Ableitung für **neue** Create-/Transfer-Requests:

| stages | gültige Positionen | unbekannter Claim | Ergebnis |
| --- | --- | --- | --- |
| < 1 | * | * | `22023` / `DayStageAssignmentFehler`, keine persistierte Reise |
| = 1 | * | bekannt oder fehlend | `single_destination` |
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

Additive Folgemigration **nach** `20260826240000` (27. August 2026):

`supabase/migrations/20260827010000_reise_anlegen_zero_stage_fail_closed.sql`

- nur `CREATE OR REPLACE` von `public.reise_anlegen(jsonb)`
- 0 Stages → `22023`, keine persistierte Reise
- `single_destination` nur bei genau einer Stage
- `20260826240000` bleibt byte-identisch (`7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb`)
- seit PR #91 Teil des Gate-0B-Vier-Datei-Vertrags auf `main`: `26220000 → 26230000 → 26240000 → 27010000`
- dieser Runtime-PR schreibt die Datei nicht erneut und erzeugt keine fünfte Version

**Production-Migration wurde NICHT angewendet.** Kein `--produktion`. Keine Production-RLS-/Ownership-Änderung. Production hat die Spalte weiterhin nicht; Account-Reads nutzen `select *` und `dayStageAssignmentModeLesenDb(fehlend) → legacy_fallback`.

## 6. Tests / Gates

Ältere Zahlen in diesem Abschnitt sind historisch. Aktuelle Gates der Zero-Stage-Korrektur stehen in Abschnitt 11.4.

Lokale Gates auf dem früheren Mode-Contract-Head:

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
| TW6-B-P1-07 | P1 | 0 Stages wurden als `single_destination` persistiert (`stageCount <= 1`) | **technisch geschlossen** durch `20260827010000` + identische TS-Ableitung; TL-Finalreview ausstehend |
| TW6-B-P2-02 | P2 | Guest-Load schrieb Erfindung in Guest→Account | geschlossen für neue unassigned Reisen; alter Browser-JSON ohne Positionen wird `unassigned` |
| — | P0 | keine | — |
| TW6-B-P3-01 / P3-02 | P3 | Reorder / Reiseidee ein Ziel | out of scope |
| TW6-B-P3-03 | P3 | localStorage-Tamper als historische Provenance | **superseded**: Browser kann `legacy_fallback` nicht mehr minten |

## 8. Offene Restpunkte

- Unabhängiger Technical-Lead-Finalreview dieser Zero-Stage-Korrektur auf dem neuen Exact Head.
- Gate B bleibt nicht freigegeben. Das bestehende Drei-Datei-Bundle auf `main` enthält `20260827010000` nicht; ein späterer Production-Apply müsste diese Folgemigration extra entscheiden.
- Separate Assignment-Provenance, falls später Herkunft von `explicit` unterschieden werden muss.
- Direction A (Aufenthaltseditor) bleibt eigener Slice.
- Admin/AAL-`db:sicherheit`-Fälle bleiben vorbestehend offen und sind nicht Teil dieses Slice.

## 9. STOP dieses Mode-Contract-Slice

**NICHT READY / NICHT MERGEFÄHIG.**

Kein Ready. Kein Merge. Kein Folgeslice. Keine Production-Migration in diesem Agent-Lauf. Keine Aufenthalts-UX. Kein fünfter Mode. Keine Provenance-Spalte.

## 10. Production-Rollout-Plan (PLAN ONLY, 26. August 2026)

Abschnitt 10 bleibt historische Evidence des Plan-Slices. **Aktuelle Wahrheit 27. August 2026:** Gate 0 ist auf `main` (PR #89). Production Gate A ist PASS. Gate B ist nicht freigegeben und wurde nicht ausgeführt. Siehe Abschnitt 11.

Auftrag: `docs/TRIP_WORKSPACE_TW6_PRODUCTION_ROLLOUT_PLAN_TASK.md`.  
**In diesem Lauf wurde Production nicht geschrieben.** Kein `--produktion`. Kein Branch-Merge nach Production. Kein AAL2.

### 10.1 Live-Git, erneut geprüft

| Fakt | Wert |
| --- | --- |
| `origin/main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Merge-Base | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Vorheriger Plan-Head (TL-Review CHANGES REQUIRED) | `e45289764d787c2374efbef47d53f7a419dd292d` |
| Ahead / Behind vor dieser Korrektur | **19 / 0** |
| PR #87 | Draft, open, `mergeable` ist keine Merge-Freigabe |

`create-stages.ts` / `weitereDestinationPlaceIds` existieren **nicht** auf `main`. Die Multi-Ziel-UI liegt nur auf PR #87.

`20260824160000` und `20260824180000` liegen bereits auf `main` (PR #51 / `52e665ac`). Die TW6-B-Dateien `20260826220000` / `20260826230000` / `20260826240000` liegen **nur** auf diesem Draft-Branch.

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

Aktuelles `main` hat keine Multi-Ziel-UI. PR #87 würde sie gegen den **alten** proportionalen Production-RPC ausliefern. Das bleibt P0.

Live nachgezogen (26. August 2026, nur lesend): Production 0 Flight-`trip_items`; `authenticated` hat `INSERT` auf `public.trips` und `EXECUTE` auf `reise_anlegen(jsonb)`. Development-Default der Mode-Spalte ist `'legacy_fallback'::text`. Jede der Dateien `26220000` / `26230000` / `26240000` endet mit `GRANT EXECUTE … TO authenticated`. Deshalb ist ein per-file-`COMMIT` von `db:anwenden` **kein** sicherer Gate-B-Weg: nach `26220000` oder `26230000` wäre die Source-RPC wieder öffentlich und könnte `legacy_fallback` minten.

1. **Gate 0 – Provenance, vor jedem Production-Write der TW6-B-Versionen**  
   `24160000` / `24180000` sind bereits auf `main`. `26220000` / `26230000` / `26240000` dürfen Production erst erreichen, wenn dieselben Dateiinhalte auf `main` liegen **oder** ein immutable annotated Tag plus Datei-SHA-256 in `DECISIONS.md` steht. Bevorzugt: migrations-only Vorbereitungs-PR ohne Multi-Ziel-UI und ohne AAL2. Ein Production-Stand mit Versionen, die nur auf einem später verworfenen Draft leben, ist verboten.

   SHA-256 der Dateien auf diesem Branch (Evidence, kein Tag, kein Production-Write):

   | Datei | SHA-256 |
   | --- | --- |
   | `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis.sql` | `5428df0632f1a69515371872e2e00dd666b21371fe06a7c5b509ce3c917946f9` |
   | `20260824180000_trip_items_flug_handelsfelder_guard.sql` | `7f8be0f82e8cc8a35e9c754469c8ea1b6ec3651607e2bc2269ba21aeee14df8e` |
   | `20260826220000_trip_day_stage_assignment_source.sql` | `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` |
   | `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` | `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` |
   | `20260826240000_trip_day_stage_assignment_mode.sql` | `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb` |
2. **Preflight (read-only)**  
   Production endet bei `20260824140000`. Keine Mode-Spalte. 4 Single-Stage-Trips. 0 Flight-Items. AAL2 fehlt. Commercial-Paar fehlt. TW6-B-Dateien sind auf `main` oder per Tag+Hash gebunden.
3. **Abort, wenn** irgendetwas davon abweicht oder ein Multi-Stage-Account-Trip existiert.
4. **Gate A – Commercial, eigene PO-Freigabe, nicht Teil der TW6-B-Merge-Freigabe**  
   `24160000` dann `24180000`. Verify: RPC nullt Flugfelder; Trigger existiert; bestehende 4 Trips unverändert; `schema_migrations` enthält beide Versionen; Function-Text und History stimmen überein.
5. **Wenn `24180000` scheitert, nachdem `24160000` geschrieben ist:** STOP. `24160000` **angewendet lassen** (Version + Function). Guard erneut versuchen. **Kein** Function-Rewind auf den Stand vor `24160000`. Ein semantischer Rollback braucht eine neue, versionierte Korrektur-Migration. Production hat 0 Flight-Items; `24160000` ist Forward-Hardening.
6. **Abort nach Gate A**, wenn Trigger oder RPC-Nullung fehlt. Nicht mit Gate B weitermachen.
7. **Gate B – TW6-B-Bundle, eigene PO-Freigabe, nur unter Write-Gate, eine Transaktion**  
   Nicht `db:anwenden` dateiweise. Nicht „nacheinander anwenden und später abbrechen“.
   a. Maintenance-Fenster.  
   b. Write-Gate **vor** `26220000`: `REVOKE EXECUTE ON FUNCTION public.reise_anlegen(jsonb) FROM authenticated, public, anon;` und `REVOKE INSERT ON TABLE public.trips FROM authenticated;`. Prüfen, dass diese Grants weg sind. `postgres` / Management-API bleiben für den Apply.  
   c. **Eine** PostgreSQL-Transaktion: Body `26220000` + History-Insert, Body `26230000` + History-Insert, Body `26240000` + History-Insert, danach erneut `REVOKE EXECUTE` / `REVOKE INSERT` (die Dateien selbst grannten `EXECUTE` wieder). Noch nicht `COMMIT`-öffnen für Clients.  
   d. In derselben Transaktion verifizieren: Spalte heisst `day_stage_assignment_mode`; Default bleibt historisch `legacy_fallback` nur für Altbestand; Function leitet Mode ab; kein CTE; claimed `legacy_fallback` + Positionen → nicht `legacy_fallback`.  
   e. Nur bei PASS: `GRANT EXECUTE` an `authenticated`, `GRANT INSERT` an `authenticated`, dann `COMMIT`.  
   f. Bei FAIL: `ROLLBACK` der ganzen Transaktion. Write-Gate bleibt. Kein Source-Zwischenstand wird sichtbar.
8. **Abort nach Gate B**, wenn Mode-Spalte fehlt, Alt-Trips umgedeutet wurden, der CTE noch läuft oder neue Creates `legacy_fallback` minten würden. App nicht mergen. Rollback siehe 10.6 – **nicht** Gate-A-Function.
9. **Erst danach** Draft-PR #87 durch unabhängigen TL-Finalreview und ausdrückliche Merge-Freigabe.
10. **App nach DB.** Niemals App-first.
11. **Post-Merge** Preview/Production-Create: 1 Ziel → `single_destination`; Paris→Rom→Paris ehrlich `unassigned`; keine neue `legacy_fallback`-Row.

DB-first gegen aktuelles `main` ist **sicher**, sobald Gate B **und** die Mode-aware RPC stehen: `main` erzeugt nur ein Ziel. Die Mode-RPC schreibt `single_destination` explizit. Der Default `legacy_fallback` darf für **neue** Rows nicht greifen.

### 10.6 Rollback / Abort

| Checkpoint | Verbindliches Verhalten |
| --- | --- |
| Vor Gate A | nichts tun |
| `24160000` angewendet, `24180000` fehlgeschlagen | **STOP.** Version `24160000` und ihre Function **belassen**. Guard erneut anwenden. **Verboten:** Function-Text auf vor-`24160000` zurücksetzen, während die Version in `schema_migrations` steht. Semantischer Rollback nur als neue, versionierte Korrektur-Migration. |
| Nach Gate A, vor Gate B | Commercial bleibt. TW6-B nicht starten. Commercial-Rollback nur mit eigener Freigabe **und** versionierter Korrektur, nicht per Rewind. |
| Gate-B-Transaktion fehlgeschlagen | `ROLLBACK`. Source-Spalte und Source-RPC existieren nicht. Write-Gate bleibt, bis ein neuer Versuch startet. |
| Nach Gate B, vor Merge – bevorzugter Abort | Mode-Spalte **und** Mode-aware `reise_anlegen` aus `26240000` **behalten**. App bleibt auf `main`. Neue Creates bleiben `single_destination`. PR bleibt Draft. |
| Nach Gate B, wenn Mode-RPC defekt ist | **Write-Gate**, nicht Function-Rewind: `REVOKE EXECUTE` auf `reise_anlegen(jsonb)` und `REVOKE INSERT` auf `public.trips` für `authenticated`. Kein `GRANT` zurück, bis die Mode-RPC wieder verifiziert ist oder eine versionierte Korrektur-Migration sitzt. **Verboten:** Gate-A-Function bei vorhandener Mode-Spalte. |
| Nach Merge | App-Revert ist kein RPC-Rollback. Zuerst Mode-aware RPC oder Write-Gate, dann App. |

**Verboten nach Gate B:** Gate-A-`reise_anlegen` wiederherstellen, solange `day_stage_assignment_mode NOT NULL DEFAULT legacy_fallback` existiert. Diese Function schreibt die Spalte nicht; jeder Create von aktuellem `main` und jeder direkte `INSERT` ohne Spalte würde eine neue `legacy_fallback`-Row minten.

Kein `DROP COLUMN` ohne eigene Freigabe. Kein Supabase-Branch-Merge nach Production. Kein undokumentiertes Function-Rewind.

### 10.7 Empfohlener Product-Owner-Text

Vier getrennte Sätze, keine Sammelfreigabe:

1. **Provenance:** „Ich gebe frei, die exakten Dateien `20260826220000`, `20260826230000` und `20260826240000` zuerst auf `main` zu bringen (migrations-only, ohne Multi-Ziel-UI, ohne AAL2) oder sie per immutable Tag plus SHA-256 in `DECISIONS.md` zu binden. Das ist keine Production-Write- und keine Merge-Freigabe von PR #87.“
2. **Commercial Production:** „Ich gebe frei, auf Production nacheinander `20260824160000` und `20260824180000` anzuwenden. Scheitert `24180000`, bleibt `24160000` stehen; kein Function-Rewind. Das ist keine Freigabe für TW6-B, AAL2 oder den Merge von PR #87.“
3. **TW6-B Production:** „Ich gebe frei, auf Production `20260826220000`, `20260826230000` und `20260826240000` als ein Bundle in einer Transaktion unter Write-Gate anzuwenden, nachdem Gate 0 und Gate A verifiziert sind. Zwischenschritte `26220000`/`26230000` dürfen nicht öffentlich executable bleiben. Das ist keine Merge-Freigabe.“
4. **Merge PR #87:** „Ich gebe frei, Draft-PR #87 nach verifiziertem Gate B zu mergen. Das ist keine Freigabe für AAL2, Direction A oder TW-7/8/9.“

Ohne Satz 1 darf Satz 3 nicht ausgeführt werden. Ohne Satz 2 darf Satz 3 nicht ausgeführt werden. Ohne Satz 3 darf Satz 4 nicht ausgeführt werden.

### 10.8 P0 / P1 / P2 / P3 für den Rollout

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| TW6-B-ROLLOUT-P0-01 | P0 | PR #87 vor Production-Mode-RPC mergen würde Multi-Ziel-UI gegen proportionalen CTE ausliefern | **offen, blockiert Merge** |
| TW6-B-ROLLOUT-P1-01 | P1 | Bestehende TW6-B-Dateien setzen Commercial-Nullung voraus; ohne `24180000` Teilvertrag | **offen, eigener PO-Satz** |
| TW6-B-ROLLOUT-P1-02 | P1 | `20260826240000` allein auf Production ist kein gültiger Replay (`rename` einer fehlenden Spalte) | **offen, Replay-Reihenfolge bindend** |
| TW6-B-ROLLOUT-P1-03 | P1 | Repo-Datei `20260826090000` ≠ angewendete Dev-Version `20260826052735`; blindes Anwenden wäre AAL2 | **ausgeschlossen** |
| TW6-B-ROLLOUT-P1-04 | P1 | Gate-A-Function nach Gate B würde neue `legacy_fallback`-Rows minten (`NOT NULL DEFAULT`) | **Plan korrigiert:** nach Gate B Mode-RPC behalten oder Write-Gate; kein Gate-A-Rewind |
| TW6-B-ROLLOUT-P1-05 | P1 | Function-Rewind nach `24160000` ohne History-Korrektur trennt Runtime und `schema_migrations` | **Plan korrigiert:** `24160000` belassen, `24180000` retry; Rollback nur versioniert |
| TW6-B-ROLLOUT-P1-06 | P1 | `26220000`/`26230000` können per direkter RPC `legacy_fallback` minten; Dateien grannten `EXECUTE` | **Plan korrigiert:** eine Transaktion + Write-Gate; per-file-`db:anwenden` verboten |
| TW6-B-ROLLOUT-P1-07 | P1 | Production darf TW6-B-Versionen nicht nur aus einem verworfenen Draft tragen | **Plan korrigiert:** Gate 0 = Dateien auf `main` oder immutable Tag+Hash |
| TW6-B-ROLLOUT-P2-01 | P2 | Phase-3.1-`--bis 20260820130000` kann TW6-B nicht ausspielen | neues bounded Playbook nötig, nicht in diesem Lauf gebaut |
| TW6-B-ROLLOUT-P2-02 | P2 | Gate-B-Bundle braucht ein transaktionales Apply-Playbook (Write-Gate, ein `COMMIT`) | nicht in diesem Lauf gebaut |
| — | P0 Daten | Production: 4 Single-Stage, 0 Multi-Stage, 0 Flight-Items | live bestätigt |

### 10.9 Was dieser Lauf nicht getan hat

- keine Production-Migration
- kein `--produktion`
- kein Ready
- kein Merge
- kein AAL2
- kein Direction-A
- keine Änderung der akzeptierten Mode-Semantik
- kein neues Migrationsfile
- kein transaktionales Apply-Playbook implementiert (P2-02, erst nach Plan-PASS)

### 10.10 Korrektur gegenüber Head `e4528976`

Technical-Lead-Review auf `e4528976` (CHANGES REQUIRED): P1-04, P1-05, P1-06 und Production-Migrations-Provenance. Mode-Vertrag unverändert.

Zurückgezogen aus dem alten Plan:

- Gate-A-Function nach Gate B als Rollback
- Function-Rewind, wenn `24180000` nach `24160000` scheitert
- sequenzielles Anwenden von `26220000`→`26230000`→`26240000` mit späterem Abort
- Production-Write der TW6-B-Versionen, solange sie nur auf Draft #87 leben

## 11. Zero-Stage-Korrektur (27. August 2026)

Technical-Lead-Auftrag: `Technical-Lead correction assignment — 2026-08-27`.

### 11.1 Sync (historisch, vor Gate 0B)

`feat/tw6-rest-progressive-stages` war mit `origin/main` `f683855fa82a6ae5663228b2c9dfa605755fc47d` synchron. PR-#89-Migrationen wurden nicht umgeschrieben. Dieser Stand ist durch den späteren Gate-0B-Merge auf `main` überholt; aktueller Sync steht in Abschnitt 12.

### 11.2 P1 Zero-Stage

Befund: `stageCount <= 1` machte 0 Stages zu `single_destination`. Direkter `reise_anlegen(jsonb)`-Aufruf persistierte das.

Fix, fail-closed, TS = SQL:

- neue Create-/RPC-Requests brauchen mindestens eine bestätigte Stage
- 0 Stages → `22023` / `DayStageAssignmentFehler`, keine persistierte Reise
- `single_destination` nur bei genau einer Stage

`20260826240000_trip_day_stage_assignment_mode.sql` bleibt unverändert. Additive Folgemigration:

`20260827010000_reise_anlegen_zero_stage_fail_closed.sql`

Diese Datei liegt seit PR #91 unverändert auf `main` und gehört zum Vier-Datei-Gate-B-Playbook. Dieser Runtime-PR nimmt sie nicht ein zweites Mal auf. Kein Production-Apply.

Folgearbeiten, damit Create/RPC und Guest-Wege denselben Vertrag haben:

- `reiseLesen` wirft nicht; 0-Stage-Entwürfe bleiben lesbar, minten aber kein `single_destination`
- `gastreiseAnlegen` ohne bestätigtes Ziel legt keine Reise an
- Guest→Account (`alsNutzlast` / `gastreisenUebernehmen`) schickt 0-Stage-Entwürfe nicht

### 11.3 Aktuelle Gates

| Gate | Stand |
| --- | --- |
| Gate 0 | auf `main` durch PR #89 |
| Production Gate A | PASS |
| Production TW6-B / Gate B | historisch: nicht angewendet zum Zero-Stage-Slice; aktuell laut TL Re-Review PASS |
| AAL2 / Direction A | ausgeschlossen |

### 11.4 Lokale Gates dieser Korrektur

Development: nur `20260827010000` additiv angewendet. `20260826090000` (AAL2) nicht angewendet. `20260826240000` unverändert. Live-Function enthält `_stage_count < 1`, nicht `<= 1`.

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **2274/2274 PASS** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 warnings |
| `npm run check:dead` | PASS |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run check:setup:ci` | PASS, 1 Warning: keine `.env` |
| `npm run build` | PASS, Next.js 14.2.32 |
| `npm run auth:pruefen` | PASS, 55 Werte |
| `db:rechte` | PASS |
| `db:rls` | PASS |
| `db:sicherheit` | 205/236 – alle TW6-B-RPC-Fälle **ok**, einschliesslich 0-Stage `22023` und keine persistierte Reise; Rest Admin/AAL wie zuvor |

Echte Development-RPC (`public.reise_anlegen(jsonb)` nach `20260827010000`):

1. Paris→Rom→Paris ohne Positionen → `unassigned`
2. Multi-Stage + vollständige Positionen → `explicit`
3. Multi-Stage + Teilpositionen → `explicit`, Rest `stage_id` null
4. claimed `legacy_fallback` + Positionen → `explicit`
5. claimed `legacy_fallback` ohne Positionen → `unassigned`
6. alter claimed `user` + Positionen → `explicit`
7. 0 Stages → `22023 Die Tageszuordnung ist ungültig.`
8. 0 Stages → keine persistierte Reise
9. unbekannter Claim → `22023`
10. out-of-range `stage_position` → `22023`
11. Single-Destination → `single_destination`
12. Accepted-Vorschlag-Nutzlast mit Positionen → `explicit`

Exact-Head GitHub Actions und Vercel gehören zum Commit nach diesem Dokumentationsstand. Ältere SUCCESS-Checks gelten nicht.

### 11.5 STOP (historisch für den Zero-Stage-Slice)

Kein Ready. Kein Merge. Kein Gate B. Kein Production-Write. Kein TW-7/8/9.

## 12. Sync nach PR #91 / Gate 0B (27. August 2026)

Technical-Lead-Kommentar: live reclassification after PR #91 + continuity integration.

Ausgeführt:

1. `origin/main` `d28e11be2778fd0c5f60e436029d4dc04aea5615` in `feat/tw6-rest-progressive-stages` gemergt.
2. Gate-0B-Vier-Datei-Vertrag und `20260827010000` unverändert übernommen; SHA-256 unverändert; keine fünfte Migration; keine History-Umschreibung.
3. ADR-0172 (Runtime/Mode) bleibt in diesem PR; ADR-0173 Gate-0B-Nachtrag bleibt die Continuity-Wahrheit von `main`.
4. Status-/Roadmap-Drift zugunsten von Gate 0B auf `main` korrigiert.
5. Scope bleibt Runtime/UI progressive Ziele + Day→Stage-Vertrag.

PR-Diff gegen `main` enthält keine Datei unter `supabase/migrations/` und keine Änderung an `lib/rollout/gate-b-tw6-bundle.ts`.

### 12.1 Historischer STOP nach Sync

Kein Ready. Kein Merge. Kein AAL2. Keine Direction A. Kein TW-7/8/9. Kein Folgeslice.

## 13. Workspace-Tempo-Wahrheit (27. August 2026)

Technical-Lead Re-Review `5039338077` nach Production Gate B: P1 Product-Truth/UI.

`CREATE_PERSISTENZ_TEMPO='balanced'` bleibt interner Kompatibilitätsdefault. Die Workspace-Übersicht darf ihn nicht als `Ausgewogen` oder Karte `Tempo & Interessen` zeigen. Ohne persistierte Interessen und ohne Reisewunsch erscheint keine Präferenzkarte. Ein `travelWish` ist eigener Reisewunsch. Persistierte Interessen bleiben ohne Tempo-Behauptung sichtbar. Änderungs-Copy: `Zeitraum, Ziele oder Reisewünsche in eigenen Worten anpassen.`

Keine neue Provenance-/DB-Spalte. Keine Migration. Kein Production-Write.

### 13.1 STOP

Kein Ready. Kein Merge. Kein weiterer Production-Write. Kein AAL2. Keine Direction A. Kein TW-7/8/9. Kein Folgeslice.

Nächster Schritt: unabhängiger Technical-Lead-Finalreview des neuen Exact Head.
