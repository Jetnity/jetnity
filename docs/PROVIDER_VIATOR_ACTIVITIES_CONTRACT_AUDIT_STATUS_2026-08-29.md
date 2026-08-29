# Provider Viator Activities Contract Audit — Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
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
| `origin/main` nach Re-Fetch | `69ef27b169780e41ba506a69acb15caafa645517` |
| Drift vs Task-Baseline | **0** — `behind_by=0` |
| Branch-Head vor diesem Stamp | `39d083baff82cbf591a15c26f4b8cb14ed844a9f` — nur Task-Datei |
| Merge-Base | `69ef27b1` = `origin/main` |
| Ahead / Behind vor Stamp | 1 / 0 |
| Draft-PR | #189 OPEN, Draft, `MERGEABLE` |
| Task-Head CI | Actions Run `33261056210` SUCCESS auf `39d083ba` — **gilt nicht für den neuen Head** |
| Task-Head Vercel | Preview `HZkmN5HmEb6xzhiaNbGizWEp9SpX` READY auf `39d083ba` — **gilt nicht für den neuen Head** |
| Provider / Secrets / paid calls | nicht vorhanden; nicht aufgerufen |
| Signup / API-Key | nicht ausgeführt |
| Commercial-Provenance-Mint | nicht ausgeführt |
| Production / Supabase / Vercel-Settings | nicht mutiert |

Exact Head ist der Commit dieses Stamps; live am PR prüfen.

---

## 1. Arbeitsblock

Rekonstruktion des offiziellen Viator Partner API v2-Vertrags für **affiliate-style** Tours/Activities und kleinster zukünftiger Jetnity-`activities`-Adaptervertrag. Shared-Core bleibt unverändert. Viator ist **nicht** als Production-Provider gewählt.

---

## 2. Bereits umgesetzt

- Evidence-Audit mit first-party URLs, Titeln, Dokumentdaten
- Affiliate vs Merchant vs Full+Booking strikt getrennt
- Endpoint-Matrix, Auth, Sandbox/Production, Search, Availability, IDs, Währung, Storno, Photos/Reviews, Attribution, Rate/Error, Locale, Freshness, Booking-Endpoints die Affiliates nicht brauchen
- Proposed Adapter Contract inkl. Evidence-Klassen, Fail-closed Fixtures, Transport-/Activation-Gates
- Future Foundation-Task als **Proposal**, nicht autorisiert
- Handoff + Self-Review
- `docs/ACTIVE_WORK_STATUS.md` und knapper ROADMAP-Hinweis

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
7. ADR-0078 bleibt: kein stiller Provider-Lock, Search ≠ Booking.

---

## 5. Tests / CI / Preview

Dieses Stamp ist docs-only. Vorherige Gates auf `39d083ba` sind nach Push ungültig.

Lokal in diesem Slice **nicht** behauptet: voller Unit-Suite-Lauf, Production-Build. Nicht erforderlich für Docs-only; der neue Head braucht unabhängiges Re-Gating.

---

## 6. DB / RLS / Production-Grenze

Keine Migration. Keine RLS-Änderung. Keine Supabase-Session. Production unberührt.

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

- Unabhängiger Technical-Lead Exact-Head-Review dieses Drafts
- Product-Owner: Viator als erster Activities-**Kandidat**? Nicht aus diesem PR ableiten
- Jeder spätere Foundation-/Key-/Preview-Slice extra

---

## 10. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #189. Autor setzt kein Ready, kein Merge, startet keine Foundation.

---

## 11. Zuerst lesen

1. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`
2. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_2026-08-29.md`
3. `docs/PROVIDER_VIATOR_ACTIVITIES_ADAPTER_CONTRACT_2026-08-29.md`
4. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_HANDOFF_2026-08-29.md`
5. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_SELF_REVIEW_2026-08-29.md`
6. `docs/PROVIDER_VIATOR_ACTIVITIES_ADAPTER_FOUNDATION_TASK_PROPOSAL_2026-08-29.md`
7. ADR-0078, `docs/ACTIVITIES.md`, Skyscanner-Foundation auf `main @ 69ef27b1`
