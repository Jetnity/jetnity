# Jetnity – AP-5-S4 Account Security MFA Step-up – Status

Stand: 29. August 2026  
Current classification / Nachtrag, 29. August 2026: **HISTORICAL / INTEGRIERT auf der S5-Baseline.** PR #160 ist auf `main @ 934d43da` gemergt. Ältere „REVIEW-FIX / DRAFT / Kein S5“-Zeilen sind Pre-S5-Evidence. S5 ist jetzt der aktive Account-Slice, nicht ein automatischer Folgeslice aus S4.

Status: **REVIEW-FIX / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN S5**  
Workstream: Account / Security  
Cursor-Agent: **`Account plattform audit vorbereitung 14`**  
Cursor-Session/Run-ID: `bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132`  
Issue: [#158](https://github.com/Jetnity/jetnity/issues/158)  
Branch: `feat/ap5-s4-account-security-mfa-step-up-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/159

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Feature-Branch-Start | `0034b6b8` – Task-only |
| Baseline / Merge-Base | `main @ 5920860e164784040118667091ebcaca79f9b33d` – Merge PR #157 (AP-5-S3 integriert) |
| Logical Cursor-Agent | `Account plattform audit vorbereitung 14` |
| Beobachteter Run-Titel | `Ap-5-s4 mfa-step-up abmeldung` – nicht als umbenannt behauptet |
| Cursor-Run | https://cursor.com/agents/bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132 |
| `main` Branch Protection | `protected=false` |
| Issue #158 | OPEN |
| Draft-PR | #159, bleibt Draft |
| AP-5 Gate 0 / PR #129 | **integrated** |
| AP-5-S1 / PR #133 | **integrated** |
| AP-5-S2 / PR #137 | **integrated** |
| AP-5-S3 / PR #157 | **integrated auf der Baseline** |
| Next 16 S2 / PR #152 | **integrated auf der Baseline**; nicht Gegenstand dieses Slice |

## 2. Was dieser Slice geliefert hat

Runtime nur auf `/account/security` für das Entfernen eines TOTP-Faktors:

1. Zustandsmodell `idle` / `working` / `success` / `error` / `unavailable` / `unsupported` mit Phasen `idle` / `pruefen` / `warte_auf_code` / `bestaetigen` / `entfernen`
2. Plan: bereits `currentLevel === 'aal2'` → direkter Unenroll; AAL1 + verified TOTP → Challenge/Verify; unverified → AAL1 ohne Dialog
3. `nextLevel === 'aal2'` allein ist kein Step-up
4. Nach Verify erneuter AAL-Check; Unenroll nur wenn `currentLevel === 'aal2'`
5. Abbruch, falscher Code, Challenge-/Verify-Fehler oder AAL nicht bestätigt → kein Unenroll
6. Unenroll-Fehler nach erfolgreichem Step-up → `unenroll_failed_nach_step_up`, kein Gesamterfolg
7. Nach **verified** Unenroll: `refreshSession()` plus erneutes AAL-/Faktorenlesen. Clean success nur wenn der Sitzungsstand bestätigt ist. Refresh-/AAL-Fehler danach → Faktor ist weg, lokale Sitzung fail-closed (`signOut({ scope: 'local' })` + S3-local Action), kein clean success
8. Challenge-ID nur in der Async-Funktion; OTP nicht persistiert; keine IDs in der UI
9. Copy: Jetnity fordert den Step-up nur für diesen Vorgang an; die Sitzung kann technisch auf AAL2 angehoben werden; keine globale Consumer-MFA-Pflicht
10. Bei mehreren verified TOTP-Faktoren wird ein **anderer** Faktor für die Challenge bevorzugt
11. Fokusfalle, Escape bricht ab ohne Unenroll, `autocomplete="one-time-code"`, `aria-live` / `aria-busy`
12. Login-MFA, Recovery, signed-in Reauth, S3-Logout und Admin-AAL2 bleiben getrennte Authorities. Unverified Enroll-Abbruch bleibt ohne Refresh.

Nicht geliefert: globales Consumer-AAL2, Auth-/MFA-Config, Sessionliste, Passkeys/WebAuthn, Service Role, Migration/RLS/Identity, AP-5-S5.

## 3. Vertrag – MFA-Step-up

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| Nur `currentLevel === 'aal2'` reicht für verified Unenroll | **current** | `aalIstAusreichendFuerVerifiedUnenroll` |
| AAL1 + verified TOTP braucht `challenge` / `verify` | **current** | `mfaUnenrollPlanen` → `step_up` |
| Unverified Unenroll bleibt AAL1 | **current** | Plan `direkt_unenroll` / `unverified` |
| Erfolg erst nach bestätigtem Unenroll **und** Sitzungs-/AAL-Abgleich | **current** | `refreshSession` + Re-read; `ausfuehren_ok` nur wenn `mfaSitzungNachUnenrollIstSauber` |
| Refresh-Fehler nach Unenroll ist kein clean success | **current** | `unenroll_ok_sitzung_unbestaetigt` + lokales `signOut({ scope: 'local' })` |
| Challenge bevorzugt anderen verified Faktor | **current** | `nutzbarerChallengeFaktor` |
| Abbruch/Fehler unenrollen nicht | **current** | `abbrechen` setzt Idle; Fehler ohne `unenroll` |
| Kein globales Consumer-AAL2 | **current** | Dialogcopy; `proxy.ts` unverändert; `supabase/config.toml` unverändert |
| Keine IDs / OTP / Raw-Auth in Nutzertext | **current** | `mfaStepUpFehlerIstDicht` plus UI-Vertrag |
| Admin-AAL2 / Login-MFA / Recovery / Reauth / Logout getrennt | **current** | `lib/auth/ap5-s4-mfa-step-up.test.ts` |

## 4. Tests / Evidence dieses Slices

Siehe `docs/AP5_S4_LOCAL_TEST_EVIDENCE_2026-08-29.md`.

| Lauf | Ergebnis |
| --- | --- |
| Focused S4-Unit | **27/27 pass** (`lib/auth/account-mfa-step-up.test.ts`) |
| S4 Vertrag/A11y | **5/5 pass** (`lib/auth/ap5-s4-mfa-step-up.test.ts`) |
| `npm test` | **2543/2543 pass** |
| Typecheck / Lint / Hygiene / Build | pass; lint 0 errors / 133 warnings |
| `auth:pruefen` | 55/55, 242 Schlüssel |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |
| GitHub Actions / Vercel Preview | Exact Head `c503dbf2`: Actions `33224797456` SUCCESS; Vercel `3sMqKGDKPXmNn7nE8UfGcf1Jpmou` READY. Dieser Stamp erzeugt einen neueren Head; dessen Gates live prüfen. |

## 5. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Ownership-/Identity-Write. Kein Auth-Config-Push. Keine Service Role. Keine Supabase-Mutation. `supabase/config.toml` unverändert.

## 6. Kosten / Provider / Secrets

Keine neuen laufenden Kosten. Keine Provider. Keine Secrets.

## 7. Residuals / Risiken

- GoTrue `mfa.verify` kann andere Sitzungen beenden. Die UI behauptet keine Sessionliste und kein globales AAL2.
- Nach fehlgeschlagenem Unenroll nach Step-up kann die Sitzung bereits AAL2 sein; Copy sagt das ehrlich.
- Login-MFA bleibt skippable (AAL1). Dialog-Abbruch dort ist kein AAL2.
- Kein authentifizierter Browser-/Real-Device-Beweis (`/account/security` ist auth-gated; kein Testkonto).
- `main` Branch Protection bleibt `protected=false`.
- Agent-Self-Review ist kein PASS.
- Review `5056084065` P1 ist lokal geschlossen: Session/AAL nach verified Unenroll wird reconciled; Refresh-Fehler ist fail-closed lokal. P2 Challenge-Faktor-Auswahl ist umgesetzt.
- Prior-Gates auf `6f46a299` / `97a8f7b9` gelten nicht für den Review-Fix. Gates `33224797456` / `3sMqKGDKPXmNn7nE8UfGcf1Jpmou` gelten für `c503dbf2`, nicht automatisch für diesen Stamp-Head.

## 8. Offene Freigaben

S4 braucht kein Product-Owner-Sondergate. Es wurde keine fundamentale Auth/MFA/AAL-Architektur- oder Projektkonfigurationsänderung nötig. S5 startet nicht aus diesem File. P1–P5 bleiben extra gegated.

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-**Re-Review** von Draft-PR #159 nach CHANGES REQUIRED `5056084065`. Kein Ready. Kein Merge. Kein AP-5-S5 durch den Autor-Agenten. Jeder neue Push invalidiert Prior-Gates.

## 10. Zuerst lesen

1. `docs/AP5_S4_ACCOUNT_SECURITY_MFA_STEP_UP_TASK_2026-08-29.md`
2. dieser Status
3. `docs/AP5_S4_ACCOUNT_SECURITY_MFA_STEP_UP_HANDOFF_2026-08-29.md`
4. `docs/AP5_S4_ACCOUNT_SECURITY_MFA_STEP_UP_SELF_REVIEW_2026-08-29.md`
5. ADR-0193
6. ADR-0182 / Gate-0-Status
7. Issue #158
