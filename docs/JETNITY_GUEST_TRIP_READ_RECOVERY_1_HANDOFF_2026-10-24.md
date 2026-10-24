# Guest Trip Read Recovery 1 — HANDOFF

Date: 24 October 2026
Writer: **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**
Session: `bc-2806475d-7ee4-40d0-980e-1d26bcb5b270`
https://cursor.com/agents/bc-2806475d-7ee4-40d0-980e-1d26bcb5b270
Actual model: `grok-4.7-high-fast` (requested Grok 4.7 High Fast). Not Auto.
Issue: #991. Draft PR: #994. Branch: `fix/guest-trip-read-recovery-1`.

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW. NOT READY. NOT MERGED. ISSUE STAYS OPEN. NO FOLLOW-UP.**

The self-review is not Technical-Lead PASS.

## Exact git

| Item | Value |
| --- | --- |
| Base / `origin/main` | `913cf9353fd33491d2bd3130b3c430cc88990200` |
| Merge-base | `913cf9353fd33491d2bd3130b3c430cc88990200` |
| Seed | `de51604c832061ffd18f5742766d5da83cd7caae` |
| Plan | `de65696cc4233beb4dab02f04fefb31f7c1d8973` |
| Addendum V2 | `83c64c7c093b3024c4da13aa72502f39872d688e`, blob `8cff61c42d3b341aeee67ec4cb48bfa2999b4271`, not edited |
| Addendum V3 | `2dcc1e5475fb4a70b9b3c89fed2497ab79e1acc3`, blob `e7d6fb1ff65c45238d7d74c752b5e65c8184ac9f`, not edited |
| Superseded review heads | `7e7a2e4b1f2733bc970673acd7582fde4eaac83d`, `f2d8f7e4d94c0a9659652c025b7852862e0b4953` |
| Ahead / behind after this R2 delivery | 10 / 0 |
| Final head | The adapter commit after addendum V3. The PR comment records `git rev-parse HEAD` after push. Do not treat `f2d8f7e4`, `7e7a2e4b`, `8f954a46`, or an older Preview as the gate for this head. App CI on f2 is the failure this head answers, not a pass. |
| TASK V1 blob | `9a089b26a6892ede8f235692b92f72dc225df147` |
| `gastspeicher.ts` blob | `39b75a606c5ae68f64dbd6c3968198d6c0ec3929` (baseline `1964cfc9b78f7361e23ff6fb9ccd64dbd3491399` plus the wrapper only) |
| `create-entry.ts` blob | `eac2e408a74bf9b8174b6e3d5b74c5da80c02651` (unchanged) |
| Mode | `NORMAL` |
| Integration | Lane B of the finite R104 batch. Order stays B → A → C. Lanes A and C are already active on their own branches. No sibling code is in this branch. |

If `origin/main` moves before review, do not silent-rebase. Technical Lead directs any main refresh through this same author and session. A new head invalidates these gates.

## Changed paths

