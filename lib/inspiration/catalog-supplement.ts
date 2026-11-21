const MINIMUM_PUBLISHED_IDEAS = 8

/** Combines already validated public ideas with the approved static catalogue.
 * Publication and content validation remain the caller's responsibility. */
export function supplementInspirationCatalog<T extends Readonly<{ placeId: string }>>(
  published: readonly T[],
  catalog: readonly T[],
): readonly T[] {
  const selected: T[] = []
  const seen = new Set<string>()
  for (const idea of published) {
    if (seen.has(idea.placeId)) continue
    seen.add(idea.placeId)
    selected.push(idea)
  }
  if (selected.length >= MINIMUM_PUBLISHED_IDEAS) return selected
  for (const idea of catalog) {
    if (seen.has(idea.placeId)) continue
    seen.add(idea.placeId)
    selected.push(idea)
  }
  return selected
}
