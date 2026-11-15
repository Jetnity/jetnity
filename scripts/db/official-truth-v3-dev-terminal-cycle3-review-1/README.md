# Exact additive Dev Cycle3 terminal review

This package prepares one later, separate Dev review. It does not apply itself.
The already applied Cycle2 migration, original receipt and every old cycle,
dispatch, queue operation, source record, baseline and counter stay unchanged.
There is no Production action, source call, publication, Owner approval, quota
reset, retry, guard recovery or new running cost in this migration. The research
on the 206 destinations remains `RESEARCH_ONLY` and is not imported.

## Complete failed run and exact evidence

The normal Dev cron created Cycle3 on 2026-11-15 at 02:12:00.092831 UTC with
original operation `op3_de1e2cb5be4d45f3a1da054d2111d21e` and original lease
`lease3_25df4f53834d4b75a49e3b0148dddd89`. All eight private dispatches 13–20
were observed through their complete runtime groups. There were 44 diagnostic
events, 22 started/22 settled spans and no Source span. The verified HTTP chain
was six `503/unresolved`, one `200/queued` and finally `200/exhausted`.

The four finite ordinary claims reached revisions 31–34 without any execution
START. Their normal final continuation stored exhausted Head 35, operation
`op3_0ab5b766f0d954b88a7481b0d531881f`, at 02:19:09.899825 UTC. The next
normal request confirmed that terminal state. The sender verified the final
HMAC and recorded `blocked/exhausted` at **02:22:00.089589 UTC**. It did not
silently replace the failed original request.

`original-evidence.json` preserves the complete Cycle3 row, all eight private
dispatch rows and that entire terminal operation. The original PostgreSQL17
JSONB digest was independently read in Dev:

`cc61f8b41a289d4a78f0d0fdaaca369e2f532c1f820577ca6a5b3a1a44f45dc1`.

The terminal command SHA256 is
`ea857d389f481a4da2cb0c6fc34a6db362f4c2aa9d7bc6edaa500080761730f5`;
its complete original envelope SHA256 is
`8ee50fb1bf04fad27bd541c9cbb2531abb1632ba477dc8d182e05803e2536f2f`.
`fixture-cycle3.json` additionally retains the six original queue operations.
There are no Vault values, response headers, cookies or authentication secrets
in these evidence files. Public `net._http_response` is never review authority.

The complete PostgreSQL log window 02:12–02:22:10 contained 103 normal control
watchdog cancellations, one guard-terminated initial enqueue final read, and two
sender lock timeouts while the ordinary BG1 check ran at 02:15/02:20. There was
no additional work/auth/quota/source error. The six resume research durations
were 8,655/11,334/11,382/11,482/11,475/2,851ms; the first five returned
`unavailable`, the last `exhausted`. Successful individual BEGIN/COMMIT statement
durations were not logged, so they are not claimed as measurements.

At the final 02:22 readback the reviewed job had zero STARTs/results/dispositions,
the subject lifetime totals were 8 STARTs / 39 operations, and there was no open
attempt, lease, terminal credit or technical session. Manual version 5 remained
fresh until 03:08:19.738 UTC. These are dated failure observations, not a successful
automatic-import acceptance or a claim about later current state.

## Additive scope and predecessor

The installed predecessor is exactly the Cycle2 sender body
`79a68078d5423a8646f2faf796174df8cf6680babe3595d57a0708a8e0973add`,
from the unchanged migration
`b2fab88a7b61de52fabc8c0b9f767935f691a5bd60d3800682ef5e91a37a6bbd`.
Its old runtime sources remain separately frozen and hash-checked under the
Cycle2 package's `reviewed-runtime-1c6915bf` directory. Current successor source
is not relabelled as the runtime that produced the old receipt.

The new migration adds only private immutable `terminal_cycle3_review_v1` and
replaces one exact historical-block predicate in `tick_v1`. The complete Cycle2
review and its original evidence remain mandatory. Cycle3 is exempt only while
its exact private evidence still matches. Every other block, changed original,
unconfirmed request or missing predecessor remains closed. Both old blocked
rows remain blocked; neither review is a reset or an alteration of old history.

