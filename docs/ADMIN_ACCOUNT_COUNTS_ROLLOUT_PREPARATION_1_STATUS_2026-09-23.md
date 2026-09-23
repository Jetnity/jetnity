# Admin Account Counts Rollout Preparation 1 — STATUS

Stand: 23. September 2026  
Status: **PRE-TEST PACKAGE PERSIST / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #555  
Branch: `feat/admin-account-counts-rollout-preparation-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_ROLLOUT_PREPARATION_1_TASK_2026-09-23.md` v1 at `7d24b78b413c80ff82ae1f5c03b045fc9b5e17a4`  
Baseline / merge-base: `main@f0237baf8809e5528b5f73e918f0e37a7d9b4477`  
Newer-main drift: **none** vs local `main` and `origin/main` at persist time.

Cursor-Agent: **Jetnity admin account counts rollout preparation 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-4bf6acab-25f3-4d63-9199-ac365b9c011a`  
URL: https://cursor.com/agents/bc-4bf6acab-25f3-4d63-9199-ac365b9c011a  
Observed run-info display name: `Admin account counts rollout preparation`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production/Preview activation. Closed #550/#552/#551/#553/#554 sessions were not resumed.

## 1. What this slice owns

A LOCAL-ONLY composition, preflight, verify, revoke and identity-strict rollback package around the unchanged accepted producer/wrapper, plus the environment state machine and German PO packet.

Accepted hashes were re-read and matched the task pins before the first package commit.

## 2. Not yet executed at this persist

Disposable PostgreSQL rehearsal, Node runner tests, and repository hygiene/build numbers will be recorded in a follow-up persist on this same session after the first frozen package head is pushed. Status-only churn is not a gate.

## 3. Honest blockers already in the design

- `profiles.status` banned/disabled is **not** checked by the producer or by `loadRole` (role only).
- Privileged owner `postgres` already has BYPASSRLS + SELECT on `auth.users`; the definer function adds an EXECUTE surface, not a new role.
- Browser/MFA evidence is a parallel independent lane and is **pending**.
- Production objects remain ABSENT per dated TL metadata; this agent did not connect.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL REVIEW after the rehearsal persist.**
