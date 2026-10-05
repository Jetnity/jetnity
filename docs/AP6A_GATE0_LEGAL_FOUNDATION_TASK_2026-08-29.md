# AP-6a Gate 0 – Legal Foundation / Trust Boundary

Stand: 29. August 2026

Status: **VERSIONED TASK / DOCS-CONTRACT-EVIDENCE ONLY / NO LEGAL RUNTIME CONTENT**

Issue: #165

Baseline: `main @ 765fc547c2d2ffd8460e05fec4234906103fe73c`

Cursor-Agent: `Account plattform audit vorbereitung 16`

## 1. Ziel

AP-6a Gate 0 rekonstruiert die aktuelle Legal-/Privacy-/Consent-Wahrheit und definiert den kleinsten professionellen Runtime-Vertrag für `/privacy` und `/terms`, ohne Rechtstexte zu erfinden.

Live-Evidence vor Task-Erstellung:

- AP-5-S3/S4/S5 sind integriert; S5-Merge auf `main @ 765fc547c2d2ffd8460e05fec4234906103fe73c`.
- Post-Merge GitHub Actions Run `33242227312` ist SUCCESS.
- Vercel Production Deployment `dpl_3PWuyGopCnjcdh44twcUUpCWXzmi` ist READY; Production-Smoke `/` HTTP 200.
- `/privacy` liefert auf Production HTTP 404.
- `/terms` liefert auf Production HTTP 404.
- Die Registrierung verlinkt diese Legal-Routen bereits; der Account-Plan klassifiziert dies als D0-P1-03 / Trust-Boundary-Defekt.

## 2. Required Work

1. Rekonstruiere auf exakt dieser Baseline alle relevanten Legal-/Privacy-/Consent-Flächen:
   - Register-Checkbox und Links,
   - Footer-/Navigation-/Metadata-Flächen,
   - vorhandene Cookie-/Consent-Komponenten,
   - Legal-/Privacy-Dokumentation,
   - Firmen-/Kontakt-/Domain-Fakten, soweit im Repo wirklich belegt.
2. Dokumentiere Current Truth getrennt nach:
   - vorhanden und belegt,
   - technisch ableitbar,
   - rechtlich/fachlich fehlender Input,
   - ausdrücklich unknown / nicht freigegeben.
3. Definiere den Runtime-Vertrag für `/privacy` und `/terms`:
   - Route und Layout,
   - mobile/desktop parity,
   - Accessibility/semantische Überschriften/Links,
   - Metadata/Canonical/robots Verhalten,
   - Verlinkung von Registrierung und Footer,
   - keine öffentliche Indexierung vor dem bestehenden Public-Launch-/Indexing-Gate.
4. Definiere einen eindeutigen Legal-Content-Input-Vertrag. Mindestens prüfen/klassifizieren:
   - Betreiber-/Unternehmensidentität,
   - ladungsfähige/postalische Kontaktangaben,
   - verantwortliche Stelle / Controller,
   - Rechtsraum/Zielmärkte,
   - Datenkategorien und Zwecke,
   - Rechtsgrundlagen/Einwilligung soweit relevant,
   - Auftragsverarbeiter/Provider-Kategorien,
   - internationale Datenübermittlungen,
   - Aufbewahrung/Löschung,
   - Betroffenenrechte und Kontaktweg,
   - Cookies/Analytics/Marketing-Status,
   - Account/Trip/Traveller/Auth-Daten,
   - sensible Dokumentdaten ausdrücklich nur soweit real implementiert,
   - Minderjährige/Altersgrenzen soweit produktrelevant,
   - Haftungs-/Nutzungsbedingungen für Aggregator-/Affiliate-/Provider-Modell,
   - Gerichtsstand/anwendbares Recht nur als freizugebender Legal-Input, niemals erfinden.
5. Trenne AP-6a strikt von AP-6b:
   - keine Consent-Persistenz,
   - kein Export,
   - keine Kontolöschung,
   - keine neue DB-/RLS-/Identity-Architektur.
6. Aktualisiere Current-State-/Roadmap-/Handoff-/Decision-Evidence nur soweit nötig, damit AP-5 als vollständig integriert und AP-6a Gate 0 als aktueller Slice korrekt erkennbar ist.
7. Erstelle Status + Handoff + adversarial Self-Review + ADR/Decision-Nachtrag, wenn der bestehende Standard dies verlangt.
8. Definiere klar den danach nötigen Product-Owner-/Legal-Gate-Entscheid. Das Ergebnis muss so konkret sein, dass der Technical Lead dem Product Owner nur die tatsächlich fehlenden/freizugebenden Legal-Inputs vorlegen muss.

## 3. Hard Non-Scope

- Keine erfundenen oder automatisch als rechtskonform bezeichneten AGB/Datenschutzerklärungen.
- Keine produktiven Legal-Seiten mit substantivem Rechtstext ohne explizite Product-Owner-/Legal-Freigabe.
- Keine Consent-Tabelle oder andere Migration.
- Kein RLS/Ownership/Identity/Auth/MFA/AAL-Change.
- Keine Service Role.
- Kein Account-Export/Kontolöschung.
- Kein AP-7 / Traveller Registry.
- Keine Provider-live-Aktivierung, Secrets, Verträge oder paid calls.
- Keine Payments-/Subscription-Live-Arbeit.
- Kein Public Indexing, Domain Cutover, App-Store oder Branch Protection.
- Keine Kosten.

## 4. Truth- und Security-Regeln

- Repository-/Live-Evidence gewinnt vor alten Docs.
- Kein Firmen-/Rechts-/Datenverarbeitungsfakt darf aus Vermutung entstehen.
- `unknown` bleibt `unknown`.
- Legal Copy darf technische Product Truth nicht überbehaupten.
- Sensitive Traveller-/Document-Daten dürfen nicht in öffentliche Analytics-/Marketing-/Discovery-Flächen gelangen.
- Noindex bleibt bis zum ausdrücklichen Public-Indexing-Gate bestehen.

## 5. Acceptance für Gate 0

Gate 0 ist PASS-fähig, wenn:

1. die beiden aktuellen 404-Routen als Live-Defekt belegt und deren technische Call-Sites vollständig inventarisiert sind;
2. der kleinste Runtime-Vertrag für beide Seiten vollständig definiert ist;
3. alle benötigten Legal-Inputs als `belegt`, `fehlend`, `unknown` oder `PO/Legal approval required` klassifiziert sind;
4. keine Rechtstexte erfunden wurden;
5. AP-6a/AP-6b-Grenze eindeutig ist;
6. keine DB/Auth/RLS/Provider/Payment/Public-Launch-Grenze verletzt wurde;
7. Continuity den tatsächlichen Post-AP-5-Stand korrekt wiedergibt;
8. lokale/relevante Repo-Gates grün sind;
9. Agent-Self-Review abgeschlossen ist und der Agent anschließend STOP für unabhängigen Technical-Lead Exact-Head-Review macht.

## 6. Agent Governance

- Frische logische Generation: `Account plattform audit vorbereitung 16`.
- Derselbe Agent behebt unmittelbare Review-Funde dieses Slices.
- Cursor setzt niemals Ready und merged niemals.
- Jeder neue Push invalidiert vorherige Gates.
- Kein AP-6a Runtime-Slice, kein AP-6b und kein AP-7 aus diesem Agenten starten.
