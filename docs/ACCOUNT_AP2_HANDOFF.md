# Jetnity Account Platform – AP-2 Handoff

Stand: 24. August 2026  
Status: **HISTORICAL HANDOFF. AP-2 ist auf `main` integriert (PR #48). Nicht der aktuelle operative Stand.**

> Kanonisch: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Agent | https://cursor.com/agents/bc-01a030a0-d97f-782b-8bd0-acb906563518 |
| Workstream | Account Platform AP-2 |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Base | `main` @ `084f7c87f36f9929f3e4a9deb9d3fedef6e96982` |
| Auftrag | `docs/ACCOUNT_AP2_MAIN_SYNC_TASK.md` |
| Produktauftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` + `docs/ACCOUNT_AP2_B1_FIX_TASK.md` |
| Runtime-Head | `de5ffd8a91576a2281b6d5eda75338504a43b7a7` |
| Self-Review | `docs/ACCOUNT_AP2_SELF_REVIEW.md` |
| Technical Closure | `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md` – Integrationsreview PASS auf `de5ffd8a` |

## Was ein neuer Agent zuerst liest

1. `docs/ACCOUNT_AP2_MAIN_SYNC_TASK.md`
2. `docs/ACCOUNT_AP2_STATUS.md`
3. `docs/ACCOUNT_AP2_SELF_REVIEW.md`
4. `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md`
5. `docs/ACCOUNT_AP2_B1_FIX_TASK.md`
6. `docs/ACCOUNT_AP2_AUTH_UX_TASK.md`
7. Draft-PR #48 gegen `main`

## Main-Sync

- AP-1 / PR #43 ist nach `main` gemergt: Squash `084f7c87f36f9929f3e4a9deb9d3fedef6e96982`.
- AP-2 wurde auf genau diesen `main` rebase; die alte AP-1-Historie liegt nicht mehr als Produktänderung im PR.
- PR #48 ist auf `main` retargetet und bleibt Draft.
- `main` ist Ancestor von `de5ffd8a`.

## Runtime-Nachweis

- **Gegates Runtime-Head:** `de5ffd8a91576a2281b6d5eda75338504a43b7a7`
  - GitHub Actions: **SUCCESS** (`32727253862`)
  - Vercel Preview: **success / READY** (`AAYbSDBt4p636mxY1aWuPgq9gUSS`)
  - Preview-URL: https://jetnity-m244nhepk-jetnity-e1b93c82.vercel.app
- Letzter produktiver Code-Commit der neuen Serie: `bec064eb`. `de5ffd8a` ist der Exact-Head nach Rebase inklusive leerem CI-Retrigger; derselbe Runtime-Baum.
- Nachfolgende Docs-Commits ändern diesen Runtime-Nachweis nicht.
- Der frühere Head `e9b2f834` gilt nicht mehr.

## Produktstand AP-2 (unverändert)

AP2-B1 bleibt geschlossen. `registerSignupOeffentlichAuswerten()` führt Bestandskonto-neutralisiert und neuen Signup ohne Session auf denselben `registerOeffentlicherErfolg()`.

Öffentlich identisch sind:

- neutrale Success-Copy,
- geleerte Name-/E-Mail-/Passwortfelder,
- keine Feldfehler,
- gleicher Success-State,
- gleicher Fokus auf `#register-erfolg`.

OAuth-Schaltflächen nur bei belegtem `config.toml`-Enablement. `next` nur `/account*` und `/reisen*`, sonst fail-closed `/reisen`. Login/Register über `getUser()`. Gast `/reisen` zeigt Fortsetzen nur bei `gastspeicher.aktiv`. Footer nutzt `sitzungseintraege()`. MFA-Dialog bleibt a11y-gehärtet ohne MFA-/AAL-Vertragswechsel.

## Nicht angefasst

DB/Migration/RLS, Consent-Write, Traveller-Registry, Guest→Account-Persistenz, Payment, Provider-Aktivierung, OAuth-Secrets, Production-Redirect-Push, Admin, Homepage, Route/Readiness/Safety/Seasonal, AP-3, neue AGB-/Datenschutztexte.

## Offene, ehrliche Restpunkte

- Gastübernahme bleibt auf `/reisen`; das ist der bestehende Vertrag.
- MFA-Dialog hat keinen separaten Browser-/Screenreader-Lauf; der Quellvertrag und Account-UI-Audit bleiben der vorhandene Nachweis.
- OAuth-Anbieter bleiben in `config.toml` aus.
- Technical Integration Closure / PASS liegt vor. Das ist keine Product-Owner-Freigabe für Mark Ready oder Merge.

## Nächster Schritt

Product-Owner-Entscheidung über Mark Ready / Merge von Draft-PR #48.  
STOPP. Kein AP-3. Kein Mark Ready. Kein Merge. Keine Production-Migration. Keine Provider-/Secret-/Kosten-Aktivierung.

Kurz Ready um 12:59 UTC, 20 Sekunden später wieder Draft durch `Jetnity`. Aktueller Stand: Draft. Keine Merge-Freigabe.
