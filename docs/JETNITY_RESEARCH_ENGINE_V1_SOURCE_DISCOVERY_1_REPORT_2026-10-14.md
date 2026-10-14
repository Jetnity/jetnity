# Source Discovery 1 — blocker evidence report

**BLOCKED_SCOPE_AMENDMENT_REQUIRED — implementation incomplete.**
Author: **Jetnity Research Engine V1 Source Discovery 1 — Codex Generation 1**.
Issue [#948](https://github.com/Jetnity/jetnity/issues/948), Draft [#949](https://github.com/Jetnity/jetnity/pull/949).

## Observed boundary

The existing `officialTruthRechercheEntscheiden`, `officialTruthRechercheAusfuehrungsplan` and `officialTruthEntdeckteUrlKandidatenPruefen` form the intended reusable path. They do not search or qualify a source. The last function calls `quellenInhaltRouten`, which resolves a representation from the supplied graph. That resolution checks the selected URL/authority and ambiguous matching representations, but does not reconstruct the complete item/version/profile graph.

The TASK D4 requirement to fail closed on partial/conflicting identity therefore requires validation of the injected offline registry before composition. Treating a TypeScript type, a frozen object, a caller flag or successful URL resolution as proof of a complete graph would not satisfy D4.

The existing complete validator is `createContentIdentityGraph`; no replacement is needed or proposed. Its direct consumers are closed by `reviewedContentIdentityImporters` in `lib/readiness/official-truth-content-identity.test.ts`. The new coordinator is absent. That existing file is outside the TASK write allowlist.

Pinned source evidence at the seed:

- [Canonical graph constructor and URL resolver](https://github.com/Jetnity/jetnity/blob/35ed794ae5b8a354e46d3e051dbc7935e95976e7/lib/readiness/official-truth-content-identity.ts#L267).
- [URL-candidate validator](https://github.com/Jetnity/jetnity/blob/35ed794ae5b8a354e46d3e051dbc7935e95976e7/lib/readiness/official-truth-discovered-url-candidates.ts#L249).
- [Finite importer inventory and repository scan](https://github.com/Jetnity/jetnity/blob/35ed794ae5b8a354e46d3e051dbc7935e95976e7/lib/readiness/official-truth-content-identity.test.ts#L485).

This is a blocker for the proposed new composition, **not a demonstrated live exploit or a finding that the existing server-held catalog accepts these malformed fixtures**. No live registry was queried. The catalog reconstructs its graph through the canonical constructor; importing that network-capable catalog entry into this offline slice would cross the TASK boundary. Routing through unrelated historical artifact machinery solely to avoid the import guard is not the requested thin composition.

## Executed synthetic counterexamples

The private finite reproduction used the real `regelScopeAusEvidenceScope`, `officialTruthAbdeckungBewerten` with `claim=null`, then the real request, execution-plan and URL-candidate functions. Authority `synthetic-authority`, domain `authority.example`, URI `https://authority.example/item`; the existing `r2Registry` test fixture built the initial canonical graph. No authority site was contacted. No candidate acceptance or storage function was called.

| Fixture | Existing execution plan | Existing URL validator | Canonical graph constructor |
| --- | --- | --- | --- |
| Complete synthetic graph | `ready` | `validated_url_candidates` | valid |
| Same graph, `items=[]` | `ready` | `validated_url_candidates` | `missing_item_version` |
| Same graph, duplicate item/version with conflicting external identity | `ready` | `validated_url_candidates` | `duplicate_item_version` |
| Same graph, `profiles=[]`, reconstructed with no profiles | `ready` | `validated_url_candidates` | `profile_unavailable` |
| Empty registry and descriptors | `no_eligible_official_source` | not called | not called |

Reproduction recipe: construct the authority with `quellenRegistryErstellen`, register the one synthetic URI using `r2Registry`, and use a descriptor for VN/visa/CH citizenship/CH-issued passport. Run each listed graph mutation through the same request and strict candidate pair. Separately run `createContentIdentityGraph(graph.authorityRegistry, graph.items, graph.representations, profiles)` with the existing synthetic profile definitions, except an empty profile array for the missing-profile case. The observations are in the sanitized evidence JSON; original script and output digests are retained there.

Scenario limitation: the existing canonical scope encodes CH citizenship, an explicitly related CH `passport`, VN and `visa`, with no asserted travel date. It does not encode passport subtype, tourism purpose or the planned 21-day duration. Those remain the requested scenario context, not fields added to a second scope or evidence for visa eligibility. The complete requested tourist/ordinary-passport demo is **not delivered**. All results remain unqualified; no Vietnam entry rule or `not_required` conclusion follows.

## Executed import-boundary proof

A temporary proposed coordinator containing only a static import of `createContentIdentityGraph` was placed at the TASK-authorized future path. The unchanged existing test was run with:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  --test-name-pattern='repository search pins the finite R3 application and isolated developer importers' \
  lib/readiness/official-truth-content-identity.test.ts
```

Original result: exit 1, one test, zero pass, one fail; rejected importer `lib/readiness/official-truth-source-discovery-v1/coordinator.ts`. The probe was removed. No existing test was edited, disabled, skipped through a new rule, or reclassified as passing. Later passing regressions on the unchanged runtime do not clear this prospective import failure.

TASK §4 says: “An existing test import inventory that prevents the slice requires STOP and a narrow requested amendment, not a stealth edit.” The author follows that explicit instruction. The exact requested amendment is in PLAN and HANDOFF.

## Delivery and acceptance

Only the four authorized documents and sanitized evidence JSON are delivered. No new runtime, test, script, environment, package, lockfile, workflow, application, database or governance file remains changed. The TASK blob is unchanged. No independent TL PASS is claimed.

T01–T07: full new orchestration acceptance remains unimplemented/unproved. The finite counterexamples establish the boundary limitation; they do not substitute for those tests. T08: seven unchanged focused suites passed 130 tests. T09: original baseline gate results are recorded in the evidence JSON and handoff; failures remain failures. Exact delivered-head CI/Auth must be assessed separately from these local seed-runtime tests.

| Original local gate (Node 22.23.3 / npm 10.9.9) | Result |
| --- | --- |
| `npm ci` | PASS, unchanged lockfile |
| `check:setup:ci` | FAIL: sandbox denies tsx IPC listener (`EPERM`) |
| `check:operating-mode` | PASS, NORMAL, explicit PR branch/base/head |
| `typecheck` | PASS |
| `lint` | PASS, 0 errors / 145 existing warnings |
| `npm test` | FAIL: 6,756 tests; 6,745 pass, 10 fail, 1 skip |
| API protection / schema references / dead code / exports / dependencies | all five PASS |
| `build` | FAIL at prebuild tsx IPC (`EPERM`); Next production compilation not reached |

All ten test failures report unavailable native PostgreSQL binaries. No hosted fallback, PostgreSQL installation, emulator, timeout change, test edit or retry was used. The sandbox IPC failures also remain original failures; no permission workaround or green-build claim is made. These baseline results concern an unchanged runtime, not completed Source Discovery acceptance.

No real source GET, live search, OpenAI request, Supabase operation, new provider, source admission, contact, production activation, merge or deployment was performed. No recurring cost was added. #917 remains SOURCE_NOT_QUALIFIED; all TASK §6 protected stops remain unchanged.
