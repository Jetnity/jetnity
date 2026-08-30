# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / REQUIREMENTS TRUTH-OPS S4-R1 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

Aktuellster technischer Closure-Anker:

`main@43177a7bab61b0934775f86442833af0f27b3361`

Aktuellster Closure-Checkpoint nach Merge:

`docs/CHATGPT_TECHNICAL_LEAD_REQUIREMENTS_TRUTH_OPS_S4_R1_CLOSED_2026-08-31.md`

## 1. Verifizierter Main-Stand

Requirements Truth-Ops S4-R1 ist abgeschlossen.

- Review-PR **#296 MERGED**.
- finaler Implementierungs-Head: `595b4ad2a827beff7bec597433b3316d21da0747`.
- Merge-SHA auf `main`: `43177a7bab61b0934775f86442833af0f27b3361`.
- Main-CI **#1423 / Run `33342536940`: SUCCESS** exakt auf `43177a7b...`.
- Vercel Production **`dpl_EkrbQmFfxD8gwnZ4AnYFegfaRBWG`: READY** / target `production` / exakt `43177a7b...`.
- GitHub Review Threads: **0**.
- Vercel Toolbar unresolved Threads auf Review-Branch und `main`: **0**.
- Issue **#292 CLOSED / completed**.

Draft-PR **#293** ist **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED**. Grund war ausschließlich der bekannte GitHub-Connectorfehler beim Draft→Ready-Schritt (`Repository.fullDatabaseId`). Branch Protection wurde nicht gelockert oder umgangen.

## 2. Was S4-R1 jetzt verbindlich liefert

- `RequirementsProvider.evaluate(anfrage, signal)` verlangt ein `AbortSignal`.
- Requirements-Provider-Ausführung besitzt einen harten, gekappten Domain-Timeout von **4.000 ms** mit echter Cancellation.
- bereits abgebrochene äußere Requests starten keinen Provider-Call.
- technische Fehler bleiben intern unterscheidbar: `timeout`, `aborted`, `temporarily_unavailable`, `unavailable`.
- technische Fehler minten keine Official Hard Truth.
- `JETNITY_READINESS_AKTIV` verwendet das bestehende Provider-Ops-Kill-Switch-Muster.
- Production bleibt für Requirements-Provider hart aus.
- `requirementsProviderAus()` bleibt `null`.
- Official `checkedAt` besitzt einen globalen Jetnity-Ceiling von **60 Minuten**; Alter `>=` Ceiling → `recheck_needed`.
- `checkedAt` ist Jetnity Retrieval-/Evaluation-Zeit und nicht Vendor-`lastUpdatedAt`.
- kein zweiter HTTP-/Retry-Stack; späterer Adapter muss den bestehenden Provider Transport Core verwenden.

## 3. Cursor-Agent

Letzter Agent:

**`Jetnity requirements truth ops 1`**  
Generation: **1**  
Session: `bc-49df8304-48ed-4820-bdf4-57f53aa1aaee`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS**.

Es läuft derzeit **kein neuer Cursor-Runtime-Slice**.

## 4. Requirements / Official Truth Boundary

Weiterhin verbindlich:

- kein echter Requirements-/Visa-/Entry-Provider aktiv;
- keine Providerwahl abgeschlossen;
- keine Provider-Secrets/API Keys;
- keine echten oder paid Provider-Calls;
- kein Vendor-Vertrag/DPA durch S4-R1;
- keine Supabase-/Migration-/RLS-/Ownership-/Auth-/AAL-Änderung in S4-R1;
- kein Workspace-Live-Provider-Wiring;
- keine neuen sensitiven Passport-/MRZ-/Biometrie-/Scan-Daten.

Kanonisches Traveller-Invariant bleibt:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, Issuer Country ≠ Citizenship, kein `documents[0]` oder `evaluations[0]` als Product Truth.

## 5. Bestätigte Entry-Requirements-/Travel-Companion-Zielarchitektur

Product Owner hat verbindlich bestätigt, dass Jetnity nicht nur Visa ja/nein darstellen darf, sondern die vollständige praktisch relevante Einreisevorbereitung strukturiert abbilden soll.

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Sie umfasst insbesondere:

- visumfrei / klassisches Visum / Visa on Arrival / eVisa / eTA;
- offizielle Antrags-/Informationslinks und direkte sichere Actions;
- Passgültigkeit;
- eigene strukturierte Typen für `blank_passport_pages` und `financial_means`;
- Transitregeln;
- Arrival-/Einreiseformulare;
- Impf-/Gesundheitsanforderungen;
- Versicherungspflicht;
- Rück-/Weiterflug- und relevante Reise-/Unterkunftsnachweise;
- proaktive Travel-Companion-/Deadline-Semantik;
- zeitgebundene Aufgaben wie „frühestens 72 Stunden vor Ankunft“;
- Prioritäten `Jetzt erledigen`, `Demnächst`, `Zur Information`;
- Neuberechnung bei Flug-/Routen-/Datum-/Credential-Änderungen;
- deduplizierte, statusbewusste In-App-/Push-/gegebenenfalls E-Mail-Begleitung;
- harte Warnungen nur aus belastbarer, aktueller Evidence.

Diese Zielarchitektur ist **kein automatischer Runtime-Auftrag**.

## 6. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt unverändert stark.

Pflicht bleiben:

- PR vor Merge;
- Branch up to date;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass leer.

Solange der Draft→Ready-Connectorfehler besteht, gilt verbindlicher mechanischer Ersatzprozess:

1. Cursor liefert im Draft-PR.
2. Technical Lead reviewt den exakten finalen Head.
3. bei TL-PASS wird ein non-draft Review-PR auf **dem exakt gleichen Commit** erstellt;
4. CI/Vercel/Mergeability/Threads werden auf diesem PR neu gegatet;
5. erst dann geschützter Merge.

Branch Protection wird deswegen **nicht** gelockert.

## 7. Supabase Boundary

S4-R1 hat Supabase nicht verändert.

Letzter bekannter Requirements-Gate-0-Stand:

- Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.
- Development `yfvbxvijcorffwxbxahl`: `ACTIVE_HEALTHY`.
- Development-vs-Production-Migration-History weist Drift auf.

Vor jedem migrationsnahen / DB-/RLS-/Storage-/Security-Slice live erneut prüfen und reconciliieren.

## 8. FIRST NEXT ACTION

**Kein Folgeslice ist automatisch gestartet oder freigegeben.**

Vor jeder weiteren Requirements-/Provider-/Travel-Companion-Implementierung muss der Technical Lead:

1. finalen `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live prüfen;
2. die bestätigte Target Architecture gegen den Ist-Code lesen;
3. nur den kleinsten verantwortbaren bounded Slice definieren;
4. Product-Owner-Gates für Providerwahl, Verträge, Secrets, paid calls, sensitive Daten oder Production-Aktivierung respektieren.

Issue **#294** bleibt als persistenter Architektur-Tracker für Entry Requirements Detail Architecture / Travel Companion offen. Das ist kein automatischer Build-Start.

**Live-Evidence gewinnt immer.**
