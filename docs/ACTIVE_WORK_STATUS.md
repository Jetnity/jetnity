# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Foundation E vollständig abgeschlossen inkl. Production; nächster Block: Travel Safety & Disruption Intelligence – provider-neutrale Foundation**

## 1. Aktueller Zustand

### Foundation D – Route & Transit Intelligence

**Vollständig abgeschlossen und nicht erneut zu bauen.**

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Migrationen `20260822130000`–`20260822150000`: angewendet und verifiziert
- Production-Acceptance: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

### Foundation E – Traveller Context / Multi-Citizenship / Multi-Document

**Vollständig abgeschlossen, auf `main` und auf Production verifiziert. Nicht erneut bauen.**

- PR #35: gemergt
- Squash-Merge-Commit auf `main`: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- finaler PR-Head: `52601ea0f770cf4265a5bdf5cb2356557ef7dcde`
- finaler Runtime-/DB-Code-Head des Closure-Gates: `b1f9d6543aa153bacaa126f71d39c6a434dfbebb`
- unabhängiger Closure-Check: `docs/PR35_CHATGPT_INDEPENDENT_CLOSURE_CHECK.md` – PASS
- Product-Owner-Merge-Freigabe: erteilt am 23.08.2026
- Product-Owner-Production-Migrationsfreigabe: erteilt am 23.08.2026
- Production-Acceptance: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`

## 2. Foundation-E-Ergebnis

Kanonisches Modell:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.**

Umgesetzt und produktiv vorhanden:

- `trip_travellers` als stabiler Parent
- `trip_traveller_citizenships` als 1:n Citizenship-Truth
- `trip_traveller_documents` als 1:n Document-Truth
- optionales `trip_readiness_items.traveller_id`
- atomare Account-Writes über `public.party_schreiben(jsonb)` (`SECURITY INVOKER`)
- Guest/Account-Parität derselben Party-Form
- traveller-spezifische Readiness
- Fingerprint v2 für Citizenship-/Document-Kontext
- provider-neutrale Credential-Optionen und Vergleichsnaht
- fail-closed Requirements-API und Provider-Konfliktbehandlung
- keine Passnummern, Scans, MRZ oder Biometrie
- kein LLM als regulatorische Truth-Quelle
- echter Travel-Requirements-Provider weiterhin deaktiviert

## 3. Verifizierter Code-/UX-/Security-Nachweis

Auf dem final geprüften Runtime-/DB-Code-Head `b1f9d654`:

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
| Vercel Production nach Merge | success |

## 4. Production-Datenbank – Foundation E

Production enthält jetzt exakt:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Direkt auf Production verifiziert:

- Supabase nach Apply wieder `FUNCTIONS_DEPLOYED` / `ACTIVE_HEALTHY`
- beide Child-Tabellen vorhanden
- `trip_readiness_items.traveller_id` vorhanden
- RLS auf neuen Child-Tabellen aktiv
- je Child-Tabelle vier Owner-Policies für `authenticated` mit `user_id = auth.uid()`
- Citizenship → Traveller: `ON DELETE CASCADE`
- Document → Traveller: `ON DELETE CASCADE`
- Document → Citizenship: `ON DELETE SET NULL (citizenship_id)`
- Readiness → Traveller: `ON DELETE CASCADE`
- `party_schreiben(jsonb)`: `SECURITY INVOKER`, `search_path=public, pg_temp`, EXECUTE nur für `authenticated`
- Child-Limit-Lock: `FOR NO KEY UPDATE`
- erwartete Legacy-Backfills fehlen: **0**
- erfundene Document↔Citizenship-Backfill-Relationen: **0**

Vollständige Acceptance: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`.

## 5. Harte Grenzen bleiben bestehen

Bis zu separaten späteren Product-Owner-Gates:

- kein echter Travel-Requirements-Provider / Timatic
- keine Safety-/Seasonality-Live-Provider
- keine Flug-/Hotel-/Aktivitäten-/Mobilitäts-/Mietwagen-Provider-Aktivierung
- keine neuen Provider-Secrets
- keine Providerkosten ohne Freigabe
- keine Passnummern, Scans, MRZ oder Biometrie
- keine erfundene regulatorische, Safety- oder Seasonal-Truth

Provider werden erst in der späteren echten Providerphase aktiviert. Vorher müssen die provider-neutralen Adapter-/Port-Grenzen in allen relevanten Bereichen professionell fertig sein.

## 6. Exakter nächster Produktblock

Gemäß aktueller Product-Owner-Reihenfolge folgt nach Foundation E:

1. **Travel Safety & Disruption Intelligence – provider-neutrale Foundation**
2. **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**
3. verbleibende Provider-Readiness-/Adapter-Lücken über alle relevanten Bereiche schließen
4. großer End-to-End Trip-Workspace-/Übersicht-Umbau inklusive des besprochenen Wegs dorthin
5. finaler Workspace Intelligence Audit
6. echte Providerphase
7. Provider-backed End-to-End-/Truth-Audit
8. finale Startseiten-Positionierung

### Nächster operativer Schritt

Vor Cursor-Implementierung des Safety-Blocks:

- tatsächlichen aktuellen `main`-/Production-Stand prüfen
- globale Safety-/UX-/Truth-/Traveller-/Route-/Provider-Readiness-Policies lesen
- vollständigen versionierten Cursor-Auftrag für **Travel Safety & Disruption Intelligence – provider-neutrale Foundation** erstellen
- neuen Feature-Branch / Draft PR verwenden
- kein echter Provider, keine Production-Migration, kein Merge ohne separates Product-Owner-Gate

Leitsatz für die Fortsetzung:

> **Foundation D und E sind fertig. Als Nächstes bauen wir die provider-neutrale Safety-Intelligence auf derselben Reise-Wahrheit – nicht als isoliertes Warnungsmodul.**
