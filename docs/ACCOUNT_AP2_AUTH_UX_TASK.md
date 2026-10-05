# Jetnity Account AP-2 – Auth-UX-Hygiene

Stand: 24. August 2026
Status: **IMPLEMENTIERUNGSAUFTRAG FREIGEGEBEN – Draft, kein Ready, kein Merge**
Cursor-Agent: **`Account plattform audit vorbereitung`**
Branch: `feat/account-ap2`
Stack-Basis: `feat/account-ap1` @ `9cc9b0526683f161f500326a7b72c74abac9c296`
Vorgänger: PR #43 – Account AP-1 = Technical Closure / PASS
Audit-Quelle: PR #39 / `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`

---

## 1. Ziel

AP-2 härtet die bestehende Account-/Auth-UX, ohne neue Identitäts-, Datenbank- oder Provider-Wahrheit einzuführen.

Der Slice soll insbesondere verhindern, dass Jetnity:

- OAuth-Optionen sichtbar anbietet, die nicht wirklich aktiviert sind,
- offene Redirects über `next` zulässt,
- Login-/Registerzustände aus ungeeigneten Session-Signalen ableitet,
- bei Registrierung die Existenz eines Kontos unnötig offenlegt,
- Gastnutzer mit vorhandenem Reiseentwurf unnötig in einen neuen Flow schickt,
- MFA-Dialoge mit schlechter Tastatur-/Screenreader-Bedienbarkeit ausliefert,
- Session-/Account-Navigation an mehreren Stellen unterschiedlich formuliert.

AP-2 ist **kein Auth-Backend-Redesign**.

---

## 2. Pflichtquellen vor Code

Der Agent liest zuerst vollständig:

1. `AGENTS.md`
2. `JETNITY_HANDOFF.md`
3. `ARCHITECTURE.md`
4. `DECISIONS.md`
5. `ROADMAP.md`
6. `docs/ACTIVE_WORK_STATUS.md`
7. `docs/ACCOUNT_AP1_IMPLEMENTATION_TASK.md`
8. `docs/ACCOUNT_AP1_HANDOFF.md`, falls vorhanden
9. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
10. `docs/PR39_CHATGPT_ACCOUNT_AUDIT_REVIEW.md`
11. `docs/ACCOUNT_PLATFORM_REVIEW_DECISIONS_I1_I5.md`
12. `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`, falls auf diesem Stack vorhanden
13. relevante Auth-/Login-/Register-/OAuth-/MFA-/Navbar-/Footer-/Reisen-Dateien und deren Tests
14. `supabase/config.toml` **nur lesen**, nicht in diesem Slice auf Production-Redirects oder Provideraktivierung ändern

Vor Implementierung kurzer Plan im Agent-Worklog: Ziel, betroffene Dateien, Security-Auswirkung, Tests, keine DB-Migration.

---

## 3. Architekturregel für diesen Stack

AP-2 ist bewusst auf dem technisch geschlossenen AP-1-Head gestapelt.

Warum:

- AP-2 berührt Account-/Session-Navigation und kann dadurch mit AP-1 überlappen.
- AP-1 bleibt als eigener PR reviewbar.
- AP-2 darf AP-1 nicht duplizieren oder rückbauen.

Solange PR #43 nicht gemergt ist:

- PR für AP-2 hat Base `feat/account-ap1`.
- AP-2 enthält nur den Delta-Scope dieses Auftrags.
- Kein Merge/Ready von AP-1 oder AP-2 ohne Product Owner.

Nach einem später ausdrücklich freigegebenen Merge von PR #43 kann der Technical Lead AP-2 auf `main` retargeten/synchronisieren.

---

## 4. Scope A – OAuth nur bei echtem Enablement anzeigen

### Ziel

OAuth-Buttons dürfen nur sichtbar/interaktiv sein, wenn der jeweilige Provider im bestehenden Jetnity-Setup tatsächlich als aktiviert belegt ist.

### Anforderungen

- Vorhandene Enablement-/Config-Mechanismen wiederverwenden.
- Kein Provider wird in diesem Slice aktiviert.
- Keine neuen Secrets/API-Keys.
- Kein `supabase/config.toml`-Push für Production.
- Keine UI, die „Google/Apple verfügbar“ behauptet, wenn die Aktivierung nicht belegt ist.
- Fehlende/unklare Konfiguration = fail closed: Button nicht anzeigen oder eindeutig nicht verfügbar, entsprechend bestehendem UX-Muster.

### Verboten

- Provider-Erreichbarkeit aus bloß vorhandenen Environment-Variablennamen ableiten, wenn sie nicht die tatsächliche Aktivierung belegen.
- Fake-Buttons als Marketingdekoration.

---

## 5. Scope B – sichere `next`-Navigation

### Ziel

Login/Register dürfen nach Erfolg nur auf erlaubte Jetnity-interne Ziele weiterleiten.

