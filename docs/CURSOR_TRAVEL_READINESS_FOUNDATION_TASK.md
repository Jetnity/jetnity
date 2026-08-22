# Cursor-Auftrag – Foundation C: Automatic Travel Requirements & Readiness

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
Basis: `main` @ `315d9b31e69fcd5fd40227f65aa97587efc3bec4`

## Verbindlicher Einstieg

Lies **zuerst vollständig**:

`docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md`

Dieser Nachtrag ist die aktuelle Source of Truth und überschreibt ältere Annahmen, nach denen Nutzer Visa-, Einreise-, Impf-, Gesundheits- oder Dokumentanforderungen selbst recherchieren müssten oder Foundation C nur eine manuelle Checkliste bleibt.

Foundation C baut jetzt die Grundlage für **Automatic Travel Requirements & Readiness** mit:

- individuellem Traveller-Kontext
- provider-neutraler Travel Requirements Engine
- Visa-/Pass-/ID-/Transit-/Health-/Vaccination-/Dokument-Requirements
- progressiver Missing-Facts-Logik
- automatischer Context-Stale- und Freshness-/Recheck-Logik
- klarer Trennung Official Requirement Truth vs User Readiness
- späterer Timatic-/gleichwertiger Provider-Anbindung ohne Architekturbindung.

## Arbeitsmodus

Arbeite selbstständig bis zu einem vollständig reviewbaren Draft-PR. Bestehende Foundation-C-Arbeit nicht verwerfen, sondern gegen den neuen Nachtrag prüfen und sauber refactoren.

Vor Architekturentscheidungen Repository, Datenmodell, Security-Grenzen und aktuelle Produktlogik lesen. Keine parallelen Mini-Systeme.

Pflichtlektüre zusätzlich zum Nachtrag:

- `AGENTS.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/REISEN.md`
- `docs/DATENBANK.md`
- `docs/MOBILITY.md`
- `docs/RENTAL_CARS.md`
- relevante Migrationen/RLS-Policies
- `types/trips.ts`
- `lib/trips/**`
- `lib/reiseaenderung/**`
- `components/trips/**`
- Guest-/Account-Persistenz
- Audit-/Browser-Test-Harnesses.

Danach aktuellen Git-/PR-/CI-/Preview-/Development-/Production-Stand prüfen.

Foundation B / PR #31 ist gemergt. `main` steht auf `315d9b31e69fcd5fd40227f65aa97587efc3bec4`. Mietwagen-Schema ist auf Production; produktive Mietwagensuche bleibt aus.

## Weiterhin verbindliche Grundregeln

- **Eine Reise, eine Wahrheit.**
- `unknown` bleibt `unknown`.
- Keine Fake-Regeln oder erfundenen regulatorischen Aussagen.
- LLM ist keine regulatorische Quelle.
- Official Requirement Truth und User Readiness strikt trennen.
- Readiness-/Traveller-Daten privat und datensparsam behandeln.
- Kein Dokumententresor.
- Keine Pass-/ID-/Visa-Scans oder Dokumentnummern.
- Keine unnötigen Gesundheitsdaten.
- Guest und Account bleiben dieselbe fachliche Reiseform.
- RLS / Owner-Isolation / Cross-User-/Cross-Trip-Schutz.
- Keine Service Role oder Secrets im Client.
- Keine Production-Migration ohne separate ausdrückliche Freigabe.
- Keine Production-Provider-Aktivierung.
- Keine kostenpflichtigen Verträge ohne Freigabe.
- Kein sechster Haupt-Tab erzwingen.
- Mobile-first.
- Tests, DB-/Security-Checks, WebKit, Chromium, Activities Regression, Production Build, GitHub CI und Vercel Preview müssen vor Abschluss grün sein.

## Historischer ursprünglicher Auftrag

Die ursprüngliche Foundation-C-Spezifikation ist im Branch-Verlauf im Commit `57f75ff2ed83432c190076582fb0b3d169bbcd21` erhalten. Bereits begonnene Arbeit auf dieser Basis weiterverwenden. Bei Widerspruch gilt der neuere Automations-Nachtrag.

## Harte Grenzen

**Nicht mergen.**  
**PR nicht Ready setzen.**  
**Keine Production-Migration.**  
**Keine Production-Provider-Aktivierung.**  
**Keine kostenpflichtigen Provider-Verträge.**

Am Ende den vollständigen Abschlussbericht aus `docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md` liefern.