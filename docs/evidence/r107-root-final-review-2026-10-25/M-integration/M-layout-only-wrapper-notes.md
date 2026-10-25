# M layout-only wrapper — reviewable preparation, not execution

The wrapper extracts only the existing `Viewports, Schrift und dichte Seite` block from the retained `mounted.test.ts` (lines 570–614, blob `7b9749ab2dada55d384871f14b2772da61f98db3`, SHA256 `d21a218b8de9f166ba74d9c6b4cb0ba710db1160f467491df50bb2843d539159`). The extraction ledger is `M-layout-only-extraction.json`. This follow-up adds a reviewable wrapper; the earlier CSS recipe is retained unchanged as the record of its previous preparation. No M sync/implementation or new Cursor task is authorized.

## What is preserved and what changes

- The layout block is copied byte-for-byte after indentation normalization. Fixture, all six assertion statements (the width assertion executes four times), 48 cards, long first title/origin, no-date heading, font 32px, widths 320/390/768/1440 at height 900, four screenshot names, and collection instance/marker checks are unchanged.
- Actual helpers `oeffnen`, `oeffnenBei`, `ruhen`, `ergebnis` are copied from the same file. Only TypeScript parameter/return annotations and the `window as unknown as SammlungFenster` cast are erased. The 1280×900 initial viewport, fixed clock `2026-10-25T12:00:00Z`, reduced motion, initial selector wait and the result-helper's two requestAnimationFrame waits are preserved. No added wait, DOM assertion, screenshot case or fixture.
- The monolithic Node test wrapper and its other 17 case groups are omitted. Its two navigation-shim string assertions are outside this extracted block and are not rerun. `merken` records only this one existing group. The layout page now starts in a fresh browser rather than after the other groups in their reused browser; it still uses the identical fresh-page opener and fixture. This is an explicitly extracted layout-only review, never an unchanged rerun of `Navigation, Archiv und Darstellung` or a replay of the old 15 independent observations.
- Harness HTML/body and local server routes match the retained `run.mjs`. The wrapper consumes **already built, root-bound final CSS and final harness JavaScript**. It does not compile CSS or bundle source. This avoids silently reusing sparse-cache CSS or invoking the original runner's whole suite and historical output locations.
- The actual `mount.tsx`, navigation shim and action shim remain source inputs to that later bundle. Preserve the original esbuild settings and only the two original aliases (`next/navigation`, `@/lib/trips/archiv-aktionen`). No audit app route is introduced. The existing Next/React/runtime helpers are not substituted.
- Browser launch is explicit: the original author's `channel: chrome`, or an explicitly bound local executable. There is no fallback. Selecting the retained local Chromium is a disclosed runtime difference from an author Chrome-channel run; the receipt records actual browser/Node versions. Root font 32px is not browser zoom.
- The wrapper adds only input/provenance refusal guards, fresh-output handling and a truthful layout-only execution receipt. Those are plumbing checks, not additional product scenarios/assertions. It never calls Git or manufactures checkout identity.

## Still required before any use

Root must first authorize the actual final M candidate and this bounded execution. The supplied template is deliberately unusable: authorization is `NOT_AUTHORIZED_PREPARATION_ONLY`, identity/paths/hashes are null and browser choice is unset. Missing/placeholder values fail before Playwright import, browser/server start or output creation. This preparation did not execute even those guards.

Use the existing CSS recipe and `M-local-source-candidates.json` to bind every actual-final scanned path to the complete exact Git tree, then bind proof/mounted runtime/support files and dependency bytes. The R3 packet is sparse. `proof-7c-page.tsx` is only a cache for `app/(public)/reisen/page.tsx`; stage it at the real final-tree path. Do not use the cache directory itself as a full source tree. Fetch only missing/mismatched required inputs.

The later `sourceProof` JSON must contain:

```json
{
  "actualFinalHead": "<actual full commit SHA>",
  "actualFinalTree": "<actual full tree SHA>",
  "sourceRoot": "<absolute verified staging root>",
  "completeConfiguredCssScan": true,
  "files": [{"path": "<repository relative path>", "blob": "<final Git blob>", "sha256": "<actual byte SHA256>"}]
}
```

Its `files` must cover the complete final Tailwind scan set, support/config/package files, actual mount/runtime closure, both shims and retained runner/test. The wrapper rehashes those files and checks the required route/runner/mount/shim/support pins. `completeConfiguredCssScan` is a **root-reviewed attestation based on the exact final tree**, not a completeness claim established by the wrapper itself. The wrapper refuses a changed retained runner/test; that would require renewed extraction review.

Compile final CSS using the retained `compileCss()` pipeline with the working directory set to the verified final staging root. Build the actual harness using the retained `run.mjs` esbuild options, outputting to a fresh directory. Verify the bundle input manifest against the same final source/dependency binding; no additional alias, feature, minification setting or matrix. Preserve installed dependency versions under the lock-bound dependency root. Capture a separate artifact receipt:

```json
{
  "actualFinalHead": "<actual full commit SHA>",
  "actualFinalTree": "<actual full tree SHA>",
  "sourceProofSha256": "<hash of the completed sourceProof JSON>",
  "cssSha256": "<hash of final CSS bytes>",
  "bundleSha256": "<hash of final bundle bytes>",
  "completeBundleInputsBound": true,
  "dependencyRoot": "<absolute retained node_modules root>",
  "packageLockSha256": "<hash of final bound package-lock.json>",
  "dependencyVersions": {"postcss": "8.5.23", "tailwindcss": "3.4.17", "autoprefixer": "10.4.21", "tailwind-scrollbar-hide": "4.0.0", "tailwindcss-animate": "1.0.7", "esbuild": "0.25.9", "playwright": "1.55.0", "tsx": "4.20.5", "next": "16.4.1", "react": "19.2.8", "react-dom": "19.2.8"}
}
```

Record compilation/bundling commands, versions and actual input completeness evidence alongside that receipt. Its booleans are also root-reviewed provenance attestations, not facts established merely by setting fields. The wrapper hashes the receipt and checks its head/tree/source-proof/output/dependency correspondence; it does not prove GitHub provenance or build provenance independently.

Complete a **new** copy of the binding template, filling all paths/hashes and authorization `ROOT_AUTHORIZED_ACTUAL_FINAL_M_LAYOUT_ONLY` only after root approves execution. Choose a fresh output directory below `/tmp/r107-mytrips-r3-review/integration-final-<actual-head-prefix>/` containing at least the actual head's first eight characters, outside staged source and not already existing. Historical packets remain untouched. The wrapper writes only its new receipt and four new screenshots; it reads the separate prebuilt artifacts.

The future invocation is `node <absolute M-layout-only-wrapper.mjs> <absolute completed binding JSON>`, using the root-selected recorded Node runtime. This is documentation, **not an instruction to run it now**. No wrapper, syntax check, test, CSS compilation, bundle build, browser or prospective final proof has been executed by this preparation.

No historical compiled M CSS output/hash exists. This future check would be a new actual-final layout observation, not reconstructed historical execution. The original 18-group author run, 15 independent Ownership observations and Query observations retain their original heads/runtimes/limits. App/Auth/Preview, TL acceptance, Ready and merge remain separate root gates.
