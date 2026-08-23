# Jetnity – Travel Timing & Seasonal Intelligence

Stand: 23. August 2026  
Status: **provider-neutrale Foundation auf Draft-PR #38; kein Live-Provider, keine Production-Migration**

Fachdokument zur Seasonal-Wahrheit. Acceptance: `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`.  
Policy: `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`.

---

## Ziel

Jetnity kann später belastbare saisonale Muster auf eine **konkrete Reisezeit und einen konkreten Ort** beziehen. Die Foundation macht den späteren Provider anschließbar, ohne Domäne, Entscheidungslogik oder Kern-UI neu zu bauen.

Leitsatz:

> **Seasonal sagt nicht, ob die Reise „gut“ oder „schlecht“ ist. Jetnity erkennt belastbar, welcher typische saisonale Kontext zu dieser konkreten Reisezeit und diesem konkreten Ort passt, erklärt mögliche Auswirkungen und lässt die Entscheidung beim Nutzer.**

---

## Getrennte Ebenen

Diese Ebenen dürfen nicht in ein Severity-Feld fallen:

1. Kategorie (`monsoon`, `tropical_cyclone_season`, …) – keine Severity
2. Evidence-Klasse (`seasonal_pattern` / `official_seasonal_risk_window` / `forecast_outlook`)
3. source-backed Outcome (`less_favorable` / `mixed_tradeoff` / `favorable_context` / `unknown`)
4. Freshness
5. Reference Period (Klimanormal, z. B. 1991–2020)
6. Travel Window (annual recurring oder absolute)
7. räumliche Relevanz
8. Trip-Impact
9. Präsentationsklasse (`timing_check` / `timing_notice` / `information` / `unknown`)

Akute Warnungen (`active_warning`) gehören zur Safety-Domäne und erscheinen nicht als Seasonal-Hinweis. Safety filtert `seasonal_pattern` weiterhin aus.

---

## Architektur

| Schicht | Ort | Aufgabe |
| --- | --- | --- |
| Domain | `lib/seasonal/domain.ts` | Kategorien, Outcome, Relevanz, Impact, Evaluation |
| Evidence | `lib/seasonal/evidence.ts` | Trust, Freshness ohne 7-Tage-Default |
| Fenster | `lib/seasonal/fenster.ts` | Recurring/Absolute Travel Window, Reference Period |
| Scope | `lib/seasonal/scope.ts` | räumlicher Geltungsbereich |
| Port | `lib/seasonal/provider.ts` | `seasonalProviderAus() → null` |
| Engine | `lib/seasonal/engine.ts` | Evaluation, fail-closed |
| Relevanz | `lib/seasonal/relevanz.ts` | Stage/Route/Fenster-Abgleich |
| Impact | `lib/seasonal/impact.ts` | Recheck-Hinweise, keine Mutation |
| API | `POST /api/seasonal/evaluate` | Rate-Limit, Zod, Body-Cap, `private, no-store` |
| Ansicht | `components/trips/ReisezeitHinweise.tsx` | nur bei übergebenen Evaluations sichtbar |

Route Truth kommt ausschließlich aus `routeFactsAusGraph`. Seasonal bleibt traveller-neutral. Citizenship gehört nicht in den Foundation-Fingerprint.

---

## Recurring Window

Jährliche Fenster sind Month/Day → Month/Day, Grenzen inklusiv.

- `11-01` → `03-31` wrappt über den Jahreswechsel.
- Mehrere berührte Reisejahre werden projiziert.
- `02-29` ist als Definition gültig und trifft nur echte Schalttage.
- Ungültige Month/Day-Werte (`02-30`) fail-closed.
- Reference Period beschreibt die Datenbasis, nicht das Travel Window.

---

## Freshness

Ohne belastbaren `freshUntil`-Vertrag gibt es kein `current`. Safety-7-Tage-Default wird nicht kopiert. `checkedAt` in der Zukunft oder `freshUntil` vor `checkedAt` verwirft Trust bzw. die Zeile.

---

## Persistenz

Keine Seasonal-Tabelle. Seasonal Truth bleibt compute-on-read. Production-Schema unverändert.

Lokal und remote auf Runtime `f077d4d1` verifiziert: 1559 Tests, UI-Audit 1014/1014, Production-Build Exit 0, GitHub Actions SUCCESS, Vercel Preview READY. Review-Blocker 1–9 sind geschlossen. R5-Re-Review ist offen. Live-Provider bleibt `null`.

---

## Was diese Foundation nicht tut

- keinen echten Climate-/Weather-/Seasonal-Provider anschließen
- keine akute Warnung als historischen Saisonkontext zeigen
- keine Reise automatisch ändern
- keine permanente leere Seasonal-Karte ohne Evaluations
- kein LLM als Truth-Quelle
- keine persistierte Entscheidung `Trotzdem so planen`
- keine erfundenen Preise, Crowding-Werte oder optimalen Monate
