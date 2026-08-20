# Modell, Kosten und Reisevorschlag

Wie Jetnity aus einer freien Reisebeschreibung einen strukturierten Reiseentwurf macht – und was diesen Weg davon abhält, Geld zu kosten, das niemand freigegeben hat.

Fachliches Reisemodell: [REISEN.md](REISEN.md). Datenbank: [DATENBANK.md](DATENBANK.md). Entscheidungen: [../DECISIONS.md](../DECISIONS.md) ADR-0050 bis ADR-0060.

**Stand:** Phase 2.2. Vorschlag (2.1) und Änderung (2.2) sind implementiert. In der **Preview** sind Schlüssel und Kill Switch gesetzt; **Production bleibt aus**. Warum, steht in Abschnitt 8.

---

## 1. Der Ablauf

```
Freitext (/planen)
  → Eingabe prüfen              lib/reisevorschlag/schema.ts        12 … 2000 Zeichen
    → Modellzustand prüfen      lib/modell/konfiguration.ts         Kill Switch, Schlüssel
      → Routing                 lib/reisevorschlag/routing.ts       Terra Standard, Sol bei Komplexität
        → Kontingent buchen     public.modell_kontingent_beanspruchen()
          → Modell aufrufen     lib/modell/aufruf.ts                Sol 120 s, Terra/Luna 90 s
            → Nutzung abschliessen public.modell_nutzung_abschliessen()
              → Antwort prüfen  lib/reisevorschlag/schema.ts        JSON, Schema, Stimmigkeit
                → Vorgaben      lib/reisevorschlag/vorgaben.ts      eine Korrektur, dann warnungen
                  → Vorschau    components/trips/VorschlagVorschau.tsx
                    → Freigabe  „Übernehmen“
                      → Persistenz  public.reise_anlegen()  bzw.  gastreiseAblegen()
```

Zwei Eigenschaften dieses Ablaufs sind die eigentliche Aussage von Phase 2.1.

**Erstens: Das Modell speichert nichts.** Zwischen „Antwort geprüft“ und „Persistenz“ steht ein Mensch. Ein Vorschlag lebt bis dahin im Zustand einer React-Komponente – nicht in der Datenbank, nicht im Gastspeicher, nicht in einem Zwischentisch (ADR-0050).

**Zweitens: Das Kontingent wird vor dem Aufruf gebucht, nicht nachher gezählt.** Wer nachher zählt, hat den Aufruf schon bezahlt. Einzelheiten in Abschnitt 4.

---

## 2. Die Module

| Datei | Aufgabe | Braucht eine Laufzeit? |
| --- | --- | --- |
| `lib/modell/preise.ts` | Preise je Modell in Mikrodollar, Kostenrechnung, Reservierung | nein |
| `lib/modell/konfiguration.ts` | Kill Switch, Modellwahl, alle Grenzen, Ergebnisklassen | nein |
| `lib/modell/anfrage.ts` | Körper der HTTP-Anfrage an die Responses API | nein |
| `lib/modell/antwort.ts` | HTTP-Status und Antwortobjekt → Ergebnisklasse, Rohtext, Tokennutzung | nein |
| `lib/modell/aufruf.ts` | der eine `fetch`, Abbruch nach 90 s bzw. 120 s bei Sol | ja (`server-only`) |
| `lib/modell/kontingent.ts` | Gastkennung als Cookie, Aufruf der beiden Kontingent-Funktionen | ja (`server-only`) |
| `lib/reisevorschlag/schema.ts` | Zod- und JSON-Schema eines Vorschlags, fachliche Stimmigkeit | nein |
| `lib/reisevorschlag/regeln.ts` | Systemregeln (der einzige Prompt, den Jetnity schreibt) | nein |
| `lib/reisevorschlag/routing.ts` | deterministische Wahl Terra/Sol, Luna nie automatisch | nein |
| `lib/reisevorschlag/vorgaben.ts` | harte Vorgaben lesen und gegen den Plan prüfen | nein |
| `lib/reisevorschlag/fortschritt.ts` | zeitgesteuerte Phasen für die Warteansicht | nein |
| `lib/reisevorschlag/normalisierung.ts` | Steuerzeichen und Preisangaben aus Modelltext entfernen | nein |
| `lib/reisevorschlag/erzeugen.ts` | der Ablauf oben, mit Ports statt Verbindungen | nein |
| `lib/reisevorschlag/abbildung.ts` | Vorschlag → `Trip` (Gast) bzw. `ReiseNutzlast` (Konto) | nein |
| `lib/reisevorschlag/aktionen.ts` | die zwei Server Actions; die einzige Stelle mit echten Verbindungen | ja (`'use server'`) |

