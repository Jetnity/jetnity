# Jetnity – QS-2 Admin AAL2 Closure

Stand: 26. August 2026
Typ: **enger Security-/Auth-Closure-Slice**
Branch: `fix/qs2-admin-aal2-guard`
Baseline: `main @ 8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`
Finding: **P1-QS2-01**

## Product-Owner-/Technical-Lead-Entscheidung

Am 26. August 2026 wurde ausdrücklich freigegeben:

> **Für jeden Zugriff auf den Jetnity-Admin-Bereich ist AAL2 verpflichtend. Die Regel muss zentral und Entry-Path-unabhängig gelten.**

Damit ist das besondere Product-Owner-Gate für diese gezielte AAL-/MFA-Änderung erfüllt. Diese Freigabe gilt nur für diesen engen Closure-Scope; sie autorisiert keinen allgemeinen Auth-/Session-Umbau.

## Problem

Auf der Baseline prüft `lib/auth/admin-guard.ts` verifizierte Identität, Rolle/Capability und Break-Glass, aber nicht den Authenticator Assurance Level. `app/(public)/admin/login/actions.ts` kann nach Passwortlogin und erfolgreicher Rollenprüfung direkt nach `/admin` weiterleiten. Magic-Link, OAuth oder eine bereits bestehende AAL1-Sitzung können denselben zentralen Admin-Guard erreichen.

Der Consumer-Login kennt bereits AAL2/TOTP-Step-up (`lib/auth/mfa.ts`, `components/auth/LoginForm.tsx`, `components/auth/MFATotpDialog.tsx`). Das ersetzt aber keinen serverseitigen Admin-Guard.

## Verbindliches Ziel

Admin-Zugang bedeutet künftig immer:

**verifizierte Identität + ausreichende Admin-Rolle/Capability bzw. zulässiger Break-Glass-Pfad + `currentLevel === 'aal2'`.**

Der AAL2-Check muss zentral serverseitig erfolgen, sodass er gleichermaßen für:

- Passwortlogin,
- Magic Link,
- OAuth,
- bereits bestehende Sessions,
- Admin-Seiten,
- Admin-Server-Actions,
- Admin-API-Routen

gilt.

Keine Eintrittsroute darf eine eigene schwächere Admin-AAL-Wahrheit haben.

## Fail-closed Semantik

- keine verifizierte Session -> bestehende unauthenticated-Semantik;
- Rolle/Capability nicht ausreichend -> bestehende forbidden-/lookup-failed-Semantik;
- Admin-Berechtigung vorhanden, aber `currentLevel !== 'aal2'` -> **AAL2-Step-up erforderlich, kein Admin-Zugriff**;
- Fehler beim Lesen des AAL -> **fail closed**, kein Admin-Zugriff;
- `aal2` -> bestehende Rollen-/Capability-/Break-Glass-Regeln gelten weiter;
- Break-Glass darf AAL2 **nicht** umgehen.

AAL1 darf niemals durch die bloße Existenz eines TOTP-Faktors oder `nextLevel` mit AAL2 gleichgesetzt werden. Entscheidend für Admin-Zugriff ist die aktuell erreichte Assurance (`currentLevel`).

## UX / Step-up

Der Slice muss einen klaren, loop-freien Step-up-Pfad bereitstellen oder einen vorhandenen belastbaren Pfad wiederverwenden.

Anforderungen:

- bereits authentifizierter Admin mit AAL1 kann TOTP-Challenge durchführen und danach zum sicheren Admin-Ziel zurückkehren;
- ein Admin ohne geeigneten verifizierten TOTP-Faktor bleibt aus `/admin` ausgesperrt und erhält eine ehrliche Möglichkeit/Anweisung zur MFA-Einrichtung über den bestehenden Account-Security-Pfad; kein stiller Bypass;
- kein OAuth-/Magic-Link-Redirect-Loop zwischen `/admin` und Login;
- Return-Target muss auf sichere interne Admin-Ziele begrenzt werden; kein Open Redirect;
- Step-up-/Setup-Flächen selbst dürfen nicht hinter dem Admin-AAL2-Guard liegen, sonst entsteht ein Deadlock;
- sensible Fehlermeldungen verraten öffentlich keine Admin-Rolle/Allowlist.

