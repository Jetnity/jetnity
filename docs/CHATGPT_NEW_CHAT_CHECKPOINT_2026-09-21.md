# Jetnity — New-Chat Continuity Checkpoint — 21 September 2026

Status: **PERSISTED RESTART CHECKPOINT / CONTINUITY REFRESH #511 / NOT A PRODUCT-REVIEW PASS**
Repository: `Jetnity/jetnity`
Checkpoint branch: `docs/v1-continuity-refresh-1`

This checkpoint is immediately usable on its branch. Until its continuity PR is merged, do not claim the canonical entry documents on main have been corrected. Re-fetch the live continuity PR for its status. After integration it supersedes the 18 September checkpoint for current work only; historical evidence and accepted limitations remain intact.

## 1. Read-first and authority

Read `JETNITY_START_HERE.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, this checkpoint, `.jetnity/operating-mode.json`, `docs/ACTIVE_WORK_STATUS.md`, and the live PRs/tasks/handoffs below. Then independently reconstruct main, open PRs, heads, diffs, merge-base/ahead/behind, Actions, Vercel, threads and available agent-session evidence. Relevant Supabase truth is checked only when the next scope requires it.

**LIVE EVIDENCE WINS.** At checkpoint capture, older START_HERE/ACTIVE_WORK_STATUS/18-Sep-checkpoint prose still says HOLD/#492 active/#487 parked. Those current-state assertions are stale: the machine mode is NORMAL and the later merges below are verified. The refresh owns correction of those pointers; this file is not a competing governance system.

Only ChatGPT Technical Lead may Ready/merge after independent exact-head review. Cursor implements bounded tasks; self-review is not TL PASS. A changed head invalidates old exact-head gates. Same slice/immediate fix uses the same logical agent, generation and session. Do not create duplicate agents because a chat changed.

Required Cursor model remains **Cursor Grok 4.6 High Fast**, no Auto/substitution unless the Product Owner changes the requirement. Repository logical name is not proof that the external session UI was renamed.

## 2. Verified integration baseline

- Freshly read main: `c7fb9f0f693ba9f020add7b26a041263aa7e3b07`.
- Operating mode: `NORMAL`; normalProductSlices `allowed`; reserved Product-Owner gates remain active.
- #492 HOLD closure is merged; #487 architecture is merged, not parked.
- #498 Core Regression Hunter and #497 Live Gap Reconciliation are merged evidence, not running writers.
- #502 Mobility Canonical Stage Order, #500 Auth Lookup Failure Truth and #504 Security KPI Taxonomy are merged fixes; do not rebuild them from old audit rows.
- Last application-runtime-changing baseline: #504 at `9f386d10816d7adcdaf2fcd6d3732e64f952fb50`.
- #494 adds a disposable local PostgreSQL harness plus docs/package script; it does not change rendered product runtime or apply SQL to Supabase.

Authoritative #494 closure: PR comment `5762848189`.

Acceptance chain:
- accepted head `3de1d8e857a383dbf9bfb2e04f37374da552ac4a`;
- freeze `5762251695`, TL PRE-FINAL `5762304615`;
- PO-forwarded Guardian review intake `5762767370`;
- formal head-bound TL FINAL review `5268303309` (COMMENT event with explicit verdict, not an invented third-party APPROVED state);
- merge `c7fb9f0f693ba9f020add7b26a041263aa7e3b07`, accepted-to-merge zero changed files;
- main push CI `35617245766`, Auth job `106390997837` SUCCESS, Typecheck/Lint/Tests/Hygiene/Build job `106390998268` SUCCESS;
- Vercel `dpl_8jXSWbdVpoY8yGyFTdWtfmCjDfdi`, READY, production target, exact merge SHA, per independently read closure record.

These are dated evidence pins, not timeless live status. Re-read before the next integration.

Important tooling distinction: `fetch_commit_workflow_runs` filters PR-triggered runs. An empty result is NOT proof main CI is absent. Discover push CI through the repository Actions API with exact `head_sha` and `event=push`.

## 3. Three distinct, required active workstreams

The Product Owner expressly reaffirmed that functional Trip Workspace + Account revalidation and the Intelligent Admin foundation must not be replaced by the additional visual UX audit.

### A. PR #506 / Issue #505 — Visual UX & Device Audit

- Branch: `audit/v1-visual-ux-device-audit-1`.
- Observed head: `c8d30e9f165cddcaf17fe330dfe916be002572e6`.
- Agent: **Jetnity V1 visual UX device audit 1**, Generation 1.
- Session: `bc-89494e60-e648-4519-bb84-0213d85bb04f`.
- Task: `docs/V1_VISUAL_UX_DEVICE_AUDIT_1_TASK_2026-09-21.md`.
- Handoff/report/status/self-review: same `V1_VISUAL_UX_DEVICE_AUDIT_1_` prefix.
- Evidence: `docs/evidence/v1-visual-ux-device-audit-1/manifest.json` and `screens/`.
- At capture: Draft/open, 74 changed paths reported; evidence delivered, independent TL review pending. No audit acceptance is given by this checkpoint.
- Rendered product SHA is separately pinned to `9f386d10816d7adcdaf2fcd6d3732e64f952fb50`, local browser source, not a moving Preview alias. Later #494 contains no product UI/style change; do not falsely relabel screenshots as captured from a newer SHA or restart all captures solely because unrelated main moved.
- Agent reports VUX-1/2/3 as P1 and VUX-4/5/6/7 as P2, plus VUX-8 P3. They are **unreviewed candidate findings**, not reproduced TL conclusions.
- Next actor: TL must inspect actual phone/tablet/desktop screenshots, manifest/source binding, all changed-file scope and candidate findings. Separate reproducible defects, reasoned UX improvements and taste preferences. Open bounded repairs only after review.
- Account/Admin blocked by auth must not receive visual PASS; Chromium viewport resizing is not real iPhone/Safari acceptance.

### B. PR #509 / Issue #507 — Trip Workspace + Account Functional Revalidation

- Branch: `audit/v1-trip-account-revalidation-1`.
- Observed head: `ef8df8a502b37d43a1b34666ca3caf9b356eeb6b` (seed only at capture).
- Agent: **Jetnity V1 trip account revalidation 1**, Generation 1.
- Session: `bc-18cfea6b-09d5-4bb8-ac73-10332a6079eb`.
- Task: `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_TASK_2026-09-21.md`.
- Dispatch `5763103055`; same-session acknowledgement `5763104959`.
- At capture: Draft/open; only task committed; task accepted, result/handoff not yet visible. Do not claim completion or start a replacement writer.
- Scope: guest-to-account, account registry vs trip snapshot, ordered stages/timeline/mobility, change/readiness effects, archive/restore and account capability truth.
- Output: own `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_*` files and `docs/evidence/v1-trip-account-revalidation-1/` only; first one-to-three exact repair scopes.
- Next actor: existing Cursor session reaches safe commit/handoff/STOP; TL reads current result and gates. Tests/source reasoning are not live authenticated or Production proof.

### C. PR #510 / Issue #508 — Intelligent Admin / Copilot Pro Foundation

- Branch: `architecture/intelligent-admin-copilot-pro-foundation-1`.
- Observed head: `3e0d36827bd4cf7c12ae8d3d1fce4243009dfd2d`.
- Agent: **Jetnity intelligent admin copilot pro foundation 1**, Generation 1.
- Session: `bc-cc0fed7b-39ba-4c81-8b39-7030dc14264c`.
- Task: `docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_TASK_2026-09-21.md`.
- Handoff/decision/source-matrix/status/self-review/runtime-task: same `INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_` prefix.
- At capture: Draft/open; seven docs delivered; no TL architecture/product PASS yet.
- Proposed first contract: System-Health Attention Analyst using existing `SystemHealthBericht`; model explanations disabled. This is a proposal to review, not an operational Copilot.
- Next actor: TL independently reviews source/capability/freshness/permission boundaries and the smallest runtime task. Only after acceptance and a separate versioned dispatch may runtime begin.
- Full D–K/Ads/Bexio/CRM/operator scope stays later; this bounded first read-only foundation remains requested now.

## 4. Immediate next steps and collision rules

1. Complete this continuity refresh and independently review its exact head; until merged use this checkpoint from its branch and PR.
2. Review #506 actual visual evidence promptly, including the agent's candidate P1s; do not let a new generic audit replace this review.
3. Review #510's delivered specification; await/re-fetch #509's safe handoff in its existing session.
4. Select the first bounded repairs/runtime foundation only from accepted evidence. Keep three responsibilities distinct, deduplicate overlap and preserve existing design tokens/truth/security contracts.

No active audit agent owns global startup/status files. The continuity writer alone owns those in #511. No product, style, package, DB, auth or sibling evidence edits in continuity. Do not merge other active branches into a task or interrupt a running write; review at safe committed checkpoints. Main drift is assessed, not used to trigger endless gratuitous reintegration of all agents.

In-progress uncommitted local files are not guaranteed to be in GitHub. A dispatch acknowledgement is not a completion record. An unexpected chat switch requires checking the existing session and remote head before any new dispatch.

## 5. Evidence classes and unresolved gates

- #494 local PostgreSQL 16.15 / 67-of-67 execution is **author-reported**, not rerun by TL or Guardian. Guardian's approximate static count of 69 is a nonblocking P3 evidence-count qualification, not a new execution result.
- Finding 5.2 / release-gate G / persistent security ingestion remain OPEN. No remote DB apply, migration, legal retention policy or service-role revocation is authorized by the local proof merge.
- External Grok team is separate from Cursor and from in-product Copilot. Guardian full review differs from automatic event assurance. `guardian-latest.json` may be a different automatic event, not a PASS receipt. Preserve supplied-review provenance and CoS staging receipt limitations.
- Existing `native_scheduled_pass=false`, `native_material_archive_proof=false`, limited credential/role visibility and best-effort urgent delivery are not upgraded by continuity edits.
- Production/destructive DB/identity/security gates, fundamental auth changes, secrets/contracts, real provider/model/payment activation, sensitive data expansion, launch/domains/store-live, costs outside budget governance and explicitly reserved PO decisions still require the appropriate approval.
- Current V1 build order: `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md` with later explicit PO decisions. Older broad build-order files must not make full D–K/Ads/Bexio a new V1 launch prerequisite.
- Provider, Legal/consent/deletion/retention, email/redirect, monitoring and launch blockers remain as documented in the current reconciliation and release gates. Do not rebuild already-closed foundations or treat missing access as PASS.

## 6. One-message restart instruction

Continue as Technical Lead for Jetnity/jetnity. Read JETNITY_START_HERE.md, the Technical-Lead/Cursor operating standard and docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-21.md. If the checkpoint is not yet on main, read it from docs/v1-continuity-refresh-1 and the continuity PR for Issue #511. Then reconstruct live main, PRs #506/#509/#510 and the continuity PR, exact heads, tasks, handoffs, agent sessions and gates. Do not reopen merged #494/#504/#500/#502/#497/#498/#487/#492 from stale prose. Keep visual UX, functional Trip/Account and Intelligent Admin foundation separate. No duplicate agents, no unreviewed merge and no reserved PO-gate action. Continue at the first independently verified unfinished step.
