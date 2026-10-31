// lib/providers/twelve-go/widget/quelle.ts
//
// Liest die partnergenerierten Bytes und beschreibt ihre Attribute.
// Läuft in Node-Tests und im Prüfskript, nicht in der Besucherfläche.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  TWELVE_GO_WIDGET_ALLGEMEIN_DATEI,
  TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE,
  TWELVE_GO_WIDGET_ALLGEMEIN_SHA256,
  TWELVE_GO_WIDGET_REFERENZ_DATEI,
  TWELVE_GO_WIDGET_REFERENZ_LAENGE,
  TWELVE_GO_WIDGET_REFERENZ_SHA256,
} from '@/lib/providers/twelve-go/widget/kennungen'

export type TwelveGoWidgetQuellenArt = 'allgemein' | 'referenz'

export type TwelveGoWidgetAttribut = {
  name: string
  value: string
  quoted: boolean
}

export type TwelveGoWidgetBeschreibung = {
  art: TwelveGoWidgetQuellenArt
  laenge: number
  sha256: string
  attribute: readonly TwelveGoWidgetAttribut[]
  src: string
  subId: string
  poweredId: string
  poweredHref: string
  beispielstrecke: boolean
}

const ORDNER = dirname(fileURLToPath(import.meta.url))

function fehler(text: string): Error {
  return new Error(`12Go-Quelle: ${text}`)
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function attributeLesen(innen: string): TwelveGoWidgetAttribut[] {
  const attribute: TwelveGoWidgetAttribut[] = []
  let index = 0
  while (index < innen.length) {
    while (index < innen.length && /\s/u.test(innen[index] ?? '')) index += 1
    if (index >= innen.length) break
    const namensAnfang = index
    while (index < innen.length && innen[index] !== '=' && !/\s/u.test(innen[index] ?? '')) index += 1
    const name = innen.slice(namensAnfang, index)
    if (!name) throw fehler('Attribut ohne Namen')
    while (index < innen.length && /\s/u.test(innen[index] ?? '')) index += 1
    if (innen[index] !== '=') throw fehler(`Attribut ${name} ohne Wert`)
    index += 1
    while (index < innen.length && /\s/u.test(innen[index] ?? '')) index += 1
    let value = ''
    let quoted = false
    if (innen[index] === '"') {
      quoted = true
      index += 1
      const anfang = index
      while (index < innen.length && innen[index] !== '"') index += 1
      if (innen[index] !== '"') throw fehler(`Attribut ${name} ohne schliessendes Anführungszeichen`)
      value = innen.slice(anfang, index)
      index += 1
    } else {
      const anfang = index
      while (index < innen.length && !/\s/u.test(innen[index] ?? '')) index += 1
      value = innen.slice(anfang, index)
      if (!value) throw fehler(`Attribut ${name} ohne Wert`)
    }
    attribute.push({ name, value, quoted })
  }
  return attribute
}

function skriptTeilen(quelle: string): { innen: string; rest: string } {
  if (!quelle.startsWith('<script')) throw fehler('beginnt nicht mit dem Skript')
  if (quelle.split('<script').length !== 2) throw fehler('mehr als ein Skript')
  let index = '<script'.length
  let inAnfuehrung = false
  for (; index < quelle.length; index += 1) {
    const zeichen = quelle[index]
    if (inAnfuehrung) {
      if (zeichen === '"') inAnfuehrung = false
      continue
    }
    if (zeichen === '"') {
      inAnfuehrung = true
      continue
    }
    if (zeichen === '>') break
  }
  if (quelle[index] !== '>') throw fehler('Skript ohne Tagende')
  const innen = quelle.slice('<script'.length, index)
  const nachTag = quelle.slice(index + 1)
  const schliess = '</script>'
  if (!nachTag.startsWith(schliess)) throw fehler('Skript schliesst nicht direkt')
  return { innen, rest: nachTag.slice(schliess.length) }
}

function wert(attribute: readonly TwelveGoWidgetAttribut[], name: string): string {
  const treffer = attribute.filter((eintrag) => eintrag.name === name)
  if (treffer.length !== 1) throw fehler(`Attribut ${name} nicht eindeutig`)
  return treffer[0]!.value
}

export function twelveGoWidgetQuelleBeschreiben(bytes: Uint8Array): TwelveGoWidgetBeschreibung {
  const summe = sha256(bytes)
  const art: TwelveGoWidgetQuellenArt | null =
    bytes.length === TWELVE_GO_WIDGET_ALLGEMEIN_LAENGE && summe === TWELVE_GO_WIDGET_ALLGEMEIN_SHA256
      ? 'allgemein'
      : bytes.length === TWELVE_GO_WIDGET_REFERENZ_LAENGE && summe === TWELVE_GO_WIDGET_REFERENZ_SHA256
        ? 'referenz'
        : null
  if (!art) throw fehler('Prüfsumme oder Länge passt zu keinem Export')

  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw fehler('kein UTF-8')
  }
  const wieder = new TextEncoder().encode(text)
  if (wieder.length !== bytes.length || wieder.some((byte, index) => byte !== bytes[index])) {
    throw fehler('UTF-8 ist nicht rund')
  }
  if (text.includes('\n') || text.includes('\r')) throw fehler('enthält einen Zeilenumbruch')

  const { innen, rest } = skriptTeilen(text)
  const attribute = attributeLesen(innen)
  const powered = /^<div id="powered">Powered by <a href="([^"]+)">12Go system<\/a><\/div>$/u.exec(rest)
  if (!powered?.[1]) throw fehler('Powered-by fehlt oder ist verändert')

  return {
    art,
    laenge: bytes.length,
    sha256: summe,
    attribute,
    src: wert(attribute, 'src'),
    subId: wert(attribute, 'data-sub_id'),
    poweredId: 'powered',
    poweredHref: powered[1],
    beispielstrecke: art === 'referenz',
  }
}

export function twelveGoWidgetQuelleLesen(art: TwelveGoWidgetQuellenArt): Buffer {
  const datei = art === 'allgemein' ? TWELVE_GO_WIDGET_ALLGEMEIN_DATEI : TWELVE_GO_WIDGET_REFERENZ_DATEI
  const bytes = readFileSync(join(ORDNER, 'quelle', datei))
  twelveGoWidgetQuelleBeschreiben(bytes)
  return bytes
}
