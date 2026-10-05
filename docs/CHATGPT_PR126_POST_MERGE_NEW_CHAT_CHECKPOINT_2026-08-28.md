# Jetnity – PR #126 Post-Merge New-Chat Checkpoint

Stand: 28. August 2026

Status: **PR #126 / P2-TA-04 C1 ist integriert. Issue #122 ist CLOSED / completed. Production C1 ist live. Kein C2, kein AP-5 und kein automatischer Folgeslice. Live-Evidence gewinnt immer.**

> Dieser Checkpoint superseded für den C1-Integrationsstand die Pre-Merge-/Draft-Aussagen in den C1-Author-Status-/Handoff-Dateien. Diese älteren Dateien bleiben historische Evidence ihres damaligen Zeitpunkts und werden nicht gelöscht.

## 1. Exakter integrierter Stand

- Repository: `Jetnity/jetnity`
- PR: **#126 – P2-TA-04 C1: Traveller write-contract integrity hardening**
- Reviewed final head: `3cd1152253966cf71168faf1e1fa0a84bad1cc12`
- Merge-base vor Merge: `4549846bbbc106cb0a921203e343af6e681ec055`
- Ahead / Behind vor Merge: **5 ahead / 0 behind**
- Merge-Commit auf `main`: `5ed7edbd6334d5e0c36f16baeed590edbdb92bb2`
- Finaler Technical-Lead-PASS: PR-Level Review `5047381350` auf exakt `3cd1152253966cf71168faf1e1fa0a84bad1cc12`
- GitHub konnte keinen formalen `APPROVE`-State speichern, weil verbundener Owner und PR-Autor derselbe Account sind; der Review-Kommentar ist die kanonische unabhängige Technical-Lead-Freigabe-Evidence.

## 2. C1 – integrierter Vertrag

C1 schließt genau die drei freigegebenen Write-Contract-Integritätslücken:

1. Kanonischer `public.party_loeschen(jsonb)`-RPC als **SECURITY INVOKER**; `travellerEntfernen` nutzt keinen direkten `trip_travellers`-Tabellen-DELETE mehr.
2. Datenbank erzwingt max. **20 Traveller je `(user_id, trip_id)`**, auch bei direktem DML, inkrementellem `party_schreiben`, Reparenting und parallelen Writes. Serialisierung über `FOR NO KEY UPDATE` auf der Zielreise.
3. Child-Limits **8 Citizenships / 12 Documents** gelten bei INSERT und UPDATE/Reparenting.

Unverändert / ausdrücklich Non-Scope:

- kein C2
- kein authenticated table-DML `REVOKE`
- keine RLS-/Ownership-Änderung
- kein `SECURITY DEFINER`
- kein Auth/MFA/AAL-Umbau
- kein AP-5/AP-6a/AP-7
- keine Passportnummern/Scans/MRZ/Biometrie
- keine Provider-/TW-8-/Search-/Homepage-/Native-Arbeit

## 3. Migration Truth

Kanonische Production-/Repo-Version:

`20260828015304_traveller_write_contract_integrity`

Production Supabase `qscbgcdmivbbnzrcyegn`:

- C1 wurde unter der bestehenden ausdrücklichen Product-Owner-C1-Freigabe **vor dem Runtime-Merge** vom Technical Lead angewendet.
- Live verifiziert: `party_loeschen.prosecdef=false`, `authenticated` EXECUTE ja, `anon` EXECUTE nein; Party- und Child-Limit-Trigger aktiv.
- Vor Apply: keine bestehende Production-Reise/Traveller-Zeile überschritt die neuen Limits.
- **Nicht erneut anwenden.**

Supabase `develop` (`yfvbxvijcorffwxbxahl`) trägt historische/develop-only Author-Evidence derselben C1-SQL unter:

`20260828120000_traveller_write_contract_integrity`

Diese Develop-Historie wurde im Review-Fix nicht rebaset/reset/re-applied. Zusätzlich besteht dort die bekannte historische Admin-AAL2-Versionsdrift `20260826052735` vs. kanonischem Repo-/Production-Vertrag. Spätere Develop-History-Sanitation ist ein eigener Technical-Lead-Entscheid und **kein automatischer Auftrag**.

## 4. Test- und Exact-Head-Evidence

Author-/Development-Evidence:

- Focused unit: **15/15 pass**
- `npm test`: **2387/2387 pass**
- Typecheck / Lint / Build / Hygiene: pass
- `db:parallelitaet`: **11/11 pass**
- C1-Fälle in `db:sicherheit`: **13/13 pass**
- Gesamt-`db:sicherheit`: **217/248** wegen vorbestehender Admin-AAL2-JWT-Fixture-Lücken; kein C1-Fall betroffen. Das bleibt Test-Fixture-Debt, kein C1-Regressionssignal.

Finaler PR-Head `3cd1152253966cf71168faf1e1fa0a84bad1cc12`:

- GitHub Actions Run `33134988119`: **SUCCESS**
- Vercel Preview `dpl_86hQxnK32XgbCizndTR1gbnkZ5a6`: **READY**
- Review-Threads: **0**
- Migration-Rename im Review-Fix: GitHub meldete reinen Rename auf `20260828015304`, **0 SQL changes** gegenüber dem bereits reviewed Body.

## 5. Post-Merge Live-Evidence

`main` nach Merge:

`5ed7edbd6334d5e0c36f16baeed590edbdb92bb2`

Post-Merge Gates auf exakt diesem SHA:

- GitHub Actions CI Run `33135580427`: **SUCCESS**
- Vercel Production Deployment `dpl_55wX8vwAr1di7ugR5iVmEP8wLTuM`: **READY** / target `production`
- Issue #122: **CLOSED / completed**

Damit ist P2-TA-04 **C1 integriert und operativ abgeschlossen**.

## 6. Verbindliche Residuals / Nicht automatisch starten

Weiterhin offen bzw. gegated:

- **C2** (`SECURITY DEFINER` + authenticated Tabellen-DML-REVOKE) ist **nicht gestartet** und braucht ein neues ausdrückliches Product-Owner-Gate.
- **AP-5** ist nicht automatisch gestartet.
- **AP-7 Traveller Registry** ist nicht automatisch gestartet.
- Provider S5-B, TW-8, TW-9, Issue #109, Issue #110, Public Indexing, Domain Cutover und Native Implementation bleiben nicht automatisch gestartet.
- `main` Branch Protection bleibt live `protected=false` und ist ein Governance-Risiko; nicht still ändern.
- Develop-History-Drift bleibt ein gesondertes Sanitation-Thema.

## 7. Nächster Chat / Technical Lead

1. Zuerst live `main`, offene PRs/Issues, CI, Vercel, Supabase und Branch Protection rekonstruieren.
2. Diesen Checkpoint als aktuellste Post-PR-#126-Continuity-Evidence lesen.
3. PR #126 / Issue #122 **nicht wieder öffnen oder C1 neu bauen**.
4. Production-Migration `20260828015304` **nicht erneut anwenden**.
5. Keinen automatischen Folgeslice starten. Erst Binding Build Order, Dependencies, Risiken und Product-Owner-Gates erneut bewerten.
6. C2 und AP-5 bleiben ausdrücklich getrennte, nicht automatisch freigegebene Arbeit.

Cursor-Agent `Account plattform audit vorbereitung 7` ist mit C1 abgeschlossen und für einen neuen logischen Account-Slice nicht wiederzuverwenden. Falls später ein neuer Account-Slice nach Live-Rekonstruktion zulässig gestartet wird, Rotation Standard erneut prüfen und eine frische Generation verwenden.
