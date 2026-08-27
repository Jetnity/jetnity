# Jetnity – TW-7 Hub-Gap – Status

Stand: 27. August 2026  
Agent: `Trip workspace audit architecture`  
Auftrag: `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`  
Status: **TW-7-Gap / ADR-0176 / TW7-A-Spec durch PR #100 versioniert. TW7-A Runtime durch PR #106 integriert. Issue #103 nach Live-Post-Merge-Verifikation schliessbar.**

> Kanonischer operativer Stand zusätzlich: `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`. Live-Evidence gewinnt. PR #106 ist das Runtime-Integrationsvehikel. Live-`main` immer live prüfen.

Historische Entstehungsevidence (nicht aktueller operativer PR-Status): Branch `cursor/tw7-hub-gap-slice-b13d`. Aussagen älterer Fassungen („Draft-PR #100“, „kein Ready / kein Merge“) sind Pre-Merge-Evidence.

## 1. Live-Baseline der Rekonstruktion

Geprüft am 27. August 2026 gegen GitHub, nicht gegen Chat-Erinnerung:

| Fakt | Wert |
| --- | --- |
| `origin/main` bei Rekonstruktion | `beaef64a151adceb8f5bc759f58ae9ad13cecc51` — `Merge PR #98: Admin AAL2 production data-plane alignment` |
| Erste Hub-Codeprüfung | `84f54194`; PR #98 hat keine Trip-/Hub-Dateien geändert |
| GitHub Actions auf exakt `beaef64a` | Run `33087558642` **SUCCESS** |
| GitHub Production-Deployment auf exakt `beaef64a` | `6125680097` **success** |
| `main` Branch Protection | `protected=false` (Governance-Risiko, unverändert) |

Linie nach PR #96:

- Merge PR #96 `45be14b1`
- PR #97 TL-Rekonstruktion + AAL2-Production-Gate-Docs `4362502b`
- direkte `main`-Docs `d9517252` / `ac2ac9b2` (Governance-Deviation, nur Docs)
- noop / keep-file `b96343cf` / `84f54194`
- Merge PR #98 `beaef64a` — Alignment-Migration auf `main`, Production-Apply **nicht** ausgeführt

## 2. Vertragsprüfung

Gelesen und gegen Code auf `84f54194` gehalten; nach Merge von PR #98 auf `beaef64a` erneut bestätigt, dass keine Hub-/Trip-Dateien geändert wurden:

- TW-7 in `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- AP-3 Task/Status/Handoff + ADR-0160
- TW-2 / ADR-0164
- ADR-0152 / ADR-0153
- Dependency-Matrix: Hub-Lage nicht neu bauen; Archiv = AP-4; Traveller = AP-7
- Transformation Scope Policy §2.3–2.4
- Product-Owner PR-34 Mehrziel-Reisekarte
- TL-Rekonstruktion Abschnitt 9
- AAL2-Auftrag / PR #98 Non-Scope (kein TW-7-Runtime)

Code-Evidence:

- `UEBERSICHT_SPALTEN` = `trip_stages(count)` ohne Namen
- `TripSummary` ohne Etappenidentität
- `Reisekarte` ohne Routentext
- `uebersichtOrte` bereits Workspace-Wahrheit
- `GastReisen.alsUebersicht.itemCount` ohne `ohneTag`

## 3. Ergebnis

**TW-7-Start-Gate: erfüllt.**  
**TW-7-Rest-Gap: Hub-Kartenidentität (Mehrziel + Gast-`itemCount`).**  
**TW7-A Runtime: durch PR #106 integriert.** Operativer Stand: `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`. Issue #103 nach Post-Merge-Verifikation schliessbar.

Der kleine Slice heisst TW7-A und steht in der Spec. Ältere Sätze „Runtime nicht gestartet / Draft / nicht auf main“ sind Pre-Merge-Evidence.

## 3a. Historische Pre-Merge Exact-Head-Evidence

Kein aktueller operativer Draft-Status. Nur Entstehungsevidence vor der Landung von PR #100:

| Fakt | Wert |
| --- | --- |
| Rekonstruktions-Head | `2aa573f1b093ddee88b2ffe2820a36396194e397` |
| GitHub Actions | Run `33087982878` **SUCCESS** |
| Vercel Preview | `DUzQZnDEY2TBdP1rwoZFPs2bzFsA` **SUCCESS** auf exakt diesem SHA |
| GitHub Preview-Deployment | `6125759207` **success** |
| Stamp-Head | `2abe79b4` / Actions `33088507998` SUCCESS / Vercel `8NJVH46dzhrvUur8raAGukyiyzcL` SUCCESS |

Diese Zeilen ändern keine Runtime und sind selbst kein Produkt-Gate.

## 4. Was PR #100 versioniert

Nur Dokumentation. Kein Runtime.

- `docs/TRIP_WORKSPACE_TW7_HUB_GAP_TASK.md`
- `docs/TRIP_WORKSPACE_TW7_HUB_GAP_STATUS.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/JETNITY_BINDING_BUILD_ORDER.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `DECISIONS.md` (ADR-0176)
- `ROADMAP.md`

AAL2-Migration, Playbook und Production-Apply bleiben unangetastet.

## 5. Offene Risiken

- Production-AAL2 `20260827170000` ist über PR #102 angewendet und verifiziert, exakt einmal. `aktuelles_admin_aal2()` ist live. Kein zweiter Apply. Ältere Sätze „Apply bleibt ein Gate“ sind Pre-Apply-Evidence.
- `main` bleibt ungeschützt.
- Bereits gespeichertes `archived` bleibt in AP-3-Datumsgruppen sichtbar; das ist AP-4, nicht TW7-A.
- Pfeil- vs. Punkt-Schreibweise der Route ist bewusste Non-Scope-Entscheidung gegen einen dritten Formatfork.
- Ein späterer Runtime-Select `trip_stages(name, position)` muss RLS-kompatibel bleiben; bei Fehler kein Service-Role-Fallback.

## 6. Nach Landung

Die Spec bleibt die bindende Slice-Grenze. TW7-A Runtime ist durch PR #106 integriert. Issue #103 nach Live-Post-Merge-Verifikation schliessbar.

Kein AP-4, TW-8 oder Homepage aus dieser Spec. Kein zweiter AAL2-Apply.
