// types/views.ts

/** Kennzahlen je Client-Session (Reporting/Analytics) */
export interface CreatorSessionMetrics {
  /** Client-generierte Session-ID (UUID v4 empfohlen) */
  session_id: string;

  /** Anzahl Detail-/Story-Views in dieser Session (>= 0) */
  views: number;

  /** Anzahl Feed-Impressions in dieser Session (>= 0) */
  impressions: number;
}
