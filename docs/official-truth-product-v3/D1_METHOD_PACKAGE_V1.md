# Einreisebestimmungen V3 — konkrete Methode und Betriebsentwurf

**D1-METHOD-PACKAGE-1 / V1 / R0 — 9. November 2026.**

**Dokumentstatus: zur unabhängigen TL-Prüfung. Methodenstatus: NOT_APPROVED. Aktivierungspaket: NOT_RELEASE_READY.** Dieses Paket konkretisiert den späteren einmaligen Freigabegegenstand. Es aktiviert keine Quelle, Datenbank, Methode oder Production. [Auftrag](D1_TASK_V1.md), [Plan](D1_PLAN_V1.md), [maschinenlesbarer Methodenentwurf](D1_METHOD_DRAFT_V1.json) und [Quell-/Entscheidungsmanifest](D1_METHOD_MANIFEST_V1.json) gehören zusammen.

## 1. Was Sasa später einmal freigibt

Die Methode heißt `jetnity-destination-primary-ch-de-visa`, Revision 1. Jetnity soll innerhalb ihres nachgewiesenen Umfangs selbst recherchieren lassen, die Originalquellen selbst prüfen, Regeln speichern und vorbereitete Antworten ausliefern. **Eine klare qualifizierte amtliche Primärquelle des Ziellandes genügt.** Eine verfügbare unabhängige amtliche Gegenquelle wird berücksichtigt; ihr Fehlen allein stoppt die Veröffentlichung nicht. Ein echter vergleichbarer Widerspruch oder eine unklare Primärquelle sperrt die betroffene Aussage und erzeugt eine Eskalation. Routinefälle benötigen keinen Ownerklick.

Bereits entschieden sind CH→DE als Erstpfad, der anbieterneutrale Vorschlagseingang, mehrere getrennte Staatsangehörigkeitsantworten, Quellenstand/Version und keine Speicherung von Passnummern, MRZ oder Fotos. Diese Entscheidungen werden nicht nochmals angefragt. Ziel bleibt die vollständige Einreisefunktion; Revision 1 beginnt mit der konkret vorhandenen Visa-Faktfamilie. Andere Anforderungen werden nicht aus dieser einen Visaprüfung abgeleitet. [Produktvorgabe V3](../audits/official-truth-dev-package-1-2026-11-08/PRODUCT_TARGET_PLAN.md), [S0-Vertrag](S0_CONTRACT.md).

Vor einer Freigabe fehlen noch tatsächliche Quellenqualifikation, die Abbildung des engen Piloten auf globale Bedingungen, reale Dienst-/Speicheranschlüsse und das zielgebundene Dev-Paket. Der Owner soll deshalb **heute weder SQL ausführen noch ein unvollständiges Gesamtpaket genehmigen**. Die aktuelle S1/N1-Codearbeit wird dadurch nicht aufgehalten. [D0-Nachweisstand](D0_DEV_READINESS_DELTA_2026-11-09.md).

## 2. Exakte Basis und zulässiger Umfang

Die Quellbasis dieses Entwurfs ist der unveränderliche E1-Commit **`97629e9130a907b8b9b8072d06bda1956758aa6e`**, Tree **`8759d8a3e39143c84810c8cca1641c2c91cbdd66`**. Die neuen D1-Dokumente werden getrennt gepinnt; ihre Prüfung überträgt keinen früheren CI-PASS. Das Manifest enthält für jede verwendete Datei Commit, Pfad, Gitblob, Bytezahl und SHA256. S1/N1 befinden sich parallel in Umsetzung und gehören noch nicht zu diesen Codepins.

