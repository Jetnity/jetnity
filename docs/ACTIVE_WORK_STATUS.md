# Jetnity – Active Work Status

Stand: 26. August 2026  
Status: **Kein aktiver Runtime-Slice. Continuity-/Handoff-Bereinigung nach Integration von PR #81, #84, #82, #83, #80 und #86. Nächster Schritt: unabhängiger Technical-Lead-Review von Draft-PR #85, danach erst der finale ChatGPT-Superprompt. Kein neuer Produktslice.**

> **Do not blindly trust this file — live verify first.**

## 0. Live-Integrationsbaseline

Aktueller verifizierter `main`:

`38ec8be79a6ce7758be81fd5d564819d638140d6`

Merge-Message: `Merge PR #86: fail-closed public metadata boundary`.

Production für diesen Merge:

Vercel Deployment `6108029117` → **SUCCESS** auf Exact Head `38ec8be7`.  
Öffentlicher Alias: `https://jetnity-app.vercel.app` (HTTP 200).  
Live HTML nach PR #86: `robots`/`googlebot` = `noindex, nofollow`; Canonical `https://jetnity.com`; OG-Bild `https://jetnity.com/images/hero-bali.png`.  
`/planen`: ebenfalls `noindex, nofollow`; Canonical `https://jetnity.com/planen`.  
`/robots.txt`: deny-all (`User-Agent: *` / `Disallow: /`).  
`https://jetnity.com` und `jetnity.ch` ohne öffentliche DNS-Auflösung (HTTP 000). Kein Cutover. Kein Redirect. Kein Public Indexing.

GitHub Actions:

- PR-#86 Exact Head `0f809857`: Run `32989862339` **SUCCESS**;
- Post-Merge `main` `38ec8be7`: Run `32991955365` **SUCCESS**.

Zuletzt integriert:

- PR #81 – P1-QS2-02 Guest→Account Stay/Activity Commercial Truth → `86567f17`;
- PR #84 – P1-TA-02 Official Evaluation Option-Scope → `2468160e`;
- PR #82 – TW6-A Create-Entry Alignment → `c4ea47aa`;
- PR #83 – Provider S5-A Commercial Provenance Domain Contract → `3b317bc6`;
- PR #80 – Central Admin AAL2 Guard → `d3faa2a0`;
- **PR #86 – D0 live metadata boundary / P1-D0-LIVE-01 → `38ec8be7`.** Kein D1/G1.

Bereits zuvor integriert: D0-1, D0-2, TW-1/2/4/3/5, QS-1, QS-2 Audit, Parallel-Audits #75–#78, AP-1–AP-3, S1–S3, Admin A–C, Foundations C/D/E.

`main` Branch Protection ist live **nicht aktiviert** (`protected=false`) und bleibt ein Governance-Risiko. In diesem Docs-only-Auftrag nicht konfiguriert.

PR #82 / #83 / #80 / #86 sind **keine** aktiven Drafts mehr. Sie sind gemergt.

## 1. Aktive Technical-Lead-Governance

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

Vor Ready/Merge zwingend: Live-`main`, Diff, Tests und Testannahmen, Security/Privacy/Truth/Shared Contracts, Exact-Head Actions/Vercel, relevante Supabase-Grenzen, Review-Threads und Parallelität prüfen. Bei Fehlern zuerst korrigieren und neu gaten.

Besondere Product-Owner-Gates bleiben unverändert, insbesondere für Production-Migrationen, große Auth/MFA/AAL-/RLS-/Identity-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, Payments, > USD 100/Monat und Public Launch / Provider-Live / Store-Aktivierung.

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

Integriert: TW-1, TW-2, TW-4, TW-3, TW-5, TW-6 Dependency-Audit, **TW6-A Create-Entry**.

**TW6-A ≠ gesamtes TW-6.** Offen: **TW6-REST-01** (progressive weitere Ziele / zusätzliche `trip_stages` im Create).

TW-7 bleibt hinter Account-/Hub-Grenzen. TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance; S5-A allein ist kein TW-8-Start.

Kein aktiver TW-Runtime-Draft.

## 4. Traveller / Account

Current Traveller Truth:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Dokumente/Credential-Optionen → kontextabhängig bewertete zulässige Optionen.**

Kein Default-Pass. Issuer ist nicht Citizenship.

Geschlossen:

- P1-QS2-02 durch PR #81;
- P1-TA-02 durch PR #84.

Weiter offen:

