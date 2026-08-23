# Travel Safety & Disruption Foundation – Acceptance

Stand: 23. August 2026  
Status: **technisch reviewbereit auf Draft-PR #37; Merge-, Mark-Ready- und Production-Gate offen**

Branch: `feat/travel-safety-disruption-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/37  
PR-Zustand: **Draft**  
Base: `main` @ `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Implementierungs-Head inkl. `main`-Sync: `71f02c4eddb80d227c651d911228015c4d8f5ad6`  
Ahead/behind zu `origin/main` auf diesem Implementierungs-Head: **5 ahead / 0 behind**  
Task: `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`  
Audit: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ARCHITECTURE_AUDIT.md`  
Fachdokument: `docs/TRAVEL_SAFETY_DISRUPTION.md`

Kein Merge, kein Mark Ready und keine Production-Migration ohne ausdrückliche aktuelle Product-Owner-Freigabe.

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

## Verifizierte Nachweise

| Nachweis | Ergebnis |
| --- | --- |
| `npm test` | **1393/1393** |
| Typecheck | grün |
| Lint | grün |
| `check:exports` | 0 unbegründete Exporte |
| `check:dead` | nur bekannte CookieConsent-Ausnahme |
| `check:deps` | grün |
| `check:api-schutz` | 10/10 Admin-Routen |
| `check:schema-bezug` | grün |
| Production-Build | grün, 38/38 Seiten, inkl. `/api/safety/evaluate` |
| UI-Audit | **886/886**, 0 Fehler, WebKit + Chromium, Viewports 280 / 320 / 360 / 390 / 430 / 768 / 844x390 / 1280; inkl. `safety-kein-provider`, `safety-unavailable`, `safety-kritisch-eine-etappe` |
| GitHub Actions auf `71f02c4e` | Run [`32610279898`](https://github.com/Jetnity/jetnity/actions/runs/32610279898) **SUCCESS** |
| Vercel Preview auf `71f02c4e` | Deployment `6043181714` **success** → https://jetnity-q14jlyh8o-jetnity-e1b93c82.vercel.app |

Der nachfolgende Dokumentations-Commit ändert keine Runtime-Logik. Dessen CI/Preview wird nach dem Push separat festgehalten und nicht vorab als grün behauptet.

---

## Pflicht-Testmatrix

Unit-/Domain-Tests in `lib/safety/engine.test.ts` und `lib/safety/anzeige.test.ts` decken die Szenarien 1–31 ab. API-Grenze: `lib/safety/anfrage.test.ts` (Content-Type, Body-Cap, Client-Evidence ignoriert).

UI-Nachweis über den bestehenden Trip-Workspace-Audit, nicht über eine parallele Device-Suite.

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
