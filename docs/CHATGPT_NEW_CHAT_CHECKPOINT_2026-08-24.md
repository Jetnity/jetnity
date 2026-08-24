# Jetnity – New Chat Technical Lead Checkpoint

Stand: **24. August 2026, 16:45 Europe/Zurich**  
Zweck: **exakter Übergabepunkt vom bisherigen ChatGPT Technical Lead an einen neuen Chat**

> Dieser Checkpoint wurde unmittelbar vor dem Chatwechsel gegen GitHub, Vercel und Supabase verifiziert. Trotzdem muss der neue Chat beim Start die Live-Systeme erneut prüfen, weil sich PRs, CI oder Infrastruktur nach diesem Zeitpunkt weiterbewegen können.

---

## 1. Exakter verifizierter `main`-Stand

Repository: `Jetnity/jetnity`

Verifizierter `main`-Head:

`52e665acfed88303300870d50855177284588026`

Commit:

`Provider Readiness S2 – FlugNachweis (#51)`

GitHub bestätigt:

- PR #51 ist **merged und geschlossen**,
- Merge-Zeit: 24. August 2026, 14:29:48 UTC,
- Parent von `52e665ac...` ist Account AP-2 `2827d1cbb674498f504ba1810c73c8dc5d43ca24`.

Wichtig: `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_HANDOFF.md` auf `main` stammen teilweise noch aus der Phase **vor** dem S2-Merge und nennen PR #51 fälschlich noch als Draft/Review-Block. Deshalb ist **dieser Checkpoint** für den Übergang die neuere operative Wahrheit. Der neue Chat soll die Main-Dokumente später sauber nachziehen, aber nicht aufgrund ihres veralteten Textes S2 erneut öffnen.

---

## 2. Vercel – live verifiziert

Team:

- `Jetnity`
- Team ID `team_fgOHJvth4GbXnyclxk95GQul`

Projekt:

- `jetnity-app`
- Project ID `prj_wTTVawPItEO7a4HihEmaU3PsuaXM`
- Production Alias: `jetnity-app.vercel.app`

Aktuelles Production Deployment:

- Deployment: `dpl_GmkoSNdse6YkRYqiR6VHsEMAsUv5`
- State: **READY**
- Target: **production**
- Git SHA: **`52e665acfed88303300870d50855177284588026`**
- Branch: `main`

Runtime Error/Fatal Logs für dieses Deployment wurden für die letzte Stunde geprüft: **keine gefunden**.

GitHub Combined Status auf dem aktuellen Main-Commit zeigt Vercel **success**. Für den Squash-Merge-Commit selbst war im verwendeten GitHub-Status-Interface kein separates GitHub-Actions-Checkset sichtbar; deshalb darf der neue Chat nicht behaupten, ein Main-Actions-Run sei geprüft, ohne ihn selbst zu verifizieren. Der S2-Integrations-Exact-Head vor Merge war dagegen mit GitHub Actions und Vercel grün dokumentiert.

---

## 3. Supabase – live verifiziert

### Production

Project ref: `qscbgcdmivbbnzrcyegn`  
Region: `eu-central-2`  
Status: **ACTIVE_HEALTHY**

Production-Migrationen enden aktuell bei:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

**Nicht auf Production:**

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese beiden S2-B1/B2-Migrationen sind ein **separates Production-Gate**. Der Product Owner hat den S2-Code-Merge freigegeben, **nicht** die Production-Migration dieser beiden DB-Guards.

### Development Branch

Supabase Branch:

- Name: `develop`
- Branch ID: `74809331-0243-493a-8c14-20bb78c015f5`
- Project ref: `yfvbxvijcorffwxbxahl`
- Preview project status: **ACTIVE_HEALTHY**

Development enthält zusätzlich zu Production:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Damit gilt beim Übergang:

> **S2-Code ist auf `main` / Vercel Production. Die beiden neuen S2-DB-Trust-Guards sind weiterhin nur auf Supabase Development. Production bleibt bezüglich dieser beiden Migrationen bewusst unverändert.**

