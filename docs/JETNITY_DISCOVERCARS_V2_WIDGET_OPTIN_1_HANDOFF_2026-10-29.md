# DiscoverCars V2 widget opt-in 1 — handoff

**Current, 31 October 2026, configured export.** Two source files stay distinct. The original 835-byte export has no `data-aff-value`. The configured 860-byte file adds only that public value `jetnity` and is not a fresh account export. Neither file executes. Host parser, frozen-export pins, CMP and host policy pins, and the 31-pair audit contract stay bound to the 835-byte original with an empty affiliate value. This slice does not retarget them. Root still has to version those pins and finish the runtime audit. That audit remains `CHANGES REQUIRED` / `BLOCKED_TRANSPORT`.

**Current, 31 October 2026, R4.2.** The one owned route test waits for innerWidth 1440, kompakt `0`, anordnung `neben`, and `data-shell-nav=sticky`, then requires computed `sticky`. Counts and the empty network check stay after that wait. The original CI cause is not proven. Source is verified. Runtime is `CONSENT_BLOCKED`. This branch now contains accepted main, including White-Mint and the shared widget foundations. Those foundations are not permission to execute the script. The Mietwagen housing is still an explanation, not a provider form. Stop for independent Technical Lead review. Do not activate the vendor widget from this handoff.

## Remaining integration boundary

1. Account evidence for the existing Swiss PrivacyBee cookie banner, including the original snippet and supported grant/withdraw callbacks. Informative consent text is not that grant. Do not add another banner.
2. A shared execution and host contract that is actually approved. #1089 and #1091 are on main and stay fail-closed: execution is false, and the inert host answers 404.
3. Only then a real widget acceptance: hosted form, redirect, and attribution. This correction does not do that step.

## How to re-run the local proof

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/providers/discovercars/widget/vertrag.test.ts \
  lib/providers/discovercars/widget/export.test.ts \
  lib/providers/discovercars/widget/oberflaeche.test.ts \
  lib/providers/discovercars/affiliate/links.test.ts

npx eslint components/trips/DiscoverCarsWidgetOptin.tsx \
  components/trips/MietwagenBereich.tsx \
  lib/providers/discovercars/widget/vertrag.ts \
  lib/providers/discovercars/widget/export.ts \
  lib/providers/discovercars/widget/*.test.ts \
  scripts/discovercars-v2-widget-optin-1/harness.tsx \
  scripts/discovercars-v2-widget-optin-1/browser.ts

DISCOVERCARS_WIDGET_AUSGABE=/tmp/discovercars-v2-widget \
  node --import tsx scripts/discovercars-v2-widget-optin-1/browser.ts
```

The browser harness loads `styles/globals.css` through the app PostCSS/Tailwind config, then `styles/white-mint.css`, `components/workspace/workspace.css`, and `components/workspace/workspace-surfaces.css`. The local shell is `.workspace-shell[data-workspace-theme="light"] .workspace-content`, without account or network code. The 31 October R4.1 run measured the “Suchwidget” heading as `rgb(20, 62, 51)` inside that shell. Missing the shell fails the run. Focus checks compare `document.activeElement` with the exact button for Tab, Enter, Escape, and the close click. Ancestor text is not accepted. The run fails if any request is not `data:`, `blob:`, or `about:blank`. It does not call DiscoverCars. At 320px and a 32px root font the widget section overflow was 0. The untouched V1 label “Flughafen Suvarnabhumi (BKK)” still painted 18px past the viewport. The smallest later patch, outside this ownership, is `min-w-0` and wrapping on that label’s text in `DiscoverCarsAffiliateLinks.tsx`. Browser-chrome zoom, a physical device, and VoiceOver were not run.

## Historical notes

The sections below were true at earlier heads. They are not the current branch tip.

## Read first

1. Immutable task `docs/JETNITY_DISCOVERCARS_V2_WIDGET_OPTIN_1_TASK_V1_2026-10-29.md` (blob `f4b0996471eb67b811382c1102f88285944335e5`).
2. This slice’s PLAN, STATUS, SELF_REVIEW, and REPORT.
3. Live #1084 head, not the seed `4493951c719ddce720f1eb53fd56680c7fe69ddb`.
4. Implementation commit `de8165a3d5c58995c882f24039223563f2e0b9b2`. Docs commit `8a9bf98df39137264d6069a3aafe8a96f276492f`. The #1084 comment names the exact tip after the recording commit.

Session that wrote this: Jetnity DiscoverCars Official Search Widget V2 Opt-In 1 — Cursor Generation 1, `grok-4.7-high-fast`, `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`.

## Owner correction

29 October 2026, same session `bc-1885a130-36a8-4dcf-86bc-48aa6121c24e`. The standard V2 widget is a general rental search. Bangkok Suvarnabhumi is not its default. The historical pre-code comment described the missing export before this correction; this handoff and the status file carry the correction. The task file stays byte-for-byte unchanged.

Verified general export: `lib/providers/discovercars/widget/discovercars-widget-allgemein.html`, SHA-256 `5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa`, `data-location=""`. BKK sample: not the default and refused. Runtime: `CONSENT_BLOCKED`. Do not serve the script until consent and a complete origin inventory exist.

## Product state

Organisieren → Mobilität → Mietwagen shows the existing honest unavailable-offers card, then a DiscoverCars housing that says the embedded search is not active and that Jetnity sets no pickup, then the existing V1 links, then the manual form. The V1 BKK radio is an explicit visitor choice for that link only. A Bangkok city trip leaves the widget free of Bangkok and leaves the V1 link on the generic URL. Guests still leave Jetnity only through those V1 links. The housing does not send trip id, dates, age, residence, or route anywhere.

`LIVE_SOURCE_VERIFIED`. `widgetDarfAusfuehren()` is `false` because consent and the origin inventory are blocked, not because the file is missing. The execution allowlist is empty. There is no embed route.

## Protected lanes

Do not edit Viator #1079, UX U1-C #1082 (`TripWorkspace*`, `docs/ACTIVE_WORK_STATUS.md`), V1 affiliate files, GYG, PrivacyBee, packages, or workflows. This handoff does not assign a next writer.

## If a later slice is chosen by the Technical Lead

The general export is already bound. A later slice still needs a real consent decision and a complete vendor origin inventory before any script load. Do not treat a button click, PrivacyBee, or issue #1073 as that decision. Do not add `allow-same-origin` to make the provider run. Keep the generic V1 link as the fallback. A BKK sample must not replace `data-location=""`.
