# Jetnity Admin Platform – Slice C: Provider- und Kostenboard

Stand: 24. August 2026  
Status: **IMPLEMENTATION TASK – Technical Closure / PASS auf Draft PR #49; wartet auf Product-Owner-Entscheidung zu Mark Ready**  
Verantwortlicher Cursor-Agent: **`Admin platform audit`**  
Branch: `feat/admin-provider-cost-board`  
Base: aktueller `main` `e3bad749c8e03512001e7bccd5e08467f10a7134` (Admin Slice B / PR #46 gemergt)  
Historische Stack-Basis: Admin Slice B `feat/admin-system-health` @ `83c66842e94bc4e7645a39269174397cb4b7eb3f`

## 1. Ziel

Slice C macht im bestehenden Admin Control Center zwei Dinge **ehrlich, read-only und source-backed** sichtbar:

1. den operativen Bereitschafts-/Schutzstand der provider-neutralen Provider-Ops-Schicht,
2. belegte Kosten-/Nutzungsinformationen, soweit Jetnity dafür bereits eine belastbare Quelle besitzt.

Das Board ist **kein Provider-Aktivierungscenter** und kein Finance-System. Es darf weder echte Reiseprovider einschalten noch Kosten, Health, Limits oder Geldbewegungen erfinden.

Der ursprüngliche Admin-Audit-Plan beschreibt diesen Slice als **Provider- und Kostenboard**: Kill-Switch-/Kostenwahrheit sichtbar machen, ohne Production-Aktivierungstoggle.

---

## 2. Hartes Start-Gate vor Runtime-Code

Der parallele Provider-Workstream PR #47 / `feat/provider-ops-s1` baut aktuell den gemeinsamen provider-neutralen Operational Contract. Dieser enthält u. a. technische Outcome-/Failure-Grundtaxonomie, Request-Härtung, Kill-Switch-Form, Cost-Guard-Interface und Observability-Typen.

**Slice C darf diesen Vertrag nicht parallel nachbauen oder fork-en.**

Runtime-Implementierung von Slice C startet erst, wenn **alle** folgenden Punkte erfüllt sind:

1. Provider S1 hat unabhängigen ChatGPT/Technical-Lead-Review und **Technical Closure / PASS**.
2. Der Technical Lead nennt den **exakten freigegebenen S1-Head bzw. Integrationsstand**, den Slice C konsumieren darf.
3. Es gibt keine offene Shared-Contract-Kollision mit Account AP-2 oder einem anderen aktiven Workstream.
4. Keine Provider-/Secret-/Kostenfreigabe wird implizit angenommen.

**Aktueller Stand 24. August 2026:** Start-Gate ist geöffnet.

1. S1 ist gemergt: `01761eb9ba80828e87ca2da201901e0e211e1719` / PR #47, Technical Closure / PASS.
2. Freigegebener Integrationsstand: `lib/provider-ops` auf aktuellem `main` `e3bad749`. Slice C importiert nur daraus.
3. Shared Files in `lib/provider-ops` bleiben unverändert. ADR-0162 ist Slice C; ADR-0160/0161 bleiben AP-3/S3.
4. Keine Provider-/Secret-/Kostenfreigabe.

Der Admin-Agent darf den S1-Vertrag weder kopieren noch reimplementieren.

---

## 3. Verbindliche Produktwahrheit

### 3.1 Provider-Ops

Das Board darf nur Aussagen darstellen, die durch den später freigegebenen Provider-Ops-S1-Vertrag oder eine andere ausdrücklich erlaubte Serverquelle belegbar sind.

Beispiele zulässiger Zustände:

- `disabled` / `not_configured`
- `foundation_only`
- `unknown`
- `available` nur für genau die belegte technische Capability
- `stale`, wenn die Evidence nicht mehr frisch ist

Nicht zulässig:

- „Provider gesund“, nur weil eine Factory existiert,
- „Production bereit“, nur weil ein Adapter kompiliert,
- „Kill Switch aktiv“, wenn nur ein Interface/Default existiert,
- „Kosten geschützt“, wenn der Guard nur in-memory/lokal ist,
- „Live“, wenn kein echter Provider freigegeben und aktiviert wurde.

### 3.2 Kill Switch

Slice C zeigt den **belegten Zustand** des gemeinsamen Kill-Switch-Vertrags. Er implementiert **keinen eigenen zweiten Kill Switch**.

Falls S1 nur eine Form/Policy und keine globale persistente Runtime-Wahrheit liefert, muss das UI dies ausdrücklich sagen, z. B. `Foundation vorhanden – globale/persistente Durchsetzung nicht belegt`.

**Kein Toggle und kein Aktivieren/Deaktivieren aus dem Admin in Slice C.**

### 3.3 Cost Guard

S1 enthält zunächst nur eine nicht-persistente Cost-Guard-Grundlage. Das Board darf daraus keine globale Monatsbudget-Sicherheit ableiten.

Zulässige Aussage: technische Guard-Capability/Form vorhanden bzw. nicht vorhanden, mit genauer Scope-/Persistenzangabe.

Nicht zulässig: „Budget geschützt“, „Kostenlimit aktiv“ oder ähnliche Gesamtclaims ohne persistente, global wirksame Evidence.

### 3.4 Model-/Usage-Kosten

Bestehende `model_usage`-Daten dürfen nur verwendet werden, wenn der aktuelle autorisierte Admin-Pfad sie **ohne Service-Role-Ausweitung und ohne RLS-Bypass** sicher lesen kann.

Wenn die bestehende Daten-/RLS-Lage das nicht sauber erlaubt, zeigt Slice C `nicht verfügbar` / `nicht konfiguriert` und dokumentiert die spätere Abhängigkeit. **Keine DB-/RLS-/Capability-Änderung nur für dieses Board.**

Keine CHF/USD-Kosten errechnen, wenn die gespeicherte Quelle nur Token/Usage, aber keine belastbare Preis-/Billing-Evidence enthält. Keine rückwirkenden Preisannahmen.

---

## 4. UI-Scope

Ein ruhiges read-only Modul im bestehenden Admin Control Center, keine zweite Admin-App.

Vorgesehene Oberfläche:

- neue Admin-Seite, z. B. `/admin/provider-ops` oder ein nach vorhandener IA besser passender Name,
- Einstieg aus der bestehenden Sidebar/Home nur als tatsächlich vorhandener Bereich,
- Provider-Ops-Übersicht mit klaren Source-/Freshness-/Scope-Hinweisen,
- eigener Bereich für Kill-Switch-/Cost-Guard-Capability,
- Kosten-/Usage-Karte nur für belegte Daten,
- Empty / Unknown / Stale / Error als first-class UI,
- Details: `Beweist` / `Beweist nicht`, analog zum ehrlichen System-Health-Prinzip,
- Deep Links zu relevanten internen Docs/Gates dürfen vorhanden sein,
- Mobile-first und volle Smartphone/Tablet/Desktop-Parität.

Keine Demo-Charts. Ein Diagramm ist nur zulässig, wenn reale gespeicherte Zeitreihen existieren und die Achsen/Einheiten fachlich korrekt sind.

---

## 5. Server/API-Scope

Falls für das Board ein neuer Admin-Read-Endpunkt nötig ist:

- GET-only,
- `requireAdminApi(...)` mit der **bereits passenden** read-only Capability; keine neue Capability ohne Lead-Entscheidung,
- keine Service Role,
- keine Provider-Management-/Billing-API,
- keine externen kostenpflichtigen Calls,
- kein Client-seitiger Zugriff auf Secrets oder Provider-Ops-Interna,
- klar typisierte Response mit Source/Freshness/Scope.

Falls bestehende Serverfunktionen reichen, keinen unnötigen API-Layer bauen.

---

## 6. Harte Grenzen

In Slice C ausdrücklich **verboten**:

- echte Provider aktivieren,
- Provider-Verträge abschließen,
- API-Keys/Secrets anlegen,
- kostenpflichtige Provider-Calls,
- Production-Kill-Switch-Writes,
- Budget-/Limit-Writes,
- Refunds/Payments/Bexio/Stripe-Live,
- DB-Migrationen,
- RLS-/Auth-/MFA-/AAL-/Capability-Änderungen,
- neue Service-Role-Pfade,
- Provider-Health-Persistenz,
- Account-/Privacy-/Traveller-/Trip-Truth-Änderungen,
- Route-/Readiness-/Safety-/Seasonal-Truth ändern,
- Provider S2 oder spätere Provider-Slices vorziehen,
- Copilot-Pro-Autonomie/Execute-Pfade,
- Slice D vorwegnehmen.

Provider-Health-Persistenz/Admin-Anbindung, die im Provider-Plan erst später vorgesehen ist, darf hier nicht still in Slice C gezogen werden.

---

## 7. Erwartete Code-Grenzen nach Öffnung des Start-Gates

Der Agent soll vor der ersten Änderung die tatsächlichen Pfade neu verifizieren. Erwartbar sind nur kleine Änderungen in Bereichen wie:

- `app/(admin)/admin/...`
- `app/api/admin/...` nur falls nötig
- `components/admin/...`
- `lib/admin/...`
- read-only Imports aus dem **freigegebenen** gemeinsamen Provider-Ops-Vertrag
- gezielte Tests/Audit-Harness
- Slice-C-Dokumentation / ADR-Nachtrag

Shared Provider-Ops-Dateien selbst gehören weiterhin dem Provider-Workstream. Änderungen daran erfordern einen neuen Technical-Lead-Schnitt und dürfen nicht beiläufig in Slice C erfolgen.

---

## 8. Pflichtregressionen / Tests

Mindestens:

1. Parent-/Gesamtclaims bleiben non-green/non-ready, wenn nur Foundation-/Interface-Evidence existiert.
2. Ein in-memory Cost Guard darf nicht als global/persistent budget protection erscheinen.
3. Ein Kill-Switch-Interface/Default darf nicht als Production-Enforcement erscheinen.
4. Keine echte Providerfactory / kein fehlender Provider darf als live/healthy gerendert werden.
5. Fehlende Usage-/Billing-Quelle → ehrliches `unknown` / `not_configured`, keine `0 CHF`-Lüge.
6. Stale Evidence → sichtbar stale und nicht grün.
7. API, falls neu: GET-only + Admin-Guard + keine Write-Methoden.
8. Keine Secrets / Tokens / `NEXT_PUBLIC_*`-Lecks im Client.
9. Kein Service-Role-/RLS-Bypass.
10. Existing Admin Slice A+B Tests bleiben grün.
11. Account-/Trip-/Travel-Truth-Tests bleiben unverändert grün.
12. UI-Audit mindestens WebKit + Chromium auf 320 / 390 / 768 / 1280, inklusive Empty/Unknown/Error/Stale soweit sinnvoll.
13. Typecheck, Lint, Hygiene, Production-Build grün.
14. `check:api-schutz` bei neuer Admin-Route grün.
15. vollständige relevante Test-Suite grün.

Nach Implementierung: Exact-Head GitHub Actions SUCCESS + Vercel Preview READY auf demselben Runtime-/Gate-Head, danach unabhängiger Technical-Lead-Review.

---

## 9. Dokumentation / Handoff

Der Agent muss nach Implementierung anlegen/aktualisieren:

- `docs/ADMIN_PLATFORM_SLICE_C_STATUS.md`
- `docs/ADMIN_PLATFORM_SLICE_C_HANDOFF.md`
- `docs/ADMIN_PLATFORM_SLICE_C_SELF_REVIEW.md`
- relevante ADR-/Architecture-/Roadmap-/Active-Work-Verweise

Die Dokumentation muss klar unterscheiden:

- belegte Live-Evidence,
- provider-neutrale Foundation,
- nicht persistente Guard-Capability,
- nicht konfigurierte externe Provider-/Billing-Quellen,
- zukünftige Arbeit.

---

## 10. Stop-Kriterien

Der Agent stoppt und fragt den Technical Lead, wenn:

- Provider S1 noch nicht Technical Closure / PASS hat,
- der freigegebene S1-Vertrag nicht eindeutig identifizierbar ist,
- für gewünschte Daten eine DB-/RLS-/Capability-/Secret-Änderung nötig wäre,
- eine zweite Provider-Ops-/Kill-Switch-/Cost-Guard-Wahrheit entstehen würde,
- Kosten nur geschätzt statt belegt werden könnten,
- der Scope in echte Provideraktivierung oder Finance-Live abrutscht.

---

## 11. Governance

- Dieser Auftrag ist nach dem Slice-B-Merge und dem geöffneten S1-Start-Gate **ausführbar**.
- Derselbe Cursor-Agent **`Admin platform audit`** führt Slice C jetzt aus.
- Nach der Implementierung folgen Self-Review, lokale Gates, Exact-Head CI/Vercel und unabhängiger ChatGPT/Technical-Lead-Review.
- **Kein Slice D ohne neuen Auftrag.**
- **Kein Mark Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
