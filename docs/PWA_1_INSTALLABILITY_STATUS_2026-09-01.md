# PWA-1 Installability – Review-Fix Status

Stand: 1. September 2026  
Status: **REVIEW-FIX COMPLETE / GATES RECORDED ON 915976c7 / STOP FOR TECHNICAL-LEAD RE-REVIEW**  
Logical agent: **`Jetnity PWA installability 1`**  
Generation: **1**  
PR: [#390](https://github.com/Jetnity/jetnity/pull/390)  
Issue: [#389](https://github.com/Jetnity/jetnity/issues/389)  
Rejected head: `a13e3c508977c36133af8ef8f8a0d9e9e4e74196`  
Binding review: **CHANGES REQUIRED #5076452634**  
Canonical base: `main@6813ef1b3699f98bda7a74ddf9714e9aa78f40bf`  
Implementation / CI head: `915976c7336ed14062e15e6911ef6b01ce7e0ad6`

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

---

## 1. Arbeitsblock

Same PWA-1 slice only. Governance recovery of the Copilot-authored Draft-PR after Technical-Lead CHANGES REQUIRED. No new slice.

## 2. Bereits umgesetzt

- Manifest installability fields and icon set from the rejected head remain.
- Copilot intermediate `86eda470` replaced the identical-hash maskable file with a padded RGBA asset and a filter-0 decoder. This review-fix supersedes that with a stricter RGB (no-alpha) asset and a filter-capable pixel decoder.
- `public/icons/jetnity-512-maskable.png` is now an intentionally padded, opaque RGB 512×512 PNG:
  - full-bleed brand green `#153a33`;
  - existing Jetnity lime diamond + white circle from `app/icon.svg`;
  - important mark pixels inside the centered 40%-radius safe zone (max radius ≈ 106px vs 204.8px);
  - more padded than `public/icons/jetnity-512.png` (max radius ≈ 171px);
  - SHA-256 differs from the any-512 icon.
- Deterministic regression tests decode PNG pixels (filters 0–4) and assert the asset-level maskable contract.
- No service worker, offline cache, push, DB, Auth, provider, payment or indexing change.

## 3. Gates

See `docs/evidence/PWA_1_GATES_2026-09-01.md`.

- Targeted PWA tests 5/5
- `npm test` 3112/3112
- typecheck pass
- lint 0 errors
- production build pass
- GitHub Actions [33493697119](https://github.com/Jetnity/jetnity/actions/runs/33493697119) **SUCCESS** on `915976c7`
- Vercel Preview **READY** on `915976c7`
- Unauthenticated Preview HTTP is SSO-blocked; content-level proof is local production of the same build

## 4. Traveller Context

Not relevant. PWA installability does not evaluate citizenship, documents, residence or route.

## 5. Nächster Schritt

Independent Technical-Lead exact-head re-review of the live Draft-PR #390 tip. Cursor must not Ready or merge. Do not start a follow-up slice.
