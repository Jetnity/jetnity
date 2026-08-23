# Jetnity – Active Work Status

Stand: 24. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R14-Merge-Blocker 29 ist auf Runtime `771c63a9` implementiert und gegated. Der unabhängige R15-Review hat jedoch einen neuen konkreten Merge-Blocker 30 an der Trust-Grenze Browser→Server→Route-Itinerary gefunden. Noch kein technisches Closure/PASS.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R15 Review: `docs/PR38_CHATGPT_R15_REVIEW.md`  
R14 Review: `docs/PR38_CHATGPT_R14_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: #38
- Base/Main beim R14-Runtime-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R14-Runtime-Head: `771c63a97f93f442dbc3856dc4218ce458dfecdf`
- R14-Docs-Lock vor R15: `096beb1fd4be60e4a45a42454dd76d6b69d2e23e`
- R15 Review-Dokument: Commit `1d45c2db10642b84f5d8d60051f8b34638ef9ec1`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**REQUEST CHANGES – Blocker 30 offen.**

29. **geschlossen:** DB-Persistenz erhält gültiges `surfaceFromAirportCode`; Development-Migration funktioniert, Production unberührt.

30. **offen:** `lib/route/itinerary.ts::surfaceEvidenceSetzen()` erzeugt aus jeder bloßen Segment-Lücke innerhalb einer `FlugOption` automatisch `surfaceFromAirportCode`. Das ist nicht als Provider-Evidence belastbar, weil `lib/flights/schema.ts` und `lib/flights/aktionen.ts` ausdrücklich festhalten, dass die zu persistierende Flugoption aus dem Browser kommt und untrusted input ist. Das Schema prüft nur Form, nicht belegte Segmentkontinuität/Surface-Truth.

Konkretes Gegenbeispiel: Browser-Option `LAX→JFK` + `SFO→NRT` im selben Leg → aktuelle Runtime setzt am zweiten Segment `surfaceFromAirportCode='JFK'` → `chronologie.ts` kann daraus `JFK⇢SFO` als bewiesene Surface-Kante machen → R14-Persistenz bewahrt diese erfundene Evidence dauerhaft.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Unabhängig verifizierte R14-Evidence

Auf exakt Runtime `771c63a97f93f442dbc3856dc4218ce458dfecdf`:

- GitHub Actions Run `32673505102`: SUCCESS
- Vercel `dpl_FhcvfAb7tPL17xYDd5Bm38tpzCqU`: READY, exact `githubCommitSha`
- Cursor-Gate dokumentiert: npm test 1687/1687, Typecheck/Lint/Hygiene grün, Production-Build Exit 0, UI-Audit 1014/1014, DB Rechte 51 / RLS 0 / Sicherheit 216/216 / Parallelität 7/7
- Development-Funktion `public.flug_route_itinerary_metadata` entspricht der neuen Migration, SECURITY INVOKER, `anon` ohne EXECUTE, `authenticated` mit EXECUTE
- Docs-Lock `096beb1f` ist genau ein nachfolgender Docs-Commit; CI Run `32674333396` SUCCESS

## 5. DB / Kosten / Provider

- keine Seasonal-Tabelle
- `seasonalProviderAus()` bleibt `null`
- keine Live-Provider-Aktivierung
- keine neuen Secrets
- keine neuen laufenden Kosten
- Development-Migration angewendet
- **keine Production-Migration**

## 6. Exakter nächster Schritt

Nur Blocker 30 kohärent schließen:

- keine Surface-Evidence mehr aus bloßer `previous.destination !== current.origin`-Array-Nachbarschaft erzeugen;
- Surface-Truth nur aus einer zulässigen expliziten Evidence-Quelle ableiten (server-verifiziert/provider-backed oder später klar getrennte, explizit bestätigte User-Truth);
- untrusted Browser-`provider`/`externalRef`/Segmentarray allein darf kein Vertrauensbeweis sein;
- `LAX→JFK + SFO→NRT` über den realen Flugübernahmepfad muss fail-closed bleiben;
- echtes `CDG⇢ORY` darf nur mit zulässiger Evidence bewiesen bleiben;
- R14 Save→Reload/Guest→Account-Persistenzregressionen müssen grün bleiben.

Danach Exact-Head-Gate und unabhängiger ChatGPT-Re-Review **R16**.

Wenn R16 keinen neuen konkreten relevanten Defekt findet, nach strengem Stop-Kriterium technisches Closure/PASS dokumentieren und die Review-Schleife beenden.

## 7. Agent-Handoff

- Vollständiger Cursor-Anzeigename des PR-#38-Agenten ist weiterhin nicht sicher bekannt; UI zeigt nur `Reisezeitpunkt saisonale intellig...`.
- Branch/PR: `feat/travel-timing-seasonal-intelligence` / #38
- Letzter geprüfter Runtime-Head: `771c63a9`
- Blocker 29: geschlossen
- Blocker 30: offen
- Nächster Schritt: nur Blocker 30 → Exact-Head-Gate → R16
- Kein Mark Ready, kein Merge, keine Production-Migration.
