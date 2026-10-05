# Jetnity – Requirements Truth-Ops S4-R1 Task

Stand: 31. August 2026  
Status: **BINDING IMPLEMENTATION TASK / PROVIDER-NEUTRAL / NO LIVE PROVIDER / TL CONTROLLED**

Issue: **#292 – Requirements Truth-Ops S4-R1 – timeout, kill-switch & bounded freshness**  
Start-Baseline: `main@67f54135957cf09e39585a8cff662ecc3645b39a`  
Branch: `feat/requirements-truth-ops-s4-r1-2026-08-31`

## 1. Ziel

Dieser Slice schließt die technischen P1-Grenzen zwischen Jetnitys bestehender Requirements/Official-Truth-Engine und einem späteren echten Requirements-Provider.

Er aktiviert **keinen** Provider. Er baut ausschließlich die provider-neutrale Truth-/Ops-Sicherheitsnaht:

1. Abort-/Timeout-Vertrag,
2. Readiness-Kill-Switch,
3. klare technische Failure-Semantik,
4. bounded `checkedAt`-Freshness,
5. Tests und dauerhafte Evidence.

## 2. Live verifizierte Ausgangslage

Auf Start-Baseline `67f54135957cf09e39585a8cff662ecc3645b39a` gilt:

- `lib/readiness/provider.ts`: `RequirementsProvider.evaluate(anfrage)` hat kein `AbortSignal`.
- `lib/readiness/engine.ts`: `provider.evaluate(kanonisch)` wird ohne Domain-Timeout ausgeführt.
- `lib/readiness/official.ts::officialFrische()` prüft Fingerprint, `validFrom` und `validUntil`, aber kein maximales Alter von `checkedAt`.
- `requirementsProviderAus()` liefert `null`.
- `app/api/readiness/requirements/route.ts` hat `maxDuration = 10`, propagiert `req.signal` aber noch nicht in die Provider-Ausführung.
- `lib/provider-ops/zustand.ts` bietet bereits die gemeinsame fail-closed Kill-Switch-Form; diese ist wiederzuverwenden.
- Provider Transport Core akzeptiert bereits `AbortSignal` (`ProviderTransportRequest.signal` / fetch `signal`). Kein zweiter HTTP-Stack.
- kein echter Requirements-Provider, keine Secrets, keine paid calls, kein Vertrag/DPA.

## 3. Verbindliche Architekturentscheidungen

### 3.1 Provider-Port / Abort

`RequirementsProvider.evaluate(...)` erhält einen expliziten Abort-Vertrag.

Zielrichtung:

```ts
evaluate(anfrage: RequirementsAnfrage, signal: AbortSignal): Promise<RequirementsProviderZeile[]>
```

Ein späterer Adapter muss dieses Signal in den bestehenden Provider Transport Core weiterreichen. Kein eigener Fetch-/Retry-/HTTP-Unterbau in Readiness.

### 3.2 Domain-Timeout

Die Requirements-Domain muss auch einen fehlerhaften oder testweise injizierten Adapter begrenzen können.

- Standard-Hard-Timeout: **4.000 ms**.
- Der öffentliche Route-Handler bleibt mit `maxDuration = 10` darüber und bekommt genügend Abschlussreserve.
- Testbarkeit darf über Dependency Injection / bounded Test-Optionen erfolgen; Production darf keinen unbounded Wert aus einer frei gesetzten Client-Eingabe übernehmen.
- Timeout muss den Provider per `AbortController` abbrechen, nicht nur `Promise.race` ohne Cancellation.
- Ein bereits abgebrochenes äußeres Signal darf keinen Provider-Call starten.
- `req.signal` soll vom Requirements-Route-Pfad bis zur Domain-Ausführung propagiert werden.

### 3.3 Failure-Semantik

Technische Ursachen müssen intern unterscheidbar sein, mindestens:

- `timeout`
- `aborted`
- `temporarily_unavailable`
- `unavailable`

