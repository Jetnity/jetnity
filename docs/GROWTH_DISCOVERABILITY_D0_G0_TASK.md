# Jetnity – Growth / Discoverability D0-G0 Foundation Task

Stand: 25. August 2026  
Status: **CONTROL-DOC / unabhängiger Audit- und Architektur-Slice vor Runtime-Freigabe**

Agent: `Jetnity growth discoverability`

Branch: `audit/growth-discoverability-d0-g0-foundation`

## 1. Warum dieser Slice jetzt erlaubt ist

`docs/JETNITY_BINDING_BUILD_ORDER.md` erlaubt konfliktarme D0-/G0-Grundlagen ausdrücklich früh, sofern sie den aktiven Integrationspfad nicht aufblähen. TW-5 ist inzwischen auf `main` integriert. TW-6 wartet auf seinen dokumentierten Product-Owner-/Guest-One-Trip-Start-Gate.

Dieser Slice zieht **keine** Homepage-Finalisierung, Kampagne, Provider-/Commercial-Truth, CRM, Paid Media oder Public Launch vor.

## 2. Ziel

Unabhängig und adversarial feststellen, welche technische Discoverability- und Growth-Foundation Jetnity bereits besitzt, welche Lücken real bestehen und welche minimalen kontrollierten Runtime-Slices später nötig sind.

Der Agent liefert eine belastbare Ist-/Soll-Matrix für:

### D0 – technische Discoverability-Grundlage

- öffentliche vs. private/indexierungsverbotene Route-Surfaces;
- Crawlability und serverseitig sichtbarer Kerninhalt;
- Metadata-Architektur;
- Canonical-Verträge;
- Locale-/hreflang-Readiness;
- Sitemap-Grundlage;
- `robots.txt`-Grundlage;
- Redirect-/Duplicate-Content-Risiken;
- OpenGraph/Social-Metadata-Grundlage;
- JSON-LD-/Schema.org-Readiness (`Organization`, `WebSite`, später nur truth-ready Typen);
- semantisches HTML / Heading-/Landmark-Struktur;
- technische SEO-/Accessibility-/Performance-Gates;
- harte Schutzgrenze: private Trips, Account, Dokumente, Admin, Support, Checkout/Payment und andere sensitive Surfaces dürfen nicht öffentlich indexierbar werden.

### G0 – Growth-/Measurement-Vertragsgrundlage

- bestehende Acquisition-/Attribution-Parameter oder deren Fehlen;
- bestehende Event-/Analytics-Verträge oder deren Fehlen;
- Anonymous→Account-Grenzen;
- Consent-/Privacy-Abhängigkeiten;
- Deep-Link-/Landingpage-Verträge;
- Locale/Market/Currency-Kontext;
- Data-Quality-/Versionierungsanforderungen;
- welche Events technisch sinnvoll wären, **ohne** Tracking jetzt still zu aktivieren;
- klare Trennung zwischen Product Events, Marketing Events und Revenue Truth.

## 3. Verbindliche Pflichtlektüre

Vor Audit vollständig lesen:

1. `JETNITY_START_HERE.md`
2. `JETNITY_HANDOFF.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
6. `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
7. `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
8. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
9. `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
10. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
11. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
12. `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`
13. relevante Legal/Privacy/Consent-, i18n-, SEO-, routing- und analytics-nahe Repo-Dokumente.

## 4. Live-Verifikation vor Audit

Nicht auf Docs vertrauen. Live prüfen:

- aktuellen `main`;
- diesen Branch und Draft-PR;
- Ahead/Behind/Merge-Base;
- offene parallele Runtime-PRs;
- aktuelle öffentliche und private Route-Struktur;
- App Router layouts/pages/route handlers;
- bestehende `metadata`, `generateMetadata`, sitemap/robots, manifest, OG, JSON-LD, canonical/hreflang/i18n-Mechanismen;
- Middleware/Auth-/Route-Protection;
- Analytics-/event-/UTM-/referrer-/consent-nahe Implementierung;
- tests/build/gates;
- Vercel-/Deployment-Verhalten nur soweit für technische Indexierbarkeit relevant.

## 5. Harte Scope-Grenze

### In diesem ersten Slice erlaubt

- Code-/Konfigurations-/Routen-Audit;
- Contract-/Architecture-Analyse;
- Risk-/Gap-Matrix;
- konkrete Testszenarien und Folge-Slice-Zerlegung;
- Dokumentation;
- rein lokale ungefährliche Verifikation ohne echte externe Kampagnen/Provider/Tracking-Writes.

