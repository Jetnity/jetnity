# Trip Workspace TW-4 – Status

Stand: 25. August 2026  
Status: **Review-Fix umgesetzt / Draft / STOPP für erneuten unabhängigen Technical-Lead-Re-Review**

## Identität

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw4-attention`
- Draft-PR: #60 – `Trip Workspace TW-4 – Aufmerksamkeit / Jetzt wichtig`
- Base / Merge-Base: `origin/main` `5341decef6ab128039dea11fa6f2625fbf03d354`
- Review-Head mit BLOCKED-Review: `8bbafefc61e91d66ebf617bed2868b8b1c0848cd`
- Technical-Lead-Review `5017458023`: BLOCKED – zwei Truth-/Presentation-Blocker
- ADR: `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`
- Auftrag: `docs/TRIP_WORKSPACE_TW4_TASK.md`

## Vorbedingungen

- TW-1 / PR #56: merged
- TW-2 / PR #58: merged
- Marketing/Growth Governance / PR #59: merged

## Umgesetzt

Runtime:

- `lib/trips/attention.ts`
- `lib/trips/attention.test.ts`
- `components/trips/TripWorkspaceJetztWichtig.tsx`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`

Wiederverwendete Ableitungen:

- `bereichStatus` für Flug-/Unterkunfts-Gaps (`offen` / `teilweise` / `unbestimmt`)
- `readinessAnsicht` / `fehlendeFaktenFuerReise` für stale und Official-Kontext
- `safetyLokalFuerReise` + `safetyAnsicht`
- `seasonalLokalFuerReise` + `seasonalAnsicht`

Nicht umgesetzt und nicht vorgetäuscht:

- keine Timeline (TW-3)
- keine Gap-Details (TW-5)
- kein Guardian/Simulator
- keine Provideraktivierung / Secrets / paid calls
- kein `trips.status` / keine Persistenz

## Safety-/Seasonal-Orchestrierungsentscheidung

**Audit vor Runtime:** Die Engines `safetyLokalFuerReise` / `seasonalLokalFuerReise` sind provider-neutral und side-effect-frei. `safetyProviderAus()` / `seasonalProviderAus()` bleiben `null`. Der Produktpfad übergab zuvor keine Evaluations; `safetyAnsicht` / `seasonalAnsicht` blieben deshalb unsichtbar. Das war künstliche Dauer-Stille, obwohl eine sichere lokale Evaluation existiert.

**Entscheidung: angebunden.**

- Codepfad: `attentionAbleiten` ruft bei fehlender Prop `safetyLokalFuerReise(reise)` und `seasonalLokalFuerReise(reise)` auf und speist `safetyAnsicht` / `seasonalAnsicht`.
- Übergebene Audit-/Server-Evaluations haben Vorrang.
- Lokales Ergebnis ohne Provider ist belegte `provider_unavailable` → Attention `pruefung_nicht_verfuegbar` / Lage `unavailable`, nicht `noch_nicht_geprueft` und nicht clean.
- `orchestriereSafety/Seasonal: false` bleibt nur für Tests des Leerstands `noch_nicht_geprueft`.
- Bestehende Karten `ReiseSicherheit` / `ReisezeitHinweise` bleiben ohne neue permanente Fläche; Attention ist die Produkt-Oberfläche.
- Echte Warnungen/Timing-Signale brauchen weiterhin einen Provider und bleiben besondere Gates.

## 280px-Overflow-Fix

`npm run audit:trip-workspace` auf `b66f6a8a` scheiterte mit 4 Fehlern, alle `Seiten-Overflow 288>280` in WebKit und Chromium für `uebersicht-gefuellt` und `readiness-leer`.

Ursache: der progressive Attention-Control (`inline-flex`, kein Wrap) plus Grid ohne `min-w-0` hielt eine unteilbare Mindestbreite.

Fix auf `ab448534`, ohne Safety-/Seasonal-/Coverage-Logik zu ändern:

