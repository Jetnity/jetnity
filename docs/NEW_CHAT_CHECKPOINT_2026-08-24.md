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
- R15-Runtime-Head: `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88`
- Blocker 30 ist implementiert und gegated.
- `docs/ACTIVE_WORK_STATUS.md` auf dem PR-Branch enthält die Exact-Head-Evidence.
- Nächster Schritt: unabhängiger ChatGPT-Review **R16**.
- Wenn R16 keinen neuen konkreten relevanten Defekt findet: technisches Closure/PASS dokumentieren und Review-Schleife nach Stop-Kriterium beenden.
- Danach Product-Owner-Entscheidung zu Mark Ready/Merge; Production-Migration bleibt separates Gate.

## Account

- Exakter Cursor-Anzeigename: `Account plattform audit vorbereitung`
- Audit: Draft-PR #39 / `audit/account-platform`
- Implementierung startet erst nach technischem Closure/PASS von PR #38.
- Derselbe Agent bleibt zuständig.
- Erster Block: AP-1 Account-Shell + Übersicht.
- Danach Review → AP-2 → Review → AP-3 usw.

## Admin

- Exakter Cursor-Anzeigename: `Admin platform audit`
- Audit: Draft-PR #40 / `audit/admin-platform`
- Implementierung startet erst nach technischem Closure/PASS von PR #38.
- Derselbe Agent bleibt zuständig.
- Erster Block: Slice A – ehrliche Control-Center-/Steuerzentralen-IA.
- Danach Review; anschließend u. a. read-only System Health für Vercel/Supabase/GitHub/App.

## Parallelität

Nach PR-#38-Closure dürfen Account und Admin als getrennte Domänen parallel arbeiten. Innerhalb jedes Workstreams arbeitet derselbe Agent Slice für Slice mit Review dazwischen. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller-Verträge bleiben seriell unter Technical-Lead-Ownership.

## Danach weiterhin geplant

Provider-Readiness/Adapter-Grenzen; großer Trip-Workspace-/Übersicht-Umbau mit Function-by-Function-Generalinspektion; finaler Workspace Intelligence Audit; echte Providerphase mit separaten Kosten-/Vertrags-/Secret-Gates; provider-backed End-to-End-/Truth-Audit; finale Startseiten-Positionierung.
