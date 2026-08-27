# Jetnity – Active Work Status

Stand: 27. August 2026  
Status: **Production Gate A ist PASS. PR #89 (Gate 0) ist auf `main`. Gate 0B (Vier-Datei-Vertrag inkl. `20260827010000`) ist der aktuelle migrations-only Prep. TW6-B Gate B ist weiterhin NICHT freigegeben und NICHT auf Production angewendet. PR #87 bleibt Draft.**

> **Do not blindly trust this file — live verify first.**

## 0. Live-Integrationsbaseline

Aktueller verifizierter `main` zum Gate-0B-Prep:

`f683855fa82a6ae5663228b2c9dfa605755fc47d`

Wichtige aktuelle Linie:

- PR #89 – **TW6-B Gate 0: migrations-only + bounded transactional apply playbook** → gemergt; Merge-Commit `5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`.
- Unabhängiger Technical-Lead-PASS auf PR-#89-Exact-Head `986fa8b7592286731e44ab46d36a8f299531d669`.
- Exact-Head GitHub Actions Run `33023062522`: SUCCESS.
- Exact-Head Vercel Preview: SUCCESS/READY.
- Post-Merge `main` GitHub Actions Run `33023988403` auf `5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`: SUCCESS.
- Danach docs-only Production-Gate-A-Checkpoint auf `main`; keine Runtime-Datei geändert.

Production Public Runtime bleibt bezüglich D0 unverändert:

- `robots`/`googlebot` = `noindex, nofollow`;
- Canonical `https://jetnity.com`;
- `/planen` ebenfalls `noindex, nofollow`;
- `robots.txt` deny-all;
- kein Domain-Cutover, kein Public Indexing, kein Redirect-Gate.

Zuletzt integriert vor Gate A:

- PR #81 – P1-QS2-02 Guest→Account Stay/Activity Commercial Truth;
- PR #84 – P1-TA-02 Official Evaluation Option-Scope;
- PR #82 – TW6-A Create-Entry Alignment;
- PR #83 – Provider S5-A Commercial Provenance Domain Contract;
- PR #80 – Central Admin AAL2 Guard;
- PR #86 – D0 live metadata boundary / P1-D0-LIVE-01;
- PR #89 – TW6-B Gate 0 migrations-only provenance + transactional playbook.

`main` Branch Protection ist live **nicht aktiviert** (`protected=false`) und bleibt ein Governance-Risiko.

## 1. Aktive Technical-Lead-Governance

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

Vor Ready/Merge zwingend: Live-`main`, Diff, Tests und Testannahmen, Security/Privacy/Truth/Shared Contracts, Exact-Head Actions/Vercel, relevante Supabase-Grenzen, Review-Threads und Parallelität prüfen. Bei Fehlern zuerst korrigieren und neu gaten.

Besondere Product-Owner-Gates bleiben unverändert, insbesondere für Production-Migrationen, große Auth/MFA/AAL-/RLS-/Identity-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, Payments, > USD 100/Monat und Public Launch / Provider-Live / Store-Aktivierung.

Die Product-Owner-Freigabe vom 27. August 2026 galt **nur** für Production Gate A:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard`

Diese Freigabe galt ausdrücklich **nicht** für TW6-B, AAL2, Direction A, PR #87 oder andere Production-Migrationen.

## 2. D0 / Growth

D0-1, D0-2 und **P1-D0-LIVE-01** sind auf `main`.

Domain-Wahrheit:

- `https://jetnity.com` = einzige zukünftige kanonische/indexierte Public-Hauptdomain;
- `jetnity.ch` = Schweizer Entry-/Redirect-Domain, keine zweite indexierte Plattform;
- HTML-robots folgt `darfIndexieren` fail-closed;
- Public Canonical / metadataBase / OG / JSON-LD verwenden `https://jetnity.com`;
- `*.vercel.app` ist niemals kanonische Jetnity-Produktdomain;
- `/planen` emittiert robots explizit;
- Indexing nur bei explizitem `NEXT_PUBLIC_ALLOW_INDEXING=true` und exakter `.com`-Origin;
- Default bleibt deny/false;
- kein Domain-Cutover, kein Public-Launch, kein Redirect, kein DNS.

Offen: **D0-P1-03** Legal-404 (`/privacy`, `/terms` live 404); D0-P2-04 hreflang; D0-P2-05 JSON-LD; G0-Reste.

`Jetnity growth discoverability` bleibt STOPP. Kein D1/G1 aus PR #86 ableiten.

## 3. Trip Workspace

Integriert: TW-1, TW-2, TW-4, TW-3, TW-5, TW-6 Dependency-Audit, **TW6-A Create-Entry** sowie **TW6-B Gate 0 / Provenance** durch PR #89.

**Gate 0 ≠ TW6-B Runtime-Merge und ≠ Production Gate B.**

PR #87 (`feat/tw6-rest-progressive-stages`) bleibt der Runtime-Draft für progressive weitere Ziele / Day→Stage Mode Contract. Er darf nicht aus dem früheren PLAN-PASS direkt weitergezogen werden, weil `main` seitdem fortgeschritten ist. Vor jedem weiteren Schritt: Merge-Base, Diff, Shared Contracts, Exact-Head CI/Vercel und Production-Grenzen erneut live prüfen.

TW-7 bleibt hinter Account-/Hub-Grenzen. TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance; S5-A allein ist kein TW-8-Start.

## 4. Traveller / Account

Current Traveller Truth:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Dokumente/Credential-Optionen → kontextabhängig bewertete zulässige Optionen.**

Kein Default-Pass. Issuer ist nicht Citizenship.

Geschlossen:

- P1-QS2-02 durch PR #81;
- P1-TA-02 durch PR #84.

