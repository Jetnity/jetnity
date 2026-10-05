# Jetnity – V1 Release Readiness Preflight 2 – TASK v1

Stand: 29. September 2026
Issue: #621
Branch: `audit/v1-release-readiness-preflight-2`
Canonical baseline at dispatch: `main@e213fa3a4cf08ee3364c4a8d3dc11bafb9373772`

## 1. Objective

Re-evaluate Jetnity V1 release readiness after the substantial closures on 27–29 September 2026.

This is **read-only release analysis**. It implements nothing.

Preflight 1 was valuable, but its classifications are now partly stale because later work closed or changed legal, Auth/mail, account-erasure and Admin/UI findings. This task must derive current truth from live main and current evidence, not copy the old matrix.

Primary output:
- a current A–O release-readiness matrix;
- exact remaining launch blockers/gates;
- exact closed/superseded Preflight 1 rows;
- at most three currently **UNGATED**, provider-independent follow-up candidates if genuinely justified;
- **NONE** if no such candidate exists.

## 2. Required live reconstruction

Before analysis, re-fetch and record:

- exact current `main`;
- current CI/Auth and Vercel state for that exact main;
- open PRs and issues;
- current operating mode;
- active Cursor/runtime writers;
- current Production/Development environment facts only from allowed existing evidence/live read-only sources;
- current provider-response state for KAYAK, Sherpa and IATA/Timatic.

Live evidence wins over documents, old PR bodies and chat memory.

If main advances while this audit is open, integrate the new main only at one explicit boundary before final freeze, then re-evaluate affected rows. Do not repeatedly chase main.

## 3. Required reading

