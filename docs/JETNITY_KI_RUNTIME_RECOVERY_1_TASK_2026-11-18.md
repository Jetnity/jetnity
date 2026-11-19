# Jetnity KI Runtime Recovery 1 — verbindlicher Cursor-Auftrag

**Stand:** 18.11.2026 (Europe/Zurich)  
**Typ:** P1 / eng begrenzter Diagnose- und, nur bei nachgewiesenem Codefehler, Reparatur-Slice  
**Owner-Auftrag:** Issue [#1237](https://github.com/Jetnity/jetnity/issues/1237), ausdrückliche Freigabe für versionierten Task + Cursor-Anstoss  
**Exact baseline:** `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` (CI [44333651972](https://github.com/Jetnity/jetnity/actions/runs/44333651972), SUCCESS)  
**Branch:** `fix/ki-runtime-recovery-1-20261118`  
**PR:** eigener Draft-PR, von Technical Lead eröffnet; Autor bleibt Draft  
**Cursor-Agent, exakter logischer Name:** `Jetnity KI Runtime Recovery 1`  
**Generation:** 1, **neuer eigenständiger Slice**. Tatsächlichen Session-Link, Modell und Status aus der gestarteten Cursor-Sitzung übernehmen und nicht erfinden.  
**Ownership:** nur diese KI-Lane. Der andere Technical Lead besitzt vollständig Official Truth, Einreise, Datenbanken, zugehörige PRs, Migrationen, Tests und CI. PR [#1235](https://github.com/Jetnity/jetnity/pull/1235) ist eine separate Dokumentations-Lane, nicht verändern.

## 1. Verbindlicher Befund und Ziel

Product Owner hat Jetnity auf `jetnity.com` selbst getestet und am **18.11.2026** gemeldet:

- **KI-Reiseplanung aus Freitext: funktioniert nicht.**
- **Reiseänderung per KI-Freitext: funktioniert nicht.**
- **Reisebegleiter:** derselbe vorhandene Modell-Unterbau; Verfügbarkeit/Zustand gesondert feststellen. **Nicht** ohne Nachweis behaupten, dass auch dieser sichtbare Nutzerpfad identisch fehlgeschlagen ist.
- Die Grundreise, Reisewetter und Merkliste wurden auf der Website laut Owner getestet. Diese Funktionen **nicht** erneut bauen.

Relevante bereits implementierte Pfade: `lib/modell/` (Konfiguration, Preise, Requests, Antwort, Kontingent), `lib/reisevorschlag/`, `lib/reiseaenderung/`, `lib/reisebegleiter/`, UI `components/trips/Reiseidee.tsx`, `ReiseAenderung.tsx`, `Reisebegleiter.tsx`. Produkt- und Kostenkontext: `docs/MODELL.md`; Vision `JETNITY_VISION.md`; Produktmandat `JETNITY_PRODUCT_MANDATE.md`; Phasenvertrag `docs/ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md`.

**Ziel:** Die tatsächliche Ursache anhand aktueller Live- und Code-Evidence unterscheiden:

1. Kill Switch aus (`JETNITY_MODELL_AKTIV`);
2. `OPENAI_API_KEY` fehlt oder nicht zugelassen (nur **Existenz/Metadaten**, niemals Secretwert lesen);
3. ungültiger/alter Modellname, veraltete Preis-/Kostenannahme, unpassender Response-Request/Parser;
4. Modell-Aufruf/Timeout/Netz/API-Fehler;
5. Kostenreservierung, Gast-/Konto-Session oder bestehende limitierte RLS-/DB-Capability;
6. UI-Handling/Fehlersemantik, Reisevorschlag/Änderung/Begleiter und sichere explizite Übernahme;
7. Preview-vs-Production-Konfiguration und der tatsächlich auf `jetnity.com` gepinnte Build.

**Keine Ursache als erwiesen behaupten, bevor sie beobachtet und reproduziert wurde.** Eine bewusst deaktivierte KI ist kein Grund, Sicherheitsgrenzen aufzuheben.

## 2. Vor dem ersten materiellen Schritt

Verbindliche Lesereihenfolge:

1. `.jetnity/operating-mode.json`, `JETNITY_START_HERE.md`, `AGENTS.md` und `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
2. diese TASK-Datei, [Issue #1237](https://github.com/Jetnity/jetnity/issues/1237), aktueller PR-Head, `docs/ACTIVE_WORK_STATUS.md` und die neuesten #751-Checkpoint-Receipts **nur lesend**;
3. `JETNITY_VISION.md`, `docs/MODELL.md`, die einschlägigen ADRs 0050–0060 und 0212, `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`;
4. Live `main`, alle offenen PRs und ihre Dateisätze; speziell die andere Einreise-/DB-Lane und `#1235`;
5. aktuelle CI, Preview/Production Zuordnung und mögliche bestehende Freigabe-/Security-Risiken.

**Baseline ist historisch ab Task-Erstellung**: wenn `main` oder parallele Heads sich verändert haben, Drift und Auswirkungen offenlegen, nicht blind rebasen, nicht gegen geschützte Dateien schreiben. Exakte Session- und Cursor-Generation dokumentieren.

## 3. Diagnose zuerst: keine bezahlte Aktivierung

- Lese die vorhandene Modell-Wahrheit in `lib/modell/konfiguration.ts`, `preise.ts`, `anfrage.ts`, `antwort.ts`, `aufruf.ts`, `kontingent.ts`; die fachlichen Runner `lib/reisevorschlag/{aktionen,erzeugen,routing}.ts`, `lib/reiseaenderung/{aktionen,erzeugen,routing}.ts`, `lib/reisebegleiter/{aktionen,erzeugen}.ts` und die zugehörigen UI-/Tests.
- Erstelle eine **kurze Ursachenmatrix**: Pfad, tatsächlich gesehene Fehlklasse/Anzeige, Reproduzierbarkeit, Quelle/Codeort, Beweisgrad, nächster sicherer Schritt. Kein „API-Fehler“, wenn das Flag bereits OFF ist.
- **Ausschliesslich safe read-only Konfigurationsmetadaten** (Variable-Name, Scope, Environment, Aktivierungsstatus, Deployment-SHA) bei bereits zulässigen Provider-/Vercel-Einsichten. **Nie API-Key-Wert, Token oder andere Secretwerte abrufen, drucken, kopieren oder in Logs/PR/Chat speichern.**
- Kein Anlegen/Rotieren von Schlüsseln und **keine** Änderung an `JETNITY_MODELL_AKTIV`, `OPENAI_API_KEY`, `JETNITY_MODELL_NAME`, Vercel/Dev/Production-ENV oder fremden Providerkonfigurationen.
- `docs/MODELL.md` beschreibt explizit historische Preview-ON / Production-OFF-Grenzen. Neuere reale Beweise gewinnen. Die aktuelle Domain ist nicht automatisch der Main-Commit; Vercel-Release/alias-SHA exakt lesen.
- **API-/Modell-/Preisverträglichkeit** nur aus aktuellen offiziellen öffentlichen Herstellerangaben read-only abgleichen (kein API-Aufruf, keine Preisraten erfinden). Wenn ein Modellname, veröffentlichter Preis oder echter Kostenvertrag abweicht, **STOP FOR PO/TL COST GATE**; keine blinde Preisliste-/DB-/Model-Routing-Korrektur.
- Die Preview-Isolationsgefahr aus [Issue #968](https://github.com/Jetnity/jetnity/issues/968) berücksichtigen. Kein authentifizierter Hosted-Preview-Test, bevor die tatsächlich isolierte Dev-Konfiguration unabhängig belegt ist. Keine echten Nutzerreisen auslesen oder an externe Modelle senden.
- Kein API-/LLM-/Provider-Aufruf, der Geld kosten kann; keine neuen Abos/Anbieter/Kosten. **Keine** Owner-Login-/2FA-Übernahme. Keine Production-Änderung.

## 4. Exakt begrenzte Reparaturbefugnis

**Nur wenn** ein **isolierbarer, unabhängig reproduzierbarer Codefehler** auf dem bestehenden Produktpfad gefunden wird, dürfen dessen Reparatur und passende Regressionstests im selben Draft-PR erfolgen.

### Mögliche Schreib-Scopes (nur wenn wirklich erforderlich)

- enge Korrektur innerhalb `lib/modell/{konfiguration,anfrage,antwort,aufruf}.ts` plus direkt betroffene `*.test.ts`;
- enge Korrektur in `lib/reisevorschlag/{aktionen,erzeugen,routing,schema}.ts`, `lib/reiseaenderung/{aktionen,erzeugen,routing,schema}.ts` oder `lib/reisebegleiter/{aktionen,erzeugen,schema}.ts` plus direkt betroffene Tests;
- `components/trips/{Reiseidee,ReiseAenderung,Reisebegleiter}.tsx` nur bei konkret bewiesenem UI-Zustandsfehler;
- `docs/JETNITY_KI_RUNTIME_RECOVERY_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-11-18.md` und nachgewiesene eng begrenzte eigene Evidenz ohne Nutzerdaten/Secrets.

**Keine** parallelen PRs verändern, keine eigene Implementierung einer neuen Modellplattform, kein neues Modell-/Pricing-/Quota-/Cache-/Auth-/DB-Vertragssystem. Änderungen in `lib/modell/preise.ts`, `lib/modell/kontingent.ts`, `lib/modell/grenzen-datenbank.test.ts` sind **nicht autorisiert**. Falls dort eine Korrektur erforderlich wäre, mit reproduziertem Befund **STOP für den Technical Lead/Owner**. Keine Server-Side Logs mit Prompt oder Rohantwort.

### Absolute Schreibverbote

- alle `supabase/**`, `scripts/db/**`, `types/supabase.ts`, alle Schema-/RLS-/DB-/Auth-/Identity-Dateien oder dazugehörigen Tests;
- `lib/readiness/**`, `components/readiness/**`, `app/api/readiness/**`, `app/(public)/einreise/**`, `docs/official-truth-product-v3/**` sowie alle anderen Official-Truth-/Einreise-Quellen;
- `.github/**`, CI-Workflows, `package.json`, `package-lock.json`, `tsconfig.json`, Vercel/Supabase-Konfigurationen, `.env*`, Runtime-Budget-/Cost-ENV, Provider-Keys;
- globale `JETNITY_START_HERE.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `docs/ACTIVE_WORK_STATUS.md` und die 3-Phasen-/8-Strategiefunktionsdokumente; PR #1235;
- niemals rebase/force push auf `main`, fremde Branches oder die Arbeit des anderen Technical Leads.

Falls die Abhilfe nur durch eine gesperrte Datei, Datenbankmigration, Kosten-/API-Freigabe oder Env-Aktivierung möglich wäre: **keine Umgehung**, konkret dokumentierter Owner-Gate und STOP.

## 5. Verbindliche Acceptance Criteria

**A1 – Ursache/Evidence:** Für `reisevorschlag`, `reiseaenderung`, `reisebegleiter` ist getrennt dokumentiert, ob Build-Code funktioniert, ob die Runtime-Konfiguration ein Modell zulässt, welche Fehler sichtbar wären und was **wirklich** auf der geprüften Umgebung bestätigt wurde. Keine unbelegte „Produktions-KI funktioniert“-Behauptung.

**A2 – Fallback/Transparenz:** Bei OFF, fehlendem Key, unzulässigem Modell, ausgeschöpftem Kontingent, HTTP-Fehler, Timeout, invalidem Modell-JSON und Versionskonflikt zeigt Jetnity ehrliche, sichere Fehler- und Erhaltungszustände. Kein stiller Providerwechsel und keine erfundene Antwort.

**A3 – Vorschlag/Apply:** Vorschlag verändert keine kanonische Reise; erst explizite Nutzerbestätigung übernimmt. Keine Gast-Konto-Verwechslung, kein unerlaubtes Client-Trust, kein Verlust der gesamten Reise, kein unkontrollierter Retry/Double-Payment.

**A4 – Kosten/Security:** Keine Lockerung von Kill Switch, Raten-/Kosten-/Tokenlimits, keinem direkten Zugriff auf fremde Daten, keine sensiblen Reise-/Pass-/Dokumentdaten in Modell-/Testlogs, keine Preis-/API-Änderung ohne Owner-Gate.

**A5 – Regression:** Bestehende gezielte Tests der drei KI-Pfade und bei tatsächlichem Fix mindestens je ein gezielter RED→GREEN-Reproduktionsfall. Typecheck, Lint, relevante Tests, Build, vollständige GitHub CI auf dem **exakten letzten Head**. Bei Hosted-Preview nur in verifiziert isolierter Umgebung und ohne kostenpflichtige/geschützte Auth-Aktion; sonst korrekt BLOCKED.

**A6 – Review:** vollständiger `main`-Diff mit Scope-Check; alle Findings gesammelt, Self-Review und Handoff; ursprüngliche Probleme nicht einfach als Feature-Future markieren; bei neuem Commit alle alten Gates ungültig.

## 6. Lieferung und STOP

Muss im **gleichen Draft-PR** und im zugeordneten Issue erscheinen:

1. minimaler Befund / Ursachenmatrix, sichere Konfigurationsmetadaten (keine Werte);
2. falls möglich minimale Korrektur und regressionssichere Tests, sonst dokumentierte Blockade samt Owner-Schritt;
3. `STATUS`, `SELF_REVIEW`, `HANDOFF` als datierte eigene Dateien, mit Source-Head, tatsächlichen Test-/CI-/Preview-Gates, Folge-/Non-Scope und **belegter realer Cursor-Session-ID/Modell**;
4. kurze und ehrliche Endmeldung im PR: `REVIEW_REQUIRED` oder `BLOCKED_OWNER_GATE`, niemals `READY` aus eigener Autorität.

**STOPP. Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not dispatch another agent.** Nur der ChatGPT Technical Lead prüft unabhängig den exakten Head und entscheidet über `CHANGES REQUIRED` oder später `PASS`/Integration. Production, neue Schlüssel, kostenpflichtige Modellaufrufe, Login/2FA und kostenrelevante Änderungen bleiben beim Product Owner.