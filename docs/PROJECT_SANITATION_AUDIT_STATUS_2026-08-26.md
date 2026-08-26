# Jetnity – Project Sanitation Audit Status

Stand: 26. August 2026  
Cursor-Agent: `Jetnity quality security audit 2`  
Branch: `audit/project-sanitation-inventory-2026-08-26`  
Typ: AUDIT / INVENTORY / NON-DESTRUCTIVE  
Task: `docs/PROJECT_SANITATION_AUDIT_TASK_2026-08-26.md`  
Task-Commit: `0b599422d6c6990b5842ce028ccd19942e998580`

Status: **Inventur abgeschlossen. Nichts gelöscht, nichts archiviert, kein Cloud-Objekt verändert, kein Folgeslice gestartet.**

> **Do not blindly trust this file — live verify `origin/main`, PRs and Exact Head first.**

---

## 0. Live-Baseline bei Abschluss dieses Berichts

Rekonstruiert live am 26. August 2026, nicht aus Continuity-Erinnerung.

| Fakt | Live-Evidence |
| --- | --- |
| Repository | `Jetnity/jetnity` – einziges GitHub-Repo der Organisation `Jetnity` |
| `origin/main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Main-Message | `docs: make agent rotation standard mandatory for future chats` |
| Dieser Audit-Branch | `0b599422` + dieser Status-Commit |
| Merge-Base Audit ↔ `main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Ahead / Behind Audit ↔ `main` vor diesem Bericht | **1 / 0** (nur der Task-Commit) |
| Offene Runtime-Arbeit | **PR #87 / TW6-B** auf `feat/tw6-rest-progressive-stages` @ `001105721c0b716bf0c4079581fd002d72fde1eb` – Draft, MERGEABLE, **17 / 0** ahead/behind `main` |
| Weitere offene PRs | #52, #50, #40, #39, #28 – alle Draft, historisch / superseded / conflicting |
| Remote-Branches | **103** inkl. `main` |
| Git-Tags | `archive/jetnity-v1-main`, `archive/pre-1-1b-alt-ui`, `archive/pre-1-4b-legacy-datenbank` |
| `main` Branch Protection | **`protected=false`** – vorbestehendes Governance-Risiko, in diesem Slice nicht geändert |
| GitHub Issues offen | #20 Future Collaboration |
| Tracked Files | **1105** |
| Dieser Slice hat PR #87 **nicht** berührt | bestätigt: keine Runtime-/Shared-Contract-Datei von #87 geändert |

Continuity-Dateien auf `main` (`JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`) beschreiben noch den älteren Stand nach PR #86 (`38ec8be7`) und nennen PR #85 als offenen Draft. **Live-Evidence gewinnt:** PR #85 ist gemergt; aktuelles `main` ist `1d558ef5`; die aktive Runtime-Arbeit ist PR #87. Dieser Audit schreibt `docs/ACTIVE_WORK_STATUS.md` nicht um.

---

## 1. Auftrag und harte Grenzen

Nur Inventur und Klassifizierung.

In diesem Slice **nicht** geschehen:

- keine Datei gelöscht
- kein Branch gelöscht
- kein PR geschlossen
- kein Repository gelöscht
- kein Supabase-Projekt pausiert/gelöscht
- kein Vercel-Projekt verändert
- kein Secret rotiert oder entfernt
- keine Migration angewendet
- kein Runtime-Code wegen Aufräumwunsch geändert
- PR #87 nicht bearbeitet
- kein Folgeslice gestartet

Klassen:

| Klasse | Bedeutung |
| --- | --- |
| KEEP | aktiv und für das aktuelle Produkt / den aktuellen Betrieb nötig |
| KEEP-HISTORICAL | historische Evidence, bewusst behalten |
| ARCHIVE-CANDIDATE | später aus dem aktiven Navigationsraum nehmen, Inhalt behalten |
| DELETE-CANDIDATE | nachweislich generiert, dupliziert, temporär oder unreferenziert; Löschung erst nach TL-/PO-Freigabe |
| NEEDS-DECISION | nicht sicher klassifizierbar oder Unique Content ausserhalb von `main` |

Alter allein ist niemals Löschbeweis.

---

## 2. Parallelität zu PR #87 / TW6-B

PR #87 ändert 38 Dateien, darunter Shared Contracts:

- `lib/trips/schema.ts`, `lib/trips/gastspeicher.ts`, `lib/trips/aktionen.ts`, `lib/trips/abbildung.ts`, `lib/trips/timeline.ts`, `lib/trips/zuordnung.ts`
- neue `lib/trips/day-stage-*.ts`, `lib/trips/create-stages.ts`
- `types/supabase.ts`, `types/trips.ts`
- `supabase/migrations/20260826220000_*` bis `20260826240000_*`
- `scripts/db/sicherheit.mjs`
- `ARCHITECTURE.md`, `DECISIONS.md`
- Trip-Planner-/Workspace-UI

Dieser Audit ändert **nur** `docs/PROJECT_SANITATION_AUDIT_STATUS_2026-08-26.md`.  
Keine Überschneidung mit dem TW6-B-Diff.

---

## 3. Hygiene-Checks – ausgeführt und adversarial hinterfragt

Ausgeführt auf diesem Branch gegen denselben Codebestand wie `main` (kein Runtime-Diff):

| Check | Ergebnis | Live-Ausgabe |
| --- | --- | --- |
| `npm run check:dead` | **grün, Exit 0** | 308 Startpunkte, 733 erreichbar, 1 begründete Ausnahme `components/layout/CookieConsent.tsx` |
| `npm run check:exports` | **grün, Exit 0** | 622 Dateien, 0 Exporte ohne Aufrufer |
| `npm run check:deps` | **grün, Exit 0** | 11 dependencies / 2 geprüfte devDependencies ohne unbenutztes Paket |
| `npm run check:api-schutz` | **grün, Exit 0** | 12 Admin-Routen, alle `requireAdminApi()` |
| `npm run check:schema-bezug` | **grün, Exit 0** | 17 Tabellen/Views, 19 Funktionen in `types/supabase.ts` existieren |

Vollständige Konsole: Artefakt `hygiene_checks_2026-08-26.txt`.

### 3.1 Adversarial: was die Checks **nicht** beweisen

