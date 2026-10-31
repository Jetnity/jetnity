// lib/providers/twelve-go/widget/freigabe.ts
//
// Produktionsfreigabe des offiziellen 12Go-Suchformulars.
// Bleibt zu, solange Einwilligung und abgeschottete Einbettung nicht
// freigegeben sind. Kein Prop und kein Aufrufer darf das überschreiben.

export const TWELVE_GO_WIDGET_FREIGABE: {
  readonly status: 'CONSENT_BLOCKED'
  readonly ausfuehrbar: boolean
  readonly isolation: 'NOT_ESTABLISHED'
} = Object.freeze({
  status: 'CONSENT_BLOCKED',
  ausfuehrbar: false,
  isolation: 'NOT_ESTABLISHED',
})
