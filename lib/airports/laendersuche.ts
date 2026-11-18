import { ISO_3166_1_ALPHA2 } from '@/lib/country/katalog'

const namen = ['de', 'en'].map(locale => new Intl.DisplayNames([locale], { type: 'region' }))
const falten = (text: string) => text.trim().toLowerCase().replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').normalize('NFD').replace(/\p{M}/gu, '')
const laender = ISO_3166_1_ALPHA2.map(code => ({
  code,
  namen: namen.map(anzeige => falten(anzeige.of(code) ?? code)),
}))

/** Country prefixes help select airports; a country is never a flight destination code. */
export function flughafenLaender(text: string): string[] {
  const q = falten(text)
  if (q.length < 4) return []
  return laender.filter(land => land.namen.some(name => name.startsWith(q))).map(land => land.code)
}

export function flughafenLandPasst(code: string | null | undefined, name: string | null, suche: string): boolean {
  const codes = flughafenLaender(suche)
  return codes.some(treffer => code === treffer || laender.find(land => land.code === treffer)?.namen.includes(falten(name ?? '')))
}
