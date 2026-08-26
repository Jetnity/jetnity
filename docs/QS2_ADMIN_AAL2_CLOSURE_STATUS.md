# QS-2 Admin AAL2 Closure – Status

Stand: 26. August 2026

Status: **RUNTIME IMPLEMENTIERT / lokale Gates grün / Exact-Head CI+Vercel folgen / STOPP für unabhängigen Technical-Lead-Review. Kein Ready. Kein Merge.**

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

## Adversarial Self-Review

- Magic-Link-Ziel bleibt `${site}/admin`; der Guard fängt AAL1 und leitet auf `/admin/mfa`. Kein Loop, weil Step-up nicht `requireAdminPage` aufruft.
- Consumer-OAuth/`next` kann `/admin` nicht setzen (`erlaubtesNaechstesZiel`). Eine spätere Navigation auf `/admin` trifft denselben Guard.
- Bestehende AAL1-Session: Layout-Guard, kein Login-Bypass.
- Break-Glass ohne AAL2: blockiert, bevor die Oberfläche öffnet.
- API: weiterhin `NextResponse.json`, nie Redirect.
- Open Redirect: `erlaubtesAdminZiel` verwirft fremde Hosts, Consumer-Pfade, Login- und Step-up-Ziele.
- Öffentliche Meldungen enthalten keine Allowlist/Rolle/E-Mail.
- Grössere Auth-/Session-Architektur war nicht nötig; kein STOPP aus diesem Grund.

Residual: Es gibt keinen Live-Browser-TOTP gegen ein echtes Admin-Konto in dieser Umgebung. Die serverseitige Wahrheit und die Matrix sind unit-/source-getestet; `auth:pruefen` bleibt 55/55 inkl. `mfa_allow_low_aal = false`.

## Lokale Gates (dieser Arbeitsstand)

- `npm test` — 2038/2038 pass
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run check:setup:ci` — pass
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` — pass
- `npm run auth:pruefen` — 55/55
- `npm run build` — pass, Route `/admin/mfa` vorhanden

## Parallelität

- `main` unverändert `8ab4e666`, Merge-Base identisch, behind 0
- D0-2 (#74) Runtime unberührt
- #75–#77 Audit-only unberührt
- PR #75 Product-Decision-Update: Create-Entry-Cut / Severity-Korrektur, kein Auth-Runtime-Konflikt
- Review-Threads auf #80: keine menschlichen Reviews

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## Nächster Schritt

Exact-Head GitHub Actions und Vercel auf dem Push-Head belegen, danach **STOPP** für unabhängigen ChatGPT-/Technical-Lead-Review von Anfang an.
