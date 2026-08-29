# AP-5-S4 – Account Security MFA Step-up

Status: **VERSIONIERTER STARTAUFTRAG / NORMAL TECHNICAL-LEAD GATE / KEIN PRODUCT-OWNER SPECIAL GATE, SOLANGE DIE HARTE SCOPE-GRENZE EINGEHALTEN WIRD**

Issue: #158

Baseline: `main @ 5920860e164784040118667091ebcaca79f9b33d`

Branch: `feat/ap5-s4-account-security-mfa-step-up-2026-08-29`

Logical Cursor-Agent: `Cursor-Agent: Account plattform audit vorbereitung 14`

## 1. Ziel

Jetnity soll beim Entfernen eines bereits **verifizierten** TOTP-Faktors nicht erst an einer undurchsichtigen serverseitigen AAL2-Ablehnung scheitern. AP-5-S4 baut einen professionellen, ehrlichen und nutzerfreundlichen MFA-Step-up auf Basis der bereits installierten Supabase User-Auth-API, soweit `challenge` / `verify` dies ohne Änderung der Projekt-/Auth-Konfiguration erlauben.

Der Slice vertieft die bestehende Account-Security-Oberfläche. Er führt **kein globales Consumer-AAL2** ein und ändert keine Supabase-MFA-Policy.

## 2. Verbindliche Wahrheiten aus Gate 0

- Ein verifizierter Faktor darf serverseitig nur unter ausreichendem AAL entfernt werden; Jetnity darf diese Autorität nicht clientseitig vortäuschen.
- Die bestehende UI besitzt heute keinen proaktiven Step-up für diesen Fall.
- Recovery, signed-in password reauthentication und MFA-Step-up sind unterschiedliche Autoritäten und dürfen nicht vermischt werden.
- Admin-AAL2 bleibt vollständig außerhalb dieses Slices.
- Kein Projekt-/Auth-Config-Push ist für diesen normalen Slice autorisiert.

## 3. Required Scope

Der Agent muss zuerst den aktuellen `main`-Stand und die bestehenden AP-5 Gate-0/S1/S2/S3-Dateien, `SecurityMFA`, relevante Auth-Helfer und Tests rekonstruieren.

Danach production-grade implementieren:

1. **Step-up nur dort, wo fachlich nötig.**
   - Bestehende/verifizierte TOTP-Faktoren vor einer sicherheitskritischen Entfernung erkennen.
   - Wenn der aktuelle AAL bereits ausreichend ist, keinen unnötigen Challenge-Dialog erzwingen.
   - Wenn AAL2 fehlt und ein nutzbarer verifizierter TOTP-Faktor vorhanden ist, einen klaren Step-up anbieten.

2. **Challenge/Verify über die bestehende User-Auth-API.**
   - Bestehende Supabase MFA-Methoden verwenden; keine Service Role, kein privates Admin-API-Konstrukt.
   - Challenge-ID / Factor-ID nur intern behandeln und niemals als Nutzertext, Log-Hinweis oder sichtbare Debug-Information ausgeben.
   - OTP-Code nur für die Verifikation verwenden; keine Persistenz.
   - Nach erfolgreichem Verify den tatsächlichen AAL/Session-Zustand soweit mit der vorhandenen API sinnvoll erneut prüfen, statt Erfolg nur aus einem UI-Flag abzuleiten.

3. **Ehrliche UI-Zustände.**
   Mindestens: `idle`, `working`, `success`, `error`, `unavailable`, `unsupported` beziehungsweise eine semantisch gleichwertige, typisierte Zustandsmaschine.
   - Keine Erfolgsmeldung, solange der serverseitige Schritt nicht bestätigt ist.
   - Keine Raw-Supabase-Fehlermeldungen an Nutzer.
   - Keine Behauptung, dass Consumer-AAL2 nun global oder dauerhaft für alle Bereiche erzwungen ist.
   - Abbruch/Fehler dürfen nicht zum stillen Unenroll weiterlaufen.

4. **Unenroll-Flow.**
   - Nach ausreichendem AAL darf der bestehende Unenroll durchgeführt werden.
   - Fehler des Unenroll selbst müssen weiterhin als Fehler sichtbar bleiben.
   - Faktorlisten-/UI-Refresh nach Erfolg korrekt und ohne erfundene Zustände.
   - Keine Entfernung eines anderen Faktors durch stale IDs / race-artige UI-Zustände.

