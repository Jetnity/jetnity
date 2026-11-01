# Jetnity – CMP 12Go selection — STATUS

**Stand:** 31 October 2026. Source delivered for Technical Lead review. Not a PASS. Not Ready. Not a live widget.

**PR:** https://github.com/Jetnity/jetnity/pull/1098 draft.
**Branch:** feat/privacybee-cmp-twelvego-selection-1.
**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135. **Model:** grok-4.7-high-fast.

## Result

The 12Go production row is the frozen selected record. DiscoverCars remains null. `CMP_RELEASE_AUTHORIZED` remains false, so the public facade still returns no capability from the production bootstrap. `PrivacyBeeCmpPreferences` renders the official class only when the baked gate allows, the browser host is `jetnity.com`, and the store phase is `ready` or `denied`. Refusing `ANALYTICS_STORAGE` leaves an explicit read, so the control stays. Missing, error, kill, unlicensed, and release-false states render nothing. The footer mounts that component and does not redesign the rest of the footer.

`TWELVEGO_PRODUCTION_DISCLOSURE` is the factual interface for the separate 12Go author. This branch does not mount it into a trip or change S1 informative consent.

## Exact head

This file is inside the delivery commit, so it cannot name that commit's own SHA. Re-read `git rev-parse HEAD` and `git rev-parse HEAD^{tree}`. The #1098 delivery comment records both.

- Task blob: `b1ffeaab607637fbd7fb62c27814d02e892836c1`
- Seed: `80dec9b808c42a04beb9607223a5c6127a5237fb`
- Integrated main: `32445c90c2d33695cbd8f69ea3cb7498768dda67`
- Original S2 task blob: `b460b21bdeb2ee4434766fee6b775f594a09a2a0`
- Amendment blob: `056591a183ea3d9ef5ce98dcd7ba348a2725d0ea`

## Verification

| Check | Result |
| --- | --- |
| CMP, legal PrivacyBee, widget-consent, preferences, and production-facade tests | 65 pass, 0 fail, 0 skipped |
| Real 12Go row | Production bootstrap returns null for `twelvego` when the necessary categories and `ANALYTICS_STORAGE` are true and the other optional categories are false. A test-only allowing bootstrap consumes that same narrow shipped row once, leaves check true, and still denies DiscoverCars |
| Harness | exit 0. Licensed `jetnity.com` fulfilled one local banner. The page rendered the production `Footer`, including its grid and links. The new `footer [data-cmp-preferences="footer"]` control was clicked and keyboard-activated, including after `ANALYTICS_STORAGE` refusal. The older `main [data-cmp-preferences="ready"]` control was clicked separately. The footer control disappeared on the broken API and returned when the API was restored. The unlicensed production-bootstrap page showed the real footer links, the disclosure, and no preferences control, and the facade request created no frame. Final ledger: one banner, zero other foreign requests. The production footer at 320/390/768/1440 and 32px root font had no horizontal overflow |
| `check:dead` / `check:exports` / `check:schema-bezug` / `check:deps` | pass |
| Changed-file ESLint `--max-warnings 0` | pass |
| `npx tsc -p tsconfig.json --noEmit` | pass, also as part of `npm run build` |
| `npm run build` | pass, 26 static pages |

Native CI and Vercel Preview for this head are reported from the live check after push. Green CI on main `32445c90` does not cover this branch.
