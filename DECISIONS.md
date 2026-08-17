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
**Status:** umgesetzt

**Entscheidung:** `engines.node` lautet `>=20.9`. `package-lock.json` wurde mit `package.json` synchronisiert. `simple-swizzle` ist über `overrides` auf `0.2.2` gepinnt.

**Kontext:** `npm ci` schlug fehl, weil Lockfile und `package.json` auseinanderliefen. Die vorherige Angabe `>=18.17 <21` schloss die von Vercel und CI genutzten Node-Versionen aus. Die Korrektur an `simple-swizzle` existierte nur im Lockfile und wäre bei jedem `npm install` verloren gegangen.

**Alternativen:** Node-Version im CI herunterpinnen; Lockfile löschen und neu erzeugen.

**Begründung:** Die Laufzeitumgebung soll die Realität abbilden statt eine veraltete Einschränkung. Ein `override` macht die Absicht explizit und überlebt Neuinstallationen.

**Konsequenzen:** `npm ci` ist reproduzierbar. Ein reproduzierbares `npm ci` ist Voraussetzung für CI.

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
**Status:** freigegeben, noch nicht umgesetzt

**Entscheidung:** Flüge über **Amadeus** (bestehende Airport-Integration weiterverwenden), Hotels zunächst über eine einfache **Affiliate-/Deeplink-Lösung**, Aktivitäten über **GetYourGuide**. Je Kategorie zunächst genau ein Weg.

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

Bei der Durchsicht fiel der letzte verbliebene Service-Role-Pfad in der Anwendung auf: `api/search/airports` legte, sobald `SUPABASE_SERVICE_ROLE_KEY` gesetzt war, einen zweiten Client mit vollen Rechten an und schrieb damit Amadeus-Ergebnisse in `airports` zurück. Der Endpunkt ist öffentlich und ohne Anmeldung erreichbar; eine Suchanfrage eines beliebigen Besuchers hätte damit einen Schreibvorgang mit vollen Datenbankrechten ausgelöst, ohne Auth, ohne Ownership und ohne Rate Limit – die Prüfliste aus [AGENTS.md](AGENTS.md) Regel 14 verfehlt er in drei Punkten. Das Zwischenspeichern ist entfernt; die Suche liefert unverändert lokale Treffer und den Amadeus-Fallback, sie schreibt nur nicht mehr. Referenzdaten zu befüllen gehört in eine Migration oder einen Verwaltungsvorgang, nicht in eine öffentliche Suchabfrage. Damit liest kein Codepfad der Anwendung mehr einen Service-Role-Key, und der Setup-Check fragt ihn nicht mehr ab.

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

In der Oberfläche bleibt eine Lücke. `OverviewCard` und `SecurityWidget` zeigen die Meldung an, `TransactionsCard` und `WebhooksCard` in `components/admin/payments/PaymentsCenter.tsx` werfen den Fehler in ein `finally` ohne `catch` – die Tabelle bleibt dann leer, ohne Hinweis. Die Antwort des Servers ist korrekt, ihre Darstellung noch nicht; das gehört zur Oberflächenarbeit und ist in [ROADMAP.md](ROADMAP.md) vermerkt.

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

## Offene Widersprüche

Diese Punkte sind nach [AGENTS.md](AGENTS.md) Regel 29 offen und dürfen nicht eigenmächtig aufgelöst werden.

**1. Anzahl Gastreisen – aufgelöst am 15. August 2026.** Entschieden ist: genau eine aktive Gastreise, mehrere Reisen erfordern ein Konto. Siehe ADR-0013. Der Code trägt weiterhin `MAX_GUEST_TRIPS = 20`; die Angleichung ist Phase 1.5 zugeordnet. Bis dahin bleibt dies eine bekannte, dokumentierte Abweichung zwischen Entscheidung und Code.

**2. Monetarisierungsmodell in `docs/JETNITY_V2_FOUNDATION.md`.** Diese ältere Datei (14. August 2026) nennt „Jetnity Pro" als Monetarisierungsstufe sowie ein „Guardian-Modul" und „B2B-Angebote für Reiseberater". Die Vision stellt dagegen klar, dass primär über Reisevermittlung monetarisiert wird und keine neuen Produktkategorien ohne Freigabe entstehen. Auflösung: [JETNITY_VISION.md](JETNITY_VISION.md) hat Vorrang; die genannten Punkte sind in den Backlog der [ROADMAP.md](ROADMAP.md) verschoben, nicht eingeplant.

**3. „Entdecken" als eigener Hauptweg.** `docs/JETNITY_V2_FOUNDATION.md` beschreibt drei gleichrangige Wege (Entdecken, Planen, Meine Reisen). Die Vision benennt den Trip Builder als Kern und grenzt Jetnity von einer Inspirations- und Contentplattform ab. Auflösung: „Entdecken" darf existieren, muss aber dem Reisekern dienen (Einstieg in eine Reise) und darf nicht zu einer eigenen Content-Plattform ausgebaut werden.

**4. Datenbank als Source of Truth.** Regel 13 verlangt, dass keine kritische Geschäftsfunktion ausschließlich im Local Storage lebt. Reisen existieren derzeit ausschließlich dort. Das ist für den Gastmodus zulässig, für angemeldete Nutzer nicht. Auflösung ist Bestandteil von Phase 1 und 2, kein Widerspruch in der Zielarchitektur.
