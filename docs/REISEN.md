# Jetnity – Reisen

**Stand:** 17. August 2026 · Phase 1.5
**Gilt für:** das Reisedatenmodell und die Wege, auf denen eine Reise entsteht, gespeichert und bearbeitet wird.

Diese Datei beantwortet vier Fragen: Woraus besteht eine Reise, wo liegt sie, wie kommt sie aus dem Browser in ein Konto, und was ist bewusst noch nicht gebaut.

Für Tabellen, Bedingungen, Policies und Nachweise gilt [docs/DATENBANK.md](DATENBANK.md); für die Anmeldung [docs/AUTH.md](AUTH.md); für die Einordnung in das Gesamtsystem [ARCHITECTURE.md](../ARCHITECTURE.md).

---

## 1. Grundsatz

Eine Reise ist ab Phase 1.5 ein Datensatz in Supabase und kein Zustand im Browser. Vorher war sie ausschliesslich Letzteres: bis zu zwanzig Entwürfe unter einem `localStorage`-Schlüssel, ohne Tabelle, ohne Bedingung, ohne Zugriffsschutz – und mit dem Browserprofil verloren.

Das Modell ist auf die Phasen ausgelegt, die darauf aufbauen: Preisvergleich, Anbieter, Budget und Änderung per natürlicher Sprache. Es ist deshalb kein Formularabbild, sondern ein Graph aus vier Ebenen, und jede Ebene trägt die Felder, die diese Phasen brauchen – Reihenfolge, Zeitfenster, Preis, Anbieterverweis. Was noch nicht existiert, ist trotzdem nicht vorgebaut: Es gibt keine Anbietertabelle, keine Preishistorie und keine Abstraktion über Anbieter hinweg ([AGENTS.md](../AGENTS.md) Regel 19).

Zwei Regeln gelten überall:

1. **Die Zugehörigkeit einer Reise steht nicht im Anwendungscode.** Kein Modul filtert `user_id`; RLS filtert. Ein vergessener Filter wäre ein Datenleck, eine vergessene Policy ein leerer Bildschirm.
2. **Was gespeichert wird, hat die Datenbank geprüft.** Wertebereiche, Längen, Reihenfolgen und Zeiträume stehen als Bedingung im Schema. Die Zod-Schemata in `lib/trips/schema.ts` sind die zweite, freundlichere Instanz davor – nicht die einzige.

---

## 2. Das Modell

Vier Tabellen, ein Graph. Der Anwendungstyp dazu steht in `types/trips.ts` und trägt dieselben Felder in camelCase.

| Ebene | Tabelle | Was sie trägt |
| --- | --- | --- |
| Reise | `trips` | Titel, Startort, Zeitraum, Reisende, Währung, Budget, Status, Tempo, Interessen, Reisewunsch |
| Etappe | `trip_stages` | ein Aufenthalt an einem Ort: Name, Ländercode, An- und Abreise, Koordinaten, Reihenfolge |
| Tag | `trip_days` | Nummer im Reiseverlauf, optionales Datum, optionaler Titel |
| Planpunkt | `trip_items` | Flug, Unterkunft, Aktivität, Transfer oder freie Notiz – mit Zeitfenster, Preis, Anbieter, Buchungsverweis |

**Mehrere Ziele sind mehrere Etappen.** Ein Feld `destination` hätte die heutige Oberfläche abgedeckt und die zweite Station einer Reise nicht. Das Formular unter `/planen` fragt weiterhin ein Ziel und legt daraus eine Etappe an – dieselbe Struktur, nur mit einem Element.

**Tage haben eine Nummer, nicht nur ein Datum.** `day_index` ist die verbindliche Reihenfolge, `day_date` optional. Eine Reiseidee hat Tage, bevor sie Daten hat, und eine um eine Woche verschobene Reise behält ihre Struktur.

**Ein Planpunkt hängt an einem Tag oder an einer Etappe – oder an keinem von beiden.** Eine Unterkunft über vier Nächte gehört zur Etappe, ein Museumsbesuch zum Tag, ein noch nicht eingeplanter Flug zu keinem. Wird ein Tag gelöscht, verliert der Punkt seinen Tag (`on delete set null`) und nicht seine Reise; `/reisen/[tripId]` zeigt ihn dann als „noch nicht eingeplant".

