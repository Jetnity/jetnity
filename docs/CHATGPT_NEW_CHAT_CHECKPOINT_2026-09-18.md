# ChatGPT Technical-Lead New-Chat Checkpoint – 18. September 2026

Status: **CANONICAL NEW-CHAT CONTINUITY / PHASE 1 JETNITY CORE / ASSISTANT RUNTIME 1 CLOSED / PR #435 MERGED + POST-MERGE VERIFIED / PR #453 IS THE NEXT KNOWN DOCS-GOVERNANCE WORK ITEM / NO ACTIVE CURSOR CODING AGENT / NO AUTOMATIC FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

This checkpoint exists so a fresh ChatGPT Technical Lead can continue without relying on chat memory.

## 1. Mandatory startup order

A new Technical Lead must read, in this order:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`
4. this checkpoint
5. `docs/ACTIVE_WORK_STATUS.md`
6. `JETNITY_HANDOFF.md`
7. any current task/status/handoff/review evidence discovered during live reconstruction.

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

Verified `main` after Assistant Runtime 1 integration:

`fdbd3735c0bfd4993bd78d41a3ab70edd895988c`

Commit:

`Merge Assistant Runtime 1 (#435)`

Post-merge evidence:
- PR #435: **MERGED** at 2026-09-17T23:26:37Z;
- accepted product head: `8915ef45849b6544fe6fea201fb1450392c15f83`;
- Guardian targeted exact-head review: **GUARDIAN PASS**;
- accepted-head GitHub CI #1794 / run `35277776782`: **SUCCESS**;
- accepted-head Vercel Preview: **SUCCESS / READY**;
- post-merge GitHub CI #1795 / run `35286865941`: **SUCCESS**;
- post-merge Vercel Production deployment `dpl_Dni4i6FZDYKvabhEshEra4VDQUa7`: **READY**;
- merge was SHA-locked to the accepted head.

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

Assistant Runtime 1 agent:
- logical name: `Jetnity assistant runtime 1`;
- Generation 1;
- logical session: `bc-c94275d6-9625-464f-9cbb-ea932c703043`;
- status: **COMPLETED / NOT ACTIVE**.

Do not reactivate #435/#434 or that session as unfinished work.

Guardian is an independent read-only/challenge evidence layer, not a second Technical Lead and not merge authority.

## 6. Next known work item – PR #453

Draft PR:

**#453 – Define Jetnity Multi-Agent Operating System**

Branch:

`docs/jetnity-multi-agent-operating-system`

Last observed head before this checkpoint:

`ab6a773705b96f0545238a189cc6c0bda9e9318c`

Important:
- PR #453 was intentionally held while #435 was being exact-head gated;
- its recorded base predates the #435 merge;
- at this checkpoint it must be treated as **stale against current main until live rechecked**;
- do **not** merge it without first integrating/reconciling current `main`;
- after reconciliation, add the new operating-system document to the mandatory startup path in `JETNITY_START_HERE.md`;
- re-run exact-head CI/Vercel/docs review and Guardian/Technical-Lead gates as appropriate.

The proposed file in PR #453 is:

`docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`

It is **not yet canonical on main** until #453 is merged.

## 7. Open PR field at handoff

Known open PRs at preparation time:
- #453 — **current next known docs-governance candidate**, Draft;
- #52 — historical ChatGPT Technical Lead handoff;
- #50 — historical Provider Ops S1 status;
- #40 — historical Admin Platform audit;
- #39 — historical Account Platform audit;
- #28 — historical Trip Collaboration foundation.

Only #453 is the known next candidate from this transition. The older Draft PRs are historical/stale and must not be treated as current implementation merely because they are open.

Always re-fetch live.

## 8. Issue field / cleanup truth

Assistant Runtime implementation and its PO Preview/Development gate are fulfilled by merged PR #435. During transition cleanup, issues **#433 and #434 were closed as completed**.

Realistic World Cartography 1 is already integrated/post-merge verified via the World Cartography work and PR #444 evidence. During transition cleanup, issue **#442 was closed as completed**.

Product directive #441 remains broader than cartography because **Explicit Visit History 1** / historical visited truth is still a separate future capability.

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
- public launch/indexing/domain cutover;
- sensitive passport/MRZ/scan/biometric/health expansion.

Generic `weiter`, `bauen`, `start` or Cursor authorization does not approve special gates.

## 11. Governance the next chat must preserve

- ChatGPT is the overarching Technical Lead.
- Cursor agents implement bounded versioned slices.
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
3. verify #453 exact base/head/merge-base/ahead/behind and changed files;
4. read #453's proposed multi-agent operating-system document;
5. verify current GitHub CI/Vercel;
6. verify no active Cursor coding agent;
7. inspect Production/Development Supabase only if the selected scope requires it;
8. reconcile #453 with current main before any merge;
9. update `JETNITY_START_HERE.md` to require `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` only once that file is actually being integrated;
10. apply normal exact-head Technical-Lead/Guardian review rules.

After #453 is resolved, reconstruct live state again before choosing any new product slice.

**LIVE-EVIDENCE WINS. ASSISTANT RUNTIME 1 CLOSED. PR #435 MERGED + POST-MERGE VERIFIED. PRODUCTION ASSISTANT MIGRATION/MODEL ACTIVATION CLOSED. NO ACTIVE CURSOR CODING AGENT. PR #453 IS THE NEXT KNOWN DOCS-GOVERNANCE CANDIDATE BUT MUST BE RECONCILED WITH CURRENT MAIN. NO AUTOMATIC NEXT SLICE.**
