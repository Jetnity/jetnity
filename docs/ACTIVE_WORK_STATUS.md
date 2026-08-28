# Jetnity – Active Work Status

Stand: 28. August 2026  
Status: **AP-5 Gate 0 Account-Security-Capability-Audit ist der aktuelle Account-Architecture-Slice auf Issue #128. P2-TA-04 C1 / PR #126 ist integriert; Issue #122 CLOSED / completed. Kein C2. Keine AP-5-Runtime. Kein Auth-Config-Push. Live-`main` immer live prüfen.**

> **Do not blindly trust this file — live verify first.**

## Aktueller Arbeitsblock – AP-5 Gate 0 Account security capability audit

1. **Arbeitsblock / Ziel:** Issue #128 / AP-5 Gate 0 – bestehenden Auth-/Session-/MFA-Vertrag rekonstruieren und AP-5-Folgeslices in TL- vs. Product-Owner-Gates schneiden.
2. **Authoring-Branch / PR:** `cursor/ap5-gate0-auth-session-mfa-79f9`; Draft-PR #129.
3. **Status:** **AUTHOR COMPLETE / DRAFT.** Kein Ready, kein Merge, keine AP-5-Runtime.
4. **Bereits umgesetzt:** Vertragsrekonstruktion; ADR-0182; Inventory-Test; Status/Handoff/Self-Review; Continuity-Zeiger. Live `auth:pruefen` 55/55.
5. **Cursor-Agent:** `Account plattform audit vorbereitung 8`.
6. **Live-`main` bei Authoring:** `0bca31b5de06bcee74c5436122b1685b6d2092f6` – immer live neu prüfen.
7. **DB / RLS / Production-Grenze:** keine Migration, kein RLS-/Auth-/AAL-Write, kein Production-Daten-Write, keine Supabase-Branch-Mutation, kein Auth-Config-Push.
8. **Kosten / Provider / Secrets:** keine.
9. **Bekannte Residuals:** Sessionliste unsupported; heutiges Abmelden ist bereits `global`; Login-MFA abbrechbar; D0-P1-03 Legal-404; C2 PO-gated; `main` Branch Protection `protected=false`.
10. **Offene Nutzerentscheidungen / Freigaben:** dieses Gate 0 braucht keines. AP-5-P1–P5 brauchen Product-Owner, bevor sie gebaut werden.
11. **Exakter nächster Schritt:** unabhängiger Technical-Lead-Finalreview. **Kein AP-5-Runtime-Start aus diesem Slice.**
12. **Zuerst lesen:** `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`, Handoff, ADR-0182.

Historischer abgeschlossener Block P2-TA-04 C1 bleibt integriert: PR #126 MERGED, Issue #122 CLOSED / completed. Nicht erneut öffnen. P2-TA-03 bleibt integriert: PR #117 MERGED, Issue #116 CLOSED / completed. P2-TA-06 bleibt integriert: PR #113 MERGED, Issue #112 CLOSED / completed.

## 0. Live-Integrationsbaseline

Live-`main` immer live prüfen. Keine bewegliche Exact-Head-SHA als kanonische Live-Wahrheit.

Post-Merge-Evidence von PR #113:

- Reviewed Head: `928215a2c6c4d4ce914f12ba1bd88dbcab8f548b`
- Independent Technical-Lead PASS: Review `5046006374`
- Merge-Commit: `286d26fec2eed87e1227ebb2cf7327f50e8f5f1a`
- Post-Merge GitHub Actions: Run `33120743073` SUCCESS
- Post-Merge Vercel Production: `dpl_7V8WetsqrXC8m4CQcUZoQb9hXn1e` READY
- Issue #112: CLOSED / completed