5. **Accessibility / UX.**
   - Fokusführung für den Step-up-Dialog/Formularzustand prüfen.
   - Eingabe mit sinnvoller Beschriftung, `autocomplete="one-time-code"` sofern passend, Disabled/Busy-State und `aria-live`/Statusmeldung.
   - Kein OTP in URLs, Query Params, Analytics oder sichtbaren Logs.

6. **Security / Privacy Regression.**
   - Keine Tokens, OTPs, Factor-IDs, Session-IDs oder Raw-Auth-Fehler in Nutzertexten.
   - Keine neue clientseitige Autorität.
   - Keine Schwächung des bestehenden S3-Logout-Verhaltens.

## 4. Tests / Gates

Mindestens fokussierte Tests für:

- bereits AAL2 → kein unnötiger Step-up;
- AAL1 + verifizierter TOTP-Faktor → Challenge/Verify vor Unenroll;
- falscher/abgelehnter Code → kein Unenroll;
- Challenge-Fehler → kein Unenroll;
- Verify-Fehler → kein Unenroll;
- erfolgreicher Step-up → Unenroll nur danach;
- Unenroll-Fehler nach erfolgreichem Step-up → kein falscher Gesamterfolg;
- keine Raw-Fehler/IDs/OTP-Leaks;
- relevante Accessibility-/Busy-State-Verträge;
- Regression: S3 Logout-Scope und Password-Recovery/Reauth/Admin-AAL2 bleiben unberührt.

Danach vollständige Repository-Gates gemäß aktuellem Projektstandard: Typecheck, Lint, Tests, Setup/Hygiene/Security-Checks, Auth-Konfigurationsabgleich und Production Build. GitHub CI + Vercel Preview auf dem finalen Exact Head abwarten und dokumentieren.

## 5. Hard Non-Scope

Nicht implementieren:

- globales Consumer-AAL2 / Login-MFA-Pflicht;
- Änderungen an `supabase/config.toml` oder live Auth-/MFA-Projektkonfiguration;
- neue MFA-Policy oder fundamentale Auth/AAL-Architektur;
- DB-Migration, RLS, Ownership, Identity, GRANT/REVOKE, SECURITY DEFINER;
- Service Role / `auth.sessions` / privilegierte Sessionarchitektur;
- Passkeys/WebAuthn, OAuth, Recovery-Neuarchitektur;
- AP-5-S5;
- AP-6 / AP-7 / Traveller Registry;
- Provider live/secrets/paid calls;
- Payments/Subscriptions/Money Movement;
- Public Launch/Indexing/Domain/App Store;
- Branch Protection;
- sonstige Cleanup-/Framework-/Growth-Arbeit.

Wenn der gewünschte sichere Step-up ohne eine dieser geschützten Änderungen nicht korrekt möglich ist: **STOP, Product-Owner-Gate dokumentieren und nicht improvisieren.**

## 6. Continuity / Evidence

Vor dem finalen STOP müssen mindestens Handoff/Status/ADR/Continuity so aktualisiert sein, dass ein neuer Technical Lead ohne Chat-Memory erkennt:

- exakten Baseline-SHA;
- finalen Head-SHA;
- Logical Agent `Account plattform audit vorbereitung 14`;
- exakte Cursor-Session/Run-ID;
- was implementiert wurde und was bewusst nicht;
- lokale Gate-Ergebnisse;
- GitHub CI / Vercel Preview auf Exact Head, sobald verfügbar;
- offene Residuals und ob ein PO-Gate berührt wurde.

## 7. Governance / STOP

- Dieser Agent bearbeitet **nur AP-5-S4**.
- PR bleibt Draft.
- Cursor setzt niemals Ready und merged niemals.
- Agent-Self-Review ist kein Technical-Lead-PASS.
- Nach dem finalen Push: STOP für unabhängigen Technical-Lead Exact-Head-Review.
- Falls der TL CHANGES REQUIRED feststellt, behebt **dieselbe logische Cursor-Session** ausschließlich diese S4-Findings und stoppt erneut.
- Kein Start von S5 aus diesem Agenten.
