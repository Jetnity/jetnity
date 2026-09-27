# Auth Confirmation Callback 1 — Self-review

Date: 2026-09-27
Writer: **Jetnity auth confirmation callback 1**, Generation **1**
Session: `bc-bdb579ac-f2b5-452e-8e48-0aeb403f4c4d`
This is an author self-review, not an independent Technical-Lead PASS.

## Modell

Der Auftrag bindet `cursor-grok-4.6-high-fast`. `run-info.originalModelName` ist `grok-4.7-high-fast`. Die Session wurde so gestartet. Es gibt in diesem Lauf keinen Wechsel auf 4.6. Die Continuity auf main nennt für neue Sessions Grok 4.7 High Fast. Beides steht hier, damit niemand die Session als 4.6 liest.

Der UI-Titel ist `Auth callback PKCE conflict`. Eine programmierbare Umbenennung wurde nicht ausgeführt und nicht behauptet.

## Scope

Geändert: Callback-Abschluss, Callback-Komponente, fokussierte Tests, zwei bestehende Allowlist-Verweise, AUTH.md, ARCHITECTURE.md, ADR-0214, Task-Status, Active Work, dieser Status/Handoff/Self-Review.

Nicht geändert: `lib/supabase/client.ts`, Login, Register, Update-Password-Seite, `erlaubtesNaechstesZiel`, Middleware, Supabase-Host, Abhängigkeiten.

## Verhalten

Der alte Ablauf ist mit den gesperrten Bibliotheken nachgestellt: zwei Tausche, der zweite mit leerem Verifier, Sitzung bleibt, Code weg. Die Abschlussfunktion macht daraus einen Tausch.

Geprüft ausserdem: Client schon vorher initialisiert, Recovery-Verifier, direkte Passwortseite, fremdes `next`, fehlender Verifier bei liegender Sitzung, ungültiger Code, Netzfehler, expliziter URL-Fehler ohne Rohtext, Hash-Recovery, leerer Callback, Sitzung ohne Code, zweiter Aufruf derselben Adresse.

## Ehrliche Lücken

- Kein physisches Gerät, kein erneuter Production-Mail-Klick. #582 ist nicht bestanden.
- Der Bibliotheksnachweis ist kein Live-Trace der iPhone-Sitzung.
- Ein Netzfehler im automatischen Tausch entfernt den Verifier. Die Meldung ist ehrlich, der Link ist danach verbraucht.
- Die deutschen Sätze ersetzen die rohe GoTrue-Meldung. Sie nennen nicht den internen Fehlercode.
- `npm test` 3960/3960, Typecheck, Lint der geänderten Dateien und Production-Build sind grün. Das ersetzt keinen Geräte-Klick.
- Im lokalen Browser sind der explizite Fehler und der leere Callback geprüft. Der gültige Tausch nicht: dafür bräuchte es einen echten Code.

## Traveller-Kontext

Nicht relevant. Keine Staatsangehörigkeit, kein Dokument, kein Aussteller, kein Wohnsitz.

## Stop

Draft lassen. Nicht Ready. Nicht mergen. Keinen Folgeslice starten.
