# Jetnity – TW-6 Runtime Create-Entry Alignment – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `feat/tw6-create-entry-alignment`  
Auftrag: `docs/TRIP_WORKSPACE_TW6_CREATE_ENTRY_TASK.md`  
Status: **IMPLEMENTIERT / SELF-REVIEW / LOCAL GATES GRÜN / ERSTER CI-HEAD KORRIGIERT / NOCH KEIN TECHNICAL-LEAD-PASS / NICHT READY / NICHT MERGEN**

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
- `components/trips/PlanenCreateGate.tsx` – `/planen` zeigt bei belegtem Gast-Slot die bestehende Reise, nicht ein zweites Formular. SSR bleibt die Create-Kinder, damit die indexierte Basisseite nicht zur leeren Pulse-Hülle wird;
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
- Adversarial: die erste Gate-Variante zeigte Gästen serverseitig eine Pulse-Hülle. Das hätte die indexierte `/planen`-Basis entleert. Korrigiert: SSR rendert die Create-Kinder; die Gate ersetzt sie erst nach dem Gastspeicher-Lesen.

## 5. P0 / P1 / P2 / P3

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| — | P0 | keine im Slice-Scope | — |
| — | P1 | keine im Slice-Scope | — |
| TW6-R-P2-01 | P2 | `vorschlagErzeugen` bleibt als Server Action ohne UI aufrufbar; nur UI-Fail-fast | akzeptiert / Non-Scope Billing |
| TW6-R-P2-02 | P2 | Inspirationskarten sehen vor dem Klick weiter nach Create aus; ehrlich wird es auf `/planen` | akzeptiert |
| TW6-R-P2-03 | P2 | Erste Gate-SSR hätte `/planen` für Crawler geleert | geschlossen (SSR zeigt Create-Kinder) |
| TW6-R-P3-01 | P3 | Reisende-Default bleibt 2; hartes CHF bleibt | bewusst nicht in Option 1 |
| TW6-R-P3-02 | P3 | CTA-Text wechselt nach Mount (kein Hydration-Mismatch, kurzer Flash möglich) | akzeptiert |

## 6. Tests

Neu: `lib/trips/create-entry.test.ts` (21 Tests).

Annahmen, die hinterfragt wurden:

- Quelltext-Reihenfolge in `erzeugen`/`absenden` ist ein Proxy, kein Runtime-Spy auf `vorschlagErzeugen`. Der fachliche Vertrag liegt in `gastCreateGate`.
- Guest→Account wurde nicht neu geschrieben; die bestehende `uebernahme.test.ts` blieb grün.
- `balanced` in der Persistenz ist kompatibel, nicht „gewählt“. Die UI-Assertion prüft fehlende Chips, nicht den SQL-Default.
- Fehlender Origin: `planenVorbelegung` verwirft auch einen übergebenen Origin; das Formular startet leer. Placeholder „z. B. Zürich“ ist Beispiel, kein Wert.

Bestehend und unverändert relevant: `gastspeicher.test.ts` (kein Überschreiben), `uebernahme.test.ts`, `gast-reisen-cta.test.ts`, D0-1/D0-2 SEO-Tests.

Lokale Gates auf dem Arbeitsstand nach der SSR-Korrektur:

| Gate | Ergebnis |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS **2049/2049** |
| `npm run build` | PASS |
| `npm run check:setup:ci` | PASS (bestehende Warning: keine `.env`) |
| `npm run check:dead` | PASS (`CookieConsent` justified) |
| `npm run check:exports` | PASS |
| `npm run check:deps` | PASS |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |

Browser: `/planen` ohne Tempo-Chips, leerer Abreiseort; mit Gastreise Gate statt zweitem Create; `/reisen` „Reise erstellen“ vs. „Reise fortsetzen“. Kein „Neue Reise“ im Gast-Aktiv-Zustand.

## 7. Exact Head / Actions / Vercel

Draft-PR: https://github.com/Jetnity/jetnity/pull/82

Erster Push `627b7ea8382d74661ee968790635978add113f2d`:

- GitHub Actions `Typecheck, Lint & Build` **FAILURE** – `import.meta.dirname` in den Slice-Tests war undefined. Kein Produktregress.
- Auth-Konfiguration SUCCESS.
- Vercel Preview **READY** – `https://vercel.com/jetnity-e1b93c82/jetnity-app/B84zyYPdfA3959Zx8DjfCFsH3F83`.

Korrektur-Head `b0315dd1fb6e1df894d73ee9f100319490569d07`:

- GitHub Actions run `32956948598` **SUCCESS** (Typecheck, Lint & Build + Auth-Konfiguration).
- Vercel Preview **READY** – `https://vercel.com/jetnity-e1b93c82/jetnity-app/7RX55YUEHserMmBCk8tb4b1sAZjF`.

Nicht Ready. Nicht mergen.

## 8. Offene Risiken

- Direkter POST auf `vorschlagErzeugen` kann weiter ein Modell kontingentieren, auch wenn die UI den zweiten Guest-Create nicht anbietet.
- Browser ohne `localStorage` bleibt der bestehende Speicherfehler-Pfad.
- Unabhängiger Technical-Lead-Review steht aus.
- Exact-Head-CI des Korrektur-Heads ist SUCCESS; der unabhängige Technical-Lead-Review steht trotzdem aus.

## 9. Nächster Schritt

STOPP. ChatGPT / Technical Lead führt den unabhängigen Review durch. Kein Ready, kein Merge, kein TW-7, kein TW-8.
