# Explicit Visit History 1 – Self-Review

Stand: 17. September 2026 (Review-Runde 1 eingearbeitet)

Dies ist die Selbstprüfung des implementierenden Agenten. Sie ist **kein**
Technical-Lead-PASS und ersetzt kein unabhängiges Exact-Head-Review.

---

## 1. Was das Review gefunden hat, und was mir daran zu denken gibt

Der erste Head hatte einen Fehler, den ich selbst hätte finden müssen, und er
ist lehrreicher als sein Umfang vermuten lässt.

Ich hatte den Wahrheitsvertrag vollständig in die Serveraktion geschrieben –
Ortsauflösung gegen `public.places`, Kalenderprüfung, Zukunftsausschluss – und
die Tabelle daneben mit `INSERT, UPDATE, DELETE` für `authenticated`
ausgestattet. In meinem Kopf war das „Server schreibt, RLS schützt“. Tatsächlich
war es eine Bitte: PostgREST stellt dieselbe Tabelle unter derselben Sitzung
bereit, und ein angemeldeter Client konnte an der Aktion vorbei „Atlantis, FR,
12.5/13.5, besucht im Jahr 2199“ in sein eigenes Konto schreiben. RLS hätte
zugestimmt, denn das Eigentum stimmte.

Der Satz, den ich mir merke: **RLS schützt, wem eine Zeile gehört, nicht ob sie
wahr ist.** Wo eine Zusage über den Inhalt gilt und der Client dieselbe Tabelle
erreicht, muss die Zusage in der Datenbank stehen.

Zwei weitere Dinge hat das Review mittelbar aufgedeckt:

- Mein lokaler Nachweis maß sich teilweise selbst. Das Bootstrap gab neuen
  Tabellen keine Rechte, also bestand „anon hat kein Recht“ auch ohne jedes
  `revoke`. Der Lauf bildet die Supabase-Voreinstellung jetzt nach und prüft im
  ersten Fall, dass sie wirksam ist – sonst ist jedes folgende „abgelehnt“
  wertlos.
- Beim Beheben des dritten Befunds fiel auf, dass die Ersatzmarke in der
  Kartengrafik lag und mit ihr skalierte, während die Ortsmarken darüber in
  Bildpunkten gesetzt sind. Auf 390 px war der Ring eines geplanten
  Kleinstaats vollständig unter dem Punkt derselben Reise verschwunden: im Baum
  vorhanden, im Bild nicht zu sehen. Eine DOM-Prüfung allein hätte das nie
  gemeldet.

---

## 2. Was ich am aktuellen Head zurückweisen würde

### 2.1 Der Supabase-Development-Nachweis fehlt weiterhin

Unverändert blockiert: `SUPABASE_ACCESS_TOKEN` wird vom Management-API mit
HTTP 401 abgewiesen. Die Migration ist nicht angewendet, die Live-Prüfungen sind
nicht gelaufen. Ich habe das nicht als grün ausgegeben. Der Technical Lead hat
angekündigt, die Live-Verifikation selbst durchzuführen.

### 2.2 `SECURITY DEFINER` ist eine neue scharfe Kante

Drei Funktionen laufen als Eigentümer der Tabelle und sehen RLS nicht. Das ist
der Preis dafür, dass `authenticated` kein Schreibrecht mehr hat, und es ist
der Standardweg in Supabase – aber es ist eine Kante.

Was sie stumpf hält:

- `set search_path = public, pg_temp` in jeder Funktion;
- `auth.uid()` am Anfang, Abbruch bei NULL, Eigentümerkennung nie aus dem
  Aufruf;
- `where id = _id and user_id = _uid` in `aendern` und `widerrufen` – der
  Eigentumsfilter, den RLS hier nicht leisten kann;
- kein dynamisches SQL, keine Textkonkatenation, keine Schleife über Eingaben;
- `EXECUTE` nur für `authenticated`; der gemeinsame Kern für niemanden;
- die Argumente sind Referenzen und Zahlen, nie Geografie.

Trotzdem: jede künftige Änderung an diesen Funktionen ist eine
Sicherheitsänderung und sollte so gelesen werden.

### 2.3 Der Länderkatalog steht jetzt zweimal

Einmal in `lib/country/katalog.ts`, einmal in `public.ist_katalogland`. Das ist
eine Doppelung, und Doppelungen laufen auseinander. Ein Test vergleicht beide
Listen Zeichen für Zeichen, damit es beim Versuch auffällt. Die Alternative –
eine Katalogtabelle – wäre neue Persistenz für eine unveränderliche Liste
gewesen; die Alternative, dem Client zu glauben, war der Befund.

