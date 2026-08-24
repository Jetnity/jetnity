# Jetnity – Current Multi-Agent Team Status

Stand: 24. August 2026, 18:33 Europe/Zurich  
Status: **zentrale Kontinuitäts-Evidence / docs-only / kein Ready / kein Merge**

## Zweck

Diese Datei hält den aktuellen operativen Jetnity-Teamstand fest, damit ein neuer ChatGPT-Chat oder ein anderer Technical Lead ohne Informationsverlust fortsetzen kann.

Wichtig: Diese Datei liegt auf dem Handoff-Branch `docs/chatgpt-technical-lead-handoff-2026-08-24` / PR #52 und ist **nicht automatisch main-Wahrheit**, solange PR #52 nicht gemergt ist. Vor jedem neuen Eingriff ist der aktuelle `main` live zu verifizieren.

## Aktueller bestätigter Main-Stand

- `main`: `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`
- letzter bestätigter Merge: Admin Control Center Slice A / PR #44
- PR #44: merged
- Vercel Production für diesen Merge: `dpl_83gKPm2vWETL7Jq1osdzcuTp4QP7` = READY auf exakt `1ec93cc9...`
- Supabase Production endet weiterhin bei Migration `20260824140000`
- Provider-S2-Migrationen `20260824160000` und `20260824180000` bleiben Development-only und sind nicht für Production freigegeben.

## Aktuell parallel arbeitende Cursor-Agenten

### 1. Provider Readiness

Cursor-Agent: `Jetnity provider readiness audit`

Aktueller Auftrag:
- Provider Readiness S3
- Mobility-/Rental-Nachweis auf die bestehende S1/S2-Trust-Grenze heben
- fail-closed ohne echten Adapter
- kein echter Provider, kein Secret, kein kostenpflichtiger Call, keine Production-Aktivierung
- Mobility Auto-Search auf Kostenleck prüfen und ggf. hinter explizite Nutzeraktion legen

Programm endet nicht bei S3. Danach gemäß vollständigem Plan S4–S8; echte Providerphase bleibt separat gegatet.

### 2. Account Platform

Cursor-Agent: `Account plattform audit vorbereitung`

Aktueller Auftrag:
- AP-3 `Meine Reisen` Lebenszyklus
- reine Datumsableitung Aktiv/Kommend/Vergangen/Ohne Datum
- keine neue Tabelle, keine Migration, kein Archiv-Write, keine Traveller-/Auth-/RLS-Neudefinition

Programm endet nicht bei AP-3. Danach vollständiger Account-Plan AP-4 bis AP-12 gemäß Shared-Gates und Audit-Plan.

### 3. Admin Control Center

Cursor-Agent: `Admin platform audit`

Aktueller Auftrag:
- PR #46 / Admin Slice B read-only System Health
- auf den neuen `main` nach Merge von #44 synchronisieren/retargeten
- vollständige neue Exact-Head-Gates und unabhängigen Re-Review vorbereiten
- keine Fake-Green-Health, keine Writes, keine neuen Secrets/Management-Tokens ohne Gate

Programm endet nicht bei B/C. Danach vollständiger Admin-Plan bis A–K / ehrliche produktionsreife Technical Closure.

### 4. Trip Workspace Audit & Architecture

Cursor-Agent: `Trip workspace audit architecture`

Gestartet am 24. August 2026 gegen den aktuellen Jetnity-Stand.

Aktueller Auftrag:
- **Docs/Audit/Architecture only**
- Projekt-/Governance-Kontext rekonstruieren
- vollständiges Trip-Workspace-Code-/Funktions-/Truth-Inventar erstellen
- Mobile-/Desktop-UX auditieren
- Source-of-Truth-, Empty/Error/Unknown/Stale-, Guest/Account- und Multi-Citizenship-Abhängigkeiten erfassen
- Zielarchitektur und konfliktarme Implementierungsslices vorbereiten
- Abhängigkeiten zu Account/Admin/Provider/Traveller/Route/Readiness/Safety/Seasonal dokumentieren

Nicht erlaubt in diesem Auftrag:
- kein großer Runtime-Umbau
- keine DB-/RLS-/Auth-/Traveller-/Route-/Provider-Änderung
- keine Homepage-Arbeit
- keine Secrets/Provideraktivierung/kostenpflichtigen Calls

Erwartete Audit-Dokumente:
- `docs/TRIP_WORKSPACE_AUDIT.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_HANDOFF.md`

## Verbindliche große Reihenfolge

1. Account + Admin sauber aufbauen; Provider Readiness parallel weiterführen.
2. Danach Trip Workspace / Reiseübersicht als nächster großer Produktblock implementieren, gestützt auf den jetzt laufenden Audit.
3. Danach Homepage weiterentwickeln.

Weltkarte, Reisepartner-Matching, Reisebuch, Trends/Hotspots und ähnliche Ideen sind Wünsche/Optionen, nicht automatisch Pflicht oder nächster Schritt.

## Verbindliche Governance

- Kein PR darf ohne ausdrückliche aktuelle Product-Owner-Freigabe auf Ready gesetzt werden.
- Kein PR darf ohne danach separate ausdrückliche aktuelle Product-Owner-Freigabe gemergt werden.
- Green CI/Vercel/Self-Review/Technical Closure ersetzen keine Freigabe.
- Production-Migrationen sind ein separates Gate.
- Provideraktivierung, Secrets/API-Keys, externe Verträge und kostenpflichtige Provider-Calls sind separate Gates.
- Laufende Infrastruktur-/Providerkosten über USD 100/Monat brauchen Product-Owner-Freigabe.
- Shared Auth/Identity/Sessions/MFA/AAL/RLS/Ownership/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Aktivierung bleiben seriell unter Technical-Lead-Steuerung.
- Multi-Citizenship / mehrere Reisedokumente müssen bei allen relevanten späteren Funktionen berücksichtigt werden; keine implizite Ein-Pass-Annahme.
- `unknown` bleibt `unknown`; LLM/Assistant ist nie Quelle für regulatorische, Safety-, Preis-, Verfügbarkeits- oder Provider-Hard-Truth.

## Pflicht pro Agent/Slice

Jeder Agent muss vor STOP/Review im Repository dokumentieren:

- exakten Branch und Exact Head
- Scope / bewusst nicht veränderten Scope
- relevante Architektur-/Truth-Entscheidungen
- gefundene P0/P1/P2/P3-Risiken
- offene Blocker
- DB-/RLS-/Auth-/Security-Auswirkungen
- Kosten-/Secret-/Provider-Auswirkungen
- lokale Tests/Gates
- GitHub Actions Exact Head
- Vercel Preview Exact Head
- Self-Review
- exakten nächsten Schritt

Danach STOP für unabhängigen ChatGPT/Technical-Lead-Review. Kein Agent setzt selbst Ready oder merged ohne Product Owner.

## Für einen neuen ChatGPT-Chat

Vor Fortsetzung mindestens lesen/verifizieren:

1. `JETNITY_HANDOFF.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-08-24.md`
4. `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
5. `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md`
6. diese Datei `docs/CURRENT_MULTI_AGENT_TEAM_STATUS_2026-08-24_1833.md`
7. die aktuellen Handoffs der vier Workstreams
8. aktuellen `main`, offene PRs, CI/Vercel und Supabase live verifizieren

Keinen historischen SHA oder Status blind übernehmen.
