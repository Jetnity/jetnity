# Tatsächlicher Dev-Neustarttest des HTTP-ID-Zählers

## Entscheidung und Umfang

**PASS für einen normalen Datenbankneustart:** Der neue eigene LOGGED-Zähler überstand den tatsächlich ausgelösten Supabase-„Fast database reboot“ unverändert bei **1826/called**. Der erste anschließend beobachtete natürliche HTTP-Aufruf erhielt **1827**, lieferte **HTTP 200** und besaß genau eine gebundene Response. Nach dem Neustart lief BG1 vollständig erfolgreich; der unabhängige Readback bestätigte `current` und den exakten v8-Katalog.

Ziel war ausschließlich Dev **`yfvbxvijcorffwxbxahl` / develop PREVIEW**. Der Owner hatte diesen Neustarttest ausdrücklich beauftragt. Die bestehende angemeldete Sitzung wurde verwendet; kein erneuter Login oder 2FA-Schritt und keine neue Kostenbeauftragung. **Production wurde weder aufgerufen noch verändert.** Die nächste HTTP-Aktion stammte aus dem vorhandenen normalen Betrieb; es gab keinen manuellen HTTP-, Quellen-, Audit-, Collector-, Seal- oder Publisheraufruf für diese Probe.

Dieser Nachweis gilt für einen kontrollierten normalen Datenbankneustart. **Crash, Failover und Restore wurden nicht geprüft.** Eine überstandene saubere Abschaltung ist kein experimenteller Nachweis des Verhaltens bei unsauberem Ausfall. Verwaltete Queue und Responses bleiben UNLOGGED; eine verlustfreie Transportzustellung bei Crash wird nicht zugesagt.

## Tatsächliche zeitliche Belegkette

Alle Zeiten am 21.11.2026; Zürich = UTC + 1 Stunde.

| Schritt | UTC | Zürich | Tatsächlicher Befund |
| --- | --- | --- | --- |
| Bereitschaftsprüfung | 15:55:12.443041 | 16:55:12 | Dev erreichbar, BG1 current, Queue leer, keine anderen aktiven Clientabfragen. |
| Unmittelbarer Vorher-Snapshot | 15:57:15.851678 | 16:57:15 | Eigene Sequenz 1826/called; historisches Maximum aller 16 ID-Pfade 1826; nächster neuer Wert mindestens 1827. Queue leer, keine Queue-Warter oder Transaktionen älter als 30 Sekunden. |
| Alte Serverstartzeit | 13:01:42.863753 | 14:01:42 | Vom Vorher-Snapshot gelesen. |
| Tatsächlicher neuer Serverstart | **15:57:38.734531** | **16:57:38** | Nach Dashboard-Aktion „Restart database“; UI erst „Restarting“, anschließend „Healthy“. |
| Unmittelbarer Nachher-Snapshot | 15:58:12.822035 | 16:58:12 | Eigene Sequenz exakt 1826/called; alle 16 ID-Ledger exakt; Katalog, Fakten, Originale und Owner-Belege erhalten. |
| Natürlicher neuer Request | **16:00:00.320515** | **17:00:00** | Request 1827 in `jetnity_source_dispatch_private.requests_v1`, Quelle `ES:eu-schengen-common-check`. |
| Tatsächliche HTTP-Antwort | **16:00:00.323704** | **17:00:00** | ID1827, HTTP200, kein Timeout/Fehler, genau eine Response, 323735 UTF-8-Bytes. |
| Unabhängiger Transport-Readback | 16:01:13.149162 | 17:01:13 | Eigene Sequenz nun 1827/called und die tatsächliche Antwort vorhanden. |
| Vollbeleg-/Cron-Readback | **16:02:11.315318** | **17:02:11** | BG1 current, v8 exakt, vollständige Generation2085 und erfolgreicher passender Cronlauf20931. |
| Bindungs-/Nachtragsprüfung | 16:03:26.910017 / 16:06:57.618791 | 17:03:26 / 17:06:57 | Neuer Request gebunden; zusätzlicher Collector-Nachtrag zu vorheriger ID1826 separat erklärt und alter ID-Bestand exakt bestätigt. |

Die [unveränderte Snapshot-Leseabfrage](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-http-id-restart.SNAPSHOT-READONLY.sql) wurde vor und nach dem Neustart ausgeführt. [Vorher-Beleg](evidence/official-truth-bmeia-restart-20261121/dev-restart-before.json), [unmittelbarer Nachher-Beleg](evidence/official-truth-bmeia-restart-20261121/dev-restart-immediate-after.json) und [vollständiger Folgebeleg](evidence/official-truth-bmeia-restart-20261121/dev-restart-natural-proof.json) enthalten die tatsächlichen Datenbankantworten und die beobachteten UI-Zuordnungen. Die final gebundene [Folge-Leseabfrage](../scripts/db/official-truth-chde-at-renewal-dev-20261121/dev-http-id-restart.NATURAL-PROOF-READONLY.sql) enthält die echten Vorher-Werte; sie erzeugt keine Requests.

## Erhaltene Definitionen, Rechte und Originale

