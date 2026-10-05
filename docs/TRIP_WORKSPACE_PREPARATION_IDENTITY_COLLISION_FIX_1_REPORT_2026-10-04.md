# Trip Workspace preparation identity collision fix 1 — Report

Date: 4 October 2026 (Europe/Zurich)
Issue: #828 · Draft PR: #829
Writer: **Jetnity Trip Workspace preparation identity collision fix 1**, Generation 1
Status: **IMPLEMENTED / LOCAL POSTGRESQL TESTS ENVIRONMENT-BLOCKED / DRAFT / AWAITING INDEPENDENT EXACT-HEAD REVIEW**

## Identity and startup gate

- Execution: Codex Desktop; no Cursor agent, subagent or replacement writer.
- Required and observed model: `gpt-6-astra`, reasoning effort `xhigh`.
- Native local session evidence: `session_meta.originator = "Codex Desktop"`; the session's `turn_context` records `model = "gpt-6-astra"`, `effort = "xhigh"`. This is observed session metadata, not an inference from the requested model. Raw conversation content is not published.
- Session: `01a10885-cf05-7fa3-aaad-e727a9b0e2a0`.
- Branch: `fix/trip-workspace-preparation-identity-collision-1`.
- Baseline and merge-base: `1396d1251c7fe0c52f2b1d3096dba814da6adbee`.
- Immutable task-seed / dispatch head: `d118d1e0f5acde631fd9c92b221e5a61f7a6d61a`.
- Implementation and regression-test commit: `da8127024eaef4d098d4346b25f8de4e1ad672c2`.
- The subsequent delivery commit adds only REPORT, HANDOFF and SELF_REVIEW. Its published exact SHA must be read from PR #829; the writer's final handoff message records it without attempting a self-referential commit hash in this file.

The startup read covered `JETNITY_START_HERE.md`, `.jetnity/operating-mode.json`, the Technical-Lead Operating Standard, live #751, relevant newer #748 MATERIAL, #828, #829, the full binding task, and the affected Readiness/UI/guest/account/transfer code and tests. Relevant one-writer, evidence-bus, product, schema and continuity boundaries were checked. Historical startup snapshots are not live writer authority.

Live reconstruction before implementation and before delivery:

- `main` remains the exact baseline; mode is `NORMAL`.
- #829 is open, Draft, on the exact assigned branch; its initial head was the task-seed, 1 ahead / 0 behind, with only the 198-line TASK addition.
- #751's current baseline and Active writer section assign #828/#829 to this exact Codex writer. Older lower sections still mentioning #823 are stale continuity text: live open PRs show no #823 writer. No global continuity file was edited in this slice.
- Open PR inventory consists of #829 and historical Drafts #52/#50/#40/#39/#28. Desktop task inventory showed no other active Codex writer. No overlapping active writer was found in those live surfaces; no Cursor session was started or reactivated.
- Relevant #748 report `COS-20261004-1935-005`, comment `5982622080`, has TL receipt `5982683597`: CONFIRMED / CONTINUITY-ONLY / NO NEW BLOCKER. There is no newer comment at the delivery precheck. Its Official Truth/registration restrictions remain outside this slice.
- No inline review threads on #829 at the pre-delivery read. Dispatch comment `5983861462` matches the binding task. Seed Preview status was success with zero feedback threads; that seed status is not final-head evidence.
- At the implementation commit: 2 ahead / 0 behind. The docs-only delivery commit makes this 3 ahead / 0 behind if main remains unchanged. Re-fetch and use the actual published head for independent review.

## Fix and compatibility

`Reisevorbereitung.eigeneHinzufuegen` now obtains a new `clientRef` from the existing Readiness generator once for each submitted create payload. It never derives that identity from the title. Two deliberately separate submissions, including identical titles, have different refs. Repeating an already constructed payload retains its ref and follows the existing exact-ref write path.

`bauen.ts` exposes the existing generator as `readinessClientRefErzeugen`, with a prefix restricted to a Readiness kind or the existing internal `rdy` prefix. The randomUUID implementation, fallback and existing length bound are unchanged. No second ID scheme was added. The builder still preserves an existing item's id, clientRef and createdAt during an exact update.

`gast.ts` bypasses the semantic kind/country/trip-item fallback only when `kind === 'preparation'` and no explicit ref is supplied. That is always a new custom point. A supplied ref continues to match exactly; a nonmatching supplied ref creates a new point. The fallback for existing system checks remains unchanged.

Call-site audit found `GastArbeitsbereich` as the only non-test caller of `gastReadinessSetzen`. `Reisevorbereitung` and `TripWorkspace` already require and forward `clientRef`; `KontoArbeitsbereich` adds only `tripId`. The account action already selects the existing item by exact ref and scopes its update by both trip and ref. No callback, account-action or schema change is needed.

Derived IDs still come from the untouched `clientRefFuerAbgeleitet` / `readinessChecksAbleiten` path. Guest→Account continues transferring the exact custom refs and deduplicating repeated payloads by ref. Existing title-derived legacy refs remain editable by exact ref. The fix does not reconstruct data already lost to a historical collision.

## Adversarial evidence

The tests were written before the production change. The initial run had 93 tests, 82 pass and 11 fail. The five real-form cases produced equal title-derived refs; five guest create cases collapsed two points to one, and the repeated-create item-limit test also failed. The same run after the fix passed 93/93.

The new narrowly scoped `lib/readiness/preparation-identity.test.ts` executes the actual TSX form event handler and actual account action after TypeScript transpilation. React state is a shallow test harness; Next cache, account lookup, trip reads and DB transport are injected in memory. The account action itself, schemas and builder are real. This is executable function-level integration evidence, not a browser, hosted DB or RLS proof.

