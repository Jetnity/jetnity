# Official Truth GOV.UK ETA Semantic Contract Closure 1 — Report

Date: 5 October 2026 (Europe/Zurich)
Issue: #842 · Draft PR: #843
Branch: `audit/official-truth-govuk-eta-semantic-contract-1`
Baseline / merge base: `3ba69f15907e0652cfe83478dabcf91904ca9a00`
Immutable task seed: `a5cee48648e776ca417db2d9cf2c7908b7acb059`
Logical writer: **Jetnity Official Truth GOV.UK ETA semantic contract closure 1**, Generation 1
Execution: **Codex Desktop — `gpt-6-astra` / `xhigh`**
Session: `01a10b67-178a-72a2-a269-6f81cce77743`

## Result

**`GOVUK_ETA_SEMANTIC_CONTRACT_NOT_READY`**

The [semantic contract](OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_2026-10-05.md) maps the audited National List, Appendix and CTA observations to the actual predicate/context vocabulary. It separates requirement truth from application/use eligibility, defines safe negative knowledge, corrects CTA origin relative to GB and distinguishes age-based evidence duty from exemption eligibility.

Existing operators resolve much of the representability question. The remaining legal-semantic gaps cannot be filled by an enum name or a synthetic evaluator test. #791 explicitly compresses the Appendix wording; the tracked evidence does not supply its complete operative clauses. Irish residence/application-time meaning, school relationship/count/confirmation and clause-complete residual coverage therefore remain unresolved. The source-detail stop is documented in contract §12. No official-source refresh was performed and no statement is certified as current law.

Resolved directions include a separate national-passport qualification for application B only, independent BOTC/BNO rows, unchanged CTA predicates with exact journey binding, and a class-wide UK permission assessment whose explicit negative cannot be inferred from one invalid item. New quantified/time-qualified context meanings require schema 2; schema-1 rows must not be silently reinterpreted. These are bounded design directions, not an approved step-2 package.

## Exact files and ownership

Four writer-owned additions:

- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_REPORT_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_HANDOFF_2026-10-05.md`
- `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_SELF_REVIEW_2026-10-05.md`

The complete PR diff also includes the pre-existing seed file `docs/OFFICIAL_TRUTH_GOVUK_ETA_SEMANTIC_CONTRACT_CLOSURE_1_TASK_2026-10-05.md`. Its blob remains `fd83d722936d6d896ef8d08cd05b80e6b4bea768`, byte-identical to the immutable seed. No other path belongs in this delivery.

The checkout is isolated from the parallel Workspace writer. It was cloned from existing local repository objects without hardlinks, given the GitHub origin, and fetched at the named refs. No other writer's working tree was edited. No dependency installation or shared dependency symlink was needed for the static checks.

The local Git push could not authenticate (`could not read Username`); it did not update the remote branch. Delivery uses the connected GitHub transport instead: build on the immutable seed's complete base tree, compare the resulting tree SHA with the locally reviewed tree, then create one child commit and advance only the existing task branch without force. This preserves all baseline files and avoids an incomplete replacement tree. The connector-generated commit identity may differ from the local checkpoint; the final receipt names the verified remote review head.

The binding task's allowed-file restriction takes precedence over generic continuity updates. `ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, `ROADMAP.md`, central architecture and all Workspace/runtime/test files remain unchanged. Continuity is carried by these four delivery documents.

## Model and coordination evidence

Actual Codex session metadata was inspected, not inferred from the requested model label. The current session's `turn_context`, turn `01a10b67-18a3-7c61-9a51-9c233195a461`, records:

| Field | Observed value |
| --- | --- |
| `model` | `gpt-6-astra` |
| `effort` | `xhigh` |
| `collaboration_mode.settings.model` | `gpt-6-astra` |
| `collaboration_mode.settings.reasoning_effort` | `xhigh` |

Only those sanitized identifiers/fields are reproduced. No raw conversation trace or private instruction is committed. No Cursor, fallback model, runtime writer or subagent was started. Parallelism assessment: **SINGLE_AGENT** for this research slice; #841 remains a separate user-owned writer.

## Validation

