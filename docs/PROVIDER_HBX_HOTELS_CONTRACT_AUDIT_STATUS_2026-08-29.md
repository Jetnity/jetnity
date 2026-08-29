# Provider HBX Hotels Contract Audit — Status

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5463638059 + 5463717117 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
Preferred visible title: `Jetnity provider hbx audit 1`  
Observed run title: `Provider hbx audit`  
Cloud-Run: https://cursor.com/agents/bc-19d3e8fb-5b5a-4723-aa08-f0dab9abd983  
Kein Rename; UI nicht als umbenannt behauptet. Generation 1 bleibt 1.

Auftrag: `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/188

> Agent-Self-Review ist kein PASS. Jeder neue Push invalidiert Prior-Gates. Heads `68e98f7c`, `dfe63a32` und `16d7b006` gelten **nicht** für den neuen Head.

---

## 1. Arbeitsblock

Reconstruct official HBX/Hotelbeds Hotels API contract. Define smallest future Jetnity accommodations adapter contract. Docs/evidence/contracts only.

Nicht: Runtime, Shared-Core, Signup, Keys, Secrets, reale Calls, Commercial-Aktivierung, Production-Mutation, Provenance-Mint, Ready, Merge, Folgeslice.

Parallel-Workstream-Isolation (`5463717117`): dieser Audit besitzt **keine** globalen Current-State-Pointer, keine Binding Build Order und keine kanonischen S5-A/S5-B-ADR-/Architecture-Dateien.

---

## 2. Git / Live-Rekonstruktion vor Handoff

Erneut `git fetch origin main` am 29. August 2026.

| Fakt | Wert |
| --- | --- |
| Task-Baseline | `69ef27b169780e41ba506a69acb15caafa645517` — `Integrate Skyscanner Flights offline adapter foundation` |
| Live `origin/main` bei diesem Stamp | `f80a7f0b9e517e60c893ed80ff80b3c1b4cd9eb3` — `Stabilize authoritative Jetnity current-state checkpoint` |
| Merge-Base | `69ef27b1` = Task-Baseline |
| Ahead / Behind bei diesem Stamp | Ahead = nur dedizierte HBX-Docs; **Behind = 4** (nur `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-29_V2.md`). Kein Rebase. Exact Head = Commit dieses Stamps; live am PR prüfen. |
| Draft-PR | #188 OPEN Draft |
| Prior-Head CI/Vercel | `16d7b006`, `dfe63a32`, `68e98f7c`, `f6cef132` gelten **nicht** für den neuen Head. |
| Branch Protection | nicht unabhängig live verifiziert in diesem Environment |
| Supabase / Production | nicht mutiert; nicht live verifiziert |
| Provider / Secrets / paid calls | 0. Kein Signup, kein Call |

Drift: `origin/main` ist nach der Task-Baseline um den Current-State-Checkpoint V2 weitergezogen. Dieser Audit fügt den Checkpoint nicht hinzu und ändert ihn nicht.

---

## 3. Bereits umgesetzt

- First-party HBX-Dokumentation gelesen und mit URL/Datum inventarisiert.
- Evaluation/Test, Api-key + X-Signature, Environments, Availability-Flow, Content-Trennung, CheckRate/Booking-Grenze, Quotas/Errors soweit öffentlich, Preis/Steuer/Storno, Identifiers, Freshness, Localization, Images, Commercial Model, Certification/Go-Live.
- Mapping-Grenze Shared Core vs HBX-Adapter.
- Fixture-Shape + fail-closed + Commercial-Truth-Sperre.
- Future Foundation-Task als **Proposal only**.
- Review-Fix `5463638059` **in den dedizierten HBX-Docs**: S5-B Persistenz-Foundation Production-verifiziert vs. geschlossener Runtime-Write-Pfad; Portfolio-Drift 173k/250k/300k; Booking.com Demand B1.
- Review-Fix `5463717117`: globale Current-State-/S5-/Build-Order-/ROADMAP-/Hotel-Strategie-Edits auf `origin/main` zurückgesetzt. Diff dieses PRs bleibt auf dedizierte `PROVIDER_HBX_*`-Dateien beschränkt.

Keine Runtime-Datei. `next-env.d.ts` nicht committed.

---

## 4. Traveller Context

Availability-Suche ist **nicht** visa-/dokument-spezifisch. Relevant ist `sourceMarket` als Markt des Endkunden, nicht als Citizenship-Proxy. Kinderalter Pflicht wenn `children > 0`. Booking-Pax-PII nur in einem späteren Booking-Gate. Keine Credentials für Search.

---

## 5. Proaktive Produktfindung

HBX Hotel Booking API ist ein **B2B-Booking-/Inventory-API** mit Certification, Voucher und echten Live-Buchungen. Jetnity-Hotelstrategie bevorzugt Booking.com Demand API wegen Search/Look/Redirect (first-party B1). HBX als technischer Backup für **Suche + gecachtes Content** bleibt sinnvoll. HBX als stilles Jetnity-Buchungsprodukt wäre eine **neue Hauptkategorie** und braucht Product-Owner-Freigabe. Dieser Audit startet das nicht.

---

## 6. Tests / CI / Preview

Keine neuen Runtime-Tests. Dieser Slice ist docs-only.

Prior-Head-Gates auf `dfe63a32` / `16d7b006` sind historisch. Exact-Head-Gates müssen nach diesem Push neu laufen und live gelesen werden.

---

## 7. Security / Kosten / Datenbank

- Security: keine Secrets, keine Keys, keine Calls. Signature-Formel nur aus öffentlicher Docs zitiert, nicht implementiert.
- Kosten: 0. Evaluation 50 req/Tag und Live-Stornogebühren sind Zukunftskosten, nicht aktiviert.
- Datenbank: keine Migration, kein RLS, kein Apply.

---

## 8. Offene Gates

1. Unabhängiger Technical-Lead Exact-Head-Re-Review von #188 nach `5463638059` + `5463717117`.
2. Kein Ready. Kein Merge durch den Autor.
3. Foundation-Task nicht starten.
4. Kein HBX-Signup.
5. Booking.com-Zugang bleibt unbestätigt.
6. S5-B Persistenz-Foundation ist auf der Task-Baseline Production-verifiziert. Offen bleiben Runtime-Write-Pfad-Allokation, realer Provider-Snapshot und TW-8 — fremde Gates, nicht dieser Audit. Kanonische S5-Wahrheit bleibt TL-kontrolliert auf `main`.

---

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #188. Autor setzt kein Ready, kein Merge, keinen Folgeslice.
