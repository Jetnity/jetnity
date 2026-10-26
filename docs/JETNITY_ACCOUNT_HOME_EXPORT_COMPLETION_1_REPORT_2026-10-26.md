# Account Home and Export Completion 1 — Report

**Lane K · 26 October 2026 · Cursor Generation 1**

## Integration

Accepted U main `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84` (tree `a1a3e145b6870fa5e1d4c2f00bb04f9d5c240d8a`) was merged with a normal merge commit `db09b714d4fe57459e37b672fef603853b66d0d4`. Parents are the reviewed R1 head `c020b7cb81616d469d8021cb33395afe653ef659` and that main. The merge had no conflicts. S, T, A and U stayed as accepted input. `package.json` and `package-lock.json` were not edited after the merge. `npm ci` resolved `ws@8.21.0` and `source-map-js@1.2.2`.

Proof commit `d5b7bf3392bca6ed4d9d675d3d1b053c87d466bd` (tree `e50bd37d337968788c0eb64c4b2911af463f8eb8`) is 11 ahead and 0 behind that main. Its parent is the merge. The mounted audit on the integrated CSS refuses a blank id and a duplicate id inside one table, and the valid download contains one row in each of the 13 tables.

TASK V1 was not edited. Seed `8a9e5479337090079839629715f9a3f1a03116f9` remains the parent of the implementation commits:

1. `2d57b165733fa0f3d87d2ebea56c68c3b239d581` — loaded window and local calendar
2. `2b442737e2f0d0374eb653ab744bb837521b9ff7` — in-page export and id pagination
3. `276c9d20ebf9cd325f2c58cfaaefcf18b3e6cfe5` — mounted proof

## Loaded window

`reisenLaden()` is unchanged and still returns at most 200 rows, newest `updated_at` first. Home derives the window from that array length. World derives the same window and passes it through `ReiseFensterRahmen`, because `AccountBesuche` JSX is locked and cannot take a new prop.

- 0 and 199 rows: the whole result of this reader. The next-trip sentence can stay global.
- 200 rows: neither a proven full account nor a proven truncation. Copy says the next trip and planned places are only inside the loaded rows, and links to the existing collection `/reisen`.
- An earlier upcoming trip that this reader did not return is not called the global next trip. The unit fixture covers that label. The mounted 200-row case shows the loaded-window label.
- Archived-only at 200 does not say there is no open trip in the account.
- Trip failure and visit failure stay independent. A visit failure leaves the loaded trip in place. Neither failure becomes an empty success.
- Recovery is a normal `<a href>` to `/account` or `/account/welt`. The copy says the navigation itself does not confirm new data.

`WorldExplorer` keeps its old heading when no reachability text is passed. The product atlas passes a window sentence so "Gesamt in deinem Konto" is not shown for this capped reader. Geography, search, filter and marker behaviour were not retuned.

## Calendar

`useGeraetekalendertag` reads `getTimezoneOffset` and the local date helpers that already avoid `toISOString`. It recomputes on mount, focus, pageshow, visibility, and a timer that waits until local midnight or at most 60 seconds. Cleanup removes the timer and the listeners. The first paint uses `unbekannt` until the device day exists, so the first frame is not a UTC day. Nothing is written to storage and nothing is fetched.

## Export delivery

Settings no longer uses a bare download link. `KontoDatenexportAktion` sends one `GET /api/account/export` with `no-store`. A second click in the same turn does not send a second request. There is no automatic retry.

401, 500, 503, non-JSON, malformed JSON, cancel, the 30-second deadline, and unmount stay in Account and do not download. The document is checked for schema version, scope and the 13 table arrays before `createObjectURL`. The object URL is revoked. A late body after cancel, unmount or a newer generation does not download, including when the test runner holds the response until after cancel. An explicit later click can succeed once.

Success copy says the file was handed to the browser. It does not say the operating system saved it, that the tables are one atomic snapshot, that the file is a complete legal export, or that deletion is authorized. The client does not import `lib/account/datenexport.ts` (`server-only`). The public contract strings are duplicated and tested equal.

`KontoLoeschen.tsx` line with `href="/api/account/export"` is unchanged. The route file is unchanged.

## Pagination