**Zeiten sind Ortszeiten ohne Zeitzone.** `starts_at` ist `time`, nicht `timestamptz`. Ein Flug um 07:40 in Zürich ist 07:40, unabhängig davon, in welcher Zone der Browser steht, der ihn anzeigt. Die Zuordnung zu einem echten Zeitpunkt braucht den Flughafen, und der kommt mit dem Anbieter in einer späteren Phase.

**Keine Enums.** Alle Wertebereiche – `status`, `pace`, `kind`, `interests` – sind CHECK-Bedingungen. Ein Enum lässt sich in PostgreSQL erweitern, aber nicht kürzen; ein Wert, der sich als falsch erweist, bleibt für immer im Typ. Ein CHECK ist eine Zeile in der nächsten Migration ([DECISIONS.md](../DECISIONS.md) ADR-0043).

**Kein `jsonb` für Reiseinhalte.** Was durchsucht, sortiert oder geprüft wird, ist eine Spalte. `jsonb` trägt ausschliesslich die Nutzlast von `public.reise_anlegen()` – einen Übergabewert, keinen Speicherort.

### Wertebereiche

| Feld | Werte |
| --- | --- |
| `trips.status` | `draft`, `planned`, `booked`, `archived` |
| `trips.pace` | `calm`, `balanced`, `intense` |
| `trips.interests` | `culture`, `nature`, `food`, `beach`, `adventure`, `wellness` – als Menge, ohne Doppelte |
| `trip_items.kind` | `flight`, `stay`, `activity`, `transfer`, `note` |

Die Werte stehen in Englisch, weil sie Spaltenwerte sind. Was Reisende lesen, steht an einer Stelle: `lib/trips/bezeichnungen.ts`.

### Grenzen

Dieselben Zahlen in `GRENZEN` (`lib/trips/schema.ts`), in den CHECK-Bedingungen und in `public.reise_anlegen()`.

| Grenze | Wert |
| --- | --- |
| Titel, Orte | 120 Zeichen |
| Reisende | 20 |
| Reisedauer | 365 Tage |
| Reisetage je Reise | 366 |
| Etappen je Reise | 50 |
| Planpunkte je Reise | 1000 |
| Notiz | 500 Zeichen |
| Reisewunsch | 1000 Zeichen |
| Betrag | `numeric(12, 2)` |
| neue Reisen je Konto und Stunde | 60 |

Die letzte Zeile ist kein Modellwert, sondern ein Missbrauchsriegel in `public.reise_anlegen()`: Eine Reise anzulegen ist der einzige Vorgang, den ein angemeldetes Konto beliebig oft auslösen kann, und jeder Aufruf schreibt bis zu 1417 Zeilen.

---

## 3. Wo eine Reise liegt

Zwei Ablagen, ein Typ. Eine Gastreise im `localStorage` und eine Reise im Konto sind dasselbe `Trip`; nur die Kennung unterscheidet sich.

| | Gast | Konto |
| --- | --- | --- |
| Ablage | `localStorage`, Schlüssel `jetnity:reise:v3` | Supabase, vier Tabellen |
| Anzahl Reisen | genau eine | unbegrenzt (Liste bis 200) |
| Kennung | `trip-<uuid>` | UUID der Datenbank |
| Gerätewechsel | nein | ja |
| Zugriffsschutz | der Browser | RLS |
| Modul | `lib/trips/gastspeicher.ts` | `lib/trips/daten.ts`, `lib/trips/aktionen.ts` |

**Ein Gast hat serverseitig keine Identität.** Kein Gastkonto, kein anonymer Login, keine Gast-Zeile in `trips`. Der Grund ist ausdrücklich entschieden ([DECISIONS.md](../DECISIONS.md) ADR-0042): Eine serverseitige Gastidentität wäre ein Schreibweg ohne Konto – also ein öffentlicher Endpunkt, der Zeilen anlegt – und sie müsste beim Login mit derselben Sorgfalt zusammengeführt werden wie der Browserspeicher jetzt. Der Aufwand wäre derselbe, der offene Endpunkt zusätzlich.

