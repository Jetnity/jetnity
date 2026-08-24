# Jetnity – New Chat Checkpoint

Stand: 24. August 2026
Status: verbindlicher operativer Übergabepunkt für den nächsten Haupt-Chat

## Sofort lesen

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
- `docs/MULTI_AGENT_WORKSTREAMS.md`
- `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`
- Reviews/Handoffs der aktuell offenen PRs

Danach tatsächlichen GitHub-/CI-/Vercel-/Supabase-Stand unabhängig verifizieren. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## PR #38 – Travel Timing & Seasonal

- Branch: `feat/travel-timing-seasonal-intelligence`
- PR #38: open, Draft, nicht gemergt
- letzter gegateter Runtime-Head: `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88`
- R15-Blocker 30 ist im `FlugOption`-Pfad implementiert und gegated.
- Unabhängiger ChatGPT-Review **R16**: **REQUEST CHANGES / Blocker 31**.
- Review-Dokument: `docs/PR38_CHATGPT_R16_REVIEW.md` auf dem PR-Branch.
- Kernbefund: untrusted Browser-/LocalStorage-`routeItinerary` kann `surfaceFromAirportCode` weiterhin selbst behaupten; Server-Kanonisierung und Development-DB erhalten die syntaktisch gültige Angabe, obwohl keine serverseitig belegte Evidence existiert.
- R16-Review-Commit: `3a77fcdd14e321b440213f635c093283722ceb48`.
- Active-Status-Update nach R16: Commit `b52038716479d04a3720077d66fe68872aa8ef38`.
- Production enthält die Route-Surface-Migration weiterhin **nicht**; Development enthält `20260824120000_flug_route_itinerary_surface_evidence`.
- Nächster Schritt: Blocker 31 durch denselben PR-#38-Workstream schließen → neues Exact-Head-Gate → unabhängiger ChatGPT-Review **R17**.
- Wenn R17 keinen neuen konkreten relevanten Defekt findet: technisches Closure/PASS nach Stop-Kriterium dokumentieren.
- Danach erst Product-Owner-Entscheidung zu Mark Ready/Merge; Production-Migration bleibt separates Gate.

## Account

- Exakter Cursor-Anzeigename: `Account plattform audit vorbereitung`
- Audit: Draft-PR #39 / `audit/account-platform`
- Audit-Urteil: **AUDIT-PASS**, aber keine Implementierungsfreigabe.
- Implementierung startet erst nach technischem Closure/PASS von PR #38.
- Derselbe Agent bleibt zuständig.
- Erster Block: AP-1 Account-Shell + Übersicht.
- Danach Review → AP-2 → Review → AP-3 usw.

## Admin

- Exakter Cursor-Anzeigename: `Admin platform audit`
- Audit: Draft-PR #40 / `audit/admin-platform`
- Audit-Urteil: **AUDIT-PASS**, aber keine Implementierungsfreigabe.
- Implementierung startet erst nach technischem Closure/PASS von PR #38.
- Derselbe Agent bleibt zuständig.
- Erster Block: Slice A – ehrliche Control-Center-/Steuerzentralen-IA.
- Danach Review; anschließend u. a. read-only System Health für Vercel/Supabase/GitHub/App.

## Parallelität

Nach PR-#38-Closure dürfen Account und Admin als getrennte Domänen parallel arbeiten. Innerhalb jedes Workstreams arbeitet derselbe Agent Slice für Slice mit Review dazwischen. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller-Verträge bleiben seriell unter Technical-Lead-Ownership.

## Verifizierter Infra-Stand bei R16

- `main`: `cd220beb44d90ae376feeb8de9db8a3afb808d60`.
- Vercel Production `jetnity-app.vercel.app`: READY auf diesem `main`-Commit.
- Vercel: aktuelle Previews für #38, #39 und #40 READY; letzte 24h keine Runtime-Error-Cluster gefunden.
- Supabase Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY.
- Supabase Development `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY.
- Production-Migrationsstand endet bei `20260822180000_traveller_context_rereview`.
- Development enthält zusätzlich `20260824120000_flug_route_itinerary_surface_evidence`.
- Supabase Security Advisor meldet bestehende WARNs zu GraphQL-Exponierung und mehreren SECURITY-DEFINER-RPCs; diese sind separate Security-Evidence und nicht automatisch ein bestätigtes Datenleck.

## Danach weiterhin geplant

Provider-Readiness/Adapter-Grenzen; großer Trip-Workspace-/Übersicht-Umbau mit Function-by-Function-Generalinspektion; finaler Workspace Intelligence Audit; echte Providerphase mit separaten Kosten-/Vertrags-/Secret-Gates; provider-backed End-to-End-/Truth-Audit; finale Startseiten-Positionierung.
