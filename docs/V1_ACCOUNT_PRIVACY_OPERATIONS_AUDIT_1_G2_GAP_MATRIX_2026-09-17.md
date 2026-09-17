# Jetnity – V1 Account / Privacy / Operations Minimum – Gap Matrix (Audit 1, Generation 2)

Stand: 17. September 2026
Status: **AUDIT-ONLY / DOCS-ONLY — CHECKPOINT 1 (Sections 1–3 persisted)**

Canonical issue: #438
Draft PR: #449
Branch: `audit/v1-account-privacy-ops-1-g2`
Canonical base: `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6`
Binding task: `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_TASK_2026-09-17.md`

Supersedes the persisted output of failed Generation 1 / PR #439 (Generation 1 persisted no audit output).

---

## 0. How to read this matrix

Each capability is recorded as:

- **Evidence** — live repository evidence (runtime code, migration, config, test), with path and line/symbol.
- **State** — `BUILT` / `PARTIAL` / `MISSING` / `BLOCKED` / `DEFERRED` / `PO-GATED`.
- **V1 necessity** — is this required for *V1 = production ready for real travellers*, per `JETNITY_HANDOFF.md` / `docs/ACTIVE_WORK_STATUS.md` §2.
- **Gap** — the exact missing thing, not a vague theme.
- **Severity** — `P0` blocks V1 launch outright; `P1` blocks a trustworthy V1 but has a narrow workaround; `P2` should exist at V1 but is survivable with documented limitation; `P3` post-V1.
- **Dependency / gate** — what must happen first, including Product-Owner gates.
- **Smallest next slice** — the narrowest responsible remediation slice, *not started by this audit*.

Evidence rules applied (per binding task):

1. Live repository evidence outranks any older plan document.
2. A `docs/*.md` file describing a capability is **not** evidence that the capability exists.
3. UI copy is **not** evidence of compliance.
4. No claim of Production parity is made where the repository cannot prove Production state.

Verification method for this generation: bounded domain passes with independent spot-check re-verification of every load-bearing absence claim by direct search in the working tree at the audit head. Absence claims below were re-confirmed by direct `find`/`grep` over `app/**`, `components/**`, `lib/**`, `supabase/migrations/**` and not taken from a subordinate report alone.

---

## Section 1 — Privacy / Terms / Consent

### 1.1 Public legal pages (`/privacy`, `/terms`, Impressum, Datenschutzerklärung)

- **Evidence**
  - No route directory exists for any legal surface. Direct search over `app/**` for directory names matching `privacy`, `terms`, `impressum`, `datenschutz`, `legal`, `rechtliches` returns **zero** directories.
  - The absence is contractually encoded, not accidental: `lib/legal/ap6a-gate0-vertrag.ts` L6 declares `AP6A_LEGAL_ROUTEN = ['/privacy', '/terms']` as required-but-missing, and L11 `AP6A_VERWANDTE_FEHLENDE_ROUTEN = ['/impressum', '/datenschutz']`.
  - `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` L67–74 asserts the routes do **not** exist, i.e. the current test suite locks in the gap as the expected state.
  - Live HTTP corroboration from an earlier slice: `docs/AP6A_GATE0_LEGAL_FOUNDATION_LIVE_EVIDENCE_2026-08-29.md` records `/privacy` and `/terms` returning 404 on the production alias.
- **State** — `MISSING`
- **V1 necessity** — **Required.** Jetnity is a Swiss-domiciled consumer product (`mailto:info@jetnity.ch`, canonical origin `https://jetnity.com`) processing account and traveller data. A public launch without a reachable privacy notice and terms is not lawfully or commercially defensible under CH-DSG/GDPR-equivalent expectations.
- **Gap** — There is no reachable privacy notice, no terms of use, no imprint. Additionally, two runtime surfaces link to these non-existent routes, producing dead links in the signup path: `components/auth/RegisterForm.tsx` L354 (`/terms`) and L356 (`/privacy`).
- **Severity** — **P0** (launch-blocking).
- **Dependency / gate** — **PO-GATED on legal content.** The binding AP-6a contract forbids agent-invented legal text (`lib/legal/ap6a-gate0-vertrag.ts` L31 `keineErfundenenRechtstexte: true`). Content must come from the Product Owner / legal counsel. `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md` L8–10 designates PrivacyBee AG as vendor for the website-visible privacy layer but L111 explicitly authorises **no** activation; L29–41 keeps `/terms` Jetnity-native. So this gap is blocked on a content/vendor decision, not on engineering capacity.
- **Smallest next slice** — Route shell + layout for `/privacy` and `/terms` that renders Product-Owner-supplied content from a single source, plus footer links, plus removal of dead-link risk. Cannot start before legal content exists.

### 1.2 Consent management / cookie banner

- **Evidence**
  - A banner component exists but is **orphaned**: `components/layout/CookieConsent.tsx` (default export `CookieConsent`, L9). Independent re-verification: the only files referencing the symbol are the component itself, `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` and `lib/project-sanitation/closure-invariants.test.ts` — i.e. **no runtime importer** in `app/**` or `components/**`.
  - `app/(public)/layout.tsx` L47–59 mounts `PublicNavbar`, children, `Footer`, `BackToTop` — the banner is not mounted.
  - The orphan status is a deliberate, recorded exception in the dead-code gate: `scripts/erreichbarkeit.mjs` L28–32.
  - The component's copy is factually wrong for the current product: L35–36 claims measurement of "Views/Likes" via cookies/localStorage, and L54 links to the non-existent `/privacy`.
  - No consent persistence exists: no consent table or column in `supabase/migrations/**` (searched `consent`, `terms`, `tos`, `accepted_at`, `terms_version`, `dsgvo`, `gdpr`), and `lib/legal/ap6a-gate0-vertrag.ts` L32 declares `keineConsentPersistenz: true`; L53–57 defers `consent-version-zeitstempel` to AP-6b.
