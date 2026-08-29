# Proposal – 12Go Mobility Adapter Foundation Task

Stand: 29. August 2026  
Status: **PROPOSAL ONLY / NICHT AUTHORISIERT / NICHT GESTARTET**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Voraussetzung: unabhängiger Technical-Lead-Review von Draft-PR #190 plus späterer versionierter Auftrag.

Dieser Text ist **kein** Startauftrag. Ein Cursor-Agent darf ihn nicht als Runtime-Freigabe lesen.

---

## Ziel (erst nach Accept + eigenem Task)

Kleinste offline 12Go-Mobility-Adapter-Foundation, analog Skyscanner Flights:

- Jetnity-owned **synthetische** Testform `jetnity.twelve-go.mobility.normalized.v1` — kein 12Go-API-Schema
- Fixture-Normalizer → vorhandene `MobilityOption`-Form, ohne Domänenleak
- Tests: Fixture kann `live_api` / `persisted_snapshot` nicht minten; `offerRef` bleibt test-lokal
- Kein HTTP, kein Secret, kein Signup, kein API-Approval-Request, keine Shared-Core-Edits (`lib/server/providers/core/*` bleibt unverändert)

## Explizites Non-Scope

- Shared-Core-Edits an `lib/server/providers/core/*`, `lib/provider-ops`, `lib/mobility/*` oder `lib/commercial-provenance`
- Zweiten generischen Transport-Kern
- Live-Transport, Auth, Sandbox, Parser aus Fixtures
- Affiliate-Enrollment / API-Antrag / kommerzielle Deep-Link-Erzeugung
- Commercial-Provenance-Mint oder S5-B-Write. Die S5-B-Persistenzgrundlage liegt bereits auf Production; Runtime-Write-Pfad/Principal-Allocation bleibt geschlossen. Nur eine spätere echte authentifizierte 12Go-Server-API-Antwort unter dem tatsächlichen Vertrag darf `live_api` kandidieren.
- Rental-Car-Mapping, Flight-Mapping
- UI, Production-Suche, TW-8
- iframe / White-Label / Reseller
- erfundene API-Felder

## Acceptance (wenn je gestartet)

- Typecheck, lint, relevante Tests, Production-Build
- Kein `process.env`, kein Network-Client
- Kein Import 12Go-spezifischer Typen in `lib/commercial-provenance`
- Factory bleibt `null`; Kill Switch unverändert
- Fixtures nur mit öffentlich belegbaren Fakten; Tracking-Query-Parameter bleiben UNKNOWN/`null`

## Danach extra gegatet (nicht Teil der Foundation)

1. PO entscheidet Affiliate-Enrollment (Mensch, kein Agent).
2. PO entscheidet, ob ein API-Antrag überhaupt gestellt wird.
3. Erst nach 12Go-Consent: vertraulichen first-party API-Vertrag auditieren, dann einen separat versionierten Transport-/Parser-Task gegen das reale Schema. Fixtures allein reichen nicht.
4. Affiliate-Deep-Links erst nach genehmigtem Affiliate-Status; Host-Allowlist server-seitig; keine client-minted Attribution.
5. Erst danach Preview-Suche hinter Kill Switch über `lib/server/providers/core/*`.
6. Production-Live und Secrets bleiben besondere PO-Gates.
7. S5-B-Foundation-Apply ist **kein** offenes Gate mehr. Ein späterer Live-Pfad braucht das separat gegatete Runtime-Write-Pfad-/Principal-Gate, bevor echte Commercial Provenance entstehen darf. TW-8 bleibt geschlossen, bis reale Commercial Provenance existiert.

## STOPP

Nicht implementieren, bis ChatGPT / Technical Lead einen **neuen** versionierten Task auf einem frischen Slice vergibt.
