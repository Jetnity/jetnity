# Provider Viator Activities Contract Audit — Handoff

Stand: 29. August 2026  
Status: **REVIEW-FIX FÜR 5463644138 / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider viator audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/189  
Branch: `audit/provider-viator-activities-contract-2026-08-29`

Dieser Handoff übergibt den Review-Fix gegen TL-Kommentar `5463644138` auf Head `51eac518`. Er startet keinen Folgeslice. Gates auf `51eac518` gelten **nicht** für den neuen Head.

---

## 1. Was dieser Agent getan hat

Exakt `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`.

First-party Viator-Dokumentation am 29. August 2026 gelesen (keine API-Calls):

- https://docs.viator.com/partner-api/
- https://docs.viator.com/partner-api/technical/ (v2.0, last update 18 Aug 2026)
- https://docs.viator.com/partner-api/affiliate/technical/ (Affiliate 1.0, last update 26 May 2022)
- https://docs.viator.com/partner-api/merchant/technical/
- Partner Resource Center: commerce home, technical guide, certification (15 Jul 2025), attribution, golden path

Jetnity-Ist gegen `lib/activities/*`, Commercial Provenance, Skyscanner-Foundation, ADR-0078 und TL-Checkpoint V2 auf `origin/main` gelesen. **Keine Runtime- oder Shared-Core-Datei geändert.**

Review-Fix `5463644138` nur: grobe Viator-first-Zielwahl nicht erneut öffnen; S5-B-Persistenz-Apply als erledigt führen.

`origin/main` erneut gefetcht: `f80a7f0b9e517e60c893ed80ff80b3c1b4cd9eb3` (4 docs-commits ahead der Task-Baseline `69ef27b1`). Dieser Fix rebased/merged nicht.

---

## 2. Git / Live-Evidence

| Fakt | Wert |
| --- | --- |
| `origin/main` | `f80a7f0b` — 4 docs-commits ahead der Task-Baseline `69ef27b1` |
| Merge-Base | `69ef27b1` |
| Reviewed Head | `51eac518` |
| Draft-PR | #189 OPEN Draft |
| Prior CI | `33261701854` SUCCESS auf `51eac518` — invalid nach diesem Push |
| Prior Vercel | `AyDf4yYbNUJvcfoiePDD21WSqJvX` SUCCESS auf `51eac518` — invalid nach diesem Push |
| Branch Protection | in diesem Environment nicht neu verifiziert; letzte kanonische Evidence `protected=false` |
| Supabase | nicht angefasst, nicht live geprüft |

---

## 3. Ist-Zustand in einem Satz

Viator Partner API **v2 Full-access Affiliate** ist der rekonstruierte Vertrag. **Viator ist das akzeptierte erste Activities-Target**; GetYourGuide später. Merchant/Full+Booking bleiben ausgeschlossen und extra gegatet. Kein Activities-Adapter. Preview-Preis ist keine Live-Quote. Fixture darf keine Commercial-Provenance minten. S5-B-Persistenz ist Production-angewendet; Runtime-Write-Path unallocated. TW-8 bleibt geschlossen.

---

## 4. Severity

Kein neues Production-P0: es gibt keinen Live-Pfad.

Review-relevante Residuals:

- `VIA-UNK-01`–`VIA-UNK-12` im Audit
- Destination-Mapping fehlt vollständig
- Age-Band vs `participants`
- Währungs-Mismatch nach Redirect
- Unique-Content-/Review-Indexierung bei späterer UI

---

## 5. Empfehlung an den Technical Lead

Exact-Head-**Re-Review** der Docs gegen `5463644138`. Prüfen insbesondere:

1. Kein erneutes PO-Gate „darf Viator first sein?“
2. S5-B-Persistenz-Apply nicht als pending geführt
3. Offenes Commercial-Gate = Runtime-Write-Path/Principal + echte Provider-Antwort + trusted Write
4. TW-8 weiter geschlossen
5. v2 vs v1, Full+Booking/Merchant, Fixture-Mint-Grenze unverändert
6. keine Runtime-/Core-Diffs; Foundation bleibt Proposal

Nicht Ready. Nicht mergen. Keine Foundation aus diesem Handoff starten.

---

## 6. Was der nächste Agent nicht tun darf

- Runtime, Shared-Core, `lib/activities/*`, `lib/commercial-provenance/*` ändern
- Signup, Keys, echte Calls, paid calls
- Commercial-Provenance schreiben/minten
- Production/Supabase/Vercel mutieren
- Ready/Merge
- Folgeslice implementieren
- Die gesetzte Viator-first-Zielwahl erneut als offenes PO-Gate stellen
- S5-B-Persistenz erneut anwenden
- Booking-/Payment-Endpoints vorbereiten
- `ACTIVITIES.md` / ADR-0078 still in eine Vendor-Architektur umschreiben

---

## 7. Zuerst lesen

1. Task
2. Audit Evidence
3. Adapter Contract
4. Self-Review
5. Foundation-Task-Proposal
6. Dieser Handoff
7. `docs/ACTIVE_WORK_STATUS.md` (aktueller Block)

---

## 8. STOPP

Unabhängiger Technical-Lead Exact-Head-**Re-Review**. Cursor-Agenten setzen kein Ready und mergen nicht.
