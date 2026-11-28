// lib/trips/datum-anzeige.test.ts
//
// Display-only UTC date-only labels. Stored ISO dates stay unchanged.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  datumKurz,
  datumMitJahr,
  datumMitWochentag,
  etappenZeitraumAnzeigen,
  mitSatzpunkt,
  zeitraumKurz,
} from '@/lib/trips/datum-anzeige'

describe('etappenZeitraumAnzeigen', () => {
  test('localizes a same-year range without inventing a year', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', '2026-10-16'), '12. Okt. – 16. Okt.')
  })

  test('keeps the year on a cross-year range', () => {
    assert.equal(
      etappenZeitraumAnzeigen('2026-12-28', '2027-01-03'),
      '28. Dez. 2026 – 03. Jan. 2027',
    )
  })

  test('same-day keeps a single dated label', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', '2026-10-12'), '12. Okt. 2026')
  })

  test('one arrival endpoint stays dated and does not invent departure', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', null), 'Ankunft 12. Okt. 2026')
  })

  test('one departure endpoint stays dated and does not invent arrival', () => {
    assert.equal(etappenZeitraumAnzeigen(null, '2026-10-16'), 'Abreise 16. Okt. 2026')
  })

  test('absent endpoints stay empty so the caller keeps its copy', () => {
    assert.equal(etappenZeitraumAnzeigen(null, null), null)
    assert.equal(etappenZeitraumAnzeigen('', ''), null)
  })

  test('invalid values are not shown as raw ISO', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-99-99', 'nicht-datum'), null)
    assert.equal(etappenZeitraumAnzeigen('2026-10-12T18:00:00Z', 'nicht-datum'), null)
    assert.equal(etappenZeitraumAnzeigen('2026-10-12T18:00:00Z', '2026-10-16'), 'Abreise 16. Okt. 2026')
  })

  test('impossible calendar days are not normalized into a real date', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-02-29', null), null)
    assert.equal(etappenZeitraumAnzeigen('2026-02-30', null), null)
    assert.equal(etappenZeitraumAnzeigen('2026-04-31', null), null)
    assert.equal(etappenZeitraumAnzeigen('2026-02-29', '2026-02-30'), null)
  })

  test('a valid leap day remains visible', () => {
    assert.equal(etappenZeitraumAnzeigen('2024-02-29', null), 'Ankunft 29. Feb. 2024')
    assert.equal(etappenZeitraumAnzeigen('2024-02-29', '2024-03-01'), '29. Feb. – 01. März')
  })

  test('one valid endpoint with one impossible day keeps only the valid side', () => {
    assert.equal(etappenZeitraumAnzeigen('2026-10-12', '2026-02-30'), 'Ankunft 12. Okt. 2026')
    assert.equal(etappenZeitraumAnzeigen('2026-02-29', '2026-10-16'), 'Abreise 16. Okt. 2026')
    const ankunft = '2026-02-29'
    const abreise = '2026-10-16'
    assert.equal(etappenZeitraumAnzeigen(ankunft, abreise), 'Abreise 16. Okt. 2026')
    assert.equal(ankunft, '2026-02-29')
    assert.equal(abreise, '2026-10-16')
  })

  test('does not shift a date-only day across a timezone', () => {
    const text = etappenZeitraumAnzeigen('2026-10-12', '2026-10-16')
    assert.match(text ?? '', /12\. Okt/)
    assert.match(text ?? '', /16\. Okt/)
    assert.equal((text ?? '').includes('11.'), false)
    assert.equal((text ?? '').includes('13. Okt'), false)
  })

  test('existing helpers stay display-only and do not rewrite inputs', () => {
    const start = '2026-10-12'
    const ende = '2026-10-16'
    assert.match(datumKurz(start), /12\. Okt/)
    assert.match(zeitraumKurz(start, ende), /12\. Okt/)
    assert.equal(start, '2026-10-12')
    assert.equal(ende, '2026-10-16')
  })
})

const DOPPELPUNKT = /(?<!\.)\.\.(?!\.)/

const MONATE = [
  { nummer: '01', abgekuerzt: true },
  { nummer: '02', abgekuerzt: true },
  { nummer: '03', abgekuerzt: false, voll: 'März' },
  { nummer: '04', abgekuerzt: true },
  { nummer: '05', abgekuerzt: false, voll: 'Mai' },
  { nummer: '06', abgekuerzt: false, voll: 'Juni' },
  { nummer: '07', abgekuerzt: false, voll: 'Juli' },
  { nummer: '08', abgekuerzt: true },
  { nummer: '09', abgekuerzt: true },
  { nummer: '10', abgekuerzt: true },
  { nummer: '11', abgekuerzt: true },
  { nummer: '12', abgekuerzt: true },
] as const

