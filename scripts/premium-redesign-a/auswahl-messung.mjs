// scripts/premium-redesign-a/auswahl-messung.mjs
//
// Gemeinsame Messbausteine der Zustandsmatrix für Filter, Chips, Tabs, Menüs und Siegel (PR A, Work-Nachtest).
//
// Gemessen wird im echten Browser, am berechneten Stil des einzelnen Elements in einem einzelnen Zustand:
//   - Textkontrast gegen den TATSÄCHLICHEN Grund. Der Grund wird von der Wurzel her Schicht für Schicht gemischt
//     (Alpha der Hintergrundfarbe, Gruppen-Deckkraft jedes Vorfahren). Liegt ein Bild oder ein Verlauf dahinter oder
//     ein Foto darüber, ist der Text nicht auf einfarbigem Grund und wird OFFEN gemeldet, nie als PASS.
//   - Grenze 4,5 : 1, ungerundet, für ALLE sichtbaren Texte (auch grosse Schrift). Symbole ohne Text 3 : 1.
//   - Fokusindikator: Umriss oder Ring mindestens 2 px und 3 : 1 gegen die Umgebung.
//   - Auswahlanzeige: ein gewähltes Element muss sich nicht nur durch Farbe vom ungewählten unterscheiden
//     (Form, Gewicht, Unterstreichung, Symbol, Rahmen) oder die Flächen müssen mindestens 3 : 1 Luminanz trennen.
//   - Grenze von Eingabefeldern mindestens 3 : 1.
// Ein Zustand, der sich nicht herstellen liess (Element verdeckt, :hover/:focus-visible/:active trifft nicht zu),
// steht als OFFEN im Bericht, nicht als PASS.

export const TEXT_GRENZE = 4.5
export const DREI = 3

/** Läuft im Browser: legt `window.__pra` mit allen Messfunktionen an. */
export function installieren() {
  const P = {}
  window.__pra = P

  P.kanaele = (farbe) => {
    const treffer = farbe && farbe.match(/rgba?\(([^)]+)\)/)
    if (!treffer) return null
    const teile = treffer[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return { r: teile[0], g: teile[1], b: teile[2], a: teile[3] ?? 1 }
  }
  P.mischen = (vorn, hinten) => ({
    r: vorn.r * vorn.a + hinten.r * (1 - vorn.a),
    g: vorn.g * vorn.a + hinten.g * (1 - vorn.a),
    b: vorn.b * vorn.a + hinten.b * (1 - vorn.a),
    a: 1,
  })
  P.leucht = ({ r, g, b }) => {
    const l = [r, g, b].map((k) => {
      const v = k / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
  }
  P.kontrast = (a, b) => {
    const la = P.leucht(a)
    const lb = P.leucht(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  }
  P.rgb = (c) => `rgb(${c.r.toFixed(1)} ${c.g.toFixed(1)} ${c.b.toFixed(1)})`
  P.sichtbar = (element) => {
    const stil = getComputedStyle(element)
    if (stil.visibility === 'hidden' || stil.display === 'none') return false
    const r = element.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }

  P.kette = (element) => {
    const liste = []
    for (let knoten = element; knoten; knoten = knoten.parentElement) liste.unshift(knoten)
    return liste
  }

  /** Gemischte Farbe an einem Punkt der Kette (Wurzel → Element), optional mit Text obenauf. Gruppen-Deckkraft je Knoten. */
  P.farbe = (kette, ende, textFarbe, basis = { r: 255, g: 255, b: 255, a: 1 }) => {
    const schritt = (i, basis) => {
      if (i === ende) return textFarbe ? P.mischen(textFarbe, basis) : basis
      const stil = getComputedStyle(kette[i])
      const schicht = P.kanaele(stil.backgroundColor)
      const deckkraft = Number(stil.opacity)
      const innen = schritt(i + 1, schicht && schicht.a > 0 ? P.mischen(schicht, basis) : basis)
      if (!(deckkraft < 1)) return innen
      return {
        r: basis.r * (1 - deckkraft) + innen.r * deckkraft,
        g: basis.g * (1 - deckkraft) + innen.g * deckkraft,
        b: basis.b * (1 - deckkraft) + innen.b * deckkraft,
        a: 1,
      }
    }
    return schritt(0, basis)
  }

  /**
   * Schlechtester Kontrast über JEDEN Untergrund: Die Flächen innerhalb des gemessenen Elements (bis zum Textträger) sind
   * bekannt, was darunter liegt (Foto, Verlauf, Karte) nicht. Die Leuchtdichte des Grunds liegt dann zwischen der über
   * Schwarz und der über Weiss; der Kontrast ist dort am kleinsten, wo die Leuchtdichte der des Vordergrunds am nächsten
   * kommt. Liegt der Vordergrund im Bereich, ist der schlechteste Fall 1 : 1.
   */
  P.schlechtester = (element, traeger, vorder) => {
    const kette = P.kette(traeger)
    const start = kette.indexOf(element)
    if (start < 0 || vorder.a < 1) return null
    const teil = kette.slice(start)
    const gS = P.farbe(teil, teil.length, null, { r: 0, g: 0, b: 0, a: 1 })
    const gW = P.farbe(teil, teil.length, null, { r: 255, g: 255, b: 255, a: 1 })
    const lt = P.leucht(vorder)
    const lb = P.leucht(gS)
    const lw = P.leucht(gW)
    const verh = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    if (lt >= Math.min(lb, lw) && lt <= Math.max(lb, lw)) return 1
    return Math.min(verh(lt, lb), verh(lt, lw))
  }

  /** Liegt hinter dem Element ein Bild oder ein Verlauf? Eine deckende Farbfläche ohne Bild darunter beendet die Suche. */
  P.bildGrund = (element) => {
    for (let knoten = element; knoten; knoten = knoten.parentElement) {
      const stil = getComputedStyle(knoten)
      if (stil.backgroundImage && stil.backgroundImage !== 'none') return true
      const farbe = P.kanaele(stil.backgroundColor)
      if (farbe && farbe.a >= 0.99) break
    }
    const r = element.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + Math.min(r.height, 24) / 2
    for (const darueber of document.elementsFromPoint(x, y)) {
      if (element.contains(darueber) || darueber.contains(element)) continue
      if (['IMG', 'PICTURE', 'VIDEO', 'CANVAS'].includes(darueber.tagName)) return true
    }
    return false
  }

  /**
   * Alle sichtbaren Texte im Element: schlechtester Kontrast, ungerundet. Texte auf Bild oder Verlauf werden mit
   * `data-pra-bildtext` markiert; der Node-Prozess misst sie an den Pixeln (kontrast.mjs: bildtexteImSichtfeld).
   */
  P.text = (element, markenBasis, wurzelElement = element) => {
    const eintraege = []
    let marke = 0
    const gesehen = new Set()
    const gehe = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    while (gehe.nextNode()) {
      const knoten = gehe.currentNode
      if (!knoten.textContent || !knoten.textContent.trim()) continue
      const traeger = knoten.parentElement
      if (!traeger || gesehen.has(traeger) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(traeger.tagName)) continue
      if (!P.sichtbar(traeger) || traeger.closest('.sr-only, svg')) continue
      const r = traeger.getBoundingClientRect()
      if (r.width <= 2 && r.height <= 2) continue
      gesehen.add(traeger)
      const stil = getComputedStyle(traeger)
      const vorder = P.kanaele(stil.color)
      if (!vorder) continue
      const kette = P.kette(traeger)
      const grund = P.farbe(kette, kette.length, null)
      const schrift = P.farbe(kette, kette.length, vorder)
      const groesse = parseFloat(stil.fontSize)
      eintraege.push({
        text: knoten.textContent.trim().slice(0, 40),
        groesse,
        gewicht: stil.fontWeight,
        vordergrund: P.rgb(schrift),
        grund: P.rgb(grund),
        verhaeltnis: P.kontrast(schrift, grund),
        bild: P.bildGrund(traeger),
      })
      const letzter = eintraege[eintraege.length - 1]
      if (letzter.bild && wurzelElement) {
        const schlechtest = P.schlechtester(wurzelElement, traeger, vorder)
        if (schlechtest != null && schlechtest >= 4.5) {
          letzter.bild = false
          letzter.verhaeltnis = schlechtest
          letzter.vermerk = 'schlechtester Fall über jedem Untergrund'
        }
      }
      if (letzter.bild && markenBasis != null) {
        letzter.marke = markenBasis + marke
        traeger.setAttribute('data-pra-bildtext', String(letzter.marke))
        marke += 1
      }
    }
    return eintraege
  }
  P.marken = () => {
    const marken = [...document.querySelectorAll('[data-pra-bildtext]')]
    const liste = marken.map((element) => ({ index: Number(element.getAttribute('data-pra-bildtext')), text: (element.textContent || '').trim().slice(0, 40) }))
    return liste
  }
  P.markenEntfernen = () => document.querySelectorAll('[data-pra-bildtext]').forEach((element) => element.removeAttribute('data-pra-bildtext'))

  /** Symbol ohne Text: Farbe des Elements (currentColor) gegen den Grund, Grenze 3 : 1. */
  P.symbol = (element) => {
    // Trägt ein Symbol im Element seine eigene Scheibe (zum Beispiel das Info-Symbol auf einem Foto), gilt diese Scheibe als Grund.
    const mitScheibe = [...element.querySelectorAll('svg, img')].find((kind) => {
      const farbe = P.kanaele(getComputedStyle(kind).backgroundColor)
      return farbe && farbe.a > 0
    })
    if (mitScheibe) return P.symbol(mitScheibe)
    const kette = P.kette(element)
    const vorder = P.kanaele(getComputedStyle(element).color)
    if (!vorder) return null
    const grund = P.farbe(kette, kette.length, null)
    const schrift = P.farbe(kette, kette.length, vorder)
    const ergebnis = { vordergrund: P.rgb(schrift), grund: P.rgb(grund), verhaeltnis: P.kontrast(schrift, grund), bild: P.bildGrund(element) }
    if (ergebnis.bild) {
      const schlechtest = P.schlechtester(element, element, vorder)
      if (schlechtest != null && schlechtest >= 3) {
        ergebnis.bild = false
        ergebnis.verhaeltnis = schlechtest
        ergebnis.vermerk = 'schlechtester Fall über jedem Untergrund'
      }
    }
    return ergebnis
  }

  P.umgebung = (element) => {
    const kette = P.kette(element)
    return P.farbe(kette, kette.length - 1, null)
  }

  P.eigeneFlaeche = (element) => {
    const kette = P.kette(element)
    return P.farbe(kette, kette.length, null)
  }

  P.hatRahmen = (element) => {
    const stil = getComputedStyle(element)
    return ['Top', 'Right', 'Bottom', 'Left'].some((seite) => {
      const farbe = P.kanaele(stil[`border${seite}Color`])
      return parseFloat(stil[`border${seite}Width`]) >= 1 && !['none', 'hidden'].includes(stil[`border${seite}Style`]) && farbe && farbe.a > 0
    })
  }

  /**
   * Die sichtbare Begrenzung eines Eingabefelds: das Feld selbst, sonst der nächste Vorfahr, der einen Rahmen oder eine
   * andere Fläche als sein Umfeld hat (zum Beispiel ein Feld ohne eigenen Rahmen in einer umrandeten Karte).
   */
  P.huelle = (element) => {
    let huelle = element
    while (huelle.parentElement && huelle.parentElement !== document.body) {
      if (P.hatRahmen(huelle)) break
      if (P.kontrast(P.eigeneFlaeche(huelle), P.eigeneFlaeche(huelle.parentElement)) > 1.02) break
      huelle = huelle.parentElement
    }
    return huelle
  }

  /** Liegt hinter der Umgebung des Elements ein Bild oder Verlauf (Messung des Rings/der Grenze nur an Pixeln)? */
  P.umgebungBild = (element) => P.bildGrund(element.parentElement ?? element)

  P.rechteck = (element) => {
    const r = element.getBoundingClientRect()
    return { x: r.left, y: r.top, w: r.width, h: r.height }
  }

  /** Grenze eines Steuerelements: sichtbarer Rahmen und Füllung gegen die Umgebung (mit den beteiligten Farben). */
  P.grenze = (element) => {
    const stil = getComputedStyle(element)
    const umgebung = P.umgebung(element)
    const kette = P.kette(element)
    let rahmen = 1
    let rahmenFarbe = null
    for (const seite of ['Top', 'Right', 'Bottom', 'Left']) {
      const breite = parseFloat(stil[`border${seite}Width`])
      const art = stil[`border${seite}Style`]
      if (!(breite >= 1) || art === 'none' || art === 'hidden') continue
      const farbe = P.kanaele(stil[`border${seite}Color`])
      if (!farbe || farbe.a === 0) continue
      const flaeche = P.eigeneFlaeche(element)
      const gemischt = P.mischen(farbe, flaeche)
      const wert = P.kontrast(gemischt, umgebung)
      if (wert > rahmen) {
        rahmen = wert
        rahmenFarbe = { r: gemischt.r, g: gemischt.g, b: gemischt.b }
      }
    }
    const fuellungsFarbe = P.farbe(kette, kette.length, null)
    const fuellung = P.kontrast(fuellungsFarbe, umgebung)
    return {
      rahmen,
      fuellung,
      maximal: Math.max(rahmen, fuellung),
      rahmenFarbe,
      fuellungsFarbe: { r: fuellungsFarbe.r, g: fuellungsFarbe.g, b: fuellungsFarbe.b },
      umgebung: P.rgb(umgebung),
    }
  }

  /**
   * Fokusindikator des fokussierten Elements. Teile: Umriss (outline) und Ringe (Schatten ohne Weichzeichner, auch
   * innen). Ein Umriss wird über dem Schatten gemalt; von einem Schatten zählt nur das, was der Umriss nicht verdeckt.
   * Zweifarbiger Ring (Umriss + Halo): bestanden, wenn mindestens ein Teil ≥ 3 : 1 gegen seine Umgebung steht.
   */
  P.fokus = (element, vorher) => {
    const stil = getComputedStyle(element)
    const umgebung = P.umgebung(element)
    const eigene = P.eigeneFlaeche(element)
    const teile = []
    const umrissBreite = parseFloat(stil.outlineWidth)
    if (stil.outlineStyle !== 'none' && umrissBreite > 0) {
      const farbe = P.kanaele(stil.outlineColor)
      if (farbe && farbe.a > 0) {
        const versatz = parseFloat(stil.outlineOffset) || 0
        const gegen = versatz >= 0 ? umgebung : eigene
        const gemischt = P.mischen(farbe, gegen)
        teile.push({ art: 'umriss', von: versatz, bis: versatz + umrissBreite, breite: umrissBreite, verhaeltnis: P.kontrast(gemischt, gegen), farbe: P.rgb(gemischt) })
      }
    }
    const schatten = stil.boxShadow && stil.boxShadow !== 'none' ? stil.boxShadow.match(/rgba?\([^)]+\)\s+-?[\d.]+px\s+-?[\d.]+px\s+[\d.]+px(?:\s+[\d.]+px)?(?:\s+inset)?/g) : null
    for (const eintrag of schatten ?? []) {
      const teilen = eintrag.match(/(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+([\d.]+)px)?(\s+inset)?/)
      if (!teilen) continue
      const farbe = P.kanaele(teilen[1])
      const weich = Number(teilen[4])
      const spreizung = Number(teilen[5] ?? 0)
      if (!farbe || farbe.a === 0 || weich > 0 || spreizung < 1 || Number(teilen[2]) !== 0 || Number(teilen[3]) !== 0) continue
      const innen = Boolean(teilen[6])
      const gegen = innen ? eigene : umgebung
      const gemischt = P.mischen(farbe, gegen)
      teile.push({ art: innen ? 'ring-innen' : 'ring', von: innen ? -spreizung : 0, bis: innen ? 0 : spreizung, breite: spreizung, verhaeltnis: P.kontrast(gemischt, gegen), farbe: P.rgb(gemischt) })
    }
    const umriss = teile.find((t) => t.art === 'umriss')
    for (const teil of teile) {
      if (teil.art === 'umriss') continue
      // sichtbarer Anteil des Rings: abzüglich der Fläche, die der Umriss darüber verdeckt
      if (umriss && umriss.bis > teil.von && umriss.von < teil.bis) {
        const vor = Math.max(0, Math.min(teil.bis, umriss.von) - teil.von)
        const nach = Math.max(0, teil.bis - Math.max(teil.von, umriss.bis))
        teil.breite = Math.max(vor, nach)
      }
    }
    const sichtbar = teile.filter((t) => t.breite > 0)
    const beste = sichtbar.length ? sichtbar.reduce((a, b) => (b.verhaeltnis > a.verhaeltnis ? b : a)) : null
    const indikator = beste
      ? {
          art: sichtbar.length > 1 ? 'doppelring' : beste.art,
          breite: Math.max(...sichtbar.map((t) => t.breite)),
          verhaeltnis: beste.verhaeltnis,
          farbe: beste.farbe,
          teile: sichtbar,
          band: [Math.min(...sichtbar.map((t) => t.von)), Math.max(...sichtbar.map((t) => t.bis))],
        }
      : null
    const flaechenwechsel = vorher ? P.kontrast(P.eigeneFlaeche(element), vorher.flaeche) : 1
    return { indikator, flaechenwechsel, kandidaten: teile.length }
  }

  /** Nicht-Farb-Merkmale eines Elements, mit denen sich gewählt von ungewählt unterscheiden kann. */
  P.formMerkmale = (element) => {
    const stil = getComputedStyle(element)
    const davor = getComputedStyle(element, '::before')
    const danach = getComputedStyle(element, '::after')
    const rahmen = ['Top', 'Right', 'Bottom', 'Left'].map((s) => `${stil[`border${s}Width`]}/${stil[`border${s}Style`]}`).join(' ')
    const r = element.getBoundingClientRect()
    return {
      gewicht: stil.fontWeight,
      unterstrichen: stil.textDecorationLine,
      rahmen,
      umriss: `${stil.outlineStyle}/${stil.outlineWidth}`,
      davor: davor.content !== 'none' && davor.content !== 'normal' ? `${davor.content}|${davor.width}x${davor.height}|${davor.borderTopWidth}|${davor.borderRightWidth}|${davor.borderBottomWidth}` : '',
      danach: danach.content !== 'none' && danach.content !== 'normal' ? `${danach.content}|${danach.width}x${danach.height}` : '',
      symbole: element.querySelectorAll('svg, img').length,
      breite: Math.round(r.width),
    }
  }

  P.beschreibung = (element) => {
    const text = (element.getAttribute('aria-label') || element.textContent || element.getAttribute('title') || element.getAttribute('placeholder') || element.getAttribute('name') || '').trim().replace(/\s+/g, ' ').slice(0, 44)
    const klassen = typeof element.className === 'string' ? element.className.trim().split(/\s+/).slice(0, 3).join('.') : ''
    return `${element.tagName.toLowerCase()}${element.getAttribute('role') ? `[${element.getAttribute('role')}]` : ''}${klassen ? '.' + klassen : ''} «${text}»`
  }

  const TOGGLE = ['aria-pressed', 'aria-selected', 'aria-checked', 'aria-current', 'aria-expanded']
  const INTERAKTIV = 'a[href], button, summary, input:not([type=hidden]), select, textarea, [role=tab], [role=radio], [role=checkbox], [role=switch], [role=menuitem], [role=menuitemradio], [role=option], [role=button], [tabindex]:not([tabindex="-1"]), [aria-pressed], [aria-selected], [aria-checked], [aria-current]'
  const SIEGEL = '[class*="rounded-full"]:not(a):not(button):not(input), [class*="badge"], [class*="siegel"], [class*="chip"], [class*="pill"], [data-status], [data-badge]'

  /** Sammelt Messziele: interaktive Elemente (mit Auswahlzustand) und Siegel. Setzt data-pra-i. */
  P.inventar = (wurzelSelektor, grenzeJeSignatur) => {
    const wurzel = wurzelSelektor ? document.querySelector(wurzelSelektor) : document.body
    if (!wurzel) return []
    const liste = []
    const signaturen = new Map()
    let zaehler = Number(document.body.getAttribute('data-pra-zaehler') ?? 0)
    const kandidaten = [...wurzel.querySelectorAll(`${INTERAKTIV}, ${SIEGEL}`)]
    for (const element of kandidaten) {
      if (element.hasAttribute('data-pra-i')) continue
      if (element.closest('[inert], [aria-hidden="true"], .sr-only, svg')) continue
      if (!P.sichtbar(element)) continue
      if (Number(getComputedStyle(element).opacity) === 0) continue
      const geschlossen = element.closest('details:not([open])')
      if (geschlossen && !element.closest('summary')) continue
      const r = element.getBoundingClientRect()
      if (r.width < 6 || r.height < 6) continue
      // Ausserhalb des Sichtfelds (zugeklappte Schublade, versetzte Menüfläche): nicht zeigbar, nicht Teil der Ansicht.
      if (r.right <= 0 || r.left >= innerWidth) continue
      const interaktiv = element.matches(INTERAKTIV)
      if (!interaktiv && element.querySelector(INTERAKTIV)) continue
      const toggle = TOGGLE.find((name) => element.hasAttribute(name))
      const behaelter = element.closest('[role=group], [role=tablist], [role=radiogroup], [role=menu], nav, ul, ol, menu, fieldset') ?? element.parentElement
      if (behaelter && !behaelter.hasAttribute('data-pra-g')) behaelter.setAttribute('data-pra-g', String(document.querySelectorAll('[data-pra-g]').length + 1))
      const text = (element.textContent || '').trim()
      const hatText = text.length > 0
      if (!interaktiv && !hatText) continue
      const ziel = interaktiv ? 'steuerelement' : 'siegel'
      const klassen = typeof element.className === 'string' ? element.className : ''
      const signatur = [element.tagName, element.getAttribute('role') ?? '', element.getAttribute('type') ?? '', klassen, toggle ?? '', element.disabled ? 'd' : '', ziel].join('|')
      const anzahl = signaturen.get(signatur) ?? 0
      const obergrenze = toggle ? 60 : grenzeJeSignatur
      if (anzahl >= obergrenze) continue
      signaturen.set(signatur, anzahl + 1)
      zaehler += 1
      element.setAttribute('data-pra-i', String(zaehler))
      liste.push({
        i: zaehler,
        art: ziel,
        beschreibung: P.beschreibung(element),
        tag: element.tagName.toLowerCase(),
        toggle: toggle ?? null,
        toggleWert: toggle ? element.getAttribute(toggle) : null,
        gruppe: behaelter ? behaelter.getAttribute('data-pra-g') : null,
        deaktiviert: Boolean(element.disabled) || element.getAttribute('aria-disabled') === 'true',
        feld: ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName),
        signatur,
      })
    }
    document.body.setAttribute('data-pra-zaehler', String(zaehler))
    return liste
  }

  P.element = (i) => document.querySelector(`[data-pra-i="${i}"]`)

  P.mitte = async (i) => {
    const element = P.element(i)
    if (!element) return null
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
    // Leaflet setzt das Scrollen seines Containers im nächsten Bild zurück; erst danach gilt die Lage des Elements.
    await new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)))
    const r = element.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const oben = document.elementFromPoint(x, y)
    return { x, y, erreichbar: Boolean(oben && (element === oben || element.contains(oben) || oben.contains(element))) }
  }

  /** Setzt den Auswahlzustand nur als Attribut (zeigt, wie das CSS auf ihn antwortet); die App-Logik bleibt unberührt. */
  P.setzeAuswahl = (i, name, wert) => {
    const element = P.element(i)
    if (!element) return false
    if (!element.hasAttribute('data-pra-orig')) element.setAttribute('data-pra-orig', element.getAttribute(name) ?? '__fehlt__')
    if (wert === null) element.removeAttribute(name)
    else element.setAttribute(name, wert)
    return true
  }
  P.stelleHer = (i, name) => {
    const element = P.element(i)
    if (!element) return
    const orig = element.getAttribute('data-pra-orig')
    if (orig === null) return
    if (orig === '__fehlt__') element.removeAttribute(name)
    else element.setAttribute(name, orig)
    element.removeAttribute('data-pra-orig')
  }

  P.abwarten = async (grenzeMs = 1500) => {
    const laufend = () => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity)
    const bild = () => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)))
    const ende = performance.now() + grenzeMs
    // Einblendungen starten oft erst, wenn ein Beobachter nach dem Scrollen im nächsten Bild feuert: nach jedem Durchgang
    // zwei Bilder abwarten und erneut prüfen, bis zweimal hintereinander nichts mehr läuft.
    let ruhig = 0
    while (ruhig < 2 && performance.now() < ende) {
      await bild()
      if (laufend().length === 0) {
        ruhig += 1
        continue
      }
      ruhig = 0
      await Promise.race([Promise.all(laufend().map((a) => a.finished.catch(() => undefined))), new Promise((fertig) => setTimeout(fertig, 120))])
    }
  }

  /** Eine Messung am Element im aktuell hergestellten Zustand. */
  P.messen = (i, optionen) => {
    const element = P.element(i)
    if (!element) return { fehlt: true }
    const r = element.getBoundingClientRect()
    const stil = getComputedStyle(element)
    const texte = P.text(element, optionen?.markenBasis ?? null)
    const ergebnis = {
      treffer: {
        hover: element.matches(':hover'),
        fokusSichtbar: element.matches(':focus-visible'),
        fokus: element === document.activeElement,
        aktiv: element.matches(':active'),
      },
      ziel: { breite: Math.round(r.width * 10) / 10, hoehe: Math.round(r.height * 10) / 10 },
      textfarbeRoh: stil.color,
      grundRoh: stil.backgroundColor,
      texte: texte.slice(0, 6),
      anzahlTexte: texte.length,
      formMerkmale: P.formMerkmale(element),
      flaeche: P.rgb(P.eigeneFlaeche(element)),
    }
    if (texte.length) {
      const ohneBild = texte.filter((t) => !t.bild)
      if (ohneBild.length) ergebnis.kleinster = ohneBild.reduce((a, b) => (b.verhaeltnis < a.verhaeltnis ? b : a))
      ergebnis.bildTexte = texte.filter((t) => t.bild).length
      ergebnis.bildgrund = ergebnis.bildTexte > 0
    } else {
      ergebnis.symbol = P.symbol(element)
      ergebnis.bildgrund = Boolean(ergebnis.symbol?.bild)
    }
    const huelle = element.matches('input, select, textarea') ? P.huelle(element) : element
    ergebnis.huelle = huelle === element ? null : { beschreibung: P.beschreibung(huelle), rechteck: P.rechteck(huelle), umgebungBild: P.umgebungBild(huelle) }
    ergebnis.grenze = P.grenze(huelle)
    ergebnis.rechteck = P.rechteck(element)
    ergebnis.umgebungBild = P.umgebungBild(element)
    ergebnis.eigenerBildgrund = P.bildGrund(element)
    if (optionen?.fokus) ergebnis.fokus = P.fokus(element, optionen.vorher)
    return ergebnis
  }

  return true
}