- **State** — `MISSING` for consent management; the orphan component is a stale artefact, not a partial implementation.
- **V1 necessity** — **Conditionally required.** Because no non-essential tracker exists today (see 1.3), a consent banner is *not* currently legally required. What **is** required is that the false-claim artefact does not reach users, and that a banner appears the moment any non-essential tracker is introduced.
- **Gap** — Two distinct gaps: (a) a dead component containing an untrue processing claim and a dead link remains in the tree, which is a truth/hygiene defect and a trap for any future contributor who mounts it; (b) there is no consent record model, so if a tracker or marketing pixel is ever added, there is no lawful basis mechanism and no evidence trail.
- **Severity** — **P2** for (a) while unmounted (no user impact today, real regression risk); **P0 conditional** for (b) — it becomes launch-blocking the instant a non-essential tracker is enabled.
- **Dependency / gate** — (a) is a free decision (delete or rewrite honestly); the binding vendor decision already states no banner without real trackers (`docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md` L89–93). (b) is gated on whether Jetnity introduces analytics at all — a Product-Owner decision with cost and privacy consequences.
- **Smallest next slice** — Delete `components/layout/CookieConsent.tsx` and its dead-code exception, recording in `DECISIONS.md` that no banner exists because no non-essential tracker exists. This removes a false claim without inventing legal text. Do **not** mount it.

### 1.3 Analytics / tracking / third-party scripts

- **Evidence**
  - `package.json` dependencies contain no analytics or error-reporting SDK: no `@vercel/analytics`, no `@sentry/*`, no `posthog`, `plausible`, `@next/third-parties`.
  - No `next/script` usage anywhere (`from 'next/script'` and `<Script` both return zero matches).
  - `app/layout.tsx` L50–62 and `app/(public)/layout.tsx` L47–59 contain no tracking injection.
  - `lib/seo/index-grenze.ts` L11 explicitly states no tracking is part of the SEO surface.
  - `recharts` is present but only for admin-internal charts (`components/admin/home/AdminTimeSeriesClient.tsx`, `components/admin/payments/PaymentsCenter.tsx`).
- **State** — `BUILT` as a deliberate *absence*. Correctly zero third-party tracking.
- **V1 necessity** — Absence is acceptable and privacy-favourable for V1. However, see Section 6: absence of any product analytics also means Jetnity has **no** conversion or funnel truth.
- **Gap** — None from a privacy standpoint. This is the one place where the current state is genuinely clean.
- **Severity** — n/a (no privacy gap). The operational consequence is recorded in 6.1.
- **Dependency / gate** — Any future introduction is a Product-Owner decision coupled to 1.2(b).
- **Smallest next slice** — None required.

### 1.4 Compliance claims in runtime UI copy

- **Evidence**
  - `components/auth/RegisterForm.tsx` L386: "Mit der Registrierung stimmst du unseren Richtlinien zu. Datenschutz: DSGVO & CH-DSG konform."
  - `components/auth/LoginForm.tsx` L288: identical claim on the login surface.
  - These claims are made while there is no privacy notice (1.1), no consent record (1.2), no data export and no account deletion (2.1, 2.2).
- **State** — `MISSING` (the underlying compliance the copy asserts).
- **V1 necessity** — **Required.** A shipped product must not assert a compliance status it cannot evidence. This is exactly the failure mode `AGENTS.md` §8 forbids ("Dokumentation darf nicht geschönt werden") applied to user-facing copy, and `AGENTS.md` §15 applied to truth.
- **Gap** — Two runtime surfaces make an unsubstantiated regulatory conformity claim to users. Data-subject rights that GDPR/CH-DSG require (access/portability, erasure) are demonstrably absent from the product.
- **Severity** — **P0** — this is a false statement to users, independent of whether the underlying rights are later built. It is also the cheapest P0 to close.
- **Dependency / gate** — None. Removing or softening an unproven claim requires no legal content and no PO gate; keeping it does.
- **Smallest next slice** — Replace the conformity assertion in both forms with a factual statement (or remove it), and re-introduce a conformity statement only once 1.1, 2.1 and 2.2 exist. Note that `docs/AP6A_GATE0_LEGAL_FOUNDATION_STATUS_2026-08-29.md` §3.2 already classified this as an "unbelegte Behauptung" on 29 August 2026 and it is still live at this audit head — the finding is confirmed as unremediated, not new.

### 1.5 Terms acceptance capture

- **Evidence**
  - `components/auth/RegisterForm.tsx`: `accept` state L77, validation error L107, checkbox L337–356, submit gate L368 (`disabled={loading || !accept}`).
  - The accepted flag is **not persisted**: `signUp` at L127–134 passes only `email`, `password` and `options.data.name`; no terms flag, no terms version, no timestamp reaches Supabase or any table.
  - The OAuth path bypasses the gate entirely: `handleOAuth` L165–187 calls `signInWithOAuth` without checking `accept`. (Currently latent because both providers are disabled in `supabase/config.toml` L306, L312 — but it is a live code path the moment OAuth is enabled.)
  - `components/auth/LoginForm.tsx` has copy only, no acceptance control.
  - No trip-creation or guest surface captures acknowledgement (`app/(public)/planen/**`, `components/trips/**`: no matches for terms/privacy/Zustimmung).
