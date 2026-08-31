# Jetnity – TW-8/TW-9 File-Overlap- und Merge-Risikomatrix

Stand: 31. August 2026  
Typ: **FILE-OVERLAP / MERGE-RISK / READ-ONLY**  
Agent: **Trip workspace readiness audit 1** / Generation **1**  
Baseline: `main@7f057e6ee8caddf87a3b5365731eaf43d037a114`

Dieser Audit ändert nur eigene TW-Audit-Dokumente. Die Matrix gilt für **spätere** TW-8/TW-9-Slices und für Parallelität jetzt.

---

## 1. Dateien dieses Audits

Erlaubt und ausschließlich Eigentum von #302 / Issue #299:

| Datei | Rolle |
| --- | --- |
| `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_TASK_2026-08-31.md` | Auftrag (bereits auf Branch-Start) |
| `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_STATUS_2026-08-31.md` | Verdict |
| `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_EVIDENCE_2026-08-31.md` | Current vs Historical |
| `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_GAP_MATRIX_2026-08-31.md` | Gates |
| `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_FILE_OVERLAP_2026-08-31.md` | diese Datei |
| `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_SELF_REVIEW_2026-08-31.md` | Self-Review |
| `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_HANDOFF_2026-08-31.md` | Handoff |

Kein Runtime-, Schema-, Shared-Contract- oder globale Current-State-Datei.

---

## 2. Parallelstreams jetzt – Live-Overlap

| Stream | PR | Live-Dateien 31.08.2026 | Overlap mit #302 | Overlap mit späterem TW-8 Runtime |
| --- | --- | --- | --- | --- |
| Entry Requirements E1 | #300 Draft | `docs/ENTRY_REQUIREMENTS_DETAIL_CONTRACT_E1_TASK_2026-08-31.md` | **keine** | gering, solange E1 nur Requirements-Docs/Contracts bleibt |
| GitHub Hygiene Phase 1 | #301 Draft | `docs/GITHUB_HYGIENE_PHASE1_AUDIT_TASK_2026-08-31.md` | **keine** | keine, außer jemand schreibt globale Current-State-Dateien |
| Dieser Audit | #302 Draft | nur TW8/TW9-Revalidation-Docs | — | Docs-only |

Regel aus dem Task: E1- und Hygiene-Dateien nicht berühren. Eingehalten.

---

## 3. Harte Verbotsflächen für diesen und jeden unmittelbaren Folgeslice

