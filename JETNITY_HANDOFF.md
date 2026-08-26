# Jetnity – Handoff und nächste Schritte

Stand: 26. August 2026  
Status: **kanonischer operativer Übergabepunkt nach PR #86 auf `main @ 38ec8be7`. Kein aktiver Runtime-Slice. Nächster Schritt ist unabhängiger Technical-Lead-Review von Draft-PR #85, danach erst der finale ChatGPT-Superprompt. Kein neuer Produktslice.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`.  
Aktueller Checkpoint: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.

> **Do not blindly trust this handoff — live verify first.**

Ältere Handoffs (`docs/TRIP_WORKSPACE_HANDOFF.md`, Account-/Provider-/Admin-Slice-Handoffs, ChatGPT-Handoff-PR #52) sind historische Evidence und dürfen diesen Stand nicht überschreiben.

## 1. Pflicht vor jeder neuen Arbeit

Lies zuerst mindestens:

- `JETNITY_START_HERE.md`
- `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`
- relevanten Slice-Task/Status/ADR/Checkpoint.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Ahead/Behind/Merge-Base, tatsächliche Diffs, Actions, Vercel, relevante Supabase-/Migrationen, Review-Threads und Blocker.

## 2. Aktuelle Merge-Governance

Der Product Owner hat am 26. August 2026 ausdrücklich entschieden:

> **ChatGPT / Technical Lead darf normale scope-treue PRs selbst Ready setzen und mergen, wenn er sie zuvor unabhängig und vollständig geprüft hat.**

Die ältere per-PR-Merge-Pflicht aus `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md` und `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md` ist dafür **superseded**. Die Dokumente bleiben historische Evidence.

Pflicht vor Ready/Merge:

- nicht auf Agenten-Abschlussberichte oder grüne Tests blind vertrauen;
- tatsächlichen Diff und alle betroffenen Dateien prüfen;
- Tests und Testannahmen fachlich hinterfragen;
- Security/Privacy/Truth/Shared Contracts prüfen;
- Exact-Head CI und Vercel prüfen;
- relevante Supabase-/Production-Grenzen prüfen;
- bei Problemen zuerst selbst korrigieren oder den zuständigen Cursor-Agenten korrigieren lassen;
- danach neu gaten und neu reviewen;
- erst bei echtem unabhängigen PASS mergen.

Feature-Autoren dürfen ihr Self-Review nicht als unabhängigen Technical-Lead-PASS ersetzen.

Besondere Product-Owner-Gates bleiben bestehen für Production-Migrationen/destruktive Daten, große RLS/Identity/Auth-Änderungen, sensitive Pass/MRZ/Biometrie-Speicherung, sensible externe Datenweitergabe, reale Provider/Secrets/paid calls, reale Payments, Kosten > USD 100/Monat, fundamentale Build-Order-/Business-Änderungen und Public-/Provider-/Store-Live-Aktivierungen.

## 3. Live integrierter Stand

Aktueller `main`, live 26. August 2026 nach PR #86:

`38ec8be79a6ce7758be81fd5d564819d638140d6`

GitHub Actions Exact Head: Run `32991955365` SUCCESS auf `38ec8be7`.  
PR-#86-Exact-Head Actions: Run `32989862339` SUCCESS auf `0f809857`.  
Vercel Production Exact Head: Deployment `6108029117` SUCCESS auf `38ec8be7`.  
Öffentlicher Alias: `https://jetnity-app.vercel.app` → HTTP 200, HTML `noindex, nofollow`, Canonical `https://jetnity.com`.  
`https://jetnity.com` ist die kanonische Produktdomain, aber ohne öffentliche DNS-Auflösung. `jetnity.ch` bleibt Entry-/Redirect-Domain. Kein Cutover. Kein Public Indexing.

Letzte relevante Integrationen:

- PR #81 – Guest→Account Commercial Truth → `86567f17`;
- PR #84 – P1-TA-02 Official Evaluation Option Scope → `2468160e`;
- PR #82 – TW6-A Create-Entry → `c4ea47aa`;
- PR #83 – Provider S5-A Commercial Provenance → `3b317bc6`;
- PR #80 – Central Admin AAL2 Guard → `d3faa2a0`;
- **PR #86 – D0 live metadata boundary / P1-D0-LIVE-01 → `38ec8be7`.** Kein D1/G1.

Trip Workspace integriert:

- TW-1 ✅
- TW-2 ✅
- TW-4 ✅
- TW-3 ✅
- TW-5 ✅
- TW6-A Create-Entry ✅
- TW6-REST-01 ❌ offen

Weitere integrierte Foundations:

- Foundation C Readiness;
- Foundation D Route & Transit;
- Foundation E Traveller Context;
- Safety/Disruption;
- Timing/Seasonal;
- Account AP-1 bis AP-3;
- Provider Readiness S1 bis S3 und **S5-A**;
- Admin A bis C und **Admin-AAL2 Application-Guard**;
- D0/G0 Foundation Audit, D0-1, D0-2;
- QS-1, QS-2 Audit.

## 4. Guest / Account

- Gast: genau ein aktiver Guest-Trip-Slot.
- Konto: darf mehrere Reisen haben.
- TW6-A: Generic-CTAs dürfen eine Account-Session nicht durch liegengebliebenen Guest-LocalStorage überstimmen.
- Zielspezifische Handoffs dürfen nicht still auf eine alte Gastreise umgebogen werden.
- Guest→Account Commercial Truth: lokale Gastdaten sind keine Provider-Evidence. Unbewiesene Stay-/Activity-Handelsfelder werden fail-closed entfernt.

## 5. Traveller

> Ein Traveller → viele Staatsbürgerschaften → viele Dokumente / Credentials → kontextuell gültige Optionen.

Kein globaler Default-Pass. Issuer Country ≠ Citizenship. P1-TA-02 geschlossen. **P2-TA-06 (`documents[0]` in `travellerNormalisieren`) bleibt offen.** `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` fehlt auf `main` (P2-TA-03, nur historisches PR #39) und wurde hier nicht still kopiert.

## 6. Provider / Commercial Provenance

S5-A ist integrierte Domain-Wahrheit. S5-B ist nicht gestartet.

Keine Provideraktivierung. Keine paid calls. TW-8 bleibt hinter S5 **und** realer Commercial Provenance gegated.

## 7. Admin AAL2

Application-Guard integriert.

Production-Supabase-Migration **nicht** angewendet. Development-Artefakt ist versioniert; Development hat `admin_aal2_data_plane` angewendet, Production nicht.

## 8. D0/G0-Stand

D0-1, D0-2 und **P1-D0-LIVE-01** (PR #86) geschlossen.

HTML-robots folgt `darfIndexieren`. Public Canonical / metadataBase / OG / JSON-LD verwenden `https://jetnity.com`. `*.vercel.app` ist niemals kanonische Produktdomain. `/planen` emittiert robots explizit. `NEXT_PUBLIC_ALLOW_INDEXING` bleibt deny/default false.

Kein DNS, kein Domain-Cutover, kein Redirect, kein Public Indexing.

Weiter offen: **D0-P1-03** Legal-404 (`/privacy`, `/terms` live 404), D0-P2-04 hreflang, D0-P2-05 JSON-LD, G0-P2/P3-Reste. Kein D1/G1.

## 9. Offene PRs – nicht wieder aufnehmen

Aktuell offen, alle Draft. Live erneut geprüft nach PR #86; keiner der historischen PRs wurde geschlossen:

| PR | Klasse |
| --- | --- |
| **#85 Final continuity handoff** | **AKTIVER docs-only Continuity-Draft.** Unabhängiger TL-Review. Nicht Ready. Nicht mergen durch den Autoren-Agenten. |
| #52 ChatGPT TL handoff 2026-08-24 | HISTORICAL / SUPERSEDED |
| #50 S1 merged-status docs | HISTORICAL / INTEGRATED ELSEWHERE |
| #40 Admin Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #39 Account Platform Audit | HISTORICAL / INTEGRATED ELSEWHERE |
| #28 Trip Collaboration Foundation | HISTORICAL / SUPERSEDED / DO NOT RESUME |

Keine PRs schließen. Keine Branches löschen.

## 10. Agenten

Alle sechs spezialisierten Workstreams plus Native: **kein offener Auftrag**. Native bleibt reserviert.

## 11. Supabase / Production

Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.  
Letzte Production-Migration: `20260824140000`.  
Nicht Production: `20260824160000`, `20260824180000`, `20260826090000_admin_aal2_data_plane`.

## 12. Offene globale Risiken

- `main` Branch Protection ist deaktiviert (`protected=false`);
- D0-P1-03 Legal-404 bleibt P1;
- P2-TA-06 first-document-Residual bleibt offen;
- TW6-REST-01 ist nicht erledigt;
- S5-B / echte Provider / TW-8 bleiben gegated;
- Production-AAL2-Datenebene bleibt gegated;
- historische PR-Bodies/Handoffs sind nur Evidence ihres Zeitpunkts.

## 13. Exakter nächster Technical-Lead-Schritt

Unabhängiger Review von Draft-PR #85. Danach schreibt ChatGPT / Technical Lead den finalen Superprompt für den neuen Chat.

**Nicht** starten: TW6-REST-01, TW-7, TW-8, S5-B, AP-Folgeslice, Admin D–K, Growth-Folgeslice, D1/G1, Production-Migration, Provideraktivierung, Domain-Cutover.

## 14. Continuity

Kein Fortschritt darf nur im Chat existieren. Neue Chats/Agenten raten niemals aus Screenshots oder Erinnerung. **Live-Evidence zuerst.**
