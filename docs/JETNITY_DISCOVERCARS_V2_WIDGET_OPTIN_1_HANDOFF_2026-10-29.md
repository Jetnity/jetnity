# DiscoverCars V2 widget opt-in 1 — handoff

**Stop for independent Technical Lead review. Do not activate the vendor widget from this handoff.**

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

## How to re-run the local proof

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/providers/discovercars/widget/vertrag.test.ts \
  lib/providers/discovercars/widget/oberflaeche.test.ts \
  lib/providers/discovercars/affiliate/links.test.ts

npx eslint components/trips/DiscoverCarsWidgetOptin.tsx \
  components/trips/MietwagenBereich.tsx \
  lib/providers/discovercars/widget/vertrag.ts \
  lib/providers/discovercars/widget/*.test.ts \
  scripts/discovercars-v2-widget-optin-1/harness.tsx \
  scripts/discovercars-v2-widget-optin-1/browser.ts

DISCOVERCARS_WIDGET_AUSGABE=/tmp/discovercars-v2-widget \
  node --import tsx scripts/discovercars-v2-widget-optin-1/browser.ts
```

The browser script bundles the real components with esbuild and Tailwind. It does not open DiscoverCars. The seam is not what production `MietwagenBereich` renders.

## Protected lanes

Do not edit Viator #1079, UX U1-C #1082 (`TripWorkspace*`, `docs/ACTIVE_WORK_STATUS.md`), V1 affiliate files, GYG, PrivacyBee, packages, or workflows. This handoff does not assign a next writer.

## If a later slice is chosen by the Technical Lead

The general export is already bound. A later slice still needs a real consent decision and a complete vendor origin inventory before any script load. Do not treat a button click, PrivacyBee, or issue #1073 as that decision. Do not add `allow-same-origin` to make the provider run. Keep the generic V1 link as the fallback. A BKK sample must not replace `data-location=""`.
