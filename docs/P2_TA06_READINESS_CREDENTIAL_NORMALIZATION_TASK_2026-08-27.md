# Jetnity – P2-TA-06 Readiness Credential Normalization

Stand: 27. August 2026  
Status: **TECHNICAL-LEAD TASK / RUNTIME-HARDENING / KEIN MERGE DURCH AUTOR-AGENT**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 4`**  
Issue: [#112](https://github.com/Jetnity/jetnity/issues/112)  
Live-Startbaseline: `231da667a051ec39a9cd9183104c816735afbc5f` (Merge PR #111)

## 1. Anlass und Rotation

AP-4 ist durch PR #108/#111 integriert. P2-TA-06 bleibt das nächste trip-scoped Traveller-Hardening gemäß Binding Build Order. Das ist eine neue logische Arbeitseinheit; gemäß `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md` wird ein frischer nummerierter Agent verwendet.

Historische Agenten bleiben Evidence:

- `Account plattform audit vorbereitung` = Generation 1 / historische Evidence
- `Account plattform audit vorbereitung 2` = Generation 2 / PR #107 / abgeschlossen
- `Account plattform audit vorbereitung 3` = Generation 3 / AP-4 / abgeschlossen
- **neu aktiv für P2-TA-06: `Account plattform audit vorbereitung 4`**

Kein alter Agent-Branch als Arbeitsbasis. Frischer Branch von live verifiziertem `origin/main`.

## 2. Ziel

`lib/readiness/engine.ts::travellerNormalisieren()` darf mehrere Dokumente nicht mehr auf `documents[0]` / einen Default-Pass kollabieren, nur weil `credentialOptions` fehlt oder leer ist.

Kanonische Invariante:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Issuer Country ≠ Citizenship. Kein Default-Pass. Kein Default-Citizenship.

## 3. Verbindlicher Vertrag

1. Gültige gelieferte `credentialOptions` bleiben die autoritative Caller-Menge.
2. Fehlende oder leere `credentialOptions` + N Dokumente → N Credential-Optionen, eine je Dokument.
3. Document↔Citizenship nur aus dem expliziten Relationsfeld; niemals aus dem Ausstellerland.
4. Keine Dokumente, aber echte Legacy-Singularfelder → genau eine Kompatibilitätsoption.
5. Keine Dokumente und keine Legacy-Felder → bestehende explizite `:none`-Option; kein erfundenes Dokument.
6. Option-Refs sind deterministisch und kollisionssicher. Ein zweites Dokument wird nicht still verworfen.
7. Kanonische Caller über `credentialOptionsAus` bleiben verhaltensgleich.
8. Official/Evaluation bleibt fail-closed; dieser Slice macht aus `unknown` kein `required` / `not_required` / `conditional`.

Wenn 1–8 einen Shared-Contract-Change erfordern würden: STOPP, dokumentieren, nicht still erweitern.

## 4. Non-Scope

- kein AP-5
- kein AP-7 / keine Account-Traveller-Registry
- keine DB-Migration
- keine RLS-/Auth-/MFA-/AAL-Änderung
- kein Production-Write
- kein Service Role
- keine Passnummern, Scans, MRZ oder Biometrie
- kein Provider-/Homepage-/Search-Scope
- Issue #109 und #110 nicht anfassen
- kein Ready / kein Merge durch den Autor-Agenten

## 5. Acceptance Tests

Mindestens:

- zwei Dokumente + weggelassene `credentialOptions` → zwei getrennte Optionen
- zwei Dokumente + leere `credentialOptions` → kein First-Document-Kollaps
- explizit gelieferte Options bleiben autoritativ
- keine Dokumente → `:none`
- Legacy-Singular ohne Documents bleibt kompatibel
- Issuer ≠ Citizenship
- Document/Citizenship-Relation bleibt optionsspezifisch
- Reihenfolge erzeugt keinen Default-Pass
- kanonische Readiness-Tests bleiben grün