| Dimension | Tatsächlich vorhandener enger Kandidat | Konsequenz für Revision 1 |
|---|---|---|
| Ziel und Staatsangehörigkeit | Deutschland; genau eine CH-Staatsangehörigkeit je Regelzelle | Bei CH+weiterer Staatsangehörigkeit getrennte Zellen. Ein CH-Treffer beantwortet die andere Zelle nicht. |
| Fakt | `requirement_effect` für `visa`; der ruhende Kandidat enthält `not_required` / `visa_exempt` | Dies beschreibt Kandidatcode, **keine hier bestätigte heutige Einreiseauskunft**. Keine Aufenthaltsdauer, Arbeitserlaubnis, Passgültigkeit oder komplette Checkliste daraus ableiten. |
| Dokument | ausdrücklich verknüpfter CH-Reisepass; Pilot verlangt gewöhnlichen Pass | V3 fragt keine persönlichen Dokumentdaten ab. Eine spätere globale Antwort muss ihre Dokumentbedingung sichtbar tragen; Staatsangehörigkeit beweist keinen vorhandenen Pass. |
| Zweck und Route | Pilot verlangt ausdrücklich Tourismus und vollständige direkte CH→DE-Route ohne Transit | Keine stillen Defaults aus einer Länderabfrage. Globale Bedingungen müssen aus qualifiziertem Material verlustfrei abgebildet und angezeigt werden. |
| Datumsbereich | kompiliertes Anwendungsfenster 07.–13.11.2026; Trip-Start und -Ende darin | Kein gesetzlicher Gültigkeitszeitraum. Keine automatische Verlängerung und keine heutige allgemeine Abdeckung außerhalb dieses Piloten. |
| Rechtsgültigkeit | bei erkanntem vollständigem Body liefert der Kandidat `validFrom=null`, `validUntil=null` mit festem Semantikvertrag | Null behauptet keine unbegrenzte Gültigkeit. Erforderlich bleiben belegte Bedeutung der fehlenden Rechtsgrenzen, aktuelle Originale, technische Frische und der zulässige Kontext. |
| Dauer/Ausnahmen | der Kandidat liefert keinen `stay_limit`-Fakt und keinen allgemeinen Ausnahmekatalog | Keine erfundene „90-Tage“- oder sonstige Dauerangabe. Eine benötigte, unbewiesene Bedingung bleibt ungeklärt. |

Quellen: [AA-Reviewdaten](../../lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/reviewed-source.ts), [AA-Mapping](../../lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.ts), [Pilot-Requestprüfung](../../lib/readiness/official-truth-ch-de-first-visa-vertical-1/read-request.ts), [Tripbindung](../../lib/readiness/official-truth-accepted-store-trip-integration-1/trip-binding-server.ts).

### Konkrete noch fehlende Verbindung

Das AA-Mapping verlangt einen `travel_date`-Scope. Der V3-Globalvertrag erlaubt an dieser Stelle ausschließlich `validity.mode=not_applicable`; rechtliche Zeiträume liegen auf der Evidence, und Besucher geben kein Reisedatum ein. Der Kandidat kann deshalb nicht unverändert als globale V3-Quelle eingesteckt werden. Ebenso ist die Pilot-Erklärung `tourism` nicht automatisch das allgemeinere vorhandene Prädikat `travel_purpose=visitor`. Ein umbenanntes Feld, entfernter Date-Pin oder `conditions=unconditional` wäre keine korrekte Verbindung.

**Erforderlicher Code-/Fachnachweis:** ein eng versioniertes Mapping vom qualifizierten vollständigen Original auf genau unterstützte globale Bedingungen und Fakten, einschließlich Route, Passklasse, Zweck und gegebenenfalls ausdrücklich erforderlicher Dauer. Die tatsächliche Quelle entscheidet, welche Bedingungen gelten; dieses Dokument erzeugt keinen erfundenen Bedingungenbeleg. Nicht darstellbare oder nicht belegte Bedingungen ergeben `conditions_unresolved`. Ein erneuter allgemeiner Ownerentscheid über CH→DE ist dafür nicht nötig; geänderte konkrete Methode/Quellenzulassung muss im endgültigen Freigabepin sichtbar werden. [Globalvertrag](../../lib/readiness/official-truth-product-v3/contract.ts), [Bedingungsvertrag](../../lib/readiness/regulierungs-anwendbarkeit.ts).

## 3. Quellen qualifizieren und Originale prüfen

Die Pflichtquelle ist eine zuständige Behörde, Grenzpolizei oder Botschaft **des Ziellandes**. Bei einer Botschaft zählt der vertretene Staat. Ein offizieller Domainname, eine Datenbankrolle `official_authority` oder ein Researcher-Feld `destinationCountryCode=DE` allein genügt nicht.

Die geprüfte Quellenzulassung muss folgende Bindungen gemeinsam belegen:

1. zuständige staatliche Institution, vertretenes Zielland und Zuständigkeit für den konkreten Visa-Fakt;
2. vorhandene Source-/ContentItem-/Representation-/IdentityProfile-Identitäten samt Versionen und aktuellem Registryzustand;
3. zugelassene Abrufadresse, tatsächliche finale Herkunft, Medientyp, vollständige Antwort und servereigene Original-Custody;
4. vollständigen relevanten Bedeutungsgehalt einschließlich Qualifikationen, Fußnoten, Ausnahmen und Rechtsdaten;
5. tatsächlich ausgeführten aktuellen Extraktor mit genau diesem Original und nachvollziehbarer Fakt-/Kontextbindung;
6. aktuelle Methode, unveränderte History-/Konfliktkette und tatsächlichen Commit-/Reproof-Status.

