# AA document identity candidate 1 — implementation handoff

**Date:** 6 November 2026. **Author:** Jetnity AA Document Identity Candidate 1 — Codex Generation 1. **Session:** `/root/aa_identity_candidate_writer`.

**Status at author handoff:** implemented and locally exercised; independent Technical-Lead review and repository CI remain separate gates. This is an unregistered, `current=false` identity candidate. It does not make the entry-requirements feature available on jetnity.com.

## Task and decision

- Baseline: `9f3553602066d1e11171eaf36e720c2ac21061f8`, operating mode NORMAL.
- [R6 v2 implementation task](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6691564914), following [R6 v1 public research](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6691379699).
- [Technical-Lead CHANGES REQUIRED R1](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6691907939) was addressed by this same author/session before publication. Its closure is the Technical Lead's decision.
- [Technical-Lead CHANGES REQUIRED R2](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6692018076) authorized the bounded HTML-only compatibility rule below after reproducing indirect foreign-context breakouts. This same session implemented the correction; independent closure remains with the Technical Lead.

The existing AA table decoder already matches the observed document structure. The missing component addressed here is deterministic document identity. Rewriting the table parser or raising a shared byte limit would not solve that problem. This candidate implements the existing `ContentIdentityProfileDefinition` contract without importing itself into any live registry or changing another file. Its only runtime dependencies are Node's `util` and the existing pinned parse5 8.0.0 package; the shared identity contract is a type-only import.

Only three new repository files belong to this delivery: the candidate module, its test module, and this handoff. There is no migration, API, UI, authorization, source-catalog, retrieval, budget, fingerprint, provider, dependency or cost change. It does not copy the held #1131/#1135 work.

## Source observation, with its actual limits

The prior public research step requested the already selected URL once:

`https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820`

| Property | Observed value |
| --- | --- |
| Observation time | `2026-11-06T17:43:05.712457Z` / 18:43:05 Europe/Zurich |
| HTTP status / final URL | 200 / unchanged exact requested URL |
| Redirects | No redirect followed or observed by that bounded request |
| Content type | `text/html;charset=UTF-8` |
| Bytes retained | 93,365 |
| Research snapshot SHA-256 | `97cece7aacf60de10a9a8fb28c1bb649382d9cf1436c18b55efbbe9b0cdd7f2a` |
| Content-Length / Content-Encoding / Last-Modified | Absent in the observation |
| Native parse5 inspection | 3,244 nodes, maximum depth 21, zero foreign-namespace elements; one unrelated duplicate-attribute parse error |

The snapshot is not committed. This is a research observation and a local parser exercise, not a server-owned retrieval receipt, HTTP response-completeness witness, accepted Evidence, rule, source admission or legal-validity determination. The candidate never fetches a URL or reads this scratch snapshot itself. Tests use minimal synthetic HTML.

## Conditional identity contract

The verifier requires one explicit HTML document, head, body, main and title, with German locale; the exact canonical and Open Graph URL; the observed AA author/site labels, article type and title; one article H1 in the actual main tree; and one native content-ID comment identifying `207820`. The separate accessibility welcome H1 is permitted. Head metadata must actually belong to the head and fall inside its source range. The H1's DOM and source ancestry must agree.

`aa-content-id` is a Jetnity namespace for the observed numeric content ID. `auswaertiges-amt` is a Jetnity ASCII label mapped to the observed publisher text; it is not an externally issued authority identifier. Descriptor `expectedSchema: article` denotes the observed Open Graph article representation, not an independently established CMS schema. The verifier preserves coherent caller-owned local source/item/representation IDs and versions; it does not fabricate a catalog registration.

The comment's observed internal version 44 is deliberately not pinned. A changed version or publication display does not by itself change document identity. The publication display 03.06.2026 is not treated as a legal start date. Visa-table values are not inspected by this identity verifier: changing the synthetic or research Swiss visa cell does not produce, validate or alter a legal verdict.

Success returns only a fresh, frozen seven-field identity tuple in a frozen result. The profile itself is frozen, is absent from the live profile registry, and has `current=false`. Input objects are not modified or frozen. Extra fields, non-data properties, proxy objects, incoherent descriptors and altered/extra authority labels fail closed.

## Parser boundaries and review corrections

Input is capped at 131,072 UTF-8 bytes and code units, 10,000 DOM nodes, depth 64 and 64 parse errors. Invalid UTF-16, NUL and a leading BOM fail closed. These are candidate parser bounds, not a permission to retrieve larger responses.

parse5 can discard duplicate document tags and move HTML out of an SVG/MathML wrapper without reporting a parse error. An instance-local subclass of the pinned parse5 Parser observes document-tag counts, foreign-markup entry/context and identity-tag source ranges before repair. Every token is forwarded unchanged to the existing parser. There is no global prototype patch, replacement tokenizer or regex-based HTML parser. This uses parse5's exported but internal Parser API; a package upgrade requires the regression suite and an explicit review of that dependence.

