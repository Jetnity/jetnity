# Jetnity – Active Work Status

Stand: 27. August 2026  
Status: **Production Gate A ist PASS. PR #91 / TW6-B Gate 0B ist auf `main`. Production Gate B ist weiterhin NICHT freigegeben und NICHT angewendet. PR #87 bleibt Draft und ist der nächste operative Runtime-Schritt: gegen den neuen `main` synchronisieren, vollständig rekonstruieren und re-gaten.**

> **Do not blindly trust this file — live verify first.**

## 0. Live-Integrationsbaseline

PR #91 wurde nach unabhängigem Technical-Lead-PASS auf Exact Head `1da3ae0a01c6d5bb1f2325a2ca528922823c9611` mit Expected Head SHA gemergt.

Verifizierte PR-#91-Linie:

- Base / Merge-Base vor Merge: `f683855fa82a6ae5663228b2c9dfa605755fc47d`
- Ahead / Behind: `2 / 0`
- PR-#91 Exact Head: `1da3ae0a01c6d5bb1f2325a2ca528922823c9611`
- Exact-Head GitHub Actions Run `33031870276`: SUCCESS
- Exact-Head Vercel `dpl_9QJSE9UeQNfehoLjdEa3PPXfyvLs`: READY
- Merge-Commit auf `main`: `a2e46f38dcfbbea286e37960c7993adbbd06136a`
- Post-Merge `main` GitHub Actions Run `33053499406`: SUCCESS
- Post-Merge Vercel Production `dpl_2UjcAyoJ3D4Puuqehu3izDtcXDtj`: READY auf exakt `a2e46f38dcfbbea286e37960c7993adbbd06136a`

Vollständiger Post-Merge-Checkpoint:

`docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`

Production Public Runtime bleibt bezüglich D0 unverändert:

- `robots` / `googlebot` = `noindex, nofollow`;
- Canonical `https://jetnity.com`;
- `/planen` ebenfalls `noindex, nofollow`;
- `robots.txt` deny-all;
- kein Domain-Cutover, kein Public Indexing, kein Redirect-Gate.

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

`Jetnity growth discoverability` bleibt STOPP. Kein D1/G1 automatisch starten.

## 3. Trip Workspace

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW-6 Dependency-Audit ✅
- TW6-A Create-Entry ✅
- TW6-B Gate 0 / Provenance via PR #89 ✅
- TW6-B Gate 0B / Zero-Stage Production Rollout Provenance via PR #91 ✅

**Gate 0 / Gate 0B ≠ TW6-B Runtime-Merge und ≠ Production Gate B.**

Durch PR #91 ist der verbindliche spätere Gate-B-Vertrag jetzt:

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

Alle vier Dateien gehören unter denselben bounded Write-Gate-/Transaktionsvertrag. Kein dateiweises Apply. `27010000` schließt den Zero-Stage-Falschmode: 0 Stages fail-closed, `single_destination` nur bei genau einer Stage.

PR #87 (`feat/tw6-rest-progressive-stages`) bleibt der Runtime-Draft für progressive weitere Ziele / Day→Stage Mode Contract. Nach PR #91 muss er gegen den neuen `main` scope-sicher synchronisiert und vollständig neu gegatet werden.

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

## 5. Provider Readiness

S1–S3 und **S5-A** sind integriert. S5-B ist **nicht gestartet**.

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Aktivierung durch Gate A/Gate 0B.

Gates:

- **TW8-START-GATE:** Kein TW-8 ohne belastbaren S5-Vertrag **und** spätere Provenance-/Persistenz-Reife. S5-A allein reicht nicht.
- **PROVIDER-ACTIVATION-GATE:** persistenter Cost Guard vor bezahlter/Production-Aktivierung.
- Persistierte kommerzielle Beträge ohne belegten Zeitpunkt bleiben `unknown`/`stale`.

## 6. QS / Admin AAL2 / Sanitation

Admin-AAL2 Application-Guard ist im Code integriert. Development enthält `admin_aal2_data_plane`; **Production-Datenebene ist weiterhin nicht angewendet**.

Separate Supabase Security-/Performance-Advisors bleiben eigene QS-Arbeit. Keine dieser separaten Baustellen wurde durch Gate 0B still verändert.

