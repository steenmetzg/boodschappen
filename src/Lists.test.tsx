import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { CURRENT_KEY, LISTS_KEY } from './lists'
import { itemButton, itemTexts, list, storeLists, typeItem } from './test/helpers'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

afterEach(() => {
  vi.useRealTimers()
})

function title() {
  return screen.getByRole('heading', { level: 1 })
}

describe('AC1: eerste keer openen', () => {
  it('toont één leeg lijstje "Mijn 1e lijstje" met de grijze tekst', () => {
    render(<App />)
    expect(title()).toHaveTextContent('Mijn 1e lijstje')
    expect(screen.getByText('Nog niets op dit lijstje. Typ of spreek hieronder een item in.')).toBeInTheDocument()
    expect(itemTexts()).toEqual([])
  })
})

describe('AC2: item typen', () => {
  it('zet het item onderaan; het veld is daarna leeg en houdt de focus', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await typeItem(user, '  brood  ')
    expect(itemTexts()).toEqual(['melk', 'brood'])
    const field = screen.getByRole('textbox', { name: 'Item toevoegen' })
    expect(field).toHaveValue('')
    expect(field).toHaveFocus()
  })

  it('werkt ook met de plusknop, en een leeg veld doet niets', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Toevoegen' }))
    expect(itemTexts()).toEqual([])
    await user.type(screen.getByRole('textbox', { name: 'Item toevoegen' }), 'kaas')
    await user.click(screen.getByRole('button', { name: 'Toevoegen' }))
    expect(itemTexts()).toEqual(['kaas'])
  })
})

describe('AC3: meerdere items tegelijk typen', () => {
  it('maakt van "melk, brood, kaas" drie items', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    expect(itemTexts()).toEqual(['melk', 'brood', 'kaas'])
  })
})

describe('AC4: dubbel item', () => {
  it('voegt niets toe en meldt "Melk staat er al op"', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await typeItem(user, ' Melk ')
    expect(itemTexts()).toEqual(['melk'])
    expect(screen.getByRole('status')).toHaveTextContent('Melk staat er al op.')
  })

  it('laat de melding na 5 seconden verdwijnen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await typeItem(user, 'melk')
    await typeItem(user, 'melk')
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('AC5: afvinken', () => {
  it('streept het item door op dezelfde plek; nog eens tikken maakt het weer gewoon', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    await user.click(itemButton('melk'))
    expect(itemButton('melk')).toHaveAttribute('aria-pressed', 'true')
    expect(itemButton('melk').closest('li')).toHaveClass('done')
    expect(itemTexts()).toEqual(['melk', 'brood', 'kaas'])
    await user.click(itemButton('melk'))
    expect(itemButton('melk')).toHaveAttribute('aria-pressed', 'false')
    expect(itemTexts()).toEqual(['melk', 'brood', 'kaas'])
  })

  it('vinkt een afgevinkt item weer aan als je het opnieuw invoert, op dezelfde plek', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    await user.click(itemButton('melk'))
    await typeItem(user, 'Melk')
    expect(itemTexts()).toEqual(['melk', 'brood'])
    expect(itemButton('melk')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('Melk staat weer op je lijstje.')
  })
})

describe('AC6: item weggooien', () => {
  it('gooit het item met het kruisje meteen weg, zonder vraag of ongedaan maken', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    await user.click(screen.getByRole('button', { name: 'melk weggooien' }))
    expect(itemTexts()).toEqual(['brood'])
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ongedaan maken/ })).not.toBeInTheDocument()
  })

  it('gooit ook een afgevinkt item weg', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(itemButton('melk'))
    await user.click(screen.getByRole('button', { name: 'melk weggooien' }))
    expect(itemTexts()).toEqual([])
  })

  it('gooit een item weg als je het naar links veegt', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    const row = itemButton('melk').closest('li')!
    fireEvent.touchStart(row, { touches: [{ clientX: 200, clientY: 10 }] })
    fireEvent.touchMove(row, { touches: [{ clientX: 150, clientY: 12 }] })
    fireEvent.touchMove(row, { touches: [{ clientX: 100, clientY: 12 }] })
    fireEvent.touchEnd(row)
    expect(itemTexts()).toEqual(['brood'])
  })

  it('laat het item staan bij een korte veeg of bij scrollen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    const row = itemButton('melk').closest('li')!
    fireEvent.touchStart(row, { touches: [{ clientX: 200, clientY: 10 }] })
    fireEvent.touchMove(row, { touches: [{ clientX: 160, clientY: 10 }] })
    fireEvent.touchEnd(row)
    fireEvent.touchStart(row, { touches: [{ clientX: 200, clientY: 10 }] })
    fireEvent.touchMove(row, { touches: [{ clientX: 190, clientY: 80 }] })
    fireEvent.touchMove(row, { touches: [{ clientX: 50, clientY: 90 }] })
    fireEvent.touchEnd(row)
    expect(itemTexts()).toEqual(['melk'])
  })
})