The observed AA source contains no foreign-namespace markup. Under the explicit R2 decision, this candidate therefore rejects all actual SVG/MathML entry tokens or foreign parser contexts, including unrelated graphics. Guarding only H1 or a list of individual breakout tags would miss a preceding nonidentity token that had already left the foreign context. Native parser callbacks distinguish real markup from literal SVG/MathML strings in scripts and comments; those strings remain inert. A future genuine AA markup change introducing SVG/MathML requires review and is not automatically admitted.

The H1 and native-ID ancestor chains reject foreign/active/inert containers, explicit hiding and inline styling. Source ranges reject misplaced head anchors and foster-parented headings. Duplicate anchors inside templates are counted but cannot establish identity. Strings in scripts or comments cannot substitute for DOM metadata.

Visibility checking is limited to DOM attributes, known hiding classes and inline styling. External CSS, script execution and actual browser visibility are not evaluated or claimed. An explicit closing tag is a structure check, not proof that an HTTP message was complete.

The actual page contains an H2 with an identical repeated `data-js-atom="navigation-heading"` attribute in unrelated navigation. The limited parse-error allowance therefore retains duplicate attributes only outside **all** identity-capable tokens and the protected H1/native-ID ancestry. Other parse-error classes fail closed. This is not a general HTML-conformance verdict.

R1 exposed why selecting protected nodes only after parsing was insufficient: an initial nonidentity `rel`, `name` or `property` value could conceal a discarded second canonical/author/Open Graph attribute. All actual `html`, `head`, `body`, `main`, `title`, `h1`, `link` and `meta` start tokens are now classified before retained attribute values or DOM repair can hide their role. The three reported contradictory-attribute cases are regression fixtures, as are SVG/hidden-wrapper breakouts.

## Verification performed by the author

The isolated scratch runtime used Node 24.22.1, TypeScript 5.9.3 and parse5 8.0.0 with entities 6.0.1. Existing dependency archives were checked against the baseline lockfile's SHA-512 integrity values; no repository manifest changed. The repository itself targets Node 22, so its real CI remains required.

1. The candidate and test file were transpiled with the pinned TypeScript compiler. The scratch test copy changes only the relative module location to the transpiled candidate. `node --test --test-name-pattern='AA identity candidate:' tests.mjs` executed **18 selected tests: 18 PASS, 0 FAIL**. Their mutation matrices exercise document/metadata drift, duplicate and discarded attributes/tags, foreign namespaces, hidden ancestors, inert strings, malformed objects, UTF-8 bounds and DOM limits. The R2 test includes the three exact indirect breakouts, an earlier nonidentity breakout, and unrelated actual foreign markup; script/comment foreign-markup strings remain accepted as text.
2. The existing 93,365-byte research snapshot passed the candidate on source SHA-256 `02eeae9e5206d4be0eec6bfd8aaf87e83564e9ece8a9b43e958ed6f67d6e9863`. The author's rerun of the Technical Lead's expanded actual-snapshot diagnostic passed **21/21 cases**, including all three R1 attribute regressions and all three R2 indirect foreign breakouts. Earlier narrower runs do not replace this final check. This is author evidence, not independent Technical-Lead PASS. Synthetic descriptor labels were used; origin, message completeness and legal applicability remain unproven.
3. A strict isolated semantic typecheck passed for both new TypeScript files using the six required type declarations extracted unchanged from the baseline identity contract and existing lockfile Node types. This diagnostic does **not** check the actual application dependency graph or replace the repository's typecheck.

The full-repository production-isolation test is present but intentionally was not selected in the partial scratch checkout. It requires the actual `app`, `components`, `hooks`, `lib`, `scripts` and `types` trees and checks for live imports/references, registry inclusion, runtime dependencies and effectful code. It must execute in repository CI. No local full application test, lint/hygiene run, Next.js build, Preview or Production verification is claimed in this author handoff.

## Remaining delivery and product gates

The Technical Lead must independently read all three files, reproduce the relevant findings, verify the exact published head's CI/Auth/Preview, decide Ready/merge, and verify actual-main CI/Production after merge. A changed head invalidates earlier head-bound gates. The author does not mark Ready, merge or start another slice.

Even a merged and passing candidate leaves the first real application path unfinished. #917's denied Development readback and #1131's separate restriction remain unresolved; the target-bound owner/session correction under #1139 is not applied by this work. A coherent, reviewed AA source/body-budget/fingerprint/extractor/application binding and genuine source custody still have to be established before runtime admission and end-to-end testing. The generic provider and existing pilot availability remain off. No accepted government fact, database write or visitor answer was created here.
