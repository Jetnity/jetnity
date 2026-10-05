# Jetnity – Visitor Search Country Alias Ranking – Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN READY / KEIN MERGE / KEIN ISSUE #110**  
Workstream: Visitor Search correctness  
Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Session/Run-ID: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`  
Issue: [#109](https://github.com/Jetnity/jetnity/issues/109)  
Branch: `fix/visitor-search-country-alias-ranking-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/168

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Feature-Branch-Start | `d2622e5c` – Task-only |
| Baseline / Merge-Base | `main @ 6083ee63a5da62870ab7ac4f5f91f69230718e44` – Merge PR #167 |
| Logical Cursor-Agent | `Visitor search correctness 1` |
| Beobachteter Run-Titel | `Besuchersuche Länder-Alias-Ranking Korrektur` – nicht als umbenannt behauptet |
| Cursor-Run | https://cursor.com/agents/bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a |
| `main` Branch Protection | live prüfen; zuletzt `protected=false` |
| Issue #109 | OPEN |
| Draft-PR | #168, bleibt Draft |
| Visitor Search UX / PR #94 | **integrated** auf der Baseline |

## 2. Was dieser Slice geliefert hat

1. Für Rolle `ziel` ist ein **exaktes** Länder-Alias/Keyword Namenswahrheit und steht vor gleichnamigen oder präfixgleichen Städten.
2. Gezielter Länder-Nachzug (`typ = country`) wenn die Namensmenge noch kein exaktes Land enthält – auch wenn Stadt-Präfixe bereits stark sind.
3. Breite Keyword-Ergänzung bleibt nur für zu dünne Namensmengen.
4. Rolle `abreise`, IATA und Compact-Relevance unverändert.
5. Regressionen für Peru / China / Schweiz plus generisches Drittland, Bali/Thailand/Japan/Zürich, Abreise, IATA, schwaches Rauschen.
6. ADR-0196 und aktualisierter Ortsvertrag.

Nicht geliefert: UI-Redesign, Geocoder, Import-/Bestandsmutation, hartcodierte Ländernamen, Issue #110, AP-6 Runtime, AP-7, Provider/Payments.

## 3. Vertrag

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| Exaktes Länder-Alias = Ziel-Namenswahrheit | **current** | `ortRang` / ADR-0196 |
| Keyword-Präfix wird nicht angehoben | **current** | Test „nur ein exaktes Länder-Alias“ |
| Gleichnamige Städte bleiben darunter | **current** | Peru/China-Tests |
| `abreise` ohne Länder-Vorrang | **current** | `landAliasNachzugNoetig(..., 'abreise') === false` |
| Place-ID / fail-closed Free Text | **unverändert** | `ortAusBestand` / `Test` leer |
| Traveller-Kontext | **nicht relevant** | keine Citizenship-/Dokumentlogik |

## 4. Tests / Evidence

Siehe `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_LOCAL_TEST_EVIDENCE_2026-08-29.md`.

| Lauf | Ergebnis |
| --- | --- |
| Gezielte Ortssuche + Relevanz | **27/27 pass** |
| `npm test` auf `e3a9f011` | **2573/2573 pass** |
| Typecheck / Lint / Hygiene / Build | pass; lint 0 errors / 135 warnings |
| Browser / Real-Device / Mobile Safari | **nicht gelaufen**, nicht behauptet |
| Exact-Head CI `e3a9f011` | Actions Run `33245325521` SUCCESS; Vercel `4xKBDbRdT1PbT5g7Lxtxh1qkj2Ba` SUCCESS. Dieser Stamp erzeugt einen neueren Head; dessen Gates live prüfen. |

## 5. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Ownership-/Identity-/Auth-/MFA-/AAL-Write. Keine Supabase-Mutation. Keine Service Role. `public.places` wird nur gelesen.

## 6. Kosten / Provider / Secrets

**keine.** Kein neuer Provider, kein Paid Call, keine Secret-Änderung.

## 7. Residuals / Risiken

- Production-Anzeigenamen bleiben offizielle Langnamen; der Slice ändert den Import nicht.
- Der Länder-Nachzug ist auf 12 Zeilen begrenzt. Extrem generische Queries (`Republic`) können theoretisch das gewünschte Land in dieser Nachzugmenge verfehlen; Severity: niedrig, Query ist dann kein exaktes Alias.
- Ohne Preview-/Mobile-Safari-Beweis bleibt der ursprüngliche Beobachtungskanal ungeprüft. Severity: mittel für Abnahme, nicht für die Ranking-Logik.
- `main` Branch Protection bleibt `protected=false`.
- Agent-Self-Review ist kein PASS.

## 8. Offene Freigaben

Keine Product-Owner-Sondergates für diesen normalen Search-Correctness-Slice. Ready/Merge nur durch unabhängigen Technical Lead. Issue #110 startet nicht aus diesem File.

## 9. Exakter nächster Schritt

Unabhängiger ChatGPT Technical-Lead Exact-Head-Review von Draft-PR #168. Kein Ready. Kein Merge. Kein Issue #110.

## 10. Zuerst lesen

1. `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_TASK_2026-08-29.md`
2. dieser Status
3. `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_HANDOFF_2026-08-29.md`
4. `docs/VISITOR_SEARCH_COUNTRY_ALIAS_RANKING_SELF_REVIEW_2026-08-29.md`
5. ADR-0196
6. `docs/ORTE.md`
7. Issue #109
