# W actual integration candidate — source binding and CSS comparison

Read-only helper: `/root/world_review`. This is a bounded evidence report, not Technical-Lead acceptance, Ready or merge authority.

## Candidate and scope

- Exact head: `1343f8b9e20e68166e2e12cc7880f7eb3cff980c`.
- Exact tree: `d732487b09c3245c9c22e38b38bb030c8aa181cf`.
- Root-supplied main/merge-base: `30119c5affbd391cce31f2ceade2e4b068dfbcba`; 18 ahead / 0 behind.
- Root's normalized recursive tree contained 8,359 entries and `truncated: false`. Its tree identity, and all 69 owned / 128 incoming path blobs in root's binding map, were cross-checked before staging. Their source paths and SHA256 hashes are retained in `identity.json`.
- This helper used those exact root-fetched records. It did not perform a new remote PR poll or independently repeat root's history, native CI, Preview or final-handoff review.

## Source and historical evidence binding

| Binding | Result |
| --- | --- |
| Final-tree Tailwind scan inputs | 1,319 / 1,319 exact Git blob matches |
| CSS/config/package support files | 5 / 5 exact Git blob matches |
| c68 bundle repository inputs | 54 / 54 match both historical SHA256 and final-tree Git blobs |
| Retained bundle dependency inputs | 1,689 / 1,689 historical SHA256 matches |
| Author source/proof receipt inputs | 12 / 12 match both historical SHA256 and final-tree Git blobs |
| Dense40 fixture | Historical SHA256 and final-tree Git blob match |

The isolated `css-inputs/` directory contains 1,290 baseline-cache files, six exact W overrides, twelve exact incoming T files, eleven exact incoming D files, and five support files. Every staged file was verified again after copying. The final tree, rather than the older cache's inventory, defined the path set. No missing content required a remote fetch. This is a bounded CSS input snapshot, not a full current checkout. Held implementation was not semantically inspected.

The fixture remains Git blob `0d49da5b7eb448800f57191334867633a1e75ac7`, SHA256 `d2771930f5392fcd5b31889857c82241220ff4d6d70a5fd401aa438aea84aa14`. The retained c68 bundle remains SHA256 `f7dc37368b4329fe865d0e3f38799357f109050ab436d4c6be10e1a483e1fa31`.

Historical execution labels are preserved: the a547 packet has seven passing interaction cases and an aggregate exit of 1 from the then-failing layout case. Its unchanged receipt SHA256 is `720914cf7c029e9f6fda211446b983f9f3360393bd7b67ee087a66baf8b0c318`. The subsequent c68 layout correction was previously reviewed separately. None of these historical executions is described as a fresh run on 1343.

## Actual final CSS result

`compile-final-css.mjs` ran once, from the exact staged CSS-input root, using the retained PostCSS → Tailwind nesting/Tailwind → Autoprefixer pipeline. It preserved the c68 form exclusion plus exact raw TSX content treatment. It did not bundle the app or start a browser.

| CSS | SHA256 | Bytes |
| --- | --- | ---: |
| Historical c68 | `b1ca9a5fdfee85f34812d64c71cb7d643ff5ae7b74ce9c89e939401d7b6586cc` | 129,304 |
| Actual 1343 | `ba1f5238e5afcbc42d134de5e6820f206143db8b175b5168123d83bce4207a67` | 129,687 |

**The CSS is not byte-identical.** The complete delta is 383 inserted bytes / 23 inserted lines. No historical CSS line was removed or modified. Six utility rules were added:

| Utility class | Added declaration |
| --- | --- |
| `grid-cols-[minmax(0,1fr)_minmax(0,1fr)]` | `grid-template-columns: minmax(0,1fr) minmax(0,1fr)` |
| `lg:grid-cols-none` | `grid-template-columns: none` within the existing lg media block |
| `[&>*]:min-w-0` | Direct children: `min-width: 0px` |
| `[&>*]:max-w-full` | Direct children: `max-width: 100%` |
| `[&_input]:max-w-full` | Descendant inputs: `max-width: 100%` |
| `[&_select]:max-w-full` | Descendant selects: `max-width: 100%` |

This is a precise input/output delta, not evidence of a geometry regression. W-applicable rule equivalence has not been established in this step. Therefore the historical layout cannot be rebound by claiming CSS identity.

The compiler exited 0 on Node 24.22.1 with the retained dependency versions. PostCSS returned no warning objects; the process emitted the existing Browserslist data-age notice. No updater or install ran. This supplemental runtime is not root's native Node 22 gate.

## Subsequent bounded applicability check

At root's request, a later lexical check examined only the exact retained bundle, its 54 bound repository inputs, dense fixture and geometry runner. All six new class tokens are absent, including decoded literals and composed closed-template values. The 43 remaining known class constructions resolve to fixed constants/maps or the harness's closed class-prop chains. The added rules therefore cannot match this specific harness. `APPLICABILITY.md` gives the reasoning and limits; `lexical-applicability.json` records all 57 input bindings and the 310 class sites. This supports W-harness applicable-rule equivalence without claiming whole-page equivalence or a fresh geometry execution.

## Remaining root decision

No browser or test ran. Root decides whether the bounded applicable-rule equivalence is sufficient to rebind the historical geometry evidence. No interaction replay or new matrix is justified by the observations here. Native CI, Preview, fresh head checks and final acceptance remain root's responsibility.

## Records

- `identity.json`, `css-input-manifest.json`: exact tree provenance and all staged input hashes.
- `historical-bundle-source-binding.json`, `author-receipt-binding.json`, `fixture-binding.json`: historical/final byte bindings.
- `historical-execution-binding.json`: honest historical execution labels.
- `compile-final-css.mjs`, `css-comparison.json`, `execution-record.json`, `final.css`: actual command, runtime, output and limits.
- `css-delta.patch`, `css-delta.json`: complete insertion-only CSS difference.

All output is isolated under `/tmp/r107-world-r1-review/integration-1343`. Earlier packets were not overwritten. No source implementation edits, external writes, installs, hosted calls, browser runs, tests, scope expansion or acceptance action occurred.
