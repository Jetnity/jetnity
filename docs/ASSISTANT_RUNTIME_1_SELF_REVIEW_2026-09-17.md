# Jetnity – Assistant Runtime 1 Self-Review (adversarial)

Stand: 17. September 2026  
Letzter laufzeitändernder Head: der Review-Fix „Replace free prose with selection from Jetnity-owned catalogues“ (Runde 9). Der exakte finale Head ist der Kopf des Branches.

**Dieses Dokument ist kein Technical-Lead-PASS.** Es ist der Versuch, die eigene Arbeit so anzugreifen, wie ein unabhängiger Reviewer es täte, und die Stellen zu benennen, an denen sie nachgibt.

---

## 0. Was das Re-Review gefunden hat, das dieses Dokument nicht gefunden hatte

Sechs Wahrheitsbefunde in fünf Runden, alle berechtigt, alle behoben. Sie gehören an den Anfang, weil sie zeigen, wo dieses Selbstreview zu wohlwollend war.

**Befund 1 – eine fremde amtliche Lage schaltete Gewissheit global frei.** `auskunftPruefen()` prüfte `bezuege.some(bezug => bezug.art === 'official' && bezug.belegt)` über den **ganzen Kontext** und gab bei einem Treffer sofort frei. Eine aktuelle Passgültigkeitsprüfung hätte damit den Satz „kein Visum erforderlich" getragen, während die Visumslage `unknown` ist – genau die Aufwertung von `unknown` zu `not_required`, gegen die dieser Slice gebaut ist.

Warum ich es übersehen habe: Mein Test „ist zulässig, sobald der Kontext eine belegte amtliche Lage trägt" hat die Lücke nicht nur verfehlt, er hat sie **als Sollverhalten festgeschrieben**. Ich habe einen Kontext mit *einer* Official-Lage geprüft; die gefährliche Konstellation ist die mit *zwei*. Das ist der klassische Fehler, den eigenen Entwurf zu testen statt den Angriff.

Die Regel ist jetzt zweiseitig und an die Auskunft gebunden: mindestens ein **genannter** belegter Official-Bezug, und kein genannter unbelegter. Vier Regressionen decken die Konstellationen ab; ich habe geprüft, dass sie gegen die alte Fassung durchfallen und gegen die neue tragen.

**Befund 2 – unerwartete Felder wurden entfernt statt abgelehnt.** `z.object` ist nicht strict. Mein Test „lehnt ein zusätzliches Feld ab, auch wenn die Plattform es durchliesse" prüfte, dass das Feld *nicht im Wert ankommt* – und nannte das im Namen „ablehnen", obwohl es Aufräumen war. Der Name hat die Lücke verdeckt. Jetzt `z.strictObject`; ein zustandstragendes Zusatzfeld endet als Klasse `schema`.

**Befund 3 (Head `74577e31`) – die Bindung war an den Bezug geknüpft, nicht an die Anforderung.** Nach der Korrektur von Befund 1 musste die Auskunft einen belegten Official-Bezug *nennen*. Sie musste aber nicht den **richtigen** nennen: Eine geprüfte Impfanforderung trug den Satz „kein Visum erforderlich". Das ist dieselbe verbotene Aufwertung, nur über den Anforderungstyp statt über die Reise.

