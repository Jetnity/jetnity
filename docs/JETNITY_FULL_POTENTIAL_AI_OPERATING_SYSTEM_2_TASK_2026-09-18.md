# Jetnity – Full-Potential AI Operating System 2 – TASK

Stand: 18. September 2026  
Status: **BINDING / PRODUCT DEVELOPMENT HOLD / GOVERNANCE-CONTINUITY-EVIDENCE ONLY**

Issue: #490  
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
