# Jetnity – Trip Workspace TW-8/TW-9 Readiness Revalidation

Stand: 31. August 2026  
Status: **BINDING READ-ONLY AUDIT / NO RUNTIME**

Issue: #299  
Baseline: `main@7f057e6ee8caddf87a3b5365731eaf43d037a114`  
Branch: `audit/tw8-tw9-readiness-2026-08-31`

## Ziel

TW-8-/TW-9-Startbedingungen gegen den tatsächlichen heutigen Main-Stand neu bewerten. Ältere Plantexte enthalten teilweise historische Aussagen zu S5-B und dürfen nicht blind übernommen werden.

## Verbindlicher Scope

1. Aktuelle Commercial-Provenance-Persistenz, Runtime-Gates, Writer/Source-Authority und Provider-Aktivierung live/codebasiert rekonstruieren.
2. TW-8-Gate explizit in Bestandteile zerlegen: Schema/Persistenz, Provenance-Vertrag, tatsächliche vertrauenswürdige Writer, reale Provider-Evidence/Freshness, UI-Übernahmegrenzen.
3. Feststellen, welche Teile erfüllt, blockiert oder nur vorbereitet sind.
4. TW-9-Voraussetzungen und verbleibende Workspace-Gaps gegen aktuellen Code/Tests/Docs neu prüfen.
5. File-/Surface-/Shared-Contract-Kollisionsmatrix für spätere TW-Slices erstellen.
6. Kleinsten verantwortbaren nächsten TW-Schritt empfehlen oder `BLOCKED` feststellen.

## Hard Non-Scope

- keine Runtime- oder UI-Änderung;
- kein TW-8/TW-9 implementieren;
- keine Provideraktivierung, Vendor-Kommunikation, Secrets, paid calls oder Verträge;
- keine Commercial-Provenance-Mints/Writer;
- keine Supabase-/Migration-/RLS-/Auth-/AAL-Mutation;
- keine Shared Traveller/Requirements/Account-Verträge;
- `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` nicht verändern;
- kein automatischer Folgeslice.

## Parallelitätsgrenze

Nur eigene TW-Audit-/Evidence-Dokumente. Keine Dateien des Entry-Requirements-E1- oder GitHub-Hygiene-Streams verändern.

## Acceptance

- Current-vs-Historical-Evidence klar getrennt;
- TW-8- und TW-9-Gates einzeln und nachvollziehbar klassifiziert;
- reale Commercial Truth ≠ vorhandenes Schema ausdrücklich beachtet;
- kein scheinbarer Unlock aus reinem Persistence-Fundament;
- konkrete File-Overlap-/Merge-Risiken dokumentiert;
- STOP für unabhängigen Technical-Lead-Review.