Bestehende MFA-Komponenten/Contracts bevorzugt wiederverwenden statt einen zweiten MFA-Stack zu erfinden.

## Admin API

`requireAdminApi()` muss AAL2 ebenfalls zentral erzwingen. Der Response muss maschinenlesbar fail-closed sein und darf nicht als erfolgreicher HTML-Redirect enden. Bestehende 401/403/503-Semantik darf nur bewusst und getestet erweitert werden.

## Scope

Erlaubt sind ausschließlich Änderungen, die für P1-QS2-01 nötig sind, insbesondere in:

- `lib/auth/admin-guard.ts`;
- `lib/auth/admin-access.ts` nur wenn ein sauberer neuer Denial-/Response-Vertrag nötig ist;
- enger serverseitiger AAL-Helper, falls architektonisch sinnvoll;
- Admin-Login-/Step-up-Fläche;
- bestehende MFA-Komponenten nur soweit für Wiederverwendung nötig;
- gezielte Tests;
- Slice-Status-/Evidence-Dokumentation.

## Nicht im Scope

- kein allgemeiner Supabase-Auth-Umbau;
- keine Session-Lifetime-/Refresh-Architekturänderung;
- keine neue Auth-Methode;
- keine Passkey-Produkteinführung;
- kein RLS-/Ownership-Umbau;
- keine Rollen-/Capability-Neudefinition;
- kein Guest→Account-Fix P1-QS2-02;
- kein Admin D–K-/Growth-Runtime;
- keine Payment-/Refund-/Provider-Änderung;
- keine DB-Migration;
- keine neuen Secrets oder paid calls;
- kein D0-2/TW-6;
- `docs/ACTIVE_WORK_STATUS.md` nicht durch den Agenten ändern.

## Tests – Mindestmatrix

Die Tests müssen die Semantik beweisen, nicht nur Wiring.

Mindestens:

1. unauthenticated -> kein Admin;
2. Admin-Rolle + AAL1 -> Seite blockiert/Step-up;
3. Admin-Rolle + AAL2 -> Zugriff;
4. Break-Glass + AAL1 -> blockiert/Step-up;
5. Break-Glass + AAL2 -> bestehende Break-Glass-Semantik;
6. unzureichende Rolle + AAL2 -> weiterhin forbidden;
7. Role lookup failure + AAL2 -> weiterhin fail closed;
8. AAL lookup error -> fail closed;
9. API + Admin-Rolle + AAL1 -> kein Zugriff, maschinenlesbare Ablehnung;
10. API + Admin-Rolle + AAL2 -> bestehender Zugriff;
11. Passwortlogin mit Admin-Berechtigung darf AAL1 nicht direkt nach `/admin` freigeben;
12. Magic-Link/OAuth/bestehende AAL1-Session können den Guard nicht umgehen;
13. Step-up erfolgreich -> AAL2 und sichere Rückkehr;
14. kein TOTP-Faktor -> kein Admin-Bypass, ehrliche Setup-Grenze;
15. externes/manipuliertes Return-Target -> kein Open Redirect;
16. bestehende Admin-Role-/Capability-/Break-Glass-Tests bleiben semantisch korrekt.

## Gates

Vor Technical-Lead-Review:

- gezielte Admin/Auth/AAL/MFA-Tests;
- `npm test` vollständig;
- `npm run typecheck`;
- `npm run lint`;
- `npm run check:setup:ci`;
- relevante Security-/API-Schutz-/Hygiene-Gates;
- `npm run build`;
- adversarial Self-Review einschließlich Login-, OAuth-, Magic-Link-, Session- und API-Bypass-Szenarien;
- finaler Scope-Diff;
- Ahead/Behind/Merge-Base;
- Exact-Head GitHub Actions;
- Exact-Head Vercel;
- Review-Threads.

## STOPP

Der implementierende Agent setzt den PR **nicht Ready**, merged nicht und startet keinen Folgeslice. Nach vollständiger Evidence: **STOPP für unabhängigen ChatGPT-/Technical-Lead-Review von Anfang an.**