**Genau eine Gastreise** ist die Produktregel, und sie steht seit dieser Phase im Code: `gastreiseAnlegen()` wirft `GastreiseBestehtFehler`, wenn schon eine besteht, mit einer Meldung, die den Weg nennt. Vorher lag die Grenze bei zwanzig Entwürfen – die Regel existierte in der Vision, nicht in der Anwendung.

**Wer vor dieser Phase mehrere Entwürfe angelegt hat, verliert keinen.** `jetnity:guest-trips:v2` wird beim ersten Laden übernommen: Der zuletzt geänderte Entwurf wird die aktive Gastreise, die übrigen wandern in eine Warteschlange (`jetnity:reisen-warteschlange:v3`). Sie sind nicht bearbeitbar und gehen beim nächsten Login vollständig ins Konto. Der alte Schlüssel fällt erst, wenn der neue geschrieben ist; bricht der Vorgang dazwischen ab, läuft er beim nächsten Laden erneut.

Die Warteschlange ist ein Übergangszustand und bleibt im laufenden Betrieb leer. Ein Gast legt keine zweite Reise an.

---

## 4. Eine Reise entsteht

`public.reise_anlegen(jsonb)` ist die einzige Stelle, an der eine Reise im Konto entsteht – gleich ob sie aus dem Formular unter `/planen` kommt oder als Gastentwurf aus dem Browser. Zwei Wege wären zwei Stellen, an denen die Prüfung fehlen kann.

Die Funktion legt Reise, Etappen, Tage und Planpunkte **in einer Transaktion** an. Vier Einzelaufrufe von PostgREST wären vier Transaktionen: Bricht der dritte ab, läge eine Reise ohne Tage im Konto, und niemand könnte sagen, ob sie gerade entsteht oder unvollständig ist.

Vier Eigenschaften sind wesentlich:

**`security invoker`.** Die Funktion läuft mit den Rechten des Aufrufers und damit durch die Policies. Ein `security definer` hätte die Prüfung, die schon im Schema steht, in plpgsql wiederholen müssen – und wäre bei jedem künftigen Feld ein zweiter Ort, an dem sie fehlen kann.

**Die Zugehörigkeit kommt aus `auth.uid()`.** Eine mitgeschickte `user_id` liest die Funktion nicht; `status` liest sie ebenfalls nicht, eine neue Reise ist ein Entwurf. Beides sind Angaben, die ein Client machen könnte, und genau deshalb macht er sie nicht. `lib/trips/uebernahme.test.ts` prüft, dass eine untergeschobene `user_id` den Browser nicht verlässt, und `npm run db:sicherheit`, dass die Datenbank sie auch dann nicht übernähme.

**Idempotenz über `unique (user_id, client_ref)`.** `client_ref` ist die Kennung, unter der der Client die Reise angelegt hat – im Browser die Kennung des Entwurfs, im Formular eine je Anlauf erzeugte. Ein zweiter Aufruf mit derselben Kennung legt nichts an und liefert die bestehende Kennung zurück (`on conflict do nothing`, danach ein `select`). Reload, Doppelklick, abgebrochene Antwort, zweiter Login und zwei offene Tabs führen zum selben Ergebnis.

**Fehlermeldungen für Reisende.** Die Funktion wirft `P0001` und `22023` mit Sätzen wie „Eine Reise trägt höchstens 366 Tage." `lib/trips/aktionen.ts` gibt genau diese weiter und übersetzt alles andere in einen allgemeinen Satz – ein SQLSTATE ist keine Auskunft.

---

## 5. Der Weg Gast → Konto

Der Vorgang steht in `lib/trips/uebernahme.ts`, bewusst ohne React: Die Reihenfolge ist die Stelle, an der Arbeit verloren gehen kann, und sie gehört in ein Modul, das ein Test ohne Browser durchspielt. `components/trips/GastreiseBruecke.tsx` ist nur die Anzeige dazu.

