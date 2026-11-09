# Official Truth V3 — S0 Contract 1

**Autor:** Jetnity Official Truth V3 Shared Contract 1 — Codex Generation 1

**Session:** `/root/v3_contract_writer`

**Auftrag:** `PROGRAM_V1.md`, S0 TASK V1, #1162 / Draft #1163

**Status:** Gemeinsamer Runtime-Datenvertrag zur unabhängigen Prüfung. Keine Methodenfreigabe, kein produktiver Import, keine öffentliche Aktivierung.

## 1. Bedeutung der Leser

`lib/readiness/official-truth-product-v3/contract.ts` ist ein ruhendes Modul mit lokalen deterministischen Lesern. Erfolgreiches Lesen liefert `V3ReadResult<T>` mit einem tief eingefrorenen, vom Eingabeobjekt getrennten Record. Es bestätigt Form und die ausdrücklich geprüften inneren Beziehungen. Ein Record ist weder Herkunftsnachweis noch `EvidenceVersion`, `AkzeptierteRegelClaim`, Store-Receipt oder Freigabecapability. Insbesondere kann ein öffentliches `accepted`-Datenlabel keine fehlende tatsächliche Annahme herstellen.

Die Import-/Projektionsadapter müssen die echten bestehenden Original-, Custody-, Methoden-, Annahme-, Commit-/Confirm- und aktuellen Versionsnachweise getrennt beibringen. **Parse → anzeigen** ist kein erlaubter Integrationsweg. JSON, Checksumme, Typannotation und `dataMode` erteilen keine Autorität. Die Referenzleser bestätigen auch nicht, dass eine übergebene Registry ein produktiv zugelassener Snapshot ist; die Registry kommt ausschließlich aus dem später gebundenen serverseitigen Eigentümer.

Alle produktiven Anschlüsse in `OFFICIAL_TRUTH_V3_BINDINGS` sind `null`; `methodStatus` ist `NOT_APPROVED`. Es gibt keine Umgebungsvariable, keinen Setter und keinen Fallback auf synthetische Daten.

## 2. Öffentliche API

| API | Eingabe und Ergebnis | Grenze |
| --- | --- | --- |
| `readV3VisitorInput` | Zielland und eine bis fünf rohe Staatsangehörigkeitsangaben; kanonisch sortierte, eindeutige ISO-Codes | Kein Wohnsitz, Datum, Zweck, Dokument oder persönlicher Identifikator |
| `readV3GlobalRuleContext` | Bestehender Scope plus explizite Routenart und globale Bedingungen | Genau eine Staatsangehörigkeit je Regelzelle; kein Besucherprofil |
| `createV3WorkIdentity` | Kontext, Faktart, Methodenreferenz und bestehender Recherchegrund → Scope-/Kontext-/Research-/Job-Identitäten | Nur deterministische Identität; kein Auftrag wird ausgeführt |
| `readV3ResearchProposal` | `untrusted_research_proposal`, Job-/Operation-ID, Kontext, Research-Identität, vorgeschlagener Fakt, Quellenreferenzen | Vorschlag bleibt untrusted; keine Methode/Registry/Approval/Schreibrechte im Envelope |
| `readV3MethodRevisionDraft` | Versionierter Methodenentwurf und vorgeschlagene Betriebsparameter | Nur `DRAFT` oder `NOT_APPROVED` |
| `readV3SourceDecisionRecord` | Pflichtquelle, optionale Versuche, aktive Konflikthistorie, Auflösungsrecords und unmittelbarer Vorgänger; optionaler vierter Parameter `archiveAppend` | Beziehungen werden gelesen; Qualifikation, Vergleich, Auflösung und tatsächliche Archiv-Custody benötigen echten Reproof |
| `readV3ConflictArchiveRecord` | Begrenzte unveränderliche Archivseite mit eigenem Head, Vorgänger, kumulativer Anzahl, exaktem Herkunftsentscheid und vollständigen aufgelösten Records | Kein Archiv-Receipt und kein Entfernen unaufgelöster Konflikte; keine Persistenz |
| `readV3RuleVersionRecord` | Versionsrecord und passender Quellenentscheidungsrecord | Kein Aufruf des Legacy-Annehmers oder -Writers; accepted verlangt passenden klaren Quellenrecord |
| `readV3TransitionPlan` | Erwarteter Pointer, neue Version, Operation, Methoden-/Evidence-/Decision-/Recovery-Referenzen | Ein CAS-/Reproof-/Confirm-Plan; keine Mutation |
| `createV3TransitionIdempotencyKey` | Gültiger vollständiger Transitionsplan → Prüfsummenkennung | Keine Exactly-once-Zusage und kein Receipt |
| `readV3ResearchJobRecord` | Deduplizierbarer Auftrag mit Revision, Lease, Attempt-Limit und Backoff | Kein Scheduler, keine Lease-Akquisition, kein Provideraufruf |
| `readV3PublicProjectionRecord` | Versionierte Projektion plus getrennt gelieferte Uhr/gesetzlicher Kalendertag | Prüft Form und Zeit; tatsächlichen aktuellen accepted Pointer liefert U1 separat |
| `resolveV3PublicSourceDisplay` | Exakt gepinnte ContentIdentity plus bestehender Registry-Snapshot → amtlicher Name und URL | Synchroner Lookup; keine zweite Registry, kein Abruf und keine Herkunftsfreigabe |
| `readV3PublicResponseRecord` | Vollständige Staatsangehörigkeitszellen mit einzelnen Ergebniszuständen | Kein Gesamt-accepted, kein Ranking und keine automatisch gewählte Dokumentoption |

