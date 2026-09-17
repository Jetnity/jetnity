# Realistic World Cartography 1 – Slice Status

Stand: 17. September 2026
Status: **IMPLEMENTED / GATES GREEN / EVIDENCE PERSISTED / CHANGES-REQUIRED-RUNDE 1 ERLEDIGT / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Review-Runde 1: Der Technical Lead prüfte Head `856a4ad2` – den reinen Code-Commit, der noch keine Evidenz- oder Slice-Dokumentation enthielt – und forderte Änderungen. Die verlangten Nachweise lagen zum Zeitpunkt des Reviews bereits in den Folge-Commits. Befund für Befund mit Fundort, neu gefahrenem Gate-Satz auf dem exakten Head und fortgeschriebenem Drift: `docs/REALISTIC_WORLD_CARTOGRAPHY_1_RE_REVIEW_EVIDENZ_2026-09-17.md`.

Issue: #442
Product-Owner-Direktive: #441
Draft PR: #443
Branch: `feat/phase-1-realistic-world-cartography-1`
Binding: `docs/REALISTIC_WORLD_CARTOGRAPHY_1_TASK_2026-09-17.md`

Cursor-Agent: **`Jetnity realistic world cartography 1`**
Generation: **1**
Parent model: **Claude Opus 5 High** (kein Auto, kein Ersatzmodell)

Canonical base: `main@03842a64698cae1f4f20f54b7e6aa5016982562c`
Initial task head: `ba6697683d91a2a914a0d322ca0a6dd94774efa3`
Gegateter Code-Head: `4b6ff53bcbe41978dfab2f11b5911dee99b4b5ef`

Dieses Dokument ist slice-spezifisch. Globale Continuity-, Roadmap- und `ACTIVE_WORK_STATUS`-Dateien wurden während der Implementierung bewusst **nicht** angefasst – so verlangt es der Ownership-Lock des Tasks gegenüber PR #435 (Assistant Runtime) und PR #439 (Account/Privacy/Ops Audit).

---

## Was umgesetzt ist

| Anforderung aus dem Task | Stand |
| --- | --- |
| Geometrie materiell realistischer, nicht nur umgefärbt | fertig – 11 Handformen mit 192 Stützpunkten → 278 Landflächen mit 4 326 Stützpunkten aus Natural Earth 50m |
| Kontinente/Küsten erkennbar und proportional richtig | fertig |
| Erfundene Platzhalterformen entfernt | fertig – die Handzeichnung ist vollständig abgelöst, nicht übermalt |
| Inseln/Halbinseln auf Weltmassstab nicht kaputt | fertig – 278 statt 11 Flächen, u. a. Indonesien, Philippinen, Karibik, Ägäis, Patagonien |
| Markerkoordinaten nicht gegen die Projektion verschoben | fertig – dieselbe gleichwinklige Projektion wie `weltKarteProjektion`; Punkt-in-Fläche-Stichproben im Test |
| Klare Wasser-/Land-Trennung | fertig – eigene Wasserfläche, Land mit Küstenlinie, Binnenseen als Wasser über Land |
| Ländergrenzen nur, wo sie helfen | fertig – 397 Grenzlinien als hauchdünne Orientierung, mit sichtbarem Vorbehalt |
| Gradnetz nur, wenn es orientiert | fertig – deutlich zurückgenommen, jetzt über der Karte statt darunter |
| Kein dunkles Admin-Thema | fertig – bestehende Jetnity-Tokens, keine neuen Farben |
| Dichte Marker, ≥ 44 px, Auswahl nicht nur farblich | unverändert erhalten, erneut belegt |
| Beschriftungen bleiben in der Karte | unverändert erhalten |
| Keine Markerpositions-Ableitung | unverändert – Marker kommen weiterhin nur aus gespeicherten Koordinaten |
| 390 px und Desktop belegt, kein horizontaler Überlauf | fertig – 0 px Überlauf auf 390/1280/1440, 48/48 Kombinationen im Account-UI-Audit grün |
| Tastatur, reduzierte Bewegung, SVG-Titel/Beschreibung | erhalten; die Beschreibung nennt jetzt zusätzlich, was die Grundkarte zeigt |
| Nutzlast gemessen | fertig – +15,3 KB brotli im Client-Chunk, Zahlen in der Provenienz |
| Keine schwere Kartenbibliothek | fertig – kein neues Paket, nur erzeugte SVG-Pfade |
| Kein übermässiger DOM | fertig – 11 `path`-Elemente → 3, 29 SVG-Knoten → 22 |
| Quelle/Provenienz/Lizenz dokumentiert | fertig – `docs/REALISTIC_WORLD_CARTOGRAPHY_1_KARTOGRAFIE_PROVENIENZ.md` |

