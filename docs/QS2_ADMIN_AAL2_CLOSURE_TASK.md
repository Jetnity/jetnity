# Jetnity – QS-2 Admin AAL2 Closure

Stand: 26. August 2026
Typ: **enger Security-/Auth-/RLS-Closure-Slice**
Branch: `fix/qs2-admin-aal2-guard`
Ursprüngliche Baseline: `main @ 8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`
Aktueller `main` / Merge-Base: `3b317bc677c9d868d1fd8ba75bfa3624ea6b7b73`
Runtime-/Gate-Head der Revalidierung: `05f945d7f2783c8c0f68ade33d61cb240629622d`
ADR: ADR-0169 (auf dem Branch zuerst als 0168 geführt; nach Integration von #81/#84/#83 umnummeriert)
Finding: **P1-QS2-01**

## Product-Owner-/Technical-Lead-Entscheidungen

Am 26. August 2026 wurde ausdrücklich freigegeben:

> **Für jeden Zugriff auf den Jetnity-Admin-Bereich ist AAL2 verpflichtend. Die Regel muss zentral und Entry-Path-unabhängig gelten.**

Nach unabhängiger Technical-Lead-Prüfung wurde zusätzlich festgestellt, dass der Application-Guard allein die direkte Supabase/PostgREST-Datenebene nicht schließt. Daraufhin hat der Product Owner am 26. August 2026 ausdrücklich **Admin RLS AAL2** freigegeben.

Die zweite Freigabe gilt ausschließlich für das enge Hardening der bestehenden administrativen DB-Fähigkeiten. Sie autorisiert **keinen** allgemeinen RLS-, Ownership-, Rollen- oder Auth-Umbau und **keine Production-Migration vor erneutem Review**.

## Problem

Auf der Baseline prüft `lib/auth/admin-guard.ts` verifizierte Identität, Rolle/Capability und Break-Glass, aber nicht den Authenticator Assurance Level. Der erste Teil dieses Slices schließt diese Application-Layer-Lücke zentral.

Die unabhängige Review zeigte danach einen zweiten Pfad: Die produktiven DB-Policies und SECURITY-DEFINER-Admin-RPCs verwenden die Fähigkeiten `public.darf_*()`. Diese Fähigkeiten prüften bisher nur die Mindestrolle. Ein gültiges AAL1-JWT eines echten Moderator-/Operator-/Admin-/Owner-Kontos konnte deshalb die direkte Datenebene erreichen, obwohl `/admin` und `/api/admin` bereits AAL2 verlangen.

## Verbindliches Ziel

Admin-Zugang bedeutet künftig auf **beiden Ebenen**:

**verifizierte Identität + ausreichende Rolle/Capability bzw. zulässiger Break-Glass-Pfad + aktuelles AAL2.**

Application Layer:

- Passwortlogin;
- Magic Link;
- OAuth;
- bestehende Sessions;
- Admin-Seiten;
- Admin-Server-Actions;
- Admin-API-Routen.

Data Plane:

- direkte Supabase/PostgREST-Zugriffe auf administrativ sichtbare oder schreibbare Tabellen;
- administrative SECURITY-DEFINER-RPCs;
- alle bestehenden DB-Fähigkeiten aus `CAPABILITY_MINIMUM` / `public.darf_*()`.

Keine Eintrittsroute und keine Datenebene darf eine eigene schwächere Admin-AAL-Wahrheit haben.

## Fail-closed Semantik

- keine verifizierte Session -> bestehende unauthenticated-Semantik;
- Rolle/Capability nicht ausreichend -> bestehende forbidden-/lookup-failed-Semantik;
- Admin-Berechtigung vorhanden, aber Application-`currentLevel !== 'aal2'` -> **AAL2-Step-up erforderlich, kein Admin-Zugriff**;
- Fehler beim Lesen des Application-AAL -> **fail closed**, kein Admin-Zugriff;
- DB-JWT ohne `aal='aal2'` -> **administrative Fähigkeit false**, kein direkter Admin-Datenzugriff;
- `aal2` -> bestehende Mindestrollen-/Capability-Regeln gelten weiter;
- Break-Glass umgeht AAL2 nicht und bekommt weiterhin keine zusätzlichen DB-Rechte.

AAL1 darf niemals durch Faktor-Existenz, `nextLevel` oder andere Metadaten mit AAL2 gleichgesetzt werden. In der Datenbank ist ausschließlich der signierte Supabase-JWT-Claim `auth.jwt()->>'aal'` maßgeblich.

## UX / Step-up

Der Slice stellt einen loop-freien Step-up-Pfad bereit:

- bereits authentifizierter Admin mit AAL1 kann TOTP-Challenge durchführen und danach zum sicheren Admin-Ziel zurückkehren;
- Admin ohne verifizierten TOTP-Faktor bleibt ausgesperrt und erhält den bestehenden Account-Security-Pfad;
- kein OAuth-/Magic-Link-Redirect-Loop;
- Return-Target nur interne Admin-Ziele, kein Open Redirect;
- `/admin/mfa` liegt nicht hinter `requireAdminPage`, bleibt aber über Middleware an eine verifizierte Sitzung gebunden;
- öffentliche Fehlermeldungen verraten keine Rolle/Allowlist.

## Admin API

`requireAdminApi()` erzwingt AAL2 zentral. Ablehnung bleibt maschinenlesbar und fail-closed; kein erfolgreicher HTML-Redirect.

## Admin Data Plane

Verbindliche Umsetzung:

- neue reine DB-Hilfsfunktion `public.aktuelles_admin_aal2()`;
- fail closed: nur `(select auth.jwt()->>'aal') = 'aal2'` ergibt true;
- die bestehenden fünf administrativen Fähigkeiten behalten exakt ihre bisherigen Mindestrollen und verlangen zusätzlich `public.aktuelles_admin_aal2()`;
- bestehende Policies müssen nicht einzeln neu erfunden werden, weil sie bereits über diese Fähigkeiten laufen;
- bestehende SECURITY-DEFINER-Admin-RPCs bleiben an dieselben Fähigkeiten gebunden und übernehmen damit dieselbe AAL2-Grenze;
- Consumer-/Owner-Self-Service-Pfade bleiben unverändert: z. B. eigenes Profil bleibt anhand Ownership zugänglich; nur der administrative Fremdzugriff verlangt AAL2.

Migration: `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`.

## Scope

Erlaubt sind ausschließlich Änderungen, die P1-QS2-01 schließen:

- `lib/auth/admin-guard.ts` / `lib/auth/admin-access.ts`;
- enger Application-AAL-Helper;
- Admin-Login-/Step-up-Fläche;
- bestehende MFA-Komponenten nur zur Wiederverwendung;
- `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`;
- gezielte Application- und DB-Contract-Tests;
- Slice-/ADR-/Evidence-Dokumentation.

## Nicht im Scope

- kein allgemeiner Supabase-Auth-Umbau;
- keine Session-Lifetime-/Refresh-Architekturänderung;
- keine neue Auth-Methode oder Passkey-Einführung;
- kein allgemeiner RLS-/Ownership-Umbau;
- keine Rollen-/Capability-Neudefinition;
- kein Guest→Account-Fix P1-QS2-02;
- kein Admin D–K-/Growth-Runtime;
- keine Payment-/Refund-/Provider-Produktänderung;
- keine neuen Secrets oder paid calls;
- kein D0-2/TW-6;
- **keine Production-Migration / kein Supabase-Branch-Merge vor erneutem Technical-Lead-Review**;
- `docs/ACTIVE_WORK_STATUS.md` nicht durch den Implementierungsagenten ändern.

## Tests – Mindestmatrix

Application:

1. unauthenticated -> kein Admin;
2. Admin-Rolle + AAL1 -> Seite blockiert/Step-up;
3. Admin-Rolle + AAL2 -> Zugriff;
4. Break-Glass + AAL1 -> blockiert/Step-up;
5. Break-Glass + AAL2 -> bestehende Break-Glass-Semantik;
6. unzureichende Rolle + AAL2 -> forbidden;
7. Role lookup failure + AAL2 -> fail closed;
8. AAL lookup error -> fail closed;
9. API + Admin-Rolle + AAL1 -> kein Zugriff;
10. API + Admin-Rolle + AAL2 -> bestehender Zugriff;
11. Passwortlogin darf AAL1 nicht direkt nach `/admin` freigeben;
12. Magic-Link/OAuth/bestehende AAL1-Session können Guard nicht umgehen;
13. Step-up erfolgreich -> AAL2 und sichere Rückkehr;
14. kein TOTP-Faktor -> kein Bypass;
15. manipuliertes Return-Target -> kein Open Redirect;
16. bestehende Rollen-/Capability-/Break-Glass-Tests bleiben korrekt.

Data Plane:

17. signierter Admin-/Owner-Kontext + `aal1` -> `public.aktuelles_admin_aal2() = false`;
18. derselbe Kontext + `aal1` -> administrative `public.darf_*()`-Fähigkeit false;
19. derselbe Kontext + `aal1` -> direkte RLS-geschützte Admin-Zeile nicht sichtbar/schreibbar;
20. derselbe Kontext + `aal2` -> Mindestrollen-/Capability-Zugriff funktioniert weiter;
21. AAL1 -> administrative SECURITY-DEFINER-RPC liefert keine Admin-Daten;
22. AAL2 -> dieselbe RPC funktioniert für berechtigte Rolle;
23. fehlender/anderer `aal`-Claim -> fail closed;
24. niedrige Rolle + AAL2 -> weiterhin keine administrative Fähigkeit;
25. Capability-Mindestrollen bleiben identisch zu `CAPABILITY_MINIMUM`.

## Gates

Vor erneutem Technical-Lead-Review:

- gezielte Admin/Auth/AAL/MFA-/DB-Contract-Tests;
- Development-Supabase-Repro für direkte PostgREST/RLS- und SECURITY-DEFINER-Grenze;
- `npm test` vollständig;
- `npm run typecheck`;
- `npm run lint`;
- `npm run check:setup:ci`;
- relevante Security-/API-/Schema-/DB-Hygiene-Gates;
- `npm run build`;
- finaler Scope-Diff;
- Ahead/Behind/Merge-Base;
- Exact-Head GitHub Actions;
- Exact-Head Vercel;
- Review-Threads.

## STOPP

Der PR bleibt Draft. Integration auf `main @ 3b317bc` und Revalidierung auf Runtime-Head `05f945d7` sind erfolgt. Kein Ready, kein Merge, keine Production-Migration und kein Folgeslice vor erneutem unabhängigen ChatGPT-/Technical-Lead-Review.