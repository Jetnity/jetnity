# Official Truth GOV.UK Profile Activation 1 — Report

Date: 4 October 2026. Issue [#824](https://github.com/Jetnity/jetnity/issues/824), Draft PR [#825](https://github.com/Jetnity/jetnity/pull/825).

Status: **IMPLEMENTED / LOCAL POSTGRESQL PROOFS ENVIRONMENT-BLOCKED / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**. This is the implementation writer's report, not a Technical-Lead PASS.

## Scope and authority

- Logical writer: **Jetnity Official Truth GOV.UK profile activation 1**, Generation 1, Codex Desktop. No Cursor, subagent or replacement writer.
- Branch: `feat/official-truth-govuk-profile-activation-1`.
- Baseline and merge-base: `49cef6463da0bce02a8127214cc93b6eaded2a57`.
- Immutable task seed: `4aab83aa7753c7c30f8c762e6cc1d277a5cd98a2`.
- Task SHA-256: `df6c5bc4ae3739c6e05d79728d60fd1bc4cb673cc0974b785134ef59dcdd08ba`; Git blob: `2f270be9ed0c21713015487a88cc16ca1b459017`. Compared directly with the seed bytes; unchanged.
- The final delivery receipt binds the committed artifact set and post-commit gate results to the exact pushed SHA. A commit cannot contain its own SHA; do not treat the filename or branch name as an exact-head approval.

Startup read the repository entry point, NORMAL mode, Technical-Lead standard, live #751/#748/#824/#825, the complete binding task, #821 audit/report/handoff, #823 task/report/handoff, and the affected runtime/tests. Live #751 identifies only #824/#825 as the active writer. Its latest processed #748 marker is `5982622080`; the subsequent receipt `5982683597` is **CONFIRMED / CONTINUITY-ONLY / NO NEW BLOCKER**. Before committing, a fresh fetch and live re-read still showed the same main, mode, dispatch head, Draft PR and no new #748 entry or review thread. Historical lower sections of #751 do not supersede its current baseline/active-writer section.

## Production change

Only `lib/readiness/official-truth-content-identity.ts` changes in production. It imports the existing `GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE` and puts that exact object into `Object.freeze([...])` as the sole registry entry:

- id `govuk-eta-national-list-content-api-en`;
- version `1`;
- current `true`;
- identical existing object and verifier function, no clone or second definition.

The profile implementation is byte-identical to the seed and baseline; SHA-256 `9b756a4347248decf20eb11264e2577f1f2eb0cbcdad0018d6d86d3e37002828`. No contract, graph validator, identity binding, parser, verifier, gateway, retrieval, Evidence or Rule runtime semantics were edited. There is no dynamic registry API, environment selector or caller-supplied production implementation.

## Trust-boundary proofs

| Boundary | Executed proof |
| --- | --- |
| Exact singleton | R1 and profile tests assert length 1, reference equality to the existing export and verifier, exact id/version/current, frozen registry/object and failed mutation. Unknown/wrong id/version, retired, malformed, duplicate version and duplicate-current definitions still fail closed. |
| Importer boundary | The repository guard now permits exactly `lib/readiness/official-truth-content-identity.ts` as the one non-test importer. It retains the finite exact-path list; no route/API/UI importer is allowed. R1 also enumerates its precise allowed imports. |
| Runtime cycle | The profile's only reverse dependency is `import type`. TypeScript emission with verbatim module syntax contains no runtime import/require. Fresh processes import in both orders and observe the same complete frozen singleton. |
| Import dormancy | Fresh-process tests prohibit fetch, HTTP(S), sockets and DNS. V8 precise coverage proves zero verifier, graph-constructor, Evidence-acceptance and Rule-acceptance calls; loaded modules exclude Supabase, catalog/store gateways and the trusted-fact extractor. Configured synthetic service variables do not cause I/O. Existing R2/gateway import tests also remain active. |
| R2 residual dormancy | Trusted-fact extractor, composition-policy and region-pin registries remain exactly empty and frozen. No Rule fact, extraction, composition, region pin or F8 is activated. |
| Default registration | Exact initial and idempotent replay cases call `contentItemRegistrieren` with only an injected transport. No `identityProfiles` override is supplied. Tests assert the exact canonical S1 payload and default profile pin. Wrong profile/version, unknown/nonofficial source, URL conflict, changed replay and caller profile injection fail before a write operation. Exact response keys/schema/operation/outcome/tuple remain required. |
| Registration does not verify | V8 coverage observes zero calls to the real immutable default verifier during successful structural registration. A positive control then explicitly calls that same verifier and observes one call, proving the counter is meaningful. |
| Default retrieval | A synthetic National-List path succeeds using the normal code registry and injected catalog/DNS/HTTP/clock seams, with no profile injection. It returns the exact seven-field binding, frozen material, hash of the received chunks, normalized media type and server time. The real verifier rejects wrong content/publisher identity, malformed bytes and a sibling redirect. |
| Retrieval authority/rebind | Wrong pins, unavailable/retired/duplicate definitions fail before HTTP. A test-only observer around the existing verifier proves it receives frozen catalog descriptors and server-owned response material. Forged changes to each of seven return fields, or an extra field, fail final rebind. Caller profiles/verifiers/body/catalog input are rejected before catalog/DNS/HTTP, including the public live entry. |
| Missing v2 | With fake configuration and intercepted fetch, the real default Supabase transport handles missing-RPC `404/PGRST202` and thrown transport failure as sanitized `catalog_failed`. Each catalog/registration attempt records exactly one POST to `official_truth_source_catalog_v2`, operation `read_registry`. There is no registration, v1 RPC fallback, apply or secret in the result. `/rest/v1/` in the REST URL is the PostgREST API prefix, not an Official Truth v1 fallback. Retrieval also rejects failed/throwing/schema-1 catalogs before HTTP. |

Fixtures contain synthetic identity envelopes and opaque text. These tests prove structural eligibility and response binding, not current GOV.UK origin, legal truth, live registration or hosted database state.

## Local validation and final-head receipt

Runtime: Node `v22.23.3`; dependencies installed from the local npm cache with `npm ci --offline --ignore-scripts --no-audit --no-fund`. No dependency/lockfile changes.

The completed implementation-tree runs gave these results. Every required command is repeated after the delivery commit; the final chat receipt and exported gate ledger identify that exact SHA and the observed post-commit results.

| Command | Implementation-tree result |
| --- | --- |
| `git diff --check` | exit 0 |
| `npm run check:operating-mode` | exit 0, NORMAL |
| Focused five-file Node test command below | 539 tests: 538 pass, 1 fail, 0 skipped; exit 1 |
| `npm test` | 5,141 tests: 5,138 pass, 3 fail, 0 skipped; exit 1 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0; 0 errors, 149 pre-existing warnings |
| `npm run check:api-schutz` | exit 0 |
| `npm run check:schema-bezug` | exit 0 |
| `npm run check:dead` | exit 0 |
| `npm run check:exports` | exit 0 |
| `npm run check:deps` | exit 0 |
| `npm run build` | exit 0 on local-permission retry; telemetry disabled |

Focused command:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/official-truth-content-identity.test.ts \
  lib/readiness/official-truth-content-identity-r2.test.ts \
  lib/readiness/official-truth-govuk-content-api-identity-profile.test.ts \
  lib/readiness/official-truth-source-catalog-server.test.ts \
  lib/readiness/official-truth-server-owned-retrieval.test.ts
```

All local test failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` on this macOS host. The focused failure is the existing source-catalog disposable PostgreSQL proof. The full run additionally fails the existing S1 content-identity-schema-v2 and trusted-store disposable PostgreSQL proofs. No test was skipped, filtered out of the required runs, rewritten to bypass PostgreSQL or reported as passing. Exact-head Linux CI remains an independent Technical-Lead gate.

The first sandboxed build exited 1 before compilation because `tsx` could not create its local IPC socket (`listen EPERM`). Repeating the unchanged command with local execution permission succeeded. Setup reports no `.env/.local`; Browserslist data is stale. These existing warnings were not addressed in this bounded slice. Build success is not deployment or database verification.

## Files

Full baseline-to-delivery scope is ten files:

1. `lib/readiness/official-truth-content-identity.ts`
2. `lib/readiness/official-truth-content-identity.test.ts`
3. `lib/readiness/official-truth-content-identity-r2.test.ts`
4. `lib/readiness/official-truth-govuk-content-api-identity-profile.test.ts`
5. `lib/readiness/official-truth-source-catalog-server.test.ts`
6. `lib/readiness/official-truth-server-owned-retrieval.test.ts`
7. `docs/OFFICIAL_TRUTH_GOVUK_PROFILE_ACTIVATION_1_TASK_2026-10-04.md` — dispatch seed only, unchanged by this writer
8. `docs/OFFICIAL_TRUTH_GOVUK_PROFILE_ACTIVATION_1_REPORT_2026-10-04.md`
9. `docs/OFFICIAL_TRUTH_GOVUK_PROFILE_ACTIVATION_1_HANDOFF_2026-10-04.md`
10. `docs/OFFICIAL_TRUTH_GOVUK_PROFILE_ACTIVATION_1_SELF_REVIEW_2026-10-04.md`

## Model, network, database, costs and residuals

Exact Codex session: `01a1084b-0881-76a2-a0e3-ea4554f57eb2`. Its runtime JSONL `turn_context` at `2026-10-04T19:01:39.107Z` (line 8), reconfirmed at `2026-10-04T19:16:37.759Z` (line 315), records `model: gpt-6-astra`, `effort: xhigh`. This is observed runtime evidence, not an inferred UI setting.

The writer used GitHub API/Git reads and the authorized branch push. npm installation was offline; fixtures and network traps stayed local. No direct hosted Supabase access, GOV.UK request, hosted source/content registration, Production/Development DB read/write/apply, secret retrieval, migration, Auth/RLS/grant change, provider/payment change or launch action was performed. Existing GitHub CI/Vercel automation may run after push; its results must be distinguished from local execution. Its existing Auth job reads platform configuration, not database contents, and was not changed here.

Production v2 absence and Development's data-empty status are inherited live #751/#821/#823 evidence, not fresh writer database reads. Code activation does not repair absent DB objects or authorize future registration. Real GOV.UK content/schema can change; this slice deliberately leaves the reviewed verifier unchanged. Exact-head Linux SQL proofs, CI/Preview evidence and independent TL review remain required. No new recurring cost, scheduled work, paid provider call or infrastructure resource is introduced; ordinary existing CI/Preview work may consume existing project resources.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep Draft. No Ready, merge, GOV.UK registration, Development write, F8 or follow-up.
