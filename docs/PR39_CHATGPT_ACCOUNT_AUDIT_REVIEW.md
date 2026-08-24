# PR #39 – ChatGPT Independent Account-Audit Review

Stand: 24. August 2026  
Status: **AUDIT-PASS – Vorbereitung fachlich angenommen; keine Implementierungs-, Ready- oder Merge-Freigabe**

PR: `#39 – Account Platform Audit & Vorbereitung`  
Cursor-Anzeigename: **Account plattform audit vorbereitung**  
Branch: `audit/account-platform`  
Geprüfter Head vor diesem Review-Dokument: `80666d8216953ecfafa979ef20960a424ac58c45`  
Base: `main` @ `cd220beb44d90ae376feeb8de9db8a3afb808d60`

## 1. Urteil

Der Audit-/Vorbereitungsauftrag ist erfüllt. Der PR enthält auf dem geprüften Head ausschließlich Dokumentation; keine Runtime-, Auth-, RLS-, DB-, Traveller-, Payment- oder Seasonal-Implementierung wurde eingeschleust.

Die Kernthese ist plausibel und wird durch den Ist-Code gestützt: Jetnity besitzt Auth, `/reisen`, den Trip Workspace und eine isolierte `/account/security`-Seite, aber noch keine zusammenhängende Account Platform als persönliches Zuhause. Der vorgeschlagene Grundsatz **Account aggregiert/verwaltet; Trip Workspace operiert eine einzelne Reise** ist eine geeignete Architekturgrenze und verhindert ein zweites Workspace-Dashboard.

Der Audit darf deshalb als Planungsgrundlage verwendet werden. Er ist **keine** Freigabe für AP-1 bis AP-12.

## 2. Unabhängig verifizierte Evidence

Auf exakt `80666d8216953ecfafa979ef20960a424ac58c45`:

- PR #39 ist `open`, `Draft`, `mergeable`, nicht gemergt.
- Changed files: 12, ausschließlich Markdown-/Dokumentationsdateien.
- GitHub Actions Run `32669569360`: `SUCCESS`.
- Die CI hat nicht nur die vier lokal genannten gezielten Tests ausgeführt, sondern den normalen Job `Typecheck, Lint & Build` inklusive Tests, Hygiene-Prüfungen und **Production build** erfolgreich beendet.
- Vercel Deployment `dpl_BL91PAefDdf5S57y2ynYkEK7TLiB`: `READY`, `githubCommitSha=80666d8216953ecfafa979ef20960a424ac58c45`.

Stichproben im Base-Ist-Code bestätigen u. a.:

- `/account/security` existiert als isolierte Seite und rendert `SecurityMFA`, ohne Account-Shell.
- `CookieConsent.tsx` existiert; eine Nutzung/Einbindung wurde im Code-Search nicht gefunden.
- Eine echte Account-IA ist im geprüften Base nicht vorhanden.

## 3. Fachlich angenommene Architektur

Als Arbeitsgrundlage angenommen:

1. `/account` wird persönliches Konto-Zuhause; `/reisen` bleibt Reise-Hub; `/reisen/[tripId]` bleibt Kommandozentrale einer einzelnen Reise.
2. Keine zweite Booking-, Trip-, Safety-, Seasonal-, Readiness- oder Traveller-Truth im Konto.
3. Accountbesitzer ist nicht automatisch Traveller.
4. Citizenship/Credential wird niemals aus Wohnsitz, Sprache, Domain, Abflugland oder anderen indirekten Merkmalen erfunden.
5. Guest bleibt bis zur expliziten Übernahme lokal/trip-scoped.
6. Shared Contracts (Traveller, Auth/RLS, Consent/Delete, Billing/Entitlements) werden serial nach Lead-Schnitt geändert.

## 4. Verbindliche Review-Korrekturen / Integrationsbedingungen

### I1 – Multi-Agent-Policy ist nicht wirklich „im Repository nicht vorhanden“

