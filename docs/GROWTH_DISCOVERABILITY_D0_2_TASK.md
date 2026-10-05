# Jetnity – D0-2 Canonical / Origin / robots-sitemap Consistency – Task

Stand: 26. August 2026  
Agent: **`Jetnity growth discoverability`**  
Branch: `feat/d0-2-canonical-origin-consistency`  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Typ: **enger D0-Runtime-Slice**

## 1. Pflicht vor jeder Änderung

Lies vollständig und in der kanonischen Reihenfolge mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
3. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
4. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
5. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
6. `docs/JETNITY_BINDING_BUILD_ORDER.md`
7. `JETNITY_HANDOFF.md`
8. `docs/ACTIVE_WORK_STATUS.md`
9. `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`
10. `docs/GROWTH_DISCOVERABILITY_D0_1_STATUS.md`
11. diesen Task und `docs/GROWTH_DISCOVERABILITY_D0_2_STATUS.md`
12. relevante Metadata-/robots-/sitemap-/SEO-Tests und ADRs.

Danach live verifizieren:

- `main` und Branch-Head;
- Draft-PR dieses Slices;
- Ahead/Behind/Merge-Base;
- offene parallele PRs;
- tatsächliche aktuelle Implementierung von Metadata, `robots.ts`, `sitemap.ts`, Origin-ENV und JSON-LD-URL;
- GitHub Actions und Vercel;
- Review-Threads.

**Nicht `docs/ACTIVE_WORK_STATUS.md` ändern.** Zentrale Continuity ist ChatGPT-/Technical-Lead-owned, damit parallele Agenten nicht kollidieren.

## 2. Problem / Root Cause

Nach D0-1 sind die privaten Indexgrenzen geschlossen, aber D0-P2-01 und D0-P2-02 bleiben offen:

- zwei konkurrierende öffentliche Origin-Variablen (`NEXT_PUBLIC_APP_URL` und `NEXT_PUBLIC_SITE_URL`) ohne klaren Vertrag;
- Metadata, Sitemap, robots und bestehende Entity-URL können unterschiedliche Origins verwenden;
- kein sauberer Canonical-Vertrag für bewusst öffentliche Kernflächen;
- deny-all auf localhost / `*.vercel.app` kann gleichzeitig eine Sitemap bewerben;
- ein späterer Custom-Domain-Launch darf nicht versehentlich durch ENV-Drift eine zweite URL-Wahrheit erzeugen.

D0-2 schafft **eine technische URL-/Origin-Wahrheit**, aktiviert aber keinen öffentlichen Launch.

## 3. Architekturentscheidung für diesen Slice

Implementiere einen kleinen, zentral getesteten Public-Origin-/Indexing-Vertrag.

### 3.1 Canonical public origin

- `NEXT_PUBLIC_SITE_URL` ist die bevorzugte kanonische Public-Site-Origin.
- `NEXT_PUBLIC_APP_URL` darf nur als klar dokumentierter Legacy-/Fallback-Wert dienen, solange noch kein eigener Public-Site-Wert gesetzt ist.
- Normalisiere auf eine Origin ohne Path, Query, Hash und trailing slash.
- Nur gültiges `http:` / `https:` akzeptieren.
- Ungültige/mehrdeutige Konfiguration darf **nicht** zu erfundener Canonical-Truth oder zu versehentlicher Index-Freigabe führen.
- localhost und `*.vercel.app` bleiben ephemeral/non-public für Indexing.
- Keine DNS-, Domain-, Vercel-Domain- oder ENV-Production-Aktivierung in diesem Slice.

Der Helper darf einen sinnvollen lokalen/ephemeral Fallback für technische URL-Erzeugung liefern, muss Indexing aber fail-closed halten, solange keine sichere Public-Origin-Konfiguration vorliegt.

### 3.2 Eine Origin für alle öffentlichen URL-Produzenten

Führe MetadataBase, Sitemap, robots Host/Sitemap und die **bereits existierende URL-Eigenschaft** der vorhandenen Homepage-JSON-LD-Struktur auf denselben zentralen Origin-Vertrag zurück.

Wichtig: Das ist **kein D0-P2-05 JSON-LD-Ausbau**. Keine neuen Schema-Typen, Claims, `sameAs`, Ratings, Offers etc. Nur vorhandene URL-Origin konsistent machen, sofern sie heute hart aus der alten Origin stammt.

### 3.3 Canonicals

Mindestens bewusst öffentliche Kernflächen erhalten einen stabilen Canonical-Vertrag:

- `/` → canonical `/`
- `/planen` → canonical `/planen`

Für `/planen` gilt weiterhin D0-1:

- ohne akzeptierte Intent-Keys bleibt die Basis indexierbar;
- bei Präsenz von `idee`, `ziel` oder `zielId` bleibt die Response `noindex, nofollow`;
- Parametervarianten dürfen keine eigene indexierbare Canonical-Variante erzeugen.

Keine Canonical-Freigabe für private `/reisen`-Surfaces. D0-1-Noindex bleibt unangetastet.

### 3.4 robots / sitemap Konsistenz

Wenn Indexing fail-closed / deny-all ist:

- `robots.txt` bleibt `Disallow: /`;
- keine öffentliche Sitemap darf dort als Crawl-Empfehlung beworben werden;
- Sitemap-Output darf in diesem Zustand keine öffentliche URL-Liste behaupten (z. B. leer/fail-closed entsprechend sauberer Next.js-Semantik).

Wenn Indexing in einem **synthetisch getesteten Allow-Modus** zulässig wäre:

- robots Host/Sitemap verwenden exakt dieselbe Canonical-Origin;
- Sitemap enthält nur bewusst öffentliche Flächen;
- `/reisen` bleibt ausgeschlossen;
- D0-1-sensitive Disallows bleiben erhalten.

**Keine reale Custom-Domain-/Indexing-Aktivierung.** Der Allow-Modus wird in Tests/isolierter Konfiguration nachgewiesen, nicht produktiv eingeschaltet.

## 4. Acceptance Criteria

Beweise automatisiert mindestens:

1. Canonical-Origin-Normalisierung für gültige `NEXT_PUBLIC_SITE_URL`.
2. Site-URL gewinnt vor Legacy-App-URL.
3. dokumentierter Fallback auf `NEXT_PUBLIC_APP_URL`, ohne Index-Sicherheit zu lockern.
4. ungültige URL / falsches Protokoll / Path-Drift führt fail-safe zu keiner öffentlichen Index-Freigabe.
5. localhost bleibt deny-all.
6. `*.vercel.app` bleibt deny-all.
7. `NEXT_PUBLIC_ALLOW_INDEXING=false` bleibt harter Kill-Switch.
8. deny-all robots bewirbt keine Sitemap.
9. deny-all Sitemap liefert keine öffentlichen URLs.
10. synthetischer Allow-Modus nutzt für Host/Sitemap/Metadata dieselbe Canonical-Origin.
11. Sitemap im Allow-Modus enthält `/` und `/planen`, aber **nicht** `/reisen`.
12. `/` hat korrekten Canonical.
13. `/planen` Basis hat korrekten Canonical.
14. `/planen?idee=`, key-only, Whitespace und normale Werte bleiben `noindex, nofollow` und erzeugen keine indexierbare Param-Variante.
15. `/reisen` und `/reisen/[tripId]` bleiben `noindex, nofollow`.
16. bestehende Login/Register/Auth/Admin/Unauthorized Indexgrenzen regressieren nicht.
17. keine neue Tracking-/Consent-/Provider-/DB-/Auth-/Traveller-/Route-Logik.

## 5. Harte Non-Scope-Grenzen

Nicht in D0-2:

- `/privacy` oder `/terms` bauen oder Rechtstexte erfinden;
- hreflang / Locale-Routing / i18n-Architektur;
- neue JSON-LD-Typen oder Entity-/Authority-Ausbau;
- G0 Events / Attribution / UTM / Referrer / Tracking;
- Cookie-/Consent-Umbau;
- Analytics / Ads / CRM;
- Homepage-Copy oder neue öffentliche Claims;
- Custom Domain verbinden;
- `NEXT_PUBLIC_ALLOW_INDEXING` produktiv aktivieren;
- Provider / Secrets / paid calls;
- DB / Migration / RLS;
- Auth / MFA / Session / Guest→Account;
- Traveller / Multi-Citizenship / Documents;
- Route / Transit;
- Payment;
- TW-6;
- D1/G1+.

Wenn eine saubere Lösung einen neuen oder wesentlich geänderten Shared Contract außerhalb des Public-Origin-/Metadata-Vertrags erfordern würde: **dokumentieren und STOPP**, nicht still erweitern.

## 6. Pflicht-Gates nach Implementierung

- adversarial Self-Review;
- gezielte D0-2 Unit-/Metadata-/robots-/sitemap-Tests;
- relevante D0-1 Regressionstests;
- `npm test` vollständig;
- `npm run typecheck`;
- `npm run lint`;
- `npm run check:setup:ci`;
- relevante Security-/Hygiene-Gates;
- `npm run build`;
- lokale Production-HTML-/robots-/sitemap-Evidence mit mehreren ENV-Szenarien;
- Exact-Head GitHub Actions;
- Exact-Head Vercel Preview;
- Ahead/Behind/Merge-Base;
- Review-Threads;
- tatsächlichen finalen Diff gegen Task/Non-Scope prüfen.

## 7. Abschluss

Aktualisiere ausschließlich slice-eigene Dokumentation, insbesondere `docs/GROWTH_DISCOVERABILITY_D0_2_STATUS.md`. **Nicht `docs/ACTIVE_WORK_STATUS.md`.**

Dokumentiere:

- Root Cause;
- Architekturentscheidung;
- alle geänderten Dateien;
- Tests und Testannahmen;
- Exact-Head Evidence;
- weiterhin offene D0/G0-Findings;
- mögliche neue Risiken.

Danach **STOPP**.

Kein eigener Ready/Merge. Kein D0-3/G0-1/D1/G1+. ChatGPT / Technical Lead prüft den finalen Change unabhängig von Anfang an und entscheidet erst danach über Korrektur oder Integration.
