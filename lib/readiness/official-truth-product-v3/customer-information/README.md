# CI1: vollständige Kundenangaben im bestehenden V3-Pfad

Auftrag: PR #1197, Fortsetzung vom 15.11.2026. Diese Erweiterung speichert neue
Kundenangaben vollständig im vorhandenen Proposal-/Observation-/RuleVersion-JSONB.
Sie erzeugt keine zusätzliche Truth-Tabelle und erteilt keine Quellen-, Methoden-
oder Veröffentlichungsfreigabe. Die 206 recherchierten Ziele bleiben
`RESEARCH_ONLY`. Die aktuelle amtliche CH→DE-Visa-Methode bleibt eng gebunden.

## Kanonische Speicherform und Identität

Neue Detailfakten verwenden ausschließlich:

```ts
context: {
  contextRevision: 3,
  informationTopic: 'entry_forms',
  informationItem: 'arrival_form',
  scope, route, conditions
}
proposedFact: {
  schema: 1,
  fact: { kind: 'entry_information', detail: { kind: 'entry_form_details', ... } }
}
```

`informationItem` ist ein stabiler semantischer Bezeichner aus dem geprüften
Quellen-/Methodenprogramm, beispielsweise `arrival_form`, `cash_allowance` oder
`standard_fee`. Er darf nicht aus Preis, Datum, wechselnder URL, Quellenhash oder
Operation-ID erzeugt werden. Eine Änderung des Wertes revidiert dieselbe Regel;
zwei eigenständige Formulare oder Zollkategorien erhalten unterschiedliche Items.
Pflicht- und empfohlene Impfungen unterscheiden sich zusätzlich im festen Topic.

Der vollständige ContextKey bindet Revision, Topic, Item, Scope, Route und
Bedingungen. JobKey bindet weiterhin ContextKey, FactKind und Methode. Alte
Kontexte und Revision 2 behalten exakt ihre bisherigen Identitäten. Der gemeinsame
Faktkind-Check gilt auch für unabhängig gelesene Jobs und unklare Entscheidungen:
Revision 3 und `entry_information` treten ausschließlich gemeinsam auf.

Alle neuen Felder sind geschlossen typisiert. Fehlende bestätigte Unterangaben
verwenden `null` oder `{ status: 'unavailable' }`. `free` ist eine explizit belegte
Kostenangabe. Geldbeträge sind exakte Dezimalstrings mit Währung und Bezugsbasis;
es gibt keine Gleitkommaumrechnung. Links benötigen ein registriertes amtliches
Source/ContentItem/Representation-Tupel und die exakt registrierte HTTPS-URL.
Ein amtlicher Host allein reicht nicht.

## Felder und bestehende Taxonomie

