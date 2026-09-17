# World Map Polish 2 – Slice Status

Stand: 17. September 2026  
Status: **IMPLEMENTED / EVIDENCE CAPTURED / STOP FOR TECHNICAL-LEAD EXACT-HEAD REVIEW**

Issue: #436  
Draft PR: #437  
Branch: `feat/phase-1-world-map-polish-2`  
Binding: `docs/WORLD_MAP_POLISH_2_TASK_2026-09-17.md`  
Cursor-Agent: **`Jetnity world map polish 2`**  
Generation: **1**  
Parent model: **Claude Opus 5 High** (kein Auto, kein Ersatzmodell)

Canonical base: `main@15aa125addf39b15dcb50a1cdf8dece661796fc5`  
Initial task head: `abcb09a0ac916aa818a944a7c876dc7ca32ec787`

Dieses Dokument ist slice-spezifisch. Globale Continuity-/Handoff-/Roadmap-Dateien wurden während der Implementierung bewusst **nicht** angefasst (Parallelitäts-Lock gegenüber PR #435).

---

## Was fertig ist

| Anforderung aus dem Task | Stand |
| --- | --- |
| Kartenkomposition, Seitenverhältnis, mobile Lesbarkeit | fertig |
| Prototyp-Artefakt unter der Karte entfernt | fertig |
| Marker wirken absichtlich statt schwebend | fertig |
| Ausgewählter Marker nicht nur über Farbe erkennbar | fertig |
| Dichte Marker bleiben bedienbar, ohne Orte zusammenzulegen | fertig |
| `Geplant` / `Besucht` sofort verständlich | fertig |
| Besuchshinweis ruhiger, aber weiterhin ehrlich | fertig |
| Kein erfundenes `0 besucht` | fertig |
| Kompakte Orts-/Reisekarten mit klarer Hierarchie | fertig |
| Gleich betitelte Reisen unterscheidbar, ohne Dedupe | fertig |
| Navigation je `tripId`, nie `herkuenfte[0]` | fertig |
| Auswahl eines Markers zeigt die passenden Ortsdetails | fertig |
| Desktop nutzt die verfügbare Breite | fertig |
| Tastatur/Fokus/ARIA | fertig |
| Reduzierte Bewegung respektiert | fertig |
| 390px und Desktop belegt, kein horizontales Scrollen, Trefferflächen ≥ 44px | fertig |

## Nicht Teil dieses Slice

- keine Besuchshistorie, keine Persistenz, keine Migration
- kein Geocoding, keine Länder-/Koordinatenerschliessung
- keine zweite Reiseabfrage, kein Service-Role-Read
- kein externes Karten-/Tile-/Geocoder-Runtime, kein neues npm-Paket
- keine Provider-/Commercial-/Payment-Berührung
- kein Auth/MFA/AAL/RLS
- kein Folge-Slice

## Berührte Dateien

| Datei | Art |
| --- | --- |
| `components/account/AccountWeltKarte.tsx` | Präsentation, neu aufgebaut |
| `lib/account/world-map-ansicht.ts` | **neu**, lokale Darstellungsschicht |
| `lib/account/world-map.ts` | Copy-Kurzformen, `WorldMapReise` um Status/Zeitraum erweitert |
| `lib/account/world-map-land.ts` | Antarktis-Platzhalterrechteck entfernt |
| `lib/account/world-map.test.ts` | angepasste und neue Regressionen |
| `components/account/AccountAuditClient.tsx` | Audit-Fixture `zustand=welt` ergänzt (Scope-Notiz im Self-Review) |
| `docs/WORLD_MAP_POLISH_2_*` | slice-spezifische Evidenz |
| `docs/evidence/WORLD_MAP_POLISH_2_UI_2026-09-17.json` | Playwright-Bericht |

Kein `supabase/**`, kein `components/trips/**`, kein `lib/reisebegleiter/**`, kein `lib/modell/**`, kein `types/supabase.ts`, keine Änderung an `package.json` oder Lockfile.

## Gates auf dem finalen Head

Siehe `docs/WORLD_MAP_POLISH_2_HANDOFF_2026-09-17.md` für die exakten Zahlen und den exakten Head.

## Nächster Schritt

Unabhängiges Technical-Lead-Exact-Head-Review von Draft PR #437.  
**Nicht Ready setzen. Nicht mergen. Keinen Folge-Slice starten.**
