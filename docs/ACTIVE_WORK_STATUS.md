# Jetnity – Active Work Status

Stand: 18. September 2026  
Status: **CURRENT / PHASE 1 JETNITY CORE / ASSISTANT RUNTIME 1 CLOSED / MULTI-AGENT OPERATING SYSTEM CLOSED / V1 LEGAL CLAIM HYGIENE 1 CLOSED / V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 CLOSED / V1 INCIDENT PROCESS 1 CLOSED / V1 SUPPORT PROCESS 1 CLOSED / V1 ACCOUNT ERROR BOUNDARY 1 CLOSED / V1 ADMIN REVENUE TRUTH 1 CLOSED / PRS #470 #471 #472 MERGED / EXACT-MERGE PRODUCTION READY / GUARDIAN EXTERNAL-APP WORKFLOW CANONICALIZED / NO ACTIVE CURSOR CODING AGENT KNOWN FROM LAST PERSISTED EVIDENCE / NO PRODUCT FOLLOW-UP SELECTED HERE / PROVIDER SELECTION + EXTERNAL CONTACT DEFERRED / PRODUCTION ASSISTANT MIGRATION + MODEL ACTIVATION CLOSED / NO AUTOMATIC FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

> This file is a current-state continuity aid, not a substitute for live reconstruction. Every new chat must re-fetch GitHub/Vercel and relevant Supabase truth before acting.

Canonical current transition checkpoint:

`docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md`

## 0. Current work boundary

Assistant Runtime 1 and the Multi-Agent Operating System are **CLOSED / MERGED / POST-MERGE VERIFIED**.

V1 Legal Claim Hygiene 1 is **CLOSED / MERGED** via PR #457.

V1 Admin MFA Loss Recovery Runbook 1 is **CLOSED / MERGED** via PR #460.

V1 Incident Process 1 is **CLOSED / MERGED** via PR #464.

Parallel V1 remediation group is also **CLOSED / MERGED / POST-MERGE VERIFIED**:
- PR #472 / issue #469 — Admin Revenue Truth 1;
- PR #471 / issue #468 — Account Error Boundary 1;
- PR #470 / issue #467 — Support Process 1.

Latest continuity baseline is now `main@9a3fe265dc47864897ab9f7da1c0ae7e9765a778`. The three slices were implemented in parallel on disjoint file scopes and integrated serially with fresh main reconciliation and exact-head gates. #470 additionally received external Jetnity Guardian PASS after TL found and corrected a P1 account-existence disclosure risk. Exact-merge Production is READY on the latest merge. The available GitHub connector does not expose push-triggered main workflow runs, so no unseen post-merge Actions run is claimed.

Latest verified governance integration baseline:
- PR #453 accepted head: `afc09b378676d7350101f2ee7b5b2dfd2f93d934`;
- merge/main baseline: `30855fbb91e11e19f74afbaf1578dc67828714f2`;
- exact-head CI #1800: SUCCESS;
- post-merge CI #1801: SUCCESS;
- exact-head Preview and post-merge Production Vercel: READY.

No product follow-up slice is selected by this status file. No active Cursor coding agent is known from the latest persisted evidence; direct Cursor UI/session state must still be re-fetched when accessible.

Current Product-Owner Cursor model preference: **Cursor Grok 4.6 High Fast**. Do not use Auto. If that model is unavailable, stop/report instead of silently substituting. This supersedes prior Opus requirements until the Product Owner changes it.

Always reconstruct live state before acting. A later continuity-only merge may move `main` without changing runtime truth.

## 1. Assistant Runtime 1 — CLOSED

**CLOSED / MERGED / POST-MERGE VERIFIED**

| | |
| --- | --- |
| Product-Owner Preview/Development gate | #433 |
| Coding issue | #434 |
| PR | #435 |
| Accepted exact product head | `8915ef45849b6544fe6fea201fb1450392c15f83` |
| Merge commit / post-merge main at closure | `fdbd3735c0bfd4993bd78d41a3ab70edd895988c` |
| Accepted-head CI | #1794 / `35277776782` — SUCCESS |
| Post-merge CI | #1795 / `35286865941` — SUCCESS |
| Post-merge Vercel Production | `dpl_Dni4i6FZDYKvabhEshEra4VDQUa7` — READY |
| Guardian | exact-head GUARDIAN PASS |
| Cursor agent | `Jetnity assistant runtime 1`, Generation 1, session `bc-c94275d6-9625-464f-9cbb-ea932c703043` — COMPLETED / NOT ACTIVE |

