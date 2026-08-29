# Provider HBX Hotels Contract Audit — Handoff

Stand: 29. August 2026  
Status: **DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/188  
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`

Dieser Handoff übergibt Audit-Evidence. Er startet keinen Folgeslice. Agent-Self-Review ist kein PASS.

---

## 1. Was dieser Agent getan hat

Exakt `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md` ausgeführt.

Geliefert:

- `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_2026-08-29.md`
- `docs/PROVIDER_HBX_HOTELS_ADAPTER_CONTRACT_2026-08-29.md`
- `docs/PROVIDER_HBX_HOTELS_ADAPTER_FOUNDATION_TASK_PROPOSAL_2026-08-29.md`
- dieser Handoff, Status, Self-Review
- Continuity: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`

Nicht getan: Runtime, Shared-Core, Signup, Keys, Secrets, HTTP, Mint, Production, Ready, Merge.

`origin/main` vor Handoff neu geholt: `69ef27b169780e41ba506a69acb15caafa645517`. Behind = 0.

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
| U5/S16 | Hotels-Error-Seite 404; Swagger unlesbar | medium / Contract completeness |
| HBX-R2 | TEST/Fixture darf nie `live_api` werden | high / Truth |

---

## 4. Empfehlung an den Technical Lead

Exact-Head-Review der Docs. Nicht Ready. Nicht mergen. Foundation-Proposal nicht als autorisiert behandeln.

Wenn der TL die Evidence für unzureichend hält, weil S16 Cookie-Wall: das ist dokumentiert, nicht versteckt. Ein Follow-up darf S16 nur mit first-party Zugang nachlesen, ohne Signup-Keys in Git.

---

## 5. Was der nächste Agent nicht tun darf

Keine Runtime, keine Shared-Core-Edits, kein Signup, keine Keys, keine realen Calls, kein Mint, kein Ready/Merge, kein TW-8, kein Hotel-Production-Flag, kein Content-Batch, kein Booking.com- folge- oder HBX-Implementation-Slice aus diesem Handoff.

---

## 6. Zuerst lesen

1. `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`
2. `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_2026-08-29.md`
3. `docs/PROVIDER_HBX_HOTELS_ADAPTER_CONTRACT_2026-08-29.md`
4. `docs/HOTEL_PROVIDER_STRATEGY.md`
5. `lib/hotels/provider.ts`, `lib/hotels/domain.ts`
6. `lib/providers/skyscanner/flights/*` als Foundation-Vorbild
7. ADR-0070, ADR-0075, ADR-0168

---

## 7. STOPP

Unabhängiger Technical-Lead Exact-Head-Review. Cursor-Agent setzt weder Ready noch Merge.