Die exportierten Typnamen enthalten `Record` oder `Draft`, wo leicht eine Autoritätsverwechslung entstehen könnte. `V3MethodAuthorityPort<Receipt extends object>` ist eine zukünftige getrennte Codeschnittstelle: `resolveCurrent` muss eine tatsächliche aktuelle Freigabe auflösen; `reproveAtCommit` muss dieselbe Freigabe unmittelbar vor Commit erneut prüfen. Der Adapter besitzt seinen Receipt-Typ und seine Herkunfts-/Custody-Prüfung. S0 implementiert keinen solchen Adapter und keinen Receipt-Konstruktor. Ein synthetischer Testadapter darf später nur in isolierten Tests gebunden werden.

## 3. Kompatibilität und Wiederverwendung

| Bestehender Vertrag | Nutzung in S0 | Keine zusätzliche Behauptung |
| --- | --- | --- |
| `landescodeLesen`, `istKatalogLand` | Normalisierung und tatsächlich zugewiesene Ländercodes | Zwei Buchstaben allein reichen nicht |
| `RegelScope` / `EvidenceAtom`, `regelScopeAusEvidenceScope` | Dieselbe quellenneutrale Scope-Projektion und derselbe `rule-scope:v1:`-Schlüssel | Scopegleichheit allein beweist keine gleichen Bedingungen |
| `OFFICIAL_REQUIREMENT_TYPES`, `REGEL_FAKT_ARTEN` | Unveränderte Anforderungs-/Fakttaxonomie | Keine neue Visa-Untertaxonomie |
| `RegelFakt`, `RegelFaktV2`, `regelFaktKanonischLesen` | Faktprüfung mit expliziter Schemawahl; strukturierte Bedingungen bleiben erhalten | Der kanonische Leser ist keine Extraktions- oder Annahmeautorität |
| `RegulierungsAusdruckV2` und seine Leser/Strukturschlüssel | Zweck, Dokumentklasse, Aufenthaltsdauer, Staatsangehörigkeitsbeziehungen und weitere vorhandene globale Prädikate | Kein persönlicher `RegulierungsKontext` und keine Einreisezusage |
| `QuellenRegistry`, `quellenUrlAufloesen` | Quellen-IDs und bestehende URL-Regeln; Aktions-URLs zusätzlich nur als exakt registrierte aktuelle Publikations-URL | Quellenklasse/Host ersetzen keine Ziellandzuständigkeit |
| `RepresentationRef`, `ContentIdentityBinding`, `contentEvidenceLookupV3` | Bestehende Publikations-, Darstellungs-, Profil-, Versions- und `evidence-key:v3:`-Identitäten | Ein Content-Lookup bekommt exakt `sourceId`, `contentItemId`, `representationId`; keine siebenfeldige Binding-Hülle |
| `ev2_`-Evidence-IDs und Contenthash | Unveränderte Verweise samt Quelle, Protokoll, Hash, Abrufzeit und rechtlicher Gültigkeit | Die reduzierte Hülle rekonstruiert keinen Ursprung und keine vollständige kanonische Evidence-Version |
| `OfficialTruthRechercheAnfrage`, `officialTruthRechercheEntscheiden` | Gleiche Research-Request-/Scope-/Fact-/Grund-Identität | Der zusätzliche Jobschlüssel ist nur Deduplizierung, keine zweite Rechercheengine |
| `schema2DatenPruefen`, `schema2Kanonisch`, `civilDateOrdinalLesen` | Vorprüfung von JSON, deterministische Serialisierung und strenge Kalendertage | `Date.parse` allein normalisiert ungültige Tage und genügt nicht |

