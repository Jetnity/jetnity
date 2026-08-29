# AP-5-S5 – Honest Current Session / Device View

Status: **VERSIONIERTER STARTAUFTRAG / NORMAL TECHNICAL-LEAD GATE / LETZTER SLICE DES AUTORISIERTEN AP-5-S3–S5-PROGRAMMS**

Issue: #161

Baseline: `main @ 934d43dae65235486f1a06a50b592468e3546b1c`

Branch: `feat/ap5-s5-honest-current-session-view-2026-08-29`

Logical Cursor-Agent: `Cursor-Agent: Account plattform audit vorbereitung 15`

## 1. Ziel

Jetnity soll in `/account/security` eine professionelle Session-/Geräteansicht liefern, ohne Fähigkeiten oder Daten zu erfinden, die der vorhandene Supabase User-Auth-Client nicht bereitstellt.

S5 ist bewusst **keine** Session-Registry. Es zeigt die aktuelle Sitzung nur mit vorhandener, datensparsamer Wahrheit und erklärt transparent, dass andere Sitzungen mangels unterstützter User-API nicht einzeln aufgelistet werden können. Die in S3 integrierten Logout-Scopes bleiben die vorhandene Steuerungsautorität.

## 2. Verbindliche Capability-Wahrheiten aus AP-5 Gate 0

- Der installierte Supabase User-Client stellt keine unterstützte `listSessions`-/`getSessions`-API für eine vollständige benutzerseitige Session-/Geräteliste bereit.
- `unsupported` ist nicht `empty`: Jetnity darf weder null andere Sitzungen noch eine Zahl behaupten.
- Die aktuelle Session ist über bestehende User-Auth-/Session-Mechanismen verfügbar; JWT-/Session-Artefakte bleiben intern.
- Ein vorhandenes `session_id`-Claim ist eine interne Identitätshilfe, **kein** Wert für die UI.
- S3 liefert ehrliche `local` / `others` / `global` Logout-Aktionen; deren Semantik darf S5 nicht verändern.
- S4-MFA-Step-up/AAL, Password Recovery/Reauth und Admin-AAL2 bleiben getrennte Authorities.

## 3. Required Scope

Der Agent rekonstruiert zuerst den aktuellen `main`, Gate 0 sowie S1–S4 Code, Tests, ADRs und Handoffs. Danach production-grade:

1. **Aktuelle Sitzung – ehrliche Server-/Auth-Truth**
   - Bestehende sichere User-/Session-API nutzen, keine privilegierte API.
   - Nur datensparsame, tatsächlich verfügbare Fakten anzeigen.
   - Keine rohe `session_id`, kein Access-/Refresh-Token, keine JWT-Rohdaten, keine Factor-/Challenge-ID.
   - Wenn ein Zeitwert wie Ablaufdatum zuverlässig aus der aktuellen Session vorhanden ist, fachlich korrekt benennen; keine erfundene „letzte Aktivität“.

2. **Lokaler Browser-/Gerätehinweis – nur als lokale Information**
   - Falls sinnvoll, minimal aus dem Browser ableitbare Information wie Browser-/Plattformklasse darstellen.
   - Klar kennzeichnen, dass dies **lokal erkannt** und nicht serverseitig als Geräteidentität verifiziert ist.
   - Kein Fingerprinting, keine persistente Device-ID, keine User-Agent-Rohdatenanzeige, kein IP-/Geo-Raten.
   - Wenn eine robuste, datensparsame Ableitung nicht sinnvoll ist, lieber weglassen.

3. **Andere Sitzungen – explizit `unsupported`**
   - Keine Fake-Liste, kein Skeleton, das eine Liste suggeriert, keine „0 andere Geräte“, keine Zahl.
   - Erklären, dass einzelne andere Sitzungen derzeit nicht aufgelistet werden können.
   - Dennoch die vorhandene S3-Aktion „andere Sitzungen abmelden“ korrekt anbieten/verlinken, ohne Anzahl oder unmittelbare Access-Token-Invalidierung zu behaupten.