Zwölf der fünfzehn Module laufen ohne Serverumgebung, ohne Datenbank und ohne `fetch`. Das ist kein Selbstzweck: Zeitüberschreitung, HTTP 500, erschöpftes Kontingent, abgeschnittene Antwort, kaputtes JSON und schemawidriger Inhalt sind die Fälle, die in Produktion zählen – und mit echten Verbindungen wäre jeder einzelne nur über einen bezahlten Aufruf erreichbar.

Es gibt **keine** Provider-Abstraktion. OpenAI ist der eine Anbieter, `lib/modell/aufruf.ts` die eine Stelle, die ihn kennt ([AGENTS.md](../AGENTS.md) Regel 19).

Phase 2.2 erweitert denselben Unterbau um `lib/reiseaenderung/`: Operationen statt Ersatzreise, gemeinsames Kontingent, Terra/Sol, Vorschau vor dem Speichern. Die Dateien sind in [ARCHITECTURE.md](../ARCHITECTURE.md) Abschnitt 5a aufgeführt.

---

## 3. Modellwahl und Preise

Jetnity benutzt die **Responses API** mit `text.format.type: 'json_schema'` und `strict: true`. Das ist der von OpenAI dafür vorgesehene Weg: Die Plattform garantiert, dass die Antwort dem übergebenen JSON-Schema entspricht.

Jetnity setzt nicht nur ein Modell ein (ADR-0056):

| Modell | Rolle |
| --- | --- |
| `gpt-5.6-terra` | Standard für normale Reiseplanung; Fallback nach Sol-Fehler oder Timeout |
| `gpt-5.6-sol` | komplexe Abwägungen (viele harte Vorgaben, mehrere Ziele, Inseln, Roadtrip, Widerspruch) |
| `gpt-5.6-luna` | nur sehr einfache Hilfsaufgaben; **nie** automatisch für eine komplette Reise |

Die Wahl steht im Freitext (`planungspfad()`), ohne einen zusätzlichen Modellaufruf. `JETNITY_MODELL_NAME` bleibt der manuelle Stift: gesetzt, gewinnt er; leer, entscheidet der Router; unbekannt, bleibt der Weg zu.

| Variable | Vorgabe ohne Stift | Zulässig |
| --- | --- | --- |
| `JETNITY_MODELL_NAME` | leer → Routing, Stift-Fallback `gpt-5.6-terra` | `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-5.6-sol` |
| `JETNITY_MODELL_AUFWAND` | `low` | `none`, `low`, `medium` |

`high`, `xhigh` und `max` sind nicht zugelassen. Der Grund ist nicht Sparsamkeit: `max_output_tokens` begrenzt die Ausgabe **einschliesslich** der Denk-Tokens. Ein Aufruf, der sein Ausgabebudget im Denken verbraucht, endet als `incomplete` – bezahlt, ohne einen Vorschlag geliefert zu haben.

Preise je eine Million Tokens, Stand 18. August 2026 ([developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing), Short-Context-Spalte):

| Modell | Eingabe | Eingabe gecacht | Ausgabe |
| --- | --- | --- | --- |
| `gpt-5.6-luna` | $0.20 | $0.02 | $1.20 |
| `gpt-5.6-terra` | $2.00 | $0.20 | $12.00 |
| `gpt-5.6-sol` | $5.00 | $0.50 | $30.00 |

Was ein Reisevorschlag kostet, bei 2600 Eingabe- und 6000 Ausgabetokens im schlechtesten Fall und geschätzt 2600 / 3500 im Regelfall:

| Modell | schlechtester Fall | Regelfall | Regelfall mit Prompt-Cache |
| --- | --- | --- | --- |
| `gpt-5.6-luna` | $0.0072 | $0.0047 | $0.0044 |
| `gpt-5.6-terra` | $0.0772 | $0.0472 | $0.0436 |
| `gpt-5.6-sol` | $0.1930 | $0.1180 | $0.1090 |

Die Zahl des schlechtesten Falls bleibt die einzige belastbare Obergrenze: Sie wird vor dem Aufruf gebucht (Abschnitt 4). Die gemessenen Läufe vom 19. August 2026 lagen deutlich darunter (Abschnitt 8).