- Attention-Card: `min-w-0 max-w-full overflow-x-hidden`, Wrap/`hyphens-auto` auf Titeln
- Expand-Control: `flex w-full max-w-full flex-wrap whitespace-normal`
- Übersicht-Grid: `min-w-0`

Re-Audit auf `ab448534`: **1018/1018, 0 Fehler**, WebKit + Chromium. Bericht: `/opt/cursor/artifacts/tw4_audit_ab448534.json`.

## Exact-Head-Gates auf `ab448534`

Lokal, alle grün:

- `check:setup:ci` – OK, 1 Warning: keine `.env`
- `npm run typecheck` – OK
- `npm run lint` – OK
- `npm test` – **1927/1927** pass, inkl. 13 TW-4-Attention-Tests
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK
- `npm run audit:trip-workspace` – 1018 Kombinationen, 0 Fehler

Remote, derselbe SHA:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32829392769
- Vercel Preview: SUCCESS – Deployment `6079854494`, https://jetnity-9pteq5759-jetnity-e1b93c82.vercel.app

Dieser Status-Commit ist docs-only und folgt auf den belegten Runtime-Head. Der Review-Head nach dem Persist ist der neue Branch-Head; CI/Vercel dort erneut prüfen.

## Review-Fix nach BLOCKED

Unabhängiger Technical-Lead-Kommentar `5017458023` auf Exact Head `8bbafefc`:

1. Die vier Leerstände wurden auch bei vorhandenen Punkten als Copy/Data-State ausgegeben. `has_warnings`/`has_timing` fielen auf `nichts_dringend_geprueft`; Official-stale und Coverage-Gaps konnten parallel zu „Im Moment nichts Dringendes“ stehen.
2. Generisches Safety-/Seasonal-`unknown` wurde zu `noch_nicht_pruefbar`. `has_warnings` maskierte paralleles `insufficient_context`.

Korrektur, nur TW-4:

- `leerstand` ist `null`, sobald ein aktives Signal existiert (`warning`, `known_gap`, `stale`, `error`, `unknown`).
- Die vier Leerstände gelten und rendern nur als echte Empty States, wenn keine aktiven Punkte vorhanden sind.
- Safety-/Seasonal-Evaluations werden einzeln nach Freshness/Evidence/Relevance klassifiziert: `stale`, `unknown`, `insufficient_context`, `error`, `unavailable` und Warning bleiben getrennte Punkte/Lagen.
- Kein `unknown => noch_nicht_pruefbar`. Warning + paralleles `insufficient_context` bleiben beide sichtbar.

Regressionstests in `lib/trips/attention.test.ts`: Critical Warning, Coverage-Gap und Error ohne Clean-Leerstand; Safety/Seasonal stale vs unknown vs insufficient_context; Warning + paralleles insufficient_context.

## Self-Review

- Fehlende Orchestrierung bleibt `noch_nicht_geprueft`, nicht clean und nicht unavailable.
- Vorhandene lokale Evaluation wird im Produktpfad ausgeführt.
- `nichts_dringend_geprueft` nur nach erfolgreichen Safety-/Seasonal-/Official-Checks ohne vorrangiges Signal.
- Unavailability, `stale`, `unknown`, `error` und `insufficient_context` bleiben getrennt.
- Kein Default-Pass / keine Citizenship-Tokens in Attention.
- Guest und Account: dieselbe Ableitung.
- Keine Statusableitung aus UI-Text.
- Kein TW-3/TW-5, keine Writes/Side Effects.
- 280px-Overflow ist behoben; Attention bleibt Presentation-Aggregation.

## Offene Risiken

- Ohne Provider bleiben Safety/Seasonal ehrlich unavailable; das ist kein Fake-Clean.
- Official ohne Citizenships ist `noch_nicht_pruefbar`, ohne implizite Passwahl.
- Budget, Pace und Domain-Suchen sind unverändert keine Attention-Wahrheit.

## Nächster Schritt

Erneuter unabhängiger ChatGPT/Technical-Lead-Re-Review von Draft-PR #60. Kein TW-3, kein TW-5, keine besonderen Product-Owner-Gates eigenmächtig öffnen.
