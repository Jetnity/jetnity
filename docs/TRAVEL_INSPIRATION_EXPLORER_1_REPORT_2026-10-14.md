# Reise-Inspiration Explorer 1 — implementation and author verification

Issue #942 / Draft PR #943. Writer **Jetnity Reise-Inspiration Explorer 1 — Codex Generation 1**, actual session `01a1399d-7921-70d3-81b0-1974081a4852`. One coding writer. This is an author report, not independent TL acceptance or a launch decision.

## Delivered product

`/entdecken` is a real Next public route. The homepage inspiration section gains one discovery link while all four original direct planning links, its `entdecken` anchor, hero and section order remain unchanged.

| Requirement | Implementation and evidence |
| --- | --- |
| EX-01 | Server-rendered four-target catalogue and native GET form; existing public layout. Explicit noindex/nofollow including GoogleBot, canonical `https://jetnity.com/entdecken`; shared origin helper reused without widening its contracts. No global SEO or sitemap change. |
| EX-02 | Exactly existing Bali/Lissabon/Zermatt/Amsterdam identities, images and ideas from `lib/places/inspiration.ts`. Feature-owned original descriptions and editorial theme labels are keyed by canonical ID. Visible four-target scope, no commercial or regulatory claims. |
| EX-03 | Local search across destination, country, description, idea and theme labels; all query words must match. Case/diacritics/ß insensitive, trimmed matching, 120 UTF-16-unit bound, controls cleaned and lone surrogates normalized. One theme plus All, visible count, reset and honest zero-result state. |
| EX-04 | Native keyboard-accessible disclosures explain editable ideas. The unchanged `zielHref({ id: placeId, name }, idea)` supplies only exact `zielId` and `idee`. Failed links render unavailable text. No automatic trip/model/account operation. Existing `/planen` owns confirmation and guest/account behavior. |
| EX-05 | Existing design tokens, responsive single/two-column cards, 16px search input, measured >=44px feature targets, visible focus and stable image aspect ratio. First result image eager, remaining images lazy. Local image-error fallback preserves descriptive text and planning action. No added animation or global overflow hiding. |

## URL and interaction decisions

- Known parameters are `q` and `thema`; first repeated value wins. Unknown theme defaults to All; unknown keys are not used. The client replaces malformed/noncanonical input with the bounded canonical URL. React escapes search text; links have fixed route targets and URLSearchParams encoding.
- A continuous typing edit is one history entry: first effective change pushes, subsequent edits replace until blur/submit/theme/reset. Each theme or reset is a separate step. `popstate` restores normalized state. No local storage or account reads are added by this feature.
- Results update locally without search/API/document requests. Chrome was observed re-requesting the existing `/icon.png` after native History API changes; this asset request is explicitly retained in the receipt. Newly visible lazy images are ordinary existing local assets, not a search service.
- Details use native disclosure state, not a stored destination selection. If a result disappears it unmounts; it cannot survive as a hidden selected destination. Reload restores query/theme and closes transient disclosures. A user explicitly activates the card's planning link.
- Without JavaScript the server renders the same matching results, the GET form applies the query/theme via “Suchen”, details still open and reset/planning links remain usable.

## Local application witness

`scripts/travel-inspiration-explorer-1-audit.mjs` owns ports 3541/3542, refuses occupied ports, starts and stops only its own Next child, and records its environment. It uses the existing `lib/places/fixtures/geonames.tsv` and `countries.txt` through the canonical local importer. A loopback HTTP fixture answers the actual unchanged server-side place confirmation; no database exists behind that fixture. A Node fetch guard rejects nonlocal hosts. Fresh browser contexts reject unexpected origins/writes. No local credentials, hosted session or account data are loaded.

Final run uses the **production build** and real `/` → `/entdecken` → `/planen` routes. It verifies:

1. Keyboard navigation from homepage discovery; all four original card hrefs exactly equal existing `zielHref` outputs.
2. Keyboard text entry, radio-arrow theme changes, no-result transition, native disclosure with visible focus, then Enter on the exact canonical planning action.
3. Actual server reads synthetic `geonames:1650535`; the resulting planning form contains **Bali** and the exact existing idea. The wishes textarea is edited to a new value successfully. Start date and origin remain empty. No form submission or model request occurs.
4. Back from planning, reload, back/forward across theme changes, zero-result/reset and reset focus.
5. 360×800, 390×844, 768×1024, 1440×900: no horizontal document overflow, all measured feature targets >=44px, input >=16px, all four local images loaded.
6. Duplicate/unknown/overlong/malformed URL inputs; canonical and robots; no-JS search/theme/details/reset; image failure; synthetic place-read failure leaves the planning destination unconfirmed.
7. Zero unexpected browser writes/origins and zero browser exceptions.

