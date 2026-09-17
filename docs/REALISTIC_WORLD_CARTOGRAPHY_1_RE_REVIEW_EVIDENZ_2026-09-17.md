# Realistic World Cartography 1 – Review-Runde 1 und Post-Merge-Verifikation

Stand: 17. September 2026
Status: **PR #443 GEMERGT / CHANGES-REQUIRED-BEFUNDE WAREN IM GEMERGTEN HEAD ERLEDIGT / POST-MERGE-VERIFIKATION GRÜN**

Draft-PR (gemergt): #443 · Issue: #442 · Product-Owner-Direktive: #441
Cursor-Agent: **`Jetnity realistic world cartography 1`**, Generation **1**, Parent model **Claude Opus 5 High** (kein Auto) — dieselbe logische Session wie die Implementierung.

| | |
| --- | --- |
| Vom Technical Lead geprüfter Head | `856a4ad205ae4102048bb46bda30724ef911f0d4` |
| Gemergter Head | `91148278bc84bb3e4c455829989db83d076f10e3` |
| Merge-Commit auf `main` | `cadb43eac748dd44e2beac8e26ae280301d5a636` |
| Gemergt von | `Jetnity` (Technical Lead), 17.09.2026 02:29:56 UTC |
| Ready gesetzt von | `Jetnity` (Technical Lead), 17.09.2026 02:29:48 UTC |

Zur Klarstellung, weil die Governance das verlangt: **Ready und Merge hat der Technical Lead gesetzt, nicht der Agent.** Der Agent hat zu keinem Zeitpunkt Ready gesetzt, gemergt oder Auto-Merge aktiviert.

Dieses Dokument entstand **nach** dem Merge. Es liegt deshalb nicht im gemergten Head. Es dokumentiert zwei Dinge, die sonst nur im Chatverlauf stünden: wo die beanstandeten Nachweise tatsächlich lagen, und dass `main` nach dem Merge nachweislich gesund ist.

---

## 1. Was am geprüften Head wirklich fehlte

Der Review traf für den Head zu, den er nannte. `856a4ad2` war der **reine Code-Commit**: Geometrie, Kartenebene, Tests, Erzeuger. Er enthielt keine einzige Evidenz- oder Slice-Dokumentationsdatei. Die verlangten Nachweise entstanden erst in den Commits danach — im selben Arbeitsgang, aber später.

Das ist die Erklärung für die Diskrepanz zwischen Review und Wirklichkeit: zwischen `856a4ad2` und dem Zeitpunkt des Reviews lagen vier weitere Commits, die der Review nicht sah.

## 2. Befund für Befund, mit Fundort im gemergten Head

Alle Fundorte beziehen sich auf `91148278` und damit auf `main` ab `cadb43ea`.

| Befund des Technical Lead | Erledigt in | Fundort |
| --- | --- | --- |
| `docs/REALISTIC_WORLD_CARTOGRAPHY_1_HANDOFF_2026-09-17.md` fehlt | `f3e950b5` | vorhanden, 11 Abschnitte: Gate-Tabelle, Sichtbelege, Nutzlast, Sicherheit, Drift, CI/Preview, offene Risiken |
| STATUS fehlt | `f3e950b5` | `docs/REALISTIC_WORLD_CARTOGRAPHY_1_STATUS_2026-09-17.md` |
| SELF_REVIEW fehlt | `f3e950b5` | `docs/REALISTIC_WORLD_CARTOGRAPHY_1_SELF_REVIEW_2026-09-17.md` |
| Kartografie-Provenienz fehlt | `f3e950b5` | `docs/REALISTIC_WORLD_CARTOGRAPHY_1_KARTOGRAFIE_PROVENIENZ.md` – Datensatz, Release `v5.1.2`, Lizenztext im Wortlaut, SHA-256 aller drei Quelldateien, Erzeugungsparameter mit Begründung, gemessene Alternativen |
| 390 px + ≥ 1280 px Sichtbeleg fehlt | `f3e950b5`, neu erzeugt in `4b6ff53b` | `docs/evidence/realistic-world-cartography-1/` – je 390, 1280 und 1440 px für ruhende Karte, gewählten Marker und geteilte Trefferfläche |
| Vorher/Nachher-Geografiebeleg fehlt | `f3e950b5` | `vorher-390-karte.webp` und `vorher-1280-karte.webp` von `main@03842a64`, den Nachher-Bildern direkt gegenübergestellt in `docs/REALISTIC_WORLD_CARTOGRAPHY_1_VISUAL_EVIDENCE_2026-09-17.md` |
| Nutzlast/Bundle-Wirkung fehlt | `f3e950b5` | Provenienz Abschnitt 3, Handoff Abschnitt 6: zwei echte Production-Builds, derselbe Client-Chunk, **+15 252 B brotli** |
| Beleg „kein externer Runtime-Request“ fehlt | `f3e950b5`, neu erzeugt in `4b6ff53b` | `docs/evidence/realistic-world-cartography-1/nachher-bericht.json`, Feld `fremdeHerkuenfte: []` – jede Netzwerkanfrage der Seite wurde mitgeschnitten |
| Beleg zu Overflow / Konsole / Laufzeitfehler fehlt | wie oben | derselbe Bericht: `overflow: 0` auf allen drei Breiten, `konsole: []`; zusätzlich `audit:account` 48/48 in `docs/evidence/REALISTIC_WORLD_CARTOGRAPHY_1_UI_2026-09-17.json` |
| Finaler `origin/main`-Drift-Bericht fehlt | `f3e950b5`, fortgeschrieben in Abschnitt 4 | Handoff Abschnitt 8 und hier |
| Wahrheitssemantik nicht ändern | eingehalten | `lib/account/world-map.ts` steht nicht im Diff gegen die Basis |
| Explicit Visit History 1 nicht starten | eingehalten | kein Commit berührt Besuchshistorie |
| Nicht Ready, nicht mergen | eingehalten | beides hat der Technical Lead getan, nicht der Agent |