Kein neuer Chat darf diese Migrationen ohne separate ausdrückliche aktuelle Product-Owner-Freigabe auf Production anwenden.

---

## 4. Abgeschlossene Blöcke – nicht erneut bauen

### Travel Foundations

Bereits abgeschlossen / gemergt / wo erforderlich Production-verifiziert:

- Flight Foundation
- Hotel Foundation
- Activities Foundation
- Mobility Foundation
- Rental Car Foundation
- Travel Readiness Foundation C
- Route & Transit Intelligence Foundation D
- Traveller Context / Multi-Citizenship / Multi-Document Foundation E
- Travel Safety & Disruption Intelligence
- Travel Timing & Seasonal Intelligence PR #38

### Account

- PR #43 – **Account AP-1**: merged
- PR #48 – **Account AP-2 Auth-UX-Hygiene**: merged
- AP-3 wurde **noch nicht gestartet**.

### Provider Readiness

- PR #45 – Provider Readiness Audit: merged
- PR #47 – Provider Ops S1 Shared Operational Contract: merged
- PR #51 – Provider Readiness S2 / FlugNachweis + Development-only B1/B2 Guards: **merged**
- S3 wurde **noch nicht gestartet**.

S2 bleibt fachlich geschlossen, solange kein neuer konkreter Defekt entdeckt wird. Production-Migration der beiden S2-DB-Guards ist eine separate Entscheidung und darf nicht mit „S2 technisch abgeschlossen“ verwechselt werden.

---

## 5. Aktuelle Admin-Lage

Verantwortlicher Cursor-Anzeigename:

`Admin platform audit`

### PR #44 – Admin Slice A

Branch: `feat/admin-control-center-ia`  
State: **open Draft**

Historischer unabhängiger Technical-Lead Integrations-PASS existiert für Runtime:

`ed839d3e6ee2605beef65d66fa1555ddabb52138`

Aber: seitdem ist `main` durch Account AP-2 und Provider S2 weitergelaufen. PR #44 muss deshalb **vor einer neuen Merge-Entscheidung gegen den aktuellen `main` `52e665ac...` synchronisiert und auf neuem Exact Head erneut gegatet/reviewt werden**.

Kein Slice B/C starten, bevor der neue Technical Lead diese Integrationslage sauber neu verifiziert und den nächsten Auftrag festlegt.

### PR #46 – Admin Slice B / read-only System Health

Branch: `feat/admin-system-health`  
Base: gestapelt auf Slice A  
State: **open Draft**  
Technical Closure/PASS existiert historisch auf dem damaligen Stack.

Nach sauberer Integration von Slice A muss Slice B auf den dann aktuellen `main` umgestellt/synchronisiert und **neu exakt gegatet und unabhängig reviewt** werden, bevor ein Product-Owner-Merge-Gate überhaupt diskutiert wird.

### PR #49 – Admin Slice C / Provider & Cost Board

State: **open Draft / vorbereitet / kein Runtime-Start**.

S1-Abhängigkeit ist inzwischen durch Merge von PR #47 erfüllt. Trotzdem Slice C **nicht einfach starten**. Erst Admin A/B sauber integrieren und dann einen frischen Technical-Lead-Auftrag schneiden. Kein Live-Provider, keine Secrets, kein Toggle, keine Fake-Health-/Cost-Wahrheit.

### Admin Audit PR #40

Bleibt historischer Audit-/Planungs-PR. Nicht als aktueller Implementierungsbranch verwenden.

---

## 6. Aktuelle Account-Lage

Verantwortlicher Cursor-Anzeigename:

`Account plattform audit vorbereitung`

Historischer Audit-PR: #39 / `audit/account-platform`.

AP-1 und AP-2 sind bereits auf `main` und dürfen nicht neu gebaut werden.

### Nächster Account-Slice: AP-3 – „Meine Reisen“ Lebenszyklus

