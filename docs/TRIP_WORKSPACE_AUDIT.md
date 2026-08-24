# Jetnity – Trip Workspace / Reiseübersicht Audit

Stand: 24. August 2026  
Status: **docs-only Audit auf `audit/trip-workspace`; nach Current-Main-Sync; kein Runtime-Umbau, kein Mark Ready, kein Merge**  
Code-Evidence-Basis (historisch): `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267` (Admin Slice A)  
Aktueller Integrations-`main` nach Sync: `e3bad749c8e03512001e7bccd5e08467f10a7134` (Admin Slice B)  
Verantwortlicher Cursor-Workstream: `audit/trip-workspace`

`1ec93cc9` ist **nicht** mehr aktueller `main`. Der Workspace-Code-Audit wurde gegen diesen SHA erhoben. Admin Slice B auf `e3bad749` ist Admin-Health, keine Workspace-Runtime. Die Workspace-Befunde bleiben gültig, bis ein späterer Code-Re-Scan sie widerlegt.

> **Dies ist kein fertiger Trip Workspace.**  
> Abschluss dieses Auftrags: Audit und Zielarchitektur sind technisch vorbereitet.

Leitfrage:

> Wie muss Jetnitys Trip Workspace aufgebaut sein, damit ein Nutzer seine komplette Reise an **einem** Ort versteht und steuert, ohne von Funktionen erschlagen zu werden?

---

## 1. Methode und Evidence-Grenze

### 1.1 Was geprüft wurde

- Workspace-Code und Reise-IA gegen `main` @ `1ec93cc9` (historische Evidence-Basis)
- Current-Main-Reconciliation gegen `e3bad749` (Admin Slice B gemergt; keine Workspace-Runtime-Änderung)
- Pflichtlektüre auf `main`
- Governance-Evidence aus **nicht gemergtem** Draft-PR #52, ausdrücklich **nicht** als `main`-Zustand
- vollständiger heutiger Workspace-Code unter `components/trips/`, `lib/trips/`, `app/(public)/reisen*`, `app/(public)/planen`, zugehörige Domain-Module
- bestehende Workspace-Policies als historische/verbindliche Produktregeln, nicht als Ist-Code

### 1.2 Was dieser Audit nicht ist

- kein Redesign-Code
- keine DB-/RLS-/Auth-/Traveller-/Route-/Provider-Vertragsänderung
- keine Account-, Admin- oder Provider-Fachimplementierung
- keine Homepage-Marketingarbeit
- kein Ersatz für den späteren Function-by-Function-Abschlussaudit nach dem Umbau (`docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`)

### 1.3 Dokumentationswidersprüche – zuerst Code

