'use client'

import { Sparkle, Compass, Sun, Mountain, Ship, Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const inspirations = [
  {
    icon: <Sun className="w-6 h-6 text-amber-500" />,
    title: 'Sommerziele',
    description: 'Entdecke die sonnigsten Hotspots weltweit – jetzt zur Hauptreisezeit.',
    action: 'Beliebte Ziele',
    type: 'summer',
  },
  {
    icon: <Mountain className="w-6 h-6 text-green-600" />,
    title: 'Berge & Natur',
    description: 'Wandern, entdecken, abschalten: Top-Regionen für Aktivurlaub & Wellness.',
    action: 'Natur entdecken',
    type: 'nature',
  },
  {
    icon: <Ship className="w-6 h-6 text-blue-500" />,
    title: 'Kreuzfahrt Trends',
    description: 'Die besten Routen und Schiffe für die Saison – inklusive Frühbucher-Vorteile.',
    action: 'Jetzt ansehen',
    type: 'cruise',
  },
  {
    icon: <Users2 className="w-6 h-6 text-rose-500" />,
    title: 'Familien- & Gruppenreisen',
    description: 'Die schönsten Resorts & Abenteuer für Familien, Gruppen, Clubs.',
    action: 'Familienurlaub',
    type: 'family',
  },
  {
    icon: <Compass className="w-6 h-6 text-purple-500" />,
    title: 'Geheimtipps',
    description: 'Unentdeckte Destinationen für Genießer & Entdecker, exklusiv von Jetnity AI.',
    action: 'Geheimtipp entdecken',
    type: 'secret',
  },
]

export default function InspirationPanel() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-8 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {inspirations.map((item) => (
        <div
          key={item.type}
          className={cn(
            'bg-white/80 border rounded-2xl shadow-lg flex flex-col gap-2 items-start p-4 hover:shadow-xl transition-all group cursor-pointer'
          )}
          tabIndex={0}
          aria-label={item.title}
        >
          <div className="flex items-center gap-2 mb-2">{item.icon}<span className="font-bold text-lg">{item.title}</span></div>
          <div className="text-xs text-muted-foreground mb-2">{item.description}</div>
          <button
            className="mt-auto px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
            type="button"
            tabIndex={-1}
          >
            <Sparkle className="inline-block mr-1 w-3 h-3" /> {item.action}
          </button>
        </div>
      ))}
    </div>
  )
}
