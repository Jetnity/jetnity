# Travel Safety & Disruption Foundation – Acceptance

Stand: 23. August 2026  
Status: **Stop-Criterion-Truth-Blocker behoben; Draft-PR #37; Merge-, Mark-Ready- und Production-Gate offen**

Branch: `feat/travel-safety-disruption-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/37  
PR-Zustand: **Draft**  
Base: `main` @ `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Verifizierter Runtime-Head nach Stop-Criterion-Fix: `8d78da98`  
Dieser Docs-Nachzug ändert keine Runtime.  
Ahead/behind zu `origin/main` auf Runtime `8d78da98`: **22 ahead / 0 behind**  
Task: `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`  
Unabhängiger Review: `docs/PR37_CHATGPT_INDEPENDENT_REVIEW.md`  
Unabhängiger Re-Review: `docs/PR37_CHATGPT_REREVIEW.md`  
Final Closure Review: `docs/PR37_CHATGPT_FINAL_CLOSURE_REVIEW.md`  
Stop-Criterion Recheck: `docs/PR37_CHATGPT_STOP_CRITERION_RECHECK.md`  
Fachdokument: `docs/TRAVEL_SAFETY_DISRUPTION.md`

Kein Merge, kein Mark Ready und keine Production-Migration ohne ausdrückliche aktuelle Product-Owner-Freigabe.

---

## Review-Nachzug

Der unabhängige Review gegen `caa6f7dd` war **REQUEST CHANGES** (ADR-0129).  
Der Re-Review gegen `31678cd8` war **REQUEST CHANGES** (ADR-0130).  
Der Final Closure Review gegen `7efd9d04` war **REQUEST CHANGES**. Die vier letzten Closure-Blocker sind im Runtime-Head `b20b3999` behoben (ADR-0131).

Der Stop-Criterion Recheck gegen `57f34ecf` / Runtime `b20b3999` war **REQUEST CHANGES**. Die drei konkreten Truth-Blocker sind im Runtime-Head `8d78da98` behoben (ADR-0132):

1. Teilweise malformed Providerantworten können nicht `checked_clean` oder generisches API-`ok` erzeugen. `summary.complete` bleibt fail-closed; gültige Warnungen bleiben sichtbar.
2. Date-only gilt als voller Kalendertag. Route-Segmentzeiten erzeugen echte Kontaktfenster. Derselbe Tag wird nicht wegen Mitternacht `not_affected`.
3. Routekontakte sind einzelne Fenster. Country-Scope behält Stage und alle Land-Routekontakte. Feinere City/Place-Matches behalten unresolved Routekontakt, wenn die Stage zeitlich herausfällt.

Der nächste unabhängige Check soll auf Closure/Pass zielen, sofern kein neuer konkreter Truth-/Security-/SoT-/Rollout-Defekt erscheint.

---

## Was dieser Block beweist

Jetnity besitzt eine provider-neutrale Safety-Domäne, die:

- External Facts von der Reise-Evaluation trennt
- räumlich und zeitlich den konkreten Reiseteil zuordnet
- Foundation-D Route Truth und Foundation-E Traveller Context wiederverwendet
- Cross-Domain Recheck-Hinweise liefert, ohne die Reise zu mutieren
- saisonale Muster nicht als akute Warnung behandelt
- Unknown nicht als Entwarnung darstellt
- ohne Provider keine Fake-Warnung erzeugt

---

## Datenbankgrenze

- **keine** neue Migration
- **keine** Safety-Tabelle
- Production-Schema unverändert
- bestehende Gates unverändert grün: `db:rechte` 51 Rechte, `db:rls` Exit 0, `db:sicherheit` 210/210, `db:parallelitaet` 7/7

---

## Verifizierte Nachweise

Lokal auf Runtime `8d78da98`:

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | **1476/1476** |
| Typecheck | grün |
| Lint | grün |
| `check:exports` | 0 unbegründete Exporte |
| `check:dead` | nur bekannte CookieConsent-Ausnahme |
| `check:deps` | grün |
| `check:api-schutz` | 10/10 Admin-Routen |
| `check:schema-bezug` | grün |
| Production-Build | grün, 38/38 Seiten, inkl. `/api/safety/evaluate` |
| UI-Audit | **886/886**, 0 Fehler, WebKit + Chromium, Viewports 280 / 320 / 360 / 390 / 430 / 768 / 844x390 / 1280 |

Auf Runtime `8d78da98`:

| Nachweis | Ergebnis |
| --- | --- |
| GitHub Actions | Run [`32631778057`](https://github.com/Jetnity/jetnity/actions/runs/32631778057) **SUCCESS** |
| Vercel Preview | Deployment `6046614518` **READY/SUCCESS** → https://jetnity-app-git-feat-travel-safety-disr-914f66-jetnity-e1b93c82.vercel.app |

Ein reiner Dokumentations-Nachzug nach `8d78da98` ändert keine Runtime.

---

## Pflicht-Testmatrix

Unit-/Domain-Tests in `lib/safety/engine.test.ts` und `lib/safety/anzeige.test.ts` decken die Szenarien 1–31 plus Review-, Re-Review-, Final-Closure- und Stop-Criterion-Pflichtfälle ab. API-Grenze: `lib/safety/anfrage.test.ts`.

---

## Harte Gates bleiben

- kein echter Safety-/Disruption-Provider
- keine Provider-Secrets
- keine neuen laufenden Providerkosten
- kein Mark Ready
- kein Merge
- keine Production-Migration

---

## Bewusste Nicht-Ziele / technische Schulden

- API lädt keinen Account-Trip per `tripId`; sie bewertet validierte Trip-Facts (Guest-/Audit-tauglich).
- Rate-Limit ist in-process und nur für Preview/Development.
- `Jetzt wichtig` wird nicht vorgebaut.
- title-only Activities/Stays erzeugen keine geratene Geo-Betroffenheit.
- `tripAusSafetyAnfrage()` nutzt weiterhin `beispielreise()` als Basisobjekt und überschreibt die safety-relevanten Felder.
