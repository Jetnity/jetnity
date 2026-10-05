# Jetnity – PR #138 Post-Merge Final New-Chat Checkpoint

Stand: 28. August 2026

Status: **SAUBERER CHAT-ÜBERGABEPUNKT / KEIN AKTIVER PRODUKT-SLICE / LIVE-EVIDENCE GEWINNT IMMER**

Dieser Checkpoint ist die neueste versionierte Übergabe-Evidence nach dem Merge von PR #138. Er superseded ausschließlich spätere operative Aussagen älterer Dateien, die PR #138 noch als Draft / nächsten Review-Schritt nennen. Historische Authoring-, Pre-Merge- und Pre-Apply-Evidence bleibt erhalten und wird nicht gelöscht.

## 1. Letzter vollständig verifizierter Live-Stand

Repository: `Jetnity/jetnity`

- `main`: `4148ab3eb31244b49433d4604c43398cce4246bf`
- Merge: PR #138 – `AP-5-S2 post-merge continuity`
- Reviewed PR-#138 Exact Head: `54bc9d2fb062341b8ff8b8e4b92f0666af725d79`
- Technical-Lead PASS auf diesem Head: Review `5051245059`
- PR-Head vor Merge: 4 ahead / 0 behind; Merge-Base exakt damaliges `main` `f11a17533c56f5746ca9ef56e08c3e4a21a5a3c5`
- Exact-Head Actions PR #138: Run `33172681840` SUCCESS
- Exact-Head Vercel Preview: `dpl_BbDuhHQoNexWbHojuo4iQxWHBvGV` READY
- PR #138 Merge-Commit: `4148ab3eb31244b49433d4604c43398cce4246bf`
- Post-Merge Actions auf exakt diesem `main`: Run `33173185296` SUCCESS
- Post-Merge Vercel Production auf exakt diesem `main`: `dpl_Dfxvu4HgAnwE62cAYuDuKPHEMKEd` READY
- `main` Branch Protection: `protected=false`; bekanntes Governance-Risiko, nicht still ändern

Diese Werte sind Übergabe-Evidence. Ein neuer Chat muss sie live erneut verifizieren, bevor er sie als aktuelle Wahrheit verwendet.

## 2. AP-5 Account Security – aktueller Stand

Integriert:

- AP-5 Gate 0 / PR #129 / Issue #128 CLOSED
- AP-5-S1 Security-UI Truth / PR #133 / Issue #132 CLOSED
- AP-5-S2 signed-in Passwortänderung / PR #137 / Issue #136 CLOSED
- PR #138 Post-Merge Continuity integriert

AP-5-S2-Vertrag:

- signed-in Änderung: `getUser()` → `reauthenticate()` → Nonce → `updateUser({ password, nonce })`
- Password Recovery bleibt eine getrennte Recovery-Authority
- kein Current-Password-Feld
- Netz-/5xx-Fehler von `getUser()` werden nicht als Sessionverlust erfunden

Noch offen innerhalb AP-5, aber **nicht automatisch starten**:

- S3: Logout-UI; heutiges `signOut()` bleibt global, optional `others`; Fehler nicht schlucken; JWT-Restlaufzeit ehrlich
- S4: nutzerfreundlicher challenge/verify-Step-up vor Unenroll eines **verifizierten** TOTP-Faktors; GoTrue verlangt dafür bereits AAL2; kein globales Consumer-AAL2
- S5: aktuelle Sitzung ehrlich darstellen; andere Sitzungen `unsupported`; keine Fake-Geräteliste

S3–S5 sind normale Technical-Lead-Gates, benötigen aber jeweils einen eigenen Task, frische Live-Rekonstruktion und einen neuen logischen Slice.

Product-Owner-Sondergates aus AP-5 Gate 0 bleiben:

- P1: Default-Logout `global` → `local`
- P2: Session-/Geräteliste über Service Role, `auth.sessions` oder neues Schema
- P3: Consumer-AAL2 / Login-Hard-Gate
- P4: Production Auth-Config, `current_password`, Passkey/OAuth live, `sessions_single_per_user`
- P5: C2 / REVOKE / SECURITY DEFINER / RLS / Identity – kein normaler AP-5-Slice

## 3. Account-Programm danach

Kanonische Authority: `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`.

