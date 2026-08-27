# Jetnity – Technical-Lead Live-Rekonstruktion – 27. August 2026

Stand: 27. August 2026  
Typ: **Technical-Lead Live-Evidence / Continuity**  
Status: **REKONSTRUKTION ABGESCHLOSSEN – KEIN FEATURE AUTOMATISCH GESTARTET**

Dieser Checkpoint wurde nach vollständiger kanonischer Lektüre und erneuter Live-Verifikation erstellt. Er überschreibt keine Historie. Bei Widerspruch gewinnt weiterhin Live-Evidence.

## 1. Exakter GitHub-Live-Stand

- Repository: `Jetnity/jetnity`
- `origin/main`: `45be14b1077589953d5dbf21f569311c9a4b59f7`
- Commit: `Merge PR #96: post-PR94 continuity`
- GitHub Actions auf exakt diesem `main`: Run `33073970923` – **SUCCESS**
- `main` Branch Protection: **nicht aktiviert** (`protected=false`)
- Repository Rulesets: **keine**
- Remote-Branches live: **111**; diese Zahl ist Hygiene-Evidence, keine Löschfreigabe.

### Offene Pull Requests

Genau sechs offene PRs; alle sind Drafts:

| PR | Head | Einordnung |
| --- | --- | --- |
| #88 | `audit/project-sanitation-inventory-2026-08-26` @ `a5fbaa6d` | jüngster non-destructive Audit; 2 docs-only Dateien; **2 ahead / 71 behind** gegen live `main`; alte PASS/DEFER-Evidence bleibt nützlich, aber Audit-Zahlen sind inzwischen teilweise stale |
| #52 | `docs/chatgpt-technical-lead-handoff-2026-08-24` | historische Continuity; **67 ahead / 420 behind**; nicht als Current Truth mergen |
| #50 | `cursor/s1-merged-status-f23f` | historische Provider-Continuity; **3 ahead / 423 behind** |
| #40 | `audit/admin-platform` | historischer Admin-Audit; **15 ahead / 429 behind** |
| #39 | `audit/account-platform` | historischer Account-Audit; **11 ahead / 429 behind**; enthält u. a. den alten `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`, aber nicht aktuelle Runtime-Wahrheit |
| #28 | `feat/trip-collaboration-foundation` | historischer Collaboration-Draft; **1 ahead / 495 behind** |

- Offene Inline-Review-Threads auf diesen sechs Drafts: **0**.
- Relevante alte Audit-Branches für Traveller, Provider, Admin, Growth und QS liegen jeweils **0 ahead** von `main`; ihre Arbeit ist integriert/overtaken und nicht operativ aktiv.
- Keine dieser alten Branches wird blind rebased, gemergt, gelöscht oder als neuer Ausgangspunkt verwendet.

## 2. Vercel-Live-Stand

- Team: Jetnity (`team_fgOHJvth4GbXnyclxk95GQul`)
- Projekt: `jetnity-app` (`prj_wTTVawPItEO7a4HihEmaU3PsuaXM`)
- aktuelles Production-Deployment: `dpl_HLnp7hK155B6dEKMo3uu11P17aji`
- Git SHA: exakt `45be14b1077589953d5dbf21f569311c9a4b59f7`
- Target: `production`
- Zustand: **READY**
- Alias-Fehler: keiner
- Runtime-Error-Cluster im geprüften aktuellen Zeitraum: **keine**
- offene Vercel-Toolbar-Threads: **0**

PR #88 hatte auf seinem Exact Head `a5fbaa6d...` sowohl GitHub Actions SUCCESS als auch Vercel Preview READY. Diese Evidence macht seinen heute 71 Commits alten Audit-Diff aber nicht automatisch mergefähig.

## 3. Supabase-Live-Grenzen

### Production

- Projekt: `qscbgcdmivbbnzrcyegn`
- Region: `eu-central-2`
- Zustand: **ACTIVE_HEALTHY**

### Development

- Branch/Project-Ref: `yfvbxvijcorffwxbxahl`
- Zustand: **ACTIVE_HEALTHY**

### Separates Top-Level-Projekt

- `jrixsujkzvlvglvcmtia` / `jetnity-bets` existiert weiterhin separat und wurde nicht verändert.

## 4. TW6-B / Production Gate B – Live-Wahrheit

Production enthält live alle vier Gate-B-Migrationen:

- `20260826220000_trip_day_stage_assignment_source`
- `20260826230000_trip_day_stage_assignment_source_fail_closed`
- `20260826240000_trip_day_stage_assignment_mode`
- `20260827010000_reise_anlegen_zero_stage_fail_closed`

Read-only Verifikation:

