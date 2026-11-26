import type { Bildnachweis } from '@/lib/trips/organisieren/bildnachweise'
import { cn } from '@/lib/utils'

export type BildnachweisEintrag = { bezug: string; nachweis: Bildnachweis }

function hostname(adresse: string): string {
  try {
    return new URL(adresse).hostname
  } catch {
    return adresse
  }
}

/** Der zugängliche Name enthält den sichtbaren Text und kündigt den neuen Tab an (WCAG 2.5.3). Kein verstecktes Textstück im Link. */
function ExternerLink({ href, text }: { href: string; text: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${text} (öffnet in neuem Tab)`} className="underline underline-offset-2">
      {text}
    </a>
  )
}

/**
 * Sichtbare Bildnachweise der Seite: Urheber, Original, Lizenz und Bearbeitung jedes
 * gezeigten Fotos. Eine Liste ohne Aufklappen, damit der Nachweis ohne JavaScript und
 * ohne Tippen lesbar bleibt. Doppelte Einträge für dasselbe Foto und denselben Bezug
 * erscheinen einmal.
 */
export function Bildnachweisliste({
  eintraege,
  id,
  className,
}: {
  eintraege: readonly BildnachweisEintrag[]
  id: string
  className?: string
}) {
  const sichtbar = eintraege.filter(
    (eintrag, index) =>
      eintraege.findIndex((andere) => andere.bezug === eintrag.bezug && andere.nachweis.datei === eintrag.nachweis.datei) === index,
  )
  if (sichtbar.length === 0) return null
  const titelId = `${id}-titel`

  return (
    <section id={id} data-bildnachweise aria-labelledby={titelId} className={cn('text-xs leading-5', className)}>
      <h2 id={titelId} className="font-semibold">Bildnachweise</h2>
      <ul className="mt-2 grid gap-1.5">
        {sichtbar.map(({ bezug, nachweis }) => (
          <li key={`${bezug}:${nachweis.datei}`} className="min-w-0 break-words">
            <span className="font-semibold">{bezug}:</span> «{nachweis.bildtitel}»
            {nachweis.urheber ? `, ${nachweis.urheber}` : ''}
            {', '}
            {nachweis.lizenzUrl ? <ExternerLink href={nachweis.lizenzUrl} text={nachweis.lizenz} /> : nachweis.lizenz}
            {', Quelle: '}
            <ExternerLink href={nachweis.quelleUrl} text={hostname(nachweis.quelleUrl)} />
            {'. '}
            {nachweis.bearbeitung}
          </li>
        ))}
      </ul>
    </section>
  )
}
