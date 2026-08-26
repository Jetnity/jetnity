# Jetnity – D0 live metadata boundary – Status

Stand: 26. August 2026  
Agent: `Jetnity growth discoverability`  
Branch: `fix/d0-live-index-metadata-boundary-2026-08-26`  
Status: **IMPLEMENTIERT / Gates und Preview-Evidence folgen in diesem Slice**

Kein Ready. Kein Merge. Kein D1/G1. Keine Domainaktivierung.  
`docs/ACTIVE_WORK_STATUS.md` und Draft-PR #85 wurden nicht geändert.

## 1. Finding

**P1-D0-LIVE-01** – Noncanonical Vercel Production Alias widerspricht der D0-2 Metadata Boundary.

Live auf `https://jetnity-app.vercel.app` vor diesem Fix:

- HTML `robots = index, follow`
- Canonical/OpenGraph auf den Vercel-Alias
- `/robots.txt` = deny-all (`Disallow: /`)
- `/sitemap.xml` = leeres urlset

## 2. Root Cause

`app/layout.tsx` und `app/(public)/layout.tsx` riefen `oeffentlicherOrigin()` auf, verwendeten aber nur `origin` und ignorierten `darfIndexieren`. Anschliessend wurde `robots` hart auf `index: true` / `follow: true` gesetzt, im Root-Layout inklusive GoogleBot.

`kanonischeUrl()` nutzte die technische Origin. Auf Production gewinnt deshalb der Vercel-Alias als Canonical/OG/`metadataBase`.

## 3. Fix

Neuer minimaler Helper `lib/seo/oeffentliche-metadata.ts`:

- `htmlRobots()` folgt `darfIndexieren`
- `oeffentlicheMetadataOrigin()` ist immer `https://jetnity.com`
- `kanonischeUrl()` emittiert niemals `*.vercel.app`

Verdrahtet in Root-Layout, Public-Layout, Homepage-JSON-LD.  
Private noindex-Grenzen (`/reisen`, Account, Auth, parametrisiertes `/planen`) unverändert.

## 4. Nicht geändert

Keine Domain, kein DNS, kein Redirect, keine Vercel-Environment-Änderung, kein `NEXT_PUBLIC_ALLOW_INDEXING=true`, keine Dependencies, keine Guest/Account/Traveller/Provider/Admin/AAL2/Payments/Supabase/Trip-Workspace-Runtime.
