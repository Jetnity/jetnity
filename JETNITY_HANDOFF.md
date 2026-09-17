# Jetnity – Handoff und nächste Schritte

Stand: 18. September 2026  
Status: **CURRENT HANDOFF / ASSISTANT RUNTIME 1 CLOSED / PR #435 MERGED + POST-MERGE VERIFIED / NO ACTIVE CURSOR CODING AGENT / PR #453 NEXT KNOWN DOCS-GOVERNANCE CANDIDATE / PRODUCTION ASSISTANT MIGRATION + MODEL ACTIVATION CLOSED / PROVIDER CONTACTS DEFERRED / NO AUTOMATIC NEXT SLICE / LIVE-EVIDENCE GEWINNT**

Canonical new-chat checkpoint:

`docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md`

Binding operating standards:

- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
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

Always re-fetch live `main` in the next chat. The exact SHA above is a verified transition baseline, not an instruction to assume no later commits exist.

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

## 6. FIRST NEXT ACTION — PR #453

The next known repository work item is:

**PR #453 — Define Jetnity Multi-Agent Operating System**

Branch:

`docs/jetnity-multi-agent-operating-system`

Last observed head before this handoff:

`ab6a773705b96f0545238a189cc6c0bda9e9318c`

Important sequencing:
- #453 was intentionally held while #435 was under exact-head gating;
- #435 is now closed/merged;
- #453 therefore needs a fresh live reconstruction and reconciliation with current `main`;
- do not merge the stale branch as-is;
- inspect proposed `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
- integrate/reconcile current main;
- add that document to `JETNITY_START_HERE.md` mandatory startup only when actually integrating #453;
- rerun exact-head CI/Vercel/docs/Guardian/TL checks;
- only then decide Ready/merge.

After #453 is resolved, reconstruct live state again before choosing a product slice.

## 7. Open PRs / historical clutter

Known open PRs at transition preparation:
- #453 — current next known docs-governance candidate;
- #52, #50, #40, #39, #28 — historical/stale Drafts.

The older Drafts are not current runtime work merely because they remain open. Do not merge/close/reactivate them blindly.

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
- explicit user-confirmed historical visit truth / Explicit Visit History 1 under Product directive #441;
- real Flight/Hotel/Activities Commercial Truth where provider/external access is required;
- real Official Entry Requirements evidence;
- Temporal Readiness on real evidence;
- broader real-device/mobile/PWA quality;
- account/privacy/legal/ops/monetization minimum;
- final V1 Definition of Done and Release Readiness.

No future slice is automatically authorized by this handoff.

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
2. read both binding operating standards;
3. read `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md`;
4. read `docs/ACTIVE_WORK_STATUS.md`;
5. read this handoff;
6. fetch live `main`, open PRs/issues and relevant branches;
7. reconstruct #453 exactly before any mutation;
8. verify GitHub Actions/Vercel;
9. inspect Supabase only for scopes that require backend/data/security truth;
10. preserve special Product-Owner gates and no-automatic-follow-up rule.

**LIVE-EVIDENCE GEWINNT IMMER. ASSISTANT RUNTIME 1 IST CLOSED. PR #435 IST GEMERGT + POST-MERGE VERIFIZIERT. KEIN AKTIVER CURSOR CODING AGENT. PR #453 IST DER NÄCHSTE BEKANNTE DOCS-GOVERNANCE-KANDIDAT, MUSS ABER ZUERST MIT LIVE-MAIN REKONZILIERT WERDEN. PRODUCTION ASSISTANT MIGRATION/MODELLAKTIVIERUNG BLEIBT GESCHLOSSEN. KEIN AUTOMATISCHER FOLGESLICE.**
