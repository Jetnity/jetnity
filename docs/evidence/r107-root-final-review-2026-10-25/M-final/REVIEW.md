# R107-M final bounded residual review

## Result and authority

No remaining blocker was found in this assigned correction scope at candidate `444a8c254e11688120f7f2b6e49193746932a865`, tree `93d4734c6a28abfa676d25540158fedb852f99bc`. This is read-only root-helper evidence, not Technical-Lead PASS, Ready, merge approval, or a full native/Preview gate.

Candidate has 15 commits ahead / 0 behind baseline main `a74c443c6be3f064f150fcf021ab6154bda325e5`, 50 total changed paths, and remains Draft. The independently executed runtime source is `96715e43f9c979a542a1b7bd5acc2b15ef494c5d`, tree `d734a39f5f97228f076a8d12e37e02b71257a0ae`. The 96715→444a comparison contains only four lane delivery documents, one JSON receipt, and four screenshots. No product or test source differs in that tail.

Same-session delivery comments #6400998543 (updated 17:58:53 UTC) and #6401131188 (17:59:17 UTC) identify the exact runtime/candidate heads, the 18-case author proof, and STOP for root review. Original identity remains Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1; session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`; `grok-4.7-high-fast`.

## Empty invalid addresses: corrected

The only runtime product change since f711 is in `lib/trips/reisen-sammlung-abfrage.ts`, `ungueltigeAdresse` lines 254–267: present string values are retained even when empty. Valid requests still take `sammlungHref`; parser acceptance rules do not change.

The earlier four concrete counterexamples were rerun against the exact new source:

| Input | Entry | Invalid alert before late valid props | Alert after late valid /reisen props | Adopted address remains |
|---|---|---|---|---|
| archiv= | Initial deep link | true | true | /reisen?archiv= |
| archiv= | In place | true | true | /reisen?archiv= |
| cursor= | Initial deep link | true | true | /reisen?cursor= |
| cursor= | In place | true | true | /reisen?cursor= |

Deep-link browser search is unchanged across the later envelope. The in-place navigation seam keeps the same observed live address; the collection instance remains stable. No archive writer is invoked by those address changes or result deliveries. A separate mounted `q=` case stays valid, normalizes live/adopted address to `/reisen`, and remains valid after another matching envelope.

## Rejection before a trip read

An independent direct probe invoked the actual candidate `sammlungAnfrageAus` and `reisenSammlungAusParametern` with an injected `from()` trap. For `{ archiv: '' }` and `{ cursor: '' }`, parserAccepted=false, invalid=true, rows=[], problem=null, and fromCalls=0. The returned envelope and client canonical helper agree on the distinct raw-invalid address. The trap would throw if the table boundary were entered. For `{ q: '' }`, the actual parser accepts and both route construction and canonical helper return `/reisen`.

This executes the real reader's early rejection path, with no hosted client, SQL, Auth, or storage access. It is not an assertion about hosted RLS. The two selected address/reader test-file invocations also exited 0; the direct probe provides explicit case-level results in addition to that runner output.

## Existing correction coverage retained

The preserved bounded mounted packet also reran repeated q/archiv/cursor deep-link and in-place invalid adoption, invalid/no-read archive observation through acknowledgement and later valid empty observation, and same-ID missing-provenance pending/acknowledged/unknown feedback. Those assertions remain satisfied. Restoration remains unavailable without provenance. Navigation does not repeat the mutation.

The visible owner copy still names the adopted query, keeps it visible while a different live query is named, and preserves the independent input draft (`separate-draft`). No draft-contract change was made in the residual correction. Original navigation, archive hooks, action components, and ownership component bytes remain unchanged since the preceding review.

## Proof, scope, and delivery fidelity

All ten source SHA256 and Git blob entries in `run-96715e43f9c979a542a1b7bd5acc2b15ef494c5d.json` match the exact candidate source. The author receipt identifies the clean runtime head/tree, exit 0, and 18 case groups including both empty-parameter regressions, the original three fixes, and the visible owner line. TASK remains blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777`. The one changed PLAN paragraph documents this requested empty-invalid behavior; it does not change parser acceptance or draft semantics.

The four delivery documents explicitly disclose that full npm test, full lint and several hygiene checks were last executed at 7c, while current typecheck/build/focused address checks/mounted proof are bound to 96715. This helper does not promote those historical checks to exact-head gates. Root owns the native/Preview/full-candidate review.

The author runner continues compiling actual project CSS with PostCSS nesting, Tailwind and Autoprefixer. The independent mounted replay also compiles and injects the actual project CSS, retains only the existing action/navigation seams, and records CSS/config/source hashes.

## Independent execution and artifacts

Mounted command: `PLAYWRIGHT_BROWSERS_PATH=/tmp/r106-review-browsers node --import tsx root-r3-probe.mjs`. Exit 0, 15 bounded observations, no browser page errors. Runtime Node v24.22.1 and existing Chromium 140.0.7339.16: exploratory mounted evidence, not native Node-22 acceptance.

Direct boundary command: `node --import ./scripts/server-only-test-register.mjs --import tsx root-r3-pre-read-probe.mjs`. Exit 0, explicit two invalid-boundary cases and valid-empty-search normalization. Uses existing repository test loaders, no downloads or installations.

Retained artifacts: `root-r3-results.json`, `root-r3-run.log`, `root-r3-probe.mjs`, `root-r3-pre-read.json`, `root-r3-pre-read.log`, `root-r3-pre-read-probe.mjs`, `root-r3-address-unit.log`, `proof-source-binding-96715.json`, and `docs-tail-binding.json`.

All earlier review packets remain untouched. No implementation, external comment, hosted operation, held-branch work, broad test expansion, Ready, or merge was performed.
