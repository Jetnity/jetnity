# Jetnity – Full-Potential AI Operating System 2 – TASK

Stand: 18. September 2026  
Status: **BINDING / PRODUCT DEVELOPMENT HOLD / GOVERNANCE-CONTINUITY-EVIDENCE ONLY**

Issue: #490  
Draft PR: #491  
Branch: `governance/full-potential-ai-operating-system-2`  
Canonical base: `main@ff0df56ae32e3f28e0f9c160a40fa75de81ba133`

## 1. Objective

Persist the post-merge truth after Full-Potential AI Operating System 1 and create the canonical control surface for the required external ten-role Grok setup.

This is not a product/runtime slice.

## 2. Live facts to verify, never blindly trust

Expected at dispatch:
- PR #489 merged;
- merge/current main: `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`;
- post-merge CI run `35376407897` SUCCESS;
- Vercel commit status success / READY;
- Issue #488 closed;
- Ruleset ID `21875372`, name `Jetnity main protection`, target `refs/heads/main`, enforcement active;
- Ruleset currently requires PR, conversation resolution and strict status checks `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`; deletion and non-fast-forward are blocked; bypass actors none; current_user_can_bypass=never; approval count 0;
- `AI_OS_BUILD_HOLD` remains active;
- PR #487 remains parked at `12d070a79c35fbb9f03d1302833eee8561ec17bd`.

Re-fetch live before writing.

## 3. Required changes

### A. Operating-mode current truth

Update `.jetnity/operating-mode.json`:
- keep mode `AI_OS_BUILD_HOLD`;
- replace stale activeMetaScope #488/#489 with this OS-2 control slice (#490 and the actual Draft PR number once created);
- preserve all special PO gates and the parked #487 pointer;
- keep all exit conditions unchanged except recording that the GitHub baseline is now live-verified if the readback still matches.

Do not set NORMAL.

### B. HOLD-exit checklist

Update:
`docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_HOLD_EXIT_CHECKLIST_2026-09-18.md`

Record verifiable evidence for:
- PR #489 foundation on main;
- exact merge SHA;
- post-merge CI run;
- Vercel READY/success;
- Technical-Lead PASS pointer/comment;
- GitHub hard-enforcement baseline rows from Ruleset `21875372`.

Do not mark ten-role external setup, routines, Evidence Bus or e2e complete unless they actually exist.

### C. External setup tracker

Create:
`docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_EXTERNAL_SETUP_TRACKER_2026-09-18.md`

It must be the live repository control surface for the external setup and contain exactly these ten mandatory identities:

1. Jetnity Chief of Staff
2. Jetnity Guardian
3. Jetnity Market & Traveller Intelligence
4. Jetnity Provider & Commercial Intelligence
5. Jetnity Travel Truth & Regulation Intelligence
6. Jetnity Product & UX Explorer
7. Jetnity Growth & Discoverability
8. Jetnity Analytics & Experimentation
9. Jetnity FinOps & Reliability
10. Jetnity Security & Privacy Red Team

Initial truth:
- existing Jetnity Guardian app = existing;
- all other identities = not yet created unless live evidence says otherwise;
- approved recurring routines/schedules = not yet configured;
- Evidence Bus end-to-end = not yet verified;
- daily/weekly Chief-of-Staff briefs = not yet running;
- shared environment has no Production-admin/service-role/payment-admin/broad write token by design; if not independently checkable, mark NOT CHECKED rather than inventing a PASS.

For each role track at minimum:
- identity state;
- permissions/connections;
- routines;
- Evidence-Bus path;
- last verification;
- blockers/platform limitations;
- next actor.

### D. Continuity surfaces

Update consistently:
- `JETNITY_START_HERE.md`;
- `docs/ACTIVE_WORK_STATUS.md`;
- `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md`.

Required truth:
- OS-1 / PR #489 is MERGED / POST-MERGE VERIFIED;
- #490 / OS-2 is current governance/evidence control slice;
- external ten-role setup is next required phase;
- HOLD remains active;
- no normal product follow-up;
- #487 stays parked.

