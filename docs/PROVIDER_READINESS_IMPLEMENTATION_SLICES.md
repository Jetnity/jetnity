# Jetnity – Provider-Readiness Implementation Slices

Stand: 24. August 2026  
Status: **S1 und S2 auf `main`; Admin A–C und Account AP-3 auf `main` `8326e72f`; S3 auf `feat/provider-mobility-rental-evidence-s3` (ADR-0161, Current-Main-Sync) / kein Mark Ready / kein Merge**  
Quelle: `docs/PROVIDER_READINESS_AUDIT.md`, `docs/PROVIDER_READINESS_MATRIX.md`, `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md`

## 1. Zweck

Diese Slices schließen **Jetnity-seitige** Ports, Nachweise und Operationsverträge. Sie bauen **keine** echten Adapter, legen keine Secrets an, schließen keine Verträge und aktivieren keine Production-Provider.

Jeder Slice braucht einen eigenen versionierten Cursor-Auftrag, Tests und einen unabhängigen Review. Merge bleibt Product-Owner-Gate.

---

## 2. Reihenfolge

```text
Review dieses Audits
        │
        ▼
PR-S1  Shared Ops Contract          ← seriell, Technical Lead
        │
        ├───────────────┬──────────────────┐
        ▼               ▼                  ▼
PR-S2 FlugNachweis   PR-S4 Truth-Ops    PR-S8 License/Cache Hooks
        │               │
        ▼               │
PR-S3 Mobility/Rental Nachweis
        │               │
        └───────┬───────┘
                ▼
         PR-S5 Provenance an Optionen
                │
                ▼
         PR-S6 Persistenter Cost Guard   ← seriell, DB-/Kosten-Gate
                │
                ▼
         PR-S7 Observability / Health-Hooks
                │
                ▼
     später: echte Providerphase (eigener Block)
```

