# Official Truth Accepted Store Trip Integration 1 — TL Amendment R5

Date: 2026-11-08. Work #1155 / DRAFT #1156.
Governing TASK V1, design/addendum and R1–R4 remain unchanged except the precise extensions below.
Implementation baseline at this decision: `94b6b063333d2c867eb14145a2512dd4da85bcfa`; main `e1fe0c696ade9f39b417772b5c065f87530204d6`.
Author remains **Jetnity Official Truth Accepted Store Trip Integration 1 — Codex Generation 1**, same session `/root/accepted_store_trip_integration_writer`.

## Decision and observed evidence

Root independently read the exact implementation, both affected existing guard tests, actual Traveller lifecycle and Workspace wiring. The read-only Workspace reviewer found a concrete P1 candidate: document/citizenship add/remove buttons mutate a private draft without a bubbling change event and without changing the parent Trip until Save. Thus Konto's change capture alone cannot satisfy immediate invalidation. Root confirms the call chain. The author requested the narrow semantic seam before editing the additional files.

Actual CI `42447382905`, Core job `128629130740`, passed typecheck/lint, then reported 8200 tests, 8195 pass, 3 fail, 0 cancelled and 2 existing skips in 735444.873278ms. The failures are the exact factory-call count, the native fixture's database CREATE privilege during unchanged migration installation, and missing finite foundation consumer declarations. The native test stopped at schema installation with zero completed families; no native product PASS is implied.

This is a TL engineering amendment inside the already authorized package. It changes no Product-Owner gate and grants no Ready/merge/implementation PASS.

## 1. Actual Traveller draft edits and retained-draft display guard

Additional narrowly permitted existing files, whose immutable-main blobs Root verified:

- `components/trips/useTripTravellerSnapshotLifecycle.ts`: `4c2a446128d3c172ba64c96c37b4e46ad6819dd3`.
- `components/trips/TripWorkspace.tsx`: `b70a1954dc275deda1849fb702e5aa2ad27d67e0`.
- `components/trips/Reisevorbereitung.tsx`: `71490d3e74dec6f525719ad72452038192ad9329`.

Permit an optional semantic `onEntwurfAenderung` callback on `useTripTravellerSnapshotLifecycle`, forwarded as `onTravellerEntwurfAenderung` through TripWorkspace and bound by KontoArbeitsbereich to the shared truth invalidation action. Notify synchronously before a real relevant draft value/generation change, including document/citizenship add/remove and value-changing reset/re-entry operations. Do not turn disclosure, focus, navigation, ordinary render or unrelated personal-preparation state into a mutation. Existing Save/Remove/Intake/RLS/refresh and guest lifecycle behavior stays intact; callers without this optional callback retain their prior behavior.

A callback alone is insufficient when a later confirmed server Trip is delivered while this controller deliberately retains an unsaved draft. Permit one narrow render-time guard derived from the controller's existing draft/currentness state in TripWorkspace/Reisevorbereitung, with a small shared pure helper under this package if needed so the mounted test executes the same guard. While a relevant unsaved or mismatched draft remains, no positive OfficialEvaluation, confirmed-status claim, or usable official re-read control may paint over that draft. Keep the existing editing/Save/reload recovery available. After a genuinely confirmed matching graph and a fresh explicit read, current display may recover. No independent Effect-delayed copy of draft state, rewritten domain state machine, source request on render, new generic UI redesign or guest feature activation.

The required mounted test must instantiate the actual Traveller lifecycle and actual Reisevorbereitung controls, click real document/citizenship add/remove controls, and inspect actual rendered official output. A dedicated fixture button calling invalidate alone is insufficient. Include a still-unsaved retained draft after a newer server delivery/fresh result, and confirmed-save recovery. Preserve existing lifecycle tests and all W1/W2/both-direction race requirements. This amendment does not claim those tests already ran.

## 2. Exact existing hygiene declarations

`lib/admin/account-counts-delivery/effective-target.test.ts` baseline blob `7557e554ac27989e15260eb1e16af9d76d114410`: acknowledge exactly the fourth already-approved optional lifetime constructor call in the same shared factory. Continue proving all four use the same captured `SUPABASE_URL`/`SUPABASE_ANON`; preserve getter immutability, no setter, transport isolation and existing behavioral cases. Do not loosen to an inequality or wildcard.

