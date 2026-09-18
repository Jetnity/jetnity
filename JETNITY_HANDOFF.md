# Jetnity – Handoff und nächste Schritte

Stand: 18. September 2026  
Status: **CURRENT HANDOFF / ASSISTANT RUNTIME 1 CLOSED / MULTI-AGENT OPERATING SYSTEM CLOSED / V1 LEGAL CLAIM HYGIENE 1 CLOSED / V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 CLOSED / PR #460 MERGED / EXACT-MERGE PRODUCTION READY / NO ACTIVE CURSOR CODING AGENT / CURRENT CURSOR MODEL PREFERENCE GROK 4.6 HIGH FAST / NO ACTIVE PRODUCT SLICE SELECTED BY THIS HANDOFF / PRODUCTION ASSISTANT MIGRATION + MODEL ACTIVATION CLOSED / PROVIDER CONTACTS DEFERRED / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE GEWINNT**

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

Latest continuity refresh baseline after V1 Admin MFA Loss Recovery Runbook 1: `main@6f79b45a70374518aef0b6f1a9ab4479f0798827` (PR #460 merged). Exact accepted head `f0f6c892dc22cfc1cf2cf00093f8740b36155c03` had full CI SUCCESS and independent Guardian PASS; merge tree is identical to that head; Vercel Production `dpl_doA4VePRj6BAuAvQXWqQerHUdHqc` is READY on the exact merge SHA. The current GitHub connector cannot expose push-triggered run evidence, so no invisible post-merge Actions run is claimed.

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

**LIVE-EVIDENCE GEWINNT IMMER. ASSISTANT RUNTIME 1 IST CLOSED. MULTI-AGENT OPERATING SYSTEM IST KANONISCH. EXPLICIT VISIT HISTORY / #441 IST CLOSED. V1 LEGAL CLAIM HYGIENE 1 / #457 IST CLOSED. V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 / #460 IST CLOSED. KEIN AKTIVER CURSOR CODING AGENT IST AUS DER LETZTEN PERSISTIERTEN EVIDENCE BEKANNT. CURRENT CURSOR MODEL: GROK 4.6 HIGH FAST, KEIN AUTO. PRODUCTION ASSISTANT MIGRATION/MODELLAKTIVIERUNG BLEIBT GESCHLOSSEN. KEIN AUTOMATISCHER FOLGESLICE.**
