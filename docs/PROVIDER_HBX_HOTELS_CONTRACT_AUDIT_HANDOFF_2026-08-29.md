# Provider HBX Hotels Contract Audit — Handoff

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5464070835 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/188  
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`

Dieser Handoff übergibt den Review-Fix gegen `5464070835` auf Review-Head `c89446b2` nach Merge von `origin/main @ 085c95b2`. Agent-Self-Review ist kein PASS. Prior-Head `c89446b2` gilt nicht für den neuen Head.

---

## 1. Was dieser Agent getan hat

1. `origin/main` (`085c95b2`) in denselben Branch gemergt. ADR-0199 / Provider Adapter Core ist integriert. Checkpoint: `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md`. `main` nicht umgeschrieben.
2. Provider-Order in Audit §21, Contract und Foundation-Proposal: HBX erstes konkretes Hotels-Adapter-Ziel; Booking.com Demand / Expedia Rapid später; kein Backup-Swap; kein Booking-Pivot.
3. Drei Nähte: `lib/hotels/*`, `lib/server/providers/core/*`, zukünftiger HBX-Adapter. Kein zweiter Transport-/accommodations-core.
4. mTLS fail-closed für Availability/CheckRate/Booking; Evaluation/non-mTLS `unknown`.
5. HBX-500: kein Shared-Core-`retry5xx`-Default.
6. S19-Pricing-Modell explizit; Display gegatet bis kommerzielle Evidence.
7. Boards-Katalog statt `BB/HB/FB/AI`-Hardcode.

Isolation bleibt: nur `PROVIDER_HBX_*`. `HOTEL_PROVIDER_STRATEGY.md` und globale Current-State-Dateien nicht angefasst.

Nicht getan: Runtime, Shared-Core-Edits, Signup, Keys, Zertifikate, HTTP, Mint, Production, Ready, Merge des PRs.

---

## 2. Ergebnis in einem Satz

HBX ist das erste konkrete Hotels-Adapter-Ziel: offline Foundation gegen `HotelProvider`, später HTTP nur über ADR-0199 mit fail-closed mTLS und ohne 500-Retry; kein Booking-Pivot; Booking.com/Expedia später.

---

## 3. Härteste Residuals

| ID | Residual | Schwere |
| --- | --- | --- |
| HBX-R1 | Booking-API ≠ Affiliate-Redirect; Production-Aktivierung extra | high / Produkt |
| U4 | Evaluation vs mTLS-Pflicht | high / Transport |
| U13 | Net vs Commissionable unbelegt | high / Commercial |
| U1/U2 | Destination-Suche / Request-Währung | medium |
| U7 | Portfolio 173k / 250k / 300k Drift | medium |
| HBX-R2 | Fixture darf nie `live_api` werden | high / Truth |

---

## 4. Empfehlung an den Technical Lead

Exact-Head-**Re-Review** nach `5464070835`. Nicht Ready. Nicht mergen. Foundation-Proposal nicht starten.

---

## 5. Was der nächste Agent nicht tun darf

Keine Runtime, keine Shared-Core-Edits, kein Signup, keine Keys/Zertifikate, keine Calls, kein Mint, kein Ready/Merge, kein Folgeslice, keine globalen Current-State-Edits.

---

## 6. Zuerst lesen

1. `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`
2. `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_2026-08-29.md`
3. `docs/PROVIDER_HBX_HOTELS_ADAPTER_CONTRACT_2026-08-29.md`
4. `docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md` (read-only)
5. `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md` (read-only)
6. `lib/hotels/provider.ts`, `lib/hotels/domain.ts`, `lib/server/providers/core/*` (read-only)

---

## 7. STOPP

Unabhängiger Technical-Lead Exact-Head-Review. Cursor-Agent setzt weder Ready noch Merge.
