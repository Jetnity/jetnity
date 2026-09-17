# Explicit Visit History 1 – Self-Review

Stand: 17. September 2026

Dies ist die Selbstprüfung des implementierenden Agenten. Sie ist **kein**
Technical-Lead-PASS und ersetzt kein unabhängiges Exact-Head-Review.

Gelesen wurde gegen `docs/EXPLICIT_VISIT_HISTORY_1_TASK_2026-09-17.md`, Zeile
für Zeile, mit der Frage: wo würde ich diese Etappe als Reviewer zurückweisen?

---

## 1. Was ich zurückweisen würde

### 1.1 Der Supabase-Development-Nachweis fehlt

Die Aufgabe verlangt „Supabase develop migration applied once“ und „live develop
schema/RLS/policies/grants/advisors verified“. Beides ist **nicht** erbracht.
Der hinterlegte `SUPABASE_ACCESS_TOKEN` wird vom Management-API mit HTTP 401
abgewiesen; jedes `db:*`-Werkzeug bricht ab, bevor es etwas prüft.

Ich habe das nicht als „grün“ ausgegeben und nicht stillschweigend übersprungen.
Ersatzweise liegt ein isolierter Lauf gegen eine lokal aufgesetzte PostgreSQL 16
vor, der dieselbe Migrationsdatei anwendet und RLS, Rechte und jede
Check-Bedingung empirisch misst (26/26). Das ist belastbar, aber es ist nicht
dasselbe: es fehlen die Migrationshistorie des Development-Branches, die
Supabase-Advisors, `auth:pruefen` und die aus dem Live-Schema erzeugten Typen.

**Konsequenz für das Review:** Diese Etappe ist aus meiner Sicht nicht
mergefähig, bevor die Migration auf Development angewendet und die Live-Prüfung
gelaufen ist.

### 1.2 `types/supabase.ts` ist von Hand ergänzt

Die Datei trägt oben „Nicht von Hand ändern“. Ich habe den Block
`account_visits` trotzdem von Hand eingefügt, in der Form, die der Generator
erzeugt, weil sonst TypeScript, `check:schema-bezug` und der Build nichts
prüfen könnten. Das ist eine bewusste, dokumentierte Ausnahme und kein
Versehen. Sie muss durch `npm run db:typen` ersetzt werden, und der Diff dieses
Laufs ist Teil der Abnahme.

### 1.3 Kein Real-Device-Test

Die Sichtbelege stammen aus WebKit und Chromium im Audit-Harness, nicht von
echter Hardware. Wenn die Abnahme einen Real-Device-Test verlangt, ist er offen.

### 1.4 Der Anschluss an Export und Aufbewahrung ist nur dokumentiert

Die Aufgabe erlaubt ausdrücklich, diesen Anschluss zu dokumentieren, statt ihn
zu bauen. Genau das ist passiert: Kontolöschung wirkt über `on delete cascade`
auf `auth.users`; ein Kontoexport existiert noch nicht, und die Tabelle ist an
keine Exportroutine angeschlossen.

---

## 2. Wo ich über den engsten Auftrag hinausgegangen bin

### 2.1 Beschriftungspunkte für Kleinstaaten

Nach dem Vereinfachen bleibt von Singapur, Malta, den Malediven oder Hongkong
auf Weltmassstab keine zeichenbare Fläche übrig – 61 Länder sind betroffen.
Ohne Gegenmassnahme hätte die Karte behauptet, ein bestätigt besuchtes Land sei
nicht besucht, während die Kennzahl daneben es zählt. Eine Karte, die ihrer
eigenen Zahl widerspricht, ist schlimmer als eine ungenaue Karte.

Diese Länder bekommen deshalb eine Ersatzmarke am Beschriftungspunkt des
Datensatzes (`LABEL_X`/`LABEL_Y`, übernommen statt gerechnet), und die Copy sagt
sichtbar, dass sie als Punkt gezeigt werden. Ich halte das für die Erfüllung der
Zusage „visibly distinguish“, nicht für deren Ausweitung – aber es ist eine
Entscheidung, die ein Reviewer kennen muss.

### 2.2 Hydrationsfehler in `components/country/LandFeld.tsx`

`LandFeld` rendert den Länderkatalog serverseitig. Die Namen kommen aus
`Intl.DisplayNames`, und dessen CLDR-Stand ist nicht überall derselbe: Node 22
schreibt „Sonderverwaltungsregion Hongkong“, Chromium 140 schreibt „Hongkong“
(vier Abweichungen gemessen: FK, HK, MO, PS). React liest daraus beim Hydrieren
eine Textabweichung und verwirft die Seite – React-Fehler #418, sichtbar als
Seitenfehler.

Das ist ein **bestehender** Defekt; er betrifft heute schon
`/account/travellers`. Meine Seite hat ihn nur sichtbar gemacht, und die Zusage
„keine Seitenfehler“ liess sich ohne Fix nicht halten. Der Eingriff ist
minimal: `suppressHydrationWarning` auf den Optionen, mit Begründung im Code.
Gespeichert wird ohnehin der Code im `value`, und der ist auf beiden Seiten
identisch; nur die Beschriftung darf abweichen, und beide Fassungen sind
richtige deutsche Namen.

