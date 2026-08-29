# Provider 12Go Mobility Contract Audit – Handoff

Stand: 29. August 2026  
Status: **REVIEW-FIX `5464098635` / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
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
- Affiliate-Redirect erst nach genehmigtem Affiliate-Status;
- Live-Suche nur nach genehmigtem server-only API-Pfad über `lib/server/providers/core/*`;
- Offline-Fixtures als Jetnity-eigene synthetische Testform ohne `live_api` / `persisted_snapshot`;
- Rental Cars und Flights bleiben eigene Jetnity-Domains, auch wenn 12Go sie selbst vertreibt.

In diesem Slice: nur Docs/Evidence/Contract-Prep. Keine Runtime. Kein Signup. Kein Secret. Kein Call.

---

## 2. `origin/main`-Drift

Erneuter Fetch und Merge vor diesem Handoff:

| | SHA |
| --- | --- |
| Task-Baseline | `69ef27b169780e41ba506a69acb15caafa645517` |
| `origin/main` gemergt | `085c95b22130232c5b5819ef8a4bcc302cc0f52b` |
| Behind | **0** |
| Integrierter Shared-Core | ADR-0199; Checkpoint `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md` |
| Vorgeschlagener 12Go-ADR | **ADR-0200** |

S5-B-Persistenzgrundlage ist bereits auf Production (`20260829140000`, Merge `3b684f64` / #183). PR #182 bleibt CLOSED unmerged. Kein reales Provider-Snapshot. Runtime-Write-Pfad/Principal-Allocation bleibt geschlossen. TW-8 bleibt geschlossen.

---

## 3. Dateien

Neu / 12Go-spezifisch (Docs only):

- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_STATUS_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_EVIDENCE_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_ADAPTER_IMPLEMENTATION_TASK_PROPOSAL_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_HANDOFF_2026-08-29.md`
- `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_SELF_REVIEW_2026-08-29.md`
- `docs/ADR_0200_PROVIDER_12GO_MOBILITY_ADAPTER_CONTRACT.md` (**proposed / not accepted**)

Nicht geändert durch diesen Audit als Owner: `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`. Integriertes `docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md` unverändert.

Unverändert durch diesen Slice: 12Go-Runtime, Shared-Core-Edits, Commercial-Provenance-Runtime.

---

## 4. Residuals

Siehe Status §5. Wichtigste UNKNOWN: API-Schema, Auth, Endpunkte, Quotas, Tracking-Parameternamen. Kommerzielle Deep-Links bleiben bis Affiliate-Approval aus.

---

## 5. Kosten / Secrets / Production

0 neue Kosten. Keine Secrets. Keine Production-Mutation. Kein Commercial-Provenance-Mint.

Lokale Gates auf `0d252fde` sind **stale** nach Merge + `5464098635`. Neue Exact-Head-Gates folgen.

---

## 6. Offene Gates

1. Unabhängiger TL Exact-Head-**Re-Review** #190 nach `5464098635`.
2. ADR-0200 bleibt proposed, bis der Technical Lead ihn annimmt oder verwirft.
3. Implementation-Proposal nicht starten.
4. Strategisches Mobility-Ziel ist gesetzt (12Go first). PO-Gates für Enrollment/API/vertrauliche Terms/Credentials/paid calls/Production-Aktivierung bleiben geschlossen.
5. S5-B-Persistenzgrundlage ist bereits auf Production. Runtime-Write-Pfad bleibt geschlossen. TW-8 bleibt geschlossen.

---

## 7. Exakter nächster Schritt

Technical Lead reviewed den Exact Head von Draft-PR #190 unabhängig erneut.

Cursor setzt weder Ready noch Merge und startet keinen Folgeslice.
