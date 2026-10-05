# Jetnity – AP-5 Gate 0 Account Security Capability Audit

Stand: 28. August 2026  
Issue: #128  
Typ: **AUDIT / ARCHITECTURE / EVIDENCE ONLY**  
Status: **AUTHOR COMPLETE ON DRAFT / NO AP-5 RUNTIME / AWAITING INDEPENDENT TL REVIEW**  
Cursor-Agent: `Account plattform audit vorbereitung 8`  
Branch: `cursor/ap5-gate0-auth-session-mfa-79f9`  
Start-Baseline: `main @ 0bca31b5de06bcee74c5436122b1685b6d2092f6`

## 1. Ziel

Den tatsächlichen Auth-/Session-/MFA-Vertrag auf aktuellem `main` rekonstruieren und belastbar feststellen, welche AP-5-Funktionen danach **ohne neue Auth-Architektur** gebaut werden dürfen.

Dieses Gate 0 startet **keine** AP-5-Runtime.

## 2. Pflicht-Rekonstruktion

Live geprüft:

1. `origin/main` = `0bca31b5de06bcee74c5436122b1685b6d2092f6` (PR #127);
2. Issue #128;
3. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`;
4. `docs/AUTH.md`;
5. `supabase/config.toml`;
6. `/account/security`, Auth-Helfer, Login/Recovery/Logout, MFA-Client;
7. installiertes `@supabase/auth-js` 2.71.1 / `@supabase/supabase-js` 2.57.2;
8. `npm run auth:pruefen` gegen den Development-Branch, nur lesend.

## 3. Untersuchungsfragen

1. Eingeloggte Passwortänderung unter `secure_password_change` / Reauthentication. Kein Current-Password-Submit erfinden.
2. Welche Session-/Geräte-Sichtbarkeit die aktuelle User-API ohne Schema und ohne Service Role hergibt.
3. Logout current / others / all und die echte Semantik des heutigen `signOut()`.
4. MFA-Enroll/Unenroll und vorhandenes oder fehlendes Step-up. UI ≠ Auth-Authority.
5. Client-/Server-Grenze, Redirects, Enumeration, Error Leakage, Logging.
6. Privacy von Session-/Geräte-Metadaten.
7. `empty` / `unsupported` / `unavailable` / `error` getrennt.
8. Kleine AP-5-Folgeslices mit TL-Gate vs. Product-Owner-Sondergate.

## 4. Harte Grenzen

Nicht implementieren:

- AP-5-Runtime;
- C2, REVOKE, SECURITY DEFINER;
- Auth-Config-Push;
- Consumer-AAL2;
- OAuth-/Passkey-Live;
- Migration, RLS, Ownership, Identity;
- Supabase-Mutation, Production-Daten;
- AP-6/AP-7;
- Passnummern, Scans, MRZ, Biometrie.

## 5. Output

- dieser Task;
- Status, Handoff, Self-Review, Agent-Rotation;
- ADR-0182 nur für die Gate-0-Vertragsfeststellung;
- statischer Inventory-Test;
- Continuity-Zeiger.

## 6. Stop-Regel

Author endet nach Evidence + Slice-Schnitt + Self-Review.

**Nicht Ready. Nicht mergen. Kein Runtime-Folgeslice.**
