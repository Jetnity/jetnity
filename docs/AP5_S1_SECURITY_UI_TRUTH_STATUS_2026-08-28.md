# Jetnity – AP-5-S1 Security-UI Truth – Status

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE ON DRAFT / KEIN READY / KEIN MERGE / STOPP FÜR UNABHÄNGIGEN TL-REVIEW**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 9`**  
Issue: [#132](https://github.com/Jetnity/jetnity/issues/132)  
Branch: `cursor/ap5-s1-security-ui-8b13`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/133

> Live-Evidence gewinnt. Vorbereitungs-SHAs sind Start-Evidence.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Lokales `main` beim Boot | `0bca31b5` – hinter Remote, nicht verwendet |
| `origin/main` nach Fetch | `eaa03ad71509d281990e0d34ca359e0750eb9591` – Merge PR #131 |
| Author-Branch-Start | exakt `eaa03ad7` |
| `main` Branch Protection | `protected=false` |
| Issue #132 | OPEN |
| Offene PRs | #88, #52, #50, #40, #39, #28 – historical/fremd; nicht angefasst |
| AP-5 Gate 0 / PR #129 | **integrated**; Issue #128 CLOSED / completed. Nicht neu bauen. |

## 2. Was dieser Slice geliefert hat

Runtime nur auf `/account/security` und der Login-MFA-Fehlercopy:

1. Lage-Ableitung `empty` / `unsupported` / `unavailable` / `error` / `ready` / `loading`
2. Passkey-Server-Truth aus `config.toml`; Browser-WebAuthn ist sekundär
3. Stabile Security-Fehlercopy ohne GoTrue-Rohtext, Secrets, Tokens oder otpauth-URIs
4. TOTP-Liste ohne Faktor-ID als Geräteidentität
5. Fokussierte Tests plus Gate-0-Inventory-Regression
6. ADR-0183, Task/Status/Handoff/Self-Review/Rotation

Nicht geliefert: Passwortwechsel, Reauthentication, Logout-Umbau, MFA-Step-up, Sessionliste, Consumer-AAL2, Auth-Config-Push, Migration/RLS.

## 3. Vertrag – Lagen

| Lage | Wann | UI |
| --- | --- | --- |
| `empty` | `listFactors` ok, 0 TOTP | „Noch keine Authenticator-App“ + Einrichten |
| `unsupported` | `listFactors` fehlt | keine leere-Liste-Behauptung, kein Einrichten |
| `error` | `listFactors` wirft | Retry; Empty wird nicht behauptet |
| `ready` | mindestens ein TOTP | Liste mit Anzeigename, nicht Faktor-ID |
| Passkey `unsupported` | `auth.passkey.enabled !== true` | unabhängig vom Browser |
| Passkey `unavailable` | Server an, Browser ohne WebAuthn | nur dann |
| Passkey `empty` | Server an und Browser kann WebAuthn | keine Fake-Registrierung |

Sessionlisting bleibt **ungebaut** und damit `unsupported`, nicht `empty`. Keine Session-Karte in S1.

## 4. Tests / Evidence dieses Slices

| Lauf | Ergebnis |
| --- | --- |
| Focused S1-Unit | **14/14 pass** (`account-security-lage`, `account-security-fehler`, `ap5-s1-security-ui`) |
| Gate-0-Inventory | **8/8 pass** |
| Account-Nav + MFA-A11y | **6/6 pass** |
| Lokaler Typecheck / Lint / `check:exports` / `check:dead` | pass |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |
| Exact-Head vor diesem Stamp | `55392fdae602c993f4382a67a0098ae5e62f5c51` |
| GitHub Actions | Run `33163350129` **SUCCESS** auf exakt `55392fda` |
| Jobs | Typecheck/Lint/Build SUCCESS; Auth-Konfiguration gegen config.toml SUCCESS; Vercel Preview Comments SUCCESS |
| Vercel Preview | Inspector `BviA8yxrA2h3WjzDBcfMRSZbd2hH` **SUCCESS** auf exakt `55392fda` |
| GitHub Preview-Deployment | `6139587003` success |

Dieser Stamp erzeugt einen neueren Head. Dessen CI/Vercel müssen live gelesen werden. **Kein zweiter Evidence-Stamp**, außer die Stamp-CI fehlschlägt.

## 5. Residuals – nicht in S1 mischen

- AP-5-S2 bis S5 nicht gestartet
- Login-MFA bleibt abbrechbar (AAL1-Sitzung bleibt)
- D0-P1-03 Legal-404
- C2 PO-gated
- `main` Branch Protection `protected=false`

## 6. Nächster Schritt

STOPP für unabhängigen Technical-Lead-Review des Draft-PR. Nicht Ready. Nicht mergen. S2–S5 nicht automatisch starten.
