# Requirements Provider Groundwork Gate 0 – Status

Stand: 30. August 2026  
Status: **CHANGES REQUIRED REVIEW-FIX COMPLETE / NOT PASS / STOP FOR TECHNICAL-LEAD RE-REVIEW**  
Cursor-Agent: **`Jetnity requirements provider groundwork 1`**  
Session: `bc-77badb21-f262-4ee2-86ce-f71a5aa1f051` (gleiche Generation; kein neuer Slice)  
Issue: #288  
Draft-PR: https://github.com/Jetnity/jetnity/pull/289  
Branch: `audit/requirements-provider-groundwork-g0-2026-08-30`  
Reviewed-then-fixed Head: `9caa1a0ff45eeea27bc042d75e736dcb17bd589d`  
Review: Technical-Lead comment **#5471442167** (CR-1–CR-4), CR-5, plus Re-Review CR-6/CR-7

> Kein Ready. Kein Merge. Kein Folgeslice. Kein Provider gewählt. Content-Gate auf `9caa1a0f` war **NOT PASS**.

---

## 1. Arbeitsblock / Ziel

AUDIT-ONLY / PROVIDER-NEUTRAL Rekonstruktion des aktuellen Requirements-/Readiness-Vertrags, S4-Revalidation, Official-Truth- und Multi-Citizenship-Mapping, öffentliche Selection-Groundwork, P0–P3-Gaps, kleinster späterer Slice **ohne** ihn zu starten.

Dieser Lauf ist **nur** der Review-Fix der sechs erlaubten Deliverables. Task, Runtime und globale Current-State-Dateien unverändert.

## 2. Branch / PR / Head

Live `git fetch origin main` vor dieser Korrektur: `origin/main` unverändert `60e12dd5`. Der finale Branch-Tip kann nicht self-embedded werden; SHA + Merge-Base + Ahead/Behind stehen im finalen Cursor-PR-Handoff-Kommentar und müssen vom Technical Lead live verifiziert werden.

| Fakt | Wert |
| --- | --- |
| Baseline / `origin/main` | `60e12dd5cf0916708e0bc87219b233861b387e7d` |
| Merge-Base | `60e12dd5cf0916708e0bc87219b233861b387e7d` |
| Behind `origin/main` | **0** |
| Reviewed NOT PASS (CR-1–CR-5) | `1a4fca0058dd7978396789bd680e83b923a6d659` — **8 / 0** |
| Letzter inhaltlicher Content-Fix (CR-6) | `02191a9b53353b0dbe9cc109e00fb226c6f7c337` |
| Ahead / Behind an diesem Content-Fix | **9 / 0** vs `origin/main@60e12dd5` |
| Recorded SHA-stamp parent / last embedded head evidence | `a5c3a07ea24564dd5fe30f26bfa4851b8d09c1cb` — **nicht** der aktuelle Branch-Tip |
| Historischer Live-Tip vor der finite-form Korrektur | `59292aaa29a02aac51cacde0616a9d3aa03dd7b0` — damals **11 / 0**; nur dieser Beobachtungszeitpunkt |
| Parallel TL-Commit auf dem Branch | `8d3330c1` `ACTIVE_WORK_STATUS` — nicht Agent-authored; nicht editiert |
| Review-Fix-Paket CR-1–CR-4 | `71d531ddbd75941ceea59527ef0d2e14a6650e1d` |
| CR-5 fold | `1a4fca0058dd7978396789bd680e83b923a6d659` |
| Finaler Branch-Tip | live im PR-Handoff-Kommentar, nicht im Tree |
| Draft-PR | #289 OPEN / Draft |
| Rename | keine programmierbare Session-Rename-Fähigkeit; UI nicht als umbenannt behauptet |

`origin/main` ist seit Task-Baseline **nicht** weitergelaufen. Kein Rebase in diesem Review-Fix nötig.

## 3. Bereits umgesetzt (dieser Slice)

- Pflichtlektüre und Current-Code-Rekonstruktion
- Live-Precheck GitHub/`origin/main`/PRs/Issues
- Sechs task-spezifische Deliverables
- Öffentliche Provider-Seiten mit URL + Datum + Evidence-Klasse
- Review-Fix CR-1–CR-7 **nur** in den sechs Deliverables
- Keine Runtime-/Config-/Migration-Änderung

### 3.1 Review-Fix #5471442167

| CR | Fix in den Deliverables | Nicht getan |
| --- | --- | --- |
| CR-1 | `officialFrische()` ohne `checkedAt`-TTL als Current-Contract; Gap `G-S4-TTL` P1/Activation-Gate; Semantik `checkedAt` ≠ Vendor-`lastUpdatedAt`; S4-R1-Scope um bounded TTL erweitert | **nicht** implementiert |
| CR-2 | E-SHERPA-4; Origin-Nationality-Fallback als **verbotener** Sherpa-Mismatch; Gap `G-MAP-ORIGIN-NAT` | kein Adapter |
| CR-3 | E-SHERPA-5/6; öffentliche Quota-/Cache-Schichten vs kontrahiertes `unknown` | keine Quota als Vertrag gelesen |
| CR-4 | E-IATA-3 Timatic Widget als Planungs-Oberfläche derselben DB; AutoCheck-REST nicht überzeichnet | kein Timatic gewählt |
| CR-5 | E-SHERPA-7; öffentlich max. 3 Transit-Nodes vs Jetnity max. 12 `transitCountryCodes`; Gap `G-MAP-TRANSIT-CAP`; kein silent drop; Route Truth nicht verkleinert | kein Adapter, kein Schema-Cap-Change |
| CR-6 | Route-`maxDuration = 10` ohne `runtime = 'edge'`; Edge-Claim aus allen sechs Deliverables entfernt | kein Runtime-Change |
| CR-7 | Finite Form: `a5c3a07e` = recorded SHA-stamp parent, nicht Exact Head; **11 / 0** historisch an `59292aaa`. Finaler Tip nur im PR-Kommentar | kein Ready/Merge; kein weiterer SHA-Stamp |

## 4. Nicht umgesetzt / bewusst nicht angefasst

- Runtime, Config, Migration, RLS, Auth, MFA, AAL
- Supabase-/Vercel-/Production-Mutation
- Vendor-Signup, Kontakt, Vertrag, Secret, paid/echte API-Calls
- Factory-Aktivierung, Commercial-Provenance-Mint, `live_api`, `persisted_snapshot`
- TW-8 / TW-9
- Legal-Copy
- globale Current-State-Dateien inkl. `docs/ACTIVE_WORK_STATUS.md`
- Task-Datei
- Folgeslice S4-R1 (TTL-Policy nur als Scope-Vorschlag)

## 5. Tests / CI / Preview

Docs-only. Kein künstlicher Runtime-Testzwang.

| Check | Ergebnis |
| --- | --- |
| Repository-Diff-/Scope-Sanity | nur Task + TL `ACTIVE_WORK_STATUS` + sechs Deliverables |
| Markdown-Link-/Evidence-URLs | CR-URLs 30. August 2026 erneut abgerufen; nicht als Vertrag behandelt |
| `npm test` / Typecheck / Build | **nicht** als Abschluss-Gate dieses Docs-Slices ausgeführt |
| CI #1404 / `33337053946` | SUCCESS auf **`9caa1a0f`** — gilt **nicht** für den Review-Fix-Head |
| Vercel Preview `dpl_9hSbioj9zBZnfkzyHqpW2KGcBayy` | READY auf **`9caa1a0f`** — gilt **nicht** für den Review-Fix-Head |

CI / Vercel auf dem live PR-Tip nach dieser Korrektur muss der Technical Lead erneut gaten. Alte Gates gelten nicht.

## 6. DB / RLS / Production-Grenze

Nicht berührt. Keine Migration. Supabase in diesem Run nicht gelesen und nicht geschrieben.

## 7. Kosten / Provider / Secrets

Keine neuen laufenden Kosten. Keine Secrets. Keine paid calls. Kein Vendor gewählt.

## 8. Risiken / Unsicherheiten

Siehe Self-Review. Neu material:

- Official-Truth kann nach einem späteren Adapter ohne TTL dauerhaft `current` bleiben (G-S4-TTL).
- Sherpa-Tutorial widerspricht der No-Default-Citizenship-Invariante (G-MAP-ORIGIN-NAT).
- Sherpa öffentlich 3 Transit-Nodes vs Jetnity 12 Transitländer; silent drop wäre Fake-Truth (G-MAP-TRANSIT-CAP).
- Öffentliche Sherpa-Quota-Schichten sind Evidence, nicht Jetnitys Vertrag.
- Timatic Widget ist Planungs-Oberfläche, nicht AutoCheck-REST.

Weiter: Timeout/Kill-Switch vor Adapter; Vendor-Shape und License `unknown`; Workspace ohne serverseitige Evaluations; Docs-Drift in globalen Dateien (TL-owned).

## 9. Offene Freigaben

- Unabhängiger Technical-Lead Exact-Head-**Re-Review**
- Ready/Merge nur Technical Lead
- Jede Vendor-/Secret-/paid-/PII-Entscheidung bleibt PO-Gate

## 10. Exakter nächster Schritt

**STOPP** für unabhängigen Technical-Lead Exact-Head-Review von PR #289 auf dem **neuen** Head.

Kein Ready. Kein Merge. Kein S4-R1-Start.

## 11. Zuerst lesen

1. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_GATE0_TASK_2026-08-30.md`
2. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_HANDOFF_2026-08-30.md`
3. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_AUDIT_2026-08-30.md`
4. `docs/REQUIREMENTS_PROVIDER_SELECTION_MATRIX_2026-08-30.md`
5. `docs/REQUIREMENTS_PROVIDER_CONTRACT_GAP_MAP_2026-08-30.md`
6. `docs/REQUIREMENTS_PROVIDER_GROUNDWORK_SELF_REVIEW_2026-08-30.md`
