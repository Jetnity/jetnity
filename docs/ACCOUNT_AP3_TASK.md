# Jetnity Account AP-3 – Meine Reisen Lebenszyklus (ableitend)

Stand: 24. August 2026

Status: **auf `main` `78192ab` synchronisiert; Runtime unverändert; Draft bleibt Draft, wartet auf Exact-Head-Gates und Technical-Lead-Re-Review**

Verantwortlicher Cursor-Anzeigename: `Account plattform audit vorbereitung`

## Ausgangslage

- AP-1 und AP-2 liegen auf `main`.
- Admin Slice A / PR #44, Admin Slice B / PR #46 und Admin Slice C / PR #49 liegen auf `main` (`78192ab`).
- `Meine Reisen` zeigt Kontoreisen bisher als eine flache Kartenliste.
- Die Account-Übersicht klassifiziert aktiv/kommend bereits date-only gegen den Geräte-Kalendertag (ADR-0153).

## Auftrag

Ableitende Gruppen auf `/reisen` für angemeldete Konten:

- Aktiv
- Kommend
- Vergangen
- Ohne Datum

Nur aus vorhandenen `startDate`/`endDate`. Dieselbe date-only-Logik wie Übersicht und Reisekarte. Zeitzonen dürfen keinen Tag verschieben: Klassifikation erst am Geräte-Kalendertag, nicht per Server-UTC.

Optional eine kleine Titelsuche. Limit-200 fail-closed anzeigen, wenn die geladene Liste die Grenze erreicht: höchstens 200 zuletzt geänderte Reisen sind geladen; keine Behauptung, dass weitere existieren.

## Nicht

- kein zweites Reisenmodell
- kein `status = archived` Write, kein Archivieren
- keine neue Tabelle, keine Migration, keine RLS-Änderung
- keine Traveller-Registry, keine Guest→Account-Änderung, keine Auth-Contract-Änderung
- keine Payment-/Subscription-Integration
- keine Citizenship-/Document-Defaults
- undatierte Reise niemals als Vergangen
- Empty-Gruppe ist kein Error
- Fehler dürfen nicht als leere Liste erscheinen
- kein Trip-Workspace-Duplikat
- kein Mark Ready, kein Merge, kein AP-4

## Gates

Lokale Tests inkl. Pflichtmatrix, Typecheck, Lint, Hygiene, `auth:pruefen`, Production-Build, danach GitHub Actions und Vercel auf demselben Exact Head.

Entscheidung: ADR-0160. ADR-0158 bleibt Admin Slice A.

Danach STOPP für unabhängigen Technical-Lead-Review.
