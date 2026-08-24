# Jetnity Account AP-2 – Blocker AP2-B1 Fix

Stand: 24. August 2026
Status: **REQUEST CHANGES – nur AP2-B1 beheben**
Branch: `feat/account-ap2`
PR: #48
Agent: `Account plattform audit vorbereitung`

## Ausgangslage

Der unabhängige Technical-Lead-Review von AP-2 hat einen konkreten Restblocker gefunden.

Die öffentliche Register-Copy ist bereits neutralisiert. Der sichtbare Formularzustand unterscheidet aber weiterhin zwischen:

1. echtem neuen Signup ohne sofortige Session und
2. neutralisiertem `already registered` / Bestandskonto-Pfad.

Aktuell werden beim echten neuen Signup Name/E-Mail/Passwortfelder geleert, während sie beim neutralisierten Bestandskonto-Pfad stehen bleiben. Dadurch kann die UI trotz neutraler Meldung weiterhin Information über die wahrscheinliche Kontoexistenz preisgeben.

## Pflichtfix AP2-B1

Beide öffentlich neutralisierten Outcomes müssen aus Sicht des Nutzers denselben beobachtbaren Post-Submit-Zustand erzeugen.

Mindestens angleichen:

- sichtbare Success-/Info-Copy,
- Formular-/Feldzustand,
- Loading-/Disabled-Zustand,
- Fokus-/A11y-Semantik,
- sonstige sichtbare oder per Assistive Technology wahrnehmbare Unterschiede.

Die interne Diagnose darf weiterhin präzise sein; öffentlich darf daraus keine Kontoexistenz ableitbar werden.

## Architekturgrenzen

Nur AP2-B1 beheben.

Nicht ändern:

- kein AP-3,
- keine DB-Migration,
- kein Schema/RLS,
- keine Auth-/MFA-/AAL-Vertragsänderung,
- keine Provider-Aktivierung,
- keine Secrets/API-Keys,
- kein `config.toml`-Production-Push,
- keine Guest→Account-Vertragsänderung,
- kein Admin-Scope.

## Pflichtregressionen

Neue/erweiterte Tests müssen nicht nur die Copy prüfen, sondern die öffentliche Outcome-Semantik absichern:

1. Bestandskonto-neutralisiert und neuer Signup ohne Session führen zum gleichen öffentlichen Success-State.
2. Beide führen zum gleichen Feldzustand.
3. Kein unterschiedlicher Fokus-/A11y-Zustand leakt die Variante.
4. Bestehende AP-2-Regressionen bleiben grün.
5. `next`-Allowlist, OAuth-Fail-Closed, `getUser()`-Gates, Gast-CTA, Footer-Sessionnavigation und MFA-A11y bleiben unverändert grün.

## Abschluss-Gate

Nach dem Fix:

- relevante Unit-/Contract-Tests,
- vollständiges `npm test`,
- Typecheck,
- Lint,
- Hygiene,
- Auth-Konfigurationscheck,
- Production-Build,
- bestehende Account/Auth-UI-Audits soweit im Repository vorgesehen,
- Runtime-Head pushen,
- GitHub Actions SUCCESS auf genau diesem Runtime-Head,
- Vercel Preview READY auf demselben Runtime-Head,
- Handoff/Self-Review aktualisieren,
- dann stoppen und auf unabhängigen Technical-Lead-Re-Review warten.

**Kein Mark Ready. Kein Merge. Kein AP-3.**
