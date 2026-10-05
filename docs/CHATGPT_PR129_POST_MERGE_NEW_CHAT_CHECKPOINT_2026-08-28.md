# Jetnity – PR #129 Post-Merge New-Chat Checkpoint

Stand: 28. August 2026

Status: **PR #129 AP-5 Gate 0 ist nach unabhängigem Technical-Lead-Re-Review auf `main` integriert. Keine AP-5-Runtime wurde gestartet. Kein automatischer Folgeslice. Live-Evidence gewinnt immer.**

## Verifizierte Integrationslinie

- Vor-Merge `main`: `0bca31b5de06bcee74c5436122b1685b6d2092f6` (PR #127)
- PR #129: `AP-5 Gate 0: reconstruct existing Auth/Session/MFA contract`
- Author-Agent: `Cursor-Agent: Account plattform audit vorbereitung 8`
- Review-Fix-Ausgangspunkt: Technical-Lead Review `5049870788`
- Final reviewed Exact Head: `1bf49fe3f870f00a1f228b81a4ee69c66e39307f`
- Merge-Base: `0bca31b5de06bcee74c5436122b1685b6d2092f6`
- Ahead / Behind vor Merge: `6 / 0`
- Exact-Head GitHub Actions: Run `33160582183` SUCCESS
- Exact-Head Vercel Preview: `dpl_EG7RA6z95ijkxCSst4KUFHfLdJpY` READY
- Inline Review Threads vor Merge: `0`
- Merge-Commit auf `main`: `a0eec330eac54a78c8743a72c5ef3ddc82a0cb80`
- `main` nach Merge live verifiziert auf exakt `a0eec330eac54a78c8743a72c5ef3ddc82a0cb80`
- `main` Branch Protection bleibt live `protected=false`; nicht still geändert.

Post-Merge Push-Evidence startet auf exakt `a0eec330eac54a78c8743a72c5ef3ddc82a0cb80`:

- GitHub Actions Run `33161197754` wurde als `push` auf `main` gestartet; beim Erstellen dieses Checkpoints noch `in_progress`. Finalstatus live neu lesen.
- Vercel Production Deployment `dpl_Dra789nLcngJEtuQx7iHB9tYxXt9` wurde für exakt diesen SHA gestartet; beim Erstellen dieses Checkpoints noch `BUILDING`. Finalstatus live neu lesen.

Diese beweglichen Post-Merge-Zustände sind absichtlich nicht als SUCCESS/READY eingefroren. Ein späterer Technical Lead muss sie live verifizieren.

## Gate-0-Vertrag, der jetzt integriert ist

1. Password Recovery und signed-in Reauthentication sind zwei getrennte Authorities.
2. Eingeloggte Passwortänderung unter `secure_password_change`: `reauthenticate()` → Nonce → `updateUser({ password, nonce })`.
3. Recovery bleibt Recovery-Session → `updateUser({ password })`; der Recovery-Link ist nicht die Reauthentication.
4. `security_update_password_require_current_password = true` bleibt Product-Owner-Sondergate. Recovery-Kompatibilität muss vor einer solchen Config-Änderung separat live/referenzbasiert verifiziert werden; kein unbelegter Recovery-Bruch.
5. Das heutige Consumer-`signOut()` verwendet den Client-Default `global`.
6. User-facing Session-/Gerätelisting ist mit dem installierten `@supabase/auth-js` 2.71.1 unsupported; `unsupported` darf nicht als `empty` dargestellt werden.
7. Verified-factor `mfa.unenroll` verlangt serverseitig AAL2. Jetnitys heutige UI macht keinen proaktiven Step-up. Ein späteres AP-5-S4 darf einen nutzerfreundlichen `challenge`/`verify`-Step-up ergänzen, ohne globales Consumer-AAL2 einzuführen.
8. Admin-AAL2 bleibt getrennt und unverändert.

## Scope des integrierten PR #129

Nur Audit / Architecture / Evidence plus read-only Inventory-Test.

Nicht enthalten und weiterhin nicht automatisch freigegeben:

- AP-5 Runtime
- C2 / REVOKE / SECURITY DEFINER
- Auth-Config-Push
- Consumer-AAL2-Grundlogik
- OAuth/Passkey live
- Migration / RLS / Ownership / Identity
- Production-Daten-Write
- AP-6 / AP-7 / Traveller Registry
- Passport-/MRZ-/Biometrie-Persistenz
- Provider / TW-8 / Search / Homepage / Public Indexing / Native

## Agent-Rotation

`Cursor-Agent: Account plattform audit vorbereitung 8` ist mit Gate 0 abgeschlossen und darf für eine neue logische Arbeitseinheit nicht wiederverwendet werden.

Falls nach erneuter Live-Rekonstruktion ein neuer Account-Slice tatsächlich zulässig und sinnvoll gestartet wird, muss der Rotation Standard neu geprüft werden. Die nächste frische Account-Generation wäre voraussichtlich `Cursor-Agent: Account plattform audit vorbereitung 9`; das ist **keine automatische Startfreigabe**.

## Nächster Technical-Lead-Schritt

Kein AP-5-S1/S2/S3/S4/S5 wird allein durch den Merge von Gate 0 automatisch gestartet.

Ein neuer Chat / Technical Lead muss zuerst live rekonstruieren:

- aktuelles `main`
- offene PRs und Issues
- Post-Merge Actions/Vercel für `a0eec330...`
- Binding Build Order
- aktuelle Account-/Traveller-/Provider-Gates
- Product-Owner-Sondergates
- Parallelkollisionen und P0–P3-Risiken

Erst danach darf entschieden werden, ob ein AP-5-Folgeslice, ein anderer Account-/Traveller-Block oder ein anderer Build-Order-Schritt als Nächstes dran ist.
