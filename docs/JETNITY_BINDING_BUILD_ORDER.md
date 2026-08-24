# Jetnity – verbindliche Build-Reihenfolge

Stand: **25. August 2026**  
Status: **Product-Owner-verbindliche Reihenfolge für alle neuen Chats, Technical Leads und Cursor-Agenten**

## Zweck

Dieses Dokument legt verbindlich fest, **was Jetnity als Nächstes baut, in welcher Reihenfolge und mit welchen Zuständigkeiten**. Neue Chats und Agenten dürfen nicht anhand veralteter Handoffs eine andere Reihenfolge erfinden.

Vor jeder konkreten Aktion trotzdem GitHub/CI/Vercel/Supabase live verifizieren. Historische Dokumente bleiben Evidence ihres damaligen Zeitpunkts, dürfen diese aktuelle Product-Owner-Reihenfolge aber nicht überschreiben.

## Harte Grundregel

> **Erst die bereits gebauten Reise-Domänen zu einer einfachen, zusammenhängenden Reiseerfahrung verbinden. Danach die tiefen Account-/Traveller-/Provider-/Admin-Fähigkeiten vervollständigen. Erst danach Homepage, kommerzielle Schicht und abschließende Production-Härtung.**

Kein Workstream darf still einen späteren Block vorziehen, wenn dadurch Shared Contracts, Wahrheit, UX-Konsistenz oder Integrationsreihenfolge gefährdet werden.

---

## 1. Trip Workspace vollständig fertigbauen – höchste Priorität

Verantwortlicher bestehender Agent: **`Trip workspace audit architecture`**.

Aktiver erster Slice: **TW-1 – Shell & Geräteparität / PR #56**.

Verbindliche interne Reihenfolge:

1. **TW-1 – Shell & Geräteparität**
   - Desktop verliert die Reise-Ebene nicht.
   - Mobile und Desktop nutzen dieselbe grundlegende Produktlogik.
   - Bestehende Flight-/Hotel-/Activities-/Mobility-Funktionen bleiben erreichbar.
2. **TW-2 – Reiseübersicht**
   - Nutzer versteht in wenigen Sekunden: Wo steht die Reise? Was ist geplant? Was fehlt?
   - Eine Reise statt einer Domain-Galerie.
3. **TW-4 – „Jetzt wichtig“ / Aufmerksamkeit**
   - vorhandene Readiness-, Einreise-, Safety-, Timing-/Seasonal- und Coverage-Signale sinnvoll priorisieren.
   - keine neue Wahrheit erfinden; `unknown` bleibt `unknown`.
4. **TW-3 – Timeline**
   - Etappen, Tage, Flüge, Hotels, Aktivitäten, Transfers und weitere Reisebestandteile in eine verständliche zeitliche Reiseansicht bringen.
5. **Item-/Gap-Details on demand**
   - Details erst bei Bedarf; Kernansicht bleibt kompakt.

Wichtig: TW-1 gibt **nicht** automatisch TW-2/TW-4/TW-3 frei. Jeder Slice bleibt ein eigener kontrollierter Auftrag mit Self-Review, Exact-Head-Gates, unabhängigem Technical-Lead-Review und PO-Gates.

**Homepage-Arbeit wird während dieses Kernblocks nicht vorgezogen.**

---

## 2. Traveller-/Pass-/Multi-Citizenship-System vervollständigen

Foundation E / Traveller Context ist bereits vorhanden und darf **nicht neu gebaut** werden. Kanonische Grundlage bleibt:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Noch zu vervollständigen ist die **produktweite Account-/Traveller-Registry- und Dokument-Lifecycle-Schicht** sowie ihre konsequente Nutzung in relevanten Funktionen.

Dazu gehören insbesondere:

- mehrere Reisende pro Reise;
- mehrere Staatsbürgerschaften pro Reisendem;
- mehrere Pässe/Reisedokumente/Credentials pro Reisendem;
- Gültigkeit und Dokumentstatus;
- kontextabhängige Auswahl des vorteilhaften/zulässigen Dokuments für Einreise, Transit und andere relevante Funktionen;
- keine stille Ableitung der Staatsbürgerschaft aus Residence, Standort, Sprache, Domain oder Abflugland;
- Official-/Regulatory-Funktionen dürfen ohne ausreichende Traveller-Daten nicht so tun, als sei die Wahrheit bekannt.