### Erlaubt

Nur relative Jetnity-Pfade unter:

- `/account`
- `/account/...`
- `/reisen`
- `/reisen/...`

Query/Hash dürfen nur erhalten bleiben, wenn der normalisierte Pfad weiterhin innerhalb dieser Allowlist liegt.

### Muss verworfen werden

Mindestens:

- `https://evil.example/...`
- `http://evil.example/...`
- `//evil.example/...`
- Backslash-/Slash-Tricks
- Protokoll-relative oder absolute URLs
- Pfade außerhalb `/account*` und `/reisen*`
- Encodings/Normalisierungen, die nach Dekodierung aus der Allowlist ausbrechen

### Verhalten bei ungültig

Fail closed auf einen bestehenden sicheren Jetnity-Default, nicht auf den fremden Wert.

Die Allowlist-Logik muss zentral testbar sein; keine duplizierte String-Prüfung in Login und Register.

---

## 6. Scope C – Login/Register Auth-Gates auf vertrauenswürdigem User-Signal

### Ziel

Serverseitige Login-/Register-Entscheidungen verwenden `getUser()` bzw. den bereits etablierten vertrauenswürdigen User-Pfad statt nur lokalem Session-Payload als Autoritätsbeweis.

### Grenzen

- Kein neues Auth-Modell.
- Keine Änderung an MFA/AAL-Regeln.
- Keine Service-Role-Ausweitung.
- Bestehende Middleware-/SSR-Architektur respektieren.
- Keine zusätzlichen Redirect-Loops erzeugen.

Tests müssen eingeloggte/nicht eingeloggte Fälle und ungültige Session-Signale abdecken, soweit vorhandene Harnesses das erlauben.

---

## 7. Scope D – Registrierungs-Enumeration entschärfen

### Ziel

Öffentliche Register-UX soll nicht unnötig offenlegen, ob eine E-Mail bereits als Konto existiert.

### Anforderungen

- Nutzertexte neutral formulieren, soweit Supabase-/bestehender Flow das zulässt.
- Keine falsche Behauptung, dass eine Mail versendet wurde, wenn das nicht belegbar ist.
- Keine Security-by-obscurity-Tricks, die den echten Fehlerzustand intern unbrauchbar machen.
- Serverlogs/diagnostische interne Fehler dürfen weiterhin ausreichend präzise sein, aber nicht als öffentliche Enumeration ausgegeben werden.

### Verboten

- Account-Existenz durch unterschiedliche auffällige Erfolgs-/Fehlercopy ohne Notwendigkeit preisgeben.
- Auth-Provider-Konfiguration ändern.

---

## 8. Scope E – Gast auf `/reisen`: Fortsetzen vor Neu beginnen

### Ziel

Wenn ein Gast bereits einen gültigen lokalen Reiseentwurf hat, ist der primäre nächste Schritt **Fortsetzen** statt ihn unnötig zu einer neuen Reise zu schicken.

### Anforderungen

- Bestehende Gast-/LocalStorage-Truth verwenden; keinen zweiten Draft-State einführen.
- Kein automatisches Löschen/Überschreiben des Entwurfs.
- „Neue Reise“ darf als sekundäre bewusste Aktion bestehen bleiben, sofern das aktuelle Produktmuster dies vorsieht.
- Ohne vorhandenen Entwurf bleibt die bestehende Neu-starten-UX korrekt.
- Guest→Account-Takeover-Contract wird nicht verändert.

---

## 9. Scope F – Session-Navigation / Footer konsistent

### Ziel

Footer bzw. öffentliche Session-Einträge verwenden die vorhandene zentrale Session-Navigationslogik (`sitzungseintraege()` oder den aktuell kanonischen Nachfolger), statt Auth-Links separat und widersprüchlich nachzubauen.

### Anforderungen

- Kein Homepage-Redesign.
- Keine Header-/Footer-Funktionsneuerfindung.
- Nur Konsistenz der bestehenden Session-Einträge.
- AP-1-Account-Navigation nicht rückbauen.

---

## 10. Scope G – MFA-Dialog Accessibility

### Ziel

Bestehende MFA-UI wird zugänglich bedienbar, ohne den MFA-/AAL-Vertrag zu ändern.

Mindestens prüfen/fixen:

- Dialog-Rolle und zugänglicher Name/Beschreibung
- initialer Fokus
- Tastaturbedienung
- Fokus bleibt sinnvoll im Dialog bzw. kehrt nach Schließen zurück, entsprechend bestehender Dialog-Infrastruktur
- Escape nur wenn der konkrete Sicherheitsflow das erlaubt
- Labels/Instructions/Error-Association für MFA-Codefelder
- kein Fokusverlust bei Fehlermeldungen
- ausreichende Touch-Targets/mobile Nutzung

Kein neues MFA-Backend und keine neue Enrollment-/Unenrollment-Autorität in AP-2.

---

