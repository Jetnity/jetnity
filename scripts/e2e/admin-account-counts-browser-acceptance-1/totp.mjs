#!/usr/bin/env node
// RFC 6238 TOTP (SHA-1, 30s, 6 digits). Secret stays in memory only.

import { createHmac } from 'node:crypto'

function decodeBase32(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = String(secret).toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const char of cleaned) {
    const value = alphabet.indexOf(char)
    if (value < 0) throw new Error('Invalid TOTP secret encoding')
    bits += value.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

export function generateTotp(secret, { now = Date.now(), stepSeconds = 30, digits = 6 } = {}) {
  const key = decodeBase32(secret)
  const counter = Math.floor(now / 1000 / stepSeconds)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(code % 10 ** digits).padStart(digits, '0')
}

export function looksLikeTotpCode(value) {
  return /^\d{6}$/.test(String(value))
}
