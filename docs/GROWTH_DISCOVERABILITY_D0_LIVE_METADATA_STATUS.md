# Jetnity – D0 live metadata boundary – Status

Stand: 26. August 2026  
Agent: `Jetnity growth discoverability`  
Branch: `fix/d0-live-index-metadata-boundary-2026-08-26`  
PR: https://github.com/Jetnity/jetnity/pull/86  
Exact Head: `0f809857d4651543e97c3644d4aa0d30a625a262`  
Merge-Commit / `main`: `38ec8be79a6ce7758be81fd5d564819d638140d6`  
Status: **INTEGRATED on `main` via PR #86. HISTORICAL REVIEW-EVIDENCE darunter. P1-D0-LIVE-01 geschlossen. Kein D1/G1. Kein Domain-Cutover. Kein Public Indexing.**

> Die folgenden Abschnitte beschreiben den Review-Stand vor und während des Drafts. Sie dürfen den aktuellen Handoff nicht überschreiben. Kanonisch: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.

Kein D1/G1. Keine Domainaktivierung. Kein Redirect. `NEXT_PUBLIC_ALLOW_INDEXING` bleibt deny/default false.

## 1. Finding

**P1-D0-LIVE-01** – Noncanonical Vercel Production Alias widerspricht der D0-2 Metadata Boundary.

Live auf `https://jetnity-app.vercel.app` **vor Merge** (weiterhin der Production-Stand von `main`):

- HTML `robots = index, follow`
- Canonical `https://jetnity-app.vercel.app`
- `/robots.txt` = deny-all (`User-Agent: *` / `Disallow: /`)
- `/sitemap.xml` = leeres urlset

## 2. Root Cause

1. `app/layout.tsx` und `app/(public)/layout.tsx` riefen `oeffentlicherOrigin()` auf, verwendeten aber nur `origin` und ignorierten `darfIndexieren`. `robots` war hart `index: true` / `follow: true`, im Root-Layout inklusive GoogleBot.
2. `kanonischeUrl()` nutzte die technische Origin. Auf Production wird daraus der Vercel-Alias.
3. `/planen` `generateMetadata` liess `robots` weg. Next.js setzt dann wieder `index, follow` und überschreibt die Layout-Grenze.

## 3. Fix

Minimaler Helper `lib/seo/oeffentliche-metadata.ts`:

- `htmlRobots()` folgt `darfIndexieren`
- `oeffentlicheMetadataOrigin()` ist immer `https://jetnity.com`
- `kanonischeUrl()` emittiert niemals `*.vercel.app`

Verdrahtet in Root-Layout, Public-Layout, Homepage-JSON-LD und `/planen`.  
Private noindex-Grenzen (`/reisen`, Account, Auth, parametrisiertes `/planen`) unverändert.

## 4. Diff-Dateien

- `lib/seo/oeffentliche-metadata.ts`
- `lib/seo/oeffentliche-metadata.test.ts`
- `lib/seo/oeffentlicher-origin.ts`
- `lib/seo/oeffentlicher-origin.test.ts`
- `lib/seo/index-grenze.test.ts`
- `app/layout.tsx`
- `app/(public)/layout.tsx`
- `app/(public)/page.tsx`
- `app/(public)/planen/page.tsx`
- `docs/GROWTH_DISCOVERABILITY_D0_LIVE_METADATA_STATUS.md`
- `DECISIONS.md` (ADR-0170)

Keine Guest/Account/Traveller/Provider/Admin/AAL2/Payments/Supabase/Trip-Workspace-Runtime.  
Keine Dependencies. Keine Env-Aktivierung.

## 5. Tests und Gates

Lokale Gates auf Implementation-HEAD `9d808816`:

| Command | Ergebnis |
|---|---|
| gezielte D0-1/D0-2/D0-live Tests | **pass** |
| `npm test` | **2196/2196** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass**, keine Warnings |
| `npm run build` | **pass** |
| `check:setup` / `dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` | **pass** (Setup: 1 Warning, keine `.env`) |

Adversarial Regressionen 1–12 für den Metadata-Layer sind in `lib/seo/oeffentliche-metadata.test.ts`.

## 6. Gerenderte Metadata

Vercel Preview für Exact Head `9d808816` ist **SUCCESS**:

- Dashboard: `https://vercel.com/jetnity-e1b93c82/jetnity-app/Fs2hv97GiuSRGTYZhWceD7dUdf7o`
- Deployment: `https://jetnity-3nmk39b3c-jetnity-e1b93c82.vercel.app`

Preview-HTML ist anonym SSO-geschützt (302 nach `vercel.com/sso-api`). Deshalb wurde derselbe Production-Build lokal über `next start :3012` gerendert.

Nachgewiesen:

| Fläche | robots | googlebot | Canonical | vercel.app |
|---|---|---|---|---|
| `/` | `noindex, nofollow` | `noindex, nofollow` | `https://jetnity.com` | nein |
| `/planen` | `noindex, nofollow` | `noindex, nofollow` | `https://jetnity.com/planen` | nein |
| `/planen?idee=Bali` | `noindex, nofollow` | – (D0-1 `NICHT_INDEXIEREN`) | `https://jetnity.com/planen` | nein |
| `/robots.txt` | deny-all | – | – | – |
| `/sitemap.xml` | leeres urlset | – | – | – |

`NEXT_PUBLIC_ALLOW_INDEXING` wurde nicht aktiviert.

## 7. GitHub Actions

Zum Zeitpunkt dieses Berichts existiert **kein** Actions-Run für Exact Head `9d808816`.  
Letzter sichtbarer CI-Run auf dem Repo bleibt älter (`99cb5c6e`, PR-fremd).  
Das ist ein offenes Gate für den Technical-Lead-Review, kein stiller PASS.

Vercel Preview für denselben SHA ist SUCCESS.

## 8. Findings

| ID | Severity | Status |
|---|---|---|
| P1-D0-LIVE-01 | P1 | **geschlossen durch Merge von PR #86.** Live auf Production-Alias danach: HTML `noindex, nofollow`, Canonical `https://jetnity.com`. |
| P2-D0-LIVE-CI | P2 | GitHub Actions Exact-Head-Run fehlt bisher. |
| P2-D0-LIVE-SSO | P2 | Vercel Preview ist SSO-geschützt; HTML-Beweis über Production-Build, nicht über anonymes Preview-HTML. |
| P3 | – | Keine.

## 9. Offene Risiken

- Historisch: Production blieb indexierbar, **bis** PR #86 gemergt war. Das gilt nach Merge nicht mehr als Current.
- Preview-HTML kann SSO-geschützt sein; der öffentliche Alias `https://jetnity-app.vercel.app` ist anonym prüfbar.
- Kein Domain-Cutover, kein DNS, kein Redirect, kein Indexing-Launch. Kein D1/G1 aus diesem Slice ableiten.

## 10. STOPP

Slice integriert. Kein D1. Kein G1. Keine Domainaktivierung. Kein Folgeslice durch diesen Status.
