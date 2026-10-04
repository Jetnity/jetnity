# Official Truth content identity R2 wiring 1 — Self-review

Date: 4 October 2026. Issue #814 / Draft PR #815 / Generation 1.
Logical writer: **Jetnity Official Truth coordinated content identity wiring R2**.
Branch: `feat/official-truth-content-identity-r2-wiring-1`.
Baseline main: `30aa083dc752bf499dfc5a09448d06bd36d3ba64`.
Immutable dispatch: `7185c60dd78604a5105b207a855fc74620195fc0`.
Resume parent (Scope Amendment 2): `dc5d96d44984cb340569bcd98f74f1ab4acafcc7`.
Model: **GPT-6 Astra — Sehr hoch**, `gpt-6-astra` / `xhigh`.
Same Codex session: `01a1064d-7e3c-72a0-b257-387193918f67`. One writer, no subagents.

Classification: **CONTENT_IDENTITY_R2_READY_FOR_REAL_IDENTITY_PROFILE_AUDIT**.
This classification requests independent Technical-Lead review; it does not start the audit or grant registration/F8/DB authority. PR remains Draft.

The exact final published commit SHA is recorded in the PR #815 delivery receipt and the accompanying final-head validation manifest. This document belongs to that commit; it does not attempt to embed its own Git hash. Resolve it with `git rev-parse HEAD` at that delivered checkout. All gates are rerun after publication, with no subsequent repository edit.

## Adversarial checks

- Treat an allowed hostname as a publication: rejected without an exact current registered representation.
- Supply item/profile/representation authority in caller input or a fake proof: rejected before catalog/HTTP; no bearer route.
- Return the wrong response item, publisher, authority or representation: synthetic profile rejects before legal match/extract.
- Redirect to another item, another rendering or a sibling path: rejected after the first hop. Allowed final-only targets work through an explicitly registered starting URL.
- Replay a changed item/version/representation/profile tuple: blocked before extraction. Change descriptor/profile/URL/current binding in the catalog: accepted Evidence reproof rejects.
- Give two representations/versions of one item distinct Evidence ids: duplicate publication is rejected. Add a third different item to hide the duplicate: rejected. Two distinct items under one authority produce the private composition seal and satisfy canonical Rule identity distinctness.
- Reuse identical source text across items: hashes may match, ev2 ids/lookups do not.
- Feed ev1/lookup-v2 Evidence or review-v2 identity: rejected; no compatibility success path.
- Construct frozen JSON to imitate a private composition seal: rejected.
- Persist schema-1 applicability: unchanged pretransport `applicability_not_persistable` guard; existing negative tests preserved.
- Import server runtime while service environment is configured synthetically: 0 IO calls. Invoke absent v2: unavailable/store_failed, one attempt, no v1 fallback.
- Register a real profile/extractor/policy/region pin: none; all four production arrays remain frozen and exactly empty.
- Hide a new RPC from the scanner: no; literal v2 calls remain visible, with only the two explicitly authorized allowlist replacements.
- Rewrite historical migration expectations: no; historical SQL remains v1, current runtime assertions explicitly ev2/v3.
- Expand ownership to fix compatibility: no; exactly five amendment files, two unchanged external production importers.

## Corrections made during self-review

The audit corrected source-registry property-order equality, precise fail-closed assertion precedence, structured item-attributed test observations, synthetic local v2 SQL fixture setup, duplicate catalog-source rejection, exact request-ordinal interpretation, and final-only URL replay. PostgreSQL tests run unmodified at the platform level in a network-disabled Node 22/PostgreSQL 16 container; no live DB was contacted. No test skip or scanner exemption was introduced.

## Validation

The complete suite ran with **Node 22 and PostgreSQL 16** in a disposable local Docker container, `--network none`, with a read-only repository mount and a copied test checkout. It has no Supabase credentials or live database connection. The existing SQL proofs create/drop only their synthetic temporary clusters. Repository migrations were read as fixture inputs, never edited or applied to Development/Production. The previously reported macOS `initdb ENOENT` limitation is resolved by this isolated test environment; no test was skipped.

| Gate | Result |
| --- | --- |
| Targeted identity/catalog/routing/retrieval/Evidence/store/proof/replay/extractor/composition/refresh/review matrix, including S1 PostgreSQL | **566/566 PASS**, 0 fail, 0 skip |
| New coordination suite (one `.example` authority, two items, HTML/API for one item) | **24/24 PASS** |
| Full `npm test` | **4,752/4,752 PASS**, 0 fail, 0 skip |
| Explicit amended schema-reference/review-suggestion/Evidence-schema/Rule-schema tests | **35/35 PASS**, schema-reference **4/4** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors / 149 existing warnings |
| Canonical Production `npm run build` (including prebuild) | PASS; local build only |
| Operating-mode guard | PASS / NORMAL |
| API protection | PASS, 12 admin routes |
| Schema references | PASS, exact v2 gateway allowlist only |
| Dead modules / exports / dependencies | PASS, 0 unjustified orphan modules, 0 unused exports, 0 unused checked dependencies |
| `git diff --check` | PASS |
| Immutable seed / amendments | Byte-identical |
| Production v1 RPC / ev1 / lookup-v2 / review-v2 search in coordinated runtime | 0 matches |
| New real source/GOV.UK/CTA/profile/extractor/policy/pin registration search | 0 additions |
| Forbidden path / outside-closure change search | 0 unauthorized paths |

Import-time regression installs throwing network hooks in a fresh Node process with synthetic configured service credentials and imports all server entries: **0 network/DB calls**. Missing-v2 invocation transport tests fail closed after one attempt, without v1 fallback. Production build completes with empty registries and no new route activation.

The full command is `npm test`. The targeted command is:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/official-truth-*.test.ts \
  lib/readiness/source-foundation.test.ts lib/readiness/rule-claims.test.ts \
  lib/readiness/regulierungs-anwendbarkeit.test.ts \
  lib/readiness/evidence-store-schema.test.ts lib/readiness/rule-claim-store-schema.test.ts \
  lib/admin/account-counts-delivery/schema-reference.test.ts
```

Initial validation found and corrected exact fixture/expectation issues exposed by the cutover, unused test exports/imports, and final-only replay selection. Earlier incomplete runs are superseded by the full passing matrix. Linux Git and the tracked `.env.example` are included so unrelated existing full-suite tests run unchanged.

## Limits

This is self-review, not an independent security or Technical-Lead approval. No real publication/profile was audited. Runtime remains dormant, Production v2 remains absent by the supplied baseline, and F8 remains OPEN as a blocker; autonomous Rule acceptance remains unauthorized. Future real identity profile/extractor/policy work needs its own authorization and exact-head review.
