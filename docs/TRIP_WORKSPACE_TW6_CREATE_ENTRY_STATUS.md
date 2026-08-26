# Jetnity – TW6-A Runtime Create-Entry Alignment – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-create-entry-alignment`  
Auftrag: `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_TASK.md`  
Status: **TW6-A IMPLEMENTIERT / TL-FINDINGS GESCHLOSSEN / AUF AKTUELLES MAIN SYNCHRONISIERT / GATES LAUFEN / NICHT READY / NICHT MERGEN**

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Was dieser PR ist – und was nicht

Dieser PR ist **TW6-A: Create-Entry Alignment** (Product-Owner-Option 1, Einstieg).

Er ist **nicht** das gesamte TW-6.

Bewusst offen bleibender TW-6-Rest:

- progressive weitere Ziele / zusätzliche `trip_stages` im Create;
- keine neue Stage-Architektur in diesem Slice.

Kein stilles TW-6-Closure. Kein TW-7. Kein TW-8.

## 2. Baseline nach Sync

| Fakt | Wert | Klasse |
| --- | --- | --- |
| Live `origin/main` zum Sync | `2468160ede5cf8cfcc96fb59cc1346ebd6b0fa21` | proven |
| Enthält PR #81 und PR #84 | ja | proven |
| Slice-Start war | `71230c280b1cd2500d224095fa84f4472101d31f` | historisch |

## 3. Technical-Lead-Findings

| ID | Finding | Status |
| --- | --- | --- |
| TW6-TL-01 | Session-blinde Generic-CTAs | **geschlossen** – `genericCreateCtaFuerSitzung`; Konto/`unbekannt` remappen nicht; `GastCreateLink` liest dieselbe Cookie-Sitzung wie Navbar |
| TW6-TL-02 | `Reiseidee.uebernehmen` ohne Re-Gate | **geschlossen** – `gastCreateVorNetzschritt` vor `vorschlagOrteAufloesen`; Vorschlag bleibt |
| TW6-TL-03 | Helper remappt jeden Href | **geschlossen** – nur nacktes `/planen`; `zielHref` bleibt Handoff |
| TW6-TL-04 | TW-6 still als fertig | **geschlossen** – als TW6-A dokumentiert; Stage-Rest offen |

## 4. Tatsächlicher Diff (Create-Entry + TL-Fixes)

- `lib/trips/create-entry.ts` – Gate, sitzungsfeste CTA, generischer vs. zielspezifischer Href, Persistenzdefault, Vorbelegung ohne Origin;
- `lib/trips/create-entry.test.ts` – inkl. adversarial TL-01/02/03;
- `lib/trips/gast-reisen-cta.ts` – delegiert an denselben Einstieg;
- `components/trips/GastCreateLink.tsx` – liest `getSession` + `standAusSitzung`;
- `components/trips/PlanenCreateGate.tsx` – belegter Gast-Slot, SSR bleibt Create-Kinder;
- `components/trips/Reiseidee.tsx` – Gate vor Modell und vor Ortsauflösung;
- `components/trips/TripPlanner.tsx` – Fail-fast, keine Tempo-Chips;
- `components/trips/GastReisen.tsx` / `GastArbeitsbereich.tsx` – kein „Neue Reise“;
- `app/(public)/planen/page.tsx` – Gate + Vorbelegung; Metadata/robots unverändert;
- Navbar, Footer, 404, Homepage-Generika – `GastCreateLink` ohne `nurCreate`;
- Task/Status als TW6-A, Rest offen.

Nicht geändert: `gastspeicher.ts`, `uebernahme.ts`, Traveller/Route/Provider/Auth/Payments/DB/RLS, `docs/ACTIVE_WORK_STATUS.md`, robots/sitemap/canonical.

## 5. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| — | P0 | keine | — |
| TW6-TL-01…04 | P2 | siehe Abschnitt 3 | geschlossen in diesem Slice |
| TW6-R-P2-01 | P2 | `vorschlagErzeugen` bleibt ohne UI aufrufbar | akzeptiert / Non-Scope Billing |
| TW6-R-P2-02 | P2 | Inspirationskarten sehen vor dem Klick nach Create aus | akzeptiert; Gate auf `/planen` |
| TW6-R-P3-01 | P3 | Reisende-Default 2; hartes CHF | bewusst nicht in TW6-A |
| TW6-R-P3-02 | P3 | CTA-Text wechselt nach Session-Lesen | akzeptiert |
| TW6-REST-01 | Rest | Progressive Ziele / Stage-Create | **offen**, nicht dieser PR |

## 6. Tests / Gates

Targeted: `lib/trips/create-entry.test.ts` + `gast-reisen-cta.test.ts` – PASS.

Gesamt-Suite, Typecheck, Lint, Build, Hygiene und Exact-Head CI/Vercel folgen in diesem Arbeitsblock und werden hier nachgezogen.

## 7. Review / Merge

Draft-PR: https://github.com/Jetnity/jetnity/pull/82

**Nicht Ready. Nicht mergen. Kein TW-7. Kein TW-8.**

Nächster Schritt nach Exact-Head-Gates: unabhängiger Technical-Lead-Re-Review.
