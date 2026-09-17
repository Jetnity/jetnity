# Realistic World Cartography 1 – Re-Review-Evidenz

Stand: 17. September 2026
Status: **CHANGES-REQUIRED-BEFUNDE ERLEDIGT / EXAKTER HEAD NEU GEGATET / STOP FOR TECHNICAL-LEAD RE-REVIEW**

Draft PR: #443 · Issue: #442 · Product-Owner-Direktive: #441
Cursor-Agent: **`Jetnity realistic world cartography 1`**, Generation **1**, Parent model **Claude Opus 5 High** (kein Auto) — dieselbe logische Session wie die Implementierung.

Vom Technical Lead geprüfter Head: `856a4ad205ae4102048bb46bda30724ef911f0d4`
Head zum Zeitpunkt dieser Antwort: `91148278bc84bb3e4c455829989db83d076f10e3`

---

## 1. Warum die Befunde auf dem geprüften Head zutrafen

Der Review traf zu. `856a4ad2` war der **reine Code-Commit**: Geometrie, Kartenebene, Tests, Erzeuger. Er enthielt keine einzige Evidenz- oder Slice-Dokumentationsdatei. Die verlangten Nachweise entstanden erst in den Commits danach.

Das ist keine Entschuldigung, sondern die Erklärung für die Diskrepanz: der Review las einen Head, der zu diesem Zeitpunkt tatsächlich nicht handoff-vollständig war.

## 2. Befund für Befund, mit Fundort auf `91148278`

| Befund des Technical Lead | Erledigt in | Fundort |
| --- | --- | --- |
| `docs/REALISTIC_WORLD_CARTOGRAPHY_1_HANDOFF_2026-09-17.md` fehlt | `f3e950b5` | vorhanden, 11 Abschnitte, mit Gate-Tabelle, Nutzlast, Sicherheit, Drift und offenen Risiken |
| STATUS fehlt | `f3e950b5` | `docs/REALISTIC_WORLD_CARTOGRAPHY_1_STATUS_2026-09-17.md` |
| SELF_REVIEW fehlt | `f3e950b5` | `docs/REALISTIC_WORLD_CARTOGRAPHY_1_SELF_REVIEW_2026-09-17.md` |
| Kartografie-Provenienz fehlt | `f3e950b5` | `docs/REALISTIC_WORLD_CARTOGRAPHY_1_KARTOGRAFIE_PROVENIENZ.md` – Quelle, Release `v5.1.2`, Lizenztext, SHA-256 aller drei Quelldateien, Erzeugungsparameter mit Begründung, gemessene Alternativen |
| 390 px + ≥ 1280 px Sichtbeleg fehlt | `f3e950b5`, neu erzeugt in `4b6ff53b` | `docs/evidence/realistic-world-cartography-1/` – je 390, 1280 und 1440 px für ruhende Karte, gewählten Marker und geteilte Trefferfläche |
| Vorher/Nachher-Geografiebeleg fehlt | `f3e950b5` | `vorher-390-karte.webp`, `vorher-1280-karte.webp` gegen die Nachher-Bilder; direkt untereinander gestellt in `docs/REALISTIC_WORLD_CARTOGRAPHY_1_VISUAL_EVIDENCE_2026-09-17.md` |
| Nutzlast/Bundle-Wirkung fehlt | `f3e950b5` | Provenienz Abschnitt 3 und Handoff Abschnitt 6: zwei echte Production-Builds, derselbe Client-Chunk, **+15 252 B brotli** |
| Beleg „kein externer Runtime-Request“ fehlt | `f3e950b5`, neu erzeugt in `4b6ff53b` | `docs/evidence/realistic-world-cartography-1/nachher-bericht.json`, Feld `fremdeHerkuenfte: []` – jede Netzwerkanfrage der Seite wurde mitgeschnitten |
| Beleg zu Overflow / Konsole / Laufzeitfehler fehlt | wie oben | derselbe Bericht: `overflow: 0` auf allen drei Breiten, `konsole: []`, zusätzlich `audit:account` 48/48 |
| Finaler `origin/main`-Drift-Bericht fehlt | `f3e950b5`, hier aktualisiert | Abschnitt 4 dieses Dokuments |
| Wahrheitssemantik nicht ändern | eingehalten | `lib/account/world-map.ts` steht nicht im Diff gegen die Basis |
| Explicit Visit History 1 nicht starten | eingehalten | kein Commit berührt Besuchshistorie |
| Nicht Ready, nicht mergen | eingehalten | PR ist Draft, kein Merge |

Nichts davon ist in dieser Runde neu implementiert worden. Diese Runde stellt fest, wo es liegt, gatet den exakten Head neu und schreibt den Drift fort.

## 3. Gates auf dem exakten Head `91148278`