- **State** — `PARTIAL` — a UI gate with no record and one bypass.
- **V1 necessity** — **Required** if Jetnity wants to be able to demonstrate *which* terms version a given user accepted and when. Without it, an acceptance click is unprovable and unversionable.
- **Gap** — No `terms_version` / `accepted_at` persistence; no server-side enforcement (the gate is purely client-side and can be bypassed by calling `signUp` directly); OAuth path ignores acceptance.
- **Severity** — **P1** — it degrades legal defensibility and is a real bypass, but it is downstream of 1.1: capturing acceptance of documents that do not exist would be meaningless.
- **Dependency / gate** — Depends on 1.1 (there must be a versioned document to accept). Persisting acceptance needs a migration → falls under the DB rules of `AGENTS.md` §13, and any Production migration is **PO-GATED**.
- **Smallest next slice** — After 1.1 exists: one migration adding a versioned acceptance record keyed to `auth.users`, server-side write on signup, and the OAuth path gated on the same check. Explicitly not part of this audit.

### 1.6 Public indexing boundary (launch-adjacent privacy control)

- **Evidence**
  - `app/robots.ts` L6–25 delegates to `robotsDokument()` in `lib/seo/robots-regeln.ts`; deny-all (`disallow: ['/']`, no sitemap/host) unless indexing is allowed.
  - `lib/seo/oeffentlicher-origin.ts` L59–62 requires exact `NEXT_PUBLIC_ALLOW_INDEXING === 'true'`; L138–147 additionally requires production, canonical `https://jetnity.com`, and no ephemeral host; L169–172 returns an empty sitemap otherwise.
  - `lib/seo/oeffentliche-metadata.ts` L37–59 defaults to `noindex, nofollow`.
  - Per-route noindex on `/login`, `/register`, `/reisen`, `/reisen/[tripId]`, `/account/*` and parameterised `/planen`.
  - No `public/robots.txt` shadow file (confirmed absent), so there is a single robots source of truth.
- **State** — `BUILT`, fail-closed.
- **V1 necessity** — Required and satisfied.
- **Gap** — One forward-looking consistency issue only: `SITEMAP_OEFFENTLICHE_PFADE` in `lib/seo/index-grenze.ts` L19 contains only `/` and `/planen`, so once 1.1 ships, the legal pages will not be in the sitemap. Minor.
- **Severity** — **P3**.
- **Dependency / gate** — Depends on 1.1.
- **Smallest next slice** — Add legal paths to the sitemap constant as part of the 1.1 slice.

---

## Section 2 — Account data lifecycle (export / deletion / archive / retention)

### 2.1 Data export / data-subject access (DSAR)

- **Evidence**
  - Independently re-verified: the complete `app/api/**` surface is 22 route files, all of them search / admin / safety / readiness (`app/api/activities/search`, `app/api/flights/search`, `app/api/hotels/search`, `app/api/mobility/search`, `app/api/rental-cars/search`, `app/api/safety/evaluate`, `app/api/seasonal/evaluate`, `app/api/readiness/requirements`, `app/api/search/airports`, `app/api/search/places`, and `app/api/admin/**`). **No export route exists.**
  - The complete `app/account/**` page surface is five pages: `page.tsx`, `bookings`, `security`, `settings`, `travellers`. **No export page exists.**
  - `app/account/settings/page.tsx` L16–46 links only to `/account/security`.
  - Absence is test-locked: `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` L149–150 asserts `app/account/export/page.tsx` does not exist.
  - Deferred by contract: `lib/legal/ap6a-gate0-vertrag.ts` L36–41 places export in `AP6A_NON_SCOPE`; L53–57 defers `datenexport` to AP-6b.
  - `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` L213 already records "Datenexport / Kontolöschung | missing | kein Consumer-Runtime" — consistent with code, so this is a long-known and still-open gap.
- **State** — `MISSING`
- **V1 necessity** — **Required for a lawful consumer launch in CH/EU.** Access/portability is not an optional nicety once real travellers hold real accounts with traveller records.
- **Gap** — A user has no way, self-service or manual, to obtain their own data. There is also no documented manual back-office procedure to answer a request, so the obligation cannot even be met off-product.
- **Severity** — **P0** for public launch with real users. (It is *not* P0 for continuing internal development.)
- **Dependency / gate** — Needs a defined export scope across `trips`, `trip_stages`, `trip_days`, `trip_items`, `trip_travellers` + citizenships/documents, `account_travellers` + children, `profiles`. No new provider or cost. Not inherently PO-gated *if* implemented as an authenticated read-only export of the requesting user's own rows under existing RLS. Becomes PO-gated if it requires service-role access or a new storage bucket for generated archives.
- **Smallest next slice** — A single authenticated server action or route returning the requesting user's own rows as one JSON document, RLS-bound, no service role, rate-limited, plus an entry point on `/account/settings`. The narrowest lawful shape; a formatted/multi-file archive is not needed for V1.

### 2.2 Account deletion / erasure

- **Evidence**
  - `deleteUser` appears **nowhere** in `app/**`, `components/**`, `lib/**` or `scripts/**` (independently re-verified: zero matches). There is therefore no path, admin or user, that removes an `auth.users` identity.
  - No `app/account/delete/**` route; absence test-locked at `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts` L149–150.
  - What *does* exist is sub-account deletion only: `reiseLoeschen` (`lib/trips/aktionen.ts` L280–298, owner-scoped `trips` delete with cascade), `travellerEntfernen` (`lib/readiness/reisende-aktionen.ts` L81–94 via RPC `party_loeschen`), registry traveller deletion (`lib/traveller/account-registry-aktionen.ts` L130+), and a `profiles` row delete policy `profiles_loeschen` (`supabase/migrations/20260817100800_faehigkeiten.sql` L112–114).
  - `app/auth/sign-out.ts` L25–66 ends a session; it does not delete anything.
  - `kontoloeschung` appears only as deferred scope in `lib/legal/ap6a-gate0-vertrag.ts` L39, L56.
