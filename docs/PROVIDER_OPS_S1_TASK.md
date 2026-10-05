# Jetnity – Provider Readiness S1: Shared Operational Contract

Stand: 24. August 2026
Status: **IMPLEMENTIERUNGSAUFTRAG / Draft-Workstream / kein Mark Ready / kein Merge**
Branch: `feat/provider-ops-s1`
Base: `main` @ `e4f4cca75e55028fab231c1827abf6236ae30eec`
Quelle: unabhängiger Technical-Lead-Review von Provider-Readiness PR #45 (`audit/provider-readiness`, Exact Head `172ff5ebec5969c56217f3d900708ff46970cb36`)

## 0. Auftrag

Implementiere **nur PR-S1 – Shared Operational Contract** aus dem Provider-Readiness Audit.

Ziel ist eine kleine gemeinsame Operationsschicht für Provider-nahe Serverpfade, ohne Fachdomänen, Truth-Modelle oder Provideradapter zusammenzulegen.

Der bestehende Cursor-Agent **„Jetnity provider readiness audit“** soll diesen Workstream fortsetzen. Vor Implementierung muss er den Audit auf Branch `audit/provider-readiness` lesen, insbesondere:

- `docs/PROVIDER_READINESS_AUDIT.md`
- `docs/PROVIDER_READINESS_MATRIX.md`
- `docs/PROVIDER_READINESS_SHARED_CONTRACT_PROPOSAL.md`
- `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`

Zusätzlich verbindlich auf diesem Branch lesen:

- `AGENTS.md`
- `JETNITY_HANDOFF.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- relevante Provider-/Search-/Evaluate-Routen, Tests und bestehenden Domain-Hüllen

Wenn Audit-Dokumentation und aktueller Code inzwischen auseinanderliegen, gilt der **aktuelle Code**. Abweichungen dokumentieren; nicht raten.

---

## 1. Scope von S1

S1 führt nur einen **minimalen gemeinsamen Operationsvertrag** ein.

Er darf zentralisieren, was heute mehrfach kopiert oder bereits inkonsistent ist:

1. gemeinsame Provider-Outcome-/Failure-Grundtaxonomie für technische Providerzustände,
2. gemeinsame Request-Härtungs-Helfer,
3. gemeinsame Form für Kill-Switch-/Provider-Aktivierungszustand,
4. schmaler Observability-Event-Typ **ohne Persistenz und ohne Admin-UI**,
5. Cost-Guard-Interface plus heutige nicht-persistente Implementierungsform,
6. dünne Adaption bestehender Domains an diese Hüllen, soweit dies ohne Fach-/Truth-Änderung möglich ist.

Vorgesehener Arbeitsbereich: `lib/provider-ops/*` plus minimale Anpassungen in den bestehenden Domain-Routen/-Hüllen.

---

## 2. Verbindliche Architekturgrenze

### Erlaubt

- zentrale technische Statuswerte wie `ok`, `partial`, `empty`/`checked_empty`, `unavailable`, `timeout`, `invalid`, `rate_limited`, `error`, soweit bestehende Domainverträge sauber darauf abbildbar bleiben,
- gemeinsame JSON-Request-Härtung: Content-Type, Content-Length/Byte-Cap, Stream-Cap, `Retry-After`, `no-store`,
- gemeinsame Kill-Switch-Hilfen für bereits existierende Provider-Aktivierungsflags,
- gemeinsames Cost-Guard-Interface, das weiterhin fail-closed bleibt,
- bestehende In-Memory-Limits hinter eine gemeinsame technische Form bringen,
- Observability-Event **nur als Typ/Contract**, ohne Speicherung und ohne externe Plattform,
- Flights-Search auf dieselbe Request-Härtungsqualität wie Hotels/Activities/Truth-APIs heben,
- technische HTTP-/Failure-Parität herstellen, wenn dadurch keine fachliche Semantik verloren geht,
- gezielte Tests für die neue Hülle.

### Nicht erlaubt

- kein `UniversalProvider`,
- kein gemeinsames Offer-Schema für Flug/Hotel/Aktivität/Mobility/Rental,
- keine gemeinsame Search-Funktion,
- keine Vereinigung von Readiness, Safety und Seasonal,
- keine Änderung an kanonischer Route Truth,
- keine Änderung an Traveller-/Citizenship-/Document Truth,
- keine Änderung an Official-/Safety-/Seasonal-Evidence-Semantik,
- kein `FlugNachweis` in S1 – das ist **PR-S2**,
- kein Mobility-/Rental-Nachweis-Umbau – das ist **PR-S3**,
- keine Readiness-/Safety-/Seasonal-Operationsparität, die neuen fachlichen Datenfluss braucht – das ist **PR-S4**,
- keine Offer-Provenance/Freshness – **PR-S5**,
- keine persistente DB-Kostenschranke – **PR-S6**,
- keine Provider-Telemetrie-Persistenz und keine Admin-Health-Anbindung – **PR-S7**,
- keine Cache-/Lizenz-Vertragslogik – **PR-S8**,
- keine echte Providerintegration,
- keine neuen API Keys / Secrets,
- keine kostenpflichtigen Calls,
- keine Verträge,
- keine Production-Aktivierung,
- keine Production-Migration,
- keine DB-Migration in S1,
- keine RLS-/Auth-/MFA-/AAL-/Capability-Änderung,
- keine Account- oder Admin-Implementierung,
- keine neue laufende Infrastruktur oder Kosten.

---

## 3. Harte Product-Owner-Gates

Diese Freigabe gilt **nur für S1**.

Sie ist ausdrücklich **keine** Freigabe für:

- Mark Ready,
- Merge,
- Provideraktivierung,
- Secrets/API-Keys,
- Providerverträge,
- kostenpflichtige Provider-Calls,
- Production-Migration,
- persistente Cost-Guard-Migration,
- S2 oder spätere Slices.

**Kein Mark Ready und kein Merge ohne ausdrückliche aktuelle Freigabe des Product Owners.**

---

## 4. Pflichtdesign des Shared Contract

### 4.1 Outcome-/Failure-Grundtyp

Baue eine kleine gemeinsame technische Taxonomie, ohne Domainzustände zu verschlucken.

Gemeinsame technische Basisklassen dürfen sein:

- `ok`
- `partial`
- `empty`
- `checked_empty`
- `unavailable`
- `timeout`
- `invalid`
- `rate_limited`
- `error`

**Nicht** in diesen Basistyp pressen:

- Readiness `recheck_needed` / `insufficient_context`,
- Seasonal `rejected_acute`,
- andere fachliche Domainzustände.

Bestehende öffentliche Response Contracts dürfen nicht unnötig gebrochen werden.

### 4.2 Request-Härtung

Stelle eine wiederverwendbare serverseitige JSON-Request-Hülle bereit, mindestens:

- nur `application/json` akzeptieren,
- optionalen Content-Length-Precheck,
- echtes Byte-Limit auch ohne Content-Length,
- ungültiges JSON sauber unterscheiden,
- `413` für zu große Payloads,
- `415` für falschen Content-Type,
- `Retry-After` für Rate Limit,
- `cache-control: private, no-store` bzw. bestehende strengere Semantik,
- keine Request-Rohdaten in Logs/Fehlertexten.

Flights muss diese Härtung nach S1 besitzen. Bereits gehärtete Domains dürfen auf den gemeinsamen Helfer umgestellt werden, **nur wenn ihre bestehende Semantik und Tests erhalten bleiben**.

### 4.3 Kill-Switch-Form

Baue nur die gemeinsame technische Form.

Bestehende Fachflags bleiben fachlich getrennt, z. B. Flight/Hotel/Activity/Mobility/Rental.

S1 darf **keinen** bisher `null` bleibenden Readiness-/Safety-/Seasonal-Provider aktivieren und soll deren neue Flags nicht erzwingen, wenn dafür S4 vorgesehen ist.

Production bleibt fail-closed.

### 4.4 Cost-Guard-Interface

Baue einen gemeinsamen technischen Contract für Provider-Kosten-/Rate-Schutz.

S1 darf die bestehenden In-Memory-Limits dahinter abbilden.

Nicht bauen:

- DB-Tabelle,
- RPC,
- Service-Role-Kontingent,
- persistente globale Tageslimits.

Diese Lücke bleibt bewusst bis PR-S6 offen.

Der Contract soll später eine persistente Implementierung erlauben, ohne alle Domains erneut umzubauen.

### 4.5 Observability-Event-Typ

Nur Contract/Typ, keine Speicherung.

Erlaubte Metadaten:

- Domain,
- Provider-ID oder `null`,
- Operation (`search`, `evaluate`, `nachweis`),
- Outcome,
- Dauer in ms,
- Anzahl Ergebnisse / verworfene Ergebnisse als Zahlen,
- Rate-Limit-Hit,
- Timestamp.

Nicht enthalten:

- Tokens,
- Namen,
- Pass-/Dokumentdaten,
- genaue Reiserouten,
- Rohantworten,
- Preise,
- freie Request-Payloads.

### 4.6 HTTP-Semantik

Technische Provider-Zustände sollen cross-domain nicht willkürlich zwischen HTTP 200 und 504 divergieren.

Bevorzugte Form für orchestrierte Providerzustände:

- Domainstatus im Body,
- HTTP 200 für sauber orchestrierte Provider-`timeout`/`unavailable`/`partial`-Antworten,
- HTTP 429 für lokales/providerseitiges Rate Limit, sofern bestehender Client dies bereits sauber unterstützt,
- 400/413/415 für Request-Probleme,
- echtes 5xx nur für Jetnity-/Edge-/unbehandelte Systemfehler.

Wenn eine bestehende Domain absichtlich anders funktioniert und eine Änderung Public-Contract-Risiko erzeugt: **nicht still ändern**. Belegen und im Handoff als Restpunkt markieren.

---

## 5. Pflichtprüfungen am bestehenden Code

Vor Implementierung mindestens prüfen:

- `app/api/flights/search/route.ts`
- `lib/flights/rate-limit.ts`
- `lib/flights/zustand.ts`
- Hotels Request-/Rate-/State-Hüllen
- Activities Request-/Rate-/State-Hüllen
- Mobility Request-/Rate-/State-Hüllen
- Rental Cars Request-/Rate-/State-Hüllen
- Readiness/Safety/Seasonal nur als Kompatibilitätsbeweis, nicht für fachliche S4-Arbeit
- `lib/modell/kontingent.ts` nur als **späteres** persistentes Referenzmuster; nicht kopieren/aktivieren
- alle bestehenden Contract- und API-Schutztests

Zusätzlich prüfen, ob auf aktuellem `main` seit dem Audit neue Änderungen die Befunde überholt haben.

---

## 6. Sicherheitsanforderungen

- Kein Secret darf in Client-Code, Response, Test-Fixture oder Log gelangen.
- Kein Service Role in `lib/provider-ops` für S1.
- Keine sensible Nutzerdaten in Observability-Typen.
- Request-Härtung muss fail-closed sein.
- Rate Limit / Cost Guard darf bei internen Fehlern keinen bezahlten Provider-Call freigeben.
- Bestehende Auth-/Ownership-/RLS-Grenzen unverändert lassen.
- Öffentliche Guest-Suche wird in S1 nicht grundlegend zum Auth-Feature umgebaut.

---

## 7. Kosten

S1 darf **keine neuen laufenden Kosten** erzeugen.

Keine neue externe SaaS-/Monitoring-Lösung.
Keine Live-Provider-Calls.
Keine kostenpflichtigen Tokens.
Keine neue bezahlte Infrastruktur.

Wenn eine technische Lösung zusätzliche laufende Kosten benötigen würde: stoppen und Product Owner fragen.

---

## 8. Tests / Gates

Vor Abschluss mindestens:

1. neue Unit-/Contract-Tests für `lib/provider-ops/*`,
2. Request-Hardening-Grenztests:
   - falscher Content-Type,
   - zu große Payload mit Content-Length,
   - zu große gestreamte Payload ohne Content-Length,
   - kaputtes JSON,
   - gültiges JSON,
3. Rate-Limit-/Retry-After-Regressionen,
4. bestehende Flight-/Hotel-/Activity-/Mobility-/Rental-Contract-Tests,
5. Readiness/Safety/Seasonal relevante Regressionen unverändert grün,
6. gesamtes `npm test`,
7. Typecheck,
8. Lint,
9. Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:schema-bezug` soweit im Repo vorhanden),
10. Production-Build,
11. API-Schutzcheck,
12. GitHub Actions auf **Exact Head** SUCCESS,
13. Vercel Preview auf **demselben Exact Head** READY.

Wenn UI nicht verändert wird, ist kein neuer visueller Produktslice erforderlich. Falls durch unerwartete Scope-Drift UI-Dateien betroffen wären: stoppen und neu bewerten.

Grüne Gates sind **keine** Mark-Ready- oder Merge-Freigabe.

---

## 9. Dokumentation / Handoff

Am Ende anlegen/aktualisieren:

- `docs/PROVIDER_OPS_S1_STATUS.md`
- `docs/PROVIDER_OPS_S1_HANDOFF.md`
- `ARCHITECTURE.md`, falls die gemeinsame Operationsschicht real eingeführt wurde,
- `DECISIONS.md` mit eigenem ADR für die minimale gemeinsame Provider-Ops-Grenze,
- `ROADMAP.md` nur soweit der S1-Stand korrekt eingeordnet werden muss,
- `JETNITY_HANDOFF.md` / `docs/ACTIVE_WORK_STATUS.md` nur nach Sync mit aktuellem `main`, ohne fremde Account-/Admin-/Provider-Statuszeilen zu überschreiben.

Handoff muss mindestens enthalten:

- Exact Runtime Head,
- alle Gate-Ergebnisse,
- geänderte Domains,
- bewusst unveränderte Domain-Truth,
- DB: keine Migration,
- Security-Auswirkungen,
- Kosten: keine neuen laufenden Kosten,
- offene P0/P1 aus PR #45, die S1 **nicht** schließt,
- klare Empfehlung für den nächsten unabhängigen Technical-Lead-Review.

---

## 10. Parallelitätsregeln

S1 besitzt nur die gemeinsame Provider-Ops-Hülle und die dafür notwendigen dünnen Domain-Adaptionen.

Nicht parallel in S1 anfassen:

- Account AP-* Shared Contracts,
- Admin System Health / Capability / Billing / Support,
- Route Truth,
- Traveller Registry,
- Readiness Official Truth,
- Safety/Seasonal Fact Truth,
- DB/RLS/Service-Role-Arbeit.

Wenn ein Konflikt mit einem inzwischen weitergezogenen Account/Admin-Branch entsteht: aktuellen `main`-Stand sauber synchronisieren und die fremde Arbeit bewahren. Nicht überschreiben.

---

## 11. Stop-Kriterien

Agent stoppt und fragt den Technical Lead, wenn:

- S1 eine DB-Migration zu benötigen scheint,
- ein bestehender Public API Contract nur mit Breaking Change vereinheitlicht werden kann,
- neue Secrets oder externe Infrastruktur erforderlich scheinen,
- eine Änderung an Route-/Traveller-/Official-/Safety-/Seasonal-Truth nötig scheint,
- `FlugNachweis` oder andere S2+ Arbeit nötig wird,
- Account/Admin-Dateien fachlich geändert werden müssten,
- Kosten entstehen würden.

---

## 12. Abschlusszustand

Erlaubter Abschluss:

**S1 implementiert, lokal + Exact Head gegatet, Draft-PR wartet auf unabhängigen ChatGPT/Technical-Lead-Review.**

Nicht erlaubter Abschluss:

- Mark Ready,
- Merge,
- Start von S2,
- Provideraktivierung,
- Production-Migration.

Nach Agent-Abschluss führt ChatGPT/Technical Lead den unabhängigen Review durch. Erst danach entscheidet der Product Owner über den nächsten Schritt.
