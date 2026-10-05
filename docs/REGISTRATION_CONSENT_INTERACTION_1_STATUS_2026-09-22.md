# Registration Consent Interaction 1 — STATUS

Date: 2026-09-22  
Status: **REVIEW CORRECTION DELIVERED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Issue: #539  
Draft PR: #540  
Branch: `fix/registration-consent-interaction-1`  
Agent: Jetnity registration consent interaction 1, Generation 1  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Session: `bc-76b92d07-81a0-42b4-9b87-9827d868cadc`  
Baseline: `main@fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee`  
Task seed: `824286f69e8eae560999a9f4d0e0869390c280cc`  
Reviewed head (CHANGES REQUIRED): `9132adb595d18fd1fd65f8fd14a54d072ec1950b`  
TL review: `5276799852`  
Correction commits: `eb1e7bc1` (wrap) · `44b8bb58` (harness/metrics) · `60fc04c9` (docs)  
Authorized merge: `faf7bf0d772ab208f0a75f9df1d96e0769db5480`  
Merge parents: `60fc04c977a4edf9525e31eba61d8f714cffb3bb` + `5fee5f664e72a5fb946c050cc1f07efdbd50a6ec`  
After-run `productTree.head`: `faf7bf0d772ab208f0a75f9df1d96e0769db5480` (clean tree at capture)

This is the same-session review correction. It is not a Technical-Lead PASS and is not Ready.

## What the first delivery already proved

Hydrated Chromium on the seed reproduced the defect: one click on the visible box fired `onCheckedChange(true)` then `false`, so native and visual state stayed unchecked. The repair is one native 44px checkbox. Independent TL review confirmed the mouse/touch/controlled/uncontrolled/indeterminate/disabled/consent-enable-revoke contract on `9132adb5`.

## RC-R1 — 200% long legal-link overflow

The previous `layout-200` check compared the label box to `window.innerWidth`. On mobile that width expanded with document overflow, so `labelFitsViewport` was true while `Nutzungsbedingungen` and `Datenschutzerklärung` still overflowed (TL: 390 `rowOverflowPx` 57 / innerWidth 415; 320 `rowOverflowPx` 127 / innerWidth 415).

Runtime change is only on the existing RegisterForm consent label and its two legal links:

- label: `min-w-0 flex-1 break-words … [overflow-wrap:anywhere]`
- links: `break-words … [overflow-wrap:anywhere]`
- copy, destinations (`/terms`, `/privacy`), `stopPropagation`, 44px native target unchanged
- no `overflow: hidden`, no clip, no shared Label redesign

Measurement now uses `document.documentElement.clientWidth` / `scrollWidth` plus each legal link’s `getBoundingClientRect()` against `clientWidth`. 200% captures use isolated `?layout=consent` so rem-inflated `max-w-md` on the full fixture stack cannot fake the row. Recaptured only 320/390 at 200%.

After correction (Chromium):

| viewport | clientWidth | scrollWidth | documentOverflowPx | rowOverflowPx | anyLinkOverflows |
| --- | --- | --- | --- | --- | --- |
| 390 @ 200% | 390 | 390 | 0 | 0 | false |
| 320 @ 200% | 320 | 320 | 0 | 0 | false |

Link rights stay inside `clientWidth` (390: 349.69 / 354.20; 320: 280.56 / 287.44). Visual proof: `docs/evidence/registration-consent-interaction-1/screenshots/after-chromium-iphone-390-layout-200pct-390.png` and `after-chromium-320-layout-200pct-320.png`.

## RC-R2 — honest Tab, default link navigation, optional label click

The first runner’s `keyboardToggle()` called `focus()`, never Tab. Harness `LegalLink` used `preventDefault` plus a synthetic navigation array. Docs called that Tab+Space and production-like navigation. That overstated the contracts.

Now:

- `tabToNativeCheckbox()` clicks a preceding `data-tab-start` field, then presses Tab until the focused node is the native `#terms` checkbox. Assertions: `activeElement` id/type, accessible name contains `Ich akzeptiere`, exactly one native checkbox, zero `role="checkbox"`, then Space checks once and Space again revokes. Case name: `keyboard-tab-space`.
- Legal links are real `<a href="/terms">` / `<a href="/privacy">`. Harness matches RegisterForm: `stopPropagation` only, **no** `preventDefault`. Runner waits for a same-origin request and `waitForURL` pathname. Consent-unchanged is a `change` listener written to `sessionStorage` before the click (`termsChanged` / `privacyChanged` are `null`). The local server returns `legal destination /terms|/privacy` so navigation is real and distinct from the harness HTML. No mocked preventDefault was added to make the case pass.
- Optional Checkbox `label="Mit Label-Text"` is clicked via `getByText('Mit Label-Text')`, not markup presence. Case: `optional-label-click`.

This remains a **label/consent-row harness**, not a hydrated full Next `/register` route. Source-string checks in `lib/ui/checkbox-interaction.test.ts` are structural locks only; the comment in that file says so.

## Commands (review-correction working tree, then committed head)

```text
CONSENT_PHASE=after node docs/evidence/registration-consent-interaction-1/interact.mjs
# pass=true on chromium-desktop, chromium-iphone-390, chromium-320
# webkit-iphone-390 unavailable (host libraries). Not real iPhone/Safari.

node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/ui/checkbox-interaction.test.ts \
  lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts \
  lib/auth/register-meldung.test.ts
# 21/21 pass (rerun recorded on the correction commits)

npx eslint components/ui/checkbox.tsx components/auth/RegisterForm.tsx lib/ui/checkbox-interaction.test.ts
npx tsc -p tsconfig.json --noEmit
```

## Authorized main integration

TL review `5276799852` authorized **one** ordinary merge of `origin/main@5fee5f664e72a5fb946c050cc1f07efdbd50a6ec` into this existing branch after the bounded corrections. Live `origin/main` was still exactly that SHA; the merge was clean (`ort`) with no conflicts. Merge commit `faf7bf0d772ab208f0a75f9df1d96e0769db5480`. No rebase, no force-push, no second merge. Admin #538 files arrived only through that merge and were not edited on this branch.

## Residual limitations (unchanged honesty)

- Playwright WebKit did not launch. Emulated Chromium 390/320 is **not** a physical iPhone or Safari PASS.
- Full authenticated Next `/register` route was not hydrated here. Evidence is the compiled product Checkbox/Label plus a RegisterForm-shaped consent row, plus isolated `?layout=consent` for 200%.
- `/terms` and `/privacy` still 404 in the product. Unchanged legal-foundation finding. The harness server only exists so default navigation can be observed.
- OAuth on `/register` still does not require the checkbox. Unchanged inventory lock.
- No real signup, email, identity, role, Auth or DB writes.
- Fresh exact-head CI / Auth / direct Vercel Preview on the post-correction (and post-merge) head remain for the Technical Lead to read live. Historical `9132adb5` gates are superseded.

## Next actor

Technical Lead: independent exact-head re-review of the frozen head in HANDOFF. Cursor will not Ready, merge the PR, or start a follow-up. Immediate further review fixes would reuse this session.
