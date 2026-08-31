# Entry Requirements Detail Contract E1 – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Cursor-Agent: **`Jetnity entry requirements detail 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-ed28b92e-5bca-4a79-88bb-773205180d40`  
Issue: [#298](https://github.com/Jetnity/jetnity/issues/298)  
Branch: `feat/entry-requirements-detail-contract-e1-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/300

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_DETAIL_CONTRACT_E1_TASK_2026-08-31.md`
2. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_DETAIL_CONTRACT_E1_STATUS_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_DETAIL_CONTRACT_E1_SELF_REVIEW_2026-08-31.md`
5. ADR-0201 in `DECISIONS.md`

## Was ein neuer Chat wissen muss

E1 aktiviert **keinen** Provider. Es erweitert nur den provider-neutralen Official-Truth-Vertrag.

Harte Wahrheiten:

1. `blank_passport_pages` und `financial_means` sind eigene Requirement-Typen. Nicht `other_entry_requirement`.
2. Visa-Ausprägungen sind Subtypen am Typ `visa`: `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown`.
3. eTA bleibt `electronic_travel_authorization` und wird nicht als `electronic_visa` umetikettiert.
4. `visaMode` ist nur bei `requirementType === 'visa'` Product Truth. Sonst immer `null`.
5. Ungültige oder fehlende Visa-Werte werden `unknown`. Ein konkreter Modus braucht dieselbe Trust-/Freshness-Grenze wie `required` / `not_required` / `conditional`.
6. `result` und `visaMode` müssen zueinander passen. Widerspruch (`required + visa_exempt`, `not_required` plus Pflichtmodus) degradiert die ganze Evaluation auf `unknown`/`unknown` und nicht `current`. Keine Seite gewinnt. `conditional` wird nicht als Widerspruch behandelt.
7. Multi-Credential bleibt 1:n. Kein Default-Pass, keine Default-Citizenship, kein `documents[0]` / `evaluations[0]`. Ein Widerspruch auf einer Option infiziert die andere nicht.
8. `requirementsProviderAus()` bleibt `null`. S4-R1 Timeout/Abort/Kill-Switch/Freshness bleiben unverändert.
9. Generation 1 arbeitet nur diesen Slice/PR. Review-Fixes bleiben dieselbe Session.

## Dateien ausserhalb der Task-Liste – Begründung

| Datei | Warum |
| --- | --- |
| `lib/readiness/entscheidung.ts` | widersprüchliche Visa-Modi müssen ein semantischer Konflikt sein; sonst würde die Engine sie still mergen |
| `ARCHITECTURE.md` | AGENTS.md verlangt Architektur-Update bei geändertem Official-Vertrag |
| `DECISIONS.md` ADR-0201 | Subtype- vs. Own-Type-Entscheidung und Trust-Grenze für `visaMode` |
| Test-Hilfen (`attention`, `vergleich`, `official-option-scope`, `bezeichnungen`, `status`) | `visaMode` ist Pflichtfeld auf `OfficialEvaluation`; Fixtures müssen type-safe bleiben |
| `lib/readiness/engine.test.ts` | bestehende Vollständigkeitsliste der Pflichttypen um E1 erweitert |

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, Vision, Continuity, Migrationen, Auth, UI.

## Residuals

- Lokale Gates dieses Agenten nach TL-Review-Fix: `npm test` 2857/2857, Typecheck, Lint 0/137, Production-Build, Hygiene. CI/Vercel des Heads `ee700691` sind ungültig; live am neuen Tip prüfen.
- Kein Browser-/Real-Device-Beweis; Slice ist domainseitig.
- Attention-Slots wachsen um zwei First-Class-Typen. Ohne Provider mehr fail-closed Official-Punkte. UI-Gruppierung ist kein E1-Auftrag.
- Vergleichsrang nach Visa-Modus ist bewusst nicht gebaut.
- `result ↔ visaMode`-Widerspruch ist auf die TL-Pflichtpaare begrenzt. `conditional` bleibt erlaubt.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review. Nicht Ready. Nicht mergen. Kein E2/Adapter/UI/Deadline-Start.