Create slice-local:
- `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_STATUS_2026-09-18.md`;
- `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_HANDOFF_2026-09-18.md`;
- `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_SELF_REVIEW_2026-09-18.md`.

## 4. Hard scope boundaries

Allowed: governance, continuity, evidence, operating-mode metadata, OS-2 tracker.

Forbidden:
- product/runtime code;
- DB migration;
- Auth/RLS/MFA/AAL mutation;
- Supabase Production mutation;
- provider activation/contact/contracts;
- secrets;
- paid calls;
- payments;
- public launch;
- external Grok bot creation/configuration;
- GitHub Ruleset/admin mutation;
- PR #487 changes.

## 5. Governance

Cursor agent logical name: **Jetnity full-potential AI operating system 2**  
Generation: **1**  
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

One writer.

Cursor:
- implements only this bounded repo slice;
- may verify read-only GitHub evidence if available;
- must not Ready;
- must not merge;
- must not start follow-up work;
- must STOP FOR TECHNICAL-LEAD REVIEW.

## 6. Validation

At minimum:
- `npm run check:operating-mode`;
- typecheck;
- lint;
- tests;
- API protection;
- schema reference;
- dead code;
- exports;
- deps;
- build;
- exact-head CI;
- exact-head Vercel;
- behind=0;
- review threads=0.

No external Grok or GitHub-admin actions are part of this slice.

STOP FOR TECHNICAL-LEAD REVIEW.

## 7. Bounded acceptance-preparation addendum — 20 September 2026 (`5748633847`)

Continue the **same** OS-2 writer, session `bc-36b222c4-88a8-43ed-8c4a-a0f5ade7491c`, branch, and Draft PR #491. No new agent or PR. Cursor remains the sole repo writer. Guardian is not Cursor and must not be emulated.

This addendum is **docs-only acceptance preparation**. It does **not** authorize Ready, merge, HOLD exit, mode `NORMAL`, #487 work, Grok mutation, or a follow-up slice.

### 7.1 Live reconstruction at this persist

Reconstructed before edits (no unexpected concurrent scope/head drift):

- `main` `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`;
- #491 OPEN DRAFT `c9475ea5d13dfac41c83f51e9dc8ddd9e6eda181`;
- exact-head CI `35470823111` SUCCESS (Typecheck `105971347369` SUCCESS; Auth `105971347455` SUCCESS);
- Vercel Preview `9qvmdQRXkKWf5tqvjsWDdUEooLoN` READY; Vercel Preview Comments `105971400186` SUCCESS;
- #487 unchanged parked Draft `12d070a79c35fbb9f03d1302833eee8561ec17bd`;
- `.jetnity/operating-mode.json` remains `AI_OS_BUILD_HOLD`;
- merge-base `ff0df56`; behind=0; review threads=0;
- message queue empty.

Companion Guardian read-only preflight `5748637045` is assigned to the existing external Jetnity Guardian against **fixed** `c9475ea5` and hash-bound external evidence. It is **not** Cursor, **not** a docs push, and **not** acceptance of the future persist head.

### 7.2 Required current-state persist

Update current-state portions of START_HERE, checkpoint §0 / current closing summary, ACTIVE_WORK_STATUS, OS-2 STATUS / HANDOFF / SELF_REVIEW, external tracker, Daily V2 contract evidence section, HOLD-exit checklist, and this task. Keep historical evidence labelled. Avoid wholesale rewrites of genuinely historical accounts.

Add one reviewable matrix:

`docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_ACCEPTANCE_MATRIX_2026-09-20.md`

The dispatch's short name `docs/JETNITY_OS2_ACCEPTANCE_MATRIX_2026-09-20.md` is the same reviewable matrix. It is stored under the existing HOLD-allowed OS-2 glob so base/main path-shape policy is not widened and `.jetnity/operating-mode.json` stays unchanged.

