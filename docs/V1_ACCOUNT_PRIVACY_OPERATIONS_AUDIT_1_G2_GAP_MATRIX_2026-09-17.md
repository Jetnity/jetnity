# Jetnity – V1 Account / Privacy / Operations Minimum – Gap Matrix (Audit 1, Generation 2)

Stand: 17. September 2026
Status: **AUDIT-ONLY / DOCS-ONLY — COMPLETE (Sections 1–7 persisted)**

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

### 3.8 Transactional email delivery — no own SMTP, global 2 emails/hour

Added during the adversarial self-review pass, which asked what every auth flow silently depends on. It is the most severe finding in Section 3.

- **Evidence**
  - There is **no own SMTP server**. `supabase/config.toml` L216–222 has the entire `[auth.email.smtp]` block commented out (the commented example still names SendGrid), so Supabase's built-in sender is used.
  - The rate limit is therefore the built-in sender's: `supabase/config.toml` L179 `email_sent = 2`. The surrounding comment at L177–178 confirms this key applies while `[auth.email.smtp]` is off, and it is recorded so the verification tooling sees it.
  - `[local_smtp]` at L81–89 is the local development mail-catcher on port 54324. It is a test inbox, not a delivery path.
  - The repository already states the consequence plainly. `docs/AUTH.md` L105 records "eigener SMTP-Server | nein | nein"; L265 states that Supabase sends the mail itself and hard-limits to two emails per hour, and that **"Für den Launch reicht das nicht"**; L314 lists it as "offen. Vor dem Launch nötig".
  - Everything user-critical depends on this path: email confirmation is required (`enable_confirmations = true`, L204), password reset is email-only (`resetPasswordForEmail`, `components/auth/LoginForm.tsx` L130–154), and there is no alternative recovery channel (3.4) and no support process to fall back on (4.1). OAuth, which would bypass email for some users, is disabled (L306, L312).
- **State** — `MISSING` (production-capable email delivery).
- **V1 necessity** — **Required, absolutely.** Without it, registration and password recovery do not work for real users at any meaningful volume.
- **Gap** — The built-in sender's limit is a **project-wide** ceiling of two emails per hour, not a per-user one. With real travellers, the third person to register or request a password reset in any given hour receives nothing — and receives no explanation, because the failure is on the provider side. This turns the whole authentication surface, which is otherwise well built, into an unusable funnel at launch. It also silently degrades every flow the rest of this matrix assumes works: email confirmation, password recovery, and any future account-deletion or data-export confirmation email.
- **Severity** — **P0.** This should be read as the most concrete launch blocker in the entire audit: unlike the legal and data-rights P0s, it does not require a policy decision to recognise, and unlike them it breaks the core journey rather than the surrounding obligations.
- **Dependency / gate** — Requires an email-sending provider and a secret. That is a **new external provider plus a secret**, therefore Product-Owner-gated under `AGENTS.md` §5/§16/§18 — though the cost is small and several providers have free or near-free tiers at Jetnity's current volume. Note `ARCHITECTURE.md` L361 records that earlier Infomaniak mail automation was removed in the V2 cleanup, so this is a re-introduction decision rather than a novel one. Auth configuration tooling manages the Development branch only (`supabase/config.toml` L118–121), so Production SMTP configuration is a separate manual step that the repository cannot verify.
- **Smallest next slice** — A Product-Owner decision on the email provider, then SMTP configuration plus a documented Production verification that a confirmation and a reset mail actually arrive. No application code change is needed — this is configuration and verification, which is why it is cheap to close once the provider is chosen.
- **Correction to 3.7** — Row 3.7 above notes `email_sent = 2/hour` as "tight for real users" and classifies auth rate limiting as `BUILT`. That framing understates the issue: the value is not a tunable limit on an otherwise working sender, it is the symptom of having no production sender at all. Read 3.7 together with this row.

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
| 3.8 | Transactional email: no own SMTP, project-wide 2 mails/hour | MISSING | **P0** | PO (provider + secret) |

---

## Section 4 — Support minimum

### 4.1 Support / help channel

- **Evidence**
  - Exactly **one** user-facing contact entry point exists in the entire product: `components/layout/Footer.tsx` L45–52, a `mailto:info@jetnity.ch` link under the contact heading.
  - It renders on public routes (`app/(public)/layout.tsx` L5, L56) and account routes (`app/account/layout.tsx` L9, L27). It does **not** render in the admin area (`app/(admin)/admin/layout.tsx` has no `Footer` import).
  - Independently re-verified: `find app -type d` matching `support`, `help`, `hilfe`, `kontakt`, `contact`, `faq` returns **zero** directories. There is no help page, no FAQ, no feedback form, no ticket system.
  - Public navigation carries no help entry: `lib/auth/oeffentliche-navigation.ts` L64–68 defines only `/#entdecken`, `/reisen`, `/#pro`.
  - `docs/PRIVACYBEE_VENDOR_FIT_GAP_MATRIX_2026-08-29.md` L87 mentions Freshdesk / Customer.io as *future* vendors; no such integration exists in code.