Accepted runtime contract:
- in-trip, account-trip-only Assistant;
- accepted privacy-minimized Assistant truth projection reused;
- no guest Assistant;
- generated/advisory only;
- no trip auto-apply;
- no provider/live official/safety/seasonal fetch;
- no hidden fallback/retry;
- visible content is server-rendered from closed Jetnity-owned catalogues selected by the model;
- truth classes remain structurally separate;
- Multi-Traveller / Multi-Citizenship / Multi-Document remain peer options;
- no default/primary/preferred credential inference.

## 2. Paid Preview/Development smoke — PASS

Exactly one successful bounded paid call was executed:
- model: `gpt-5.6-terra`;
- function: `reisebegleiter`;
- kind: `konto`;
- result: `erfolg`;
- input: **2196 tokens**;
- cached: **0**;
- output: **102 tokens**;
- total: **2298 tokens**;
- runtime: **3387 ms**;
- cost: **5616 micro-USD = USD 0.005616**;
- persisted Development usage ID: `70608b03-dbcd-4d16-8ad3-95a350ed48ba`;
- reservation-before-call and completion persistence verified.

After the call:
- Preview model kill switch returned to fail-closed / inactive;
- final diagnostic: HTTP 425 / `model-inactive`;
- temporary smoke routes/workflows removed;
- temporary smoke branches had 0 file differences versus the accepted product head after cleanup.

## 3. Supabase / Production truth after #435

Development:
- ref `yfvbxvijcorffwxbxahl`;
- Assistant migration `20260917090000_modell_reisebegleiter` applied;
- contains the one accepted smoke `reisebegleiter` usage row.

Production:
- ref `qscbgcdmivbbnzrcyegn`;
- `model_usage`: **0 total / 0 reisebegleiter** at post-merge verification;
- Assistant migration `20260917090000_modell_reisebegleiter`: **NOT applied**;
- later `20260917120000_account_visits`: applied;
- no Production Assistant call;
- no Production model activation;
- merge to `main` did not auto-apply the Assistant migration.

Any future Production Assistant migration/model activation remains a special Product-Owner gate and requires a forward-only migration/history decision.

## 4. Multi-Agent Operating System — CLOSED

`docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` is canonical on `main`.

PR #453:
- accepted exact head `afc09b378676d7350101f2ee7b5b2dfd2f93d934`;
- merge commit `30855fbb91e11e19f74afbaf1578dc67828714f2`;
- post-merge CI #1801 / `35289213441`: SUCCESS;
- Vercel Production `dpl_G2DWAPB8c2NaThE7FmnQy1Ydfyhd`: READY;
- docs/governance only; no runtime, Supabase, Auth/RLS, provider, secret, model, paid-call or cost mutation.

The new document is in the mandatory startup path. PR #453 must not be reopened as unfinished work.

No automatic product follow-up is implied.

## 4a. V1 Legal Claim Hygiene 1 — CLOSED

PR #457 / issue #456:
- accepted exact head `f132ac092ff1bd78e22dde0055a45fe74dab7d24`;
- merge commit `e534e0f55cb4da5ebdc5222351e4e29e608b1007`;
- exact-head CI run `35292084238`: SUCCESS;
- Vercel Preview `dpl_GnzRuwcv5oMktSbSajh6W8kycaL3`: READY on the accepted head;
- Vercel Production `dpl_6hpZrab1QPVk1o7m4nNPw4PhZUiX`: READY on the exact merge SHA;
- merge commit has 0 changed files relative to the accepted head;
- unsupported standalone `Datenschutz: DSGVO & CH-DSG konform.` copy removed from Login/Register;
- registration terms/privacy checkbox, links, validation and submit gating preserved;
- no legal text generation, Auth semantics change, Supabase mutation, provider activation, secret change or new cost.

The available GitHub connector only exposes PR-triggered workflow runs through commit lookup, so the main push run is not independently visible here and is not falsely claimed.

## 4b. V1 Admin MFA Loss Recovery Runbook 1 — CLOSED

