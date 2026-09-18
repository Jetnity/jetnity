# Jetnity – V1 Security Event Ingestion Architecture 1 HANDOFF

Stand: 18. September 2026  
Status: **ARCHITECTURE DECIDED / RE-GATE THIS PERSIST HEAD / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_TASK_2026-09-18.md`  
Decision: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_DECISION_2026-09-18.md`  
Detailed status: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_SECURITY_EVENT_INGESTION_ARCHITECTURE_1_SELF_REVIEW_2026-09-18.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #486 |
| Draft PR | #487 |
| Branch | `docs/v1-security-event-ingestion-architecture-1` |
| Canonical / live main | `0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2` |
| Dispatch head | `64379ec3c8afdc4ea99bfbae72fceebd8e35ebc5` |
| Agent | Jetnity V1 security event ingestion architecture 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed `originalModelName=cursor-grok-4.6-high-fast`) |
| Session | `bc-5208e459-47c3-4d03-ba30-7ebb633c71bd` |

Read first:

1. the binding task and decision §1 / §5 / §12
2. audit finding 5.2 plus the 18 September presentation mitigation (ingestion still OPEN)
3. this handoff and STATUS / SELF_REVIEW
4. live PR #487, live `origin/main`, live CI and Vercel on the **current HEAD**

## 2. What was decided

V1 records **Jetnity-owned authenticated admin application events** into the existing `security_events` table.

Do not ingest Supabase Auth logs. Do not merge trust classes. Do not write from the unauthenticated login form. Do not use service role or a new SECURITY DEFINER writer.

Allowed V1 types: `admin_login_success`, `admin_aal2_success`, `admin_authorization_denied`, `admin_blocklist_add`, `admin_blocklist_remove`.

PII: store admin `user_id` only; never email, IP, user-agent, tokens, free text, request bodies, or traveller data.

Schema stays; an additive authenticated INSERT grant/policy is required before any writer can persist. That migration is the follow-up slice, not this one.

## 3. What a reviewer should verify first

1. Merge-base equals live `origin/main@0c83af42` and behind=0.
2. Diff is docs-only: task + four persist files. No runtime/migration/RLS/continuity edits.
3. Decision chooses one architecture; it does not leave A/B/C open.
4. Unauthenticated failure write is explicitly rejected with a spam/forgery reason.
5. Finding 5.2 is **not** marked resolved.
6. Follow-up slice is specified and **not** started.
7. Re-fetch exact-head CI / Preview / review threads on the **live HEAD**.

## 4. What this slice does not mean

Finding 5.2 is **not** closed. Release-gate §G remains unsatisfied. There is still no application writer.

## 5. Next step

Technical-Lead exact-head review of this architecture. If PASS: open a new numbered Writer 1 slice. Cursor must **STOP** here. Do not Ready. Do not merge. Do not start the follow-up.
