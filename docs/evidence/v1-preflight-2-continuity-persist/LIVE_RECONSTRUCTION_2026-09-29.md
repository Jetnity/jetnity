# Preflight 2 continuity persist — live reconstruction

Stand: 29. September 2026  
Verification instant: 2026-09-28T23:47:37Z  
Reader: Jetnity V1 preflight 2 continuity persist, Generation 1

This file records the GitHub reads used for the 29 September checkpoint and Preflight 2 closure. It is not a launch gate and not a Production Supabase read.

## Main

`git fetch origin main` moved local `origin/main` from stale `6b267186` to:

`a9a8898ca2362b2ef86ccb1817a62eaa439c2d30`

`git rev-list --left-right --count origin/main...HEAD` at that moment: `0 1`. The one commit ahead was the task seed `587465047af750069187d484fde06866656d80ec`. No other main advance was present. Material writing was allowed.

## Post-merge CI

Run `36499178855`: completed, conclusion **success**, event `push`, head SHA `a9a8898ca2362b2ef86ccb1817a62eaa439c2d30`.

Jobs, both success:

- `Auth-Konfiguration gegen config.toml` (`109185713906`), completed 2026-09-28T23:40:19Z
- `Typecheck, Lint & Build` (`109185714363`), completed 2026-09-28T23:42:49Z

URL: https://github.com/Jetnity/jetnity/actions/runs/36499178855

## Post-merge Vercel

Commit status for `a9a8898c`: combined state **success**. Context `Vercel`, state success, description "Deployment has completed", updated 2026-09-28T23:40:17Z.

Inspector: https://vercel.com/jetnity-e1b93c82/jetnity-app/9EAtK55s6XSyAf2yLZgv17fkrQdw

Continuity id: `dpl_9EAtK55s6XSyAf2yLZgv17fkrQdw`

GitHub Deployment `6723050820`: environment Production, task deploy, SHA exact, created 2026-09-28T23:40:17Z. Status `18974134719`: state success, environment Production, target `https://jetnity-m82dp7s6y-jetnity-e1b93c82.vercel.app`, created 2026-09-28T23:40:18Z.

The public Vercel deployment page did not return domain/alias text. Alias attachment to `jetnity.com` is not claimed for this SHA.

## Exact-head confirmation

Run `36498483601`: success, event `pull_request`, head SHA `5b2cb44e500323e6a3573fb5709b6c7769afccc4`. Both Auth and Typecheck, Lint & Build succeeded.

Preview: GitHub Deployment `6722939513`, environment Preview, state success, 2026-09-28T23:32:16Z. Commit status target `https://vercel.com/jetnity-e1b93c82/jetnity-app/2RTuPAkn9iUUWcYQuLTYbizHFUHD`, which is `dpl_2RTuPAkn9iUUWcYQuLTYbizHFUHD`.

Review `5345955245` on that head is the Technical-Lead FINAL PASS. #622 review threads: empty.

## Issues and pull requests

#621 CLOSED. #622 MERGED. #624 OPEN as this persist.

#605–#620 parents/PRs re-read CLOSED or MERGED. Not redispatched.

Open issues at the read: #624, #294, #585, #395, #440, #236, #20.

Open pull requests: Draft #625 on this branch; historical drafts #52, #50, #40, #39, #28.

Latest comments, with no newer comment after them:

- #395 `5869751056` — KAYAK inquiry sent, waiting
- #294 `5875963553` — IATA form sent, waiting; prior `5875627554` is the Sherpa send
- #585 `5874769319` — PrivacyBee inquiry deferred

No provider was contacted from this session.
