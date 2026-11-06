import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LISTS_KEY, type Lijstje } from '../lists'

/** De teksten van de items op het getoonde lijstje, van boven naar beneden. */
export function itemTexts(): string[] {
  const list = screen.queryByRole('list', { name: /^Items op / })
  if (!list) return []
  return within(list)
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.item-text')?.textContent ?? '')
}

/** De knop om een item af te vinken (de tekst met het rondje). */
export function itemButton(tekst: string): HTMLElement {
  return screen.getByRole('button', { name: tekst })
}

/** Typt tekst in het veld "Item toevoegen" en drukt op Enter. */
export async function typeItem(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole('textbox', { name: 'Item toevoegen' }), `${text}{Enter}`)
}

/** Zet lijstjes klaar in de opslag van de browser, alsof de app al eerder gebruikt is. */
export function storeLists(lijstjes: Lijstje[], huidig?: string) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lijstjes))
  if (huidig) localStorage.setItem('lijstjes-huidig', huidig)
}

export function list(id: string, naam: string, items: (string | [string, boolean])[] = []): Lijstje {
  return {
    id,
    naam,
    items: items.map((it, i) => {
      const [tekst, af] = typeof it === 'string' ? [it, false] : it
      return { id: `${id}-${i}`, tekst, af }
    }),
  }
}