Link it from the tracker and handoff. Row fields: capability; actual acceptance scope; evidence / reference / hash; VERIFIED vs REPORTED / DECLARED / INFERRED; residual; next owner / action; whether a PO decision exists. No blank or automatic PASS rows.

Keep `.jetnity/operating-mode.json` and all runtime / CI enforcement / external Grok artifacts unchanged. Do not copy external JSON or fixtures into this git repo. No live filesystem access claims from reported hashes.

### 7.3 Authoritative decisions that must be preserved

1. **Daily Sep20** `JETNITY-DAILY-V2-2026-09-20-0745`: Guardian output-consistency PASS accepted `5748314138`. PO limitation `5748343178` applies to **this historical run only**. Native scheduler origin **INFERRED**; pinned-entry execution **strongly INFERRED**. Not `native_scheduled_pass=true`. Capture SHA256 `e60fb510e52b52a2308103b85b3ef32c33a57fe7bcf01348a7d45ee2a5686463`. Closeout SHA256 `8d9a42aa42992e660808d5e005b35a9241eabe1fd4ebabe12aa3ed24d4b1b7b9`. No repeat historical search or replay. Gate remains `scheduled_only_provisional`.

2. **Weekly Path A** INSTALLED-SOURCE PASS `5745439900` at installed hash `5e77164e7f0858886d1c4523d31f81f46cffe9d235918ed8d49c0cb9634beb18`. Revised scheduled execution still **OPEN**. `2026-09-21T08:30:00+02:00` is an expected **schedule**, not a receipt. Old native canary, ignore-routing compatibility, and fixture evidence stay distinct.

3. **Path B** `5748428132`: LIMITED success-path **ARTIFACT PASS**. No longer design-only. Not full independently verified messaging / ownership. Hashes: request `4e669c2525053ee68218a5ac93e9643787324899e866fed5fa1f1453fead2dac`; result `13412dceb5f5710edc189e64ccc177d9c2f1eca3e0cfb56a9f5229c243916f40`; receipt `7de5cdabbad4b918c81d40740435fbecafabccbf6e20850d6821bab3eb40081b`; brief `78963167f276d183bbfb5b73eb594045e02adcda12f92c299dbda7e7d3bbf426`. Interactive dispatch / Security authorship / atomic write / CoS direct-read remain **DECLARED**. Earlier request `1590416f…` bytes unavailable; metadata-only explanation unproven. `CONTEXT_ONLY` allowed by that Path B request. No timeout / rejection / scheduling / automatic-consumer claim.

4. **Path C** `5748484353`: interactive visibility / human-ack accepted at bounded evidence class (`PATH_C_PROP_001`; receipt `f57ac62af29bb128e8daddf86f49e14b6643b0f6d5f2fb4db716c75e1149aee8`; submission `t72s1`; ack `t73u`). Specific device push of that probe while closed is **UNVERIFIED**. Inventory `5748446585`: `PATH_C_CAPABILITY.json` `e9370be669e7d19d8d0a4a04653a865f24ba954d992cbc47f81f4852fa6e23e9`; summary `aec254650fc98d7dd7576333b0c7935614ee4ea1d62172204488fabf2f0e1838`. Off-session `JETNITY-PATHC-OFFSESSION-001` **BLOCKED** (`5748633847`); receipt `b227846f59f45b8b728040f755889d72b7eda5515f093b898ac6f1f3e8c324fc`. CoS tools expose recurring cron / event listeners but no supported native single-fire send with bounded lifecycle / readback. No retry, cron workaround, or urgent-gap waiver. A later Sep21 07:45 Daily notification observation would establish only that message / device / context.

5. **Conditional two-role** LIMITED PASS `5744765614` plus later receipt **REPORTED CAPTURED** `5744814651` SHA256 `8054390102d1bb34d0a5147f09574c2f8ca7af28e66f60d1722bbee603e8fb01`; `current_receipt_time=2026-09-19T21:41:45+02:00`. Role transcripts AVAILABLE to CoS / reported record evidence at historical SHA `30e8921f8d9740aa5ac9b7795dd2e808540bf912`. Current capture ≠ original handoff proof. First independent existing receipt read is **COMPLETE** at that bounded class (`5748724868` / PO-forwarded `5748637045`). `hash_drift` fields are verified file claims, not a writing-process replay. `5744814651` is **not** a newly granted PO exception and does **not** extend the Sep20 Daily waiver. Final whole-system review remains pending.

