# Guardian Intelligence Current State 1 — Binding Task

Date: 2 October 2026
Issue: #752
Persistent Current-State issue: #751
Raw MATERIAL inbox: #748
Baseline: `main@ee1d2d32ab50c978f75e6a45f99de5ac551a2b9d`
Branch: `docs/guardian-intelligence-current-state-1`
Logical agent: **Jetnity Guardian Intelligence Current State 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Purpose

Harden the merged Guardian Intelligence Bridge so:
- new Jetnity Technical-Lead chats do not need to scan all historical #748 comments;
- old/stale reports remain auditable without being treated as current;
- no personal data/PII is posted to the PUBLIC Jetnity repository;
- post-#750 startup continuity reflects the actual merged main.

## Canonical model

- #748 remains the permanent raw MATERIAL intake issue.
- #751 is the compact live Current-State index.
- Raw #748 comments are append-only audit history by default. Do not delete or rewrite old reports.
- #751 is updated in place and contains only current open/relevant report ids, TL receipt state, current main/mode, waiting-for-TL/PO items and the last processed report/comment marker.
- New TL chats read live main/mode, then #751, then only:
  1. open/material report ids referenced by #751;
  2. newer unread MATERIAL #748 reports after the last processed marker.
- Resolved, STALE and SUPERSEDED reports are not part of the default startup read.
- Do not introduce monthly/quarterly issue rotation in this slice. Stable #748 intake avoids another external reconfiguration. Future physical rotation is optional only if GitHub operational limits justify it.

## Privacy hardening

Jetnity/jetnity is PUBLIC.

GitHub intelligence reports and Current State must contain **no personal data/PII by default**, including:
- names;
- email addresses;
- phone numbers;
- postal/street addresses;
- user/account/traveller identifiers;
- passport/document numbers;
- MRZ;
- biometrics;
- health information;
- birth dates;
- IP addresses;
- any other directly or indirectly person-identifying value.

Use sanitized summaries, repository paths, PR/Issue ids, commit SHAs and non-personal hashes only.

If a finding cannot be represented without personal data:
- do not put that payload in #748/#751;
- name only the data class and sanitized location/hash where safe;
- mark that restricted evidence requires an approved private evidence path.

## HOLD/current-mode rule

- live `.jetnity/operating-mode.json` is authoritative;
- current mode is NORMAL on the baseline;
- `AI_OS_BUILD_HOLD` may remain only as historical evidence;
- no Guardian/Chief-of-Staff routine may state HOLD is current without a fresh live mode read proving it.

## Bridge proof state

At task creation:
- Chief of Staff -> #748 direct MATERIAL posting: PROVEN by report `COS-20261002-2010-001`, comment `5958412971`;
- TL receipt: #748 comment `5958628250`, classification PARTIAL;
- Jetnity Guardian -> #748 direct MATERIAL posting: NOT YET PROVEN.

Do not upgrade Guardian direct posting without a real independently read Guardian report.

## Allowed files

Create:
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_CURRENT_STATE_1_CONTRACT_2026-10-02.md`
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_CURRENT_STATE_1_REPORT_2026-10-02.md`
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_CURRENT_STATE_1_HANDOFF_2026-10-02.md`
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_CURRENT_STATE_1_SELF_REVIEW_2026-10-02.md`

May update:
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_CONTRACT_2026-10-02.md`
- `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`
- top pointer only in:
  - `JETNITY_START_HERE.md`
  - `JETNITY_HANDOFF.md`
  - `docs/ACTIVE_WORK_STATUS.md`

Do not rewrite deeper historical blocks in the three global files.

## Required startup semantics

The new top pointer must:
- name current live baseline at delivery time;
- state #750 is merged;
- link #751 Current State and #748 raw inbox;
- state Chief-of-Staff posting proven / Guardian direct posting not yet proven unless live evidence changes;
- state new chats read #751 first and then only referenced/new unread MATERIAL reports;
- state #741 remains blocked by merged #749 P1 findings;
- keep live-evidence-wins.

## Issue-body note

Cursor does not mutate GitHub issue bodies in this slice. The Technical Lead will align #748/#751 issue bodies after merge if required.

## Hard boundaries

No product runtime.
No app/components/lib/hooks/types/public changes.
No Supabase/Auth/RLS/database migration or apply.
No provider/model call.
No token/PAT/webhook/secret.
No new paid service.
No Production configuration.
No external bot mutation from Cursor.
No deletion of #748 history.
No implementation of #741.
No remediation of #749 P1 runtime findings.

## Validation

- fetch latest main;
- finish 0 behind;
- `git diff --check`;
- operating-mode guard;
- global files differ only in top pointer;
- no stale current-HOLD claim;
- no personal-data allowance regression;
- CI/Vercel exact-head after push.

Stay Draft.
Do not Ready.
Do not merge.
Do not start follow-up work.
STOP for independent Technical-Lead review.
