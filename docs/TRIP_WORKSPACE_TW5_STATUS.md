# Jetnity – Trip Workspace TW-5 Status

Stand: 25. August 2026  
Status: **DRAFT-PR #66 – Runtime implementiert; Exact-Head-Evidence vollständig; STOPP für unabhängigen Technical-Lead-Review. Kein Ready. Kein Merge. Kein TW-6.**  
Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw5-item-gap-details`  
Draft-PR: #66  
Runtime-/Evidence-Head: `ce3e99b9a95c6600a87fc90f72f2335b04cb95a5`  
Baseline vor TW-5: `bee9f653d7d83dfbafbf9b9c1da6385433071a4a`  
Aktueller `main` nach Sync: `d039e7bf7f7fa9db261b4623c72cc35944aa82c4`

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

## 2. Live-Verifikation

Vor und nach der Runtime geprüft:

| Fakt | Wert |
| --- | --- |
| `origin/main` | `d039e7bf` – Merge PR #67 QS-1 docs-only |
| Merge-Base | `d039e7bf` nach Sync; zuvor `bee9f653` |
| Branch-Head | `ce3e99b9` |
| Ahead / Behind | **11 ahead / 0 behind** |
| Draft-PR #66 | OPEN, Draft, MERGEABLE |
| URL | https://github.com/Jetnity/jetnity/pull/66 |

`main` ist während TW-5 um docs-only PR #67 (QS-1) weitergelaufen. Der Branch wurde per Merge synchronisiert. Kein Runtime-Overlap.

## 3. Umgesetzt

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

Audit:

- `scripts/trip-workspace-ui-audit.mjs` prüft die trip-zentrische IA;
- Wait auf sichtbare Übersicht **oder** sichtbares Detail, ohne Playwright-Strict-Mode-Kollision.

Nicht angefasst:

- `lib/trips/attention.ts` Contract;
- Readiness/Safety/Seasonal/Route-Truth;
- DB/Migration/RLS/Auth;
- Provider, Secrets, paid calls.

## 4. Acceptance

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

## 5. Adversarial Self-Review

- Detail-State kopiert keine Hard Facts.
- `AttentionAktion` wurde nicht cross-domain erweitert.
- Timeline-Delete und Tag-Auswahl bleiben eigene Controls; Planpunkt ist `aria-expanded`.
- Hidden Domain-Flächen liegen nicht mehr in einem verschachtelten `hidden`-Baum.
- Compact fokussiert den sticky Zurück-Control; Desktop den In-Card-Zurück-Control mit `scroll-mt-32` und `preventScroll`, damit Fokus nicht unter dem öffentlichen Header landet.
- Playwright `.or(Reiseübersicht, Reisedetail)` war nach Master/Detail strict-mode-gebrochen; das erklärte die 320 `anfangsBereich`-Fehler. Behoben durch Visible-Filter.
- Zwei sichtbare „Zurück zur Reise“-Controls auf Compact (sticky + In-Card) sind bewusst redundant, keine zweite IA.
- `ohneTag = []` als Default-Parameter erzeugt pro Render ein neues Array, wenn die Prop fehlt; `detailBereinigen` gibt gültige Auswahlen referenzgleich zurück.
- Proaktiv im Scope behoben: stilles `ZRH` in `FlugSuche`.
- Kein Shared-Contract-Problem still übernommen.

## 6. Exact-Head-Gates auf `ce3e99b9`

Lokal, alle grün:

- gezielte TW-5/TW-3/TW-4-Tests – 85/85
- `npm test` – **1989/1989**
- `npm run typecheck` – OK
- `npm run lint` – OK
- `npm run check:setup:ci` – OK, 1 Warning: keine `.env`
- `check:dead` – 1 begründeter Orphan (`CookieConsent`)
- `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK, Next 14.2.32
- `npm run audit:trip-workspace` – **1018/1018, 0 Fehler**, WebKit + Chromium. Bericht: `/opt/cursor/artifacts/tw5_audit_ce3e99b9.json`

Runtime-identischer Vorläufer `d415e2d8` (vor dem docs-only-`main`-Merge) ebenfalls 1018/1018, 0 Fehler: `/opt/cursor/artifacts/tw5_audit_d415e2d8.json`.

Remote, derselbe SHA `ce3e99b9`:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32878783657
- Vercel Preview: READY – Deployment `6088666737`, https://jetnity-nslvrmdyc-jetnity-e1b93c82.vercel.app

Dieser Status-Commit ist docs-only und folgt auf den belegten Runtime-/Sync-Head. CI/Vercel auf dem Persist-Head erneut prüfen; das UI-Audit gilt für den unveränderten Runtime-Stand `ce3e99b9`.

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
- `JETNITY_START_HERE.md` und Roadmap waren vor diesem Persist hinter dem Live-`main`; Continuity wird hier nachgezogen.
- `main` Branch Protection ist live weiterhin nicht aktiviert.
- QS-1 liegt als docs-only auf `main` (PR #67) und ist kein TW-5-Runtime-Slice.

## 10. STOPP

**Kein Ready. Kein Merge. Kein TW-6.**

Nächster Schritt: unabhängiger ChatGPT / Technical-Lead-Review auf Exact Head `ce3e99b9` plus dem nachfolgenden docs-only Persist-Commit.
