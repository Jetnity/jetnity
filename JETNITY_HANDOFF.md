# Jetnity – Handoff und nächste Schritte

Stand: 25. August 2026  
Status: **kanonischer operativer Übergabepunkt. PR #71 Governance und PR #70 D0-1 sind Product-Owner-freigegeben integriert. Post-D0-1-Continuity ist der aktive docs-only Slice.**

Der erste Einstieg bleibt `JETNITY_START_HERE.md`.

> **Repository-Dokumentation + Live-GitHub-/CI-/Vercel-/Supabase-Evidence ergeben zusammen die technische Wahrheit. Der Product Owner entscheidet Ready/Merge. Nicht aus Erinnerung, Screenshots oder historischen PR-Bodies raten.**

## 1. Pflichtlektüre

Vor neuen Entscheidungen mindestens lesen:

- `JETNITY_START_HERE.md`
- `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_D0_1_MERGE_CHECKPOINT_2026-08-25.md`
- `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
- `docs/JETNITY_PRODUCT_POSITIONING_STANDARD.md`
- `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
- `docs/JETNITY_FUTURE_NATIVE_APP_AND_TECHNICAL_LEAD_STANDARD.md`
- `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md`
- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`
- `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`
- `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/TRIP_WORKSPACE_TARGET_ARCHITECTURE.md`
- `docs/TRIP_WORKSPACE_DEPENDENCY_MATRIX.md`
- `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`
- relevante Slice-Tasks/Status/ADRs/Handoffs/Audits.

Danach live prüfen: `main`, offene PRs/Drafts, Branches, Ahead/Behind, Actions, Vercel, relevante Supabase-Stände, Review-Threads und Blocker.

## 2. Governance

ChatGPT / Technical Lead ist die übergreifende Product-, Architecture-, Logic-, Security-, Privacy-, UX-, Performance-, QA-, Release-, Kosten-, Continuity- und Integrationsinstanz.

Die Technical-Lead-Autonomie reicht bei normalen scope-treuen Arbeiten bis zur **technischen Review-Reife**: Branch/Draft-PR, Agentensteuerung, Implementierung, Tests, Exact-Head-Evidence, unabhängiger Review und technische PASS-/CHANGES-REQUIRED-Entscheidung.

Danach gilt verbindlich:

> **Kein formales Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für den konkret besprochenen PR, sofern der Product Owner im konkreten Fall nichts anderes bestimmt.**

Grüne Tests, Technical-Lead-PASS, Vercel READY, `mergeable=true`, fehlende Review-Threads oder eine frühere allgemeine Autonomie sind keine Merge-Freigabe.

Nach gültiger Freigabe prüft der Technical Lead Exact Head und Integrationsstand erneut und darf dann Ready/Merge technisch ausführen, sofern alle übrigen Gates weiterhin erfüllt sind.

Besondere Product-Owner-Gates bleiben zusätzlich bestehen für Production-Migrationen/destructive Daten, große RLS/Identity-Risiken, echte Provider/Secrets/paid calls, Kosten über USD 100/Monat, reale Payments, fundamentale Build-Order-/Produktänderungen, sensitive Pass/MRZ/Biometrie-Speicherung, fundamentale Auth/Session-Änderungen, sensible externe Datenweitergabe und Public-/Production-Aktivierungen.

Für Ready/Merge superseded `docs/MERGE_GOVERNANCE_SUPERSESSION_2026-08-25.md` alle widersprechenden historischen Auto-Merge-Formulierungen.

## 3. Produkt- und Truth-Mandat

Leitsätze:

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, erfundene Visa-/Safety-/Seasonal-/Live-Truth. `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und bestätigte Zustände bleiben getrennt. LLM/Assistant darf Hard Truth erklären, nicht erzeugen.

Traveller bleibt: ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen. Kein Default-Pass.

## 4. Aktueller integrierter Stand

Live-verifizierter `main`:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Integriert sind unter anderem:

- Foundation C Readiness;
- Foundation D Route & Transit;
- Foundation E Traveller Context;
- Safety/Disruption Foundation;
- Timing/Seasonal Foundation;
- Account AP-1 bis AP-3;
- Provider Readiness S1 bis S3;
- Admin A bis C;
- TW-1 / PR #56;
- TW-2 / PR #58;
- Marketing & Growth Standards / PR #59;
- TW-4 / PR #60;
- TW-3 / PR #64;
- QS-1 / PR #67;
- TW-5 / PR #66;
- Post-TW5 Continuity / PR #68;
- D0/G0 Foundation Audit Evidence / PR #69;
- Governance-Reparatur / PR #71;
- **D0-1 Index Boundary Contract / PR #70**.