Grün heisst nicht „das Repository ist sauber“.

| Check | Lücke |
| --- | --- |
| `check:dead` | Folgt nur statische Importketten ab Next-Startpunkten + Tests. Prüft **nicht** `public/`, `scripts/` als Konsumenten von Assets, `supabase/`, Docs. Dynamische Imports mit Variablen fehlen. `CookieConsent` ist eine bewusst tote Datei mit V1-Falschaussage; die Ausnahme ist kein Unbedenklichkeitsbeweis. |
| `check:exports` | Namenssuche, nicht Importkette. Gleichnamige Strings/Typen können ungenutzte Exporte verdecken. `app/` und Typen sind ausgeschlossen. `types/supabase.ts` ist als generiert ausgenommen. |
| `check:deps` | Zählt Import **oder** npm-Skript. `OHNE_IMPORT` (Next/React/Tailwind/ESLint/Plugins) wird nicht inhaltlich geprüft. `zod` steht noch in `ABSICHTLICH` als „noch nicht importiert“, wird aber real genutzt – die Ausnahmeliste ist **veraltet**. `simple-swizzle` Override wird nicht als direkte Dep geprüft (korrekt, aber unsichtbar). Playwright-Browser-Binaries sind nicht Teil des Checks. |
| `check:api-schutz` | Nur `app/api/admin/**`. Nur String-Präsenz von `requireAdminApi()` plus grobes `if (!x.ok)`. Keine AAL2-/Ownership-/Payload-Prüfung. Nicht-Admin-APIs (`/api/flights/search` usw.) liegen ausserhalb. |
| `check:schema-bezug` | Nur `types/supabase.ts`, nicht Live-Production-Schema. Findet fehlende Strukturen, **nicht** ungenutzte Tabellen, nicht RLS, nicht Drift Development↔Production. PR #87 ändert genau diese Typen – der Check auf `main` sagt nichts über den TW6-B-Head. |

Zusätzlich ungedeckt durch die fünf Checks:

- getrackte Dateien, die in `.gitignore` stehen (`supabase/.temp/*`, `supabase/.branches/*`)
- unreferenzierte Binärassets (`public/images/prague.jpg`)
- Remote-Branches / offene historische PRs
- Cloud-Projekte ausserhalb des Repos
- historische Unique-Docs, die nur auf stale Branches liegen

---

## 4. KEEP – aktiv und nötig

Keine vollständige Dateiliste von 1100 Dateien. Hier die **operativ notwendigen Strukturen**, die nicht aufgeräumt werden dürfen.