Nach AP-5 bleiben programmatisch u. a.:

- AP-6a Legal Foundation (`/privacy`, `/terms`) – keine erfundenen Rechtstexte
- AP-6b Privacy / Consent / Export / Kontolöschung – Migration/RLS/Production-Gates beachten
- AP-7 Account Traveller Registry – separat und sensitiv gegated
- AP-8 Reiseprofil / Präferenzen – strikt getrennt von Citizenship/Dokument-Wahrheit
- AP-9 Favoriten
- AP-10 Booking Overview / Commercial Truth ohne erfundene Buchungen oder Preise
- AP-11 Notifications / Themen / Quiet Hours / Frequency Caps / Consent-Nähe
- AP-12 Subscription / Entitlement Foundation – kein Payment-/Stripe-Live ohne Sondergate

Das ist eine Programmübersicht, keine automatische Startreihenfolge. Binding Build Order + Live-Evidence entscheiden.

## 4. Traveller / P2-TA-04

Weiterhin verbindlich:

- Traveller → mehrere Citizenships → mehrere Dokumente/Credentials → kontextabhängig bewertete zulässige Optionen
- `documents[0]` und `evaluations[0]` sind keine Product Truth
- P2-TA-06 / PR #113 integriert; nicht erneut bauen
- P2-TA-03 / PR #117 integriert; kanonischer Account-Plan vorhanden
- P2-TA-04 Gate 0 / PR #120 integriert
- P2-TA-04 C1 / PR #126 integriert
- Production `20260828015304_traveller_write_contract_integrity` angewendet und live verifiziert; **kein Re-Apply**
- C2 nicht automatisch starten; hinter eigenen Product-Owner-/Security-/RLS-Gates

## 5. Supabase – letzter live verifizierter Zustand

Production-Projekt:

- project ref `qscbgcdmivbbnzrcyegn`
- default branch `main`
- ACTIVE_HEALTHY

Non-default Development-Branch existiert weiterhin:

- Name: `develop`
- branch id: `74809331-0243-493a-8c14-20bb78c015f5`
- project ref: `yfvbxvijcorffwxbxahl`
- `is_default=false`
- preview status `ACTIVE_HEALTHY`
- Branch-/Functions-Status `FUNCTIONS_DEPLOYED`

Production Migration History endet beim Übergabepunkt mit:

- `20260826220000`
- `20260826230000`
- `20260826240000`
- `20260827010000`
- `20260827170000_admin_aal2_data_plane_alignment`
- `20260828015304_traveller_write_contract_integrity`

Development `yfvbxvijcorffwxbxahl` enthält die historische/develop-spezifische `20260828120000_traveller_write_contract_integrity`. Nicht mit dem Production-Apply verwechseln und nichts blind re-applizieren.

Admin AAL2 `20260827170000` ist Production exakt einmal angewendet und verifiziert. Gate B ist bereits angewendet. Kein Re-Apply.

## 6. Project Sanitation

- Issue #134 CLOSED / completed
- PR #135 Project Sanitation Closure integriert
- ADR-0184 ist der kanonische Retention-/Sanitation-Vertrag
- `Cursor-Agent: Jetnity quality security audit 3` abgeschlossen
- kein tatsächliches Branch-/Tag-/Cloud-Delete wurde durch #135 ausgeführt

Live offene historische Draft-PRs beim Übergabepunkt:

- #88 Project Sanitation Audit – historische Evidence; PR-Disposition nach ADR-0184 `CLOSE-SAFE`, Source-Branch weiterhin `HISTORICAL-EVIDENCE`
- #52 historischer ChatGPT-Handoff
- #50 historischer Provider-S1-Status
- #40 historischer Admin-Audit
- #39 historischer Account-Audit
- #28 Future Trip Collaboration Foundation

Diese alten PRs **nicht mergen, schließen oder ihre Branches löschen**, nur um die Liste aufzuräumen. Erst ADR-0184 / aktuelle Sanitation-Matrizen und Live-Evidence prüfen. PR-Close und Branch-Delete sind getrennte Entscheidungen. #28 bleibt Future Work.

## 7. Offene Issues beim Übergabepunkt

Live offen:

- #20 Future – gemeinsame Reiseplanung für Paare, Familien und Gruppen
- #109 Visitor Search residual – Country/Alias/Intent Relevance
- #110 Homepage Hero future slice – natürliche Multi-Destination-Intent

#109 und #110 sind ausdrücklich dokumentierte Future/Residual-Themen und werden nicht automatisch gestartet.

## 8. Trip Workspace / Provider

Trip Workspace:

- TW1/2/3/4/5, TW6-A, TW6-B Runtime, TW6-REST-01, Visitor Search UX und TW7-A integriert/geschlossen
- TW-8 bleibt hinter Provider S5 + realer belastbarer Commercial Provenance gegated
- TW-9 nicht automatisch starten

Provider:

- S1–S3 integriert
- S5-A Commercial Provenance Domain Contract integriert
- S5-B nicht automatisch gestartet
- keine realen Provider, Production-Secrets, Verträge oder paid calls automatisch aktivieren

## 9. Production / Admin / Truth

- Production Gate A: PASS
- Production Gate B: operativ PASS; Vier-Datei-Vertrag bereits angewendet, kein Re-Apply
- Admin AAL2 Production `20260827170000_admin_aal2_data_plane_alignment`: angewendet und verifiziert, exakt einmal
- `aktuelles_admin_aal2()` live; Admin-Capabilities verlangen Rolle + AAL2

Jetnity erfindet keine harte externe Wahrheit: keine Preise, Availability, Provider Health, Booking Availability, Visa-/Einreise-/Safety-/Impf-/Wetter-/Commercial-Truth ohne belegte Evidence.

## 10. Agent-Rotation

Keine offene Account-Runtime-Generation am Übergabepunkt.

Abgeschlossen / nicht wiederverwenden:

- Account Generation 10: AP-5-S2 / PR #137 + PR #138 Continuity
- Account Generation 9: AP-5-S1 / PR #133
- Account Generation 8: AP-5 Gate 0 / PR #129
- Account Generation 7: P2-TA-04 C1 / PR #126
- Account Generation 6: P2-TA-04 Gate 0 / PR #120
- Account Generation 5: P2-TA-03 / PR #117
- Account Generation 4: P2-TA-06 / PR #113
- Quality/Security Generation 3: Project Sanitation / PR #135
- Quality/Security Generation 2: PR #88 historical only

Wenn nach Live-Rekonstruktion ein neuer Account-Slice tatsächlich gewählt wird, wäre die nächste frische Generation voraussichtlich:

`Cursor-Agent: Account plattform audit vorbereitung 11`

Das ist **keine** automatische Freigabe für AP-5-S3.

## 11. Wichtig für den neuen Chat

Der vorherige Chat endet bewusst an einem sauberen Integrationspunkt. Es läuft kein von ihm freigegebener neuer Produktslice.

Der neue Technical Lead muss zuerst:

1. alle kanonischen Dateien lesen,
2. diesen Checkpoint lesen,
3. `origin/main` live prüfen,
4. offene PRs/Issues/Branches live prüfen,
5. CI/Vercel live prüfen,
6. Supabase `list_branches` und Migration History live prüfen,
7. Binding Build Order gegen den realen Stand abgleichen,
8. P0–P3 / Shared Contracts / Product-Owner-Gates prüfen,
9. erst dann einen nächsten Slice vorschlagen oder starten.

Nicht automatisch starten:

- AP-5-S3/S4/S5
- AP-7
- P2-TA-04 C2
- TW-8/TW-9
- Provider S5-B / Provider-live
- neue globale AAL2-Arbeit
- Direction A
- Issue #109/#110
- neuer Search-Slice
- Homepage Multi-Destination Runtime
- Public Indexing / Domain Cutover
- Native-App-Implementierung

## 12. Supersession-Hinweis

Falls `JETNITY_START_HERE.md`, `ROADMAP.md`, `docs/ACTIVE_WORK_STATUS.md` oder `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` an einzelnen Stellen noch `Draft-PR #138` als nächsten Schritt nennen, ist genau diese Aussage **Pre-Merge-Evidence und durch diesen Post-PR-#138-Checkpoint superseded**.

Alle anderen fachlichen Verträge dieser Dateien bleiben gültig, soweit sie nicht durch neuere Live-Evidence oder diesen Checkpoint ausdrücklich ersetzt werden.
