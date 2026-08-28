# Jetnity – AP-5-S3 Account Security Logout Scopes – Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN READY / KEIN MERGE / KEIN S4–S5**  
Workstream: Account / Security  
Cursor-Agent: **`Account plattform audit vorbereitung 13`**  
Issue: [#153](https://github.com/Jetnity/jetnity/issues/153)  
Branch: `feat/ap5-s3-account-security-logout-scopes-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/156

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Feature-Branch-Start | `c26971973efeaae61bebf53c6bf9cdee76ed98fd` – Task-only |
| Baseline / Merge-Base | `main @ 3c3079defb4eb5bcea4b8cb0ec8d73eff7806c9a` – Merge PR #152 |
| `origin/main` beim Authoring | exakt `3c3079de` |
| `main` Branch Protection | `protected=false` |
| Issue #153 | OPEN |
| Draft-PR | #156, bleibt Draft |
| AP-5 Gate 0 / PR #129 | **integrated** |
| AP-5-S1 / PR #133 | **integrated** |
| AP-5-S2 / PR #137 | **integrated** |
| Next 16 S2 / PR #152 | **integrated auf der Baseline**; nicht Gegenstand dieses Slice |

## 2. Was dieser Slice geliefert hat

Runtime nur auf `/account/security` plus Auffindbarkeit in Settings:

1. Zustandsmodell `idle` / `working` / `success` / `error` / `unavailable` / `unsupported`
2. Explizite Scopes `local` / `others` / `global` über die vorhandene User-Auth-API
3. `others` behält die aktuelle Sitzung und prüft das nach dem API-Aufruf
4. `local` und `global` verlassen den lokalen Auth-Zustand erst nach bestätigtem Erfolg
5. `global` bleibt visuell/semantisch die gefährlichere Aktion und braucht eine Bestätigung
6. Allgemeines Navbar-/Footer-/Unauthorized-Abmelden bleibt unscoped und damit global
7. Keine Sessionliste, keine Sessionzahl, kein sofortiges JWT-Kill
8. Stabile Fehlercopy ohne GoTrue-/Token-Rohtext
9. Fokussierte Tests plus Gate-0-Inventory-Aktualisierung

Nicht geliefert: MFA-Step-up, Session-/Geräteliste, Consumer-AAL2, Auth-Config-Push, Migration/RLS/Identity, Service Role, Default-Logout-Wechsel `global` → `local`.

## 3. Vertrag – Logout-Scopes

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| `local` = nur diese Sitzung | **current** | `signOut({ scope: 'local' })` über `accountLogoutScopeAction` |
| `others` = andere Sitzungen, aktuelle bleibt | **current** | expliziter Scope plus `getUser()`-Probe danach; lokale Navigation nur bei `local`/`global` |
| `global` = überall; gleiche Semantik wie allgemeines Abmelden | **current** | Security-UI explizit `global`; `signOutAction` bleibt unscoped |
| Erfolg erst nach bestätigtem API-Ergebnis | **current** | Reducer akzeptiert `ausfuehren_ok` nur aus `working` |
| Netz-/Serverfehler sind unbestätigt, nicht Erfolg | **current** | `network` / `failed`; kein Redirect bei Fehler |
| Access Tokens nicht sofort tot | **current** | sichtbarer JWT-Hinweis; Erfolgstexte wiederholen ihn |
| Andere Sitzungen nicht aufzählbar | **current** | keine `listSessions` / `auth.sessions`; Copy ohne Anzahl |
| Default-Logout ausserhalb Security bleibt global | **current** | `app/auth/sign-out.ts` unverändert unscoped |

## 4. Tests / Evidence dieses Slices

Siehe `docs/AP5_S3_LOCAL_TEST_EVIDENCE_2026-08-29.md`. Zahlen dort sind nur gültig, wenn der Lauf tatsächlich stattfand.

Browser / Real-Device: nicht gelaufen, nicht behauptet.

## 5. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Ownership-/Identity-Write. Kein Auth-Config-Push. Keine Service Role. Keine Supabase-Mutation.

## 6. Kosten / Provider / Secrets

Keine neuen laufenden Kosten. Keine Provider. Keine Secrets.

## 7. Residuals / Risiken

- Supabase-JS kann 404/401/403 vom Logout-Endpunkt schlucken und `{ error: null }` liefern. S3 vertraut diesem User-Client-Vertrag und erfindet keine zweite Revoke-Authority.
- `others` kann nicht beweisen, wie viele andere Sitzungen existierten oder beendet wurden.
- `local` kann nicht beweisen, dass andere Sitzungen überlebt haben.
- Allgemeines `signOutAction` prüft Fehler weiter nicht und redirected immer. Das ist bestehendes Residual, kein stiller Rewrite.
- `main` Branch Protection bleibt `protected=false`.
- Agent-Self-Review ist kein PASS.

## 8. Offene Freigaben

S3 braucht kein Product-Owner-Sondergate. S4/S5 starten nicht aus diesem File. P1–P5 bleiben extra gegated.

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #156. Kein Ready. Kein Merge. Kein AP-5-S4 durch den Autor-Agenten. Jeder neue Push invalidiert Prior-Gates.

## 10. Zuerst lesen

1. `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_TASK_2026-08-29.md`
2. dieser Status
3. `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_HANDOFF_2026-08-29.md`
4. `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_SELF_REVIEW_2026-08-29.md`
5. ADR-0192
6. ADR-0182 / Gate-0-Status
7. Issue #153
