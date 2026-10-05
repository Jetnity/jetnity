# Cursor-Auftrag – Phase 3.3c: Audit-Route Production-Fail-Closed

Stand: 21. August 2026

## Ausgangspunkt

Arbeite weiter auf `phase-3-3-activities-foundation` im bestehenden Draft-PR #24. Phase 3.3 und 3.3b sind fachlich und hinsichtlich Browser-/Mobile-Abnahme abgeschlossen. Dieser Auftrag schliesst nur noch eine kleine Fail-Closed-Lücke der internen UI-Audit-Route.

Aktueller Head vor diesem Auftrag: `b17065a110ca98ad645dc6a20af69b11ed52baf1`.

## Befund

`app/(public)/ui-audit/activities/page.tsx` ist aktuell nur durch `JETNITY_UI_AUDIT` geschützt. Damit wäre die Route theoretisch erreichbar, falls diese Variable in Production versehentlich auf `1`/`true` gesetzt würde.

Für Jetnity gilt jedoch: interne Audit-/Testflächen müssen in Production **unabhängig von einer versehentlichen Feature-/Audit-Variable immer fail closed** bleiben.

## Auftrag

Härte ausschließlich diesen Pfad:

- `VERCEL_ENV=production` muss für `/ui-audit/activities` **immer 404** ergeben.
- `JETNITY_UI_AUDIT=1|true` darf die Seite nur außerhalb von Production aktivieren.
- Fehlende/andere Werte bleiben 404.
- Keine Änderung am normalen Activities-Produktweg.
- Keine Fake-Daten in Production.
- Keine neue Dependency, kein Provider, kein Secret, keine Migration, keine laufenden Kosten.

Bevorzuge eine kleine, explizite und testbare Lösung. Wenn sinnvoll, kapsle die Entscheidung in eine kleine pure Funktion und teste mindestens:

1. Production + Audit=true → aus
2. Preview/Development + Audit=true → an
3. Preview/Development + Audit=false/fehlend → aus
4. unbekannte Umgebung → nur mit explizitem Audit-Flag an, sofern nicht Production

Die bestehende Audit-Ausführung `npm run audit:activities` muss weiter funktionieren.

## Danach vollständig prüfen

- `npm test`
- Typecheck
- Lint
- Hygiene-Checks
- Production-Build
- `npm run audit:activities`
- GitHub CI
- Vercel Preview

PR #24 bleibt Draft. Nicht mergen und nichts in Production ändern.

## Abschlussbericht

Kurz berichten:

- welche Datei(en) geändert wurden
- wie Production jetzt unabhängig vom Audit-Flag fail closed ist
- Tests/Audit/CI/Vercel
- neuer Head-Commit
- ausdrücklich: kein Provider, kein Secret, keine Migration, keine Production-Änderung, kein Merge
