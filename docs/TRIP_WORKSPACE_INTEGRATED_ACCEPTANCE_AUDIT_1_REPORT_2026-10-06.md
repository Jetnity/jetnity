# Integrated Trip Workspace acceptance audit 1 — Report

6 October 2026 · Issue #869 · Draft PR #871 · Codex Desktop

**Audit delivered for independent review. Product acceptance: FAIL. No product fix implemented.**

## Outcome

- The bounded B03a/B03b/U02/U03/B01 contracts have substantial fresh passing evidence.
- **P1 F-01:** date-only flight matching gives an unrelated route required-flight coverage and can suppress Attention.
- **P2 F-02/F-03/F-04:** conditional post-save focus/status loss; direct-flight schedule hidden in read view; all-fields validation without first-error focus.
- **P3 F-05/V-01:** machine-state tokens in accessible Attention names; stale selector in the old premium audit.
- P0: none observed. Genuine authenticated Account E2E: **NOT_VERIFIED**.

The [main audit](./TRIP_WORKSPACE_INTEGRATED_ACCEPTANCE_AUDIT_1_2026-10-06.md) contains the full acceptance matrix, exact source/evidence references, reproduction steps and bounded recommendation.

## Fresh checks actually executed

| Command / check | Actual result |
| --- | --- |
| `npm ci --offline --ignore-scripts --no-audit --no-fund` | PASS; 530 packages from local cache. Install scripts deliberately not executed. |
| Existing Node tests: all `lib/trips/*.test.ts` plus B01 engine/gate, preparation, identity, party-slot, option-scope, traveller-context and truth tests | **952/952 PASS**, 0 fail/skip; [TAP](evidence/trip-workspace-integrated-acceptance-audit-1/focused-tests.log). |
| Existing route tests plus selected Readiness/context/temporal tests and `lib/reiseaenderung/*.test.ts` | **387/387 PASS**, 0 fail/skip; [TAP](evidence/trip-workspace-integrated-acceptance-audit-1/additional-tests.log). Counts are per invocation, not disjoint coverage totals. |
| Mistaken broad `lib/route/*.test.ts` + `lib/readiness/*.test.ts` invocation with trailing `--help` | **1535 pass / 4 fail / 1539 total**, 0 skips. Four absent-initdb local PostgreSQL fixture bootstrap failures. No DB started. [Complete recovered TAP](evidence/trip-workspace-integrated-acceptance-audit-1/broader-attempt.log). This is not a full-suite PASS. |
| Existing contextual-navigation browser audit | **57 cases PASS** at 360×800, 390×844, 1440×900. Real shared component, synthetic local audit payload, no account authentication. |
| Existing premium browser audit, first attempt | Interrupted while Guest render lacked config; no complete result. Retained screenshots are partial only. |
| Existing premium browser audit with local placeholders | **FAIL**: one obsolete “Zurück zur Reise” selector; 12 viewport steps measured. Current correct navigation proved by the navigation audit. No source/script patch. |
| Integrated real Guest harness | **56 bounded interaction/data assertions PASS** (14 per target width); 44 named layout observations. Its mechanical PASS field is not whole-product acceptance: visual inspection and follow-up found F-01–F-05. |
| Targeted direct schedule / four-segment validation / save controls | Reproduced at all four target widths; [targeted-findings.json](evidence/trip-workspace-integrated-acceptance-audit-1/targeted-findings.json). |
| Real Guest wrong-route coverage and bucket-change reproduction | Reproduced at 390×844 and 1440×900; null-country and explicit-country pure-function checks supplement UI. |
| Real Guest manual item creation and context return | PASS at 390×844 and 1440×900; new stay/flight persist through reload and Back retains day-1. |
| Pure two-wrong-flight propagation | `belegt`, “Hinflug gebucht · Rückflug gebucht”, no flight Attention — confirmed F-01. |
| `git diff --check` and final allowlist/TASK verification | Required final delivery check; recorded in [scope-check.txt](evidence/trip-workspace-integrated-acceptance-audit-1/scope-check.txt). |
| Production build, fresh full `npm test`, lint, typecheck, hosted Preview, DB/RLS, physical devices | **NOT RUN / NOT_VERIFIED**, as applicable. No inherited green claim. This docs-only audit's TASK requires focused tests and diff checks, not a DB or production-build run. |