1. `zurUebernahme()` liefert alles, was im Browser liegt – die aktive Gastreise zuerst, dann die Warteschlange.
2. Je Entwurf ein Aufruf von `gastreiseUebernehmen()`. **Erst wenn der Server die Kennung gemeldet hat**, verschwindet dieser eine Entwurf aus dem Browser.
3. Beim ersten Fehler bricht der Vorgang ab. Was noch im Browser liegt, bleibt liegen; ein Teilerfolg bleibt ein Erfolg.

Alles auf einmal zu löschen wäre die Annahme, es habe geklappt. Ein Entwurf, der nach einem Abbruch gelöscht ist, ohne im Konto zu liegen, ist verlorene Arbeit, die niemand rekonstruieren kann.

Ein Riegel verhindert zwei gleichzeitige Durchläufe. Er ist nicht für die Datenbank da – die ist idempotent –, sondern für den Browserspeicher: Zwei Durchläufe würden sich beim Aufräumen die Liste gegenseitig unter den Füssen wegziehen.

### Warum die Brücke auf `/reisen` steht

Es gibt fünf Wege in eine angemeldete Sitzung: Login mit Passwort, Login mit zweitem Faktor, Registrierung, OAuth über `/auth/callback` und die Rücksetzung des Passworts. Alle fünf enden auf `/reisen` ([docs/AUTH.md](AUTH.md) Abschnitt 10). Die Übernahme dort einmal zu bauen ist fünf Stellen weniger, an denen sie fehlen kann – und sie greift zusätzlich, wenn keine dieser Stellen beteiligt war: bei einer Sitzung aus einem anderen Tab oder nach einem Versuch, der beim letzten Mal gescheitert ist.

### Was geprüft ist

`lib/trips/uebernahme.test.ts` – 23 Fälle in 8 Gruppen, alle ohne Browser und ohne Datenbank, mit der Server Action als eingesetzter Funktion:

| Lage | geprüft |
| --- | --- |
| Gast ohne Reise | kein Aufruf geht hinaus, kein Hinweis erscheint |
| Gast mit Reise | die Nutzlast trägt den ganzen Graphen; der Entwurf verschwindet erst danach |
| Signup mit Reise | die Reise landet im frischen Konto |
| mehrere Entwürfe aus v2 | aktive Reise und Warteschlange gehen vollständig, die aktive zuerst |
| Fehler und Retry | der Entwurf bleibt liegen; der zweite Anlauf schickt dieselbe `client_ref`; nach dem ersten Fehler geht kein weiterer Entwurf hinaus; ein Teilerfolg bleibt erhalten; eine geworfene Ausnahme sperrt den nächsten Anlauf nicht |
| doppelter Request | zwei gleichzeitige Durchläufe ergeben einen Aufruf je Entwurf |
| bereits übernommen | ein zweiter Durchlauf findet nichts; mehrfacher Login legt keine zweite Reise an |
| Manipulation | untergeschobene `user_id`, untergeschobener `status`, untergeschobene UUID einer Reise im Konto, unlesbarer Eintrag, unmögliche Werte – nichts davon verlässt den Browser |

Dass die Datenbank dieselben Versuche auch dann abweist, wenn ein Angreifer die Server Action direkt aufruft, steht nicht hier, sondern in `npm run db:sicherheit` ([docs/DATENBANK.md](DATENBANK.md) Abschnitt 7).

---

## 6. Die Oberfläche

Drei Adressen, für Gast und Konto dieselben. Der Unterschied entsteht auf dem Server über `auth.getUser()` – nicht über `auth.getSession()`, die auf dem Server nur den Cookie wiedergibt, ohne die Signatur zu prüfen.

| Adresse | Gast | Konto |
| --- | --- | --- |
| `/planen` | legt die eine Gastreise im Browser an | ruft `reiseAnlegen()` und leitet auf die Reise weiter |
| `/reisen` | zeigt den Entwurf mit dem Hinweis, dass er nur in diesem Browser liegt | zeigt die Reisen des Kontos, davor die Brücke |
| `/reisen/[tripId]` | Arbeitsbereich auf dem Browserspeicher | Arbeitsbereich auf der Datenbank, mit Löschen |

Die Kennung entscheidet, wo `/reisen/[tripId]` nachsieht: `trip-<uuid>` ist ein Entwurf im Browser, eine UUID eine Reise im Konto (`istKontoKennung`). Eine Gastkennung bleibt eine Gastkennung, auch in einer angemeldeten Sitzung – sie stillschweigend gegen eine Reise im Konto zu tauschen wäre ein Rätsel für alle, die die Adresse gespeichert haben.

