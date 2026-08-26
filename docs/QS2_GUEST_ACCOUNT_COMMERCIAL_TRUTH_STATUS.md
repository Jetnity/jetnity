# Jetnity – P1-QS2-02 Closure Status

Stand: 26. August 2026  
Agent: `Account plattform audit vorbereitung`  
Branch: `fix/qs2-guest-account-commercial-truth`  
Baseline: `main @ 71230c280b1cd2500d224095fa84f4472101d31f`  
Status: **IMPLEMENTIERT / STOPP für unabhängigen Technical-Lead-Review**

Auftrag: `docs/QS2_GUEST_ACCOUNT_COMMERCIAL_TRUTH_TASK.md`  
Self-Review: `docs/QS2_GUEST_ACCOUNT_COMMERCIAL_TRUTH_SELF_REVIEW.md`  
Entscheidung: ADR-0166

`docs/ACTIVE_WORK_STATUS.md` nicht geändert.

## Reproduktion vor Fix

Gegen `71230c28`, unveränderter `alsNutzlast`-Pfad:

| Feld nach `alsNutzlast` | Wert |
| --- | --- |
| flight `price_amount` / `provider` | `null` / `null` |
| stay `price_amount` | `9999` |
| stay `provider` | `evil-hotel` |
| stay `external_ref` | `hack-stay` |
| stay `booking_url` | `https://evil.example/book` |
| stay Titel / Notiz | erhalten |
| activity `price_amount` | `8888` |
| flight-only sanitizer, stay Preis | `9999` |

Evidence: `/opt/cursor/artifacts/qs2_p1_02_repro_before.json`. Finding bestätigt.

## Root Cause

`flugNutzlastOhneUnbewieseneWahrheit` nullt nur `kind === 'flight'`. Stay/Activity liefen unverändert durch `alsNutzlast` und `reiseAusNutzlastAnlegen`. Konto-Hotel/Activity verlangen Nachweis; der Guest-Import tat das nicht.

## Trust-Boundary

Angewendet: dieselbe Feldmenge wie der Flug-Strip. Kein neuer Shared Contract, keine RPC-Härte.

**Nicht** gestrichen: `transfer` / `rental_car`. Manuelle Nutzerpreise sind S3-User-Intake. Mobility-Such-Snapshots mit `provider`/`external_ref` sind ein Rest-Risiko – Semantik unklar, daher STOPP auf diesem Subpunkt.

## Diff (fachlich)

- `lib/trips/handelsfelder-nutzlast.ts` – Stay/Activity-Strip, komponiert den Flug-Strip
- `lib/trips/abbildung.ts` `alsNutzlast` und `lib/trips/anlegen.ts` `reiseAusNutzlastAnlegen` nutzen die kombinierte Funktion
- Tests: `handelsfelder-nutzlast.test.ts`, `uebernahme.test.ts`
- Docs: ADR-0166, Architecture, Roadmap-Zeile, dieser Status

## Offene P2/P3

- **P2:** Transfer-/Rental-Such-Snapshots können weiter `provider`/`external_ref`/Preis tragen, wenn sie im Guest-Graph landen. Braucht eigenen S3/S5-Schnitt.
- **P2:** Direkter `reise_anlegen`-RPC-Bypass bleibt dasselbe Residual wie beim Flug (S2-Review).
- **P1-TA-02** bleibt offen und wird hier **nicht** gestartet.

## Gates

Lokal und Exact-Head nach Push belegen. Kein Ready. Kein Merge.
