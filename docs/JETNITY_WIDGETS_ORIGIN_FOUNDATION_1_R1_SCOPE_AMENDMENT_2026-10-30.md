# Jetnity Widgets Origin Foundation 1 — TL R1 narrow scope amendment

**Stand:** 30.10.2026 Europe/Zurich. **Authority:** ChatGPT Technical Lead, under normal owner-delegated technical integration authority. **Tracking:** https://github.com/Jetnity/jetnity/pull/1091 and https://github.com/Jetnity/jetnity/issues/1090.

## Exact reason and provenance

Original Cursor Generation 1 session `bc-fd77a5a3-17dd-4479-9594-f6238f61583f` delivered fail-closed 24-file host foundation on exact head `698b9aba361f7dff36e05a77b7b6e7c7120140ea`. Native CI40964105154, 7,640 tests / zero failure, and root Preview READY. Author itself disclosed a reproducible separate issue: after local `apps/widgets-host/npm run build`, **root `npm run lint` traverses generated nested `apps/widgets-host/.next/**`**, because original flat config ignores only `.next/**`. These are generated files, not user source. This could make subsequent local or CI runs unexpectedly fail, despite green original CI that does not build nested first.

Independent TL R1 CHANGES REQUIRED was posted https://github.com/Jetnity/jetnity/pull/1091#issuecomment-6510482707; original Cursor acknowledged https://github.com/Jetnity/jetnity/pull/1091#issuecomment-6510483987 but had not published an updated head at TL read on 30.10.2026 ~00:55 Europe/Zurich. To unblock straightforward build hygiene, TL explicitly takes ownership of **this single minimal correction**. This is a TL patch, NOT attributed to the original Cursor. No new Cursor generation or parallel feature writer created.

## Single exception to original immutable Task V1

In existing root `eslint.config.mjs`, inside `globalIgnores`, append precisely `'**/.next/**'` alongside existing `.next/**`. The change ignores **nested Next-generated artifacts only**, not `apps/widgets-host/**` or any other source/test directory. No lint rule severity, compiler, dependencies, package.json, workflows, Supabase, provider or CSS changes.

Original immutable `docs/JETNITY_WIDGETS_ORIGIN_FOUNDATION_1_TASK_V1_2026-10-29.md` must remain byte-exact. This task-owned amendment is additional evidence only. The original source code continues to deny every URL and both provider routes with HTTP404 and no thirdparty script, auth, cookie or CDN calls. `widgets.jetnity.com` remains without Infomaniak DNS, no Vercel Git link/deployment/ENV; main `jetnity-app` is separate.

## Acceptance for next Head

Independent source diff review confirming exactly one root ignore entry, no `apps/**` wildcard; test nested build then root lint with unremoved `.next` (if an isolated execution environment is available; otherwise honestly label it unverified); full native GitHub CI and exact SHA Preview; compare with protected main, semantic safety, no changed special gate. Old CI on `698b9aba` is historical only. Because protected main advanced to `8e667661b490758b25bdd5be720421cea33fda9c` by PR #1089, re-check mergeability and include that foundation when merging PR #1091. Do not force-push/merge blindly; root-only TL decides.

**No Ready or Merge from Cursor.** No activation of provider, GTM, PrivacyBee CMP, DNS, Auth, RLS, or new costs authorized here.
