# Official Truth Same-Request Retrieval-to-Extractor Binding 1 — Report

Date: 3 October 2026
Issue: #782
Draft PR: #783
Branch: `feat/official-truth-same-request-extraction-binding-1`
Baseline: `main@5a7634d01fd4941a390b8844699c24813d114f6f`
Implementation commit: `07f964aad275258e5e50580376e07d03232b13f2`
Task: `docs/OFFICIAL_TRUTH_SAME_REQUEST_EXTRACTION_BINDING_1_TASK_2026-10-03.md`
Logical agent: **Jetnity Official Truth same-request retrieval-to-extractor binding 1**
Generation: **1**
Session: https://cursor.com/agents/bc-cd1db2ef-5a0e-4ce6-af5b-f4ff6800c295
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge. The review head is the tip of this branch after the documentation commit that adds this file. Re-fetch that tip before review. Do not review `07f964aa` as the final head; that SHA is the implementation commit and does not contain this report.

The task file was not rewritten. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, and `ROADMAP.md` were not edited. The task forbids those global current-state files.

## Result

`loadOfficialTruthSameRequestTrustedFactExtraction(eingabe)` is the only live entry. It takes the same research envelope as `loadOfficialTruthSameRequestProof`. One call does four server-owned steps and nothing else:

1. The canonical proof path. That path performs the one external source-catalog read.
2. A closed check. `composed_from_multiple_primary_sources` stops here, before HTTP, with `composition_policy_unavailable`. No code-owned composition policy exists on this baseline, and this slice does not invent one.
3. A fresh server-owned HTTPS retrieval for every proof support, in the proof's canonical support order. The retrieval catalog is an in-memory replay of the frozen `proof.registry`. It accepts only `{ operation: 'read_registry' }`. It does not read env, Supabase, or the network. A registry that still carries `blockedDomains` fails as `blocked_domain_not_replayable` instead of dropping that state. The current catalog RPC has no blocked-domain payload, so a catalog-built proof registry replays.
4. `officialTruthTrustedFactExtrahieren`. The production extractor registry stays `Object.freeze([])`. A single explicit-primary support therefore ends as `extractor_not_registered` after the trust bindings. No route calls the entry, so this merge does not fetch a government page.

`decideOfficialTruthSameRequestTrustedFactExtraction(eingabe, deps)` is the test seam. Tests may replace the proof loader, the retrieval function, and the extractor function. The live entry does not. It passes `loadOfficialTruthSameRequestProof`, `loadOfficialTruthServerOwnedRetrievalWithCatalogTransport`, and `officialTruthTrustedFactExtrahieren`.

The retrieval helper was required. The public `loadOfficialTruthServerOwnedRetrieval` is unchanged and still takes no catalog, clock, DNS, or HTTP override. The helper accepts only an `OfficialTruthSourceCatalogTransport` from server code, then uses the existing server clock, DNS resolver, and HTTPS client. Outside tests, only the new composition module imports it.

A successful test result is `same_request_trusted_fact_material`. It is deeply frozen and keeps the registry, accepted Evidence versions, rebuilt candidate, review key, scope key, fact kind, explicit-primary quality, support ids, server reference time, freshness `current`, the role grant, the extracted fact, extractor id/version/schema family, null policy metadata, provenance, and per-support retrieval provenance. Provenance is version id, source id, final canonical URL, the fresh retrieval timestamp, content type, and content hash. The raw `sourceSnapshot` is not retained after extraction. The object is not acceptance, not a bearer token, and not an API payload.

Retrieval identity is exact. A different source id is `support_binding_mismatch`. A different final URL is `source_url_changed_since_evidence`. A different content hash is `source_changed_since_evidence`. The accepted Evidence version must exist once and match that version id, source id, URL, hash, and rule scope. The fresh `retrievedAt` is the retrieval boundary's own clock. It is not required to equal the stored Evidence time, and the caller cannot supply it.

`explicit_primary_statement` is passed to the extractor with `policy: null` only. Caller policy, caller proof, caller registry, caller Evidence, caller retrieval, caller fact, and caller extractor fields fail through the existing proof input guards and never reach HTTP.

## Traveller context

This slice does not choose among citizenships, travel documents, issuing countries, or residence. The proof's rule-scope key already names one regulatory cell, including the full citizenship set and the one credential option of that cell. A second document or a second citizenship cell stays a different scope and a later invocation. Personal keys remain forbidden by the existing proof and extractor guards. No shadow identity model is added.

## Necessity of the retrieval edit

The composition has to run the existing live DNS/HTTPS retrieval against a server-built catalog transport. The public live retrieval entry intentionally refuses a caller catalog. Adding `loadOfficialTruthServerOwnedRetrievalWithCatalogTransport` is the narrow seam. It does not weaken the SSRF, redirect, port, fragment, timeout, or body limits from #777.

## Out of scope, unchanged

Not implemented, and not claimed as done:

- a real extractor definition, or any GOV.UK, ICA, IATA, Sherpa, or CH parser
- `regelKandidatAkzeptieren`, an accepted Rule Claim, or F8
- an Evidence or store write
- a route, UI, Auth, AAL, or RLS change
- a migration, a Development apply, or a Production apply
- #626 and CH import
- a provider, model, plugin, secret, or paid call
- a server-held composition policy

`requirementsProviderAus()` stays null. No `app/` file imports the new module. The production extractor registry length stays 0.

`check:schema-bezug` still lists the same four pre-existing LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`. This slice adds none.

## Validation

Focused binding tests: 16/16. Retrieval tests, including the new helper: 26/26. Both are inside the full suite.

`npm test`: 4571 pass, 0 fail, 767 suites. The first run on this VM failed the two existing throwaway PostgreSQL proofs with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. PostgreSQL 16.15 was then installed locally. `policy-rc.d` denied the service start. The proofs were re-run inside the full suite against their own temporary clusters. No remote database was contacted. Nothing was applied.

Typecheck pass. Lint: 0 errors and 148 pre-existing warnings; none are in the files this slice added or edited. Production build pass on Next.js 16.3.8 with 25 static pages. `check:operating-mode` PASS. `check:dead` 0 orphans. `check:exports` 0. `check:deps` pass. `check:api-schutz` pass. `check:schema-bezug` pass, with the four pre-existing LOCAL/UNAPPLIED RPCs above. `git diff --check` pass on the implementation commit. This documentation commit is checked again before push.

`origin/main` at delivery is `5a7634d01fd4941a390b8844699c24813d114f6f`. This branch is 0 behind that commit. Machine mode is `NORMAL`. `.jetnity/operating-mode.json` was not edited.

## Recommendation

Do not register a source extractor next. The missing piece for composed quality is a code-owned composition policy. Until that exists, the live path correctly refuses `composed_from_multiple_primary_sources` before HTTP. A later route must not call this entry until it has its own auth, ownership, and rate limit; the retrieval limits from #777 are not a quota.

Independent Technical-Lead review of the exact branch tip. Cursor does not Ready or merge.
