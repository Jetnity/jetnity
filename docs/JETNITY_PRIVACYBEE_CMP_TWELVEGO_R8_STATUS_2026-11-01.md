# Jetnity – CMP / 12Go R8 source release — STATUS

**Stand:** 1 November 2026. Candidate delivered for Root review. Not a PASS. Not Ready. Not a live run.

**PR:** https://github.com/Jetnity/jetnity/pull/1086 draft.
**Branch:** feat/12go-v2-official-search-widget-optin-1.
**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135. **Model:** grok-4.7-high-fast.

## Result

`CMP_RELEASE_AUTHORIZED` is `true`. The kill switch and the exact host `jetnity.com` still gate the banner. DiscoverCars stays null. The selected 12Go row, disclosure revision `twelvego-general-disclosure-v1`, host commit `f056b01d63ac7d61650864734a9b44eb6484989e`, and artifact `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e` are unchanged. `scripts/twelve-go-widget-v2/grant-beobachter.ts` remains blob `2b01b43fa2d13b7226fb72c8ad56bddbbd088374`.

The merge commit parents are the task seed `5b9d0f72a2ebf1c45b16b20b093c4f6ba0c390a5` and accepted main `1914e159b59fcabe55581e25e9762cc333ef17ba`. Re-read `git rev-parse HEAD` for the implementation head. The #1086 delivery comment records it.

## Verification

| Check | Result |
| --- | --- |
| Focused CMP, widget-consent, 12Go widget, and legal PrivacyBee tests | 91 pass, 0 fail, 0 skipped |
| 12Go parent harness `scripts/twelve-go-widget-v2/eltern-nachweis.ts` | exit 0. Production bootstrap with no API fulfilled one local banner and created no preferences control or frame. Explicit false with a ready API created zero banners, preferences, and frames. Positive contexts used the same production bootstrap, one local banner each, and the existing request flow |
| Shared CMP harness | exit 0. Licensed page uses `productionBootstrapSource(null)`. One local banner fixture and no other foreign request |
| `check:dead` / `check:exports` / `check:schema-bezug` / `check:deps` | pass |
| Changed-file ESLint `--max-warnings 0` | pass |
| `npm run build` | pass, 26 static pages |

Native CI and Vercel Preview for the implementation head are reported after push. Earlier gates, including task-seed CI and main `1914e159`, do not cover that head.

No offline test initialized a real CMP, submitted the 12Go form, ran a search, or observed storage or withdrawal on a live host.
