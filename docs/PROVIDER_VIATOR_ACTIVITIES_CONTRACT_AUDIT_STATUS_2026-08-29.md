# Provider Viator Activities Contract Audit — Status

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5463714237 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider viator audit 1`  
Auftrag: `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Branch: `audit/provider-viator-activities-contract-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/189

> Docs/Evidence/Contract-Prep only. Keine Runtime. Kein Ready. Kein Merge. Kein Folgeslice. Agent-Self-Review ist kein PASS.

---

## 0. Live-Rekonstruktion

Erneut `origin/main` gefetcht vor diesem Stamp.

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `69ef27b169780e41ba506a69acb15caafa645517` — `Integrate Skyscanner Flights offline adapter foundation` |
| Reviewed Head vor diesem Fix | `dbfe76cecc60c8d7b14d3fa72455923b59fea2fe` |
| TL CHANGES REQUIRED | Kommentar `5463714237` auf Exact Head `dbfe76ce` (Continuity Isolation). Vorher `5463644138` auf `51eac518` bleibt geschlossen. |
| `origin/main` nach Re-Fetch | `f80a7f0b9e517e60c893ed80ff80b3c1b4cd9eb3` — Checkpoint V2 + post-landing stabilize; **nicht** in diesen Branch gemergt |
| Merge-Base | `69ef27b1` = Task-Baseline |
| Drift vs Task-Baseline | `origin/main` **ahead 4** (docs-only current-state). Dieser Fix rebased/merged nicht. |
| Draft-PR | #189 OPEN, Draft |
| Prior Exact-Head CI | Actions Run `33264512282` SUCCESS auf `dbfe76ce` — **gilt nicht für den neuen Head** |
| Prior Exact-Head Vercel | Preview `CQ5N2KEV1bQKKppj7yg5PGVV44h7` SUCCESS auf `dbfe76ce` — **gilt nicht für den neuen Head** |
| Provider / Secrets / paid calls | nicht vorhanden; nicht aufgerufen |
| Signup / API-Key | nicht ausgeführt |
| Commercial-Provenance-Mint | nicht ausgeführt |
| Production / Supabase / Vercel-Settings | nicht mutiert |

Exact Head ist der Commit dieses Stamps; live am PR prüfen.

---

## 1. Arbeitsblock

Rekonstruktion des offiziellen Viator Partner API v2-Vertrags für **affiliate-style** Tours/Activities und kleinster zukünftiger Jetnity-`activities`-Adaptervertrag. Shared-Core bleibt unverändert. **Viator ist das akzeptierte erste Activities-Target**; nicht Production-aktiviert. GetYourGuide später. S5-B-Persistenz ist auf Production angewendet; Runtime-Write-Path bleibt geschlossen.

---

## 2. Bereits umgesetzt

- Evidence-Audit mit first-party URLs, Titeln, Dokumentdaten
- Affiliate vs Merchant vs Full+Booking strikt getrennt
- Endpoint-Matrix, Auth, Sandbox/Production, Search, Availability, IDs, Währung, Storno, Photos/Reviews, Attribution, Rate/Error, Locale, Freshness, Booking-Endpoints die Affiliates nicht brauchen
- Proposed Adapter Contract inkl. Evidence-Klassen, Fail-closed Fixtures, Transport-/Activation-Gates
- Future Foundation-Task als **Proposal**, nicht autorisiert
- Handoff + Self-Review
- Review-Fix `5463644138`: grobe Viator-first-Zielwahl nicht erneut öffnen; S5-B-Persistenz-Apply im **Adapter-Vertrag/Audit** als erledigt führen
- Review-Fix `5463714237`: `#189` nimmt globale Current-State-Pointer nicht; `docs/ACTIVE_WORK_STATUS.md` auf Task-Baseline zurückgesetzt; ROADMAP nur ein nicht-autoritativer Parallel-Hinweis. Checkpoint V2 bleibt Authority und wird hier nicht umgeschrieben.

Keine Runtime-Datei. Keine Shared-Core-Datei. `next-env.d.ts` Working-Tree-Noise nicht committed.

---

## 3. Nicht umgesetzt / bewusst draußen

