# R106 T — future-head residual acceptance v3

**Prepared only. Not executed.** Root owns source review and execution. This file does not grant Technical-Lead PASS or establish a fix.

## Exact change

`trip-r2-residual-acceptance-v3.ts` is derived from the corrected `trip-r2-residual-acceptance-v2.ts`. The only changes replace the fixed `4e66d894` admission with an explicit lowercase 40-hex expected-head requirement and refusal of these previously defective deliveries:

- `4e66d8948046423656feb6b95b8562e546e82b19`
- `80006fdf1443ca9d75d8c481246821354da16000`
- `b218c33d9d00c19f3705aba8bd208cc455272659`

A different hash is not a substitute for independent source review or ancestry validation. The actual new delivery must first be inspected and explicitly supplied with `--head`. The existing common guard still binds checkout HEAD, committed source manifest, source blobs and guarded bundle metadata to that same exact commit. Node 22 and fresh external output requirements remain unchanged.

The complete body beginning with `const context = prepareRun(options, [` through EOF is byte-identical to corrected v2: **19091 bytes**, SHA256 **`bcd91ed0bb8c338020b98befcf3b135ae6d5d31ef1ae9b474d04560ab53310a9`** in both files. Every fixture, action, observation, assertion, boundary and verdict rule is preserved. The purpose string still refers to the original R2 residual cases because no semantic probe text was changed.

| Artifact | SHA256 |
| --- | --- |
| Corrected v2 source | `cadc046f5e192da84aa6471e2d0d3285c6bc16844fce091c7487b4f80322372f` |
| Future-head v3 source | `f7cfc670d8055d7ce0f906c340131ee9905a96d3de7d233c03506ab47fc8a7d0` |
| Shared body in v2 and v3 | `bcd91ed0bb8c338020b98befcf3b135ae6d5d31ef1ae9b474d04560ab53310a9` |
| Head-admission-only diff | `23eca233f203f5b02f09ad9e6329ef890536d926feb421998b869edd178ac4d2` |
| Preserved v2 raw run at 4e66d894 | `98b6f573c0c30f7c2e89d1b44eeb0507bf122aa0a462af2cf324b11af64a8ebc` |

`trip-r2-residual-v3-provenance.json` records full paths, byte sizes, source hashes, preserved-input hashes and the static comparison. `trip-r2-residual-v3-head-guard.diff` contains the full two-hunk source difference.

## Historical evidence remains separate

The first residual source and raw run remain untouched. Cases 1 and 3 in that first run stopped at setup TypeErrors and are not product findings. Corrected v2 introduced exactly six semicolons; its preserved raw run2 reaches all three actual failing assertions at `4e66d894`:

1. A previously confirmed create retains an unqualified current-visible receipt after both raw Account canonical data and displayed data report absence.
2. Late A completion steals focus from the unopened B edit control after a trusted natural pointer-to-row and Tab sequence. That recorded run used **no programmatic focus fallback**.
3. Discarding an unknown-delete reconciliation revives the older create's false current-visible receipt while canonical data remains absent.

The existing v2 result is `BOUNDED_ASSERTION_FAILED`, with three assertion failures and zero external requests. No v3 result exists at preparation. Root's run2 exit status and subsequent review decision are separate execution evidence; this preparation does not execute or infer a new result.

## Required review before a future run

Inspect the actual new author head and its diff first. Revalidate workflow exports, the real builder and fixture, the author `flaeche.tsx` Host bridge, relevant DOM selectors, receipt semantics and parent/control focus ownership. The required bridge operations remain `setzen`, `entfernen`, `lesen`, `schreibenFreigeben`, `schreibenScheitern`, `lesenFreigeben`, `reiseSetzen` and `kanonischSetzen`.

Generate a source manifest from the new head's committed Git objects and a fresh guarded bundle for the same checkout/head. Do not reuse the old 4e66 bundle or change an old result's head field. Use a fresh result path. If an intentional production/fixture contract change requires an external probe adjustment, preserve this v3 and create another explicitly explained derivative; do not silently weaken these assertions.

Root may then use the established invocation structure from the exact new checkout:

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/r106-review-browsers \
/root/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node \
  --import ./scripts/server-only-test-register.mjs --import tsx \
  /tmp/r106-review-evidence/trip-r2-residual-acceptance-v3.ts \
  --repo <new-exact-checkout> \
  --head <independently-inspected-new-40-hex-head> \
  --sources <committed-new-head-manifest.json> \
  --bundle <fresh-guarded-new-head-bundle.js> \
  --bundle-info <fresh-guarded-new-head-bundle-info.json> \
  --out <fresh-external-new-head-result.json>
```

All placeholder arguments require explicit replacement before execution. This is invocation documentation only; it was not run during preparation.

## Unchanged boundaries

The probe mounts the actual production list/hook under the inspected author's Host, with synthetic deferred adapters and passive event logging. It uses default Chromium, unstyled 390×844 HTML and real pointer/keyboard operations. The fallback branch, if needed by a future browser, remains explicitly labelled as a bounded onFocus-contract arrangement; it cannot be silently claimed as a natural complete keyboard journey.

This does not cover project CSS, real guest storage, full TripWorkspace, Next router, hosted Account, Supabase/RLS, Preview or Production. Those require their separate evidence. The original five R2 acceptance probes, their results, all residual v1/v2 artifacts and product files remain unchanged.
