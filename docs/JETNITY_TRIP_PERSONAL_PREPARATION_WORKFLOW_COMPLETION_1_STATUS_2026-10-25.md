# Trip Personal Preparation Workflow Completion 1 — STATUS

Date: 2026-10-25. Writer: **Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1**. Session `bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3`. Model `grok-4.7-high-fast`. Draft PR #1009. Tracking #1006 stays open.

**Status: R3 corrections and the accepted-main merge are on `44e1a1c41d2e4939524d2b11996c7baa6a1b0056`. This docs commit is the review head and does not change runtime or the runner. STOP for independent Technical-Lead re-gating. Not product PASS. Not Ready. Not merged.**

R3 behavior parent: `577e7da70374159bfe2e0ae33b9d4c7cfad2368d`. Merge parents: that behavior commit and accepted main `77ed41adbd3d32bbc995300b61eef1e16c2710d6`. Merge-base is now `77ed41adbd3d32bbc995300b61eef1e16c2710d6`. Relation after the merge and before evidence docs commit `19ac02ae34a05cf6e2636313e8fda316782959a2`: **0 behind / 13 ahead**. Main had not moved past `77ed41ad`. No rebase, no force-push, no direct main write. Immutable TASK blob `961e288a4e0ba40fa00e7ea95e920eabd6423ff2`. PLAN blob `e58f582669793ff3b7d86727ac9130afa89eef98`, unchanged. Mode `NORMAL`.

T-R3-D1 corrects only the claim that `unstyled/browser-lauf.json` hashed the runner. That JSON records `kopf` `44e1a1c41d2e4939524d2b11996c7baa6a1b0056` and 10 behavior and test hashes. It does not include `browser-lauf.mjs`. `PROVENANCE.md` separately records runner blob `b4c1b52cbf9c89fcd0783bdb83ac174455514903` as an author statement. That older run did not record a machine-checked clean-tree before-and-after runner witness. Prior delivery `19ac02ae34a05cf6e2636313e8fda316782959a2` stays in history. This wording commit does not change runtime, tests, the runner, or raw evidence.

`41844878a8437256572da3de1374fbb36fd7a516` is the accepted O merge, not Account. Account candidate 29 merged later as `77ed41adbd3d32bbc995300b61eef1e16c2710d6` at 12:46:47Z. Its actual-main run [40194636884](https://github.com/Jetnity/jetnity/actions/runs/40194636884) passed, and root then authorized T-I1. The earlier STATUS sentence that put A on main at `41844878` was wrong.

Reviewed head that R3 required to change: `4e66d8948046423656feb6b95b8562e546e82b19`. R2 behavior `760afc59` and its evidence stay. Fresh evidence is `docs/evidence/trip-personal-preparation-workflow-completion-1/2026-10-25-r3/`.

## R3

- A qualifying account, guest, or manual read records the personal refs it actually saw. A confirmed or reconciled create stays in history. Once that latest read omits the ref, the receipt uses the existing absence sentence and does not say "Gespeichert und im aktuellen Stand sichtbar." A canonical read that still contains the ref keeps that sentence while the displayed row is behind. Discarding a newer local receipt does not restore the visibility claim. Drafts and write counts stay put. The phase of the historical create stays `confirmed`.
- The unopened "Titel bearbeiten" button and the submit button take focus on focus. A trusted focus on the row itself does too. The completion's programmatic row focus is marked and does not count, including when that focus event is trusted. Status, delete, search, editor, and filter cases stay.
- T-I1: normal merge of accepted main `77ed41ad`. Inherited O/A files match that main. The post-merge diff against main is the owned T slice.

## Not done

- Technical-Lead exact-head re-gate of the commit that contains this file. Product PASS, Ready, and merge are not claimed.
- Fresh native App, Auth, and Preview for `44e1a1c4` and for this docs commit. Older green runs do not cover this head.
- Hosted Account, full Next router, Supabase, RLS, or Production proof from these local suites.
- A fresh full local `npm test`.
- Closing #1006, writing main, or starting a follow-up.
