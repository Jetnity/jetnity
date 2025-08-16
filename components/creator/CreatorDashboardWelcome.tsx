'use client'

import type { CopilotSuggestion } from '@/types/copilot-types'

type Props = { suggestions: CopilotSuggestion[] }

export default function CreatorDashboardWelcome({ suggestions }: Props) {
  return (
    <div className="relative bg-gradient-to-r from-blue-200 via-blue-50 to-white dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 shadow-2xl rounded-3xl p-8 overflow-hidden">
      <h2 className="text-3xl font-extrabold mb-4 text-blue-900 dark:text-blue-200">
        <span className="mr-2">🤖</span>
        Jetnity Copilot – Deine Empfehlungen
      </h2>
      <ul className="space-y-5">
        {suggestions.map((s, i) => (
          <li key={i} className="bg-white/70 dark:bg-blue-900/60 border-l-4 border-blue-500/80 shadow p-5 rounded-2xl hover:scale-[1.02] transition-all">
            <div className="font-semibold text-lg text-blue-800 dark:text-blue-100">{s.title}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-300">{s.subtitle}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
