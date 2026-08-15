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

## Offene Widersprüche

Diese Punkte sind nach [AGENTS.md](AGENTS.md) Regel 29 offen und dürfen nicht eigenmächtig aufgelöst werden.

**1. Anzahl Gastreisen – aufgelöst am 15. August 2026.** Entschieden ist: genau eine aktive Gastreise, mehrere Reisen erfordern ein Konto. Siehe ADR-0013. Der Code trägt weiterhin `MAX_GUEST_TRIPS = 20`; die Angleichung ist Phase 1.5 zugeordnet. Bis dahin bleibt dies eine bekannte, dokumentierte Abweichung zwischen Entscheidung und Code.

**2. Monetarisierungsmodell in `docs/JETNITY_V2_FOUNDATION.md`.** Diese ältere Datei (14. August 2026) nennt „Jetnity Pro" als Monetarisierungsstufe sowie ein „Guardian-Modul" und „B2B-Angebote für Reiseberater". Die Vision stellt dagegen klar, dass primär über Reisevermittlung monetarisiert wird und keine neuen Produktkategorien ohne Freigabe entstehen. Auflösung: [JETNITY_VISION.md](JETNITY_VISION.md) hat Vorrang; die genannten Punkte sind in den Backlog der [ROADMAP.md](ROADMAP.md) verschoben, nicht eingeplant.

**3. „Entdecken" als eigener Hauptweg.** `docs/JETNITY_V2_FOUNDATION.md` beschreibt drei gleichrangige Wege (Entdecken, Planen, Meine Reisen). Die Vision benennt den Trip Builder als Kern und grenzt Jetnity von einer Inspirations- und Contentplattform ab. Auflösung: „Entdecken" darf existieren, muss aber dem Reisekern dienen (Einstieg in eine Reise) und darf nicht zu einer eigenen Content-Plattform ausgebaut werden.

**4. Datenbank als Source of Truth.** Regel 13 verlangt, dass keine kritische Geschäftsfunktion ausschließlich im Local Storage lebt. Reisen existieren derzeit ausschließlich dort. Das ist für den Gastmodus zulässig, für angemeldete Nutzer nicht. Auflösung ist Bestandteil von Phase 1 und 2, kein Widerspruch in der Zielarchitektur.
