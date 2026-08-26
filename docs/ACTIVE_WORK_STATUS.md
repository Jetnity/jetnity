# Jetnity – Active Work Status

Stand: 26. August 2026  
Status: **Kein aktiver Runtime-Slice. Continuity-/Handoff-Bereinigung nach Integration von PR #81, #84, #82, #83 und #80. Nächster Schritt: unabhängiger Technical-Lead-Review, kein neuer Produktslice.**

> **Do not blindly trust this file — live verify first.**

## 0. Live-Integrationsbaseline

Aktueller verifizierter `main`:

`d3faa2a08a5a492230d94e03c4d1811b32dd915b`

Production für diesen Merge:

Vercel Deployment `6106016878` / `9JTEdJ88wXhwP2JyhbcFfiCpugkw` → **SUCCESS** auf Exact Head `d3faa2a0`.  
Öffentlicher Alias: `https://jetnity-app.vercel.app` (HTTP 200).  
`https://jetnity.com` ist kanonische Produktdomain, live ohne öffentliche DNS-Auflösung. Kein Cutover.

GitHub Actions Exact Head: Run `32980880774` **SUCCESS**.

Zuletzt integriert:

- PR #81 – P1-QS2-02 Guest→Account Stay/Activity Commercial Truth → `86567f17`;
- PR #84 – P1-TA-02 Official Evaluation Option-Scope → `2468160e`;
- PR #82 – TW6-A Create-Entry Alignment → `c4ea47aa`;
- PR #83 – Provider S5-A Commercial Provenance Domain Contract → `3b317bc6`;
- PR #80 – Central Admin AAL2 Guard → `d3faa2a0`.

Bereits zuvor integriert: D0-1, D0-2, TW-1/2/4/3/5, QS-1, QS-2 Audit, Parallel-Audits #75–#78, AP-1–AP-3, S1–S3, Admin A–C, Foundations C/D/E.

`main` Branch Protection ist live **nicht aktiviert** (`protected=false`) und bleibt ein Governance-Risiko. In diesem Docs-only-Auftrag nicht konfiguriert.

## 1. Aktive Technical-Lead-Governance

> **Autonom mergen ist erlaubt – blind mergen ist verboten.**

Vor Ready/Merge zwingend: Live-`main`, Diff, Tests und Testannahmen, Security/Privacy/Truth/Shared Contracts, Exact-Head Actions/Vercel, relevante Supabase-Grenzen, Review-Threads und Parallelität prüfen. Bei Fehlern zuerst korrigieren und neu gaten.

Besondere Product-Owner-Gates bleiben unverändert, insbesondere für Production-Migrationen, große Auth/MFA/AAL-/RLS-/Identity-Änderungen, sensitive Dokumentdaten, reale Provider/Secrets/paid calls, Payments, > USD 100/Monat und Public Launch / Provider-Live / Store-Aktivierung.

## 2. D0 / Growth

D0-1 und D0-2 sind auf `main`.

Domain-Wahrheit:

- `https://jetnity.com` = einzige zukünftige kanonische/indexierte Public-Hauptdomain;
- `jetnity.ch` = Schweizer Entry-/Redirect-Domain, keine zweite indexierte Plattform;
- Indexing nur bei explizitem `NEXT_PUBLIC_ALLOW_INDEXING=true` und exakter `.com`-Origin;
- kein Domain-Cutover, kein Public-Launch.

Offen: **D0-P1-03** Legal-404; D0-P2-04 hreflang; D0-P2-05 JSON-LD; G0-Reste.

`Jetnity growth discoverability` bleibt STOPP.

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

- **P2-TA-06** – `documents[0]` in `travellerNormalisieren()`; live weiterhin vorhanden;
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

Admin-AAL2-Vertrag integriert in der Anwendung. Development-Migration versioniert. **Production-Datenebene nicht angewendet.**

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

Nur historische Drafts: #52, #50, #40, #39, #28. Klassifikation im Checkpoint. Nicht wieder als aktuelle Arbeit aufnehmen. Nicht schließen.

## 9. Supabase / Production

Production-Projekt `qscbgcdmivbbnzrcyegn`: live `ACTIVE_HEALTHY`.

Production endet bei `20260824140000`.

Development-only / nicht Production-approved:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`;
- `20260826090000_admin_aal2_data_plane` (Development-Apply-Version `20260826052735` beobachtet; Production ohne diesen Eintrag).

Keine Development-only-Migration darf ohne eigenes Production-Gate still produktiv angewendet werden.

## 10. Nächster Schritt

Unabhängiger ChatGPT-/Technical-Lead-Review des Continuity-Handoffs. Kein Produktslice. Kein Ready/Merge dieses Continuity-PR durch den Autoren-Agenten.
