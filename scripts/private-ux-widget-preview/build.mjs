// Creates a reviewable, preview-only static package. Does not deploy it.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const root = resolve(import.meta.dirname, '../..')
const output = process.argv[2]
if (!output) throw Error('An explicit output directory is required.')
const parent = 'https://jetnity-app-git-feat-private-travel-ux-3aad50-jetnity-e1b93c82.vercel.app'
await mkdir(output, { recursive: true })
for (const name of ['index.html', 'style.css', 'bootstrap.js']) await writeFile(resolve(output, name), await readFile(resolve(root, 'widgets/travelpayouts', name)))
await build({ entryPoints: [resolve(import.meta.dirname, 'entry.ts')], outfile: resolve(output, 'activities.js'), bundle: true, minify: true, platform: 'browser', target: 'es2022', tsconfig: resolve(root, 'tsconfig.json'), define: { 'process.env.NEXT_PUBLIC_ACTIVITIES_FRAME_ORIGIN': 'undefined' } })
const shell = '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aktivitäten</title><script defer src="/activities.js"></script></head><body><p>Aktivitäten werden nur nach dem Anzeigen in deiner Reise geladen.</p></body></html>'
for (const name of ['getyourguide.html', 'viator.html']) await writeFile(resolve(output, name), shell)
const config = JSON.parse(await readFile(resolve(root, 'widgets/travelpayouts/vercel.json'), 'utf8'))
const common = config.headers[0].headers.filter(h => h.key !== 'Content-Security-Policy')
const flight = config.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value.replace(/frame-ancestors [^;]+;/, `frame-ancestors ${parent};`)
// Keep provider-specific sandbox, script and frame restrictions from the existing
// response generators. Only static bootstrap and this exact preview parent differ.
const { embedAntwort } = await import('../../lib/activities/getyourguide/dokument.ts')
const { viatorEmbedAntwort } = await import('../../lib/activities/viator-widget/dokument.ts')
const headers = { 'sec-fetch-dest': 'iframe', 'sec-fetch-mode': 'navigate', 'sec-fetch-site': 'same-origin' }
const gyg = embedAntwort(new Request('https://example.com/embed/getyourguide?umfang=stadt&code=FR&name=Paris&anzahl=12', { headers })).headers.get('content-security-policy')
const viator = viatorEmbedAntwort(new Request('https://example.com/embed/viator?name=Paris', { headers })).headers.get('content-security-policy')
const policy = value => value.replace("frame-ancestors 'self'", `frame-ancestors ${parent}`).replace('script-src ', "script-src 'self' ")
config.headers = [{ source: '/(.*)', headers: common }, ...['/', '/index.html'].map(source => ({ source, headers: [{ key: 'Content-Security-Policy', value: flight }] })), ...[['/getyourguide.html', gyg], ['/viator.html', viator]].map(([source, value]) => ({ source, headers: [{ key: 'Content-Security-Policy', value: policy(value) }] }))]
await writeFile(resolve(output, 'vercel.json'), JSON.stringify(config, null, 2) + '\n')
console.log('Prepared static preview package; exact parent only; no deployment performed.')