Der Legacy-Store `official-truth-store-server.ts` nimmt gerade **keine** Schema-1-Anwendbarkeit und **keine** Schema-2-Faktträger an. Die V3-Hülle ist deshalb kein `PersistierbarerRegelFakt`. I1 muss diese Grenze ausdrücklich integrieren oder geschlossen halten; Casts, Bedingungsverlust oder ein als `trustedRuleFact` umbenannter Researchervorschlag sind unzulässig. S0 ändert weder Store noch Annahmepfad und übernimmt keine Bytes aus #1135.

## 4. Globaler Kontext und Quellenentscheid

Die Besuchereingabe enthält zwei Felder. Die globale Regelzelle enthält bewusst mehr Struktur: einen einzelnen staatsangehörigkeitsbezogenen Scope, eine explizite Dokumentoption/-verknüpfung, `direct_entry`/`transit`/`unresolved` und `specified`/`unconditional`/`unresolved` für die Regelbedingungen. Es gibt keinen erfundenen ordinary-passport- oder Direktreise-Default. Eine fehlende Verknüpfung oder unbekannte Dokumentart einer angegebenen Option bleibt ungeklärt. Das bestehende explizite `credentialOption.mode: not_applicable` bleibt für tatsächlich dokumentunabhängige Regeln möglich und erfindet keinen Pass. Die Methode muss diese Unabhängigkeit belegen. Ein konkretes persönliches Reisedatum wird nicht gespeichert; rechtliche Datumsintervalle gehören zur Quellenbeobachtung.

Der `official-truth-context:v3:`-Schlüssel ergänzt den bestehenden Scope um Routenart und normalisierte vollständige Bedingungen. Reihenfolge kommutativer Ausdrücke ist kanonisch; reine Support-IDs ändern den fachlichen Bedingungsschlüssel nicht. Unterschiedliche Zwecke, Dauern oder Dokumentklassen dürfen dieselbe alte Scope-ID haben und besitzen trotzdem verschiedene V3-Kontext-/Job-Identitäten.

Ein `clear_primary`-Record erfordert eine klare Pflichtquellenbeobachtung, passende Faktart/Kontextbindung, benannte Zielstaatsautorität beziehungsweise vertretenen Zielstaat einer Botschaft, passende Methode/Evidence-ID, Zeitfolge und bestimmte rechtliche Gültigkeit. Diese Felder sind **Qualifikationsbehauptungen eines Records**. I1 muss ihre echte methodengültige Herkunft prüfen. Eine .gov-artige Adresse oder `official_authority` allein erfüllt das nicht.

Die endliche Gegenprüfung führt mindestens einen Ergebnisrecord; ohne passende auffindbare Quelle ist `not_found` mit `source: null` möglich. Das ist keine Pflicht zu einem erfolgreichen zweiten Abruf oder zu einer erschöpfenden Weltsuche. `not_found`, `unreachable`, `unclear` und `not_applicable` enthalten keine erfundene Beobachtung und verhindern allein keinen klaren Pflichtquellenrecord. Ihre Anzahl bleibt begrenzt.

