# Official Truth Decoded Regulatory Scope Binding 1 — Self-Review

Date: 3 October 2026
Issue: #786
Draft PR: #787
Branch: `feat/official-truth-decoded-regulatory-scope-binding-1`
Implementation commits: `fceef6407c881f8abdad6242c9925d18d82bff9d`, `1e3e0d226fc0dec1e15b1fa4f6413b0459b6e27e`
Logical agent: **Jetnity Official Truth decoded regulatory scope binding 1**
Generation: **1**
Session: https://cursor.com/agents/bc-fb543348-7c62-40c6-b551-7ad6deb8ee6b
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

Author self-review only. This is not an independent Technical-Lead PASS. The review head is the branch tip that contains this file. Re-fetch it. `fceef640` and `1e3e0d22` are the implementation commits and are not the review head.

## What I checked against the task

| Requirement | Result |
| --- | --- |
| Decoded scope is the source-neutral `RegelScope` | Extractor context carries destination, transit, citizenship, credential option, residence, requirement type, and validity. No `sourceId`. |
| Existing `regelScopeAusEvidenceScope` only | No second parser and no second key function. `rule-claims.ts` was not edited. |
| Recomputed key must match `scopeKey` | Mismatch returns the existing `scope_mismatch` reason before `match` / `extract`. |
| Top-level requirement type equals scope requirement type | Mismatch returns `requirement_type_mismatch` before the matcher. |
| `sourceId`, extra keys, and personal keys are rejected | `unexpected_fields` or `personal_identifier_forbidden`. Malformed country, document, and date values return `invalid_scope`. |
| Canonical frozen copy reaches the matcher | `structuredClone` plus the existing deep freeze. Mutating the input during `match` does not change the fact. |
| Same-request scope comes only from the proof | `proof.kandidat.scope` is re-validated. Every accepted Evidence version must share that key. A caller `scope` field is not read. |
| Cell mismatch and `ruleScopeKey` mismatch block before HTTP | Both return `scope_mismatch` with zero retrieval calls. |
| Production registry stays empty | `Object.freeze([])`. Live path still ends `extractor_not_registered` after trust checks. |
| Importer guard | Outside tests, `officialTruthTrustedFactExtrahieren` appears only in the registry module and the same-request extraction module. The test seam appears only in the registry module. No `app/` import. |
| Synthetic date proof only | The fixed date is inside a synthetic snapshot. The travel date is read only from `scope.validity`. No real source parser. |
| No acceptance, store, migration, provider, CH import, #626, or F8 | Source assertions and the diff. |

## Findings I am not hiding

1. `scope_mismatch` was already a `RegelClaimFehler`. I reused it. I did not add a second copy to the framework reason list. The extractor result type already allows it.

2. A decoded scope must have exactly the seven source-neutral keys. A missing `validity` key is `unexpected_fields`, not `invalid_scope`. A present but impossible date is `invalid_scope`. Both stop before the matcher.

3. The candidate requirement-type check on the proof path compares the raw candidate type with the canonical type. The existing parser does not rewrite a valid requirement type, so that branch is defensive. The tested mismatch is the extractor's top-level requirement type against `scope.requirementType`. Changing only the candidate type also changes the scope key, so the proof path reports `scope_mismatch` first.

4. Evidence version-id mismatch is still detected after that support's fresh retrieval. Regulatory cell mismatch is before HTTP. I did not move the version-id check earlier, because the existing binding test proves one HTTP read and then `support_binding_mismatch` without calling the extractor. The live proof cannot build that lie.

5. After the scope check, the composition freezes a clone of the proof before retrieval. The returned material uses that clone. A test-injected mutable proof can still be mutated by the test extractor, and that mutation no longer changes `ruleScopeKey` or the candidate on the result. The live proof loader already freezes its own object. This is a second copy, not a new authority.

6. A well-formed explicit-primary live call still performs one HTTPS retrieval and then returns `extractor_not_registered`. Scope binding does not skip retrieval and does not register an extractor. Merge of this draft would not, by itself, add a route, but a later route that calls the live entry would fetch before learning that no extractor exists.

7. The date-qualified behavior exists only in a test definition. The production module does not contain the synthetic marker or the fixed date. Country codes in the fixtures are the ISO values already used by this readiness suite. They are cell data, not a source parser. No GOV.UK, ICA, or CH parser was added.

8. `docs/ACTIVE_WORK_STATUS.md` is stale relative to this writer. The task forbids that edit. This handoff and the report are the continuity record for the slice.

9. Local PostgreSQL 16.15 was installed so the two pre-existing throwaway proofs could run `initdb`. The package postinst also initialized a local `16/main` cluster, and `policy-rc.d` denied the service start. The proofs used temporary clusters. No remote database was contacted and nothing was applied. The four LOCAL/UNAPPLIED RPCs are unchanged.

10. There is still no server-held composition policy. Composed quality still returns `composition_policy_unavailable` before HTTP. I did not add a policy or a follow-up slice.

## Validation

Extractor tests 35/35. Same-request extraction tests 19/19. `npm test` 4580 pass / 0 fail / 767 suites. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Production build pass on Next.js 16.3.8 with 25 static pages. Operating-mode and hygiene gates pass. `origin/main` `4b3f7d932750d4c6f8a44234b4d7ba8c80f26b56`, 0 behind.

## Stop

No Ready. No merge. No source-specific extractor follow-up. The next step is independent Technical-Lead review of the exact branch tip.
