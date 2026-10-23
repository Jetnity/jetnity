# Jetnity Lodging Coverage Truth 1 — STATUS

**Cursor-Agent: Jetnity Lodging Coverage Truth 1 — Cursor Generation 1**

Status: **implemented, stopped for independent Technical-Lead review.** Not Ready. Not merged. Not TL PASS.

## Identity

- Session: https://cursor.com/agents/bc-398f20b4-a2c0-4c54-bcc6-177bea4c1a3e
- Session id: `bc-398f20b4-a2c0-4c54-bcc6-177bea4c1a3e`
- Requested and actual model: `grok-4.7-high-fast` (`originalModelName`). Not Auto. No fallback.
- UI title renamed with the supported chat-title tool to the exact logical name.
- Branch `fix/lodging-coverage-truth-1`. PR #983. Issue #980. Lane B only.
- Immutable TASK blob `5d424fd82ae5334aca79e999e3078101b8b4e44b`, unchanged.
- `origin/main` re-read after the ordinary merge: `be0a8b68765e25dc3216dc1f61bfd4620af3e134`, tree `84ace80a3a474b125ef7a0bbc60330d53067f7ef`. Parents `ba0725d6dd2ce3d5e170eb1eab03cedef2def1de` and `0d52570500dea5c314c28235250a812676f7799e`. It had not moved past that pinned SHA. Merge-base is that main SHA. After this evidence commit the branch is 8 ahead and 0 behind. No rebase, force-push, or cherry-pick.
- Exact implementation head is the branch tip after the commit that adds this file. The PR comment carries that SHA. This file does not quote its own commit.

## What changed

`UnterkunftBestand` keeps the canonical summary whenever any stay has coverage status `unknown`, qualifies provisional gap counts, and uses `istGebucht(item)` for the seal and the booking callback. R1 also keeps every canonical-unknown stay row from showing a normalized date span. A missing endpoint still says `Zeitraum noch nicht bestimmbar` and `Der Zeitraum fehlt oder ist unvollständig bzw. ungültig.` An invalid or reversed pair does not show the `zeitraumKurz` span; that line is only the uncertainty sentence. Dated, empty, full, partial, and out-of-period presentation is unchanged. No evaluator, formatter, booking helper, schema, action, type, or persistence edit.

## Verification already run

- Final regression on the seed panel: 7 tests, 5 failed, 2 passed. The failures are the unknown-heading, unqualified-gap, and stored-booking cases.
- Same regression on the repaired panel: 7 passed, 0 failed.
- Existing `unterkunft-manuell`, `naechte-abdeckung`, `buchung`, and `direct-lodging-coverage-preview-1` tests passed.
- `npm run typecheck` passed. `npm run build` passed (Next.js 16.4.1). Owned-file ESLint passed.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and `check:operating-mode` passed. Schema check still lists the pre-existing LOCAL/UNAPPLIED RPCs; this lane did not add one.
- Setup check warned that no `.env` / `.env.local` is present. No secret-gated check was treated as a pass.
- No hosted database, Auth, provider, secret, personal browser, or real-device run. Render tests are not browser evidence.

## R1 row correction

Same session, Technical-Lead review of `0dafbfca179c65347b03a83b3bbff5b77c0d6e71`. The sentence added on `64f7c510` still left `zeitraumKurz` in the row, so `2026-02-29` rendered as `1. März – 2. März` beside `Gebucht`. R1 suppresses that span on every canonical-unknown stay, including a non-manual provider stay with no date editor and a second stay that already covers every night. `Gebucht` and `(id, false)` stay. The two row assertions fail on `0dafbfca` (`doesNotMatch` sees `1. März – 2. März` and `10. Sept. – 1. Sept.`) and pass on this head. `64f7c510` also fails the same assertions because the March span remains next to the sentence.

## I1 pinned merge

R1 was already on the remote at `9840d965cac3ca43e87c02862acfdc1fc18a7188` before this merge. The booked-row test now reads the rendered `Gebucht` badge span. The stay titles contain lowercase `gebucht` and are not that badge. Ordinary merge commit parents are the badge-test commit and pinned main `be0a8b68765e25dc3216dc1f61bfd4620af3e134`. No conflict. `naechte-abdeckung.ts` arrived only from that merge and was not edited. The row regressions, manual-stay tests, coverage tests, preview test, and the merged interval tests then passed together: 76 passed, 0 failed. `tsc -p tsconfig.json --noEmit` passed on the merged tree.

## Risks

P0: none. P1: #968 and the #748 privacy residual remain open and outside this lane. P2: the evaluator can still return numeric totals beside the unknown summary; the panel prefers the summary. Provisional gaps still show the canonical uncovered date span, with a qualified count. P3: exact-head CI, Auth, and Preview belong to the pushed tip and are not claimed green here. Main push CI for #984 and Production remain the Technical Lead's post-merge check.