| Kundenangabe | Kanonischer Fakt / Detail | requirementType / vollständige Felder |
|---|---|---|
| Visum | bestehendes `requirement_effect` / `visa_options` | `visa`; Befreiung wird nur hier gezeigt |
| ETA | bestehendes `requirement_effect` | `electronic_travel_authorization`; keine Ableitung aus Visumbefreiung |
| Aufenthaltsdauer | bestehendes `stay_limit` | bestehender Scope; Dauer, Fenster, Verlängerung und Grenzentscheidung bleiben erhalten |
| Reisepass | bestehendes `requirement_effect` | `passport` |
| ID statt Pass | `entry_information / document_alternative_details` | `identity_document`; acceptedDocument, replacesPassport, documentClass |
| Passgültigkeit | bestehendes `passport_validity` | Semantik und konkrete Dauer; bloßes requirement_effect füllt den Detailslot nicht |
| Freie Passseiten | bestehendes `blank_passport_pages` | minimumPages; auch bei gültigem Visa-Scope fachlich korrekt zugeordnet |
| Pflichtimpfungen | `vaccination_details`, classification `required` | `vaccination`; Impfstoff-/Krankheitsnamen, Mindestdosen, Vorlauf, Zertifikatpflicht |
| Empfohlene Impfungen | `vaccination_details`, classification `recommended` | `vaccination`; eigener Topic und daher keine Kollision mit Pflichtimpfungen |
| Gesundheitsmassnahmen | `health_measures` | `health`; Massnahmenart/-name, Pflicht/Empfehlung, Dauer und Nachweispflicht |
| Gesundheitsnachweis | bestehendes `requirement_effect` | `health_document` |
| Versicherung | bestehendes `requirement_effect` | `insurance` |
| Formulare | `entry_form_details` | `entry_form`; Formularname, Pflicht/Option, Kosten, genauer amtlicher Link, Fristbezug und Vorlauf |
| Formularkosten | `fee_details`, purpose `entry_form`, oder Kosten desselben Formularfakts | `entry_form`; Betrag, Währung, Basis, Zahlungszeitpunkt; Querverweis auf dieselbe gültige Karte |
| Betrugswarnung | `fraud_warning` | `other_entry_requirement`; belegte Warnungsart, genauer amtlicher Hinweislink |
| Gebühren | `fee_details` | `visa`, `electronic_travel_authorization` oder `other_entry_requirement`; Gebührenname/-zweck, Betrag, Währung, Basis, Zahlungszeitpunkt |
| Rück-/Weiterreiseticket | `ticket_details` oder bestehendes `requirement_effect` | `onward_or_return_ticket`; Pflicht/Nichtpflicht und Ticketart |
| Geldnachweis | `financial_means_details` oder bestehendes `requirement_effect` | `financial_means`; Pflicht/Nichtpflicht, Mindestbetrag/Währung/Basis und akzeptierte Nachweise |
| Buchung/Reisenachweise | bestehendes `requirement_effect` | `booking_or_travel_document` |
| Transit | bestehendes `transit_conditions` | bestehende konkreten Wege, Grenz-/Transitbereich, Verkehrsmittel, Flughafen, Zeit und Weiterreisebedingungen |
| Minderjährige | `minor_travel_details` | `other_entry_requirement`; Altersgrenze und benötigte Dokumenttypen |
| Einverständnis | `parental_consent_details` | `other_entry_requirement`; Pflicht/Nichtpflicht, Unterzeichner, Beglaubigung, Übersetzung und amtliches Formular |
| Zoll | `customs_details` | `other_entry_requirement`; Kategorie, Verbot/Anmeldung/Bewilligung/Freimenge, Menge/Einheit, Geldschwelle und amtlicher Link |
| Doppelbürger | `dual_national_details` | `other_entry_requirement`; Zielstaatsangehörigkeit, Einreise- und Ausreisedokument |
| Kürzliche Änderungen | `change_notice` | `other_entry_requirement`; Änderungsdatum, Inkrafttreten, Änderungsart/-thema, frühere Regelreferenz und amtliche Bekanntmachung |
| Amtliche Erledigungslinks | bestehendes `official_actions` oder geprüfte Detail-action | Nur exakte Quellenregistrierung; keine aus der Homepage abgeleiteten Links |

Quelle, amtliche URL, Abrufstand, Gültigkeit, Version, Frische, Bedingungen und
Konflikte bleiben im vorhandenen Evidence-/Decision-/Projection-Umschlag. Sie
werden nicht als zweite, separat alternde Aussage dupliziert. Der Reiseprüfhinweis
und explizite fehlende Themen werden durch die Besucherpräsentation ergänzt.

## Additives PostgreSQL-Overlay

`S1_RETENTION_SHAPE_V2` reproduziert den historischen Installer bytegleich.
Die aktuelle `S1_RETENTION_SHAPE` hat Revision 3. Sie koppelt Kontext-Topic,
requirementType und genaue Detailform innerhalb jeder Proposal-/Observation-
Alternative, einschließlich Impfklassifikation und Gebührenzweck. Ein unabhängig
gültiges Topic darf nicht mit einem fremden Detail kombiniert werden.

Der Generator ersetzt ausschließlich die Bodies dieser sechs vorhandenen
Funktionen; Signatur, Argumentnamen, SQL-Optionen und alte Installer bleiben gleich:

| Namespace | Funktion | Ergänzung |
|---|---|---|
| `official_v3_intake_private` | `proposal_shape_v1()` | Geschlossener Revision-3-JSONB-Vertrag |
| `official_v3_result_private` | `proposal_shape_v1()` | Derselbe Vertrag für Outcome/Audit/RuleVersion |
| `official_v3_jobs_private` | `context_v1(jsonb)` | Revision 3, Topic↔requirementType, stabiles Item im Semantik-Hash |
| `official_v3_result_private` | `context_v1(jsonb)` | Exakt dieselbe Kontextsemantik |
| `official_v3_jobs_private` | `subject_v1(text,jsonb)` | Neuer FactKind und beidseitige Kontext-/Kind-Bindung |
| `official_v3_result_private` | `subject_v1(text,jsonb)` | Exakt dieselbe Subjectsemantik |

