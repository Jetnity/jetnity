# Manual Journey Editor Completion 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`
Issue: #998
Draft PR: #1001
Branch: `fix/manual-journey-editor-completion-1`

## State

CODE REVIEW V4 product repairs remain in the runtime commit below. CODE REVIEW V5 preserves that already-executed proof under a distinct directory and restores the four paths `860b35d9` had replaced. This is not a Technical-Lead PASS, not Ready, and not merged. No product file was edited for V5, and the V4 run was not executed again.

- TASK V1 blob `abf6f8f6edc3448b519c9b5370724cfac9b38f10`, accepted PLAN blob `09d936699a0ba16ba035ceea74d6c00bb530bebd`, and ADDENDUM V1 blob `d0bcd55c7feea575f44dc39e176f11d5a0d2cc9a` are unchanged.
- ADDENDUM V2 blob `7ef1b8a9883e841b25f1df4e2f3483b26f756ede` is the fast-forwarded TL commit `a0106b362eb837107f43d05f307cf59cb0611e43`.
- Accepted main `43124e28f0c2ac366d25a86787f055b885b1fc00` was merged with a normal merge. It was fetched again before this preservation and is still that SHA. Merge-base is that main. No unexpected main commit appeared.
- Runtime / harness `headAtRun`: `b356fd9ff1215174511bd59a0eddc27206e47f69`, tree `de25e46694a26405d9e3b7635fc0caf578a14cb7`.
- In-place evidence commit `860b35d93819aa551c98a7b810648bde54db1df8`, tree `e4464eb4087361c0e25e8fbd3f946b85b9076fd1`, is **17 ahead / 0 behind** that main. This preservation commit is its child.
- `sourceSha256` in the archived harness result binds the four implementation files at `b356fd9f`. The command, path, port, browser, and timestamp strings inside that file were not rewritten.

## Evidence preservation

ADDENDUM V2 requires distinct new outputs while the prior proof stays in the current tree. Commit `860b35d9` had replaced four pre-V4 paths in place. Those V4 bytes, and the associated C/R103/R104 artifacts from that same run, are copied unchanged under `docs/evidence/manual-journey-editor-completion-1/v4-b356fd9f/`. That directory is an archival relocation of the run already executed at `b356fd9f`. It is not a new execution. `archive-manifest.json` maps each original execution path to the preserved path, git blob, and sha256. The 23 copied files match the blobs at `860b35d9`. The manifest itself is new and is not one of those 23 files.

The four original paths are restored from reviewed `be2c4932fc58d0bdca78e91cc7837a666201715f`:

| Path | Restored blob |
| --- | --- |
| `docs/evidence/manual-journey-editor-completion-1/result.json` | `bc054afb87c390cf76c77709a5428097c80f7ce6` |
| `docs/evidence/manual-journey-editor-completion-1/rerun-provenance.json` | `3da8a04325cbac8b09f16b52c7cfaf10788dab5a` |
| `docs/evidence/manual-journey-editor-completion-1/r104-organisieren-action-recovery/result.json` | `4dd2d75f4c0a7b7a18c983c277084089cdb13be0` |
| `docs/evidence/manual-journey-editor-completion-1/r103-manual-mobility-pending-draft-guard/screens/wide-1280-pending.png` | `1a3f6f6e60d0532ee73f121094273a87e018e1e8` |

Every other evidence path outside `v4-b356fd9f/` matches `be2c4932`. `git diff b356fd9f -- components lib scripts` is empty. TASK, PLAN, and both addenda stay byte-identical.

## Review findings addressed

- C-P2-CODE-04: a stay save captures the manual-stay surface generation before its callback. A later interaction in a different manual stay editor advances that generation, so the older success, domain, and rejection paths do not move focus. The same editor still receives its own success button focus and its own error alert. The draft and the real outcome remain. Escape, Abbrechen, and the toggle still focus the trigger of the editor being closed.
- C-P2-PROOF-04: `suspendRenders` is read before `suspendConnection` and `suspendFlightTrip`. `awaitSuspend` waits for an increase from that baseline. The committed-context assertions are unchanged.
- C-P3-CONTEXT-05: `vorgabeSchluessel` JSON-encodes the existing normalized tuple. Schema-accepted presets `origin a\u001fb` / stage `c` and `origin a` / stage `b\u001fc` now have different keys. Identical presets keep the same key. The trip schema and character policy are unchanged.
- P3 diagnostic separation from `9b11323d` remains. Behavior and layout lists are still stored and asserted separately.

## Counting

`behaviorCount` 22 is named scenario groups. It is not an execution count and not an assertion count. Three late-R1 groups execute 9 times. `flight-pending-a-newer-b-keeps-focus` executes 6 times. `stay-current-owner-focus` executes 3 times. `stay-pending-a-newer-b-keeps-focus` executes 6 times. `layoutCount` 9 is separate.

## Not claimed

The preservation SHA `961fa594` has a recorded CI result in the next section. A green check on `b356fd9f` or `860b35d9` does not cover it. Preview, a hosted account, a screen reader, native zoom, and a physical device are not a PASS inside this commit. No database, provider, payment, or new cost. Author does not Ready, merge, close #998, or start a follow-up.

## Native CI on `961fa594`

Run [40135029902](https://github.com/Jetnity/jetnity/actions/runs/40135029902) on preservation head `961fa594792b5c07f2e8423b31690f433f858fab` finished with Auth passed and the Vercel deployment completed. Typecheck, Lint & Build failed. The only failing suite was `lib/trips/lodging-coverage-truth-1.test.ts`: `bedienung` calls `UnterkunftBestand` as a function and had stubbed `useState` only. The parent `useRef` calls threw `Cannot read properties of null (reading 'useRef')`. Eight subtests failed. This commit adds a stable `useRef` slot in that stub and resets it with the state index. The assertions are unchanged. The local rerun of that file is 9 pass / 0 fail. Product files are unchanged from `b356fd9f`. Native CI for this repair commit starts on push and is not claimed green here.

Next actor: Technical Lead, exact-head review of the repair commit. The V4 proof to inspect remains `docs/evidence/manual-journey-editor-completion-1/v4-b356fd9f/`.