Letzte relevante Merge-Commits:

- PR #71 → `63e8900b5c519f0d1d8b25d011ac9bc963d241c6`;
- PR #70 → `083eda22189e1dad8bd70413889d2486755d7fe6`.

Vercel Production für `main @ 083eda22189e1dad8bd70413889d2486755d7fe6`:

- `dpl_7Qvwxrtc7NHQCWLLzrdmNsfFKfjt`;
- READY;
- Alias `jetnity-app.vercel.app`.

`main` Branch Protection bleibt live deaktiviert.

## 5. D0-1 / PR #70 – abgeschlossen

Agent: `Jetnity growth discoverability`

Finaler PR-Head:

`549f3de1a44020641d1cad2c13a6a1a08086847d`

Merge:

`083eda22189e1dad8bd70413889d2486755d7fe6`

Finale Evidence vor Merge:

- GitHub Actions `32906411630`: SUCCESS;
- Vercel Preview `dpl_CNJ2iLyGM9e6AA5UdGX47PCta6zd`: READY;
- 0 offene Inline-Review-Threads;
- unabhängiger Technical-Lead Final Re-Review: TECHNICAL PASS;
- ausdrückliche aktuelle Product-Owner-Merge-Freigabe.

Integrierter Scope:

- `/reisen` und `/reisen/[tripId]` `noindex, nofollow`;
- `/reisen` aus Sitemap entfernt;
- robots-Allow-Modus für sensible D0-1-Pfade gehärtet;
- `/planen` ohne akzeptierte Intent-Keys bleibt öffentliche Basis;
- vorhandene `idee`/`ziel`/`zielId`-Keys machen die konkrete `/planen`-Response `noindex, nofollow`, auch leer/Whitespace/key-only/Array;
- `/admin/login`, `/unauthorized` und Admin-Layout `noindex`;
- toten Admin-`head.tsx` entfernt;
- Regressionstests integriert;
- keine DB/RLS/Auth/Traveller/Route/Provider/Payment/Tracking-/Kostenänderung.

Geschlossene Findings:

- D0-P1-01;
- D0-P1-02;
- D0-P2-03;
- P2-D0-1-TL-01.

## 6. Aktiver Post-D0-1-Continuity-Slice

Branch:

`docs/post-d0-1-continuity-2026-08-25`

Checkpoint:

`docs/CHATGPT_D0_1_MERGE_CHECKPOINT_2026-08-25.md`

Ziel:

- den realen Merge-/Production-Stand nach PR #70 kanonisch speichern;
- stale PR-#70/#71-Draft-Aussagen aus Start Here / Handoff / Active Work korrigieren;
- offenen D0/G0-Reststand und die nächste kontrollierte Kante dokumentieren.

Docs-only. Kein Runtime-Code, keine DB/RLS/Auth/Provider-/Kostenänderung.

Kein Ready/Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe für den Continuity-PR.

## 7. Offene D0/G0-Kanten

Bewusst offen:

- **D0-P1-03** – `/privacy` und `/terms` sind 404; eigener Legal-/PO-Slice, keine Rechtstexte erfinden;
- **D0-P2-01** – deny-all / Sitemap-/Host-Semantik;
- **D0-P2-02** – Canonical-/Origin-Vertrag, `NEXT_PUBLIC_APP_URL` vs `NEXT_PUBLIC_SITE_URL`;
- **D0-P2-04** – Locale / hreflang;
- **D0-P2-05** – JSON-LD / Entity Foundation;
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02.

Nach abgeschlossenem Continuity-Slice ist der fachlich naheliegende konfliktarme technische Candidate:

**D0-2 – Canonical / Origin / robots-sitemap Consistency.**

Warum D0-2 vor den anderen offenen D0-Themen:

- D0-1 hat die kritische private Index-Grenze bereits geschlossen;
- D0-P2-01 und D0-P2-02 bilden eine zusammenhängende technische URL-/Origin-/Canonical-Konsistenzschicht;
- D0 darf gemäß Build Order konfliktarm früh vorbereitet werden;
- D0-2 benötigt keine Rechtstexte, Datenbank, Provider oder Tracking-Aktivierung;
- Locale/hreflang und JSON-LD bleiben bewusst getrennte spätere D0-Slices statt Monster-PR.