- **State** — `PARTIAL` — a contact address exists; a support capability does not.
- **V1 necessity** — **Required.** V1 is defined as "production ready for real travellers" (`docs/ACTIVE_WORK_STATUS.md` §2). Real travellers with a trip in progress will need help, and several failure modes documented in this matrix have *no* self-service resolution: MFA factor loss (3.4), data export (2.1), account deletion (2.2). Each of those silently assumes a support channel that is not defined.
- **Gap** — The mailto is a contact address, not a support process. There is no stated response expectation, no ownership, no triage path, and it is not reachable from the surfaces where users actually get stuck: it is absent from the admin area, absent from every error surface (4.2, 4.3), and absent from the auth forms where login/MFA failures occur.
- **Severity** — **P1.** Not literally zero, so not P0, but it is the load-bearing assumption behind three separate P0/P1 gaps elsewhere in this matrix.
- **Dependency / gate** — A documented support process is ungated and costs nothing. A ticketing vendor is a new recurring cost and therefore falls under `AGENTS.md` §18 and needs Product-Owner approval.
- **Smallest next slice** — Persist a support process document (who monitors `info@jetnity.ch`, expected response window, escalation for account-locked and data-rights requests), then surface the existing address on the error surfaces. No vendor, no new cost.

### 4.2 Error boundaries — coverage gap in the authenticated area

- **Evidence**
  - Independently re-verified: the complete set of error/not-found boundaries is `app/(public)/error.tsx`, `app/(admin)/admin/error.tsx`, `app/not-found.tsx`, `app/(public)/not-found.tsx`, `app/(admin)/admin/not-found.tsx`.
  - There is **no** `app/error.tsx` (root) and **no** `app/account/error.tsx`, and **no** `global-error.tsx` anywhere.
  - `app/account/**` is not nested under the `(public)` group, so `app/(public)/error.tsx` does not apply to it. A runtime error anywhere in `/account/*` therefore falls through to the Next.js default error screen.
  - By contrast the public boundary is well built: `app/(public)/error.tsx` offers `reset()` (L50–57), a link to `/reisen` (L58–64), and a quotable `Fehler-ID` (L67–69 via `oeffentlicheFehlerId(error?.digest, React.useId())` L25).
- **State** — `MISSING` for the account segment; `BUILT` for public and admin.
- **V1 necessity** — **Required.** The authenticated area is where a user's trip data lives; it is the least acceptable place to show an unbranded default error page with no recovery action and no reference.
- **Gap** — No error boundary covering `/account/*`, and no root-level or global boundary as a backstop. A crash while viewing bookings or travellers produces a generic screen with no `Fehler-ID`, no retry, and no way back into the product.
- **Severity** — **P1.**
- **Dependency / gate** — None. This is a small, self-contained runtime addition mirroring an existing pattern.
- **Smallest next slice** — Add `app/account/error.tsx` reusing the `(public)` boundary's structure, including `oeffentlicheFehlerId`. Consider a root `app/global-error.tsx` as a backstop.

### 4.3 Error identifiers without a route to use them

- **Evidence**
  - `app/(public)/error.tsx` L67–69 shows the user a `Fehler-ID`.
  - `app/(admin)/admin/error.tsx` L17–18 shows `Ref: {error.digest}` **only if** `error.digest` is present, with no `oeffentlicheFehlerId` fallback — so the admin surface can render without any reference at all.
  - Neither surface tells the user what to do with the identifier: no mailto, no "send this ID to support" copy.
  - Nothing correlates the identifier on the operator side, because there is no error tracking (5.5). The `Fehler-ID` is therefore currently unresolvable even if a user does quote it.
  - Client errors are logged only to the user's own browser console: `app/(public)/error.tsx` L19–21 `console.error('[PublicRouteError]', error)`.
- **State** — `PARTIAL` — the identifier exists, the loop does not close.
- **V1 necessity** — Required to make support (4.1) actually effective.
- **Gap** — An identifier is shown that neither the user nor the operator can act on. The admin boundary can render with no identifier at all.
- **Severity** — **P2.**
- **Dependency / gate** — Depends on 4.1 (a support address on the surface) and 5.5 (something operator-side to correlate against).
- **Smallest next slice** — Fold into 4.1 and 4.2: add contact copy next to the `Fehler-ID` and give the admin boundary the same fallback identifier.

### 4.4 Empty-vs-error distinction in consumer views

- **Evidence**
  - The binding convention exists and is genuinely used. Server side: `lib/api/datenbank-lesen.ts` — `Problem` type L39–42, `problemAus()` L70–84 (503 for transport, 500 otherwise), `lese()` L107+ returning `{ zeilen, problem }`.
  - Admin UI side: `lib/admin/ladezustand.ts` `ausProblem()` L43–45, `lade()` L92–137, rendered by `components/admin/Ladezustand.tsx` L36–74 (`Fehlerflaeche`).
  - Consumer views implement the same distinction per view rather than through a shared component: `components/account/AccountBuchungen.tsx` L113–125, `components/account/AccountUebersicht.tsx` L74–87, `components/account/AccountReisende.tsx` L73–83, `app/(public)/reisen/page.tsx` L86–105, `app/(public)/reisen/[tripId]/page.tsx` L59–73. Loaders use `lese()` (`lib/trips/daten.ts` L143–152, `lib/account/buchungen-daten.ts` L65–66); actions use `meldungAus()` (`lib/trips/anlegen.ts` L54–70).
  - A good example of the principle being applied deliberately: `components/admin/home/AdminStatsStrip.tsx` L62–65 refuses to coerce a missing capability into `0`, with the comment that a zero "wäre die Behauptung, es habe in dreissig Tagen niemand eine Reise angelegt".
