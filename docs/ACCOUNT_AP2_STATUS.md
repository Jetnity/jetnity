# Jetnity Account AP-2 – Status

Stand: 24. August 2026  
Status: **TECHNICAL INTEGRATION CLOSURE / PASS – Draft, kein Ready, kein Merge, kein AP-3**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap2` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/48 |
| Base | `main` @ `084f7c87f36f9929f3e4a9deb9d3fedef6e96982` |
| Auftrag | `docs/ACCOUNT_AP2_MAIN_SYNC_TASK.md` |
| Produktauftrag | `docs/ACCOUNT_AP2_AUTH_UX_TASK.md` + `docs/ACCOUNT_AP2_B1_FIX_TASK.md` |
| **Runtime-Head** | `de5ffd8a91576a2281b6d5eda75338504a43b7a7` |
| Letzter Code-Commit der neuen Serie | `bec064eb` (`fix(auth): align register success state for existing and new signups`) |
| Vorheriger gestapelter Runtime-Head | `e9b2f834edc925b12e8b5a667f0e4382642eae8f` (gilt nicht mehr) |
| Technical Closure | `docs/ACCOUNT_AP2_TECHNICAL_CLOSURE.md` – Integrationsreview PASS auf `de5ffd8a` |

## Main-Sync

- `origin/main` zum Gate-Zeitpunkt: `084f7c87f36f9929f3e4a9deb9d3fedef6e96982` (Squash-Merge von AP-1 / PR #43). `main` ist danach nicht weitergelaufen.
- `feat/account-ap2` wurde mit `git rebase --onto origin/main 9cc9b052` auf diesen `main` rebase; AP-1 kommt nur noch einmal aus `main`.
- PR #48 ist auf `main` retargetet und bleibt Draft.
- Konflikte nur in `JETNITY_HANDOFF.md`, `ROADMAP.md`, `docs/ACTIVE_WORK_STATUS.md`; jeweils der aktuelle `main`-Stand behalten, danach hier nachgezogen.
- Diff gegen `main` trägt nur AP-2-Scope. Keine Account-AP-1-, Provider-Ops-, Seasonal-/Route-/Safety-Wahrheit zurückgedreht.

## Remote-Gates auf dem Runtime-Head

Genau `de5ffd8a91576a2281b6d5eda75338504a43b7a7`:

- GitHub Actions CI: **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/32727253862
- Vercel Preview: **success / completed** – https://vercel.com/jetnity-e1b93c82/jetnity-app/AAYbSDBt4p636mxY1aWuPgq9gUSS
- Preview-URL: https://jetnity-m244nhepk-jetnity-e1b93c82.vercel.app

Ein nachfolgender Docs-only-Commit ist **kein** neues Runtime-Gate.

PR #48 bleibt Draft. Kein Mark Ready. Kein Merge.

## Lokale Gates auf dem Runtime-Head

- AP-2-Regressionen inklusive AP2-B1-Outcome-Tests: grün
- `npm test`: 1780/1780 grün
- `npm run typecheck`: grün
- `npm run lint`: keine Warnungen/Fehler
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: grün
- `npm run auth:pruefen`: 55 erwartete Werte stimmen
- `npm run build`: Production-Build grün
- `npm run audit:account`: 48/48 grün (`AUDIT_PORT=3465`)

## Scope-Ergebnis (unverändert)

| Slice | Ergebnis |
| --- | --- |
| A OAuth nur bei Enablement | Schaltflächen nur bei `auth.external.{google,apple}.enabled === true`. Repository-`config.toml` bleibt aus. |
| B `next`-Allowlist | Zentral in `erlaubtesNaechstesZiel()`. Fail-closed auf `/reisen`. |
| C Login/Register-Gate | `getUser()` + `anmeldeSeiteZiel()`. Kein `getSession()` auf den Server-Seiten. |
| D Register-Enumeration | Neutrale Public-Copy **und** identischer öffentlicher Post-Submit-Zustand; AP2-B1 geschlossen. |
| E Gast `/reisen` | Primär **Reise fortsetzen** nur bei `gastspeicher.aktiv`. |
| F Footer | `sitzungseintraege()` statt hartem Anmelden/Registrieren. |
| G MFA-Dialog | Name/Beschreibung, Fokus, Tab-Falle, Escape schliesst nicht, 44px-Ziele. Kein MFA-/AAL-Vertragswechsel. |

## Nicht enthalten

Keine DB/Migration/RLS, keine Consent-Persistenz, keine Traveller-Registry, keine Guest→Account-Vertragsänderung, keine Provider-Aktivierung, keine Legal-Texte, kein AP-3, kein Homepage-Redesign, kein Mark Ready, kein Merge.

## Technical-Lead-Verdict

Unabhängiger Integrationsreview nach AP-1-Merge und AP-2-Main-Sync: **PASS / TECHNICAL INTEGRATION CLOSURE**.  
Quelle: https://github.com/Jetnity/jetnity/pull/48#pullrequestreview-5007976065

Kein neuer konkreter Integrations-, Auth-, Security-, Truth- oder Scope-Defekt. Das Verdict ist **keine** Product-Owner-Freigabe für Mark Ready oder Merge.

## Nächster Schritt

Product-Owner-Entscheidung über Mark Ready / Merge von Draft-PR #48.  
STOPP. Kein AP-3. Kein Mark Ready. Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.

Am 24. August 2026, 12:59 UTC, setzte `Jetnity` PR #48 kurz auf Ready; um 13:00 UTC wieder auf Draft. Der aktuelle Stand ist Draft. Das kurze Ready ist keine Merge-Freigabe.
