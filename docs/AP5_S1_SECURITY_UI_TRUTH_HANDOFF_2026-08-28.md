# Jetnity – AP-5-S1 – Handoff

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5050331692 / DRAFT / STOPP FÜR ERNEUTEN TL-REVIEW / KEIN S2–S5**  
Cursor-Agent: **`Account plattform audit vorbereitung 9`**  
Issue: [#132](https://github.com/Jetnity/jetnity/issues/132)  
Branch: `cursor/ap5-s1-security-ui-8b13`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/133

## Zuerst lesen

1. `docs/AP5_S1_SECURITY_UI_TRUTH_TASK_2026-08-28.md`
2. `docs/AP5_S1_SECURITY_UI_TRUTH_STATUS_2026-08-28.md`
3. `docs/AP5_S1_LOCAL_TEST_EVIDENCE_2026-08-28.md`
4. ADR-0183 in `DECISIONS.md`
4. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
5. ADR-0182
6. Issue #132

## Was ein neuer Chat wissen muss

S1 macht `/account/security` ehrlich. Es ändert keine Auth-Architektur.

Harte Wahrheiten:

1. Passkeys sind unsupported, solange `auth.passkey.enabled` nicht ausdrücklich `true` ist. Browser-WebAuthn ändert das nicht.
2. TOTP-Leere ist nicht dasselbe wie Listenfehler oder fehlende API.
3. Faktor-IDs sind keine Geräte.
4. Roh-GoTrue, otpauth-URIs, Tokens und QR-Secrets gehören nicht in die Nutzercopy.
5. Verified-factor Unenroll kann ehrlich `aal2` verlangen, ohne dass S1 einen Step-up baut.
6. TOTP-Liste folgt `factor_type`. Legacy-`type` ist nur Fallback. `data.all` mit `factor_type: "totp"` darf nicht `empty` werden.

## Was bewusst nicht gebaut wurde

In-Account-Passwort, `reauthenticate()` / Nonce, Logout-Scopes, MFA-Step-up, Sessionkarte, Consumer-AAL2, Passkey-Live, C2.

## Residuals

- Exact-Head vor diesem Stamp: Actions `33163350129` SUCCESS; Vercel `BviA8yxrA2h3WjzDBcfMRSZbd2hH` SUCCESS; GitHub Deployment `6139587003` success auf `55392fda`. Dieser Stamp dokumentiert nur diese Re-Gate. Kein weiterer Evidence-Stamp, außer die Stamp-CI fehlschlägt.
- Kein authentifizierter Browser-/Real-Device-Beweis
- Login-MFA bleibt abbrechbar
- S2–S5 nicht gestartet

## Nächster Schritt

Unabhängiger Technical-Lead-Review. Nicht Ready. Nicht mergen. Kein automatischer S2-Start.
