# Jetnity – Active Work Status

Stand: **24. August 2026, 16:45 Europe/Zurich**  
Status: **stabiler Übergabepunkt nach Merge von Account AP-2 und Provider Readiness S2; nächster Start erst nach neuem ChatGPT/Technical-Lead-Livecheck**

Authoritativer Übergabe-Checkpoint:

- `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-08-24.md`
- `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
- `docs/NEW_CHAT_START_PROMPT_2026-08-24.md`

Wenn dieser Text später älter als GitHub/CI/Vercel/Supabase ist: **live verifizieren, nicht raten.**

---

## 1. Aktueller `main`

Verifizierter Main-Head beim Übergang:

`52e665acfed88303300870d50855177284588026`

Letzter Merge:

- PR #51 – **Provider Readiness S2 – FlugNachweis**
- merged 24. August 2026, 14:29:48 UTC

Davor:

- PR #48 – Account AP-2 – merged
- PR #43 – Account AP-1 – merged
- PR #47 – Provider Ops S1 – merged
- PR #45 – Provider Readiness Audit – merged
- PR #38 – Seasonal Intelligence Foundation – merged / Production-verifiziert

---

## 2. Production / Development

### Vercel Production

- Project: `jetnity-app`
- Production Deployment: `dpl_GmkoSNdse6YkRYqiR6VHsEMAsUv5`
- State: **READY**
- Git SHA: `52e665acfed88303300870d50855177284588026`
- Runtime error/fatal logs im geprüften letzten Stundenfenster: keine gefunden

### Supabase Production

Project ref: `qscbgcdmivbbnzrcyegn`  
Status: **ACTIVE_HEALTHY**

Letzte Production-Migrationen:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

### Supabase Development

Branch: `develop`  
Branch ID: `74809331-0243-493a-8c14-20bb78c015f5`  
Project ref: `yfvbxvijcorffwxbxahl`  
Preview status: **ACTIVE_HEALTHY**

Development zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

**Diese beiden Migrationen sind NICHT auf Production.** Production-Migration bleibt separates Product-Owner-Gate.

---

## 3. Account

Verantwortlicher Cursor-Anzeigename:

`Account plattform audit vorbereitung`

Abgeschlossen:

- AP-1 – merged
- AP-2 – merged

Nächster geplanter Slice:

### AP-3 – Meine Reisen Lebenszyklus

Noch **nicht gestartet**.

Scope laut Audit-Plan:

- rein ableitende Gruppen Aktiv / Kommend / Vergangen / Ohne Datum
- optionale kleine Suche/Filter
- Limit-Hinweis nur ehrlich
- kein `archived`-Write
- kein zweites Reisen-Listenmodell
- Date-only-/Zeitzonenlogik konsistent
- Empty ≠ Error

Start erst nach Technical-Lead-Livecheck vom aktuellen `main`; eigener Draft-PR; keine Shared Auth/RLS/DB-/Traveller-Verträge.

---

## 4. Admin

Verantwortlicher Cursor-Anzeigename:

`Admin platform audit`

### PR #44 – Slice A / Control Center IA

- open Draft
- historischer Technical-Lead Integration PASS existiert
- damaliger Runtime-Head: `ed839d3e6ee2605beef65d66fa1555ddabb52138`
- seitdem ist `main` weitergelaufen

**Nächster Admin-Schritt:** gegen aktuellen `main` synchronisieren, neu exakt gaten, unabhängig re-reviewen. Erst danach Product-Owner-Entscheidung über Ready/Merge.

### PR #46 – Slice B / read-only System Health

- open Draft
- historischer Technical Closure/PASS auf gestapeltem Slice-A-Stand
- bleibt zunächst gestapelt / nicht mergen

Nach sauberer Slice-A-Integration: auf `main` retarget/sync, neu gaten, neu unabhängig reviewen.

### PR #49 – Slice C / Provider & Cost Board

- open Draft
- nur vorbereitet
- kein Runtime-Start

Erst nach A/B-Integration und neuem Technical-Lead-Auftrag beurteilen. Kein Live-Provider, keine Secrets, keine Fake-Health/Cost-Wahrheit.

---

## 5. Provider Readiness

Abgeschlossen / merged:

- Audit PR #45
- S1 PR #47 – Shared Operational Contract
- S2 PR #51 – FlugNachweis + Development-only DB Trust Guards

Nächster geplanter Slice:

### S3 – Mobility- und Rental-Nachweis

Noch **nicht gestartet**.

Geplanter Scope:

- async Nachweis-Interface auf Hotel-/S2-Qualitätsniveau
- fail-closed ohne echten Adapter
- Test-Doubles
- keine Auto-Aktivierung
- Mobility Auto-Search nur weiterführen, wenn Kosten-/Explizitheitsgrenze sicher ist; sonst abschalten oder explizite Nutzeraktion
- kein echter Provider
- keine Mietwagen-Such-UI
- kein Graph-Rewrite

Vor Start: aktuelles Audit / Code / S1/S2-Integrationsverhalten erneut prüfen und neuen versionierten Auftrag schneiden.

---

## 6. Offene historische / vorbereitete PRs

Nicht automatisch als aktive Runtime-Arbeit behandeln:

- #39 Account Audit – historischer Planungs-PR
- #40 Admin Audit – historischer Planungs-PR
- #50 docs-only Provider-S1-Nachtrag – historisch/stale
- #28 alte Collaboration Foundation – nicht in aktueller Reihenfolge

Kein Cleanup/Close/Merge ohne bewusste Technical-Lead-/Product-Owner-Einordnung.

---

## 7. Empfohlene nächste Arbeitsreihenfolge nach Chatwechsel

1. Neuer Chat liest Checkpoint + Continuity und verifiziert GitHub/Vercel/Supabase live.
2. Admin PR #44 Current-Main-Sync + Re-Gate + unabhängiger Review.
3. Parallel konfliktarm: Account AP-3 als neuer Slice.
4. Parallel konfliktarm: Provider S3 als neuer Slice.
5. Nach Admin Slice-A-Integration: Slice B retarget/sync + Re-Gate + Review.
6. Danach erst Admin Slice C neu beurteilen.

Shared Auth/RLS/Identity/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation-Verträge bleiben seriell unter Technical-Lead-Steuerung.

---

## 8. Harte Gates

- **Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Production-Migrationen separat freigeben.
- Provideraktivierung / Secrets / Verträge / bezahlte Calls separat freigeben.
- Kostenrahmen maximal USD 100/Monat; darüber vorher fragen.
- Kein S3/AP-3/Admin-Folgeslice still erweitern.
- Nach jedem Slice Self-Review + vollständige Gates + unabhängiger Technical-Lead-Review.
- Fortschritt dauerhaft im Repository dokumentieren.
