# Trip Timeline Intelligence contract design 1 — Report

6 October 2026 · Issue #885 · Draft PR #889

Classification: **TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_READY**.

This is a docs-only writer delivery classification for independent review. It is not Technical-Lead PASS, GitHub Ready, a runtime delivery or permission to start the proposed slices. PR #889 must remain Draft.

## Result

The [design](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_2026-10-06.md) specifies the future input/evidence envelope, civil/instant interval model, four conflict states, explicit buffer-policy metadata, directed movement proof, missing-transfer versus unassessable transfer, qualified geographic claims, schedule gaps and usable windows, clock-qualified next item, actions, invalidation and cross-device presentation. Its matrix is a future acceptance oracle, not a claim that those features or tests exist today.

Differentiation Impact: decisions use the whole saved Trip and canonical Route with visible proof limits. The traveller can identify the next useful correction without receiving invented minutes, airport assignments, free time or automatic changes. This implements the doctrine at design level: Planen → Entscheiden → Reisebereit sein, with no manufactured readiness/official claim.

## Live reconstruction

Initial remote reads occurred on 6 October 2026 at approximately 19:39–19:41 Europe/Zurich (17:39–17:41 UTC); later status snapshots are separately identified at STOP. Sources were GitHub connector reads and a Git fetch into an isolated checkout.