Die vorhandene AA-Adresse und der Protocol2-Bodyhash `fc34bb51f8493a8776b6a300c8aed493a4a4fe08fba269148292ed7d9a334979` sind **bestehende Kandidatpins**. In D1 wurde die Website nicht abgerufen. Der Extraktor `otx_aa_ch_de_visa`, Version 1, bleibt `current=false`; der Produktions-Extraktorkatalog und die Anwendungskontrakte bleiben leer. Ein geänderter Body ist Anlass zur erneuten strukturierten Prüfung, kein Beleg einer Rechtsänderung und kein Anlass, einen Pin automatisch als weiterhin fachlich gültig umzuschreiben. [Mapping](../../lib/readiness/official-truth-ch-de-aa-visa-mapping-candidate-1/mapping.ts), [Extraktorkatalog](../../lib/readiness/official-truth-trusted-fact-extractor-registry.ts), [Anwendungskontrakte](../../lib/readiness/official-truth-ch-de-application-pilot-1/contract-server.ts).

### Endliche optionale Gegenprüfung

Versuchsplan 1 betrachtet höchstens **zwei bereits qualifizierte, unabhängige amtliche Veröffentlichungen** für dieselbe Zelle. Fachliche Auswahlreihenfolge als Vorschlag: eine passende EDA-Veröffentlichung für Schweizer Reisende, danach eine andere unabhängige amtliche Veröffentlichung, sofern sie tatsächlich denselben Kontext behandelt. Eine FCDO-Seite für britische Staatsangehörige wäre für CH nicht automatisch vergleichbar. Namen dieser Institutionen sind keine bereits registrierten Quellenpins und garantieren keine passende Aussage.

Spiegel, Übersetzungen und Kopien derselben Veröffentlichung zählen nicht als unabhängige Quelle. Es wird keine erschöpfende Suche des gesamten Internets verlangt. Sind keine passenden zugelassenen Gegenquellen vorhanden, wird die tatsächliche endliche Suche mit `not_found` dokumentiert. Unversuchte oder nur alte Quellen erhalten keinen erfundenen Abrufzeitpunkt. Ein geplantes begrenztes Abrufversagen heißt `unreachable`; alte Inhalte werden nicht als frisch bestätigt ausgegeben. Der verpflichtende Gegenprüfungsrecord ist eine Prüfspur, **keine zweite Pflichtstütze**. [S0-Entscheidungsreader](../../lib/readiness/official-truth-product-v3/contract.ts), [I1-Schnittstelle](I1_INTERFACE.md).

## 4. Deterministische Entscheidungsregeln

| Tatsächlicher Befund | Neue Veröffentlichung | Prüfspur / nächste Aktion |
|---|---|---|
| Pflichtquelle eindeutig, qualifiziert, aktuell; keine passende Gegenquelle gefunden | automatisch zulässig nach normalen Commit-/Authority-Gates | `not_found`; keine Owner-Einzelfreigabe |
| Pflichtquelle eindeutig; optionale Quelle unerreichbar, selbst unklar oder nicht anwendbar | automatisch zulässig, soweit kein bekannter echter Konflikt offen ist | ehrliches `unreachable`, `unclear` oder `not_applicable`; begrenzte spätere Wiederprüfung |
| Unabhängige vergleichbare Gegenquelle stimmt exakt überein | automatisch zulässig | `agrees`, beide echten Evidence-Referenzen |
| Aussagen unterscheiden sich sprachlich/strukturell, sind nach genehmigter Vergleichsmethode vereinbar | automatisch zulässig | `compatible` plus methodengebundener Vergleichsbeleg; bloßes Sprachmodellurteil genügt nicht |
| Andere Staatsangehörigkeit, Dokumentart, Voraussetzungen oder nicht überlappende Gültigkeit | kein automatischer Widerspruch und keine Zustimmung | `not_comparable`; getrennte Kontexte erhalten |
| Unvereinbare Aussagen zum gleichen Fakt bei vergleichbaren Bedingungen und überlappender Rechtsgültigkeit | **sperren und eskalieren** | `comparable_conflict`, vollständige beidseitige Evidence und deduplizierter Eskalationsschlüssel |
| Pflichtquelle unklar, unqualifiziert, fehlend oder Rechtsgültigkeit nicht belastbar | **keine neue Freigabe; eskalieren**, soweit der fachliche Befund belegt ist | `primary_unclear`; technische Nichtverfügbarkeit nicht als amtlicher Widerspruch umdeuten |
| Quelle eindeutig, aber erforderliche globale Bedingungen ungeklärt | keine neue Freigabe | `conditions_unresolved`; fachliche Mappingarbeit statt persönlichem Fragebogen |
| Früherer echter Konflikt ist noch ungelöst, Gegenquelle heute nicht erreichbar | weiterhin gesperrt | Konflikt bleibt in voller History wirksam; Abwesenheit löscht ihn nicht |
| Früherer Konflikt ist mit neuen positiven, methodengültigen Belegen aufgelöst | neue geprüfte Version möglich | Auflösungsreferenz, Vorgänger und exakter Archivappend; kein Umschalten alter Versionsbytes |
| Methode widerrufen, Quelle/Proof abgelaufen, Head geändert oder Commit unbestätigt | keine aktuelle positive Ausgabe | getrennt unavailable/expired/unconfirmed; dieselbe Operation bestätigen statt blind erneut schreiben |

