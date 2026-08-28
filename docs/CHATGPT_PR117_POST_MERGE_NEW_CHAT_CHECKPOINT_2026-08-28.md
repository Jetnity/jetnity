# Jetnity – PR #117 Post-Merge New Chat Checkpoint

Stand: 28. August 2026  
Typ: **POST-MERGE CONTINUITY / LIVE-EVIDENCE CHECKPOINT**

## 1. Verifizierter Integrationsstand

P2-TA-03 ist abgeschlossen und integriert.

- PR #117: **MERGED**
- Issue #116: **CLOSED / completed**
- Author-Branch: `docs/p2-ta-03-account-plan-reconciliation`
- Final reviewed Author-Head: `152402a6e8ab1ce8c586014abfe6109c6d015c0e`
- Technical-Lead Final PASS Review: `5046772197`
- Merge-Commit auf `main`: `b912315d19544db96c37f503292b31a9adf4cbe8`
- Post-Merge GitHub Actions: Run `33129716935` **SUCCESS** auf exakt `b912315d19544db96c37f503292b31a9adf4cbe8`
- Post-Merge Vercel Production: `dpl_Fj5bvtKMm66mNTMynciDs9pGhp3S` **READY** auf exakt demselben Merge-SHA

Live-Evidence gewinnt immer. Vor jeder neuen Arbeit `main`, offene PRs/Issues, CI, Vercel und relevante Supabase-Grenzen erneut prüfen.

## 2. Was PR #117 integriert hat

Nur Dokumentation / Architektur / Continuity:

- kanonischer `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` für AP-5–AP-12;
- ADR-0179 zur Rekonstruktion des kanonischen Account-Plans;
- P2-TA-06 / ADR-0178 Post-Merge-Klarstellung;
- P2-TA-03 Task, Status, Handoff, Self-Review und Agent-Rotation;
- Continuity-Zeiger in Start/Handoff/Roadmap/Active Work/Build Order/Architecture;
- Historical-Evidence-Nachträge unter Erhalt der ursprünglichen historischen `Status:`-Zeilen;
- korrigierte Supabase-Branch-Wahrheit;
- AP-5 Auth-Vertragskorrektur: bestehendes `secure_password_change`-Reauthentication-Verhalten bleibt maßgeblich; kein erfundener Current-Password-Submit-Vertrag.

## 3. Was ausdrücklich NICHT passiert ist

Kein:

- AP-5 Runtime;
- AP-6a Runtime;
- AP-7 Account-Traveller Registry;
- Auth-/MFA-/AAL-Grundlogik-Change;
- Identity-Architektur-Change;
- RLS-/Ownership-Change;
- DB-/Production-Migration;
- Config-Change;
- sensible Traveller-Dokumentpersistenz;
- Passnummern/Scans/MRZ/Biometrie;
- Provider S5-B / echter Provider / Secret / paid call;
- TW-8 / TW-9;
- Issue #109/#110 Runtime;
- Homepage-Multidestination-Runtime;
- Public Indexing / Domain Cutover;
- Native-App-Implementierung;
- Supabase Branch Reset/Rebase/Merge/Delete.

## 4. Supabase-Korrektur bleibt verbindlich

Live bestätigt am 28. August 2026 für Production-Projekt `qscbgcdmivbbnzrcyegn`:

- default `main`: project ref `qscbgcdmivbbnzrcyegn`, `ACTIVE_HEALTHY`
- non-default `develop`: project ref `yfvbxvijcorffwxbxahl`, `ACTIVE_HEALTHY`

Die frühere Aussage, es existiere kein Supabase Development-/Preview-Branch, ist superseded.

## 5. Account-/Traveller-Wahrheit nach PR #117

AP-1 bis AP-4 sind integriert. P2-TA-06 ist integriert. Nicht erneut planen.

Traveller-Invariante bleibt:

> Ein Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Keine Default-Citizenship. Issuer ≠ Citizenship. `documents[0]` / `evaluations[0]` sind keine Product Truth.

Current Traveller Truth bleibt **trip-scoped**. AP-7 bleibt hinter Shared-Contract + Product-Owner + ADR-Gates und wurde durch PR #117 nicht gestartet.

## 6. Kanonischer Account-Folgeplan

Ab jetzt ist `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` der kanonische Plan für AP-5–AP-12.

Die gleichnamige Datei auf historischem Draft-PR #39 / Branch `audit/account-platform` bleibt Historical Evidence und darf nicht als Current Truth verwendet oder blind gemergt werden.

Der Plan selbst gibt **keinen** Runtime-Slice automatisch frei.

## 7. Agent-Rotation

Generation 5:

`Cursor-Agent: Account plattform audit vorbereitung 5`

ist mit P2-TA-03 abgeschlossen.

Ein späterer neuer Account-Slice braucht nach Rotation Standard eine frische Session. Agentenname erst nach Live-Rekonstruktion und konkreter Slice-Entscheidung festlegen; Generation 5 nicht für neue logische Arbeit fortsetzen.

## 8. Nächster Technical-Lead-Schritt

**Kein automatischer Produkt-Folgeslice aus PR #117.**

Vor dem nächsten Auftrag:

1. Live-`main` und offene PRs/Issues erneut prüfen.
2. Binding Build Order und den neuen kanonischen Account-Plan lesen.
3. Offene P0/P1/P2-, Security-, Privacy-, Traveller-, Provider-, Admin- und Growth-Gates neu bewerten.
4. Erst danach entscheiden, welcher Slice als nächstes zulässig und sinnvoll ist.

Insbesondere nicht automatisch starten: AP-5, AP-6a, AP-7, Provider S5-B, TW-8/TW-9, #109/#110, Homepage-Multidestination, Public Indexing/Domain Cutover oder Native Implementation.

## 9. Bekannte Residuals

Weiter offen, nicht durch PR #117 geschlossen:

- D0-P1-03: `/privacy` und `/terms` 404;
- AP-7 Shared-Contract-Blocker für accountweite Traveller;
- P2-TA-01 / P2-TA-02 / P2-TA-04 / P2-TA-05 / P3-TA-01;
- `officialFingerprint` Legacy-Singularverhalten außerhalb P2-TA-06;
- AP-4 Real-Device-Evidence-Debt;
- Provider S5-B;
- TW-8 / TW-9;
- `main` Branch Protection weiterhin `protected=false`;
- historische/stale Draft-PRs und Branch-Hygiene bleiben separate Sanitation-Arbeit.

Dieses Dokument ist Post-Merge-Evidence für PR #117. Es ersetzt nicht die Pflicht, Live-Evidence vor neuer Arbeit erneut zu prüfen.