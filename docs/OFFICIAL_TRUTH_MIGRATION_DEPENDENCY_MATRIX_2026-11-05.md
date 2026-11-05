# Official Truth Migration Dependency Matrix (Engineering V1)

Date: 2026-11-05  
Scope: repository-only dependency classification for existing Official-Truth migrations (no apply)

## Baseline used for this matrix

- Development: 80 registered migrations
- Production: 60 registered migrations
- Delta: 25 development-only, 5 production-only

This matrix reuses the already-verified baseline and focuses only on Official-Truth migration dependencies.

## Dependency matrix

| Migration | Depends on | Classification | Reasoning | Open verification |
|---|---|---|---|---|
| `20261001121258_official_truth_private_evidence_store_schema_1.sql` | none (Official-Truth chain root) | **PROD_REQUIRED_FOUNDATION** | Creates `private` evidence/source storage, forced RLS, revoked direct grants. | Independent Stage1 readback evidence in #917 remains required. |
| `20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql` | `...121258` | **PROD_REQUIRED_FOUNDATION** | Adds accepted rule-claim persistence schema and typed fact linkage on top of private evidence store. | Same #917 readback gate. |
| `20261001180549_official_truth_trusted_store_writer_1.sql` | `...121258`, `...151048` | **PROD_REQUIRED_FOUNDATION** | Adds trusted accepted-store writer RPC boundary (`official_truth_store_accepted_v1`). | Keep service-role-only EXECUTE and fail-closed behavior proven in local tests. |
| `20261001193748_official_truth_source_catalog_gateway_1.sql` | `...121258` | **PROD_REQUIRED_FOUNDATION** | Adds source catalog gateway RPC boundary (`official_truth_source_catalog_v1`). | Keep service-role-only EXECUTE and fail-closed behavior proven in local tests. |
| `20261002154952_official_truth_owner_reviewer_capability_1.sql` | pre-existing `hat_rolle_mindestens`, `aktuelles_admin_aal2` | **PROD_REQUIRED_FOUNDATION** | Adds owner+current-AAL2 capability `darf_official_truth_freigeben()`. | New synthetic local contract proof added in this slice. |
| `20261004010705_official_truth_content_identity_2.sql` | `...121258`, `...151048`, `...180549`, `...193748` | **PROD_REQUIRED_FOUNDATION** | Identity schema v2 cutover + v2 store/catalog RPCs + v1 wrappers fail closed (`0A000`). | Requires empty-cutover preconditions and replay plan evidence before hosted apply. |
| `20261004223959_official_truth_v2_catalog_hardening_1.sql` | `...04010705` | **PROD_REQUIRED_FOUNDATION** | Hardens v2 catalog identity pins and URL/domain authorization rules. | Keep inert profile-pin guard and no runtime writer authority drift. |
| `20261010180000_official_truth_source_fingerprint_protocol_2.sql` | `...04010705` | **PROD_GATED_EXTENSION** | Introduces protocol-2 fingerprint verification path and fingerprint RPC wrapper. | Requires explicit source-profile approval rows before any real-source use. |
| `20261011111839_official_truth_original_custody_lifecycle_1.sql` | integrated provenance/custody chain + `...10180000` | **LOCAL_DEV_ONLY_CURRENTLY** | Explicitly marked UNAPPLIED code-only candidate; lifecycle/read APIs for retained originals. | Needs dedicated owner gate and hosted rollout decision. |
| `20261013184409_official_truth_ch_de_application_pilot_1.sql` | trips/travellers schema + `darf_official_truth_freigeben()` | **LOCAL_DEV_ONLY_CURRENTLY** | CH→DE pilot persistence/grant RPCs; currently code-only/local-unapplied. | `applicationPilotAvailable()` and contract remain hard-off. |
| `20261023153726_official_truth_current_version_lookup_1.sql` | `official_original_*`, `official_provenance_*`, `...1111839` | **LOCAL_DEV_ONLY_CURRENTLY** | Current-version lookup API for retained accepted receipts; marked LOCAL/UNAPPLIED. | Needs hosted admission plan and lifecycle witness operating model. |

