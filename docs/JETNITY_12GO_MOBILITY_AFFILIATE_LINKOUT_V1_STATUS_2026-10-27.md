# 12Go Mobility Affiliate Linkout V1 — STATUS

**27 October 2026. Same Generation 1 session** `bc-c5928faa-840d-41e3-a855-39c560b49754`.  
Model `grok-4.7-high-fast`. Draft PR #1057. No Ready, no merge, no follow-up slice.

## Code

- Feature commit `a7f8a724cffabef6649157e12b67808f70c01f13`
- Proof/export commit `984938b97f75401ba4e0e728456a07468ce49311`
- Base at start: main `d698ee9e3e365b09295effc1db5a4f9db165eec8`, mode NORMAL
- Production audited route list is empty. Adjacent pairs use `https://12go.asia/?z=17323861&sub_id=jetnity-mobility-route`

## Verified here

- `node --test` on `lib/providers/twelve-go/affiliate/*.test.ts`: 21 pass, 0 fail
- `npm run typecheck`: pass
- `npm run build`: pass (setup warning: no local `.env`; compile and 26 static pages succeeded)
- `check:dead`: 0 unwarranted orphans
- `check:exports`: 0 unwarranted unused exports after the internal-constant fix
- `check:api-schutz`, `check:deps`, `check:schema-bezug`: exit 0. Schema notes about other LOCAL/UNAPPLIED RPCs are pre-existing and not this slice
- ESLint on the new files: clean. Pre-existing warning remains in `MobilitaetBereich.tsx` for `UNTERBEREICHE`
- Local Chrome proof `scripts/twelve-go-affiliate-linkout-1/nachweis.ts`: exit 0. Viewports 320/390/768/1440 and root 32px. Link height at least 44. Keyboard focus on the anchor. Zero requests to `12go.asia` before a click. Dated transfer renders `Geplant am 15. Nov.` and does not put `2026-11-15` or `CHF` into the URL. No click to 12Go.

## Not verified here

- Native GitHub CI/Auth and the exact Vercel Preview for this head. They start on push. A green preview does not prove attribution, date, currency, passengers, or availability.
- A real browser landing on 12Go. That remains Work QA, without purchase.
- Full `npm test` (thousands of existing tests) was not re-run locally.

## Stop line

Route deep link for Bangkok → Koh Chang is intentionally not shipped. Koh Chang has no canonical Jetnity place ID in this tree, and stages do not carry a source-verified place kind. Do not fill `TWELVE_GO_GEPRUEFTE_ROUTEN` from the example slug.
