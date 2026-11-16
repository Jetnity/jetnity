# Account/Admin Translations 2 – author handoff

Date: 2026-11-15
Implementer: `/root/translations_2`
Branch: `feat/account-admin-translations-2-20261115`
Immutable Task: `8fed57efdf79340fe59f79485e399b5df4b1eeac`, [Task](ACCOUNT_ADMIN_TRANSLATIONS_2_TASK_2026-11-15.md)
Source base: #1207 `bf93a20efd486712a8fb38b123a01cb20f11cac9`
Status: implementation and focused author checks complete; Root integration/CI and signed-in Dev acceptance pending. No CI, deployment or authenticated acceptance claim.

## Implemented

- `/admin/analytics` reads the saved account display language after the unchanged Admin capability guard and passes it into the existing analytics surface.
- Analytics DE/EN covers metrics, source limitations, daily values, range links, zero/unavailable/error framing, accessibility labels, snapshot date and refresh action. Numeric counts, range URLs and the two independent source results are unchanged. Date-only labels never acquire an inferred timezone. Singular trip labels are grammatical in both languages.
- `/account/bookings` uses the same saved language for its page, dynamic metadata and loading state. The metadata retains `noindex, nofollow`. Its loading component uses a shared pure presentation export so the actual loading markup can be verified without imitating an authenticated reader.
- Confirmed-booking cards, GET filters, native options, navigation controls and all distinct empty/error/invalid/continuation states support DE/EN. Existing and legacy component props retain German as the default. The existing German booking dictionary remains authoritative.
- User-entered booking/trip titles and original source diagnostics are preserved. English date presentation uses exact stored calendar dates and time text; German still delegates to the existing date presentation helper. No global trip/date helper was changed.
- Optional language props were added to the shared snapshot/error presentation components; their existing German callers, reload action, retry/stale/pending behavior and original error messages remain compatible.
- Surface-level `lang` attributes identify the displayed language without editing shared shells or navigation.

## Files and boundaries

Changed existing files are exactly the eight UI/route files authorized in the Task. New presentation modules are `analytics-texte.ts`, `buchungen-texte.ts`, `admin-lese-texte.ts`, and `konto-anzeigesprache.ts` under `lib/localization`.

The locale adapter calls the unchanged `uiEinstellungenFuerSeite()` and uses React `cache` for reuse within the server request only. It stores no user/session object or authority globally, writes no preference, and does not catch unexpected exceptions. Existing not-ready results use the already established German display fallback. Preview-only preference environment safeguards remain unchanged; this does not enable Production persistence.

No changes to Supabase schema/types/RPCs, database data, grants/RLS, role/capability logic, Auth redirects/proxy/session/2FA, shared shells, Entry work, refunds, CMS or Marketing implementation. No paid services, campaigns, outbound messages or Production actions. No remote write, push, Ready or Merge by this author.

The Task's 513-path protected snapshot was checked before implementation with zero proposed-path overlap. Root must compare the final source publication against the then-current #1196–#1198 changed-file union. #1202 remains held until the owner's #1197 merge.

## Root-only catalog integration

The common catalog and coverage copy were deliberately not edited. Add these imports/rows to `lib/localization/admin-sprachkatalog.ts` together with any independently ready CMS/Marketing changes, using a single writer:

```ts
import { ANALYTICS_SCHLUESSEL, ANALYTICS_TEXTE } from './analytics-texte'
import { BUCHUNGEN_SCHLUESSEL, BUCHUNGEN_TEXTE } from './buchungen-texte'
import { ADMIN_LESE_SCHLUESSEL, ADMIN_LESE_TEXTE } from './admin-lese-texte'

// In the existing catalog array, preserving its current row contract:
...ANALYTICS_SCHLUESSEL.map((key) => ({ key, de: ANALYTICS_TEXTE.de[key], en: ANALYTICS_TEXTE.en[key] })),
...BUCHUNGEN_SCHLUESSEL.map((key) => ({ key: `bookings.${key}`, de: BUCHUNGEN_TEXTE.de[key], en: BUCHUNGEN_TEXTE.en[key] })),
...ADMIN_LESE_SCHLUESSEL.map((key) => ({ key, de: ADMIN_LESE_TEXTE.de[key], en: ADMIN_LESE_TEXTE.en[key] })),
```

The exported booking list excludes unused grouping and unchanged Account entry-link strings. The shared Admin list includes only the snapshot/error framing actually reached by the translated analytics route. Optional stale/retry-action strings are implemented for compatibility but not counted as route coverage. No global coverage percentage is introduced.

Coverage-copy addition for `lib/localization/einstellungen-texte.ts`:

- DE: Reiseauswertung und bestätigte Buchungen einschließlich Ladeansicht sind nun zusätzlich auf Deutsch und Englisch verfügbar. Gemeinsame Navigation, Sicherheit, Reiseplanung und Einreise bleiben außerhalb dieser Abdeckung. Nutzereingaben und ursprüngliche Diagnosemeldungen behalten ihre Sprache.
- EN: Trip analytics and confirmed bookings, including their loading presentation, now also support German and English. Shared navigation, security, trip planning and entry information remain outside this coverage. User-entered text and original diagnostics retain their language.

