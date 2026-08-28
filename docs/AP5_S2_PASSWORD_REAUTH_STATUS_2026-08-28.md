# Jetnity – AP-5-S2 Passwortänderung über Reauthentication – Status

Stand: 28. August 2026  
Status: **INTEGRIERT über PR #137 / Merge `f11a1753`. Authoring-Blöcke darunter bleiben Pre-Merge-Evidence.**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 10`**  
Issue: [#136](https://github.com/Jetnity/jetnity/issues/136) – Merge erfolgt; Close stand beim Continuity-Stamp noch aus  
Branch: `cursor/ap5-s2-password-reauth-82e4`  
PR: https://github.com/Jetnity/jetnity/pull/137 – **MERGED**

> Live-Evidence gewinnt. Kanonischer Integrationsstand: `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`.

## 0. Integration

| Feld | Wert |
| --- | --- |
| Reviewed Head | `e4cb805a2313fd537aeb9f1f65a8de436301d258` |
| Technical-Lead PASS | Review `5051115258` |
| Merge-Commit | `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5` |
| Post-Merge Actions | Run `33171851756` SUCCESS |
| Post-Merge Vercel Production | `dpl_A7BMLsQoZwx8Y4qEdMRCsdyPmRGg` READY |
| GitHub Production-Deployment | `6141244223` success |
| Issue #136 | beim Stamp noch OPEN |

Kein S3–S5 aus diesem File.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Lokales `main` beim Boot | `eaa03ad7` – hinter Remote, nicht verwendet |
| `origin/main` nach Fetch | `0256905cee3e6705156ce642839983daf8b0709a` – Merge PR #135 |
| Author-Branch-Start | exakt `0256905c` |
| `main` Branch Protection | `protected=false` |
| Issue #136 | OPEN |
| Offene PRs beim Start | #88, #52, #50, #40, #39, #28 – historical/fremd; nicht angefasst |
| AP-5 Gate 0 / PR #129 | **integrated**; Issue #128 CLOSED / completed |
| AP-5-S1 / PR #133 | **integrated**; Issue #132 CLOSED / completed. Generation 9 nicht wiederverwendet |
| Project Sanitation / PR #135 | **integrated** auf derselben Baseline |
| Post-Merge CI auf Baseline | Actions Run `33167619719` **SUCCESS** |
| Post-Merge Production | GitHub Deployment `6140414150` auf exakt `0256905c` |

## 2. Was dieser Slice geliefert hat

Runtime nur auf `/account/security` plus Auffindbarkeit in Settings:

1. Zustandsmodell `idle` / `requesting_code` / `code_sent` / `verifying` / `updating` / `success` / `error` / `unsupported` / `unavailable`
2. Reauthentication erst nach Klick auf „Bestätigungscode senden“
3. `updateUser({ password, nonce })` nur im signed-in Pfad
4. Kanonische Passwortregel und HIBP-Übersetzung über `passwort-richtlinie.ts`
5. Stabile Fehlercopy ohne GoTrue-Rohtext, Tokens, Nonces oder Faktor-IDs
6. Recovery-Seite unverändert (`updateUser({ password })`, `getSession()`, kein nonce)
7. S1-MFA-/Passkey-Grenze unverändert
8. Fokussierte Tests plus Gate-0-Inventory-Aktualisierung auf den neuen Current-Vertrag

Nicht geliefert: Logout-Umbau, MFA-Step-up, Sessionliste, Consumer-AAL2, Auth-Config-Push, Migration/RLS, Current-Password-Feld.

Kein ADR. Gate 0 / ADR-0182 bleibt die Authority.

## 3. Vertrag – Passwortänderung

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| Signed-in Change braucht Reauthentication, nicht das alte Passwort | **current** | `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. Kein `currentPassword`. |
| Recovery bleibt eigene Authority | **current** | `/auth/update-password` ruft weiter `updateUser({ password })` ohne nonce. |
| Erfolg erst nach erfolgreichem `updateUser` | **current** | Reducer akzeptiert `update_ok` nur aus `updating`. |
| HIBP/Richtlinie unverändert | **current** | `erfuelltRichtlinie` / `passwortAblehnung`. Keine zweite Regel. |
| `/auth/update-password` akzeptiert jede Browser-Session | **current / residual** | Seite prüft weiter `getSession()`, nicht `getUser()`, nicht `type=recovery`. Ein bereits Eingeloggter, der die URL kennt, sieht dieselbe Recovery-Maske. S2 hat das **nicht** umgeschrieben. Unter `secure_password_change` scheitert `updateUser({ password })` ohne Nonce voraussichtlich; das ändert die zwei Authorities nicht. |

## 4. Tests / Evidence dieses Slices

| Lauf | Ergebnis |
| --- | --- |
| Focused S2-Unit | **17/17 pass** (`account-password-aenderung.test.ts`) |
| S2 Vertrag/A11y | **5/5 pass** (`ap5-s2-password-aenderung.test.ts`) |
| Gate-0-Inventory | **8/8 pass** |
| S1-Regression + Nav + MFA-A11y + Richtlinie | pass |
| `npm test` | **2437/2437 pass** |
| Typecheck / Lint / `check:exports` / `check:dead` | pass |
| `auth:pruefen` | 55/55, Passwortregel = config.toml |
| Production-Build | pass |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |
| Exact-Head vor diesem Stamp | `fe734874b0b2f97390a2619940359768b7690f6e` |
| GitHub Actions | Run `33168871236` **SUCCESS** auf exakt `fe734874` |
| Jobs | Typecheck/Lint/Build SUCCESS; Auth-Konfiguration gegen config.toml SUCCESS; Vercel Preview Comments SUCCESS |
| Vercel Preview | Inspector `G6m3MbtAFPhUwhS7x3KxH2g9JEJb` **SUCCESS** auf exakt `fe734874` |
| GitHub Preview-Deployment | `6140668086` success |

Historische Exact-Head-Evidence vor Review-Fix `5050962955` bleibt auf `fe734874` / `d0eac240`.

### 4.1 Review-Fix `5050962955`

P1: `passwortAenderungSitzungLesen()` zog Netz- und 5xx-Fehler von `getUser()` auf `client_ohne_sitzung` und behauptete damit eine ungültige Sitzung.

Behoben: `session_required` nur bei 401/session-missing oder `data.user === null` ohne Fehler. Netzfehler bleiben `network`. Unbekannte/5xx-Fehler bleiben `unknown`. Regressionstests decken error, throw und echten Sessionverlust. Kein S3–S5.

| Feld | Wert |
| --- | --- |
| Gegateter Review-Fix-Head | `69c87f2e62495c43150bdef1d442d6454fda13c6` |
| GitHub Actions | Run `33170555726` **SUCCESS** auf exakt `69c87f2e` |
| Vercel Preview | Inspector `AoScFs2qYjBG5uQq4fp97ipwvA7d` **SUCCESS** auf exakt `69c87f2e` |
| GitHub Preview-Deployment | `6140989685` success |

Dieser Stamp erzeugt einen neueren Head. **Kein zweiter Evidence-Stamp**, außer die Stamp-CI fehlschlägt.

## 5. Residuals – nicht in S2 mischen

- Recovery-UI bleibt mehrdeutig für bereits eingeloggte Sessions; Authority bleibt getrennt
- Login-MFA bleibt abbrechbar
- S3–S5 nicht gestartet
- D0-P1-03 Legal-404
- C2 PO-gated
- `main` Branch Protection `protected=false`
- Traveller-Kontext ist für Passwortänderung nicht relevant; keine Credential-Erhebung

## 6. Nächster Schritt

S2-Runtime ist integriert. Issue #136 schließen. Continuity-Stamp unabhängig reviewen. S3–S5 nicht automatisch starten.