Voller Gate-Satz, neu gefahren in einem frischen `git worktree` auf genau diesem Head.

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
| `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | „ist aktuell“ – keine Geometrie-Drift |
| `npm run audit:account` | **48/48 grün** (WebKit + Chromium × 8 Breiten × 3 Zustände) |
| `node scripts/kartografie/weltkarte-belege.mjs` | `ok: true`, `fremdeHerkuenfte: []` |

Datenbank- und Auth-Gates (`db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen`) wurden nicht ausgeführt und sind nicht einschlägig: der Slice fasst weder `supabase/**` noch `types/supabase.ts` noch die Anmeldung an. `npm ci` wurde nicht ausgeführt, weil `package.json` und `package-lock.json` nicht im Diff stehen; CI führt es ohnehin aus.

### Exact-head CI und Vercel

Jeder Head dieses Branches hat einen eigenen grünen Lauf. Keiner wurde übersprungen:

| Head | GitHub-Actions-Lauf | Ergebnis |
| --- | --- | --- |
| `ba669768` | `35170752763` | success |
| `856a4ad2` | `35172345042` | success (der vom Technical Lead genannte Lauf) |
| `f3e950b5` | `35173610481` | success |
| `ff7e5f23` | `35173918323` | success |
| `91148278` | `35174172391` | success |

Auf `91148278`: `Typecheck, Lint & Build` pass (2 m 26 s), `Auth-Konfiguration gegen config.toml` pass (22 s), `Vercel` pass – Deployment `HendCkeerSp9ENtvPqPSM9rHDYyN` abgeschlossen, Vercel-Kommentar meldet **Ready**.

Einschränkung, unverändert und ausdrücklich: die Preview-URL steht hinter Vercel-SSO. Der Agent konnte sie nicht im Browser öffnen. Belegt ist ein erfolgreicher Build und ein abgeschlossenes Deployment auf dem exakten Head — nicht, wie die Preview dort aussieht. Die Bildbelege stammen aus einem lokalen Production-Build desselben Codes (`next build` + `next start`), nicht aus dem Entwicklungsmodus.

## 4. Stand gegenüber `origin/main`

`origin/main` unmittelbar vor dieser Antwort neu geholt:

```
origin/main   03842a64698cae1f4f20f54b7e6aa5016982562c   (= Canonical base)
merge-base    03842a64698cae1f4f20f54b7e6aa5016982562c
HEAD          91148278bc84bb3e4c455829989db83d076f10e3
ahead         8 Commits
behind        0 Commits
Drift         keine
```

Der Branch ist gegenüber der kanonischen Basis nicht zurückgefallen; `main` hat sich seit `03842a64` nicht bewegt. Der Diff gegen die Basis umfasst 26 Dateien.

Berührte Pfade aus den harten Ausschlusslisten: **keine**. Geprüft gegen `components/trips/**`, `lib/reisebegleiter/**`, `lib/modell/**`, `supabase/**`, `types/supabase.ts`, `package.json`, `package-lock.json`, `.github/**`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `JETNITY_VISION.md`, `DESIGN_SYSTEM.md`, `docs/ACTIVE_WORK_STATUS*`, `docs/CONTINUITY*`.

## 5. Commit-Kette

| SHA | Art | Inhalt |
| --- | --- | --- |
| `ba669768` | Doku | Taskdefinition (initial task head) |
| `856a4ad2` | **Code** | Natural-Earth-Vektorgeografie statt Handzeichnung (vom Technical Lead geprüft) |
| `17efa8cf` | Code | Belegskript: Skalierung wählbar |
| `b48fce8d` | Code | Testkommentar: 192 statt geschätzter 130 Stützpunkte |
| `4b6ff53b` | **Code** | Belegskript: Bilder als WebP (**letzter Code-Head**) |
| `f3e950b5` | Doku | Provenienz, Status, Handoff, Self-Review, Sichtbelege |
| `ff7e5f23` | Doku | CI- und Preview-Ergebnis festgehalten |
| `91148278` | Doku | Handoff-Nachtrag |
| *dieser Commit* | Doku | dieses Dokument |

Ab `f3e950b5` enthält kein Commit mehr Code, Geometrie oder Konfiguration — ausschliesslich `docs/**`.

## 6. Wo diese Kette endet

Jeder Nachtrag eines Gate-Ergebnisses erzeugt einen neuen Head, der wieder ein Gate-Ergebnis erzeugt. Damit das nicht endlos läuft, gilt hier eine ausdrückliche Abschlussregel:

- Der Commit, der dieses Dokument hinzufügt, ist der letzte dieser Runde.
- Er ändert ausschliesslich `docs/**`: dieses Dokument sowie je einen Querverweis und die fortgeschriebenen Drift-Zahlen in Status und Handoff. Kein Code, keine Geometrie, keine Konfiguration, kein Bild.
- Sein eigener Gate-Lauf steht an zwei Stellen, die der Technical Lead direkt lesen kann: in den **PR-Checks** von #443 und im Abschlussbericht des Agenten. Der volle lokale Gate-Satz wurde zusätzlich auf diesem finalen Head gefahren; das Ergebnis steht im Abschlussbericht.
- Ein reiner `docs/**`-Commit kann die Ergebnisse aus Abschnitt 3 nicht verändern. Wer das nicht glauben will, prüft es an `git diff 91148278..HEAD --stat`.

## 7. Governance

Nicht Ready gesetzt. Nicht gemergt. Keine Wahrheitssemantik verändert. Keine Supabase-, Provider- oder Commercial-Änderung. Explicit Visit History 1 nicht begonnen.

Endzustand: **STOP FOR TECHNICAL-LEAD RE-REVIEW.**
