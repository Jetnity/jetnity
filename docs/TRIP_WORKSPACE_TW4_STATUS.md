# Trip Workspace TW-4 – Status

Stand: 25. August 2026  
Status: **vorbereitet; Runtime noch nicht gestartet**

## Identität

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw4-attention`
- Draft-PR: #60 – `Trip Workspace TW-4 – Aufmerksamkeit / Jetzt wichtig`
- Base bei Vorbereitung: `main` `5341decef6ab128039dea11fa6f2625fbf03d354`
- ADR: `docs/ADR_0165_TRIP_WORKSPACE_TW4_ATTENTION.md`
- Auftrag: `docs/TRIP_WORKSPACE_TW4_TASK.md`

## Vorbedingungen

- TW-1 / PR #56: merged
- TW-2 / PR #58: merged
- Marketing/Growth Governance / PR #59: merged
- nächster Runtime-Slice gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`: TW-4

## Scope

Nur Aufmerksamkeit / `Jetzt wichtig` als deterministische, nicht persistierte Priorisierung vorhandener Signale.

Pflichtwahrheiten:

- `nichts_dringend_geprueft`
- `noch_nicht_geprueft`
- `noch_nicht_pruefbar`
- `pruefung_nicht_verfuegbar`
- `unknown`, `stale`, `error`, `unavailable` und `insufficient_context` bleiben getrennt
- fehlende Safety-/Seasonal-Evaluation ist nicht clean und nicht automatisch unavailable
- `nichts_dringend_geprueft` nur nach tatsächlich erfolgreich ausgeführten relevanten Prüfungen
- kein Default-Pass / keine Default-Citizenship
- keine Status-/Prioritätsableitung aus lokalisierten UI-Texten

## Safety-/Seasonal-Produktpfad

Der Agent muss vor Runtime-Änderung die tatsächlichen bestehenden Evaluator-/Orchestrierungsnähte auditieren.

Verbindliche Entscheidungskaskade:

1. vorhandener provider-neutraler, side-effect-freier Evaluator + vollständiger kanonischer Kontext → innerhalb der bestehenden Contracts anbinden/wiederverwenden;
2. fehlender notwendiger Kontext → `noch_nicht_pruefbar` / bestehendes `insufficient_context`;
3. sichere Anbindung innerhalb TW-4 nicht möglich → `noch_nicht_geprueft` und technische Lücke dokumentieren;
4. belegte Engine-/Source-Unavailability → `pruefung_nicht_verfuegbar`;
5. Fehler → `error`, niemals clean.

Keine neue externe Quelle, kein Provider, Secret, paid call oder Shared-Contract-Write.

## Nicht-Scope

Keine DB/RLS/Auth/Migration, keine neue Persistenz, kein `trips.status`, kein LLM-Score, kein TW-3/TW-5+, kein Guardian/Simulator, keine Traveller-/Route-Neumodellierung, keine Provideraktivierung/Secrets/paid calls, keine Marketing-Runtime und keine öffentliche/Production-Aktivierung.

## Gates vor Integration

- Agent Self-Review
- vollständige relevante Tests
- gezielte TW-4-Tests
- `npm run audit:trip-workspace`
- GitHub Actions SUCCESS auf Exact Head
- Vercel SUCCESS/READY auf Exact Head
- Branch gegen aktuellen `main` synchron
- unabhängiger ChatGPT/Technical-Lead-Review

## Aktueller Stopp-Punkt

Runtime noch nicht gestartet. `Trip workspace audit architecture` muss den versionierten Auftrag lesen, den Ist-Code einschließlich Safety-/Seasonal-Orchestrierungsnähte verifizieren und anschließend ausschließlich TW-4 implementieren.

Nach Implementierung STOPP für unabhängigen ChatGPT/Technical-Lead-Review. Bei PASS übernimmt der Technical Lead Ready/Merge gemäß Autonomie-Policy.