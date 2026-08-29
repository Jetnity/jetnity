# Provider 12Go Mobility Contract Audit – Handoff

Stand: 29. August 2026  
Status: **DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Observed run title: `12Go mobility adapter audit`  
Cloud-Run: https://cursor.com/agents/bc-0266753e-bd4f-4c88-9330-5ebe1fb87b88  
Draft-PR: https://github.com/Jetnity/jetnity/pull/190  
Branch: `audit/provider-12go-mobility-contract-2026-08-29`

Agent-Self-Review ist kein PASS. Kein Ready. Kein Merge. Kein Folgeslice.

---

## 1. Ergebnis

12Go ist ein First-Party-belegter multimodal Transport-Intermediär (Train/Bus/Ferry/Van/Taxi plus weitere Produkte). Das Affiliate-Programm ist öffentlich, kostenlos beantragbar und approval-gated. Die API wird öffentlich erwähnt, ist aber **prior consent + confidential conditions**. Es gibt **kein** öffentliches API-Schema.

Der kleinste verantwortbare spätere Jetnity-Weg:

- Mobility-only Mapping (`rail|bus|ferry|transfer`);
- Affiliate-Redirect für Booking/Payment;
- Live-Suche nur nach genehmigtem server-only API-Pfad;
- Offline-Fixtures ohne `live_api` / `persisted_snapshot`;
- Rental Cars und Flights bleiben eigene Jetnity-Domains, auch wenn 12Go sie selbst vertreibt.

In diesem Slice: nur Docs/Evidence/Contract-Prep. Keine Runtime. Kein Signup. Kein Secret. Kein Call.

---

## 2. `origin/main`-Drift

Erneuter Fetch vor diesem Handoff:

| | SHA |
| --- | --- |
| Task-Baseline / `origin/main` | `69ef27b169780e41ba506a69acb15caafa645517` |
| Behind | **0** |
| Ahead bei Start | 1 (`1b4b2f0d` Task only) |
| Exact Head nach Audit-Stamp | **live am PR prüfen** – dieser Handoff erzeugt einen neueren Head |

Kein Main-Drift. Parallel bleibt Draft-PR #182 (S5-B Persistenz) unberührt.

---

## 3. Dateien

Neu (Docs only):

- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_STATUS_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_EVIDENCE_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_ADAPTER_IMPLEMENTATION_TASK_PROPOSAL_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_HANDOFF_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_SELF_REVIEW_2026-08-29.md`
- `docs/ADR_0199_PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT.md` (**proposed / not accepted**)

Aktualisiert: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `DECISIONS.md`, `ARCHITECTURE.md` (Ist bleibt: kein 12Go-Adapter).

Unverändert: `lib/**`, `app/**`, `supabase/**`, Shared-Core, Commercial-Provenance-Runtime.

---

## 4. Residuals

Siehe Status §5 (12GO-R1–R15). Die wichtigsten: unbekanntes API-Schema, ToS-Verbot von Scraping, iframe-Verbot, Domain-Fold-Risiko (Flights/Car rent), Provenance-Mint aus Fixtures, Passport-PII.

---

## 5. Kosten / Secrets / Production

0 neue Kosten. Keine Secrets. Keine Production-Mutation. Kein Commercial-Provenance-Mint.

---

## 6. Offene Gates

1. Unabhängiger TL Exact-Head-Review #190.
2. ADR-0199 bleibt proposed, bis der Technical Lead ihn annimmt oder verwirft.
3. Implementation-Proposal nicht starten.
4. PO-Gates für Enrollment/API/Secrets/Live/Payments unverändert geschlossen.
5. TW-8 geschlossen. S5-B-Apply nicht dieser Slice.

---

## 7. Exakter nächster Schritt

Technical Lead reviewed den Exact Head von Draft-PR #190 unabhängig.

Cursor setzt weder Ready noch Merge und startet keinen Folgeslice.
