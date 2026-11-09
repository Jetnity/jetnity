# I1 — Neutraler Rechercheeingang und Import-Orchestrierung, Schnittstelle V1

Autor: **Jetnity Official Truth V3 Import 1 — Codex Generation 1**, Session `/root/v3_import_writer`, Draft #1164, TASK V1. Diese Implementierung aktiviert keine Quelle, Methode, Datenbank oder öffentliche Route.

## 1. Fester Eingang für jeden Rechercheanbieter

Der Eingang ist genau **ein UTF-8-JSON-Text** mit dem S0-Schema 3 und `kind: untrusted_research_proposal`. Weder ein Anbietername noch ein Modellname bestimmt die fachliche Bedeutung. Ein Grok-Team, ein anderer Anbieter oder ein späterer Uploadadapter liefert denselben Vertrag. Das maschinenlesbare `V3_PROPOSAL_INTERFACE` in `import/interface.ts` enthält Interface-ID, Version, Medientyp, Encoding, Feldliste, Bytebudget und den Namen des kanonischen Runtime-Lesers. Es ist eine Transportbeschreibung, keine zweite Factschema- oder Freigabequelle.

`readV3ProposalUpload(jsonText, serverRegistry)` prüft zuerst Zeichen-/UTF-8-Größe und verlustfreie Unicode-Kodierung, dann JSON und den bestehenden `readV3ResearchProposal`. Unbekannte Keys, Personendaten, Rawtext/Bilder, freie Quellen-URLs, Approval-/Methoden-/Registry-/Receipt-Felder werden nicht in Quarantäne gespeichert. Fehler nennen nur feste Codes. Keine Datei, URL, Datenbankverbindung oder Netzwerkressource wird vom Leser geöffnet.

Der Registry-Snapshot kommt vom zuständigen Serverpfad. Ein Researcher darf keine Registry mitsenden. Unbekannte Quellen benötigen den getrennten bestehenden Discovery-/Qualifikationsweg; dieser Upload registriert sie nicht automatisch.

Das Uploadbudget beträgt 65.536 UTF-8-Bytes; die bestehenden S0-Tiefen-, Knoten- und fachlichen Arraygrenzen gelten weiter. Jede Operation wird an den SHA-256 ihrer **exakten Textbytes** gebunden. Auch zusätzliche Leerzeichen oder eine andere JSON-Reihenfolge erzeugen andere Bytes. Derselbe `operationId` mit anderen Bytes wird als Kollision verweigert, nicht überschrieben. Der Anbieter behält die einmal gesendeten Bytes für einen Transport-Retry bei. Eine neue inhaltliche Vorschlagsrevision erhält eine neue Operation-ID; eine unklare alte Mutation darf damit nicht umgangen werden.

### Vollständiges ausschließlich synthetisches Beispiel

Das folgende Beispiel zeigt keine echte Einreisebestimmung. `.example`-Quellen, neun Passseiten und AQ sind ausschließlich Testmaterial. Die Kontext-/Research-IDs wurden durch die tatsächlichen S0-Funktionen berechnet. Das Beispiel ist nur gegen die isolierte Testregistry aus `service.test.ts` lesbar; es ist kein produktiv zugelassener Quellenauftrag.

```json
{
  "schema": 3,
  "kind": "untrusted_research_proposal",
  "jobId": "job3_22222222222222222222222222222222",
  "operationId": "op3_11111111111111111111111111111111",
  "context": {
    "scope": {
      "destinationCountryCode": "AQ",
      "transitCountryCode": null,
      "citizenship": { "mode": "required", "countryCodes": ["CH"] },
      "credentialOption": {
        "mode": "option",
        "documentType": "passport",
        "issuingCountryCode": "CH",
        "relatedCitizenshipCountryCode": "CH"
      },
      "residence": { "mode": "not_applicable" },
      "requirementType": "blank_passport_pages",
      "validity": { "mode": "not_applicable" }
    },
    "route": "direct_entry",
    "conditions": { "status": "unconditional" }
  },
  "contextKey": "official-truth-context:v3:2802527e443248c2333faf9319ac77043fa23c50b971a4a53a5b5eb7175dd7de",
  "research": {
    "key": "research-request:v1:aee1e686b3429d3ab1a266d75f789a61ca570b69e7d9d28bbabad10d80bc9bb2",
    "ruleScopeKey": "rule-scope:v1:e2e920e54147947e76e6f264b37b836e862fe3f578ac6c1903f7eeaff70918d4",
    "factKind": "blank_passport_pages",
    "researchReason": { "status": "missing" }
  },
  "proposedFact": { "schema": 1, "fact": { "kind": "blank_passport_pages", "minimumPages": 9 } },
  "references": [
    {
      "source": {
        "sourceId": "synthetic-primary",
        "contentItemId": "synthetic-publication",
        "representationId": "synthetic-json"
      },
      "claimedRetrievedAt": "2026-11-09T12:00:00.000Z",
      "claimedValidity": { "status": "specified", "validFrom": null, "validUntil": null }
    }
  ]
}
```

