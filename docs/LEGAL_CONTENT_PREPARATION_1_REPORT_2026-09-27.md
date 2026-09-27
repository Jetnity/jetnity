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
| Trip travellers | `repository` plus `historical-doc` | `trip_travellers` stores a short label, nationality and residence as ISO-2 codes when present, document type (`passport`, `national_id`, `unknown`), issuing country, and an expiry date. Comments and checks forbid document numbers in the label. The migration header says “Nur Development. Nicht Production.” That header is not proof the table was never applied later. The merged V1 export closure treats this table as part of the 13-table export column set. | `supabase/migrations/20260822020000_trip_travellers.sql` lines 1–58; `docs/ACTIVE_WORK_STATUS.md` §4e (PR #476) | Not re-verified by a hosted catalog read in this preparation. |
| Account traveller registry | `repository` plus `historical-doc` | `account_travellers` stores label and residence country. Citizenships are ISO-2 rows with no primary citizenship. Documents store type, optional issuing country, optional citizenship link, and expiry. Comments exclude numbers, scans, MRZ, biometrics, date of birth, and health data. Input keys for numbers, MRZ, scans, biometrics, date of birth, and health are rejected. The same export closure includes these tables. | `supabase/migrations/20260829201500_account_traveller_registry_persistence.sql` lines 10–44 and 90–119; `lib/traveller/account-registry-eingabe.ts` lines 17–45; `docs/ACTIVE_WORK_STATUS.md` §4e | Not re-verified by a hosted catalog read in this preparation. |
| What is not stored | `repository` | No passport number, MRZ, scan, or biometric column in those traveller tables. | sources in the two rows above | A future extra gate could add them. This dossier must not describe them as stored. |

### 2.4 Guest browser storage and quota cookie

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| Active guest trip | `repository` | One active guest trip in `localStorage` under `jetnity:reise:v3`. The server does not create a guest account. Browser storage is not a promise that the trip never reaches a server: account takeover writes it through `reise_anlegen()`, and a guest change posts the trip to the server action before any model call. | `lib/trips/gastspeicher.ts` lines 82–83 and comments lines 1–7; `lib/reiseaenderung/aktionen.ts` lines 122–140 | Browser retention until the user clears storage. No server-side lifetime for the local copy. |
| Legacy and queue | `repository` | Older `jetnity:guest-trips:v2` drafts are migrated: newest becomes active, the rest go to `jetnity:reisen-warteschlange:v3` (cap 20) and are taken over on the next login. The legacy key is removed only after the new write is confirmed. | `lib/trips/gastspeicher.ts` lines 20–34, 85–97 | How many browsers still hold the legacy key. |
| Removal | `repository` | `gastreiseEntfernen()` clears the active key only if the write-back confirms removal. After a successful account takeover, `uebernommenStreichen()` clears that one trip. A failed clear is tolerated only because `reise_anlegen()` is idempotent on `client_ref`. | `lib/trips/gastspeicher.ts` lines 1141–1144 and 1157–1183 | — |
| Quota cookie | `repository` | Name `jetnity_gast`. httpOnly, SameSite `lax`, path `/`, max-age 30 days, 32 hex characters. `secure` is set when `NODE_ENV === 'production'`. | `lib/modell/gast-cookie.ts` lines 7–14; `lib/modell/kontingent.ts` lines 98–106 | Legal classification (essential vs consent) is `unknown`. |
| When the cookie is written | `repository` | When the quota client exists, `gastkennung()` runs inside `kontingentBeanspruchen()` before the RPC result. It reads or creates the cookie for a signed-in user as well as for a guest, and the value is sent into the RPC. A missing quota client returns before that step, so the cookie is not written. The database then ignores the guest value when an account id is supplied. Suggestion, change, and assistant actions call `kontingentBeanspruchen()` only when `modellZustand().aktiv` is true. A successful model answer is not required. Ordinary page views do not call it. | `lib/modell/kontingent.ts` lines 70–78, 80–108 and 127–139; `lib/reisevorschlag/aktionen.ts` lines 65–68; `lib/reiseaenderung/aktionen.ts` lines 74–80; `lib/reisebegleiter/aktionen.ts` lines 108–113 | Production activation of that path: last recorded as not activated. See §2.6. Not re-read here. |
| What the usage row hashes | `repository` | If an account id is supplied, the stored hash is SHA-256 of `konto:` plus that id. The guest-cookie hash is used only when no account id is supplied. “The server stores only a hash of this cookie” is true for the guest branch, not for the account branch. | `supabase/migrations/20260819010000_modell_kontingent_nur_server.sql` lines 60–74 | — |

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
| Supabase | `repository` plus `historical-doc` | App data and Auth use the public Supabase URL and anon key on the server, with RLS. A service-role client exists only inside `lib/modell/kontingent.ts`, without cookies, and only for the quota RPCs. The last recorded Production ref in continuity is `qscbgcdmivbbnzrcyegn`. | `lib/supabase/server.ts` lines 7–8 and 65–93; `lib/modell/kontingent.ts` lines 63–78; `docs/ACTIVE_WORK_STATUS.md` §3 | Region, DPA, and log retention. The ref was not re-read in this preparation. |
| GeoNames | `repository` plus `historical-doc` | Place search reads local `public.places`. Docs say the rows come from a GeoNames dump plus local airports, not from a live GeoNames webservice, and that no GeoNames username is used. The footer names GeoNames (CC BY 4.0). | `docs/ORTE.md` lines 14–18 and 32–38; `components/layout/Footer.tsx` lines 87–95 | Whether the Production `places` table is currently populated was not re-checked. A 29 August 2026 smoke note in `docs/ORTE.md` is historical. |
| OpenAI model path | `repository` plus `historical-doc` | A call requires `JETNITY_MODELL_AKTIV` of `true` or `1`, a non-empty `OPENAI_API_KEY`, and a known model name. Otherwise no call. The request body is built in `anfragekoerper()` and sent by `modellAufrufen()` to `https://api.openai.com/v1/responses`. `store: false` is a field on that request. It is not proof that the provider retains nothing. `model_usage` stores function, model, account-or-guest class, the hash from §2.4, token counts, duration, and cost. It does not store the prompt or the model output. Last recorded Production observation after #435: `model_usage` 0 rows, assistant migration `20260917090000_modell_reisebegleiter` not applied, no Production model activation. One paid call was recorded on Preview/Development only. The 27 September 2026 account-counts closure still names `20260917120000_account_visits` as the latest observed Production migration and does not record a later model activation. | `lib/modell/konfiguration.ts` lines 186–204; `lib/modell/anfrage.ts` lines 24 and 49–74; `lib/modell/aufruf.ts` lines 70–78; `supabase/migrations/20260818040000_modellnutzung.sql` lines 73–100; `docs/ACTIVE_WORK_STATUS.md` §§1–3; `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_FULL_STACK_PASS_CLOSURE_2026-09-27.md` lines 57–61 | Current Production values of the kill switch and key were not re-read. Do not describe OpenAI as an active Production processor. |
| Flights, hotels, activities, mobility, rental cars | `repository` | Search kill switches treat `VERCEL_ENV=production` as hard off. Missing flags or missing provider access stay off. Duffel live tokens are rejected by the test-token check used for the Phase 3.1 path. | `lib/flights/zustand.ts` lines 6–8 and 35–38; `lib/hotels/zustand.ts` lines 1–9; `lib/provider-ops/zustand.ts` lines 17–27; `lib/flights/duffel/zugang.ts` lines 14–17 | Preview/development flags were not read. These adapters are not listed as live Production processors. |
| Analytics, ads, cookie banner | `repository` | `CookieConsent.tsx` is absent. Inventory test rejects known analytics packages and the old consent storage key. No PrivacyBee script is installed by this gate. | inventory test lines 111–153; #577 comment [5851358367](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851358367) | A future tracker would be a separate gate. |
| PrivacyBee as a vendor | `live-recorded` plus `po-confirmed` | The existing Swiss PrivacyBee account contains `jetnity.com`. Scan, German DSE preview, and imprint preview were recorded. Widgets are not installed. Trial end 11 October 2026 and CHF 59.35/year continuation were accepted by the Product Owner. That approval is unchanged. This dossier does not ask for it again. | #577 comments 5851299265 and 5851358367 | AVV/DPA, TOM, and TIA copies were not supplied to this writer. Server locations inside the AVV were not read. |

### 2.6a Model data flows

All three flows are repository-implemented and separately gated by `modellZustand()`. None is asserted as active in Production. When a call happens, the recipient is OpenAI at `https://api.openai.com/v1/responses`. Purpose: a suggestion proposes a trip from the user’s text; a change proposes an edit to an existing trip; the assistant answers a question about one signed-in trip. Input is sent only after a successful quota reservation. From Jetnity’s side the prompt is transient. The persistent Jetnity record is the `model_usage` row in §2.6, not the prompt and not the model output. `store: false` is a field on the request built in `anfragekoerper()`. It is not proof that the provider retains nothing. The answer is returned to the user for review. Suggestion and change do not write the trip by themselves.

| Flow | Who | Input sent to OpenAI when the path is active | Persistent Jetnity record | Source |
| --- | --- | --- | --- | --- |
| Trip suggestion `reisevorschlag` | Account or guest | System planning rules, plus the user’s free-text wish as the user message. The stored guest trip is not that message unless the user typed it. | Usage metadata only. The proposal stays in the client until the user accepts it. | `lib/reisevorschlag/erzeugen.ts` lines 162–175; `lib/reisevorschlag/aktionen.ts` lines 49–68; `lib/modell/anfrage.ts` lines 49–74 |
| Trip change `reiseaenderung` | Account and guest | System rules that include `reiseFuerModell`: title, origin, dates, traveller count, currency, budget target, pace, interests, travel wish, stages, and day items (title, note, start). The snapshot excludes prices, providers, booking links, and user id. The user’s change text is the user message. The guest action receives the browser trip and checks it before the model sees it. | Usage metadata only. Applying the change is a later user step. | `lib/reiseaenderung/snapshot.ts` lines 1–16 and 52–80; `lib/reiseaenderung/erzeugen.ts` lines 114–134; `lib/reiseaenderung/aktionen.ts` lines 62–140 |
| Assistant `reisebegleiter` | Signed-in account trip only. No guest assistant in the accepted runtime contract. | The user’s question, plus a minimized projection: stage name, country code, arrival and departure; for travellers, residence, citizenship country codes, document type, issuing country, and expiry. No document number. | Usage metadata only. The answer does not auto-apply to the trip. | `lib/reisebegleiter/aktionen.ts` lines 71–118; `lib/reisebegleiter/nutzlast.ts` lines 157–185; `lib/reisebegleiter/erzeugen.ts` lines 1–17; `docs/ACTIVE_WORK_STATUS.md` §1 |
| Production gate | — | Last recorded after #435: assistant migration not applied, no Production model activation, `model_usage` empty. Newest migration-tail note on 27 September 2026 still ends at `20260917120000_account_visits`. | Not a fresh env or catalog read. | `docs/ACTIVE_WORK_STATUS.md` §3; `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_FULL_STACK_PASS_CLOSURE_2026-09-27.md` lines 57–61 |

### 2.7 Logging, deletion, retention

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| `model_usage` retention | `repository` | No cron job is created. A commented manual statement mentions 90 days. `docs/MODELL.md` says there is no automatic deletion. The cleanup in `scripts/db/kontingent.ts` deletes fixture rows of that script, not a production schedule. | `supabase/migrations/20260818040000_modellnutzung.sql` lines 423–436; `docs/MODELL.md` line 262; `scripts/db/kontingent.ts` lines 111–119 | Whether anyone has run the manual delete. 90 days is not an enacted retention period. |
| Account export | `repository` plus `historical-doc` | Signed-in `GET /api/account/export` returns a JSON file of the listed own rows via the user client. Settings say it is not a complete legal access file and not deletion. There is no rate limit that holds across serverless instances. V1 Account Data Export 1 is a merged closure (PR #476): authenticated JSON download, 13 owner-scoped tables, no legal-DSAR claim. This preparation did not call the Production route. | `app/api/account/export/route.ts` lines 24–48; `lib/account/datenexport.ts` lines 1–8 and 19–33; `app/account/settings/page.tsx` lines 61–68; `docs/ACTIVE_WORK_STATUS.md` §4e | The inventory test still asserts there is no `app/account/export/page.tsx`. The API route is separate and does exist. |
| Account deletion | `repository` | Not implemented as a user route. `account_travellers.user_id` is declared `on delete cascade` from `auth.users`, which would matter only if the Auth user were deleted. | `supabase/migrations/20260829201500_account_traveller_registry_persistence.sql` lines 19–22; inventory test lines 183–185 | No deletion deadline, no export-before-delete flow. |
| Hosting and Auth logs | `unknown` | Jetnity code does not define a platform log retention period. Admin list failures are written with `console.error`. | `app/(admin)/admin/users/page.tsx` lines 72–73 | Vercel and Supabase log content, IP logging, and retention. The generated DSE claim that logs are deleted after each session is **not** established. |
| Visit history | `repository` plus `historical-doc` | `account_visits` is an explicit, user-confirmed visit. Coordinates are copied from `public.places`, not typed by the client as free geography. The migration header says development only. Later continuity records the migration as applied on Production. The newest tail observation, 27 September 2026, still names `20260917120000_account_visits` as the latest observed Production migration. Explicit Visit History is closed as Production-backed in the 18 September 2026 checkpoint. Class: last recorded as applied; not re-verified by a catalog read in this preparation. | `supabase/migrations/20260917120000_account_visits.sql` lines 1–35; `docs/ACTIVE_WORK_STATUS.md` §3; `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md` lines 200–207 and 423; `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_FULL_STACK_PASS_CLOSURE_2026-09-27.md` line 61 | A fresh catalog read was not done. The original header is not treated as proof of non-application. |

### 2.8 Contradictions left visible

1. `docs/ORTE.md` and `ARCHITECTURE.md` still describe `jetnity.com` as not attached, or indexing/domain cutover as not done. Gate A later attached `jetnity.com` in prelaunch/noindex mode. Live-recorded Gate A wins for domain attachment. Those older sentences are stale. This preparation does not edit them.
2. The `account_visits` migration header says development only. Later recorded Production evidence says the migration was applied. The later record wins over the header. It is not a fresh catalog read. See §2.7.
3. `docs/MODELL.md` and the #435 closure say Production model use was off. The code is fail-closed. This run did not read Production env. The last recorded state is “not activated”, not a new measurement. See §2.6 and §2.6a.
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

1. Jetnity-owned text from the reviewed supplement and the corrected imprint. That text must stay in the repository so a vendor outage still has an approved statement. A static, widget-off page can be specified and tested without a live PrivacyBee render.
2. Optional vendor widget only after contradictory vendor paragraphs are corrected by a supported vendor setting or by vendor clarification. Placing Jetnity text beside the widget does not repair those paragraphs. Public ALB 4.4 limits how the generated vendor content may be changed. The quoted sentence does not itself forbid independently written Jetnity text next to the widget. Whether the vendor objects to that layout is an open clarification, not an established prohibition, and it is not a blocker for the widget-off specification.
3. No CSS or DOM rewrite that hides vendor paragraphs. If a vendor paragraph is false, it is corrected in the vendor service directory where that directory actually controls the sentence, or by vendor clarification, or the widget stays off.

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
| Static supplement and imprint | Local fixture only. Render the repository text in unit or component tests. No network and no PrivacyBee script. This does not claim a licensed vendor render. |
| Kill switch default | Assert the page source contains no `app.privacybee.io` when the flag is absent. |
| Preview host | Assert a non-`jetnity.com` host does not emit the widget even if the flag is `true`. |
| Vendor failure | Inject a test double that fails. Assert the error text is present and the Jetnity-owned text remains. Still not a licensed render. |
| Licensed widget | Only on `https://jetnity.com` after a later publication gate, using the vendor script. Not on a preview alias, and not substituted by a local fixture. |
| Inventory tests | Update `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` in that later slice so the new routes and footer links are expected. Do not break it silently. Lines 67–74 and 156–172 are the current absence locks. |

Footer today has no `/privacy` or `/terms` link and does show `mailto:info@jetnity.ch` (`components/layout/Footer.tsx` lines 45–51 and 76–80; inventory test lines 156–163). A later slice should add Impressum and Datenschutzerklärung in the existing “Jetnity” column, with the same link classes. `/terms` stays out until its own text exists. Register links to `/privacy` and `/terms` already exist and currently 404; `/privacy` should start returning the approved page, and `/terms` stays a known gap until a separate terms decision.

### 4.7 Vendor domain compatibility

Public ALB, accessed 27 September 2026, last updated 10 June 2026, title on the page “Lizenzbedingungen | PrivacyBee Deutschland”, body names PrivacyBee AG:

- Generated DSE, imprint, and cookie banner are produced for one target domain.
- The customer may embed them on that target domain via the vendor script URLs.
- ALB 4.4 says the generated content may be adapted only in the way PrivacyBee provides, and that it must be embedded as specified in 4.3. That sentence governs the vendor content. It does not, on its own wording, forbid a separate Jetnity-authored paragraph next to the widget. Treating adjacency as a breach would be an inference and needs vendor clarification. It does not block a static page that does not load the widget.
- A help article says copying the generated policy into the site as a static paste is not allowed (article 103000348698, fetched 27 September 2026). That is about the vendor text, not about Jetnity’s own supplement.
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

1. Product Owner or Legal accepts or corrects the supplement and imprint wording, including legal basis, retention, and recipients. Technical preparation is not that acceptance. Leaving those points out of the visitor article does not close them.
2. Decision on whether `/privacy` may render the vendor widget at all before sections 8.1–8.3 are corrected through a supported vendor control or vendor clarification. Jetnity text beside the widget is not that correction.
3. If a later slice wants the live widget, ask the vendor whether independent Jetnity text next to it is acceptable. That question is not a blocker for a static, widget-off Preview specification.
4. A fresh hosted catalog read is not required to repeat the already recorded `account_visits` application. It is required only if a later slice needs a newer observation than 27 September 2026.
5. Fresh read of Production `JETNITY_MODELL_AKTIV` before any published sentence says the model path is currently on or off. The conditional visitor variant stays out of the default article until that read exists.
6. `/terms` is not part of the slice. Register will still link to a missing `/terms` if only `/privacy` ships. That gap must be named in the UI decision, not hidden.

### 5.3 Blockers before Production publication

1. All of §5.2.
2. Independent Technical-Lead review of the later implementation head.
3. Explicit approval of the applicable legal basis, retention periods, recipient/transfer facts, and the vendor-contract facts that the published text relies on. Omitting a country or a tool name does not close the gap.
4. Indexing remains off unless the existing indexing gate is separately opened.
5. Widget host lock verified on Production HTML: scripts absent until the flag is on, and never on a preview host.
6. The cookie banner stays off. It is not a task to build one for publication.
7. No claim of DSG/DSGVO conformity in the UI.
8. Current VAT status still omitted unless a real extract is supplied.
9. The already approved PrivacyBee continuation at CHF 59.35/year is not a new approval item.

### 5.4 Release items this work does not solve

- Public indexing and search-engine submission.
- `/terms` and aggregator liability copy.
- Account deletion and a legally complete access export.
- Provider live activation, payments, SMTP.
- Production database migrations that are still separately gated, including any future Production assistant migration.

Cookie banner and analytics are not launch prerequisites. The banner stays off unless a later, real non-essential tracker requires it. Choosing analytics later would be its own gate, not a condition of this legal preparation.

## 6. What this report does not claim

No compliance. No legal sign-off. No fresh Production env audit. No original screenshot reading. No complete vendor policy text. No private row reads.
