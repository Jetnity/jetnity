# Supabase Migration-History Replay Defect – Gate 0 Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Jetnity infrastructure migration audit 1`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS  
Cloud-Run: https://cursor.com/agents/bc-a53a673c-56d1-4729-ae27-6ce4cf8a75b3  
Generation: **1**

## 1. Auftrag gegen Diff

Auftrag: nur `docs/SUPABASE_MIGRATION_HISTORY_REPLAY_DEFECT_GATE0_TASK_2026-08-29.md`. Audit/evidence only.

Geprüft: Task, Findings, Live Evidence, Recommendation, Status, Handoff, dieses Self-Review.

Nicht geändert: AP-7-S3-/Account-Traveller-Runtime, Account-Navigation, Shared Traveller Contracts, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `DECISIONS.md`, Migrationen, Schema, RLS, Grants, Auth.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Ist live `origin/main` noch die Task-Baseline `b2857117`? | Ja. `git fetch origin main` + `git rev-parse origin/main`. 0 behind. |
| Wurde Production oder Development mutiert? | Nein. Nur SELECT/GET. |
| Wurde ein Rebase/Reset/Repair/Apply ausgeführt? | Nein. |
| Ist die Statement-0-Ursache live belegt? | Ja: Production `statements[1]` ist der 234-Zeichen-Prosa-Marker. |
| Wird der originale Dashboard-Logtext als abgerufen behauptet? | Nein. Analytics lieferte keine Branch-Action-Zeile. |
| Wird Production-Schema als fehlend behauptet? | Nein. Objekte, RLS, Gate `false`, 0 Rows sind belegt. |
| Wird Development als kataloggleich zu Production behauptet? | Nein. S5-B-Objekte fehlen live. |
| Wird ein Repair gestartet oder Ready/Merge vorgeschlagen als Agentenaktion? | Nein. |
| Wurden globale Current-State-Dateien angefasst? | Nein. |
| Wurden Traveller-/Account-Runtime-Dateien angefasst? | Nein. |
| Ist `migration repair` fälschlich als Body-Fix verkauft? | Nein. CLI applied/reverted ändert nur die Versionszeile. |
| Kosten/Provider/TW-8 berührt? | Nein. |

## 3. Was vorher unklar / leicht falsch gelesen werden konnte

AP-7-S2 Status sagt, `develop` sei auf den Production-Migration-Tip resetet und healthy. Live fehlt `20260829140000` und die S5-B-Objekte. Der Handoff korrigiert das: Reset/Replay kann den Marker nicht materialisieren. Die S2-History heisst ausdrücklich `…_after_reset`.

Die ältere S5-B-Notiz „Function-Source nicht byte-identisch zur Repo-Datei“ bleibt eine Serialisierungs-/Normalisierungsgrenze. In dieser Session sind Production- und Development-`reise_anlegen` **zueinander** identisch.

## 4. Bewusst nicht getan

- kein Preview-Branch zur Replay-Reproduktion erzeugt (wäre Mutation/Kosten)
- kein History-UPDATE
- kein Support-Ticket
- kein ADR in `DECISIONS.md`
- kein Schliessen von #216
- kein Ready/Merge

## 5. Residuals

- Dieser Stamp-Push braucht eigene Exact-Head-CI/Vercel.
- `main protected=false`.
- Originaler Branch-Action-Fehlertext bleibt unbestätigt.
- S2- und C1-Versionsdrift bleiben rebase-relevant und sind nicht repariert.
- Agent-Self-Review ist kein PASS.

## 6. Urteil

Der Audit beantwortet die sieben Task-Fragen mit live belegter History-Ursache, klarer Schichtung History-only vs Environment-Drift und einer kleinen, gegateten späteren Repair-Empfehlung.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ist kein PASS.**
