# D1 — Umsetzungsplan V1

**09.11.2026.** Root hat diesen Dateiumfang vor der Ausarbeitung bestätigt. Auftrag: [D1_TASK_V1](D1_TASK_V1.md), Draft [#1169](https://github.com/Jetnity/jetnity/pull/1169). Autor: **Jetnity Official Truth V3 Method Package 1 — Codex Generation 1**, Session `/root/v3_d1_method_writer`. Basis ist E1 `97629e9130a907b8b9b8072d06bda1956758aa6e`; eigener Taskseed `23d9645ec68fc3f27b4332c2f8f91ce9cfea05e8`.

## Ziel und Dateien

Der konkrete Methodenentwurf macht den späteren einmaligen Ownerentscheid prüfbar. Die verbindliche Einquellenregel und CH→DE werden nicht erneut zur Diskussion gestellt. Die tatsächliche Quellen-/Zielqualifikation und Maschinenautorität bleiben offen; die Dokumente erteilen keine Freigabe.

1. `D1_METHOD_PACKAGE_V1.md`: unterstützter Umfang, Quellen-/Konfliktmatrix, Betriebskandidaten, Recovery, Abnahme und verständlicher späterer Freigabegegenstand.
2. `D1_METHOD_DRAFT_V1.json`: exakt durch den bestehenden S0-Reader lesbarer Methodenentwurf; ausschließlich NOT_APPROVED.
3. `D1_METHOD_MANIFEST_V1.json`: unveränderliche E1-Quellpins, D1-Dokumentpins, Entscheidungen, Abnahmefälle und offene Voraussetzungen. Kein selbstbezüglicher Manifesthash.
4. `D1_VALIDATION_V1.json`: tatsächlich ausgeführte lokale Shape-/Referenz-/Hashprüfung; keine neue Hosted-/Quellen-/Runtimeabnahme.
5. `D1_SELF_REVIEW_HANDOFF_V1.md`: Befunde, Dateihashes, offene Lücken, Sicherheitsgrenzen und STOP.

## Vorgehen und Prüfungen

Vorhandene S0/I1/M1/U1/E1-Verträge, AA-Kandidat, kanonische Frische, Tripbindung, #1142-Quelle und D0-Paket werden lokal gelesen. Jeder Pin wird gegen `git show 97629e9:path` und tatsächliche Bytes geprüft. Der echte S0-Reader prüft den neuen Methoden-JSON; relative Dokumentlinks, Blockerliste und Größen-/Zeitverhältnisse werden separat geprüft. Keine Runtimeänderung, Dependency, SQL-Ausführung oder Testschwächung.

Besondere Prüfpunkte sind die nicht übertragbare AA-Pilot-Reisedatumsbindung, vollständige Bedingungen, die unveränderte native Ein-Stunden-Grenze plus kürzere konkrete Bounds, nachvollziehbare optionale Gegenprüfung, fortbestehende Konflikte, originale Quellenzeiten, technische Zustellbestätigung gegenüber menschlichem Lesen und Recovery als neue geprüfte Version.

## Parallelität und Grenzen

Nur D1-Dateien werden geschrieben. S1/N1 bleiben bei ihren eigenen Autoren. Root allein integriert zentrale Architektur-/Kontinuitätsänderungen und veröffentlicht. Kein neuer Source-/Provider-/Researcher-/Hosted-DB-/Auth-/Credentialaufruf, keine Nachricht oder Aktivierung. Die spezifische #917-Verweigerung wird weder wiederholt noch umgangen. Keine neuen alten Ownerbelege oder menschlichen SQL-Ersatz verlangen. Die 17 vollständigen D0-Lücken bleiben bestehen. **do not mark Ready; do not merge; do not start a follow-up slice.** STOP nach Handoff; Rootreview ist ein eigenständiger Schritt.
