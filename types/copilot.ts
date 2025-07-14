export type CopilotSuggestion = {
  type: "creator" | "trip" | "region" | "mood"
  title: string
  subtitle?: string
  image?: string
  link?: string
}