Die Methode verwendet weder Mehrheitsvotum noch pauschalen Vorrang der Pflichtquelle gegen einen bekannten echten Widerspruch. Unterschied allein ist noch kein Rechtskonflikt; die Vergleichbarkeit und Unvereinbarkeit benötigen den methodengebundenen Nachweis. Der vorhandene S0-Reader prüft Formen und innere Beziehungen, nicht die tatsächliche externe Herkunft oder eine allgemeine juristische Interpretation. [S0](S0_CONTRACT.md), [I1](I1_INTERFACE.md), [M1](M1_CONTRACT.md).

Auch Sasas Kenntnisnahme oder Kommentar ersetzt keinen positiven Auflösungsbeleg. Eine notwendige Änderung der konkreten Vergleichsmethode wird versioniert und separat nachvollziehbar genehmigt; ein Klick darf keine widersprüchliche Quellenlage in eine eindeutige amtliche Aussage umwandeln.

## 5. Betriebsparameter — konkrete Kandidaten, noch nicht genehmigt

Diese Werte sind ein **konservativer erster Prüfkandidat**, keine laufende Konfiguration, gemessene Kapazität oder Quellenquote. Sie ersetzen die frühere unbeschlossene Empfehlung „stündlich /24h“. Technische Grenzen dürfen nur kürzer werden, wenn eine bestehende Quellen-/Custody-/Methodenbindung dies verlangt.

| Parameter | D1-Kandidat | Begründung / Abnahme |
|---|---:|---|
| Pflichtquellen-Maximalalter | **300 s** ab tatsächlichem Originalabruf | bewahrt auch die kürzere vorhandene Trip-Store-Obergrenze; niemals ab Cachebau neu starten |
| Geplante Pflichtquellenprüfung | **alle 120 s** je zugelassener Publikation | lässt vor 300 s einen begrenzten Ausfallpuffer; echte Quelllimits/Budget und Laufzeit vorher belegen |
| Optionale Gegenprüfung | höchstens 2 Versuche, zusammen 8000 ms, je einzelner Abruf höchstens 4000 ms | endlicher Plan; fehlende optionale Quelle allein stoppt die klare Pflichtquelle nicht |
| S0-Versuchsplan | Revision 1 | Änderungen sind versioniert, keine vom Researcher gelieferten Quoten |
| Pflichtquellen-Abrufbudget | höchstens 10000 ms und immer kürzer, falls bestehender Transport dies verlangt | vollständig innerhalb des vorhandenen I1-Aufrufbudgets; Hänger führen zu Nichtverfügbarkeit |
| Import-Aufruf | höchstens vorhandene 30000 ms | keine Verlängerung des Codes durch D1; gesamte aktuelle Proof-/History-/Methodenprüfung muss hineinpassen |
| Public-Projection-Kandidat | höchstens 60 s; Erneuerungsprüfung nach 30 s | nur aus weiterhin gültiger aktueller akzeptierter Version; Originalzeit bleibt unverändert, Ablauf nie hinter Quellen-/Methoden-/Proofende |
| Hintergrundversuche nach sicher bestätigtem Fehlschlag | insgesamt 3; Backoff 15 s, danach 30 s; maximal 60 s | innerhalb bestehender M1-Grenzen; unklarer Commit löst nur Same-operation-Confirm aus |
| Gleichzeitige Arbeit | maximal 1 aktiver Abruf je Publikation und 1 aktiver Job je identischer Regel-/Methodenzelle | Deduplizierung über den echten gemeinsamen Store; mehrere Besucher erzeugen keine Abruflawine |
| Öffentliche Antwort | p95<1000 ms über den tatsächlichen bereitgestellten Antwortpfad | bestehendes U1-Serverbudget 750 ms bleibt; Netzwerk-/Renderanteil gesondert messen |

