# U1 — Besucher-/Cachevertrag V1 mit TASK R2

Stand 9. November 2026. Gemeinsamer S0-Vertrag: `ab26914ff01dde64020879b9e41cea8b1e1738aa`; Entwicklung, keine Aktivierungsfreigabe. U1 liefert ruhenden Code innerhalb Draft #1165. Alle positiven lokalen Adapter sind ausdrücklich synthetische Tests.

## Öffentlicher ruhender Einstieg

`queryOfficialTruthVisitorV3(input)` liest ausschließlich S0-Besuchereingaben und gibt für jede Staatsangehörigkeit `unavailable/unbound` aus. `OfficialTruthVisitorV3` hat mit `unboundV3VisitorLoad` ebenfalls einen geschlossenen Standard. Es gibt keine Umgebungsvariable, die diese Defaults an eine Datenbank, einen Provider oder eine Testquelle anschließt. Es gibt keine produktive Route oder Navigation.

`createV3VisitorQuery(ports)` ist die server-only Orchestrierung für eine spätere überprüfte, code-eigene Komposition. Eingaben sind Zielland und 1–5 normalisierte Staatsangehörigkeiten. Cache und Recherche kennen keine Besucher-/Session-/Trip-/Passkennung. Die Antwort bleibt je Staatsangehörigkeit und vollständigem Regelkontext getrennt. Keine individuelle Einreiseentscheidung oder Auswahl eines bevorzugten Passes.

## Verbindliche Ports für E1

| Port | Pflicht des späteren Adapters |
| --- | --- |
| `methodAuthority` | Tatsächliche aktuelle Methodenfreigabe, private Receipt-Custody und erneuter Nachweis; kein serialisiertes Statusfeld als Freigabe. |
| `coverage.targets` | Erfolgreich gelesene globale Kontext-/Faktziele als `Lesung`; keine erfundenen Pass-, Routen-, Reise- oder Zweckdefaults. Fehler ist keine Leere. Maximal 16 eindeutige Ziele je Staatsangehörigkeit; Übergrenzen werden zurückgewiesen, nicht abgeschnitten. |
| `cache.read` | Exakter Schlüssel aus Ziel, einer Staatsangehörigkeit, vollständigem `contextKey`, Faktart und Methode. Keine Zeile = echter Miss, mehr als eine Zeile = Fehler. |
| `current.reprove` | Reale aktuelle accepted-Pointer, Originalprojektion und exact-byte/version/evidence/decision/method Bindung. Receipt bleibt Privatbesitz des Adapters. Zurücknahme/Widerspruch/fehlender Nachweis unterdrücken positive Inhalte. |
| `current.confirmBatch` | Ein gemeinsamer atomarer aktueller Nachweis aller Kandidaten **und der Methode** vor Ausgabe. Die positive Referenzliste darf nur eindeutige angefragte Projektionen enthalten. Getrennte, sequentielle optimistic flags sind unzulässig. Keine Bestätigung entfernt positive Zellen; ein nicht bestätigter Methodenstand entfernt auch Pending. |
| `queue.enqueue` | Bekannte vollständige Regelkontexte an M1 übergeben; erst echter bestätigter aktueller S0-Regeljob kann Pending erzeugen. |
| `discoveryQueue.enqueue` | Erfolgreich leere Coverage an M1-Discovery übergeben; nur neutrales Paar und Methode, ohne RuleContext. |
| `clock`, `ids`, `registry` | Vertrauenswürdige UTC-/Rechtsdatum-Uhr, gültige Operation-/Job-IDs, exakt geladener kanonischer Registry-Snapshot. Kein Remote-/Latest-/Host-Fallback. |

`prepareV3VisitorProjection` baut synchron eine überprüfte Form für eine bereits separat nachgewiesene Regel, ohne irgendetwas zu veröffentlichen oder eine Autorität zu schaffen. Es bindet Quellenzeit an `evidence.retrievedAt`, nicht an Annahme oder Cachebau. Quelle ist über den exakten S0-Content-Pin synchron aufgelöst. Bereits vorbereitete Bytes werden vom Lesepfad vor jeder Ausgabe zusätzlich aktuell nachgewiesen.

### Queue-ACK und M1-Abstimmung

