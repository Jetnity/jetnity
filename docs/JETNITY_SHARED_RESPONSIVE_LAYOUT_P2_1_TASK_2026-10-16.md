# Jetnity Shared Responsive Layout P2 1 — IMMUTABLE Technical-Lead TASK

**Datum:** 16 October 2026, Europe/Zurich
**Issue:** https://github.com/Jetnity/jetnity/issues/958
**Draft PR:** vom Technical Lead nach diesem TASK-Seed anzulegen, Nummer am Beginn der Agentenarbeit live lesen
**Repository:** Jetnity/jetnity
**Branch:** fix/shared-responsive-layout-p2-1
**Seed main:** bd613dd479b67353966f7a2c0e609e22793ab2d6
**Seed main Tree:** fd75f3d3dc8fa051d2316b3a7966c626e1de760f
**Operating Mode:** NORMAL
**Neuer logischer Code-Autor:** Jetnity Shared Responsive Layout P2 1 — Codex Generation 1
**Session-ID:** UNKNOWN, noch kein Agent gestartet.
**Status:** TASK_ONLY / NO_IMPLEMENTATION / NO_AUTHOR_DISPATCH / DRAFT_NOT_READY.
**Dieses TASK-Dokument ist nach Seed BYTE-IMMUTABLE.** Ein Autor muss seinen Git-Blob SHA bei jedem Handoff nachweisen.

## 0. Verbindlicher Product-Owner-Scope und ursprüngliche Evidence

Der Product Owner antwortete JA auf einen separat vorgeschlagenen P2-Entwicklungsauftrag zur **minimalen Korrektur des gemeinsamen responsiven Layouts**. Vor der Genehmigung wurden Live-Stand, Betriebsmode, Issue #751, relevante neue #748 MATERIAL, offene PRs, Originalquellen und [TL R19](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6215245944) unabhängig gelesen. Dies ist KEIN Auftrag für einen allgemeinen UI-Umbau oder zur Änderung von Trip Audit #955, Auth/DB/Provider oder Production.