The new compiler binds thirteen current files: queue, both transport fixes, job
contract/storage/claim forwarding, method authority, job composition and owned
scope, plus the I1 coordinator, S1 quarantine adapter, worker authority order and
result composition, to their individually
reviewed SHA256s.
Compilation refuses before those exact files are frozen. The reviewed runtime
adds explicit atomic claim and mutation capabilities to the existing M04 API;
original confirmation, transition, CAS and actual final reads remain inside
one transaction. Historical adapters keep their original protocol, including
the independent claim reads and complete drain below. All real authority
checks, final reads, original IDs, five-second queue and 30-second tick budgets,
lease deadlines, attempt limits and rolling 64/256 quotas remain required.
The original-claim replay waits for the actual speculative authority read to drain
before acquiring its own fresh authority. The original five-second deadline and
abort signal remain effective while waiting; no speculative receipt is reused.
Fresh claims keep their independent parallel reads. This closes the independently
reproduced single-method-connection-lane collision on head `209b6a1c`.
This review cannot demonstrate that the new runtime is fast enough in Dev.

The still **UNAPPLIED** review now binds the separately reviewed I1 overlap and
deadline fix from 15 November. Only an actual Selected frame starts fresh
MA1/history reads alongside S1 reservation; every original receipt and final
reproof remains required. S1 reserve and finish share the original absolute I1
deadline, and the actual five-second lease is unchanged. The immutable review
adds `import_service_fix_sha256` and `quarantine_fix_sha256`; the full JSONB
readback includes both, and the native test checks their exact values. No old
Cycle2/Cycle3 evidence or already applied receipt is replaced.

The additional worker binding follows the complete CI4277 failure group. Only
the genuine M04 custody port with atomic prepare opts into the actual read-only
lookup before the worker's first MA1 acquisition. A fresh clock and lease check
then precede that first receipt; no earlier receipt is renewed. The complete
outer budget, per-operation caps, original history and later reproofs remain.
Normal negative lookups retain their existing justified queue-fail path. The
immutable `worker_authority_fix_sha256` column and updated job-storage hash bind
this exact runtime; the native readback checks both. The review remains UNAPPLIED.

The private native ACK successor also passes its capabilities through result
composition. The additional immutable `result_composition_fix_sha256` binds that
exact HRS assembly along with the existing method, job contract/storage and job
composition pins. The complete JSONB readback includes this field, and both
native installation fixtures check its exact value. Actual committed original
receipts, fresh MA1 and the later full native reproof remain required. The
original Cycle2/Cycle3 evidence and sender predicate are unchanged.

## Required operator sequence — Dev only

1. Independently verify the **new complete CI**, exact candidate head and actual
   Ready Dev deployment containing all bound runtime files. The old 4251 result
   is a predecessor proof and cannot approve the new fix.
2. Finish one normal Owner-UI CH→DE import under the new runtime; confirm a real
   successful publication **version 6 or newer** and its visitor response. Finish
   every saved original request. Do not repeat any completed method/Owner grant.
3. Read the actual current BG1, rolling quota, terminal subject, all original
   Cycle2/Cycle3 evidence and absence of open work. If any fact differs, stop
   this apply and inspect it. Do not reset a counter or edit historical rows.
4. Supply these settings in the exact Dev postgres session, using the actual
   freshly verified facts:

   ```sql
   SET jetnity.dev_terminal_cycle3_review_target='dev:yfvbxvijcorffwxbxahl:terminal-cycle3-v1';
   SET jetnity.dev_terminal_cycle3_review_ack='full-ci-ready-preview-and-normal-ui-verified-cycle3-v1';
   SET jetnity.dev_terminal_cycle3_review_commit='<actual 40-character commit SHA>';
   SET jetnity.dev_terminal_cycle3_review_deployment='<actual Ready dpl_ identifier>';
   SET jetnity.dev_terminal_cycle3_review_ci_run='<actual complete successful new CI run>';
   SET jetnity.dev_terminal_cycle3_review_ui_version='<actual successful version, at least 6>';
   ```

   These are explicit operator declarations. SQL cannot prove the remote CI,
   deployment or UI action from their strings. They do not replace live checks.
