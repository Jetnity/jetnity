# Jetnity Account AP-3 – Meine Reisen Lebenszyklus (ableitend)

Stand: 24. August 2026

Status: **DONE – Exact-Head `612d819e` gegatet; Draft bleibt Draft, wartet auf Integrationsreview**

Verantwortlicher Cursor-Anzeigename: `Account plattform audit vorbereitung`

## Ausgangslage

- AP-1 und AP-2 liegen auf `main`.
- Admin Slice A / PR #44 liegt auf `main` (`1ec93cc9`).
- `Meine Reisen` zeigt Kontoreisen bisher als eine flache Kartenliste.
- Die Account-Übersicht klassifiziert aktiv/kommend bereits date-only gegen den Geräte-Kalendertag (ADR-0153).

## Auftrag

Ableitende Gruppen auf `/reisen` für angemeldete Konten:

- Aktiv
- Kommend
- Vergangen
- Ohne Datum

Nur aus vorhandenen `startDate`/`endDate`. Dieselbe date-only-Logik wie Übersicht und Reisekarte. Zeitzonen dürfen keinen Tag verschieben: Klassifikation erst am Geräte-Kalendertag, nicht per Server-UTC.

Optional eine kleine Titelsuche. Limit-200 ehrlich anzeigen, wenn die geladene Liste voll ist.

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