Read at minimum:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/ACTIVE_WORK_STATUS.md`
5. latest 28/29 September checkpoint/handoff referenced by START_HERE
6. `docs/V1_RELEASE_READINESS_PREFLIGHT_1_REPORT_2026-09-28.md`
7. Preflight 1 closure/PR #603 and continuity #604 evidence
8. current Legal/Terms/Privacy closure evidence from 27–28 September
9. current SMTP/Auth URL/callback closure evidence
10. current account-erasure closure evidence
11. `docs/ADMIN_F_RECONCILIATION_1_REPORT_2026-09-28.md`
12. Admin Users #608 closure
13. Admin residual precheck #610 closure
14. current closures from #612, #614, #616, #618, #620
15. current provider gate issues #395 and #294 plus their latest comments
16. PrivacyBee #585 current state
17. current security-event ingestion architecture/proof and finding 5.2 state
18. current backup/incident/observability evidence
19. current mobile/PWA/device-evidence state
20. current Trip Workspace/TW-8/TW-9/provider-dependent state.

Do not treat historical docs as current truth when later source/merge evidence supersedes them.

## 4. Mandatory supersession audit

For every Preflight 1 item classified BLOCKED/PARTIAL/P0/P1/P2/P3, explicitly determine one of:

- `CLOSED_SINCE_PREFLIGHT_1`
- `STILL_OPEN_GATED`
- `STILL_OPEN_UNGATED`
- `RELEASE_PROOF_MISSING`
- `DELIBERATELY_LATER`
- `NOT_APPLICABLE_NOW`
- `INSUFFICIENT_CURRENT_EVIDENCE`

At minimum re-check rather than assume:

- Terms / Privacy routes and approved content;
- legal/privacy vendor wording residual #585;
- account deletion / erasure;
- SMTP / Auth redirect / callback;
- Production Auth/session truth;
- security finding 5.2 persistent ingestion;
- observability / alerting;
- backup / restore evidence;
- mobile / real-device proof;
- account/admin signed-in visual proof;
- provider/commercial truth;
- Official Entry Truth;
- revenue/booking truth;
- public indexing / launch approval;
- retention / consent persistence;
- support operations;
- PWA/offline/push boundaries;
- Assistant Production activation/cost;
- TW-8 / TW-9 closure.

Recent Admin read-honesty fixes (#612/#614/#616/#618/#620) must not be promoted into launch blockers unless current evidence actually supports that.

## 5. A–O matrix

Rebuild the same release dimensions from Preflight 1 so the delta is comparable:

A. Product Definition of Done
B. Security
C. Privacy / Legal
D. Provider / Commercial
E. Official Truth
F. Production Configuration
G. Monitoring / Alerting
H. Backup / Incident / Recovery
I. Analytics / Revenue Truth
J. Performance / Accessibility
K. Mobile / PWA / Device
L. E2E / Failure Modes
M. Support / Operations
N. Launch / Indexing
O. Final blocker rule / overall launch gate

For each:
- current classification;
- concrete evidence;
- exact missing action;
- gate owner;
- whether engineering can act now without a Product-Owner special gate;
- V1 launch-critical vs later;
- uncertainty/limitations.

Do not manufacture a PASS because one subpart is green.

## 6. Provider and Official Truth rules

KAYAK, Sherpa and IATA/Timatic are external waiting-response tracks unless current live evidence proves otherwise.

Do not:
- contact them;
- submit forms;
- accept Terms/DPA;
- create accounts;
- use credentials;
- make API calls;
- spend money;
- select a provider;
- write adapters.

If their absence is still a launch blocker, record it as external/gated rather than trying to fill the gap with fixtures.

## 7. Security / privacy / production rules

Do not mutate Production, Supabase, Auth, RLS, retention, observability, payment or secrets.

Read-only evidence may establish current status where an already-authorized connector/source exposes it safely.

Do not call local proof a Production PASS.
Do not call synthetic browser evidence signed-in Admin/Account E2E.
Do not infer legal completeness from generated vendor text alone.

## 8. Candidate contract

Return at most **three** immediate follow-up candidates.

Each candidate must include:

- exact title;
- user/operator/release outcome;
- current source paths or operational proof surface;
- why it remains open now;
- why no later merge already closed it;
- classification: `UNGATED` or `GATED`;
- severity / release impact;
- smallest safe scope;
- Product-Owner gate assessment;
- DB/Auth/RLS/Production/provider/payment/privacy implications;
- test/evidence acceptance;
- collision analysis.

Only `UNGATED` candidates can be recommended for immediate Technical-Lead dispatch.

If all remaining V1 work is gated/external/proof-only, say **NONE** clearly.

Do not invent AP-8/AP-9/AP-11/AP-12 or disabled "SPÄTER" Admin modules merely to create work.

## 9. Allowed writes

Only:

- `docs/V1_RELEASE_READINESS_PREFLIGHT_2_TASK_2026-09-29.md`
- `docs/V1_RELEASE_READINESS_PREFLIGHT_2_REPORT_2026-09-29.md`
- `docs/V1_RELEASE_READINESS_PREFLIGHT_2_STATUS_2026-09-29.md`
- `docs/V1_RELEASE_READINESS_PREFLIGHT_2_HANDOFF_2026-09-29.md`
- `docs/V1_RELEASE_READINESS_PREFLIGHT_2_SELF_REVIEW_2026-09-29.md`
- optional `docs/evidence/v1-release-readiness-preflight-2/`

Do not edit runtime, migrations, configs, packages, workflows, operating mode or global continuity files.

## 10. Validation

Because this is docs/evidence-only:

- verify all cited file/PR/issue/commit references;
- verify final diff contains only allowed docs/evidence;
- run lightweight repo checks only as needed;
- exact-head CI/Auth/Vercel are Technical-Lead gates after final push;
- no claim of browser/live/Production proof without an actual qualifying read.

Before STOP:
- re-read current main once;
- report ahead/behind;
- report open writers/collisions;
- clearly separate fact, inference, gap and recommendation.

## 11. Agent contract

Logical agent: **Jetnity V1 release readiness preflight 2**
Generation: **1**
Required model: **Grok 4.7 High Fast**
No Auto / no substitution.

Cursor:
- does not implement any candidate;
- does not mark Ready;
- does not merge;
- does not contact external providers;
- does not start a follow-up slice.

Author self-review is not Technical-Lead PASS.

**STOP FOR INDEPENDENT CHATGPT TECHNICAL-LEAD RELEASE REVIEW.**