`lib/readiness/official-truth-autonomous-producer-custody-foundation.test.ts` baseline blob `ff0eb432e3cc3c7589b71bf20a26a33115ccd502`: add only the following independently read exact path/module/symbol tuples to its finite consumer map. Preserve the AST scan, exact seen-set equality, pure-foundation zero-I/O checks, unknown/namespace/duplicate/extra-import rejections and blocked public issuer. Historical values still do not confer live authority.

| Consumer | Imported module | Exact imported symbols |
| --- | --- | --- |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/archive-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalValuesEqual` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/canonical-server.ts` | `official-truth-autonomous-provenance-artifact` | `immutable` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/catalog-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalValuesEqual` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/custody-server.ts` | `official-truth-autonomous-provenance-artifact` | `provenanceCanonical` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalValuesEqual` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/protocol-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalValuesEqual` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/provenance-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalPinFor`, `provenanceCanonical`, `provenanceHash`, `historicalValuesEqual`, `Pin` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/provenance-server.ts` | `official-truth-autonomous-provenance-record` | `readHistoricalArtifact`, `HistoricalArtifactKind` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/provenance-server.ts` | `official-truth-global-cell-admission-server` | `validateGlobalCellAdmissionValue` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/provenance-server.ts` | `official-truth-support-selection-server` | `selectHistoricalSupports` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/provenance-server.ts` | `official-truth-autonomous-review-material-server` | `constructHistoricalAutonomousReview` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/reader-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalValuesEqual` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/reproof-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalValuesEqual`, `immutable` |
| `lib/readiness/official-truth-accepted-store-trip-integration-1/trip-binding-server.ts` | `official-truth-autonomous-provenance-artifact` | `historicalValuesEqual` |

No directory/prefix/global-import exception, old canonical behavior change or weakening of old tests is authorized. Any further different tuple requires a precise follow-up decision.

## 3. Disposable native installation capability

Only in this package's `native-schema.ts`, permit the owned disposable cluster installer to temporarily grant database CREATE on its exact `current_database()` to the synthetic `postgres` role around installation of the pinned original Trip/Evidence migrations. Revoke that grant in a finally path before candidate/runtime proof; preserve and report installation failures. Assert after successful setup that this installation-only grant is gone.

This models the ability to execute the unchanged original CREATE SCHEMA statements; it is not permission to change the original migrations, product RPC/helper ACLs, Owner/AAL2 guard, role memberships, or hosted database. The role remains NOLOGIN/NOINHERIT/NOSUPERUSER with the explicitly declared fixture BYPASSRLS; do not grant it SUPERUSER or a permanent new runtime capability. All authenticated/service-role proofs and real native COMMIT boundaries remain mandatory.

## 4. Already required same-session corrections and acceptance

The source-derived expired-reservation quota finding is recorded at https://github.com/Jetnity/jetnity/pull/1156#issuecomment-6717350042. The authenticated supported explicit reader may use the existing bounded cleanup RPC in its normal lifetime before Reserve, with post-await currentness verification. This is no new R4 post-abort exception and reaches no producer/source/reconciliation path. Prove actual recovery from expired unacknowledged read reservations with unchanged source count and durable history.

Complete the concrete SDK/target/request/key test-design corrections and the actual native/Workspace matrix. Neither a generic unavailable response from an earlier rate/source/authority gate nor a direct mock invalidation proves the targeted case. Retain the independent test-design findings and truthful Node24-only supplemental evidence boundaries.

Root may publish the narrow CI corrections and this frozen amendment while the larger UI/native tranche continues. Every resulting head requires fresh complete gates. Full Core/native/Auth/hygiene/build, actual mounted evidence, independent full diff/SQL/UI review, exact Preview/base/thread/ruleset verification, then actual-main CI/Production after any regular merge remain mandatory.

All #917/#1131/#985 and hosted/source/Owner/retention/key/privacy/ownerMac/activation/launch holds remain unchanged. No refused-action retry, hosted action, real-source activation, paid call or automatic following slice.
