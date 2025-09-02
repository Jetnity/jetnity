// types/copilot-types.ts

/** Zulässige Suggestion-Typen als konstante Union */
export const CopilotSuggestionTypes = [
  'creator',
  'trip',
  'region',
  'mood',
  'general',
] as const;

export type CopilotSuggestionType = typeof CopilotSuggestionTypes[number];

/** Gemeinsames Datamodell für Vorschläge im Copilot-UI */
export type CopilotSuggestion = {
  /** Discriminant – steuert Rendering/CTA-Logik im UI */
  type: CopilotSuggestionType;

  /** Primärer Titel der Kachel / Liste */
  title: string;

  /** Untertitel / Zusatzinfo (optional) */
  subtitle?: string;

  /** Optionales Vorschaubild (URL) */
  image?: string | null;

  /** Ziel-Link (interne Route oder absolute URL) */
  link?: string;

  /** Optionale Metadaten, wenn du Slugs/IDs weiterreichen magst */
  slug?: string;
  id?: string;
};
