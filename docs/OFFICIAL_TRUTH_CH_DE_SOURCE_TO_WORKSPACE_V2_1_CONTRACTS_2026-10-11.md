# CH→DE Source-to-Workspace V2.1 — Contracts

**PARTIAL / GATED.** Existing Draft #928, Issue #927. TASK blob `d590a9769915ba1cbb6bb3cab8c401f0dac70460`. No accepted German source, positive accepted reader or user visa result is delivered. This is the separable negative/read-interface path expressly allowed by SW07/SW08/SW15/SW21.

## Actual dependency path and missing primitives

References below are repository-relative, verified against the author code. Unchanged foundation references resolve at main `fcab99dd96e23749dd2624ad5cbe4c2749b127e1`.

| Step | Existing function / location | Binding constraint |
|---|---|---|
| Source/profile | `lib/readiness/official-truth-content-identity.ts:80`, `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` | Only GOV.UK profile; no approved Bern/AA profile. Candidate labels cannot confer authority. |
| Complete response | `lib/readiness/official-truth-ch-de-source-budget-128k-1.ts:50`, `officialTruthChDeSourceBudget128k1`; protocol check at line 96 | 65,536-byte default; 131,072 only for exact genuinely compiled/current S3 identity. No added HTTP client, registry row or bypass. |
| Accepted writes | `lib/readiness/official-truth-store-server.ts:377`, `akzeptierteEvidenceSpeichern`; line 424, `akzeptierteRegelClaimSpeichern` | Writer re-proof does not create a read capability. |
| SQL accepted store | `supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql:97` and `:263` | Operations are accepted Evidence/Rule writes, not `read_accepted`, `read_registry`, or `read_rule_history`. |
| V2 custody lifetime | `supabase/migrations/20261010180000_official_truth_source_fingerprint_protocol_2.sql:137` | Transaction receipt consumed at insertion; full source input is not a retained, reader-accessible whole-custody history. Profile/receipt tables explicitly revoke client and service access at lines 44/66. |
| Local provenance proof | `scripts/db/official-truth-integrated-pilot-1/storage.ts:131`, `readVerifiedIntegratedBundleLocally` | Existing repeatable-read local bundle verification is useful infrastructure; its developer schema/profile is not the accepted Evidence/Rule store or a production current-revocation/review reader. |
| Scope | `types/trips.ts:135`; `lib/readiness/provider.ts:42`, `RequirementsAnfrage` | Generic passport only; no ordinary subtype, purpose, explicitly selected option or complete direct-route assertion. A list of transit countries cannot prove completeness. |
| Negative interface | `lib/readiness/official-truth-ch-de-first-visa-vertical-1/read-request.ts`, `chDeVisaReadRequestPruefen`; `adapter.ts`, `chDeVisaReadForTrip` | New bounded request checks; every return has null provider/Evidence/Rule. Passing prerequisites is not eligibility. |
| Canonical evaluation | `lib/readiness/trip-official-evaluations-server.ts:10` → `lib/readiness/engine.ts:721`, `requirementsFuerReise` | Existing canonical engine retained; `provider.ts:99` remains null; `zustand.ts:41` retains the hard-off. |
| Account Workspace | `app/(public)/reisen/[tripId]/page.tsx:81`; `lib/trips/daten.ts:200`, `reiseLaden` | Existing authenticated/RLS trip loading and presentation retained; no alternate browser or API admission path. |

One required positive path: **approved exact profile → protected complete-source retrieval → versioned Evidence/custody → accepted Rule/support/review → protected read plus current registry/revocation/effective-time re-proof → exact selected scope → existing Requirements engine → canonical OfficialEvaluation → existing Workspace**. It stops independently at the source profile, accepted-read contract, and Trip scope contracts. No one of these approvals substitutes for the others.

## Implemented negative request contract

The server-owned caller supplies the already Auth/RLS-loaded Trip and an untrusted lookup request containing exactly `travellerClientRef`, `credentialOptionRef`, `destinationCountryCode: DE`, `requirementType: visa`. The request supplies no account identity, credentials, approval, transport, provider, source, profile or evidence. Descriptor inspection avoids invoking getters and never recursively traverses foreign DTOs. The four string fields are individually bounded before strict parsing; refs use ASCII identity characters and lengths 64/129. No JSON canonicalization or custody-foundation consumer is introduced.

Work bounds: 1–32 travellers, at most 32 citizenship/document entries for the selected traveller, 1–64 stages. Overflow rejects without truncation. Duplicate traveller/document/citizenship refs reject. Selection must match the canonical `credentialOptionsAus` option for that exact traveller and an explicitly linked CH citizenship/CH-issued passport. Residence and issuer alone never establish nationality. Dates must be real calendar dates in the supported 2000–2099 interval, with end >= start; every stage must explicitly be DE. These checks establish only representable prerequisites. They do not establish ordinary class, document validity, purpose, direct route, source/legal scope or visa eligibility.

The default `chDeVisaReadBoundary()` remains compatible and ignores arguments. `chDeVisaReadForTrip()` adds deterministic scope refusal reasons and always returns a frozen `unavailable` boundary with null authority-bearing outputs. No environment variable or configured secret changes this. The interface deliberately has no success variant pending arbitration.

## Local integration and proof contract

`scripts/official-truth-ch-de-first-visa-vertical-1/workspace-refusal.ts` runs the null reader projection through `requirementsProviderNachZustand` and the existing `requirementsFuerReise`, and independently runs `tripOfficialEvaluationsAuswerten`. Tests require both arrays to match, with unknown results and no official source/action/check timestamp. Existing Preparation checklist and Destination Essentials projections are exercised. No runtime page imports this developer harness.

`accepted-read-proof.ts` accepts no DSN or fixtures from callers. It creates a disposable native PG16 cluster, applies the six existing migrations in the minimal accepted-store/V2 chain, and verifies SQLSTATE 42501 for private Evidence/Rule/support/receipt SELECT by anon, authenticated and service_role, plus 22023 for unsupported read operations on the writer RPC. All source-profile/Evidence/Rule/receipt counts remain zero. No synthetic accepted identity is invented. Result `REFUSAL_VERIFIED` is diagnostic only; supplying it to the adapter is rejected. Positive acceptance/read/projection is **NOT_VERIFIED**.

The focused SQL fixture is not a complete hosted schema rehearsal: the separate Owner-role/AAL2 and catalog-hardening migration regressions remain in the existing full suite. This does not replace an Auth/RLS integration test: the new function is dormant and its Trip argument is a trusted-server precondition. Existing account/RLS regression tests remain responsible for loading. The new tests establish reference isolation and inability to inject authority, not real stale/revoked Rule processing. The latter cannot be claimed until the protected read primitive exists.

## Exact contract arbitration

1. **TL + PO / scope:** Decide how the authenticated canonical Trip records selected traveller+credential, ordinary passport subclass, purpose, complete direct-route facts and supported travel interval without inferring them. Any shared types/ownership/scope changes require an explicit amendment. Client booleans in this adapter are not an acceptable substitute.
2. **TL / accepted read:** Specify the least-privilege, bounded server read primitive for accepted Evidence/Rule/support plus retained full versioned custody, signed review/history, current source registry, expiry/effective-time and current revocation/conflict state. Require a consistent read and post-COMMIT acknowledgement proof. Decide whether existing local storage can be reused without treating its profile as regulatory authority. No direct SELECT grant or new SQL migration is authorized by this task.
3. **PO / source/legal/privacy:** See the separate finite source and Owner packet. Source research is not approval. Gates stay closed even after a code-only merge.
