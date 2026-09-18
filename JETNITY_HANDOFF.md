# Jetnity – Handoff und nächste Schritte

Stand: 18. September 2026  
Status: **CURRENT HANDOFF / ASSISTANT RUNTIME 1 CLOSED / MULTI-AGENT OPERATING SYSTEM CLOSED / V1 LEGAL CLAIM HYGIENE 1 CLOSED / V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 CLOSED / V1 INCIDENT PROCESS 1 CLOSED / V1 SUPPORT PROCESS 1 CLOSED / V1 ACCOUNT ERROR BOUNDARY 1 CLOSED / V1 ADMIN REVENUE TRUTH 1 CLOSED / V1 COOKIE CONSENT HYGIENE 1 CLOSED / V1 ACCOUNT DATA EXPORT 1 CLOSED / V1 PRODUCTION AUTH VERIFICATION 1 CLOSED / PRS #470 #471 #472 #476 #477 #480 MERGED / EXACT-MERGE PRODUCTION READY / GUARDIAN EXTERNAL-APP WORKFLOW CANONICALIZED / NO ACTIVE CURSOR CODING AGENT / CURRENT CURSOR MODEL PREFERENCE GROK 4.6 HIGH FAST / NO ACTIVE PRODUCT SLICE SELECTED BY THIS HANDOFF / PRODUCTION ASSISTANT MIGRATION + MODEL ACTIVATION CLOSED / PROVIDER CONTACTS DEFERRED / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE GEWINNT**

Canonical new-chat checkpoint:

`docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md`

Binding operating standards:

- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`
- `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`

## 1. Verifizierter aktueller Runtime-Stand

Assistant Runtime 1 is **CLOSED / MERGED / POST-MERGE VERIFIED**.

Accepted product head:

`8915ef45849b6544fe6fea201fb1450392c15f83`

Merge commit / verified post-merge `main` at closure:

`fdbd3735c0bfd4993bd78d41a3ab70edd895988c`

Integration evidence:
- PR #435 merged;
- exact-head Guardian PASS;
- exact-head CI #1794 / `35277776782`: SUCCESS;
- exact-head Vercel Preview: READY;
- post-merge CI #1795 / `35286865941`: SUCCESS;
- Vercel Production deployment `dpl_Dni4i6FZDYKvabhEshEra4VDQUa7`: READY;
- no automatic Production Supabase migration occurred.

Always re-fetch live `main` in the next chat. The exact SHA above is a verified Assistant Runtime transition baseline, not an instruction to assume no later commits exist.

Latest verified product/runtime closure baseline: `main@581e8ad1f0d3f80e2631b967568fec51e67555af` after PR #480. Accepted exact head `b7a9764331ec813361f850c52129f624c42c45ca` had CI `35348781454` SUCCESS, Auth job `105611618459` SUCCESS (Development-only), Vercel Preview `dpl_EHxhGsfhLBpbJVimzmryaw2RL9hb` READY and external Jetnity Guardian exact-head PASS. Accepted head -> merge has 0 changed files. Exact-merge Vercel Production `dpl_C58unv1yazveBQ1v7MjdUAiQEaSE` is READY on the merge SHA. The current GitHub connector does not expose push-triggered main-run evidence, so no invisible post-merge Actions run is claimed. A later docs-only continuity merge may advance `main`.

## 2. Paid Assistant smoke evidence

Exactly one bounded paid Preview/Development call passed:
- function `reisebegleiter`;
- model `gpt-5.6-terra`;
- 2196 input / 0 cached / 102 output tokens;
- 3387 ms runtime;
- USD 0.005616;
- persisted Development usage ID `70608b03-dbcd-4d16-8ad3-95a350ed48ba`;
- result `erfolg`;
- reservation-before-call and completion persistence verified;
- no retry/fallback paid call.

After evidence capture:
- branch-specific model kill switch returned to inactive;
- final diagnostic HTTP 425 / model inactive;
- temporary smoke routes/workflows removed;
- no persistent smoke code remained versus the accepted product head.

## 3. Production boundary

Production:

`qscbgcdmivbbnzrcyegn`

Development:

`yfvbxvijcorffwxbxahl`

Post-merge verified Production state:
- 0 total `model_usage` rows;
- 0 `reisebegleiter` rows;
- `20260917090000_modell_reisebegleiter`: not applied;
- `20260917120000_account_visits`: applied;
- Production Assistant model activation remains off/closed;
- no Production paid Assistant call.

The migration chronology is unusual because Production has a later migration but not the Assistant migration. A future Production apply requires a new explicit Product-Owner gate and a forward-only/history-safe plan.

## 4. Agentenstatus

Assistant Runtime 1 Cursor agent:

**`Jetnity assistant runtime 1`**  
Generation: **1**  
Session: `bc-c94275d6-9625-464f-9cbb-ea932c703043`

Status: **COMPLETED / NOT ACTIVE**.

No active Cursor coding agent is known at this handoff.

Last completed Cursor slice: **`Jetnity V1 production auth verification 1`**, Generation **1**, session `bc-1d490756-eed2-4390-a8bf-04645bf58082`, model **Cursor Grok 4.6 High Fast**. Final persisted agent state was STOP FOR TECHNICAL-LEAD REVIEW; PR #480 is now merged and that agent/session must not be reconstructed as active work.

Current Product-Owner Cursor parent-model preference: **Cursor Grok 4.6 High Fast**. Do not use Auto; if unavailable, stop/report rather than silently substituting. This replaces prior Opus requirements until changed by the Product Owner.

Do not reactivate the Assistant Runtime 1 session as unfinished work.

Grok Guardian remains an independent observer/challenger/evidence layer. It is not a second Technical Lead and cannot Ready/merge.

## 5. Accepted Assistant Runtime 1 contract

- in-trip Assistant, account-trip only;
- no guest Assistant;
- existing Assistant truth projection reused;
- strict privacy allowlist preserved;
- no passport/MRZ/scan/biometric/health/auth/account/provider-secret expansion;
- no provider/live Official/Safety/Seasonal fetch;
- generated/advisory output only;
- no trip auto-apply;
- no hidden retry/fallback;
- model selects from closed Jetnity-owned typed catalogues;
- Jetnity server renders user-visible strings;
- truth classes remain separate;
- Multi-Traveller/Multi-Citizenship/Multi-Document remain peer options without default/primary/preferred inference;
- cost reservation precedes model call.

Any future Assistant expansion is a new bounded slice. Production migration/model activation is separately gated.

## 6. Multi-Agent Operating System — CLOSED / POST-MERGE VERIFIED

PR **#453 — Define Jetnity Multi-Agent Operating System** is **CLOSED / MERGED / POST-MERGE VERIFIED**.

Accepted exact head:

`afc09b378676d7350101f2ee7b5b2dfd2f93d934`

Merge commit / verified main baseline:

`30855fbb91e11e19f74afbaf1578dc67828714f2`

Evidence:
- branch reconciled non-destructively with then-current `main` before review;
- effective accepted diff: `JETNITY_START_HERE.md` plus `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` only;
- exact-head CI #1800 / run `35288958659`: **SUCCESS**;
- exact-head Vercel Preview `dpl_EHufveKDn9J5Jc1VNw3A14899QNA`: **READY**;
- Technical-Lead FINAL PASS on the exact accepted head;
- SHA-locked merge;
- post-merge CI #1801 / run `35289213441`: **SUCCESS**;
- Vercel Production `dpl_G2DWAPB8c2NaThE7FmnQy1Ydfyhd`: **READY** on exact merge SHA;
- no unresolved Vercel toolbar feedback at post-merge verification;
- no runtime, Supabase, Auth/RLS, provider, Production secret/model, paid-call or cost mutation.

The operating system document is now canonical and part of the mandatory startup path in `JETNITY_START_HERE.md`.

**FIRST NEXT ACTION:** reconstruct live state again before selecting any product slice. This closure does not itself authorize or choose a follow-up implementation.

## 6a. V1 Legal Claim Hygiene 1 — CLOSED

PR #457 / issue #456 are closed:
- accepted head `f132ac092ff1bd78e22dde0055a45fe74dab7d24`;
- merge `e534e0f55cb4da5ebdc5222351e4e29e608b1007`;
- exact-head CI run `35292084238`: SUCCESS;
- exact-head Preview `dpl_GnzRuwcv5oMktSbSajh6W8kycaL3`: READY;
- exact-merge Production `dpl_6hpZrab1QPVk1o7m4nNPw4PhZUiX`: READY;
- Login/Register no longer make the unsupported standalone DSGVO/CH-DSG conformity assertion;
- registration consent mechanics were intentionally not changed;
- no Supabase, Production data, provider, secret or cost mutation.

Git comparison shows 0 file differences from accepted head to merge commit. Push-triggered Actions evidence is not exposed by the currently available connector and must not be invented.

## 6b. V1 Admin MFA Loss Recovery Runbook 1 — CLOSED

PR #460 / issue #459 are closed:
- accepted exact head `f0f6c892dc22cfc1cf2cf00093f8740b36155c03`;
- merge `6f79b45a70374518aef0b6f1a9ab4479f0798827`;
- exact-head CI `35294323671`: SUCCESS;
- exact-head Preview `dpl_FY7MzpD7mEAuMQeyncdnbCPW9PJJ`: READY;
- exact-merge Production `dpl_doA4VePRj6BAuAvQXWqQerHUdHqc`: READY;
- accepted head -> merge: 0 changed files;
- separate read-only Guardian review: PASS with no P0/P1/P2;
- later live Production factor deletion remains Product-Owner-gated;
- no live Auth/Supabase mutation or factor deletion happened in this slice.

Guardian evidence issue #461 is closed completed. Do not reconstruct #459/#460 as active implementation.

## 6c. V1 Incident Process 1 — CLOSED

PR #464 / issue #463 are closed:
- accepted exact head `eeff277e319b6ea5d4fb4a202b900652030c7506`;
- merge `3fcebbb128a1fd3c157073ed903518b6ad3f6566`;
- exact-head CI `35325063544`: SUCCESS;
- exact-head Preview `dpl_GFuvVfHmVBqFdeSE4MUW7BbxKec8`: READY;
- external Jetnity Guardian targeted recheck: PASS, P3 resolved, no new P0/P1/P2/P3;
- exact-merge Production `dpl_EK8FfncRZA2nknr7zM7sMRZrdQ48`: READY;
- accepted head -> merge: 0 changed files;
- audit 5.5 process half closed; tooling half remains OPEN / Product-Owner-gated;
- no live runtime/Auth/RLS/Supabase/provider/secret/env/cost mutation.

Guardian workflow correction: **Jetnity Guardian is the Product Owner's separate Guardian app, never a Cursor agent/session.** The Technical Lead supplies the ready-to-paste Guardian prompt; the Product Owner runs it. Cursor Grok 4.6 High Fast remains only the current Cursor implementation model.

## 6d. Parallel V1 remediation group — CLOSED

Three disjoint slices were implemented in parallel and integrated serially:

### PR #472 / issue #469 — Admin Revenue Truth 1
- accepted head `cb5ec6601e10ad9ec421a6a960dcead957b4afef`;
- merge `b051b2c2c08572b8948d24deb013d930d77ec503`;
- CI `35328619930`: SUCCESS;
- Preview `dpl_vQraWALQNEYvR7pWU3fqci97FFoS`: READY;
- Production `dpl_2mo4Zm77Z8PiBr863ck16miEhc5E`: READY;
- unsupported revenue/conversion truth removed from admin overview.

### PR #471 / issue #468 — Account Error Boundary 1
- accepted head `93ae93d727560c0154fb0dba6d3c8a032a73b71b`;
- merge `d0a940c28b46f6435f9215a4fe428fa09fd4cf2d`;
- CI `35333116999`: SUCCESS;
- Preview `dpl_9uDsTGWVotFGDE7uHfk3i1ATV4L9`: READY;
- Production `dpl_HWeaF4BdegEB9koDEoPfEecFJtpx`: READY;
- TL P2 raw-Production-error logging issue fixed before merge.

### PR #470 / issue #467 — Support Process 1
- accepted head `992148303700c2abcb181875edb994eb865e8554`;
- merge/current baseline `9a3fe265dc47864897ab9f7da1c0ae7e9765a778`;
- CI `35334515586`: SUCCESS including Auth configuration;
- Preview `dpl_5mGwk2ptmy1rsCPgyU59zayLkhB9`: READY;
- external Jetnity Guardian: **PASS — prior P1 resolved**;
- Production `dpl_A9QFhq6hrj5pXohE1tMX2nd2UDhV`: READY;
- TL P1 account-existence/status disclosure path fixed before merge.

Audit findings 4.1 process half, 4.2 and 6.3 are closed. Do not reconstruct #467/#468/#469 or #470/#471/#472 as active work.

No product follow-up is selected by this handoff. Reconstruct live state before choosing the next slice.

## 6e. V1 Data Portability / Cookie Hygiene group — CLOSED

### PR #477 / issue #475 — Cookie Consent Hygiene 1
- accepted head `f4bdd74626a0c079f8395bcdabe06c1765ea5565`;
- merge `ac3539d9ceff4e96308a48c51d2d317927245b54`;
- CI `35337224693`: SUCCESS;
- Preview `dpl_BGBN6ChgFpURWBZK5xihJ8nVezPy`: READY;
- Production `dpl_DGH3PW31YhX6Ge4nX7JTBAXVBw7E`: READY;
- orphaned false-processing CookieConsent artefact removed; no replacement tracker/banner/legal text.

### PR #476 / issue #474 — Account Data Export 1
- accepted head `f58a3902382c2bbf458bf0be0d977eaa2aadaef0`;
- merge/runtime baseline `57efdb2b796e5d99e0bf0010c5d1ef5af3842af7`;
- CI `35342076752`: SUCCESS including Auth configuration;
- Preview `dpl_AVzFSpwuCc2gJRLDk8qwvAn3R3nH`: READY;
- external Jetnity Guardian: **PASS — prior P2 resolved**;
- Production `dpl_7DRw8h3PQ3zU2FyzaNiGECJ5Wx1q`: READY;
- session-bound RLS JSON export added without service role/migration/database mutation;
- exact 13-table scope with explicit column allowlists;
- TL P2 wildcard-column auto-expansion issue fixed before merge;
- no legal-completeness/deletion claim; throttle/snapshot residuals remain documented.

Audit finding 2.1 is closed for this scoped V1 product export, and 1.2(a) is closed. Account deletion/retention, legal content and automated observability remain separate unresolved/gated work. Credentialed Production Auth verification is CLOSED via #479/#480; its verified residuals are the separate P0 SMTP provider/secret gate and P2 Production redirect-write gate.

No product follow-up is selected by this handoff. Reconstruct live state before choosing the next slice.

## 6f. V1 Production Auth Verification 1 — CLOSED

PR #480 / issue #479 are **CLOSED / MERGED / POST-MERGE VERIFIED**:
- accepted exact head `b7a9764331ec813361f850c52129f624c42c45ca`;
- merge/runtime closure baseline `581e8ad1f0d3f80e2631b967568fec51e67555af`;
- accepted head -> merge: **0 changed files**;
- exact-head CI `35348781454`: **SUCCESS**;
- Auth job `105611618459`: **SUCCESS**, normal Development `auth:pruefen` only;
- exact-head Preview `dpl_EHxhGsfhLBpbJVimzmryaw2RL9hb`: **READY**;
- external Jetnity Guardian comment `5730907932`: **PASS** on the accepted exact head;
- exact-merge Production `dpl_C58unv1yazveBQ1v7MjdUAiQEaSE`: **READY**;
- prior TL P3 on the `AUTH.md` Production-remotes rationale was corrected by the same Generation-1 agent/session before final review.

Verified Production truth:
- project `qscbgcdmivbbnzrcyegn`: **ACTIVE_HEALTHY**;
- migration `20260827170000_admin_aal2_data_plane_alignment` is already applied — **no second apply**;
- `public.aktuelles_admin_aal2()` is live and checks JWT `aal='aal2'`;
- all five current `darf_*` admin capabilities require current AAL2;
- Audit 3.3 is resolved and Audit 3.7 is Production-verified;
- Production Auth snapshot: `site_url=http://localhost:3000`, empty `uri_allow_list`, HIBP enabled, Auth rate limits verified, TOTP enroll/verify enabled, low-AAL disallowed, unverified-email sign-in disallowed.