6. **Guardian** native MATERIAL / DEGRADED archive remains **OPEN**. Sequential remapped fixture ≠ native / crash proof. Empty `NO_MATERIAL` archive is not a defect.

7. Ten-role identity presence ≠ operational FINAL / whole-system acceptance. Engineering-support pack remains **PREPARED / NOT RUN** / deferred post-HOLD (`5744886051` / `5744921031`); SHA256 `53382552d98fb8b66517027c269ee820b800bebace8c4e6a11e50e591c5b91d8`.

### 7.4 Current-state slogan corrections

Fix contradictory **current-state** slogans such as “routing not implemented”, “Sep20 still future”, or “Path B only synthetic / design-only” where they describe live truth. Do not alter genuinely historical accounts.

### 7.5 Closing sequence (unchanged authority)

Outstanding evidence / explicit properly scoped decisions → whole-system Guardian + independent exact-head TL final review → Ready / Merge #491 only by Technical Lead → post-merge verification → separate dedicated HOLD closure. #491 must **not** change mode to `NORMAL`. No unconditional tomorrow-finished promise.

### 7.6 21 September Weekly inspection checklist — do not run or change schedules

When the existing Monday **08:30 Europe/Zurich** Weekly fires, later reviewers should:

1. correlate actual run / input / archive / installed-source identities;
2. retain the four Weekly evidence classes (old canary / ignore-routing compatibility / model-mediated fixtures / installed Path A source);
3. verify weekly period, coverage, routing consumption, status precedence, and `technical_lead_attention_required`;
4. not manufacture native origin by synthetic replay.

`2026-09-21T08:30:00+02:00` remains a schedule, not a receipt.

### 7.7 Validation and stop

Run the existing section-6 gates on the resulting exact head. Obtain CI / Vercel on the **new** persist SHA. Do not claim `c9475ea5` SUCCESS for the new head. Avoid recursive evidence-only commits.

STOP FOR TECHNICAL-LEAD REVIEW. No Ready. No merge. No HOLD-exit. No #487. No follow-up slice.

### 7.8 Same-batch Guardian preflight integration (`5748724868`)

Technical-Lead `5748724868` accepts the PO-forwarded Guardian preflight `5748637045` at **bounded scope**. Guardian reviewed repository snapshot `c9475ea5`; that is **not** Guardian acceptance of later docs heads. Cursor did not inspect Grok.

Integrate into matrix / tracker / STATUS / HANDOFF / current pointers only:

- first independent existing conditional-receipt read is **COMPLETE** at the bounded class (`80543901…`); hash_drift fields are verified file claims, not a replay of the writing process;
- original serialized ordering remains unproven; `5744814651` bounded later manual-capture scope is **not** a new PO exception and does **not** extend the Sep20 Daily waiver;
- Path C inventory / probe / off-session receipts independently re-hashed; `created_any_routine_or_task=false`; platform routine enumeration unavailable;
- Path B final-artifact consistency reconfirmed; dispatch / authorship / atomic write / CoS read remain **DECLARED**;
- Weekly installed source reconfirmed; revised native Monday run remains OPEN;
- credential / connector ACL isolation remains **NOT CHECKED**;
- no ChatGPT auto-wake requirement; unmet Path C need is timely user notification plus honest detection / transport limits;
- no urgent-gap waiver and no native-archive waiver;
- final whole-system review remains pending;
- intermediate `8403c6a5` temporarily added a short-name allowlist and `004daa9d` reverted it; net operating-mode config matches the pre-closeout file. Do not claim the file was never touched at any intermediate commit. Do not modify operating-mode / enforcement again.

Do not broaden scope. Guardian need not repeat this preflight merely to acknowledge this correction.
