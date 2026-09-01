# PWA-1 Installability – Review-Fix Status

Stand: 1. September 2026  
Status: **REVIEW-FIX IMPLEMENTED / LOCAL GATES PENDING ON THIS REVISION / STOP FOR TECHNICAL-LEAD RE-REVIEW**  
Logical agent: **`Jetnity PWA installability 1`**  
Generation: **1**  
PR: [#390](https://github.com/Jetnity/jetnity/pull/390)  
Issue: [#389](https://github.com/Jetnity/jetnity/issues/389)  
Rejected head: `a13e3c508977c36133af8ef8f8a0d9e9e4e74196`  
Binding review: **CHANGES REQUIRED #5076452634**  
Canonical base: `main@6813ef1b3699f98bda7a74ddf9714e9aa78f40bf`

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR.

---

## 1. Arbeitsblock

Same PWA-1 slice only. Governance recovery of the Copilot-authored Draft-PR after Technical-Lead CHANGES REQUIRED. No new slice.

## 2. Bereits umgesetzt

- Manifest installability fields and icon set from the rejected head remain.
- `public/icons/jetnity-512-maskable.png` is no longer a byte-identical copy of the `any` 512 icon.
- The maskable asset is now an intentionally padded, opaque RGB 512×512 PNG:
  - full-bleed brand green `#153a33`;
  - existing Jetnity lime diamond + white circle from `app/icon.svg`;
  - important mark pixels inside the centered 40%-radius safe zone;
  - more padded than `public/icons/jetnity-512.png`.
- Deterministic regression tests now decode PNG pixels (filters 0–4) and assert the asset-level maskable contract, not only filename/purpose/dimensions.
- No service worker, offline cache, push, DB, Auth, provider, payment or indexing change.

## 3. Gerade offen

- Full local typecheck / lint / `npm test` / production build on this revision: **pending immediately after this commit**.
- Preview content-level evidence on the new exact head: **pending Vercel deploy of the new tip**.
- Exact-head GitHub Actions: previous run #1642 was `action_required` with zero jobs. A new head is required; workflow approval is outside this agent.

## 4. Traveller Context

Not relevant. PWA installability does not evaluate citizenship, documents, residence or route.

## 5. Nächster Schritt

1. Run targeted PWA tests, full `npm test`, typecheck, lint and production build.
2. Record Preview `/manifest.webmanifest` + referenced PNG evidence on the new head.
3. Independent Technical-Lead exact-head re-review.
4. Cursor must not Ready or merge.
