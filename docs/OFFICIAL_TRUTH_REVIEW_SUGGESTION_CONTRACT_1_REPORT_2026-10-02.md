# Official Truth Non-Authoritative Review Suggestion Contract 1 — Report

Date: 2 October 2026
Issue: #728
Draft PR: #730
Branch: `feat/official-truth-review-suggestion-contract-1`
Baseline: `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`

Logical agent: **Jetnity Official Truth non-authoritative review suggestion contract 1**, Generation 1
Session: https://cursor.com/agents/bc-bb1255f3-36c2-41b1-907b-b23ef08cbf04
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report is the author record. A Technical-Lead PASS requires an independent exact-head review. This report is not Ready and not a merge.

## R1

Technical-Lead review `5390889237` is CHANGES REQUIRED on the previous tip. The finding is R1-F1 only. The packet binding, assessment enum, reason codes, citation binding, non-authoritative semantics, and the no-acceptance/no-model/no-DB boundaries stay as accepted there.

R1-F1 removes free-form `reviewNote`. Keyword checks on a 500-character string are not a sufficient privacy boundary. V1 keeps the suggestion fully machine-readable: `assessment`, `citedSupportVersionIds`, and `reasonCodes`. There is no replacement free-text field. `reviewNote: null` is an extra field and fails closed. A free-text value cannot enter the result.

## Result

`officialTruthRegelReviewVorschlag` in `lib/readiness/official-truth-review-suggestion.ts` validates one reviewer suggestion against one re-proven #723 Rule Review Packet and its #726 fingerprint.

The suggestion stays advisory. `supports_candidate` does not mean the candidate is true. The function does not mint `trustedRuleFact`, does not accept a Rule Claim, and does not return a fact.

Input is exactly:

- `packetInput`: the original `{ supports, metadata }` accepted by #723;
- `suggestion`: `assessment`, `citedSupportVersionIds`, and `reasonCodes` only.

The function:

1. rejects personal or sensitive keys anywhere in that input, and rejects a tree deeper than 16 levels;
2. rejects every other top-level field, including a caller packet, fingerprint, `reviewPacketKey`, `ruleScopeKey`, support-id list, or `trustedRuleFact`;
3. re-runs #723 `officialTruthRegelReviewPacket` on `packetInput`;
4. re-runs #726 `officialTruthRegelReviewPacketFingerprint` on that same `packetInput`;
5. requires both to succeed and to agree on `ruleScopeKey` and the sorted support version ids;
6. accepts only the four assessments and the seven reason codes named in the task;
7. requires every cited id to be a member of the re-proven packet, and fails closed on a duplicate citation or a duplicate reason code;
8. rejects any other suggestion field, including `reviewNote`, `null`, and any other free-text field.

Success is:

- `status: 'review_suggestion'`;
- `reviewPacketKey` from the re-run fingerprint;
- `ruleScopeKey` from that same fingerprint;
- `assessment`;
- sorted `citedSupportVersionIds`;
- sorted `reasonCodes`.

There is no snapshot, canonical URL, content hash, proposal object, rule fact, trusted fact, or acceptance result in that output. A blocked #723 result is returned as `{ status: 'blocked', reason }` with the packet reason. No suggestion key is attached to a failure, and the failure does not echo the rejected value.

The function does not read the page text to decide whether the assessment is correct. That judgment belongs to a later human or model reviewer. This slice only binds the suggestion to the re-proven packet and checks the closed schema.

## What landed

- A `supports_candidate` suggestion returns the same `reviewPacketKey` and `ruleScopeKey` as a direct #726 call on the same original input. The cited ids are the packet's sorted support version ids. The output keys are only the six success fields. The snapshot, the canonical URL, the content hash, and `electronic_visa` are absent. `requirementsProviderAus()` stays `null`.
- Two official supports in reverse order keep the same key. Citations and reason codes supplied in reverse order come back sorted.
- A cited id outside the packet fails `citation_not_in_packet`. A duplicate citation fails `duplicate_citation`. An empty citation string and a non-string citation fail `invalid_support`. A duplicate reason code fails `duplicate_reason_code`. Those failures do not contain the id, the key, or the snapshot.
- `accepted`, `trusted_rule_fact`, a padded assessment, an unknown reason code, and a missing reason-code field fail closed. The unknown code is not echoed.
- An empty citation list and an empty reason-code list still bind to the same key. They remain a review suggestion. A `research_gap` packet with a null proposal can carry `insufficient_evidence` and still does not become an accepted fact.
- Personal keys on the suggestion, inside metadata, and on the support shell fail closed. The secret and the key name are absent. A nested `passportNumber` fails `personal_identifier_forbidden`.
- A free-text field cannot enter the result. `reviewNote`, `summary`, `explanation`, `message`, and `annotation` fail `unexpected_fields`. `comment`, `note`, and `freeText` fail as personal keys. `reviewNote: null` fails `unexpected_fields`. The same personal-looking text inside `reasonCodes`, `citedSupportVersionIds`, or `assessment` fails the closed schema. The text, the passport-like token, the name, and the date are absent. The success output does not contain `reviewNote`.
- A caller packet, fingerprint, `reviewPacketKey`, `ruleScopeKey`, support-id list, `supports`, or `trustedRuleFact`, whether beside the input or inside the suggestion, fails closed. Using the built packet or the fingerprint as `packetInput` also fails. `null` fails. The real key, the content hash, the snapshot, and the trusted marker are absent.
- A Swiss passport option and a Serbian passport option, both with citizenship `CH` and `RS`, produce two keys. Citing the other cell's support id fails `citation_not_in_packet` without the id or the country codes. Passing both supports fails `scope_mismatch` without the country codes.
- The original input JSON is unchanged, including a frozen citation array supplied in reverse order.