5. Execute the complete `review-cycle3.sql` in one transaction. A rollback
   rehearsal may replace only its final `COMMIT` with `ROLLBACK`; keep every
   other original byte and every precondition. The apply itself invokes no
   audit, tick, source or HTTP request.
6. Execute `readback.sql` read-only. A lost apply response is reconciled by this
   original readback; an existing review is never recreated or replaced.
7. Let the existing minute cron continue naturally. Independently require a new
   actual Source START, signed queued→published chain, fresh visitor projection,
   next due before expiry and following normal BG1 proof. A single successful
   manual request does not prove that the unattended plan is reliable.

If the new automatic run fails, retain its original IDs and collect the entire
failure group. This package does not authorize another historical exception.

## Transaction and security contract

The transaction uses the existing sender lock `(771106,31)` and state row, then
the common write lock `(771106,1)` **before** any guard-row share lock. It retains
the old Cycle2 review and sender tables under SHARE locks. Existing genuine
HMA/S1/jobs/HRS checkers obtain their existing protected SHARE locks. Snapshots
hold ACCESS SHARE against DDL; they are not presented as the writer mutex.

Both sides validate the real full catalog/history/certificates/retirements,
current guard, rolling quota, all role attributes and every complete old table
row in the affected private schemas. The tick's OID, owner, ACL and settings stay
identical. No role or authority grant is added. The new private table enables
RLS, grants no application access and rejects UPDATE, DELETE and TRUNCATE.
Existing privileged platform operators remain the same trust boundary.

## Reproducible proof and its limits

`lib/readiness/official-truth-dev-terminal-cycle3-review.test.ts` uses actual
owned PostgreSQL17, the socket-free persistent backend and unchanged full
HMA/S1/HMT/HRS/HM04/BG1/rolling-quota installation packages. It installs the
complete original Cycle2 review before executing this complete successor.

The local fixture preserves all coherent predecessor operations through 25,
including the exact original Cycle2 terminal bytes. A declared synthetic
unstarted cycle supplies 26–29; the six Cycle3 next-records then reach 35. Claims
31–35 and the terminal command/envelope match the full originals byte-for-byte.
The alternative later terminal head is 38. All protected history is constructed in a
new owned local database before its baseline; scheduler metadata and the original
Cycle2 review are then installed separately. No installed history or clock is rewritten. Local totals are 0 STARTs / 35 or 38 operations, deliberately not
the live 8/39 totals. It does not fabricate a source publication or Owner action.

The native matrix checks exact PostgreSQL evidence hashes, full old-row and
quota preservation, predecessor presence/evidence, altered/pending/unknown work,
unresolved custody, exact sender identity, rollback, immutable receipts, RLS/ACL,
strictly read-only acknowledgement and the subsequent normal sender path.
HTTP/Vault and operator acknowledgements are explicit local fixtures. Actual
provider transport, multi-session contention, new CI/Ready, UI and automatic
publication remain live acceptance gates; local PASS alone does not open them.


### Historical local result — before the I1 binding update

The final complete run passed **30/30 tests, zero failures/skips/cancellations**
in **23.544 seconds**. The same complete native run also evaluates the actual
read-only receipt booleans and IDs, not merely whether its SQL executes.

An earlier repeated run exposed one test-output JSON parsing error while moving
nearly 1MB of complete old rows through PostgreSQL's diagnostic pipe. Every SQL
gate and the new receipt check passed in that run. The correction hashes the
same complete ordered JSONB value inside PostgreSQL and transfers its 64-hex
SHA256; no comparison field, historical driver, migration, fixture or deadline
was removed or changed. The final 30/30 result includes this correction. The
migration at that earlier proof had been unchanged since its first successful
30/30 run. These dated results do not approve the later I1 source-binding update.

### I1 binding verification — 15 November 2026

The complete Cycle3 native group passed **31/31 tests, zero failures/skips/
cancellations**, in **36.816 seconds** on owned PostgreSQL 17.12 and Node 22.23.5.
It includes exact readback of both added I1 source pins on the original and
customer-information successor fixtures. Production compilation `--check` also
passed with every Production source and SQL file unchanged. No Dev apply or live
UI/automatic-publication result is asserted by these local checks.
