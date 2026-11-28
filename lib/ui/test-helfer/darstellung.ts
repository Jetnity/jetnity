import type { Page } from 'playwright'

const DESKTOP_AB_PX = 1024

/**
 * Wählt Hell oder Dunkel über die Darstellungswahl. Sie steht in der Seitenleiste (ab 1024 px)
 * und darunter im Menü; dort wird das Menü geöffnet und nach der Wahl wieder geschlossen.
 */
export async function darstellungWaehlen(page: Page, wert: 'light' | 'dark'): Promise<void> {
  const imMenue = (page.viewportSize()?.width ?? DESKTOP_AB_PX) < DESKTOP_AB_PX
  const menue = page.getByRole('button', { name: 'Menü', exact: true })
  if (imMenue) await menue.click()
  await page
    .getByRole('group', { name: 'Darstellung' })
    .getByRole('button', { name: wert === 'dark' ? 'Dunkel' : 'Hell', exact: true })
    .click()
  if (imMenue) {
    await page.keyboard.press('Escape')
    await page.getByRole('dialog', { name: 'Workspace-Navigation' }).waitFor({ state: 'hidden' })
  }
}
