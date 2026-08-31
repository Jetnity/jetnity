# Jetnity – TW-8/TW-9 Readiness Revalidation Evidence

Stand: 31. August 2026  
Typ: **CURRENT-VS-HISTORICAL EVIDENCE / READ-ONLY**  
Agent: **Trip workspace readiness audit 1** / Generation **1**  
Baseline: `main@7f057e6ee8caddf87a3b5365731eaf43d037a114`  
Start-Head: `d051003023331578d90cf295a12de8767e0b33b7`

Live-Evidence gewinnt. Historische Docs, PR-Bodies und Statuszeilen bleiben Evidence ihres Zeitpunkts.

Diese Session hat **keine** Production-Supabase-Verbindung geöffnet, keine Secrets gelesen, keine paid calls ausgeführt und keine Provider aktiviert. Production-Katalogaussagen nach dem 30. August 2026 sind deshalb Continuity-Evidence, nicht eine neue Live-Abfrage.

---

## 1. Current Evidence – in dieser Session verifiziert

### 1.1 Git / GitHub

| Fakt | Wert | Wie verifiziert |
| --- | --- | --- |
| `origin/main` | `7f057e6ee8caddf87a3b5365731eaf43d037a114` | `git fetch origin main` + `git log -1` |
| Branch | `audit/tw8-tw9-readiness-2026-08-31` | `git status` |
| Start-Head | `d051003023331578d90cf295a12de8767e0b33b7` | `git rev-parse HEAD` vor Audit-Docs |
| Ahead / Behind | 1 / 0 gegen `origin/main` vor Audit-Docs | `git rev-list --left-right --count` |
| Issue #299 | OPEN | `gh issue view 299` |
| Draft-PR #302 | OPEN, Draft, MERGEABLE | `gh pr view 302` |
| Task-CI auf Start-Head | Typecheck/Lint/Build pass; Auth pass; Vercel READY `HjFNknr7kARrZeWmbhsYM8nPFxdN` | `gh pr checks 302` — gilt **nicht** für einen späteren Audit-Head |

### 1.2 Code auf aktuellem `main` / Merge-Base

| Befund | Evidence | Lesart |
| --- | --- | --- |
| S5-A Domainvertrag liegt im Repo | `lib/commercial-provenance/*`, ADR-0168 | erfüllt als Vertrag, nicht als Live-Quote |
| S5-B Persistenz-SQL liegt im Repo | `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql` | Schema + RLS + DEFINER-Writer |
| Runtime-Gate default `false` | SQL `production_write_path_allocated boolean not null default false` plus Singleton-Insert | Writer ist kein Production-Pfad |
| Einziger EXECUTE-Träger | `grant execute … to jetnity_commercial_writer`; revoke von `anon`/`authenticated`/`service_role` | fail-closed |
| App ruft den Writer nicht auf | `commercialPersistenzNutzlastFuerTripItem` / `commercialSnapshotFuerPersistenzMinten` nur in Tests + `persistenz.ts`; SQL-Name sonst nur Repair/Tests | **kein vertrauenswürdiger Produkt-Writer** |
| Trip-Graph liest keine Provenance | `TRIP_GRAPH_SELECT_KANONISCH` = `trip_items(*)` ohne `trip_item_commercial_provenance` (`lib/trips/foundation-e-select.ts`) | Schema existiert, Workspace sieht es nicht |
| Workspace-Preis ist Legacy | `lib/trips/detail.ts` kopiert `punkt.priceAmount` / `priceCurrency`; Flug-UI „zum Auswahlzeitpunkt“ | keine Freshness, kein Current-Quote |
| Trust-Text ist ehrlich | `herkunft-vorhanden` = „kein geprüfter Live-Nachweis“ | UI-Grenze vorhanden, ersetzt TW-8 nicht |
| User-Booking mintet keine Provenance | `planpunktBuchungsstatusSetzen` schreibt nur `booking_status` / `booking_source='user'` | Booking ≠ Commercial Truth |
| Guest→Account mintet keine Provenance | `lib/trips/handelsfelder-nutzlast.ts` | Guard bleibt |
| `booking_url` wird nicht erfunden | Legacy-Projektion ohne URL; Übernahme-Tests strippen URL | UI-Übernahmegrenze |
| Provider Production hart aus | `lib/provider-ops/zustand.ts` `VERCEL_ENV===production` → `aktiv:false` | Flight/Hotel/Activity/Mobility/Rental |
| Duffel nur Test-Token-Form | `istDuffelTestToken` verlangt `duffel_test_`; Live-Token löst Phase nicht | kein Flight-Live |
| Hotel/Activity/Mobility/Rental Factory-Zugang default `false` | jeweilige `zustand.ts` `providerVorhanden = false` | unavailable, nicht live |
| Skyscanner ist fixture-only | `lib/providers/skyscanner/flights/adapter.ts` explizit kein S5-A-Quote | kein `live_api` |
| Adapter-Core mintet keine Provenance | `lib/server/providers/core/*`; Trust-Boundary-Tests verbieten `sourceKind`/`live_api` | Transport ≠ Truth |
| Cost Guard bleibt in-memory | `providerOpsInMemoryCostGuard` | S6 Activation-Gate weiter offen |
| S4-R1 ist Official/Requirements-Ops, nicht Commercial | Closure-Checkpoint 31.08.; `requirementsProviderAus()` bleibt `null` | entsperrt TW-8 nicht |

