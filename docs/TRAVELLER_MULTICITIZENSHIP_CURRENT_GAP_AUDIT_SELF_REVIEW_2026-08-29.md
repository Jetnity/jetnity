# Traveller / Multi-Citizenship Current Gap Audit — Self-Review

Stand: 29. August 2026  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity traveller multicitizenship audit 1`**  
Generation: **1**  
Exact Head: Stamp-Commit dieses Reviews; live an PR #198 prüfen

> Agent-Self-Review ist **kein** Technical-Lead PASS.

## 1. Scope-Treue

| Anforderung | Gehalten? | Evidence |
| --- | --- | --- |
| Neue audit-spezifische Docs only | ja | fünf neue `docs/TRAVELLER_MULTICITIZENSHIP_*` Dateien inkl. Proposal |
| Kein Runtime/UI/Provider-Code | ja | Diff enthält keine `lib/` / `app/` / `components/` / Provider-Dateien außer bereits auf `main` liegender unveränderter Code |
| Keine Migration / Supabase / RLS / Grants | ja | `supabase/` unberührt |
| Keine globalen Current-State-Dateien | ja | `ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`, `ROADMAP.md`, `DECISIONS.md`, `JETNITY_START_HERE.md` unberührt |
| Kein Ready / Merge / Folgeslice | ja | Handoff STOP |
| Current Truth neu rekonstruiert, 26-Aug nicht kopiert | ja | Delta-Tabelle im Audit; P1-TA-02 / P2-TA-06 gegen aktuellen Code neu gelesen |
| `origin/main` vor Handoff neu geholt | ja | `085c95b2`, 0 behind |

Bewusste Policy-Spannung: Progress-Persistence verlangt sonst ein Update von `docs/ACTIVE_WORK_STATUS.md`. Der **versionierte Task** verbietet genau das. Continuity dieses Blocks liegt in Status/Handoff/Self-Review.

## 2. Fakten gegen Code

Jeder nicht-`correct` Befund wurde gegen aktuellen Code gelegt, nicht gegen den 26-Aug-Text.

| Claim | Gegenprüfung |
| --- | --- |
| Kein produktives `documents[0]` | `rg` auf `lib/**/*.ts` außerhalb Tests: keine produktive Nutzung; Engine baut `optionsAusDokumenten` |
| `officialAusEvaluations` kein First-Eval-Truth | Dateiheader + `darstellungErlaubt`; `result: 'unknown'`; `official-option-scope.test.ts` |
| `officialFuerItem` ohne Cross-Traveller-Fallback | `evaluationsFuerItemScope`; leere Menge → `insufficient_context`, nicht alle Evaluations |
| AP-7 S1 latent | `accountRegistry*` nur `lib/traveller/*` |
| Guest→Account erhält Relation | `GastreiseBruecke.tsx` mappt `citizenshipClientRef` |
| Safety set-scharf | `travellerRelevant` nutzt `citizenshipCodesAus` |
| `party_schreiben` `DO NOTHING` | Migration `20260822160000` L371, nach Delete-All-Children |
| Requirements-Provider null | `requirementsProviderAus()` `return null` |
| Provider-Suche nur Kopfzahl | `flugPassagiereAusReise` liest `reise.travellers` |

Nicht behauptet:

- frischer Production-Katalog;
- Browser-/Real-Device-Beweis;
- dass globale Statusdateien aktuell sind;
- dass der sichtbare Cursor-Titel umbenannt wurde.

## 3. Severity-Disziplin

- Kein P0: kein Data-Loss, kein Security-Bypass, keine erfundene Visa-Pflicht.
- Kein aktuelles Official-P1: die früheren P1/P2-Runtime-Funde sind integriert; verbleibende Presentation-Reste sind fail-closed und providerlos.
- AP-7-S2 ist P2-Programm-Lücke, kein versteckter Runtime-Default-Pass.
- Historical-Audit-P1-TA-02 / P2-TA-06 werden **nicht** als offene Current Findings geführt.

## 4. Traveller-Context / Dual-Authority

- Mehrere Citizenships/Documents bleiben first-class im Trip-Modell.
- Keine Merge-Regel Registry→Snapshot erfunden.
- Guest→Account bleibt trip-scoped.
- Sensitive Felder nicht vorgeschlagen.

## 5. Tests tatsächlich gelaufen

Siehe nachgetragenes Ergebnis unten nach dem lokalen Lauf. Nicht gelaufene Gates werden nicht als grün behauptet.

## 6. Residual / Reviewer-Hinweise

1. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` sagt noch „S1 Draft-PR #145“. Das ist Current-State-Drift auf `main`, außerhalb dieses Diffs.
2. Checkpoint V2 sagt, der kanonische Vertrag dürfe nicht erneut inventarisiert werden. Dieser Audit inventarisiert **Restlücken**, erfindet den Vertrag nicht neu. Falls der Reviewer das als Duplicate-Audit wertet: der Task hat die Rekonstruktion ausdrücklich verlangt.
3. `officialFuerItem` bleibt traveller+land-scharf. Das ist nach P1-TA-02 fail-closed, nicht der alte `[0]`-Kollaps.
4. Jeder neue Push invalidiert Prior-Gates von `dced988b`.

## 7. Verdict des Autors

Authoring-seitig: **scope-treu, evidence-bound, STOP für unabhängigen Exact-Head-Review.**

Kein PASS. Kein Ready. Kein Merge.
