// lib/mobility/suche-ausloeser.ts
//
// S3: Die Workspace-Mobilitätssuche darf nicht bei Render, Navigation
// oder Suchvorbereitung von selbst laufen. Nur eine ausdrückliche
// Nutzeraktion darf /api/mobility/search anfassen.

export function mobilitySucheStartetAutomatisch(): boolean {
  return false
}