Historische Start-Baseline von TW7-A (Issue #103 / PR #106), ausdrücklich nicht aktueller Live-Stand:

- `963186f4ec75501efd253a287131f464a5fd0fdb` — `Merge PR #102: Admin AAL2 production apply gate closure`

PR #102 bleibt integriert. Production `20260827170000_admin_aal2_data_plane_alignment` ist angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Admin-Capabilities verlangen Rolle **UND** aktuelles AAL2. Kein zweiter Apply.

Vorherige dokumentierte Baseline (historisch):

- `beaef64a151adceb8f5bc759f58ae9ad13cecc51` — `Merge PR #98: Admin AAL2 production data-plane alignment`
- GitHub Actions auf exakt diesem SHA: Run `33087558642` SUCCESS
- GitHub Production-Deployment auf exakt diesem SHA: `6125680097` success

PR-#97-Docs-Merge bleibt:

- `4362502bf23c1c54f721af48c0f7bdd6fcbdee3b` — `Merge PR #97: TL live reconstruction + AAL2 production gate`

PR-#96-Continuity-Merge bleibt:

- `45be14b1077589953d5dbf21f569311c9a4b59f7` — `Merge PR #96: post-PR94 continuity`

PR-#94-Produktmerge bleibt:

- `819715b1567417893d894b7b110eff1a2ab6cded` — `Merge PR #94: Visitor Search UX`

Verifizierte PR-#94-Linie:

- Base / Merge-Base vor Merge: `b76148e533fb0758c0197d0e0252624bb869cdb5`
- PR-#94 Exact Head: `8da869fd2756f3c1514de6d33678c8c7abfad1c4`
- Independent Technical-Lead PASS review: `5040199350`
- Exact-Head GitHub Actions Run `33066516282`: SUCCESS
- Exact-Head Vercel Preview `CBuVobvymHT9m7A4uUKmb2exU4PU`: SUCCESS
- Merge-Commit auf `main`: `819715b1567417893d894b7b110eff1a2ab6cded`
- Post-Merge `main` GitHub Actions Run `33067498607`: SUCCESS
- Post-Merge Vercel `GrD4MaYqtnR9UL619gVnKx9HSUmH`: SUCCESS auf exakt `819715b1567417893d894b7b110eff1a2ab6cded`
- GitHub Production deployment `6121770601`: SUCCESS auf demselben SHA

Post-Merge-Checkpoints:

- `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md` (PR #95, bereits auf `main`)
- `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md` (PR-#94-Continuity, mit PR #96 integriert/geschlossen)

PR #91 bleibt Teil der Vorgeschichte (Merge `a2e46f38dcfbbea286e37960c7993adbbd06136a`). Checkpoint: `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`. Aussagen dort, Production Gate B sei unangewendet oder PR #87 bleibe Draft, sind **historische Evidence** vor den späteren Gate-B- und Runtime-Merges.

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

Diese Freigabe galt ausdrücklich **nicht** für TW6-B, AAL2, Direction A oder andere späteren Production-Migrationen. PR #94 brauchte kein besonderes Product-Owner-Gate.

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
- TW6-B Runtime + Day→Stage Mode Contract via PR #87 ✅ (`TW6-REST-01` geschlossen)
- Visitor Search UX via PR #94 ✅

**Gate 0 / Gate 0B ≠ TW6-B Runtime-Merge und ≠ Production Gate B.**

Der Vier-Datei-Vertrag ist der **bereits angewendete historische Production-Gate-B-Rollout**, nicht ein offener späterer Apply:

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

Kein Re-Apply ist pending. Development und Production nicht blind erneut mit diesem Bundle migrieren. `27010000` bleibt die Zero-Stage-Regel: 0 Stages fail-closed, `single_destination` nur bei genau einer Stage.

PR #87 (`feat/tw6-rest-progressive-stages`) ist gemergt und **schließt `TW6-REST-01`**. Reviewed Head `7ef201fb`, Merge-Commit auf `main` `80bbde69`. Checkpoint: `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`.

PR #94 (`cursor/visitor-search-ux-b13d`) ist gemergt. Reviewed Head `8da869fd`, Merge-Commit auf `main` `819715b1`. P1 Listbox und P2 Abort-Race sind geschlossen. Task bleibt historische Slice-Spec: `docs/TRIP_WORKSPACE_VISITOR_SEARCH_UX_TASK.md`. Keine Schema-/Production-Änderung. Kein neuer Search-Provider.

Ältere Exact-Head-Evidence (`72ca1700`, `1008632e`, Review `5040068359` CHANGES REQUIRED) bleibt historisch.

TW-7-Start-Gate ist erfüllt. Der Weg ist bereits einer. TW7-A Runtime ist integriert (PR #106): Mehrziel-Kartenidentität plus Gast-`itemCount`. Spec: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`. Stand: `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`. Issue #103 ist CLOSED / completed. TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance; S5-A allein ist kein TW-8-Start.

## 4. Traveller / Account

Current Traveller Truth:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Dokumente/Credential-Optionen → kontextabhängig bewertete zulässige Optionen.**

Kein Default-Pass. Issuer ist nicht Citizenship.

Geschlossen:

- P1-QS2-02 durch PR #81;
- P1-TA-02 durch PR #84;
- **P2-TA-06 / Issue #112 durch PR #113.** Der First-Document-Fallback in `travellerNormalisieren()` ist entfernt; PR #113 ist auf `main`, Issue #112 CLOSED / completed. Auftrag: `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_TASK_2026-08-27.md`. Stand/Handoff sind post-merge aktualisiert. ADR-0178 bleibt die Slice-Entscheidung.

Weiter offen außerhalb dieses Slice:

- **P2-TA-03** – kanonischer Plan durch PR #117 integriert; historische Datei bleibt auf PR #39. Kein AP-5;
- **P2-TA-04 C1** – Issue #122 Implementation; Gate 0 / PR #120 integriert; kein C2/REVOKE/DEFINER;
- Mobility/Rental-Such-Snapshots mit kommerziellen Feldern;
- Account-Traveller-Registry / AP-5–AP-12 / AP-7. AP-4 ist integriert (PR #108). **Kein AP-5/AP-7 automatisch.**

## 5. Provider Readiness

S1–S3 und **S5-A** sind integriert. S5-B ist **nicht gestartet**.

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Aktivierung durch Gate A/Gate 0B/PR #94/PR #113.

Gates:

- **TW8-START-GATE:** Kein TW-8 ohne belastbaren S5-Vertrag **und** spätere Provenance-/Persistenz-Reife. S5-A allein reicht nicht.
- **PROVIDER-ACTIVATION-GATE:** persistenter Cost Guard vor bezahlter/Production-Aktivierung.
- Persistierte kommerzielle Beträge ohne belegten Zeitpunkt bleiben `unknown`/`stale`.

## 6. QS / Admin AAL2 / Sanitation

Admin-AAL2 Application-Guard ist im Code integriert. PR #102 ist integriert. Production `20260827170000_admin_aal2_data_plane_alignment` ist angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Admin-Capabilities verlangen Rolle **UND** aktuelles AAL2. Kein zweiter Apply. Ältere Sätze „Production-Datenebene ist weiterhin nicht angewendet“ sind Pre-Apply-Evidence.

Separate Supabase Security-/Performance-Advisors bleiben eigene QS-Arbeit. Keine dieser separaten Baustellen wurde durch PR #94 oder PR #113 still verändert.

Project-Sanitation-Audit PR #88 bleibt non-destructive Evidence. Kein Cleanup/Branch-/Cloud-Delete automatisch ausführen.

Live Supabase-Inventur zeigt:

- Production-Elternprojekt `qscbgcdmivbbnzrcyegn` (`Jetnity's Project`) – ACTIVE_HEALTHY
- Development-Branch `[REDACTED]`
- weiteres Top-Level-Projekt `jrixsujkzvlvglvcmtia` (`jetnity-bets`) – Decommission bleibt separate Product-Owner-Entscheidung

## 7. Aktive / nächste Cursor-Workstreams

Kein offener TW-7-Produktdocs-Draft als operative nächste Arbeit.

- **PR #106** integriert TW7-A Runtime (Issue #103). Integrationsvehikel. Issue #103 ist CLOSED / completed.
- **PR #100** versioniert TW-7-Gap / ADR-0176 / TW7-A-Spec. Nach Landung integriert.
- Historische Pre-Merge-Evidence von PR #100: Head `2aa573f1` Actions `33087982878` SUCCESS, Vercel `DUzQZnDEY2TBdP1rwoZFPs2bzFsA` SUCCESS; späterer Stamp-Head `2abe79b4` Actions `33088507998` SUCCESS, Vercel `8NJVH46dzhrvUur8raAGukyiyzcL` SUCCESS.

PR #98 und PR #102 sind integriert. Production-AAL2 `20260827170000` ist angewendet und verifiziert, exakt einmal. Ältere Sätze „Production-AAL2-Apply bleibt ein Gate“ sind Pre-Apply-Evidence.

PR #96 bleibt integriert/geschlossen. Historisch Draft auf `cursor/pr94-continuity-b13d`; das ist keine operative nächste Arbeit.

Account/Traveller zuletzt abgeschlossen:

- **Issue #112 / P2-TA-06** – `Account plattform audit vorbereitung 4`. PR #113 integriert. Issue CLOSED / completed. Generation 4 ist historische Authoring-Evidence.

Aktueller Account-Architecture-Slice:

- **Issue #128 / AP-5 Gate 0** – `Account plattform audit vorbereitung 8`. Audit only. Draft. Kein Ready, kein Merge, keine AP-5-Runtime.

Historisch abgeschlossen:

- **Issue #122 / P2-TA-04 C1** – `Account plattform audit vorbereitung 7`. PR #126 integriert. Generation 7 nicht wiederverwenden.

- **Issue #119 / P2-TA-04 Gate 0** – `Account plattform audit vorbereitung 6`. PR #120 integriert. Generation 6 nicht wiederverwenden.
- **Issue #116 / P2-TA-03** – `Account plattform audit vorbereitung 5`. PR #117 integriert. Generation 5 nicht wiederverwenden.

**Kein automatisch freigegebener Produkt-Folgeslice.** AP-5-Runtime startet nicht aus Gate 0.

STOPP weiterhin für automatische Folgeslices:

- `Account plattform audit vorbereitung`
- `Jetnity provider readiness audit`
- `Admin platform audit`
- `Jetnity growth discoverability`
- `Jetnity quality security audit`

Reserviert:

- `Jetnity native app architecture`

## 8. Offene PRs / relevante Integration

Operativ relevant:

| PR | Klasse |
| --- | --- |
| **#129** AP-5 Gate 0 Account security capability | **DRAFT / AUDIT ONLY.** Branch `cursor/ap5-gate0-auth-session-mfa-79f9`. Issue #128. Keine Runtime. Kein Auth-Config-Push. |
| **#126** P2-TA-04 C1 Traveller write-contract integrity | **GEMERGT / INTEGRIERT.** Merge `5ed7edbd`. Issue #122 CLOSED / completed. Production C1 live als `20260828015304`. Historische/develop-only Evidence `20260828120000`. Kein C2. |
| **#120** P2-TA-04 Traveller Write-Path Gate 0 | **GEMERGT / INTEGRIERT.** Merge `8d8f3d57`. Issue #119 CLOSED / completed. Audit only; Residual C1 jetzt Issue #122. |
| **#117** P2-TA-03 Account Plan Reconciliation | **GEMERGT / INTEGRIERT.** Merge `b912315d`. Issue #116 CLOSED / completed. Kanonischer AP-5–AP-12-Plan liegt auf `main`. |
| **#113** P2-TA-06 Readiness Credential Normalization | **GEMERGT / INTEGRIERT.** Reviewed Head `928215a2`; Merge `286d26fe`; Issue #112 CLOSED / completed. |
| **#106** TW7-A Runtime Issue #103 | **INTEGRIERT.** Integrationsvehikel. Issue #103 ist CLOSED / completed. Ältere „Draft / nicht auf main“-Zeilen sind Pre-Merge-Evidence. |
| **#102** Admin AAL2 production apply gate closure | **GEMERGT.** Historische Start-Baseline von TW7-A war `963186f4`. Apply von `20260827170000` ausgeführt und verifiziert, exakt einmal. |
| **#100** TW-7-Gap / ADR-0176 / TW7-A-Spec | **VERSIONIERT bzw. nach Landung integriert.** Spec bleibt bindend. Runtime folgt über PR #106. |
| **#98** Admin AAL2 Production Alignment | **GEMERGT.** Merge `beaef64a`. Historische Alignment-Linie vor PR #102. |
| **#97** TL live reconstruction + AAL2 production gate | **GEMERGT.** Merge `4362502b`. |
| **#96** Post-PR-#94 Continuity | **INTEGRIERT / GESCHLOSSEN.** Merge `45be14b1`. |
| **#95** PR94 new-chat checkpoint | **GEMERGT.** Nur `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`. Merge `943d14c2`. |
| **#94** Visitor Search UX | **GEMERGT.** Reviewed Head `8da869fd`. Merge `819715b1`. |
| **#87** TW6-B Runtime + Mode Contract | **GEMERGT.** Checkpoint `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`. |
| **#88** Project Sanitation Audit | Non-destructive Audit-Evidence. Kein Cleanup automatisch. |
| #52 ChatGPT TL handoff 2026-08-24 | HISTORICAL / SUPERSEDED |
| #50 S1 merged-status docs | HISTORICAL / INTEGRATED ELSEWHERE |
| #40 Admin Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #39 Account Platform Audit | **HISTORICAL EVIDENCE ONLY.** Enthält die alte `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`. Nicht als Current Truth mergen. P2-TA-03 ersetzt den Steuerungsvertrag auf #117. |
| #28 Trip Collaboration Foundation | HISTORICAL / SUPERSEDED / DO NOT RESUME |

PR #89 und PR #91 sind gemergt und keine aktiven Drafts mehr.

Historische Evidence nicht löschen. Nicht als aktuelle Runtime-Arbeit wieder aufnehmen.

## 9. Supabase / Production

Production ist live `ACTIVE_HEALTHY`.

Production Gate A bleibt PASS. Technical-Lead Re-Review vom 27. August 2026 (PR #87, Review `5039338077`): **Production Gate B ist operativ PASS.** Der Vier-Datei-Vertrag `20260826220000 → 20260826230000 → 20260826240000 → 20260827010000` wurde unter Write-Gate transaktional angewendet und post-verifiziert.

Production-AAL2 `20260827170000_admin_aal2_data_plane_alignment` ist über PR #102 angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Ältere Sätze „AAL2-Versionen bleiben ausgeschlossen“ beziehen sich auf die historischen Dateien `20260826090000` / `20260826052735`, nicht auf den ausgeführten Alignment-Apply.

Frühere Absätze in älteren Checkpoints, die „Production Gate B nicht angewendet“ sagten, sind **historische Evidence** vor diesem Apply.

PR #94, PR #113 und dieses Continuity-Update schreiben Production nicht.

Weiterhin nicht angewendet:

- historische AAL2-Datei `20260826090000`
- Development-AAL2-Version `20260826052735`

Production `20260827170000` ist angewendet und verifiziert, exakt einmal. Kein zweiter Apply.

Production C1 `20260828015304_traveller_write_contract_integrity` ist unter der bestehenden Product-Owner-C1-Freigabe (Issue #122) vom Technical Lead angewendet und live verifiziert. Kein erneuter Apply. Die historische/develop-only Author-Version `20260828120000` bleibt Develop-Evidence derselben SQL und wird nicht still umgeschrieben.

## 10. Nächster Schritt

AP-5 Gate 0 ist der aktuelle Account-Architecture-Slice (Issue #128). P2-TA-04 C1 bleibt integriert (PR #126); Issue #122 ist CLOSED / completed. Unabhängiger Technical-Lead-Finalreview des Gate-0-Draft-PR steht aus. Kein Ready, kein Merge, keine AP-5-Runtime, kein C2, kein Auth-Config-Push.

P2-TA-03 bleibt integriert (PR #117); Issue #116 ist CLOSED / completed.

P2-TA-06 bleibt integriert (PR #113); Issue #112 ist CLOSED / completed.

**Kein automatischer Folgeslice.** Vor jeder neuen Runtime-Arbeit: aktuelles `main`, offene PRs/Issues, Binding Build Order, Account/Traveller-, Provider-, Admin-, Growth- und QS-Gates live neu prüfen und erst danach eine frische Task/Spec vergeben.

Kein weiterer Production-Write aus diesem Abschluss. Keine Direction A. Kein TW-8/9. Kein AP-5/AP-7 automatisch. Issue #109/#110 bleiben dokumentierte separate Themen und werden nicht durch diesen Merge automatisch gestartet. Kein zweiter AAL2-Apply. Live-`main` immer live prüfen.

PR #95 zeichnet einen Product-Owner-Wunsch auf: Homepage-Hero-Design bleibt, die Funktion im bestehenden Kästchen soll später natürliche Mehrziel-/Route-Absicht verstehen. Das bleibt **kein** Startauftrag und ist nicht TW7-A.