Regelinput: `{ context, method, factKind, researchReason, jobId, operationId, attemptLimit }`.

Discoveryinput: `{ destinationCountryCode, citizenshipCountryCode, method, jobId, operationId, attemptLimit }`.

Beide U1-Ports antworten `confirmed + record` oder `unavailable | unconfirmed | conflict`. M1 bestätigte dasselbe Eingabeformat. M1 liefert zusätzlich unter anderem `replayed`, `collision`, `contended`, `invalid`, `not_due`, `superseded`; E1 muss diese explizit auf nicht-positive U1-Zustände abbilden. M1 liest beim Confirm den aktuellen Record, damit ein alter queued-Receipt nach Abschluss/Neuanlage nicht wieder laufende Arbeit behauptet.

U1 liest confirmed Records durch den jeweils eigenen S0-Reader, bindet Paar/Kontext, Namespace und Methode exakt und akzeptiert nur `queued`, `leased`, `backoff`; eine bereits abgelaufene Lease ist kein aktives ACK. Lost ACK bleibt Fehler, selbst wenn der Testqueue intern bereits einen Auftrag angelegt hat. E1 darf das nicht zu „genau einmal“ oder „wird geprüft“ umdeuten. Wiederholung derselben Paar-/Methodenidentität wird durch M1 atomar dedupliziert. U1 erzeugt selbst keine DB-Durabilität.

## Zeit, Fehler und Darstellung

Die Koordination besitzt ein Gesamttimeout von 750 ms und propagiert Abbruchsignale; ein Adapter, der sein Signal ignoriert, wird dadurch nicht physisch gestoppt. Er muss selbst begrenzte und idempotente Operationen besitzen. Bis zu fünf Staatsangehörigkeitszellen laufen parallel, Ziele innerhalb einer Zelle begrenzt seriell. Keine synchrone Quellen-/Modellrecherche.

Initialer ungültiger Projektionsinhalt wird als `invalid_data` unterdrückt. S0 unterscheidet dabei nicht alle Form- und Zeitfehler; U1 behauptet für korruptes Material keine bloß veraltete Regel. Ein zuvor gültiger Kandidat, der während eines Await seine Frist überschreitet, wird mit der tatsächlichen Enduhr als `unavailable/expired` entfernt. Im finalen Prüfabschnitt folgt kein weiteres Await vor Antwortbildung.

Die reine Darstellung erhält sämtliche logischen Bedingungen, Negationen, Zweige und Otherwise-Fälle. Schema-2-Aufenthaltsregeln zeigen Erstbewilligung, Einheit, Gesamtdauer, Antrag, Behörde, Frist und Grenzermessen; Fristen unterscheiden Pflicht/Empfehlung. Amtliche Aktions-/Anforderungs-/Visa-Bezeichnungen und Länderanzeige stammen aus vorhandenen Modulen. Quellenname, originale Quellenzeit, Gültigkeit und Regelrevision werden angezeigt.

Der Client importiert keine serverseitigen Ports, Registry, Custody-, Methoden- oder Testfixture-Module. Er erhält ausschließlich eine Anzeige-DTO über eine explizite Funktion. Neue Auswahl leert alte Antworten sofort; Abbruch, Requestgeneration und Antwortpaar-Prüfung verhindern Überschreiben durch alte Antworten. Rohe Fehler werden nicht ausgegeben. Der spätere produktive HTTP-Transport und seine Decodierung sind noch nicht angebunden. Die Oberfläche aktualisiert nach einer neuen Abfrage; ein automatischer Abschluss-Push/Polling aus M1 ist noch nicht angebunden.

## Ungebunden und offen

Es gibt keine produktive Methodenautorität, Coverage-/Cachepersistenz, Current-Proof-/Batch-Transaktion, Queue-/Discoverypersistenz oder Transportanbindung. Es gibt keinen Provider oder Scheduler, keine Datenbankänderung und keine Produktionsaktivierung. Produktionskosten/SLO/Last/Regionen wurden hier nicht gemessen. Die isolierten In-Memory-Adapter beweisen die Orchestrierung, nicht die späteren Persistenzgarantien. Root/TL muss die aktuelle Integration und die UI unabhängig prüfen; Agentenselbstprüfung ist kein TL-PASS.
