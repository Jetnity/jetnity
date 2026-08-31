# Entry Requirements Detail Contract E1 – Status

Stand: 31. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity entry requirements detail 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-ed28b92e-5bca-4a79-88bb-773205180d40`  
Issue: [#298](https://github.com/Jetnity/jetnity/issues/298)  
Branch: `feat/entry-requirements-detail-contract-e1-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/300

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster struktureller Folgeschritt aus der bestätigten Entry-Requirements-Zielarchitektur:

1. First-Class-Typen `blank_passport_pages` und `financial_means`
2. strukturierter Visa-Modus nur am Typ `visa`
3. verlustfreier Transport Provider-Zeile → Engine → `OfficialEvaluation`
4. strikte Normalisierung: ungültig → `unknown`; nicht-Visa inklusive eTA → `null`
5. Tests und dauerhafte Evidence

Kein UI. Keine Deadline-/Notification-Runtime. Kein Vendor/Adapter. Keine Secrets/paid calls. Factory bleibt `null`.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `2bec7c2d3ae7967175d1a9828c6715a577376df0` |
| Task-Baseline | `main@7f057e6ee8caddf87a3b5365731eaf43d037a114` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #300 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

## 3. Bereits umgesetzt

- `OFFICIAL_REQUIREMENT_TYPES` um `blank_passport_pages` und `financial_means` erweitert
- `OFFICIAL_VISA_MODES` / `visaMode` als strukturierte Subtype-Semantik nur für `requirementType === 'visa'`
- `visaModeLesen()` als einzige Normalisierung: ungültig/`null` → `unknown`; jeder Nicht-Visa-Typ → `null`
- Engine übernimmt einen konkreten Visa-Modus nur auf dem bestehenden Trust-/Freshness-Pfad (`uebernehmbar`); sonst `unknown`/`null`
- `entscheidungenGleich` unterscheidet widersprüchliche Visa-Modi; Evidence-URLs allein bleiben kein Konflikt
- `requirementsProviderAus()` bleibt `null`
- Traveller-/Multi-Citizenship-/Multi-Document-Invariants unverändert
- S4-R1 Timeout/Abort/Kill-Switch/Freshness unverändert
- Gezielte Tests in `lib/readiness/e1-detail-contract.test.ts`

## 4. Nicht umgesetzt / bewusst nicht angefasst

- Visitor-Detailkarten / UI
- Deadline-, Task- oder Notification-Runtime
- Gebühren, Aufenthaltsdauern, Passseitenzahlen, finanzielle Schwellen
- Providerwahl, Adapter, Vendor-Kontakt, Vertrag, DPA
- Secrets, API Keys, reale/paid calls
- Factory-Flip
- Supabase / Migration / RLS / Auth / MFA / AAL
- Account-Traveller-Registry- oder Trip-Snapshot-Authority
- Passnummer, MRZ, Scans, Biometrie, Gesundheitsdaten
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP
- Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieses Agenten; Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/e1-detail-contract.test.ts` | **16/16 pass** |
| `lib/readiness/engine.test.ts` | pass (bestehende Engine + P2-TA-06, Typenliste um E1 erweitert) |
| `lib/readiness/s4-r1-truth-ops.test.ts` | pass |
| `lib/trips/attention.test.ts` | pass (Pflichtslots folgen `OFFICIAL_REQUIREMENT_TYPES`) |
| `npm test` | **2850/2850 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine neuen Errors) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Slice) |

## 6. Risiken / Residuals

- Attention-Pflichtslots wachsen um zwei Typen pro Traveller × Credential-Option × Destination. Ohne Provider bleiben sie fail-closed `unknown`/`unavailable`. Das ist die First-Class-Konsequenz, keine UI-Arbeit.
- `credentialOptionenVergleichen` rangt Visa-Modi noch nicht (z. B. `visa_exempt` vs `visa_before_travel`). Ranking wäre Produktarbeit und liegt ausserhalb E1.
- Konkreter Visa-Modus ist Hard Truth und erscheint nur auf trusted current Evaluations. Das ist bewusst strenger als ein Roh-Durchreichen untrusted Providerwerte.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #300. Nicht Ready. Nicht mergen. Kein Folgeslice.
