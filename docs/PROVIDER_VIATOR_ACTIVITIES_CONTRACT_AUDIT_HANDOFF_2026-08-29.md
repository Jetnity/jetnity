# Provider Viator Activities Contract Audit — Handoff

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5464086082 / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider viator audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/189  
Branch: `audit/provider-viator-activities-contract-2026-08-29`

Dieser Handoff übergibt den Review-Fix gegen TL-Kommentar `5464086082` auf Head `feb8561a`. Er startet keinen Folgeslice. Gates auf `feb8561a` gelten **nicht** für den neuen Head.

---

## 1. Was dieser Agent getan hat

`origin/main @ 085c95b2` in denselben Branch gemergt (Merge `40cdce07`). ROADMAP-#189-Pointer entfernt; S5-B/Core-Wahrheit von `main` belassen. `ACTIVE_WORK_STATUS` nicht als Viator-Current-Owner überschrieben.

Docs/Evidence only gegen `5464086082`:

1. `VIA-UNK-07` resolved: Full-access Affiliates dürfen `/availability/check` nach Datum + paxMix.
2. `VIA-UNK-06` resolved: v2 `/destinations` kanonisch.
3. `VIA-UNK-01` non-blocking Drift; Sandbox fail-closed.
4. Zukünftiger HTTP = ADR-0199 `lib/server/providers/core/*`.
5. Search/Detail ≠ `live_api`; nur gültiger Check.
6. Foundation = search/preview; `product_detail`-Gate extra.
7. `productUrl` Allowlist; Tracking-Parameter intakt.
8. `rel="sponsored"` + non-PII `campaign-value` für späteren UI-Slice.
9. Jetnity-PL nicht still als Viator-Locale senden.

Keine Runtime, kein Signup, kein Call, kein Provenance-Mint, keine Production-Mutation.

---

## 2. Git / Live-Evidence

| Fakt | Wert |
| --- | --- |
| `origin/main` | `085c95b2` — gemergt |
| Reviewed Head | `feb8561a` |
| Draft-PR | #189 OPEN Draft |
| Prior CI | `33264847574` SUCCESS auf `feb8561a` — invalid nach diesem Push |
| Prior Vercel | `EKXMMwBWfBb7EGftqGzZHY4mbgc9` SUCCESS auf `feb8561a` — invalid nach diesem Push |
| Supabase | nicht angefasst |

---

## 3. Ist-Zustand in einem Satz

Viator v2 Full-access Affiliate bleibt der Vertrag. Check/Destinations/Sandbox sind current-v2-klar. Search ist keine Quote. Foundation bleibt offline Preview. HTTP später nur über ADR-0199. `#189` ist nicht globaler Current-Owner.

---

## 4. Severity

Kein neues Production-P0: kein Live-Pfad.

Residuals: `VIA-UNK-02`–`05`, `08`–`12`; Destination-Map; PDP-Zertifizierung extra; Allowlist-Konfig später server-only.

---

## 5. Empfehlung an den Technical Lead

Exact-Head-**Re-Review** gegen `5464086082`. Prüfen:

1. UNK-01/06/07 Lesart
2. ADR-0199 als einziger zukünftiger Transport
3. endpoint-spezifische Commercial Truth
4. search/preview vs `product_detail`
5. `productUrl` Allowlist
6. Merge hat ROADMAP/S5-B von `main` nicht überschrieben
7. keine Runtime-Diffs außer dem gemergten Core von `main`

Nicht Ready. Nicht mergen. Keine Foundation.

---

## 6. Was der nächste Agent nicht tun darf

- Runtime oder Shared-Core in diesem Audit ändern (außer was `main` bereits mitbrachte)
- Zweiten Transport-Kern vorschlagen
- Signup, Keys, echte Calls
- Commercial-Provenance minten
- Production/Supabase/Vercel mutieren
- Ready/Merge / Foundation starten
- Viator-first erneut öffnen
- `ACTIVE_WORK_STATUS` / ROADMAP-Current als #189 überschreiben
- Checkpoint V2 oder ADR-0199 aus diesem Audit umschreiben

---

## 7. Zuerst lesen

1. Task
2. Audit Evidence
3. Adapter Contract
4. Foundation-Proposal
5. Self-Review
6. Dieser Handoff
7. ADR-0199 + Provider-Core Post-Merge Checkpoint
8. Checkpoint V2 auf `main`

---

## 8. STOPP

Unabhängiger Technical-Lead Exact-Head-**Re-Review**. Cursor-Agenten setzen kein Ready und mergen nicht.