`lib/trips/gastspeicher.test.ts` exercises the real guest writer, schema and local-storage serialization/readback with the existing memory storage fixture. Sixteen added tests across the two files cover:

- both binding B02 example titles;
- identical titles deliberately created twice;
- maximum-length 80-character titles differing only at the end;
- case and surrounding whitespace, including identical normalized titles;
- exact-ref updates and byte-for-byte preservation of the sibling row/item;
- A remains done while B is created, retried and changed;
- unchanged payload retries produce one target item, preserving its identity;
- guest preparation creation without a ref never selects a previous preparation;
- legacy title-derived refs remain exact-update targets;
- derived ref strings and existing system fallback remain stable;
- duplicate Guest→Account payloads retain both distinct custom points exactly once;
- 64-character client-ref bounds, 80-character title bounds and the 50-item limit;
- sensitive title, HTML and URL rejection; forged official evidence remains user evidence.

## Validation

Node `22.23.3`; npm lockfile installation succeeded (530 packages). No dependencies or lockfile changed. The final delivery uses the same production/test tree as the implementation commit; the delivery adds only these three documents. Required checks are repeated on the final delivery commit before publication.

| Check | Observed result |
| --- | --- |
| `git diff --check` | PASS |
| `npm run check:operating-mode` | PASS / NORMAL |
| Focused Readiness/guest/transfer/workspace set below | 220/220 PASS, 0 skipped |
| Expanded Readiness directory + guest/transfer/workspace | 1,474 tests: 1,471 pass, 3 environment failures, 0 skipped |
| `npm test` | 5,157 tests: 5,154 pass, 3 environment failures, 0 skipped; exit 1 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS: 0 errors, 149 existing warnings |
| `npm run check:api-schutz` | PASS: 12 admin routes |
| `npm run check:schema-bezug` | PASS: 22 tables/views, 25 functions; existing LOCAL/UNAPPLIED notices unchanged |
| `npm run check:dead` | PASS: 0 orphan modules |
| `npm run check:exports` | PASS: 0 unused exports |
| `npm run check:deps` | PASS |
| `npm run build` | PASS after local IPC permission retry; one existing setup warning for absent `.env/.local` |

Focused command:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/preparation-identity.test.ts lib/readiness/schema.test.ts \
  lib/readiness/status.test.ts lib/readiness/workspace-integration-r1.test.ts \
  lib/readiness/preparation-premium-experience-5.test.ts lib/readiness/uebernahme.test.ts \
  lib/trips/gastspeicher.test.ts lib/trips/uebernahme.test.ts 'lib/trips/*workspace*.test.ts'
```

The three full-suite failures are the existing disposable PostgreSQL tests in `official-truth-content-identity-schema-v2.test.ts`, `official-truth-source-catalog-server.test.ts` and `official-truth-store-server.test.ts`. Each fails with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. This Linux-specific binary is unavailable on the Mac. The same limitation is already recorded on main in `OFFICIAL_TRUTH_CONTENT_REGISTRATION_GATEWAY_1_REPORT_2026-10-04.md`. They are failed/environment-blocked, not passed or silently skipped. No SQL/test-path workaround or environment-wide installation was introduced. Exact-head CI remains an independent gate.

The first build attempt failed at the sandbox's local tsx IPC pipe (`listen EPERM`). The same `npm run build` with local IPC permission and `NEXT_TELEMETRY_DISABLED=1` succeeded. This was a local build, not a deployment. An initial lint error in the new test loader's local `module` variable was corrected to `loaded`; the final lint has zero errors.

The local HTTPS Git push could not authenticate (`could not read Username`). Publication therefore uses the connected GitHub Git Data API, with a non-forced update of only the assigned branch. The API-created implementation tree is exactly `606081e3bee85cedd611fdcc824943c5daf6cef2`, equal to the locally tested implementation commit `044f02fcce7c71eb28b2178bd9e1b0fe8986b1c4`. API commit metadata changes the commit SHA, not the tested source/test bytes. The final delivery is fetched back, its tree compared locally and the required checks rerun on that exact commit. No credential was retrieved or configured.

## Exact scope and boundaries

Writer changed files:

1. `components/trips/Reisevorbereitung.tsx`
2. `lib/readiness/bauen.ts`
3. `lib/readiness/gast.ts`
4. `lib/readiness/preparation-identity.test.ts` (the only new test file)
5. `lib/trips/gastspeicher.test.ts`
6. `docs/TRIP_WORKSPACE_PREPARATION_IDENTITY_COLLISION_FIX_1_REPORT_2026-10-04.md`
7. `docs/TRIP_WORKSPACE_PREPARATION_IDENTITY_COLLISION_FIX_1_HANDOFF_2026-10-04.md`
8. `docs/TRIP_WORKSPACE_PREPARATION_IDENTITY_COLLISION_FIX_1_SELF_REVIEW_2026-10-04.md`

The full PR adds the ninth file, the immutable TASK from the dispatch commit. Its blob remains `7605c245bea32ab86def6fa55ca7c6c43e28772d`.

No migration, DB schema, RLS, Auth, Official Truth, shared callback contract, UI layout, provider, dependency, secret or recurring cost changed. No Supabase API/DB operation, Development/Production DB write, Vercel API/configuration mutation or Production mutation was performed by this writer. The only external writes are the assigned Git branch delivery; the repository's existing GitHub integration may automatically produce a Preview. No manual deployment or provider call was made. U01/B01/B03/B07 and all follow-up slices remain untouched.

**This is implementation evidence and self-review, not a Technical-Lead PASS. Keep Draft. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW. Do not Ready, merge or start a follow-up.**
