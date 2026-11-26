#!/usr/bin/env node
// scripts/premium-redesign-a/tls-proxy.mjs
//
// Lokaler TLS-Vorsatz für die WebKit-Prüfung. Der Production-Build sendet
// `upgrade-insecure-requests`; Chromium nimmt Loopback davon aus, WebKit nicht und
// lädt dann kein Stylesheet und kein Skript über http://127.0.0.1. Die CSP wird nicht
// gelockert: der Build bleibt unverändert, nur der Prüfzugang läuft über HTTPS mit einem
// selbst signierten Zertifikat (der Treiber setzt dafür ignoreHTTPSErrors).
//
//   node scripts/premium-redesign-a/tls-proxy.mjs <Listen-Port> <Ziel-Port> <Zertifikatsordner>

import { createServer as httpsServer } from 'node:https'
import { request } from 'node:http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const [listen, ziel, ordner] = process.argv.slice(2)
if (!listen || !ziel || !ordner) {
  console.error('Aufruf: tls-proxy.mjs <Listen-Port> <Ziel-Port> <Zertifikatsordner>')
  process.exit(2)
}

httpsServer({ key: readFileSync(join(ordner, 'key.pem')), cert: readFileSync(join(ordner, 'cert.pem')) }, (anfrage, antwort) => {
  const weiter = request(
    { host: '127.0.0.1', port: Number(ziel), method: anfrage.method, path: anfrage.url, headers: anfrage.headers },
    (antwortVomZiel) => {
      antwort.writeHead(antwortVomZiel.statusCode ?? 502, antwortVomZiel.headers)
      antwortVomZiel.pipe(antwort)
    },
  )
  weiter.on('error', () => antwort.writeHead(502).end())
  anfrage.pipe(weiter)
}).listen(Number(listen), '127.0.0.1', () => console.log(`TLS-Vorsatz https://127.0.0.1:${listen} -> http://127.0.0.1:${ziel}`))
