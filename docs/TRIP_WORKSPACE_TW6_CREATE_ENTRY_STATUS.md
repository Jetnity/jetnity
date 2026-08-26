# Jetnity – TW-6 Runtime Create-Entry Alignment – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-create-entry-alignment`  
Auftrag: `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_TASK.md`  
Status: **IMPLEMENTIERT / SELF-REVIEW / NOCH KEIN TECHNICAL-LEAD-PASS / NICHT READY / NICHT MERGEN**

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Baseline

Live zum Slice-Start:

| Fakt | Wert | Klasse |
| --- | --- | --- |
| `origin/main` | `71230c280b1cd2500d224095fa84f4472101d31f` | proven |
| Auftrag-Baseline | dieselbe SHA | proven |
| PR #75 TW-6 Audit | MERGED, Merge `5ef981ecd7f761294bcbb691d6cf966395f7ce97` | proven |
| Branch-Basis | `origin/main` @ `71230c28` | proven |

Parallele offene PRs zum Start:

| PR | Slice | Erwartete Runtime-Kollision |
| --- | --- | --- |
| #80 | QS-2 Admin AAL2 | keine `/planen`-Create-Overlap |
| #52 / #50 / #40 / #39 / #28 | docs / ältere Drafts | nicht dieser Slice |

## 2. Tatsächlicher Diff

Geändert / neu, Create-Entry only:

- `lib/trips/create-entry.ts` – Gate, Gast-CTA, Persistenzdefault, Vorbelegung ohne Origin-Erfindung;
- `lib/trips/create-entry.test.ts` – Regression inkl. Testannahmen;
- `lib/trips/gast-reisen-cta.ts` – delegiert an denselben Einstieg;
- `components/trips/PlanenCreateGate.tsx` – `/planen` zeigt bei belegtem Gast-Slot die bestehende Reise, nicht ein zweites Formular;
- `components/trips/GastCreateLink.tsx` – generische CTAs;
- `components/trips/GastReisen.tsx` – sekundäres „Neue Reise“ entfernt;
- `components/trips/GastArbeitsbereich.tsx` – fehlende Reise führt ehrlich zu Fortsetzen oder Erstellen;
- `components/trips/TripPlanner.tsx` – Fail-fast, Tempo-/Interessen-Chips entfernt, Persistenzdefault ohne UI-Wahl;
- `components/trips/Reiseidee.tsx` – Fail-fast vor `vorschlagErzeugen`;
- `app/(public)/planen/page.tsx` – Gate + Vorbelegung; **Metadata/robots unverändert**;
- `components/layout/PublicNavbar.tsx`, `Footer.tsx`, `NotFoundView.tsx`, `app/(public)/page.tsx` – generische Create-CTAs.

Nicht geändert:

- `lib/trips/gastspeicher.ts` Persistenzvertrag;
- `lib/trips/uebernahme.ts` / `GastreiseBruecke`;
- Traveller / Route / Provider / Auth / Payments / DB / RLS;
- `docs/ACTIVE_WORK_STATUS.md`;
- robots, sitemap, Canonical-/Origin-Helfer.

Progressive weitere Ziele: **keine neue UI**. Weitere Etappen bleiben die bestehende Trip-/Stage-Wahrheit nach dem Create. Keine parallele Zielarchitektur.

## 3. Acceptance Criteria

| # | Kriterium | Umsetzung |
| --- | --- | --- |
| 1 | Gast ohne Reise kann erstellen | Gate erlaubt; `/planen` zeigt beide bestehenden UIs |
| 2 | Gast mit aktiver Reise bekommt keinen irreführenden zweiten Create | `PlanenCreateGate`, Gast-CTAs, kein „Neue Reise“ |
| 3 | Zweiter Guest-Create vor Modellaufruf blockiert | `gastCreateGate` vor `vorschlagErzeugen` / `reiseorteBestaetigen` |
| 4 | Bestehende Gastreise wird nicht überschrieben | unveränderter `gastreiseAnlegen` / `gastreiseAblegen` |
| 5 | Guest→Account unverändert | `uebernahme.ts` unangetastet |
| 6 | Kein dritter Create-Pfad | weiterhin nur Formular + Reiseidee + bestehende Übernahme |
| 7 | Ohne Tempo-Wahl kein „ausgewogen“ als Nutzerwahl | Chips entfernt |
| 8 | Persistenzdefault kompatibel | `CREATE_PERSISTENZ_TEMPO = 'balanced'` |
| 9 | Fehlender Startort nicht ZRH | `planenVorbelegung` leert Origin; Formular startet leer |
| 10 | Homepage-Vorbelegung nur echte Daten | `zielHref` unverändert nur `zielId` + optional `idee` |
| 11–13 | Mobile/Desktop, Fokus, Loading/Error/Retry | gleiche Logik; Gate-Loading; Submit `disabled={laeuft}` |
| 14 | Keine D0-1/D0-2 Regression | `/planen` Metadata/robots/canonical unverändert |

## 4. Self-Review

- Shared Contracts nicht erweitert.
- Keine Citizenship-/Pass-Felder im Create.
- Server Action `vorschlagErzeugen` bleibt öffentlich erreichbar (bestehendes Gast-Kontingent, ADR-0052). TW-6 blockt den UI-Flow fail-fast; ein direkter Action-POST ist kein neuer Create-Pfad und keine neue Billing-Architektur.
- Homepage-Inspirationskarten bleiben zielspezifische Handoffs nach `/planen`. Die Gate fängt den zweiten Guest-Create dort ab, statt eine Bali-Karte still auf eine andere Reise umzubiegen.
- Marketing-Mock „2 Reisende · ausgewogen“ auf der Startseite ist keine Create-Wahl und wurde nicht angefasst.

## 5. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| — | P0 | keine im Slice-Scope | — |
| — | P1 | keine im Slice-Scope | — |
| TW6-R-P2-01 | P2 | `vorschlagErzeugen` bleibt als Server Action ohne UI aufrufbar; nur UI-Fail-fast | akzeptiert / Non-Scope Billing |
| TW6-R-P2-02 | P2 | Inspirationskarten sehen vor dem Klick weiter nach Create aus; ehrlich wird es auf `/planen` | akzeptiert |
| TW6-R-P3-01 | P3 | Reisende-Default bleibt 2; hartes CHF bleibt | bewusst nicht in Option 1 |
| TW6-R-P3-02 | P3 | CTA-Text wechselt nach Mount (kein Hydration-Mismatch, kurzer Flash möglich) | akzeptiert |

## 6. Tests

Neu: `lib/trips/create-entry.test.ts`.  
Bestehend und unverändert relevant: `gastspeicher.test.ts`, `uebernahme.test.ts`, `gast-reisen-cta.test.ts`, D0-1/D0-2 SEO-Tests.

Gates und Exact-Head-Evidence folgen nach dem ersten Push.

## 7. Exact Head / Actions / Vercel

Noch offen zum ersten Persist. Wird nach Gates nachgetragen.

## 8. Offene Risiken

- Direkter POST auf `vorschlagErzeugen` kann weiter ein Modell kontingentieren, auch wenn die UI den zweiten Guest-Create nicht anbietet.
- Browser ohne `localStorage` bleibt der bestehende Speicherfehler-Pfad.
- Unabhängiger Technical-Lead-Review steht aus.

## 9. Nächster Schritt

STOPP. ChatGPT / Technical Lead führt den unabhängigen Review durch. Kein Ready, kein Merge, kein TW-7, kein TW-8.
