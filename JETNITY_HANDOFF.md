# Jetnity – Handoff und nächste Schritte

Stand: 27. August 2026  
Status: **PR #89 ist integriert. Production Gate A ist vollständig PASS. TW6-B Gate B bleibt nicht freigegeben. PR #87 bleibt Draft und muss gegen den aktuellen `main` neu rekonstruiert und re-gegatet werden.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`.  
Aktuelle operative Evidence zusätzlich: `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md` und `docs/ACTIVE_WORK_STATUS.md`.

> **Do not blindly trust this handoff — live verify first.**

Historische Handoffs, ältere PR-Bodies und Checkpoints bleiben Evidence ihres Zeitpunkts. Sie dürfen Live-Evidence und spätere Product-Owner-Entscheidungen nicht überschreiben.

## 1. Pflicht vor jeder neuen Arbeit

Lies zuerst mindestens:

- `JETNITY_START_HERE.md`
- `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`
- relevanten Slice-Task/Status/ADR/Checkpoint.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Ahead/Behind/Merge-Base, tatsächliche Diffs, Actions, Vercel, relevante Supabase-Migrationen/Schema-Zustände, Review-Threads und Blocker.

## 2. Merge- und Product-Owner-Governance

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

Technical Lead darf normale scope-treue PRs nach vollständigem unabhängigen PASS Ready setzen und mergen.

Vor Ready/Merge zwingend:

- echten Diff prüfen;
- Tests und Testannahmen fachlich prüfen;
- Security/Privacy/Truth/Shared Contracts prüfen;
- Exact-Head GitHub Actions und Vercel prüfen;
- relevante Supabase-/Production-Grenzen prüfen;
- Parallelität/Collision prüfen;
- bei Fehlern zuerst korrigieren und danach neu gaten.

Besondere Product-Owner-Gates bleiben zwingend für Production-Migrationen/destruktive Daten, große Auth/MFA/AAL/RLS/Identity-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, Payments, Kosten > USD 100/Monat, fundamentale Produkt-/Build-Order-Änderungen und Public-/Provider-/Store-Live-Aktivierungen.

## 3. Aktuelle Git-/CI-Linie

Verifizierter `main` vor diesem Continuity-PR:

`3d0ffa2d97df66a4d6006587047bf27b0df9606c`

Wesentliche Integration:

- PR #89 – TW6-B Gate 0 migrations-only + bounded transactional apply playbook
- Merge-Commit `5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`
- PR-#89 Exact Head `986fa8b7592286731e44ab46d36a8f299531d669`
- Exact-Head GitHub Actions Run `33023062522`: SUCCESS
- Exact-Head Vercel: SUCCESS/READY
- Post-Merge `main` CI Run `33023988403`: SUCCESS

Danach wurde ein docs-only Production-Gate-A-Checkpoint auf `main` geschrieben. Keine Runtime-Datei wurde dabei geändert.

`main` Branch Protection ist weiterhin live deaktiviert (`protected=false`) und bleibt Governance-Risiko.

## 4. Production Gate A – PASS

