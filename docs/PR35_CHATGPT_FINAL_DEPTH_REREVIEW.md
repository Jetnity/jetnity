# PR #35 – ChatGPT Final Depth Re-Review

Stand: 23. August 2026  
Review-Basis vor diesem Dokument: `c6f759a7387e61c03992e22b17e015a5805c2e64`  
`main` bei Review: `c8dbe904faac49745bd149e3d2e85ca30ebd384c`  
Status: **REQUEST CHANGES / Draft bleibt Draft / kein Merge / keine Production-Migration**

Dieser Re-Review prüft die Umsetzung von `docs/PR35_CHATGPT_FINAL_DEPTH_REVIEW.md` erneut gegen tatsächlichen PR-, Code-, CI- und Live-DB-Stand.

## Positiv unabhängig verifiziert

Die vier vorherigen Depth-Review-Blöcke sind in ihren gemeldeten Kernfällen fachlich richtig bearbeitet:

- Dokumentformular erhält bestehende `clientRef` und `citizenshipClientRef`; neue Dokumente erhalten stabile UUID-basierte Refs; Citizenship-Zuordnung kann explizit gesetzt oder entfernt werden; Issuer wird nicht als Citizenship erfunden.
- Traveller-spezifische Readiness löst eine nicht-null `travellerClientRef` über `travellerIdAufloesen()` exakt auf und bricht bei fehlender/nicht-UUID Zuordnung ab statt zu trip-level `null` zu degradieren.
- Comparator blockiert stale/unvollständige relevante Gruppen und `mandatory + not_allowed`.
- Kanonisch geladene `citizenships: []` / `documents: []` bleiben in `travellerLegacyLesen()` leer; Legacy-Fallback gilt nur bei strukturell nicht als Array gelieferten Children.
- PR #35 ist offen, Draft, `mergeable=true`, 37 Commits vor und 0 hinter aktuellem `main`.
- Aktueller Head vor diesem Review `c6f759a7`: GitHub Actions CI `completed/success`; Vercel Status `success`.
- Live Development enthält Migrationen `20260822160000`, `20260822170000`, `20260822180000`; Child-Tabellen existieren; Backfill-Relikte = 0; Limit-Funktion verwendet `FOR NO KEY UPDATE`.
- Live Production endet bei `20260822150000`; Foundation-E-Child-Tabellen existieren dort nicht.

Diese positiven Punkte bleiben bestehen. Zwei tiefere Fail-Closed-Lücken sind noch offen.

---

## Merge-Blocker 1 – Provider-Konflikt kann bei drei Credential-Optionen durch „Option verschwindet“ wieder zu einem Winner werden

`requirementsAusZeilen()` erkennt widersprüchliche Provider-Zeilen desselben fachlichen Keys inzwischen und entfernt diesen Key aus `gesehen`; der Key landet nur in `konflikte`.

Das ist für **zwei** Credential-Optionen in den vorhandenen Tests fail-closed: verschwindet eine Option, bleibt nur eine übrig und der Comparator entscheidet nicht.

Bei **drei oder mehr** Credential-Optionen ist die Semantik aber nicht mehr sicher:

1. Traveller besitzt Optionen A, B und C.
2. Provider liefert für A zwei widersprüchliche current Zeilen desselben VISA-Keys.
3. `requirementsAusZeilen()` entfernt A vollständig aus den zurückgegebenen Evaluations.
4. B und C bleiben als zwei scheinbar vollständige current Optionen erhalten.
5. `credentialOptionenVergleichen()` kennt nur die zurückgegebenen Evaluations; `optionenGesamt` besteht deshalb nur noch aus B und C.
6. Wenn B/C vergleichbar sind, kann B oder C als Winner ausgegeben werden, obwohl Option A wegen Provider-Konflikt Teil der angefragten Credential-Menge war und die Gesamtlage gerade **nicht** vollständig belegt ist.

Damit wird ein Conflict nicht „first wins“, aber kann durch **„conflicted option disappears“** dennoch zu einer Teil-Evidence-Entscheidung führen. Das verletzt dieselbe Fail-Closed-Regel aus dem vorherigen Review.

### Erforderliche Lösung

Konfliktierte Keys/Optionen dürfen nicht semantisch aus der Evaluation-Menge verschwinden.

Bevorzugte Varianten:

- für den konfliktbehafteten fachlichen Key eine explizite `unknown`/conflict-artige Evaluation mit derselben `credentialOptionRef` zurückgeben, so dass Vollständigkeitsprüfung und Comparator den Konflikt sehen; oder
- Comparator erhält zusätzlich die erwartete Credential-Option-Menge aus der kanonischen Anfrage und verweigert jede Entscheidung, wenn eine erwartete Option wegen Konflikt/Fehler fehlt.

Keine Variante darf aus einer reduzierten Restmenge einen Winner bilden.

### Pflichttests

- drei Credential-Optionen A/B/C, A hat widersprüchliche current VISA-Zeilen, B/C wären sonst vergleichbar → **kein Winner**;
- Reihenfolge der widersprüchlichen A-Zeilen ändert das Ergebnis nicht;
- konfliktierte Option bleibt als fehlend/unknown/conflicting semantisch sichtbar oder wird gegen die erwartete Option-Menge erkannt;
- drei vollständig konsistente Optionen bleiben gemäß Comparator-Regeln normal auswertbar.