## 11. Legal-Seiten – harte Grenze

Der Auditplan erwähnt Legal-Seiten. In AP-2 gilt:

- Bestehende, bereits freigegebene statische Legal-Inhalte dürfen technisch sauber erreichbar bleiben.
- **Keine neuen rechtlichen Versprechen, AGB-, Datenschutz- oder Consent-Inhalte erfinden.**
- Keine Consent-Tabelle, kein Consent-Write.
- Wenn Textinhalt Product-Owner-/Legal-Freigabe braucht, dokumentieren und nicht eigenmächtig formulieren.

---

## 12. Explizit NICHT Teil von AP-2

- keine DB-Migration
- kein Schema/RLS
- keine Consent-Persistenz
- keine Traveller-Registry
- keine Guest→Account-Persistenzänderung
- keine Payment-/Subscription-Arbeit
- keine Provider-Aktivierung
- keine OAuth-Secrets/API-Keys
- keine Production-Redirect-Konfigurationsfreigabe
- kein Admin-Scope
- keine Homepage-Neugestaltung
- kein AP-3
- keine Änderung an Route-/Readiness-/Safety-/Seasonal-Truth
- kein neues Design-System

Wenn eine saubere AP-2-Lösung einen dieser Punkte erfordern würde: stoppen, Befund dokumentieren, Technical Lead fragen.

---

## 13. Pflicht-Regressionen

Mindestens neue/erweiterte Tests für:

1. `next=/account` erlaubt
2. `next=/account/security?...` erlaubt
3. `next=/reisen` erlaubt
4. `next=/reisen/<id>` erlaubt
5. fremder Host verworfen
6. `//evil.example` verworfen
7. außerhalb Allowlist, z. B. `/admin`, verworfen
8. Encoding-/Slash-Trick kann Allowlist nicht umgehen
9. OAuth-Button fehlt/fail-closed, wenn Provider nicht belegt aktiviert ist
10. OAuth-Button erscheint nur im belegten Enablement-Fall
11. Gast mit gültigem Entwurf sieht Fortsetzen als primären CTA
12. Gast ohne Entwurf bekommt keinen falschen Fortsetzen-Zustand
13. Register-Public-Copy leakt Kontoexistenz nicht unnötig
14. Login/Register-Gate nutzt vertrauenswürdigen User-Pfad
15. MFA-Dialog hat zugänglichen Namen/Labels und sinnvolle Fokus-/Keyboard-Semantik
16. bestehende AP-1-Account-Navigation bleibt grün
17. Empty ≠ Error bleibt erhalten, wo lesende Zustände berührt werden

Keine Behauptung eines Browser-/A11y-Tests, der nicht tatsächlich lief.

---

## 14. Vollständige Gates vor Handoff

Der Agent führt auf dem finalen Runtime-Head mindestens aus, soweit im Repository vorhanden:

- relevante AP-2 Unit-/Contract-Tests
- vollständiges `npm test`
- Typecheck
- Lint
- Hygiene-Checks
- Auth-Konfigurationscheck
- Production-Build
- Account UI-Audit auf bestehenden Viewports/Engines, wenn AP-2 sichtbare Account/Auth-Oberflächen ändert

Danach:

1. finalen Runtime-Head pushen
2. GitHub Actions auf **genau diesem Head** SUCCESS abwarten
3. Vercel Preview auf **demselben Head** READY abwarten
4. erst dann Handoff-/Self-Review-Dokumentation aktualisieren
5. keine endlose Docs-Commit/CI-Schleife erzeugen; Runtime-Head und docs-only Head klar unterscheiden

---

## 15. Pflicht-Deliverables

Mindestens:

- `docs/ACCOUNT_AP2_STATUS.md`
- `docs/ACCOUNT_AP2_HANDOFF.md`
- `docs/ACCOUNT_AP2_SELF_REVIEW.md`
- relevante ADR/`DECISIONS.md` nur wenn tatsächlich eine neue dauerhafte Architekturentscheidung entsteht
- `docs/ACTIVE_WORK_STATUS.md` nur auf diesem Branch korrekt fortschreiben
- `JETNITY_HANDOFF.md` nur wenn für Continuity nötig

Abschlussbericht enthält:

**Umgesetzt**
**Dateien**
**Datenbank**
**Tests**
**Build**
**Security**
**Kosten**
**Dokumentation**
**Offene Punkte**
**Risiken**
**Empfehlung**

---

## 16. Abschluss- und Governance-Regel

Wenn AP-2 implementiert und gegated ist:

- Agent stoppt.
- PR bleibt Draft.
- Kein Mark Ready.
- Kein Merge.
- Kein AP-3.
- Unabhängiger ChatGPT/Technical-Lead-Review ist Pflicht.

Auch PASS/Technical Closure durch den Technical Lead ersetzt **nicht** die ausdrückliche aktuelle Product-Owner-Freigabe für Mark Ready oder Merge.
