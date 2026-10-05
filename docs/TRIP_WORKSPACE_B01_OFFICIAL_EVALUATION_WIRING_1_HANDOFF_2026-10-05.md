# Trip Workspace B01 — Official Evaluation wiring 1 — Handoff

Date: 5 October 2026 (Europe/Zurich)
Logical writer: **Jetnity Trip Workspace B01 Official Evaluation wiring 1**, Generation **1**.
Status: **DRAFT DELIVERY / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**.

## Identity

- Issue #846 / Draft PR #847.
- Branch: `feat/trip-workspace-b01-official-evaluation-wiring-1`.
- Baseline: `bb42e261771245b1675d2886cec96b60674dd608`.
- Immutable seed: `a2695d6e3e69e06e181507ef79ffcfb3a51c86b0`.
- Immutable TASK blob: `67d42b213ad9ef4551731ea24e01069d7acde10b`.
- Session: `01a10d2b-c0de-7e33-9bb5-8b868e123de4`.
- Verified model / effort: `gpt-6-astra` / `xhigh`.
- Dispatch: PR #847 comment `5999814840`; autonomous commit/push directive in #751 applies.

## Review the final data flow

`ReiseSeite` authenticates/classifies the ID, loads the existing Trip under RLS and handles error/not-found first. It then calls `tripOfficialEvaluationsAuswerten(reise)`. That helper is server-only and delegates to the existing `requirementsFuerReise` with exactly `requirementsProviderNachZustand(requirementsProviderAus())`. The returned `OfficialEvaluation[]` travels unchanged through `KontoArbeitsbereich` to the existing `TripWorkspace` presentation.

Review the new helper, the two tiny integration diffs and the focused tests. Registry is only input for its existing explicit adoption UI. Guest, provider factory, HTTP route, TripWorkspace/presentation, account registry implementation, types and migrations are byte-identical to baseline.

Current factory is still null; this is complete Account B01 plumbing with honest fail-closed output, not provider activation or a new official entry decision. Future trusted-provider authorization is outside this task.

## Evidence

- 20 B01-specific tests; 136 focused tests passed.
- Full `npm test`: 5,366 passed / 0 failed / 0 skipped in the existing isolated Linux/PostgreSQL 16 image, matching lockfile; native macOS lacks the Linux PostgreSQL path expected by four existing tests.
- Typecheck, full lint, changed-file lint, production build, all five hygiene checks, operating-mode gate and diff whitespace check passed.
- Full lint retains 144 pre-existing warnings, none in changed files.
- Frozen input and array-reference checks prove no mutation, truncation or reconstruction.
- Real null-factory tests cover two travellers, two citizenships per traveller, two documents per traveller, multiple destinations/transits and reordered peers.
- Auth, deferred load, missing/foreign UUID, loader-error, Guest and repeated-render tests execute actual TS/TSX modules.
- Production/off-state test providers never run. Throw/timeout tests reuse the real engine and abort behavior.
- Existing registry callback and refresh behavior remain intact; newly loaded Trip context is recomputed without cache.

The report lists all eight files in the main comparison (including the unchanged seeded TASK) and the validation commands. Remote delivery evidence is completed after the commit is pushed: use the final session receipt plus live PR #847 head, exact-head CI and Vercel metadata. Earlier seed CI/Preview is not delivery evidence.

## Concurrency and review boundary

Live #751 permits #848/#849 concurrently as a disjoint Japan source-audit docs writer. Observed #849 seed `427c50dc5e499b541a25c06d0e9ec1d79d41ac8f` has zero file overlap. Recheck both heads before integration. #748 has no newer MATERIAL after the recorded processed marker/receipt; main stayed at the baseline during local validation; mode stayed NORMAL.

No live authenticated browser or real-device account acceptance was performed. Local disposable PostgreSQL tests are not hosted RLS re-verification. The existing loader/RLS contract is unmodified.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep Draft. Agent self-review does not authorize Ready or merge. No next slice, F8, provider activation or database work is started.
