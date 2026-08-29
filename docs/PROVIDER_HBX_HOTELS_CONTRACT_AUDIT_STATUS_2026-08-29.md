# Provider HBX Hotels Contract Audit — Status

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5464070835 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
Preferred visible title: `Jetnity provider hbx audit 1`  
Observed run title: `Provider hbx audit`  
Cloud-Run: https://cursor.com/agents/bc-19d3e8fb-5b5a-4723-aa08-f0dab9abd983  
Kein Rename; UI nicht als umbenannt behauptet. Generation 1 bleibt 1.

Auftrag: `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/188

> Agent-Self-Review ist kein PASS. Jeder neue Push invalidiert Prior-Gates. Head `c89446b2` gilt **nicht** für den neuen Head.

---

## 1. Arbeitsblock

Nur TL CHANGES REQUIRED `5464070835` gegen Review-Head `c89446b2`. Docs/evidence/contracts only.

Nicht: Runtime, Shared-Core-Edits, Signup, Keys, Secrets, reale Calls, Production-Mutation, Provenance-Mint, Ready, Merge, Folgeslice. Isolation `5463717117` bleibt: keine globalen Current-State-/S5-/Build-Order-Dateien.

---

## 2. Git / Live-Rekonstruktion vor Handoff

`git fetch origin main` + Merge `origin/main` in denselben Branch (kein Rebase, kein Rewrite von `main`).

| Fakt | Wert |
| --- | --- |
| Review-Head | `c89446b2c955c5e4490f499b3236c98034172dd5` |
| Live `origin/main` gemergt | `085c95b22130232c5b5819ef8a4bcc302cc0f52b` — `Persist provider core post-merge checkpoint` |
| ADR-0199 | integriert auf `main`; Checkpoint `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md` |
| Merge-Base nach Merge | `085c95b2` = `origin/main` zum Merge-Zeitpunkt |
| Ahead / Behind bei diesem Stamp | Ahead = Merge + dieser Docs-Fix; Behind nach Merge gegen den dann gelesenen `origin/main` = 0, live erneut prüfen. Exact Head = Commit dieses Stamps. |
| Draft-PR | #188 OPEN Draft |
| Isolation | Diff gegen `origin/main` bleibt auf dedizierte `PROVIDER_HBX_*`-Dateien |
| Supabase / Production | nicht mutiert |
| Provider / Secrets / paid calls | 0 |

---

## 3. Bereits umgesetzt

- `origin/main` gemergt; ADR-0199 / `lib/server/providers/core/*` im Branch sichtbar, nicht geändert.
- P1 Provider-Order: HBX bleibt erstes konkretes Hotels-Adapter-Ziel; Booking.com Demand und Expedia Rapid später; kein Backup-Swap; kein Booking-Pivot.
- P1 Shared Core: Hotel-Domain / ADR-0199-Transport / HBX-Adapter getrennt. Kein zweiter accommodations-core.
- P1 mTLS: Booking-API-Ops fail-closed auf dokumentierte mTLS-Hosts; Evaluation/non-mTLS `unknown`.
- P1 500: zukünftiger Transport muss `retry5xx=false` setzen; kein automatisches Shared-Core-5xx-Retry.
- P1 Pricing: S19 Net vs Commissionable; Modell nicht aus Shape/Locale/Citizenship; Display gegatet bis Modell bekannt.
- P2 Boards: gecachter Boards-Katalog; unmapped → `fruehstueckEnthalten=null`.
- Isolation und frühere Evidence-Fixes (S5-B Foundation vs Write-Pfad; 173k/250k/300k) unverändert in den HBX-Docs.

---

## 4. Traveller Context

Unverändert: `sourceMarket` ≠ Citizenship. Kinderalter nur wenn `children > 0`. Pricing-Modell nicht aus Traveller-Fakten ableiten.

---

## 5. Proaktive Produktfindung

HBX bleibt distribution-/booking-orientiert. Das rechtfertigt ein späteres Commercial-/Production-Gate, **nicht** die Wahl von Booking.com als erstem Adapter. Jetnity bleibt aggregator-/redirect-first ohne HBX-Merchant-Pivot.

---

## 6. Tests / CI / Preview

Keine neuen Runtime-Tests. Docs-only plus Merge von `main`.

Prior-Head-Gates auf `c89446b2` sind historisch. Exact-Head-Gates müssen nach diesem Push neu laufen.

---

## 7. Security / Kosten / Datenbank

- Keine Secrets, Keys, Zertifikate, Calls.
- Kosten: 0.
- Datenbank: keine Migration.

---

## 8. Offene Gates

1. Unabhängiger Technical-Lead Exact-Head-Re-Review von #188 nach `5464070835`.
2. Kein Ready. Kein Merge durch den Autor.
3. Foundation-Task nicht starten.
4. Kein HBX-Signup / kein Zertifikat.
5. S19-Pricing-Modell und Evaluation-mTLS bleiben vendor-unknown.
6. S5-B Runtime-Write, realer Snapshot und TW-8 bleiben fremde Gates.

---

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #188. Autor setzt kein Ready, kein Merge, keinen Folgeslice.
