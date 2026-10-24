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
| Ahead / behind before the implementation commit | 2 / 0 |
| Final head | Commit that contains this report. PR comment records `git rev-parse HEAD` after push. |
| TASK V1 blob | `9a089b26a6892ede8f235692b92f72dc225df147` (unchanged) |
| Node | v22.23.4 |
| Mode | `NORMAL` |

Readonly blobs still match the task: `lib/trips/gastspeicher.ts` `1964cfc9b78f7361e23ff6fb9ccd64dbd3491399`, `lib/trips/create-entry.ts` `eac2e408a74bf9b8174b6e3d5b74c5da80c02651`. `PlanenCreateGate.tsx` and `GastCreateLink.tsx` are not in the diff.

## Changed paths

Runtime:

- `components/trips/GastReisen.tsx`
- `components/trips/GastArbeitsbereich.tsx` — initial read, loading, error, other-trip, absence, and recheck only. Mutation callback signatures and the workspace wiring under a matching trip are unchanged.
- `components/trips/gast-reise-lesezustand.ts`
- `components/trips/GastReiseLesefehler.tsx`

Proof and delivery:

- `lib/trips/guest-trip-read-recovery-1.test.ts`
- `scripts/guest-trip-read-recovery-1/**`
- `docs/evidence/guest-trip-read-recovery-1/**`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_PLAN_2026-10-24.md` (already on the plan commit)
- this report, plus STATUS, SELF_REVIEW, and HANDOFF

Not changed: TASK V1, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, #751, storage, create-entry, server, Auth, DB, dependencies, workflows, config, global styles.

## Behavior

Observation order is occupancy (`gastCreateBelegungLesen`), a raw snapshot of the three known guest keys, one `gastspeicherLaden()`, a second snapshot, then occupancy again. `schrieb` is byte inequality of those three keys around that one loader call.

Classification after a completed observation:

- Post-load occupancy `gueltig` whose id matches the loaded active trip is a valid trip, including a legacy migration that persisted.
- Post-load `speicher_unlesbar`, or a loader throw, is unreadable. A missing active key whose legacy key cannot be read is unreadable, not a free slot.
- A pre-load unreadable result that the post-load occupancy then confirms as empty or queue-only is that confirmed state.
- Post-load `ungueltig` with no active trip keeps the loader's queue and reports `schrieb: false`.
- A pre-load invalid or occupied-without-id result that does not settle into a consistent valid trip is `abweichend`, not absence.
- Post-load `belegt_ohne_kennung` does not surface a generated in-memory id.
- A valid occupancy or a loaded trip that do not agree is `abweichend`.
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
| 2 | Use readonly occupancy. A changed observation fails honestly. | Met. Preflight valid + empty load, and invalid bytes that disappear mid-read, are `abweichend`. |
| 3 | Non-destructive "Erneut prüfen". | Met. It re-observes. Invalid→valid and invalid→absent do not delete the previous bytes first. Restored access shows the trip. |
| 4 | Invalid/unreadable paths preserve bytes and make no mutation/adoption call. | Met in the storage tests and the mounted write counts. Those screens do not mount `TripWorkspace`. |
| 5 | Absence, valid trips, and a different trip keep appropriate behavior. No substitution. | Met. Different trip is a status and a continue link to the stored id. |
| 6 | Valid legacy migration may write. Valid queue listing stays. | Met. Legacy id `trip-alt-1` persists and is `passend`. Queue-only writes zero times. Invalid active bytes still list a readable queue and do not offer create. |
| 7 | No stale trip across `tripId`. No callback signature change. | Met. Mounted trip change has a loading frame without the previous title, and no frame contains both titles. Mutation handlers under a matching trip are the previous functions. |
| 8 | Status/alert semantics, keyboard, loading copy, 320/390/1280 and 200% reflow with real styles. No create while unknown. | Met in the synthetic browser. Screen reader and a physical device are not verified. |
| 9 | Real-component proof with real storage, raw bytes and write counts. | Met. 15 node tests plus 10 mounted scenarios. |
| 10 | Existing preservation, create-entry, storage, and route tests stay intact. | Met. Focused suite 185/185. No loader assertion was weakened. |
| 11 | Synthetic proof is separate from hosted, device, and screen-reader proof. | Stated here and in the evidence notes. |

## Failure modes

- Unreadable: alert, recheck, no create, bytes kept.
- Invalid: alert, recheck, queue listed beside the alert when the loader returned one, no create, bytes kept.
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

Performance: each observation is local and does two occupancy reads plus one loader call. No network, provider, or model call. No new dependency.

## Executed

| Command | Result |
| --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/guest-trip-read-recovery-1.test.ts lib/trips/gastspeicher.test.ts lib/trips/guest-active-draft-preservation.test.ts lib/trips/create-entry.test.ts lib/trips/gast-reisen-cta.test.ts` | 185 tests, 31 suites, 0 fail. The new file contributes 15 tests. |
| `node scripts/guest-trip-read-recovery-1/run.mjs` | PASS 10/10. `pageErrors` empty. Chrome 148.0.7778.96. Evidence `docs/evidence/guest-trip-read-recovery-1/`. |
| `npm run typecheck` | exit 0 |
| `npx eslint` on the four runtime files, the new test, and `scripts/guest-trip-read-recovery-1` with `--max-warnings 0` | exit 0 |
| `npm run check:dead` | 0 orphans, exit 0 |
| `npm run check:exports` | 0 unexplained exports, exit 0 |
| `npm run check:deps` | 0 unused checked packages, exit 0 |
| `npm run check:api-schutz` | 12 admin routes, exit 0 |
| `npm run check:operating-mode` | PASS |
| `npm run check:schema-bezug` | exit 0. Pre-existing LOCAL/UNAPPLIED RPC notes. Not this slice. |
| `npm run build` (`prebuild` runs `check:setup`, then `next build`) | exit 0. Compiled successfully in 16.7s. |
| `npx eslint .` | exit 0. 144 warnings, 0 errors. None of the warnings are in this slice's files. Historical main baseline cited 146 warnings; this run is not claimed as a cleanup of those. |

## Not verified

- Full `npm test` (historical main baseline 7,151 tests / 7,149 pass / 2 opt-in browser skips). Exact-head App CI is the gate.
- Exact-head Auth CI and Vercel Preview. Not available until this head is pushed. Seed Preview does not count.
- Hosted account, physical device, screen reader, Production, provider, and model behavior.
- #985 / #982 held review, #917 hosted readback, #968 cleanup, #748 personal browser. Not investigated.

## Database, cost, documentation

No migration, RLS, or generated type change. No new running cost. Documentation added is this slice's PLAN, STATUS, REPORT, SELF_REVIEW, HANDOFF, and the evidence notes. Global current-state files stay untouched.

## Residuals

- P0: none found.
- P1: none found in the assigned surfaces.
- P2: the mounted bundle shims Next server modules. The failure paths do not execute those imports. The matching trip still renders `TripWorkspace` in the browser. Hosted Next rendering remains the Preview gate.
- P2: full `npm test` was not run in this session.
- P3: `browserslist` printed that `caniuse-lite` is 13 months old during the CSS compile. Dependencies were not updated.
- P3: screen reader and physical-device reflow are not verified. The harness covers keyboard and 320/390/1280 plus 200% in desktop Chrome only.

## Next step

Independent Technical-Lead review of the pushed head. This author stops. Do not Ready, merge, close #991, or start a follow-up.
