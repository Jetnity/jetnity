// scripts/premium-redesign-a/kontrast.mjs
//
// Gemeinsame Kontrastmessung der Abnahmeskripte von PR A.
//
// Grenze: 4,5 : 1 für ALLE sichtbaren Texte, auch grosse Schrift (Vorgabe des Product Owners). Verglichen wird
// der ungerundete Wert; gerundet wird nur für die Ausgabe. Was nicht gemessen werden konnte, ist kein PASS.
//
// Texte auf einfarbigem Grund misst `textKontrastImBrowser` mit der deckend gemischten Hintergrundfarbe.
// Texte, hinter denen ein Foto oder ein Verlauf liegt, lassen sich so nicht belegen. Sie misst
// `bildgrundMessen` getrennt, an den Pixeln: Der Text wird unsichtbar gemacht, der Bereich dahinter
// fotografiert, und die echte Textfarbe wird gegen jedes Pixel gerechnet. Der Bericht nennt den schlechtesten
// Wert je Textzeile (nicht den Durchschnitt) und zusätzlich den Wert, den 99 % der Pixel erreichen.

export const GRENZE = 4.5

/** Läuft im Browser. Sammelt Texte auf einfarbigem Grund und markiert Texte auf Bildgrund für die Pixelmessung. */
export function textKontrastImBrowser({ wurzelSelektor = 'body', ausschliessen = '' } = {}) {
  const sichtbar = (element) => {
    const stil = getComputedStyle(element)
    if (stil.visibility === 'hidden' || stil.display === 'none' || Number(stil.opacity) === 0) return false
    const r = element.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const kanaele = (farbe) => {
    const treffer = farbe && farbe.match(/rgba?\(([^)]+)\)/)
    if (!treffer) return null
    const teile = treffer[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { r: teile[0], g: teile[1], b: teile[2], a: teile[3] ?? 1 }
  }
  const mischen = (vorn, hinten) => ({
    r: vorn.r * vorn.a + hinten.r * (1 - vorn.a),
    g: vorn.g * vorn.a + hinten.g * (1 - vorn.a),
    b: vorn.b * vorn.a + hinten.b * (1 - vorn.a),
    a: 1,
  })
  const leuchtdichte = ({ r, g, b }) => {
    const l = [r, g, b].map((k) => {
      const v = k / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
  }
  const kontrast = (a, b) => {
    const la = leuchtdichte(a)
    const lb = leuchtdichte(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  }
  const grundVon = (element) => {
    const schichten = []
    let knoten = element
    let bild = false
    while (knoten) {
      const stil = getComputedStyle(knoten)
      if (stil.backgroundImage && stil.backgroundImage !== 'none') bild = true
      const farbe = kanaele(stil.backgroundColor)
      if (farbe && farbe.a > 0) {
        schichten.push(farbe)
        if (farbe.a >= 0.99) break
      }
      knoten = knoten.parentElement
    }
    let grund = { r: 255, g: 255, b: 255, a: 1 }
    for (const schicht of schichten.reverse()) grund = mischen(schicht, grund)
    return { grund, bild }
  }

  // Flächen, hinter denen ein Bild liegen kann: Fotos, Videos, Leinwände und Elemente mit Hintergrundbild oder Verlauf.
  const flaechen = []
  for (const element of document.querySelectorAll('img, picture, video, canvas, [style*="background"], *')) {
    const stil = getComputedStyle(element)
    const istBild = ['IMG', 'PICTURE', 'VIDEO', 'CANVAS'].includes(element.tagName) || (stil.backgroundImage && stil.backgroundImage !== 'none')
    if (!istBild || !sichtbar(element)) continue
    const r = element.getBoundingClientRect()
    if (r.width < 40 || r.height < 16) continue
    flaechen.push({ element, links: r.left, oben: r.top, rechts: r.right, unten: r.bottom })
  }

  const wurzel = document.querySelector(wurzelSelektor) ?? document.body
  const texte = []
  const bildTexte = []
  const gesehen = new Set()
  const walker = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const knoten = walker.currentNode
    if (!knoten.textContent || !knoten.textContent.trim()) continue
    const element = knoten.parentElement
    if (!element || gesehen.has(element) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) continue
    if (!sichtbar(element) || element.closest('[inert], [aria-hidden="true"], svg, .sr-only')) continue
    if (ausschliessen && element.closest(ausschliessen)) continue
    const geschlossen = element.closest('details:not([open])')
    if (geschlossen && !element.closest('summary')) continue
    const r = element.getBoundingClientRect()
    if (r.width <= 2 && r.height <= 2) continue
    gesehen.add(element)
    const stil = getComputedStyle(element)
    const vordergrund = kanaele(stil.color)
    if (!vordergrund) continue
    const { grund, bild } = grundVon(element)
    // Hinter dem Text liegt ein Bild, wenn ein Vorfahr ein Hintergrundbild trägt oder ein Foto, Video oder eine Leinwand
    // (ein Geschwister, kein Vorfahr) die Mitte der ersten Textzeile überdeckt.
    const mitteX = r.left + r.width / 2
    const mitteY = r.top + Math.min(r.height, 24) / 2
    const hinterBild =
      bild ||
      flaechen.some(
        (f) =>
          ['IMG', 'PICTURE', 'VIDEO', 'CANVAS'].includes(f.element.tagName) &&
          !f.element.contains(element) &&
          mitteX >= f.links && mitteX <= f.rechts && mitteY >= f.oben && mitteY <= f.unten,
      )
    const groesse = parseFloat(stil.fontSize)
    const eintrag = {
      text: knoten.textContent.trim().slice(0, 48),
      selektor: `${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`,
      groesse,
      gross: groesse >= 24 || (groesse >= 18.66 && Number(stil.fontWeight) >= 700),
    }
    if (hinterBild) {
      bildTexte.push({ element, ...eintrag })
      continue
    }
    const sichtbarerVordergrund = mischen(vordergrund, grund)
    texte.push({ ...eintrag, verhaeltnis: kontrast(sichtbarerVordergrund, grund) })
  }

  const markierte = []
  bildTexte.slice(0, 120).forEach((eintrag, index) => {
    eintrag.element.setAttribute('data-pra-bildtext', String(index))
    markierte.push({ index, text: eintrag.text, selektor: eintrag.selektor, groesse: eintrag.groesse, gross: eintrag.gross })
  })
  const kleinster = texte.reduce((minimum, eintrag) => Math.min(minimum, eintrag.verhaeltnis), Infinity)
  const verfehlt = texte.filter((eintrag) => eintrag.verhaeltnis < 4.5)
  return {
    geprueft: texte.length,
    kleinster: Number.isFinite(kleinster) ? kleinster : null,
    verfehlt: verfehlt.slice(0, 12).map((eintrag) => ({ ...eintrag, verhaeltnis: Math.round(eintrag.verhaeltnis * 100) / 100 })),
    anzahlVerfehlt: verfehlt.length,
    bildTexte: markierte,
    bildTexteGesamt: bildTexte.length,
  }
}

/** Läuft im Browser: alle markierten Bildtexte, die im aktuellen Sichtfeld liegen, mit Farbe und Zeilenrechtecken. */
function sichtbareBildtexte() {
  const kanaele = (farbe) => {
    const treffer = farbe && farbe.match(/rgba?\(([^)]+)\)/)
    if (!treffer) return null
    const teile = treffer[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { r: teile[0], g: teile[1], b: teile[2], a: teile[3] ?? 1 }
  }
  const liste = []
  const verdeckte = []
  const markierte = [...document.querySelectorAll('[data-pra-bildtext]')]
  // Karten-Tooltips und andere Anzeigeflächen haben pointer-events:none. Für die Verdeckungsprüfung muss der Text selbst
  // treffbar sein, sonst würde elementFromPoint stets das Element darunter melden.
  const vorher = markierte.map((element) => element.style.getPropertyValue('pointer-events'))
  markierte.forEach((element) => element.style.setProperty('pointer-events', 'auto', 'important'))
  for (const element of markierte) {
    const farbe = kanaele(getComputedStyle(element).color)
    if (!farbe) continue
    const zeilen = []
    let verdeckt = false
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const knoten = walker.currentNode
      if (!knoten.textContent?.trim()) continue
      const bereich = document.createRange()
      bereich.selectNodeContents(knoten)
      for (const r of bereich.getClientRects()) {
        if (r.width <= 1 || r.height <= 1) continue
        const x = Math.max(0, r.x)
        const y = Math.max(0, r.y)
        const rechts = Math.min(innerWidth, r.x + r.width)
        const unten = Math.min(innerHeight, r.y + r.height)
        if (rechts - x <= 1 || unten - y <= 1) continue
        // Eine Zeile, die gerade unter einem anderen Element liegt (etwa unter der Kopfzeile), wird in einem anderen
        // Sichtfeld gemessen. Gegen die Pixel des verdeckenden Elements würde sie falsch bewertet.
        // Mehrere Messpunkte: auch eine nur teilweise verdeckte Zeile (Kopfzeile, Menüfläche) wird in diesem Sichtfeld nicht gemessen.
        let frei = true
        for (const anteilX of [0.02, 0.3, 0.5, 0.7, 0.98]) {
          for (const anteilY of [0.02, 0.5, 0.98]) {
            const oben = document.elementFromPoint(x + (rechts - x) * anteilX, y + (unten - y) * anteilY)
            if (!oben || !(element.contains(oben) || oben.contains(element))) frei = false
          }
        }
        if (!frei) {
          verdeckt = true
          continue
        }
        zeilen.push({ x, y, w: rechts - x, h: unten - y })
      }
    }
    let deckkraft = 1
    for (let knoten = element; knoten; knoten = knoten.parentElement) deckkraft *= Number(getComputedStyle(knoten).opacity)
    const index = Number(element.getAttribute('data-pra-bildtext'))
    if (zeilen.length) liste.push({ index, farbe, zeilen, deckkraft })
    else if (verdeckt) verdeckte.push(index)
  }
  markierte.forEach((element, i) => {
    if (vorher[i]) element.style.setProperty('pointer-events', vorher[i])
    else element.style.removeProperty('pointer-events')
  })
  return { texte: liste, verdeckte }
}

/**
 * Läuft im Browser: schlechtester Kontrast je Bildtext, gemessen nur an den Pixeln, auf denen Buchstaben stehen.
 * Drei Aufnahmen desselben Sichtfelds: A ohne Text (nur der Grund), B mit schwarzem, C mit weissem Text. Ein Pixel
 * gehört zu einem Buchstaben, wenn sich B oder C deutlich von A unterscheidet. Gerechnet wird die echte Textfarbe gegen
 * den Pixel aus A. Zeilenkästen ohne Buchstaben (Ecken, Zwischenräume, abgerundete Ränder) zählen so nicht mit.
 * Ein Text ohne Buchstabenpixel ist nicht sichtbar (abgeschnitten oder verdeckt) und wird getrennt gemeldet.
 */
async function pixelAuswerten({ texte, a, b, c }) {
  const laden = async (base64) => {
    const bild = new Image()
    bild.src = `data:image/png;base64,${base64}`
    await bild.decode()
    const leinwand = document.createElement('canvas')
    leinwand.width = bild.width
    leinwand.height = bild.height
    const kontext = leinwand.getContext('2d', { willReadFrequently: true })
    kontext.drawImage(bild, 0, 0)
    return { kontext, breite: bild.width }
  }
  const [grundBild, schwarzBild, weissBild] = await Promise.all([laden(a), laden(b), laden(c)])
  const massstab = grundBild.breite / innerWidth
  const leuchtdichte = (r, g, bl) => {
    const l = [r, g, bl].map((k) => {
      const v = k / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
  }
  return texte.map(({ index, farbe, zeilen, deckkraft }) => {
    const werte = []
    for (const zeile of zeilen) {
      const x = Math.floor(zeile.x * massstab)
      const y = Math.floor(zeile.y * massstab)
      const w = Math.min(grundBild.kontext.canvas.width - x, Math.ceil(zeile.w * massstab))
      const h = Math.min(grundBild.kontext.canvas.height - y, Math.ceil(zeile.h * massstab))
      if (w <= 0 || h <= 0) continue
      const grund = grundBild.kontext.getImageData(x, y, w, h).data
      const schwarz = schwarzBild.kontext.getImageData(x, y, w, h).data
      const weiss = weissBild.kontext.getImageData(x, y, w, h).data
      for (let i = 0; i < grund.length; i += 4) {
        const dSchwarz = Math.max(Math.abs(schwarz[i] - grund[i]), Math.abs(schwarz[i + 1] - grund[i + 1]), Math.abs(schwarz[i + 2] - grund[i + 2]))
        const dWeiss = Math.max(Math.abs(weiss[i] - grund[i]), Math.abs(weiss[i + 1] - grund[i + 1]), Math.abs(weiss[i + 2] - grund[i + 2]))
        // Abdeckung eines Buchstabenpixels: Anteil der erwartbaren Abweichung von Schwarz bzw. Weiss gegen den Grund.
        const erwartetSchwarz = Math.max(1, Math.max(grund[i], grund[i + 1], grund[i + 2]))
        const erwartetWeiss = Math.max(1, 255 - Math.min(grund[i], grund[i + 1], grund[i + 2]))
        if (dSchwarz / erwartetSchwarz < 0.5 && dWeiss / erwartetWeiss < 0.5) continue
        const al = farbe.a * deckkraft
        const lv = leuchtdichte(farbe.r * al + grund[i] * (1 - al), farbe.g * al + grund[i + 1] * (1 - al), farbe.b * al + grund[i + 2] * (1 - al))
        const lh = leuchtdichte(grund[i], grund[i + 1], grund[i + 2])
        werte.push((Math.max(lv, lh) + 0.05) / (Math.min(lv, lh) + 0.05))
      }
    }
    if (!werte.length) return { index, schlechtester: null }
    werte.sort((p, q) => p - q)
    return { index, schlechtester: werte[0], p01: werte[Math.floor(werte.length * 0.01)], pixel: werte.length }
  })
}

/**
 * Misst die von `textKontrastImBrowser` markierten Bildtexte an den Pixeln: Die Seite wird in Sichtfeldern durchlaufen;
 * in jedem Sichtfeld wird dreimal fotografiert (ohne Text, schwarzer Text, weisser Text); daraus ergeben sich die
 * Buchstabenpixel, und die echte Textfarbe wird nur gegen den Grund hinter diesen Pixeln gerechnet.
 * Ein Text, für den kein Pixel gemessen werden konnte, steht als `nichtGemessen` und ist kein PASS. Ein Text ohne
 * Buchstabenpixel in jedem Sichtfeld steht als `nichtSichtbar` (abgeschnitten, ausserhalb) und wird mit Beispielen gemeldet.
 */
export async function bildgrundMessen(seite, markierte) {
  const je = new Map(markierte.map((eintrag) => [eintrag.index, { ...eintrag, schlechtester: Infinity, p01: Infinity, pixel: 0 }]))
  if (je.size === 0) return { markiert: 0, gemessen: 0, nichtGemessen: 0, verdeckt: 0, nichtSichtbar: 0, nichtSichtbarBeispiele: [], nichtGemessenBeispiele: [], kleinster: null, kleinsterRoh: null, verfehlt: [], anzahlVerfehlt: 0, sichtfelder: 0 }
  const mass = await seite.evaluate(() => ({ hoehe: document.documentElement.scrollHeight, sicht: innerHeight, vorher: scrollY }))
  const schritt = Math.max(200, Math.floor(mass.sicht * 0.85))
  let sichtfelder = 0
  for (let y = 0; y < mass.hoehe; y += schritt) {
    await seite.evaluate((oben) => window.scrollTo({ top: oben, behavior: 'instant' }), y)
    await seite.waitForTimeout(250)
    let { texte, verdeckte } = await seite.evaluate(sichtbareBildtexte)
    // Einblend-Animationen abwarten. Bleibt die Deckkraft zwischen zwei Messungen gleich, ist sie Teil der Gestaltung
    // (etwa Karten-Tooltips mit 0,9) und wird in die Textfarbe eingerechnet.
    let vorigeDeckkraft = ''
    for (let versuch = 0; versuch < 6 && texte.some((text) => text.deckkraft < 0.99); versuch += 1) {
      const aktuell = texte.map((text) => `${text.index}:${text.deckkraft.toFixed(3)}`).join(',')
      if (aktuell === vorigeDeckkraft) break
      vorigeDeckkraft = aktuell
      await seite.waitForTimeout(400)
      ;({ texte, verdeckte } = await seite.evaluate(sichtbareBildtexte))
    }
    for (const index of verdeckte) if (je.has(index)) je.get(index).verdeckt = true
    for (const text of texte) if (text.deckkraft < 0.05 && je.has(text.index)) je.get(text.index).ohneBuchstaben = true
    texte = texte.filter((text) => text.deckkraft >= 0.05)
    if (!texte.length) continue
    sichtfelder += 1
    const aufnehmen = async (farbe) => {
      await seite.evaluate((wert) => {
        document.getElementById('pra-text-aus')?.remove()
        const stil = document.createElement('style')
        stil.id = 'pra-text-aus'
        stil.textContent = `* { transition: none !important; animation: none !important; color: ${wert} !important; text-shadow: none !important; -webkit-text-fill-color: ${wert} !important; text-decoration-color: ${wert} !important; caret-color: transparent !important; }`
        document.head.append(stil)
        return new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)))
      }, farbe)
      return (await seite.screenshot()).toString('base64')
    }
    let aufnahmen
    try {
      aufnahmen = { a: await aufnehmen('transparent'), b: await aufnehmen('#000000'), c: await aufnehmen('#ffffff') }
    } finally {
      await seite.evaluate(() => document.getElementById('pra-text-aus')?.remove())
    }
    const werte = await seite.evaluate(pixelAuswerten, { texte, ...aufnahmen })
    for (const wert of werte) {
      const eintrag = je.get(wert.index)
      if (!eintrag) continue
      if (wert.schlechtester == null) {
        eintrag.ohneBuchstaben = true
        continue
      }
      eintrag.schlechtester = Math.min(eintrag.schlechtester, wert.schlechtester)
      eintrag.p01 = Math.min(eintrag.p01, wert.p01)
      eintrag.pixel += wert.pixel
    }
  }
  await seite.evaluate((oben) => window.scrollTo({ top: oben, behavior: 'instant' }), mass.vorher)
  const alle = [...je.values()]
  const gemessen = alle.filter((eintrag) => Number.isFinite(eintrag.schlechtester))
  const verdeckt = alle.filter((eintrag) => !Number.isFinite(eintrag.schlechtester) && eintrag.verdeckt)
  const nichtSichtbar = alle.filter((eintrag) => !Number.isFinite(eintrag.schlechtester) && !eintrag.verdeckt && eintrag.ohneBuchstaben)
  const nichtGemessen = alle.filter((eintrag) => !Number.isFinite(eintrag.schlechtester) && !eintrag.verdeckt && !eintrag.ohneBuchstaben)
  const kleinster = gemessen.reduce((minimum, eintrag) => Math.min(minimum, eintrag.schlechtester), Infinity)
  const verfehlt = gemessen.filter((eintrag) => eintrag.schlechtester < GRENZE)
  return {
    markiert: markierte.length,
    gemessen: gemessen.length,
    nichtGemessen: nichtGemessen.length,
    verdeckt: verdeckt.length,
    nichtSichtbar: nichtSichtbar.length,
    nichtSichtbarBeispiele: nichtSichtbar.slice(0, 6).map((eintrag) => ({ text: eintrag.text, selektor: eintrag.selektor })),
    nichtGemessenBeispiele: nichtGemessen.slice(0, 6).map((eintrag) => ({ text: eintrag.text, selektor: eintrag.selektor })),
    kleinster: Number.isFinite(kleinster) ? Math.round(kleinster * 100) / 100 : null,
    kleinsterRoh: Number.isFinite(kleinster) ? kleinster : null,
    verfehlt: verfehlt.slice(0, 12).map((eintrag) => ({ text: eintrag.text, selektor: eintrag.selektor, schlechtester: Math.round(eintrag.schlechtester * 100) / 100, p01: Math.round(eintrag.p01 * 100) / 100 })),
    anzahlVerfehlt: verfehlt.length,
    sichtfelder,
  }
}

/** Kontrast aller sichtbaren Texte: einfarbiger Grund und Bildgrund getrennt, Grenze 4,5 : 1 ungerundet. */
export async function kontrastMessen(seite, optionen = {}) {
  // Der Zeiger darf nicht über der seitlichen Navigation stehen: Sie klappt bei Zeigerkontakt über den Inhalt auf.
  await seite.mouse.move((await seite.evaluate(() => innerWidth)) - 1, 1)
  await seite.waitForTimeout(350)
  const einfarbig = await seite.evaluate(textKontrastImBrowser, optionen)
  const bildgrund = await bildgrundMessen(seite, einfarbig.bildTexte)
  const kleinsterRoh = Math.min(einfarbig.kleinster ?? Infinity, bildgrund.kleinsterRoh ?? Infinity)
  const gemessen = einfarbig.geprueft + bildgrund.gemessen
  const nichtGemessen = bildgrund.nichtGemessen + bildgrund.verdeckt + Math.max(0, einfarbig.bildTexteGesamt - einfarbig.bildTexte.length)
  const bestanden = gemessen > 0 && nichtGemessen === 0 && einfarbig.anzahlVerfehlt === 0 && bildgrund.anzahlVerfehlt === 0
  return {
    grenze: GRENZE,
    bestanden,
    gemessen,
    nichtGemessen,
    kleinster: Number.isFinite(kleinsterRoh) ? Math.round(kleinsterRoh * 100) / 100 : null,
    einfarbig: { geprueft: einfarbig.geprueft, kleinster: einfarbig.kleinster == null ? null : Math.round(einfarbig.kleinster * 100) / 100, verfehlt: einfarbig.verfehlt, anzahlVerfehlt: einfarbig.anzahlVerfehlt },
    bildgrund,
  }
}