Der Audit-Plan definiert AP-3 als konfliktarmen, ableitenden Slice:

- Gruppen `Aktiv`, `Kommend`, `Vergangen`, `Ohne Datum` aus `startDate` / `endDate`
- optional kleine Suche/Filter
- Hinweis bei 200er-Limit, wenn tatsächlich relevant
- **kein** `status=archived` Write
- **kein** zweites Listenmodell
- Date-only-/Zeitzonenlogik konsistent zur vorhandenen Reisekarte
- Reise ohne Datum darf nicht fälschlich „Vergangen“ werden
- Empty-Gruppe ist kein Fehler

AP-3 war beim Übergang **nicht gestartet**. Er darf nach Start-Verifikation als neuer separater Draft-PR vom aktuellen `main` geschnitten werden. Shared Auth/RLS/DB/Traveller-/Provider-Verträge nicht anfassen.

---

## 7. Aktuelle Provider-Lage und nächster Provider-Slice

Nach S1 und S2 ist der nächste geplante Provider-Readiness-Slice:

### S3 – Mobility- und Rental-Nachweis auf Hotel-Form

Audit-Ziel:

- Stub-Nachweise durch async `nachweisen({ optionId, kontext })`-Form ersetzen,
- Übernahme fail-closed lassen, bis echter Adapter existiert,
- Katalog-Doubles nur für Tests,
- keine Provider-Aktivierung,
- Mobility Auto-Search im Workspace abschalten oder hinter explizite Nutzeraktion legen, falls die Audit-Evidence das weiterhin fordert,
- kein echter Adapter,
- keine Mietwagen-Such-UI,
- kein Graph-Rewrite.

S1 liefert die Operationsform; S2 ist Qualitätsreferenz, darf aber nicht blind kopiert werden.

S3 war beim Übergang **nicht gestartet**. Neuer Chat muss vor Beauftragung die aktuelle Code-/Audit-Evidence erneut prüfen und einen versionierten S3-Cursor-Auftrag schreiben.

---

## 8. Offene PRs – nicht mit „aktive Arbeit“ verwechseln

Beim Übergang waren unter anderem offen:

- #44 Admin Slice A – **relevant, Draft, braucht Current-Main-Sync/Re-Gate**
- #46 Admin Slice B – **relevant, gestapelt, später Current-Main-Sync/Re-Gate**
- #49 Admin Slice C – **vorbereitet, noch kein Runtime-Start**
- #50 docs-only Provider-S1-Merge-Nachtrag – **historisch/stale, nicht aktueller Feature-Workstream**
- #39 Account Audit – historischer Planungs-PR
- #40 Admin Audit – historischer Planungs-PR
- #28 alte Collaboration Foundation – nicht Teil der aktuellen nächsten Arbeitsreihenfolge

Der neue Chat soll offene PRs nicht automatisch schließen oder mergen. Erst prüfen, welche nur historisches/superseded Material sind; Cleanup ist ein eigener kleiner Governance-Schritt.

---

## 9. Empfohlene nächste Reihenfolge nach Chatwechsel

**Zuerst keine Cursor-Agenten blind starten.** Neuer Chat übernimmt und verifiziert diesen Checkpoint.

Danach empfohlen:

1. **Admin:** PR #44 gegen aktuellen `main` `52e665ac...` synchronisieren lassen, Exact Head neu gaten, unabhängiger Technical-Lead-Integrationsreview. Erst danach Product-Owner-Entscheidung über Ready/Merge.
2. **Account:** AP-3 als neuen konfliktarmen Draft-PR vom dann aktuellen `main` starten. Kann parallel zur Admin-Synchronisierung laufen, solange keine Shared Contracts berührt werden.
3. **Provider:** S3 als neuen versionierten Auftrag / Draft-PR vom aktuellen `main` starten. Kann parallel laufen, sofern er nur Mobility/Rental-Nachweis und die ausdrücklich erlaubte UI-/Cost-Leak-Grenze berührt und keine Shared Auth/RLS/DB-Verträge verändert.
4. Nach Admin Slice A Integration: Slice B auf `main` retarget/sync, vollständige Gates + unabhängiger Review, dann Product-Owner-Gate.
5. Erst danach Admin Slice C neu beurteilen.

