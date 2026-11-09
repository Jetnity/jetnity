import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'

const kennung = Buffer.from('OMIO-CH-1\n')
function schluessel(wert: string | undefined) {
  if (!wert || !/^[a-f\d]{64}$/i.test(wert)) throw Error('Omio-Katalogschlüssel fehlt oder ist ungültig')
  return Buffer.from(wert, 'hex')
}

/** The public repository holds only the authenticated, compressed catalog artifact. */
export function archivErstellen(daten: Buffer, key: string | undefined): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', schluessel(key), iv)
  cipher.setAAD(kennung)
  const text = Buffer.concat([cipher.update(gzipSync(daten)), cipher.final()])
  return Buffer.concat([kennung, iv, cipher.getAuthTag(), text])
}
export function archivLesen(daten: Buffer, key: string | undefined): unknown {
  const n = kennung.length
  if (!daten.subarray(0, n).equals(kennung) || daten.length < n + 29)
    throw Error('Unbekanntes Omio-Katalogformat')
  const decipher = createDecipheriv('aes-256-gcm', schluessel(key), daten.subarray(n, n + 12))
  decipher.setAAD(kennung)
  decipher.setAuthTag(daten.subarray(n + 12, n + 28))
  const klar = Buffer.concat([decipher.update(daten.subarray(n + 28)), decipher.final()])
  return JSON.parse(gunzipSync(klar, { maxOutputLength: 16_000_000 }).toString('utf8'))
}