## Traveller context

One suggestion is one regulatory cell. The cell keeps the full citizenship set on the re-proven candidate. In the synthetic fixture that set is `CH` and `RS`. The issuing country stays the credential option's issuing country. A second passport is a different rule-scope key and a different suggestion binding. This function does not choose a preferred passport, does not infer citizenship from the issuing country, and does not invent a visa, transit, health, carrier, or document rule. `research_gap` keeps a null proposal. No passport number, MRZ, scan, biometric, birth date, health record, name, email, account id, trip id, or traveller note is copied into the result. The public page text stays out of the output.

## Boundaries kept

- No edit to the #723 packet, the #726 fingerprint, `evidence.ts`, `digest.ts`, `rule-claims.ts`, the source registry, the source router, #709, #713, #716, #717, the store, or the source catalog.
- No database, network, provider, OpenAI, browser, UI, or public API.
- No call to rule acceptance. No trusted rule fact. No `official_truth_store_accepted_v1` and no `official_truth_source_catalog_v1`.
- `requirementsProviderAus()` stays `null`. This module does not call it.
- No runtime activation and no Production change.
- `docs/ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. They are outside the task allowlist. This report and the handoff are the continuity for the slice.

## Validation

R1 local gates were rerun on `1a1eca4945f467c7a2a1c1f106d4b5ccc8ba083d` before this docs commit. That commit removes `reviewNote`. `git fetch origin main` before the R1 docs commit resolved `origin/main` to `5e291ed7c4814f034224eda46c3bd62cc9815ea3`. Re-fetch before treating a later SHA as current. The earlier delivery gates on `c5480cd0` and `f3132973` are historical. They are not the R1 head.

This VM did not have PostgreSQL 16 when the session started. PostgreSQL 16.15 was installed from Ubuntu packages so the existing throwaway store proofs could run. Package setup initialized a local cluster. `policy-rc.d` denied starting it. The suite then created its own temporary clusters through `/usr/lib/postgresql/16/bin/initdb`. No remote database was contacted. This slice did not add or apply SQL. Development and Production were not touched.

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| operating-mode guard | PASS |
| `lib/readiness/official-truth-review-suggestion.test.ts` | 10/10 pass |
| `npm test` | 4391 pass / 0 fail, 757 suites |
| `npm run typecheck` | pass |
| eslint on the two suggestion files | pass, no warnings |
| `npm run lint` | pass, 0 errors, 148 pre-existing warnings, none in the suggestion files |
| `npm run build` | pass |
| `check:dead` | 0 orphans |
| `check:exports` | 0 unused exports |
| `check:deps` | pass |
| `check:api-schutz` | pass |
| `check:schema-bezug` | pass. It still lists the already known LOCAL/UNAPPLIED RPCs `admin_account_counts_v1`, `official_truth_store_accepted_v1` and `official_truth_source_catalog_v1`. This slice did not add an RPC. |

`auth:pruefen` was not run locally because it needs repository secrets.

## Exact-head gates

Read after the push, on `48339be1cf8d775d4187cf46321820e6af687409`. That SHA was still the branch tip. `origin/main` was still `5e291ed7c4814f034224eda46c3bd62cc9815ea3`. The branch was 0 behind.

| Gate | Result |
| --- | --- |
| GitHub CI `36997512207` | **SUCCESS**. Event `pull_request`. Head SHA `48339be1cf8d775d4187cf46321820e6af687409`. |
| Auth-Konfiguration gegen config.toml, job `110807512028` | **SUCCESS** |
| Typecheck, Lint & Build, job `110807511683` | **SUCCESS** |
| Vercel commit status | **success**. Deployment has completed. Inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/2bQY1eJUexSLy4JQdHxj34Zfh51q`. |
| GitHub deployment `6806732650` | Environment **Preview**, state **success**, same SHA. This is not a Production deployment and not a launch PASS. |

Do not copy a run id from `5e291ed7`, `c5480cd0`, `f3132973`, or `954aa554`. Those heads are not this tip.

## Stop

No Ready. No merge. No Rule acceptance. No model review. No store, RPC, DB, provider or network path.

**STOP for Technical-Lead R2 of the exact branch tip.**
