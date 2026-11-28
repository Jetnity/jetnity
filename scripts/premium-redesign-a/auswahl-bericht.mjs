#!/usr/bin/env node
// scripts/premium-redesign-a/auswahl-bericht.mjs
//
// Erzeugt aus den Messdateien von `auswahl-kontrast.mjs` den Kontrastbericht (Markdown und CSV):
//   - Zusammenfassung je Kombination und Ansicht (Messungen, PASS, FAIL, OFFEN),
//   - jedes FAIL des Ausgangsstands mit dem Wert desselben Elements im neuen Stand (Negativbeleg und Gegenprobe),
//   - alle OFFEN-Einträge des neuen Stands mit Grund,
//   - die Rohwerte aller Messungen als CSV (ungerundeter Kontrast gegen den tatsächlichen Grund).
//
//   node scripts/premium-redesign-a/auswahl-bericht.mjs --vorher <vorher.json> --nachher <nachher.json[,weitere.json]> --out <dir>
//
// Ein Eintrag ohne Messung steht als OFFEN. Es wird nichts zu PASS gerechnet.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function argument(name, standard = '') {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : standard
}

const VORHER = argument('vorher')
const NACHHER = argument('nachher').split(',').filter(Boolean)
const AUS = argument('out', '/tmp/pra/auswahl/bericht')
if (!VORHER || NACHHER.length === 0) {
  console.error('Aufruf: --vorher <datei.json> --nachher <datei.json[,datei.json]> [--out <ordner>]')
  process.exit(2)
}

const lesen = (pfad) => JSON.parse(readFileSync(pfad, 'utf8'))
const vorher = lesen(VORHER)
const nachherDateien = NACHHER.map(lesen)

const name = (element) => (element.match(/«([^»]*)»/)?.[1] ?? '').slice(0, 60)
const tag = (element) => element.split(/[.[«\s]/)[0]
const schluessel = (r, e) => [r.kombination, r.ansicht, tag(e.element), name(e.element), e.zustand, e.modus ?? '', String(e.auswahl ?? '')].join('|')
const rang = { FAIL: 3, OFFEN: 2, PASS: 1 }

function eintraege(daten) {
  const liste = []
  for (const r of daten.ergebnisse) for (const e of r.eintraege) liste.push({ r, e, k: schluessel(r, e) })
  return liste
}

function kennzahl(e) {
  const werte = []
  if (typeof e.kontrast === 'number') werte.push(`${e.kontrast.toFixed(4)}:1`)
  return werte[0] ?? ''
}

const vorherListe = eintraege(vorher)
const nachherListe = nachherDateien.flatMap(eintraege)
const nachherNach = new Map()
for (const eintrag of nachherListe) {
  const alt = nachherNach.get(eintrag.k)
  if (!alt || rang[eintrag.e.urteil] > rang[alt.e.urteil]) nachherNach.set(eintrag.k, eintrag)
}

function zusammenfassung(liste) {
  const nach = new Map()
  for (const { r, e } of liste) {
    const k = `${r.kombination}|${r.ansicht}`
    const z = nach.get(k) ?? { kombination: r.kombination, ansicht: r.ansicht, n: 0, PASS: 0, FAIL: 0, OFFEN: 0 }
    z.n += 1
    z[e.urteil] += 1
    nach.set(k, z)
  }
  return nach
}

const zv = zusammenfassung(vorherListe)
const zn = zusammenfassung(nachherListe)
const alleSchluessel = [...new Set([...zv.keys(), ...zn.keys()])].sort()

const summe = (liste) => liste.reduce((s, { e }) => ({ ...s, [e.urteil]: s[e.urteil] + 1, n: s.n + 1 }), { n: 0, PASS: 0, FAIL: 0, OFFEN: 0 })
const sv = summe(vorherListe)
const sn = summe(nachherListe)

const zeilen = []
zeilen.push('# Kontrast- und Zustandsmatrix Auswahlfelder (Premium-Redesign PR A, Work-Nachtest 27.11.2026)', '')
zeilen.push(`- Ausgangsstand: \`${vorher.commit ?? 'unbekannt'}\` (${vorher.etikett ?? ''}); neuer Stand: \`${nachherDateien.map((d) => d.commit).join(', ')}\`.`)
zeilen.push(`- Ausgang: ${sv.n} Messungen, PASS ${sv.PASS}, FAIL ${sv.FAIL}, OFFEN ${sv.OFFEN}.`)
zeilen.push(`- Neu: ${sn.n} Messungen, PASS ${sn.PASS}, FAIL ${sn.FAIL}, OFFEN ${sn.OFFEN}.`)
zeilen.push('- Grenzen: Text 4,5 : 1 (auch grosser Text), Kontur von Steuerelementen und Fokusindikator 3 : 1 (Fokus mindestens 2 px), Auswahl nicht nur über Farbe. Jeder Wert ist ungerundet gegen den tatsächlichen Grund gemessen; ein nicht herstellbarer Zustand steht als OFFEN.', '')

zeilen.push('## Zusammenfassung je Kombination und Ansicht', '', '| Kombination | Ansicht | Ausgang: n / FAIL / OFFEN | Neu: n / FAIL / OFFEN |', '|---|---|---|---|')
for (const k of alleSchluessel) {
  const a = zv.get(k)
  const b = zn.get(k)
  const fa = a ? `${a.n} / ${a.FAIL} / ${a.OFFEN}` : 'nicht gemessen'
  const fb = b ? `${b.n} / ${b.FAIL} / ${b.OFFEN}` : 'nicht gemessen'
  const [kombination, ansicht] = k.split('|')
  zeilen.push(`| ${kombination} | ${ansicht} | ${fa} | ${fb} |`)
}

const signaturen = new Map()
for (const { r, e, k } of vorherListe) {
  if (e.urteil !== 'FAIL') continue
  const grund = (e.gruende[0] ?? '').replace(/\d+\.\d{4}:1/g, 'X:1').replace(/rgb\([^)]*\)/g, 'rgb(…)')
  const sig = `${r.ansicht}|${tag(e.element)}|${name(e.element)}|${e.zustand}|${e.modus ?? ''}|${grund}`
  const eintrag = signaturen.get(sig) ?? { ansicht: r.ansicht, element: e.element, zustand: e.zustand, modus: e.modus, grund: e.gruende[0], faelle: [] }
  eintrag.faelle.push({ kombination: r.kombination, k, wertVorher: e.gruende[0] })
  signaturen.set(sig, eintrag)
}