- **State** — `MISSING` for account erasure; `PARTIAL` only in the sense that individual objects can be deleted.
- **V1 necessity** — **Required.** Erasure is the second non-negotiable data-subject right, and it is also a plain product expectation ("delete my account").
- **Gap** — No erasure of identity or of the full owned data graph. Note the graph is mostly ready for it: `account_travellers.user_id` references `auth.users(id) ON DELETE CASCADE` (`supabase/migrations/20260829201500_account_traveller_registry_persistence.sql` L19–22), and the trip graph cascades from `trips`. So the missing piece is the controlled entry point and the identity deletion, not the referential design.
- **Severity** — **P0** for public launch.
- **Dependency / gate** — **PO-GATED.** Identity deletion requires service-role or admin API access (`AGENTS.md` §14), is destructive and effectively irreversible, and per the workspace merge-approval rule destructive/reversal-hard production data changes need an explicit Product-Owner gate. It also needs a decision on soft-delete/grace period versus immediate hard delete, and on what must be retained for legal/accounting reasons.
- **Smallest next slice** — A Product-Owner decision record first (immediate vs. grace period; what is retained and why), then a single server-side deletion path with re-authentication, explicit confirmation, ownership verification and an audit record. Must not be started before the gate.

### 2.3 Archive lifecycle

- **Evidence**
  - DB: `trips.status` CHECK includes `'archived'` (`supabase/migrations/20260817120000_reiseschema.sql` L173); type union `types/trips.ts` L36–37.
  - Domain: `lib/account/reise-archiv.ts` L1–17 — `ACCOUNT_ARCHIVE_METADATA_KEY = 'account_archive'`, restore via `metadata.account_archive.previous_status`, fail-closed without provenance.
  - Write path: `lib/trips/archiv-aktionen.ts` L48–89 `reiseArchivLebenszyklus`, owner-RLS read plus optimistic guard on `status` + `updated_at`.
  - UI: `components/trips/KontoReiseArchivAktion.tsx` L12, L28–59; grouping `components/trips/KontoReisenGruppen.tsx` L13, L40, L84, L111, L122–124.
  - Guest exclusion is test-enforced: `lib/trips/archiv-aktionen.test.ts` L80–81.
  - `docs/ACCOUNT_AP4_ARCHIVE_LIFECYCLE_STATUS_2026-08-27.md` L22–32 claims integration; this claim **is** matched by runtime code, so the doc is accurate.
- **State** — `BUILT` (trip-level archive for account trips).
- **V1 necessity** — Sufficient as built. Archive is a workspace-tidiness feature, not a compliance mechanism, and must not be mistaken for erasure.
- **Gap** — Only a scope clarification: archive is trip-level, not account-level, and it does not delete anything. No V1 gap.
- **Severity** — **P3** (documentation clarity only, so that archive is never presented to a user as deletion).
- **Dependency / gate** — None.
- **Smallest next slice** — None required.

### 2.4 Retention enforcement

- **Evidence**
  - Model/AI usage telemetry: `supabase/migrations/20260818040000_modellnutzung.sql` L424–436 contains a 90-day delete statement documented as **manual**, with no scheduled job.
  - `pg_cron` is enabled (`supabase/migrations/20260815060111_baseline.sql` L30) but **no** `cron.schedule` call exists in any migration.
  - `vercel.json` is `{ "version": 2 }` only — no cron entries (corroborated by `ARCHITECTURE.md` L514 recording their removal).
  - No retention/cleanup/purge script in `scripts/**`.
  - Security telemetry has no expiry: `security_events` carries only `created_at` (`supabase/migrations/20260815060111_baseline.sql` L1036–1044); `blocked_ips` (same file, L739+) has no TTL.
  - Provider search results are not persisted at all — responses are `no-store` (e.g. `lib/flights/anfrage.ts` L48, `lib/safety/anfrage.ts` L39) and there is no `search_cache` / `provider_cache` table. This is a positive finding: the largest potential retention liability does not exist.
  - Commercial provenance rows carry `fresh_until` / `retrieved_at` freshness semantics and cascade with their trip item (`supabase/migrations/20260829140000_trip_item_commercial_provenance.sql` L165–169, L203–204), but no purge job.
  - Guest trips live only in `localStorage` (`lib/trips/gastspeicher.ts` L83–91); no server rows, and `supabase/migrations/20260817120000_reiseschema.sql` L503–505 gives anon no trip policies.
  - Sessions: `supabase/config.toml` L156 `jwt_expiry = 3600`, L160–161 refresh-token rotation; timebox and inactivity timeout are `0s` (disabled, L247–248) — platform behaviour, not application retention.
- **State** — `MISSING` as enforced lifecycle; `PARTIAL` as documented intent for `model_usage` only.
- **V1 necessity** — **Required in a minimal form.** A privacy notice (1.1) will have to state retention periods. Stating a period that nothing enforces recreates the 1.4 defect at policy level.
- **Gap** — No automated retention for any table. Concretely: `model_usage` grows unbounded despite a documented 90-day intent; `security_events` and `blocked_ips` grow unbounded; stale `trip_item_commercial_provenance` snapshots are never purged.
- **Severity** — **P1.** Not launch-blocking on its own, but it blocks writing a truthful retention section in the privacy notice, and 1.1 is P0.
- **Dependency / gate** — A retention *decision* (which period per data class) is a Product-Owner decision. Enforcing it in Production is a Production migration → **PO-GATED**. There is a cost consideration: any scheduler choice must stay inside the `AGENTS.md` §18 budget; `pg_cron` is already available at no additional cost, so no new provider is needed.
- **Smallest next slice** — Persist the retention decision per data class as a documented policy first (cheap, no migration, unblocks 1.1). Only then a single `pg_cron` job enforcing the already-documented 90-day `model_usage` rule. Do not build a generic retention framework.

