'use client'

import type { CopilotSuggestion } from '@/types/copilot-types'

type Props = {
  suggestions: CopilotSuggestion[]
}

export default function CreatorDashboardWelcome({ suggestions }: Props) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-4">Deine Empfehlungen</h2>
      <ul className="space-y-4">
        {suggestions.map((s, index) => (
          <li key={index} className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
            <h3 className="font-semibold text-lg">{s.title}</h3>
            <p className="text-sm text-gray-600">{s.subtitle}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
