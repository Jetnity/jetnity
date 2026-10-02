# Guardian Intelligence Bridge 1 — Binding Task

Date: 2 October 2026
Issue: #747
Canonical inbox: #748
Baseline: `main@3775955f6c4e958b26259d98cb9a0bc35dc2075f`
Branch: `os/guardian-intelligence-bridge-1`
Logical agent: **Jetnity Guardian Intelligence Bridge 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Problem

Guardian / Chief of Staff already produces recurring intelligence in the external workspace under paths like `/workspace/jetnity/intelligence/routing/staging/...`, but the current OS-2 contract says that workflow does not write GitHub by default.

Therefore Technical Lead and Cursor cannot reliably consume new reports without Product-Owner copy/paste.

## Goal

Make GitHub Issue #748 the persistent canonical evidence inbox for material Guardian/Chief-of-Staff reports, while preserving Guardian read-only authority.

This slice is repo-side bridge/continuity only. It must not pretend the external bot has been configured if that cannot be proven from repository evidence.

## Required deliverables

Allowed:
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_CONTRACT_2026-10-02.md`
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_EXTERNAL_SETUP_PROMPT_2026-10-02.md`
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_REPORT_2026-10-02.md`
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_HANDOFF_2026-10-02.md`
- `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`
- top-pointer edits to `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, and `docs/ACTIVE_WORK_STATUS.md`
- minimal update to `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` only if necessary to bind #748 as inbox.

## Contract requirements

1. #748 is the canonical GitHub evidence inbox.
2. Guardian remains read-only: it may report, not fix code.
3. Chief of Staff may synthesize/route but raw findings never authorize code changes.
4. Structured envelope requires stable report_id, source agent, timestamp, observed main/head, scope, finding class, severity, evidence refs/hashes, checked/not-checked systems, needs_tl_review, needs_po_decision, supersedes id.
5. No secrets or raw sensitive traveller/passport/MRZ/biometric/health payload in GitHub.
6. Stable dedupe/idempotency semantics.
7. TL receipt states: CONFIRMED / PARTIAL / NOT_REPRODUCED / STALE / SUPERSEDED.
8. Cursor may consume only TL-confirmed findings explicitly bound to its current task.
9. New TL chats must read unread/material #748 reports during startup/live reconstruction.
10. Stale-head reports are retained as history but cannot gate current head without recheck.
11. Existing external workspace artifacts remain source history; bridge does not rewrite them.
12. No claim that external auto-posting works until independently observed.

## External setup prompt

Produce one directly copyable setup prompt for the Product Owner to give the Jetnity Chief of Staff / Guardian environment once.

The prompt must:
- ask the external system to post each MATERIAL report automatically as a structured comment to #748 if its connected GitHub capability permits;
- never grant code/merge/Production authority;
- use stable report_id/dedupe;
- post only sanitized summaries/evidence references, not secrets or sensitive raw payloads;
- if GitHub write capability is unavailable, report exactly that once rather than asking the Product Owner to copy every report forever.

## Do not

Do not create or rotate tokens/PATs.
Do not add secrets.
Do not alter GitHub rulesets.
Do not mutate external Grok workspace from Cursor.
Do not implement webhook/service credentials.
Do not change product runtime/Auth/DB/Supabase/provider/model behavior.
Do not start paid services.

## Validation

- live main re-read;
- no collision with #746;
- `git diff --check`;
- operating mode;
- startup pointers unambiguous;
- no stale claim that AI_OS_BUILD_HOLD is current;
- no false claim that automatic external posting is already proven.

Stay Draft. Do not Ready or merge. STOP for independent TL review.
