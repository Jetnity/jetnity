# Jetnity Account Platform – verbindliche Review-Entscheidungen I1–I5

Stand: 24. August 2026  
Status: **verbindlich geklärt – Dokumentations-/Integrationsentscheidungen, keine Runtime-Freigabe**  
Workstream: Jetnity Account Platform  
Cursor-Anzeigename: **Account plattform audit vorbereitung**  
Branch: `audit/account-platform`  
Bezug: `docs/PR39_CHATGPT_ACCOUNT_AUDIT_REVIEW.md`

Diese Datei schließt die fünf Integrationspunkte I1–I5 aus dem unabhängigen Review von PR #39 auf der Architektur-/Prozessebene. Sie ist **keine** Freigabe für Mark Ready, Merge oder Account-Runtime-Implementierung.

---

## I1 – Multi-Agent-Policy: verbindlich aufgelöst

`docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` existiert bereits im PR-#38-/Seasonal-Workstream, obwohl sie auf dem älteren `main`, von dem PR #39 abzweigt, noch nicht sichtbar ist.

Verbindliche Regel:

1. Die im neueren PR-#38-Strang gepflegte Multi-Agent-Policy ist die maßgebliche Team-Policy.
2. Die Aussage „Policy existiert im Repository nicht“ darf nur als **branch-relativer Ist-Befund** des älteren Audit-Bases verstanden werden.
3. Vor jeder späteren Integration oder Implementierung des Account-Workstreams wird zuerst der dann aktuelle Main-/Closure-Stand gelesen.
4. Kein Account-Agent darf eine ältere lokale Kopie der Teamregeln über einen neueren Repository-Stand stellen.
5. Der exakte Cursor-Anzeigename bleibt in jedem Handoff verpflichtend.

**Status I1: RESOLVED.**

---

## I2 – Schutz zentraler Handoff-/Roadmap-Dateien: verbindlich aufgelöst

PR #39 basiert auf `main@cd220beb` und enthält branch-lokale Änderungen an zentralen Projektdateien, während PR #38 inzwischen neuere globale Projekt-/Review-/Teamstände besitzt.

Verbindliche Integrationsregel:

- `JETNITY_HANDOFF.md`, `ROADMAP.md` und `docs/ACTIVE_WORK_STATUS.md` aus PR #39 dürfen **niemals blind über einen neueren Stand gemergt** werden.
- Vor einer späteren Integration werden diese Dateien bewusst gegen den dann aktuellen Main-/PR-38-Closure-Stand reconciled.
- Bei Konflikt gewinnt die neuere globale Wahrheit; Account-spezifische Informationen werden gezielt übernommen, nicht die ganze ältere Datei.
- Account-spezifische Dauerwahrheit gehört bevorzugt in `docs/ACCOUNT_PLATFORM_*`, nicht als vollständige Ersatzfassung globaler Statusdateien.
- Ein Merge-/Rebase-Schritt muss ausdrücklich prüfen, dass kein neuerer PR-38-/Team-/Release-Status zurückgedreht wird.

**Status I2: RESOLVED als verbindliches Integrations-Gate.**  
Die branch-lokalen zentralen Dateien bleiben bis zur späteren Reconciliation unangetastet; daraus darf keine Mergefreigabe abgeleitet werden.

---

## I3 – MFA Step-up: zum Must-/Launch-Gate hochgestuft

Für eine produktive Jetnity Account Security gilt verbindlich:

- TOTP/MFA Enrollment und Unenrollment dürfen nicht allein aufgrund einer beliebigen gültigen Session möglich sein.
- Vor sicherheitskritischer Änderung ist eine belastbare Re-Authentifizierung bzw. ein geeigneter AAL-/Step-up-Nachweis erforderlich.
- Die konkrete Supabase-/Auth-Implementierung wird erst im koordinierten Security-Slice umgesetzt und darf nicht parallel zu anderen Auth-Kernänderungen erfolgen.
- `mfa_allow_low_aal = false` bleibt Sicherheitsgrundsatz.
- Security-UI darf erst als produktiv vollständig gelten, wenn Enrollment/Unenrollment, Sessions/Geräte, Logout-all und relevante Recovery-Flows fachlich konsistent geprüft wurden.

Priorität: **MUST vor Launch der entsprechenden Account-Security-Funktion**.

**Status I3: RESOLVED als Launch-Security-Gate; Runtime-Implementierung noch nicht freigegeben.**

---

## I4 – Privacy / Legal: technische Ziele und Rechtsbewertung sauber getrennt

Jetnity soll technisch professionelle Datenschutz-Selbstbedienung ermöglichen. Verbindliche Produkt-/Engineering-Ziele sind:

- stabile Privacy-/Terms-Seiten bzw. autoritative Legal-Quellen;
- nachvollziehbare Consent-Evidence mit Version und Zeitpunkt, wenn rechtlich/fachlich erforderlich;
- Datenexport;
- kontrollierter Account-/Datenlöschprozess;
- transparente verbundene Dienste und Widerrufsmöglichkeiten;
- ehrliche Cookie-/Analytics-Copy, die nur tatsächlich eingesetzte Verarbeitung behauptet.

Gleichzeitig gilt:

- Architektur- und Code-Dokumente treffen **keine abschließende juristische Bewertung** über konkrete gesetzliche Pflichten, Fristen oder Rechtsgrundlagen.
- Formulierungen wie „DSGVO/DSG zwingt exakt diese UI“ sind zu vermeiden, solange sie nicht belastbar rechtlich geprüft sind.
- CH-DSG/DSGVO-relevante Rechtstexte und verbindliche Compliance-Behauptungen erhalten vor Launch geeignete juristische Prüfung.
- Technisch bauen wir bevorzugt ein höheres Niveau an Transparenz und Nutzerkontrolle, ohne ungeprüfte Rechtsbehauptungen als Source of Truth zu speichern.

**Status I4: RESOLVED.**

---

## I5 – Account-Traveller-Registry: bewusst noch nicht als Datenmodell entschieden

Das Produktziel bleibt verbindlich:

- Accountbesitzer ist nicht automatisch der einzige Traveller.
- Jetnity soll später wiederverwendbare Reisenden-/Familienprofile unterstützen.
- mehrere Citizenships und Dokumente pro Traveller sind möglich;
- Document↔Citizenship-Zuordnung muss explizit bleiben;
- Citizenship/Credential wird niemals aus Wohnsitz, Sprache, Domain, Abflugland oder anderen indirekten Fakten erfunden;
- keine Passnummern, Scans, MRZ oder Biometrie in dieser Account-Foundation.

Noch **nicht** entschieden und daher für Agenten gesperrt:

1. endgültiges Tabellen-/Relationenmodell für `account_travellers`;
2. Snapshot-vs-Live-Verhalten zwischen Account-Stammdaten und einer konkreten Reise;
3. ob Guest→Account Mitreisende automatisch, opt-in oder erst auf ausdrückliche Aktion in die Account-Registry übernimmt;
4. wie ADR-0102 ersetzt oder erweitert wird;
5. welche Änderungen an Account-Traveller-Daten bestehende Readiness-/Entry-Evidence stale machen;
6. ob und wann eine Trip-Participation dauerhaft auf ein Account-Profil referenziert und welche Reise-Snapshots erhalten bleiben.

Diese sechs Punkte werden vor AP-7 in einem eigenen Technical-Lead/Product-Owner-Decision-Slice entschieden und als ADR dokumentiert. Bis dahin bleibt die bestehende trip-scoped Traveller-Truth der implementierte Vertrag.

**Status I5: RESOLVED als Decision-Gate; Datenmodell bewusst noch OPEN.**

---

## Gesamtstatus der fünf Punkte

| Punkt | Ergebnis | Runtime jetzt? |
| --- | --- | --- |
| I1 Multi-Agent-Policy | resolved | nein |
| I2 zentrale Docs / Reconciliation | resolved als Integrations-Gate | nein |
| I3 MFA Step-up | MUST Launch-Gate | später koordiniert |
| I4 Privacy/Legal-Trennung | resolved | spätere Implementierung |
| I5 Traveller-Registry | Decision-Gate festgelegt, Datenmodell bewusst offen | nein |

Damit sind alle fünf Review-Punkte **jetzt verbindlich behandelt**. Es bleibt absichtlich keine versteckte Implementierungsfreigabe.

## Nächster erlaubter Schritt

1. PR #38 technisch bis Closure/PASS bringen.
2. Admin-Audit durchführen und unabhängig prüfen.
3. Account- und Admin-Pläne auf gemeinsame Verträge (`profiles`, Auth/Rollen, Privacy/Delete, Billing/Entitlements, Support/Audit) legen.
4. Erst danach konkrete Account-Implementierungsslices freigeben.
5. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.