Die Aussage ist nur relativ zu `main`/diesem Audit-Branch korrekt. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` wurde im PR-#38-Workstream bereits angelegt. PR #39 basiert noch auf dem älteren `main`, daher sieht **Account plattform audit vorbereitung** diese Datei nicht.

Vor jeder späteren Integration muss PR #39 auf den dann aktuellen Main-/PR-38-Abschlussstand rebased bzw. manuell reconciled werden. Die PR-#38-Team-Policy ist dabei die höherrangige Multi-Agent-Policy und darf nicht durch ältere `ACTIVE_WORK_STATUS`, `JETNITY_HANDOFF`- oder `ROADMAP`-Varianten überschrieben werden.

### I2 – Zentrale Dokumente dürfen beim späteren Merge keinen neueren Stand zurückdrehen

PR #39 ändert `JETNITY_HANDOFF.md`, `ROADMAP.md` und `docs/ACTIVE_WORK_STATUS.md`, obwohl sein Base vor den aktuellen PR-#38-Review-/Team-Commits liegt. Das ist für einen isolierten Audit-Branch akzeptabel, aber vor Integration zwingend konfliktbewusst zu reconciliieren. Kein Blind-Merge dieser drei Dateien.

### I3 – MFA-Step-up wird als Launch-Security-Gate behandelt

Der Audit stuft MFA-Enroll/Unenroll ohne Step-up selbst als mittel–hoch ein, führt es später aber nur unter „Should“ auf. Für die spätere produktive Account-Security wird Re-Auth/AAL2 vor Enrollment/Unenrollment als **Must vor Launch dieser Funktion** behandelt. Das ist kein Auftrag, den Auth-Vertrag jetzt parallel zu ändern.

### I4 – Privacy-Anforderungen fachlich von Rechtsbehauptungen trennen

Legal-Seiten, Consent-Evidence, Export- und Löschprozesse sind für Jetnitys professionelle Launch-Qualität klare Must-Themen. Aussagen wie „Privacy-Rechte nicht erfüllbar“ oder eine zwingende Selbstbedienungs-UI sind jedoch keine abschließende Rechtsbewertung. Die spätere Umsetzung braucht einen belastbaren CH-DSG/DSGVO-Prozess und, für verbindliche Rechtstexte/Fristen, geeignete juristische Prüfung. Technisch soll Jetnity Self-Service ermöglichen, aber die Architektur darf keine ungeprüften Rechtsbehauptungen als Code-Truth behandeln.

### I5 – Traveller-Registry bleibt bewusst unentschieden

Die vorgeschlagene Account-Traveller-Registry ist sinnvoll, aber `Snapshot vs. Live`, Opt-in beim Guest→Account und die Ablösung/Erweiterung von ADR-0102 bleiben echte Lead-/Product-Owner-Entscheidungen. Kein Agent darf aus dem Zielarchitektur-Dokument ableiten, dass diese Fragen bereits entschieden seien.

## 5. Implementierungsreihenfolge

Nach PR-#38-Closure und nach Vergleich mit dem Admin-Audit sind AP-1/AP-2/AP-3 gute erste Kandidaten, **aber nicht automatisch drei gleichzeitig**. Vor Start wird die konkrete Datei-/Ownership-Matrix geprüft, damit Navbar, `/reisen` und Account-Shell nicht in parallelen PRs dieselben Komponenten ändern.

Shared Slices AP-4/AP-5-security-core/AP-6b/AP-7/AP-8/AP-12 bleiben serial bzw. explizit koordiniert.

## 6. Stop-Kriterium für diese Auditphase

Es wurde kein konkreter Grund gefunden, den Audit neu aufzusetzen oder weitere Audit-Runden zu erzwingen. Mit den Integrationsbedingungen I1–I5 ist die Vorbereitungsphase fachlich ausreichend tief.

**AUDIT-PASS.**

Nicht enthalten in diesem PASS:

- keine Produkt-Owner-Mergefreigabe;
- kein Mark Ready;
- keine Freigabe für Runtime-/Auth-/DB-Implementierung;
- keine Entscheidung über Traveller-Registry oder Billing;
- keine Aussage, dass PR #39 in seinem heutigen Base-Zustand später blind gemergt werden darf.

Nächster Schritt: PR #38 technisch schließen; Admin-Audit abwarten/prüfen; danach Account-/Admin-Pläne gemeinsam schneiden und die ersten konfliktarmen Implementierungsworkstreams freigeben.