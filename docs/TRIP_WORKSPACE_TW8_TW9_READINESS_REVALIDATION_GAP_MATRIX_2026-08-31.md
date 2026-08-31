# Jetnity – TW-8/TW-9 Readiness Gap Matrix

Stand: 31. August 2026  
Typ: **GAP-MATRIX / READ-ONLY**  
Agent: **Trip workspace readiness audit 1** / Generation **1**  
Baseline: `main@7f057e6ee8caddf87a3b5365731eaf43d037a114`

Legende:

| Klasse | Bedeutung |
| --- | --- |
| `erfüllt` | auf aktuellem `main` vorhanden und für das Gate ausreichend |
| `vorbereitet` | Fundament da, aber kein ehrlicher Unlock |
| `geschlossen` | bewusst fail-closed / extra gegatet |
| `fehlt` | für das Gate nötig, nicht vorhanden |
| `blockiert` | Start verboten, bis der Blocker weg ist |
| `nicht starten` | Slice darf nicht beginnen |

`vorbereitet` ist **kein** Unlock.

---

## 1. TW-8 – Gate in Bestandteile

### 1.1 Schema / Persistenz

| ID | Bestandteil | Klasse | Evidence | Darf TW-8 öffnen? |
| --- | --- | --- | --- | --- |
| `TW8-G-SCHEMA-01` | Relation `public.trip_item_commercial_provenance` 1:1 an `trip_item_id` | `vorbereitet` | Migration `20260829140000`; Types in `types/supabase.ts` | nein |
| `TW8-G-SCHEMA-02` | RLS Owner-SELECT, kein anon, kein authenticated Direct-Write | `vorbereitet` | SQL Policy + GRANT/REVOKE; lokale Persistenz-Tests; Production-Verification 29.08. | nein |
| `TW8-G-SCHEMA-03` | Production-Migration angewendet | `vorbereitet` *Continuity, nicht re-queried* | Apply-Verification 29.08.; History-Repair #251 30.08.; ROADMAP/DECISIONS | nein |
| `TW8-G-SCHEMA-04` | History-Replay-P1 | `erfüllt` als Infra-Repair | Issue #249 CLOSED; #251 MERGED; After-Image Rowcount `0` | nein |
| `TW8-G-SCHEMA-05` | Development-Katalog = Production | `fehlt` / fremder Residual | Gate-0 Replay-Defect: `develop` hatte S5-B-Objekte nicht; dieser Audit re-queried das nicht | nein; kein TW-Thema |

### 1.2 Provenance-Vertrag

| ID | Bestandteil | Klasse | Evidence | Darf TW-8 öffnen? |
| --- | --- | --- | --- | --- |
| `TW8-G-CONTRACT-01` | S5-A fail-closed Vertrag | `erfüllt` | ADR-0168, `lib/commercial-provenance` | nein, allein nicht |
| `TW8-G-CONTRACT-02` | Actor↔Source; Assistant/LLM kein Hard-Truth | `erfüllt` | `trust.ts`, Tests | nein |
| `TW8-G-CONTRACT-03` | Freshness `current`/`stale`/`unknown` ohne erfundene Live-Availability | `erfüllt` als Vertrag | `frischheit.ts` | nein, ohne Quote nicht anwendbar |
| `TW8-G-CONTRACT-04` | Persistenz-Nutzlast `jetnity.commercial_persistence.v1` | `erfüllt` als Vertrag | `persistenz.ts` | nein |
| `TW8-G-CONTRACT-05` | Legacy-Felder keine zweite Provider-Hard-Truth | `vorbereitet` | Guard-Matrix + Guest-Nutzlast + DB-Trigger-Continuity | nein |

### 1.3 Tatsächliche vertrauenswürdige Writer

| ID | Bestandteil | Klasse | Evidence | Darf TW-8 öffnen? |
| --- | --- | --- | --- | --- |
| `TW8-G-WRITER-01` | SQL DEFINER `trip_item_commercial_provenance_schreiben` | `vorbereitet` + `geschlossen` | Migration; EXECUTE nur Writer-Rolle | nein |
| `TW8-G-WRITER-02` | `production_write_path_allocated` | `geschlossen` | default `false`; Repair/After-Image `false` | nein |
| `TW8-G-WRITER-03` | Runtime-Principal / Login-Rolle | `fehlt` / `geschlossen` | `jetnity_commercial_runtime` NOLOGIN/NOINHERIT; keine App-Zuweisung | nein |
| `TW8-G-WRITER-04` | Produkt-Caller im App-Code | `fehlt` | keine Runtime-Referenz außerhalb Tests/Repair | **Blocker** |
| `TW8-G-WRITER-05` | Service Role als Write-Pfad | `geschlossen` (verboten) | ADR-0198 | korrekt geschlossen |
| `TW8-G-WRITER-06` | User-/Guest-/LLM-Mint | `geschlossen` (verboten) | Persistenz-Mint lehnt diese Akteure ab | korrekt geschlossen |

