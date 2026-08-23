# Jetnity Account Platform – Implementierungsplan

Stand: 23. August 2026  
Status: **vorbereitet – Implementierung gesperrt bis Technical-Lead-Freigabe nach PR-#38-Closure**  
Workstream: Jetnity Account Platform  
Cursor-Anzeigename: **Account plattform audit vorbereitung**  
Branch dieses Audits: `audit/account-platform`

Dieser Plan schneidet **kleine, konfliktarme PRs**. Shared Contracts bleiben serial.

---

## 1. Sperre

Bis ChatGPT/Technical Lead nach technischem Closure von PR #38 ausdrücklich Implementierung freigibt:

- keine Auth-/RLS-/DB-Kernverträge
- keine Migrationen
- keine Traveller-Truth-Umbauten
- keine Guest→Account-Persistenzänderung
- keine Payment-/Subscription-Liveintegration
- kein Mark Ready / Merge ohne Product Owner

Erlaubt nach Freigabe zuerst: UI-only und dokumentierte Slices ohne Shared-Write.

---

## 2. Vorgeschlagene PR-Schnitte

Branch-Muster: `feat/account-<slice>` von aktuellem `main` **nach** Merge oder bewusstem Rebase-Punkt von PR #38.

### AP-0 – dieses Audit (jetzt)

- Branch: `audit/account-platform`
- Nur Dokumentation
- Draft-PR, kein Ready, kein Merge

### AP-1 – Account-Shell + Übersicht (UI, keine DB)

**Scope**

- `app/account/layout.tsx` mit kompakter Nav
- `/account` Übersicht: Begrüßung, nächste/aktive Reise aus bestehenden `reisenLaden()`-Daten, CTA Fortsetzen
- Link aus Navbar für `sitzung === konto`
- `/account/security` unter Einstellungen einhängen und visuell an V2 angleichen

**Nicht**

- neue Tabellen
- Workspace-Karten kopieren
- Traveller-Registry

**Tests**

- Nav-Einträge für gast/konto/unbekannt
- Übersicht: empty vs error vs eine kommende Reise
- kein Flug-/Hotel-Widget in der Übersicht
- Mobile + Desktop der Shell (bestehende UI-Audit-Viewports)

**Shared:** nein

### AP-2 – Auth-UX-Hygiene (keine Config-Push)

**Scope**

- OAuth-Buttons hinter Enablement
- `next`-Allowlist nur `/account*`, `/reisen*`
- Footer nutzt `sitzungseintraege()`
- Gast auf `/reisen`: primär Fortsetzen statt „Neue Reise“
- Legal-Seiten als statische, ehrliche Inhalte (kein Consent-DB-Write)
- MFA-Dialog a11y
- Register-Enumeration entschärfen
- Login/Register-Gates auf `getUser()`

**Nicht**

- Provider einschalten
- `config.toml` Production-URLs
- Consent-Tabelle

**Tests**

- `next` fremder Host wird verworfen
- OAuth-Buttons fehlen, wenn Flag aus
- Gast mit Entwurf sieht Fortsetzen
- Navigation-Tests erweitern

**Shared:** nein (Legal-Text braucht PO-Inhalt)

### AP-3 – Meine Reisen Lebenszyklus (ableitend)

**Scope**

- Gruppen Aktiv / Kommend / Vergangen / Ohne Datum aus `startDate`/`endDate`
- Suche/Filter optional klein
- Limit-200-Hinweis, wenn voll

**Nicht**

- `status = archived` schreiben
- zweites Listenmodell

**Tests**

- reine Datumsableitung, Zeitzone UTC-date-only wie `Reisekarte`
- Reise ohne Daten nicht in Vergangen
- Empty-Gruppe nicht als Fehler

**Shared:** nein

### AP-4 – Archivieren (kontrollierter Status-Write)

**Erst nach Lead-Freigabe**, weil `trips.status` Trip-Graph ist.

- ausdrückliche Aktion „Archivieren“ / „Wiederherstellen“
- ein Schreibweg, RLS unverändert, kein Service Role
- Gast: kein Archiv in Local Storage nötig; Entwurf verwerfen bleibt separat

**Shared:** ja (Trip-Status-Contract)

### AP-5 – Sicherheit vertiefen (Auth-API, keine Migration)

**Scope**

- Passwort ändern mit aktuellem Passwort
- Session-/Geräteliste + Logout-all, falls Supabase-API das ohne Schema hergibt
- MFA Step-up vor Enroll/Unenroll

**Shared:** Step-up ist Auth-Vertrag → mit Lead abstimmen; UI-Auffindbarkeit schon in AP-1

### AP-6 – Privacy-Foundation

**Ohne DB (6a)**

- `/privacy`, `/terms` verbindlich
- Cookie-Banner nur mit wahrem Text oder weiter unverbunden lassen