Das ist eine Datei ausserhalb des primären Scopes. Sie steht nicht auf der
Ausschlussliste, und die Alternative wäre gewesen, einen Seitenfehler
auszuliefern und ihn als „bestehend“ zu deklarieren. Ich halte den Fix für
richtig; der Reviewer darf anders entscheiden.

### 2.3 Die Grenzlinien sind kräftiger geworden

`stroke-brand-800/25` → `stroke-brand-800/45`. Unter einer gefüllten Fläche war
die alte Deckkraft nicht mehr zuverlässig als Grenze zu erkennen, und die
Aufgabe verlangt ausdrücklich, dass Grenzen unter jeder Füllung lesbar bleiben.
Das verändert die Grundkarte aus #443/#444 sichtbar, wenn auch geringfügig.

### 2.4 Zwei geänderte Harness-Dateien

`scripts/account-ui-audit.mjs` prüfte `data-world-map-visited="nicht_erfasst"`
und „Besucht bestätigt“. Beides gibt es nicht mehr, weil die Historie jetzt
existiert. Die Zusage ist ersetzt, nicht entfernt: der Audit prüft nun, dass
ohne bestätigte Historie ausschliesslich `geplant` eingefärbt wird.

---

## 3. Die Wahrheitsregeln, einzeln geprüft

| Regel | Wo sie gehalten wird | Wo sie gemessen wird |
| --- | --- | --- |
| Besucht nur nach ausdrücklicher Bestätigung | `welt-ansicht.ts` kennt den Reisegraphen nicht | Test „vergangene, geplante und archivierte Reisen erzeugen keinen Besuch“ |
| Besuche von vor Jetnity | Jahr ab 1900, kein Reisebezug | lokaler DB-Lauf, Fixture 1998 |
| Wiederholte Besuche bleiben Ereignisse | keine Eindeutigkeit über (Konto, Ort) | lokaler DB-Lauf, „derselbe Ort darf mehrfach bestätigt werden“ |
| Unvollständige Daten ohne Scheingenauigkeit | Jahr/Monat/Tag einzeln, kein `date` | DB-Checks + `besuchZeitText` |
| Geplant ≠ besucht | zwei Module, zwei Leseergebnisse | „besucht und geplant überschreiben einander nicht“ |
| Nie Geografie aus Text erschliessen | Server liest `public.places` | „Die Eingabe trägt Referenzen, niemals Geografie“ |
| Kennzahlen abgeleitet | keine Zählerspalte | DB-Lauf + Test über die Spaltenliste |
| Ohne Ländercode keine Länderzahl | `besuchKennzahlen` | eigener Test |
| Überlagerung sichtbar | Füllung + Schraffur + Wort | Bildbeleg + DOM-Messung |
| Grenzen unter jeder Füllung | Zeichenreihenfolge | 15 Farben im 14-px-Fenster über der Grenze |
| Kein externer Kartendienst | erzeugte Geometrie | 14 Aufnahmen, 0 fremde Herkünfte |
| Keine Reisezeile verändert | nur `account_visits` schreibend | DB-Lauf + Quelltexttest |

---

## 4. Scope

Nicht angefasst: `components/trips/**`, `lib/reisebegleiter/**`,
`lib/modell/**`, Assistant-Runtime-Dateien aus #435, Provider-, Commercial- und
Payment-Module, Auth-/MFA-/AAL-Semantik, Dokumenten- oder Passpersistenz,
öffentliche Freigabe, Wunschziele, Journal, Standortverfolgung, externe
Kartendienste, ROADMAP/ACTIVE_WORK_STATUS.

Angefasst ausserhalb des primären Scopes, jeweils mit Begründung oben:
`components/country/LandFeld.tsx`, `components/places/` (nur importiert, nicht
geändert), `scripts/account-ui-audit.mjs`,
`scripts/kartografie/weltkarte-geometrie.mjs`, `package.json` (ein Skript),
`types/supabase.ts` (ein Tabellenblock).

## 5. Sicherheit

- Neue Tabelle fail-closed: RLS an, `revoke all` für `public` und `anon`, Rechte
  nur für `authenticated`.
- Kein Service-Role-Pfad, weder im Browser noch auf dem Server.
- Kein neuer API-Endpunkt; geschrieben wird über Server Actions mit
  `auth.getUser()` und Zod-Prüfung.
- Keine sensiblen Daten: keine Notiz, keine Begleitperson, kein Dokument, keine
  Gesundheits- oder Biometriedaten. Der Ortsname stammt aus dem öffentlichen
  Ortskatalog, nicht vom Nutzer.
- Missbrauchskosten: kein Modellaufruf, kein Providerabruf. Wachstum begrenzt
  eine weiche Obergrenze von 1000 Zeilen je Konto.
- Eine bewusst offene Kante: die Obergrenze ist nicht serialisiert. Unter
  Parallelität sind einige Zeilen mehr möglich. Sie begrenzt Wachstum, sie ist
  keine Invariante, und der Kommentar in der Migration sagt das.

## 6. Kosten

Keine neuen laufenden Kosten. Keine neue Abhängigkeit, kein Provider, kein
Modellaufruf, kein Kartendienst. Die Ländergeometrie ist erzeugt und liegt im
Repository; zur Laufzeit wird nichts geladen. Der Serverbundle wächst um rund
90 kB, das Client-Bundle nicht messbar: die Ländertabelle erreicht kein
Client-Chunk.