Die frühe Vorgabe `gpt-5.6-luna` (ADR-0051) beruhte auf drei kurzen Fixtures. Die spätere Messung auf fünf vollständigen Planungsfällen hat das geändert: Terra ist das Standardmodell, Sol das Modell für komplexe Abwägungen, Luna plant keine komplette Reise automatisch (ADR-0056, Abschnitt 8). Sol ist nicht immer besser; Terra gewinnt einfache Fälle und ist meist deutlich schneller.

---

## 4. Kostenkontrolle

[AGENTS.md](../AGENTS.md) Regel 17 verlangt für jeden kostenpflichtigen Modellweg zehn Dinge. Wo sie stehen:

| Verlangt | Umsetzung | Ort |
| --- | --- | --- |
| Kill Switch | `JETNITY_MODELL_AKTIV`, nur `true` oder `1` schaltet ein | `lib/modell/konfiguration.ts` |
| Request-Grenze | 4 je Kennung und Stunde | Datenbankfunktion |
| Tagesgrenze | 8 je Kennung, 24 alle Gäste, 38 insgesamt | Datenbankfunktion |
| maximale Eingabelänge | 2000 Zeichen, geprüft vor dem Kontingent | `lib/reisevorschlag/schema.ts` |
| Ausgabegrenze | `max_output_tokens: 6000` | `lib/modell/anfrage.ts` |
| Timeout / Abort | Terra/Luna 90 s, Sol 120 s, eigener `AbortController` | `lib/modell/aufruf.ts` |
| Modellwahl | Routing Terra/Sol, Stift über die Umgebung, sonst aus | `lib/reisevorschlag/routing.ts` |
| Fehler-/Fallback-Verhalten | neun Ergebnisklassen; genau ein Terra-Versuch nach Sol-Fehler | `lib/reisevorschlag/erzeugen.ts` |
| Usage-Logging | `public.model_usage`, eine Zeile je Aufruf | Migration |
| globaler Kostenschutz | $3.00 je Tag, auf Reservierungen | Datenbankfunktion |

### Warum die Schranke in der Datenbank steht

Vercel startet beliebig viele Instanzen. Ein Zähler in einem Serverprozess kennt nur die Aufrufe dieses Prozesses; zehn gleichzeitige Anfragen an zehn Instanzen sähen zehnmal „noch Platz“. Die einzige Stelle, die alle Aufrufe sieht, ist die Datenbank (ADR-0052).

`public.modell_kontingent_beanspruchen()` nimmt zu Beginn `pg_advisory_xact_lock`. Prüfung und Einfügung laufen damit für alle Aufrufer der Reihe nach – dieselbe Bauweise wie die Missbrauchsschranke aus Phase 1.5 (ADR-0049). Ohne diese Sperre wären alle Grenzen dieses Abschnitts Empfehlungen.

### Warum vorher gebucht wird

Die Funktion legt **vor** dem Modellaufruf eine Zeile mit `ergebnis = 'reserviert'` und dem Preis des schlechtesten Falls an. Erst danach darf ein Aufruf geschehen; `public.modell_nutzung_abschliessen()` ersetzt die Schätzung später durch den echten Betrag.

Der Grund ist ein Wettlauf: Zwischen dem Start eines Aufrufs und seinem Ergebnis liegen Sekunden. Ein Deckel, der abgeschlossene Aufrufe summiert, sieht in dieser Zeit einen Stand, der nicht stimmt. Mit der Reservierung ist die Summe zu **jedem** Zeitpunkt eine Obergrenze.

Das gilt auch für den Aufruf, der nie abgeschlossen wird – abgebrochene Verbindung, beendete Instanz, Nutzer schliesst den Tab. Seine Reservierung bleibt stehen und rechnet den schlechtesten Fall. Das ist die sichere Richtung: Sie kostet Kontingent, nicht Geld.

### Die fünf Grenzen

| Grenze | Wert | Wogegen |
| --- | --- | --- |
| je Kennung und Stunde | 4 | der Ungeduldige, der zwanzigmal auf „Entwurf erstellen“ drückt |
| je Kennung und Tag | 8 | dieselbe Person über den Tag |
| alle Gäste und Tag | 24 | rotierende Gastkennungen – sie teilen einen Topf, der kleiner ist als der gesamte |
| insgesamt und Tag | 38 | alles zusammen; hält den Deckel unten allein ein: 38 × $0.0772 = $2.93 |
| Kosten insgesamt und Tag | $3.00 | ein Aufruf, der mehr kostet als geschätzt – etwa nach einem Wechsel auf ein teureres Modell, bei dem niemand `gesamtTag` nachgezogen hat |

