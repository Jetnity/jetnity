# Trip Workspace TW-4 – Status

Stand: 25. August 2026  
Status: **Runtime umgesetzt / Draft / STOPP für unabhängigen Technical-Lead-Re-Review**

## Identität

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw4-attention`
- Draft-PR: #60 – `Trip Workspace TW-4 – Aufmerksamkeit / Jetzt wichtig`
- Base / Merge-Base: `origin/main` `5341decef6ab128039dea11fa6f2625fbf03d354`
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

## Self-Review

- Fehlende Orchestrierung bleibt `noch_nicht_geprueft`, nicht clean und nicht unavailable.
- Vorhandene lokale Evaluation wird im Produktpfad ausgeführt.
- `nichts_dringend_geprueft` nur nach erfolgreichen Safety-/Seasonal-/Official-Checks ohne vorrangiges Signal.
- Unavailability, `stale`, `unknown`, `error` und `insufficient_context` bleiben getrennt.
- Kein Default-Pass / keine Citizenship-Tokens in Attention.
- Guest und Account: dieselbe Ableitung.
- Keine Statusableitung aus UI-Text.
- Kein TW-3/TW-5, keine Writes/Side Effects.

## Offene Risiken

- Ohne Provider bleiben Safety/Seasonal ehrlich unavailable; das ist kein Fake-Clean.
- Official ohne Citizenships ist `noch_nicht_pruefbar`, ohne implizite Passwahl.
- Budget, Pace und Domain-Suchen sind unverändert keine Attention-Wahrheit.

## Nächster Schritt

Unabhängiger ChatGPT/Technical-Lead-Re-Review von Draft-PR #60. Kein TW-3, kein TW-5, keine besonderen Product-Owner-Gates eigenmächtig öffnen.