- Adapter-Code, Fixtures auf Disk, Tests
- Shared-Core- oder `lib/activities/*`-Edits
- ADR als angenommene Entscheidung
- Signup, Keys, Sandbox-Calls
- Commercial Provenance write/mint
- TW-8, Provider-Aktivierung, Production
- GetYourGuide-Gegenaudit
- Destination-Resolver-Daten

---

## 4. Verbindliche Lesart

1. **Current API Truth = Partner API v2** (`docs.viator.com/partner-api/technical/`, last update 18 Aug 2026).
2. Affiliate-v1-Spec ist historisch (last update 26 May 2022).
3. Zielklasse des Vorschlags: **Full-access Affiliate**, nicht Merchant, nicht Full+Booking.
4. Preview/`fromPrice`/Schedules ≠ Live-Quote.
5. Fixture ≠ `live_api` / `persisted_snapshot` / Affiliate-present.
6. `productUrl` unverändert oder gar nicht als Attribution.
7. ADR-0078 bleibt Domain-Architektur (Search ≠ Booking, kein Vendor-Lock). Die grobe Target-Wahl **Viator first / GetYourGuide später** ist Current-State und kein offenes PO-Gate.
8. S5-B-Persistenz-Migration `20260829140000_trip_item_commercial_provenance` ist Production-angewendet. Offenes Commercial-Gate = Runtime-Write-Path/Principal + echte Provider-Antwort + trusted Write. TW-8 bleibt geschlossen.

---

## 5. Tests / CI / Preview

Dieses Stamp ist docs-only. Vorherige Gates auf `39d083ba` sind nach Push ungültig.

Lokal in diesem Slice **nicht** behauptet: voller Unit-Suite-Lauf, Production-Build. Nicht erforderlich für Docs-only; der neue Head braucht unabhängiges Re-Gating.

---

## 6. DB / RLS / Production-Grenze

Dieser Slice ändert keine Migration und mutiert Production nicht. Die bereits verifizierte Production-Migration `20260829140000_trip_item_commercial_provenance` wird **nicht** erneut angewendet. `production_write_path_allocated` bleibt `false`.

---

## 7. Kosten / Provider / Secrets

0. Keine neuen laufenden Kosten. Kein Key. Commission-Satz unbekannt (`VIA-UNK-11`). Ob Search-Calls paid sind, unbekannt (`VIA-UNK-12`).

---

## 8. Risiken / Review-Funde

Siehe Audit §19–§20. Höchste fachliche Kanten:

- P2 vs P9 Test-Host-Widerspruch
- Sprachen zh/ko Affiliate vs Merchant
- `placeId` → `destinationId` unbelegt
- `/availability/check` Usage-Rule vs Affiliate-Redirect
- Währung auf Jetnity ≠ Währung auf viator.com nach Klick

---

## 9. Offene Freigaben

- Unabhängiger Technical-Lead Exact-Head-**Re-Review** dieses Drafts nach `5463714237`
- Kein erneutes PO-Gate „darf Viator first sein?“
- Getrennte PO-Gates bleiben: Signup/Zugang/Vertrag, Credentials/paid calls, Production-Aktivierung, Full+Booking/Merchant
- Foundation-/Key-/Preview-Slices extra; nicht aus #189 starten

---

## 10. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-**Re-Review** von Draft-PR #189 auf dem neuen Head. Autor setzt kein Ready, kein Merge, startet keine Foundation.

---

## 11. Zuerst lesen

1. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`
2. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_2026-08-29.md`
3. `docs/PROVIDER_VIATOR_ACTIVITIES_ADAPTER_CONTRACT_2026-08-29.md`
4. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_HANDOFF_2026-08-29.md`
5. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_SELF_REVIEW_2026-08-29.md`
6. `docs/PROVIDER_VIATOR_ACTIVITIES_ADAPTER_FOUNDATION_TASK_PROPOSAL_2026-08-29.md`
7. `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-29_V2.md` §7–§9 (auf `origin/main`)
8. ADR-0078 / `docs/ACTIVITIES.md` als Domain-Architektur-Evidence, nicht als offenes Target-Wahl-Gate
9. `docs/PROVIDER_S5B_PRODUCTION_APPLY_VERIFICATION_2026-08-29.md`
