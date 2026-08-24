# Jetnity – New Chat Checkpoint

Stand: 24. August 2026
Status: verbindlicher operativer Übergabepunkt für den nächsten Haupt-Chat

## Sofort lesen

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
- `docs/MULTI_AGENT_WORKSTREAMS.md`
- `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`
- `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md`
- Reviews/Handoffs der aktuell offenen PRs

Danach tatsächlichen GitHub-/CI-/Vercel-/Supabase-Stand unabhängig verifizieren. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## PR #38 – Travel Timing & Seasonal

- Branch: `feat/travel-timing-seasonal-intelligence`
- PR #38: **open, Draft, nicht gemergt**
- final unabhängig geprüfter Runtime-Head: `5782401943b41ddd1eea1337c93cb37163210362`
- R16-Blocker 31 ist geschlossen: untrusted Browser-/Guest-/LocalStorage-/Request-`routeItinerary` kann `surfaceFromAirportCode` nicht mehr selbst zu belegter Surface-Truth machen.
- Unabhängiger ChatGPT-Review **R17: PASS / Technical Closure**.
- Review-Dokument: `docs/PR38_CHATGPT_R17_REVIEW.md` auf dem PR-Branch.
- R17 Review-Commit: `bb9eda8212c24a8064939c8addd7fe0311943295`.
- Active-Status-Update nach R17: `12876274081d96155e8d78ae89333ca2b4523a97`.
- Runtime-Gate: `npm test` 1703/1703; Typecheck/Lint/Hygiene grün; Build Exit 0; UI Audit 1014/1014; DB Security 216/216; GitHub Actions Run `32677741683` SUCCESS; Vercel `dpl_74A67UxWrCLWviihrsn9hfYqqZDQ` READY.
- R17 live DB probe: manipuliertes `LAX→JFK`, `SFO→NRT`, `surfaceFromAirportCode='JFK'` wird in Development kanonisiert **ohne** Client-Surface-Claim.
- Development enthält `20260824120000` und `20260824140000`; Production enthält **keine** der beiden Route-Surface-Migrationen.
- Der Review-Loop ist nach dem Stop-Kriterium beendet. Ein weiterer Review nur bei konkreter neuer Runtime-Änderung oder neu belegtem Defekt.
- **Kein Mark Ready, kein Merge, keine Production-Migration** ohne die jeweils erforderliche ausdrückliche Product-Owner-Freigabe.

## Account

- Exakter Cursor-Anzeigename: `Account plattform audit vorbereitung`
- Audit: Draft-PR #39 / `audit/account-platform`
- Audit-Urteil: **AUDIT-PASS** als Planungsgrundlage.
- Die technische Sperre durch PR #38 ist mit R17 Technical Closure aufgehoben.
- Derselbe Agent bleibt zuständig.
- Erster konfliktarmer Block: **AP-1 Account-Shell + persönliche Übersicht / Meine Reisen als Account-Hub**.
- Danach Review → AP-2 → Review → AP-3 usw.
- Shared Auth/RLS/DB/Privacy/Billing/Traveller-/Route-Verträge nicht parallel neu definieren.

## Admin

- Exakter Cursor-Anzeigename: `Admin platform audit`
- Audit: Draft-PR #40 / `audit/admin-platform`
- Audit-Urteil: **AUDIT-PASS** als Planungsgrundlage.
- Die technische Sperre durch PR #38 ist mit R17 Technical Closure aufgehoben.
- Derselbe Agent bleibt zuständig.
- Erster konfliktarmer Block: **Slice A – ehrliche Control-Center-/Steuerzentralen-IA**.
- Danach Review; anschließend read-only System Health für Vercel/Supabase/GitHub/App.
- Shared Auth/RLS/DB/Privacy/Billing/Support-/Traveller-Verträge bleiben zentral koordiniert.

## Startseite

- Neue Produktseiten-Richtung ist dauerhaft gespeichert in `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md`.
- Ziel: hochprofessionelle moderne Tech-Produktseite, die Jetnity klar erklärt; große hochwertige Bilder, viel Weißraum, moderne Typografie, hochwertige Animationen und präzise kurze Texte.
- Starke bestehende Texte selektiv erhalten.
- Header-/Footer-Funktionalität nicht verändern; keine Account/Admin/Seasonal/Auth/DB-Logik im Homepage-Workstream.
- Neue Idee zuerst als separate visuelle Preview; bestehende Homepage erst nach ausdrücklicher Product-Owner-Entscheidung ersetzen.
- **Aktuell pausiert; noch keine Implementierungsfreigabe.**

## Parallelität

Nach R17 Technical Closure dürfen Account und Admin als getrennte konfliktarme Domänen parallel arbeiten. Innerhalb jedes Workstreams arbeitet derselbe Agent Slice für Slice mit Review dazwischen. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller-/Route-/Readiness-/Safety-/Seasonal-Verträge bleiben seriell unter Technical-Lead-Ownership.

## Verifizierter Infra-Stand bei R17

- `main`: `cd220beb44d90ae376feeb8de9db8a3afb808d60`.
- Vercel Production `jetnity-app.vercel.app`: READY auf diesem `main`-Commit.
- PR-#38 Runtime-Preview `dpl_74A67UxWrCLWviihrsn9hfYqqZDQ`: READY auf `57824019`.
- Supabase Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY.
- Supabase Development Branch `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY.
- Production-Migrationsstand endet bei `20260822180000_traveller_context_rereview`.
- Development enthält zusätzlich `20260824120000_flug_route_itinerary_surface_evidence` und `20260824140000_flug_route_itinerary_untrusted_surface`.
- Development-RPC: SECURITY INVOKER; anon kein EXECUTE; authenticated EXECUTE.
- Supabase Security Advisor-WARNs zu GraphQL-Exponierung und mehreren SECURITY-DEFINER-RPCs bleiben separate Security-Evidence und sind nicht automatisch ein bestätigtes Datenleck.

## Danach weiterhin geplant

Account/Admin erste Slices; Homepage-Preview erst nach Product-Owner-Startsignal; Provider-Readiness/Adapter-Grenzen; großer Trip-Workspace-/Übersicht-Umbau mit Function-by-Function-Generalinspektion; finaler Workspace Intelligence Audit; echte Providerphase mit separaten Kosten-/Vertrags-/Secret-Gates; provider-backed End-to-End-/Truth-Audit.
