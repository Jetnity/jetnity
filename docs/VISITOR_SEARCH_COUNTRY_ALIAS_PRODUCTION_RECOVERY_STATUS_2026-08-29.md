# Jetnity – Visitor Search Country Alias Production Recovery – Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-RE-REVIEW / KEIN READY / KEIN MERGE / KEIN ISSUE #110**  
Workstream: Visitor Search correctness  
Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Session/Run-ID: `bc-020d3296-0cd7-4e36-8373-47578af701ce`  
Prior session: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`  
Issue: [#109](https://github.com/Jetnity/jetnity/issues/109)  
Branch: `fix/visitor-search-country-alias-production-recovery-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/173

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS. Prior PASS `5057668445` bleibt durch spätere Funds superseded. Aktueller Blocking-Fund vor diesem Stamp: `5057757711`.

## 1. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Baseline / Merge-Base | `main @ 2241e349f8b3b400963cf1de11e5a8617bdc8e44` |
| Logical Cursor-Agent | `Visitor search correctness 1` |
| Cursor-Run auf PR #173 | https://cursor.com/agents/bc-020d3296-0cd7-4e36-8373-47578af701ce |
| Issue #109 | OPEN |
| Draft-PR | #173, bleibt Draft |
| Unmittelbarer TL-Fund | `5057757711` – kurze Exact-Aliase dürfen nicht hinter Limit-12-Substring-Nachzug verloren gehen |

## 2. Root Cause

1. Import-Keyword-Stapel liess Gleichnam-Städte im Score gewinnen. Ordinale Erstplatzierung schliesst das.
2. Geteilte Aliase wurden als ununterscheidbare `Land`-Zeilen gezeigt. Kanonischer Name + Code disambiguieren.
3. **`5057757711`:** Der Länder-Nachzug nutzte `keywords.ilike.%token%` mit Limit 12. Kurze Exact-Tokens haben in Production weit mehr als 12 Teilstring-Kandidaten. Exact-Länderzeilen sind dann nicht garantiert in der geholten Menge, bevor Ranking überhaupt läuft.

## 3. Was dieser Recovery geliefert hat

1. Ordinale Erstplatzierung für exakte Länder-Aliase bei `ziel`.
2. Alias als Label; Place-ID kanonisch; Typ-Kontext und Shared-Alias-Disambiguierung.
3. Länder-Nachzug liest das typ-begrenzte Universum (`ORT_LAND_UNIVERSUM = 500`), ohne Substring-Filter. `abreise` holt das Universum nicht.
4. Retrieval-Invariante: neutrales 2-Zeichen-Alias hinter >12 Substring-Lärm, beide Exact-Länder bleiben vor Nicht-Land-Lärm.
5. Route-Lauf, Keyword-Normalisierung, keine Allowlist.

Nicht geliefert: UI-Redesign, Geocoder, Import-Mutation, hartcodierte Tokens, Issue #110.

## 4. Tests / Evidence

Siehe `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_LOCAL_TEST_EVIDENCE_2026-08-29.md`.

| Lauf | Ergebnis |
| --- | --- |
| Gezielte Ortssuche + Route-Lauf + Suchliste | **41/41 pass** |
| `npm test` / Typecheck / Lint / Hygiene / Build | **2587/2587**, typecheck pass, lint 0/135, hygiene pass, Production-Build pass |
| Browser / Real-Device / Mobile Safari | **nicht gelaufen** |
| Exact-Head CI / Preview | dieser Stamp erzeugt einen neueren Head |

## 5. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Auth-Write. Keine Supabase-Mutation. `public.places` nur gelesen.

## 6. Kosten / Provider / Secrets

Keine neuen laufenden Kosten, kein Provider, keine Secrets. Zusätzliche Read-Kosten: eine kompakte `typ = country`-Selektion bis 500 Zeilen pro Zielsuche, die den Nachzug braucht. Bounded, nicht paid.

## 7. Residuals / Risiken

- Preview-GET kann SSO-geschützt bleiben.
- `ORT_LAND_UNIVERSUM` muss ≥ der Länderzahl in `public.places` bleiben. Wächst der Bestand darüber, wäre Truncation wieder möglich; das ist dokumentiert, nicht versteckt.
- Kein Mobile-Safari-Beweis.
- `main` `protected=false`.
- Agent-Self-Review ist kein PASS.

## 8. Offene Freigaben

Ready/Merge nur durch unabhängigen Technical Lead. Kein Issue #110.

## 9. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Re-Review von Draft-PR #173 auf dem neuen Head. Kein Ready. Kein Merge.

## 10. Zuerst lesen

1. Task
2. dieser Status
3. Handoff
4. Self-Review
5. ADR-0196 Nachträge
6. `docs/ORTE.md`
7. TL-Fund `5057757711`
