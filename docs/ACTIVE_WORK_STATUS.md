# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Foundation E – Traveller Context – PR #35 gemergt; Production-Migration separat gesperrt**

## 1. Aktueller Zustand

Foundation D – Route & Transit Intelligence ist vollständig abgeschlossen und **nicht erneut zu bauen**.

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Abnahme: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Foundation E – Traveller Context / Multi-Citizenship / Multi-Document ist technisch abgeschlossen und auf `main` gemergt.

- PR #35: **gemergt**
- Squash-Merge-Commit auf `main`: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- finaler PR-Head: `52601ea0f770cf4265a5bdf5cb2356557ef7dcde`
- finaler Runtime-/DB-Code-Head des Closure-Gates: `b1f9d6543aa153bacaa126f71d39c6a434dfbebb`
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`
- unabhängiger Closure-Check: `docs/PR35_CHATGPT_INDEPENDENT_CLOSURE_CHECK.md` – **PASS**
- Product-Owner-Merge-Freigabe: **erteilt am 23.08.2026**
- Vercel auf dem Merge-Commit: **SUCCESS**

## 2. Foundation-E-Ergebnis

Kanonisches Zielmodell:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.**

Umgesetzt:

- 1:n-Modell `trip_travellers` → `trip_traveller_citizenships` / `trip_traveller_documents`
- Expand/Contract-Migration mit deterministischem Backfill; Legacy-Spalten bleiben vorerst erhalten
- atomare Account-Writes über `public.party_schreiben(jsonb)` (`SECURITY INVOKER`)
- Guest/Account-Parität derselben Party-Form
- traveller-spezifische Readiness-Items
- Fingerprint v2 für Citizenship-/Document-Kontext
- provider-neutrale Credential-Optionen und Vergleichsnaht
- fail-closed Requirements-API und Provider-Konfliktbehandlung
- keine Passnummern, Scans, MRZ oder Biometrie
- kein LLM als regulatorische Truth-Quelle
- echter Travel-Requirements-Provider weiterhin deaktiviert

## 3. Verifizierter Abschlussnachweis

Auf dem final geprüften Code-Head `b1f9d654`:

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | **1353/1353** |
| Typecheck | grün |
| Lint | grün |
| Hygiene | grün |
| Production-Build | grün, 38/38 Seiten |
| `db:rechte` | OK, 51 Rechte |
| `db:rls` | Exit 0 |
| `db:sicherheit` | **210/210** |
| `db:parallelitaet` | **7/7** |
| UI-Audit | **838/838, 0 Fehler**, WebKit + Chromium, 8 Viewports |
| finaler PR-CI | success |
| finaler PR-Vercel | success |

Der letzte PR-Head `52601ea0` enthält gegenüber dem geprüften Runtime-/DB-Code nur Review-/Status-Dokumentation; GitHub Actions und Vercel waren dort ebenfalls grün.

## 4. Datenbankgrenze

Development enthält Foundation E bis:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Production wurde beim Merge **nicht** verändert und endet weiterhin bei:

- `20260822150000_trip_items_route_itinerary_guard`

Damit fehlen die Foundation-E-Tabellen/Funktionen auf Production weiterhin bewusst. **Merge-Freigabe war keine Production-Migrationsfreigabe.**

## 5. Harte Grenzen

Bis zu einer neuen ausdrücklichen Product-Owner-Entscheidung:

- **keine Foundation-E-Production-Migration**
- kein echter Travel-Requirements-Provider / Timatic-Vertrag
- keine Provider-Secrets
- keine Passnummern, Scans, MRZ oder Biometrie
- keine erfundene regulatorische Wahrheit

## 6. Exakter nächster Schritt

1. Foundation E im Code ist abgeschlossen; PR #35 nicht erneut öffnen oder neu bauen.
2. Nächstes separates Gate ist die **Product-Owner-Entscheidung über die Foundation-E-Production-Migration**.
3. Vor einer solchen Migration Production-Migrationsstand erneut prüfen und die drei Foundation-E-Migrationen exakt gegen den gemergten `main`-Stand verifizieren.
4. Nach einer separat freigegebenen Production-Migration: DB-/RLS-/Security-/Smoke-Nachweis durchführen und eine eigene Production-Acceptance versionieren.
5. Erst danach den nächsten Produktblock gemäß dem **aktuellsten `ROADMAP.md`** starten; nicht aus Chat-Erinnerung raten.

Leitsatz für die Fortsetzung:

> **Foundation E ist im Code fertig. Production bleibt ein eigenes Gate.**
