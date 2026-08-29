# Proposal – 12Go Mobility Adapter Foundation Task

Stand: 29. August 2026  
Status: **PROPOSAL ONLY / NICHT AUTHORISIERT / NICHT GESTARTET**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
Voraussetzung: unabhängiger Technical-Lead-Review von Draft-PR #190 plus späterer versionierter Auftrag.

Dieser Text ist **kein** Startauftrag. Ein Cursor-Agent darf ihn nicht als Runtime-Freigabe lesen.

---

## Ziel (erst nach Accept + eigenem Task)

Kleinste offline 12Go-Mobility-Adapter-Foundation, analog Skyscanner Flights:

- Jetnity-owned Normalized Contract `jetnity.twelve-go.mobility.normalized.v1`
- Fixture-Normalizer → vorhandene `MobilityOption`-Form, ohne Domänenleak
- Tests: Fixture kann `live_api` / `persisted_snapshot` nicht minten
- Kein HTTP, kein Secret, kein Signup, kein API-Approval-Request

## Explizites Non-Scope

- Shared-Core-Edits, außer der Technical Lead sie in einem **anderen** akzeptierten Slice anordnet
- Live-Transport, Auth, Sandbox
- Affiliate-Enrollment / API-Antrag
- Commercial-Provenance-Mint oder S5-B-Write
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
3. Erst nach 12Go-Consent: vertrauliche Docs lesen und Transport-Slice versionieren.
4. Erst danach Preview-Suche hinter Kill Switch.
5. Production-Live und Secrets bleiben besondere PO-Gates.

## STOPP

Nicht implementieren, bis ChatGPT / Technical Lead einen **neuen** versionierten Task auf einem frischen Slice vergibt.
