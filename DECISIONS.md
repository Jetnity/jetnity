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
**Status:** umgesetzt auf Draft-PR #32

**Entscheidung:** Ein Provider-Resultat darf nur dann `required`, `not_required` oder `conditional` werden, wenn die Official Evidence vollständig validiert ist: Provider-Identität, gültiges ISO-`checkedAt`, Authority, validierte HTTPS-`sourceUrl` und passende Traveller-/Destination-Zuordnung. Freshness muss `current` sein. Fehlt eines davon, gilt fail closed: `result = unknown`, keine Official Action.

**Kontext:** Human Review von PR #32. Ein Test- oder späterer Echtprovider darf keine regulatorische Aussage ohne belastbare Evidence erzeugen.

**Alternativen:**

1. *Nur Resultat übernehmen, Evidence später ergänzen.* Würde Scheinsicherheit erzeugen.
2. *Teilweise Evidence akzeptieren.* Würde `unknown` und `required` vermischen.

**Begründung:** Official Requirement Truth braucht eine klare Trust-Grenze. Unvollständige Evidence ist keine Aussage.

**Konsequenzen:** `officialEvidenceVertrauenswuerdig()` ist die gemeinsame Schwelle. Temporär nicht erreichbare Quellen bleiben `unknown` mit Freshness `source_temporarily_unavailable`.

---

## ADR-0108 – Origin- und Transit-Ländercodes sind eine dokumentierte Route-Abhängigkeit

**Datum:** 22. August 2026  
**Status:** Naht vorhanden, Fakten noch leer

**Entscheidung:** `routeFactsAusReise()` ist die einzige Naht für Origin- und Transit-Ländercodes. Sie liefert heute `{ originCountryCode: null, transitCountryCodes: [], quelle: 'none' }`. Ortsnamen, Place-IDs und Etappentitel dürfen diese Codes nicht raten.

**Kontext:** Der aktuelle Reisegraph speichert Abreise oft als Freitext (`origin: 'Zürich'`) und Zwischenstopps nicht als belastbare Ländercodes. Automatische Transitprüfung braucht später strukturierte Flight-/Itinerary-Daten.

**Alternativen:**

1. *Aus Stadt- oder Flughafennamen raten.* Verboten; würde `unknown` durch Vermutung ersetzen.
2. *Naht weglassen und nur dokumentieren.* Würde spätere Provideranbindung an verstreute Lesestellen binden.

**Begründung:** Eine leere, explizite Naht macht die Lücke sichtbar und verhindert stilles Raten. Die nächste technische Abhängigkeit ist: Flight-/Itinerary-Ländercodes in `RequirementsAnfrage.originCountryCode` und `transitCountryCodes` füllen, sobald der Graph sie strukturiert trägt.

**Konsequenzen:** Transit ohne belastbare Zwischenstopps bleibt `insufficient_context` (`transit_itinerary`). Ein Provider darf `origin_country` / `transit_itinerary` als Missing Facts zurückgeben; bekannte Codes werden nicht erneut verlangt. Die Foundation darf nicht so dokumentiert werden, als erkenne sie Transit bereits automatisch.

---

## Offene Widersprüche

Diese Punkte sind nach [AGENTS.md](AGENTS.md) Regel 29 offen und dürfen nicht eigenmächtig aufgelöst werden.

**1. Anzahl Gastreisen – aufgelöst am 15. August 2026, im Code angeglichen in Phase 1.5.** Entschieden ist: genau eine aktive Gastreise, mehrere Reisen erfordern ein Konto. Siehe ADR-0013. `MAX_GUEST_TRIPS = 20` ist entfallen; `lib/trips/gastspeicher.ts` führt genau eine aktive Gastreise und lehnt eine zweite mit einem Hinweis auf das Konto ab, statt still zu überschreiben. Browser mit mehreren Entwürfen der Fassung v2 behalten den zuletzt geänderten als aktive Reise, die übrigen warten auf den nächsten Login (ADR-0042). Damit besteht hier keine Abweichung mehr.

**2. Monetarisierungsmodell in `docs/JETNITY_V2_FOUNDATION.md`.** Diese ältere Datei (14. August 2026) nennt „Jetnity Pro" als Monetarisierungsstufe sowie ein „Guardian-Modul" und „B2B-Angebote für Reiseberater". Die Vision stellt dagegen klar, dass primär über Reisevermittlung monetarisiert wird und keine neuen Produktkategorien ohne Freigabe entstehen. Auflösung: [JETNITY_VISION.md](JETNITY_VISION.md) hat Vorrang; die genannten Punkte sind in den Backlog der [ROADMAP.md](ROADMAP.md) verschoben, nicht eingeplant.

**3. „Entdecken" als eigener Hauptweg.** `docs/JETNITY_V2_FOUNDATION.md` beschreibt drei gleichrangige Wege (Entdecken, Planen, Meine Reisen). Die Vision benennt den Trip Builder als Kern und grenzt Jetnity von einer Inspirations- und Contentplattform ab. Auflösung: „Entdecken" darf existieren, muss aber dem Reisekern dienen (Einstieg in eine Reise) und darf nicht zu einer eigenen Content-Plattform ausgebaut werden.

**4. Datenbank als Source of Truth – aufgelöst in Phase 1.5.** Regel 13 verlangt, dass keine kritische Geschäftsfunktion ausschliesslich im Local Storage lebt. Reisen eines angemeldeten Kontos liegen jetzt in `public.trips` samt Etappen, Tagen und Planpunkten (ADR-0043); der Browserspeicher trägt ausschliesslich die eine Gastreise, und für die ist er nach Regel 13 ausdrücklich zulässig, weil der Weg ins Konto existiert und geprüft ist (ADR-0042).
