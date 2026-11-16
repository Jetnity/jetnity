# Admin Dev Auth and acceptance completion — 15 November 2026

## Authorization and current evidence

Sasa explicitly asks to fix the Auth redirect CI failure and protected Preview access, then finish #1199, #1200, #1201, #1203 and #1204 in that order with green CI. Necessary Development work is authorized without another question. Production, merges, new costs and login/2FA remain with Sasa. #1202 remains HOLD until #1197 is merged. #1196–#1198 and every currently changed path in those PRs remain outside this lane. Real-money refund processing remains disabled pending separate approval.

Current main is `63544e820e912bd275556588c956a09b99b1cf90`. #1199 starts at `1cd49ada9c46ed9e9dcdfd627a9c11ba018ce257`. Fresh protected-path counts are 102 / 392 / 98, with #1197 at `70a3cb09204e74f6bcd4a5b481e942e526a6102f`.

The five package Auth jobs report only `uri_allow_list`. The #1197 Auth job 132736086443 in run 43689220907 passed all 56 expected values / 244 observed keys on 15 November, 07:17:14 UTC. Its checked-in Dev configuration and Owner handoff record one already-approved additional password-reset URL. We must preserve that active entry-lane URL and must not copy live values into the expected configuration.

## Bounded implementation

- Add a pure, explicit Development redirect contract under `lib/supabase/auth-dev-konfiguration.ts`, scoped to `yfvbxvijcorffwxbxahl`.
- Accept exactly the historic raw callback list or the already-integrated two-address list in its recorded order. Compose exactly the integrated list; reject missing, extra, duplicate, reordered or broadened addresses and any foreign/Production target.
- Apply this expected configuration in `scripts/auth/pruefen.ts` after the existing remote branch identity guard. Preserve all 56 checks, unknown-key classification, enabled-provider/hook guards, password requirements and nonzero failure exit.
- Make provenance visible in the report. Do not weaken, skip or mask any drift comparison.
- Protect `scripts/auth/anwenden.ts` before subprocess/PATCH: the old raw TOML must not be pushed because it would remove the active entry-lane redirect. Only the exact already-integrated TOML may proceed through the existing write mechanism.
- Add focused pure and real CLI-entry tests with isolated synthetic transport. No live Auth write is necessary for this correction.
- Version the implementation/handoff and carry the identical bounded correction into the other four authorized package branches. Complete their independent gates in the requested order; no merge.

Reserved `supabase/config.toml`, `docs/AUTH.md`, existing `lib/supabase/auth-erwartung.test.ts`, workflows, package/lockfiles and shared entry guards are not edited. New companion tests are separate files. No database, RLS, role, provider, paid resource, production, real-money or session/AAL2 change is part of this fix.

## Preview acceptance

Use the existing own branch Preview and ordinary authenticated Vercel access. Distinguish Deployment Protection from Jetnity's expected anonymous API 401. Public /admin/login and /login, plus a protected-page redirect to login, establish transport only. Do not call an expected anonymous denial a successful authenticated acceptance, and do not lower protection or synthesize an Owner/AAL2 identity. Reuse a legitimate existing session only where it is already available; otherwise leave the exact login/2FA acceptance step to Sasa and continue the remaining work.

## Verification

Run all affected Auth/config/target tests together, collect every failure before correcting, and perform a separate source review. Cover legacy and integrated configs, immutability, exact escaping, every rejected address/target case, retained non-redirect drift, and zero writer subprocess/PATCH calls when raw configuration is stale. Verify TypeScript, focused lint and applicable static gates. Every published package head receives the normal complete CI; inspect all nine final job logs rather than retrying a convenient subset.

## Follow-on scope

After these packages, prioritize translations and persisted settings, then CMS, then Marketing. Inspect existing storage and protected-path/BG1 contracts first. No claim of full localization, CMS, Marketing or whole-system launch is made by this Auth repair.

The entry display continues to require visa, ETA, passport validity, vaccinations, health, forms with costs and scam warnings, fees, onward ticket, transit, children, customs, special cases, source/date, notice and official link, visible from the start. Unconfirmed information must say “derzeit nicht verfügbar”. Implementation in #1196–#1198 remains with its owner lane.

