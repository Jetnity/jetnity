# Jetnity – AP-5 Gate 0 – Handoff

Stand: 28. August 2026  
Status: **REVIEW-FIX FÜR 5049870788 / DRAFT / STOPP FÜR TL-RE-REVIEW / KEINE AP-5-RUNTIME**  
Cursor-Agent: **`Account plattform audit vorbereitung 8`**  
Issue: [#128](https://github.com/Jetnity/jetnity/issues/128)  
PR: https://github.com/Jetnity/jetnity/pull/129

## Zuerst lesen

1. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_TASK_2026-08-28.md`
2. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
3. `docs/AP5_GATE0_LOCAL_TEST_EVIDENCE_2026-08-28.md`
4. ADR-0182 in `DECISIONS.md`
4. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` Abschnitt AP-5
5. `docs/AUTH.md`
6. `docs/CHATGPT_PR126_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` – C1 ist integriert, nicht neu bauen

## Was ein neuer Chat wissen muss

AP-5 Gate 0 rekonstruiert den **bestehenden** Vertrag. Es startet keine Runtime.

Harte Wahrheiten:

1. Password-Recovery und signed-in Reauthentication sind zwei Authorities. Recovery = Recovery-Session → `updateUser({ password })`. Eingeloggte Änderung unter `secure_password_change` = `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. Der Recovery-Link ist nicht die Reauthentication. Kein Current-Password-Submit.
2. `security_update_password_require_current_password = true` bleibt Product-Owner-Sondergate. Recovery-Kompatibilität muss vor einer solchen Config-Änderung separat live/referenzbasiert verifiziert werden.
3. Heutiges „Abmelden“ ist bereits `signOut()`-Default **`global`**.
4. Eine Session-/Geräteliste ist mit dem installierten User-Client **unsupported**.
5. Verified-factor Unenroll braucht laut aktueller Supabase-Referenz `aal2`. Jetnitys UI steppt heute nicht hoch; GoTrue erzwingt die Anforderung serverseitig. AP-5-S4 darf später einen UI-Step-up davor setzen, ohne Consumer-AAL2 global einzuführen.

C1 / PR #126 / Issue #122 ist abgeschlossen. C2 ist nicht gestartet.

## Was gebaut wurde

Nur Docs, ADR-0182, Continuity-Zeiger und ein statischer Inventory-Test. Keine Auth-Config, keine Migration, kein Runtime.

## Was bewusst nicht gebaut wurde

In-Account-Passwort-UI, Sessionliste, Logout-others-Buttons, MFA-Step-up-Runtime, Consumer-AAL2, Passkey/OAuth live, C2, AP-6/AP-7.

## Shared Contract

Kein neuer Auth-Vertrag. ADR-0182 stellt nur fest, welcher Vertrag schon gilt und welche Folgeslices ihn nicht verlassen dürfen.

## Residuals

- D0-P1-03 Legal-404
- C2 PO-gated
- Production-Redirect-Origin offen
- Login-MFA abbrechbar (AAL1-Sitzung bleibt)
- `main` Branch Protection `protected=false`
- Exact-Head auf Stamp-Head `8ead1a8f`: Actions `33137160070` SUCCESS; Vercel `8h2J9vfjaCWSJVS6W4RcvLEHVowz` SUCCESS; GitHub Deployment `6134729753` success. Dieser Stamp dokumentiert nur diese Re-Gate. Kein weiterer Evidence-Stamp, außer die Stamp-CI fehlschlägt.

## Nächster Schritt

Unabhängiger Technical-Lead-Re-Review nach Review-Fix `5049870788`. Nicht Ready. Nicht mergen. Kein automatischer AP-5-S1/S2-Start.