**Unveränderte harte Obergrenzen:** `OFFICIAL_CHECKED_AT_MAX_AGE_MS=3600000` in der kanonischen Frische bleibt bestehen. Die vorhandene Tripbindung hat zusätzlich `sourceMaxAgeSeconds≤300`, `retentionSeconds≤3600` und `displaySeconds≤15`. Der vorgeschlagene öffentliche 60 s-Projektionspfad ist ein anderer noch zu bindender Pfad; er verlängert **keine** 15 s-Tripanzeige. Sobald ein neuer Adapter eine strengere bestehende Bindung wiederverwendet, gilt deren kürzere Grenze. Passt ein Betriebsintervall dazu nicht, muss der Start verweigert werden; eine Frist wird nicht automatisch angehoben. [Kanonische Frische](../../lib/readiness/official.ts), [Trip-Wire-Bounds](../../lib/readiness/official-truth-accepted-store-trip-integration-1/wire.ts), [U1](U1_CONTRACT.md).

### Zeitbedeutung und Ausfall

Rechtsgültigkeit beantwortet, wann eine Regel rechtlich gilt. Evidenzalter bezeichnet den echten Quellenabruf. Native Proof-/Custody-Fristen begrenzen die technische Benutzbarkeit. `builtAt` bezeichnet nur die Projektion. Der Schedulerzeitpunkt ist weder Rechtsdatum noch Abrufdatum. Für den DE-Erstpfad ist der konkrete Betriebsvorschlag: rechtlichen Prüftag aus einem servereigenen Kalender für `Europe/Berlin` ableiten und getrennt von UTC-Zeit speichern; die tatsächliche Calendar-/DST-Bindung ist noch zu testen. Der S0-Vertrag verlangt diesen Tag ausdrücklich und leitet ihn nicht still aus UTC ab.

Ein vorübergehender Abrufausfall darf eine bereits akzeptierte Version nur bis zu ihrer unveränderten tatsächlichen Frist weiter benutzbar lassen. Danach keine positive Aussage aus altem Cache. Bekannter Konflikt oder Widerruf sperrt sofort am aktuellen gemeinsamen Lesepunkt. Ein neuer Cachebau oder ein HTTP304 allein verlängert ohne vollständigen zugelassenen Original-/Reproof-Weg keine Frische. Bei Rücksprung der Uhr, widersprüchlichen Zeiten oder unbestätigter Schreibantwort bleibt das Ergebnis unbestätigt.

### Kosten- und Lastprüfung vor Aktivierung

120 s entspricht rechnerisch **720 geplanten Pflichtprüfungen pro 24 h** für eine Publikation. Mit zwei optionalen Abrufen je Durchlauf sind es höchstens 2160 geplante Quellenversuche pro 24 h vor zusätzlichen Retries. Drei Versuche pro planmäßigem Job ergäben im ungünstigen Plan höchstens 6480 Abrufstarts. Das sind **rechnerische Obergrenzen**, keine gemessenen Requests, genehmigten Source-Raten oder Geldkosten.

Vorschlag für den ersten zugelassenen Betrieb: hartes gemeinsames Tageslimit 2160 Quellenstarts, alle Retries darin eingeschlossen, Reservierung vor Abruf, maximal 1 laufender Abruf je Publikation. Planmäßige Primärprüfung hat Vorrang vor optionalen Wiederholungen. Reicht das Limit oder eine tatsächliche Quellenquote nicht, wird Arbeit begrenzt und vorhandene Frische läuft unverändert ab; optionale Fehler erzeugen keine zweite Pflichtquelle. Der Start erfordert ein konsistentes Scheduling-/Quota-Modell und gemessene Dienstlatenzen. Quellenregistrierung und Quelleneigene Regeln können kleinere Limits verlangen.

Bezahlte Recherche-/Modellaufrufe bleiben **0 freigegeben**, bis ein konkreter zugelassener Anbieter mit echten Preisen, Budgetreservierung und Kill-Switch gebunden ist. Researcher können jetzt den neutralen Dateivertrag bedienen; dessen Existenz ist keine Rechnung oder Anbieteraktivierung. Vor dem einmaligen Ownerentscheid werden tatsächliche Kosten pro erfolgreichem Refresh, DB-/Storage-/Egressverbrauch, Wachstum mit Ländern und der Monatspreis ausgewiesen. Die bestehende besondere Kostenfreigabe wird nicht durch eine erfundene Kostenangabe ersetzt.

## 6. Eskalation und Aufbewahrung

### Vorgeschlagener erster Zustellweg