describe('AC7: lijstje leegmaken', () => {
  async function openClear(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Lijstje leegmaken' }))
    return screen.getByRole('region', { name: 'Lijstje leegmaken' })
  }

  it('Afgevinkte weggooien gooit alleen de afgevinkte items weg', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    await user.click(itemButton('brood'))
    await user.click(within(await openClear(user)).getByRole('button', { name: 'Afgevinkte weggooien' }))
    expect(itemTexts()).toEqual(['melk', 'kaas'])
  })

  it('Alles weggooien gooit alles weg en het lijstje blijft bestaan', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    await user.click(within(await openClear(user)).getByRole('button', { name: 'Alles weggooien' }))
    expect(itemTexts()).toEqual([])
    expect(title()).toHaveTextContent('Mijn 1e lijstje')
  })

  it('Annuleren laat alles staan', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(within(await openClear(user)).getByRole('button', { name: 'Annuleren' }))
    expect(itemTexts()).toEqual(['melk'])
    expect(screen.queryByRole('region', { name: 'Lijstje leegmaken' })).not.toBeInTheDocument()
  })

  it('maakt Afgevinkte weggooien inactief zonder afgevinkte items, en de prullenbak bij een leeg lijstje', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Lijstje leegmaken' })).toBeDisabled()
    await typeItem(user, 'melk')
    expect(within(await openClear(user)).getByRole('button', { name: 'Afgevinkte weggooien' })).toBeDisabled()
  })
})

async function openMyLists(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Mijn lijstjes' }))
}

describe('AC8: lijstje maken', () => {
  it('maakt een nieuw lijstje en toont het meteen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Nieuw lijstje' }))
    await user.type(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }), 'AH{Enter}')
    expect(title()).toHaveTextContent('AH')
    expect(itemTexts()).toEqual([])
  })

  it('weigert een lege naam en een naam die al bestaat', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH'), list('b', 'Klussen')])
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Nieuw lijstje' }))
    await user.click(screen.getByRole('button', { name: 'Maken' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Geef het lijstje een naam.')
    await user.type(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }), ' ah ')
    await user.click(screen.getByRole('button', { name: 'Maken' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Er is al een lijstje AH.')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('Annuleren maakt niets', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Nieuw lijstje' }))
    await user.type(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }), 'AH')
    await user.click(screen.getByRole('button', { name: 'Annuleren' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})

describe('AC9: naam wijzigen', () => {
  it('bewaart een nieuwe naam met dezelfde controles als maken', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH'), list('b', 'Klussen')], 'a')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Naam van AH wijzigen' }))
    const field = screen.getByRole('textbox', { name: 'Nieuwe naam voor AH' })
    await user.clear(field)
    await user.type(field, 'klussen{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('Er is al een lijstje Klussen.')
    await user.clear(field)
    await user.type(field, 'Jumbo{Enter}')
    expect(screen.getByRole('button', { name: 'Jumbo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(title()).toHaveTextContent('Jumbo')
  })
})

describe('AC10: lijstje weggooien', () => {
  it('gooit zonder vraag weg en zet het met Ongedaan maken terug op dezelfde plek', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk', ['brood', true]]), list('b', 'Klussen'), list('c', 'Vakantie')], 'a')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Lijstje AH weggooien' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^AH/ })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Lijstje AH weggegooid')
    await user.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    const names = screen.getAllByRole('listitem').map((li) => li.querySelector('.list-name')?.textContent)
    expect(names).toEqual(['AH', 'Klussen', 'Vakantie'])
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(title()).toHaveTextContent('AH')
    expect(itemTexts()).toEqual(['melk', 'brood'])
    expect(itemButton('brood')).toHaveAttribute('aria-pressed', 'true')
  })

  it('maakt het eerste lijstje het huidige als je het huidige weggooit', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH'), list('b', 'Klussen')], 'b')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Lijstje Klussen weggooien' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(title()).toHaveTextContent('AH')
  })

  it('maakt het weggooien na 10 seconden definitief', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    storeLists([list('a', 'AH'), list('b', 'Klussen')], 'a')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Lijstje AH weggooien' }))
    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(screen.getByRole('button', { name: 'Ongedaan maken' })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.queryByRole('button', { name: 'Ongedaan maken' })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!)).toHaveLength(1)
  })

  it('kan het laatste lijstje niet weggooien', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMyLists(user)
    expect(screen.getByRole('button', { name: 'Lijstje Mijn 1e lijstje weggooien' })).toBeDisabled()
  })
})

describe('AC11: ander lijstje kiezen', () => {
  it('toont het gekozen lijstje op het hoofdscherm, met het aantal open items erbij', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk']), list('b', 'Klussen', ['lamp', ['kraan', true], 'deur'])], 'a')
    render(<App />)
    await openMyLists(user)
    const current = screen.getByRole('button', { name: /^AH/ })
    expect(current).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Klussen, 2 open' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Klussen, 2 open' }))
    expect(title()).toHaveTextContent('Klussen')
    expect(itemTexts()).toEqual(['lamp', 'kraan', 'deur'])
  })
})

describe('AC12: onthouden', () => {
  it('heeft na opnieuw openen dezelfde lijstjes, items en hetzelfde lijstje open', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Nieuw lijstje' }))
    await user.type(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }), 'Klussen{Enter}')
    await typeItem(user, 'lamp, kraan')
    await user.click(itemButton('kraan'))
    unmount()

    render(<App />)
    expect(title()).toHaveTextContent('Klussen')
    expect(itemTexts()).toEqual(['lamp', 'kraan'])
    expect(itemButton('kraan')).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem(CURRENT_KEY)).not.toBeNull()
  })

  it('begint met het eerste lijstje als het onthouden lijstje niet meer bestaat', () => {
    storeLists([list('a', 'AH'), list('b', 'Klussen')], 'weg')
    render(<App />)
    expect(title()).toHaveTextContent('AH')
  })
})