### 1.3 Offene parallele Streams

Live über `gh pr list` / `gh pr view`:

- #300 Entry Requirements E1: nur Task-Datei.
- #301 GitHub Hygiene Phase 1: nur Task-Datei.
- #302 dieser Audit.

Keine gemeinsame Datei mit #300/#301.

### 1.4 Was diese Session bewusst nicht als Current behauptet

- Production-Katalog OID/Rowcount/ACL/Gate-Row nach dem 30. August 2026.
- Development-Supabase-Katalog.
- Vercel Production des Audit-Heads (Preview des Task-Heads ist Evidence nur für den Task-Commit).
- Ob irgendwo außerhalb des Repos ein Secret oder ein Vertrag existiert.

---

## 2. Historical Evidence – gültig für ihren Zeitpunkt, nicht blind übernehmen

### 2.1 „S5-B nicht gestartet / Production unverändert“

Gültig **vor** PR #183 / Production-Apply 29. August 2026.

Beispiele, die heute nicht mehr Current-Truth sind:

| Quelle | Historische Aussage | Current-Lesart |
| --- | --- | --- |
| `docs/ADR_0198_PROVIDER_S5B_COMMERCIAL_PROVENANCE_PERSISTENCE.md` Header | `DRAFT-PR #182 / KEINE PRODUCTION-ANWENDUNG` | #182 CLOSED ungemergt; Recovery #183 MERGED; Production-Apply-Verification existiert |
| `docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md` Header | Persistenz „nicht auf Production“ | DECISIONS.md-Nachtrag 29.08. markiert das als Pre-Apply-Evidence |
| `docs/PROVIDER_READINESS_S5A_COMMERCIAL_PROVENANCE_STATUS.md` | „Kein S5-B“ | S5-A-Review-Evidence 26.08.; S5-B kam danach |
| `docs/history/ROADMAP_PRE_PR113_2026-08-27.md` | „S5-B nicht gestartet“ | bewusst history/ |
| `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` §5.6 | „S5-B not started“ | ältere Account-Plan-Zeile; Current ROADMAP widerspricht |
| `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md` TW-8 | „Abhängigkeit: Provider S5 / reale Commercial Provenance“ | Gate-Satz bleibt gültig; der Plan datiert 27.08. und kennt den späteren S5-B-Apply nicht im Fließtext |
| `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md` | „S5-A allein öffnet TW-8 nicht“ | weiter wahr; S5-B-Persistenz allein öffnet TW-8 ebenfalls nicht |
| `docs/PROVIDER_S4_S8_PROVENANCE_AUDIT.md` | „keine Commercial-Offer-Provenance“ | 26.08. wahr; S5-A/S5-B kamen danach. Der **TW-8-Blocker** bleibt, weil reale Evidence fehlt |

