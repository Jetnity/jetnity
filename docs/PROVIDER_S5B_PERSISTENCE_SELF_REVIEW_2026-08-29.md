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
| keine Provider-Aktivierung / Secrets / paid calls | ja |
| kein TW-8/TW-9 | ja |
| kein Account/AP-6/AP-7 | ja |
| kein Auth/MFA/AAL | ja |
| kein Service Role im Produktpfad | ja |
| kein Backfill / keine History | ja |
| keine Production-Supabase-Anwendung | ja |
| kein Ready / kein Merge | ja |
| Task-Datei unangetastet | ja |
| ADR-0168 nicht umgedeutet | ja |
| Flight-Guard-Triggername erhalten | ja |

## 2. Adversarial Prüfung

### 2.1 Kann ein Client `live_api` persistieren?

Nein. Die Zeile erzwingt `persisted_snapshot`/`snapshot`. Der Write ignoriert Client-`sourceKind`.

### 2.2 Kann Stay/Activity-Owner-DML einen Provider-Preis erzeugen?

Nein. Guard und `reise_anlegen` nullen die ganze Legacy-Menge.

### 2.3 Wird `note` zur Domain?

Nein. Domain-CHECK hat fünf Werte. Write lehnt `note` ab. Guest-Strip leert Note-Handelsfelder.

### 2.4 Gibt es eine zweite Hard-Truth auf Flachfeldern?

Nur als kontrollierte Projektion desselben trusted Writes. Ohne Provenance-Zeile bleibt Legacy `unknown`. `booking_url` wird nicht erfunden.

### 2.5 Ist der Write über PostgREST erreichbar?

Nein. Schema `jetnity_internal` ist nicht in `[api].schemas`. EXECUTE fehlt für `anon`/`authenticated`/`service_role`.

### 2.6 Schwächt der Slice den Flight-Guard?

Nein. Flight-INSERT bleibt null, Flight-UPDATE bleibt freeze. Triggername unverändert.

## 3. Lokale Gates

Gemessen auf Implementation-Head `e3bef6f9`: 2605 Tests pass; typecheck pass; lint 0/135; hygiene pass; production build pass. `db:sicherheit` nicht gegen unapplied Schema. Production nicht mutiert.

## 4. Offene Residuals

Production unverändert. Kein realer Snapshot. TW-8 geschlossen. Superuser- oder künftiges EXECUTE-Grant wäre ein eigenes Gate. Self-Review ist kein PASS.