zeilen.push('', '## Negativbelege des Ausgangsstands und Gegenprobe im neuen Stand', '', 'Je Signatur: wo der Ausgangsstand FAIL zeigt (Kombinationen) und was dasselbe Element im neuen Stand misst. «nicht gemessen» heisst: im neuen Lauf nicht enthalten (kein PASS).', '')
zeilen.push('| Ansicht | Element | Zustand | Befund Ausgang (Beispiel) | Kombinationen FAIL | Neu: PASS / FAIL / OFFEN / nicht gemessen |', '|---|---|---|---|---|---|')
for (const sig of [...signaturen.values()].sort((a, b) => a.ansicht.localeCompare(b.ansicht) || a.element.localeCompare(b.element))) {
  const stand = { PASS: 0, FAIL: 0, OFFEN: 0, fehlt: 0 }
  for (const fall of sig.faelle) {
    const neu = nachherNach.get(fall.k)
    if (!neu) stand.fehlt += 1
    else stand[neu.e.urteil] += 1
  }
  const kombis = [...new Set(sig.faelle.map((f) => f.kombination))]
  zeilen.push(
    `| ${sig.ansicht} | \`${sig.element.slice(0, 70).replace(/\|/g, '/')}\` | ${sig.zustand}${sig.modus && sig.modus !== 'ist' ? ` (${sig.modus})` : ''} | ${(sig.grund ?? '').replace(/\|/g, '/').slice(0, 150)} | ${kombis.length} | ${stand.PASS} / ${stand.FAIL} / ${stand.OFFEN} / ${stand.fehlt} |`,
  )
}

const offeneNeu = nachherListe.filter(({ e }) => e.urteil === 'OFFEN')
zeilen.push('', '## OFFEN im neuen Stand', '')
if (offeneNeu.length === 0) zeilen.push('Keine OFFEN-Einträge.')
else {
  const gruppen = new Map()
  for (const { r, e } of offeneNeu) {
    const grund = (e.offen[0] ?? 'ohne Angabe').replace(/\d+\.\d{4}/g, 'X')
    const g = `${r.ansicht}|${tag(e.element)}|${name(e.element)}|${grund}`
    const eintrag = gruppen.get(g) ?? { ansicht: r.ansicht, element: e.element, grund: e.offen[0] ?? 'ohne Angabe', zustaende: new Set(), kombis: new Set() }
    eintrag.zustaende.add(e.zustand)
    eintrag.kombis.add(r.kombination)
    gruppen.set(g, eintrag)
  }
  zeilen.push('| Ansicht | Element | Zustände | Kombinationen | Grund |', '|---|---|---|---|---|')
  for (const g of gruppen.values()) {
    zeilen.push(`| ${g.ansicht} | \`${g.element.slice(0, 70).replace(/\|/g, '/')}\` | ${[...g.zustaende].join(', ')} | ${[...g.kombis].join(', ')} | ${g.grund.replace(/\|/g, '/').slice(0, 160)} |`)
  }
}

const kopf = 'quelle;kombination;ansicht;element;zustand;modus;auswahl;urteil;kontrast;messart;gruende;offen'
const csv = [kopf]
const zelle = (wert) => `"${String(wert ?? '').replace(/"/g, '""')}"`
const csvZeilen = (quelle, liste) => {
  for (const { r, e } of liste) {
    csv.push([quelle, r.kombination, r.ansicht, e.element, e.zustand, e.modus ?? '', e.auswahl ?? '', e.urteil, kennzahl(e), e.messart ?? '', (e.gruende ?? []).join(' ; '), (e.offen ?? []).join(' ; ')].map(zelle).join(';'))
  }
}
csvZeilen('ausgang', vorherListe)
csvZeilen('neu', nachherListe)

mkdirSync(AUS, { recursive: true })
writeFileSync(join(AUS, 'kontrastbericht.md'), `${zeilen.join('\n')}\n`)
writeFileSync(join(AUS, 'rohwerte.csv'), `${csv.join('\n')}\n`)
console.log(`Bericht: ${join(AUS, 'kontrastbericht.md')} (Ausgang FAIL ${sv.FAIL}, neu FAIL ${sn.FAIL}, neu OFFEN ${sn.OFFEN})`)
