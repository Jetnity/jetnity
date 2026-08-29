# Jetnity – AP-5-S5 – Handoff

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN AP-6/AP-7**  
Cursor-Agent: **`Account plattform audit vorbereitung 15`**  
Cursor-Session/Run-ID: `bc-cccd6820-5dfa-4801-8af9-0659f2e26cf2`  
Issue: [#161](https://github.com/Jetnity/jetnity/issues/161)  
Branch: `feat/ap5-s5-honest-current-session-view-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/162

## Zuerst lesen

1. `docs/AP5_S5_HONEST_CURRENT_SESSION_VIEW_TASK_2026-08-29.md`
2. `docs/AP5_S5_HONEST_CURRENT_SESSION_VIEW_STATUS_2026-08-29.md`
3. `docs/AP5_S5_LOCAL_TEST_EVIDENCE_2026-08-29.md` nach den Gates
4. ADR-0194 in `DECISIONS.md`
5. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
6. ADR-0182
7. Issue #161

## Was ein neuer Chat wissen muss

S5 zeigt in `/account/security` die **aktuelle** Sitzung mit vorhandener User-Auth-Truth. Andere Sitzungen bleiben ausdrücklich `unsupported`. Das ist keine Session-Registry.

Harte Wahrheiten:

1. Der installierte User-Client hat keine unterstützte `listSessions`-/`getSessions`-API.
2. `unsupported` ist nicht `empty` und nicht `0`.
3. `getUser()` bestätigt die aktuelle Sitzung. JWT/`session_id` bleiben intern.
4. `expires_at` darf nur als Zugangscode-Zeit erscheinen, nie als Sitzungsende oder letzte Aktivität.
5. AAL ist optional und nur `aal1`/`aal2`. Das verifiziert kein Gerät.
6. Lokale Browser-/Plattformklasse nur, wenn ableitbar und klar lokal gekennzeichnet. Kein Fingerprinting/IP/Geo, kein User-Agent-Rohtext.
7. S3-Logout-Scopes `local`/`others`/`global` bleiben die Steuerungsautorität. S5 verlinkt nur.
8. S4 MFA-Step-up/AAL-Reconcile bleibt unberührt.
9. Eine vollständige Sessionliste wäre AP-5-P2 (Product-Owner-Gate). Nicht improvisiert.
10. Generation 15 ist nur für AP-5-S5. Nach S5 kein AP-6/AP-7.

Exact Cursor-Session-ID: `bc-cccd6820-5dfa-4801-8af9-0659f2e26cf2`.  
Beobachteter Titel: `Ehrliche aktuelle sitzungsansicht`. Keine Rename-Fähigkeit; UI nicht als umbenannt behauptet.

## Was bewusst nicht gebaut wurde

Service Role, privilegiertes Session-Schema, Session-Registry/Persistenz, Migration/RLS/Identity, Device-Fingerprinting, Auth-/MFA-Config, globales Consumer-AAL2, Passkeys/OAuth/Recovery-Neuarchitektur, AP-6/AP-7.

## Shared Contract

Kein neuer Auth-Vertrag. ADR-0194 präzisiert nur die UI-Nutzung der bereits in ADR-0182 festgestellten Grenze: aktuelle Sitzung ja, Listing unsupported.

## Residuals

- Kein authentifizierter Browser-/Real-Device-Beweis.
- Zugangscode-Zeit kann missverstanden werden, wenn Copy ignoriert wird.
- `main` `protected=false`.
- Agent-Self-Review ist kein PASS.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #162. Nicht Ready. Nicht mergen. Kein automatischer AP-6/AP-7-Start.