Receipt: `docs/evidence/travel-inspiration-explorer-1/browser-final/results.json`; selected screenshots and production-server output alongside it. `material-sha256.json` binds the candidate files; the local receipt records its precommit seed HEAD and dirty candidate honestly. The final commit/tree and remote gates are published separately on PR #943. Viewport screenshots were visually inspected by the author; they are not an independent TL pixel review.

## Gates and failures

`npm ci` succeeded in the isolated checkout with unchanged package/lock. It reported the retained 19 advisories (17 high, 2 moderate); no dependency update attempted. Setup, TypeScript, full lint, API protection, schema-reference, dead-code, exports, dependencies and production build succeeded. Lint has 0 errors / 145 existing warnings. Build generated 26/26 static pages and lists `/entdecken` as dynamic. The mode gate initially lacked `origin/main` in the single-branch clone; fetching the live main reference into this clone corrected the invocation and the unchanged guard passed.

Five focused catalogue/normalization/handoff tests passed, including hostile values and a surrogate split at the length boundary. Both existing homepage audits passed without assertion edits. The first full suite ran 6,626 tests /820 suites: 6,614 passed, 11 failed, 1 skipped, 0 cancelled. Ten failures require unavailable local PostgreSQL binaries, including four hard-coded Linux paths. The additional failure was the frozen `next/image` inventory, not a provider/host allowlist failure. The existing application native test self-skipped because binaries were absent; it is **not** counted as executed proof.

The human user explicitly authorized one additional expected inventory path in `lib/security/next-16-3-8-security-upgrade-1.test.ts`, after the exact one-line proposed diff was supplied under TASK §4 arbitration. All security assertions remain intact. The full rerun: **6,626 tests /820 suites;6,615 passed;10 failed;1 skipped;0 cancelled;50.322s**. All ten remaining failures are unavailable native PostgreSQL proofs; the image-consumer inventory now passes. Inventory-file lint also passes. The full test rerun and original failing attempt are retained in `local-gates.json`; final exact-head CI/Auth/Preview evidence belongs to the PR receipt. No local Auth API call was made. A successful remote normal Auth comparison is not permission for a Supabase query.

Development attempts are retained in `development-attempts.json`: sandbox listener EPERM (then approved own local listener); the initial browser assertion incorrectly counted delayed image/favicon requests against keystrokes, then the isolated browser-only favicon observation. The final assertion permits only that recorded asset path and rejects all application requests. Early typecheck found the shared canonical helper only accepts `/` and `/planen`; the page now uses the existing public-origin helper without editing shared code. Early lint required Next Link for the home-return link. No tests, timeouts or workflows were weakened.

## Scope, security and retained limits

Only TASK §4 files plus the explicitly approved one-line security-inventory addition are changed. Base catalogue/resolver/plan creation, homepage hero/page, public layout/navbar/footer/styles, account map, Trip/traveller/Requirements/Official Truth, package/lock/workflows/indexing policy and operating mode remain byte-identical to baseline. This preserves the integrated #939/#941 code; it does not claim a new full runtime test of those unrelated areas. Generated `next-env.d.ts` changes from development were not retained.

No Supabase query/migration, blocked DEV-PREP-1 retry, alternate access, Auth/RLS/security-policy mutation, key/App/backup/Bern/source/provider/paid operation or personal-data write. No new recurring infrastructure or dependency. Reused image paths carry no fresh licence-clearance claim.

DEV-PREP-1 remains first-apply-response-success / independent readback blocked / second not attempted. #936/#937 remains paused, #934 hard-blocked, first-party Official Truth remains the primary product objective. Existing P2 native-test variance, G7 dependency advisories, source/legal/Owner/AAL/Production/launch gates are not resolved by this page.

Residuals: headless desktop Chrome with viewport emulation; no physical smartphone, native browser zoom, screen-reader session, authenticated populated hosted plan, genuine provider/database/entry-rule validation or Production acceptance. Local native PostgreSQL checks remain failed/skipped as recorded; CI evidence is separate. No arbitrary future catalogue or locale coverage claimed.

Next action: independent TL review of final PR HEAD, diff, scope amendment, original gates and evidence. Author keeps Draft and stops; no Ready, merge, force-push, new agent or follow-up slice.
