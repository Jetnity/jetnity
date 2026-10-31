# Jetnity 12Go Official Search Widget V2 — REPORT

Date: 29 October 2026 Europe/Zurich
Implementation: `e53ac39ce51f85e0a13c51b182f2397ad606ca34`
Classification: the production release stays false. R7 shows the shared disclosure and surface preferences. A grant is not a completed search.

## Sources

| Export | Length | SHA-256 | Role |
| --- | --- | --- | --- |
| `12go-widget-allgemein.html` | 472 | `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e` | Production candidate, not executed in the app |
| `12go-widget-route-bangkok-koh-chang.html` | 470 | `5ec53329756cede85c40fbf2113580ef4bff08977b4372257c8d1056ed6950ab` | Reference only |

Parsed general attributes, in order: `src`, `data-one2go`, `data-color`, `data-language`, `data-adaptive`, `data-border`, `data-origin-empty`, `data-destination-empty`, `data-caption`, `data-sub_id`, `data-domain`, `data-curr`. That is 12, not an assumed 26. `data-origin-empty` and `data-destination-empty` are unquoted `true`. The reference file instead has `data-origin="Bangkok"` and `data-destination="Koh Chang"`. Neither file contains a newline. The inserter accepts only the general checksum, and only when a synthetic seam passes `ausfuehrbar: true` with exactly one visible instance. The visitor bundle does not import that inserter.

## R6 parent, 31 October 2026

The closed paragraph is now a conditional consumer. Production denial keeps `data-twelve-go-widget-ausfuehrbar="false"`, shows “Suchformular anfragen”, and after the click says the form is not available. V1 hrefs are unchanged. No trip date, passenger count, or Bangkok value is copied into the frame. The frame `src`, when a test fixture supplies a handle, is exactly `https://jetnity-widgets.vercel.app/embed/twelvego` with sandbox `allow-scripts allow-same-origin allow-forms allow-popups` and `referrerpolicy="no-referrer"`. Ready is accepted only from that frame’s window and origin. One grant is posted to the child origin. Leaving Verbindungen, the mobility detail, or the trip scope removes the frame without a new click. Chrome zoom, a screen reader, and a physical device were not run. Phone sizes in the surface script are emulation. The production client now contains the existing consent inventory string `cdn0.trainbusferry.com` because the consumer imports the CMP controller. It does not contain `jetnity-mobility-search` or the loader path.

## Visitor result

Inside the existing 12Go section, below the V1 links:

> Das allgemeine Suchformular von 12Go bleibt aus. Es startet hier erst nach einer eigenen Einwilligung und einer getrennten Einbettung. Bis dahin bleiben die Links der Weg. Eine Beispielstrecke wird nicht vorausgefüllt.

Marker: `data-twelve-go-widget="consent-blocked"` and `data-twelve-go-widget-ausfuehrbar="false"`. No button. V1 hrefs stay `https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route`. Same-country pairs, three stops, and a return trip stay generic. A planned transfer date is shown as text and is not copied into the URL. `CHF` is not rendered. The widget sub id `jetnity-mobility-search` is not rendered.

A production build of `.next` contained no `trainbusferry` or `jetnity-mobility-search` string in JS bundles.

## Synthetic consent seam

`TwelveGoWidgetPruefung` is not imported by the app. Tests drive deny, grant, close, reopen, trip change, stage-order change, error, and a stale load token. Grant sets `skript: 'allgemein'` only while the seam is executable. The rendered seam still contains no `<script>` and no `src`. Closing clears the script flag and the copy says data already received by 12Go is not deleted.

## Ephemeral loader audit

