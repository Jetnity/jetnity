# Jetnity – P2-TA-04 Traveller Child Write-Path Gate 0 – Handoff

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE / DRAFT / STOPP / KEINE IMPLEMENTATION**  
Cursor-Agent: **`Account plattform audit vorbereitung 6`**  
Issue: [#119](https://github.com/Jetnity/jetnity/issues/119)  
PR: https://github.com/Jetnity/jetnity/pull/120

## Zuerst lesen

1. `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_TASK_2026-08-28.md`
2. `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_STATUS_2026-08-28.md`
3. `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_SELF_REVIEW_2026-08-28.md`
4. ADR-0180 in `DECISIONS.md`
5. `docs/P2_TA04_AGENT6_START_PROMPT_2026-08-28.md`
6. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` – bleibt der AP-5–AP-12-Plan; dieser Slice startet ihn nicht

## Was ein neuer Chat wissen muss

P2-TA-04 Gate 0 ist Audit/Security Architecture. Es gibt **kein** bewiesenes Cross-User-P0.

Live Production und `develop`: `authenticated` hat CRUD auf den drei Traveller-Tabellen. RLS ist owner-scoped. `party_schreiben` ist SECURITY INVOKER und braucht deshalb genau diese Tabellenrechte.

Der einzige aktuelle App-Tabellenwrite ist `travellerEntfernen` → `DELETE` auf `trip_travellers`. Setzen und Guest→Account laufen über `party_schreiben`. Child-Tabellen haben keinen App-Write-Caller.

Ein blindes `REVOKE` bricht das INVOKER-RPC und den Delete-Pfad.

Empfehlung: **Option C**, gestuft. Nicht in diesem PR umsetzen.

## Was gebaut wurde

Nur Docs, ein ADR und ein statischer Inventory-Test. Keine Migration, kein Grant, keine RLS, keine Production-Änderung.

## Was bewusst nicht gebaut wurde

C1/C2 Runtime, `party_loeschen`, SECURITY DEFINER, REVOKE, Party-Cap-Trigger, AP-5/AP-6a/AP-7, Passnummern/Scans/MRZ/Biometrie, Provider/TW-8/Search/Homepage/Native.

## Shared Contract

Kein neuer Runtime-Vertrag. ADR-0180 entscheidet nur die Gate-0-Closure-Richtung. ADR-0119 bleibt der Write-Pfad; ADR-0117/0123 bleiben trip-scoped Expand/Contract.

## Residuals

- Party-Cap 20 ist weder DB-seitig noch im inkrementellen RPC vollständig
- Child-Limits gelten nur für INSERT
- `party_schreiben` ersetzt nicht die ganze Party und löscht keine Traveller
- `main` Branch Protection `protected=false`
- Historischer PR #39 bleibt Historical Evidence
- D0-P1-03 Legal-404 bleibt ausserhalb
- Exact-Head Actions/Vercel müssen auf dem **finalen** Author-Head live gelesen werden
- GitHub-PR-Body ist TL-managed; Zieltext liegt in `docs/P2_TA04_PR120_DESCRIPTION_2026-08-28.md`

## Nächster Schritt

Unabhängiger Technical-Lead-Review. Nicht Ready. Nicht mergen. Keinen Implementation-Folgeslice aus diesem Handoff starten.
