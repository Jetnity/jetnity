# Entry Requirements Official Actions E2 – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E3**  
Cursor-Agent: **`Jetnity entry requirements official actions 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-805154de-4953-44e4-b2f5-8efdfd9af0ec`  
Issue: [#306](https://github.com/Jetnity/jetnity/issues/306)  
Branch: `feat/entry-requirements-official-actions-e2-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/307

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_OFFICIAL_ACTIONS_E2_TASK_2026-08-31.md`
2. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_OFFICIAL_ACTIONS_E2_STATUS_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_OFFICIAL_ACTIONS_E2_SELF_REVIEW_2026-08-31.md`
5. ADR-0202 in `DECISIONS.md`
6. ADR-0201 bleibt verbindlich für Visa-Modus und `result ↔ visaMode`

## Was ein neuer Chat wissen muss

E2 aktiviert **keinen** Provider. Es trennt nur Evidence Source und konkrete Official Action.

Harte Wahrheiten:

1. `sourceUrl` ist Evidence-/Informationsquelle. Sie wird niemals automatisch application/form/appointment.
2. Eine konkrete Action braucht strukturierten `actionPurpose` und validierte HTTPS-`actionUrl`.
3. Zulässige Zwecke: `application`, `form`, `appointment`, `information`. Alles andere wird verworfen.
4. Fehlt eine explizite Action, darf eine valide `sourceUrl` höchstens `information` werden.
5. Ungültige Action-Metadaten ändern `required` / `not_required` / `conditional` nicht.
6. Fail-closed Trust/Freshness/Konflikt/`result ↔ visaMode` löscht riskante Actions.
7. Actions hängen an derselben OfficialEvaluation / Credential-Option. Kein Default-Pass, keine Default-Citizenship, kein `documents[0]` / `evaluations[0]`.
8. eTA bleibt `electronic_travel_authorization`.
9. `requirementsProviderAus()` bleibt `null`.
10. Generation 1 arbeitet nur diesen Slice/PR. Review-Fixes bleiben dieselbe Session.

## Dateien ausserhalb der Task-Kernliste – Begründung

| Datei | Warum |
| --- | --- |
| `lib/readiness/bezeichnungen.ts` | Labels dürfen nur aus strukturiertem Zweck kommen, nicht aus Marketingtext |
| `ARCHITECTURE.md` | Official-Vertrag geändert |
| `DECISIONS.md` ADR-0202 | Evidence Source ≠ Action; Trust-Grenze bleibt action-frei |
| `docs/TRAVEL_READINESS.md` | eine veraltete Action-Regel wäre nach E2 falsch |
| E1-/Engine-/Bezeichnungs-Fixtures | `OfficialAction.kind` ist jetzt `open_official_action` und braucht `purpose` |

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, Vision, Continuity, Migrationen, Auth, UI.

## Residuals

- Lokale Gates dieses Agenten: `npm test` 2877/2877, Typecheck, Lint 0/137, Production-Build, Hygiene. CI/Vercel müssen live am Exact Head geprüft werden.
- Kein Browser-/Real-Device-Beweis; Slice ist domainseitig.
- `information` aus `sourceUrl` ist bewusst kompatibel, nicht „Beantragen“.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review. Nicht Ready. Nicht mergen. Kein E3/Adapter/UI/Deadline-Start.
