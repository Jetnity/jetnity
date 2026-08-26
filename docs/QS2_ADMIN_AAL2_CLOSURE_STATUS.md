# QS-2 Admin AAL2 Closure – Status

Stand: 26. August 2026

Status: **RUNTIME IMPLEMENTIERT / Self-Review und lokale Gates folgen / STOPP für unabhängigen Technical-Lead-Review. Kein Ready. Kein Merge.**

Branch: `fix/qs2-admin-aal2-guard`
Baseline: `main @ 8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`
Finding: `P1-QS2-01`
Task: `docs/QS2_ADMIN_AAL2_CLOSURE_TASK.md`
ADR: ADR-0168

## Freigabe

Product Owner hat die zentrale verpflichtende Admin-AAL2-Regel am 26. August 2026 bestätigt. Das besondere Auth/MFA/AAL-Gate ist für **diesen engen Closure-Slice** erfüllt.

## Was jetzt gilt

Admin-Zugang = verifizierte Identität + ausreichende Rolle/Capability bzw. zulässiger Break-Glass-Pfad + `currentLevel === 'aal2'`.

Die Wahrheit sitzt in `evaluateAdminAccess()`. Nicht im Passwortlogin allein.

- Rolle + AAL1 → kein Admin, Step-up `/admin/mfa`
- Rolle + AAL2 → bestehende Rollen-/Capability-Semantik
- Break-Glass + AAL1 → kein Zugang
- Break-Glass + AAL2 → bestehende Break-Glass-Oberfläche, keine DB-Rechte
- unzureichende Rolle + AAL2 → forbidden
- Rollen-Lookup kaputt → lookup-failed
- AAL-Lookup kaputt → aal-lookup-failed / fail closed
- `requireAdminApi()` → maschinenlesbare 403/503, kein HTML-Redirect
- Return-Ziele nur interne Admin-Pfade; `/admin/login` und `/admin/mfa` sind keine Ziele
- kein TOTP-Faktor → kein Bypass, ehrlicher Weg nach `/account/security`

`/admin/mfa` liegt in `(public)` und nicht hinter `requireAdminPage`. Die Middleware verlangt weiterhin eine Sitzung.

## Parallelität

D0-2 (#74) Runtime unberührt. Audit-Korrekturen #75–#77 docs-only, unberührt. PR #75 trägt ein Product-Decision-Update (Create-Entry-Cut / Severity-Korrektur), keinen Auth-Runtime-Konflikt.

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## Nächster Schritt

Lokale und Exact-Head-Gates, danach **STOPP** für unabhängigen ChatGPT-/Technical-Lead-Review von Anfang an.