Residual launch risks stay explicitly open:
- **P0 3.8:** no production-capable SMTP; `rate_limit_email_sent=2`. Provider + secret choice is Product-Owner-gated.
- **P2 3.6:** Production redirect configuration is localhost + empty allowlist. Remediation is a separate Production Auth write gate.

The slice performed **no Production Auth write, DB mutation/migration/RLS change, test-user action, provider/SMTP activation, secret mutation or new cost**. No follow-up remediation is automatically selected.

## 7. Open PRs / historical clutter

PR #453 is merged and must not be treated as active work.

Known historical/stale Draft PRs from the last reconstruction:
- #52, #50, #40, #39, #28.

They are not current runtime work merely because they remain open. Re-fetch live before closing, reactivating or integrating any of them.

## 8. Product state / future work

Closed:
- Flight Multi-Leg;
- Flight 0..N Multi-Provider orchestration;
- Destination Essentials 1;
- World Map planned-account truth foundation;
- Realistic World Cartography 1;
- Assistant Truth Context 1;
- Assistant Runtime 1;
- Mobile Accessibility 1.

Still distinct/future:
- real Flight/Hotel/Activities Commercial Truth where provider/external access is required;
- real Official Entry Requirements evidence;
- Temporal Readiness on real evidence;
- broader real-device/mobile/PWA quality;
- account/privacy/legal/ops/monetization minimum;
- final V1 Definition of Done and Release Readiness.