PR #460 / issue #459:
- accepted exact head `f0f6c892dc22cfc1cf2cf00093f8740b36155c03`;
- merge/current continuity baseline `6f79b45a70374518aef0b6f1a9ab4479f0798827`;
- exact-head CI run `35294323671`: SUCCESS;
- exact-head Vercel Preview `dpl_FY7MzpD7mEAuMQeyncdnbCPW9PJJ`: READY;
- exact-merge Vercel Production `dpl_doA4VePRj6BAuAvQXWqQerHUdHqc`: READY;
- accepted head -> merge: 0 changed files;
- independent Guardian session: GUARDIAN PASS, no P0/P1/P2 finding;
- TL P2 correction preserved: post-recovery data-plane validation is read-only/non-mutating;
- runbook preserves app-user-vs-platform-MFA separation, exact identity/factor verification, permanent AAL2, fail-closed compromise handling and later Product-Owner gate for any live Production factor deletion;
- no live Auth/Supabase mutation, factor deletion, provider/secret/cost change.

Guardian review issue #461 is closed as completed.

## 4c. V1 Incident Process 1 — CLOSED

PR #464 / issue #463:
- accepted exact head `eeff277e319b6ea5d4fb4a202b900652030c7506`;
- merge/current continuity baseline `3fcebbb128a1fd3c157073ed903518b6ad3f6566`;
- exact-head CI `35325063544`: SUCCESS;
- exact-head Vercel Preview `dpl_GFuvVfHmVBqFdeSE4MUW7BbxKec8`: READY;
- external Jetnity Guardian targeted recheck: **PASS — P3 resolved — no new P0/P1/P2/P3**;
- exact-merge Vercel Production `dpl_EK8FfncRZA2nknr7zM7sMRZrdQ48`: READY;
- accepted head -> merge: 0 changed files;
- process half of audit finding 5.5 is documented;
- automated error-tracking/alerting/log-aggregation tooling half remains OPEN / Product-Owner-gated;
- no runtime/Auth/RLS/Supabase/provider/secret/env/cost mutation.

### Guardian activation — binding correction

Jetnity Guardian / Grok Bot is the **separate Jetnity-Guardian app used by the Product Owner**, not a Cursor agent/session and not Cursor Grok 4.6 High Fast. When Guardian review is needed, the Technical Lead supplies a complete ready-to-paste prompt; the Product Owner runs it in Jetnity Guardian. `@cursor` must never be used as a Guardian substitute.

## 4d. Parallel V1 remediation group — CLOSED

### V1 Admin Revenue Truth 1 — PR #472 / issue #469
- accepted exact head `cb5ec6601e10ad9ec421a6a960dcead957b4afef`;
- merge `b051b2c2c08572b8948d24deb013d930d77ec503`;
- exact-head CI `35328619930`: SUCCESS;
- exact-head Preview `dpl_vQraWALQNEYvR7pWU3fqci97FFoS`: READY;
- exact-merge Production `dpl_2mo4Zm77Z8PiBr863ck16miEhc5E`: READY;
- accepted head -> merge: 0 changed files;
- unsupported revenue/order/refund/payout/conversion truth removed from the admin overview;
- only independently grounded trip/account operational aggregates remain;
- no payment/provider/schema/RPC/database mutation.

### V1 Account Error Boundary 1 — PR #471 / issue #468
- accepted exact head `93ae93d727560c0154fb0dba6d3c8a032a73b71b`;
- merge `d0a940c28b46f6435f9215a4fe428fa09fd4cf2d`;
- exact-head CI `35333116999`: SUCCESS;
- exact-head Preview `dpl_9uDsTGWVotFGDE7uHfk3i1ATV4L9`: READY;
- exact-merge Production `dpl_HWeaF4BdegEB9koDEoPfEecFJtpx`: READY;
- accepted head -> merge: 0 changed files;
- account-scoped error recovery surface added;
- TL P2 fixed before merge: raw Error objects are not logged in Production;
- no Auth/session/MFA/AAL/RLS/Supabase mutation.

### V1 Support Process 1 — PR #470 / issue #467
- accepted exact head `992148303700c2abcb181875edb994eb865e8554`;
- merge/current continuity baseline `9a3fe265dc47864897ab9f7da1c0ae7e9765a778`;
- exact-head CI `35334515586`: SUCCESS, including Auth configuration;
- exact-head Preview `dpl_5mGwk2ptmy1rsCPgyU59zayLkhB9`: READY;
- external Jetnity Guardian exact-head verdict: **PASS — prior P1 resolved — no P0/P1/P2/P3**;
- exact-merge Production `dpl_A9QFhq6hrj5pXohE1tMX2nd2UDhV`: READY;
- accepted head -> merge: 0 changed files;
- TL P1 fixed before merge: ordinary email cannot be used as an account-existence/status oracle; `/admin/users` is internal AAL2 triage only;
- no runtime/Auth/RLS/Supabase/provider/secret/env/cost mutation.

