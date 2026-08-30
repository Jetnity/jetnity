# Jetnity – AP-10-S1 Confirmed Booking Folder Status

Stand: 30. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Parent Issue: #245  
Draft-PR: #246  
Cursor-Agent: **`Account plattform audit vorbereitung 23`**  
Cursor-Run: https://cursor.com/agents/bc-ec79a6cd-8076-4ec4-a130-249f9f650420

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Exact Baseline / Transport

| Feld | Wert |
| --- | --- |
| Task | `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_TASK_2026-08-30.md` |
| Branch | `feat/ap10-s1-confirmed-booking-folder-2026-08-30` |
| Slice-cut `main` | `30c0493c38cd4bf3ceb904ef443126808c79add6` |
| Merge-base vs `origin/main` | `30c0493c38cd4bf3ceb904ef443126808c79add6` |
| Behind `origin/main` | **0** |
| Ahead vor Docs-Stamp | 3 Runtime-/Test-Commits + Task |
| Implementation Head | `848292182bf9d8a89a19db651b35222323144a19` |
| Authoring Head | Tip dieses Branches nach dem Docs-Stamp; live auf PR #246 prüfen |
| Traveller-Kontext | **nicht relevant** – kontoweite Item-Aggregation, keine Citizenship-/Dokumentlogik |

Slice-cut vor Code: nur Task-Dokument im Diff, ahead 1 / behind 0.

## 2. Was dieser Slice geliefert hat

1. Geschützte Route `/account/bookings` unter der bestehenden Account-Shell.
2. Eine serverseitige Aggregation ausdrücklich `booking_status = booked` und nach `kannBuchungMarkieren` buchbarer Items.
3. `unconfirmed`, `activity` und `note` erscheinen nicht.
4. Archivierte Reisen bleiben sichtbar und sind als `Archiviert` erkennbar.
5. `/account` hat nur den Secondary-Link „Bestätigte Buchungen ansehen“, keine Booking-Karten.
6. AP-UX-NAV1 bleibt exakt **Übersicht → Reisen → Reisende → Einstellungen**.
7. Empty ≠ Error; unvollständige Zeilen sind Fehler, nicht Leere.
8. Keine Beträge, keine Partnerbestätigung, keine Deeplinks, keine Traveller-PII.
9. Kein Write-Pfad, kein Service Role, kein `user_id`-Filter.

Nicht geliefert: Pagination-Produkt, Provider-Bestätigung, Preise, AP-10-S2, DB/RLS/Identity, S5-B.

## 3. Aggregationspfad

Eine owner-scoped PostgREST-Abfrage:

- `trip_items` mit `booking_status = booked`
- Embed `trips!inner(id, title, status)`
- `count: exact` + Limit 200
- Mapping über `kannBuchungMarkieren` + `istGebucht`
- Sortierung: nicht archiviert zuerst, dann Datum, Titel, Id
- `abgeschnitten` wird angezeigt, wenn mehr Zeilen existieren als gelesen

Kein N+1 über Reisen. RLS bleibt `trip_items_lesen` / `trips_lesen` für `authenticated`.

## 4. Changed files vs `origin/main`

- `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_TASK_2026-08-30.md`
- `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_STATUS_2026-08-30.md`
- `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_SELF_REVIEW_2026-08-30.md`
- `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_HANDOFF_2026-08-30.md`
- `app/account/bookings/page.tsx`
- `app/account/bookings/loading.tsx`
- `components/account/AccountBuchungen.tsx`
- `components/account/AccountUebersicht.tsx`
- `components/account/AccountAuditClient.tsx`
- `lib/account/buchungen.ts`
- `lib/account/buchungen-daten.ts`
- `lib/account/buchungen.test.ts`
- `lib/account/buchungen-ui.test.ts`
- `lib/account/navigation.test.ts`
- `lib/account/uebersicht-grenzen.test.ts`

Nicht im Diff: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, Migrationen, RLS, Auth/MFA/AAL, Payments, Traveller-Registry.

## 5. Tests / Gates

Lokal auf Implementation Head `84829218` und unverändert für den TypeScript-Fix:

| Gate | Ergebnis |
| --- | --- |
| Focused AP-10-S1 + Nav + Übersicht | **29/29 pass** |
| `npm test` | **2792/2792 pass, 0 fail** |
| `npx tsc -p tsconfig.json --noEmit` | pass nach Type-safe Nav-Assertions |
| `npm run lint` | **0 errors** / 135 bestehende Repo-Warnings |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| `npm run build` | pass; Route `ƒ /account/bookings` vorhanden |
| `db:rechte` / `db:rls` / `auth:pruefen` | nicht ausgeführt – keine DB-/Auth-Änderung |

## 6. Browser / Preview Evidence

Lokal, Production-Build auf `http://127.0.0.1:3010` mit `JETNITY_UI_AUDIT=1`.

| Prüfung | Ergebnis |
| --- | --- |
| `/account/bookings` unauthentifiziert | **307** → `/login?next=/account/bookings` |
| Empty-Fixture | „Noch keine bestätigten Buchungen.“; 4 Rail-Punkte |
| Error-Fixture | `role=alert`, „Deine Buchungen konnten nicht geladen werden.“, nicht Empty |
| List-Fixture | Flug + archivierte Unterkunft sichtbar, intern „Reise öffnen“ → `/reisen/<id>` |
| `/account`-Einstieg | nur Textlink, keine Booking-Karten |
| Overflow 360/390 auf Booking-Fixtures und Account-Home | **kein** horizontaler Seitenoverflow |
| Overflow 280 Booking-Empty / Account-Home | kein Seitenoverflow im Audit |
| Overflow 280 `/login` | vorbestehend `scrollWidth > clientWidth`; **nicht** dieser Slice, nicht repariert |
| Authentifiziertes Preview-Konto | **nicht verfügbar, nicht behauptet** |
| Vercel Preview dieses Heads | nach Docs-Stamp live prüfen; Vorgänger-Heads ungültig |
| Real-Device | nicht gelaufen, nicht behauptet |

## 7. Security / Privacy / Commercial Truth

- Proxy `/account*` unverändert; neue Route erbt den Schutz.
- `createServerComponentClient` / Anon-Key / Cookie-RSC. Kein Service Role.
- Kein `eq('user_id')`. Ownership nur RLS.
- Select ohne Beträge, Partnerfelder, Deeplinks, Registry, Payments.
- Copy sagt ausdrücklich: keine Airline-/Hotel-/Anbieterbestätigung.

## 8. STOP

PR bleibt Draft. **Kein Ready, kein Merge, kein AP-10-S2, keine Continuity-Globaldateien.**

Unabhängiger ChatGPT Technical-Lead Exact-Head-Review erforderlich. Jeder neue Head invalidiert diese Evidence.