| Objekt | Begründung |
| --- | --- |
| `app/(public)/` Kernrouten `/`, `/planen`, `/reisen`, `/login`, `/register` | Produktkern |
| `app/(public)/reisen/[tripId]` | Trip Workspace |
| `app/account/**` | Account AP-1–AP-3 |
| `app/(admin)/admin/**` inkl. ehrliche Platzhalter | Admin A–C plus bewusste Folgt-Flächen für D–K |
| `app/api/**` Search/Evaluate/Admin | Runtime-APIs; Admin hinter `requireAdminApi()` |
| `app/auth/**` | Auth-Callback / Passwort |
| `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `app/not-found.tsx`, `app/icon.svg` | Next-Verträge / D0-Grenze |
| `middleware.ts` | fail-closed Auth-Rand |
| `components/trips/**`, `components/account/**`, `components/auth/**`, `components/admin/**`, `components/layout/**` (ohne CookieConsent), `components/places/**`, `components/ui/**` | aktive UI |
| `lib/**` Domain-Module (trips, auth, readiness, flights, hotels, activities, mobility, rental-cars, route, safety, seasonal, seo, provider-ops, commercial-provenance, modell, …) | aktuelle Produktwahrheit |
| `types/supabase.ts`, `types/trips.ts` | Schema-/Trip-Vertrag; #87 ändert sie parallel – hier nicht anfassen |
| `supabase/migrations/**` | angewendete und versionierte Systemwahrheit; **nicht nach Alter löschen** |
| `supabase/config.toml` | Auth-als-Code |
| `scripts/db/**`, `scripts/auth/**`, `scripts/erreichbarkeit.mjs`, `scripts/exporte.mjs`, `scripts/pakete.mjs`, `scripts/api-schutz.mjs` | CI / Hygiene / DB-Governance |
| `scripts/*-ui-audit.mjs` + `lib/ui-audit/freigabe.ts` + `/ui-audit/*` | fail-closed Audit-Harness, Production immer 404 |
| `package.json`, `package-lock.json` | Build-Vertrag |
| `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `.eslintrc.json`, `vercel.json` | Toolchain |
| `.github/workflows/ci.yml` | Exact-Head-Gates |
| `.cursor/mcp.json`, `.cursor/rules/*.mdc` | Dev-Governance; MCP nur via ENV |
| `.env.example` | Platzhalter, keine Secrets |
| `.gitignore` | schliesst `.temp` bereits aus – das Ignore-Problem ist historisches Tracking |
| Kanonische Root-Docs (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `AGENTS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md`, `JETNITY_VISION.md`, `README.md`, aktuelle Standards) | Continuity / Governance |
| `docs/ACTIVE_WORK_STATUS.md` | zentrale Live-Statusdatei; dieser Agent ändert sie nicht |
| `public/images/{bali,lisbon,zermatt,amsterdam}.jpg`, `hero-bali.png` | Startseiten-Inspiration + OG |
| `styles/globals.css` | Design-Tokens |
| `check-jetnity-setup.ts` | `prebuild` / CI; Name „Mega Pro“ ist nur historisches Label |
| `next-env.d.ts` | von Next generiert, für TS nötig |
| GitHub-Repo `Jetnity/jetnity` | einziges Produkt-Repo |
| Vercel-Projekt `jetnity-app` (TL-Live-Evidence) | einziges verbundenes Webprojekt |
| Supabase `Jetnity's Project` / `qscbgcdmivbbnzrcyegn` | aktuelles Production-Projekt |
| Supabase Development-Branch `develop` | Development-/Migrationsarbeit |

Admin-Folgt-Seiten (`marketing`, `analytics`, `content`, `localization`, `settings`) sind **keine** toten Dateien. Sie sind ehrliche Platzhalter (`AdminFolgtSeite`) für den noch nicht gestarteten Admin-D–K-Slice.

---

## 5. KEEP-HISTORICAL – Evidence behalten

| Objekt | Begründung |
| --- | --- |
| Alle `supabase/migrations/*.sql` inkl. `20260817110000_legacy_entfernen.sql` | Applied/versionierte Wahrheit; Löschen nach Alter ist verboten |
| `DECISIONS.md` (4228 Zeilen) + `docs/ADR_*.md` | ADR-Evidence |
| Slice-TASK / STATUS / HANDOFF / SELF_REVIEW / TECHNICAL_LEAD_REVIEW | Review- und Merge-Evidence |
| `docs/CHATGPT_*CHECKPOINT*`, `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md` | Continuity-Evidence ihres Zeitpunkts |
| Production-Acceptance (`docs/PR3*_PRODUCTION_*`, Foundation-Acceptance) | Production-Gates |
| `docs/LEGACY_ENTFERNUNG.md`, `docs/DATENBANK.md` | dokumentierter V1→V2-Schnitt |
| Historische Preview-URLs `*.vercel.app` / `vercel.com/jetnity-e1b93c82/jetnity-app/...` in Docs | damalige Exact-Head-Evidence |
| Production-Ref `qscbgcdmivbbnzrcyegn` in Docs | aktuelle und historische Cloud-Evidence |
| Tags `archive/jetnity-v1-main`, `archive/pre-1-1b-alt-ui`, `archive/pre-1-4b-legacy-datenbank` | bewusste Archiv-Punkte vor destruktiven Schnitten |
| Gemergte PR-Bodies #1–#86 | GitHub bleibt Source of Truth der Integration |
| `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md` und Folgestände | D0/G0-Evidence; einzelne Aussagen sind superseded, die Datei bleibt |

Keine Massenverschiebung in diesem Slice.

---

## 6. ARCHIVE-CANDIDATE – später indexieren, nicht löschen

`docs/` hat **279** Dateien. Das ist Navigation, kein Ballastbeweis.

Namensmuster auf `docs/`:

| Muster | Anzahl |
| --- | --- |
| `*_TASK.md` | 51 |
| `*_REVIEW.md` | 43 |
| `*_STATUS.md` | 31 |
| `*_STANDARD.md` / `*_POLICY.md` | 13 / 13 |
| `*_SELF_REVIEW.md` | 12 |
| `*_AUDIT.md` | 11 |
| `*_HANDOFF.md` | 10 |
| `*_ACCEPTANCE.md` | 9 |
| `CURSOR_*` | 35 |
| `CHATGPT_*` | 5 |

Vorschlag für einen **späteren, non-destructive** Archive-/Index-Slice (nicht starten):

1. Eine Datei `docs/EVIDENCE_INDEX.md` anlegen.
2. Gruppen: Current/Canonical · Slice-Evidence · Checkpoints · Production-Acceptance · Superseded Continuity.
3. Dateien **nicht** verschieben, bis der Index steht und Technical Lead die Gruppen bestätigt.
4. Erst danach optional `docs/evidence/<jahr-monat>/` für klar superseded Continuity-Kopien.

Nicht in diesen Korb: kanonische Standards, `ACTIVE_WORK_STATUS.md`, aktuelle Slice-Tasks von offenen Workstreams, ADRs.

---

## 7. DELETE-CANDIDATE

Nur Kandidaten. **Keine Löschung in diesem Slice.**

| Objekt | Evidence | Risiko bei Löschung | Empfohlene spätere Aktion |
| --- | --- | --- | --- |
| `supabase/.temp/cli-latest` | CLI-Cache `v2.40.7`; seit Initial-Commit 15.07.2025 getrackt; `.gitignore` seit 03.09.2025 | gering; lokal neu erzeugbar | `git rm --cached` nach Freigabe |
| `supabase/.temp/gotrue-version` | `v2.176.1`; gleiches Tracking | gering | `git rm --cached` |
| `supabase/.temp/postgres-version` | `17.4.1.45` | gering | `git rm --cached` |
| `supabase/.temp/rest-version` | `v12.2.3` | gering | `git rm --cached` |
| `supabase/.temp/pooler-url` | kommentierte Pooler-URL mit Production-Ref und Platzhalterpasswort; siehe §11 | mittel: History bleibt; kein Live-Secret | `git rm --cached`; **kein History-Rewrite** |
| `supabase/.branches/_current_branch` | Inhalt `main`; `.gitignore` schliesst `supabase/.branches/` aus | gering | `git rm --cached` |
| `public/images/prague.jpg` (1.8 MB) | seit 02.09.2025 im Tree; **kein** Treffer in Code/Docs; Inspiration nutzt Bali/Lissabon/Zermatt/Amsterdam | gering; über Git wiederherstellbar | Datei nach Freigabe entfernen |
| ~83 gemergte Remote-Branches | Ancestor von `main` oder zugehöriger PR `MERGED` | gering, wenn SHA in GitHub/PR bleibt | Branch-Delete nach TL-Liste |
| Temp-/Duplikat-Branches gleicher SHA | siehe §9 | gering | Branch-Delete nach Freigabe |
| Geschlossene ungemergte Docs-PR-Branches #33/#36/#41/#42 | superseded Continuity-Versuche | gering, Unique Content prüfen | zuerst Unique-Docs prüfen, dann Branch-Delete |

Nicht DELETE-CANDIDATE nur weil alt: Migrationen, ADRs, Reviews, Acceptance, Archive-Tags, Admin-Platzhalter, UI-Audit-Harness, `CookieConsent` (Entscheidung offen).

---

## 8. NEEDS-DECISION

| Objekt | Warum unsicher | Empfehlung an TL / PO |
| --- | --- | --- |
| `components/layout/CookieConsent.tsx` | Bewusst unerreichbar; Text behauptet V1-„Views/Likes“-Messung und verlinkt `/privacy` (404). Bereits G0-P2-02. | Entfernen **oder** für echten Legal-Slice neu schreiben. Nicht still verdrahten. |
| `components.json` | shadcn-CLI-Artefakt; Alias `@/hooks` zeigt auf **nicht existierendes** Verzeichnis | Behalten, falls shadcn-CLI noch genutzt wird; sonst später entfernen |
| `next.config.js` `images.remotePatterns` für `oaidalleapiprodscus.blob.core.windows.net` und `jetnity.ai/static/avatars/**` | Kein Code-Treffer ausser der Config selbst. V1-Bildhosts. | Entfernen ist Runtime-Config. Eigener kleiner Slice, nicht mit Inventur mischen. |
| `check-jetnity-setup.ts` Label „Mega Pro“ | Operativ genutzt, Name historisch | Optional umbenennen/kommentieren; keine Funktion ändern |
| Offene historische PRs #52 #50 #40 #39 #28 | Draft, meist CONFLICTING; enthalten Unique Docs, die auf `main` fehlen | **Nicht schliessen/löschen**, bevor Unique Content bewertet ist |
| `chore/account-admin-team-prep` | 23 Commits / 9 Docs **nicht** auf `main` | Unique-Content-Review, dann archivieren oder gezielt nach `main` holen |
| `audit/account-platform` / PR #39 | enthält `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` – bekanntes P2-TA-03 | Inhalt sichern, bevor Branch weg darf |
| `audit/admin-platform` / PR #40 | enthält u. a. `ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md`, Permission-Matrix, Infomaniak-Notiz | Inhalt sichern |
| `docs/chatgpt-technical-lead-handoff-2026-08-24` / PR #52 | 67 Commits ahead, superseded durch spätere Continuity auf `main` | Unique-Files gegen `main` diffen, dann PR schliessen |
| `feat/trip-collaboration-foundation` / PR #28 / Issue #20 | 1 Datei `docs/CURSOR_TRIP_COLLABORATION_FOUNDATION.md`; Collaboration ist bewusst später | PR als SUPERSEDED belassen, Issue #20 bleibt Future |
| `jetnity-bets` / `jrixsujkzvlvglvcmtia` | **nicht** im Repo; nur TL-Live-Cloud-Evidence + dieser Task | Decommission ist PO-Gate; dieser Agent fasst Cloud nicht an |
| Docs-Navigation (279 Dateien) | unübersichtlich, aber Evidence | Index zuerst, keine Massenverschiebung |
| Branch Protection `protected=false` | Governance, kein Dateiproblem | Eigenes Engineering-Gate, nicht Sanitation-Delete |

---

## 9. Branch-Inventar

103 Remote-Heads. **Kein Branch gelöscht.**

Klassifikationsregeln:

- `ACTIVE` = aktuelles `main` oder laufender, nicht superseded Workstream
- `MERGED` = Commit ist Ancestor von `main` **oder** zugehöriger PR ist `MERGED`
- `SUPERSEDED` = offener/geschlossener Docs-Versuch, dessen Inhalt später anders integriert wurde
- `HISTORICAL` = gemergter Feature-/Audit-Branch, nur noch als Zeiger nützlich
- `TEMP` = Sync-/Shadow-/noop-/do-not-use-Duplikat
- `SAFE-DELETE-CANDIDATE` = späterer Branch-Delete nach TL-Liste; History/PRs bleiben
- `NEEDS-DECISION` = Unique Content oder unklarer Owner

### 9.1 ACTIVE – behalten

| Branch | SHA | Ahead/Behind | Klasse |
| --- | --- | --- | --- |
| `main` | `1d558ef56cc2` | 0/0 | KEEP / ACTIVE |
| `feat/tw6-rest-progressive-stages` | `001105721c0b` | 17/0 | ACTIVE – PR #87 TW6-B |
| `audit/project-sanitation-inventory-2026-08-26` | `0b599422` + Status | 1+/0 | ACTIVE – dieser Audit |

### 9.2 OPEN / historische PRs – nicht löschen

| Branch | Ahead/Behind | PR | Klasse |
| --- | --- | --- | --- |
| `audit/account-platform` | 11/358 | #39 OPEN/DRAFT CONFLICTING | NEEDS-DECISION – Unique Account-Plan |
| `audit/admin-platform` | 15/358 | #40 OPEN/DRAFT CONFLICTING | NEEDS-DECISION – Unique Admin-Plan |
| `cursor/s1-merged-status-f23f` | 3/352 | #50 OPEN/DRAFT CONFLICTING | SUPERSEDED / HISTORICAL |
| `docs/chatgpt-technical-lead-handoff-2026-08-24` | 67/349 | #52 OPEN/DRAFT CONFLICTING | SUPERSEDED / NEEDS-DECISION |
| `feat/trip-collaboration-foundation` | 1/424 | #28 OPEN/DRAFT | SUPERSEDED / Future Issue #20 |

### 9.3 TEMP / Duplikate – SAFE-DELETE-CANDIDATE nach Freigabe

| Branch | SHA | Hinweis |
| --- | --- | --- |
| `audit/admin-platform-sync-temp` | `e6b3e62c` | identisch mit `…-temp2` |
| `audit/admin-platform-sync-temp2` | `e6b3e62c` | Duplikat |
| `do-not-use` | `9cc9b052` | identisch mit `tmp-noop`; Name ist Warnung |
| `tmp-noop` | `9cc9b052` | Duplikat; enthält alten AP-1-Zwischenstand, bereits über PR #43 integriert |
| `docs/chatgpt-technical-lead-handoff-2026-08-24-shadow` | `216b44d9` | identisch mit den beiden domain-policy-Branches |
| `docs/domain-program-completion-policy` | `216b44d9` | Duplikat |
| `docs/domain-program-completion-policy-2` | `216b44d9` | Duplikat |
| `fix/d0-1-index-boundary-contract-sync-temp` | Ancestor von `main` | Sync-Temp, bereits integriert |

### 9.4 Geschlossene ungemergte Continuity-Versuche

| Branch | PR | Klasse |
| --- | --- | --- |
| `cursor/align-handoff-after-pr38-010d` | #42 CLOSED | SUPERSEDED / SAFE-DELETE-CANDIDATE nach Unique-Check |
| `cursor/foundation-c-merged-status-f35b` | #33 CLOSED | SUPERSEDED |
| `cursor/record-foundation-e-merge-be45` | #36 CLOSED | SUPERSEDED |
| `cursor/seasonal-merged-status-010d` | #41 CLOSED | SUPERSEDED |

### 9.5 Unique-Content-Branch ohne PR

| Branch | Ahead/Behind | Klasse |
| --- | --- | --- |
| `chore/account-admin-team-prep` | 23/358 | **NEEDS-DECISION**. 9 Docs nicht auf `main`, u. a. Product-Model- und Shared-Contract-Entwürfe. Vor Branch-Delete Inhalt gegen spätere `main`-Standards halten. |

### 9.6 MERGED / HISTORICAL – SAFE-DELETE-CANDIDATE

Diese Branches sind über Merge-Ancestor oder gemergten PR in `main` aufgegangen. Sie dürfen **erst** nach TL-Liste und nicht während offener Reviews gelöscht werden. Git-History und PR bleiben die Evidence.

`audit/admin-d-k-growth-control` (#78), `audit/growth-discoverability-d0-g0-foundation` (#69), `audit/provider-readiness` (#45), `audit/provider-s4-s8-provenance` (#77), `audit/qs2-quality-security-resilience` (#79), `audit/quality-security-trip-workspace-checkpoint` (#67), `audit/traveller-account-next-phase` (#76), `audit/trip-workspace` (#55), `audit/tw6-guest-one-trip-dependency` (#75), `chore/admin-reorg`, `codex/jetnity-v2-foundation`, `cursor/audit-abschluss-production-cbcd` (#8), `cursor/jetnity-v2-basis-cbcd` (#1), `cursor/legacy-datenbank-entfernen-f38c` (#13), `cursor/mobile-auth-formulare-cbcd` (#5), `cursor/mobile-responsive-pass-cbcd` (#4), `cursor/phase-0-deploy-verifikation-cbcd` (#2), `cursor/phase-1-1-alt-endpunkte-cbcd` (#3), `cursor/phase-1-1b-alt-oberflaechen-cbcd` (#6), `cursor/phase-1-2-tokens-aufraeumen-cbcd` (#9), `cursor/phase-1-3-auth-rollen-cbcd` (#10), `cursor/phase-1-4-datenbank-baseline-0c7c` (#12), `cursor/phase-1-4c-auth-konfiguration-8050` (#14), `cursor/phase-1-5-reiseschema-c9d2` (#15), `cursor/phase-2-1-natuerliche-sprache-zu-reise-e985` (#16), `cursor/phase-22-reise-aendern-e90a` (#18), `cursor/phase-3-flights-foundation-c8a6` (#19), `cursor/supabase-mcp-dev-1f02` (#11), `cursor/ui-responsive-audit-cbcd` (#7), `docs-continuity-standard` (#25), `docs-phase-3-3-status-sync` (#26), `docs/agent-workstream-governance` (#61), `docs/final-continuity-handoff-2026-08-26` (#85), `docs/jetnity-handoff-after-phase-2-1` (#17), `docs/marketing-growth-standard` (#59), `docs/merge-governance-repair-2026-08-25` (#71), `docs/native-agent-technical-lead-standard` (#63), `docs/phase-3-1-final-handoff` (#21), `docs/post-d0-1-continuity-2026-08-25` (#72), `docs/post-tw3-continuity-2026-08-25` (#65), `docs/post-tw5-continuity-2026-08-25` (#68), `docs/product-quality-standard` (#23), `docs/six-agent-governance` (#62), `docs/technical-lead-autonomy-2026-08-25` (#57), `docs/tl-merge-autonomy-2026-08-26` (#73), `docs/ux-information-architecture-standard`, `feat/account-ap1` (#43), `feat/account-ap2` (#48), `feat/account-ap3` (#53), `feat/admin-control-center-ia` (#44), `feat/admin-provider-cost-board` (#49), `feat/admin-system-health` (#46), `feat/d0-2-canonical-origin-consistency` (#74), `feat/impact-score-panel`, `feat/mobility-transfers-foundation` (#30), `feat/provider-flight-evidence-s2` (#51), `feat/provider-mobility-rental-evidence-s3` (#54), `feat/provider-ops-s1` (#47), `feat/provider-s5-commercial-provenance-contract` (#83), `feat/rental-car-foundation` (#31), `feat/route-transit-intelligence` (#34), `feat/travel-readiness-foundation` (#32), `feat/travel-safety-disruption-intelligence` (#37), `feat/travel-timing-seasonal-intelligence` (#38), `feat/traveller-context-intelligence` (#35), `feat/trip-coverage-booking-status` (#29), `feat/trip-workspace-tw1-shell-device-parity` (#56), `feat/trip-workspace-tw2-overview` (#58), `feat/trip-workspace-tw3-timeline` (#64), `feat/trip-workspace-tw3-timeline-prep`, `feat/trip-workspace-tw4-attention` (#60), `feat/trip-workspace-tw5-item-gap-details` (#66), `feat/tw6-create-entry-alignment` (#82), `fix/d0-1-index-boundary-contract` (#70), `fix/d0-live-index-metadata-boundary-2026-08-26` (#86), `fix/p1-ta02-official-evaluation-option-scope` (#84), `fix/qs2-admin-aal2-guard` (#80), `fix/qs2-guest-account-commercial-truth` (#81), `phase-3-2-hotel-foundation` (#22), `phase-3-3-activities-foundation` (#24), `phase-3-flights-foundation`, `ux-trip-workspace-mobile-iteration-1` (#27).

Zielbild nach späterer Bereinigung: `main` + tatsächlich aktive PR-Branches + wenige begründete Langzeitbranches. Historie über Git/PR/Docs, nicht über 100 Heads.

---

## 10. PR-Inventar

### 10.1 Offen

| PR | Titel | Draft | Mergeable | Klasse | Aktion dieses Slices |
| --- | --- | --- | --- | --- | --- |
| **#87** | TW6-B Progressive Ziele + Day→Stage Mode Contract | ja | MERGEABLE | **ACTIVE Runtime** | nicht berühren |
| #52 | ChatGPT TL handoff 2026-08-24 | ja | CONFLICTING | SUPERSEDED / NEEDS-DECISION | nicht schliessen |
| #50 | S1 merged-status docs | ja | CONFLICTING | HISTORICAL / INTEGRATED ELSEWHERE | nicht schliessen |
| #40 | Admin Platform Audit | ja | CONFLICTING | HISTORICAL + Unique Docs | nicht schliessen |
| #39 | Account Platform Audit | ja | CONFLICTING | HISTORICAL + Unique Plan (P2-TA-03) | nicht schliessen |
| #28 | Trip Collaboration Foundation | ja | MERGEABLE | SUPERSEDED / DO NOT RESUME | nicht schliessen |

### 10.2 Geschlossen, nicht gemergt

| PR | Klasse |
| --- | --- |
| #42, #41, #36, #33 | SUPERSEDED Continuity-Docs nach Foundation-/PR38-Merges |

### 10.3 Gemergt

PR #1–#27, #29–#32, #34–#35, #37–#38, #43–#49, #51, #53–#86 sind MERGED. Sie sind KEEP-HISTORICAL Evidence. Zugehörige Branches sind SAFE-DELETE-Kandidaten, die PRs selbst nicht.

---

## 11. `supabase/.temp` und `.branches`

`.gitignore` enthält seit 03.09.2025:

```
supabase/.temp/
supabase/.branches/
```

Die Dateien waren **zuvor** im Initial-Commit `308499d9` (15.07.2025) versioniert. Gitignore wirkt nicht auf bereits getrackte Pfade. `git ls-files -v` zeigt sie als cached/`H`.

| Datei | Inhaltstyp | Secret? |
| --- | --- | --- |
| `cli-latest` | Versionsstring | nein |
| `gotrue-version` | Versionsstring | nein |
| `postgres-version` | Versionsstring | nein |
| `rest-version` | Versionsstring | nein |
| `pooler-url` | auskommentierte PostgreSQL-Pooler-URL | **kein Live-Passwort**; Platzhalter `[YOUR-PASSWORD]`; enthält Production-Projektref und Pooler-Host |
| `.branches/_current_branch` | Literal `main` | nein |

Bewertung:

- Rein lokal von der Supabase-CLI erzeugt.
- Aus dem Git-Index entfernbar, ohne CLI/CI zu beschädigen: CI nutzt diese Dateien nicht.
- `git rm --cached` ist reversibel; Working-Copy/CLI darf sie lokal neu schreiben.
- **History-Rewrite ist unverhältnismässig** und destruktiv. Der String enthält kein reales Passwort.
- Residualrisiko: Wenn ein späterer CLI-Lauf ein echtes Passwort in dieselbe **weiterhin getrackte** Datei schreibt, würde Git eine Secret-Änderung committen können. Deshalb ist Untracken P1-Hygiene, nicht Panik-Rotation.

In diesem Slice **nicht** entfernt.

---

## 12. Cloud- / Project-Referenzen

### 12.1 Gesuchte Alt-Refs

| Ref | Treffer im aktuellen Tree |
| --- | --- |
| `jetnity-bets` | nur in diesem Audit-Task / Status |
| `jrixsujkzvlvglvcmtia` | nur in diesem Audit-Task / Status |
| `jetnity-travel` | **kein** Treffer |
| `qscbgcdmivbbnzrcyegn` | Docs + `supabase/.temp/pooler-url` – **aktuelles** Production-Projekt |
| `jetnity-app` / `jetnity-app.vercel.app` | aktueller Production-Alias; Docs/SEO-Tests; niemals kanonische Produktdomain |
| `jetnity.com` | kanonische Wunsch-/Public-Domain |
| `jetnity.ch` | Entry-/Redirect-Domain; Footer `info@jetnity.ch`; SEO-deny-Tests |
| `jetnity.ai` | **nur** `next.config.js` Image-Remote-Pattern `/static/avatars/**` – V1-Rest |
| `oaidalleapiprodscus.blob.core.windows.net` | **nur** `next.config.js` – DALL-E-V1-Host |
| `vercel.com/jetnity-e1b93c82/jetnity-app/...` | historische Preview-Dashboard-URLs in Docs |
| `mcp.supabase.com` | aktueller offizieller MCP in `.cursor/mcp.json` und ADR |
| `your-project.supabase.co` | `.env.example` Platzhalter |

### 12.2 Cloud-Soll / Ist laut Task + Repo (dieser Agent ändert Cloud nicht)

| Ressource | Klasse | Hinweis |
| --- | --- | --- |
| GitHub `Jetnity/jetnity` | KEEP | einziges Repo der Org |
| Vercel `jetnity-app` → `Jetnity/jetnity` | KEEP | TL-Live: einziges verbundenes Projekt |
| Supabase `Jetnity's Project` / `qscbgcdmivbbnzrcyegn` | KEEP | Production |
| Supabase Branch `develop` | KEEP | Development |
| Supabase `jetnity-bets` / `jrixsujkzvlvglvcmtia` | DECOMMISSION-CANDIDATE | **nicht im Repo**; TL-Live: leer/inaktiv. Pause/Delete = PO-Gate |

Keine zweite Vercel-Projekt-ID im Repository gefunden.

---

## 13. Tote Dependencies / Exports / Assets / Legacy

| Fund | Klasse | Evidence |
| --- | --- | --- |
| npm-Dependencies | KEEP | `check:deps` 0 ungenutzt; Zod/Recharts/Sonner/Playwright/Radix real genutzt |
| Benannte Runtime-Exporte | KEEP | `check:exports` 0 |
| Unerreichbare App/Lib/Component-Dateien | 1 Ausnahme | nur `CookieConsent` |
| `public/images/prague.jpg` | DELETE-CANDIDATE | kein Import |
| Übrige Public-Images | KEEP | `lib/places/inspiration.ts` + OG |
| `hooks/` | existiert nicht | nur toter Alias in `components.json` |
| `@supabase/auth-helpers-*` | bereits entfernt | `check-jetnity-setup` verbietet Reimport – KEEP als Schutz |
| V1 Creator/Heatmap/Amadeus-Tabellen | bereits 1.4b entfernt | Evidence in `docs/LEGACY_ENTFERNUNG.md` + Migration; nicht erneut löschen |
| Guest-`legacy`-LocalStorage in `lib/trips/gastspeicher.ts` | KEEP | aktive Migrationsbrücke, keine tote Datei |
| Readiness-Legacy-Citizenship-Felder | KEEP | bewusste Kompatibilität, nicht first-item-Truth |
| Admin-Folgt-Seiten | KEEP | ehrliche Platzhalter |
| `/ui-audit/*` | KEEP | Production fail-closed |
| `check:deps` ABSICHTLICH-Eintrag für `zod` | ARCHIVE/Fix später | Kommentar stale, Paket wird genutzt |

Kein totes Runtime-Paket zum sofortigen Entfernen.

---

## 14. Legacy- / Demo- / Debug-Code

| Fund | Bewertung |
| --- | --- |
| CookieConsent Views/Likes | V1-Social-Text, unerreichbar – NEEDS-DECISION |
| UI-Audit-Fixtures + Placeholder-JWT `ref=placeholder` | absichtlich unecht, nur Harness, Production 404 |
| Admin Payments / Security Widgets | aktuelle Admin-Flächen; Payments sind ehrlich begrenzt, kein Fake-Provider-Live |
| `JETNITY_UI_AUDIT` | Kill-Switch, in Production wirkungslos |
| `check-jetnity-setup.ts` „Mega Pro“ | nur Kommentar |
| Inspiration-Ziele (Bali etc.) | Produkt-Startseite, keine Demo-Wahrheit über Preise/Visa |
| `do-not-use` / `tmp-noop` Branches | TEMP, nicht Produktcode auf `main` |

Kein Demo-Code gefunden, der Production-Truth schreiben würde.

---

## 15. Security- / Privacy-Funde

Keine Secrets in diesem Bericht reproduziert.

| ID | Fund | Severity | Remediation (später) |
| --- | --- | --- | --- |
| S-01 | Getrackte `supabase/.temp/pooler-url` mit Production-Ref + Pooler-Host + Platzhalterpasswort, obwohl gitignored | **P1** Hygiene / **P2** Info-Disclosure | `git rm --cached`; kein Rewrite; keine Secret-Rotation nötig (kein echtes Passwort) |
| S-02 | Dieselbe getrackte `.temp/`-Gruppe kann künftig echte CLI-Secrets aufnehmen | **P1** | Untracken, damit Ignore wieder greift |
| S-03 | `main` Branch Protection aus | **P1** Governance (vorbestehend) | Protection aktivieren – kein Datei-Delete |
| S-04 | V1 Image-Remote-Hosts `jetnity.ai`, DALL-E-Blob in `next.config.js` | **P2** unnötige Allowlist | eigener Config-Slice |
| S-05 | CookieConsent behauptet Messung und verlinkt fehlendes `/privacy` | **P2** (G0-P2-02); derzeit unerreichbar | Legal-Slice oder Datei entfernen |
| S-06 | Historische offene PRs mit Unique Identity-/Admin-Docs | **P2** Verwechslungsrisiko | Unique Content sichern, dann PRs schliessen |
| S-07 | UI-Audit-JWTs | kein Secret | Platzhalter, fail-closed |
| S-08 | `.cursor/mcp.json` / `.env.example` | sauber | nur ENV-Platzhalter |
| S-09 | Kein `jetnity-bets`-Ref im Produktcode | positiv | Cloud-Decommission separat |
| S-10 | `check:api-schutz` beweist nicht AAL2-Wirksamkeit | Rest-Risiko, kein Altlast-Delete | bleibt QS-/Admin-Thema |

Keine getrackte Live-`service_role`, kein Live-OpenAI-Key, kein Duffel-Live-Token im Tree.

---

## 16. P0 / P1 / P2 / P3

### P0

Keine. Kein Live-Secret im Tree, kein produktives Datenleck, das sofortiges Löschen oder Rotation in diesem Slice erzwingt.

### P1

1. `supabase/.temp/*` und `supabase/.branches/*` sind trotz Ignore getrackt (S-01/S-02).
2. `main` Branch Protection ist aus (vorbestehend, S-03).
3. Unique Docs liegen nur auf stale Branches/PRs (`ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` = P2-TA-03; Admin-Plan auf #40; Product-Model-Entwürfe auf `chore/account-admin-team-prep`). Branch-Delete vor Sicherung wäre Datenverlust von Evidence.

### P2

1. ~100 historische Remote-Branches.
2. Fünf offene historische Draft-PRs neben #87.
3. `prague.jpg` unreferenziert.
4. V1 Image-Hosts in `next.config.js`.
5. CookieConsent / G0-P2-02.
6. Docs-Navigation ohne Index (279 Dateien).
7. `jetnity-bets` Cloud-Altprojekt (ausserhalb Repo).
8. Hygiene-Checks sind unvollständig gegenüber Assets/Branches/Cloud.
9. Continuity auf `main` hinkt Live-`main`/`#87` hinterher – nicht durch diesen Agent zu „reparieren“.

### P3

1. shadcn `components.json` / fehlendes `hooks/`.
2. Stale `zod`-Ausnahme in `scripts/pakete.mjs`.
3. „Mega Pro“-Kommentar in `check-jetnity-setup.ts`.
4. Duplikat-SHA-Branches (`temp2`, `tmp-noop`, domain-policy-2).

---

## 17. Vorgeschlagene spätere Bereinigungsreihenfolge

Nicht starten. Nur Reihenfolge für Technical Lead / Product Owner.

1. **Unique-Content-Sicherung** der Branches/PRs #39, #40, #52, `chore/account-admin-team-prep` – entscheiden, was Evidence auf `main` braucht.
2. **Git-Index:** `git rm --cached` für `supabase/.temp/*` und `supabase/.branches/_current_branch`. Kleiner eigener Docs/Hygiene-PR. Nicht mit TW6-B mischen.
3. Historische Draft-PRs schliessen, **nach** Schritt 1.
4. Temp-/Duplikat-Branches löschen.
5. Gemergte Feature-/Audit-Branches in Chargen löschen.
6. `prague.jpg` entfernen.
7. CookieConsent-Entscheidung (Legal oder Delete).
8. `next.config.js` V1-Hosts in eigenem Runtime-Micro-Slice.
9. `docs/EVIDENCE_INDEX.md` ohne Massenverschiebung.
10. Cloud: `jetnity-bets` nur nach PO-Gate.
11. Branch Protection – eigenes Governance-Gate.
12. Hygiene-Scripts adversarial nachziehen (Assets, tracked-ignored, stale ABSICHTLICH).

---

## 18. Reversible vs. destruktive Aktionen

### Reversibel (nach Freigabe)

| Aktion | Warum reversibel |
| --- | --- |
| `git rm --cached` der `.temp`/`.branches`-Dateien | History bleibt; CLI erzeugt lokal neu |
| Branch-Delete auf GitHub | SHA bleibt in gemergten PRs / Reflog ~90 Tage |
| `prague.jpg` löschen | Git-History |
| Historischen PR schliessen | wieder öffenbar |
| Docs-Index anlegen | additiv |
| CookieConsent entfernen | Git-History; Datei ist ohnehin tot |

### Destruktiv / besondere Gates

| Aktion | Gate |
| --- | --- |
| `git filter-repo` / History-Rewrite wegen pooler-url | **nicht empfohlen**; destruktiv für alle SHAs |
| Supabase-Projekt `jetnity-bets` pausieren oder löschen | **Product Owner** |
| Production-Supabase oder `develop` anfassen | **Product Owner** + Production-Gate |
| Vercel-Projekt löschen | **Product Owner** |
| Secrets rotieren | unnötig für diesen Fund; wäre PO/TL |
| Migration aus Historie löschen | verboten |
| ADR/Review/Acceptance löschen | verboten |
| Runtime-Änderung an TW6-B-Dateien | verboten in Sanitation; #87-Owner |
| Production-Migration / Provider / Payments / Indexing | bestehende PO-Gates |

---

## 19. Was nach Audit gelöscht / pausiert / archiviert werden *könnte*

Nur Kandidatenliste für die spätere Entscheidung. **Nicht ausgeführt.**

Löschen (Git-Index / Datei), nach Freigabe:

- `supabase/.temp/*` (5 Dateien, cached)
- `supabase/.branches/_current_branch`
- `public/images/prague.jpg`

Branches löschen, nach Unique-Content-Check und Freigabe:

- alle TEMP/Duplikate in §9.3
- alle MERGED in §9.6
- geschlossene Continuity-Branches in §9.4

PRs schliessen, nach Unique-Content-Check:

- #52, #50, #40, #39, #28

Cloud pausieren/löschen, nur PO:

- Supabase `jetnity-bets` / `jrixsujkzvlvglvcmtia`

Archivieren (Index, keine Verschiebung zuerst):

- Slice-TASK/STATUS/REVIEW-Schwarm über `docs/EVIDENCE_INDEX.md`

Nicht löschen:

- Migrationen
- ADRs / Acceptance / Checkpoints
- Archive-Tags
- aktuelles Supabase-/Vercel-Produkt
- PR #87 Branch
- CookieConsent ohne Legal-Entscheidung
- Admin-Folgt-Seiten
- UI-Audit-Harness

---

## 20. Product-Owner-Gates für eine spätere Sanitation

Ausdrückliche PO-Entscheidung nötig vor:

- Pause/Delete von `jetnity-bets` oder jedem anderen Cloud-Projekt
- jeder Production-Daten-/Schemaänderung
- Secret-Rotation
- Domain-/Vercel-Projektänderung
- History-Rewrite
- Schliessen von #39/#40, falls Unique Account-/Admin-Pläne verworfen statt gesichert werden
- Cookie-/Privacy-Text, der Nutzer sichtbar wird
- Public Launch / Indexing (unabhängig von Sanitation)

Technical Lead darf nach unabhängigem Review die **reversiblen Git-Index- und Branch-Deletes** in einem eigenen Slice steuern, sobald Unique Content gesichert ist und #87 nicht kollidiert. Blindes Massenlöschen bleibt verboten.

---

## 21. Root- und Verzeichnisinventar (Kurz)

| Bereich | Tracked | Urteil |
| --- | --- | --- |
| Root-Docs + Config | 22 Dateien | KEEP; `components.json` NEEDS-DECISION; `DECISIONS.md` KEEP-HISTORICAL |
| `app/` | 76 | KEEP inkl. ehrliche Admin-Platzhalter und fail-closed UI-Audit |
| `components/` | 83 | KEEP; CookieConsent NEEDS-DECISION |
| `lib/` | 543 | KEEP aktueller Domain-Code |
| `docs/` | 279 | KEEP + ARCHIVE-CANDIDATE-Index |
| `supabase/` | 55 | Migrationen KEEP-HISTORICAL; `.temp`/`.branches` DELETE-CANDIDATE |
| `scripts/` | 30 | KEEP |
| `public/` | 6 | 5 KEEP, 1 DELETE-CANDIDATE |
| `styles/` | 1 | KEEP |
| `types/` | 2 | KEEP; #87-Kollisionszone |
| `.cursor/` | 5 | KEEP |
| `.github/` | 1 Workflow | KEEP |

---

## 22. Traveller-Kontext

Dieser Slice ändert keine Traveller-/Citizenship-/Document-Logik.  
Gefunden: Legacy-Kompatibilitätsleser in Readiness und Guest-Storage – **KEEP**, keine first-item-Product-Truth.  
P2-TA-06 (`documents[0]` in `travellerNormalisieren`) bleibt bestehendes offenes Finding, kein Sanitation-Delete.

---

## 23. Explizite Nicht-Aussagen

- Dieser Bericht behauptet nicht, Cloud-Projekte live selbst inspiziert zu haben. Vercel/Supabase-Live-Sätze stammen aus dem Task des Technical Lead plus Repo-Evidence.
- Dieser Bericht behauptet nicht, Unique Docs auf #39/#40/`chore/account-admin-team-prep` seien inhaltlich veraltet oder aktuell. Sie fehlen auf `main` und müssen gelesen werden, bevor etwas wegfällt.
- Hygiene grün ≠ keine Altlasten.
- Unreferenziert ≠ sicher löschbar ohne History-/Governance-Kontext.

---

## 24. STOPP

- Nichts gelöscht.
- Nichts archiviert.
- Kein Supabase pausiert oder gelöscht.
- Kein Vercel verändert.
- Kein Branch gelöscht.
- Kein Folgeslice gestartet.
- PR #87 unberührt.
- `docs/ACTIVE_WORK_STATUS.md` unberührt.

**STOPP.**

ChatGPT / Technical Lead entscheidet, was wirklich entfernt werden darf.
