// lib/trips/ux-u1a-shell-1.ts
//
// UX V1 U1-A: which posture the four workspace modes use.
// Pure measurements in, one posture out. No trip truth, no provider, no URL.

export type ShellMessung = {
  viewportBreite: number
  rootSchriftPx: number
  browserZoom: number
  tastatur: boolean
}

export type ShellNavLage = 'sticky' | 'bottom' | 'flow'

/** CSS pixels. 320 and below leave the fixed bottom bar. */
export const UX_U1A_SCHMAL_BIS_PX = 320
/** Ordinary phone widths use the bottom bar. 768 and above keep sticky tabs. */
export const UX_U1A_PHONE_BIS_PX = 768
/** Matches the existing compact workspace breakpoint. */
export const UX_U1A_DESKTOP_AB_PX = 1024
/** 200% of the 16px root. Separate from browser zoom. */
export const UX_U1A_ROOT_GROSS_PX = 32
export const UX_U1A_ZOOM_AB = 1.9
/** Layout viewport minus visual viewport, above browser chrome noise. */
export const UX_U1A_TASTATUR_AB_PX = 80

export function shellRootSchriftPx(computedFontSize: string): number {
  const px = Number.parseFloat(computedFontSize)
  return Number.isFinite(px) && px > 0 ? px : 16
}

export function shellBrowserZoom(eingabe: {
  innerWidth: number
  outerWidth: number
  visualScale: number | null
}): number {
  const scale = eingabe.visualScale
  if (scale != null && Number.isFinite(scale) && scale >= UX_U1A_ZOOM_AB && scale <= 4) return scale
  if (eingabe.outerWidth >= 200 && eingabe.innerWidth > 0) {
    const ratio = eingabe.outerWidth / eingabe.innerWidth
    if (ratio >= UX_U1A_ZOOM_AB && ratio <= 4) return ratio
  }
  return 1
}

export function shellTastaturOffen(eingabe: {
  innerHeight: number
  visualHeight: number | null
  visualOffsetTop: number
}): boolean {
  if (eingabe.visualHeight == null || !Number.isFinite(eingabe.visualHeight)) return false
  const delta = eingabe.innerHeight - eingabe.visualHeight - Math.max(0, eingabe.visualOffsetTop)
  return delta > UX_U1A_TASTATUR_AB_PX
}

export function shellNavLage(eingabe: ShellMessung & { detailOffen: boolean }): ShellNavLage {
  const eng =
    eingabe.viewportBreite <= UX_U1A_SCHMAL_BIS_PX ||
    eingabe.rootSchriftPx >= UX_U1A_ROOT_GROSS_PX ||
    eingabe.browserZoom >= UX_U1A_ZOOM_AB ||
    eingabe.tastatur
  if (eng) return 'flow'
  if (eingabe.detailOffen && eingabe.viewportBreite < UX_U1A_DESKTOP_AB_PX) return 'flow'
  if (eingabe.viewportBreite < UX_U1A_PHONE_BIS_PX) return 'bottom'
  return 'sticky'
}