Weiter offen:

- **P2-TA-06** – `documents[0]` in `travellerNormalisieren()`;
- **P2-TA-03** – Account-Implementation-Plan nur in historischem Audit-PR #39;
- Mobility/Rental-Such-Snapshots mit kommerziellen Feldern;
- Account-Traveller-Registry / AP-4–AP-12 / AP-7.

Der frühere direkte `reise_anlegen`-Commercial-Truth-Bypass ist durch Production Gate A jetzt serverseitig zusätzlich abgesichert; das schließt TW6-B nicht.

## 5. Provider Readiness

S1–S3 und **S5-A** sind integriert. S5-B ist **nicht gestartet**.

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Aktivierung durch Gate A.

Gates:

- **TW8-START-GATE:** Kein TW-8 ohne belastbaren S5-Vertrag **und** spätere Provenance-/Persistenz-Reife. S5-A allein reicht nicht.
- **PROVIDER-ACTIVATION-GATE:** persistenter Cost Guard vor bezahlter/Production-Aktivierung.
- Persistierte kommerzielle Beträge ohne belegten Zeitpunkt bleiben `unknown`/`stale`.

## 6. QS / Admin AAL2

QS-2-P1s:

1. `P1-QS2-01` Application-AAL2 → integriert durch PR #80;
2. `P1-QS2-02` Guest→Account Commercial Truth → integriert durch PR #81.

Admin-AAL2-Vertrag ist in der Anwendung integriert. Development enthält `admin_aal2_data_plane`; **Production-Datenebene ist weiterhin nicht angewendet**.

Production Gate A hat AAL2 nicht berührt.

Nach Gate A wurden Supabase Security-/Performance-Advisors gelesen. Es bestehen separate Warn-/Info-Funde zu GraphQL-Exposition, älteren Admin-`SECURITY DEFINER`-Funktionen, fehlenden FK-Indizes und ungenutzten Indizes. Kein Fund zeigt auf die beiden Gate-A-Funktionen als Gate-A-spezifische Fehlkonfiguration. Keine dieser separaten Baustellen wurde im Gate-A-Lauf still verändert.

## 7. Aktive / nächste Cursor-Workstreams

Aktiver Runtime-Agent: **keiner**.

STOPP bis Technical-Lead-Neueinordnung:

- `Trip workspace audit architecture` – PR #87 bleibt Draft; kein Folgeslice, kein Gate B ohne neue Freigabe
- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`
- `Admin platform audit`
- `Jetnity growth discoverability`
- `Jetnity quality security audit`

Reserviert:

- `Jetnity native app architecture`

Project-Sanitation-Audit PR #88 bleibt non-destructive Evidence. Kein Cleanup/Branch-/Cloud-Delete automatisch ausführen.

## 8. Offene PRs

Operativ relevant:

| PR | Klasse |
| --- | --- |
| **#87** TW6-B Runtime + Mode Contract | **OFFENER Runtime-Draft.** Früherer Plan-Review reicht nach verändertem `main` nicht für Merge/Production. Neu synchronisieren und re-gaten. |
| **#88** Project Sanitation Audit | Non-destructive Audit-Evidence. Kein Cleanup automatisch. |
| #52 ChatGPT TL handoff 2026-08-24 | HISTORICAL / SUPERSEDED |
| #50 S1 merged-status docs | HISTORICAL / INTEGRATED ELSEWHERE |
| #40 Admin Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #39 Account Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #28 Trip Collaboration Foundation | HISTORICAL / SUPERSEDED / DO NOT RESUME |

PR #89 ist gemergt und kein aktiver Draft mehr.

Historische Evidence nicht löschen. Nicht als aktuelle Runtime-Arbeit wieder aufnehmen.

## 9. Supabase / Production

Production ist nach Gate A live `ACTIVE_HEALTHY`.

Kanonische Production-Migration-History endet jetzt bei:

- `20260824160000` – `reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000` – `trip_items_flug_handelsfelder_guard`

Finale semantische Gate-A-Verifikation: PASS.

- RPC strippt untrusted Flight-Handelsfelder;
- Route-Itinerary bleibt erhalten;
- `authenticated` darf `reise_anlegen`, `anon` nicht;
- Guard-Trigger genau einmal vorhanden und enabled;
- Trigger-Scope korrekt;
- direkte Guard-Funktion nicht für authenticated/anon ausführbar;
- Production hat weiterhin 0 persistierte Flight-Items.

Explizit **nicht** in Production-History und **nicht** angewendet:

- TW6-B `20260826220000`
- TW6-B `20260826230000`
- TW6-B `20260826240000`
- TW6-B `20260827010000`
- AAL2 `20260826090000`
- Development-AAL2-Version `20260826052735`

Auf Production existiert weiterhin weder `day_stage_assignment_source` noch `day_stage_assignment_mode`. Damit ist TW6-B nicht still aktiviert worden.

Vollständige Execution-Evidence: `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`.

## 10. Nächster Schritt

**STOP vor Gate B.**

Aktiver Prep: Gate 0B Vier-Datei-Vertrag (`26220000 → 26230000 → 26240000 → 27010000`) migrations-only gegen aktuellen `main`. Kein Production-Apply. Kein Runtime aus PR #87.

Nach Gate-0B-Review/Merge muss PR #87 erneut mit dem dann aktuellen `main` synchronisiert werden. Erst danach kann der Product Owner separat um Freigabe für das Vier-Datei-Bundle unter Write-Gate gebeten werden.

Kein Gate B, kein AAL2, kein Direction A, kein PR-#87-Merge und kein Folgeslice ohne diese erneute Live-Evidence und die jeweils nötige Freigabe.