## 2. Tatsächlich implementierter Ablauf

1. Neutralen Upload lesen und vor jedem Speicheraufruf auf zulässige Form prüfen.
2. Atomare Quarantänereservierung für Operation-ID und exakte Bytes: acquired, busy, collision, bestätigter Replay oder unavailable bleiben verschieden.
3. Die aktuelle Methodenfreigabe über `V3MethodAuthorityPort` auflösen. Kein Feld aus dem Researchervorschlag erzeugt diesen Receipt.
4. Aktuellen Regel-/Entscheidungs-/Archivstand aus dem History-Port lesen. Der S0-Leser validiert Entscheidung, unmittelbaren Vorgänger und den **zu dieser aktuellen Entscheidung gehörenden** Archivappend. Revision, Status und Versionsreferenz müssen zum Pointer passen.
5. Den Quellenprüfport ausschließlich mit Kontext, Faktart, registrierten Quellenreferenzen, separater Methode, Serveruhr und bisheriger Entscheidung aufrufen. Vorgeschlagene Fakten und behauptete Abruf-/Gültigkeitsdaten werden nicht weitergereicht.
6. Aus den servereigenen Prüfresultaten die Quellenentscheidung mit S0 erstellen. Eine klare qualifizierte Pflichtquelle genügt; erfolglose optionale Gegenprüfungen allein sperren sie nicht. Bekannte ungelöste Konflikte bleiben erhalten. Ein echter Konflikt oder eine unklare Pflichtquelle erzeugt eine deduplizierbare Eskalation; ungeklärte Bedingungen bleiben in Quarantäne.
7. Quellen-/Original-/Vergleichs-/Archiv-Reproof, aktuellen History-Head und Methodenfreigabe erneut prüfen. Zwischenzeitlich abgelaufene Quellenprüfung, legaler Tageswechsel, Zeitrückschritt, Widerruf oder geänderter Head verhindern die positive Übergabe.
8. Eine neue vorbereitete Version und einen exakten CAS-Transitionsplan erstellen. Fakt und echte Quellenzeit stammen aus der verifizierten Primärbeobachtung. Abweichende Researcherwerte werden als `superseded_by_source` markiert; sie bestimmen die neue Regel nicht.
9. Ergebnis, minimierte Auditzeile und gegebenenfalls Eskalationsschlüssel über den Quarantäne-Port atomar bestätigen. Erst danach liefert der Dienst `completed`. Diese Bestätigung betrifft nur den Importversuch, nicht den Accepted Store.

Der gesamte Aufruf besitzt ein lokales Budget von standardmäßig maximal 30 Sekunden und ein Abort-Race. Ein unkooperativer Port kann die Rückgabe nicht unbegrenzt aufhalten. Timer und Listener werden entfernt. Ein später aufgelöster Read darf keine weiteren mutierenden Schritte starten. Ein Timeout oder verlorener Reply nach möglicherweise erfolgter Reserve/Finish bleibt `outcome_unknown`; ein später tatsächlich erfolgter Write wird nicht als nicht geschrieben dargestellt.

## 3. Ports und Verantwortlichkeiten

| Anschluss | I1 prüft / orchestriert | Der später reale Adapter muss zusätzlich belegen |
| --- | --- | --- |
| `V3MethodAuthorityPort` | getrennte Freigabeauflösung und erneuter Reproof derselben Methodenrevision | tatsächliche einmalige Owner-Methodenfreigabe, Widerruf und aktuelle Gültigkeit; kein selbst ausgestellter JSON-Receipt |
| `V3ImportEvidencePort` | strikte S0-Konsistenz, Zielland-/Methoden-/Evidence-/Kontextbindung, Fristen, getrennte Prüfung vor Übergabe | amtliche Zuständigkeit, echte Original-Custody, kanonische Extraktion, unabhängige Publikationen, methodengültige semantische Vergleichs-/Auflösungsbelege und Archiv-Custody |
| `V3ImportHistoryPort` | aktueller Pointer plus passender Version/Entscheidung, unmittelbarer Vorgänger und genauer Archivappend; erneute Head-Prüfung | wirklich aktueller Store-Head und unverfälschte historische Records samt append-only Archiv |
| `V3ImportQuarantinePort` | Operation/Digest-Reservierung, Replay/Kollision, atomare Ergebnis-/Audit-/Eskalationsbestätigung | dauerhafte Speicherung, Lease/Fencing und Crash-Recovery; keine neue Reservation mit geändertem Digest, kein alter Worker nach Reclaim |

