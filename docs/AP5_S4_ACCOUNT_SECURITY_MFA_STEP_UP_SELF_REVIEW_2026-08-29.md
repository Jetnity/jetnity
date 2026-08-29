# Jetnity – AP-5-S4 Self-Review

Stand: 29. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 14`**  
Cursor-Session/Run-ID: `bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #158 / AP-5-S4 only.

Geprüft: Step-up nur für verified Unenroll; `challenge` / `verify` über User-Auth-API; AAL-Recheck vor Unenroll; Erfolg erst nach Unenroll; Abbruch/Fehler unenrollen nicht; keine Raw-Auth-Fehler/IDs/OTP; kein globales Consumer-AAL2; keine Auth-Config; keine Migration/RLS/Identity/Service Role; Login-MFA/Recovery/Reauth/Admin-AAL2/S3-Logout unberührt; Tests; Continuity.

Keine Migration. Kein `supabase/config.toml`-Write. Kein RLS/Identity. Kein S5. Kein Consumer-AAL2.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wird `nextLevel === 'aal2'` als bereits gesteppt behandelt? | Nein. Nur `currentLevel === 'aal2'`. |
| Wird Login-Dialog-Abbruch als AAL2 behandelt? | Nein. Login-MFA bleibt skippable und unberührt. |
| Kann ein falscher/abgelaufener Code trotzdem unenrollen? | Nein. Verify-Fehler kehrt vor `unenroll` zurück. |
| Kann Challenge-Fehler still unenrollen? | Nein. |
| Wird Erfolg nach Verify ohne Unenroll gezeigt? | Nein. `ausfuehren_ok` erst nach `unenroll` ohne Error. |
| Wird Unenroll-Fehler nach Step-up als Gesamterfolg gezeigt? | Nein. `unenroll_failed_nach_step_up`. |
| Werden Factor-/Challenge-/Session-IDs oder OTP in der UI/Logs gezeigt? | Nein. Challenge-ID bleibt in der Async-Funktion. Dialog rendert keine IDs. Dicht-Tests. |
| Wird `startTotpChallenge` / `challengeAndVerify` / Service Role genutzt? | Nein. |
| Wird globales Consumer-AAL2 oder Middleware-AAL behauptet? | Nein. Copy und `proxy.ts` bleiben ohne Consumer-AAL2. |
| Kann eine stale ID einen anderen Faktor entfernen? | Nein. Re-list prüft dieselbe Faktor-ID. |
| Wurde S5/Sessionliste/Auth-Config still gebaut? | Nein. |
| Traveller-/Dokumentdaten? | Nicht berührt. Nicht relevant. |

## 3. Risiken, die bleiben

- GoTrue kann nach `mfa.verify` andere Sitzungen beenden. Das ist installiertes Auth-Verhalten, keine zweite Session-Authority.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- GitHub CI / Vercel Preview des Stamp-Heads zum Authoring nicht live verifiziert.
- S5 und AP-5-P1–P5 bleiben offen.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

Während der lokalen Gates wurden zwei Author-Fixes nötig: Execution-Fehler von `plan_fehler` auf `ausfuehren_fehler` gemappt; `aalStufeLesen` nicht mehr exportiert. Beide sind im Diff enthalten.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
