# Jetnity – P2-TA-06 Status

Stand: 27. August 2026  
Status: **LOKALE + EXACT-HEAD GATES GRÜN AUF `7124e141` / DRAFT-PR #113 / KEIN READY / KEIN MERGE**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 4`**  
Branch: `cursor/p2-ta-06-credential-normalization-3317`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/113  
Issue: [#112](https://github.com/Jetnity/jetnity/issues/112)

> Live-Evidence gewinnt. Assignment-SHAs sind historische Evidence.

## 1. Live-Start

| Feld | Wert |
| --- | --- |
| Verifizierter `origin/main` vor erstem Edit | `231da667a051ec39a9cd9183104c816735afbc5f` – `Merge PR #111: AP-4 post-merge continuity` |
| PR #111 | **MERGED** |
| Issue #103 | CLOSED / completed |
| Offene parallele Runtime-PRs | keine P2-TA-06-Kollision; offene Drafts #88/#52/#50/#40/#39/#28 historisch/fremd |
| Offene Issues | #112 dieser Slice; #109/#110 bewusst nicht angefasst; #20 future |

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

Lokale Gates auf diesem Branch, nach Typecheck-Fix der neuen Tests:

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

## 4.1 Exact Head `7124e141c71c0f34573a81249fa028673bc242e4`

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | Run `33119233558` **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/33119233558 |
| Typecheck, Lint & Build | SUCCESS |
| Auth-Konfiguration | SUCCESS |
| Vercel Preview | Deployment `6131511601` / Inspector `5ptkLwjEDESTu7BiZ7hQRAj6yLPU` **READY** auf demselben SHA |
| Preview-URL | https://jetnity-app-git-cursor-p2-ta-06-credent-60ccef-jetnity-e1b93c82.vercel.app |
| Review-Threads | 0 |
| Reviews | keine |

Historischer Fail auf `11b7606f` / Run `33119038127` war der Capture-Typing-Typecheck und ist auf `73810094` / `7124e141` geschlossen. Ein späterer Docs-Stamp-Commit ändert die bewegliche Head-SHA; live neu prüfen.

## 5. Shared-Contract-Gate

**Nicht ausgelöst.** Kein neuer Traveller-/Identity-/RLS-Vertrag.
