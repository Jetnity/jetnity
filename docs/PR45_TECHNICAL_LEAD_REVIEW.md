# PR #45 – Independent Technical-Lead Review

Stand: 24. August 2026  
PR: `#45 Provider Readiness Audit – provider-neutrale Adapter- und Contract-Prüfung`  
Branch: `audit/provider-readiness`  
Geprüfter Head: `172ff5ebec5969c56217f3d900708ff46970cb36`  
Reviewer: Technical Lead / `Jetnity`  
Review-URL: https://github.com/Jetnity/jetnity/pull/45#pullrequestreview-5006164920

## Urteil

**AUDIT-PASS / planning accepted.**

Der Review hat die Audit-Befunde unabhängig gegen den Repository-Stand geprüft und nicht nur die Agent-Zusammenfassung übernommen. Die zentralen Funde sind codebelegt. Die vorgeschlagene Richtung ist angenommen: minimaler gemeinsamer **Operationsvertrag**, keine universelle Provider-/Offer-Plattform, Fachwahrheiten bleiben getrennt, Evidence/Provenance und Kostenschutz vor Live-Aktivierung.

Dieses PASS ist **keine** Implementierungsfreigabe, keine Provideraktivierung, keine Secret-/Vertrags-/Kostenfreigabe, kein Mark Ready und keine Merge-Freigabe.

PR #45 bleibt Draft.

## 1. Unabhängig bestätigte Funde

| Fund | Reviewer-Evidence |
| --- | --- |
| Flug-Kontoübernahme persistiert untrusted Browser-`FlugOption` (Preis/Provider/external_ref) ohne Hotel-artige serverseitige Evidence-Grenze | `lib/flights/schema.ts`, `lib/flights/aktionen.ts` |
| Domain-Rate-Limits sind prozesslokal; bezahlte Calls auf Vercel brauchen einen globalen Guard | `lib/flights/rate-limit.ts`, `lib/modell/kontingent.ts` |
| `RequirementsProvider.evaluate` ohne `AbortSignal` / explizites Provider-Timeout | `lib/readiness/provider.ts` |
| Safety-HTTP setzt `party: []` | `lib/safety/auswerten.ts` |
| Mobility-Suche startet automatisch beim Workspace-Mount | `components/trips/MobilitaetBereich.tsx` |
| Duffel-Request sendet die Jetnity-Währung nicht | `lib/flights/duffel/adapter.ts` |

## 2. Integrationsnachweis des Reviews

- Branch gegenüber `main` docs-only: 12 Dokumentations-/Architekturdateien, keine Runtime-Änderung
- GitHub Actions CI auf Exact Head `172ff5eb`: SUCCESS (`32684851005`)
- Vercel Preview auf Exact Head: READY (`dpl_DvRWt9Pub3KuMAa5VUBsMsNnZKrN`)

## 3. Non-blocking Note

Teile der operativen Statusformulierung in den Audit-Docs entstanden, bevor Account AP-1 und Admin Slice A ihre späteren Technical-Closure-Stände erreicht haben. Das entkräftet die Provider-Funde nicht.

Bei einer späteren Synchronisierung/Merge von PR #45 muss der dauerhafte Status-Text aufgefrischt werden, damit er parallele Closures nicht zurückschreibt.

Verifizierter Parallelstand zum Zeitpunkt dieses Persistenz-Updates (nicht auf `main`, nicht gemergt):

- Admin Slice A (Draft PR #44): Technical-Lead Final Recheck **PASS / TECHNICAL CLOSURE** auf Head `5632a3cac1301d2d649fcb1d2b9552d3763c8b9f`; Nachweis `docs/ADMIN_PLATFORM_SLICE_A_TECHNICAL_CLOSURE.md` auf jenem Branch. Keine Mark-Ready-/Merge-Freigabe.
- Account AP-1 (Draft PR #43): Implementierung aktiv; Technical-Lead REQUEST CHANGES zu Geräte-Kalendertag und evidentem 503-Text laut jenem Branch umgesetzt (ADR-0153). Noch kein AP-2.

## 4. Nächster Provider-Readiness-Schritt

Bevorzugter nächster Implementierungsblock laut Review:

1. **PR-S1 – Shared Operational Contract**
2. danach der evidence-kritische **`FlugNachweis`-Slice** (PR-S2)

Ein eigener versionierter Cursor-Auftrag und eine ausdrückliche Product-Owner-/Technical-Lead-Implementierungsfreigabe sind Voraussetzung. Dieser Review allein autorisiert PR-S1 nicht.

## 5. Harte Grenzen bleiben

- keine echte Providerintegration
- keine Secrets, Verträge oder kostenpflichtigen Calls
- keine Production-Migration
- kein Mark Ready
- kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe
