# Jetnity – Trip Workspace TW-5 Status

Stand: 25. August 2026  
Status: **DRAFT-PR #66 – P1-QS1-01 auf Presentation-Ebene behoben; Exact-Head-Gates auf Runtime-Head `8183782f` grün; STOPP für erneuten unabhängigen Technical-Lead-Review. Kein Ready. Kein Merge. Kein TW-6.**  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw5-item-gap-details`  
Draft-PR: #66  
Runtime-/Evidence-Head: `8183782fc08c486949212b0e78b9f4ce938aa0dd`  
Baseline vor TW-5: `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`  
Aktueller `main`: `d039e7bf7f7fa9db261b4623c72cc35944aa82c4`

## 1. Zweck

TW-5 – **Item- und Gap-Details** verbindet vorhandene Workspace-Truth mit kontextuellen Details und on-demand Werkzeugen. Domain-Flächen werden aus Reise-/Coverage-/Attention-/Item-Kontext geöffnet und sind nicht länger die primäre gleichrangige Workspace-IA.

Verbindliche Dokumente:

- `docs/ADR_0167_TRIP_WORKSPACE_TW5_ITEM_GAP_DETAILS.md`
- `docs/TRIP_WORKSPACE_TW5_TASK.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`

## 2. P1-QS1-01 – Closure

Technical-Lead-Re-Review von Head `c4c4c1f0` war **NOCH KEIN PASS**, weil `P1-QS1-01` im Runtime-Code noch vorhanden war. Der Finding bleibt der verbindliche Ready-/Merge-Blocker, bis der Technical Lead den Fix unabhängig erneut prüft.

### Root Cause

In `lib/trips/arbeitsbereich.ts` komponierte `bereichStatus()` Route-Facts so:

```ts
routeFactsAusGraph({
  days: reise.days,
  ohneTag: [...ohneTag, ...reise.ohneTag],
})
```

Der reale Produktpfad setzt `ohneTag === reise.ohneTag`:

- Account: `app/(public)/reisen/[tripId]/page.tsx` → `KontoArbeitsbereich` mit `ohneTag={reise.ohneTag}`
- Guest: `GastArbeitsbereich` mit `ohneTag={reise.ohneTag}`; `TripWorkspace` fällt bei leerer Prop auf `reise.ohneTag` zurück

Dieselbe ungeplante Flug-Itinerary ging zweimal in die Route-Ableitung. Sichtbare Folgen: doppelte `sourceItemIds`, doppelte Segmente/Connections, künstliches „Reihenfolge unbekannt“, Widerspruch zu `flugAbdeckung` (die dieselbe Liste nicht verdoppelt).

Die Route-/Transit-Engine war nicht die Ursache. `flugAbdeckung` und `TripWorkspace` lasen bereits eine Liste.

### Fix

Workspace-/Presentation-Komposition, nicht Shared Contract:

- `ungeplantePunkteLesen(reise, ohneTag)` wählt **eine** Liste: nicht-leere explizite Prop gewinnt, sonst `reise.ohneTag`.
- Kein Concat. Keine ID-Deduplizierung. Keine zweite Route-Wahrheit.
- `bereichStatus`, `planStatus` und `planpunkteSammeln` lesen dieselbe aufgelöste Liste.
- `routeFactsAusGraph` bekommt `[...ungeplante]` nur, weil der Engine-Eingang `Trip['ohneTag']` als `TripItem[]` typt. Das ist eine Kopie **einer** Liste, kein Concat.

Guest-Fallback (`bereichStatus(reise)`) und Account-Prop (`bereichStatus(reise, reise.ohneTag)`) sind dieselbe Presentation.

Nicht geändert: `lib/route/ableitung.ts`, Route-/Transit-Verträge, Provider, DB/RLS/Auth/Traveller.

### Regressionstest

`lib/trips/arbeitsbereich.test.ts` → Suite `P1-QS1-01 ungeplante Flug-Itinerary genau einmal`.

Realfall: eine Reise, ein ungeplanter Flight, ZRH → DOH → BKK, `itineraryEinTransit('DOH')`, `ohneTag === reise.ohneTag`.

Der Test beweist:

- Flight-Item genau einmal (`sourceItemIds === ['flight-ungeplant']`)
- `segments === 2`
- `connections === 1`
- kompakter Route-Text genau einmal `Zürich → Doha → Bangkok`
- kein künstliches „Reihenfolge unbekannt“
- sichtbarer `bereichStatus().text` enthält `flugAbdeckung.zusammenfassung` und widerspricht ihr nicht

Zusätzlich:

- explizites `ohneTag`, das nicht `reise.ohneTag` ist, geht genau einmal ein
- ohne explizites `ohneTag` wird `reise.ohneTag` genau einmal gelesen
- ohne ungeplante Items bleibt die Ableitung leer
- Guest-Fallback und Account-Prop sind `deepEqual`

