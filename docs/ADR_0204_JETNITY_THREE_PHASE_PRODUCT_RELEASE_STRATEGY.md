# ADR-0204 – Jetnity Three-Phase Product & Release Strategy

Stand: 1. September 2026  
Status: **PRODUCT-OWNER APPROVED / BINDING / NO RUNTIME AUTHORIZATION**

## Entscheidung

Jetnity wird ab sofort in drei verbindlichen **Produkt- und Releasephasen** geführt:

1. **Phase 1 – Jetnity Core**
2. **Phase 2 – Jetnity Complete Travel Platform**
3. **Phase 3 – Jetnity Travel Ecosystem**

Die erste öffentliche marktfähige Jetnity-Version wird **nach erfolgreichem Abschluss von Phase 1** veröffentlicht. Phase 1 endet nicht bei Feature Complete, sondern erst bei:

> **PRODUCTION READY FOR REAL TRAVELLERS.**

Die verbindliche Kurzform lautet:

- **Phase 1 – CORE:** die konkrete Reise zuverlässig planbar und reisebereit machen.
- **Phase 2 – PLATFORM:** Jetnity zur zentralen Oberfläche für fast die gesamte Reise ausbauen.
- **Phase 3 – ECOSYSTEM:** Daten-, Netzwerk-, Creator-, Partner- und Intelligence-Vorteile aufbauen, die schwer kopierbar sind.

## Warum diese Entscheidung nötig ist

Die bisherige Jetnity-Planung enthält eine große, langfristig sinnvolle Vision und mehrere breite Programme. Ohne explizite Launch-Grenze besteht das Risiko, dass Account-, Admin-, Provider-, Growth-, Native-, Social- oder Ecosystem-Breite faktisch zu einem niemals endenden Pre-Launch-Backlog wird.

Diese Entscheidung reduziert **nicht** die langfristige Vision. Sie reduziert ausschließlich den Umfang, der zwingend vor dem ersten professionellen Launch fertig sein muss.

## Verhältnis zu bestehender Architektur

Bestehende korrekte Architektur wird **nicht** neu gebaut, nur weil die Produktphasen neue Namen tragen.

Insbesondere bleiben verbindlich:

- eine Reise / ein kanonischer Reisegraph;
- Guest und Account verwenden dieselbe fachliche Reise-Truth;
- Account Traveller Registry = wiederverwendbare aktuelle Traveller-Fakten;
- Trip Snapshot = einzige Current Truth einer konkreten Reise;
- ein Traveller → mehrere Staatsbürgerschaften → mehrere Credentials → kontextabhängig bewertete Optionen;
- kein Default-/Primary-/Preferred-Pass oder -Citizenship;
- Route/Transit darf nicht still gekürzt werden;
- Official Truth, Provider Truth, Jetnity Recommendation, Community Opinion und Generated Suggestion bleiben getrennte Truth-Klassen;
- `unknown`, `unavailable`, `stale`, `error` und `not_required` bleiben fachlich getrennt;
- kommerzielle und regulatorische Hard Truth wird ausschließlich aus belastbarer serverseitiger Evidence abgeleitet;
- Provider-, Security-, Privacy-, Production- und Cost-Gates bleiben bestehen.

## Verhältnis zu älteren „Phase“-Bezeichnungen

Frühere technische ADRs und Dokumente verwenden Bezeichnungen wie „Phase 1.5“, „Phase 2.2“, „Phase 3.2“ usw. Diese bleiben **historische technische Implementierungsbezeichnungen** und werden nicht umnummeriert oder rückwirkend verändert.

Ab diesem ADR bedeutet eine unqualifizierte Produktangabe **Phase 1 / Phase 2 / Phase 3** die drei hier definierten Produkt-/Releasephasen. Historische technische Phasen sind nur mit ihrem damaligen Dokumentkontext zu lesen.

## Verhältnis zur bisherigen Binding Build Order

`docs/JETNITY_BINDING_BUILD_ORDER.md` bleibt wichtige historische und programmatische Evidence für technische Abhängigkeiten. Wo es jedoch impliziert, dass die gesamte langfristige Breite eines Programms zwingend **vor V1** abgeschlossen werden muss, wird diese Interpretation durch diesen ADR superseded.

Für den V1-kritischen Pfad gilt ab jetzt:

`docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`.

Nicht superseded werden reale technische Abhängigkeiten. Insbesondere bleibt Provider Readiness **S4–S8 vor echten Provider-Livepfaden** bindend, solange keine neue ausdrückliche Product-Owner-Entscheidung dies ändert.

## Phase-1-Launchprinzip

Jetnity V1 ist kein unfertiges MVP. Vor Public Launch muss die komplette Phase-1-Kernreise für echte Nutzer funktionieren und ein eigener verbindlicher `JETNITY V1 RELEASE READINESS GATE` bestanden sein.

Bevorzugte Launch-Reihenfolge:

1. interne/private Alpha;
2. kontrollierte Closed Beta;
3. Schweizer Public Launch;
4. Stabilisierung und Product Learning;
5. DACH;
6. priorisierte europäische/internationale Märkte.

## Harte Product-Owner-Gates bleiben bestehen

Diese Strategie erteilt **keine** Freigabe für:

- Providerwahl oder Vertragsannahme;
- DPA;
- API Keys / Secrets;
- paid/live Provider Calls;
- Production Provider Activation;
- Production Schema-/RLS-/Grant-/Role-/Function-Mutationen;
- Runtime Writer Principals oder Backfills;
- fundamentale Auth-/MFA-/AAL-Änderungen;
- Speicherung von Passnummern, MRZ, Scans, Biometrics oder Health-Daten;
- reale Payments;
- Kosten außerhalb des freigegebenen Budgets;
- Public Indexing, Domain Cutover oder Public Launch.

## Konsequenz

Kein Runtime-Slice darf allein aus diesem ADR gestartet werden. Zuerst muss die Strategieintegration vollständig reviewt, gemergt und post-merge verifiziert werden. Danach erfolgt erneut eine Live-Rekonstruktion, bevor der kleinste verantwortliche Phase-1-Slice gewählt wird.
