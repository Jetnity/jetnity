# Account/Admin Translations 2 – Task

Date: 2026-11-15
Status: TL APPROVED for the bounded Development implementation after this immutable Task commit and Root start signal. The user has already authorized this work; no additional user approval is requested.
Implementer: `/root/translations_2` (generation 2).
Technical Lead / integration owner: `/root`.

## Goal and current evidence

Extend the existing saved DE/EN account preference to two already functional read-only surfaces: Admin travel analytics (`/admin/analytics`) and the customer's explicitly confirmed bookings (`/account/bookings`). Translate their presentation, loading text, filters, status explanations, and accessibility labels without changing what the records mean or who may read them.

The live descriptions and latest comments on #1205 and #1207 were read on 2026-11-15. Both remain unmerged drafts with green CI. The latest comments are Vercel bot deployment comments, not additional human scope changes. The completed settings/Marketing behavior is a dependency, not a new review target.

- Base dependency: #1207, `feat/admin-marketing-links-20261115`, exact head `bf93a20efd486712a8fb38b123a01cb20f11cac9`.
- #1205 dependency: `304900d4e4d9587bcbed075409e730227fe7cecf`.
- #1205 latest comment: <https://github.com/Jetnity/jetnity/pull/1205#issuecomment-6893792748> (2026-11-15 12:31:47 UTC).
- #1207 latest comment: <https://github.com/Jetnity/jetnity/pull/1207#issuecomment-6894760129> (2026-11-15 13:26:18 UTC).
- Live operating-mode value: `NORMAL`. Older HOLD narrative is historical; no gate bypass is authorized.
- Current union of #1196, #1197, #1198 changed filenames contains 513 paths. Every proposed existing path below is outside that union. Recheck the union immediately before implementation publication; a newly overlapping path is a stop at that ownership boundary.
- #1197 is unmerged (observed head `d48197f84e992c3b3615c1ed5360bd22c1dfd43b`). #1202 remains held. Neither is a dependency to modify for this slice.

Existing #1207 contains #1199, #1200, and #1205; the other Admin package branches must not be silently pulled in or overwritten. Analytics is chosen over ProviderOps/Payments to avoid starting translation work on older versions of those independently completed packages.

## Owner authorization and release boundary

The user authorizes autonomous Dev work and asks for useful translations during manual Dev login. This is sufficient scope authorization; do not ask the user again. The user retains Production, merges, paid resources, logins/2FA, and real-money refunds. This slice adds no DB or Auth writes, permissions, provider activation, production rollout, payment operations, paid services, or outbound messages/campaign delivery.

No Ready or Merge action. No automatic next slice after handoff. Root publishes the final Draft PR and the approval list after real Dev acceptance.

## Multi-Agent Suitability

Decision: `MULTI_AGENT` at the workstream level, with one implementer for this tightly coupled translation slice.

- `/root/translations_2` owns only the files explicitly listed below, on an isolated worktree and branch derived from the verified #1207 head.
- `/root` owns the shared language-catalog integration, authenticated Dev acceptance, CI publication, and final integration decisions.
- CMS and campaign agents keep their own disjoint product files. No edits to CMS editor, Marketing components, or shared Admin/Account shells by this agent.
- No additional agent is required to split the two small presentation adapters; that would create unnecessary coordination around common copy and language propagation. Root may delegate an independent bounded proof if a slot is available.
- Optional language props in the existing refresh/error components are additive and keep every existing caller's German behavior. Root reserves their ownership to this slice before implementation.
- Proposed branch: `feat/account-admin-translations-2-20261115`. Proposed worktree: `/workspace/scratch/8d4f63afa634/jetnity-translations-2`. Root's worktree is read-only for this agent.
- Integration order: existing #1199 / #1200 foundations, then #1205, then #1207, then this additive translation package. Existing #1201/#1203/#1204 order remains the user's stated Admin sequence and is not changed by this Task. Root resolves the final PR topology; no dependency merge is executed by the implementer.

## Exact file ownership

Existing files owned by `/root/translations_2` after Root's signal:

1. `app/(admin)/admin/analytics/page.tsx`
2. `components/admin/analytics/TravelAnalytics.tsx`
3. `components/admin/AdminSnapshotRefresh.tsx`
4. `components/admin/Ladezustand.tsx`
5. `app/account/bookings/page.tsx`
6. `app/account/bookings/loading.tsx`
7. `components/account/AccountBuchungen.tsx`
8. `components/account/BuchungenFilter.tsx`

