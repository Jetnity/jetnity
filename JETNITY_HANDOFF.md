# Jetnity – Handoff und nächste Schritte

Stand: 27. August 2026  
Status: **PR #91 / TW6-B Gate 0B ist integriert. Production Gate A ist vollständig PASS. Production Gate B ist laut Technical-Lead Re-Review vom 27. August 2026 operativ PASS. PR #87, PR #94 und PR #95 sind gemergt. Visitor Search UX ist integriert. Draft PR #96 aktualisiert die kanonischen Handoff-Dateien. Kein offener Visitor-Search-Implementation-Draft. Frühere Aussagen „PR #94 bleibt Draft“ bzw. „PR #87 bleibt Draft“ sind historische Evidence.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`.  
Aktuelle operative Evidence zusätzlich: `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`, `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md`, `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`, `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`, `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md` und `docs/ACTIVE_WORK_STATUS.md`.

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
- `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_TL_POST_PR94_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`
- `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`
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

Verifizierter Integrationsstand nach PR #95 / PR #94:

- Aktuelles `origin/main`: `943d14c27a01b4c783340c658c911434fcc62b27` (Merge PR #95)
- PR #95 – docs-only New-Chat-Checkpoint; ändert keine kanonischen Handoff-Statuszeilen
- PR #94 – `Visitor Search UX: natürliche Orts- und Flughafennamen`
- PR-#94 Exact Head: `8da869fd2756f3c1514de6d33678c8c7abfad1c4`
- Technical-Lead PASS review: `5040199350`
- PR-#94 Exact-Head GitHub Actions Run `33066516282`: SUCCESS
- PR-#94 Exact-Head Vercel Preview `CBuVobvymHT9m7A4uUKmb2exU4PU`: SUCCESS
- PR-#94 Merge-Commit auf `main`: `819715b1567417893d894b7b110eff1a2ab6cded`
- Post-Merge `main` GitHub Actions Run `33067498607`: SUCCESS
- Post-Merge Vercel `GrD4MaYqtnR9UL619gVnKx9HSUmH`: SUCCESS auf exakt dem Merge-SHA
- GitHub Production deployment `6121770601`: SUCCESS auf demselben SHA

PR #87, PR #89 und PR #91 bleiben Teil der Vorgeschichte. Aussagen in älteren Checkpoints, PR #87 bleibe Draft oder Production Gate B sei unangewendet, sind historische Evidence.

`main` Branch Protection ist weiterhin live deaktiviert (`protected=false`) und bleibt Governance-Risiko.

## 4. Production Gate A – PASS

Product Owner hat am 27. August 2026 ausschließlich diese Production-Reihenfolge freigegeben:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard`

Beide Schritte wurden ausgeführt und unabhängig semantisch verifiziert.

Production-History enthält kanonisch:

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
- Production-Projekt `ACTIVE_HEALTHY`.

Vollständige Evidence: `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`.

## 5. Production nach Gate B

Technical-Lead Re-Review vom 27. August 2026: **Production Gate B ist operativ PASS.** Der Vier-Datei-Vertrag `20260826220000 → 20260826230000 → 20260826240000 → 20260827010000` wurde unter Write-Gate angewendet. Der vorherige Post-PR-#91-Stand (TW6-B-Count = 0, keine Mode-Spalte) ist historische Evidence.

Weiterhin nicht angewendet:

- AAL2 Repo-Version `20260826090000`
- Development-AAL2-Version `20260826052735`
- Direction A
- andere nicht freigegebene Production-Migrationen

Dieser Runtime-Slice schreibt Production nicht erneut.

## 6. TW6-B Gate 0B / Vier-Datei-Vertrag

Durch PR #91 liegt jetzt der migrations-/rollout-only Vier-Datei-Vertrag auf `main`:

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

Alle vier Dateien gehören unter denselben bounded Write-Gate-/Transaktionsvertrag. `db:anwenden` darf sie nicht dateiweise ausspielen. Final Verify verlangt insbesondere:

- 0 Stages → fail-closed (`22023`), kein `single_destination`;
- `single_destination` nur bei genau einer Stage;
- kein neuer `legacy_fallback`;
- Commercial-Gate-A-Nullung bleibt erhalten;
- Guard-Trigger bleibt enabled;
- genau vier Gate-B-Versionen in `schema_migrations`.

Development `yfvbxvijcorffwxbxahl` enthält bereits alle vier Versionen. Dort nicht erneut blind anwenden.

## 7. TW6-B / PR #87

PR #87 (`feat/tw6-rest-progressive-stages`) ist gemergt. Reviewed Head `7ef201fb`. Merge-Commit `80bbde69`. Checkpoint: `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`.

Der Workspace zeigt den Persistenzdefault `balanced` nicht als Nutzerwahl. Kein alter PASS darf als aktuelle Merge- oder Production-Freigabe verwendet werden.

## 8. Trip Workspace

Integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW6-A Create-Entry ✅
- TW6-B Gate 0 / Provenance ✅
- TW6-B Gate 0B / Zero-Stage Rollout Provenance ✅
- TW6-B Runtime / progressive Ziele / Day→Stage Mode Contract via PR #87 ✅
- Visitor Search UX via PR #94 ✅

Production Gate B ist laut Technical-Lead Re-Review vom 27. August 2026 operativ PASS und kein offener Apply-Auftrag dieses Continuity-Blocks.

TW-7 bleibt hinter Account-/Hub-Grenzen. TW-8 bleibt hinter Provider S5 und realer Commercial Provenance.

## 9. Traveller / Account

Verbindliche Traveller-Wahrheit:

> Ein Traveller → mehrere Staatsbürgerschaften → mehrere Dokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Issuer Country ≠ Citizenship.

Weiter offen u. a.:

- P2-TA-06 `documents[0]` Residual;
- Account-Traveller-Registry / AP-Folgeslices;
- historische Account-Plan-Evidence aus PR #39.

## 10. Provider / Commercial Provenance

S1–S3 und S5-A sind integriert. S5-B nicht gestartet.

Keine echten Provider, keine Secrets/Verträge/paid calls, keine Provider-Live-Aktivierung durch Gate A oder Gate 0B.

TW-8 bleibt gegated.

## 11. Admin AAL2

Application-Guard ist im Code integriert.

Production-AAL2-Datenebene bleibt **nicht angewendet**. Gate A und Gate 0B haben AAL2 nicht verändert.

## 12. D0 / Growth

D0-1, D0-2 und P1-D0-LIVE-01 sind integriert.

- Canonical `https://jetnity.com`
- `*.vercel.app` niemals kanonisch
- robots fail-closed
- Default noindex/nofollow
- kein Domain-Cutover
- kein Public Indexing

Offen bleiben u. a. D0-P1-03 Legal-404 und spätere D0/G0-Reste. Kein D1/G1 automatisch starten.

## 13. Quality / Security / Sanitation

Separate Security-/Performance-Funde bleiben eigene QS-Arbeit.

Project-Sanitation-Audit PR #88 bleibt non-destructive Evidence. Kein Cleanup, Branch-Delete, Supabase-Delete, Vercel-Delete oder Cloud-Decommission automatisch ausführen.

Supabase-Inventur zeigt weiterhin zwei Top-Level-Projekte: das aktive Production-Elternprojekt `qscbgcdmivbbnzrcyegn` (`Jetnity's Project`) und das alte/weitere Projekt `jrixsujkzvlvglvcmtia` (`jetnity-bets`). Eine Decommission-Entscheidung bleibt separat Product-Owner-gated.

## 14. Offene PRs / historische Evidence

Operativ relevant:

- PR #96 – Post-PR-#94 Continuity, docs-only Draft; aktualisiert kanonische Handoff-Dateien nach PR #94/#95
- PR #95 – gemergt; New-Chat-Checkpoint `docs/CHATGPT_PR94_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- PR #94 – gemergt; Visitor Search UX integriert
- PR #88 – Project Sanitation Audit; non-destructive Evidence, kein Cleanup automatisch
- PR #87 – gemergt; Checkpoint `docs/CHATGPT_TL_POST_PR87_CHECKPOINT_2026-08-27.md`

Historische offene Drafts wie #52, #50, #40, #39, #28 bleiben Evidence und werden nicht blind wieder aufgenommen oder gelöscht.

PR #89 und PR #91 sind gemergt und keine aktiven Drafts mehr.

## 15. Exakter nächster Technical-Lead-Schritt

**Unabhängiger Review des Post-PR-#94-Continuity-Drafts (docs-only) nach Exact-Head-Gates.**

Visitor Search UX ist integriert. Es gibt keinen offenen Implementation-Draft für diese Suche. Der nächste Produktslice braucht eine neue Technical-Lead- oder Product-Owner-Zuweisung.

Production Gate B ist laut Technical-Lead Re-Review vom 27. August 2026 operativ PASS. Die frühere Anweisung, zuerst um Gate-B-Freigabe zu bitten, ist historische Evidence.

Bis dahin:

**Kein Ready. Kein Merge ohne neuen PASS. Kein AAL2. Kein Direction A. Kein TW-7/8/9-Folgeslice. Kein weiterer Production-Write. Kein automatischer Visitor-Search- oder Produkt-Folgeslice.**

## 16. Continuity

Kein wesentlicher Fortschritt darf nur im Chat existieren. Neue Chats und Agenten lesen zuerst die kanonischen Dateien und rekonstruieren danach Live-Evidence. Screenshots, ältere SHAs und alte PR-Bodies sind nur historische Evidence.
