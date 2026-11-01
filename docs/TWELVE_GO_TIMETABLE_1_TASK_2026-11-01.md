# 12Go Timetable 1 — native Streckeninformationen

Stand: 2026-11-01. Umsetzung: Codex, ein Writer. Basis: `ab37bd4601f322b0ef72367bec9f0ce2bd4eb09a`.

## Auftrag und Grenze

Der Product Owner möchte vor dem Absprung zu 12Go möglichst hilfreiche Informationen direkt im bestehenden Jetnity-Workspace sehen. Das offizielle Partnerportal stellt dafür neben Such-, Stadt- und Länderwidgets einen serverseitigen Timetable-Dienst bereit. Die am 1. November aus dem angemeldeten Partnerportal heruntergeladene PHP-Referenz v2.0 dokumentiert den Abruf. Deutsch und CHF wurden mit einer echten lesenden Anfrage für Bangkok–Koh Chang bestätigt.

Quellen: https://agent.12go.asia/timetable, https://agent.12go.asia/timetable/css, https://agent.12go.asia/timetable/example, https://agent.12go.asia/timetable-get/ . SHA256 des unveränderten PHP-Downloads: `fa53ce2b40e2011414d645cf1b393812996a385d14a12166099e8cc7daad0431`.

Dieser Slice ist **kein Wiederanlauf von PR #1086** (allgemeines Suchwidget). Dessen HOLD, Widget-Host, CMP-Status und fehlender Rollback-Nachweis werden nicht geändert. Der neue Dienst liefert allgemeine Streckeninformationen, keine Verfügbarkeit für einen konkreten Reisetag. Eine Buchungs-API wird nicht eingeführt. Die erste Fassung bleibt in Production geschlossen, bis eine eigene Abnahme und eine explizite Aktivierungsentscheidung vorliegen.

## Umsetzungsplan

- Bestehende benachbarte Etappenvorkommen aus `twelveGoKantenFuerReise` wiederverwenden. Wiederholte Orte behalten ihre Vorkommensidentität; keine zusätzlichen diagonalen Verbindungen, keine automatische Reiseänderung.
- Eine ausgewählte Strecke mit Verkehrsmitteln, Anbieter-Preisspannen in CHF, typischen Fahrtdauern und Abfahrtsangaben zeigen. Preise nicht als Personen-/Gesamtreisepreis interpretieren. Reisedatum, Reisende, aktuelle Preise und Verfügbarkeit bei 12Go prüfen.
- Serverseitiger, begrenzter lesender Abruf ausschließlich beim dokumentierten 12Go-Host. Nur bestätigte Ortskennungen, Land und Ortsnamen annehmen. Keine Reise-, Nutzer- oder Teilnehmerdaten an den Anbieter.
- Anbieter-HTML strikt in geprüfte Textdaten und erlaubte Affiliate-URLs umwandeln. Kein fremdes HTML, Script, iframe oder CSS in Jetnity ausführen. Nur exakt passende Strecke anzeigen; nahe Flughäfen/andere Ziele nicht als Treffer ausgeben.
- Leere Ergebnisse, unbekannte Zuordnung, gesperrter Dienst und Ausfälle unterscheiden. Bisherigen Affiliate-Ausgang als Rückfall erhalten.
- Serverseitige Aktivierung, begrenzte Antwortgröße, Timeout, feste Quelle, keine Weiterleitungen, Anfragebegrenzung, begrenzter Cache und zusammengefasste parallele Abrufe. Keine Schlüssel, keine neue Datenbank, keine Migration, keine neue kostenpflichtige Infrastruktur. Prozesslokale Grenzen sind ausdrücklich keine globalen Produktionsquoten.

## Betroffene Bereiche

`lib/providers/twelve-go/timetable/*`, eine dedizierte lesende API-Route, eine native Trip-Komponente und die bestehende 12Go-Fläche; gezielte Tests und Dokumentation. Ein HTML-Parser kann als kleine Laufzeitabhängigkeit hinzukommen. Keine Änderungen an Supabase, Reisegraph, Buchungsstatus, Provider-Schlüsseln, bestehenden Gates oder anderen Anbietern.

## Abnahme

- Echte Antwortstruktur und Affiliate-ID `17323861`; Datum und Personen werden nicht als übertragen behauptet. Keine nachgewiesene Provision ohne separaten Nachweis.
- Bangkok–Koh Chang–Phuket, mehrere Orte im selben Land, wiederholte Orte, unbekannte/mehrdeutige Ziele, veraltete Antwort nach Kontextwechsel.
- Parser: fremde/unsichere Links, falsche Partnerkennung, fehlende Währung, benachbarte Flughäfen, ungültiges Markup und Providerfehler.
- Anfrage: Input, Body-/Antwortlimit, Timeout, Redirect-Abweisung, Rate-/Cachegrenzen, Production-Aus und keine externen Browserressourcen.
- Desktop, 390/320 px, Tastatur, vergrößerter Text, Hell/Grün; echte Weiterleitung vor jeder Buchung beenden.
- Relevante Tests, Typecheck, Lint, Build und Hygiene; unabhängiger Review des fertigen Heads. Kein PASS für nicht ausgeführte Prüfungen.

Status: Implementiert und lokal geprüft, Draft PR #1101. Anbieterbelege, Browserergebnisse, Prüfgrenzen und noch offene Release-Gates stehen in `docs/TWELVE_GO_TIMETABLE_1_EVIDENCE_2026-11-01.md`. Noch keine Veröffentlichung oder Aktivierung.