Each of the 13 tables is read with `.eq('user_id', id).order('id', { ascending: true }).range(von, bis)`. Page size stays 1,000. The cap stays 20,000. Column lists and `jetnity.account-export.v1` stay.

A page fails the whole export, with no partial document, when the page is larger than 1,000, an id is missing or not a trimmed string, an id repeats inside the page or across pages, or a non-empty page repeats the previous page signature. The signature is checked before the cross-page duplicate set, so a repeated page is "no progress" rather than a duplicate id. Messages do not echo row contents. An empty page ends that table. Exactly 20,000 rows followed by an empty page succeeds. 20,001 fails.

Supabase JS docs for `order` and `range`, read 26 October 2026, say range follows order and can behave unexpectedly without it. The changelog scan in this session found no newer JS range/order contract. The SDK was not upgraded. No hosted query was run. Stable per-table order is not a cross-table snapshot: tables are read one after another, and writes in between remain visible. That sentence is in `datenexport.ts` and in the settings success copy.

## Mounted proof

`node scripts/account-home-export-completion-1/audit.mjs` bundles the real components with esbuild and opens them in headless Chromium. The page origin is `http://127.0.0.1:8765/konto`. Every other http(s) request is aborted. Fixtures are synthetic.

The first mounted pass used an earlier stylesheet. The integrated pass inlines the production CSS built on this branch after the accepted-main merge (101,364 characters in the style tag). The fresh protocol is `docs/evidence/account-home-export-completion-1/mounted-proof.json`. It records:

- Mount on 2026-08-23 makes the same-day trip active. A shortened timer across local midnight makes it "continue". Offset +120 at 2026-08-24T00:30Z stays active. Offset −180 at 2026-08-23T22:30Z is already the next local day. Focus after a jump to 27 August and a new offset does not call `/api/`. Unmount leaves no page error.
- 200, 199, 0, archived-only 200, trip 503, and visit 500 with a September trip.
- World atlas at 200 rows uses the loaded-window sentence and `/reisen`. A world trip failure offers reload of `/account/welt` and does not say the account total is known.
- Home at 320, 390, 768 and 1440, then 1440 with root font-size 32px, had no horizontal overflow. One Tab from a blurred document focused "Zur vollständigen Reiseauswahl".
- Export: Enter on a valid document whose file contains one row in all 13 tables (1 request, 1 download, revoke), 401, 503, 500, plain text, bad JSON, `not-a-date`, null, scalar, array, blank id, and a duplicate id inside `trips`. Then pointer focus, keyboard focus, timeout, double activation (still 1 request), keyboard cancel of a late 200, an old body that does not settle the newer request, an explicit retry, a second deadline, and unmount. Final counts: 21 requests, 3 downloads, 3 revokes, 0 page errors.

Screenshots: `home-320.png`, `home-390.png`, `home-768.png`, `home-1440.png`, `home-1440-200-prozent.png`, `welt-320.png`.

## R1 corrections

Reviewed head `3d3a24b8c0272f3fdbd7ad14f81ffb1615a9a1d4`. Those corrections are inside the merged history. The integrated audit re-ran them.

**R1.1.** `world-map.ts` still derives the global empty sentence. Presentation replaces it only when the loaded window is at the 200 cap: the compact map description, the visible empty hint, the planned total, and the atlas empty list. A whole reader result of zero trips may still say the account has no planned places. Successful empty visits stay “Noch keine Besuche bestätigt”. A failed visit stays a failure. A failed trip stays a failure and does not become an empty map.

**R1.2.** Success, HTTP failure and the deadline update `role=status` or `role=alert` and do not call `focus`. Focus moves to the message only after an explicit cancel, and only while focus is still in the export control or has dropped because that control unmounted.

**R1.3.** Before `createObjectURL`, `generatedAt` must be the canonical `Date#toISOString` form the server writes. Each row must be a non-array object with one trimmed non-empty `id`, with no repeated id inside that table. That is the existing server identity check. The client does not add columns, change the route, or apply a new cap. An invalid body does not download.

`WorldExplorer.tsx` was edited before it was allowlisted. Root’s R1 addendum now grants coverage, empty-state and recovery presentation in that file only. Geography, search, markers and selection are unchanged. TASK V1 was not edited.

