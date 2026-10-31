# Viator S2 native activities — STATUS

31 October 2026, Europe/Zurich. Draft #1079. Not Ready. Not merged.

## State

The Aktivitäten search uses Viator only when the sandbox guard is open. The real client opens only when `VERCEL_ENV` is exactly `preview` or `development`, the calls flag is `true`, and the key matches the existing shape. Missing, empty, unknown, Production, and malformed environment values stay closed before HTTP. A missing flag stays disabled. An unusable key stays a missing key. No example offers are substituted.

Runtime destination resolution loads `GET /destinations`. For Viator, `activitiesSuchen` reads the selected place only after the provider is active and the rate limit allows it. A missing id, a null read, a different id, a country mismatch, or a display name outside the confirmed names stops before product search. A matching record replaces the client name and coordinates. Browser aliases are discarded. The reader timeout and errors stay inside the search response. The GeoNames fixture is not read.

A live check always sends a supported display currency. CHF, EUR, and USD are sent when that is the requested display currency. An unsupported trip currency asks for a choice and does not show a current price. `productOptionCode` is omitted only when the provider sent no option list at all. A present option without a usable title stays unresolved and is not that option-free case. The request never sends `TG1` or `DEFAULT` as a stand-in. Several start times stay unselected until the visitor chooses one. `daysOfWeek` comes from each pricing record, so a Monday-only time is not offered on Tuesday. A season without `endDate` is a hint through 384 days from the check clock, not availability. Changing the date while details are still loading does not discard that load. A new activity search clears the selected Viator product.

Official product codes may contain an underscore. `2855KENNEDY_TKTS` and `2050_PA` pass content, request, schedule, live-check, and affiliate normalization. Slash, query, fragment, percent-encoding, spaces, controls, and codes outside 2–40 characters do not enter a path. An absent option list remains a standard product. A present but untitled or malformed option list sets `optionenUnaufgeloest` and does not show “Dieses Angebot hat keine Zusatzoption” or start a live check. A labelled option in a mixed list still checks with its exact code. A client `standardProduct` flag does not override that. Both execution flags stay off. The consumed destinations witness and the offline body-reason field are recorded below. This source correction did not call Viator.

Live Sandbox HTTP remains BLOCKED. No secret was read. No Vercel login was requested. DiscoverCars and Trip Workspace were not edited.

`components/ui/scroll-row.tsx` had no remaining import on this branch. Before deletion, `node scripts/erreichbarkeit.mjs --json` reported that file as the only orphan. It is removed. The reachability, export, and package checks were not weakened and gained no exception list entry. The day control stays the labelled select. `DESIGN_SYSTEM.md`, `docs/ACTIVITIES.md`, and `docs/CURSOR_TRIP_WORKSPACE_MOBILE_UX_ITERATION_3.md` still name ScrollRow and were left unchanged.

## Checks

On 29 October 2026 the review of `ce0a5bcda6c227ef831a7b4534841b744af27e06` (comment 6485054044) left three corrections. This head addresses them.

`npx eslint . --quiet` passed. The unused `bestaetigt` binding is gone. `let ziel` is assigned again for a Viator request, so `prefer-const` stays enabled. `npx tsc -p tsconfig.json --noEmit` passed. `npm run build` passed (Next.js 16.4.1).

Focused tests passed: 6 search-orchestration, 9 Viator seam, 17 foundation/sandbox, and 3 browser tests. The seam tests still cover unknown id, mismatched id, Porto versus Lisbon, Lissabon, Wien, a throwing reader, a disabled provider with zero reads, and the ninth request returning 429 without a read.

## Historical measurements

The figures in this section were taken on 29 October 2026 from a harness that compiled only `styles/globals.css` and mounted a standalone `main`. They are not the current stylesheet proof. At that time the harness rendered `AktivitaetenBereich` inside `main.mx-auto.max-w-3xl.p-4`. At root font 32px the measured main padding-left was 32px. "Verfügbarkeit prüfen" text was x66–254 inside a button at x58–262 on a 320px viewport, and x66–324 inside a button at x58–332 on a 390px viewport. "Angebot prüfen" stayed inside its button. The search body carried Bangkok, TH, and CHF. A late 111 was discarded. An empty repeat search cleared the selected product. ArrowDown moved the two-day trip from Bangkok to Phuket-Tag on Linux. For 22 synthetic days the day group was 90px high and the search button was at document y 511 at 390px, and 90px / y 419 at 1440px, at a 16px root. At 320px and root font 32px the group was 154px, the select was 88px, and the search button was at y 1199. That enlargement was root font, not browser zoom, and it is not hosted or device acceptance.

