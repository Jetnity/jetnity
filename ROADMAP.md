# Jetnity – Roadmap

<!-- OFFICIAL_TRUTH_V3_M04_POINTER_BEGIN -->

### M04 current — R26 / Recovery V17; same-invocation object reuse, full acceptance pending

**2026-11-10 14:56:02 UTC.** [Current Handoff](docs/official-truth-product-v3/M04_HANDOFF_V1.md) · [Root Review V17](docs/official-truth-product-v3/M04_RECOVERY_ROOT_REVIEW_V17.md) · [Task V17](docs/official-truth-product-v3/M04_RECOVERY_TASK_V17.md) · [Evidence V17](docs/official-truth-product-v3/M04_RECOVERY_R26_EVIDENCE_V17.json) · [live Draft #1182](https://github.com/Jetnity/jetnity/pull/1182). Later exact-head receipts/live evidence supersede this pre-publication snapshot.

Published **45be21e57988d91dca3ee0758712f3ef5f39d744** remains blocked: full CI 42830921607 failed. M04 passed 23/31 groups including 36 key cases/72 observations and both R9, then hit the ledger budget at started 237/completed 236/237 ACKs. All 27068 effects settled, 4242 connections closed, zero cleanup errors; following fixture DB outcome UNKNOWN. A separate 5s Chrome-version preflight failed before the actual lifecycle proof. Browser source remains unchanged.

Same G2 author delivered only canonical_v1's selected object-child reuse and 18 additional fixed N02 calls. Root/reviewer matched SQL **81bb875daa205d087b1f9faba7f3a41fd445bec14cbbe6b7a0aea628818ef820**, Native **d413d4de82548af38cbd7f54f226c2a72c582b4fd3e913b557793d8a3e12548c**, all-18 aggregate **aae92c558a32210c6f86d3140e00798fd6a36c5f942a9b4a8d9322ddc8a407ba**. All 29 declarations, other 16 sources, earlier oracles, 31 groups and bounds remain. No new-head execution or speed claim.

Actual main **4bfa8b466ebc0af761fc5050bb4c51d7e73400c7** remains separately unaccepted; origin #1178 remains genuinely R21-passed/MERGED. Preserve 15 old failures, distinct 16th failure, genuine success and all V13/V14/V15/V16 history. **M04 unfinished.**

First unfinished step: Root expected-45be publication/readback, complete new-head CI/native/lifecycle/Preview/live gates, then actual-main CI/native/Production. No agent Ready/Merge, unchanged-known-bad rerun or automatic next slice. D1 #1169/#1181 remain separate.

Method NOT_APPROVED; #1139 NOT_RELEASE_READY/17 gaps; #917 UNKNOWN/Stage2 NOT_ATTEMPTED without retry/substitute; #1131 Ready STOP, both #1135 holds, #968 isolation and #911/#913 privacy remain. SQL UNAPPLIED; no hosted/local-project/environment action. Full boundaries in V17.

<!-- OFFICIAL_TRUTH_V3_M04_POINTER_END -->

> **10.11.2026 – Reiseplanung und persönlicher Bereich:** Die gemeinsame Änderung umfasst Etappen mit manuellen Stopps und Karte, die direkten Einstiege in die Reisesuche, den Konto- und Reisebereich und den Weltatlas. Hotels und Flüge öffnen bis zur Freigabe offizieller Daten über die CJ-Partnersuche. [Umfang und Prüfung](docs/REISEBEREICHE_2026-11-10.md).

> **09.11.2026 – Produktziel V3 wird implementiert:** Ownerauftrag und [PROGRAM V1 / #1162](https://github.com/Jetnity/jetnity/issues/1162) erlauben jetzt Code, Tests und PRs. **In Arbeit:** S0 gemeinsames Datenformat in [Draft #1163](https://github.com/Jetnity/jetnity/pull/1163), parallel unabhängiger Reuse-Abgleich und D0 Dev-Paket #917/#1139. **Danach parallel:** I1 Import mit V3-Quellenentscheidung, U1 Besucherabfrage/Cache mit isolierten Testdaten, M1 Quellenüberwachung/Versionen/Queue/Recovery. **Anschließend:** E1 gemeinsame Integration, Fehler-/Konkurrenz-/Privacy- und gemessene Leistungstests. Erste überprüfbare Gesamtfassung grob 3–5 Arbeitstage; Schätzung, keine Aktivierungszusage. **Weiter gehalten:** tatsächliche #1139-Zielkorrektur, unabhängiger Stage1-Readback, #1131-STOP sowie konkrete Methoden-, Datenbank- und Production-Freigabe. Keine weiteren alten Stage1-Belege vom Owner vorhanden; keine erneute oder umgeleitete gesperrte Nachprüfung. Das eingefrorene V3-Dev-Paket dokumentiert seinen früheren Plan-only-Auftrag, nicht diesen neuen Implementierungsstand.

> **06.11.2026 – Einreisefunktion, AA-Protokollanbindung #1144 / Draft #1145:** Die fehlende quellenspezifische V2-Verarbeitung im bestehenden CH→DE-Anwendungspfad ist implementiert und mit synthetischem Material lokal geprüft. Vollständige CI, unabhängige Abnahme und Release sind offen. AA bleibt unregistriert, der Pilot ausgeschaltet. Danach fehlen weiterhin qualifizierter Quellentransport/-vertrag, wirksame Owner-/Session-Absicherung, tatsächlicher Datenbanknachweis und ein autorisierter vollständiger Anwendungstest. [Auftrag](docs/OFFICIAL_TRUTH_AA_APPLICATION_PROTOCOL2_1_TASK_2026-11-06.md) · [Prüfstand](docs/OFFICIAL_TRUTH_AA_APPLICATION_PROTOCOL2_1_HANDOFF_2026-11-06.md). Kein Gesamtfunktions-PASS.

> **04.11.2026 – Trip Maps JS V1:** Marker, Gruppierung, Stopplisten-/Tagesauswahl und Zustände im Draft #1112 implementiert. Lokale UI geprüft; echter Google-Preview-Test und unabhängiger Review offen. Kosten-/Consent-/Referrer-Gates bleiben geschlossen. [Prüfstand und begrenzter Pilotvorschlag](docs/TRIP_MAPS_JS_V1_HANDOFF_2026-11-04.md).

> **02.11.2026 – Mietwagen Layout 1:** Owner wünscht eine kompakte Suchvorbereitung, 3–4 Fahrzeugkarten pro Desktopreihe und eine aufgeräumte Mietwagenseite. Suchkasten, responsives Kartenraster, gruppierte Angebotsdetails und aufklappbare manuelle Erfassung umgesetzt. Native Suche aus PR #1109 bleibt erhalten. [Prüfstand](docs/RENTAL_SEARCH_LAYOUT_1_EVIDENCE_2026-11-02.md); exakter Release-Stand im Live-Index #751.

> **02.11.2026 – DiscoverCars Native Search 1:** Umsetzung auf `feat/discovercars-native-search-1`: native Stationssuche, echte Fahrzeugangebote, lokale Filter, Vergleich und Angebotsdetails. Offizieller API-Zugang und Onsite-Anzeigerechte liegen vor; reale Stations-/Angebots-/Detailabrufe sind erfolgreich. Prüfung, unabhängiger Review und Release laufen; noch kein Production-PASS. Buchung bleibt beim Anbieter, Suchklicks erzeugen keinen Reiseeintrag. [Prüfstand und nächste Schritte](docs/DISCOVERCARS_NATIVE_SEARCH_1_EVIDENCE_2026-11-02.md).

> **02.11.2026 — Homepage Reiseintelligenz 2:** Der Owner hat die Darstellung des
> fertigen Reisebegleiters mit automatischer Plananpassung, persönlicher
> Einreisevorbereitung und Gesamtkosten freigegeben. Implementierung im Branch
> `codex/homepage-reiseintelligenz-20261102`; Prüfung und Veröffentlichung werden
> im [Prüfstand](docs/HOMEPAGE_REISEINTELLIGENZ_2_EVIDENCE_2026-11-02.md) geführt.
> Der Auftritt ersetzt die Final-1-Positionierung. Er aktiviert keine Überwachung,
> Einreiseprüfung oder Umbuchung; deren technische Abnahmen bleiben getrennt.
> Indexierung bleibt auf ausdrücklichen Owner-Wunsch gesperrt.

> **02.11.2026 – Homepage Final 1:** Finaler Kundenauftritt mit verständlicher Reiseplaner-Positionierung, Reisebeispiel, Vorteilen, Inspiration und FAQ umgesetzt. Entwicklungsstatus-Matrix nach aktuellem Owner-Auftrag ersetzt. SEO/Share/SSR vorbereitet; öffentliche Indexing-/Launch-Freigabe bleibt separat, unverändert geschlossen. Lokale Prüfungen und unabhängiger Root-Review sind in [Evidence](docs/HOMEPAGE_FINAL_1_EVIDENCE_2026-11-02.md) getrennt dokumentiert; kein behaupteter Hosted-Release.

> **02.11.2026 – Workspace-Navigation:** Weißer, vollbreiter Header und automatische Desktop-Symbolleiste umgesetzt; native DOM-Ereignisse berücksichtigen die über Portale eingebundene Reise-Navigation. Konto/Darstellung nur als Symbole, GeoNames-Nachweis über die öffentliche Quellen-Seite. Technische und unabhängige Release-Abnahme laufen. [Prüfstand](docs/WORKSPACE_NAVIGATION_1_EVIDENCE_2026-11-02.md).

> **02.11.2026 – Organisieren auf Desktop vereinheitlicht:** Alle vier Kategorien stehen über dem vollbreiten Inhalt; der Aktivitäten-Akzent endet innerhalb der Kartenrundung. Begrenzte Darstellungsänderung, unabhängige lokale Browser- und technische Abnahme erfolgreich; vollständige CI/Vorschau/Release folgen. [Prüfstand](docs/ORGANISIEREN_DESKTOP_1_EVIDENCE_2026-11-02.md).

> **02.11.2026 – DiscoverCars auf Jetnity:** Offizielles Suchformular mit echter Orts-/Datums-/Fahrerwahl umgesetzt und lokal im Browser geprüft; Affiliate-Übergabe bis zur externen Fahrzeugliste belegt. Native Fahrzeugkarten sind von verifiziertem Search-API-Zugang abhängig; Anfrageentwurf vorbereitet, nicht versandt. Vollständige CI/Hosted-Release-Abnahme folgt auf dem finalen Head. Draft #1084 und gemeinsame CMP-/Host-Vorbereitung bleiben separat. [Prüfstand und nächster Schritt](docs/DISCOVERCARS_ONSITE_EVIDENCE_2026-11-02.md).

> **01.11.2026 – Orts-/Länderqualität, PR #1103:** Implementierung und Development-Prüfung laufen; Production-Migration/Referenzdatenrefresh noch nicht freigegeben. [Aktueller Prüfstand und nächster Schritt](docs/PLACES_PLANNING_QUALITY_EVIDENCE_2026-11-01.md). Root alleiniger Writer, separate unabhängige Reviews. Dieser Hinweis ist der aktuelle Stand dieses Slices; ältere Einträge bleiben historische Snapshots.

> **12Go Timetable 1 — 1. November 2026:** PR #1101 ist regulär gemergt, Main `68071953355e1164891611e7eea9a26c00c7cd6a` auf jetnity.com aktiv. Deutsch/CHF, allgemeine Angaben ohne Datums-/Teilnehmerübertragung. [Release-Nachweis](https://github.com/Jetnity/jetnity/pull/1101#issuecomment-6561940221). Der anschließende Owner-Befund zeigt eine Lücke der kleinen Ortsabdeckung: Bangkok ADM1 (`1609348`) fehlt, während die Stadt-ID (`1609350`) funktioniert. Die eng begrenzte [Korrektur](docs/TWELVE_GO_BANGKOK_REGION_FIX_TASK_2026-11-01.md) ist separat in Prüfung; frühere Stadt-Tests belegen diese Variante nicht. PR #1086 bleibt separat auf HOLD. [Evidence](docs/TWELVE_GO_TIMETABLE_1_EVIDENCE_2026-11-01.md).

> **01.11.2026 — Aktivitäten zielgeführt, beide offiziellen Widgets:** PR #1100, Codex nach freigegebener Cursor-Übergabe. Direktes Öffnen zum bestätigten Ziel, optionale Tageswahl, beide offiziellen Widgets vor der erhaltenen nativen Suche. Viator zeigt nach Korrektur des Nullhöhen-Starts echte Karten (7 Render, 0 Klicks/403). GYG-Karten sichtbar, Testklick HTTP403; STOP bleibt. Der Owner hat die automatische Anzeige und Veröffentlichung nach Prüfung freigegeben und die umfassende Datenschutzarbeit verschoben; tatsächliche Ablehnungen/Ausblenden bleiben wirksam, gemeinsame CMP bleibt inaktiv. 208 fokussierte Tests, Typen, Lint, Build und Hygiene bestanden; lokale Gesamttest-Ausnahmen dokumentiert. Unabhängige Prüfung, Exact-Head-CI/Preview und Releaseentscheidung stehen bei dieser Revision noch aus. [Handoff](docs/ACTIVITIES_DESTINATION_FIRST_1_HANDOFF_2026-11-01.md).

> **01.11.2026 — Trip.com Suchlinks 1:** Der Owner hat die offizielle manuelle Suche
> als ersten Schritt freigegeben. Implementiert wird ein externer Hotel-/Flugsucheinstieg
> im vorhandenen Trip Workspace, mit lokaler Reisehilfe. Automatische kontextbezogene
> Ergebnisse, Widgets und API-Zugang sind damit nicht umgesetzt. Veröffentlichung erst
> nach den regulären Prüfungen; [Plan und Belege](docs/TRIPCOM_SUCHLINKS_1_PLAN_2026-11-01.md).
> Die separaten DiscoverCars-, 12Go-, Viator- und CMP-Gates bleiben unverändert.

> **30.10.2026 – gemeinsamer Konto-/Trip-Workspace, freigegebene Darstellung:**
> PR #1092 ist auf main `6b929baec81e6c561142db4e6a9636e1bb30c873` gemergt und
> in Production geprüft. Einklappbare Glas-Navigation, gemeinsamer Header und mobile
> Reisebereiche. Fachlogik, beide Planungswege und „Jetzt wichtig“ bleiben.
> Lokale Prüfungen und Grenzen stehen im
> [Report](docs/UNIFIED_WORKSPACE_1_REPORT_2026-10-30.md).
> Nach Owner-Rückmeldung sind auch die Inhaltsflächen an die grüne Vorlage
> angeglichen: kompakter Reisekopf, Jetzt-wichtig-Panel mit Reiseprüfung und
> kanonischer Routenüberblick. [Visueller Nachreview](docs/UNIFIED_WORKSPACE_1_VISUAL_ALIGNMENT_2026-10-30.md).
> Die angemeldete develop-Kontoprüfung (13 Fälle), Preview-Gastprüfung (7 Fälle)
> und Production-Gastprüfung (13 Fälle) bestanden; Main-CI ebenfalls.
> [Abschlussbeleg](https://github.com/Jetnity/jetnity/pull/1092#issuecomment-6521940523).
> Noch offen bleiben der kombinierte Abgleich mit #1082 sowie echte Geräte/VoiceOver.
> Owner-Folgeauftrag: standardmässig hell, grünes Design mit einem Klick im Header,
> lokale Farbauswahl merken. [Auftrag](docs/WORKSPACE_THEME_1_TASK_2026-10-30.md).
> Dieser begrenzte Folgeauftrag befindet sich in unabhängiger Prüfung und ist
> noch nicht als veröffentlicht bestätigt.
> Bestehende Anbieter- und Product-Owner-Gates bleiben unverändert.

<!-- R109_ROOT_CONTINUITY_POINTER_BEGIN -->
## Aktueller R109-Checkpoint — fünf Produkt-Lanes akzeptiert

**2026-10-26 16:26:25 UTC; Modus NORMAL.** S/T/A/U/K sind jeweils unabhängig auf tatsächlichem main abgenommen. Akzeptierter Produkt-main: `e070a39dccaa51c4d768a7f9d744821ee50fb0a3`. Der eigene endliche Docs-Abschluss ist bei Erstellung dieses Commits noch offen; seine spätere Abnahme steht in den Live-Receipts.

Aktueller kombinierter [Technical-Lead-Handoff und Continuity-Checkpoint](docs/JETNITY_R109_FINITE_BATCH_CLOSURE_HANDOFF_2026-10-26.md). Zuerst weiterhin den verbindlichen Technical-Lead-/Cursor-Betriebsstandard lesen; danach diesen neuen Handoff, ACTIVE_WORK_STATUS und die Live-Indizes [#751](https://github.com/Jetnity/jetnity/issues/751) / [R109#1026](https://github.com/Jetnity/jetnity/issues/1026) samt neuesten Root-Review-/Merge-/Post-Merge-Receipts.

[Letzte tatsächliche Produkt-Abnahme K](https://github.com/Jetnity/jetnity/pull/1036#issuecomment-6421260513). Die fünf einzelnen FINAL-/POST-PASS-Belege, Originalsessions, verbleibende Phase1-Abhängigkeiten und besonderen PO-Gates sind im neuen Checkpoint zusammengeführt. Geerbte A-P2-KPI-Frische, U-P3-Layout, breiter Dependency-Audit, Viator-Anbieterbedingungen und übrige V1-Gates bleiben sichtbar. Kein Gesamtprodukt-/Launch-PASS.

**Erster offener Schritt dieses Snapshots:** endlicher Root-Docs-PR mit eigenen Exact-Head- und tatsächlichen Main-Gates. Spätere aktuelle Wahrheit gewinnt; #751/#1026 zeigen, wenn dieser Schritt abgeschlossen ist. Alle fünf Produkt-Autoren STOP. Kein sechster Produktauftrag und kein automatischer Folgeslice. Die historischen Inhalte unter diesem Block bleiben unverändert.
<!-- R109_ROOT_CONTINUITY_POINTER_END -->

> **GetYourGuide Manual Widget Integration 1 — 26. Oktober 2026, Draft, kein PASS.** Draft [PR #1041](https://github.com/Jetnity/jetnity/pull/1041), Tracking [#1040](https://github.com/Jetnity/jetnity/issues/1040), Eltern [#1023 V5](https://github.com/Jetnity/jetnity/issues/1023). Der dokumentierte manuelle Suchweg `data-gyg-q` ist auf dem Zweig `feat/getyourguide-manual-widget-integration-1` gebaut: öffentlicher Ortsname und Land, neutraler Rahmen ohne `allow-same-origin`, ausdrückliches Anzeigen und Entfernen. Die geschlossene Grundlage darunter bleibt historische Evidence und ist auf main über PR #1039 angenommen. Kein Viator, keine Production-Aktivierung, kein Ready und kein Merge durch diesen Stand. Technical Lead R1 verlangt eine Höhenmeldung ohne Messschleife und mit Schrumpfen. Diese Korrektur liegt auf demselben Draft und ist kein PASS. Technical Lead prüft den exakten Head. Der R109-Block darüber bleibt unverändert.

> **GetYourGuide Visual Discovery Foundation 1 — 26. Oktober 2026, nur Code, inaktiv.** Draft [PR #1039](https://github.com/Jetnity/jetnity/pull/1039), Tracking [#1038](https://github.com/Jetnity/jetnity/issues/1038), Eltern [#1023 V5](https://github.com/Jetnity/jetnity/issues/1023). Die Jetnity-Seite unterscheidet Stadt, Region, Insel und Land und hält Abbildung, Renderer und Ortsresolver geschlossen. Review R1 korrigiert die geschlossene Grundlage: eigener Knoten je Ladung, Typ und öffentliche Kennung im Kontext, keine automatische Länderentscheidung bei unsicherer weiterer Etappe. Am ausgewählten Tag bleibt ein fehlender oder nicht bereits grossgeschriebener kanonischer Landescode unbestätigt. Eine erfüllte Ablehnung entsorgt genau diese Ladung sofort und zeigt den festen deutschen Satz. Überschrift und eigene Aktion bleiben bei grosser Schrift im eigenen Feld. Work V2 ist als Nachweis empfangen und nicht aktiviert. Bildangebote, Analyzer und das manuelle Widget sind nicht eingerichtet. Kein Viator, keine Production-Aktivierung, kein Ready und kein Merge durch diesen Stand. Technical Lead prüft den neuen Head erneut. Der R109-Block darüber bleibt unverändert.

> **R108-A — Aktivitäten, Suche und Auswahl, 26. Oktober 2026.** Draft [PR #1025](https://github.com/Jetnity/jetnity/pull/1025), Tracking [#1024](https://github.com/Jetnity/jetnity/issues/1024). Review R2 bleibt offen bis zum exakten Head: die Übernahme ist die bestehende Schreiber-Momentaufnahme, einschliesslich gerundeter Bewertung. Eine Meldung ohne aktuelle Karte nennt die erfasste Aktivität. Ein Audit-Aufruf oder eine Freigabe ohne erfassten Abschluss gilt als Fehler. Laufzeitnachweis `3c24d85509ace94bc6f69ecbef6b333ec0c2d611`. Der Review-Head ist der nachfolgende Dokumentations-Commit. Die früheren Heads `8224f7ce`, `055055ac`/`05d6f934`, `0bd3ddd1`, `d8f89dc4` und `79a10961`/`5202613a` sind nicht der Review-Stand. Anbieterklärung bleibt [#1023](https://github.com/Jetnity/jetnity/issues/1023). Kein Viator, keine Production-Aktivierung, kein Ready und kein Merge durch diesen Stand. Technical Lead prüft den exakten Head. Ältere Blöcke bleiben historische Evidence.

> **R107 — fünf begrenzte Lanes T → S → D → W → M actual-main abgeschlossen; Stand 25. Oktober 2026, 22:15:20 UTC.** Nach dem [Technical-Lead-/Cursor-Betriebsstandard](docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md) den [R107-Handoff](docs/JETNITY_R107_FINITE_BATCH_CLOSURE_HANDOFF_2026-10-25.md), den [Continuity-Checkpoint](docs/JETNITY_R107_POST_MERGE_CONTINUITY_CHECKPOINT_2026-10-25.md), [V24 / Live-Index #751](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6404106059) und [Auftrag #1011](https://github.com/Jetnity/jetnity/issues/1011) lesen. Alle fünf Produkt-PRs und Trackings sind abgeschlossen. Root verifizierte Main `b932d15ac99fe4bbb1f3ecc22579e5c2e9c15006`, Tree `503752c1bee097f5bba47487061415730429cc57`, native CI sowie Production und direkte Domain; [M-POST-MERGE-PASS 6404092020](https://github.com/Jetnity/jetnity/pull/1019#issuecomment-6404092020). **Erster noch offener Schritt ist der endliche Dokumentationsabschluss durch Root mit eigenen Docs-Gates; kein automatischer sechster Task.** S bleibt Triage mit 40 vorläufigen P1 und zwei P2 ohne Remediation. Sämtliche besonderen Holds bleiben erhalten. Neuere Live-Receipts bestimmen den tatsächlichen Fortsetzungsstand.

> **R106 — begrenzter Fortschritt in Admin, Account und Trip Workspace (25. Oktober 2026).** Nach dem [Technical-Lead-/Cursor-Betriebsstandard](docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md) den [R106-Handoff](docs/JETNITY_R106_FINITE_BATCH_CLOSURE_HANDOFF_2026-10-25.md), [Live-Index #751](https://github.com/Jetnity/jetnity/issues/751) und [Auftrag #1003](https://github.com/Jetnity/jetnity/issues/1003) lesen. Dort stehen die getrennten Abnahmestände von O (PR #1007, Tracking #1004), A (PR #1008, Tracking #1005) und T (PR #1009, Tracking #1006) sowie der erste noch offene Schritt. Den späteren Docs-PR und seine eigenen Gates stets live rekonstruieren.
>
> **Kein automatischer vierter Produktauftrag.** Der begrenzte Abschluss erklärt weder diese Produktbereiche insgesamt noch V1 oder Launch für fertig. Bestehende Holds und Sondergates bleiben verbindlich. Ältere datierte Arbeitsstände darunter bleiben unveränderte historische Evidence; dauerhaft gültige Verträge bleiben bestehen. Live-Evidence gewinnt.

Stand: 22. September 2026  
Status: **Kanonischer Post-PR-#113/#114-Programmstand. Foundation C/D/E, Safety, Seasonal, AP-1–AP-4, Admin A–C, Provider S1–S3 + S5-A, TW-1/2/4/3/5, TW6-A, TW6-B Runtime, Visitor Search UX, TW7-A, D0-1/D0-2, P1-D0-LIVE-01, QS-1/QS-2, P1-QS2-02, P1-TA-02, Admin-AAL2 einschließlich Production-Alignment sowie P2-TA-06 sind integriert. Live-`main` immer live prüfen.**

> **Live-Evidence gewinnt immer.** Diese Roadmap definiert Reihenfolge und Programmstatus, aber keine alte SHA oder alte Slice-Aussage darf einen neueren Live-Zustand überschreiben.

> **Admin F supersession — Lieferzeitpunkt 28. September 2026.** Der 22-September-Einstieg darunter nennt #545 noch als `DISPATCHED_START_UNVERIFIED` / `TASK_ONLY`. Das ist die Beobachtung jenes Tages. #545 ist seitdem gemergt (akzeptierter Head `43720a65ca5296e2009158ccd0bce6b30796ca95`, Merge `8fcccd6475f41703bd2a31deecb3067391f330b4`). Die begrenzte Bereichspalette ist gebaut. [PR #606](https://github.com/Jetnity/jetnity/pull/606) war beim Schreiben dieses Satzes ein Draft im Technical-Lead-Review. Das ist kein dauerhafter Writer-Status und kein Vorgriff auf PASS, Merge oder ein Deployment nach dem Merge. Live-Regel: solange #606 offen ist, unabhängiges Technical-Lead-Review des exakten Heads; sobald #606 gemergt ist, Reconciliation geschlossen, nicht erneut dispatchen, Technical-Lead-Closure auf #606 lesen, vor der nächsten begrenzten Arbeit frischer Precheck. Keine zweite Palette. R1: `docs/ADMIN_F_RECONCILIATION_1_REPORT_2026-09-28.md` §10.

Aktueller Einstieg (22. September 2026; Heads live rekonstruieren, nicht hier einfrieren): Machine mode auf live `main` ist `NORMAL`. Canonical current-work checkpoint: `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-22.md` (wenn noch nicht auf `main`, von Branch `docs/v1-continuity-refresh-2` / PR #546 lesen; nach Merge von `main` lesen und diese Session nicht reaktivieren). Live `main` ist `d03a048624b42cb0b2a1cb0e146aed238e23041f` nach geschlossenem Homepage-Routeneintrag #543 und Remaining-Build-Map #544. #512/#506/#509/#510 sind geschlossen, keine aktuellen Writer. Die erste read-only Intelligent Admin / Copilot-Pro-Foundation (#510 / #508) ist spezifiziert/gemergt. #545 Admin-Navigationssuche bleibt eine reservierte Runtime-Zuweisung (`DISPATCHED_START_UNVERIFIED` / `TASK_ONLY` bei der 22-Sep-Beobachtung; kein verifizierter laufender Writer und kein Launch-Blocker). Continuity Refresh 2 (#546) besitzt nur die benannten globalen Current-State-Dateien; #546-Status live rekonstruieren. Assistant Runtime 1, Mobile Accessibility 1, Assistant Truth Context 1, World Map 1, Destination Essentials 1, Flight Multi-Leg (ADR-0207) und 0..N orchestration (ADR-0208 / #414) bleiben auf `main` geschlossen. HOLD-Closure #492, Architecture #487 und lokaler Producer-Proof #494 sind geschlossen; Finding 5.2 / Gate G bleiben offen. Provider-later, drei Phasen und besondere Product-Owner-Gates bleiben. Keine Providerwahl, kein Live-Transport, kein Ready, kein Merge durch diese Roadmap. Historische Abschnitte unten bleiben Programm-Evidence und dürfen diesen aktuellen Stand nicht überschreiben.

Die ausführliche vorherige Roadmap-Fassung bleibt byte-identisch als historische Evidence erhalten unter:

- `docs/history/ROADMAP_PRE_PR113_2026-08-27.md`

Für Entscheidungen zusätzlich lesen:

- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`
- `docs/CHATGPT_PR113_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-27.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Eine Reise, eine Oberfläche. Komplexität intern, Klarheit für den Nutzer.**

## 1. Abgeschlossen / auf `main`

### Produkt- und Qualitätsfundament

- Jetnity V2 Produktvision / Product Mandate
- Product Quality Standard
- UX-/Informationsarchitektur-Standard
- Logic Standard
- Continuity Standard
- Independent Review Depth Standard
- Technical-Lead-/Cursor-Governance
- Product-Owner-Merge-Governance
- Mobile-first / Device-Parity-Grundsatz

### Reise-Kern

- Reiseidee / Trip Builder Foundation
- Trip-Persistenz
- Guest → Account Foundations
- Trip Workspace Foundation
- Revisionslogik
- gemeinsamer Reisegraph
- Booking Status / Coverage

### Foundation C – Automatic Travel Requirements & Readiness

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

### Foundation D – Route & Transit Intelligence

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

### Foundation E – Traveller Context / Multi-Citizenship / Multi-Document

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

Kanonisches Modell:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine stille Citizenship-Annahme aus Residence, Standort, Abflugland, Sprache, Domain oder Issuer Country.

### Travel Safety & Disruption

Provider-neutrale Foundation abgeschlossen und integriert. Keine erfundene Safety Truth.

### Travel Timing & Seasonal Intelligence

Provider-neutrale Foundation abgeschlossen und integriert. Saisonales Muster ≠ akute Safety-Warnung.

## 2. Account / Traveller

Integriert:

- AP-1 – persönliches Zuhause
- AP-2 – Auth-UX-Hygiene
- AP-3 – abgeleitete Reisegruppen
- AP-4 – Account Archive Lifecycle / PR #108
- AP-4 Continuity / PR #111
- P1-TA-02 – Official Evaluation Option Scope
- P2-TA-06 – Readiness Credential Normalization / PR #113
- Issue #112 CLOSED / completed

P2-TA-06 ist **nicht mehr Draft und nicht mehr offen**. `travellerNormalisieren()` darf mehrere Dokumente ohne explizite `credentialOptions` nicht auf `documents[0]` kollabieren.

Weiterhin gilt:

- kein Default-Pass
- kein Default-Citizenship
- Issuer Country ≠ Citizenship
- `documents[0]` / `evaluations[0]` sind keine Product Truth

P2-TA-03 ist durch PR #117 integriert. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` ist der kanonische Folgeplan für AP-5–AP-12. Historischer PR #39 bleibt Historical Evidence.

P2-TA-04 Gate 0 ist durch PR #120 integriert. C1 ist durch PR #126 integriert: Delete-RPC, DB-Party-Cap 20, Child-Limits auch bei UPDATE. Production C1 live als `20260828015304`. Kein C2. AP-5 Gate 0 ist durch PR #129 integriert. AP-5-S1 ist durch PR #133 integriert. AP-5-S2 ist durch PR #137 integriert. AP-5-S3 ist durch PR #157 integriert. AP-5-S4 ist durch PR #160 integriert. AP-5-S5 ist durch PR #164 integriert. AP-6a Gate 0 / ADR-0195 / PR #166 ist integrierte historische Architecture-Evidence. `/privacy` und `/impressum` sind seit PR #579 als offizielle PrivacyBee-Embeds integriert und live geprüft (27. September 2026, ADR-0213); `/terms` bleibt ungebaut und Legal-/PO-Content-gegatet.

Nicht automatisch starten:

- AP-6a-Runtime / AP-6b / AP-7 / AP-5-P1–P5
- AP-7 / Account-Traveller-Registry — Architektur Dual-Authority freigegeben; S1 Domain-Contract über PR #145 auf `main @ 4ec83f36` integriert, kein automatisches S2, keine Persistenz
- Node 22 Runtime Consistency — PR #147 integriert auf `main @ 56aff7ff` (`engines.node: "22.x"` + `@types/node@22.20.1`)
- Next.js Framework Security Upgrade Gate 0 — PR #148 integriert auf `main @ 2fdf8a18`; Ziel 16.x Active LTS live-resolved (Minimum `16.3.3`) bleibt Empfehlung, nicht angewendet
- Next 16 Product-Owner-Freigabe — PR #149 integriert; autorisiert das gestufte Compatibility-Programm
- Next 16 Compatibility Prep S1 — PR #150 integriert auf `main @ d7f02f77`; async Request-API-Prep; kein automatischer Folgeslice aus S1
- Next 16 S2 Framework Bump — auf der S3-Baseline über PR #152 / `main @ 3c3079de` integriert; ältere Draft-#151-Zeilen sind Pre-Merge-Evidence
- AP-5-S3 Account Security Logout Scopes — PR #157 integriert auf `main @ 5920860e`
- AP-5-S4 Account Security MFA Step-up — PR #160 integriert auf `main @ 934d43da`
- AP-5-S5 Honest Current Session / Device View — PR #164 integriert auf `main @ 765fc547`
- AP-6a Gate 0 Legal Foundation / Trust Boundary — PR #166 / ADR-0195 integriert; `/privacy` und `/impressum` seit PR #579 als offizielle PrivacyBee-Embeds live geprüft; `/terms` weiterhin ungebaut und Legal-/PO-Content-gegatet; kein AP-6a-Runtime / AP-6b / AP-7 automatisch

## 3. Trip Workspace / Visitor Search

Integriert:

- TW-1 Shell / Device-Parity
- TW-2 Reiseübersicht
- TW-4 Aufmerksamkeit / Jetzt wichtig
- TW-3 Timeline / Etappe / Tag
- TW-5 Item- und Gap-Details
- TW6-A Create-Entry Alignment
- TW6-B Gate 0 / Gate 0B Provenance
- TW6-B Runtime / PR #87
- `TW6-REST-01` CLOSED
- Visitor Search UX / PR #94
- TW7-A Runtime / PR #106
- Issue #103 CLOSED / completed

TW-8 bleibt hinter Provider S5-B / belastbarer realer Commercial Provenance gegated. TW-9 nicht automatisch starten.

Separate Search-/Homepage-Themen:

- Issue #109 – Country-Alias-Ranking: PR #172 plus Recovery-PR #173 auf `main @ ade03511` integriert. Live Production API smoke PASS. Technical Lead hat #109 **CLOSED / COMPLETED**. Residual P2: Mobile Safari Real-Device. PR #178 ist nur Docs/Continuity-Träger; Live-Zustand prüfen. Auf `main` ist die Pre-Merge-#178-Klausel historisch.
- Issue #169 – PrivacyBee Schweiz Gate 0: über #175/#176 auf `main` integriert, **CLOSED / COMPLETED**. Damals keine Vendor-Aktivierung. Technische Aktivierung später mit PO-Auftrag in #579 umgesetzt und live geprüft. Keine neuen Kosten durch #579.
- Issue #110 – natürliche Homepage-Mehrziel-Eingabe: dokumentiert, **nicht gestartet**.

## 4. Provider / Commercial Provenance

Integriert:

- S1 Shared Operational Contract
- S2 Flight Evidence Foundation
- S3 Mobility/Rental Evidence
- S5-A Commercial Provenance Domain Contract

Production Gate A hat die dafür freigegebenen Production-Schritte bereits ausgeführt und verifiziert. Frühere Roadmap-Aussagen, S2-Production sei noch nicht freigegeben, sind historische Pre-Apply-Evidence.

Weiter offen/gated:

- S5-B Persistenz integriert; Production-Migration `20260829140000_trip_item_commercial_provenance` angewendet und verifiziert. Runtime-Write-Pfad/Principal nicht allokiert. Kein realer Provider-Snapshot. TW-8 geschlossen
- keine realen Provider
- keine Production Secrets
- keine Verträge
- keine paid calls
- keine Provider-Live-Aktivierung

## 5. Admin / AAL2

Integriert:

- Admin Slice A
- Admin Slice B
- Admin Slice C
- zentraler Admin-AAL2 Application Guard
- P1-AAL2-PROD-01 Alignment
- Apply-Gate-Closure / PR #102

Aktuelle Production-Wahrheit:

- `20260827170000_admin_aal2_data_plane_alignment` ist **angewendet und verifiziert, exakt einmal**
- `aktuelles_admin_aal2()` ist live
- Admin-Capabilities verlangen Rolle **UND** aktuelles AAL2
- kein zweiter Apply

Frühere Roadmap-Zwischenstände wie „Production-Datenebene nicht angewendet“ oder „nächster Schritt = Production-Apply“ sind historische Pre-Apply-Evidence und nicht mehr aktuell.

## 6. Production Gates

### Gate A

**PASS.** Die freigegebenen Flight-Commercial-Guard-Schritte wurden angewendet und semantisch verifiziert.

### Gate B

**Operativ PASS.** Der Vier-Datei-Vertrag

`20260826220000 → 20260826230000 → 20260826240000 → 20260827010000`

ist bereits angewendet.

**Kein Re-Apply.**

Direction A bleibt separat und nicht automatisch gestartet.

## 7. D0 / Growth / Domain

Integriert:

- D0-1
- D0-2
- P1-D0-LIVE-01

Kanonische Domain:

- `https://jetnity.com`
- `*.vercel.app` niemals kanonisch
- `jetnity.ch` später Entry / Redirect

Default bleibt fail-closed / noindex bis ausdrückliches Gate.

Kein Domain Cutover, Public Indexing, D1/G1 oder Growth-Folgeslice automatisch starten.

## 8. Quality / Security / Sanitation

QS-1/QS-2 und relevante P1-Hardening-Slices sind integriert.

Project-Sanitation: Issue #134 ist der aktuelle Closure-/Retention-Slice. PR #88 bleibt historische Evidence vom 26.08.2026, nicht Current Truth (`CLOSE-SAFE` / Branch `HISTORICAL-EVIDENCE`). Aktuelle Matrizen: `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`. ADR-0184.

Kein automatisches:

- Branch Delete
- Supabase Delete
- Vercel Delete
- Cloud Decommission
- Secret-/Provider-Aktivierung

Weitere Security-/Performance-Advisories werden nach Live-Evidence separat priorisiert.

## 9. Aktuelle verbindliche Ausführungsreihenfolge

Abgeschlossen:

1. ✅ Foundation C – Readiness
2. ✅ Foundation D – Route & Transit
3. ✅ Foundation E – Traveller Context
4. ✅ Safety & Disruption Foundation
5. ✅ Timing & Seasonal Foundation
6. ✅ AP-1 / AP-2 / AP-3 / AP-4
7. ✅ Provider S1–S3
8. ✅ Trip Workspace Audit / Zielarchitektur
9. ✅ TW-1 / TW-2 / TW-4 / TW-3 / TW-5
10. ✅ P1-QS2-02
11. ✅ P1-TA-02
12. ✅ TW6-A
13. ✅ TW6-B Runtime / `TW6-REST-01`
14. ✅ Visitor Search UX / PR #94
15. ✅ Provider S5-A
16. ✅ D0 live metadata boundary
17. ✅ Admin-AAL2 Application Guard
18. ✅ Production AAL2 Alignment + Apply-Gate-Closure
19. ✅ TW7-A / Issue #103
20. ✅ AP-4 / PR #108 + Continuity #111
21. ✅ P2-TA-06 / PR #113 + Issue #112
22. ✅ Post-PR-#113 Continuity / PR #114
23. ✅ Post-PR-#114 Continuity / PR #115 auf Live-`main` `43aef643` (immer live neu prüfen)
24. ✅ P2-TA-03 Account-Plan-Reconciliation / PR #117 + Issue #116
25. ✅ P2-TA-04 Traveller Child Write-Path Gate 0 / PR #120 + Issue #119
26. ✅ P2-TA-04 C1 Traveller write-contract integrity / PR #126 + Issue #122
27. ✅ AP-5 Gate 0 Account security capability audit / PR #129 + Issue #128
28. ✅ AP-5-S1 ehrliche Security-UI Zustände / PR #133 + Issue #132; ADR-0183
29. ✅ Project Sanitation Closure / PR #135 + Issue #134; ADR-0184; kein Cleanup
30. ✅ AP-5-S2 eingeloggte Passwortänderung / PR #137 + Issue #136 CLOSED / completed; Merge `f11a1753`
31. ✅ AP-5-S2 Post-Merge Continuity / PR #138 – integriert; ältere Draft-Sätze sind Pre-Merge-Evidence
32. ✅ Provider S5-B Gate 0 / PR #141 – docs/readiness only; Zielarchitektur später ADR-0197; S5-B Runtime nicht gestartet
33. ✅ Technical Lead / Cursor Operating Standard / PR #142 – integriert; Merge `9d4778b8`
34. ✅ PR #142 Post-Merge Continuity / PR #143 – integriert; Merge `1947285c`
35. ✅ AP-7 Gate 0 Account-Traveller-Registry Architecture / PR #144 – integriert; Merge `bb38aef5`; Dual-Authority danach product-owner-freigegeben
36. ✅ AP-7-S1 Dual-Authority Domain Contract / PR #145 – integriert auf `main @ 4ec83f36`; kein automatisches S2
37. ✅ Node 22 Runtime Consistency / PR #147 – integriert auf `main @ 56aff7ff`; ADR-0188
38. ✅ Next.js Framework Security Upgrade Gate 0 / PR #148 – integriert; Ziel 16.x Active LTS live-resolved (Minimum `16.3.3`)
39. ✅ Next 16 Product-Owner-Freigabe / PR #149 – integriert; autorisiert das gestufte Compatibility-Programm
40. ✅ Next 16 Compatibility Prep S1 / PR #150 – integriert auf `main @ d7f02f77`; ADR-0190
41. ✅ Next 16 S2 Framework Bump / PR #152 – integriert auf `main @ 3c3079de`; ältere Draft-#151-Zeilen sind Pre-Merge-Evidence
42. ✅ AP-5-S3 Account Security Logout Scopes / PR #157 – integriert auf `main @ 5920860e`; explizite `local`/`others`/`global` in `/account/security`
43. ✅ AP-5-S4 Account Security MFA Step-up / PR #160 – integriert auf `main @ 934d43da`
44. ✅ AP-5-S5 Honest Current Session / Device View / PR #164 – integriert auf `main @ 765fc547`
45. ✅ AP-6a Gate 0 Legal Foundation / Trust Boundary / PR #166 – integriert (ADR-0195 / Merge `6083ee63`); historische Architecture-Evidence. `/privacy` und `/impressum` seit PR #579 als offizielle PrivacyBee-Embeds live geprüft; `/terms` weiterhin ungebaut und Legal-/PO-Content-gegatet.
46. ✅ Provider S5-B Option C Architecture Acceptance / PR #180 – Zielarchitektur angenommen (ADR-0197)
47. ✅ Provider S5-B Persistence / PR #182 + Recovery #183 – Schema + RLS + Write-Authority integriert (ADR-0198). Production-Migration `20260829140000_trip_item_commercial_provenance` angewendet und verifiziert. Runtime-Write-Pfad/Principal nicht allokiert. Kein realer Snapshot. TW-8 geschlossen. Ältere „#182 offen / Production-Apply pending“-Sätze sind Pre-Apply-Evidence.
48. 🟡 Provider Adapter Core Foundation / Draft-PR #187 – provider-neutraler Server-Transport-Kern (ADR-0199). Review-Fixes aus `5463879179` im Repository. Keine echten Provider-Calls, keine Credentials, kein Commercial-Provenance-Mint. Self-expiring: solange #187 offen → STOP für unabhängigen Technical-Lead Exact-Head-Re-Review; nach Merge → Kern integriert, nächster Schritt zuerst Post-Merge-Verifikation + TL-Continuity, nicht automatisch Skyscanner-Server-Transport. Autor setzt kein Ready/Merge.

Nächster Schritt:

- **Self-expiring #187:** solange offen → unabhängiger Technical-Lead Exact-Head-Re-Review von `5463879179`. Nach Merge → Post-Merge-Verifikation + TL-Continuity gemäß Binding Slice Precheck (PR #196). Autor setzt kein Ready, kein Merge, keinen Skyscanner-Transport-Folgeslice.
- S5-B Persistenz und Production-Migration sind integriert/verifiziert. Offener Residual: Runtime-Write-Pfad/Principal und realer Snapshot; TW-8 bleibt geschlossen. PR #180/#182/#183 sind historische Integrations-Evidence, kein offener Apply-Auftrag.
- AP-6a Gate 0 / ADR-0195 / PR #166 ist integrierte historische Architecture-Evidence und Non-Scope von #180. `/privacy` und `/impressum` sind seit PR #579 als offizielle PrivacyBee-Embeds integriert und live geprüft (27. September 2026, ADR-0213); `/terms` bleibt ungebaut und Legal-/PO-Content-gegatet.
- AP-7-S2 bleibt separat Product-Owner-gegatet und startet nicht aus #166 oder #180.

## 9a. Destination Essentials 1 – CLOSED on main

Issue #393 / recovery PR #417 are closed on `main`. Historical resume evidence remains under `docs/DESTINATION_ESSENTIALS_1_RESUME_TASK_2026-09-02.md`. Destination Essentials decision remains ADR-0209.

## 9b. World Map 1 – CLOSED on main

Issue #419 / recovery PR #423 are closed on `main`. Historical evidence remains under `docs/CHATGPT_TECHNICAL_LEAD_WORLD_MAP_1_CLOSED_2026-09-02.md`. World Map decision remains ADR-0210. Visited/travel-history persistence remains deferred.

## 9c. Assistant Truth Context 1 – Draft-PR, Technical-Lead review pending

Technical-Lead-authorized truth-context slice of Issue #425 / Draft PR #426 on `feat/phase-1-assistant-truth-context-1`. Binding: `docs/ASSISTANT_TRUTH_CONTEXT_1_TASK_2026-09-02.md`.

- pure/deterministische Projektion vorhandener Trip-/Traveller-/Official-/Safety-/Seasonal-Wahrheit
- kein Modellcall, keine neue `Modellfunktion`, keine UI, keine Trip-Mutation, keine DB-Mutation
- Decision is ADR-0211
- kein Ready, kein Merge, kein Folgeslice durch den Coding-Agenten

Technical-Lead-owned. Kein Folgeslice aus diesem Stand ableiten.

## 9d. Assistant Runtime 1 – Draft-PR, Technical-Lead review pending

Issue #434 / Draft PR #435 auf `feat/phase-1-assistant-runtime-1`. Product-Owner-Gate #433 – **Preview/Development only**. Binding: `docs/ASSISTANT_RUNTIME_1_TASK_2026-09-17.md`. Entscheidung: ADR-0212.

**Fertig in diesem Branch:**

- additive Migration `20260917090000_modell_reisebegleiter.sql`: dritter Wert `reisebegleiter` in `model_usage_funktion_werte`, kein zweiter Kostentopf
- `MODELLFUNKTIONEN` in `lib/modell/konfiguration.ts`, gegen das Migrations-SQL geprüft
- `lib/reisebegleiter/{nutzlast,schema,befunde,aussagen,regeln,pruefung,erzeugen,aktionen}.ts`: bounded, server-only, ein Versuch, Reservierung vor jedem Aufruf
- **kein Freitextfeld in der Modellausgabe**: drei Felder (`befunde`, `bezuege`, `amtlicheHinweise`), alle nur Schlüssel und Bezugskennungen. Das Modell wählt aus zwei geschlossenen Jetnity-Katalogen – 33 Befunde über Jetnitys eigenen Datenstand, sieben amtliche Aussagen –, und jeden angezeigten Satz schreibt Jetnity
- `components/trips/Reisebegleiter.tsx` plus `begleiter`-Slot in `TripWorkspace`: eine eingeklappte Fläche in der Reiseübersicht, nur Konto
- additives `Modellanfrage.ausgabeTokens`, nach oben durch `MODELL_GRENZEN.ausgabeTokens` gedeckelt
- sechs neue Testdateien plus `npm run nachweis:reisebegleiter` (Browser bei 390, 1280 und 1440 px)
- voller Testbestand, TypeScript, Lint auf der `origin/main`-Baseline, Hygiene-Checks und Production-Build grün; Zahlen stehen nicht hier, weil jeder Commit sie ändert
- exact-head CI **success** (beide Jobs, inkl. `auth:pruefen`) und Vercel Preview **READY** auf jedem bisherigen Kopf; die Kennungen des aktuellen Kopfes stehen in den Checks von PR #435, nicht hier

**Aktueller Wahrheitsvertrag nach acht Re-Reviews (`3775d980`, `74577e31`, `f46d43a0`, `4837fc9a`, `4ffe3f20`, `e6606ea8`, `5ef78e5c`, `0c56864e`):**

- **Das Modell schreibt keine Sätze, es wählt aus.** Sieben Fassungen versuchten, erfundene amtliche Wahrheit im Freitext zu erkennen – deutsche Muster, mehrsprachige Verbotslisten, eine Spracherkennung, eine Erlaubnisliste über einem Wortschatz. Jede behauptete, aus einer erlaubten Wortmenge sei kein amtlicher Satz bildbar; das ist über einem unendlichen Satzraum nicht belegbar und wurde achtmal widerlegt. Seit Runde 9 gibt es das Feld nicht mehr, in dem so ein Satz stehen könnte.
- gewählt werden darf nur ein Paar aus Katalogschlüssel **und** Bezug, das `angeboteneBefunde()` für diese Reise als zutreffend berechnet hat
- amtliche Lagen laufen ausschliesslich über `amtlicheHinweise`: sieben Aussagen, gebunden an `ergebnis`, `frische` und `fehlendeAngaben` des Official-Bezugs; kein Schlüssel passt auf jeden Zustand
- `pruefung.ts` prüft genau drei Dinge: Bezug existiert, Befundpaar steht im Angebot, amtliche Aussage passt zum geprüften Zustand. Preis, Link, Buchungsbehauptung und behauptete Änderung sind nicht mehr abgelehnt, sondern **nicht darstellbar**
- nutzergeschriebener Reisetext (`stage.name`, Reisenden-Label) erweitert keine Autorität; er bleibt Anzeigetext
- serverseitige Ausgabeprüfung lehnt unerwartete Felder ab (`z.strictObject`) statt sie zu entfernen
- Produktfolge: Der Nutzen hängt an der **Katalogbreite**. Der Product Owner hat diese Form am 17. September 2026 für Preview/Development freigegeben; ADR-0212 (Produktform: Auswahl statt Formulierung) hält sie samt Empfehlung fest
- `main@aa6afaa6` und `main@cc2e1bff` per Merge integriert (kein Rebase, kein Force-Push); 0 behind, beide Seiten verlustfrei geprüft

*Die widerlegten Zwischenfassungen – Gewissheitsbindung an Bereich und Anforderungstyp, Modalität × Bereich × Vorbehalt, Sprachvertrag, Wortschatz-Erlaubnisliste – stehen als Historie in ADR-0212 und im SELF_REVIEW. Sie sind **kein** aktueller Mechanismus.*

**Vom Technical Lead erledigt – nicht wiederholen:**

- Develop-Migration `20260917090000` angewandt; Live-CHECK exakt `reisevorschlag` / `reiseaenderung` / `reisebegleiter`; RLS eingeschaltet; Policy `model_usage_lesen` und Rechte unverändert; Advisors ohne neuen Befund; `model_usage` 0 Zeilen; Migrationshistorie auf die Repository-Fassung korrigiert; Probe-Auth-Nutzer gelöscht. **Production unverändert.**

**Weiterhin offen:**

- **Kein bezahlter Preview/Development-Aufruf.** `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` und `JETNITY_MODELL_AKTIV` fehlen in der Agent-Umgebung; ein Konto-Login ist ohne bestätigte E-Mail nicht erreichbar. Die Darstellung einer Auskunft ist im Browser mit einer gestellten Auskunft nachgewiesen, nicht mit einer erzeugten.
- `db:rechte`, `db:rls`, `db:sicherheit`, `db:typen --pruefen`, `db:advisors` und `production:pruefen` sind in der Agent-Umgebung **nicht gelaufen** (HTTP 401); `auth:pruefen` ist in der CI grün.
- Production-Migration, Production-Modellaktivierung, Production-Secrets und Production-Aufrufe bleiben geschlossen.

Kein Ready, kein Merge, kein Folgeslice durch den Coding-Agenten. Technical-Lead-owned.

## 10. Noch nicht automatisch gestartet / weiterhin gated

- AP-6a-Runtime / AP-6b / AP-7 / AP-5-P1–P5
- AP-6a Gate 0 / ADR-0195 / PR #166 ist integriert; Runtime-Legal-Seiten nicht als gebaut behaupten
- AP-7
- Provider-Runtime-Write-Pfad / echter Commercial-Provenance-Snapshot (S5-B-Persistenz und Production-Migration `20260829140000` sind angewendet; TW-8 bleibt geschlossen)
- echte Providerphase
- TW-8
- TW-9
- Direction A
- Admin D–K — später; **kein neues V1-Launch-Prerequisite**. Die separat beauftragte erste read-only Intelligent Admin / Copilot-Pro-Foundation (#510 / #508) bleibt jetzt angefordert und wird dadurch nicht gestrichen.
- D1 / G1
- Issue #109 CLOSED / COMPLETED — Residual P2 Mobile Safari für den nächsten Search-/Homepage-UX-Slice; kein automatischer Folgeslice
- Issue #110
- Homepage-Mehrziel-Runtime
- neue AAL2-Arbeit
- neue Production-Migrationen ohne Gate
- Public Indexing
- Domain Cutover
- Native-App-Implementierung

## 11. Merge-/Produkt-Governance

> **AUTONOM MERGEN IST ERLAUBT. BLIND MERGEN IST VERBOTEN.**

> **Nur ChatGPT / Technical Lead darf Ready setzen oder mergen. Cursor-Agenten tun das niemals.**

Current Truth: `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`.

Normale scope-treue PRs darf der Technical Lead nach unabhängigem Exact-Head-Review integrieren, und nur wenn er absolut überzeugt ist, dass dies die beste verantwortbare Entscheidung ist. Product-Owner-Sondergates bleiben insbesondere für Production-Migrationen/destruktive Daten, große RLS/Identity/Auth/MFA/AAL-Änderungen, sensitive Passport-/MRZ-/Biometrie-Persistenz, reale Provider/Secrets/paid calls, Payments, Kosten > USD 100/Monat, fundamentale Produkt-/Build-Order-Änderungen und Public-/Provider-/Store-Live-Aktivierungen.

## 12. Nächster Chat / Agent

Kein neuer Agent startet allein aufgrund dieser Roadmap.

Der nächste Technical Lead muss zuerst `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-21.md` und live PRs #506/#509/#510/#512 rekonstruieren und danach einen scope-treuen Auftrag versionieren. Historische Agenten-/PR-Bodies bleiben Evidence ihres Zeitpunkts und werden nicht als aktuelle Freigabe gelesen.


## Official Truth — AA CH→DE Visa Mapping Candidate 1 (06.11.2026)

#1146 / Draft #1147: ruhender konkreter Visa-Mapping-Kandidat auf der vollständig angenommenen #1145-Baseline implementiert; unabhängige Root-Abnahme und vollständige Checkout-/CI-Gates stehen aus. Synthetischer Nachweis führt 93.365 Byte durch den tatsächlichen Kandidaten und die bestehende Evidence-/Review-/Rule-/Requirements-Kette. Manifest, vollständiger Kontext-Pin und festes Fenster 07.–13.11.2026 sind codegebunden; Extraktor `current=false`, Profil/Contract unregistriert, Pilot aus.

Kein Live-Visumdienst und kein Gesamtabschluss von #917. Unabhängiger gehosteter Stage-1-Readback, Stage 2, effektive #1139-Owner-/Session-Korrektur, reale Quellen-/Transportzulassung und Production-Freigabe bleiben gehalten; der vorhandene lokale #1142-Kandidat wurde nicht neu gebaut. Keine Datenbankaktion, Quellenanfrage, neue Abhängigkeit oder laufende Kosten. Autor stoppt nach [Handoff](docs/OFFICIAL_TRUTH_AA_CH_DE_VISA_MAPPING_CANDIDATE_1_HANDOFF_2026-11-06.md); nur Root darf nach vollständiger unabhängiger Prüfung Ready/Merge entscheiden. Kein automatischer Folgeslice.


## Official Truth — Pilot Target Guard 1 (07.11.2026)

#1148 / Draft #1149 liefert die begrenzte Codevoraussetzung für die spätere konkrete Development-Pilot-Zielbindung: feste Preview-/Projektprüfung und übereinstimmende erfasste SSR-/aktuelle Katalog-Zieladresse, einschließlich Rechecks nach Wartezeiten. Synthetische Gegenproben und die bestehende kanonische Annahmekette sind in der [Autorenübergabe](docs/OFFICIAL_TRUTH_PILOT_TARGET_GUARD_1_HANDOFF_2026-11-07.md) dokumentiert; unabhängiges Exact-Head-Review und vollständige CI stehen aus. Keine Pilot-Aktivierung, kein Live-Einreisetest und kein Abschluss von #917/#741. Der erste kritische Schritt bleibt die zulässig freigegebene Feststellung der tatsächlichen Development-Baseline und wirksamen #1139-Autorität; Stage 1 bleibt `APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING`, Stage 2 `NOT_ATTEMPTED`. Die persistente, versionierte, aktualisierbare eigene Datenbasis und die vollständige Einreise-Checkliste bleiben Produktauftrag.

## Official Truth — Persisted Canonical Read 1 (07.11.2026)

#1150 / Draft #1151 liefert auf der angenommenen #1149-Baseline `a5be31e` den zusammenhängenden ruhenden lokalen Persistenz-Lesepfad zur vorhandenen kanonischen Requirements-Engine. Primary und Composed verwenden den unveränderten fiktiven CH→GB-Corpus und vollständige tatsächlich ausgeführte Implementierungskapseln. Frischer Reader, Re-Extraktion aus Datenbank-Originalen, Lifecycle-Nachprüfung und aussagekräftige Negativfälle sind als gemeinsamer nativer Abnahmetest implementiert. Unabhängige Exact-Head-Prüfung und vollständige CI einschließlich tatsächlichem PostgreSQL 16 stehen bei Autorenrückgabe aus; lokale fehlende Next-/React-/Supabase-SSR-Abhängigkeiten und fehlendes PostgreSQL werden nicht als Test-Erfolg ausgegeben.

Nächster Schritt dieses Pakets: Root prüft Diff, Importgrenzen und echte CI, entscheidet allein über Ready/Merge und prüft nach Merge das tatsächliche Main-/Production-Deployment. Der Autor stoppt mit [Handoff](docs/OFFICIAL_TRUTH_PERSISTED_CANONICAL_READ_1_HANDOFF_2026-11-07.md); kein automatischer Folgeslice. Diese historische Leserarbeit ist keine zusätzliche Voraussetzung für den ersten Current-Request-only-CH→DE-Piloten.

R2 schließt im selben Auftrag die unabhängig gefundene letzte Await-Grenze: ein strikt lokaler, separat rücknehmbarer SQL-Wrapper überträgt tatsächliche Ablaufgrenzen, die der Leser konservativ monoton weiterprüft. Positive Fallbacks, verlängerte Fristen und Hosted-Installation bleiben ausgeschlossen. Die neuen nativen SQL-Erfolg-dann-Ablauf-/Owner-/ACL-/Rollback-Gegenproben stehen ebenfalls noch zur echten CI-Prüfung aus.

Der kritische gehostete Schritt bleibt unverändert die zulässig freigegebene #1139-Zielbaseline mit wirksamer Owner-/Account-/Session-Autorität und Bindung des vorhandenen #1142-Kandidaten. Development Stage 1 bleibt `APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING`, tatsächliche Ledger-ID unbekannt, Stage 2 `NOT_ATTEMPTED`. Keine erneute verweigerte Nachprüfung, Hosted-Migration, reale Quellenzulassung, Pilot-/Provideraktivierung oder Production-Freigabe aus dieser Lieferung ableiten. Die eigene dauerhafte, versionierte und aktualisierbare Datenbasis und die vollständige Einreise-Checkliste bleiben offen; ein echter Owner-Test auf jetnity.com ist nicht erfolgt.

## Official Truth — Atomic Version Refresh 1 (07.11.2026)

#1152 / Draft #1153 bearbeitet die konkrete fehlende atomare Fortschreibung der bestehenden lokalen Versionskette: neuer vollständig geprüfter Quellenbeobachtungsstand, getrennter Review, Publikation, Originalbindung, Supersession des exakten aktuellen Vorgängers und anschließend unabhängige kanonische Requirements-Lesung. Der Vorgänger muss bis zur zulässigen Commit-Grenze benutzbar bleiben. Bereits veraltete, abgelaufene, zurückgezogene, widersprüchliche oder entsorgte Vorgänger werden nicht wiederbelebt. Geänderte Fakten/Quellen, neue Zellen und die spätere Requalifizierung veralteter Bestände bleiben eigene offene Funktionsarbeit.

Native Abnahmekriterien umfassen Primary und Composed mit vollständigen tatsächlich ausgeführten Kapseln, direkte Rollenangriffe, echte Fehler nach Bind und Supersede, echte konkurrierende Writer, einen Reader-/Writer-Sperrnachweis, Ablauf während des Wartens, unbekannten COMMIT und gescheiterten Readback. Der neue isolierte Standard-CI-Job ergänzt die unveränderten Core- und Persisted-Native-Kommandos; der vorhandene eindeutige Pflicht-Aggregator verlangt alle drei erfolgreichen Ergebnisse. Keine neue Abhängigkeit, Infrastruktur oder bezahlte Einstellung. Autorenlieferung und unabhängige TL-Abnahme bleiben getrennte Zustände; kein automatischer Folgeslice.

Die größere lokale Datenbankfunktion ist kein Live-Pilot und keine zusätzliche Voraussetzung für den ersten Current-Request-only-CH→DE-Test. Der gehaltene gehostete Weg bleibt: zulässiger Plattformfreigabeweg und tatsächliche #1139-Zielbaseline; zielgebundenes #1142-Sicherheits-/Migrationspaket; Pilot-Persistenz und Trip-/Grant-/RPC-Kette; vollständiger amtlicher Abruf und konkrete Use-/Retention-/Contract-Zulassung; wirkliche Development-Zielbindung und Owner/AAL2/Session/Trip/CH-Pass-Test; anschließend besonders freigegebenes Production-Paket und unabhängiger Ablauf auf jetnity.com. Development Stage 1 bleibt `APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING`, neue Ledger-ID unbekannt, Stage 2 `NOT_ATTEMPTED`. #1131 bleibt separat gehalten; keine verweigerte Aktion wird wiederholt, umformuliert oder umgeleitet.

**R3-Prüfstand:** Der tatsächliche erste CI-Lauf `42401079734` auf `3dbf1da2b97154372c945e20264f2a18f1b3b0b5` führte alle fünf Fresh-Beobachtungen erfolgreich aus, doch der Refresh-Native-Parent scheiterte nach 66,235 Sekunden an wiederverwendeten unveränderlichen Producer-Artefaktidentitäten; kein positiver atomarer Übergang wurde erreicht. Persisted-Native und Auth waren erfolgreich, Core-Typecheck/Lint erfolgreich, Core-Tests nach neuem Dokumentationshead abgebrochen; Refresh-Native und Pflicht-Aggregator fehlgeschlagen. Der gleiche Autor korrigiert unter [R3](docs/OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_TL_AMENDMENT_R3_2026-11-07.md) nur die ursprüngliche Fresh-Identitätsvergabe für sieben dynamische Typen und ergänzt Kompatibilitäts-/Coexistenz-Gegenproben. Vollständige erneute Native-/Core-/Auth-/Build-/Preview-Abnahme auf dem neuen Exact Head bleibt offen. Dieser Fix erhöht keine Frist und ändert keine Hosted-Freigabe.

**R5-Prüfstand:** Der inzwischen vollständig geprüfte fünfte Lauf `42408955148` auf `3ac5d6759d91e6977ed095f08d5f0eaf7ef8286b` bleibt insgesamt fehlgeschlagen: Refresh-Native nach 225.479,483 ms, beim ersten tatsächlichen Bind-Fault `57014` statt `P7701`; beide Positivfälle und spätere Guard-/Race-/Terminal-Fälle nicht erreicht. Core 8.194/8.192/0/2, Owner 27, Integrated 72, Persisted 95 Diagnosen/45 Reads sowie Auth/Preview waren auf diesem Vorgänger erfolgreich; nichts davon ersetzt frische Gates. Der gleiche Autor liefert unter [R5](docs/OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_TL_AMENDMENT_R5_2026-11-07.md) eine begrenzte Optimierung ausschließlich reiner, innerhalb eines vollständigen Verifier-Aufrufs wiederholter Arbeit plus bytegeprüftem nativen Alt-/Neu-Oracle. Alle neun äußeren vollständigen Prüfungen und 25s/15s/20s/60s/120s/900s-Grenzen bleiben. Die ausreichende Beschleunigung und komplette tatsächliche Abschlussmatrix sind noch nachzuweisen; keine neue Produktaktivierung oder Hosted-Freigabe.
