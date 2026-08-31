# Entry Requirements Visitor Checklist E3 – Status

Stand: 31. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E4**  
Cursor-Agent: **`Jetnity entry requirements checklist 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-101a3978-c843-4ac5-8678-112eef039283`  
Issue: [#311](https://github.com/Jetnity/jetnity/issues/311)  
Branch: `feat/entry-requirements-checklist-e3-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/312

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster provider-neutraler Folgeschritt nach E1/E2:

1. vorhandene Official Evaluations lossless als Besucher-Checkliste zeigen
2. eine Zeile = `Traveller × Credential-Option × Destination/Transit × Requirement Type`
3. fail-closed Ergebnis-/Freshness-Copy
4. strukturierte Visa-/eTA-/Requirement-Labels und Presentation-Gruppen
5. Credential-Label nur aus exakter Trip-/Traveller-Auflösung
6. purpose-spezifische Official Actions, keine URL-Heuristik, keine URL-Doppelung
7. keine neue Hard Truth, kein Provider, keine Deadline-Runtime

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `59a2939f8f073b38fb26478db082085515734112` |
| Task-Baseline | `main@25f0af9ab92f0757ea7e4bc6c42c2fbbb01c45f5` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #312 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

## 3. Bereits umgesetzt

- `lib/readiness/official-presentation.ts`: Gruppierung, fail-closed Zeilen-Copy, Credential-/Ort-/Prüfzeit-Text, Action-Dedup
- Labels in `lib/readiness/bezeichnungen.ts` aus geschlossener Taxonomie (Visa-Modi, eTA, `blank_passport_pages`, `financial_means`, Missing Facts)
- `Reisevorbereitung` zeigt konkrete Official-Karten statt nur Traveller-Summe; Actions nutzen `officialActionZweckText`
- Credential-Label: exakte `credentialOptionRef` → Dokumenttyp + `issuingCountryCode`; Citizenship nur bei exaktem `citizenshipClientRef`; sonst `Reisedokument-Option`
- `checkedAt` als `Jetnity-Prüfung … UTC`, nicht als Quellen-Update
- `requirementsProviderAus()` bleibt `null`
- Gezielte Tests in `lib/readiness/e3-visitor-checklist.test.ts`

## 4. Nicht umgesetzt / bewusst nicht angefasst

- echter Requirements-/Visa-/Entry-Provider
- Providerwahl, Vendorvertrag, DPA, Secrets, API Keys, paid calls
- Factory-Flip
- Supabase / Migration / RLS / Auth / MFA / AAL
- Passnummer, MRZ, Scans, Biometrie, Gesundheitsakte
- Credential-Ranking / „bester Pass“
- Notification-/Deadline-/Scheduler-Runtime
- Gebühren, Aufenthaltsdauer, Seitenzahl, Proof-of-Funds-Beträge, `available_from` / `due_at`
- großer Workspace-/IA-Redesign
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`
- E4 / Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieses Agenten; Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/e3-visitor-checklist.test.ts` | **16/16 pass** |
| `lib/readiness/e1-detail-contract.test.ts` | pass |
| `lib/readiness/e2-official-actions.test.ts` | pass |
| `lib/readiness/bezeichnungen.test.ts` | pass |
| `lib/readiness/official-option-scope.test.ts` | pass |
| `npm test` | **2896/2896 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine neuen Errors) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein Real-Device-Abnahmescope) |

## 6. Risiken / Residuals

- Ohne Provider bleiben die meisten Zeilen fail-closed `provider_unavailable` / Missing Facts. Das ist ehrlich, nicht leer.
- `visa` + `unknown` erscheint in `Vor Abreise erledigen` als `Visumstatus` / `Erneut prüfen`, niemals als erledigter Antrag.
- Eine abweichende `sourceUrl` erzeugt eine zweite Action `Offizielle Quelle öffnen`. Dieselbe URL bleibt einfach.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #312. Nicht Ready. Nicht mergen. Kein E4.
