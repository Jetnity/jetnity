# Entry Requirements Temporal Projection E5-A – Status

Stand: 31. August 2026  
Status: **TL CHANGES REQUIRED BEHOBEN / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B**  
Cursor-Agent: **`Jetnity entry requirements temporal projection 1`**, Generation 1  
Ursprüngliche Implementation: Session `bc-01a057e1-e45f-79d8-a828-97be0e060415` (abgeschlossen; nicht wieder geöffnet)  
TL-Review-Fix-Recovery: Session `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`  
Grund: GitHub/Cursor konnte die abgeschlossene ursprüngliche Session trotz expliziter Fortsetzungsanweisung nicht wieder öffnen.  
Rolle: nur mechanischer enger Review-Fix — **keine** gleiche Session, keine neue Produktgeneration, kein neuer Slice  
Issue: [#323](https://github.com/Jetnity/jetnity/issues/323)  
Branch: `feat/entry-requirements-temporal-projection-e5a-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/324

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 0. Session-Abweichung (verbindlich)

Live Evidence: die ursprüngliche Implementation-Session `bc-01a057e1-e45f-79d8-a828-97be0e060415` war bereits beendet. GitHub/Cursor konnte sie trotz expliziter Fortsetzungsanweisung nicht wieder öffnen und erzeugte die Recovery-Session `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`.

STOP und alle späteren Recovery-Anweisungen landeten in `bc-c3909ff8-66de-4b95-afeb-cff18935b4fc`. Das ist **nicht** die ursprüngliche Session.

Der Technical Lead hat diese Recovery-Session danach **eng** als mechanischen Carrier für Kommentar `5478873885` und den Provenance-Grenzfall (whitespace-only `eventRef`) freigegeben. Kein Generation-2-Slice, kein neuer Produktauftrag.

Ein früherer TL-Stand `b7fd5a580a08a6b19c6f542703072c6f8fdc98b4` dokumentierte die Session-Abweichung noch nicht wahrheitsgetreu und enthielt den Provenance-Fix noch nicht. Beide Punkte liegen jetzt im Tree.

---

## 1. Arbeitsblock / Ziel

Kleinster provider-neutraler Folgeschritt nach E4 / R1, plus enger TL-Review-Fix:

1. Reiner Next-freier Projektions-Core auf bestehenden E4-Typen
2. nur explizit gebundene absolute `Z`- oder Offset-Instants
3. `before` / `at` / `after` exakt in Minuten
4. Partial fail-closed: `missing_anchor`, `invalid_instant`, `invalid_projected_window`
5. Cross-Anchor-Fenster erst nach beiden projizierten Instants; unmöglich → kein Action Window
6. `eventRef` bleibt Provenance; keine Occurrence-/Country-Auswahl
7. **Review-Fix:** leere/ungültige Regeln liefern pro Aufruf eine frische Projection; kein gemeinsam mutierbares Modul-Singleton
8. **Review-Fix:** whitespace-only `eventRef` ist keine stabile Occurrence-Identität (`missing_anchor`)

Kein echter Provider. Keine Secrets/paid calls. Keine Supabase/Auth/RLS. Keine Deadline-UI, keine Task-/Reminder-Runtime. Factory bleibt `null`.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Task-Start-Head | `4e1af2fcd8ecc0ac147fd7b8eb6f19326f40ffc7` |
| Task-Baseline | `main@1600767be5ec87961e1d5b5e10c4bcc2f6eb51aa` |
| `origin/main` vor diesem Handoff | `1600767be5ec87961e1d5b5e10c4bcc2f6eb51aa` (0 behind, unverändert) |
| Vorheriger TL-Review-Head | `ae091777e5aec0d5a0b6baf8b28a5ce1234c967d` — **CHANGES REQUIRED** (Kommentar `5478873885`) |
| Purity-Fix-Commit | `85aef5e2673bc06f0e6d7cb76d91aeeadf47e590` |
| Provenance-Fix-Commit | `fbf631c3cf86b26b069ac028dd2aef303162f6c2` |
| Finaler Branch-Tip | **nicht** im Tree self-embedded; live nach Push im PR |
| Draft-PR | #324 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |
| `JETNITY_START_HERE.md` | nicht angefasst |

Alle Gates auf `ae091777...` und `85aef5e2...` sind historisch und zählen nicht für den neuen Head.

## 3. Bereits umgesetzt

- `lib/readiness/temporal-projection.ts`: Instant-Parser nur für `Z` / `±HH:MM`, UTC-Normalisierung, Anchor-genaue Bindings, Partial Issues, Action Window
- E4-Typen (`OfficialTemporalRule`, Anchors, Punkte, `dueBy`-Semantik) werden importiert, nicht kopiert
- Safety-/Flight-/Route-Domain bleiben ungekoppelt; zonenlose `YYYY-MM-DDTHH:mm` wird nicht als UTC gelesen
- Gezielte Tests in `lib/readiness/e5a-temporal-projection.test.ts` (18 Fälle inkl. Pflicht-, Isolation- und whitespace-`eventRef`-Regression)
- ADR-0206 und knapper `ARCHITECTURE.md`-Nachzug (unverändert in diesem Fix)
- `requirementsProviderAus()` bleibt `null`

### TL-Review-Fix (Kommentar `5478873885`)

- `const LEERE_PROJEKTION = { ..., issues: [] }` entfernt
- `leereProjektion()` erzeugt pro Aufruf ein neues Objekt
- Regression: zwei leere Projektionen teilen keine Referenz; Mutation eines früheren Ergebnisses kontaminiert spätere Aufrufe nicht
- Quelltext-Guard: Identifier `LEERE_PROJEKTION` darf nicht zurückkehren

### TL-Provenance-Fix (whitespace-only `eventRef`)

- `eventRefLesen()` lehnt Whitespace-only (`'   '`, Tab, Newline) fail-closed ab
- bestehende Semantik: `missing_anchor`, `eventRef: null`, kein anderes Binding als Fallback
- keine neue EventRef-Taxonomie, kein Trim/Rewrite gültiger Identitäten
- Regression in `e5a-temporal-projection.test.ts`

## 4. Nicht umgesetzt / bewusst nicht angefasst

- Trip/Route→Event-Resolver, Country→Occurrence, Stage-/Segment-Auswahl
- IANA-Zone / Airport-/Place-Heuristik / neue Timezone-Datenbank
- `Z` an lokale Flug-/Stage-Zeiten
- Requirements-Provider-Contract oder `OfficialEvaluation`-Scope
- Workspace-Deadline-UI, `too early / upcoming / actionable / overdue`
- Task-/Completion-Persistenz, Reminder/Push/E-Mail/Notification
- Supabase / Migration / RLS / Auth / MFA / AAL
- Providerwahl, Vendorvertrag, DPA, Secrets, API Keys, paid calls
- Factory-Flip
- Credential-Ranking / „bester Pass“
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`
- E5-B / Folgeslice
- Keine neue Generation, kein neuer Scope über Purity- und Provenance-Fix hinaus

## 5. Tests / CI / Preview

Lokale Evidence dieser Recovery-Session nach Purity- und Provenance-Fix; Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/e5a-temporal-projection.test.ts` | **18/18 pass** (inkl. Isolation und whitespace-`eventRef`) |
| `lib/readiness/e4-temporal-rules.test.ts` | **17/17 pass** |
| `npm test` | **2946/2946 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen, keine neuen Errors) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| GitHub Actions / Vercel Preview | gelten nicht für einen älteren Head; live am finalen Tip prüfen |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-/Real-Device-Abnahmescope) |

## 6. Risiken / Residuals

- Ohne späteren Resolver gibt es keine automatische Trip→Event-Bindung. Das ist der Slice-Zweck, nicht ein Defekt.
- `actionWindow` ist die einzige Fenster-Wahrheit. Bei `invalid_projected_window` bleiben die einzeln gerechneten Punkte zur Provenance sichtbar, das Fenster selbst ist `null`.
- Safety-`isoZeitLesen` wurde bewusst nicht wiederverwendet: nur `Z`, Safety-Domäne, Task verbietet die Kopplung.
- Erfolgreiche Projektionen bleiben gewöhnliche mutable Objects. Der Fix gilt für den früher geteilten leeren Pfad; Aufrufer sollten Ergebnisse nicht mutieren.
- Agent-Self-Review ≠ Technical-Lead-PASS.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Re-Review von Draft-PR #324 auf dem **neuen** Head. Nicht Ready. Nicht mergen. Kein E5-B.