Bei $3.00 am Tag sind das höchstens **etwa $90 im Monat** und damit innerhalb der Leitlinie aus [AGENTS.md](../AGENTS.md) Regel 18.

**Die Zahlen stehen zweimal:** in `MODELL_GRENZEN` und in der Migration. Zwei Orte sind einer zu viel, aber die Datenbank setzt sie durch und der Code nicht – und eine Grenze, die im Code höher steht als in der Datenbank, ist keine. `lib/modell/grenzen-datenbank.test.ts` vergleicht beide Seiten bei jedem `npm test`, ohne Datenbank, allein aus dem Migrations-SQL. Ein Auseinanderlaufen ist damit ein roter Test und keine Überraschung im Betrieb.

Aus der Umgebung kommt nur, was eine Umgebung unterscheiden darf: **ob** die Funktion läuft, mit welchem Modell, mit welchem Denkaufwand. Kein Limit ist über eine Umgebungsvariable erhöhbar.

### Der Gast

Ein Gast hat serverseitig bewusst keine Identität (ADR-0042). Eine Schranke „je Kennung“ braucht trotzdem eine, sonst gäbe es für alle Gäste nur eine gemeinsame Zahl, die ein einzelner aufbrauchen könnte.

Deshalb ein Cookie `jetnity_gast`: 32 Hexzeichen, `httpOnly`, `sameSite: lax`, 30 Tage. Kein Konto, keine Zeile, **keine IP-Adresse**. Der Wert steht nirgends im Klartext – in `public.model_usage` landet sein SHA-256.

Der Cookie ist nicht signiert, und das ist kein Versäumnis: Er gewährt nichts, er begrenzt. Ihn zu fälschen bringt nicht mehr als ihn zu löschen, und beides fängt das gemeinsame Tageskontingent der Gäste auf.

Für ein angemeldetes Konto gewinnt `_konto` vom Server, der die Sitzung mit `auth.getUser()` gelesen hat. Die beiden Funktionen sind für `anon` und `authenticated` nicht ausführbar: Ein direkter PostgREST-Aufruf mit dem öffentlichen Key erzeugt keine Reservierung. Gäste ohne Konto bleiben möglich, weil die Server Action die Gastkennung setzt und den Aufruf über `service_role` übernimmt.

---

## 5. Der Vorschlag als untrusted input

Modelltext ist Eingabe von aussen und wird wie jede behandelt ([AGENTS.md](../AGENTS.md) Regel 15, ADR-0053). Vier Schranken hintereinander:

**1. Die Form – `VORSCHLAG_JSON_SCHEMA` mit `strict: true`.** `additionalProperties: false` auf jedem Objekt. Der Vorschlag hat kein `id`, kein `user_id`, kein `status`, kein `provider`, kein `booking_url`, kein `price` – nicht als verbotenen Wert, sondern gar nicht. Ein Feld, das es nicht gibt, muss nicht gefiltert werden.

**2. Die fachlichen Grenzen – `modellvorschlagSchema` (Zod).** Ein Titel mit 400 Zeichen, ein Tag mit der Nummer 99 in einer Reise mit sieben Tagen, eine Etappe von Tag 3 bis Tag 1: alles formgerecht und trotzdem keine Reise. Geprüft werden dieselben Grenzen wie im Reiseschema, dazu die Stimmigkeit: Tage von 1 an ohne Lücke, Etappen lückenlos und ohne Überlappung, `bisTag ≥ vonTag`.

Ein `strict`-Schema ist eine Zusage des Anbieters, keine Eigenschaft von Jetnity. Deshalb wird dieselbe Antwort zweimal geprüft.

**3. Der Freitext – `normalisierung.ts`.** Steuerzeichen fallen weg, Preisangaben ebenso: „Flug ab CHF 412“ wird zu „Flug“. Beträge mit Währung als Code, Symbol oder Wort, in europäischen Schreibweisen einschliesslich „45.– Fr.“.

**4. Die Fassung – `VORSCHLAG_FASSUNG`.** Sie steht im Vorschlag und wird beim Übernehmen geprüft. Ein Tab liegt eine Stunde offen, ein Deployment ändert das Format – ein Vorschlag der alten Fassung wird dann abgelehnt statt halb verstanden.