Keine thrown Vendor-/Secret-/Raw-Error-Werte in öffentliche Antworten oder Evidence übernehmen.

Official-Truth-Abbildung bleibt fail closed:

- kein Provider / Kill-Switch / Provider grundsätzlich nicht verfügbar → `provider_unavailable` bzw. bestehende unavailable/unknown-Semantik;
- Timeout / temporäre Quelle / transienter Providerfehler → `source_temporarily_unavailable`;
- Abort bleibt intern unterscheidbar und darf niemals Hard Truth minten; die bestehende öffentliche Official-Freshness darf konservativ auf temporär/nicht aktuell fallen.

Keine neue `required`/`not_required`/`conditional`-Wahrheit aus Fehlern ableiten.

### 3.4 Readiness-Domain-Kill-Switch

Neue domain-spezifische Readiness-Zustandsgrenze auf Basis von `providerOpsZustand`.

Verbindlicher Flag-Name:

`JETNITY_READINESS_AKTIV`

Regeln:

- Production ist **hart aus**, unabhängig von Flag oder späteren Credentials.
- Flag muss ausdrücklich `true` oder `1` sein.
- Zugang ist nur vorhanden, wenn tatsächlich ein Requirements-Provider-Objekt vorhanden ist.
- `requirementsProviderAus()` bleibt in diesem Slice **immer `null`**.
- Dadurch bleibt Preview/Production ohne Provider vollständig fail closed.
- Provider-Ops-Board soll nach Möglichkeit den echten Readiness-Domain-Zustand verwenden statt dauerhaft `zugangVorhanden: false` inline zu duplizieren, sofern dies scope-klein bleibt.

### 3.5 Bounded Freshness / TTL

Jetnity setzt eine eigene konservative Max-Age-Grenze für `checkedAt`.

**Globaler Jetnity-Ceiling für Official Evidence: 60 Minuten.**

- `checkedAt` bedeutet Jetnity Retrieval-/Evaluation-Zeitpunkt.
- `checkedAt` ist **nicht** Vendor-`lastUpdatedAt` und darf nicht damit befüllt/gleichgesetzt werden.
- Wenn `now - checkedAt` die zulässige Max-Age überschreitet, darf `officialFrische()` nicht `current` liefern; fail closed zu `recheck_needed`.
- Zukünftige provider-spezifische Policy darf **strenger** sein. Eine lockerere Policy als der globale Ceiling ist außerhalb dieses Slices und benötigt neue Entscheidung/Evidence.
- Future Clock Skew bleibt wie heute separat behandelt.
- Invalides/unplausibles `checkedAt` bleibt nicht vertrauenswürdig.

Die Implementierung darf eine testbare Max-Age-Injektion vorsehen, aber keine unbounded Production-Konfiguration.

## 4. Traveller-/Truth-Invariants – nicht verändern

Verbindlich:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Daher:

- kein Default-/Primary-/Preferred-/Chosen-Pass;
- keine Default-Citizenship;
- Issuer Country ≠ Citizenship;
- kein `documents[0]` / `evaluations[0]` als Product Truth;
- kein Origin-/Residence→Nationality-Fallback;
- keine Transitländer still verwerfen;
- keine Passnummern, MRZ, Scans, Biometrie, DOB oder Health-Daten ergänzen.

## 5. Erwartete Codeflächen

Scope-treue Änderungen dürfen insbesondere betreffen:

- `lib/readiness/provider.ts`
- `lib/readiness/engine.ts`
- `lib/readiness/official.ts`
- `lib/readiness/anforderungen.ts`
- `app/api/readiness/requirements/route.ts`
- neue kleine `lib/readiness/zustand.ts`
- `lib/admin/provider-ops-board/runtime.ts` nur für Readiness-Zustandswiring
- zugehörige Tests
- Slice-Status/Handoff/Self-Review-Dokumente

