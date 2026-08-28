# Jetnity Account Platform – kanonischer Implementierungsplan

Stand: 28. August 2026  
Status: **KANONISCH FÜR AP-5–AP-12 / RECONCILED AUS AKTUELLEM `main` + HISTORISCHER EVIDENCE / KEINE RUNTIME-FREIGABE**  
Workstream: Account / Traveller  
Cursor-Anzeigename: **Account plattform audit vorbereitung 5**  
Slice: P2-TA-03 / Issue #116 / Draft-PR #117  
Live-`main` bei Erstellung: `43aef6431aeea619ea896d456e16579b1034b9dd`

> **Live-Evidence gewinnt immer.** Dieser Plan steuert AP-5–AP-12. Er startet keinen Runtime-Slice.

Dieser Datei ist der **aktuelle kanonische Account-Platform-Implementierungsplan**.  
Die gleichnamige Datei auf Draft-PR #39 / Branch `audit/account-platform` ist **historische Evidence** vom 24. August 2026 und keine heutige Produktwahrheit.

Begründung der Kanonizität: ADR-0179.

---

## 0. Evidence-Klassen

Jede Aussage in diesem Plan fällt in genau eine Klasse:

| Klasse | Bedeutung |
| --- | --- |
| **current** | belegt auf aktuellem `main` bzw. durch Live-Evidence nach PR #115 |
| **integrated** | bereits gemergt; nicht erneut als zukünftige Arbeit planen |
| **historical** | zeitgebundene Evidence, damals gültig |
| **superseded** | durch spätere kanonische Entscheidung oder Live-Evidence ersetzt |
| **pre-merge evidence** | Draft-/Review-Stand vor Merge |
| **gated** | später möglich, aber nur nach dokumentiertem Gate |
| **not started** | noch nicht gebaut; dieser Plan spezifiziert nur den Schnitt, nicht den Start |

Historische PR-#39-Texte, ältere Account-Statusdateien und Pre-AP-4-Audits werden nicht gelöscht. Sie dürfen neuere Live-Evidence nicht überschreiben.

---

## 1. Warum dieser Plan existiert

`docs/JETNITY_BINDING_BUILD_ORDER.md` Abschnitt 3 verlangt, AP-5–AP-12 gemäß `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` weiterzuführen.

Bis P2-TA-03 existierte diese Datei **nicht** auf aktuellem `main`. Die vollständige alte Fassung lag nur auf:

- Draft-PR #39
- Branch `audit/account-platform`
- Head `65b08f4718ad74f3157c55a3efb960a4c843408a`

Live-Drift gegen `origin/main` `43aef643` bei Rekonstruktion:

- Merge-Base von `origin/audit/account-platform` gegen `origin/main`: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Ahead/Behind: **11 ahead / 513 behind**

Die historische Datei enthält Pre-AP-4-Status, eine supersedierte Agenten-Session-Annahme und eine supersedierte per-PR-Product-Owner-Merge-Pflicht. Sie darf nicht kopiert oder als Current Truth behandelt werden.

P2-TA-03 schließt diese Continuity-Lücke. **P2-TA-03 ist kein AP-5-Start.**

---

## 2. Was aus PR #39 superseded ist

