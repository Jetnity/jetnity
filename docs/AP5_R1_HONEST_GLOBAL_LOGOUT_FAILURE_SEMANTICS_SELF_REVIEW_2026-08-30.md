# Jetnity – AP-5-R1 Self-Review

Stand: 30. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 22`**  
Cursor-Session/Run-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`  
Typ: adversarial Self-Review nach CHANGES REQUIRED `5060518239`, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: nur die drei Review-Funde auf Exact-Head `c0abee50`.

1. Zentrale `ARCHITECTURE.md` / `DECISIONS.md` ohne AP-5-R1-Text; keine kollidierende ADR-Nummer.
2. Admin-Topbar → `signOutToAdminLoginAction` / festes `/admin/login`.
3. Kein persistenter Failure-Callback, der das Menü offen hält.

Übrige AP-5-R1-Wahrheit unverändert: unscoped global, fail-closed, dichte Copy, S3 unberührt, kein DB/Auth-Config/PrivacyBee.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Bleibt eine AP-5-R1-ADR in `DECISIONS.md`? | Nein. Block entfernt; die bereits vergebene zentrale Nummer bleibt unangetastet. |
| Bleibt ein AP-5-R1-Satz in `ARCHITECTURE.md`? | Nein. Datei wieder baseline-identisch. |
| Landet bestätigter Admin-Topbar-Logout auf `/`? | Nein. `signOutToAdminLoginAction` → `/admin/login`. |
| Kann ein Fehler das Admin-Menü dauerhaft erneut öffnen? | Nein. `onErgebnis`/Effect entfernt. `abmelden_fehler` ändert die Offenheit nicht. |
| Kann der Nutzer das Menü nach Fehler schließen? | Ja. Toggle, Aussenklick und Escape rufen `nutzer_schliessen` / `nutzer_umschalten`. |
| Wird bei `{ error }` trotzdem redirected? | Nein. |
| Werden S3-Scopes geändert? | Nein. |
| Wurde ein Folgeslice gestartet? | Nein. |

## 3. Risiken, die bleiben

- Denial-Cleanup-`signOut()` im Admin-Login-Action-Pfad bleibt fehlerblind (Non-Scope).
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Neue Heads invalidieren Prior-Gates.
- Agent-Self-Review ist kein PASS.

## 4. Urteil des Autors

Die drei Review-Funde sind im Diff geschlossen.

**Unabhängiger Technical-Lead-Re-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