- `day_stage_assignment_mode` ist `NOT NULL`
- historischer Default: `legacy_fallback`
- vorhandene vier Trips sind historische `legacy_fallback`-Bestände
- Flight-Guard-Trigger existiert einmal und ist aktiv
- `reise_anlegen(jsonb)` ist `SECURITY INVOKER`
- `authenticated` darf ausführen; `anon` nicht
- Zero-Stage-Pfad ist fail-closed über `_stage_count < 1`
- alter `<= 1`-Pfad ist nicht vorhanden
- progressive Multi-Destination-/Stage-Create-Semantik ist live

**Folge:** ältere Aussagen in `docs/TRIP_WORKSPACE_TW6_GATE_B_PREP_STATUS.md`, Gate B sei noch nicht angewendet/blockiert, sind **historical / superseded**. Keine Gate-B-Migration erneut anwenden.

## 5. Traveller / Multi-Citizenship / Multi-Document

Foundation E ist live auf Production vorhanden. RLS ist auf den relevanten Trip-/Traveller-Tabellen aktiv.

Kanonisch bleibt:

> Eine Person → mehrere Staatsbürgerschaften → mehrere Dokumente/Credentials → kontextabhängige zulässige Optionen.

- kein Default-Pass
- keine Default-Citizenship
- Issuer Country != Citizenship
- P1-TA-02 wurde durch PR #84 integriert/geschlossen
- **P2-TA-06** bleibt offen: latenter Legacy-Fallback `documents[0]`, derzeit kein belegter aktueller App-P1
- AP-7 Account-Traveller-Registry bleibt Shared-Contract-Gate und wird nicht still gestartet

## 6. Provider / Commercial Truth

- S1–S3 integriert
- S5-A Commercial Provenance integriert
- S5-B **nicht gestartet**
- keine Provideraktivierung
- keine Production-Secrets
- keine paid provider calls
- TW-8 bleibt deshalb nicht automatisch freigegeben

## 7. Security – verbleibender Production-P1

Der Admin-AAL2-**Application Guard** ist auf `main` integriert. Der Admin-AAL2-**Data Layer** ist in Production jedoch nicht aktiv.

### Live Production

- `public.aktuelles_admin_aal2()` existiert **nicht**
- administrative Capabilities prüfen aktuell nur Mindestrollen:
  - `darf_betrieb_lesen()` → mindestens `moderator`
  - `darf_betrieb_eingreifen()` → mindestens `operator`
  - `darf_konten_verwalten()` → mindestens `moderator`
  - `darf_inhalte_moderieren()` → mindestens `moderator`
  - `darf_konfiguration_verwalten()` → mindestens `admin`
- sensitive Tabellen wie `payments`, `refunds`, `blocked_ips`, `security_events`, `stripe_webhooks` und `model_usage` hängen per RLS an diesen Capabilities.
- mehrere Admin-`SECURITY DEFINER`-RPCs sind für `authenticated` ausführbar und prüfen intern dieselben Capabilities.

Damit kann eine **privilegierte AAL1-Sitzung** den Application-Guard technisch umgehen und direkte PostgREST/RPC-Pfade benutzen. Das betrifft keine normale `user`-Rolle, ist aber ein echtes Assurance-Bypass-Risiko für privilegierte Rollen.

**Klassifikation: P1 – Production Admin AAL2 Data-Plane Gap.**

### Development

Development besitzt AAL2-Data-Plane-Semantik live:

- `aktuelles_admin_aal2()` vorhanden
- alle fünf administrativen Capabilities verlangen zusätzlich AAL2

### Migration-History-Drift

- Repository-Datei: `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`
- Development-Migration-History führt dieselbe fachliche Migration als Version `20260826052735_admin_aal2_data_plane`
- Production führt **keine** dieser AAL2-Versionen.

Vor einem Production-Apply muss diese Historie forward-only reconciled werden. **Keine Production-Migration wurde in dieser Rekonstruktion angewandt.**

Der Production-Apply bleibt ein ausdrückliches Product-Owner-Gate gemäß kanonischer Governance.

## 8. Supabase Advisor-Restpunkte

Security-Advisors melden weiterhin u. a.:

- öffentliche bzw. authenticated GraphQL-Sichtbarkeit mehrerer Tabellen;
- authenticated-executable `SECURITY DEFINER`-Funktionen.

Diese Advisor-Meldungen wurden nicht pauschal als Datenleck interpretiert. Die relevanten RLS-/Capability-Pfade wurden semantisch gelesen. Der konkrete AAL2-Bypass für privilegierte AAL1-Sitzungen ist der daraus bestätigte P1.

Performance-Advisors melden u. a. unindexed Foreign Keys und ungenutzte Indizes. Kein automatischer Production-Index-/Cleanup-Write wurde gestartet.

