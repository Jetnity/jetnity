# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **TW-1 und TW-2 sind auf `main`. Marketing/Growth Governance PR #59 ist gemergt. TW-4 Draft-PR #60 war BLOCKED; Review-Fix ist umgesetzt und wartet auf erneuten unabhängigen Technical-Lead-Re-Review. Kein TW-3, kein TW-5.**

## 0. Git-Wahrheit

Aktueller verifizierter `main` nach PR #59:

- `main`: `5341decef6ab128039dea11fa6f2625fbf03d354`
- PR #56 – TW-1: merged
- PR #58 – TW-2: merged; Merge-Commit `5e27f383c7917eec168d11bceb78f9fafc198d42`
- PR #59 – Marketing & Growth Standards: merged; Merge-Commit `5341decef6ab128039dea11fa6f2625fbf03d354`
- PR #52 bleibt historischer Draft-Handoff und ist nicht Runtime-Träger.

PR #59 bindet jetzt auf `main`:

- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
- `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
- aktualisiertes `JETNITY_START_HERE.md`
- aktualisierte `docs/JETNITY_BINDING_BUILD_ORDER.md`

Historische Handoffs oder ältere Statusdateien, die TW-2/PR #58 noch als Draft oder PR #59 als offen beschreiben, sind pre-merge Evidence und dürfen diesen Status nicht überschreiben.

## 1. Zuletzt abgeschlossene Blöcke

### Trip Workspace TW-2 – Reiseübersicht

- PR #58: merged / closed
- Review-Head: `3f2c55357a7a2425ab760aac2a29ddbe15f80fa8`
- Merge auf `main`: `5e27f383c7917eec168d11bceb78f9fafc198d42`
- unabhängiger Technical-Lead-Review: PASS
- GitHub CI: SUCCESS
- Vercel: SUCCESS
- Trip-Workspace-UI-Audit: 1018/1018, 0 Fehler, WebKit + Chromium
- keine DB/RLS/Auth/Traveller/Provider/Secret/Kosten-/Production-Änderung

### Marketing & Growth Governance

- PR #59: merged / closed
- Exact Review-Head: `46c0c1b1c5f9542c42d70e9f93ad132ebf25fb34`
- Merge auf `main`: `5341decef6ab128039dea11fa6f2625fbf03d354`
- Technical-Lead-Review: PASS
- GitHub CI Run `32801868525`: SUCCESS
- Vercel: SUCCESS
- docs-only; keine Campaign-/Provider-/Secret-/Production-Aktivierung

### Davor bereits abgeschlossen

- TW-1 / PR #56 – Shell & Geräteparität
- Trip Workspace Audit / PR #55
- Provider S3 / PR #54
- Account AP-3 / PR #53
- Admin Slice C / PR #49
- Admin Slice B / PR #46
- Admin Slice A / PR #44
- Provider S2 / PR #51
- Provider S1 / PR #47
- Account AP-2 / PR #48
- Account AP-1 / PR #43
- Travel Timing & Seasonal Intelligence / PR #38

## 2. Production-Status

Keine Production-Migration oder Provider-Aktivierung durch TW-1, TW-2 oder PR #59.

Bekannte unveränderte Grenze:

- Supabase Production: `qscbgcdmivbbnzrcyegn`
- Production enthält `20260824120000_flug_route_itinerary_surface_evidence`
- Production enthält `20260824140000_flug_route_itinerary_untrusted_surface`
- S2 Development-Migrationen `20260824160000` und `20260824180000` sind weiterhin **nicht Production-approved** und dürfen nicht eigenmächtig auf Production angewendet werden.

Keine neuen Secrets und keine neuen laufenden Providerkosten durch die aktuellen Slices.

## 3. Aktiver Workstream – Trip Workspace TW-4

Verantwortlicher Cursor-Anzeigename: `Trip workspace audit architecture`

Branch:

`feat/trip-workspace-tw4-attention`

Versionierte Steuerung:

- `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`
- `docs/TRIP_WORKSPACE_TW4_TASK.md`
- `docs/TRIP_WORKSPACE_TW4_STATUS.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` §5
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`

