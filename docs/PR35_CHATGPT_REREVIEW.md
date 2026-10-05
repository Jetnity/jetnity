# PR #35 – ChatGPT Re-Review

Stand: 22. August 2026  
Review-Basis vor diesem Dokument: `a39feeae57005458ab00084360681f4cb20ef35c`  
Status: **REQUEST CHANGES / kein Merge / keine Production-Migration**

## Positiv verifiziert

- PR #35 ist offen, Draft und mergeable.
- GitHub CI auf `a39feeae...`: success.
- Vercel Preview auf demselben Head: success.
- `npm test`: 1310/1310 laut Acceptance/PR-Nachweis.
- Trip-Workspace-UI-Audit nach den Fixes: 838/838, WebKit + Chromium, 8 Viewports.
- Development enthält `20260822160000` und `20260822170000`; Production endet weiterhin bei Foundation D.
- Live-Development-FKs sind jetzt korrekt gesetzt:
  - Documents → Citizenship: `ON DELETE SET NULL (citizenship_id)`
  - Readiness → Traveller: `ON DELETE CASCADE`
- App-/Domain-Code interpretiert `issuingCountryCode` nicht mehr automatisch als Citizenship.
- Credential-Vergleich leitet aus `visa=required` nicht mehr direkt eine Credential-Pflicht ab.
- Kein echter Requirements-Provider, keine Secrets, keine neuen laufenden Kosten.

## Offener Blocker 1 – Legacy-DB-Backfill erfindet weiterhin Document↔Citizenship-Relation

In `20260822160000_traveller_context_intelligence.sql` wird beim Dokument-Backfill weiterhin per Join

`c.country_code = t.document_issuing_country_code`

`citizenship_id = c.id` gesetzt.

Damit wird aus dem alten Singularmodell eine explizite Document↔Citizenship-Relation konstruiert, nur weil Ausstellerland und gespeicherte Nationalität gleich sind. Das widerspricht der Foundation-E-Truth-Regel: **Ausstellerland ist ein eigenes Fact und darf ohne explizite gespeicherte Relation nicht als Citizenship-Zuordnung interpretiert werden.**

Erforderlicher Fix:

- Fresh-install/Production-Migration muss Legacy-Dokumente mit `citizenship_id = null` backfillen, solange das alte Modell keine explizite Relation gespeichert hat.
- Falls `20260822160000` auf Development bereits angewendet wurde, eine Forward-Migration ergänzen, die nur die durch diesen Legacy-Backfill künstlich erzeugten Beziehungen sicher neutralisiert, ohne echte neue Foundation-E-Relations zu zerstören. Falls eine sichere Unterscheidung nicht möglich ist, Development-Branch kontrolliert neu aufbauen/resetten oder eine anderweitig beweisbare Migrationsstrategie wählen; keine pauschale Datenzerstörung.
- Migrationstest: Legacy nationality=CH + issuer=CH ergibt Citizenship CH und Document issuer CH, aber `citizenship_id` bleibt null.

## Offener Blocker 2 – Provider-Port kann `optionEligibility` / `optionMandate` nicht transportieren

Die Vergleichslogik erwartet jetzt korrekt explizite option-level Semantik (`optionEligibility`, `optionMandate`). Der tatsächliche Provider-Vertrag `RequirementsProviderZeile` besitzt diese Felder aber nicht, und `engine.ts` übernimmt/validiert sie deshalb nicht in `OfficialEvaluation`.

Folge: Die neuen Vergleichstests erzeugen diese Felder direkt auf `OfficialEvaluation`; ein späterer realer Requirements-Adapter kann dieselbe Semantik über die definierte Provider-Naht derzeit gar nicht liefern. Damit ist Foundation E an dieser Stelle **nicht provider-ready**.

Erforderlicher Fix:

- Provider-Port explizit um kontrollierte option-level Semantik erweitern, z. B.:
  - `optionEligibility?: 'allowed' | 'not_allowed' | 'unknown'`
  - `optionMandate?: 'mandatory' | 'not_mandatory' | 'unknown'`
- In der Engine strikt normalisieren/validieren; unbekannte Werte fail-closed.
- Diese Felder nur dann als entscheidungsfähig in `OfficialEvaluation` übernehmen, wenn dieselbe Evidence-/Trust-/Freshness-Grenze wie für offizielle Requirement-Wahrheit erfüllt ist.
- Untrusted/stale/provider-unavailable option-level Angaben dürfen niemals einen Winner erzeugen.
- Contract-/Engine-Tests müssen den echten Weg `RequirementsProviderZeile -> engine -> OfficialEvaluation -> credentialOptionenVergleichen` abdecken; keine nur manuell konstruierten `OfficialEvaluation`-Tests.
- Vergleich zusätzlich defensiv nur auf `status === 'current'` **und** `freshness === 'current'` entscheiden lassen.

## Offener Blocker 3 – Parent-Row-Hardening nutzt zu starken Lock-Modus

Die Child-Limit-Funktion sperrt in einem `AFTER INSERT`-Trigger die referenzierte `trip_travellers`-Zeile mit `FOR UPDATE`.

Bei parallelen Child-Inserts auf denselben Traveller kann die FK-Prüfung bereits einen `KEY SHARE`-Lock auf derselben Parent-Zeile halten. Zwei Transaktionen können dann jeweils ihren FK-Lock halten und beim Upgrade auf `FOR UPDATE` gegenseitig warten; PostgreSQL kann einen Deadlock abbrechen. Damit wird das MVCC-Limit-Race zwar adressiert, aber die Lösung ist für echte Parallelität nicht ausreichend robust.

Erforderlicher Fix:

- Einen Lock-Mechanismus verwenden, der Inserts desselben Travellers serialisiert, ohne mit dem FK-Key-Share zu kollidieren. Bevorzugt prüfen:
  - `FOR NO KEY UPDATE` auf der Parent-Zeile, sofern mit dem konkreten FK-/Trigger-Ablauf nachweislich deadlockfrei,
  - oder `pg_advisory_xact_lock` mit stabiler Traveller-spezifischer Lock-ID,
  - oder eine andere klar beweisbare DB-Invariante.
- Nicht nur sequentiell testen. Einen echten Parallelitätstest mit zwei Transaktionen ergänzen: gleichzeitige Inserts nahe/über dem Limit dürfen nicht deadlocken und am Ende darf das Limit nie überschritten sein.
- `db:parallelitaet` bzw. passenden DB-Test dafür verwenden/erweitern.

## Re-Review-Gate

Nach diesen Fixes erneut zwingend:

- Development-Migration/Forward-Migration sauber anwenden; Production unverändert.
- Live-FKs und Backfill-Semantik prüfen.
- echter paralleler Child-Limit-Test.
- Provider-Contract-/Trust-/Freshness-Tests über den realen Engine-Pfad.
- `db:rechte`, `db:rls`, `db:sicherheit`, relevante `db:parallelitaet`-Tests.
- `npm test`, Typecheck, Lint, Hygiene, Production Build.
- `npm run audit:trip-workspace` auf WebKit + Chromium / 8 Viewports.
- GitHub CI + Vercel Preview auf finalem Head.
- `docs/ACTIVE_WORK_STATUS.md` und `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md` aktualisieren.
- PR bleibt Draft; kein Mark Ready, kein Merge, keine Production-Migration.

Erst danach erneuter unabhängiger ChatGPT-Abschlussreview und separate Product-Owner-Merge-Entscheidung.
