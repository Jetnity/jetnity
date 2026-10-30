import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from '@/app/embed/twelve-go/route'
import { twelveGoEmbedVerweigern } from '@/lib/providers/twelve-go/widget/einbettung'

const METHODEN = [GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS] as const

function anfrage(methode: string, suche: string): Request {
  return new Request(`https://jetnity.example/embed/twelve-go${suche}`, {
    method: methode,
    headers: {
      cookie: 'session=forged',
      origin: 'https://evil.example',
      'content-type': 'application/json',
    },
    body: methode === 'GET' || methode === 'HEAD' ? undefined : '{"consent":1,"enabled":true}',
  })
}

describe('12Go-Einbettung verweigert', () => {
  test('Query, Cookie und Körper bleiben ohne Anbieterantwort', async () => {
    for (const methode of METHODEN) {
      const name = methode.name
      const antwort = methode(anfrage(name, '?consent=1&enabled=true'))
      const text = await antwort.text()
      assert.equal(antwort.status, 404)
      assert.equal(text.includes('trainbusferry'), false)
      assert.equal(text.includes('12go'), false)
      assert.equal(text.includes('<script'), false)
      assert.equal(text.includes('<iframe'), false)
      const policy = antwort.headers.get('content-security-policy') ?? ''
      assert.equal(policy.includes("script-src 'none'"), true)
      assert.equal(policy.includes('https:'), false)
      assert.equal(antwort.headers.get('x-frame-options'), 'DENY')
      assert.equal(antwort.headers.get('cache-control'), 'no-store')
    }
    const direkt = twelveGoEmbedVerweigern()
    assert.equal(direkt.status, 404)
    assert.equal(await direkt.text(), 'Not found\n')
  })
})