- **State** — `BUILT`. The `AGENTS.md` §15 requirement is met in both the route layer and the view layer.
- **V1 necessity** — Satisfied.
- **Gap** — Only duplication: the 503/500 copy is repeated across consumer components, so a future change has several places to miss. No correctness gap.
- **Severity** — **P3.**
- **Dependency / gate** — None.
- **Smallest next slice** — None. If touched later, extract the shared consumer copy — but not as its own slice.

### 4.5 Status / incident communication to users

- **Evidence**
  - Searched `maintenance`, `wartung`, `statusseite`, status page, downtime banner across `app/**` and `components/**`: no user-facing status, maintenance mode or downtime surface exists.
  - The only kill switch that affects users is provider-side and silent: `lib/provider-ops/zustand.ts` L21–35 returns `{ aktiv: false, grund: 'production' }` in production, which disables provider features without any user-facing explanation surface.
  - The only `role="banner"` in the tree is the admin topbar ARIA landmark (`components/layout/AdminTopbar.tsx` L87).
- **State** — `MISSING`
- **V1 necessity** — Required in minimal form. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §H requires a defined incident process; telling users something is wrong is part of it.
- **Gap** — During an outage or a deliberate degradation there is no way to tell users anything. They see generic errors or silently missing features.
- **Severity** — **P2.**
- **Dependency / gate** — None for a minimal, statically-controlled notice.
- **Smallest next slice** — Not now. Record it as a release-gate item; do not build a status system before the P0 items are closed.

### 4.6 Support reference for booking handover

- **Evidence**
  - `lib/account/buchungen-daten.ts` L28–33 deliberately excludes amounts, partner fields and deeplinks from the account bookings read.
  - "Booked" means the user said so, not the provider: `lib/trips/buchung.ts` L5–7, L39–48 (`bookingSource: 'user'`).
  - `booking_url` is forced null on every uptake path (`lib/flights/uebernahme.ts` L30, L100; `lib/flights/aktionen.ts` L79) and the DB guards it (`supabase/migrations/20260829140000_trip_item_commercial_provenance.sql` L580, L636–702).
- **State** — Not applicable yet, and correctly so.
- **V1 necessity** — No current gap: there is no external handover (see 6.1), so there is nothing to reference.
- **Gap** — Forward-looking only. The moment an affiliate handover ships, a user whose external booking fails will need a reference, and the schema already has the fields for it (`affiliate_click_id`, `affiliate_attribution_ref`).
- **Severity** — **P3 now**, becomes P1 as a precondition of any booking-handover slice.
- **Dependency / gate** — Provider activation, which is PO-gated.
- **Smallest next slice** — None. Record as a precondition on the future handover slice.

---

## Section 5 — Admin incident / error / provider / cost visibility

### 5.1 Admin surface honesty

- **Evidence**
  - Five admin pages are explicit placeholders, all using the same component: `app/(admin)/admin/{analytics,content,marketing,settings,localization}/page.tsx` each render `AdminFolgtSeite` (independently re-verified — those five files plus the component itself are the only references).
  - The component is unambiguous: `components/admin/AdminFolgtSeite.tsx` L11 labels the area "folgt" and L16 renders `adminFolgtSeitenhinweis()` from `lib/admin/ehrliche-zustaende.ts` L84–86 ("…ist kein fertiges Modul. Die Fläche ist ein Platzhalter…"). Navigation marks them `kind: 'later'` (`lib/admin/navigation.ts` L24–28).
  - Real, data-backed admin pages: `/admin` (RPCs `admin_payments_summary_30d`, `admin_reisen_kennzahlen`, `admin_reisen_zeitreihe`, `admin_security_overview`), `/admin/users` (`profiles`), `/admin/payments`, `/admin/security`, `/admin/system-health`, `/admin/provider-ops`.
  - Every admin page passes `requireAdminPage` via `app/(admin)/layout.tsx` L27, with AAL2 enforced inside (3.3), and admin APIs use `requireAdminApi` with a capability (`betrieb-lesen` for reads, `betrieb-eingreifen` for writes).
  - All admin read routes use `lese()` / `problemAntwort`, so an empty table is distinguishable from a failure.
- **State** — `BUILT` and honest. Placeholders are labelled as placeholders; this is the correct behaviour and should not be recorded as a gap.
- **V1 necessity** — Satisfied as a *surface*. What is missing is behind the surfaces, in 5.2–5.6.
- **Gap** — None in presentation.
- **Severity** — **P3.**
- **Dependency / gate** — None.
- **Smallest next slice** — None.

### 5.2 Security event ingestion — the admin security page has no writers

- **Evidence**
  - Independently re-verified: every reference to `security_events` in `app/**`, `components/**`, `lib/**` is a **read**. The three readers are `app/api/admin/security/list/route.ts`, `.../events/route.ts`, `.../summary/route.ts`. The only remaining matches are a policy-name assertion in `lib/auth/admin-aal2-alignment.test.ts` L33 and a comment in `lib/api/suchfilter.ts` L8.
  - There is **no INSERT** anywhere in application code. The only writes in the repository are in the DB test harness `scripts/db/sicherheit.mjs`.
  - Nothing logs auth failures: `app/(public)/admin/login/actions.ts` L41–43 calls Supabase auth and writes no event.
  - The table itself is real (`supabase/migrations/20260815060111_baseline.sql` ~L1036) with admin-read RLS.
