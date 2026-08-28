# Jetnity – AP-5-S2 – Handoff

Stand: 28. August 2026  
Status: **INTEGRIERT über PR #137 / Merge `f11a1753` / KEIN S3–S5**  
Cursor-Agent: **`Account plattform audit vorbereitung 10`** – Generation für Runtime abgeschlossen  
Issue: [#136](https://github.com/Jetnity/jetnity/issues/136) – Merge erfolgt; Close stand beim Continuity-Stamp noch aus  
Branch: `cursor/ap5-s2-password-reauth-82e4`  
PR: https://github.com/Jetnity/jetnity/pull/137 – **MERGED**

Kanonischer Integrationsstand: `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`.

## Zuerst lesen

1. `docs/AP5_S2_PASSWORD_REAUTH_TASK_2026-08-28.md`
2. `docs/AP5_S2_PASSWORD_REAUTH_STATUS_2026-08-28.md`
3. `docs/AP5_S2_LOCAL_TEST_EVIDENCE_2026-08-28.md`
4. Issue #136
4. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
5. ADR-0182
6. `docs/AP5_S1_SECURITY_UI_TRUTH_STATUS_2026-08-28.md`

## Was ein neuer Chat wissen muss

S2 macht die eingeloggte Passwortänderung auf `/account/security` nutzbar. Es ändert keine Auth-Architektur.

Harte Wahrheiten:

1. Der Vertrag ist `reauthenticate()` → Nonce → `updateUser({ password, nonce })`.
2. Es gibt kein Feld „aktuelles Passwort“.
3. Recovery (`/auth/update-password`) ist eine andere Authority und wurde nicht umgeschrieben.
4. Erfolg darf erst nach erfolgreichem `updateUser` behauptet werden.
5. Passwortregel und HIBP bleiben `lib/auth/passwort-richtlinie.ts`.
6. Generation 9 (S1) ist abgeschlossen und darf nicht wiederverwendet werden.
7. `getUser()`-Netz- oder Serverfehler sind kein Sitzungsverlust. `session_required` braucht Session-Evidence.

## Exact-Head Review-Fix `5050962955`

- Head `69c87f2e`
- Actions `33170555726` SUCCESS
- Vercel `AoScFs2qYjBG5uQq4fp97ipwvA7d` SUCCESS
- GitHub Deployment `6140989685` success

Dieser Stamp dokumentiert nur diese Re-Gate. Kein weiterer Evidence-Stamp, außer die Stamp-CI fehlschlägt.

## Residual Recovery

`/auth/update-password` prüft weiter `getSession()` und spricht Nutzer als „angemeldet“ an. Das vermischt Recovery-UI mit einer möglichen signed-in Session, ändert aber nicht die zwei Authorities. S2 hat das bewusst nicht still zur In-Account-UI gemacht.

## Was bewusst nicht gebaut wurde

Logout-Scopes, MFA-Step-up, Sessionkarte, Consumer-AAL2, Passkey-Live, C2, Auth-Config-Push.

## Nächster Schritt

Issue #136 schließen. Continuity-Stamp unabhängig reviewen. Kein automatischer S3-Start. Generation 10 nicht wiederverwenden.
