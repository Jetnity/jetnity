/**
 * Read the public city-photo request contract without triggering provider IO.
 *
 * Vercel's temporary deployment-share access appends a single _vercel_share
 * query marker, also when resolving the public custom domain through a
 * Vercel-authenticated browser. This is not a place identifier and never
 * affects the selected city. All other unknown/duplicate parameters fail
 * closed, as before. No share value is echoed or logged.
 */
export function cityPhotoQuery(params: URLSearchParams):
  | { place: string; country: string }
  | null {
  for (const key of params.keys()) {
    if (key !== 'place' && key !== 'country' && key !== '_vercel_share') return null
  }
  if (params.getAll('place').length !== 1 || params.getAll('country').length !== 1) return null
  const shares = params.getAll('_vercel_share')
  if (shares.length > 1 || shares.some(x => !/^[A-Za-z0-9_-]{8,128}$/.test(x))) return null
  return { place: params.get('place') ?? '', country: params.get('country') ?? '' }
}