## Wahrheitsverträge, die unverändert gelten

Geprüft und unangetastet:

- geplant ≠ besucht; keine abgeleitete Besuchshistorie;
- kein Geocoding, keine Land- oder Koordinatenerschliessung aus Namen;
- keine zweite Reiseabfrage;
- keine Persistenz, keine Migration, kein Supabase-Zugriff;
- kein Provider-/Commercial-/Payment-Aufruf;
- kein externer Karten-, Kachel- oder Ortsauflösungsabruf zur Laufzeit.

`lib/account/world-map.ts` ist **nicht** verändert. Die Wahrheitsableitung hat diesen Slice nicht bemerkt.

## Nicht Teil dieses Slice

- keine Besuchshistorie (Explicit Visit History 1 wurde nicht begonnen);
- keine Änderung am gezeigten Kartenausschnitt oder an der Projektion;
- keine neue Datenbankstruktur, keine RLS-Berührung, kein Auth/MFA/AAL;
- kein neues npm-Paket, keine Änderung an `package.json` oder Lockfile;
- keine Änderung an CI-Workflows oder Hygiene-Skripten.

## Berührte Dateien

| Datei | Art |
| --- | --- |
| `lib/account/world-map-geografie.ts` | **neu, erzeugt** – Natural-Earth-Geometrie in Projektionskoordinaten |
| `lib/account/world-map-land.ts` | **entfernt** – die handgezeichnete Silhouette, vollständig abgelöst |
| `components/account/AccountWeltKarte.tsx` | Grundkarte neu gezeichnet: Wasser, Land, Seen, Grenzen, Gradnetz; sichtbare Kartenherkunft |
| `lib/account/world-map-ansicht.ts` | zwei neue Texte: Beschreibung der Grundkarte, Herkunfts- und Grenzhinweis |
| `lib/account/world-map.test.ts` | neue Prüfgruppe „Die Grundkarte ist belegte, lokale Vektorgeografie“ |
| `scripts/kartografie/weltkarte-geometrie.mjs` | **neu** – deterministischer Erzeuger der Geometrie |
| `scripts/kartografie/weltkarte-belege.mjs` | **neu** – Sicht- und Messbelege aus dem Production-Build |
| `docs/REALISTIC_WORLD_CARTOGRAPHY_1_*` | slice-spezifische Evidenz |
| `docs/evidence/realistic-world-cartography-1/*` | Bilder 390/1280/1440 vorher/nachher plus Messbericht |
| `docs/evidence/REALISTIC_WORLD_CARTOGRAPHY_1_UI_2026-09-17.json` | Account-UI-Audit, 48 Kombinationen |

Nicht berührt: `components/trips/**`, `lib/reisebegleiter/**`, `lib/modell/**`, `supabase/**`, `types/supabase.ts`, `components/account/AccountAuditClient.tsx`, Dateien aus #435 und #439, globale Continuity-/Roadmap-Dokumente, `package.json`, `package-lock.json`, CI-Workflows.

## Gates

Alles grün: Typecheck, Lint (0 Fehler), 3 240/3 240 Tests, fünf Hygiene-Checks, Production-Build, Account-UI-Audit 48/48, Geometrie-Drift-Check. Auf dem finalen Head `f3e950b5eed65e039e6f6bb2f37712ef82b62aba` zusätzlich GitHub-Actions-Lauf `35173610481` grün und Vercel-Deployment abgeschlossen.

Zahlen, Befehle, Einschränkungen und Drift stehen in `docs/REALISTIC_WORLD_CARTOGRAPHY_1_HANDOFF_2026-09-17.md`.

## Nächster Schritt

Technical-Lead-Exact-Head-Review von Draft PR #443.
**Nicht Ready setzen. Nicht mergen. Explicit Visit History 1 nicht starten.**