## R2 Home actions

Reviewed head `33d2874493ffe41aef6f621fa4d2a67cd5263edf`. At `xl`, the next-trip row put a long title beside an action column of `xl:w-56` that was also `min-w-0`, so the column could shrink below the label. The links used a fixed `h-11` and did not wrap. Root measured “Reise fortsetzen” outside the dark link at 1440 for `('Lissabon '.repeat(13)).trim()` (116 characters, within `GRENZEN.titel` of 120), at 16px and at a 32px root. The same measurement exists on accepted main `7c5b32d309fa52f18bca1b1744421cb5b2cd1c84`. Navigation still reached `/reisen/r0`. This was readability, and it is inside the owned Home card.

The column is now `xl:w-56 xl:shrink-0` without `min-w-0`. Each link is `min-h-11` with vertical padding, and the label is a wrapping span. The visible words and the hrefs are unchanged. No ellipsis, no overflow clipping, no smaller type, no hidden action, and no change to the title limit.

The audit’s older long title is `('Lissabon '.repeat(24)).trim()` (215 characters). That remains, and the protocol calls it stress evidence outside the 120-character contract. It is not described as a valid stored title. The pre-correction 1440 screenshots are `home-1440-before-r2.png` and `home-1440-200-prozent-before-r2.png`.

The valid case is mounted at 1440×900 with production CSS. Text rectangles of both labels stay inside the link boxes at 16px and 32px. The links stay inside the card, do not overlap, and meet a 2.75rem minimum box. Enter on “Reise fortsetzen” requests `http://127.0.0.1:8765/reisen/r0` once. The same label check also passes on the 215-character stress fixture at 320, 390, 768 and 1440, including 32px at 1440. A page-level scrollWidth check is still present and is not treated as proof of the labels.

## R3 trip text and actions

Reviewed head `378f5c01b321f4a35d571251896dfa94b82c2cbc`. The R2 column `xl:w-56 xl:shrink-0` is 14rem. At a 32px root that is 448px inside a 704px card, so the title column was 78px. The valid 116-character title broke inside “Lissabon”, and “Nächste Reise in den geladenen Reisen.” painted over the buttons. The action-label checks stayed green because they did not measure the trip text.

The card is now one column. The actions wrap under the text and size to their labels from the small breakpoint up. The eyebrow, status, title, origin and dates can wrap on word boundaries. Font sizes, the full title and both hrefs stay. There is no ellipsis and no clipping.

The mounted audit measures text rectangles for those five fields and both actions. A word that breaks across rectangles fails. A rectangle that meets an action fails. At 1440 and 32px the 116-character title is 7 lines. At 320 and 32px it is 13 lines, one intact “Lissabon” per line. The same matrix covers 390 and 768 at both root sizes. Enter on each action is fulfilled on `127.0.0.1` and requests `/reisen/r0` and `/reisen` once. The 215-character title remains a separate stress fixture. Its earlier R2 failure shots stay `home-1440-before-r2.png` and `home-1440-200-prozent-before-r2.png`. The R3 overlap shot is `home-1440-titel-116-200-prozent-before-r3.png`.

## Limits of that proof

- 200% text is `documentElement.style.fontSize = '32px'`. It is not operating-system zoom and not a real device.
- The world case mounts `AccountWeltKarte` inside `ReiseFensterRahmen`. It does not mount `AccountBesuche`. Bundling the visit form pulled `next/server` into the browser build. The page still wraps `AccountBesuche`, and that component renders `AccountWeltKarte` with no extra props, so the context is the channel the product uses. Visit writers were not edited.
- Home overflow was measured at 16px root for the four widths, then at 32px on 1440. The world 320px shot was taken at 32px root. Desktop atlas breakout at 1440 was not asserted, because that wide layout already exists and this lane does not retune geography.
- Keyboard proof is one Tab on the home overview plus Enter on the export button. It is not a full tab-order walk.
- The harness is not a Next.js document navigation. CSS is the built stylesheet inlined into a local HTML document.
- No signed-in account, no private export payload, no hosted database, no Preview acceptance for this head. The Vercel comment already on #1036 belongs to the seed deployment.