Änderungen außerhalb dieser Flächen müssen im Handoff explizit begründet werden.

## 6. Harte Non-Scope-Grenzen

Strikt verboten in S4-R1:

- echter Timatic-/Sherpa-/anderer Vendor-Adapter;
- Providerwahl oder Ranking eines Vendors;
- Vendor-Kontakt, Signup, Vertrag, DPA, Commercial Terms;
- API Key / Secret / Credential-Erstellung;
- echte oder paid Provider-Requests;
- `requirementsProviderAus()` auf non-null drehen;
- Workspace-Live-Provider-Wiring;
- Supabase-Migrationen, RLS/Ownership, Storage;
- Auth/MFA/AAL;
- Commercial Runtime Writer / `live_api` / `persisted_snapshot`;
- neue sensitive Traveller-Daten;
- Legal Copy;
- neue recurring costs;
- Public Launch/Indexing/Domain/Store-Cutover.

## 7. Tests / Acceptance

Mindestens gezielt abdecken:

1. Provider-Port erhält AbortSignal.
2. Domain-Timeout abortet einen hängenden Provider und endet fail closed.
3. externes AbortSignal verhindert/abbricht Provider-Ausführung.
4. Timeout, Abort, temporary unavailable und unavailable bleiben technisch unterscheidbar.
5. Kill-Switch:
   - Production immer aus;
   - Flag aus → aus;
   - Flag an + kein Provider → ohne Zugang;
   - nur Test/Preview + Flag an + Provider vorhanden → technisch aktivierbar, ohne dass Factory in diesem Slice non-null wird.
6. `requirementsProviderAus()` bleibt `null`.
7. `officialFrische()`:
   - Evidence unter 60 min kann bei sonst gültigem Vertrag `current` sein;
   - exakt/über TTL-Grenze deterministisch getestet;
   - zu alte Evidence → `recheck_needed`;
   - `validUntil`/Fingerprint/temporary-unavailable-Regeln bleiben fail closed.
8. keine Hard Truth aus Providerfehlern.
9. bestehende Multi-Traveller-/Multi-Citizenship-/Credential-Option-Tests bleiben grün.
10. Typecheck, Lint, Tests und Production Build grün.

## 8. Agent-/Review-Governance

Neuer Cursor-Agent-Anzeigename:

**`Jetnity requirements truth ops 1`**  
Generation: **1**

Agent:

- arbeitet nur auf diesem Branch/PR;
- liefert Implementierung + gezielte Tests + Status + Handoff + adversarial Self-Review;
- darf **nicht** Ready setzen oder mergen;
- darf keinen Folgeslice starten;
- darf `docs/ACTIVE_WORK_STATUS.md` nicht als globale TL-Truth umschreiben, außer der Technical Lead weist es explizit an.

Technical Lead:

- reviewt den Exact Head unabhängig;
- Agent-Self-Review ist kein PASS;
- bei `CHANGES REQUIRED` arbeitet **derselbe Agent in derselben Session** weiter;
- jede Head-Änderung invalidiert alte CI/Vercel/Review-Gates;
- nur Technical Lead setzt Ready/PASS/merge.

## 9. Definition of Done

S4-R1 ist erst fertig, wenn:

- Scope und Non-Scope eingehalten sind;
- Independent TL Review PASS auf Exact Head vorliegt;
- Branch up to date mit live `main` ist;
- CI vollständig SUCCESS ist;
- Vercel Preview READY exakt auf dem finalen Head ist;
- GitHub Review Threads und Vercel Toolbar Threads 0 unresolved sind;
- PR normal über die geschützte Merge-Methode gemergt wurde;
- Post-Merge `main`, Main-CI und Vercel Production exakt auf dem Merge-Commit verifiziert wurden;
- Continuity im Repository aktuell ist;
- Issue #292 geschlossen/completed ist.

**Kein automatischer nächster Slice. Live-Evidence gewinnt immer.**