Vergleichsrecords binden beide Publikationen, vollständigen Kontext, Faktart und überlappende Gültigkeit. Verschiedene Darstellungen desselben ContentItems gelten nicht als unabhängige Gegenprüfung. Für `agrees` müssen die normalisierten Fakten einschließlich Bedingungen übereinstimmen; reine Support-IDs zählen dabei nicht als Rechtsänderung. Die bekannten unbedingten Legacy-/Schema-1-/Schema-2-Hüllen derselben Wirkung werden für diesen Vergleich angeglichen, ohne Bedingungen zu entfernen. Vergleichbare, kompatible, aber nicht identische Aussagen haben den eigenen Zustand `compatible`, mit expliziter Methodenbindung und `reproof: required_before_acceptance`. Eine zusätzliche optionale Visa-Option bei übereinstimmender gemeinsamer Option ist ein synthetisch getestetes Beispiel. Das ist keine echte Visa-Regel und keine Freigabe durch den JSON-Leser.

`conflicts` benötigt einen separaten Konfliktrecord. Ein bloßer Wrapperunterschied oder die bekannte nicht exklusive optionale Erweiterung wird dabei abgewiesen. Umgekehrt darf ein ausdrückliches required/not_required-Gegenteil beziehungsweise eine gegenteilige Zulässigkeit derselben Option nicht als compatible etikettiert werden. **Außerhalb dieser engen strukturellen Sicherungen beweist eine Abweichung noch keine rechtliche Unvereinbarkeit und ein kompatibler Vergleichsrecord noch keine tatsächliche Kompatibilität.** Diese semantische Qualifikation sowie echte Unabhängigkeit weiterer Publikationen muss der spätere Methodenprüfer anhand des Vergleichsverweises nachweisen. S0 implementiert keinen universellen Rechtsvergleich.

Ein unmittelbarer Nachfolger muss alle bekannten Konflikte unverändert referenzieren oder nach dem folgenden Archivvertrag erhalten; aus einem Abruffehler wird keine Auflösung. Positive Auflösungsrecords nennen denselben Konflikt, aktuelle Methodenreferenz, Zeitpunkt, **ihren eigenen gesetzlichen `legalAsOfDate`**, einen zulässigen Auflösungsgrund und frische gebundene Beobachtungen. Eine damals methodengültige historische Auflösung muss nicht zur heute gültigen optionalen Quelle werden: Ihre Datumsprüfung erfolgt am eigenen Auflösungstag, die aktuelle Pflichtquelle wird separat am heutigen Entscheidtag geprüft. Änderungen an früheren Auflösungsrecords erzeugen eine neue referenzierte Auflösung mit Vorgänger. Echte Methodengültigkeit und Custody dieser Nachweise bleiben vor Annahme/Commit erneut nachzuweisen. Ein fingierter neuer Genesis-Record kann einen vorhandenen Store-Vorgänger nicht ersetzen: M1/I1 müssen den tatsächlichen Store-Head im CAS beibringen.

### Begrenzte aktive Historie mit gebundenem Archiv

`knownConflicts` enthält maximal acht aktive beziehungsweise noch inline mitgeführte Konfliktrecords. Das ist **keine Lebenszeitobergrenze von acht Konflikten**. `historyArchive` ist an jedem Quellenentscheid explizit `null` oder ein unveränderlicher Archivpointer mit Referenz, Revision und kumulativer Konfliktanzahl. Ein neuer Genesis-Record darf kein fremdes Archiv mitbringen.

Ein späteres Archivieren aufgelöster Records liefert dem Leser als vierten Parameter eine `resolved_conflict_archive_record`-Seite. Sie enthält höchstens acht vollständige aufgelöste Konflikte, den alten Archivpointer, einen neuen Head mit um eins erhöhter Revision und entsprechend erhöhter Gesamtanzahl, Kontext/Faktart, `fromDecisionRef` und Archivzeit. Der Quellenentscheidungsleser verlangt exakt die aus dem unmittelbaren Vorgänger entfernten Records; Bytes dürfen dabei weder umgeschrieben noch durch IDs ersetzt werden. Unaufgelöste Konflikte, falsche Anzahl, fehlende Seite, falscher Vorgänger, fremder Herkunftsentscheid oder ein nicht passender neuer Pointer scheitern. Ohne Archivappend muss der alte Pointer unverändert bleiben.