### 2.4 Zeitprüfung steht an zwei Stellen

Kalender und Zukunft prüft die Datenbank; dieselbe Prüfung steht in
`besuche-eingabe.ts`. Das ist Absicht und nicht sparsam: die Anwendung lehnt
früh und mit einem verständlichen Satz ab, die Datenbank lehnt verbindlich ab.
Sie können auseinanderlaufen. Der Preis dafür ist eine Meldung, die nicht ganz
passt – nicht eine falsche Zeile, denn die Datenbank hat das letzte Wort.

### 2.5 Der Audit-Harness ist eine Server-Komponente geworden

`AccountAuditClient` rechnete die Ableitungen im Browser nach und prüfte damit
einen Weg, den es im Produkt nicht gibt: dort kommen sie als Prop vom Server.
Nebenbei stolperte er über `Intl.DisplayNames` – Node und Chromium schreiben
vier Ländernamen verschieden (FK, HK, MO, PS), was beim Hydrieren als
Textabweichung gilt. Der Harness leitet jetzt serverseitig ab wie das Produkt.
Der Dateiname sagt weiterhin „Client“; das ist unschön und ich habe ihn nicht
umbenannt, um den Diff nicht ohne Not zu verbreitern.

### 2.6 Kein Real-Device-Test

Die Sichtbelege stammen aus WebKit und Chromium, nicht von echter Hardware.

### 2.7 Export und Aufbewahrung sind nur dokumentiert

Die Aufgabe erlaubt das ausdrücklich. Kontolöschung wirkt über
`on delete cascade`; ein Kontoexport existiert nicht und die Tabelle ist an
keine Exportroutine angeschlossen.

---

## 3. Entscheidungen, die ein Reviewer kennen muss

### 3.1 Ein Landtreffer wird zurückgeführt, nicht abgelehnt

Das Review liess beides zu. Ich habe die Rückführung gewählt: „ich war in Peru“
ist eine wahre Aussage, und sie zu verweigern, weil der Nutzer das falsche Feld
benutzt hat, wäre Bürokratie. Als Ort gezählt wird sie nicht, eine Ortsmarke
bekommt sie nicht, und das Formular sagt es vorher.

Die Rückführung passiert in der Datenbank, nicht in der Anwendung – sonst wäre
sie wieder nur eine Bitte.

### 3.2 Auch das Löschen läuft über eine Funktion

Ein `DELETE` persistiert keine Unwahrheit; man könnte es direkt erlauben. Ich
habe es trotzdem entzogen, damit über die Tabelle ein Satz gilt, den man sich
merken kann: *für PostgREST-Rollen ist sie lesbar, sonst nichts.* Eine
Ausnahme, die man begründen muss, kostet bei jeder späteren Änderung mehr, als
die dritte Funktion gekostet hat.

### 3.3 Die Ersatzmarken liegen über der Karte

Sie könnten in der Grafik liegen und mit ihr skalieren. Dann sind sie auf einem
Telefon unsichtbar. Sie liegen deshalb in der Ortsmarken-Ebene, behalten ihre
Grösse und stehen vor den Ortsmarken, sodass der Ring den Punkt umschliesst.
Der Preis: auf 390 px sind sie im Verhältnis zur Karte gross. Das ist die
richtige Seite des Kompromisses – eine Marke, die man nicht sieht, ist keine.

### 3.4 Aus Runde 1 unverändert offen zur Entscheidung

- Beschriftungspunkte für 61 Kleinstaaten statt Schweigen (Karte widerspräche
  sonst der Kennzahl);
- `suppressHydrationWarning` auf den Optionen in
  `components/country/LandFeld.tsx` gegen dieselbe ICU-Abweichung – bestehender
  Defekt, den erst diese Seite sichtbar machte;
- kräftigere Grenzlinien (`stroke-brand-800/25` → `/45`), weil die alte
  Deckkraft unter einer Füllung nicht mehr trug.

---

## 4. Die Wahrheitsregeln, einzeln geprüft

