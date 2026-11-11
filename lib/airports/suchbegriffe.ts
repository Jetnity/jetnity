// City aliases only prepare a catalog query; they never choose or invent an airport.
const STADTNAMEN: Readonly<Record<string, string>> = {
  wien: 'Vienna',
  muenchen: 'Munich',
  munchen: 'Munich',
  koeln: 'Cologne',
  koln: 'Cologne',
  nuernberg: 'Nuremberg',
  nurnberg: 'Nuremberg',
  genf: 'Geneva',
  mailand: 'Milan',
  rom: 'Rome',
  venedig: 'Venice',
  florenz: 'Florence',
  neapel: 'Naples',
  athen: 'Athens',
  kopenhagen: 'Copenhagen',
  lissabon: 'Lisbon',
  peking: 'Beijing',
  bruessel: 'Brussels',
  brussel: 'Brussels',
  warschau: 'Warsaw',
}

export function flughafenSuchbegriff(text: string): string {
  const key = text.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  return STADTNAMEN[key] ?? text.trim()
}
