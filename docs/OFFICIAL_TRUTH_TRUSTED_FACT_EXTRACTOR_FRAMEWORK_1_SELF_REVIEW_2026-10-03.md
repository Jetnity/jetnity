# Official Truth Deterministic Trusted-Fact Extractor Framework 1 — Self Review

Date: 3 October 2026
Issue: #780
Draft PR: #781
Branch: `feat/official-truth-trusted-fact-extractor-framework-1`
Baseline at task dispatch: `main@ed5e249e375fd849895dafcc5c9b72cec4b377e1`
Integrated main at first delivery: `4c373442b2261de270e50e203f87ed06efc303cc` (Merge #778)
First-delivery merge commit on this branch: `d32427359671cd42090e160c3dfae017ced7b321`
Implementation: `71ad09c63f420a7643a97d1ca9be979a1f7507b1`
CHANGES REQUIRED head: `6ffad6aeebfbde95d6624a1b9c5dfb8d1c85fc89`
Integrated main at this correction: `1e48b59b2950457909cb8ad02bbf7fcfd353ee12` (Merge #779)
Review head: the branch tip that contains the R1/R2 correction. Re-fetch before review. Do not review `6ffad6ae` as that tip.
Logical agent: **Jetnity Official Truth deterministic trusted-fact extractor framework 1**
Generation: **1**
Session: https://cursor.com/agents/bc-6431efb5-d76e-4580-9c99-4eae65caa60d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not an independent Technical-Lead PASS.

## Scope check

| Binding | Result |
| --- | --- |
| Production registry empty | Held. The constant is `Object.freeze([])`. The source does not name a real authority family. |
| Production entry returns `extractor_not_registered` | Held for a well-formed input. Test 2. |
| Caller cannot select extractor, version, or schema | Held. Those keys fail as `unexpected_fields` before a matcher runs. Test 3. |
| Only `server_owned_official_retrieval` bytes | Held as a shape check. `retrieved_material` is `representation_not_eligible`. Test 4 and test 5. |
| Hash recomputed before parse | Held. A mismatch does not call the matcher or the extractor. Test 6. |
| Content type and source id are the retrieval's own values | Held. Tests 7, 8, and 9. A licensed provider is `source_not_allowlisted`. |
| One current definition or fail closed | Held. Zero is `extractor_not_registered`. Two current matches are `ambiguous_structure`. A historical version is not called. Tests 10, 11, and 12. |
| Invalid or duplicate definitions rejected | Held. Tests 13 and 14. |
| One canonical fact or no fact | Held. Success goes through `regelFaktKanonischLesen`. A matcher failure and a policy gap do not call the extractor. Tests 15, 16, 17, and 23. |
| Proposal, suggestion, and model cannot fill the fact | Held. Test 18. |
| Support order does not change selection | Held. Test 19. The compared results are deeply equal. |
| Composition needs two sources and a pinned policy | Held. Tests 20, 21, and 22. |
| Path rule is queryless exact host and pathname | Held after R1. `?lang=en` and `?type=visa&country=jp` fail as `domain_or_path_not_allowlisted`. The retrieval URL is not stripped. An exact rule can name `?lang=en`. The R1 test. |
| `import 'server-only'` and no `app/` import | Held after R2. Test 24 matches the marker and still forbids `node:https`, a database client, `fetch`, `Date`, acceptance, the retrieval module, and `@/app`. Test 25 walks `app/`. |
| No network, clock, model, store, or acceptance | Held by source assertions. Test 24. The server-only marker does not import a socket. |
| Result deeply frozen | Held. Test 26. |
| No route, migration, provider, #626, CH import, or F8 | Held by the diff. No `app/` file imports the module. |

## Findings I am not hiding

1. The status string `server_owned_official_retrieval` is a structural check, not a cryptographic attestation. This pure function cannot prove that the bytes were produced by `loadOfficialTruthServerOwnedRetrieval` rather than by an in-process caller who copied the success shape and a matching hash. The production registry is empty, so that forged object still cannot become a fact through `officialTruthTrustedFactExtrahieren`. The test seam can extract only when a test supplies a synthetic definition. A later slice that registers a real extractor must keep this function off every route and must not accept a replayed success object as if it were a new server fetch. I am not adding a MAC or a secret in this slice. That would be a different trust mechanism and is not authorized here.
2. This file imports the `server-only` marker and does not import `official-truth-server-owned-retrieval.ts`. That retrieval module imports `node:https` and DNS and opens sockets. The success keys, the MIME pattern, and the redirect cap of 5 are duplicated as comments and constants. If the retrieval boundary changes those, this framework can drift. The duplication is the cost of keeping the extractor free of sockets. I would not "fix" it by importing the retrieval module. The marker is a packaging guard. It is not a route and it does not authorize calling the test seam from `app/`.
3. `regelFaktKanonischLesen` lives in `rule-claims.ts`, which also exports `regelKandidatAkzeptieren`. The extractor file does not name that acceptance function. A later edit that calls it from the extractor would violate this slice. The wrapper itself only returns `regelFaktLesen`.
4. Composition provenance records the policy's field paths, not every key of the canonical fact. `kind` stays on the fact and is not a policy assignment. Single-source provenance records the fact's own keys against the one support. The provenance object is not copied onto the fact, because `regelFaktLesen` would reject it as an unexpected key.
5. Local PostgreSQL 16.15 was installed so the two existing throwaway catalog and store proofs could run `initdb`. The package install did not start the cluster: `policy-rc.d` denied the service start. Those proofs used their own temporary clusters. No remote database was contacted and nothing was applied. The four LOCAL/UNAPPLIED RPCs are unchanged.
6. `docs/ACTIVE_WORK_STATUS.md` is stale relative to this writer. The task forbids that edit. A later continuity slice can move the pointer. This handoff is the record for #780.

## Validation

First delivery on `6ffad6ae`: focused extractor tests 28/28, rule-claim tests 19/19, `npm test` 4546 pass / 0 fail across 766 suites after merging `4c373442`.

Correction on the R1/R2 tree, 0 behind `1e48b59b`: focused extractor tests 29/29. `npm test` 4554 pass / 0 fail across 766 suites. Typecheck pass. Lint 0 errors and 148 pre-existing warnings. Production build pass on Next.js 16.3.8 with 25 static pages. `check:operating-mode`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` pass. `git diff --check` passed. Exact-head CI and Vercel belong to the pushed tip.

## Stop

No Ready. No merge. No source-specific follow-up. The next step is independent Technical-Lead re-review of the exact branch tip after R1 and R2.
