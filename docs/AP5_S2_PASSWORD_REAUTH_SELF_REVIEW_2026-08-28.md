# Jetnity – AP-5-S2 Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Account plattform audit vorbereitung 10`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #136 / AP-5-S2 only.

Geprüft: Zustandsmodell, Fehlercopy, Reauth-only-after-click, `updateUser({ password, nonce })`, keine Current-Password-Felder, Recovery unverändert, S1-MFA unverändert, kanonische Passwortregel/HIBP, Tests, Continuity. Review-Fix `5050962955`: `getUser()`-Netz-/5xx-Fehler sind nicht mehr `session_required`.

Keine Migration. Kein `supabase/config.toml`-Write. Kein RLS/Identity. Kein Logout-Scope. Kein Sessionlisting. Kein Consumer-AAL2. Kein ADR nur zur Wiederholung von Gate 0.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Wird ein Netz- oder 5xx-Fehler von `getUser()` als Sitzungsverlust gezeigt? | Nein, nach Review-Fix `5050962955`. Nur 401/session-missing oder fehlender User. |
| Wird Reauthentication beim Laden der Seite still gestartet? | Nein. `getUser()` prüft nur Sitzung/Fähigkeit. `reauthenticate()` erst nach Button. |
| Kann Erfolg vor `updateUser` behauptet werden? | Nein. `success` nur aus `updating` + `update_ok`. |
| Wird ein Current-Password-Feld eingeführt? | Nein. Inventory und Nutzlast-Test verbieten `currentPassword`. |
| Wird Recovery als Reauthentication wiederverwendet? | Nein. Recovery bleibt `updateUser({ password })` ohne nonce. |
| Leakage von GoTrue/Nonce/Token in der UI? | Mapper gibt nur Produktcopy. Tests füttern Rohstrings. |
| Zweite Passwortregel? | Nein. `erfuelltRichtlinie` / `passwortAblehnung`. |
| Wurde S3/S4/S5 still gebaut? | Nein. |
| Secrets geloggt oder Nonce persistiert? | Nein. Kein `console.*`, kein Storage. |
| Traveller-/Dokumentdaten? | Nicht berührt. Nicht relevant. |
| Accessibility/Navigation zerstört? | Labels, `aria-live`, `min-h-11`, Fokus auf Code/Status, Account-Nav-Tests bleiben. |

## 3. Risiken, die bleiben

- Exact-Head vor Stamp: Actions `33168871236` SUCCESS und Vercel `G6m3MbtAFPhUwhS7x3KxH2g9JEJb` SUCCESS auf `fe734874`. Ein Stamp danach braucht erneute Live-Gates; kein zweiter Stamp, außer die Stamp-CI fehlschlägt.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Recovery-UI bleibt für signed-in Sessions mehrdeutig; das ist Residual, kein stiller Rewrite.
- S3–S5 und AP-5-P1–P5 bleiben offen.

## 4. Urteil des Autors

**CHANGES REQUIRED durch den Autor:** keine weiteren in diesem Slice.

**Unabhängiger Technical-Lead-Review:** ausstehend. Dieses Self-Review ersetzt ihn nicht.
