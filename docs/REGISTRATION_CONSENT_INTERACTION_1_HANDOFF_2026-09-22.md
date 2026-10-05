# Registration Consent Interaction 1 — HANDOFF

Stand: 22. September 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Same session as the first delivery. Same Generation 1 writer. Review correction only.

## For the next reader

Read in this order:

1. `docs/REGISTRATION_CONSENT_INTERACTION_1_TASK_2026-09-22.md`
2. Independent TL review `5276799852` on `9132adb595d18fd1fd65f8fd14a54d072ec1950b`
3. `docs/REGISTRATION_CONSENT_INTERACTION_1_STATUS_2026-09-22.md`
4. `docs/REGISTRATION_CONSENT_INTERACTION_1_SELF_REVIEW_2026-09-22.md`
5. `docs/evidence/registration-consent-interaction-1/interact-before.json`
6. `docs/evidence/registration-consent-interaction-1/interact-after.json`
7. Recaptured 200% shots: `screenshots/after-chromium-iphone-390-layout-200pct-390.png`, `screenshots/after-chromium-320-layout-200pct-320.png`
8. Live Draft PR #540 head, comments, CI, Auth, Vercel — not remembered IDs

## Exact coordinates

| | |
| --- | --- |
| Agent | Jetnity registration consent interaction 1, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) |
| Session | `bc-76b92d07-81a0-42b4-9b87-9827d868cadc` |
| Issue / PR | #539 / #540 |
| Branch | `fix/registration-consent-interaction-1` |
| Product baseline | `main@fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee` |
| Task seed | `824286f69e8eae560999a9f4d0e0869390c280cc` |
| First delivery head | `9132adb595d18fd1fd65f8fd14a54d072ec1950b` (historical; CHANGES REQUIRED) |
| Correction wrap | `eb1e7bc1` |
| Correction harness | `44b8bb58` |
| Correction docs | `60fc04c9` |
| Authorized merge | `faf7bf0d772ab208f0a75f9df1d96e0769db5480` (parents `60fc04c9` + `5fee5f66`) |
| After-run capture | `interact-after.json` `productTree.head` = `faf7bf0d…` clean |

The live branch HEAD after the evidence/docs persist is the gate. Re-read `git rev-parse HEAD` and GitHub; do not treat remembered IDs as current.

## What changed in the review correction

- `components/auth/RegisterForm.tsx`: long German legal link words wrap via `break-words` + `[overflow-wrap:anywhere]` on the existing consent `Label` and its two `Link`s. `flex-1` keeps the label in the remaining row width. `</Label>` remains. Copy, destinations, `stopPropagation`, default unchecked, submit gate and `handleRegister` consent check unchanged.
- `docs/evidence/registration-consent-interaction-1/harness.tsx`: same wrap classes; `LegalLink` no longer `preventDefault`s or records a fake navigation array; isolated `?layout=consent`; preceding Tab start field.
- `docs/evidence/registration-consent-interaction-1/interact.mjs`: real Tab; real same-origin `/terms` and `/privacy` request+URL; optional label text click; 200% metrics vs `documentElement.clientWidth` / link bounds / `scrollWidth`.
- `lib/ui/checkbox-interaction.test.ts`: wrap lock + legal-block must not `preventDefault`. Markup is not interaction proof.

`components/ui/checkbox.tsx` was not changed in this correction. Admin #538 files were not touched.

## What the evidence does and does not prove

Proves (hydrated Chromium, compiled product Checkbox/Label + consent-row harness):

- one mouse click / one 390 touch tap / one external label click / optional component label click each toggle once
- real Tab from a preceding field lands on the native `#terms` checkbox, then Space checks and revokes
- clicking `/terms` or `/privacy` issues a same-origin request, navigates to that path, and does not fire a consent `change`
- 320/390 at 200% text: legal links stay inside `documentElement.clientWidth`; document `scrollWidth` equals `clientWidth`

Does **not** prove:

- physical iPhone or Safari (WebKit unavailable)
- full Next `/register` route, authenticated session, or production navigation
- that `/terms` and `/privacy` exist as product pages (they still 404)
- Ready, merge, or Production

## What the Technical Lead should decide

1. Independent exact-head re-review of the frozen implementation head (not this prose).
2. Whether emulated Chromium + honest WebKit-unavailable is enough, or a real iPhone/Safari Preview check is required before Ready.
3. Confirm the single authorized `5fee5f66` merge is the only extra parent and #538 remains untouched.
4. Ready/Merge only after that review and remaining exact-head gates. Cursor will not.

## What the next Cursor writer must not do unless a new versioned task says so

- Touch Admin #538 files or duplicate that session
- Change signup, Auth, roles, MFA, DB, legal copy or consent bypass
- Rebase, force-push, or merge main again
- Mark Ready, merge the PR, or start a follow-up slice

Immediate further review corrections reuse this session.
