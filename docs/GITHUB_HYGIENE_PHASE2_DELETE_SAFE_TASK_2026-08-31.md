# Jetnity – GitHub Hygiene Phase 2 Delete-Safe Task

Stand: 31. August 2026
Status: **BINDING DESTRUCTIVE BUT BOUNDED OPS TASK / EXACT MANIFEST ONLY**

Parent Issue: #266
Current fresh baseline: `main@a57a15a6c8011ea81af1a228a2fd0c3e6e0853b9`
Branch: `ops/github-hygiene-phase2-delete-safe-2026-08-31`
Canonical Phase-1 restore map on main: `docs/evidence/GITHUB_HYGIENE_PHASE1_SYNC_MANIFEST_2026-08-31.json`

## 1. Ziel

Phase 2 entfernt ausschließlich bereits vollständig in `main` enthaltene, ungeschützte Remote-Branch-Refs aus der exakten Phase-1-`DELETE-SAFE_MERGED`-Liste.

Die Commit-Historie wird dadurch nicht gelöscht: jeder Restore-SHA ist dokumentiert und liegt nach der Revalidation vollständig in `main`.

## 2. Exakt erlaubte Kandidaten

**Nur** diese 15 Name→SHA-Paare dürfen in diesem Slice überhaupt für einen Delete geprüft werden:

1. `audit/core-repository-hygiene-2026-08-30` → `a759764eefa568784bfa08029b386b978e1d2138`
2. `audit/github-branch-hygiene-2026-08-30` → `a4dbc81284550d7b2aa1e0beb5e038deaf6a8d88`
3. `audit/requirements-provider-groundwork-g0-2026-08-30` → `74e214606c9f881ce0cd19aef3ed7865eb304d3b`
4. `audit/tw8-tw9-readiness-2026-08-31` → `93fb21efab6c22c3fd2b14a3a23d18f46110fd03`
5. `cleanup/final-mechanical-repository-leftovers-2026-08-30` → `204511f552d58e246cd08fd8b724eb98edd4dc49`
6. `docs/chatgpt-technical-lead-transition-2026-08-30-final` → `471bc93d19c2fa243182f6560e415b952b17364a`
7. `docs/post-cleanup-technical-lead-checkpoint-2026-08-30` → `5a3cf6aad1a5c89c98a96ec2904f2e265f22da2a`
8. `docs/requirements-gate0-closed-2026-08-31` → `4a86ea753bf3f7c5cfd667661f6a01557280b8ba`
9. `docs/requirements-s4-r1-closed-entry-target-2026-08-31` → `2aac34ddea0c88327986fc459826892d8895f3d0`
10. `feat/entry-requirements-detail-contract-e1-2026-08-31` → `56e018d36a176c0061a57978b8a6b5044369409d`
11. `feat/requirements-truth-ops-s4-r1-2026-08-31` → `595b4ad2a827beff7bec597433b3316d21da0747`
12. `feat/requirements-truth-ops-s4-r1-ready-2026-08-31` → `595b4ad2a827beff7bec597433b3316d21da0747`
13. `ops/creator-media-c2-recovery-2026-08-30` → `cf2bbd5b71392f17c8f31e2a13e450ae9de72e15`
14. `ops/creator-media-c3-decommission-2026-08-30` → `e8069799774433c905663b00867085bab4dbd461`
15. `recovery/core-repository-hygiene-2026-08-30` → `a759764eefa568784bfa08029b386b978e1d2138`

**Keine Erweiterung der Liste in Phase 2.** Auch wenn weitere Branches inzwischen delete-safe erscheinen, bleiben sie für einen späteren Audit-Slice liegen.

## 3. Verbindliche Revalidation unmittelbar vor JEDEM Delete

Für jeden Kandidaten einzeln und direkt vor dem Delete:

1. aktuellen `origin/main` holen und exakten SHA dokumentieren;
2. Branch existiert noch;
3. Remote-Tip des Branches ist **exakt** der oben dokumentierte Restore-SHA;
4. Branchname ist nicht `main`;
5. Branch ist kein Head eines aktuell offenen PR;
6. GitHub meldet Branch nicht protected und kein aktives Ruleset schützt ihn;
7. `git merge-base --is-ancestor <restore-sha> origin/main` ist erfolgreich;
8. `git rev-list --count origin/main..<restore-sha>` ergibt exakt `0`;
9. Restore-SHA ist nicht identisch mit aktuellem `main`-Tip;
10. keine Unsicherheit oder API-/Netzwerk-Inkonsistenz.

