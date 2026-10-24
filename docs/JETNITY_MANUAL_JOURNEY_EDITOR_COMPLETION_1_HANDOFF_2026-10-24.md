# Manual Journey Editor Completion 1 — HANDOFF

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Session URL: https://cursor.com/agents/bc-02fbe98d-97ba-4c0b-a3b0-10857d784379
Model: `grok-4.7-high-fast`
Issue: #998
Draft PR: #1001
Branch: `fix/manual-journey-editor-completion-1`

## Exact git at authoring

| | SHA |
| --- | --- |
| live `origin/main` | `43124e28f0c2ac366d25a86787f055b885b1fc00` |
| merge-base | `43124e28f0c2ac366d25a86787f055b885b1fc00` |
| accepted plan | `e763caa51b0213bd3c0e71afe948b00ab402eb5d` |
| ADDENDUM V2 | `a0106b362eb837107f43d05f307cf59cb0611e43` |
| CODE REVIEW V4 input | `be2c4932fc58d0bdca78e91cc7837a666201715f` |
| runtime / `headAtRun` | `b356fd9ff1215174511bd59a0eddc27206e47f69` |
| runtime tree | `de25e46694a26405d9e3b7635fc0caf578a14cb7` |
| in-place V4 evidence | `860b35d93819aa551c98a7b810648bde54db1df8` |
| in-place V4 tree | `e4464eb4087361c0e25e8fbd3f946b85b9076fd1` |
| preservation head | the commit that adds this handoff |
| V4 archive | `docs/evidence/manual-journey-editor-completion-1/v4-b356fd9f/` |

`origin/main` was fetched again before this preservation. It is still `43124e28`. The merge-base is that commit. `860b35d9` is **17 ahead / 0 behind**. This preservation commit is its child. No rebase and no sibling merge. Integration remains **A → C → B**. B was not touched.

## What this head contains

A pending stay save keeps the surface generation it had before its callback. A different manual stay editor can take focus ownership. The same editor still receives success and error focus. Preset keys encode the normalized tuple. The suspend baseline is captured before the transition starts. The connection alert is unchanged.

Connection hash: `75e3838db77f502469a8e5f4705c182ccaa1e50dbc53ff6fd162d07bf8de118a`.

Unterkunft blob `72fb6146d72bb30cf796687620894a26a57dd25e`. Flight blob `a0d356466e9a28f31ae0249e42670bd099887b85`. Mobilitaet blob `a3b1fbac4494001daa3aef7da2b21c4106d3ceec`. Helper blob `4c141abbff7ce365167dd2df31bb1d59f3092757`.

## Proof executed

The run below was executed once, at `b356fd9f`, and first stored in place by `860b35d9`. This preservation commit copies those bytes. It does not run them again. Commands, `headAtRun`, port, browser, and timestamps inside the copied JSON still name the original execution paths.

- Focused node tests on `b356fd9f`: **104 pass / 0 fail**.
- Harness: PASS, 22 named groups, 9 layout measurements, Chrome 148.0.7778.96, port 39311, `headAtRun` `b356fd9f`. Behavior and layout diagnostic arrays are empty.
- Preserved at `docs/evidence/manual-journey-editor-completion-1/v4-b356fd9f/result.json` (blob `f56befddfa0d65f9ec39bb24c57e014ebef83e4d`) and `v4-b356fd9f/rerun-provenance.json` (blob `8d319a07da41b470a7adbaae05b260d569a50ec1`).
- R103 and R104: PASS under the lane evidence directories. Historical 16 files sha256-identical. The V4 R104 result is `v4-b356fd9f/r104-organisieren-action-recovery/result.json` (blob `ab5bf98ac306438aaede439e4bb25796aea2a5f2`). The V4 wide screenshot is `v4-b356fd9f/r103-manual-mobility-pending-draft-guard/screens/wide-1280-pending.png` (blob `c40449fa2e3e4b107e85c531111e51bc213d2c9e`).
- The four original paths are restored to the `be2c4932` blobs `bc054afb87c390cf76c77709a5428097c80f7ce6`, `3da8a04325cbac8b09f16b52c7cfaf10788dab5a`, `4dd2d75f4c0a7b7a18c983c277084089cdb13be0`, and `1a3f6f6e60d0532ee73f121094273a87e018e1e8`.
- On `b356fd9f`: typecheck 0, lint 0 with 144 warnings, five guards 0, production build 0. Those commands were not repeated for `860b35d9` or for this preservation commit. `git diff b356fd9f -- components lib scripts` is empty.

## Limits

Playwright Chromium did not launch. Native CI for the preservation SHA is the GitHub check on that commit, not a result stored here. A green check on `b356fd9f` or `860b35d9` does not cover it. Preview, hosted account, screen reader, native zoom, and a physical device are not verified. `db:*` and `auth:pruefen` were not run. No product rerun was done to relocate the evidence.

## Stop

Author does not Ready, merge, close #998, or start a follow-up. Next actor is the Technical Lead.
