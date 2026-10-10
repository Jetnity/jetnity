# Official Truth source-bound 128KiB Evidence/custody V2.1 — REPORT

**Disposition: PARTIAL — STOP FOR TL R2.** The immutable task is not declared complete.

## R1 finding dispositions

- **P1-F1:** Changed selection to count UTF-8 bytes separately from UTF-16 units, verify the transport byte count against strict-decoded text at the private retrieval boundary, and refuse excess/mismatched input. Synthetic boundary tests cover 80,000 UTF-8 bytes / 40,000 UTF-16 units, 65,536, 131,071, 131,072, 131,073, and byte-count mismatch. Bern/AA remain unqualified; a positive authorized Bern path is intentionally unavailable.
- **P1-F2:** Accepted Evidence now uses an exact legacy field set or an exact V2 set containing only protocol 2; candidate and accepted discriminators must match. No positive live-source acceptance is claimed.
- **P1-F3:** Integrated-pilot historical identity parsing now preserves the optional V2 discriminator and rejects unsupported values while retaining the old V1 shape. V2 legal/source provenance remains dormant; complete end-to-end V2 acceptance/replay is not asserted.
- **P2-F4:** Focused tests passed (85/85), trusted-store tests passed (22/22, including disposable PostgreSQL), local-RPC inventory passed (4/4 after correcting its expected list), typecheck/build passed, and secret scans were clean. The serial run on the preceding code/test inventory ended 6,273/6,275: stale RPC inventory (fixed standalone but full suite not rerun) and concurrent bundle writers where one returned PostgreSQL `55P03` instead of `idempotent`. No timeout was increased; cause of the latter remains unresolved. Exact-head Actions run `38090932090` is `action_required` with zero jobs, not a pass. Auth and Preview are unverified.
- **P2-F5:** The required six task reports and sanitized synthetic manifest are supplied in this document set.

## Safety

No hosted Dev/Production SQL or data operation, no source registration, no approved profile, no legal fact/Rule promotion, no F8, no public indexing, no change to #913, and no new service or recurring cost. The operating-mode guard could not run because this shallow clone lacks a local `main` ref. `npm ci` reported 19 dependency audit advisories (2 moderate, 17 high); no dependency changes were made and these were not triaged in this correction.
