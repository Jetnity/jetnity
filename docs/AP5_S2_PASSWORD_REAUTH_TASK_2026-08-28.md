# Jetnity – AP-5-S2 eingeloggte Passwortänderung

Stand: 28. August 2026  
Issue: [#136](https://github.com/Jetnity/jetnity/issues/136)  
Typ: **IMPLEMENTATION / AP-5-S2 ONLY**  
Status: **AUTHOR COMPLETE ON DRAFT / KEIN READY / KEIN MERGE / STOPP FÜR TL-REVIEW**  
Cursor-Agent: `Account plattform audit vorbereitung 10`  
Branch: `cursor/ap5-s2-password-reauth-82e4`  
Start-Baseline: `main @ 0256905cee3e6705156ce642839983daf8b0709a`

## 1. Ziel

Auf `/account/security` eine auffindbare, ehrliche Passwortänderung für eine bereits angemeldete Sitzung bauen – **innerhalb des integrierten Auth-Vertrags**.

1. authentifizierte Sitzung über die bestehende Account-Grenze (`getUser()`, kein `getSession()`);
2. Reauthentication nur nach ausdrücklicher Nutzeraktion: `reauthenticate()`;
3. OTP/Nonce über die vorhandene Supabase-Authority;
4. Nutzer sendet Nonce plus neues Passwort;
5. `updateUser({ password, nonce })`;
6. Erfolg erst behaupten, wenn dieser Aufruf gelingt;
7. stabile Produktcopy, keine Roh-GoTrue-/Token-/Nonce-Leakage.

Recovery bleibt eine eigene Authority. Der Passwort-Reset-Link ist nicht die Reauthentication.

## 2. Non-Scope

Kein S3-Logout-Umbau. Kein S4-MFA-Step-up. Kein S5-Sessionlisting. Kein Consumer-AAL2. Kein Auth-Config-Push. Keine Migration/RLS/Identity/Schema-/Supabase-Änderung. Kein Current-Password-Submit. Kein C2. Kein Provider/Search/Homepage/Native. Keine Traveller-/Dokumentarbeit.

## 3. Akzeptanz

Siehe Issue #136, Gate-0-Status und ADR-0182. Kein neues ADR nur zur Wiederholung von Gate 0.
