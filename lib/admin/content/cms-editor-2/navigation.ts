type LinkIntent = Readonly<{
  currentHref: string; href: string | null; target: string | null; download: boolean
  button: number; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean
}>

/** Same-document hash jumps and new tabs keep the editor mounted. Internal
 * route/query changes, including Next Link's keyboard activation, do not. */
export function cmsInternalNavigation(intent: LinkIntent): boolean {
  if (intent.href === null || intent.href.startsWith('#') || intent.download || intent.button !== 0
    || intent.altKey || intent.ctrlKey || intent.metaKey || intent.shiftKey
    || (intent.target && intent.target.toLowerCase() !== '_self')) return false
  try { return new URL(intent.href, intent.currentHref).origin === new URL(intent.currentHref).origin }
  catch { return false }
}

/** Install before React/Next link handlers, on the whole document surface.
 * Consult the controller synchronously so a new edit/write is protected even
 * before React effects have caught up. No shared-file or storage intervention. */
export function protectCmsNavigation(target: Window, blocked: () => boolean, onBlocked: () => void): () => void {
  const click = (event: MouseEvent) => {
    if (!blocked()) return
    const anchor = event.composedPath().find(node => node instanceof HTMLAnchorElement)
    if (!(anchor instanceof HTMLAnchorElement) || !cmsInternalNavigation({
      currentHref: target.location.href, href: anchor.getAttribute('href'), target: anchor.getAttribute('target'),
      download: anchor.hasAttribute('download'), button: event.button,
      altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey,
    })) return
    event.preventDefault()
    event.stopImmediatePropagation()
    onBlocked()
  }
  const unload = (event: BeforeUnloadEvent) => {
    if (blocked()) { event.preventDefault(); event.returnValue = '' }
  }
  target.addEventListener('click', click, true)
  target.addEventListener('beforeunload', unload)
  return () => {
    target.removeEventListener('click', click, true)
    target.removeEventListener('beforeunload', unload)
  }
}