Beim Übernehmen läuft **dasselbe** Schema noch einmal, denn der Vorschlag kommt aus dem Browser zurück und ist dort veränderbar. Ein Vorschlag mit 400 Tagen, einem Preis im Titel oder einer fremden Kennung kommt nicht durch.

### Prompt-Injection

Die Systemregeln gehen als Nachricht mit der Rolle `system`, der Freitext als eigene mit `user`. Beides zu verketten wäre der direkte Weg, Regeln durch eine Eingabe zu überschreiben.

Der letzte Absatz der Regeln sagt ausdrücklich, dass der Nutzertext eine Reisebeschreibung ist und keine Anweisung. Das ist eine Bitte. Die Schranke ist, dass ein Vorschlag nach dem Schema nichts enthalten **kann**, was über eine Reise hinausgeht: keine Preise, keine Kennungen, keinen Status, keine Links, kein freies Objekt. Ein Modell, das sich vollständig übernehmen lässt, kann höchstens eine unsinnige Reise vorschlagen – die ein Mensch dann verwirft.

Drei Injection-Eingaben stehen als Fixture in `reiseideen.ts` und in den Tests: Regeln ignorieren, Systemregeln ausgeben lassen, HTML und SQL im Text.

### Keine erfundenen Live-Angebote

Phase 3 – Amadeus, Hotels, Aktivitäten – existiert nicht. Bis dahin hat Jetnity keine belastbare Herkunft für einen Preis (ADR-0054):

| Feld | Wert nach der Übernahme |
| --- | --- |
| `trip_items.price_amount`, `price_currency` | `null` |
| `trip_items.provider`, `external_ref`, `booking_url` | `null` |
| `trips.budget_amount` | das Budget**ziel** des Nutzers, wie im Formular unter `/planen` |
| `trips.status` | `planning` – gesetzt von `public.reise_anlegen()`, nicht vom Vorschlag |

Ein genanntes Budget ist ein Constraint, keine Behauptung über einen Gesamtpreis. Das Preisfeld ändert seine Bedeutung nicht: Was dort steht, kommt ab Phase 3 von einem Provider oder von nirgendwo.

**Was diese Schranke nicht kann:** „Dieses Hotel ist noch frei“ ist ein Satz und kein Muster – die Normalisierung erkennt ihn nicht. Dagegen stehen die Systemregeln und die Vorschau, die den Entwurf ausdrücklich als Vorschlag zeigt. Bewusste Grenze, festgehalten in ADR-0054.

---

## 6. Fehlerfälle

Neun Ergebnisklassen stehen in `ERGEBNISKLASSEN` und als `CHECK` auf `model_usage.ergebnis`. Jede bekommt einen Satz, der sagt, was der Mensch davon hat: ob es sich lohnt, es gleich noch einmal zu versuchen, ob ein anderer Text hilft, oder ob heute nichts mehr geht.

| Fall | Klasse | Kontingent verbraucht? |
| --- | --- | --- |
| Kill Switch aus, Schlüssel fehlt, Modell unbekannt | – (`gesperrt`) | nein, geprüft davor |
| Freitext zu kurz, zu lang, leer | – (`eingabe`) | nein, geprüft davor |
| Kontingent oder Kostendeckel erschöpft | – (`gesperrt`) | nein, abgelehnt |
| Zeitgrenze ohne Ergebnis (90 s bzw. 120 s bei Sol) | `zeitueberschreitung` | ja |
| Verbindung abgebrochen, DNS, TLS | `netz` | ja |
| HTTP 400 – 499 | `anbieter-4xx` | ja |
| HTTP 500 – 599 | `anbieter-5xx` | ja |
| Modell verweigert die Antwort | `verweigert` | ja |
| `incomplete` – Ausgabegrenze erreicht | `abgeschnitten` | ja |
| Antwort ist kein JSON | `ungueltige-antwort` | ja |
| Antwort verletzt das Jetnity-Schema | `schema` | ja |

**Ein Modellfehler sieht nie aus wie eine leere Reise.** Jeder Ausgang endet in einem Satz; die Vorschau erscheint nur bei `ok: true`.

**Ein Persistenzfehler löscht keinen Vorschlag.** Scheitert das Speichern – voller Browserspeicher, abgebrochene Verbindung, bereits bestehender Gastentwurf –, bleibt die Vorschau stehen und die Meldung erscheint darüber. Ein Vorschlag, der mit seinem Fehler verschwindet, ist ein verlorener bezahlter Aufruf.

