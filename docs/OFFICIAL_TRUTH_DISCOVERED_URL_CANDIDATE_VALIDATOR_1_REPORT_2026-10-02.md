# Official Truth Discovered URL Candidate Validator 1 — Report

Date: 2 October 2026
Issue: #710
Draft PR: #712
Branch: `feat/official-truth-discovered-url-candidate-validator-1`
Baseline: `main@3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`

Logical agent: **Jetnity Official Truth discovered URL candidate validator 1**, Generation 1
Session: https://cursor.com/agents/bc-692c8c38-0c4e-492a-9036-20995a39e70e
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. It is not a Technical-Lead PASS, not Ready, and not a merge.

## Result

`officialTruthEntdeckteUrlKandidatenPruefen` in `lib/readiness/official-truth-discovered-url-candidates.ts` answers one question: which proposed `{ sourceId, url }` pairs are allowed for this exact research request?

The function takes one envelope: `request`, `registry`, `descriptors`, `candidates`. It calls `officialTruthRechercheAusfuehrungsplan(request, registry, descriptors)` again. A caller-built plan is not a parameter. An extra `plan` field fails as `invalid_envelope`.

A pair can be returned only when all of these hold:

- the re-run plan is `ready`;
- `sourceId` is on that plan;
- the registry row for that id is `official_authority`;
- `quellenUrlAufloesen` accepts the URL and returns that same source id;
- the resolved host is covered by that source's #708 hostname list, and the resolved registry domain is a member of that same list;
- the original URL and the canonical URL have no tracking-only query name.

Success is `validated_url_candidates`. Each item is `sourceId` and `canonicalUrl`. The list is sorted by source id, then by canonical URL. That order is stability. The result has no score, rank, preference, default source, publisher name, or authority name.

`blocked` is status and reason only. The reason does not copy the URL, a credential, a tracking value, a personal value, or a source id.

The function does not search, fetch, or store.

## What landed

- A licensed provider id on a ready mixed plan is `licensed_provider`. A licensed-only registry is `no_eligible_official_source`, because #708 is not `ready`.
- An official id that #708 left off the plan is `source_not_in_plan`.
- A URL that resolves to another registered source is `another_source_url`. The function does not rewrite the pair onto the resolved source.
- Unregistered, blocked, local, insecure, and credential URLs keep the existing `quellenUrlAufloesen` reasons: `unregistered_domain`, `blocked_domain`, `invalid_url`, `insecure_scheme`, `credentials`.
- Tracking names, case-insensitive, are `utm_*`, `gclid`, `dclid`, `fbclid`, `msclkid`, `gbraid`, `wbraid`, `mc_cid`, `mc_eid`. The URL is rejected whole. `lang` and `ref` stay on the canonical URL.
- The same canonical URL for the same source, including a second spelling that canonicalizes to it, is `duplicate_canonical_url`.
- Sixteen pairs can pass. Seventeen is `too_many_candidates`.
- A tampered request, registry, or descriptor fails with the #708 reason: `invalid_request`, `scope_mismatch`, or `invalid_source_plan`.
- Personal and free-text keys fail as `sensitive_personal_field` before any URL is returned.
- A ready plan with an empty candidate list returns an empty validated list. Zero is inside the bound. It is not an entry effect.

## Traveller context

One call is one regulatory cell: the credential option and citizenship set already on the #702 request. A Swiss passport cell does not receive a URL validated for a Serbian passport cell. Another issuing country, another citizenship set, another destination, another transit country, or another residence is another request. This function does not rank those options and does not invent a visa, transit, health, carrier, or document rule. No URL is treated as Official Truth. The function stores no passport number, MRZ, scan, biometric, birth date, health record, name, email, or account id.

## Boundaries kept

- No edit to the #702 runtime, the #705 runtime, the #708 runtime, `source-router.ts`, `source-registry.ts`, the retrieved-material receipt, the candidate-batch validator, `provider.ts`, `engine.ts`, Supabase, the source catalog, or global continuity.
- No database, network, provider, OpenAI, browser, cron, queue, UI, or public API.
- No Candidate Evidence, no `evidenceKandidatAkzeptieren`, no `regelKandidatAkzeptieren`, no `official_truth_store_accepted_v1`, no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

`git fetch origin main` in this session resolved `origin/main` to `3f4b1bfd5fe545c36fdc689cb0c6204b4287c403`. Merge-base is that SHA. The gated implementation head `f9fac315719817a502f1e576ed5c098ab42fe1ea` was 0 behind. Re-fetch before treating any later SHA as current.

The first full `npm test` on that head reported 4320 pass / 2 fail. Both failures were `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in the existing throwaway gateway proofs. This agent environment then installed PostgreSQL 16 locally. That install is not a repository change. The clean re-run is the row below.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-discovered-url-candidates.test.ts` | 13/13 pass |
| `npm test` | 4322 pass / 0 fail, 750 suites |
| `npm run typecheck` | pass |
| eslint on the two slice files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the slice files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

The review head is the branch tip after the documentation commit on `f9fac315`. That commit is documentation only. These gates cover the runtime diff.

## Stop

No Ready. No merge. No discovery. No fetch. No follow-up slice.

**STOP for independent Technical-Lead review of the exact branch tip.**
