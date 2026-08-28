# HISTORICAL EVIDENCE — Draft-PR #88 — 26. August 2026

> **Nicht Current Truth.** Live-Rekonstruktion und Closure-Stand: `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`.
>
> Original-Pfad auf `audit/project-sanitation-inventory-2026-08-26` @ `a5fbaa6df79fc0515d06a1cfafb88fcd6316b0e8`.

# Jetnity – Project Sanitation Audit Task

Stand: 26. August 2026
Cursor-Agent: `Jetnity quality security audit 2`
Branch: `audit/project-sanitation-inventory-2026-08-26`
Typ: AUDIT / INVENTORY / NON-DESTRUCTIVE

## 1. Zweck

Jetnity soll technisch und organisatorisch auf genau das aktuelle Reiseplattform-Projekt reduziert und von nachvollziehbarem Altbestand bereinigt werden, ohne historische Evidence, produktive Daten oder noch benötigte technische Verträge versehentlich zu löschen.

Dieser Slice ist ausdrücklich nur die Inventur und Klassifizierung. Er darf noch nichts Destruktives löschen, archivieren, pausieren oder umbenennen.

## 2. Live-Baseline des Technical Lead

Bei Erstellung dieses Tasks:

- `origin/main`: `1d558ef56cc275d429f4076c7a8877c3791947a7`
- aktives Produkt-Repository laut verbundenem GitHub: `Jetnity/jetnity`
- Vercel: genau ein Projekt `jetnity-app`, Git-Link `Jetnity/jetnity`
- Supabase: aktives Projekt `Jetnity's Project` (`qscbgcdmivbbnzrcyegn`) plus separates Altprojekt `jetnity-bets` (`jrixsujkzvlvglvcmtia`)
- aktives Supabase-Hauptprojekt besitzt `main` plus Development-Branch `develop`
- `jetnity-bets`: keine Development-Branches, keine Edge Functions, keine API-Logs in den letzten 24h, keine `public`-Anwendungstabellen, 1 Auth-User, 0 Storage-Buckets, 0 Storage-Objekte
- im aktuellen Jetnity-Repository gibt es keinen Treffer auf Ref `jrixsujkzvlvglvcmtia` oder Namen `jetnity-bets`
- GitHub enthält sehr viele historische/alte Branches (mehr als 100 sichtbar)
- `supabase/.temp/*` ist trotz `.gitignore` noch versioniert; `.gitignore` schließt `supabase/.temp/` ausdrücklich aus

Diese Angaben sind Evidence des Startpunkts, keine Garantie für den späteren Live-Stand. Vor Abschluss live neu prüfen.

## 3. Harte Regeln

- Keine Production-Daten löschen.
- Kein Supabase-Projekt pausieren oder löschen.
- Keine Vercel-Projekte löschen.
- Keine GitHub-Repositories oder Branches löschen.
- Keine Secrets rotieren oder entfernen.
- Keine Migrationen aus der Historie löschen, nur weil sie alt sind.
- Historische ADRs, Reviews, Handoffs und Checkpoints nicht löschen; sie bleiben Evidence.
- Keine Runtime-Änderungen am laufenden PR #87.
- `docs/ACTIVE_WORK_STATUS.md` nicht zentral umschreiben.
- Alter/letztes Änderungsdatum allein ist niemals Löschbeweis.

## 4. Repository-Audit

Den gesamten aktuellen `main` gegen folgende Klassen inventarisieren:

1. KEEP – aktiv und notwendig.
2. KEEP-HISTORICAL – historische Evidence, weiterhin bewusst erhalten.
3. ARCHIVE-CANDIDATE – noch sinnvoll aufzubewahren, aber nicht mehr im aktiven Navigations-/Arbeitsbereich nötig.
4. DELETE-CANDIDATE – nachweislich generiert, dupliziert, temporär oder unreferenziert und ohne historische/operative Bedeutung.
5. NEEDS-DECISION – nicht sicher klassifizierbar.

Mindestens prüfen:

- Root-Dateien
- `app/`
- `components/`
- `lib/`
- `types/`
- `scripts/`
- `public/`
- `styles/`
- `supabase/`
- `.cursor/`
- `.github/`
- package.json / package-lock
- Next/Tailwind/PostCSS/TS/ESLint/Vercel-Konfiguration
- alte APIs/Routes/Pages/Components
- tote Exports / tote Dependencies / tote Scripts
- ungenutzte Assets
- doppelte oder supersedierte Konfigurationen
- generierte/temporäre Dateien, die versehentlich getrackt sind
- lokale Tool-Artefakte
- Environment-Beispiele und alte Provider-/Domain-Referenzen

Bestehende Checks wie `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` als Evidence verwenden, aber nicht blind als vollständig betrachten.

## 5. Besondere Prüfung `supabase/.temp`

Prüfen, warum folgende ignorierte Dateien weiterhin getrackt sind:

- `supabase/.temp/cli-latest`
- `supabase/.temp/gotrue-version`
- `supabase/.temp/pooler-url`
- `supabase/.temp/postgres-version`
- `supabase/.temp/rest-version`

Bewerten:

- enthalten sie Secrets oder sensible Connection-Information?
- sind sie rein lokal generiert?
- können sie sicher aus Git entfernt werden, ohne Supabase-CLI-/CI-Verhalten zu beschädigen?
- muss zusätzlich Git-History-/Secret-Exposure bewertet werden?

