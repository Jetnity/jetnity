# Jetnity – Trip Workspace Implementierungsplan

Stand: 25. August 2026  
Status: **Ziel-IA angenommen (ADR-0163). TW-1 auf `main` (PR #56). TW-2 Runtime in Draft-PR #58; STOPP für unabhängigen Technical-Lead-Re-Review. Kein TW-3, kein TW-4.**  
Audit: `docs/TRIP_WORKSPACE_AUDIT.md`  
Ziel: `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`  
Abhängigkeiten: `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`

Kein Monster-PR. Jeder Slice ist klein, reviewbar und konfliktarm gegenüber Account, Admin und Provider.

Historische Audit-Basis bleibt `1ec93cc9` / Integrationsnachzug `b7f027ec`. TW-1 ist auf `main` (PR #56). TW-2 läuft nur auf `feat/trip-workspace-tw2-overview` / Draft-PR #58.

---

## 1. Sperre

Dieser Plan startete als docs-only Vorbereitung. ADR-0163 hat TW-1 freigegeben; ADR-0164 und der versionierte TW-2-Auftrag geben ausschließlich TW-2 frei. TW-3+ bleiben gesperrt.

Vor TW-1 Runtime brauchte es:

1. unabhängigen ChatGPT / Technical-Lead-Review dieses Audits
2. Product-Owner-Richtung (mindestens: IA-Modell, `Jetzt wichtig`, Create-Flow-Schnitt)
3. einen versionierten Cursor-Auftrag
4. eigenen Feature-Branch, nicht diesen Audit-Branch als Runtime-Träger

Unverändert verboten ohne separates Gate:

- DB-Migration / RLS / Auth
- Traveller-Registry / Citizenship-Neumodellierung
- Route- oder Provider-Vertragsänderung
- Secrets, kostenpflichtige Calls, Provideraktivierung
- Homepage-Marketing
- Mark Ready / Merge ohne aktuelle Product-Owner-Freigabe

---

## 2. Schnittprinzip

Ein Slice darf nur dann Runtime ändern, wenn er:

- keine fremde Shared-Write-Fläche braucht, **oder**
- bewusst fail-closed auf vorhandenen Contracts bleibt
- Error / Empty / Unknown / Stale / Unavailable getrennt hält
- Guest und Account auf derselben `Trip`-Form lässt
- keine Domain-UI erfindet, die eine neue Truth speichert
- Mobile und Desktop dieselbe Logik erhält
- Tests für die geänderte Ableitung/UI mitliefert

---

## 3. Slices

Die Namen sind aus dem Audit abgeleitet, nicht aus der Beispiel-Liste des Auftrags.

```text
TW-0  dieses Audit
  │
  ▼
TW-1  Shell & Geräteparität
  │
  ▼
TW-2  Reiseübersicht
  │
  ├──────────────┐
  ▼              ▼
TW-3 Timeline   TW-4 Aufmerksamkeit
  │              │
  └──────┬───────┘
         ▼
      TW-5 Item- und Gap-Details
         │
         ├── TW-6 Create-Entry  (nach PO; nicht Homepage)
         ├── TW-7 Hub-Anschluss (AP-3 auf `main` nicht überschreiben; Archiv nach AP-4)
         ├── TW-8 Commercial-Surfaces (nach Provider S5; S3-Nachweis schon auf `main`)
         ▼
      TW-9 Polish, Evidence, Closure
```

### TW-0 – Audit / IA / Plan

**Dieser PR.** Nur Dokumentation.

Deliverable: die fünf Pflichtdateien plus persistierter Workstream-Status.

Gates: Repo-Hygiene, CI auf Exact Head, Vercel Preview falls erzeugt. Grün ≠ Produktkorrektheit.

### TW-1 – Shell und Geräteparität

**Status:** auf `main` gemergt (PR #56).

**Ziel:** Eine Produktlogik auf Mobile und Desktop. Desktop bekommt wieder eine Reise-Ebene.

**Darf:**

- `TripWorkspace` so komponieren, dass `uebersicht` nicht ab 1024 px verschwindet
- Navigation von Domain-Tabs zu Reise-Orientierung vorbereiten, ohne alle Such-UIs umzuschreiben
- bestehende Bestände vorerst hinter „Details“ erreichbar lassen

**Nicht:**

- neue Attention-Truth
- Provider-Orchestrierung
- Planner-Chips
- Account-Hub

**Tests:** `lib/trips/arbeitsbereich.test.ts` erweitern: Desktop mountet Reise-Ebene; Mobile versteckt nicht den Graphen. Kein UI-Audit als alleiniger Beweis.

**Abhängigkeit:** frei auf `main`.

### TW-2 – Reiseübersicht

**Status:** Runtime umgesetzt in Draft-PR #58; wartet auf unabhängigen Technical-Lead-Re-Review. Nicht gemergt.

**Ziel:** Die ersten Sekunden beantworten „Was ist diese Reise?“ ohne Dashboard.

**Darf:**

- Kopf um ehrlichen Gesamtstatus aus vorhandenen Feldern verdichten
- Fortschritt der Abdeckungen kompakt zeigen
- `party[]` als Personen andeuten, ohne Registry
- Pace/Interessen nach hinten stufen

**Nicht:**

- `trips.status` neu erfinden
- Citizenship defaulten
- Safety als „geprüft sauber“ ohne Evaluation

**Tests:** Kopf/Übersicht-Ableitungen; Guest vs Account gleicher Text bei gleichem Graph.

### TW-3 – Timeline / Etappe / Tag

**Ziel:** Verlauf statt Modulwechsel.

**Darf:**

- Etappen und Tage als eine Timeline aus dem Graphen
- ungeplante Punkte sichtbar halten
- Tag-Auswahl teilen, weiterhin eine Quelle (`gewaehlterTagId`)

**Nicht:**

- zweite Tageswahrheit in der URL erzwingen
- Multi-Destination-Create (das ist TW-6)
- Transit als Nutzerziel zeigen

**Tests:** Multi-Stage-Fixture; Tag bleibt nach Graph-Änderung gültig oder fällt auf ersten Tag.

### TW-4 – Aufmerksamkeit / „Jetzt wichtig“

**Ziel:** Priorisierung vorhandener Signale.

**Darf:**

- reinen Attention-Aggregator über bestehende Ableitungen
- Graph-Gaps, Readiness stale/open
- Safety/Seasonal nach dem Vier-Zustände-Vertrag in `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md` §5.4: fehlende Orchestrierung = `noch_nicht_geprueft`, nicht unavailable und nicht clean
- Höchstzahl sichtbarer Punkte; Rest progressiv

**Nicht:**

- Tabelle, Persistenz, LLM-Score
- Official `required` ohne Provider
- „keine Warnungen“ aus fehlender Prop

**Tests:** vier Leerstände aus der Zielarchitektur (`nichts_dringend_geprueft`, `noch_nicht_geprueft`, `noch_nicht_pruefbar`, `pruefung_nicht_verfuegbar`); Multi-Citizenship erzeugt keinen einzelnen Default-Punkt; Safety-ohne-Evaluation ≠ `nichts_dringend_geprueft` und ≠ `pruefung_nicht_verfuegbar`.

**Abhängigkeit:** frei für Graph/Readiness; Safety/Seasonal ohne Orchestrierung als `noch_nicht_geprueft`, nicht als `pruefung_nicht_verfuegbar`.

### TW-5 – Item- und Gap-Details

**Ziel:** Flüge, Unterkunft, Aktivitäten, Mobilität als Details einer Lücke oder eines Punkts.

**Darf:**

- bestehende `FlugBestand`, `HotelBereich`, `AktivitaetenBereich`, `MobilitaetBereich` einhängen, statt sie als Haupt-IA zu behalten
- lazy mount der Suche beibehalten

**Nicht:**

- Live-Provider
- Live-Mobility-/Rental-Adapter vortäuschen, obwohl S3 nur die fail-closed Nachweisnaht liefert
- manuelle Flüge als nachgewiesene Angebote zeigen
- stilles `ZRH` als Suchherkunft (TW-P1-08: nur Graph oder Nutzerangabe)

### TW-6 – Create-Entry angleichen

**Ziel:** PO-Regel „einfacher Einstieg + progressive weitere Ziele + keine Tempo-/Interessen-Chips + kein implizites `balanced`“.

**Darf:**

- `/planen` und die **funktionale** Zielübergabe von der Startseite
- vorhandene `trip_stages` wiederverwenden

**Nicht:**

- Homepage-Positionierung, Hero, Marketing-Copy
- Citizenship beim Start erzwingen

**Abhängigkeit:** Product-Owner-Schnitt; kollidiert nicht mit Account, solange Guest-One-Trip unangetastet bleibt.

### TW-7 – Hub-Anschluss

**Ziel:** Workspace und „Meine Reisen“ bleiben ein Weg.

**Darf:** nur angleichen, was AP-3 **nicht** besitzt: z. B. Karten-`itemCount` inkl. `ohneTag`.

**Nicht:** gespeicherten Lifecycle, Archiv, zweite-Reise-Regeln. AP-3 auf `main` besitzt nur ableitende Lage; Archiv bleibt AP-4.

**Abhängigkeit:** AP-3-Vertrag nicht überschreiben. Archiv erst nach AP-4. Kein paralleler Write auf dieselben Hub-Verträge.

### TW-8 – Commercial Surfaces

**Ziel:** Preise, Freshness, Übernahme ehrlich an vorhandene Nachweise koppeln.

**Abhängigkeit:** Provider **S5** für Provenance. S3-Nachweisgrenze liegt bereits auf `main` und bleibt fail-closed ohne Adapter. Keine Activation.

**Nicht:** Secrets, Live-Calls, Booking-Provider, `booking_url` erfinden.

### TW-9 – Polish, Evidence, Closure

**Ziel:** iPhone-Dichte, a11y, Performance, Function-by-Function-Evidence-Matrix für den **finalen** Intelligence-Audit.

**Nicht:** neue Produktmodule nachschieben.

Danach gilt weiter:

`docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`  
`docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`

TW-0 bis TW-9 ersetzen diesen Abschlussaudit nicht.

---

## 4. Empfohlene erste Runtime nach Freigabe

Nicht TW-8. Nicht TW-6, wenn der Product Owner den Create-Flow noch nicht schneiden will.

Empfehlung:

1. **TW-1 + TW-2** als kleines Paar oder zwei PRs
2. dann **TW-4** (Attention), weil sie die P0-Stille von Safety/Seasonal ehrlich macht, ohne Safety neu zu bauen
3. dann **TW-3**
4. TW-5 erst, wenn die Übersicht allein trägt

---

## 5. Tests und Gates je Runtime-Slice

Mindestens:

- TypeScript, Lint, `npm test`
- betroffene Unit-Tests der Ableitung
- `audit:trip-workspace` nur zusätzlich, nie als Wahrheitsbeweis
- GitHub Actions Exact Head SUCCESS
- Vercel Preview Exact Head READY, falls erzeugt
- bei DB/Auth: die in `AGENTS.md` genannten DB-/Auth-Checks – dieser Plan sieht dafür **keine** Slices vor

Kein Slice ist „Workspace fertig“.

---

## 6. Abbruchkriterien

Slice stoppen und Technical Lead informieren, wenn die Lösung nur ginge durch:

- Migration / RLS / Auth-Änderung
- neue Traveller- oder Route-Truth
- Provideraktivierung oder Secret
- Überschreiben von AP-3 / Admin / S3–S8
- einen universellen Mega-Typ
