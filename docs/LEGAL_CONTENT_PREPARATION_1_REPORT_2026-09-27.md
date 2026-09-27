# Legal content preparation 1 — Report

Date: 27 September 2026
Status: **DOCS-ONLY PREPARATION / NOT PUBLICATION / NOT LEGAL APPROVAL**
Logical agent: **Jetnity legal content preparation 1**
Generation: **1** (replacement session after the stopped 4.6 bind; not a new slice)
Session: `bc-efbd2a0c-d64b-4e37-b054-b7c583cabdac`
Model evidence: run-info `originalModelName=grok-4.7`, plus the Product Owner continuation in this same session that Grok 4.7 High Fast is selected. That pair is the accepted model evidence for this delivery. UI renaming of the agent card was not verified.
Branch: `docs/legal-content-preparation-1`
Seed head before these five files: `60c849130a354d17b8193b6e16c420c6f2afaa26`
Baseline main at read time: `4d1888f95aec3395e35c785bcb3e0d83301d5cec`
Task (read-only): `docs/LEGAL_CONTENT_PREPARATION_1_TASK_2026-09-27.md`
Canonical issue: [#577](https://github.com/Jetnity/jetnity/issues/577)
Draft PR: [#578](https://github.com/Jetnity/jetnity/pull/578)

The exact pushed head of this delivery is reported in the #578 handoff comment. It is not repeated inside this file, because this file is part of that commit.

This report is a source dossier and a Preview integration specification. It is not a privacy policy, not an imprint publication, and not a compliance certificate.

## 1. Evidence classes

| Class | Meaning in this file |
| --- | --- |
| `repository` | Code, migration, or test present in the seed tree above. Line numbers are from that tree, read 27 September 2026. |
| `contract` | Existing Jetnity contract. Not rewritten here. |
| `historical-doc` | Dated repository prose. It can be stale. It is not a fresh Production read. |
| `live-recorded` | Technical-Lead observation already written in #577. This writer did not repeat the browser, DNS, or HTTPS checks. |
| `po-confirmed` | Explicit Product Owner confirmation recorded in #577. Not an independent mailbox or registry test. |
| `vendor-public` | Public PrivacyBee page fetched read-only on 27 September 2026. Not the account-specific AVV and not the generated policy export. |
| `unknown` | Not established. Left unknown. |

This writer did not read the original PrivacyBee screenshot files, did not export the generated policy as text, did not sign in to PrivacyBee, and did not read private database rows or Production environment variables.

## 2. Processing matrix

Legal basis, retention period, storage region, and transfer safeguard are **unknown** for every row unless a cell says otherwise. A code constant is evidence of that mechanism only.

### 2.1 Account, auth, session

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| Email/password signup | `repository` | `signUp` sends email, password, and `user_metadata.name` (typed name, otherwise the local part of the email). Redirect goes to `/auth/callback`. | `components/auth/RegisterForm.tsx` lines 127–133 | Whether Production email confirmation is required. Supabase project region. |
| Register checkbox | `repository` | Checkbox starts unchecked in component state. Submit is disabled until it is checked. The choice is not written to Auth or to a consent table. OAuth start on the same form does not read `accept`. | `components/auth/RegisterForm.tsx` lines 77, 107, 165–173, 381; inventory `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` lines 87–92 | This is not a stored consent record. |
| OAuth Google/Apple | `repository` | Buttons exist. Local `supabase/config.toml` sets `[auth.external.google].enabled = false` and `[auth.external.apple].enabled = false`. | `supabase/config.toml` lines 305–312; `lib/auth/oauth-anbieter.ts` lines 16–18 | Hosted Production Auth provider flags were not read. Local toml is not proof of the hosted project. |
| Session mechanism | `repository` | Server clients use `@supabase/ssr` cookie adapters. Server Components read cookies. Route handlers and Server Actions may set them. Authorization uses `auth.getUser()`, not `getSession()`. | `lib/supabase/server.ts` lines 65–93 and 102–105; `lib/auth/admin-guard.ts` lines 67–76 | Exact Supabase cookie names and lifetimes are not hardcoded in Jetnity. |
| Password storage | `repository` | The password is passed to Supabase Auth. `public.profiles` columns retained after the generic-profile migration do not include a password. | `components/auth/RegisterForm.tsx` lines 127–133; `supabase/migrations/20260817120300_generisches_profil.sql` lines 33–35 | Auth-provider hashing and retention are not specified in this repository. |
| Account deletion by the user | `repository` | No `app/account/delete` page. Settings say the JSON download is not account deletion. | `app/account/settings/page.tsx` lines 66–68; inventory test lines 175–188 | No consumer deletion promise exists to describe. |

### 2.2 Profile

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| Profile shape | `repository` | `creator_profiles` was renamed to `profiles`. Creator social columns were dropped. Remaining identity fields named by that migration: `user_id`, `email`, `display_name`, `avatar_url`, `role`, `status`, `created_at`, `last_seen_at`. Status values after the migration: `active`, `pending`, `disabled`, `banned`. | `supabase/migrations/20260817120300_generisches_profil.sql` lines 33–35, 68–80, 96, 109–112, 124–125 | Whether a later migration added columns. The export column list below is the later repository claim for the export shape. |
| Email and display name copy | `repository` | Trigger `profil_kerndaten_aus_auth` copies email from `auth.users` and fills an empty `display_name` from `full_name`, then `name`, then the local part of the email. It does not overwrite an existing display name. | same migration, lines 147–170 | — |
| Who can read profiles | `repository` | RLS select for `authenticated`: own row, or `hat_rolle_mindestens('admin')`. The admin user page additionally requires capability `konten-verwalten` and the admin guard’s AAL2 rule. | `supabase/migrations/20260817100600_policies_zusammenfassen.sql` lines 30–32; `app/(admin)/admin/users/page.tsx` lines 37–53; `lib/auth/admin-guard.ts` lines 7–11 | Production role assignments were not read. |

### 2.3 Trips and travellers

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| Trip graph | `repository` | Account trips are database rows. The export list names `trips`, `trip_stages`, `trip_days`, `trip_items`, and related traveller/readiness tables. Access for the signed-in user is through the existing Supabase client and RLS. This slice did not re-audit every trip policy. | `lib/account/datenexport.ts` lines 19–33 | Full column-level purpose text for every trip field. |
| Trip travellers | `repository` | `trip_travellers` stores a short label, nationality and residence as ISO-2 codes when present, document type (`passport`, `national_id`, `unknown`), issuing country, and an expiry date. Comments and checks forbid document numbers in the label. | `supabase/migrations/20260822020000_trip_travellers.sql` lines 1–58 | The migration header says “Nur Development. Nicht Production.” Whether this table is applied on Production was not verified by a hosted schema read. The export contract later lists the table as a current export column set. That tension stays unresolved. See §2.8. |
| Account traveller registry | `repository` | `account_travellers` stores label and residence country. Citizenships are ISO-2 rows with no primary citizenship. Documents store type, optional issuing country, optional citizenship link, and expiry. Comments exclude numbers, scans, MRZ, biometrics, date of birth, and health data. Input keys for numbers, MRZ, scans, biometrics, date of birth, and health are rejected. | `supabase/migrations/20260829201500_account_traveller_registry_persistence.sql` lines 10–44 and 90–119; `lib/traveller/account-registry-eingabe.ts` lines 17–45 | Same Production-application uncertainty as other later migrations: repository presence is not a hosted catalog read. |
| What is not stored | `repository` | No passport number, MRZ, scan, or biometric column in those traveller tables. | sources in the two rows above | A future extra gate could add them. This dossier must not describe them as stored. |

### 2.4 Guest browser storage and quota cookie

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| Active guest trip | `repository` | One active guest trip in `localStorage` under `jetnity:reise:v3`. The server does not create a guest account. | `lib/trips/gastspeicher.ts` lines 82–83; comments lines 1–7 | Browser retention until the user clears storage. No server-side lifetime. |
| Legacy and queue | `repository` | Older `jetnity:guest-trips:v2` drafts are migrated: newest becomes active, the rest go to `jetnity:reisen-warteschlange:v3` (cap 20) and are taken over on the next login. The legacy key is removed only after the new write is confirmed. | `lib/trips/gastspeicher.ts` lines 20–34, 85–97 | How many browsers still hold the legacy key. |
| Removal | `repository` | `gastreiseEntfernen()` clears the active key only if the write-back confirms removal. After a successful account takeover, `uebernommenStreichen()` clears that one trip. A failed clear is tolerated only because `reise_anlegen()` is idempotent on `client_ref`. | `lib/trips/gastspeicher.ts` lines 1141–1144 and 1157–1183 | — |
| Quota cookie | `repository` | Name `jetnity_gast`. httpOnly, SameSite `lax`, path `/`, max-age 30 days, 32 hex characters. `secure` is set when `NODE_ENV === 'production'`. The raw value is not what `model_usage` stores; the stored value is a SHA-256. | `lib/modell/gast-cookie.ts` lines 7–14; `lib/modell/kontingent.ts` lines 22–33 and 87–108 | Legal classification (essential vs consent) is `unknown`. |
| When the cookie is written | `repository` | `gastkennung()` runs from `kontingentBeanspruchen()`. The trip-suggestion action calls that function only when `modellZustand().aktiv` is true. Ordinary page views do not pass through this function. | `lib/modell/kontingent.ts` lines 127–139; `lib/reisevorschlag/aktionen.ts` lines 54–68 | Whether Production currently has the model path active. See §2.6. If it is off, this cookie is not set by this path. |

### 2.5 Admin access

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| Admin gate | `repository` | Admin surfaces require a verified user, role/capability or the documented break-glass path, and `currentLevel === 'aal2'`. | `lib/auth/admin-guard.ts` lines 7–11 and 67–76 | Who currently holds an admin role. |
| User-directory PII | `repository` | `/admin/users` selects `user_id`, `email`, `display_name`, `role`, `status`, `created_at`, `last_seen_at` and can search display name and email. The table renders those fields. Capability `konten-verwalten` is required. A read error is shown as an error surface, not as an empty user list. | `app/(admin)/admin/users/page.tsx` lines 37–80; `components/admin/UsersTable.tsx` lines 26–34 | — |
| Break-glass | `repository` | Break-glass can open the surface while role-bound data access of that session stays denied. | `lib/auth/admin-guard.ts` lines 55–63 | — |
| Model-usage admin view | `repository` | Analyst model-usage reads are behind capability `betrieb-lesen`. The table itself has no email column; the identifier is `kennung_hash`. | `lib/admin/analyst/model-usage-typen.ts` line 12; `supabase/migrations/20260818040000_modellnutzung.sql` lines 93–100 and 145–148 | Whether any admin screen joins the hash back to an email. No such join was found in this read. |

### 2.6 Infrastructure and optional processors

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| Vercel hosting of jetnity.com | `live-recorded` | On 27 September 2026, Gate A recorded `jetnity.com` on the existing Vercel project `jetnity-app`, HTTPS 200, HTTP to HTTPS, managed certificate, HTML `noindex, nofollow`, and `robots.txt` disallow-all. `NEXT_PUBLIC_ALLOW_INDEXING` was not found set to `true`. | #577 comment [5850986944](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5850986944) | This writer did not repeat that fetch. Vercel log content, log retention, and region were not established. |
| Indexing guard in code | `repository` | Indexing requires production, exact `NEXT_PUBLIC_ALLOW_INDEXING=true`, and exact origin `https://jetnity.com`. Otherwise HTML robots are noindex/nofollow and `robots.txt` is disallow-all with no sitemap. Sitemap paths are only `/` and `/planen`, and only when indexing is allowed. | `lib/seo/oeffentlicher-origin.ts` lines 24–25, 59–61, 138–147; `lib/seo/robots-regeln.ts` lines 41–54; `lib/seo/oeffentliche-metadata.ts` lines 37–47; `lib/seo/index-grenze.ts` line 19 | Current Production env was not re-read. The Gate A search is the latest recorded check. |
| Supabase | `repository` | App data and Auth use the public Supabase URL and anon key on the server, with RLS. A service-role client exists only inside `lib/modell/kontingent.ts`, without cookies, and only for the quota RPCs. | `lib/supabase/server.ts` lines 7–8 and 65–93; `lib/modell/kontingent.ts` lines 63–78 | Project ref, region, DPA, and log retention. |
| GeoNames | `repository` plus `historical-doc` | Place search reads local `public.places`. Docs say the rows come from a GeoNames dump plus local airports, not from a live GeoNames webservice, and that no GeoNames username is used. The footer names GeoNames (CC BY 4.0). | `docs/ORTE.md` lines 14–18 and 32–38; `components/layout/Footer.tsx` lines 87–95 | Whether the Production `places` table is currently populated was not re-checked. A 29 August 2026 smoke note in `docs/ORTE.md` is historical. |
| OpenAI model path | `repository` plus `historical-doc` | A call requires `JETNITY_MODELL_AKTIV` of `true` or `1`, a non-empty `OPENAI_API_KEY`, and a known model name. Otherwise no call. `model_usage` stores function, model, account-or-guest class, SHA-256, token counts, duration, and cost. It does not store the prompt, model output, or raw account id. `docs/MODELL.md` says Production was left off. | `lib/modell/konfiguration.ts` lines 186–204; `supabase/migrations/20260818040000_modellnutzung.sql` lines 73–100; `docs/MODELL.md` lines 7, 279, 349 | Current Production values of the kill switch and key. Historical “Production off” is not a fresh env read. Do not describe OpenAI as an active Production processor. |
| Flights, hotels, activities, mobility, rental cars | `repository` | Search kill switches treat `VERCEL_ENV=production` as hard off. Missing flags or missing provider access stay off. Duffel live tokens are rejected by the test-token check used for the Phase 3.1 path. | `lib/flights/zustand.ts` lines 6–8 and 35–38; `lib/hotels/zustand.ts` lines 1–9; `lib/provider-ops/zustand.ts` lines 17–27; `lib/flights/duffel/zugang.ts` lines 14–17 | Preview/development flags were not read. These adapters are not listed as live Production processors. |
| Analytics, ads, cookie banner | `repository` | `CookieConsent.tsx` is absent. Inventory test rejects known analytics packages and the old consent storage key. No PrivacyBee script is installed by this gate. | inventory test lines 111–153; #577 comment [5851358367](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851358367) | A future tracker would be a separate gate. |
| PrivacyBee as a vendor | `live-recorded` plus `po-confirmed` | The existing Swiss PrivacyBee account contains `jetnity.com`. Scan, German DSE preview, and imprint preview were recorded. Widgets are not installed. Trial end 11 October 2026 and CHF 59.35/year continuation were accepted by the Product Owner. | #577 comments 5851299265 and 5851358367 | AVV/DPA, TOM, and TIA copies were not supplied to this writer. Server locations inside the AVV were not read. |

### 2.7 Logging, deletion, retention

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| `model_usage` retention | `repository` | No cron job is created. A commented manual statement mentions 90 days. `docs/MODELL.md` says there is no automatic deletion. The cleanup in `scripts/db/kontingent.ts` deletes fixture rows of that script, not a production schedule. | `supabase/migrations/20260818040000_modellnutzung.sql` lines 423–436; `docs/MODELL.md` line 262; `scripts/db/kontingent.ts` lines 111–119 | Whether anyone has run the manual delete. 90 days is not an enacted retention period. |
| Account export | `repository` | Signed-in `GET /api/account/export` returns a JSON file of the listed own rows via the user client. Settings say it is not a complete legal access file and not deletion. There is no rate limit that holds across serverless instances. | `app/api/account/export/route.ts` lines 24–48; `lib/account/datenexport.ts` lines 1–8 and 19–33; `app/account/settings/page.tsx` lines 61–68 | Whether the export is reachable in Production. The inventory test still asserts there is no `app/account/export/page.tsx`; the API route is separate and does exist. |
| Account deletion | `repository` | Not implemented as a user route. `account_travellers.user_id` is declared `on delete cascade` from `auth.users`, which would matter only if the Auth user were deleted. | `supabase/migrations/20260829201500_account_traveller_registry_persistence.sql` lines 19–22; inventory test lines 183–185 | No deletion deadline, no export-before-delete flow. |
| Hosting and Auth logs | `unknown` | Jetnity code does not define a platform log retention period. Admin list failures are written with `console.error`. | `app/(admin)/admin/users/page.tsx` lines 72–73 | Vercel and Supabase log content, IP logging, and retention. The generated DSE claim that logs are deleted after each session is **not** established. |
| Visit history | `repository` | `account_visits` is an explicit, user-confirmed visit. Coordinates are copied from `public.places`, not typed by the client as free geography. The migration header says development only, not Production. The export column list includes the table and latitude/longitude. | `supabase/migrations/20260917120000_account_visits.sql` lines 1–35; `lib/account/datenexport.ts` lines 94–100 | Production presence is `unknown` because the migration header and the export comment disagree in emphasis. Do not describe visit history as a proven Production processing activity. |

### 2.8 Contradictions left visible

1. `docs/ORTE.md` and `ARCHITECTURE.md` still describe `jetnity.com` as not attached, or indexing/domain cutover as not done. Gate A later attached `jetnity.com` in prelaunch/noindex mode. Live-recorded Gate A wins for domain attachment. Those older sentences are stale. This preparation does not edit them.
2. `account_visits` and the Foundation C traveller migration tell the applier not to use Production. Later export code treats those tables as the current export column set. This dossier does not decide which is true on the hosted database.
3. `docs/MODELL.md` says Production model use is off. The code is fail-closed, but this run did not read Production env. Current activation stays `unknown`.
4. AP-6a input row 1 still says operator identity is missing. Product Owner confirmation on 27 September 2026 supersedes that gap for the facts listed in §3. It does not approve the generated policy.

## 3. Controller facts used by the drafts

| Fact | Class | Source |
| --- | --- | --- |
| Operator: Feirov Global Trading, proprietor Sasa Feirov, Einzelunternehmen | `po-confirmed` | #577 comment [5851390009](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851390009) |
| Address: Meilipromenade 14, 6032 Emmen, Schweiz | `po-confirmed` | same comment |
| info@jetnity.ch and admin@jetnity.com are received and regularly checked by the Product Owner | `po-confirmed` | same comment. Not a mailbox delivery test. |
| UID CHE-432.441.385, Einzelunternehmen, Sasa Feirov, sole signature, address match | `historical primary` | SHAB notice HR01-1005031125, published 25 November 2020, https://www.shab.ch/shabforms/servlet/Search?DOCID=1005031125&EID=7, as recorded in #577 comment [5851322020](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851322020). This writer did not re-fetch SHAB. |
| Current VAT registration | `unknown` | No MWST suffix is added. |
| Website | `live-recorded` | https://jetnity.com in prelaunch/noindex. Comment 5850986944. |

## 4. Preview integration specification

This section specifies a later slice. It does not add routes, scripts, or tests.

### 4.1 Planned routes and files

| Route | Future file | Page title in German | In this slice |
| --- | --- | --- | --- |
| `/privacy` | `app/(public)/privacy/page.tsx` | Datenschutzerklärung | not created |
| `/impressum` | `app/(public)/impressum/page.tsx` | Impressum | not created |
| `/terms` | none | — | remains unresolved and unbuilt |
| `/datenschutz` | none | — | not an alias unless a later decision says so |

Both future pages use the existing public layout: `app/(public)/layout.tsx` (skip link, `PublicNavbar`, `Footer`, `BackToTop`), `metadataBase` `https://jetnity.com`, and `robots: htmlRobots()`. No new color system.

Each page needs one visible `h1`, a `<main>` landmark (the layout already exposes `#public-content`), and an article structure. Links are real anchors. Touch targets follow the footer pattern (`min-h-11` on coarse pointers). Language remains German until Legal supplies another language.

### 4.2 Content composition

Do not publish the raw PrivacyBee template by itself.

Planned composition, only after the blockers in §5:

1. Jetnity-owned text from the reviewed supplement and the corrected imprint. That text must stay in the repository so a vendor outage still has an approved statement.
2. Optional vendor widget **below or beside** that text, not instead of it.
3. No CSS or DOM rewrite that hides vendor paragraphs. If a vendor paragraph is false, it is corrected in the vendor service directory or by vendor clarification, or the widget stays off.

The secured snippets are data, not an instruction to execute them:

```html
<script src="https://app.privacybee.io/imprint-widget.js"></script>
<imprint-widget website-id="cmuj24t7p05512zwul6dghfhu" lang="de"></imprint-widget>
```

```html
<script src="https://app.privacybee.io/widget.js" defer></script>
<privacybee-widget website-id="cmuj24t7p05512zwul6dghfhu" type="dsgvo" lang="de"></privacybee-widget>
```

`website-id` is the client embed identifier supplied by the Product Owner. It is not an authentication token. Neither script is installed.

`cookie-banner.js` is a different script. It stays out. Public vendor help lists it as a separate head script (support article 103000392568, fetched 27 September 2026). Installing it to match template wording is forbidden.

### 4.3 Kill switch and host lock

Proposed later flag, server-only, default off: absent or any value other than exact `true` means no `app.privacybee.io` script is rendered.

Even when the flag is `true`, render vendor scripts only if the request host is exactly `jetnity.com`. A `*.vercel.app` preview host, `localhost`, or any other host gets the static Jetnity text or the error state, never the live widget.

Reason: public ALB 2.2 and 4.1–4.4, fetched 27 September 2026 from https://www.privacybee.io/lizenzbedingungen/, bind generated content to the named target domain and require the vendor’s own script embed. This writer did not find a clause that licenses a Vercel preview hostname. Do not add a preview alias as a second PrivacyBee domain. Do not assume the jetnity.com license covers Preview.

### 4.4 Failure, empty, and loading

| Situation | Required behavior |
| --- | --- |
| Content not approved | Do not add the route. Today’s 404 stays. A 200 with empty copy is not “no data”. |
| Flag off | If a later slice is allowed to ship approved static text without the widget, show that text and do not request PrivacyBee. If even the static text is not approved, do not add the route. |
| Widget enabled and script fails, times out, or returns an empty element | Visible error in German: the external legal text could not be loaded. Keep the approved Jetnity-owned text visible. Do not leave a blank article that looks complete. |
| Loading | If a widget is enabled, a text status is announced while it loads. No spinner-only state. |

The inventory distinction between empty and error stays. A missing vendor payload is an error.

### 4.5 Metadata boundaries that stay

- Canonical origin remains `https://jetnity.com`.
- `htmlRobots()` stays fail-closed until the existing indexing gate is truly on. No `NEXT_PUBLIC_ALLOW_INDEXING=true`.
- `SITEMAP_OEFFENTLICHE_PFADE` stays `['/', '/planen']`. Legal routes are not added to the sitemap in the implementation slice unless indexing and a separate sitemap decision both exist.
- `kanonischeUrl()` today accepts only `'/' | '/planen'` (`lib/seo/oeffentlicher-origin.ts` lines 162–167). A later slice may extend that helper. That extension is not an indexing approval.
- Preview must not emit a canonical on a preview host.

### 4.6 How a later slice can be tested without a false license claim

| Check | Method |
| --- | --- |
| Static supplement and imprint | Render the repository text in unit or component tests. No network. |
| Kill switch default | Assert the page source contains no `app.privacybee.io` when the flag is absent. |
| Preview host | Assert a non-`jetnity.com` host does not emit the widget even if the flag is `true`. |
| Vendor failure | Inject a test double that fails. Assert the error text is present and the Jetnity-owned text remains. |
| Live widget | Only on `https://jetnity.com` after a later publication gate. Not on a preview alias. |
| Inventory tests | Update `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` in that later slice so the new routes and footer links are expected. Do not break it silently. Lines 67–74 and 156–172 are the current absence locks. |

Footer today has no `/privacy` or `/terms` link and does show `mailto:info@jetnity.ch` (`components/layout/Footer.tsx` lines 45–51 and 76–80; inventory test lines 156–163). A later slice should add Impressum and Datenschutzerklärung in the existing “Jetnity” column, with the same link classes. `/terms` stays out until its own text exists. Register links to `/privacy` and `/terms` already exist and currently 404; `/privacy` should start returning the approved page, and `/terms` stays a known gap until a separate terms decision.

### 4.7 Vendor domain compatibility

Public ALB, accessed 27 September 2026, last updated 10 June 2026, title on the page “Lizenzbedingungen | PrivacyBee Deutschland”, body names PrivacyBee AG:

- Generated DSE, imprint, and cookie banner are produced for one target domain.
- The customer may embed them on that target domain via the vendor script URLs.
- Content and presentation may be changed only in the way PrivacyBee provides.
- Copying the text into the site another way is outside that clause. A separate help article says static copy-paste is not allowed (article 103000348698, fetched 27 September 2026).
- The guarantee excludes server-side processing the crawler cannot see (ALB 8.7.1).

The page title says “Deutschland” while the body says PrivacyBee AG. The August integration contract already recorded a public-source CH/DE integrity concern. This fetch does not resolve it. Account-specific AVV remains unseen.

Trial clause 2.3 in that public text says a trial ends automatically unless the customer switches to a paid license. The Product Owner’s account UI and explicit payment approval are the account evidence. They are not edited here. CHF 59.35/year continuation stays as already approved.

## 5. Acceptance matrix

### 5.1 Done in this preparation

- Processing matrix with source, date, and class.
- German supplement and corrected imprint drafts, marked not approved.
- Vendor correction brief and unresolved decision list, in the drafts file.
- Preview specification with kill switch, host lock, and fixture tests.
- No runtime, no vendor script, no Production change.

### 5.2 Blockers before a runtime / Preview-review slice

1. Product Owner or Legal accepts or corrects the supplement and imprint wording. Technical preparation is not that acceptance.
2. Decision on whether `/privacy` may render the vendor widget at all before sections 8.1–8.3 are corrected in the vendor account.
3. Written rule for the Jetnity-owned text sitting next to a vendor widget without violating ALB 4.4. If the vendor forbids adjacent text, the widget stays off and only approved Jetnity text is eligible.
4. Confirm hosted schema versus the “development only” migration headers before the supplement describes visit history or trip travellers as Production facts.
5. Fresh read of Production `JETNITY_MODELL_AKTIV` before the supplement says the model path is off or on. Until then the draft says the path exists and is used only when switched on.
6. `/terms` is not part of the slice. Register will still link to a missing `/terms` if only `/privacy` ships. That gap must be named in the UI decision, not hidden.

### 5.3 Blockers before Production publication

1. All of §5.2.
2. Independent Technical-Lead review of the later implementation head.
3. Indexing remains off unless the existing indexing gate is separately opened.
4. Widget host lock verified on Production HTML: scripts absent until the flag is on, and never on a preview host.
5. Cookie banner still absent.
6. No claim of DSG/DSGVO conformity in the UI.
7. Current VAT status still omitted unless a real extract is supplied.
8. Account-specific AVV/TOM/TIA still required before the privacy text names a transfer tool or a subprocessors’ countries.

### 5.4 Launch prerequisites this work does not solve

- Public indexing and search-engine submission.
- `/terms` and aggregator liability copy.
- Account deletion and a legally complete access export.
- Provider live activation, payments, SMTP.
- Cookie banner and analytics.
- Production database migrations.

## 6. What this report does not claim

No compliance. No legal sign-off. No fresh Production env audit. No original screenshot reading. No complete vendor policy text. No private row reads.
