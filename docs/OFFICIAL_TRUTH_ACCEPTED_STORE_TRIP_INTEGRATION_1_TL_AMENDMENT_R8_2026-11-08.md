# Accepted Store Trip Integration 1 — TL amendment R8

Date: 2026-11-08. Authority: ChatGPT / Technical Lead (Root).
Work #1155 / Draft PR #1156. Same author: Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1; session `/root/accepted_store_trip_integration_writer`.
Exact correction parent: `a75e709f074576d3f1ad1d4ac8fec54956fcb02a`, tree `dda70c1886773385e6ff6564d2b4d7dbce178b47`. Main remains `e1fe0c696ade9f39b417772b5c065f87530204d6`.
TASK V1 and R1–R7 remain unchanged. This is same-session **Fix9 scope V1**, following independently observed CHANGES REQUIRED.

## Actual failure and source diagnosis

Completed CI42460406775/Core128668274935: 8205 tests / 8200 pass / 2 fail / 1 cancelled / 2 existing skips; 989476.838021ms. Browser's genuine native CURRENT reply fails the actual client validator with `response_binding_invalid`, before the unchanged current-status wait. Its observed hook is unavailable, not busy, readable, visible and not draft-blocked. Original SHA256 `e6f56550a9aa490a69dc41959badcbd8821be4e525350f3a4513ffd75572ae56`.

Root and independent UI review confirmed this source chain: new reader-server.ts (blob `5ecc2e66a71df615f8d602d91b793b8aa47da924`) passes the full `ot-provenance-v1:<64 lowercase hex>` receipt as a rule reference (81 characters); unchanged engine.ts applies `regelReferenzLesen`; unchanged official.ts (blob `dbaf9738cee8583e1b29577896547d47d236a35c`) normalizes references longer than80 characters to null; new client-result.ts (blob `c6cea75e6ff4bd9d3af0848d5e880818e28089dd`) requires equality with the full receipt. This source incompatibility deterministically explains the observed refusal. The raw normalized positive row was not logged; no retrospective raw-row observation is claimed.

Recovery separately fails `0 !== null` at native-recovery.ts160. Its new observer compares a null payload token with initially null raceToken and attributes the earlier ordinary start sweep to the later disposal. Actual later Finalize COMMIT and acquired-token Cleanup55P03 are observed.

## Approved product correction: exact lossless engine reference

Within the new accepted-store integration package only, define one strict shared presentation mapping:

- Input remains exactly `ot-provenance-v1:` followed by all64 lowercase hexadecimal digest characters.
- Engine rule reference is exactly `ot-accepted-v1:` followed by those same64 characters: **79 characters**, within the unchanged80-character engine limit.
- Preserve every digest character and the explicit version-specific namespace. Reject malformed, shortened, noncanonical or unsupported input; do not truncate, hash again, accept arbitrary suffixes or add fallback alternatives.
- The server provider uses this representation. The actual client decoder requires exact equality with the representation derived from the independently validated full envelope receipt.
- Full receipt identities in the response envelope, stored claims/versions, retained acceptance, custody AAD, operation journal, current head, witness and reconciliation remain unchanged. This is a presentation mapping, not a new source of authority or a migration.
- Existing Requirements engine, official.ts and the80-character limit remain unchanged. No renderer, hook, display clock, lifetime or legal-result broadening.
- Include any new helper in the actual source-identity/retained-code closure. Existing profile versions, transport/graph/artifact bounds and semantic proof requirements remain unchanged.

Add a meaningful integration regression at a genuine native fresh-reader positive: pass the actual returned DTO and actual saved Trip through the real client decoder, assert the engine preserved the exact79-character reference and full envelope receipt, and prove precise altered-reference refusal using only a negative mutation of that genuine response. This does not replace the existing actual mounted positive and lifecycle acceptance matrix. Do not manufacture an accepted positive DTO.

## Approved fixture correction: true acquired-token disposal attribution

The R4 afterCommit observation must require the actually acquired non-null token and actual post-abort disposal phase, matching that exact token. The earlier null-token start sweep must remain excluded. Keep exactly one disposal attempt, no post-abort Auth/Confirm/witness continuation, separate actual COMMIT/55P03 assertions, original row/timestamp/state checks, explicit permitted reconciliation, original-expiry/new ordinary-reader sweep, unchanged durable history and final resource cleanup.

This is a test-observer correction. No cleanup retry, immediate-deletion assumption, product SQL or R4 contract change.

## Timing diagnosis is separate and not yet an implementation authorization

a75 main Native cancels at240000ms; only two explicit new family-completion markers are present. Prior e51 seven-family evidence does not transfer. The completed a75 Atomic job also cancels at900000ms, without its last two cases or global cleanup.

Author may prepare a measured **read-only** Native partition/setup proposal, including the three actually observed SSR drains of25439/25427/25424ms and the existing genuine outgoing/owned-boundary contracts. Root separately requested independent Atomic timing/source diagnosis. No timeout, test partition, workflow, concurrency, skipped assertion or performance implementation is authorized by R8. Any such proposal requires a separate explicit versioned Root scope decision before changes.

## Return and release limits

Implement only the two concrete corrections and their meaningful proof/documentation. Preserve passive browser diagnostics and all existing mandatory acceptance families. Freeze exact file hashes against a75 and honestly distinguish source checks from unexecuted runtime evidence; return to Root for independent review. Every new head requires complete fresh execution gates.

Only Root may issue TL PASS, Ready or merge. SQL remains UNAPPLIED; provider/binding/contracts inactive; FEATURE_NOT_LIVE. #917 original refusal/unknown readback/no retry or workaround, #1131 independent hold and all target Owner/session/source/key/retention/witness/privacy/ownerMac/activation gates remain. No hosted action, actual key/source activation, paid call, public launch/indexing or automatic following slice.
