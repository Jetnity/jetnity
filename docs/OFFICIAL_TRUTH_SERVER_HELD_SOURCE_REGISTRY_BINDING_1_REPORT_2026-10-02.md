# Official Truth Server-Held Source Registry Binding 1 — Report

Date: 2 October 2026
Issue: #753
Source audit: merged #749 / F1
Draft PR: #755
Branch: `fix/official-truth-server-held-registry-1`
Baseline: `main@ee1d2d32ab50c978f75e6a45f99de5ac551a2b9d`
Implementation commits: `041ca48258b6172ea446d1dc20b5312af7d99550`, `0951e8c92a8bfc88514e959dabfe3f7f47cf5836`
Logical agent: **Jetnity Official Truth server-held source registry binding 1**
Generation: **1**
Session: https://cursor.com/agents/bc-3bb8f60f-0134-4a1e-a81c-35412d0b8a2c
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review of the branch tip. This report is not Ready and not a merge.

## Result

The future live and autonomous Official Truth path has one server-held registry entry:

`OFFICIAL_TRUTH_LIVE_AUTONOMOUS_ENTRY = 'server_held_source_registry'`

in `lib/readiness/official-truth-server-held-source-registry.ts`.

A caller registry, `sourceClass`, `domains`, or `blockedDomains` cannot establish `official_authority` on that entry. The registry inserted into the existing retrieval, accepted-evidence, rule-candidate, and review-packet functions is the object returned by `quellenKatalogLesen()`. Tests use an injected `OfficialTruthSourceCatalogTransport`. They do not open a network connection and they do not construct a Supabase client.

F1 is closed for that live entry. It is not closed inside the existing pure functions. Those functions still accept a caller-shaped registry so deterministic tests can keep running. The new contract says a live or autonomous path must not call them as the authority boundary. The adversarial test shows the pure retrieval function still accepts `https://www.not-a-government.example/rules` when the caller builds the registry, and the server entry rejects that same attack.

## What the boundary does

1. The caller envelope for retrieval and acceptance has the exact keys `request`, `descriptors`, `sourceId`, and `material`. It has no `registry` field.
2. The review-packet caller has `supports` and `metadata`. Each support has `umschlag`, `uhr`, and `extraktion`. The inner envelope uses the same registry-free keys.
3. The rule-candidate caller is `(evidenceVersions, metadata)`. It has no registry parameter.
4. `registry`, `sourceClass`, `domains`, and `blockedDomains` on the caller envelope, the request, the material, a descriptor object, the metadata, the extraction, or the dependency argument return `caller_authority_forbidden` before any catalog call.
5. A well-formed call loads the catalog once through `quellenKatalogLesen`. A review packet with several supports still loads once and inserts that same registry into every internal envelope.
6. `catalog_not_configured` and `catalog_failed` fail closed. An invalid stored catalog, including overlapping domains, stays `catalog_failed`. The gateway's `quellenRegistryErstellen` remains the only registry builder. This module does not call it again.
7. A source present in the injected catalog still has to pass the existing router and URL rules. `real-government.example` is accepted. `not-a-government.example` is `unregistered_domain` when the descriptors match the real catalog, and `invalid_source_plan` when the descriptor itself is the fake source.
8. An unknown source id is `source_not_eligible`.
9. A licensed provider that matches the catalog stays `source_not_official_authority`. Relabeling that descriptor as `official_authority` is `invalid_source_plan`. It does not become official.
10. The module does not call `quelleRegistrieren` and does not send `register_source`.
11. Swiss and Serbian passport options keep distinct `ruleScopeKey` values. One review packet that mixes both is `scope_mismatch`.
12. `requirementsProviderAus()` remains `null`.

The downstream proof uses the trusted registry. The success tests deep-compare the server result with a direct call of the existing pure function that receives only the registry `quellenKatalogLesen` built from the same injected rows.

## Out of scope, unchanged

Not changed, and not claimed as fixed:

- refresh URL equality (F3)
- validity, freshness, and fingerprint coverage (F5 / F7)
- review-suggestion consistency (F6)
- acceptance endpoint or store wiring (F8)
- break-glass and live route guard (F9)
- snapshot retention (F4)
- #626
- #741

No migration, no Development or Production apply, no RLS or Auth change, no API route, no Server Action, no trusted Rule write, no provider or model call, no secret change, and no new cost.

`check:schema-bezug` still lists the same three LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`. This slice adds none.

## Validation

Re-run on the tree at `0951e8c92a8bfc88514e959dabfe3f7f47cf5836`, before this documentation commit. `origin/main` was re-fetched and was still `ee1d2d32ab50c978f75e6a45f99de5ac551a2b9d`. This branch was 0 behind that SHA.

- Focused adversarial file: 9 tests, 9 pass, 0 fail.
- `npm test`: 4425 pass, 0 fail, 760 suites.
- `npm run typecheck`: pass (`next typegen` and `tsc --noEmit`).
- `npm run lint`: 0 errors, 148 pre-existing warnings.
- `npm run build`: pass. Next.js 16.3.8. Compiled successfully. 25 static pages.
- `git diff --check`: pass on the implementation tree.
- `check:operating-mode`: PASS.
- `check:dead`: 0 unreached files.
- `check:exports`: 0 uncalled exports.
- `check:deps`: pass.
- `check:api-schutz`: 12 admin routes, all use `requireAdminApi()`.
- `check:schema-bezug`: pass, three LOCAL/UNAPPLIED RPCs, no new RPC.
- No remote Supabase call.

The full suite includes the existing throwaway PostgreSQL proofs for the catalog gateway and the trusted store. Local PostgreSQL 16.15 was installed in this environment so those proofs could run. `policy-rc.d` denied starting the package cluster. The tests create and delete their own clusters. Development and Production were not contacted.

Exact-head GitHub CI, Auth, and Vercel Preview exist only after the push of the branch tip. This report does not invent those ids.

## Traveller context

One call remains one regulatory cell. A second citizenship relation or a second travel document remains another `ruleScopeKey`. The server boundary does not merge them and does not invent a visa, transit, health, carrier, eligibility, or document rule. The fake-host rejection applies per cell: a caller-labeled domain does not become official for one credential option.

## Disclosed limits

1. The pure functions still accept a caller registry. That is intentional. A later #741 gate that calls `officialTruthAbgerufenMaterialPruefen`, `officialTruthAkzeptierteEvidenceAusAbruf`, `officialTruthRegelKandidatAusEvidence`, or `officialTruthRegelReviewPacket` with a caller registry reopens F1. The live entry is `OFFICIAL_TRUTH_LIVE_AUTONOMOUS_ENTRY`.
2. Nothing under `app/` calls the new module. There is no route. The boundary fail-closes with `catalog_not_configured` until a later slice supplies the dormant gateway's environment, and that later slice is not authorized here.
3. Applying `official_truth_source_catalog_v1` remains a separate Product-Owner database gate. This slice does not request that apply.
4. The catalog reader still returns `blockedDomains: []`. A caller `blockedDomains` field is rejected. This slice does not add a blocked-domain table.
5. Descriptor `source` objects must still equal the catalog row exactly. `quellenRouten` performs that comparison. A mismatched class or domain is `invalid_source_plan`. The descriptor is not a second registry.
6. A personal-data key nested inside an otherwise exact request, material, metadata, or extraction object is classified by the existing scanner after the catalog read. An unexpected top-level key is `invalid_envelope` or `unexpected_fields` before the catalog read. Neither result echoes the value.
7. Each public function reads the catalog once per call. There is no process-wide cache. The review packet is the call that covers retrieval, acceptance, and the rule candidate with one read.
