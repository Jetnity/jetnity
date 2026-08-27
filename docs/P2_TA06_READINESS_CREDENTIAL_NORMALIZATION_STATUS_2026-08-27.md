# Jetnity – P2-TA-06 Status

Stand: 27. August 2026  
Status: **IMPLEMENTIERT AUF DRAFT-BRANCH / LOKALE GATES UND EXACT-HEAD FOLGEN / KEIN READY / KEIN MERGE**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 4`**  
Branch: `cursor/p2-ta-06-credential-normalization-3317`  
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

Siehe Handoff. Dieser Status wird nach den lokalen und Exact-Head-Gates aktualisiert.

## 5. Shared-Contract-Gate

**Nicht ausgelöst.** Kein neuer Traveller-/Identity-/RLS-Vertrag.
