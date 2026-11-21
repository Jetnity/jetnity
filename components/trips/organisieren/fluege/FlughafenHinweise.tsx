export type FlughafenHinweis = { id: string; feld: string; text: string | null }

export default function FlughafenHinweise({ hinweise }: { hinweise: FlughafenHinweis[] }) {
  const sichtbar = hinweise.filter((h): h is FlughafenHinweis & { text: string } => Boolean(h.text))
  if (sichtbar.length === 0) return null
  return (
    <ul className="flug-vorschlaege" aria-live="polite">
      {sichtbar.map((h) => (
        <li key={h.id} id={h.id}>
          <strong>{h.feld}:</strong> {h.text}
        </li>
      ))}
    </ul>
  )
}