**Doppelklick und Retry ergeben eine Reise, nicht zwei.** `clientRef` entsteht mit dem Vorschlag und bleibt an ihm hängen: im Konto über `unique (user_id, client_ref)` in `public.reise_anlegen()`, im Browser über die Kennungsprüfung in `gastreiseAblegen()`. Die Idempotenz aus Phase 1.5 wird benutzt, nicht nachgebaut. Ein Reload während einer nicht übernommenen Vorschau verwirft den Vorschlag bewusst – er lebt nur im Komponentenzustand (ADR-0050).

**Verlässt der Nutzer die Seite während der Generierung,** endet die Server Action ohne Empfänger. Die Reservierung bleibt stehen; ein Zähler `anlauf` in `Reiseidee.tsx` verhindert zusätzlich, dass eine langsame erste Antwort eine schnellere zweite überschreibt.

---

## 7. Usage-Protokoll und Datenschutz

`public.model_usage`, eine Zeile je Aufruf. Was drinsteht:

| Spalte | Inhalt |
| --- | --- |
| `funktion` | `reisevorschlag` oder `reiseaenderung` – dieselbe Schranke, zwei Bezeichnungen |
| `modell` | `gpt-5.6-luna` usw. |
| `art` | `konto` oder `gast` |
| `kennung_hash` | SHA-256 der Kontokennung oder der Gastkennung, 64 Hexzeichen |
| `ergebnis` | `reserviert` oder eine der neun Klassen |
| `eingabe_tokens`, `gecachte_tokens`, `ausgabe_tokens` | soweit die API sie berichtet, sonst `null` |
| `laufzeit_ms` | Dauer des Aufrufs |
| `kosten_mikro_usd` | Reservierung, nach Abschluss der echte Betrag |
| `created_at`, `abgeschlossen_am` | Zeitpunkte |

Was **nicht** drinsteht: die Reisebeschreibung, der Vorschlag, der Prompt, die Antwort, eine IP-Adresse, eine E-Mail-Adresse, ein Schlüssel. Ein Kostenprotokoll braucht Kosten, keine Reiseinhalte.

`null` bei den Tokens bedeutet „nicht berichtet“ und nicht „null Tokens“. Der Unterschied ist Geld: Auf `null` bleibt der reservierte Betrag stehen, auf `0` würde ein bezahlter Aufruf als kostenlos gelten.

Der Hash ist keine Anonymisierung, sondern eine Pseudonymisierung – wer eine Kennung kennt, kann ihren Hash bilden. Er verhindert, dass das Protokoll selbst eine Liste von Kontokennungen ist, und reicht für seinen Zweck: Aufrufe je Kennung zählen.

**Rechte.** RLS ist eingeschaltet. Eine Policy: `select` für `authenticated` mit `public.darf_betrieb_lesen()` – ab `moderator`. `anon` hat auf der Tabelle **kein** Recht, auch kein `insert`. Die beiden Funktionen sind nur für `service_role` ausführbar; ein Gast schreibt nicht selbst, sondern über die Server Action. Niemand kann eine Zeile ändern oder löschen, auch der Betrieb nicht: Ein Kostenprotokoll, das sein Eigentümer aufräumen kann, ist keins.

**Retention.** Es gibt **keine** automatische Löschung. Das ist bewusst und für Phase 2.1 vertretbar – die Tabelle wächst um höchstens 38 Zeilen am Tag, also unter 14 000 im Jahr, und enthält keine Reiseinhalte. Eine Aufbewahrungsfrist gehört zu der Entscheidung, die Funktion in Production einzuschalten, und ist als offener Punkt in [ROADMAP.md](../ROADMAP.md) vermerkt.

---

## 8. Aktivierung

Drei Dinge müssen zusammenkommen, sonst ruft `modellZustand()` nichts auf und nennt den Grund:

| Variable | Nötiger Wert |
| --- | --- |
| `JETNITY_MODELL_AKTIV` | `true` oder `1` |
| `OPENAI_API_KEY` | ein Schlüssel mit Zugang zur Responses API |
| `JETNITY_MODELL_NAME` | leer (dann Routing, Stift-Fallback `gpt-5.6-terra`) oder eines der drei Modelle |
| `SUPABASE_SERVICE_ROLE_KEY` | serverseitig; ohne ihn kann die Server Action kein Kontingent buchen |

