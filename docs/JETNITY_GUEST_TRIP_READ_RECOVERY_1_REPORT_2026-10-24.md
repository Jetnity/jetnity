# Guest Trip Read Recovery 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**
Session: `bc-2806475d-7ee4-40d0-980e-1d26bcb5b270` — https://cursor.com/agents/bc-2806475d-7ee4-40d0-980e-1d26bcb5b270
Actual model: `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. Not Auto.
Issue: #991. Draft PR: #994. Branch: `fix/guest-trip-read-recovery-1`.
This report is not Technical-Lead PASS.

## Git

| Item | Value |
| --- | --- |
| Base / `origin/main` (fetched before this report) | `913cf9353fd33491d2bd3130b3c430cc88990200` |
| Merge-base | `913cf9353fd33491d2bd3130b3c430cc88990200` |
| Seed | `de51604c832061ffd18f5742766d5da83cd7caae` |
| Plan | `de65696cc4233beb4dab02f04fefb31f7c1d8973` |
| Addendum V2 | `83c64c7c093b3024c4da13aa72502f39872d688e`, blob `8cff61c42d3b341aeee67ec4cb48bfa2999b4271` (unchanged) |
| Addendum V3 | `2dcc1e5475fb4a70b9b3c89fed2497ab79e1acc3`, blob `e7d6fb1ff65c45238d7d74c752b5e65c8184ac9f` (unchanged) |
| Superseded review heads | `7e7a2e4b1f2733bc970673acd7582fde4eaac83d`, `f2d8f7e4d94c0a9659652c025b7852862e0b4953` |
| Ahead / behind after this R2 delivery | 10 / 0 |
| Final head | Adapter commit after addendum V3. PR comment records `git rev-parse HEAD` after push. f2 App CI is the failure, not a gate. |
| TASK V1 blob | `9a089b26a6892ede8f235692b92f72dc225df147` (unchanged) |
| Node | v22.23.4 |
| Mode | `NORMAL` |

`lib/trips/create-entry.ts` blob `eac2e408a74bf9b8174b6e3d5b74c5da80c02651` still matches the task. `lib/trips/gastspeicher.ts` blob is now `39b75a606c5ae68f64dbd6c3968198d6c0ec3929`. The only difference from baseline `1964cfc9b78f7361e23ff6fb9ccd64dbd3491399` is the additive `gastspeicherWarteschlangeLesen()`. `PlanenCreateGate.tsx` and `GastCreateLink.tsx` are not in the diff.

## Changed paths

Runtime:

- `components/trips/GastReisen.tsx`
- `components/trips/GastArbeitsbereich.tsx` — initial read, loading, error, other-trip, absence, and recheck only. Mutation callback signatures and the workspace wiring under a matching trip are unchanged.
- `components/trips/gast-reise-lesezustand.ts`
- `components/trips/GastReiseLesefehler.tsx`
- `lib/trips/gastspeicher.ts` — one additive readonly export. Private `bestandWarteschlange()`, the loader, legacy migration, and every mutation function are textually unchanged.

Proof and delivery:

- `lib/trips/guest-trip-read-recovery-1.test.ts`
- `scripts/guest-trip-read-recovery-1/**`
- `docs/evidence/guest-trip-read-recovery-1/**`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_PLAN_2026-10-24.md` (already on the plan commit)
- this report, plus STATUS, SELF_REVIEW, and HANDOFF

Not changed: TASK V1, addendum V2, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, #751, create-entry, server, Auth, DB, dependencies, workflows, config, global styles. The storage file gains only the wrapper authorized by addendum V2.

## Behavior

Observation starts with occupancy (`gastCreateBelegungLesen()`).

Invalid and unreadable occupancy stops there and does not call `gastspeicherLaden()`. Invalid occupancy then calls `gastspeicherWarteschlangeLesen()`, which returns `bestandWarteschlange()` and reads only the queue key. The list and workspace show that queue beside the invalid-active error. There is no create permission and no fabricated active continuation. Unreadable occupancy does not call the wrapper and is not shown as absence. Both failed observations make zero mutation calls. A later change to the active key does not pull the failed observation into migration. "Erneut prüfen" is a new observation: once occupancy confirms an empty active slot, the ordinary loader path lists the queue and may migrate a valid legacy draft.

Every other occupancy continues: one snapshot per known key, one `gastspeicherLaden()`, a second per-key snapshot, then occupancy again. `schrieb` is true only when a key both snapshots could read actually changed. A throw from the legacy key or the queue key does not hide a valid active trip that occupancy and the loader still agree on.

Classification after a loader call:

- Post-load occupancy `gueltig` whose id matches the loaded trip is a valid trip. This includes a legacy migration that persisted, and a legacy draft that already had a stored id when the migration write failed. In the failed-write case the legacy bytes remain and `schrieb` is false. The in-memory trip is the one the loader already returned.
- Post-load `belegt_ohne_kennung` does not surface a generated in-memory id. A legacy draft without a stored id is not treated as the stored-id failure above.
- Post-load `speicher_unlesbar`, or a loader throw, is unreadable.
- Post-load `ungueltig` with no active trip is invalid and reports `schrieb: false`. The live observer does not reach this from a pre-load failure, because that path never enters the loader.
- A pre-load valid or occupied result that does not settle into the same valid trip is `abweichend`, not absence.
- No active trip and a readable queue is `nur_warteschlange`.
- No active trip is `fehlend`.
- Anything else is `abweichend`.

The workspace maps a valid matching id to `passend`, a valid other id to `andere_reise` (stored id, trimmed title, link `/reisen/${id}`, no create), and both absence and queue-only to `fehlend`. A queue item is not opened as the workspace. That matches the previous `gastreiseLadenNach` result, which returned only the active trip.

`GastArbeitsbereich` clears the previous trip during render when `tripId` changes, then the effect observes. Recheck sets not-yet-observed and runs the same observation again. The effect updates state after the read because a valid legacy migration may write; that work does not run during render. One `eslint-disable-next-line react-hooks/set-state-in-effect` sits on each of those two effect updates. The rule stays enabled.

Create is rendered only for list `fehlend` or `nur_warteschlange`, and for workspace `fehlend`. Invalid, unreadable, mismatch, occupied-without-id, and a different trip do not offer create. Copy for the known occupancy failures comes from `GAST_CREATE_ERHALTUNG_TEXTE` and `gastCreateGateMeldung`. The disagreement copy is fixed product text. No exception text and no raw bytes are rendered.

## Acceptance matrix

| # | Criterion | Result in this slice |
| --- | --- | --- |
| 1 | Separate loading, absence, matching trip, different trip, invalid bytes, unreadable storage. No unverified empty state as the first trip. | Met. First paint is `nicht_beobachtet`. The mounted empty case records a loading frame before `fehlend`. |
| 2 | Use readonly occupancy. A changed observation fails honestly. | Met. A failed occupancy does not enter the loader, so a key that disappears after that failure cannot migrate. Preflight valid + empty load is `abweichend`. |
| 3 | Non-destructive "Erneut prüfen". | Met. It re-observes. Invalid→valid and invalid→absent do not delete the previous bytes first. Restored access shows the trip. |
| 4 | Invalid/unreadable paths preserve bytes and make no mutation/adoption call. | Met. Those observations make zero `setItem`/`removeItem` calls, including when a later read would have let the loader migrate a legacy draft. |
| 5 | Absence, valid trips, and a different trip keep appropriate behavior. No substitution. | Met. Different trip is a status and a continue link to the stored id. |
| 6 | Valid legacy migration may write. Valid queue listing stays. | Met. A persisted legacy id is `passend`. The same stored id stays usable when the migration write fails, with the legacy bytes unchanged. A legacy draft without an id does not get a continue link. Queue-only writes zero times. Invalid active bytes list the queued id and title through the readonly wrapper, with zero writes. The next confirmed-empty observation still lists that queue. |
| 7 | No stale trip across `tripId`. No callback signature change. | Met. Mounted trip change has a loading frame without the previous title, and no frame contains both titles. Mutation handlers under a matching trip are the previous functions. |
| 8 | Status/alert semantics, keyboard, loading copy, 320/390/1280 and 200% reflow with real styles. No create while unknown. | Met in the synthetic browser. Screen reader and a physical device are not verified. |
| 9 | Real-component proof with real storage, raw bytes and write counts. | Met. 22 node tests in the new file, plus 12 mounted scenarios. The list scenario shows the queued title beside the invalid-active error. |
| 10 | Existing preservation, create-entry, storage, and route tests stay intact. | Met. Focused suite 192/192. No loader assertion was weakened. The new wrapper test checks the existing filter: an object without a trip shape is dropped. |
| 11 | Synthetic proof is separate from hosted, device, and screen-reader proof. | Stated here and in the evidence notes. |

## Failure modes

- Unreadable: alert, recheck, no create, bytes kept.
- Invalid: alert, recheck, the existing queue list when the queue parses, no create, no continue link, raw queue and active bytes kept. An unreadable queue key follows the existing private reader and yields an empty list; the active state stays invalid.
- Disagreement or occupied-without-id: alert, recheck, no continue id, no create.
- Other trip: status, stored title, "Reise fortsetzen", no create, no discard control.
- Confirmed absence: existing first-trip copy and create on the list; existing unavailable copy and create in the workspace.
- Queue only: list shows create plus the existing queue copy. Workspace for that id stays the unavailable state, because the active slot is empty and the queue item is not the open draft.
- Matching trip: existing workspace. Mutations still go through the existing guest storage functions and can write, as they did before.

## Truth, privacy, security, accessibility, performance

Truth: an empty loader result is no longer displayed as absence unless occupancy agrees that the active slot is empty. A generated id from a legacy migration that did not persist is not shown.

Privacy: UI and evidence use synthetic titles only. Raw storage is asserted in tests and is not rendered. No new personal field is collected. Traveller-context policy does not apply.

Security: no new route, Auth change, service role, secret, or hosted write. Recheck does not remove keys. The browser still holds the existing guest draft in `localStorage`; this slice does not widen that storage.

Accessibility: loading is `role="status"` and `aria-busy`. Failures are `role="alert"`. The other-trip state is `role="status"`. Controls use the existing brand focus ring, `min-h-11`, wrapping text, and a stacked layout on small screens. Keyboard activation of recheck passed in the harness. A screen reader was not used.

Performance: an invalid observation is one occupancy read of the active key plus one queue read. An unreadable observation is the occupancy read and no queue read. Every other observation is two occupancy reads plus one loader call. No network, provider, or model call. No new dependency.

## Executed

| Command | Result |
| --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/guest-trip-read-recovery-1.test.ts lib/trips/gastspeicher.test.ts lib/trips/guest-active-draft-preservation.test.ts lib/trips/create-entry.test.ts lib/trips/gast-reisen-cta.test.ts` | 192 tests, 31 suites, 0 fail. The new file contributes 22 tests. |
| `node scripts/guest-trip-read-recovery-1/run.mjs` | PASS 12/12. Chrome 148.0.7778.96. `pageErrors` empty. `externalRequests` empty. Evidence `docs/evidence/guest-trip-read-recovery-1/`. |
| `npm run typecheck` | exit 0 |
| `npx eslint --max-warnings 0` on `gast-reise-lesezustand.ts`, `GastReisen.tsx`, `GastArbeitsbereich.tsx`, `GastReiseLesefehler.tsx`, and the new test | exit 0 |
| `npx eslint lib/trips/gastspeicher.ts` | 0 errors, 4 pre-existing unused-parameter warnings at lines 935 and 990–992. The wrapper diff does not touch those lines. |
| `npm run check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:operating-mode`, `check:schema-bezug` | Exit 0 on `7e7a2e4b` only. Not repeated on this R1 head. Schema output listed pre-existing LOCAL/UNAPPLIED RPCs. |
| `npm run build` | Exit 0 on `7e7a2e4b` only. Not repeated on this R1 head. |
| `npx eslint .` | Exit 0 on `7e7a2e4b`: 144 warnings, 0 errors, none in this slice. Not repeated on this R1 head. |

## Not verified

- Full `npm test` (historical main baseline 7,151 tests / 7,149 pass / 2 opt-in browser skips). Exact-head App CI is the gate.
- Production build, full `npx eslint .`, and the hygiene checks on this R1 head. They passed on superseded `7e7a2e4b`.
- Exact-head Auth CI and Vercel Preview. Not available until this head is pushed. Seed Preview does not count.
- Hosted account, physical device, screen reader, Production, provider, and model behavior.
- #985 / #982 held review, #917 hosted readback, #968 cleanup, #748 personal browser. Not investigated.

## Database, cost, documentation

No migration, RLS, or generated type change. No new running cost. Documentation added is this slice's PLAN, STATUS, REPORT, SELF_REVIEW, HANDOFF, and the evidence notes. Global current-state files stay untouched.

## R2 adapter correction

No runtime change. The guest half of the two wiring tests now supplies five settled slots and an import-level no-op for `useGastLeseFokus`. It asserts `workspace.type` is the loaded `TripWorkspace` default export before reading `onFlugRouteManuell` or `onUnterkunftZeitraum`. The existing payload, persisted-graph, failure-message, one-write, account refresh, invalidation, and source-forwarding assertions are still in those tests. `laden()` and the account `laden` calls are untouched.

Combined command on this tree: the two full files plus `guest-trip-read-recovery-1.test.ts`, `gastspeicher.test.ts`, `guest-active-draft-preservation.test.ts`, `create-entry.test.ts`, and `gast-reisen-cta.test.ts`. Result: 267 tests, 39 suites, 0 fail.

The mounted proof is the f2 harness. First execution failed one focus assertion (`BODY`, unreadable copy already visible). Immediate rerun: PASS 12/12, empty page errors, empty external requests. Evidence bytes were not updated for the local port or screenshot drift.

## Facade scope

Addendum V2 authorizes one export. `gastspeicherWarteschlangeLesen()` returns `bestandWarteschlange()`. The invalid path uses it and still returns before `gastspeicherLaden()`. The wrapper does not inspect active or legacy storage. A test records that its only `getItem` is the queue key, that an invalid extra object is filtered by the existing reader, and that set/remove stay empty. The failed-observation race on both surfaces records one active read plus one queue read, the queued id and title, zero application writes, and no external removal. Raw active, legacy, and queue bytes stay. The next observation that confirms an empty active slot still lists the queue through the ordinary loader path.

## Residuals

- P0: none found.
- P1: none found in the assigned surfaces.
- P2: the mounted bundle shims Next server modules. The failure paths do not execute those imports. The matching trip still renders `TripWorkspace` in the browser. Hosted Next rendering remains the Preview gate.
- P2: full `npm test` was not run in this session.
- P3: `browserslist` printed that `caniuse-lite` is 13 months old during the CSS compile. Dependencies were not updated.
- P3: screen reader and physical-device reflow are not verified. The harness covers keyboard and 320/390/1280 plus 200% in desktop Chrome only.

## Next step

Independent Technical-Lead review of the pushed head. This author stops. Do not Ready, merge, close #991, or start a follow-up.