### In diesem ersten Slice NICHT erlaubt

- keine Homepage-Positionierung oder Hero-/Marketing-Copy verändern;
- keine neuen öffentlichen Feature-Claims veröffentlichen;
- keine bisher privaten/sensitiven Daten indexierbar machen;
- keine Analytics-/Ad-/CRM-/Audience-/Tracking-Verbindung produktiv aktivieren;
- keine Cookies/Consent-Umgehung;
- kein Fingerprinting;
- keine versteckte Anonymous→Account-Identitätsauflösung;
- keine Provider-, Affiliate-, Campaign-, Ads- oder paid calls;
- keine Secrets;
- keine neue DB/Migration/RLS/Auth-/Traveller-/Route-Shared-Contract-Änderung;
- keine App-Store-/Public-Launch-Aktivierung;
- keine D1/D2/D3/D4- oder G1+ Runtime vorziehen;
- keine Fake-Reviews, Fake-Ratings, Fake-Awards oder unbelegten Schema-Markups;
- keine `Product`/`Offer`/`Review`-Structured-Data ohne reale öffentliche Wahrheit.

## 6. Audit-Mandat

Der Agent muss mindestens folgende Fragen mit Evidence beantworten:

1. Welche URLs sind heute tatsächlich öffentlich crawlbar/indexierbar?
2. Gibt es eine Gefahr, dass private/account/admin/trip/document Surfaces indexiert werden können?
3. Welche Metadata-/Canonical-/Locale-/hreflang-Mechanik existiert wirklich?
4. Existieren sitemap/robots/manifest/OG/JSON-LD und sind sie semantisch/technisch korrekt?
5. Gibt es widersprüchliche Canonicals, Duplicate Paths, status-code- oder redirect-Probleme?
6. Welche D0-Komponenten fehlen komplett, welche sind teilweise vorhanden, welche produktionsreif?
7. Welche G0-/Attribution-/Event-Verträge existieren bereits und wem gehören sie?
8. Welche Privacy-/Consent-/Account-/Admin-Shared-Contracts blockieren Runtime?
9. Welche minimale Folge-Slice-Reihenfolge ist konfliktarm und testbar?
10. Welche Teile können bereits jetzt technisch vorbereitet werden, ohne D1/Homepage oder produktive Growth-Aktivierung vorzuziehen?

## 7. Severity und Finding-Format

Jedes Finding:

- ID
- Severity P0/P1/P2/P3
- Kategorie D0/G0/Privacy/Security/SEO/Accessibility/Performance/Data Quality
- Datei/Route/Surface
- reproduzierbare Evidence
- erwartet vs. tatsächlich
- Nutzer-/Business-/Security-Impact
- betroffener Contract/Owner
- vorgeschlagener Folge-Slice
- blockiert was?

Keine Severity aufblasen. Ein mögliches Index-Leak privater/sensitiver Daten ist mindestens als Security/Privacy-Priorität zu behandeln und sofort an den Technical Lead zu eskalieren.

## 8. Deliverables

Neu erstellen:

- `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`

Aktualisieren:

- `docs/GROWTH_DISCOVERABILITY_D0_G0_STATUS.md`

Der Auditbericht enthält:

- Executive Summary;
- Live-basierte Ist-Architektur;
- D0-Matrix;
- G0-Matrix;
- private/public Index Boundary;
- Findings mit Severity;
- ausdrücklich geprüfte Kategorien ohne Finding;
- vorgeschlagene kleine Folge-Slices mit Dependencies;
- klare STOPP-/PO-/Shared-Contract-Gates;
- Test-/Gate-Plan.

## 9. Tests / Evidence

Soweit ohne Runtime-Änderung sinnvoll:

- bestehende Typecheck/Lint/Test/Build-Gates;
- vorhandene SEO-/routing-/metadata-/privacy-nahe Tests;
- statische Route-/Code-Analyse;
- lokale HTTP-/HTML-Checks auf repräsentativen öffentlichen und geschützten Routes, ohne destructive/production Tests;
- keine Fehler herausfiltern.

Exakte Commands, Counts und Exitcodes dokumentieren.

## 10. STOPP

Nach Audit, Status, adversarial Self-Review und Evidence:

**STOPP.**

Kein Ready. Kein Merge. Keine D0/G0-Runtime-Implementierung in diesem Slice. Keine D1/G1+-Arbeit.

ChatGPT / Technical Lead prüft Findings, entscheidet Ownership und zerlegt die freigegebenen Folge-Slices.