Empfehlung ist eine **geschützte Jetnity-Admin-Inbox** mit Zustellung aus der dauerhaften Eskalationsoutbox. Sie enthält nur Regelkontext, betroffene Versionen, amtliche Referenzen, Grund und Prüfstatus. Keine Besucher-/Trip-/Passdaten. Eine bestätigte Inbox-Einfügung gilt als technische Zustellung; das spätere Öffnen/Bestätigen durch Sasa ist ein eigener `seen`-Zustand. Beides ist keine fachliche Konfliktauflösung.

Betriebskandidat: erster Zustellversuch innerhalb 60 s, höchstens 3 Versuche mit 15 s/30 s Backoff; derselbe Eskalationsschlüssel verhindert doppelte Fälle. Unklare Zustellung wird anhand derselben Operation geklärt. Ein Zustellfehler bleibt sichtbar und die betroffene Regel gesperrt; es gibt keinen Freigabe-Fallback. Für einen neuen qualifizierten Kontextwechsel oder neuen Konflikt entsteht ein eigener versionierter Fall. Routine-`not_found` einer optionalen Quelle erzeugt keine Ownerbenachrichtigung.

Die vorhandene E1-Schnittstelle schreibt nur einen Outboxauftrag; **weder eine reale Inbox noch eine echte Benachrichtigungszustellung ist damit schon implementiert**. Dieser vorgeschlagene Kanal kann zusammen mit der Methode einmal bestätigt werden. Eine zusätzliche E-Mail-/Push-Anbindung erfordert konkrete Zustelladresse/Providerfreigabe und ist heute nicht aktiviert oder versendet. [E1-Portgrenzen](../../lib/readiness/official-truth-product-v3/integration/ports.ts).

### Vorgeschlagene Retention, getrennt nach Datenklasse

| Datenklasse | Konkreter Vorschlag | Schutz gegen falsche Wiederverwendung |
|---|---|---|
| Personenbezogene Besucherdokumente | keine Speicherung im V3-Vertrag | keine Passnummern/MRZ/Fotos, Nutzer-/Trip-/Sessionfelder oder freien Texte im Proposal |
| Offizielle Raw-Originale | ausschließlich bestehende konkret genehmigte Source-/Custodyfristen, im wiederverwendeten Tripvertrag höchstens 3600 s | D1 verlängert keine Retention. Ohne erhaltenes Original/Custody kein historischer Re-Extraktionsnachweis. |
| Zulässige untrusted Proposal-Bytes | Vorschlag 7 Tage nach tatsächlich terminalem Importzustand | Löschung nur nach bewiesener Entkopplung aller Retry-/Confirm-/Auditabhängigkeiten; niemals offene oder unbestätigte Operationen still entfernen |
| Minimierte Audit-/Entscheidungsmetadaten | Vorschlag 365 Tage für abgeschlossene, vollständig entkoppelte Historie | Originalhash ist kein Ersatz für Originale; fehlende historische Reproduzierbarkeit ausdrücklich erhalten |
| Aktueller Head, aktive Konflikte und benötigte Replay-/Idempotenzbindung | solange sie noch wirksam oder für einen erlaubten Confirm/Retry nötig sind | keine automatische TTL, die alte Operationen wieder wie neue erscheinen lässt oder ungelöste Konflikte löscht |

Diese Retention ist noch zu genehmigen und durch einen echten Dependency-/Löschtest umzusetzen. S1 wird nicht bereits eine überprüfte Löschautomatik zugeschrieben. Für offene langfristige Fälle sind Quoten/Alarmierung und eine kontrollierte Schließung erforderlich; eine unendliche unbemerkte Warteschlange ist kein Betriebsmodell. Nach Ablauf von Original-Custody kann eine Metadatenhistorie von 365 Tagen die damalige Quelle nicht erneut extrahieren. Recovery braucht dann einen neuen vollständigen gültigen Abruf und eine neue Version. Die Quellenrechte und tatsächlichen Restore-/Schlüsselbedingungen bleiben im Dev-/Aktivierungspaket nachzuweisen.

## 7. Commit, Versionshistorie und Recovery

Researcher liefern untrusted Vorschläge über denselben begrenzten UTF-8-Vertrag. Der Jetnity-Intake bindet unveränderte Bytes an servereigene Operation/Job/Kontext/Methode. Quarantäne-`completed/prepared` bestätigt lediglich einen Importversuch. Es bedeutet ausdrücklich `not_committed` und `required_before_commit`. Reale Job-/Quellen-/Methoden-/History-/Accepted-Store-Nachweise bleiben getrennt erforderlich. [I1](I1_INTERFACE.md), [E1](E1_CONTRACT.md).