Exact invocations and environment boundaries: [commands.json](evidence/trip-workspace-integrated-acceptance-audit-1/commands.json). The local baseline `next dev` first hit sandbox EPERM; it was then started with reviewed local-process permission. The old no-placeholder Guest run did not establish Guest acceptance.

## Viewports and render evidence

| Viewport | Fresh render/interaction scope |
| --- | --- |
| 360×800 | Navigation; real Guest stay/flight/preparation; 30 days/six stages; 200% root text; targeted editor checks. |
| 390×844 | Same, plus true manual create, false coverage/booked reproduction and focus-bucket transition. |
| 768×1024 | Real Guest interactions and layout; preparation/flight 200% text; long trip; targeted editor checks. |
| 1440×900 | Same as 390, desktop split layout. |
| 1024×768, 1280×800, 1920×1080 | Existing premium overview geometry/screens only. No complete Guest-flow claim for these extra widths. |

All 44 integrated geometry observations report zero page-horizontal overflow. Normal-size primary workspace controls meet the measured 44px height; normal inputs meet 16px. The small-control inventory includes inline account prose links; it is not automatically a WCAG failure. No screen-reader speech, contrast certification, physical touch/keyboard or native browser 200% zoom is claimed.

Representative screenshots:
- [390px wrong-flight coverage](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-false-outbound-selected.png)
- [390px booked wrong-flight coverage](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-false-outbound-booked.png)
- [390px post-save lost context](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-save-reclassification-focus.png)
- [390px Preparation target](evidence/trip-workspace-integrated-acceptance-audit-1/integrated/390-preparation-target.png)
- [360px stay recompute](evidence/trip-workspace-integrated-acceptance-audit-1/integrated/360-stay-saved.png)
- [768px premium overview](evidence/trip-workspace-integrated-acceptance-audit-1/premium-local/screens/overview_768x1024.png)
- [1440px long-trip plan](evidence/trip-workspace-integrated-acceptance-audit-1/integrated/1440-long-trip-day30.png)
- [360px manual flight at 200% text](evidence/trip-workspace-integrated-acceptance-audit-1/integrated/360-flight-text200.png)

## Security, data, build and costs

No committed product/runtime, DB/schema/RLS, Auth/capability, provider, Official Truth, F8, Production or global continuity change. No real credentials or account data were used. Next generated an AGENTS appendix and changed next-env type paths on dev startup; both are restored byte-for-byte before delivery and excluded from the commit.

The unintended broad test selection attempted local fixture bootstrap, but all four failed at missing initdb before any DB existed. This exception to the intended test selection is disclosed. No Supabase tool or hosted DB request was used. No new ongoing infrastructure cost.

B01 stays server-owned, compute-on-read and fail-closed. The flight-coverage defect is a separate planning projection defect; it does not prove an Official Truth leak.

## Delivery identity and STOP

- Remote main/runtime audit baseline: `9adfc04ffe90693dedc059f07a396751a0625157`.
- Task seed: `640cb7c112343a0ac749c4e820779a34347ce91a`.
- Immutable TASK blob: `258c058187bec13f48d7fd6814dbadca219bb04b`.
- Authorized branch: `docs/trip-workspace-integrated-acceptance-audit-1`.
- The exact delivered review head is the containing delivery commit, resolved and reported in the final STOP receipt. The seed above is not the final review head. No self-referential SHA is fabricated inside its own commit.
- Full changed-file list: [changed-files.txt](evidence/trip-workspace-integrated-acceptance-audit-1/changed-files.txt). The TASK is seed-only; writer changes are the four allowed documents and this unique evidence directory.
- Codex session: `01a10e91-5fda-7002-959d-b93029705c33`; persisted model `gpt-6-astra`, effort `xhigh`, turn_context `2026-10-06T00:16:12.380Z`. [Sanitized metadata](evidence/trip-workspace-integrated-acceptance-audit-1/session.json). No Cursor/replacement/subagent.

Transport note: ordinary local Git push failed because this terminal has no GitHub username/credential path. The existing authenticated GitHub connector is the selected publication path; it creates the same blobs/tree and fast-forwards only the authorized branch. Final remote head/tree equality is reported in the STOP receipt; commit metadata can differ from the local commit.

Exactly one next recommendation: **TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1**. Independent of F8/provider activation; not started.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW. PR remains Draft. No Ready. No merge.**