Product Owner hat am 27. August 2026 ausschließlich diese Production-Reihenfolge freigegeben:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard`

Beide Schritte wurden ausgeführt und unabhängig semantisch verifiziert.

Production-History enthält jetzt kanonisch:

- `20260824160000` → `reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000` → `trip_items_flug_handelsfelder_guard`

Finale Verifikation:

- `reise_anlegen(jsonb)` strippt bei `flight` untrusted `price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url`;
- Route-Itinerary-Helper bleibt erhalten;
- RPC bleibt `SECURITY INVOKER`;
- `authenticated` EXECUTE=true, `anon`=false;
- Trigger `trip_items_flug_handelsfelder_schuetzen` genau einmal vorhanden und enabled;
- Trigger-Scope korrekt;
- direkte Guard-Funktion für authenticated/anon nicht executable;
- Production Flight-Items weiterhin 0;
- Production-Projekt danach `ACTIVE_HEALTHY`.

Die Supabase-Ausführung erzeugte technisch zunächst laufzeitgenerierte Versionsnummern. Diese wurden unmittelbar nach erfolgreicher semantischer Prüfung mit fail-closed Guards auf die kanonischen Repo-Versionen `20260824160000` und `20260824180000` normalisiert. Genau eine Source-Zeile war jeweils vorhanden; das Ziel war jeweils leer. Kein Schema-Rollback und keine zusätzliche Produktmigration wurden durchgeführt.

Vollständige Evidence: `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`.

## 5. Explizit NICHT auf Production

Nicht freigegeben und nicht angewendet:

- TW6-B `20260826220000`
- TW6-B `20260826230000`
- TW6-B `20260826240000`
- AAL2 Repo-Version `20260826090000`
- Development-AAL2-Version `20260826052735`
- Direction A
- andere Production-Migrationen

Auf Production existiert weiterhin weder `day_stage_assignment_source` noch `day_stage_assignment_mode`. TW6-B wurde also nicht still aktiviert.

## 6. TW6-B / PR #87

Gate 0 ist durch PR #89 erledigt: Die drei geprüften TW6-B-Dateien und das transaktionale Playbook liegen auf `main`.

**Gate 0 ≠ Gate B.**

PR #87 (`feat/tw6-rest-progressive-stages`) bleibt Draft. Der frühere PLAN-PASS / PRODUCTION EXECUTION BLOCKED bezog sich auf einen älteren `main`. Deshalb gilt vor jeder Fortsetzung zwingend:

1. aktuellen `main` live lesen;
2. PR-#87-Head live lesen;
3. Merge-Base/Ahead/Behind neu bestimmen;
4. echten aktuellen Diff prüfen;
5. Konflikte/Drift mit PR #89 und weiteren Main-Änderungen auflösen;
6. Shared Contracts erneut prüfen;
7. Exact-Head GitHub Actions + Vercel neu verlangen;
8. Production-Zustand erneut verifizieren.

Kein alter PASS darf als aktuelle Merge- oder Production-Freigabe verwendet werden.

## 7. Trip Workspace

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW6-A Create-Entry ✅
- TW6-B Gate 0 / Provenance ✅

Offen:

- TW6-B Runtime / progressive Ziele / Day→Stage Mode Contract via PR #87
- Production Gate B separat

TW-7 bleibt hinter Account-/Hub-Grenzen. TW-8 bleibt hinter Provider S5 und realer Commercial Provenance.

## 8. Traveller / Account

Verbindliche Traveller-Wahrheit:

> Ein Traveller → mehrere Staatsbürgerschaften → mehrere Dokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Issuer Country ≠ Citizenship.

Weiter offen u. a.:

- P2-TA-06 `documents[0]` Residual;
- Account-Traveller-Registry / AP-Folgeslices;
- historische Account-Plan-Evidence aus PR #39.

Production Gate A hat nur Commercial-Truth-Schreibwege für Flight gehärtet und Traveller-Semantik nicht verändert.

## 9. Provider / Commercial Provenance

S1–S3 und S5-A sind integriert. S5-B nicht gestartet.

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Provider-Live-Aktivierung durch Gate A.

TW-8 bleibt gegated.

## 10. Admin AAL2

Application-Guard ist im Code integriert.

Production-AAL2-Datenebene bleibt **nicht angewendet**. Gate A hat AAL2 nicht verändert.

## 11. D0 / Growth

D0-1, D0-2 und P1-D0-LIVE-01 sind integriert.

- Canonical `https://jetnity.com`
- `*.vercel.app` niemals kanonisch
- robots fail-closed
- Default noindex/nofollow
- kein Domain-Cutover
- kein Public Indexing

Offen bleiben u. a. D0-P1-03 Legal-404 und spätere D0/G0-Reste. Kein D1/G1 automatisch starten.

## 12. Quality / Security Advisors

Nach Production Gate A wurden Supabase Security- und Performance-Advisors gelesen.

Separate vorhandene Funde betreffen u. a. GraphQL-Exposition, ältere Admin-`SECURITY DEFINER`-Funktionen, fehlende FK-Indizes und ungenutzte Indizes. Kein Advisor-Fund zeigt auf die beiden Gate-A-Funktionen als neue Gate-A-spezifische Fehlkonfiguration.

Diese Funde sind eigene QS-/Security-Arbeit und wurden im Gate-A-Lauf nicht still verändert.

## 13. Offene PRs / historische Evidence

Operativ relevant:

- PR #87 – TW6-B Runtime-Draft; neu re-reviewen
- PR #88 – Project Sanitation Audit; non-destructive Evidence, kein Cleanup automatisch

Historische offene Drafts wie #52, #50, #40, #39, #28 bleiben Evidence und werden nicht blind wieder aufgenommen oder gelöscht.

## 14. Exakter nächster Technical-Lead-Schritt

**PR #87 gegen den aktuellen `main` vollständig neu rekonstruieren und unabhängig re-reviewen.**

Wenn nötig: scope-sichere Synchronisierung/Korrektur durch `Cursor-Agent: Trip workspace audit architecture`, danach neuer Exact Head, neue CI/Vercel-Evidence und erneuter unabhängiger PASS.

Erst wenn dieser Stand wieder PASS ist, darf der Product Owner separat um Freigabe für Production Gate B gebeten werden.

Bis dahin:

**Kein Gate B. Kein AAL2. Kein Direction A. Kein PR-#87-Merge. Kein TW-7/8/9-Folgeslice.**

## 15. Continuity

Kein wesentlicher Fortschritt darf nur im Chat existieren. Neue Chats und Agenten lesen zuerst die kanonischen Dateien und rekonstruieren danach Live-Evidence. Screenshots, ältere SHAs und alte PR-Bodies sind nur historische Evidence.