Root should incorporate this addition into the actual combined scope wording rather than replacing other workstreams' valid coverage.

## Existing source-test integration item

`lib/account/buchungen-ui.test.ts` is outside this author's ownership. Its `Empty und Error bleiben in der Oberfläche getrennt` test checks literal `BUCHUNGEN_COPY.*` source names. The selected-language object in the component is now `texte = BUCHUNGEN_TEXTE[sprache]`.

Root should update those source-name assertions (`fehlerTitel`, `leerTitel`, `planpunktOeffnen`, `keineTrefferTitel`, `fortsetzungEndeTitel`, `ungueltigTitel`) to match the actual selected-language presentation and retain the existing distinct-branch, alert/status, navigation, overflow and no-write checks. Do not delete the test or weaken its semantic boundary. The new display suite additionally renders the real components for every affected state in DE and EN.

## Verification authored

`lib/localization/account-admin-display-2/display.test.ts` renders the actual components with synthetic inputs. It checks German/default compatibility; identical URLs and stored user text; distinct unavailable, error and zero analytics; exact counts/dates; distinct booking error/empty/no-match/continuation states; legacy props; native field/enum identity and limits; no inferred date/time endpoints; and honest catalog scope.

`lib/localization/account-admin-display-2/browser.test.ts` is selected by the existing core CI test glob without skips or selector changes. Its `scripts/account-admin-display-2/harness.tsx` mounts the actual Analytics/error components; Account markup comes from the actual Server Components, whose existing Node-only query import stays on the server. Native GET form submission is tested as form serialization, explicitly not as database filtering.

The browser proof uses real product CSS, DE/EN at 320px and 1280px with 200% text, keyboard range/form actions, deliberate refresh with a new document identity, original diagnostics, error/zero distinction and pending retry disablement. Network/storage attempts are blocked and recorded; only explicitly allowed local document GETs are permitted. The tsx name helper and isolation callback are installed in one ordered initialization script for every document, including reload. Every residual browser build environment expression fails explicitly.

These fixtures do not log in, read a real account, save a preference, query a hosted database or establish authenticated Dev acceptance.

## Executed checks and pending gates

- Runtime: Node **22.23.5**, the existing prepared binary at `/home/agent/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node`.
- `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/localization/account-admin-display-2/display.test.ts`: **23 passed**, none failed or skipped. [Raw result](evidence/account-admin-translations-2/render.tap).
- `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`: passed, no compiler diagnostics.
- ESLint on all eight changed existing files plus this slice's new localization/harness files: passed, no code warnings/errors.
- Actual Analytics/error fixture browser bundle: compiled successfully with all required Next constants replaced; no remaining `process.env` expression. Compilation did not launch the browser or its fixture server.
- [Check record](evidence/account-admin-translations-2/checks.json), [type result](evidence/account-admin-translations-2/types.txt), [lint result](evidence/account-admin-translations-2/lint.txt), [fixture compilation](evidence/account-admin-translations-2/fixture-build.txt).
- Final staged `git diff --cached --check`: passed after removing five Markdown hard-break spaces together. No runtime/test failure occurred and no historical package test was rerun.
- Local browser/socket/PG execution: not performed, as instructed by Root.
- Full required CI, shared catalog integration and live authenticated Dev acceptance: pending Root.

No test or CI result is claimed for an unexecuted command. Root collects any failures once and returns one grouped correction for this same implementation session.

## Next action and stop point

Root integrates the shared catalog and source-test naming change, publishes the final source candidate and runs the required CI once. Root's manual user-authenticated Dev session verifies actual access and the saved-language route behavior. The author stops at this owned handoff and does not publish, merge, activate Production or start another slice.

## Root integration — 15 November 2026

The independent new-source review found no concrete defect. Root added the three actual catalog groups, retained namespace uniqueness/frozen rows, and updated the combined coverage wording without claiming navigation, security, travel planning or entry translations. Six source-name assertions now select `texte` while all existing semantic/navigation/no-write checks remain unchanged. The original Marketing catalog test now counts its own Settings/Marketing key set; it still verifies every original value and global uniqueness/frozen rows, while the new catalog integration test verifies every added exact row. This permits additional independently owned catalog groups without treating their presence as a failure.

The focused Node 22 integration batch executed 15 cases, all successful with no skips. Existing authored component checks are not repeated. Full source CI and the new real-component browser execution remain pending publication. The live excluded-path union contains 517 files; none of this slice's implementation or necessary Root integration files overlap. Three public Dev branch previews use the existing Dev URL and existing public anon key only; no Production/global credential change.

Authenticated hosted acceptance is still open. Sasa reported a signed-in in-app tab, but the connected-browser tool cannot access the originating browser context. The separate Cloud Browser still showed Vercel sign-in; the secure authentication handoff did not establish a usable test session. No password/cookie/session was copied, no login/2FA was performed by the assistant, and no synthetic component run is described as hosted acceptance.

Root final integration also passed full TypeScript, scoped lint with no diagnostics and all five unchanged hygiene gates. The final candidate contains the author slice plus five necessary Root integration files; no gate, selector or runtime dependency was weakened.
