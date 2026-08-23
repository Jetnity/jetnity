# Travel Safety & Disruption Foundation – Acceptance

Stand: 23. August 2026  
Status: **Final-Closure-Blocker behoben; Draft-PR #37; Merge-, Mark-Ready- und Production-Gate offen**

Branch: `feat/travel-safety-disruption-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/37  
PR-Zustand: **Draft**  
Base: `main` @ `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Verifizierter Runtime-Head nach Final-Closure-Fix: `b20b3999`  
Verifizierter Docs-/PR-Head vor diesem Nachzug: `d36146021715f99dd332ac143d7f0819b8918d74`  
Ahead/behind zu `origin/main` auf `d3614602`: **19 ahead / 0 behind**  
Task: `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`  
Unabhängiger Review: `docs/PR37_CHATGPT_INDEPENDENT_REVIEW.md`  
Unabhängiger Re-Review: `docs/PR37_CHATGPT_REREVIEW.md`  
Final Closure Review: `docs/PR37_CHATGPT_FINAL_CLOSURE_REVIEW.md`  
Fachdokument: `docs/TRAVEL_SAFETY_DISRUPTION.md`

Kein Merge, kein Mark Ready und keine Production-Migration ohne ausdrückliche aktuelle Product-Owner-Freigabe.

---

## Review-Nachzug

Der unabhängige Review gegen `caa6f7dd` war **REQUEST CHANGES** (ADR-0129).  
Der Re-Review gegen `31678cd8` war **REQUEST CHANGES** (ADR-0130).  
Der Final Closure Review gegen `7efd9d04` war **REQUEST CHANGES**. Die vier letzten Closure-Blocker sind im Runtime-Head `b20b3999` behoben (ADR-0131):

1. Timeout/Throw/Unknown/Conflict/Stale erzeugen keine Clean-Copy und kein generisches API-`ok`. Nur checked-clean darf «keine aktuelle Warnung im geprüften Scope» sagen.
2. Zeitliche Relevanz gilt für die räumlich betroffenen Refs (Stage-Daten, Route-Segmentdaten). Fehlen feinere Zeiten, gilt insufficient, niemals erfundene Entwarnung.
3. Feinere Geo-Scopes: eine Stage im Land schliesst eine Route im selben Land nicht aus.
4. Decision-Signatur, Scope-Identität, Event-Fingerprint und strikte Kalender-/Enum-Normalisierung sind fail-closed und order-independent.

Danach gilt das Stop-Kriterium des Final Closure Reviews.

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

Lokal auf Runtime `b20b3999`:

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | **1459/1459** |
| Typecheck | grün |
| Lint | grün |
| `check:exports` | 0 unbegründete Exporte |
| `check:dead` | nur bekannte CookieConsent-Ausnahme |
| `check:deps` | grün |
| `check:api-schutz` | 10/10 Admin-Routen |
| `check:schema-bezug` | grün |
| Production-Build | grün, 38/38 Seiten, inkl. `/api/safety/evaluate` |
| UI-Audit | **886/886**, 0 Fehler, WebKit + Chromium, Viewports 280 / 320 / 360 / 390 / 430 / 768 / 844x390 / 1280 |

Auf PR-Head `d3614602` (Runtime + ADR-0131):

| Nachweis | Ergebnis |
| --- | --- |
| GitHub Actions | Run [`32630094994`](https://github.com/Jetnity/jetnity/actions/runs/32630094994) **SUCCESS** |
| Vercel Preview | Deployment `6046331762` **READY/SUCCESS** → https://jetnity-app-git-feat-travel-safety-disr-914f66-jetnity-e1b93c82.vercel.app |

Ein reiner Dokumentations-Nachzug nach `b20b3999` / `d3614602` ändert keine Runtime.

---

## Pflicht-Testmatrix

Unit-/Domain-Tests in `lib/safety/engine.test.ts` und `lib/safety/anzeige.test.ts` decken die Szenarien 1–31 plus Review-, Re-Review- und Final-Closure-Pflichtfälle ab. API-Grenze: `lib/safety/anfrage.test.ts`.

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