M1/I1 müssen die Seite vor beziehungsweise atomar mit dem neuen Head nachweislich append-only persistieren und deren echte Custody/Methodenbedeutung am CAS-/Commit-/Confirm-Punkt belegen. Eine übergebene Seite ist nur ein Datenrecord, kein Beweis erfolgreicher Archivierung. Der produktive `conflictArchive`-Anschluss ist `null`. Frühere Seiten und Auflösungsbelege bleiben über die Pointerkette zugänglich; sie werden nicht gelöscht und nicht in jedes neue Antwortobjekt kopiert. Dadurch bleiben einzelne Reads begrenzt, während die Historie fortgeschrieben werden kann. Die synthetische Regression führt zehn solche Seiten nach acht bestehenden Records fort und prüft eine kumulative Archivanzahl von zehn bei weiterhin acht aktiven Records. Die wirkliche Archivtransaktion wird in S0 nicht implementiert.

## 5. Versionen, Projektionen und Hintergrundjobs

Regelversionen, Quellenentscheidungen und öffentliche Projektionen sind getrennte Referenzen. Ein neues `ev2_`-Original bleibt eine andere Beobachtung; eine identische Evidence-ID darf innerhalb eines gelesenen Records nicht verschiedene Provenienztupel bezeichnen. Dasselbe echte Original darf mehrere strukturierte Bedingungen tragen. Alle alten Versionen und verbrauchten Operationen müssen im späteren Store erhalten bleiben.

Der Transitionsplan beschreibt explizit `accept`, `withdraw`, `conflict`, `reaccept` und `recover`. CAS bindet erwartete Revision, erwarteten Status und exakte alte Versionsreferenz; die neue Revision erhöht sich um eins und besitzt eine neue Referenz. `accept` überschreibt keinen conflicted-/withdrawn-Pointer. Wiederannahme aus conflict benötigt Auflösungsreferenzen. Recovery verweist auf eine historische Version, erzeugt jedoch eine frische Version und verlangt aktuellen Reproof sowie tatsächliche Commitbestätigung. Die Datenhülle führt nichts davon aus; insbesondere fehlt weiterhin die konkrete autorisierte Transaktion.

Der Jobschlüssel enthält vollständigen V3-Kontext, Faktart und Methodenrevision. Unterschiedliche Besucher, Operation-IDs und `missing`-/`recheck_needed`-Gründe erzeugen dadurch keine parallelen aktiven Jobs für dieselbe Zelle. Der bestehende Research-Key hält den Recherchegrund separat fest. Lease-ID, Generation, Revision und Versuchslimit liefern den Anschluss für spätere Sperrung und Wiederaufnahme. Eine abgelaufene Lease bleibt lesbar; der Leser erwirbt oder verlängert sie nicht. Backoff, Erfolg und Erschöpfung bleiben unterschiedliche Records. Es gibt keine Exactly-once-Ausführungsbehauptung.

Jede öffentliche Antwort muss genau die angefragten Staatsangehörigkeitszellen enthalten. Jede Zelle enthält eigene accepted/pending/conflict/unavailable/error-Ergebnisse, einschließlich getrennt ungeklärter Optionen. Keine positive erste Zelle verdeckt eine zweite fehlende Zelle. Die accepted-Projektion trägt ihre exakte Regel-/Evidence-/Decision-/Methodenreferenz und strukturierte Bedingungen. `sourceCheckedAt` muss dem ursprünglichen Abrufzeitpunkt entsprechen; `builtAt` darf ihn nicht ersetzen. `expiresAt` darf die Quellenfrische nicht verlängern. Der Leser prüft Fristgrenzen exklusiv am Zeitpunkt und rechtliche Datumsintervalle inklusiv am getrennt übergebenen gesetzlichen Kalendertag. Eine amtliche Zeitzone wird nicht aus UTC erraten.