### 1.4 Reale Provider-Evidence / Freshness

| ID | Bestandteil | Klasse | Evidence | Darf TW-8 öffnen? |
| --- | --- | --- | --- | --- |
| `TW8-G-PROV-01` | Echter Flight-Live-Pfad | `fehlt` + Production `geschlossen` | Duffel Production hart aus; nur Test-Token-Form | **Blocker** |
| `TW8-G-PROV-02` | Echter Hotel-Live-Pfad | `fehlt` | HBX nur Audit; Factory-Zugang `false` | **Blocker** |
| `TW8-G-PROV-03` | Echter Activities-Live-Pfad | `fehlt` | Viator nur Audit | **Blocker** |
| `TW8-G-PROV-04` | Echter Mobility-Live-Pfad | `fehlt` | 12Go ADR-0200 proposed, nicht accepted; keine API | **Blocker** |
| `TW8-G-PROV-05` | Skyscanner / Adapter-Core | `vorbereitet` | Fixture-Foundation + Transport-Kern; kein Mint | nein |
| `TW8-G-PROV-06` | Mindestens ein persistierter realer Snapshot | `fehlt` | After-Image Rowcount `0`; kein App-Write | **Blocker** |
| `TW8-G-PROV-07` | Secrets / Verträge / paid calls | `geschlossen` | keine Aktivierung gefunden; nicht geprüft durch Call | korrekt geschlossen |
| `TW8-G-PROV-08` | Persistenter Cost Guard (S6) | `fehlt` | nur In-Memory | Provider-Activation-Gate, zusätzlich zu TW-8 |
| `TW8-G-PROV-09` | S4-R1 Requirements-Ops | `erfüllt` in fremder Domäne | schließt Official-Timeout/Kill-Switch, nicht Commercial | nein |

### 1.5 UI-Übernahmegrenzen

| ID | Bestandteil | Klasse | Evidence | Darf TW-8 öffnen? |
| --- | --- | --- | --- | --- |
| `TW8-G-UI-01` | Workspace liest Provenance-Tabelle | `fehlt` | `trip_items(*)` ohne Join | **Blocker für ehrliche Commercial Surface** |
| `TW8-G-UI-02` | Preis nur mit Commercial Evidence | `fehlt` gegenüber Ziel-IA | Zielarchitektur: „Preis 430 CHF“ nur aus Commercial Evidence. Ist: Legacy-`priceAmount` | Gap |
| `TW8-G-UI-03` | Flugpreis als Auswahlzeitpunkt | `vorbereitet` / ehrlich-begrenzt | `TripWorkspaceDetail` „zum Auswahlzeitpunkt“ | verhindert Fake-Live, ist aber kein TW-8 |
| `TW8-G-UI-04` | Trust-Text kein Live-Nachweis | `erfüllt` als Grenze | `itemTrust` / `TRUST_TEXT` | gut, reicht nicht |
| `TW8-G-UI-05` | `booking_url` nicht erfinden | `erfüllt` | Projektion + Übernahme-Tests | gut |
| `TW8-G-UI-06` | User-`booked` ≠ Provider-Bestätigung | `erfüllt` | Booking-Action `booking_source='user'`; Trust `manuell-gebucht` | gut |
| `TW8-G-UI-07` | Search lazy / on-demand | `erfüllt` aus TW-5 | Detail startet Suche nur ausdrücklich | nicht Commercial Truth |
| `TW8-G-UI-08` | AP-10 Buchungsübersicht | `erfüllt` als Trennung | AP-10-S1 integriert; keine Preis-Wahrheit aus Planungsfeldern | nicht TW-8; Kollisionsrisiko bei späteren Preisen |

### 1.6 TW-8 Gesamt

| ID | Gate | Klasse |
| --- | --- | --- |
| `TW8-START-GATE` | Commercial Surfaces starten | **`blockiert` / `nicht starten`** |

Blocker, alle notwendig:

1. kein realer Provider-Pfad;
2. kein allokierter Runtime-Writer;
3. kein nachgewiesener persistierter Snapshot;
4. keine Workspace-Lese-Naht auf Provenance.

---

## 2. TW-9 – Voraussetzungen und verbleibende Workspace-Gaps

### 2.1 Bereits integrierte abhängige Runtime-Slices

| Slice | Klasse | Anmerkung |
| --- | --- | --- |
| TW-0 Audit / IA | `erfüllt` | historische Evidence; Ziel-IA ADR-0163 |
| TW-1 Shell | `erfüllt` | PR #56 |
| TW-2 Übersicht | `erfüllt` | PR #58 |
| TW-3 Timeline | `erfüllt` | PR #64 |
| TW-4 Aufmerksamkeit | `erfüllt` | PR #60 |
| TW-5 Item/Gap-Details | `erfüllt` | PR #66 |
| TW6-A / TW6-B / TW6-REST-01 | `erfüllt` | PR #82 / #87; Create-Entry nicht erneut öffnen |
| TW7-A Hub-Kartenidentität | `erfüllt` | PR #106; Issue #103 CLOSED |
| TW-8 Commercial | `blockiert` | dieser Audit |
| Function-by-Function-Audit | `fehlt` | Mandate verbindlich; Zeitpunkt nach erforderlichen Slices |
| Finaler Intelligence-Audit | `fehlt` | Policy verbindlich; ersetzt TW-0…TW-9 nicht und umgekehrt |

### 2.2 TW-9-Ziel gegen aktuellen Stand

| ID | TW-9-Bestandteil | Klasse | Begründung |
| --- | --- | --- | --- |
| `TW9-G-DEP-01` | Erforderliche Non-Commercial Runtime-Slices geklärt | `erfüllt` | TW-1…TW7-A integriert; kein offener TW6/TW7-Rest-Runtime aus Continuity |
| `TW9-G-DEP-02` | Commercial-Funktionen ehrlich schließbar | `blockiert` | Mandate verlangt Budget/Preise/Booking/Provider-Ports |
| `TW9-G-POLISH-01` | Mobile Dichte / A11y / Performance als Closure-Evidence | `fehlt` | kein versioniertes TW-9-Evidence-Paket |
| `TW9-G-AUDIT-01` | Function-by-Function-Inventar | `fehlt` | `docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md` |
| `TW9-G-AUDIT-02` | Intelligence-/Cross-Domain-Audit | `fehlt` | `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md` |
| `TW9-G-SCOPE-01` | Homepage / Direction A / Issue #110 | außerhalb | nicht als TW-9-Rest verbuchen |
| `TW9-G-SCOPE-02` | Entry Requirements E1 | außerhalb | paralleler Stream #300 |
| `TW9-START-GATE` | Polish + Evidence + Closure | **`nicht starten`** | Closure ohne Commercial-Wahrheit wäre Scheinabschluss |

### 2.3 Verbleibende ehrliche Workspace-Gaps, die kein TW-8/TW-9 sind

Diese Gaps existieren, entsperren aber keinen Slice aus diesem Audit:

| Gap | Warum nicht dieser Folgeslice |
| --- | --- |
| Legacy-Preis kann als „aktuell“ gelesen werden, obwohl Trust-Text widerspricht | Produkt-/UX-Härte für einen späteren TW-8, nicht jetzt umbauen |
| Stale ROADMAP/#187-Zeile und ADR-0198-Header | globale Current-State-Drift; nicht in diesem Audit still patchen |
| ACTIVE_WORK_STATUS/START_HERE Anker hinter `7f057e6e` | fremde Continuity; Non-Scope |
| Development-vs-Production Schema-Drift Residual | Infra, nicht TW |
| S6 persistenter Cost Guard | Provider-Activation, nicht Workspace-Polish |
| Real-Device P2 Search Safari | Search/Homepage, nicht TW-9-Closure |

---

## 3. Empfohlene Reihenfolge nach diesem Audit

```text
unabhängiger TL-Review #302
        │
        ▼
TW-8 bleibt BLOCKED
TW-9 bleibt BLOCKED
        │
        ▼
erster realer Provider-Pfad
  + Runtime-Write-Allocation
  + mindestens ein serverseitiger Snapshot
        │
        ▼
erst dann eigener TW-8-Auftrag
        │
        ▼
erst dann TW-9 Closure + Function-by-Function + Intelligence-Audit
```

Kein automatischer Schritt aus #302.