Die Port-Objekte sind eine bewusst separate Codeschnittstelle, keine Endpunkte und keine vom Researcher konfigurierbaren JSON-Felder. `createV3ImportCoordinator` enthält die wirkliche Orchestrierung für überprüfte Adapter beziehungsweise isolierte Tests. **`importV3ResearchProposalProduction()` bleibt fest `unavailable/unbound`**, ohne Argument für einen positiven Adapter und ohne Environment-Schalter. Kein bestehender App-/API-Aufrufer importiert die neue Koordination.

Die Quelle eines nach eigener Methode rechtlich kompatiblen oder widersprüchlichen Vergleichs muss der Evidence-Port getrennt nachweisen. I1 baut keinen universellen Sprach-/Rechtsvergleich und keine neue Registry. Die synthetischen Tests führen den vorhandenen `officialTruthTrustedFactExtrahierenMitDefinitionen` nur in der Testdatei auf fiktiven Originalbytes aus. Die echte WeakMap-Ausführungsbindung wird konsumiert; bloße Ergebniskopien funktionieren nicht. Ein zusätzlicher Test-Receipt bindet diesen lokalen Prüfpfad. Diese Tests beweisen weder echte amtliche Originale noch produktive Autorität. Das echte globale Produktionsroot bleibt unverändert `custody_missing`, das Produktions-Extractorregister leer.

## 4. Ergebnisbedeutung und Anschluss an M1/E1

| Ergebnis | Bedeutung |
| --- | --- |
| `rejected` | Upload ungültig, Größenlimit oder Operation-ID-Kollision; kein neuer positiver Import |
| `busy` | Dieselbe Operation ist reserviert; keine zweite parallele Verifikation |
| `completed` / `prepared` | lokal geprüfte neue Version/Entscheidung/Transition und bestätigter Importversuch; **kein Commit in den Accepted Store** |
| `completed` / `escalation` | fachlicher Sperrgrund plus deduplizierbarer Outboxschlüssel; kein externer Versand durch I1 |
| `completed` / `quarantined` | ungültige/veränderte Nachweise, Methodensperre oder ungeklärte Bedingungen |
| `completed` / `unavailable` | keine belastbare Aussage wegen fehlendem Anschluss oder technischem Fehler; keine behauptete Leere |
| `outcome_unknown` | mutierender Port kann geschrieben haben; dieselbe Operation ist gezielt abzugleichen |

Ein Replay liefert den zuvor bestätigten **historischen Importausgang**, auch wenn inzwischen eine Quelle oder Methode veraltet ist. Er stellt keine neue Freigabe aus. Das `prepared`-Bündel führt deshalb ausdrücklich `acceptance: not_committed` und `reproof: required_before_commit`. M1/E1 darf daraus erst nach erneuter aktueller Prüfung einen echten atomaren Commit/Confirm aufbauen.

Das Bündel enthält `proposalDigest`, `decision`, `previousDecision`, `archiveAppend`, `version`, `transition` und die Erklärung `matched` beziehungsweise `superseded_by_source`. Ein `reaccept` aus conflicted/withdrawn erzeugt eine neue Version und benötigt die im S0-Plan vorgeschriebenen Auflösungsbelege; alte Versionen werden nicht direkt umgeschaltet. Vollständige Produkt-Recovery bleibt M1.

Der Legacy-Writer unterstützt nicht alle bedingten Schema1-/Schema2-Träger. I1 importiert ihn daher nicht, castet nichts und entfernt keine Bedingungen. Der spätere reale Commitpfad ist eine offene Integrationsgrenze. Ebenso offen bleiben reale Queue-/Quarantänepersistenz, Research-Transport, Quellenparser/-qualifikation/-vergleich, Methodenautorität und Benachrichtigungszustellung. Es gibt keine neue Datenbankmigration, DB-Aktivierung, Providerkosten oder öffentliche Route.

#917/#1139, Methoden- und Dev-Freigabe sowie #1131/#968 bleiben eigene unveränderte Grenzen. I1 enthält keine SQL-Anleitung und keinen Ersatz für den gesperrten historischen Readback.