Warum ich es nach Befund 1 nicht selbst gesehen habe: Ich habe die Korrektur als *eine* Bedingung gedacht („benannt statt irgendwo") und nicht gefragt, welche weiteren Dimensionen zwischen Aussage und Beleg liegen. Die Antwort ist eine Kette – Reise → genannter Bezug → Anforderungstyp → Scope – und jedes Glied musste einzeln erzwungen werden, weil keine allgemeine Regel es mitbringt. Beim Abarbeiten eines Befundes reicht es nicht, den genannten Fall zu schliessen; man muss fragen, welcher Fall der nächsten Stufe entspricht.

Die Lösung trägt die maschinenlesbare Anforderungsidentität (`requirementType`, `scope`, `visaMode`) aus der Projektion in `BegleiterBezug` und gibt jedem Gewissheitsmuster ein Prädikat. Formulierungen ohne erkennbaren Gegenstand – „garantiert", „definitiv", „amtlich bestätigt", „nicht erforderlich", „problemlos einreisen" – bekommen kein Prädikat und fallen immer durch.

**Befund 4 (Head `f46d43a0`) – die Bindung war bereichsgenau, aber die Bereiche waren unvollständig, und sie kannten nur die Verneinung.** Gedeckt waren fünf Bereiche; die geschlossene Taxonomie hat sechzehn. „Du brauchst eine Reiseversicherung", „Dein Pass muss sechs Monate gültig sein", „Du musst einen Rückflug nachweisen" fielen durch das Netz – nicht durch die Prüfung.

Warum ich es nicht selbst geschlossen habe, obwohl ich es **gesehen** hatte: Ich hatte die Lücke in Abschnitt 2.1 dieses Dokuments als bekannte Grenze notiert und es dabei belassen. Eine erkannte Wahrheitslücke als „eingestandene Grenze" zu dokumentieren ist nur dann redlich, wenn sie sich nicht schliessen lässt. Hier liess sie sich schliessen – es gibt eine geschlossene Taxonomie im Repository, gegen die sich prüfen lässt. Dokumentieren war hier der bequemere Weg, nicht der richtige.

Der zweite Teil des Befundes ist grundsätzlicher: Alle bisherigen Muster waren Verneinungen. Eine Anforderung lässt sich aber genauso behaupten wie bestreiten, und die erfundene Behauptung ist die gefährlichere von beiden – sie schickt jemanden zum Konsulat oder lässt ihn eine Versicherung kaufen, die niemand verlangt.

Die Lösung ist keine längere Wortliste, sondern eine andere Zerlegung: Modalität × Bereich × Vorbehalt, satzweise. Damit fällt die Richtung der Aussage weg als Unterscheidung, und die Bereichsliste lässt sich gegen `OFFICIAL_REQUIREMENT_TYPES` auf Vollständigkeit prüfen.

**Die gemeinsame Wurzel aller vier Befunde.** Ich habe jede Korrektur als Schliessung des *genannten Falls* gedacht statt als Frage nach der nächsten Umgehungsdimension. Die vier Runden haben nacheinander erweitert: Kontext → genannter Bezug → Anforderungstyp → Gesamttaxonomie und Aussagerichtung. Jede dieser Stufen war nach der vorigen absehbar, wenn man die richtige Frage stellt: nicht „schliesst die Regel den genannten Fall?", sondern „worüber lässt sie sich noch umgehen?". Dazu kommt derselbe Fehler wie in Befund 1 und 2: Ich habe die strukturelle Schranke („das Modell kann den Zustand nicht formulieren") für stärker gehalten, als sie war, und die nachgelagerten Prüfungen entsprechend milde gebaut.

---

## 0e. Runde 9: der Befund, der die Bauform erledigt hat

**Befund 8 (Head `5ef78e5c`) – die Erlaubnisliste ohne amtliche Substantive war weiterhin eine Behauptung über einen Satzraum.** Drei Sätze, alle aus geführten Alltagswörtern:

- `Du musst ein gültiges Reisedokument haben.`
- `Du brauchst ein Dokument.`
- `Dein Reisedokument muss gültig sein.`

Ich hatte `dokument`, `reisedokument`, `formular`, `gültig` bewusst wieder aufgenommen, mit der Begründung, sie seien „bereichsneutral": Kein Bereichsmuster trifft sie. Das war formal richtig und inhaltlich falsch. `BEREICHE` ist eine Liste von Wörtern; eine amtliche Anforderung braucht keines davon, sondern nur ein Gegenstandswort und eine Modalität. Mein Vollständigkeitsnachweis prüfte Wortstämme und Wortpaare gegen Muster – er konnte gar nicht sehen, was aus vier Wörtern über drei Satzglieder entsteht.

**Was ich acht Runden lang wiederholt habe.** Jede Fassung war dieselbe Bauform: eine Behauptung, dass aus einer erlaubten Wortmenge kein amtlicher Satz bildbar ist. Ich habe die Wortmenge sechsmal umgebaut – Verbotsliste, Sprachprüfung, Erlaubnisliste, Erlaubnisliste ohne amtliche Substantive – und jedes Mal geschrieben, jetzt sei es strukturell. Es war jedes Mal dieselbe unbeweisbare Behauptung mit anderem Inhalt. Dass der Technical Lead achtmal ein Gegenbeispiel gefunden hat, ist keine Serie unglücklicher Zufälle, sondern die einzige mögliche Rückmeldung auf eine Bauform, die Gegenbeispiele beliebig zulässt.

Besonders unangenehm ist Runde 8: Dort hatte ich einen *Test* als Beweis präsentiert („kein geführter Stamm trifft einen Bereich") und daraus geschlossen, die Zusicherung sei nachgewiesen statt argumentiert. Ein Test kann nur prüfen, was er formulieren kann. Meiner prüfte Wörter, die Zusicherung sprach über Sätze. Ein Nachweis, dessen Gegenstand kleiner ist als die Behauptung, ist gefährlicher als kein Nachweis, weil er Prüfung ersetzt zu haben scheint.

**Die Korrektur gibt die Bauform auf.** Es gibt kein Freitextfeld mehr. Das Modell wählt Schlüssel aus zwei geschlossenen Katalogen und nennt den Bezug; jeden Satz schreibt Jetnity. Die drei Sätze oben sind nicht abgelehnt – es gibt kein Feld, in das sie passen. Das ist der erste Zustand dieses Slice, in dem die Zusicherung nicht über Sprache argumentiert wird, sondern an einem Typ ablesbar ist: `schema.test.ts` prüft, dass die Menge der Felder genau `befunde`, `bezuege`, `amtlicheHinweise` ist und dass keines davon Text annimmt.

**Was ich zusätzlich abgesichert habe, weil der Katalog eine neue Angriffsfläche ist.** Ein Katalog Jetnity-eigener Sätze kann auf zwei Weisen falsch werden: durch eine Formulierung, die doch eine Anforderung behauptet, und durch eine wahre Aussage am falschen Objekt. Beides ist geprüft – die Formulierungen des ganzen Katalogs gegen Anforderungssprache, und die Auswahl gegen das berechnete Angebot inklusive Bezug. Zusätzlich: Mit leerem Angebot darf **kein** Katalogeintrag durchkommen; sonst gäbe es einen, der sich selbst belegt.

**Was diese Lösung kostet, und was daran nicht meine Entscheidung ist.** Der Reisebegleiter formuliert nicht mehr. Er wählt aus 33 Jetnity-Aussagen aus und ordnet sie. Für eine Wahrheitsklasse „Generated Suggestion" halte ich das für die ehrliche Bauform, aber es ist eine **sichtbare Produktänderung**, und der Nutzen hängt jetzt an der Katalogbreite statt an der Sprachfähigkeit des Modells. Ob das Produkt so genug wert ist, ist nicht gemessen – dafür fehlt der bezahlte Aufruf. Diese Frage gehört dem Product Owner und steht als ADR-0212 Punkt 9 mit Empfehlung im Repository, nicht nur in diesem Dokument.

**Ein Nebenfund beim Umbau, ehrlich benannt.** Nach dem Schemawechsel hing `erzeugen.test.ts` unter `node --test` ohne Ausgabe, statt zu scheitern: Die alten Fixtures trugen Prosa, die Prüfung verwarf sie, und eine fehlschlagende `assert.ok`-Zeile an dieser Stelle brachte den Testlauf zum Stillstand. Die Ursache lag in den veralteten Fixtures; nach deren Umstellung läuft die Datei mit 43 Tests grün. Ich habe die Mechanik des Stillstands im Testrunner nicht weiter aufgeklärt, weil sie mit dem Fix verschwand – wenn sie wiederkehrt, ist das der Ort, an dem man ansetzt.

---

## 0d. Runde 8: der Befund, der die Prämisse widerlegt hat

**Befund 7 (Head `e6606ea8`) – die Erlaubnisliste war keine Wahrheitsschranke.** Drei Umgehungen, alle deterministisch, alle vom Technical Lead exakt benannt:

1. `notwendig` und `nötig` standen im Register, während `PFLICHTWORT` sie nicht band. `Ein Visum ist notwendig.` bestand damit aus lauter geführten Wörtern und erzeugte keine harte Aussage.
2. `istUnbedenklich()` liess jeden Token mit `length <= 1` durch. `V I S U M ist P F L I C H T.` war lexikalisch einwandfrei, und die Wortmuster sahen kein zusammenhängendes `visum`.
3. `kontextwortschatz()` erweiterte das Register um jedes Wort aus `titel` und `lage` – darin stecken `stage.name` und `traveller.label`. Ein Etappenname `No visa is required` brachte seine eigenen Wörter mit.

Gemessen, nicht eingeräumt: Alle **fünfzehn** Kombinationen aus diesen drei Fällen und den drei Modellfeldern waren auf dem reviewten Head zulässig. Ich habe das in einem Worktree auf `e6606ea8` nachgefahren, bevor ich den Fix gebaut habe – ein Befund, den man nicht reproduziert hat, ist auch nicht geschlossen.

**Warum ich nach sieben Runden noch daneben lag.** Ich hatte in Runde 7 geschrieben, amtliche Begriffe stünden „mit Absicht im Register", weil die inhaltliche Prüfung sonst für ihren Bereich toter Code wäre. Dieser Satz ist die ganze Fehlannahme in einer Zeile: Ich habe die inhaltliche Prüfung als das Wertvolle behandelt und den Wortschatz als ihre Zulieferung – also musste das Vokabular hinein. Die richtige Frage war die umgekehrte: Wenn die inhaltliche Prüfung nur nötig ist, weil die Prosa amtliche Begriffe enthalten darf, warum darf sie das?

**Die gemeinsame Wurzel aller sieben Befunde.** Sechs Fassungen haben Prosa geprüft, in der amtliche Aussagen vorkommen dürfen. Solange eine Wahrheitsaussage in einem Freitextfeld *ausdrückbar* ist, ist jede Prüfung darüber eine Näherung – und der Technical Lead hat in jeder Runde genau das gezeigt, weil das Verfahren Gegenbeispiele beliebig produziert. Sechs Erweiterungen derselben Bauart sind nicht sechs Pechfälle, sondern ein Beweis über die Bauart.

Runde 8 tauscht deshalb nicht die Liste, sondern die Zuständigkeit: nicht mehr „ist dieser Satz belegt?", sondern „kann dieser Kanal so einen Satz überhaupt enthalten?". Prosa ohne amtliches Vokabular kann keine Anforderung benennen; amtliche Lagen laufen über sieben geschlossene Aussageschlüssel, deren Sätze Jetnity schreibt und deren Zulässigkeit an `ergebnis`, `frische` und `fehlendeAngaben` des Bezugs hängt.

**Was diese Fassung anders belegt.** Zum ersten Mal ist die Zusicherung selbst ein Test und nicht eine Behauptung im Kommentar: `wortschatz.test.ts` prüft jeden geführten Stamm **und jedes Paar daraus** gegen die Bereichsmuster. Er hat beim Bauen sofort drei echte Lecks gefunden, die ich nicht vermutet hatte – `rückreise` im Register, `passen` mit dem Stamm `pass` (womit sich `Reisepass` zusammensetzen liess) und `notwendig`/`nötig`. Ein Nachweis, der beim ersten Lauf nichts findet, ist meist keiner.

**Die Folge für die Laufzeitprüfung, ehrlich benannt.** Die semantische Prosaprüfung (`harteAussagen`, Modalität × Bereich × Vorbehalt) ist jetzt **unerreichbar**: Kein geführtes Wort trifft einen Bereich. Ich habe sie deshalb entfernt und die Bereichsmuster auf ihre wahre Rolle zurückgeführt – Spezifikation für den Test, nicht Kontrolle zur Laufzeit. Eine Schranke stehen zu lassen, die nie greifen kann, hätte den Eindruck weitergetragen, Prosa werde semantisch geprüft; genau dieser Eindruck war zweimal der Befund.

**Der Preis, unverändert offen.** Recall, und er ist weiter **nicht gemessen**. Über amtliche Lagen kann die Auskunft nur noch sieben Sätze sagen, und ein gültiger deutscher Satz mit einem ungeführten Wort fällt durch. Ob die Auskunft damit noch nützlich genug ist, zeigt erst der bezahlte Aufruf – der einzige Weg, das zu messen, ist genau der Nachweis, der offen ist. Ich halte den Handel für richtig, aber er gehört vorgelegt, nicht entschieden.

---

## 0c. Runde 7: der Befund, der die Bauart widerlegt hat

**Befund 6 (Head `4ffe3f20`) – die geschlossene Sprachfläche war keine.** Meine Lösung aus Runde 6 bestand aus einer Markerwort-Heuristik (`istDeutscheAntwort`) und einer endlichen Fremdwortliste (`FREMDES_AMTSVOKABULAR`). Das Gegenbeispiel des Technical Lead hebelt beides in einem Satz aus: `Das ist so: İtalya için vize gerekli.` – `Das` und `ist` genügen der Heuristik, `vize gerekli` steht in keiner Liste, und die deutschen Muster lesen es nicht. Dazu ein zweiter Weg, den ich selbst gebaut hatte: Die Sprachprüfung lief nur über `antwort`, während `unsicherheiten` und `naechsteSchritte` frei blieben.

Ich habe in Runde 6 geschrieben, die Fläche sei jetzt geschlossen. Das war falsch, und es war nicht nur ungenau – es war die Art Aussage, die ein Review als erledigt abhakt. Eine Heuristik als geschlossenen Vertrag auszugeben ist schlimmer als die Heuristik selbst, weil sie die nächste Prüfung verhindert.

**Was ich sechs Runden lang nicht gesehen habe.** Jede meiner Fassungen war eine Verbotsliste: verbiete „visumfrei", verbiete „no visa is required", verbiete fremde Marker. Eine Verbotsliste über einer offenen Menge ist grundsätzlich unvollständig, und ich habe sie fünf Mal erweitert, statt einmal die Richtung zu tauschen. Der Technical Lead hat in jeder Runde einen neuen Umgehungsweg gefunden – und zwar zwangsläufig, weil das Verfahren sie produziert.

Die Korrektur dreht die Fragestellung: **nicht welche Wörter verboten sind, sondern welche erlaubt.** `lib/reisebegleiter/wortschatz.ts` führt den Register, den die Systemregeln verlangen; dazu kommt, was der serverseitig abgeleitete Kontext hergibt, und Zahlen. Alles andere ist unbelegt. Das ist ab dem ersten Tag vollständig: Es gibt keine Sprache, die nicht in der Liste steht, weil nichts in der Liste stehen *muss*, um verworfen zu werden.

**Was es kostet, und warum ich es trotzdem für richtig halte.** Recall. Ein gültiger deutscher Satz mit einem Wort ausserhalb des Registers fällt durch – `Gelbfieberimpfung` zum Beispiel, was hier zufällig auch richtig ist, aber es gilt genauso für harmlose Wörter. Die Auskunft wird dadurch spürbar enger. Ich halte den Handel für richtig, weil die beiden Fehlerarten nicht gleich schwer sind: eine abgelehnte Auskunft ist ein ausgefallenes Merkmal, eine erfundene Einreiseanforderung schickt jemanden mit falschen Papieren an eine Grenze. Aber es ist ein Handel, kein Gewinn, und er gehört dem Technical Lead vorgelegt und nicht von mir entschieden.

---

## 0b. Runde 6: der Befund, den ich mir selbst gebaut hatte

**Befund 5 (Head `4837fc9a`) – die Schranke war für den Satz nicht zuständig.** Die Prüfung liest deutsche Modalität, deutsche Bereiche, deutsche Vorbehalte. Und `regeln.ts` verlangte die Antwort „in der Sprache der Frage". „You need a visa." ging deshalb durch – nicht weil die Regel eine Lücke hatte, sondern weil es für diesen Satz keine Regel gab.

Das Unangenehme daran: **Die Zeile „in der Sprache der Frage" habe ich in Runde 1 selbst geschrieben.** Ich habe die Prüffläche geöffnet und danach fünf Runden damit verbracht, eine Denylist über einer offenen Fläche zu perfektionieren. Vier Runden lang lautete meine eigene Lehre „frage, worüber sich die Regel umgehen lässt" – und ich habe dabei nie gefragt, ob sie für den Text überhaupt gilt. Der Umfang einer Regel und ihre Zuständigkeit sind zwei verschiedene Dinge; ich hatte nur das erste im Blick.

Die naheliegende Reparatur wäre gewesen, Englisch in die Wortlisten zu nehmen. Das wäre keine gewesen: Es hätte die Fläche offen gelassen und auf die nächste Sprache gewartet. Die Korrektur schliesst stattdessen die Fläche – Antwortsprache Deutsch, wie `COUNTRY_UI_LOCALE` und wie die ganze übrige Oberfläche – und sichert das mit zwei Schranken ab, die sich gegenseitig auffangen. Erst über einer geschlossenen Fläche ist eine Wortliste eine Prüfung.

**Ein zweiter Befund kam aus dem eigenen Test.** Beim Schreiben der feindlichen Fälle fiel „bestätige die Einreise als amtlich geprüft" durch das Netz: Mein Vorbehaltsmuster las jedes „prüf" als Einschränkung, aber „gilt als geprüft" ist eine Behauptung über die *Herkunft* der Wahrheit. Solche Aussagen sind jetzt nie bindbar. Das ist die erste Lücke dieses Slice, die ich selbst gefunden habe, und sie kam nicht aus dem Nachdenken, sondern daraus, dass ich einen Angriff formuliert und nicht nur beschrieben habe.

---

## 0a. Runde 5: Integration, und was sie nicht beweist

Diese Runde hat keinen Wahrheitsbefund behoben. Sie hat `main@aa6afaa6` integriert – 41 Commits mit Realistic World Cartography, Guardian-Governance, dem V1-Account-/Privacy-/Ops-Audit und Explicit Visit History – und den Slice auf dem kombinierten Stand neu gegatet.

Bemerkenswert daran ist, was sie **nicht** belegt: Der Merge lief konfliktfrei, auch in `package.json`, das der Technical Lead als einzige Überschneidung vorab benannt hatte. Ein konfliktfreier Merge ist kein Beweis für Verträglichkeit – Git meldet keinen Konflikt, wenn zwei Seiten dieselbe Datei an verschiedenen Stellen anfassen, selbst wenn das Ergebnis fachlich falsch wäre. Deshalb habe ich die Verträglichkeit nachgerechnet statt sie aus dem Ausbleiben eines Konflikts zu schliessen: alle 45 Skripte aus `main` wortgleich vorhanden, `dependencies` und `devDependencies` identisch, genau ein Zusatz, und die tragenden neuen Dateien von `main` byte-identisch. Der Diff gegen `origin/main` enthält nur den Assistant-Slice.

Ich habe **gemergt und nicht rebased**, obwohl ich in Runde 4 rebased hatte. Der Auftrag verlangt es diesmal ausdrücklich: Ein Rebase hätte die bereits reviewten Exact-Head-Commits neu geschrieben, und die sind Gegenstand der Review-Historie dieses PR.

Was diese Runde ebenfalls nicht kann: den Live-Stand von Development lesen. Der Management-API-Zugang dieser Umgebung bleibt bei HTTP 401. Alles, was das Statusdokument über den Development-Schemastand sagt, ist die Feststellung des Technical Lead, und es ist dort auch so gekennzeichnet.

---

## 1. Die Angriffe, die ich gefahren habe

| Angriff | Antwort des Systems | Nachweis |
| --- | --- | --- |
| Bezahlten Aufruf ohne Reservierung erzwingen | unmöglich: `beanspruchen` steht vor `aufrufen`, die Reihenfolge wird als Protokoll verglichen | `erzeugen.test.ts`, „das Kontingent wird vor dem Aufruf gebucht" |
| Abgeschaltete Umgebung Geld kosten lassen | keine Buchung, kein Aufruf, keine Nutzlast – für alle drei Abschaltgründe | `erzeugen.test.ts`, „Eine abgeschaltete Umgebung kostet nichts" |
| Über eine unbrauchbare Eingabe an die Buchung kommen | `null`, `undefined`, Zahl, Objekt, Array, zu kurze Frage: alle ohne einen einzigen Schritt | ebd. |
| Einen zweiten Versuch auslösen | für alle acht Fehlerklassen: genau ein Aufruf, eine Buchung, ein Abschluss; kein Sol→Terra-Nachzug | ebd., „Ein Versuch, kein zweiter" |
| Über den Reisekontext mehr Eingabetokens verbrauchen als reserviert | Eingabegrenze bricht vorher ab, ohne Buchung; Ausgabebudget 1600 statt 6000 | ebd. plus `kosten.test.ts` |
| Kaputte, verweigerte, abgeschnittene, leere, schemawidrige Antwort verwerten | dreizehn Fälle, jeder endet als Fehlerklasse **und** wird als bezahlter Aufruf abgeschlossen, nicht verschwiegen | ebd., „Eine unbrauchbare Antwort wird nicht brauchbar gemacht" |
| Einen Preis in die Auskunft schreiben | Ablehnung als `schema` – nicht Entfernung | `schema.test.ts`, `erzeugen.test.ts` |
| Einen Link in die Auskunft schreiben | Ablehnung als `schema` | ebd. |
| Einen Bezug erfinden | Ablehnung; formal falsche Kennungen scheitern am Schema, formal richtige an der Existenzprüfung | `schema.test.ts`, `pruefung.test.ts` |
| Eine Buchung behaupten – auch vorsichtig („noch nicht gebucht") | Ablehnung, unabhängig davon, ob eine amtliche Lage belegt ist | `pruefung.test.ts` |
| Eine Änderung behaupten („ich habe zwei Tage hinzugefügt") | Ablehnung; der Konjunktiv („du könntest") bleibt zulässig | ebd. |
| „visumfrei" bei unbelegter Lage sagen | Ablehnung; erst ein **belegter Official**-Bezug öffnet den Weg, eine belegte Etappe oder Safety-Lage nicht | ebd. |
| Den Zustand eines Bezugs aus dem Modelltext übernehmen | das Feld existiert nicht; ein trotzdem mitgeschicktes Feld lässt die ganze Auskunft als `schema` durchfallen | `erzeugen.test.ts`, „zusätzliches zustandstragendes Feld" |
| Gewissheit über eine Lage behaupten, die die Auskunft nicht belegt | Ablehnung: eine fremde belegte Official-Lage im Kontext schaltet nichts frei, und ein zugleich genannter unbelegter Bezug kippt eine sonst getragene Gewissheit | `pruefung.test.ts`, „Gewissheit ist an die benannte amtliche Lage gebunden" |
| Gewissheit mit einer fachfremden Anforderung belegen (Impfung trägt Visum, Transit trägt Zielvisum) | Ablehnung: jeder Bereich nennt die Anforderungstypen, die ihn tragen können; nicht zuordenbare Formulierungen fallen immer durch | `pruefung.test.ts`, „Gewissheit ist an den passenden Anforderungstyp gebunden" |
| Eine Anforderung **behaupten** statt verneinen („Du brauchst eine Reiseversicherung") | Ablehnung in allen sechzehn Bereichen der Taxonomie; je Bereich vier Regressionen (fremder Beleg, kein Beleg, passender Beleg, passender aber ungeprüfter Beleg) | `pruefung.test.ts`, „Harte amtliche Aussagen über die geschlossene Anforderungstaxonomie" |
| Die Schranke über die **Sprache** umgehen | Ablehnung, weil die Wörter nicht geführt sind: 19 Fälle über neun Sprachen, jeweils gegen drei Kontexte – auch gegen einen mit geprüfter Visumslage | `pruefung.test.ts`, „Die amtliche Schranke ist nicht über die Sprache umgehbar“ |
| Eine **gemischtsprachige** Auskunft: deutscher Satzanfang, Behauptung in einer ungelisteten Sprache | Ablehnung; fünf Sprachen, die in keiner Liste stehen, jeweils in jedem Modellfeld und gegen drei Kontexte | ebd., „Die Wortschatzschranke gilt für jedes Modellfeld“ |
| Die Behauptung aus `antwort` in `unsicherheiten` oder `naechsteSchritte` verschieben | Ablehnung mit Feldnamen im Hinweis; die Schranke gilt für jedes modellgeschriebene Feld | ebd. |
| Einen Ort erfinden, den die Reise nicht hat | Ablehnung: Eigennamen sind nur zulässig, soweit die Projektion sie trägt | ebd., „ein Eigenname ohne Deckung in der Projektion fällt durch“ |
| Die Prüfherkunft behaupten („gilt als geprüft") | nie bindbar; `unknown` lässt sich nicht auf `current` heben | ebd. und „Feindlicher Reisetext" |
| Über den Reisetext eine Anweisung einschmuggeln | Der Text bleibt ein JSON-Feldwert, setzt kein `belegt` und erscheint nicht als Jetnity-Stand; folgt das Modell ihm, fällt die Ausgabe wie jede andere | `nutzlast.test.ts`, „Feindlicher Reisetext bleibt Daten"; `pruefung.test.ts`, „Feindlicher Reisetext kann die Schranke nicht öffnen" |
| Einen Anforderungstyp finden, den kein Bereich kennt | Vollständigkeitsnachweis gegen `OFFICIAL_REQUIREMENT_TYPES` | ebd., „jeder Anforderungstyp der Taxonomie kann von einem Bereich getragen werden" |
| Die Sperre mit Fehlalarmen unbrauchbar machen | neun typische ehrliche Sätze bleiben zulässig, darunter „Prüfe deine Passgültigkeit in der Reisevorbereitung" und „Du musst die Etappen noch mit Daten versehen" | ebd., „Beschreibungen, Fragen und Vorschläge bleiben zulässig" |
| Zwei Gewissheiten in einem Text, nur eine belegt | Ablehnung der ganzen Auskunft | ebd., „jede Gewissheit im Text braucht ihren eigenen Beleg" |
| Passnummer, MRZ, Buchungs-URL, Secret, E-Mail, Fingerprint, Preis, Koordinate, Ortsschlüssel in den Prompt bringen | zehn Leck-Marken, keine erreicht den Prompt oder die angezeigten Bezüge | `nutzlast.test.ts` |
| Ein sensibles Feld über eine später erweiterte Projektion einschmuggeln | die Reissleine trifft Feldnamen und Wertmuster in jeder Tiefe; die Nutzlast schreibt unbekannte Felder ohnehin nicht ab | ebd. |
| Rangsemantik unter Reisenden erzeugen | kein „primary", „preferred", „bevorzugt" im Prompt; Reihenfolge erzeugt keinen Vorrang | ebd. |
| Die Reise über diesen Weg ändern | es gibt kein Werkzeug dafür; der Werkzeugvertrag wird als Schlüsselliste geprüft; die Server Action kennt kein `insert/update/delete/upsert/revalidatePath` | `erzeugen.test.ts`, `oberflaeche.test.ts` |
| Einen Aufruf beim Rendern auslösen | die Fläche ist bis zum ersten Öffnen nicht im Dokument; es gibt keinen Effekt in der Komponente; im Browser bestätigt | `oberflaeche.test.ts`, `nachweis:reisebegleiter` |
| Einen Provider-/Suchaufruf auslösen | die Server Action importiert keinen Provider und keine Suche; im Browser kein entsprechender Request | ebd. |
| Auf einen anderen Kostentopf wechseln | die Server Action nennt `'reisevorschlag'` und `'reiseaenderung'` nirgends | `oberflaeche.test.ts` |
| Production stillschweigend aktivieren | `modellZustand({})` ist `abgeschaltet`; Schlüssel ohne Flag bleibt `abgeschaltet`; Flag ohne Schlüssel `kein-schluessel` | `erzeugen.test.ts` |
| Die bestehenden Funktionen beschädigen | 3321 Tests grün, darunter der vollständige Reisevorschlag- und Reiseänderungsbestand | `npm test` |
| Einen bestehenden CHECK-Wert verlieren | jede Fassung der Prüfbedingung muss alle Werte der vorigen enthalten | `grenzen-datenbank.test.ts` |

---

## 2. Wo die Arbeit nachgibt

Diese Punkte sind echte Schwächen, keine rhetorischen.

**2.1 Der Gewissheitsfilter ist ein Wortfilter.** „Nicht als gewiss behaupten" ist semantisch, und ein deterministischer Test liest keine Semantik. `pruefung.ts` verbietet die Wörter, mit denen eine unbelegte Gewissheit im Deutschen ausgedrückt wird. Das erzeugt zwei Fehler in beide Richtungen:

- **Fehlalarm:** „Jetnity kann nicht bestätigen, dass du ohne Visum einreisen darfst" ist ehrlich und fällt durch. Gegenmittel: Die Systemregeln verbieten dieselben Wörter ausdrücklich. Ein regelkonformes Modell löst den Filter nicht aus. Wie oft ein echtes Modell daran scheitert, ist **nicht gemessen** – dafür wäre ein bezahlter Aufruf nötig.
- **Lücke:** Eine Verfügbarkeits- oder Preisbehauptung in freier Formulierung („dieses Hotel ist im April meist noch frei") erkennt er nicht. Das ist dieselbe eingestandene Grenze wie ADR-0054. Die Preisziffer-Erkennung greift, die Verfügbarkeitsaussage nicht.
- **Geschlossen (Befund 4):** Die Bereichszuordnung deckt die vollständige `OFFICIAL_REQUIREMENT_TYPES`-Taxonomie ab, geprüft durch einen Vollständigkeitstest.
- **Geschlossen (Befund 5 und 6):** Die Sprachseite, und zwar durch Umkehrung statt durch Erweiterung. Der Wortschatz ist eine Erlaubnisliste; es gibt keine Sprache mehr, die durchkommt, weil sie nicht aufgezählt ist. Was bleibt: Ein deutscher Satz aus geführten Wörtern kann den Bereichsdetektor in ungewöhnlicher Formulierung weiterhin verfehlen. Diese Grenze liegt jetzt **innerhalb** eines geschlossenen Wortschatzes statt über allen Sprachen – prüfbar, weil der Register lesbar ist.
- **Nebenwirkung der Wortschatzschranke:** Sie lehnt aus Gründen ab, die nichts mit Wahrheit zu tun haben – ein fehlendes Wort im Register genügt. Wie oft das eine brauchbare Auskunft trifft, ist **nicht gemessen**; dafür wäre der offene bezahlte Aufruf nötig. Das ist der Punkt, an dem dieser Slice am dünnsten ist.
- **Neue Lücke durch die Strenge:** Die Sperre ist heute total – ohne aktiven Provider ist kein Official-Bezug `belegt`, also fällt jede harte amtliche Aussage. Ob die verbleibende Auskunft für Reisende noch nützlich ist, ist **nicht gemessen**; dafür wäre der offene bezahlte Aufruf nötig. Fünf Runden Wahrheitsschranke ohne einen einzigen echten Modelllauf sind das eigentliche Missverhältnis dieses Slice: Ich habe sehr genau geprüft, was Jetnity mit einer Antwort tut, und gar nicht, ob die Antworten etwas wert sind.

Das ist verantwortbar, weil er die **zweite** Schranke ist. Die erste ist strukturell: Das Schema hat kein Feld für eine Anforderung, und der Zustand eines Bezugs kommt nicht aus dem Modell. Was ein Modell nicht formulieren kann, muss dieser Filter nicht abfangen.

**2.2 Die Eingabegrenze ist abgeleitet, nicht gemessen.** 24 000 Zeichen und 2.2 Zeichen je Token sind eine pessimistische Rechnung ohne Tokenizer. Die eigentliche Absicherung ist nicht diese Zahl, sondern das Ausgabebudget von 1600 statt 6000 Tokens: Selbst bei 29 000 Eingabetokens bliebe ein Terra-Aufruf unter seiner Reservierung. Trotzdem: Eine sehr grosse Reise bekommt keine Auskunft, und ob diese Grenze in der Praxis zu früh greift, weiss ich nicht.

**2.3 Die Wirksamkeit der Systemregeln ist unbelegt.** Alles, was in dieser Arbeit geprüft ist, ist das Verhalten von Jetnity gegenüber einer Modellantwort. Ob das Modell nützliche Auskünfte gibt, ist nicht geprüft – und konnte in dieser Umgebung nicht geprüft werden.

**2.4 Die Migration habe ich nicht anwenden können.** Der Technical Lead hat das Gate inzwischen selbst geschlossen: Development angewandt, Live-CHECK, RLS, Policy, Rechte und Advisors geprüft, Production unverändert. Das ist erledigt – aber nicht von mir, und es bleibt ein Gate, das dieser Slice nicht aus eigener Kraft belegen konnte.

**2.5 Die Darstellung einer Auskunft ist mit einer gestellten Auskunft belegt.** Der Audit-Schalter `begleiterAuskunft` stellt eine Auskunft in der Form, die `begleiterauskunftErzeugen()` zurückgibt. Die Form ist typgeprüft, die Werte sind von mir geschrieben. Das zeigt die Darstellung und nicht den Weg dorthin.

**2.6 Zwei neue Audit-Schalter im Harness.** `mitBegleiter` und `begleiterAuskunft` in `TripWorkspaceAuditClient.tsx` sowie `anfangsAuskunft` in `Reisebegleiter.tsx` sind Test-Infrastruktur im Produktbaum. Sie folgen dem bestehenden `anfangsBereich`-Muster in `TripWorkspace`, sind ohne Wert wirkungslos und können keinen Aufruf auslösen – aber sie sind zusätzliche Fläche, die ein Reviewer mitverantwortet.

**2.7 Gastreisen bleiben ohne Reisebegleiter.** Das ist eine Produktentscheidung, die ich getroffen habe, und sie hätte anders ausfallen können. Begründung in ADR-0212 Punkt 10: Der Gast-Reisegraph liegt im Browser und trägt Reisenden-, Staatsangehörigkeits- und Dokumentkontext; ihn vom Client als Wahrheit anzunehmen, um ihn an ein Modell zu geben, wäre der falsche erste Schritt. Der Gastweg ist nicht eingeschränkt worden – er bekommt nur nichts Neues. Wenn der Product Owner das anders will, ist es ein eigener Slice.

**2.8 `verbotenesFeldFinden()` hat eine Wertregel, die legitime Daten treffen könnte.** Neun zusammenhängende Ziffern gelten als verboten. In der heutigen Projektion gibt es keinen legitimen Wert dieser Form – geprüft. Eine spätere Erweiterung könnte einen einführen, und dann bricht der Weg ab statt zu lecken. Das ist die gewollte Richtung, aber es ist eine Bremse, die jemand später verstehen muss.

---

## 3. Was ich nicht getan habe, obwohl es naheliegend wäre

- **Kein Provider-Abruf für Official/Safety/Seasonal.** Die Auskunft ist dadurch substanziell ärmer: Sie sagt fast immer „nicht geprüft". Das ist richtig – ein Provider-Abruf ist in diesem Slice nicht autorisiert, und eine erfundene Entwarnung wäre schlimmer als eine ehrliche Lücke.
- **Kein Gesprächsverlauf.** Eine Folgefrage beginnt bei Null. Ein Verlauf braucht Persistenz oder mehr Kontext je Aufruf, und beides ist eine eigene Entscheidung mit eigenen Kosten.
- **Kein Modellrouter.** Der Reisevorschlag wählt Sol bei Komplexität. Für eine kurze Auskunft ist das nicht begründbar, und ein zweiter Router wäre eine zweite Stelle, die auseinanderlaufen kann.
- **Kein zweiter Kostentopf**, obwohl er die Analyse vereinfacht hätte. Zwei Zusagen über eine Summe sind keine.

---

## 4. Scope-Nachweis

**Innerhalb des freigegebenen Scope (#433, Task Abschnitte 1–8):** additive Migration, Wiederverwendung der akzeptierten Projektion, dritte Modellfunktion `reisebegleiter`, server-only OpenAI-Weg, bestehende Kostenreservierung und Kill Switch, minimale barrierefreie Fläche, ausschliesslich generierter/advisory Output, kein Auto-Apply.

**Nicht berührt (Hard non-scope):** keine Production-Migration; `JETNITY_MODELL_AKTIV` in Production unverändert; keine Production-OpenAI-Secrets; kein Production-Aufruf; keine Provider-Verträge, -Secrets oder -Live-Calls; keine Commercial-Provenance-Writer-Autorität; keine Auth-/MFA-/AAL-/Session-Änderung; keine Änderung an Traveller-/Citizenship-/Document-Persistenz; keine Pass-/MRZ-/Scan-/Biometrie-/Health-Speicherung; kein Auto-Apply; kein World Map, kein Destination Essentials, kein PWA, keine Notifications, kein Homepage-Scope; kein Public Indexing, kein Domain-Cutover; **kein Folgeslice gestartet**.

**Grenzfälle, die ich als solche melde:**

1. `lib/modell/anfrage.ts` bekommt ein additives `ausgabeTokens`. Das ist eine Änderung an geteilter Infrastruktur. Sie ist rein kostensenkend, nach oben durch `MODELL_GRENZEN.ausgabeTokens` gedeckelt und für bestehende Aufrufer wirkungslos. Ohne sie wäre die Kostenintegrität dieses Wegs nicht belegbar.
2. `lib/modell/konfiguration.ts` bekommt `MODELLFUNKTIONEN`; der Typ zieht von `kontingent.ts` dorthin um. Grund: Ein Laufzeit-Array lässt sich gegen das Migrations-SQL prüfen, ein Typ nicht – dasselbe Muster wie `ERGEBNISKLASSEN`.
3. Zwei Audit-Schalter plus `anfangsAuskunft` (siehe 2.6).
4. Ein unbestätigter Development-Auth-Nutzer als Nebenwirkung eines Login-Versuchs; vom Technical Lead geprüft und gelöscht (Status Abschnitt 5). Kein zweites Probe-Konto angelegt.

---

## 5. Was ein Reviewer zuerst anschauen sollte

1. `lib/reisebegleiter/nutzlast.ts` – ist die Nutzlast wirklich nur **enger** als die Projektion, und trifft die Reissleine das Richtige?
2. `lib/reisebegleiter/wortschatz.ts` – ist der Register gross genug für brauchbare Auskünfte und klein genug, um geschlossen zu bleiben? Lässt die Kompositumszerlegung (vier Zeichen je Teil) etwas herein, das sie nicht sollte?
3. `lib/reisebegleiter/pruefung.ts` – ist die Zerlegung Modalität × Bereich × Vorbehalt die richtige, und sind die Vorbehaltsmuster zu grosszügig? Ein falsch erkannter Vorbehalt öffnet eine harte Aussage – genau so entstand Befund 5b.
3. `lib/reisebegleiter/kosten.test.ts` – hält die Rechnung, und ist 2.2 Zeichen je Token pessimistisch genug?
4. `supabase/migrations/20260917090000_modell_reisebegleiter.sql` – ist die Erweiterung wirklich additiv, und fehlt nichts?
5. `lib/modell/anfrage.ts` – ist der additive Ausgabedeckel an geteilter Infrastruktur akzeptabel?
6. ADR-0212 Punkt 10 – ist „nur Konto" die richtige Produktentscheidung für den ersten Slice?
