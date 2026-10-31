# Jetnity – PrivacyBee CMP and widget consent S2 — STATUS

**Stand:** 31 October 2026. R2 correction delivered for Technical Lead review. Not a PASS. Not Ready.

**PR:** https://github.com/Jetnity/jetnity/pull/1096 draft.
**Branch:** feat/privacybee-cmp-widget-consent-s2.
**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135. **Model:** grok-4.7-high-fast.

## Result

R2 corrects head `8c48cc09b21606bc5067aeddaa8003c04e665768`. The server boundary decides release and kill switch only. It does not pass a null hostname into the host check, and the root layout does not call `headers()`. The exact browser host stays in the bootstrap and in `decideBundle`. `CMP_RELEASE_AUTHORIZED` stays false, so production still renders no CMP client.

The shared store exposes one stable server snapshot and one subscribe/read bridge. A lost category, an unusable API, refusal, withdrawal, close, scope change, reorder, or unmount retires the execution epoch and the provider intent. Renewed execution needs a new explicit selection. An old token stays rejected after regrant, including a token issued before any iframe existed. Informative consent still does not grant a purpose or start a provider.

The positive policy object lives only in the harness. Production `decideBundle` receives a null policy and denies.

## Exact head

This file is inside the correction commit, so it cannot name that commit's own SHA. Re-read `git rev-parse HEAD` and `git rev-parse HEAD^{tree}`. The #1096 delivery comment records both. A newer head invalidates this note.

- Corrected parent: `8c48cc09b21606bc5067aeddaa8003c04e665768`
- Parent tree: `219da69a0e79d461711b5fe5ce2ca10bf85b69c9`
- `origin/main` and merge-base at delivery: `b7ebc399b92303eacda9afdaa1786f245492051f`
- Task blob unchanged: `b460b21bdeb2ee4434766fee6b775f594a09a2a0`

## Verification

| Check | Result |
| --- | --- |
| CMP, legal PrivacyBee, and widget-consent tests | 57 pass, 0 fail |
| Harness | exit 0. Licensed `jetnity.com` intercepted one banner URL and fulfilled it locally. The final ledger after interactions, remount, unlicensed hosts, and cleanup was one banner and zero foreign requests. www, widgets, the lookalike, and 127.0.0.1 made no banner request. The page loaded compiled globals and `styles/white-mint.css`; both light ancestors were present and the canvas was `rgb(247, 252, 249)`. The real client and boundary mounted. An early optional start ran before any banner script and stayed blocked. The sandboxed canary posted its epoch and was removed on category loss. A replay of that epoch after regrant, close, and remount was rejected. A missing API on 127.0.0.1 reached phase `error` without a banner. Malformed API did the same. Viewports 320/390/768/1440 and root 32px had no horizontal overflow |
| `check:dead` / `check:exports` / `check:schema-bezug` / `check:deps` | pass |
| Changed-file ESLint `--max-warnings 0` | pass |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run build` | pass |

Native CI and Vercel Preview for this head were not observed. The green CI on `8c48cc09` does not cover this correction.
