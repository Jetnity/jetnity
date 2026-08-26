# Jetnity – Active Work Status

Stand: 26. August 2026  
Status: **Parallel-Audit-Batch integriert. P1-QS2-02 ist geschlossen und auf `main`. Aktive neue Drafts: TW-6 Runtime (#82), Provider S5-A (#83) und Admin-AAL2 (#80, besonderer Auth-Gate-Slice). Nächster Account-/Traveller-Closure-Slice ist P1-TA-02.**

## 0. Live-Integrationsbaseline

Aktueller verifizierter `main` nach PR #81:

`86567f17d97d5c4895658563f4aa2b98f297989d`

Production für diesen Merge:

`dpl_BGJCQwKf9qoiwGrZfBWLnhyz3DQ1` → **READY**.

Zuletzt integriert:

- PR #74 – D0-2 Canonical / Origin / robots-sitemap Consistency → `c73e87773dd6d234f1b76fc82206f03aac35fd2c`;
- PR #76 – Traveller / Account Next-Phase Dependency Audit → `70196da8ff2e2af3ffb32322dea5555d641c9455`;
- PR #77 – Provider S4–S8 Dependency / Provenance Gap Audit → `75dfb4308e9aeba2d14353831f016eee84c4fac6`;
- PR #75 – TW-6 Dependency / Guest-One-Trip Contract Audit → `5ef981ecd7f761294bcbb691d6cf966395f7ce97`;
- PR #81 – P1-QS2-02 Guest→Account Stay/Activity Commercial Truth Boundary → `86567f17d97d5c4895658563f4aa2b98f297989d`.

Bereits zuvor integriert:

- PR #78 – Admin D–K / Marketing-Growth Control Gap Audit;
- PR #79 – QS-2 Independent Quality / Security / Resilience Audit;
- D0-1, TW-1/TW-2/TW-4/TW-3/TW-5 und die dazugehörigen Continuity-/Governance-Slices.

`main` Branch Protection ist live weiterhin **nicht aktiviert** und bleibt ein Governance-Risiko.

## 1. Aktive Technical-Lead-Governance

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

Vor Ready/Merge zwingend:

- aktuelles `main`, Merge-Base, Ahead/Behind und tatsächlichen Diff prüfen;
- Auftrag, Acceptance Criteria und Non-Scope gegen Runtime-Code prüfen;
- Tests und deren Annahmen fachlich hinterfragen;
- Security / Privacy / Truth / Shared Contracts prüfen;
- Exact-Head GitHub Actions und Vercel prüfen;
- relevante Supabase-/Migrationsevidence prüfen;
- offene Review-Threads, P0/P1/P2/P3 und parallele Kollisionen prüfen;
- bei Fehlern zuerst korrigieren und danach vollständig neu gaten.

Besondere Product-Owner-Gates bleiben unverändert, insbesondere für Production-Migrationen/destruktive Daten, fundamentale Auth/MFA/AAL-/Identity-/RLS-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, reale Payments, > USD 100/Monat neue laufende Kosten und Public Launch/Provider-Live/Store-Aktivierung.

## 2. D0-2 – integriert

D0-2 ist abgeschlossen und auf `main`.

Verbindliche Domain-Wahrheit:

- `https://jetnity.com` = einzige zukünftige kanonische/indexierte Public-Hauptdomain;
- `jetnity.ch` = spätere Schweizer Entry-/Redirect-Domain, keine zweite indexierte Plattform;
- Public Indexing bleibt explizites Opt-in über exakt `NEXT_PUBLIC_ALLOW_INDEXING=true`;
- Default bleibt fail-closed / deny-all;
- kein Domain-Cutover, kein `.ch`-Redirect und kein Public-Launch wurden aktiviert.

Weiter offen:

- **D0-P1-03** – `/privacy` und `/terms` 404; kein Rechtstext darf erfunden werden;
- D0-P2-04 – hreflang / Locale;
- D0-P2-05 – JSON-LD / Entity Foundation;
- G0-Findings und spätere Search-/Authority-Slices.

`Jetnity growth discoverability` bleibt bis zum nächsten phasengerechten Auftrag STOPP.

## 3. Trip Workspace

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW-6 Dependency-/Guest-One-Trip-Audit ✅

Product Owner hat für TW-6 **Option 1** ausdrücklich genehmigt.

Aktiver Runtime-Draft:

- PR #82 – **TW-6 Runtime / Create-Entry Alignment Option 1**;
- Agent: `Trip workspace audit architecture`;
- gestartet von `main @ 71230c28`; nach PR #81 muss vor Integration gegen aktuelles `main` synchronisiert und neu gegatet werden.

TW-7 bleibt hinter Account-/Hub-Grenzen. TW-8 bleibt hinter Provider S5 / Commercial Provenance.

## 4. Traveller / Account

Current Traveller Truth bleibt:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Dokumente/Credential-Optionen → kontextabhängig bewertete zulässige Optionen.**

Kein Default-Pass. Issuer ist nicht Citizenship.

Geschlossen:

- **P1-QS2-02** – Guest→Account Stay/Activity Commercial-Truth-Leak. PR #81 unabhängig geprüft und integriert. Unbewiesene `price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url` werden für `stay`/`activity` fail-closed entfernt; nicht-kommerzielle Fakten bleiben.

Weiter offen:

- **P1-TA-02** – aktueller Presentation/API-Pfad kollabiert `officialAusEvaluations()` auf `evaluations[0]`; nächster eigener fokussierter Account-/Traveller-Closure-Slice.
- **P2-TA-06** – latenter `documents[0]`-Fallback in `travellerNormalisieren()`; späteres Contract-Hardening.
- **P2 Residual** – Mobility/Rental-Such-Snapshots können kommerzielle Felder tragen; benötigt eigenen S3/S5-Schnitt.
- **P2 Residual** – direkter `reise_anlegen`-RPC-Bypass bleibt als separater Datenebenen-/Shared-Contract-Punkt offen.
- Account-scoped Traveller Registry / AP-7 bleibt Shared-Contract-gegated.

Keine neue Registry oder Identity-Wahrheit still einführen.

## 5. Provider Readiness

S1–S3 sind integriert. S4–S8 sind noch nicht vollständig implementiert.

Aktiver Foundation-Draft:

- PR #83 – **S5-A Commercial Provenance Domain Contract**;
- Agent: `Jetnity provider readiness audit`;
- provider-neutral, keine echten Provider, keine Secrets/Verträge/paid calls, keine Aktivierung, keine Production-Migration und keine neue Kosten;
- gestartet von `main @ 71230c28`; vor Integration gegen aktuelles `main` synchronisieren und neu gaten.

Bestätigte Gates bleiben:

- **TW8-START-GATE:** Kein TW-8 ohne belastbaren S5 Commercial-Provenance-Vertrag.
- **PROVIDER-ACTIVATION-GATE:** Persistenter Cost Guard vor bezahlter/Production-Provideraktivierung.
- **P1-before-TW8 Commercial Truth:** persistierte kommerzielle Beträge brauchen belastbaren observed/retrieved timestamp und klare Freshness-/Currency-/Provenance-Wahrheit.

## 6. QS-2 / Admin AAL2

QS-2 hat zwei P1 bestätigt:

1. `P1-QS2-01` – zentrale Admin-AAL2-Durchsetzung → PR #80, unabhängiger TL-Review weiterhin erforderlich;
2. `P1-QS2-02` – Guest→Account Stay/Activity Commercial Truth → **geschlossen durch PR #81**.

Für `P1-QS2-01` gilt weiter:

- Branch `fix/qs2-admin-aal2-guard`;
- Anwendung + Development-Datenebenen-Hardening vorhanden;
- Development-Migration `20260826090000_admin_aal2_data_plane.sql`;
- **keine Production-Migration freigegeben oder angewendet**;
- besonderer Auth/MFA/AAL-Product-Owner-Gate wurde für diesen kontrollierten Closure-Slice erteilt;
- kein Merge vor unabhängigem Technical-Lead-Review.

`Admin platform audit` erhält bis Abschluss dieses Reviews keinen neuen Runtime-Auftrag.

`Jetnity quality security audit` bleibt während der laufenden Runtime-/Foundation-Slices STOPP und wird danach für QS-3 eingesetzt.

## 7. Admin / Growth

Admin D–K / Growth-Control-Audit ist als Evidence integriert. Keine D–K-Runtime wurde dadurch freigegeben.

Bekannte spätere Themen bleiben u. a.:

- Refund-Atomicity / Idempotency;
- dauerhafter Admin Audit Trail;
- IP-Blocklist-Enforcement;
- Growth-/Attribution-/Claims-/Consent-Control-Plane.

Build-Order bleibt verbindlich.

## 8. Aktive / nächste Cursor-Workstreams

Aktiv:

1. `Trip workspace audit architecture` → PR #82 / TW-6 Runtime Create-Entry Alignment.
2. `Jetnity provider readiness audit` → PR #83 / S5-A Commercial Provenance Domain Contract.

Nächster freier Account-Workstream:

3. `Account plattform audit vorbereitung` → **P1-TA-02 Option-Scope / Official-Evaluation Presentation Truth Closure**, auf neuem Branch von live aktuellem `main`.

STOPP:

- `Jetnity growth discoverability` – D0-2 abgeschlossen; Legal benötigt genehmigte Inhalte, kein Erfinden.
- `Admin platform audit` – kein neuer Slice bis #80-Review und phasengerechter Build-Order.
- `Jetnity quality security audit` – erst nach den laufenden Runtime-/Foundation-Slices wieder für QS-3.
- `Jetnity native app architecture` – weiterhin für spätere Native-Phase reserviert.

## 9. Harte Parallelitätsregeln

- Jeder neue Agent-Slice startet von live verifiziertem aktuellem `main` auf neuem Branch + eigenem Draft-PR + Task/Status.
- Bereits laufende #82/#83 müssen vor Integration wegen PR #81 gegen neues `main` synchronisiert und auf neuem Exact Head erneut gegatet werden.
- Agenten ändern **nicht** `docs/ACTIVE_WORK_STATUS.md`.
- Keine stillen Shared-Contract-Erweiterungen.
- Kein Agent startet selbst einen Folgeslice.
- Jeder Agent endet mit `STOPP` und liefert Exact Head, tatsächlichen Diff, Tests/Gates und Vercel-Evidence.
- ChatGPT / Technical Lead prüft jeden Agenten-Change unabhängig vor Ready/Merge.

## 10. Supabase / Production

Production-Projekt:

`qscbgcdmivbbnzrcyegn`

Zuletzt verifizierter produktiver Migrationsstand bleibt bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`;
- `20260824140000_flug_route_itinerary_untrusted_surface`.

Development-only / nicht Production-approved:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`;
- `20260826090000_admin_aal2_data_plane` aus PR #80.

PR #81 enthält **keine Migration**.

Keine Development-only-Migration darf ohne eigenes Production-Gate still produktiv angewendet werden.

## 11. Continuity-Regel

Kein relevanter Fortschritt darf nur im Chat existieren. Reviews, Merges, Agentenstatus, Findings, Gate-Entscheidungen, Supabase-/Vercel-/CI-Evidence und nächste Schritte werden im Repository nachgezogen.

Historische PR-Bodies und Dokumente bleiben Evidence ihres damaligen Stands. Bei Widerspruch gelten Live-Evidence + aktuellste ausdrückliche Product-Owner-Entscheidung.