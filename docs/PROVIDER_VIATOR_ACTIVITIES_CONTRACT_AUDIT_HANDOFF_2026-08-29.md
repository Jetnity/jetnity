# Provider Viator Activities Contract Audit — Handoff

Stand: 29. August 2026  
Status: **DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Cursor-Agent: `Jetnity provider viator audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/189  
Branch: `audit/provider-viator-activities-contract-2026-08-29`

Dieser Handoff übergibt Evidence + Adapter-Contract-Prep. Er startet keinen Folgeslice. Gates auf `39d083ba` gelten **nicht** für den neuen Head.

---

## 1. Was dieser Agent getan hat

Exakt `docs/PROVIDER_VIATOR_ACTIVITIES_CONTRACT_AUDIT_TASK_2026-08-29.md`.

First-party Viator-Dokumentation am 29. August 2026 gelesen (keine API-Calls):

- https://docs.viator.com/partner-api/
- https://docs.viator.com/partner-api/technical/ (v2.0, last update 18 Aug 2026)
- https://docs.viator.com/partner-api/affiliate/technical/ (Affiliate 1.0, last update 26 May 2022)
- https://docs.viator.com/partner-api/merchant/technical/
- Partner Resource Center: commerce home, technical guide, certification (15 Jul 2025), attribution, golden path

Jetnity-Ist gegen `lib/activities/*`, Commercial Provenance, Skyscanner-Foundation, ADR-0078 gelesen. **Keine Runtime- oder Shared-Core-Datei geändert.**

`origin/main` erneut gefetcht: unverändert `69ef27b169780e41ba506a69acb15caafa645517`. Drift **0**.

---

## 2. Git / Live-Evidence

| Fakt | Wert |
| --- | --- |
| `origin/main` | `69ef27b1` = Task-Baseline |
| Merge-Base | `69ef27b1` |
| Ahead / Behind bei Handoff-Vorbereitung | 1 / 0 plus dieser Docs-Stamp |
| Draft-PR | #189 OPEN Draft `MERGEABLE` |
| Prior CI | `33261056210` SUCCESS auf `39d083ba` — invalid nach Push |
| Prior Vercel | `HZkmN5HmEb6xzhiaNbGizWEp9SpX` READY auf `39d083ba` — invalid nach Push |
| Branch Protection | in diesem Environment nicht neu verifiziert; letzte kanonische Evidence `protected=false` |
| Supabase | nicht angefasst, nicht live geprüft |

---

## 3. Ist-Zustand in einem Satz

Viator Partner API **v2 Full-access Affiliate** ist der rekonstruierte Vertrag für Content + optionales Real-time-Check + unveränderte `productUrl`; Merchant/Full+Booking bleiben ausgeschlossen. Jetnity hat weiter **keinen** Activities-Adapter. Preview-Preis ist keine Live-Quote. Fixture darf keine Commercial-Provenance minten. ADR-0078 ist nicht still ersetzt.

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

Exact-Head-Review der Docs. Prüfen insbesondere:

1. v2 vs v1 nicht vermischt
2. Full+Booking/Merchant nicht als Affiliate-scope lesbar
3. keine Runtime-/Core-Diffs
4. Contract mintet kein `live_api` aus Fixtures
5. keine implizite Providerwahl gegen ADR-0078
6. Foundation-Task bleibt Proposal

Nicht Ready. Nicht mergen. Keine Foundation aus diesem Handoff starten.

---

## 6. Was der nächste Agent nicht tun darf

- Runtime, Shared-Core, `lib/activities/*`, `lib/commercial-provenance/*` ändern
- Signup, Keys, echte Calls, paid calls
- Commercial-Provenance schreiben/minten
- Production/Supabase/Vercel mutieren
- Ready/Merge
- Folgeslice implementieren
- Viator als gewählten Provider in `ACTIVITIES.md` / ADR-0078 umdeuten
- Booking-/Payment-Endpoints vorbereiten

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

Unabhängiger Technical-Lead Exact-Head-Review. Cursor-Agenten setzen kein Ready und mergen nicht.
