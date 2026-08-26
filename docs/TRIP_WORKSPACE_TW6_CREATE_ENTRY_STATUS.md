# Jetnity – TW6-A Runtime Create-Entry Alignment – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-create-entry-alignment`  
Auftrag: `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_TASK.md`  
Status: **TW6-A IMPLEMENTIERT / TL-FINDINGS GESCHLOSSEN / AUF AKTUELLES MAIN SYNCHRONISIERT / EXACT-HEAD GATES GRÜN / NICHT READY / NICHT MERGEN**

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Was dieser PR ist – und was nicht

Dieser PR ist **TW6-A: Create-Entry Alignment** (Product-Owner-Option 1, Einstieg).

Er ist **nicht** das gesamte TW-6.

Bewusst offen bleibender TW-6-Rest:

- **TW6-REST-01** – progressive weitere Ziele / zusätzliche `trip_stages` im Create;
- keine neue Stage-Architektur in diesem Slice.

Kein stilles TW-6-Closure. Kein TW-7. Kein TW-8.

## 2. Exact Head / main / Merge-Base

| Fakt | Wert |
| --- | --- |
| Exact Head | `03dd9a329b0f57018b49692ee28fcdee6eb18bc1` |
| Live `origin/main` | `2468160ede5cf8cfcc96fb59cc1346ebd6b0fa21` |
| Merge-Base | `2468160ede5cf8cfcc96fb59cc1346ebd6b0fa21` |
| Ahead / Behind | **6 ahead / 0 behind** |
| GitHub mergeable | `MERGEABLE` / `CLEAN` |
| Draft | ja |

## 3. Technical-Lead-Findings

| ID | Finding | Status |
| --- | --- | --- |
| TW6-TL-01 | Session-blinde Generic-CTAs | **geschlossen** – `genericCreateCtaFuerSitzung`; Konto/`unbekannt` remappen nicht; `GastCreateLink` liest `getSession` + `standAusSitzung` |
| TW6-TL-02 | `Reiseidee.uebernehmen` ohne Re-Gate | **geschlossen** – `gastCreateVorNetzschritt` vor `vorschlagOrteAufloesen`; Vorschlag bleibt |
| TW6-TL-03 | Helper remappt jeden Href | **geschlossen** – nur nacktes `/planen`; `zielHref` bleibt Handoff |
| TW6-TL-04 | TW-6 still als fertig | **geschlossen** – als TW6-A dokumentiert; Stage-Rest offen |

## 4. Tatsächlicher GitHub-Diff gegen `main`

16 Dateien, Create-Entry only:

- `app/(public)/page.tsx`
- `app/(public)/planen/page.tsx`
- `components/layout/Footer.tsx`
- `components/layout/NotFoundView.tsx`
- `components/layout/PublicNavbar.tsx`
- `components/trips/GastArbeitsbereich.tsx`
- `components/trips/GastCreateLink.tsx`
- `components/trips/GastReisen.tsx`
- `components/trips/PlanenCreateGate.tsx`
- `components/trips/Reiseidee.tsx`
- `components/trips/TripPlanner.tsx`
- `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_STATUS.md`
- `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_TASK.md`
- `lib/trips/create-entry.test.ts`
- `lib/trips/create-entry.ts`
- `lib/trips/gast-reisen-cta.ts`

Nicht geändert: `gastspeicher.ts`, `uebernahme.ts`, Traveller/Route/Provider/Auth/Payments/DB/RLS, `docs/ACTIVE_WORK_STATUS.md`, robots/sitemap/canonical.

## 5. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| — | P0 | keine | — |
| — | P1 | keine | — |
| TW6-TL-01…04 | P2 | siehe Abschnitt 3 | geschlossen |
| TW6-R-P2-01 | P2 | `vorschlagErzeugen` bleibt ohne UI aufrufbar | akzeptiert / Non-Scope Billing |
| TW6-R-P2-02 | P2 | Inspirationskarten sehen vor dem Klick nach Create aus | akzeptiert; Gate auf `/planen` |
| TW6-R-P3-01 | P3 | Reisende-Default 2; hartes CHF | bewusst nicht in TW6-A |
| TW6-R-P3-02 | P3 | CTA-Text wechselt nach Session-Lesen | akzeptiert |
| TW6-REST-01 | Rest | Progressive Ziele / Stage-Create | **offen**, nicht dieser PR |

## 6. Tests / Gates auf Exact Head `03dd9a32`

Lokal:

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS **2093/2093** |
| `npm run build` | PASS |
| `npm run check:setup:ci` | PASS (Warning: keine `.env`) |
| `npm run check:dead` | PASS (`CookieConsent` justified) |
| `npm run check:exports` | PASS nach Unexport von `PLANEN_HANDOFF_PARAMS` |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |

Exact Head:

- GitHub Actions `32968526336` **SUCCESS** (Typecheck/Lint/Tests/Build + Auth). Tests im CI-Log: **2093/2093**.
- Vercel **SUCCESS** `89X2V99BX1ZsaUZAGQMqHhgBhmKj`. Preview SSO-geschützt.

Vorheriger Head `4daaf55f` ist in CI an `check:exports` gescheitert; das ist der behobene ungenutzte Export.

Live Desktop/Mobile-Walkthrough der Preview war in diesem Lauf **nicht möglich** (Vercel SSO; lokal keine Supabase-Env). Die betroffenen Flows sind über Source + adversarial Tests belegt.

## 7. Review / Merge

Draft-PR: https://github.com/Jetnity/jetnity/pull/82

**Nicht Ready. Nicht mergen. Kein TW-7. Kein TW-8.**

STOPP für erneuten unabhängigen Technical-Lead-Review auf Exact Head `03dd9a32`.
