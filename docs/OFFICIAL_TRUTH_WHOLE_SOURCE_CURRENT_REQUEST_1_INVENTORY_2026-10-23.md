# Official Truth Whole-Source Current Request 1 — INVENTORY

**Cursor-Agent: Jetnity Official Truth Whole-Source Current Request 1 — Cursor Generation 1**

Date: 23 October 2026. Every path below is either on the TASK write allowlist or read-only. No additional shared file was edited.

## Primary path

| Path | Change | Expected behavior | Covering test |
| --- | --- | --- | --- |
| `lib/readiness/official-truth-bounded-response-body.ts` | Shared loop. Old public max stays 131072. New entry is fixed at 393216 and takes no caller max. One `Uint8Array`, chunk `set`, one `slice`. | 393216 accepted. 393217 cancels. Caller max 131073 still fails. | `official-truth-source-fingerprint-v3.test.ts` |
| `lib/readiness/official-truth-server-owned-retrieval.ts` | Policy selection, zero redirects, framing and length checks, v3 hash. | Live registry cannot select 3. Clone stays on the 65536 cap. Protocol 3 success requires framing and length agreement. | `official-truth-whole-source-current-request-1.test.ts`, existing retrieval tests |
| `lib/readiness/official-truth-source-fingerprint-v3.ts` | New hash and caps. | Golden NUL-domain vector. Raw bytes counted before normalization. | `official-truth-source-fingerprint-v3.test.ts` |
| `lib/readiness/official-truth-whole-source-current-request-1.ts` | Dormant policy, reference-equal profile lookup, getter-safe marker walk. | Does not import the content-identity module. Array getters are not invoked. | history refusal, content-identity importer scan, autonomous C22 |
| `lib/readiness/official-truth-content-identity.ts` | Additive constructor and optional protocol 3 on the identity type. | Old constructor still rejects 3. `ev2_` prefix stays. | fingerprint v3 test, existing identity tests |
| `lib/readiness/evidence.ts` | Protocol 3 uses the new constructor. `identitaetPasst` requires the policy against the imported registry constant. | Historical protocol reader still returns null for 3. | pipeline test, existing evidence tests |
| `lib/readiness/official-truth-retrieved-material.ts` | Eligible tuple forces protocol 3 and the v3 hash. | Hash failure does not fall through to v1/v2. | pipeline test |
| `lib/readiness/official-truth-retrieved-candidate-evidence.ts` | Protocol 3 calls `evidenceKandidatAusAktuellemMaterial`. Other markers still call `evidenceKandidatAusModell(`. | Old constructor pin remains. | candidate-evidence test, pipeline test |
| `lib/readiness/official-truth-accepted-evidence.ts` | In-memory protocol-3 acceptance uses the v2 field list. | No store insert. | pipeline test |
| `lib/readiness/official-truth-rule-review-packet.ts` | Support marker 2 or 3 is copied. | Mixed markers do not become 1. | pipeline packet assertion |
| `lib/readiness/official-truth-rule-review-fingerprint.ts` | New single-support constructor. Old V3 body unchanged. Wrapper dispatches only when every marker is 3 and length is 1. | Old constructor rejects 3. | fingerprint v3 test |
| `lib/readiness/official-truth-trusted-fact-extractor-registry.ts` | Protocol-3 binding before the old rejection. Production registry stays `[]`. Frozen execution refuses 3. | No production extractor entry. | extractor importer test, pipeline test with a synthetic definition |
| `lib/readiness/official-truth-ch-de-application-pilot-1/contract-server.ts` | Optional policy fields and digest helper. `contracts` empty. Pilot stays false. | Existing contracts omit the new fields. | application.test.ts, closed-gate test |
| `lib/readiness/official-truth-ch-de-application-pilot-1/evaluate-server.ts` | Current-request branch before the legacy 65536 check. | A named protocol-3 contract requires retrieval protocol 3, zero redirects, both caps, and the v3 hash. | pipeline test, application.test.ts |

## Refusal-only path

The marker walk uses own-data descriptors. It does not call getters and does not scan `Buffer`, `Uint8Array`, `ArrayBuffer`, or `DataView`. Depth limit 12.

| Path | Refusal before transport | Covering test |
| --- | --- | --- |
| `lib/readiness/official-truth-store-server.ts` | Both save functions return `store_failed` before the old `protocol === 2 ? 2 : 1` line. | history refusal, spy count 0 |
| `lib/readiness/official-truth-integrated-pilot-bundle.ts` | Public readers return `unsupported_version`. | history refusal |
| `lib/readiness/official-truth-autonomous-provenance-record.ts` | `schema_incompatible` before zod. | history refusal, C22 getter count 0 |
| `lib/readiness/official-truth-same-request-proof-server.ts` | `invalid_source_snapshot` before authority. | history refusal, authority spy 0 |
| `lib/readiness/official-truth-same-request-extraction-server.ts` | Refuses before retrieve. | history refusal, retrieve spy 0 |
| `lib/readiness/official-truth-server-held-source-registry.ts` | Refuses before `registryLaden`. | history refusal, catalog spy 0 |
| `lib/readiness/official-truth-composition-policy-registry.ts` | Phase A/B and citations return `representation_not_eligible` before reading supports. | history refusal, supports getter 0 |
| `lib/readiness/official-truth-coverage.ts` | After fact kind is known, marker returns `unexpected_fields` before `invalid_reference_time`. | history refusal |
| `scripts/db/official-truth-original-custody-1/storage.ts` | Throws `protocol3_current_request_unsupported` before query or connect. | history refusal, query spy 0 |

## Read-only consumers

No edit. Expected behavior is the previous closed 1/2 behavior. Protocol 3 is not given a new positive path here.

| Path | Disposition |
| --- | --- |
| `lib/readiness/official-truth-global-representation-qualification.ts` | Unchanged. No protocol-3 admission. |
| `scripts/official-truth-real-primary-source-bridge-1/bridge.ts` | Unchanged. Assigns `retrieval.reason` into the existing report enum. That coupling is why protocol-3 framing and length mismatch stay on `http_failed`. |
| `scripts/db/official-truth-integrated-pilot-1/r2-fixtures.ts` | Unchanged. |
| `scripts/db/official-truth-integrated-pilot-1/r3-proof.ts` | Unchanged. |
| `scripts/official-truth-ch-de-first-visa-vertical-1/accepted-read-proof.ts` | Unchanged. |
| Existing rule-claims, applicability, research-request, and coverage prefix contracts | Unchanged except the coverage refusal guard above. |

## Tests and fixtures

- `lib/readiness/official-truth-source-fingerprint-v3.test.ts`
- `lib/readiness/official-truth-whole-source-current-request-1.test.ts`
- `lib/readiness/official-truth-whole-source-history-refusal-1.test.ts`
- `lib/readiness/fixtures/whole-source-current-request-1/harness.test.ts`

The harness is a test file so the content-identity and extractor importer scans skip it. It transpiles the existing engines with one substituted registry constant and `esModuleInterop`. That substitution is not a deploy route. No government text is stored. Existing tests were not edited.

## Docs

PLAN was committed before material code. This INVENTORY, plus CONTRACTS, STATUS, SELF_REVIEW, HANDOFF, and REPORT, are the task-owned records. The TASK file was not edited. Global status, architecture, roadmap, and decisions were not edited.