| Regel | Wo sie jetzt gehalten wird | Wo sie gemessen wird |
| --- | --- | --- |
| Besucht nur nach ausdrücklicher Bestätigung | `welt-ansicht.ts` kennt den Reisegraphen nicht | Test „vergangene, geplante und archivierte Reisen erzeugen keinen Besuch“ |
| Besuche von vor Jetnity | Jahr ab 1900, kein Reisebezug | DB-Lauf, Fixture 1998 |
| Wiederholte Besuche bleiben Ereignisse | keine Eindeutigkeit über (Konto, Ort) | DB-Lauf, „derselbe Ort darf mehrfach bestätigt werden“ |
| Unvollständige Daten ohne Scheingenauigkeit | Jahr/Monat/Tag einzeln, kein `date` | DB-Checks + Vertrag + `besuchZeitText` |
| Kein Besuch in der Zukunft | Vertrag gegen `now() at time zone 'utc'` | DB-Lauf, Jahr und Monat in der Zukunft |
| Geplant ≠ besucht | zwei Module, zwei Leseergebnisse | „besucht und geplant überschreiben einander nicht“ |
| Nie Geografie aus Text erschliessen | Datenbank liest `public.places`; der Aufruf hat keine Geografie-Argumente | DB-Lauf + Quelltexttest „die Anwendung schickt Referenzen“ |
| Landtreffer ist kein Ort | Vertrag führt `typ='country'` zurück | DB-Lauf + Domänentest |
| Ländercode nur aus dem Katalog | `ist_katalogland` in Check und Vertrag | DB-Lauf + Katalogvergleich mit `lib/country/katalog.ts` |
| Kennzahlen abgeleitet | keine Zählerspalte | DB-Lauf + Test über die Spaltenliste |
| Ohne Ländercode keine Länderzahl | `besuchKennzahlen` | eigener Test |
| Überlagerung sichtbar, auch als Punkt | Füllung + Schraffur, Ring + Doppelring, Wort | Bildbeleg, Lupen, DOM-Messung der Formnamen |
| Grenzen unter jeder Füllung | Zeichenreihenfolge | 153 Farben im 21-px-Fenster über der Grenze |
| Kein externer Kartendienst | erzeugte Geometrie | 14 Aufnahmen, 0 fremde Herkünfte |
| Keine Reisezeile verändert | nur `account_visits` schreibend | DB-Lauf + Quelltexttest |
| anon blockiert | kein Tabellenrecht, kein `EXECUTE` | DB-Lauf, gegen nachgebildete Voreinstellung |
| kein Browser-Service-Role | kein Service-Role-Pfad im Code, kein Tabellenrecht | Quelltexttest + DB-Lauf |

---

## 5. Scope

Nicht angefasst: `components/trips/**`, `lib/reisebegleiter/**`,
`lib/modell/**`, Assistant-Runtime-Dateien aus #435, Provider-, Commercial- und
Payment-Module, Auth-/MFA-/AAL-Semantik, Dokumenten- oder Passpersistenz,
öffentliche Freigabe, Wunschziele, Journal, Standortverfolgung, externe
Kartendienste, ROADMAP/ACTIVE_WORK_STATUS.

Angefasst ausserhalb des primären Scopes, jeweils mit Begründung oben:
`components/country/LandFeld.tsx`, `scripts/account-ui-audit.mjs`,
`scripts/kartografie/weltkarte-geometrie.mjs`, `package.json` (ein Skript),
`types/supabase.ts` (ein Tabellenblock, drei Funktionen).

## 6. Sicherheit

- Neue Tabelle fail-closed: RLS an, eine Lesepolicy, kein Schreibrecht für
  PostgREST-Rollen, `revoke` einzeln gegen `public`, `anon`, `authenticated`
  und `service_role`.
- Schreiben nur über drei `SECURITY DEFINER`-Funktionen mit festgenageltem
  `search_path`, `auth.uid()`-Pflicht und Eigentumsfilter; siehe 2.2.
- Kein Service-Role-Pfad, weder im Browser noch auf dem Server.
- Kein neuer API-Endpunkt; die Server Actions rufen nur die Funktionen.
- Keine sensiblen Daten: keine Notiz, keine Begleitperson, kein Dokument, keine
  Gesundheits- oder Biometriedaten. Der Ortsname stammt aus dem öffentlichen
  Ortskatalog, nicht vom Nutzer.
- Missbrauchskosten: kein Modellaufruf, kein Providerabruf. Wachstum begrenzt
  eine weiche Obergrenze von 1000 Zeilen je Konto.
- Bewusst offene Kante: diese Obergrenze ist nicht serialisiert. Unter
  Parallelität sind einige Zeilen mehr möglich. Sie begrenzt Wachstum und ist
  keine Invariante; der Kommentar in der Migration sagt das.

## 7. Kosten

Keine neuen laufenden Kosten. Keine neue Abhängigkeit, kein Provider, kein
Modellaufruf, kein Kartendienst. Die Ländergeometrie ist erzeugt und liegt im
Repository; zur Laufzeit wird nichts geladen. Der Serverbundle wächst um rund
90 kB, das Client-Bundle nicht messbar.