Quelle der belastbaren Fehler-Evidence:
- [QA R18 historischer A/B-Browserbericht](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6214745915)
- [Independent Technical Lead R19](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6215245944)
- [QA R17](https://github.com/Jetnity/jetnity/pull/955#issuecomment-6214174938)

A: historisches main 69a182ea4b7f9dbd934abf314266b7d8f59a5d73 **ohne Trip Audit**. B: PR #955 312bcadc31a2fa0d07ce3b81b0fe30df1f9035cf mit geschlossenem/geöffnetem Reisecheck. Identische synthetische Guest-Reise, host Chrome 155/Playwright 1.55; bei Viewport 320px und CSS zoom 200 % hat A wie B Dokumentbreite **350 statt 320px**, also **30px Root-Overflow**. Bei mobile320/zoom100 und desktop1280/zoom200 passen alle Layouts. Das Audit-Panel misst bei mobile320/zoom200 134/134 und verursacht **0px** zusätzliche Root-Breite.

**Wirkliche nicht geclippte Root-Überläufe:** Navbar-Logo-Link reicht bis x344; Footer-Logo-Link bis x349.859; beide sind im historischen und neuen Commit identisch. Footer-Grid/Brand-Spalte haben zu grosse automatische Mindestbreiten, Logos/Links plus negative Margins können bei effektiv etwa 160 CSSpx nicht zusammenschrumpfen. **Separater Befund:** „Jetzt wichtig“ hat bei dieser Auflösung ein intern von seiner ul abgeschnittenes Element bis ~x388, aber seine Karte misst 134/134 und verursacht NICHT die 350px Root-Breite. Nicht als globale Overflow-Ursache deklarieren.

**Owner-Berechtigungsgate:** Der letzte Screenshot der gestoppten Work-QA „Prüfe Jetnity PR 955 im Browser“ zeigte erneut „Uneingeschränkter Zugriff“. Die jetzige Zustimmung zum neuen P2-Task ist **KEINE Bestätigung einer Rückstellung**. Vor dem Dispatch eines neuen Code-Autors muss der Product Owner das Stop-Session-UI manuell auf „Für mich genehmigen“ zurückstellen und es ausdrücklich bestätigen. Neue Agenten starten mit REGULÄREN Rechten; keine Vererbung früherer Vollzugriff-Ausnahmen.

## 1. Verbindlicher Live-Einstieg des neuen Autors

Vor der Implementierung vollständig lesen:
1. JETNITY_START_HERE.md
2. docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md samt darin genanntem Live-Handoff
3. docs/ACTIVE_WORK_STATUS.md und .jetnity/operating-mode.json
4. aktuelle #751-Continuity, neue relevante #748 MATERIAL
5. dieses TASK, Issue #958 und bestehender Draft PR mit Original-TASK-Git-Blob
6. R18, R19, R17 plus vollständige CSS/DOM-Messungen
7. Komponenten PublicNavbar, Footer, TripWorkspaceJetztWichtig und bestehende UI-Audit-Tests / Guards, navigation/brand contracts.
8. aktuelle parallele PR #955 und gemergter Change Impact #957.

Live-Checks: protected main, Operating Mode, Head, Tree, TASK-Blob, Merge-Base, Ahead/Behind, vollständiger Seed-Diff, Branch Protection/Ruleset, CI/Preview, parallele PRs und spezielle Owner-Gates. **Live-Evidence gewinnt**. Bei Baseline-/Mode-/Scope-/Task-Drift STOP, kein Rebase/Force/alternativer Upload. Nur eigener bestehender Branch und Draft.

## 2. D1 — minimaler Root-Overflow-Fix in der Navbar

**Exakt erlaubte bestehende Datei:** components/layout/PublicNavbar.tsx.

Analysiere das gezeigte 320px+CSS200-Flex-/min-content-Problem: logo-link mit negativem Inline-Margin und shrink-0, bisheriges h48/w-auto-Bild, ein 44px-Menü-Button, Header inner padding, Safe-Area. Effektive Layoutbreite nach CSSzoom2 etwa 160 CSS-Pixel. Implementiere eine responsive echte Größenbegrenzung / sinnvolles Shrink/Wrap, so dass Logo-Link, echtes Logo-Bild und Menü vollständig innerhalb des Viewports sichtbar und bedienbar bleiben. Keine Veränderung des Logo-Assets oder verstecktes globales overflow-x:hidden / clip. Logo-Seitenverhältnis, Markenlesbarkeit, Menu-/ARIA-Semantik, Desktop-Brand-Grössen, 44px Touch-Targets, Keyboard/Focus und Safe-Area müssen erhalten bleiben. Keine Änderung der Auth-/Sitzungs-/Logout-Logik.

## 3. D2 — minimaler Root-Overflow-Fix im Footer

**Exakt erlaubte bestehende Datei:** components/layout/Footer.tsx.

Diagnostiziere x349.859 Logo-Link, Brand-Grid-Spalte, min-content-auto sizing, Bildbreite, negative Link-Margins, Inline-Mail-/Legal-Links. Innerer Footer hat bei 320/CSS200 etwa 120 CSSpx Contentbreite und eine bisher berechnete Spalte von etwa 146.93 CSSpx. Implementiere lokal begrenzte Layout-/Grid-/min-width-/Shrink-/Word-Wrapping-Korrektur. Alle Logo-/Produkt-/AGB-/Privacy-/Impressum-/Mail-/Attribution-Links bleiben sichtbar, anklickbar, focusable und korrekt beschriftet. Branding bleibt erhalten, keine textlosen oder abgeschnittenen Elemente. Keine globalen CSS-/Header-/Body-Clipping-Workarounds, keine Änderung an URLs oder rechtlichen Inhalten.

## 4. D3 — NUR bedingt unabhängiger „Jetzt wichtig“-Lesbarkeitsfix

**Exakt erlaubte bestehende Datei:** components/trips/TripWorkspaceJetztWichtig.tsx — OPTIONAL NACH eigenem Beleg.

R18 beobachtete gesondert innerhalb der bestehenden Karte einen bei CSS200 intern geclippten Text/Button. Es ist NICHT die globale 30px-Ursache. Die Datei darf nur minimal korrigiert werden, wenn ein erneuter synthetischer DOM-/Screenshot-Test tatsächlich unlesbaren oder nicht erreichbaren Inhalt belegt und wenn die Lösung ausschließlich innerhalb dieses Moduls möglich ist. Erhalte Reihenfolge, Texte, Buttons, Accessiblity, Fokus, 44px Targets, Grenzen der Canonical Attention und alle Links. Kein Redesign, keine neue Daten-/Zeit-/Safety-Wahrheit. Wenn Clip nicht sicher reproduzierbar oder Eingriff ausserhalb der Dateigrenzen nötig ist, **NICHT EDITIEREN** und separate Gap im Bericht ausweisen.

## 5. D4 — verbindliche Regressionen / Browser QA

**Nur NEUE Testdateien erlaubt:** lib/ui-audit/shared-responsive-layout-p2-1/**. Kein Ändern bestehender UI Tests, Pakete, Routen oder Workflows.

T01: Historische R18 Mess-Evidence wahrheitsgetreu referenzieren; alten main nicht als erneut ausgeführt ausgeben, wenn nicht getestet.
T02: echte Browsermessung bei viewport320x800 und CSS zoom1/zoom2 mit synthetischem Guest Trip Workspace. Root document scrollWidth <= clientWidth+1; Navbar/Footer-Link-, Bild- und Fokus-Bounds **ohne root clipping** innerhalb Viewport.
T03: 1280px bei CSSzoom2 und responsive 360/375/390, 768/1024 soweit sinnvoll: keine Desktop-/Mobile-Navigations-Regressionen, Links sichtbar und Wrap korrekt.
T04: Mobile-Menü öffnen/schliessen, Escape, Focus, Enter/Space, aria-expanded, Focus Ring und mindestens44 CSSpx Touch Targets.
T05: Footer lange Wörter/E-Mail/Legal-Texte; kein Verlust von Inhalt, Links oder Brand. Bei optionalem D3-Fix müssen „Jetzt wichtig“ - Texte/Buttons tatsächlich sichtbar und bedienbar bleiben, nicht bloss vom Parent geclippt.
T06: QA Fixture Gast bzw. synthetische Account-Darstellung ist KEINE echte Auth/Ownership-Qualifikation. Keine echten Account-, DB-, Provider-/API-Zugriffe.
T07: unveränderte lokale UI-Audit-Route ist Production immer fail-closed; keine neue Public-/SEO-/Indexierungsfreigabe.
T08: strukturierte Vorher/Nachher-DOM-Geometrie, tatsächliche sichtbare BoundingRects, Host Chrome/Playwright Versionen, synthetische Screenshots nur ohne PII, keine PASS-Behauptung bei nicht ausführbarer Browser-Umgebung.
T09: Diff-/Scope-Gate keine Änderungen an Trip Audit #955, globalen Styles, Routen, Auth/DB, Packages, Workflows, logo PNG. Keine unzulässige hidden-overflow-Kosmetik.

Die originalen Projektprüfungen müssen auf dem finalen GitHub-Code-HEAD durchgeführt werden: Setup/OperatingMode, Typecheck, Lint, native PostgreSQL Full-Test-Suite, API/Schema/Dead/Exports/Deps, Next Build, Auth Job und Vercel Preview auf exakt demselben neuen Head. **Browser-QA ist zusätzlich nötig; opt-in Tests dürfen nicht als PASS ausgegeben werden, wenn übersprungen.** Bei eingeschränkter Sandbox/DNS/Browser STOP und Technical Lead informiert, kein stilles Full Access, kein eigener Cloud-/Host-Runner.

## 6. Harte Dateieigentümerschaft / Security

**ERLAUBTE WRITES nur:**
- components/layout/PublicNavbar.tsx
- components/layout/Footer.tsx
- components/trips/TripWorkspaceJetztWichtig.tsx (NUR unter D3 nach Beweis)
- **NEUE** lib/ui-audit/shared-responsive-layout-p2-1/** (synthetische Tests, keine Runtime)
- **NEUE** docs/JETNITY_SHARED_RESPONSIVE_LAYOUT_P2_1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-16.md
- optional **NEUE** docs/evidence/jetnity-shared-responsive-layout-p2-1/** (sanitisiertes synthetisches QA)

**VERBOTENE WRITES:**
Dieses IMMUTABLE TASK; components/trips/TripWorkspace.tsx, TripWorkspaceUebersicht.tsx, TripAuditV1Panel.tsx, lib/trips/trip-audit-v1/** und alle übrigen #955-Dateien; styles/globals.css; app/**, andere gemeinsame Navigation, Logo-/Brand-Assets, public, types, Auth/Account/Traveller/RLS/Supabase/SQL/DB, Server APIs, Provider, Official Truth, AI/Models, Payment, package.json/lock, Next config, GitHub Actions/Rulesets/Security-Guards, Production. Keine neuen Secrets, Benutzer-/Account-Daten, bezahlte Calls, Source GET oder Publikationsfreigaben. Bei benötigtem Fremdvertrag/Datei: STOP und min. TL-/Product-Owner-Amendment.

Reserved special gates bleiben: #917 SOURCE_NOT_QUALIFIED, #944 kein amtlicher GET/Outreach, DEV-PREP-1 Safety DB blocked, #911/#913 Privacy, Bern #934/#937, #626, Provider/Commercial/Cost/Production/Launch. Mode NORMAL ist kein besonderes PO-Gate. Keine pauschale Full-Access-Freigabe.

Parallel laufende [Draft #955](https://github.com/Jetnity/jetnity/pull/955) ist auf ursprünglichem Head 312bcadc31a2fa0d07ce3b81b0fe30df1f9035cf (GitHub live im R19/R20 Precheck), ahead4/behind3 current main bei diesem TASK seed. Original Code-Agent „Jetnity Trip Audit V1 — Codex Generation 1“, Session 01a141ad-1220-7462-bced-c75469dab1d3, bleibt gestoppt. **Keine Dateiüberschneidung**. Dieser neue Agent integriert #955 NICHT. Technical Lead entscheidet Merge-Reihenfolge und lässt später #955 normal mit neuem main abgleichen sowie neue Exact-HEAD-CI/Auth/Preview und reale T09 Browser QA durchführen. T07 echte Änderung im bereits geöffneten Panel und QA-B echte Account-Authentifizierung bleiben separat offen.

## 7. Implementierungs-/Handoff-Lifecycle

1. Zuerst Live Precheck und eigener task-spezifischer PLAN. Genau EIN Code-Autor für diesen Slice.
2. Eigene Implementierung D1/D2 und ggf. D3 nur innerhalb Ownership. QA T01–T09, Scope/Originalchecks, diff --check. Den alten PR #955 nicht verändern.
3. Normale authentifizierte Git-Veröffentlichung auf dem **bestehenden** Branch fix/shared-responsive-layout-p2-1 und bestehenden Draft PR. Kein Force-/Rebase-/Alternativ-Upload; bei Git/DNS Block STOP, lokale Commits bewahren.
4. Eigene REPORT/SELF_REVIEW/HANDOFF-Docs (nicht diesen TASK) mit exact HEAD/Tree/Task blob, aktuellem main, MergeBase/AheadBehind, jeder Datei, Tests, CI/Auth/Vercel und ehrlichen Browserlücken.
5. Danach **STOP** für unabhängigen Technical Lead. Agent darf **niemals Ready setzen, mergen, Production ändern oder Folgeslice beginnen**. Agenten-Self-Review ist niemals TL-PASS; CHANGES REQUIRED => gleicher Agent/dieselbe Session, neuer HEAD und vollständiges Re-Gating.

**END — TASK_ONLY / NO IMPLEMENTATION / NO CODING AGENT DISPATCHED.**