Primär zuständiger bestehender Agent für Account-/Registry-Teile: **`Account plattform audit vorbereitung`**. Shared Traveller-/Identity-Verträge bleiben Technical-Lead-gesteuert.

---

## 3. Account Platform vollständig weiterführen

Verantwortlicher bestehender Agent: **`Account plattform audit vorbereitung`**.

AP-1 bis AP-3 sind integriert. Danach bleibt der vollständige Account-Plan offen. Verbindliche Fortsetzung nach den nötigen Shared Gates:

- AP-4 kontrolliertes Archivieren / `trips.status`-Lifecycle;
- AP-5 tiefere Security: Passwort, Sessions/Geräte, Logout-all, MFA-Step-up soweit technisch unterstützt;
- AP-6 Privacy: Legal sowie Consent/Export/Löschung;
- AP-7 Account Traveller Registry;
- AP-8 Reiseprofil / Präferenzen;
- AP-9 Favoriten;
- AP-10 Buchungs-/Reservierungsübersicht;
- AP-11 Notifications;
- AP-12 Subscription-/Entitlement-Grundlage ohne stilles Finance-Live.

Kein Shared Auth/RLS/Identity/Traveller/Privacy/Billing-Vertrag wird still erweitert. Wenn ein AP-Slice einen Shared Contract benötigt, STOPP und Technical-Lead-Gate.

---

## 4. Provider Readiness S4–S8, danach echte Provider

Verantwortlicher bestehender Agent: **`Jetnity provider readiness audit`**.

S1–S3 sind Grundlage. Danach verbindlich:

1. **S4 – Truth-Domain Operations Parity**
2. **S5 – Commercial Provenance**
3. **S6 – persistenter Cost Guard**
4. **S7 – Observability / ehrliche Health Hooks**
5. **S8 – Cache-/Lizenz-/Freshness-Hooks mit sicheren Defaults**

Erst nach S1–S8 und jeweils separaten Provider-Gates beginnt die reale provider-backed Phase:

- Auswahl konkreter Provider je Domain;
- Verträge/Lizenzen;
- Secrets/API-Keys;
- Datenschutz/Security;
- Kostenkontrolle;
- Live-Preis/Verfügbarkeits-/Booking-Link-Provenance;
- Aktivierung nur separat und ausdrücklich.

Keine Demo-/Fake-Preise, keine erfundene Verfügbarkeit, keine erfundenen Booking-URLs.

---

## 5. Admin Control Center D–K vollständig weiterführen

Verantwortlicher bestehender Agent: **`Admin platform audit`**.

Admin A–C sind integriert. Danach bleibt der komplette Admin-Plan offen:

- D Security-/Audit-Hardening;
- E Support-Nutzer-/Reiseansicht, datensparsam und read-only wo vorgesehen;
- F Command Palette / Admin-Produktivität;
- G Finance Readiness;
- H Infomaniak read-only / Least Privilege;
- I Copilot Pro als Analyst über echte Evidence, keine kritische Execute-Autonomie;
- J Analytics / SEO ohne Demo-Charts;
- K Live-Integrationen wie Ads/Bexio/Payment-Ingest nur als getrennte Verträge/Gates.

### Verbindlicher Billing-/Refund-P1

Vor Finance-/Payment-Live muss der bekannte lokale Refund-Integritätsblock geschlossen werden: atomar, idempotent, concurrency-safe, mit sauberer Payment-Existenz-/Betragsprüfung und Auditbezug. Kein stiller Übergang von „lokaler Notiz“ zu echter Provider-Geldbewegung.

---

## 6. Homepage neu auf den fertigen Reisekern ausrichten

Die Homepage kommt **nach dem zentralen Trip-Workspace-Kern**, nicht vorher.

Ziel:

- sehr klarer Einstieg statt Funktions-/Domain-Wand;
- Reise entdecken, suchen, planen oder bestehende Reise fortsetzen;
- Jetnity als eine zusammenhängende Reiseplattform zeigen;
- Mobile-first und ohne unnötige Komplexität.

Mindestens TW-2 und TW-4 müssen stabil genug sein, bevor die Homepage endgültig auf die neue Produktlogik ausgerichtet wird.

---

## 7. Kommerzielle Produktschicht vervollständigen

Danach wird Jetnity zu einer belastbaren kommerziellen Vergleichs-/Assistenzplattform ausgebaut:

- echte Preise und Verfügbarkeit;
- mehrere Provider vergleichen;
- nicht nur billigster Preis, sondern Preis vs. Zeit, Komfort und Gesamtnutzen;
- Affiliate-/Deep-Link-Provenance;
- Attribution/Tracking;
- Einnahmen-/Provisionserfassung;
- Subscription-/Entitlement-Anbindung;
- klare Trennung zwischen Jetnity-Erklärung und Provider-/Regulatory-Truth.

Jetnity bleibt standardmäßig Aggregator/Assistant/Planner und nicht still ein Direct Booker.

---

## 8. Abschließende Production-Härtung vor breitem Launch

Vor echter produktionsreifer Technical Closure / öffentlichem breitem Launch müssen u. a. geschlossen sein:

- vollständige E2E-/Regression-/Browser-/Mobile-Acceptance;
- Security-/Privacy-Abnahme;
- Backup/Restore/Disaster-Recovery;
- Monitoring/Observability;
- globale Rate-/Cost-Limits;
- Performance;
- Accessibility;
- Secrets-/Least-Privilege-/Audit-Hygiene;
- Release-/Rollback-Prozess;
- Branch Protection / Required Checks für `main` technisch umsetzen;
- Production-Migrationen und Provideraktivierungen jeweils separat belegen.

Grüne CI allein bedeutet nicht Product-/Production-Korrektheit.

---

## Parallelisierungsregel

Während eines großen zentralen Integrationsblocks arbeiten nicht automatisch alle Agenten parallel.

Aktuelle Grundregel:

- **`Trip workspace audit architecture`** führt den aktiven Trip-Workspace-Slice aus.
- **`Account plattform audit vorbereitung`** wartet, bis ein neuer kontrollierter Account-/Traveller-Auftrag erteilt wird.
- **`Jetnity provider readiness audit`** wartet, bis ein neuer kontrollierter Provider-Auftrag erteilt wird.
- **`Admin platform audit`** wartet, bis ein neuer kontrollierter Admin-Auftrag erteilt wird.

Der Technical Lead darf konfliktarme Parallelität vorschlagen, aber **keinen späteren Shared-/kritischen Block still vorziehen**. Jeder neue Auftrag muss den Agenten **namentlich** nennen.

---

## Governance – immer gültig

- Kein Pull Request wird ohne ausdrückliche **aktuelle** Product-Owner-Freigabe auf Ready gesetzt.
- Kein Pull Request wird ohne danach **separate ausdrückliche aktuelle** Product-Owner-Freigabe gemergt.
- Production-DB-Migrationen sind ein separates Gate.
- Provideraktivierung, API-Keys/Secrets, Verträge und kostenpflichtige Calls sind separate Gates.
- laufende Infrastruktur-/Providerkosten über USD 100/Monat benötigen vorherige PO-Freigabe.
- Shared Auth / Identity / Sessions / MFA / AAL / RLS / Ownership / Guest→Account / Traveller / Route / Privacy / Billing / Admin Audit / Provider Activation bleiben seriell und Technical-Lead-gesteuert.
- Nach jedem Slice: Self-Review → vollständige Gates → Exact-Head-Evidence → unabhängiger Technical-Lead-Review → STOPP → PO-Entscheidung.
- Fortschritt, Entscheidungen, Blocker, Freigaben und exakter nächster Schritt müssen im Repository dokumentiert werden.
- ChatGPT/Cursor-Agenten müssen relevante P0/P1-Risiken und erhebliche bessere Lösungen proaktiv melden, dürfen Scope aber nicht still erweitern.
- `unknown` bleibt `unknown`; LLM/Erklärung ersetzt niemals regulatorische, Safety-, Preis-, Verfügbarkeits- oder Provider-Wahrheit.

## Regel für neue Chats

Ein neuer Chat muss vor Jetnity-Arbeit mindestens lesen bzw. live verifizieren:

1. `docs/JETNITY_BINDING_BUILD_ORDER.md` – **diese verbindliche Reihenfolge**;
2. `JETNITY_HANDOFF.md`;
3. `docs/ACTIVE_WORK_STATUS.md`;
4. `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md`;
5. den aktuell aktiven Slice-Task/Status/Handoff/Review;
6. aktuellen GitHub-`main`, PR-Status, CI/Vercel und bei DB-relevanter Arbeit Supabase.

Bei Widerspruch gilt: **aktuelle Product-Owner-Entscheidung + live verifizierter Repository-Stand + dieses Dokument** vor älterer historischer Evidence, solange keine neuere ausdrückliche Product-Owner-Entscheidung diese Reihenfolge ändert.
