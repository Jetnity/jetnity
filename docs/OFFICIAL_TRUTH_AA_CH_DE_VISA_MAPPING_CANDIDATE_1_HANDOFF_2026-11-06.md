# Official Truth — AA CH→DE Visa Mapping Candidate 1
## Author HANDOFF — 2026-11-06 — STOP for independent root review

**Status:** implementation and bounded local proofs complete; not Technical Lead PASS, source admission, a live visa service, or completion of #917. No Ready/Merge or follow-up performed.

## Identity and exact task

- Author: **Jetnity AA Visa Mapping Candidate 1 — Codex Generation 1**.
- Actual author session: `/root/aa_visa_mapping_candidate_writer`; root is Technical Lead. Cursor remained paused; no Cursor tool/spend.
- Tracking #1146; Draft PR #1147; branch `feat/official-truth-aa-ch-de-visa-mapping-candidate-1-20261106`.
- Accepted main: `b42e4b33598783fc2ca385e16d399d2d8fdb2aa7`; tree `ed99c9271de097e781fc09c7b35c70f6b15d4668`.
- Seed: `c34528a5b8ab4784cdcca8072b41328ba5fbc3b7`; tree `1f8b4bd8512ac2a30e358b8ed8b4b56b826f01c5`.
- Immutable TASK v1 Git blob: `5e4550e40f0d50b283c7f25749bef9bc2982cdaf`, locally reproduced before and after implementation. TASK was not edited.
- [#1145 post-merge closure](https://github.com/Jetnity/jetnity/pull/1145#issuecomment-6697689013), [§3a selection](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6697693724), [binding dispatch](https://github.com/Jetnity/jetnity/pull/1147#issuecomment-6697730826).
- Workdir: `/workspace/scratch/fca0aa91f0dd/aa-visa-mapping-candidate-work`, a partial exact baseline mirror, not a Git checkout. Root publishes only the seven paths below after review; author made no remote mutation.

## Implemented behavior and boundaries

Two small server-only modules contain the deeply frozen reviewed manifest and unregistered candidate ApplicationContract/OfficialTruthExtractorDefinition. The extractor is immutable `current=false`; actual contract lookup remains `null`, pilot remains disabled, and AA identity/extractor registries remain unchanged. Neither production module directly imports content-identity or the identity candidate, including types. There is no public pin/configuration factory, setter or environment switch.

The private guard independently runs for both `match` and direct `extract`. It validates the canonical scope/key/date with the existing parser, exactly CH citizenship plus linked CH passport, DE destination/no transit, visa/requirement_effect, primary-statement quality, exact schema, one support, no policy, full identity/version/URL/MIME binding, numeric protocol 2 and the complete body's canonical protocol selection. The unchanged V2 helper must reproduce both the support hash and frozen reviewed pin `fc34bb51f8493a8776b6a300c8aed493a4a4fe08fba269148292ed7d9a334979`. The unchanged S1 decoder must independently recognize the unqualified `Schweiz | Nein` row.

The single conditional fact is `{kind:'requirement_effect', effect:'not_required', visaMode:'visa_exempt'}`. No stay duration, residence/work rights, passport remaining validity, transit or blanket entry permission is inferred. The application owns ordinary-passport/tourism/direct-route and current linked traveller/document assertions. The source need not reproduce those narrower product terms.

The fixed application window is **2026-11-07 through 2026-11-13 inclusive**. It is not a legal validity period. The same complete-body recognition returns legal bounds `{validFrom:null, validUntil:null}`, otherwise validity refuses with `null`. Request/final URL, redirects, freshness, custody and canonical acceptance remain the existing application's responsibility.

Actual contract digest: **`668a84286d09c085adda49ada6ee9c75cae2ce348a63122f3b5d601221c492f6`**. Its fixed ordered, domain-separated projection covers mapping/contract version, scope/window, full identity and source metadata/pin, coverage, extractor/policy, fact and versioned recognition/null-validity semantics. Independent Node SHA-256 reproduces it; changed pin/window/meaning produces a different digest. No rolling extension or automatic re-pin.

The full pin detects outside-row global restrictions, hidden table ancestors and unrelated footnote changes. S1 is not claimed to interpret them. Only existing CRLF/CR→LF normalization is accepted; hash equality is neither raw-byte identity nor proof of origin. Even harmless body changes require renewed review.

## Changed-file manifest

Only these seven paths are publication changes. The first three and handoff are additions; architecture/roadmap/decisions are append-only, with each original byte prefix preserved.

| Path | Git blob |
| --- | --- |
| `lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source.ts` | `e00f71f993fe558d657ca409436ee62410869b25` |
| `lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.ts` | `d2233cd7f882d46520ce59df1281875fe912e097` |
| `lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts` | `6c680c2fa1cb486da9eff85e5695dc2951f4562f` |
| `ARCHITECTURE.md` | `d6bebb19e6ee2d3d25a9d15116f4fe45d7e4b455` |
| `ROADMAP.md` | `3f0253e3a4e710de145888b44e1588f55a5beb25` |
| `DECISIONS.md` | `fd896ff36d416a7a9ee320a7ee841dd065e06b47` |
| `docs/OFFICIAL_TRUTH_AA_CH_DE_VISA_MAPPING_CANDIDATE_1_HANDOFF_2026-11-06.md` | Self-blob sealed in the author's final manifest outside this file to avoid a self-referential hash. |

The exact-base mirror was completed for 12 missing unchanged type dependencies through GitHub at the accepted main SHA: application `result.ts`, `official-truth-coverage.ts`, `official-truth-fact-entry-authority-server.ts`, `lib/supabase/server.ts`, `lib/trips/{account-graph-read,foundation-e-select,abbildung,liste-grenze,reisen-uebersicht,zuordnung}.ts`, and `lib/readiness/{persistenz,reisende}.ts`. Each Git blob was recomputed from the exact returned bytes before writing, preserving EOF. They are **not publication changes**. No dependency/package installation occurred.

## Actual local validation

Environment: Node `v24.22.1`, TypeScript `5.9.3`, existing dependency symlink. Canonical CI uses the repository's Node 22 configuration; local evidence does not replace it.

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-skip-pattern='full repository candidate import isolation' lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.test.ts
node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/readiness/official-truth-ch-de-application-pilot-1/application.test.ts lib/readiness/official-truth-source-fingerprint-v2.test.ts lib/readiness/official-truth-aa-visa-table-identity-candidate.test.ts
```

- Focused final candidate run: **85 passed, 0 failed**, exit 0. The full-checkout guard was explicitly excluded by the local CLI pattern, not weakened or made conditional in source.
- Unfiltered final candidate run: **85 passed, 1 failed**, exit 1. The sole failure is the required complete-checkout marker `app` absent from this partial mirror. No full isolation PASS claimed.
- Existing application/V2/AA identity run: **77 passed, 1 failed**, exit 1: application 54, V2 5 and identity behavior 18 passed; the unchanged AA production-isolation guard also fails on absent `app`.
- Production-root TypeScript program for `reviewed-source.ts` and `mapping.ts`, using actual `tsconfig.json` options with `incremental:false`: **0 diagnostics**, exit 0.
- Test-root TypeScript program: **0 candidate-file diagnostics**; **15 transitive baseline/environment diagnostics** remain from missing files/packages in this partial mirror, including Next and `@supabase/ssr`. This is not a full typecheck PASS. Both programs were invoked with Node/TypeScript's real `createProgram` and `getPreEmitDiagnostics`, not transpile-only results.
- Full repository test/import isolation, canonical lint, Next type generation/build, hygiene and all GitHub Actions gates remain for a real exact checkout. No local full build/CI success is asserted.

Exact final TypeScript probe (combined exit 1 because of the disclosed transitive diagnostics; the separately executed production-only program exited 0):

```sh
node --input-type=module - <<'NODE'
import ts from 'typescript'
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile)
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd())
for (const names of [['reviewed-source.ts','mapping.ts'],['mapping.test.ts']]) {
 const roots=names.map(name=>'lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/'+name)
 const diagnostics=ts.getPreEmitDiagnostics(ts.createProgram(roots,{...parsed.options,incremental:false}))
 const candidate=diagnostics.filter(d=>d.file?.fileName.includes('/official-truth-ch-de-aa-visa-mapping-candidate-1/'))
 console.log(JSON.stringify({roots:names,allDiagnostics:diagnostics.length,candidateDiagnostics:candidate.length}))
 console.log(ts.formatDiagnostics(candidate,{getCanonicalFileName:p=>p,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}))
 if(diagnostics.length)process.exitCode=1
}
NODE
```

The successful 93,365-byte synthetic application executes actual candidate callbacks through the existing isolated canonical registry and its same private WeakMap witness. Actual Evidence/Review packet creation, trusted extraction, execution consumption and rule acceptance each succeed once; Requirements returns exactly one `not_required / visa_exempt` visa evaluation and leaves all other cells unknown. Test instrumentation returns the original canonical results; it fabricates no trusted extraction, AcceptedRule or execution witness. Only external application ports and the test-only reviewed-data import/current copy are substituted.

Adversarial proofs cover wrong/stale/recomputed hashes, source identities/versions/URLs/MIME/protocol, protocol-1-sized data with a matching V2 hash, multiple supports, fact/schema/scope/policy/quality, citizenship and linked document mismatches, both inclusive window boundaries and invalid/missing/outside dates, nonordinary passports/other purposes, truncation on both sides of the protocol threshold, over-limit/invalid UTF text, CRLF normalization, and full-context changes. Swiss Ja/qualifier/marker/duplicate/conflicting/hidden row and missing/ambiguous table each reject even with a matching synthetic pin. Direct extraction is exercised before match; body failures also refuse validity. Failed application paths leave every evaluation unknown. The unchanged real pin refuses synthetic bytes.

## Findings, remaining gates and costs

| Priority | Author finding / limitation |
| --- | --- |
| P0 | No new implementation defect found in bounded author review; independent root review remains authoritative. |
| P1 | No new implementation defect found. Existing hosted authority, real source/transport admission and production activation gates remain blockers to any live result. |
| P2 | Partial mirror cannot establish complete import isolation, full transitive typecheck, build or full CI. Both asserting isolation failures are disclosed above and must pass in the real checkout. |
| P3 | Full-source change sensitivity and the fixed pilot window are intentional; changed pages/windows require separately reviewed version/digest. No automatic update path exists. |

First hosted Stage-1 apply success remains known; denied independent Development readback remains pending. Stage 2 is **NOT_ATTEMPTED**. No retry, rephrasing, rerouting, delegation or source-store substitute was used. Effective #1139 owner/session correction remains pending; the existing #1142 local candidate was not rebuilt. Held #1131/#1135 work was not copied. Existing owner authorization was not re-requested.

No SQL/migration/RLS, credentials, grants, database calls, source request, source/rule admission, raw government HTML retention, registry activation, dependencies, workflows or timeout changes. No new infrastructure or recurring costs. The prior [source-use/privacy review](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6697201431) remains scoped evidence, not blanket raw-copy permission.

**STOP.** Root independently repeats meaningful proofs, reviews exact published blobs and completes the full real-checkout gates before any Ready/Merge decision. This author starts no follow-up.