| Objekt oder Beleg | Vorher / unmittelbar nachher |
| --- | --- |
| Eigene Sequenz | `jetnity_pgnet_allocator_private.http_request_id_v1`; Owner postgres, LOGGED (`relpersistence=p`), BIGINT, Schritt1, Cache1, kein Cycle, private ACL `{postgres=rwU/postgres}`; Wert1826/called exakt. |
| Eigene Sequenzidentität | OID und relfilenode99472 erhalten; kein Drop/Recreate oder Rücksetzen. |
| Verwaltete Altsequenz | 109/called vor und unmittelbar nach sauberem Neustart. Dieser saubere Neustart löste auch dort keinen Reset aus. |
| v8-Baseline-SHA | `0d70655bb01ab4e1516149886e1abaeff913012ebbd17b6d643848e48ed3ab87` |
| v8-Katalog-SHA | `12b69d7dec44160e611a01bedd87feaf6a17669b3f1f53b45f27239a71e3e83a`; gespeichert = tatsächlich, vor und nach Neustart. |
| Helper und Queue-Trigger | Definition, Owner, ACL, Suchpfad, Triggerbindung und Aktivierungsart exakt erhalten. |
| Weitere Schutzbindungen | v7-Baseline, Publisherdefinition und Cron-Konfiguration exakt erhalten. |
| Faktenhistorie | 71 Zeilen; SHA `fefe812a3062bd05a84d08cc4d4ae71334cdee35f84df4c8f5eab3fca8bf2b38` unverändert. |
| Owner-Operationshistorie | 14 Zeilen; SHA `450fdb06e553545f080c577f8b09ddb63e14fefcce73c4865e60ff8e03add95b` unverändert. Dies ersetzt nicht den früheren speziellen 7/7-Cycle5-Quittungsnachweis. |
| Drei AT-Originale | Vorher-/Nachher-Metadaten und tatsächliche Bytes-/Hashbindungen exakt erhalten; keine Qualifikation oder Veröffentlichung. |
| 16 erfasste ID-Ledger | Unmittelbar nach Neustart je Pfad Zahl, Maximum und geordnetes ID-Multiset-Digest exakt erhalten; darunter 14 persistente und 2 verwaltete UNLOGGED-Pfade. |

## Natürlicher Folgelauf und vollständiger BG1-Beweis

Die erste beobachtete neue ID **1827** lag über dem unmittelbar vor Neustart gelesenen Gesamtmaximum **1826**. Sie findet sich im dauerhaften Source-Dispatch-Request und in genau einer tatsächlichen HTTP-Response nach Serverstart. Antwort-SHA:

`236810bd82f23e650435583afe2f065020dc093ff4669747e6801edd9df0b277`

BG1-Generation **2085**, due **16:00 UTC**, besitzt einen vollständigen Beleg von **16:00:00.159503 bis 16:00:08.626320 UTC**. Der reguläre Job **2**, `jetnity-official-truth-dev-guard-v1`, lief als Cronrun **20931** erfolgreich von **16:00:00.143433 bis 16:00:08.632678 UTC**. Der Beleg liegt vollständig in diesem Intervall. Job und Run liefen als postgres in derselben Datenbank; aktueller und ausgeführter Command stimmen exakt mit dem fest erwarteten Audit-Command überein. Dieser wurde nur verglichen, nicht manuell aufgerufen. Sein SHA ist vor und nach Neustart:

`8ae86f70caca6fcf890eb66de93873b0f13c49bd689e8c8cd6993c4bef561863`

Der natürliche Folge-Request betrifft eine bestehende ES-Quellenprüfung. Er belegt den globalen ID-Allocator nach Neustart; **er ist keine AT-Erneuerung und keine positive fachliche Quellenqualifikation**. Ein zusätzlicher künstlicher AT-Aufruf war hierfür nicht erforderlich.

## Erklärte Collector-Ergänzung statt stiller Ausnahme

Ein erster lokaler Vergleich der 14 dauerhaften ID-Präfixe nach dem normalen Cronlauf meldete eine Abweichung: `jetnity_source_dispatch_private.observations_v1` hatte unterhalb einschließlich1826 jetzt **138 statt137** IDs. Die ursprüngliche Abweichung bleibt im strukturierten Beleg erhalten; sie war kein Datenbankfehler. Alle anderen13 dauerhaften Präfixe stimmten exakt.

Die eng begrenzte Leseprüfung belegt genau eine nachträgliche Beobachtung zu **1826**, gesammelt **16:00:00.295874 UTC**. Der dazugehörige Request war schon **15:55:00.340011 UTC**, also vor Neustart, für `ES:eu-etias-future-check` eingereiht. Vor Neustart war sein Request bereits enthalten, seine Beobachtung noch nicht. Nach Ausschluss genau dieses Nachtrags liefert das alte Beobachtungspräfix bis1825 wieder **137 IDs** mit dem exakten ursprünglichen Digest:

`6a94e2bfa367ce9b6dc3dc3d038320626ebc397c0b85cde1a8529599eb5522be`

Damit ist die Differenz als regulärer Collector-Nachtrag einer bereits reservierten Nummer erklärt. Die Prüfung bestätigt das ID-Multiset einschließlich Mehrfachvorkommen; sie behauptet keine erneute vollständige Bytegleichheit sämtlicher sonstiger Beobachtungsspalten. Der separate unmittelbare Nachher-Snapshot bleibt der unveränderte Erhaltungsbeleg des Neustarts.

## Folgeentscheidung

Die zusätzliche Dev-Neustartanforderung ist erfüllt. Die [BMEIA-Fachentscheidung](OFFICIAL_TRUTH_BMEIA_FACHENTSCHEIDUNG_2026-11-21.md) und der [eng begrenzte Production-Leseauftrag](OFFICIAL_TRUTH_PRODUCTION_READONLY_GO_2026-11-21.md) liegen getrennt vor. Ein späteres Production-Go erlaubt nur den dort exakt definierten Leseumfang. Positive AT-Qualifikation, Veröffentlichungsfreigabe und Production-Änderungen bleiben gesondert offen; abgelaufene Angaben bleiben **derzeit nicht verfügbar**.
