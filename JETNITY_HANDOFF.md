# Jetnity – Handoff und nächste Schritte

Stand: 27. August 2026  
Status: **PR #91 / TW6-B Gate 0B ist integriert. Production Gate A ist vollständig PASS. Production Gate B bleibt NICHT freigegeben und NICHT angewendet. PR #87 bleibt Draft und muss gegen den neuen `main` neu synchronisiert, rekonstruiert und re-gegatet werden.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`.  
Aktuelle operative Evidence zusätzlich: `docs/CHATGPT_PR91_GATE0B_POST_MERGE_CHECKPOINT_2026-08-27.md`, `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md` und `docs/ACTIVE_WORK_STATUS.md`.

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

Verifizierter Integrationsstand nach PR #91:

- PR #91 – `TW6-B Gate 0B: Zero-Stage Production Rollout Provenance`
- PR-#91 Exact Head: `1da3ae0a01c6d5bb1f2325a2ca528922823c9611`
- PR-#91 Exact-Head GitHub Actions Run `33031870276`: SUCCESS
- PR-#91 Exact-Head Vercel `dpl_9QJSE9UeQNfehoLjdEa3PPXfyvLs`: READY
- Merge-Commit auf `main`: `a2e46f38dcfbbea286e37960c7993adbbd06136a`
- Post-Merge `main` GitHub Actions Run `33053499406`: SUCCESS
- Post-Merge Vercel Production `dpl_2UjcAyoJ3D4Puuqehu3izDtcXDtj`: READY auf exakt dem Merge-SHA

PR #89 / Gate 0 bleibt Teil der Vorgeschichte; PR #91 ergänzt den notwendigen vierten Zero-Stage-Schritt.

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

## 5. Explizit NICHT auf Production

Nicht freigegeben und nicht angewendet:

- TW6-B `20260826220000`
- TW6-B `20260826230000`
- TW6-B `20260826240000`
- TW6-B `20260827010000`
- AAL2 Repo-Version `20260826090000`
- Development-AAL2-Version `20260826052735`
- Direction A
- andere Production-Migrationen

Post-PR-#91 read-only erneut verifiziert: Gate-A-Count = 2, TW6-B-Count = 0, weder `day_stage_assignment_source` noch `day_stage_assignment_mode` auf Production, Guard-Trigger vorhanden/enabled.

**Gate 0 / Gate 0B ≠ Production Gate B.**

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

PR #87 (`feat/tw6-rest-progressive-stages`) bleibt Draft. Er enthält Runtime-/UI-Arbeit für progressive weitere Ziele / Day→Stage Mode Contract und wurde durch PR #91 bewusst nicht mit Rollout-Code vermischt.

Nach dem Gate-0B-Merge gilt zwingend:

1. aktuellen `main` live lesen;
2. PR-#87-Head live lesen;
3. PR #87 scope-sicher gegen den neuen `main` synchronisieren bzw. Drift korrigieren;
4. Merge-Base/Ahead/Behind neu bestimmen;
5. echten aktuellen Diff prüfen;
6. Shared Contracts sowie Multi-Ziel-/Zero-Stage-/Commercial-Truth-Semantik erneut prüfen;
7. Exact-Head GitHub Actions + Vercel neu verlangen;
8. Production-Zustand erneut verifizieren;
9. erst bei neuem unabhängigem PASS über Runtime-Merge entscheiden.

Kein alter PASS darf als aktuelle Merge- oder Production-Freigabe verwendet werden.

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

Offen:

- TW6-B Runtime / progressive Ziele / Day→Stage Mode Contract via PR #87
- Production Gate B separat

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

- PR #87 – TW6-B Runtime-Draft; jetzt nach PR #91 neu synchronisieren/re-reviewen
- PR #88 – Project Sanitation Audit; non-destructive Evidence, kein Cleanup automatisch

Historische offene Drafts wie #52, #50, #40, #39, #28 bleiben Evidence und werden nicht blind wieder aufgenommen oder gelöscht.

PR #89 und PR #91 sind gemergt und keine aktiven Drafts mehr.

## 15. Exakter nächster Technical-Lead-Schritt

**PR #87 gegen den neuen `main` nach PR #91 vollständig neu synchronisieren, live rekonstruieren und unabhängig re-reviewen.**

Wenn nötig: scope-sichere Synchronisierung/Korrektur durch `Cursor-Agent: Trip workspace audit architecture`, danach neuer Exact Head, neue CI/Vercel-Evidence und erneuter unabhängiger PASS.

Erst wenn dieser Stand wieder PASS ist, darf der Product Owner separat um Freigabe für Production Gate B gebeten werden.

Bis dahin:

**Kein Gate B. Kein AAL2. Kein Direction A. Kein PR-#87-Merge ohne neuen PASS. Kein TW-7/8/9-Folgeslice.**

## 16. Continuity

Kein wesentlicher Fortschritt darf nur im Chat existieren. Neue Chats und Agenten lesen zuerst die kanonischen Dateien und rekonstruieren danach Live-Evidence. Screenshots, ältere SHAs und alte PR-Bodies sind nur historische Evidence.
