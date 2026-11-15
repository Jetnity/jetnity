type Sichtbereich = { width: number; height: number; offsetLeft: number; offsetTop: number }
type Groesse = { width: number; height: number }
type Anker = { left: number; top: number; bottom: number }

/** Coordinates in the layout viewport; also respects the visual viewport after zoom. */
export function kalenderPosition(viewport: Sichtbereich, dialog: Groesse, anker?: Anker) {
  const mobil = viewport.width <= 640
  const rand = mobil ? 8 : 16
  const minLeft = viewport.offsetLeft + rand
  const minTop = viewport.offsetTop + rand
  const maxLeft = Math.max(minLeft, viewport.offsetLeft + viewport.width - dialog.width - rand)
  const maxTop = Math.max(minTop, viewport.offsetTop + viewport.height - dialog.height - rand)
  const unten = (anker?.bottom ?? minTop) + 10
  const oben = (anker?.top ?? minTop) - dialog.height - 10
  const top = mobil ? maxTop : unten <= maxTop ? unten : oben >= minTop ? oben : minTop + (maxTop - minTop) / 2
  return { left: mobil ? minLeft : Math.max(minLeft, Math.min(anker?.left ?? minLeft, maxLeft)), top: Math.max(minTop, Math.min(top, maxTop)) }
}
