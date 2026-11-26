import { ILLUSTRATIONSHINWEIS } from '@/lib/trips/organisieren/bildnachweise'
import { cn } from '@/lib/utils'

/**
 * Dezenter, sichtbarer Hinweis am Bild einer KI-Illustration. Das Bild gehört in einen Container mit
 * `position: relative`. Der Hinweis hat einen eigenen, fast deckenden dunklen Grund: sein Kontrast hängt
 * damit nicht vom Bild dahinter ab (weiss auf mindestens Grau 51, schlechtester Fall 12,6 : 1).
 */
export function IllustrationsHinweis({ className }: { className?: string }) {
  return (
    <span
      data-illustrationshinweis
      className={cn(
        'pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] rounded-full bg-black/80 px-2.5 py-1 text-xs font-semibold leading-4 text-white',
        className,
      )}
    >
      {ILLUSTRATIONSHINWEIS}
    </span>
  )
}
