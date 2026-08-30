# Jetnity – Handoff und nächste Schritte

Stand: 30. August 2026  
Status: **CURRENT HANDOFF / FINAL CHAT TRANSITION / NO ACTIVE RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

Vollständiger aktueller Technical-Lead-Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_FINAL.md`

Direkter New-Chat-Startprompt:

`docs/CHATGPT_NEW_CHAT_START_PROMPT_2026-08-30_FINAL.md`

Verbindlicher Precheck:

`docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`

## 1. Aktueller technischer Übergabestand

Pre-Transition-`main`:

`498abfd26e584dcd40e59f4266e1bfc87828649f`

Der docs-only Transition-PR aus Issue #280 bewegt `main` danach weiter; der neue Chat muss den finalen SHA live verifizieren.

Auf `498abfd...` bereits abgeschlossen/verifiziert:

- Core Repository Hygiene Audit vollständig integriert
- finaler Audit PASS-Head `a759764eefa568784bfa08029b386b978e1d2138`
- Recovery PR #279 gemergt
- Post-Merge CI #1395 / Run `33333229959` SUCCESS
- Vercel SUCCESS
- Issue #273 completed

Letzte große Produkt-Runtime-Feature-Baseline bleibt AP-10-S1:

`a4d9384e2583ae52733c87006cd578f7489cb656`

Der neuere `main` enthält danach Infrastruktur-, Cleanup-, Governance-, Audit- und Continuity-Arbeit. Nicht mit einer neuen Produktfunktion verwechseln.

## 2. GitHub Governance

`main` ist geschützt:

- Ruleset `Jetnity main protection`
- ID `21875372`
- Enforcement active
- Target `main`
- Bypass leer
- PR vor Merge Pflicht
- Required approvals `0`
- Conversation resolution Pflicht
- branch up to date Pflicht
- Required Checks: `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`
- nur Merge erlaubt
- Force Push und Branch-Löschung blockiert

Bekannter Connectorfehler: Draft→Ready kann an `Repository.fullDatabaseId` scheitern. Nicht Ruleset lockern. Bewährter Recovery-Transport: exakt derselbe TL-PASS-SHA → nicht-draft Recovery PR → frische Gates → Expected-Head-Lock-Merge.

Beim letzten Live-Check waren nur folgende historischen/future PRs offen:

- #52
- #50
- #40
- #39
- #28

Keine davon ist automatisch aktive Runtime-Arbeit.

Alte private GitHub-Repositories `jetnity-bets` und `jetnity-travel` wurden nach Audit gelöscht. Connector sieht nur `Jetnity/jetnity`.

165 sicher gemergte Branch-Refs wurden fail-closed entfernt. Verbleibende ungemergte/unique-evidence Branches bleiben separate Hygiene.

## 3. Supabase

Production:

- `qscbgcdmivbbnzrcyegn`
- ACTIVE_HEALTHY

Development branch:

- `develop`
- project ref `yfvbxvijcorffwxbxahl`
- ACTIVE_HEALTHY

Alter eigenständiger Supabase `jetnity-bets`: permanent gelöscht.

### P1 Migration-History

**ABGESCHLOSSEN / REPARIERT.**

- PR #251 merged
- Merge `5ee8c7017180747bb29112f1c5a2cf3419fd062d`
- Production After-Image PASS
- Fresh replay PASS
- temporärer Replay-Branch gelöscht
- `20260829140000_trip_item_commercial_provenance` replaybar repariert
- keine S5-B-DDL erneut angewandt

Ältere Dokumente, die P1 als offen darstellen, sind superseded.

Development-Reconciliation/Drift bleibt ein eigener Live-Check vor migrationsnaher Arbeit.

### Creator / Storage Cleanup

Abgeschlossen:

- zehn alte leere Storage-Buckets entfernt
- 24 orphaned Legacy-Policies entfernt
- `creator-media` public→private gehärtet
- C2 private Recovery + echter Restore-Proof erfolgreich
- C3 Source-Objekte, Policies und Source-Bucket entfernt
- Migration `20260830183009_creator_media_c3_policy_decommission` integriert

Live Transition-Precheck:

- `creator-media` existiert nicht mehr
- `jetnity-legacy-recovery` privat
- genau 1 Objekt / 3,030,830 Bytes
- keine zugehörigen User-Policies
- Production Edge Functions 0

Recovery bleibt Production/Data-Gate.

## 4. Traveller / Account Current Truth

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

## 5. Core Repository Hygiene – Abschlussbefund

Authoritative Audit:

`docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`

Matrix:

`docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`

Kein aktueller Creator Hub / MediaStudio / Feed / Blog / Render Runtime-Rest.

Noch nicht umgesetzte `DELETE-CANDIDATE`:

- fünf getrackte `supabase/.temp/*` CLI-Dateien
- `supabase/.branches/_current_branch`
- `public/images/prague.jpg`

Bei späterer Bereinigung immer gekoppelt `lib/project-sanitation/closure-invariants.test.ts` aktualisieren.

Noch nicht umgesetzte `UPDATE-CANDIDATE`:

- alte V1 Image-Hosts in `next.config.js`
- `components.json` hooks alias ohne `hooks/`
- stale `zod` Checker-Exception
- `Mega Pro` Copy
- Tailwind `content/**` Glob
- Docs-Navigation/Pointer-Hygiene
- `.gitignore` Kommentar-Hygiene

Nicht mechanisch ändern:

- `/privacy` / `/terms` / CookieConsent → Legal/PO-Gate
- `creator` RBAC / `inhalte-moderieren` → Auth-Gate, falls Retirement vorgeschlagen
- Recovery Bucket → Production/Data-Gate
- unique-evidence Branches → separate Branch-Hygiene

Supabase-Migrationen und historische Evidence nicht allein wegen Alter löschen.

## 6. Produkt-Nordstern

> **Jetnity = Travel Operating System für die konkrete Reise.**

Pfeiler: **Planen / Entscheiden / Reisebereit sein.**

Leitfrage:

> **„Macht das Jetnity einzigartiger oder nur größer?“**

Doctrine:

`docs/JETNITY_PRODUCT_DIFFERENTIATION_DOCTRINE_2026-08-30.md`

## 7. PrivacyBee / Legal

PrivacyBee AG / `privacybee.io` ist Product-Owner-binding für die website-visible Privacy Layer.

Jetnity-Activation bleibt geparkt bis echte erreichbare `jetnity.com` Production existiert.

Current Gap aus Audit:

- realer Register-Flow verlinkt `/privacy`
- `/privacy` fehlt
- `/terms` fehlt
- `CookieConsent.tsx` ist unmounted und stale V1 Copy

Keine Legal-Copy erfinden und CookieConsent nicht still mounten.

## 8. Provider / Commercial Truth

Keine automatische Live-Aktivierung:

- keine Secrets/API-Keys
- keine paid calls
- keine Production Runtime Principal-/Writer-Öffnung
- keine Commercial-Truth-Claims ohne Evidence
- keine option-spezifische Visa/Entry Official Truth ohne echten Requirements-Provider

Requirements/Travel Readiness Provider Groundwork bleibt strategisch sinnvoll, aber Live-/Commercial-Gates bleiben separat.

## 9. Besondere Product-Owner-Gates

Explizite Freigabe erforderlich vor:

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

## 10. Agentenstatus

Core-Hygiene-Agent `Jetnity core repository hygiene audit 1` ist **STOPPED / completed**.

Kein Cursor-Agent soll aus diesem Übergang automatisch weiterarbeiten. Ein neuer Agent entsteht erst nach neuem Binding Slice Precheck und bounded Task.

## 11. Empfohlene nächste Kandidaten – noch nicht freigegeben

1. kleiner mechanischer Hygiene-Slice: D-01/D-02/D-03 + gekoppelte Lock-Test-Aktualisierung;
2. optional separater Config-Hygiene-Slice;
3. danach nicht in Cleanup verharren, sondern zurück zum Produktkern: Requirements / Travel Readiness Provider Groundwork;
4. Legal Gap separat Product-Owner-/Legal-gated.

Der neue TL muss diese Reihenfolge gegen Live-Evidence und aktuelle Produktpriorität prüfen. Kein Folgeslice ist automatisch aktiv.

## 12. Pflicht im neuen Chat

Zuerst `JETNITY_START_HERE.md` und `docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_FINAL.md` vollständig lesen. Danach Live-Precheck durchführen und erst dann handeln.

**Live-Evidence gewinnt immer.**