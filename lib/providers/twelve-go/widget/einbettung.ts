// lib/providers/twelve-go/widget/einbettung.ts
//
// Jede Anfrage an die Einbettungsroute endet hier. Argumente gibt es nicht,
// damit Query, Cookie und Post keinen Zweig öffnen.

const KOEPFE = {
  'cache-control': 'no-store',
  'content-security-policy':
    "default-src 'none'; script-src 'none'; frame-src 'none'; connect-src 'none'; img-src 'none'; style-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  'content-type': 'text/plain; charset=utf-8',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-dns-prefetch-control': 'off',
  'x-frame-options': 'DENY',
  'x-robots-tag': 'noindex, nofollow',
} as const

const TEXT = 'Not found\n'

export function twelveGoEmbedVerweigern(): Response {
  return new Response(TEXT, { status: 404, headers: KOEPFE })
}