- **P2-TA-06** – `documents[0]` in `travellerNormalisieren()`; live weiterhin vorhanden in `lib/readiness/engine.ts`;
- **P2-TA-03** – `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` fehlt auf `main` und existiert nur im historischen Account-Audit-PR #39;
- Mobility/Rental-Such-Snapshots mit kommerziellen Feldern;
- direkter `reise_anlegen`-RPC-Bypass;
- Account-Traveller-Registry / AP-4–AP-12 / AP-7.

Kein aktiver Account-Runtime-Draft.

## 5. Provider Readiness

S1–S3 und **S5-A** sind integriert. S5-B ist **nicht gestartet**.

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Aktivierung, keine Production-Migration durch S5-A.

Gates:

- **TW8-START-GATE:** Kein TW-8 ohne belastbaren S5-Vertrag **und** spätere Provenance-/Persistenz-Reife. S5-A allein reicht nicht.
- **PROVIDER-ACTIVATION-GATE:** persistenter Cost Guard vor bezahlter/Production-Aktivierung.
- Persistierte kommerzielle Beträge ohne belegten Zeitpunkt bleiben `unknown`/`stale`.

## 6. QS / Admin AAL2

QS-2-P1s:

1. `P1-QS2-01` Application-AAL2 → **integriert durch PR #80**;
2. `P1-QS2-02` Guest→Account Commercial Truth → **integriert durch PR #81**.

Admin-AAL2-Vertrag integriert in der Anwendung. Development-Migration versioniert und auf Development angewendet (`admin_aal2_data_plane` als Version `20260826052735`). **Production-Datenebene nicht angewendet und nicht als aktiviert behaupten.**

Kein Admin D–K. Kein QS-3.

## 7. Aktive / nächste Cursor-Workstreams

Aktiv: **keiner.**

STOPP:

- `Trip workspace audit architecture`
- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`
- `Admin platform audit`
- `Jetnity growth discoverability`
- `Jetnity quality security audit`

Reserviert:

- `Jetnity native app architecture`

Dieser Continuity-Slice darf `docs/ACTIVE_WORK_STATUS.md` aktualisieren, weil er der zentrale Technical-Lead-/Continuity-Auftrag ist. Fachagenten ändern diese Datei weiterhin nicht parallel.

## 8. Offene PRs

Live geprüft nach PR #86. **#52 / #50 / #40 / #39 / #28 sind weiterhin OPEN / Draft** und nicht geschlossen.

| PR | Klasse |
| --- | --- |
| **#85** Final continuity handoff | **AKTIVER docs-only Draft.** Unabhängiger TL-Review. Nicht Ready. Nicht mergen durch den Autoren-Agenten. |
| #52 ChatGPT TL handoff 2026-08-24 | HISTORICAL / SUPERSEDED |
| #50 S1 merged-status docs | HISTORICAL / INTEGRATED ELSEWHERE |
| #40 Admin Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #39 Account Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #28 Trip Collaboration Foundation | HISTORICAL / SUPERSEDED / DO NOT RESUME |

Nicht schließen. Nicht löschen. Nicht als aktuelle Runtime-Arbeit wieder aufnehmen.

## 9. Supabase / Production

Production-Projekt `qscbgcdmivbbnzrcyegn`: zuletzt unabhängig live `ACTIVE_HEALTHY`, letzte angewendete Version `20260824140000` (gleiche Kalendertags-Evidence vor PR #86). PR #86 enthält **keine** Migration.

In dieser Continuity-Umgebung zeigt `SUPABASE_PROJECT_REF` **nicht** auf Production; Management-API gegen Production-Ref `403`. Deshalb keine neue Production-SQL-Liste in diesem Auftrag behauptet.

Development (dieses Agent-Secret), live erneut gelesen:

- enthält `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- enthält `20260824180000_trip_items_flug_handelsfelder_guard`;
- enthält `admin_aal2_data_plane` als angewendete Version `20260826052735`.

Keine Development-only-Migration darf ohne eigenes Production-Gate still produktiv angewendet werden. Keine Auth/RLS/AAL-/Provider-/Payment-Aktivierung.

## 10. Nächster Schritt

Unabhängiger ChatGPT-/Technical-Lead-Review von Draft-PR #85. Danach erst der finale ChatGPT-Superprompt. Kein Produktslice. Kein Ready/Merge dieses Continuity-PR durch den Autoren-Agenten. Kein D1/G1. Kein TW6-REST/TW-7/TW-8. Kein S5-B. Kein AP-Folgeslice. Kein Admin D–K.