D0-2 ist noch nicht gestartet. Vor Runtime werden eigener Task, Status, Branch und Draft-PR erstellt und `Jetnity growth discoverability` erhält danach einen engen Auftrag mit STOPP.

## 8. Trip Workspace – nächster Gate-Punkt

TW-1, TW-2, TW-4, TW-3 und TW-5 sind integriert.

TW-6 darf nicht automatisch starten:

- TW-6 Create-Entry: Abhängigkeit **dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag**;
- TW-7 Hub-Anschluss: Account-/Hub-Grenzen beachten;
- TW-8 Commercial Surfaces: erst nach Provider S5 / realer Commercial Provenance;
- TW-9 Polish/Evidence/Closure danach;
- finaler Function-by-Function-/Intelligence-Audit bleibt zwingend.

## 9. Agentenstatus

- `Trip workspace audit architecture`: TW-5 abgeschlossen; wartet.
- `Account plattform audit vorbereitung`: AP-1–AP-3 integriert; wartet.
- `Jetnity provider readiness audit`: S1–S3 integriert; wartet.
- `Admin platform audit`: A–C integriert; wartet.
- `Jetnity growth discoverability`: D0/G0 Audit + D0-1 integriert; aktuell STOPP bis Continuity abgeschlossen und D0-2 separat vorbereitet ist.
- `Jetnity quality security audit`: QS-1 abgeschlossen; reserviert für unabhängige Checkpoints.
- `Jetnity native app architecture`: reserviert für spätere Native-Phase.

Aktuell muss der Product Owner in Cursor **keinen neuen Agenten starten**.

## 10. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere Auth/Identity/Sessions/MFA/AAL, RLS/Ownership/Guest→Account, Traveller/Multi-Citizenship/Multi-Document, Route/Transit, Privacy/Consent, Billing/Payment, Admin Audit/Capabilities, Provider Activation, Attribution/Revenue/Claims Truth sowie Guardian/Simulator/Value Impact.

## 11. Supabase / Production

Supabase Production: `qscbgcdmivbbnzrcyegn`.

Zuletzt live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`;
- `20260824140000_flug_route_itinerary_untrusted_surface`.

Development enthält zusätzlich, weiterhin **nicht Production-approved**:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`;
- `20260824180000_trip_items_flug_handelsfelder_guard`.

PR #70/#71 und der aktuelle Continuity-Slice haben keinen Production-/DB-Scope.

## 12. Große Build-Reihenfolge

Weiter gemäß `docs/JETNITY_BINDING_BUILD_ORDER.md`:

1. Trip Workspace vollständig fertigbauen – abhängige TW-6/7/8, TW-9, finaler Audit.
2. Traveller/Pass/Multi-Citizenship produktweit vervollständigen.
3. Account AP-4 bis AP-12.
4. Provider Readiness S4 bis S8; echte Provider nur unter Gates.
5. Admin D–K plus Marketing/Growth Control Plane.
6. Homepage finalisieren.
7. AI/Search Discoverability / Authority phasengerecht.
8. Marketing/Growth G0–G5 phasengerecht.
9. Kommerzielle Produktschicht.
10. Guardian / What-if / Value und finaler Launch-Hardening-Audit gemäß Standards.

Konfliktarme D0-/G0-Vorbereitung darf parallel laufen; die große Reihenfolge darf ohne Product-Owner-Entscheidung nicht still verändert werden.

## 13. Offene Risiken

- `main` Branch Protection ist weiterhin nicht aktiviert.
- historische Draft-PRs/Handoffs bleiben nur Evidence ihres damaligen Stands.
- historische Auto-Merge-Aussagen sind für Ready/Merge superseded.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups.
- TW-6-PO-Schnitt/Guest-One-Trip-Vertrag ist vor TW-6 zu klären.
- D0-P1-03 Legal-404 bleibt offen und darf nicht mit erfundenen Texten geschlossen werden.
- Public-/Custom-Domain-/Indexing-Aktivierung bleibt ein getrenntes Gate.

## 14. Exakter nächster Schritt

1. Post-D0-1-Continuity-Diff vollständig prüfen.
2. Exact-Head CI/Vercel/Threads prüfen.
3. Unabhängigen Technical-Lead-Abschluss dokumentieren.
4. **STOPP und dem Product Owner den Continuity-PR zur Entscheidung vorlegen.**
5. Kein Ready/Merge ohne dessen ausdrückliche aktuelle Freigabe.
6. Nach Integration den separaten D0-2-Slice kontrolliert vorbereiten.
