# Jetnity V1 – Release Readiness Gate

Stand: 1. September 2026  
Status: **PRODUCT-OWNER BINDING / PUBLIC-LAUNCH GATE / FAIL CLOSED**

## Grundsatz

Das Schließen aller Phase-1-Feature-Issues autorisiert keinen Public Launch.

Jetnity V1 darf öffentlich freigegeben werden, wenn die Phase-1 Definition of Done erfüllt ist **und** dieser Gate als eigener versionierter Release-Readiness-Prozess vollständig PASS erhält.

> **Kein unbelegtes PASS. Unknown bleibt Gate-offen.**

Ein Gate kann `PASS`, `FAIL`, `BLOCKED` oder `NOT_APPLICABLE` sein. `NOT_APPLICABLE` braucht eine begründete Technical-Lead-Entscheidung. Ein V1-kritisches `unknown` ist kein PASS.

## A. Product Definition of Done

- vollständige Phase-1-Kern-User-Journey nachgewiesen;
- keine V1-kritische Demo-/Fixture-/Placeholder-Wirkung;
- V1-spezifische Product DoD vollständig geprüft;
- Phase-2/3-Funktionen werden nicht versehentlich als Launchvoraussetzung geführt;
- offene Produkt-Exceptions sind explizit vom Product Owner entschieden.

## B. Security

Mindestens:

- unabhängiger Security Review;
- Supabase RLS/Ownership für alle privaten V1-Daten;
- Auth- und Session-Flows;
- MFA/AAL für die dafür vorgesehenen Bereiche;
- Admin-AAL2 und Capability-Grenzen;
- keine Service-Role-/privilegierte Client-Leaks;
- Secrets nur serverseitig und environment-richtig;
- keine offenen kritischen Security Advisories;
- Rate-Limit/Missbrauchs-/Cost-Pfade geprüft;
- sensitive Traveller-/Document-Daten minimiert;
- Security Advisor / relevante Supabase Advisories geprüft;
- offene P0/P1 = 0; relevante Security-P2 bewusst entschieden/geschlossen.

## C. Privacy / Legal / Compliance

- Schweizer DSG geprüft;
- DSGVO soweit relevant geprüft;
- Datenschutzerklärung realer V1-Funktion entsprechend;
- AGB/Terms realer V1-Funktion entsprechend;
- Cookie/Tracking/Consent-Verhalten korrekt;
- Datenexport/-löschung und Retention soweit rechtlich/produktseitig erforderlich;
- Privacy-by-default für Traveller-/Trip-Daten;
- kein Passscan/MRZ/Biometric/Health-Speicher ohne eigenes genehmigtes Gate;
- Provider-DPAs und Subprocessor-/Transferfragen soweit erforderlich geklärt;
- keine erfundenen Legal-Texte als Production-Lösung.

## D. Provider / Commercial / Licensing

Für jeden V1-Liveprovider:

- Product-Owner-Providerwahl freigegeben;
- Vertrag/Partnerstatus geklärt;
- DPA geklärt;
- API-/Affiliate-Bedingungen geprüft;
- Caching/Persistenz/Redistribution/Lizenzbedingungen eingehalten;
- Attribution/Branding/Deep-Link-Regeln eingehalten;
- Secret-/Credential-Rotation dokumentiert;
- Kostenmodell und harte Caps geprüft;
- Kill Switch funktionsfähig;
- reale Server-Evidence statt Fixtures;
- Provider-Ausfall-/Timeout-/Rate-Limit-Fälle getestet;
- kein öffentlicher Claim über nicht live verfügbare Provider.

## E. Entry Requirements / Official Truth

- aktive Hard-Truth-Quellen sind offiziell/belastbar;
- Source URLs/Authorities nachvollziehbar;
- Retrieval/Freshness bounded;
- stale/unavailable/unknown fail closed;
- Multi-Citizenship/Multi-Document E2E geprüft;
- Transitfälle geprüft;
- Credential-Wechsel geprüft;
- zeitliche Regeln nur mit belastbarer Event-/Timezone-Evidence;
- Official Action Links sicher und als official/information/third-party korrekt klassifiziert;
- Provider-/LLM-Ausfall erzeugt keine falsche `not_required`-Aussage.

## F. Production Configuration

- Vercel Production-Konfiguration geprüft;
- Supabase Production-Konfiguration geprüft;
- migrationsbezogener Live-Stand inventarisiert;
- jede freigegebene Migration exakt und reproduzierbar;
- Development/Preview/Production-Trennung geprüft;
- Production Flags/Kill Switches stimmen mit realem Launch-Scope überein;
- keine Preview-/Test-Tokens als Production Truth;
- Canonical Domains/Redirects/HSTS/CSP und relevante Web-Security-Konfiguration geprüft;
- Public Indexing/robots/sitemap erst nach eigenem Launch-/Discoverability-Gate korrekt aktiviert.

## G. Monitoring / Logging / Alerting

- technische Fehler sichtbar;
- Provider Health sichtbar;
- Kosten-/Quota-Alerts vorhanden;
- auth-/security-relevante Events sichtbar;
- Commercial-/Revenue-Pipeline ausreichend beobachtbar;
- keine Secrets/PII in Logs;
- Alert Ownership und Eskalation definiert;
- Incident-Erkennung funktioniert auch bei Partial Failure.

