# Jetnity – Entry Requirements Detail Contract E1

Stand: 31. August 2026  
Status: **BINDING TASK / PROVIDER-NEUTRAL / NO LIVE ACTIVATION**

Issue: #298  
Baseline: `main@7f057e6ee8caddf87a3b5365731eaf43d037a114`  
Branch: `feat/entry-requirements-detail-contract-e1-2026-08-31`

## Ziel

Den kleinsten strukturellen Folgeschritt aus `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` bauen, ohne UI, Provider oder Deadline-Runtime vorwegzunehmen.

## Verbindlicher Scope

1. `OFFICIAL_REQUIREMENT_TYPES` mindestens um `blank_passport_pages` und `financial_means` erweitern.
2. Provider-neutralen Visa-Modus als strukturierte Subtype-Semantik einführen:
   - `visa_exempt`
   - `visa_on_arrival`
   - `electronic_visa`
   - `visa_before_travel`
   - `unknown`
3. Visa-Modus verlustfrei Provider-Zeile → Engine → `OfficialEvaluation` transportieren.
4. Strikte Normalisierung: ungültige Werte werden `unknown`/`null`; bei nicht-`visa` Requirement-Zeilen darf kein Visa-Modus als fachliche Wahrheit erscheinen.
5. eTA bleibt eigener Requirement-Typ `electronic_travel_authorization` und wird nicht als Visa-Modus umetikettiert.
6. Multi-Citizenship/Multi-Document/Credential-Option bleibt vollständig getrennt; kein Default-Pass, keine Default-Citizenship.
7. Bestehende S4-R1 Truth-Ops-Grenzen unverändert: Timeout/Abort/Kill-Switch/Freshness/fail-closed.
8. Tests für Taxonomie, Visa-Modus, invalid/non-visa inputs und bestehende Credential-Option-Invarianten.

## Hard Non-Scope

- keine Visitor-Detailkarten / UI;
- keine Deadline-, Task- oder Notification-Runtime;
- keine Gebühren, Aufenthaltsdauern, konkreten Passseitenzahlen oder finanziellen Schwellen modellieren oder erfinden;
- keine Providerwahl, kein Adapter, kein Vendor-Kontakt, Vertrag oder DPA;
- keine Secrets/API Keys, keine realen/paid calls;
- `requirementsProviderAus()` bleibt `null`;
- keine Supabase-/Migration-/RLS-/Auth-/MFA-/AAL-Änderung;
- keine Account-Traveller-Registry-/Trip-Snapshot-Authority-Änderung;
- keine Passnummer, MRZ, Scans, Biometrie oder Gesundheitsdaten;
- `docs/ACTIVE_WORK_STATUS.md` bleibt Technical-Lead-owned;
- kein Folgeslice.

## Erwartete Dateien

Scope-klein voraussichtlich:
- `types/trips.ts`
- `lib/readiness/provider.ts`
- `lib/readiness/official.ts`
- `lib/readiness/engine.ts`
- relevante Readiness-Tests
- eigene E1 Status/Handoff/Self-Review-Dokumente

Abweichende Shared-Dateien nur wenn technisch zwingend und im Handoff explizit begründet.

## Acceptance

- neue First-Class Requirement-Typen sind vollständig durch den bestehenden Official-Truth-Pfad nutzbar;
- Visa-Modus ist strukturiert, lossless und type-safe;
- nicht-Visa-Zeilen können keinen Visa-Modus als Product Truth tragen;
- ungültige Werte fail-closed;
- keine Hard Truth aus Fehlern oder fehlender Evidence;
- bestehende S4-R1-Tests und Multi-Credential-Invarianten bleiben grün;
- gezielte Tests + `npm test` + Typecheck + Lint + Production Build + Repo-Hygiene-Gates soweit im CI vorhanden;
- Cursor Self-Review ist kein TL PASS;
- PR bleibt Draft; nur Technical Lead darf Ready/Merge.

## STOP

Nach Implementierung, Tests, Status, Handoff und adversarial Self-Review STOP für unabhängigen Technical-Lead Exact-Head-Review. Keine Folgearbeit starten.