Fehlt etwas, ist das kein Laufzeitfehler, sondern der Normalzustand einer Umgebung, in der die Funktion nicht laufen soll. Die Oberfläche sagt es ehrlich. Das Formular unter `/planen` bleibt vollständig benutzbar.

**Preview:** `OPENAI_API_KEY` (Sensitive) und `JETNITY_MODELL_AKTIV=true` sind gesetzt. Das OpenAI-Projekt *Jetnity Development* hat ein Hard Spend Limit von $5. Production bleibt ohne Aktivierung.

**Production** hat keinen Kill Switch. Die Modellwahl ist gemessen; die Freigabe in Production bleibt eine eigene Entscheidung.

Es gibt keine `NEXT_PUBLIC_OPENAI_*`-Variable und keinen Modellaufruf im Browser. Der Schlüssel wird in `lib/modell/aufruf.ts` gelesen und verlässt diese Datei nicht; er steht in keinem Rückgabewert, keiner Fehlermeldung und keinem Protokoll.

### Früher Vergleich terra / luna (drei Fixtures)

Gemessen am 19. August 2026 mit `npm run modell:probe`, dieselben Fixtures, dasselbe Schema, dieselbe Kostenschranke, `reasoning.effort: low`. Der Lauf gehört nicht in die CI. Diese drei Ideen haben die Vorgabe Luna begründet; sie reichen nicht als Qualitätslinie für eine komplette Reiseplanung (ADR-0056).

| Modell | Idee | Laufzeit | Tokens ein (gecacht) | Tokens aus | Kosten | Abbildung |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `gpt-5.6-terra` | 1 vollständig | — | — | — | — | Klasse `erfolg`, Abbildung geprüft |
| `gpt-5.6-terra` | 2 mehrere Ziele | — | — | — | — | 3 Etappen, 14 Tage, 51 Punkte, Klasse `erfolg` |
| `gpt-5.6-terra` | 7 unbestimmt | 7 123 ms | 1 595 (1 578) | 389 | USD 0.0050 | 1 Etappe, 3 Tage, 7 Punkte, Klasse `erfolg` |
| `gpt-5.6-luna` | 1 vollständig | 10 874 ms | 1 611 (0) | 1 290 | USD 0.0019 | 1 Etappe, 7 Tage, 26 Punkte, Klasse `erfolg` |
| `gpt-5.6-luna` | 2 mehrere Ziele | 16 717 ms | 1 612 (1 578) | 2 104 | USD 0.0026 | 3 Etappen, 14 Tage, 42 Punkte, Klasse `erfolg` |
| `gpt-5.6-luna` | 7 unbestimmt | 7 030 ms | 1 595 (1 578) | 695 | USD 0.0009 | 1 Etappe, 4 Tage, 12 Punkte, Klasse `erfolg` |

Terra-Idee 1 und die Kostenzeile von Terra-Idee 2 sind im lokalen Terminal-Scrollback nicht mehr vollständig; beide Läufe endeten laut Abschlusszeile mit Klasse `erfolg` und geprüfter Abbildung. Die drei Luna-Läufe zusammen: **USD 0.0054**. Terra-Idee 7 allein: **USD 0.0050**. Das hat die frühe Vorgabe Luna erklärt. Die spätere Messung auf fünf vollständigen Fällen hat die Strategie geändert.

### Vergleich Sol / Terra (fünf Planungsfälle)

Dieselbe Struktur, `reasoning.effort: low`. Qualität von Hand bewertet, nicht automatisch. Sol ist **nicht** immer besser.

| Fall | Sol Laufzeit / Kosten / Punkte | Terra Laufzeit / Kosten / Punkte | Qualität |
| --- | --- | --- | --- |
| Japan | 47 303 ms / USD 0.0538 / 38 | 23 335 ms / USD 0.0247 / 40 | Terra knapp besser |
| Vietnam, komplex | 87 881 ms / USD 0.1503 / 65 | 41 172 ms / USD 0.0421 / 60 | Sol besser |
| Griechenland, Inseln | 52 215 ms / USD 0.0748 / 45 | 34 314 ms / USD 0.0314 / 52 | Sol besser |
| Kalifornien, Roadtrip | 68 809 ms / USD 0.1002 / 58 | 40 548 ms / USD 0.0349 / 47 | Sol knapp besser |
| Italien, widersprüchlich | 50 089 ms / USD 0.0656 / 30 | 33 392 ms / USD 0.0279 / 33 | praktisch Gleichstand, Sol minimal besser |