CI [40800257522](https://github.com/Jetnity/jetnity/actions/runs/40800257522) on `7a255a12` finished FAIL. Typecheck, lint, Auth, admin API protection, and schema reference passed. Tests were 7651 pass, 0 fail, 2 skipped. `check:dead` then failed on `components/ui/scroll-row.tsx`, so export, package, and build steps were skipped. That run does not cover the commit that deletes the file.

After the deletion, local `check:dead` reported 0 orphans, `check:exports` reported 0 unused exports, and `check:deps` reported 0 unused packages. `npx tsc -p tsconfig.json --noEmit` and `npx eslint . --quiet` passed. The same 35 focused tests passed on Linux, including the ArrowDown assertions. `npm run build` passed. CI [40860128741](https://github.com/Jetnity/jetnity/actions/runs/40860128741) later completed SUCCESS on `b7299e69`. That PASS covers the deletion only.

## Pre-activation guard

Comment 6495438986, S2-PREACTIVATION-R1. On `b7299e69` the guard rejected only the exact string `production`. A synthetic key and calls flag therefore opened missing, empty, `staging`, and `production ` (trailing space) before any HTTP call. `viatorSandboxZugang` now allows only exact `preview` and `development` after the flag and key checks. Exact `production` stays `production_blocked`. Every other environment value is `environment_blocked`. Injected HTTP on `createViatorSandboxClient`, `viatorActivityProvider`, `viatorProduktLaden`, `viatorKalenderLaden`, and `viatorLivePruefen` recorded zero calls for those refused values, and also for a disabled flag or a missing key on an otherwise allowed environment. Explicit `preview` and `development` each performed a sandbox-host search. Synthetic fixtures set `VERCEL_ENV` themselves. No deployed fixture switch was added. This change does not read or write a secret, and it does not activate Sandbox.

## Native select on macOS headless Chrome

Comment 6485453294, checked on macOS headless Chrome 156, found that ArrowDown, ArrowDown plus Enter, and Space plus ArrowDown plus Enter do not change a plain native select, including outside Jetnity. Typeahead did change the Jetnity day. That is a platform assumption in `browser.test.ts`, not a recorded product defect. The select and those ArrowDown assertions were left as they are. A Linux pass of those two assertions is not Mac, VoiceOver, or full-browser-zoom acceptance.

## Body-reason diagnostic

R4, 31 October 2026. The approved one-shot on `f644dbd3` is consumed. Deployment `dpl_Br8avGaPwx31xRDiBe4C5hGBsKb7` made one `GET /partner/destinations`. The safe log was operation `destinations`, class `transport_body`, reason `transport`, transport kind `malformed_response`, status 200. That log did not say whether the body was over the cap, empty, a non-JSON media type, invalid JSON, or unreadable. Flags were returned to false. OFF deployment `dpl_CmSbFCagWWnY4X9LAjUhhxf6L4fB` on the same head showed the unavailable state and zero outgoing requests. Receipt 6543514153.

`sandbox.ts` now exact-maps the five fixed parser sentences onto `size_limit`, `body_unreadable`, `empty_json`, `non_json_media_type`, or `invalid_json` only when the destinations transport kind is `malformed_response`. Every other sentence, including `Provider response was malformed.`, is `unknown`. The logger allowlist is the previous six fields plus `bodyReason`. A value is logged only when the class is `transport_body` and the value is one of those six enums. Search, detail, schedule, and check do not receive the field. Guest text stays `Die Viator-Ziele konnten nicht gelesen werden.` A throwing `console.error` still does not replace that text. The body cap stays 1 MiB, with 2 MiB as the configurable maximum. Parsing strategy, MIME acceptance, timeout, cache, and retry count are unchanged. This does not classify the consumed live response and is not a hosted Sandbox pass.

Injected streams covered announced length 1048577, a streamed chunk of 1048577 bytes, a throwing stream, an abort, empty and whitespace bodies, `text/html`, invalid JSON, HTTP status 99, a valid JSON catalog that is not a destination list, a valid catalog, and forged enum values at the logger. Each failure made one destinations call. Canaries and the raw parser sentences stayed out of the log and the guest result. `npx tsc -p tsconfig.json --noEmit` passed. `npx eslint . --quiet` passed. The Viator seam file and sandbox client file passed, 21 tests, 0 failures.

## Still blocked

No further real provider call is authorized. The live body subtype remains unknown. Image license, checkout currency, and hosted acceptance stay open. Exact-head CI and Preview for the commit that contains this note are not a pass yet. CI 41198906310 and the OFF deployment above cover `f644dbd3` only. No Ready. No merge.
