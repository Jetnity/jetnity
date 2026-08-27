# Jetnity – P2-TA-03 Account Platform Plan Reconciliation Task

Stand: 28. August 2026  
Issue: #116  
Typ: **AUDIT / ARCHITECTURE / CONTINUITY ONLY**  
Status: **TECHNICAL-LEAD PREPARED / NO AP-5 RUNTIME START**  
Vorgesehener Cursor-Agent: `Account plattform audit vorbereitung 5`  
Vorbereitungsbranch: `docs/p2-ta-03-account-plan-reconciliation`

## 1. Ausgangslage

Live-Baseline vor dieser Vorbereitung:

- `main`: `43aef6431aeea619ea896d456e16579b1034b9dd`
- PR #115 ist gemergt.
- AP-1 bis AP-4 sind integriert.
- P2-TA-06 / PR #113 / Issue #112 ist abgeschlossen.
- Der Binding Build Order verweist für AP-5–AP-12 auf `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`.
- Diese Datei existiert auf aktuellem `main` nicht.
- Die vollständige historische Fassung liegt nur auf Draft-PR #39 / Branch `audit/account-platform` und ist gegenüber aktuellem `main` stark abgedriftet.
- Die historische Fassung enthält Pre-AP-4-Status und eine inzwischen supersedierte Agenten-Session-Annahme. Sie ist Evidence, keine aktuelle Produktwahrheit.

P2-TA-03 ist deshalb ein Continuity-/Planungsdefekt: Der Build Order referenziert einen nicht auf `main` vorhandenen, historischen Plan. Vor weiterer Account-Runtime muss dieser Steuerungsvertrag sauber reconciled werden.

## 2. Korrigierte Supabase-Live-Evidence

Live `Supabase.list_branches` am 28. August 2026 für Production-Projekt `qscbgcdmivbbnzrcyegn`:

- Default `main`: project ref `qscbgcdmivbbnzrcyegn`, `ACTIVE_HEALTHY`
- Non-default `develop`: project ref `yfvbxvijcorffwxbxahl`, `ACTIVE_HEALTHY`

Die frühere Aussage, es existiere kein Supabase Development-/Preview-Branch, war falsch. Dieser Task autorisiert **keine** Branch-Mutation: kein Reset, Rebase, Merge oder Delete.

## 3. Ziel

Aus aktueller Repository-/Systemwahrheit und historischer Evidence einen aktuellen, kanonischen und belastbaren Account-Platform-Implementierungsplan für AP-5–AP-12 herstellen, bevor irgendein AP-5-Folgeslice freigegeben wird.

Der Task entscheidet **nicht**, dass AP-5 danach automatisch startet.

## 4. Pflichtlektüre

Vor Analyse mindestens vollständig lesen und gegen Live-`main` prüfen:

1. `JETNITY_START_HERE.md`
2. `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
3. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
6. `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`
7. `JETNITY_HANDOFF.md`
8. `ROADMAP.md`
9. `docs/ACTIVE_WORK_STATUS.md`
10. `docs/ACCOUNT_TRAVELLER_NEXT_SLICE_RECONCILIATION_2026-08-27.md`
11. `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md`
12. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_STATUS_2026-08-27.md`
13. `docs/P2_TA06_READINESS_CREDENTIAL_NORMALIZATION_HANDOFF_2026-08-27.md`
14. relevante Account-/Admin-/Privacy-/Security-/Traveller-/Growth-ADRs und aktuelle Statusdateien
15. historische `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` aus PR #39 **nur als zeitgebundene Evidence**

Historische PR-Bodies, Branch-SHAs und Statusdateien dürfen neuere Live-Evidence nicht überschreiben.

## 5. Erforderliche Analyse

### 5.1 Current Truth rekonstruieren

Belegen:

- was AP-1, AP-2, AP-3 und AP-4 heute tatsächlich liefern;
- aktuelle Auth-/Session-/MFA-/AAL-Grenzen;
- aktuelle Privacy-/Legal-/Consent-Grenzen;
- aktuelle trip-scoped Traveller-Truth;
- aktuelle Guest→Account-Grenzen;
- aktuelle Admin-/Support-/Entitlement-/Payments-Abhängigkeiten;
- aktuelle Provider-/Commercial-Provenance-Abhängigkeiten;
- aktuelle Growth-/CRM-/Notification-Abhängigkeiten.

### 5.2 Historischen Plan reconciliieren

Für AP-5 bis AP-12 jeweils bestimmen:

- heutiges Produktziel;
- bereits vorhandene Fähigkeiten;
- fehlende Fähigkeiten;
- Shared Contracts;
- Product-Owner-Gates;
- Security-/Privacy-Risiken;
- DB-/RLS-/Auth-/Identity-Auswirkung;
- Traveller-/Multi-Citizenship-Auswirkung;
- Admin-/Growth-/Provider-Abhängigkeiten;
- erlaubte Parallelität;
- Non-Scope;
- notwendige Tests/Evidence;
- ob der Slice weiterhin sinnvoll nummeriert/geschnitten ist oder nur mit dokumentierter Begründung neu geschnitten werden sollte.

