# Jetnity – PrivacyBee CMP and widget consent S2 — STATUS

**Stand:** 31 October 2026. R5 review-fix on the production capability seam, delivered for Technical Lead review. Not a PASS. Not Ready. Not a widget.

**PR:** https://github.com/Jetnity/jetnity/pull/1096 draft.
**Branch:** feat/privacybee-cmp-widget-consent-s2.
**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** bc-dc782027-b7e1-4592-a7ae-b4f709161135. **Model:** grok-4.7-high-fast.

## Result

The production seam sits on the R4 controller. `requestProductionExecution`, `checkProductionExecution`, `consumeProductionGrant`, and `releaseProductionExecution` are the only public operations. There is no exported caller-authority factory. Request, check, and consume read the booleans the bootstrap already baked (`releaseAllowed`, `killDenied`). A missing, malformed, or denied gate fails closed. The facade does not read `PRIVACYBEE_KILL_SWITCH` and does not receive a caller policy, API, host, or kill value. `issueWork` still returns null until a validated policy identity is bound. `startLocalContext` still does not bind afterwards. Both shipped policy rows are null. `CMP_RELEASE_AUTHORIZED` is false. A record is accepted only when its provider, policy id (`/^[a-z0-9-]{1,64}$/`), 40-hex commit, non-placeholder revisions, origin, path, artifact, protocol revision, and sandbox tokens match that provider. The sandbox requires `allow-scripts` and `allow-same-origin`; `allow-forms` and `allow-popups` are optional known tokens; top-navigation is rejected. It does not pass a null hostname into the host check, and the root layout does not call `headers()`. The exact browser host stays in the bootstrap and in `decideBundle`. `CMP_RELEASE_AUTHORIZED` stays false, so production still renders no CMP client.

The shared store exposes one stable server snapshot and one subscribe/read bridge. Loss of a required category, an unusable API, refusal, withdrawal, close, scope change, reorder, or unmount retires the execution epoch and the provider intent. Renewed execution needs a new explicit selection. An old token stays rejected after regrant, including a token issued before any iframe existed. Informative consent still does not grant a purpose or start a provider.

The shipped table stays null. The mounted positive path and the offline probe alias only the test module `scripts/privacybee-cmp-widget-consent-s2/politik-mock.ts`. That module returns a synthetic record when the harness sets `__jetnityUseFixturePolicy`. Production `decideBundle` still receives a null policy and denies.

## Exact head

This file is inside the correction commit, so it cannot name that commit's own SHA. Re-read `git rev-parse HEAD` and `git rev-parse HEAD^{tree}`. The #1096 delivery comment records both. A newer head invalidates this note.

- Amendment seed: `3b39b8c6b48f33e4f37d6a14018f7556cc9ce614`
- Amendment blob: `056591a183ea3d9ef5ce98dcd7ba348a2725d0ea`
- Original S2 task blob: `b460b21bdeb2ee4434766fee6b775f594a09a2a0`
- Integrated main: `36efd23835373f4a9cac28175bbefacc9cc45c58`
- `origin/main` and merge-base at delivery: `36efd23835373f4a9cac28175bbefacc9cc45c58`
- Task blob unchanged: `b460b21bdeb2ee4434766fee6b775f594a09a2a0`

## Verification

| Check | Result |
| --- | --- |
| CMP, legal PrivacyBee, widget-consent, and production-facade tests | 62 pass, 0 fail (49 CMP/widget/facade + 13 legal PrivacyBee) |
| Harness | exit 0. Licensed `jetnity.com` intercepted one banner URL and fulfilled it locally. The positive frame came from `request` → `check` → one `consume` on the public facade. The final ledger after interactions, the canary wait, regrant, reorder, scope change, close, remount, unlicensed hosts, and cleanup was one banner and zero foreign requests. The canary pulsed, then the harness armed the delayed message and saw `armed` with no `delayed` entry. Refusing `ANALYTICS_STORAGE` removed the frame. During the following 800ms there was no delayed child message and at most one already queued message, which was rejected. Check became false. A second request used a new epoch, and releasing the old handle left that frame in place. A forged release did not remove it. The geometry page, with the production bootstrap and no fixture flag, stayed frameless after the same request button. A missing API on 127.0.0.1 reached phase `error` without a banner. Viewports 320/390/768/1440 and root 32px had no horizontal overflow |
| Baked kill against the public facade | The in-process bootstrap with `release: true` and `killDenied: true` baked that gate, inserted 0 scripts, and `requestProductionExecution` returned null. The esbuild probe, using the test-only policy module, also returned null for that kill and issued one grant only for `killDenied: false`. A twelvego record supplied for a discovercars request returned null. The real table stayed null, so the allowing in-process bootstrap still returned null |
| `check:dead` / `check:exports` / `check:schema-bezug` / `check:deps` | pass |
| Changed-file ESLint `--max-warnings 0` | pass |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run build` | pass |

Native CI and Vercel Preview for this head are reported from the live check after push. Green CI on `ae4baf60` does not cover this correction.