| Historische Annahme (PR #39, 24. August 2026) | Klasse | Aktuelle Wahrheit |
| --- | --- | --- |
| Implementierung gesperrt bis PR-#38-Closure | **superseded** | Seasonal / PR #38 ist längst integriert. Die Sperre ist keine aktuelle Runtime-Bremse. |
| Derselbe unnummerierte Agent führt AP-1–AP-12 sequenziell weiter | **superseded** | `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`: frische Session je logischer Einheit. Generation 5 ist dieser Audit. |
| Kein Ready/Merge ohne Product Owner je PR | **superseded** | `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`. Nur ChatGPT / Technical Lead darf Ready/Merge. Cursor-Agenten niemals. Blind mergen bleibt verboten. Besondere Product-Owner-Gates bleiben. |
| AP-1, AP-2, AP-3, AP-4 sind zukünftige Slices | **superseded / integrated** | Alle vier sind auf `main`. Nicht neu planen. |
| AP-4 als offener Shared-Schnitt in der späteren Serie | **integrated** | PR #108 / ADR-0177. |
| Notifications erst nach PR #38 | **superseded als Blocker** | Seasonal ist integriert. AP-11 bleibt trotzdem hinter Notification-/Consent-/Provider-Gates. |
| ADR-Nachfolger nur zu ADR-0102 | **historical / erweitert** | ADR-0102 und ADR-0117 lehnen accountweite Profile bewusst ab. Ein späterer Registry-Schnitt braucht einen **neuen** ADR-Nachfolger. Dieser Plan erfindet ihn nicht. |
| Kein Supabase Development-Branch | **superseded** | Live-Korrektur 28. August 2026: default `main` `qscbgcdmivbbnzrcyegn` und non-default `develop` sind `ACTIVE_HEALTHY`. Keine Branch-Mutation durch Account-Slices. |
| Datei auf `audit/account-platform` ist der Steuerungsvertrag | **superseded** | Diese Datei auf aktuellem Integrationspfad ist kanonisch. |

Was aus PR #39 **weiterhin fachlich gilt** und hier übernommen wird, weil aktuelle Evidence es bestätigt:

- kleine, konfliktarme PRs statt Monster-Slices;
- Shared Contracts serial;
- AP-1 ist Zuhause, kein Workspace-Klon;
- AP-3 leitet Lebenslage ab und schreibt sie nicht;
- AP-4 war der einzige `trips.status`-Write; das ist erledigt;
- AP-7 bleibt hinter Shared-Contract + Product-Owner;
- kein Default-Pass / keine erfundene Citizenship;
- Marketing darf keine zweite Consent-/Account-Wahrheit erzeugen;
- AP-12 darf `payments` nicht als Consumer-Entitlement wiederverwenden;
- Legal-Texte nicht erfinden.

---

## 3. Verbindliche Invarianten

### 3.1 Traveller

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.**

Niemals:

- Default-Pass erfinden;
- Default-Citizenship erfinden;
- Issuer Country mit Citizenship gleichsetzen;
- `documents[0]` oder `evaluations[0]` als Product Truth verwenden.

P2-TA-06 / PR #113 / Issue #112 ist **integrated**. Nicht erneut bauen.

Foundation E bleibt trip-scoped Current Truth. AP-7 darf das nicht still verschieben.

### 3.2 Truth

Keine Demo-/Placeholder-Wahrheit als Endzustand. `unknown`, `stale`, `error`, `unavailable`, `insufficient_context` und `empty` bleiben getrennt. LLM erzeugt keine Hard Truth.

### 3.3 Privacy / Growth

Marketing, CRM, Referral und Discoverability dürfen Account-/Consent-/Notification-/Entitlement-Wahrheit **nur lesen**, sobald sie existiert. Sie dürfen keine zweite Consent- oder Identity-Wahrheit erzeugen. Sensitive Dokument-/Pass-/MRZ-/Biometrie-Daten sind vom Targeting ausgeschlossen.

### 3.4 Native

`one product, one truth, multiple clients`. Keine separate mobile Account-Wahrheit. Native-Implementierung ist Non-Scope dieses Programms.

---

## 4. Integrierte Baseline – nicht erneut planen

### AP-1 – persönliches Zuhause — **integrated**

Evidence: ADR-0152, ADR-0153, `ARCHITECTURE.md` Abschnitt 4a, `app/account/*`, `lib/account/navigation.ts`.

Liefert:

- `/account` als dauerhaftes Zuhause, nicht als Workspace-Klon;
- Nav nur Übersicht / Reisen / Einstellungen;
- Empty ≠ Error;
- aktiv/kommend nur gegen Geräte-Kalendertag;
- `/account/security` unter Einstellungen auffindbar.

Nicht erneut als zukünftige Arbeit schneiden. Historische ADR-Sätze „PR #43 bleibt Draft“ sind **pre-merge evidence**.

### AP-2 – Auth-UX-Hygiene — **integrated**

Evidence: `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md`, `lib/auth/naechstes-ziel.ts`, `RegisterForm.tsx`, `LoginForm.tsx`, `MFATotpDialog.tsx`.

Liefert:

- OAuth-Buttons hinter Enablement; Google/Apple in `supabase/config.toml` `enabled = false`;
- `next`-Allowlist nur `/account*` und `/reisen*`;
- Register-Enumeration entschärft;
- Login/Register-Gates auf `getUser()`;
- MFA-Dialog bei Login;
- Legal-Checkbox verlinkt `/terms` und `/privacy`.

Bewusst **nicht** geliefert und deshalb Rest von AP-5/AP-6a:

- eingeloggte Passwortänderung;
- Session-/Geräteliste;
- Consent-Persistenz;
- echte Legal-Seiten.

### AP-3 – abgeleitete Reisegruppen — **integrated**

Evidence: ADR-0160, `lib/account/reise-lage.ts`, `KontoReisenGruppen.tsx`.

Liefert Aktiv / Kommend / Vergangen / Ohne Datum aus `startDate`/`endDate`. 200er-Grenze sichtbar, ohne weitere Reisen zu behaupten. Schreibt kein `archived`.

Nachtrag: der Aufrufer filtert archivierte Reisen **vor** der Gruppierung (AP-4). `reisenGruppenAus` selbst bleibt date-only.

### AP-4 – Account Archive Lifecycle — **integrated**

Evidence: PR #108 / Merge `70cac163`, ADR-0177, `lib/trips/archiv-aktionen.ts`.

Liefert:

- einen Schreibweg `reiseArchivLebenszyklus`;
- Restore nur aus `metadata.account_archive.previous_status`;
- Optimistic Guard gegen Status **und** `updated_at`;
- eigenen Archiv-Abschnitt in `/reisen`;
- kein Guest-Archiv;
- keine Migration, kein RLS-/Auth-/AAL-Change, kein Service Role.

Residual: kein authentifizierter Real-Device-Beweis der Archiv-UI. Das ist QA-Evidence-Debt, kein erneuter AP-4-Slice.

### Weitere integrierte Traveller-/Account-Arbeit

| Slice | Stand |
| --- | --- |
| Foundation E | **integrated** auf Production; nicht neu bauen |
| P1-TA-02 Official Option Scope | **integrated** / PR #84 / ADR-0167 |
| P2-TA-06 Credential Normalization | **integrated** / PR #113 / ADR-0178 |
| Guest→Account | **integrated**; kopiert `party[]` trip-scoped; ADR-0166 streicht unbewiesene Handelsfelder |

---

## 5. Current Truth außerhalb der Account-Slices

Diese Abhängigkeiten steuern AP-5–AP-12. Sie werden hier nicht umgebaut.

### 5.1 Auth / Sessions / MFA / AAL

| Fähigkeit | Stand | Evidence |
| --- | --- | --- |
| Login + MFA-Dialog | **integrated** | `LoginForm.tsx`, `MFATotpDialog.tsx` |
| TOTP-Enroll/Unenroll im Konto | **integrated** | `/account/security` → `SecurityMFA.tsx` |
| Passkeys | **gated** | UI-Panel existiert; `[auth.passkey] enabled = false` |
| Consumer-AAL2-Pflicht auf `/account` | **missing** | Middleware prüft Auth, nicht AAL |
| Admin-AAL2 | **integrated** | `lib/auth/admin-aal.ts`; Production `20260827170000` angewendet, exakt einmal |
| Passwort ändern, eingeloggt | **integrated (AP-5-S2 / PR #137)** | `/account/security` → `SecurityPasswort`; Vertrag `reauthenticate()` → Nonce → `updateUser({ password, nonce })`. Recovery bleibt getrennt. Issue #136 CLOSED / completed. |
| Session-/Geräteliste | **missing** | keine UI, keine API-Route |
| Fundamentale Auth-/MFA-/AAL-Änderung | **Product-Owner-Gate** | nicht in einem normalen Account-UI-Slice |

### 5.2 Privacy / Legal / Consent

| Fähigkeit | Stand | Evidence |
| --- | --- | --- |
| `/privacy`, `/terms` | **missing / 404** | D0-P1-03; keine `app/**/privacy` oder `terms` Page |
| Register verlangt Zustimmung | **integrated, broken link** | `RegisterForm.tsx` |
| Cookie-Banner | **orphan** | `components/layout/CookieConsent.tsx` nicht gemountet; `check:dead`-Ausnahme |
| Consent-Tabelle | **missing** | keine Migration |
| Datenexport / Kontolöschung | **missing** | kein Consumer-Runtime |

Legal-Texte dürfen **nicht erfunden** werden. AP-6a braucht Product-Owner-/Legal-Inhalt.

### 5.3 Traveller Current Truth

Ausschließlich trip-scoped:

- `trip_travellers`
- `trip_traveller_citizenships` (1:n, max 8; C1 erzwingt das Limit auch bei UPDATE/Reparenting)
- `trip_traveller_documents` (1:n, max 12; C1 erzwingt das Limit auch bei UPDATE/Reparenting)
- `Trip.party` ausdrücklich keine accountweiten Profile
- `trips.travellers` ist Kopfzahl 1–20, keine Identität
- P2-TA-04 C1 (Issue #122) härtet den trip-scoped Write-Contract; das ist **kein** AP-5- und **kein** AP-7-Start

Account-Traveller-Registry: **missing / gated (AP-7)**.

### 5.4 Guest → Account

`GastreiseBruecke` → `gastreiseUebernehmen` → optional `partyUebernehmen` / `party_schreiben`. Dieselbe Array-Form. Keine accountweite Identität. Unbewiesene Commercial Fields werden gestrichen (ADR-0166).

### 5.5 Admin / Payments / Support

Admin A–C **integrated**. Admin sieht Nutzer-PII über `konten-verwalten`. `payments` ist Admin-Reuse, kein Consumer-Entitlement. Admin-Marketing ist Platzhalter. Consumer-Export/Löschung existiert nicht; eine spätere AP-6b darf keine zweite Support-PII-Wahrheit schaffen.

### 5.6 Provider / Commercial Provenance

S1–S3 und S5-A **integrated**. S5-B **not started**. Keine echten Provider, Secrets oder paid calls. AP-10 darf keine kommerzielle Wahrheit erfinden. TW-8 bleibt hinter S5-B **und** realer Provenance.

### 5.7 Growth / CRM / Notifications

Kein CRM, keine Account-Notification-Settings, keine zweite Consent-Wahrheit. G2 darf Account-/Notification-/Consent-Verträge später verwenden, sie aber nicht ersetzen.

---

## 6. Kanonische Restarbeit AP-5–AP-12

Die Nummerierung bleibt. Das ist **keine** stille Build-Order-Änderung.

Jeder Slice braucht vor Start einen eigenen Technical-Lead-Task, einen frischen nummerierten Account-Agenten und unabhängigen Review. Dieser Plan ist kein Startauftrag.

### AP-5 – Sicherheit vertiefen

| Feld | Wert |
| --- | --- |
| Produktziel | Eingeloggte Sicherheitssteuerung: auffindbare Passwortänderung **innerhalb des bestehenden Auth-Vertrags**, sichtbare Sitzungen, nachvollziehbares Logout-all, MFA-Schritt vor riskanten Änderungen – ohne neue Auth-Architektur. |
| Bereits vorhanden | `/account/security` TOTP-Enroll/Unenroll; Login-MFA; Recovery-Passwort über Rücksetzlink (`app/auth/update-password/page.tsx`); Admin-AAL2 getrennt. Auth-Vertrag: `auth.email.secure_password_change = true` verlangt kürzlich bestätigte Reauthentication (`security_update_password_require_reauthentication`). `security_update_password_require_current_password` ist **aus**. Belegt: `supabase/config.toml`, `docs/AUTH.md`. |
| Fehlt | AP-5-S1 und AP-5-S2 sind integriert. Weiter fehlt: ehrliche Session-Karte (`unsupported` für andere Geräte – eine echte Liste gibt der installierte User-Client nicht her); explizite Logout-Scopes `local`/`others` (heutiges Abmelden ist bereits `global`); nutzerfreundlicher UI-Step-up vor Unenroll **verified** Faktoren (GoTrue verlangt dafür bereits serverseitig `aal2`; die UI steppt heute nicht hoch). Gate-0-Evidence: `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`, ADR-0182. S1-Evidence: `docs/AP5_S1_SECURITY_UI_TRUTH_STATUS_2026-08-28.md`, ADR-0183. S2-Evidence: `docs/CHATGPT_PR137_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`, `docs/AP5_S2_PASSWORD_REAUTH_STATUS_2026-08-28.md`. |
| Shared Contracts | Auth / Sessions / MFA / AAL. UI-Auffindbarkeit ist kein neuer Vertrag. Eine Consumer-AAL2-Pflicht, MFA-Grundlogik oder ein Wechsel auf „aktuelles Passwort mitsenden“ **ist** ein Shared Contract und hier nicht entschieden. |
| Security | Keine Secrets loggen. Recovery-Link und In-Account-Change nicht zu einem zweiten Passwort-Vertrag vermischen. Enumeration vermeiden. |
| Privacy | Keine Geräte-/Session-Metadaten ins Marketing. |
| Auth / MFA / AAL | Keine fundamentale Änderung. Signed-in Reauthentication und Recovery-Authority getrennt halten. Kein `current-password`-Submit erfinden; `security_update_password_require_current_password = true` bleibt PO-Gate und braucht vorher separate Recovery-Verifikation. Admin-AAL2 nicht anfassen. Kein zweiter Production-AAL2-Apply. S4-UI-Step-up vor verified Unenroll ist kein globales Consumer-AAL2. |
| Identity / RLS | keine |
| Traveller | keine; kein Dokumentbezug |
| Guest→Account | keine |
| Admin | kein Support-Bypass |
| Growth | keine |
| Provider | keine |
| Persistenz | **keine Migration**, wenn Supabase-Auth-API reicht. Schema nur nach gesondertem Gate. |
| Product-Owner-Gate | ja, sobald MFA-/AAL-Grundlogik, Session-Architektur oder Production-Auth-Config geändert wird. Reine UI über vorhandene Auth-API: normales TL-Gate. |
| Parallelität | nicht parallel zu AP-6b/AP-7/AP-8. AP-6a Legal ist dateiarm und darf parallel assigned werden. |
| Non-Scope | Auth-Config-Push; OAuth/Passkey live schalten; Consumer-AAL2-Pflicht; Admin-AAL2; Identity; RLS; AP-7; neues „aktuelles Passwort mitsenden“, solange kein separat freigegebener Auth-Vertragswechsel das verlangt |
| Tests / Evidence | Passwortänderung bleibt am bestehenden Reauthentication-Vertrag (`secure_password_change`); kein Test darf Current-Password-Submit als Product Truth verlangen; fremde Session nicht sichtbar; Logout-all fail-closed dokumentieren, wenn API fehlt; Empty ≠ Error; keine Browser-Behauptung ohne Lauf. |
| Reihenfolge | Default nächster **Account-Programm**-Kandidat nach P2-TA-03. Gate 0, S1 und S2 sind integriert. AP-5-S2 startet **keine** S3–S5. Folgeslices AP-5-S3–S5 vs. AP-5-P1–P5 stehen im Gate-0-Status und brauchen eigene Tasks. |

### AP-6a – Privacy-Foundation ohne DB

| Feld | Wert |
| --- | --- |
| Produktziel | Ehrliche, erreichbare `/privacy` und `/terms`. Register-Zustimmung darf nicht auf 404 zeigen. |
| Bereits vorhanden | Links in `RegisterForm`; Cookie-Komponente existiert, ist aber nicht gemountet. |
| Fehlt | Seiten, vom Product Owner / Legal **gelieferte** Texte, Footer-Links, ehrlicher Cookie-Text oder bewusst weiter unverbunden. |
| Shared Contracts | keine DB. Öffentliche Legal-Fläche ist Discoverability-nah (D0-P1-03), aber kein D1/Indexing. |
| Security / Privacy | Keine erfundenen Rechtstexte. Keine Consent-Persistenz in 6a. |
| Auth / Identity / RLS | keine |
| Traveller | keine |
| Guest→Account | keine |
| Admin | keine zweite Legal-Wahrheit im Admin |
| Growth | Marketing darf diese Texte nicht durch Campaign-Copy ersetzen. |
| Persistenz | keine |
| Product-Owner-Gate | **Legal-/PO-Inhalt zwingend.** Seitenbau ohne Text ist verboten. Public Indexing bleibt getrennt. |
| Parallelität | konfliktarm zu AP-5, wenn keine gemeinsamen Auth-Dateien. Darf unabhängig assigned werden, weil D0-P1-03 ein live Trust-P1 ist. Nummerierung bleibt AP-6a. |
| Non-Scope | Consent-Tabelle, Tracking live, Cookie-Wahrheit über Views/Likes, Domain-Cutover, Indexing |
| Tests / Evidence | Routen 200; Register-Links treffen echte Seiten; robots fail-closed; kein erfundener Legal-Claim. |
| Reihenfolge | Default nach AP-5. Dokumentierte Ausnahme: TL darf AP-6a früher oder parallel assigned, weil Register heute 404-Zustimmung verlangt. Das ändert die Binding Build Order nicht. |

### AP-6b – Privacy mit Persistenz

| Feld | Wert |
| --- | --- |
| Produktziel | Versionierter Consent, Datenexport, Kontolöschung mit Ownership. |
| Bereits vorhanden | keine Consumer-Runtime. Admin sieht Nutzer-PII, exportiert/löscht Konten nicht. |
| Fehlt | Consent-Version + Zeitstempel; Export-Paket; Delete-Pfad über Auth-Admin oder User-Delete mit Ownership; Suppression für spätere CRM-Nutzung. |
| Shared Contracts | Privacy / Consent; Admin Support darf nicht extra PII ziehen; Guest→Account-Löschung; keine zweite Marketing-Consent-Wahrheit. |
| Security | Least Privilege. Service Role nur serverseitig, geautht, ownership-geprüft, minimiert. |
| Privacy | Datenminimierung. Keine Passnummern/Scans/MRZ/Biometrie im Export, die nie erlaubt gespeichert wurden. |
| Auth / Identity / RLS | Delete berührt Auth-User und Ownership. Großes Identity-/RLS-Gate möglich. |
| Traveller | Export/Delete trip-scoped `party` / Child-Tabellen. Keine Registry voraussetzen. |
| Guest→Account | Local-Storage-Entwurf ist kein Konto; nicht still als gelöschtes Konto behandeln. |
| Admin | gemeinsamer Export-/Delete-Contract; keine Schatten-PII. |
| Growth | CRM/Journeys erst nach diesem Vertrag. Kein Targeting aus Delete-Resten. |
| Persistenz | **Migration + RLS** erforderlich. Production-Migration = Product-Owner-Gate. |
| Product-Owner-Gate | ja: Privacy-Persistenz, Kontolöschung, mögliche Identity-/RLS-Änderung, sensible Datenweitergabe. |
| Parallelität | serial nach AP-6a. Nicht parallel zu AP-7/AP-8. |
| Non-Scope | AP-7 erfinden, um Löschung „einfacher“ zu machen; Marketing-Consent-Zweitmodell; Stripe-Live |
| Tests / Evidence | `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen`; Empty ≠ Error; Delete idempotent; Consent-Version sichtbar. |
| Reihenfolge | nach AP-6a; Shared serial. |

### AP-7 – Account-Traveller-Registry

| Feld | Wert |
| --- | --- |
| Produktziel | Accountweite Wiederverwendung von Traveller-/Citizenship-/Document-Kontext **nur wenn** Product Owner und ein neuer ADR das ausdrücklich wollen. |
| Bereits vorhanden | nur trip-scoped Foundation E. UX darf heute sagen: „gilt nur für diese Reise“. |
| Fehlt | der gesamte Registry-Contract. Es existiert kein Tabellenentwurf auf `main`. |
| Shared Contracts | Traveller, Identity, RLS/Ownership, Guest→Account, Readiness-Stale, Participation. **Technical-Lead-kontrolliert.** |
| Security / Privacy | besonders sensibles Gate, sobald Nummern/Scans/MRZ/Biometrie auch nur diskutiert werden. Default bleibt: nicht speichern. |
| Auth / AAL | nicht als Vehikel für AAL-Umbau. |
| Identity / RLS | ja, unvermeidbar, falls der Slice jemals startet. |
| Traveller | Current Truth würde von trip-scoped auf account-scoped **verschoben**. Das ist die eigentliche Entscheidung. |
| Guest→Account | Opt-in, kein stilles Profil aus Gastentwurf. |
| Admin | keine Support-Registry-Nebenwahrheit. |
| Growth | Citizenship/Dokumente sind kein Werbeprofil. |
| Provider | Readiness-Stale bei Profiländerung; Official bleibt fail-closed ohne Provider. |
| Persistenz | neue Tabellen + RLS nur nach ADR + PO. |
| Product-Owner-Gate | **ja, zwingend.** Plus neues ADR als Nachfolger zu ADR-0102/0117. Sensible Dokumentdaten extra. |
| Parallelität | keine. Serial, eigener Slice, frischer Agent. |
| Non-Scope | Default-Pass, Default-Citizenship, `documents[0]`-Semantik, Passnummern/Scans/MRZ/Biometrie, stilles Kopieren in alle Reisen, dieser Reconciliation-Slice |
| Tests / Evidence | erst nach ADR: Cross-Trip-Leak-Tests, Guest-Opt-in, Stale-Recheck nur betroffener Domains, Multi-Citizenship-Adversarial. |
| Reihenfolge | nicht vor AP-5/AP-6a. Nicht automatisch nach AP-6b. Erst nach ausdrücklicher Produktentscheidung. |

Dieser Plan **erfindet keinen Registry-Vertrag**. Offene Fragen bleiben offen:

1. Bleibt Current Truth trip-scoped?
2. Falls Wiederverwendung: Kopie in `party[]` oder Live-Referenz?
3. Delete/Detach/Archive einer Identität unabhängig vom Trip?
4. Guest-Opt-in?
5. Welche Felder sind überhaupt account-fähig ohne sensibles Gate?

### AP-8 – Reiseprofil / Präferenzen

| Feld | Wert |
| --- | --- |
| Produktziel | Explizite, vom Nutzer gesetzte Reisepräferenzen, getrennt von abgeleiteter Workspace-Wahrheit. |
| Bereits vorhanden | `profiles` nur Identität (`user_id`, email, display_name, avatar, role, status). Trip-scoped Prefs im Workspace. Migration sagt ausdrücklich: Präferenzen kommen später. |
| Fehlt | accountweite Prefs-Tabelle oder kontrollierte `profiles`-Erweiterung. |
| Shared Contracts | Identity / Profil. Kein Shadow-Traveller. |
| Security / Privacy | Datenminimierung. Keine Staatsbürgerschaft als „Profil“. |
| Auth / RLS | Ownership über `user_id`. Keine Service Role im Produktpfad. |
| Identity | ja, sobald `profiles` erweitert wird. |
| Traveller | **kein** Ersatz für AP-7. Prefs ≠ Citizenship/Dokumente. |
| Guest→Account | Prefs nicht aus Gast raten. |
| Admin / Growth | Prefs sind kein Targeting-Rohstoff ohne Consent. |
| Provider | Prefs erzeugen keine Preise/Verfügbarkeit. |
| Persistenz | Migration wahrscheinlich. Production = PO-Gate. |
| Product-Owner-Gate | ja bei Identity-/Profilvertrag. |
| Parallelität | nicht vor der Profilentscheidung; nicht parallel zu AP-7. |
| Non-Scope | Hard-Truth im Workspace, Default-Pass, Marketing-Persona aus Prefs |
| Tests / Evidence | explizit vs abgeleitet getrennt; Empty ≠ Error; keine Traveller-Inferenz. |
| Reihenfolge | nach Profil-ADR; nicht vor AP-5/6a. |

### AP-9 – Favoriten

| Feld | Wert |
| --- | --- |
| Produktziel | Wiederauffindbare, isolierte Favoriten – nicht mit `trip_items` vermischt. |
| Bereits vorhanden | Nav kommentiert „kommt später“. Keine Tabelle, keine UI. |
| Fehlt | Nutzenfrage, danach Tabellen + RLS + UI. |
| Shared Contracts | neue Persistenz, isolierbar, solange keine Commercial-/Traveller-PII. |
| Security / Privacy | keine Dokumentdaten in Favoriten. |
| Auth / Identity / RLS | Owner-RLS. |
| Traveller | keine |
| Guest→Account | Gast-Favoriten nicht still nötig. |
| Admin / Growth | keine zweite Merkliste für Kampagnen. |
| Provider | Favorit ≠ Verfügbarkeit. Kein Fake-Preis. |
| Persistenz | neue Tabellen nach Nutzenfrage. |
| Product-Owner-Gate | Nutzenfrage zuerst. Kein automatischer Bau. Production-Migration später. |
| Parallelität | nach AP-1 möglich, aber erst nach PO-Nutzenfrage. Nicht vor Kern-Security/Legal, wenn das den Kern verzögert. |
| Non-Scope | Trip-Item-Duplikat, Social-Feed, Creator-Favoriten |
| Tests / Evidence | Isolation von `trip_items`; Empty ≠ Error; Guest-Parität nur wenn bewusst gebaut. |
| Reihenfolge | nach dokumentierter Nutzenfrage; nicht kernblockierend. |

### AP-10 – Buchungsübersicht

| Feld | Wert |
| --- | --- |
| Produktziel | Read-only Kontoaggregation vorhandener `trip_items` / Booking-Status. Kein neues Booking-Modell. |
| Bereits vorhanden | per-trip Booking im Workspace. Keine kontoweite Übersicht. |
| Fehlt | `/account`-Aggregation; Empty ≠ Error; keine Traveller-PII. |
| Shared Contracts | nein, sofern nur lesend und keine neue Booking-Wahrheit. Commercial Provenance bleibt S5. |
| Security / Privacy | keine Dokumente, keine Admin-Payments-Daten. |
| Auth / RLS | bestehende Trip-Ownership. |
| Traveller | Anzeige ohne Dokument-/Citizenship-PII. |
| Guest→Account | Gast hat kein Konto-Booking-Folder. |
| Admin | nicht mit Admin-`payments` vermischen. |
| Growth | keine Fake-Conversion aus User-`booked`. |
| Provider | S5-A gilt. Unbelegte Beträge bleiben `unknown`/`stale`. S5-B nicht voraussetzen, aber auch nicht ersetzen. |
| Persistenz | keine neue Tabelle. |
| Product-Owner-Gate | keines, solange read-only und ohne Commercial-Erfindung. Provider-live bleibt getrennt. |
| Parallelität | nach AP-1 konfliktarm möglich. Nicht parallel zu S5-B-Runtime. |
| Non-Scope | neues Booking-Modell, Stripe, Affiliate-Live, TW-8 |
| Tests / Evidence | Empty ≠ Error; keine erfundenen Preise; archivierte Reisen bewusst ein/aus; `datenbank-lesen` / Ladezustand. |
| Reihenfolge | nach Nutzen und nachdem die Account-Shell trägt; nicht vor AP-5/6a erzwingen. |

### AP-11 – Benachrichtigungen

| Feld | Wert |
| --- | --- |
| Produktziel | Nutzersteuerbare Themenmatrix. Safety und Seasonal nicht vermischen. Service-Mail ≠ Marketing-Consent. |
| Bereits vorhanden | keine Account-Settings. Safety/Seasonal-Foundations existieren provider-neutral. |
| Fehlt | Persistenz, UI, Frequency Caps / Quiet Hours / Suppression als Vertragsnaht für späteres G2. |
| Shared Contracts | Notification + Consent. Marketing darf diesen Vertrag nicht ersetzen. |
| Security / Privacy | keine Identity-Payloads, keine Pass-/Dokumentdaten in Templates. |
| Auth / RLS | Owner-RLS. |
| Traveller | Multi-Citizenship nicht in Marketing-Segmente kippen. Safety bleibt citizenship-set, nicht dokumentabhängig, bis ein eigener Safety-Slice das ändert. |
| Guest→Account | Gast bekommt keine Account-Notifications. |
| Admin | Capability/Audit für produktive Writes später im Growth-Control-Center. |
| Growth | G2 hängt an diesem Vertrag. G1 darf ihn nicht vorwegnehmen. |
| Provider | keine Provider-Health-Mails ohne Evidence. |
| Persistenz | neue Tabelle, Shared-nah. |
| Product-Owner-Gate | Production-Migration; produktive CRM-Writes extra. |
| Parallelität | nach AP-6a/6b-Consent-Naht. Nicht vor Safety/Seasonal-Truth-Gates für den jeweiligen Kanal. |
| Non-Scope | Paid CRM live, Provider-Alerts als Marketing, Identity-Payloads |
| Tests / Evidence | Themen getrennt; Consent-Fail-closed; Empty ≠ Error; keine Fake-Safety. |
| Reihenfolge | nach Privacy-Naht; nicht kernblockierend für AP-5. |

### AP-12 – Abonnement- / Entitlement-Grundlage

| Feld | Wert |
| --- | --- |
| Produktziel | Ehrlicher Platzhalter + Entitlement-Port. Keine Stripe-Live, keine Geldbewegung. |
| Bereits vorhanden | Admin-`payments` (nicht wiederverwenden). Nav ohne Abo-Link. |
| Fehlt | Consumer-Entitlement-Modell, Copy, Port. |
| Shared Contracts | Billing / Payment / Entitlement mit Admin/Finance. |
| Security / Privacy | keine Kartennummern, keine Production-Secrets. |
| Auth / Identity / RLS | Entitlements owner-scoped, erst nach Modell. |
| Traveller | keine |
| Guest→Account | kein Gast-Abo. |
| Admin | Billing-P1 vor Finance-Live bleibt Admin- Residual; nicht hier schließen. |
| Growth | Subscription Growth erst auf realer Entitlement-Truth. |
| Provider | keine |
| Persistenz | neuer Port, **nicht** `payments` wiederverwenden. |
| Product-Owner-Gate | **ja** für Stripe/Payments/Money Movement/Subscriptions live. Platzhalter-Copy ohne Live: normales TL-Gate, aber kein Fake-„Pro ist live“. |
| Parallelität | serial mit Billing/Admin. Nicht parallel zu Payment-Live. |
| Non-Scope | Stripe live, Prices live, Store, > USD 100/Monat Infrastruktur |
| Tests / Evidence | kein Live-Claim; Admin-`payments` unberührt; Empty ≠ Error. |
| Reihenfolge | nach klarem Entitlement-Schnitt; nicht vor AP-5/6a. |

---

## 7. Empfohlene Reihenfolge

Default innerhalb des Account-Programms, **ohne** die Binding Build Order zu ändern:

1. AP-5 Sicherheit vertiefen – eigener Auth-naher Task, kein automatischer Start aus P2-TA-03.
2. AP-6a Legal ohne DB – oder parallel/früher, wenn der Technical Lead D0-P1-03 als unabhängigen Legal-/PO-Slice vergibt.
3. Shared serial: AP-6b, danach nur bei ausdrücklicher Produktentscheidung AP-7, AP-8, AP-12.
4. Nutzengetrieben: AP-9, AP-10, AP-11.

Regeln:

- AP-1–AP-4 nicht zurück in diese Liste.
- Kein Slice startet, weil dieser Plan existiert.
- Frische Agent-Session je Slice.
- Shared Contracts serial.
- Account und Admin dürfen als Domänen parallel laufen, nicht in dieselben Identity-/Consent-/Payment-Dateien.
- TW-8, S5-B, Issue #109/#110, Homepage-Mehrziel und Native bleiben außerhalb.

---

## 8. Parallelitätsmatrix

| Arbeit | Regel |
| --- | --- |
| Dieser Docs-PR #117 | nur Continuity/Plan; keine Runtime-Kollision |
| Historischer PR #39 | **historical**; nicht rebasen, nicht als Current Truth mergen |
| PR #88 Sanitation | non-destructive Evidence; nicht anfassen |
| PR #52 / #50 / #40 / #28 | historical / superseded; nicht fortsetzen |
| AP-5 Runtime | eigener späterer Branch; nicht in #117 |
| AP-6a Legal | dateiarm zu AP-5; Legal-Text ist PO-Gate |
| AP-6b / AP-7 / AP-8 | serial; Shared |
| Provider S5-B / TW-8 / TW-9 | nicht aus Account starten |
| Issue #109 / #110 | nicht aus Account starten |
| Growth D1/G1 | nicht aus Account starten |
| Admin D–K | parallel als Domäne, nicht in Consent/Identity/Payments doppelbauen |
| `docs/ACTIVE_WORK_STATUS.md` | nur ein Schreiber zur Zeit; TL integriert zentral |

---

## 9. Product-Owner-Gates

Dieser Reconciliation-Slice selbst braucht **kein** Aktivierungs-Gate.

Spätere Slices brauchen ausdrückliche Product-Owner-Entscheidung bei:

| Gate | Typische Slices |
| --- | --- |
| Production-Migration / destruktive Daten | AP-6b, AP-7, AP-8, AP-11, AP-9 |
| große RLS-/Ownership-/Identity-Änderung | AP-7, AP-6b Delete, AP-8 Profil |
| fundamentale Auth-/Session-/MFA-/AAL-Änderung | AP-5 nur wenn der Schnitt die Grundlogik ändert |
| Pass-/MRZ-/Biometrie-/Dokument-Speicherung | nie ohne Extra-Gate; Default = nicht bauen |
| sensible externe Datenweitergabe | AP-6b Export, späteres CRM |
| Provider-Verträge / Secrets / paid calls | nicht Account; S5-B / Provider-live |
| Payments / Geldbewegung | AP-12 live |
| > USD 100/Monat | neue Infrastruktur |
| fundamentale Produkt-/Build-Order-Änderung | nur neue ausdrückliche PO-Entscheidung |
| Public Launch / Domain Cutover / Store / Provider-live | außerhalb dieses Programms |

---

## 10. Strikter Non-Scope dieses Plans und jedes späteren Account-Slices bis zum eigenen Auftrag

Nicht aus diesem Dokument ableiten oder nebenbei bauen:

- AP-5 Runtime in P2-TA-03
- AP-7 Registry-Contract
- Auth-/Session-/MFA-/AAL-Grundlogik
- Identity-Architektur
- RLS-/Ownership-Änderungen
- DB- oder Production-Migrationen
- Consent-Persistenz
- Kontolöschung- oder Export-Runtime
- Passwort-/Session-Geräte-Runtime
- Passnummern, Passscans, MRZ, Biometrie
- neue sensitive Traveller-Persistenz
- Payments / Stripe / Subscription live
- Provider S5-B, echte Provider, Secrets, paid calls
- TW-8 / TW-9
- Issue #109 / #110 Runtime
- Homepage-Mehrziel-Runtime
- Public Indexing / Domain Cutover
- Native-App-Implementierung
- Supabase-Branch Reset / Rebase / Merge / Delete

---

## 11. Residuals, die **nicht** AP-5–AP-12 sind

| ID | Lage | Nicht tun |
| --- | --- | --- |
| D0-P1-03 | `/privacy` `/terms` 404 | nicht mit erfundenen Texten in AP-5 mischen; gehört zu AP-6a / Legal-PO |
| P2-TA-01 | Official nicht progressiv pro Option | eigener Traveller-/Readiness-Slice |
| P2-TA-02 | Test-Fixture-Bias | Hygiene, kein Produktvertrag |
| P2-TA-04 | Direct authenticated Traveller-DML umgeht Write-Contract | Gate 0 integriert (PR #120 / ADR-0180). C1 (Issue #122 / ADR-0181) härtet Delete-RPC + Party-Cap 20 + Child-UPDATE-Limits ohne REVOKE/DEFINER. Production C1 live als `20260828015304`; historische/develop-only Evidence `20260828120000`. C2 bleibt PO-gated. Kein AP-5 |
| P2-TA-05 | Safety citizenship-set, nicht dokumentabhängig | Safety-Slice, kein Default-Pass |
| P3-TA-01 | Legacy-Singular Expand/Contract | eigener Cleanup |
| `officialFingerprint` | kann ohne `documents[]` Legacy-Singular lesen | nicht P2-TA-06 erneut öffnen |
| AP-4 Real-Device | QA-Evidence-Debt | kein zweites AP-4 |
| `main` Branch Protection `protected=false` | Governance-Residual | nicht Account-Runtime |

P2-TA-03 als Finding ist durch **diese Datei** geschlossen, sobald der Plan auf `main` integriert ist. Bis dahin bleibt das Finding auf Draft-PR #117.

---

## 12. Tests und Evidence für spätere PRs

Pflicht pro Slice:

- Unit für die jeweilige Ableitung;
- Empty ≠ Error in Route **und** Ansicht;
- Guest/Account-Trennung, wo beide betroffen;
- kein Citizenship-/Pass-Default;
- bestehende `uebernahme.test.ts`, AP-3- und AP-4-Tests dürfen nicht rot werden;
- bei Shared: `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen` fail-closed;
- Exact-Head GitHub Actions + Vercel;
- keine behaupteten Browser-Tests, die nicht liefen.

Zusätzliche Regressionen, die der historische Plan schon verlangt hat und die weiter gelten:

1. `next`-Allowlist bleibt hart (AP-2, nicht zurückbauen);
2. OAuth-Buttons nur bei Enablement;
3. Übersicht bleibt ohne Workspace-Bereichskarten;
4. Consent nicht nur Client-Checkbox, sobald AP-6b;
5. Registry ändert nicht still trip-fremde Reisen, sobald AP-7 existiert;
6. Takeover: Graph ok / Party fail → Entwurf bleibt, Retry idempotent.

---

## 13. Definition of Done für P2-TA-03

Erfüllt, wenn:

- diese Datei der aktuelle Steuerungsvertrag für AP-5–AP-12 ist;
- AP-1–AP-4 nicht als Zukunft geplant sind;
- historische PR-#39-Evidence erhalten und als historical/superseded markiert ist;
- Traveller-Invariante unverändert bleibt;
- keine Runtime, keine Migration, keine Config geändert wurde;
- Status/Handoff einen neuen Chat ohne Chat-Erinnerung tragen;
- der unabhängige Technical Lead reviewed, bevor irgendein Folgeslice startet.

Nicht erfüllt durch Existenz dieser Datei:

- AP-5-Start;
- AP-6a-Start;
- Ready/Merge von PR #117;
- Änderung der Binding Build Order.

---

## 14. Nächster Schritt nach diesem Plan

**STOPP für Runtime.**

ChatGPT / Technical Lead führt den unabhängigen Finalreview von Draft-PR #117 durch und entscheidet erst danach, ob und welcher Account-Slice als Nächstes versioniert wird.