Ziel: begrenzter, deterministischer Attention-Layer `Jetzt wichtig` über **vorhandene** Graph-/Coverage-/Readiness-/Safety-/Seasonal-Wahrheit.

Zwingend getrennte Attention-Leerstände:

- `nichts_dringend_geprueft`
- `noch_nicht_geprueft`
- `noch_nicht_pruefbar`
- `pruefung_nicht_verfuegbar`

Zusätzlich bleiben `unknown`, `stale` und `error` getrennt.

Fehlende Safety-/Seasonal-Evaluation ist weder clean noch unavailable. Keine Default-Citizenship / kein Default-Pass.

TW-4 ist kein TW-3/TW-5-Slice, keine neue Persistenz, keine DB/RLS/Auth-/Traveller-Neumodellierung, kein Guardian/Simulator und keine Provider-/Marketing-Aktivierung.

Review `5017458023` auf `8bbafefc` war BLOCKED. Der Review-Fix trennt echte Attention-Leerstände von aktiven Punkten und klassifiziert Safety/Seasonal-`stale`/`unknown`/`insufficient_context` getrennt.

## 4. Wartende Workstreams

### Account Platform

Agent: `Account plattform audit vorbereitung`

AP-1 bis AP-3 sind auf `main`. AP-4 bis AP-12 warten gemäß verbindlicher Build Order nach Abschluss des Trip-Workspace-Programms und Traveller-/Multi-Citizenship-Vervollständigung.

### Provider Readiness

Agent: `Jetnity provider readiness audit`

S1 bis S3 sind auf `main`. S4 bis S8 warten gemäß Build Order. Echte Provider, Secrets, Verträge und paid calls bleiben besondere Product-Owner-Gates.

### Admin Control Center

Agent: `Admin platform audit`

A bis C sind auf `main`. D bis K plus die fehlenden Marketing-/Growth-Control-Slices aus `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md` warten gemäß Build Order. Billing-/Refund-P1 bleibt vor Finance-/Payment-Live zwingend.

## 5. Marketing / Discoverability

Die neuen Standards sind verbindlich auf `main`, aber **kein Vorwand, den aktiven Workspace-Slice aufzublähen**.

- Discoverability D0 darf konfliktarm vorbereitet werden, wenn passend.
- Marketing/Growth G0 darf konfliktarm vorbereitet werden, wenn passend.
- Paid Campaigns, produktive CRM-/Audience-Weitergabe, neue Tracking-/Ads-Provider, Secrets und öffentliche Aktivierung bleiben gegated.
- Admin Growth/Marketing wird später kontrolliert durch `Admin platform audit` in separaten M0–M6-Slices gebaut.

## 6. Parallelitätsregel

Aktiv ist nur TW-4 durch `Trip workspace audit architecture`.

Wartend:

- `Admin platform audit`
- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`

Kein wartender Agent startet eigenmächtig Slice D, AP-4, S4 oder andere Runtime-Slices.

Seriell/zentral bleiben insbesondere Shared Auth/Identity/RLS/Ownership, Guest→Account, Traveller/Credentials, Route/Safety/Seasonal Truth, Privacy, Billing/Payment/Refund, Admin Audit, Provider Activation/Secrets/Kosten sowie neue sensible Identity-Storage-Verträge.

## 7. Governance

Verbindlich lesen:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
- `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`

Normale scope-treue PRs dürfen nach vollständigen Exact-Head-Gates und unabhängigem Technical-Lead-PASS Ready gesetzt und gemergt werden.

Product-Owner-Freigabe bleibt zwingend für Production-Migration/destructive Production-Daten, echte Provider/Secrets/Verträge/paid calls, Kosten > USD 100/Monat, große Produkt-/Business-Model-Änderungen, besonders sensible Identity-Storage-Änderungen und öffentliche/produktive Aktivierungen.

## 8. Exakter nächster Schritt

**Nächster Technical-Lead-Schritt:** erneuter unabhängiger Re-Review von Draft-PR #60 nach dem Truth-/Presentation-Fix. Kein TW-3, kein TW-5, keine besonderen Product-Owner-Gates eigenmächtig öffnen.

Danach gemäß Build Order: TW-3 – Timeline / Etappe / Tag.