4. **Zustände / Fehlertruth**
   - Mindestens semantisch trennen: loading / current / unavailable / unsupported / error, soweit relevant.
   - Fehler nicht als leere/keine Sitzung darstellen.
   - Kein Raw-Supabase-/GoTrue-Fehler in Nutzertexten.
   - Wenn aktuelle Session nicht sicher bestimmt werden kann, keine Detail-Truth erfinden.

5. **Security / Privacy**
   - Token-, JWT-, `session_id`-, Cookie-, Auth-Header- und sensitiven Rohdaten-Leak adversarial testen.
   - Keine Analytics/Logs mit Auth-Artefakten.
   - Keine neue clientseitige Autorität.
   - S3 Logout scopes und S4 MFA/AAL regressionsfest halten.

6. **UX / Accessibility**
   - Mobile-first und bestehendes Account-Security-Design nutzen.
   - Saubere Überschriften/Labels/Statuscopy, Tastatur-/Screenreader-tauglich.
   - Keine vertrauensbildende Übertreibung wie „dieses Gerät ist verifiziert“, wenn nur lokaler Browserkontext bekannt ist.

7. **Continuity**
   - Status, Handoff, Self-Review, Test-Evidence und ADR/Continuity persistieren.
   - Exact Agent/Run-ID festhalten.
   - Nach S5 gibt es keinen automatischen AP-6/AP-7-Start.

## 4. Mindesttests

- aktuelle Session vorhanden → nur erlaubte, wahrheitsgetreue Felder;
- aktuelle Session nicht verfügbar / Auth-Fehler → keine Fake-Session und kein falscher Erfolg;
- andere Sessions → `unsupported`, nicht `empty` / `0`;
- kein `listSessions`, `getSessions`, Service Role oder privilegiertes `auth.sessions`;
- keine rohe `session_id`, JWTs, Access-/Refresh-Tokens, Cookies, Authorization-Header oder User-Agent-Rohdaten in Nutzertext/DOM/Logs;
- lokale Browser-/Plattforminfo, falls implementiert, klar als lokal/nicht verifiziert;
- S3 `local` / `others` / `global` Semantik unverändert;
- S4 MFA-Step-up/AAL-Reconcile unverändert;
- Accessibility-/Busy-/Error-State-Verträge.

Danach vollständige Repository-Gates gemäß aktuellem Standard: Typecheck, Lint, Tests, Setup/Hygiene/Security checks, Auth-Konfigurationsabgleich, Production Build, GitHub CI und Vercel Preview auf finalem Exact Head.

## 5. Hard Non-Scope / Product-Owner Gate

Nicht implementieren:

- Service Role oder Admin-Auth-API für Consumer-Sessionlisting;
- direkten Zugriff auf privilegierte `auth.sessions`;
- neue Session-/Device-Registry oder Persistenz;
- DB-Migration, RLS, Ownership, Identity, GRANT/REVOKE/SECURITY DEFINER;
- Device Fingerprinting, persistente Device-ID, IP-/Geo-Tracking;
- globale Consumer-AAL2-/MFA-Pflicht oder Auth-/MFA-Projektkonfiguration;
- Passkeys/WebAuthn, OAuth-/Recovery-Neuarchitektur;
- AP-6, AP-7, Traveller Registry;
- Provider live/secrets/paid calls;
- Payments/Subscriptions/Money Movement;
- Public Launch/Indexing/Domain/App Store;
- Branch Protection;
- unrelated Cleanup/Framework/Growth work.

Wenn eine professionelle vollständige Sessionliste eine dieser Änderungen erfordern würde: **STOP und Product-Owner-Gate dokumentieren. Nicht improvisieren.**

## 6. Governance / STOP

- Dieser Agent bearbeitet **nur AP-5-S5**.
- PR bleibt Draft.
- Cursor setzt niemals Ready und merged niemals.
- Agent-Self-Review ist kein Technical-Lead-PASS.
- Nach finalem Push: STOP für unabhängigen Technical-Lead Exact-Head-Review.
- Falls der TL CHANGES REQUIRED feststellt, behebt dieselbe logische Cursor-Session ausschließlich diese S5-Findings und stoppt erneut.
- Kein AP-6/AP-7 oder weiterer Product-Slice aus diesem Agenten.
- Nach erfolgreicher TL-Integration/Post-Merge-Verifikation endet das autorisierte AP-5-S3–S5-Programm.