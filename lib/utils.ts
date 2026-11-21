// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Eigene Stufen aus tailwind.config.js. Ohne diese Angabe ordnet tailwind-merge
// `text-title` den Textfarben zu und verwirft es neben `text-brand-800`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'title', 'subtitle', 'body', 'meta', 'kicker'] }],
      rounded: [{ rounded: ['control', 'card', 'panel'] }],
      shadow: [{ shadow: ['e1', 'card', 'raised'] }],
    },
  },
})

/**
 * Fuehrt Klassenlisten zusammen und laesst spaetere Tailwind-Klassen frueheren
 * vorgehen. Ohne twMerge stehen `px-2` und `px-4` beide im Attribut und es
 * entscheidet die Reihenfolge im erzeugten Stylesheet, nicht die im Aufruf.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