Keine fundamentale Build-Order-Änderung stillschweigend vornehmen.

## 6. Verbindliche Traveller-Truth

Unverändert:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Daraus folgt insbesondere:

- kein Default-Pass;
- keine Default-Citizenship;
- Issuer Country ≠ Citizenship;
- `documents[0]` / `evaluations[0]` sind keine Product Truth;
- AP-7 darf keinen stillen neuen Registry-/Identity-Vertrag erfinden;
- sensitive Dokumentdaten bleiben hinter Product-Owner-/Security-/Privacy-Gates.

## 7. Erwartetes Ergebnis

Der Agent soll auf seinem Arbeitsbranch mindestens erzeugen/aktualisieren:

1. eine aktuelle kanonische `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` **oder** eine klar begründete Reconciliation-Entscheidung, falls der Plan anders geschnitten werden muss;
2. `docs/P2_TA03_ACCOUNT_PLATFORM_PLAN_RECONCILIATION_STATUS_2026-08-28.md`;
3. `docs/P2_TA03_ACCOUNT_PLATFORM_PLAN_RECONCILIATION_HANDOFF_2026-08-28.md`;
4. notwendige ADR-/Decision-Nachträge nur wenn echte Architekturentscheidungen getroffen werden müssen;
5. relevante Continuity-Dateien so, dass neue Chats nicht auf Chat-Erinnerung angewiesen sind.

Historische PR-#39-Dateien nicht löschen oder als damalige Fehler umschreiben.

## 8. Strikter Non-Scope

Nicht implementieren:

- AP-5 Runtime;
- AP-7 Account-Traveller-Registry;
- Identity-Architekturänderung;
- Auth-/Session-/MFA-/AAL-Grundlogik;
- RLS-/Ownership-Änderung;
- DB- oder Production-Migration;
- Consent-/Privacy-Persistenz;
- Kontolöschung/Data-Export Runtime;
- Passwort-/Session-Geräte-Runtime;
- Passnummern, Passscans, MRZ, biometrische Daten;
- neue sensitive Traveller-Persistenz;
- Payments/Stripe/Subscription-Live;
- Provider S5-B oder echte Provider;
- Provider-Secrets oder paid calls;
- TW-8/TW-9;
- Issue #109 oder #110 Runtime;
- Public Indexing / Domain Cutover;
- Native-App-Implementierung;
- Supabase Branch Reset/Rebase/Merge/Delete.

## 9. Qualitäts- und Review-Gates

Da dieser Slice docs-/architecture-only ist, mindestens:

- Live-`main` zu Beginn und vor STOPP erneut prüfen;
- vollständigen Diff prüfen;
- keine Runtime-/Migration-/Config-Dateien verändern;
- alle Claims durch aktuelle Repo-/Live-Evidence belegen;
- historische vs aktuelle Evidence markieren;
- Links/Dateipfade/Issue-/PR-Referenzen prüfen;
- keine veraltete Agenten-Regel reaktivieren;
- keine neue Product Truth nur aus PR #39 übernehmen;
- Exact-Head GitHub Actions und Vercel Preview auf dem finalen Agent-Head prüfen, soweit der Repository-Workflow sie für Docs-PRs ausführt;
- offene Review-Threads prüfen;
- unabhängiger Technical-Lead-Finalreview vor Ready/Merge.

## 10. Product-Owner-Gates

Dieser Reconciliation-Slice selbst braucht kein spezielles Aktivierungs-Gate, weil er keine Production-/Runtime-/Identity-/RLS-/Sensitive-Data-Änderung ausführt.

Wenn die Analyse einen späteren Slice mit einem Product-Owner-Sondergate identifiziert, muss dieses Gate explizit im neuen Plan stehen. Es darf nicht in diesem Task vorweggenommen werden.

## 11. Agenten-Workflow

Verwende eine **frische Session**:

`Account plattform audit vorbereitung 5`

Nicht Generation 4 fortsetzen. Generation 4 gehört zum abgeschlossenen P2-TA-06-Slice.

Der Author-Agent:

1. startet aus aktuellem Live-`main` bzw. dem durch den Technical Lead ausdrücklich übergebenen Vorbereitungspunkt;
2. liest Task + Pflichtlektüre;
3. erstellt/aktualisiert nur Evidence-/Architecture-/Continuity-Dokumentation;
4. führt Self-Review durch;
5. eröffnet/aktualisiert Draft-PR;
6. markiert **nicht** Ready;
7. merged **nicht**;
8. stoppt mit Exact Head und Evidence für den unabhängigen Technical-Lead-Review.