Das Migrationspaket `scripts/db/official-truth-v3-customer-information-1/` ergänzt
die erforderliche BG1-Nachfolger-Baseline und Guard-Routen. Die generierte
`definitions.sql` gehört zu diesem Paket. Generation allein wendet nichts an.
Der ältere flache Writer verweigert `entry_information` ausdrücklich vor Uhr,
Client oder RPC, da seine Spalten die vollständigen Details nicht tragen.

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx \
  scripts/official-truth-v3-customer-information-1/generate-definitions.ts --check
```

## Wiederholbarer Weg für weitere amtliche Quellen

1. Neutrales vollständiges Inventar erstellen. Jeder Staatsangehörigkeit werden
   alle 26 Themen zugeordnet, zunächst ausdrücklich nicht verfügbar.

   ```sh
   node --import ./scripts/server-only-test-register.mjs --import tsx \
     scripts/official-truth-v3-customer-information-1/source-plan.ts template \
     --destination DE --citizenships CH --output /tmp/ch-de-research-plan.json
   ```

2. Amtliche Veröffentlichungen im geprüften Registry-/ContentIdentity-Programm
   mit exakten Publikationsidentitäten/URLs und Zielstaatszuständigkeit anbinden.
   Primärquelle und optionale Gegenquellen werden explizit dokumentiert. Ein
   Quellenplan kann weder Registry noch Verifier oder Freigabe hochladen.

3. Das Quellenprogramm definiert stabile Items und extrahiert nur belegte Werte
   in den vorhandenen Trusted-Extractor-Pfad. Für ein neues Detail verwendet
   `prepareV3CustomerInformationProposal` den regulär ausgewählten Kontext,
   MethodRef, JobId und OperationId. Das Ergebnis ist ausschließlich ein normales
   `untrusted_research_proposal`, keine Annahme oder Veröffentlichung.

4. Jeder Topic-Slot enthält entweder einen expliziten Ausfallgrund oder
   `canonical_proposals` mit 1–8 Originalproposals. Insgesamt sind höchstens
   64 Subjects zugelassen. Jedes Originalproposal und der gemeinsame Metadaten-
   Rahmen bleiben einzeln auf 64 KiB UTF-8-JSON, 8.192 Werte-Knoten und 16
   Objektebenen begrenzt. Der Plan erhält ausschließlich einen abgeleiteten
   Sammelrahmen: maximal 4.259.904 Bytes, 532.480 Werte-Knoten und 20
   Objektebenen einschließlich der vier Sammlungsebenen. Die 64 zusätzlich
   reservierten Bytes decken die Kommas zwischen Proposals ab. Es gibt keine
   Kürzung; das vollständige Original durchläuft anschließend unverändert alle
   strikten Schema-, Kontext-, Topic-, Identitäts- und Quellenprüfungen.
   Doppelte Job-/Operation-IDs oder
   ContextKey+FactKind-Subjects werden verweigert; verschiedene bestehende
   Fakten dürfen denselben Kontext verwenden. Primärquellenbelege müssen für
   jedes Proposal vorhanden sein. Ein bekannter Konflikt blockiert den Slot und
   bleibt erhalten; eine nicht gefundene optionale Gegenquelle ersetzt ihn nicht.

5. Mit dem code-eigenen Registry-Programm validieren. Für die aktuelle Quelle:

   ```sh
   node --import ./scripts/server-only-test-register.mjs --import tsx \
     scripts/official-truth-v3-customer-information-1/source-plan.ts check \
     --input /tmp/ch-de-research-plan.json --program aa-bern-ch-de
   ```

6. Die zurückgegebenen Originalproposals durch den vorhandenen gebundenen
   S1→M04→I1→HRS→BG1-Pfad führen. Für neue Quellenprogramme wird die feste
   CLI-Programmauswahl um den tatsächlich geprüften Codeeintrag ergänzt; ein
   beliebiger Modulpfad oder eine Freigabe aus dem Inventar ist nicht zulässig.

## Präzise noch nötige Produktions-/Methodenarbeit

Die zusätzlichen Speicherfelder und Leser sind implementiert. Tatsächliche neue
amtliche Fakten benötigen weiterhin je eine normale Qualification und eine
methodisch gebundene Veröffentlichung. Insbesondere halten
`result-store/contract.ts` (`readHrs1Binding`) und die bisherige SQL-Funktion
`binding_valid_v1` die **aktuelle** CH→DE/Visa/`requirement_effect`-Bindung fest.
Dieses Paket weitet sie bewusst nicht implizit auf ungeprüfte Inhalte aus.

Für eine weitere echte Methode sind konkret nötig: geprüftes SourceProgram mit
genauer Registry/Identity/Extraktion und Gegenprüfung, passende HRS-Binding-
Revision samt SQL-Validierung, Method-/Package-Digests, Coverage-/Scheduling-
Komposition und normaler Run mit Source-/Acceptance-/BG1-Nachweis. Der bisherige
CH→DE-HTTP-Vertrag mit genau einem Resultat wird erst zusammen mit einer solchen
qualifizierten Komposition erweitert. Dieser CH→DE-HTTP-Vertrag bleibt auf
64 KiB und genau ein Visaergebnis begrenzt.

Der allgemeine Besucherantwort-Vertrag trägt vollständig bis zu fünf
Staatsangehörigkeiten mit je 64 Ergebnissen. Sein endlicher Sammelrahmen besteht
aus höchstens 320 einzeln geprüften Projektionen, fünf Zellrahmen und einem
Außenrahmen: maximal 21.364.741 UTF-8-JSON-Bytes, 2.670.592 Werte-Knoten und 21
Objektebenen einschließlich fünf Sammlungsebenen. Jeder Teil behält unverändert
64 KiB, 8.192 Werte-Knoten und 16 Objektebenen; Proposal und Intake behalten
dieselben Einzelgrenzen. Das vollständige Original durchläuft anschließend das
unveränderte strikte Schema sowie Kontext-, Quellen- und Ablaufprüfungen, ohne
Abschneiden von Ergebnissen oder Bedingungen.

Die fiktionale vollständige 26-Themen-Fixture enthält 27 Originalfakten je
Staatsangehörigkeit. Der Quellenplan misst für CH 46.332 Bytes und für CH+GB
92.276 Bytes (54 Proposals); beide werden vollständig vorbereitet. Die
Besucherantwort misst 64.219 Bytes für CH, 128.189 Bytes für CH+GB und 320.099
Bytes / 11.220 Werte-Knoten für fünf Staatsangehörigkeiten. Zusätzliche
Grenztests prüfen 64 Quellenproposals sowie 320 Besucherprojektionen, ebenso
die weitere Verweigerung übergroßer Einzelobjekte, Getter, lückenhafter Arrays,
Zyklen, privater Felder und fremder Quellen.

## Integration und Nachweise

- Root ergänzt in `jobs/contract.ts` im semantischen Kontext neben
  `contextRevision` auch `informationTopic` und `informationItem`; der neue
  `queue-contract.test.ts` prüft echte M04-Enqueue-Kommandos und getrennte Items.
- Neue kanonische/transitive Reader-Dateien müssen in aktive Quellenpins
  aufgenommen werden: topics, details, detail-topic, detail-retention-shape;
  bestehende contract/rule-claims-Hashes werden ebenfalls aktualisiert.
- 17 fiktionale Bindungsfälle decken alle 13 Detailformen und Gebühren-/Impf-
  Unterklassen ab. Jeder läuft durch tatsächliche Trusted-Extraktion, I1,
  vollständige Retention und gültige Besucherprojektion. Keine Fixture behauptet
  eine echte Länderregel oder veröffentlicht Daten.
- Regressionen prüfen alte Identitäten, Mehrfachitems, Wertänderung ohne
  Identitätsreset, Unterbaum-/PII-Abweisung, fremde Aktionspfade, Topic-/Kind-
  Schmuggel einschließlich unklarer Entscheidungen und den flachen Writer.
- Die native PG17-Migrationsprüfung liegt im zugehörigen Migrationspaket.
  Production bleibt bis zur getrennten Benutzerfreigabe **UNAPPLIED**.
