# Jetnity – Handoff und nächste Schritte

Stand: **24. August 2026, 17:25 Europe/Zurich**  
Status: **neuer ChatGPT Technical Lead live übernommen; `main` unverändert auf Provider S2; docs-only Übergabe-Nachzug in Draft-PR #52**

Dieser Handoff ist der zentrale operative Einstieg für einen neuen Chat oder Coding Agent. Wenn Chat-Erinnerung, historische Slice-Handoffs und Live-Systeme widersprechen, gilt:

> **Nicht raten. GitHub, CI, Vercel und Supabase live verifizieren. Der neuere belegte Stand gewinnt und wird danach wieder im Repository persistiert.**

Aktuell maßgebliche Übergabequellen:

1. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-08-24.md` – Übergabepunkt 16:45
2. `docs/CHATGPT_TAKEOVER_LIVE_VERIFICATION_2026-08-24.md` – neuere Live-Verifikation 17:25
3. `docs/ACTIVE_WORK_STATUS.md` – kompakter aktueller Arbeitsstatus
4. `docs/CHATGPT_TECHNICAL_LEAD_CONTINUITY.md`
5. `docs/NEW_CHAT_START_PROMPT_2026-08-24.md`

Historische Account-/Admin-/Provider-Handoffs bleiben Evidence des jeweiligen Slice-Zeitpunkts. Sie dürfen nicht allein als heutiger Merge-/Production-Status gelesen werden.

---

## 1. Verbindliche Rollen und Governance

Rollen:

- **Product Owner / Nutzer:** verbindliche Produktentscheidungen und finale Gates
- **ChatGPT:** Hauptentwickler / Technical Lead / Product-, Architecture-, Logic-, Security- und Review-Steuerung
- **Cursor / Coding Agents:** Implementierung größerer Blöcke ausschließlich nach versioniertem Auftrag
- **GitHub:** dauerhaftes gemeinsames Gedächtnis / Source of Truth

Harte Regeln:

- **Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Grüne Tests, CI, Vercel, Technical Closure oder Review-PASS ersetzen diese Freigabe nicht.
- Production-Migrationen sind separate Gates.
- Provideraktivierung, Secrets/API-Keys, Verträge und kostenpflichtige Calls sind separate Gates.
- Laufende Infrastruktur-/Providerkosten maximal USD 100/Monat; darüber vorher Product Owner fragen.
- Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Health, Fake-Provider-Evidence oder erfundene regulatorische/Safety-Wahrheit.
- Shared Auth/RLS/Identity/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation-Verträge bleiben seriell unter Technical-Lead-Steuerung.
- Ein freigegebener Cursor-Scope wird nicht still erweitert. Bei relevantem Shared-/Scope-Fund: stoppen, dokumentieren, neuen Auftrag vorlegen.
- Nach jedem Implementierungsslice: Self-Review, vollständige Gates, Exact-Head-Nachweis und unabhängiger Technical-Lead-Review.
- Relevanter Fortschritt, Entscheidungen, Blocker, Freigaben, Heads, CI/Vercel/Supabase-Evidence und exakter nächster Schritt gehören ins Repository.

Verbindliche Policies:

- `docs/CONTINUITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/LOGIC_STANDARD.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`

---

## 2. Produkt-Nordstern

Jetnity soll ein zusammenhängendes intelligentes Reiseplanungs- und Reisebegleitungsprodukt werden, kein Bündel getrennter Suchseiten.

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Jetnity analysiert, erklärt und empfiehlt; wichtige Änderungen werden nicht still vorgenommen.**

Fortgeltend:

- Schweiz zuerst, international skalierbar.
- Web/PWA zuerst, Native später möglich.
- Aggregator / Assistent / Planer als Grundmodell, kein direkter Vollbucher als Kern.
- Trip Workspace ist die zentrale Produktoberfläche einer einzelnen Reise.
- „Meine Reisen“ bleibt der persönliche Reise-Hub.
- Account ist das dauerhafte persönliche Zuhause, nicht ein zweites Workspace-Dashboard.
- Nutzer soll klare Priorität, nächsten Schritt, Risiken und Fortschritt sehen; interne Komplexität bleibt im System.
- mehrere Staatsbürgerschaften und mehrere Reisedokumente müssen in allen relevanten Entry-/Transit-/Readiness-Funktionen korrekt berücksichtigt werden.
- Ausstellerland ist nicht automatisch Staatsbürgerschaft.
- Official/Regulatory/Safety-Truth braucht belastbare Evidence; `unknown` bleibt `unknown`.
- Marketing bevorzugt „smart/intelligent“ statt unnötig „KI“.
- keine Demo-/Fake-Funktionalität als fertiges Feature ausgeben.

Vor größeren Produkt-/Architekturentscheidungen zusätzlich lesen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- relevante Fach-/Audit-/Acceptance-Dokumente unter `docs/`

---

## 3. Live verifizierter `main`-Stand

Repository: `Jetnity/jetnity`

Aktueller `main`:

`52e665acfed88303300870d50855177284588026`

Commit:

`Provider Readiness S2 – FlugNachweis (#51)`

Bestätigt:

- PR #51 merged / closed
- Merge am 24. August 2026, 14:29:48 UTC
- seit dem 16:45-Übergabe-Checkpoint kein neuer Main-Commit
- Parent: Account AP-2 `2827d1cbb674498f504ba1810c73c8dc5d43ca24`

### Governance-Härtungsfund

GitHub meldet `main` aktuell als `protected: false` und ohne erzwungene Required Status Checks.

Das ändert unsere Product-Owner-Gates nicht, bedeutet aber: GitHub erzwingt sie technisch derzeit nicht zusätzlich. Technical-Lead-Empfehlung ist, Branch Protection / Ruleset vor weiteren produktiven Merges als separaten Governance-Schritt zu prüfen. **Nicht freigegeben und nicht ausgeführt.**

---

## 4. Vercel Production

Projekt: `jetnity-app`

Aktuelles Production Deployment:

- `dpl_GmkoSNdse6YkRYqiR6VHsEMAsUv5`
- State: **READY**
- Target: `production`
- Branch: `main`
- Git SHA: `52e665acfed88303300870d50855177284588026`
- Alias: `jetnity-app.vercel.app`

Beim Takeover wurde eine deployment-spezifische Error/Fatal-Abfrage für ca. 20 Minuten ohne Treffer durchgeführt. Ein breiter vorheriger 1-Stunden-Abruf lief in ein API-Timeout; deshalb wird kein neuer vollständiger 1-h-PASS behauptet.

---

## 5. Supabase Production / Development

### Production

Project ref: `qscbgcdmivbbnzrcyegn`  
Region: `eu-central-2`  
Status: **ACTIVE_HEALTHY**

Production endet bei:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Nicht auf Production:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Der Trigger `trip_items_flug_handelsfelder_schuetzen` ist auf Production live **nicht vorhanden**.

### Development

Branch: `develop`  
Branch ID: `74809331-0243-493a-8c14-20bb78c015f5`  
Project ref: `yfvbxvijcorffwxbxahl`  
Preview status: **ACTIVE_HEALTHY**

Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Der Trigger `trip_items_flug_handelsfelder_schuetzen` ist dort live vorhanden.

Damit gilt:

> **S2-Code ist auf `main` / Vercel Production. Die zwei S2-B1/B2-DB-Trust-Guards sind weiterhin ausschließlich Supabase Development.**

Eine Production-Migration dieser beiden Guards braucht eine neue ausdrückliche Product-Owner-Freigabe.

---

## 6. Abgeschlossene Kern-Fundamente – nicht erneut bauen

Abgeschlossen / gemergt und soweit erforderlich Production-verifiziert:

- Flight Foundation
- Hotel Foundation
- Activities Foundation
- Mobility & Transfers Foundation
- Rental Car Foundation
- Travel Requirements & Readiness Foundation C
- Route & Transit Intelligence Foundation D
- Traveller Context / Multi-Citizenship / Multi-Document Foundation E
- Travel Safety & Disruption Intelligence
- Travel Timing & Seasonal Intelligence

Wesentliche kanonische Regeln:

- gemeinsamer Reisegraph statt Schattenmodelle
- Route Truth bleibt Foundation D
- Traveller Context unterstützt mehrere Staatsbürgerschaften und Credentials pro Traveller
- Browser-/Client-Felder dürfen keine Official-/Provider-Truth adeln
- bewusst gelöschte/ersetzte Wahrheit darf durch Legacy-Fallbacks nicht wieder auferstehen
- Date-only ist ein Kalendertag, nicht still UTC

---

## 7. Account – aktueller Stand

Abgeschlossen / merged:

- PR #43 – **Account AP-1**
- PR #48 – **Account AP-2 Auth-UX-Hygiene**

Nicht gestartet:

- **AP-3 – „Meine Reisen“ Lebenszyklus**

AP-3 bleibt ein konfliktarmer, ableitender Slice:

- Gruppen Aktiv / Kommend / Vergangen / Ohne Datum
- optional kleine Suche/Filter
- Limit-Hinweis nur bei realer Relevanz
- kein `status=archived` Write
- kein zweites Listenmodell
- Date-only-/Kalendertag-Logik konsistent
- Reise ohne Datum niemals fälschlich „Vergangen“
- Empty-Gruppe ist kein Fehler
- keine Shared Auth/RLS/DB-/Traveller-Vertragsänderung

Historischer Audit-PR #39 bleibt Planungs-/Evidence-Material, kein aktiver Runtime-Branch.

---

## 8. Provider Readiness – aktueller Stand

Abgeschlossen / merged:

- PR #45 – Provider Readiness Audit
- PR #47 – Provider Ops S1 Shared Operational Contract
- PR #51 – Provider Readiness S2 / FlugNachweis

S2 schließt die Browser-Trust-Grenze für kommerzielle Flight-Wahrheit auf Code-Ebene; die beiden ergänzenden DB-Guards bleiben Development-only bis zu einem separaten Production-Gate.

Nicht gestartet:

### S3 – Mobility- und Rental-Nachweis

Geplanter Rahmen:

- Stub-Nachweise auf async `nachweisen({ optionId, kontext })`-Form
- Übernahme bleibt fail-closed ohne echten Adapter
- Katalog-Doubles nur für Tests
- keine Provideraktivierung
- Mobility Auto-Search explizit gegen Nutzerinitiierung/Kostenleck prüfen; nötigenfalls abschalten oder hinter klare Nutzeraktion legen
- kein echter Provideradapter
- keine Mietwagen-Such-UI
- kein Graph-Rewrite

S3 braucht vor Start einen neuen versionierten Technical-Lead-Auftrag auf Basis der aktuellen Code-/Audit-Evidence.

---

## 9. Admin – aktueller Stand

Verantwortlicher bestehender Cursor-Anzeigename:

`Admin platform audit`

### PR #44 – Admin Slice A / Control Center IA

- State: open Draft
- Head: `b64cd2af7f99109d8771457e8ac776681b86fed1`
- GitHub aktuell `mergeable: false`
- gegen Main `52e665ac...`: **17 ahead / 1 behind**
- Merge-Base: Account AP-2 `2827d1cb...`

Der Branch fehlt genau den späteren Provider-S2-Main-Commit. Historische Technical-PASS-Nachweise bleiben Evidence, sind aber kein Current-Main-Gate.

**Nächster Admin-Schritt:** #44 auf aktuellen `main` synchronisieren → vollständige Exact-Head-Gates → unabhängiger Technical-Lead-Integrationsreview → erst dann Product-Owner-Entscheidung über Ready/Merge.

### PR #46 – Admin Slice B / read-only System Health

- State: open Draft
- Head: `83c66842e94bc4e7645a39269174397cb4b7eb3f`
- Base: gestapelt auf Slice A
- GitHub aktuell `mergeable: false`
- CI auf diesem Head SUCCESS `32709635273`
- Vercel Preview READY `dpl_Aw6uoNRcrEXW8s68JNnoaUjgKH5r`
- gegenüber aktuellem Slice-A-Head: **10 ahead / 13 behind**

CI/Preview sind gültige historische Stack-Evidence, aber kein heutiges Integrationsgate. Nach sauberer Slice-A-Integration wird B auf `main` gebracht und erneut exakt gegatet/reviewt.

### PR #49 – Admin Slice C / Provider & Cost Board

- State: open Draft
- Head: `4ca7a09326dc99399570e15e0aa5e5d3cd98c37a`
- nur vorbereitet/docs-only
- kein Runtime-Start

Nicht blind starten. Erst A/B sauber integrieren und dann einen neuen Technical-Lead-Auftrag schneiden. Kein Live-Provider, keine Secrets, keine Fake-Health-/Cost-Wahrheit.

Historischer Admin-Audit-PR #40 bleibt Planungs-/Evidence-Material.

---

## 10. Aktueller docs-only Übergabeblock

Aktiver Branch für den Chatwechsel:

`docs/chatgpt-technical-lead-handoff-2026-08-24`

Draft-PR:

`#52 – docs: ChatGPT Technical Lead handoff – 2026-08-24`

Zweck:

- professioneller Chat-Wechsel ohne Informationsverlust
- tatsächlichen Live-Stand persistieren
- veraltete globale operative Handoff-/Statusangaben korrigieren

Keine Runtime-, DB-, RLS-, Auth-, Provider-, Secret- oder Kostenänderung.

Nach jedem neuen docs-only Head von #52 werden GitHub Actions und Vercel Preview auf genau diesem Head geprüft. PR #52 bleibt Draft. **Kein Mark Ready / kein Merge ohne neue ausdrückliche Product-Owner-Freigabe.**

---

## 11. Exakter nächster operativer Schritt

### Jetzt

1. Draft-PR #52 docs-only Nachzug abschließen.
2. neuen Exact Head feststellen.
3. GitHub Actions auf genau diesem Head prüfen.
4. Vercel Preview auf genau diesem Head prüfen.
5. Ergebnis im Repository/PR festhalten.
6. STOPP – kein Mark Ready, kein Merge.

### Danach empfohlen

1. Product Owner entscheidet separat über GitHub Branch-Protection-/Ruleset-Härtung.
2. Admin #44 Current-Main-Sync → Re-Gate → unabhängiger Review.
3. Erst danach Product-Owner-Gate für Ready/Merge von #44.
4. AP-3 und Provider S3 dürfen als neue konfliktarme Slices vorbereitet werden, sofern kein Shared-Contract-Konflikt entdeckt wird.
5. Nach Slice-A-Integration: Admin #46 auf `main` → Re-Gate → Re-Review.
6. Danach Admin #49 neu beurteilen.

Wenn ein Shared-Contract-Konflikt auftaucht, wird Parallelität reduziert und der konfliktträchtige Teil serialisiert.

---

## 12. Weiterhin gesperrt / separate Gates

Ohne neue ausdrückliche aktuelle Product-Owner-Freigabe nicht:

- PR #52, #44, #46, #49 oder zukünftige AP-3/S3-PRs Mark Ready setzen
- irgendeinen dieser PRs mergen
- S2-Production-Migrationen `20260824160000` / `20260824180000`
- echte Provider aktivieren
- Duffel/Booking/GYG/Timatic o. ä. live schalten
- neue Secrets/API-Keys setzen
- Verträge abschließen
- kostenpflichtige Provider-Calls starten
- Service Role erweitern
- Auth/MFA/AAL/RLS/Capabilities still verändern
- Admin Slice C Runtime starten

---

## 13. Historische / vorbereitete offene PRs

Nicht automatisch als aktive Runtime-Arbeit behandeln:

- #39 Account Audit – historisch/Planung
- #40 Admin Audit – historisch/Planung
- #50 Provider-S1 docs-only Nachtrag – historisch/stale
- #28 Collaboration Foundation – nicht Teil der aktuellen nächsten Reihenfolge

Cleanup/Close/Merge ist ein eigener bewusster Governance-Schritt.

---

## 14. Pflicht für den nächsten Chat / Agent

Ein neuer Chat oder Agent:

1. liest diesen Handoff, `docs/ACTIVE_WORK_STATUS.md`, den letzten Takeover-/Checkpoint-Nachweis und die relevanten Policies;
2. liest `JETNITY_VISION.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` sowie die relevanten Fach-/Review-Dokumente;
3. verifiziert aktuellen `main`, PR-Heads/Basen, GitHub Actions, Vercel und Supabase selbst;
4. übernimmt historische PASS-/Closure-Dokumente nicht blind;
5. sucht aktiv nach Truth-, Security-, Datenverlust-, Legacy-, Cross-Domain-, Provider-, DB-/RLS-, Parallelitäts- und Deployment-Problemen;
6. erweitert einen freigegebenen Scope nicht still;
7. persistiert relevante neue Wahrheit wieder im Repository.

> **Nicht nur bestätigen, dass es funktioniert. Aktiv prüfen, wo es noch brechen kann.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**