describe('Satzpunkt nach Datumsetiketten (Work-Endtest 27.11.2026, «19. Dez..»)', () => {
  test('der 19. Dezember lautet genau «19. Dez.», mit Jahr «19. Dez. 2026»', () => {
    assert.equal(datumKurz('2026-12-19'), '19. Dez.')
    assert.equal(datumMitJahr('2026-12-19'), '19. Dez. 2026')
    assert.equal(datumMitWochentag('2026-12-19'), 'Sa, 19. Dez. 2026')
    assert.equal(etappenZeitraumAnzeigen('2026-12-19', '2026-12-26'), '19. Dez. – 26. Dez.')
  })

  test('am Satzende steht genau ein Punkt: der Abkürzungspunkt ist der Satzpunkt', () => {
    assert.equal(mitSatzpunkt('Zürich → Zermatt · 19. Dez.'), 'Zürich → Zermatt · 19. Dez.')
    assert.equal(mitSatzpunkt('19. Dez.'), '19. Dez.')
  })

  test('ohne Abkürzungspunkt wird der Satzpunkt ergänzt, voll ausgeschriebene Monate bleiben voll', () => {
    assert.equal(mitSatzpunkt('Zürich → Zermatt · 19. März'), 'Zürich → Zermatt · 19. März.')
    assert.equal(mitSatzpunkt('Zürich → Zermatt · 19. Mai'), 'Zürich → Zermatt · 19. Mai.')
    assert.equal(mitSatzpunkt('19. Dez. 2026'), '19. Dez. 2026.')
    assert.equal(mitSatzpunkt('Zürich → Zermatt · Datum unbekannt'), 'Zürich → Zermatt · Datum unbekannt.')
  })

  test('anderes Satzende wird nicht doppelt abgeschlossen', () => {
    assert.equal(mitSatzpunkt('Wirklich?'), 'Wirklich?')
    assert.equal(mitSatzpunkt('Achtung!'), 'Achtung!')
    assert.equal(mitSatzpunkt('Und weiter …'), 'Und weiter …')
  })

  test('alle zwölf Monate: genau ein Schlusspunkt, nie «..», volle Namen nie künstlich abgekürzt', () => {
    for (const monat of MONATE) {
      const iso = `2026-${monat.nummer}-19`
      const etikett = datumKurz(iso)
      const satz = mitSatzpunkt(`Zürich → Zermatt · ${etikett}`)
      assert.match(etikett, /^19\. \p{L}+\.?$/u, `${iso}: ${etikett}`)
      assert.equal(satz.endsWith('.'), true, satz)
      assert.equal(satz.endsWith('..'), false, satz)
      assert.doesNotMatch(satz, DOPPELPUNKT, satz)
      if (monat.abgekuerzt) {
        assert.equal(etikett.endsWith('.'), true, `${iso}: Kurzname trägt seinen Punkt selbst (${etikett})`)
        assert.equal(satz, `Zürich → Zermatt · ${etikett}`, 'der Abkürzungspunkt ist der Satzpunkt')
      } else {
        assert.equal(etikett, `19. ${monat.voll}`)
        assert.equal(satz, `Zürich → Zermatt · 19. ${monat.voll}.`)
      }
      assert.doesNotMatch(datumMitJahr(iso) ?? '', DOPPELPUNKT)
      assert.doesNotMatch(datumMitWochentag(iso) ?? '', DOPPELPUNKT)
      assert.doesNotMatch(etappenZeitraumAnzeigen(iso, `2026-${monat.nummer}-24`) ?? '', DOPPELPUNKT)
      assert.doesNotMatch(zeitraumKurz(iso, `2026-${monat.nummer}-24`), DOPPELPUNKT)
    }
  })

  test('Jahreswechsel und Zeitzone: gleicher Kalendertag, kein Punktfehler im Zeitraum', () => {
    const wechsel = etappenZeitraumAnzeigen('2026-12-19', '2027-01-03') ?? ''
    assert.equal(wechsel, '19. Dez. 2026 – 03. Jan. 2027')
    assert.doesNotMatch(wechsel, DOPPELPUNKT)
    assert.equal(datumKurz('2026-12-31'), '31. Dez.')
    assert.equal(datumKurz('2027-01-01'), '1. Jan.')
  })

  test('kein Satzende hängt von Hand einen Punkt an ein Datumsetikett (Wächter über die Quelle)', () => {
    const wurzel = process.cwd()
    const direkt = /(?:\$\{|\{)\s*(?:datumKurz|datumMitJahr|datumMitWochentag|etappenZeitraumAnzeigen|zeitraumKurz|planpunktWann)\([^{}]*\)\s*\}\.(?![\p{L}\d])/u
    const funde: string[] = []
    for (const ordner of ['app', 'components', 'lib']) {
      for (const eintrag of readdirSync(join(wurzel, ordner), { recursive: true, withFileTypes: true })) {
        if (!eintrag.isFile() || !/\.(ts|tsx)$/.test(eintrag.name) || /\.test\.(ts|tsx)$/.test(eintrag.name)) continue
        const pfad = join(eintrag.parentPath, eintrag.name)
        readFileSync(pfad, 'utf8').split('\n').forEach((zeile, index) => {
          if (direkt.test(zeile)) funde.push(`${pfad.slice(wurzel.length + 1)}:${index + 1}`)
        })
      }
    }
    assert.deepEqual(funde, [], 'Satzpunkt nach einem Datumsetikett: `mitSatzpunkt(...)` verwenden')
  })
})
