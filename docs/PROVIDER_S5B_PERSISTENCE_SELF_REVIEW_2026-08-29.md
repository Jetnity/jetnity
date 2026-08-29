# Provider S5-B Persistence – Agent Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / KEINE FREIGABE / KEIN PASS**  
Agent: `Cursor-Agent: Jetnity provider readiness audit 4`  
PR: https://github.com/Jetnity/jetnity/pull/182

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead Exact-Head-Review.

---

## 1. Scope-Treue

| Grenze | Gehalten? |
| --- | --- |
| Schema + RLS + Grants + Write-Authority + Legacy-Härtung + Tests + Threat Model | ja |
| TL-182-01/02/03 Review-Fixes | ja, im Repository |
| keine Provider-Aktivierung / Secrets / paid calls | ja |
| kein TW-8/TW-9 | ja |
| kein Account/AP-6/AP-7 | ja |
| kein Auth/MFA/AAL | ja |
| kein Service Role im Produktpfad | ja |
| kein Backfill / keine History | ja |
| keine Production-Supabase-Anwendung | ja |
| kein Ready / kein Merge | ja |
| Task-Datei unangetastet | ja |
| Flight-Guard-Triggername erhalten | ja |

## 2. Technical-Lead Findings

### S5B-TL-182-01 – Runtime-Principal

`auth.uid()` ist Pflicht. NULL-Principal wird mit `null principal reject` abgewiesen. EXECUTE bleibt nur bei `jetnity_commercial_writer`. `jetnity_commercial_runtime` ist NOLOGIN/NOINHERIT und Mitglied des Writers für ein späteres SET ROLE, ohne Privilegien zu erben. `production_write_path_allocated=false` kodiert ausdrücklich: die DEFINER-Funktion ist **kein** ausführbarer Production-Write-Pfad.

### S5B-TL-182-02 – Kanonische Validierung

`commercialPersistenzNutzlastBauen()` erzeugt `jetnity.commercial_persistence.v1` / `s5a_validated_snapshot`. Die SQL-Funktion lehnt rohe Client-Keys (`sourceKind`, `akteur`, `providerId`, …) ab und mappt `live_api` nicht still auf `persisted_snapshot`.

### S5B-TL-182-03 – Isolierte DB-Evidence

`npm run db:s5b-persistenz-lokal` wendet Bootstrap + Migration auf lokale PostgreSQL 16 an und erfüllt 19/19 Nachweise (RLS/Grants/EXECUTE, Owner-Read, Cross-Owner-Deny, Direct-DML-Deny, NULL-Principal, raw payload, note/domain/source, Refresh-Identität, Guard-Matrix, geschlossenes Production-Gate). Production wurde nicht berührt.

## 3. Adversarial Prüfung

### 2.1 Kann ein Client `live_api` persistieren?

Nein. Rohe Client-JSON wird abgelehnt. Die validierte Nutzlast trägt bereits `persisted_snapshot`.

### 2.2 Kann Stay/Activity-Owner-DML einen Provider-Preis erzeugen?

Nein. Guard und `reise_anlegen` nullen die ganze Legacy-Menge.

### 2.3 Wird `note` zur Domain?

Nein. Domain-CHECK hat fünf Werte. Write lehnt `note` ab.

### 2.4 Ist der Write ein Production-Pfad?

Nein. Gate geschlossen. Kein GRANT der Runtime-Rolle an eine Login-Rolle.

### 2.5 Schwächt der Slice den Flight-Guard?

Nein. Triggername unverändert.

## 4. Offene Residuals

Production unverändert. Kein realer Snapshot. TW-8 geschlossen. Runtime-Principal-Zuweisung bleibt ein späteres Gate. Self-Review ist kein PASS.
