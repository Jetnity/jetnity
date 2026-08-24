# Jetnity Account AP-2 – Technical Closure

Stand: 24. August 2026  
Reviewer: ChatGPT / Technical Lead  
PR: #48 – `feat/account-ap2`  
Runtime-Head: `e9b2f834edc925b12e8b5a667f0e4382642eae8f`  
Verdict: **PASS / TECHNICAL CLOSURE** (alter gestapelter Stack)

> Hinweis des Implementierungsagenten, 24. August 2026: Dieses Verdict gilt für den **vor** dem Main-Sync gültigen Runtime-Head `e9b2f834`. Nach Rebase auf `main` `084f7c87` und Retarget von PR #48 ist ein **neuer** unabhängiger Technical-Lead-Integrationsreview auf Runtime-Head `de5ffd8a91576a2281b6d5eda75338504a43b7a7` erforderlich. Dieser Hinweis ist kein neues Technical-Lead-Verdict.

## Unabhängiger Re-Review

Der vorherige Blocker **AP2-B1** ist geschlossen.

Die öffentliche Register-Semantik behandelt nun beide neutralisierten Fälle identisch:

1. bereits bestehendes Konto / `already registered`-Variante,
2. neuer Signup ohne Session.

Beide Pfade laufen durch `registerSignupOeffentlichAuswerten()` auf denselben `registerOeffentlicherErfolg()` und erzeugen damit denselben sichtbaren Post-Submit-Zustand: gleiche neutrale Success-Copy, geleerte Felder, keine Feldfehler und derselbe Fokus auf `#register-erfolg`.

Der Session-Pfad bleibt separat und leitet weiter; fachliche echte Fehler bleiben als Fehler unterscheidbar. Es wird öffentlich weder Kontoexistenz noch ein unbewiesener Mailversand behauptet.

## Verifizierte Nachweise

- `components/auth/RegisterForm.tsx` verwendet nur den zentralen öffentlichen Outcome-Mapper; kein separater Clear-Pfad für Bestandskonto vs. neuen Signup.
- `lib/auth/register-meldung.ts` mappt Bestandskonto-Fehler und Signup ohne Session auf denselben `neutraler-erfolg`-Stand.
- `lib/auth/register-meldung.test.ts` prüft Deep-Equality der Outcomes, identischen Feldzustand und identischen Fokus/A11y-Vertrag.
- GitHub Actions CI auf dem Runtime-Head: **SUCCESS**, Run `32714001669`.
- Vercel Preview auf demselben Runtime-Head: **SUCCESS / READY**, Deployment `G9JnPhBkhejRetPcTMJm82AXeAZn`.
- Nachfolgender Docs-Head `da3813ed...` war ebenfalls GitHub-Actions- und Vercel-grün; er ändert den Runtime-Nachweis nicht.

## Scope / Grenzen

Kein neuer Defekt im freigegebenen AP-2-Scope gefunden. Keine DB-/Migration-/RLS-Änderung, keine Traveller-/Guest→Account-Vertragsänderung, keine Provider-Aktivierung, keine neuen Secrets/Kosten und kein AP-3.

## Governance

Technical Closure ist **keine** Product-Owner-Freigabe für Mark Ready oder Merge.

PR #48 bleibt Draft. AP-3 darf nicht starten. AP-1 / PR #43 ist inzwischen nach `main` gemergt (`084f7c87`); der nachfolgende Main-Sync von AP-2 braucht ein eigenes Integrationsreview und keine automatische Übernahme dieses Verdicts.
