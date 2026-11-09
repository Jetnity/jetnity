# D1 — Autorenprüfung und Übergabe V1

**09.11.2026. Autor STOP zur unabhängigen TL-Prüfung.**

Autor: **Jetnity Official Truth V3 Method Package 1 — Codex Generation 1**, tatsächliche Session `/root/v3_d1_method_writer`, keine Cursor-Session behauptet. Auftrag [D1_TASK_V1](D1_TASK_V1.md), [vorab von Root angenommener Plan](D1_PLAN_V1.md), Draft [#1169](https://github.com/Jetnity/jetnity/pull/1169). Nur Root darf veröffentlichen, PASS/Ready setzen oder mergen.

## Baseline und Lieferung

Quellbasis E1 `97629e9130a907b8b9b8072d06bda1956758aa6e`, Tree `8759d8a3e39143c84810c8cca1641c2c91cbdd66`. Eigener Branch `docs/official-truth-v3-method-package-1-20261109` steht weiter auf dem veröffentlichten Taskseed **`23d9645ec68fc3f27b4332c2f8f91ce9cfea05e8`**. Die sechs neuen Dateien liegen als lokale Kandidaten im eigenen Worktree; es gibt noch keinen veröffentlichten Implementierungshead und keine neue Exact-Head-CI-Abnahme.

Vor Handoff wurde `git ls-remote origin refs/heads/main` tatsächlich ausgeführt: weiterhin **`ce3366e26de73961d4682236af92347bfc3a4ca8`**. Keine fremde Datei und keine Runtime-, SQL-, Dependency-, CI- oder Governance-Datei verändert. Der bereits veröffentlichte D1-Task bleibt bytegleich.

Der [Methodenbericht](D1_METHOD_PACKAGE_V1.md) benennt Method-ID `jetnity-destination-primary-ch-de-visa`, Revision 1, und enthält Quellenqualifikation, elf Entscheidungsfälle, konservative konkrete Betriebsparameter, Kostenrechnung ohne erfundene Messwerte, Zustell-/Retentionvorschlag, neue geprüfte Recovery-Version und den späteren einmaligen Freigabetext. [Methoden-JSON](D1_METHOD_DRAFT_V1.json) ist der tatsächliche S0-Vertrag mit **NOT_APPROVED**. Das [Manifest](D1_METHOD_MANIFEST_V1.json) pinnt 44 vorhandene Quell-/Test-/Dokumentdateien an E1 und vier D1-Dokumente; es enthält 13 konkrete spätere Abnahmefallgruppen und die 17 vollständigen bisherigen Vor-Owner-Lücken. Es ist eine Prüfdatei, keine Runtime-Autorität.

## Wesentliche selbst geprüfte Grenzen

1. **Pilot passt noch nicht direkt zum Globalvertrag.** AA verlangt `travel_date` im 07.–13.11.2026-Anwendungsfenster, V3 erlaubt nur globale `not_applicable`-Scopegültigkeit. Der echte Rechtsbezug bleibt auf der Evidence. Pilot-`tourism` darf nicht still zum breiteren `visitor`-Prädikat werden. Das Paket behauptet deshalb kein fertiges globales Mapping und entfernt keine Bedingungen.
2. **Keine neue rechtliche Behauptung.** Der bekannte `not_required/visa_exempt`-Wert wird ausschließlich als ruhender Kandidatcode beschrieben. Website und amtliche Rechtslage wurden nicht neu geprüft. Quellenrolle/Domain/Hash allein erzeugen keine Zulassung; Katalog bleibt leer, Kandidat `current=false`.
3. **Kürzere echte Fristen bleiben bestehen.** Native Ein-Stunden-Grenze unverändert; konkreter D1-Pflichtquellenkandidat300s/Prüfung 120 s. Trip-Store source≤300 s, raw retention≤3600 s und display≤15 s werden nicht durch Public-Projektion≤60 s überschrieben. Cachebau setzt Abrufzeit nicht neu. Kandidatwerte sind weder genehmigt noch gemessen.
4. **Keine versteckte zweite Quellenpflicht.** Höchstens zwei endliche optionale Versuche mit insgesamt 8000 ms; fehlen passende qualifizierte Quellen, bleibt `not_found` möglich. Ein früherer echter Konflikt bleibt dagegen wirksam. Technische Zustellung/Owner-Lesen ist keine fachliche Auflösung.
5. **Betriebsvorschlag mit expliziter Rechnung.**720 planmäßige Primärprüfungen/Tag, maximal 2160 mit zwei optionalen Quellen; mit drei Versuchen theoretisch 6480 Starts. Empfohlener gemeinsamer Cap 2160 einschließlich Retries, Primärvorrang, nur ein laufender Abruf je Publikation. Tatsächliche Source-Raten, Kosten und Latenzen sind unbekannt und vor Aktivierung zu belegen; bezahlte Rechercheaufrufe: 0 freigegeben.
6. **Aufbewahrung erhält Abhängigkeiten.** Keine neue Raw-Retentionerlaubnis. 7 Tage terminale Proposal-Bytes und 365 Tage entkoppelte Auditmetadaten sind Vorschläge; aktiver Head/Konflikt/Replaynachweis wird nicht blind per TTL gelöscht. Auditmetadaten nach Originalablauf ermöglichen keine nachträgliche Re-Extraktion. Löschautomatik ist nicht als implementiert dargestellt.
7. **D0 bleibt unverändert offen.** #917 APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, Ledger UNKNOWN, Stage2 NOT_ATTEMPTED; #1139 NOT_ACCEPTED. Keine der 17 Vor-Owner-Lücken geschlossen, kein human SQL oder erneuter Antrag auf alte Belege. Der spezifische verweigerte Readback wird nicht umgangen.

## Tatsächliche lokale Validierung

[D1_VALIDATION_V1.json](D1_VALIDATION_V1.json) enthält die Ergebnisse und ihre Grenzen.

- Node **22.23.4**, vorhandenes `server-only-test-register.mjs` und `tsx`: Der echte `readV3MethodRevisionDraft` liest das neue JSON erfolgreich als NOT_APPROVED. Derselbe Reader verweigert `status=APPROVED` und ein zusätzliches `accepted`-Feld. Tatsächliche `OFFICIAL_TRUTH_V3_BINDINGS` bleiben NOT_APPROVED/null.
- Python3 prüfte **48 Dateipins**, jeweils Bytezahl/SHA256/Gitblob; alle 44 Sourcepins zusätzlich gegen tatsächliche `git show E1:path`-Bytes. **36 relative Markdownlinks** der drei geprüften Task-/Plan-/Paketdokumente führen zu vorhandenen Dateien.
- Alle 17 vollständigen Blockerzeilen wurden exakt mit der bestehenden Zielmatrix verglichen. Kein zusätzliches Tracked-File seit Taskseed verändert; gegenüber E1 ist allein der bereits veröffentlichte D1-Task der bestehende Tracked-Diff.
- Der erste lokale Verifier erwartete irrtümlich einen leeren Tracked-Diff gegenüber E1 und scheiterte an diesem legitimen Taskseed. Der Verifier wurde auf genau diese eine vorhandene Taskdatei plus null Änderungen seit Taskseed präzisiert; alle Inhalts-/Hash-/Link-/Blockerprüfungen blieben bestehen. Der zweite Lauf bestand. Das war kein Produkt-/Source-Testfehler und wird nicht verschwiegen.

Keine tatsächlichen Methodenabnahmefälle, lokalen PostgreSQL-Tests, neue Typecheck-/Build-/Full-CI-/Preview-Gates durch D1 ausgeführt; D1 verändert keinen Runtimecode. Vorhandene V3-Gates sind historische Basis-Evidence und kein frischer D1-Head-PASS. Kein Hosted-/Auth-/Credential-/Quellen-/Provider-/Researcheraufruf, keine Nachricht oder Aktivierung. Keine neuen laufenden Kosten.

## Dateimanifest vor Veröffentlichung

| Datei | UTF-8-Bytes | SHA256 |
|---|---:|---|
| D1_METHOD_DRAFT_V1.json |567|`518326cabf53f0593c1ebdab951d8a17230e2deb86c062cf126bc6fd99b4f6d0`|
| D1_METHOD_MANIFEST_V1.json |62113|`3c9bd501e4dd4bd0eb0977da6457e562ad507e4c747e9452d683ba5baf5bebf9`|
| D1_METHOD_PACKAGE_V1.md |30508|`0867d61929d2ebc91e0a800819bab5ff4c32ee89e7faa5135c858d7b4e8c352f`|
| D1_PLAN_V1.md |2932|`d6a957ca952ea4d20387a801a652380f23f0d102b377fed87045999ee0bdf742`|
| D1_TASK_V1.md, bestehender unveränderter Taskseed |5181|`787dc79a4a369109d15161a949357e6f06f7b2615c904bd169c8a91ffd0ffb62`|
| D1_VALIDATION_V1.json |2485|`87e31f6e48ee13706a7561e0f00709e1fb1887e2f0d1a8967490338b4625ae6b`|

Dieses Handoff enthält absichtlich keinen eigenen Hash. Das Paketmanifest enthält keinen Hash seiner selbst oder später verfasster Evidence; Veröffentlichungspin und Rootreview binden den abschließenden Gesamtstand ohne selbstbezüglichen Hash.

## Risiken und exakter nächster Schritt

Kein neuer P0 aus dieser begrenzten Dokumentenprüfung, kein allgemeines Security-/Legal-PASS. **P1:** tatsächliche Ziel-/Owner-/Session-/Recovery-Evidence, aktuelle Quellenqualifikation, verlustfreies globales Bedingungenmapping, reale Methoden-/Dienst-/Accepted-/Cacheautorität. **P2:** bestehende #911/#913-Privacygrenzen; Replay-/Retention-/Zustellung bedürfen tatsächlicher Implementierung. **P3:** reale Betriebs-, Kosten-, Performance- und gegebenenfalls Gerätebelege. #1131/#1135/#968 bleiben unverändert.

**Root prüft jetzt die vollständigen sechs neuen D1-Dateien gegen Task und E1-Code, besonders die konkreten Zeit-/Last-/Retentionvorschläge und die Pilot→Global-Grenze.** Erst danach veröffentlicht Root den neuen D1-Head und bewertet dessen erforderliche Gates. Sofortige Korrekturen bleiben in dieser Session. S1/N1 laufen unabhängig weiter; aus diesem Handoff wird kein weiterer Slice gestartet. Der Owner erhält noch keinen Freigabeantrag für das unreife Dev-/Methodenpaket.

**do not mark Ready; do not merge; do not start a follow-up slice. Autor STOP. Selfreview ist kein TL-PASS.**
