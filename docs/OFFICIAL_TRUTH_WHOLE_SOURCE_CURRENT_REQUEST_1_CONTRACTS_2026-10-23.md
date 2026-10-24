# Official Truth Whole-Source Current Request 1 — CONTRACTS

**Cursor-Agent: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1**

Date: 23 October 2026. Issue #982, parent #917, Draft PR #985. Immutable TASK unchanged. This file records the code contract that was implemented. It does not qualify a source, admit a profile, or enable the application pilot.

## Protocol

- Discriminator: `sourceFingerprintProtocol: 3`.
- Selection is the code-owned policy only, and only on the genuine server-owned entry (`loadOfficialTruthServerOwnedRetrieval`, unexported privileged symbol, `catalog == null`). Body size, hostname, caller `maxBytes`, caller protocol, headers, environment, catalog fields, a profile clone, and the exact compiled profile object inside an injected catalog do not select it.
- A small body selected by that privileged policy stays protocol 3.
- The marker is own data carried on the new material, Evidence, review, extractor, and application projections. Missing, unknown, mixed, and downgraded markers are refused. They are not inferred or rebuilt from the policy. An ineligible tuple that still carries a marker is refused rather than stored as legacy 1 or 2.
- Historical consumers refuse an explicit marker before catalog, client, RPC, or storage. If a producer result still contains 3, the store and server-held boundaries refuse it again before transport or a downgraded return.
- Caps, both inclusive: 393216 raw UTF-8 bytes and 393216 UTF-16 code units.
- Raw UTF-8 length is the original text, before CRLF/CR to LF normalization.
- Rejected: empty text, BOM, lone surrogates, invalid UTF-8, overflow. No prefix hash, trimming, or Unicode/HTML normalization.
- The only text normalization is the existing V2 line-ending rule.

## Hash

Domain, ending in one U+0000:

`jetnity:official-truth:source-fingerprint:v3\0`

Preimage:

`JSON.stringify([3, binding, normalizedCompleteText])`

Binding field order: `sourceId`, `contentItemId`, `contentItemVersion`, `representationId`, `representationVersion`, `identityProfileId`, `identityProfileVersion`, `canonicalUrl`, `contentType`.

Golden synthetic body `SYNTHETIC WHOLE SOURCE CURRENT REQUEST ONLY\n` with the synthetic binding in the v3 test hashes to `691aef0448394c434c5be5b5a33066d589f6556490b9f391ec0ba2710ce21cb4`.

The hash grants no authority by itself. `official-truth-source-fingerprint-v2.ts` is unchanged.

## Dormant tuple

Policy `fedlex-fza-current-request-384k-v1`, version 1, usage `current_request_only`, protocol 3.

- sourceId `fedlex-federal-chancellery-unqualified-research`
- contentItemId `eli-cc-2002-243`, contentItemVersion 1
- representationId `cc-20201215-de-html-9`, representationVersion 1
- identityProfileId `fedlex-fza-20201215-html-9-unqualified`, identityProfileVersion 1
- sole request URL and expected final URL: `https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2002/243/20201215/de/html/fedlex-data-admin-ch-eli-cc-2002-243-20201215-de-html-9.html`
- media `text/html`, redirect allowance 0, max 393216

These identifiers are not an admitted source. Production `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` has no matching profile. Selection requires the unique current item and representation, reference equality with the single current profile object inside the registry array the server actually holds, and the privileged entry with no injected catalog. `catalog.identityProfiles` is not that array and cannot enlarge the transport.

## Evidence and review

- `identitySchema` stays 2. Version ids stay `ev2_`.
- `contentEvidenceVersionCurrentRequest` requires protocol exactly 3.
- `contentEvidenceVersionV2` still rejects 3.
- `evidenceSourceFingerprintProtocol` still returns null for 3, so historical comparison cannot treat 3 as 1.
- `officialTruthReviewIdentityV3` is unchanged and rejects a protocol-3 support.
- `officialTruthReviewIdentityCurrentRequest` requires exactly one protocol-3 support.
- New review preimage: `{ v: 3, usage: 'current_request_only', sourceFingerprintProtocol: 3, candidate, supports }`.
- Key prefix remains `review-packet:v3:`. The digest is not an old alias.

## Application

Optional contract fields `sourceProtocol`, `policyId`, and `policyVersion` bind a future protocol-3 contract into `applicationCurrentRequestContractDigest`. The digest is not hashed into itself. `contracts` stays `[]`. `applicationPilotEnabled()` stays false. A contract that names this policy cannot accept a legacy or protocol-2 retrieval, including a small body. Legacy contracts that omit the new fields keep the existing 65536 / `evidenceQuellenFingerprint` check.

## Retrieval framing

Protocol 3 uses the existing HTTP engine, the 10-second retrieval deadline, and the 15-second pilot deadline. It requires `framingComplete() === true` and, when Content-Length is declared, exact equality with the bytes read. Absent Content-Length is accepted only with that affirmative framing proof. A redirect on this path returns `redirect_rejected` and is not followed.

Framing failure and Content-Length mismatch on the shared retrieval result use the existing reason `http_failed`. Review R1 accepted that reason. Duplicate or malformed raw `Content-Type`, `Content-Length`, `Content-Encoding`, or `Transfer-Encoding` pairs are also `http_failed` at the native adapter, before the normalized header map can hide them. The Bern research outcome keeps its own `framing_unverified` reason. Declared over-cap remains `response_too_large` and cancels before the body is pulled. A stream that grows past 393216 cancels with the same reason.

## What stays closed

No compiled profile, extractor row, or application contract was added. The extractor production registry stays empty. Provider stays off. No SQL, migration, retained original, positive cache, historical re-fetch, or real source GET. Protocol 3 is refused before store, bundle, custody, reproof, autonomous parse, composition, coverage, and server-held transport.
