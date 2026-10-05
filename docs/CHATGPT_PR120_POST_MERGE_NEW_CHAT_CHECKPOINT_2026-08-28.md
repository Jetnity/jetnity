# Jetnity – PR #120 Post-Merge New Chat Checkpoint

Stand: 28. August 2026  
Typ: **POST-MERGE CONTINUITY / LIVE-EVIDENCE CHECKPOINT**

## 1. Verifizierter Integrationsstand

P2-TA-04 Gate 0 ist abgeschlossen und integriert.

- PR #120: **MERGED**
- Issue #119: **CLOSED / completed**
- Author-Branch: `docs/p2-ta-04-traveller-write-path-gate0`
- Final reviewed Author-Head: `4c8b29bd10d6ab15936d09f03d8e155d77afd2b2`
- Technical-Lead Final PASS Review: `5047001179`
- Merge-Commit auf `main`: `8d8f3d578561d878be50fc7e1d28aad893849bb5`
- Post-Merge GitHub Actions: Run `33131882115` **SUCCESS** auf exakt `8d8f3d578561d878be50fc7e1d28aad893849bb5`
- Post-Merge Vercel Production: `dpl_2X3UwSpYKqx2qVtqpPFy6G6hVKCY` **READY** auf exakt demselben Merge-SHA

Live-Evidence gewinnt immer. Vor jeder neuen Arbeit `main`, offene PRs/Issues, CI, Vercel und relevante Supabase-Grenzen erneut prüfen.

## 2. Was PR #120 integriert hat

Gate 0 war Audit / Security Architecture / Evidence, keine produktive DB-Mutation.

Integriert wurden:

- unabhängige Live-Verifikation von Traveller-Grants, Owner-RLS, Composite-FKs, Triggern und Function-Security;
- ADR-0180;
- vollständige Caller-/Write-Path-Inventur;
- Invarianten- und adversarial Gate-0-Matrix;
- ein Evidence-Lock-Test `lib/readiness/p2-ta04-write-path-inventory.test.ts`;
- Status, Handoff, Self-Review und Continuity-Zeiger;
- read-only Live-Evidence ohne Row-Daten oder Secrets.

Es gab keine Runtime-Verhaltensänderung, keine Migration, kein Schema-Apply, kein GRANT/REVOKE, keine RLS-Änderung, keine Auth-/MFA-/AAL-Änderung, keinen Production-Datenwrite und keine Supabase-Branch-Mutation.

## 3. Verbindlicher Security-/Integrity-Befund

Live Production `qscbgcdmivbbnzrcyegn` und unabhängig relevant gegengeprüft auf non-default `develop` `yfvbxvijcorffwxbxahl`:

- `authenticated` besitzt `SELECT`, `INSERT`, `UPDATE`, `DELETE` auf `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`;
- Owner-RLS bleibt `user_id = auth.uid()`;
- Composite-FKs binden Children an denselben `(traveller_id, trip_id, user_id)`-Graph;
- kein Cross-User-P0 wurde bewiesen;
- `party_schreiben(jsonb)` ist SECURITY INVOKER und benötigt deshalb heute die Tabellen-DML-Rechte;
- `travellerSetzen` und `partyUebernehmen` schreiben über `party_schreiben`;
- `travellerEntfernen` löscht derzeit direkt aus `trip_travellers`;
- aktuelle App-/Lib-/Component-Pfade schreiben die beiden Child-Tabellen nicht direkt;
- direkte authenticated-DML bleibt trotzdem via PostgREST möglich und kann Write-Contract-/Integritätssemantik umgehen.

P2-TA-04 ist deshalb **P2 Write-Contract / Integrität**, nicht Ownership-P0.

## 4. Fehlende Invarianten / Residuals

Gate 0 hat insbesondere bestätigt:

