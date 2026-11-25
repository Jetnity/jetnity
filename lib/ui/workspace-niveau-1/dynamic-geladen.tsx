import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

type Modul = { default: ComponentType<Record<string, unknown>> }

/**
 * Ersatz für `next/dynamic` im Darstellungstest. Anders als der Platzhalter der
 * Palettenprüfung lädt er die echte Komponente (Einreise-Prüfer, Verbindungen,
 * Reise ändern), damit deren Formulare und Karten gemessen werden.
 */
export default function dynamic(
  lader: () => Promise<Modul | ComponentType<Record<string, unknown>>>,
  optionen?: { loading?: () => ReactNode },
) {
  return function GeladeneKomponente(props: Record<string, unknown>) {
    const [Komponente, setzeKomponente] = useState<ComponentType<Record<string, unknown>> | null>(null)
    useEffect(() => {
      let aktiv = true
      void lader().then((modul) => {
        if (!aktiv) return
        const geladen = 'default' in (modul as object) ? (modul as Modul).default : (modul as ComponentType<Record<string, unknown>>)
        setzeKomponente(() => geladen)
      })
      return () => {
        aktiv = false
      }
    }, [])
    if (!Komponente) return optionen?.loading ? <>{optionen.loading()}</> : null
    return <Komponente {...props} />
  }
}
