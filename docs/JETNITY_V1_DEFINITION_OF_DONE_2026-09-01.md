# Jetnity V1 – Definition of Done

Stand: 1. September 2026  
Status: **PRODUCT-OWNER BINDING / PHASE-1 EXIT CONTRACT**

## Grundsatz

Jetnity V1 ist nicht fertig, weil alle vorgesehenen Feature-Issues geschlossen sind.

V1 ist fachlich fertig, wenn ein echter Reisender die vollständige Phase-1-Kernreise zuverlässig durchführen kann und keine Kernfunktion ihre Wahrheit aus Demo-, Fixture-, Client-, LLM- oder unbelegter Provider-Evidence ableitet.

> **Feature Complete ≠ V1 Done.**

> **V1 Done = komplette Kern-User-Journey + belastbare Truth + interoperable Produktlogik + releasefähige Qualität.**

Der separate `JETNITY V1 RELEASE READINESS GATE` entscheidet anschließend, ob diese fachlich fertige V1 tatsächlich veröffentlicht werden darf.

## 1. Komplette Kern-User-Journey

Ein echter Nutzer kann ohne künstliche Demo-Abkürzungen:

1. Jetnity ohne Konto ausprobieren und eine Reise anlegen;
2. die Reise strukturiert speichern bzw. sauber Guest→Account übernehmen;
3. mehrere Destinationen/Etappen/Transit korrekt abbilden;
4. Traveller mit mehreren Staatsbürgerschaften und mehreren Credentials verwalten;
5. geeignete reale Flight-Optionen suchen und nachvollziehbar vergleichen;
6. mindestens eine reale Accommodation-Suche/-Weiterleitung nutzen;
7. Activities/Experiences in den konkreten Reisetag integrieren, soweit die Phase-1-Providerentscheidung dies einschließt;
8. reale Trip Items sicher in den Workspace übernehmen, ohne client-trusted Commercial Truth;
9. Entry Requirements für Route, Traveller und Credential-Option auf belastbarer Official Evidence verstehen;
10. notwendige Handlungen, offene Lücken und relevante Zeitfenster erkennen;
11. Reiseänderungen vornehmen und relevante Auswirkungen/Stale-/Recheck-Zustände erkennen;
12. den Trip Workspace auf Smartphone und Desktop zuverlässig verwenden;
13. relevante Destination Essentials erreichen;
14. geplante/besuchte Orte über die grundlegende World Map sehen;
15. vor und während der Reise eine klare, truth-aware Begleitung erhalten.

## 2. Trip / Workspace Done

- Reisegraph ist kanonische Reise-Truth.
- Multi-Destination und Transit gehen nicht verloren.
- Tage/Etappen/Trip Items sind konsistent und ohne konkurrierende Parallelmodelle.
- reale kommerzielle Auswahl ist provenance-/freshness-gesichert.
- Booking/selected/open/unknown Zustände sind ehrlich.
- TW-8-relevante Commercial Truth ist real integriert.
- TW-9-/V1-Polish ist abgeschlossen.
- zentrale Reiseänderungen erzeugen keine still veralteten Folgeaussagen.

## 3. Account / Traveller Done

- Guest→Account ist verlustarm und sicher.
- Ownership/RLS schützt alle privaten Trips und Traveller-Fakten.
- Account Registry und Trip Snapshot behalten getrennte Authority.
- mehrere Staatsbürgerschaften und Credentials bleiben Peer-Optionen.
- keine `documents[0]`, `evaluations[0]`, Default-/Primary-/Preferred-Credential-Truth.
- Residence wird nicht als Citizenship interpretiert.
- Issuer Country wird nicht als Citizenship interpretiert.
- sensible Daten werden nur gespeichert, wenn ausdrücklich benötigt und freigegeben.
- Phase-1-relevante Security-/Privacy-/Consent-/Lifecycle-Funktionen sind vollständig und verständlich.

## 4. Route / Transit / Temporal Done

- Origin, Destination, Zwischenziele und Transit werden vollständig berücksichtigt.
- relevante Events besitzen nur dann harte absolute Zeitpunkte, wenn lokale Zeit + Zeitzone + Eventbindung belastbar sind.
- Zeitänderungen können betroffene Readiness-Aussagen invalidieren/re-evaluieren.
- keine geratenen Deadlines.
- `available_from` / `due_at` / Now / Soon / Info werden nur aus belastbarer Semantik erzeugt.

## 5. Provider / Commercial Done

Mindestens:

- **Flights:** ein professioneller realer Providerpfad für V1;
- **Hotels:** ein professioneller realer Accommodation-Pfad für V1;
- **Activities:** ein professioneller realer Pfad, sofern nicht durch eine dokumentierte Product-Owner-Launch-Exception ausdrücklich aus V1 herausgenommen.