In dieser Runde wurde nichts davon neu implementiert. Sie stellt fest, wo es liegt, und prüft, dass es nach dem Merge noch liegt.

## 3. Gate-Läufe je Head — keiner übersprungen

Voller Gate-Satz, jeweils in einem frischen `git worktree` auf genau dem genannten Head.

| Head | Art | Lokaler Gate-Satz | GitHub-Actions |
| --- | --- | --- | --- |
| `856a4ad2` | Code | grün (Implementierungsrunde) | `35172345042` success |
| `4b6ff53b` | Code, letzter | grün, Zahlen im Handoff Abschnitt 4 | — |
| `f3e950b5` | Doku | — (reine `docs/**`) | `35173610481` success |
| `ff7e5f23` | Doku | — (reine `docs/**`) | `35173918323` success |
| `91148278` | Doku, **gemergt** | **grün, vollständig neu gefahren** | `35174172391` success |
| `cadb43ea` | Merge-Commit auf `main` | **grün, Post-Merge-Verifikation** | `35174641427` success |

Der Gate-Satz auf dem gemergten Head `91148278` und auf dem Merge-Commit `cadb43ea`:

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | grün |
| `npm run lint` | 0 Fehler, 138 Warnungen (Bestand, unverändert gegenüber `main@03842a64`) |
| `npm test` | **3 240/3 240 grün**, 572 Suiten |
| `npm run check:dead` | keine unbegründet verwaiste Datei |
| `npm run check:exports` | 0 Exporte ohne Aufrufer |
| `npm run check:deps` | 0 ohne Verwendung, keine neue Abhängigkeit |
| `npm run check:api-schutz` | 12 Admin-Routen, alle geschützt |
| `npm run check:schema-bezug` | grün |
| `npm run build` | grün |
| `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | „ist aktuell“ – keine Geometrie-Drift, aus frischem Quelldownload |
| `npm run audit:account` | **48/48 grün** (WebKit + Chromium × 8 Breiten × 3 Zustände) |
| `node scripts/kartografie/weltkarte-belege.mjs` | `ok: true`, `fremdeHerkuenfte: []` |

Datenbank- und Auth-Gates (`db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen`) wurden nicht ausgeführt und sind nicht einschlägig: der Slice fasst weder `supabase/**` noch `types/supabase.ts` noch die Anmeldung an. `npm ci` wurde nicht ausgeführt, weil `package.json` und `package-lock.json` nicht im Diff stehen; CI führt es ohnehin aus.

### Vercel

`91148278`: Deployment `HendCkeerSp9ENtvPqPSM9rHDYyN` abgeschlossen, Vercel-Kommentar meldet **Ready**. `cadb43ea` auf `main`: Lauf `35174641427` success.

Einschränkung, unverändert und ausdrücklich: die Preview-URL stand hinter Vercel-SSO. Der Agent konnte sie nicht im Browser öffnen. Belegt ist ein erfolgreicher Build und ein abgeschlossenes Deployment auf dem exakten Head — nicht, wie die Preview dort aussah. Die Bildbelege stammen aus einem lokalen Production-Build desselben Codes (`next build` + `next start`), nicht aus dem Entwicklungsmodus.

## 4. Post-Merge-Verifikation von `main`

`origin/main` neu geholt:

```
vorher        03842a64698cae1f4f20f54b7e6aa5016982562c   (Canonical base)
jetzt         cadb43eac748dd44e2beac8e26ae280301d5a636   (Merge Realistic World Cartography 1)
91148278 in main   ja
```

Vorhanden in `main` — Datei für Datei geprüft:

- `lib/account/world-map-geografie.ts`
- `scripts/kartografie/weltkarte-geometrie.mjs`, `scripts/kartografie/weltkarte-belege.mjs`
- STATUS, HANDOFF, SELF_REVIEW, KARTOGRAFIE_PROVENIENZ, VISUAL_EVIDENCE
- `docs/evidence/REALISTIC_WORLD_CARTOGRAPHY_1_UI_2026-09-17.json`
- alle elf Bilder und `nachher-bericht.json` in `docs/evidence/realistic-world-cartography-1/`

Korrekt **entfernt** in `main`: `lib/account/world-map-land.ts` (die abgelöste Handzeichnung).

Berührte Pfade aus den harten Ausschlusslisten: **keine**. Geprüft gegen `components/trips/**`, `lib/reisebegleiter/**`, `lib/modell/**`, `supabase/**`, `types/supabase.ts`, `package.json`, `package-lock.json`, `.github/**`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `JETNITY_VISION.md`, `DESIGN_SYSTEM.md`, `docs/ACTIVE_WORK_STATUS*`, `docs/CONTINUITY*`.

Damit gilt: der Merge hat nichts Halbfertiges nach `main` gebracht, und es fehlt in `main` keiner der beanstandeten Nachweise.

## 5. Commit-Kette

| SHA | Art | Inhalt | in `main`? |
| --- | --- | --- | --- |
| `ba669768` | Doku | Taskdefinition (initial task head) | ja |
| `856a4ad2` | **Code** | Natural-Earth-Vektorgeografie statt Handzeichnung (vom Technical Lead geprüft) | ja |
| `17efa8cf` | Code | Belegskript: Skalierung wählbar | ja |
| `b48fce8d` | Code | Testkommentar: 192 statt geschätzter 130 Stützpunkte | ja |
| `4b6ff53b` | **Code** | Belegskript: Bilder als WebP (letzter Code-Head) | ja |
| `f3e950b5` | Doku | Provenienz, Status, Handoff, Self-Review, Sichtbelege | ja |
| `ff7e5f23` | Doku | CI- und Preview-Ergebnis festgehalten | ja |
| `91148278` | Doku | Handoff-Nachtrag (**gemergter Head**) | ja |
| `06db799a` und dieses Dokument | Doku | Review-Runde 1 und Post-Merge-Verifikation | **nein** – nach dem Merge entstanden |

Ab `f3e950b5` enthält kein Commit mehr Code, Geometrie oder Konfiguration — ausschliesslich `docs/**`.

## 6. Was der Technical Lead mit diesem Dokument tun kann

Es ist reine Nachweisführung, kein Produktcode. Zwei gleichwertige Wege:

1. **Übernehmen.** Der Audit-Trail dieses Slice ist dann vollständig im Repository: Befund, Fundort, Gate-Lauf je Head, Post-Merge-Verifikation. Das entspricht der Progress-Persistence-Policy, die verlangt, dass relevanter Fortschritt nicht nur im Agentenkontext liegt.
2. **Verwerfen.** Der Slice ist funktional und dokumentarisch vollständig in `main`; dieses Dokument fügt nur die Review-Historie hinzu.

Der Agent entscheidet das nicht und mergt nicht.

## 7. Governance

Ready und Merge: durch den Technical Lead. Der Agent hat weder Ready gesetzt noch gemergt noch Auto-Merge aktiviert.
Keine Wahrheitssemantik verändert. Keine Supabase-, Provider-, Payment- oder Commercial-Änderung. Keine Production-Migration, keine Provider-Aktivierung, keine Secrets, keine neuen laufenden Kosten.
Explicit Visit History 1 **nicht** begonnen.

Endzustand: **STOP FOR TECHNICAL-LEAD DECISION über dieses Dokument.**
