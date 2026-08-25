# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **TW-1, TW-2 und TW-4 sind auf `main`. TW-3 – Timeline / Etappe / Tag ist der aktive Runtime-Slice. Kein Ready, kein Merge, kein TW-5.**

## 0. Git-Wahrheit

Aktueller verifizierter `main`:

- `main`: `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`
- PR #56 – TW-1: merged
- PR #58 – TW-2: merged; Merge-Commit `5e27f383c7917eec168d11bceb78f9fafc198d42`
- PR #59 – Marketing & Growth Standards: merged; Merge-Commit `5341decef6ab128039dea11fa6f2625fbf03d354`
- PR #60 – TW-4 Aufmerksamkeit: **merged**; Merge-Commit `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`
- PR #52 bleibt historischer Draft-Handoff und ist nicht Runtime-Träger.

Historische Handoffs oder ältere Statusdateien, die TW-4/PR #60 noch als Draft oder Re-Review-STOPP beschreiben, sind pre-merge Evidence und dürfen diesen Status nicht überschreiben.

## 1. Zuletzt abgeschlossene Blöcke

### Trip Workspace TW-4 – Aufmerksamkeit / Jetzt wichtig

- PR #60: merged / closed
- Merge auf `main`: `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`
- unabhängiger Technical-Lead-Review: PASS / abgenommen
- keine DB/RLS/Auth/Traveller/Provider/Secret/Kosten-/Production-Änderung

### Davor bereits abgeschlossen

- TW-2 / PR #58 – Reiseübersicht
- TW-1 / PR #56 – Shell & Geräteparität
- Marketing & Growth Governance / PR #59
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

Keine Production-Migration oder Provider-Aktivierung durch TW-1, TW-2, TW-4 oder PR #59.

Bekannte unveränderte Grenze:

- Supabase Production: `qscbgcdmivbbnzrcyegn`
- Production enthält `20260824120000_flug_route_itinerary_surface_evidence`
- Production enthält `20260824140000_flug_route_itinerary_untrusted_surface`
- S2 Development-Migrationen `20260824160000` und `20260824180000` sind weiterhin **nicht Production-approved** und dürfen nicht eigenmächtig auf Production angewendet werden.

Keine neuen Secrets und keine neuen laufenden Providerkosten durch die aktuellen Slices.

## 3. Aktiver Workstream – Trip Workspace TW-3

Verantwortlicher Cursor-Anzeigename: `Trip workspace audit architecture`

Branch:

`feat/trip-workspace-tw3-timeline`

Versionierte Steuerung:

- `docs/ADR_0166_TRIP_WORKSPACE_TW3_TIMELINE.md`
- `docs/TRIP_WORKSPACE_TW3_TASK.md`
- `docs/TRIP_WORKSPACE_TW3_STATUS.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` §3 und §6
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`

Ziel: Etappen und Tage als zusammenhängende Reise-Timeline aus dem kanonischen Trip-Graphen. Einzige Auswahlquelle bleibt `gewaehlterTagId`. Transit ist kein Nutzerziel. Keine zweite Tageswahrheit in URL oder Persistenz.

TW-3 ist kein TW-5-Slice, keine neue Persistenz, keine DB/RLS/Auth-/Traveller-/Route-Neumodellierung, kein Guardian/Simulator und keine Provider-/Marketing-Aktivierung.

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

Die Standards sind verbindlich auf `main`, aber **kein Vorwand, den aktiven Workspace-Slice aufzublähen**.

- Discoverability D0 darf konfliktarm vorbereitet werden, wenn passend.
- Marketing/Growth G0 darf konfliktarm vorbereitet werden, wenn passend.
- Paid Campaigns, produktive CRM-/Audience-Weitergabe, neue Tracking-/Ads-Provider, Secrets und öffentliche Aktivierung bleiben gegated.

## 6. Parallelitätsregel

Aktiv ist nur TW-3 durch `Trip workspace audit architecture`.

Wartend:

- `Admin platform audit`
- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`

Kein wartender Agent startet eigenmächtig Slice D, AP-4, S4 oder andere Runtime-Slices. Die bevorzugte Parallelisierungs-Schwelle bleibt TW-4 ✅ + TW-3 ✅ plus Technical-Lead-Integrations-Checkpoint.

## 7. Governance

Verbindlich lesen:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`

Normale scope-treue PRs dürfen nach vollständigen Exact-Head-Gates und unabhängigem Technical-Lead-PASS Ready gesetzt und gemergt werden. Der Coding Agent setzt weder Ready noch Merge.

Product-Owner-Freigabe bleibt zwingend für Production-Migration/destructive Production-Daten, echte Provider/Secrets/Verträge/paid calls, Kosten > USD 100/Monat, große Produkt-/Business-Model-Änderungen, besonders sensible Identity-Storage-Änderungen und öffentliche/produktive Aktivierungen.

## 8. Exakter nächster Schritt

**Nächster Technical-Lead-Schritt:** unabhängiger Re-Review von Draft-PR #64 (TW-3) auf dem persistierten Exact Head. Kein Ready, kein Merge, kein TW-5.
