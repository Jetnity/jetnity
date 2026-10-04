# Official Truth Content Registration Gateway 1 — Report

Date: 4 October 2026. Issue [#822](https://github.com/Jetnity/jetnity/issues/822), Draft PR [#823](https://github.com/Jetnity/jetnity/pull/823).

Status: **IMPLEMENTED / DORMANT / LOCAL POSTGRESQL VALIDATION BLOCKED / DRAFT / STOP FOR INDEPENDENT EXACT-HEAD REVIEW**. This is the implementation writer's report, never a Technical-Lead PASS.

## Identity and startup evidence

- Logical writer: **Jetnity Official Truth content registration gateway 1**, Generation 1, Codex Desktop.
- Same session throughout: `01a10811-6d89-7d62-be31-2966a108d05b`. No Cursor, external implementation agent or subagent was started.
- Actual session `turn_context` evidence: `2026-10-04T17:58:43.894Z` and resumed turn `2026-10-04T18:13:46.068Z`, both `model=gpt-6-astra`, `effort=xhigh`. These are local runtime records, not an inference from the requested model.
- Branch: `feat/official-truth-content-registration-gateway-1`.
- Baseline main and merge-base: `de1335d4c749a53aa9a3966c46af4c9c1e1f76a9`.
- Sole binding amended task seed: `eb61bac8a6416b435350420c6451a8cd4888c9ab`. Local HEAD and remote PR head matched it before material edits; startup was 3 ahead / 0 behind main.
- Task Git blob: `85f89de7c5688e6e0f69af56cf4ec096c6ef36ea`; SHA-256: `6d4f3bb0e3195a4280b22962f948d34caaa9d037b4b0656d1c631061cc3a3890`. The writer has not modified its bytes.
- The superseded `182cf171...` seed's missing top-level `representations` was correctly stopped before implementation. TL amended the task; only then was this same session resumed. No migration was changed to accommodate the earlier contradictory text.
- Fresh GitHub #751 names this writer and amended seed; mode is NORMAL; PR #823 is open/Draft. The only #748 entry newer than processed marker `5982622080` at resumed startup was TL receipt `5982683597`, classified continuity-only/no new blocker. No new Product-Owner decision changes this scope.
- Open PRs: #823 and historical #52/#50/#40/#39/#28. App inspection found no other active overlapping Codex writer. Startup inline review threads were empty.

Read the task, source gateway/tests, R1 contracts, S1-v2 registration function/constraints, #821 audit/report/handoff and relevant repository governance/product standards. Live #751 supersedes historical current-state paragraphs in older repository documents. Hosted database state recorded in #751/#821 was not independently re-queried by this writer.

The final commit cannot contain its own SHA. The final chat delivery receipt records the exact published head, final-head command results, remote readback, ahead/behind and then-available CI/Preview status. Review this report only as part of that exact six-file PR diff.

## Implementation

`contentItemRegistrieren` is the sole new runtime helper. Its input/result types derive from the existing R1 descriptor types; item and representation versions are literal `1`, and current flags literal `true`. Runtime checks additionally enforce the initial-registration restriction and 1..16 representations. The helper envelope rejects missing/extra keys, accessors, symbols, non-plain objects and malformed representation arrays. Representation input cannot supply inherited tuple fields.

It resolves the existing transport, performs one schema-2 `read_registry`, and reconstructs the complete catalog using the existing `registryAusAntwort`. The new path does not introduce another client or RPC transport. It then passes the proposed item/representations to `createContentIdentityGraph` using the validated catalog authority and the existing code-owned profile/test seam. Private R1 parsers, source authorization and URL rules are not copied. Item/pin/URL/profile validation and canonical sorting remain R1 responsibilities.

For a new tuple, a second R1 graph construction validates the union with every existing item/representation, including historical external identity and URL reservations. For an existing tuple, it compares canonical complete item-version and representation arrays without appending duplicate nodes. All R1 failures return before the write. Invalid catalog/transport/configuration exceptions return sanitized reasons; no raw database or secret detail is exposed.

Serialization uses exactly top-level `operation`, `item`, `representations`. The operation is literal `register_content_item`. The item has exactly the eight S1 fields; each representation has exactly the ten S1 fields and omits `source_id`, `content_item_id`, `content_item_version`. Sorted publisher/authority pins, request URLs and representation order come from R1 output. There is no asynchronous gap between canonical validation and serialization; after validation, payload and response binding use copied/frozen descriptors rather than caller data.

The existing `quelleRegistrieren`, catalog reader, catalog response parser, transport, client creation and snapshot serializer remain unchanged. No runtime consumer, route or browser input path was added. Production has no caller of the new helper.

## Replay, conflicts and exact responses

Replay equality compares the entire canonical R1 item and representation output, including source/item, external namespace/id, all versions/current flags, publisher/authority pins, representation identities, complete representation membership, request URLs, final URL, media type, profile id/version, locale and schema. Canonical set ordering is insignificant; missing/extra representations, changed values and additional historical item versions fail closed. Malformed or unavailable-profile changes can fail earlier in canonical validation/catalog reconstruction. Exact replay still makes the normal RPC call and only accepts its validated `inserted`/`idempotent` result. No synthetic local success, upsert, merge, retire, rebind, delete or truncate exists.

The response parser reuses the existing exact-own-data-property `row` utility. Exactly six keys are required: `ok`, `identity_schema`, `operation`, `outcome`, `source_id`, `content_item_id`. Values must be true, 2, `register_content_item`, `inserted|idempotent`, and the exact validated source/item tuple. Missing, extra (including symbol/non-enumerable), accessor, non-plain, wrong-value and malformed responses return `catalog_failed`.

SQL remains the final atomic race/uniqueness authority. A write failure or invalid success response does not prove no database mutation occurred after dispatch; this helper does not automatically retry or infer rollback. Independent readback remains necessary for any future ambiguous real invocation.

## Adversarial evidence

The new suite has 94 tests, with additional enumerated assertions inside tests. Together with the three existing source-gateway tests, the dedicated gateway command passes 97/97. Coverage includes:

- exact three-key payload and every nested field; inherited-field absence; inserted/idempotent outcomes;
- invalid versions/current flags, item/representation grammar, absent/extra keys, getters/prototypes/symbols, bounds, duplicate/malformed pins and request URLs;
- malformed/insecure/credential-bearing/port/fragment/private-address URLs, unauthorized domains, source mismatch, unknown/nonofficial source and missing/retired/wrong profiles;
- external identity conflicts, current/historical URL ownership, duplicate representations, exact reordered replay, changed descriptors, partial/additional representation sets and historical version drift;
- every required response key missing, every response value category mismatched, extra/hidden/symbol keys, getters and non-plain objects;
- read and write transport failures/exceptions, absent/malformed configuration, malformed catalog and reservation ownership;
- default frozen empty profile registry, both fresh registration and stored-item read failure without profiles, fresh-process import without network/DB calls, profile verifier never executed, caller mutation during write cannot alter serialized payload or response tuple;
- one and sixteen representations accepted under injected profiles.

`ohneContentWrite` asserts both the exact failure result and the complete recorded transport sequence **exactly `[read_registry]`** for pre-write rejections. Transport failure tests separately assert read failure has no write. Missing configuration returns before a transport exists. Successful tests require exactly `[read_registry, register_content_item]`. These are injected-transport proofs, not hosted registrations.

## Validation results and environment limits

Environment: macOS, Node `v22.23.3`; clean isolated checkout; dependencies installed from the lockfile with `npm ci --offline --ignore-scripts --no-audit --no-fund` (530 packages, exit 0). No lockfile change. npm reported the existing ESLint deprecation. No `.env` or hosted credentials were installed.

The completed implementation tree produced the following results. The same mandatory commands are rerun after the delivery commit; their exact head/log hashes are retained in the final local receipt outside the repository and summarized in chat.

| Gate | Observed result |
| --- | --- |
| `git diff --check` | PASS, exit 0 |
| `npm run check:operating-mode` | PASS, exit 0, NORMAL |
| Focused six source-catalog/content-identity suites | 511 tests: 509 pass, 2 fail, 0 skipped; exit 1, both failures missing PostgreSQL binary |
| Dedicated gateway/source tests | 97 tests pass, 0 fail/skip; exit 0 |
| `npm test` | 5,126 tests: 5,123 pass, 3 fail, 0 skipped; exit 1, all three failures missing PostgreSQL binary |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0; 0 errors, 149 existing warnings; none in changed files |
| `npm run check:api-schutz` | PASS, exit 0; 12 admin routes |
| `npm run check:schema-bezug` | PASS, exit 0; 22 generated tables/views, 25 functions; existing LOCAL/UNAPPLIED RPC notices retained |
| `npm run check:dead` | PASS, exit 0; 0 orphan modules |
| `npm run check:exports` | PASS, exit 0; 0 unused exports |
| `npm run check:deps` | PASS, exit 0 |
| `npm run build` | PASS, exit 0 after local IPC permission retry; setup warning: no `.env/.local` |

Focused command (six files):

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/official-truth-source-catalog-server.test.ts \
  lib/readiness/official-truth-server-held-source-registry.test.ts \
  lib/readiness/official-truth-content-identity.test.ts \
  lib/readiness/official-truth-content-identity-r2.test.ts \
  lib/readiness/official-truth-content-identity-schema-v2.test.ts \
  lib/readiness/official-truth-govuk-content-api-identity-profile.test.ts
```

Dedicated injected-only gateway command:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  --test-name-pattern='dormant typed content registration gateway|official truth source catalog gateway' \
  lib/readiness/official-truth-source-catalog-server.test.ts
```

The three full-suite failures are the existing S1 disposable PostgreSQL 16 proof, source-catalog PostgreSQL proof and trusted-store PostgreSQL proof, all `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. The focused set includes the first two. Their Linux-specific executable path is absent on this Mac. These are **failed/environment-blocked**, not passed or silently skipped. No test or PostgreSQL-path workaround was changed. R1/R2 and all executable focused negative guarantees pass; local SQL/race proofs remain unverified here and require the exact-head Linux CI evidence.

The initial operating-mode command lacked the single-branch clone's `origin/main` reference; fetching the verified reference fixed it without changing repository files. Initial build failed at tsx's local IPC pipe with `listen EPERM`; the same `npm run build` succeeded with local process/IPC permissions and `NEXT_TELEMETRY_DISABLED=1`. No deployment was executed.

## Scope, security, network and costs

Full PR changed-file set is the immutable TASK, this REPORT, HANDOFF, SELF_REVIEW and the two allowed source-catalog files. The implementation writer changes only five of those files; TASK is identical to amended dispatch. No migration/schema/Auth/RLS/grant, default registry, extractor, composition policy, region pin, Evidence/Rule fact, acceptance path or F8 file changed.

Network access by the writer was limited to GitHub and public Supabase documentation during preflight. npm installation used the offline cache. No hosted Supabase project or GOV.UK endpoint was contacted by tests or this implementation. No Development/Production SQL, DB write, source/content registration or profile activation occurred. No secrets were retrieved, created or published. No new dependency/service or recurring infrastructure cost was introduced.

Residuals: local PostgreSQL proofs are environment-blocked; CI and Preview must be checked on the exact published head; registry/profile availability proves structural eligibility, not publication authenticity or legal truth; a future read/write race remains SQL's responsibility; the production profile registry deliberately stays empty. Development registration, Production apply and F8 remain separately gated. Keep Draft and STOP for independent Technical-Lead exact-head review.
