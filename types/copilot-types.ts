export type CopilotSuggestionType = 'region' | 'mood' | 'general'

export type CopilotSuggestion = {
  type: CopilotSuggestionType
  title: string
  subtitle?: string
  link?: string
}
