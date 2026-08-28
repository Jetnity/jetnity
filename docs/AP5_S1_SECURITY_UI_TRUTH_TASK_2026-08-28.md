# Jetnity – AP-5-S1 ehrliche Security-UI Zustände und Fehlerhygiene

Stand: 28. August 2026  
Issue: [#132](https://github.com/Jetnity/jetnity/issues/132)  
Typ: **IMPLEMENTATION / AP-5-S1 ONLY**  
Status: **AUTHOR COMPLETE ON DRAFT / KEIN READY / KEIN MERGE / STOPP FÜR TL-REVIEW**  
Cursor-Agent: `Account plattform audit vorbereitung 9`  
Branch: `cursor/ap5-s1-security-ui-8b13`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/133  
Start-Baseline: `main @ eaa03ad71509d281990e0d34ca359e0750eb9591`

## 1. Ziel

`/account/security` ehrlich und production-grade machen, ohne Auth-Authority oder Session-/MFA-Architektur zu ändern.

1. `empty`, `unsupported`, `unavailable` und `error` ausdrücklich trennen.
2. Keine rohen GoTrue-/Supabase-Fehler in der Security-UI.
3. Passkeys bei `[auth.passkey] enabled = false` als nicht unterstützt/deaktiviert zeigen.
4. Browser-WebAuthn darf Server-Truth niemals überschreiben.
5. Faktor-IDs nicht als Geräteidentität darstellen.
6. TOTP-Enroll/Verify/Unenroll-Authority erhalten. Kein Step-up.
7. Accessibility, Mobile/Desktop und Account-Navigation erhalten.
8. Fokussierte Regressionstests für Lage, Fehlercopy, Passkey-Truth und UI-Semantik.

## 2. Non-Scope

Kein S2-Passwortwechsel. Kein `reauthenticate()` / Nonce. Kein S3-Logout-Umbau. Kein S4-MFA-Step-up. Kein S5-Sessionlisting. Kein Consumer-AAL2. Kein Auth-Config-Push. Keine Migration/RLS/Identity/Schema-/Supabase-Änderung. Kein C2. Kein Provider/Search/Homepage/Native.

## 3. Akzeptanz

Siehe Issue #132 und ADR-0183. Gate-0-Vertrag bleibt die Authority für das, was S1 **nicht** bauen darf.