Der aktuelle Methodenentscheid wird bei Annahme und am endgültigen atomaren Commit-/Cache-Lesepunkt erneut geprüft. Ein Widerruf sperrt neue positive Antworten. Die Registry ist weiterhin die eine Source-Registry; Accepted Store und Konflikthistorie werden nicht durch ein zweites Dateimanifest ersetzt. Menschliche Methodenverwaltung verwendet nach wirksamer #1139-Korrektur die echte eigene aktive Owner-/AAL2-/Konto-/Sessionprüfung. Der Maschinenimport erhält später eine enge eigene Dienstautorität; keine simulierte menschliche Session und kein pauschaler Service-Key gelten als Methode.

Bei fachlichem Fehler zuerst betroffene aktuelle Projektion sperren und Kill-Switch/Methodenwiderruf am gemeinsamen Autoritätspunkt prüfen. Historische Versionsbytes bleiben unverändert. Die Wiederherstellung erzeugt **eine neue geprüfte Version**, mit Vorgänger, vollständiger Konflikt-/Archivbindung, aktuellen Originalen/Methodenbelegen und bestätigt atomarem Commit. Ein historisch vorbereiteter Quarantänereplay ist kein frischer Accept. Verlorene Antwort nur über dieselbe Operation bestätigen. Danach vorberechnete Projektionen unter neuer Versionsreferenz veröffentlichen und unabhängig lesen. [M1-Recovery](../../lib/readiness/official-truth-product-v3/monitor/recovery.ts), [E1-Publikationsport](../../lib/readiness/official-truth-product-v3/integration/ports.ts).

Ruhenden Code zurückzunehmen ist ein normaler Code-Revert. Das ist **kein** Datenbank-/ACL-/Auth-Rollback. #1139 benötigt eigene echte Vorherdefinitionen, Rechte, Restorepunkt und getestete kompensierende Änderung; die vorhandenen 13+4 DDL-Operationen in zwei Transaktionen bilden keinen gemeinsam atomaren Apply/Rollback. [Dev-Paket](../audits/official-truth-dev-package-1-2026-11-08/DEV_PACKAGE.md), [Nachprüfung/Recovery](../audits/official-truth-dev-package-1-2026-11-08/POSTCHECK_AND_RECOVERY.md).

## 8. Prüffälle vor dem einmaligen Methodenentscheid

Die bestehenden V3-Tests sind Code-/synthetische Evidence. D1 führt keinen realen Quellenlauf, Hosted-Piloten oder Live-Lasttest aus. Für die genaue freizugebende Methode sind folgende Gegenproben mit tatsächlichen Anschlüssen zu dokumentieren:

| Gruppe | Erforderlicher Nachweis |
|---|---|
| Quellenregel | klare qualifizierte Pflichtquelle ohne zweite Quelle veröffentlicht; fehlende/unklare/unerreichbare optionale Quelle allein blockiert nicht |
| Herkunft | falsche Ziellandzuständigkeit, Spiegelquelle, unvollständiges Original und geänderte Footnote/Body werden nicht still angenommen |
| Kontext | CH- und andere Staatsangehörigkeitszellen bleiben getrennt; Tourismus/Passklasse/Route/Gültigkeit gehen nicht beim Pilot→Global-Mapping verloren |
| Konflikt | echter vergleichbarer Widerspruch sperrt; anderer Kontext ist kein erfundener Konflikt; ungelöster Konflikt überlebt Ausfall und Neustart |
| Auflösung/Recovery | nur positiver methodengültiger Auflösungsbeleg; vollständiger Vorgänger/Archivappend; neue Version statt Änderung der Vergangenheit |
| Zeit |300 s-Grenze, jeweils strengere tatsächliche Bound, legaler Tageswechsel/DST, Uhrsprung, Quellen-/Methodenablauf während Sperre/letztem Await |
| Persistenz | Neustart, zwei konkurrierende Worker, Reclaim, veraltetes Ticket, verlorene Commitantwort und Same-operation-Confirm; vollständiger Outcome-Read |
| Öffentliche Ausgabe | Quelle, ursprünglicher Stand und Version; nur vorberechnete angenommene Projektion; „wird geprüft“ erst bei bestätigtem aktuellem Job; kein Fake-Empty bei Fehler |
| Betrieb | echte Delivery-ACKs gegenüber `seen`, Quota vor Abruf, Kill-Switch, Retries innerhalb Tageslimit, getestete Retention-Abhängigkeiten |
| Leistung/Kosten | p95 am tatsächlichen bereitgestellten Pfad unter 1 s, Kalt-/Warmfälle getrennt; echte Herkunft/Frische bleiben erhalten; keine Übertragung des synthetischen Prozessbenchmarks |

