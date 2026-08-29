# Jetnity – AP-7-S4 Registry → Trip Snapshot Materialization Handoff

Stand: 30. August 2026  
Status: **REVIEW-FIX COMPLETE / LOCAL GATES GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

## What is finished

AP-7-S4 lässt einen angemeldeten Owner einen gespeicherten Account-Registry-Reisenden bewusst in eine konkrete Reise übernehmen.

Die Übernahme erzeugt einen **neuen, trip-eigenen Snapshot**. Sie erzeugt keine Live-Verknüpfung. Spätere Registry-Änderungen oder -Löschungen schreiben bestehende Trip-Snapshots nicht um.

Binding bleibt:

> Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
> Trip Snapshot = einzige Current Truth einer konkreten Reise.

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/223 |
| Branch | `feat/ap7-s4-registry-to-trip-materialization-2026-08-30` |
| Baseline / `origin/main` | `b6ec2e431a3d92cc7b5fd4fdc0857d7f8fe4072e` |
| Behind `origin/main` | **0** |
| Cursor-Agent | `Account plattform audit vorbereitung 18` |
| Cloud-Run | https://cursor.com/agents/bc-fb93e3d3-c546-4077-a600-cf1e1e7dd54c |
| Reviewed-then-fixed Head | `40204e2218db097e50a4016c1a66569ca4275eed` |
| Review-fix implementation | `390cc0d0e70cb31a67baf527fe9b33b5122b8227` |
| Exact Head | der Commit dieses Continuity-Stamps; live am PR #223 prüfen |
| Rename | keine unterstützte Rename-Fähigkeit; UI nicht als umbenannt behauptet |
| Generation | 18. Dieselbe Session; kein neuer logischer Agent. |

## Scope proof

Vorhanden:

- explizite Action `registryTravellerInReiseUebernehmen`
- S1-Projektion mit frischen Identitäten
- atomarer `party_schreiben`-Write
- kleinste Account-only UI im Reisendenkontext
- focused Tests für Projektion, Disjunktheit, Multi-Citizenship/Document, nullable Relation, Limit, Empty≠Error, no auto-materialize, write-path inventory
- Review-Fix-Orchestrierungstests für Task §8 Write-/Auth-Fälle (missing/unauthorized Registry und Trip, Limit ohne Write, ehrlicher Write-Fehler, inkrementelles Add, Action-Auth)

Abwesend / nicht angefasst:

- `supabase/migrations/*` neu
- RLS / GRANT / Ownership / SECURITY DEFINER
- Auth/Session/MFA/AAL
- Service Role
- Guest→Registry Import/Dedup
- Registry→Trip FK/provenance
- Passport-/Dokumentnummern, Scans, MRZ, Biometrie, DOB, Health
- Default/Primary/Chosen Credential
- Provider / TW-8 / Payments / Homepage / Collaboration / AP-8+
- globale Continuity-Dateien

## Tests / Build

Lokal verifiziert auf Review-Fix-Implementation-Head `390cc0d0e70cb31a67baf527fe9b33b5122b8227`:

- `npm test` **2715/2715**
- Typecheck pass
- Lint 0 errors
- Hygiene: dead/exports/deps/api-schutz/schema-bezug pass
- Production build pass

Prior CI #1289 / Vercel auf `40204e22` sind durch den Review-Fix-Push ungültig. CI/Vercel auf dem finalen Stamp-Head müssen live vom unabhängigen Reviewer geprüft werden. Dieser Authoring-Lauf behauptet sie nicht für den Stamp-Commit.

Nicht verifiziert in dieser Umgebung:

- authentifizierter Browser-/Real-Device-Durchlauf

## Review protocol

1. Exact Head / Diff / Merge-Base gegen aktuelles `origin/main` prüfen (0 behind erwartet).
2. Runtime/UI, Tests und Slice-Docs reviewen; keine Schema-/RPC-/RLS-Erweiterung verlangen, wenn der Write-Vertrag den Snapshot atomar aufnimmt.
3. GitHub Actions + Vercel Preview auf dem exact head prüfen.
4. 0 unresolved review threads.
5. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

Jeder neue Code-Commit invalidiert frühere exact-head gates. Immediate CHANGES-REQUIRED-Fixes bleiben in derselben Agent-Session und im S4-Scope.

## Residuals / Empfehlungen

1. **Discoverability (P3, später):** Die Fläche sitzt in der bestehenden, standardmäßig geschlossenen Vorbereitung. Das war die kleinste saubere Insertion. Eine sichtbarere, immer offene Aktion wäre ein eigener UX-Slice, kein stilles Redesign jetzt.
2. **Mehrfachübernahme (by design):** Derselbe Registry-Eintrag erzeugt bei jeder expliziten Aktion einen neuen Snapshot. Ein späterer, nicht-blockierender Hinweis „Bezeichnung existiert schon in dieser Reise“ wäre möglich, darf aber kein stilles Dedup oder Live-Link werden.
3. **Write-IDs:** `party_schreiben` speichert clientRefs und vergibt Tabellen-IDs selbst. Das ist der bestehende Vertrag. S4 erzwingt keine RPC-Änderung.
4. **QA-Evidence:** Authentifizierter Preview-Klick und Real Device bleiben offen.

## Exact first unfinished next step

Unabhängiger Technical-Lead Exact-Head **Re-Review** auf dem finalen Stamp-Head von Draft-PR #223. Kein Ready. Kein Merge. Kein AP-7-S5. Keine Production-/Supabase-Mutation.