| Evidence | Observed value |
| --- | --- |
| Repository / branch | `Jetnity/jetnity` / `docs/trip-timeline-intelligence-contract-design-1` |
| Remote `main` and design source baseline | `fc2734ca60ae3c578fbcd414055fe983773d74d2` |
| Initial PR head / TASK seed | `0c4b3f984cbd32f1f0fe3c96035c46f6f6281827` |
| Initial merge-base | `fc2734ca60ae3c578fbcd414055fe983773d74d2` |
| Initial branch ahead / behind | 1 / 0 |
| `.jetnity/operating-mode.json` | `NORMAL`; blob `1912bf56751a940acc56fad84e2bf9e6a174e0fa` |
| [#751](https://github.com/Jetnity/jetnity/issues/751) | Live index confirms baseline, Codex Desktop lane, normal commit/push authority, four separate writers and Technical-Lead-only Ready/merge |
| [#885](https://github.com/Jetnity/jetnity/issues/885) | Open; docs-only design; 0 comments at initial read |
| [#889](https://github.com/Jetnity/jetnity/pull/889) | Open, Draft, unmerged; task-seeded only at initial read; no submitted reviews at 17:50 UTC read |
| Binding TASK | `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_TASK_2026-10-06.md` |
| TASK blob (remote blob and local Git hash) | `f10ba41bcb0847737e8100c9655e87f81297da0e` |
| Parallel #884 / [#888](https://github.com/Jetnity/jetnity/pull/888) | Draft, unmerged; initial head `6e5b60d4c91d100d29d71941b4e102031f98a7eb` |
| Parallel #886 / [#890](https://github.com/Jetnity/jetnity/pull/890) | Draft, unmerged; initial head `dab5d00a8021f6690e02977684af67e226501c00` |
| Parallel #887 / [#891](https://github.com/Jetnity/jetnity/pull/891) | Draft, unmerged; initial head `5a9b78a17f40acdb853264f5a8ded11f04aef161` |

TASK references #884/#886/#887 as issues; user dispatch references their corresponding PRs #888/#890/#891. These are the same three parallel slices, not a numbering conflict. No unpublished implementation was read as a binding source. #751's prior CI/Production statements were read as index context, not freshly verified release evidence for this branch.

Git HTTPS initially failed inside the network-restricted sandbox (`Could not resolve host`). The normal read-only fetch succeeded with reviewed network permission. The subsequent CLI push could not obtain a username (`Device not configured`) and changed no remote ref. Publication therefore uses the already connected authenticated GitHub Git-data tools: create the identical four-document tree on the TASK seed, create one commit, then fast-forward only the authorized branch with an expected-head check and `force=false`. Verify tree/blob equality and remote readback; the connector commit's metadata/SHA can differ from the unpublished local commit. No secret was printed, no credential replaced and no existing checkout modified. All local work is in this chat's isolated `work/jetnity` clone.

## Repository-grounded findings and decisions

| Finding | Consequence in the design |
| --- | --- |
| Domain items expose local clocks with no timezone; route ordering may be topological rather than absolute | Separate civil display/order from qualified instant and elapsed-time proofs. Next-now requires an explicit clock and event qualification. |
| Manual Date-Line schedule can be richer than nullable legacy item end fields | Flight boundaries come from canonical itinerary; no fallback reconstruction or local-string negative-duration verdict. |
| `mobilitaetsAbdeckung` accepts name fallback and computes local-clock differences through synthetic UTC parsing | Its outputs are not new Intelligence proof certificates. Adapter must validate original identity/time evidence. No legacy repair in this docs-only scope. |
| Activity `frei` means no overlap in its limited same-day comparison | Do not reuse it as usable free time, elapsed-time proof or complete trip clearance. Future contract migration requires reviewed regressions. |
| Current Trip has no item participant assignment, exact activity venue or terminal/timezone proof | Plan-level overlap copy only; item-level physical claims remain unknown where facts are absent. No first-traveller or stage-centroid inference. |
| Attention already distinguishes four empty states and groups without dropping members | Preserve those states, use explicit coverage, deduplicate the same canonical issue and keep priority independent of group size. |
| Readiness and booking are separate user/external domains | A booked item, checked preparation or suppressed banner cannot create route/time/official sufficiency. |

These are integration constraints, not a claim that new runtime defects were reproduced. The stricter future consumer is designed to reject evidence that is too weak for its proposed claims.

The [integrated Workspace audit](TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_2026-10-06.md) was read with its report/handoff, along with the subsequent #877 flight coverage, #878 direct-flight readback and #879 validation-recovery reports and actual baseline source. The earlier audit's F-01/F-03/F-04 are addressed on this baseline; their stale state must not be carried forward. F-02 focus after reclassification and F-05 internal accessibility tokens inform future UX acceptance; V-01 stale audit selector and real-device/Account-E2E gaps are still unclosed by this design. No browser regression proof is asserted here.

Read-only governance/product inputs included AGENTS, startup live-index pointer, Technical-Lead operating standard, Multi-Agent operating system, vision, relevant architecture/roadmap/ADR sections, design system, quality/logic/continuity standards, Product Differentiation Doctrine, TW-3/TW-4 ADRs, Workspace target architecture and final-intelligence audit policy. User/TASK's four-file scope overrides general continuity-update suggestions. No global continuity file was changed.

## Audited source identities

These Git blob identities make the principal observations reproducible at the baseline. They do not claim that future main will retain the same code.

| Source | Blob |
| --- | --- |
| `types/trips.ts` | `24fe7cf80087a6d87cfc465a76cff1c5470dad99` |
| `lib/trips/timeline.ts` | `2145941409c943b68f4dba6a4ee67f05e8e60c32` |
| `lib/route/chronologie.ts` | `fbceaf2f20ce2077265f7148095eede81e4a7010` |
| `lib/route/verbindung.ts` | `b95cd22cc6012bd9e8ad1ae92b55f20722c57619` |
| `lib/trips/flug-manuell.ts` | `4a540e179a2cba34cbe1bb20eda2ae75ffcf4516` |
| `lib/trips/flug-abdeckung.ts` | `1b8f7d005c8dbe74eec69c37cea2901c2147d049` |
| `lib/mobility/kanten.ts` | `3cfdcad030f8b7047cb1191bcfa6b3a4b892cd4f` |
| `lib/activities/konflikt.ts` | `6893b3f96064adb39ed856f32797cdb532a15048` |
| `lib/trips/attention.ts` | `282d4d96ef45883c473a06be49a7617f01b4ea86` |
| `lib/trips/attention-presentation.ts` | `ea288d05783403f9d5e1b48e7c1af384472c1ae0` |
| `lib/readiness/domain.ts` | `27ffd5d9f7b118a09741e92fee32d9cb08401927` |
| `lib/readiness/status.ts` | `0940f135ef7f52f15a9aed2e3b19126a837660be` |
| Product Differentiation Doctrine | `77f9225df23ced467e10ea1ebb4d1ffc6e5f78c1` |

## Validation and evidence limits

Verification is documentation-only: full TASK-to-section trace in [self-review](TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_SELF_REVIEW_2026-10-06.md), adversarial walk-through, fixed-offset example arithmetic, local Markdown target/anchor checks, exact four-new-file allowlist, unchanged TASK hash and whitespace/diff checks. Results are recorded in the self-review; final remote identities and Draft state are re-read after push in the STOP receipt.

No product runtime, dev server, provider/API flow, browser, database/Supabase, model/agent application, map/weather or Official Truth work was started. No dependencies were installed. TypeScript, lint, full/unit application tests, production build, hosted Preview UI, real-device, Auth/Account E2E and Production checks were **not run**. This is the explicit docs-only exception to broad runtime/build checklists; it is not a skipped check counted as PASS. Historical test totals in earlier reports are not this slice's results. Any automatic repository CI/Preview triggered by normal push is separate from writer-run acceptance and cannot be inferred from the TASK seed.

Security: no access, authority, persistence or network behavior changes. Future external fact admission and action target validation are explicitly gated. Data/DB/migrations: none. New ongoing product cost: none.

## Scope and publication identity

Exactly four new deliverables relative to the seed:

- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_2026-10-06.md`
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_REPORT_2026-10-06.md`
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_TIMELINE_INTELLIGENCE_CONTRACT_DESIGN_1_SELF_REVIEW_2026-10-06.md`

The full PR diff against its merge-base additionally contains the **pre-existing, unchanged TASK seed** (five paths total). No fifth deliverable or evidence directory is added. Scratch checks are outside the repository. The final delivery commit contains these documents and cannot literally contain its own commit hash. Its exact SHA, remote branch equality, fresh main, merge-base/ahead/behind and TASK readback are therefore reported in the post-push STOP receipt; reviewers must resolve PR #889's current `head.sha` and invalidate that receipt if it has moved.

## Open design risks and next owner

1. **Pending Core reconciliation:** #888 was unmerged at reconstruction. Actual types, date precedence, event projection, selection and update hooks must be rebound under design §13 before runtime dispatch. This is a mandatory dependency gate, not assumed compatibility.
2. **Sparse proof:** current venue/zone/clock/operational facts cannot support every desired positive claim. Honest initial results will often be unknown. Adding those sources or persistence is a separate task, never an implementation shortcut.
3. **Legacy semantic overlap:** Mobility minutes/name matching and activity `frei` have weaker semantics. Future adapter and cross-domain tests must prevent promotion and contradictory surfaces. Existing findings are not silently repaired here.
4. **Policy governance:** no universal numeric buffers or clock-freshness constants are approved. A future bounded task must pin policy IDs/versions/source/values before enabling corresponding numeric recommendations.
5. **UX evidence:** warning grouping, focus after save/reclassification, real hardware and genuine Account flow are future acceptance obligations. A paper design cannot close them.

Recommended later sequence: (1) evidence/interval/overlap projection, (2) directed mobility/buffers/gaps, (3) clock-qualified next/actions/cross-device integration. Each requires a new bounded Technical-Lead task after Core reconciliation. None was started.

Execution identity: **Trip Timeline Intelligence contract design 1**, generation 1 for this bounded writer; Codex Desktop; session `01a1124c-460a-7fd0-b5b4-bb2dbd7caa95`; persisted session `turn_context` reports model **`gpt-6-astra`**, effort **`xhigh`**. One writer, no replacement session or delegated subagent.

Next responsible actor: independent ChatGPT / Technical Lead, exact-head review. **STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
