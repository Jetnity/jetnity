# PWA-1 Installability – Agent Self-Review

Stand: 1. September 2026  
Status: **AGENT SELF-REVIEW / NOT A TECHNICAL-LEAD PASS**  
Logical agent: **`Jetnity PWA installability 1`**  
Generation: **1**  
PR: [#390](https://github.com/Jetnity/jetnity/pull/390)  
Issue: [#389](https://github.com/Jetnity/jetnity/issues/389)  
Rejected head: `a13e3c508977c36133af8ef8f8a0d9e9e4e74196`

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
| Deterministic asset-level tests | `lib/pwa/installierbarkeit.test.ts` decodes IHDR/IDAT/filters |
| No SW / offline / push / DB / Auth / provider | Unchanged; tests still forbid SW/offline patterns |
| Head-bound handoff | This file + status + handoff |

## 3. Adversarial checks

1. **Did I keep a maskable declaration that is only a second filename for the same blob?** No. SHA-256 of the two 512 assets now differs; the test fails if they become identical again.
2. **Did I only check `purpose: 'maskable'` metadata?** No. Tests decode pixels and assert opacity, full-bleed corners, safe-zone geometry and extra padding.
3. **Is the existing any-icon still a normal install icon?** Yes. `jetnity-192.png` and `jetnity-512.png` are unchanged.
4. **Did I invent a new mark or airplane pictogram?** No. The maskable asset composites `app/icon.svg` onto brand green.
5. **Did I add a service worker to make installability “more complete”?** No.
6. **Did I cache account/trip/traveller data?** No.
7. **Did I weaken robots / indexing?** No. `htmlRobots()` and the no-`index: true` assertion remain.
8. **Did I treat Vercel READY on the rejected head as exact-head CI?** No. That head is rejected; gates must be re-run on the new tip.
9. **Did I claim GitHub Actions success that does not exist?** No. Run #1642 was `action_required` with zero jobs.
10. **Would a transparent favicon-style raster still pass?** No. Maskable must be color type 2 (no alpha) with opaque brand-green corners.

## 4. Honesty

| Claim | Status |
| --- | --- |
| Maskable asset is distinct and padded | **true** on this working tree |
| Targeted PWA tests on the new asset | **true locally before this commit**: 5/5 |
| Full `npm test` / typecheck / lint / production build | **not yet recorded for this revision** |
| Preview content-level evidence on the new head | **not yet** — pending deploy of the new tip |
| Exact-head CI success | **not claimed** |
| Ready / merge | **false** |

## 5. Traveller Context

Not relevant. Installability assets do not collect or evaluate traveller credentials.

## 6. Residual / not this slice

- GitHub Actions workflow approval for this inherited Copilot branch may still yield `action_required`. That is outside the coding agent.
- Browser / real-device Add-to-Home-Screen is not claimed.
- Offline support remains intentionally absent.

## 7. Recommendation

Technical Lead re-reviews the live exact head of Draft-PR #390 after local gates and Preview evidence are recorded. Do not Ready. Do not merge. Do not start a follow-up slice from this session.