- **State** — `MISSING` (ingestion). The read path is `BUILT`.
- **V1 necessity** — **Required.** `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §G explicitly requires that "auth-/security-relevante Events sichtbar" — currently they are structurally invisible.
- **Gap** — The admin security page is a correct reader of a table that nothing writes. It will therefore show an empty list forever, and — because the empty/error convention is properly implemented — that emptiness will be reported honestly as "no events", which a reader can easily misinterpret as "no security events occurred" rather than "nothing records security events".
- **Severity** — **P1.** This is the clearest instance in the audit of a capability that looks built end-to-end and is not.
- **Dependency / gate** — Writing events from the app needs a decision on what is recorded and how PII is avoided (§G of the release gate also requires no PII in logs). Supabase already records auth events platform-side; the cheapest honest option may be to surface those rather than duplicate them.
- **Smallest next slice** — Before any code: decide whether Jetnity records its own security events or reads Supabase's. If Jetnity's own, one narrow writer for authentication failures and admin interventions, with no PII beyond what the table already holds.

### 5.3 IP blocklist is not enforced

- **Evidence**
  - Admin can write and delete entries: `app/api/admin/security/block/route.ts` L24–26 (upsert), `.../unblock/route.ts` L23 (delete).
  - Nothing reads the list at request time. Independently re-verified: `proxy.ts` contains no reference to `blocked_ips` or any block check, and there is no `middleware.ts` in the repository.
  - The product is honest about it in user-visible copy: `lib/admin/ehrliche-zustaende.ts` L19–20 states the blocklist "wird derzeit nicht enforced. Einträge stehen in blocked_ips; Middleware und Edge prüfen sie nicht", and L23–24 even prefixes success messages with "(nicht enforced)".
- **State** — `PARTIAL` — a persisted list with no enforcement, disclosed as such.
- **V1 necessity** — Not required for V1. An unenforced list is not a security control, but the honest labelling means it is not a false claim either.
- **Gap** — An admin intervention action exists that has no effect on traffic. The disclosure prevents this from being a truth defect, but it remains a control that cannot be used during an incident.
- **Severity** — **P2.**
- **Dependency / gate** — Enforcement at the proxy adds a DB read to every matching request; that is a latency and correctness decision (fail-open vs fail-closed on lookup failure) worth deciding deliberately rather than incidentally.
- **Smallest next slice** — None now. Either enforce it in `proxy.ts` with an explicit fail-open decision, or remove the intervention buttons so no operator believes they have a lever they do not have. Do not leave it ambiguous long-term.

### 5.4 System health measures almost nothing

- **Evidence**
  - Assembly in `lib/admin/system-health/sammeln.ts` L78–108. Of five checks, exactly one performs a real external probe: Supabase, via a PostgREST read of `airports` limit 1 (`lib/admin/system-health/runtime.ts` L18–28, wired at `sammeln.ts` L87–106).
  - The other four are static declarations of non-configuration: `vercelNichtKonfiguriert()` (`bewertung.ts` L235–243), `githubNichtKonfiguriert()` (L246–254), `infomaniakNichtKonfiguriert()` (L257–265), and `bewerteApp(leseAppRuntime())` (L70–106) which only proves the current Node process answered.
  - Not measured at all: deployment health, CI state, DNS/mail, Supabase platform status, provider health.
  - Read-only by contract (`sammeln.ts` L112 `writeActions: []`), 30-second in-memory cache (L20–21, L70–76).
  - The honest framing is deliberate and documented (`docs/ADMIN_SLICE_B_SYSTEM_HEALTH_TASK.md`, `docs/ADMIN_PLATFORM_SLICE_B_STATUS.md`): no fake green.
- **State** — `PARTIAL`, honestly reported as `not_configured` rather than green.
- **V1 necessity** — **Required** to a greater degree than currently built, per release gate §G ("technische Fehler sichtbar", "Provider Health sichtbar").
- **Gap** — There is one real signal (can we reach the database) and four declarations of ignorance. In practice the board cannot tell an operator whether Jetnity is healthy.
- **Severity** — **P1**, jointly with 5.5 — they are the same underlying gap seen from two sides.
- **Dependency / gate** — Real probes need credentials (Vercel/GitHub tokens) and possibly a scheduler. Any paid tier is `AGENTS.md` §18 territory.
- **Smallest next slice** — Do not expand the board first. Close 5.5 (alerting) first, because knowing *that* something broke matters more than a dashboard nobody is watching at 03:00.

### 5.5 No error tracking, no alerting, no log aggregation

- **Evidence**
  - Independently re-verified: `package.json` contains no match for `sentry`, `analytics`, `posthog`, `plausible`, `datadog`, `axiom` or `logtail`. There is no error-reporting SDK of any kind.
  - No structured logger module in `lib/**`; observability is ad-hoc `console.error` / `console.warn` (e.g. `lib/auth/admin-guard.ts` L85–93, L218–235).
  - Provider operations events are explicitly non-persistent: `lib/provider-ops/observability.ts` L1–6 states "Keine Persistenz", and the wired sink is `providerOpsConsoleEventSink` → `console.info('provider_ops_event', …)` (L115–118).
  - No error-report API endpoint (`app/api/**` contains no error route — confirmed against the full 22-route inventory in 2.1).
  - Client errors reach nobody: `app/(public)/error.tsx` L19–21 logs to the user's own browser console.
- **State** — `MISSING`
- **V1 necessity** — **Required, and explicitly launch-gating.** `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md` §G requires visible technical errors, cost/quota alerts, visible security events, defined alert ownership and escalation, and incident detection that works under partial failure. §H requires a documented incident process with responsibility. None of that exists.
- **Gap** — A production incident is detectable only through host-side logs that nobody is alerted about, or through a user complaint sent to an unmonitored mailbox (4.1). There is no alert ownership, no escalation, and no partial-failure detection.
- **Severity** — **P0** for public launch, by the repository's own binding release gate. It is *not* P0 for continued development.
- **Dependency / gate** — Any hosted error-tracking or alerting service is a **new provider decision** and therefore `AGENTS.md` §18 / §5: Product-Owner approval required even if a free tier is used, because the free tier becomes a dependency and a data-processor relationship (which also feeds back into the privacy notice in 1.1).
- **Smallest next slice** — Ungated first step: write the incident process document — who is on point, how an outage is noticed today, what the escalation is, what the provider kill-switch procedure is. That satisfies part of §H at zero cost and makes the tooling decision concrete rather than abstract. The tooling choice itself is a separate PO-gated slice.

### 5.6 Provider cost guard is per-process, and S6A persistence is not wired

- **Evidence**
  - What enforces limits today is process-local: `providerOpsInMemoryCostGuard` is a `Map` (`lib/provider-ops/cost-guard.ts` L73–89), consumed by domain rate limits such as `lib/flights/rate-limit.ts` L15–20. On a serverless platform this means the limit resets per instance and is not shared across concurrent instances.
  - The S6A persistent design exists in the repository but is deliberately not connected: migration `supabase/migrations/20260901020000_provider_cost_guard_s6a.sql` (confirmed present) creates `jetnity_internal` tables with the gate `production_write_path_allocated = false` (L38–64); the adapter `lib/provider-ops/persistent-cost-guard.ts` exists but is **not exported** from `lib/provider-ops/index.ts` (independently re-verified — no `persistent` match in the barrel), an absence asserted by `lib/provider-ops/s6a-persistenz-vertrag.test.ts` L148–149.
  - `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S6A_CLOSED_2026-09-01.md` L67–75 states the Production tables are **absent** — i.e. "S6A closed" means the repository contract is closed, not that a guard is running.
  - The admin board reports this accurately rather than claiming a budget: `bewerteCostGuard()` (`lib/admin/provider-ops-board/bewertung.ts` L140–150) confirms the module exists and states there is no global persistent budget.
  - Mitigating context: every provider domain is hard-off in production (`lib/provider-ops/zustand.ts` L17–28; `JETNITY_FLIGHT_AKTIV` etc.), and all non-flight factories return `null`, so there is currently no paid provider traffic to guard.
- **State** — `PARTIAL` — in-memory guard real, persistent guard foundation-only.
- **V1 necessity** — Not required *today* because no provider is live. **Required as a hard precondition** before any real provider activation, which is exactly what the S6A design anticipates.
- **Gap** — No cross-instance, persistent spend limit. If a provider were activated in its current state, per-instance limits would multiply by the number of concurrent instances, with no global ceiling — a direct `AGENTS.md` §17/§18 cost-control violation.
- **Severity** — **P2 now** (no live provider), **P0 as a precondition of provider activation**.
- **Dependency / gate** — Applying the S6A migration to Production is a Production migration → **PO-GATED**. Provider activation is separately PO-gated.
- **Smallest next slice** — None now. Keep S6A as the documented precondition attached to the provider-activation gate, so activation cannot happen without it.

### 5.7 AI / model cost control

- **Evidence**
  - Real quota enforcement in the database before the model call: `modell_kontingent_beanspruchen()` inserts (`supabase/migrations/20260818040000_modellnutzung.sql` L326–328) and `modell_nutzung_abschliessen()` updates afterwards, called from `lib/modell/kontingent.ts` L137–142 and L182–192.
  - Limits are constants in the migration (L236–242): 4/hour and 8/day per identity, 24/day guest pool, 38/day global, and a daily cost ceiling of 3,000,000 micro-USD.
  - Kill switch: `JETNITY_MODELL_AKTIV` must be `true`/`1` (`lib/modell/konfiguration.ts` L175–189).
  - Admin visibility: the provider-ops board reads the last 30 days of `model_usage`, capped at 200 rows, and sums `kosten_mikro_usd` (`lib/admin/provider-ops-board/runtime.ts` L59–89; `bewertung.ts` L153–195). RLS requires `darf_betrieb_lesen()` (migration L177–178).
  - Service-role use is scoped to this RPC path (`lib/modell/kontingent.ts` L73–80).
- **State** — `BUILT` — this is the strongest cost-control implementation in the repository and satisfies `AGENTS.md` §17.
- **V1 necessity** — Satisfied.
- **Gap** — Two small ones: the admin aggregate caps at 200 rows, so a busy period is silently truncated in the *display*; and there is no alert when a ceiling is hit (part of 5.5). Retention is covered in 2.4.
- **Severity** — **P3.**
- **Dependency / gate** — None.
- **Smallest next slice** — None.

---

## Section 6 — Revenue / conversion / attribution (V1 operational truth)

### 6.1 Affiliate / booking handover

- **Evidence**
  - No outbound booking handover exists in any domain. The provider interfaces state it explicitly: `lib/flights/provider.ts` L10–11 ("bucht nicht und erzeugt keine Deeplinks"), and the same in `lib/hotels/provider.ts` L6–7, `lib/activities/provider.ts` L6–7, `lib/mobility/provider.ts` L7, `lib/rental-cars/provider.ts` L7.
  - `booking_url` is null on every path and guarded at three layers: excluded from the client schema (`lib/flights/schema.ts` L144–145), forced null on uptake (`lib/flights/uebernahme.ts` L30, L100, L125), stripped on guest import (`lib/flights/nutzlast.ts` L18–22), and nulled by the DB for untrusted writes (`supabase/migrations/20260829140000_trip_item_commercial_provenance.sql` L580, L636–702).
  - Non-flight domains have no provider at all: `lib/hotels/factory.ts` L10–11, `lib/activities/factory.ts` L10–11, `lib/mobility/factory.ts` L11–12, `lib/rental-cars/factory.ts` L11–12 all return `null`.
  - No attribution parameters anywhere: no `utm_`, `subid` or `click_id` construction in `components/**`.
- **State** — `MISSING`, and deliberately so.
- **V1 necessity** — Not required for a V1 defined as "production ready for real travellers". It *is* required for revenue, which the roadmap places later.
- **Gap** — None as a defect. The consequence to state plainly is that Jetnity currently has no revenue mechanism, so nothing downstream (attribution, conversion, commission) can be measured because nothing is happening.
- **Severity** — **P3** for V1 as defined.
- **Dependency / gate** — Provider activation and partner contracts are PO-gated; `docs/KAYAK_FLIGHT_APPLICATION_READINESS_NO_SUBMIT_2026-09-01.md` and `docs/WEGO_FLIGHT_APPLICATION_READINESS_LEGAL_HOLD_NO_SUBMIT_2026-09-01.md` record explicit no-submit / legal-hold states.
- **Smallest next slice** — None. Do not start; carry 4.6 and 5.6 as preconditions.

### 6.2 Click / conversion persistence

- **Evidence**
  - No click, conversion, attribution, commission or payout table exists in `supabase/migrations/**`.
  - The affiliate *columns* exist only inside `trip_item_commercial_provenance` (`affiliate_status`, `affiliate_partner_id`, `affiliate_click_id`, `affiliate_attribution_ref`, migration L102–105), and nothing in `app/**` or `lib/**` calls the write function `jetnity_internal.trip_item_commercial_provenance_schreiben`. The gate `production_write_path_allocated = false` (L56–73) keeps the path closed, and the projection explicitly refuses to mint a `booking_url` (L196–210).
  - `public.payouts` does not exist at all; the older summary RPC hardcodes `payouts_cents` to 0 (`supabase/migrations/20260817100400_schema_hygiene.sql` L104–105, L121–122).
- **State** — `MISSING` at runtime; the schema and domain library are `BUILT` as an unactivated foundation.
- **V1 necessity** — Not required while 6.1 is absent.
- **Gap** — None as a defect. Worth recording that the design correctly defaults attribution to unknown rather than guessing (`docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md`), which matches the release gate requirement that "`unknown` Attribution bleibt unknown".
- **Severity** — **P3.**
- **Dependency / gate** — Same as 6.1.
- **Smallest next slice** — None.

### 6.3 Payments surface reads legacy tables and lacks the honest caveat on the overview

- **Evidence**
  - No payment provider dependency exists: independently re-verified that `package.json` contains no `stripe`, `paypal` or `adyen`, and there is no webhook receiver route in `app/**`.
  - The admin payments routes read pre-existing tables: `payments` and `refunds` (`app/api/admin/payments/{summary,list,breakdown}/route.ts`), `stripe_webhooks` (`.../webhooks/route.ts`). The only write is a local ledger note: `.../refund/route.ts` L37–62 inserts into `refunds` and may update `payments.status`.
  - Nothing in the application inserts into `payments`. `DECISIONS.md` ADR-0010 keeps these tables without expanding them, and `docs/LEGACY_ENTFERNUNG.md` L67 records a handful of legacy/test rows.
  - The payments *page* is honest: `lib/admin/ehrliche-zustaende.ts` L9–15 states there is no provider-backed money movement and that a refund "schreibt nur in die lokale Tabelle refunds", and the success message says "Keine Provider-Erstattung".
  - **The admin overview strip is not equally honest.** `components/admin/home/AdminStatsStrip.tsx` renders `Gesamtumsatz (30T)`, `Bestellungen (30T)`, `Refunds (30T)`, `Payouts (30T)` from the same tables, and computes `Bestellungen je Reise: X%` as `orders / reisen30d` (L67, L96–98). Its only caveat is `kennzahlenHinweis` = "Lokale Kennzahlen aus vorhandenen Aggregaten. Keine Provider-Health." — which warns about provider health, **not** about the absence of real money movement.
- **State** — `PARTIAL`: real reads over tables that no live system populates.
- **V1 necessity** — The payments surface is not needed for V1. What *is* needed is that no admin surface presents a revenue figure that has no revenue behind it.
- **Gap** — An admin reading the overview sees a CHF "Gesamtumsatz" and a "Bestellungen je Reise" conversion percentage derived from legacy residue rows, without the caveat that the payments page itself carries. If any legacy row falls inside the rolling 30-day window, this renders as revenue and as a conversion rate. `payouts_cents` is additionally hardcoded to 0 against a table that does not exist, and is displayed as a CHF value.
- **Severity** — **P2.** Admin-internal, no user impact, but it is exactly the "erfundene Revenue-/Conversion-Dashboards" that the release gate §I forbids.
- **Dependency / gate** — None. Copy and/or suppression only.
- **Smallest next slice** — Extend the overview strip's caveat to state that no payment provider is connected, or suppress the monetary tiles and the conversion ratio until a provider exists. No schema change, no new dependency.

### 6.4 Conversion funnel / product measurement

- **Evidence**
  - No third-party analytics (confirmed independently in 1.3) and no self-hosted product-event table. `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md` L161 records the absence of versioned product/marketing/revenue events.
  - What does exist is admin aggregate SQL over real data: `admin_reisen_kennzahlen()` (`supabase/migrations/20260817120100_reise_anlegen.sql` L251–267) and `admin_reisen_zeitreihe()` (L274+), surfaced by `components/admin/home/AdminStatsStrip.tsx` L33 and `components/admin/home/AdminTimeSeries.tsx` L9, L31, both requiring `betrieb-lesen`.
  - Consequence: "how many trips were created in the last 30 days" and "how many accounts have a trip" are answerable. "How many visitors started planning and did not finish", "what fraction of signups create a trip", "where do users drop out" are not answerable by anything.
  - `app/(admin)/admin/analytics/page.tsx` is a labelled placeholder (5.1).
- **State** — `PARTIAL` — outcome counts exist, funnel does not.
- **V1 necessity** — Required in minimal form. The release gate §I requires that activation of the core journey be measurable. Beyond compliance, the product mandate is explicitly that retention must come from real usefulness — which cannot be evaluated without knowing whether people finish planning a trip.
- **Gap** — No measurement of the core journey's steps. There is also no consent or privacy mechanism (1.2) that a future event pipeline could hang from, so the two are coupled.
- **Severity** — **P2.** Not user-facing, not launch-blocking for safety, but it means V1 cannot be evaluated after launch.
- **Dependency / gate** — Any third-party analytics is a Product-Owner decision with cost and privacy consequences and would activate the consent obligation in 1.2. A first-party event table avoids the vendor question but is a new persistent data class and therefore needs a retention decision (2.4) and a privacy-notice entry (1.1).
- **Smallest next slice** — None before 1.1 and 2.4. When taken: prefer a minimal first-party, non-identifying event count for the core journey over a vendor SDK, so consent and retention stay simple.

---

## Section 7 — Cross-cutting findings

### 7.1 The dominant pattern: honest partial systems, one dishonest claim

Across all six domains the repository behaves consistently and unusually well on one axis: it distinguishes "we do not know" from "there is nothing". `lib/api/datenbank-lesen.ts` and `lib/admin/ladezustand.ts` implement it structurally; `components/admin/home/AdminStatsStrip.tsx` L62–65 refuses to coerce a denied capability into zero; `lib/auth/account-session-view.ts` L12 types other sessions as `unsupported` rather than "0"; `lib/admin/ehrliche-zustaende.ts` L19–24 labels the IP blocklist unenforced in its own success messages; system health reports `not_configured` rather than green.

Against that background, **1.4 is an outlier and should be treated as the single most inconsistent thing in the audited domain**: `components/auth/RegisterForm.tsx` L386 and `components/auth/LoginForm.tsx` L288 assert "DSGVO & CH-DSG konform" to users while the product has no privacy notice, no consent record, no data export and no account deletion. Everywhere else the codebase refuses to overstate; here it overstates to users, in the signup flow, on a regulatory matter. It was already identified on 29 August 2026 (`docs/AP6A_GATE0_LEGAL_FOUNDATION_STATUS_2026-08-29.md` §3.2) and is still live at this audit head.

### 7.2 A cluster of P0 items is blocked on one Product-Owner input

1.1 (legal pages), 1.5 (acceptance capture) and parts of 2.4 (retention statement) are all waiting on Product-Owner/legal *content*, not on engineering. 3.8 (email provider) and 5.5 (error-tracking vendor) are waiting on Product-Owner *provider decisions*, likewise not on engineering. The AP-6a contract deliberately forbids agent-generated legal text (`lib/legal/ap6a-gate0-vertrag.ts` L31), and the PrivacyBee decision authorises no activation (`docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md` L111). This means a substantial share of the V1 blocking set cannot be closed by any coding agent under current governance. That is worth surfacing explicitly as a programme fact rather than leaving it implicit in individual rows.

### 7.3 Two P0/P1 items are free, ungated and currently unclaimed

Contrasting with 7.2: 1.4 (remove the unproven conformity claim), 3.4's operational half (write the admin MFA-loss runbook), 4.1's process half (define the support process), 5.5's process half (write the incident process), and 6.3 (extend one caveat) all require no Product-Owner gate, no migration, no dependency and no cost. Together they close one P0, mitigate one operational P0 and close two P1s. This is the highest-value, lowest-risk remediation cluster in the matrix.

### 7.4 Repository evidence conflicts identified

Per the binding task's requirement to identify stale or conflicting repository evidence:

1. **Production admin AAL2 state — direct contradiction.** `docs/AUTH.md` L116–117 states Production lacks `aktuelles_admin_aal2()`; `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_STATUS_2026-08-27.md` L23–27 states the Production migration was applied and verified. Both cannot be current. Compounding factor: `supabase/config.toml` L118–121 and `scripts/auth/anwenden.ts` L20–22 confirm auth tooling manages the Development branch only, so no automated mechanism keeps either statement true. **Resolution requires a credentialed Production read and correction of one document.** (Recorded in 3.3.)
2. **`docs/ADR_0201_ACCOUNT_TRAVELLER_REGISTRY_PERSISTENCE.md` L42 — stale.** It states there is no user UI for the traveller registry. Runtime now has `/account/travellers` (`app/account/travellers/page.tsx`) plus registry CRUD (`lib/traveller/account-registry-aktionen.ts`) and registry→trip materialisation (`lib/traveller/account-registry-trip.ts`). The ADR was accurate for slice S2 and has been overtaken by S3/S4.
3. **`docs/AP7_S2_ACCOUNT_TRAVELLER_REGISTRY_PERSISTENCE_STATUS_2026-08-29.md` L29 — accurate-but-misleading.** "No UI/runtime" is true of the S2 slice only; read as current product state it is wrong for the same reason as (2).
4. **"S6A CLOSED" wording — correct but easy to misread.** `docs/CHATGPT_TECHNICAL_LEAD_PROVIDER_READINESS_S6A_CLOSED_2026-09-01.md` means the repository contract is closed; L67–75 correctly states the Production tables are absent and the adapter is unwired. No correction needed; noted because "closed" adjacent to "cost guard" invites the assumption that spend is guarded. (Recorded in 5.6.)
5. **`components/layout/CookieConsent.tsx` L35–36 — stale runtime artefact.** Claims Views/Likes measurement that does not exist anywhere in the product. Unmounted, so no user sees it, but it is untrue text carried in the tree with a recorded dead-code exception. (Recorded in 1.2.)

No document was found that claims data export, account deletion, live payments, live affiliate attribution or an operational persistent cost guard is implemented. On those points the documentation is honest and matches the code.

### 7.5 Product-Owner-gated items identified

Per the binding task, the following gaps cannot be implemented by an agent and are classified `PO-GATED`:

| Gap | Reason for gate |
|---|---|
| 1.1 legal page content | Legal text must not be agent-generated; vendor decision authorises no activation |
| 1.5 acceptance persistence | Requires migration; Production migration is gated |
| 2.2 account deletion | Destructive, reversal-hard identity deletion; requires service-role path |
| 2.4 retention enforcement | Retention periods are a product/legal decision; enforcement is a Production migration |
| 2.7 any expansion of traveller data | Sensitive document/MRZ/biometric storage is explicitly gated |
| 3.4 second factor / backup codes | Fundamental MFA/AAL contract change |
| 5.5 error-tracking/alerting vendor | New external provider, new data-processor relationship, potential recurring cost |
| 5.6 S6A Production apply | Production migration; precondition of provider activation |
| 6.1 / 6.2 provider + affiliate activation | Provider contracts, secrets, paid calls, live activation |
| 6.4 analytics vendor | New provider, cost, and triggers the consent obligation |

### 7.6 What is genuinely strong

Recording this because an audit that lists only gaps misrepresents the state. The following are built, verified against live code, and should not be re-litigated by a later slice: traveller data minimisation enforced in both schema and runtime (2.7); ownership and RLS across the whole trip and traveller graph (2.6); guest→account migration with real idempotency and conservative partial-failure handling (2.5); the TOTP MFA lifecycle and admin AAL2 enforcement in both application and data plane (3.2, 3.3); scoped logout with honest limits (3.5); the fail-closed public indexing boundary (1.6); database-enforced AI quota with a kill switch (5.7); zero third-party tracking (1.3); and the empty-vs-error discipline throughout (4.4).

---

## Consolidated V1 blocking set

**P0 — must be closed before public launch with real travellers**

| # | Gap | Gated? |
|---|---|---|
| 3.8 | No production email sender; project-wide limit of 2 emails/hour breaks registration and password recovery | PO (provider + secret) |
| 1.4 | Unproven "DSGVO & CH-DSG konform" claim shown to users at signup and login | **No — free** |
| 1.1 | No `/privacy`, no `/terms`, no imprint; signup links to 404s | PO (legal content) |
| 2.1 | No data export / access path | Scope decision |
| 2.2 | No account deletion | **PO (destructive)** |
| 3.4 | Admin MFA-loss lockout with no recovery path (operational P0) | Runbook is free |
| 5.5 | No error tracking, no alerting, no incident process (release gate §G/§H) | Process free; tooling PO |

**P1 — blocks a trustworthy V1**

| # | Gap |
|---|---|
| 1.5 | Terms acceptance not persisted, not server-enforced, OAuth path bypasses it |
| 2.4 | No enforced retention for any data class |
| 3.3 | Production admin AAL2 state unknown; two repository documents contradict each other |
| 3.4 | Consumer MFA recovery absent |
| 4.1 | No defined support process behind the single contact address |
| 4.2 | No error boundary covering `/account/*` |
| 5.2 | Nothing writes `security_events`; the admin security page reads a table with no writers |
| 5.4 | System health measures one real signal out of five checks |

**P2 / P3** — as recorded per row in Sections 1–6.

---

## Audit boundaries and what this audit did not verify

Stated explicitly so no later reader over-reads this document:

1. **No live Production verification.** No Supabase credentials, no Management API read, no deployment inspection. Every statement about Production is either marked unknown (3.3, 3.6, 3.7) or derived from repository declarations.
2. **No test suite, typecheck, lint or build was run.** This slice changes no runtime code; the binding task forbids unnecessary suite runs for a docs-only audit. Consequently no claim in this document rests on a test result produced by this audit. Where a test file is cited, it is cited as *source evidence of an encoded expectation*, not as a passing result observed here.
3. **RLS is verified as declared, not as live.** `db:rls`, `db:rechte`, `db:sicherheit` exist and were not executed (2.6).
4. **Not audited:** trip planning core, flight multi-leg orchestration, world map, destination essentials, assistant runtime (#435) and explicit visit history (#448) — out of scope by the binding task.
5. **Line numbers are as at the audit head** recorded in the status document. They may drift with later commits; the cited symbol names are the durable anchor.