- kein DB-Limit von 20 `trip_travellers` je Trip;
- `party_schreiben` prüft Payload-Länge, nicht Gesamtbestand + neue Refs;
- Child-Limits 8/12 werden durch Trigger nur auf INSERT geprüft, nicht bei UPDATE-Reparent;
- direkter Tabellen-DML kann partielle Mutation statt kanonischem Replace durchführen;
- `party_schreiben` löscht keine Traveller-Zeilen;
- Legacy-Singularfelder bleiben P3/Expand-Contract-Residual;
- `main` Branch Protection bleibt `protected=false`.

## 5. ADR-0180 / empfohlene Closure

ADR-0180 empfiehlt **Option C – gestuft fail-closed**, aber PR #120 hat nichts davon implementiert.

### C1 – noch NICHT gestartet

Vorgeschlagener späterer kleinerer Implementation-Slice:

- kanonische Delete-Semantik über RPC;
- DB-Party-Cap 20;
- Child-Limit auch bei UPDATE;
- noch **kein** REVOKE;
- noch **kein** SECURITY DEFINER.

C1 benötigt Migration/Function-/Trigger-Änderungen und damit **ausdrückliche Product-Owner-Freigabe vor Ausführung/Production-Apply**.

### C2 – noch NICHT gestartet

Erst nach C1 und erneutem Evidence-Gate:

- gehärtete SECURITY-DEFINER-Write-RPCs;
- danach authenticated Tabellen-DML entziehen;
- SELECT getrennt bewerten/erhalten;
- adversarial Ownership-/Privilege-Escalation-Testpflicht.

C2 ist ein großes Security-/Ownership-/Privilege-Gate und braucht ebenfalls ausdrückliche Product-Owner-Freigabe.

Ein blindes `REVOKE` ist verboten, weil es den aktuellen SECURITY-INVOKER-RPC und den direkten Delete-Pfad brechen würde.

## 6. Was ausdrücklich NICHT gestartet wurde

Kein:

- C1;
- C2;
- AP-5;
- AP-6a / AP-6b;
- AP-7 Account-Traveller Registry;
- RLS-/Ownership-Change;
- SECURITY DEFINER/INVOKER-Wechsel;
- Production-Migration;
- sensitive Passnummer/Scan/MRZ/Biometrie-Persistenz;
- Provider S5-B;
- TW-8 / TW-9;
- Issue #109 / #110 Runtime;
- Homepage-Multidestination-Runtime;
- Public Indexing / Domain Cutover;
- Native-App-Implementierung.

## 7. Traveller Truth bleibt unverändert

> Ein Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Keine Default-Citizenship. Issuer ≠ Citizenship. `documents[0]` / `evaluations[0]` sind keine Product Truth.

Current Traveller Truth bleibt trip-scoped. AP-7 bleibt Shared-Contract- und Product-Owner-gated.

## 8. Agent-Rotation

Generation 6:

`Cursor-Agent: Account plattform audit vorbereitung 6`

ist mit P2-TA-04 Gate 0 abgeschlossen.

Ein neuer logischer Account-/Traveller-Slice braucht eine frische nummerierte Session. Generation 6 nicht für einen neuen Slice weiterverwenden.

## 9. Nächster Technical-Lead-Schritt

**Kein automatischer Folgeslice.**

Der fachlich naheliegende P2-TA-04-Folgeschritt wäre C1, aber er berührt Migration/Function/Trigger und ist deshalb ohne ausdrückliche Product-Owner-Freigabe **nicht startbar**.

Bis zu einer solchen Freigabe:

- C1/C2 nicht bauen;
- AP-5 nicht automatisch vorziehen;
- Binding Build Order und alle offenen P0/P1/P2 erneut live prüfen, falls stattdessen ein anderer erlaubter Slice erwogen wird.

Dieses Dokument ist Post-Merge-Evidence für PR #120. Es ersetzt nicht die Pflicht, Live-Evidence vor neuer Arbeit erneut zu prüfen.