New files owned by `/root/translations_2`:

9. `lib/localization/analytics-texte.ts`
10. `lib/localization/buchungen-texte.ts`
11. `lib/localization/admin-lese-texte.ts`
12. `lib/localization/konto-anzeigesprache.ts`
13. `lib/localization/account-admin-display-2/browser.test.ts`
14. `scripts/account-admin-display-2/harness.tsx`
15. `docs/ACCOUNT_ADMIN_TRANSLATIONS_2_HANDOFF_2026-11-15.md`
16. `docs/evidence/account-admin-translations-2/` (only meaningful proof output, no secrets or unnecessary generated bundles).

Root owns publication of this immutable Task at `docs/ACCOUNT_ADMIN_TRANSLATIONS_2_TASK_2026-11-15.md`, plus the only shared integration writes:

- `lib/localization/admin-sprachkatalog.ts`
- `lib/localization/einstellungen-texte.ts`

The implementer supplies an exact additive catalog proposal in the Handoff; it does not edit those files while CMS/campaign work runs. Root changes them once after collecting all applicable entries. No static gate, package manifest, dependency, test selector, Supabase type generator, shared architecture/roadmap/status document, route shell, or unrelated file may be changed to make the implementation pass.

## Implementation contract

### Language source

Use the existing `uiEinstellungenFuerSeite()` reader. The persisted `jetnity_ui_locale_v1` is a display preference only; it never authorizes a read or write. Preserve Admin `requireAdminPage({ surface: 'analytics', capability: 'betrieb-lesen' })` before privileged analytics reads, the Account shell/proxy, and all current Supabase factories and environment checks.

A small server-only `kontoAnzeigesprache()` adapter returns the existing ready DE/EN value, otherwise the existing German display fallback. It uses React's request-scoped `cache` solely to reuse that preference between a route page, `generateMetadata`, and the loading Server Component. No module-global user map, persistent cache, new cookie, browser storage, automatic setting save, service-role credential, or authority inference. Do not swallow unexpected thrown errors or reinterpret a failed business read as empty.

Before implementation, read the installed Next 16.4.1 documentation where available; the official Next loading/metadata and React cache documentation supports the planned Server Component/request-scoped approach. Keep the Account loading surface localized; do not describe the route as translated while leaving its fallback silently German. Metadata retains `robots: { index: false, follow: false }`.

### Admin analytics

- Add a DE-default `sprache` prop to the analytics surface and pass the existing account preference from the route.
- Translate all built-in headings, metric labels, range links, invalid-range explanation, table/chart labels, source/limits explanations, availability/empty messages, and ARIA text.
- Preserve `7/30/90` range selection and URLs, the same two RPCs, limits, report parser, and independent source-read states.
- Keep the distinction between confirmed zero, unavailable source, and actual error. No registered-account totals, visitor/conversion rates, bookings or revenue may be invented from stored-trip counts.
- Snapshot wording supports DE/EN via an optional presentation prop. Keep the same observed timestamp, fixed `Europe/Zurich` timezone, explicit Zurich label, and user-triggered full reload. No polling or new refresh authority.
- Error-surface built-in framing supports DE/EN via an optional presentation prop. Preserve exact `fehler.meldung`, alert semantics, retryability, stale status, and button behavior. Original backend diagnostics are intentionally not rewritten or hidden; catalog coverage states this boundary.
- Count/date labels may be formatted for DE/EN only when they preserve the exact stored value and stated timezone. A SQL calendar date must not be parsed into an inferred UTC/local timestamp.

### Account confirmed bookings

- Reuse the current `BUCHUNGEN_COPY` as the authoritative German dictionary. Add a typed English dictionary with the identical key set; do not duplicate or rewrite the domain model.
- Translate page/loading text, metadata, filter labels/options, cards' built-in labels, original/status/error explanations, and continuation controls. User-entered titles and original diagnostics remain untouched.
- Preserve both current and legacy `AccountBuchungen` prop support, with DE as the default for existing callers.
- Translate only displayed enum labels. Query names/values (`titel`, `art`, `archiv`), allowed kinds, archive filters, cursor handling, URL order, explicit IDs, and all current limits remain identical.
- A booking means the user explicitly marked a plan item as booked; it is never represented as external supplier confirmation. Keep invalid, error, empty account, no filter matches, empty continuation, and valid results distinguishable in both languages.
- Do not modify booking selection/parsing/read contracts, trip helpers, persisted data, prices, currency formatting, provider status, or source truth.

