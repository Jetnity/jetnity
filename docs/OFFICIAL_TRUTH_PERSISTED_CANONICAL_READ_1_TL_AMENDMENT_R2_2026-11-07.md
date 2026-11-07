# Persisted Canonical Read 1 — TL Amendment R2: final-await database deadlines

Date: 2026-11-07. Tracking #1150 / Draft PR #1151.
Immutable TASK V1 blob `101be0875126d0e79a65636c1f7f49facea2d0d8`.
Immutable R1 blob `2baa526d48a9c370abcfd86b3e35a2c9547159e8`.
Same author **Jetnity Official Truth Persisted Canonical Read 1 — Codex Generation 1**, same actual session `/root/persisted_canonical_read_writer`.

## 1. Demonstrated gap and explicit TL decision

Pre-publication independent review and Root examination found a material last-await gap. Frozen `official_original_api.read_candidate(text,text,bigint,text)` internally checks actual `expires_at`, `freshness_until` and lifecycle head age, but returns only ordinal, original pin, evidence version, raw digest and original bytes. The new reader could receive a successful final query response after an intervening retention/freshness expiry. Its source one-hour check and whole-operation timer cannot reconstruct the missing actual SQL deadlines.

The old metadata-only API remains valid for its existing limited result; this gap matters for the newly selected positive synthetic Requirements projection. Repeating the same query or adding a final COMMIT merely creates another awaited boundary without communicating the deadline. Labeling the new output as a checked instant would weaken the selected task's intended after-await gate.

**TL requires the strict correction.** No fictional deadline, assumed retention duration, success fallback or weakened test. This is a precise necessary extension of the same approved dormant CODE/local-PG read candidate. It is not new authority for hosted installation, real original retention, accepted production reads or a current-request pilot prerequisite.

## 2. Narrow additional repository scope

R2 supersedes TASK sections 3/6's blanket SQL/ACL freeze only for these two NEW candidate files:

- `scripts/db/official-truth-persisted-canonical-read-1/read-projection-candidate.sql`
- `scripts/db/official-truth-persisted-canonical-read-1/read-projection-candidate.rollback.sql`

They stay **outside every canonical Supabase migration and apply path**. The native test installs the candidate only in its newly owned disposable PostgreSQL 16 cluster. No application installer, migration registration, generated hosted type update, deployment hook or remote connection may be added.

All existing migrations, old function definitions/signatures, schemas, tables, triggers, RLS policies, source admissions, key classes, roles and grants remain unchanged. Specifically the existing original-custody SQL blob `36b525580509069039ca6787c25a0a5b94155986` and current-lookup SQL blob `609d10b9727e5fa4f91896d64086798e989ae50b` remain frozen.

## 3. Exact new SQL surface

Define only:
`official_original_api.read_projection_candidate(text,text,bigint,text)`
with the same fingerprint, key and external witness input meaning as the unchanged original reader.

It must:
1. Delegate the complete existing `read_candidate` checks. Do not duplicate, relax or skip closure/review/original/digest/lifecycle validation.
2. Bind every returned row exactly to its existing original pin, evidence version and raw digest. Missing/mismatched bounds fail; do not silently filter a row.
3. Return the unchanged five original fields plus the **actual persisted** `expires_at`, `freshness_until`, the actual head's `checked_at + interval '60 seconds'` as `lifecycle_valid_until`, and a finite server `observed_at`.
4. Preserve ordinal order and complete support count. Use canonical bounded UTC timestamp representations or an equally exact, explicitly checked finite representation; reject null, invalid, expired or inconsistent bounds.
5. Keep the existing READ COMMITTED external-witness/SHARE-lock contract. This is read-only: no checkpoint, lifecycle event, review, original update, retention extension, cache or implicit grant renewal.
6. Use the exact same effective definer owner as the existing original reader on the disposable target, a fixed empty search_path and UTC. Verify rather than invent that owner; no new owner/login/role.
7. Revoke PUBLIC execution explicitly and grant EXECUTE only to the existing `ot_original_reader` role. No direct table/column privilege, application/service/anonymous/authenticated grant, or wider schema exposure. Existing private-table denial remains.
8. Keep existing operational limits; no timeout increase or new unbounded scan. At most eight supports and existing indexed original/head identities suffice.

