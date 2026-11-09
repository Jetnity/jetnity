import { readFile, writeFile, rename, rm } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { archivErstellen, archivLesen } from '../../lib/providers/omio/archiv'
const quelle = 'data/omio/ch.json',
  ziel = 'data/omio/ch.katalog'
async function archivieren() {
  const bytes = await readFile(quelle)
  const key = process.env.OMIO_KATALOG_SCHLUESSEL
  const archiv = archivErstellen(bytes, key)
  if (JSON.stringify(archivLesen(archiv, key)) !== JSON.stringify(JSON.parse(bytes.toString('utf8'))))
    throw Error('Katalogprüfung fehlgeschlagen')
  const tmp = ziel + '.' + randomUUID() + '.tmp'
  try {
    await writeFile(tmp, archiv, { flag: 'wx', mode: 0o600 })
    await rename(tmp, ziel)
  } finally {
    await rm(tmp, { force: true })
  }
}
archivieren().catch((e) => {
  console.error(e.message)
  process.exitCode = 1
})
