# Provider HBX Hotels Contract Audit — Handoff

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5463638059 + 5463717117 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/188  
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`

Dieser Handoff übergibt den kombinierten Review-Fix gegen `5463638059` (Evidence/Current-State **in HBX-Docs**) und `5463717117` (Parallel-Workstream-Isolation). Er startet keinen Folgeslice. Agent-Self-Review ist kein PASS. Prior-Heads `68e98f7c`, `dfe63a32` und `16d7b006` gelten nicht für den neuen Head.

---

## 1. Was dieser Agent getan hat

1. S5-B-Unterscheidung **nur** in den dedizierten HBX-Docs: Persistenz-Foundation auf der Task-Baseline Production-verifiziert (`20260829140000`); offen bleiben Runtime-Write-Pfad, realer Snapshot, TW-8.
2. Portfolio-Evidence **nur** in den dedizierten HBX-Docs: 173k / 250k / 300k first-party Drift, keine kanonische Wahl.
3. Booking.com Search/Look/Redirect bleibt, mit first-party Demand-API-Zitat B1 in den HBX-Docs.
4. Isolation `5463717117`: alle #188-Edits an globalen Current-State-Pointern, ROADMAP, Hotel-Strategie, Binding Build Order und kanonischen S5-A/S5-B-ADR-/Architecture-Dateien auf `origin/main` zurückgesetzt.

Dieser PR besitzt danach nur:

- `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`
- `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_2026-08-29.md`
- `docs/PROVIDER_HBX_HOTELS_ADAPTER_CONTRACT_2026-08-29.md`
- `docs/PROVIDER_HBX_HOTELS_ADAPTER_FOUNDATION_TASK_PROPOSAL_2026-08-29.md`
- dieser Handoff, Status, Self-Review

Nicht getan: Runtime, Shared-Core, Signup, Keys, Secrets, HTTP, Mint, Production, Ready, Merge. Kein erneutes Ownership von `JETNITY_HANDOFF.md`, `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `docs/JETNITY_BINDING_BUILD_ORDER.md`, `docs/HOTEL_PROVIDER_STRATEGY.md`, `DECISIONS.md` oder S5-ADRs.

`origin/main` vor Handoff: `f80a7f0b9e517e60c893ed80ff80b3c1b4cd9eb3`. Merge-Base bleibt Task-Baseline `69ef27b1`. **Behind = 4** (Checkpoint-only). Kein Rebase. Exact Head = Commit dieses Stamps; live am PR prüfen.

---

## 2. Ergebnis in einem Satz

HBX Hotels ist öffentlich ein signatur-authenifizierter, umgebungsgetrennter B2B-Booking-Stack (Availability → optional CheckRate → Booking) plus getrennter Batch-Content-API. Für Jetnity ist der kleinste spätere Adapter eine **offline Availability-Foundation** gegen `HotelOption`/`HotelProvider`, ohne Booking, ohne Deeplink, ohne Commercial-Truth-Mint.

---

## 3. Härteste Residuals

| ID | Residual | Schwere |
| --- | --- | --- |
| HBX-R1 | Booking-API ≠ Affiliate-Redirect | high / Produkt |
| U1 | Destination/Geo-Availability unbewiesen | medium / Search-Design |
| U2 | Request-Währung unbewiesen | medium / Preis |
| U7 | Portfolio 173k / 250k / 300k first-party Drift | medium / Evidence |
| U5/S16 | Hotels-Error-Seite 404; Swagger unlesbar | medium / Contract completeness |
| HBX-R2 | TEST/Fixture darf nie `live_api` werden | high / Truth |

---

## 4. Empfehlung an den Technical Lead

Exact-Head-**Re-Review** der dedizierten HBX-Docs nach `5463638059` + `5463717117`. Nicht Ready. Nicht mergen. Foundation-Proposal nicht als autorisiert behandeln. Globale Current-State-Wahrheit bleibt auf `main` / Checkpoint V2.

Wenn der TL die Evidence für unzureichend hält, weil S16 Cookie-Wall: das ist dokumentiert, nicht versteckt. Ein Follow-up darf S16 nur mit first-party Zugang nachlesen, ohne Signup-Keys in Git.

---

## 5. Was der nächste Agent nicht tun darf

Keine Runtime, keine Shared-Core-Edits, kein Signup, keine Keys, keine realen Calls, kein Mint, kein Ready/Merge, kein TW-8, kein Hotel-Production-Flag, kein Content-Batch, kein Booking.com- oder HBX-Implementation-Slice aus diesem Handoff. Keine erneuten Edits an globalen Current-State-/S5-/Build-Order-Dateien aus diesem Audit.

---

## 6. Zuerst lesen

1. `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`
2. `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_2026-08-29.md`
3. `docs/PROVIDER_HBX_HOTELS_ADAPTER_CONTRACT_2026-08-29.md`
4. `docs/HOTEL_PROVIDER_STRATEGY.md` (read-only Kontext auf `main`; dieser PR ändert sie nicht)
5. `lib/hotels/provider.ts`, `lib/hotels/domain.ts`
6. `lib/providers/skyscanner/flights/*` als Foundation-Vorbild
7. ADR-0070, ADR-0075, ADR-0168 (read-only; dieser PR ändert sie nicht)
8. `docs/PROVIDER_S5B_PRODUCTION_APPLY_VERIFICATION_2026-08-29.md` — S5-B Current-State auf der Task-Baseline (read-only)

---

## 7. STOPP

Unabhängiger Technical-Lead Exact-Head-Review. Cursor-Agent setzt weder Ready noch Merge.
