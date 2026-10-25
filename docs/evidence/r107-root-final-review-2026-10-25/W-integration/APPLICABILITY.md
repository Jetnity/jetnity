# Bounded applicability of the six added CSS utilities

Candidate: `1343f8b9e20e68166e2e12cc7880f7eb3cff980c`, tree `d732487b09c3245c9c22e38b38bb030c8aa181cf`. Read-only helper finding for root's decision; no acceptance authority and no browser execution.

## Finding

The six new class-gated rules cannot match an element produced by the exact retained historical W geometry harness under its bound inputs. This supports **W-harness applicable-rule equivalence**, even though the complete CSS files have different hashes. The scope is the retained dense40 / first12-visible / first-editor-open harness, including its own root wrappers. It is not a production-page-wide statement.

The full CSS remains non-identical: c68 `b1ca9a5fdfee85f34812d64c71cb7d643ff5ae7b74ce9c89e939401d7b6586cc`; final 1343 `ba1f5238e5afcbc42d134de5e6820f206143db8b175b5168123d83bce4207a67`. The only difference is six added utility rules / 383 bytes / 23 lines. All historical CSS lines and their order are preserved.

## Exact bounded check

`lexical-applicability.json` records the exact local input paths, their expected/actual SHA256 values, final Git blobs where applicable, target tokens, class sites and expressions. Its 57 inputs are the 54 repository inputs already bound to the c68 bundle and final tree, the exact dense fixture, the retained geometry runner and the retained bundle. Every input hash matched again.

- All six tokens have **zero raw source/bundle matches and zero decoded JavaScript/TypeScript string/template-literal matches** across those inputs.
- All 310 JSX `className` sites in the 54 repository inputs were inventoried. For 267 literal, conditional and closed-template sites, finite composed values also contain none of the six target class tokens. This catches a token assembled from otherwise separate literal/template fragments.
- The remaining 43 known constructions were checked only for class production, as summarized below. They resolve to complete fixed class strings, closed class maps or caller-supplied strings whose bound callers are known. No general application dataflow audit was performed.

| Known construction | Sites | Bounded resolution |
| --- | ---: | --- |
| `LandFeld` field/search class props | 2 | Defaults declared at lines13/16; the form's call at line161 supplies no override. |
| `Suchliste` `cn` combinations | 4 | Fixed whole-class strings and conditionals; its optional `className` comes from the sole bound `OrtSuche` call, `left-0 right-0` or undefined. |
| `OrtSuche` class props / spinner / list positioning | 3 | `inputClassName` receives the form's fixed `feldKlasse` (form lines53/141); other values are fixed variants or undefined. |
| `AccountBesuchFormular` field class identifier | 3 | The same fixed `feldKlasse` string. |
| `WeltZustaende` class maps | 9 | Closed `FUELLUNG`, `UMRISS`, and `MARKE_RAND` maps; their fill/stroke/border strings and surrounding template text contain none of the six tokens. |
| `ExplorerMap` button class identifier/templates | 7 | Fixed `BUTTON` string plus complete, space-separated suffix classes. |
| `AccountWeltKarte` alignment template | 1 | Closed `BESCHRIFTUNG_AUSRICHTUNG` map of positional/translation classes. |
| `AccountBesuche` action class identifier | 14 | Fixed `aktionKlasse` string. |

`cn` combines whole class lists through `clsx`/`twMerge`; these inspected call sites do not synthesize utility names from partial class fragments. The bundle's additional icon class generators at lines16808/16825 produce `lucide` / `lucide-*` classes and append the supplied class lists above, not any of the six target tokens.

The only repository JSX prop spread targets the `BestehendeWeltKarte` component (AccountWeltKarte line416); its class sinks are included in the inventory. There is no repository DOM prop spread or raw-HTML/class-mutation marker in these 54 inputs. The mount passes only its bound visit/world state to `AccountBesuche`. The fixture has visit data, not class attributes. The retained runner's HTML wrappers are classless, and its runtime presentation adjustment is root font size, not class creation.

## Reasoning and limits

Each added rule requires one exact class token on an element or ancestor. These tokens are absent from the bound harness's possible class-producing paths. Therefore the new selectors do not match that harness; the unchanged historical rules retain their applicability and order. Incoming T/D components contributed Tailwind scan tokens but are not mounted by this W bundle.

The initial `css-delta.json` deliberately records that applicability had not yet been established by the CSS-only comparison. This later bounded lexical check supplies the additional reasoning; it does not change the byte-difference record.

Historical provenance remains unchanged: the a547 packet has seven passing interaction cases and aggregate exit1 from its then-failing layout; c68 supplied the later successful layout correction. Neither is relabeled as a fresh 1343 execution. No browser, new test matrix, hosted access, source edit, install or external write occurred. Root decides whether this bounded equivalence is sufficient for historical layout rebinding and retains native CI, Preview and final acceptance responsibility.