Als konkreter Messplan werden pro warmem Cachepfad 1000 Abfragen und pro getrennt dokumentiertem Kaltstartszenario 100 Abfragen vorgeschlagen, zunächst mit isolierten synthetischen Daten ohne Provider-/Hostedkosten. Netzwerk, Server und Render werden getrennt erfasst; die Messung nutzt keine erfundenen amtlichen Antworten. Ein späterer realer Deploy-Test wird erst im ausdrücklich genehmigten Ziel durchgeführt. Diese Stichproben sind noch nicht ausgeführt und ersetzen keine Belastungsgrenzen für beliebige weltweite Last.

## 9. #917/#1139: unveränderte tatsächliche Abnahmegrenze

**Stage1 #917:** APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING; Ledger-ID UNKNOWN; Stage2 NOT_ATTEMPTED. Die fehlenden alten Ownerbelege sind dokumentiert und werden nicht erneut verlangt. Der vorhandene Run2 liefert akzeptierte selektive Metadaten-/Fingerprint-Teilbelege, keinen vollständigen aktuellen Ledger-/Auth-/Zielnachweis. **#1139:** OPEN / P1 EFFECTIVE FIX NOT ACCEPTED; Dev-Paket NOT_RELEASE_READY. [Stage1-Bericht](../audits/official-truth-dev-package-1-2026-11-08/STAGE1_ACCEPTANCE_REPORT.md), [D0-Nachtrag](D0_DEV_READINESS_DELTA_2026-11-09.md).

Die 17 vollständigen Vor-Owner-Lücken bleiben: **E01, E04, E06, E07, E09, E10, E11, E13, E15, E16, E17, E18, E21, E22, E24, E25, E28.** Das Manifest übernimmt ihre Gegenstände, verbleibenden Lücken und Kriterien verlustfrei aus der eingefrorenen Matrix; D1 schließt keine davon. Die Erwartung späterer Post-Apply-Ergebnisse ist davon getrennt. [Zielmatrix](../audits/official-truth-dev-package-1-2026-11-08/TARGET_EVIDENCE_MATRIX.json).

Die konkret verweigerte #917-Nachprüfung wird nicht wiederholt, umformuliert, delegiert oder über eine andere Verbindung bzw. menschlichen Ersatzoperator versucht. Ein Methodenentwurf ist keine Aufhebung dieser Plattformgrenze. #1131 Ready-STOP, #1135-Abgrenzung, #968-Previewziel und #911/#913 bleiben eigenständig. Offene reale Zielgates verhindern keine bereits autorisierte lokale Code-/Testarbeit.

## 10. Späterer einmaliger Freigabetext und nächster Schritt

**Vorbereitete Formulierung, heute nicht zur Freigabe vorgelegt:**

> Ich genehmige die im endgültigen Paket exakt gepinnte Methode `jetnity-destination-primary-ch-de-visa`, Revision 1, für den dort vollständig belegten CH→DE-Visaumfang. Jetnity veröffentlicht Routinefälle selbstständig nach einer klaren qualifizierten amtlichen Ziellandquelle, prüft verfügbare unabhängige amtliche Gegenquellen und sperrt/eskaliert echte vergleichbare Widersprüche oder unklare Pflichtquellen. Die konkret geprüften Betriebs-, Zustell-, Retention- und Kostenparameter sowie Widerruf/Recovery gehören zur Freigabe. Die separate Dev-/Production-Ausführung bezieht sich ausschließlich auf die dort ausdrücklich bezeichneten Ziele und Artefakte.

Vor diesem einen Entscheid liefert TL die tatsächlichen fehlenden Nachweise und aktualisiert den finalen Dokument-/Code-/Policy-Pin. **Die heutigen Candidatewerte sind noch keine Betriebsfreigabe.** Die Empfehlung für Zustellung ist die geschützte Admin-Inbox; Retention wird mit den getrennten Datenklassen oben vorgelegt. Der Owner entscheidet diese konkreten Vorschläge zusammen mit der fertigen Methode, nicht jede Regel und nicht erneut den bereits beschlossenen Erstpfad.

**Erster technischer Anschluss:** S1 speichert echte Proposalbytes und vollständige Importausgänge; N1 speist denselben Intake. Danach müssen reale Job-/Original-/Methoden-/Accepted-/Cacheanschlüsse und das enge globale AA-Bedingungsmapping geprüft verbunden werden. Das Dev-Paket wird erst nach tatsächlicher zulässiger Ziel-/Recoverybindung zur Ausführung vorgelegt. D1 fügt dafür keinen weiteren pauschalen Zustimmungsstopp hinzu.