Account AP-1 (PR #43) und Admin Slice A (PR #44) bleiben parallel und unberührt.

---

## 3. Slices

### PR-S1 – Shared Operational Contract

**Ziel:** Minimalen Operationsvertrag einführen, ohne Fachdomänen zu mischen.

**Umfang:**

- gemeinsame Failure-Taxonomie und HTTP-Hüllen-Konvention
- Request-Härtung (Content-Type, Byte-Cap, `Retry-After`)
- Kill-Switch-Form
- Observability-Event-Typ ohne Payload
- Cost-Guard-**Interface** (noch In-Memory-Implementierung)

**Nicht:** Adapter, DB-Migration, Admin-UI, Nachweis-Logik, Ranking.

**Dateien (erwartet):** neues schmales `lib/provider-ops/*`; danach dünne Adapter in bestehenden `anfrage.ts` / `rate-limit.ts` / `zustand.ts`.

**Abhängigkeiten:** Audit-Review. Seriell unter Technical-Lead-Steuerung.

**Parallel:** nein. Andere Provider-Readiness-Slices warten auf die Typen oder kopieren sonst erneut.

**Tests:** Contract-Tests der Hülle; bestehende Domain-Suchtests müssen unverändert grün bleiben.

**Schwere, die er schließt:** PR-P1-03 teilweise; Grundlage für PR-P0-02, PR-P1-01, PR-P1-05.

---

### PR-S2 – FlugNachweis

**Ziel:** Flug-Kontoübernahme auf die Hotel-Grenze heben.

**Umfang:**

- `FlugNachweis` analog `HotelNachweis`
- Browser sendet nur `tripId`, `dayId`, `optionId`
- serverseitige Bestätigung gegen Suchkontext (Legs, Passagierzahlen, Kabine, Währung)
- Guest-Pfad: keine kommerzielle Provider-Persistenz ohne denselben Vertrag oder bewusstes fail-closed
- `booking_url` bleibt `null`

**Nicht:** Live-Duffel, Offer-Booking, Affiliate, Production-Flag.

**Abhängigkeiten:** PR-S1 Typen bevorzugt; kann Hotel-Muster folgen, darf aber nicht einen zweiten Nachweis-Stil erfinden.

**Parallel:** nach S1 ja, gegenüber S4/S8.

**Warum zuerst unter den kommerziellen Fixes:** Einziger bestehender Pfad, der Browser-Preise persistieren kann (P0).

**Tests:** Tampering (Preis/Zeit/Ref geändert), Kontext-Drift, unavailable, abgelaufen, keine Secrets in Fehlern, Route Truth bleibt Foundation D.

**Schwere:** schließt PR-P0-01.

---

### PR-S3 – Mobility- und Rental-Nachweis auf Hotel-Form

**Ziel:** Stubs durch async `nachweisen({ optionId, kontext })` ersetzen. Übernahme bleibt fail-closed, bis ein Adapter existiert.

**Status 24. August 2026:** Implementierung auf `feat/provider-mobility-rental-evidence-s3`, synchronisiert auf Current Main `8326e72f`. ADR-0161. Kein echter Adapter. Keine Migration.

**Umfang:**

- Interface-Upgrade
- Katalog-Doubles für Tests
- keine Auto-Aktivierung
- Mobility Auto-Search im Workspace **hinter ausdrückliche Nutzeraktion** gelegt (P1 Kostenleck geschlossen)

**Nicht:** Such-UI für Mietwagen, echter Adapter, Graph-Rewrite.

**Abhängigkeiten:** S1 Form; S2 als Qualitätsreferenz, nicht als Code-Kopie der Flugfelder.

**Parallel:** zu S2 und S4 nach S1.

**Schwere:** schließt PR-P1-04, PR-P1-07.

---

### PR-S4 – Truth-Domain Operationsparität

**Ziel:** Readiness und Safety auf das Safety/Seasonal-Operationsniveau bringen.

**Umfang:**

- `RequirementsProvider.evaluate(..., signal?)` + explizites Timeout
- `JETNITY_READINESS_AKTIV` / analoge Flags für Safety und Seasonal, solange Factory nicht mehr nur `null` ist
- Safety-API: Party nur aus **serverseitigem** Trip-Load, nicht aus Browser-Citizenship-Behauptungen
- Readiness Body-Cap prüfen (8 KB vs Multi-Traveller)

**Nicht:** Timatic-Adapter, Safety-Provider, Citizenship global verpflichtend machen, Seasonal traveller-abhängig machen.

**Abhängigkeiten:** S1 Kill-Switch- und Timeout-Form. Traveller-Truth bleibt Foundation E.

**Parallel:** zu S2/S3 nach S1. Party-Load darf Account-/Trip-Lesewege nur **lesen**, nicht neu modellieren.

**Schwere:** schließt PR-P1-05, PR-P1-06.

---

### PR-S5 – Provenance an kommerziellen Optionen

**Ziel:** `retrievedAt`, Währungsabgleich, sichtbares Stale.

**Umfang:**

- optionale Provenance-Felder am Offer-Typ
- Flights: `requestedCurrency` vs Duffel/`quotedCurrency`; Mismatch nicht als gleiche Wahrheit anzeigen
- persistierte Snapshots zeigen Zeitpunkt, nie „aktueller Preis“ ohne Nachweis
- keine stillen Preis-Updates im Graph

**Nicht:** Preisüberwachung, Reprice-Loop, Cache von Live-Offers.

**Abhängigkeiten:** S2 (sonst bleibt der gefährlichste Persistenzpfad ohne Zeitpunkt).

**Parallel:** nach S2; Hotels/Activities können Felder vorbereiten, solange Factories `null` bleiben.

**Schwere:** schließt PR-P1-02, PR-P1-08.

---

### PR-S6 – Persistenter Cost Guard

**Ziel:** Global wirksames Budget vor jedem bezahlten Provider.

**Umfang:**

- persistente Fenster-/Tageslimits, Vorbild `lib/modell/kontingent.ts`
- je Domäne + optionales Gesamtdach
- kein Secret im Client, keine Reiseinhalte im Zähler
- Preview darf In-Memory behalten, bis ein bezahlter Schlüssel existiert

**Nicht:** Provider kaufen, Production-Flags auf true, unbegrenzte Preview-Calls mit Live-Token.

**Abhängigkeiten:** S1 Interface. **DB-Migration und Kostenmodell sind eigene Product-Owner-Gates.**

**Parallel:** nein. Seriell, weil Schema/RLS/Service-Role.

**Schwere:** schließt PR-P0-02, PR-P1-09 (teilweise; Auth-vs-Guest-Modell bleibt Produktfrage).

---

### PR-S7 – Observability und ehrliche Health-Hooks

**Ziel:** Unterscheidbare Signale für späteres Admin System Health.

**Umfang:**

- schreiben der S1-Events (ohne sensible Payloads)
- read-only Ableitung: `unavailable` / `empty` / `partial` / `timeout` / `internal`
- keine Fake-Grün-Zustände
- Anschluss **nach** Admin Slice A; nicht in PR #44 mischen

**Nicht:** neues Monitoring-SaaS ohne Kostenfreigabe; Provider-Ping gegen Dritte.

**Abhängigkeiten:** S1; Admin Slice B-Diskussion. Seriell gegenüber Admin-IA.

**Schwere:** schließt PR-P1-01.

---

### PR-S8 – Cache- und Lizenz-Hooks

**Ziel:** Felder und Defaults, ohne Verträge zu erfinden.

**Umfang:**

- `cacheClass` / `persistClass` / `attributionRequired`
- Default `forbidden` / `no-store`
- Coverage-Notes bleiben domain-spezifisch

**Nicht:** Duffel-/Booking-/Timatic-Lizenztexte als Fakt.

**Abhängigkeiten:** S1. Kann parallel zu S2–S4 laufen.

**Schwere:** P2/P3 vor Aktivierung zum P1, sobald ein Vertrag vorliegt.

---

## 4. Explizit später – nicht in diesen Slices

| Arbeit | Warum später |
| --- | --- |
| Konkrete Adapter (Duffel Live, Booking.com, GYG, Timatic, Advisory, Climate) | Erst nach Anbieterwahl + Vertrag + Secret-Gate |
| Hotel/Activity/Mobility/Rental Mapping-Module | Ohne echten API-Vertrag erfunden |
| Rental-Such-UI | Erst wenn ein Anbieter und Nachweis stehen |
| Workspace Function-by-Function / `Jetzt wichtig` | Eigener Roadmap-Block nach Readiness-Slices |
| Account AP-2 / Admin Slice B | Eigene Aufträge; Health nur read-only andocken |
| Routing-/POI-/Monitoring-Ports | Inventarisiert, kein aktueller Aktivierungsblocker |
| Production-Migration, Live-Tokens, Kosten | Separate Product-Owner-Gates |

---

## 5. Parallelitätsregeln

| Darf parallel | Darf nicht parallel / nicht mischen |
| --- | --- |
| Dieser Audit (Docs) ↔ Account AP-1 ↔ Admin Slice A | Shared-Contract-Implementierung in AP-1/Slice A |
| S2 ↔ S3 ↔ S4 nach S1 | S6 mit irgendeiner Auth/RLS-Arbeit ohne Lead |
| S8 jederzeit nach S1 | Provider-Health-UI in Admin Slice A |
| Reviews der drei Draft-PRs | Ein Agent ändert kanonische Route-/Traveller-Truth „nebenbei“ |

Wenn ein Slice einen Shared-Contract-Fix braucht, der über S1 hinausgeht: stoppen, belegen, neuen Auftrag. Nicht still erweitern.

---

## 6. Definition of Done je Slice

Ein Slice ist technisch review-bereit, wenn:

- Scope nicht überschritten wurde
- TypeScript, relevante Tests, Build und Hygiene grün sind
- keine Factory von `null` auf einen echten Anbieter gedreht wurde
- Production-Flags unverändert fail-closed sind
- Dokumentation/Handoff/Active Status aktualisiert sind
- P0/P1, die der Slice schließt, mit Tests belegt sind

Review-bereit ist nicht Mark Ready und nicht Merge.

---

## 7. Empfohlener nächster operativer Schritt

1. S1 und S2 liegen auf `main`.
2. S3 läuft auf `feat/provider-mobility-rental-evidence-s3` / ADR-0161.
3. S4 startet nicht ohne neuen Auftrag und Technical-Lead-Review von S3.
4. Kein Mark Ready, kein Merge, keine Secrets, keine Provideraktivierung, keine Production-Migration.
