# Jetnity – Traveller / Account Next-Phase Audit – Adversarial Self-Review

Stand: 26. August 2026  
Agent: `Account plattform audit vorbereitung`  
Gegenstand: `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md` nach TL CHANGES REQUIRED  
PR: #76 / `audit/traveller-account-next-phase`

---

## 1. Was dieser Review angreift

1. Habe ich „P0-STOP“ nur umbenannt, aber faktisch als P0 stehen lassen?
2. Habe ich P1-TA-01 weiter als aktuellen Runtime-P1 verkauft?
3. Habe ich den Official-Collapse zu einer erfundenen Visa-Entscheidung gemacht?
4. Habe ich Production-Child-Tabellen ohne die TL-Evidence oder als eigene Query behauptet?
5. Habe ich einen Account-Registry-Contract erfunden?
6. Habe ich Runtime, DB, Auth, Guest→Account oder `ACTIVE_WORK_STATUS.md` angefasst?

---

## 2. Call-Graph-Evidence für P2-TA-06

| Pfad | `credentialOptions` | Trifft `documents[0]`-Fallback? |
| --- | --- | --- |
| `anfrageAus` → `credentialOptionsAus` | immer gesetzt; bei Dokumenten 1:n, sonst `:none` | nein |
| `requirementsEvaluationsPruefen` / `officialRequirementsPruefen` | über `anfrageAus` | nein |
| `requirementsFuerReise` → `travellerAusSlot` | über `credentialOptionsAus` | nein |
| `app/api/readiness/requirements/route.ts` | über die drei Funktionen oben | nein |
| `app/**` direkt `requirementsAuswerten` | **kein Treffer** | nicht belegt |
| `requirementsAuswerten` / Tests | können Roh-Traveller ohne Options übergeben | ja, latent / Test |

Der Fallback-Code in `travellerNormalisieren` existiert. Die Schwere als aktueller Produkt-P1 ist **nicht** belegt. P2 ist die ehrliche Klasse.

Leeres `credentialOptions: []` würde den Fallback ebenfalls auslösen. `credentialOptionsAus` liefert kein leeres Array. Deshalb bleibt der aktuelle App-Pfad geschützt.

---

## 3. Official-Collapse (P1-TA-02)

`officialAusEvaluations` setzt `result: 'unknown'` hart. `status` wird bei `current` ebenfalls auf `unknown` gezogen. Authority/URL/Reason können trotzdem von `evaluations[0]` stammen.

Das ist Presentation-/Option-Scope, nicht Regulatory-Invention. P1 bleibt gerechtfertigt, weil der Kollaps auf dem Live-Pfad `readinessAnsicht` + Requirements-API liegt. P0 wäre falsch.

---

## 4. Production

Foundation-E-Migrationen auf Production stammen aus **TL-Live-Evidence**, nicht aus einer Query dieses Agenten. Der Audit sagt das. START_HERE nennt weiterhin den späteren Flug-Surface-Schnitt; das widerspricht der namentlichen Bestätigung der drei Foundation-E-Migrationen nicht.

---

## 5. Gehalten / korrigiert

| Aussage | Stand nach Korrektur |
| --- | --- |
| Current Truth trip-scoped | gehalten |
| Kein Default-Pass im App-Pfad | gehalten; Fallback nur latent |
| Issuer ≠ Citizenship | gehalten |
| Kein Account-Registry-Contract | gehalten; AP-7 nur als fehlend + Gate |
| Kein P0 | korrigiert |
| P1-TA-01 nicht mehr Runtime-P1 | korrigiert → P2-TA-06 |
| Official-Collapse getrennt, `result unknown` | korrigiert |
| Production-Children insufficient evidence | korrigiert |
| `ACTIVE_WORK_STATUS.md` | unberührt |
| Runtime / DB / Auth / Guest→Account | unberührt |

---

## 6. Restschwächen

1. Parallel-PRs #74/#75/#77 nicht dateiweise erneut gedifft. Kollision nur über Scope.
2. RLS nur aus Migrationstext, nicht `db:rls` live.
3. Planner nicht runtime-geprüft; bleibt Non-Scope.
4. Safety-Zulässigkeit gilt nur für heutige citizenship-Facts.
5. Exact-Head-CI/Vercel dieser Korrektur sind erst nach Push belegt.

---

## 7. Urteil

Die TL-Änderungen an Evidence und Severity sind umgesetzt. Der Audit bleibt **review-fähig, nicht Ready**.

**STOPP.** Kein Folgeslice.