### 2.2 „S5-B Persistence Foundation auf Production / TW-8 geschlossen“

Current Continuity auf `main`, nicht in dieser Session live re-queried:

| Quelle | Aussage | Klasse |
| --- | --- | --- |
| `ROADMAP.md` | S5-B Persistenz integriert; Production-Migration angewendet; Runtime-Write unallokiert; kein Snapshot; TW-8 geschlossen | current-state Doc auf diesem `main` |
| `DECISIONS.md` ADR-0168/0197/0198 Nachträge | dasselbe | current-state Doc |
| `ARCHITECTURE.md` | dasselbe, plus fälschlich noch „Draft-PR #187“ am Adapter-Core | **gemischt**: S5-B-Satz current, #187-Satz historical |
| `docs/PROVIDER_S5B_PRODUCTION_APPLY_VERIFICATION_2026-08-29.md` | Apply + Security-Verification; Gate `false`; Rowcount nicht als >0 behauptet | historische Live-Evidence 29.08. |
| `docs/PROVIDER_S5B_PERSISTENCE_STATUS_2026-08-29.md` | integriert / Provider-Runtime geschlossen | Continuity |
| `docs/SUPABASE_MIGRATION_HISTORY_REPAIR_HANDOFF_2026-08-30.md` | History-Body von Prosa-Marker auf kanonisches SQL ersetzt; Katalog unverändert; Rowcount `0`; Gate geschlossen; PR #251 MERGED; Issue #249 CLOSED | Continuity 30.08. |
| `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md` | Adapter-Core über Recovery #197 integriert | current Integration, #187 historical carrier |

### 2.3 Adapter-Core / Provider-Audits: Draft-Nummern vs Recovery-Merges

Bekanntes Muster: Draft→Ready scheitert an `Repository.fullDatabaseId`; Inhalt landet über Recovery-PR.

| Historischer Draft | Current Integration | Was integriert ist | Was nicht integriert ist |
| --- | --- | --- | --- |
| #187 Adapter Core | #197 MERGED `c5aae6b5…` | `lib/server/providers/core/*` | Provideraktivierung, Provenance-Mint |
| #188 HBX Audit | #199 MERGED | Contract-Audit-Docs | HBX-Runtime / Secrets |
| #189 Viator Audit | #200 MERGED | Contract-Audit-Docs | Viator-Runtime / Secrets |
| #190 12Go Audit | #201 MERGED | Contract-Audit-Docs; ADR-0200 **PROPOSED / NOT ACCEPTED** | 12Go-Runtime / Affiliate-Enrollment |
| #182 S5-B Persistenz | #183 MERGED `3b684f64…` | Schema + Authority | Runtime-Write, Snapshot |
| #250 History-Repair Prep | #251 MERGED | History-only Repair | kein erneutes S5-B-DDL |

`ROADMAP.md` führt #187 noch als offenen gelben Schritt. Das ist **Dokumentationsdrift auf current-state-Dateien**, die dieser Audit **nicht** still korrigiert.

Slice-Statusdateien von 12Go/HBX/Viator/AP-10 können weiter „Draft / STOP“ sagen. GitHub-Live: die Recovery-PRs sind MERGED; Runtime bleibt aus.

### 2.4 Workspace-Plan vs Workspace-Ist

| Historisch / Plan | Current auf `7f057e6e` |
| --- | --- |
| TW-1…TW-5, TW6-A/B, TW6-REST-01, TW7-A integriert | bestätigt durch ROADMAP + Slice-Status + Issue #103 CLOSED |
| TW-8 hinter Provider S5 / realer Provenance | Gate-Satz weiter verbindlich |
| TW-9 nach erforderlichen Runtime-Slices + Function-by-Function-/Intelligence-Audit | Mandate unverändert; Commercial-Funktionen können nicht geschlossen werden |
| `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md` (24.08.) „S4–S8 noch offen“, `main@b7f027ec` | historische Matrix; S5-A/S5-B und Adapter-Core kamen danach; Commercial-Zelle „S5 warten“ bleibt fachlich richtig, wenn „S5“ = reale Evidence |
| `docs/TRIP_WORKSPACE_AUDIT.md` (24.08.) | historische Workspace-Ist-Aufnahme; keine heutige Runtime-Wahrheit |
| ACTIVE_WORK_STATUS / START_HERE Anker `43177a7b` | älter als live `main@7f057e6e` (S4-R1-Closure + Entry-Requirements-Target). **Nicht in diesem Slice geändert.** |

