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

This report is a source dossier and the technical installation specification for vendor-managed `/privacy` and `/impressum`. It is not a privacy policy, not an imprint publication, and not a compliance certificate.

Task §0, commit `13894ecc5ef9df8393b834a8af41502e3db71116`, is the binding continuation. PrivacyBee generates and maintains the privacy policy. The earlier Jetnity-authored supplement plus optional widget is not the selected implementation. Drafts §§A, B, and B2 stay in the drafts file as superseded proposals, not as approved fallback text.

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
| Active guest trip | `repository` | One active guest trip in `localStorage` under `jetnity:reise:v3`. The server does not create a guest account. Local edits stay in the browser. Account takeover writes the trip through `reise_anlegen()`. A submitted change request posts that trip to the server action before any model call. | `lib/trips/gastspeicher.ts` lines 82–83 and comments lines 1–7; `lib/reiseaenderung/aktionen.ts` lines 122–140; #577 comment [5854336548](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854336548) | Browser retention until the user clears storage. No server-side lifetime for the local copy. |
| Legacy and queue | `repository` | Older `jetnity:guest-trips:v2` drafts are migrated: newest becomes active, the rest go to `jetnity:reisen-warteschlange:v3` (cap 20) and are taken over on the next login. The legacy key is removed only after the new write is confirmed. | `lib/trips/gastspeicher.ts` lines 20–34, 85–97 | How many browsers still hold the legacy key. |
| Removal | `repository` | `gastreiseEntfernen()` clears the active key only if the write-back confirms removal. After a successful account takeover, `uebernommenStreichen()` clears that one trip. A failed clear is tolerated only because `reise_anlegen()` is idempotent on `client_ref`. | `lib/trips/gastspeicher.ts` lines 1141–1144 and 1157–1183 | — |
| Quota cookie | `repository` | Name `jetnity_gast`. httpOnly, SameSite `lax`, path `/`, max-age 30 days, 32 hex characters. `secure` is set when `NODE_ENV === 'production'`. | `lib/modell/gast-cookie.ts` lines 7–14; `lib/modell/kontingent.ts` lines 98–106 | Legal classification (essential vs consent) is `unknown`. |
| When the cookie is written | `repository` plus `live-recorded` | When the quota client exists, `gastkennung()` runs inside `kontingentBeanspruchen()` before the RPC result. It reads or creates the cookie for a signed-in user as well as for a guest, and the value is sent into the RPC. A missing quota client returns before that step, so the cookie is not written. The database then ignores the guest value when an account id is supplied. Suggestion, change, and assistant actions call `kontingentBeanspruchen()` only when `modellZustand().aktiv` is true. A successful model answer is not required. Ordinary page views do not call it. A 27 September 2026 dashboard search found no Production entry for `JETNITY_MODELL_AKTIV`. | `lib/modell/kontingent.ts` lines 70–78, 80–108 and 127–139; `lib/reisevorschlag/aktionen.ts` lines 65–68; `lib/reiseaenderung/aktionen.ts` lines 74–80; `lib/reisebegleiter/aktionen.ts` lines 108–113; #577 comment [5854401589](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854401589) | The search is dashboard scope, not a printed value and not proof of every deployed runtime. |
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
| Vercel hosting of jetnity.com | `live-recorded` | On 27 September 2026, Gate A recorded `jetnity.com` on the existing Vercel project `jetnity-app`, HTTPS 200, HTTP to HTTPS, managed certificate, HTML `noindex, nofollow`, and `robots.txt` disallow-all. The same day’s dashboard read shows Pro Plan Active, Observability Plus off, and no team log drains. Vercel’s public DPA covers Pro and Enterprise, so the earlier “plan unknown, so the public DPA may not apply” gap is closed at that scope. It is not a separate negotiated agreement. https://vercel.com/legal/dpa Production deployment metadata reports `regions: ["iad1"]`, which the official region document maps to Washington, D.C., USA. That is the deployment region, not every CDN, log, or subprocessor location. | #577 comments [5850986944](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5850986944), [5854336548](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854336548), [5854401589](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854401589); https://vercel.com/docs/regions | This writer did not repeat the live fetch. The region is not proof of all processing locations. |
| Indexing guard in code | `repository` plus `live-recorded` | Indexing requires production, exact `NEXT_PUBLIC_ALLOW_INDEXING=true`, and exact origin `https://jetnity.com`. Otherwise HTML robots are noindex/nofollow and `robots.txt` is disallow-all with no sitemap. Sitemap paths are only `/` and `/planen`, and only when indexing is allowed. A dashboard search on 27 September 2026 found no `NEXT_PUBLIC_ALLOW_INDEXING` entry. | `lib/seo/oeffentlicher-origin.ts` lines 24–25, 59–61, 138–147; `lib/seo/robots-regeln.ts` lines 41–54; `lib/seo/oeffentliche-metadata.ts` lines 37–47; `lib/seo/index-grenze.ts` line 19; #577 comment [5854401589](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854401589) | The search is the recorded dashboard result. It is not a new Production HTML fetch by this writer. |
| Supabase | `repository` plus `live-recorded` | App data and Auth use the public Supabase URL and anon key on the server, with RLS. A service-role client exists only inside `lib/modell/kontingent.ts`, without cookies, and only for the quota RPCs. `get_project(qscbgcdmivbbnzrcyegn)` on 27 September 2026 reported ACTIVE_HEALTHY, region `eu-central-2`, organization Pro. Official region documentation maps `eu-central-2` to Zurich, Switzerland. The current public DPA (Version 1, 1 August 2026) exists and includes TOMs and SCC provisions. | `lib/supabase/server.ts` lines 7–8 and 65–93; `lib/modell/kontingent.ts` lines 63–78; #577 comment [5854336548](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854336548); https://supabase.com/docs/guides/platform/regions; https://supabase.com/legal/customer-resources/data-processing-addendum | The public DPA is not proof of the exact account-bound version. Zurich is the recorded primary database region, not a claim that every Jetnity process stays in Switzerland. |
| GeoNames | `repository` plus `historical-doc` | Place search reads local `public.places`. Docs say the rows come from a GeoNames dump plus local airports, not from a live GeoNames webservice, and that no GeoNames username is used. The footer names GeoNames (CC BY 4.0). | `docs/ORTE.md` lines 14–18 and 32–38; `components/layout/Footer.tsx` lines 87–95 | Whether the Production `places` table is currently populated was not re-checked. A 29 August 2026 smoke note in `docs/ORTE.md` is historical. |
| OpenAI model path | `repository` plus `live-recorded` | A call requires `JETNITY_MODELL_AKTIV` of `true` or `1`, a non-empty `OPENAI_API_KEY`, and a known model name. Otherwise no call. The request body is built in `anfragekoerper()` and sent by `modellAufrufen()` to `https://api.openai.com/v1/responses`. `store: false` is a field on that request. It is not proof that the provider retains nothing. `model_usage` stores function, model, account-or-guest class, the hash from §2.4, token counts, duration, and cost. It does not store the prompt or the model output. Last recorded Production observation after #435: `model_usage` 0 rows, assistant migration `20260917090000_modell_reisebegleiter` not applied, no Production model activation. On 27 September 2026 the dashboard search found `JETNITY_MODELL_AKTIV` only on two older named Preview branches, and no Production entry. Values were not revealed. PrivacyBee’s own use of OpenAI for imprint generation is a vendor subprocessor question, not activation of this Jetnity path. | `lib/modell/konfiguration.ts` lines 186–204; `lib/modell/anfrage.ts` lines 24 and 49–74; `lib/modell/aufruf.ts` lines 70–78; `supabase/migrations/20260818040000_modellnutzung.sql` lines 73–100; #577 comments [5854336548](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854336548) and [5854401589](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854401589) | Absence of a Production dashboard entry is not proof of every deployed runtime. Do not describe Jetnity’s OpenAI path as an active Production processor. |
| Flights, hotels, activities, mobility, rental cars | `repository` | Search kill switches treat `VERCEL_ENV=production` as hard off. Missing flags or missing provider access stay off. Duffel live tokens are rejected by the test-token check used for the Phase 3.1 path. | `lib/flights/zustand.ts` lines 6–8 and 35–38; `lib/hotels/zustand.ts` lines 1–9; `lib/provider-ops/zustand.ts` lines 17–27; `lib/flights/duffel/zugang.ts` lines 14–17 | Preview/development flags were not read. These adapters are not listed as live Production processors. |
| Analytics, ads, cookie banner | `repository` | `CookieConsent.tsx` is absent. Inventory test rejects known analytics packages and the old consent storage key. No PrivacyBee script is installed by this gate. | inventory test lines 111–153; #577 comment [5851358367](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851358367) | A future tracker would be a separate gate. |
| PrivacyBee as a vendor | `live-recorded` plus `po-confirmed` | PrivacyBee is the Product Owner’s selected generator and maintainer of the privacy policy. The Swiss account contains `jetnity.com`. Widgets are not installed. Trial end 11 October 2026 and CHF 59.35/year continuation stay approved. On 27 September 2026 the service directory shows Supabase added manually (Hosting), Vercel from the scan (necessary, Hosting), and PrivacyBee. The public German DSGVO URL is https://app.privacybee.io/v/cmuj24t7p05512zwul6dghfhu?lang=de&type=dsgvo . Public configuration `lastUpdated` `2026-09-27T09:42:13.297Z` has `cookieBanner.enabled` false, `hasMarketing` false, and `hasProductDevelopment` false. The Swiss public ALB at https://www.privacybee.io/de-ch/lizenzbedingungen/ names PrivacyBee AG and incorporates an AVV. The Swiss public AVV is at https://www.privacybee.io/de-ch/auftragverarbeitervertrag/ . | #577 comments [5851299265](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851299265), [5854680409](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854680409), [5854791796](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854791796), [5854846134](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854846134), [5854336548](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854336548) | The retrieved public AVV contains a second dialect rendition with different version-date wording. That is an observed source-quality issue, not a conclusion that the agreement is invalid, and not an account-bound copy. No support message was sent. |