Zwei zuvor vermutete Budgetabweichungen waren **keine** Modellfehler. Die falschen Beträge standen bereits im per Hand kopierten Testprompt.

Schlussfolgerung: Terra ist das Standardmodell. Sol liefert bei komplexen Abwägungen häufiger die bessere Gesamtentscheidung. Deshalb Routing statt eines Modells für alles (ADR-0056).

Während ein solcher Lauf 50–100 Sekunden braucht, zeigt `/planen` zeitgesteuerte Phasen („Wünsche werden verstanden“, Route, Transferlogik, Tagesplan, Prüfung). Keine erfundenen Prozente, keine Flugpreise, solange keine Providerdaten angebunden sind.

`npm run modell:probe` läuft **nie** in der CI.

---

## 9. Tests

Tests ohne einen einzigen Modellaufruf, in zwölf Dateien der Modell- und Vorschlagsschicht:

| Datei | Deckt ab |
| --- | --- |
| `lib/modell/preise.test.ts` | Kostenrechnung, Cache-Abzug, Aufrunden, Reservierung |
| `lib/modell/konfiguration.test.ts` | Kill Switch in jeder Schreibweise, fehlender Schlüssel, unbekanntes Modell, 90/120-s-Grenzen |
| `lib/modell/antwort.test.ts` | jeder HTTP-Status, `incomplete`, `refusal`, fehlende Tokennutzung, kaputte Antwortformen |
| `lib/modell/grenzen-datenbank.test.ts` | jede Zahl aus `MODELL_GRENZEN` gegen das Migrations-SQL |
| `lib/reisevorschlag/schema.test.ts` | Eingabeprüfung, Ausgabeschema, Stimmigkeit, Umfangsvergleich Zod ↔ JSON-Schema, Injection-Eingaben |
| `lib/reisevorschlag/normalisierung.test.ts` | Preisangaben in Schreibweisen, Steuerzeichen, was bewusst stehen bleibt |
| `lib/reisevorschlag/abbildung.test.ts` | Vorschlag → Reisegraph, Daten aus dem Startdatum, `null` in allen Provider- und Preisfeldern |
| `lib/reisevorschlag/routing.test.ts` | Terra/Sol aus dem Text, Luna nie automatisch, Stift sticht |
| `lib/reisevorschlag/vorgaben.test.ts` | harte Vorgaben lesen und gegen den Plan prüfen |
| `lib/reisevorschlag/fortschritt.test.ts` | Phasen ohne Prozente und ohne Providerdaten |
| `lib/reisevorschlag/erzeugen.test.ts` | der ganze Ablauf, Fallback, eine Korrektur, Reihenfolge von Buchen und Abschliessen |
| `lib/reisevorschlag/uebernahme.test.ts` | Vorschau ohne Persistenz, Übernahme mit, Doppelklick, Persistenzfehler, Manipulation im Browser |

Die Fixtures liegen in `lib/reisevorschlag/fixtures/`: dreizehn Reiseideen als Eingaben, Modellantworten als Ausgaben. Die Ideen sind **keine** erwarteten Ausgaben – was ein Modell daraus macht, prüft kein Test, denn das wäre eine Prüfung des Modells und kostete je Lauf Geld. Geprüft wird, was Jetnity mit einer Antwort tut.

Gegen die echte Datenbank laufen **16 Nachweise** über `npm run db:kontingent`: je einer für die Grenze und den ersten Aufruf darüber, für jede der fünf Grenzen, dazu die Behandlung der Kennungen, der Abschluss in vier Varianten und die Parallelität. Der Parallelitätsnachweis lässt sechs gleichzeitige Sitzungen auf einen freien Platz laufen und belegt, dass genau eine durchkommt – ohne `pg_advisory_xact_lock` kämen alle sechs durch.

---

## 10. Was Phase 2 nicht enthält

| Nicht gebaut | Wohin es gehört |
| --- | --- |
| Amadeus, Flugpreise, Hotels, Aktivitäten | Phase 3 |
| Buchungslinks, Affiliate-Tracking, Preisvergleich | Phase 3 / Monetarisierung |
| ein zweiter Modellprovider | nicht vorgesehen (Regel 19) |
| Sprache als Eingabe (Voice) | nicht vorgesehen |
| Aktivierung in Production | eigene Entscheidung, Abschnitt 8 |
