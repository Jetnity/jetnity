# GOV.UK Content API identity verifier 1 — Report

Date: 4 October 2026. Issue #818 / Draft PR #819 / Generation 1.
Logical writer: **Jetnity GOV.UK Content API identity verifier 1**.
Branch: `feat/official-truth-profile-verifier-1`.
Baseline: `f0430bb62b12d5f7e523db88cb5d2dcc92754bd3`.
Immutable dispatch: `2c5cce9a596e85cdb72965a92127312cd421263f`.
Codex Desktop session: `01a1071c-786d-79c0-8ff7-b17597e477c1`.
Exact model: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra`, reasoning `xhigh`, verified from this session's turn_context. One writer; no subagents.

Classification: **GOVUK_CONTENT_API_IDENTITY_VERIFIER_READY_FOR_REGISTRATION_AUDIT**.
Status: Scope Amendment 1 applied in the same session; the complete validation matrix passes. The verifier remains dormant. Remain Draft. No independent PASS is claimed and no registration audit is started.

The exact final published head is reported in the completion delivery and checked against PR #819. A tracked document cannot contain its own containing commit's hash. Resolve the delivered checkout with `git rev-parse HEAD`; baseline/dispatch are not the final review head. The final delivery also provides an external exact-head validation receipt. No post-validation runtime change is intended.

## Result and authorized correction

The previous STOP at `ee48c674d7f531e6ed25706bc0a0d9887daa6728` was correct. Technical Lead independently reproduced the R1 importer-list blocker and committed Scope Amendment 1 at `96346b7bf2c0eb1f887bdad1f4750ce5276de2b0`. The original task remains byte-identical to its seed. Both complete binding documents were read before editing, and the same writer/session/model continues.

The only existing file changed is `lib/readiness/official-truth-content-identity.test.ts`. In `repository search pins the finite R2 production importers`, exactly one line was inserted between the discovered-URL and refresh-diff entries:

```text
lib/readiness/official-truth-govuk-content-api-identity-profile.ts
```

The repository scan, inclusion of type-only imports, exact path assertion, and every other R1 expectation remain unchanged. The exact expected set now contains 22 paths. No runtime seam or production file needed modification. The new verifier and its focused tests are byte-identical to the previously blocked implementation.

Validation now passes: **331/331** focused tests, **45/45** R1 tests, **125/125** affected R1/R2/retrieval tests, and **5,083/5,083** full tests, with no skipped or cancelled tests. The independent Technical Lead must review the final exact head before deciding any next slice. No registration audit begins here.

## Implementation and exported API

Three named exports:

- `GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE`: frozen existing `ContentIdentityProfileDefinition`, id **`govuk-eta-national-list-content-api-en`**, version **1**, current **true**.
- `GOVUK_CONTENT_API_JSON_LIMITS`: frozen parser bounds.
- `parseGovukContentApiJson(text)`: pure whole-string scan and parse; returns `{ ok: true, value }` or `{ ok: false, reason: 'invalid_response' }`. Parsed data alone is never origin proof or a trusted binding.

The profile has one **type-only** import and no runtime imports. Before parsing, it checks current flags, external namespace/National List id, both singleton Home Office descriptor arrays, tuple coherence, profile id/version, singleton request URL, expected final URL/media type/locale/schema, and supplied final URL/media type. Descriptor or transport contradiction returns `identity_mismatch`.

The scanner validates the whole bounded string before `JSON.parse` constructs any object. It uses bounded descent, one decoded-key Set per object, strict JSON whitespace/token/string/number grammar, finite numeric conversion, decoded dangerous-key rejection, and paired UTF-16 validation for both raw and escaped strings. Equal-valued duplicates, escaped duplicates and unrelated nested duplicates reject. There is no regex-only key detection, reviver, eval, merge into a descriptor, network or clock access.

| Bound | Inclusive maximum |
| --- | ---: |
| UTF-8 bytes | 65,536 |
| Container depth, root = 1 | 16 |
| Total object members | 2,048 |
| Members per object | 256 |
| Elements per array | 1,024 |
| Values including containers | 4,096 |
| Decoded key UTF-16 units | 128 |
| Number token UTF-16 units | 64 |

Envelope validation requires exactly 20 root keys and six details keys. The task's requirement for all 20 keys takes precedence over the earlier audit's optional five observations. `details.manual` is exactly `{ base_path }`. Root links contain exactly four singleton relations; both Home Office relations are independently checked. Linked ids, paths, locale, schema/type, exact derived URLs, withdrawal flag, empty nested links and organisation status are bound. Known optional linked display metadata may vary; unknown structural keys fail closed. Opaque attachments/history/display-organisation arrays are not used as identity authority.

Audited machine constants are National List `2b25b3d4-4eaa-4859-a34e-c7869c114c15`, Home Office `06056197-bc69-4147-aa28-070bca132178`, manual `87e2748f-2e9b-4681-8baa-778b6d326a8a`, and the exact paths/URL from the task. Appendix id `2620750b-5453-44f1-98af-414037c833be` is only a synthetic negative test. No real local source/item/representation id is allocated.

Success returns only the seven descriptor-owned binding fields in a fresh frozen object. No parsed body, observation timestamp, Rule fact, hash or replacement id is returned. Mutable title, description, body and valid timestamps pass without value equality pins. Calendar/offset validation rejects invalid dates; leap-second claims and year zero are conservatively rejected. This is timestamp syntax checking, never freshness or legal effect. HTML is rejected. Existing retrieval remains responsible for server origin, DNS/SSRF, status, redirects and bytes; downstream Evidence/hash rules remain unchanged.

## Validation

Executed on the delivered runtime/test bytes, followed by final exact-head verification in the completion receipt:

| Check | Result |
| --- | --- |
| Locked dependency setup, reused from blocked delivery | Earlier offline `npm ci --ignore-scripts --no-audit --no-fund` passed; 530 packages, no dependency change; container lock bytes rechecked |
| New profile/parser test | **331/331 PASS**, four suites |
| R1 content identity alone | **45/45 PASS**, including the unchanged scan with its exact amended list |
| R1 identity, R2 wiring, server-owned retrieval, same-request extraction | **125/125 PASS** |
| Full `npm test`, Node 22 + PostgreSQL 16 isolated image | **5,083/5,083 PASS**, 779 suites; no failures/skips/cancellations |
| Existing S1 synthetic PostgreSQL proof within full suite | **51/51 PASS** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| Canonical `npm run build` including prebuild/setup check | PASS, Next.js 16.3.8/Turbopack; 25 static pages |
| Operating-mode guard | PASS, NORMAL; exact final range rechecked at delivery |
| `check:api-schutz` | PASS, 12 Admin routes |
| `check:schema-bezug` | PASS, 22 generated tables/views and 25 functions; existing LOCAL/UNAPPLIED entries unchanged |
| `check:dead`, `check:exports`, `check:deps` | PASS, zero unjustified orphans/exports/dependencies |
| `git diff --check`, immutable seed, exact scope | PASS; final committed range rechecked at delivery |
| Production registry / importer proof | Empty and frozen / zero non-test importers of new module |

Earlier blocked-delivery environment corrections are retained for reproducibility: the first full-suite archive omitted `.git`, causing two unrelated Git-based assertions to fail in addition to the allowlist. Repeating with the same source plus its Git metadata resolved those two failures. The first local build hit the sandbox's TSX IPC restriction; the first container build hit Turbopack's external node_modules symlink restriction. A disposable container with dependencies copied inside its tree ran the unmodified canonical build successfully. No repository configuration or command substitute was used. Build warnings were absent local `.env`, uncached build and stale Browserslist data; no environment secrets or providers were supplied.

Full-suite and build containers use the existing local `jetnity-r2-validation:local` image, matching package-lock bytes, `--network none`, read-only root, a disposable `/tmp`, and no credentials. PostgreSQL tests create isolated synthetic local databases over Unix sockets; they do not contact Development, Production or hosted Supabase. No DB/network action outside those required local test fixtures is implied by the test pass.

## Scope, immutable seed and dormant production proof

Exactly eight paths versus baseline:

1. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_TASK_2026-10-04.md` — immutable seed.
2. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_SCOPE_AMENDMENT_1_2026-10-04.md` — unchanged TL amendment.
3. `lib/readiness/official-truth-govuk-content-api-identity-profile.ts`.
4. `lib/readiness/official-truth-govuk-content-api-identity-profile.test.ts`.
5. `lib/readiness/official-truth-content-identity.test.ts` — exactly one expected-path insertion.
6. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_REPORT_2026-10-04.md`.
7. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_HANDOFF_2026-10-04.md`.
8. `docs/OFFICIAL_TRUTH_GOVUK_CONTENT_API_IDENTITY_VERIFIER_1_SELF_REVIEW_2026-10-04.md`.

Task-seed blob: `d0cadaf7be709cca8d2ec1cd55191be3b3547121`.
Task-seed SHA-256: `07b97fe02ae5a51061f33294f48f8b61a2338121b44f46b48bcae54b2b14460d`.
Amendment SHA-256: `0fc1f09e909bfe8e522d807412247a92c0b3fcdd33542f4e1a3ea01a67a92222`; exact byte equality to amendment head is checked.

`official-truth-content-identity.ts` is byte-unchanged and still declares `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` as `Object.freeze([])`. Existing and new tests both assert empty/frozen after loading the profile. A repository-wide source scan in the new test proves zero non-test importers of the new module. A type dependency **from** this module on the existing contract is distinct from a runtime importer **of** this module; the amended R1 guard explicitly counts the type dependency while the new module remains dormant.

Fixtures are inline synthetic envelopes with short opaque body strings. The saved #816 capture was read only for machine-envelope shape, with its recorded SHA-256 verified; no fresh GOV.UK request or full body copy into the repository occurred. No fixture file is added.

## Startup, boundaries and handoff

Fetched main, required branch and exact dispatch; verified NORMAL; read #751, #818, #819, #748 after marker `5978621253`, the complete 533-line task, and the complete merged #816 audit/report/handoff/self-review. Existing contract importers were inspected before editing. The only newer inbox entry was prior-slice TL receipt `5978881653`. Open PRs were #819 and historical #28/#39/#40/#50/#52. Earlier local writers were idle/not loaded. Re-fetch/rereads before delivery showed unchanged baseline/dispatch and no overlap. Historical lower #801 wording in #751 is superseded by its live active-writer section and the actual open-PR list.

At resumption, fetched the exact amendment head, re-read both complete binding documents, verified live main/NORMAL/#751/#748 and no overlapping writer, and verified this session still uses `gpt-6-astra` / `xhigh`. The correction is confined to the single authorized existing test plus updates to the three delivery documents. Neither the original seed, TL amendment, nor the new implementation/test bytes were changed during the correction. No API endpoint, database, trip graph, shared runtime or product-flow change is needed. Risks are ambiguous JSON, sibling substitution and future structural drift; tests exercise those boundaries. No new recurring cost is introduced.

No source/content-item/representation/profile registration; no hosted DB query or mutation; no Development/Production mutation; no migration; no source/catalog/store/retrieval runtime edit; no extractor, composition policy, region pin, Rule fact, schema-1 persistence, F8, route/app/component/provider/traveller change, new dependency, #626 or launch/indexing action. The only external network is requested GitHub coordination/Git delivery. Tests and build are offline; the module performs no HTTP. Development-empty and Production-v2-absent remain TL-supplied state, not a new database readback by this writer.

**Next actor: independent Technical Lead exact-head review, after the authorized scope correction and complete green validation. Remain Draft. No Ready, merge, registration audit or F8. STOP.**
