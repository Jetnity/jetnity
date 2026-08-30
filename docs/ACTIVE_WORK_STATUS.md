# Jetnity – Active Work Status

Stand: 30. August 2026  
Status: **CURRENT / FINAL CHAT TRANSITION / NO ACTIVE RUNTIME SLICE / NO ACTIVE CURSOR IMPLEMENTATION / LIVE-EVIDENCE GEWINNT**

Vollständiger Checkpoint:

`docs/CHATGPT_TECHNICAL_LEAD_CHECKPOINT_2026-08-30_FINAL.md`

New-Chat-Prompt:

`docs/CHATGPT_NEW_CHAT_START_PROMPT_2026-08-30_FINAL.md`

## 1. Current Main / letzter Abschluss

Pre-Transition-`main`:

`498abfd26e584dcd40e59f4266e1bfc87828649f`

Darauf bereits abgeschlossen:

- Core Repository Hygiene Audit
- Recovery PR #279 MERGED
- finaler Audit PASS-Head `a759764eefa568784bfa08029b386b978e1d2138`
- Post-Merge CI #1395 / `33333229959` SUCCESS
- Vercel SUCCESS
- Issue #273 CLOSED / completed

Der docs-only Transition-PR aus Issue #280 bewegt `main` danach weiter. Finalen SHA live lesen.

**Kein Produkt-/Runtime-Slice ist aktiv oder automatisch freigegeben.**

## 2. GitHub

- einziges aktuelles Repository: `Jetnity/jetnity`
- alte `jetnity-bets` / `jetnity-travel` GitHub-Repositories gelöscht
- `main protected=true`
- Ruleset `Jetnity main protection` / ID `21875372` / active
- Required checks: `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`
- PR + up-to-date + conversation resolution Pflicht
- nur Merge; Force Push / deletion blockiert; Bypass leer

Letzter Live-Check offene historische/future PRs:

- #52
- #50
- #40
- #39
- #28

Keine davon als aktive Runtime-Arbeit behandeln.

165 sicher gemergte alte Branch-Refs wurden bereits entfernt. Weitere ungemergte/unique-evidence Branches nicht blind löschen.

## 3. Supabase

Production:

- `qscbgcdmivbbnzrcyegn` ACTIVE_HEALTHY

Development:

- `develop` / `yfvbxvijcorffwxbxahl` ACTIVE_HEALTHY

Alter eigenständiger Supabase `jetnity-bets`: gelöscht.

P1 `20260829140000_trip_item_commercial_provenance`: **REPARIERT** über PR #251 / Merge `5ee8c7017180747bb29112f1c5a2cf3419fd062d`, Production After-Image PASS + Fresh Replay PASS.

Production Migration-History enthält beim Transition-Precheck u. a. `20260829140000`, `20260829210052`, `20260830155711`, `20260830183009`.

Storage Cleanup:

- `creator-media`: entfernt
- `jetnity-legacy-recovery`: privat, 1 Objekt / 3,030,830 Bytes
- relevante Recovery/creator-media User-Policies: keine
- Edge Functions: 0

Recovery bleibt Production/Data-Gate.

## 4. Letzte Produkt-Runtime-Baseline

AP-10-S1 Confirmed Booking Folder:

`a4d9384e2583ae52733c87006cd578f7489cb656`

Integrierter Account-/Traveller-Reifegrad:

- Foundation E
- Multi-Citizenship / Multi-Document
- Issuer ≠ Citizenship
- Document↔Citizenship
- kein Default-/Primary-/Preferred-/Chosen-Pass
- Guest→Account Trip-Copy
- AP-5 Gate 0 + S1–S5 + AP-5-R1
- AP-7 Gate 0 + S1–S4
- TA-DL1
- AP-UX-NAV1
- TA-CUX1
- AP-10-S1

Dual Authority bleibt verbindlich: Account Registry = reusable facts; Trip Snapshot = konkrete Trip Current Truth.

## 5. Core Repository Hygiene – offene Kandidaten

Audit ist abgeschlossen, Cleanup noch nicht automatisch gestartet.

`DELETE-CANDIDATE`:

- fünf getrackte `supabase/.temp/*` CLI-Dateien
- `supabase/.branches/_current_branch`
- `public/images/prague.jpg`

Bei Umsetzung zwingend `lib/project-sanitation/closure-invariants.test.ts` gekoppelt aktualisieren.

`UPDATE-CANDIDATE`:

- zwei alte V1 Image-Hosts in `next.config.js`
- `components.json` hooks alias ohne `hooks/`
- stale `zod` Checker-Exception
- `Mega Pro` Copy
- Tailwind `content/**` Glob
- Docs-Navigation/Pointer-Hygiene
- `.gitignore` Kommentar-Hygiene

`BLOCKED/NEEDS-DECISION`:

- `/privacy` / `/terms` / stale unmounted CookieConsent → Legal/PO
- `creator` RBAC / `inhalte-moderieren` Retirement → Auth/PO
- Recovery Bucket → Production/Data
- Unique-evidence Branches → separate Branch-Hygiene

Alle Migrationen/historische Evidence vor age-only deletion schützen.

## 6. PrivacyBee / Legal

PrivacyBee AG / `privacybee.io` bleibt Product-Owner-binding. Jetnity-Activation bis echte erreichbare `jetnity.com` Production geparkt.

Audit bestätigte: Register verlinkt `/privacy`, aber `/privacy` und `/terms` fehlen; CookieConsent ist unmounted/stale. Kein stilles Mounting, keine erfundene Legal-Copy.

## 7. Provider / Product

Provider Live / Secrets / paid calls / Commercial Write / option-spezifische Official Requirements bleiben separate Gates.

Nach kleinem mechanischen Hygiene-Rest soll Jetnity nicht in endloser Cleanup-Arbeit stecken bleiben. Strategischer Kandidat: Requirements / Travel Readiness Provider Groundwork, unter den bestehenden Truth-/Provider-Gates.

## 8. Agentenstatus

`Jetnity core repository hygiene audit 1`: STOPPED / completed.

Aktiver Cursor-Implementierungsagent: **keiner**.

Keinen Agenten aus diesem Status automatisch starten.

## 9. Risiken / Gates

- P0: keine neue bekannte Blockade aus dem abgeschlossenen Audit.
- früheres P1 malformed Migration-History: **repariert**; Development-Reconciliation bleibt separat live zu prüfen.
- früheres P2 `main protected=false`: **repariert**; Ruleset active.
- Legal Gap `/privacy` / `/terms`: real, PO/Legal-gated.
- Production Recovery: bewusst retained, PO-gated.

Besondere Product-Owner-Gates aus Operating Standard bleiben vollständig bestehen, inklusive Kosten > USD 100/Monat.

## 10. FIRST NEXT ACTION

**Kein automatischer Folgeslice.**

Der nächste Chat/Technical Lead muss:

1. finalen `main` und Transition-Merge live prüfen;
2. CI/Vercel/Ruleset live verifizieren;
3. offene PRs/Issues/Branches und Agentenstatus prüfen;
4. bei DB/Security/Storage-Bezug Supabase live prüfen;
5. Docs-vs-Live-Widersprüche melden;
6. dann bounded nächste Kandidaten priorisieren;
7. Product-Owner-Gates vor betreffender Arbeit einholen.

**Live-Evidence gewinnt immer.**