### Closure-Evidence

Lokal auf Runtime-Head `8183782f`:

- gezielter P1-QS1-01-Regressionstest plus TW-5/TW-3/TW-4/TW-2 – **112/112**
- `npm test` – **1994/1994**
- `npm run typecheck` – OK
- `npm run lint` – OK
- `npm run check:setup:ci` – OK, 1 Warning: keine `.env`
- `check:dead` – 1 begründeter Orphan (`CookieConsent`)
- `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK, Next 14.2.32
- `npm run audit:trip-workspace` – **1018/1018, 0 Fehler**, WebKit + Chromium. Bericht: `/opt/cursor/artifacts/tw5_audit_8183782f.json`

Remote, derselbe SHA `8183782f`:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32884017732
- Vercel Preview: READY – Deployment `6089536706`, https://jetnity-2999tfrb7-jetnity-e1b93c82.vercel.app
- Ahead / Behind gegen `origin/main` `d039e7bf`: **14 ahead / 0 behind** zum Runtime-Head
- Offene Review-Line-Threads: **0**. Ein bestehender Technical-Lead-Review-Kommentar auf `c4c4c1f0` bleibt für den erneuten unabhängigen Re-Review stehen.

`main` ist während dieses Fixes nicht weitergelaufen. Kein Re-Sync nötig.

Dieser Status-Commit ist docs-only und folgt auf den belegten Runtime-Head. CI/Vercel auf dem Persist-Head erneut prüfen; das UI-Audit gilt für den unveränderten Runtime-Stand `8183782f`.

**Exact-Head-Evidence ist erst mit diesem P1-Closure-Abschnitt vollständig.** Der frühere Anspruch auf `ce3e99b9` / `c4c4c1f0` ist durch den bestätigten P1 ungültig.

## 3. Live-Verifikation

| Fakt | Wert |
| --- | --- |
| `origin/main` | `d039e7bf` – Merge PR #67 QS-1 docs-only |
| Merge-Base | `d039e7bf` |
| Runtime-Head | `8183782f` |
| Ahead / Behind | **14 ahead / 0 behind** zum Runtime-Head |
| Draft-PR #66 | OPEN, Draft, MERGEABLE |
| URL | https://github.com/Jetnity/jetnity/pull/66 |

## 4. Umgesetzt (TW-5 bleibt erhalten)

Workspace-lokale Presentation-Schicht `lib/trips/detail.ts`:

- State nur IDs/Intent: `keine` / `gap` / `item` plus `sucheOffen`;
- tote Item-Refs fallen auf die Reiseoberfläche;
- Gap-/Item-Fakten werden bei Renderzeit aus `bereichStatus` und dem Trip-Graphen gelesen;
- `0 Aktivitäten` ist keine Pflichtlücke;
- `covered_by_flight` wird nicht erfunden – die aktuelle Mobility-Engine emittiert ihn nicht;
- `AttentionAktion` bleibt der TW-4-Vertrag; Interpretation nur workspace-lokal.

UI:

- Domain-Tabs als primäre IA entfernt;
- Coverage-/Attention-/Timeline-Items öffnen Gap- oder Item-Details;
- Official/Readiness bleiben auf der Reiseoberfläche;
- `ohneTag`-Items öffnen ohne erfundenen Tag/Stage;
- `FlugBestand` / `UnterkunftBestand` / vorhandene Suchflächen wiederverwendet;
- Commercial-Suche mountet erst nach ausdrücklicher Aktion;
- Mobile und Desktop teilen dieselbe State Machine; Desktop darf Master/Detail zeigen.

Wahrheit im bestehenden Suchpfad:

- `FlugSuche` füllt Herkunft nicht mehr still mit `ZRH`. Placeholder bleibt Beispiel, kein vorausgefüllter Airport.

P1-QS1-01 zusätzlich:

- ungeplante Items gehen genau einmal in Coverage-, Route- und Zählableitungen.

Audit:

- `scripts/trip-workspace-ui-audit.mjs` prüft die trip-zentrische IA;
- Wait auf sichtbare Übersicht **oder** sichtbares Detail, ohne Playwright-Strict-Mode-Kollision.

Nicht angefasst:

- `lib/trips/attention.ts` Contract;
- Readiness/Safety/Seasonal/Route-Truth;
- DB/Migration/RLS/Auth;
- Provider, Secrets, paid calls;
- QS-1-P2/P3.

## 5. Acceptance

| AC | Ergebnis |
| --- | --- |
| AC-1 Haupt-IA | Domain-Leiste ist keine gleichrangige Navigation mehr. |
| AC-2 Flight Gap | offen/teilweise/unbestimmt bleiben getrennt; Suche nur explizit. |
| AC-3 Stay Gap | analog; Nächte nur aus vorhandener Coverage. |
| AC-4 Activities | `0 Aktivitäten` keine Pflichtlücke. |
| AC-5 Mobility | offen/unknown getrennt; kein erfundenes `covered_by_flight`; kein Live-Adapter. |
| AC-6 Item Details | alle sechs `TripItemKind`; `note` ohne Commercial-Fiktion. |
| AC-7 Unplanned | `ohneTag` ohne Fake-Tag/Stage. |
| AC-8 Auswahlstabilität | Tag bleibt; tote Item-Refs werden verworfen. |
| AC-9 Guest/Account | dieselbe Ableitung, kein `quelle` im Helper. |
| AC-10 Lazy Mount | Initialreise ohne Commercial-Suche; explizites Öffnen behält Mount. |
| AC-11 Device Parity | eine Ableitung; Desktop nur mehr Fläche. |
| AC-12 Accessibility | Keyboard/Fokus/hidden/inert/ARIA im UI-Audit. |
| AC-13 Truth Regression | TW-2/3/4-Tests grün im vollen Suite. |
| AC-14 No Shared Contract Drift | kein Auth/RLS/Traveller/Route/Provider/Billing-Umbau. |
| P1-QS1-01 | ungeplante Flug-Itinerary genau einmal; Guest/Account gleiche Presentation. |

## 6. Adversarial Self-Review

- Concat `([...ohneTag, ...reise.ohneTag])` ist aus Runtime-Code entfernt. Einziger verbleibender Beleg ist die historische QS-1-Evidence in `docs/QUALITY_SECURITY_QS1_AUDIT.md`.
- `[...ungeplante]` an `routeFactsAusGraph` ist Typanpassung, keine zweite Liste und keine Heuristik-Deduplizierung.
- Guest- und Account-Aufrufpfade teilen `ungeplantePunkteLesen` / `bereichStatus`. `TripWorkspace` löst dieselbe Regel noch einmal auf; eine nicht-leere Liste wird nicht erneut mit `reise.ohneTag` verbunden.
- `attentionAbleiten` ohne Prop fällt über leeres Default-Array auf `reise.ohneTag` – einmal.
- Explizites anderes `ohneTag` ersetzt `reise.ohneTag` und verliert keine Items dieser expliziten Liste. Das entspricht dem bestehenden Coverage-Vertrag, nicht einer neuen Wahrheit.
- TW-5-Funktionen (reisezentrierte IA, Item-/Gap-Details, 0 Aktivitäten, kein erfundenes `covered_by_flight`, lazy Commercial-Suche, kein stilles ZRH, Guest/Account, Mobile/Desktop, Accessibility, tote Item-Refs, `ohneTag` ohne Fake-Tag) wurden nicht zurückgebaut.
- Kein Shared-Contract-Problem still übernommen. Keine QS-1-P2/P3-Punkte übernommen.
- Erster Push `ba0dc643` scheiterte an TypeScript `readonly TripItem[]` vs. `TripItem[]`. Behoben auf `8183782f`, bevor dieser Status Exact-Head-Evidence behauptet.
- Ein versehentlicher `update_pr draft=false`-Aufruf hat den GitHub-Draft-Status nicht geändert (`isDraft=true` live bestätigt).

## 7. Datenbank / Kosten / Production

- keine TW-5-Migration;
- keine neuen Secrets;
- keine neuen laufenden Kosten;
- keine paid provider calls;
- kein Production-Gate offen.

Supabase Development-Migrationen `20260824160000` und `20260824180000` bleiben nicht Production-approved und unberührt.

## 8. Shared Contracts

Kein Shared-Contract-Change.

Weiterhin Technical-Lead-kontrolliert: Auth/Identity, RLS/Ownership, Traveller, Route/Transit, Privacy, Billing, Admin Audit, Provider Activation, Attribution, Guardian/Simulator/Value.

Citizenship-only Credential Option bleibt außerhalb von TW-5.

## 9. Offene Risiken

- `covered_by_flight` ist im Typ vorhanden, wird von `lib/mobility/kanten.ts` derzeit nicht erzeugt. TW-5 erfindet ihn nicht.
- Compact zeigt zwei Zurück-Controls; das ist redundant, aber keine Domain-IA.
- `main` Branch Protection ist live weiterhin nicht aktiviert.
- QS-1-P2/P3 bleiben außerhalb dieses Slices.
- P1-QS1-01 ist implementiert und gegatet, aber **nicht** unabhängig re-reviewed. Ready/Merge bleiben blockiert.

## 10. STOPP

**Kein Ready. Kein Merge. Kein TW-6.**

Nächster Schritt: unabhängiger ChatGPT / Technical-Lead-Re-Review auf Exact Head `8183782f` plus dem nachfolgenden docs-only Persist-Commit.
