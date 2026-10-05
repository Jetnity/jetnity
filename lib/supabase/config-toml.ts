// lib/supabase/config-toml.ts
//
// Liest den Teil von TOML, den `supabase/config.toml` verwendet – Tabellen,
// Zeichenketten, Zahlen, Wahrheitswerte und einzeilige Zeichenketten-Listen.
//
// Warum von Hand und nicht mit einem Paket: Die Datei ist die einzige Quelle
// der Auth-Konfiguration (docs/AUTH.md). Sie muss von zwei Seiten gelesen
// werden – vom Abgleichsskript und von einem Test, der ohne Netz läuft. Ein
// Paket für vierzig Zeilen Grammatik wäre nach AGENTS.md Regel 12 eine
// Abhängigkeit ohne realen Bedarf.
//
// Bewusst nicht unterstützt: mehrzeilige Zeichenketten, Inline-Tabellen,
// Tabellen-Arrays, Datumsangaben, Gleitkommazahlen. Nichts davon kommt in
// `config.toml` vor. Wer eines davon einführt, bekommt einen Fehler statt
// einer stillen Fehldeutung.

export type TomlWert = string | number | boolean | string[]
export type TomlTabelle = { [schluessel: string]: TomlWert | TomlTabelle }

/** Ein Wert aus der Datei, mit dem Pfad, unter dem er dort steht. */
export type TomlEintrag = { pfad: string; wert: TomlWert }

class TomlFehler extends Error {
  constructor(zeilennummer: number, text: string) {
    super(`config.toml Zeile ${zeilennummer}: ${text}`)
  }
}

/**
 * Entfernt einen Kommentar am Zeilenende, ohne ein `#` innerhalb einer
 * Zeichenkette anzutasten. Genau daran scheitert eine Suche mit `split('#')`:
 * `password_requirements` enthält `#` als erlaubtes Sonderzeichen.
 */
function ohneKommentar(zeile: string): string {
  let inZeichenkette = false
  let maskiert = false

  for (let i = 0; i < zeile.length; i++) {
    const z = zeile[i]
    if (maskiert) {
      maskiert = false
      continue
    }
    if (z === '\\' && inZeichenkette) {
      maskiert = true
      continue
    }
    if (z === '"') inZeichenkette = !inZeichenkette
    else if (z === '#' && !inZeichenkette) return zeile.slice(0, i)
  }

  return zeile
}

function zeichenkette(text: string, zeilennummer: number): string {
  const roh = text.slice(1, -1)
  let ergebnis = ''

  for (let i = 0; i < roh.length; i++) {
    if (roh[i] !== '\\') {
      ergebnis += roh[i]
      continue
    }
    const naechstes = roh[++i]
    switch (naechstes) {
      case 'n': ergebnis += '\n'; break
      case 't': ergebnis += '\t'; break
      case 'r': ergebnis += '\r'; break
      case '"': ergebnis += '"'; break
      case '\\': ergebnis += '\\'; break
      default: throw new TomlFehler(zeilennummer, `unbekannte Maskierung \\${naechstes}`)
    }
  }

  return ergebnis
}

function wert(text: string, zeilennummer: number): TomlWert {
  const t = text.trim()

  if (t.startsWith('"')) {
    if (!t.endsWith('"') || t.length < 2) throw new TomlFehler(zeilennummer, 'Zeichenkette nicht geschlossen')
    return zeichenkette(t, zeilennummer)
  }

  if (t.startsWith("'")) {
    if (!t.endsWith("'") || t.length < 2) throw new TomlFehler(zeilennummer, 'Zeichenkette nicht geschlossen')
    return t.slice(1, -1)
  }

  if (t.startsWith('[')) {
    if (!t.endsWith(']')) throw new TomlFehler(zeilennummer, 'mehrzeilige Listen werden nicht gelesen')
    const inhalt = t.slice(1, -1).trim()
    if (!inhalt) return []
    return teileListe(inhalt, zeilennummer).map((eintrag) => {
      const einzel = wert(eintrag, zeilennummer)
      if (typeof einzel !== 'string') throw new TomlFehler(zeilennummer, 'nur Listen aus Zeichenketten')
      return einzel
    })
  }

  if (t === 'true') return true
  if (t === 'false') return false

  if (/^[+-]?\d+(_\d+)*$/.test(t)) return Number(t.replace(/_/g, ''))

  throw new TomlFehler(zeilennummer, `Wert nicht lesbar: ${t}`)
}

