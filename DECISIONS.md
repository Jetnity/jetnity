# Jetnity – Entscheidungsprotokoll

Alle wichtigen technischen und produktnahen Entscheidungen. Neueste Einträge unten anfügen. Format je Entscheidung: Datum, Entscheidung, Kontext, Alternativen, Begründung, Konsequenzen ([AGENTS.md](AGENTS.md) Regel 6).

Eine hier dokumentierte, freigegebene Entscheidung hat Vorrang vor bestehendem Code.

---

## ADR-0001 – Jetnity V2 ist die maßgebliche Produktrichtung

**Datum:** 15. August 2026
**Status:** freigegeben

**Entscheidung:** Das Master-Briefing zu Jetnity V2 ist die Produktspezifikation. Das bestehende Repository ist technische Ausgangsbasis, nicht Spezifikation. Der Inhalt ist in [JETNITY_VISION.md](JETNITY_VISION.md) festgehalten.

**Kontext:** Das Repository enthielt eine ältere, deutlich breitere Produktidee (Creator-Plattform, Media Studio, Social- und Content-Funktionen, viele Transportkategorien). Diese Richtung wurde verworfen.

**Alternativen:** Altes Produkt weiterbauen; kompletter Neuaufbau im leeren Repository.

**Begründung:** Der bestehende Stack, das Auth-Setup, die Supabase-Anbindung und die Build-Infrastruktur sind brauchbar. Die Produktidee ist es nicht. Ein Neuaufbau würde funktionierende Infrastruktur ohne Not verwerfen.

**Konsequenzen:** Bestehender Code wird gegen die Vision geprüft, nicht umgekehrt. Alt-Module werden abgebaut statt weiterentwickelt.

---

## ADR-0002 – `codex/jetnity-v2-foundation` wird die neue Basis

**Datum:** 15. August 2026
**Status:** freigegeben, umgesetzt

**Entscheidung:** Der V2-Branch wird die neue technische Basis. `main` in seiner damaligen Form ist nicht mehr die maßgebliche Produktarchitektur.

**Kontext:** Der Branch enthielt die neue öffentliche Produktschicht (Startseite, `/planen`, `/reisen`, Trip Workspace) sowie zwei TypeScript-Korrekturen, die auf `main` fehlten. Er lag als einzelner Commit auf `main` auf, ein Fast-Forward war ohne Konflikte möglich.

**Alternativen:** V2-Features einzeln nach `main` zurückportieren.

**Begründung:** Ein Fast-Forward ohne Konflikte ist risikoärmer als manuelles Zurückportieren. Es gehen keine V2-relevanten Funktionen verloren.

**Konsequenzen:** Der Stand vor dem Umbau ist über den Tag `archive/jetnity-v1-main` jederzeit wiederherstellbar.

---

## ADR-0003 – Archiv-Tag vor Alt-Code-Entfernung

**Datum:** 15. August 2026
**Status:** freigegeben, umgesetzt

**Entscheidung:** Vor größeren Löschungen wird der alte Stand über einen Git-Tag gesichert. Tag: `archive/jetnity-v1-main`.

**Alternativen:** Archiv-Branch; kein Archiv, weil die Historie ohnehin erhalten bleibt.

**Begründung:** Ein benannter Tag ist auffindbar, ohne dass ein Branch aktiv gepflegt werden muss. Er dokumentiert eindeutig, welcher Zustand als „altes Jetnity" gilt.

**Konsequenzen:** Alt-Code darf entfernt werden, ohne dass Wissen verloren geht. Entfernungen erfolgen in mehreren nachvollziehbaren Commits, nicht in einem großen Sammel-Commit.

---

## ADR-0004 – Node-Engine auf `>=20.9` und Lockfile-Synchronisierung

**Datum:** 15. August 2026
**Status:** historisch / **superseded durch ADR-0188** (28. August 2026)

**Entscheidung:** `engines.node` lautet `>=20.9`. `package-lock.json` wurde mit `package.json` synchronisiert. `simple-swizzle` ist über `overrides` auf `0.2.2` gepinnt.

**Kontext:** `npm ci` schlug fehl, weil Lockfile und `package.json` auseinanderliefen. Die vorherige Angabe `>=18.17 <21` schloss die von Vercel und CI genutzten Node-Versionen aus. Die Korrektur an `simple-swizzle` existierte nur im Lockfile und wäre bei jedem `npm install` verloren gegangen.

**Alternativen:** Node-Version im CI herunterpinnen; Lockfile löschen und neu erzeugen.

**Begründung:** Die Laufzeitumgebung soll die Realität abbilden statt eine veraltete Einschränkung. Ein `override` macht die Absicht explizit und überlebt Neuinstallationen.

**Konsequenzen:** `npm ci` ist reproduzierbar. Ein reproduzierbares `npm ci` ist Voraussetzung für CI.

**Nachtrag, 28. August 2026:** Der breite Range `>=20.9` ist nicht mehr Current Truth. Vercel interpretierte ihn als Freigabe für Node 24 und zeigte `Node.js Version Override`, obwohl Projekt und CI bereits `22.x` nutzen. Der verbindliche Runtime-Vertrag ist jetzt ADR-0188. `simple-swizzle` via `overrides` bleibt unverändert.

---

## ADR-0005 – CI mit Fail-Closed-Setup-Check

**Datum:** 15. August 2026
**Status:** umgesetzt

**Entscheidung:** GitHub Actions (`.github/workflows/ci.yml`) führt bei Push auf `main` und bei jedem Pull Request aus: `npm ci`, Setup-Check, Typecheck, Lint, Production-Build. Für CI existiert `npm run check:setup:ci`, das im Fehlerfall abbricht.

**Kontext:** Es gab keine automatisierte Absicherung. Regressionen wären erst im Deployment aufgefallen.

**Alternativen:** Nur lokale Prüfungen; zusätzlich einen kostenpflichtigen Quality-Dienst.

**Begründung:** GitHub Actions ist im vorhandenen Plan enthalten und verursacht keine zusätzlichen laufenden Kosten. Der reguläre Setup-Check ist absichtlich tolerant, damit lokale Entwicklung ohne Produktionswerte möglich bleibt; CI braucht das Gegenteil.

**Konsequenzen:** Ein Merge ohne grünen Build wird sichtbar. Erfüllt [AGENTS.md](AGENTS.md) Regel 25.

---

## ADR-0006 – Kein Refactoring von Alt-Code, der entfernt wird

**Datum:** 15. August 2026
**Status:** freigegeben

**Entscheidung:** Code wird unterschieden in **V2-relevant** (absichern, refactoren, testen) und **Alt-Code** (sicher außer Betrieb nehmen und entfernen). Alt-Code wird nicht modernisiert, wenn er anschließend entfernt wird.

**Kontext:** Die Sicherheitsanalyse fand kritische Schwachstellen in Abhängigkeiten, die ausschließlich von Alt-Code genutzt werden (`html2pdf.js`/`jspdf`, `sharp`), sowie ungeschützte KI-Endpunkte in der Creator- und Media-Welt.

**Alternativen:** Alles zuerst absichern, dann entfernen.

**Begründung:** Aufwand in Code zu investieren, der kurzfristig verschwindet, verzögert den Produktkern ohne Sicherheitsgewinn. Die Abschaltung beseitigt das Risiko vollständig statt es zu verkleinern.

**Konsequenzen:** Sicherheitsbefunde in Alt-Code werden dokumentiert und durch Abschaltung gelöst, nicht durch Härtung. Solange Alt-Endpunkte noch erreichbar sind, bleibt das Risiko bestehen und ist als offenes Risiko zu führen.

---

## ADR-0007 – V2-Farbwelt als zentrale Design-Tokens

**Datum:** 15. August 2026
**Status:** freigegeben, umgesetzt

**Entscheidung:** Die 87 in der V2-UI hartkodierten Hex-Werte wurden zu 27 Tokens in fünf Familien zusammengeführt: `brand`, `citrus`, `surface`, `line`, `ink`. Tokens stehen als RGB-Kanäle in `styles/globals.css` und werden in `tailwind.config.js` über `rgb(var(--jet-*) / <alpha-value>)` gemappt.

**Kontext:** Die V2-Optik war visuell stimmig, aber technisch nicht wartbar. Es existierten zahlreiche Fast-Duplikate derselben Farbe.

**Alternativen:** Hex-Werte belassen; nur eine flache Liste ohne semantische Familien; Farbnamen an Tailwinds Standardpalette anlehnen.

**Begründung:** Semantische Familien machen die Verwendung eindeutig. Die RGB-Kanal-Notation ist notwendig, damit Opacity-Modifier funktionieren – mit Hex-Werten in Custom Properties wären transparente Flächen deckend geworden. Die Familie heißt `citrus` statt `lime`, weil `lime` mit Tailwinds eingebauter Palette kollidiert und bestehende Klassen wie `to-lime-400` still verändert hätte.

**Zusammenführung:** Nur perzeptuell nahe Werte wurden zusammengelegt. Größter Abstand ΔE76 4.53, ausschließlich bei kleinen Textfarben und 1px-Linien; Flächen bleiben unter ΔE76 1.9. Die visuelle Erscheinung bleibt damit erhalten.

**Konsequenzen:** Neue Komponenten verwenden Tokens. Neue Fast-Duplikate sind nicht zulässig. Details in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

---

## ADR-0008 – shadcn-Tokens werden auf die V2-Farbwelt umgestellt

**Datum:** 15. August 2026
**Status:** freigegeben, noch nicht umgesetzt

**Entscheidung:** Die shadcn-Basistokens (`--primary`, `--accent`, `--ring`, `--secondary` usw.) werden von der alten blau/violetten Farbwelt auf die V2-Farbwelt umgestellt.

**Kontext:** Diese Tokens stammen aus der alten Produktwelt und widersprechen der verbindlichen Designrichtung („kein Blau, kein Violett"). Sie werden von Radix-/shadcn-Komponenten genutzt, unter anderem in Formularen und Fokus-Ringen.

**Alternativen:** shadcn-Tokens unverändert lassen und nur in V2-Komponenten V2-Tokens nutzen; shadcn-Komponenten vollständig ersetzen.

**Begründung:** Zwei parallele Farbwelten führen zwangsläufig zu blauen Fokus-Ringen und Buttons in V2-Oberflächen. Ein vollständiger Komponentenersatz wäre deutlich aufwendiger und ist vor dem Produktkern nicht gerechtfertigt.

**Konsequenzen:** Alt-Oberflächen ändern ihr Aussehen sichtbar. Das ist akzeptiert, weil sie ohnehin abgebaut werden. Die Umstellung erfolgt als eigener, separat prüfbarer Schritt.

---

## ADR-0009 – Gastmodus bleibt erlaubt

**Datum:** 15. August 2026
**Status:** freigegeben

**Entscheidung:** Jetnity ist ohne Konto nutzbar: Reiseidee eingeben, Vorschlag erhalten, Reise bearbeiten. Ein Konto wird für dauerhaftes Speichern, Geräte-Synchronisierung, mehrere Reisen, Präferenzen und gemeinsame Planung benötigt. Gastreisen werden bei Registrierung oder Login in das Konto übernommen.

**Kontext:** Eine Registrierungspflicht vor dem ersten Nutzen würde die Kernidee („eine Idee wird zur Reise") hinter eine Hürde stellen.

**Alternativen:** Registrierung vor Nutzung; anonyme Server-Sessions statt lokalem Speicher.

**Begründung:** Der Wert von Jetnity muss vor der Registrierung erlebbar sein. `localStorage` ist für den Gastmodus ausdrücklich zulässig, sofern die Daten später sauber migriert werden können ([AGENTS.md](AGENTS.md) Regel 13).

**Konsequenzen:** Es braucht einen expliziten Migrationspfad von Gast zu Konto. Das Trip-Schema muss so gestaltet sein, dass eine lokale Gastreise verlustfrei übernommen werden kann. Bis dahin gilt: Gastreisen sind flüchtig, und das muss dem Nutzer gegenüber ehrlich kommuniziert werden.

**Offener Widerspruch:** siehe Abschnitt „Offene Widersprüche", Punkt 1.

---

## ADR-0010 – Payments bleiben, ohne Priorität

**Datum:** 15. August 2026
**Status:** freigegeben

**Entscheidung:** `payments`, `refunds` und `stripe_webhooks` werden nicht gelöscht, aber auch nicht ausgebaut.

**Kontext:** V2 monetarisiert zunächst über Reisevermittlung und Provisionen, nicht über eigene Zahlungsabwicklung.

**Alternativen:** Vollständig entfernen und später neu bauen.

**Begründung:** Die Strukturen könnten später für Premium-Funktionen oder direkte Leistungen nützlich sein. Entfernen und Neubauen wäre doppelte Arbeit; Ausbauen wäre verfrüht.

**Konsequenzen:** Die zugehörigen Admin-Endpunkte bleiben zunächst bestehen und müssen deshalb weiterhin als geschützt gelten. Sie werden nicht Teil des MVP-Funktionsumfangs.

---

## ADR-0011 – Ein Provider pro Kategorie, keine Abstraktion auf Vorrat

**Datum:** 15. August 2026
**Status:** freigegeben; Flüge in Phase 3.1 teilweise umgesetzt

**Entscheidung:** Je Kategorie zunächst genau ein Weg: Hotels zunächst über eine einfache **Affiliate-/Deeplink-Lösung**, Aktivitäten über **GetYourGuide**. Für Flüge galt ursprünglich Amadeus; das ist durch den Nachtrag und ADR-0062 überholt.

**Nachtrag 20. August 2026:** Amadeus Self-Service wurde am 17. Juli 2026 eingestellt. Phase 3.1 bindet **keinen** Amadeus-Adapter an. Der erste Flug-Suchadapter ist Duffel Flights API, ausschliesslich als Daten-/Entwicklungsweg. Jetnity darf sich weder technisch noch geschäftlich an Duffel koppeln. Search, Ranking und Trip-Domain müssen später Skyscanner oder Aviasales ohne Rewrite aufnehmen können. Search und Booking/Affiliate bleiben getrennte Verantwortlichkeiten. Siehe ADR-0062.

**Kontext:** Die alte Codebasis deutete auf viele parallele Reisekategorien und Anbieter hin.

**Alternativen:** Mehrere Anbieter je Kategorie; vorab eine generische Provider-Schicht bauen.

**Begründung:** Eine Multi-Provider-Abstraktion ohne zweiten Provider ist Komplexität ohne Nutzen. Der Provider-Ausbau darf den Trip Builder nicht verzögern ([AGENTS.md](AGENTS.md) Regel 19 und 23).

**Konsequenzen:** Erst bei echtem Bedarf abstrahieren. Deeplinks für Hotels bedeuten geringere Kontrolle über die Darstellung, aber schnellere Nutzbarkeit und keine komplexe Vertragslage.

---

## ADR-0012 – Reihenfolge: Basis, dann Sicherheit und Daten, dann Produktkern

**Datum:** 15. August 2026
**Status:** freigegeben

**Entscheidung:** Phase 0 V2-Basis, Phase 1 Sicherheit und Datenbasis, Phase 2 Jetnity-Kern (natürliche Sprache zu strukturierter Reise), Phase 3 Reiseprodukte. Details in [ROADMAP.md](ROADMAP.md).

**Kontext:** Der Produktkern ist der Trip Builder. Trotzdem steht die Datenbasis davor.

**Alternativen:** Zuerst den Trip Builder bauen und die Datenbasis nachziehen.

**Begründung:** Der Trip Builder ohne verlässliche Trip-Persistenz und ohne RLS wäre eine Demo, die später neu gebaut werden müsste. Das Schema ist die Grundlage, auf der Erstellung und Bearbeitung aufsetzen. Die Phase bleibt bewusst schmal: nur was V2 wirklich braucht, keine Perfektion vor dem Kern.

**Konsequenzen:** Phase 1 muss diszipliniert schmal gehalten werden, sonst verzögert sie den Kern.

---

## ADR-0013 – Gastmodus speichert genau eine aktive Reise

**Datum:** 15. August 2026
**Status:** freigegeben, noch nicht umgesetzt

**Entscheidung:** Ein Gast darf genau **eine** aktive Reise speichern. Mehrere Reisen erfordern ein Konto.

**Kontext:** Der implementierte Gastspeicher erlaubte bis zu 20 Entwürfe pro Browser (`lib/trips/guest-store.ts`, `MAX_GUEST_TRIPS = 20`), während „mehrere Reisen" laut ADR-0009 eine kontopflichtige Funktion ist. Das war ein direkter Widerspruch zwischen Code und Produktentscheidung.

**Alternativen:** 20 Gastreisen beibehalten und „mehrere Reisen" aus dem Kontonutzen streichen; unbegrenzte Gastreisen.

**Begründung:** Der Gastmodus soll den Wert von Jetnity sofort erlebbar machen – dafür genügt eine Reise. Bleiben 20 Reisen ohne Konto möglich, verliert die Registrierung ihren wichtigsten konkreten Nutzen. Eine Reise ist gleichzeitig genug, damit niemand vor der Registrierung Arbeit verliert.

**Konsequenzen:**

- `MAX_GUEST_TRIPS` wird von 20 auf 1 gesetzt.
- Es braucht ein ehrliches Verhalten für den Fall, dass ein Gast eine zweite Reise anlegen will: Hinweis auf das Konto, kein stilles Überschreiben der bestehenden Reise.
- Bestehende Browser können bereits mehrere Gastreisen gespeichert haben. Die Umstellung darf diese Daten nicht stillschweigend verwerfen; nötig ist ein definierter Übergang.
- Die Umsetzung erfolgt **nicht** in Phase 1.1, weil dort ausdrücklich keine zusätzlichen Funktionen entstehen sollen. Sie ist der Reise-Persistenz in Phase 1.5 zugeordnet, wo auch die Migration Gast zu Konto entsteht.

---

## ADR-0014 – Alt-Endpunkte werden entfernt statt abgesichert

**Datum:** 15. August 2026
**Status:** umgesetzt (Phase 1.1)

**Entscheidung:** 61 der 77 Route Handler wurden entfernt, ebenso alle vier Cron-Jobs. 16 Endpunkte bleiben bestehen.

**Kontext:** Die Endpunkte der alten Produktwelt waren nicht nur ungenutzt, sondern aktiv gefährlich. Zwei automatische Pfade lösten ohne Nutzerbeteiligung kostenpflichtige DALL·E-3-Generierungen aus, und sechs Modell-Endpunkte waren vollständig ohne Authentifizierung öffentlich erreichbar.

**Alternativen:** Endpunkte absichern und behalten; auf HTTP 410 umstellen statt löschen; alles bis zur Alt-UI-Entfernung liegen lassen.

**Begründung:** Absichern hätte Aufwand in Code investiert, der ohnehin entfernt wird (ADR-0006), und das Risiko nur verkleinert statt beseitigt. Eine 410-Stufe wäre sinnvoll bei öffentlichen APIs mit externen Konsumenten – hier sind alle Aufrufer interne Alt-Oberflächen, deshalb wäre sie unnötiger Ballast.

**Behalten und warum:**

| Endpunkt | Begründung |
| --- | --- |
| `app/auth/refresh` | V2-Auth, Session-Erneuerung |
| `api/search/airports` | Flughafendaten, wird für Flüge in Phase 3 gebraucht |
| `api/search` | hält die Alt-Suchseite funktionsfähig bis zur Alt-UI-Entfernung |
| `api/admin/payments/*` (5) | ADR-0010: behalten, nicht ausbauen |
| `api/admin/security/*` (8) | Admin-Sicherheitsbereich, laut Vision Teil des späteren Admin-Umfangs |

**Konsequenzen:** Die Alt-Oberflächen (Media Studio, Creator Hub, Admin Copilot, Feed, Blog) verlieren Funktionen und zeigen Fehler, wenn man sie benutzt. Das ist akzeptiert, weil sie im nächsten Schritt entfernt werden. Nicht mehr erreichbar sind auch die Infomaniak-DNS- und Mail-Automatisierung; DNS-Änderungen erfolgen bei Bedarf direkt beim Anbieter.

---

## ADR-0015 – Responsive-Probleme werden an der Ursache behoben, nicht kaschiert

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Kein `overflow-hidden` und kein `overflow-x-hidden` auf `main`, `body` oder ganzen Seitenbereichen, um zu breite Inhalte unsichtbar zu machen. Stattdessen werden die auslösenden Layoutfehler behoben. Als Muster gilt: Grid-Spuren mit Inhalt als `minmax(0,…)`, Grid- und Flex-Kinder mit `min-w-0`, `min-h`-Werte gestaffelt nach Breakpoint. Die Regeln stehen in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) Abschnitt 7.

**Kontext:** Die Startseite trug ein `overflow-hidden` auf `main`. Dadurch war die Seite messbar „ohne horizontales Scrollen", schnitt aber real Inhalte ab: das Reise-Cockpit-Mockup war bei 320 px 704 px breit und wurde auf 296 px beschnitten, die Pro-Sektion und der Hero ebenfalls. Ursache war jeweils, dass eine `auto`-Grid-Spur auf die Mindestbreite ihres Inhalts wuchs – unter anderem wegen `min-w-[150px]` in einem horizontalen Scroller, dessen Elternspur nicht schrumpfen durfte.

**Alternativen:** `overflow-x-hidden` global setzen und die Breiten so lassen. Das versteckt den Fehler, kostet aber Inhalt und macht künftige Fehler unsichtbar.

**Begründung:** Beschnittener Inhalt ist ein Produktfehler, kein Darstellungsdetail. Ein globales Verstecken hätte zusätzlich verhindert, dass Regressionen messbar sind.

**Konsequenzen:** Clipping bleibt nur dort erlaubt, wo es dem Bild dient (Karten mit Radius, bewusst überlaufende dekorative Flächen). Dekorative Überläufe werden mit `aria-hidden="true"` markiert, damit Absicht und Fehler unterscheidbar bleiben. Für die laufende Kontrolle ist eine automatisierte Prüfung sinnvoll; sie steht im Backlog der [ROADMAP.md](ROADMAP.md), weil sie einen Browser in der CI benötigt.

---

## ADR-0016 – Eingabefelder tragen auf kleinen Breiten 16 px Schrift

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Alle Eingabefelder verwenden unterhalb `sm` mindestens 16 px (`text-base sm:text-sm`). Das gilt auch für die gemeinsamen Primitives `components/ui/input.tsx` und `components/ui/textarea.tsx`.

**Kontext:** iOS Safari zoomt beim Fokus automatisch in Felder mit weniger als 16 px Schriftgröße. Der Zoom verschiebt das Layout, und der Nutzer landet nach der Eingabe in einer verschobenen Ansicht. Betroffen waren die Felder im Trip-Workspace sowie über die Primitives `/login` und `/register`.

**Alternativen:** `maximum-scale=1` im Viewport setzen. Das unterdrückt den Zoom, verhindert aber auch das manuelle Zoomen und ist ein Accessibility-Rückschritt.

**Begründung:** Die Schriftgröße ist die Ursache, der Viewport-Trick nur eine Unterdrückung der Folge.

**Konsequenzen:** Felder wirken auf dem Telefon etwas größer. Ab `sm` bleibt die Darstellung unverändert. Die Änderung an den Primitives betrifft auch Alt-Oberflächen; sie ist dort unschädlich und verschwindet mit deren Entfernung.

---

## ADR-0017 – `viewport-fit` bleibt `auto`

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Der Viewport wird nicht auf `viewport-fit=cover` umgestellt. Randverankerte Elemente (Kopfzeile, Footer, fixierte Buttons) rechnen trotzdem `env(safe-area-inset-*)` ein.

**Kontext:** Mit `auto` begrenzt iOS den Viewport selbst auf den sicheren Bereich; Inhalte geraten nicht unter Notch oder Home-Indikator, und `env(safe-area-inset-*)` ist 0. Mit `cover` reicht die Seite bis an die Gerätekante, und jede randberührende Fläche muss die Insets selbst berücksichtigen.

**Alternativen:** `cover` setzen, um randlose Flächen zu ermöglichen.

**Begründung:** Die V2-Sektionen liegen als Karten mit Außenabstand, ein randloser Anschnitt ist gestalterisch nicht vorgesehen. `cover` hätte Aufwand und Regressionsrisiko in jeder Sektion erzeugt, ohne sichtbaren Gewinn. Die `env()`-Werte bleiben trotzdem sinnvoll, weil die App per `app/manifest.ts` mit `display: standalone` installierbar ist und in diesem Modus echte Insets auftreten.

**Konsequenzen:** Eine Verifikation auf echter iOS-Hardware war in dieser Umgebung nicht möglich. Geprüft wurde die CSS-Logik sowie Portrait und Landscape im Chromium. Wenn später randlose Flächen gewünscht sind, ist diese Entscheidung neu zu treffen.

---

## ADR-0018 – Alt-Oberflächen werden entfernt, das Admin-Grundgerüst bleibt

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Die Oberflächen der alten Produktidee werden vollständig entfernt: Creator Hub, Creator Dashboard, Creator Analytics, Media Studio, Creator-Story, Feed, Blog, Story, die Alt-Suchseite samt `api/search`, Admin-Copilot, Copilot-Kommandopaletten, Control-Center und die Domains-Oberfläche. Die Admin-Bereiche für Nutzer, Inhalte, Analytics, Marketing, Zahlungen, Security, Einstellungen und Lokalisierung bleiben bestehen.

**Kontext:** Phase 1.1 hat 61 Endpunkte abgeschaltet. Die zugehörigen Oberflächen blieben stehen und liefen dadurch in Fehler. Sie waren zusätzlich über Navigation, Footer und Login-Weiterleitungen erreichbar und bewarben ein Produkt, das es nicht mehr gibt.

**Alternativen:** Alt-Oberflächen stehen lassen und nur ausblenden; oder zusätzlich das gesamte Admin-System entfernen.

**Begründung:** Ausblenden hätte toten Code, tote Abhängigkeiten und irreführende Texte erhalten, ohne Nutzen. Das Admin-Grundgerüst dagegen ist in der Vision Abschnitt 14 ausdrücklich vorgesehen; seine Entfernung wäre eine Produktentscheidung ohne Freigabe. Payments und Security bleiben zusätzlich durch ADR-0010 geschützt.

**Konsequenzen:** 209 Dateien entfernt, sechs Pakete deinstalliert. Der wiederherstellbare Stand liegt auf `archive/pre-1-1b-alt-ui`. Die Datenbank behält vorerst Alt-Tabellen (`creator_uploads`, `session_media`, `blog_posts` und weitere); deren Bereinigung gehört zur Baseline in Phase 1.4 und ist bewusst nicht Teil dieses Schritts, weil sie Migrationen und RLS berührt.

---

## ADR-0019 – Nach der Anmeldung führt der Weg zu „Meine Reisen"

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Login, Registrierung, OAuth-Callback und Passwortwechsel leiten auf `/reisen`.

**Kontext:** Alle vier Wege leiteten auf `/creator/creator-dashboard`. Diese Route ist mit Phase 1.1b entfernt; jede Anmeldung wäre in einer 404-Seite geendet.

**Alternativen:** Startseite `/`; oder ein neues Konto-Dashboard bauen.

**Begründung:** `/reisen` ist der einzige bestehende persönliche Bereich und entspricht dem freigegebenen Login-Untertitel „plane deine Reisen dort weiter, wo du aufgehört hast". Ein eigenes Konto-Dashboard wäre eine neue Oberfläche ohne Bedarf.

**Konsequenzen:** Das Ziel liegt in beiden Formularen als benannte Konstante, damit ein späteres Konto-Dashboard an einer Stelle umgestellt werden kann. Die Übernahme vorhandener Gastreisen in das Konto bleibt Phase 1.5.

---

## ADR-0020 – Responsive-Prüfungen laufen zusätzlich unter WebKit

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Die Responsive-Prüfung läuft gegen zwei Engines: Chromium und WebKit. WebKit ist die maßgebliche Engine, Chromium dient als Gegenprobe.

**Kontext:** Der erste Qualitätspass hat in Chromium bestanden, auf einem echten iPhone waren weiterhin Fehler sichtbar. Formularfelder, Mindestbreiten nativer Bedienelemente, `dvh` und klebende Schichten verhalten sich unter WebKit anders. Eine Prüfung, die iOS beurteilen soll, aber nicht in der Engine von iOS läuft, kann diese Unterschiede grundsätzlich nicht sehen.

**Alternativen:** nur Chromium prüfen und auf manuelle Gerätetests vertrauen; ein bezahlter Gerätedienst wie BrowserStack.

**Begründung:** WebKit ist über Playwright kostenlos und lokal verfügbar und liefert dieselbe Layout-Engine wie Safari auf iOS. Ein Gerätedienst verursacht laufende Kosten und widerspricht dem Budgetrahmen aus [AGENTS.md](AGENTS.md) Regel 18.

**Konsequenzen:** Der Nachweis gegen Production zeigt den Nutzen: unter WebKit fielen dort 10 Seiten-Overflows, 22 abgeschnittene Bereiche und 50 Felder unter 16 px auf, die die reine Chromium-Prüfung nicht als Fehler geführt hatte. WebKit unter Linux bildet allerdings nicht alles ab, insbesondere nicht den nativen iOS-Datumswähler; dafür gibt es ADR-0021. Eine Prüfung auf echter Hardware bleibt offen.

---

## ADR-0021 – Nicht abbildbares Verhalten wird belastet, nicht geschätzt

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Wo eine Engine das Verhalten eines Geräts nicht abbilden kann, wird der ungünstige Fall künstlich erzwungen und das Layout dagegen geprüft. Konkret: Datums-, Zeit- und Zahlenfelder bekommen im Belastungstest eine Mindestbreite von 200 px.

**Kontext:** Auf iOS ist `input[type=date]` ein natives Bedienelement mit großer inhaltsbasierter Mindestbreite. Weder Chromium noch WebKit unter Linux rendern dieses Element; dort ist es ein einfaches Textfeld mit rund 58 px Mindestbreite. Genau dieses Feld war aber der vom Nutzer gemeldete Fehler.

**Alternativen:** auf die Meldung hin punktuell korrigieren und hoffen; oder das Verhalten aus der Ferne nachbauen.

**Begründung:** Ob ein Layout hält, hängt nicht von der genauen Breite des Bedienelements ab, sondern davon, ob die umgebenden Spuren schrumpfen dürfen. Diese Eigenschaft lässt sich unabhängig vom Gerät prüfen: Hält das Layout bei 200 px erzwungener Mindestbreite, kann ein breiteres Bedienelement es nicht mehr sprengen.

**Konsequenzen:** Der Belastungstest deckt `/planen`, `/reisen/[tripId]`, `/login` und `/register` auf acht Breiten ab. Gegen Production schlägt er an acht Stellen fehl, auf dem aktuellen Stand an keiner.

---

## ADR-0022 – Jede geprüfte Seite muss ihren Inhalt nachweisen

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Jeder Seitenzustand der Prüfung nennt einen Text, der vorhanden sein muss. Fehlt er, gilt die Prüfung als fehlgeschlagen.

**Kontext:** `/login` und `/register` liefen lokal mangels Supabase-Variablen in die Fehlerfläche. Diese Fläche ist kurz, einspaltig und fehlerfrei – sie bestand jede Layoutprüfung, während das eigentliche Formular nie vermessen wurde. Der Fehler fiel erst in Production auf.

**Alternativen:** Screenshots manuell sichten; oder auf das Vorhandensein bestimmter Elemente prüfen.

**Begründung:** Eine bestandene Prüfung ohne Inhalt ist schlimmer als gar keine Prüfung, weil sie Sicherheit vortäuscht. Ein erwarteter Text ist die knappste Absicherung dagegen und deckt Fehlerflächen, leere Zustände und falsche Weiterleitungen gleichermaßen ab.

**Konsequenzen:** Die Prüfumgebung braucht gültige Umgebungsvariablen; für die lokale Messung genügen Platzhalterwerte. Die Regel hat sich sofort bewährt und einen falschen Erwartungstext in der Prüfung selbst aufgedeckt.

---

## ADR-0023 – Abmelden ist eine Server Action, kein Pfad

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Das Abmelden läuft über die Server Action `signOutAction` in `app/auth/sign-out.ts`, aufgerufen aus einem Formular. Einen Pfad `/logout` gibt es nicht.

**Kontext:** `/unauthorized` und die Admin-Kopfzeile verwiesen beide per Link auf `/logout`. Diese Route existierte in keinem Stand des Projekts, beide Schaltflächen führten also auf die 404-Seite. Aufgefallen ist das erst bei der Kartierung der Alt-Oberflächen, weil die Responsive-Prüfung Layout misst und keine Linkziele auflöst.

**Alternativen:** Eine Route `/logout` anlegen, die abmeldet und weiterleitet.

**Begründung:** Ein Link, dessen Aufruf abmeldet, ist gefährlich: Next.js lädt Links im Sichtbereich voraus, und Browser sowie Sicherheitsscanner holen `GET`-Adressen ungefragt ab. Die Sitzung würde enden, ohne dass jemand geklickt hat. Ein Formular sendet `POST` und wird nicht vorausgeladen.

**Konsequenzen:** Zwei Aufrufstellen umgestellt. Das Abmelden auf der Admin-Anmeldeseite hat weiterhin seine eigene Aktion, weil es dort auf `/admin/login` zurückführt statt auf die Startseite.

---

## ADR-0024 – Die shadcn-Tokens verweisen auf die Palette, statt eigene Farben zu tragen

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Die semantischen Tokens (`--primary`, `--muted`, `--border` …) definieren keine Farbwerte mehr, sondern verweisen auf die V2-Markenpalette: `--primary: var(--jet-brand-800)`. Die Notation ist durchgehend RGB-Kanäle. Zusätzlich gibt es zwei neue Familien: `night-*` für das Dunkelthema und `danger-*` als einzige Funktionsfarbe ausserhalb der Marke.

**Kontext:** `--primary` war `222 84% 56%` (Blau), `--accent` `264 85% 62%` (Violett), Flächen und Rahmen kühles Grau. Daneben existierte die verbindliche V2-Palette. Beide wurden parallel gepflegt: Je nachdem, welche Klasse eine Komponente benutzte, erschien dieselbe Fläche blau oder grün. Betroffen waren die am breitesten genutzten Namen – `muted` in 56 Dateien, `border` in 27, `primary` in 25.

**Alternativen:**

1. *Die V2-Farben nach HSL umrechnen und in die shadcn-Tokens schreiben.* Verworfen: Es gäbe weiterhin zwei Stellen je Farbe. Beim Runden entstehen Abweichungen, und eine Palettenänderung müsste doppelt nachgezogen werden – genau die Lage, aus der der Widerspruch entstanden ist.
2. *Die shadcn-Namen aufgeben und überall Paletten-Namen verwenden.* Verworfen: Die Radix-/shadcn-Primitive erwarten sie, und eine semantische Ebene ist nützlich – `bg-muted` sagt, was gemeint ist, `bg-surface-100` nur, welche Farbe.

**Begründung:** Ein Verweis kann nicht auseinanderlaufen. `rgb()` mit Kanälen statt `hsl()` ist nötig, weil die Palette so notiert ist und eine gemischte Notation die Verweiskette bricht; sie erhält ausserdem die Opacity-Modifier.

Zwei Zuordnungen sind bewusst keine reine Ableitung: `--ring` liegt auf `brand-600` statt auf `--primary`, weil ein `brand-800`-Ring auf einer `brand-800`-Schaltfläche unsichtbar wäre. Und `danger` bleibt rot – für zerstörende Aktionen ist Rot keine Stilfrage. Beide Stufen sind auf AA-Kontrast gewählt (`danger-600` 5,64:1 mit weisser Schrift).

**Konsequenzen:** Kein Klassenname in den Komponenten musste sich ändern. Entfallen sind die toten Tokens mit Blauanteil (`--jet-hero`, `--jet-btn`, `--hero-navy`), `--surface-1/2/3`, `--snippet-lines`, die in `tailwind.config.js` deklarierten, aber nie definierten `--chart-1..5` sowie dreizehn unbenutzte Klassen der alten Gestaltung. Geprüft ist unter WebKit auf acht Seiten, dass jedes Token zu einer Farbe auflöst – die zweite `var()`-Ebene könnte sonst still auf transparent fallen – und dass nichts mehr im Farbtonbereich 200–300 Grad gezeichnet wird.

---

## ADR-0025 – Das Dunkelthema gehört dem Admin und verlässt ihn nicht

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Ein Dunkelthema gibt es nur im Admin. Die Klasse `dark` sitzt weiterhin auf `<html>`, aber das Admin-Layout wendet sie an und entfernt sie beim Verlassen. Die Flächen kommen aus `night-*`.

**Kontext:** Der Umschalter in der Admin-Kopfzeile setzte die Klasse auf `<html>`, und niemand nahm sie zurück. Weil die Navigation im App Router das Dokument nicht austauscht, blieb sie beim Wechsel auf eine öffentliche Seite stehen: Die hellen V2-Seiten wurden dann mit den dunklen Tokens gezeichnet. Wer den Admin mit dunkel eingestelltem Betriebssystem betrat, löste das ohne Zutun aus, denn die Voreinstellung war `system`.

**Alternativen:**

1. *Die Klasse auf den Admin-Container setzen statt auf `<html>`.* Custom Properties erben, das würde für die Oberfläche genügen. Verworfen: Bildlaufleisten, native Steuerelemente und der Untergrund beim Überdehnen des Scrollbereichs richten sich nach `color-scheme` am Wurzelelement. Der Admin sähe dunkel aus, sein Rahmen nicht.
2. *Ein Dunkelthema für die öffentlichen Seiten ausarbeiten.* Nicht jetzt: Die V2-Farbwelt ist als warme, helle Palette festgelegt; ein dunkler Zustand wäre eine Gestaltungsentscheidung.

**Begründung:** Die Lebensdauer der Klasse an das Layout zu binden, löst das Problem an der Ursache: Das Admin-Layout wird beim Verlassen des Bereichs abgebaut, es ist damit die einzige Stelle, die zuverlässig weiss, wann das Thema nicht mehr gelten darf.

**Konsequenzen:** Die Kopfzeile besitzt das Thema nicht mehr, sie schaltet nur um; Zustand und Umschalter kommen aus `AdminShellContext`. Das vermeidet zugleich eine Reihenfolgefalle – Effekte der Kinder laufen vor denen der Eltern, eine eigene Leseoperation in der Kopfzeile hätte den noch nicht gesetzten Zustand gesehen.

---

## ADR-0026 – Unerreichbarer Code und ungenutzte Pakete werden in der CI geprüft

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Drei Analysen laufen als Teil der CI: `check:dead` (Dateien, die von keinem Einstiegspunkt aus erreichbar sind), `check:exports` (benannte Exporte ohne Aufrufer) und `check:deps` (Pakete ohne Verwendung). Bewusste Ausnahmen stehen **im jeweiligen Skript** mit Begründung, nicht in der Dokumentation.

**Kontext:** Das Aufräumen der Alt-Oberflächen entfernte Seiten, nicht aber alles, was nur von ihnen aus erreichbar war. Eine Textsuche findet solche Reste unzuverlässig, weil sie transitive Ketten übersieht: Eine Datei kann importiert aussehen und trotzdem nur von einer anderen unerreichbaren Datei aus benutzt werden. Die Analyse über die Importkette fand 53 solcher Dateien, darunter dieselbe Komponente dreimal an verschiedenen Orten.

**Alternativen:** Ein fertiges Werkzeug wie `knip` oder `ts-prune`. Verworfen: Beide brauchen eigene Konfiguration für die Einstiegspunkte des App Routers, und die Begründung für eine Ausnahme liesse sich nicht an die Ausnahme schreiben. Die drei Skripte sind zusammen unter 300 Zeilen und arbeiten mit den Regeln, die für dieses Projekt gelten.

**Begründung:** Eine einmalige Aufräumaktion fällt zurück. Ein Prüflauf, der die Erweiterung sofort meldet, hält den Zustand – und zwingt zu einer Entscheidung: entfernen oder begründen. Dass die Begründung im Skript steht, hält sie an der Stelle, an der sie gelesen wird.

**Konsequenzen:** Drei Ausnahmen sind eingetragen: `zod` (Laufzeitvalidierung der kommenden strukturierten V2-Daten), `CookieConsent.tsx` (wartet auf die Rechtsentscheidung) und `startSupabaseAuthListener` (Gegenseite von `app/auth/refresh`, gehört in die Auth-Phase). Die Exportanalyse arbeitet über Namen, nicht über die Importkette; sie meldet im Zweifel zu wenig, damit die Ausgabe belastbar bleibt. Die dritte Ausnahme ist mit ADR-0027 entfallen: Beide Seiten sind in Phase 1.3 geprüft und entfernt worden.

---

## ADR-0027 – Eine Domain erteilt keine Berechtigung, und ein Ausfall erteilt sie erst recht nicht

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Reguläre Autorisierungsquelle ist die Rolle in der Datenbank. Der pauschale `@jetnity.com`-Fallback ist entfernt. `ADMIN_ALLOWED_EMAILS` bleibt als ausdrücklich konfigurierter Notzugang, ausschliesslich als exakte Adressliste – Domains, Platzhalter und Teileinträge werden verworfen, und es gibt keine im Quellcode hinterlegte Vorbelegung. Jede Nutzung des Notzugangs wird als Warnung protokolliert. Eine fehlgeschlagene Rollenabfrage führt nie zu einer Freigabe.

**Kontext:** `requireAdmin()` liess durch, wenn die Rolle passte **oder** die Adresse auf `@jetnity.com` endete. Da `ADMIN_ALLOWED_EMAILS` nirgends dokumentiert und in `.env.example` nicht enthalten war, genügte praktisch jede Adresse dieser Domain für vollen Admin-Zugriff, unabhängig von jedem Datenbankeintrag. Das Loginformular führte zusätzlich eine eigene Liste mit drei fest im Quellcode stehenden Adressen.

Schwerer wog die Fehlerbehandlung. `catch { role = null }` fing nur geworfene Ausnahmen; Supabase meldet einen abgelehnten Zugriff aber im `error`-Feld der Antwort, das nie gelesen wurde. Eine per RLS abgewiesene Rollenabfrage sah damit genauso aus wie „dieses Konto hat keine Rolle" – und fiel auf die E-Mail-Prüfung zurück. Bei einer Datenbankstörung war die Domain nicht nur ein zusätzlicher, sondern der einzige verbleibende Weg hinein.

**Alternativen:** Den Notzugang vollständig streichen. Verworfen, weil dann ein Ausfall der Rollenabfrage niemanden mehr hineinlässt und die Berechtigung nicht reparierbar wäre. Statt ihn zu streichen, ist er eng geführt und laut: exakte Adressen, kein Muster, jede Nutzung mit Konto, Bereich und Zustand der Rollenabfrage im Protokoll.

Auch geprüft: den Notzugang bei einem Ausfall der Rollenabfrage ebenfalls zu verweigern. Verworfen, weil das genau der Fall ist, für den er existiert. Der Unterschied zum alten Verhalten liegt nicht darin, **ob** ein Weg offen bleibt, sondern dass er ausdrücklich konfiguriert, auf einzelne Adressen begrenzt und nachvollziehbar ist – nicht implizit über eine Domain und nicht stillschweigend.

**Begründung:** Eine Domain ist keine Berechtigung, sondern eine Zugehörigkeit. Wer eine Adresse in dieser Domain anlegen kann, kann Administrationsrechte vergeben, ohne dass es in der Datenbank sichtbar wäre – ein zweites, unversioniertes Berechtigungssystem. Und ein Fehler ist keine Aussage über eine Berechtigung: Die Entscheidung unterscheidet deshalb drei Zustände – Rolle vorhanden, keine Rolle hinterlegt, Abfrage fehlgeschlagen – statt zwei.

**Konsequenzen:** Ein Konto ohne Datenbankrolle und ohne Eintrag in der Notliste kommt nicht mehr in den Administrationsbereich, auch nicht mit einer `@jetnity.com`-Adresse. Wer bisher über die Domain hineinkam, braucht einen Rolleneintrag. Ein gesetzter, aber unbrauchbarer Wert in `ADMIN_ALLOWED_EMAILS` – etwa nur `@jetnity.com` – wird als Fehlkonfiguration protokolliert, statt still eine leere Liste zu ergeben. Die Tabelle `admin_domains` im Schema widerspricht dieser Entscheidung; sie ist in der Anwendung unbenutzt und in Phase 1.4 zu entfernen.

Mit derselben Begründung ist die Rollenvergabe gerichtet worden: Bisher konnte eine Moderation ihre eigene Rolle auf `admin` setzen, weil nur die Owner-Rolle und ein Selbst-Downgrade geprüft wurden. Jetzt ist die eigene Rolle unveränderbar, und es zählt der Rang gegenüber der bisherigen **und** der künftigen Rolle. Nur der Owner darf jede fremde Rolle setzen, damit eine Nachfolge einrichtbar bleibt.

---

## ADR-0028 – Seiten werden weitergeleitet, Schnittstellen bekommen einen Statuscode

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** Der Admin-Schutz ist nach Oberfläche getrennt. `requireAdminPage()` leitet weiter, `requireAdminApi()` antwortet mit 401 ohne Anmeldung, 403 ohne Berechtigung und 503, wenn die Prüfung selbst ausfällt. Der Bereichsschutz für Seiten liegt im Layout der Routengruppe `(admin)`, nicht in den einzelnen Seiten. Die serverseitige Identität kommt aus `auth.getUser()`. Die Middleware prüft die Anmeldung für `/admin`, `/api/admin` und `/account`, nicht die Rolle.

**Kontext:** `requireAdmin()` rief in allen Fällen `redirect()` – auch in den dreizehn Admin-API-Routen. Ein `fetch` folgt einer 307 und erhält die HTML-Loginseite mit Status 200; im Client kommt das als Erfolg an, und die Antwort wird als Nutzlast gelesen. Gleichzeitig war der Seitenschutz opt-in: Jede der neun Admin-Seiten trug ihren eigenen Aufruf, und eine neue Seite ohne ihn wäre öffentlich gewesen.

**Alternativen:** Den Rollencheck in die Middleware zu legen, damit auch neue API-Routen automatisch geschützt sind. Verworfen: Die Rolle liegt in der Datenbank, und eine Abfrage am Rand bei jedem Request verteilt die Autorisierung auf zwei Orte mit zwei Auslegungen. Stattdessen prüft `npm run check:api-schutz` in der CI jeden exportierten HTTP-Handler unter `app/api/admin` darauf, dass er den Gate aufruft und die gelieferte Antwort zurückgibt – die Gegenprobe mit einer ungeschützten `POST`-Funktion lässt die Prüfung fehlschlagen.

`auth.getClaims()` wäre die schnellere Prüfung, weil es die Signatur gegen den JWKS-Endpunkt verifiziert statt den Auth-Server zu fragen. Verworfen für den Admin-Zugang: Ein gültig signiertes Token verifiziert auch dann noch, wenn das Konto gesperrt oder gelöscht wurde. `getUser()` spiegelt den aktuellen Stand. Für weniger heikle Pfade bleibt `getClaims()` eine Option.

**Begründung:** Die richtige Antwort auf eine fehlende Berechtigung hängt davon ab, wer fragt. Ein Mensch im Browser soll zur Anmeldung geführt werden, ein Programm braucht einen Statuscode, den es auswerten kann. Ein Schutz, der im Layout sitzt, gilt für jede Seite der Gruppe – auch für die, die noch niemand geschrieben hat. Das ist der Unterschied zwischen „ist geschützt" und „bleibt geschützt".

**Konsequenzen:** Alle Seiten unter `(admin)` werden dynamisch gerendert – die Prüfung braucht die Cookies des Requests. `react cache()` bündelt Identität und Rolle auf eine Abfrage pro Request, sodass eine Seite, die ihre eigene Rolle braucht, keine zweite Runde kostet. 503 statt 403 bei einem Ausfall weicht vom Wortlaut „401/403" ab: Ein Ausfall der Prüfung ist keine Aussage über die Berechtigung, und der aufrufende Client soll es erneut versuchen dürfen, statt eine Ablehnung zu lernen. `/unauthorized` unterscheidet beide Fälle im Text.

---

## ADR-0029 – Tests laufen über den Test-Runner von Node, ohne neues Paket

**Datum:** 16. August 2026
**Status:** umgesetzt

**Entscheidung:** `npm test` ruft `node --import tsx --test` über die Dateien `lib/**/*.test.ts`. Die Testdateien liegen neben dem Code, den sie prüfen. Die Erreichbarkeitsanalyse behandelt sie als Startpunkte.

**Kontext:** Nach [AGENTS.md](AGENTS.md) Regel 24 haben Auth und Rollen die höchste Testpriorität, und im Repo lag keine einzige Testdatei. Die Zugangsentscheidung ist genau die Sorte Logik, bei der ein Fehler nicht auffällt: Alle Pfade führen zu „geht" oder „geht nicht", und der falsche Pfad sieht im Betrieb aus wie der richtige.

**Alternativen:** `vitest`. Verworfen für diesen Zweck: `tsx` ist ohnehin vorhanden, löst die `@/`-Aliase aus der `tsconfig.json` auf, und der Test-Runner steckt in Node. Damit kostet der erste Test kein neues Paket und keine zweite Konfiguration. Sobald Komponententests mit einem DOM dazukommen, ist die Entscheidung neu zu bewerten – dafür reicht der eingebaute Runner nicht.

**Begründung:** Die Prüfbarkeit ergibt sich aus dem Schnitt, nicht aus dem Werkzeug. `lib/auth/roles.ts` und `lib/auth/admin-access.ts` enthalten keine Next- und keine Supabase-Importe: Die Zugangsentscheidung nimmt Identität und Ergebnis der Rollenabfrage als Argumente entgegen und gibt eine Entscheidung zurück. Deshalb lässt sich der Fall „Rollenabfrage fehlgeschlagen" prüfen, ohne eine Datenbank kaputtzumachen – und genau dieser Fall war die Lücke aus ADR-0027.

**Konsequenzen:** 34 Tests decken die Rangfolge, die Vergaberegeln, die Notliste und jeden Ablehnungsgrund ab, ohne Datenbank und ohne laufenden Server. Was die Entscheidung **ausführt** – Cookies, Abfrage, Weiterleitung, Statuscode – bleibt davon unberührt und ist gegen einen lokalen Supabase-Ersatz mit echten Sitzungen durchgespielt worden; das ist in [ROADMAP.md](ROADMAP.md) Abschnitt 1.3 festgehalten. RLS-Tests brauchen den Development-Zugang aus 1.4.

---

## ADR-0030 – Offizieller Supabase Remote MCP Server nur für Development

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** Coding Agents und Cursor verbinden sich über den offiziellen gehosteten Supabase MCP Server (`https://mcp.supabase.com/mcp`) mit genau einem Projekt: dem Development-Branch aus den Environment-Secrets `SUPABASE_PROJECT_REF` und `SUPABASE_ACCESS_TOKEN`. Die projektspezifische Konfiguration liegt in `.cursor/mcp.json`. Aktiviert sind nur die Feature-Gruppen `database`, `debugging` und `development`. Es gibt keine Production-Verbindung.

**Kontext:** Phase 1.4 braucht eine belastbare Sicht auf das real existierende Schema. Das Repository enthält dafür keine vollständige Migrationshistorie. Ein ungescopter Account-MCP oder eine Production-Verbindung würde das Risiko unkontrollierter Schema- oder Datenzugriffe erhöhen.

**Alternativen:**
1. Lokaler `@supabase/mcp-server-supabase` per `npx` (stdio).
2. Browser-OAuth ohne Personal Access Token.
3. Ungescopter Account-MCP mit allen Feature-Gruppen.
4. Zusätzliche Production-Verbindung, ggf. `read_only`.

**Begründung:** Der Remote-Server ist der offizielle Weg und verursacht keine eigene Infrastruktur. Ein Personal Access Token ist in Cloud- und CI-Umgebungen ohne Browser-OAuth der vorgesehene Weg. `project_ref` schaltet Account-Werkzeuge ab und begrenzt den Zugriff auf ein Projekt. Die eingeschränkten Feature-Gruppen reichen für Baseline, Logs und Typen; Branching, Storage, Edge Functions, Docs und Account-Verwaltung bleiben aus. Production bleibt getrennt, weil Schemaarbeit dort nicht stattfinden darf.

Cursor interpoliert Secrets über `${env:NAME}`. Deshalb stehen in `.cursor/mcp.json` `Bearer ${env:SUPABASE_ACCESS_TOKEN}` und `project_ref=${env:SUPABASE_PROJECT_REF}` – nicht die Literalwerte und nicht hartkodierte Refs.

**Konsequenzen:** Agents können Tabellen, Migrationen und Advisors des Development-Projekts lesen. Schemaänderungen über MCP sind erst nach explizitem Auftrag in Phase 1.4 zulässig. Token und Projekt-Ref dürfen nicht ins Repository, in Logs oder in Antworten.

---

## ADR-0031 – Die Baseline ist ein Abzug des Bestands, und der Wiederaufbau wird gemessen

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** `supabase/migrations/20260815060111_baseline.sql` ist ein vollständiger Abzug des Schemas, wie es auf dem Development-Branch vorgefunden wurde – einschliesslich der Strukturen, die Jetnity V2 nicht mehr braucht. Die zehn früheren Dateien sind dadurch ersetzt. Änderungen am Bestand folgen als eigene, aufeinander aufbauende Migrationen danach. Dass die Kette das laufende Schema erzeugt, wird nicht angenommen, sondern gemessen: `npm run db:reproduzierbarkeit` baut `public` in einer Transaktion neu auf, vergleicht achtzehn Abschnitte gegen den laufenden Stand und rollt zurück.

**Kontext:** Zehn Migrationsdateien erzeugten zusammen zwei Tabellen, während der Branch 39 trug. Für 37 Tabellen gab es keine versionierte Beschreibung, eine Datei war unversioniert benannt, und der Inhalt einzelner Dateien wich vom realen Bestand ab. Damit liess sich weder eine Aussage über RLS treffen noch eine zweite Umgebung aufsetzen.

**Alternativen:**

1. *Nur die Strukturen versionieren, die V2 braucht.* Verworfen: Die Baseline wäre dann keine Beschreibung der Datenbank, sondern eine Wunschliste. Der Unterschied zwischen Repository und Wirklichkeit bliebe bestehen – nur kleiner und schwerer zu finden.
2. *Erst aufräumen, dann versionieren.* Verworfen: Eine Löschung ohne versionierten Ausgangszustand ist nicht rücknehmbar, und der Nachweis, dass die Löschung nichts Benötigtes trifft, braucht genau die Inventur, die die Baseline liefert.
3. *Auf `supabase db diff` vertrauen, ohne den Wiederaufbau zu prüfen.* Verworfen, weil ein Durchlauf ohne Fehler nicht dasselbe ist wie ein gleiches Ergebnis. Der Vergleich fand tatsächlich Abweichungen – 153 Rechte, die im Abzug anders standen als im laufenden Schema.

**Begründung:** Eine Baseline, die den Bestand beschreibt, macht jede spätere Änderung zu einem lesbaren Schritt mit Vorher und Nachher. Und eine Reproduzierbarkeit, die geprüft wird, ist der Unterschied zwischen „sollte gehen" und „geht".

**Konsequenzen:** Die Baseline enthält Strukturen, die als obsolet eingeordnet sind; das ist gewollt und in [docs/DATENBANK.md](docs/DATENBANK.md) festgehalten. Zwei Dinge liessen sich nicht wegdefinieren: Die Darstellung von Bedingungen und Typen hängt am `search_path`, weshalb beide Fingerabdrücke mit demselben Pfad laufen; und 48 Vorgaberechte gehören dem Platform-Rollenkonto `supabase_admin` und lassen sich von einer Anwendungsmigration nicht erzeugen – sie sind ausdrücklich vom Vergleich ausgenommen, statt den Vergleich weicher zu machen.

---

## ADR-0032 – Rechte und Policies müssen sich decken, in beide Richtungen

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** `anon` und `authenticated` erhalten in `public` kein Tabellenrecht, dem nicht eine Policy entspricht – und keine Policy ohne das zugehörige Recht. `TRUNCATE`, `REFERENCES` und `TRIGGER` sind entzogen, ebenso die Vorgaberechte für künftige Objekte. `EXECUTE` auf Funktionen ist entzogen und einzeln vergeben. `npm run db:rechte` prüft beide Richtungen.

**Kontext:** Beide Rollen hatten auf allen 39 Tabellen sämtliche Rechte; einzige Schranke war RLS. Das genügt nicht: `TRUNCATE` umgeht RLS vollständig. Jedes angemeldete Konto – und über `anon` jeder Besucher – konnte `truncate public.payments` ausführen und die Tabelle leeren, obwohl keine Policy ihm eine einzige Zeile zum Lesen gab. Gleichzeitig waren mehrere `SECURITY DEFINER`-Funktionen für `authenticated` aufrufbar, die als Definer die Policies umgingen und selbst keine Berechtigung prüften: `admin_payments_summary_30d()` gab jedem angemeldeten Konto die Umsatzzahlen der Plattform.

**Alternativen:** Sich auf RLS allein verlassen und die Rechte lassen, wie sie waren. Das ist die Voreinstellung von Supabase und der Grund, warum der Zustand so entstand. Verworfen: RLS wirkt auf Zeilen, Rechte wirken auf Tabellen und Befehle. Ein Befehl, der keine Zeile anfasst, sondern die Tabelle als Ganzes, läuft an RLS vorbei.

Auch geprüft: nur `TRUNCATE` zu entziehen und den Rest zu belassen. Verworfen, weil das die Frage „welches Recht braucht diese Tabelle" nicht beantwortet, sondern nur einen bekannten Fall abräumt. Der Deckungsabgleich beantwortet sie für jede Tabelle und meldet die nächste Lücke von selbst.

**Begründung:** Ein Zugriff hängt an vier Dingen – Tabellenrecht, RLS-Schalter, Policy, Rollenbindung –, und drei davon standen bisher fest auf „offen". Dass die Deckung in beide Richtungen geprüft wird, fängt zwei entgegengesetzte Fehler: ein Recht, das niemand braucht, und eine Policy, die wirkungslos bleibt, weil das Recht fehlt.

**Konsequenzen:** 115 Tabellenrechte sind einzeln vergeben. `anon` liest nur noch `airports`, `blog_posts` und `blog_comments`. Funktionen, die erhöhte Rechte brauchen, prüfen die Rolle selbst und liefern ohne sie keine Zeile. `stripe_webhooks` hat RLS eingeschaltet und bewusst keine Policy: Ohne Policy gibt RLS nichts frei, und ein Tabellenrecht besteht ebenfalls nicht. Der Supabase-Advisor meldet das als `rls_enabled_no_policy`; der Befund bleibt bewusst stehen, weil eine Policy hier die Lockerung wäre.

**Nachtrag vom 17. August 2026:** ADR-0035 hat zwei dieser Konsequenzen überholt. Die Zahl der einzeln vergebenen Tabellenrechte ist von 115 auf 118 gestiegen – hinzugekommen sind `update` auf `payments`, `insert` auf `refunds` und `select` auf `stripe_webhooks`. Damit hat `stripe_webhooks` eine Lesepolicy und der Befund `rls_enabled_no_policy` ist weg. Die Begründung von damals bleibt richtig, ihre Voraussetzung nicht: Die Tabelle hatte keine Route, die sie gebraucht hätte. `GET /api/admin/payments/webhooks` gibt es, und der Endpunkt antwortete deshalb dauerhaft leer.

Bei der Durchsicht fiel der letzte verbliebene Service-Role-Pfad in der Anwendung auf: `api/search/airports` legte, sobald `SUPABASE_SERVICE_ROLE_KEY` gesetzt war, einen zweiten Client mit vollen Rechten an und schrieb damit Amadeus-Ergebnisse in `airports` zurück. Der Endpunkt ist öffentlich und ohne Anmeldung erreichbar; eine Suchanfrage eines beliebigen Besuchers hätte damit einen Schreibvorgang mit vollen Datenbankrechten ausgelöst, ohne Auth, ohne Ownership und ohne Rate Limit – die Prüfliste aus [AGENTS.md](AGENTS.md) Regel 14 verfehlt er in drei Punkten. Das Zwischenspeichern ist entfernt. Mit Phase 3.1 entfällt auch der lesende Amadeus-Fallback: `api/search/airports` liest nur noch `public.airports`. Referenzdaten zu befüllen gehört in eine Migration oder einen Verwaltungsvorgang, nicht in eine öffentliche Suchabfrage. Damit liest kein Codepfad der Anwendung mehr einen Service-Role-Key, und der Setup-Check fragt ihn nicht mehr ab.

---

## ADR-0033 – Rolle und Kontostatus ändert niemand an sich selbst

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** In der Datenbank entscheidet allein `creator_profiles.role`, wer welche Rechte hat. `creator_profiles.is_admin`, die Tabelle `app_admins`, die Tabelle `admin_domains` und die Funktion `is_admin(uuid)` sind entfernt. Der Trigger `creator_profiles_rollenwechsel` prüft beim Anlegen und beim Ändern: Die eigene Rolle und der eigene Status sind unveränderlich, Rollen vergeben darf erst ab `moderator`, und nur unterhalb der eigenen Rolle – ausgenommen `owner`. Ein selbst angelegtes Profil bekommt `role = 'user'` und `status = 'active'`.

**Kontext:** ADR-0027 hat den domainbasierten Zugang in der Anwendung beseitigt. In der Datenbank galt er weiter, und drei weitere Quellen dazu. Schwerer wog, dass die Policy auf `creator_profiles` das Ändern der eigenen Zeile erlaubte, ohne zwischen den Spalten zu unterscheiden: `update creator_profiles set role = 'owner' where user_id = auth.uid()` ging durch. Beim Anlegen war es dasselbe – ein frisch registriertes Konto ohne Profil konnte sich sein erstes Profil direkt als Inhaber ausstellen. Die Rollenprüfung der Anwendung aus Phase 1.3 half dabei nicht: Der Weg führt über PostgREST direkt auf die Tabelle.

**Alternativen:**

1. *Die Spalten über eine `WITH CHECK`-Bedingung in der Policy schützen.* Verworfen: Eine Policy sieht die alte Zeile nur in `USING`, die neue nur in `WITH CHECK`. Der Vergleich „hat sich `role` geändert" braucht beide gleichzeitig – das kann nur ein Trigger.
2. *Die Rollenvergabe ausschliesslich über eine Funktion zulassen und `UPDATE` auf der Tabelle entziehen.* Verworfen für jetzt: Das Profil enthält auch gewöhnliche Felder wie Anzeigename und Biografie, die die Besitzerin selbst ändern darf. Der Trigger trennt beides, ohne einen zweiten Schreibweg zu bauen.
3. *Eine eigene Rollentabelle neben dem Profil.* Verworfen als vorgezogene Phase 1.5: Das generische Profil kommt mit dem Reise-Schema, und dann ist der Schnitt neu zu entscheiden.

**Begründung:** Eine Berechtigung, die sich selbst vergeben kann, ist keine. Dass die Prüfung im Trigger sitzt und nicht in der Anwendung, ist der Kern: Sie gilt für jeden Weg auf die Tabelle, auch für den, den noch niemand geschrieben hat.

**Begründung für die Rangfolge in der Datenbank:** `public.rollenrang(text)` gibt für eine unbekannte Rolle `null` zurück, nicht `0`. Das ist der Unterschied zwischen „hat die niedrigste Rolle" und „diese Rolle kennt niemand"; ein Vergleich mit `null` ist nie wahr, und damit ist der Fehlerfall geschlossen. Die CHECK-Bedingung auf der Spalte lautet deshalb `rollenrang(role) is not null` und wächst mit dem Modell mit, statt eine zweite Liste zu führen.

**Konsequenzen:** Wer bisher über `is_admin` oder `app_admins` Administrator war, hat in derselben Migrationskette vorher die Rolle `admin` erhalten – niemand verliert den Zugang. Die Rangfolge steht jetzt an zwei Orten, in `lib/auth/roles.ts` und in `public.rollenrang()`; `lib/auth/roles-datenbank.test.ts` vergleicht beide bei jedem `npm test` ohne Datenbank, sodass eine einseitig eingetragene Rolle den Test fehlschlagen lässt. Ein Nachfolger für den Inhaber bleibt einrichtbar, weil `owner` als einzige Rolle jede fremde Rolle setzen darf.

---

## ADR-0034 – Der Code darf nur ansprechen, was im Schema steht

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** `npm run check:schema-bezug` vergleicht jedes `.from('…')` und `.rpc('…')` im Anwendungscode mit `types/supabase.ts` und schlägt fehl, sobald etwas angesprochen wird, das es nicht gibt. Die Prüfung liest nur die erzeugte Typdatei und läuft deshalb ohne Datenbankzugang in der CI. `types/supabase.ts` wird ausschliesslich mit `npm run db:typen` erzeugt.

**Kontext:** Die Inventur fand zwei solche Stellen. Drei Security-Routen schrieben und lasen `ip_blocklist`; die Tabelle existiert nicht, die richtige heisst `blocked_ips`. Aufgefallen war es nie, weil `supabase-js` nicht wirft, sondern im `error`-Feld meldet – das `try/catch` um den Aufruf lief also nie an, und das Sperren einer IP meldete Erfolg, ohne etwas zu tun. Die Karten „Security & Health" riefen eine Funktion `admin_security_overview` auf, die es nie gab, fingen den Fehler ab und zeigten aus null Zeilen „RLS aktiv 0/0 – alle Tabellen geschützt".

**Alternativen:**

1. *Auf die Typisierung vertrauen.* Sie hätte beides gefunden – aber beide Aufrufstellen waren über `as any` beziehungsweise einen untypisierten Client geführt, genau um den Fehler herum. Eine Prüfung, die man mit einer Zeile abschaltet, ist keine.
2. *Gegen die laufende Datenbank prüfen.* Genauer, aber dann braucht die CI den Development-Zugang, und die Prüfung fiele bei jedem Lauf ohne Secrets aus. Die erzeugte Typdatei ist im Repository und sagt dasselbe, solange sie erzeugt und nicht gepflegt wird – wofür `db:typen -- --pruefen` sorgt.

**Begründung:** Beide Fehler waren still. Sie führten nicht zu einer Ausnahme, sondern zu einer falschen Aussage – „IP gesperrt", „alle Tabellen geschützt". Solche Fehler findet kein Test, der auf Ausnahmen wartet; sie brauchen einen Abgleich gegen die Wirklichkeit. Dass dieser Abgleich ohne Zugangsdaten auskommt, ist der Grund, warum er bei jedem Pull Request läuft.

**Konsequenzen:** Die Prüfung erfasst nur den geläufigen Weg über `.from()` und `.rpc()` mit einem Namen als Zeichenkette. Ein dynamisch zusammengesetzter Tabellenname entgeht ihr – das ist bewusst, weil eine Prüfung mit unsicheren Treffern niemand ernst nimmt. Drei Endpunkte sind bei der Korrektur entfallen: `security/block-ip` und `security/unblock-ip` waren Doppelungen ohne Aufrufer, `security/overview` rief die fehlende Funktion auf und hatte ebenfalls keinen. Die Funktion `admin_security_overview()` ist hergestellt worden, statt die Karten zu entfernen – mit interner Rollenprüfung und ohne die zweite, im Anwendungscode gepflegte Tabellenliste, die vorher unter anderem `payouts` enthielt, eine Tabelle, die es nicht gibt.

---

## ADR-0035 – Eine Policy nennt eine Fähigkeit, keine Rolle

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** Zwischen Rollenmodell und Policies steht eine Zwischenschicht aus fünf benannten Fähigkeiten: `betrieb-lesen` (ab `moderator`), `betrieb-eingreifen` (ab `operator`), `konten-verwalten` (ab `moderator`), `inhalte-moderieren` (ab `moderator`), `konfiguration-verwalten` (ab `admin`). Jede Mindestrolle steht genau einmal – in `CAPABILITY_MINIMUM` (`lib/auth/roles.ts`) – und wird in der Datenbank als `public.darf_…()` gespiegelt. Routen und Seiten verlangen eine Fähigkeit, keine Rolle; Policies rufen eine `darf_…()`-Funktion auf, nicht `hat_rolle_mindestens()`.

**Kontext:** Der erste Durchgang von Phase 1.4 stellte jede administrative Policy auf `hat_rolle_mindestens('admin')`. Die Anwendung lässt den Administrationsbereich seit Phase 1.3 aber ab `moderator` zu, und einzelne Eingriffe verlangen `operator`. Damit standen zwei unabhängige Aussagen über dieselbe Frage nebeneinander, und sie widersprachen sich:

- Eine Moderation kam durch `requireAdminApi()` für `GET /api/admin/security/list` und bekam danach von RLS jede Zeile weggefiltert – eine leere Liste, kein Fehler.
- Ein Betrieb kam durch `POST /api/admin/security/block`, die Policy verlangte `admin`, die Sperre lief ins Leere.
- `POST /api/admin/payments/refund` konnte gar nichts schreiben: Für `refunds` gab es keine INSERT-Policy und für `payments` keine UPDATE-Policy.
- `GET /api/admin/payments/webhooks` antwortete immer leer, weil `stripe_webhooks` weder Recht noch Policy hatte.

Die damaligen `db:sicherheit`-Fälle kannten nur `user`, `admin` und `owner`. Genau die beiden mittleren Rollen fehlten – deshalb blieb der Widerspruch unbemerkt.

**Alternativen:**

1. *Die Mindestrolle direkt in jede Policy schreiben, nur mit dem richtigen Wert.* Behebt den heutigen Widerspruch, nicht seine Ursache. Die Aussage stünde weiterhin an zwei Orten, und der nächste Gate-Wechsel liefe wieder auseinander – diesmal ohne dass jemand danach sucht.
2. *Die Anwendung an die Datenbank angleichen, also überall `admin` verlangen.* Das hätte `moderator` und `operator` bedeutungslos gemacht und wäre eine stille Rücknahme von Phase 1.3 gewesen.
3. *Eine Tabelle Fähigkeit → Mindestrolle in der Datenbank.* Zur Laufzeit änderbar, aber damit wäre die Berechtigungsregel Daten statt Code: nicht versioniert, nicht überprüfbar, nicht Teil eines Reviews.

**Begründung:** Die beiden Seiten lassen sich nicht auf eine reduzieren – die Anwendung muss vor dem Zugriff entscheiden, die Datenbank beim Zugriff. Wenn dieselbe Aussage zwangsläufig zweimal steht, muss sie maschinell vergleichbar sein. Über den Umweg der Fähigkeit ist sie das: `lib/auth/faehigkeiten-datenbank.test.ts` liest die Mindestrollen aus dem Migrations-SQL und vergleicht sie mit `CAPABILITY_MINIMUM` – ohne Datenbank, also in jedem CI-Lauf. `npm run db:rechte` lehnt zusätzlich jede Policy ab, die eine Rolle direkt nennt, damit der Umweg nicht umgangen wird.

Der zweite Gewinn ist die Sprache selbst. „Wer darf eine IP sperren" ist eine Produktfrage; „ab Rang 30" ist es nicht.

**Konsequenzen:** Eine Moderation sieht jetzt tatsächlich, was der Bereich ihr zeigt: Sicherheitsereignisse, Sperrliste, Zahlungen, fremde Profile. Ein Betrieb kann tatsächlich sperren und erstatten. `stripe_webhooks` ist ab `betrieb-lesen` lesbar – die Tabelle führt nur Kennung, Ereignisart und Zeitpunkt, keine Nutzlast; geschrieben wird sie weiterhin allein mit dem Service-Key. Tabellen ohne Route – `admin_email_boxes`, `dns_audit_events`, `copilot_suggestions` – bleiben bei `admin`. Die Nachweise in `npm run db:sicherheit` sind von 45 auf 81 gewachsen und decken jede Fähigkeit mit einem Paar aus der Stufe, ab der sie gilt, und der Stufe direkt darunter ab.

---

## ADR-0036 – Der Notzugang öffnet die Oberfläche, nicht die Datenbank

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** `ADMIN_ALLOWED_EMAILS` behält genau die Wirkung aus Phase 1.3: Es lässt eine eingetragene Adresse in den Administrationsbereich, auch ohne ausreichende oder lesbare Rolle. Es erteilt bewusst **keine** Rechte in der Datenbank. Jeder Datenzugriff einer solchen Sitzung wird von den Policies abgelehnt. Damit das nicht als Ausfall erscheint, zeigt der Bereich über der gesamten Shell einen Hinweis, sobald der Zugang über die Notliste zustande kam.

**Kontext:** Mit ADR-0035 hängt jeder administrative Datenzugriff an `creator_profiles.role`. Der Notzugang läuft danach weiterhin mit dem gewöhnlichen Client des angemeldeten Kontos. Sein Zweck – im Notfall wieder hereinzukommen – trägt damit nur bis zur Oberfläche; dahinter bleibt alles leer. Das musste entschieden werden, nicht stillschweigend hingenommen.

**Alternativen:**

1. *Die Notliste in der Datenbank hinterlegen und in `hat_rolle_mindestens()` mitprüfen.* Das wäre eine zweite Autorität neben `creator_profiles.role` – dieselbe Bauart wie `admin_domains` und `app_admins`, die Phase 1.4 gerade entfernt hat (ADR-0027, ADR-0033). Ein Eintrag ausserhalb des Rollenmodells könnte Rechte erteilen, und die Frage „wer ist Administrator" hätte wieder zwei Antworten.
2. *Den Service-Key für Notzugangs-Sitzungen verwenden.* Ein Umgehen von RLS, ausgelöst durch eine Umgebungsvariable. Der Schlüssel umgeht jede Policy und jeden Trigger, auch den gegen Rechteausweitung. Ausgeschlossen, und für Production ohnehin nicht verhandelbar.
3. *Einen Selbstbedienungsweg bauen: Wer über die Notliste hereinkommt, darf sich eine Rolle eintragen.* Das ist die Rechteausweitung, die ADR-0033 gerade unterbunden hat – nur mit der Umgebungsvariablen als Auslöser.
4. *Den Notzugang ersatzlos streichen.* Konsequent, aber eine stille Rücknahme von Phase 1.3 und ohne Not: Er hat weiterhin einen Wert, nur einen kleineren als gedacht.

**Begründung:** Ein Notzugang darf die Diagnose ermöglichen, nicht die Autorität ersetzen. Wer hereinkommt, sieht, dass er hereingekommen ist, sieht seine fehlende Rolle benannt und weiss, was zu tun ist. Was er nicht bekommt, sind Daten – denn dafür gibt es genau eine Quelle, und eine Umgebungsvariable ist keine.

Der Hinweis ist Teil der Entscheidung, nicht Beiwerk. Ohne ihn zeigte der Bereich einer Notzugangs-Sitzung leere Übersichten, und eine leere Sicherheitsübersicht liest sich als „nichts vorgefallen". Dieselbe Verwechslung von Ausfall und Entwarnung steckte in `admin_security_overview` („RLS aktiv 0/0 – alle Tabellen geschützt", ADR-0034) und im Sperren einer nicht existierenden Tabelle.

**Konsequenzen:** Der Weg zurück in den regulären Betrieb führt über einen Eintrag in `creator_profiles.role` – auf dem Development-Branch über den SQL-Editor oder `scripts/db/sql.mjs`, in Production über eine Migration oder eine bereits berechtigte Person. Das ist bewusst ausserhalb der Anwendung. `reachesDatabase()` in `lib/auth/admin-access.ts` hält den Satz als prüfbare Funktion fest, `lib/auth/admin-access.test.ts` prüft ihn auch für den Fall einer ausgefallenen Rollenabfrage, und vier Fälle in `npm run db:sicherheit` weisen nach, dass ein solches Konto in der Datenbank genau das ist, was seine Rolle sagt.

---

## ADR-0037 – Ein fehlgeschlagener Lesezugriff ist keine leere Liste

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** Die lesenden Admin-Routen unterscheiden drei Ausgänge statt einem. Eine erfolgreiche Abfrage ohne Zeilen bleibt eine leere Liste mit Status 200. Eine Ablehnung der Datenbank – fehlendes Recht, fehlende Relation, fehlerhafte Anfrage – wird 500. Ein Ausfall der Datenbank – nicht erreichbar, abgebrochen, Verbindungen erschöpft – wird 503. Die Unterscheidung steht einmal in `lese()` in `lib/api/datenbank-lesen.ts`, nicht in jeder Route.

**Kontext:** Sechs Routen umschlossen ihre Abfrage mit `try/catch` und lieferten im Fehlerfall `{ rows: [] }` oder Nullen. Das war doppelt wirkungslos: `supabase-js` wirft nicht, sondern meldet im Feld `error` – der Fang lief also nie an –, und wenn er anliefe, wäre das Ergebnis eine Falschaussage. `GET /api/admin/security/summary` hätte im Ausfall „0 Fehlanmeldungen, 0 Sperren" gemeldet, `GET /api/admin/payments/breakdown` dreissig Tage ohne Umsatz. Dieselbe Verwechslung von Ausfall und Entwarnung steckte in `admin_security_overview` („RLS aktiv 0/0 – alle Tabellen geschützt", ADR-0034) und in `stripe_webhooks`, das ohne Leserecht dauerhaft leer antwortete (ADR-0035).

**Alternativen:**

1. *Jeden Fehler auf 500 abbilden.* Einfacher, aber 500 heisst „hier ist etwas kaputt" und lädt nicht zum zweiten Versuch ein. Eine erschöpfte Verbindung ist kein Defekt, sondern ein Moment. Die Anwendung nutzt 503 bereits für die ausgefallene Rollenabfrage (ADR-0033); dieselbe Bedeutung gilt hier weiter.
2. *Den Fehler mitliefern und trotzdem 200 antworten*, etwa `{ rows: [], error: "…" }`. Damit müsste jede Aufrufstelle daran denken, das Feld zu lesen. Genau dieses Vertrauen hat vorher nicht getragen. Ein Status, den `fetch` von sich aus prüfbar macht, hält besser.
3. *Nur die Routen mit Aufrufern korrigieren.* Drei der sechs ruft heute niemand auf. Sie zurückzulassen hiesse, den Fehler für die nächste Oberfläche aufzubewahren, die sie einbindet.

**Begründung:** Eine leere Liste ist eine Aussage über die Wirklichkeit: Es ist nichts passiert, es gibt keine Zahlung, keine Sperre. Ein Fehler ist die Abwesenheit einer Aussage. Beides über dieselbe Antwort auszuliefern, nimmt der leeren Liste ihre Bedeutung – und im Administrationsbereich ist die leere Liste ausgerechnet dort am wichtigsten, wo sie beruhigt.

Der Unterschied zwischen 500 und 503 ist keine Kosmetik: Er sagt der Bedienerin, ob ein zweiter Versuch Sinn hat. Von RLS weggefilterte Zeilen bleiben bewusst eine leere Liste, denn die Datenbank hat geantwortet und ihre Antwort lautet „keine" – das ist der Fall einer Notzugangs-Sitzung, den der Hinweisbalken erklärt (ADR-0036), nicht ein Fehler.

**Konsequenzen:** Drei Defekte, die das Verschlucken verdeckt hatte, sind dabei sichtbar geworden und behoben. Die Suche in den Sicherheitsereignissen verglich `security_events.user_id` – eine `uuid` – mit `ilike`; Postgres lehnte jede Suche ab, die Route lieferte stillschweigend nichts. Ein Suchbegriff mit Komma oder Klammer zerlegte den `or`-Ausdruck von PostgREST und führte eine andere Abfrage aus als die gemeinte; Werte werden jetzt zitiert. Das Feld `configured`, das eine fehlende Tabelle anzeigen sollte, ist entfallen: Eine fehlende Tabelle ist jetzt ein Fehler, und niemand hat das Feld je gelesen.

In der Oberfläche blieb zunächst eine Lücke: Die Antwort des Servers war korrekt, ihre Darstellung nicht. Sie ist in Phase 1.4d geschlossen, siehe ADR-0040. Eine Route hat der damalige Umbau übersehen – `app/api/admin/security/list/route.ts` bildete jede Ablehnung auf 500 ab, statt `lese()` zu benutzen; auch das ist dort behoben.

---

## ADR-0038 – Legacy-Tabellen werden ohne `cascade` entfernt, und nur was nachgewiesen ist

**Datum:** 17. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** Die 29 als obsolet eingeordneten Tabellen sind in einer einzigen versionierten Migration entfernt worden, `supabase/migrations/20260817110000_legacy_entfernen.sql`. Drei Regeln haben den Umfang bestimmt:

1. **Kein `cascade`.** Jede Anweisung nennt ihr Ziel selbst. Eine Abhängigkeit, die nicht in der Liste steht, lässt die Migration scheitern.
2. **Nur nachgewiesene Zugehörigkeit.** Eine abhängige Funktion, ein Trigger, ein Enum oder eine Sequenz wird nur mitentfernt, wenn belegt ist, dass sie ausschliesslich zur entfernten Struktur gehört ([AGENTS.md](AGENTS.md) Regel 22).
3. **Archiv vor dem ersten Drop.** Der annotierte Tag `archive/pre-1-4b-legacy-datenbank` auf Commit `c058e845` sichert den Stand vorher und ist ins Remote gepusht (ADR-0003).

Entfernt sind damit 29 Tabellen, 24 Funktionssignaturen, 9 Trigger und die Enums `blog_status` und `creator_content_type`. Es bleiben 8 Tabellen.

**Kontext:** Phase 1.4 hat die Tabellen eingeordnet, versioniert und rechtlich eng geführt, sie aber bewusst nicht gelöscht – 29 Tabellen zu entfernen ist eine eigene, unumkehrbare Handlung. Vor dem Drop waren alle 29 leer; es gab keine Unterscheidung zwischen Testdaten und echten Daten zu treffen. Kein Anwendungscode sprach sie an (`npm run db:verwendung`), und in `app/`, `components/` und `lib/` fand die Textsuche keinen einzigen Treffer.

**Alternativen:**

1. *`drop table … cascade`.* Eine Anweisung statt vier Gruppen, und sie gelingt immer. Genau das ist der Einwand: Sie gelingt auch dann, wenn etwas daran hängt, das bleiben sollte, und sagt nicht, was sie mitgenommen hat. Bei 29 Tabellen mit 50 Fremdschlüsseln, 47 Policies und 24 Funktionen wäre der Umfang der Löschung nicht mehr aus der Migration ablesbar.
2. *Die Tabellen zunächst umbenennen oder in ein Schema `legacy` verschieben.* Reversibel ohne Tag. Aber der Bestand wäre nicht kleiner, nur verschoben: Rechte, Policies und Advisor-Befunde blieben, und das Schema wäre weiterhin überwiegend Alt-Struktur. Die Reproduzierbarkeit aus Phase 1.4 macht den Tag zur besseren Sicherung – aus den elf Migrationen des Tags lässt sich der alte Stand herstellen.
3. *Nur die Tabellen entfernen und die abhängigen Funktionen stehen lassen.* PostgreSQL verlangt es nicht: Tabellenbezüge im Rumpf einer Funktion stehen nicht in `pg_depend`. Genau deshalb wäre es falsch – 18 Signaturen hätten den Drop unbemerkt überlebt und wären erst beim Aufruf mit „relation does not exist" gescheitert, dieselbe Klasse wie `ip_blocklist` und `admin_security_overview` (ADR-0034).
4. *Auch die verwaisten Objekte auf den verbleibenden Tabellen mitnehmen*, etwa das Enum `session_status` und fünf Funktionen ohne Aufrufer. Verlockend, weil sie beim Aufräumen auffallen. Aber sie gehören zu `creator_profiles` und `creator_sessions`, nicht zur Legacy-Struktur; sie hier zu entfernen wäre ein ungeplanter Eingriff in Tabellen, die geschützt bleiben sollten.

**Begründung:** Der Verzicht auf `cascade` verwandelt eine Vermutung in einen Nachweis. Eine Aufzählung von Abhängigkeiten sagt, was gefunden wurde; sie kann nicht sagen, was übersehen wurde. Der Trockenlauf in einer zurückgerollten Transaktion ohne `cascade` sagt es – und er hat zwei echte Reihenfolgeabhängigkeiten gefunden, die keine Katalogabfrage gezeigt hätte: `publish_due_blog_posts(integer)` gibt `setof blog_posts` zurück und hängt damit am Zeilentyp der Tabelle, und Triggerfunktionen lassen sich nicht vor ihren Triggern entfernen. Die Reihenfolge der Migration – Abfragefunktionen, Tabellen, Triggerfunktionen, Enums – ist deshalb gemessen und nicht gewählt.

Die zweite Regel kostet Sauberkeit und kauft Verlässlichkeit. Drei Objektgruppen wirken nach der Migration verwaist und sind trotzdem geblieben: `set_updated_at()`, weil `creator_sessions` sie noch über einen Trigger ruft; das Enum `session_status`, weil seine drei Werte genau die sind, die `creator_sessions_review_status_check` auf der verbleibenden Spalte `creator_sessions.review_status` erlaubt – die Zugehörigkeit zur entfernten Struktur ist damit nicht nachweisbar; und `darf_konfiguration_verwalten()` samt der Fähigkeit `konfiguration-verwalten`, deren drei Tabellen alle zu den 29 gehörten. Die Fähigkeit zu entfernen wäre ein Eingriff in das Admin-Rollen- und Fähigkeitssystem (ADR-0035) statt eine Aufräumaktion; sie wird stattdessen jetzt direkt nachgewiesen, `select 1 where public.darf_konfiguration_verwalten()`, statt über eine Tabelle.

**Konsequenzen:** Das Schema beschreibt nur noch, was verwendet wird: 8 Tabellen, 66 Spalten, 2 Fremdschlüssel, 19 Policies, 19 Funktionen. `anon` liest genau eine Tabelle, `airports`. Die Advisor-Befunde fallen von 45 auf 13 (Security) und von 47 auf 9 (Performance), ohne dass eine Einstellung geändert wurde – die Befunde hingen an den entfernten Tabellen.

`npm run db:rechte` prüft seither eine vierte Regel, die aus dem dritten Alternativpunkt folgt: Jedes `public.<name>` in einem Funktionsrumpf muss sich als Relation, Funktion oder Typ auflösen. Die Prüfung ist gegengeprobt – in einer zurückgerollten Transaktion findet sie eine künstlich erzeugte Funktion mit totem Bezug. Damit ist die Fehlerklasse aus ADR-0034 auch für die Datenbank selbst abgedeckt, nicht nur für den Anwendungscode.

Neun der Nachweise in `npm run db:sicherheit` bezogen sich auf entfernte Strukturen. Sie sind durch gleichwertige an verbleibenden Strukturen ersetzt statt gestrichen: Ein Nachweis, der wegfällt, nimmt seine Aussage mit. Zwei Ersetzungen sind strenger als das Original – statt einer benannten `SECURITY DEFINER`-Funktion prüft der Nachweis jetzt jede solche Funktion in `public` daraufhin, dass `anon` sie nicht ausführen darf.

Production ist nicht angefasst. Ob dort dieselben 29 Tabellen liegen, ist nicht erhoben; der Abgleich gehört zum ersten Production-Deploy nach Phase 1.5. Der vollständige Bericht mit Zeilenzahlen, Dependency-Nachweis und den Listen der entfernten und verbliebenen Objekte steht in [docs/LEGACY_ENTFERNUNG.md](docs/LEGACY_ENTFERNUNG.md).

---

## ADR-0039 – Die Auth-Konfiguration steht im Repository, und ihre Vollständigkeit wird geprüft

**Datum:** 17. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** Der Auth-Abschnitt von `supabase/config.toml` beschreibt ab jetzt den Development-Branch, Schlüssel für Schlüssel gegen `GET /v1/projects/{ref}/config/auth` abgeglichen. Was die CLI-Konfiguration nicht ausdrücken kann, steht mit Begründung in `OHNE_TOML_SCHLUESSEL` in `lib/supabase/auth-erwartung.ts` und wird per PATCH gesetzt. `npm run auth:pruefen` vergleicht beides mit dem laufenden Branch und verlangt zusätzlich, dass **jeder** der 242 Schlüssel der API im Repository eingeordnet ist – als Sollwert, mit begründetem Verzicht oder über ein Muster. `password_hibp_enabled` ist auf `true` gesetzt. Ein `[remotes.*]`-Block entsteht nicht; das Ziel ist immer der Branch aus `SUPABASE_PROJECT_REF`, und `scripts/auth/ziel.ts` bricht ab, wenn dahinter ein eigenständiges Projekt steht.

**Kontext:** Phase 1.4 hat Schema, Rechte und Policies aus dem Repository nachvollziehbar gemacht. Die Auth-Ebene lag daneben und war es nicht: `config.toml` war der unveränderte Vorlagenstand der CLI. Er beschrieb weder Development noch Production und widersprach dem laufenden Branch an neun Stellen – Passwortlänge 6 statt 12, E-Mail-Bestätigung aus statt an, TOTP aus statt an, Redirect-Liste `["https://127.0.0.1:3000"]` statt leer. Wer die Datei gelesen hätte, um zu erfahren, wie sich ein Konto anmeldet, hätte sich getäuscht. Anders als beim Schema gibt es hier keine Migration: Ein Klick im Dashboard ändert die Anmeldung ohne Spur im Repository.

**Alternativen:**

1. *Nur `password_hibp_enabled` einschalten und den Rest lassen.* Der Advisor wäre still, und die Datei wäre weiter falsch. Genau diese Reihenfolge – Symptom vor Ursache – hat die Lage erzeugt: Die Einstellung ist ja nicht deshalb offen geblieben, weil niemand sie kannte, sondern weil es keinen Ort gab, an dem sie hätte stehen können.
2. *Einen `[remotes.<branch>]`-Block anlegen*, wie die offizielle Branch-Konfiguration es vorsieht. Er verlangt den Projekt-Ref im Klartext im Repository und trennt zwei Umgebungen – solange von hier aus nur Development verwaltet wird, ist das eine Unterscheidung ohne Wirkung ([AGENTS.md](AGENTS.md) Regel 12). Der Parameter dafür bleibt in `erwarteteAuthKonfiguration()` vorhanden, damit ein zweites Ziel andocken kann.
3. *Nur die Werte prüfen, die `config.toml` nennt.* Das wäre die halbe Zusage. Zehn sicherheitsrelevante Schlüssel kennt die CLI nicht, unter ihnen der wichtigste – der Schutz vor kompromittierten Passwörtern. Eine Konfiguration-als-Code, die gerade den offenen Befund nicht abdeckt, hätte den Namen nicht verdient.
4. *Eine Liste erwarteter Werte pflegen und alles Übrige ignorieren.* Eine Liste deckt ab, was sie kennt. Sie hätte nicht gemeldet, wenn ein neuer Anmeldedienst oder ein Auth-Hook eingeschaltet worden wäre – beides Wege in die Anwendung hinein. Deshalb zusätzlich zwei Musterregeln: Jedes `external_*_enabled` und jedes `hook_*_enabled`, das `config.toml` nicht nennt, muss aus sein.
5. *Ein TOML-Paket für den Abgleich benutzen.* Vierzig Zeilen Grammatik gegen eine Abhängigkeit – und der Wert von `password_requirements` enthält `#`, wo TOML einen Kommentar beginnt. Der eigene Leser in `lib/supabase/config-toml.ts` bricht bei allem ab, was er nicht kennt, statt still etwas Falsches zu liefern.

**Begründung:** Ein Zustand, den niemand aus dem Repository ableiten kann, ist kein Zustand, auf den man sich verlassen kann. Für das Schema ist das seit Phase 1.4 entschieden; die Anmeldung ist der Weg *in* die Anwendung und verdient dieselbe Behandlung.

Die Vollständigkeitsprüfung ist der eigentliche Gewinn, nicht der Abgleich der 55 Werte. Sie beantwortet die Frage, die zur Lage geführt hat: nicht „stimmt dieser Wert", sondern „gibt es einen Schalter, über den wir nie etwas gesagt haben".

Zum Befund `auth_leaked_password_protection` ist das Kommen und Gehen des Advisors jetzt erklärt statt vermutet: Er meldet nur, solange passwortgestützte Konten existieren. Ohne solches Konto ergibt der Lauf 13 Security-Befunde, mit einem 14. Die Testkonten der RLS-Nachweise entstehen in zurückgerollten Transaktionen und sind beim Advisor-Lauf nicht mehr da. `password_hibp_enabled` war der einzige Unterschied zwischen Branch und Elternprojekt in den 35 sicherheitsrelevanten Schlüsseln – der Branch lag hinter Production zurück.

Zur Verfügbarkeit der Funktion: Sie ist **Pro Plan und höher**, nicht in allen Plänen („Leaked password protection is available on the Pro Plan and above", [Password security](https://supabase.com/docs/guides/auth/password-security)). Für Jetnity entsteht dadurch weder ein Plan-Wechsel noch eine Zusatzgebühr – die Organisation läuft bereits auf Pro, gemessen über `GET /v1/organizations/{id}` (`"plan": "pro"`), und das Elternprojekt führte die Funktion schon. Festgehalten wird die Aussage trotzdem in dieser Form, weil sie eine Abhängigkeit benennt: Auf Free wäre dieser Schutz nicht verfügbar. Die frühere Formulierung „in allen Plänen verfügbar" war falsch; sie schloss aus einem angenommenen PATCH auf eine Eigenschaft aller Pläne.

**Konsequenzen:** `npm run auth:pruefen` läuft in der CI in einem eigenen Job, und der Job ist fail-closed: Fehlen `SUPABASE_ACCESS_TOKEN` oder `SUPABASE_PROJECT_REF` in den Repository-Secrets, bricht er ab. Die einzige Ausnahme ist ein Pull Request aus einem Fork – GitHub gibt ihm keine Secrets, dort ist das Fehlen die Regel und kein Versäumnis. Die erste Fassung hat stattdessen nur den Schritt übersprungen und den Job grün gemeldet; das ist genau der Zustand, den der Kommentar im Workflow ausschliessen wollte, denn ein grüner Job mit übersprungenem Inhalt sieht aus wie eine bestandene Prüfung.

Der Abgleich schreibt ausserdem den Wert eines Schlüssels nur, wenn das Repository ihn namentlich nennt. Bei einem unbekannten Schlüssel – und den zu melden ist der Sinn der Vollständigkeitsprüfung – erscheint nur der Name. Die Auth-Konfiguration führt Geheimnisse (`jwt_secret`, `security_captcha_secret`), und was in einem Schlüssel steht, den es beim Schreiben der Liste noch nicht gab, weiss definitionsgemäss niemand. Der Wert gelangt deshalb gar nicht in den Befund, statt beim Formatieren weggefiltert zu werden: `lib/supabase/auth-bericht.ts`, geprüft in `lib/supabase/auth-bericht.test.ts` gegen Text- und JSON-Ausgabe. Aus demselben Grund geben die Fehlermeldungen in `scripts/auth/ziel.ts` nicht mehr den Antwortkörper der API weiter, sondern nur deren `message`-Feld. `npm run auth:fluesse` prüft die Wirkung statt der Werte: 18 Fälle an den echten Endpunkten, vom abgelehnten Datenleck-Passwort bis zum Rücksetzlink, der bei einem fremden Host auf `site_url` zurückfällt.

Drei Dinge sind dabei aufgefallen und behoben. Die Passwortregel stand zweimal im Code und beide Male anders: Die Seite nach dem Rücksetzlink verlangte acht Zeichen ohne Zeichengruppen, der Auth-Server zwölf aus vier – wer der Anzeige folgte, bekam eine englische Ablehnung. Die Ablehnung wegen eines Datenlecks fiel im Formular auf „Passwortanforderungen nicht erfüllt" durch, obwohl die angezeigten Anforderungen erfüllt waren; GoTrue schreibt „known to be weak and easy to guess" und nennt weder „leaked" noch „pwned". Und der Fortschrittsbalken stand auf jeder Stufe im Markengrün. Alles drei liegt jetzt in `lib/auth/passwort-richtlinie.ts`, und `lib/supabase/auth-erwartung.test.ts` vergleicht die Regel bei jedem `npm test` mit `config.toml`.

Nicht behoben, sondern festgehalten: Google und Apple stehen als Schaltfläche in beiden Formularen und sind auf dem Branch aus – ein Klick endet in „provider is not enabled". Einschalten braucht Client-ID und Secret beider Anbieter und ist eine Handlung ausserhalb dieses Repositories ([ROADMAP.md](ROADMAP.md)).

Production ist nicht angefasst. Der Vergleich in [docs/AUTH.md](docs/AUTH.md) Abschnitt 3 ist ausschliesslich gelesen; der Abgleich gehört zum ersten Production-Deploy nach Phase 1.5.

---

## ADR-0040 – Eine Admin-Ansicht sagt, wenn sie nichts weiss

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** Die Unterscheidung zwischen einem Fehler und einer echten Leere steht in der Oberfläche einmal, in `lib/admin/ladezustand.ts`, und ihre Darstellung einmal, in `components/admin/Ladezustand.tsx`. Alle vier lesenden Admin-Ansichten benutzen beides. Drei Zustände sind unterscheidbar und werden unterschiedlich gezeigt:

1. **Antwort da, keine Zeile** – die gewohnte leere Ansicht, „Keine Transaktionen", „Keine Events".
2. **Abgelehnt (4xx/5xx)** – eine Fehlerfläche mit der Meldung des Servers. Die Leermeldung erscheint dann nicht, und wo Zahlen stünden, steht ein Strich.
3. **Nicht angekommen** – dieselbe Fläche, ohne die Meldung des Browsers durchzureichen.

Nur bei 503 lädt die Fläche zusätzlich zum zweiten Versuch ein; bei 500 hat die Datenbank geantwortet und abgelehnt, und dieselbe Anfrage scheitert wieder. Die Schaltfläche „Erneut versuchen" bleibt in beiden Fällen – sie ist der Weg zurück, nachdem die Ursache behoben wurde –, der Satz „Ein zweiter Versuch kann helfen" nur beim ersten.

**Kontext:** ADR-0037 hat die Serverseite geordnet. Die Oberfläche gab das nur zum Teil weiter, und zwar in vier verschiedenen Formen:

- `TransactionsCard` und `WebhooksCard` warfen bei `!res.ok` eine Ausnahme in ein `finally` **ohne `catch`**. Niemand fing sie, der Zustand blieb auf `[]` stehen, und die Tabelle meldete „Keine Transaktionen" bzw. „Keine Events". Im Zahlungsbereich heisst das: es gab keine Zahlung. `WebhooksCard` hat den Fall vorgeführt – `stripe_webhooks` hatte bis Phase 1.4 weder Recht noch Policy, die Route antwortete 500, die Karte sagte „Stripe hat nichts geschickt".
- `OverviewCard` zeigte die Meldung, darunter aber trotzdem drei Nullen, eine flache Kurve und „Keine Daten in den letzten 30 Tagen". Der Vorgabewert `[]` war von einem Ergebnis nicht zu unterscheiden.
- `SecurityWidget` zeigte einen Toast. Er verschwand nach vier Sekunden und liess vier Kennzahlen auf 0 und zwei Tabellen mit „Keine Einträge" zurück – im Sicherheitsbereich also genau die Entwarnung, gegen die ADR-0034 und ADR-0037 geschrieben sind. Die Ansicht lädt sich alle 15 Sekunden neu; der Toast kam bei jedem Lauf erneut.

**Alternativen:**

1. *Nur die zwei Zahlungskarten korrigieren*, wie die Roadmap den Punkt geführt hat. Dann hätten vier Ansichten weiter vier Formen für denselben Zustand, und `OverviewCard` und `SecurityWidget` – die vermeintlichen Vorbilder – wären die beiden falschen geblieben.
2. *Den Toast zum Muster machen.* Er ist das richtige Mittel für eine Handlung mit einer Antwort und bleibt es dort: Sperren und Entsperren melden weiter per Toast. Für eine Ansicht ist er falsch, weil er verschwindet und die falsche Aussage stehen lässt.
3. *Die Meldung als `string | null` in jeder Karte halten.* Reicht für die Anzeige, verliert aber die Unterscheidung aus ADR-0037: Ob ein zweiter Versuch Sinn hat, ist dann nicht mehr im Zustand.
4. *Einen Datenlade-Haken oder eine Bibliothek dafür einführen.* Mehr, als das Problem verlangt ([AGENTS.md](AGENTS.md) Regel 12). Es ging nie um das Holen, sondern um die Deutung einer Antwort – und die ist ohne React und ohne `fetch` prüfbar, sobald sie in `lib/` steht.
5. *Bei einem Fehler die zuletzt geholten Daten verwerfen.* Konsequent, aber im Sicherheitsbereich schädlich: Aus einem Aussetzer würde eine leere Liste. Die Daten bleiben stehen und werden als älter gekennzeichnet.

**Begründung:** Eine leere Liste ist im Administrationsbereich eine Aussage – keine Sperre, keine Fehlanmeldung, keine Zahlung – und sie ist ausgerechnet dort am wichtigsten, wo sie beruhigt. Ein Fehler ist die Abwesenheit einer Aussage. Beides gleich darzustellen nimmt der leeren Liste ihre Bedeutung.

Dass die Unterscheidung in `lib/` liegt und nicht in einer Komponente, ist der Punkt, an dem sie prüfbar wird. `lib/admin/ladezustand.test.ts` stellt 23 Fälle gegeneinander, darunter den, an dem die zwei Karten gescheitert sind: Status 500 mit `{ rows: [] }` im Körper. Ein fehlendes Feld gilt dabei ebenfalls als Fehler und nicht als leere Liste – `data.rows ?? []` war genau die Zeile, die aus beidem dasselbe machte.

**Konsequenzen:** Am laufenden Server gemessen, mit entzogenem `select` auf `payments`, `stripe_webhooks` und `security_events`: Alle drei Karten zeigen „permission denied for table …" statt einer leeren Tabelle, die Kennzahlen der Sicherheitsübersicht stehen auf Strich statt auf 0, und ein Filter ohne Treffer zeigt weiterhin „Keine Transaktionen." ohne Fehlerfläche. Nach dem Zurückgeben des Rechts führt „Erneut versuchen" zurück in die gefüllte Ansicht.

Vier Dinge sind dabei aufgefallen und behoben:

- `app/api/admin/security/list/route.ts` war die einzige lesende Route, die `lese()` nicht benutzte, und bildete jede Ablehnung auf 500 ab – auch eine erschöpfte Verbindung. Die Oberfläche wertet den Unterschied jetzt aus, also musste die Route ihn liefern (ADR-0037).
- `RefundCard` las `data.error`, die Route sendet `message`. Die Begründung der Datenbank – der einzige Hinweis, warum eine Rückerstattung nicht gebucht wurde – kam nie an. Der Hinweis darunter versprach ausserdem noch, die API antworte bei fehlenden Tabellen „freundlich ohne Crash"; seit ADR-0037 stimmt das nicht, und es wäre die falsche Zusage.
- Die zwei Eingriffe in `SecurityWidget` prüften nur `j.ok`. `requireAdminApi` antwortet ohne `ok` und mit `error` statt `message` – ein abweisendes Gate führte damit zu „Block fehlgeschlagen" ohne nennbaren Grund.
- „Mehr laden" stand im Fehlerfall weiter unter der Tabelle, abgeschaltet aber sichtbar, und damit als zweites Angebot neben „Erneut versuchen". Eine Fortsetzung gibt es nicht, solange die erste Seite fehlt.

Kein neues Aussehen: Rahmen, Radius und Fehlerfarben sind die, die die Formulare in `components/auth` für ihre Meldungen benutzen ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)).

**Die Prüfung der übrigen Ansichten hat drei weitere Stellen derselben Klasse gefunden**, alle serverseitig und deshalb ohne HTTP-Status dazwischen. Der Auftrag nannte sie nicht; sie stehen trotzdem hier, weil sie dieselbe Falschaussage erzeugen und zwei davon auf der Startseite der Administration.

- `AdminStatsStrip` las unter `if (!error && data)`. Scheiterte die Abfrage, blieben die Vorgabewerte stehen: „Gesamtumsatz (30T) CHF 0.00", „Bestellungen 0", „Conversion-Rate 0.0%".
- `AdminTimeSeries` prüfte `error` überhaupt nicht und zeichnete vierzehn Tage mit null Sitzungen.
- `app/(admin)/admin/users/page.tsx` schrieb die Ablehnung ins Serverprotokoll und zeigte „Admin · 0 Nutzer gesamt" mit leerer Tabelle – in einer Benutzerverwaltung die Aussage, es gebe niemanden.

`AdminHealthCards` hatte den Fall bereits richtig, seit ADR-0034, und ist das Muster: ein Strich und „Abfrage fehlgeschlagen" statt einer Zahl. Die drei folgen ihm, mit der Fläche und ohne Wiederholen-Schaltfläche – eine Server-Komponente kann keine Funktion an den Browser geben, das Neuladen der Seite ist der Weg. Die übrigen Admin-Seiten (`analytics`, `content`, `localization`, `marketing`, `settings`) lesen heute keine Daten.

Damit die Einordnung nicht zweimal formuliert wird, ist `problemAus()` aus `lib/api/datenbank-lesen.ts` exportiert. Nötig war das, weil eine Abfrage mit `head: true` absichtlich `data: null` liefert und deshalb nicht durch `lese()` passt – sie durch `lese()` zu schicken hiesse, den Zähler als fehlende Daten zu lesen. Dabei ist eine Eigenschaft von PostgREST aufgefallen und gemessen: **Eine HEAD-Antwort hat keinen Körper**, `postgrest-js` liefert dann `{ message: '' }` ohne SQLSTATE. Dieselbe Abfrage meldet als GET „permission denied for table creator_sessions", als HEAD nichts. `problemAus()` nennt in diesem Fall den Statuscode – „Die Datenbank hat die Abfrage abgelehnt (HTTP 403), ohne eine Begründung mitzusenden" – statt eine leere Zeile anzuzeigen.

Zuletzt eine Ursache, die erst durch die Fehlerdarstellung sichtbar wurde: Der Suchbegriff der Benutzerverwaltung stand unzitiert im `or`-Ausdruck, in dem das Komma die Glieder trennt. Am Branch gemessen ergab `a,b` HTTP 400 „failed to parse logic tree"; die Seite zeigte „0 Nutzer gesamt". Es ist derselbe Fehler, der in ADR-0037 für die Ereignissuche behoben wurde, und der Ausdruck kommt jetzt aus derselben Stelle, `lib/api/suchfilter.ts`.

---

## ADR-0041 – Adminrechte öffnen keine privaten Reiseinhalte

**Datum:** 17. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** Auf keiner der vier Reisetabellen – `trips`, `trip_stages`, `trip_days`, `trip_items` – gibt es eine Policy, die eine Fähigkeit prüft. Es gibt dort ausschliesslich Policies der Form `user_id = (select auth.uid())`, je Tabelle für SELECT, INSERT, UPDATE und DELETE. Wer `/admin` erreicht, sieht keine Reise, und das gilt bis zur höchsten Rolle des Modells.

Die Kennzahlen des Administrationsbereichs kommen deshalb nicht aus einer Abfrage über die Tabelle, sondern aus zwei `SECURITY DEFINER`-Funktionen, die ausschliesslich Aggregate liefern: `admin_reisen_kennzahlen()` (Reisen der letzten 30 Tage, Reisen insgesamt, Konten mit Reise) und `admin_reisen_zeitreihe(integer)` (neue Reisen je Tag). Beide prüfen `darf_betrieb_lesen()` selbst und liefern ohne die Fähigkeit keine Zeile. Kein Titel, kein Ziel, keine Kennung, kein Betrag verlässt sie.

**Kontext:** Für jede andere Tabelle des Schemas ist eine Verwaltungsfähigkeit selbstverständlich: `payments` und `security_events` sind ab `betrieb-lesen` lesbar, fremde Profile ab `konten-verwalten`. Für Reisen war dieselbe Zeile schnell geschrieben – und zwei Umstände legten sie nahe. Erstens verlor die Fähigkeit `inhalte-moderieren` mit `creator_sessions` ihren letzten Gegenstand (ADR-0044); Reisen wären der naheliegende neue gewesen. Zweitens zog die Startseite der Administration ihre Kennzahlen aus genau dieser Tabelle und brauchte einen Ersatz.

Der zweite Umstand ist die eigentliche Falle. Eine Abfrage über `public.trips` aus einer Admin-Ansicht scheitert nicht, sie liefert null Zeilen – RLS filtert jede weg. Die Ansicht hätte „0 Reisen" gemeldet, und das ist die Verwechslung von „nicht berechtigt" mit „nichts vorhanden", gegen die ADR-0034, ADR-0037 und ADR-0040 geschrieben sind.

**Alternativen:**

1. *Eine Lesepolicy ab `betrieb-lesen` auf `trips`.* Der Supportfall ist echt: „Meine Reise ist verschwunden" lässt sich ohne Einsicht schwer beantworten. Aber eine Policy ist eine dauerhafte, stille Öffnung für jede Person ab `moderator` und für jede Abfrage – auch für die, die niemand gestellt hat. Ein Support, der Reiseinhalte sehen soll, braucht eine ausdrückliche Entscheidung samt Protokollierung, nicht eine Zeile in einer Migration.
2. *Reisen zum Gegenstand von `inhalte-moderieren` machen.* Moderation gehört zu veröffentlichten Inhalten. Eine private Reiseplanung wird nicht veröffentlicht; es gibt nichts zu moderieren. Die Fähigkeit bleibt deshalb vorläufig ohne Fläche, wie `konfiguration-verwalten` seit Phase 1.4b.
3. *Die Kennzahlen direkt über die Tabelle lesen.* Siehe oben: still eine Null.
4. *Für die Kennzahlen einen Service-Role-Client verwenden.* Damit wäre der erste Service-Role-Pfad seit Phase 1.4 zurück in der Anwendung, und zwar für drei Zahlen ([AGENTS.md](AGENTS.md) Regel 14). Eine `SECURITY DEFINER`-Funktion begrenzt den erhöhten Zugriff auf wenige Zeilen SQL, deren Ausgabe man lesen kann.

**Begründung:** Eine Reiseplanung enthält, wohin jemand wann mit wem fährt. Das ist kein Betriebsdatum wie eine Zahlung, sondern das Privateste, was Jetnity speichert. Ein Adminkonto ist für die Datenbank ein Konto wie jedes andere – derselbe Satz, den ADR-0036 für den Notzugang festgehalten hat, hier auf Reiseinhalte angewendet.

Der Unterschied zwischen Zahl und Inhalt ist dabei der Punkt, an dem die Entscheidung praktikabel bleibt: „Wie viele Reisen entstehen pro Tag" ist eine legitime Betriebsfrage, „was hat diese Person geplant" nicht. Zwei Aggregatfunktionen beantworten die erste, ohne die zweite zu ermöglichen.

**Konsequenzen:** Sechs Nachweise in `npm run db:sicherheit` halten die Entscheidung fest, und zwei davon sind bewusst leer: Inhaber und Administration lesen eine fremde Reise – 0 Zeilen; die Administration ändert und löscht eine fremde Reise – 0 Zeilen; Moderation liest fremde Reisen – 0 Zeilen. Ein siebter prüft die Aussage strukturell statt beispielhaft: Keine Policy auf den vier Reisetabellen nennt eine der `darf_…()`-Funktionen. Diese Form fängt auch eine Policy, die es heute noch nicht gibt.

Die beiden Aggregatfunktionen sind ihrerseits sechsfach nachgewiesen – `anon` bekommt kein EXECUTE-Recht, ein gewöhnliches Konto und ein Creator keine Zeile, Moderation die Zahlen.

Die Advisors melden dafür zwei Befunde mehr in der Klasse `authenticated_security_definer_function_executable` (6 statt 4). Das ist die bekannte, in [docs/DATENBANK.md](docs/DATENBANK.md) Abschnitt 8 begründete Klasse: Die Funktion muss für `authenticated` aufrufbar sein, prüft die Fähigkeit aber selbst.

Offen bleibt der Supportfall. Er ist nicht gelöst, sondern zurückgestellt: Wenn Einsicht in eine fremde Reise nötig wird, ist das eine Produktentscheidung mit eigenem ADR, eigener Protokollierung und der Frage, ob die betroffene Person davon erfährt.

---

## ADR-0042 – Der Gast bleibt ohne serverseitige Identität, und seine Reise wandert genau einmal ins Konto

**Datum:** 17. August 2026
**Status:** umgesetzt

**Entscheidung:** Ein Gast bekommt kein Konto in `auth.users`, keine Zeile in einer Gasttabelle und kein serverseitiges Kennzeichen. Seine Reise liegt im `localStorage`, unter genau einem Schlüssel und als genau eine aktive Reise (`jetnity:reise:v3`). `anon` hat auf keiner Reisetabelle ein Recht und auf `public.reise_anlegen()` kein EXECUTE.

Bei Login oder Registrierung überträgt `lib/trips/uebernahme.ts` alles, was im Browser liegt, in drei Schritten:

1. je Entwurf ein Aufruf von `public.reise_anlegen()`,
2. der lokale Entwurf verschwindet erst, wenn der Server die Kennung der Reise gemeldet hat,
3. beim ersten Fehler bricht der Vorgang ab und lässt liegen, was noch nicht bestätigt ist.

Die Idempotenz sitzt in der Datenbank, nicht im Browser: `trips.client_ref` trägt mit `unique (user_id, client_ref)` die Kennung des Entwurfs, und `reise_anlegen()` schreibt mit `on conflict do nothing`. Derselbe Entwurf ergibt pro Konto genau eine Reise – bei Reload, Retry, doppeltem Request, zweitem Login und zwei offenen Tabs.

**Kontext:** ADR-0009 macht Jetnity ohne Konto nutzbar, ADR-0013 begrenzt den Gast auf eine Reise. Der Code hielt beides nur halb: `lib/trips/guest-store.ts` erlaubte 20 Entwürfe (`MAX_GUEST_TRIPS = 20`) und kannte keinen Weg ins Konto – der offene Widerspruch Nummer 1 dieser Datei.

Supabase bietet für Gäste anonyme Anmeldungen an. Sie wären der bequeme Weg: Der Gast hätte eine `auth.uid()`, die Reise läge sofort in der Datenbank, und die Übernahme wäre ein `update … set user_id = …`.

**Alternativen:**

1. *Anonyme Anmeldung.* Sie erzeugt echte Zeilen in `auth.users` – eine je Besucherin, ohne E-Mail, ohne Bestätigung, ohne jemanden, der sie verantwortet. Damit entstehen drei neue Aufgaben, die es heute nicht gibt: ein Aufräumen verwaister Konten, RLS-Policies für ein Konto, das niemandem gehört, und eine Zählung, die in die monatlich aktiven Benutzer einfliesst. Für ein Produkt, das seinen Gästen ausdrücklich *keine* Registrierung abverlangt, ist ein unsichtbares Schattenkonto das Gegenteil der Zusage.
2. *Eine Gasttabelle mit Token im Cookie.* Dasselbe Problem in eigener Verwaltung, dazu ein Cookie, das ohne Zustimmung gesetzt wird und eine Person über Sitzungen hinweg wiedererkennbar macht.
3. *Die Übernahme im Auth-Callback erledigen.* Der naheliegende Ort – und technisch unmöglich: `localStorage` gehört dem Browser, ein Route Handler sieht ihn nicht. Die Übernahme muss dort beginnen, wo die Daten liegen.
4. *Nach dem Login zum Neuanlegen auffordern.* Ehrlich, aber es wirft die Arbeit weg, für die der Gastmodus überhaupt existiert.
5. *Idempotenz über einen „migriert"-Vermerk im Browser.* Der Vermerk steht auf der falschen Seite: Zwei Tabs, ein Reload zwischen Aufruf und Antwort oder ein zweites Gerät kennen ihn nicht. Nur die Datenbank sieht alle Fälle gleichzeitig, und dort ist es eine Eindeutigkeitsbedingung – kein Code.

**Begründung:** Der Gastmodus soll den Wert von Jetnity vor der Registrierung zeigen, nicht eine Identität anlegen, die niemand bestellt hat. `localStorage` ist dafür nach [AGENTS.md](AGENTS.md) Regel 13 ausdrücklich zulässig, sofern die Daten später sauber migrierbar sind – und genau diese Migrierbarkeit ist hier der Preis, der bezahlt wurde: `client_ref` steht im Schema, `reise_anlegen()` nimmt den ganzen Reisegraphen in einer Transaktion, und die Kennung des Entwurfs ist von Anfang an die Kennung, die später die Idempotenz trägt.

Die Reihenfolge senden → bestätigen → löschen ist die einzige, die keinen Entwurf verlieren kann. Ein Entwurf, der gelöscht ist, ohne im Konto zu liegen, ist verlorene Arbeit, die niemand rekonstruieren kann; ein Entwurf, der zweimal gesendet wird, ist dank der Eindeutigkeit ein Nichtereignis. Von zwei möglichen Fehlern ist damit der harmlose ausgewählt.

**Konsequenzen:** Die Übernahme liegt bewusst nicht in der React-Komponente, sondern in `lib/trips/uebernahme.ts`; `components/trips/GastreiseBruecke.tsx` ist nur noch ihre Anzeige. Damit ist die Reihenfolge ohne Browser prüfbar, und `lib/trips/uebernahme.test.ts` prüft sie in den Fällen, die der Auftrag genannt hat: Gast ohne Reise (kein Aufruf), Gast mit Reise, Retry nach Fehler, doppelter Request, bereits übernommene Reise, Manipulation der Nutzlast, sowie zwei parallel gestartete Durchläufe. Ein Riegel im Modul verhindert dabei nur das gleichzeitige Aufräumen des Browserspeichers – für die Datenbank wäre auch der Doppellauf harmlos.

Der Umstieg auf die eine aktive Reise verwirft keine Daten. Browser mit mehreren Entwürfen aus der Fassung `jetnity:guest-trips:v2` behalten den zuletzt geänderten als aktive Reise; die übrigen wandern in eine Warteschlange, sind nicht bearbeitbar und werden beim nächsten Login mit übernommen. Der alte Schlüssel wird erst gelöscht, wenn der neue geschrieben ist – bricht der Vorgang dazwischen ab, läuft er beim nächsten Laden erneut. Ein zweiter Versuch, eine Gastreise anzulegen, während eine besteht, endet in einem Hinweis auf das Konto, nicht im stillen Überschreiben (ADR-0013).

Was bleibt, ist der Preis der Entscheidung, und er ist nicht klein: Eine Gastreise ist an einen Browser gebunden. Privates Fenster geschlossen, Speicher geleert, Gerät gewechselt – die Reise ist weg. Die Oberfläche sagt das, statt Dauerhaftigkeit anzudeuten.

`reise_anlegen()` ist zusätzlich begrenzt: höchstens 60 neue Reisen je Konto und Stunde, mit SQLSTATE `53400`, den die Anwendung als „später erneut versuchen" übersetzt. Der Aufruf ist angemeldet, aber ein angemeldetes Konto in einer Schleife wäre sonst ein Weg, die Datenbank zu füllen ([AGENTS.md](AGENTS.md) Regel 15). Die Schranke ist eine Rate und keine Gesamtzahl – wie viele Reisen ein Konto besitzen darf, ist eine Produktentscheidung und steht hier nicht zur Debatte.

---

## ADR-0043 – Das Reiseschema: vier Tabellen, CHECK statt Enum, Eigentum auf jeder Zeile

**Datum:** 17. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** Das V2-Reisedatenmodell besteht aus vier Tabellen in `20260817120000_reiseschema.sql`:

| Tabelle | Inhalt |
| --- | --- |
| `trips` | die Reise: Titel, Abreiseort, Zeitraum, Reisende, Währung, Budget, Status, Tempo, Interessen, Reisewunsch |
| `trip_stages` | Etappen und Orte in Reihenfolge, mit Land und Koordinaten |
| `trip_days` | Reisetage: `day_index` als verbindliche Ordnung, `day_date` als optionales Kalenderdatum |
| `trip_items` | Planpunkte: `flight`, `stay`, `activity`, `transfer`, `note` |

Sechs Festlegungen prägen die Form, jede gegen eine naheliegendere Alternative:

1. **CHECK statt Enum.** Jeder Wertebereich – Status, Tempo, Art, Interessen – steht in einer Prüfbedingung. Das Schema führt damit **keinen** Enum-Typ mehr.
2. **`user_id` auf jeder Tabelle**, dazu ein zusammengesetzter Fremdschlüssel `(trip_id, user_id) → trips (id, user_id)`. Die Policy ist ein Spaltenvergleich statt einer Unterabfrage, und ein Kind kann keine Reise einer anderen Person benennen.
3. **Eigentum ist nicht vom Client setzbar.** `user_id` trägt `default auth.uid()`, und jede Policy verlangt in `using` **und** `with check` die Gleichheit mit `auth.uid()`. Damit ist die Spalte faktisch unveränderlich, ohne Auslöser.
4. **`jsonb` nur für das, wonach nicht gefragt wird.** Jede Tabelle hat `metadata jsonb`, begrenzt auf ein Objekt und 8192 Zeichen, und nichts filtert oder sortiert darüber. Was abgefragt wird, bekommt eine Spalte.
5. **Keine Provider-Abstraktion.** Ein Planpunkt trägt `provider`, `external_ref` und `booking_url` (nur HTTPS). Eine Angebots-, Anbieter- oder Buchungstabelle entsteht, wenn ein Anbieter angebunden ist ([AGENTS.md](AGENTS.md) Regel 19).
6. **Zeit in Teilen statt als `timestamptz`.** `starts_on`/`starts_at`/`ends_on`/`ends_at` plus `time_zone`. Ein Check-in um 15:00 ist eine Ortszeit und bleibt 15:00.

**Kontext:** Bis zu dieser Phase existierte eine Reise ausschliesslich im `localStorage`: ein Titel, ein Ziel, Tage mit freien Einträgen. Darauf lässt sich der Produktkern nicht bauen – ohne Struktur gibt es keine Preisübersicht, kein Budget über die ganze Reise und keine Übergabe an einen Anbieter, und der Trip Builder aus Phase 2 wäre eine Demo. Das Modell ist deshalb aus den Produktanforderungen abgeleitet und nicht aus dem bestehenden Speicherformat.

**Alternativen:**

1. *Enum-Typen für die Wertebereiche.* Sie lesen sich sauberer und werden von PostgreSQL geprüft. Aber ein Enum lässt sich nur erweitern, nie kürzen: Einen Wert zurückzunehmen heisst, einen neuen Typ anzulegen und jede Spalte umzuschreiben. Für Wertebereiche, die in Phase 2 und 3 noch wachsen und sich korrigieren werden, ist ein CHECK die billigere Migration – eine Zeile. Dieselbe Entscheidung trägt `profiles.role` seit Phase 1.4.
2. *Policies über `exists (select 1 from trips …)`.* Der übliche Weg, und er spart drei Spalten. Er läuft aber je Zeile und je Operation, und er lässt ein Kind an einer fremden Reise hängen, solange nur die Policy stimmt. Mit `user_id` auf dem Kind und dem zusammengesetzten Fremdschlüssel ist beides erledigt, und der Index, der den Fremdschlüssel deckt, ist derselbe, der die Leseordnung liefert.
3. *Eine Tabelle `trips` mit dem ganzen Reisegraphen als `jsonb`.* Verlockend schnell. Damit wäre aber jede Frage der Phase 3 – „was kostet diese Reise", „welche Flüge sind gebucht" – eine Textsuche, und kein Fremdschlüssel würde einen halben Stand verhindern.
4. *Eine eindeutige `position`.* Klingt richtiger, macht aber jedes Umsortieren mehrschrittig, weil PostgREST eine Bedingung nicht auf das Transaktionsende verschieben kann. Gelesen wird deterministisch nach `position, created_at, id`.
5. *Eine Teilnehmertabelle statt `travellers smallint`.* Solange nur die Anzahl gebraucht wird, wäre sie eine Tabelle für eine Zahl. Sobald Namen, Geburtsdaten oder Ausweisdaten anfallen, ist sie fällig – und dann als eigene Entscheidung mit eigener Schutzstufe, nicht als leere Vorbereitung.
6. *Eine Verknüpfung von Tag zu Etappe.* Wäre eine zweite Quelle für dieselbe Aussage: Welche Etappe ein Tag betrifft, folgt aus deren Daten. Was wirklich an einer Etappe hängt – eine Unterkunft über mehrere Nächte –, hängt an `trip_items.stage_id`.
7. *Nur `day_date` oder nur `day_index`.* Ohne Index liesse sich „Tag 1 Anreise, Tag 2 Tempel" ohne festen Zeitraum nicht abbilden – und genau so entsteht eine Reiseidee. Ohne Datum wäre jede Datumsanzeige eine Rechnung über den Reisebeginn und beim Verschieben falsch.

**Begründung:** Das Modell soll das kleinste sein, das die Anforderungen trägt – und trotzdem eines, auf dem Phase 2 und 3 ohne Neubau aufsetzen können. Deshalb sind alle Datumsangaben optional (eine Reiseidee entsteht ohne Zeitraum), deshalb sind Tag und Etappe an einem Planpunkt beide optional (ein noch nicht eingeplanter Fund hängt an keinem von beiden), und deshalb löscht `on delete set null` bei einem entfernten Tag nur die Zuordnung und nicht den Planpunkt. Wird eine Reise kürzer, verschwindet die Arbeit nicht, sie wird unzugeordnet.

Die Grenzen sind gezählt und nicht geschätzt: 366 Tage, 50 Etappen, 1000 Planpunkte, 8 KB `metadata`, 256 KB Nutzlast je Aufruf. Sie liegen weit über jeder realen Reise und tief unter allem, was einer Datenbank schadet.

**Konsequenzen:** Das Schema wächst von 8 auf 11 Tabellen, von 66 auf 102 Spalten, von 2 auf 7 Fremdschlüssel, von 4 auf 45 CHECK-Bedingungen und von 19 auf 31 Policies. Enums gibt es keine mehr. Die Zahlen stehen in [docs/DATENBANK.md](docs/DATENBANK.md) Abschnitt 3, das Modell fachlich in [docs/REISEN.md](docs/REISEN.md).

Die Indizes folgen den Zugriffspfaden, die es wirklich gibt: `trips (user_id, updated_at desc)` für „Meine Reisen", je Kindtabelle ein Index, der den zusammengesetzten Fremdschlüssel deckt und gleichzeitig die Leseordnung liefert, dazu zwei für die optionalen Verweise auf Tag und Etappe, weil PostgreSQL beim Löschen darüber sucht. Ein Teilindex verhindert zwei Tage mit demselben Datum in einer Reise.

Nachgewiesen ist das Modell in `npm run db:sicherheit` mit 128 statt 78 Nachweisen – 40 davon neu und auf Reisen bezogen, darunter jede Operation getrennt, der Zugriff zwischen zwei Konten, der Zugriff ohne Anmeldung, das Umschreiben der eigenen Reise auf ein fremdes Konto und das Anhängen eines Kindes an eine fremde Reise. Zwei Prüfbedingungen sind dabei aufgefallen und im Entwurf korrigiert worden: `interests` liess denselben Wert doppelt zu (jetzt `liste_ohne_doppelte()`, weil eine Unterabfrage in einem CHECK nicht erlaubt ist), und ein Preis war ohne Währung eintragbar (jetzt beides oder nichts).

---

## ADR-0044 – Aus `creator_profiles` wird `profiles`, und die letzte Alt-Tabelle fällt

**Datum:** 17. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** Zwei Migrationen schliessen die Alt-Struktur ab.

`20260817120200_creator_sessions_entfernen.sql` entfernt `creator_sessions`, die letzte Tabelle der alten Produktidee, dazu drei Funktionen, die ausschliesslich ihre Freigabeliste lasen, den Auslöser `t_creator_sessions_updated_at` mit `set_updated_at()` und die beiden letzten Enums `visibility_status` und `session_status`. Ohne `cascade`, mit demselben Nachweisverfahren wie Phase 1.4b (ADR-0038).

`20260817120300_generisches_profil.sql` benennt `creator_profiles` in `profiles` um – und entfernt im selben Zug die neun Spalten der öffentlichen Creator-Identität (`instagram`, `tiktok`, `youtube`, `twitter`, `facebook`, `bio`, `website`, `username`, `name`). Bedingungen, Indizes, Policies, Auslöser und Funktionen tragen danach Namen ohne `creator`. `ROLE_TABLE` in `lib/auth/admin-guard.ts` nennt `profiles`.

**Kontext:** Die Rolle eines Kontos liegt seit Phase 1.3 an genau einer Stelle, und diese Stelle hiess `creator_profiles`. Phase 1.3 hat den Tabellennamen deshalb in einer Konstante zusammengeführt, Phase 1.4 hat die Tabelle hergerichtet und die Umbenennung auf 1.5 verschoben, weil zuerst Rollenmodell und Rechte stehen mussten. Beides stand.

`creator_sessions` war in Phase 1.4b bewusst verschont geblieben: Die Startseite der Administration zog daraus „Sitzungen (30 Tage)" und einen 14-Tage-Verlauf, und eine Kennzahl ohne Ersatz zu entfernen wäre eine Verschlechterung gewesen. Der Ersatz existiert seit `20260817120100` (ADR-0041).

**Alternativen:**

1. *Nur umbenennen, Spalten behalten.* Eine Tabelle `profiles`, die weiterhin `instagram`, `tiktok` und `username` führt, ist kein generisches Profil, sondern das Creator-Profil unter neuem Namen. Der Name hätte die Aufräumarbeit vorgetäuscht, die er ankündigt.
2. *Die freigewordenen Spalten für Reisepräferenzen weiterverwenden.* Verlockend, weil sie da sind. Eine Präferenz in einer Spalte namens `bio` ist aber eine Falle für jede Person, die das Schema später liest. Präferenzen bekommen eigene Spalten oder eine eigene Tabelle, wenn sie fällig sind.
3. *Eine neue Tabelle anlegen und die Zeilen migrieren.* Sauber bei einem Schnittwechsel, hier aber unnötig: Der Schnitt bleibt (ein Profil je Konto), und ein Umbenennen behält Rechte, RLS-Schalter und Fremdschlüssel, statt sie neu aufzubauen.
4. *`session_status` stehen lassen.* Es war schon vor Phase 1.4b verwaist, durfte damals aber nicht fallen, weil seine Werte genau die des CHECK auf `creator_sessions.review_status` waren – der Nachweis der Zugehörigkeit fehlte. Mit der Tabelle fällt die Spalte, und damit ist er erbracht.

**Begründung:** Ein Name, der etwas anderes sagt als der Inhalt, kostet jede Leserin einmal Vertrauen und einmal Zeit. `AGENTS.md` Regel 22 erlaubt das Entfernen von Alt-Code, verlangt aber den Nachweis – und der lag hier vollständig vor: null Zeilen in beiden Tabellen, keine eingehenden Fremdschlüssel, keine Views, und im Anwendungscode ausschliesslich die zwei Admin-Ansichten, die in derselben Änderung auf Reisen umgestellt sind.

Dass der Statuscheck neu gesetzt und nicht umbenannt wird, hat einen prüfbaren Grund: `lib/auth/roles-datenbank.test.ts` liest die zulässigen Werte aus der **letzten** `add constraint …_status_check`-Anweisung der Migrationen. Ein reines Umbenennen hätte diese Anweisung nicht erneuert, und der Test läse weiter die Fassung von Phase 1.4 – eine Prüfung, die nur noch zufällig auf die Wirklichkeit zeigt.

**Konsequenzen:** Drei offene Punkte aus Phase 1.4b sind damit geschlossen, keiner davon durch Wegsehen. Das Enum `session_status` ist entfernt, jetzt mit Nachweis. Von den fünf Funktionen ohne Aufrufer sind alle fünf gefallen – drei mit `creator_sessions`, zwei mit dem Profil, dazu ein doppelter Auslöser: `set_profile_email_from_auth()` schrieb die E-Mail, `set_profile_core_from_auth()` schrieb E-Mail **und** Anzeigename; der zweite enthält den ersten vollständig. Zwei Auslöser für dieselbe Zuweisung sind keine Absicherung, sondern zwei Stellen, an denen sie auseinanderlaufen kann.

Was bleibt, bleibt mit Grund. Die Extension `citext` wird von keiner Spalte mehr verwendet (`username` war die letzte), bleibt aber stehen: Sie liegt in einem eigenen Schema, kostet nichts, und eine Extension zu entfernen ist eine eigene Handlung mit eigenem Nachweis. Die Fähigkeit `inhalte-moderieren` hat mit `creator_sessions` ihren letzten Gegenstand verloren und bleibt trotzdem Teil des Fähigkeitsmodells – wie `konfiguration-verwalten` seit Phase 1.4b, und ausdrücklich **ohne** Reisen als neuen Gegenstand (ADR-0041). Beide werden direkt geprüft, `select 1 where public.darf_…()`.

Im Anwendungscode war die Umstellung, was Phase 1.3 versprochen hatte: `ROLE_TABLE` an einer Stelle, dazu die Abfragen der Benutzerverwaltung, ein Testskript und zwei Prüfskripte. `AdminStatsStrip` und `AdminTimeSeries` lesen jetzt „Reisen (30 Tage)", „Reisen gesamt", „Konten mit Reise (30 Tage)" und einen 14-Tage-Verlauf neuer Reisen – über die Aggregatfunktionen, nicht über die Tabelle.

---

## ADR-0045 – Die Erzeugungsregeln einer Reise gehören in die Datenbank, nicht in eine Funktion

**Datum:** 18. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** `20260818010000_reise_erzeugungsregeln.sql` verankert drei Regeln so, dass sie unabhängig vom Aufrufweg gelten:

* `trips.client_ref` ist `NOT NULL`. Die Kennung ist damit Pflicht, und `unique (user_id, client_ref)` wirkt auf jede Zeile.
* Der Auslöser `trips_erzeugung_pruefen` läuft vor jeder Einfügung. Er setzt `created_at` und `updated_at` selbst, verlangt `status = 'draft'` und lehnt die einundsechzigste neue Reise eines Kontos innerhalb einer Stunde ab (`53400`).
* `public.reise_anlegen()` verliert seine eigene Zählung. Sie stand an zwei Stellen mit derselben Zahl; die im Auslöser ist die vollständige.

`INSERT` auf `public.trips` bleibt bei `authenticated`, RLS bleibt die Stelle, die über Eigentum entscheidet.

**Kontext:** Phase 1.5 hat `reise_anlegen()` als „die einzige Stelle, an der eine Reise entsteht" beschrieben. Das war eine Aussage über die Anwendung. `authenticated` hat `INSERT` auf der Tabelle, und PostgREST macht dieses Recht mit dem öffentlichen anon-Key erreichbar – der Sicherheitsnachweis „Konto legt eine Reise ohne user_id an" belegte es sogar ausdrücklich. Ein angemeldeter Client konnte damit beliebig viele Reisen direkt anlegen, die Kennung weglassen, `status = 'booked'` behaupten und die Missbrauchsschranke vollständig übergehen. Ein rückdatiertes `created_at` hätte auch eine Schranke ausgehebelt, die direkte Einfügungen mitzählt: Zeilen ausserhalb des Zeitfensters zählen nicht mit.

**Alternativen:**

1. *`INSERT` entziehen und `reise_anlegen()` auf `SECURITY DEFINER` umstellen.* Ergibt tatsächlich genau einen Erzeugungsweg. Der Preis ist hoch: Die Funktion schreibt in vier Tabellen, und als `SECURITY DEFINER` läuft sie an RLS vorbei. Das Eigentum an einer Reise hinge danach an der Sorgfalt eines Funktionsrumpfs statt an Policies, die jeder Nachweis einzeln prüft. Dazu käme eine sechste per RPC erreichbare `SECURITY DEFINER`-Funktion – die Advisors zählen sie zu Recht.
2. *Eine Policy mit der Schranke im `WITH CHECK`.* Policies gelten nur für `authenticated`, nicht für andere Rollen, und ein Unterausdruck mit `count(*)` in einer Policy ist schwer zu lesen und schwer zu prüfen. Ein Auslöser sagt, was er tut.
3. *Die Zahl in der Anwendung prüfen.* Die Anwendung ist nicht der einzige Client eines PostgREST-Endpunkts. Genau das war der Befund.
4. *Auch die Zahl der Etappen, Tage und Planpunkte je Reise im Auslöser prüfen.* Fachlich derselbe Gedanke, technisch ein anderer Fall: `reise_anlegen()` fügt bis zu 1000 Planpunkte in einer Anweisung ein, und ein Auslöser je Zeile mit einer Zählung machte daraus quadratischen Aufwand. Der Punkt steht im Backlog der [ROADMAP.md](ROADMAP.md) und ist dort als offen benannt, nicht stillschweigend erledigt.

**Begründung:** Eine Schranke, die man umgehen kann, indem man einen anderen Weg nimmt, ist keine. Zwischen den beiden ernsten Varianten – Recht entziehen oder Regel verankern – entscheidet, was danach die Sicherheit trägt: Nach a) trägt sie Code, nach b) tragen sie Bedingung, Auslöser und Policies gemeinsam, jedes für sich prüfbar. Ein direkter `INSERT` ist nach b) kein Loch mehr, sondern ergibt dasselbe wie ein Aufruf ohne Etappen: eine eigene Reise mit Kennung, als Entwurf, innerhalb der Schranke.

Der Auslöser ist `SECURITY DEFINER`, damit die Zählung nicht durch die Lesepolicy läuft – eine Schranke, die von einer Lesepolicy abhängt, wäre nur so lange richtig, wie diese jede eigene Reise zeigt. Aufrufbar ist die Funktion für niemanden: `revoke all … from public, anon, authenticated`; ein Auslöser braucht kein Ausführungsrecht des Aufrufers. Deshalb erscheint sie auch nicht in den Advisors, und die Zahl der Sicherheitsbefunde bleibt bei 18.

Dass die Zeitstempel überschrieben und nicht abgelehnt werden, ist die Ausnahme von „nichts stillschweigend ändern": `created_at` ist kein Feld der Oberfläche, sondern eine Feststellung der Datenbank. `setze_aktualisiert_am()` macht seit Phase 1.5 dasselbe beim Ändern.

**Konsequenzen:** Sieben neue Nachweise in `scripts/db/sicherheit.mjs` prüfen den direkten Weg, jeder mit Gegenprobe: ohne Kennung, mit `booked`, als Entwurf (erlaubt), mit rückdatiertem Zeitstempel, an der Schranke, und mit 61 Zeilen in einer einzigen Anweisung.

Ein Nebeneffekt der Verlegung ist der zweiten Überprüfung aufgefallen und in ADR-0048 behoben: Ein `BEFORE INSERT`-Auslöser läuft vor dem eindeutigen Index, und damit warf die Schranke an der Grenze auch dann, wenn `on conflict do nothing` gar keine Reise angelegt hätte.

Zwei Grenzen bleiben und sind zu kennen. Erstens gilt `status = 'draft'` beim Anlegen, nicht bei jeder Änderung: Ein Konto kann seine eigene Reise anschliessend auf `booked` setzen. Ein Statusmodell mit erlaubten Übergängen gehört zu Phase 2, wenn eine Buchung entsteht – vorher wäre es eine Regel ohne Vorgang. Zweitens bleibt die Zahl der Kindzeilen je Reise ungebremst; siehe Alternative 4.

**Nachtrag, 20. August 2026:** Phase 2.2 hat `reise_anlegen()` für `trip_days.stage_id` ersetzt und dabei die Zählung aus der Urfassung `20260817120100` wieder in den Rumpf geholt. Das brach ADR-0048: An der Schranke warf die Funktion `53400`, bevor `on conflict` die Wiederholung erkennen konnte. `20260820050000_reise_anlegen_ohne_schranke.sql` nimmt die Zählung wieder heraus. Die Schranke gilt weiter nur im Auslöser.

---

## ADR-0046 – Im Browser gilt nur als gespeichert, was zurückgelesen wurde

**Datum:** 18. August 2026
**Status:** umgesetzt

**Entscheidung:** `lib/trips/gastspeicher.ts` behandelt einen fehlgeschlagenen Schreibvorgang als Fehler.

* Jeder Schreibvorgang wird zurückgelesen. Nur was wieder herauskommt, gilt als abgelegt.
* Ein Fehlschlag wirft `SpeicherFehler`. Das Formular unter /planen bleibt stehen und wechselt nicht in den Arbeitsbereich einer Reise, die es nirgends gibt; der Arbeitsbereich zeigt den Fehler statt eines gespeicherten Stands.
* Gelöscht wird nur, was nachweislich anderswo liegt: der alte Schlüssel `jetnity:guest-trips:v2` erst nach bestätigtem Schreiben **beider** neuer Schlüssel, ein übernommener Entwurf erst nach der Kennung aus dem Konto.
* Ausgenommen ist `uebernommenStreichen()`. Dort liegt die Reise bestätigt im Konto, und `public.reise_anlegen()` ist über `client_ref` idempotent: Bleibt der Entwurf liegen, schickt ihn die nächste Übernahme erneut, ohne eine zweite Reise zu erzeugen.

**Kontext:** Die Fassung aus Phase 1.5 verschluckte jeden Fehler von `setItem` mit der Begründung, eine Ausnahme würde die Oberfläche mitten in einer Eingabe abreissen. Die Folge war schlimmer: `gastreiseAnlegen()` und `gastreiseSpeichern()` meldeten Erfolg, die Oberfläche navigierte weiter, und beim nächsten Laden war die Reise „verschwunden". Am teuersten war die Übernahme aus der alten Fassung: Sie schrieb zwei Schlüssel, prüfte keinen davon und löschte danach den alten. Bei voller Ablage gelang das `removeItem` – und die alten Entwürfe waren weg.

**Alternativen:**

1. *`try/catch` behalten und nur den Rückgabewert um ein „nicht gespeichert" erweitern.* Ein Rückgabewert, den ein Aufrufer ignorieren kann, ist bei Datenverlust die falsche Bauform. Eine Ausnahme muss behandelt werden.
2. *Nur `try/catch`, ohne Zurücklesen.* Es gibt Browser, in denen `setItem` nicht wirft und trotzdem nichts behält – der private Modus mancher Fassungen. Genau dieser Fall wäre weiter als Erfolg durchgegangen.
3. *Auf einen anderen Speicher ausweichen (IndexedDB, Cookie).* Ein zweiter Speicherweg für den Ausnahmefall ist ein zweites Datenmodell im Browser. Der ehrliche Weg ist der Hinweis auf das Konto: Dort liegt die Reise auf dem Server.
4. *Den unbrauchbaren alten Eintrag weiter wegräumen.* Er kostet je Laden ein `JSON.parse`. Ihn zu löschen, ohne dass etwas geschrieben wurde, ist genau der Vorgang, den diese Entscheidung ausschliesst.

**Begründung:** Ohne Konto ist der `localStorage` der einzige Ort, an dem die Reise existiert. Eine Ausnahme ist unangenehm, ein „gespeichert", das nicht stimmt, ist ein Datenverlust mit falscher Auskunft. Reihenfolge und Nachweis sind deshalb wichtiger als ein ungestörter Ablauf im seltenen Fehlerfall.

**Konsequenzen:** Zehn neue Fälle in `lib/trips/gastspeicher.test.ts`: gesperrter Speicher beim Anlegen, stummer Speicher, freier Weg nach einem gescheiterten Versuch, Bearbeitung und Planpunkt ohne Ablage, Verwerfen, das nicht gelingt, sowie drei Fälle zur Legacy-Übernahme – Schreibfehler auf beiden Schlüsseln, Schreibfehler nur auf der Warteschlange und der Nachholvorgang, der nichts verdoppelt. Der Fall, der bisher „kein Throw" erwartete, erwartet jetzt das Gegenteil.

Die Warteschlange wird beim Nachholen gegen die aktive Reise abgeglichen. Ohne diesen Abgleich stünde ein Entwurf zweimal im Speicher, sobald ein Lauf zwischen den beiden Schlüsseln abbricht.

Eine Grenze bleibt: Ein alter Entwurf, den das Schema ablehnt – etwa mit einem Titel über 120 Zeichen –, fällt bei der Übernahme heraus. Das ist unverändert die Entscheidung aus ADR-0042 (nicht halb laden), betrifft Daten, die die Anwendung nicht darstellen kann, und ist kein Fehlschlag eines Schreibvorgangs.

---

## ADR-0047 – Die öffentliche Leiste kennt die Sitzung, das öffentliche Layout bleibt statisch

**Datum:** 18. August 2026
**Status:** umgesetzt

**Entscheidung:** `components/layout/PublicNavbar.tsx` liest die Sitzung im Browser und zeigt „Abmelden" statt „Anmelden", sobald eine besteht. Das Abmelden ist ein Formular auf `signOutAction()`.

Die Entscheidung, was in der Leiste steht, liegt in `lib/auth/oeffentliche-navigation.ts` und kennt drei Zustände: `unbekannt`, `gast`, `konto`. Im Zustand `unbekannt` behauptet die Leiste nichts.

**Kontext:** Die Leiste zeigte auch bei offener Sitzung immer „Anmelden" und nie „Abmelden", obwohl `signOutAction()` seit Phase 1.3 existiert. Solange im öffentlichen Bereich nur Marketingseiten lagen, war das Kosmetik. Mit persistenten privaten Reisen ist es keine mehr: Auf einem geteilten Gerät bleibt eine Sitzung offen, deren einziger sichtbarer Ausweg der Administrationsbereich wäre – den ein gewöhnliches Konto nicht betreten darf. Die [ROADMAP.md](ROADMAP.md) hatte den Punkt als 1.7 vermerkt; die Überprüfung vor dem Merge hat ihn zu Recht als Sicherheitsthema eingeordnet.

**Alternativen:**

1. *Die Sitzung im Layout lesen (`app/(public)/layout.tsx`).* Der kürzere Weg – und jede öffentliche Seite wäre dynamisch, weil das Layout dann Cookies liest. Die Startseite ist Marketing und bleibt vorgerendert (`○ /` im Build).
2. *Eine eigene Leiste je Bereich.* Zwei Leisten für eine Marke laufen auseinander.
3. *Im Browser über `supabase.auth.signOut()` abmelden.* Beendet die Sitzung im Browser und lässt die Cookies des Servers stehen. Die Server Action löscht beide.
4. *Zwei Zustände statt drei, mit „Anmelden" als Anfangszustand.* Die Leiste erschiene für ein angemeldetes Konto einen Moment lang mit der falschen Aussage. Genau die falsche Aussage war der Befund.

**Begründung:** Die Leiste ist ohnehin ein Client Component (Menü, aktiver Pfad). `getSession()` von `@supabase/ssr` liest die Cookies, die der Server gesetzt hat, und geht nicht ins Netz; `onAuthStateChange` hält den Stand nach, sodass eine Anmeldung in einem anderen Tab die Leiste ohne Neuladen erreicht. Damit kostet die Sitzungskenntnis kein Rendering-Verhalten.

**Nachtrag aus der Prüfung im Browser.** Die erste Fassung liess nach dem Abmelden weiter „Abmelden“ stehen, bis jemand neu lud. Der Grund liegt im Zusammenspiel der beiden Wege: `signOutAction()` löscht die Cookies auf dem Server, die Weiterleitung ist eine Navigation innerhalb der Anwendung, und die Leiste liegt im Layout – sie wird dabei nicht neu aufgebaut. `onAuthStateChange` schweigt, weil der Browser-Client nicht selbst abgemeldet hat. Die Leiste liest die Sitzung deshalb zusätzlich nach jedem Wechsel des Pfads und nach jedem abgeschlossenen Vorgang (`useFormStatus`; nur dort gilt der Status des Formulars).

Gelesen und nicht angenommen: `standAusSitzung()` bekommt den tatsächlichen Stand aus den Cookies, nicht den erwarteten Erfolg des Klicks. Ein optimistisches „Anmelden“ nach dem Absenden wäre kürzer und in der gefährlichen Richtung falsch – es sagte, die Sitzung sei beendet, während sie nach einem gescheiterten Vorgang offen bleibt. `getSession()` liest bei jedem Aufruf aus dem Speicher (`__loadSession`), ein zwischengespeicherter Stand steht dem also nicht entgegen.

Dass „Abmelden" kein Link ist, ist keine Stilfrage: Next.js lädt Links voraus und Browser holen sie vor. Eine Adresse, die beim Aufruf abmeldet, beendet die Sitzung, ohne dass jemand geklickt hat – dieselbe Begründung, aus der `app/auth/sign-out.ts` eine Server Action ist. Der Typ `Navigationseintrag` unterscheidet deshalb `link` und `aktion`, und ein Test hält fest, dass „Abmelden" nie ein Link wird.

**Konsequenzen:** Was die Leiste zeigt, ist eine Anzeige und keine Berechtigung; über Zugriff entscheiden weiterhin Middleware, Server Components und RLS. Fehlt die Supabase-Konfiguration – etwa in einer Vorschau ohne Umgebung –, bleibt der Zustand `unbekannt`, statt die Seite mit einer Ausnahme abzureissen.

Acht Fälle in `lib/auth/oeffentliche-navigation.test.ts` prüfen die Regel ohne Browser, darunter beide Richtungen nach einem Abmelden: keine Sitzung mehr ergibt „Anmelden“, eine weiter offene Sitzung lässt „Abmelden“ stehen. Der Punkt 1.7 der Roadmap ist damit erledigt und nicht verschoben.

---

## ADR-0048 – Die Missbrauchsschranke zählt Neuanlagen, nicht Schreibversuche

**Datum:** 18. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** `20260818020000_reise_wiederholung.sql` ergänzt `public.reise_erzeugung_pruefen()` um eine Frage vor der Zählung: Liegt `(user_id, client_ref)` schon vor, entsteht keine Reise, und die Schranke gilt nicht. Der Schreibvorgang ist damit nicht erlaubt – er läuft weiter in `trips_client_ref_eindeutig` und endet dort, wo er hingehört: in `reise_anlegen()` im `on conflict do nothing`, auf dem direkten Weg in `23505`.

Die Prüfung steht **nach** `status = 'draft'` und nach dem Setzen der Zeitstempel. `booked` beim Anlegen zu behaupten ist auf jedem Weg falsch, auch wenn die Zeile danach ohnehin am eindeutigen Index scheitern würde.

**Kontext:** ADR-0045 hat die Erzeugungsregeln aus dem Rumpf von `reise_anlegen()` in einen `BEFORE INSERT`-Auslöser verlegt, damit sie auf jedem Schreibweg gelten. Übersehen wurde dabei die Reihenfolge, in der PostgreSQL eine Einfügung abarbeitet: erst der Auslöser, dann der eindeutige Index, dann `on conflict`. Der Auslöser warf also, bevor die Idempotenz greifen konnte.

Hatte ein Konto 60 Reisen in der letzten Stunde und wiederholte danach einen bereits erfolgreichen Aufruf – Retry nach einem Netzfehler, ein Reload, eine zweite Anmeldung –, dann entstand dabei fachlich keine Reise, und die Schranke lehnte trotzdem mit `53400` ab. Der Entwurf im Browser blieb liegen, weil `lib/trips/uebernahme.ts` ihn erst nach der Kennung aus dem Konto löscht, und jeder weitere Versuch scheiterte gleich – bis eine Stunde vergangen war. Dieselbe Verwechslung traf den direkten Weg: Ein `INSERT` mit belegter Kennung meldete `53400` statt `23505`.

Die Ursache war keine falsche Zahl, sondern eine falsche Frage. Der Auslöser fragte „wie viele Reisen hat dieses Konto in der letzten Stunde angelegt?" und schloss daraus auf „darf dieser Schreibvorgang durch?". Dazwischen fehlte: „entsteht hier überhaupt eine Reise?"

**Alternativen:**

1. *Die Schranke in einen `AFTER INSERT`-Auslöser verlegen.* Dann läuft sie nach dem eindeutigen Index, und eine per `on conflict` verworfene Zeile erreicht sie nie. Verlockend, aber die Zeitstempel und `status = 'draft'` müssen `BEFORE` bleiben – die Regeln lägen danach in zwei Auslösern mit zwei Zeitpunkten. Ausserdem prüft `AFTER` erst, wenn die Zeile steht: Die Ablehnung wäre eine Rücknahme statt einer Abwehr.
2. *Die Schranke zurück in `reise_anlegen()` holen, hinter das `on conflict`.* Damit wäre genau der Befund von ADR-0045 wieder offen – der direkte `INSERT` übergeht sie.
3. *`reise_anlegen()` vor dem `INSERT` selbst nachsehen und bei bestehender Kennung sofort zurückgeben.* Behebt den Fall für die Anwendung und lässt den direkten Weg weiter `53400` für einen belegten Schlüssel melden. Zwei Stellen mit derselben Frage; die im Auslöser ist die vollständige.
4. *Die Zählung auf Zeilen einschränken, die keine Wiederholung sind.* Missverstandene Ursache: Die Zählung ist richtig – sie zählt vorhandene Zeilen. Falsch war, sie überhaupt zu befragen.

**Begründung:** Eine Schranke gegen Missbrauch soll begrenzen, was entsteht. Ein Schreibvorgang, aus dem keine Zeile hervorgeht, kostet nichts und darf nichts kosten. Die Existenzprüfung stellt genau das fest, und sie stellt es an derselben Stelle fest, an der auch die Regeln stehen – nicht in einer zweiten Schicht mit eigener Reihenfolge.

Der Weg an der Schranke vorbei ist kein Loch: Er setzt eine bestehende Kennung voraus, und genau die lässt `trips_client_ref_eindeutig` keine zweite Zeile werden. Eine tatsächlich neue Kennung kommt an der Existenzprüfung nicht vorbei. Die Abfrage läuft über denselben Index, an dem der Schreibvorgang unmittelbar danach hängt, und ist `SECURITY DEFINER` aus demselben Grund wie die Zählung: Eine Prüfung, die durch die Lesepolicy läuft, wäre nur so lange richtig, wie diese jede eigene Reise zeigt.

**Konsequenzen:** Fünf neue Nachweise in `scripts/db/sicherheit.mjs`, alle gegen das Konto, das die Schranke im Aufbau erreicht: Die Wiederholung liefert dieselbe Reise, sie legt keine zweite an, sie verbraucht kein Guthaben (nach ihr stehen weiterhin 60 Reisen), eine neue Kennung scheitert weiter mit `53400`, und der direkte `INSERT` einer belegten Kennung nennt `23505`. `npm run db:sicherheit` steht bei 140 Nachweisen.

Die Nachweise können jetzt einen SQLSTATE verlangen. Ohne diese Erweiterung wäre der Kern nicht prüfbar: Vor der Behebung wurde der direkte `INSERT` einer belegten Kennung ebenfalls „abgelehnt" – nur mit dem falschen Code. Wo nicht die Ablehnung die Aussage ist, sondern woran sie scheitert, steht am Fall ein `code`.

Die Behebung war noch nicht vollständig: Die Schranke prüfte weiterhin sequenziell, was gleichzeitig geschieht. Siehe ADR-0049.

---

## ADR-0049 – Zählung und Einfügung laufen je Konto der Reihe nach

**Datum:** 18. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** `20260818030000_reise_erzeugung_serialisieren.sql` nimmt in `public.reise_erzeugung_pruefen()` eine Beratungssperre je Konto auf Transaktionsdauer, bevor gelesen wird:

```sql
perform pg_advisory_xact_lock(hashtext('public.trips'), hashtext(new.user_id::text));
```

Der Schlüssel ist zweiteilig: Der erste Teil benennt den Zweck, der zweite das Konto. Beratungssperren teilen sich einen Namensraum über die ganze Datenbank – ohne den ersten Teil könnte eine spätere Sperre zu einem anderen Zweck zufällig dieselbe Zahl treffen. Ein Zusammenstoss zweier Konten im zweiten Teil kostet Wartezeit, nie Richtigkeit.

Die Sperre steht **vor** der Prüfung auf eine bestehende Kennung, nicht dazwischen. Davor gelesen wäre diese Prüfung veraltet, sobald sie gebraucht wird: Zwei gleichzeitige Anfragen mit derselben neuen Kennung sähen beide „noch nicht vorhanden", und die zweite scheiterte nach dem Warten an der Schranke, obwohl die erste ihre Reise inzwischen angelegt hat. Genau dieser Fall – zwei Tabs, ein Klick – muss nach ADR-0048 idempotent bleiben. Die Regel `status = 'draft'` bleibt vor der Sperre: Sie liest nichts.

**Kontext:** ADR-0045 hat die Schranke in den Auslöser verlegt, ADR-0048 hat ihr beigebracht, Neuanlagen von Wiederholungen zu unterscheiden. Beide Male blieb dieselbe Annahme unausgesprochen: dass ein Konto seine Reisen der Reihe nach anlegt.

Die Prüfung ist ein Lesen mit anschliessendem Schreiben – `count(*)`, dann die Einfügung. Zwischen beidem liegt ein Fenster, und in PostgreSQL sieht eine Transaktion die noch nicht festgeschriebene Zeile einer anderen nicht. Bei 59 vorhandenen Reisen sahen darum mehrere gleichzeitige Anfragen alle den Stand 59, alle kamen durch. Gemessen mit sechs gleichzeitigen Sitzungen: **65 Reisen statt höchstens 60**, auf beiden Schreibwegen. Über PostgREST sind gleichzeitige Anfragen der Normalfall; genau der öffentliche Weg, gegen den ADR-0045 absichert, war damit weiter offen – nur nicht mehr sequenziell, sondern parallel.

**Alternativen:**

1. *`select … for update` auf einer Zeile je Konto, etwa in `public.profiles`.* Bindet die Erzeugung einer Reise an eine fremde Tabelle: Wer sein Profil ändert, blockiert dann das Anlegen einer Reise. Ausserdem hat nicht jedes Konto ein Profil – `trips.user_id` verweist auf `auth.users`.
2. *`SERIALIZABLE`.* Die Isolationsstufe bestimmt der Client, nicht die Tabelle. Ein Auslöser kann sie nicht verlangen, und `40001` müsste die Anwendung überall behandeln.
3. *Ein Zähler je Konto und Stunde in einer eigenen Tabelle.* Serialisiert über die Zeilensperre, aber um den Preis einer weiteren Tabelle, einer weiteren Policy und eines zweiten Ortes, an dem die Wahrheit über den Bestand steht.
4. *Die Schranke als Bedingung formulieren.* Ein `CHECK` kann nicht über andere Zeilen zählen, und ein `unique` auf eine laufende Nummer je Stunde hiesse, diese Nummer zu pflegen – wieder ein zweiter Ort.

**Begründung:** Eine Beratungssperre braucht kein Schemaobjekt, sperrt keine Nutzdaten und wird mit dem Ende der Transaktion von selbst frei – auch bei einem Abbruch. Eine vergessene Freigabe ist damit ausgeschlossen. `_xact_` ist innerhalb derselben Transaktion wiederholt nehmbar: Eine Anweisung, die 61 Zeilen einfügt, ruft den Auslöser 61-mal und blockiert sich dabei nicht selbst.

Der Preis ist ein Wartepunkt je Konto. Er trifft nur das Anlegen von Reisen und nur dasselbe Konto; bei 60 erlaubten Neuanlagen je Stunde ist Gedrängel dort kein Dauerzustand. `authenticated` trägt ausserdem `statement_timeout = 8s`: Eine wartende Anfrage kann nicht unbegrenzt hängen, sie endet spätestens mit `57014`.

**Konsequenzen:** Ein neues Skript `npm run db:parallelitaet` mit fünf Nachweisen. Es musste ein eigenes sein: `db:sicherheit` läuft vollständig in einer Transaktion, die am Ende zurückrollt – richtig für Policies und Bedingungen, und vollständig blind für Wettläufe, weil zwei Anweisungen derselben Transaktion einander immer sehen.

Der Nachweis öffnet mehrere echte Verbindungen gleichzeitig, verabredet einen Treffpunkt auf der Uhr des Servers und hält jede Transaktion nach dem Schreiben offen. Das Offenhalten ist kein Kunstgriff: `reise_anlegen()` schreibt nach der Reise bis zu 1416 weitere Zeilen, das Fenster ist real. Geprüft werden parallele neue Kennungen bei 59 auf beiden Schreibwegen, parallele Wiederholungen einer bestehenden Kennung, paralleles Doppelabsenden derselben neuen Kennung und parallele neue Kennungen bei erreichtem Limit.

Dass die Parameter des Nachweises ausreichen, ist selbst nachgewiesen: Mit der Fassung ohne Sperre scheitert das Skript mit Exit-Code 1 und meldet 65 Reisen. Ein Nachweis, der auch ohne die Behebung grün wäre, wäre keiner.

Anders als die übrigen `db:`-Skripte schreibt dieses echte Zeilen und rollt sie nicht zurück – gleichzeitige Sitzungen müssen die Saat sehen, und eine gemeinsame Transaktion gibt es dafür nicht. Es räumt vor und nach jedem Lauf auf; das Löschen des Testkontos nimmt über `on delete cascade` alles mit.

**Bekannte Grenze:** Eine Transaktion, die Reisen für **mehrere** Konten anlegt, nimmt mehrere Sperren und kann mit einer zweiten solchen Transaktion in umgekehrter Reihenfolge verklemmen. PostgreSQL erkennt das und bricht eine der beiden mit `40P01` ab. Auf den vorhandenen Wegen kann der Fall nicht eintreten: RLS verlangt `user_id = auth.uid()`, eine Anfrage schreibt also für genau ein Konto. Erreichbar wäre er nur über die Service Role, die Jetnity für Reisen nicht benutzt.

---

## ADR-0050 – Ein Vorschlag lebt im Browser, bis ein Mensch ihn freigibt

**Datum:** 18. August 2026
**Status:** umgesetzt, Modellweg abgeschaltet

**Entscheidung:** Ein modellgenerierter Reisevorschlag wird **nicht** gespeichert. `vorschlagErzeugen()` gibt ihn zurück, `Reiseidee.tsx` hält ihn im Zustand einer React-Komponente, `VorschlagVorschau.tsx` zeigt ihn. Erst „Übernehmen" ruft `vorschlagUebernehmen()` (Konto) oder `gastreiseAblegen()` (Gast) und damit die bestehende Persistenz aus Phase 1.5.

Es entsteht keine Tabelle für Entwürfe, kein Feld `trips.quelle`, kein Status `vorgeschlagen`, kein Zwischenspeicher in `localStorage`.

Weil der Vorschlag durch den Browser läuft, prüft `vorschlagUebernehmen()` ihn vollständig neu – mit demselben `modellvorschlagSchema`, das die Modellantwort geprüft hat, erweitert um `clientRef` und die Fassung.

**Kontext:** Die Anforderung lautet: Ohne ausdrückliche Freigabe wird keine modellgenerierte Reise übernommen. Ein Vorschlag braucht dafür einen Ort für die Dauer zwischen Erzeugung und Entscheidung – Sekunden bis Minuten, gelegentlich eine Stunde bei einem offenen Tab.

Die naheliegende Antwort wäre ein Serverzustand: eine Zeile mit `status = 'vorgeschlagen'`, die bei Freigabe befördert wird. Sie hat drei Folgen, die alle gegen sie sprechen.

**Alternativen:**

1. *Eine Tabelle `trip_drafts`.* Eine fünfte Reisetabelle mit eigener Policy, eigenem Eigentum, eigener Aufbewahrungsfrist – und ohne Eigentümer für Gäste, die serverseitig keine Identität haben (ADR-0042). Ein Gast könnte seinen Entwurf nur über eine `anon`-schreibbare Tabelle ablegen; genau das vermeidet die Architektur seit Phase 1.4b.
2. *Ein Status `vorgeschlagen` auf `public.trips`.* Billiger als eine Tabelle und teurer in jeder Abfrage danach: `/reisen` müsste ihn ausschliessen, `reise_erzeugung_pruefen()` ihn kennen, die Missbrauchsschranke ihn zählen oder nicht zählen. Ein nicht freigegebener Vorschlag wäre eine Reise, die nur deshalb keine ist, weil überall ein Filter steht. Ausserdem gilt heute: Eine neue Reise ist ein Entwurf und nichts anderes (`reise_erzeugung_pruefen`), und diese Zusage wäre aufzuweichen.
3. *Der Vorschlag im `localStorage`, auch für Konten.* Bringt für Konten nichts, was der Komponentenzustand nicht schon leistet, und schafft eine zweite Stelle, an der ein Reisegraph liegen kann – mit eigener Fassung, eigener Migration und eigener Verwechslungsgefahr mit der Gastreise.
4. *Den Vorschlag sofort speichern und bei Ablehnung löschen.* Widerspricht der Anforderung wörtlich. Nebenbei wäre jeder abgebrochene Vorgang eine Reise, die niemand wollte, und jede Ablehnung ein Löschvorgang, der scheitern kann.

**Begründung:** Der Zustand „ein Mensch schaut sich etwas an" ist ein Zustand der Oberfläche und kein Zustand des Systems. Ihn in die Datenbank zu schreiben heisst, eine Frage zu beantworten, die niemand gestellt hat – und dafür fünf Stellen zu ändern, die heute richtig sind.

Der Preis ist ehrlich und klein: Ein Reload verliert den Vorschlag. Das ist vertretbar, weil die Vorschau der eine Zwischenschritt ist, den der Nutzer gerade vor sich hat, und weil ein verlorener Vorschlag genau einen neuen Aufruf kostet – nicht eine verlorene Reise. Der Fall, der wirklich weh täte, ist ein anderer: ein Vorschlag, der mit einem Speicherfehler verschwindet. Genau der ist behandelt, und zwar in der Oberfläche: Ein Fehlschlag beim Übernehmen lässt die Vorschau stehen.

**Konsequenzen:** Die Persistenz für Modellreisen ist die bestehende, Zeile für Zeile: `public.reise_anlegen()` für Konten, `gastreiseAblegen()` für Gäste, `unique (user_id, client_ref)` für die Idempotenz. `clientRef` entsteht mit dem Vorschlag und bleibt an ihm hängen; **Doppelklick und Retry** ergeben deshalb eine Reise und nicht zwei. Ein Reload **während einer nicht übernommenen Vorschau** verwirft den Vorschlag bewusst – er lebt nur im Komponentenzustand und ist von dieser Idempotenz nicht gedeckt. Ein Reload **nach** der Übernahme trifft die bereits gespeicherte Reise und erzeugt keine zweite.

Zwanzig Tests in `lib/reisevorschlag/uebernahme.test.ts` prüfen genau die Naht: Vorschau ohne Persistenz, Übernahme mit Persistenz, zweimal derselbe `clientRef`, Persistenzfehler nach erfolgreichem Vorschlag, und ein im Browser manipulierter Vorschlag, der abgelehnt wird.

**Bekannte Grenze:** Ein Vorschlag überlebt kein Reload und keinen Gerätewechsel. Wer ihn behalten will, muss ihn übernehmen. Sollte sich das als Verlust erweisen, ist der nächste Schritt nicht eine Entwurfstabelle, sondern der Vorschlag im `sessionStorage` – ein Ort, der mit dem Tab endet, zu dem er gehört.

---

## ADR-0051 – Responses API mit `strict: true`; Vorgabe `gpt-5.6-luna` / `low`

**Datum:** 18. August 2026
**Status:** Responses API und `strict: true` gelten weiter. Die alleinige Vorgabe `gpt-5.6-luna` ist durch ADR-0056 ersetzt.

**Entscheidung:** Jetnity ruft die **Responses API** auf (`POST /v1/responses`) und verlangt strukturierte Ausgabe über `text.format` mit `type: 'json_schema'` und `strict: true`. Die erste gemessene Vorgabe war `gpt-5.6-luna` mit `reasoning.effort: 'low'` (drei Fixtures, 19. August). Seit ADR-0056 routet Jetnity Terra und Sol deterministisch; Luna plant keine komplette Reise automatisch. `JETNITY_MODELL_NAME` und `JETNITY_MODELL_AUFWAND` können die Wahl weiter festnageln, aber nur innerhalb von drei Modellen mit bekanntem Preis und drei Aufwandstufen.

`high`, `xhigh` und `max` sind **nicht** zugelassen.

Kein SDK. Ein `fetch` in `lib/modell/aufruf.ts`.

**Kontext:** Die Aufgabe ist eng: aus einem Satz einen Reisegraphen mit Etappen, Tagen und Planpunkten. Die Ausgabe muss einem festen Schema entsprechen, sonst ist sie wertlos – ein Vorschlag, der zu 90 % passt, ist keine Reise.

Die Modellwahl ist seit dem 19. August 2026 gemessen, nicht nur begründet. Siehe Nachtrag unten.

**Alternativen:**

1. *Chat Completions mit `response_format: json_object`.* Der ältere Weg. `json_object` sagt „gültiges JSON" und nichts über die Felder; das Schema wäre eine Bitte im Prompt, und Jetnity müsste jede Abweichung selbst abfangen. Die offizielle Dokumentation nennt Structured Outputs über die Responses API als den vorgesehenen Weg.
2. *`gpt-5.6-terra` als Vorgabe.* Die erste, unbelegte Wahl vom 18. August. In der Messung vom 19. August gleich zuverlässig, aber teurer: Die kürzeste Terra-Idee allein kostete USD 0.0050, die drei Luna-Ideen zusammen USD 0.0054. Terra bleibt als Fallback über `JETNITY_MODELL_NAME` wählbar.
3. *`gpt-5.6-sol` als Vorgabe.* Teurer als Terra. Regel 17 verbietet, das teuerste Modell zu nehmen, weil es das teuerste ist. Die Messung hat keinen Mangel gezeigt, den Sol beheben müsste.
4. *`reasoning.effort: 'medium'` oder höher.* `max_output_tokens` begrenzt die Ausgabe **einschliesslich** der Denk-Tokens. Ein Aufruf, der sein Budget im Denken verbraucht, endet als `incomplete` – bezahlt, ohne Vorschlag. Bei `low` lag die höchste Ausgabe bei 2104 Tokens von 6000.
5. *Das Paket `openai`.* Phase 1.1b hat es entfernt. Es wieder aufzunehmen, um einen Endpunkt zu erreichen, wäre eine Abhängigkeit für dreissig Zeilen – mit eigener Zeitsteuerung, eigenen Wiederholungen und eigener Fehlerdarstellung, an genau der Stelle, an der Jetnity beides selbst bestimmen muss: Ein Aufruf ohne harte Obergrenze für Dauer und Ausgabe ist ein Aufruf ohne Kostenkontrolle.

**Begründung:** `strict: true` verschiebt die Zusage über die Form der Antwort auf die Plattform. Das ersetzt keine eigene Prüfung (ADR-0053), aber es macht den häufigsten Fehlerfall – ein Feld fehlt, ein Enum-Wert ist erfunden – zu einem, der nicht mehr eintritt.

Luna ist die Vorgabe, weil sie auf denselben drei Fixtures schema- und abbildungstreu war und klar weniger kostete. Die Wahl bleibt eine Variable: `JETNITY_MODELL_NAME` und `JETNITY_MODELL_AUFWAND` können sie ändern. Was nicht über die Umgebung änderbar ist, sind die Grenzen – ein Modell ohne bekannten Preis schaltet den Weg ab, weil ohne Preis kein Kostendeckel existiert.

Nur drei Modelle sind zugelassen, weil `PREISE` drei kennt. Ein Tippfehler in `JETNITY_MODELL_NAME` schaltet ab, statt ungezählt Geld auszugeben.

**Konsequenzen:** `lib/modell/anfrage.ts` baut den Anfragekörper ohne Serverumgebung und ist damit im Test und im Probe-Skript dasselbe Stück Code wie in Produktion. `lib/modell/antwort.ts` liest jeden Ausgang der API – `completed`, `incomplete`, `refusal`, jeder HTTP-Status, fehlende `usage` – und übersetzt ihn in eine von neun Ergebnisklassen; 19 Tests decken die Formen ab, die eine echte API liefert.

Die Preise stehen in `lib/modell/preise.ts` in Mikrodollar je Million Tokens, also in der Einheit der Preisliste. Ein Eintrag ist eine Umschrift und keine Umrechnung, die jemand nachprüfen muss.

**Nachtrag, 19. August 2026:** Sechs echte Läufe mit `npm run modell:probe` gegen Ideen 1 (vollständig), 2 (mehrere Ziele) und 7 (unbestimmt), `reasoning.effort: low`. Alle sechs Klasse `erfolg`, Schema gültig, Abbildung auf `public.reise_anlegen()` geprüft. 6000 Ausgabetokens reichten.

| Modell | Idee | Laufzeit | Kosten |
| --- | --- | ---: | ---: |
| `gpt-5.6-terra` | 7 | 7 123 ms | USD 0.0050 |
| `gpt-5.6-luna` | 1 | 10 874 ms | USD 0.0019 |
| `gpt-5.6-luna` | 2 | 16 717 ms | USD 0.0026 |
| `gpt-5.6-luna` | 7 | 7 030 ms | USD 0.0009 |

Terra-Ideen 1 und 2 endeten ebenfalls mit `erfolg` und geprüfter Abbildung (Idee 2: 3 Etappen, 14 Tage, 51 Punkte); ihre Kostenzeilen sind im lokalen Scrollback nicht mehr vollständig. Die drei vollständigen Luna-Läufe zusammen USD 0.0054. Vorgabe deshalb `gpt-5.6-luna` / `low`. Vollständige Tokenzahlen in [docs/MODELL.md](docs/MODELL.md) Abschnitt 8.

---

## ADR-0052 – Die Kostenschranke steht in der Datenbank, mit einem eigenen Topf für Gäste

**Datum:** 18. August 2026
**Status:** umgesetzt auf dem Development-Branch

**Entscheidung:** `20260818040000_modellnutzung.sql` legt `public.model_usage` an und zwei `SECURITY DEFINER`-Funktionen:

- `public.modell_kontingent_beanspruchen(_funktion, _modell, _gastkennung)` prüft **vor** dem Aufruf alle Grenzen und legt bei Erfolg eine Zeile mit `ergebnis = 'reserviert'` und dem Preis des schlechtesten Falls an. Sie gibt deren Kennung zurück. Erschöpftes Kontingent: `53400` mit einer Meldung für Reisende.
- `public.modell_nutzung_abschliessen(_id, _ergebnis, …)` ersetzt Schätzung durch echten Betrag.

Beide beginnen mit `perform pg_advisory_xact_lock(hashtext('public.model_usage'), 0)` – **eine** globale Sperre, nicht eine je Kennung.

Fünf Grenzen, alle im SQL, keine über eine Umgebungsvariable erhöhbar:

| Grenze | Wert |
| --- | --- |
| je Kennung und Stunde | 4 |
| je Kennung und Tag | 8 |
| alle Gäste und Tag | 24 |
| insgesamt und Tag | 38 |
| Kosten insgesamt und Tag | 3 000 000 µ$ = $3.00 |

Die Kennung eines Gastes ist ein Cookie `jetnity_gast`: 32 Hexzeichen, `httpOnly`, `sameSite: lax`, 30 Tage, nicht signiert. In der Tabelle steht nur sein SHA-256. Für ein angemeldetes Konto gewinnt `auth.uid()`; eine mitgeschickte Gastkennung wird dann verworfen.

**Kontext:** Regel 17 verlangt eine serverseitige, race-condition-sichere Kostenkontrolle. Vercel startet beliebig viele Instanzen – ein Zähler in einem Serverprozess kennt nur seine eigene, und zehn gleichzeitige Anfragen an zehn Instanzen sähen zehnmal „noch Platz".

Dazu die Anforderung, dass Gäste Jetnity weiter benutzen können, ohne Gastkonto und ohne neue kostenpflichtige Rate-Limit-Plattform. Ein Gast hat nach ADR-0042 bewusst keine serverseitige Identität. Eine Schranke „je Kennung" braucht trotzdem eine, sonst gibt es für alle Gäste nur eine gemeinsame Zahl, die ein einzelner aufbrauchen kann.

**Alternativen:**

1. *Upstash, Vercel KV oder ein anderer Rate-Limit-Dienst.* Neue laufende Kosten und ein neuer Anbieter – nach Regel 18 und Regel 5 nicht ohne Freigabe, und nach Regel 19 nicht, solange die vorhandene Infrastruktur es kann. Supabase kann es.
2. *Ein Zähler im Speicher der Serverinstanz.* Kennt nur seine Instanz und verliert alles bei jedem Kaltstart. Als Kostenschranke wertlos.
3. *Nachträglich zählen statt vorher buchen.* Wer nachher zählt, hat bezahlt. Zwischen Start und Ergebnis eines Aufrufs liegen Sekunden; ein Deckel, der abgeschlossene Aufrufe summiert, sieht in dieser Zeit einen Stand, der nicht stimmt.
4. *Eine Sperre je Kennung statt einer globalen.* Genügt für die beiden Grenzen je Kennung und **nicht** für die drei globalen: Zwei verschiedene Kennungen nehmen verschiedene Sperren, sehen denselben Gesamtstand und kommen beide durch. Die globalen Grenzen sind gerade die, die gegen rotierende Gastkennungen wirken.
5. *IP-Adressen zählen.* Wirksam und datenschutzrechtlich eine eigene Entscheidung: Eine IP-Adresse ist ein personenbezogenes Datum, und sie zu speichern verlangt Zweck, Frist und Dokumentation. Der gemeinsame Gasttopf löst dasselbe Problem ohne diese Daten.
6. *Anmeldung verlangen.* Wäre eine stille Produktänderung gegen ADR-0042 und Regel 10.
7. *Den Gastcookie signieren.* Er gewährt nichts, er begrenzt. Ihn zu fälschen bringt nicht mehr als ihn zu löschen, und beides fängt der Gasttopf auf. Eine Signatur bräuchte ein Geheimnis, dessen Verlust den Weg für alle Gäste schliesst.

**Begründung:** Die einzige Stelle, die alle Aufrufe sieht, ist die Datenbank. Sie hat mit `pg_advisory_xact_lock` das Mittel, Prüfung und Einfügung der Reihe nach laufen zu lassen – dieselbe Bauweise, die ADR-0049 für die Missbrauchsschranke gewählt hat. Eine globale Sperre ist hier richtig und nicht zu teuer: Sie wird 38-mal am Tag genommen.

Die Reservierung macht die Aussage über die Tageskosten belastbar, weil sie **vor** dem Aufruf wirkt. Die Summe ist damit zu jedem Zeitpunkt eine Obergrenze. Ein Aufruf, der nie abgeschlossen wird – abgebrochene Verbindung, beendete Instanz, geschlossener Tab –, behält seine Reservierung; das kostet Kontingent, nicht Geld, und ist die sichere Richtung.

`gesamtTag = 38` hält den Kostendeckel allein ein: 38 × 77 200 µ$ = 2 933 600 µ$ < 3 000 000 µ$. Der Deckel ist deshalb nicht die erste Schranke, sondern die zweite – er greift, wenn ein Aufruf mehr kostet als geschätzt, etwa nach einem Wechsel auf ein teureres Modell, bei dem niemand `gesamtTag` nachgezogen hat.

Der Gasttopf (24) ist kleiner als das Gesamte (38). Rotierende Gastkennungen können damit das Kontingent angemeldeter Konten nicht aufbrauchen – nachgewiesen als eigener Fall: bei vollem Gasttopf kommt ein Konto weiterhin durch.

Die Kennung eines Kontos kommt vom vertrauenswürdigen Server als `_konto`, nicht aus einem JWT und nicht vom Browser. Wer seine eigene Kontokennung mitschicken dürfte, dürfte auch eine fremde mitschicken – deshalb sind die Funktionen nur für `service_role` ausführbar.

**Konsequenzen:** Die Grenzen stehen zweimal – in `MODELL_GRENZEN` und im SQL. Zwei Orte sind einer zu viel, aber die Durchsetzung liegt in der Datenbank, und eine Grenze, die im Code höher steht, ist keine. `lib/modell/grenzen-datenbank.test.ts` vergleicht beide Seiten bei jedem `npm test`, ohne Datenbank, allein aus dem Migrations-SQL: ein Auseinanderlaufen ist ein roter Test.

`anon` und `authenticated` haben auf beiden Funktionen **kein** `EXECUTE`. Das stellt die Regel wieder her, dass für `anon` keine `SECURITY DEFINER`-Funktion ausführbar ist. Auf der Tabelle selbst hat `anon` weiterhin kein Recht.

Neues Skript `npm run db:kontingent` mit **16 Nachweisen** gegen die echte Datenbank: jede Grenze am letzten erlaubten und am ersten abgelehnten Aufruf, der Kostendeckel an derselben Kante, der Abschluss in vier Varianten (echte Kosten, fehlende Tokens, zweiter Abschluss ohne Wirkung, fremde Kennung ohne Wirkung), die Identitätsfrage und die Parallelität. Es schreibt echte Zeilen und räumt auf – wie `db:parallelitaet` und aus demselben Grund.

**Bekannte Grenze:** Für `model_usage` gibt es keine automatische Löschung. Die Tabelle wächst um höchstens 38 Zeilen am Tag und enthält keine Reiseinhalte; eine Aufbewahrungsfrist gehört zu der Entscheidung, die Funktion einzuschalten, und steht als offener Punkt in [ROADMAP.md](ROADMAP.md).

**Nachtrag, 19. August 2026:** Der erste Stand gab `EXECUTE` an `anon` und `authenticated`, damit ein Gast ohne Sitzung die Schranke trotzdem erreichen konnte. Damit war dieselbe Funktion über PostgREST mit dem öffentlichen Key erreichbar: Ein externer Client konnte Reservierungen erzeugen und den Gasttopf leeren, ohne einen Modellaufruf. `20260819010000_modell_kontingent_nur_server.sql` zieht das Recht zurück und gibt es nur `service_role`. Die Server Action bestimmt die Identität mit `auth.getUser()` und ruft die Funktionen über einen cookie-losen Dienstclient auf – der einzige Service-Role-Pfad in der Anwendung, nicht exportiert, nur diese zwei RPCs (AGENTS.md Regel 14). Gäste ohne Konto bleiben möglich, weil der Server die Gastkennung setzt. Ein direkter anonymer PostgREST-Aufruf endet mit 4xx und erzeugt keine Zeile; nachgewiesen in `npm run db:sicherheit`. Die Parallelitäts-, Race- und Kosteninvarianten sind unverändert.

---

## ADR-0053 – Modelloutput ist untrusted input, und ein Vorschlag trägt seine Fassung

**Datum:** 18. August 2026
**Status:** umgesetzt

**Entscheidung:** Dieselbe Modellantwort wird zweimal geprüft: von der Plattform gegen `VORSCHLAG_JSON_SCHEMA` (`strict: true`), danach von Jetnity gegen `modellvorschlagSchema` (Zod) mit denselben fachlichen Grenzen wie das Reiseschema plus Stimmigkeitsprüfung.

Jeder Vorschlag trägt `fassung: VORSCHLAG_FASSUNG`. Beim Übernehmen wird sie geprüft; eine andere Fassung wird abgelehnt.

Der Vorschlag enthält kein `id`, kein `user_id`, kein `status`, kein `provider`, kein `booking_url` und kein `price` – nicht als verbotenen Wert, sondern gar nicht: `additionalProperties: false` auf jedem Objekt macht sie unaussprechbar.

Systemregeln gehen als Nachricht mit der Rolle `system`, der Freitext als eigene mit `user`.

**Kontext:** Regel 15 behandelt Eingaben von aussen als unsicher. Eine Modellantwort ist eine Eingabe von aussen, auch wenn sie von einem Anbieter kommt, dem man vertraut – und `strict: true` ist eine Zusage dieses Anbieters, keine Eigenschaft von Jetnity.

Dazu ein konkreter Ablauf: Der Vorschlag geht in den Browser, wird dort angesehen und kommt beim Übernehmen zurück. In der Zwischenzeit ist er veränderbar, und zwar von jedem, der die Entwicklerwerkzeuge öffnet.

**Alternativen:**

1. *Nur `strict: true`, keine eigene Prüfung.* Ein Titel mit 400 Zeichen, ein Tag mit der Nummer 99 in einer Reise mit sieben Tagen, eine Etappe von Tag 3 bis Tag 1 – alles formgerecht und trotzdem keine Reise. Formgerechtes Unsinniges würde bis `public.reise_anlegen()` durchlaufen und dort scheitern: mitten in der Übernahme, nachdem der Nutzer freigegeben hat.
2. *Nur Zod, ohne JSON-Schema an die API.* Verzichtet auf die Zusage über die Form und erzeugt mehr abgelehnte – also bezahlte – Antworten.
3. *Verbotene Felder herausfiltern statt sie nicht zu definieren.* Ein Filter ist eine Liste, und eine Liste wird unvollständig, sobald das Reiseschema ein Feld gewinnt. `additionalProperties: false` ist keine Liste.
4. *Beim Übernehmen nur `clientRef` prüfen und den Vorschlag als geprüft ansehen.* Er war geprüft, bevor er den Server verliess. Danach war er in einem Browser.
5. *Keine Fassung.* Ein Tab liegt eine Stunde offen, ein Deployment ändert das Format – der Vorschlag würde dann halb verstanden statt abgelehnt.

**Begründung:** Die beiden Schemata beantworten verschiedene Fragen. Das JSON-Schema beantwortet „hat die Antwort die richtige Form?", Zod beantwortet „beschreibt sie eine Reise, die Jetnity anlegen kann?". Die zweite Frage ist die, an der eine Übernahme scheitern würde, und sie zu stellen kostet keinen Aufruf.

Der Umfang beider Seiten wird gegeneinander geprüft (`schema.test.ts`), damit ein neues Feld nicht auf einer Seite fehlen kann. Ohne diesen Vergleich wäre die Doppelung genau die Fehlerquelle, die man ihr vorwirft.

Zur Injection: Der letzte Absatz der Systemregeln sagt ausdrücklich, dass der Nutzertext eine Reisebeschreibung ist und keine Anweisung. Das ist eine Bitte, und die Regeln stützen keine Sicherheitszusage. Die Schranke ist, dass ein Vorschlag nach dem Schema nichts enthalten **kann**, was über eine Reise hinausgeht. Ein vollständig übernommenes Modell kann höchstens eine unsinnige Reise vorschlagen – die ein Mensch verwirft, weil sie in der Vorschau steht.

**Konsequenzen:** 60 Tests in `lib/reisevorschlag/schema.test.ts`, darunter die drei Injection-Eingaben aus `fixtures/reiseideen.ts` (Regeln ignorieren, Systemregeln ausgeben, HTML und SQL), formgerechte aber unstimmige Vorschläge, Grenzwerte aus [docs/REISEN.md](docs/REISEN.md) und der Umfangsvergleich der beiden Schemata.

Die Stimmigkeitsprüfung deckt ab, was eine Form nicht ausdrückt: Tage von 1 an ohne Lücke, Etappen lückenlos und ohne Überlappung, `bisTag ≥ vonTag`, Etappen innerhalb der Tagesanzahl.

**Bekannte Grenze:** Die Prüfung stellt fest, ob ein Vorschlag eine zulässige Reise ist – nicht, ob er eine gute ist. Eine Reise, die an sieben Tagen fünfmal den Ort wechselt, ist zulässig. Dagegen stehen die Systemregeln und der Mensch in der Vorschau.

---

## ADR-0054 – Kein Preis, kein Anbieter, keine Verfügbarkeit aus dem Modell

**Datum:** 18. August 2026
**Status:** umgesetzt

**Entscheidung:** Ein Reisevorschlag kann keine Preise, Anbieter, Buchungslinks oder Verfügbarkeiten enthalten. Drei Schranken hintereinander:

1. **Strukturell:** Das Vorschlagsschema hat kein Preis-, Anbieter- oder Buchungsfeld, und `additionalProperties: false` macht eines unaussprechbar.
2. **Im Freitext:** `lib/reisevorschlag/normalisierung.ts` entfernt Beträge mit Währung aus Titeln, Notizen und Annahmen – „Flug ab CHF 412" wird „Flug".
3. **Im Prompt:** Die Systemregeln verbieten Preise, Verfügbarkeiten, Buchbarkeit, Anbieter und Links ausdrücklich.

Nach der Abbildung bleiben `trip_items.price_amount`, `price_currency`, `provider`, `external_ref` und `booking_url` `null`. Ein genanntes Budget landet in `trips.budget_amount` – als Ziel, wie im Formular unter `/planen`.

**Ausnahme mit Absicht:** Im Feld `trips.travel_wish` bleiben Preisangaben stehen, weil dort der Satz des **Nutzers** steht.

**Kontext:** Phase 3 – echte Flug-, Hotel- und Aktivitätspreise – existierte zum Entscheidungszeitpunkt nicht. Bis dahin hat Jetnity keine belastbare Herkunft für einen Preis. „Flug ab CHF 412" ist dann keine Auskunft, sondern eine Behauptung mit dem Aussehen einer Auskunft, und wer sie liest, rechnet damit.

`trip_items.price_amount` existiert seit Phase 1.5 und bedeutet dort: ein Preis mit belegbarer Herkunft. Diese Bedeutung darf nicht dadurch verwässert werden, dass sie ab jetzt auch „Schätzung eines Sprachmodells" heissen kann.

**Alternativen:**

1. *Modellschätzungen in `price_amount` schreiben.* Ändert die Bedeutung eines bestehenden Feldes stillschweigend. Ab Phase 3 stünden zwei verschiedene Dinge in derselben Spalte, und keine Abfrage könnte sie unterscheiden.
2. *Ein zweites Feld `price_estimate`.* Eine Migration, eine Spalte in vier Tabellenschichten und eine Anzeige für einen Wert, dessen Nutzen unbewiesen ist. Regel 23: Erst der Kern, dann die Verfeinerung. Falls Schätzungen später gewollt sind, ist das eine eigene Entscheidung mit eigener Herkunftsangabe.
3. *Nur die Systemregeln, keine Normalisierung.* Eine Regel im Prompt ist eine Bitte. Ein Modell, das sich nicht daran hält, hat dann einen Preis in einem Titel, der gespeichert wird.
4. *Nur die Normalisierung, keine Regeln.* Erzeugt Titel wie „Flug nach Bangkok, ab" – der Betrag weg, der Satz kaputt. Die Regeln sorgen dafür, dass der Fall selten eintritt; die Normalisierung dafür, dass er nichts anrichtet.
5. *Preisangaben auch im Reisewunsch entfernen.* „Maximal CHF 3'000" ist im Satz eines Nutzers keine Behauptung über einen Marktpreis, sondern seine Angabe über sein Budget. Sie zu entfernen wäre kein Schutz, sondern der Verlust des Wunsches, um den es geht – dasselbe Feld nimmt über das Formular jeden Satz an, den ein Mensch dort schreibt.

**Begründung:** Die strukturelle Schranke ist die stärkste, weil sie nichts prüft: Ein Feld, das es nicht gibt, muss nicht gefiltert werden. Die Normalisierung schliesst den einen verbleibenden Weg – den Freitext –, und die Regeln machen den Fall selten. Diese Reihenfolge ist wichtig, weil sie bestimmt, was passiert, wenn der Prompt ignoriert wird. Und ein Prompt wird irgendwann ignoriert.

**Konsequenzen:** 31 Tests in `normalisierung.test.ts` für Beträge in europäischen Schreibweisen, als Code, Symbol und Wort, einschliesslich „45.– Fr." – und für das, was bewusst stehen bleibt: Jahreszahlen, Uhrzeiten, Hausnummern, Höhenangaben. 32 Tests in `abbildung.test.ts` belegen, dass alle Provider- und Preisfelder nach der Abbildung `null` sind.

**Bekannte Grenze:** Die Normalisierung erkennt Beträge, keine Sätze. „Dieses Hotel ist noch frei" ist eine Verfügbarkeitsbehauptung ohne Muster und bleibt stehen. Dagegen stehen die Systemregeln und die Vorschau, die den Entwurf ausdrücklich als Vorschlag zeigt und nicht als Angebot. Eine Erkennung von Behauptungen im Satzbau wäre eine zweite Modellaufgabe mit eigenen Kosten und eigener Fehlerquote – für Phase 2.1 nicht angemessen.

---

## ADR-0055 – Annahmen werden gezeigt, nicht gespeichert

**Datum:** 18. August 2026
**Status:** umgesetzt

**Entscheidung:** Ein Vorschlag trägt bis zu vier `annahmen` – kurze Sätze zu allem, was das Modell entschieden hat, ohne es im Text zu lesen. Sie stehen in der Vorschau. Bei der Übernahme werden sie **nicht** gespeichert: weder in `trips.travel_wish`, noch in `trips.metadata`, noch als Planpunkt oder Notiz.

Gespeichert wird stattdessen der Reisewunsch – der Text des Nutzers, geprüft, auf `GRENZEN.reisewunsch` gekürzt.

**Kontext:** Die Anforderung lautet: Fehlende Informationen nicht erfinden, und wo Annahmen nötig sind, müssen sie als Annahmen erkennbar sein. „Wir wollen mal irgendwo weg, kurz und warm" ergibt keinen Reisegraphen, ohne ein Ziel zu wählen; diese Wahl darf nicht wie eine Erkenntnis aus dem Text aussehen.

Die Frage ist, wie lange eine Annahme erkennbar bleiben muss.

**Alternativen:**

1. *Annahmen in `trips.metadata` ablegen.* Das Feld existiert und hält die Nutzlast von `reise_anlegen()`. Es ist aber nach [docs/DATENBANK.md](docs/DATENBANK.md) ausdrücklich nicht der Ort für Reiseinhalte, es ist auf 8192 Zeichen begrenzt, und ein Inhalt dort wird von keiner Ansicht gezeigt – eine Annahme, die niemand liest, ist keine Kennzeichnung, sondern eine Ablage.
2. *Annahmen an den Reisewunsch anhängen.* Vermischt zwei Dinge in einem Feld: was der Nutzer wollte und was ein Modell daraus geschlossen hat. Beim nächsten Bearbeiten wäre nicht mehr unterscheidbar, welcher Satz von wem ist.
3. *Eine eigene Spalte oder Tabelle für Annahmen.* Eine Migration für einen Text, der nach der Freigabe seinen Zweck erfüllt hat. Regel 23.
4. *Annahmen als Planpunkte oder Notiz am ersten Tag.* Macht aus einem Hinweis über die Planung einen Teil der Reise. Wer den Tag später bearbeitet, hätte eine Notiz darin, die nicht zur Reise gehört.

**Begründung:** Eine Annahme ist eine Aussage über den **Vorschlag**, nicht über die Reise. Sie hat genau einen Adressaten und genau einen Zeitpunkt: den Menschen, der entscheidet, ob er den Vorschlag übernimmt. Danach hat er entschieden – er hat die Annahme gesehen und trotzdem zugestimmt, oder er hat den Text geändert und neu erzeugt. Die Reise, die daraus entsteht, ist seine.

Der Reisewunsch dagegen ist der Satz des Nutzers und gehört ihm. Er wird gespeichert, damit später nachvollziehbar ist, wovon die Reise ausging – und damit Phase 2.2 daran anknüpfen kann.

**Konsequenzen:** `vorschlagAlsNutzlast()` und `vorschlagAlsReise()` bilden `annahmen` auf nichts ab; ein Test hält das fest, damit es nicht versehentlich zu einer Zuweisung wird. Die Vorschau zeigt sie in einem eigenen Block, sichtbar als Annahmen und nicht als Reisedaten.

**Bekannte Grenze:** Nach der Übernahme lässt sich nicht mehr feststellen, welche Teile einer Reise auf einer Annahme beruhten. Wenn Phase 2.2 – eine bestehende Reise per Sprache ändern – das braucht, ist es dort zu entscheiden, mit einem Ort, der dann auch gelesen wird.

---

## ADR-0056 – Terra plant, Sol wägt ab, Luna hilft nur

**Datum:** 19. August 2026
**Status:** umgesetzt auf dem Phase-2.1-Branch, Production unverändert aus

**Entscheidung:** Eine komplette Reiseplanung benutzt nicht ein Modell für alles.

- **Luna** nur für sehr einfache, schnelle Hilfsaufgaben. Sie wird für eine komplette Reise **nicht** automatisch gewählt.
- **Terra** ist das Standardmodell für normale Planung und der eine Fallback, wenn Sol an Zeit, Netz, 5xx oder einer abgeschnittenen Antwort scheitert.
- **Sol** nur bei komplexen Abwägungen: mehrere harte Vorgaben, mehrere Ziele oder Insel-Transfers, Roadtrip, widersprüchliche Wünsche, mehrere Verkehrsmittel, enge Budget-/Komfort-/Zeitbedingungen.

Die Wahl ist deterministisch und steht im Freitext (`lib/reisevorschlag/routing.ts`). Es gibt **keinen** zusätzlichen Modellaufruf nur zur Auswahl. `JETNITY_MODELL_NAME` bleibt der manuelle Stift für Probe und Betrieb.

Zeitgrenzen, ohne künstliches Warten:

| Modell | Harte Obergrenze |
| --- | ---: |
| Terra, Luna | 90 s |
| Sol | 120 s |

60 s bleiben das Soft-Ziel. 60–90 s sind zulässig. 90–120 s sind Reserve für schwierige Sol-Fälle. `maxDuration` der Planungsseite ist 300 s, damit ein Sol-Lauf plus genau ein Terra-Fallback nicht an der Plattform stirbt. Vercel Hobby (60 s) reicht dafür nicht.

Nach einem gültigen Plan prüft Jetnity harte, aus dem Text ableitbare Vorgaben (Dauer, Reisende, Budgetziel, Orte, Ausschlüsse, Flugverbot, Ruhetage, maximale Etappen). Bei einer klaren Verletzung gibt es **genau eine** Korrektur, danach eine zweite Prüfung. Offene Punkte erscheinen als `warnungen`, nicht als perfekter Plan. Subjektive Wünsche („schön“, „entspannt“) sind keine harten Vorgaben.

Während der Generierung zeigt `/planen` zeitgesteuerte Phasen, keine erfundenen Prozente und keine Providerdaten.

**Kontext:** Die Vorgabe Luna (ADR-0051) beruhte auf drei kurzen Fixtures. Die spätere Messung mit `reasoning.effort: low` und vergleichbarer Struktur auf fünf vollständigen Planungsfällen zeigte ein anderes Bild.

| Fall | Sol | Terra | Qualität |
| --- | ---: | ---: | --- |
| Japan | 47,3 s / USD 0.0538 / 38 Punkte | 23,3 s / USD 0.0247 / 40 Punkte | Terra knapp besser |
| Vietnam, komplex | 87,9 s / USD 0.1503 / 65 Punkte | 41,2 s / USD 0.0421 / 60 Punkte | Sol besser (Logistik und Entspannung zusammen) |
| Griechenland, Inseln | 52,2 s / USD 0.0748 / 45 Punkte | 34,3 s / USD 0.0314 / 52 Punkte | Sol besser (eine Insel weniger, weniger Wechsel) |
| Kalifornien, Roadtrip | 68,8 s / USD 0.1002 / 58 Punkte | 40,5 s / USD 0.0349 / 47 Punkte | Sol knapp besser |
| Italien, widersprüchlich | 50,1 s / USD 0.0656 / 30 Punkte | 33,4 s / USD 0.0279 / 33 Punkte | praktisch Gleichstand, Sol minimal besser |

Zwei zuvor vermutete Budgetabweichungen waren **keine** Modellfehler: Die falschen Beträge standen schon im per Hand kopierten Testprompt.

Sol ist damit nicht „immer besser“. Terra gewinnt einfache Fälle und ist meist deutlich schneller. Sol hat seinen Vorteil bei komplexen Abwägungen.

Die frühere 40-Sekunden-Grenze würde genau diese Sol-Läufe abschneiden.

**Alternativen:**

1. *Ein Modell für alles, Luna.* Günstig auf kurzen Fixtures, zu schwach als alleinige Qualitätslinie für eine komplette Reiseplanung.
2. *Ein Modell für alles, Terra.* Stark und schnell genug für den Normalfall, in den komplexen Messungen aber nicht die bessere Gesamtentscheidung.
3. *Ein Modell für alles, Sol.* In mehreren komplexen Fällen besser, aber langsamer und teurer – und in Japan nicht die bessere Wahl.
4. *Ein Modellaufruf, der das Modell wählt.* Ein zusätzlicher bezahlter Schritt, der selbst fehlschlagen kann, ohne die Planung besser zu machen.
5. *OpenRouter, LiteLLM oder Vercel AI Gateway.* Neue laufende Infrastruktur für eine Entscheidung, die ein kurzer Textvergleich schon trägt.
6. *Die 40-Sekunden-Grenze behalten.* Würde gemessene Sol-Pläne von 50–90 s verwerfen.

**Begründung:** Qualität hat Vorrang vor Kosten und Geschwindigkeit, aber nicht um den Preis, Terra dort zu verwerfen, wo es schneller und mindestens so gut ist. Routing statt Monokultur. Eine Korrektur statt einer Retry-Schleife. Sichtbare Arbeit statt eines leeren Warteschirms.

**Konsequenzen:** `modellFuerReisevorschlag()` entscheidet vor dem Kontingent. Jeder Aufruf – erster Plan, Terra-Fallback, eine Korrektur – bucht sein eigenes Kontingent und umgeht weder Quota noch Kostendeckel. 38 Sol-Reservierungen würden den $3-Tagesdeckel sprengen; der Deckel bleibt die harte Kostenschranke (ADR-0052). Production bleibt aus.

**Bekannte Grenze:** Der Router liest Muster, keine Weltkarte. Ein ungewöhnlich formulierter einfacher Wunsch kann Sol auslösen, ein komplexer ohne die bekannten Wörter Terra. Der Stift `JETNITY_MODELL_NAME` bleibt der bewusste Eingriff.

---

## ADR-0057 – Ein Reisetag gehört zu einer Etappe

**Datum:** 20. August 2026
**Status:** umgesetzt auf dem Phase-2.2-Branch, Production unverändert

**Entscheidung:** `trip_days.stage_id` ist die verbindliche Zuordnung eines Tages zu einer Etappe. Sie gilt auch dann, wenn die Reise keine Kalenderdaten hat.

Der zusammengesetzte Fremdschlüssel `(stage_id, trip_id) → trip_stages (id, trip_id)` verhindert, dass ein Tag an einer fremden Reise hängt. `ON DELETE SET NULL` nur für `stage_id` lässt den Tag stehen, wenn die Etappe entfällt.

Bestehende Zeilen werden beim Migrieren zugeordnet: eine Etappe, sonst Datumsüberlappung, sonst Mehrheit aus `trip_items.stage_id`, sonst anteilig nach `day_index`. Neue Reisen setzen die Zuordnung in `public.reise_anlegen()` und im Gastspeicher, auch ohne Zeitraum.

**Kontext:** Das ursprüngliche Schema hat die Verknüpfung bewusst offengelassen: Ein Tag hatte Nummer und optionales Datum, ein Planpunkt konnte an Tag oder Etappe hängen. Für Phase 2.2 – „Florenz einen Tag kürzer, danach zwei Tage am Meer“ – reicht das nicht. Ohne `stage_id` am Tag gäbe es bei einer datumsfreien Mehr-Etappen-Reise keine deterministische Antwort, welche Tage zu welcher Etappe gehören.

**Alternativen:**

1. *Zuordnung nur über Kalenderdaten.* Scheitert genau am Fall ohne Datum, den das Modell seit Phase 1.5 erlaubt.
2. *Zuordnung nur über `trip_items.stage_id`.* Ein leerer Tag hätte keine Etappe, und genau leere Tage entstehen beim Verlängern.
3. *Das Modell liefert eine komplette Ersatzreise.* Würde bestehende Kennungen und kommerzielle Felder verwerfen.

**Begründung:** Die Zuordnung ist eine Eigenschaft des Tages, nicht des Modells. TypeScript, Zod und die Datenbank sagen dieselbe Sache.

**Konsequenzen:** `tageEtappenZuordnen()` füllt fehlende Werte beim Lesen. Die Oberfläche ändert sich nicht: Etappen bleiben die Route, Tage der Plan. `ON DELETE SET NULL` kann `stage_id` leeren; der nächste Lesevorgang ordnet neu zu.

---

## ADR-0058 – Eine Reiseänderung steht auf einer Fassung

**Datum:** 20. August 2026
**Status:** umgesetzt auf dem Phase-2.2-Branch, Production unverändert

**Entscheidung:** `trips.revision` ist die technische Fassung einer Reise. Ein Änderungsvorschlag trägt `basis_revision`. Speichern gelingt nur, wenn die aktuelle Fassung noch dieselbe ist.

`trips.last_mutation_id` macht denselben Bestätigungsvorgang idempotent: Retry und Doppelklick mit derselben Mutationskennung ändern nichts ein zweites Mal. Eindeutig ist `(user_id, last_mutation_id)`; mehrere Reisen ohne letzte Mutation bleiben zulässig (`NULL` kollidiert nicht).

**Kontext:** Zwei Tabs, ein langsames Netz und „Änderung übernehmen“ zweimal sind der Normalfall, nicht der Rand. Ohne Fassung würde der zweite Vorschlag den ersten überschreiben. Ohne Mutationskennung würde derselbe Klick die Reise zwei Tage länger und dann noch einmal zwei Tage länger machen.

**Alternativen:**

1. *Nur `updated_at`.* Ein Zeitstempel ist kein Vergleichswert für „dieselbe Fassung“, sobald zwei Schreibvorgänge in derselben Sekunde liegen.
2. *Die komplette Reise sperren.* Würde den zweiten Tab blockieren, statt ihm zu sagen, dass sein Vorschlag veraltet ist.
3. *Idempotenz nur im Browser.* Überlebt keinen Retry nach einem abgebrochenen `fetch`.

**Begründung:** Optimistische Concurrency und Idempotenz gehören in die Datenbank, weil nur sie alle Tabs und alle Retries sieht. Dieselbe Lehre wie ADR-0048 und ADR-0049.

**Konsequenzen:** Die Server Action lädt die Reise neu, prüft Fassung und Mutationskennung und wendet die Operationen erneut an, bevor `public.reise_aendern()` schreibt.

**Nachtrag, 20. August 2026:** Jede fachliche Änderung an `trip_stages`, `trip_days` oder `trip_items` erhöht `trips.revision` und damit `updated_at`. Statement-Trigger rufen `public.reise_graph_geaendert()` auf. `reise_anlegen()` und `reise_aendern()` setzen transaktionslokal `jetnity.graph_mutation`, damit ihre Kindzeilen die Fassung nicht ein zweites Mal zählen. Direkte Schreibwege (`planpunktAnlegen`, `planpunktEntfernen`, PostgREST) zählen mit: Ein Sprachänderungsvorschlag auf Fassung N ist nach einem manuellen Planpunkt veraltet.

**Nachtrag, 20. August 2026 (Stammdaten):** Ein direktes UPDATE der fachlichen Spalten auf `public.trips` (`title`, `origin`, `start_date`, `end_date`, `travellers`, `currency`, `budget_amount`, `status`, `pace`, `interests`, `travel_wish`) erhöht `revision`, wenn der Schreibweg sie nicht bereits gesetzt hat. `reise_aendern()` schreibt `revision + 1` selbst und wird nicht doppelt gezählt. Der Kind-Trigger ändert nur `revision` und löst den Stamm-Auslöser nicht aus.

---

## ADR-0059 – Das Modell ändert Operationen, nicht die Reise

**Datum:** 20. August 2026
**Status:** umgesetzt auf dem Phase-2.2-Branch, Production unverändert

**Entscheidung:** Die Modellfunktion `reiseaenderung` liefert strukturierte Operationen mit den Kennungen der bestehenden Reise. Reine TypeScript-Logik (`lib/reiseaenderung/anwenden.ts`) wendet sie auf die vertrauenswürdige Reise an. Das Ergebnis wird erneut als Reise geprüft.

Das Modell schreibt nicht in die Datenbank und erhält keine SQL-Rechte. Sein Output bleibt untrusted input (ADR-0053). Das Schema enthält keine Preise, Anbieter, Buchungslinks oder External-Refs (ADR-0054). Unveränderte Planpunkte behalten diese Felder über ihre Kennung; neue bleiben leer.

Kontingent und Kostendeckel sind dieselben wie bei `reisevorschlag`. `model_usage.funktion` unterscheidet die Aufrufe im Protokoll, nicht in der Schranke.

**Kontext:** Eine komplette Ersatzreise vom Modell würde bestehende IDs, Preise und Buchungsanker verwerfen. Phase 2.2 braucht das Gegenteil: „zwei Tage länger“ hängt Tage an, „entferne Rom“ löscht eine Etappe, der Dom behält seinen GetYourGuide-Verweis.

**Alternativen:**

1. *Das Modell liefert eine komplette Ersatzreise.* Einfacher Prompt, teurer an Integrität.
2. *Das Modell schreibt per Werkzeug in die Datenbank.* Genau der Weg, den Phase 2.1 ausgeschlossen hat.
3. *Ein zweiter, unabhängiger Modellstack.* Würde Quota, Kill Switch und Routing verdoppeln.

**Begründung:** Operationen plus deterministisches Anwenden halten die bestehende Reise als Wahrheit. Der Unterbau aus Phase 2.1 (Terra/Sol, Structured Outputs, Kontingent) wird erweitert, nicht ersetzt.

**Konsequenzen:** Unbekannte Kennungen, leere Diffs und schemawidrige Antworten werden verworfen, bevor eine Vorschau entsteht. Speichern bestätigt Operationen, nicht den Graphen aus dem Browser. Gäste schicken die geprüfte Reise mit; Konten laden sie aus der Datenbank.

**Nachtrag, 20. August 2026:** Bis Phase 3 ein bewusstes Buchungs-/Providerverhalten definiert, bleiben Planpunkte mit `provider`, `externalRef`, `bookingUrl` oder Preis bei Modelloperationen stehen. `punkt_entfernen` ist für sie ein No-Op. Fehlt ein solcher Punkt nach dem Anwenden, setzt `kommerziellErhalten()` ihn ungeplant zurück. Eine allgemeine Umplanung („mach die Reise entspannter“) darf ihn nicht verschwinden lassen.

**Nachtrag, 20. August 2026 (Sperre):** Bis Phase 3 darf das Modell einen solchen Punkt überhaupt nicht inhaltlich verändern: nicht `kind`, `title`, `note`, `startsOn`/`startsAt`, `endsOn`/`endsAt`, `dayId`/`stageId` und nicht die Handelsfelder. `punkt_anpassen` ist dafür ein No-Op. `zeitraum_verschieben` und ein neues Startdatum lassen seine Termine stehen. Entfällt sein Tag oder seine Etappe, bleibt er ungeplant und sonst unverändert.

---

## ADR-0060 – `reise_aendern()` ist SECURITY INVOKER, atomisch und ohne Handelsfelder

**Datum:** 20. August 2026
**Status:** umgesetzt auf dem Phase-2.2-Branch, Production unverändert

**Entscheidung:** Account-Änderungen laufen über `public.reise_aendern(jsonb)`, `SECURITY INVOKER`. RLS bleibt die Eigentumsprüfung. Die Funktion prüft `basis_revision`, schreibt die Reise samt Kindern in einer Transaktion, ignoriert kommerzielle Spalten und erhöht `revision`.

Bestehende Kennungen unveränderter Zeilen bleiben: Upsert, danach Löschen der überzähligen. Die Reise wird nicht gelöscht und neu angelegt.

`anon` hat kein `EXECUTE`. `authenticated` schon – unter RLS.

**Kontext:** Direkte Updates über PostgREST wären mehrere Roundtrips ohne gemeinsame Fassung. Ein `SECURITY DEFINER` würde RLS umgehen und die Funktion zur zweiten Eigentumsprüfung machen. Phase 1.5 hat denselben Konflikt bei `reise_anlegen()` zugunsten von INVOKER entschieden (ADR-0045).

**Alternativen:**

1. *SECURITY DEFINER mit eigener Eigentumsprüfung.* Mehr Recht als nötig, zweite Quelle für „wem gehört die Reise".
2. *Vier Roundtrips aus der Server Action.* Kein gemeinsames Rollback, keine atomische Revision.
3. *Reise löschen und `reise_anlegen()` erneut aufrufen.* Verlöre IDs, Preise und die Missbrauchsschranke zählte eine Neuanlage.

**Begründung:** Dieselbe Bauart wie das Anlegen: INVOKER, eine Transaktion, Idempotenz in der Datenbank. Kommerzielle Felder gehören der späteren Anbieterphase, nicht dem Modell und nicht der Nutzlast.

**Konsequenzen:** Ein Fehler mitten in der Funktion lässt die vorige Fassung stehen, nachgewiesen in `npm run db:sicherheit`. Die Nutzlast darf Preise mitschicken – die Funktion liest sie nicht. Gäste speichern denselben fachlichen Ablauf im `localStorage` (`gastreiseAendern()`).

**Nachtrag, 20. August 2026:** `trip_days_index_eindeutig` und `trip_days_datum_eindeutig` sind `UNIQUE … DEFERRABLE INITIALLY IMMEDIATE`. Der partielle Unique-Index auf `day_date` entfällt; mehrere `NULL`-Daten bleiben zulässig. `reise_aendern()` setzt beide Bedingungen während des Kindschreibens auf `DEFERRED` und vor dem Rückgabewert wieder auf `IMMEDIATE`. Gültige Umnummerierungen und Datumsverschiebungen laufen durch; ein Zielgraph mit doppelter Nummer bleibt `23505`.

---

## ADR-0061 – Gast und Konto teilen denselben Reisegraphen samt ungeplanter Punkte

**Datum:** 20. August 2026
**Status:** umgesetzt auf dem Phase-2.2-Branch, Production unverändert

**Entscheidung:** `ohneTag` gehört zum Reisemodell, nicht nur zur Konto-Abbildung. Der Gastspeicher persistiert ungeplante Planpunkte unter `jetnity:reise:v3`. `public.reise_anlegen()` übernimmt sie als `ungeplante` mit `day_id` null. Alte v3-JSON ohne das Feld bleibt lesbar (`default []`). Bestehende Punkte, die fälschlich am letzten Tag hingen, werden nicht still umgehängt.

**Kontext:** Konto-Reisen legen Restpunkte nach `on delete set null` in `ohneTag`. Der Gastspeicher hängte sie an den letzten Tag, weil LocalStorage kein eigenes Feld hatte. Nach Reload gehörte ein ungeplanter Punkt scheinbar zum letzten Reisetag.

**Alternativen:**

1. *Weiter am letzten Tag hängen.* Fachlich falsch und nach der Übernahme nicht mehr von echten Tagespunkten zu unterscheiden.
2. *LocalStorage-Schlüssel v4.* Unnötig: ein optionales Feld mit Vorgabe `[]` liest v3 weiter.
3. *Stille Migration: Punkte ohne Uhrzeit am letzten Tag nach ohneTag.* Würde echte letzte-Tag-Punkte verlieren.

**Begründung:** Dieselbe Graphform in beiden Ablagen. Keine Datenlöschung, keine Spekulation über alte Entwürfe.

**Konsequenzen:** `gastreiseAendern()` und `aenderungErzeugenGast()` wischen `ohneTag` nicht mehr. Die Übernahme schickt `ungeplante`. Die Listen-Sortierung über `trips.updated_at` folgt der Graph-Revision (ADR-0058 Nachtrag).

---

## ADR-0062 – Duffel ist der erste Flugadapter, nicht die Produktarchitektur

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.1

**Entscheidung:** Jetnity spricht intern eine schlanke Flugdomäne (`FlugSuchanfrage`, `FlugOption`, `FlightProvider`). Duffel Flights API ist der erste Daten-/Entwicklungsadapter. Ein späterer Metasuch-Provider (Skyscanner, Aviasales) muss dasselbe Interface erfüllen. Search-Provider und Affiliate-/Booking-Provider sind getrennte Verantwortlichkeiten. `booking_url` bleibt bei Duffel `null`. Jetnity darf sich weder technisch noch geschäftlich an Duffel koppeln. Amadeus Self-Service wird nicht angebunden (eingestellt am 17. Juli 2026).

**Kontext:** Phase 3 beginnt mit echten Flügen. ADR-0011 und [AGENTS.md](AGENTS.md) Regel 19 verbieten eine Multi-Provider-Plattform auf Vorrat. Gleichzeitig darf der erste Anbieter nicht zur stillen Produktbindung werden. Amadeus Self-Service steht nicht mehr zur Verfügung.

**Alternativen:**

1. *Duffel-Typen durch UI und Reisegraph reichen.* Macht jeden Providerwechsel zu einem Rewrite.
2. *Jetzt eine generische Plattform für zehn Anbieter.* Komplexität ohne zweiten Provider.
3. *Deeplinks aus der Suche erfinden.* Wäre eine irreführende Buchungs-URL.
4. *Amadeus trotzdem anbinden.* Die Self-Service-API ist eingestellt.

**Begründung:** Die Naht ist klein genug, um verdient zu sein, und gross genug, damit UI, Scoring und Trip-Integration den Adapter nicht kennen. Buchung kommt später und darf einen anderen Partner nutzen.

**Konsequenzen:** Keine Duffel-Typen in Komponenten. Keine eigene Flugbuchung. Keine Production-Aktivierung. `/api/search/airports` hat keinen Amadeus-Fallback mehr und liest nur `public.airports`. Dokumentation in [docs/FLUEGE.md](docs/FLUEGE.md).

---

## ADR-0063 – Flug-Ranking ist deterministisch und provisionsneutral

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.1

**Entscheidung:** Das Kernranking ist eine reine Funktion über Preis, Dauer, Stopps, sehr frühe Abflüge, sehr späte Ankünfte, lange Umstiege, Overnight-Verbindungen und Passung zu bekannten Reisedaten. Kein Modell. Keine Provision. Kein Providername. Die UI zeigt „Jetnity empfiehlt“, „Günstigste“ und „Schnellste“ plus 2–4 Gründe.

**Kontext:** Der Handoff und die Vision verlangen Gesamtreise statt billigster Flug. Ein LLM-Ranking wäre weder reproduzierbar noch in der CI prüfbar.

**Alternativen:**

1. *Billigste zuerst.* Widerspricht dem Produktprinzip.
2. *Modell begründet die Rangfolge.* Teuer, nicht deterministisch, in Tests nicht reproduzierbar.

**Begründung:** Vertrauen entsteht, wenn dieselbe Suche dieselbe Reihenfolge liefert und der Nutzer den Trade-off lesen kann.

**Konsequenzen:** Gewichte stehen im Code (`RANGLISTE_GEWICHTE`), nicht in der Umgebung. Tests belegen, dass die günstigste Option nicht automatisch die Empfehlung ist.

---

## ADR-0064 – Flugsuche in Production aus, nur Duffel-Test, fehlende Secrets sind unavailable

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.1

**Entscheidung:** `VERCEL_ENV=production` schaltet die Flugsuche hart aus. Development/Preview brauchen `JETNITY_FLIGHT_AKTIV` plus ein Duffel-Test-Token (`duffel_test_…`). Ein Live-Token gilt als fehlender Zugang. Fehlende Credentials sind ein sauberer unavailable-Zustand, kein Buildfehler.

**Kontext:** Kostenpflichtige Provider-Aufrufe und Production-Secrets brauchen ausdrückliche Freigabe. Der Modellweg hat dasselbe Muster (ADR-0052). Duffel unterscheidet Test und Live am Token, nicht am Hostname.

**Alternativen:**

1. *Production mit Test-API.* Würde echte Nutzer gegen Sandbox-Angebote zeigen.
2. *Secrets im Setup-Check verlangen.* Würde jede Umgebung ohne Duffel rot färben.
3. *Live-Token in Preview zulassen.* Wäre ein kostenpflichtiger Aufruf ohne Freigabe.

**Begründung:** Dieselbe Fail-closed-Linie wie beim Modell. Die Suche darf lokal fehlen, ohne den Build zu brechen.

**Konsequenzen:** Keine `NEXT_PUBLIC_DUFFEL_*`. Rate-Limit im Prozess. Timeout 12 s. Keine Passagiernamen an Duffel. Kein `/air/orders`.

---

## ADR-0065 – `reise_anlegen()` schreibt kommerzielle Momentaufnahmen

**Datum:** 20. August 2026
**Status:** freigegeben für Development, Production nicht angewendet

**Entscheidung:** `public.reise_anlegen()` übernimmt Preis, Währung, Provider, External-Ref, Buchungslink und Termin einer Planpunkt-Nutzlast. Modellvorschläge setzen diese Felder weiter auf null. `reise_aendern()` bleibt unverändert und überschreibt Handelsfelder nicht.

**Kontext:** Ohne diese Schreibseite verlöre ein Gast seinen ausgewählten Flug beim Login. Die Spalten existieren seit Phase 1.5.

**Alternativen:**

1. *Nach der Übernahme separat inserieren.* Zwei Schreibwege, Race, Dubletten.
2. *Gäste dürfen keine Flüge übernehmen.* Widerspricht dem Gastmodus.

**Begründung:** Dieselbe Persistenz, die schon Gast → Konto trägt, muss die Momentaufnahme mitnehmen. Die Modellregel (ADR-0054, ADR-0060) bleibt: das Modell erzeugt und verändert keine Handelsfelder.

**Konsequenzen:** Zod akzeptiert die Felder. Development-Migration `20260820100000`. Production erst nach Freigabe.

---

## ADR-0066 – Flughafenbasis kommt aus OurAirports, nicht aus einem Provider

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.1; Schema und Inhalt nur Development

**Entscheidung:** Die Autocomplete-Suche unter `/api/search/airports` liest ausschliesslich `public.airports`. Der Bestand kommt aus einem kontrollierten Import der OurAirports-Open-Data-CSV (Public Domain), gefiltert auf IATA plus kommerziell relevante Nutzung. Weder Amadeus noch Duffel noch eine Live-Abfrage gegen OurAirports gehören zum Suchweg. CI und Production-Build laden den Datensatz nicht. Production bleibt unangetastet, bis eine eigene Freigabe Schema und Inhalt dorthin trägt.

**Kontext:** Nach dem Entfernen des Amadeus-Fallbacks war die Suche korrekt lokal – und leer. Development hatte 0 Zeilen, Production etwa 40 historische Einträge. Das reicht nicht für eine globale Flugsuche. Ein Provider als Airport-Quelle würde die Autocomplete an denselben Zugang koppeln, der für die Flugangebote noch fehlt, und bei jedem Tastendruck Kosten oder Ausfälle erzeugen.

**Alternativen:**

1. *OurAirports bei jeder Suche live abfragen.* Langsam, ausfallabhängig, CI und Preview ohne Netz wären rot, Verstoss gegen die Anforderung.
2. *Den vollen Dump ins Repository oder ins CI-Image legen.* Zehntausende irrelevante Felder, Lizenz- und Grössenballast, jeder Test würde ihn laden.
3. *Duffel Places oder einen anderen Flugprovider als Airport-Quelle.* Koppelt die Suche an den Preview-Zugang und an einen Anbieter.
4. *Nur die 40 historischen Production-Zeilen kopieren.* Keine globale Basis.

**Begründung:** Die Autocomplete ist Teil der Reiseidee, nicht Teil eines Fluganbieters. OurAirports ist gemeinfrei, offline importierbar und unabhängig vom Duffel-Sandbox-Zugang. Der Filter hält Helipads und private Felder aus der Nutzersuche. Tests bleiben klein, weil sie Fixtures lesen.

**Konsequenzen:** Schemaerweiterung `20260820110000` nur Development (`region`, `country_code`, `keywords`, `klasse`, `updated_at`). Schreibweg nur `npm run airports:importieren -- --schreiben --entwicklung`, davor `ziel()`. Dokumentation in [docs/FLUGHAFEN.md](docs/FLUGHAFEN.md). Ein späterer Production-Import braucht Freigabe.

---

## ADR-0067 – Ortsbasis kommt aus GeoNames-Dumps, nicht aus einem Geocoding-Proxy

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.1; Schema und Inhalt nur Development

**Entscheidung:** Reiseziel und Abreise werden gegen eine lokale Tabelle `public.places` geprüft. Der Bestand kommt aus dem GeoNames-Dump (`allCountries` + `countryInfo`, CC BY 4.0) plus Flughafen-Zeilen aus `public.airports`. Die Nutzersuche trifft niemals GeoNames, Google, Nominatim oder einen Flugprovider. Ein eingetippter Text ohne bestätigte Auswahl wird nicht als geografischer Kern gespeichert. Production bleibt unangetastet.

**Kontext:** Startseite und `/planen` akzeptierten freie Texte. Für Flüge, Karten, Hotels und Länderinformationen braucht der gespeicherte Kern einen realen Ort. `public.airports` deckt Bali, Südtirol oder Toskana nicht. Ein Live-Geocoding bei jedem Tastendruck wäre entweder kostenpflichtig, gegen die Nominatim-Nutzungsregeln oder neue Infrastruktur.

**Alternativen:**

1. *Nominatim öffentlich als Autocomplete.* Usage Policy verbietet schwere Autocomplete-Last.
2. *Google Places oder vergleichbare APIs.* Laufende Kosten, Secret im Suchweg.
3. *`public.airports` als Destination-Datenbank.* Falsch für Regionen und Inseln.
4. *Eine kuratierte Fantasieliste.* Keine belastbare Weltbasis.
5. *GeoNames-Webservice.* Username, Credit-Limit, Live-Abhängigkeit.

**Begründung:** Der Dump ist kostenlos, kommerziell nutzbar und einmal importierbar. Attribution ist die einzige Lizenzpflicht. Filter halten Fantasieorte und Helipads draussen. UI und Reisegraph sprechen nur die interne `Ort`-Form.

**Konsequenzen:** Additive Development-Migration `20260820120000`. `trips.origin_place_id` und `trip_stages.place_id` sind optional. Altbestand bleibt lesbar. Schreibweg nur `npm run places:importieren -- --schreiben --entwicklung`, davor `ziel()`. Der erste Development-Import enthält 124 811 Orte. Dokumentation in [docs/ORTE.md](docs/ORTE.md). Der Modellweg kanonisiert eindeutige Orte gegen dieselbe Tabelle und rät nicht bei Mehrdeutigkeit (`20260820130000` schreibt die Referenzen auch in `reise_aendern()`). Ein späterer Production-Import braucht Freigabe.

---

## ADR-0068 – Formularfehler sitzen am Feld, nicht nur in einer Zusammenfassung

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.1

**Entscheidung:** Pflicht- und Validierungsfehler der V2-Formulare erscheinen direkt am betroffenen Feld. Beim Absenden werden alle fehlerhaften Felder markiert. Die Ansicht scrollt zum ersten Fehler und setzt den Fokus dorthin. Eine allgemeine Zeile „Bitte prüfe die markierten Angaben.“ ist nur Ergänzung. Reines Rot ist nie das einzige Fehlersignal.

**Kontext:** Unter `/planen` landete die Ablehnung oft nur unterhalb der Absenden-Taste. Auf dem Telefon sah niemand, welches Feld fehlte. Ortssuche, Datum, Reisende und Budget brauchen dieselbe Regel wie die Auth-Felder, die das `Input`-Primitiv schon vorbereiten.

**Alternativen:**

1. *Nur die native Browser-Validierung.* Uneinheitlich, oft ohne konkreten Satz, und auf iOS leicht zu übersehen.
2. *Nur eine Toast- oder Banner-Meldung.* Das Feld bleibt unsichtbar.
3. *Nur den ersten Fehler zeigen.* Der Nutzer korrigiert, sendet erneut, findet den nächsten.

**Begründung:** Mobile-first und Screenreader brauchen die Verbindung Feld → Meldung (`aria-invalid`, `aria-describedby`). Die Fachprüfung bleibt in `lib/formular/feldfehler.ts` und den bestehenden Ortsregeln, nicht in einer neuen Geodatenquelle.

**Konsequenzen:** `/planen`, Startseiten-Ortssuche und die Auth-Formulare teilen dieselbe UX-Regel. `noValidate` verhindert, dass der Browser die eigene Meldung darüberlegt. Production unverändert.

---

## ADR-0069 – Production-Import nur mit Mehrfachschutz, nie still

**Datum:** 20. August 2026
**Status:** freigegeben, vorbereitet; Production noch nicht beschrieben

**Entscheidung:** Der Airport- und Place-Import nach Production ist ein manueller Release-Schritt. Er braucht `--schreiben --produktion` und den exakten Project-Ref. Die Management API muss bestätigen, dass das Ziel ein eigenständiges Projekt ist. Ein Development-Branch wird im Production-Modus abgelehnt. `--bereinigen` ist dort verboten. CI, Build und Merge importieren nicht.

**Kontext:** Production steht auf `20260820080000`, hat 40 historische Airports und keine `places`. Development hat Schema und Bestand. Dieselbe Schreibfunktion ohne extra Schutz würde Production treffen, sobald `SUPABASE_PROJECT_REF` auf das Projekt zeigt. Einen Production-Ref hart im Repository zu hinterlegen wäre die schwächere Lösung.

**Alternativen:**

1. *Schutz `ziel()` einfach entfernen.* Ein falscher Ref schreibt Production.
2. *Production-Ref als Default im Code.* Muss gepflegt werden, erkennt ein zweites Projekt nicht.
3. *Automatischer Import beim Deploy.* Keine Freigabe, keine Pause nach einem Schemafehler.

**Begründung:** Referenzdaten dürfen fehlen oder unvollständig sein; sie dürfen nicht still überschrieben oder gelöscht werden. UPSERT ohne Bereinigen erhält die 40 historischen Zeilen. Die Reihenfolge Schema → Airports → Places steht in [docs/PRODUCTION_ROLLOUT.md](docs/PRODUCTION_ROLLOUT.md).

**Konsequenzen:** Development-Weg unverändert (`--schreiben --entwicklung`). Production bleibt aus, bis die Freigabe und der manuelle Lauf vorliegen. `npm run production:pruefen` ist vollständig read-only (Metadaten, kein HTTP-Schreibversuch). `db:anwenden --produktion` verlangt `--bis 20260820130000` und wendet keine spätere Migration an. Duffel-Sandbox ist kein Merge-Blocker.

---

## ADR-0070 – Hoteldomäne und `HotelProvider` sind die Architektur, kein Anbieter

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2

**Entscheidung:** Jetnity spricht intern eine schlanke Hotel-/Quartierdomäne (`HotelSuchanfrage`, `HotelOption`, `HotelProvider`). Phase 3.2 bindet **keinen** Hotelanbieter an. Search-Provider und Affiliate-/Booking-Provider bleiben getrennte Verantwortlichkeiten. `booking_url` bleibt `null`.

**Kontext:** Die Vision verlangt zuerst die Gegend, dann wenige Hotels. ADR-0011 und [AGENTS.md](AGENTS.md) Regel 19 verbieten eine Multi-Provider-Plattform auf Vorrat. Gleichzeitig darf der spätere erste Anbieter nicht zur stillen Produktbindung werden.

**Alternativen:**

1. *Sofort Booking.com/Expedia als Architektur nehmen.* Macht jeden Wechsel zum Rewrite.
2. *Jetzt eine generische Plattform für zehn Hotelanbieter.* Komplexität ohne ersten Provider.
3. *Deeplinks erfinden, damit die UI voll wirkt.* Wäre eine irreführende Buchungs-URL.

**Begründung:** Die Naht ist klein genug, um verdient zu sein. UI, Quartierlogik, Ranking und Trip-Übernahme kennen den Adapter nicht.

**Konsequenzen:** `hotelProviderAus()` gibt `null` zurück. Tests injizieren höchstens Fixtures. Dokumentation in [docs/HOTELS.md](docs/HOTELS.md).

---

## ADR-0071 – Quartier- und Hotelranking sind deterministisch und provisionsneutral

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2

**Entscheidung:** Zuerst wird die Gegend bewertet, danach Hotels innerhalb dieser Gegend. Beide Rankings sind reine Funktionen mit festen Gewichten. Kein Modell. Keine Provision. Kein Providername. Labels: Jetnity empfiehlt, Best Value, beste Lage, ruhigere Alternative, Premium.

**Kontext:** Vision und Handoff verlangen Gesamtreise statt billigstes Hotel. Ein LLM-Ranking wäre weder reproduzierbar noch in der CI prüfbar.

**Alternativen:**

1. *Billigstes Hotel zuerst.* Widerspricht dem Produktprinzip.
2. *Modell begründet Gegend und Rangfolge.* Teuer, nicht deterministisch.

**Begründung:** Vertrauen entsteht, wenn dieselbe Reise dieselbe Gegend und dieselbe Reihenfolge liefert.

**Konsequenzen:** Gewichte stehen im Code (`QUARTIER_GEWICHTE`, `HOTEL_RANGLISTE_GEWICHTE`). Tests belegen, dass der günstigste Preis nicht automatisch die Empfehlung ist.

---

## ADR-0072 – Quartierkontext nur aus vorhandenen Reisedaten

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2

**Entscheidung:** Die Quartierbewertung liest Etappe, Koordinaten, Zeitraum, bestätigte Anker, frühen Abflug und vorhandene Nutzerangaben. Fehlende Routing-/POI-/ÖV-Daten bleiben `null`. Die Begründung behauptet keine kurzen Wege und keine Gegendprofile, die nicht belegt sind.

**Kontext:** Ein Hotelranking ohne echte Wegezeiten wirkt präzise und ist es nicht. Aktivitätstitel wie „Sagrada Família“ ohne Koordinaten sind kein POI.

**Alternativen:**

1. *Nachbarschaften und Gehzeiten schätzen.* Scheingenauigkeit.
2. *Sofort einen Routing-Provider kaufen.* Laufende Kosten ohne Freigabe.

**Begründung:** Unbekannt ist eine Aussage. Eine erfundene Minute ist ein Defekt.

**Konsequenzen:** Ohne Koordinaten gibt es keine Quartierempfehlung in der UI. Ein späterer Routing- oder POI-Weg ersetzt die Nullen, ändert aber nicht die Domäne.

---

## ADR-0073 – Hotelsuche in Production aus, fehlender Provider ist unavailable

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2

**Entscheidung:** `VERCEL_ENV=production` schaltet die Hotelsuche hart aus. Development/Preview brauchen `JETNITY_HOTEL_AKTIV` plus einen späteren Provider. Fehlender Provider ist ein sauberer unavailable-Zustand, kein Buildfehler. Quartierkontext darf aus der validierten Reiseanfrage trotzdem berechnet werden.

**Kontext:** Dieselbe Fail-closed-Linie wie Modellweg (ADR-0052) und Flugsuche (ADR-0064). Phase 3.2 hat noch keinen Token-Vertrag.

**Alternativen:**

1. *Secrets im Setup-Check verlangen.* Würde jede Umgebung ohne Hotelanbieter rot färben.
2. *Fake-Hotels in der echten UI.* Widerspricht der Produktregel.

**Begründung:** Die Pipeline kann integrationsbereit sein, ohne Production oder Nutzer mit erfundenen Angeboten zu täuschen.

**Konsequenzen:** Keine `NEXT_PUBLIC_HOTEL_*`. Rate-Limit im Prozess. Timeout 12 s. `POST /api/hotels/search` ist kein Provider-Proxy.

---

## ADR-0074 – Hotelübernahme als `stay` auf dem bestehenden Schema

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2; keine neue Migration

**Entscheidung:** Ein ausgewähltes Hotel wird als `trip_items.kind = stay` gespeichert. Die Momentaufnahme nutzt Titel, Notiz, Check-in/Check-out, Preis, Provider und External-Ref. `booking_url` bleibt `null`. `stage_id` bindet die Nächte an die Etappe. Keine neue Production- oder Development-Migration.

**Kontext:** Die Spalten existieren seit Phase 1.5. Eine Extra-Tabelle für Hotelnächte oder Quartier-IDs wäre voreilig, solange kein Provider echte Angebote liefert.

**Alternativen:**

1. *Eigene `hotel_stays`-Tabelle jetzt.* Schema ohne Daten.
2. *Übernahme erst nach dem ersten Provider bauen.* Würde die Trip-Naht später erneut öffnen.
3. *JSON in `note` als verstecktes Schema.* Die Notiz bleibt Menschenlesart, kein Speicher für Felder.

**Begründung:** Dieselbe Persistenz wie der Flug. Modelloperationen dürfen kommerzielle Punkte nicht ändern (ADR-0059). Preisänderungen später beobachten, nicht still überschreiben.

**Konsequenzen:** Gast- und Kontoweg sind vorbereitet. Die UI zeigt den Übernehmen-Knopf nur bei echten Optionen. Eine spätere feinere Hotelpersistenz wäre eine eigene Development-Migration.

---

## ADR-0075 – Konto-Hotelübernahme nur über serverseitigen Nachweis

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2b; kein echter Provider

**Entscheidung:** Eine kommerzielle Hotelübernahme im Konto speichert keine Browseroption. Der Client liefert nur identifiers (`tripId`, `stageId`, `dayId`, `optionId`). Preis, Provider, External-Ref und der Zeitraum kommen aus einem serverseitigen `HotelNachweis` plus dem per RLS geladenen Reisegraphen. Solange kein Nachweis existiert, fällt die Übernahme fail closed. `HotelProvider.suchen()` bleibt schmal; die Auswahlbestätigung ist eine eigene Naht.

**Kontext:** Phase 3.2 validierte die Option mit Zod und persistierte sie. Ein authentifizierter Nutzer konnte damit einen erfundenen `stay` mit beliebigem Preis speichern. Zod prüft Form, nicht Herkunft.

**Alternativen:**

1. *HMAC-Signatur der Suchergebnisse mit einem App-Secret.* Zweckentfremdet Secrets, koppelt Suche und Übernahme, hilft nicht bei Provider-Preisänderungen.
2. *Nachweis in `HotelProvider.suchen()` einbauen.* Würde die Suchnaht aufblähen und Search mit Booking/Affiliate vermischen.
3. *Übernahme erst nach dem ersten Provider erlauben, ohne Naht.* Würde dieselbe Lücke später erneut öffnen.

**Begründung:** Die Vertrauensgrenze muss stehen, bevor der erste Adapter kommt. Tests können einen Fake-Katalog injizieren. Search-Provider und Affiliate-Partner müssen nicht identisch sein. Gastreisen bleiben LocalStorage und gelten nicht als serverseitig verifiziert.

**Konsequenzen:** `hotelNachweisAusUmgebung()` gibt heute `null` zurück. Der erste Provider oder ein Jetnity-eigener serverseitiger Nachweis implementiert `HotelNachweis`. Keine Secret-Signatur, keine Booking.com-/HBX-Annahme. Modelloperationen schützen kommerzielle `stay`-Punkte weiter über `istKommerziell` (ADR-0059).

---

## ADR-0076 – HotelNachweis ist an den Suchkontext gebunden

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2c; kein echter Provider

**Entscheidung:** `HotelNachweis.nachweisen()` bestätigt eine `optionId` nur zusammen mit einem serverseitigen `HotelNachweisKontext`: Ziel, Check-in, Check-out, Zimmer, Erwachsene, Kinder, Währung. Der Kontext kommt aus dem Reisegraphen und denselben Belegungs-Defaults wie die offizielle Suche (`1` Zimmer, `0` Kinder). Der Browser darf keines dieser Felder als Wahrheit liefern.

**Kontext:** Phase 3.2b band nur die `optionId`. Dieselbe Angebots-ID könnte zu einem anderen Ziel, Zeitraum oder einer anderen Belegung gehören. Dann würde ein Preis von Reise A auf Reise B landen.

**Alternativen:**

1. *Nur optionId, Zeitraum aus dem Graphen nachziehen.* Bindet den kommerziellen Fakt nicht an die Suche, die ihn erzeugt hat.
2. *Client schickt den Suchkontext mit.* Untrusted input in der Vertrauensgrenze.
3. *Secret-Signatur der Suchergebnisse.* Weiterhin ohne Providerbedarf und ohne Schutz vor späteren Preisänderungen.

**Begründung:** Der erste Adapter muss eine Option gegen genau die erwartete Suche ablehnen können. Ohne Place-ID bindet Jetnity an `stage:{etappenId}` derselben Reise, nicht an einen Client-Ortsnamen.

**Konsequenzen:** Tests injizieren einen Katalog mit Kontext. Abweichendes Ziel, Datum, Belegung oder Währung ist `geaendert`. Zimmer/Kinder bleiben Defaults, bis das Reiseschema eigene Felder trägt.

---

## ADR-0077 – Hotelsuche liest den Body nur bis zur Bytegrenze

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.2c

**Entscheidung:** `POST /api/hotels/search` prüft `Content-Length` vor jedem Lesen. Der Body wird anschliessend streamend mit einem harten Cap von 16 KB UTF-8 gelesen und abgebrochen, sobald das Limit überschritten ist. `Content-Length` allein ist kein Vertrauensbeweis.

**Kontext:** Phase 3.2b prüfte die Grösse erst nach `req.text()`. Ein übergrosser Request lag dann bereits vollständig im Speicher.

**Alternativen:**

1. *Nur Content-Length.* Fehlt oder lügt der Header, bleibt die Grenze wirkungslos.
2. *Globales Body-Limit-Middleware.* Unnötige Infrastruktur für einen Endpunkt.
3. *Zeichenanzahl statt Bytes.* Würde UTF-8-Multibyte unterschätzen.

**Begründung:** Die 3.2b-Anforderung war, kein praktisch unbegrenztes JSON einzulesen. Das geht nur vor der Allokation des ganzen Körpers.

**Konsequenzen:** 413 ohne vollständiges Buffering. Tests decken fehlendes, korrektes und irreführendes `Content-Length` sowie den Grenzfall exakt am Limit.

---

## ADR-0078 – Aktivitätsdomäne und `ActivityProvider` sind die Architektur, kein Anbieter

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3

**Entscheidung:** Jetnity spricht intern eine schlanke Aktivitätsdomäne (`ActivitySuchanfrage`, `ActivityOption`, `ActivityTimeslot`, `ActivityProvider`). Phase 3.3 bindet **keinen** Aktivitätenanbieter an. Search-Provider und Affiliate-/Booking-Provider bleiben getrennte Verantwortlichkeiten. `booking_url` bleibt `null`. GetYourGuide ist ein möglicher späterer Kandidat, keine festgelegte Architektur.

**Kontext:** Die Vision verlangt Aktivitäten, die zum konkreten Reisetag passen, nicht eine Ticketliste. ADR-0011 und [AGENTS.md](AGENTS.md) Regel 19 verbieten eine Multi-Provider-Plattform auf Vorrat. Die Hotelnaht (ADR-0070) ist Qualitätsreferenz, aber fachlich nicht kopierbar: Aktivitäten sind tages- und zeitgebunden.

**Alternativen:**

1. *Sofort GetYourGuide als Architektur nehmen.* Macht jeden Wechsel zum Rewrite.
2. *Hoteldomäne wiederverwenden.* Würde Etappen-Nächte mit Tageszeiten vermischen.
3. *Deeplinks erfinden, damit die UI voll wirkt.* Wäre eine irreführende Buchungs-URL.

**Begründung:** Die Naht ist klein genug, um verdient zu sein. UI, Tageskontext, Ranking und Trip-Übernahme kennen den Adapter nicht.

**Konsequenzen:** `activityProviderAus()` gibt `null` zurück. Tests injizieren höchstens Fixtures. Dokumentation in [docs/ACTIVITIES.md](docs/ACTIVITIES.md).

---

## ADR-0079 – Aktivitätsranking ist deterministisch, provisionsneutral und ohne Neutralwerte

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3

**Entscheidung:** Das Ranking ist eine reine Funktion mit festen Gewichten (`ACTIVITY_RANGLISTE_GEWICHTE`). Kein Modell. Keine Provision. Kein Providername. Fehlende Signale bleiben `null` und verdünnen vorhandene Evidenz nicht mit einem fiktiven Neutralwert 0,5. Labels: Jetnity empfiehlt, Best Value, beste Bewertung, flexibel, kurz und gut integrierbar – nur mit Evidenz.

**Kontext:** Dieselbe korrigierte Hotel-Logik (ADR-0071) gilt für Aktivitäten. Ein LLM-Ranking wäre weder reproduzierbar noch in der CI prüfbar. Ein Neutralwert 0,5 würde echte Interessen- oder Zeitsignale überdecken.

**Alternativen:**

1. *Billigste Aktivität zuerst.* Widerspricht dem Produktprinzip.
2. *Unbekannte Dimensionen mit 0,5 füllen.* Scheingenauigkeit.
3. *Modell begründet die Rangfolge.* Teuer, nicht deterministisch.

**Begründung:** Vertrauen entsteht, wenn dieselbe Reise und derselbe Tag dieselbe Reihenfolge liefern. Unbekannt ist eine Aussage.

**Konsequenzen:** Gewichte stehen im Code und sind getestet. Tests belegen, dass Providername und Provision die Rangfolge nicht ändern.

---

## ADR-0080 – Tageskontext nur aus vorhandenen Reisedaten

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3

**Entscheidung:** Der Aktivitätskontext liest Etappe, Koordinaten, Reisetag, vorhandene Punkte, Interessen, Tempo, Budget und Teilnehmer. Fehlende Öffnungszeiten, Wegezeiten und minutengenaue Lücken bleiben unbekannt. Lage-Fit entsteht nur bei Koordinaten und ist Luftlinie, keine Wegezeit.

**Kontext:** Ein Ranking ohne echte Uhrzeiten oder Wege wirkt präzise und ist es nicht. Zwei Aktivitäten in derselben Stadt sind nicht automatisch nah.

**Alternativen:**

1. *Öffnungszeiten und Gehminuten schätzen.* Scheingenauigkeit.
2. *Sofort einen Routing- oder POI-Provider kaufen.* Laufende Kosten ohne Freigabe.

**Begründung:** Unbekannt ist eine Aussage. Eine erfundene Minute ist ein Defekt.

**Konsequenzen:** Ohne belastbare Daten zeigt die UI den belegbaren Tageskontext und keine Fake-Karten. Ein späterer Routing- oder Öffnungszeiten-Weg ersetzt die Nullen, ändert aber nicht die Domäne.

---

## ADR-0081 – Zeitkonflikte nur bei vollständigen lokalen Tagesfenstern

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3

**Entscheidung:** Die Konfliktlogik beurteilt nur zwei vollständige lokale `HH:MM`-Fenster am selben Kalendertag. Fehlende Zeiten, mehrtägige Optionen und Fenster über Mitternacht sind `unbekannt`, nicht konfliktfrei. Zeitzonen werden nicht aus Koordinaten geraten.

**Kontext:** Aktivitäten sind stärker zeitgebunden als Hotels. Eine Lücke „frei“ ohne Uhrzeiten wäre eine unbelegte Aussage.

**Alternativen:**

1. *Fehlende Zeiten als konfliktfrei werten.* Würde Überschneidungen verschweigen.
2. *Zeitzone aus Stadt oder Koordinate ableiten.* Falsch und nicht belegt.
3. *Mehrtägige und Mitternachtsfenster jetzt vollständig modellieren.* Mehr Komplexität als die Foundation braucht.

**Begründung:** Die Foundation muss klar sagen, was sie sicher beurteilen kann. Der Rest bleibt ehrlich unbekannt.

**Konsequenzen:** Eindeutige Überschneidungen werden erkannt und im Ranking hinter konfliktfreien Optionen sortiert. `ACTIVITY_ZEIT_HINWEIS` dokumentiert die Grenze.

---

## ADR-0082 – Aktivitätensuche in Production aus, fehlender Provider ist unavailable

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3

**Entscheidung:** `VERCEL_ENV=production` schaltet die Aktivitätensuche hart aus. Development/Preview brauchen `JETNITY_ACTIVITY_AKTIV` plus einen späteren Provider. Fehlender Provider ist ein sauberer unavailable-Zustand, kein Buildfehler. Der Tageskontext darf aus der validierten Reiseanfrage trotzdem berechnet werden.

**Kontext:** Dieselbe Fail-closed-Linie wie Modellweg (ADR-0052), Flugsuche (ADR-0064) und Hotelsuche (ADR-0073). Phase 3.3 hat noch keinen Token-Vertrag.

**Alternativen:**

1. *Secrets im Setup-Check verlangen.* Würde jede Umgebung ohne Aktivitätenanbieter rot färben.
2. *Fake-Aktivitäten in der echten UI.* Widerspricht der Produktregel.

**Begründung:** Die Pipeline kann integrationsbereit sein, ohne Production oder Nutzer mit erfundenen Angeboten zu täuschen.

**Konsequenzen:** Keine `NEXT_PUBLIC_ACTIVITY_*`. Rate-Limit im Prozess. Timeout 12 s. `POST /api/activities/search` ist kein Provider-Proxy.

---

## ADR-0083 – Aktivitätsübernahme als `activity` auf dem bestehenden Schema

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3; keine neue Migration

**Entscheidung:** Eine ausgewählte Aktivität wird als `trip_items.kind = activity` gespeichert. Die Momentaufnahme nutzt Titel, Notiz, Termin, Preis, Provider und External-Ref. `booking_url` bleibt `null`. `day_id` und `stage_id` binden den Punkt an Tag und Etappe. Keine neue Production- oder Development-Migration.

**Kontext:** Die Spalten und `kind = activity` existieren seit Phase 1.5. Eine Extra-Tabelle für Timeslots wäre voreilig, solange kein Provider echte Angebote liefert.

**Alternativen:**

1. *Eigene `activity_bookings`-Tabelle jetzt.* Schema ohne Daten.
2. *Übernahme erst nach dem ersten Provider bauen.* Würde die Trip-Naht später erneut öffnen.
3. *JSON in `note` als verstecktes Schema.* Die Notiz bleibt Menschenlesart, kein Speicher für Felder.

**Begründung:** Dieselbe Persistenz wie Flug und Hotel. Modelloperationen dürfen kommerzielle Punkte nicht ändern (ADR-0059). Preisänderungen später beobachten, nicht still überschreiben.

**Konsequenzen:** Gast- und Kontoweg sind vorbereitet. Die UI zeigt den Übernehmen-Knopf nur bei echten Optionen. Kommerzielle `activity`-Punkte teilen `istKommerziell` mit Flug und Hotel.

---

## ADR-0084 – Konto-Aktivitätsübernahme nur über serverseitigen Nachweis am Suchkontext

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3; kein echter Provider

**Entscheidung:** Eine kommerzielle Aktivitätsübernahme im Konto speichert keine Browseroption. Der Client liefert nur identifiers (`tripId`, `stageId`, `dayId`, `optionId`). Preis, Provider, External-Ref und der Timeslot kommen aus einem serverseitigen `ActivityNachweis` plus dem per RLS geladenen Reisegraphen. Der Nachweis bestätigt die `optionId` nur zusammen mit Ziel, Datum, Teilnehmer, Währung und – falls die Option einen Timeslot trägt – dem bestätigten Timeslot. Solange kein Nachweis existiert, fällt die Übernahme fail closed. `ActivityProvider.suchen()` bleibt schmal; die Auswahlbestätigung ist eine eigene Naht.

**Kontext:** Dieselbe Vertrauensgrenze wie bei Hotels (ADR-0075, ADR-0076). Zod prüft Form, nicht Herkunft. Dieselbe Angebots-ID könnte zu einem anderen Tag oder Ziel gehören.

**Alternativen:**

1. *HMAC-Signatur der Suchergebnisse mit einem App-Secret.* Zweckentfremdet Secrets, koppelt Suche und Übernahme.
2. *Nachweis in `ActivityProvider.suchen()` einbauen.* Würde Search mit Booking/Affiliate vermischen.
3. *Client schickt Timeslot und Preis mit.* Untrusted input in der Vertrauensgrenze.

**Begründung:** Die Vertrauensgrenze muss stehen, bevor der erste Adapter kommt. Tests können einen Fake-Katalog injizieren. Search-Provider und Affiliate-Partner müssen nicht identisch sein. Gastreisen bleiben LocalStorage und gelten nicht als serverseitig verifiziert.

**Konsequenzen:** `activityNachweisAusUmgebung()` gibt heute `null` zurück. Der erste Provider oder ein Jetnity-eigener serverseitiger Nachweis implementiert `ActivityNachweis`. Keine Secret-Signatur. Modelloperationen schützen kommerzielle `activity`-Punkte weiter über `istKommerziell` (ADR-0059).

---

## ADR-0085 – Aktivitätensuche liest den Body nur bis zur Bytegrenze

**Datum:** 20. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3

**Entscheidung:** `POST /api/activities/search` prüft `Content-Length` vor jedem Lesen. Der Body wird anschliessend streamend mit einem harten Cap von 16 KB UTF-8 gelesen und abgebrochen, sobald das Limit überschritten ist. `Content-Length` allein ist kein Vertrauensbeweis.

**Kontext:** Dieselbe Härtung wie die Hotelsuche (ADR-0077). Ein übergrosser Request darf nicht vollständig im Speicher landen.

**Alternativen:**

1. *Nur Content-Length.* Fehlt oder lügt der Header, bleibt die Grenze wirkungslos.
2. *Globales Body-Limit-Middleware.* Unnötige Infrastruktur für einen Endpunkt.
3. *Zeichenanzahl statt Bytes.* Würde UTF-8-Multibyte unterschätzen.

**Begründung:** Die Anforderung war, kein praktisch unbegrenztes JSON einzulesen. Das geht nur vor der Allokation des ganzen Körpers.

**Konsequenzen:** 413 ohne vollständiges Buffering. Tests decken fehlendes, korrektes und irreführendes `Content-Length` sowie den Grenzfall exakt am Limit.

---

## ADR-0086 – Interne UI-Audit-Route in Production unabhängig vom Flag fail closed

**Datum:** 21. August 2026
**Status:** freigegeben, umgesetzt in Phase 3.3c

**Entscheidung:** `/ui-audit/activities` antwortet in `VERCEL_ENV=production` immer mit 404. `JETNITY_UI_AUDIT=1` oder `true` darf die Seite nur ausserhalb von Production aktivieren. Eine fehlende oder andere Flag-Wert bleibt 404. Eine unbekannte Umgebung gilt nicht als Production, braucht aber dasselbe explizite Flag.

**Kontext:** Phase 3.3b hat die Audit-Seite hinter `JETNITY_UI_AUDIT` gelegt. Ein versehentlich gesetztes Flag in Production hätte die interne Testfläche erreichbar gemacht.

**Alternativen:**

1. *Nur das Audit-Flag.* Reicht nicht, wenn Production das Flag erbt oder jemand es setzt.
2. *Audit-Seite ganz entfernen.* Würde die gemessene 3.3b-Abnahme unnötig zerstören.
3. *NODE_ENV=production ebenfalls sperren.* Würde `next start` lokal mit dem Audit-Harness vermischen; massgeblich ist Vercels Umgebung.

**Begründung:** Interne Auditflächen dürfen nicht von einer einzelnen Feature-Variable abhängen. Dieselbe Fail-closed-Linie wie Modellweg, Flug-, Hotel- und Aktivitätensuche.

**Konsequenzen:** Die Entscheidung liegt in `uiAuditSeiteAktiv`. Der Produktweg der Aktivitäten ändert sich nicht. `npm run audit:activities` bleibt lokal/Preview nutzbar, weil das Harness nicht `VERCEL_ENV=production` setzt.

---

## ADR-0087 – Mobile Trip Workspace: Bereiche statt langer Kartenfolge

**Datum:** 21. August 2026
**Status:** umgesetzt in Iteration 1, für die Mobile-Hauptnavigation ergänzt durch ADR-0088

**Entscheidung:** Unterhalb von 1024 px strukturiert `/reisen/[tripId]` die Reise nicht mehr als lange Kartenfolge, sondern in Client-Bereiche. Default ist die Übersicht. Nur der aktive Bereich ist sichtbar. Der gewählte Reisetag bleibt eine gemeinsame Wahrheit für Tagesplan und Aktivitäten. Desktop behält die bisherige breite Arbeitsansicht. Die sichtbaren Mobile-Hauptbereiche nach Iteration 2 stehen in ADR-0088.

**Kontext:** Die mobile Reiseansicht war fachlich vollständig, aber eine lange Folge großer Karten. Nach dem Scrollen verloren Nutzer die Orientierung. Der Auftrag ist eine gezielte UX-Iteration, kein Redesign der Startseite und keine Providerarbeit.

**Alternativen:**

1. *Anker-Navigation auf einer weiterhin langen Seite.* Würde das Scrollproblem nur abmildern.
2. *ARIA-Tabs mit URL-Query.* Korrekt, aber für Iteration 1 unnötig komplex; ein Reload würde Suchzustände und den Modellweg neu anstoßen.
3. *Eigenes Mobile-Workspace-Duplikat.* Würde Gast- und Konto-Ansicht sowie jede spätere Änderung verdoppeln.

**Begründung:** Orientierung vor Aktion löst das gemeldete Mobile-Problem, ohne Desktop, Persistenz oder Trust Boundaries zu verändern. Der aktive Bereich bleibt Client-State, weil Deep Links auf einen Tab in Iteration 1 keinen Produktnutzen haben. Kommerzielle Suchbereiche werden auf Mobile erst beim ersten Besuch eingehängt und bleiben danach gemountet, damit die Übersicht keine Hotel-/Aktivitätsanfrage startet und ein Tabwechsel keine Schleife auslöst.

**Konsequenzen:**

- Logik in `lib/trips/arbeitsbereich.ts`, Darstellung weiter in `TripWorkspace`.
- Keine Migration, keine neue API, keine Production-Aktivierung.
- `Reise ändern` ist auf Mobile eine kompakte Aktion in der Übersicht.
- Iteration 2 hat den separaten Mobile-Tab `Plan` aufgehoben; siehe ADR-0088.

---

## ADR-0088 – Mobile Übersicht enthält den Tagesplan

**Datum:** 21. August 2026
**Status:** umgesetzt in Iteration 2, Preview/Draft

**Entscheidung:** Auf Viewports unter 1024 px gehören Übersicht und Tagesplan zusammen. Die sichtbare Hauptnavigation enthält nur noch Übersicht, Flüge, Unterkunft und Aktivitäten. Der Tagesplan ist Teil von „Deine Reise auf einen Blick“, nicht ein eigener Hauptbereich. `plan` ist kein navigierbarer Client-Bereich mehr; ein historischer Wert fällt auf die Übersicht. Desktop ab 1024 px behält die bisherige breite Arbeitsansicht mit sichtbarem Tagesplan.

**Kontext:** Iteration 1 (ADR-0087) hat die lange Kartenfolge in Bereiche zerlegt. Auf einem echten iPhone wirkte `Plan` als eigener Haupt-Tab zu schwer und trennte den Tagesplan von der Orientierung. Die fachliche Planlogik war bereits vollständig; nötig war eine Informationsarchitektur-Änderung, keine zweite Plan-Implementierung.

**Alternativen:**

1. *Plan als Tab behalten und nur die Labels kürzen.* Würde `Aktivitäten` auf 390 px etwas entlasten, aber die Trennung von Dashboard und Tagesplan bleiben lassen.
2. *`plan` als versteckten Client-State weiterführen.* Würde Sonderfälle und Redirects erzeugen, ohne Produktnutzen.
3. *Desktop ebenfalls auf vier Bereiche umbauen.* Kein Auftrag; die breite Arbeitsansicht zeigt Plan und Suchen bereits gleichzeitig.

**Begründung:** „Deine Reise auf einen Blick“ ohne den Tagesplan ist unvollständig. Flüge, Unterkunft und Aktivitäten bleiben eigene Hauptbereiche, weil sie Suche und kommerzielle Zustände tragen. Der Planstatus ist Einleitung des eingebetteten Tagesplans, kein Sprungziel. Dieselbe `TripWorkspacePlan`-Quelle, dieselbe `aktiverTag`-Wahrheit, dieselben Persistenz- und Validierungswege.

**Konsequenzen:**

- `ARBEITSBEREICHE` in `lib/trips/arbeitsbereich.ts` enthält `plan` nicht mehr.
- `TripWorkspace` bettet den Tagesplan auf Mobile in die Übersicht ein; auf Desktop bleibt er Teil der breiten Ansicht.
- Keine Migration, keine neue API, keine URL-/Deep-Link-Änderung, keine Production-Aktivierung.
- Deep Link für den aktiven Bereich bleibt bewusst Client-State (ADR-0087).

---

## ADR-0089 – Persistenter Buchungsstatus ist nutzerbestätigt, nicht aus einem Planpunkt abgeleitet

**Datum:** 21. August 2026
**Status:** umgesetzt auf Draft-PR #29; Development-Migration angewendet am 21. August 2026; nicht auf Production angewendet

**Entscheidung:** Ein gespeicherter `trip_item` ist ausgewählt/geplant, nicht gebucht. `Gebucht` entsteht nur durch eine ausdrückliche Nutzerbestätigung. Dafür trägt `trip_items` drei provider-neutrale Spalten:

- `booking_status` `text not null default 'unconfirmed'` – `'unconfirmed' | 'booked'`
- `booking_source` `text` – `null | 'user'`
- `booking_confirmed_at` `timestamptz` – nur gesetzt, wenn gebucht

Offene Flugabschnitte und fehlende Nächte sind abgeleitete Lücken, keine gespeicherten Datensätze. Der Browser darf keine Quelle `provider` oder `verified` behaupten. `public.reise_aendern()` schreibt die drei Spalten nicht. Historische Zeilen bleiben `unconfirmed`.

**Kontext:** Der Trip Workspace zeigte Suche und Bestand nicht als zusammenhängendes Dashboard. Ohne persistente Bestätigung wäre jeder vorhandene Flug oder Stay stillschweigend „gebucht“ gewesen. Eine Provider-Buchungsbestätigung gibt es in dieser Phase nicht.

**Alternativen:**

1. *Nur UI-State / Local Storage.* Würde Konto-Reisen und Gast-Reisen spalten und den Status bei einem Gerätewechsel verlieren.
2. *`metadata`-JSON.* Verstösst gegen die Schema-Regel: Was UI und Fachlogik abfragen, ist eine Spalte.
3. *PostgreSQL-Enum.* Ein Enum lässt sich nicht kürzen; CHECKs entsprechen dem bestehenden Schema (ADR-0043).
4. *Quelle `provider` schon jetzt zulassen.* Der Client könnte eine vertrauenswürdige Bestätigung vortäuschen.

**Begründung:** Drei Spalten reichen für die heutige manuelle Bestätigung und lassen später eine serverseitige Provider-Quelle zu, ohne das Kernmodell zu wechseln. Die Quelle setzt nur der Server bzw. der Gastspeicher analog auf `user`. Coverage bleibt reine Domainlogik in `lib/trips/`, nicht im React-Rendering. Commercial Protection behandelt den Buchungsstatus wie Preis, Provider und Booking-URL.

**Konsequenzen:**

- Migration `20260821100000_trip_items_booking_status.sql` liegt im Repository. Development angewendet am 21. August 2026. **Nicht Production.**
- `public.reise_anlegen()` übernimmt einen gebuchten Status nur für `flight`/`stay` und setzt die Quelle immer auf `user`.
- Account-Aktion `planpunktBuchungsstatusSetzen` läuft über Anon-Key und RLS, ohne Service Role.
- Gast und Konto teilen dieselbe `TripItem`-Form.
- Natürliche Sprache darf den Status nicht erfinden, löschen oder still ändern.
- `types/supabase.ts` entspricht nach dem Development-Lauf dem live Schema (`db:typen --pruefen`).
- Handoff zu PR #29 hält fest, dass dieselbe Migration später nach ausdrücklicher Nutzerfreigabe auch auf Production angewendet wurde. Das Production-Playbook in `docs/PRODUCTION_ROLLOUT.md` erlaubt das nicht als Default und stoppt weiter bei `20260820130000`. Das ist ein dokumentierter Widerspruch, kein stilles Auflösen: spätere Migrationen – einschliesslich Foundation A – bleiben vom automatischen Production-Lauf ausgeschlossen.

---

## ADR-0090 – Mobilität bleibt `kind=transfer` mit wenigen Spalten

**Datum:** 21. August 2026
**Status:** umgesetzt auf Draft-PR #30; Development-Migration vorgesehen, nicht Production

**Entscheidung:** Bahn, Bus, Fähre und Transfer werden nicht als neue Top-Level-`trip_items.kind`-Werte fragmentiert. Der persistente Planpunkt bleibt `kind = 'transfer'`. Die fachliche Art und die Routingfakten liegen als optionale Spalten auf `trip_items`:

- `mobility_mode` `rail | bus | ferry | transfer`
- `origin_place_id`, `destination_place_id` (Text, max. 80, **ohne FK** auf `places`)
- `origin_name`, `destination_name`
- `connection_ref`
- `mobility_changes` (0–20; 0 = direkt; null = unbekannt)
- `mobility_evidence` (in dieser Foundation nur `user`)

Nicht-Transfer-Zeilen und historischer Transfer-Altbestand bleiben `null`. `booked` darf für `kind='transfer'` gesetzt werden, Quelle weiterhin nur `user`. `public.reise_aendern()` wird nicht ersetzt.

**Kontext:** Foundation A muss Mobilität im Reisegraphen vergleichbar machen, ohne vier Suchmaschinen oder eine speculative Enum-Explosion. `metadata` wäre für Abdeckung, Constraints und RLS die falsche Stelle. Eine 1:1-Tabelle verdoppelt Ownership und Join-Pfad, ohne heute mehr Semantik zu geben.

**Alternativen:**

1. *Neue `kind`-Werte `rail`/`bus`/`ferry`.* Zerteilt Buchung, Coverage, UI und Commercial Protection.
2. *Eigene `trip_mobility`-Tabelle 1:1.* Mehr RLS- und Übernahmefläche, ohne dass Foundation A sie braucht.
3. *Fakten in `trip_items.metadata`.* Verstösst gegen die Schema-Regel: was UI und Fachlogik abfragen, ist eine Spalte.
4. *FK auf `places`.* Eine Gastreise-Übernahme würde an fehlenden Ortszeilen scheitern.

**Begründung:** Ein Planpunkt, wenige optionale Spalten und vorhandene Zeitfelder reichen für manuelle Erfassung, Abdeckung und späteren Providerabgleich. Place-IDs bleiben Strings wie `geonames:2657896`. Die vorhandene, ungenutzte Spalte `time_zone` wird nicht in `TripItem` aufgenommen.

**Konsequenzen:**

- Migration `20260821120000_trip_items_mobility.sql` liegt im Repository. **Nur Development.** Nicht Production.
- `public.reise_anlegen()` schreibt die Felder und erlaubt gebuchte Transfers nur als `user`.
- Gast- und Konto-Übernahme tragen dieselben Felder.
- Natürliche Sprache darf Mobilitäts- und Buchungsfakten nicht erfinden.
- Keine neue RLS-Tabelle; vorhandene `trip_items`-Policies bleiben die Eigentumsgrenze.

---

## ADR-0091 – Konservative Mobilitätsabdeckung und fail-closed Suchnaht

**Datum:** 21. August 2026
**Status:** umgesetzt auf Draft-PR #30; kein Provider gewählt

**Entscheidung:** Die Foundation leitet Verbindungsbedarf als `Bewegungskante` aus Origin und Etappen ab. Fehlende oder mehrdeutige Graphdaten bleiben `unknown`, nicht fälschlich `open` oder abgedeckt. Ein eindeutiger Transfer mit passendem Start, Ziel und Datum ist `selected` oder `booked`. Ein gleichdatiger Flug ohne strukturierten Nachweis von Start **und** Ziel macht die Kante `unknown`, nicht `covered_by_flight`. Titel und Notiz eines Fluges dürfen nicht geparst werden. Mehrere Treffer oder Transfer plus gleichdatiger Flug bleiben unbestimmt. Ohne Transfer und ohne gleichdatigen Flug bleibt eine vollständige Kante `open`. Dauer in Minuten nur bei vollständigen lokalen Datums-/Zeitpaaren; keine Bewertung „knapp/genug“.

Korrektur 21. August 2026 (PR #30 Review-Fix): Die erste Fassung markierte einen eindeutigen Flug am Kantendatum als `covered_by_flight`. Das verletzte die Wahrheitsregel, weil das heutige Flug-`TripItem` die Route nicht strukturiert trägt. Foundation A verwendet `covered_by_flight` deshalb vorerst nicht. Truth > scheinbare Vollständigkeit.

Die Suchnaht folgt den bestehenden Foundations: `MobilityProvider.suchen()`, geschlossene Route `POST /api/mobility/search`, Production hart aus, Factory und Nachweis `null`. Kill Switch `JETNITY_MOBILITY_AKTIV` benennt keinen Anbieter und ist kein Secret. Ranking ist deterministisch und provisionsneutral.

**Kontext:** Jetnity soll später verstehen, wie Reisende zwischen Etappen kommen – ohne Fahrpläne, Wegezeiten oder Preise zu erfinden. Die Flugabdeckung bleibt eine eigene Domaindatei; Foundation A refaktoriert sie nicht.

**Alternativen:**

1. *Flugabdeckung in eine universelle Movement-Engine ziehen.* Hohes Regressionsrisiko ohne heutigen Gewinn.
2. *Fehlende Daten als offen behandeln.* Würde Lücken behaupten, die der Graph nicht kennt.
3. *Providername oder Env-Token schon jetzt festlegen.* Verstösst gegen die Foundation-Regel: kein Anbieter, keine Secrets.

**Begründung:** Konservative Kanten und eine geschlossene Naht lassen später einen echten Adapter zu, ohne Production oder Preview zu täuschen. Manuelle Eingaben bleiben sichtbar Nutzerangaben.

**Konsequenzen:**

- `lib/mobility/` ist frei von Provider-SDKs.
- `mobilityProviderAus()` und `mobilityNachweisAusUmgebung()` geben `null` zurück.
- Preview/Development ohne Provider bleiben unavailable, auch wenn `JETNITY_MOBILITY_AKTIV=true`.
- Keine Fake-Ergebnisse, keine manuelle Booking-URL, keine Browser-Providerbestätigung.
- `covered_by_flight` bleibt als Status reserviert, wird in Foundation A aber nicht abgeleitet.
- Nächster Schritt nach Review ist nicht automatisch ein Provider.

---

## ADR-0092 – Mietwagen als `trip_items.kind = rental_car`

**Datum:** 21. August 2026
**Status:** umgesetzt auf PR #31; Schema auf Development und Production; Suche aus

**Entscheidung:** Ein Mietwagen ist ein eigener persistenter Planpunkt `trip_items.kind = rental_car` mit wenigen optionalen Spalten. Abholung und Rückgabe nutzen die vorhandenen Ortsfelder. Zeitraum und Preis/Booking bleiben die vorhandenen Spalten. One-way wird aus Ortsfakten abgeleitet. Es gibt keine 1:1-Tabelle und kein `metadata`-JSON.

Neue Spalten:

- `rental_supplier` (Nutzerfakt, nicht Such-Provider, max. 120)
- `vehicle_class` (`economy | compact | intermediate | fullsize | suv | van | luxury`)
- `transmission` (`automatic | manual`)
- `rental_evidence` (in dieser Foundation nur `user`)

Transfer-Felder `mobility_mode`, `connection_ref`, `mobility_changes` und `mobility_evidence` bleiben transfer-only. Origin/Destination sind für `transfer` **oder** `rental_car` erlaubt. `booked` ist für `flight | stay | transfer | rental_car` zulässig, Quelle weiterhin nur `user`. `public.reise_aendern()` wird nicht ersetzt.

**Kontext:** Foundation B muss Mietwagen im selben Reisegraphen speichern wie Flug, Stay, Aktivität und Transfer, ohne einen Transfer zu fälschen und ohne Ownership/RLS/Gastreise-Übernahme zu verdoppeln. Ein Mietwagen überspannt Tage und Orte; er ist kein einzelner Transfer.

**Alternativen:**

1. *Mietwagen als `kind=transfer` mit einem Modus `rental`.* Würde Bewegungskanten, Booking-Constraints und UI-Wahrheit vermischen. Ein Auto ist keine nachgewiesene Verbindung.
2. *Eigene `trip_rental_cars`-Tabelle 1:1.* Mehr RLS-, Übernahme- und Join-Fläche, ohne dass Foundation B mehr Semantik braucht.
3. *Fakten in `trip_items.metadata`.* Verstösst gegen die Schema-Regel: was UI und Fachlogik abfragen, ist eine Spalte.

**Begründung:** Ein klarer `kind`, wenige optionale Spalten und vorhandene Zeit-/Ortsfelder reichen für manuelle Erfassung, Booking und späteren Providerabgleich. Place-IDs bleiben Strings. Fahreralter, Führerschein und Zahlungsdaten werden nicht persistiert.

**Konsequenzen:**

- Migration `20260821200000_trip_items_rental_car.sql` liegt im Repository und ist nach ausdrücklicher Freigabe auf Development **und** Production. Production-Suche bleibt aus. Nachweis: [docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md](docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md).
- `public.reise_anlegen()` schreibt die Felder und erlaubt gebuchte Mietwagen nur als `user`.
- Gast- und Konto-Übernahme tragen dieselben Felder.
- Natürliche Sprache darf Mietwagen- und Buchungsfakten nicht erfinden.
- Keine neue RLS-Tabelle; vorhandene `trip_items`-Policies bleiben die Eigentumsgrenze.
- Kein sechster Workspace-Tab. Mietwagen lebt im Bereich Mobilität.

---

## ADR-0093 – Mietwagen deckt keine Bewegungskante; Suche fail closed

**Datum:** 21. August 2026
**Status:** umgesetzt auf Draft-PR #31; kein Provider gewählt

**Entscheidung:** Ein vorhandener Mietwagen darf eine `Bewegungskante` nicht als `covered` markieren, auch wenn Zeitraum und Städte plausibel überlappen. Foundation A bleibt unverändert die Source of Truth für Verbindungsabdeckung. Ein Mietwagen ist ein verfügbarer Reisebaustein im Zeitraum, kein Routennachweis.

Die Suchnaht folgt den bestehenden Foundations: `RentalCarProvider.suchen()`, geschlossene Route `POST /api/rental-cars/search`, Production hart aus, Factory und Nachweis `null`. Kill Switch `JETNITY_RENTAL_CAR_AKTIV` benennt keinen Anbieter und ist kein Secret. Ranking ist deterministisch und provisionsneutral. Providername, Provision oder Umsatz sind niemals Rankingfaktor.

**Kontext:** `docs/LOGIC_STANDARD.md` verbietet, aus gleichem Datum oder ähnlichem Ort eine Verbindung zu erfinden. Ohne expliziten belastbaren Link zwischen Mietwagen und Kante wäre jede automatische Coverage eine Parallelwahrheit.

**Alternativen:**

1. *Überlappender Mietwagen macht die Kante `covered`.* Würde Transportabdeckung erfinden.
2. *Eigene Link-Tabelle Mietwagen↔Kante schon jetzt.* Kein heutiger Nutzerweg erzeugt diesen Link bewusst; das wäre Vorratsmodellierung.
3. *Providername oder Env-Token schon jetzt festlegen.* Verstösst gegen die Foundation-Regel: kein Anbieter, keine Secrets.

**Begründung:** Konservative Graphwahrheit und eine geschlossene Naht lassen später einen echten Adapter zu, ohne Preview oder Production zu täuschen. Manuelle Eingaben bleiben sichtbar Nutzerangaben.

**Konsequenzen:**

- `lib/rental-cars/` ist frei von Provider-SDKs.
- `rentalCarProviderAus()` und `rentalCarNachweisAusUmgebung()` geben `null` zurück.
- Preview/Development ohne Provider bleiben unavailable, auch wenn `JETNITY_RENTAL_CAR_AKTIV=true`.
- Production bleibt selbst bei gesetztem Kill Switch aus.
- Keine Fake-Ergebnisse, keine manuelle Booking-URL, keine Browser-Providerbestätigung.
- Nächster Schritt nach Review ist nicht automatisch ein Provider.

---

## ADR-0094 – Mietwagen-Wahrheit: keine erratene Suche, konservatives One-way, währungssicheres Ranking

**Datum:** 22. August 2026
**Status:** umgesetzt auf Draft-PR #31; kein Provider, keine Production-Änderung

**Entscheidung:** Foundation B darf Reisekontext nicht stillschweigend als Mietwagenfakt oder Suchabsicht verwenden.

1. `POST /api/rental-cars/search` startet nicht durch Mount oder Tab-Öffnen. Ohne ausdrückliche Nutzeraktion und sichtbare Kriterien bleibt die Oberfläche `unavailable`/`vorbereitet`.
2. Das manuelle Formular startet leer. Origin, Etappen und Reisedaten dürfen nur als unverbindlicher Platzhalter (`z. B. …`) erscheinen, nie als gespeicherter Ort, Datum, Place-ID oder `stageId`.
3. `rentalOneWay()` ist `one_way` nur bei zwei vorhandenen, unterschiedlichen Place-IDs. Gleiche IDs oder eindeutig gleiche normalisierte Namen sind `same_location`. Verschiedene Labels ohne zwei belastbare IDs bleiben `unknown`. Die UI zeigt `One-way` nur bei `one_way`.
4. `rentalKalendertage()` bleibt die inklusive Kalenderdauer des Mietzeitraums und wird als `Kalendertage Mietzeitraum` bezeichnet, nicht als Reisetage oder Abdeckung.
5. Ranking und `Best Value` vergleichen numerische Gesamtpreise nur in derselben Währung und nur wenn `preisIstGesamt === true`. Gemischte oder fehlende Währungen ergeben kein Preissignal und kein `Best Value`. Es gibt keine FX-Umrechnung.

**Kontext:** Der unabhängige Review von PR #31 fand vier Wahrheitsrisiken: automatisch erratene Suche, vorbelegte manuelle Fakten, textlich verschiedenes `one_way` und Cross-Currency-Ranking. Das widerspricht `docs/LOGIC_STANDARD.md`.

**Alternativen:**

1. *Suche mit Origin/letzter Etappe vorbereiten, aber nicht senden.* Würde dieselbe falsche Absicht in der UI zeigen.
2. *Fuzzy-Ortsabgleich für One-way.* Keine stabile Identität, würde Orte erraten.
3. *Implizite Wechselkursannahme 1:1.* Würde Preise erfinden.

**Begründung:** Unbekannt bleibt unbekannt. Die Foundation bleibt provider-ready, ohne später die Such- und Rankinglogik wegen erfundener Defaults umbauen zu müssen.

**Konsequenzen:**

- `MietwagenBereich` ruft die Search-Route nicht mehr beim Öffnen auf.
- `rentalManuellStartwerte()` ist leer; `rentalManuellHinweise()` ist nur Placeholder.
- Workspace-Audit verlangt 0 Rental-Requests nach Mobilität → Mietwagen.
- Keine Datenbank-, RLS- oder Production-Änderung.

---

## ADR-0095 – Mietwagen-Ranking-Labels nur bei belastbarem Vergleich

**Datum:** 22. August 2026
**Status:** umgesetzt auf Draft-PR #31; kein Provider, keine Production-Änderung

**Entscheidung:** Ranking-Labels und Reasons dürfen keine Empfehlung, Eigenschaft oder Passung behaupten, die der Nachweis nicht trägt.

1. `Best Value` nur, wenn mindestens zwei bestätigte Gesamtpreise in derselben Währung vergleichbar sind. Ein einzelner Gesamtpreis, gemischte Währungen oder fehlende Gesamtpreisflagge ergeben kein `Best Value`. Mehrere echte Gleichgewinner des günstigsten Preises dürfen das Label teilen.
2. `Jetnity empfiehlt` nur bei genau einem Kandidaten mit dem höchsten Score, und nur wenn dieser Score > 0 ist. Score 0 oder ein Gleichstand, den nur die ID-Sortierung bricht, ist keine Empfehlung. Die Sortierung bleibt deterministisch.
3. `Flexibel` nur bei `context.flexibilitaetFit > 0`. Freier `storno`-Text, einschliesslich „nicht stornierbar“, erzeugt das Label nicht. „Stornoregel bekannt“ bleibt eine neutrale Fakt-Aussage.
4. „Passende Fahrzeugklasse“ und „Gewünschtes Getriebe“ nur bei positivem `fahrzeugFit` / `getriebeFit`. Eine vorhandene Klasse oder ein vorhandenes Getriebe ohne Match wird höchstens faktisch benannt.

**Kontext:** Der Abschlussreview von PR #31 fand vier Ranking-Wahrheitsfehler: Best Value ohne Vergleich, Empfehlung durch Tie-Break, Flexibel aus beliebigem Storno-Text und Passung aus bloßer Feldexistenz.

**Alternativen:**

1. *Best Value schon bei einem Preis.* Kein Vergleich, irreführende Superlative.
2. *Immer den ersten Sortiereintrag empfehlen.* Technische Stabilität als fachliche Empfehlung.
3. *Jedes nicht-leere `storno` als flexibel werten.* Würde „nicht stornierbar“ falsch markieren.

**Begründung:** Unbekannt bleibt unbekannt. Labels sind Aussagen gegenüber dem Nutzer, keine Sortierhilfen.

**Konsequenzen:**

- Keine Datenbank-, RLS- oder Production-Änderung.
- `flexible` bleibt als Marke reserviert, wird in Foundation B ohne strukturierten Fit nicht vergeben.
- Real-Device-iPhone-Test ist am 22. August 2026 abgenommen. Nächster Schritt ist nicht automatisch ein Provider und nicht automatisch Ready/Merge.

---

## ADR-0096 – Readiness als eigene Domäne statt `trip_items`

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32; Development-Migration; nicht Production

**Entscheidung:** Reisevorbereitung ist eine eigene persistente Domäne `trip_readiness_items`, nicht ein neuer `trip_items.kind`.

**Kontext:** Readiness ist kein Tagesplanpunkt und keine Buchung. Ein `kind` auf dem bestehenden Planpunkt würde Booking-, Preis- und Routing-Semantik mit Checklisten vermischen.

**Alternativen:**

1. *Neuer `trip_items.kind = readiness`.* Würde Coverage, Booking und den Tagesplan belasten.
2. *JSON in `trips.metadata`.* Verstösst gegen die Schema-Regel: abgefragte Fakten sind Spalten.
3. *Nur Client-State.* Keine Source of Truth, keine Guest→Account-Parität.

**Begründung:** Eine kleine normalisierte Tabelle mit composite FK auf `trips (id, user_id)` hält Ownership, RLS und Idempotenz klar. `reise_anlegen()` und `reise_aendern()` bleiben unverändert.

**Konsequenzen:**

- Guest und Account teilen `Trip.readinessItems`.
- Guest→Account läuft über eine separate Sync-Naht, nicht über eine ältere `reise_anlegen()`-Definition.
- Production bleibt ohne diese Tabelle, bis separat freigegeben.

---

## ADR-0097 – Official Requirement Truth und User Preparation Truth getrennt

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Persistiert wird nur User Evidence (`open` / `done` / `skipped`, Quelle `user`). Offizielle Visa-/Einreiseaussagen bleiben ohne Provider `unknown` und dürfen nicht aus einem Häkchen abgeleitet werden.

**Kontext:** Ein Häkchen „Einreise geprüft“ ist keine behördliche Bestätigung. Mehrere Reisende haben keine individuellen Nationalitätsprofile.

**Alternativen:**

1. *User done als official not_required.* Irreführende Sicherheit.
2. *Statische Country-Regeln im Repo.* Fake-Regeln, veralten still.
3. *Modell als Quelle.* Verboten durch Logic Standard und diese Foundation.

**Begründung:** Unbekannt bleibt unbekannt. Foundation C bereitet die Provider-Naht vor, täuscht sie aber nicht vor.

**Konsequenzen:**

- Kein globales „Reisebereit“.
- UI trennt „Von dir erledigt“ und „Noch nicht offiziell geprüft“.
- `POST /api/readiness/requirements` fail closed.

---

## ADR-0098 – Deterministischer Context-Fingerprint

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Jeder persistierte Check trägt einen serverseitig berechneten `context_fingerprint`. Passt er nicht mehr zu den aktuellen Trip-Fakten, gilt der Check als `stale` oder `not_applicable`.

**Kontext:** Ein Bangkok-Einreisecheck darf nach einem Zielwechsel nach Tokyo nicht grün bleiben. Ein Bestätigungscheck darf nach Entfernen oder `unconfirmed` des Planpunkts nicht weiter als Abdeckung zählen.

**Alternativen:**

1. *Checks bei jeder Reiseänderung löschen.* Verliert User Evidence und die Aufforderung „erneut prüfen“.
2. *Browser setzt den Fingerprint.* Account-seitig untrusted.
3. *Nur `trips.revision` vergleichen.* Zu grob: irrelevante Änderungen würden alle Checks invalidieren.

**Begründung:** Die Felder je Art sind in `docs/TRAVEL_READINESS.md` und `lib/readiness/fingerprint.ts` festgelegt. Der Server berechnet sie aus der geladenen Reise.

**Konsequenzen:**

- Guest berechnet lokal aus dem Gastgraphen, Account nur serverseitig.
- `reise_aendern()` schreibt Readiness nicht; der Fingerprint macht alte Checks sichtbar ungültig.

---

## ADR-0099 – Kein sensibler Dokumententresor

**Datum:** 22. August 2026  
**Status:** verbindlich für Foundation C

**Entscheidung:** Foundation C speichert keine Pass-, ID-, Visa-, Gesundheits-, Geburts- oder Zahlungsdaten und öffnet keinen Storage-Bucket. Kein Upload, keine OCR, keine Encryption-Side-Quest.

**Kontext:** Ein späterer echter Vault braucht eine eigene Security-/Encryption-ADR und ausdrückliche Freigabe.

**Alternativen:**

1. *Jetzt einen Tresor „klein“ mitbauen.* Sicherheits- und Compliance-Risiko ohne Produktnutzen.
2. *Freitext für Passnummern erlauben.* Würde sensible Daten in Reisezeilen legen.

**Begründung:** Datenminimierung. Custom-Titel sind längenbegrenzt, ohne HTML/URLs, und weisen sensible Muster zurück.

**Konsequenzen:**

- Custom-UI trägt den Hinweis, keine sensiblen Daten einzutragen.
- Datenbank-CHECK lehnt sechs- und mehrstellige Ziffernfolgen im Titel ab.

---

## ADR-0100 – Reisevorbereitung in der Übersicht, kein sechster Tab

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Die fünf Hauptbereiche bleiben `Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`. Foundation C liegt als Bereich „Reisevorbereitung“ in der Übersicht.

**Kontext:** Ein sechster Tab würde die gerade stabilisierte Mobile-Navigation wieder öffnen, bevor die Gesamt-Informationsarchitektur bewertet ist.

**Alternativen:**

1. *Sechster Top-Level-Tab.* Frühe IA-Entscheidung ohne Abnahme.
2. *Eigene Seite ausserhalb des Workspace.* Würde Readiness vom Reisegraphen trennen.

**Begründung:** Der Nutzer soll das Gesamtbild in der Übersicht sehen. Ein späterer UX-Pass darf die IA neu bewerten.

**Konsequenzen:**

- Workspace-Audit prüft weiter genau fünf Bereichsziele.
- Auf Desktop ohne Übersicht-Tab erscheint dieselbe Karte nach dem Reisekopf, nicht als sechster Bereich.
- Foundation D darf die Zusammenfassung erweitern, nicht diese Grenze still aufheben.

---

## ADR-0101 – Automatic Travel Requirements statt reiner Checkliste

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Foundation C ist die Grundlage für automatische Travel Requirements, nicht nur eine manuelle Checkliste.

**Kontext:** Der ursprüngliche Auftrag konnte so gelesen werden, als müssten Nutzer Visa- und Einreiseregeln selbst recherchieren. Der verbindliche Nachtrag verlangt eine Engine.

**Alternativen:**

1. *Nur Nutzer-Häkchen.* Würde den Nachtrag ignorieren.
2. *Statische Visa-Matrix.* Fake-Regeln.

**Begründung:** Jetnity soll Suchaufwand abnehmen, ohne unbekannte Regeln zu erfinden.

**Konsequenzen:** Ohne Provider bleibt Official Truth `unknown`. Die UI sagt das ausdrücklich.

---

## ADR-0102 – Reisendenkontext trip-spezifisch

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32; Development-Migration `20260822020000`

**Entscheidung:** Traveller-Fakten liegen an der Reise (`trip_travellers` / `Trip.party`), nicht accountweit.

**Kontext:** Guest-Parität, keine Cross-Trip-Leaks, Datenminimierung.

**Alternativen:**

1. *Accountweite Traveller-Profile.* Später möglich, braucht eigene Consent-/Security-ADR.
2. *Nur `trips.travellers` als Zahl.* Reicht nicht für individuelle Requirements.

**Begründung:** Dieselbe Form für Gast und Konto. Keine stillen Verknüpfungen zwischen Reisen.

**Konsequenzen:** Bekannte Fakten gelten nur in dieser Reise. Übernahme kopiert sie idempotent.

---

## ADR-0103 – Provider-neutrale Requirements-Engine

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Eine injizierbare Engine-Naht normalisiert Provider-Output. Production-Factory ist `null`.

**Kontext:** Später Timatic oder gleichwertig, ohne Architekturbindung.

**Alternativen:**

1. *Timatic-Typen im Kern.* Würde den ersten Anbieter festnageln.
2. *Fake-Adapter mit erfundenen Regeln.* Verboten.

**Begründung:** Komplexität muss verdient werden. Tests dürfen einen Double injizieren.

---

## ADR-0104 – Health-Requirement ist keine Gesundheitsakte

**Datum:** 22. August 2026  
**Status:** verbindlich für Foundation C

**Entscheidung:** Offizielle Impf-/Health-Slots dürfen existieren. Persönliche Diagnosen, Impfpass-Uploads und Gesundheitsdaten werden nicht gespeichert.

**Kontext:** Der Nachtrag verlangt Health-/Vaccination-Requirements, verbietet aber unnötige Gesundheitsdaten.

**Begründung:** Pflicht, Empfehlung und allgemeiner Hinweis sind verschiedene Aussagen. Ohne Provider bleiben alle `unknown`.

---

## ADR-0105 – Freshness zusätzlich zum Context-Fingerprint

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Official Evaluations tragen Freshness (`never_checked`, `current`, `recheck_needed`, `stale`, `provider_unavailable`, `source_temporarily_unavailable`) neben dem User-Fingerprint.

**Begründung:** Eine alte Provider-Antwort darf nach Ablauf oder Kontextwechsel nicht als aktuell gelten. Ohne Provider ist Freshness immer `provider_unavailable`.

---

## ADR-0106 – Timatic als bevorzugter Kandidat ohne Bindung

**Datum:** 22. August 2026  
**Status:** dokumentiert, nicht integriert

**Entscheidung:** IATA Timatic / Timatic AutoCheck ist der bevorzugte spätere Kandidat. Die Domain bleibt provider-neutral. Kein Vertrag, kein Secret, kein Fake-Adapter in diesem PR.

---

## ADR-0107 – Official Evidence muss vollständig vertrauenswürdig sein

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32; Trust-Felder präzisiert in ADR-0110

**Entscheidung:** Ein Provider-Resultat darf nur dann `required`, `not_required` oder `conditional` werden, wenn die Official Evidence provider-neutral vertrauenswürdig ist und Freshness `current` ist. Fehlt die Trust-Grenze, gilt fail closed: `result = unknown`.

**Kontext:** Human Review von PR #32. Ein Test- oder späterer Echtprovider darf keine regulatorische Aussage ohne belastbare Evidence erzeugen.

**Alternativen:**

1. *Nur Resultat übernehmen, Evidence später ergänzen.* Würde Scheinsicherheit erzeugen.
2. *Teilweise Evidence akzeptieren.* Würde `unknown` und `required` vermischen.

**Begründung:** Official Requirement Truth braucht eine klare Trust-Grenze. Unvollständige Evidence ist keine Aussage.

**Konsequenzen:** `officialEvidenceVertrauenswuerdig()` bleibt die gemeinsame Schwelle. Die genaue Feldliste (Authority und/oder Rule Reference, optionale Source URL, Gültigkeitszeit) steht in ADR-0110. Temporär nicht erreichbare Quellen bleiben `unknown` mit Freshness `source_temporarily_unavailable`.

---

## ADR-0108 – Origin- und Transit-Ländercodes sind eine dokumentierte Route-Abhängigkeit

**Datum:** 22. August 2026  
**Status:** Naht gefüllt durch Foundation D auf Draft-PR #34; ohne Itinerary weiter leer

**Entscheidung:** `routeFactsAusReise()` ist die einzige Naht für Origin- und Transit-Ländercodes. Sie liest ausschließlich validierte Flight-Itineraries. Ortsnamen, Place-IDs und Etappentitel dürfen diese Codes nicht raten.

**Kontext:** Der Reisegraph speichert Abreise oft als Freitext (`origin: 'Zürich'`). Foundation C ließ die Naht bewusst leer. Foundation D füllt sie, sobald `trip_items.metadata.routeItinerary` eine gültige Struktur trägt.

**Alternativen:**

1. *Aus Stadt- oder Flughafennamen raten.* Verboten; würde `unknown` durch Vermutung ersetzen.
2. *Naht weglassen und nur dokumentieren.* Würde spätere Provideranbindung an verstreute Lesestellen binden.

**Begründung:** Eine explizite Naht verhindert stilles Raten. Die Fakten kommen jetzt aus derselben Route Truth wie Fluganzeige und Reiseänderung (ADR-0112).

**Konsequenzen:** Mit Itinerary liefert die Naht `quelle: 'flight_itinerary'` plus Origin-/Transit-Codes. Ohne Itinerary bleibt sie `{ quelle: 'none' }`. Official Transit-Requirements bleiben ohne Provider `unknown`. Die Foundation darf nicht so dokumentiert werden, als prüfe sie Visa/Transit bereits automatisch.

---

## ADR-0109 – Provider-Port ist async und fehlertolerant

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** `RequirementsProvider.evaluate` ist asynchron. Die Engine trennt reine Normalisierung (`requirementsAusZeilen`) von der Orchestrierung (`requirementsAuswerten`). Ein Throw, Timeout oder eine temporäre Nichterreichbarkeit wird gefangen und bleibt fail closed. `requirementsProviderAus()` bleibt in Foundation C `null`. Browser oder LLM können keinen Provider injizieren.

**Kontext:** Final Architecture Review von PR #32. Ein echter Timatic- oder vergleichbarer Dienst ist ein Netzwerkaufruf. Ein synchroner Port hätte die Kernarchitektur bei der ersten Provider-Aktivierung erneut umbauen müssen. Ein ungefangener Throw hätte als HTTP 500 die API verlassen.

**Alternativen:**

1. *Port erst bei Provider-Aktivierung async machen.* Würde Foundation C und den ersten echten Adapter koppeln.
2. *Throw als 500 durchreichen.* Würde einen Infrastrukturfehler als Produktabsturz ausgeben.

**Begründung:** Die Foundation muss einen späteren Netzwerkprovider aufnehmen können, ohne Truth-Logik oder API-Vertrag umzubauen. Fehler bleiben ehrlich unbekannt.

**Konsequenzen:**
- Throw ohne `availability: 'unavailable'` → Freshness `source_temporarily_unavailable`
- Throw mit `availability: 'unavailable'` → Freshness `provider_unavailable`
- `requirementsLokalFuerReise()` bleibt synchron und providerlos für UI-Fallback
- `requirementsFuerReise()` / `requirementsEvaluationsPruefen()` sind async
- Die UI konsumiert optional gelieferte `OfficialEvaluation[]`; ohne Lieferung bleibt der lokale Fallback
- `evaluations[]` ist die einzige kanonische neue Official-Truth. Legacy-`official` / `officialRequirementsPruefen` / `officialAusEvaluations` bleiben Compatibility und immer `result: 'unknown'`

---

## ADR-0110 – Provider-neutrale Evidence- und Gültigkeitsgrenze

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Trust für ein offizielles Resultat verlangt:

1. valide Provider-Identität
2. valides, zeitlich plausibles `checkedAt` (Clock-Skew-Toleranz 5 Minuten)
3. Authority **und/oder** Provider-Rule-Reference
4. `sourceUrl` nur falls vorhanden: dann muss sie valide HTTPS sein; ungültige vorhandene URL macht Evidence untrusted
5. Official Action nur bei valider HTTPS-`sourceUrl`
6. `validFrom` / `validUntil`, falls vorhanden, als Datum oder ISO-DateTime
7. zukünftiges `validFrom` → nicht `current`
8. abgelaufenes `validUntil` → `recheck_needed`
9. ungültige Gültigkeitsfelder oder `checkedAt` jenseits der Skew-Toleranz → fail closed

Die Regel ist provider-neutral. Sie ist nicht Timatic-spezifisch.

**Kontext:** ADR-0107 verlangte zunächst zwingend eine Source URL. Der Automations-Auftrag definiert Source URL als „falls vorhanden“. Ein vertrauenswürdiger Provider kann eine Regel ohne klickbare Behörden-URL belegen. Gleichzeitig dürfen zukünftige oder ungültige Gültigkeitsfenster nicht als `current required` erscheinen.

**Alternativen:**

1. *Source URL weiter zwingend halten.* Würde belastbare Provider-Evidence ohne öffentliche URL blockieren.
2. *Gültigkeitsfelder ignorieren.* Würde abgelaufene oder noch nicht gültige Regeln als aktuell ausgeben.

**Begründung:** Official Action und Official Resultat sind verschiedene Dinge. Eine Action braucht eine sichere HTTPS-Quelle. Ein Resultat braucht belastbare Provider-Evidence und eine plausible Zeit. Die Trust-Grenze bleibt streng, aber nicht an eine einzelne URL gebunden.

**Konsequenzen:** `officialEvidenceVertrauenswuerdig()` akzeptiert Authority oder Rule Reference. `officialFrische()` berücksichtigt `validFrom`. Teilweise fehlende Transit-Providerzeilen erzeugen für jedes angefragte Transitland eine Evaluation; unangefragte Transitländer werden ignoriert. Untrusted Evidence darf Freshness nicht `current` lassen (ADR-0111).

---

## ADR-0111 – Untrusted Official Evidence darf nicht current sein

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Wenn Official Evidence für ein regulatorisches Resultat nicht vertrauenswürdig ist, darf Freshness niemals `current` bleiben. Untrusted Evidence wird auf `never_checked` gesetzt, ausser Freshness ist bereits ehrlich `stale`, `recheck_needed` oder `source_temporarily_unavailable`.

**Kontext:** Endreview von PR #32. `zeileUebernehmen()` setzte `result` korrekt auf `unknown`, liess aber `freshness` auf `current`, sobald ein syntaktisch vorhandenes `checkedAt` existierte. Zukunfts-`checkedAt` oder eine ungültige vorhandene Source URL konnten so „Offizielle Anforderungen wurden geprüft“ auslösen.

**Alternativen:**

1. *Freshness unabhängig von Trust lassen.* Würde UI-Copy und Official Truth trennen.
2. *Jede untrusted Zeile auf `provider_unavailable` setzen.* Würde abgelaufene oder temporär unerreichbare Quellen falsch umdeuten.

**Begründung:** Freshness ist Teil der Official Truth. Eine verworfene Evidence ist keine geprüfte Anforderung.

**Konsequenzen:** `freshnessNachTrust()` ist die gemeinsame Nachbehandlung. Zukunfts-`checkedAt` und ungültige vorhandene Source URL werden `never_checked`. Trusted Evidence ohne Source URL darf weiter `current` sein; Official Action bleibt dann leer.

---

## ADR-0112 – Route-Itinerary liegt in vorhandenem `trip_items.metadata`

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #34; keine Production-Migration

**Entscheidung:** Die strukturierte Flugroute ist ein First-Class-Feld `TripItem.routeItinerary`. Persistiert wird sie als validierte Hülle `{ routeItinerary: FlugRouteItinerary }` in der bestehenden Spalte `trip_items.metadata`. Keine neue Tabelle, keine neue Spalte. Die Hülle ist höchstens 8192 Zeichen und kein allgemeiner Jutesack.

**Kontext:** Die Suchdomäne kannte bereits `FlugOption`-Segmente, verwarf sie aber bei der Übernahme. Foundation D braucht eine persistierte Route Truth, darf Production aber nicht migrieren.

**Nachtrag, 22. August 2026:** Human-Review hat den stillen Nachlauf als Blocker gewertet. ADR-0113 lässt `reise_anlegen()` die validierte Itinerary in derselben Transaktion schreiben. Die Metadata-Hülle bleibt.

**Alternativen:**

1. *Neue Spalte oder Tabelle.* Semantisch klarer, aber Production-Migration und RPC-Änderung ohne Freigabe.
2. *Route jedes Mal aus Titeln rekonstruieren.* Verboten; Titel sind keine Trust Boundary.
3. *Itinerary nur im Browser halten.* Würde Guest→Account und Readiness-Fingerprints verlieren.

**Begründung:** Vorhandene Architektur wiederverwenden. Metadata ist bereits da, RLS bleibt Eigentümergrenze, `reise_aendern()` fasst Metadata nicht an. Länder löst der Server bei der Konto-Übernahme erneut aus `public.airports`.

**Konsequenzen:**

- Gast speichert `routeItinerary` im Local Storage
- Konto-Insert schreibt Metadata direkt
- `reise_anlegen()` schreibt die validierte Hülle atomar (ADR-0113)
- der TypeScript-Nachlauf ist fail-closed Recovery, kein stilles `ok`
- Route-Fingerprint enthält keine Item-IDs
- Readiness-Fingerprints ohne Route bleiben bitgleich

---

## ADR-0113 – Route-Itinerary entsteht atomar in `reise_anlegen()`

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #34; Migration nur Development; Production nicht anwenden

**Entscheidung:** `public.reise_anlegen()` persistiert eine validierte `route_itinerary` in derselben Transaktion nach `trip_items.metadata`. Ungültige oder übergrosse Nutzlasten werden zu `{}`. Der Anwendung-Nachlauf darf einen Route-Verlust nicht als erfolgreiche Übernahme ausgeben. Retry bleibt über `client_ref` idempotent.

**Kontext:** Der Human-/Architecture-Review zu PR #34 hat den stillen Nachlauf `flugRoutenInReiseSchreiben()` als DoD-Verstoss gegen Guest→Account-Parität bewertet (`docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`). Ein bloßes `throw` nach bereits angelegter Reise ohne Recovery reicht nicht.

**Alternativen:**

1. *Nur fail-closed Nachlauf, RPC unverändert.* Behebt das stille `ok`, bleibt aber zwei Schreibschritte.
2. *Neue Spalte `route_itinerary`.* Semantisch klarer, unnötige Production-Migration.
3. *Reise löschen und neu anlegen bei Fehler.* Verlöre IDs und zählte gegen die Missbrauchsschranke.

**Begründung:** Dieselbe Transaktion ist die bevorzugte Architektur. Der Nachlauf bleibt als Recovery, falls Production die RPC noch nicht kennt oder ein früherer Versuch die Route verloren hat. `on conflict do nothing` + dieselbe `client_ref` verhindert Dubletten.

**Konsequenzen:**

- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql`
- Helper `public.flug_route_itinerary_metadata(text, jsonb)` ist fail-closed
- `authenticated` behält EXECUTE; `anon` nicht
- Production-Schema unverändert, bis eine separate Freigabe die Migration erlaubt

---

## ADR-0114 – Account-Route-Länder kommen nur aus der Airport-Referenz

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #34; keine Schemaänderung

**Entscheidung:** Bevor `reiseAusNutzlastAnlegen()` eine `route_itinerary` an `reise_anlegen()` oder den Recovery-Nachlauf übergibt, werden alle Route-Punkte aus IATA plus einem Batch-Lookup gegen `public.airports` neu aufgebaut. Clientwerte für `countryCode`, `city` und `country` werden verworfen. Fehlt die Referenz, bleiben diese Felder `null`. Datum und Uhrzeit bleiben aus der strukturell geprüften Itinerary.

**Kontext:** Der zweite Human-/Truth-Review zu PR #34 hat die Guest→Account-Nutzlast als Trust-Boundary-Lücke bewertet (`docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`). Zod und `flug_route_itinerary_metadata()` prüfen nur Formate. Ein Browser könnte `ZRH` mit einem falschen Land persistieren; `routeFactsAusReise()` würde das als `flight_itinerary` an Readiness weitergeben.

**Alternativen:**

1. *Lookup in SQL je Segment.* Würde eine zweite Referenzwahrheit und N+1 in der RPC erzeugen.
2. *Gesamte Übernahme ablehnen, wenn ein Airport fehlt.* Strenger als die bestehende unknown-Regel und würde gültige IATA-Routen ohne Landzeile verlieren.
3. *Nur `gastreiseUebernehmen` kanonisieren.* Retry und spätere Browser-Pfade über `reiseAusNutzlastAnlegen()` blieben offen.

**Begründung:** Dieselbe Batch-Referenz wie die Flugsuche und die direkte Account-Flugübernahme. Ein zentraler Ort vor RPC und Recovery. Die SQL-Helferfunktion bleibt strukturelle letzte Schicht, nicht Country-Truth.

**Konsequenzen:**

- `lib/route/kanonisieren.ts` ist die reine Abbildung
- `reiseAusNutzlastAnlegen()` holt Referenzen einmal und übergibt nur die kanonisierte Nutzlast
- `flugInReiseUebernehmen` bleibt unverändert referenzbasiert
- keine Production-Migration, keine neue Spalte

**Nachtrag, 22. August 2026:** Round 3 stuft die direkte RPC-Umgehung nicht als Restrisiko ein. ADR-0115 macht `flug_route_itinerary_metadata()` zur letzten DB-Trust-Boundary. Die TypeScript-Kanonisierung bleibt Defense in Depth.

---

## ADR-0115 – letzte Route-Country-Truth liegt in der Datenbank

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #34; Migration nur Development; Production nicht anwenden

**Entscheidung:** `public.flug_route_itinerary_metadata()` verwirft eingehende `countryCode`-/`city`-/`country`-Werte und baut jeden Route-Punkt aus IATA plus `public.airports` neu. Keine eindeutige Airport-Zeile ergibt `null`. Die Funktion ist `STABLE` / `SECURITY INVOKER`, nicht mehr `IMMUTABLE`. TypeScript-Kanonisierung (ADR-0114) bleibt die frühere Schicht.

**Kontext:** Der dritte Human-/Security-/Truth-Review (`docs/CURSOR_PR34_HUMAN_REVIEW_ROUND3.md`) hat gezeigt, dass `authenticated` `reise_anlegen(jsonb)` direkt aufrufen und die TypeScript-Grenze umgehen kann. Eine regulatorisch folgenreiche Route Truth darf nicht vom freiwilligen Anwendungspfad abhängen.

**Alternativen:**

1. *Nur dokumentieren, den direkten RPC nicht zu nutzen.* Schliesst die Grenze nicht.
2. *EXECUTE auf `reise_anlegen` entziehen.* Würde den normalen Anwendungspfad zerstören.
3. *SECURITY DEFINER plus Service-Role.* Unnötig; `authenticated` darf `airports` bereits lesen.

**Begründung:** Dieselbe Tabelle, dieselbe unknown-Regel, dieselbe Transaktion. Ein Lookup je eindeutigem IATA-Code, nicht ein zweites Schattenmodell.

**Konsequenzen:**

- Development-Migration `20260822140000_flug_route_itinerary_airport_truth.sql`
- Helfer `public.flug_route_punkt_aus_iata(text)`
- `db:sicherheit` prüft direkten RPC mit manipuliertem `ZRH.countryCode = 'US'`
- Production-Schema unverändert, bis eine separate Freigabe die Migration erlaubt

**Nachtrag, 22. August 2026:** Direkte `trip_items`-INSERT/UPDATE umgingen die RPC-Grenze. ADR-0116 schützt jeden persistenten Schreibweg.

---

## ADR-0116 – Route-Metadata wird auf jedem `trip_items`-Schreibweg kanonisiert

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Draft-PR #34; Migration nur Development; Production nicht anwenden

**Entscheidung:** Ein `BEFORE INSERT OR UPDATE OF metadata, kind`-Trigger auf `public.trip_items` kanonisiert `metadata.routeItinerary` für `kind = 'flight'` über `flug_route_itinerary_metadata()`. Ungültige Routen werden entfernt. Andere Metadata-Schlüssel bleiben. Nicht-Flight-Zeilen bleiben unverändert.

**Kontext:** Round 4 (`docs/CURSOR_PR34_HUMAN_REVIEW_ROUND4.md`) hat bestätigt, dass `authenticated` eigene `trip_items` direkt schreiben darf. RLS schützt den Eigentümer, nicht die Route Truth.

**Alternativen:**

1. *INSERT/UPDATE auf `trip_items.metadata` entziehen.* Würde legitime Buchungs- und Mobility-Schreibwege brechen.
2. *Nur Anwendungscode härten.* Ein direkter SQL-Client umgeht das.
3. *Shadow-Tabelle für kanonische Routen.* Zweite Wahrheit, unnötige Komplexität.

**Begründung:** Dieselbe kanonische Funktion wie der RPC. Ein enger Trigger, keine neue Spalte. RLS bleibt Eigentümergrenze; der Guard schützt die Wahrheit.

**Konsequenzen:**

- Development-Migration `20260822150000_trip_items_route_itinerary_guard.sql`
- Funktion `public.trip_items_route_itinerary_schuetzen()` ohne EXECUTE für `authenticated`
- `db:sicherheit` prüft direkten INSERT/UPDATE mit manipulierten Ländern
- Production-Schema unverändert, bis eine separate Freigabe die Migration erlaubt

---

## ADR-0117 – Traveller Context ist 1:n, nicht 1:1

**Datum:** 22. August 2026  
**Status:** umgesetzt auf `feat/traveller-context-intelligence`; Migration nur Development

**Entscheidung:** Ein Reisender bleibt eine stabile Parent-Zeile in `trip_travellers`. Staatsbürgerschaften und Reisedokumente liegen in Child-Tabellen mit Composite-FKs `(traveller_id, trip_id, user_id)`.

**Kontext:** Foundation C speicherte ein Nationalitäts-/Dokumentbündel je Traveller. Das reicht nicht für Mehrfachstaatsbürgerschaft. Das Phase-1-Audit (`docs/FOUNDATION_E_ARCHITECTURE_AUDIT.md`) zeigte keinen besseren Weg als Parent/Child.

**Alternativen:**

1. *Mehrere Traveller-Zeilen je Person.* Zerstört Gruppenstatus und Guest→Account-Identität.
2. *JSON-Array auf `trip_travellers`.* Keine FK-/Limit-Invarianten, schlechte RLS-Prüfbarkeit.
3. *Globales Nutzerprofil statt trip-spezifisch.* Würde Residence/Dokumente über Reisen vermischen und mehr PII anziehen.

**Begründung:** Composite-FKs verhindern Cross-Trip- und Cross-User-Referenzen. Limits (8 Citizenships, 12 Documents) begrenzen Abuse. ISO-2 only, keine freien Labels.

**Konsequenzen:**

- neue Tabellen `trip_traveller_citizenships` und `trip_traveller_documents`
- optionales `trip_readiness_items.traveller_id`
- App-Domäne `TripTraveller.citizenships[]` / `documents[]`
- Hotels/Flüge/Mobilität bleiben kopfzahlbasiert

---

## ADR-0118 – Expand/Contract ohne Drop der Legacy-Spalten

**Datum:** 22. August 2026  
**Status:** umgesetzt; Production nicht anwenden

**Entscheidung:** Foundation-C-Spalten bleiben. Neue Leser/Schreiber nutzen Child-Tabellen. Neue Writes setzen Legacy-Credential-Spalten nicht mehr.

**Kontext:** Production enthält echte Foundation-C-Zeilen. Ein Drop im selben Block wäre Datenverlust- oder Dual-Truth-Risiko.

**Alternativen:**

1. *Sofort droppen.* Bricht alte Leser und verhindert Rollback.
2. *Parallel beide Quellen schreiben.* Erzeugt widersprüchliche Wahrheit.
3. *Nur Application-Layer-Migration ohne DB-Children.* Keine Invarianten.

**Begründung:** Backfill ist deterministisch (`citizenship:<ISO>`, `document:<type>:<iso|xx>`). Legacy bleibt Lesefallback, wenn Children leer sind.

**Konsequenzen:**

- Migration `20260822160000_traveller_context_intelligence.sql`
- späterer Contract-Cleanup ist ein eigener Block nach Production-Backfill
- Guest-Legacy-JSON wird expandiert, nicht verworfen

---

## ADR-0119 – Party-Schreiben ist atomar und SECURITY INVOKER

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Development

**Entscheidung:** Account-Writes für Traveller + Citizenships + Documents laufen über `public.party_schreiben(jsonb)` in einer Transaktion. `SECURITY INVOKER`, `search_path = public, pg_temp`.

**Kontext:** Guest→Account war drei sequentielle Schritte. Mehr Child-Tabellen erhöhen das Teilfehler-Risiko.

**Alternativen:**

1. *Mehrere Client-Upserts.* Kann Citizenships ohne Parent oder Documents ohne Citizenship hinterlassen.
2. *SECURITY DEFINER.* Unnötige Rechteausweitung.
3. *Service Role aus der Server Action.* Umgeht RLS.

**Begründung:** INVOKER behält Owner-Isolation. Die Funktion löscht Children des Travellers und schreibt die neue Menge neu. Fremde Citizenship-Refs werden abgewiesen.

**Konsequenzen:**

- `authenticated` hat EXECUTE, `anon`/`public` nicht
- neue Writes gehen nicht mehr direkt auf die Child-Tabellen aus der App
- Readiness-Übernahme bleibt ein nachgelagerter Schritt

**Nachtrag, 28. August 2026 – C1.** Parent-Delete ist nicht Teil von `party_schreiben`. Der kanonische Delete-Pfad ist `party_loeschen` (ADR-0181). `party_schreiben` bleibt der atomare Setz-/Replace-Pfad.

---

## ADR-0120 – Credential-Optionen ohne erfundene regulatorische Wahrheit

**Datum:** 22. August 2026  
**Status:** umgesetzt; kein echter Provider

**Entscheidung:** Die Engine bewertet vorhandene Credential-Optionen getrennt. Eine Option entsteht nur aus vorhandenen Dokumenten oder als dokumentlose Option. Vergleich ohne Official Evidence ergibt `Noch nicht zuverlässig vergleichbar.`

**Kontext:** Mehrere Pässe dürfen später verglichen werden, aber Foundation E hat keinen Timatic- oder anderen Adapter.

**Alternativen:**

1. *Erste Staatsbürgerschaft als universelle Wahrheit.* Verstößt gegen die Traveller-Context-Policy.
2. *LLM-Vergleich.* Keine regulatorische Quelle.
3. *Hardcodierte Visa-Matrix.* Erfundene Truth, Wartungsfalle.

**Begründung:** Provider-Port trägt `credentialOptions[]`. Factory bleibt `null`. UI darf Angaben erfassen, aber keinen „besseren Pass“ behaupten.

**Konsequenzen:**

- Fingerprint v2 enthält sortierte Citizenship-/Document-Mengen
- `unknown` bleibt `unknown`
- späterer Provider kann Optionen anschließen, ohne das Modell neu zu bauen

**Nachtrag, 22. August 2026:** Unabhängiges Review von PR #35 (Blocker 2 und 3). Das Ausstellerland eines Dokuments ist keine Staatsbürgerschaft. `relatedCitizenshipCountryCode` bleibt `null` ohne gespeicherte Relation. `officialClass=requirement` + `result=required` ist keine option-level Pflicht; ohne `optionMandate` / `optionEligibility` bleibt der Vergleich fail-closed.

---

## ADR-0121 – Composite-FK-Delete und Parent-Lock für Traveller-Children

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Development; Production nicht anwenden

**Entscheidung:**

- `trip_traveller_documents_citizenship_fk` nutzt `ON DELETE SET NULL (citizenship_id)`.
- `trip_readiness_items_traveller_fk` nutzt `ON DELETE CASCADE`.
- `trip_traveller_kinder_limit_pruefen()` sperrt die Parent-`trip_travellers`-Zeile (`FOR UPDATE`), bevor es zählt.

**Kontext:** Unqualifiziertes `ON DELETE SET NULL` auf einem Composite-FK würde NOT-NULL-Spalten `trip_id`/`user_id`/`traveller_id` nullen und Delete-Pfade blockieren. AFTER INSERT + `count(*)` allein ist unter parallelen Direct-Writes ein klassisches MVCC-Fenster.

**Alternativen:**

1. *Readiness bei Traveller-Delete auf trip-level nullen (`SET NULL (traveller_id)`).* Würde traveller-spezifische Wahrheit still degradieren.
2. *Nur Application-Layer-Cleanup.* Unvollständig, weil `authenticated` direkte Tabellenrechte hat.
3. *Advisory Locks statt Parent-Row-Lock.* Mehr Mechanismus, dieselbe Serialisierung.

**Begründung:** SET NULL nur der optionalen Relation hält das Dokument. CASCADE hält Readiness am Reisenden. Parent-Lock serialisiert Child-Inserts desselben Travellers.

**Nachtrag, 28. August 2026 – C1.** `trip_traveller_kinder_limit_pruefen()` bleibt SECURITY INVOKER und sperrt weiter die Parent-Traveller-Zeile mit `FOR NO KEY UPDATE`. Der Trigger gilt jetzt für INSERT **und** UPDATE, damit Reparenting die Limits 8/12 nicht umgeht. Der Party-Cap 20 liegt in `trip_traveller_party_limit_pruefen()` und sperrt die Reise, nicht den Traveller (ADR-0181).

**Konsequenzen:**

- Forward-Migration `20260822170000_traveller_context_fk_delete.sql`
- `db:sicherheit` prüft Citizenship-Delete und Traveller-Delete
- Production bleibt unverändert

**Nachtrag, 22. August 2026:** Re-Review Blocker 1 und 3. Legacy-Backfill darf `citizenship_id` nicht aus gleichem Ausstellerland setzen. Parent-Lock ist `FOR NO KEY UPDATE`, damit parallele Child-Inserts nicht mit FK `KEY SHARE` deadlocken.

---

## ADR-0122 – Provider-Port trägt option-level Eligibility/Mandate

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Development; kein echter Provider

**Entscheidung:** `RequirementsProviderZeile` transportiert optional `optionEligibility` und `optionMandate`. Die Engine übernimmt sie nur, wenn dieselbe Trust-/Freshness-Grenze wie für Requirement-Resultate erfüllt ist. Unbekannte Werte werden fail-closed zu `unknown`. Vergleich entscheidet nur bei `status=current` und `freshness=current`.

**Kontext:** Der erste Vergleichsfix modellierte option-level Semantik nur auf `OfficialEvaluation`. Ein späterer Adapter hätte sie über den Port nicht liefern können.

**Alternativen:**

1. *Felder nur in Tests/OfficialEvaluation.* Nicht provider-ready.
2. *Option-Felder ohne Trust-Grenze übernehmen.* Untrusted Winner.
3. *Advisory Locks statt FOR NO KEY UPDATE.* Unnötig, sobald der Parent-Lock deadlockfrei ist.

**Begründung:** Dieselbe Naht muss später Timatic oder einen anderen Adapter anschließen können, ohne Truth zu erfinden.

**Konsequenzen:**

- Engine-Tests laufen `RequirementsProviderZeile → engine → OfficialEvaluation → vergleich`
- Factory bleibt `null`
- Production unverändert

---

## ADR-0123 – Kanonisch leer bleibt leer; Production-Reads expand-kompatibel

**Datum:** 22. August 2026  
**Status:** umgesetzt auf Development; Production-Schema unverändert

**Entscheidung:**

- Geladene Child-Relationen (`[]` eingeschlossen) sind autoritativ. Legacy-Singularfelder dürfen sie nicht wieder befüllen.
- Legacy-Fallback nur, wenn die Relation strukturell nicht geladen ist.
- `reiseLaden()` versucht zuerst den Foundation-E-Graph. Nur bei eindeutig fehlender Child-Relation (`PGRST200`/`PGRST205`/`42P01` plus Tabellenname) fällt der Read auf `trip_travellers(*)` zurück. Andere Fehler bleiben Fehler.
- Der Official-Fingerprint enthält die explizite `relatedCitizenshipCountryCode`.

**Kontext:** Final Review PR #35. `party_schreiben()` lässt Legacy-Spalten stehen. Ein leeres Child-Array plus Legacy-Fallback würde gelöschte Citizenships/Dokumente wiederauferstehen lassen. Production hat die Child-Tabellen vor der separaten Migration nicht.

**Alternativen:**

1. *Legacy immer als Fallback bei leeren Children.* Source-of-Truth-Fehler.
2. *Kanonischen Select ohne Fallback mergen.* Bricht Production-Reads bis zur Migration.
3. *Bei jedem DB-Fehler Legacy lesen.* Verdeckt echte Ausfälle.

**Begründung:** Expand/Contract verlangt Code-vor-Schema für Reads und fail-closed Writes. Gelöschte Nutzerwahrheit darf nicht aus deprecated Spalten zurückkehren.

**Konsequenzen:**

- Writes bleiben vor Production-Migration fail-closed; kein stilles Reduzieren auf Singularfelder.
- Nach der Production-Migration ist der kanonische Select die alleinige Account-Wahrheit.

---

## ADR-0124 – Stabile Dokumentidentität, fail-closed Traveller-Readiness und option-level Evidence

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Development; Production-Schema unverändert

**Entscheidung:**

- Bestehende Document-`clientRef` bleiben stabil. Neue Dokumente bekommen eine UUID-basierte Ref, nicht `document:{typ}:{issuer}`.
- `citizenshipClientRef` wird geladen, gespeichert und bei Citizenship-Löschung kontrolliert genullt. Issuer wird nie zur Citizenship.
- `travellerClientRef !== null` muss genau einen Traveller derselben Reise mit UUID auflösen. Sonst kein Write, auch nicht `traveller_id = null`.
- Credential-Vergleich bleibt fail-closed bei unvollständiger Gruppe, `mandatory + not_allowed` und widersprüchlichen current Provider-Zeilen.
- `travellerLegacyLesen()` expandiert Legacy nur, wenn `citizenships`/`documents` strukturell fehlen. Explizites `[]` bleibt leer.
- Die Requirements-API lehnt ungültige Party-Einträge ab; kein stilles Entfernen einer Person.

**Kontext:** Final Depth Review PR #35. Edit/Save zerstörte Document-Identität und Relationen. Unauflösbare Traveller-Refs wurden trip-level. Teil-Evidence konnte einen Winner erzeugen.

**Alternativen:**

1. *clientRef weiter aus Typ/Issuer bauen.* Kollision und Identitätsverlust.
2. *Unbekannte Traveller-Ref als trip-level schreiben.* Source-of-Truth-Fehler.
3. *Unvollständige Gruppen überspringen.* Winner aus Teil-Evidence.

**Begründung:** Provider-Readiness braucht stabile Option-Identität, echte Traveller-Zuordnung und nur vollständig belegte Vergleiche.

**Konsequenzen:**

- Guest→Account-Readiness mit nicht auflösbarer Traveller-Ref bricht ab.
- `origin/main` @ `c8dbe904` ist semantisch übernommen (globale Review-Tiefe plus Foundation-E-Addenda). Production-Schema bleibt unverändert.

---

## ADR-0125 – Konfliktierte Credential-Optionen bleiben sichtbar; Requirements-API strikt

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Development; Production-Schema unverändert

**Entscheidung:**

- Widersprüchliche current Provider-Zeilen derselben Option erzeugen eine sichtbare `unknown`/`recheck_needed`-Evaluation mit derselben `credentialOptionRef`. Die Option verschwindet nicht aus der Menge.
- Der Comparator darf aus einer Restmenge ohne die konfliktierte Option keinen Winner bilden.
- `travellerLegacyLesen()` bleibt der tolerante Guest-/Storage-Lesepfad.
- Die Requirements-API (`readinessAnforderungAnfrageSchema` und `anfrageAus`) nutzt `travellerAnfrageStriktLesen()`: vorhandene `citizenships`/`documents` müssen valide Arrays sein; jedes Child, Limits, Duplikate und erkennbare sensible Credential-Felder fail-closed. Echte Legacy-Form ohne Canonical-Properties bleibt expandierbar.

**Kontext:** Final Depth Re-Review PR #35. Bei drei Optionen konnte ein Provider-Konflikt durch Verschwinden der Option zu einem Winner aus B/C führen. Die API filterte malformed Children still.

**Alternativen:**

1. *Konfliktierte Option weiter streichen und nur bei zwei Optionen fail-closed sein.* Teil-Evidence-Winner.
2. *API weiter über `travellerLegacyLesen()` normalisieren.* Regulatorisch relevante Credentials verschwinden.
3. *Comparator bekommt eine parallele erwartete Optionsmenge.* Möglich, aber die sichtbare Konflikt-Evaluation ist die klarere Source of Truth.

**Begründung:** Fail-closed gilt für die gesamte angefragte Credential-Menge, nicht nur für die übrig gebliebenen vollständigen Zeilen.

**Konsequenzen:**

- Guest-/Formular-Parser bleiben tolerant.
- Production-Schema unverändert. Draft PR #35 bleibt Draft.

---

## ADR-0126 – Konfliktsignatur enthält officialClass; API-Legacy-Singularfelder sind strikt

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Development; Production-Schema unverändert

**Entscheidung:**

- `requirementsAusZeilen()` vergleicht doppelte Provider-Zeilen über eine zentrale `entscheidungsSignatur`: `result`, `status`, `freshness`, `optionEligibility`, `optionMandate` und `officialClass`. Abweichende Evidence-URLs allein sind kein semantischer Konflikt.
- Bei Konflikt bleibt die Option sichtbar als `unknown` / `recheck_needed` mit derselben `credentialOptionRef`. Der Comparator darf aus der Restmenge keinen Winner bilden.
- `travellerLegacyLesen()` bleibt der tolerante Guest-/Storage-Lesepfad.
- Die untrusted Requirements-API validiert vorhandene Legacy-Singularfelder (`nationalityCountryCode`, `residenceCountryCode`, `documentType`, `documentIssuingCountryCode`, `documentExpiresOn`) vor dem Legacy-Expand strikt. Malformed Werte oder falsche Runtime-Typen sind fail-closed und erreichen `RequirementsProvider.evaluate()` nicht. Valide Foundation-C-Legacy-Form bleibt kompatibel.

**Kontext:** Final Closure Review PR #35. `officialClass` entschied Reibungs-Ranking, fehlte aber in der Konflikterkennung. `documentAusLegacy()` übernahm untrusted `documentType` und Ablaufdaten ohne Enum-/Datumscheck.

**Alternativen:**

1. *officialClass weiter nur im Comparator nutzen.* Reihenfolgeabhängige Winner.
2. *Legacy-Singularfelder an der API weiter tolerant normalisieren.* Ungültige Credentials würden still fehlen oder als `foobar` weiterleben.
3. *`travellerLegacyLesen()` selbst härten.* Würde Guest-/Storage-Recovery brechen.

**Begründung:** Entscheidungsrelevante Semantik muss vollständig und reihenfolgeunabhängig konfliktieren. Untrusted API-Input darf nicht über den toleranten Storage-Reader in die regulatorische Engine gelangen.

**Konsequenzen:**

- Neue kleine Hilfe `lib/readiness/entscheidung.ts`, damit Comparator-relevante Felder nicht still auseinanderlaufen.
- Production-Schema unverändert. Draft PR #35 bleibt Draft.

---

## ADR-0127 – Travel Safety ist eine abgeleitete, provider-neutrale Domäne ohne Persistenz

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #37; Production-Schema unverändert

**Entscheidung:**

- Safety-/Disruption-Truth lebt in `lib/safety/` und wird compute-on-read erzeugt.
- `safetyProviderAus()` bleibt `null`. Tests dürfen einen Port injizieren.
- External Fact, Freshness, räumliche/zeitliche Relevanz, Trip-Impact und UI-Präsentationsklasse bleiben getrennte Ebenen.
- Es gibt keine Safety-Tabelle und keine Official-Evidence im Reisegraphen.
- `POST /api/safety/evaluate` akzeptiert nur validierten Trip-Kontext. Browser- oder LLM-Felder setzen keine Evidence.

**Kontext:** Nach Foundation D und E folgt die provider-neutrale Safety-Foundation. Official Readiness und Route Facts werden bereits abgeleitet, nicht materialisiert. Events veralten schnell; eine DB-Kopie ohne TTL/Revocation würde Schein-Aktualität erzeugen.

**Alternativen:**

1. *Safety-Facts in neuen Tabellen persistieren.* Lizenz-, Freshness- und Cross-User-Risiko ohne Live-Provider.
2. *Safety in Readiness mischen.* Vermischt Einreiseanforderungen mit Ereigniswarnungen.
3. *LLM erzeugt Warnungen aus Freitext.* Verboten durch die Safety-Policy.

**Begründung:** Dieselbe Trust-Grenze wie Official Readiness: ohne Provider keine Wahrheit, `unknown` bleibt sichtbar, keine Fake-Entwarnung.

**Konsequenzen:**

- Production unverändert.
- Workspace zeigt Safety nur bei übergebenen Evaluations, nicht als permanente leere Karte.
- Ein späterer echter Adapter braucht ein separates Product-Owner-Gate.

---

## ADR-0128 – Räumliche Relevanz darf keine feinere Präzision erfinden als die Quelle

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #37

**Entscheidung:**

- Country-Level Evidence erzeugt höchstens Country-Level-Relevanz.
- Eine regionale Quelle im selben Land, aber ausserhalb der belegten Reisezone, erzeugt keine pauschale Landeswarnung.
- Fehlen Orts- oder Koordinatenfakten für einen präzisen Abgleich, gilt `insufficient_context`.
- Ein betroffener Transit-Airport markiert Route/Flight, nicht pauschal das Reiseziel.
- `seasonal_pattern` wird verworfen und erzeugt keine Safety-Warnung.

**Kontext:** Die Policy verbietet Länder-Pauschalisierung und die Vermischung mit Seasonal Intelligence.

**Alternativen:**

1. *Jedes Event im Reiseland als Warnung.* Alarmmüdigkeit und falsche Betroffenheit.
2. *Titeltexte für Geo-Matching nutzen.* Untrusted Freitext.

**Begründung:** Warnen nur bei konkret belegtem Schnitt mit der Reise-Wahrheit.

**Konsequenzen:**

- Foundation-D Route Facts bleiben die einzige Transit-/Airport-Wahrheit.
- Seasonal Foundation bleibt der nächste getrennte Block.

---

## ADR-0129 – Safety-Freshness, Geo-Unknown und Order-Independence nach PR-37-Review

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #37 nach unabhängigem REQUEST CHANGES

**Entscheidung:**

- Event-Zeitfenster und Evidence-Freshness sind getrennte Achsen. `checkedAt` plus optionales `freshUntil` oder eine konservative Max-Age-Grenze (7 Tage) bestimmen Freshness. `validFrom`/`validUntil` gelten nur für zeitliche Relevanz.
- `not_affected` nur bei belegter Nicht-Betroffenheit. Admin-Region ohne kanonische Membership und Stadt ohne gemeinsame Place-ID bleiben `insufficient_context`.
- Decision-Signatur umfasst Traveller-Abhängigkeit. Evidence-URL allein ist kein Konflikt; bei identischer Signatur gewinnt deterministisch die vertrauenswürdigere Zeile.
- Mehr als `maxFacts` Rohzeilen werden als Integrity-Fehler verworfen, nicht positionsabhängig abgeschnitten.
- Explizit malformed `nature` wird verworfen, nicht zu `acute` umgedeutet.
- Provider-Aufrufe haben ein Abort/Timeout; Timeout und Throw erzeugen keine Warn-Truth.

**Kontext:** Unabhängiger Review `docs/PR37_CHATGPT_INDEPENDENT_REVIEW.md` gegen Head `caa6f7dd`.

**Alternativen:** Region-Membership-DB, first-row-wins, Route-`maxDuration` als einziges Timeout.

**Begründung:** Fail closed statt Scheingenauigkeit, Scheinaktualität oder Reihenfolge-Truth.

**Konsequenzen:**

- Keine neue Geo- oder Safety-Tabelle.
- Production unverändert, kein Live-Provider.

---

## ADR-0130 – Checked-empty, Transit-Unknown und Traveller-Fail-Closed nach PR-37-Re-Review

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #37 nach unabhängigem Re-Review REQUEST CHANGES

**Entscheidung:**

- Erfolgreicher Provider mit 0 validen akuten Facts ist `checked_empty`, nicht `unavailable`. Das ist keine Entwarnung.
- Vollständig malformed Zeilen sind unknown/fail-closed, nicht checked-clean.
- Vorhandene, aber ungültige Temporal-/Freshness-Felder verwerfen die Zeile.
- Feinere Geo-Scopes: berührt die Route das Land ohne belegbare Membership, gilt `insufficient_context`.
- Travellerabhängige Facts bewerten alle anwendbaren Slots fail-closed.
- Context-/Event-Fingerprints enthalten die tatsächlich entscheidungsrelevanten Party- und Eventfelder, ohne Dokumentnummern.

**Kontext:** `docs/PR37_CHATGPT_REREVIEW.md` gegen Head `31678cd8`.

**Begründung:** Leere Providerantworten, Transit ohne Feingeometrie und unvollständige Party dürfen weder Entwarnung noch Unavailable vortäuschen.

**Konsequenzen:** Production unverändert, kein Live-Provider, keine Safety-DB.

---

## ADR-0131 – Checked-clean, Teil-Zeitrelevanz und vollständige Decision-Signatur nach PR-37-Final-Closure

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #37 nach Final Closure Review REQUEST CHANGES

**Entscheidung:**

- Summary/API unterscheiden `checked_clean`, `unavailable`, `unknown` und aktuelle Warnungen. Nur checked-clean darf die Copy «keine aktuelle Warnung im geprüften Scope» erzeugen. Timeout/Throw sind nicht `status: ok`.
- Zeitliche Relevanz gilt für die räumlich betroffenen Refs (Stage-Daten, Route-Segmentdaten). Fehlen feinere Zeiten, gilt insufficient oder ein breiterer konservativer Fallback, niemals erfundene Entwarnung.
- Feinere Geo-Scopes: eine Stage im Land schliesst eine Route im selben Land nicht aus. Ohne belastbare Route-Membership bleibt `insufficient_context`.
- Decision-Signatur, Scope-Identität und Event-Fingerprint decken die evaluation-relevanten Felder ab, inklusive `freshUntil`, `countryCode`, `category`, `checkedAt`, Trust und Nature.
- Kalenderdaten werden strikt validiert. `validFrom > validUntil` und vorhandene malformed Boolean/Enums sind fail-closed.

**Kontext:** `docs/PR37_CHATGPT_FINAL_CLOSURE_REVIEW.md` gegen Head `7efd9d04`.

**Begründung:** Unknown darf keine Scheinsicherheit erzeugen. Betroffenheit folgt dem konkreten Reiseteil, nicht nur der Gesamtreise. Reihenfolge und still normalisierte Daten dürfen Safety-Truth nicht ändern.

**Konsequenzen:** Production unverändert, kein Live-Provider, keine Safety-DB. Nach diesem Pass gilt das Stop-Kriterium des Final Closure Reviews.

---

## ADR-0132 – Vollständigkeit, Date-only-Präzision und Routekontakt-Fenster nach PR-37-Stop-Criterion-Recheck

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #37 nach Stop-Criterion Recheck REQUEST CHANGES

**Entscheidung:**

- Eine teilweise malformed Providerantwort darf den Gesamtcheck nicht `checked_clean` machen. Gültige Warnungen bleiben sichtbar; `summary.complete=false` und API-Status `unknown` halten die Unvollständigkeit fest. Vollständig gültige `[]` und gültige nur-not-affected Antworten bleiben checked-clean.
- Date-only-Werte und Foundation-D-`HH:mm` bleiben zonenlos. Safety hängt kein `Z` und keinen Offset an. `date ↔ date` bleibt kalenderbasiert. `date ↔ instant` und `clock ↔ instant` nutzen dieselbe weltweite Offset-Hülle (UTC+14 bis UTC−12). Innerhalb der Hülle entsteht `insufficient_context`, keine Minuten-`affected`/`not_affected`-Wahrheit. UTC-Minutenwahrheit entsteht erst mit belastbarer Zone oder Offset.
- Routekontakte sind eine Menge echter Fenster: aufeinanderfolgende Ankunft+Abflug desselben Airports bilden ein Layover, sonst Punktkontakte. Kein Min/Max über wiederholte Airport-Codes.
- Country-Scope behält Stage-Refs **und** alle Route-Airports im Land. Feinere City/Place-Matches behalten unresolved Routekontakt, wenn ein späterer Landkontakt ohne feinere Membership zeitlich überlappt.

**Kontext:** `docs/PR37_CHATGPT_STOP_CRITERION_RECHECK.md` gegen Runtime `b20b3999` / Docs `57f34ecf`.

**Begründung:** Stille Verwerfung, Mitternachtskollaps und zusammengezogene oder verworfene Routekontakte erzeugen konkret falsche Entwarnung oder falsche Warnung.

**Konsequenzen:** Production unverändert, kein Live-Provider, keine Safety-DB. Der nächste unabhängige Check soll auf Closure/Pass zielen, sofern kein neuer konkreter Truth-/Security-/SoT-/Rollout-Defekt erscheint.

---

## ADR-0133 – Seasonal ist eine eigene Truth-Domäne neben Safety

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38

**Entscheidung:**

- Travel Timing & Seasonal Intelligence lebt in `lib/seasonal/` und besitzt eigene Evaluation-, Presentation- und Status-Typen.
- `SafetyEvaluation` und Safety-Präsentationsklassen (`critical_warning`, `do_not_travel`) werden nicht umetikettiert.
- `seasonal_pattern` bleibt in Safety verworfen. `active_warning` / `acute` wird in Seasonal verworfen.
- `seasonalProviderAus()` bleibt `null`. Tests dürfen einen Port injizieren.

**Kontext:** Policy und Ist-Audit verlangen eine Schwesterarchitektur, keine Vermischung akuter Warnungen mit historischen/saisonalen Mustern.

**Alternativen:** Seasonal in Safety-Nature weiterbauen; Seasonal nur als UI-Copy über Safety-Facts.

**Begründung:** Dieselbe Reise, zwei Wahrheiten. Vermischung erzeugt falsche Warnung oder falsche Entwarnung.

**Konsequenzen:** Zwei geschlossene APIs, zwei optionale Workspace-Nähte, getrennte Fingerprints.

---

## ADR-0134 – Seasonal bleibt compute-on-read ohne DB-Persistenz

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38; Production-Schema unverändert

**Entscheidung:**

- Keine Seasonal-Tabelle und keine Migration in diesem Block.
- Official Seasonal-Truth wird zur Laufzeit aus kanonischem Trip-Kontext plus Providerfacts berechnet.
- `Trotzdem so planen` wird nicht improvisiert persistiert.

**Kontext:** Safety hat denselben Weg gewählt. Saisonale Facts sind freshness-sensitiv und providergebunden.

**Alternativen:** eigene Tabelle; Local-Storage-Wahrheit; Account-only Persistenz.

**Begründung:** Ohne Live-Provider entstünde nur Scheinpersistenz. Guest/Account-Parität bleibt über denselben Trip-Graph.

**Konsequenzen:** Workspace zeigt Seasonal nur bei übergebenen Evaluations. Spätere Nutzerentscheidungen brauchen einen eigenen Decision-Flow.

---

## ADR-0135 – Recurring Windows sind inklusiv und jahressensitiv

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38

**Entscheidung:**

- `annual_recurring` ist Month/Day → Month/Day, Grenzen inklusiv.
- Start > Ende wrappt über den Jahreswechsel (`11-01` → `03-31`, `12-15` → `01-15`).
- Das Fenster wird auf jedes berührte Reisejahr projiziert. Naive `month in []`-Logik ist keine Wahrheit.
- `02-29` ist als Definition gültig und trifft nur echte Schalttage. `02-30` und andere ungültige Kalenderwerte fail-closed.
- `absolute` Fenster bleiben date-only oder Instant, ohne stilles Mischen.

**Begründung:** Monsun, Hurrikansaison und Winterfenster liegen oft über den Jahreswechsel. Leap-Day darf nicht still auf den 28. Februar umgedeutet werden, wenn die Quelle den 29. meint.

**Konsequenzen:** Tests decken Wrap, Leap-Day, Multi-Jahr und repeated destinations getrennt ab.

---

## ADR-0136 – Freshness, Reference Period und Travel Window bleiben getrennte Achsen

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38

**Entscheidung:**

- Travel Window bestimmt zeitliche Relevanz.
- Reference Period (z. B. Klimanormal 1991–2020) ist nur Metadatum der Datenbasis.
- Freshness braucht `checkedAt` plus explizites `freshUntil`. Ohne Freshness-Vertrag gibt es kein `current`.
- Der Safety-Default von 7 Tagen wird nicht auf Seasonal kopiert.
- `freshUntil` vor `checkedAt` oder zukünftiges `checkedAt` ist fail-closed.

**Begründung:** Eine Klimanormal darf nicht so gelesen werden, als müsse die Reise 1991–2020 liegen. Eine alte Climatology ohne Prüfvertrag darf keine clean/favorable Zusammenfassung erzeugen.

**Konsequenzen:** Stale/recheck bleibt sichtbar. Checked-empty sagt ausdrücklich, dass das keine optimale Reisezeit beweist.

---

## ADR-0137 – Seasonal übernimmt die fail-closed Geo-/Zeitzonenregeln von Safety, ohne deren Domain

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38

**Entscheidung:**

- Date-only bleibt zonenloser Kalendertag. Foundation-D-`HH:mm` bleibt Ortszeit ohne Zone. Kein stilles `Z`.
- Date/clock ↔ UTC-Instant innerhalb der weltweiten Offset-Hülle (UTC+14 bis UTC−12) bleibt `insufficient_context`.
- Feinere Geo-Scopes ohne kanonische Membership bleiben `insufficient_context` und werden nicht auf das ganze Land hochgestuft.
- Title-only Items erzeugen keine Geo-Truth.
- Route-/Airport-Wahrheit kommt nur aus Foundation D. Wiederholte Routekontakte bleiben getrennte Fenster.
- Es wurde kein Safety-Refactor extrahiert; Seasonal besitzt eigene Kalender-/Geo-Primitiven mit derselben Fail-closed-Semantik.

**Begründung:** Dieselben Truth-Fallen wie bei Safety, aber andere Aussage. Ein Shared-Modul mit Domain-Leck wäre riskanter als eine kleine, getestete Seasonal-Kopie der Primitiven.

**Konsequenzen:** Safety-Regressionen müssen grün bleiben. Seasonal-Fingerprints enthalten keine Citizenship.

---

## ADR-0138 – Rejected Acute und reverse Date Ranges bleiben fail-closed

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R3 REQUEST CHANGES

**Entscheidung:**

- Abgewiesene Acute-/Safety-Klassen (`active_warning`, `acute`, `acute_event`) tragen intern und in `SeasonalEvaluation` die Klasse `rejected_acute` plus `acuteRejected=true`. Sie dürfen nirgendwo als `seasonal_pattern` erscheinen.
- Eine Providerantwort, die ausschließlich solche Facts enthält, ist fail-closed `unknown` und nicht `checked_empty` / vollständiges `ok`.
- Kommt ein gültiger Seasonal-Fact zusammen mit einem Acute-Fact, bleibt der Seasonal-Fact sichtbar; das Acute-Fact bleibt rejected-domain.
- Untrusted Seasonal-Requests mit `startDate > endDate` oder Stage-`arrivalDate > departureDate` sind Schemafehler (HTTP 400). Grenzen werden nicht still getauscht.
- Ein unerwartet rückwärts laufendes Kontaktintervall bleibt in Kalender-/Relevanzhelfern `insufficient` und darf nicht zu `before`/`after`/`not_applies` hochgestuft werden.

**Kontext:** `docs/PR38_CHATGPT_R3_REVIEW.md` gegen Runtime `4f9eb1e8`.

**Alternativen:** Acute intern als `seasonal_pattern` plus Flag; reverse Dates still tauschen; Top-Level-`not_applies` vor Stage-Kontakt behalten.

**Begründung:** Eine als falsche Domain erkannte Safety-Klasse darf keine Seasonal-Truth behaupten. Malformed Reisedaten dürfen eine tatsächlich überlappende Stage nicht in eine Negativaussage verwandeln.

**Konsequenzen:** Kein Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R4 und Product-Owner-Merge-Freigabe.

---

## ADR-0139 – Konkrete Seasonal-Refs schlagen grobe Hüllen; Day→Stage gilt für Item-Impact

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R4 REQUEST CHANGES

**Entscheidung:**

- Wenn räumliche Relevanz konkrete Stage-/Airport-/Route-Refs geliefert hat, bestimmen deren eigenen Zeitkontakte die zeitliche Relevanz.
- Ein grobes Top-Level-`before`/`after` darf diese konkreten Refs nicht vorzeitig zu `not_applies` löschen.
- Fehlen belastbare konkrete Kontakte bei feststehender räumlicher Betroffenheit, bleibt `insufficient_context`.
- Für Item-Impact gilt zuerst eine gültige direkte `item.stageId`. Fehlt sie, gilt die belegte Beziehung `item.dayId → day.stageId`. Widersprüchliche Doppelbeziehungen werden nicht still entschieden.

**Kontext:** `docs/PR38_CHATGPT_R4_REVIEW.md` gegen Runtime `f077d4d1`.

**Alternativen:** globale Canonical-Invariante „alle Stage-Zeiten liegen im Tripfenster“; Item-Impact nur bei direkter `stageId`.

**Begründung:** Feinere kanonische Trip-Facts dürfen nicht durch eine gröbere widersprüchliche Hülle falsifiziert werden. Eine vorhandene Day→Stage-Beziehung ist keine Heuristik.

**Konsequenzen:** Kein Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R5 und Product-Owner-Merge-Freigabe.

---

## ADR-0140 – Seasonal-Provider-Request trägt Zeitkontakte; Acute überschreibt Availability nicht

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R5 REQUEST CHANGES

**Entscheidung:**

- Der provider-neutrale Seasonal-Request enthält neben Top-Level-Daten und flachen Mengen kanonische Stage-Targets und getrennte Route-/Airport-Zeitkontakte.
- Konkrete Stage-/Route-Zeiten bleiben einzeln addressierbar. Wiederholte Places/Airports werden nicht zu Min/Max verschmolzen. Die Reihenfolge identischer Trip-Facts ändert den Request nicht.
- Citizenship, Dokumente, Labels und LLM-Felder gehören nicht in den Seasonal-Port.
- Eine explizite Acute-/Safety-Klasse bleibt `rejected_acute` / `acuteRejected=true`, auch kombiniert mit `temporarily_unavailable`. `availability` darf die Domain-Klasse nicht zu `seasonal_pattern` umschreiben.
- Acute-only + unavailable bleibt honest unknown/unavailable ohne Seasonal-Hinweis. Gültige Seasonal-Facts dürfen sichtbar bleiben; der Gesamtstatus wird dadurch nicht clean/favorable/`ok`.

**Kontext:** `docs/PR38_CHATGPT_R5_REVIEW.md` gegen Runtime `249d4b9b`.

**Alternativen:** Adapter später selbst gegen den Tripgraphen rückrechnen lassen; `temporarily_unavailable` weiter zuerst auswerten und Acute verwerfen.

**Begründung:** R4 hat konkrete Zeitkontakte zur lokalen Source of Truth gemacht. Ein späterer Adapter muss dieselben Kontakte schon im Request sehen. Eine als Safety erkannte Klasse darf durch ein zweites erlaubtes Feld nicht wieder Seasonal-Truth werden.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R6 und Product-Owner-Merge-Freigabe.

---

## ADR-0141 – Airport-Zeitkontakte nur innerhalb eines belegten Legs

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R6 REQUEST CHANGES

**Entscheidung:**

- Foundation D projiziert kanonische `RouteFacts.airportContacts` pro Leg und Flight-Item.
- Adjacent `destination(code) → origin(code)` in der abgeflachten Segmentliste ist keine Connection-Wahrheit.
- Getrennte Flight-Items und getrennte Legs erzeugen getrennte Airport-Kontakte. Nur ein belegter Transit im selben Leg darf ein Intervall bilden.
- Seasonal-Relevanz, Seasonal-Provider-Request und Safety-Relevanz lesen dieselbe Projektion.
- `connections` werden ebenfalls nur noch innerhalb eines Legs abgeleitet.

**Kontext:** `docs/PR38_CHATGPT_R6_REVIEW.md` gegen Runtime `e790a7d2`.

**Alternativen:** Heuristische Max-Layover-Zeit; Pairing weiter über die flache Segmentliste; fail-closed ohne Layover-Kontakte.

**Begründung:** Ein mehrtägiger Zielaufenthalt zwischen Hin- und Rückflug ist kein belegter Airport-Kontakt. Dieselbe falsche Hülle darf weder lokale Relevanz noch einen späteren Adapter steuern.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R7 und Product-Owner-Merge-Freigabe.

---

## ADR-0142 – Länderrollen nur innerhalb eines belegten Legs

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R7 REQUEST CHANGES

**Entscheidung:**

- Foundation D projiziert `transitCountryCodes` und `destinationCountryCodes` kanonisch pro Leg.
- Transitländer entstehen nur aus Zwischen-Segmenten desselben Legs. Das letzte Segmentziel eines Legs ist kein Transit.
- Zielstaaten entstehen aus belegten Leg-Endpunkten. Das globale Origin-/Rückkehrland wird nicht allein durch ein Rück-Leg zum Reiseziel.
- Multi-City-Ziele bleiben Ziele. Echter Transit im selben Leg bleibt Transit.
- Readiness, Seasonal und Safety lesen dieselbe Foundation-D-Rollenmenge.

**Kontext:** `docs/PR38_CHATGPT_R7_REVIEW.md` gegen Runtime `ece075e7`.

**Alternativen:** Flatten weiter über die Itinerary; Heuristik nach Aufenthaltsdauer; getrennte Readiness-Wahrheit.

**Begründung:** Ein Hinflugziel zwischen Hin- und Rückflug ist kein Transitland. Falsche Transit-/Destination-Rollen würden spätere Visa-/Entry-/Transit-Provider falsch steuern.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R8 und Product-Owner-Merge-Freigabe.

---

## ADR-0143 – Open-Jaw-Leg-Ursprünge in Country-Truth und Route-Identität

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R8 REQUEST CHANGES

**Entscheidung:**

- Ein Leg-Origin, der nicht das bewiesene Reise-Origin ist, ist ein belegter Besuch und gehört zu `destinationCountryCodes`.
- Transit bleibt ausschließlich ein Zwischenpunkt innerhalb desselben Legs.
- Item-Chronologie ohne `startsOn` nutzt Segmentdaten. Fehlt jede beweisbare Chronologie, bleibt das Origin leer.
- Route-Fingerprint und menschliche Darstellung serialisieren jedes Leg getrennt, inklusive jedes Leg-Origins.
- Dieselbe Open-Jaw-Route als eine Itinerary oder als getrennte Flight-Items teilt Country-Rollen und Identität.

**Kontext:** `docs/PR38_CHATGPT_R8_REVIEW.md` gegen Runtime `de83d026`.

**Alternativen:** Nur Leg-Endpunkte als Ziele; lexikographische Pfadsortierung als Origin; getrennte Fingerprints für Item- vs. Itinerary-Form.

**Begründung:** Ein strukturierter Rückflug ab Singapur beweist den Aufenthalt dort. Dieselbe Lücke darf Seasonal, Readiness und Safety nicht unterschiedlich treffen, und zwei verschiedene Rückflug-Origins dürfen nicht dieselbe Route-Identität erzeugen.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R9 und Product-Owner-Merge-Freigabe.

---

## ADR-0144 – Segment-Origins, Connection-Ownership, Chronologie-Präzision und Readiness-Digest

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R9 REQUEST CHANGES

**Entscheidung:**

- Ein belegter späterer Segment-Origin gehört zu Pfad, Fingerprint und Kompaktanzeige, wenn er vom vorherigen Segmentziel abweicht. Dieselbe Airport-Change-Grenze gilt für Country-Truth bei einem Cross-Country-Gap.
- `RouteVerbindung` ist nach Flattening global eindeutig (`legIndex` + globale Segmentindizes). Die UI darf Umstiege nicht über Array-Index gegen die flache Segmentliste legen.
- Chronologie ist nur bewiesen, wenn Item- und Segmentquellen eine eindeutige Reihenfolge tragen und sich nicht widersprechen. Date-only darf keine Segmentzeit auf `00:00` degradieren. Unbewiesene Chronologie zeigt keine erfundene Reihenfolge.
- Readiness-Fingerprints hashen den vollständigen kanonischen Kontext als versionierten SHA-256-Digest. Prefix-Truncation ist keine Identität. `READINESS_FINGERPRINT_VERSION` ist `v3`.

**Kontext:** `docs/PR38_CHATGPT_R9_REVIEW.md` gegen Runtime `263c2f84`.

**Alternativen:** Airport-Change nur in Connections belassen; lokale Connection-Indizes plus UI-Heuristik; Item-`startsOn` immer auf Mitternacht; Klartext-Fingerprint mit höherem DB-Limit.

**Begründung:** Eine Reise, eine Wahrheit. Sichtbare Route, Stale-Erkennung und Country-Scope dürfen keine belegte Topologie, keinen Umstiegsort und keine Traveller-Änderung hinter einer Längengrenze verlieren.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R10 und Product-Owner-Merge-Freigabe.

---

## ADR-0145 – Intra-Itinerary-Chronologie, Surface-Route-ID, Connection-Dauer und Credential-v4

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R10 REQUEST CHANGES

**Entscheidung:**

- Eindeutige Segmentzeiten sind die Source of Truth für die Leg-Reihenfolge innerhalb einer Itinerary. Origin, Länderrollen, Fingerprint und Anzeige lesen dieselbe umgeordnete Wahrheit. Ties oder fehlende Zeiten bleiben fail-closed.
- Route-Fingerprints versionieren Surface-/Airport-Change (`~`) getrennt von kontinuierlichem Segmentkontakt (`>`). `ROUTE_FACTS_VERSION` ist `route-v2`. Fehlende IATA ist unknown, nicht gleich.
- Connection-`airportChange` ist nur bei zwei bekannten, verschiedenen IATA `true`. Lokale Uhrzeiten erzeugen eine Layover-Dauer nur am selben bewiesenen Airport.
- Readiness-Fingerprints sind `v4|sha256:…` über eine kanonische JSON-Struktur. Pro Dokument geht die aufgelöste Citizenship-Country-Bedeutung ein, nicht nur die opaque Ref. Persistierte v2/v3-Werte werden stale.

**Kontext:** `docs/PR38_CHATGPT_R10_REVIEW.md` gegen Runtime `263c2f84`; Fixes auf `fdcc5c88`.

**Alternativen:** Nur fail-closed ohne Umsortierung; Surface nur in der Anzeige belassen; Cross-Airport-Dauer mit Zeitzonen raten; Citizenship-Menge ohne Dokument-Bindung hashen.

**Begründung:** Dieselbe semantische Reise darf als Multi-Leg-Itinerary und als zwei datierte Flight-Items nicht verschiedene Country-Truth erzeugen. Sichtbare Topologie, Stale-Erkennung und Credential-Eligibility müssen dieselbe Identität lesen.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. PR #38 bleibt Draft bis R11 und Product-Owner-Merge-Freigabe.

---

## ADR-0146 – Airport-lokale Chronologie, Segmentkanon und kanonisches Route-Ende

**Datum:** 23. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R11 REQUEST CHANGES

**Entscheidung:**

- Airport-lokale Abflugzeiten sind nur am selben bewiesenen IATA oder über Kalenderabstände von mindestens drei Tagen vergleichbar. Cross-Airport-Wanduhren, inklusive Date-Line, erzeugen keine absolute Reihenfolge.
- Eine eindeutige azyklische Airport-Kette darf die deklarierte Leg-Reihenfolge bestätigen. Sie darf getrennte Flight-Items nicht so umdrehen, dass ein Open-Jaw-Home-Arrival zum Origin wird.
- Der Chronologie-Beweis wird vor einem Lex-Sort der Fingerprint-Stabilisierung ausgewertet. Lexikalische Pfade bleiben Anzeige-/Fingerprint-Fallback, nicht Business-Truth.
- Eine eindeutige kontinuierliche Segmentkette innerhalb eines Legs wird rekonstruiert. Surface-Change ohne IATA-Kontinuität bleibt erklärt. Zyklen und fehlende IATA bleiben fail-closed.
- Bei bewiesener Chronologie ist `RouteFacts.destination` das letzte Segment der letzten kanonischen Itinerary. Unbewiesene Reihenfolge leert Origin und Destination.

**Kontext:** `docs/PR38_CHATGPT_R11_REVIEW.md` gegen Runtime `fdcc5c88`; Fixes auf `ba5bcd76`.

**Alternativen:** Zeitzonen-DB/UTC-Offsets; Cross-Item-Hamiltonian als Origin; Destination weiter aus der ersten Itinerary.

**Begründung:** Dieselbe strukturierte Reise darf durch lokale Uhren, verdrehte Segmentarrays oder das erste Flight-Item keine falsche Origin-/Destination-Wahrheit für Seasonal, Safety und Readiness erzeugen.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. Der IATA-Fallback aus Blocker 25 ist durch ADR-0147 ersetzt. PR #38 bleibt Draft bis R13 und Product-Owner-Merge-Freigabe.

---

## ADR-0147 – Segmentordnung nur bei eindeutiger kontinuierlicher oder same-country Surface-Kette

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R12 REQUEST CHANGES

**Entscheidung:**

- Bekannte IATA-Codes identifizieren Endpunkte. Sie beweisen keine Intra-Leg-Reihenfolge.
- `segmenteOrdnungBewiesen()` akzeptiert genau einen kontinuierlichen Hamiltonian oder genau einen gemischten Hamiltonian, dessen zusätzliche Kanten nur same-country Surface-Wechsel mit zwei bekannten, verschiedenen IATA sind. Country kommt aus dem strukturierten `countryCode` am Punkt, nicht aus Städtenamen.
- Null oder mehrere solche Pfade bleiben fail-closed. Cross-Airport-Wanduhren bleiben ausgeschlossen.
- Unbewiesene Segmentmengen leeren globalen Origin/Destination, erzeugen keine Connections aus Array-Nachbarschaft, erfinden keine Transit-Rolle und bekommen einen permutationsstabilen Fingerprint als sortierte Segment-Multimenge.
- Echte `CDG ⇢ ORY`-Surface-Changes bleiben unterstützt. Cross-Country-Gaps ohne unique Surface-Kante bleiben unknown, bis eine explizite Surface-Boundary-Evidence existiert.

**Kontext:** `docs/PR38_CHATGPT_R12_REVIEW.md` gegen Runtime `ba5bcd76`; Fixes auf `1c14e804`.

**Alternativen:** Pauschales Fail-closed jedes 0-Pfad-Falls (zerbricht echten CDG⇢ORY); erneuter IATA-Fallback; neues persistiertes Surface-Flag; Cross-Airport-Uhren.

**Begründung:** Untrusted Segmentarrays aus Browser/Local Storage/Metadata dürfen Seasonal, Safety und Readiness keine erfundenen Origin-/Connection-/Country-Wahrheiten liefern. Same-country Topologie unterscheidet den echten Paris-Flughafenwechsel von unverbundenen Hops, ohne eine neue persistierte Spalte zu brauchen.

**Konsequenzen:** Kein Live-Provider, keine Migration, keine Secrets. Die same-country-Heuristik ist durch ADR-0148 ersetzt. PR #38 bleibt Draft bis R14 und Product-Owner-Merge-Freigabe.

---

## ADR-0148 – Surface-Kante nur mit explizitem `surfaceFromAirportCode`

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R13 REQUEST CHANGES

**Entscheidung:**

- Country-Gleichheit beweist keine Ground-/Surface-Verbindung.
- Eine Surface-Kante existiert nur, wenn das Folgesegment ein gültiges `surfaceFromAirportCode` trägt und dieses dem Destination-IATA des Vorgängers entspricht. Beide IATA müssen bekannt und verschieden sein.
- Das Feld ist optional im bestehenden Itinerary-JSON (`v: 1`). Fehlendes oder ungültiges Feld bleibt fail-closed. Keine neue Tabelle. Die persistente Function-Grenze folgt ADR-0149.
- `itineraryKanonisieren()` erhält vorhandene gültige Evidence. `itineraryAusFlugOption()` darf sie nicht aus untrusted Segmentnachbarschaft erfinden (ADR-0150).
- `CDG ⇢ ORY` bleibt bewiesen, wenn die Evidence gespeichert ist. `LAX→JFK` + `SFO→NRT` ohne Evidence bleibt unknown.

**Kontext:** `docs/PR38_CHATGPT_R13_REVIEW.md` gegen Runtime `1c14e804`; Fixes auf `2ba32449`.

**Alternativen:** Pauschales Fail-closed jeder Surface-Lücke inklusive echter Provider-Airport-Changes; Distanz-/Stadt-Heuristik; neues persistiertes Tabellenfeld.

**Begründung:** Große Länder machen same-country zu einer erfundenen Reisebewegung. Explizite, provider-neutrale Sequence-Evidence trennt den echten Flughafenwechsel von unverbundenen Segmenten, ohne Live-Provider oder Schema-Migration.

**Konsequenzen:** Kein Live-Provider, keine neue Tabelle, keine Secrets. Ältere Itineraries ohne das Feld werden für Surface-Lücken konservativ unknown. Die Persistenzgrenze ist durch ADR-0149 nachgezogen. PR #38 bleibt Draft bis R15 und Product-Owner-Merge-Freigabe.

---

## ADR-0149 – Persistenz erhält gültiges `surfaceFromAirportCode`

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R14 REQUEST CHANGES

**Entscheidung:**

- Die kanonische Funktion `public.flug_route_itinerary_metadata(text,jsonb)` übernimmt gültiges `surfaceFromAirportCode` als IATA.
- Fehlendes oder JSON-`null` Feld bleibt weggelassen. Vorhandenes, aber ungültiges Feld weist die gesamte Route fail-closed mit `{}` ab.
- Client-`countryCode`/`city`/`country` bleiben verworfen und werden weiter aus `public.airports` gebaut.
- Bereits angewandte Migrationen werden nicht umgeschrieben. Die Änderung liegt in der neuen Development-Migration `20260824120000_flug_route_itinerary_surface_evidence`.
- Production bleibt gesperrt, bis der Product Owner eine eigene Migrationsfreigabe erteilt.

**Kontext:** `docs/PR38_CHATGPT_R14_REVIEW.md` gegen Runtime `2ba32449`; Fixes auf `771c63a9`. ADR-0148 hat die Runtime-Evidence eingeführt, die aktive Development-Funktion hat sie beim Neuaufbau der Segmente verworfen.

**Alternativen:** Evidence nur im TypeScript-Pfad belassen (bricht Save/Reload); neue Tabellenspalte; Production-Migration ohne Freigabe; gleiche-Länder-Heuristik wieder öffnen.

**Begründung:** Route Truth, Fingerprint, Connections, Readiness, Safety und Seasonal dürfen sich nicht allein durch Persistieren derselben Reise ändern. Guest→Account und Account-Reload müssen dieselbe Evidence sehen wie der Runtime-Graph.

**Konsequenzen:** Für untrusted Intake durch ADR-0151 ersetzt. Development-Funktion `20260824120000` blieb Zwischenstand; `20260824140000` verwirft Client-Surface. Production bleibt ohne beide Migrationen, bis separat freigegeben.

---

## ADR-0150 – FlugOption erzeugt keine Surface-Evidence aus Array-Lücken

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R15 REQUEST CHANGES

**Entscheidung:**

- `itineraryAusFlugOption()` schreibt kein `surfaceFromAirportCode` aus Segment-Array-Nachbarschaft.
- Eine `FlugOption` aus dem Browser bleibt untrusted. Zod prüft Form, nicht belegte Surface-Truth.
- `provider`, `externalRef` und unbekannte Extra-Felder sind kein Provider-Beweis.
- Vorhandene explizite Itinerary-Evidence bleibt in typisierten Objekten lesbar; untrusted Persistenz folgt ADR-0151.
- Diskontinuierliche Segmente ohne diese Evidence bleiben chronology unknown.

**Kontext:** `docs/PR38_CHATGPT_R15_REVIEW.md` gegen Runtime `771c63a9`; Fixes auf `5cc4488e`. ADR-0148 hatte die Evidence beim Flugübernahmepfad noch aus Airport-Wechsel-Nachbarschaft gesetzt.

**Alternativen:** Signed/opaque Provider-Snapshot (noch nicht vorhanden); explizite Nutzerdeklaration als eigene Evidence-Klasse; Country-/Distanz-Heuristik.

**Begründung:** Ohne serverseitig belegte Surface-Quelle würde Persistenz (ADR-0149) erfundene Array-Lücken dauerhaft adeln. Foundation bleibt fail-closed, bis ein echter Trust-Contract existiert.

**Konsequenzen:** Echte Airport-Changes, die nur als Browser-`FlugOption` ankommen, bleiben unknown, bis eine zulässige Evidence-Quelle existiert. Kein Live-Provider, keine Migration, keine Secrets. Untrusted `routeItinerary` folgt ADR-0151. PR #38 bleibt Draft bis zur Product-Owner-Merge-Freigabe.

---

## ADR-0151 – Untrusted Intake persistiert keine Client-Surface-Evidence

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #38 nach R16 REQUEST CHANGES

**Entscheidung:**

- Browser-/LocalStorage-/Guest-`routeItinerary` darf `surfaceFromAirportCode` nicht als belegte Surface-Evidence einbringen.
- `flugRouteItineraryLesen()` und Guest-`reiseLesen()` verwerfen das Feld. Ungültige Werte löschen die Route nicht.
- `itineraryKanonisieren()` kopiert das Feld nicht.
- `public.flug_route_itinerary_metadata` baut Segmente ohne das Feld neu. Development-Migration `20260824140000_flug_route_itinerary_untrusted_surface`.
- Es gibt in dieser Foundation keinen trusted Surface-Schreibpfad. Save→Reload und Guest→Account von Client-Claims bleiben chronology unknown.
- `flugRouteItineraryTrustedLesen()` darf das Feld nur an bereits typisierten oder später serverseitig belegten Objekten lesen.
- ADR-0149 gilt nicht mehr für untrusted Intake. Country-/Distanz-Heuristiken und Browser-`provider`/`externalRef` bleiben kein Beweis.

**Kontext:** `docs/PR38_CHATGPT_R16_REVIEW.md` gegen Runtime `5cc4488e`; Fixes auf `57824019`. R15 schloss nur den `FlugOption`-Pfad. Derselbe Defekt blieb über die bereits geformte `routeItinerary` offen.

**Alternativen:** Getrennter persistierter Evidence-Contract; opaque/signed Provider-Snapshot; explizite Nutzerdeklaration als eigene `user`-Evidence-Klasse; ADR-0149 unverändert lassen.

**Begründung:** Ohne Provenance wäre jedes syntaktisch gültige Client-IATA Surface-Truth. In dieser Foundation existiert kein serverseitig belegter Surface-Schreiber. Fail-closed unknown ist konservativer als eine geadelte Lücke.

**Konsequenzen:** Echte Airport-Changes, die nur als Browser-/Guest-JSON ankommen, bleiben unknown, bis ein trusted Contract existiert. Development-Funktion ist aktualisiert. Production bleibt ohne die Migration. Kein Live-Provider, keine Secrets, keine neuen laufenden Kosten. R17 Technical Closure ist dokumentiert. PR #38 bleibt Draft bis zur Product-Owner-Merge-Freigabe.

---

## ADR-0152 – Account-Übersicht ist Zuhause, kein zweites Workspace-Dashboard

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #43 / `feat/account-ap1`

**Entscheidung:**

- `/account` ist das persönliche dauerhafte Zuhause eines angemeldeten Kontos.
- Der Trip Workspace bleibt die operative Kommandozentrale einer einzelnen Reise.
- Die Übersicht liest ausschliesslich vorhandene `reisenLaden()`-Daten. Empty und Error bleiben getrennt.
- Die öffentliche Leiste zeigt **Konto** nur bei `sitzung === konto`.
- `/account/security` wird unter `/account/settings` auffindbar; MFA-/AAL-Verträge ändern sich nicht.
- AP-1 ändert keine Tabelle, kein RLS, kein Guest→Account und keine Traveller-Registry.

**Kontext:** Account-Audit PR #39. Auftrag `docs/ACCOUNT_AP1_IMPLEMENTATION_TASK.md`.

**Alternativen:** Workspace-Karten auf `/account` spiegeln; Konto-Link auch für Gäste; neue Persistenz für „nächste Reise“.

**Begründung:** Ohne Zuhause bleibt `/account/security` verwaist und `/reisen` wirkt wie der einzige Einstieg. Ein zweites Dashboard würde operative Wahrheit verdoppeln.

**Konsequenzen:** Orientierung und Fortsetzen liegen im Konto. Fachliche Reiseoperationen bleiben im Workspace. AP-2+ erst nach Review/Freigabe. PR #43 bleibt Draft.

---

## ADR-0153 – Account aktiv/kommend braucht einen Geräte-Kalendertag

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #43 nach Technical-Lead REQUEST CHANGES

**Entscheidung:**

- `aktiv` / `kommend` entstehen nur gegen einen belegten Geräte-Kalendertag (`Date#getTimezoneOffset`).
- Der Server klassifiziert diese Lagen nicht. Unbekannter Kalendertag bleibt `fortsetzen`.
- Keine IANA-Zone, kein stilles UTC-Kalenderdatum aus `toISOString()`.
- Ein 503 von `reisenLaden()` beweist keinen Speicherstand. Der Text sagt nur, dass der aktuelle Stand nicht geprüft werden konnte.

**Kontext:** Independent Technical-Lead Review an PR #43 gegen Head `62868d2c`.

**Alternativen:** Server-UTC als „heute“ (Review-Blocker); IANA aus IP/Browser raten; aktiv/kommend ganz entfernen.

**Begründung:** Date-only darf nicht still UTC werden. Ein Ladefehler ist keine Persistenzaussage.

**Konsequenzen:** Kurz nach dem ersten Client-Render kann die Lage von Fortsetzen auf aktiv/kommend wechseln. Das ist ehrlicher als eine Server-UTC-Behauptung. PR #43 bleibt Draft.

---

## ADR-0154 – Minimaler gemeinsamer Provider-Operationsvertrag

**Datum:** 24. August 2026  
**Status:** umgesetzt und Technical Closure / PASS auf Draft-PR #47, Exact Head `b74096a9`; kein Mark Ready / kein Merge

**Entscheidung:**

- Technische Provider-Operations liegen in `lib/provider-ops/*`.
- Die gemeinsame Taxonomie ist nur `ok | partial | empty | checked_empty | unavailable | timeout | invalid | rate_limited | error`.
- Fachzustände wie Readiness `recheck_needed` / `insufficient_context` und Seasonal `rejected_acute` gehören nicht in diesen Basistyp.
- Request-Härtung, Kill-Switch-Form, In-Memory-Cost-Guard und ein Observability-Event-Typ ohne Persistenz sind erlaubt.
- `providerOpsEvent()` konstruiert das Event nur aus der Allowlist. Input darf nicht per Spread kopiert werden.
- `ProviderOpsCostGuard.erlaubt()` ist async, damit PR-S6 I/O einhängen kann, ohne Domain-Hüllen erneut umzuschneiden. S1 implementiert nur den In-Memory-Port.
- Bestehende Domain-Hüllen bleiben dünne Wrapper. Es gibt keinen `UniversalProvider` und kein gemeinsames Offer-Schema.
- Flights-Search erhält dieselbe Request-Härtung wie Hotels. Mobility-/Rental-Timeout-HTTP 504 bleibt unverändert, weil eine stille 200-Umstellung den Public Contract bricht.
- Persistenter Cost Guard, Nachweis-Verträge, Offer-Provenance und Admin-Health sind spätere Slices.

**Identifier:** `ADR-0154` ist der einzige Identifier dieser Implementierungsentscheidung. Parallel existieren auf anderen Draft-Branches andere `ADR-0152`/`ADR-0153` (Audit-Planung auf PR #45, Account AP-1 auf PR #43). Diese Nummern werden hier nicht wiederverwendet.

**Kontext:** Product-Owner-/Technical-Lead-Freigabe für S1 als eigenen Draft-Workstream nach dem Provider-Readiness-Audit (PR #45). Review REQUEST CHANGES auf PR #47 (S1-B1, S1-B2, ADR-Kollision). Auftrag: `docs/PROVIDER_OPS_S1_TASK.md`.

**Alternativen:** Domains weiter kopieren; eine universelle Provider-Abstraktion; HTTP 504 überall auf 200 ziehen; persistente Kostenschranke sofort bauen; synces Cost-Guard-Interface belassen.

**Begründung:** Die Audit-Befunde lagen in kopierter Operationshülle, nicht in fehlender Fachwahrheit. Eine schmale gemeinsame Form verhindert weitere Drift, ohne Search-, Truth- oder Adaptergrenzen zu vermischen. Ein synces Interface hätte S6 gezwungen, jede Domain erneut umzubauen. Ein Spread hätte Observability-Zusatzfelder durchgelassen.

**Konsequenzen:** S2+ und S6 können dieselben Hüllen nutzen. Production bleibt fail-closed. Keine neuen Kosten, keine Secrets, keine Migration. Technical Closure ist dokumentiert in `docs/PROVIDER_OPS_S1_TECHNICAL_CLOSURE.md`. S1 ist keine Freigabe für Live-Provider.

**Nachtrag 24. August 2026:** PR #47 ist auf `main` gemergt (`01761eb9`). „Draft-PR #47 wartet auf Product-Owner-Entscheidung“ ist pre-merge Evidence.

---

## ADR-0155 – Konto-Flugübernahme nur über serverseitigen FlugNachweis

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #51 / Provider Readiness S2; kein echter Provider, kein Mark Ready / kein Merge

**Entscheidung:** Eine kommerzielle Flugübernahme speichert keine Browseroption. Der Client liefert nur identifiers (`tripId`, `dayId`, `optionId`). Preis, Zeiten, Provider, External-Ref, Kabine und Legs kommen aus einem serverseitigen `FlugNachweis` plus dem per RLS geladenen Reisegraphen und einem serverseitig belegten Suchkontext. Solange Nachweis oder Suchkontext fehlen, fällt die Übernahme fail closed. `booking_url` bleibt `null`. Guest persistiert keine kommerzielle Provider-Flugoption. Guest → Account streicht unbewiesene Flug-Handelsfelder und darf sie nicht zu belegter Wahrheit hochstufen. Route Truth bleibt Foundation D; S2 baut keine zweite Route und keine Route-Heuristik.

**Kontext:** Nach S1 (ADR-0154) war die Flug-Kontoübernahme der offene P0-Trust-Gap: Zod prüfte die volle Browser-`FlugOption` und persistierte Preis, Zeiten und Refs. Hotels und Aktivitäten hatten die Nachweisgrenze bereits.

**Alternativen:**

1. *HMAC-Signatur der Suchergebnisse.* Zweckentfremdet Secrets und schützt nicht vor späteren Preisänderungen.
2. *Suchkontext aus Origin-/Etappennamen ableiten.* Wäre eine Route-Heuristik und eine zweite Route Truth.
3. *Guest weiter kommerziell persistieren und nur das Konto sperren.* Guest → Account würde unbewiesene Optionen nachträglich adeln.

**Begründung:** Dieselbe Trust-Grenze wie `HotelNachweis` muss stehen, bevor ein Flugadapter aktiv wird. Tests injizieren einen Fake-Katalog. Ein persistenter Suchkontext-Speicher oder Offer-Provenance wäre S5 und braucht einen eigenen Auftrag.

**Konsequenzen:** `flugNachweisAusUmgebung()` gibt heute `null` zurück. Die Server Action übergibt keinen Client-Suchkontext. Der erste Nachweis-Adapter muss optionId gegen Legs, Passagiere, Kabine, Währung und Gültigkeit binden. Die App-Grenze allein reicht nicht; der öffentliche RPC braucht ADR-0156.

---

## ADR-0156 – reise_anlegen verwirft unbewiesene Flug-Handelsfelder

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #51 / S2-B1; nur Supabase Development; Production unverändert

**Entscheidung:** `public.reise_anlegen(jsonb)` übernimmt für `kind='flight'` keine kommerziellen Felder aus der JSON-Nutzlast. `price_amount`, `price_currency`, `provider`, `external_ref` und `booking_url` werden in beiden INSERT-Pfaden (Tagespunkte und Ungeplante) auf `null` gesetzt. Nichtkommerzielle Flight-User-Intake-Felder, Foundation-D-Itinerary sowie Hotel-/Aktivitäts-/Mobilitäts-/Mietwagenverträge bleiben unverändert. Ein späterer vertrauenswürdiger Flugnachweis braucht einen getrennten Schreibvertrag; der heute für `authenticated` erreichbare JSON-RPC ist keine Providerquelle.

**Kontext:** Der TypeScript-Pfad von S2 (ADR-0155) war korrekt fail-closed. Der unabhängige Technical-Lead-Review fand den Direct-RPC-Bypass: `reise_anlegen` ist `SECURITY INVOKER` mit EXECUTE für `authenticated`. Ein Browser kann die RPC direkt über PostgREST aufrufen und damit die App-Grenze umgehen. RLS schützt weiter das Eigentum, nicht die Provenienz.

**Alternativen:**

1. *EXECUTE für authenticated entziehen.* Würde den normalen Konto-Anlagepfad zerstören.
2. *BEFORE-Trigger auf trip_items, der alle Flug-Handelsfelder nullt.* Würde auch einen späteren nachgewiesenen Server-INSERT treffen.
3. *Service Role oder neuer SECURITY DEFINER-Vertrag.* Ausserhalb des S2-B1-Scopes und ohne Product-Owner-Freigabe.

**Begründung:** Die minimale, freigegebene Lösung härtet genau den browser-erreichbaren JSON-Vertrag. Additive Migration `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis.sql`, nur Development.

**Konsequenzen:** Production bleibt bis zu einer separaten Product-Owner-Freigabe unverändert. Keine Service-Role-, Auth-, MFA-, AAL- oder Capability-Änderung. Kein S3. Kein Mark Ready / Merge. Der direkte Tabellenvertrag braucht ADR-0157.

---

## ADR-0157 – Direkte trip_items-Writes verwerfen untrusted Flug-Handelsfelder

**Datum:** 24. August 2026  
**Status:** umgesetzt auf Draft-PR #51 / S2-B2; nur Supabase Development; Production unverändert

**Entscheidung:** Ein BEFORE-Trigger auf `public.trip_items` verwirft für `kind='flight'` die fünf Handelsfelder, wenn `current_user` `authenticated` oder `anon` ist. INSERT setzt sie auf `null`. UPDATE kann sie nicht ändern und erbt sie nicht bei einem `kind`-Wechsel zu `flight`. Hotel-/Aktivitäts-/Mobilitäts-/Mietwagenfelder bleiben unberührt. User-Intake und Foundation-D-Itinerary bleiben möglich.

Ein späterer vertrauenswürdiger Flugnachweis braucht einen **getrennten SECURITY DEFINER-Schreibvertrag**. Der heutige `authenticated`-Tabellenvertrag, inklusive eines künftigen direkten App-INSERTs als `authenticated`, ist keine Providerquelle. `current_user` ist die Grenze, kein Client-Flag und keine Service Role.

**Kontext:** S2-B1 (ADR-0156) schloss `reise_anlegen`. Der Technical-Lead-Re-Review reproduzierte danach einen direkten `authenticated` UPDATE auf `trip_items`, der Preis, Währung, Provider, External-Ref und Booking-URL persistierte. RLS prüft Eigentum, nicht Provenienz.

**Alternativen:**

1. *Tabellenrechte auf die fünf Spalten entziehen.* Nicht kind-spezifisch; würde Hotel/Activity und `SECURITY INVOKER`-Pfade mitreissen.
2. *Session-GUC `jetnity.trusted_flight_write`.* Von `authenticated` per `set_config` spoofbar.
3. *Service Role als Schreibweg.* Ausdrücklich ausgeschlossen.
4. *Pauschales Nullen unabhängig von `current_user`.* Würde auch einen späteren SECURITY DEFINER-Nachweis treffen.

**Begründung:** Minimaler additiver Guard, der den Browservertrag fail-closed macht und den späteren getrennten trusted Vertrag offenlässt. Migration `20260824180000_trip_items_flug_handelsfelder_guard.sql`, nur Development.

**Konsequenzen:** `flugInReiseUebernehmen` bleibt heute fail-closed. Sobald ein Nachweis existiert, darf er kommerzielle Felder nicht mehr über den `authenticated`-Tabellen-INSERT adeln; dafür ist ein eigener SECURITY DEFINER-Vertrag nötig. Production unverändert. S2 Development-Migrationen bleiben nicht Production-approved. Kein Mark Ready / Merge ohne Product-Owner-Freigabe.

---

## ADR-0158 – Admin Slice A bleibt ehrliche Steuerzentralen-IA ohne neue Autorität

**Datum:** 24. August 2026  
**Status:** auf `main` gemergt (PR #44, `1ec93cc9`). Authoritative Datei: `docs/ADR_0158_ADMIN_SLICE_A.md`.

**Entscheidung:** Siehe `docs/ADR_0158_ADMIN_SLICE_A.md`. Historische Draft-Nummern ADR-0152/0155 für Slice A gelten nicht gegen aktuellen `main`.

Account AP-3 verwendet diese Kennung nicht. Verbindliche Allokation: Admin A = ADR-0158, Admin B = ADR-0159, Account AP-3 = ADR-0160, Provider S3 = ADR-0161, Admin C = ADR-0162.

---

## ADR-0159 – Admin Slice B bleibt read-only System Health ohne Fake-Green

**Datum:** 24. August 2026  
**Status:** auf `main` gemergt (PR #46, `e3bad749`). Authoritative Datei: `docs/ADR_0159_ADMIN_SLICE_B.md`. Historische Draft-Nummer ADR-0153 für Slice B gilt nicht gegen aktuellen `main`.

**Entscheidung:**

- Das Admin Control Center bekommt eine eigene read-only Fläche `/admin/system-health` mit zentralem Health-Modell: `healthy | degraded | unavailable | unknown | not_configured` plus Freshness `fresh | stale | unknown`.
- Sichtbares Grün gilt nur bei `healthy` **und** `fresh`. Stale, unknown, not_configured und unavailable dürfen nicht grün aussehen.
- Jede Karte nennt Quelle, Prüfzeit, was die Quelle beweist und was sie nicht beweist.
- Parent-Status und Sub-Checks bleiben getrennt.
- Zulässige Live-Evidence in Slice B ohne neues Secret:
  - **App / Deployment** bleibt `unknown`/non-green. Nur der Sub-Check `App-Prozess` darf bei einer aktuellen Prozessantwort `healthy` sein. `VERCEL_*` sind Metadaten und beweisen keine Deployment-Health.
  - **Supabase** bleibt `not_configured`/non-green. Ein erfolgreicher Read auf `public.airports` darf nur den Sub-Check `Supabase App-Datenzugriff` auf `healthy` setzen, nicht die Plattform.
- **Vercel-Plattform, GitHub/CI und Infomaniak** bleiben `not_configured`, solange kein freigegebenes read-only Token existiert. Vorhandene Cloud-Tokens werden im Webpfad nicht benutzt.
- Der GET-Endpunkt `api/admin/system-health` verlangt `requireAdminApi({ capability: 'betrieb-lesen' })`. `writeActions` bleibt leer. Keine Service-Role, keine Migration, keine Capability-/RLS-Änderung.
- Server-Cache 30s. Ein manueller Refresh, kein Sekunden-Polling. Ein Teilfehler isoliert die anderen Karten.

**Kontext:** Auftrag `docs/ADMIN_SLICE_B_SYSTEM_HEALTH_TASK.md`. Slice A hat System Health bewusst ausgelassen. Beim Current-Main-Sync nach PR #44 kollidierte die Draft-Nummer ADR-0153 mit Account AP-1.

**Alternativen:** Management-APIs mit vorhandenen Cloud-Tokens heimlich anbinden; ENV-Präsenz als healthy werten; letzten CI-Lauf als aktuelle Plattform-Health zeigen; HTTP-200 einer Jetnity-Seite als Gesamtgrün; Account-/Provider-ADRs auf `main` umnummerieren.

**Begründung:** `unknown` / `not_configured` ist belastbarer als erfundenes Grün. Ein neues Secret, ein Vertrag oder eine Management-Berechtigung braucht ein separates Product-Owner-Gate. Account- und Provider-ADRs auf `main` haben Vorrang vor Draft-Nummern.

**Konsequenzen:** Copilot Pro erklärt Health nicht in diesem Slice. Domain-/Mail-/DNS-Health bleibt später. Account-/Trip-/Traveller-/Route-/Safety-/Seasonal- und Provider-S2-Verträge bleiben unberührt. Slice B liegt auf `main` `e3bad749`. Slice C liegt auf `main` `78192ab`.

---

## ADR-0162 – Admin Slice C bleibt read-only Provider- und Kostenboard

**Datum:** 24. August 2026  
**Status:** auf `main` gemergt (PR #49, `78192ab`). Nummer 0162, weil 0160 Account AP-3 und 0161 Provider S3 vorbehalten sind.

**Entscheidung:**

- Das Admin Control Center bekommt `/admin/provider-ops` als read-only Provider- und Kostenboard.
- Der gemergte S1-Vertrag `lib/provider-ops` auf `main` wird nur gelesen, nicht kopiert oder verändert.
- Parent Provider-Ops bleibt `foundation_only`. Ein Domain-Zustand `available` gilt nur für die belegte Test-Capability und färbt den Parent nicht grün.
- Kill-Switch und Cost Guard bleiben Foundation: keine persistente Enforcement, kein globales Budget, kein Toggle.
- `public.model_usage` darf nur über den bestehenden `darf_betrieb_lesen`-Pfad gelesen werden. Empty, Error und Unknown bleiben getrennt. Keine 0-USD-/CHF-Lüge, keine nachträgliche Preisannahme.
- GET-only `api/admin/provider-ops` mit `betrieb-lesen`. `writeActions` bleibt leer. Keine Service-Role, keine Migration, keine Capability-/RLS-Änderung.

**Kontext:** Auftrag `docs/ADMIN_SLICE_C_PROVIDER_COST_BOARD_TASK.md` nach Merge von Admin Slice B und Provider S1. Cross-Agent-Allokation: 0158=A, 0159=B, 0160=AP-3, 0161=S3, 0162=C.

**Alternativen:** S1-Vertrag in Admin neu implementieren; ENV-Flag als Live-Provider verkaufen; In-Memory-Guard als Budgetschutz; leere Usage als 0 USD darstellen; ADR-0160/0161 erneut belegen.

**Begründung:** Foundation sichtbar machen ohne Fake-Aktivierung oder Fake-Kosten. Shared Contracts bleiben beim Provider-Workstream.

**Konsequenzen:** Kein Slice D, kein Finance-Live, kein Billing-P1 in diesem PR. PR #49 liegt auf `main`.

---

## ADR-0160 – Meine Reisen Lebenslage ist abgeleitet, nicht gespeichert

**Datum:** 24. August 2026  
**Status:** auf `main` gemergt (PR #53, `8326e72f`)

**Entscheidung:**

- Aktiv / Kommend / Vergangen / Ohne Datum entstehen nur aus vorhandenen `startDate`/`endDate` gegen den Geräte-Kalendertag.
- Dieselbe date-only-Funktion wie die Account-Übersicht (`istAktiv` / `istKommend` in `lib/account/reise-lage.ts`).
- Kein gespeicherter Lifecycle, kein `status = archived` Write, keine neue Tabelle.
- Undatierte Reisen sind niemals Vergangen.
- Der Server gruppiert nicht. Unbekannter Kalendertag zeigt Karten ohne Gruppenbehauptung.
- Die 200-Grenze von `reisenLaden()` wird sichtbar, wenn die Liste voll ist. Der Hinweis behauptet nicht, dass weitere Reisen existieren.

**Kontext:** Account-Audit AP-3; bestehende flache `/reisen`-Liste. Die zuerst verwendete Kennung ADR-0158 war bereits durch Admin Slice A auf `main` belegt.

**Alternativen:** Server-UTC als „heute“; gespeichertes `lifecycle`; Archiv-Filter in AP-3.

**Begründung:** Ein zweites Reisenmodell oder ein stiller UTC-Tag würde Übersicht und Liste auseinanderlaufen. Archivieren bleibt AP-4 / Shared Trip-Status.

**Konsequenzen:** Kurz nach dem ersten Client-Render erscheinen die Gruppen. Bereits in der DB gesetztes `archived` bleibt in der Datumsgruppe sichtbar, weil AP-3 nicht filtert und nicht schreibt.

**Nachtrag, 27. August 2026 – AP-4 filtert archived aus den Datumsgruppen.** Die date-only-Funktion `reisenGruppenAus` bleibt unverändert und filtert selbst nicht. Der Aufrufer (`kontoReisenSichten` / `KontoReisenGruppen`) trennt archivierte Reisen vor der Gruppierung ab. Restore-Provenienz und der einzige Status-Schreibweg stehen in ADR-0177. Dieser Nachtrag ändert ADR-0160 nicht nachträglich in einen Write-Vertrag.

---

## ADR-0161 – Mobility- und Rental-Nachweis folgen Hotel/S2, nicht dem Flugschema

**Datum:** 24. August 2026
**Status:** auf `main` gemergt (PR #54, `b7f027ec`). Historischer Current-Main-Sync auf `8326e72f` und Exact Head `2cb9a830` bleiben Evidence vor dem Merge. Kein echter Adapter; keine Production-Migration. Nummer nach Technical-Lead-Allokation, nicht ADR-0159/0160.

**Entscheidung:** Mobility und Rental bekommen denselben async Nachweisvertrag wie Hotel und S2 FlugNachweis: `nachweisen({ optionId, kontext })`. Der Browser darf nur `tripId` und `optionId` senden. Kommerzielle Felder kommen aus einem serverseitigen Nachweis plus Suchkontext – oder die Übernahme fällt fail closed. Die fachliche Form bleibt domain-spezifisch (Orte/Modus/Reisende bzw. Stationen/Zeitraum/Klasse/Getriebe). Ein Testkatalog darf nur injiziert werden. `*NachweisAusUmgebung()` bleibt `null`. `booking_url` wird nicht erzeugt. Die Workspace-Mobilitätssuche startet nicht mehr automatisch; nur «Verbindungen prüfen» darf `/api/mobility/search` anfassen.

**Kontext:** Der Provider-Readiness-Audit fand zwei P1-Lücken: Nachweis-Stubs ohne Hotel-Vertrag (PR-P1-04) und Auto-Search bei jedem Mobilitäts-Bereichsbesuch (PR-P1-07). S1 lieferte die Ops-Hülle, S2 die Qualitätsreferenz. Ein Copy-Paste des Flugschemas wäre falsch, weil Mobility/Rental andere Fakten binden.

**Alternativen:**

1. *Stubs belassen.* Würde den nächsten Adapter ohne Trust-Grenze aktivierbar machen.
2. *Flug-Kontext wiederverwenden.* Vermischt Domänen und bindet die falschen Fakten.
3. *S2-artige DB-Guards für transfer/rental_car.* Braucht eine eigene DB-/RLS-Entscheidung. S3 stoppt hier und dokumentiert den Residual.

**Begründung:** App-Grenze und Kostengrenze zuerst, ohne Provider, Secrets oder Migration. User-Intake bleibt Nutzerangabe. Provider-Übernahme bleibt geschlossen, bis ein Adapter existiert.

**Konsequenzen:** Keine Production-Migration. S2 Development-Guards bleiben unberührt. `reise_anlegen` kann transfer/rental Handelsfelder weiter als User-Intake schreiben; das ist kein Provider-Nachweis. S4–S8 bleiben eigene Slices.

**Nachtrag 24. August 2026:** Der Product-Owner-Merge von PR #54 liegt als `b7f027ec` auf `main`. Die vor dem Merge geschriebenen S3-Statusdateien dürfen diesen Merge-Stand nicht wieder zu „Draft #54 wartet“ zurückdrehen.

---

## Vorschlag – Trip Workspace Ziel-IA (nicht angenommen, keine ADR-Nummer)

**Datum:** 24. August 2026  
**Status:** vorgeschlagen im docs-only Draft-PR #55; nicht Product-Owner-angenommen; nicht implementiert. **Keine ADR-Nummer**, damit ADR-0160 (Account AP-3), ADR-0161 (Provider S3) und ADR-0162 (Admin Slice C) nicht kollidieren. Ein späterer Merge von PR #55 ist **keine** implizite Product-Owner-Freigabe dieser IA und **keine** Freigabe für TW-1.

**Entscheidung (Vorschlag, nicht Runtime):**

- Die Aufmerksamkeitsschicht priorisiert vorhandene Wahrheiten. Sie ist keine neue Truth-Tabelle und kein Schattenmodell.
- Dieselbe Informationsarchitektur gilt auf Mobile und Desktop: Reise-Kopf → `Jetzt wichtig` → Timeline → Details on demand.
- Attention-Leerstände bleiben mindestens vierfach getrennt: `nichts_dringend_geprueft`, `noch_nicht_geprueft`, `noch_nicht_pruefbar`, `pruefung_nicht_verfuegbar`.
- Fehlende Safety-/Seasonal-Evaluation darf weder clean/`nichts_dringend_geprueft` noch automatisch `pruefung_nicht_verfuegbar` bedeuten.
- Safety-/Seasonal-Stille und Desktop ohne Übersicht sind P0-Produktfehler, kein UX-Feinschliff.

**Kontext:** Workspace-Code-Audit gegen historische Evidence-Basis `1ec93cc9`. Integrationsbasis nach Current-Main-Sync ist `b7f027ec` (Provider S3). S3, AP-3 und Admin C ändern die P0-Workspace-Befunde nicht. Vollständige Begründung: `docs/TRIP_WORKSPACE_AUDIT.md` und `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`.

**Alternativen:** Desktop-Übersicht als optionales Panel belassen; Aufmerksamkeit als persistierte Tabelle; Safety unsichtbar lassen, bis ein Live-Provider existiert.

**Begründung:** Eine Reise, eine Wahrheit. Komplexität gehört ins System, nicht in den Kopf des Nutzers. Der Workspace orchestriert vorhandene Foundations, statt sie neu zu bauen.

**Konsequenzen:** Runtime erst nach unabhängigem Review **und** ausdrücklicher Product-Owner-Freigabe als eigener Schnitt TW-1/TW-2. Dieser PR implementiert nichts, ändert keine Shared Contracts und startet kein TW-1. Docs-Merge ≠ IA-Annahme.

**Nachtrag 25. August 2026:** Der Product Owner hat die Ziel-IA angenommen und nur TW-1 zum Start freigegeben. Verbindlich ist ADR-0163. Dieser historische Vorschlagstext bleibt Evidence des Docs-only-Stands von PR #55.

---

## ADR-0163 – Trip Workspace Ziel-IA angenommen; nur TW-1 gestartet

**Datum:** 25. August 2026  
**Status:** Product-Owner-angenommen. TW-1 und TW-2 sind auf `main`. TW-4 folgt ADR-0165 / Draft-PR #60. Volltext: `docs/ADR_0163_TRIP_WORKSPACE_TARGET_IA.md`.

**Entscheidung:** Dieselbe Workspace-Produktlogik gilt auf Mobile und Desktop. Eine Reise, eine Oberfläche. TW-1 und TW-2 werden nicht in einem Runtime-PR vermischt. Reihenfolge: TW-1 Shell/Geräteparität, danach TW-2, bevorzugt TW-4, dann TW-3.

**Kontext:** Der docs-only Audit #55 hat Desktop ohne Übersicht als P0 dokumentiert. Die Product-Owner-Freigabe vom 25. August 2026 gilt nur für IA-Annahme und Start von TW-1.

**Alternativen:** Desktop-Übersicht optional belassen; TW-1 und TW-2 in einem PR; Attention zuerst.

**Begründung:** Zwei IAs sind ein Produktfehler, kein Layoutunterschied. Kleine Slices halten Review- und Truth-Risiko begrenzt.

**Konsequenzen:** Keine DB-/RLS-/Auth-/Provider-/Secret-Änderung durch TW-1. Safety-/Seasonal-Stille bleibt ein späterer Slice. Mark Ready und Merge brauchen neue ausdrückliche Product-Owner-Gates.

---

## ADR-0164 – Trip Workspace TW-2 verdichtet vorhandene Übersichtswahrheit

**Datum:** 25. August 2026  
**Status:** Technical-Lead-Entscheidung. TW-2 ist auf `main` (PR #58). Volltext: `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`.

**Entscheidung:** Die Reiseübersicht ist eine Presentation-Derivation. Lage kommt aus AP-3-`reiseGruppe`. Coverage-Texte kommen aus `bereichStatus`/`planStatus`. Personen aus `party[]` oder ehrlich nur als Anzahl. Kein neuer `trips.status`, kein Shadow-Lifecycle, keine Citizenship-Annahme.

**Kontext:** TW-1 hat die Shell vereinheitlicht. Die ersten Sekunden beantworteten noch nicht ehrlich, was die Reise ist und was belegt ist.

**Alternativen:** Persistierter Gesamtstatus; eigene Lifecycle-Enum; Attention zuerst (TW-4).

**Begründung:** Eine hübsche Zusammenfassung ohne Source of Truth wäre ein Produktdefekt. AP-3 nicht widersprechen.

**Konsequenzen:** TW-3 bleibt ein eigener Slice. TW-4 folgt ADR-0165.

---

## ADR-0165 – Trip Workspace TW-4 priorisiert vorhandene Aufmerksamkeitssignale

**Datum:** 25. August 2026  
**Status:** Technical-Lead-Entscheidung in der verbindlichen Build-Reihenfolge. Runtime in Draft-PR #60. Volltext: `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`.

**Entscheidung:** `Jetzt wichtig` ist eine Presentation-Aggregation. Safety/Seasonal nutzen die vorhandene lokale, side-effect-freie Evaluation. Vier Leerstände bleiben getrennt. Kein neuer `trips.status`, kein LLM-Score, keine Default-Citizenship.

**Kontext:** TW-2 verdichtet die Übersicht, priorisiert aber nicht. Der Produktpfad liess Safety/Seasonal stumm, obwohl eine sichere lokale Evaluation existiert.

**Alternativen:** Dauerhafte `noch_nicht_geprueft`-Stille; Attention-Tabelle; Provideraktivierung.

**Begründung:** Künstliche Stille wirkt wie Entwarnung oder wie fehlende Fähigkeit. Die lokale Evaluation sagt ehrlich `provider_unavailable`.

**Konsequenzen:** TW-3/TW-5 bleiben eigene Slices. Echte Warnungen brauchen weiterhin Provider-Gates.

---

## ADR-0166 – Guest→Account streicht unbewiesene Stay-/Activity-Handelsfelder

**Datum:** 26. August 2026  
**Status:** integriert auf `main` via PR #81 / `86567f17`; schließt P1-QS2-02. Keine Schema-/RPC-Änderung.

**Entscheidung:** Beim Guest→Account-Transfer werden für `stay` und `activity` dieselben unbewiesenen Handelsfelder genullt wie bereits für `flight`: `price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url`. Nicht-kommerzielle Fakten (Titel, Notiz, Datum, Zeit) bleiben. Transfer und `rental_car` bleiben unverändert, weil ihr persistierter Preis S3-User-Intake sein kann.

**Kontext:** QS-2 P1-QS2-02. Konto-Hotel/Activity verlangen Nachweis. Guest-LocalStorage ist keine Provider-Evidence. Der Flug-Strip existierte; Stay/Activity liefen durch `alsNutzlast` / `reiseAusNutzlastAnlegen`.

**Alternativen:**

1. *RPC `reise_anlegen` härten.* Shared-Contract-/DB-Änderung; Residual für Flug bleibt ohnehin (direkter PostgREST-Aufruf). Nicht in diesem Slice.
2. *Auch Transfer/Rental strippen.* Würde manuelle Nutzerpreise zerstören, ohne S3/S5-Vertrag.
3. *Nichts tun.* Account-Graph trägt erfundene Commercial-Truth.

**Begründung:** Lokale Gastdaten dürfen keine angebliche Provider-/Preis-/Booking-Wahrheit erzeugen. Die Feldmenge ist die bereits für Flüge geltende, nicht erfunden.

**Konsequenzen:**

- `nutzlastOhneUnbewieseneHandelsfelder` in `alsNutzlast` und `reiseAusNutzlastAnlegen`
- Mobility/Rental-Such-Snapshots mit `provider`/`external_ref` bleiben ein dokumentiertes Rest-Risiko bis zu einem eigenen Vertrag
- S5 Commercial Provenance wird nicht vorgezogen
- Direkter RPC-Bypass bleibt dasselbe Residual wie beim Flug

---

## ADR-0167 – Official-Compatibility aggregiert fail-closed, nicht first-evaluation

**Datum:** 26. August 2026  
**Status:** integriert auf `main` via PR #84 / `2468160e`; schließt P1-TA-02. Keine Schema-/Contract-Änderung. P2-TA-06 bleibt offen.

**Entscheidung:** Kanonische Official-Wahrheit bleibt `OfficialEvaluation[]`. Das Legacy-Feld `official` und die Item-/Summary-Presentation dürfen nur Aussagen machen, die für ihren Scope belegt sind. Bei heterogenen Traveller-, Credential-Option-, Destination- oder Transit-Scopes wird keine einzelne Evaluation als repräsentative Wahrheit gewählt. Presentation-Metadaten (Authority, Source URL, `checkedAt`, `validityUntil`) bleiben dann leer. `result` bleibt immer `unknown`. Item-Scope ohne exakten Treffer fällt nicht auf alle Evaluations zurück.

**Kontext:** Traveller-/Account-Audit P1-TA-02. `officialAusEvaluations` kopierte `evaluations[0]`. `officialFuer` fiel bei leerer Filtermenge auf die Gesamtmenge zurück. Die Reihenfolge der Evaluations bestimmte Authority und Reason. `ARCHITECTURE.md` verbot bereits die First-Hit-Reduktion; der Runtime-Pfad tat sie trotzdem.

**Alternativen:**

1. *`evaluations.at(-1)` oder eine andere feste Auswahl.* Bleibt willkürlich und reihenfolgeabhängig.
2. *Legacy-`official` entfernen.* Breaking API ohne Bedarf; Consumer existieren.
3. *Neue regulatorische Winner-Logik.* Würde Visa-/Entry-Wahrheit erfinden. Verboten.

**Begründung:** Ein Reisender kann mehrere Staatsbürgerschaften und Dokumente haben. Mehrere Reisende und Destinationen/Transits dürfen nicht zu einer künstlich eindeutigen Einreiseprüfung kollabieren. Compatibility darf nur ableiten, nicht entscheiden.

**Konsequenzen:**

- `officialAusEvaluations` ist permutationsstabil
- `officialFuerItem` ist fail-closed pro Item-Scope
- P2-TA-06 (`documents[0]` in `travellerNormalisieren`) bleibt ein separates latentes Residual
- Kein neuer Traveller-Shared-Contract

---

## ADR-0168 – Commercial Provenance ist ein eigener Vertrag, kein UniversalOffer

**Datum:** 26. August 2026  
**Status:** S5-A Domain-Foundation integriert auf `main` via PR #83 / `3b317bc6`. S5-B nicht gestartet. Keine Persistenz. Volltext: `docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md`.

**Entscheidung:** Kommerzielle Wahrheit (Preis, Providerherkunft, Freshness, Währung) bekommt einen provider-neutralen Domainvertrag in `lib/commercial-provenance`. Die bestehenden Flight-/Hotel-/Activity-/Mobility-/Rental-Modelle bleiben fachlich getrennt. Der Vertrag komponiert Provenance, er ersetzt die Domänenoptionen nicht. Ein persistierter Snapshot ist niemals live. Fehlende Freshness bleibt `unknown`. Requested- und Quoted-Währung dürfen ohne Conversion-Evidence nicht gleichgesetzt werden. External References sind Provenance, nicht Trust, und provider-scoped. Mehrere belegte Quellen dürfen als Konflikt stehen bleiben. LLM/Assistant darf diesen Vertrag nicht erzeugen oder überschreiben. Actor und Source sind fail-closed getrennt: User-Intake/Manual sind keine Provider-Truth; Provider-Live-/Snapshot-Herkunft kommt nur aus einem trusted Adapter- oder Snapshot-Pfad. Untrusted Input defaultet nicht auf `system`.

**Kontext:** Der S4–S8-Audit (PR #77) hat den S5-Gap präzise belegt und den Shared Contract bewusst nicht implementiert. TW-8 und bezahlte Provider bleiben hinter diesem Vertrag und späteren Gates.

**Alternativen:**

1. *Felder still in jede Option-Zod und `trip_items` schreiben.* Würde Persistenz und Shared Persistence-Contracts ohne Production-Gate ziehen.
2. *Ein UniversalOffer.* Vermischt Flug-/Hotel-/Transport-Semantik und verletzt AGENTS.md Regel 19.
3. *S1 Ops zum Offer-Modell ausbauen.* S1 ist Operationsvertrag, keine Commercial-Truth.

**Begründung:** Zuerst der fail-closed Vertrag, dann später S5-B-Persistenz. Ohne Beobachtungszeit, Freshness und Währungsabgleich wäre jeder Preisvergleich erfunden.

**Konsequenzen:** Keine DB-Migration in S5-A. Altbestand ohne `retrievedAt` bleibt unknown. TW-8 startet nicht durch diesen Slice. Factories und Provider bleiben unverändert.

**Nachtrag 26. August 2026 (Technical-Lead HOLD):** Actor↔Source-Matrix, fail-closed Option-Binding, User-Intake ohne Fake-Provider und provider-scoped Vergleichsidentität. Siehe PR #83.

**Nachtrag 26. August 2026 (S5A-TL-05 bis S5A-TL-08):** `commercialTruthUebernehmen` ersetzt keine provider-belegte Hard Truth durch User-/Manual-Wahrheit; Provider-Refresh nur identitätsgebunden. `user_intake`/`manual` lehnen jede `providerId` ab. Fehlende Affiliate-Evidence bleibt `unknown`. Widersprüchliche `amount`/`amountStatus`-Paare werden abgewiesen.

**Nachtrag 26. August 2026 (S5A-TL-09 und S5A-TL-10):** Provider-Refresh braucht identische Domain, identische `providerId` und identische belegte `externalRef`. Gleiche Provider-ID ohne Offer-Ref ist kein Refresh. `providerOfferId` ist in S5-A kein gleichwertiger Identitätsschlüssel. Current-Quote-Display braucht belegte `quotedCurrency`; fehlende Requested-Währung bleibt in der Quote-Währung darstellbar, `requested != quoted` bleibt mismatch ohne Conversion.

---

## ADR-0169 – Admin-Zugang verlangt zentral aktuelles AAL2

**Datum:** 26. August 2026  
**Status:** Product-Owner-freigegebene Security-Regel; Application-Guard integriert auf `main` via PR #80 / `d3faa2a0`. Development-Migrationsartefakt versioniert; Production-Datenebene nicht angewendet. Auf dem Feature-Branch zuerst als ADR-0168 geführt; nach Integration von `main @ 3b317bc` auf **0169** verschoben, weil 0166–0168 dort bereits Guest→Account, Official-Compatibility und Commercial Provenance belegen.

**Entscheidung:**

- Jeder Zugriff auf den Jetnity-Admin-Bereich verlangt verifizierte Identität **und** ausreichende Admin-Rolle/Capability bzw. zulässigen Break-Glass-Pfad **und** `currentLevel === 'aal2'`.
- Die AAL-Prüfung sitzt zentral in `evaluateAdminAccess()`. Passwortlogin, Magic Link, OAuth, bestehende Sitzungen, Admin-Seiten, Server-Actions und Admin-APIs haben keine eigene schwächere Wahrheit.
- Entscheidend ist nur die aktuell erreichte Assurance. `nextLevel`, die Existenz eines TOTP-Faktors oder ein früherer Login ersetzen AAL2 nicht.
- Break-Glass umgeht AAL2 nicht. Es öffnet weiterhin nur die Oberfläche, und das erst nach AAL2.
- Ein AAL-Lookup-Fehler ist fail closed (`aal-lookup-failed` / 503). AAL1 nach bestehender Berechtigung ist `aal2-required` (Seite: `/admin/mfa`, API: 403 JSON).
- `/admin/mfa` liegt in `(public)`, damit der Step-up nicht hinter dem AAL2-Guard hängt. Return-Ziele sind auf interne Admin-Pfade begrenzt.
- Die Development-Migration `20260826090000_admin_aal2_data_plane.sql` zieht dieselben fünf administrativen DB-Fähigkeiten auf Rolle **und** JWT-`aal='aal2'`. Keine Production-Migration in diesem Slice.

**Kontext:** QS-2-Finding P1-QS2-01. Der Consumer-Login kannte bereits TOTP-Step-up; der Admin-Guard prüfte nur Identität und Rolle. Der Product Owner hat die zentrale verpflichtende Admin-AAL2-Regel am 26. August 2026 ausdrücklich genehmigt und nach dem TL-Finding zusätzlich das enge Admin-RLS-AAL2-Hardening. Das besondere Auth/MFA/AAL-Gate gilt nur für diesen engen Slice.

**Alternativen:** Nur den Passwortlogin patchen; AAL2 aus Faktor-Existenz oder `nextLevel` ableiten; Break-Glass von AAL2 ausnehmen; Step-up hinter `requireAdminPage` legen; AAL2 nur in der App und nicht in den DB-Fähigkeiten.

**Begründung:** Ein gestohlenes Erstfaktor-Passwort eines Admin-Kontos darf privilegierte Flächen und die administrative Datenebene nicht öffnen. Eine Login-only-Prüfung würde Magic Link, OAuth und bestehende AAL1-Sitzungen durchlassen.

**Konsequenzen:** Kein allgemeiner Auth-/Session-Umbau, kein Passkey-Rollout, kein Rollen-/Ownership-Neudesign, kein P1-QS2-02, keine Production-Aktivierung. Admins ohne verifizierten TOTP-Faktor bleiben aus `/admin` ausgesperrt und bekommen den bestehenden Account-Security-Pfad.

---

## ADR-0170 – HTML-Metadata folgt `darfIndexieren`; Canonical ist nie ein Vercel-Alias

**Datum:** 26. August 2026  
**Status:** Runtime-Closure für **P1-D0-LIVE-01**; integriert auf `main` via PR #86 / Exact Head `0f809857` / Merge `38ec8be7`. Kein D1/G1. Kein Domain-Cutover. Kein Public Indexing.

**Entscheidung:**

- Root- und Public-Layout setzen HTML-`robots` und GoogleBot ausschliesslich über `htmlRobots()`.
- `darfIndexieren === false` bedeutet `index: false` und `follow: false` für HTML und GoogleBot. Kein Layout darf das hart auf `true` setzen.
- Öffentliche Canonicals, `metadataBase`, OpenGraph-URL und Homepage-JSON-LD-`url` verwenden immer `https://jetnity.com`.
- `*.vercel.app`, localhost und andere technische Hosts dürfen niemals als Jetnity-Canonical oder öffentliche Produktdomain erscheinen.
- `NEXT_PUBLIC_ALLOW_INDEXING` bleibt fail-closed. Dieser Slice aktiviert kein Indexing, kein DNS und keinen Domain-Cutover.

**Kontext:** D0-2 prüfte den Origin-Helper, robots.txt und Sitemap. Die Layouts riefen `oeffentlicherOrigin()` auf, nutzten aber nur `origin` und setzten `robots.index/follow` hart auf `true`. Production `https://jetnity-app.vercel.app` lieferte deshalb HTML `index, follow` bei deny-all `robots.txt` und Canonical auf den Vercel-Alias.

**Alternativen:** Canonical auf deny-Hosts weglassen; technische Origin weiter als `metadataBase` nutzen und nur robots schließen; Indexing auf dem Vercel-Alias erlauben.

**Begründung:** robots.txt und HTML-Metadata müssen dieselbe D0-2-Wahrheit tragen. Ein Vercel-Alias darf Jetnity nicht als indexierbare öffentliche Produktdomain behaupten, auch nicht vor dem späteren Domain-Cutover.

**Konsequenzen:** Kein D1/G1, keine Domainaktivierung, keine Env-Änderung, keine Abschwächung privater noindex-Grenzen. Der synthetische Allow-Pfad bleibt nur in Tests prüfbar. `/planen` emittiert robots explizit, damit Next.js den Layout-Vertrag nicht mit Default `index, follow` überschreibt.

---

## ADR-0171 – Finaler Continuity-Handoff dokumentiert den verifizierten Integrationsstand nach PR #86

**Datum:** 26. August 2026  
**Status:** docs-only Continuity-Entscheidung. Keine Runtime-, DB-, Auth- oder Provideränderung durch diesen Handoff. Auf dem Continuity-Branch zuerst als ADR-0170 geführt; nach Integration von PR #86 auf `main` auf **0171** verschoben, weil ADR-0170 dort bereits die HTML-Metadata-/Canonical-Grenze belegt. Historische integrierte ADRs wurden nicht umnummeriert.

**Entscheidung:** Nach unabhängiger Integration von PR #81, #84, #82, #83, #80 und **PR #86** ist der kanonische operative Stand `main @ 38ec8be79a6ce7758be81fd5d564819d638140d6`. Veraltete „current“-Aussagen, die diese PRs noch als Draft oder nächsten Slice führen, sind historical / superseded. TW6-A ist nicht gesamtes TW-6. S5-A ist nicht S5-B. Der Admin-AAL2-Application-Guard ist nicht die Production-DB-Aktivierung. P1-D0-LIVE-01 ist geschlossen; das ist kein D1/G1 und keine Indexing-/Domainaktivierung. Die per-PR-Merge-Pflicht vom 22./25. August bleibt historische Evidence und ist für normale Merges durch `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md` superseded.

**Kontext:** Der erste Continuity-Handoff (Draft-PR #85) dokumentierte `main @ d3faa2a0` nach PR #80. Danach hat der Technical Lead PR #86 unabhängig gemergt. Der Continuity-Branch muss den neuen Live-Stand tragen, ohne ADR-0170 von PR #86 umzunummerieren oder historische Evidence zu löschen.

**Alternativen:** Alte Statusdateien löschen; Runtime nachziehen; Branch Protection in diesem Auftrag setzen; den bereits integrierten ADR-0170 umnummerieren. Abgelehnt, weil Historie/Evidence erhalten bleiben muss, integrierte ADR-Nummern stabil bleiben und dieser Auftrag docs-only ist.

**Begründung:** Continuity darf keine tote Baseline als Current stehen lassen und darf keine Historie oder bereits integrierte ADR-Nummern zerstören.

**Konsequenzen:** Kanonisch sind `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`. Historische Checkpoints, Audits und Slice-Status bleiben erhalten und werden als historical / integrated markiert.

---

## ADR-0172 – Day→Stage Assignment Source als unterscheidbarer Trip-Vertrag

**Datum:** 26. August 2026  
**Status:** umgesetzt auf Draft-PR #87 / TW6-B Direction B; versioniertes Development-Migrationsartefakt. **Production nicht angewendet.** Kein Ready. Kein Merge.

**Entscheidung:** Die Herkunft der Day→Stage-Zuordnung ist ein dauerhafter, unterscheidbarer Vertrag auf `public.trips.day_stage_assignment_source` mit genau vier Semantiken:

- `legacy_fallback` – historischer Bestand; der bestehende proportionale Fallback bleibt erlaubt;
- `unassigned` – mehrere bestätigte Ziele ohne Nutzerzuordnung; kein Fallback, keine erfundene Aufenthaltslänge;
- `single_destination` – genau ein Ziel; alle Tage dürfen der einzigen Stage gehören;
- `user` – reserviert für später explizit bestätigte Nutzerzuordnung. In diesem Slice nicht setzbar.

Create-Server und `public.reise_anlegen()` leiten den Wert aus dem fachlichen Graphen ab. Ein Client darf `user` oder `legacy_fallback` nicht frei setzen, um Serverregeln zu umgehen. Guest und Account teilen dieselbe fachliche Wahrheit. Guest→Account überträgt Source plus leere Day→Stage-Zuordnung verlustfrei. Die Timeline darf unassigned Tage nicht als Aufenthalt unter Paris/Rom gruppieren.

**Kontext:** PR #87 hat mehrere bestätigte Ziele korrekt auf `trip_stages` abgebildet, aber `reise_anlegen()` und `tageEtappenZuordnen()` haben daraus eine sichtbare 2/2/2-Zuordnung gemacht. Product Owner hat Direction B als Fundament freigegeben: Multi-Ziel-Reisen dürfen echte Stages haben, während Tage ehrlich noch keinem Ziel zugeordnet sind. Direction A (explizite Aufenthalte) folgt später.

**Alternativen:**

1. *Globales Abschalten von `tageEtappenZuordnen()`.* Würde Altbestand ohne `stage_id` beschädigen.
2. *Nur UI-Bedingung oder Browser-Flag.* Würde Account-Persistenz und Guest→Account nicht binden.
3. *Boolean statt vier Semantiken.* Würde Legacy, unassigned, Single-Destination und spätere Nutzerwahl ununterscheidbar machen.
4. *Neue Stage-Tabelle oder Schattenpersistenz.* Verboten durch den Slice.

**Begründung:** Nur ein persistenter, serverseitig abgeleiteter Source/Mode-Vertrag trennt Altbestand vom neuen ehrlichen Unassigned-Zustand, ohne eine proportionale Erfindung als Nutzerwahrheit zu verkaufen.

**Konsequenzen:** Migration `20260826220000_trip_day_stage_assignment_source.sql` und der fail-closed Nachtrag `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` dürfen nur Development/Test treffen. Production bleibt unangetastet, bis eine eigene Product-Owner-Freigabe vorliegt. Keine Aufenthalts-UX, kein TW-7/TW-8/TW-9, kein automatischer Wechsel `unassigned` → `user`.

**Nachtrag, 26. August 2026 – identische TS-/SQL-Ableitung und offene Provenance-Gates.** Der unabhängige Technical-Lead-Finalreview hat zwei Blocker gefunden:

1. *Ableitung driftete.* SQL hat Client-`user` auf null gesetzt und bei vorhandener `stage_position` `legacy_fallback` persistiert. TypeScript lieferte `unassigned`. `public.reise_anlegen()` ist `SECURITY INVOKER` mit EXECUTE für `authenticated`; die TypeScript-Server-Action ist keine Trust-Grenze. Die kanonische Tabelle sitzt jetzt in `dayStageAssignmentSourceAbleiten()` und im Function-Replace `20260826230000`. `user`, `unassigned` und `single_destination` bei mehreren Stages werden in beiden Sprachen `unassigned` und übernehmen keine Client-Position.
2. *`legacy_fallback` ist historische Provenance, kein Client-Claim.* Ein frischer direkter Client kann weiterhin `legacy_fallback` plus `stage_position` senden – oder das Feld weglassen und Positionen mitschicken – und dieselbe Provenance erzeugen. Guest→Account alter localStorage-Reisen braucht genau diesen Weg, weil ohne Secret altes JSON und ein manipulierter Client nicht unterscheidbar sind. Ein übernommener Reisevorschlag (`vorschlagAlsNutzlast`) sendet keine Source, aber `stage_position` je Tag; SQL klassifiziert ihn deshalb als `legacy_fallback`. Das ist fachlich falsch und mit den vier genehmigten Semantiken nicht korrekt lösbar, ohne `user` allgemein zu aktivieren, einen fünften Wert zu erfinden oder die bestehenden Tageszuordnungen des Vorschlags zu zerstören.

Diese zwei Provenance-Punkte sind ein **Product-/Shared-Contract-Gate**. Kein fünfter Source-Wert. Keine Secret-/HMAC-Improvisation. Direction A bleibt ein eigener Slice.

**Nachtrag, 26. August 2026 – Production-Rollout ist ein eigenes Gate vor jedem Merge.** PR #87 darf nicht gemergt werden, solange Production den alten proportionalen `reise_anlegen()`-Vertrag hat. Die bestehenden TW6-B-Dateien sind kein isoliertes Mode-Replay: sie ersetzen die RPC vollständig und enthalten die Flug-Handelsfeld-Nullung aus `20260824160000`, während Production weder diese Nullung noch den Guard `20260824180000` hat. History-treuer Production-Weg: zuerst Commercial-Paar, dann `26220000`→`26230000`→`26240000`. AAL2 (`20260826052735` / Repo `20260826090000`) bleibt ausgeschlossen. Drei getrennte Product-Owner-Sätze, keine Sammelfreigabe. Details in `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md` Abschnitt 10.

**Nachtrag, 26. August 2026 – Rollout-Rollback fail-closed (TL P1-04/05/06).** Nach der Mode-Migration darf `reise_anlegen()` nicht auf den Gate-A-Text zurückgesetzt werden, solange `day_stage_assignment_mode` existiert: die Spalte ist `NOT NULL DEFAULT legacy_fallback`, Gate A schreibt sie nicht, und ein Create von aktuellem `main` würde neue `legacy_fallback`-Rows minten. Rollback nach Gate B bleibt Mode-aware oder sperrt Writes (`REVOKE EXECUTE` auf `reise_anlegen` und `REVOKE INSERT` auf `public.trips` für `authenticated`). Wenn `24160000` sitzt und `24180000` scheitert: STOP, Version und Function belassen, Guard erneut versuchen; kein undokumentiertes Function-Rewind. `26220000`/`26230000`/`26240000` sind ein transaktionales Bundle unter Write-Gate, kein nacheinander öffentlich live geschalteter Source-Zwischenstand. Production darf diese drei Versionen erst tragen, wenn die Dateien auf `main` oder in einem immutable Tag+Hash-Vertrag liegen. Mode-Semantik unverändert.

**Nachtrag, 26. August 2026 – Product-Owner-Freigabe Assignment Mode.** Der Product Owner hat den Technical-Lead-Vorschlag ausdrücklich freigegeben: der dauerhafte Vertrag ist ein **Assignment Mode**, nicht Herkunft. Die Development-Spalte heisst `day_stage_assignment_mode`. Die vier Modes sind `legacy_fallback` (nur bereits persistierter DB-Bestand), `unassigned`, `single_destination` und `explicit`. `explicit` bedeutet nur: konkrete gültige Day→Stage-Positionen wurden als Bestandteil der bestätigten Nutzlast übernommen. Es bedeutet nicht „manuell vom Nutzer editiert“. `user` ist kein persistierbarer Mode.

`public.reise_anlegen()` leitet den Mode aus der validierten Nutzlast ab und mintet für neue Requests niemals `legacy_fallback`. Claimed `legacy_fallback` oder alter `user` plus gültige Positionen werden `explicit`; ohne Positionen `unassigned`. Unbekannte Claims und out-of-range Positionen sind fail-closed (`22023`). Accepted Reisevorschlag und Guest/localStorage mit Positionen sind `explicit`. Historische Development-Rows bleiben `legacy_fallback`; nur dort darf der proportionale Fallback weiterlaufen.

Migration `20260826240000_trip_day_stage_assignment_mode.sql` gilt nur Development. Production bleibt unangetastet. Kein fünfter Mode. Keine separate Provenance-Spalte in diesem Slice. Direction A bleibt eigener Slice. TW6-B-P1-05/P1-06 sind runtime-seitig geschlossen, sobald der unabhängige Technical-Lead-Finalreview PASS erteilt.

**Nachtrag, 27. August 2026 – 0 Stages sind fail-closed.** `single_destination` bedeutet genau eine Stage, nicht `stageCount <= 1`. Ein neuer Create-/RPC-Request ohne bestätigte Stage wird mit `22023` / `DayStageAssignmentFehler` abgelehnt und persistiert keine Reise. TypeScript und SQL bleiben identisch. `20260826240000` bleibt unverändert (Development angewendet, über PR #89 auf `main`). Der Guard sitzt in der additiven Folgemigration `20260827010000_reise_anlegen_zero_stage_fail_closed.sql`. In-Memory-Entwürfe ohne Stage bleiben lesbar, minten aber kein `single_destination`; Guest-Create und Guest→Account ohne bestätigtes Ziel sind ebenfalls fail-closed. Production, Gate B, AAL2 und Direction A bleiben unangetastet.

**Nachtrag, 27. August 2026 – Gate 0B liegt auf `main`.** PR #91 hat `20260827010000` byte-identisch und den Vier-Datei-Vertrag `26220000 → 26230000 → 26240000 → 27010000` auf `main` gebracht. Dieser Runtime-PR schreibt die Migration nicht erneut, erzeugt keine fünfte Version und ändert das Playbook nicht. Ältere ADR-0172-Sätze mit Drei-Datei-Rollout bleiben historische Evidence; die Continuity-Wahrheit ist ADR-0173 inklusive Gate-0B-Nachtrag.

**Nachtrag, 27. August 2026 – Persistenzdefault `balanced` ist keine Nutzerwahl.** Technical-Lead Re-Review nach Production Gate B: `CREATE_PERSISTENZ_TEMPO='balanced'` bleibt der interne Kompatibilitätsdefault, wenn der Create kein Tempo anbietet. Die Workspace-Übersicht darf `reise.pace` / `Ausgewogen` nicht als bewusste Auswahl zeigen und keine Karte `Tempo & Interessen` für einen normalen neuen Create ohne persistierte Interessen oder Reisewunsch rendern. Ein vorhandener `travelWish` ist eigener Wunschtext. Persistierte Interessen dürfen ohne Tempo-Behauptung sichtbar bleiben. Änderungs-Copy lautet truth-safe `Zeitraum, Ziele oder Reisewünsche`. Keine neue Provenance- oder DB-Spalte. Keine Migration.

## ADR-0173 – TW6-B Gate-B-Dateien kommen migrations-only auf `main`; Apply nur transaktional unter Write-Gate

**Datum:** 26. August 2026  
**Status:** operative Vorbereitung. Dateien und Playbook existieren als Draft gegen `main`. **Kein Production-Apply. Kein Merge-Auftrag. Kein Runtime-Slice.** Nummer 0173, weil PR #87 bereits ADR-0172 für den Day→Stage-Vertrag reserviert.

**Entscheidung:**

- Die drei bereits geprüften Dateien `20260826220000`, `20260826230000` und `20260826240000` dürfen Production-History nur erreichen, wenn derselbe Byte-Stand zuerst auf `main` liegt. Bevorzugter Weg: migrations-only Vorbereitungs-PR ohne Multi-Ziel-UI, ohne AAL2, ohne übrigen PR-#87-Runtime-Code.
- Hash-Vertrag: `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` / `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` / `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb`.
- Production-Apply dieser drei Dateien läuft nicht über `db:anwenden`. `26220000`/`26230000` dürfen nicht öffentlich executable werden.
- Verbindlicher Apply-Pfad: Write-Gate committed setzen; drei Bodies plus `schema_migrations`-History in einer Transaktion; Mode-Vertrag vor Grant-Restore prüfen; bei Fehler `ROLLBACK` bei geschlossenem Write-Gate; Grants nur nach PASS exakt aus dem Snapshot wiederherstellen.
- `PRODUCTION_APPLY_FREIGEGEBEN` bleibt `false`, bis getrennte Product-Owner-Gates für Commercial und Gate B vorliegen und der Technical Lead das Playbook unabhängig reviewed.

**Kontext:** Technical-Lead-Review auf PR #87 Exact Head `0b7d6cfd5b34ffd3e9c0a96779ee51df999bcc67`: PLAN PASS / PRODUCTION EXECUTION BLOCKED. Gate 0 und P2-02 waren die offenen operativen Voraussetzungen.

**Alternativen:** Immutable Tag plus SHA-256 ohne `main`-Dateien; dateiweises `db:anwenden`; Production-Apply aus dem verwerfbaren Draft #87. Abgelehnt, weil History nicht an einen Draft gebunden werden darf und Zwischenzustände `legacy_fallback` minten können.

**Begründung:** Production darf keine Migrationsversion tragen, die nur auf einem später verworfenen Draft lebt. Der Source-Zwischenstand ist fachlich falsch und darf nie öffentlich executable sein.

**Konsequenzen:** Dieser Slice ändert Production nicht, merged nichts und startet keine Multi-Ziel-UI. PR #87 bleibt der Runtime-Draft. AAL2 bleibt excluded.

**Nachtrag, 27. August 2026 – Gate 0B Vier-Datei-Vertrag (P1-TW6-B-ROLLOUT-08).** Der Runtime-/Zero-Stage-Fix auf PR #87 Exact Head `b93a6fff213b3bb61a9efde84050f46fc0673cf4` ist auf Development bestätigt. Das Gate-B-Playbook auf `main` darf deshalb nicht bei `26220000 → 26230000 → 26240000` stehen bleiben: `26240000` würde 0 Stages als `single_destination` persistieren. Additive, unveränderte Folgedatei `20260827010000_reise_anlegen_zero_stage_fail_closed.sql` gehört in denselben Write-Gate-Bundle, Hash `b516bfff24e9e6f5dd909a9cfd4e76aa1a54708b067d1a5d3e935b8482c6adf1`, byte-identisch vom geprüften PR-#87-Head. Verbindliche Reihenfolge: `26220000 → 26230000 → 26240000 → 27010000`. `db:anwenden` lehnt alle vier dateiweise ab. Final Verify muss 0-Stage fail-closed, genau vier History-Versionen, kein neues `legacy_fallback` und erhaltene Commercial-Gate-A-Semantik beweisen. Development nicht erneut anwenden. Production bleibt unangetastet. Kein Runtime-/UI-Code aus PR #87. `PRODUCTION_APPLY_FREIGEGEBEN` bleibt `false`.

**Nachtrag, 27. August 2026 – PR #87 nimmt Gate 0B nicht erneut auf.** Nach Integration von PR #91 / Continuity PR #92 bleibt der Vier-Datei-Vertrag die `main`-Wahrheit. Der Runtime-Draft synchronisiert sich mit diesem Stand und darf `27010000` weder umschreiben noch ein zweites Migrationsartefakt anlegen.

---

## ADR-0174 – Visitor Search zeigt natürliche Namen, persistiert nur kanonische IDs

**Datum:** 27. August 2026  
**Status:** umgesetzt und auf `main` (PR #94)

**Entscheidung:** Orts- und Flughafensuche bleiben lokale Read-only-Routen (`/api/search/places`, `/api/search/airports`). Die UI akzeptiert natürliche Namen. Vorschläge sind Auswahlhilfe. Persistierte Wahrheit bleibt die kanonische Place-ID bzw. ein aus der Liste bestätigter IATA-Code. Rang folgt allgemein Exact > starker Prefix > späteres Wort/Keyword und der Rolle (`ziel` / `abreise`). Die Liste wird nicht aufgefüllt, nur damit sie lang wirkt. Ein Stadtname mit mehreren plausiblen Flughäfen zeigt die Auswahl; Jetnity erfindet keinen Code. Trip-Origin/Destination werden nur dann als Flughafen vorausgefüllt, wenn die Place-ID `airport:XXX` ist.

**Kontext:** Nach gemergtem PR #87 war die nächste visitor-facing Korrektur die natürliche Suche. Die alte Rangliste füllte bis 12 Treffer inkl. Keyword-Backfill; Flight-Von/Nach verlangten drei Buchstaben und extrahierten IATA aus Freitext.

**Alternativen:**

1. *Neuer Geocoding-/Airport-Provider.* Abgelehnt: Kosten, Truth-Grenze, Non-Scope.
2. *Peru-/Zürich-Hardcodes.* Abgelehnt: muss weltweit generalisieren.
3. *Freitext als IATA, wenn er drei Buchstaben hat.* Abgelehnt: unbestätigter Text ist keine Airport-Wahrheit.

**Begründung:** Ein normaler Reisender darf keine technischen Orts- oder Flughafenkenntnisse brauchen. Komplexität bleibt intern.

**Konsequenzen:** Keine Schema- oder Production-Änderung. Kein neuer laufender Provider. Commercial Flight Truth unverändert. Der Implementation-Draft ist durch Technical-Lead PASS `5040199350` auf Exact Head `8da869fd` gemergt.

**Nachtrag, 27. August 2026 – Combobox-Option und Current-Request-Grenze.** Technical-Lead-Finalreview CHANGES REQUIRED auf PR #94: `role="option"` darf keinen verschachtelten Button tragen; die Option selbst ist die auswählbare Interaktion. Abgebrochene oder überholte Suchläufe dürfen Loading, Treffer und Fehler der aktuellen Anfrage nicht überschreiben. Ranking, Place-ID- und IATA-Wahrheit bleiben unverändert.

**Nachtrag, 27. August 2026 – PR #94 gemergt.** Reviewed Exact Head `8da869fd2756f3c1514de6d33678c8c7abfad1c4`. P1 und P2 sind auf diesem Head geschlossen. Merge-Commit `819715b1567417893d894b7b110eff1a2ab6cded`. Post-Merge Actions `33067498607` SUCCESS; Vercel `GrD4MaYqtnR9UL619gVnKx9HSUmH` SUCCESS. Es gibt keinen offenen Visitor-Search-Implementation-Draft.

---

## ADR-0175 – Admin-AAL2-Datenebene wird forward-only nach dem Production-Head aligned

**Datum:** 27. August 2026  
**Status:** Autorenarbeit auf Draft-PR #98. **Kein Ready. Kein Merge. Kein Production-Apply.** Historische Repo-Datei `20260826090000_admin_aal2_data_plane.sql` bleibt unveränderte Evidence.

**Entscheidung:**

- Production-Data-Plane AAL2 wird nicht durch Umbenennen, Löschen oder Rückdatieren der historischen Development-/Repo-Migration hergestellt.
- Stattdessen kommt eine neue, nach dem aktuellen Production-Head datierte Alignment-Migration: `20260827170000_admin_aal2_data_plane_alignment.sql`.
- Der Vertrag bleibt der bereits genehmigte aus ADR-0169: administrative Fähigkeit = unveränderte Mindestrolle **UND** signierter JWT-Claim `auth.jwt() ->> 'aal' = 'aal2'`.
- `aktuelles_admin_aal2()` und die fünf `darf_*()` werden nur per `CREATE OR REPLACE` gesetzt. Keine Policy-, Tabellen- oder Ownership-Mutation.
- AAL kommt ausschließlich aus `auth.jwt()`. Fehlender, leerer, `aal1` oder malformed Wert ist fail closed. Faktor-Existenz, `nextLevel`, User-Metadata und Break-Glass ersetzen AAL2 nicht.
- Grants bleiben `authenticated`/`service_role`; `public`/`anon` bleiben ohne EXECUTE. Helper/Capabilities: `SECURITY INVOKER`, `search_path = pg_catalog`.
- Der Apply auf Production `qscbgcdmivbbnzrcyegn` bleibt ein separates ausdrückliches Product-Owner-Gate. Dieser Slice bereitet nur vor.

**Kontext:** Finding `P1-AAL2-PROD-01`. Application-Guard ist auf `main` (PR #80). Production-Head ist `20260827010000_reise_anlegen_zero_stage_fail_closed`. Development live führt `20260826052735_admin_aal2_data_plane`; das Repository führt dieselbe Semantik als `20260826090000`. Production hat keine AAL2-Data-Plane-Version, daher kann ein privilegiertes AAL1-JWT direkte PostgREST/RPC-Pfade nutzen.

**Alternativen:** Historische Datei auf Production nachziehen; Development-Version umbenennen, damit die Nummern übereinstimmen; AAL2 nur in der App belassen. Abgelehnt, weil History-Fälschung und unvollständige Datenebene das P1 offen lassen.

**Begründung:** Forward-only Alignment nach dem echten Production-Head hält Development-Semantik und Production-History ehrlich und schließt die direkte JWT-Lücke, sobald der Product Owner den Apply ausdrücklich freigibt.

**Konsequenzen:** Kein Rollenmodell-, Auth-, Consumer-RLS- oder Ownership-Umbau. Keine `types/supabase.ts`-Regenerierung in diesem Slice. Keine Production-Änderung durch Autorenarbeit oder späteren normalen Merge allein.

**Nachtrag, 27. August 2026 – PR #98 gemergt.** Merge-Commit `beaef64a151adceb8f5bc759f58ae9ad13cecc51`. Die Alignment-Datei liegt auf `main`. Production-Apply bleibt ein separates ausdrückliches Product-Owner-Gate. Ältere ADR-0175-Sätze „Draft-PR #98 / kein Merge“ sind historische Evidence vor diesem Merge.

**Nachtrag, 27. August 2026 – versionstreuer Einmal-Runner (Issue #101).** Der Production-Apply dieser einen Datei läuft nicht über MCP `apply_migration` und nicht über `db:anwenden`. Ein fail-closed Runner (`npm run db:aal2-prod-apply`) pinnt Blob/SHA-256/Version/Name, verlangt `--schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn`, prüft Head `20260827010000` plus fehlende Funktion/History und schreibt SQL + History + Contract-Verify atomar. Die Phase-3.1-Grenze `20260820130000` bleibt unverändert. Dieser Nachtrag autorisiert keinen Apply; er beschreibt nur den Apply-Pfad.

**Nachtrag, 27. August 2026 – TL-Review `5043150656`.** Die Apply-Transaktion terminiert jedes Statement, verifiziert den Vertrag vor COMMIT, vergleicht `profiles_*`/Trip/Traveller-RLS gegen einen Preflight-Snapshot und prüft History per exakter Version/Name plus JS-Bytevergleich. Der Fail-Path beweist auf Development eine zurückgerollte Capability-Mutation. Der Schlusssatz „Kein Production-Apply.“ ist **historische Pre-Apply-Evidence** vor Kommentar `5442474653`.

**Nachtrag, 27. August 2026 – Production-AAL2 angewendet und verifiziert.** Technical Lead hat nach PASS-Review `5043413423` und unverändert grünem Live-Preflight exakt `20260827170000_admin_aal2_data_plane_alignment.sql` auf Production `qscbgcdmivbbnzrcyegn` angewendet. Evidence: PR-#102-Kommentar `5442474653`. Live: Head `20260827170000` / `admin_aal2_data_plane_alignment`; History-Count **1**; History-Statement 5098 Bytes, MD5 `2287c632defa4dce740d968aa28c1290`; Datei SHA-256 `ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934`, Git-Blob `4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375`. `public.aktuelles_admin_aal2()` ist live. Alle sechs AAL2-/Capability-Funktionen bleiben `SECURITY INVOKER` mit `search_path=pg_catalog`; PUBLIC/anon ohne EXECUTE; `authenticated`/`service_role` mit EXECUTE. Die fünf Admin-Capabilities verlangen unveränderte Mindestrolle **UND** `aktuelles_admin_aal2()`. `profiles-*`-/Trip-/Traveller-RLS blieb unverändert (35 Policies, MD5 vor und nach Apply `e128e250656cf8d53c386c0a333d8a0e`). Ältere ADR-0175-Sätze „Kein Production-Apply“, „Apply bleibt ein separates Gate“, „Dieser Nachtrag autorisiert keinen Apply“ und „STOPP vor Apply“ sind historische Pre-Apply-Evidence. **Kein zweiter Apply.** Dieser Nachtrag ändert keinen Runtime-Code und schreibt Production nicht. ADR-0176 bleibt unberührt.

---

## ADR-0176 – TW-7 Rest-Gap ist Hub-Kartenidentität, nicht AP-3

**Datum:** 27. August 2026  
**Status:** Spec durch PR #100 versioniert. **TW7-A Runtime durch PR #106 integriert.** Issue #103 ist CLOSED / completed.

**Entscheidung:** Der TW-7-Hub-Anschluss darf AP-3, den bestehenden Weg `/account` → `/reisen` → `/reisen/[tripId]` → `TripWorkspace` und die Guest-One-Trip-Regel nicht neu bauen. Der belegte Rest-Gap ist die Mehrziel-Identität auf `Reisekarte` plus die Gast-`itemCount`-Abbildung. Der spätere kleine Runtime-Slice TW7-A ist read-only und verwendet denselben Ortstext wie die Workspace-Übersicht.

**Kontext:** TW-7-Start-Gate aus dem Implementierungsplan; ADR-0160; ADR-0164; Transformation Scope Policy; Product-Owner PR-34 Mehrziel-Reisekarte; TL-Rekonstruktion Abschnitt 9. `TripSummary` trägt nur `stageCount`. `reisenLaden()` liest `trip_stages(count)`.

**Alternativen:** AP-3-Gruppen im Workspace duplizieren; Attention/Coverage auf Hub-Karten; Account-Übersicht zum zweiten Workspace machen; Archiv in TW-7 filtern. Abgelehnt, weil das fremde Verträge überschreibt.

**Begründung:** Eine Reise, eine Oberfläche. Der Weg ist schon einer. Die Karte darf eine Mehrzielreise nicht als Einzeltitel verkaufen.

**Konsequenzen:** Runtime nur über den eigenen Auftrag Issue #103 / PR #106. Production-Write, AAL2-Re-Apply, AP-4, TW-8 und Homepage bleiben unberührt. Live-`main` immer live prüfen; keine bewegliche Exact-Head-SHA als kanonische Live-Wahrheit.

**Nachtrag, 27. August 2026 – Runtime Issue #103 / PR #106.** Technical Lead / Product Owner hat den read-only Slice TW7-A als eigenen Runtime-Auftrag freigegeben. PR #106 ist das Integrationsvehikel. Nach Landung: TW7-A Runtime integriert; Issue #103 ist CLOSED / completed. Historische Start-Baseline: `963186f4ec75501efd253a287131f464a5fd0fdb` (PR #102). Alter Branch `cursor/tw7-hub-gap-slice-b13d` ist nicht die Basis. Ältere Sätze „Draft / nicht auf main / live main bleibt 963186f4“ sind Pre-Merge-Evidence.

---

## ADR-0177 – AP-4 Restore-Provenienz bleibt namespaced Metadata, kein Default-Status

**Datum:** 27. August 2026  
**Status:** auf `main` gemergt (PR #108, `70cac163`). Ältere Sätze „Draft-Branch / nicht auf `main`“ sind Pre-Merge-Evidence.

**Entscheidung:**

- Archivieren/Wiederherstellen nur für Konto-Reisen über einen Server-Action-Schreibweg.
- Beim Archivieren wird der gelesene Status `draft`/`planned`/`booked` unter `trips.metadata.account_archive.previous_status` erhalten.
- Beim Wiederherstellen darf nur dieser gültig belegte Status gesetzt werden.
- Historische `archived`-Zeilen ohne gültige Provenienz: fail-closed, kein Default.
- Optimistic Guard gegen den gelesenen Ausgangsstatus **und** das gelesene `updated_at` (bestehende Zeilenversion über `trips_aktualisiert_am`). Ein gleichbleibender Status mit geänderter Metadata darf nicht überschrieben werden.
- Restore entfernt nur `account_archive.previous_status`. Bestehende Geschwister unter `account_archive` bleiben; der Namespace fällt nur weg, wenn er danach leer ist.
- Keine AP-4-eigene Größengrenze für `trips.metadata`.
- Keine Migration, keine RLS-/Auth-/AAL-Änderung, kein Service Role, kein Guest-Archiv.

**Kontext:** AP-3 gruppiert date-only und filtert `archived` nicht. `/account` filtert `archived` bereits lesend aus Fortsetzen. Es gab keinen Runtime-Write auf `status = archived`. Eine naive Wiederherstellung auf pauschal `planned` würde den früheren Status erfinden.

**Alternativen:** neue DB-Spalte; Default auf `planned`; Guest-Archiv in Local Storage; Service-Role-Write. Abgelehnt, weil der Slice keine Migration/RLS braucht und `trips.metadata` ausdrücklich Begleitinformation ist.

**Begründung:** `trips.status` hat bereits vier Werte. Ohne Provenienz ist Restore nicht verlustfrei. Metadata bleibt ungefiltert; der Filter ist `status`.

**Konsequenzen:** Aktiv/Kommend/Vergangen/Ohne Datum enthalten keine archivierten Reisen. `/reisen` hat einen eigenen Archiv-Abschnitt. TW7-A-Kartenidentität bleibt unverändert.

**Nachtrag, 27. August 2026 – Exact-Head Review P1/P2.** Ein status-only Guard war nicht fail-closed genug: derselbe Status mit geänderter Metadata hätte den gelesenen Snapshot überschrieben. Der Write matcht deshalb zusätzlich das gelesene `updated_at`. Restore löscht nicht mehr den ganzen `account_archive`-Namespace. Die erfundene 8-KB-Grenze für `trips.metadata` ist entfernt; sie war ein Vertrag von `trip_items.metadata`, nicht von `trips.metadata`.

**Nachtrag, 27. August 2026 – Merge.** Technical-Lead Final Re-Review PASS auf Exact Head `88146dd5`. PR #108 gemergt als `70cac163`. Residual: kein authentifizierter Browser-/Real-Device-Beweis für die Archiv-UI; QA-Evidence-Debt, kein Merge-Gate.

---

## ADR-0178 – Readiness-Normalisierung leitet N Credential-Optionen aus N Dokumenten ab

**Datum:** 27. August 2026  
**Status:** Technical-Lead Slice Decision; Runtime auf Draft-Branch `cursor/p2-ta-06-credential-normalization-3317`. Nicht auf `main`, bis der unabhängige Exact-Head-Review entscheidet.

**Entscheidung:** `travellerNormalisieren()` darf fehlende oder leere `credentialOptions` nicht mehr auf `documents[0]` / einen Default-Pass reduzieren. Gelieferte nicht-leere Options bleiben autoritativ. Sonst entsteht eine Option je Dokument. Ohne Dokumente bleibt Legacy-Singular eine Kompatibilitätsoption oder die explizite `:none`-Option. Issuer Country wird nicht als Citizenship gelesen.

**Kontext:** P2-TA-06 war ein latentes Legacy-/Direct-Caller-Risiko. Der kanonische App-Pfad setzt Options bereits über `credentialOptionsAus`. Issue #112 schließt den Normalisierungspfad, bevor ein neuer Caller den First-Document-Fallback trifft.

**Alternativen:**

1. *Fail-closed leere Options / Fehler werfen.* Würde Legacy-Caller härter brechen als nötig.
2. *Shared Traveller-Contract / AP-7 erweitern.* Nicht nötig und ausdrücklich Non-Scope.
3. *Nur Tests ändern, Runtime lassen.* Lässt den Default-Pass im Contract-Pfad.

**Begründung:** Der bestehende Requirements-Port trägt bereits `documents[]` und `credentialOptions[]`. Die 1:n-Ableitung ist dieselbe Semantik wie `credentialOptionsAus`, ohne neuen Shared Contract.

**Konsequenzen:**

- Mehrere Dokumente bleiben mehrere bewertete Optionen.
- Official `result` bleibt ohne Provider `unknown`.
- Keine Migration, keine RLS-/Auth-/AAL-Änderung, kein AP-7.
- Autor-Agent merged nicht.

**Nachtrag, 27./28. August 2026 – Merge.** Live-Evidence: PR #113 ist gemergt (`286d26fe`); Issue #112 ist CLOSED / completed. Der Satz „Nicht auf `main`, bis der unabhängige Exact-Head-Review entscheidet“ und „Autor-Agent merged nicht“ sind **pre-merge evidence**. Aktueller Status: **auf `main` integriert**. P2-TA-06 nicht erneut öffnen. AP-7 bleibt Non-Scope.

---

## ADR-0179 – Kanonischer Account-Platform-Plan wird gegen aktuellen `main` rekonstruiert

**Datum:** 28. August 2026  
**Status:** vorgeschlagen auf Draft-PR #117 / P2-TA-03; docs-/architecture-only. Keine Runtime.

**Entscheidung:**

- `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` auf dem aktuellen Integrationspfad ist der **kanonische** Steuerungsvertrag für AP-5–AP-12.
- Die gleichnamige Datei auf Draft-PR #39 / `audit/account-platform` bleibt **historische Evidence** und wird nicht kopiert, nicht als Current Truth gemergt und nicht gelöscht.
- AP-1–AP-4 sind integriert und dürfen nicht erneut als zukünftige Arbeit geplant werden.
- Die Nummerierung AP-5–AP-12 bleibt. Das ist keine stille Änderung der Binding Build Order.
- Die historische Annahme „derselbe unnummerierte Agent führt alle Account-Slices sequenziell weiter“ ist durch `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md` **superseded**.
- Die historische per-PR-Product-Owner-Merge-Pflicht ist durch `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md` **superseded**. Besondere Product-Owner-Gates bleiben.
- AP-7 bleibt hinter Shared-Contract + Product-Owner + ADR-Nachfolger zu ADR-0102/0117. Dieser Slice erfindet keinen Registry-Vertrag.
- Dieser Slice startet keine AP-5-Runtime.

**Kontext:** Der Binding Build Order verweist auf eine Datei, die auf aktuellem `main` fehlte. Der historische Plan ist 513 Commits hinter `main` und enthält Pre-AP-4- sowie supersedierte Agent-/Merge-Annahmen. Issue #116 / P2-TA-03 schließt die Continuity-Lücke vor jeder weiteren Account-Runtime.

**Alternativen:**

1. *Historische PR-#39-Datei unverändert nach `main` kopieren.* Würde Pre-AP-4- und Agent-Annahmen als Current Truth importieren.
2. *Nummerierung AP-5–AP-12 still neu schneiden.* Wäre eine fundamentale Build-Order-Änderung ohne Product-Owner-Entscheidung.
3. *Nur in Chat/Handoff erklären, ohne kanonische Datei.* Würde die Binding-Build-Order-Referenz weiter brechen.

**Begründung:** Live-`main` plus integrierte ADRs/PRs sind die Steuerungswahrheit. Historische Evidence bleibt lesbar, darf aber keinen Folgeslice mehr steuern.

**Konsequenzen:**

- Neue Chats lesen diese Datei, nicht PR #39, als Account-Folgeplan.
- AP-5/AP-6a/AP-7+ brauchen je einen eigenen Task und frischen Agenten.
- Keine Runtime, keine Migration, keine Config durch P2-TA-03.
- D0-P1-03 bleibt als AP-6a-/Legal-PO-Residual sichtbar, nicht als stiller AP-5-Scope.

**Nachtrag, 28. August 2026 – Merge.** Live-Evidence: PR #117 ist gemergt (`b912315d`); Issue #116 ist CLOSED / completed. Der Satz „vorgeschlagen auf Draft-PR #117“ ist **pre-merge evidence**. Der Plan auf `main` ist kanonisch. P2-TA-03 nicht erneut öffnen. Kein AP-5-Start.

---

## ADR-0180 – P2-TA-04 Gate 0: Direct Traveller-DML ist kein unterstützter Vertrag und kein P0

**Datum:** 28. August 2026  
**Status:** vorgeschlagen auf Draft-PR #120 / P2-TA-04 Gate 0; Audit-/Architecture-only. Keine RLS-/Grant-/Runtime-Änderung.

**Entscheidung:**

- Direct authenticated DML auf `trip_travellers`, `trip_traveller_citizenships` und `trip_traveller_documents` ist **kein** unterstützter Produktvertrag.
- Es gibt **kein** bewiesenes Cross-User-P0. Owner-RLS und Composite-FKs halten die Ownership-Grenze.
- Der aktuelle App-Delete-Pfad `travellerEntfernen` und das SECURITY-INVOKER-RPC `party_schreiben` **brauchen** heute Tabellen-DML-Rechte. Ein blindes `REVOKE` ist deshalb unsicher/bruchgefährdend.
- Empfohlene Closure ist der gestufte fail-closed Schnitt (Option C): zuerst kanonische Delete-Semantik plus fehlende DB-Invarianten (C1), danach erst ein Privilegien-Schnitt mit möglichem SECURITY DEFINER (C2).
- C1/C2 sind **nicht** durch diesen ADR ausgeführt. Jede Grant-/RLS-/DEFINER-/Production-Migrationsänderung braucht ein ausdrückliches Product-Owner-Gate.

**Kontext:** P2-TA-04 aus dem Traveller-Audit. Live Production 28. August 2026 bestätigt CRUD-Grants für `authenticated`, Owner-RLS und INVOKER-`party_schreiben`. Die App schreibt Children nicht direkt, löscht den Parent aber direkt.

**Alternativen:**

1. *Option A – Direct DML als supported Contract.* Würde ADR-0119 aufweichen und alle RPC-only-Invarianten in die DB zwingen, ohne den dualen Pfad zu schliessen.
2. *Option B – sofort REVOKE oder DEFINER.* Bricht den aktuellen Delete-Pfad und das INVOKER-RPC, oder führt DEFINER beiläufig ein.
3. *Nichts tun.* Lässt den Write-Contract weiter umgehbar, inkl. Party-Cap und UPDATE-Reparent.

**Begründung:** Ownership-Security und Write-Contract müssen getrennt bleiben. Least Privilege ist das Ziel, aber nur nachdem der kanonische Write-Pfad Delete und Party-Cap tragen kann, ohne INVOKER zu zerbrechen.

**Konsequenzen:**

- Kein REVOKE, kein DEFINER, keine Migration in P2-TA-04 Gate 0.
- Ein späterer Implementation-Slice braucht eigenen Task, frischen Agenten, unabhängigen Review und das passende Product-Owner-Gate.
- AP-5/AP-6a/AP-7 bleiben unberührt.

**Nachtrag, 28. August 2026 – C1 Product-Owner-Freigabe.** Der Product Owner hat C1 ausdrücklich freigegeben (Issue #122). Gate-0-Sätze „C1/C2 sind nicht durch diesen ADR ausgeführt“ bleiben für Gate 0 wahr. Die C1-Ausführung steht in ADR-0181. C2 bleibt unberührt und weiter Product-Owner-gated.

---

## ADR-0181 – P2-TA-04 C1: Write-Contract-Integrität ohne Privilegien-Schnitt

**Datum:** 28. August 2026  
**Status:** Implementation-Slice C1 auf Draft-PR #126 / Issue #122. Kein C2. Production C1 ist unter der bestehenden Product-Owner-C1-Freigabe vom Technical Lead angewendet und live verifiziert. Kanonische Production-/Repo-Version: `20260828015304`.

**Entscheidung:**

- Traveller-Delete läuft kanonisch über `public.party_loeschen(jsonb)` als **SECURITY INVOKER**.
- `travellerEntfernen` darf nicht mehr `.from('trip_travellers').delete()` aufrufen.
- Die Datenbank erzwingt höchstens 20 `trip_travellers` je `(user_id, trip_id)` auch für direktes DML, inkrementelles `party_schreiben` und Reparenting.
- Die Serialisierung nutzt `FOR NO KEY UPDATE` auf der Zielreise, nicht ein nacktes `count(*)`.
- Child-Limits 8 Citizenships / 12 Documents gelten nach INSERT **und** UPDATE/Reparenting.
- Authenticated Tabellen-DML bleibt bestehen. Kein REVOKE. Kein SECURITY DEFINER. Keine RLS-/Ownership-Änderung.

**Kontext:** Gate 0 / ADR-0180 hat Direct DML als nicht unterstützten Vertrag klassifiziert, aber keinen P0-Ownership-Bruch bewiesen. C1 vervollständigt die fehlenden Invarianten, damit ein späteres C2 die Privilegien schliessen kann, ohne den aktuellen INVOKER-Pfad zu zerbrechen.

**Alternativen:**

1. *Nur App-Validierung.* Umgehbar per PostgREST/DML und unter Parallelität.
2. *Advisory Lock statt Trip-Row-Lock.* Funktioniert, braucht aber einen zweiten Sperrnamensraum. Die bestehende Child-Limit-Begründung (ADR-0121) spricht für `FOR NO KEY UPDATE` auf der Parent-Zeile.
3. *C1+C2 in einem Schnitt.* Würde DEFINER/REVOKE ohne getrennte Evidence einführen.
4. *Party-Cap nur in `party_schreiben`.* Lässt direkten INSERT und Reparent offen.

**Begründung:** Die Invarianten müssen dort gelten, wo Direct DML und parallele Writes ankommen: in der Datenbank. INVOKER hält Least Privilege auf dem aktuellen Grant-Modell. Die Trip-Sperre schliesst das MVCC-Fenster, das Gate 0 für den Party-Cap beschrieben hat.

**Konsequenzen:**

- Kanonische Repo- und Production-Migration: `20260828015304_traveller_write_contract_integrity.sql`.
- Dieselbe C1-SQL wurde zuvor auf Supabase `develop` unter der historischen/develop-only Version `20260828120000` angewendet. Diese Develop-History nicht still umschreiben; Technical Lead besitzt spätere Develop-History-Sanitation.
- Production C1 ist angewendet und live verifiziert. Kein erneuter Production-Apply. Kein Develop-Rebase/Reset/Re-Apply aus diesem Slice.
- C2 (DEFINER + Tabellen-DML-REVOKE) startet nicht aus diesem ADR.
- AP-5/AP-6a/AP-7, Auth/MFA/AAL, Passportnummern/Scans/MRZ/Biometrie bleiben Non-Scope.

**Nachtrag, 28. August 2026 – Production-C1 live, Repo-Version reconciled.** Technical Lead hat C1 unter der bestehenden Product-Owner-Freigabe (Issue #122) auf Production angewendet und live verifiziert. Supabase registrierte die Migration als `20260828015304_traveller_write_contract_integrity`. Das Repo führt dieselbe funktional identische SQL jetzt unter genau diesem Dateinamen. Die frühere Author-Evidence `20260828120000` auf `develop` bleibt historische/develop-only Evidence derselben SQL. Ältere ADR-Sätze „Kein Production-Apply durch den Author“ und „Production-Apply bleibt ein besonderes Product-Owner-Gate“ bleiben für den Author-Slice wahr und sind Pre-Apply-Evidence vor diesem Nachtrag. C2 bleibt nicht gestartet und weiter Product-Owner-gated. Dieser Review-Fix verändert Supabase nicht erneut.

---

## ADR-0182 – AP-5 Gate 0: bestehender Auth-/Session-/MFA-Vertrag, keine neue Architektur

**Datum:** 28. August 2026  
**Status:** Gate-0-Feststellung auf Draft-PR zu Issue #128. **Keine Runtime.** Kein Auth-Config-Push. Kein Consumer-AAL2.

**Entscheidung:**

1. Eingeloggte Passwortänderung bleibt am bestehenden Vertrag `secure_password_change` / `security_update_password_require_reauthentication`: `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. `security_update_password_require_current_password` bleibt **aus**. Ein Current-Password-Submit wird nicht erfunden. Diese Config auf `true` zu drehen bleibt Product-Owner-Sondergate; Recovery-Kompatibilität muss vor einer solchen Änderung separat live/referenzbasiert verifiziert werden. Ein sicherer Bruch des Recovery-Pfads wird ohne diese Evidence nicht behauptet.
2. Password-Recovery und signed-in Reauthentication sind **zwei Authorities**. Der Recovery-Pfad `resetPasswordForEmail` → Recovery-Session / `type=recovery` → `/auth/update-password` → `updateUser({ password })` ist die heutige Wiederherstellung. `reauthenticate()` + `nonce` ist die vorhandene In-Session-Erneuerung unter `secure_password_change` und heute ungenutzt. Der Recovery-Link ist nicht die Reauthentication.
3. Heutiges Consumer-Abmelden ist `signOut()` ohne Scope und damit Client-Default **`global`**. `local` und `others` existieren in der API. Die Security-UI für diese Scopes steht in ADR-0192; das allgemeine Abmelden bleibt unscoped.
4. Eine User-facing Session-/Geräteliste ist im installierten `@supabase/auth-js` 2.71.1 **unsupported**. Die ehrliche UI-Aussage ist `unsupported`, nicht `empty`. Service-Role- oder Schema-Listen sind ein Product-Owner-Sondergate.
5. TOTP-Enroll/Unenroll im Konto ist client-only. Jetnitys UI macht heute keinen proaktiven Step-up. Die aktuelle Supabase-Referenz für `auth.mfa.unenroll` verlangt `aal2`, um einen **verified** factor zu unenrollen; GoTrue erzwingt das serverseitig. AP-5-S4 darf später einen nutzerfreundlichen `challenge`/`verify`-Step-up davor setzen, ohne Consumer-AAL2 global einzuführen. Admin-AAL2 bleibt getrennt. Consumer-AAL2 bleibt ungebaut und gegated.
6. AP-5-Folgeslices, die nur vorhandene User-APIs und UI-Ehrlichkeit nutzen, sind normale Technical-Lead-Gates. Auth-Config, Default-Logout-Wechsel, Session-Architektur, Consumer-AAL2, OAuth/Passkey-Live bleiben Product-Owner-Sondergates.

**Kontext:** Der kanonische Plan (ADR-0179) nennt AP-5 als nächsten Account-Programm-Kandidaten und verlangt, Shared-Contract von UI zu trennen, bevor Runtime startet. Issue #128 ist genau dieses Gate 0.

**Alternativen:**

1. *AP-5-Runtime ohne Gate 0.* Würde Current-Password, Fake-Gerätelisten oder einen zweiten Logout-Vertrag riskieren.
2. *Sessionliste über Service Role jetzt vorbereiten.* Privilegien- und Privacy-Schnitt, kein Bedarf für den ersten nutzbaren Security-Gewinn.
3. *Consumer-AAL2 zusammen mit der Security-UI.* Fundamentale AAL-Änderung, eigenes Product-Owner-Gate.

**Begründung:** AP-5 soll Sicherheit vertiefen, ohne eine neue Auth-Architektur zu bauen. Dafür muss der bestehende Vertrag zuerst feststehen. Live `auth:pruefen` bestätigt die Sollwerte am Development-Branch. Der installierte Client, nicht eine Wunsch-API, begrenzt die Sessionliste.

**Konsequenzen:**

- Evidence: `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`, Inventory-Test `lib/auth/ap5-gate0-contract-inventory.test.ts`.
- Keine AP-5-Runtime aus diesem ADR.
- C2, AP-6a/AP-7, Production-Auth-Config und Consumer-AAL2 bleiben unberührt.
- Ein späterer Agent darf `/auth/update-password` nicht still zur einzigen In-Account-UI machen und Recovery nicht mit signed-in Reauthentication gleichsetzen.

**Nachtrag, 28. August 2026 – Review-Fix `5049870788`.** Verified-factor Unenroll ist nicht `unknown`: GoTrue verlangt `aal2`. Recovery-Link ist nicht die Reauthentication. `security_update_password_require_current_password = true` bleibt PO-Gate; Recovery-Kompatibilität muss separat verifiziert werden. Keine Runtime.

**Nachtrag, 29. August 2026 – AP-5-S3.** Die User-API-Scopes bleiben unverändert. `/account/security` darf `local` / `others` / `global` explizit anbieten, ohne das allgemeine `signOutAction` anzufassen. Details: ADR-0192. Sessionlisting bleibt unsupported.

**Nachtrag, 29. August 2026 – AP-5-S4.** Die serverseitige AAL2-Anforderung für verified-factor Unenroll bleibt. `/account/security` darf davor `challenge` / `verify` über die vorhandene User-Auth-API setzen und den AAL danach erneut prüfen. Das ist kein globales Consumer-AAL2. Details: ADR-0193.

**Nachtrag, 29. August 2026 – AP-5-S5.** Die User-facing Sessionliste bleibt unsupported. `/account/security` darf die aktuelle Sitzung datensparsam zeigen und andere Sitzungen ausdrücklich als nicht auflistbar belassen. Eine vollständige Liste bleibt AP-5-P2. Details: ADR-0194.

---

## ADR-0183 – AP-5-S1: Server-Truth für Security-UI-Lagen und Fehlerhygiene

**Datum:** 28. August 2026  
**Status:** Implementation auf Draft-PR zu Issue #132. Keine Auth-Architektur. Kein Auth-Config-Push.

**Entscheidung:**

1. `/account/security` trennt `empty`, `unsupported`, `unavailable` und `error` ausdrücklich. Eine fehlgeschlagene oder fehlende Faktorenliste darf nicht als „keine Faktoren“ erscheinen.
2. Passkey-Lage folgt der Server-/Config-Authority `auth.passkey.enabled`. Browser-WebAuthn darf `unsupported` nicht zu „verfügbar“ oder „nur noch auf den Browser wartend“ machen.
3. Nutzersichtbare MFA-/Security-Fehler sind stabile Produktcopy. GoTrue-/Supabase-Rohtexte, Tokens, QR-Secrets und otpauth-URIs gehören nicht in die UI.
4. Faktor-IDs und ID-Präfixe sind keine Geräteidentität. Anzeige ist `friendly_name` oder „Authenticator-App“.
5. TOTP-Enroll/Verify/Unenroll bleibt die vorhandene Client-Authority. S1 baut keinen Step-up, keine Passwortänderung, kein Logout-Umbau und keine Sessionliste.

**Kontext:** Gate 0 / ADR-0182 hat den Vertrag rekonstruiert und S1 als kleinsten Folgeslice klassifiziert. Die bisherige Security-UI vermischte Lagen, zeigte Faktor-ID-Präfixe und konnte Passkeys als „verfügbar“ zeichnen, sobald der Browser WebAuthn hatte.

**Alternativen:**

1. *Nur Copy auf der Seite ändern, Ableitung in der Komponente lassen.* Würde die Lagen unbelegt und untestbar lassen.
2. *Passkeys anhand der Browser-API zeigen.* Würde Server-Truth überschreiben und eine deaktivierte Config als live andeuten.
3. *S2–S5 in denselben PR ziehen.* Würde Auth-nahe Semantik vermischen, bevor die Zustände ehrlich sind.

**Begründung:** Ehrliche Zustände sind Voraussetzung dafür, dass spätere Slices nicht wieder Empty, Error und Unsupported vermengen. Die Config ist die belegte Authority für Passkeys; der Browser ist es nicht.

**Konsequenzen:**

- Evidence: `docs/AP5_S1_SECURITY_UI_TRUTH_STATUS_2026-08-28.md`, `lib/auth/account-security-lage.ts`, `lib/auth/account-security-fehler.ts`.
- Kein Auth-Config-Push und keine Passkey-Aktivierung.
- S2–S5 starten nicht aus diesem ADR.

---

## ADR-0184 – Project Sanitation Closure ist Retention-Plan, kein Aufräum-Merge

**Datum:** 28. August 2026  
**Status:** Draft-PR zu Issue #134. **Keine Löschung. Kein PR-Close. Kein Branch-Delete.**

**Entscheidung:**

1. Historische offene Draft-PRs werden nicht gemergt, nur um die PR-Liste zu verkürzen.
2. PR-Close und Branch-Delete sind getrennte Operationen. Ein PR-Close löscht den Source-Branch nicht und verliert dadurch allein keine Unique Files.
3. Ein historischer/superseded PR darf `CLOSE-SAFE` sein, während sein Branch `HISTORICAL-EVIDENCE` bleibt, bis Unique Content archiviert oder sonst dauerhaft erreichbar ist. Branch-Delete ist erst `DELETE-SAFE`, wenn Preservation bewiesen ist.
4. Branch-Delete ist ein späterer, eigener Technical-Lead-Schritt nach Exact-Head-Review und Unique-Content-Beweis. Remote-Reflog ist kein Rollback-Versprechen.
5. PR #88 vom 26.08.2026 bleibt Historical Evidence und wird nicht als Current Inventory übernommen. Die aktuelle Reconciliation liegt in den versionierten Dateien `docs/PROJECT_SANITATION_*_2026-08-28.md`.
6. Runtime-Reste (`supabase/.temp`, `prague.jpg`, CookieConsent, V1 Image-Hosts) und Cloud-Decommission (`jetnity-bets`) bleiben eigene Slices bzw. Product-Owner-Gates.

**Kontext:** Draft-PR #88 inventarisierte am 26.08.2026 Altlasten gegen `main` `1d558ef5`. Live-`main` bei diesem Review-Fix ist `51b0c926` (PR #133 / AP-5-S1 integriert; ADR-0183 bleibt die S1-Entscheidung). Issue #134 verlangt Closure-Klassifikation, nicht Ausführung. Account-/Auth-Runtime bleibt unberührt.

**Alternativen:**

1. *PR #88 rebase/mergen als Current Truth.* Würde eine zwei Tage alte Inventur über den neueren Continuity-Stand legen.
2. *Alte Drafts blind schliessen und ihre Branches löschen.* Würde Unique Admin-/Account-/Collaboration-Docs verlieren.
3. *Branches in demselben Slice löschen.* Destruktiv, ohne unabhängigen Review der Unique-Content-Beweise.

**Begründung:** Sanitation schützt Evidence zuerst. Aufräumen kommt erst, wenn der Technical Lead die Matrizen unabhängig geprüft hat. ADR-0183 bleibt die integrierte AP-5-S1-Entscheidung und wird nicht überschrieben.

**Konsequenzen:**

- Evidence: `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md` und die zugehörigen Matrizen.
- Generation 3 des Quality-/Security-Workstreams ist dieser Slice.
- Kein Cleanup, kein Ready, kein Merge durch den Autor-Agenten.

---

## ADR-0185 – Technical Lead / Cursor Agent Operating Standard

**Datum:** 28. August 2026  
**Status:** Product-Owner-verbindlich. PR #142 ist integriert (`main` `9d4778b81f34e199466e089fe06fb093895f2df1`). Die Draft-PR-#142-Sätze unten sind Pre-Merge-Evidence.

**Entscheidung:**

1. Nur ChatGPT / Technical Lead darf Jetnity-PRs Ready setzen oder mergen.
2. Cursor-Agenten, Fachagenten, Quality-Agenten und andere Coding Agents dürfen Ready/Merge niemals selbst ausführen oder als eigene Kompetenz behandeln.
3. Der Technical Lead darf einen normalen scope-treuen PR autonom mergen, aber nur nach vollständigem unabhängigen Exact-Head-Review und nur, wenn er absolut überzeugt ist, dass dies die beste verantwortbare Entscheidung ist.
4. Besondere Product-Owner-Gates bleiben unverändert, einschließlich Production-Migrationen, großer Auth/MFA/AAL-/RLS-/Identity-Änderungen, sensitiver Dokumentdaten, realer Provider/Secrets/paid calls, Payments, Kosten > USD 100/Monat, fundamentaler Produkt-/Build-Order-Änderungen und Public-/Provider-/Store-Live-Aktivierung.
5. Session-Rotation bleibt: gleicher Slice / gleicher PR / unmittelbarer Review-Fix = dieselbe Session; neuer logischer Slice = frische nummerierte Generation.
6. Der kanonische Workflow ist: versionierter Task → Draft-PR → `@cursor` → unabhängiger Technical-Lead-Review → head-gebundene CHANGES REQUIRED → neuer Head + Re-Gating → PASS → Technical-Lead-only Ready/Merge → Post-Merge-Verifikation.
7. Dieses Dokument und `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` superseded ältere Passagen, die Cursor-Agenten Ready/Merge erlauben oder für jeden normalen PR eine separate Product-Owner-Mergefreigabe verlangen. Historische Dateien bleiben Evidence ihres Zeitpunkts.

**Kontext:** Der Product Owner hat am 28. August 2026 die chatübergreifende Technical-Lead-/Cursor-Arbeitsweise ausdrücklich festgelegt. Die Merge-Autonomie vom 26. August 2026 bleibt in der Sache gültig (Technical Lead darf normale PRs mergen, nicht blind). Ohne frühen Anchor in `JETNITY_START_HERE.md` und ohne Bereinigung aktueller Governance-Mehrdeutigkeiten könnte ein neuer Chat die exklusive Ready-/Merge-Ausführung oder den Review-Workflow vereinfachen.

**Alternativen:**

1. *26.-August-Dateien als höchste Current Truth belassen.* Risiko: neue Chats verpassen exklusive Merge-Ausführung, Cursor-Verbot und den verbindlichen Workflow.
2. *Alle historischen Merge-Dokumente umschreiben.* Verboten: historische Evidence bleibt Evidence.
3. *Branch Protection jetzt aktivieren.* Eigenes Product-Owner-Gate; außerhalb dieses Docs-only-Slices.

**Begründung:** Continuity. Jeder neue Technical-Lead-Chat startet bei `JETNITY_START_HERE.md` und muss den Operating Standard lesen, bevor er ändert, reviewed oder merget.

**Konsequenzen:**

- Primary: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- Integration-Task: `docs/TECHNICAL_LEAD_CURSOR_OPERATING_STANDARD_INTEGRATION_TASK_2026-08-28.md`
- Keine Runtime-, Schema-, Supabase-, Auth/AAL-, Provider- oder Branch-Protection-Änderung.
- Autor-Agent stoppte historisch auf Draft-PR #142 für unabhängigen Technical-Lead-Review. PR #142 ist jetzt integriert; Current Truth: `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`.

---

## ADR-0186 – AP-7 Gate 0: Dual-Authority-Empfehlung, keine Implementation

**Datum:** 28. August 2026  
**Status:** Gate-0-Empfehlung auf Draft-PR #144. **Keine Product-Owner-Freigabe. Keine Runtime. Kein Schema. Kein RLS-Write.**

**Entscheidung (Empfehlungsstatus, nicht Ausführungsauftrag):**

1. Current Traveller Truth bleibt bis zu einer ausdrücklichen Product-Owner-Entscheidung trip-scoped Foundation E (`trip_travellers` + Children / `Trip.party`).
2. Falls der Product Owner später eine Account-Traveller-Registry will, empfiehlt Gate 0 **Dual-Authority**: account-owned wiederverwendbare Identität + trip-owned Snapshot als einzige Trip-Current-Truth. Ein optionaler Provenienz-Link ist Herkunft, nicht Live-Wahrheit.
3. Live-Referenzen, die Registry-Edits rückwirkend in bestehende Reisen schreiben, sind abgelehnt.
4. Der Plansatz „Current Truth würde von trip-scoped auf account-scoped verschoben“ ist **keine** Gate-0-Empfehlung.
5. Wiederverwendbare Vorlagen allein (Option A) sind sicherer, aber kein ausreichender Endzustand, wenn Binding Build Order §2 eine echte Personenidentität verlangt.
6. Guest→Account bleibt der heutige automatische **trip-scoped** Copy. Registry-Import wäre ein späteres Opt-in und entsteht nicht still.
7. Kein Default-Pass, kein Default-Citizenship, Issuer ≠ Citizenship, keine Positionsidentität (`documents[0]`, `evaluations[0]`).
8. Gate 0 definiert **kein** trip-weites `chosenCredentialOptionRef` und kein gleichwertiges Snapshot-/Registry-Wahlfeld. Alle Credential-Optionen bleiben first-class. Eine spätere explizite Auswahl braucht einen eigenen trip-scoped, kontext-/evaluations-scharfen Entscheidungsvertrag (mindestens Traveller + Credential-Option + Destination/Route/Transit/Segment/Evaluation-Kontext/Fingerprint) oder bleibt bewusst unspezifiziert, bis Provider/Readiness den Scope festlegt. Route-weit einheitliche Nutzung nur bei expliziter regulatorischer/Provider-Evidence, nie als globaler Traveller-Default.
9. Passnummern, Scans, MRZ, Biometrie, Geburtsdatum und Gesundheitsakte gehören nicht zum Kernmodell. Jede solche Speicherung braucht ein eigenes Product-Owner- + Security/Privacy-Gate.
10. Dieser ADR autorisiert keine Tabelle, Policy, GRANT/REVOKE, SECURITY-DEFINER-Funktion, Migration oder AP-7-Runtime.

**Kontext:** AP-7 ist im kanonischen Account-Plan und in Binding Build Order §2 als fehlende Produktarbeit genannt, aber hinter Shared-Contract + Product Owner + ADR-Nachfolger zu ADR-0102/0117 gegated. Gate 0 existiert, damit diese Entscheidung präzise und nicht als Live-Link-Fehlkonstruktion getroffen wird.

**Alternativen:**

1. *Nur trip-scoped + Templates.* Geringstes RLS-Risiko; keine erstklassige Personenidentität; hoher manueller Drift.
2. *Account-Registry als einzige Current Truth / Live-Referenz.* Historische Reisen und Readiness würden mitmutieren.
3. *Keine Registry.* Zulässig nur nach ausdrücklichem Product-Owner-Nein gegen Wiederverwendung.
4. *Runtime jetzt bauen.* Verboten: Identity/RLS/Production-Migration ohne PO-Gate.

**Begründung:** Wiederverwendung soll Suchaufwand senken, ohne historische Trip-Wahrheit, Multi-Citizenship-Truth, Guest-Parität oder RLS-Einfachheit zu opfern. Foundation E nicht neu bauen. Zwei benannte Wahrheiten sind ehrlicher als eine vermischte.

**Konsequenzen:**

- Evidence: `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_STATUS_2026-08-28.md` und Handoff/Self-Review desselben Datums.
- Product Owner muss vor Implementation zwischen Dual-Authority, Templates-only und keiner Registry wählen.
- ADR-0102/0117 bleiben Current Truth, bis ein Implementierungs-ADR sie ausdrücklich nachfolgt.
- AP-5-S3/S4/S5, AP-6, C2, TW-8, Native und Provider-live bleiben unberührt.
- Autor-Agent stoppt auf Draft-PR #144 für unabhängigen Technical-Lead-Review. Self-Review ist kein PASS.

**Nachtrag, 28. August 2026 – Review-Fix `5455299179`.** Gate 0 definiert kein trip-weites `chosenCredentialOptionRef`. Punkt 8 präzisiert den kontext-/evaluations-scharfen späteren Entscheidungsvertrag. `ARCHITECTURE.md` führt AP-5-S2 als integriert; das ändert ADR-0186 nicht. Keine Runtime.

**Nachtrag, 28. August 2026 – Product-Owner-Freigabe + AP-7-S1.** Der Product Owner hat Dual-Authority ausdrücklich freigegeben (`docs/AP7_DUAL_AUTHORITY_PRODUCT_OWNER_APPROVAL_2026-08-28.md`). Das supersediert den reinen Empfehlungsstatus von Punkt 2 für die Architekturwahl. Es autorisiert **nicht** Production-Migration, RLS/Identity, sensible Dokumentpayloads oder Live-Links. Der erste Implementierungsslice ist der shared Domain-Contract (ADR-0187 / Draft-PR #145): reine Validierung/Projektion, kein Schema. ADR-0102/0117 bleiben Current Truth für Persistenz, bis ein späterer Persistence-ADR sie ausdrücklich nachfolgt.

---

## ADR-0187 – AP-7-S1 Dual-Authority Domain Contract, keine Persistenz

**Datum:** 28. August 2026  
**Status:** Implementierungs-ADR für den shared Domain-Contract auf Draft-PR #145. **Keine Production-Migration. Kein Schema. Kein RLS-Write. Kein Ready/Merge durch den Autor.**

**Entscheidung:**

1. Dual-Authority ist die verbindliche Architektur (Product-Owner-Freigabe vom 28. August 2026). Account Registry hält wiederverwendbare aktuelle Identität/Fakten. Der Trip-Snapshot bleibt die einzige Current Truth einer konkreten Reise.
2. Der erste Slice ist ein shared, persistenzfreier Domain-Contract in `lib/traveller/account-registry.ts`. Er erzeugt kein zweites Traveller-Modell: semantische Felder, Länderprüfung und Limits bleiben Foundation E (`TripTraveller*`, `TRAVELLER_CONTEXT_GRENZEN`, `landescodeLesen`).
3. Registry-Identität ist UUID-backed für `id` **und** `clientRef` (Person, Citizenship, Document). Positions- und faktische Refs (`traveller:N`, `person:0`, `document:passport:CH`) sind ungültig.
4. Citizenships und Documents bleiben first-class Arrays. Die Document↔Citizenship-Relation ist nur das explizite `citizenshipClientRef`. Issuer, Residence, Locale, Sprache oder Abflugland dürfen keine Citizenship erzeugen. Fehlt die Relation, bleibt sie `null`.
5. Lesen ist fail-closed: doppelte oder baumelnde Refs, Limit-Verletzungen, ungültige Länder-/Dokumentwerte, Legacy-Singularfelder, Default-/Chosen-Credential-Felder und sensible Schlüssel werden abgelehnt statt still korrigiert.
6. Die Projektion erzeugt einen trip-owned Snapshot nur aus expliziter Materialisierung (trip-eigene UUIDs + `jetzt`). Registry-Identität und Registry-Zeitstempel werden nicht kopiert. Snapshot-`id`/`clientRef` müssen zum gesamten Registry-Identitätsuniversum disjunkt sein (Parent + alle Citizenship-/Document-`id`/`clientRef`), nicht nur zur jeweiligen Quellzeile. Kein `new Date()`-Fallback. Document↔Citizenship wird remappt. Spätere Mutation der Quelle darf den Snapshot nicht über gemeinsame Objekt-/Array-Referenzen ändern.
7. `travellerLegacyLesen` und `credentialOptionsAus` bleiben Guest-/Readiness-Pfade. Sie sind nicht die Account-Registry-Authority.
8. Dieser ADR autorisiert keine Tabelle, Policy, GRANT/REVOKE, SECURITY-DEFINER-Funktion, Migration, UI/CRUD, Guest→Registry-Import oder AP-7-S2.

**Kontext:** Gate 0 / ADR-0186 empfahl Dual-Authority und verbot Live-Links. Der Product Owner hat die Architektur freigegeben, die Identity-/RLS-/Production-Grenze aber getrennt gehalten. S1 macht den Vertrag im Code festhaltbar, bevor irgendjemand Persistenz raten kann.

**Alternativen:**

1. *Nur Docs, kein Code.* Zu schwach: spätere Web/Native/API-Slices könnten wieder auf `documents[0]` oder Live-Authority fallen.
2. *Registry-Typen als zweite, abweichende Feldmenge.* Erzeugt ein Schattenmodell und bricht Foundation E.
3. *`travellerLegacyLesen` wiederverwenden.* Würde Legacy-Singular ableiten, Limits abschneiden und dangling Refs auf `null` setzen — das ist Raten.
4. *Schema/RLS jetzt.* Verboten: separates Product-Owner-Gate.

**Begründung:** Der Vertrag muss strukturell unabhängig und fail-closed sein, damit späterer Persistenz- oder UI-Code nicht versehentlich Account-Identität zur Trip-Wahrheit macht. Kleinster kohärenter Slice ohne Schema.

**Konsequenzen:**

- Evidence: `docs/AP7_S1_DUAL_AUTHORITY_DOMAIN_CONTRACT_STATUS_2026-08-28.md` und Handoff/Self-Review desselben Datums.
- Persistence bleibt hinter einem späteren ADR + Product-Owner Identity-/RLS-/Migrations-Gate.
- AP-5-S3/S4/S5, AP-6, C2, TW-8, Native-Runtime und Provider-live bleiben unberührt.
- Autor-Agent stoppt auf Draft-PR #145 für unabhängigen Technical-Lead-Review. Self-Review ist kein PASS.

**Nachtrag, 28. August 2026 – Review-Fix `5455673104`.** Der Domain-Contract wurde gegen den Exact Head `c88ac2e3` nachgeschärft:

1. `AccountRegistryTraveller` trägt Fakten unter `facts` und ist compile-zeitlich nicht als `TripTraveller` zuweisbar.
2. Projektion materialisiert trip-eigene UUID-Identitäten aus explizitem Kontext; Registry-`id`/`clientRef` werden nicht kopiert. Document↔Citizenship wird remappt.
3. Snapshot-Zeitstempel für Traveller/Citizenship/Document sind `jetzt`, nicht Registry-Metadaten.
4. `authority === 'account_registry'` ist Pflicht. Flache Trip-Form wird nicht zur Registry befördert.
5. Registry-`id` und `clientRef` sind UUID-backed, nicht positions- oder faktisch abgeleitet.
6. Kein Wanduhr-Fallback. Materialisierung ohne `jetzt` ist fail-closed.

Kein Schema. Kein Ready/Merge. Neuer Head invalidiert `c88ac2e3` und `ed8f79b4`.

**Nachtrag, 28. August 2026 – Review-Fix `5455755549`.** Zwei verbliebene Blocker gegen Head `ce5b7e70`:

1. Snapshot-Identität ist zum gesamten Registry-Universum disjunkt. Cross-Entity- und id↔clientRef-Kollisionen sind fail-closed. Snapshot-globale Eindeutigkeit bleibt.
2. Canonical Continuity (`JETNITY_START_HERE.md`, Handoff, Active Work, Roadmap, Status) ist self-expiring: solange #145 offen → TL-Re-Review/Ready/Merge only; nach Merge → integrierter Domain-Contract, kein automatisches AP-7-S2, Live-Post-Merge-Verifikation, dann nur ein separat Product-Owner-gegateter Persistence/Identity/RLS-Vorschlag. Kein erfundener Merge-SHA. Kein Follow-up-Continuity-PR nur um den Merge zu sagen.

Kein Schema. Kein Ready/Merge. Neuer Head invalidiert `ce5b7e70` und `fbb1ec8d`.

**Nachtrag, 28. August 2026 – Review-Fix `5455836506`.** Continuity-only gegen Head `e9f96e79`: residual unconditional `#145 DRAFT/AKTIV` und unguarded `## 10. Nächster Schritt` in `docs/ACTIVE_WORK_STATUS.md` sind jetzt dual-state. Domain-Contract unverändert. Kein erfundener Merge-SHA. Neuer Head invalidiert `e9f96e79`.

---

## ADR-0188 – Node-Runtime-Vertrag auf `22.x`

**Datum:** 28. August 2026  
**Status:** Implementierungs-ADR auf PR #147. **Self-expiring / dual-state. Kein Ready/Merge durch den Autor. Keine Vercel-Projektmutation. Keine Application-Runtime-Änderung.**

**Entscheidung:**

1. Der verbindliche Node-Runtime-Vertrag von Jetnity ist **Node 22.x**.
2. `package.json` `engines.node` lautet `22.x`, nicht mehr `>=20.9`.
3. `package-lock.json` Root-Metadaten folgen dem Package Manager, nicht einer Hand-Edit der Dependency-Records.
4. `@types/node` folgt der gepflegten Node-22-Typenlinie. Gewählt ist die exakte aktuelle 22.x-Version `22.20.1` inkl. der von npm mitgezogenen `undici-types@6.21.0`. Node-24-Typen (`24.0.7`) sind nicht mehr Current Truth.
5. GitHub CI bleibt `actions/setup-node@v4` mit `node-version: 22.x` in beiden Jobs. Vercel-Projektsettings bleiben `22.x` und werden in diesem Slice nicht verändert.
6. Dieser ADR ändert keine Application-Features, kein Supabase/Auth/RLS/Schema, keine Branch Protection und keinen Provider-/Trip-Workspace-Runtime-Slice.

**Kontext:** CI und das Vercel-Projekt `jetnity-app` nutzten bereits Node `22.x`. Der breite Engine-Range `>=20.9` (ADR-0004) erlaubte Vercel, Node 24 zu wählen und `Node.js Version Override` anzuzeigen. `@types/node@24.0.7` beschrieb dieselbe neuere Linie statt den tatsächlich gewollten Runtime.

**Alternativen:**

1. *Range bei `>=20.9` lassen und nur Vercel härter setzen.* Unzureichend: das Repository würde weiter eine breitere Runtime behaupten als CI/Vercel.
2. *`>=22 <23` statt `22.x`.* Semantisch ähnlich, aber `22.x` ist die bereits verwendete CI-/Vercel-Schreibweise.
3. *`@types/node` auf 24 lassen.* Würde Typen einer nicht vertraglichen Runtime weiterführen.
4. *Vercel-Projektsettings ändern.* Nicht nötig und außerhalb des Slices.

**Begründung:** Ein reproduzierbarer Runtime-Vertrag muss in Repository-Metadaten, Typen, CI und Hosting dieselbe Linie ausdrücken. Der kleinste kohärente Fix ist das Pinning auf die bereits gewählte 22.x-Linie.

**Konsequenzen:**

- ADR-0004 ist für den Engine-Range superseded. `simple-swizzle` `overrides` bleibt.
- Evidence: `docs/NODE22_RUNTIME_CONSISTENCY_STATUS_2026-08-28.md` und Self-Review desselben Datums.
- Canonical Continuity (`JETNITY_START_HERE.md`, Handoff, Active Work, Roadmap, Status) ist self-expiring: solange #147 offen → TL-Re-Review / kein Ready/Merge durch den Autor; nach Merge → integrierter Node-22-Vertrag, Live-Post-Merge-Verifikation von GitHub CI + Vercel Production auf dem tatsächlichen Merge-Head inkl. Override-Warnung, danach live Binding-Build-Order-Auswahl. Kein erfundener Merge-SHA. Kein Follow-up-Continuity-PR nur um den Merge zu sagen. AP-7-S2 bleibt separat Product-Owner-gegatet.
- Autor-Agent stoppt, solange #147 offen ist, für unabhängigen Technical-Lead Exact-Head-Review. Nach Merge ist diese Stopp-Klausel historisch. Self-Review ist kein PASS.

**Nachtrag, 28. August 2026 – Review-Fix `5456852840`.** Continuity-only gegen Head `2cae6e03`: residual unconditional `#147 DRAFT/AKTIV` und unguarded `nächster Schritt = Review von #147` in den kanonischen Current-State-Dateien sind jetzt dual-state. Runtime-/Tooling-Dateien unverändert. Kein erfundener Merge-SHA. Neuer Head invalidiert `2cae6e03`.

**Nachtrag, 28. August 2026 – Integration.** PR #147 ist auf `main @ 56aff7ff` gemergt. ADR-0188 ist der integrierte Node-22-Vertrag. Ältere SELF-EXPIRING/DRAFT-Zeilen sind Pre-Merge-Evidence.

---

## ADR-0189 – Next.js Framework Security Upgrade Gate 0: Ziel 16.x Active LTS, kein Runtime-Wechsel

**Datum:** 28. August 2026  
**Status:** Gate-0-Empfehlungs-ADR auf Draft-PR #148. **Self-expiring / dual-state. Kein Ready/Merge durch den Autor. Kein Framework-/Runtime-Dependency-Upgrade. Keine Vercel-Projektmutation. Keine Application-Runtime-Änderung.**

**Entscheidung (Empfehlung, keine Freigabe):**

1. Das langfristige unterstützte Framework-Ziel von Jetnity ist **Next.js 16.x Active LTS** auf der **zum Implementierungszeitpunkt aktuellen unterstützten und security-gepatchten 16.x-Release**. `16.3.3` ist das **auditierte aktuelle Minimum / die August-2026-Sicherheitsreferenz**, kein ewiger Architektur-Pin. Bei Verzögerung oder neuerer unterstützter Security-Release: live neu auflösen. **Nie unter `16.3.3` fallen.**
2. Begleitpakete (React 19.2.x, passendes `eslint-config-next`, ESLint 9, TypeScript-Deklaration >= 5.1.0) werden in derselben Weise **live-resolved** innerhalb der kompatiblen unterstützten Linie. Audit-Zahlen (z. B. React 19.2.8, TypeScript resolved 5.9.2) sind Referenzen, keine Ewigkeits-Pins.
3. **`next@15.5.24` (Maintenance LTS) ist kein Production-Ziel.** Es bleibt nur eine optionale, kurzlebige Preview-Isolationsstufe. 15.x erreicht EOL am 21. Oktober 2026.
4. **`next@14.2.32` und auch `14.2.35` sind kein Security-Ziel.** 14.x ist offiziell unsupported. Das letzte 14.2-Release enthält die August-2026-Advisories nicht.
5. Ein tatsächlicher Dependency-Bump bleibt ein **separates, Product-Owner-gegates Implementierungsprogramm** nach unabhängigem Technical-Lead-Review dieses Gate 0. Empfohlene Stufe: Slice 1 = async Request-API-Prep auf Next 14 ohne Bump; Slice 2 = live-resolved 16.x (>= `16.3.3`) + React 19.2.x + ESLint 9 + TypeScript-Deklaration >= 5.1.0 + Lint-CLI + `middleware`→`proxy`.
6. Dieser ADR ändert keine Runtime-Dependencies, keinen Application-Code, kein Supabase/Auth/RLS/Schema, keine Vercel-Settings, keine Branch Protection und startet keinen Produkt-Slice.

**Kontext:** Production nach PR #147 läuft auf Node 22.x und bleibt auf `next@14.2.32` / React 18.2.0. Vercel hat `14.2.32` als verwundbar/unsupported gemeldet. Die August-2026-Security-Release patcht 15.5.24 und 16.3.3. Jetnity nutzt App Router, sync `cookies()` in zentralen Auth-Factories, `next lint`, `middleware.ts` ohne matcher und `images.formats` inkl. AVIF. `package.json` deklariert `typescript: ^5.0.0`; Lockfile resolved `5.9.2`. Next 16 verlangt TypeScript >= 5.1.0.

**Nachtrag, 28. August 2026 – Review-Fix `5457148091`.** Semantik von „Ziel 16.3.3“ auf 16.x Active LTS / live-resolved / Minimum `16.3.3` korrigiert. Vercel-Production-Evidence von PR #147 als TL-verifiziertes `dpl_3UZX5HrgwUyyr887ZSKBXMzPKMKM` (READY, `aliasError=null`, Node 24.x→22.x cache skip) ergänzt; GitHub deployment `6147375507` bleibt nur GitHub-Evidence. TypeScript-Deklarationslücke ins Slice-2-Soll aufgenommen. Kein Runtime-Change. Neuer Head invalidiert `c4bfc2bb`.

**Alternativen:**

1. *Auf 14.2.32 bleiben und Vercel-Plattformschutz als ausreichend behandeln.* Lehnt die Task-Prämisse ab: Unsupported-Linie und zukünftige Advisories bleiben offen.
2. *Nur auf 14.2.35 gehen.* Letzter 14.2-Patch, weiterhin unsupported, ohne August-2026-Fixes.
3. *Auf 15.5.24 als Ziel gehen.* Kleinerer erster Hop und Sync-Shim, aber EOL in ~54 Tagen erzwingt sofort 16.
4. *Ein-Hop 14 → live-resolved 16.x (>= 16.3.3) ohne Prep-Slice.* Zulässige Abweichung, höheres Erst-PR-Risiko auf Auth/Cookies/Proxy/Lint.

**Begründung:** Security und Reproduzierbarkeit verlangen eine unterstützte Linie, nicht eine eingefrorene Patch-Zahl. 16.x ist Active LTS. 15.x ist zu nah an EOL, um Production-Ziel zu sein. Jetnitys teure Arbeit (Cookie-Factories, `/planen`-Metadata, Middleware-Cookies) fällt bei beiden Majors an; der Shim von 15 spart wenig, wenn 16 in Wochen folgen muss. Jetnity hat kein custom webpack, kein Pages Router, kein `revalidateTag` und bereits Node 22 – die 16-spezifische Fläche ist damit begrenzt, aber Auth bleibt high-risk.

**Konsequenzen:**

- Evidence: `docs/NEXT_FRAMEWORK_SECURITY_UPGRADE_GATE0_STATUS_2026-08-28.md` und Self-Review desselben Datums.
- `ARCHITECTURE.md` bleibt Ist-Wahrheit Next.js 14.2.32 / App Router, plus Gate-0-Hinweis dass 16.x Active LTS empfohlen und nicht angewendet ist.
- Canonical Continuity ist self-expiring: solange #148 offen → TL-Re-Review / kein Ready/Merge durch den Autor; nach Merge → Gate 0 integrierte Evidence, nächster Schritt = Product-Owner-Entscheidung über ein Implementierungsprogramm auf 16.x Active LTS, kein automatischer Bump, keine erfundene Merge-SHA.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Re-Review. Self-Review ist kein PASS.

---

## ADR-0190 – Next 16 S1: async Request-API-Kompatibilität ohne Framework-Bump

**Datum:** 28. August 2026  
**Status:** integriert über PR #150 auf `main @ d7f02f77`. Ältere SELF-EXPIRING/DRAFT-Zeilen sind Pre-Merge-Evidence. Der Runtime-Wechsel ist ADR-0191 / Draft-PR #151.

**Entscheidung:**

1. Die drei Supabase-Server-Factories in `lib/supabase/server.ts` sind `async` und verwenden `await cookies()`. Der Cookie-Store-Typ ist `Awaited<ReturnType<typeof cookies>>`, damit Next 14 und der spätere Promise-Vertrag ohne `any` oder neue `@ts-ignore` kompilieren.
2. RSC bleibt read-only; Route Handler und Server Actions bleiben mutierbar. Der Alias `createServerClient` bleibt die async RSC-Factory und keine synchrone Hintertür.
3. `gastkennung()` ist async; der `jetnity_gast`-Vertrag, der cookie-lose Service-Role-Client und Fail-closed bleiben unverändert.
4. Page-`params`, Page-`searchParams` und `generateMetadata` auf den Gate-0-Flächen werden über `leseRequestParam` / `leseOptionalRequestParam` Promise-kompatibel. `new URL(req.url).searchParams` bleibt unverändert.
5. Produkt-Truth (Login/Register/Admin-MFA `next`, `/planen` Key-Präsenz-Robots, `[tripId]` Guest-vs-Account, unauthorized `grund`, Admin-Users-Pagination) wird nicht neu erfunden, sondern mit Tests festgebunden.
6. Dieser ADR ändert keine Framework-Dependencies, kein `middleware.ts`, keine Vercel-Settings und keine Supabase-/Auth-/RLS-Ebene.

**Kontext:** PR #148 / ADR-0189 empfahl ein gestuftes Upgrade. PR #149 autorisierte Compatibility-Prep vor dem Bump. Next 16 entfernt den Sync-Shim von `cookies()` / `params` / `searchParams`. `await` eines Nicht-Promises ist auf Next 14 gültig, deshalb kann S1 die teure Auth-Fläche vor dem Major-Bump schließen.

**Alternativen:**

1. *Factories synchron lassen bis S2.* Würde Auth-Caller und Request-API-Flächen in denselben Bump-PR zwingen.
2. *Nur Factories async machen, Pages später.* Würde den dokumentierten S1-Scope und die `/planen`-Metadata-Grenze ungeschützt lassen.
3. *Sofort Next 16 heben.* Verboten in S1; höheres Erst-PR-Risiko.

**Begründung:** Async-Kompatibilität vorbereiten, Verhalten nicht neu erfinden. Die Signaturänderung ist der kleinste Schritt, der den späteren 16er-Bump von der Auth-Cookie-Arbeit trennt.

**Konsequenzen:**

- Evidence: `docs/NEXT16_S1_REQUEST_API_COMPATIBILITY_PREP_STATUS_2026-08-28.md` und Self-Review desselben Datums.
- Canonical Continuity ist self-expiring: solange #150 offen → TL Exact-Head-Review / kein Ready/Merge durch den Autor; nach Merge → S1 integriert, nächster Schritt nur ein separat versioniertes S2, kein automatischer Bump.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Review. Self-Review ist kein PASS.

**Nachtrag, 28. August 2026 – öffentliche PageProps sind Promise-förmig:**

Technical-Lead CHANGES REQUIRED `5457641262` am Head `822725a6` stellte fest: ein Union `T | Promise<T>` auf den framework-facing Page-/Metadata-Signaturen reicht für Next-14-Runtime-Unwrap, ist aber nicht der Next-16-`PageProps`-Vertrag. S2 kann an der generierten Promise-Constraint scheitern.

Festlegung innerhalb S1, ohne Dependency-Bump:

1. `PageRequestParam<T> = Promise<T>` ist der öffentliche Vertrag.
2. Optionality (`searchParams?`) bleibt, wo die Route Abwesenheit erlaubt; der vorhandene Wert ist Promise-förmig.
3. Der interne Helfer `RequestParam<T> = T | Promise<T>` darf Sync weiter unwrappen (Next 14 liefert weiterhin ein Await-fähiges Objekt).
4. Die Union darf nicht erneut als öffentliche PageProps-Signatur verwendet werden.

**Nachtrag, 28. August 2026 – Integration.** PR #150 ist auf `main @ d7f02f77` gemergt. ADR-0190 ist der integrierte S1-Vertrag. Der tatsächliche Runtime-Wechsel ist ADR-0191 / Draft-PR #151 und nicht Teil von S1.

---

## ADR-0191 – Next 16 S2: Runtime-Wechsel auf Next.js 16.3.3 Active LTS

**Datum:** 28. August 2026  
**Status:** Slice-2-Implementierungs-ADR auf Draft-PR #151. **Self-expiring. Kein Ready/Merge durch den Autor. Kein S3. Keine Cache-Components-/PPR-/React-Compiler-Aktivierung. Keine Supabase-/Auth-/RLS-/Vercel-Setting-Mutation.**

**Entscheidung:**

1. Jetnitys Application-Runtime auf diesem Draft-Branch ist **Next.js 16.3.3** (Active LTS, aktueller Security-Patch) plus die live-resolved kompatible Linie **React / React-DOM 19.2.8**, **@types/react 19.2.18**, **@types/react-dom 19.2.5**, **eslint-config-next 16.3.3**, **ESLint 9.39.5** und **TypeScript 5.9.3**.
2. `next lint` ist entfernt. Lint läuft über die ESLint CLI (`eslint .`) und die offizielle Next-16-Flat-Config (`eslint.config.mjs`: core-web-vitals + typescript + Default-Ignores).
3. Neue React-Compiler-orientierte Hook-Regeln und `@typescript-eslint/no-explicit-any` bleiben sichtbar. Severity ist `warn`, nicht globales `off`. `no-require-imports` ist nur für bestehende CJS-Config-Dateien aus.
4. Die Netzwerk-/Auth-Grenze heißt `proxy.ts` und exportiert `proxy`. Semantik bleibt fail-closed: `getUser()`, Cookie-Weitergabe, Scope-Reihenfolge `/api/admin` → `/admin/*` außer Login → `/account/*`, `/admin/mfa` login-geschützt ohne Proxy-AAL2, `next = pathname + search`, kein matcher.
5. `typedRoutes` sitzt top-level. `experimental.optimizePackageImports` bleibt `['lucide-react']`. Cache Components, PPR und React Compiler bleiben aus. Der Production-Build nutzt Next-16-Default-Turbopack, nicht `--webpack`.
6. CI-`typecheck` läuft `next typegen && tsc`, weil Next 16 `next-env.d.ts` auf generierte Route-Types zeigt und GitHub Actions typecheck vor dem Build ausführt.
7. S1-Promise-/Async-Request-API-Verträge (ADR-0190) bleiben. `new URL(req.url).searchParams` ist keine Next Request API und wird nicht pauschal umgeschrieben.
8. Dieser ADR ändert kein Supabase-/Auth-/RLS-/Schema, keine Vercel-Projektsettings und startet keinen Produkt- oder S3-Slice.

**Kontext:** PR #148 / ADR-0189 empfahl 16.x Active LTS. PR #149 autorisierte das gestufte Programm einschließlich S2. PR #150 / ADR-0190 hat Auth-Cookies und PageProps auf Next 14 async-kompatibel gemacht. Next 16 entfernt `next lint`, behandelt `middleware` als `proxy` auf Node.js und schreibt typed-route-Imports in `next-env.d.ts`. ESLint 10 ist mit `eslint-config-next@16.3.3` / `eslint-plugin-react` nicht peer-sauber.

**Alternativen:**

1. *Auf 14.2.32 bleiben.* Lehnt die PO-Freigabe und das Security-Ziel ab.
2. *ESLint 10 trotz Peer-Bruch mit `--force`.* Würde den No-Force-Vertrag brechen.
3. *Compiler-Hook-Regeln global `off`.* Würde den Lint-Vertrag still schwächen.
4. *`--webpack` nur um den ersten Build grün zu machen.* Der erste Fehler war stale Next-14-`.next`, kein Turbopack-Blocker.
5. *Cache Components/PPR/Compiler mitaktivieren.* Hard Non-Scope.

**Begründung:** S2 ist der autorisierte Runtime-Wechsel, nicht ein Produkt- oder Feature-Slice. Kompatible Linien live auflösen, Semantik der Auth-Grenze erhalten, neue Next-16-Defaults nutzen statt stille Opt-outs.

**Konsequenzen:**

- Evidence: `docs/NEXT16_S2_FRAMEWORK_BUMP_STATUS_2026-08-28.md` und Self-Review desselben Datums.
- `ARCHITECTURE.md` Ist-Wahrheit auf diesem Draft: Next.js 16.3.3 / App Router / `proxy.ts` auf Node.js. Production/`main` bleibt bis Merge auf Next 14.2.32 + S1.
- Canonical Continuity ist self-expiring: solange #151 offen → TL Exact-Head-Review / kein Ready/Merge durch den Autor; nach Merge → S2 integriert, nächster Schritt nur ein separat versioniertes, ausdrücklich gegatetes Folgeprogramm, kein automatisches S3.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Review. Self-Review ist kein PASS.

**Nachtrag, 28. August 2026 – Review-Fix `5055372760`.** Die öffentliche Support-ID darf ohne Digest keine gemeinsame Konstante (`#unbekannt`) sein. Fallback ist `useId()` über `oeffentlicheFehlerId`: render-rein, je gemounteter Fehlergrenze stabil, ohne unreine Zeit-/Zufallswerte im Render. Vorheriger Review-Head `b73af1c2` wird durch den Review-Fix ungültig.

---

## ADR-0192 – AP-5-S3: explizite Logout-Scopes ohne neue Session-Architektur

**Datum:** 29. August 2026  
**Status:** Implementation-Slice auf Draft-PR #156 / Issue #153. Keine Auth-Architektur. Kein Auth-Config-Push. Kein Sessionlisting.

**Entscheidung:**

1. `/account/security` bietet die vorhandenen User-API-Scopes explizit an: `local` (dieses Gerät / diese Sitzung), `others` (andere Sitzungen, aktuelle bleibt), `global` (überall).
2. Das allgemeine Jetnity-Abmelden (`signOutAction` / `signOutToAdminLoginAction`) bleibt `signOut()` ohne Scope und damit Client-Default **`global`**. S3 dreht diesen Default nicht auf `local`.
3. Erfolg darf nur nach bestätigtem `signOut({ scope })` behauptet werden. Netz-, Server- oder unbestätigte Revoke-Lagen sind `error` / `unavailable` / `unsupported`, nicht Erfolg und nicht stilles Redirect.
4. `others` muss die aktuelle Sitzung erhalten. Wenn `getUser()` danach keinen User mehr liefert, ist das ein Fehler, kein Erfolg.
5. Jetnity erfindet keine Sessionliste und keine Sessionzahl. Access Tokens können bis `jwt_expiry` weiter gültig sein; Logout ist kein sofortiges JWT-Kill.
6. `global` in der Security-UI ist die gefährlichere Aktion und braucht eine ausdrückliche Bestätigung. Das ändert nicht die Semantik des allgemeinen Abmeldens.
7. S4/S5, Consumer-AAL2, Default-Logout-Wechsel, Service-Role-Sessionlisten und Auth-Config bleiben ausserhalb dieses ADR.

**Kontext:** Gate 0 / ADR-0182 hat die Scopes und den globalen Default rekonstruiert. S1/S2 haben ehrliche Lagen und die signed-in Passwortänderung geliefert. Issue #153 ist der scoped Logout-UI-Slice über dieselbe User-API.

**Alternativen:**

1. *Nur Copy „überall abmelden“ auf das bestehende `signOutAction` legen.* Würde `local`/`others` weiter fehlen und Fehler weiter schlucken.
2. *Navbar-Default auf `local` drehen.* Session-Semantik, Product-Owner-Sondergate (AP-5-P1).
3. *Sessionliste über Service Role oder `auth.sessions`.* Privilegien- und Privacy-Schnitt, AP-5-P2 / S5.
4. *Nur Browser-`signOut` ohne Server Action.* Würde Server-Cookies bei `local`/`global` stehen lassen.

**Begründung:** Die drei Scopes existieren bereits. Der nutzbare Security-Gewinn ist, sie ehrlich und testbar anzubieten, ohne eine Session-Architektur zu erfinden oder den globalen Default still zu ändern.

**Konsequenzen:**

- Evidence: `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_STATUS_2026-08-29.md`, `lib/auth/account-logout-scopes.ts`, `components/account/SecurityLogout.tsx`.
- Keine Migration, kein RLS, kein Auth-Config-Push, keine Service Role.
- S4/S5 starten nicht aus diesem ADR.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Review. Self-Review ist kein PASS.

---

## ADR-0193 – AP-5-S4: MFA-Step-up vor verified-factor Unenroll ohne Consumer-AAL2

**Datum:** 29. August 2026  
**Status:** Implementation-Slice auf Draft-PR #159 / Issue #158. Keine Auth-Architektur. Kein Auth-Config-Push. Kein globales Consumer-AAL2.

**Entscheidung:**

1. `/account/security` stept vor dem Entfernen eines **verifizierten** TOTP-Faktors über die vorhandene User-Auth-API hoch: `listFactors` → `getAuthenticatorAssuranceLevel` → bei Bedarf `challenge` / `verify` → erneuter AAL-Check → `unenroll`.
2. Nur `currentLevel === 'aal2'` ist ausreichender Step-up. `nextLevel === 'aal2'` allein berechtigt keinen Unenroll.
3. Unverified-factor Unenroll (Enroll-Abbruch) bleibt AAL1 und braucht keinen Dialog.
4. Bereits ausreichendes AAL2 erzwingt keinen Challenge-Dialog.
5. Erfolg darf nur nach bestätigtem `unenroll` **und** bestätigtem Sitzungs-/AAL-Abgleich (`refreshSession` plus Re-read) behauptet werden. Verify allein, UI-Flags oder ein fehlgeschlagenes Unenroll nach Step-up sind kein Gesamterfolg.
6. Schlägt Refresh/AAL-Abgleich nach bereits erfolgreichem verified Unenroll fehl, ist das kein clean success: der Faktor ist weg, die lokale Sitzung wird fail-closed beendet (`signOut({ scope: 'local' })`). Das erfindet keine neue Session-Architektur.
7. Factor-/Challenge-/Session-IDs, Tokens und OTP gehören nicht in Nutzertexte, URLs, Logs oder Analytics. Roh-GoTrue wird auf dichte Produktcopy abgebildet.
8. Jetnity fordert den Step-up nur für diesen Vorgang an. Die aktuelle Sitzung kann dabei technisch auf AAL2 angehoben werden. Das aktiviert keine globale Consumer-MFA-Pflicht.
9. Existieren mehrere verified TOTP-Faktoren, wird ein anderer als der zu entfernende für die Challenge bevorzugt.
10. Login-MFA bleibt skippable. Admin-AAL2, Recovery, signed-in Reauthentication und S3-Logout bleiben getrennte Authorities.
11. S5, Consumer-AAL2, Auth-Config, Passkeys/OAuth und Service-Role-Sessionlisten bleiben ausserhalb dieses ADR.

**Nachtrag, 29. August 2026 – Review `5056084065`.** P1 Session/AAL-Reconcile nach verified Unenroll und P2 Challenge-Faktor-Auswahl sind Implementation-Pflicht dieses ADR, kein neues Product-Owner-Gate.

**Kontext:** Gate 0 / ADR-0182 hat festgestellt, dass GoTrue für verified-factor Unenroll `aal2` verlangt und die UI nicht hochsteppt. S1–S3 haben ehrliche Lagen, signed-in Passwortänderung und Logout-Scopes geliefert. Issue #158 ist der Step-up-UI-Slice über dieselbe User-API.

**Alternativen:**

1. *Rohfehler „insufficient AAL“ belassen.* Würde Nutzer mit undurchsichtiger Ablehnung allein lassen.
2. *Globales Consumer-AAL2 / Login-Hard-Gate.* Fundamentale AAL-Änderung, Product-Owner-Sondergate (AP-5-P3).
3. *`startTotpChallenge` aus `lib/auth/mfa.ts` wiederverwenden.* Legacy-`type === "totp"` und `any`; keine AAL-Recheck-Semantik.
4. *Service Role oder Auth-Config ändern.* Ausserhalb des normalen S4-Gates.

**Begründung:** Die API existiert bereits. Der nutzbare Security-Gewinn ist, die serverseitige AAL2-Anforderung ehrlich und testbar erfüllbar zu machen, ohne Consumer-AAL2 global einzuführen oder eine MFA-Policy zu ändern.

**Konsequenzen:**

- Evidence: `docs/AP5_S4_ACCOUNT_SECURITY_MFA_STEP_UP_STATUS_2026-08-29.md`, `lib/auth/account-mfa-step-up.ts`, `components/account/SecurityMfaStepUp.tsx`.
- Keine Migration, kein RLS, kein Auth-Config-Push, keine Service Role.
- S5 startet nicht aus diesem ADR.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Review. Self-Review ist kein PASS.

---

## ADR-0194 – AP-5-S5: ehrliche aktuelle Sitzung, andere Sitzungen unsupported

**Datum:** 29. August 2026  
**Status:** Implementation-Slice auf Draft-PR #162 / Issue #161. Keine Auth-Architektur. Kein Auth-Config-Push. Keine Session-Registry.

**Entscheidung:**

1. `/account/security` zeigt die **aktuelle** Sitzung nur mit vorhandener User-Auth-Truth: Existenz über `getUser()`, optional Zugangscode-Zeit aus `expires_at`, optional `currentLevel` `aal1`/`aal2`.
2. Andere Sitzungen sind `unsupported`, nicht `empty` und nicht eine Zahl. Jetnity erfindet keine Geräteliste.
3. `expires_at` wird fachlich als Gültigkeit des aktuellen Zugangscodes benannt, nicht als Sitzungsende und nicht als letzte Aktivität.
4. `session_id`, Access-/Refresh-Tokens, JWT-Rohdaten, Cookies, Auth-Header und User-Agent-Rohdaten gehören nicht in UI, DOM oder Logs.
5. Ein lokaler Browser-/Plattformhinweis darf nur als lokale, nicht serverseitig geprüfte Klasse erscheinen. Kein Fingerprinting, keine persistente Device-ID, kein IP-/Geo-Raten.
6. Die vorhandene S3-Aktion „Andere Geräte abmelden“ bleibt die Steuerungsautorität. S5 verändert `local`/`others`/`global` nicht und führt die Aktion nicht ein zweites Mal aus.
7. S4 MFA-Step-up/AAL-Reconcile bleibt eine getrennte Authority.
8. Eine professionelle vollständige Sessionliste würde Service Role, privilegiertes Session-Schema oder eine neue persistente Registry verlangen. Das bleibt Product-Owner-Sondergate AP-5-P2. S5 improvisiert das nicht.
9. AP-6/AP-7, Consumer-AAL2, Auth-Config, Passkeys/OAuth und Migration/RLS/Identity bleiben ausserhalb dieses ADR.

**Kontext:** Gate 0 / ADR-0182 hat festgestellt, dass der installierte User-Client keine `listSessions`-/`getSessions`-API hat. S1–S4 haben ehrliche Lagen, Passwortänderung, Logout-Scopes und MFA-Step-up geliefert. Issue #161 ist der letzte autorisierte Slice des AP-5-S3–S5-Programms.

**Alternativen:**

1. *Nur Copy „Geräte nicht auflistbar“ ohne aktuelle Sitzung.* Würde vorhandene, datensparsame Current-Session-Truth ungenutzt lassen.
2. *Fake-Liste oder „0 andere Geräte“.* Truth-Bruch; `unsupported` wäre `empty`.
3. *Sessionliste über Service Role oder neues Schema.* Privilegien- und Privacy-Schnitt, AP-5-P2.

**Begründung:** Die ehrliche professionelle Ansicht ist die aktuelle Sitzung plus ausdrückliches Nichtwissen über andere Sitzungen. Eine vollständige Liste ist ohne neues Privilegienmodell nicht baubar.

**Konsequenzen:**

- Evidence: `docs/AP5_S5_HONEST_CURRENT_SESSION_VIEW_STATUS_2026-08-29.md`, `lib/auth/account-session-view.ts`, `components/account/SecuritySitzung.tsx`.
- Keine Migration, kein RLS, kein Auth-Config-Push, keine Service Role.
- AP-6/AP-7 starten nicht aus diesem ADR.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Review. Self-Review ist kein PASS.

**Nachtrag, 29. August 2026 – Integration.** PR #164 ist auf `main @ 765fc547` gemergt. ADR-0194 ist der integrierte S5-Vertrag. AP-6a Gate 0 ist ADR-0195 / Draft-PR #166 und nicht Teil von S5.

---

## ADR-0195 – AP-6a Gate 0: Legal Foundation / Trust Boundary ohne Rechtstext

**Datum:** 29. August 2026  
**Status:** Gate-0-Vertragsfeststellung auf Draft-PR #166 / Issue #165. Keine Legal-Runtime. Keine Consent-Persistenz. Keine behauptete Rechtskonformität.

**Entscheidung:**

1. Production `/privacy` und `/terms` sind ein aktueller Trust-Boundary-Defekt (D0-P1-03): die Registrierung verlangt Zustimmung und verlinkt beide Routen, die Seiten existieren nicht.
2. AP-6a Gate 0 darf nur Docs, Contracts, Evidence und Continuity liefern. Rechtstexte, Firmenidentität, Gerichtsstand, Rechtsgrundlagen und Konformitätsbehauptungen werden nicht erfunden.
3. Legal-Inputs werden nur als `belegt`, `fehlend`, `unknown` oder `PO-Legal-approval-required` klassifiziert. `info@jetnity.ch` ist eine belegte Footer-Anzeige, keine bewiesene verantwortliche Stelle.
4. Der kleinste Runtime-Vertrag für spätere Seiten: `app/(public)/privacy` und `app/(public)/terms`, bestehendes Public-Layout, eine `h1`, Deutsch bis Legal mehr Sprachen liefert, Canonical `https://jetnity.com`, `noindex` und keine Sitemap-Aufnahme bis zum bestehenden Public-Indexing-Gate, Register-Links bleiben, Footer soll beide Routen bekommen, keine Consent-Tabelle.
5. Die UI-Zeile „DSGVO & CH-DSG konform“ ist eine unbelegte Behauptung. Runtime darf sie nur nach ausdrücklicher Legal-Freigabe behalten.
6. `CookieConsent` bleibt Orphan, bis Product Owner ehrlichen Text oder Löschung entscheidet. Der V1-Text „Views/Likes“ ist keine V2-Wahrheit.
7. AP-6b (Consent-Persistenz, Export, Kontolöschung, Migration/RLS) bleibt serial nach AP-6a und startet nicht aus diesem ADR.
8. Ohne PO-/Legal-Content-Gate werden keine Legal-Seiten gebaut. Eine Schein-Privacy ist schlechter als der ehrliche 404.

**Kontext:** AP-5-S1–S5 sind auf `main @ 765fc547` integriert. Issue #165 ist der nächste Account-Slice. Live-Evidence: Production-Alias HTTP 404 auf `/privacy` und `/terms` bei Deployment `dpl_3PWuyGopCnjcdh44twcUUpCWXzmi`.

**Alternativen:**

1. *Runtime-Seiten mit Platzhaltertext.* Würde Konformität andeuten, die nicht existiert.
2. *Register-Links entfernen, bis Texte da sind.* Produktentscheidung; nicht still in Gate 0. Würde den 404-Defekt in einen stillen Consent-ohne-Dokument-Defekt verwandeln.
3. *Impressum/`/datenschutz` mitbauen.* Extra-Input; nicht AP-6a-Default.

**Begründung:** Der Trust-Defekt ist real, aber Legal-Wahrheit darf nicht aus Vermutung entstehen. Gate 0 macht die Lücke entscheidbar.

**Konsequenzen:**

- Evidence: `docs/AP6A_GATE0_LEGAL_FOUNDATION_STATUS_2026-08-29.md`, `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`, `lib/legal/ap6a-gate0-vertrag.ts`.
- Keine Migration, kein RLS, kein Auth-Config-Push, keine Service Role.
- AP-6a-Runtime, AP-6b und AP-7 starten nicht aus diesem ADR.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Review. Self-Review ist kein PASS.

---

## ADR-0196 – Visitor Search: exaktes Länder-Alias ist Ziel-Namenswahrheit

**Datum:** 29. August 2026  
**Status:** Runtime-Korrektur auf Draft-PR #168 / Issue #109. Kein neuer Search-Provider. Keine Migration.

**Entscheidung:**

1. Für Rolle `ziel` gilt ein **exaktes** Länder-Alias oder Keyword aus dem bestehenden `public.places`-Bestand als Namenswahrheit, nicht als schwacher Keyword-Rest.
2. Das Alias bekommt dieselbe Namensstärke wie ein exakter Ländername und steht vor gleichnamigen oder präfixgleichen Städten. Echte Gleichnamen bleiben darunter mit Land/Region unterscheidbar.
3. Nur exakte Alias-Wörter zählen. Keyword-Präfixe werden nicht angehoben.
4. Fehlt in der bereits geholten Namensmenge noch kein exaktes Land, holt die Suche gezielt weitere `typ = country`-Zeilen über Name und Keywords nach. Die bestehende 40er-Keyword-Ergänzung bleibt nur für zu dünne Namensmengen.
5. Rolle `abreise` bleibt stadt- und IATA-geführt. Länder-Alias-Vorrang gilt dort nicht.
6. Kein hartcodierter Peru-/China-/Schweiz-Katalog, kein Geocoder, kein zweiter Suchpfad, keine Place-ID-Erfindung, kein Free-Text-als-Truth.

**Kontext:** Production speichert offizielle Langnamen (`Republic of Peru`, `People’s Republic of China`, `Switzerland`), während Nutzer geläufige Aliase tippen. Nach einem starken Stadt-Namenspräfix fiel das exakte Länder-Alias unter `MIN_RANG_BEI_STARK` oder wurde gar nicht nachgezogen. Issue #109 / Task `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_TASK_2026-08-29.md`.

**Alternativen:**

1. *Hartcodierte Ländernamen.* Würde weltweit weitere offizielle Langnamen erneut brechen.
2. *Schwelle `MIN_RANG_BEI_STARK` senken.* Würde schwache Prefix-Treffer wieder in die kompakte Liste spülen.
3. *Anzeigenamen in Production umschreiben.* Import-/Bestandsmutation, kein Search-Slice, kein Alias für `Schweiz` → `Switzerland`.

**Begründung:** Die Alias-Wahrheit liegt bereits in `keywords`. Ranking und Nachzug müssen sie generisch konsumieren, ohne eine zweite Ortswahrheit zu bauen.

**Konsequenzen:**

- Runtime: `lib/places/suche.ts`, `lib/places/suche-lauf.ts`, `app/api/search/places/route.ts`.
- Vertrag: `docs/ORTE.md`, dieser ADR.
- Keine Migration, kein RLS, kein Provider, keine Kosten.
- Autor-Agent stoppt für unabhängigen Technical-Lead Exact-Head-Review. Self-Review ist kein PASS.

**Nachtrag 29. August 2026 – Production-Recovery nach PR #172:**

Live Production auf `main @ 2241e349` zeigte weiterhin `Peru`/`China` mit Gleichnam-Städten vor dem Land, während `Schweiz` korrekt blieb. Production-`keywords` enthielten die exakten Tokens. Die vorherige Diagnose (Land fehlt in der Menge oder fällt unter `MIN_RANG_BEI_STARK`) war unvollständig: das Land wurde geholt und als Alias auf 5000+220 bewertet, verlor aber gegen Städte, die denselben Token aus dem Import (`asciiName` plus Alternativnamen) zusätzlich als Exact-Keyword (+700) stapelten. `Schweiz` gewann, weil keine Stadt exakt `Schweiz` heisst.

Tests verpassten das, weil sie `orteOrdnen()` mit Städten ohne Import-Keywords fütterten und den PostgREST→`ortAusZeile`→Retrieval-Lauf nicht übten. Der Recovery-Fix macht das exakte Länder-Alias für `ziel` zur ordinalen Erstplatzierung und deckt die Production-Zeilenform plus den Retrieval-Lauf ab. Kein hartcodierter Länderkatalog, keine Bestandsmutation.

**Product-Owner-Klarstellung 29. August 2026:** Peru/China/Schweiz sind nur Beispiele. Dieselbe Invariante gilt für jedes vorhandene Länder-Alias. Zusätzlich muss die Zeile den Typ sofort lesbar machen (`Land` / `Stadt · …` / `Region · …` / `Insel · …` / `Flughafen · IATA · …`). Ein exaktes Alias darf den offiziellen Langnamen als Anzeige ersetzen, ohne die Place-ID zu ändern. Keine Allowlist, keine Übersetzungstabelle.

**Nachtrag 29. August 2026 – kurze Exact-Aliase und Retrieval-Vollständigkeit (TL `5057757711`):**

Ein Substring-Nachzug `keywords.ilike.%token%` mit Limit 12 kann kurze Exact-Aliase verlieren. Live Production enthält mehrfach vergebene Kurz-Tokens; Teilstring-Kandidaten liegen weit über 12.

**Nachtrag 29. August 2026 – Trim-Semantik auch im Retrieval (TL `5057889604`):**

Live Production hat Country-`keywords`, die auf Whitespace enden. Ranking trimmt Komma-Tokens und erkennt sie als Exact-Alias; der selektive PostgREST-Filter ohne Whitespace-Muster holte sie nicht. Retrieval nutzt dieselben getrimmten Token-Grenzen (`imatch` plus explizite End-Muster mit Leerzeichen). Kein Universum-Scan, keine Bestandsmutation, keine Allowlist.

**Nachtrag 29. August 2026 – kein Universum-Transfer auf dem Hot Path (TL `5057811180`):**

Den gesamten `typ = country`-Bestand bei jeder Zielsuche zu lesen (240 Zeilen, allein Keywords ~207 KB) belastet normale Queries wie `Paris`. Der Nachzug bleibt für `ziel` aktiv, damit geteilte Aliase vollständig sind, überträgt aber nur Exact-Name- oder Exact-Komma-Token-Treffer. Limit 500 ist Sicherheitskappe, kein Universum-Scan. Truncation wäre nur möglich, wenn mehr Länder dasselbe Exact-Token teilen als 500. Kein Provider, keine Migration, keine Allowlist. `abreise`, Alias-Anzeige und Shared-Alias-Disambiguierung unverändert.

**Nachtrag 29. August 2026 – mehrdeutige exakte Länder-Aliase (TL `5057687985`):**

Ein exaktes Alias-Token kann mehreren Ländern gehören. Live Production enthält z. B. `Congo` auf CD und CG; weitere geteilte Tokens existieren. Die Darstellung darf deshalb nicht zwei ununterscheidbare `Congo · Land`-Zeilen erzeugen. Generische Regel: Mehrdeutigkeit wird an der **sichtbaren** Ergebnismenge erkannt. Ein eindeutiges Alias bleibt natürlich (`Label` = getroffenes Alias, Kontext `Land`). Bei mehreren exakten Länder-Alias-Matches in derselben sichtbaren Menge bleibt das Alias das Label; sichtbare Zeile und `aria-label` disambiguieren mit kanonischem `name` und `countryCode` (`Land · {Name} · {Code}`). Beide Länder bleiben auswählbar. Place-IDs unverändert. Kein Congo-/Länder-Sonderfall, keine Übersetzungstabelle, keine Bestandsmutation.

---

## Offene Widersprüche

Diese Punkte sind nach [AGENTS.md](AGENTS.md) Regel 29 offen und dürfen nicht eigenmächtig aufgelöst werden.

**1. Anzahl Gastreisen – aufgelöst am 15. August 2026, im Code angeglichen in Phase 1.5.** Entschieden ist: genau eine aktive Gastreise, mehrere Reisen erfordern ein Konto. Siehe ADR-0013. `MAX_GUEST_TRIPS = 20` ist entfallen; `lib/trips/gastspeicher.ts` führt genau eine aktive Gastreise und lehnt eine zweite mit einem Hinweis auf das Konto ab, statt still zu überschreiben. Browser mit mehreren Entwürfen der Fassung v2 behalten den zuletzt geänderten als aktive Reise, die übrigen warten auf den nächsten Login (ADR-0042). Damit besteht hier keine Abweichung mehr.

**2. Monetarisierungsmodell in `docs/JETNITY_V2_FOUNDATION.md`.** Diese ältere Datei (14. August 2026) nennt „Jetnity Pro" als Monetarisierungsstufe sowie ein „Guardian-Modul" und „B2B-Angebote für Reiseberater". Die Vision stellt dagegen klar, dass primär über Reisevermittlung monetarisiert wird und keine neuen Produktkategorien ohne Freigabe entstehen. Auflösung: [JETNITY_VISION.md](JETNITY_VISION.md) hat Vorrang; die genannten Punkte sind in den Backlog der [ROADMAP.md](ROADMAP.md) verschoben, nicht eingeplant.

**3. „Entdecken" als eigener Hauptweg.** `docs/JETNITY_V2_FOUNDATION.md` beschreibt drei gleichrangige Wege (Entdecken, Planen, Meine Reisen). Die Vision benennt den Trip Builder als Kern und grenzt Jetnity von einer Inspirations- und Contentplattform ab. Auflösung: „Entdecken" darf existieren, muss aber dem Reisekern dienen (Einstieg in eine Reise) und darf nicht zu einer eigenen Content-Plattform ausgebaut werden.

**4. Datenbank als Source of Truth – aufgelöst in Phase 1.5.** Regel 13 verlangt, dass keine kritische Geschäftsfunktion ausschliesslich im Local Storage lebt. Reisen eines angemeldeten Kontos liegen jetzt in `public.trips` samt Etappen, Tagen und Planpunkten (ADR-0043); der Browserspeicher trägt ausschliesslich die eine Gastreise, und für die ist er nach Regel 13 ausdrücklich zulässig, weil der Weg ins Konto existiert und geprüft ist (ADR-0042).
