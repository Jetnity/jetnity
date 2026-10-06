# Connected Day Experience integration design 1 — Report

6 October 2026 · Issue #886 · Draft PR #890

**CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_READY**

The four permitted design documents are complete for independent exact-head review. No feature is implemented by this delivery. This classification is not Technical-Lead PASS, runtime readiness or a change to Draft status.

## Identity and live reconstruction

- Repository: `Jetnity/jetnity`.
- Branch: `docs/connected-day-experience-integration-design-1`.
- Baseline / initially observed remote main: `fc2734ca60ae3c578fbcd414055fe983773d74d2`.
- Task seed / initially observed remote branch: `dab5d00a8021f6690e02977684af67e226501c00`.
- Binding [TASK](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_TASK_2026-10-06.md) blob: `29cf9b02d83974cf6aeaa5f3946acfc215e78bb5`, unchanged.
- Mode on live main: `NORMAL`; mode blob `1912bf56751a940acc56fad84e2bf9e6a174e0fa`.
- Live reads: #751 body/comment, #886 body/comments, #890 metadata/discussion, #888/#889 metadata and remote main/branch refs. #886 had no comments; #890 was open Draft with the immutable seed.
- #751 records four explicitly disjoint Codex slices and supersedes historical single-writer/Cursor dispatch wording. Its older historical “no active writer” paragraphs do not override the current active-writer section. No other agent was dispatched here.
- #888/#889 were unmerged at reconstruction. No unpublished interface was consumed; design section 14 requires reconciliation to their accepted merged contracts.

Final commit identity is the commit containing this report and the other three new documents. A Git commit cannot embed its own SHA; the post-push STOP receipt supplies the exact remote/local head, current main, merge-base and ahead/behind. Review that exact commit, not the seed or a moving branch label.

## Delivered design

The [design](CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_2026-10-06.md) provides source/freshness/provenance/failure/fallback/provider contracts for booking, Preparation, map/presentation route, weather, hours/reservation, saved daily prices/estimates and Change Impact. It defines progressive disclosure, 360/390/768/1440 interaction requirements, 26 adversarial acceptance cases and nine reconciliation gates.

Material repository-grounded decisions:

1. Booking supports user-marked states only; activities do not acquire a new booking action. Cancellation remains outside the current enum and cannot be inferred from notes.
2. Preparation reuses exact existing section/traveller query targets. No fictional task-row anchor, broad user-status overlay on Official evaluations, or first-credential selection.
3. Stage coordinates support stage pins, not venue pins. Map order is a projection and cannot rewrite canonical graph or flight route truth.
4. Weather and venue hours remain future, independently sourced context. Missing data/freshness stays visible; no live data was consulted.
5. Daily cost starts as saved prices of canonically assigned items, once per item and per currency. A multi-night amount is not silently split; estimates, budget, payment and refunds remain separate.
6. Change Impact distinguishes proven dependants from possible scope overlap. A precise count requires unique proven targets. Snapshot invalidation covers clock-only edits even when existing domain fingerprints do not change; it does not rewrite those domains' truth.

The differentiation is reuse of trip context and explained dependencies, not additional independent planner widgets. Existing protected commercial items, no-provider states and the four-mode Workspace stay the foundation.

## Validation and evidence limits

Checks executed locally with the unchanged repository scripts:

| Check | Result |
| --- | --- |
| `node scripts/operating-mode-guard.mjs` | PASS; mode NORMAL |
| `node --test scripts/operating-mode-guard.test.mjs` | **16/16 PASS**, 0 failed, 0 skipped |
| `node scripts/erreichbarkeit.mjs` (`check:dead`) | PASS; 661 entry points, 1,328 reachable modules, 0 orphan modules |
| `node scripts/exporte.mjs` (`check:exports`) | PASS; 1,070 files, 0 unused exports |
| `node scripts/pakete.mjs` (`check:deps`) | PASS; 11 dependencies and 2 imported dev dependencies checked; configuration-only tools explicitly excluded by existing scanner |
| `node scripts/api-schutz.mjs` (`check:api-schutz`) | PASS; static inspection of 12 admin routes, no API call |
| TASK object identity | Exact immutable Git blob verified against seed |
| Documentation integrity | Relative source links, four-file allowlist, A01–A26 and R1–R9 presence checked locally |
| `git diff --check` | PASS; final staged/committed scope checked before publication |
| Semantic self-review | TASK requirements mapped; counterexamples and present-data limits in self-review |

No new tests, runtime fixtures, scripts or dependencies were added. The 26 adversarial cases are **design acceptance specifications**, not 26 executed product tests. Source tests were read for grounding; their historical results are not counted as new execution.

Docs-only validation scope: `npm ci`, full domain tests, Typecheck, Lint, production build, browser/physical-device audits and DB/schema checks were **not run locally**. No runtime/dependency/configuration file changed. This is an explicit docs-only exception to the broad development checklist, not a claim those gates passed or are unnecessary for later runtime. Independent review must assess applicable exact-head CI; the final STOP receipt records any post-push remote readback separately. No local rendering/UX acceptance or Production health is certified here.

## Scope, security, cost and risks

Only the four TASK-allowed Markdown deliverables are authored. Relative to main, the PR additionally contains the unchanged TASK seeded by the Technical Lead. No global continuity, application, test, schema, migration, configuration, dependency, asset or provider file is edited.

Zero DB/Supabase access, provider/model invocation, live weather/maps/hours retrieval, acceptance/store write, F8 or Production mutation. Network use is limited to the expressly requested repository evidence and branch publication. No new recurring cost, secrets, personal trip records or production credentials are introduced.

No P0/P1/P2/P3 defect in the bounded document delivery was identified by writer self-review; this is not an independent finding clearance. Remaining implementation risks are explicitly gated:

- **Truth/integration:** Core/Intelligence interfaces are not merged; mandatory R1–R9 reconciliation before runtime. No precise dependency count without actual associations.
- **Missing current fields:** activity/stay venue coordinates, general outdoor flag, structured reservation/cancellation and estimate/price-age contracts are absent. Display unknown or keep the feature unavailable; do not extend schema implicitly.
- **Time/freshness:** zone-free item clocks and incomplete fingerprint coverage prohibit assumed cross-zone feasibility or automatic “still current” results.
- **Cost meaning:** assigned-item subtotal is incomplete spending information. Multi-day attribution, missing currency/price and unassigned items require explicit labels.
- **UX verification:** the density and touch/focus rules are designed, not browser/device-proven in this slice.

## Recommendation and STOP

After merged Timeline Core plus the necessary accepted/reconciled Intelligence contract: (1) booking/Preparation composition, (2) saved per-currency day costs, (3) stored-location list/pins, (4) bounded proven Change Impact. These can run without new providers. Then separately gated weather/hours/routing and later True Trip Cost. No stage is authorized or started by this report.

Execution: Codex Desktop; session `01a1124c-a055-7111-a846-2fc31d9a27d3`; model `gpt-6-astra`, effort `xhigh`, verified from local session `turn_context` metadata. Logical writer: Connected Day Experience integration design 1, Generation 1. No subagent or replacement writer.

PR remains Draft. **STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** No Ready, merge or follow-up.
