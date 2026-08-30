# Requirements Truth-Ops S4-R1 – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity requirements truth ops 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-49df8304-48ed-4820-bdf4-57f53aa1aaee`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #292 / S4-R1 only.

Geprüft: Abort-Vertrag; 4 s Domain-Timeout mit Cancellation; `req.signal`; Failure-Arten; Kill-Switch `JETNITY_READINESS_AKTIV`; Factory `null`; 60-min `checkedAt`-Ceiling; keine Hard Truth aus Fehlern; keine Vendor-/Secret-/paid-Calls; keine Supabase-/Auth-Änderung; Traveller-Invariants unverändert; Tests; Slice-Docs. `docs/ACTIVE_WORK_STATUS.md` nicht editiert.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wird ein Provider aktiviert oder die Factory non-null? | Nein. `requirementsProviderAus()` bleibt `null`. Tests injizieren Doubles. |
| Kann Production den Kill-Switch umgehen? | Nein. `providerOpsZustand` ist in Production hart aus, auch mit Flag + Provider-Objekt. |
| Reicht Flag an ohne Provider? | Nein. `ohne-zugang`. |
| Startet ein bereits aborted `req.signal` den Provider? | Nein. Abruf kehrt sofort mit `aborted` zurück. |
| Ist Timeout nur ein Race ohne Abort? | Nein. `AbortController.abort()` läuft; zusätzlich bounded Promise-Race, falls der Adapter ignoriert. |
| Kann ein Client 20 s Timeout erzwingen? | Nein. `requirementsTimeoutBegrenzen` kappt auf 4.000 ms. |
| Werden Timeout und Abort öffentlich vermischt, intern aber unterscheidbar? | Ja. Intern eigene `art`; öffentlich beide `source_temporarily_unavailable`. |
| Wird aus Throw `required`/`not_required`/`conditional`? | Nein. `officialLeer` mit `unknown`. |
| Landen Raw-Error-/Secret-Strings in Evaluations? | Nein. Return-Typ trägt nur `art`; Evidence bleibt leer. |
| Ist `checkedAt` mit Vendor-`lastUpdatedAt` gleichgesetzt? | Nein. Kommentar + Ceiling gelten nur für Jetnity-Retrievalzeit. |
| Bleibt Evidence älter als 60 min `current`? | Nein. `>=` Ceiling → `recheck_needed`. Unbounded Max-Age wird gekappt. |
| Wird `documents[0]` / `evaluations[0]` / Default-Citizenship eingeführt? | Nein. Engine-Normalisierung und Option-Scope unverändert. Bestehende Multi-Traveller-Tests bleiben die Regression. |
| Wurde Workspace live verdrahtet? | Nein. |
| Wurde Safety/Seasonal/Auth/DB mitgeschleppt? | Nein. Board ändert nur die Readiness-Zeile. |
| Wurde Ready/Merge/Folgeslice gestartet? | Nein. |

## 3. Bewusste Schwächen, die bleiben

- Ohne späteren Adapter ist der Kill-Switch in Preview/Production beobachtbar, aber nicht wirksam als zweite Bremse neben Factory `null`. Das ist der Slice-Vertrag, kein Defect.
- Ein ignorierender Adapter kann nach Timeout intern weiterlaufen; die Domain wartet nicht und mintet nicht.
- Clock-Skew bleibt die bestehende 5-min-Trust-Grenze, getrennt vom 60-min-Ceiling.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Urteil des Autors

Während der lokalen Gates zwei Author-Fixes: `engine.test.ts` reicht das AbortSignal beim Capture-Double weiter (Typecheck); `readinessUmgebungAusProzess` ist nicht mehr exportiert (`check:exports`). Beide gehören zum Slice-Diff.

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice. CI/Vercel am Exact Head bleiben live zu prüfen.

**Unabhängiger Technical-Lead-Review:** ausstehend.
