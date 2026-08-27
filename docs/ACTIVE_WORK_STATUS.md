# Jetnity – Active Work Status

Stand: 27. August 2026  
Status: **Production Gate A ist PASS. Production Gate B ist operativ PASS. PR #87, PR #94, PR #95, PR #96, PR #97 und PR #98 sind integriert. Visitor Search UX ist integriert. `TW6-REST-01` ist geschlossen. PR #98 Alignment liegt auf `main`; Production-AAL2-Apply bleibt eigenes Gate. TW-7-Gap / ADR-0176 / TW7-A-Spec sind durch PR #100 versioniert bzw. nach Landung integriert; TW7-A Runtime ist nicht gestartet. Frühere Aussagen „PR #100 bleibt Draft / nicht gemergt“ sind historische Evidence.**

> **Do not blindly trust this file — live verify first.**

## 0. Live-Integrationsbaseline

Aktueller verifizierter `origin/main` nach PR #98:

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

TW-7-Start-Gate ist gegen `beaef64a` erneut geprüft und erfüllt. Hub-Code unverändert seit `84f54194`. Der Weg ist bereits einer. Der verbleibende Gap ist die Mehrziel-Kartenidentität plus Gast-`itemCount`, nicht AP-3. Spec: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`. **Keine TW-7-Runtime in diesem Stand.** TW-8 bleibt hinter Provider S5 **und** realer Commercial Provenance; S5-A allein ist kein TW-8-Start.

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

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Aktivierung durch Gate A/Gate 0B/PR #94.

Gates:

- **TW8-START-GATE:** Kein TW-8 ohne belastbaren S5-Vertrag **und** spätere Provenance-/Persistenz-Reife. S5-A allein reicht nicht.
- **PROVIDER-ACTIVATION-GATE:** persistenter Cost Guard vor bezahlter/Production-Aktivierung.
- Persistierte kommerzielle Beträge ohne belegten Zeitpunkt bleiben `unknown`/`stale`.

## 6. QS / Admin AAL2 / Sanitation

Admin-AAL2 Application-Guard ist im Code integriert. Development enthält `admin_aal2_data_plane`; **Production-Datenebene ist weiterhin nicht angewendet**.

Separate Supabase Security-/Performance-Advisors bleiben eigene QS-Arbeit. Keine dieser separaten Baustellen wurde durch PR #94 still verändert.

Project-Sanitation-Audit PR #88 bleibt non-destructive Evidence. Kein Cleanup/Branch-/Cloud-Delete automatisch ausführen.

Live Supabase-Inventur zeigt:

- Production-Elternprojekt `qscbgcdmivbbnzrcyegn` (`Jetnity's Project`) – ACTIVE_HEALTHY
- Development-Branch `[REDACTED]`
- weiteres Top-Level-Projekt `jrixsujkzvlvglvcmtia` (`jetnity-bets`) – Decommission bleibt separate Product-Owner-Entscheidung

## 7. Aktive / nächste Cursor-Workstreams

Kein offener TW-7-Produktdocs-Draft als operative nächste Arbeit.

- **PR #100** versioniert TW-7-Gap / ADR-0176 / TW7-A-Spec. Nach Landung integriert. **TW7-A Runtime ist nicht gestartet.** Integrationsvehikel; Live-Merge-SHA prüfen.
- Historische Pre-Merge-Evidence, kein aktueller Draft-Status: Head `2aa573f1` Actions `33087982878` SUCCESS, Vercel `DUzQZnDEY2TBdP1rwoZFPs2bzFsA` SUCCESS; späterer Stamp-Head `2abe79b4` Actions `33088507998` SUCCESS, Vercel `8NJVH46dzhrvUur8raAGukyiyzcL` SUCCESS.

PR #98 ist integriert. Production-AAL2-Apply bleibt ein getrenntes Product-Owner-Gate.

PR #96 bleibt integriert/geschlossen. Historisch Draft auf `cursor/pr94-continuity-b13d`; das ist keine operative nächste Arbeit.

Kein automatischer Produkt-Folgeslice über diese Docs hinaus.

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
| **#100** TW-7-Gap / ADR-0176 / TW7-A-Spec | **VERSIONIERT bzw. nach Landung integriert.** TW7-A Runtime nicht gestartet. Integrationsvehikel; Live-Merge-SHA prüfen. Frühere „Draft / nicht gemergt“-Zeilen sind historische Pre-Merge-Evidence. |
| **#98** Admin AAL2 Production Alignment | **GEMERGT.** Merge `beaef64a`. Alignment-Datei auf `main`. Production-Apply bleibt eigenes Product-Owner-Gate. |
| **#97** TL live reconstruction + AAL2 production gate | **GEMERGT.** Merge `4362502b`. |
| **#96** Post-PR-#94 Continuity | **INTEGRIERT / GESCHLOSSEN.** Merge `45be14b1`. |
| **#95** PR94 new-chat checkpoint | **GEMERGT.** Nur `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`. Merge `943d14c2`. |
| **#94** Visitor Search UX | **GEMERGT.** Reviewed Head `8da869fd`. Merge `819715b1`. |
| **#87** TW6-B Runtime + Mode Contract | **GEMERGT.** Checkpoint `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`. |
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

Production Gate A bleibt PASS. Technical-Lead Re-Review vom 27. August 2026 (PR #87, Review `5039338077`): **Production Gate B ist operativ PASS.** Der Vier-Datei-Vertrag `20260826220000 → 20260826230000 → 20260826240000 → 20260827010000` wurde unter Write-Gate transaktional angewendet und post-verifiziert. AAL2-Versionen bleiben ausgeschlossen.

Frühere Absätze in älteren Checkpoints, die „Production Gate B nicht angewendet“ sagten, sind **historische Evidence** vor diesem Apply.

PR #94 und dieses Continuity-Update schreiben Production nicht.

Weiterhin nicht angewendet:

- AAL2 `20260826090000`
- Development-AAL2-Version `20260826052735`

## 10. Nächster Schritt

TW-7-Gap / ADR-0176 / TW7-A-Spec sind durch PR #100 versioniert. TW7-A Runtime ist nicht gestartet.

PR #98 ist integriert. Production-AAL2-Apply bleibt ein separates Product-Owner-Gate.

Kein weiterer Production-Write. Keine Direction A. Kein TW-8/9. Kein AP-4. Kein automatischer TW7-A-Start.

PR #95 zeichnet einen Product-Owner-Wunsch auf: Homepage-Hero-Design bleibt, die Funktion im bestehenden Kästchen soll später natürliche Mehrziel-/Route-Absicht verstehen. Das bleibt **kein** Startauftrag und ist nicht TW7-A.
