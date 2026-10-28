# UX V1 U1-A — STATUS

28 October 2026. Cursor Generation 1, same session, R1 correction. Stop for Technical Lead R2. Not Ready. Not merged.

Rejected head `7c510c3622488b69fc3d1a1abf397ceff821a5d2` failed native App CI on the unedited guest-nav large-text case. This correction changes button layout only, removes the shell width mutation, and drops the public PNG blobs. `docs/evidence/ux-v1-u1a-shell-1/report.json` field `gitHeadAtMeasurement` is that rejected head because the audit ran on the uncommitted fix. It is not the new head.

## Session

- Name: Jetnity UX V1 Compact Shell and Tabs 1 — Cursor Generation 1
- `originalModelName`: `grok-4.7-high-fast`
- https://cursor.com/agents/bc-868ef9e8-284a-490a-8473-73b3dd0bcd6e
- bcId: `bc-868ef9e8-284a-490a-8473-73b3dd0bcd6e`
- Branch: `feat/ux-v1-u1a-shell-density-1`
- Mode: `NORMAL`
- Pre-code plan comment: https://github.com/Jetnity/jetnity/pull/1070#issuecomment-6457950460

## Baseline before this implementation

- HEAD `bcd4cb9d3bd442eaf9eade38b2ba729570183170`
- Tree `8aacc82922bcc95950547d9be123e1bc1d24fc25`
- Parents: TASK seed `ccdb5a4bc3ad7391ff463ac4f34716355c374d83` + main `7ee00c69d38553c5a5778945ba3db3aea6361dd8`
- merge-base = main. The evidence file `report.json` still records short SHA `bcd4cb9d` because the audit read `git rev-parse` before this commit. The implementation head is the commit that adds this status.

## Done in this slice

Compact header, four labeled modes, phone bottom bar, in-flow wrap at 320px / root 32px / page scale 2 / scripted keyboard, sticky tabs from 768px, overview spacing only. No U1-B, no U3-B edits, no provider, no SQL.

## Not claimed

Native App/Auth CI on the new head, Vercel Preview on the new head, physical device, OS keyboard, non-zero safe-area inset, Work Production acceptance, Ready, merge.