Explicit Visit History 1 / Product directive #441 is **already CLOSED / COMPLETED** and must not be reconstructed as future work. Planned ≠ visited remains an invariant.

No future slice is automatically selected by this handoff.

## 9. Provider decision / Product-Owner direction

Provider inquiries remain deferred. Jetnity continues provider-neutrally.

Therefore no provider is Primary/Default and the following remain closed unless explicitly approved:
- provider application/signup/contact;
- Terms/DPA/contract acceptance;
- real provider secret/live API use;
- paid/live provider calls;
- Production S6 activation;
- Commercial Provenance runtime writer;
- Production provider activation.

## 10. Hard Traveller / Truth invariants

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array order as truth, Residence → Citizenship or Issuer Country → Citizenship.

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth. Planned ≠ visited.

## 11. Mandatory new-chat procedure

The next Technical Lead must:
1. read `JETNITY_START_HERE.md`;
2. read `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
3. read `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
4. read `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`;
5. read `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md`;
6. read `docs/ACTIVE_WORK_STATUS.md` and this handoff;
7. fetch live `main`, all open PRs/issues and relevant branches;
8. verify GitHub Actions, Vercel, review threads and current agent/Guardian evidence;
9. inspect Supabase only when the selected scope requires backend/data/security/Production truth;
10. preserve all Product-Owner special gates and the no-automatic-follow-up rule;
11. only after live reconstruction select the smallest responsible next bounded slice, if one is authorized and no higher-priority review/blocker exists.

