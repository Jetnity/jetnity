# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Safety & Disruption Intelligence – provider-neutrale Foundation vorbereitet; Cursor-Implementierung noch nicht begonnen**

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

## 6. Aktiver nächster Produktblock

Gemäß aktueller Product-Owner-Reihenfolge folgt jetzt:

**Travel Safety & Disruption Intelligence – provider-neutrale Foundation**

Verbindlicher Implementierungsauftrag ist auf `main` vorbereitet:

- `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`
- Task-Erstellungscommit: `2c39d488b4ffca7fd718fdc3238b9cfbece0c9dd`

Status: **Auftrag vorbereitet, Implementierung noch nicht begonnen.**

Der Task verlangt unter anderem:

- eigenen frischen Branch `feat/travel-safety-disruption-intelligence`
- frühen Draft PR
- vollständigen Ist-Architektur-Audit vor Implementierung
- provider-neutrale Safety-Domäne und Provider-Port
- strikte Evidence-/Freshness-/Conflict-Grenzen
- räumlich und zeitlich konkrete Relevance Engine
- Wiederverwendung der Foundation-D Route Truth
- Cross-Domain Impact-/Recheck-Naht ohne automatische Reiseänderung
- klare Trennung Safety vs Seasonal
- minimale Workspace-Integration ohne den späteren großen Workspace-Umbau vorzuziehen
- umfassende Truth-/Security-/UX-/Device-Testmatrix
- kein echter Provider, keine Production-Migration, kein Mark Ready, kein Merge

## 7. Reihenfolge danach

Nach erfolgreichem Safety-Block:

1. **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**
2. verbleibende Provider-Readiness-/Adapter-Lücken über alle relevanten Bereiche schließen
3. großer End-to-End Trip-Workspace-/Übersicht-Umbau inklusive des besprochenen Wegs dorthin
4. finaler Workspace Intelligence Audit
5. echte Providerphase
6. Provider-backed End-to-End-/Truth-Audit
7. finale Startseiten-Positionierung

## 8. Exakter nächster operativer Schritt

1. Neuen Cursor-Agenten starten.
2. Ihm ausschließlich den Auftrag geben, `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md` vollständig zu lesen und exakt umzusetzen.
3. Cursor muss vor Code `origin/main` frisch synchronisieren und den Ist-Audit durchführen.
4. PR bleibt Draft; kein Mark Ready, kein Merge, keine Production-Migration.
5. Nach Cursor-Abschluss führt ChatGPT den unabhängigen Review auf exakt dem finalen PR-Head durch.

Leitsatz für die Fortsetzung:

> **Foundation D und E sind fertig. Jetzt bauen wir Safety als belastbare provider-neutrale Reise-Intelligence – nicht als Newsfeed, nicht als LLM-Warnung und nicht als isolierte Karte.**