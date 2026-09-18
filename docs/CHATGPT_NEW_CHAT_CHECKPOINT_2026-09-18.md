# ChatGPT Technical-Lead New-Chat Checkpoint – 18. September 2026

Status: **CANONICAL NEW-CHAT CONTINUITY / PHASE 1 JETNITY CORE / ASSISTANT RUNTIME 1 CLOSED / MULTI-AGENT OPERATING SYSTEM CANONICAL / EXPLICIT VISIT HISTORY #441 CLOSED / V1 LEGAL CLAIM HYGIENE 1 #457 CLOSED / V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 #460 CLOSED / V1 INCIDENT PROCESS 1 #464 CLOSED / V1 SUPPORT PROCESS 1 #470 CLOSED / V1 ACCOUNT ERROR BOUNDARY 1 #471 CLOSED / V1 ADMIN REVENUE TRUTH 1 #472 CLOSED / V1 COOKIE CONSENT HYGIENE 1 #477 CLOSED / V1 ACCOUNT DATA EXPORT 1 #476 CLOSED / V1 PRODUCTION AUTH VERIFICATION 1 #480 CLOSED / JETNITY GUARDIAN EXTERNAL-APP WORKFLOW CANONICAL / NO ACTIVE CURSOR CODING AGENT KNOWN FROM LAST PERSISTED EVIDENCE / CURRENT CURSOR MODEL PREFERENCE GROK 4.6 HIGH FAST / NO PRODUCT FOLLOW-UP SELECTED HERE / NO AUTOMATIC FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

This checkpoint exists so a fresh ChatGPT Technical Lead can continue without relying on chat memory.

## 1. Mandatory startup order