/**
 * Pixelmessung eines Rings oder einer Begrenzung auf Bild oder Verlauf (läuft im Node-Prozess).
 * Aufgenommen wird der Zustand ohne den Umriss; gemessen wird die Farbe des Indikators gegen jedes Pixel im Band
 * [von, bis] (vorzeichenbehafteter Abstand zum Elementrechteck in CSS-px, aussen positiv). Rückgabe: schlechtester
 * Kontrast und der Wert, den 90 % der Pixel erreichen.
 */
export async function bandMessen(seite, { rechteck, von, bis, farben, ausblenden }) {
  const rand = Math.ceil(Math.max(Math.abs(von), Math.abs(bis))) + 2
  const sicht = await seite.evaluate(() => ({ b: innerWidth, h: innerHeight }))
  const x0 = Math.max(0, Math.floor(rechteck.x - rand))
  const y0 = Math.max(0, Math.floor(rechteck.y - rand))
  const x1 = Math.min(sicht.b, Math.ceil(rechteck.x + rechteck.w + rand))
  const y1 = Math.min(sicht.h, Math.ceil(rechteck.y + rechteck.h + rand))
  if (x1 - x0 < 2 || y1 - y0 < 2) return null
  if (ausblenden) {
    await seite.evaluate((css) => {
      document.getElementById('pra-ring-aus')?.remove()
      const stil = document.createElement('style')
      stil.id = 'pra-ring-aus'
      stil.textContent = css
      document.head.append(stil)
      return new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)))
    }, ausblenden)
  }
  let bild
  try {
    bild = (await seite.screenshot({ clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } })).toString('base64')
  } finally {
    if (ausblenden) await seite.evaluate(() => document.getElementById('pra-ring-aus')?.remove())
  }
  return seite.evaluate(
    async ({ bild: daten, x0: ox, y0: oy, clipBreite, rechteck: r, von: a, bis: b, farben: fs }) => {
      const grafik = new Image()
      grafik.src = `data:image/png;base64,${daten}`
      await grafik.decode()
      const leinwand = document.createElement('canvas')
      leinwand.width = grafik.width
      leinwand.height = grafik.height
      const kontext = leinwand.getContext('2d', { willReadFrequently: true })
      kontext.drawImage(grafik, 0, 0)
      const massstab = grafik.width / clipBreite
      const daten2 = kontext.getImageData(0, 0, grafik.width, grafik.height).data
      const licht = (rr, gg, bb) => {
        const l = [rr, gg, bb].map((k) => {
          const v = k / 255
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
      }
      const lfs = fs.map((f) => licht(f.r, f.g, f.b))
      const werte = []
      for (let y = 0; y < grafik.height; y += 1) {
        for (let x = 0; x < grafik.width; x += 1) {
          const px = ox + (x + 0.5) / massstab
          const py = oy + (y + 0.5) / massstab
          const dx = Math.max(r.x - px, px - (r.x + r.w), 0)
          const dy = Math.max(r.y - py, py - (r.y + r.h), 0)
          const aussen = Math.hypot(dx, dy)
          const abstand = aussen > 0 ? aussen : -Math.min(px - r.x, r.x + r.w - px, py - r.y, r.y + r.h - py)
          if (abstand < a || abstand > b) continue
          const i = (y * grafik.width + x) * 4
          const lg = licht(daten2[i], daten2[i + 1], daten2[i + 2])
          werte.push(Math.max(...lfs.map((lf) => (Math.max(lf, lg) + 0.05) / (Math.min(lf, lg) + 0.05))))
        }
      }
      if (!werte.length) return null
      werte.sort((p, q) => p - q)
      return { schlechtester: werte[0], p10: werte[Math.floor(werte.length * 0.1)], pixel: werte.length }
    },
    { bild, x0, y0, clipBreite: x1 - x0, rechteck, von, bis, farben },
  )
}

/** Urteil für eine Messung (läuft im Node-Prozess). `pixel` trägt die Ergebnisse der Pixelmessungen auf Bild/Verlauf. */
export function urteilen(messung, { interaktion, feld, pixel }) {
  const gruende = []
  const offen = []
  if (!messung || messung.fehlt) return { urteil: 'OFFEN', gruende, offen: ['Element nicht mehr vorhanden'] }
  const zustandHergestellt =
    interaktion === 'hover' ? messung.treffer.hover : interaktion === 'fokus' ? messung.treffer.fokusSichtbar : interaktion === 'aktiv' ? messung.treffer.aktiv : true
  if (!zustandHergestellt) offen.push(`Zustand «${interaktion}» liess sich nicht herstellen`)

  if (messung.kleinster && messung.kleinster.verhaeltnis < TEXT_GRENZE) {
    gruende.push(`Text ${messung.kleinster.verhaeltnis.toFixed(4)}:1 < 4,5:1 («${messung.kleinster.text}» ${messung.kleinster.vordergrund} auf ${messung.kleinster.grund})`)
  }
  if (!messung.kleinster && !messung.bildgrund) {
    if (messung.symbol) {
      if (messung.symbol.verhaeltnis < DREI) gruende.push(`Symbol ${messung.symbol.verhaeltnis.toFixed(4)}:1 < 3:1`)
    } else if (!feld) {
      offen.push('Weder Text noch Symbol messbar')
    }
  }
  if (messung.bildgrund) {
    const werte = pixel?.text ?? []
    if (messung.symbol && !messung.anzahlTexte) offen.push('Symbol auf Bild oder Verlauf: nur der Text wird an Pixeln gemessen')
    for (const wert of werte) {
      if (wert.verdeckt) offen.push(`Text «${wert.text}» auf Bild ist verdeckt oder ausserhalb des Sichtfelds`)
      else if (wert.ohneBuchstaben || wert.p01 == null) offen.push(`Text «${wert.text}» auf Bild: keine Buchstabenpixel gefunden`)
      else if (wert.p01 < TEXT_GRENZE) gruende.push(`Text «${wert.text}» auf Bild ${wert.p01.toFixed(4)}:1 (Pixel, schlechtestes Prozent) < 4,5:1; schlechtester Pixel ${wert.schlechtester.toFixed(4)}:1`)
    }
    if (!werte.length) offen.push('Text auf Bild oder Verlauf: Pixelmessung nicht durchgeführt')
  }

  if (interaktion === 'fokus' && zustandHergestellt && messung.fokus) {
    const indikator = messung.fokus.indikator
    const imBild = pixel?.fokus
    if (imBild) {
      if (imBild.p10 < DREI) gruende.push(`Fokusindikator auf Bild/Verlauf ${imBild.p10.toFixed(4)}:1 (Pixel, 90 % der Pixel) < 3:1; schlechtester Pixel ${imBild.schlechtester.toFixed(4)}:1`)
      if (indikator && indikator.breite < 2) gruende.push(`Fokusumriss ${indikator.breite}px < 2px`)
    } else if (pixel?.fokusOffen) {
      offen.push(pixel.fokusOffen)
    } else if (!indikator) {
      if (messung.fokus.flaechenwechsel < DREI) gruende.push('kein sichtbarer Fokusindikator (kein Umriss, kein Ring, Flächenwechsel < 3:1)')
    } else if (indikator.breite < 2 || indikator.verhaeltnis < DREI) {
      if (messung.fokus.flaechenwechsel < DREI) gruende.push(`Fokusindikator ${indikator.art} ${indikator.breite}px ${indikator.verhaeltnis.toFixed(4)}:1 (verlangt ≥2px und ≥3:1)`)
    }
  }

  if (feld) {
    if (pixel?.grenze) {
      if (pixel.grenze.p10 < DREI) gruende.push(`Feldgrenze auf Bild/Verlauf ${pixel.grenze.p10.toFixed(4)}:1 (Pixel, 90 % der Pixel) < 3:1`)
    } else if (pixel?.grenzeOffen) {
      offen.push(pixel.grenzeOffen)
    } else if (messung.grenze.maximal < DREI) {
      gruende.push(`Feldgrenze ${messung.grenze.maximal.toFixed(4)}:1 < 3:1${messung.huelle ? ` (Begrenzung: ${messung.huelle.beschreibung})` : ''}`)
    }
  }
  if (gruende.length) return { urteil: 'FAIL', gruende, offen }
  if (offen.length) return { urteil: 'OFFEN', gruende, offen }
  return { urteil: 'PASS', gruende, offen }
}