/** Trennt an Kommas, die nicht in einer Zeichenkette stehen. */
function teileListe(inhalt: string, zeilennummer: number): string[] {
  const teile: string[] = []
  let aktuell = ''
  let inZeichenkette = false
  let maskiert = false

  for (const z of inhalt) {
    if (maskiert) {
      aktuell += z
      maskiert = false
      continue
    }
    if (z === '\\' && inZeichenkette) {
      aktuell += z
      maskiert = true
      continue
    }
    if (z === '"') inZeichenkette = !inZeichenkette
    if (z === ',' && !inZeichenkette) {
      teile.push(aktuell)
      aktuell = ''
      continue
    }
    aktuell += z
  }

  if (inZeichenkette) throw new TomlFehler(zeilennummer, 'Zeichenkette nicht geschlossen')
  if (aktuell.trim()) teile.push(aktuell)
  return teile
}

/** Liest TOML in eine verschachtelte Tabelle. */
export function leseToml(quelle: string): TomlTabelle {
  const wurzel: TomlTabelle = {}
  let aktuelle = wurzel

  quelle.split(/\r?\n/).forEach((rohzeile, index) => {
    const zeilennummer = index + 1
    const zeile = ohneKommentar(rohzeile).trim()
    if (!zeile) return

    if (zeile.startsWith('[[')) throw new TomlFehler(zeilennummer, 'Tabellen-Arrays werden nicht gelesen')

    if (zeile.startsWith('[')) {
      if (!zeile.endsWith(']')) throw new TomlFehler(zeilennummer, 'Tabellenkopf nicht geschlossen')
      aktuelle = wurzel
      for (const teil of zeile.slice(1, -1).split('.')) {
        const name = teil.trim().replace(/^"(.*)"$/, '$1')
        if (!name) throw new TomlFehler(zeilennummer, 'leerer Tabellenname')
        const vorhanden = aktuelle[name]
        if (vorhanden === undefined) aktuelle[name] = {}
        else if (typeof vorhanden !== 'object' || Array.isArray(vorhanden)) {
          throw new TomlFehler(zeilennummer, `${name} ist bereits ein Wert`)
        }
        aktuelle = aktuelle[name] as TomlTabelle
      }
      return
    }

    const trenner = zeile.indexOf('=')
    if (trenner < 1) throw new TomlFehler(zeilennummer, `keine Zuweisung: ${zeile}`)
    const schluessel = zeile.slice(0, trenner).trim().replace(/^"(.*)"$/, '$1')
    aktuelle[schluessel] = wert(zeile.slice(trenner + 1), zeilennummer)
  })

  return wurzel
}

/**
 * Holt einen Wert über seinen Pfad, etwa `auth.email.enable_confirmations`.
 * Fehlt er, ist das Ergebnis `undefined` – der Aufrufer entscheidet, ob das
 * ein Fehler ist.
 */
export function tomlWert(tabelle: TomlTabelle, pfad: string): TomlWert | undefined {
  let aktuell: TomlWert | TomlTabelle | undefined = tabelle

  for (const teil of pfad.split('.')) {
    if (aktuell === undefined || typeof aktuell !== 'object' || Array.isArray(aktuell)) return undefined
    aktuell = (aktuell as TomlTabelle)[teil]
  }

  if (aktuell === undefined || (typeof aktuell === 'object' && !Array.isArray(aktuell))) return undefined
  return aktuell
}
