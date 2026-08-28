# Jetnity – AP-5-S1 Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 9`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #132 / AP-5-S1 only.

Geprüft: Lage-Ableitung, Fehlercopy, Passkey-Server-Truth, SecurityMFA, Security-Seite, Login-MFA-Fehlercopy, Tests, ADR-0183, Continuity.

Keine Migration. Kein `supabase/config.toml`-Write. Kein RLS/Identity. Kein `reauthenticate()`. Kein Logout-Scope. Kein Sessionlisting. Kein Consumer-AAL2.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Kann Browser-WebAuthn Passkeys als live zeigen, während Config aus ist? | Nein. `passkeyLage` gibt bei `serverAktiviert=false` immer `unsupported`. |
| Wird eine fehlgeschlagene Faktorenliste als Empty gezeigt? | Nein. `error` bleibt `error`. |
| Werden Faktor-IDs als Gerät gezeigt? | Nein. Anzeigename ist `friendly_name` oder „Authenticator-App“. |
| Leakage von GoTrue/otpauth/Token in der UI? | Mapper gibt nur Produktcopy. Tests füttern Rohstrings. |
| Wurde S2/S3/S4/S5 still gebaut? | Nein. |
| Wurde Passkey-Registrierung live geschaltet? | Nein. Kein Register-Call. Kein Auth-Config-Push. |
| Wurde Step-up vor Unenroll gebaut? | Nein. AAL2-Fehler wird nur ehrlich übersetzt. |
| Traveller-/Dokumentdaten? | Nicht berührt. |
| Accessibility/Navigation zerstört? | Labels, `min-h-11`, `role="status"`/`alert`, Account-Nav-Tests bleiben. |

## 3. Risiken, die bleiben

- Exact-Head vor Stamp: Actions `33163350129` SUCCESS und Vercel `BviA8yxrA2h3WjzDBcfMRSZbd2hH` SUCCESS auf `55392fda`. Ein Stamp danach braucht erneute Live-Gates.
- Kein authentifizierter Browser-/Real-Device-Beweis der Security-UI.
- Login-MFA bleibt abbrechbar.
- S2–S5 und AP-5-P1–P5 bleiben offen.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