## H. Backup / Recovery / Incident

- Supabase Backup-/Restore-Fähigkeit geprüft;
- Recovery-Verfahren dokumentiert und soweit möglich getestet;
- Migration-/Rollback-/Forward-Fix-Strategie vorhanden;
- Vercel Rollback-/Deployment-Recovery geprüft;
- Provider-Kill-Switch-Verfahren dokumentiert;
- Incident-Prozess mit Verantwortlichkeit vorhanden;
- kritische User-/Trip-Datenverlust-Szenarien bewertet.

## I. Analytics / Conversion / Revenue

- produktive Events versioniert und wahrheitsgetreu;
- Consent-Grenzen eingehalten;
- Activation der Kernjourney messbar;
- reale Booking-/Affiliate-Handoffs messbar;
- Conversion und Revenue Attribution ausreichend nachvollziehbar;
- `unknown` Attribution bleibt unknown;
- keine erfundenen Revenue-/Conversion-Dashboards;
- Monitoring kann fehlerhafte Tracking-/Attribution-Pipelines erkennen.

## J. Performance / Accessibility

- relevante Core Web Vitals / serverseitige Latenzen geprüft;
- Providerpfade besitzen Timeouts und kontrollierte Retries;
- keine unbounded Response-/Request-Pfade;
- Accessibility der Kernjourney geprüft: Keyboard, Focus, Labels, Status, Kontrast, Screenreader-relevante Semantik;
- keine V1-kritischen Performance-/Accessibility-P0/P1;
- realistische mobile Netzbedingungen berücksichtigt.

## K. Mobile / Browser / PWA QA

Mindestens aktuelle unterstützte Kombinationen aus:

- iPhone/Safari;
- Android/Chromium;
- Desktop Safari/Chromium und weitere vom TL als V1-relevant eingestufte Browser;
- kleine/typische/large mobile Viewports;
- Orientation/Touch/Keyboard;
- PWA Installability und definierter Offline-/Stale-Scope, falls als V1-Funktion geführt.

Die komplette Kern-User-Journey muss auf realen oder realitätsnahen Geräten geprüft sein; reine Component Screenshots genügen nicht.

## L. End-to-End / Failure / Concurrency

- Guest→Account E2E;
- Multi-Destination/Transit E2E;
- Multi-Traveller/Multi-Citizenship/Multi-Document E2E;
- Flight/Hotel/Activity reale Providerpfade;
- Provider-Ausfall während Search/Selection/Adoption;
- Entry Requirements Provider-Ausfall/Stale;
- Trip-/Flight-/Route-/Traveller-Änderung und Readiness-Reevaluation;
- parallele Writes / Idempotency / Race Conditions für kritische Pfade;
- grundlegende Load-/Concurrency-Tests für Launch-relevante APIs;
- Rate-Limit-/Quota-/Cost-Guard-Verhalten.

## M. Support / Operations

- Support-Kanal und Zuständigkeit definiert;
- notwendige Admin-Nutzer-/Trip-Sicht datensparsam verfügbar;
- bekannte Issues/Incidents nachvollziehbar;
- Provider-/Commercial-/Security-Incident-Runbooks ausreichend;
- keine Support-Funktion benötigt unkontrollierten direkten Production-DB-Zugriff.

## N. Release / Launch Control

Bevorzugte Reihenfolge:

1. **Private Alpha Gate** – interne reale Reisen / kontrollierte Nutzer;
2. **Closed Beta Gate** – begrenzte externe Schweizer Nutzer, Support/Telemetry aktiv;
3. **Swiss Public Launch Gate** – nur nach stabiler Beta-Evidence;
4. Stabilisierung/Product Learning;
5. DACH und weitere Märkte jeweils mit eigener Market Readiness.

Public Launch erfordert eine ausdrückliche Product-Owner-Freigabe. Technisches PASS allein veröffentlicht Jetnity nicht.

## O. Final blocker rules

Public V1 Launch ist blockiert bei:

- irgendeinem offenen P0;
- offenem P1 in Kernreise, Security, Privacy, Truth, Data Integrity, Provider/Payment oder Reliability;
- releasekritischem P2 ohne dokumentierte Risk Acceptance;
- ungeklärtem Providervertrag/Lizenz-/DPA-Gate;
- fehlender Legal-/Privacy-Freigabe;
- nicht belegter Production-Konfiguration;
- ungetestetem realem Provider-/Official-Truth-Pfad;
- unbegrenztem Kostenpfad;
- fehlendem Backup/Recovery-/Incident-Grundschutz;
- künstlichen Demo-/Fixture-Daten in einer V1-Hard-Truth-Fläche.

## P. Gate-Artefakt vor Launch

Der finale Gate-Lauf muss selbst versioniert mindestens enthalten:

- exact `main` SHA;
- Vercel Production Deployment;
- Supabase Production Evidence;
- CI/Test-/Browser-/Device-/Security-Evidence;
- Provider-/Contract-/License-Matrix;
- offene Risk Matrix;
- PASS/FAIL je Abschnitt A–O;
- Technical-Lead Final Verdict;
- ausdrückliche Product-Owner Public-Launch-Freigabe.

Erst danach gilt:

> **JETNITY V1 – PRODUCTION READY FOR REAL TRAVELLERS.**