Falls der neue Chat bei der Start-Verifikation einen echten Shared-Contract-Konflikt zwischen AP-3, Admin oder S3 entdeckt, Parallelität reduzieren und den konfliktträchtigen Teil serialisieren.

---

## 10. Noch gesperrt / eigene Product-Owner-Gates

Ohne neue ausdrückliche aktuelle Freigabe **nicht**:

- S2-B1/B2 Production-Migrationen `20260824160000` / `20260824180000`
- echte Provider aktivieren
- Duffel/Booking/GYG/Timatic o. ä. live schalten
- neue Secrets/API Keys
- Verträge abschließen
- kostenpflichtige Provider-Calls starten
- Service Role erweitern
- Auth/MFA/AAL/RLS/Capabilities still verändern
- Admin B/C mergen
- Account AP-3 mergen
- Provider S3 mergen
- einen PR `Mark Ready` setzen

---

## 11. Verbindliche Cross-Domain-Regeln

Serial / Technical-Lead-owned:

- Auth / Identity / Sessions / MFA / AAL
- `profiles`, Rollen, Capabilities
- RLS / Ownership / Service Role
- Guest→Account / Trip Graph
- Traveller / Citizenship / Documents / Readiness
- Route / Safety / Seasonal Truth
- Privacy Export / Delete
- Billing / Payment / Refund / Bexio
- Admin Audit Trail
- Provider Activation / Secrets / Kosten

Account und Admin bleiben getrennte UX, aber teilen kanonische Identity-/Privacy-/Billing-/Trip-Wahrheit.

---

## 12. Produkt- und UX-Mandat, das nicht verloren gehen darf

Jetnity soll als professionelles Reiseprodukt deutlich über reine Preisvergleichs-/Planer-Tools hinausgehen, aber **nicht** durch eine überladene Oberfläche.

Fortgeltend:

- Schweiz zuerst, international skalierbar.
- Web/PWA zuerst, Native später möglich.
- Aggregator/Assistent/Planer statt direkter Vollbucher als Grundmodell.
- Trip Workspace ist zentrale Produktoberfläche.
- Nutzer sieht klare Priorität, nächsten Schritt, Risiken und Fortschritt; interne Komplexität bleibt im System.
- relevante Funktionen berücksichtigen mehrere Staatsbürgerschaften/Dokumente statt einen einzigen „Standardpass“ zu unterstellen.
- Vorschläge dürfen intelligent sein; offizielle/regulatorische Wahrheit braucht Evidence.
- Marketing bevorzugt „smart/intelligent“ statt unnötig „KI“.
- produktionsreif, keine Demo-/Fake-Funktionalität als fertiges Feature ausgeben.

---

## 13. Übergaberegel für den neuen Chat

Der neue Chat soll **nicht** einfach antworten „verstanden“ und sofort einen Agenten starten.

Er soll zuerst:

1. diesen Checkpoint lesen,
2. `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md` lesen,
3. `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `DECISIONS.md`, `ARCHITECTURE.md` und relevante Fach-/Review-Dokumente lesen,
4. `main`-SHA live verifizieren,
5. PR #44/#46/#49 sowie alle neuen PRs seit diesem Checkpoint prüfen,
6. Vercel Production + relevante Previews prüfen,
7. Supabase Production/Development Migrationen und Branch Health prüfen,
8. Widersprüche gegenüber diesem Checkpoint offen nennen,
9. erst dann die Technical-Lead-Rolle übernehmen und die nächsten Aufträge festlegen.

Wenn seit 16:45 Europe/Zurich etwas weitergelaufen ist, **der live verifizierte neuere Stand gewinnt**. Danach neue Wahrheit wieder im Repository persistieren.