| Aussage | Quelle | Tatsächlicher Code / Git auf diesem Audit |
| --- | --- | --- |
| `main` = Admin Slice A | ursprünglicher Audit-Start / ältere Statusdateien | historisch `1ec93cc9`; **aktueller** `main` ist `e3bad749` (Slice B #46 gemergt) |
| Provider S2 noch Draft #51 | ältere Handoff-/Statusdateien | S2 liegt auf `main` (`52e665ac`) |
| Admin Slice B noch Draft #46 | Statusdateien, die mit Slice B gemergt wurden | #46 ist gemergt als `e3bad749`; Slice-C-Draft #49 bleibt fremd |
| Safety/Seasonal sind im Workspace sichtbar | Foundation-Acceptance-/Handoff-Texte | Production-Pfad übergibt **keine** Evaluations; Karten bleiben unsichtbar |
| Foundation C Readiness nur Development / PR #32 | `docs/REISEN.md` | Readiness/Traveller liegen auf `main` und Production; `docs/REISEN.md` ist veraltet |
| Pace-Chips entfernt | Product-Owner-Handoff §8 | `TripPlanner` speichert weiter `pace` und defaultet auf `balanced` |
| `Jetzt wichtig` existiert | Zielhierarchie im Handoff | **nicht implementiert** |
| PR #52 = aktueller `main` | PR-#52-Body nennt älteren Main-SHA | #52 ist offener Draft; aktueller `main` ist `e3bad749` |

Historische Dokumente bleiben Evidence ihrer damaligen Lage. Sie sind keine heutige Runtime-Wahrheit.

PR #52 (`docs/chatgpt-technical-lead-handoff-2026-08-24`) ist Governance-/Handoff-Evidence und **nicht** gemergt.

`docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md` liegt **nicht** auf diesem `main`. Shared Contracts bleiben beim Account-/Technical-Lead-Workstream.

---

## 2. Verifizierter Projektkontext

### 2.1 Git

- Repository: `Jetnity/jetnity`
- Historische Code-Evidence-Basis: `1ec93cc9f6d70bd57ea054463e4ba8e3822a2267`
- Aktueller Integrations-`main`: `e3bad749c8e03512001e7bccd5e08467f10a7134`
- Dieser Branch: `audit/trip-workspace`, rebase auf diesen `main`

### 2.2 Parallele Workstreams – nicht überschreiben

Beobachtet über GitHub, nicht als Eigentum dieses Audits:

| Workstream | Sichtbarer Cursor-Name | Beobachteter Stand am 24.08.2026 |
| --- | --- | --- |
| Account Platform | `Account plattform audit vorbereitung` | Audit-PR #39; AP-1/AP-2 auf `main`; AP-3 Draft-PR #53 |
| Admin / Control Center | `Admin platform audit` | Slice A+B auf `main` (#44, #46 / `e3bad749`); Slice C Draft-PR #49 |
| Provider Readiness | `Jetnity provider readiness audit` | S1/S2 auf `main`; S3 Draft-PR #54 |
| Technical-Lead-Handoff | – | Draft-PR #52, nicht gemergt |

Dieser Audit darf deren Verträge, Slices und Statusdateien nicht fachlich ersetzen.

### 2.3 Geplante Produktreihenfolge

1. Account + Admin sauber aufbauen, Provider Readiness parallel schließen
2. **danach** Trip Workspace / Reiseübersicht grundlegend überarbeiten ← dieser Audit bereitet Punkt 2 vor
3. danach Homepage weiterentwickeln – **nicht** dieser Scope

---

## 3. Ist-Zustand der Nutzerreise

### 3.1 Reise erstellen

Zwei Einstiege, eine Ablageentscheidung:

1. Öffentliche Startseite → `StartzielForm` → `/planen` mit Ziel/Idee (`app/(public)/page.tsx`)
2. `/planen`: oben freie Beschreibung (`Reiseidee`), darunter Schritt-für-Schritt (`TripPlanner`)

`TripPlanner` erzeugt dieselbe `CreateTripInput`-Form für Gast und Konto:

- Gast: genau eine aktive Reise in `localStorage` (`lib/trips/gastspeicher.ts`)
- Konto: `public.reise_anlegen()` über Server Action

Code-Evidence gegen die bereits getroffene Product-Owner-Regel „Initiale Reiseerstellung vereinfachen“:

- ein Ziel, kein progressives `+ Weiteres Ziel hinzufügen`
- Tempo-Chips bleiben; Default `useState<TripPace>('balanced')` in `components/trips/TripPlanner.tsx`
- Interessen-Chips bleiben
- `travelWish` existiert bereits als optionales Freitextfeld
- `trips.pace` / `trips.interests` werden persistiert und in der Übersicht als „Reiseprofil“ gezeigt

Homepage-Marketingcopy ist nicht Gegenstand. Der **funktionale** Einstieg bis in den Workspace schon, weil er dieselbe Reise-Wahrheit erzeugt.

### 3.2 Reise öffnen / Hub

`/reisen` ist der Hub.

- Gast: `GastReisen` + primär `Reise fortsetzen` (`lib/trips/gast-reisen-cta.ts`)
- Konto: `reisenLaden()` über `lese()`; Fehler ≠ leere Liste
- Guest→Account: `GastreiseBruecke` auf `/reisen`, nicht in den Auth-Formularen
- Account-Übersicht `/account` zeigt nur `TripSummary` / nächste Reise (`lib/account/naechste-reise.ts`) und **kein** Workspace-Dashboard (ADR-0152)

### 3.3 Workspace laden

`/reisen/[tripId]`:

- Gastkennung oder fehlende Session → `GastArbeitsbereich` (Client lädt `localStorage`)
- Konto-UUID + Session → `reiseLaden()`; Problem-Seite bei Lesefehler; `notFound()` bei 0 Zeilen
- Gast-ID bleibt Gast-ID auch in einer angemeldeten Sitzung; kein stiller Tausch gegen eine Konto-Reise

### 3.4 Heutige Workspace-Schale

Eine Komponente für beide Ablagen: `TripWorkspace`.

**Mobile / Tablet &lt; 1024 px** (`ARBEITSBEREICH_DESKTOP_AB_PX`):

1. Link „Meine Reisen“
2. Gast-/Kontohinweis
3. kompakter Reisekopf
4. klebende Horizontal-Tabs: Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität
5. aktiver Bereich; andere besuchte Suchbereiche bleiben gemountet, aber `hidden`/`inert`

**Desktop ≥ 1024 px:**

- Tab-Navigation **entfällt**
- Bereich `uebersicht` wird **nicht gemountet** (`bereichSollMounten`: `if (!kompakt) return bereich !== 'uebersicht'`)
- Safety, Seasonal, Readiness stehen dauerhaft unter dem Kopf
- danach dauerhaft Flüge, Unterkunft, Aktivitäten, Mobilität
- Tagesplan unten
- Änderungsformular dauerhaft sichtbar, nicht hinter einem Toggle

Der aktive Bereich ist **Client-State, nicht URL**. Refresh, Deep-Link und „Zurück“ kennen keinen Fachbereich.

---

## 4. Informationsarchitektur – Ist

```text
REISE
 ├── Kopf (Titel, Etappennamen, Zeitraum, Anzahl Reisende, Budget, Ablage)
 ├── [Desktop] Safety / Seasonal / Readiness   ← nur wenn Evaluations übergeben
 ├── [Mobile] Tabs = technische Domains
 └── Inhalte
      ├── Übersicht (nur Mobile): 4 Bereichskarten + Plan + Safety + Seasonal + Readiness + Ändern + Pace/Interessen
      ├── Flüge: Bestand/Abdeckung + Suche
      ├── Unterkunft: Bestand + Suche
      ├── Aktivitäten: Suche/Übernahme
      └── Mobilität: Verbindungen + Mietwagen (Untertabs)
```

Was **fehlt** als eigene Ebene:

- Reise-Gesamtstatus („wo bin ich in dieser Reise?“)
- eine priorisierte Aufmerksamkeitsschicht
- Etappen-Navigation
- Tagesnavigation als Reise-Orientierung statt nur als Plan-Widget
- Item-Detail als gemeinsame Sprache (heute domain-spezifische Karten)

Was auf der **falschen Ebene** liegt:

| Information | Heute | Fachlich |
| --- | --- | --- |
| Flug-/Hotel-/Aktivitäts-/Mobilitätsstatus | gleichgewichtige Mobile-Hauptbereiche | Item- und Etappen-Ableitung, in der Übersicht nur als Fortschritt |
| Tagesplan | Mobile in Übersicht, Desktop eigener Block unten | Tages-Ebene; Orientierung, nicht gleichwertiger Such-Tab |
| Safety / Seasonal | eigene Karten oder unsichtbar | Reise-Ebene, nur wenn relevant |
| Pace / Interessen | permanente „Reiseprofil“-Karte | Soft Preference, sekundär |
| `trips.travellers` (Zahl) | Kopf als „Reisende“ | Zählfeld; Personenwahrheit ist `party[]` |
| Readiness-Checks | Reisekarte, aufgeklappt nach Gruppe | Mischung aus Reise- und Personen-Ebene; Official bleibt unknown |

---

## 5. Vollständiges Funktionsinventar

Legende Status: **real** = produktiver Pfad vorhanden · **teilweise** = ehrliche Foundation ohne Live-Provider oder ohne Production-Orchestrierung · **stub** = nur Naht/Fallback · **legacy** = ältere Annahme noch sichtbar · **doppelt** = zweite Ableitung oder zweite Fläche

### 5.1 Weg in die Reise

| Name | Nutzerzweck | Ort | Source of Truth | Stand | In Workspace? | Zukunft |
| --- | --- | --- | --- | --- | --- | --- |
| Startziel | Reise beginnen | `StartzielForm` auf `/` | User Input + `places` | real | nein, Einstieg | funktionaler Einstieg später mit Workspace-Block; Homepage-Marketing separat |
| Reiseidee / Modellvorschlag | Freitext → Vorschlag | `Reiseidee`, `lib/reisevorschlag/` | LLM-Erklärung + strukturierte Ausgabe; **keine** Visa/Safety/Preis-Truth | teilweise; Kill Switch / Kontingent | nein | behalten als Einstieg; darf keine Hard Truth erzeugen |
| Planungsfortschritt | Warten erklären | `Planungsfortschritt` | Zeitphasen, keine Providerdaten | real / ehrlich | nein | behalten |
| Schritt-für-Schritt-Formular | Harte Fakten erfassen | `TripPlanner` | User Input | real, aber PO-Regel verletzt (Chips/`balanced`) | nein, erzeugt Graph | im Workspace-Block vereinfachen; nicht in diesem Audit-PR |
| Gast-One-Trip | zweite Reise verhindern | `gastspeicher` | LocalStorage-Regel | real | Hub | bleiben; AP-3 darf Lebenszyklus nicht fachlich überschreiben |
| Konto anlegen | persistente Reise | `reiseAnlegen` / RPC | Trip Graph / DB | real | nein | bleiben |

### 5.2 Hub, Ablage, Übernahme

| Name | Nutzerzweck | Ort | SoT | Stand | Zukunft |
| --- | --- | --- | --- | --- | --- |
| Meine Reisen | Reisen finden / fortsetzen | `/reisen` | Account: DB via RLS; Gast: LocalStorage | real; Error≠Empty auf Konto | Hub bleibt; AP-3 besitzt Lebenszyklus |
| Reisekarte | Reise erkennen | `Reisekarte` | `TripSummary` bzw. Gast-Abbildung | real; Gast zählt `ohneTag` nicht in `itemCount` | angleichen |
| Gastreise-Brücke | Entwurf ins Konto | `GastreiseBruecke` | Trip Graph + Readiness + Party-Übernahme | real; Flug-Handelsfelder fail-closed | bleiben; keine zweite Übernahme im Workspace |
| Account nächste Reise | Zuhause, nicht Kommandozentrale | `/account` | `TripSummary` + Geräte-Kalendertag | real | ADR-0152 unverändert: kein Workspace-Klon |
| Gast laden / fehlt | ehrlicher Leerstand | `GastArbeitsbereich` | LocalStorage | real; Loading vor „gibt es nicht“ | bleiben |
| Konto laden / Fehler | ehrlicher Lesefehler | `reisen/[tripId]/page.tsx` | `lese()` | real | bleiben |
| Entwurf verwerfen / Reise löschen | Ablage leeren | Kopfzeile | Gast: Speicher; Konto: RPC | real | bleiben, nicht primäre Workspace-Aktion |

### 5.3 Workspace-Schale

| Name | Nutzerzweck | Ort | SoT | Stand | Gehört in Workspace? | Zukunft |
| --- | --- | --- | --- | --- | --- | --- |
| Reisekopf | Was ist diese Reise? | `TripWorkspaceKopf` | Trip Graph | real; Personen = Zählfeld | ja, Reise-Ebene | um Gesamtstatus erweitern |
| Mobile-Tabs | Bereich wechseln | `TripWorkspaceNavigation` | Derived UI State | real | ja, aber zu domain-lastig | durch Reise-Navigation ersetzen |
| Übersichtskarten | Fortschritt je Domain | `bereichStatus` | Graph-Ableitungen (Flugabdeckung, Nächte, Aktivitäten-Zählung, Mobilität+Mietwagen, Route-Kompakttext) | real / ehrlich leer | ja als Fortschritt, nicht als Haupt-IA | in Reiseübersicht verdichten |
| Tagesplan | Tag verstehen / Punkt anlegen | `TripWorkspacePlan` | Trip Graph `days` + `ohneTag` | real | ja, Tages-Ebene | bleiben; nicht eigener Haupt-Tab |
| Ungeplante Punkte | nicht verlorene Items | Plan + Domain-Bestände | `trip_items.day_id` null | real | ja | in Timeline sichtbar halten |
| Reise ändern | Hard Facts ändern | `ReiseAenderung` | User Input → `reise_aendern` / Gastgraph | real; Revisions-/Approval-Modell vorhanden | ja, sekundär | hinter klare Aktion, nicht Dauerfläche auf Desktop |
| Änderungsvorschau | Vorher/Nachher | `AenderungVorschau` | Derived aus Vorschlag | teilweise | ja | behalten |
| Einreise & Vorbereitung | Was fehlt offiziell/persönlich | `Reisevorbereitung` | User Readiness + lokale Official-Evaluations | teilweise; Official immer unknown ohne Provider | ja, Reise-/Personen-Ebene | in Aufmerksamkeit priorisieren |
| Sicherheit & Störungen | relevante Events | `ReiseSicherheit` | Safety Evidence | stub im Produktpfad (keine Prop → unsichtbar) | ja, nur wenn relevant | Orchestrierung später; keine neue Safety-Truth |
| Reisezeit & Saison | typischer Timing-Kontext | `ReisezeitHinweise` | Seasonal Evidence | stub im Produktpfad (keine Prop → unsichtbar) | ja, nur wenn erheblich | wie Safety |
| Reiseprofil Pace/Interessen | weiche Präferenzen | Übersicht unten | `trips.pace` / `interests` / `travelWish` | real, aber Soft Preference als feste Karte | sekundär | progressiv, nicht gleichgewichtig |
| `Jetzt wichtig` | Aufmerksamkeit | – | – | **fehlt** | ja, als Priorisierung | TW-Attention, keine neue Truth |
| Assistant im Workspace | erklären | – | LLM | **kein** Workspace-Assistant | nur Erklärung, nie Hard Truth | nicht vorbauen |

### 5.4 Fachbereiche

| Name | Nutzerzweck | Ort | SoT | Stand | Doppelt? | Zukunft |
| --- | --- | --- | --- | --- | --- | --- |
| Flugbestand / Abdeckung | welche Abschnitte fehlen | `FlugBestand`, `flugAbdeckung` | Trip Graph + Route Facts | real / ehrlich unbestimmbar | Übersichtstext leitet dieselbe Abdeckung ab | Item-/Etappen-Detail |
| Flugroute | Segmente verstehen | `FlugRoute` | Foundation-D Itinerary | real, nur bei geprüfter Itinerary | nein | bleiben |
| Flugsuche | Option finden | `FlugSuche` | Provider Commercial; Production aus | teilweise; Guest-Übernahme **fail-closed**; Herkunft defaultet auf `ZRH`, wenn `iataAus(reise.origin)` leer ist | nein | Default entfernen; Origin nur aus Graph/User |
| Hotelbestand / Suche | Nächte / Quartier | `UnterkunftBestand`, `HotelBereich` | Graph + `HotelNachweis` auf Konto | teilweise; Factory `null` | Übersicht nutzt `unterkunftAbdeckung` | Etappen-Ebene |
| Aktivitäten | Tag füllen | `AktivitaetenBereich` | Graph + `ActivityNachweis` | teilweise | Übersicht zählt nur Anzahl | Tages-Ebene |
| Mobilität | A nach B | `MobilitaetBereich` | User-Evidence; Nachweis-Stub | teilweise; Auto-Suche kostenrelevant | Untertabs Verbindungen/Mietwagen | Kanten der Etappe/Tage |
| Mietwagen | Fahrzeug erfassen | `MietwagenBereich` | User-Evidence | teilweise | in Mobilität **und** Übersichtstext | Item-Ebene, nicht eigener Haupt-Tab |
| Buchungssiegel | geplant vs gebucht | `BuchungsSiegel` | `booking_status` + `booking_source=user` | real; kein Provider-Booking | mehrere Bestände | bleiben; Commercial später |
| Manueller Planpunkt | Notiz/Aktivität ohne Provider | Planformular | User Input | real | kann Domain-Items doppelt anlegen | behalten, klar als manuell |
| Coverage/Budget im Kopf | grobes Budget | Kopf | `budgetAmount` oder „Noch offen“ | real; keine Live-Preissumme | Preis an Items separat | keine Fake-Summe |

### 5.5 Traveller / Citizenship / Documents

| Name | Nutzerzweck | Ort | SoT | Stand | Risiko | Zukunft |
| --- | --- | --- | --- | --- | --- | --- |
| Reisendenkontext erfassen | mehrere Citizenships/Dokumente | `Reisevorbereitung` / `dokument-formular` | Traveller Context Child-Tabellen bzw. Gast-`party` | real UI für 1:n | keine neue Registry | UI-Naht vorbereiten; Truth bleibt Foundation E / Account AP-7 |
| Traveller-Slots | Personen vs Zählfeld | `travellerSlots` | `party[]` + `trips.travellers` | real | Kopf zeigt nur die Zahl | Kopf darf nicht eine Citizenship implizieren |
| Official je Traveller | getrennte Bewertung | Readiness-Engine | Official Evidence / fail-closed lokal | teilweise | Legacy-Feld `nationalityCountryCode` existiert noch als Compatibility | keine Neumodellierung hier |
| Gruppenhinweis | keine pauschale Aussage | `individualClaimsForbidden` | Ableitung | real | – | behalten |

### 5.6 Persistenz, Zustände, Audits

| Name | Nutzerzweck | Ort | SoT | Stand |
| --- | --- | --- | --- | --- |
| Konto-Refresh nach Write | eine Wahrheit nach Save | `KontoArbeitsbereich` + `router.refresh()` | DB | real; bewusst keine zweite Client-Truth |
| Gast-In-Memory-Update | sofortige UI | `setReise(...)` | LocalStorage danach | real; Gerät = Ablage |
| Stale Readiness | nach Graph-Änderung erneut prüfen | Fingerprint | Derived | real |
| Unknown Official | keine erfundene Visa-Lage | `officialResult: 'unknown'` | fail-closed | real |
| UI-Audit-Harness | Viewport-Regression | `/ui-audit/trip-workspace` | Fixtures / sessionStorage | **nur Audit**, nicht Produktpfad |
| Deep-Link Bereich | Bereich teilen / zurück | – | – | fehlt |
| Safety/Seasonal/Official-APIs | serverseitige Evaluation | `/api/safety/evaluate`, `/api/seasonal/evaluate`, `/api/readiness/requirements` | jeweilige Evidence-Ports | Routen existieren; **kein** Workspace-Loader ruft sie | später orchestrieren, nicht im Client erfinden |
| Shared `Ladung<T>` | Error≠Empty in Client-Views | `lib/admin/ladezustand.ts` | – | Workspace-Clients nutzen es **nicht**; Server-Listen über `lese()` schon | angleichen, keine zweite Semantik |

---

## 6. Source-of-Truth-Audit

### 6.1 Kanonische Schichten

| Schicht | Was sie dürfen darf | Was sie nicht darf |
| --- | --- | --- |
| User Input | Wünsche, manuelle Punkte, Booking-Häkchen, Citizenships/Dokumente ohne Nummer | Official/Safety/Preis/Verfügbarkeit behaupten |
| Trip Graph | Struktur, Zeiten als Ortszeit, Stages/Days/Items | Provider-Freshness, Visa, Safety |
| Traveller Context | 1 Traveller → n Citizenships → n Documents | eine implizite Staatsbürgerschaft |
| Official / Regulatory | nur Evidence-Port | Browser, LLM, Default-Land |
| Route Evidence | Foundation D, traveller-neutral | aus Titel/Freitext erfinden |
| Provider Commercial | Search/Option nach Nachweis | Guest-Flugpersistenz ohne Nachweis |
| Safety Evidence | eigene Domäne, fail-closed | automatische Reiseänderung |
| Seasonal Evidence | typisches Timing, getrennt von Safety | „gute Reisezeit“ aus Unknown |
| Derived UI State | Tab, Offen/Zu, Priorisierung | neue Fakten |
| LLM | erklären, umformulieren | Hard Truth |

### 6.2 Gefundene Lücken und Doppelungen

| ID | Fund | Schwere | Evidence |
| --- | --- | --- | --- |
| TW-P0-01 | Safety/Seasonal sind im Produktpfad unsichtbar. Fehlende Karte ist von „keine Hinweise“ nicht unterscheidbar. | P0 | `GastArbeitsbereich` / `KontoArbeitsbereich` übergeben keine Evaluations. `safetyAnsicht` / `seasonalAnsicht`: `sichtbar: vorhanden && sichtbare.length > 0` |
| TW-P0-02 | Desktop und Mobile sind zwei Produktlogiken. Desktop hat keine Übersicht. | P0 | `bereichSollMounten` / `bereichSollSichtbar` blenden `uebersicht` ab 1024 px aus |
| TW-P1-01 | Primärnavigation = technische Domains. Nutzer muss Module verstehen, nicht die Reise. | P1 | `ARBEITSBEREICHE` |
| TW-P1-02 | `Jetzt wichtig` fehlt. Alle Bereichskarten sind gleichgewichtig. | P1 | `TripWorkspaceUebersicht` |
| TW-P1-03 | Planner persistiert implizites `balanced` und Tempo-/Interessen-Chips. | P1 | `TripPlanner` vs Handoff-PO-Regel |
| TW-P1-04 | Kopf zeigt `reise.travellers` (Zahl), nicht `party` und nie mehrere Citizenships. | P1 | `TripWorkspaceKopf` |
| TW-P1-05 | Official Evaluations werden lokal fail-closed erzeugt, aber nie serverseitig in den Produkt-Workspace gereicht. | P1 | `readinessAnsicht` Fallback `requirementsLokalFuerReise`; Summary `officialResult: 'unknown'` |
| TW-P1-06 | Guest-Flugübernahme ist korrekt fail-closed; Hotel/Aktivität dürfen Momentaufnahmen speichern. Asymmetrie ist wahr, aber erklärungsbedürftig. | P1 | `flugNachweisFehler('unavailable')` vs `gastHotelUebernehmen` |
| TW-P1-07 | Einstieg ist Einziel; `trip_stages` kann Multi-Destination, UI nicht. | P1 | `CreateTripInput.destination` |
| TW-P1-08 | Flugsuche defaultet Herkunft auf `ZRH`, wenn kein IATA aus `reise.origin` lesbar ist. Das ist ein stiller Ort, keine Graph-Truth. | P1 | `FlugSuche.tsx` `useState(iataAus(reise.origin) \|\| 'ZRH')` |
| TW-P2-01 | Aktiver Bereich / Tag nicht URL-fähig. | P2 | `useState` in `TripWorkspace` |
| TW-P2-02 | Gast-`itemCount` ignoriert `ohneTag`. | P2 | `GastReisen.alsUebersicht` |
| TW-P2-03 | `docs/REISEN.md` und `main`-Handoff/Status sind gegenüber Git veraltet. | P2 | siehe §1.3 |
| TW-P2-04 | Desktop stapelt alle Domains + Plan + Änderung. Hohe Scrolltiefe, keine Master/Detail-Hierarchie. | P2 | `TripWorkspace` Desktop-Zweig |
| TW-P2-05 | Sticky Mobile-Nav + Site-Header + Cards + eingebetteter Plan + drei Intelligence-Karten = hohe Dichte. | P2 | Navigation `sticky top-[calc(72px+...)]` |
| TW-P2-06 | Legacy `nationalityCountryCode` noch in Readiness-Schemas/Kompatibilität. | P2 | `lib/readiness/*`; Workspace-UI nutzt bereits `citizenships[]` |
| TW-P2-07 | Manuelle Planpunkte und Domain-Übernahmen können denselben fachlichen Flug/Transfer doppelt abbilden. | P2 | `TripWorkspacePlan` erlaubt `kind=flight` ohne Nachweis |
| TW-P2-08 | `/api/safety/evaluate`, `/api/seasonal/evaluate`, `/api/readiness/requirements` existieren, werden vom Produkt-Workspace aber nicht aufgerufen. Die Lücke ist Orchestrierung, nicht fehlende Ports. | P2 | keine Treffer in `components/trips/` |
| TW-P2-09 | Workspace-Client-Views nutzen `lib/admin/ladezustand.ts` nicht. Server-Listen über `lese()` sind ehrlich; Client-Suchen erfinden die Error/Empty-Lage jeweils lokal. | P2 | ADR-0040; `GastArbeitsbereich` / Suchbereiche |
| TW-P2-10 | Gast-Workspace synchronisiert nicht über Tabs. Ein zweiter Tab kann LocalStorage schreiben, ohne dass der offene Workspace nachzieht. | P2 | `GastArbeitsbereich` lädt nur im Mount-`useEffect` |
| TW-P3-01 | UI-Audit kann Evaluations injizieren; das ist Fixture, kein Produktbeweis. | P3 | `TripWorkspaceAuditClient` / sessionStorage |
| TW-P3-02 | Weltkarte, Partner-Matching, Reisebuch, Trends: nicht vorhanden, nicht nötig. | P3 | bewusst kein Scope |

### 6.3 Was bereits ehrlich ist – nicht „kaputt reden“

- Konto-Listenfehler ≠ leere Reise
- Gast-Loading ≠ „Reise fehlt“
- Booking `unconfirmed` ≠ `booked`; Source nur `user`
- Route nur aus Itinerary, nicht aus Titel
- Readiness-Häkchen ist ausdrücklich keine Visa-Bestätigung
- Guest-Flug ohne Nachweis wird nicht persistiert
- Konto schreibt nach Save nicht eine zweite Client-Wahrheit
- Safety/Seasonal-Engines sind fail-closed und provider-neutral – sie fehlen in der **Orchestrierung**, nicht als Fake-Healthy-Karten

### 6.4 Placeholder / Fake-Truth

Im **Produktpfad** keine Demo-Hotels, Demo-Flüge oder Fake-Visa gefunden.

Vorhanden und zulässig nur als Audit-Harness:

- `/ui-audit/trip-workspace`
- `ActivitiesAuditClient`
- Playwright-Fixtures

Production-Suchen bleiben aus / unavailable. Das ist ehrlich, darf in der Übersicht aber als Zustand erscheinen, nicht als Abwesenheit.

---

## 7. Multi-Citizenship / Documents

### 7.1 Was der Workspace schon kann

- `TripTraveller.citizenships[]` und `documents[]`
- UI: mehrere Citizenships, mehrere Dokumente, optionale Document↔Citizenship-Relation
- Copy sagt ausdrücklich „Mehrere Staatsbürgerschaften … sind möglich“
- Guest und Account teilen dieselbe Form; Übernahme mappt beide Listen
- Official-Vergleich ist fail-closed ohne option-level Eligibility

### 7.2 Wo der Workspace noch eine Citizenship impliziert oder versteckt

| Stelle | Befund | Aktion dieses Audits |
| --- | --- | --- |
| Reisekopf | nur Zählfeld `travellers` | später UI: Personen, nicht eine Nationalität |
| Übersicht | keine Citizenship-Lage | Aufmerksamkeit darf „Angabe fehlt“ zeigen, nie eine Default-Citizenship |
| Readiness-Engine | Legacy-Singular `nationalityCountryCode` als Compatibility | **keine** Neumodellierung; Account/Traveller-Shared-Contract |
| `officialFuer` Fallback | `destinationCountries[0]` nur als Filterkontext | kein Citizenship-Default; beobachten |
| Account-Traveller-Registry | nicht gebaut (AP-7) | Workspace bleibt trip-spezifisch (ADR-0102) |

Dieser Audit definiert **keine** neue Traveller-Registry, keine DB-Spalten und keine Shared Contracts.

Benötigte spätere UI-Naht (ohne neue Truth):

- Personenliste auf Reise-Ebene aus `party[]`
- progressive Angabe genau der Fakten, die eine Official-Funktion braucht
- getrennte Ergebnisse je Traveller **und** je zulässiger Credential-Option, sobald Official Evidence das trägt
- niemals still Wohnsitz/Abflugland/Sprache als Staatsbürgerschaft

---

## 8. Mobile-first Befunde

Gut bereits vorhanden:

- Touch-Targets überwiegend `min-h-11`
- eine Schale für Gast und Konto
- Suchbereiche mounten erst beim ersten Besuch (keine blinde Hotelsuche in der Übersicht)
- Tagesplan ist kein eigener Tab (ADR-0100)
- „Meine Reisen“ als Rückweg

Schwach:

- Horizontal-Tabs zwingen Domain-Denken
- Sticky Nav + Header frisst Fläche auf iPhone
- Übersicht ist eine lange Kartenliste, kein „in wenigen Sekunden verstehen“
- Safety/Readiness/Seasonal/Plan/Profil/Ändern liegen hintereinander – hohe Scrolltiefe
- Bereichswechsel scrollt zur Tab-Leiste, nicht zur Reise-Orientierung
- kein Sheet-Modell für Item-Detail; Desktop-Inhalte werden mobil 1:1 gestapelt
- aktiver Tag ist nur im Plan-Widget, nicht als Reise-Kontext

Ziel bleibt: der Nutzer soll nicht durch fünf Module, um die Reise zu verstehen.

---

## 9. Desktop-Befunde

Desktop darf mehr Fläche nutzen, hat heute aber eine **andere** Logik:

- keine Übersicht
- alle Suchdomains gleichzeitig
- Intelligence-Karten immer oben (und trotzdem leer, weil Props fehlen)
- Änderungsformular immer offen-bereit

Das verletzt Geräteparität: „gleiche Reise, gleiche Wahrheit, gleiche Kontrolle“. Die Wahrheit der Daten ist gleich, die **mentale** Produktlogik nicht.

Ziel-Desktop: Master/Detail derselben Reise.

- links oder oben: Reise + Etappen/Tage + Aufmerksamkeit
- Mitte: gewählte Ebene (Reise / Etappe / Tag)
- Detail: Item oder Entscheidung
- dieselben Zustände wie Mobile, nur mehr gleichzeitig sichtbar

---

## 10. „Jetzt wichtig“ – Auditentscheidung

**Ja, Jetnity braucht eine priorisierte Aufmerksamkeitsschicht.**  
**Nein, das ist keine neue Source of Truth.**

`Jetzt wichtig` darf nur bereits vorhandene Signale sortieren und begrenzen:

- fehlender notwendiger Traveller-Fakt, sobald Official davon abhängt
- unklare Unterkunftsnächte / unbestimmte Flugabschnitte
- ungeplante kritische Items
- Safety-Evaluation mit `affected` + kritischer Klasse, **nur wenn Evaluation existiert**
- Seasonal nur bei erheblichem `timing_check`
- stale Readiness
- ehrliches `unavailable` / `unknown`, wenn eine erwartete Prüfung nicht gelaufen ist

Es darf nicht:

- Visa erfinden
- „alles in Ordnung“ aus fehlender Karte ableiten
- LLM-Priorität als Fakt speichern
- alle Domain-Karten unter neuem Namen wiederholen

Trennung:

```text
Truth-Layer     = Graph, Traveller, Official, Route, Safety, Seasonal, Commercial
Attention-Layer = Sortierung / Kürzung / nächste Aktion
UI-Layer        = eine ruhige Liste, keine Domain-Taxonomie
```

---

## 11. Proaktive Architektur-/UX-Empfehlung

Nicht mehr sichtbare Buttons. Eine Reise-Oberfläche.

Empfohlenes mentales Modell für den späteren Umbau:

1. **Diese Reise** – Ziel, Zeit, Personen, Ablage, grober Status
2. **Jetzt wichtig** – höchstens wenige Aufmerksamkeitspunkte
3. **Verlauf** – Etappen und Tage als eine Timeline
4. **Details on demand** – Flug, Hotel, Aktivität, Verbindung als Items
5. **Ändern / Suchen** – gezielt, nicht als Dauer-Dashboard

Interne Domains bleiben mächtig. Die Oberfläche spricht Reise, nicht Modul.

Bewusst **nicht** in die Zielarchitektur:

- Weltkarte als Pflicht
- Reisepartner-Matching
- Reisebuch / Trends / Instagram-Hotspots
- zweites Account-Dashboard
- universeller Mega-Typ, der alle Domains vereint

---

## 12. Self-Review dieses Audits

| Frage | Antwort |
| --- | --- |
| Echte Code-Evidence? | Ja. Kernschale, Loader, Planner, Readiness/Safety/Seasonal-Status, Gast/Konto-Orchestrierung gelesen. |
| Zweite Truth erfunden? | Nein. Attention bleibt Ableitung. |
| Account-/Provider-Verträge vorweggenommen? | Nein. AP-*/S3–S8 nur als Abhängigkeiten referenziert. |
| Zielarchitektur zu groß? | Nein. Weniger primäre Module, nicht mehr. |
| Mobile wirklich einfacher? | Nur wenn Tabs nicht mehr die IA sind. Sonst nein. |
| Funktionen übersehen? | Inventar deckt Einstieg, Hub, Schale, Domains, Traveller, Persistenz, Audit-Harness, ungenutzte Evaluate-APIs, `ZRH`-Default. Collaboration-PR #28 ist fremder Draft und nicht in `main`. |
| Stubs als Features? | Safety/Seasonal im Produktpfad als unsichtbar dokumentiert, nicht als live. |
| Domains zu UI-Modulen gemacht? | Als Ist-Befund ja; Zielarchitektur kehrt das um. |
| Multi-Citizenship? | UI ja, Kopf/Zählfeld und Legacy-Feld dokumentiert; keine Neumodellierung. |
| Unknown/Error/Empty/Stale? | Listen/Load ehrlich; Safety-Abwesenheit ist die kritische Lücke. |
| Guest/Account nachvollziehbar? | Ja, gleiche `Trip`-Form, verschiedene Ablage. |
| Datenverlust/Retry? | Konto `clientRef` / Revision vorhanden; nicht in diesem PR verändert. |

---

## 13. Was nicht verändert wurde

Keine Runtime-, Schema-, RLS-, Auth-, Provider-, Secret- oder Homepage-Änderung.

Erlaubt und ausgeführt: Analyse und Dokumentation.
