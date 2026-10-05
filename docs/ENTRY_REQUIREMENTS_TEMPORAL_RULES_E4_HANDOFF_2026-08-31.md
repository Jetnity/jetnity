# Entry Requirements Temporal Rules E4 – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / KEIN READY / KEIN MERGE / KEIN E5**  
Cursor-Agent: **`Jetnity entry requirements temporal rules 1`**  
Generation: **1**  
Cursor-Session/Run-ID: `bc-69084bbc-a7ab-4ed5-8418-754bea9ee241`  
Issue: [#315](https://github.com/Jetnity/jetnity/issues/315)  
Branch: `feat/entry-requirements-temporal-rules-e4-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/316

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_TASK_2026-08-31.md`
2. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E3_CLOSED_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_STATUS_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_TEMPORAL_RULES_E4_SELF_REVIEW_2026-08-31.md`
6. ADR-0204 in `DECISIONS.md`
7. ADR-0201 / ADR-0202 / ADR-0203 bleiben verbindlich

## Was ein neuer Chat wissen muss

E4 aktiviert **keinen** Provider und berechnet **keinen** konkreten Timestamp.

Harte Wahrheiten:

1. Official Scope bleibt `Traveller × Credential-Option × Destination/Transit × Requirement Type`.
2. Kein Default-Pass, keine Default-Citizenship, kein `documents[0]`, kein `evaluations[0]`.
3. Nur `kind: 'relative_duration'` mit geschlossenen Anchors `trip_departure|destination_arrival|transit_arrival|border_crossing` und `before|at|after`.
4. Timing nur aus expliziten strukturierten Provider-Metadaten. Nie aus URL, Freitext, Requirement-Typ, LLM, Browser oder `validFrom/validUntil`.
5. Temporal Rule nur auf trusted/current `required|conditional`. `not_required`, unknown, insufficient, stale, recheck, unavailable und Visa-Conflict tragen `null`.
6. Malformed Timing ändert keine Requirement-Hard-Truth. Unmögliche Same-Anchor-Fenster (`availableFrom > dueBy` nach `before=-offset` / `at=0` / `after=+offset`) werden Parser-`null`; die Requirement-Entscheidung bleibt. Unterschiedliche Anchors werden in E4 nicht geordnet.
7. Duplicate gleiche Entscheidung + abweichendes Timing: Requirement bleibt, Timing `null`. Permutationsstabil.
8. Relative UI-Copy nur aus dem normalisierten Contract. Keine Kalenderdaten.
9. `requirementsProviderAus()` bleibt `null`.
10. `docs/ACTIVE_WORK_STATUS.md` wird vom Cursor-Agenten nicht geändert.
11. Generation 1 arbeitet nur diesen Slice/PR. Review-Fixes bleiben dieselbe Session.

## Dateien ausserhalb der Task-Kernliste – Begründung

| Datei | Warum |
| --- | --- |
| `ARCHITECTURE.md` | Official Evaluation trägt jetzt eine getrennte Timing-Dimension |
| `DECISIONS.md` ADR-0204 | relative_duration Contract, Duplicate-Reconciliation, keine Deadline-Runtime |
| `docs/TRAVEL_READINESS.md` | Checkliste darf relative Timing-Copy zeigen |
| `components/trips/Reisevorbereitung.tsx` | rendert `timingTexte` aus der bestehenden E3-Karte |

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, Vision, Continuity, Migrationen, Auth.

## Residuals

- Same-Anchor-Fenster werden relativ verglichen; gemischte Anchors bleiben ohne Timestamp-Projektion zulässig.
- Lokale Gates: `npm test` 2913/2913, Typecheck, Lint 0/137, Production-Build, Hygiene. CI/Vercel müssen live am Exact Head geprüft werden.
- Kein Browser-/Real-Device-Abnahmebeweis.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Re-Review nach Same-Anchor-Fix. Nicht Ready. Nicht mergen. Kein E5/Adapter/Deadline-Start.
