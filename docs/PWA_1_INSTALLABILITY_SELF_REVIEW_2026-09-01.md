# PWA-1 Installability – Agent Self-Review

Stand: 1. September 2026  
Status: **AGENT SELF-REVIEW / NOT A TECHNICAL-LEAD PASS**  
Logical agent: **`Jetnity PWA installability 1`**  
Generation: **1**  
PR: [#390](https://github.com/Jetnity/jetnity/pull/390)  
Issue: [#389](https://github.com/Jetnity/jetnity/issues/389)  
Rejected head: `a13e3c508977c36133af8ef8f8a0d9e9e4e74196`  
Implementation / CI head: `915976c7336ed14062e15e6911ef6b01ce7e0ad6`

Agent self-review is not PASS. Cursor does not Ready or merge.

---

## 1. Scope held

| Rule | Held? |
| --- | --- |
| Same PWA-1 slice only; no follow-up slice | **yes** |
| No service worker / Workbox / next-pwa | **yes** |
| No offline cache / Cache API / IndexedDB persistence | **yes** |
| No `beforeinstallprompt` / push / VAPID / notifications | **yes** |
| No DB / Supabase / Auth / MFA / AAL | **yes** |
| No provider / payment / secret / cost-guard change | **yes** |
| No public indexing / domain cutover | **yes** |
| No airplane icon or brand redesign | **yes** |
| Existing Jetnity mark reused from `app/icon.svg` | **yes** |
| No Ready / merge | **yes** |

## 2. Review-fix coverage

| Required by #5076452634 | Delivered |
| --- | --- |
| Maskable contract real, not nominal | Distinct `jetnity-512-maskable.png` (RGB, no alpha) vs `jetnity-512.png` (RGBA) |
| Opaque / full-bleed | Color type 2; corners `#153a33`; all alpha 255 |
| Important mark inside 40%-radius safe zone | Pixel decoder asserts 0 mark pixels outside `0.4 * size` |
| Intentionally padded vs any icon | Maskable max mark radius is smaller than the any-512 icon |
| Existing mark preserved | Lime `#dff47a` diamond and white circle still present |
| Deterministic asset-level tests | `lib/pwa/installierbarkeit.test.ts` decodes IHDR/IDAT/filters 0–4 |
| Exact-head CI actually executes | Run 33493697119 SUCCESS on `915976c7` (not `action_required`) |
| Preview content-level evidence | Vercel READY on `915976c7`; unauthenticated HTTP SSO-blocked; local `next start` 200s recorded |
| Head-bound handoff | status + self-review + handoff + gates evidence |
| No SW / offline / push / DB / Auth / provider | Unchanged; tests still forbid SW/offline patterns |

## 3. Adversarial checks

1. **Did I keep a maskable declaration that is only a second filename for the same blob?** No. SHA-256 of the two 512 assets now differs; the test fails if they become identical again.
2. **Did I only check `purpose: 'maskable'` metadata?** No. Tests decode pixels and assert opacity, full-bleed corners, safe-zone geometry and extra padding.
3. **Is the existing any-icon still a normal install icon?** Yes. `jetnity-192.png` and `jetnity-512.png` are unchanged.
4. **Did I invent a new mark or airplane pictogram?** No. The maskable asset composites `app/icon.svg` onto brand green.
5. **Did I add a service worker to make installability “more complete”?** No.
6. **Did I cache account/trip/traveller data?** No.
7. **Did I weaken robots / indexing?** No. Homepage still has `noindex, nofollow`; `htmlRobots()` remains.
8. **Did I treat Vercel READY on the rejected head as exact-head CI?** No. Rejected head is `a13e3c50`. CI SUCCESS is `915976c7`.
9. **Did I claim unauthenticated Preview HTTP 200s that SSO blocked?** No. SSO 302 is recorded; content proof is local production of the same build.
10. **Would a transparent favicon-style raster still pass?** No. Maskable must be color type 2 (no alpha) with opaque brand-green corners.
11. **Did I treat Copilot `86eda470` as sufficient?** No. That asset was still RGBA and its decoder assumed filter 0 / 4 bytes per pixel. This head uses RGB and a filter-capable decoder.
12. **Did I claim Playwright chunk 403s as a PWA-1 pass?** No. They are residual/transient and not PWA metadata.

## 4. Honesty

| Claim | Status |
| --- | --- |
| Maskable asset is distinct, opaque, padded, mark in safe zone | **true** |
| Targeted PWA tests 5/5 | **true** |
| Full `npm test` 3112/3112 | **true** |
| Typecheck / lint(0 errors) / production build | **true** |
| GitHub Actions SUCCESS on `915976c7` | **true** — run 33493697119 |
| Vercel READY on `915976c7` | **true** — `7GqAgCxLBUt8t4vkQByhwiscXvVK` |
| Unauthenticated Preview `/manifest.webmanifest` 200 | **false** — SSO 302 |
| Local production manifest/icons 200 | **true** |
| Browser / real-device Add-to-Home-Screen | **not** run |
| Ready / merge | **false** |

## 5. Traveller Context

Not relevant. Installability assets do not collect or evaluate traveller credentials.

## 6. Residual / not this slice

- Vercel Deployment Protection SSO blocks unauthenticated Preview content HTTP. Technical Lead can verify `/manifest.webmanifest` and icon URLs while authenticated to the Preview.
- Playwright recorded transient `_next/static/chunks` 403s and HMR websocket failures against local `next start`. A later curl of the same `@supabase` chunk returned 200. Out of PWA-1 scope.
- A docs-only evidence tip after `915976c7` cannot carry its own CI SHA. Technical Lead reviews the live tip and re-checks its gates.
- Offline support remains intentionally absent.

## 7. Recommendation

Technical Lead re-reviews the live exact head of Draft-PR #390 independently. Do not Ready. Do not merge. Do not start a follow-up slice from this session.