Harness: Playwright Chromium, temporary profile, no user browser (#748), local HTTPS, viewport 390 then 320. The general bytes were inserted only after the button "Allgemeines Formular jetzt prüfen". Bangkok was not prefilled. No ticket search and no payment.

Before the click: one request, `https://127.0.0.1`, and no 12Go, trainbusferry, or Google request.

After the click, protocol-relative `//cdn0.trainbusferry.com/...` resolved to HTTPS. Observed origins:

- `https://cdn0.trainbusferry.com` — script `/tools/form/de/` query names `id`, `domain`; CSS; `logo.png`; glyphicons woff
- `https://ajax.googleapis.com` — `/ajax/libs/jquery/1.11.0/jquery.min.js`
- `https://agent.12go.asia` — `/tools/form/cnt.php` query names `lang`, `z`, `sub_id`, content type `image/gif`

Referer origin on those first requests was the harness origin `https://127.0.0.1:<port>`. Vendor responses had no Content-Security-Policy. Several had `X-Frame-Options: sameorigin`. No `Set-Cookie` header was observed. `context.cookies()`, `document.cookie`, `localStorage`, and `sessionStorage` were empty. That is not proof the vendor is cookieless: autocomplete selection, search, and booking were not performed. 12Go's privacy policy still describes analytics and advertising.

The form rendered in the host document. Origin showed the synthetic word `Syntheseort` after the audit typed it. Destination stayed empty. The visible date was the vendor preset **November 3**, while the hidden `date` input length before that typing was 0. Jetnity did not send a trip date. Hidden `z` length was 8 and `sub_id` length was 23, matching the public partner id and `jetnity-mobility-search`. Hidden `curr` length was 3. The value was not stored. This audit does not confirm that prices are charged in that currency.

Opaque iframe `sandbox="allow-scripts"` without `allow-same-origin`: the same three origins were requested, and the script referrer was null. The screenshot showed only the black header and one origin field inside the default frame. `#powered` was not found by the frame read used in the script. The forbidden pair `allow-scripts` plus `allow-same-origin` was not tested. No embed route was added.

Jetnity's `next.config.js` and `proxy.ts` set no global Content-Security-Policy. That was a repository read, not a live response-header check of Preview or Production.

## Browser surface of the visitor UI

Class: synthetic SSR markup in ephemeral Chromium, not a logged-in app session and not a physical device.

| Case | Result |
| --- | --- |
| 320, 390, 768, 1440 | Two generic V1 links, no overflow, focus on the link, notice visible, zero buttons |
| Root font 32px at 320 and 390 | 200% text. No overflow. Link height above 44 |
| iPhone 13 and Pixel 5 device descriptors | Emulation only. Same closed result |
| Chrome zoom UI | Not run |
| Physical Android / iOS | Not run |
| Tab | Focus reached the V1 link |
| Escape, Space | Notice stayed `consent-blocked` |
| Enter | Aborted navigation whose URL was the V1 affiliate link. No `trainbusferry` request |

Dated transfer at 390: planned date visible, absent from the href, `CHF` absent from the text, form still closed.

## Gates

| Gate | Result |
| --- | --- |
| Widget tests and existing 12Go affiliate tests | 35 pass, 0 fail, then 16 pass after the final type fix |
| `tsc -p tsconfig.json --noEmit` | pass |
| Focused eslint on writable widget files, max warnings 0 | pass |
| `npm run lint` | exit 0, 0 errors, 178 existing warnings outside this slice |
| `npm run build` | pass. Setup check warned that no `.env` file was present and continued |
| `node scripts/erreichbarkeit.mjs` and `scripts/exporte.mjs` | no orphan, no unused export |
| Schema reference `node scripts/db/verwendung.mjs --pruefen` | pass after R1-F1. `Buffer.from('Bangkok')` is gone. No `Tabelle Bangkok` finding |
| Vercel Preview and GitHub CI on `c2fa11dc` | App job `123714720799` failed at schema-bezug. That head is invalidated. New CI and Preview are not evidence until they finish on the correction head |
| Production acceptance, #968 | not claimed |

## R5.1 light workspace ancestors

The harness body is the light shell, page, and content around `TwelveGoAffiliateLinks`. The witness reads the computed color of `.text-ink-800` inside that scope and compares it with `--white-mint-muted`. At 1440 the page offset must be at least 200px, which is the sidebar inset from `workspace.css`. A bare body fails that witness. No production defect is claimed from this harness.

## R5 current styles

The surface script compiles `styles/globals.css` with `tailwind.config.js`, nesting, and autoprefixer, then appends `styles/white-mint.css`, `components/workspace/workspace.css`, and `components/workspace/workspace-surfaces.css`. That is the layout order followed by the workspace shell. No global CSS file was edited. The rendered component is still `TwelveGoAffiliateLinks`. Root font 32px is 200% text, not browser zoom. Phone cases are emulation. Non-loopback requests are aborted. Enter may attempt only the existing V1 affiliate URL, and that attempt is aborted.

## R4 binds the browser check to the component

The fixture page is `renderToStaticMarkup(TwelveGoWidgetRahmen)` plus a click handler that sets `src` on `[data-twelve-go-rahmen="leer"]`. The handler is not part of the component. Replacing that markup with no iframe, two iframes, height 150, or `allow-same-origin` fails `rahmenBeweis`. The browser run at 320 and 390 measured the component iframe at full width and 800px, parent document access stayed null, and one local character was typed. Every non-loopback request is aborted and recorded. None occurred. Evidence for that run was written under the explicit output variable, not a path stored in git. Default without the variable is the OS temporary directory. This remains a local stub. The R2 official-form observation stays dated. Search, consent, and legal acceptance are not claimed.

## R3 source preparation

Production execution is still closed. `twelveGoWidgetDarfAusfuehren({ enabled: true })` is false after an informative grant. The new route `app/embed/twelve-go/route.ts` returns 404 for GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS, including `?consent=1` and a cookie. The body is `Not found` and the CSP is `script-src 'none'` with no `https:` allowance.

`TwelveGoWidgetRahmen` can render an iframe with `sandbox="allow-scripts"`, width 100%, and height 800px, and only for the synthetic purpose. It has no `src`. `TwelveGoAffiliateLinks` does not import it. V1 links are unchanged.

Local Playwright at 320 and 390 put a same-origin stub form in that frame after a click. Parent `contentDocument` was null. Origin, destination, and date were inside the 800px window. One character was typed. No request reached 12Go, trainbusferry, or googleapis. This does not repeat the official widget load. That visibility remains the R2 audit: default iframe 300×150 clipped a 369px document; 800px showed the real controls. Search and booking stay `NOT_PROVED`.

`apps/widgets-host` was not edited. Its separate inert 12Go route is another writer's host.

## Security and cost

No new secret, API key, database, Auth, RLS, provider contract, or runtime cost. The partner id and sub ids are the public values already in the task. Direct insertion of the official snippet would execute an old jQuery build in the Jetnity origin and send the page origin to 12Go and Google. That path is not shipped.