### 2.5 Guest → account migration (data-loss surface)

- **Evidence**
  - Guest trips are browser-only: `lib/trips/gastspeicher.ts` L3–7, L83–94 (`jetnity:reise:v3`, `jetnity:reisen-warteschlange:v3`, legacy `jetnity:guest-trips:v2`); one-active-guest-trip rule L116–127; write verification `schreibenVersuch` / `SpeicherFehler` L48–51, L106–113.
  - Claim path: `components/trips/GastreiseBruecke.tsx` L28–71 → `gastreisenUebernehmen` (`lib/trips/uebernahme.ts`) → `gastreiseUebernehmen` (`lib/trips/aktionen.ts` L154–161) → RPC `reise_anlegen`; mounted from `app/(public)/reisen/page.tsx` L26, L89, L112.
  - Idempotency is real: unique `(user_id, client_ref)` (`lib/trips/uebernahme.ts` L30–32; `lib/trips/aktionen.ts` L116–121), so retry cannot duplicate.
  - Failure handling is conservative: abort on first error with remaining drafts left in the browser (`lib/trips/uebernahme.ts` L108–115); local removal only after server success (`uebernommenStreichen`, `gastspeicher.ts` L909–922).
- **State** — `BUILT` with honest partial-failure semantics.
- **V1 necessity** — Satisfied. This is permitted by `AGENTS.md` §13 precisely because a clean migration path exists.
- **Gap** — Residual, inherent to the guest model: a guest who clears browser storage, switches device or hits a storage quota loses the draft, and party/readiness sync can fail after the trip row is created (`lib/trips/uebernahme.ts` L118–140 returns a partial count). The code is honest about this; the product does not warn the user that guest work is device-local.
- **Severity** — **P2** — a trust/expectation gap rather than a defect.
- **Dependency / gate** — None; UX copy only.
- **Smallest next slice** — One honest line in the guest planning surface stating that an unclaimed trip lives only in this browser. Copy-only, no schema change.

### 2.6 Ownership model and RLS for user-owned data

- **Evidence**
  - `trips`: `user_id uuid not null default auth.uid()` with owner-only SELECT/INSERT/UPDATE/DELETE (`supabase/migrations/20260817120000_reiseschema.sql` L207–208, L511–528); authenticated-only, anon has no policies (L503–505).
  - Child tables carry `user_id` plus composite FKs back to `trips` with CASCADE: `trip_stages` (L242–283, L530+), `trip_days` (L319–342), `trip_items` (L387–465).
  - `trip_travellers` (`supabase/migrations/20260822020000_trip_travellers.sql` L68–82), `trip_traveller_citizenships` / `trip_traveller_documents` (`supabase/migrations/20260822160000_traveller_context_intelligence.sql` L215–241), writes via RPC `party_schreiben` / `party_loeschen`.
  - `account_travellers` + children with owner RLS (`supabase/migrations/20260829201500_account_traveller_registry_persistence.sql` L19–22, L56–75, L90–118, L189–231).
  - `trip_item_commercial_provenance`: owner SELECT only, no direct authenticated write (`supabase/migrations/20260829140000_trip_item_commercial_provenance.sql` L227–245).
  - Verification tooling exists as npm scripts `db:rls`, `db:rechte`, `db:sicherheit` (`package.json` L28–30) backed by `scripts/db/rls.mjs`. **Not executed by this audit** — this slice changes no runtime and the binding task forbids unnecessary suite runs; therefore the *live* RLS state is asserted from migration source only.
- **State** — `BUILT` (as declared in migrations).
- **V1 necessity** — Required and satisfied at the schema level.
- **Gap** — No schema gap found. The honest limitation is evidential: this audit verified declared policies, not their live behaviour in the Production project.
- **Severity** — **P3** (evidence freshness only).
- **Dependency / gate** — Running `db:rls` / `db:rechte` / `db:sicherheit` against a real project requires credentials this audit does not and must not use.
- **Smallest next slice** — None. Re-run the existing RLS gates as part of the next runtime-changing slice, not as a separate slice.

### 2.7 Sensitive traveller data minimisation

- **Evidence**
  - `trip_travellers` stores `label`, `nationality_country_code`, `residence_country_code`, `document_type`, `document_issuing_country_code`, `document_expires_on` (`supabase/migrations/20260822020000_trip_travellers.sql` L6–58), with explicit exclusions at L3–4 and L53–58 and a `label` CHECK that rejects passport-number-like patterns (L26–32).
  - Child tables store ISO country codes and document *metadata* only, with the exclusion recorded in-migration (`supabase/migrations/20260822160000_traveller_context_intelligence.sql` L21–91, comment L90–91).
  - `account_travellers` migration header L8 states: no passport/document numbers, scans, MRZ, biometrics, DOB or health data; columns L10–118 match.
  - Runtime rejects sensitive keys at two boundaries: `lib/traveller/account-registry.ts` L128–140 (blocked keys incl. `mrz`, `biometric`, `dob`) and `lib/readiness/traveller-anfrage.ts` L69–76 (API boundary rejects MRZ / passport number).
  - `types/supabase.ts` L869–976 mirrors the minimal shape.
  - `pgcrypto` is available (`supabase/migrations/20260815060111_baseline.sql` L36) but traveller columns are plain `text` / `date` — no column-level encryption.
