# Cursor-Auftrag – Foundation C: Travel Readiness & Dokumente

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
Basis: `main` @ `315d9b31e69fcd5fd40227f65aa97587efc3bec4`  
Ziel: provider-unabhängige, logisch strenge Reisevorbereitungs-Foundation ohne sensiblen Dokumententresor

> **WICHTIG – neuer verbindlicher Product-Owner-Entscheid:**
>
> Lies **zuerst vollständig** `docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md`.
>
> Dieser Nachtrag überschreibt alle älteren Annahmen dieses Foundation-C-Auftrags, nach denen Nutzer Visa-, Einreise-, Impf-, Gesundheits- oder Dokumentanforderungen selbst recherchieren müssten oder Foundation C nur eine manuelle Checkliste bleibt.
>
> Foundation C baut jetzt die Grundlage für **Automatic Travel Requirements & Readiness** mit individuellem Traveller-Kontext, provider-neutraler Requirements Engine, automatischer Re-Evaluation, Freshness/Stale-Logik und späterer Timatic-/gleichwertiger Provider-Integration.

---

## Verbindlicher Arbeitsmodus

Du bist der Implementierungs-Agent für diesen Branch. Arbeite selbstständig bis zu einem vollständig reviewbaren Draft-PR, aber halte die Grenzen dieses Auftrags und des Automations-Nachtrags strikt ein.

Vor jeder Architekturentscheidung zuerst Repository, Datenmodell, vorhandene Sicherheitsgrenzen und aktuelle Produktlogik lesen. Keine parallelen Mini-Systeme bauen.

**Nicht mergen. Nichts auf Production migrieren oder aktivieren.** Falls eine DB-Migration nötig ist: nur Development anwenden und vollständig verifizieren.

Der verbindliche Leitsatz ist:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Bei Unsicherheit gilt: `unknown` bleibt `unknown`. Keine plausible Vermutung als Fakt darstellen.

---

## Pflichtlektüre – zuerst vollständig lesen

Mindestens:

- `docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md`
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
- `docs/PR31_REAL_DEVICE_ACCEPTANCE.md`
- `docs/PR31_PRODUCTION_MIGRATION_ACCEPTANCE.md`
- relevante Supabase-Migrationen und RLS-Policies
- `types/trips.ts`
- `lib/trips/**`
- `lib/reiseaenderung/**`
- `components/trips/**`
- bestehende Guest-/Account-Persistenz
- bestehende Audit-/Browser-Test-Harnesses.

Danach aktuellen Git-/PR-/CI-/Preview-/Development-/Production-Stand prüfen.

Wichtig: Foundation B / PR #31 ist gemergt. `main` steht auf `315d9b31e69fcd5fd40227f65aa97587efc3bec4`; das Mietwagen-Schema `20260821200000_trip_items_rental_car` ist auf Production. Die produktive Mietwagensuche bleibt aus.

---

## Ursprüngliche Foundation-C-Spezifikation

Die ursprüngliche vollständige Foundation-C-Spezifikation ist im Branch-Verlauf im Commit `57f75ff2ed83432c190076582fb0b3d169bbcd21` erhalten. Falls du bereits mit dieser Version gearbeitet hast, **nicht neu anfangen**. Bestehende Arbeit behalten und gegen den neuen Automations-Nachtrag prüfen/refactoren.

Die ursprünglichen Qualitäts-, Security- und Scope-Regeln bleiben weiterhin verbindlich, soweit sie nicht ausdrücklich durch den neueren Automations-Nachtrag erweitert oder ersetzt wurden. Insbesondere bleiben verpflichtend:

- Readiness als eigene fachliche Domäne, nicht als beliebiger Tagesplanpunkt
- Official Requirement Truth und User Readiness strikt trennen
- `unknown` bleibt `unknown`
- keine Fake-Regeln oder erfundenen kommerziellen/regulatorischen Daten
- Guest/Account-Parität
- idempotente Persistenz
- Context-/Stale-Logik
- RLS / Owner-Isolation
- keine Cross-User-/Cross-Trip-Verknüpfung
- keine Service Role im Browser
- keine Secrets im Client
- strenge Eingabevalidierung / Body Caps / Enum- und Textgrenzen
- kein sensibler Dokumententresor
- keine Pass-/ID-/Visa-Scans, Dokumentnummern, Kreditkartendaten oder unnötigen Gesundheitsdaten
- keine Production-Migration ohne separate ausdrückliche Nutzerfreigabe
- keine Production-Provider-Aktivierung
- keine neuen kostenpflichtigen Dienste ohne Freigabe
- Mobile-first
- kein sechster Haupt-Tab erzwingen
- Tests, DB-/Security-Checks, WebKit, Chromium, Activities Regression, Production Build, GitHub CI und Vercel Preview müssen vor Abschluss grün sein
- PR bleibt Draft
- nicht mergen
- nicht Mark Ready.

---

## Definition der aktuellen Foundation C

Für die **aktuelle fachliche und technische Zielarchitektur** ist `docs/CURSOR_TRAVEL_READINESS_AUTOMATION_AMENDMENT.md` die maßgebliche Ergänzung und bei Widerspruch die neuere Source of Truth.

Arbeite Foundation C vollständig nach beiden Ebenen weiter:

1. die bewährten Security-/Readiness-/Persistence-/Audit-Grenzen aus der ursprünglichen Spezifikation
2. die neue verbindliche Automatic-Travel-Requirements-Architektur aus dem Nachtrag.

Am Ende liefere den dort verlangten vollständigen Abschlussbericht.

**Nicht mergen. Nicht Mark Ready. Keine Production-Migration. Keine kostenpflichtige Provider-Aktivierung.**