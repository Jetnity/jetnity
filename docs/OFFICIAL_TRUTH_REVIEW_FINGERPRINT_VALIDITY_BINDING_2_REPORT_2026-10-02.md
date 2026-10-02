# Official Truth Review Fingerprint Validity Binding 2 — Report

Date: 2 October 2026
Issue: #758
Draft PR: #759
Branch: `fix/official-truth-review-fingerprint-validity-2`
Baseline: `main@e0b1056a096058b939e5adf8ac5d88d6e239b565`
Implementation commit: `3ced59280b370eafcc1777f87a6f57d1092b4dda`
Task seed: `bd456f966a8029d2405b51ea8462496ace1fef77`

Logical agent: **Jetnity Official Truth review fingerprint validity binding 2**, Generation 1
Session: https://cursor.com/agents/bc-4d2881ca-f3a5-4ab7-895f-1918425bde61
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This report records the delivery. It is not a Technical-Lead PASS and it is not merge approval.

## Status

Partly finished as a Draft implementation. The fingerprint contract is implemented and locally gated. Independent exact-head review has not happened. Ready and merge were not set.

## Umgesetzt

`officialTruthRegelReviewPacket` now copies `validFrom` and `validUntil` from re-proven accepted Evidence onto each support. It does not copy `extractionNote`.

`officialTruthRegelReviewPacketFingerprint` still rebuilds that packet and still refuses a caller packet, hash or key. The canonical object is version `2`. The returned key is `review-packet:v2:` plus SHA-256 of the candidate cell and the sorted support provenance. Provenance now includes the accepted validity window. The prefix `review-packet:v1:` is not accepted as the same key.

The key remains a checksum. It is not authentication, authorization, reviewer identity, AAL, a capability, a grant, a server witness, acceptance, or Official Truth.

Suggestion and decision-intent runtime files were not edited. They already recompute this fingerprint function. Their tests now require the v2 prefix. A v1 string that reuses the v2 digest does not match.

## Dateien

- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-rule-review-packet.test.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`
- `lib/readiness/official-truth-rule-review-decision-intent.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- this report, the handoff, and the self-review

Unchanged runtime: `lib/readiness/official-truth-review-suggestion.ts` and `lib/readiness/official-truth-rule-review-decision-intent.ts`.

`docs/ACTIVE_WORK_STATUS.md` was not edited. The task forbids global startup and Guardian current-state files in this lane.

## Datenbank

No migration. No apply. No Supabase call. No RLS, Auth, role, or capability change.

`check:schema-bezug` still lists the same three LOCAL/UNAPPLIED RPCs: `admin_account_counts_v1`, `official_truth_source_catalog_v1`, and `official_truth_store_accepted_v1`. This slice added none.

## Tests

Focused packet, fingerprint, suggestion, and decision-intent files: 45 pass / 0 fail.

Full `npm test` on the implementation tree, after a local PostgreSQL 16.15 install: 4431 pass / 0 fail, 760 suites.

The first full run, before `initdb` existed, failed only the two existing throwaway proofs:

- `lib/readiness/official-truth-source-catalog-server.test.ts`
- `lib/readiness/official-truth-store-server.test.ts`

Both failed with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. After installing PostgreSQL 16.15 locally, the same suite passed. The package created a local cluster and `policy-rc.d` denied starting it. The proofs use their own temporary clusters. No remote database was contacted. This slice did not apply SQL.

## Build

`npm run typecheck` passed.
`npm run lint` passed with 0 errors and 148 pre-existing warnings. None are in the files this slice edited.
`npm run build` passed.
`git diff --check` passed.
`check:operating-mode` passed.
`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` passed.

## Security

The fingerprint still recomputes #723 and does not trust a caller key. Validity values are the accepted Evidence values, not raw extraction bytes that failed acceptance. `extractionNote` is outside the checksum and outside the fingerprint output. A matching v2 comparison in decision intent still returns only the decision intent. It does not call `regelKandidatAkzeptieren` and it does not call the store.

`requirementsProviderAus()` remains `null`.

## Kosten

No new provider, model, network call, secret, or running cost.

## Offene Punkte

Independent Technical-Lead exact-head review of the pushed tip. GitHub CI, the Auth job, and Vercel Preview exist only for that tip. This report does not invent run ids.

#749 findings other than F5 remain outside this slice. #741 is not implemented. #626 was not touched.

## Risiken

Support `versionId` is still derived from source, URL, content hash, and retrieval time. A validity-only change keeps that version id and changes the v2 key. That is the intended split. A later reader that treats the version id as the whole evidence identity would miss the window. The fingerprint is the check for the window.

The existing validity reader does not collapse a date-only value and a UTC instant of the same calendar day into one string. This slice does not add a second normalizer. Those two accepted strings remain different keys.

`extractionNote` can still exist on accepted Evidence and on the dormant store path. It is excluded here only from the review packet support and from the review fingerprint.

## Empfehlung

Stop. Independent Technical-Lead review of the exact pushed head. Cursor does not Ready, does not merge, and does not start F2, F4, F6, F7, F8, F9, or #741.
