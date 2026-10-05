# Official Truth Review Fingerprint Validity Binding 2 — Self-Review

Date: 2 October 2026
Issue: #758
Draft PR: #759
Branch: `fix/official-truth-review-fingerprint-validity-2`

Logical agent: **Jetnity Official Truth review fingerprint validity binding 2**, Generation 1
Session: https://cursor.com/agents/bc-4d2881ca-f3a5-4ab7-895f-1918425bde61
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

Against `main@e0b1056a096058b939e5adf8ac5d88d6e239b565`, the branch contains the task seed plus:

- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-rule-review-packet.test.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.test.ts`
- `lib/readiness/official-truth-review-suggestion.test.ts`
- `lib/readiness/official-truth-rule-review-decision-intent.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_FINGERPRINT_VALIDITY_BINDING_2_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_FINGERPRINT_VALIDITY_BINDING_2_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_REVIEW_FINGERPRINT_VALIDITY_BINDING_2_SELF_REVIEW_2026-10-02.md`

`lib/readiness/official-truth-review-suggestion.ts` and `lib/readiness/official-truth-rule-review-decision-intent.ts` have no diff. They do not contain `review-packet:v1:` or `review-packet:v2:`. They call the one fingerprint function.

No second Evidence parser was added. The fingerprint does not call `gültigkeitszeitLesen`, the accepted-evidence bridge, retrieval, or rule acceptance. It reads the support values #723 already copied from accepted Evidence.

Historical #726 delivery documents were not rewritten. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Mandatory checks I saw pass

1. The same re-proven input returns the same `review-packet:v2:` key.
2. Changing only `validFrom` changes the key and keeps the support version id.
3. Changing only `validUntil` changes the key and keeps the support version id.
4. Null versus a date changes the key. Explicit null matches an omitted extraction window.
5. Padded `2026-06-15` and padded `2026-12-31T00:00:00.000Z` match the already trimmed accepted values and the same key. The support stores the trimmed accepted strings, not the raw padding.
6. Changing only `extractionNote` does not change the key.
7. The note text is absent from the fingerprint JSON and from the packet JSON.
8. A caller packet, caller key, caller hash, and caller trusted fact stay blocked. The real key is not echoed.
9. Reversed supports, including supports with different accepted windows, keep one key.
10. URL, retrieval time, source, content hash, proposal, fact kind, quality, and scope still change identity as before.
11. A raw invalid window and a reversed window block the packet. The raw invalid text is absent. The support does not carry a value that failed acceptance.
12. Suggestion and decision intent return the recomputed v2 key. Their runtime files do not hash on their own.
13. `review-packet:v1:` plus the v2 digest does not match and returns `review_packet_key_mismatch`.
14. A successful v2 comparison returns `rule_review_decision_intent` only. The result has no `accepted` lifecycle. The decision source does not call `regelKandidatAkzeptieren` or the store.
15. The fingerprint output keys stay `status`, `reviewPacketKey`, `ruleScopeKey`, and `supportVersionIds`. The fingerprint source does not add reviewer, AAL, capability, or grant fields.
16. `requirementsProviderAus()` is `null` in the focused tests.

## Boundary choices a reviewer should see

1. Validity is copied from `belegt.evidence.validFrom` and `belegt.evidence.validUntil` after the existing acceptance bridge. The fingerprint does not parse dates again.
2. `versionId` is unchanged. A validity-only edit therefore keeps the version id and changes the v2 key. Two supports that differ only by validity still cannot share one packet, because they would share one version id and #723 already rejects that duplicate.
3. Date-only `2026-12-31` and instant `2026-12-31T00:00:00.000Z` stay different if the existing reader accepts both. This slice does not invent a second equivalence rule.
4. `extractionNote` remains possible on accepted Evidence outside this fingerprint. It is absent from the review support on purpose. Putting it back would change the key and would violate F5.
5. The old v1 prefix is not aliased. The canonical object also carries `v: 2`, so the digest itself differs from a v1 digest of the same other bytes.
6. Suggestion and decision runtime did not need a code change. Their tests were updated because they hardcoded the v1 prefix. If a later reader finds a hardcoded v1 comparison outside these files, that is a follow-up, not this slice.
7. One key is still one regulatory cell. Citizenship order and a second credential option keep the existing behavior. Route Truth was not rebuilt.
8. No ADR was added. `DECISIONS.md` is outside this task's allowlist. The decision lives in the task, the architecture replacement, this review, and the report.

## Tests and gates

Focused files on this tree: 45/45 pass. Full `npm test`: 4431 pass / 0 fail, 760 suites. Typecheck, lint, production build, diff check, operating-mode guard, and the hygiene checks passed. Lint reports 0 errors and 148 pre-existing warnings, none in the edited files. Schema reference still lists the same three LOCAL/UNAPPLIED RPCs.

PostgreSQL 16.15 was installed locally because the first full run could not find `initdb`. The package cluster was not started. No remote database was contacted. This slice did not apply SQL.

## Stop line

The docs commit after `3ced59280b370eafcc1777f87a6f57d1092b4dda` is not a behavior change. GitHub CI, the Auth job, and Vercel Preview belong to the pushed tip after that commit. Do not reuse run ids from `3ced5928`. This remains a Draft. No Ready, no merge, and no follow-up from this writer.

**STOP for independent Technical-Lead exact-head review of the exact pushed tip.**