| Check | Observed result |
| --- | --- |
| `npm run check:operating-mode` | PASS, `NORMAL` |
| `npm run check:dead` | PASS: 656 start points, 1,314 reachable modules, zero orphans |
| `npm run check:exports` | PASS: 1,057 files, zero exports without callers |
| `npm run check:deps` | PASS: 11 dependencies and two inspected dev dependencies, zero unused; configured framework exceptions reported normally |
| `npm run check:api-schutz` | PASS: all 12 admin routes use `requireAdminApi()` |
| `npm run check:schema-bezug` | PASS: static comparison against 22 tables/views and 25 functions in generated types |
| `git diff --check` for staged additions and full baseline diff | PASS before commit |
| Bounded document hygiene | Relative links resolve; Markdown table columns agree; both matrix halves have the same unique IDs; one final classification; allowed files only; task byte equality |

The schema check reports the existing LOCAL/UNAPPLIED references `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v2`, and `official_truth_store_accepted_v2`. This is a local generated-types comparison, not a hosted database read or deployment assertion.

No runtime tests were added, modified or run. Synthetic cases in contract §13 are future review obligations only. Full `npm ci`, tests, typecheck, lint and production build were not run: this docs-only task changes no executable code, packages or configuration. This is the explicit bounded validation exception to the general development checklist, not a claim that those commands passed. Existing test source was inspected as representability evidence. Exact-head CI must be checked separately; seed/main CI is not delivery-head CI.

## Live gate and exact-head protocol

Live reads through 5 October 2026, 09:49 UTC / 11:49 Europe/Zurich, reconfirmed:

- Main and merge base remain `3ba69f15907e0652cfe83478dabcf91904ca9a00`; mode file is `NORMAL`, blob `1912bf56751a940acc56fad84e2bf9e6a174e0fa`.
- #843 is open and Draft at the immutable seed before this writer commit, one ahead / zero behind main. Its initial diff is exactly the task, with zero inline review threads.
- #751's live top section authorizes the two disjoint Codex writers. Its 09:37:21 UTC update includes #841's narrow `attention-presentation` scope expansion, comment `5991882705`; it does not overlap these documents or broaden this writer's authority.
- #841 is open and Draft at `10e7ac7d7f40e912af56eecce04f8b7cdf03be70`; its live changed-file list is only `docs/TRIP_WORKSPACE_CONTEXTUAL_NAVIGATION_PREPARATION_TARGETING_1_TASK_2026-10-05.md`. Its task ownership and authorized expansion are also disjoint.
- #748 has 41 comments, latest MATERIAL `5988971332` and later TL triage `5989855107`. No later blocking MATERIAL was found. The triage records the already-consumed Development approval and identifies its verifier as method-separated, same actor; this writer does not call that actor-independent verification.
- Open-PR inventory, #842, #843 coordination and the relevant prior receipts were read. Lower historical entries in #751 do not override its live top section.

The delivery commit adds only the four files above after the immutable seed. Its intended shape is therefore two ahead / zero behind this baseline. Before and after push, re-read main/mode/#751/#748, #843 metadata/files/review threads and #841 files; stop on material drift. The exact delivered SHA and observed remote counts are recorded in the user delivery receipt, since this file cannot contain its own commit hash. The reviewer must review that SHA, not the seed or a later moving tip. No rebase, merge or Ready transition is part of this delivery.

## Security, data, cost and remaining risk

Hosted DB access: **none**. Production access/operation: **none**. No migration, registration, profile/pin activation, policy/extractor, Evidence/Rule write, traveller UI, F8 or provider/model call from the application. Historical hosted state is attributed only to existing #751/#748 receipts; it was not independently queried here.

No secret, personal traveller fact, passport/permit number, MRZ, scan, biometric, DOB, school name, student ID, free-text legal status or personal fingerprint was collected or committed. No authentication/authorization/RLS change or new ongoing infrastructure cost is introduced.

The material limitation is evidence completeness, not a claim that every named predicate is missing. Positive UK-permission/status exemptions can be described; a residual `required` result is not approved from the incomplete coverage record. Independent review may recover a sufficient audited source record, but this writer has not done so and has not opened the web.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep #843 Draft. Do not Ready, merge, dispatch step 2 or begin another slice.
