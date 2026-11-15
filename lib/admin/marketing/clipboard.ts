type KopierErgebnis = 'kopiert' | 'fehlgeschlagen'
type KopierStart = { status: 'beschaeftigt' } | { status: 'gestartet'; ergebnis: Promise<KopierErgebnis> }

export type MarketingKopiertransport = {
  istBeschaeftigt: () => boolean
  beobachten: (listener: () => void) => () => void
  starten: (schreiben: () => Promise<void>) => KopierStart
}

// A Document is the lifetime key. No URL, campaign, account or persistent state is indexed here.
// A UI deadline/unmount never releases the actual outstanding OS operation.
const dokumente = new WeakMap<object, MarketingKopiertransport>()

export function marketingKopiertransportFuer(dokument: object): MarketingKopiertransport {
  const vorhanden = dokumente.get(dokument)
  if (vorhanden) return vorhanden
  let beschaeftigt = false
  const listeners = new Set<() => void>()
  const melden = () => {
    for (const listener of listeners) {
      try { listener() } catch { /* A disposed observer cannot release or strand the transport. */ }
    }
  }
  const transport: MarketingKopiertransport = {
    istBeschaeftigt: () => beschaeftigt,
    beobachten: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    starten: (schreiben) => {
      if (beschaeftigt) return { status: 'beschaeftigt' }
      beschaeftigt = true
      melden()
      // Invoke synchronously during the user's gesture, before the first await.
      let operation: Promise<void>
      try {
        operation = schreiben()
        if (!operation || typeof operation.then !== 'function') throw new Error('invalid_clipboard_reply')
      } catch {
        beschaeftigt = false
        melden()
        return { status: 'gestartet', ergebnis: Promise.resolve('fehlgeschlagen') }
      }
      const ergebnis = Promise.resolve(operation).then(
        (): KopierErgebnis => 'kopiert',
        (): KopierErgebnis => 'fehlgeschlagen',
      ).then((result) => {
        beschaeftigt = false
        melden()
        return result
      })
      return { status: 'gestartet', ergebnis }
    },
  }
  dokumente.set(dokument, transport)
  return transport
}