| Fläche | Dateien / Bereich | Risiko wenn angefasst |
| --- | --- | --- |
| Globale Current-State | `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md` | Continuity-Kollision mit S4-R1/E1; **Non-Scope** |
| Build-Order / Handoff | `ROADMAP.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `JETNITY_HANDOFF.md`, `docs/JETNITY_BINDING_BUILD_ORDER.md` | stiller Current-State-Rewrite; #187-Drift nicht hier „mitreparieren“ |
| Shared Traveller / Requirements | `lib/readiness/*`, `docs/ENTRY_REQUIREMENTS_*`, Traveller-Contracts | E1-Kollision; Product-Gate |
| Auth / RLS / AAL / Migration | `supabase/migrations/*`, Auth-Guards | Product-Owner-Gate |
| Commercial Writer / Mint | `lib/commercial-provenance/persistenz.ts` Write-Pfad, SQL-Funktion, Repair | würde TW-8 vortäuschen |
| Provideraktivierung | `lib/*/zustand.ts`, Secrets, Factory-Wiring | paid-call-/Vertrags-Gate |
| AP-10 Preise | `lib/account/buchungen*.ts`, `app/account/bookings/*` | zweite Preiswahrheit |

---

## 4. Wahrscheinliche spätere TW-8-Runtime-Flächen

Nur Inventar. **Kein Auftrag, diese Dateien jetzt zu ändern.**

### 4.1 Workspace-UI / Ableitung

| Datei | Warum TW-8 sie später brauchen könnte | Fremde Eigentümer / Risiko |
| --- | --- | --- |
| `components/trips/TripWorkspaceDetail.tsx` | Preis-/Freshness-Anzeige | TW-5 Bestand; A11y/Polish-TW-9 |
| `components/trips/TripWorkspacePlan.tsx` | Timeline-Preis | TW-3/TW-5 |
| `components/trips/TripWorkspaceJetztWichtig.tsx` | keine Fake-Preis-Attention | TW-4 |
| `lib/trips/detail.ts` | `priceAmount` ohne Provenance; Trust-Text | Kern TW-5 |
| `lib/trips/abbildung.ts` | Legacy `price_*` Mapping | Graph-Contract |
| `lib/trips/daten.ts` / `foundation-e-select.ts` | Select-String; Provenance-Join wäre hier | Foundation E Expand/Contract |
| `types/trips.ts` | Item-Felder | Shared Trip-Typ |
| `lib/trips/schema.ts` | Nutzlast / booking_url | Guest/Account Create |
| `lib/trips/aktionen.ts` | darf nicht minten | Booking-Status-Owner |
| `lib/trips/handelsfelder-nutzlast.ts` | Guest→Account Guard | Account-Übernahme |
| `lib/trips/uebernahme.ts` | Übernahme-Grenze | Guest→Account |

### 4.2 Commercial-Vertrag

| Datei | Späterer TW-8-Bezug | Nicht tun |
| --- | --- | --- |
| `lib/commercial-provenance/*` | Lesen/Bewerten einer vorhandenen Zeile | Vertrag nicht umdeuten; nicht aus UI minten |
| `types/supabase.ts` `trip_item_commercial_provenance` | typed read | keine Write-Grants |
| `supabase/migrations/20260829140000_*.sql` | Referenz | keine neue Migration aus TW-8 ohne Gate |

### 4.3 Search / Domain-Übernahme

| Datei | Risiko |
| --- | --- |
| Flight/Hotel/Activity/Mobility/Rental Suche + Nachweis | Client-Offer als `current` übernehmen |
| `lib/flights/nutzlast.ts` / Domain-`nachweis.ts` | zweite Truth neben S5-A |
| `lib/providers/skyscanner/*` | Fixture als Live-Quote |
| `lib/server/providers/core/*` | Transport mit Trust-Feldern vermischen |

### 4.4 Account-Nachbar

| Datei | Risiko |
| --- | --- |
| `lib/account/buchungen.ts` und UI | AP-10-S1 hat Preise bewusst getrennt. TW-8 darf dort keine Legacy-Beträge als Current einziehen. |
| Hub `Meine Reisen` / TW7-A Karten | keine Preise auf die Karte ziehen (TW-7 Non-Scope bleibt) |

---

## 5. Wahrscheinliche spätere TW-9-Flächen

| Fläche | Typische Dateien | Kollision |
| --- | --- | --- |
| Polish / Dichte | `components/trips/TripWorkspace*.tsx` | hoch mit TW-8, wenn parallel |
| A11y / Fokus / Sheets | dieselben | hoch mit TW-8 |
| Evidence-Docs | `docs/TRIP_WORKSPACE_*AUDIT*` | mittel; Mandate-Dateien nicht umschreiben |
| Create-Entry Rest | `/planen`, `TripPlanner` | nur wenn jemand TW-6 wieder öffnet; Continuity sagt REST geschlossen |
| Real-Device | keine Repo-Datei | kein File-Overlap, aber Abnahme-Gate |

TW-8 und TW-9 dürfen **nicht** parallel dieselben Workspace-Komponenten schreiben.

---

## 6. Historische offene Drafts – nicht mergen-verwechseln

| PR | Stand live | File-Risiko |
| --- | --- | --- |
| #52 Technical-Lead-Handoff 24.08. | OPEN Draft, alt | globale Docs; nicht als current `main` lesen |
| #50 S1 merged-status | OPEN Draft, alt | Provider-Docs-Drift |
| #40 Admin Audit | OPEN Draft, alt | Admin-Docs |
| #39 Account Audit | OPEN Draft, alt | Account-Plan-Zeilen inkl. historischem „S5-B not started“ |
| #28 Collaboration | OPEN Draft, alt | außerhalb |

Diese PRs sind nicht Teil von #302. Ein späterer TW-Slice darf sie nicht als Live-Contracts behandeln.

---

## 7. Shared-Contract-Kollisionen

| Vertrag | Owner | TW-8 darf | TW-8 darf nicht |
| --- | --- | --- | --- |
| S5-A Commercial Provenance | Provider / ADR-0168 | lesen, anzeigen, unknown behalten | Felder erfinden, LLM-Truth, Conversion |
| S5-B Writer-Authority | Provider / ADR-0198 | nur nach extra Gate und echtem Snapshot | Gate flippen, Service Role, Client-Mint |
| Adapter Core ADR-0199 | Provider | Transport später nutzen | `sourceKind`/`live_api` im Kern setzen |
| Trip-Graph / Foundation E Select | Trip / Traveller | optionalen Provenance-Read additiv | Legacy-Select-Vertrag zerbrechen |
| Booking-Status | Trip + AP-10 | User-`booked` getrennt halten | als Provider-Bestätigung verkaufen |
| Official / Entry Requirements | Requirements / E1 | ignorieren oder nur als Nicht-Commercial | Visa/Preis mischen |
| Guest-One-Trip / Übernahme | Account/Trip | Guard behalten | Provenance aus Guest-JSON |

---

## 8. Merge-Reihenfolge-Empfehlung

1. #302 docs-only nach unabhängigem TL-PASS mergen **oder** schließen – nur TL, nicht dieser Agent.  
2. #300 und #301 unabhängig weiterführen; keine gemeinsamen Dateien.  
3. Kein TW-8-Runtime-Branch, solange Writer/Provider/Snapshot fehlen.  
4. Wenn TW-8 später startet: eigener Branch, nicht parallel zu TW-9, nicht parallel zu E1-Shared-Contracts, nicht gegen offene Hygiene-Rewrites globaler Docs.  
5. Globale Current-State-Updates (`ROADMAP` #187-Drift, ADR-0198-Header) gehören in einen bewusst versionierten Continuity-Slice, nicht in TW-8.

---

## 9. Residual-Risiko dieses Docs-only-PRs

Niedrig:

- nur neue `docs/TRIP_WORKSPACE_TW8_TW9_READINESS_REVALIDATION_*`-Dateien;
- keine Änderung an `ACTIVE_WORK_STATUS` / `JETNITY_START_HERE`;
- keine Änderung an E1/Hygiene;
- `next-env.d.ts` Arbeitsbaum-Noise nicht committen.