### Catalog

Export actual stable keys and DE/EN values for Root's additive integration. The catalog must list only implemented surfaces. State the exact remaining boundaries: shared navigation/security/travel/entry surfaces and unmodified original backend diagnostics. No universal coverage percentage or claim that all Admin/Account areas are translated.

## Non-scope and protected paths

Do not change #1196–#1198, Entry database/migrations/types, Supabase configuration, official-source facts, entry display, #1202, login/2FA, Auth redirects, routing/proxy, role/capability/RLS policy, DB grants or RPC definitions, refunds, CMS, Marketing campaign storage/delivery, shared shells/navigation, or Production.

In particular, do not edit `app/account/layout.tsx`, `app/account/page.tsx`, `components/account/AccountReisendeKarte.tsx`, `lib/account/ui-einstellungen-1/server.ts`, `lib/account/buchungen*.ts`, `lib/trips/*`, `lib/admin/analytics/report.ts`, or `lib/admin/ladezustand.ts`. Reading those contracts is allowed. Unknown travel facts remain unavailable; this slice introduces no travel fact.

## Acceptance and bounded verification

1. DE and EN are driven by the saved own-account preference on both selected routes, including Account loading/title, without additional writes or permission changes.
2. Existing German caller behavior stays compatible. Actual data counts, booking paths, query values, range URLs, status distinctions, and original errors are preserved.
3. Real components render both languages with keyboard access and no hidden/overflowing controls at 320px and desktop, including a 200% text case. Proof fixtures are labeled as fixtures and are not claimed as authenticated database evidence.
4. Meaningful focused browser assertions cover EN text with identical data/links, unavailable/error/zero separation, booking no-match versus empty-continuation semantics, and retained 503/500 retry behavior where applicable. Do not add tests that merely repeat dictionary literals or rerun old completed packages as a separate review exercise.
5. Root performs one consolidated required CI run on the final candidate (TypeScript, lint, existing static gates, build and relevant suite). Collect all failures before one grouped correction. No repeated green proof/review cycle for unchanged packages.
6. Root's separately authorized authenticated Dev session proves actual route access and saved language behavior once. Local fixture proof cannot be called signed-in Dev acceptance.
7. Handoff records exact files, dependencies, proof commands/outcomes, residual untranslated surfaces, and the GitHub candidate state. Stop at Root integration; no merge or Production action.

## Implementation start condition

Root versions this Task on the assigned branch and sends the immutable Task commit/ref plus exclusive file ownership and worktree instructions. Until then, this agent performs only read-only planning and makes no product change or remote write.

## Official framework references

- <https://react.dev/reference/react/cache> — Server Component cache is invalidated per server request.
- <https://nextjs.org/docs/app/api-reference/file-conventions/loading> — loading files are Server Components by default.
- <https://nextjs.org/docs/app/api-reference/functions/generate-metadata> — dynamic metadata is declared with `generateMetadata`.

These references justify the limited presentation adapter; they do not authorize a framework upgrade or an expanded cache/security contract.

## Root publication decisions — 15 November 2026

Root reviewed this concrete Task once before implementation and authorizes only its stated paths on the exact green #1207 base. The shared catalog and coverage copy remain Root-owned; no author edits another workstream. Before each final source publication, compare current #1196–#1198 changed paths. No data, policy, scanner, workflow or permission boundary is weakened to obtain green CI. Runtime blocks stay explicit.

For new mounted browser fixtures, use the already established actual-component setup: replace all required Next build constants and install any tsx name-preservation helper before serialized init callbacks in a single ordered script, including reload. Keep network/storage guards and assertions active. Do not repeat the previously diagnosed bootstrap mistake or re-review old green packages. Collect all actual failures before one grouped correction.

Code authors stop at the owned handoff; Root publishes final source/Draft PRs and performs one bounded independent review plus the required green CI and relevant real execution. User login is never simulated, copied or bypassed. No Production or genuine refund action.