Audit findings **4.1 process half, 4.2 and 6.3 are therefore closed**. Do not reconstruct them as open remediation work.

No next product slice is selected by this continuity update. The previously identified credentialed Production Auth verification item may be a future candidate only after fresh live reconstruction and gate review.

## 5. Current broader product state

Closed/core surfaces include:
- Flight Multi-Leg;
- Flight 0..N Multi-Provider orchestration;
- Destination Essentials 1;
- World Map planned-account truth foundation;
- Realistic World Cartography 1;
- Assistant Truth Context 1;
- Assistant Runtime 1;
- Mobile Accessibility 1.

Product directive #441 is **CLOSED / COMPLETED**. Explicit Visit History 1 is already implemented and Production-backed via `20260917120000_account_visits`; prior live verification confirmed RLS/grants/RPC boundaries and real Production usage. Do not reconstruct #441 as future implementation.

Planned ≠ visited remains a hard semantic invariant.

## 6. Provider / Production gates

Provider inquiries remain deferred by Product Owner.

Still closed unless explicitly approved:
- provider application/signup/contact/partner engagement;
- Terms/DPA/contract acceptance;
- real provider/live secret activation;
- paid/live provider calls;
- Production S6 runtime/HMAC/>0 budget;
- Commercial Provenance runtime writer;
- final Production provider activation;
- Production Assistant migration/model activation;
- public indexing/domain cutover;
- sensitive passport/MRZ/scan/biometric/health expansion.

Generic `weiter`, `bauen`, `start` or Cursor authorization does not approve a special gate.

## 7. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array order as truth, Residence → Citizenship or Issuer Country → Citizenship.

## 8. Truth architecture

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

Planned/account-trip evidence ≠ visited.

## 9. Agent / review governance

- ChatGPT is the overarching Technical Lead.
- Cursor agents implement bounded versioned slices.
- Grok/Guardian is an independent challenge/evidence layer.
- Many readers / one writer.
- Agent self-review is never Technical-Lead PASS.
- Changed heads invalidate previous exact-head gates.
- CHANGES REQUIRED returns to the same logical agent/session.
- Cursor and Guardian do not mark Ready and do not merge.
- Technical Lead may merge normal, fully reviewed, scope-faithful work under standing authorization.
- Product-Owner special gates remain explicit.
- No automatic follow-up slice.
- Relevant continuity must be persisted in GitHub/repository evidence.

## 10. First action for a new chat

Read:
1. `JETNITY_START_HERE.md`;
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
3. `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
4. `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`;
5. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md`;
6. this file and `JETNITY_HANDOFF.md`.

Then reconstruct live:
- current `main`;
- all open PRs/issues;
- active/relevant branches and exact heads;
- merge-base/ahead/behind/diffs;
- Actions/Vercel/review/toolbar evidence;
- current Cursor/Guardian evidence;
- Supabase only when selected scope requires it.

Do not treat historical Draft PRs as active work merely because they are open. Do not infer a next product slice from this file. Select the smallest responsible bounded next step only after live reconstruction and current Product-Owner gate checks.

**LIVE-EVIDENCE WINS. ASSISTANT RUNTIME 1 CLOSED. MULTI-AGENT OPERATING SYSTEM CANONICAL. EXPLICIT VISIT HISTORY / #441 CLOSED. V1 LEGAL CLAIM HYGIENE 1 / #457 CLOSED. V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 / #460 CLOSED. V1 INCIDENT PROCESS 1 / #464 CLOSED. V1 SUPPORT PROCESS 1 / #470 CLOSED. V1 ACCOUNT ERROR BOUNDARY 1 / #471 CLOSED. V1 ADMIN REVENUE TRUTH 1 / #472 CLOSED. JETNITY GUARDIAN = SEPARATE PRODUCT-OWNER GUARDIAN APP, NEVER CURSOR. CURRENT CURSOR MODEL PREFERENCE: CURSOR GROK 4.6 HIGH FAST, NO AUTO. PRODUCTION ASSISTANT MIGRATION/MODEL ACTIVATION CLOSED. NO AUTOMATIC FOLLOW-UP SLICE.**
