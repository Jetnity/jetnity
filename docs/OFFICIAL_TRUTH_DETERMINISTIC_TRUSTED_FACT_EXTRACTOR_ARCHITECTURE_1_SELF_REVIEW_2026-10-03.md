# Official Truth Deterministic Trusted-Fact Extractor Architecture 1 — Self-Review

Date: 3 October 2026
Issue: #773
Draft PR: #775
Branch: `docs/official-truth-deterministic-trusted-fact-extractor-architecture-1`
Baseline: `main@a7ad77743327c01821cf2532ca253a3220c857e8`
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor architecture 1**, Generation 1
Session: https://cursor.com/agents/bc-e12b4f3e-b7f1-4b49-bc0d-54e57b90ff7a
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This self-review is the author check. It is not an independent Technical-Lead PASS. It does not mark Ready and it does not merge.

## Scope check

The binding task allows only:

- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_DETERMINISTIC_TRUSTED_FACT_EXTRACTOR_ARCHITECTURE_1_SELF_REVIEW_2026-10-03.md`

No `lib/`, `app/`, `components/`, `types/`, `hooks/`, `supabase/`, test, migration, `package.json`, or global current-state file was edited. The task file was not edited. `docs/ACTIVE_WORK_STATUS.md` was not edited. The workspace had a dirty `next-env.d.ts` before this architecture. It stays unstaged.

The task seed `39eb137e94c27085d0b954bfbe59e31a3510ce3c` already added the task file. That file is the only other difference from `origin/main`, and it was not modified in this session.

## What I specified

| Area | Decision |
| --- | --- |
| Registry | One immutable `(extractorId, extractorVersion)` per fact kind and source family. Server selection only. Zero or two matches fail closed. |
| Input | Same-request proof object with snapshot and hash. No proposal, model, suggestion, caller fact, extraction note, or validity window. |
| Output | Complete `RegelFakt` or a closed reason. No partial fact. Not acceptance. |
| Prose | General regex or model reading is `representation_not_eligible`. Narrow prose only with a pinned label skeleton. |
| Drift | Missing structure, changed headings, conflicts, unknown units, moved domains, and hash mismatch fail closed. |
| Eight kinds | Field lists match the current parsers. No legal value is chosen. |
| First runtime | `EXTRACTOR_FRAMEWORK_FIRST`. No source family was invented. `blank_passport_pages` is not the first extractor. |
| Provenance | Support ids are necessary and not sufficient. A later provenance record is required before autonomous persistence. No Production migration is required by this slice. |
| CH-01..CH-10 | Preserved as Candidate Evidence for the 64 destinations in comment `5935531376`. Not imported. CH-11 is not planned. |

## Claims I refused to upgrade

- I did not treat the human fact-entry path as closed. It remains the only authorized `trustedRuleFact` entry until a later reviewed implementation of this contract exists.
- I did not treat extractor success as acceptance. `regelKandidatAkzeptieren` stays the only constructor.
- I did not treat `blank_passport_pages` as the first extractor because its schema is small.
- I did not select the GOV.UK Content API, Sherpa, or Timatic as a source family. The Content API note is public diligence with a British-citizen example scope. Sherpa and Timatic stay licensed-provider candidates, not `official_authority`.
- I did not convert CH research YAML qualifiers, hour units, empty airport arrays, or plural arrival modes into a `RegelFakt`.
- I did not treat support version ids plus a deploy SHA as enough provenance for an autonomous claim.
- I did not add a migration, and I did not describe a Production schema change as part of this slice. The provenance record is a later slice, and Production apply stays a Product-Owner gate.
- I did not certify `npm test`, typecheck, lint, or the production build. Runtime bytes are the baseline.
- I did not query Production or Development. The zero-row note in comment `5935581800` stays historical.
- I did not start F8, a framework runtime, a source extractor, or a CH import.

## Validation

Run on this docs tree before the architecture commit:

- `git fetch origin main` → `a7ad77743327c01821cf2532ca253a3220c857e8`
- `git rev-list --left-right --count HEAD...origin/main` → `1 0` (the task seed ahead, zero behind)
- `git diff --check` on the architecture documents → pass, no whitespace errors
- `node scripts/operating-mode-guard.mjs` → `operating-mode guard: PASS`

`npm test`, typecheck, lint and the production build were not run. The runtime bytes are the baseline. I do not claim those gates.

## Stop

Stay Draft. Stop for independent Technical-Lead exact-head review. Do not Ready, merge, or open a remediation branch from this session.