### 2.6a Model data flows

All three flows are repository-implemented and separately gated by `modellZustand()`. None is asserted as active in Production. When a call happens, the recipient is OpenAI at `https://api.openai.com/v1/responses`. Purpose: a suggestion proposes a trip from the user’s text; a change proposes an edit to an existing trip; the assistant answers a question about one signed-in trip. Input is sent only after a successful quota reservation. From Jetnity’s side the prompt is transient. The persistent Jetnity record is the `model_usage` row in §2.6, not the prompt and not the model output. `store: false` is a field on the request built in `anfragekoerper()`. It is not proof that the provider retains nothing. The answer is returned to the user for review. Suggestion and change do not write the trip by themselves.

| Flow | Who | Input sent to OpenAI when the path is active | Persistent Jetnity record | Source |
| --- | --- | --- | --- | --- |
| Trip suggestion `reisevorschlag` | Account or guest | System planning rules, plus the user’s free-text wish as the user message. The stored guest trip is not that message unless the user typed it. | Usage metadata only. The proposal stays in the client until the user accepts it. | `lib/reisevorschlag/erzeugen.ts` lines 162–175; `lib/reisevorschlag/aktionen.ts` lines 49–68; `lib/modell/anfrage.ts` lines 49–74 |
| Trip change `reiseaenderung` | Account and guest | System rules that include `reiseFuerModell`: title, origin, dates, traveller count, currency, budget target, pace, interests, travel wish, stages, and day items (title, note, start). The same snapshot carries the trip id, stage ids, day ids, item ids, and `revision`, so a proposed change can be matched to that version. It excludes prices, providers, booking links, and user id. The user’s change text is the user message. The guest action receives the browser trip and checks it before the model sees it. | Usage metadata only. Applying the change is a later user step. | `lib/reiseaenderung/snapshot.ts` lines 13–48 and 52–88; `lib/reiseaenderung/erzeugen.ts` lines 114–134; `lib/reiseaenderung/aktionen.ts` lines 62–140 |
| Assistant `reisebegleiter` | Signed-in account trip only. No guest assistant in the accepted runtime contract. | The user’s question, plus a minimized projection: stage name, country code, arrival and departure; for travellers, residence, citizenship country codes, document type, issuing country, and expiry. No document number. | Usage metadata only. The answer does not auto-apply to the trip. | `lib/reisebegleiter/aktionen.ts` lines 71–118; `lib/reisebegleiter/nutzlast.ts` lines 157–185; `lib/reisebegleiter/erzeugen.ts` lines 1–17; `docs/ACTIVE_WORK_STATUS.md` §1 |
| Production gate | — | Last recorded after #435: assistant migration not applied, no Production model activation, `model_usage` empty. The 27 September 2026 dashboard search found no Production `JETNITY_MODELL_AKTIV` entry. | Dashboard scope only. Values were not printed. | #577 comment [5854401589](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854401589); `docs/ACTIVE_WORK_STATUS.md` §3 |

