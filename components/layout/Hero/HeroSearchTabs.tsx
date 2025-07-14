'use client'

import { useState } from 'react'
import clsx from 'clsx'

const TABS = ['Flüge', 'Hotels', 'Mietwagen', 'Aktivitäten', 'Kreuzfahrten']

export default function HeroSearchTabs() {
  const [activeTab, setActiveTab] = useState('Flüge')

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-2xl mx-auto">
      <div className="flex space-x-2 mb-4 overflow-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium',
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Placeholder für dynamische Formelemente */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Startort / Abflughafen"
          className="border p-2 rounded-md"
        />
        <input
          type="date"
          placeholder="Datum"
          className="border p-2 rounded-md"
        />
        <input
          type="number"
          placeholder="Personen"
          className="border p-2 rounded-md"
        />
        <button className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700">
          Suchen
        </button>
      </div>
    </div>
  )
}
