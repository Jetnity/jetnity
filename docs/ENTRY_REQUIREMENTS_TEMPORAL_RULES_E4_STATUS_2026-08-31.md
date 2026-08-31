# Entry Requirements Temporal Rules E4 – Status

Stand: 31. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5**  
Cursor-Agent: **`Jetnity entry requirements temporal rules 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-69084bbc-a7ab-4ed5-8418-754bea9ee241`  
Issue: [#315](https://github.com/Jetnity/jetnity/issues/315)  
Branch: `feat/entry-requirements-temporal-rules-e4-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/316

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Kleinster provider-neutraler Folgeschritt nach E3:

1. `relative_duration` Temporal-Rule-Contract mit geschlossenen Anchors und `before|at|after`
2. `availableFrom` / `dueBy` mit explizit `mandatory|recommended`
3. Timing nur aus expliziten strukturierten Provider-Metadaten
4. Temporal Rule nur auf trusted/current `required|conditional`
5. malformed Timing zerstört keine Requirement-Hard-Truth
6. Duplicate-Timing-Konflikte fail-closed und permutationsstabil
7. relative Besucher-Copy ohne Kalender-Timestamps

Kein echter Provider. Keine Secrets/paid calls. Keine Supabase/Auth/RLS. Keine Deadline-Projektion, keine Task-/Reminder-Runtime. Factory bleibt `null`.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `e387d2e88c3cc0ccd9d8d858c9eb57a3cdc84e62` |
| Task-Baseline | `main@1937e32abad11678386d723973bc770210d17ff1` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #316 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

## 3. Bereits umgesetzt

- `lib/readiness/temporal.ts`: Parser, Safety-Bound `1_051_200` Minuten, Vergleichsschlüssel, relative Copy
- `RequirementsProviderZeile.temporalRule` als Rohwert; `OfficialEvaluation.temporalRule` normalisiert, default `null`
- Engine übernimmt Timing nur bei trusted/current `required|conditional`; Visa-Degradation und `officialLeer` bleiben `null`
- Duplicate gleiche Entscheidung + abweichendes Timing (inkl. `null` vs. Wert): Requirement bleibt, Timing `null`
- E3-Checkliste zeigt `timingTexte` nur aus dem Contract und nur bei current/current
- `requirementsProviderAus()` bleibt `null`
- Gezielte Tests in `lib/readiness/e4-temporal-rules.test.ts`

## 4. Nicht umgesetzt / bewusst nicht angefasst

- echter Requirements-/Visa-/Entry-Provider
- Providerwahl, Vendorvertrag, DPA, Secrets, API Keys, paid calls
- Factory-Flip
- konkrete Timestamp-/Deadline-Projektion, Zeitzonen-/DST-Auflösung
- Calendar-day- / lokale-Uhrzeit-Regeln
- Task-/Completion-State, Reminder/Push/E-Mail/Notification
- Supabase / Migration / RLS / Auth / MFA / AAL
- Passnummer, MRZ, Scans, Biometrie, Gesundheitsakte
- Credential-Ranking / „bester Pass“
- Gebühren, Aufenthaltsdauer, Seitenzahl, Proof-of-Funds-Beträge
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`
- E5 / Folgeslice

## 5. Tests / CI / Preview

Lokale Evidence dieses Agenten; Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/e4-temporal-rules.test.ts` | pending local run |
| `lib/readiness/e1-detail-contract.test.ts` | pending |
| `lib/readiness/e2-official-actions.test.ts` | pending |
| `lib/readiness/e3-visitor-checklist.test.ts` | pending |
| `npm test` | pending |
| `npm run typecheck` | pending |
| `npm run lint` | pending |
| `npm run build` | pending |
| Hygiene | pending |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein Real-Device-Abnahmescope) |

## 6. Risiken / Residuals

- Ohne Provider bleibt Timing praktisch unsichtbar. Das ist ehrlich, nicht leer.
- 72 Stunden werden als `72 Std.` gezeigt, nicht als `3 Tage`; Tage erst ab 4 ganzen Tagen.
- `validFrom`/`validUntil` bleiben Evidence-Gültigkeit und werden nicht als Action-Fenster gelesen.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #316. Nicht Ready. Nicht mergen. Kein E5.
