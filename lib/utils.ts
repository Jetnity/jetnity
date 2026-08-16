// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Fuehrt Klassenlisten zusammen und laesst spaetere Tailwind-Klassen frueheren
 * vorgehen. Ohne twMerge stehen `px-2` und `px-4` beide im Attribut und es
 * entscheidet die Reihenfolge im erzeugten Stylesheet, nicht die im Aufruf.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
