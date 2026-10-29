# Viator S2 native activities — STATUS

29 October 2026, Europe/Zurich. Draft #1079. Not Ready. Not merged.

## State

The Aktivitäten search uses Viator only when the sandbox guard is open. The real client opens only when `VERCEL_ENV` is exactly `preview` or `development`, the calls flag is `true`, and the key matches the existing shape. Missing, empty, unknown, Production, and malformed environment values stay closed before HTTP. A missing flag stays disabled. An unusable key stays a missing key. No example offers are substituted.

Runtime destination resolution loads `GET /destinations`. For Viator, `activitiesSuchen` reads the selected place only after the provider is active and the rate limit allows it. A missing id, a null read, a different id, a country mismatch, or a display name outside the confirmed names stops before product search. A matching record replaces the client name and coordinates. Browser aliases are discarded. The reader timeout and errors stay inside the search response. The GeoNames fixture is not read.

A live check always sends a supported display currency. CHF, EUR, and USD are sent when that is the requested display currency. An unsupported trip currency asks for a choice and does not show a current price. The request omits `productOptionCode` for a product with no titled option, and never sends `TG1` or `DEFAULT` as a stand-in. Several start times stay unselected until the visitor chooses one. `daysOfWeek` comes from each pricing record, so a Monday-only time is not offered on Tuesday. A season without `endDate` is a hint through 384 days from the check clock, not availability. Changing the date while details are still loading does not discard that load. A new activity search clears the selected Viator product.

The day control is one native select labelled Reisetag. The closed control shows the selected day. Changing it keeps the stage and day identity and clears a Viator selection from another day. The availability label stays inside its button when the real page padding is present.

Live Sandbox HTTP remains BLOCKED. No secret was read. No Vercel login was requested. DiscoverCars and Trip Workspace were not edited.

`components/ui/scroll-row.tsx` had no remaining import on this branch. Before deletion, `node scripts/erreichbarkeit.mjs --json` reported that file as the only orphan. It is removed. The reachability, export, and package checks were not weakened and gained no exception list entry. The day control stays the labelled select. `DESIGN_SYSTEM.md`, `docs/ACTIVITIES.md`, and `docs/CURSOR_TRIP_WORKSPACE_MOBILE_UX_ITERATION_3.md` still name ScrollRow and were left unchanged.

## Checks

On 29 October 2026 the review of `ce0a5bcda6c227ef831a7b4534841b744af27e06` (comment 6485054044) left three corrections. This head addresses them.

`npx eslint . --quiet` passed. The unused `bestaetigt` binding is gone. `let ziel` is assigned again for a Viator request, so `prefer-const` stays enabled. `npx tsc -p tsconfig.json --noEmit` passed. `npm run build` passed (Next.js 16.4.1).

Focused tests passed: 6 search-orchestration, 9 Viator seam, 17 foundation/sandbox, and 3 browser tests. The seam tests still cover unknown id, mismatched id, Porto versus Lisbon, Lissabon, Wien, a throwing reader, a disabled provider with zero reads, and the ninth request returning 429 without a read.

The browser harness renders `AktivitaetenBereich` inside `main.mx-auto.max-w-3xl.p-4`. At root font 32px the measured main padding-left was 32px. "Verfügbarkeit prüfen" text was x66–254 inside a button at x58–262 on a 320px viewport, and x66–324 inside a button at x58–332 on a 390px viewport. "Angebot prüfen" stayed inside its button. The search body carried Bangkok, TH, and CHF. A late 111 was discarded. An empty repeat search cleared the selected product. ArrowDown moved the two-day trip from Bangkok to Phuket-Tag.

For 22 synthetic days the day group was 90px high and the search button was at document y 511 at 390px, and 90px / y 419 at 1440px, all at the normal 16px root. At 320px and root font 32px the group was 154px, the select was 88px, and the search button was at y 1199. ArrowDown moved Tag 1 to Tag 2. Tag 22 selected the Phuket stage. There is no day radio list.

CI [40800257522](https://github.com/Jetnity/jetnity/actions/runs/40800257522) on `7a255a12` finished FAIL. Typecheck, lint, Auth, admin API protection, and schema reference passed. Tests were 7651 pass, 0 fail, 2 skipped. `check:dead` then failed on `components/ui/scroll-row.tsx`, so export, package, and build steps were skipped. That run does not cover the commit that deletes the file.

After the deletion, local `check:dead` reported 0 orphans, `check:exports` reported 0 unused exports, and `check:deps` reported 0 unused packages. `npx tsc -p tsconfig.json --noEmit` and `npx eslint . --quiet` passed. The same 35 focused tests passed on Linux, including the ArrowDown assertions. `npm run build` passed. CI [40860128741](https://github.com/Jetnity/jetnity/actions/runs/40860128741) later completed SUCCESS on `b7299e69`. That PASS covers the deletion only.

## Pre-activation guard

Comment 6495438986, S2-PREACTIVATION-R1. On `b7299e69` the guard rejected only the exact string `production`. A synthetic key and calls flag therefore opened missing, empty, `staging`, and `production ` (trailing space) before any HTTP call. `viatorSandboxZugang` now allows only exact `preview` and `development` after the flag and key checks. Exact `production` stays `production_blocked`. Every other environment value is `environment_blocked`. Injected HTTP on `createViatorSandboxClient`, `viatorActivityProvider`, `viatorProduktLaden`, `viatorKalenderLaden`, and `viatorLivePruefen` recorded zero calls for those refused values, and also for a disabled flag or a missing key on an otherwise allowed environment. Explicit `preview` and `development` each performed a sandbox-host search. Synthetic fixtures set `VERCEL_ENV` themselves. No deployed fixture switch was added. This change does not read or write a secret, and it does not activate Sandbox.

## Native select on macOS headless Chrome

Comment 6485453294, checked on macOS headless Chrome 156, found that ArrowDown, ArrowDown plus Enter, and Space plus ArrowDown plus Enter do not change a plain native select, including outside Jetnity. Typeahead did change the Jetnity day. That is a platform assumption in `browser.test.ts`, not a recorded product defect. The select and those ArrowDown assertions were left as they are. A Linux pass of those two assertions is not Mac, VoiceOver, or full-browser-zoom acceptance.

## Still blocked

Real Sandbox calls, image license, checkout currency, hosted acceptance, and a green exact-head CI run for the pre-activation commit. The cleanup PASS on `b7299e69` does not cover that commit. No Ready. No merge.
