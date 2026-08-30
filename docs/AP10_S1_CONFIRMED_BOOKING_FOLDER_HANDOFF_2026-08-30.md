# Jetnity – AP-10-S1 Confirmed Booking Folder Handoff

Stand: 30. August 2026  
Status: **IMPLEMENTIERT / LOCAL GATES GREEN / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**

## What is finished

AP-10-S1 ist die kontoweite, read-only Übersicht ausdrücklich in Jetnity als `booked` bestätigter, buchbarer Reisebestandteile. Keine zweite Booking-Truth, keine Beträge, keine Partnerbestätigung.

Die Branch bleibt auf `main @ 30c0493c38cd4bf3ceb904ef443126808c79add6` reconciled (behind 0). Cursor hat nicht Ready gesetzt und nicht gemergt.

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/246 |
| Branch | `feat/ap10-s1-confirmed-booking-folder-2026-08-30` |
| Issue | #245 |
| Slice-cut / Merge-Base | `30c0493c38cd4bf3ceb904ef443126808c79add6` |
| Behind `origin/main` | **0** |
| Implementation Head | `848292182bf9d8a89a19db651b35222323144a19` |
| Authoring Head | `e7f8e749318c663bb6e1d10702837d804a981b2f` – Docs-Stamp; live Tip auf PR #246 prüfen |
| Cursor-Agent | `Account plattform audit vorbereitung 23` |
| Cloud-Run | https://cursor.com/agents/bc-ec79a6cd-8076-4ec4-a130-249f9f650420 |

## Scope proof

Vorhanden: `/account/bookings`, owner-scoped Read, Empty ≠ Error, Archiv sichtbar, kleiner `/account`-Einstieg, vier Rail-Punkte.

Abwesend: Migration/RLS/Identity, Service Role, Write, Preise, Affiliate, Provider-live, S5-B, Payments, Traveller-PII, AP-6/7/8/9/11/12, globale Continuity-Dateien.

## Tests / Build

Lokal:

- Focused 29/29
- `npm test` 2792/2792
- `tsc --noEmit` pass
- lint 0 errors / 135 warnings
- Hygiene-Gates pass
- Production Build pass, Route `ƒ /account/bookings`

Browser: lokales Production-Build + UI-Audit-Fixtures 280/360/390/Desktop. Unauthentifizierter Redirect verifiziert. Authentifizierter Preview-Pfad **nicht** verifiziert.

Exact-head CI/Vercel: nach finalem Docs-Stamp am live Head prüfen. `aac0dae0` und `84829218` sind danach nicht mehr der reviewbare Head.

## Review protocol

1. Exact Head gegen `origin/main @ 30c0493c` prüfen (0 behind, nur AP-10-S1-Dateien).
2. Booking-Vertrag muss `lib/trips/buchung.ts` bleiben.
3. Rail darf keinen fünften Punkt bekommen.
4. GitHub Actions + Vercel Preview auf dem exact head.
5. PASS nur durch unabhängigen ChatGPT Technical Lead. Cursor markiert nicht Ready und merged nicht.

## Residuals

1. Authentifizierter Preview-Klick auf `/account/bookings`.
2. Vorbestehender 280-px-Overflow auf `/login` – nicht in diesem Slice reparieren.
3. Kein Folgeslice. Kein AP-10-S2.

## STOP

**STOP für unabhängigen ChatGPT Technical-Lead Exact-Head-Review.**
