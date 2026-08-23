# Travel Safety & Disruption Foundation – Acceptance

Stand: 23. August 2026  
Status: **Review-Blocker behoben; Draft-PR #37; Merge-, Mark-Ready- und Production-Gate offen**

Branch: `feat/travel-safety-disruption-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/37  
PR-Zustand: **Draft**  
Base: `main` @ `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Verifizierter Runtime-Head nach Review-Fix: `01096bb3dc2969d7372b71fc9ab6eae16e3ea4c4`  
Ahead/behind zu `origin/main` auf diesem Head: **10 ahead / 0 behind**  
Task: `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`  
Unabhängiger Review: `docs/PR37_CHATGPT_INDEPENDENT_REVIEW.md`  
Fachdokument: `docs/TRAVEL_SAFETY_DISRUPTION.md`

Kein Merge, kein Mark Ready und keine Production-Migration ohne ausdrückliche aktuelle Product-Owner-Freigabe.

---

## Review-Nachzug

Der unabhängige Review gegen `caa6f7dd` war **REQUEST CHANGES**. Die vier Truth-Blocker sind im Runtime-Head `01096bb3` behoben (ADR-0129):

1. Evidence-Freshness getrennt vom Event-Zeitfenster; Max-Age 7 Tage bzw. `freshUntil`
2. Geo: `not_affected` nur bei belegter Nicht-Betroffenheit; Admin-Region und namenlose Stadt bleiben `insufficient_context`
3. Order-Independence: Traveller-Signatur, deterministische Evidence-Wahl, `maxFacts` fail-closed, malformed `nature` verworfen
4. Provider-Timeout/Abort erzeugt `source_temporarily_unavailable`, keine Warn-Truth

Nächster Schritt: unabhängiger ChatGPT-Re-Review gegen den tatsächlichen neuen PR-Head.

---

## Was dieser Block beweist

Jetnity besitzt eine provider-neutrale Safety-Domäne, die:

- External Facts von der Reise-Evaluation trennt
- räumlich und zeitlich konkret zuordnet
- Foundation-D Route Truth wiederverwendet
- Foundation-E Traveller Context nicht dupliziert
- Cross-Domain Recheck-Hinweise liefert, ohne die Reise zu mutieren
- saisonale Muster nicht als akute Warnung behandelt
- ohne Provider keine Fake-Warnung und keine Entwarnung erzeugt

---

## Datenbankgrenze

- **keine** neue Migration
- **keine** Safety-Tabelle
- Production-Schema unverändert
- bestehende Gates unverändert grün: `db:rechte` 51 Rechte, `db:rls` Exit 0, `db:sicherheit` 210/210, `db:parallelitaet` 7/7

---

## Verifizierte Nachweise auf `01096bb3`

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | **1410/1410** |
| Typecheck | grün |
| Lint | grün |
| `check:exports` | 0 unbegründete Exporte |
| `check:dead` | nur bekannte CookieConsent-Ausnahme |
| `check:deps` | grün |
| `check:api-schutz` | 10/10 Admin-Routen |
| `check:schema-bezug` | grün |
| Production-Build | grün, 38/38 Seiten, inkl. `/api/safety/evaluate` |
| UI-Audit | **886/886**, 0 Fehler, WebKit + Chromium, Viewports 280 / 320 / 360 / 390 / 430 / 768 / 844x390 / 1280 |
| GitHub Actions | Run [`32612980450`](https://github.com/Jetnity/jetnity/actions/runs/32612980450) **SUCCESS** |
| Vercel Preview | Deployment `6043592490` **READY/SUCCESS** → https://jetnity-app-git-feat-travel-safety-disr-914f66-jetnity-e1b93c82.vercel.app |

Ein reiner Dokumentations-Nachzug nach `01096bb3` ändert keine Runtime.

---

## Pflicht-Testmatrix

Unit-/Domain-Tests in `lib/safety/engine.test.ts` und `lib/safety/anzeige.test.ts` decken die Szenarien 1–31 plus die Review-Pflichtfälle zu Freshness, Geo, Dedup und Timeout ab. API-Grenze: `lib/safety/anfrage.test.ts`.

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
