# Jetnity – AP-5-S5 Honest Current Session / Device View – Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN READY / KEIN MERGE / KEIN AP-6/AP-7**  
Workstream: Account / Security  
Cursor-Agent: **`Account plattform audit vorbereitung 15`**  
Cursor-Session/Run-ID: `bc-cccd6820-5dfa-4801-8af9-0659f2e26cf2`  
Issue: [#161](https://github.com/Jetnity/jetnity/issues/161)  
Branch: `feat/ap5-s5-honest-current-session-view-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/162

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Feature-Branch-Start | `8fb2836b` – Task-only |
| Baseline / Merge-Base | `main @ 934d43dae65235486f1a06a50b592468e3546b1c` – Merge PR #160 (AP-5-S4 integriert) |
| Logical Cursor-Agent | `Account plattform audit vorbereitung 15` |
| Beobachteter Run-Titel | `Ehrliche aktuelle sitzungsansicht` – nicht als umbenannt behauptet |
| Cursor-Run | https://cursor.com/agents/bc-cccd6820-5dfa-4801-8af9-0659f2e26cf2 |
| `main` Branch Protection | `protected=false` |
| Issue #161 | OPEN |
| Draft-PR | #162, bleibt Draft |
| AP-5 Gate 0 / PR #129 | **integrated** |
| AP-5-S1 / PR #133 | **integrated** |
| AP-5-S2 / PR #137 | **integrated** |
| AP-5-S3 / PR #157 | **integrated** |
| AP-5-S4 / PR #160 | **integrated auf der Baseline** |

## 2. Was dieser Slice geliefert hat

Runtime nur auf `/account/security` plus Auffindbarkeit in Settings:

1. Zustände `loading` / `current` / `unavailable` / `unsupported` / `error`
2. Aktuelle Sitzung nur nach bestätigtem `getUser()`
3. Optional: Zugangscode-Zeit aus `expires_at` – fachlich als Zugangscode, nicht als Sitzungsende oder letzte Aktivität
4. Optional: `currentLevel` `aal1`/`aal2` als Anmeldestufe dieser Sitzung, nicht als Geräteverifikation
5. Optionaler lokaler Browser-/Plattformhinweis, klar als lokal/nicht serververifiziert
6. Andere Sitzungen fest `unsupported` – keine Liste, keine Zahl, kein „0 Geräte“
7. Link zur vorhandenen S3-Aktion „Andere Geräte abmelden“; Logout-Scopes unverändert
8. Dichte Fehlercopy ohne Tokens, `session_id`, Cookies, Auth-Header, User-Agent-Rohdaten
9. Fokussierte adversariale Tests plus Gate-0-Inventory-Aktualisierung

Nicht geliefert: vollständige Session-/Geräteliste, Service Role, `auth.sessions`, Session-Registry, Migration/RLS/Identity, Fingerprinting/IP/Geo, Auth-/MFA-Config, globales Consumer-AAL2, AP-6/AP-7.

**Product-Owner-Gate (STOP, nicht improvisiert):** Eine professionelle vollständige User-Sessionliste würde privilegierte `auth.sessions` / Service Role oder eine neue persistente Session-Registry verlangen. Das bleibt AP-5-P2.

## 3. Vertrag – aktuelle Sitzung

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| `getUser()` ist die Existenz-Authority der aktuellen Sitzung | **current** | `aktuelleSitzungLesen` |
| `expires_at` ist Zugangscode-Zeit, nicht Sitzungsende | **current** | `SITZUNG_ZUGANGSCODE_HINWEIS` |
| AAL nur `aal1`/`aal2`, sonst weglassen | **current** | `sitzungAalLesen` |
| Andere Sitzungen sind `unsupported`, nicht `empty` | **current** | `andereSitzungenLage` / `andereSitzungenAnzahl === null` |
| Lokaler Hinweis ist nicht serververifiziert | **current** | `LOKAL_HINWEIS_LABEL` |
| S3 `local`/`others`/`global` unverändert | **current** | S5 ruft keine Logout-Action auf; nur Anker |
| S4 MFA/AAL-Reconcile unverändert | **current** | keine `challenge`/`verify`/`unenroll` in S5 |
| Traveller-Kontext | **nicht relevant** | keine Citizenship-/Dokumentlogik |

## 4. Tests / Evidence dieses Slices

Siehe `docs/AP5_S5_LOCAL_TEST_EVIDENCE_2026-08-29.md` nach den Repository-Gates.

Fokussiert lokal vor dem ersten Implementation-Commit:

| Lauf | Ergebnis |
| --- | --- |
| Focused S5-Unit | **7/7 pass** (`lib/auth/account-session-view.test.ts`) |
| S5 Vertrag/A11y | **5/5 pass** (`lib/auth/ap5-s5-honest-session-view.test.ts`) |
| S3 + S4 Regression | **pass** |
| Gate-0-Inventory | **8/8 pass** |
| Vollständige Repository-Gates | ausstehend auf dem Implementation-Head |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |

## 5. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Ownership-/Identity-Write. Kein Auth-Config-Push. Keine Service Role. Keine Supabase-Mutation. `supabase/config.toml` unverändert.

## 6. Kosten / Provider / Secrets

Keine neuen laufenden Kosten. Keine Provider. Keine Secrets.

## 7. Residuals / Risiken

- `expires_at` ist Access-Token-Zeit; ohne ehrliche Benennung wäre das eine Falsehood. Die Copy sagt das ausdrücklich.
- `getSession()` bleibt Nebenquelle und darf `getUser()` nicht ersetzen.
- Andere Sitzungen können existieren, ohne sichtbar zu sein. `others` bleibt die vorhandene Steuerungsautorität ohne Anzahl.
- Kein authentifizierter Browser-/Real-Device-Beweis (`/account/security` ist auth-gated; kein Testkonto).
- `main` Branch Protection bleibt `protected=false`.
- Agent-Self-Review ist kein PASS.

## 8. Offene Freigaben

S5 braucht kein Product-Owner-Sondergate. Eine vollständige Sessionliste bleibt AP-5-P2. AP-6/AP-7 starten nicht aus diesem File. P1–P5 bleiben extra gegated.

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #162. Kein Ready. Kein Merge. Kein AP-6/AP-7 durch den Autor-Agenten. Jeder neue Push invalidiert Prior-Gates.

## 10. Zuerst lesen

1. `docs/AP5_S5_HONEST_CURRENT_SESSION_VIEW_TASK_2026-08-29.md`
2. dieser Status
3. `docs/AP5_S5_HONEST_CURRENT_SESSION_VIEW_HANDOFF_2026-08-29.md`
4. `docs/AP5_S5_HONEST_CURRENT_SESSION_VIEW_SELF_REVIEW_2026-08-29.md`
5. ADR-0194
6. ADR-0182 / Gate-0-Status
7. Issue #161