---

## 3. Harte Unterscheidung: Schema ≠ Commercial Truth

```text
S5-A Vertrag        = wie eine Quote geprüft würde
S5-B Relation       = wo ein Snapshot liegen dürfte
S5-B Writer-SQL     = wer ihn schreiben dürfte
Runtime-Gate        = ob Production überhaupt schreiben darf
App-Writer          = ob irgendein Produktpfad den Writer aufruft
Provider-Adapter    = woher eine echte Quote käme
Freshness           = ob die Quote jetzt current/stale/unknown ist
Workspace-UI        = was der Nutzer sieht
```

Heute:

1. Vertrag: ja.  
2. Relation: ja (Repo + Continuity-Production).  
3. Writer-SQL: ja, geschlossen.  
4. Runtime-Gate: geschlossen (`false`).  
5. App-Writer: nein.  
6. Provider-Adapter: nein (nur Fixtures/Audits/Transport-Kern).  
7. Freshness: nicht anwendbar, weil keine Quote.  
8. UI: Legacy-Preis / User-Booking / ehrlicher Nicht-Live-Text.

Deshalb ist jedes „S5-B ist fertig, also TW-8“ ein Kategorienfehler.

---

## 4. Provideraktivierung / Freshness / Writer – explizite Prüfung

### 4.1 Provideraktivierung

Code-Gate: Production immer aus. Fachflags plus Zugang. Hotel/Activity/Mobility/Rental ohne Provider-Objekt. Duffel nur Test-Token-Form. Skyscanner fixture-only. 12Go/HBX/Viator nur Audit-/Contract-Docs. S4-R1 Requirements-Provider bleibt `null`.

Keine Evidence für aktive Secrets, Verträge oder paid calls. Diese Session hat das nicht widerlegt, weil sie es nicht prüfen durfte; sie hat auch keine Aktivierung gefunden.

### 4.2 Freshness

`commercialFrischheitBewerten` / `commercialZeitPruefen`: ohne `retrievedAt`+`freshUntil` bleibt Provider-Freshness `unknown`. User-Intake ist immer `unknown`. Snapshot ist nie live.

Ohne persistierte Zeile und ohne Workspace-Join gibt es keine Freshness-Aussage in der UI. Ein angezeigter Legacy-Betrag ist höchstens „zum Auswahlzeitpunkt“ bzw. User-Intake, nie `current`.

### 4.3 Writer-Grenze

Erlaubter späterer Pfad, laut Vertrag:

`provider_adapter` → S5-A-Validierung → `jetnity.commercial_persistence.v1` / `s5a_validated_snapshot` → SET ROLE Writer → DEFINER-Funktion, nur wenn Gate allokiert und `auth.uid()` Owner ist.

Heute nicht vorhanden:

- Login-Rolle mit SET ROLE auf `jetnity_commercial_runtime`;
- Gate-Flip;
- Produkt-Caller;
- Service-Role-Normalpfad (bewusst verboten).

User, Assistant/LLM, Guest→Account, `reise_anlegen` und Direct-DML sind keine Writer.

---

## 5. Traveller-Kontext

Für **diesen** Audit-Slice: **nicht relevant**. Es wird kein Credential erhoben oder ausgewertet.

Für ein späteres TW-8: relevant nur, wenn ein echter Provider Eligibility-/Dokumentregeln liefert. Route bleibt traveller-neutral. Keine Visa-/APIS-Regel erfinden. `unknown` behalten. Nicht Teil dieses Audits.

---

## 6. S4-R1 / Entry Requirements

S4-R1 ist auf diesem `main` geschlossen und betrifft Official/Requirements-Ops, nicht Commercial Provenance. Es entsperrt weder Provider-Live noch TW-8/TW-9. Parallel-Stream E1 (#300) bleibt isoliert.