- **State** — `BUILT` — genuinely data-minimising, enforced in both schema and runtime, which is stronger than policy-by-documentation.
- **V1 necessity** — Satisfied, and this is the strongest privacy posture in the whole audited domain. It also means Jetnity currently avoids the PO-gated category of passport/MRZ/biometric storage entirely.
- **Gap** — None for V1. Note for the future: the minimisation is what keeps this out of the highest-risk regulatory bracket, so any later "scan your passport" feature is a hard Product-Owner gate, not an incremental feature.
- **Severity** — n/a.
- **Dependency / gate** — Any expansion is PO-gated per the workspace rule on sensitive pass/MRZ/biometric storage.
- **Smallest next slice** — None.

---

## Section 3 — Session / MFA / AAL / recovery

### 3.1 Route protection and session handling

- **Evidence**
  - Request boundary is `proxy.ts` (Next 16 replacement for `middleware.ts`; absence of `middleware.ts` is test-locked at `lib/auth/proxy-security-contract.test.ts` L15–18). `proxy` L61–115.
  - Scopes L41–59: `/api/admin` → 401 JSON; `/admin` (except `/admin/login`) → redirect `/admin/login`; `/account` → redirect `/login`.
  - Identity is verified with `supabase.auth.getUser()` (L99–105), not `getSession()` — the correct, non-spoofable choice. Same pattern in `lib/auth/admin-guard.ts` `loadVerifiedUser` L73–96.
  - Fail-closed on missing env (L74–80) and on auth lookup failure (L108–113).
  - Session refresh happens through the SSR cookie flow in `proxy.ts` L83–96.
  - Clients: `lib/supabase/client.ts` L20–32 (browser), `lib/supabase/server.ts` L61–88 (RSC read-only vs. route/action mutable).
- **State** — `BUILT`
- **V1 necessity** — Required and satisfied.
- **Gap** — One layering nuance: the proxy enforces authentication only, not role or AAL (documented at `proxy.ts` L10–19); authorisation lives in `lib/auth/admin-guard.ts` via `requireAdminPage` (`app/(admin)/layout.tsx` L27) and `requireAdminApi`. This is a defensible design, but it means a new admin route that forgets the guard is authenticated-but-unauthorised-open. The repository does have `check:api-schutz` as a hygiene gate for this class of mistake.
- **Severity** — **P3**.
- **Dependency / gate** — None.
- **Smallest next slice** — None; rely on the existing `check:api-schutz` gate.

### 3.2 MFA / TOTP for users and admins

- **Evidence**
  - Full TOTP lifecycle in `components/account/SecurityMFA.tsx`: list factors L176–199, enroll L201–238, challenge+verify L240–290, unenroll L350–365.
  - Helpers: `lib/auth/account-security-faktoren.ts`, `lib/auth/account-mfa-step-up.ts` (step-up required before removing a *verified* factor), `lib/auth/mfa.ts` (`getAAL`, `startTotpChallenge`).
  - Login-time MFA: `components/auth/LoginForm.tsx` L110–118 reads AAL and opens `components/auth/MFATotpDialog.tsx` (verify L90–94) when `nextLevel === 'aal2'`.
  - Config: `supabase/config.toml` L275–277 TOTP enroll/verify enabled, L273 `max_enrolled_factors = 5`; phone MFA L281–286 and WebAuthn L288–290 disabled; passkeys L321–322 disabled with status-only UI (`SecurityMFA.tsx` L543–587).
  - Admin uses the same enrollment surface (`lib/auth/admin-aal.ts` L15 `ADMIN_MFA_EINRICHTUNG = '/account/security'`).
- **State** — `BUILT` for TOTP.
- **V1 necessity** — Satisfied for the enrollment/verification path.
- **Gap** — See 3.4: the lifecycle is complete except for loss-of-factor recovery.
- **Severity** — n/a here.
- **Dependency / gate** — None.
- **Smallest next slice** — None.

### 3.3 AAL / step-up enforcement

- **Evidence**
  - Admin AAL2 is mandatory in the application layer: `lib/auth/admin-aal.ts` `parseAalLookup` reads only `currentLevel` (L31–44) and `applyAdminAal` requires `currentLevel === 'aal2'` (L57–61); wired through `lib/auth/admin-guard.ts` L177–188, L224–225, with `aal2-required` redirecting to `/admin/mfa` (L271).
  - Admin login degrades safely: `entscheideAdminLoginFortgang` (`app/(public)/admin/login/actions.ts` L45–49) routes an AAL1 admin to step-up while keeping the session.
  - Server re-check after step-up: `bestaetigeAdminAal2Action` (`app/(public)/admin/mfa/actions.ts` L16–31) re-runs `evaluateAdminAccess`.
  - Data plane enforces it too: `aktuelles_admin_aal2()` checks the JWT `aal` claim (`supabase/migrations/20260826090000_admin_aal2_data_plane.sql` L17–25) and all `darf_*()` helpers require it; alignment migration `supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`.
  - Consumer AAL2 is deliberately conditional, not global: `lib/auth/account-mfa-step-up.ts` L4 explicitly records "Kein globales Consumer-AAL2".