## Dependency order — distinct branches, not a blanket Production apply plan

**Core source/evidence store (conditional future Production foundation):**

1. `20261001121258` — private source/Evidence store.
2. `20261001151048` — accepted claims, after the private store.
3. `20261001180549` (trusted writer) and `20261001193748` (catalog) — after their individual prerequisites, not necessarily serially.
4. `20261004010705` (content identity V2) — after both gateway/writer and their supporting schemas; requires its own empty-cutover/replay evidence.
5. `20261004223959` (catalog hardening) — after the identity V2 change.
6. `20261010180000` (fingerprint protocol V2) — a separately gated extension, **not** implicit approval to fetch or store real sources.

**Independent reviewer / Application-Pilot branch:**

- `20261002154952` — `darf_official_truth_freigeben()` depends on the pre-existing real role and AAL2 helper chain. Its documented hosted Stage-1 readback is **blocked under #917**.
- `20261013184409` — CH→DE Application-Pilot depends on the existing Trip/Traveller schema, ownership/revision contracts and the **verified reviewer capability**. It does **not** depend on `20261011111839` and does not need retained originals merely for its scoped current-request-only pilot. Stage 2 is **NOT_ATTEMPTED**, runtime OFF.

**Separate retained-original / lookup branch (currently local/unapplied):**

- `20261011111839` — retained-original custody/lifecycle depends on the integrated provenance/custody chain and its stated protocol prerequisites; separately gated and synthetic-only.
- `20261023153726` — current-version lookup depends on the `official_original_*` and `official_provenance_*` objects, including the custody/lifecycle branch. It is not a prerequisite for the current-request-only CH→DE pilot.

**Classification is not an apply authorization.** Even items marked `PROD_REQUIRED_FOUNDATION` describe a conditional *target architecture*, not verified current Production presence or an instruction to execute migrations. The 80/60 migration counts and 25/5 divergence are previous read-only evidence, not an exhaustive live object/ACL/dependency reconciliation. Exact applicable migrations, their prerequisites and permissions must be proven through the authorized #917 workflow before a specific hosted action.

## Missing proofs for first complete CH→DE source+rule path

1. **#917 Stage1 readback STOP still open** for hosted migration chain confirmation (must remain independent and not bypassed).
2. **Requirements provider remains off** (`lib/readiness/provider.ts`: `requirementsProviderAus() => null`), so no productive Official-Truth projection path is active.
3. **Pilot runtime remains hard-off** (`applicationPilotAvailable(): false`, `applicationPilotEnabled(): false`), so CH→DE pilot RPC flow is not available in runtime.
4. **Reader adapter remains unavailable** (`trusted_accepted_reader_unavailable` path in CH→DE first-visa adapter), so no successful accepted-reader bridge to workspace is currently possible.
5. **Current-version lookup/original-custody path is still local-unapplied**, therefore no hosted retained-custody lookup proof exists yet for CH→DE.

## Scope of local synthetic security proof

The Engineering V1 owner-reviewer PostgreSQL test applies the **actual** capability migration in an isolated disposable cluster, but substitutes simplified implementations for the upstream role and AAL2 helpers. It is only a *mock-helper contract proof*, not evidence of effective Hosted RLS, Supabase-signed JWT verification, real `creator_profiles` owner role, or actual Stage-1 installed ACLs. Its separate source assertions identify the real upstream definitions, without executing the hosted path.

## Work that can proceed without blocked external research

- Keep strengthening synthetic SQL-contract tests (grants, invoker/definer, search_path, fail-closed).
- Prepare hosted apply/replay runbooks and explicit rollback criteria as docs only.
- Tighten adapter negative-path coverage (unavailable/denied/context-changed) without enabling runtime provider.

