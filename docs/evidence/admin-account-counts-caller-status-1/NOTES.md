# Admin account counts caller status 1 — evidence notes

- Session `bc-4bf98f13-10aa-4cff-af82-dee79ebc920c`, model `cursor-grok-4.6-high-fast`.
- New candidate SHA-256 `612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de`.
- New 16.15 functiondef SHA-256 `b9cec2b3cad0052688f5f396cfd1d532d4035bd1d51254723c1d650dc0d1048b` from a clean disposable install.
- Historical #555 hashes remain recorded and are refused.
- Local PostgreSQL 16.15 package was installed because proof binaries were missing. Apt created unused system `16/main`; proofs used private sockets only.
- Invalidated freeze `0e7cebe6`: CI `35852662043` Typecheck/Lint/Build FAILED (2 effective-target tests). Auth/Preview on that head do not transfer.
- Harness repair `1f38a968`: existing delivery SSR stub returns active own-status for `harness-user`; local-positive expects 2 creates / 2 cookie reads / 1 RPC. Runtime OFF remains zero transport.
- No hosted query, grant, apply, secret or live account access.
- No Browser / MFA / hosted-parity PASS.
- Closed #556 was merged on exact main `4381d20` and then C1-merged once into this branch (`90c943d`). Later main drift was not consumed.
- After that merge, only incoming `constants.mjs` and `test.mjs` were edited for the executable source re-pin. Other #556 helper/README/docs/evidence files stayed read-only. Historical #556 receipts were not rewritten.
- Executable source baseline remains `9cf7aedd` (unchanged producer/reader/caller-status bytes). Integration baseline is `4381d20`. Historical product snapshot `f0237baf` stays historical.
- Old permissive producer `dcf4d35d…` / blob `63974e65…` and old reader `02dcafd8…` are refused. New caller-status blob `b820c799…` is in SOURCE_PATHS + BLOB_PINS.
