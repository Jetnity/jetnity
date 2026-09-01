# PWA-1 Installability – Exact-Head Handoff

Stand: 1. September 2026  
Status: **STOP FOR TECHNICAL-LEAD REVIEW**  
Logical agent: **`Jetnity PWA installability 1`**  
Generation: **1**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/390  
Issue: https://github.com/Jetnity/jetnity/issues/389  
Binding review: **CHANGES REQUIRED #5076452634**

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

---

## Zuerst lesen

1. Issue #389
2. Technical-Lead CHANGES REQUIRED #5076452634
3. `docs/PWA_1_INSTALLABILITY_STATUS_2026-09-01.md`
4. `docs/PWA_1_INSTALLABILITY_SELF_REVIEW_2026-09-01.md`
5. `docs/evidence/PWA_1_GATES_2026-09-01.md`
6. `app/manifest.ts`
7. `lib/pwa/installierbarkeit.test.ts`
8. `app/icon.svg`

Do not treat the rejected head `a13e3c508977c36133af8ef8f8a0d9e9e4e74196` as current evidence.

---

## What a new chat must know

This is **SINGLE_AGENT** Generation 1, same PWA-1 slice. The inherited Copilot PR made Jetnity installable but declared `purpose: maskable` on a file that was byte-identical to the normal 512 icon.

Review-fix: generate a maskable-specific production asset from the existing Jetnity mark and make the contract fail-closed in tests.

Implementation:

- Keep `public/icons/jetnity-192.png` and `public/icons/jetnity-512.png` as the normal `any` icons.
- Replace `public/icons/jetnity-512-maskable.png` with an opaque RGB 512×512 full-bleed `#153a33` canvas.
- Composite `app/icon.svg` at 320×320, centered, so the lime diamond and white circle sit inside the W3C/Android 40%-radius safe zone and are more padded than the any-512 icon.
- Decode PNG pixels in `lib/pwa/installierbarkeit.test.ts` (IHDR, IDAT, filters 0–4) and assert: different SHA-256, color type 2, opaque corners, lime + white mark present, 0 mark pixels outside the safe zone, maskable max radius < any-512 max radius.

Copilot also pushed intermediate `86eda470` (“Harden maskable PWA icon”) while this recovery was in progress. That commit introduced a padded RGBA asset and a filter-0 / 4-byte decoder. This review-fix is rebased on it and supersedes the asset and decoder with the stricter RGB + filter-capable contract.

Hard boundaries held: no service worker, Workbox, next-pwa, offline cache, IndexedDB, push, DB, Auth, provider, payment or indexing change.

## Transport at handoff write

| Item | Value |
| --- | --- |
| Canonical base | `main@6813ef1b3699f98bda7a74ddf9714e9aa78f40bf` |
| Rejected reviewed head | `a13e3c508977c36133af8ef8f8a0d9e9e4e74196` |
| Copilot intermediate | `86eda470d4033a75575a75ea7cda710363c25a50` |
| Implementation / CI / Preview READY | `915976c7336ed14062e15e6911ef6b01ce7e0ad6` |
| Final head | **read live on PR #390** |
| Ahead / behind `origin/main` | **4 / 0** at `915976c7`; re-check live after this docs tip |
| Draft | stays Draft |

## Changed files in this review-fix

| File | Role |
| --- | --- |
| `public/icons/jetnity-512-maskable.png` | maskable-specific opaque padded RGB asset |
| `lib/pwa/installierbarkeit.test.ts` | asset-level maskable + existing installability contract |
| this handoff / status / self-review / gates evidence | head-bound continuity |
| `docs/ACTIVE_WORK_STATUS.md` | live PWA-1 review-fix pointer |
| `JETNITY_START_HERE.md` | stale “no icons” starting evidence corrected on this branch |

Unchanged from rejected head and still in the PR vs main: `app/manifest.ts`, `app/layout.tsx`, `app/apple-icon.png`, `public/icons/jetnity-192.png`, `public/icons/jetnity-512.png`.

## Tests + exact outcomes

| Gate | Outcome |
| --- | --- |
| Targeted PWA tests | **5/5 pass** |
| `npm test` | **3112/3112 pass** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **0 errors** (137 pre-existing warnings) |
| `npm run build` | **pass** |
| GitHub Actions `915976c7` | **SUCCESS** [33493697119](https://github.com/Jetnity/jetnity/actions/runs/33493697119) |
| Vercel Preview `915976c7` | **READY** [7GqAgCxLBUt8t4vkQByhwiscXvVK](https://vercel.com/jetnity-e1b93c82/jetnity-app/7GqAgCxLBUt8t4vkQByhwiscXvVK) |

## Preview evidence

Unauthenticated content HTTP against the Preview host is **SSO-blocked** (HTTP 302 → `vercel.com/sso-api`). That is not treated as a 200.

Local production of the same build (`next start :3000`):

- `/manifest.webmanifest` → **200** `application/manifest+json`; body has id/scope `/`, standalone, 192/512/maskable icons
- `/icons/jetnity-192.png` → **200** `image/png`
- `/icons/jetnity-512.png` → **200** `image/png`
- `/icons/jetnity-512-maskable.png` → **200** `image/png` (RGB, distinct hash)
- `/apple-icon.png` → **200** `image/png` 180×180
- Homepage metadata: manifest link, apple-touch-icon, `noindex, nofollow`
- No service-worker registration in HTML or `app/`

Technical Lead should re-check the same URLs on the authenticated Preview of the live tip.

## Explicit non-scope confirmation

- No service worker registration or `public/sw.js` / `public/service-worker.js`
- No offline route/cache/IndexedDB persistence of account, trip or traveller data
- No push / VAPID / notification permission
- No DB / Supabase / Auth / MFA / AAL change
- No provider / payment / secret / cost-guard change
- No public indexing / domain cutover

## Adversarial self-review

See `docs/PWA_1_INSTALLABILITY_SELF_REVIEW_2026-09-01.md`. This is not Technical-Lead PASS.

## Residuals for Technical Lead

- Independent exact-head re-review of Draft-PR #390, including the live tip after this evidence commit
- Authenticated Preview content checks for `/manifest.webmanifest` and referenced PNGs
- Cursor must not Ready or merge
- Do not start a follow-up slice

## Nächster Schritt

**STOP FOR TECHNICAL-LEAD REVIEW.**

Unabhängiger Exact-Head-Review von Draft-PR #390. Nicht Ready. Nicht mergen. Kein Folgeslice.
