# Trip Workspace TW-4 – Status

Stand: 25. August 2026  
Status: **historisch abgeschlossen. TW-4 / PR #60 ist auf `main` gemergt (Merge-Commit `c935dd9fbb6f3365ed515c1f8fa3b781f20cfb9f`). Aktiver Slice ist TW-3.**

Die folgenden Abschnitte bleiben die pre-merge Evidence von Draft-PR #60 und dürfen den gemergten Stand nicht überschreiben.

## Identität

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw4-attention`
- Draft-PR: #60 – `Trip Workspace TW-4 – Aufmerksamkeit / Jetzt wichtig`
- Base / Merge-Base: `origin/main` `c9cab1f349fd1778c80b38a2c07e41d8e298e595`
- Merge-Commit mit aktueller Agent-/Technical-Lead-Governance: `48cf3825d4de9fc2db65241712799e3a29054c7d`
- Runtime-Head Official-Requirement-Keys: `d2314d3c4eb68266743262d0ee7e4f5247b4a6b9`
- Technical-Lead-Review `5017458023`: behoben
- Technical-Lead-Review `5018115879`: behoben
- Technical-Lead-Review `5018504776`: beide Blocker behoben
- Technical-Lead-Review `5018945518` auf `5cf4997647265c2f00ef61d53afcdd6a1c22fa4a`: BLOCKED – Official-Completeness zu grob; Fix umgesetzt, Re-Review offen
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

## Exact-Head-Gates auf `95b36f6d`

Lokal, alle grün:

- `check:setup:ci` – OK, 1 Warning: keine `.env`
- `npm run typecheck` – OK
- `npm run lint` – OK
- `npm test` – **1932/1932** pass, inkl. 18 TW-4-Attention-Tests
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK
- `npm run audit:trip-workspace` – 1018 Kombinationen, 0 Fehler

Remote, derselbe SHA:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32834832307
- Vercel Preview: SUCCESS – Deployment `6080781671`, https://jetnity-ifjh18d92-jetnity-e1b93c82.vercel.app

Dieser Status-Commit ist docs-only und folgt auf den belegten Review-Fix-Head. Der Review-Head nach dem Persist ist der neue Branch-Head; CI/Vercel dort erneut prüfen.

## Self-Review

- Fehlende Orchestrierung bleibt `noch_nicht_geprueft`, nicht clean und nicht unavailable.
- Vorhandene lokale Evaluation wird im Produktpfad ausgeführt.
- `nichts_dringend_geprueft` nur nach erfolgreichen Safety-/Seasonal-/Official-Checks ohne vorrangiges Signal und nur als echter Empty State ohne Punkte.
- Aktive Warning-/Gap-/Stale-/Error-/Unknown-Punkte setzen `leerstand` auf `null`; die UI zeigt dann keine Clean-Copy.
- Unavailability, `stale`, `unknown`, `error` und `insufficient_context` bleiben getrennt.
- Kein Default-Pass / keine Citizenship-Tokens in Attention.
- Guest und Account: dieselbe Ableitung.
- Keine Statusableitung aus UI-Text.
- Kein TW-3/TW-5, keine Writes/Side Effects.
- 280px-Overflow ist behoben; Attention bleibt Presentation-Aggregation.

## Review-Fix nach `5018115879`

Unabhängiger Technical-Lead-Kommentar auf Exact Head `787d7305`:

1. Ein unvollständiger Official-Evidence-Satz (2 Traveller, Traveller 1 mit CH+IT, Traveller 2 mit DE, nur eine Evaluation für `traveller:1` / `cit:1`) konnte `nichts_dringend_geprueft` erzeugen.
2. Ausschließlich degradierte Lagen (`unavailable`, `insufficient_context`, `ungeprueft`) wurden auf einen Top-Level-Leerstand kollabiert und aus `punkte` entfernt.

Korrektur, nur TW-4:

- Official-Clean ist fail-closed: jede relevante persistierte Traveller-/Citizenship- bzw. Credential-Option und jedes Ziel braucht eine passende aktuelle Official-Evaluation. Kein Default-Pass, keine `[0]`-Auswahl, kein Traveller-Contract-Umbau.
- Fehlende Official-Coverage erzeugt `official.ungeprueft` und niemals Clean.
- Belegte Official-Unavailability bleibt als `official.unavailable` im Contract.
- Die vier Top-Level-Leerstände bleiben; `unavailable`, `insufficient_context` und `ungeprueft` bleiben als Punkte erhalten und progressiv sichtbar.
- UI zeigt den Leerstandssatz auch neben degradierten Punkten; Clean-Copy erscheint nicht neben Punkten.

Regressionstests: 1 von 3 Citizenship-Optionen niemals Clean, vollständige Coverage darf Clean; Safety unavailable + Seasonal insufficient_context; Safety/Seasonal ungeprüft + Official unavailable.

## Exact-Head-Gates auf `5edd6b8a`

Lokal, alle grün:

- `check:setup:ci` – OK, 1 Warning: keine `.env`
- `npm run typecheck` – OK
- `npm run lint` – OK
- `npm test` – **1935/1935** pass, inkl. 21 TW-4-Attention-Tests
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK
- `npm run audit:trip-workspace` – 1018 Kombinationen, 0 Fehler. Bericht: `/opt/cursor/artifacts/tw4_audit_5edd6b8a.json`

Remote, derselbe Runtime-SHA:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32841489199
- Vercel Preview: SUCCESS – Deployment `6081963934`, https://jetnity-oiu7qjy0j-jetnity-e1b93c82.vercel.app

Der nachfolgende Status-Commit ist docs-only. CI/Vercel auf dem Persist-Head erneut prüfen; das UI-Audit gilt für den unveränderten Runtime-Stand `5edd6b8a`.

## Self-Review

- Unvollständige Official-Coverage über Traveller, Credential-Option, Destination, Requirement-Typ oder Transit ist nie Clean.
- Erst der vollständige kanonische Requirement-Satz plus leere Safety-/Seasonal-/Coverage-Signale ermöglicht `nichts_dringend_geprueft`.
- Gemischte Degraded States bleiben maschinenlesbar in `punkte`; der Top-Level-Leerstand bleibt die priorisierte Leerstandsaussage.
- Kein Default-Pass / keine Citizenship-Tokens in Attention.
- Guest und Account: dieselbe Ableitung.
- Kein TW-3/TW-5, keine Writes/Side Effects, keine neue Persistenz/Hard Truth.
- Branch ist mit `main` `c9cab1f3` synchron; die neue Agent-/Technical-Lead-Governance wurde im Merge übernommen.

## Offene Risiken

- Ohne Provider bleiben Safety/Seasonal ehrlich unavailable; das ist kein Fake-Clean.
- Official ohne Citizenships ist `noch_nicht_pruefbar`, ohne implizite Passwahl.
- Ohne Documents ist die kanonische Official-Option weiterhin `${traveller.clientRef}:none`. Separate Citizenship-only Credential-Optionen wären ein eigener Shared Traveller/Official-Contract-Slice unter Technical-Lead-Steuerung, nicht TW-4.
- Budget, Pace und Domain-Suchen sind unverändert keine Attention-Wahrheit.

## Review-Fix nach `5018504776`

Unabhängiger Technical-Lead-Kommentar auf Exact Head `4087bbed`:

1. TW-4 erfand bei Travellern ohne Dokumente `cit:*` als `credentialOptionRef`. Der Shared Contract `credentialOptionsAus()` erzeugt in diesem Fall ausschließlich `${traveller.clientRef}:none`.
2. Official-Degraded-States wurden noch aus `readiness.summary` abgeleitet und konnten bei gemischten Slots Reihenfolge oder `ungeprueft` statt der belegten Lage liefern.

Korrektur, nur TW-4:

- Pflichtslots kommen ausschließlich aus `credentialOptionsAus()`.
- Jede relevante Traveller-/Credential-Option/Destination wird direkt gegen passende `OfficialEvaluation[]` klassifiziert: `current/current` = abgedeckt; fehlend = `ungeprueft`; provider/source unavailable bzw. Status unavailable = `unavailable`; stale/recheck = `stale`; `insufficient_context` = `insufficient_context`; echtes `unknown` bleibt `unknown`.
- Die Klassifikation ist listenreihenfolge-unabhängig. Kein Default-Pass, kein Shared-Contract-Umbau.

## Offener Shared-Contract-Bedarf

Falls später getrennte Citizenship-only Credential-Optionen fachlich notwendig werden, ist das ein eigener Shared Traveller/Official-Contract unter Technical-Lead-Steuerung. TW-4 implementiert das nicht.

## Exact-Head-Gates auf `475579d9`

Lokal, alle grün:

- `check:setup:ci` – OK, 1 Warning: keine `.env`
- `npm run typecheck` – OK
- `npm run lint` – OK
- `npm test` – **1939/1939** pass, inkl. 25 TW-4-Attention-Tests
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK
- `npm run audit:trip-workspace` – 1018 Kombinationen, 0 Fehler. Bericht: `/opt/cursor/artifacts/tw4_audit_475579d9.json`

Remote, derselbe Runtime-SHA:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32845299559
- Vercel Preview: SUCCESS – Deployment `6082651350`, https://jetnity-e6xx0fqiv-jetnity-e1b93c82.vercel.app

Der nachfolgende Status-Commit ist docs-only. CI/Vercel auf dem Persist-Head erneut prüfen; das UI-Audit gilt für den unveränderten Runtime-Stand `475579d9`.

## Review-Fix nach `5018945518`

Unabhängiger Technical-Lead-Kommentar auf Exact Head `5cf49976`:

Official-Pflichtslots prüften nur Traveller / Credential-Option / Destination. Eine einzelne `visa=current`-Evaluation konnte den Slot clean erscheinen lassen, obwohl andere `OFFICIAL_REQUIREMENT_TYPES` und Transit-Keys fehlten.

Korrektur, nur TW-4, ohne Shared-Contract-Umbau:

- Pflichtslots folgen dem bestehenden Engine-Key `travellerClientRef + credentialOptionRef + destinationCountryCode + requirementType + transitCountryCode`.
- Typen kommen ausschließlich aus `OFFICIAL_REQUIREMENT_TYPES`; Ziele und Transits aus `readinessReisekontext`.
- Nicht-Transit: `transitCountryCode = null`. Transit: ein Slot pro kanonischem Transitland, sonst ein Slot mit `null`.
- Fehlender Pflicht-Key = `official.ungeprueft`. `current`, `unavailable`, `stale`, `insufficient_context` und `unknown` bleiben pro Key verlustfrei und listenreihenfolge-unabhängig.
- Leerer Slot-Fallback erzeugt kein unvollständiges `OfficialSlot` mehr; TypeScript bleibt grün.

Pflicht-Regressionen in `lib/trips/attention.test.ts`: nur `visa=current` nie Clean; vollständiger Requirement-Satz Official-seitig Clean möglich; genau ein fehlender Typ = `ungeprueft`; Transitland ohne Transit-Evaluation nicht Clean; passende aktuelle Transit-Evaluation ohne Official-Punkte; current plus unavailable/stale/insufficient_context/unknown verlustfrei.

`a1f47b88` hatte den Runtime-Fix, fiel aber im Typecheck durch. Der belegte Runtime-Head ist `d2314d3c`.

## Exact-Head-Gates auf `d2314d3c`

Lokal, alle grün:

- `check:setup:ci` – OK, 1 Warning: keine `.env`
- `npm run typecheck` – OK
- `npm run lint` – OK
- gezielte TW-4-Tests – **29/29**
- `npm test` – **1943/1943**
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` – OK
- `npm run build` – OK
- `npm run audit:trip-workspace` – 1018 Kombinationen, 0 Fehler. Bericht: `/opt/cursor/artifacts/tw4_audit_d2314d3c.json`

Remote, derselbe Runtime-SHA:

- GitHub Actions: SUCCESS – https://github.com/Jetnity/jetnity/actions/runs/32850107053
- Vercel Preview: SUCCESS – Deployment `6083548203`, https://jetnity-ngjqn6g9t-jetnity-e1b93c82.vercel.app

Der nachfolgende Status-Commit ist docs-only. CI/Vercel auf dem Persist-Head erneut prüfen; das UI-Audit gilt für den unveränderten Runtime-Stand `d2314d3c`.

## Nächster Schritt

Erneuter unabhängiger ChatGPT/Technical-Lead-Re-Review von Draft-PR #60 auf dem neuen Exact Head. Kein Ready, kein Merge, kein TW-3, kein TW-5, keine Shared-Contract-Erweiterung.
