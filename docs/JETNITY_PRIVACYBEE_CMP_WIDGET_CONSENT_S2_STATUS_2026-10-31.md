# Jetnity – PrivacyBee CMP and widget consent S2 — STATUS

**Stand:** 31 October 2026. R4 correction delivered for Technical Lead review. Not a PASS. Not Ready.

**PR:** https://github.com/Jetnity/jetnity/pull/1096 draft.
**Branch:** feat/privacybee-cmp-widget-consent-s2.
**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135. **Model:** grok-4.7-high-fast.

## Result

R4 corrects head `c59be5860bd2f391c4a4273403a293df33bd0bfe` and merges main `36efd23835373f4a9cac28175bbefacc9cc45c58`. `issueWork` returns null until a validated policy is bound. `startLocalContext` does not bind a policy afterwards, so an old unbound token cannot start. A bound policy still retires execution only when one of its own required categories is missing or the API is unusable. The server boundary decides release and kill switch only. It does not pass a null hostname into the host check, and the root layout does not call `headers()`. The exact browser host stays in the bootstrap and in `decideBundle`. `CMP_RELEASE_AUTHORIZED` stays false, so production still renders no CMP client.

The shared store exposes one stable server snapshot and one subscribe/read bridge. Loss of a required category, an unusable API, refusal, withdrawal, close, scope change, reorder, or unmount retires the execution epoch and the provider intent. Renewed execution needs a new explicit selection. An old token stays rejected after regrant, including a token issued before any iframe existed. Informative consent still does not grant a purpose or start a provider.

The positive policy object lives only in the harness. Production `decideBundle` receives a null policy and denies.

## Exact head

This file is inside the correction commit, so it cannot name that commit's own SHA. Re-read `git rev-parse HEAD` and `git rev-parse HEAD^{tree}`. The #1096 delivery comment records both. A newer head invalidates this note.

- Corrected parent: `c59be5860bd2f391c4a4273403a293df33bd0bfe`
- Integrated main: `36efd23835373f4a9cac28175bbefacc9cc45c58`
- `origin/main` and merge-base at delivery: `36efd23835373f4a9cac28175bbefacc9cc45c58`
- Task blob unchanged: `b460b21bdeb2ee4434766fee6b775f594a09a2a0`

## Verification

| Check | Result |
| --- | --- |
| CMP, legal PrivacyBee, and widget-consent tests | 58 pass, 0 fail |
| Harness | exit 0. Licensed `jetnity.com` intercepted one banner URL and fulfilled it locally. The final ledger after interactions, the canary wait, remount, unlicensed hosts, and cleanup was one banner and zero foreign requests. The canary pulsed, then the harness armed the delayed message and saw `armed` with no `delayed` entry. Refusing `ANALYTICS_STORAGE` immediately afterwards removed the frame. During the following 800ms there was no delayed child message and at most one already queued message, which was rejected. A missing API on 127.0.0.1 reached phase `error` without a banner. Viewports 320/390/768/1440 and root 32px had no horizontal overflow |
| `check:dead` / `check:exports` / `check:schema-bezug` / `check:deps` | pass |
| Changed-file ESLint `--max-warnings 0` | pass |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run build` | pass |

Native CI and Vercel Preview for this head are reported from the live check after push. Green CI on `c59be586` does not cover this correction.
