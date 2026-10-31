# Jetnity – PrivacyBee CMP and widget consent S2 — STATUS

**Stand:** 31 October 2026. R3 correction delivered for Technical Lead review. Not a PASS. Not Ready.

**PR:** https://github.com/Jetnity/jetnity/pull/1096 draft.
**Branch:** feat/privacybee-cmp-widget-consent-s2.
**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135. **Model:** grok-4.7-high-fast.

## Result

R3 corrects head `9cdc994837cea59636f10cf3ca78e286c3146219`. A bound policy retires execution only when one of its own required categories is missing or the API is unusable. An unrelated optional refusal does not expand the requirement to every advertising category. The server boundary decides release and kill switch only. It does not pass a null hostname into the host check, and the root layout does not call `headers()`. The exact browser host stays in the bootstrap and in `decideBundle`. `CMP_RELEASE_AUTHORIZED` stays false, so production still renders no CMP client.

The shared store exposes one stable server snapshot and one subscribe/read bridge. Loss of a required category, an unusable API, refusal, withdrawal, close, scope change, reorder, or unmount retires the execution epoch and the provider intent. Renewed execution needs a new explicit selection. An old token stays rejected after regrant, including a token issued before any iframe existed. Informative consent still does not grant a purpose or start a provider.

The positive policy object lives only in the harness. Production `decideBundle` receives a null policy and denies.

## Exact head

This file is inside the correction commit, so it cannot name that commit's own SHA. Re-read `git rev-parse HEAD` and `git rev-parse HEAD^{tree}`. The #1096 delivery comment records both. A newer head invalidates this note.

- Corrected parent: `9cdc994837cea59636f10cf3ca78e286c3146219`
- Parent tree: `c4b4a8983ff0605281471f27066530017c55d2ff`
- `origin/main` and merge-base at delivery: `b7ebc399b92303eacda9afdaa1786f245492051f`
- Task blob unchanged: `b460b21bdeb2ee4434766fee6b775f594a09a2a0`

## Verification

| Check | Result |
| --- | --- |
| CMP, legal PrivacyBee, and widget-consent tests | 58 pass, 0 fail |
| Harness | exit 0. Licensed `jetnity.com` intercepted one banner URL and fulfilled it locally. The final ledger after interactions, the canary wait, remount, unlicensed hosts, and cleanup was one banner and zero foreign requests. The early start called `startLocalContext` after the listeners and while no banner script existed; the reason was `no_provider_intent`, nothing was created, and the hook return value did not authorize a script. On 127.0.0.1 the same gate returned `host_unlicensed`. The canary emitted active and pulse messages. Refusing `AD_STORAGE` left that frame running. Refusing `ANALYTICS_STORAGE` removed it. During the following two seconds there was no delayed child message and at most one already queued message, which was rejected. A missing API on 127.0.0.1 reached phase `error` without a banner. Viewports 320/390/768/1440 and root 32px had no horizontal overflow |
| `check:dead` / `check:exports` / `check:schema-bezug` / `check:deps` | pass |
| Changed-file ESLint `--max-warnings 0` | pass |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run build` | pass |

Native CI and Vercel Preview for this head were not observed. Green CI on `9cdc9948` does not cover this correction.
