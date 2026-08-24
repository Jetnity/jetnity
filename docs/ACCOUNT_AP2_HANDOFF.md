# Jetnity Account Platform – AP-2 Handoff

Stand: 24. August 2026  
Status: **PASS / TECHNICAL CLOSURE – Draft, kein Mark Ready, kein Merge, kein AP-3**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-2 |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Stack-Basis | `feat/account-ap1` @ `9cc9b0526683f161f500326a7b72c74abac9c296` |
| Auftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` + `docs/ACCOUNT_AP2_B1_FIX_TASK.md` |
| Runtime-Head | `e9b2f834edc925b12e8b5a667f0e4382642eae8f` |
| Self-Review | `docs/ACCOUNT_AP2_SELF_REVIEW.md` |
| Technical Closure | `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md` |

## Was ein neuer Agent zuerst liest

1. `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md`
2. `docs/ACCOUNT_AP2_STATUS.md`
3. `docs/ACCOUNT_AP2_B1_FIX_TASK.md`
4. `docs/ACCOUNT_AP2_AUTH_UX_TASK.md`
5. `docs/ACCOUNT_AP2_SELF_REVIEW.md`
6. Draft-PR #48 und Stack-Basis PR #43

## Runtime-Nachweis

- **Gegates Runtime-Head:** `e9b2f834edc925b12e8b5a667f0e4382642eae8f`
  - GitHub Actions: **SUCCESS** (`32714001669`)
  - Vercel Preview: **success / READY** (`G9JnPhBkhejRetPcTMJm82AXeAZn`)
- Nachfolgende Docs-Commits ändern diesen Runtime-Nachweis nicht.

## Technical-Lead-Re-Review

AP2-B1 ist geschlossen. `registerSignupOeffentlichAuswerten()` führt Bestandskonto-neutralisiert und neuen Signup ohne Session auf denselben `registerOeffentlicherErfolg()`.

Öffentlich identisch sind:

- neutrale Success-Copy,
- geleerte Name-/E-Mail-/Passwortfelder,
- keine Feldfehler,
- gleicher Success-State,
- gleicher Fokus auf `#register-erfolg`.

Damit besteht der zuvor belegte sichtbare Enumeration-Kanal nicht mehr. Der Session-Pfad leitet separat weiter und echte fachliche Fehler bleiben Fehler.

## Nicht angefasst

DB/Migration/RLS, Consent-Write, Traveller-Registry, Guest→Account-Persistenz, Payment, Provider-Aktivierung, OAuth-Secrets, Production-Redirect-Push, Admin, Homepage, Route/Readiness/Safety/Seasonal, AP-3, neue AGB-/Datenschutztexte.

## Offene, ehrliche Restpunkte

- Gastübernahme bleibt auf `/reisen`; das ist der bestehende Vertrag.
- MFA-Dialog hat keinen separaten Browser-/Screenreader-Lauf; der Quellvertrag und Account-UI-Audit bleiben der vorhandene Nachweis.
- OAuth-Anbieter bleiben in `config.toml` aus.
- AP-2 ist auf AP-1 gestapelt; PR #43 ist weiterhin Draft und ungemergt.

## Nächster Schritt

Keine weitere AP-2-Runtime-Arbeit ohne neuen konkreten Defekt. Product Owner entscheidet separat über Mark Ready / Merge und die notwendige Integrationsreihenfolge von AP-1 vor AP-2. AP-3 nicht starten.