- `components/trips/GastReisen.tsx`
- `components/trips/GastArbeitsbereich.tsx`
- `components/trips/gast-reise-lesezustand.ts`
- `components/trips/GastReiseLesefehler.tsx`
- `lib/trips/gastspeicher.ts` — one additive export, `gastspeicherWarteschlangeLesen()`, returning `bestandWarteschlange()`. No other textual change.
- `lib/trips/guest-trip-read-recovery-1.test.ts`
- `scripts/guest-trip-read-recovery-1/**`
- `docs/evidence/guest-trip-read-recovery-1/**`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_PLAN_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_STATUS_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_REPORT_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_SELF_REVIEW_2026-10-24.md`
- `docs/JETNITY_GUEST_TRIP_READ_RECOVERY_1_HANDOFF_2026-10-24.md`
- `lib/trips/flug-manuell.test.ts` — guest adapter only
- `lib/trips/unterkunft-manuell.test.ts` — guest adapter only

R2 does not change production, `laden()`, the account adapters, or the mounted harness.

## What the Technical Lead is reviewing

Honest guest list and workspace reads. Invalid and unreadable occupancy does not call `gastspeicherLaden()`. Invalid occupancy lists a valid queue through the readonly wrapper, on both surfaces, with the raw bytes unchanged and zero mutation calls. A later removal of the active key does not make that failed observation migrate. A fresh recheck may. Unreadable occupancy stays unreadable. A legacy or queue read failure does not hide a valid active trip. A legacy draft with a stored id stays usable when the migration write fails; a legacy draft without an id does not get a continue link. Recheck does not delete. Unchanged-error keyboard retry restores focus on "Erneut prüfen" unless the user moved focus during loading. Create is withheld while the active slot is unknown, invalid, unreadable, inconsistent, or already another trip. A different trip links to its stored id. Disagreement copy does not claim that nothing was deleted.

Acceptance matrix, failure modes, and the truth/privacy/security/accessibility/performance notes are in the REPORT. Evidence notes: `docs/evidence/guest-trip-read-recovery-1/NOTES.md`.

## Executed versus not verified

App CI on f2, run 40087269667 job 120852780101: 7173 tests, 7169 pass, 2 fail, 2 existing skips. Both failures are the guest adapters in the two wiring files (`useRef` of `null` inside `useGastLeseFokus`).

Executed on this tree before the R2 commit:

```
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/flug-manuell.test.ts lib/trips/unterkunft-manuell.test.ts lib/trips/guest-trip-read-recovery-1.test.ts lib/trips/gastspeicher.test.ts lib/trips/guest-active-draft-preservation.test.ts lib/trips/create-entry.test.ts lib/trips/gast-reisen-cta.test.ts
```

267 tests, 39 suites, 0 fail. That includes both complete wiring files, not only the two previously failing tests.

`npm run typecheck` exit 0. `npx eslint --max-warnings 0 lib/trips/flug-manuell.test.ts lib/trips/unterkunft-manuell.test.ts` exit 0.

Unchanged mounted proof `node scripts/guest-trip-read-recovery-1/run.mjs`: the first run failed `tastatur-fokus-nach-pruefung` once, with focus still on `BODY` while the unreadable copy and the recheck button were already present. The immediate rerun passed 12/12. Both runs used the same production tree as f2. The passing run recorded empty `pageErrors` and empty `externalRequests`. Evidence files were left at the f2 proof: the only result delta was the ephemeral local port, plus two screenshot byte drifts. Those were not committed.

`npx eslint lib/trips/gastspeicher.ts` reports four pre-existing `@typescript-eslint/no-unused-vars` warnings at lines 935 and 990–992. The diff does not touch those lines. They were not rewritten, because addendum V2 keeps every existing function textually unchanged.

Not repeated on this head: full `npm test`, `npm run build`, full `npx eslint .`, hygiene checks, exact-head App/Auth CI, and Vercel Preview. The production build and full eslint (144 warnings, 0 errors) were on `7e7a2e4b` only.

Not verified, and not claimed: full `npm test`; exact-head App CI; exact-head Auth CI; Vercel Preview of this head; hosted account; physical device; screen reader; Production; provider or model behavior.

No-hosted / no-provider boundary: synthetic local Playwright and in-memory `localStorage` only. The harness shims Next server modules so the components mount outside Next. It does not stub `gastspeicher` or create-entry.

## Residuals

- P0: none found.
- P1: none found.
- P2: Next server imports are shimmed in the harness. Preview is still required.
- P2: full local `npm test` was not run.
- P3: caniuse-lite age warning during the proof CSS compile. No dependency edit.
- P3: keyboard and reflow evidence is desktop Chrome, not a device or a screen reader.
- P3: one unchanged-error focus assertion in the mounted proof observed `BODY` before the restore effect. The rerun passed. These two unit adapters do not prove that focus behavior.

## Boundaries kept

#985 / #982 scoped HOLD: no retry or reroute of that review. #917 hosted readback not attempted. #968 cleanup not touched. #748 personal browser not used. No credential read, hosted write, provider activation, or new storage schema. The only storage edit is the additive readonly wrapper authorized by addendum V2.

## Exact next step

Technical Lead reviews this pushed head independently, including the changed files, the mounted behavior, and fresh exact-head CI and Preview. Only the Technical Lead decides Ready and merge. After an ordinary merge, actual-main CI / Production / domain acceptance is separate.

R104 is a finite three-lane batch. Integration order stays B → A → C. Lanes A and C are already active on their own branches. This lane does not integrate them and does not start a follow-up.

Immediate CHANGES REQUIRED stay with this logical author and this session. Every changed head needs full re-gating.
