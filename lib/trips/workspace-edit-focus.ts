/** Keep the active edit control in its own scroll surface, never scroll the saved overview. */
export function workspaceEditFocus(element: HTMLElement | null) {
  if (!element) return
  element.focus({ preventScroll: true })
  const surface = element.closest('dialog')
  if (surface) {
    const frame = surface.getBoundingClientRect(), rect = element.getBoundingClientRect()
    const style = getComputedStyle(surface)
    const inset = 16 + (Number.parseFloat(style.paddingTop) || 0)
    const bottomInset = 16 + (Number.parseFloat(style.paddingBottom) || 0)
    if (rect.top < frame.top + inset || rect.bottom > frame.bottom - bottomInset) {
      const delta = rect.top < frame.top + inset || rect.height > frame.height - inset - bottomInset
        ? rect.top - frame.top - inset : rect.bottom - frame.bottom + bottomInset
      surface.scrollTo({ top: Math.max(0, surface.scrollTop + delta), behavior: 'instant' })
    }
  } else element.scrollIntoView({ block: 'nearest', behavior: 'instant' })
}
