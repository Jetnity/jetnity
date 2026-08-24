# Jetnity – New Chat Checkpoint

Stand: 24. August 2026
Status: verbindlicher operativer Übergabepunkt für den nächsten Haupt-Chat

## Sofort lesen

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
- `docs/MULTI_AGENT_WORKSTREAMS.md`
- `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`
- `docs/PR38_PRODUCTION_INTEGRATION.md`
- Reviews/Handoffs der aktuell offenen PRs

Danach tatsächlichen GitHub-/CI-/Vercel-/Supabase-Stand unabhängig verifizieren. Kein künftiger Mark Ready / Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.

## PR #38 – vollständig abgeschlossen

- Travel Timing & Seasonal Intelligence – provider-neutrale Foundation
- R17: **PASS / Technical Closure**
- final geprüfter Runtime-Head: `5782401943b41ddd1eea1337c93cb37163210362`
- finaler PR-Head vor Merge: `1a61d21fe853c77faa1109ae0828e39f3629098a`
- Squash-Merge auf `main`: `ee988bbe46a8dd63d4001c42825fc0159453f811`
- Main-CI Run `32681199019`: **SUCCESS** auf exakt `ee988bbe...`
- Vercel Production nach Merge: READY
- Supabase Production: ACTIVE_HEALTHY
- Production-Migrationen angewendet und History auf Repository-Versionen ausgerichtet:
  - `20260824120000_flug_route_itinerary_surface_evidence`
  - `20260824140000_flug_route_itinerary_untrusted_surface`
- Live Production-Probe verwirft manipuliertes Client-`surfaceFromAirportCode`.
- Function: SECURITY INVOKER; anon kein EXECUTE; authenticated EXECUTE.
- Kein Live-Seasonal-Provider, keine neuen Secrets, keine neuen laufenden Providerkosten.

## Aktueller main

Nach der Integration wurden reine Continuity-Docs auf `main` aktualisiert. `docs/ACTIVE_WORK_STATUS.md` ist die aktuelle operative Wahrheit.

Vercel Production ist READY auf dem aktuellen Main-Docs-Head `f999f21532706d394bbce221eebcc4c6058a57ec`; der Runtime-Inhalt stammt aus dem PR-#38-Squash `ee988bbe...`.

## Account

- Cursor-Anzeigename: `Account plattform audit vorbereitung`
- Draft-PR #39 / `audit/account-platform`
- Audit: **AUDIT-PASS**
- technische Sperre durch PR #38 ist aufgehoben
- nächster Slice: **AP-1 Account-Shell + persönliche Übersicht / Meine Reisen als Account-Hub**
- Shared Auth/RLS/DB/Traveller/Billing/Route-Verträge nicht parallel verändern

## Admin

- Cursor-Anzeigename: `Admin platform audit`
- Draft-PR #40 / `audit/admin-platform`
- Audit: **AUDIT-PASS**
- technische Sperre durch PR #38 ist aufgehoben
- nächster Slice: **Admin Slice A – ehrliche professionelle Control-Center-IA**
- danach separater read-only System-Health-Slice

## Parallelität

Account AP-1 und Admin Slice A dürfen parallel arbeiten. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller/Route/Readiness/Safety/Seasonal-Contracts bleiben seriell unter Technical-Lead-Ownership.

## Homepage

Die neue Startseiten-Richtung ist in `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md` gespeichert und bleibt pausiert. Zuerst separate visuelle Preview; keine Header-/Footer-Funktionsänderung; keine neue Funktionslogik; bestehende Homepage erst nach Product-Owner-Freigabe ersetzen.

## Governance

- kein Mark Ready / Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe
- Production-Migrationen separate Gates
- Provider/Secrets/Kosten separate Gates
- GitHub bleibt dauerhaftes Teamgedächtnis