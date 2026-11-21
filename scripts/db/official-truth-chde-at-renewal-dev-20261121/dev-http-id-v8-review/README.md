# Dev HTTP allocator / BG1 v8 review sources

Root owns all executions. These source files are not evidence of installation.
The current evidence and exact file hashes are in `docs/evidence/official-truth-renewal-20261121/` and the Production review package. The legacy provider-owned sequence definition remains unchanged and its normal values continue to be consumed; the new allocator uses an own LOGGED sequence and a bounded SECURITY DEFINER trigger.

Regenerate the guard fragments from the repository root with explicit paths:

```sh
python scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-http-id-v8-build.py \
  --definitions docs/evidence/official-truth-renewal-20261121/dev-http-id-v8-live-guard-definitions.json \
  --transport-draft docs/evidence/official-truth-renewal-20261121/dev-pgnet-owned-trigger-rehearsal-attempt1.sql \
  --helper-source scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-pgnet-owned-allocator-assign-request-id-v1.SD.sql \
  --out-dir scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-http-id-v8-review
python scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-http-id-v8-assemble.py
```

The factory pins all six live guard definitions and the fully qualified helper body. Only catalog/assert/require/public-status definitions change; audit/control and the existing latch remain unchanged. PRE runs before transport changes; POST seals an append-only successor requiring a new natural full proof. The assembly takes the existing guard TRY lock first, then all known producer TRY locks and the global queue lock before reading all 16 ID maxima.

The first assembled execution ends in a full ROLLBACK. NEGATIVE tests use disposable savepoints and do not call HTTP, allocate sequence values or write sources. The separate installer consumes no ID and starts no artificial HTTP request. It is gated on a successful corrected native rehearsal and the independently reviewed exact installer. Its completion is not a new natural fullproof.

Do not use the original native-attempt SQL as a passing version: it failed with PostgreSQL 42725 on two unparenthesized JSONB access/subtraction expressions. The corrected POST explicitly parenthesizes both accesses. Earlier helper drafts were hardened before native execution to avoid temporary-schema type shadowing.

After IDs have been issued, preserve the new sequence and counter. The separate fence files stop new regular origin/local inserts and do not erase queued work or reset IDs. Their three placeholders require actual post-install pins; a rehearsal baseline cannot supply those pins. A normal trigger does not cover replica sessions or arbitrary direct queue UPDATEs. The public alarm uses the existing periodic audit, so immediate SQL refusal is not an immediate public-alarm claim.

Production is excluded. No Support message is authorized by these files.