- **State** — `BUILT` for admin (app layer + data plane, as declared in migrations).
- **V1 necessity** — Satisfied for admin. Global consumer AAL2 is not a V1 requirement and would be a major auth-contract change (PO-gated).
- **Gap** — **A repository-internal contradiction about Production state**, which is the most important finding in this section. `docs/AUTH.md` L116–117 states Production does **not** have `aktuelles_admin_aal2()`, while `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_STATUS_2026-08-27.md` L23–27 states the Production migration was applied and verified on 27 August 2026. Both cannot be current. Compounding this, `supabase/config.toml` L118–121 and `scripts/auth/anwenden.ts` L20–22 confirm that auth configuration tooling targets the **Development branch only** and explicitly does not manage Production — so the repository has no mechanism that could keep a Production claim automatically true.
- **Severity** — **P1.** The security control appears correctly built; what is missing is trustworthy knowledge of whether it is live in Production. Under the binding task rule "do not claim Production parity without evidence", the honest current state is *unknown*.
- **Dependency / gate** — Resolution requires reading live Production state (`npm run auth:pruefen`, `db:sicherheit`, or a Management API read) with Production credentials. This audit deliberately did not and must not use them.
- **Smallest next slice** — A Technical-Lead-run Production verification of `aktuelles_admin_aal2()` and the AAL2-dependent `darf_*()` helpers, then correct exactly one of the two conflicting documents and mark the other superseded. No code change. This is the cheapest high-value item in the whole matrix.

### 3.4 MFA recovery / loss of factor

- **Evidence**
  - Independently re-verified: `backup code`, `recovery code` and `Wiederherstellungscode` (all case-insensitive variants) return **zero** matches across `app/**`, `components/**`, `lib/**`. No backup codes exist.
  - No lockout-recovery module (`lockout`, `account.?lock` in `lib/auth/**`: none). `ACCOUNT_STATUSES` in `lib/auth/roles.ts` L169 (`active|pending|disabled|banned`) is admin-managed status, not MFA recovery.
  - Removing a *verified* factor itself requires a successful OTP step-up (`lib/auth/account-mfa-step-up.ts`), so a user without their authenticator cannot self-clear it.
  - For admins the failure mode is explicit: `AdminMfaStepUp.tsx` L75–80 directs the user to `/account/security` to enroll, and the admin area stays closed until AAL2 is reached.
- **State** — `MISSING`
- **V1 necessity** — **Required** for anyone who enrolls MFA, and *critically* required for admins, because admin access is hard-gated on AAL2 (3.3). A single admin who loses their TOTP device is locked out of the admin area with no in-product recovery.
- **Gap** — No backup codes, no secondary factor, no documented break-glass recovery runbook for MFA loss. Note that `ADMIN_ALLOWED_EMAILS` break-glass (`lib/auth/admin-access.ts` L63–71, L130–132) does **not** solve this: `reachesDatabase()` is false for break-glass (L154–156) and `admin-guard.ts` L240–250 warns that DB reads are denied, so break-glass opens the shell without data.
- **Severity** — **P1** for consumers (self-inflicted, low volume, supportable manually — except that no support channel exists either, see Section 4). **P0 operationally for admins**, because the realistic single-admin-lockout scenario has no recovery path and would block incident response at exactly the wrong moment.
- **Dependency / gate** — Supabase-side TOTP backup codes are not enabled in config; enabling a second factor type (phone/WebAuthn, `supabase/config.toml` L281–290) or adding recovery codes touches the auth/MFA contract → **PO-GATED** per the workspace rule on fundamental Auth/Session/MFA/AAL changes. A documented operational runbook is **not** gated.
- **Smallest next slice** — Write the admin MFA-loss recovery runbook (who can restore access, via which Supabase console operation, with what verification) as documentation. This is ungated, costs nothing, and closes the operational P0 without touching the auth contract. Only afterwards consider a second factor or backup codes as a PO-gated slice.

### 3.5 Session visibility and logout scopes

- **Evidence**
  - Scoped logout is implemented: `components/account/SecurityLogout.tsx` → `app/account/security/logout-action.ts` L27–29 → `logoutScopeAusfuehren` → `signOut({ scope })`, with `LOGOUT_SCOPES` (`lib/auth/account-logout-scopes.ts` L12) covering `local` / `others` / `global`, and post-conditions verified for `others` (L317–333).
  - The UI is honest about its limits: it cannot list other devices (`SecurityLogout.tsx` L76–78) and states that a JWT may remain valid for up to ~1 hour (`LOGOUT_JWT_HINWEIS`, `lib/auth/account-logout-scopes.ts` L78–79) — which is consistent with `supabase/config.toml` L156 `jwt_expiry = 3600`.
  - Session view shows the current session only, after a confirmed `getUser()` (`lib/auth/account-session-view.ts` L237–266), with explicit disclaimers for token expiry (L89–90, L280–282) and locally-detected browser hints (L95–96, L203–205). Other sessions are typed as `SITZUNG_ANDERE_LAGE = 'unsupported'` (L12) rather than shown as "0".
  - Global logout from navbar/footer is unscoped-global (`app/auth/sign-out.ts` L63, comment L25–26).
- **State** — `BUILT`, and notably honest: it distinguishes "we cannot know" from "there is nothing", which is exactly the distinction `AGENTS.md` §15 demands.
- **V1 necessity** — Satisfied. A full device/session list is a Supabase platform capability gap, not a Jetnity defect, and the UI does not pretend otherwise.
- **Gap** — None V1-blocking.
- **Severity** — **P3**.
- **Dependency / gate** — None.
- **Smallest next slice** — None.

### 3.6 Password reset and account recovery

