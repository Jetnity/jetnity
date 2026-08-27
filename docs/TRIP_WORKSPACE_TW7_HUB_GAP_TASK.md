# Jetnity – TW-7 Hub-Anschluss – verbleibender Gap und Implementierungsslice

Stand: 27. August 2026  
Typ: **DOCS-ONLY / Gap-Rekonstruktion / Slice-Auftrag**  
Cursor-Agent: `Trip workspace audit architecture`  
Branch: `cursor/tw7-hub-gap-slice-b13d`  
Status: **DOCS DRAFT. Kein Runtime-Code. Kein Ready. Kein Merge. Kein automatischer Runtime-Start.**

Live-Baseline dieses Dokuments: `origin/main` `beaef64a151adceb8f5bc759f58ae9ad13cecc51` (Merge PR #98). Hub-/AP-3-Code unverändert gegenüber der ersten Prüfung auf `84f54194`.

> Live-Evidence gewinnt. Vor einem späteren Runtime-PR `origin/main`, offene PRs und diese Dateien erneut prüfen.

## 1. Auftrag dieses Dokuments

Aktuellen `main` und die bindenden TW-/AP-3-Verträge live prüfen, den **tatsächlichen verbleibenden TW-7-Gap** bestimmen und den **exakten kleinen Implementierungsslice** inkl. Dateien, Tests und Konfliktmatrix versionieren.

Dieser PR implementiert den Slice **nicht**.

## 2. Live-Rekonstruktion – was TW-7 nicht mehr ist

Auf `beaef64a` (Hub-Code unverändert seit `84f54194`) ist der Hub-/Workspace-**Weg** bereits ein Pfad. Das Start-Gate aus `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md` („Account-/Hub-Verträge und aktuellen AP-Stand erneut prüfen“) ist fachlich erfüllt. Unabhängige Bestätigung: `docs/CHATGPT_TL_LIVE_RECONSTRUCTION_CHECKPOINT_2026-08-27.md` Abschnitt 9.

Bereits geschlossen und **nicht** neu zu bauen:

| Vertrag | Evidence auf `main` | Darf TW-7 nicht |
| --- | --- | --- |
| AP-3 ableitende Gruppen Aktiv / Kommend / Vergangen / Ohne Datum | ADR-0160, `lib/account/reise-lage.ts`, `KontoReisenGruppen` | Gruppen, Suche, 200er-Grenze, Error≠Empty neu modellieren |
| Workspace-Lage = AP-3-`reiseGruppe` | ADR-0164, `uebersichtLage()`, `lib/trips/uebersicht.test.ts` | zweiten Lifecycle erfinden |
| `/account` → `/reisen` → `/reisen/[tripId]` → `TripWorkspace` | `AccountUebersicht`, `app/(public)/reisen/page.tsx`, `TripWorkspace` | zweiten Hub oder zweite Workspace-Route |
| Gast und Konto dieselbe Adresse `/reisen` | `ReisenSeite` | Gast-Gruppen wie Konto erzwingen |
| Guest-One-Trip / Fortsetzen | TW6-A, `gastReisenPrimaerCta` | zweite aktive Gastreise oder Create-CTA umbauen |
| Archiv | AP-3 schreibt/filtert nicht; Account-Übersicht filtert nur Fortsetzen | `status=archived` Write oder Hub-Filter (AP-4) |

`KontoReisenGruppen` sagt ausdrücklich: kein Archiv-Write, kein zweites Modell, **keine Workspace-Karten**. Das bleibt die Grenze. TW-7 darf den Hub nicht zum Mini-Workspace machen.

## 3. Tatsächlicher verbleibender Gap

Der belegte Rest ist **Kartenidentität**, nicht Navigation und nicht Lebenslage.

1. `TripSummary` trägt nur `stageCount`, keine geordneten Etappennamen.
2. `reisenLaden()` liest `trip_stages(count)` und verwirft die Zielidentität.
3. `Reisekarte` zeigt Titel, optional `ab {origin}`, Zeitraum, Personen, Tage/Punkte und gespeicherten `trips.status`. Eine Mehrzielreise ist als Route nicht erkennbar.
4. Workspace-Übersicht zeigt dieselbe Reise bereits als `Etappe · Etappe · ab Herkunft` (`uebersichtOrte`, Test: `Ubud · ab Zürich`).
5. Gast-`alsUebersicht` zählt `ohneTag` nicht in `itemCount`; die Konto-Liste zählt alle `trip_items`. Dieselbe Karte lügt je nach Ablage.

Das verletzt den verbindlichen Transformationsvertrag:

- Multi-Destination auf Reisekarten verständlich erkennbar;
- Einstieg / Planung / Hub / Workspace dieselbe Reise-Wahrheit;
- keine semantischen Sprünge auf dem Weg in den Workspace.

Product-Owner-Evidence: `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md` §2.3–2.4 und `docs/PRODUCT_OWNER_PR34_ACCEPTANCE_NOTES.md` Abnahmepunkt 1b.

Nicht der Rest-Gap dieses Slices:

- gespeicherter `trips.status` (`Entwurf`/`Geplant`/`Gebucht`/`Archiviert`) neben ableitender Lage – zweites Sprachproblem, aber nicht der von AP-3/TW-2/TL benannte TW-7-Auftrag;
- Attention, Coverage, Timeline oder `Jetzt wichtig` auf Hub-Karten;
- Account-Übersicht als zweite Multi-Destination-Fläche (ADR-0152);
- Pfeilschreibweise `Bangkok → Chiang Mai → Phuket` statt bestehendem Workspace-`·` – spätere UX-Abnahme, kein dritter Formatfork in diesem Slice;
- Titelsuche auf Etappennamen ausweiten – das wäre eine AP-3-Suchvertragsänderung.

Traveller-Kontext ist für diesen Slice **nicht relevant**: es werden vorhandene Etappennamen gelesen, keine Citizenships, Dokumente oder Eligibility.

## 4. Exakter Runtime-Slice – erst nach eigenem Auftrag

Name: **TW7-A – Hub-Kartenidentität (read-only)**

Ziel: Hub-`Reisekarte` und Workspace-Übersicht nennen dieselbe geordnete Zielidentität. Gast und Konto dieselbe fachliche Darstellung. Der bestehende Weg bleibt.

### Darf

- `TripSummary` um geordnete Etappennamen erweitern (`name` + `position` aus vorhandenem `trip_stages`);
- `reisenLaden()` von `trip_stages(count)` auf eingebettete `trip_stages(name, position)` umstellen; `stageCount` weiter aus der gelesenen Menge ableiten;
- gemeinsame Presentation-Derivation aus der bestehenden `uebersichtOrte`-Regel heben und in `Reisekarte` verwenden;
- Gast-Abbildung dieselben Namen und `itemCount = Tage + ohneTag` liefern;
- bestehende RLS-/Ownership-Reads nutzen; keine Service Role.

### Darf nicht

- Runtime in **diesem** Docs-PR;
- Schema, Migration, RLS-, Auth-, AAL-, Production-Write;
- AP-3-Gruppen, Geräte-Kalendertag, 200er-Grenze, Error≠Empty ändern;
- Archiv schreiben oder aus dem Hub filtern;
- Guest-One-Trip, Guest→Account, Create-Entry oder `/planen` ändern;
- Account-Übersicht zum Workspace-Klon machen;
- Attention, Coverage, Preise, Freshness oder Commercial Surfaces auf die Karte ziehen;
- Place-IDs, Koordinaten, Citizenships oder Dokumente in die Listenabfrage aufnehmen;
- Search-Provider, Homepage-Hero, Direction A, TW-8/9, AP-4/AP-7, S5-B.

### Sichtregel

Genau der bestehende Workspace-Algorithmus:

- 0 Etappen → `Ziel noch offen`;
- ≥1 Etappe → Namen in `position`-Reihenfolge, getrennt durch ` · `;
- Herkunft vorhanden → `… · ab {origin}`.

Keine erfundene Kurzform, keine Transit-/Flight-Ziele, keine stille Reorder. `trips.status` bleibt sichtbar, wird in diesem Slice aber nicht zur Lage umgedeutet. Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar.

## 5. Dateien des späteren Runtime-PR

Nur diese Touch-Fläche, sofern der Live-Stand dann noch gilt:

| Datei | Änderung |
| --- | --- |
| `types/trips.ts` | `TripSummary` um geordnete Etappennamen; `stageCount` bleibt ableitbar |
| `lib/trips/daten.ts` | Listen-Select + Abbildung; weiter `lese()`, kein Service Role |
| `lib/trips/uebersicht.ts` | `uebersichtOrte` zur geteilten Helper-Funktion exportieren oder nach `lib/trips/reise-orte.ts` heben |
| `components/trips/Reisekarte.tsx` | denselben Ortstext rendern; kein Workspace-Klon |
| `components/trips/GastReisen.tsx` | `alsUebersicht`: Stages + `ohneTag` in `itemCount` |
| `lib/trips/reise-orte.ts` | **neu**, nur wenn der Helper nicht in `uebersicht.ts` bleiben soll |
| `lib/trips/reise-orte.test.ts` | **neu** – Pflichtmatrix unten |
| `lib/trips/uebersicht.test.ts` | bestehende Ortstests auf den Helper umbiegen, Text unverändert |
| Fixture-Stellen mit `TripSummary` | `stageNames`/`stages` ergänzen, ohne AP-3-Prädikate zu ändern: `lib/account/reise-lage.test.ts`, `lib/account/naechste-reise.test.ts`, `components/account/AccountAuditClient.tsx` |

Nicht anfassen, ausser ein späterer Review zwingt eine einzeilige Typanpassung:

- `components/trips/KontoReisenGruppen.tsx` (Gruppenlogik)
- `app/(public)/reisen/page.tsx` (Error≠Empty, Create-CTA)
- `lib/account/reise-lage.ts`
- `components/account/AccountUebersicht.tsx`
- Auth, RLS, Admin, Provider, Search, Homepage
- AAL2-Migration `20260827170000` und Production-Apply-Playbook

## 6. Pflichttests des späteren Runtime-PR

Neue Unit-Datei, bevorzugter Ort `lib/trips/reise-orte.test.ts`:

1. 0 Etappen, ohne Herkunft → `Ziel noch offen`
2. 0 Etappen, mit Herkunft → `Ziel noch offen · ab Zürich`
3. 1 Etappe + Herkunft → `Ubud · ab Zürich` (identisch zum bestehenden TW-2-Test)
4. 3 Etappen in `position`-Unordnung → Ausgabe folgt `position`, nicht Array-Index (`Bangkok · Chiang Mai · Phuket`)
5. leerer Etappenname wird nicht als Ziel erfunden
6. Transit-/Flight-Felder werden nicht gelesen
7. Gast-`itemCount` zählt `days.items + ohneTag`; Konto-Abbildung zählt dieselbe Menge
8. `stageCount` entspricht der gelesenen Etappenmenge, nicht einem zweiten Zähler

Regression, unverändert grün:

- `lib/account/reise-lage.test.ts`
- `lib/account/naechste-reise.test.ts`
- `lib/trips/uebersicht.test.ts` Lage = `reiseGruppe`
- `lib/trips/create-entry.test.ts` / Guest-One-Trip-CTA
- vorhandene Error≠Empty-Pfade von `/reisen`

Gates des Runtime-PR, nicht dieses Docs-PR:

- Typecheck, Lint, `npm test`
- `check:schema-bezug` (geänderter Select)
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`
- Production-Build
- Exact-Head GitHub Actions + Vercel
- unabhängiger Technical-Lead-Review

Kein Schema-/RLS-/Auth-Gate, weil der Slice keine Migration und keine Policy ändert. Wenn der Select zur Laufzeit an RLS scheitert: Slice stoppen, nicht Service Role nachrüsten.

## 7. Konfliktmatrix

| Parallel / Vertrag | Kollision | Regel |
| --- | --- | --- |
| **PR #98** AAL2 Alignment | integriert auf `main` `beaef64a`; ADR-0175; Datei `20260827170000` | Kein offener Parallel-Draft mehr. Production-Apply bleibt eigenes Product-Owner-Gate. Dieser Docs-PR ändert keine AAL2-Migration und startet keinen Apply. |
| AP-3 / ADR-0160 | `reise-lage.ts`, Gruppen-UI | Read-only. Kein zweites Lage-Modell. |
| TW-2 / ADR-0164 | `uebersicht.ts` Ortstext | Helper heben, sichtbaren Workspace-Text nicht ändern. |
| ADR-0152 Account-Zuhause | `AccountUebersicht` | Nicht in TW7-A. Fortsetzen-Link bleibt `/reisen/[tripId]`. |
| AP-4 Archiv | `trips.status = archived` | Nicht schreiben, nicht aus Hub filtern. |
| AP-7 Traveller-Registry | Party / Dokumente | Nicht lesen, nicht anzeigen. |
| TW6-A / Guest-One-Trip | `GastReisen` CTA | Nur `alsUebersicht`-Abbildung. CTA unverändert. |
| Visitor Search / PR #94 | Search-API, Combobox | Nicht anfassen. |
| TW-8 / S5 | Commercial Provenance | Nicht anfassen. S5-A allein öffnet TW-8 nicht. |
| Homepage-Hero | öffentliche Startseite | Nicht anfassen. |
| Direction A | Aufenthalts-UX | Nicht anfassen. |
| Production Gate B | Vier-Datei-Vertrag | Kein Re-Apply. |
| `main` ohne Branch Protection | Accidental Write | Weiterhin Draft; kein direkter `main`-Commit. |

PR #88, #52, #50, #40, #39, #28 bleiben historische Drafts und werden nicht rebased oder als Basis verwendet.

## 8. Entscheidung

ADR-0176 in `DECISIONS.md`: TW-7 bleibt ein read-only Hub-Identitätsanschluss. Der Weg ist schon einer. Der Gap ist die Mehrziel-Kartenidentität, nicht AP-3.

Runtime erst nach eigenem Auftrag und unabhängigem Review. Dieses Docs-PR ist nicht dieser Auftrag.

## 9. STOPP

Nach Review dieses Docs-Standes:

- **kein** Runtime-Code in diesem PR nachziehen;
- **kein** Ready;
- **kein** Merge;
- **kein** automatischer TW7-A-Start;
- **kein** AAL2-, AP-4-, TW-8- oder Homepage-Folgeslice.

Unabhängiger Review: ChatGPT / Technical Lead.
