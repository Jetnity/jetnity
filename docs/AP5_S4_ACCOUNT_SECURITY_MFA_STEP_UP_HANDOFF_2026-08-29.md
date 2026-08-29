# Jetnity – AP-5-S4 – Handoff

Stand: 29. August 2026  
Status: **DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN S5**  
Cursor-Agent: **`Account plattform audit vorbereitung 14`**  
Cursor-Session/Run-ID: `bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132`  
Issue: [#158](https://github.com/Jetnity/jetnity/issues/158)  
Branch: `feat/ap5-s4-account-security-mfa-step-up-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/159

## Zuerst lesen

1. `docs/AP5_S4_ACCOUNT_SECURITY_MFA_STEP_UP_TASK_2026-08-29.md`
2. `docs/AP5_S4_ACCOUNT_SECURITY_MFA_STEP_UP_STATUS_2026-08-29.md`
3. `docs/AP5_S4_LOCAL_TEST_EVIDENCE_2026-08-29.md`
4. ADR-0193 in `DECISIONS.md`
5. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
6. ADR-0182
7. Issue #158

## Was ein neuer Chat wissen muss

S4 macht vorhandenes GoTrue-`aal2` für verified-factor Unenroll in `/account/security` ehrlich erfüllbar. Es ändert keine Auth-Architektur und führt kein globales Consumer-AAL2 ein.

Harte Wahrheiten:

1. Nur `currentLevel === 'aal2'` ist ausreichender Step-up. `nextLevel === 'aal2'` allein nicht.
2. AAL1 + verified TOTP öffnet den Challenge/Verify-Dialog. Bereits AAL2 unenrollt ohne Dialog. Unverified (Enroll-Abbruch) bleibt AAL1.
3. Erfolg darf erst nach erfolgreichem `mfa.unenroll` behauptet werden. Verify allein ist kein Erfolg.
4. Abbruch, falscher Code, Challenge-/Verify-Fehler oder AAL-Recheck ohne `aal2` dürfen nicht unenrollen.
5. Factor-/Challenge-/Session-IDs, Tokens und OTP gehören nicht in Nutzertext, URL, Logs oder Analytics.
6. Login-MFA bleibt skippable. Admin-AAL2 bleibt getrennt. S3-Logout bleibt unberührt.
7. Generation 14 ist nur für AP-5-S4. Nicht für S5 wiederverwenden.

## Was bewusst nicht gebaut wurde

Globales Consumer-AAL2, Auth-Config-Push, Sessionkarte, Passkeys/WebAuthn, OAuth/Recovery-Neuarchitektur, Service Role, Migration/RLS/Identity, AP-5-S5, AP-6/AP-7.

## Shared Contract

Kein neuer Auth-Vertrag. ADR-0193 präzisiert nur die UI-Nutzung der bereits in ADR-0182 festgestellten User-API (`challenge` / `verify` / `getAuthenticatorAssuranceLevel` / `unenroll`).

## Residuals

- Kein authentifizierter Browser-/Real-Device-Beweis.
- `mfa.verify` kann andere Sitzungen beenden; keine Sessionliste behauptet.
- Nach Unenroll-Fehler nach Step-up kann die Sitzung bereits AAL2 sein.
- GitHub CI / Vercel Preview des Stamp-Heads zum Authoring nicht live verifiziert.
- `main` `protected=false`.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #159. Nicht Ready. Nicht mergen. Kein automatischer S5-Start.
