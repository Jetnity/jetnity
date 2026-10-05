# Provider Viator Activities Contract Audit — Status

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5464086082 / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider viator audit 1`  
Auftrag: `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`  
Branch: `audit/provider-viator-activities-contract-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/189

> Docs/Evidence/Contract-Prep only. Keine Runtime. Kein Ready. Kein Merge. Kein Folgeslice. Agent-Self-Review ist kein PASS.

---

## 0. Live-Rekonstruktion

`origin/main` in denselben Branch gemergt vor diesem Stamp.

| Fakt | Wert |
| --- | --- |
| Reviewed Head vor diesem Fix | `feb8561a8f67765cd7059633fa4e81829e8b2343` |
| TL CHANGES REQUIRED | Kommentar `5464086082` auf Exact Head `feb8561a` |
| `origin/main` gemergt | `085c95b22130232c5b5819ef8a4bcc302cc0f52b` — Provider Adapter Core Post-Merge Checkpoint |
| Merge-Commit | `40cdce078651901baa5367d1ae43160c0a9bf33e` |
| Task-Baseline (historisch) | `69ef27b169780e41ba506a69acb15caafa645517` |
| Draft-PR | #189 OPEN, Draft |
| Prior Exact-Head CI | Actions Run `33264847574` SUCCESS auf `feb8561a` — **gilt nicht für den neuen Head** |
| Prior Exact-Head Vercel | Preview `EKXMMwBWfBb7EGftqGzZHY4mbgc9` SUCCESS auf `feb8561a` — **gilt nicht für den neuen Head** |
| ADR-0199 | integriert auf `main`; siehe `docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md` und `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md` |
| Provider / Secrets / paid calls | nicht vorhanden; nicht aufgerufen |
| Signup / API-Key / Sandbox-/Production-Call | nicht ausgeführt |
| Commercial-Provenance-Mint | nicht ausgeführt |
| Production / Supabase / Vercel-Settings | nicht mutiert |

Exact Head ist der Commit dieses Stamps; live am PR prüfen. ROADMAP-Insertion von #189 entfernt; globale Current-State-Pointer bleiben Checkpoint/TL-Pfad.

---

## 1. Arbeitsblock

Rekonstruktion des offiziellen Viator Partner API v2-Vertrags für **affiliate-style** Tours/Activities und kleinster zukünftiger Jetnity-`activities`-Adaptervertrag. **Viator ist das akzeptierte erste Activities-Target**; GetYourGuide später. Kein erneutes Providerwahl-Gate.

---

## 2. Bereits umgesetzt

- First-party Evidence inkl. P6/P10/P11/P12 nach `5464086082`
- `VIA-UNK-01`, `VIA-UNK-06`, `VIA-UNK-07` reklassifiziert (resolved / non-blocking)
- Commercial-Truth endpoint-spezifisch: Search/Detail ≠ `live_api`; nur Full-access `/availability/check`
- ADR-0199 als zukünftiger HTTP-Kern; kein zweiter Transport
- Search-Foundation vs späteres `product_detail`-Gate
- `productUrl` Allowlist; Locale-Fallback inkl. Jetnity-PL
- `origin/main` gemergt; ROADMAP-#189-Pointer entfernt
- Continuity-Isolation bleibt: dieser Audit ist nicht globaler Current-Owner

Keine Runtime-Datei. Keine Shared-Core-Datei in diesem Fix (ADR-0199 kam über Merge von `main`).

---

## 3. Nicht umgesetzt / bewusst draußen

- Adapter-Code, Fixtures, Tests, HTTP-Calls
- Shared-Core-Edits in diesem Slice
- Signup, Keys, Sandbox-/Production-Calls
- Commercial Provenance write/mint, TW-8, Provider-Aktivierung
- Foundation-Start

---

## 4. Verbindliche Lesart

1. **Current API Truth = Partner API v2** + Technical Guide (P2/P6).
2. Zielklasse: **Full-access Affiliate**. Basic ohne Check. Merchant/Full+Booking extra.
3. `/availability/check` ist Full-access-fähig; Gate = Jetnity Full-access-Freigabe.
4. v2-Destinationen = `/destinations`. Golden-Path-Taxonomie historisch.
5. Tests nur Sandbox. Ältere Production-URL ist Drift.
6. Authenticated Search/Detail = `content_preview`, nicht `live_api`.
7. Nur gültiger Check (Datum + paxMix) ist Real-time-Quote-Kandidat; keine erfundene TTL.
8. Erste Foundation = search/preview only. PDP/Redirect extra `product_detail`-Gate.
9. `productUrl` byte-identisch + server-Allowlist; `https:` allein reicht nicht.
10. Zukünftiger HTTP nur über `lib/server/providers/core/*`.
11. S5-B Persistenz angewendet; Runtime-Write-Path unallocated; TW-8 geschlossen.

---

## 5. Tests / CI / Preview

Dieses Stamp ist docs-only plus Merge von `main`. Prior-Gates auf `feb8561a` ungültig. Neuer Head braucht vollständiges Re-Gating.

---

## 6. DB / RLS / Production-Grenze

Dieser Slice ändert keine Migration und mutiert Production nicht. S5-B Persistence bleibt angewendet. `production_write_path_allocated` bleibt `false`.

---

## 7. Kosten / Provider / Secrets

0. Kein Key. `VIA-UNK-11` / `VIA-UNK-12` bleiben offen.

---

## 8. Risiken / Review-Funde

Siehe Audit §20. Höchste Kanten: Host-Allowlist; Search≠Quote; PDP-Zertifizierung nicht aus Search-Form; zh/ko (`VIA-UNK-02`); `placeId`→`destinationId` (`VIA-UNK-05`).

---

## 9. Offene Freigaben

- Unabhängiger Technical-Lead Exact-Head-**Re-Review** nach `5464086082`
- Getrennte PO-Gates: Signup/Zugang/Vertrag, Credentials/paid calls, Full-access, Production-Aktivierung, Full+Booking/Merchant
- Foundation nicht aus #189 starten

---

## 10. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-**Re-Review** von Draft-PR #189 auf dem neuen Head. Autor setzt kein Ready, kein Merge, startet keine Foundation.

---

## 11. Zuerst lesen

1. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`
2. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_2026-08-29.md`
3. `docs/PROVIDER_VIATOR_ACTIVITIES_ADAPTER_CONTRACT_2026-08-29.md`
4. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_HANDOFF_2026-08-29.md`
5. `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_SELF_REVIEW_2026-08-29.md`
6. `docs/PROVIDER_VIATOR_ACTIVITIES_ADAPTER_FOUNDATION_TASK_PROPOSAL_2026-08-29.md`
7. `docs/ADR_0199_PROVIDER_ADAPTER_CORE_FOUNDATION.md`
8. `docs/CHATGPT_PROVIDER_ADAPTER_CORE_POST_MERGE_CHECKPOINT_2026-08-29.md`
9. `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-29_V2.md` §7–§9
10. `docs/PROVIDER_S5B_PRODUCTION_APPLY_VERIFICATION_2026-08-29.md`