The candidate installation must be atomic. Rollback drops only this exact new function/signature and its own grant; no existing object/data change. Reapplying must not overwrite an unknown function definition. Owner/ACL/search_path and before/after object evidence are required in the native test, without claiming hosted target authority.

## 4. Reader after-await bound

The new positive reader requires the new candidate surface; absence, malformed metadata or a deadline mismatch refuses/unavailable, never falls back to the old metadata-only path for success. Old `readCandidate` / `lookupCurrentVersion` public result contracts remain unchanged.

For the final protected read:
- Record a code-owned monotonic query-start instant before the SQL call.
- Validate all nine returned columns, row identity/order/count/digest/body correspondence and actual finite deadline metadata.
- Compute the minimum usable lifetime from each row's actual expiry/freshness/lifecycle bounds and its server observation. Bind that remaining interval conservatively to **query-start monotonic time**, not to response arrival; query/transport/JS waiting therefore consumes the interval rather than resetting it.
- Account conservatively for timestamp precision conversion (e.g. subtract at least one millisecond when truncating microseconds). Do not accidentally round an exclusive expiry later.
- Reject any nonpositive/inconsistent duration, missing row or metadata. Preserve whole-operation 60s monotonic deadline, cancellation and unchanged canonical source/validity freshness.
- Recheck the actual carried bound after the final query await, after output construction/freezing, and immediately before return. The guard stays held through those checks; synchronous close/rollback of the read-only guard may follow the final checked computation, with no extra awaited success step.
- Return only bounded sanitized proof metadata, not raw originals/keys or a reusable accepted capability. Any published deadline/observation metadata must accurately describe what was checked. It is not an ongoing authorization lease.

The existing separate REPEATABLE READ / READ ONLY archive still follows its old full readback and COMMIT contract. The producer still requires acknowledged COMMIT and closure before a fresh reader.

## 5. New decisive native criteria

Retain all TASK/R1 positives and negatives. Add focused actual-PostgreSQL proof that:

- A successful final candidate query response deliberately delayed **after its SQL success** beyond its actual returned retention/freshness bound produces no positive output.
- The lifecycle head's 60-second availability bound is independently carried and enforced after the final await; neither source freshness nor the whole-operation timer substitutes for it.
- Missing, invalid, swapped, mismatched, already-expired or inconsistent bound metadata cannot produce success.
- Cancellation and monotonic overall expiry at the final boundary remain closed.
- The new function's owner equals the existing original reader owner; SECURITY DEFINER, empty search_path, UTC, exact role grants and private table denial are verified.
- Rollback removes only the new surface, preserves old reader/lookup behavior and makes the new positive path unavailable.
- SQL files/old migrations/roles/tables/admissions remain otherwise unchanged.

For the lock-wait cancellation proof, first observe the **specific actual reader backend** waiting on a Lock, then abort, release the blocker and verify cleanup. A fixed sleep is not sufficient. Use a separate autocommit observer, or explicitly clear its statistics snapshot before each poll: PostgreSQL 16 can retain pg_stat_activity query information within a transaction. This is a test observation correction, not new runtime authority or a transport change.
Primary reference: https://www.postgresql.org/docs/16/monitoring-stats.html#MONITORING-STATS-VIEWS (28.2.2).

Keep the one shared native fixture efficient. Preserve all existing 25s statement / 15s lock / 20s idle / commit protections and the selected new reader 60s limit. Do not increase existing CI/test budgets, skip native work, or relabel fixture/stub execution as complete captured proof. A concrete performance failure must be diagnosed within scope.

## 6. Preserved blocks and review

Owner-delegated local read-candidate direction remains the scope authority; real source/retention/key/Owner/hosted gates remain separate. No repeated or alternate-route Development readback, no Stage1 replay, no Stage2, no #1131/#985/#937/#913 held work, no real AA/Bern or application activation. Development remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, actual ledger UNKNOWN; Stage2 NOT_ATTEMPTED.

Same author/session performs this immediate correction and updates the acceptance matrix/HANDOFF to distinguish the new local SQL candidate from installed target truth. Root independently reviews every new file and the resulting exact head, including native owner/ACL/deadline/rollback evidence. No new PASS/Ready/Merge until full gates; no automatic successor.
