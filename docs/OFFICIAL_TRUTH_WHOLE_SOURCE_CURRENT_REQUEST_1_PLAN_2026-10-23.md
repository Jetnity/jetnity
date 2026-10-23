# Official Truth Whole-Source Current Request 1 — PLAN

**Cursor-Agent: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1**

Date: 23 October 2026. Issue #982, parent #917, existing Draft PR #985, branch `feat/official-truth-whole-source-current-request-1`.
This PLAN is the task-owned record required before material code. The immutable TASK file is not edited.

## Session and model ACK

- Logical name: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1
- Requested model: Grok 4.7 High Fast (`grok-4.7-high-fast`)
- Actual `originalModelName`: `grok-4.7-high-fast`
- Session: `bc-45700535-8356-442d-aba6-1ed8373578fc`
- Session URL: https://cursor.com/agents/bc-45700535-8356-442d-aba6-1ed8373578fc
- No UI rename. No Auto fallback.

## Verified start

- `HEAD` `8953b2e858b7b07bf1b15464a39fdc4a944e2ae5`
- Tree `f9d19b12c45f08644232624e3ab1a80d8e5f7103`
- `origin/main` and merge-base `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de`
- Ahead/behind versus that main: 2 / 0
- Task blob `b1371993e1e7f5b09ceebd4462325c1b94c3faba`
- Operating mode re-read: `NORMAL`
- Seed diff is the one task file only

## Goal

One dormant, code-only whole-source Protocol 3 current-request path through the existing HTTP retrieval, Evidence, review provenance, deterministic extractor and CH-DE application pilot. Protocol is selected only by the code-owned policy. Body size never selects it. Production registries, contracts, the extractor registry and the application gate stay closed.

## Protocol and memory

- Discriminator: `sourceFingerprintProtocol: 3`, including small bodies when the policy matches.
- Caps, both inclusive: 393216 raw UTF-8 bytes and 393216 UTF-16 code units. Raw bytes are counted on the original text before the existing CRLF/CR to LF normalization. Overflow cancels the read. No prefix hash.
- Hash domain: `jetnity:official-truth:source-fingerprint:v3` plus one U+0000, then `JSON.stringify([3, binding, normalizedCompleteText])`. Binding field order matches V2.
- V2 file, V1/V2 hashes, the public reader maximum 131072 and the legacy 65536 evidence hash stay as they are.
- Reader memory: one `Uint8Array` of exactly 393216 bytes, `set` of each chunk into that buffer, one `slice` of the received length. No chunk array. The same loop serves the old reader. The new entry takes no caller maximum.
- Deadlines stay 10 seconds for retrieval and 15 seconds for the pilot.
- Protocol 3 framing: native `framingComplete() === true`, EOF through that proof, and exact `Content-Length` equality when a length is declared. A missing length is accepted only with that affirmative proof. The old 64/128 KiB paths keep ignoring framing.

## Eligibility

Policy id `fedlex-fza-current-request-384k-v1`, version 1, usage `current_request_only`, the exact dormant tuple from the TASK, zero redirects, media `text/html`.
Selection requires the unique current item and representation in the catalog graph and reference equality with the single current profile object in `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY`. Production has no such profile, so the live path cannot select 3. Injected clones and caller `maxBytes` / protocol fields do not. Tests may load a transpiled copy of the same modules with a substituted registry constant. That is not a live injection route, and no profile, extractor or contract row is added.

## Consumer topology

Primary path carries 3 through retrieval, material, the new evidence constructor (`identitySchema` 2, `ev2_`), in-memory acceptance, review packet, the new review preimage (`usage` and protocol 3 beside the existing v3 candidate/support fields, same `review-packet:v3:` prefix, new digest), the extractor and the application branch. A contract that names 3 cannot use the legacy hash. `contracts[]` stays empty and `applicationPilotEnabled()` stays false.

Old `contentEvidenceVersionV2` and `officialTruthReviewIdentityV3` keep rejecting 3. Historical version comparison keeps refusing 3 instead of reading it as 1.

Refusal before catalog, authority, HTTP, SQL or store transport, for a tiny body as well as a large one:

- store evidence and rule-claim save
- integrated pilot bundle readers
- autonomous historical parse
- same-request proof and extraction, including the extraction HTTP call
- server-held material, acceptance, review, reproof and candidate
- composition phase A/B and citation check
- original-custody prepare/bind/review/persist
- coverage evaluation

`protocol === 2 ? 2 : 1` and marker-2-only copies are not allowed to drop 3. Those sites refuse first.

Read-only, no write: global representation qualification, real-primary bridge, integrated-pilot r2/r3 scripts, accepted-read proof, and the existing rule-claim / applicability / research-request prefix contracts. No SQL, migration, provider, Fedlex GET or registry row.

## Tests

- `official-truth-source-fingerprint-v3.test.ts`: golden NUL-domain vector, 393215/393216/393217, UTF-8 versus UTF-16, invalid UTF-8, BOM, lone surrogates, CRLF raw-before-normalization, old V1/V2 boundaries.
- `official-truth-whole-source-current-request-1.test.ts`: synthetic 371444 and 393216 bodies through the real reader, retrieval, Evidence, review, extractor and application copy; framing, length, redirect, deadline, media and compression failures; identity-field and clone refusal with zero enlarged read; old constructors still reject 3; small body stays 3.
- `official-truth-whole-source-history-refusal-1.test.ts`: tiny and larger protocol-3 inputs, spy count 0 on transport, catalog, authority, proof, retrieval and SQL.

No government text. No live source or database call. Existing tests stay unchanged.

## Out of scope

Source qualification, legal interval, visa result, production retention, #917 readback, and every protected gate named in the TASK. This plan does not mark Ready and does not merge.