Project-Sanitation-Audit PR #88 bleibt non-destructive Evidence. Kein Cleanup/Branch-/Cloud-Delete automatisch ausführen.

Live Supabase-Inventur zeigt:

- Production-Elternprojekt `qscbgcdmivbbnzrcyegn` (`Jetnity's Project`) – ACTIVE_HEALTHY
- Development-Branch `yfvbxvijcorffwxbxahl`
- weiteres Top-Level-Projekt `jrixsujkzvlvglvcmtia` (`jetnity-bets`) – Decommission bleibt separate Product-Owner-Entscheidung

## 7. Aktive / nächste Cursor-Workstreams

Aktiver Runtime-Agent: **keiner**.

Nächster ggf. zu steuernder Agent für PR #87:

`Cursor-Agent: Trip workspace audit architecture`

Er bekommt nur einen präzisen Synchronisierungs-/Korrekturauftrag, falls der unabhängige Technical Lead nach Live-Rekonstruktion eine Änderung verlangt.

STOPP weiterhin für automatische Folgeslices:

- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`
- `Admin platform audit`
- `Jetnity growth discoverability`
- `Jetnity quality security audit`

Reserviert:

- `Jetnity native app architecture`

## 8. Offene PRs

Operativ relevant:

| PR | Klasse |
| --- | --- |
| **#87** TW6-B Runtime + Mode Contract | **OFFENER Runtime-Draft.** Nach PR #91 gegen neuen `main` synchronisieren, echten Diff prüfen und neu gaten. |
| **#88** Project Sanitation Audit | Non-destructive Audit-Evidence. Kein Cleanup automatisch. |
| #52 ChatGPT TL handoff 2026-08-24 | HISTORICAL / SUPERSEDED |
| #50 S1 merged-status docs | HISTORICAL / INTEGRATED ELSEWHERE |
| #40 Admin Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #39 Account Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #28 Trip Collaboration Foundation | HISTORICAL / SUPERSEDED / DO NOT RESUME |

PR #89 und PR #91 sind gemergt und keine aktiven Drafts mehr.

Historische Evidence nicht löschen. Nicht als aktuelle Runtime-Arbeit wieder aufnehmen.

## 9. Supabase / Production

Production ist live `ACTIVE_HEALTHY`.

Production Gate A ist PASS. Post-PR-#91 read-only erneut verifiziert:

- Gate-A-Versionen `20260824160000` + `20260824180000`: count = 2
- TW6-B-Versionen `20260826220000` / `20260826230000` / `20260826240000` / `20260827010000`: count = 0
- `day_stage_assignment_mode` / `day_stage_assignment_source`: nicht vorhanden
- Guard-Trigger `trip_items_flug_handelsfelder_schuetzen`: vorhanden/enabled

Explizit **nicht** in Production-History und **nicht** angewendet:

- TW6-B `20260826220000`
- TW6-B `20260826230000`
- TW6-B `20260826240000`
- TW6-B `20260827010000`
- AAL2 `20260826090000`
- Development-AAL2-Version `20260826052735`

Development enthält dagegen bereits alle vier Gate-B-Versionen und die Zero-Stage-Fail-Closed-Funktion. Dort nicht erneut blind migrieren.

## 10. Nächster Schritt

**STOP vor Production Gate B.**

Der Gate-0B-Prep ist durch PR #91 integriert. Nächster Technical-Lead-Schritt ist jetzt ausschließlich:

**PR #87 gegen den neuen `main` nach PR #91 synchronisieren / rekonstruieren / vollständig unabhängig re-reviewen.**

Zwingend neu prüfen: Merge-Base, Ahead/Behind, realer Diff, Shared Contracts, Multi-Ziel-/Zero-Stage-/Commercial-Truth-Semantik, Security/Ownership, Exact-Head GitHub Actions, Exact-Head Vercel und Production-/Supabase-Grenzen.

Erst nach neuem PASS kann der Product Owner separat um Freigabe für das Production-Vier-Datei-Bundle unter Write-Gate gebeten werden.

Kein Gate B, kein AAL2, kein Direction A, kein PR-#87-Merge ohne neuen PASS und kein TW-7/8/9-Folgeslice.
