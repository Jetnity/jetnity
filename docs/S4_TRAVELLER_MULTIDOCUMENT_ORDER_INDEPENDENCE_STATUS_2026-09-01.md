# S4 Residual – Multi-Document Parser Order Independence Status

Stand: 1. September 2026  
Status: **IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN S6**  
Logical agent: **`Jetnity S4 multi-document parser order independence 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-aae0f830-3be2-49d7-897e-ffc7407dcf01`  
Issue: [#370](https://github.com/Jetnity/jetnity/issues/370)  
Parent S4 closure: [#365](https://github.com/Jetnity/jetnity/issues/365)  
Branch: `fix/s4-traveller-multidocument-order-independence-2026-09-01`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/371

> Agent-Self-Review ist kein PASS. Cursor setzt nicht Ready und merged nicht. `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` wurden nicht verändert.

---

## 1. Arbeitsblock / Ziel

Die strikte Requirements-Traveller-Grenze darf ein gültiges Multi-Document-Set nicht nur deshalb ablehnen, weil `travellerLegacyLesen()` Dokumente kanonisch sortiert. Citizenship-Links müssen über eine bereits validierte Identität (`clientRef`) zugeordnet bleiben. Kein Default / Primary / Preferred Passport oder Citizenship.

## 2. Branch / PR / Head

| Fakt | Wert |
| --- | --- |
| Exact pre-agent head | `ace5fb47559d4d2ef6e55dbf5ab36a73950ea1b4` |
| Task-Baseline | `main@6dc5a153d1dd7b934f2f23db5a19fbd89a3a1663` |
| Merge-Base | `6dc5a153d1dd7b934f2f23db5a19fbd89a3a1663` (0 behind `origin/main` at reconstruct) |
| Implementation commit | `382c31eabeea1e88d0daab371e5ba09da46df4e3` |
| Evidence-Tip mit CI/Preview | `2d8a884e355b4a12ec941ed5dc3dd01c05771984` |
| Dieser Status-Nachtrag | folgt auf `2d8a884e`; eigener SHA live im PR |
| Draft-PR | #371 bleibt Draft |
| `docs/ACTIVE_WORK_STATUS.md` | nicht angefasst (Technical-Lead-owned) |

Reconstruct vor Edit: lokales Snapshot-`main` war `17ee633e`. `origin/main` und der Task-Branch wurden geholt. Branch-Tip und Task-Baseline stimmten mit dem Auftrag überein.

## 3. Bereits umgesetzt

- `travellerAnfrageStriktLesen` speichert die bereits strikt validierten Dokumente.
- Nach `travellerLegacyLesen` erfolgt der Citizenship-Link-Abgleich über eine `clientRef`-Map, nicht über Array-Index.
- Fehlende, doppelte oder nicht zuordenbare Dokument-Identität bleibt fail-closed.
- Kanonische Sortierung bleibt die Normalisierung; sie ist nicht mehr die Vergleichsidentität.
- Neue Tests belegen gemischtes `passport` + `national_id`, Permutationen inklusive des Audit-Falls `[passport CH, passport RS, national_id CH]`, Link-Stabilität nach Sort, unknown/duplicate/malformed/sensitive Ablehnung, keine Wohnsitz-/Aussteller-Inferenz und keine Primary-/Preferred-Semantik.

## 4. Nicht umgesetzt / bewusst nicht angefasst

- `lib/readiness/traveller-kontext.ts` Guest-/Storage-Lesepfad
- DB / Migration / RLS / Grant / Function
- Provider / Secret / paid / live / Activation
- Readiness body-cap / Safety-/Seasonal-Flags
- S6 / S7 / S8
- TW-8 / TW-9
- Auth / MFA / AAL
- sensible Passnummer / MRZ / Scan / Biometrie
- Account-/Traveller-Schema-Redesign
- `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, ARCHITECTURE, DECISIONS

## 5. Tests / CI / Preview

Lokale Evidence dieses Agenten. Exact-Head-Gates müssen live am finalen Tip geprüft werden.

| Lauf | Ergebnis |
| --- | --- |
| `lib/readiness/traveller-anfrage.test.ts` | **15/15 pass** |
| `lib/readiness/traveller-kontext.test.ts` | **8/8 pass** |
| Gezielte Parser-Suite | **23/23 pass** |
| `npm test` | **3067/3067 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** (bestehende Warnungen; geänderte Parser-Dateien ohne Treffer) |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:setup:ci` | pass (nur bekannte fehlende `.env`-Warnung) |
| `check:dead` | pass (nur begründete CookieConsent-Ausnahme) |
| `check:exports` | pass (0 unbegründete Exporte) |
| `check:deps` | pass |
| `check:api-schutz` | pass (12/12 Admin-Routen) |
| `check:schema-bezug` | pass |
| GitHub Actions CI | **SUCCESS** on Exact Head `2d8a884e355b4a12ec941ed5dc3dd01c05771984`: [run 33458244777](https://github.com/Jetnity/jetnity/actions/runs/33458244777) — Typecheck/Lint/Build + Auth-Config |
| Vercel Preview | **SUCCESS** on the same head: [9qZQSn7mndoYMgf7qSfcP876CqxT](https://vercel.com/jetnity-e1b93c82/jetnity-app/9qZQSn7mndoYMgf7qSfcP876CqxT) |
| Intermediate Vercel Ready | `HUaAwxMxdbWBZJrnYbnn4MJE4cMi` belongs to superseded `382c31ea`, not to `2d8a884e` |
| Browser / Real-Device | nicht gelaufen, nicht behauptet (kein UI-Slice; Requirements-API bleibt server parser) |

## 6. Traveller Context

Relevant. 1 Traveller → n Citizenships → n Documents. Der Fix verhindert, dass eine gültige Option nur wegen Eingabereihenfolge verloren geht. Es wird keine Staatsbürgerschaft aus Wohnsitz oder Ausstellerland abgeleitet und kein Dokument zur Primäroption gemacht.

## 7. Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #371.

Nicht Ready. Nicht mergen. Nicht S6 starten. S4-Final-Closure bleibt Technical-Lead-owned nach diesem Slice.
