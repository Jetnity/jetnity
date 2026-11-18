# Official Truth – textlicher Quellenvergleich (nur Recherche) V1

**18. November 2026. Status: Offline-Prüfbaustein, noch nicht automatisch angeschlossen.**  
**Basis:** [#1236](https://github.com/Jetnity/jetnity/pull/1236) sichert in Dev 11 spätere amtliche Original-HTML-Belege zu bereits aufgezeichneten SHA-Prüfsummen. [#1228](https://github.com/Jetnity/jetnity/pull/1228) enthält den privaten Research-Kontext für 206 Reiseziele × 50 Pässe. [#1232](https://github.com/Jetnity/jetnity/issues/1232) ist die Owner-Entscheidung zur Copilot-Pro-/OpenAI-/Grok-Architektur.

## Das Problem

Ein **anderer Roh-HTML-Hash** kann von Werbung, dynamischen Scripts, Navigation, neuen Links, Seitengestaltung oder einer **echten Rechtsänderung** stammen. Der Browser kann aus Gleichheit zweier Texte keine rechtliche Gültigkeit ableiten. Ein KI-Modell darf deswegen weder einen alten positiven Fakt verlängern noch einen neuen visafreien/passbezogenen Rechtssatz veröffentlichen.

## Dieser Baustein

`lib/readiness/official-truth-source-text-diff-v1.ts` nimmt die **zwei bereits vom vertrauenswürdigen Jetnity-Backend gelesenen, inhaltsadressierten Belege** derselben Quellidentität (exakt abgeglichener Source-Family, Destination, Source-Key und ansteigender Batch). Bevor irgendetwas verglichen wird, müssen Original und neue Antwort bytegenau zu ihrem jeweiligen `rawSha` und der aufgezeichneten Bytesumme passen. Die vorhandene Bibliothek `parse5` verarbeitet HTML ohne Script-Ausführung, DNS oder Netzabrufe, mit engen Byte-, DOM-Knoten-, Text- und Linkgrenzen.

Der Vergleich führt **drei voneinander getrennte Fingerprints**:
- unveränderte **Rohbytes** gegenüber unveränderter zuvor bestätigter Quellenidentität;
- zusammenhängender HTML-Body-Text (Scripts, Styles und inert Markup nur aus **diesem Textindex** ausgeschlossen);
- Links und Formularziele separat, damit eine auf der Webseite ausgetauschte Antragsadresse nicht als sichtbarer Textgleichstand durchgeht.

Ergebnis ist ausschließlich eines dieser Research-Triage-Signale:
`RAW_IDENTICAL_RESEARCH_ONLY`, `VISIBLE_TEXT_CHANGED_REQUIRES_REVIEW`, `FORM_OR_LINK_CHANGED_REQUIRES_REVIEW` oder `NONVISIBLE_MARKUP_CHANGED_REQUIRES_REVIEW`. Zusätzlich werden nur Fingerprints und gezählte Textfragmente zurückgegeben; **kein amtlicher Rohtext, keine URLs, personenbezogene Daten oder frei erfundenen KI-Behauptungen im Ergebnis**. Blockierte/zu große/gekürzte/unsichere Belege bleiben `blocked`. Kein Resultat kann einen positiven Einreiseentscheid darstellen: `reviewRequired=true`, `legalRuleApproved=false`, `publicationAllowed=false`, `acceptedFacts=0`.

**Wichtig:** Das ist ein Textänderungs-**Screen**, keine semantische oder juristische Inhaltsanalyse. Selbst bei bytegleichem oder textgleichem Inhalt werden Quellenalter, Dokument-, Staatsangehörigkeits-, Aufenthaltsdauer-, Routen- und Gültigkeitsbedingungen **nicht** durch diesen Baustein validiert. Scripts, JSON-LD, andere Medien, sprachliche Zweideutigkeit, dynamische Seiten und Link-Weiterleitungen können rechtlich relevant sein und erfordern weiterhin unabhängige amtliche Quellenprüfung. Eine Modellausgabe und ein Textvergleich sind nie allein Official Truth.

## Implementierungsgrenzen

- **Keine Datenbank- oder Cron-Änderung:** Der Baustein ist rein offline und wird noch **nicht** automatisch in Dev/Production auf echte gespeicherte Quellen ausgeführt. Der echte automatische Dev-Snapshot-Sammler aus #1236 läuft unabhängig davon.
- **Keine neuen Anbieter/Abos/Kosten:** Kein OpenAI-/Grok-API-Aufruf, keine Modell-Keys, keine neuen Dependencies, keine Texte an Drittanbieter.
- **Keine neue Schreibautorität:** Alte MA1-/BG1-/Owner-Gates bleiben unverändert. Neue positive Fakten für die 49 weiteren österreichischen Pässe oder andere Länder: **0**.
- **Testumfang:** synthetische Behörden-HTML-Dokumente; Textänderung, Formularlink-Änderung, Script-/Markup-Änderung, bitgleiches Rohdokument, gefälschte SHA-/Byte-Angaben, falsche Quellidentität, ältere Batch-IDs, übergroße/inhaltlose HTML-Seiten, riesiger DOM-Baum, modelleigene Grant-/Personenfelder. Ein synthetischer Erfolg ist kein echter Behörden- oder Besucher-Endtest.

## Nächster kontrollierter Schritt

Einen **nur serverseitig autorisierten Dev-Worker** hinzufügen, der Original und ein späteres Sample aus #1236 nach exakter Datenbank-Provenienz liest, diesen reinen Parser als Vorsortierung nutzt und den **konkreten zuständigen Fachabschnitt** für spätere OpenAI-Extraktion ins bestehende Review-Packet-/Quarantäne-System einreiht. Selbst dafür braucht es vor echtem KI-Aufruf separate Provider-/Kostenfreigabe. Nur die bestehenden deterministischen Official-Truth-Gates können ein Amtliches Faktum nachprüfen und freigeben.

Kein Merge oder Production-Schritt durch dieses Dokument.
