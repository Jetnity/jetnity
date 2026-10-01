# Official Truth Retrieved Material → Candidate Evidence Bridge 1 — Self-Review

Date: 2 October 2026
Issue: #711
Draft PR: #713
Branch: `feat/official-truth-retrieved-material-candidate-evidence-bridge-1`

Logical agent: **Jetnity Official Truth retrieved material candidate evidence bridge 1**, Generation 1
Session: https://cursor.com/agents/bc-60f030cd-8951-4216-bd3e-a06f692b409c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `3f4b1bfd5fe545c36fdc689cb0c6204b4287c403` is the task seed plus:

- `lib/readiness/official-truth-retrieved-candidate-evidence.ts`
- `lib/readiness/official-truth-retrieved-candidate-evidence.test.ts`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_CANDIDATE_EVIDENCE_BRIDGE_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_CANDIDATE_EVIDENCE_BRIDGE_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RETRIEVED_MATERIAL_CANDIDATE_EVIDENCE_BRIDGE_1_SELF_REVIEW_2026-10-02.md`

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md` was not edited, because the allowlist forbids global continuity. Continuity for this slice is the report and the handoff.

No remote Supabase command was run. No migration file was added. `official-truth-research-request.ts`, `official-truth-research-source-routing.ts`, `official-truth-research-execution-plan.ts`, `official-truth-retrieved-material.ts`, `source-router.ts`, `source-registry.ts`, `evidence.ts` and `official.ts` were not edited. The task said to stop if the bridge needed a change to those contracts. It did not. Retrieval is the public #709 function. The cell is the public `regelScopeAusEvidenceScope`. The candidate is the public `evidenceKandidatAusModell`.

## What I checked in the bridge

- A real #702 request, a synthetic `gov.example` authority, a registered HTTPS URL, a past `Z` instant and a snapshot inside the existing fingerprint limit, with null extraction, return `candidate_evidence`. Lifecycle is `candidate`. Validation state is `pending`. Source class is `official_authority`. Previous version is null. The lookup key equals `evidenceSuchschluessel` for the canonical cell plus the receipt `sourceId`. The rule-scope key stays the request key and is not the lookup key. The hash equals `evidenceQuellenFingerprint`. The canonical URL equals `quellenUrlAufloesen`. `akzeptierteEvidenceLesen` returns null. The input JSON is unchanged.
- `validFrom` `2026-01-01`, `validUntil` `2026-12-31T00:00:00.000Z` and a padded extraction note are stored as the constructor stores them. The note is trimmed. The version id and content hash stay the same as the null-window candidate. An empty note becomes null. A reversed window is `invalid_validity`. An overlong note is `invalid_context`. The note marker is not in the blocked result.
- An explicit `undefined` validity field and a numeric validity field are `invalid_extraction`. They are not coerced to null.
- A different `sourceId` written onto the request scope does not become the Evidence source. The Evidence source stays `example-border-authority`. The interior id is not in the Evidence JSON.
- Two requests that differ only by passport issuing country, CH versus RS, both keep the citizenship set `CH` and `RS`. Their lookup keys differ. The issuing country is not used as the only citizenship. A request with transit `TH` and residence `DE` keeps both, plus destination `JP` and both citizenships.
- Scope, rule-scope key, request key, source id, source class, authority name, publisher name, URL, retrieval time, snapshot, content, both hashes, and the decision keys fail as `extraction_field_forbidden`. The result object is exactly status and reason. `not_required` is not in that JSON.
- Passport, document, MRZ, scan, birth date, health, name, email, account, user, trip, traveller note and a nested passport number under `extractionNote` return `sensitive_personal_field` without the value and without the key name.
- A caller-built receipt object fails `provenance_override_forbidden` because #709 sees URL and retrieval time outside `material`. A receipt-shaped object without those keys fails `invalid_envelope`. A changed request key is `invalid_request`. A swapped destination under the old rule-scope key is `scope_mismatch`. A caller hash is `source_fingerprint_override_forbidden`. An empty snapshot is `invalid_source_snapshot`. One millisecond after the injected clock is `retrieved_at_in_future`. A null clock is `invalid_validation_clock`.
- The runtime file calls #709, `regelScopeAusEvidenceScope` and `evidenceKandidatAusModell`. It does not contain `not_required`, an acceptance or claim constructor, a hand-built version id, a store or catalog RPC, `requirementsProviderAus`, `Date.now`, `new Date`, `fetch`, or an engine, provider, store, catalog or candidate-batch import. `evidence.ts` does not import this module. `requirementsProviderAus()` is still `null`.

## Boundary choices a reviewer should see

1. #709 runs before extraction is read. A broken envelope returns the #709 reason and does not include the extraction value. A valid envelope with a forbidden extraction field returns the extraction reason and does not call the constructor with that field.
2. The personal-key set and the note set are copied from the retrieval receipt. That set is module-private. Exporting it would have edited #709, which this task forbids. `extractionNote` is the one allowed note. Other note keys stay personal.
3. `sourceId` is a legal field on a rule-scope object and is ignored by the rule-scope key. The bridge therefore does not spread the request scope. It copies the canonical atom and then sets `sourceId` from the receipt.
4. Constructor failures keep the constructor reason and drop `fields`, so a decision name is not copied back. Personal extraction keys are rejected before that path.
5. If the constructor result is not a pending official candidate with the receipt provenance, the bridge returns `invalid_context` and does not return the object. With the current unmodified constructor and a passing receipt, that branch is a guard.
6. The success status is `candidate_evidence`. It is a discriminant, not an entry effect. The blocked result is only `status` and `reason`.
7. No ADR was added. `DECISIONS.md` is outside the allowlist. The decision lives in this review and the report.
8. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Findings I am not calling done

1. Nothing in the engine, the requirements route, a browser or the store calls this function. That is the task boundary. A later orchestration slice must call this bridge once per retrieved page, must keep `blocked` distinct from candidate Evidence, and must not accept the candidate or map it onto Sherpa, Timatic, KAYAK, a fetch URL or an entry effect.
2. `docs/ACTIVE_WORK_STATUS.md` on this branch still points at an older writer. Updating it would edit global continuity, which this task forbids. The next reader should start with this handoff.
3. Exact-head GitHub CI, Auth and Vercel Preview are not a property of this prose until they are read for the pushed head.

## Local validation

Recorded on `27ec55d8eba77c748b47240ddf4588f97acc43b3` before this docs commit. `origin/main` is `3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`. Merge-base is that SHA. The branch was 0 behind and 3 ahead.

- `git diff --check`: pass.
- `node scripts/operating-mode-guard.mjs`: PASS.
- `lib/readiness/official-truth-retrieved-candidate-evidence.test.ts`: 8/8 pass.
- `npm test`: 4317 pass / 0 fail. 750 suites. PostgreSQL 16.15 is present at `/usr/lib/postgresql/16/bin`. The store test files were not changed. No remote database was contacted.
- `npm run typecheck`: pass.
- `npx eslint` on the two new files: pass, no warnings.
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`: pass.
- `check:schema-bezug`: pass, with the three existing LOCAL/UNAPPLIED RPC notes. No new RPC.
- No Supabase CLI command and no remote database command were run.

## Exact-head gates

The pushed tip is the review head. GitHub CI, the Auth job and Vercel Preview belong to that tip. They are not copied from `3f4b1bfd` or from `27ec55d8`.
