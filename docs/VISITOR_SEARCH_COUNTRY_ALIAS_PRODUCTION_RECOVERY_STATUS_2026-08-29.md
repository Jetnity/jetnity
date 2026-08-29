# Jetnity – Visitor Search Country Alias Production Recovery – Status

Stand: 29. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-RE-REVIEW / KEIN READY / KEIN MERGE / KEIN ISSUE #110**  
Workstream: Visitor Search correctness  
Cursor-Agent: **`Visitor search correctness 1`**  
Cursor-Session/Run-ID: `bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a`  
Issue: [#109](https://github.com/Jetnity/jetnity/issues/109)  
Branch: `fix/visitor-search-country-alias-production-recovery-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/173

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Live-Rekonstruktion

| Feld | Wert |
| --- | --- |
| Baseline / Merge-Base | `main @ 2241e349f8b3b400963cf1de11e5a8617bdc8e44` – Merge PR #172 |
| Prior reviewed implementation | `4cfa520d` auf PR #168 / #172 |
| Logical Cursor-Agent | `Visitor search correctness 1` |
| Cursor-Run | https://cursor.com/agents/bc-7713da02-0c28-4ee9-b09e-1f114dcc0d3a |
| Issue #109 | OPEN – vorheriger TL-PASS durch Live-Production invalidiert |
| Draft-PR | #173, bleibt Draft |

## 2. Root Cause

Production holte `Republic of Peru` / `People’s Republic of China` und bewertete das exakte Alias mit Namensstärke 5000 plus Länderbonus. Gleichnamige Städte (`Peru, IL`, `China, Japan`) bekamen dieselbe Namensstärke **plus** Exact-Keyword +700, weil der Import `asciiName` in `keywords` schreibt. 5750 schlägt 5260. `Schweiz` blieb korrekt, weil keine Stadt exakt `Schweiz` heisst.

Die Daten waren nicht falsch. Die reinen `orteOrdnen()`-Fixtures waren es: Städte ohne Import-Keywords, kein PostgREST→`ortAusZeile`→Retrieval-Lauf.

## 3. Was dieser Recovery geliefert hat

1. Für `ziel` ist ein exaktes Länder-Alias eine **ordinale** Erstplatzierung, kein Score-Rennen gegen gestapelte Stadt-Keywords.
2. `placesSuchen()` übt denselben Retrieval+Ranking-Lauf wie die Route.
3. `ortAusZeile` normalisiert Keyword-Strings defensiv, inklusive unbeabsichtigter Arrays.
4. Regressionen mit Production-Zeilenform für Peru, China, Schweiz und ein generisches Alias, inklusive Nachzug und bereits enthaltenem Land.
5. Abreise/IATA/Compact-Relevance unverändert.

Nicht geliefert: UI-Redesign, Geocoder, Import-/Bestandsmutation, hartcodierte Ländernamen, Issue #110, AP-6 Runtime, AP-7, Preview-SSO-Umgehung.

## 4. Tests / Evidence

Siehe `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_LOCAL_TEST_EVIDENCE_2026-08-29.md` nach dem Gate-Lauf.

Browser / Real-Device / Mobile Safari: **nicht gelaufen**, nicht behauptet. Preview-Endpoint-Beweis: nach Exact-Head-Preview live prüfen; SSO kann den direkten Public-GET verhindern.

## 5. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Ownership-/Identity-/Auth-/MFA-/AAL-Write. Keine Supabase-Mutation. Keine Service Role. `public.places` nur gelesen.

## 6. Kosten / Provider / Secrets

**keine.**

## 7. Residuals / Risiken

- Preview-/Production-GET bleibt der verbindliche Abnahmebeweis nach Merge. Severity: mittel für Abnahme, nicht für die gefundene Score-Lücke.
- Länder-Nachzug bleibt auf 12 Zeilen begrenzt.
- `main` Branch Protection bleibt `protected=false`.
- Agent-Self-Review ist kein PASS.

## 8. Offene Freigaben

Keine Product-Owner-Sondergates. Ready/Merge nur durch unabhängigen Technical Lead. Issue #110 startet nicht aus diesem File.

## 9. Exakter nächster Schritt

Unabhängiger ChatGPT Technical-Lead Exact-Head-Re-Review von Draft-PR #173. Kein Ready. Kein Merge. Kein Issue #110.

## 10. Zuerst lesen

1. `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_TASK_2026-08-29.md`
2. dieser Status
3. `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_HANDOFF_2026-08-29.md`
4. `docs/VISITOR_SEARCH_COUNTRY_ALIAS_PRODUCTION_RECOVERY_SELF_REVIEW_2026-08-29.md`
5. ADR-0196 Nachtrag
6. `docs/ORTE.md`
7. Issue #109