U1 muss zusätzlich die wirkliche aktuelle accepted Version und unverfälschte Projektion aus seinem gebundenen Lesepfad nachweisen. Ein späterer Rückzug invalidiert exakt die abhängigen Referenzen; ein Cache-Record oder ein mitgelieferter Status ersetzt diese Prüfung nicht. Kein Leser startet synchron Recherche. S0 misst kein öffentliches p95 und behauptet kein Cache-SLO.

**Pflichtanzeige der Quelle in U1:** Die Quellen-URL und der amtliche Name werden nicht als frei beschreibbare Proposal-/Response-Felder aufgenommen. U1 verwendet `resolveV3PublicSourceDisplay(projection.rule.subject.evidence.source, registry)` aus dem bereits geladenen, vom zuständigen Serverpfad gelieferten kanonischen Registry-Snapshot. Der Resolver verlangt einen eindeutigen aktuellen Content-/Representation-/Profil-Pin, prüft den gemeinsamen Authority-Snapshot über `contentRepresentationFromRegistry` und löst die URL über die bestehende Quellenregistry auf. Er liefert `publisherName`, `authorityName` und `href` zusammen mit dem exakten Pin. Der Lookup ist lokal und synchron und kann bereits beim vorberechneten Projektionsbau erfolgen; ein Miss startet im Antwortpfad keine Recherche. Fehlender oder geänderter Pin liefert einen Fehler statt einer geratenen Quelle. U1 muss dann den betroffenen öffentlichen Eintrag ehrlich als nicht verfügbar behandeln, bis Projektion und Registry wieder zusammenpassen. Dadurch gibt es keine zweite Quellenwahrheit und keinen stillen Wechsel auf die neueste fremde Publikationsversion.

## 6. Datenminimierung und geschlossene Grenzen

Der vorhandene bounded-JSON-Check begrenzt jede einzelne Eingabe auf 65.536 UTF-8-Bytes, Tiefe 16 und 8.192 Knoten. Neue Entscheidung, unmittelbarer Vorgänger und optionale Archivseite werden jeweils separat geprüft; es wird keine unbegrenzte historische Kette eingelesen. Getter, Zyklen, exotische Prototypen, nicht endliche Zahlen und nicht JSON-fähige Werte scheitern vor regulären Feldzugriffen. Zusätzlich gelten kleine fachliche Arraygrenzen und genaue Schlüsselallowlists. Persönliche Schlüssel und freie Text-/Bild-/Dateifelder werden abgewiesen. Quellenhinweise sind registrierte Identitätsreferenzen; ein Researcher kann keine freie Quellen-URL oder Rohseite einschmuggeln. Fehler nennen ausschließlich feste Gründe, niemals Werte, Feldpfade, Zod-Details oder Payloadausschnitte.

Die maximalen Größen sind technische Grenzen; ein zu großer Datensatz wird nicht abgeschnitten. Größere spätere Antworten benötigen eine gesondert geprüfte Zerlegung. Globale technische Kennungen sind keine Nutzer-, Trip- oder Sessionkennungen. Das Modul legt weder Datenbank noch Logs oder Rohdatenarchive an.

Das Testmaterial existiert ausschließlich in `contract.test.ts`, nennt fiktive `.example`-Quellen und ist als synthetisch gekennzeichnet. Öffentliche Testrecords müssen `SYNTHETIC_TEST_DATA_NO_TRAVEL_ADVICE` tragen. Es gibt keine exportierte Fixture-Datei und keinen produktiven Fallback.

Keine SQL-/DB-/Auth-/RLS-/ACL-/Credential-/Provider-/Scheduler-/Production-Aktion gehört zu S0. #917 wird weder wiederholt noch umformuliert, delegiert oder durch menschliche SQL-Ausführung ersetzt. #1131 bleibt STOP, #1135 bleibt separat. Die tatsächliche konkrete Methodenentscheidung und das vollständige Dev-/Aktivierungspaket bleiben eigene Owner-Gates.
