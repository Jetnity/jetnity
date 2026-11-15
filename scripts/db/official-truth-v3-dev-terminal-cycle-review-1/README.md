# Exact Dev Cycle2 terminal review

This is a one-time review of the exhausted CH→DE import request created on
2026-11-14 at 23:55:02.031850 UTC in `yfvbxvijcorffwxbxahl`. It is not a retry,
publication, quota reset, Owner approval, guard recovery or Production installer.
Every old cycle, dispatch, queue operation, source record, baseline, counter and
guard generation remains unchanged. In particular Cycle2 stays `blocked` with
`last_status=exhausted` and zero publications.

The existing sender stops on any historical blocked cycle. This migration adds
one private immutable review record and changes only that predicate: the exact
reviewed Cycle2 may be passed when its entire original evidence is still equal.
Every other blocked cycle and every unconfirmed original request remains a stop.
The migration does not invoke a source, tick, audit or HTTP request. A subsequent
ordinary tick can create the next original cycle under all existing gates.

## Original evidence and cause

`original-evidence.json` binds the complete Cycle2 row, all eight original private
dispatch rows 5–12, and terminal queue operation
`op3_5a9ada0e40b2af467fd7e34cc51cb323`. The final private dispatch is HTTP200,
`exhausted`; the original sender stores this outcome only after verifying its
response HMAC. Public `net._http_response` is not used as review authority.

The original job `job3_c8654463b7bdf52342887764ac1d1b40` reached exhausted Head25
after four ordinary unstarted claims. It has no source START, result or intake.
The current subject may be a newer legitimate terminal job after the required
normal UI refresh; the historical original Head25 envelope remains fixed.

The reviewed runtime fix removes one redundant initial probe and one duplicate
method lookup after a genuine current method receipt. Its fixed source SHA256s:

- `monitor/queue.ts`: `4205b79b1a22c80823a4965cf911445213e3f99b8daae6365a710a4748a24f3d`
- `jobs/composition.ts`: `667316468efe2328ae41493537462a7ff4bd571da43fe219bdf738a63dd47b89`

All existing five-second queue deadlines, source/lease deadlines, original IDs,
method proofs, final reads, rolling 64/256 quotas and attempt limits remain.

## Applied historical evidence

This exact review was applied on 2026-11-15 at 02:11:51.736081 UTC after the
complete CI4251 (run43663530549), Ready deployment and normal UI publication5
on commit `1c6915bf0ed661a8b57c5fb3a43c9b71b559a90a`. Do not apply it again.
The two reviewed runtime files are preserved byte-for-byte under
`reviewed-runtime-1c6915bf/`, with their exact commit/tree, lengths and hashes.
The compiler verifies these immutable predecessors; a later runtime candidate
requires its own separate review. The already applied SQL, original evidence,
readback and stored receipt remain unchanged. The sequence below documents the
original completed operation and is not a new action list.

## Operator sequence — Dev only

1. Verify the complete CI for the candidate commit and an actual Ready Dev
   deployment containing both fixed source files. Check the branch/ref and Dev
   Supabase target using live provider metadata.
2. Finish one normal successful CH→DE source/import run in the Dev Owner UI.
   Confirm its newer visible publication, current BG1 and terminal subject with
   no open attempt, terminal credit, lease or unresolved dispatch. Do not repeat
   completed method/Owner approvals. Finish the UI request before this migration.
3. In the Dev postgres session, supply the exact observed commit, Ready deployment,
   full CI run and successful newer publication version through these settings:

   ```sql
   SET jetnity.dev_terminal_review_target='dev:yfvbxvijcorffwxbxahl:terminal-cycle2-v1';
   SET jetnity.dev_terminal_review_ack='full-ci-ready-preview-and-normal-ui-verified-cycle2-v1';
   SET jetnity.dev_terminal_review_commit='<actual 40-character commit SHA>';
   SET jetnity.dev_terminal_review_deployment='<actual dpl_ identifier>';
   SET jetnity.dev_terminal_review_ci_run='<actual complete successful CI run>';
   SET jetnity.dev_terminal_review_ui_version='<actual newer successful version, at least 5>';
   ```

   These are an explicit operator declaration. PostgreSQL cannot independently
   verify the remote deployment, CI or visitor publication from these strings.
   Do not replace that live verification with the declaration.
4. Execute the complete `review-cycle2.sql` in that same Dev session. It is one
   transaction. A rollback rehearsal may substitute only its final `COMMIT` with
   `ROLLBACK`; use the identical full migration and gates. Lock timeout, missing
   current guard evidence, changed originals or new work must cause a refusal.
5. Run `readback.sql` read-only. If the apply response was lost, confirm this exact
   already committed review and sender body; do not recreate it. Reapplying to an
   existing record deliberately refuses, even if the record appears identical.
6. Let the existing minute cron perform its normal next request. Confirm its
   signed status chain, actual source START and published projection, next due
   before expiry, visitor read and subsequent normal BG1 check. An unconfirmed
   request retains its original IDs and never authorizes a replacement.

If a new problem occurs, use the existing Dev scheduler stop/guard controls and
inspect the original evidence. Never delete the review or old history to restart.
The enabled state, next due, cron and transport expiry are not altered by apply.

## Lock and integrity contract

The transaction uses the existing scheduler advisory lock `(771106,31)`, its
state row, then the existing shared write advisory lock `(771106,1)` **before**
any guard row lock. The genuine HMA/S1/jobs/HRS checkers acquire their existing
protected SHARE table locks using their existing owner authority. Snapshot reads
also retain ACCESS SHARE locks against DDL. ACCESS SHARE alone is not a write
mutex; serialization comes from the existing common write gate and real checkers.
No role membership or ACL is added.

Before and after the exact one-predicate replacement, the migration checks the
complete current protected catalog, full histories and certificates, retirements,
current guard proof, rolling quota, all role attributes and complete old table-row
digests. It preserves the original tick OID, owner, ACL and function attributes.
The new private record rejects UPDATE, DELETE and TRUNCATE and is unavailable to
application roles. A changed historical dispatch immediately closes its exception.

## Reproducible local proof

`build.mjs` deterministically emits the migration, verifies the two archived exact runtime
source digests, and binds all original bytes. It performs no database/network work.

`lib/readiness/official-truth-dev-terminal-cycle-review.test.ts` executes the
complete migration on real PostgreSQL17 with the unchanged HMA/S1/HMT/HRS/HM04,
BG1 and rolling-quota packages. It uses the socket-free owned local backend.
The history fixture has explicitly synthetic predecessors followed by the exact
original Cycle2 terminal envelope. Local totals are 0 START/25 operations, or a
newer fully coherent terminal Head28; these are not presented as the live 7/29
totals. No remote deployment, Owner action or publication is fabricated.

The proof covers actual PostgreSQL evidence-digest equality, genuine complete
history validation, both terminal heads, rejected changed/unknown/pending
evidence and custody, immutable review, original-ACK readback, complete rollback,
unchanged old rows/quotas/catalog, actual lock ownership, and the later normal
sender path. Provider HTTP/Vault data and operator acknowledgements are expressly
local fixtures. It does not claim live multi-session contention or a real HTTP
publication; those remain the Dev acceptance steps above.