---

## Merge-Blocker 2 – Requirements-API prüft den Traveller nur top-level streng; malformed Children können weiterhin still verschwinden oder Legacy-Fallback auslösen

`readinessAnforderungAnfrageSchema.party` ruft für jedes `z.unknown()` direkt `travellerLegacyLesen()` auf und lehnt nur ab, wenn **der gesamte Traveller** `null` wird.

`travellerLegacyLesen()` ist jedoch absichtlich ein tolerant-normalisierender Legacy-/Storage-Reader. Innerhalb eines ansonsten gültigen Travellers kann er u. a.:

- ungültige Citizenship-Child-Objekte herausfiltern;
- ungültige Document-Child-Objekte herausfiltern;
- doppelte/überzählige Children deduplizieren bzw. begrenzen;
- überlange interne Werte normalisieren/trunkieren;
- bei einer vorhandenen, aber **nicht als Array typisierten** Canonical-Property (`citizenships` / `documents`) die Property als „nicht geladen“ behandeln und gegebenenfalls alte Singularfelder expandieren.

Für Legacy Local Storage ist tolerante Recovery sinnvoll. Für eine regulatorische, später provider-backed HTTP-Grenze ist sie nicht ausreichend: ein fehlerhaftes Credential oder eine malformed kanonische Child-Relation darf nicht still aus der Anfrage verschwinden, während die restlichen Credentials bewertet werden.

Beispiel:

- gültiger Traveller mit `citizenships: [{countryCode:'CH'}, <malformed child>]` darf nicht still nur als CH weiterlaufen;
- `citizenships: 'kaputt'` plus `nationalityCountryCode:'CH'` darf nicht als sauberer Legacy-CH-Traveller interpretiert werden, weil die kanonische Property vorhanden, aber malformed ist;
- ein malformed zweites Dokument darf nicht verschwinden und anschließend nur das erste Credential offiziell bewertet werden.

Das ist dieselbe Wahrheit wie im vorherigen Review: **Keine Person und kein regulatorisch relevantes Credential darf durch tolerant parsing unsichtbar werden.**

### Erforderliche Lösung

Trenne die beiden Rollen klar:

- `travellerLegacyLesen()` darf für bewusst kompatible Guest-/Storage-Lesepfade tolerant bleiben;
- die untrusted Requirements-API braucht einen **strikten Traveller-/Child-Parser** mit kontrollierter Legacy-Alternative.

Für die API mindestens:

- wenn `citizenships` oder `documents` vorhanden ist, muss es ein valides Array sein; wrong type → Request fail-closed;
- jedes Child muss vollständig gegen das erlaubte Canonical-Schema validieren; ein ungültiges Child → Request fail-closed, nicht `.filter()`;
- Limits und Duplicate-/Ref-Invarianten werden abgewiesen statt still gekürzt/dedupliziert;
- echte Legacy-Form ohne Canonical-Properties darf weiterhin kontrolliert expandiert werden;
- keine Passnummer/Scan/MRZ/unerwartete sensitive Credential-Felder als still ignorierte Eingabe akzeptieren, sofern sie an dieser API-Grenze erkannt werden können.

### Pflichttests

- ein gültiges + ein malformed Citizenship-Child im selben Traveller → Schema/API fail-closed;
- ein gültiges + ein malformed Document-Child → fail-closed;
- `citizenships` oder `documents` vorhanden, aber falscher Typ → fail-closed, kein Legacy-Fallback;
- >8 Citizenships / >12 Documents → fail-closed, keine Trunkierung;
- Duplicate-Child-/Duplicate-Ref-Fall → fail-closed oder eindeutig dokumentierte strikte Semantik, kein stilles Credential-Verschwinden;
- echte Legacy-Form **ohne** Canonical-Properties bleibt kompatibel;
- gültige Canonical-Form bleibt unverändert.

---

## Re-Review-Gate

Nach diesen zwei Fixes:

1. gezielte Unit-/Engine-/API-Tests für beide Blocker ergänzen;
2. `npm test`, Typecheck, Lint, Hygiene und Production Build erneut grün;
3. DB Rechte/RLS/Security/Parallelität unverändert grün;
4. Trip-Workspace UI Audit WebKit + Chromium / 8 Viewports erneut grün, falls Parser/Formular-Code berührt wird;
5. Development-vs.-Production-Grenze erneut prüfen;
6. Branch weiterhin mit aktuellem `main` synchronisieren, falls `main` zwischenzeitlich vorläuft;
7. GitHub Actions und Vercel auf exakt finalem Head grün;
8. `ACTIVE_WORK_STATUS`, Acceptance und Handoff mit tatsächlichem Stand nachziehen;
9. PR bleibt Draft; kein Mark Ready, kein Merge, keine Production-Migration;
10. danach erneuter unabhängiger ChatGPT-Abschlussreview und erst anschließend separate Product-Owner-Merge-Entscheidung.

Kein breiter Foundation-E-Neubau. Nur diese Fail-Closed-Lücken professionell schließen und erneut beweisen.