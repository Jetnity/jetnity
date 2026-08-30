# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / REQUIREMENTS TRUTH-OPS S4-R1 ACTIVE / DRAFT PR #293 / LIVE-EVIDENCE GEWINNT**

Aktuellster abgeschlossener Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_REQUIREMENTS_GATE0_CLOSED_2026-08-31.md`

Verbindlicher aktiver Task:

`docs/REQUIREMENTS_TRUTH_OPS_S4_R1_TASK_2026-08-31.md`

## 1. Live-Baseline vor S4-R1

Verifiziertes `main`:

`67f54135957cf09e39585a8cff662ecc3645b39a`

- PR #291 **MERGED**; finaler Gate-0-Continuity-Merge.
- Main-CI #1415 / Run `33339984118`: **SUCCESS** exakt auf `67f54135...`.
- Vercel Production `dpl_8M5fqNsNBzdsFZXkVhXMzSDoxWRN`: **READY** exakt auf `67f54135...`.
- Issue #288: CLOSED/completed.
- Gate 0 vollständig abgeschlossen.
- Ruleset `Jetnity main protection` / ID `21875372`: active; PR + strict required checks + Conversation Resolution + merge-only; bypass leer.
- Offene PRs außerhalb dieses Slices sind nur bekannte historische Drafts (#52, #50, #40, #39, #28); kein konkurrierender aktueller Runtime-Slice.

## 2. Aktiver Slice

Issue **#292 – Requirements Truth-Ops S4-R1 – timeout, kill-switch & bounded freshness**.

Draft-PR **#293 – Requirements Truth-Ops S4-R1: timeout, kill-switch & bounded freshness**.

Branch:

`feat/requirements-truth-ops-s4-r1-2026-08-31`

Start-Baseline:

`67f54135957cf09e39585a8cff662ecc3645b39a`

Initialer TL-Task-Commit:

`5e7de7e8a1c983b7dc103aa259b25892494955f5`

Scope:

- `RequirementsProvider.evaluate` mit AbortSignal;
- bounded Domain-Timeout (Standard 4.000 ms);
- Readiness-Kill-Switch `JETNITY_READINESS_AKTIV` auf bestehendem Provider-Ops-Muster;
- technische Timeout/Abort/temporary/unavailable-Semantik;
- `checkedAt` bounded Freshness mit globalem Jetnity-Ceiling von 60 Minuten;
- gezielte Tests + Handoff/Self-Review.

## 3. Cursor-Agent

Vorgesehener exakter Anzeigename:

**`Jetnity requirements truth ops 1`**  
Generation: **1**

Session: **PENDING DISPATCH / nach Cursor-Annahme live verifizieren**.

Der Agent darf ausschließlich S4-R1 implementieren, Self-Review liefern und stoppen. Er darf nicht Ready setzen, mergen oder einen Folgeslice starten. `docs/ACTIVE_WORK_STATUS.md` bleibt Technical-Lead-owned.

## 4. Revalidierte Current Truth

Auf Start-`main` live bestätigt:

- `RequirementsProvider.evaluate(anfrage)` hat noch kein `AbortSignal`.
- `requirementsAuswerten(...)` ruft `provider.evaluate(kanonisch)` ohne Domain-Timeout auf.
- `requirementsProviderAus()` ist und bleibt `null`.
- `officialFrische()` hat noch keine maximale `checkedAt`-TTL.
- öffentliche Requirements-Route hat `maxDuration = 10` und propagiert `req.signal` noch nicht.
- Provider Ops hat bereits die wiederverwendbare fail-closed `providerOpsZustand`-Form.
- Provider Transport Core akzeptiert bereits AbortSignal; kein zweiter HTTP-Stack erforderlich.

Kanonisches Traveller-Modell bleibt verbindlich:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein Default-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 5. Hard Gates / Non-Scope

S4-R1 öffnet **kein** besonderes Product-Owner-Gate:

- kein echter Requirements-Provider / keine Providerwahl;
- kein Vendor-Kontakt, Vertrag oder DPA;
- keine Secrets/API Keys;
- keine echten oder paid calls;
- `requirementsProviderAus()` bleibt `null`;
- keine Supabase-Migration/RLS/Ownership/Storage;
- keine Auth/MFA/AAL-Änderung;
- kein Workspace-Live-Provider-Wiring;
- keine Commercial Runtime Writer;
- keine sensitiven Passport-/MRZ-/Biometrie-/Scan-Daten;
- keine neuen recurring costs;
- kein Public Launch/Domain/Store-Cutover.

Supabase wird in diesem Slice nicht verändert; deshalb ist kein DB-Live-Mutationsschritt Teil des Tasks. Die bekannte Development-vs-Production-Migration-History bleibt vor jedem migrationsnahen Slice neu zu prüfen.

## 6. Review-State

Aktuell: **IMPLEMENTATION NOT YET REVIEWED / PR #293 DRAFT**.

Agent-Self-Review ist kein Technical-Lead-PASS. Jede Head-Änderung invalidiert frühere CI/Vercel/Review-Evidence. Bei `CHANGES REQUIRED` arbeitet derselbe Agent in derselben Session weiter.

## 7. FIRST NEXT ACTION

1. Cursor-Agent `Jetnity requirements truth ops 1` auf PR #293 starten.
2. Exact Session/Acceptance live verifizieren.
3. Agent implementiert ausschließlich den verbindlichen S4-R1-Task.
4. Danach unabhängiger Technical-Lead-Review des exakten Heads, Diff, Tests, CI, Vercel Preview und Threads.
5. Nur bei PASS darf der Technical Lead Ready setzen und normal mergen.
6. Post-Merge `main`, Main-CI und Vercel Production exakt verifizieren; Issue #292 schließen und Continuity aktualisieren.
7. **Kein automatischer Folgeslice.**

**Live-Evidence gewinnt immer.**
