# Jetnity – AP-10-S1 Confirmed Booking Folder Status

Stand: 30. August 2026  
Status: **REVIEW-FIX IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-RE-REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Parent Issue: #245  
Draft-PR: #246  
Cursor-Agent: **`Account plattform audit vorbereitung 23`**  
Cursor-Run: https://cursor.com/agents/bc-ec79a6cd-8076-4ec4-a130-249f9f650420  
TL-Review: CHANGES REQUIRED auf `848292182bf9d8a89a19db651b35222323144a19` / Review `5060655333`

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Exact Baseline / Transport

| Feld | Wert |
| --- | --- |
| Task | `docs/AP10_S1_CONFIRMED_BOOKING_FOLDER_TASK_2026-08-30.md` |
| Branch | `feat/ap10-s1-confirmed-booking-folder-2026-08-30` |
| Slice-cut / Merge-Base `main` | `30c0493c38cd4bf3ceb904ef443126808c79add6` |
| Behind `origin/main` | **0** |
| Review-anchored Head | `848292182bf9d8a89a19db651b35222323144a19` |
| Review-Fix Runtime Head | `87f6f3cf8dde5f1424f6c65fadd4e97eb95b4362` |
| Authoring / reviewable Tip | live auf PR #246 nach diesem Stamp prüfen |
| Traveller-Kontext | **nicht relevant** |

## 2. Review-Fix

1. **Fail-closed Trip-Status.** `tripStatusLesen()` verwendet `TRIP_STATUSES`. Unbekannte/unerwartete Werte ergeben `null` → Abbildung `unvollstaendig` → Error, nicht erfundenes `draft`.
2. **Deterministischer Schnitt vor `.limit(200)`.** DB-Ordnung: `booking_confirmed_at` absteigend, Nullen zuletzt, danach `id` aufsteigend. Die Bestätigungszeit ist nur Schnittkriterium und erscheint nicht auf den Karten.

Sichtbare UI-Reihenfolge bleibt: offene Reisen zuerst, dann gespeichertes Datum/Titel/Id.

## 3. Changed files vs `origin/main`

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

## 4. Tests / Gates auf Review-Fix Head `87f6f3cf`

| Gate | Ergebnis |
| --- | --- |
| Focused AP-10-S1 | **19/19 pass** (inkl. Status-Fail-Closed + Schnitt-Ordnung) |
| `npm test` | **2794/2794 pass, 0 fail** |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run lint` | **0 errors** / 135 bestehende Repo-Warnings |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| `npm run build` | pass; `ƒ /account/bookings` vorhanden |
| `db:rechte` / `db:rls` / `auth:pruefen` | nicht ausgeführt – keine DB-/Auth-Änderung |

## 5. Exact-head Actions / Vercel

| Head | Evidence | Geltung |
| --- | --- | --- |
| `84829218` | Actions #1343 SUCCESS; Vercel Preview `dpl_2ALgtaSrCx5YaLwoENM5yMbUfrjr` READY | **superseded** durch Review-Fix und Docs-Stamp |
| `87f6f3cf` und jeder neuere Tip | nach finalem Push live prüfen | gültig nur für den dann aktuellen Head |

Jeder neue Head invalidiert frühere Exact-Head-Gates.

## 6. Browser Evidence

Lokal Production-Build + UI-Audit-Fixtures, unveränderte Layoutwahrheit nach Review-Fix:

| Prüfung | Ergebnis |
| --- | --- |
| `/account/bookings` unauthentifiziert | 307 → `/login?next=/account/bookings` |
| Empty / Error / Liste | getrennt; Archiv sichtbar; intern `/reisen/<id>` |
| `/account`-Einstieg | nur Textlink |
| 280 / 360 / 390 / Desktop Booking-Fixtures | kein Seitenoverflow auf den Booking-Seiten |
| 280 `/login` Overflow | vorbestehend, nicht dieser Slice |
| Authentifiziertes Preview-Konto | **nicht verfügbar, nicht behauptet** |
| Real-Device | nicht gelaufen |

## 7. Security / Privacy / Commercial Truth

Unverändert: authenticated RLS, kein Service Role, kein Write, keine Beträge/Partner/Deeplinks/PII. `booking_confirmed_at` wird nur zur Schnitt-Ordnung genutzt, nicht angezeigt.

## 8. STOP

PR bleibt Draft. **Kein Ready, kein Merge, kein Folgeslice.**

Unabhängiger ChatGPT Technical-Lead Exact-Head-Re-Review erforderlich.