In diesem Audit NICHT löschen.

## 6. Branch-/PR-Hygiene

Alle Remote-Branches und offenen/historischen PRs klassifizieren.

Für jeden Branch möglichst feststellen:

- in `main` integriert?
- durch neueren Branch/PR superseded?
- noch operativ aktiv?
- reine historische Evidence?
- Temp-/Sync-/Cursor-Arbeitsbranch?
- sichere Delete-Candidate nach späterer TL-Freigabe?

Keinen Branch in diesem Audit löschen.

Zielbild nach späterer Bereinigung:

- `main`
- nur tatsächlich aktive PR-/Workstream-Branches
- wenige bewusst begründete Langzeitbranches
- historische Arbeit bleibt über Git-History, PRs und Dokumentation nachvollziehbar, nicht über hunderte tote Branches.

## 7. Cloud-/Project-Referenzen im Repository

Im Repository nach alten Projekt-/Service-Referenzen suchen:

- alte Supabase project refs / URLs
- alte Vercel project IDs/names
- alte Repository-Namen
- alte Domains
- `jetnity-bets`
- `jetnity-travel`
- alte Jetnity-V1-/Demo-/Legacy-Namen
- veraltete Environment-Namen

Nicht automatisch entfernen. Je Treffer aktuelle Nutzung und Evidence dokumentieren.

## 8. Supabase-Sanitation – nur Audit

Der Cursor-Agent verändert Supabase nicht. Er soll aus Repository-Evidence bewerten, welche Supabase-Umgebungen/Refs erwartet werden.

Technical Lead übernimmt separat die Live-Cloud-Prüfung.

Bekannte Live-Kandidaten:

- KEEP: `Jetnity's Project` / `qscbgcdmivbbnzrcyegn`
- KEEP: dessen Development-Branch `develop` / `yfvbxvijcorffwxbxahl`, solange aktuelle Development-/Migrationstests ihn benötigen
- DECOMMISSION-CANDIDATE: `jetnity-bets` / `jrixsujkzvlvglvcmtia`, vorbehaltlich finaler TL-/Product-Owner-Freigabe

## 9. Vercel-Sanitation – nur Audit

Zielzustand: genau ein Jetnity-Webprojekt, sofern Live-Evidence nichts anderes verlangt.

Aktuell bekannte Evidence: `jetnity-app` ist das einzige verbundene Projekt und hängt an `Jetnity/jetnity`.

Repository auf alte Vercel-IDs, Alias-/Domain-/Deployment-Konfigurationen und tote Legacy-Verbindungen prüfen.

## 10. Historische Dokumentation

Historische Dokumente nicht nach Alter löschen.

Stattdessen bewerten:

- current/canonical
- historical/superseded
- duplicate
- orphaned/unlinked

Falls Navigation unübersichtlich ist, einen späteren non-destructive Archive-/Index-Plan vorschlagen. Keine Massenverschiebung in diesem Audit.

## 11. Security-/Privacy-Audit der Altlasten

Besonders prüfen:

- getrackte lokale Verbindungsdaten
- alte API-URLs oder IDs
- versehentlich getrackte Secrets / Tokens / Passwörter
- alte auth/provider callbacks
- veraltete Storage-Bucket-Namen
- Debug-/Test-Endpunkte
- Demo-/Fake-/Seed-Code, der Production-Truth beeinflussen könnte

Keine Secrets in Reports reproduzieren. Nur Fundort, Typ, Severity und Remediation dokumentieren.

## 12. Deliverable

Erstellen:

`docs/PROJECT_SANITATION_AUDIT_STATUS_2026-08-26.md`

Darin mindestens:

- Live main / Exact Head / Merge-Base / Ahead-Behind
- Repository-Inventar
- klare KEEP / KEEP-HISTORICAL / ARCHIVE-CANDIDATE / DELETE-CANDIDATE / NEEDS-DECISION Tabellen
- Branch-Inventar und sichere spätere Delete-Kandidaten
- PR-Inventar
- `supabase/.temp` Bewertung
- alte Cloud-/Project-Refs
- mögliche Security-/Privacy-Funde
- P0/P1/P2/P3
- vorgeschlagene Bereinigungsreihenfolge
- welche Schritte reversibel sind
- welche Schritte destruktiv sind und Product-Owner-/Technical-Lead-Freigabe brauchen
- konkrete Liste dessen, was nach Audit gelöscht/pausiert/archiviert werden könnte
- ausdrücklich: in diesem Slice wurde noch nichts destruktiv verändert

## 13. Tests / Evidence

Da Audit-only:

- keine Runtime-Änderung
- relevante bestehende Hygiene-Checks ausführen
- Git-Referenzen/Imports/Dependencies adversarial prüfen
- keine falsche Aussage „unreferenziert = sicher löschbar“ ohne Build-/Runtime-/History-Kontext

## 14. STOPP

Am Ende:

- keinen Cleanup durchführen
- keine Dateien löschen
- keine Branches löschen
- kein Supabase pausieren/löschen
- kein Vercel löschen
- keinen Folgeslice starten

STOPP und Abschlussbericht an ChatGPT / Technical Lead.

Danach entscheidet der Technical Lead gemeinsam mit dem Product Owner über eine gestufte Bereinigung.