**Eine UUID, die es im Konto nicht gibt, ist eine 404.** Ob sie nicht existiert oder jemand anderem gehört, bleibt offen. RLS liefert in beiden Fällen null Zeilen, und die Seite macht daraus dieselbe Antwort: Wer eine fremde Kennung errät, soll nicht erfahren, dass sie existiert.

**Fehler und Leere sind getrennt.** „Du hast noch keine Reise" nach einem Datenbankausfall ist die falsche Auskunft mit den grössten Folgen – sie sieht aus wie Datenverlust. `lese()` aus `lib/api/datenbank-lesen.ts` unterscheidet beides, und beide Seiten zeigen bei einem Problem eine Fehlermeldung statt eines leeren Zustands, bei 503 mit dem Satz „Deine Reisen sind gespeichert".

**Nach jedem Vorgang im Konto folgt `router.refresh()`.** Den lokalen Zustand weiterzuschreiben wäre schneller und gleichzeitig eine zweite Wahrheit: Die Datenbank hat `position` gesetzt, `updated_at` nachgezogen und vielleicht eine Prüfbedingung angewandt. Was danach auf dem Bildschirm steht, soll das sein, was gespeichert ist.

**Keine Beispieldaten.** Ein leeres Konto zeigt einen leeren Zustand mit dem Weg nach `/planen`. Eine erfundene Reise als Produktzustand wäre eine Behauptung über gespeicherte Daten.

---

## 7. Was diese Phase nicht baut

| Nicht gebaut | Grund |
| --- | --- |
| AI-Reisegenerierung | Phase 2. Das Modell trägt `travel_wish` und `pace`, damit sie später darauf aufsetzen kann |
| Amadeus, Hotels, Aktivitäten | Phase 3. `trip_items.provider`, `external_ref` und `booking_url` sind die Anknüpfung, mehr nicht |
| Anbieter-Abstraktion | erst bei einem zweiten Anbieter ([AGENTS.md](../AGENTS.md) Regel 19) |
| Preisoptimierung, Preishistorie | braucht Anbieterpreise, die es noch nicht gibt |
| Affiliate-Tracking | Phase 4 |
| gemeinsame Reiseplanung | braucht ein Berechtigungsmodell je Reise. Heute ist eine Reise privat, und das ist die einfachere und sicherere Aussage |
| Änderung per natürlicher Sprache | Phase 2. Sie setzt auf denselben Server Actions auf |
| Bearbeiten von Etappen und Reisestammdaten in der Oberfläche | Tabellen, Policies und Bedingungen sind vollständig; die Oberfläche kann heute Planpunkte anlegen und entfernen sowie eine Reise löschen. Etappen entstehen beim Anlegen |

---

## 8. Offene Punkte

| Punkt | Stand |
| --- | --- |
| Titel, Zeitraum und Budget einer bestehenden Reise sind in der Oberfläche nicht änderbar | Schema und Policies erlauben es (`trips_aendern`). Die Oberfläche dazu gehört zum Trip Workspace der Phase 2 |
| Etappen sind nach dem Anlegen nicht bearbeitbar | dasselbe. Eine Reise entsteht mit einer Etappe aus dem Ziel |
| `trip_days.title` wird gespeichert, aber von keiner Oberfläche gesetzt | das Feld trägt die Tagesüberschrift, die die AI-Generierung erzeugen wird |
| Die Liste „Meine Reisen" endet bei 200 Reisen | Vorsichtsmassnahme, keine Produktregel. Blätterung soll bewusst entstehen, nicht als unbemerkt abgeschnittene Liste |
| Ein Gast, der den Browserspeicher leert, verliert seinen Entwurf | Absicht. Ohne Konto gibt es keinen anderen Ort. Beide Gastansichten sagen es ausdrücklich |
| Der Reisegraph wird bei jedem Aufruf vollständig geladen | bei 1000 Planpunkten je Reise vertretbar. Eine Aufteilung braucht einen gemessenen Grund |