Verified transition baseline after PR #453 integration: `30855fbb91e11e19f74afbaf1578dc67828714f2`. A later continuity-only merge may advance repository `main`; always re-fetch live.

**LIVE-EVIDENCE GEWINNT IMMER. ASSISTANT RUNTIME 1 IST CLOSED. MULTI-AGENT OPERATING SYSTEM IST KANONISCH. EXPLICIT VISIT HISTORY / #441 IST CLOSED. V1 LEGAL CLAIM HYGIENE 1 / #457 IST CLOSED. V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 / #460 IST CLOSED. V1 INCIDENT PROCESS 1 / #464 IST CLOSED. V1 SUPPORT PROCESS 1 / #470 IST CLOSED. V1 ACCOUNT ERROR BOUNDARY 1 / #471 IST CLOSED. V1 ADMIN REVENUE TRUTH 1 / #472 IST CLOSED. V1 COOKIE CONSENT HYGIENE 1 / #477 IST CLOSED. V1 ACCOUNT DATA EXPORT 1 / #476 IST CLOSED. V1 PRODUCTION AUTH VERIFICATION 1 / #480 IST CLOSED. JETNITY GUARDIAN = SEPARATE PRODUCT-OWNER GUARDIAN APP, NIE CURSOR. KEIN AKTIVER CURSOR CODING AGENT IST AUS DER LETZTEN PERSISTIERTEN EVIDENCE BEKANNT. CURRENT CURSOR MODEL: GROK 4.6 HIGH FAST, KEIN AUTO. PRODUCTION ASSISTANT MIGRATION/MODELLAKTIVIERUNG BLEIBT GESCHLOSSEN. KEIN AUTOMATISCHER FOLGESLICE.**
