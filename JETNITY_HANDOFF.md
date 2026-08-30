# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / POST-CLEANUP FINAL / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

Kanonischer Current-State-Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_POST_CLEANUP_FINAL.md`

Verbindlicher Precheck:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

## 1. Aktueller technischer Übergabestand

Pre-Handoff-Refresh-`main`:

`0f7d80fa48d958a8708af982806b99966289b2bd`

Darauf abgeschlossen/verifiziert:

- Core Repository Hygiene Audit
- letzter mechanischer Cleanup PR #283
- PR-Head `204511f552d58e246cd08fd8b724eb98edd4dc49`
- Merge `0f7d80fa48d958a8708af982806b99966289b2bd`
- Post-Merge CI #1399 / `33334863504` SUCCESS
- Vercel SUCCESS
- Issue #282 completed

Der docs-only Handoff-Refresh aus Issue #286 bewegt `main` danach weiter; finalen SHA live verifizieren.

Letzte große Produkt-Runtime-Feature-Baseline bleibt AP-10-S1:

`a4d9384e2583ae52733c87006cd578f7489cb656`

Der neuere `main` enthält Cleanup/Governance/Continuity-Arbeit, nicht automatisch eine neue Produktfunktion.

## 2. Legacy-/Old-Jetnity-Cleanup

Für die aktive Codebasis abgeschlossen:

- alte Creator Hub / MediaStudio / Feed / Blog / Render Runtime entfernt
- alte GitHub-Repositories `jetnity-bets` und `jetnity-travel` gelöscht
- alter eigenständiger Supabase `jetnity-bets` gelöscht
- zehn alte leere Storage-Buckets entfernt
- 24 orphaned Legacy-Policies entfernt
- `creator-media` nach Hardening + Backup + Restore-Proof entfernt
- 165 sicher gemergte alte Branch-Refs entfernt
- P1 Migration-History repariert und replay-verifiziert
- Core Repository Hygiene Audit abgeschlossen
- D-01/D-02/D-03 aus Audit vollständig erledigt:
  - fünf `supabase/.temp/*` Dateien entfernt/untracked
  - `supabase/.branches/_current_branch` entfernt
  - `public/images/prague.jpg` entfernt
  - `lib/project-sanitation/closure-invariants.test.ts` aktualisiert und auf Abwesenheit gedreht

Damit gibt es **keine bestätigten offenen mechanischen DELETE-CANDIDATEs** aus dem Core Audit mehr.

Bewusst erhaltene Migrationen, historische Evidence, Recovery-Material und Unique-Evidence-Branches sind kein Cleanup-Rückstand.

## 3. GitHub Governance

`main` ist geschützt:

- Ruleset `Jetnity main protection`
- ID `21875372`
- Enforcement active
- Target `main`
- Bypass leer
- PR-Pflicht
- Required approvals `0`
- Conversation resolution Pflicht
- branch up to date Pflicht
- Required Checks: `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`
- nur Merge erlaubt
- Force Push und Branch-Löschung blockiert

Bekannter Connectorfehler: Draft→Ready kann an `Repository.fullDatabaseId` scheitern. Das ist kein Jetnity-Fehler. Ruleset nicht lockern; dokumentierten Same-SHA-Recovery-Transport verwenden.

Historische/future PRs sind keine aktive Runtime-Arbeit und dürfen nicht age-only geschlossen werden.

## 4. Supabase

Production:

- `qscbgcdmivbbnzrcyegn` ACTIVE_HEALTHY

Development:

- `develop` / `yfvbxvijcorffwxbxahl` ACTIVE_HEALTHY

Alter eigenständiger Supabase `jetnity-bets`: gelöscht.

P1 Migration-History: **ABGESCHLOSSEN / REPARIERT**

- PR #251 merged
- Merge `5ee8c7017180747bb29112f1c5a2cf3419fd062d`
- Production After-Image PASS
- Fresh replay PASS
- temporärer Replay-Branch gelöscht
- `20260829140000_trip_item_commercial_provenance` replaybar repariert

Storage:

- `creator-media`: entfernt
- `jetnity-legacy-recovery`: privat, 1 Objekt / 3,030,830 Bytes
- keine zugehörigen User-Policies
- Production Edge Functions nach Cleanup: 0

Recovery bleibt Production/Data-Gate.

## 5. Traveller / Account Current Truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Integriert:

- Foundation E
- Multi-Citizenship / Multi-Document
- Issuer Country ≠ Citizenship
- Document↔Citizenship
- kein Default-/Primary-/Preferred-/Chosen-Pass
- Guest→Account Trip-Copy
- AP-5 Gate 0 + S1–S5 + AP-5-R1
- AP-7 Gate 0 + S1–S4
- TA-DL1
- AP-UX-NAV1
- TA-CUX1
- AP-10-S1 Confirmed Booking Folder

Keine Passnummern, Scans, MRZ, Biometrie, DOB oder Health-Daten im Kernmodell.

## 6. Verbleibende kleine Hygiene

Nur `UPDATE-CANDIDATE`, keine bestätigten mechanischen Delete-Reste:

- alte V1 Image-Hosts in `next.config.js`
- `components.json` hooks alias ohne `hooks/`
- stale `zod` Checker-Exception
- `Mega Pro` Copy
- Tailwind `content/**` Glob
- optionale Docs-/Kommentar-Hygiene

Diese sind keine Legacy-Blocker und müssen nicht zwingend vor weiterer Produktentwicklung erledigt werden.

Nicht mechanisch ändern:

- `/privacy` / `/terms` / CookieConsent → Legal/PO-Gate
- `creator` RBAC / `inhalte-moderieren` Retirement → Auth/PO-Gate
- Recovery Bucket → Production/Data-Gate
- Unique-evidence Branches → separate Branch-Hygiene

## 7. Produkt-Nordstern

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

Leitfrage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

## 8. PrivacyBee / Legal

PrivacyBee AG / `privacybee.io` ist Product-Owner-binding für die website-visible Privacy Layer.

Activation bleibt geparkt bis echte erreichbare `jetnity.com` Production existiert.

Current Gap:

- Register verlinkt `/privacy`
- `/privacy` fehlt
- `/terms` fehlt
- `CookieConsent.tsx` ist unmounted und stale

Keine Legal-Copy erfinden und CookieConsent nicht still mounten.

## 9. Provider / Commercial Truth

Weiterhin gated:

- Secrets/API-Keys
- paid calls
- Production Runtime Principal-/Writer-Öffnung
- Commercial Write
- Payments
- option-spezifische Visa/Entry Official Truth ohne echten Requirements-Provider

Requirements / Travel Readiness Provider Groundwork bleibt strategisch sinnvoll.

## 10. Besondere Product-Owner-Gates

Explizite Freigabe bzw. bestehende belegbare Freigabe erforderlich vor:

- destruktiven Production-Daten-/Schema-/RLS-Änderungen
- fundamentalen Auth/MFA/AAL-/Session-Änderungen
- materiellen Identity-/Ownership-Änderungen
- sensitiver Pass-/Dokument-/MRZ-/Biometrie-Speicherung
- sensibler externer Datenweitergabe
- Provider-Verträgen/Secrets/paid calls/Live-Aktivierung
- Commercial Write-Öffnung
- Payments
- Public Launch / Domain Cutover
- Branch-Protection-/Ruleset-Abschwächung
- fundamentaler Product-/Build-Order-Änderung
- Kosten > USD 100/Monat

## 11. Agentenstatus

Core-Hygiene-Agent `Jetnity core repository hygiene audit 1`: completed / stopped.

Aktiver Cursor-Implementierungsagent: **keiner**.

Keinen Agenten automatisch starten.

## 12. Nächste Kandidaten – noch nicht gestartet

Nach Live-Precheck priorisieren:

1. optional kleiner Config-Hygiene-Slice für verbleibende `UPDATE-CANDIDATE`;
2. strategisch wichtiger: zurück zum Produktkern, insbesondere Requirements / Travel Readiness Provider Groundwork;
3. Legal Gap separat Product-Owner-/Legal-gated.

Kein Folgeslice ist automatisch aktiv.

## 13. Pflicht im neuen Chat

Zuerst `JETNITY_START_HERE.md` und `docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_POST_CLEANUP_FINAL.md` vollständig lesen. Danach vollständigen Live-Precheck durchführen.

**Live-Evidence gewinnt immer.**