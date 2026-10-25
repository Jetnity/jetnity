import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import type { Leseantwort } from '@/lib/api/datenbank-lesen'
import { cursorCodieren, sammlungAnfrageAus, suchOder, ungueltigeAdresse } from '@/lib/trips/reisen-sammlung-abfrage'
import { reisenSammlungAusParametern, reisenSammlungLaden, type SammlungKette } from '@/lib/trips/reisen-sammlung-daten'
import { UEBERSICHT_SPALTEN, type UebersichtZeile } from '@/lib/trips/reisen-uebersicht'

const hier = dirname(fileURLToPath(import.meta.url))
const ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

function kennung(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

function zeitAusSekunden(sekunden: number, mikro = 0): string {
  const stunde = Math.floor(sekunden / 3600)
  const minute = Math.floor((sekunden % 3600) / 60)
  const sekunde = sekunden % 60
  const teile = [stunde, minute, sekunde].map((wert) => String(wert).padStart(2, '0'))
  return `2026-06-01T${teile[0]}:${teile[1]}:${teile[2]}.${String(mikro).padStart(6, '0')}Z`
}

function zeile(id: string, updated: string, status = 'planned'): UebersichtZeile {
  return {
    id,
    title: 'Reise',
    origin: 'Zürich',
    start_date: null,
    end_date: null,
    travellers: 1,
    currency: 'CHF',
    budget_amount: null,
    status,
    updated_at: updated,
    metadata: null,
    trip_stages: [],
    trip_days: [{ count: 1 }],
    trip_items: [{ count: 2 }],
  }
}

function bestand(): UebersichtZeile[] {
  const zeilen = [
    zeile(kennung(250), '2026-12-31T23:59:59.000002Z'),
    zeile(kennung(249), '2026-12-31T23:59:59.000001Z'),
    zeile(kennung(248), '2026-12-31T23:59:58.000000Z'),
    zeile(kennung(247), '2026-12-31T23:59:58.000000Z'),
    zeile(kennung(246), '2026-12-31T23:59:58.000000Z'),
  ]
  for (let n = 245; n >= 0; n -= 1) zeilen.push(zeile(kennung(n), zeitAusSekunden(n)))
  return zeilen
}

function entzitiere(wert: string): string | null {
  if (!wert.startsWith('"') || !wert.endsWith('"')) return null
  return wert.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

function keysetAus(text: string): { zeit: string; id: string } | null {
  const teile = text.match(/^updated_at\.lt\.("(?:\\.|[^"\\])*"),and\(updated_at\.eq\.("(?:\\.|[^"\\])*"),id\.lt\.("(?:\\.|[^"\\])*")\)$/)
  if (!teile) return null
  const zeit = entzitiere(teile[1] ?? '')
  const gleich = entzitiere(teile[2] ?? '')
  const id = entzitiere(teile[3] ?? '')
  if (!zeit || zeit !== gleich || !id) return null
  return { zeit, id }
}

function client(zeilen: UebersichtZeile[], antwort?: Leseantwort<UebersichtZeile>) {
  const aufrufe: { name: string; args: unknown[] }[] = []
  const erzeugt = {
    aufrufe,
    from(tabelle: 'trips'): SammlungKette {
      aufrufe.push({ name: 'from', args: [tabelle] })
      const lokal: { name: string; args: unknown[] }[] = []
      const api = {
        select(spalten: string) {
          lokal.push({ name: 'select', args: [spalten] })
          aufrufe.push({ name: 'select', args: [spalten] })
          return api
        },
        eq(spalte: string, wert: string) {
          lokal.push({ name: 'eq', args: [spalte, wert] })
          aufrufe.push({ name: 'eq', args: [spalte, wert] })
          return api
        },
        neq(spalte: string, wert: string) {
          lokal.push({ name: 'neq', args: [spalte, wert] })
          aufrufe.push({ name: 'neq', args: [spalte, wert] })
          return api
        },
        or(filter: string) {
          lokal.push({ name: 'or', args: [filter] })
          aufrufe.push({ name: 'or', args: [filter] })
          return api
        },
        order(spalte: string, optionen: { ascending: boolean }) {
          lokal.push({ name: 'order', args: [spalte, optionen] })
          aufrufe.push({ name: 'order', args: [spalte, optionen] })
          return api
        },
        limit(anzahl: number) {
          lokal.push({ name: 'limit', args: [anzahl] })
          aufrufe.push({ name: 'limit', args: [anzahl] })
          return api
        },
        then(loesen: (wert: Leseantwort<UebersichtZeile>) => void, scheitern?: (fehler: unknown) => void) {
          try {
            if (antwort) {
              loesen(antwort)
              return
            }
            let liste = zeilen.slice()
            for (const aufruf of lokal) {
              if (aufruf.name === 'eq' && aufruf.args[0] === 'status') liste = liste.filter((eintrag) => eintrag.status === aufruf.args[1])
              if (aufruf.name === 'neq' && aufruf.args[0] === 'status') liste = liste.filter((eintrag) => eintrag.status !== aufruf.args[1])
              if (aufruf.name === 'or' && String(aufruf.args[0]).startsWith('updated_at.lt.')) {
                const keyset = keysetAus(String(aufruf.args[0]))
                assert.ok(keyset)
                liste = liste.filter((eintrag) => eintrag.updated_at < keyset.zeit || (eintrag.updated_at === keyset.zeit && eintrag.id < keyset.id))
              }
            }
            liste.sort((a, b) => (a.updated_at === b.updated_at ? (a.id < b.id ? 1 : -1) : a.updated_at < b.updated_at ? 1 : -1))
            const grenze = lokal.find((aufruf) => aufruf.name === 'limit')
            const anzahl = Number(grenze?.args[0] ?? liste.length)
            loesen({ data: liste.slice(0, anzahl), error: null, status: 200 })
          } catch (fehler) {
            scheitern?.(fehler)
          }
        },
      }
      return api as SammlungKette
    },
  }
  return erzeugt
}

describe('Sammlung liest 49 und zeigt 48', () => {
  test('251 Zeilen erscheinen genau einmal in der Schlüsselreihenfolge', async () => {
    const fixture = bestand()
    assert.equal(fixture.length, 251)
    const zugang = client(fixture)
    const gesehen: string[] = []
    let cursor: string | undefined
    let seiten = 0
    while (seiten < 8) {
      const anfrage = sammlungAnfrageAus({ cursor })
      assert.equal(anfrage.ok, true)
      if (!anfrage.ok) break
      const ergebnis = await reisenSammlungLaden(anfrage, zugang)
      assert.equal(ergebnis.problem, null)
      const ids = ergebnis.zeilen.map((eintrag) => eintrag.id)
      assert.ok(ids.length <= 48)
      if (ergebnis.hatWeiter) assert.equal(ids.length, 48)
      gesehen.push(...ids)
      seiten += 1
      if (!ergebnis.hatWeiter) break
      assert.ok(ergebnis.naechsterCursor)
      cursor = ergebnis.naechsterCursor ?? undefined
    }
    assert.deepEqual(gesehen, fixture.map((eintrag) => eintrag.id))
    assert.equal(gesehen.length, 251)
    const limits = zugang.aufrufe.filter((aufruf) => aufruf.name === 'limit').map((aufruf) => aufruf.args[0])
    assert.deepEqual(limits, [49, 49, 49, 49, 49, 49])
    assert.equal(zugang.aufrufe.filter((aufruf) => aufruf.name === 'from').length, 6)
    assert.equal(zugang.aufrufe.some((aufruf) => aufruf.name === 'select' && aufruf.args[0] !== UEBERSICHT_SPALTEN), false)
  })

  test('leere Seiten und die Vorschauzeile bleiben ehrlich', async () => {
    const leer = client([])
    const erste = await reisenSammlungAusParametern({}, leer)
    assert.deepEqual(erste.zeilen, [])
    assert.equal(erste.hatWeiter, false)
    assert.equal(leer.aufrufe.filter((aufruf) => aufruf.name === 'from').length, 1)
    const cursor = cursorCodieren({
      q: '',
      archiv: 'alle',
      zeit: '0001-01-01T00:00:00Z',
      id: '00000000-0000-4000-8000-000000000000',
    })
    const zugang = client(bestand())
    const fortsetzung = await reisenSammlungAusParametern({ cursor: cursor ?? '' }, zugang)
    assert.deepEqual(fortsetzung.zeilen, [])
    assert.equal(fortsetzung.hatWeiter, false)
    const schmal = client(bestand().slice(0, 49))
    const seite = await reisenSammlungAusParametern({}, schmal)
    assert.equal(seite.zeilen.length, 48)
    assert.equal(seite.zeilen.some((eintrag) => eintrag.id === bestand()[48]?.id), false)
    assert.equal(seite.hatWeiter, true)
  })

  test('ungültige Adressen rufen die Tabelle nicht auf', async () => {
    const faelle: Record<string, string | string[] | undefined>[] = [
      { cursor: 'a'.repeat(627) },
      { cursor: '!!!' },
      { q: ['a', 'b'] },
      { archiv: 'archived' },
      { q: 'a'.repeat(121) },
      { q: '\u0000' },
      { cursor: cursorCodieren({ q: 'a', archiv: 'alle', zeit: '2026-02-29T00:00:00Z', id: ID }) ?? 'x' },
      { cursor: cursorCodieren({ q: '', archiv: 'alle', zeit: '2026-01-01T00:00:00Z', id: 'FFFFFFFF-ffff-ffff-ffff-ffffffffffff' }) ?? 'x' },
    ]
    for (const parameter of faelle) {
      const zugang = client(bestand())
      const ergebnis = await reisenSammlungAusParametern(parameter, zugang)
      assert.equal(ergebnis.ungueltig, true)
      assert.equal(ergebnis.problem, null)
      assert.deepEqual(ergebnis.zeilen, [])
      assert.equal(ergebnis.adresse, ungueltigeAdresse(parameter))
      assert.equal(zugang.aufrufe.filter((aufruf) => aufruf.name === 'from').length, 0)
    }
  })

  test('gibt die Suchzeichenfolge weiter und trennt den Lesefehler', async () => {
    const zugang = client(bestand())
    await reisenSammlungAusParametern({ q: '100%', archiv: 'offen' }, zugang)
    assert.equal(zugang.aufrufe.some((aufruf) => aufruf.name === 'or' && aufruf.args[0] === suchOder('100%')), true)
    assert.equal(zugang.aufrufe.some((aufruf) => aufruf.name === 'neq' && aufruf.args[1] === 'archived'), true)
    const fehler = client([], { data: null, error: { message: 'db' }, status: 500 })
    const ergebnis = await reisenSammlungAusParametern({}, fehler)
    assert.equal(ergebnis.problem?.status, 500)
    assert.deepEqual(ergebnis.zeilen, [])
    assert.equal(ergebnis.ungueltig, false)
  })

  test('die Seite benutzt die Sammlung und nicht die 200er-Liste', () => {
    const seite = readFileSync(join(hier, '../../app/(public)/reisen/page.tsx'), 'utf8')
    const leser = readFileSync(join(hier, 'reisen-sammlung-daten.ts'), 'utf8')
    assert.match(seite, /reisenSammlungAusParametern/)
    assert.equal(seite.includes('reisenLaden'), false)
    assert.equal(seite.includes('prefetch'), false)
    assert.match(leser, /REISEN_SAMMLUNG_ABRUF/)
    assert.match(leser, /createServerComponentClient/)
    assert.equal(leser.includes('createServiceRole'), false)
    assert.equal(leser.includes("eq('user_id'"), false)
    const sammlung = readFileSync(join(hier, '../../components/trips/MyTripsCollection.tsx'), 'utf8')
    const navigation = readFileSync(join(hier, '../../components/trips/useMyTripsCollectionNavigation.ts'), 'utf8')
    assert.equal(sammlung.includes('next/link'), false)
    assert.equal(sammlung.includes('.prefetch('), false)
    assert.equal(navigation.includes('.prefetch('), false)
    assert.match(navigation, /vorherigeAdresse/)
  })
})