### 2.7 Logging, deletion, retention

| Topic | Class | What is established | Source | Unknown |
| --- | --- | --- | --- | --- |
| `model_usage` retention | `repository` | No cron job is created. A commented manual statement mentions 90 days. `docs/MODELL.md` says there is no automatic deletion. The cleanup in `scripts/db/kontingent.ts` deletes fixture rows of that script, not a production schedule. | `supabase/migrations/20260818040000_modellnutzung.sql` lines 423–436; `docs/MODELL.md` line 262; `scripts/db/kontingent.ts` lines 111–119 | Whether anyone has run the manual delete. 90 days is not an enacted retention period. |
| Account export | `repository` plus `historical-doc` | Signed-in `GET /api/account/export` returns a JSON file of the listed own rows via the user client. Settings say it is not a complete legal access file and not deletion. There is no rate limit that holds across serverless instances. V1 Account Data Export 1 is a merged closure (PR #476): authenticated JSON download, 13 owner-scoped tables, no legal-DSAR claim. This preparation did not call the Production route. | `app/api/account/export/route.ts` lines 24–48; `lib/account/datenexport.ts` lines 1–8 and 19–33; `app/account/settings/page.tsx` lines 61–68; `docs/ACTIVE_WORK_STATUS.md` §4e | The inventory test still asserts there is no `app/account/export/page.tsx`. The API route is separate and does exist. |
| Account deletion | `repository` | Not implemented as a user route. `account_travellers.user_id` is declared `on delete cascade` from `auth.users`, which would matter only if the Auth user were deleted. | `supabase/migrations/20260829201500_account_traveller_registry_persistence.sql` lines 19–22; inventory test lines 183–185 | No deletion deadline, no export-before-delete flow. |
| Hosting and Auth logs | `live-recorded` | Jetnity code does not define a platform log retention period. Supabase Pro public documentation describes seven days of accessible log history. Vercel’s public runtime-log document, together with the observed Pro plan and Observability Plus off, supports a one-day runtime-log visibility period. Both are visibility statements, not deletion of all platform or security data, and not a seven-day or one-day retention promise for account or trip rows. The generated statement that logs are deleted after each session is still not established. No customer log content was read. | `app/(admin)/admin/users/page.tsx` lines 72–73; #577 comments [5854336548](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854336548) and [5854401589](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5854401589) | Downstream drains are recorded as none for the Vercel team. That does not fix total retention of backups or provider security logs. |
| Visit history | `repository` plus `historical-doc` | `account_visits` is an explicit, user-confirmed visit. Coordinates are copied from `public.places`, not typed by the client as free geography. The migration header says development only. Later continuity records the migration as applied on Production. The newest tail observation, 27 September 2026, still names `20260917120000_account_visits` as the latest observed Production migration. Explicit Visit History is closed as Production-backed in the 18 September 2026 checkpoint. Class: last recorded as applied; not re-verified by a catalog read in this preparation. | `supabase/migrations/20260917120000_account_visits.sql` lines 1–35; `docs/ACTIVE_WORK_STATUS.md` §3; `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md` lines 200–207 and 423; `docs/ADMIN_ACCOUNT_COUNTS_LOCAL_FULL_STACK_PASS_CLOSURE_2026-09-27.md` line 61 | A fresh catalog read was not done. The original header is not treated as proof of non-application. |

### 2.8 Contradictions left visible

1. `docs/ORTE.md` and `ARCHITECTURE.md` still describe `jetnity.com` as not attached, or indexing/domain cutover as not done. Gate A later attached `jetnity.com` in prelaunch/noindex mode. Live-recorded Gate A wins for domain attachment. Those older sentences are stale. This preparation does not edit them.
2. The `account_visits` migration header says development only. Later recorded Production evidence says the migration was applied. The later record wins over the header. It is not a fresh catalog read. See §2.7.
3. `docs/MODELL.md` and the #435 closure say Production model use was off. The 27 September 2026 dashboard search found no Production `JETNITY_MODELL_AKTIV` entry. That is dashboard scope, not a printed value. See §2.6 and §2.6a.
4. AP-6a input row 1 still says operator identity is missing. Product Owner confirmation on 27 September 2026 supersedes that gap for the facts listed in §3. The public PrivacyBee configuration also shows Feirov Global Trading, Sasa Feirov, and admin@jetnity.com. That does not approve the generated policy.
5. Supabase’s recorded database region is Zurich. Vercel’s recorded deployment region is Washington, D.C. A sentence that all Jetnity processing stays in Switzerland would go beyond that evidence.

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

### 4.2 Selected embed

PrivacyBee generates and maintains the privacy policy. That is the Product Owner’s selected implementation (#577 comments 5854680409 and 5854846134). There is no Jetnity replacement privacy policy.

Public vendor help lists three embed methods: JavaScript, iFrame, or a link. Static paste of the generated text is not allowed (articles 103000348691 and 103000348698, fetched 27 September 2026). The secured integration data is the JavaScript custom element, so that is the chosen embed on the licensed host. An iFrame is not the chosen method. A link is the fallback in §4.4. A link is navigation to PrivacyBee’s page. It is not a copy of the vendor text into this repository.

When the host lock and the publication flag in §4.3 both pass, `/privacy` uses:

```html
<script src="https://app.privacybee.io/widget.js" defer></script>
<privacybee-widget website-id="cmuj24t7p05512zwul6dghfhu" type="dsgvo" lang="de"></privacybee-widget>
```

`/impressum` uses:

```html
<script src="https://app.privacybee.io/imprint-widget.js"></script>
<imprint-widget website-id="cmuj24t7p05512zwul6dghfhu" lang="de"></imprint-widget>
```

These snippets are specification data. This preparation does not execute them. `website-id` is the client embed identifier. It is not an authentication token.

`cookie-banner.js` stays out. Public configuration has the banner disabled. The template sentence that a banner is shown is not a requirement to install one. Do not hide vendor paragraphs with CSS or DOM rewriting.

Drafts §§A, B, and B2 are superseded proposals. They are not the page body and not the text to show if the widget fails.

### 4.3 Host lock and publication flag

A later server-only flag defaults off. Absent, or any value other than the exact string `true`, means no `app.privacybee.io` script.

Even when the flag is `true`, render those scripts only if the request host is exactly `jetnity.com`. A `*.vercel.app` preview host, `localhost`, or any other host gets no vendor script.

Do not add a preview alias as a second PrivacyBee domain. Do not assume the jetnity.com license covers Preview. The Swiss public ALB at https://www.privacybee.io/de-ch/lizenzbedingungen/ (updated 10 June 2026, recorded in #577 comment 5854336548) names PrivacyBee AG and binds the generated content to the target domain. That narrows the earlier “PrivacyBee Deutschland” title on the non-Swiss license URL. It does not prove the account-bound contract version.

No imprint hosted URL was supplied. Do not invent one.

### 4.4 Link, loading, and failure

The approved public privacy URL, from #577 comment 5854846134, is:

https://app.privacybee.io/v/cmuj24t7p05512zwul6dghfhu?lang=de&type=dsgvo

| Situation | `/privacy` | `/impressum` |
| --- | --- | --- |
| Host is `jetnity.com`, flag is exact `true`, widget still loading | Visible `h1` “Datenschutzerklärung” and a text status. No spinner-only state. | Visible `h1` “Impressum” and a text status. |
| Those conditions pass, then the script fails, times out, or the custom element stays empty | German error, then the hosted-policy link, labeled as PrivacyBee’s hosted statement. Do not insert Drafts §B. | German error, then `mailto:info@jetnity.ch`. No hosted imprint URL. Do not insert Drafts §A as the page. |
| Flag off, or host is not `jetnity.com` | No script request. The same hosted-policy link, with text that this page does not copy that statement. | No script request. German unavailable text plus `mailto:info@jetnity.ch`. |

A missing vendor payload is an error, not an empty success. Using the link on a preview host does not license that host and does not paste the policy into Jetnity.

Showing the widget, or presenting that link as the live statement, on `https://jetnity.com` waits on §5.3. Building the shell without the script is preparable before that publication decision.

### 4.5 Metadata boundaries that stay

- Canonical origin remains `https://jetnity.com`.
- `htmlRobots()` stays fail-closed. No `NEXT_PUBLIC_ALLOW_INDEXING=true`. The dashboard search found no such entry (comment 5854401589).
- `SITEMAP_OEFFENTLICHE_PFADE` stays `['/', '/planen']`. The implementation slice does not add legal routes to the sitemap.
- `kanonischeUrl()` today accepts only `'/' | '/planen'` (`lib/seo/oeffentlicher-origin.ts` lines 162–167). Extending it later is not an indexing approval.
- Preview must not emit a canonical on a preview host.

### 4.6 Acceptance checks for the later slice

| Check | Method |
| --- | --- |
| Shell without a script | Render with the flag absent, and again with a non-`jetnity.com` host. Assert no `app.privacybee.io`, no Drafts §A/§B prose, the privacy link href, and the imprint mailto. |
| Host lock | Flag `true` and a non-`jetnity.com` host still emits no script. |
| Licensed embed markup | A fixture with host `jetnity.com` and flag `true` asserts the two snippet URLs, `type="dsgvo"`, `lang="de"`, and the website-id. The fixture does not fetch PrivacyBee. |
| Failure | A test double fails. Privacy shows the error and the hosted link. Imprint shows the error and the mailto. |
| Inventory | Update `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` and `AP6A_VERWANDTE_FEHLENDE_ROUTEN` in `lib/legal/ap6a-gate0-vertrag.ts` so `/privacy` and `/impressum` are expected pages. `/terms` and `/datenschutz` stay absent. Footer expectations change only for those two links. Lines 67–74 and 156–172 are the current locks. `AP6A_VERWANDTE_FEHLENDE_ROUTEN` is line 11 today. |

Footer today has no `/privacy` link and does show `mailto:info@jetnity.ch` (`components/layout/Footer.tsx` lines 45–51 and 76–80). The later slice adds Datenschutzerklärung and Impressum in the existing “Jetnity” column, with `footerLinkClass`. Register already links to `/privacy` and `/terms` (`components/auth/RegisterForm.tsx`). `/terms` stays a 404 and stays named as unresolved. Navbar stays without those links unless a later decision says otherwise. The current navbar lock is inventory test lines 162–163.

### 4.7 Smallest next code slice

Not started, and not dispatched by this document.

One later slice, after Technical-Lead selection: vendor-managed legal routes. It adds `app/(public)/privacy/page.tsx` and `app/(public)/impressum/page.tsx` in the existing public layout, the host lock, the default-off server flag, the link-versus-copy behavior in §4.4, the two footer links, and the inventory update in §4.6. It does not install `cookie-banner.js`, does not paste vendor text, does not set indexing, does not contact PrivacyBee, and does not treat Drafts §§A–B2 as the page.

### 4.8 License boundary

The Swiss public ALB is the current public license source for this account’s stated Swiss contracting path. Generated DSE, imprint, and banner are for one target domain and are embedded by the vendor’s script. ALB 4.4 limits changes to the generated vendor content. Copying that generated policy into the site is outside the documented embed (article 103000348698). The crawler guarantee does not cover server-side processing it cannot see (ALB 8.7.1). That clause is not a reason to publish a template paragraph that contradicts the disabled banner and the recorded log evidence.

The public Swiss AVV was retrieved (comment 5854336548). It also contains a second dialect rendition with different version-date wording. Record that as a source-quality issue. It is not an account-bound copy and not a finding that the agreement is invalid. CHF 59.35/year continuation stays as already approved. No billing change.

## 5. Acceptance matrix

### 5.1 Done in this preparation

- Processing matrix updated with the 27 September 2026 receipts named in task §0.
- Selected implementation is the PrivacyBee JavaScript embed, with the hosted privacy link as fallback and no replacement privacy policy.
- Superseded visitor drafts kept and labeled.
- Concrete route, lifecycle, and acceptance specification for a later slice.
- No runtime, no vendor script, no banner, no Production change.

### 5.2 Preparable before publication

The slice in §4.7 can be built and reviewed on a non-licensed host without loading the vendor script.

These are not new gates for that slice:

- another request for the same screenshots or for the hosted URL already recorded;
- another billing approval for the CHF 59.35/year continuation;
- drafting a Jetnity replacement privacy policy;
- installing a cookie banner so the template’s banner sentence becomes true.

`/terms` stays out of that slice. Register will still link to a missing `/terms`. The slice names that gap. It does not hide it.

### 5.3 Publication blockers

1. The German DSGVO template still says a cookie banner is shown, that logfiles are deleted after each session, and it still uses generic analytics/pixel wording. Public configuration at `2026-09-27T09:42:13.297Z` has the banner disabled and marketing/product-development false. Jetnity has no installed banner or analytics package. Those three mismatches are the narrow vendor question. This slice does not send it. Do not “fix” them by enabling a banner or analytics.
2. Independent Technical-Lead review of the later implementation head before Production HTML emits the scripts.
3. Indexing remains off unless the existing indexing gate is separately opened.
4. No DSG/DSGVO conformity claim in the UI.
5. Current VAT status stays omitted unless a real extract is supplied.
6. The already approved PrivacyBee continuation is not a new approval item.

The public Swiss AVV’s second dialect rendition remains incomplete contractual evidence. It is not expanded into a new checklist. Legal basis and account/trip retention are still undecided for any Jetnity sentence that would state them. The selected page does not add those sentences. That does not declare the generated template accurate.

### 5.4 Release items this work does not solve

- Public indexing and search-engine submission.
- `/terms` and aggregator liability copy.
- Account deletion and a legally complete access export.
- Provider live activation, payments, SMTP.
- Production database migrations that are still separately gated, including any future Production assistant migration.

Cookie banner and analytics are not launch prerequisites. The banner stays off. Choosing analytics later would be its own gate.

## 6. What this report does not claim

No compliance. No legal sign-off. No claim that all processing stays in Switzerland or that log visibility is total retention. No original screenshot reading by this writer. The hosted-policy findings are the Technical Lead’s public read in comment 5854846134, not a new fetch by this writer. No private row reads. No support message.