Wenn **irgendeine** Bedingung nicht erfüllt oder nicht beweisbar ist:

- **NICHT löschen**;
- als `SKIPPED_DRIFT` dokumentieren;
- mit nächstem ursprünglich erlaubten Kandidaten nur fortfahren, wenn die Ursache kandidatenspezifisch ist;
- bei systemischer Evidence-/GitHub-/Auth-Störung STOP für gesamten Slice.

## 4. Delete

Nur nach vollständigem Kandidaten-PASS darf der Remote-Ref gelöscht werden, z. B. über den normalen authentisierten Git-Remote-Weg.

Unmittelbar danach prüfen:

- Branch-Ref remote nicht mehr vorhanden;
- `main` unverändert bzw. nur durch unabhängig autorisierte andere Workstreams bewegt, niemals durch diesen Delete;
- Restore-SHA weiterhin aus `main` erreichbar;
- keine Tags verändert;
- keine offenen PRs geschlossen.

## 5. Evidence

Der Agent muss ein maschinenlesbares und menschenlesbares Phase-2-Protokoll committen, mindestens:

- Start-`main` und End-`main`;
- pro Kandidat: Name, erwarteter SHA, beobachteter SHA vor Delete, open-PR status, protected/ruleset, ancestry, rev-list count, Ergebnis `DELETED` oder `SKIPPED_DRIFT`, Verifikationsresultat nach Delete;
- Liste verbleibender Open-PR-Heads;
- explizite Bestätigung: `main` nicht verändert, keine Tags gelöscht, keine Nicht-Manifest-Branches gelöscht;
- Restore-Anleitung mit dokumentiertem SHA.

Empfohlene Dateien:

- `docs/GITHUB_HYGIENE_PHASE2_STATUS_2026-08-31.md`
- `docs/GITHUB_HYGIENE_PHASE2_HANDOFF_2026-08-31.md`
- `docs/GITHUB_HYGIENE_PHASE2_SELF_REVIEW_2026-08-31.md`
- `docs/evidence/GITHUB_HYGIENE_PHASE2_DELETE_LOG_2026-08-31.json`

## 6. Hard Non-Scope

- `main` niemals löschen oder bewegen;
- keine Tags löschen;
- keine Branch Protection/Rulesets ändern;
- keine offenen PR-Heads löschen;
- keine 57 `REVIEW_UNMERGED`-Branches löschen;
- keine historischen Draft-PRs #28/#39/#40/#50/#52 schließen;
- den Phase-1-Audit-Branch `audit/github-hygiene-phase1-2026-08-31` **nicht** löschen – er war nicht in der exakten 15er-Liste;
- diesen Phase-2-Branch nicht löschen;
- keine Runtime-/App-/Supabase-/Vercel-/Provider-/Auth-Dateien ändern;
- keine weiteren Cleanup-Slices automatisch starten.

## 7. Agent-Regeln

Agent-Anzeigename: **`Jetnity github hygiene delete safe 1`**
Generation: **1**

Der Agent:

- arbeitet nur auf diesem Branch plus den ausdrücklich erlaubten Remote-Delete-Operationen;
- PR bleibt Draft;
- `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` nicht ändern;
- keine Kandidatenliste erweitern;
- bei Drift fail-closed skippen;
- eigene Evidence/Handoff/Self-Review liefern;
- nicht Ready setzen;
- nicht mergen;
- Issue #266 nicht selbst schließen;
- STOP nach Delivery für unabhängigen TL-Review.

Bei `CHANGES REQUIRED` bleibt dieselbe Session zuständig.

## 8. DoD

- alle 15 Kandidaten wurden entweder nach vollständiger Revalidation sicher gelöscht oder nachvollziehbar `SKIPPED_DRIFT`;
- keine andere Branch/Tag/PR/Protection-Mutation;
- Evidence committed;
- Draft-PR Exact-Head TL review;
- CI/Vercel/Threads sauber für Evidence-PR;
- geschützter Merge der Evidence-Doku;
- Post-Merge Main-CI/Production verifiziert;
- Issue #266 nur schließen, wenn Phase 1 + Phase 2 vollständig abgeschlossen und Evidence auf main ist.