**Mit DB (6b, Shared)**

- Consent-Version + Zeitstempel
- Datenexport
- Kontolöschung über Auth-Admin- oder User-Delete-Pfad mit Ownership-Prüfung

**Shared:** 6b ja; mit Admin-Workstream (Support darf nicht extra PII ziehen)

### AP-7 – Account-Traveller-Registry

**Blockiert** bis Shared-Schnitt.

Vorarbeiten ohne Schema:

- UX-Prototyp auf Basis trip-scoped Party (nur Anzeige „gilt nur für diese Reise“)
- Evidence, dass keine Citizenship erfunden wird

Erst nach ADR-Nachfolger zu ADR-0102:

- Tabellen, RLS, Participation, Guest-Opt-in, Readiness-Stale

**Shared:** ja – Traveller, Readiness, Entry, Guest→Account

### AP-8 – Reiseprofil / Präferenzen

Eigene Tabelle oder `profiles`-Erweiterung **nur** nach AP-Profilentscheidung.  
Explizit vs. abgeleitet trennen. Keine Hard-Truth im Workspace.

**Shared:** ja (Identity/Profil)

### AP-9 – Favoriten

Neue Tabellen + RLS. Keine Vermischung mit Trip-Items.  
Kann nach AP-1 parallel geplant, nicht vor PO-Nutzenfrage gebaut werden.

**Shared:** neue Persistenz, aber isolierbar

### AP-10 – Buchungsübersicht

Read-only Aggregation vorhandener `trip_items`.  
Kein neues Booking-Modell.

**Shared:** nein, sofern nur lesend und Empty≠Error

### AP-11 – Benachrichtigungen

Themenmatrix inkl. Safety/Seasonal **nach** PR #38.  
Keine Vermischung der Aussagen. Persistenz Shared-nah (neue Tabelle).

### AP-12 – Abonnement-Platzhalter

Copy + Entitlement-Port, keine Stripe-Live.  
Shared mit Admin/Finance. `payments` nicht wiederverwenden.

---

## 3. Reihenfolge nach PR-#38-Closure

Empfohlen:

1. Lead prüft dieses Audit gegen Admin-Audit
2. AP-1 + AP-2 + AP-3 (parallel möglich, geringe Konflikte)
3. AP-5 UI-Teile
4. AP-6a Legal
5. Shared-Schnitte serial: AP-4, AP-6b, AP-7, AP-8, AP-12
6. AP-9 / AP-10 / AP-11 nach Produktnutzen

---

## 4. Dependencies und Konflikte

| Thema | Konflikt mit | Haltung |
| --- | --- | --- |
| PR #38 Seasonal | Account-Notifications, Workspace-Übersicht | nicht anfassen; Notifications erst danach |
| Admin-Workstream | Rollen, `profiles`, Export/Löschung, Payments, Support-Sicht | serial; keine doppelte Identity |
| ADR-0102 vs Produktmodell | Traveller-Registry | Lead-ADR vor Code |
| `party_schreiben` | Guest-Takeover, Readiness | nur dokumentiert, Slice AP-7+ |
| Auth Redirects Production | Launch | Ops-Gate, nicht Account-UI-PR |
| Workspace Function-by-Function | späterer großer Block | Account nicht als Vorwand für Workspace-Redesign |

---

## 5. Test- und Evidence-Plan (spätere PRs)

Pflicht pro Slice:

- Unit für Ableitungen (Reisegruppen, next-Allowlist, Nav)
- Guest/Account-Parität wo beide betroffen
- Empty ≠ Error
- kein Citizenship-Default
- bestehende `uebernahme.test.ts` dürfen nicht rot werden
- bei Shared: `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen` fail-closed
- UI-Audit-Viewports für neue Account-Shell
- keine Behauptung von Browser-Tests, die nicht liefen

Neue Regressionen, die dieses Audit verlangt (noch nicht geschrieben):

1. `next` Allowlist / Reject
2. OAuth-Buttons abhängig vom Flag
3. Gast-Fortsetzen-CTA
4. Datumsgruppen Meine Reisen
5. Takeover: Graph ok, Party fail → Entwurf bleibt, Retry idempotent
6. Übersicht enthält keine Workspace-Bereichskarten
7. Consent nicht nur Client-Checkbox (sobald 6b)
8. Registry ändert nicht still trip-fremde Reisen (sobald AP-7)

---

## 6. Definition of Done für die Auditphase

Erfüllt, wenn:

- Ist-Zustand geprüft
- Abweichungen dokumentiert
- Defekte priorisiert
- Zielarchitektur beschrieben
- Slices und Shared-Abhängigkeiten klar
- Handoff im Repository
- Self-Review geschrieben
- kein Ready, kein Merge
