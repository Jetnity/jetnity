# Jetnity – P2-TA-06 Status

Stand: 27. August 2026  
Status: **INTEGRIERT / PR #113 MERGED / ISSUE #112 CLOSED / POST-MERGE MAIN + VERCEL PASS**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 4`**  
Branch: `cursor/p2-ta-06-credential-normalization-3317`  
PR: https://github.com/Jetnity/jetnity/pull/113 — **MERGED**  
Issue: [#112](https://github.com/Jetnity/jetnity/issues/112) — **CLOSED / completed**

> Live-Evidence gewinnt. Assignment-/Draft-SHAs und frühere „kein Ready / kein Merge“-Sätze sind historische Pre-Merge-Evidence.

## 0. Post-Merge Live-Verifikation

| Feld | Wert |
| --- | --- |
| Reviewed PR Exact Head | `928215a2c6c4d4ce914f12ba1bd88dbcab8f548b` |
| Independent Technical-Lead Review | PASS, Review `5046006374` |
| PR #113 | **MERGED** am 27. August 2026 |
| Merge-Commit / aktueller `main` unmittelbar nach Merge | `286d26fec2eed87e1227ebb2cf7327f50e8f5f1a` |
| Post-Merge GitHub Actions | Run `33120743073` **SUCCESS** auf exakt `286d26fe...` |
| Post-Merge Vercel Production | `dpl_7V8WetsqrXC8m4CQcUZoQb9hXn1e` **READY** auf exakt `286d26fe...` |
| Issue #112 | **CLOSED / completed** |
| DB / RLS / Auth / AAL / Production-Write | unverändert; keine Migration / kein Daten-Write durch diesen Slice |

P2-TA-06 ist damit abgeschlossen. Es gibt **keinen automatischen AP-5-/AP-7-/Search-/Homepage-/Provider-Folgeslice** aus diesem Merge.

## 1. Live-Start

| Feld | Wert |
| --- | --- |
| Verifizierter `origin/main` vor erstem Edit | `231da667a051ec39a9cd9183104c816735afbc5f` – `Merge PR #111: AP-4 post-merge continuity` |
| PR #111 | **MERGED** |
| Issue #103 | CLOSED / completed |
| Offene parallele Runtime-PRs | keine P2-TA-06-Kollision; offene Drafts #88/#52/#50/#40/#39/#28 historisch/fremd |
| damalige offene Issues | #112 dieser Slice; #109/#110 bewusst nicht angefasst; #20 future |

Dieser Abschnitt ist **historische Start-Evidence**. Aktuelle Abschlusswahrheit steht in Abschnitt 0.

## 2. Gewählter Vertrag

Kein Shared-Contract-Konflikt. Der bestehende Requirements-Port trägt bereits `credentialOptions[]` und `documents[]`. P2-TA-06 härtet nur den Legacy-/Direct-Normalisierungspfad:

- gelieferte nicht-leere `credentialOptions` bleiben unverändert autoritativ;
- sonst eine Option je vorhandenem Dokument;
- sonst genau eine Legacy-Singularoption, wenn Typ/Issuer/Ablauf wirklich gesetzt sind;
- sonst `${clientRef}:none`;
- `relatedCitizenshipCountryCode` nur aus `document.citizenshipCountryCode`;
- kollidierende `document.clientRef` erzeugen einen deterministischen Suffix `#n`, statt die zweite Option zu verwerfen.

`credentialOptionsAus` und der kanonische App-Pfad (`anfrageAus`, `travellerAusSlot`) bleiben unverändert.

## 3. Runtime

Geändert: `lib/readiness/engine.ts` → `travellerNormalisieren`.

Nicht geändert:

- Provider-Factory bleibt `null`
- Official `result` bleibt ohne Provider `unknown`
- keine UI-, Account-, Search-, Homepage- oder Admin-Fläche
- keine Migration / RLS / Auth / AAL
- keine Account-Traveller-Registry

## 4. Tests / Gates

Lokale Gates auf dem Agent-Branch, nach Typecheck-Fix der neuen Tests:

| Gate | Ergebnis |
| --- | --- |
| `node --import tsx --test lib/readiness/engine.test.ts` | 45/45 PASS, inkl. 10 P2-TA-06-Fälle |
| `npm test` | 2377/2377 PASS |
| `npm run typecheck` | PASS (nach Capture-Typing-Fix) |
| `npm run lint` | PASS, 0 warnings |
| `check:dead` | PASS, 1 begründetes CookieConsent-Residual |
| `check:exports` | PASS, 0 unbegründete Exporte |
| `check:deps` | PASS |
| `check:api-schutz` | PASS, 12 Admin-Routen |
| `check:schema-bezug` | PASS |
| `npm run build` | PASS; bekannte Supabase-Edge-/Browserslist-Warnungen, keine Slice-Regression |

## 4.1 Frühere Exact-Head-Evidence `7124e141c71c0f34573a81249fa028673bc242e4`

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | Run `33119233558` **SUCCESS** |
| Typecheck, Lint & Build | SUCCESS |
| Auth-Konfiguration | SUCCESS |
| Vercel Preview | Deployment `6131511601` / Inspector `5ptkLwjEDESTu7BiZ7hQRAj6yLPU` **READY** auf demselben SHA |
| Review-Threads | 0 |

Historischer Fail auf `11b7606f` / Run `33119038127` war der Capture-Typing-Typecheck und wurde vor dem finalen Review geschlossen. Der finale reviewed Head war später `928215a2...`; siehe Abschnitt 0.

## 5. Shared-Contract-Gate

**Nicht ausgelöst.** Kein neuer Traveller-/Identity-/RLS-Vertrag.
