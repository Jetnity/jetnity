# Provider 12Go Mobility Contract Audit – Handoff

Stand: 29. August 2026  
Status: **REVIEW-FIX `5463645369` + `5463718113` / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
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
| Task-Baseline | `69ef27b169780e41ba506a69acb15caafa645517` |
| `origin/main` bei Review-Fix | `f80a7f0b9e517e60c893ed80ff80b3c1b4cd9eb3` |
| Behind | **4** — nur Current-State-Checkpoint `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-29_V2.md`. Kein Rebase. |
| Ahead bei Start | 1 (`1b4b2f0d` Task only) |
| Exact Head nach Review-Fix | **live am PR prüfen** – dieser Handoff erzeugt einen neueren Head |

Der Checkpoint auf `origin/main` bestätigt dieselbe Current-Truth: 12Go first; S5-B-Persistenz bereits Production; Runtime-Write/echtes Snapshot gegatet; API-Details UNKNOWN. S5-B-Persistenzgrundlage ist bereits auf Production (`20260829140000`, Merge `3b684f64` / #183). PR #182 bleibt CLOSED unmerged. Kein reales Provider-Snapshot. Runtime-Write-Pfad/Principal-Allocation bleibt geschlossen. TW-8 bleibt geschlossen.

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

Nicht geändert / isolation `5463718113`: `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`. Dieser Audit ist nicht der globale Current-State-Owner. Parallel bleiben #187/#188/#189.

Unverändert: `lib/**`, `app/**`, `supabase/**`, Shared-Core, Commercial-Provenance-Runtime.

---

## 4. Residuals

Siehe Status §5 (12GO-R1–R15). Die wichtigsten: unbekanntes API-Schema, ToS-Verbot von Scraping, iframe-Verbot, Domain-Fold-Risiko (Flights/Car rent), Provenance-Mint aus Fixtures, Passport-PII.

---

## 5. Kosten / Secrets / Production

0 neue Kosten. Keine Secrets. Keine Production-Mutation. Kein Commercial-Provenance-Mint.

Lokale Gates auf `17cf1ff5` sind **stale** für den Isolation-Head nach `5463718113`. Neue Exact-Head-Gates folgen nach diesem Stamp. GitHub CI/Vercel nicht als grün behauptet.

---

## 6. Offene Gates

1. Unabhängiger TL Exact-Head-**Re-Review** #190 nach `5463645369` + Isolation `5463718113`.
2. ADR-0199 bleibt proposed, bis der Technical Lead ihn annimmt oder verwirft.
3. Implementation-Proposal nicht starten.
4. Strategisches Mobility-Ziel ist gesetzt (12Go first). PO-Gates für Enrollment/API/vertrauliche Terms/Credentials/paid calls/Production-Aktivierung bleiben geschlossen und werden durch diesen Slice nicht ausgelöst.
5. S5-B-Persistenzgrundlage ist bereits auf Production. Runtime-Write-Pfad/Principal-Allocation bleibt geschlossen und extra-gated. TW-8 bleibt geschlossen, bis echte Commercial Provenance existiert.

---

## 7. Exakter nächster Schritt

Technical Lead reviewed den Exact Head von Draft-PR #190 unabhängig erneut.

Cursor setzt weder Ready noch Merge und startet keinen Folgeslice.