Für jeden aktiven V1-Provider gilt:

- server-only Secret/Transport;
- echte Preis-/Availability-Evidence;
- Provenance und Retrieval/Freshness;
- Failure/Timeout/Rate-Limit/Unavailable-Semantik;
- Kill Switch;
- persistente Cost Guard/operatives Limit, soweit erforderlich;
- Observability;
- sichere Trip-Übernahme;
- Lizenz-/Caching-/Attribution-Regeln eingehalten;
- Providerinteresse beeinflusst Jetnity-Ranking nicht still.

## 6. Entry Requirements / Readiness Done

Phase 1 deckt strukturiert mindestens ab, soweit für das Land/die konkrete Reise offiziell relevant:

- visa-free / klassisches Visum / Visa on Arrival / eVisa / eTA;
- Transitvisum / Transitgenehmigung;
- zulässiger Pass/ID;
- Pass-Mindestgültigkeit;
- freie Passseiten;
- Entry-/Arrival-/Health-Formulare;
- Impf-/Health-Dokument-Anforderungen ohne unnötige Speicherung persönlicher Health-Daten;
- Versicherungspflicht;
- Rück-/Weiterflugnachweis;
- Unterkunfts-/Buchungs-/Reisenachweise;
- finanzielle Mittel / Proof of Funds;
- weitere offiziell belegte Bedingungen.

Hard Truth Regeln:

- `unknown ≠ not_required`;
- `unavailable ≠ not_required`;
- `stale ≠ current`;
- LLM ≠ Official Truth;
- nur belastbare Official Evidence setzt Hard Truth;
- mehrere Credential-Optionen werden kontextuell und nachvollziehbar getrennt bewertet.

## 7. Assistant Done

- Generated Suggestions sind klar von Official/Provider Truth getrennt.
- Assistent kann keine Preise, Verfügbarkeiten oder Entry Rules erfinden.
- Assistent verwendet vorhandene Trip-/Traveller-/Readiness-Truth, statt konkurrierende Fakten zu erzeugen.
- mutationsrelevante Empfehlungen werden nicht still übernommen.
- Kosten- und Missbrauchsgrenzen sind production-tauglich.

## 8. Destination / Map / Mobile Done

- Destination Essentials sind bewusst begrenzt, aktuell, source-aware und praktisch.
- World Map zeigt mindestens geplante und besuchte Orte/Länder aus kanonischer User-/Trip-Truth.
- mobile Kernjourney ist vollständig bedienbar.
- PWA-Scope ist explizit definiert und für V1 erfüllt; Offline-/Cache-Daten dürfen Hard Truth nicht überschreiben.
- Native Apps sind kein V1-DoD-Kriterium.

## 9. Operations / Monetization Done

- Admin zeigt reale System-/Security-/Provider-/Kosten-/Incident-Zustände oder ehrlich `unknown/not_configured`.
- keine Fake-Dashboards oder Demo-KPIs.
- mindestens ein realer Affiliate-/Referral-/Booking-Handoff kann V1 grundsätzlich monetarisieren.
- Revenue Attribution und Conversion Measurement sind für reale V1-Umsätze ausreichend vorhanden.
- Cost Guards schützen Provider-/Modelkosten.
- ein erster schlanker **Premium-/Pro-Entitlement-Vertrag** ist definiert und technisch/produktseitig vorbereitet; falls Premium in V1 aktiviert wird, sind Paywall/Entitlement/Consent/Support sauber. Ein komplexes Multi-Tarif-Abo-System ist ausdrücklich kein V1-DoD-Kriterium.

## 10. Cross-Domain Done

Die Kernbereiche sind nicht nur einzeln korrekt, sondern interoperabel:

- Tripänderung ↔ Provider Items;
- Tripänderung ↔ Entry Requirements;
- Traveller/Credential-Änderung ↔ Readiness;
- Flight-/Route-/Zeitänderung ↔ Temporal Readiness;
- Guest→Account ↔ Traveller/Trip Truth;
- Commercial Item ↔ Workspace Coverage;
- Mobile/Desktop ↔ gleiche fachliche Ergebnisse.

Relevante stale/recheck/recompute-Folgen sind implementiert oder fail-closed sichtbar.

## 11. V1 Definition-of-Done Exit

V1 erreicht fachliches **DONE** erst, wenn alle V1-blockierenden Punkte dieser Datei nach Live-Evidence geschlossen sind und keine offenen P0/P1 bzw. releasekritischen P2 die Kernreise, Truth, Security, Privacy, Datenintegrität oder Reliability gefährden.

Danach – und nicht vorher – wird der separate `JETNITY V1 RELEASE READINESS GATE` final ausgeführt.
