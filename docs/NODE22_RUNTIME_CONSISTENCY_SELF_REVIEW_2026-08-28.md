# Jetnity – Node 22 Runtime Consistency Self-Review

Stand: 28. August 2026  
Autor-Agent: **`Cursor-Agent: Jetnity runtime consistency 1`**  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: `docs/NODE22_RUNTIME_CONSISTENCY_TASK_2026-08-28.md` auf Draft-PR #147 / Branch `ops/node22-runtime-consistency-2026-08-28`.

Baseline: `main @ 4ec83f36426c636443d43692d6875e92e9e3b54a`.

Geprüft gegen den tatsächlichen Dateisatz: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, ADR-0188, Status/Handoff, `docs/ACTIVE_WORK_STATUS.md`.

Keine Änderung an `app/`, `components/`, `lib/`-Produktcode, `supabase/`, Auth-Config, Vercel-Projektsettings, Branch Protection, AP-7-S2, Provider- oder Trip-Workspace-Runtime.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Bleibt der Engine-Range breit genug für Node 24? | Nein. `engines.node` ist `22.x`. |
| Wurde das Lockfile per Hand an beliebigen Dependency-Records editiert? | Nein. `npm install --package-lock-only --ignore-scripts`. Diff nur Root-engines, `@types/node` und das von npm gezogene `undici-types`. |
| Bleiben Node-24-Typen Current Truth? | Nein. `@types/node` ist `22.20.1`. |
| Wurde CI unnötig angefasst? | Nein. Beide Jobs waren und bleiben `22.x`. |
| Wurden Vercel-Settings mutiert? | Nein. |
| Gibt es Application-/Provider-/TW-/AP-7-S2-Drift? | Nein. |
| Unrelated Dependency-Upgrades? | Nein. |
| Ready/Merge durch den Autor? | Nein. STOPP für unabhängigen TL-Review. |

## 3. Validierung

Lokal ausgeführt auf Head `3fb2f3c8` (vor diesem Stamp). Dieser Stamp ändert keine Runtime-Dateien. Node lokal: `v22.14.0`. npm: `10.9.7`.

| Command | Result |
| --- | --- |
| `npm ci` | **PASS** – lockfile-reproducible install, 508 packages audited |
| `npm run typecheck` | **PASS** – `tsc --noEmit` exit 0 |
| `npm run lint` | **PASS** – `No ESLint warnings or errors` |
| `npm test` | **PASS** – 2457/2457, 0 fail, 0 skipped |
| `npm run build` | **PASS** – `next build` compiled successfully; setup warning only because no `.env/.local` in this environment |

Bekannte, vorbestehende Build-Hinweise: Supabase Edge-Runtime `process.version(s)`-Warnung, veraltete Browserslist-Daten. Keine neuen durch diesen Slice.

Local gates do not replace Exact-Head CI or Vercel Preview.

## 4. Risiken, die bleiben

- Ob Vercel die Override-Warnung tatsächlich verliert, ist nur live am Preview/Production-Deployment beweisbar.
- `22.x` erlaubt Patch-/Minor-Bewegung innerhalb von Node 22.
- `main` `protected=false`.
- Dieses Self-Review erzeugt keinen PASS. Jeder neue Push invalidiert Prior-Evidence.

## 5. Urteil des Autors

Der Slice hält den Auftrag: ein reproduzierbarer Node-22.x-Vertrag, minimale Lockfile-/Typen-Ausrichtung, keine Produkt- oder Infrastrukturmutation.

**Unabhängiger Technical-Lead Exact-Head-Review: ausstehend. Dieses Self-Review ersetzt ihn nicht und ist kein PASS.**
