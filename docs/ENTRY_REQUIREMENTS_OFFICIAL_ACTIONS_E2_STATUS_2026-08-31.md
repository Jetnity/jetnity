# Entry Requirements Official Actions E2 – Status

Stand: 31. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E3**  
Cursor-Agent: **`Jetnity entry requirements official actions 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-805154de-4953-44e4-b2f5-8efdfd9af0ec`  
Issue: [#306](https://github.com/Jetnity/jetnity/issues/306)  
Branch: `feat/entry-requirements-official-actions-e2-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/307

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster provider-neutraler Folgeschritt nach E1:

1. Official Evidence Source (`sourceUrl`) von konkreter Official Action trennen
2. geschlossene Zwecke `application` | `form` | `appointment` | `information`
3. explizite Action nur aus `actionPurpose` + validierter HTTPS-`actionUrl`
4. `sourceUrl` höchstens als `information`; niemals Antrag/Formular/Termin
5. ungültige Action-Metadaten ändern keine Requirements-Hard-Truth
6. fail-closed Evaluations tragen keine riskante Action
7. Multi-Credential-Isolation und bestehende E1 `result ↔ visaMode`-Regeln bleiben

Kein echter Provider. Keine Secrets/paid calls. Keine Supabase/Auth/RLS. Keine Deadline-Runtime. Kein UI-Großumbau. Factory bleibt `null`.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `666756a5a8a8f55e1eb39e7128ef9c526f44e26e` |
| Task-Baseline | `main@a57a15a6c8011ea81af1a228a2fd0c3e6e0853b9` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #307 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

## 3. Bereits umgesetzt

- `OFFICIAL_ACTION_PURPOSES` und `OfficialAction` als `{ kind: 'open_official_action', purpose, href }`
- Provider-Port: optionale `actionUrl` / `actionPurpose` auf `RequirementsProviderZeile`
- `officialActionPurposeLesen` / `officialAktionAusMetadaten`: nur exakte Zwecke, gleiche HTTPS-Validierung wie `quelleUrlLesen`
- `officialAktionAusQuelle` bleibt information-only Fallback aus `sourceUrl`
- Engine übernimmt Actions nur auf dem bestehenden `uebernehmbar`-Pfad; sonst `null`
- `officialVisaWiderspruchDegradieren` setzt weiterhin `action: null`
- Action-Metadaten gehören nicht zur Evidence-Trust-Grenze
- Kleiner Presentation-Helper `officialActionZweckText` nur aus strukturiertem Zweck
- Traveller-/Multi-Citizenship-/Multi-Document-Invariants unverändert
- `requirementsProviderAus()` bleibt `null`
- Gezielte Tests in `lib/readiness/e2-official-actions.test.ts`

## 4. Nicht umgesetzt / bewusst nicht angefasst

- echter Requirements-/Visa-/Entry-Provider
- Providerwahl, Vendorvertrag, DPA, Secrets, API Keys, paid calls
- Factory-Flip
- Supabase / Migration / RLS / Auth / MFA / AAL
- Passnummer, MRZ, Scans, Biometrie, Gesundheitsakte
- Notification-/Deadline-/Scheduler-Runtime
- automatische Web-/LLM-Recherche als Official Truth
- Visa-Agentur als „offizielle“ Stelle
- Gebühren-/Stay-Duration-/Required-Documents-Großerweiterung
- UI-Redesign des Trip Workspace
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP
- E3 / Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieses Agenten; Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/e2-official-actions.test.ts` | **19/19 pass** |
| `lib/readiness/e1-detail-contract.test.ts` | pass (E1 result↔visaMode unverändert) |
| `lib/readiness/bezeichnungen.test.ts` | pass |
| `lib/readiness/engine.test.ts` | ausstehend im vollen Gate-Lauf |
| `npm test` | ausstehend im vollen Gate-Lauf |
| `npm run typecheck` | ausstehend |
| `npm run lint` | ausstehend |
| `npm run build` | ausstehend |
| Hygiene-Checks | ausstehend |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Slice) |

## 6. Risiken / Residuals

- `sourceUrl` ohne explizite Action bleibt eine klickbare `information`-Action auf trusted current Evaluations. Das erhält Presentation-Kompatibilität und ist kein Antrag.
- Eine valide `actionUrl` ohne gültigen Purpose wird höchstens `information`, nicht application/form/appointment.
- Unterschiedliche Actions bei gleichem Resultat derselben Credential-Option sind kein semantischer Konflikt (`entscheidungenGleich` vergleicht Actions bewusst nicht). Navigation ist keine Hard Truth.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #307. Nicht Ready. Nicht mergen. Kein E3.
