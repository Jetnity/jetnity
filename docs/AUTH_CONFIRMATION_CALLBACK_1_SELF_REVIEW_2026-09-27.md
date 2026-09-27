# Auth Confirmation Callback 1 — Self-review

Date: 2026-09-27
Writer: **Jetnity auth confirmation callback 1**, Generation **1**
Session: `bc-bdb579ac-f2b5-452e-8e48-0aeb403f4c4d`
This is an author self-review, not an independent Technical-Lead PASS.

## Modell

Der Auftrag band `cursor-grok-4.6-high-fast`. Der Technical Lead hat diesen Pin im Review als veraltet korrigiert: für neue Sessions gilt Grok 4.7 High Fast. Diese bestehende Session ist `grok-4.7-high-fast` und bleibt es. Es gab keinen Modellwechsel und keinen neuen Agenten.

Der UI-Titel ist `Auth callback PKCE conflict`. Eine programmierbare Umbenennung wurde nicht ausgeführt und nicht behauptet.

## Scope

Geändert in Review-Runde 2: `lib/auth/callback-abschluss.ts`, seine Tests, `lib/supabase/client.ts` (Sitzungsbezug statt Projekt-Boolean), AUTH.md, ARCHITECTURE.md, ADR-0214, Task-Status, Active Work, dieser Status/Handoff/Self-Review.

Nicht geändert: Callback-Komponente, Login, Register, Update-Password-Seite, `erlaubtesNaechstesZiel`, Middleware, Supabase-Host, Abhängigkeiten, `detectSessionInUrl`.

## Verhalten

Der alte Ablauf ist mit den gesperrten Bibliotheken nachgestellt: zwei Tausche, der zweite mit leerem Verifier, Sitzung bleibt, Code weg. Die Abschlussfunktion macht daraus einen Tausch.

Geprüft ausserdem: Client schon vorher initialisiert, Recovery-Verifier, direkte Passwortseite, fremdes `next`, fehlender Verifier bei liegender Sitzung, ungültiger Code, Netzfehler, expliziter URL-Fehler ohne Rohtext, Hash-Recovery, leerer Callback, Sitzung ohne Code, zweiter Aufruf derselben Adresse.

Review-Runde 1 bleibt grün: derselbe Code nach geleertem Glas scheitert; eine code-freie Adresse liest eine später entstandene Sitzung neu; früher und noch laufender Recovery-Tausch gehen nach `/auth/update-password`.

Review-Runde 2 korrigiert eine falsche Behauptung. Der frühere Test „fremde Sitzung“ rief dazwischen einen abgemeldeten Callback auf und hat die Wiederherstellung damit selbst gelöscht. Ohne diesen Besuch bleibt die Wiederherstellung an der Sitzung des Versuchs: nach Abmelden und neuer Anmeldung ist das Ziel `/reisen`. Die direkte Passwortseite merkt keine Callback-Wiederherstellung. Zwei verschiedene Codes und zwei verschiedene Hash-Links teilen sich keinen laufenden Versuch. Der Schlüssel speichert den Link nicht im Klartext und nur, solange der Versuch läuft.

## Ehrliche Lücken

- Kein physisches Gerät, kein erneuter Production-Mail-Klick. #582 ist nicht bestanden.
- Der Bibliotheksnachweis ist kein Live-Trace der iPhone-Sitzung.
- Ein Netzfehler im automatischen Tausch entfernt den Verifier. Die Meldung ist ehrlich, der Link ist danach verbraucht.
- Die deutschen Sätze ersetzen die rohe GoTrue-Meldung. Sie nennen nicht den internen Fehlercode.
- `npm test` 3971/3971, Typecheck, Lint der geänderten Dateien und Production-Build sind grün. Das ersetzt keinen Geräte-Klick.
- `npm run auth:pruefen` ist in dieser Umgebung mit 401 abgebrochen, weil der Ref weder als Projekt noch als Branch angenommen wurde. Das ist kein Callback-PASS und keine hosted Änderung.
- Die Heads `3bce9ff3a4bc230db3c5e7c511fa1c5888bf67cd` und `716d708d1673e2e96c4028d82332a633baf677a4` sind nicht mehr gegated. `origin/main` bleibt `2ae99dc0d37e325fe6a021d6767aca18d24ad4f3`.
- Im lokalen Browser sind der explizite Fehler und der leere Callback geprüft. Der gültige Tausch nicht: dafür bräuchte es einen echten Code.

## Traveller-Kontext

Nicht relevant. Keine Staatsangehörigkeit, kein Dokument, kein Aussteller, kein Wohnsitz.

## Stop

Draft lassen. Nicht Ready. Nicht mergen. Keinen Folgeslice starten.
