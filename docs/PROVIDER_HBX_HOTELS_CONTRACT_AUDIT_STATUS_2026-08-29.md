# Provider HBX Hotels Contract Audit — Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
Preferred visible title: `Jetnity provider hbx audit 1`  
Observed run title: `Provider hbx audit`  
Cloud-Run: https://cursor.com/agents/bc-19d3e8fb-5b5a-4723-aa08-f0dab9abd983  
Kein Rename; UI nicht als umbenannt behauptet. Generation 1 bleibt 1.

Auftrag: `docs/PROVIDER_HBX_HOTELS_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Branch: `audit/provider-hbx-hotels-contract-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/188

> Agent-Self-Review ist kein PASS. Jeder neue Push invalidiert Prior-Gates.

---

## 1. Arbeitsblock

Reconstruct official HBX/Hotelbeds Hotels API contract. Define smallest future Jetnity accommodations adapter contract. Docs/evidence/contracts only.

Nicht: Runtime, Shared-Core, Signup, Keys, Secrets, reale Calls, Commercial-Aktivierung, Production-Mutation, Provenance-Mint, Ready, Merge, Folgeslice.

---

## 2. Git / Live-Rekonstruktion vor Handoff

Erneut `git fetch origin main` am 29. August 2026.

| Fakt | Wert |
| --- | --- |
| Task-Baseline / `origin/main` | `69ef27b169780e41ba506a69acb15caafa645517` — `Integrate Skyscanner Flights offline adapter foundation` |
| Lokales `main` | identisch zu `origin/main` |
| Merge-Base | `69ef27b1` = `origin/main` |
| Ahead / Behind bei diesem Stamp | Ahead = Task + Audit-Docs; **Behind = 0**. Exact Head = Commit dieses Stamps; live am PR prüfen. |
| Draft-PR | #188 OPEN Draft |
| Task-Head CI | Actions Run `33261049464` SUCCESS auf Task-Commit `f6cef132`. **Gilt nicht für den neuen Head.** |
| Task-Head Vercel | READY `8YCfoYedhJw6vTmy4BgTPZQfnnA1` auf `f6cef132`. **Gilt nicht für den neuen Head.** |
| Branch Protection | nicht unabhängig live verifiziert in diesem Environment |
| Supabase / Production | nicht mutiert; nicht live verifiziert |
| Provider / Secrets / paid calls | 0. Kein Signup, kein Call |

Drift: **kein** `origin/main`-Drift gegenüber der Task-Baseline.

---

## 3. Bereits umgesetzt

- First-party HBX-Dokumentation gelesen und mit URL/Datum inventarisiert.
- Evaluation/Test, Api-key + X-Signature, Environments, Availability-Flow, Content-Trennung, CheckRate/Booking-Grenze, Quotas/Errors soweit öffentlich, Preis/Steuer/Storno, Identifiers, Freshness, Localization, Images, Commercial Model, Certification/Go-Live.
- Mapping-Grenze Shared Core vs HBX-Adapter.
- Fixture-Shape + fail-closed + Commercial-Truth-Sperre.
- Zukünftige Factory/Transport/Parser/Observability/Error-Mapping/Gates.
- Future Foundation-Task als **Proposal only**.
- Unknowns ehrlich: Destination/Geo-Suche, Request-Währung, Hotels-Error-Seite 404, Swagger Cookie-Wall, Portfolio 173k vs 250k, mTLS vs Evaluation-Host, Live-QPS, TTL.

Keine Runtime-Datei. `next-env.d.ts` nicht committed.

---

## 4. Traveller Context

Availability-Suche ist **nicht** visa-/dokument-spezifisch. Relevant ist `sourceMarket` als Markt des Endkunden, nicht als Citizenship-Proxy. Kinderalter Pflicht wenn `children > 0`. Booking-Pax-PII nur in einem späteren Booking-Gate. Keine Credentials für Search.

---

## 5. Proaktive Produktfindung

HBX Hotel Booking API ist ein **B2B-Booking-/Inventory-API** mit Certification, Voucher und echten Live-Buchungen. Jetnity-Hotelstrategie bevorzugt Booking.com Demand API wegen Search/Look/Redirect. HBX als technischer Backup für **Suche + gecachtes Content** bleibt sinnvoll. HBX als stilles Jetnity-Buchungsprodukt wäre eine **neue Hauptkategorie** und braucht Product-Owner-Freigabe. Dieser Audit startet das nicht.

---

## 6. Tests / CI / Preview

Keine neuen Runtime-Tests. Dieser Slice ist docs-only.

Gates auf `f6cef132` sind historisch für den Stamp-Head. Exact-Head Actions/Vercel müssen nach diesem Push neu gelesen werden.

Production-Build: nicht als Abschluss dieses Docs-Slice behauptet; kein Runtime-Change.

---

## 7. Security / Kosten / Datenbank

- Security: keine Secrets, keine Keys, keine Calls. Signature-Formel nur aus öffentlicher Docs zitiert, nicht implementiert.
- Kosten: 0. Evaluation 50 req/Tag und Live-Stornogebühren sind Zukunftskosten, nicht aktiviert.
- Datenbank: keine Migration, kein RLS, kein Apply.

---

## 8. Offene Gates

1. Unabhängiger Technical-Lead Exact-Head-Review von #188.
2. Kein Ready. Kein Merge durch den Autor.
3. Foundation-Task nicht starten.
4. Kein HBX-Signup.
5. Booking.com-Zugang bleibt unbestätigt.
6. S5-B Production-Apply und TW-8 bleiben fremde Gates.

---

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #188. Autor setzt kein Ready, kein Merge, keinen Folgeslice.