- **Evidence**
  - Forgot-password is an inline action on the login form: `components/auth/LoginForm.tsx` L130–154 calls `resetPasswordForEmail` with `redirectTo` `/auth/update-password`. There is **no** dedicated `/forgot-password` route.
  - Completion: `app/auth/update-password/page.tsx` (session required, `updateUser({ password })` L70); recovery links are routed there by `app/auth/callback/CallbackClient.tsx` L50–52.
  - Signed-in password change is separately hardened with reauthentication: `components/account/SecurityPasswort.tsx` via `lib/auth/account-password-aenderung.ts`, test-enforced in `lib/auth/ap5-s2-password-aenderung.test.ts`.
  - Register uses neutral, non-enumerating success copy (`lib/auth/register-meldung.ts`).
  - Email confirmation is on (`supabase/config.toml` L204), and `lib/supabase/auth-erwartung.ts` L215–220 expects `mailer_allow_unverified_email_sign_ins = false`.
- **State** — `BUILT`
- **V1 necessity** — Satisfied.
- **Gap** — Two minor items. (a) The reset entry point is discoverable only from the login form; a user who cannot reach it has no other path, and there is no support channel as an alternative (Section 4). (b) `supabase/config.toml` L134 `site_url = http://localhost:3000` and L155 `additional_redirect_urls = []` are development values; the recovery redirect therefore depends entirely on runtime `origin`. Since auth config tooling manages the Development branch only (L118–121), the Production redirect allow-list is unverified from the repository.
- **Severity** — **P2** for (b) — a wrong Production redirect allow-list breaks password recovery for real users, which is precisely a launch-critical path.
- **Dependency / gate** — Verification needs Production auth config access; same constraint as 3.3.
- **Smallest next slice** — Fold the Production redirect-URL / `site_url` check into the same Technical-Lead Production auth verification recommended in 3.3, so one credentialed pass answers both.

### 3.7 Rate limiting on auth surfaces

- **Evidence**
  - Platform limits are declared in `supabase/config.toml` `[auth.rate_limit]` L174–188: `email_sent` 2/hour, `sign_in_sign_ups` 30/5min, `token_verifications` 30/5min, `token_refresh` 150/5min, `sms_sent` 30, `anonymous_users` 30, `web3` 30.
  - Captcha is disabled: `[auth.captcha] enabled = false` (L193–194).
  - There is no application-layer auth rate limiting, and structurally there cannot be: auth calls go from the browser directly to Supabase, so no Jetnity route sits in the path. Existing `rateLimit` helpers in `lib/**` cover flights/activities/safety provider routes only.
  - Rate-limit *errors* are handled honestly in the UI (`LoginForm.tsx` L38–39; `lib/auth/account-logout-scopes.ts` L384–386; `lib/auth/globales-sign-out.ts` L138–139; `lib/auth/account-mfa-step-up.ts` L46).
  - Password policy is strong: minimum length 12 with `lower_upper_letters_digits_symbols` (`supabase/config.toml` L171–172), and `lib/supabase/auth-erwartung.ts` L205+ expects `password_hibp_enabled = true`.
- **State** — `BUILT` at the platform layer (as declared for the Development branch).
- **V1 necessity** — Acceptable for V1. Delegating auth rate limiting to Supabase is the correct choice and avoids inventing a parallel control.
- **Gap** — Same evidence limitation as 3.3/3.6: these are the **Development branch** declared values. Whether Production carries the same limits and the same HIBP setting is not provable from the repository. Additionally `email_sent = 2/hour` is tight for real users who mistype an address during password recovery — worth a conscious decision rather than an accident.
- **Severity** — **P2**.
- **Dependency / gate** — Production auth config read; same credentialed pass as 3.3 and 3.6.
- **Smallest next slice** — Include the rate-limit and HIBP values in the single Production auth verification pass; decide consciously on `email_sent`.

---

## Checkpoint 1 summary (Sections 1–3)

| # | Capability | State | Severity | Gate |
|---|---|---|---|---|
| 1.1 | Public legal pages | MISSING | P0 | PO-gated (legal content) |
| 1.2 | Consent management / orphan banner | MISSING | P2 now / P0 if tracking added | Free (delete) / PO (tracking) |
| 1.3 | Third-party tracking | BUILT (absent by design) | — | — |
| 1.4 | Compliance claims in UI copy | MISSING (substance) | **P0** | None — cheapest P0 |
| 1.5 | Terms acceptance capture | PARTIAL | P1 | Depends on 1.1; migration PO-gated |
| 1.6 | Indexing boundary | BUILT | P3 | — |
| 2.1 | Data export / DSAR | MISSING | P0 | Scope decision |
| 2.2 | Account deletion | MISSING | P0 | **PO-gated** (destructive) |
| 2.3 | Trip archive | BUILT | P3 | — |
| 2.4 | Retention enforcement | MISSING | P1 | PO decision + Prod migration |
| 2.5 | Guest → account migration | BUILT | P2 (copy) | — |
| 2.6 | Ownership / RLS | BUILT (declared) | P3 | Live re-verification |
| 2.7 | Traveller data minimisation | BUILT | — | Expansion PO-gated |
| 3.1 | Route protection / session | BUILT | P3 | — |
| 3.2 | TOTP MFA | BUILT | — | — |
| 3.3 | Admin AAL / step-up | BUILT, **Production state unknown** | P1 | Credentialed Prod read |
| 3.4 | MFA recovery / factor loss | MISSING | P1 user / **P0 admin ops** | Runbook free; 2nd factor PO-gated |
| 3.5 | Session view / logout scopes | BUILT (honest) | P3 | — |
| 3.6 | Password reset | BUILT | P2 (Prod redirect unverified) | Credentialed Prod read |
| 3.7 | Auth rate limiting | BUILT (declared, Dev branch) | P2 | Credentialed Prod read |

Sections 4–6 and the cross-cutting findings follow in checkpoint 2 of this document.