A new Technical Lead must read, in this order:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`
4. `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`
5. this checkpoint
6. `docs/ACTIVE_WORK_STATUS.md`
7. `JETNITY_HANDOFF.md`
8. any current task/status/handoff/review evidence discovered during live reconstruction.

Then independently verify live:
- current `main`;
- all open PRs and Issues;
- relevant branch/head;
- merge-base / ahead / behind;
- GitHub Actions on exact heads;
- Vercel exact-head deployment state;
- open review threads;
- active Cursor / Guardian state;
- Supabase only when scope touches backend/data/security/Production truth.

**Never infer current state from this checkpoint alone. Live evidence wins.**

## 2. Exact verified main at handoff

Latest verified product/runtime closure baseline after V1 Production Auth Verification 1:

`581e8ad1f0d3f80e2631b967568fec51e67555af`

Commit:

`Verify V1 Production Auth truth (#480)`

The earlier Assistant Runtime merge `fdbd3735c0bfd4993bd78d41a3ab70edd895988c` remains a historical verified transition baseline, not current main.

Post-merge evidence:
- PR #435: **MERGED** at 2026-09-17T23:26:37Z;
- accepted product head: `8915ef45849b6544fe6fea201fb1450392c15f83`;
- Guardian targeted exact-head review: **GUARDIAN PASS**;
- accepted-head GitHub CI #1794 / run `35277776782`: **SUCCESS**;
- accepted-head Vercel Preview: **SUCCESS / READY**;
- post-merge GitHub CI #1795 / run `35286865941`: **SUCCESS**;
- post-merge Vercel Production deployment `dpl_Dni4i6FZDYKvabhEshEra4VDQUa7`: **READY**;
- merge was SHA-locked to the accepted head.

## 2a. V1 Production Auth Verification 1 — CLOSED

PR #480 / issue #479 are **CLOSED / MERGED / POST-MERGE VERIFIED**.

Evidence:
- accepted exact head: `b7a9764331ec813361f850c52129f624c42c45ca`;
- merge: `581e8ad1f0d3f80e2631b967568fec51e67555af`;
- accepted head -> merge: **0 changed files**;
- CI `35348781454`: **SUCCESS**;
- Auth job `105611618459`: **SUCCESS**, Development-only final CI;
- Vercel Preview `dpl_EHxhGsfhLBpbJVimzmryaw2RL9hb`: **READY**;
- external Jetnity Guardian comment `5730907932`: **PASS** on the same exact head;
- Vercel Production `dpl_C58unv1yazveBQ1v7MjdUAiQEaSE`: **READY** on the exact merge SHA;
- GitHub review threads: 0 at final gate;
- prior Technical-Lead P3 documentation finding was corrected before final PASS.

Verified Production:
- project `qscbgcdmivbbnzrcyegn` ACTIVE_HEALTHY;
- AAL2 alignment migration `20260827170000_admin_aal2_data_plane_alignment` already applied;
- `aktuelles_admin_aal2()` live; all five current admin `darf_*` helpers require it;
- Audit 3.3 resolved; 3.7 verified;
- 3.6 remains **P2**: `site_url=http://localhost:3000`, empty redirect allowlist;
- 3.8 remains **P0**: no production-capable SMTP, `rate_limit_email_sent=2`.

No Production Auth write, DB/RLS/migration mutation, provider/SMTP activation, secret mutation or cost was introduced. Redirect remediation and SMTP/provider choice are separate Product-Owner/special-gate work and are **not** automatically started.

## 3. Assistant Runtime 1 – CLOSED truth

Assistant Runtime 1 is now **CLOSED / MERGED / POST-MERGE VERIFIED**.

Accepted architecture:
- truth-aware in-trip Assistant built on the accepted `assistantTruthContextProjizieren()` projection;
- account-trip only;
- no guest Assistant;
- no provider/live official/safety/seasonal fetch;
- no auto-apply or trip mutation;
- output class remains `generated_suggestion`;
- no model free prose in the final visible contract: model selects from closed Jetnity-owned typed catalogues, server renders user-visible text;
- Official / Provider / Recommendation / Community / Generated Suggestion remain structurally separate;
- Multi-Traveller / Multi-Citizenship / Multi-Document remain peer options; no default/primary/preferred inference;
- reservation-before-call, kill switch, one model attempt, no hidden fallback.

Paid Preview/Development smoke:
- exactly **one** successful paid Assistant call;
- model: `gpt-5.6-terra`;
- input tokens: **2196**;
- cached tokens: **0**;
- output tokens: **102**;
- total tokens: **2298**;
- runtime: **3387 ms**;
- cost: **5616 micro-USD = USD 0.005616**;
- persisted Development usage ID: `70608b03-dbcd-4d16-8ad3-95a350ed48ba`;
- result: `erfolg`;
- completion persisted successfully;
- exactly one `reisebegleiter` usage row exists in Development from this smoke.

Cleanup:
- paid Preview branch kill switch was returned to **inactive/fail-closed**;
- final diagnostic returned HTTP **425 / model-inactive**;
- temporary GitHub smoke routes/workflows were removed;
- the three temporary smoke branches had **0 file differences** versus the accepted product head after cleanup.

## 4. Production boundary after #435

Production ref:

`qscbgcdmivbbnzrcyegn`

Development ref:

`yfvbxvijcorffwxbxahl`

Verified after merge:
- Production `model_usage`: **0 total / 0 reisebegleiter**;
- Assistant migration `20260917090000_modell_reisebegleiter`: **NOT applied to Production**;
- later Production migration `20260917120000_account_visits`: remains applied;
- no Production Assistant model call;
- no Production model activation;
- no Production Assistant migration;
- merging #435 did **not** automatically apply Supabase migrations.

Important chronology:
- Development has `20260917090000_modell_reisebegleiter`;
- Production does not;
- Production already contains a later migration.
Any future Production Assistant migration requires a fresh Product-Owner special gate and a forward-only migration/history plan.

## 5. Current active-agent state

**No active Cursor coding agent is known at this handoff.**

Last completed Cursor slice: **`Jetnity V1 production auth verification 1`**, Generation **1**, session `bc-1d490756-eed2-4390-a8bf-04645bf58082`, model **Cursor Grok 4.6 High Fast**. PR #480 is merged; this session is completed/not active.

Current Product-Owner Cursor parent-model preference: **Cursor Grok 4.6 High Fast**. Do not use Auto. If it is unavailable, stop/report rather than silently substituting. This supersedes prior Opus requirements until the Product Owner changes it.

Assistant Runtime 1 agent:
- logical name: `Jetnity assistant runtime 1`;
- Generation 1;
- logical session: `bc-c94275d6-9625-464f-9cbb-ea932c703043`;
- status: **COMPLETED / NOT ACTIVE**.

Do not reactivate #435/#434 or that session as unfinished work.

Guardian is an independent read-only/challenge evidence layer, not a second Technical Lead and not merge authority.

## 6. Multi-Agent Operating System — CLOSED

PR **#453 — Define Jetnity Multi-Agent Operating System** is **MERGED / POST-MERGE VERIFIED**.

Accepted exact head:

`afc09b378676d7350101f2ee7b5b2dfd2f93d934`

Merge/main baseline:

`30855fbb91e11e19f74afbaf1578dc67828714f2`

Evidence:
- effective accepted diff: `JETNITY_START_HERE.md` + `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
- exact-head CI #1800 / `35288958659`: SUCCESS;
- exact-head Vercel Preview `dpl_EHufveKDn9J5Jc1VNw3A14899QNA`: READY;
- Technical-Lead FINAL PASS;
- SHA-locked merge;
- post-merge CI #1801 / `35289213441`: SUCCESS;
- Vercel Production `dpl_G2DWAPB8c2NaThE7FmnQy1Ydfyhd`: READY on exact merge SHA;
- no unresolved Vercel toolbar feedback;
- no runtime, Supabase, Auth/RLS, provider, secret, model, paid-call or cost mutation.

`docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` is now canonical and mandatory startup reading.

## 6a. V1 Legal Claim Hygiene 1 — CLOSED

PR #457 / issue #456:
- accepted exact head: `f132ac092ff1bd78e22dde0055a45fe74dab7d24`;
- merge/current continuity baseline: `e534e0f55cb4da5ebdc5222351e4e29e608b1007`;
- exact-head CI run `35292084238`: SUCCESS;
- exact-head Vercel Preview `dpl_GnzRuwcv5oMktSbSajh6W8kycaL3`: READY;
- exact-merge Vercel Production `dpl_6hpZrab1QPVk1o7m4nNPw4PhZUiX`: READY;
- accepted head -> merge: 0 changed files;
- unsupported Login/Register DSGVO/CH-DSG conformity copy removed;
- registration checkbox/links/validation/submit gating preserved;
- no legal-content generation, Auth semantic change, Supabase mutation, provider activation, secret change or new cost.

The GitHub connector available to this chat only exposes PR-triggered runs in commit workflow lookup, so a main push run is not independently visible and is not claimed.

## 6b. V1 Admin MFA Loss Recovery Runbook 1 — CLOSED

PR #460 / issue #459:
- accepted exact head `f0f6c892dc22cfc1cf2cf00093f8740b36155c03`;
- merge/current continuity baseline `6f79b45a70374518aef0b6f1a9ab4479f0798827`;
- exact-head CI `35294323671`: SUCCESS;
- exact-head Vercel Preview `dpl_FY7MzpD7mEAuMQeyncdnbCPW9PJJ`: READY;
- exact-merge Vercel Production `dpl_doA4VePRj6BAuAvQXWqQerHUdHqc`: READY;
- accepted head -> merge: 0 changed files;
- independent Guardian PASS on exact head with no P0/P1/P2;
- TL P2 read-only validation correction is present;
- no factor deletion, live Auth/Supabase mutation, provider, secret or cost change;
- any later Production deleteFactor remains a separate Product-Owner Auth/MFA gate.

Guardian review issue #461 is closed completed.

## 6c. V1 Incident Process 1 — CLOSED

PR #464 / issue #463:
- accepted exact head `eeff277e319b6ea5d4fb4a202b900652030c7506`;
- merge/current continuity baseline `3fcebbb128a1fd3c157073ed903518b6ad3f6566`;
- exact-head CI `35325063544`: SUCCESS;
- exact-head Vercel Preview `dpl_GFuvVfHmVBqFdeSE4MUW7BbxKec8`: READY;
- external Jetnity Guardian targeted recheck: **PASS — P3 resolved — no new P0/P1/P2/P3**;
- exact-merge Vercel Production `dpl_EK8FfncRZA2nknr7zM7sMRZrdQ48`: READY;
- accepted head -> merge: 0 changed files;
- audit 5.5 process half closed;
- automated observability/tooling half remains OPEN and Product-Owner-gated;
- no runtime/Auth/RLS/Supabase/provider/secret/env/cost mutation.

**Guardian identity correction:** Jetnity Guardian / Grok Bot is the Product Owner's separate Jetnity-Guardian app. It is not Cursor, not a Cursor Background Agent and not Cursor Grok 4.6 High Fast. When Guardian review is required, the Technical Lead supplies the complete prompt and the Product Owner runs it in Jetnity Guardian. `@cursor` never substitutes for Guardian evidence.

## 6d. Parallel V1 remediation group — CLOSED

### PR #472 / issue #469 — Admin Revenue Truth 1
- accepted head `cb5ec6601e10ad9ec421a6a960dcead957b4afef`;
- merge `b051b2c2c08572b8948d24deb013d930d77ec503`;
- CI `35328619930`: SUCCESS;
- Preview `dpl_vQraWALQNEYvR7pWU3fqci97FFoS`: READY;
- Production `dpl_2mo4Zm77Z8PiBr863ck16miEhc5E`: READY.

### PR #471 / issue #468 — Account Error Boundary 1
- accepted head `93ae93d727560c0154fb0dba6d3c8a032a73b71b`;
- merge `d0a940c28b46f6435f9215a4fe428fa09fd4cf2d`;
- CI `35333116999`: SUCCESS;
- Preview `dpl_9uDsTGWVotFGDE7uHfk3i1ATV4L9`: READY;
- Production `dpl_HWeaF4BdegEB9koDEoPfEecFJtpx`: READY;
- TL P2 Production raw-error logging issue fixed before merge.

### PR #470 / issue #467 — Support Process 1
- accepted head `992148303700c2abcb181875edb994eb865e8554`;
- merge/current continuity baseline `9a3fe265dc47864897ab9f7da1c0ae7e9765a778`;
- CI `35334515586`: SUCCESS including Auth configuration;
- Preview `dpl_5mGwk2ptmy1rsCPgyU59zayLkhB9`: READY;
- external Jetnity Guardian exact-head verdict: **PASS — prior P1 resolved**;
- Production `dpl_A9QFhq6hrj5pXohE1tMX2nd2UDhV`: READY;
- TL P1 account-existence/status disclosure issue fixed before merge.

All three merge trees were content-identical to their accepted exact heads. No Production/Supabase/Auth/RLS/provider/secret/cost mutation was introduced by these slices.

Audit findings **4.1 process half, 4.2 and 6.3 are closed**. No next product slice is selected by this checkpoint.

## 6e. V1 Data Portability / Cookie Hygiene group — CLOSED

### PR #477 / issue #475 — Cookie Consent Hygiene 1
- accepted head `f4bdd74626a0c079f8395bcdabe06c1765ea5565`;
- merge `ac3539d9ceff4e96308a48c51d2d317927245b54`;
- CI `35337224693`: SUCCESS;
- Preview `dpl_BGBN6ChgFpURWBZK5xihJ8nVezPy`: READY;
- Production `dpl_DGH3PW31YhX6Ge4nX7JTBAXVBw7E`: READY.

### PR #476 / issue #474 — Account Data Export 1
- accepted head `f58a3902382c2bbf458bf0be0d977eaa2aadaef0`;
- merge/runtime closure baseline `57efdb2b796e5d99e0bf0010c5d1ef5af3842af7`;
- CI `35342076752`: SUCCESS including Auth configuration;
- Preview `dpl_AVzFSpwuCc2gJRLDk8qwvAn3R3nH`: READY;
- external Jetnity Guardian exact-head verdict: **PASS — prior P2 resolved — no P0/P1/P2/P3**;
- Production `dpl_7DRw8h3PQ3zU2FyzaNiGECJ5Wx1q`: READY;
- TL P2 wildcard export corrected to explicit per-table column allowlists before merge;
- no service role, DB mutation, migration, RLS/Auth change or persistent export copy.

Accepted head -> merge was content-identical for both slices.

Audit finding **2.1 is closed for the scoped V1 product export** and finding **1.2(a) is closed**. Separate legal-content, deletion/retention, Production-auth-verification and automated-observability work is not implicitly closed.

No next product slice is selected by this checkpoint.

## 6f. V1 Production Auth Verification 1 — CLOSED

Do not reconstruct #479/#480 as unfinished work. The safe Production Auth reader remains available as an explicit manual GET-only verification path; normal CI is Development-only again.

Current residual Auth launch blockers from the verified live truth:
- **P0 3.8:** production-capable SMTP/provider + secret decision;
- **P2 3.6:** Production redirect Auth configuration write.

Both are outside #480 and remain gated. No follow-up slice is selected by this checkpoint.

## 7. Open PR field at handoff

PR #453 is closed/merged.

Historical/stale Draft PRs known from the last live reconstruction:
- #52 — historical ChatGPT Technical Lead handoff;
- #50 — historical Provider Ops S1 status;
- #40 — historical Admin Platform audit;
- #39 — historical Account Platform audit;
- #28 — historical Trip Collaboration foundation.

These must not be treated as current implementation merely because they remain open. Always re-fetch live.

## 8. Issue field / cleanup truth

Assistant Runtime implementation and its PO Preview/Development gate are fulfilled by merged PR #435. During transition cleanup, issues **#433 and #434 were closed as completed**.

V1 Legal Claim Hygiene 1 is fulfilled by merged PR #457; issue **#456 is closed as completed**.

V1 Admin MFA Loss Recovery Runbook 1 is fulfilled by merged PR #460; issue **#459 is closed as completed**. Guardian review issue **#461 is closed as completed**.

Parallel V1 remediation is fulfilled by merged PRs **#470, #471 and #472**; issues **#467, #468 and #469 are closed as completed**.

V1 Cookie Consent Hygiene 1 and V1 Account Data Export 1 are fulfilled by merged PRs **#477 and #476**; issues **#475 and #474 are closed as completed**.

V1 Production Auth Verification 1 is fulfilled by merged PR **#480**; issue **#479 is closed as completed**. Residual P0 SMTP and P2 redirect remediation remain separate gated work.

Realistic World Cartography 1 is already integrated/post-merge verified via the World Cartography work and PR #444 evidence. During transition cleanup, issue **#442 was closed as completed**.

Product directive **#441 is CLOSED / COMPLETED**. Explicit Visit History 1 / historical visited truth is implemented and Production-backed through `20260917120000_account_visits`; prior live verification confirmed RLS/grants/RPC boundaries and real Production usage. Do not reconstruct #441 as pending work.

Standing Authorization #440 must be read live before relying on it for any future autonomous work; special Product-Owner gates are never waived by a generic standing authorization.

## 9. Hard Traveller / truth invariants

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer:
- default / primary / preferred citizenship;
- default / primary / preferred passport;
- array order as semantic truth;
- Residence → Citizenship;
- Issuer Country → Citizenship.

Truth classes remain separate:

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

Also:
- `unknown ≠ not_required`;
- `unavailable ≠ not_required`;
- `stale ≠ current`;
- LLM ≠ Official Truth;
- Destination Official ≠ Transit Official;
- planned/account-trip evidence ≠ visited.

## 10. Provider / Production gates

Provider choice and provider contact remain deferred.

Still closed unless explicitly approved:
- provider signup/application/contact/partner engagement;
- Terms/DPA/contract acceptance;
- real provider secret/API activation;
- paid/live provider calls;
- Production S6 runtime/HMAC/>0 budget;
- Commercial Provenance runtime writer;
- Production provider activation;
- Production Assistant migration/model activation;
- Production Auth redirect remediation (`site_url` / `uri_allow_list` write);
- production-capable SMTP/provider + provider secret activation;
- public launch/indexing/domain cutover;
- sensitive passport/MRZ/scan/biometric/health expansion.

Generic `weiter`, `bauen`, `start` or Cursor authorization does not approve special gates.

## 11. Governance the next chat must preserve

- ChatGPT is the overarching Technical Lead.
- Cursor agents implement bounded versioned slices.
- `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` is canonical and governs one-writer/many-readers orchestration and the common evidence bus.
- Grok/Guardian independently challenges and verifies; findings are evidence, not TL PASS.
- Many readers / one writer.
- Agent self-review is never Technical-Lead PASS.
- Changed heads invalidate previous exact-head gates.
- CHANGES REQUIRED returns to the same logical agent/session.
- Cursor and Guardian never mark Ready or merge.
- Technical Lead may merge normal scope-faithful fully reviewed work under existing authorization.
- Product-Owner special gates remain explicit.
- No automatic follow-up slice.
- Relevant progress must be persisted in repository evidence, not only chat.

## 12. First action for the next Technical Lead

Do **not** immediately code.

First:
1. reconstruct live `main`;
2. fetch all open PRs/issues;
3. inspect relevant branch heads, merge-bases, ahead/behind and changed files;
4. verify current GitHub CI/Vercel/review/toolbar evidence;
5. verify current Cursor/Guardian state as far as accessible;
6. read current Product-Owner standing authorization and special gates live;
7. inspect Production/Development Supabase only if the candidate scope requires backend/data/security/Production truth;
8. determine whether any review, re-gating, blocker or continuity work has priority;
9. only then select the smallest responsible bounded next product slice if authorized.

PR #453 is closed and must not be reconstructed as pending work.

Verified governance integration baseline: `30855fbb91e11e19f74afbaf1578dc67828714f2`. A later docs-only continuity merge may advance repository `main`; live evidence always wins.

**LIVE-EVIDENCE WINS. ASSISTANT RUNTIME 1 CLOSED. MULTI-AGENT OPERATING SYSTEM CANONICAL. EXPLICIT VISIT HISTORY / #441 CLOSED. V1 LEGAL CLAIM HYGIENE 1 / #457 CLOSED. V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 / #460 CLOSED. V1 INCIDENT PROCESS 1 / #464 CLOSED. V1 SUPPORT PROCESS 1 / #470 CLOSED. V1 ACCOUNT ERROR BOUNDARY 1 / #471 CLOSED. V1 ADMIN REVENUE TRUTH 1 / #472 CLOSED. V1 COOKIE CONSENT HYGIENE 1 / #477 CLOSED. V1 ACCOUNT DATA EXPORT 1 / #476 CLOSED. V1 PRODUCTION AUTH VERIFICATION 1 / #480 CLOSED. JETNITY GUARDIAN = SEPARATE PRODUCT-OWNER GUARDIAN APP, NEVER CURSOR. CURRENT CURSOR MODEL PREFERENCE: CURSOR GROK 4.6 HIGH FAST, NO AUTO. PRODUCTION ASSISTANT MIGRATION/MODEL ACTIVATION CLOSED. NO ACTIVE CURSOR CODING AGENT KNOWN FROM LAST PERSISTED EVIDENCE. NO AUTOMATIC NEXT SLICE.**