## 9. TW-7 Gate – unabhängige Live-Prüfung

AP-3 ist integriert. Der Hub-/Workspace-Weg ist bereits wesentlich korrekt:

- `/account` verlinkt die nächste/aktive Reise direkt auf `/reisen/[tripId]`
- `/reisen` ist dieselbe Adresse für Gast und Konto
- Kontoreisen verlinken direkt auf `/reisen/[tripId]`
- Gastreise verlinkt direkt auf `/reisen/[tripId]`
- `/reisen/[tripId]` entscheidet nur die Ablage/Ownership-Grenze
- Gast und Konto rendern beide den gemeinsamen `TripWorkspace`
- Guest-One-Trip CTA ist fail-fast: vorhandene Gastreise → `Reise fortsetzen`, kein paralleler zweiter Create

**TW-7 darf diese Architektur nicht neu bauen.**

Es gibt aber einen belegten Rest-Gap:

- `TripSummary` enthält nur `stageCount`, keine Stage-/Zielidentität
- `Reisekarte` zeigt Titel, Herkunft, Zeitraum, Personen, Tage/Punkte, aber keine tatsächlichen Multi-Destination-Ziele
- die verbindliche Transformation Scope Policy verlangt ausdrücklich, dass Multi-Destination auf Reisekarten verständlich erkennbar ist und Hub/Workspace dieselbe Reise-Wahrheit zeigen

Damit ist das Account-/Hub-Start-Gate für einen **kleinen read-only TW-7-Hub-Anschluss-Slice** fachlich erfüllt. AP-4/Archiv, AP-7/Traveller Registry, Auth/RLS/DB-Write und zweite Reise-Lifecycle-Logik bleiben Non-Scope.

## 10. Reihenfolge nach dieser Rekonstruktion

### Operativ zuerst

**P1 Admin AAL2 Production Data-Plane Reconciliation / Gate.**

- nur vorbereiten/reviewen, solange keine aktuelle ausdrückliche Product-Owner-Freigabe für den Production-Apply vorliegt
- Migration-History forward-only klären
- keine stillen RLS-/Rollen-/Identity-Erweiterungen

### Nächster fachlich zulässiger Produktslice danach

**TW-7 – Hub-Anschluss, eng geschnitten.**

Ziel nur:

- Hub/Reisekarte zeigt kanonische Multi-Destination-Reiseidentität verständlich
- bestehender `/account` → `/reisen` → `/reisen/[tripId]` → `TripWorkspace`-Weg bleibt erhalten
- Guest/Account dieselbe fachliche Darstellung
- keine neue Workspace-State-Machine
- kein AP-4, AP-7, S5-B, TW-8, Homepage, Provider-live oder Production-Write

### Nicht automatisch starten

- TW-8
- TW-9
- AP-4/AP-7
- S5-B
- Homepage-Hero-Multi-Destination
- Direction A
- Public Indexing / Domain Cutover
- Provider-live

## 11. Risiko-Einordnung

### P0

Keine neuen P0 live gefunden.

### P1

- **P1-AAL2-PROD-01:** privilegierte AAL1-Sitzung kann den App-AAL2-Guard über direkte DB/API-Capability-Pfade umgehen, solange Production-Data-Layer nicht aktiv ist.

### P2

- `main` ohne Branch Protection / Ruleset – Governance-/Accidental-Write-Risiko; vor Launch zwingend härten.
- P2-TA-06 `documents[0]` Legacy-Fallback.
- Reisekarten zeigen Multi-Destination-Zielidentität nicht.
- weitere bekannte QS-/Supabase-Advisor-Härtungen bleiben priorisierbar, aber nicht blind vorziehen.

### P3 / Hygiene

- 111 Remote-Branches; keine Löschfreigabe.
- PR #88 Inventur ist inzwischen teilweise stale und darf nicht unverändert als Current Hygiene Truth integriert werden.
- AAL2 Development-Migration-Version driftet gegenüber Repo-Dateiname.

## 12. STOPP / Governance

Diese Rekonstruktion hat:

- keine Runtime geändert;
- keine Production-Migration angewandt;
- keine RLS-/Ownership-/Auth-/Traveller-Verträge verändert;
- keinen Provider aktiviert;
- keine Secrets oder paid calls angelegt;
- keinen Cursor-Feature-Agent automatisch gestartet;
- keinen alten Draft gemergt oder gelöscht.

Nächste Technical-Lead-Aktion: P1-AAL2-Production-Reconciliation als eigenes Gate vorbereiten und unabhängig prüfen. Production-Apply erst nach ausdrücklicher Product-Owner-Freigabe. Danach TW-7 als kleinen Hub-Anschluss-Slice vergeben.