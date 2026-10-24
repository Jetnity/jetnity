export function createHash(): never {
  throw new Error('Der Fingerabdruck wird nur im Node-Lader berechnet.')
}
