import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { CURRENT_KEY, dropIndex, LISTS_KEY } from './lists'
import { itemButton, itemTexts, list, rememberFirstList, storeLists, typeItem } from './test/helpers'
import { countHidden } from './visibility'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// De meeste tests beginnen op het scherm van een lijstje, alsof de app al eerder gebruikt is.
beforeEach(() => {
  rememberFirstList()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** De namen van de lijstjes op Mijn lijstjes, van boven naar beneden. */
function listNames(): string[] {
  return Array.from(document.querySelectorAll('.list-row .list-name'), (el) => el.textContent ?? '')
}

function title() {
  return screen.getByRole('heading', { level: 1 })
}

describe('AC1: eerste keer openen', () => {
  it('start met Mijn lijstjes met één leeg lijstje "Mijn 1e lijstje"', async () => {
    localStorage.clear()
    const user = userEvent.setup()
    render(<App />)
    expect(title()).toHaveTextContent('Mijn lijstjes')
    expect(screen.queryByRole('button', { name: /Terug/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Informatie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Instellingen en backup' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mijn 1e lijstje' }))
    expect(title()).toHaveTextContent('Mijn 1e lijstje')
    expect(itemTexts()).toEqual([])
    // Een leeg lijstje heeft alleen de invoerregel.
    const rows = within(screen.getByRole('list', { name: 'Items op Mijn 1e lijstje' })).getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(within(rows[0]).getByRole('textbox', { name: 'Item toevoegen' })).toBeInTheDocument()
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

  it('heeft geen plusknop, en Enter in een leeg veld doet niets', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Toevoegen' })).not.toBeInTheDocument()
    await typeItem(user, '   ')
    expect(itemTexts()).toEqual([])
  })
})

describe('AC3: meerdere items tegelijk typen', () => {
  it('maakt van "melk, brood, kaas" drie items', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    expect(itemTexts()).toEqual(['melk', 'brood', 'kaas'])
  })
  it('laat per item niet meer dan 60 tekens typen of plakken, ook na een komma', async () => {
    const user = userEvent.setup()
    render(<App />)
    const field = screen.getByRole('textbox', { name: 'Item toevoegen' })
    await user.type(field, 'a'.repeat(65))
    expect(field).toHaveValue('a'.repeat(60))
    await user.type(field, ', ')
    await user.paste('b'.repeat(70))
    expect(field).toHaveValue(`${'a'.repeat(60)}, ${'b'.repeat(60)}`)
    await user.keyboard('{Enter}')
    expect(itemTexts()).toEqual(['a'.repeat(60), 'b'.repeat(60)])
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

describe('AC7: lijstje of items weggooien', () => {
  async function openClear(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Lijstje weggooien' }))
    return screen.getByRole('region', { name: 'Lijstje weggooien' })
  }

  it('Afgevinkte weggooien gooit alleen de afgevinkte items weg', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    await user.click(itemButton('brood'))
    await user.click(within(await openClear(user)).getByRole('button', { name: 'Afgevinkte weggooien' }))
    expect(itemTexts()).toEqual(['melk', 'kaas'])
  })

  it('Alle items weggooien gooit alles weg en het lijstje blijft bestaan', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    await user.click(within(await openClear(user)).getByRole('button', { name: 'Alle items weggooien' }))
    expect(itemTexts()).toEqual([])
    expect(title()).toHaveTextContent('Mijn 1e lijstje')
  })

  it('staat in de vaste titelbalk, zodat hij ook in beeld is als je omlaag gescrold bent', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    const choice = await openClear(user)
    expect(choice.closest('header')).toHaveClass('list-header')
  })

  it('Items én het lijstje weggooien gooit het hele lijstje weg, gaat naar Mijn lijstjes en kan ongedaan worden', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk', ['brood', true]]), list('b', 'Klussen')], 'a')
    render(<App />)
    await user.click(
      within(await openClear(user)).getByRole('button', { name: 'Items én het lijstje weggooien' }),
    )
    expect(title()).toHaveTextContent('Mijn lijstjes')
    expect(listNames()).toEqual(['Klussen'])
    expect(screen.getByRole('status')).toHaveTextContent('Lijstje AH weggegooid')
    await user.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    expect(listNames()).toEqual(['AH', 'Klussen'])
    expect(screen.getByRole('button', { name: 'AH, 1 open' })).toHaveAttribute('aria-current', 'true')
  })

  it('kan het laatste lijstje niet weggooien, maar een leeg lijstje wel als er meer zijn', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    expect(within(await openClear(user)).getByRole('button', { name: 'Items én het lijstje weggooien' })).toBeDisabled()
    cleanup()
    storeLists([list('l1', 'AH'), list('b', 'Klussen')], 'l1')
    render(<App />)
    expect(screen.getByRole('button', { name: 'Lijstje weggooien' })).toBeEnabled()
    const choice = await openClear(user)
    expect(within(choice).getByRole('button', { name: 'Alle items weggooien' })).toBeDisabled()
    await user.click(within(choice).getByRole('button', { name: 'Items én het lijstje weggooien' }))
    expect(listNames()).toEqual(['Klussen'])
  })

  it('Annuleren laat alles staan', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(within(await openClear(user)).getByRole('button', { name: 'Annuleren' }))
    expect(itemTexts()).toEqual(['melk'])
    expect(screen.queryByRole('region', { name: 'Lijstje weggooien' })).not.toBeInTheDocument()
  })

  it('maakt Afgevinkte weggooien inactief zonder afgevinkte items, en de prullenbak bij een leeg lijstje', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Lijstje weggooien' })).toBeDisabled()
    await typeItem(user, 'melk')
    expect(within(await openClear(user)).getByRole('button', { name: 'Afgevinkte weggooien' })).toBeDisabled()
  })
})

async function openMyLists(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Terug naar Mijn lijstjes' }))
}

describe('AC8: lijstje maken', () => {
  it('maakt een nieuw lijstje met de invoerregel onderaan en toont het meteen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMyLists(user)
    const rows = within(screen.getByRole('list', { name: 'Mijn lijstjes' })).getAllByRole('listitem')
    expect(rows.at(-1)).toContainElement(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }))
    expect(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' })).toHaveAttribute(
      'placeholder',
      'Nieuw lijstje',
    )
    await user.type(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }), 'AH{Enter}')
    expect(title()).toHaveTextContent('AH')
    expect(itemTexts()).toEqual([])
  })

  it('weigert een lege naam en een naam die al bestaat', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH'), list('b', 'Klussen')])
    render(<App />)
    await openMyLists(user)
    const field = screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' })
    await user.type(field, '{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('Geef het lijstje een naam.')
    await user.type(field, ' ah {Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('Er is al een lijstje AH.')
    expect(listNames()).toEqual(['AH', 'Klussen'])
  })

  it('houdt een naam op 30 tekens, ook als het toetsenbord zich niet aan de grens houdt', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openMyLists(user)
    const field = screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' })
    // Zo plakt het toetsenbord van Android soms tekst voorbij maxLength.
    fireEvent.change(field, { target: { value: 'a'.repeat(40) } })
    expect(field).toHaveValue('a'.repeat(30))
    await user.click(screen.getByRole('button', { name: 'Naam van Mijn 1e lijstje wijzigen' }))
    const rename = screen.getByRole('textbox', { name: 'Nieuwe naam voor Mijn 1e lijstje' })
    fireEvent.change(rename, { target: { value: 'b'.repeat(40) } })
    expect(rename).toHaveValue('b'.repeat(30))
  })

  it('heeft geen maximum aan het aantal lijstjes', async () => {
    const user = userEvent.setup()
    storeLists(Array.from({ length: 30 }, (_, i) => list(`l${i}`, `Lijstje ${i}`)))
    render(<App />)
    await openMyLists(user)
    await user.type(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }), 'Nummer 31{Enter}')
    expect(title()).toHaveTextContent('Nummer 31')
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!)).toHaveLength(31)
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
    await user.click(screen.getByRole('button', { name: 'Jumbo' }))
    expect(title()).toHaveTextContent('Jumbo')
  })
})

describe('AC10: lijstje weggooien', () => {
  it('gooit een leeg lijstje zonder vraag weg', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk']), list('b', 'Klussen')], 'a')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Lijstje Klussen weggooien' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Klussen' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Lijstje Klussen weggegooid')
  })

  it('vraagt eerst om bevestiging als er items op staan; Annuleren laat het staan', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk', ['brood', true]]), list('b', 'Klussen')], 'a')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Lijstje AH weggooien' }))
    const question = screen.getByRole('alertdialog', { name: 'Dit lijstje bevat items' })
    expect(question).toHaveTextContent('AH heeft 2 items. Lijstje en items weggooien?')
    await user.click(within(question).getByRole('button', { name: 'Annuleren' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AH, 1 open' })).toBeInTheDocument()
  })

  it('gooit na bevestiging weg en zet het met Ongedaan maken terug op dezelfde plek', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk', ['brood', true]]), list('b', 'Klussen'), list('c', 'Vakantie')], 'a')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Lijstje AH weggooien' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Weggooien' }))
    expect(screen.queryByRole('button', { name: /^AH/ })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Lijstje AH weggegooid')
    await user.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    expect(listNames()).toEqual(['AH', 'Klussen', 'Vakantie'])
    expect(screen.getByRole('button', { name: 'AH, 1 open' })).toHaveAttribute('aria-current', 'true')
    await user.click(screen.getByRole('button', { name: 'AH, 1 open' }))
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
    expect(screen.getByRole('button', { name: 'AH' })).toHaveAttribute('aria-current', 'true')
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

describe('AC11: een lijstje openen vanaf Mijn lijstjes', () => {
  it('opent het lijstje waarop je tikt, met het aantal open items erbij, en Terug gaat naar Mijn lijstjes', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk']), list('b', 'Klussen', ['lamp', ['kraan', true], 'deur'])], 'a')
    render(<App />)
    await openMyLists(user)
    const current = screen.getByRole('button', { name: 'AH, 1 open' })
    expect(current).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Klussen, 2 open' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Klussen, 2 open' }))
    expect(title()).toHaveTextContent('Klussen')
    expect(itemTexts()).toEqual(['lamp', 'kraan', 'deur'])
    await openMyLists(user)
    expect(title()).toHaveTextContent('Mijn lijstjes')
    expect(screen.getByRole('button', { name: 'Klussen, 2 open' })).toHaveAttribute('aria-current', 'true')
  })

  it('start na opnieuw openen met het laatst geopende lijstje', async () => {
    const user = userEvent.setup()
    localStorage.clear()
    storeLists([list('a', 'AH'), list('b', 'Klussen')])
    const { unmount } = render(<App />)
    expect(title()).toHaveTextContent('Mijn lijstjes')
    await user.click(screen.getByRole('button', { name: 'Klussen' }))
    await openMyLists(user)
    unmount()
    render(<App />)
    expect(title()).toHaveTextContent('Klussen')
  })
})

describe('AC12: onthouden', () => {
  it('heeft na opnieuw openen dezelfde lijstjes, items en hetzelfde lijstje open', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await openMyLists(user)
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

describe('AC2: de invoerregel staat in het lijstje', () => {
  it('is de laatste regel, met een rondje dat nog niet werkt, geen plusknop en de microfoon rechts', async () => {
    const user = userEvent.setup()
    ;(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = class {}
    render(<App />)
    await typeItem(user, 'melk')
    const rows = within(screen.getByRole('list', { name: 'Items op Mijn 1e lijstje' })).getAllByRole('listitem')
    const last = rows[rows.length - 1]
    expect(within(last).getByRole('textbox', { name: 'Item toevoegen' })).toBeInTheDocument()
    const buttons = within(last).getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Inspreken'])
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  })
})

describe('AC20: item aanpassen', () => {
  it('houdt de tekst op 60 tekens, ook als het toetsenbord zich niet aan de grens houdt', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(screen.getByRole('button', { name: 'melk aanpassen' }))
    const field = screen.getByRole('textbox', { name: 'Item aanpassen' })
    fireEvent.change(field, { target: { value: 'x'.repeat(70) } })
    expect(field).toHaveValue('x'.repeat(60))
  })

  it('maakt van de tekst een tekstveld als je erop tikt; Enter bewaart, op dezelfde plek', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    await user.click(screen.getByRole('button', { name: 'melk aanpassen' }))
    const field = screen.getByRole('textbox', { name: 'Item aanpassen' })
    expect(field).toHaveValue('melk')
    expect(field).toHaveFocus()
    await user.clear(field)
    await user.type(field, 'halfvolle melk{Enter}')
    expect(itemTexts()).toEqual(['halfvolle melk', 'brood'])
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!)[0].items[0].tekst).toBe('halfvolle melk')
  })

  it('bewaart ook als je ergens anders tikt, en Escape laat de tekst zoals hij was', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(screen.getByRole('button', { name: 'melk aanpassen' }))
    await user.type(screen.getByRole('textbox', { name: 'Item aanpassen' }), 'poeder{Escape}')
    expect(itemTexts()).toEqual(['melk'])
    await user.click(screen.getByRole('button', { name: 'melk aanpassen' }))
    await user.type(screen.getByRole('textbox', { name: 'Item aanpassen' }), 'poeder')
    await user.click(title())
    expect(itemTexts()).toEqual(['melkpoeder'])
  })

  it('laat het item staan bij een lege tekst, en meldt een tekst die er al op staat', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    await user.click(screen.getByRole('button', { name: 'melk aanpassen' }))
    await user.clear(screen.getByRole('textbox', { name: 'Item aanpassen' }))
    await user.keyboard('{Enter}')
    expect(itemTexts()).toEqual(['melk', 'brood'])
    await user.click(screen.getByRole('button', { name: 'melk aanpassen' }))
    await user.clear(screen.getByRole('textbox', { name: 'Item aanpassen' }))
    await user.keyboard('Brood{Enter}')
    expect(itemTexts()).toEqual(['melk', 'brood'])
    expect(screen.getByRole('status')).toHaveTextContent('Brood staat er al op.')
  })

  it('laat afvinken met het rondje en weggooien met het kruisje gewoon werken', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(itemButton('melk'))
    expect(itemButton('melk')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('textbox', { name: 'Item aanpassen' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'melk weggooien' }))
    expect(itemTexts()).toEqual([])
  })
})

describe('AC21: items verplaatsen', () => {
  it('berekent de nieuwe plek uit hoe ver je sleept', () => {
    const heights = [48, 48, 48, 48]
    expect(dropIndex(0, 0, heights)).toBe(0)
    expect(dropIndex(0, 30, heights)).toBe(0)
    expect(dropIndex(0, 50, heights)).toBe(1)
    expect(dropIndex(0, 100, heights)).toBe(2)
    expect(dropIndex(3, -500, heights)).toBe(0)
    expect(dropIndex(2, -20, heights)).toBe(2)
  })

  it('verplaatst een item door de greep vast te pakken en te slepen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 48 } as DOMRect)
    const grip = screen.getByRole('button', { name: 'melk verplaatsen' })
    fireEvent.pointerDown(grip, { pointerId: 1, clientY: 100 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 160 })
    expect(grip.closest('li')).toHaveClass('dragging')
    fireEvent.pointerUp(grip, { pointerId: 1, clientY: 160 })
    vi.restoreAllMocks()
    expect(itemTexts()).toEqual(['brood', 'melk', 'kaas'])
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!)[0].items.map((i: { tekst: string }) => i.tekst)).toEqual([
      'brood',
      'melk',
      'kaas',
    ])
  })

  it('scrolt mee als je een item tot bij de titel of de invoerregel sleept', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    // Nagebootst: de titelbalk eindigt op 100 pixels, de invoerregel begint op 500 pixels.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('add-row')) return { top: 500, bottom: 550 } as DOMRect
      if (this.classList.contains('list-header')) return { top: 0, bottom: 100 } as DOMRect
      return { top: 200, bottom: 250, height: 50 } as DOMRect
    })
    const scrollBy = vi.fn()
    window.scrollBy = scrollBy as unknown as typeof window.scrollBy
    const grip = screen.getByRole('button', { name: 'kaas verplaatsen' })
    fireEvent.pointerDown(grip, { pointerId: 1, clientY: 300 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 110 })
    await waitFor(() => expect(scrollBy).toHaveBeenCalledWith(0, expect.any(Number)))
    expect(scrollBy.mock.calls[0][1]).toBeLessThan(0)
    scrollBy.mockClear()
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 490 })
    await waitFor(() => expect(scrollBy).toHaveBeenCalled())
    expect(scrollBy.mock.calls.at(-1)![1]).toBeGreaterThan(0)
    fireEvent.pointerUp(grip, { pointerId: 1, clientY: 490 })
    scrollBy.mockClear()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(scrollBy).not.toHaveBeenCalled()
  })

  it('verplaatst ook met de pijltjestoetsen, en houdt afgevinkte items afgevinkt', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    await user.click(itemButton('kaas'))
    screen.getByRole('button', { name: 'kaas verplaatsen' }).focus()
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(itemTexts()).toEqual(['kaas', 'melk', 'brood'])
    expect(screen.getByRole('button', { name: 'kaas verplaatsen' })).toHaveFocus()
    expect(itemButton('kaas')).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{ArrowDown}')
    expect(itemTexts()).toEqual(['melk', 'kaas', 'brood'])
  })
})

describe('AC22: items buiten beeld', () => {
  it('telt de items boven het scherm en onder de invoerregel', () => {
    const rows = [0, 1, 2, 3, 4].map((i) => ({ top: i * 50 - 60, bottom: i * 50 - 10 }))
    // Midden van de regels: -35, 15, 65, 115, 165; in beeld van 0 tot 120.
    expect(countHidden(rows, 0, 120)).toEqual({ above: 1, below: 1 })
    expect(countHidden(rows, -100, 1000)).toEqual({ above: 0, below: 0 })
  })

  it('toont een pijltje met het aantal items boven en onder het scherm, en scrolt erheen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'a, b, c, d, e, f')
    // Nagebootst scherm: regels van 50 pixels, 2 items boven het scherm, de invoerregel op 150 pixels.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('add-row')) return { top: 150, bottom: 200 } as DOMRect
      const rows = Array.from(document.querySelectorAll('li[data-id]'))
      const i = rows.indexOf(this)
      // De grijze lijn bovenaan zelf staat op 0 pixels.
      if (i === -1) return { top: 0, bottom: 0, height: 0 } as DOMRect
      return { top: i * 50 - 100, bottom: i * 50 - 50, height: 50 } as DOMRect
    })
    const scrollBy = vi.fn()
    window.scrollBy = scrollBy
    fireEvent.scroll(window)
    expect(screen.getByRole('button', { name: '2 items hoger' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1 item lager' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1 item lager' }))
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ top: expect.any(Number) }))
    expect(scrollBy.mock.calls[0][0].top).toBeGreaterThan(0)
    vi.restoreAllMocks()
  })

  it('schuift het lijstje omhoog als je een item toevoegt, zodat het laatste item boven de invoerregel te zien is', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'a, b, c')
    // Nagebootst vol scherm: regels van 50 pixels, de invoerregel staat vast op 120 pixels.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('add-row')) return { top: 120, bottom: 170 } as DOMRect
      const rows = Array.from(document.querySelectorAll('li[data-id]'))
      const i = rows.indexOf(this)
      return { top: i * 50, bottom: i * 50 + 50, height: 50 } as DOMRect
    })
    const scrollBy = vi.fn()
    window.scrollBy = scrollBy
    await typeItem(user, 'd')
    // Het nieuwe item "d" staat van 150 tot 200, dus 80 pixels omhoog schuiven.
    expect(scrollBy).toHaveBeenCalledWith({ top: 80 })
    scrollBy.mockClear()
    await user.click(screen.getByRole('button', { name: 'a weggooien' }))
    expect(scrollBy).not.toHaveBeenCalled()
  })

  it('telt een versleept item niet als buiten beeld, ook niet terwijl de regels nog naar hun plek schuiven', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood, kaas')
    // Nagebootst: alles in beeld, behalve een regel die (nog) verschoven staat, die staat boven het scherm.
    let shifted = true
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('add-row')) return { top: 400, bottom: 450 } as DOMRect
      const rows = Array.from(document.querySelectorAll('li[data-id]'))
      const i = rows.indexOf(this)
      if (i === -1) return { top: 0, bottom: 0, height: 0 } as DOMRect
      if (shifted && this.textContent?.includes('kaas')) return { top: -100, bottom: -50, height: 50 } as DOMRect
      return { top: 100 + i * 50, bottom: 150 + i * 50, height: 50 } as DOMRect
    })
    const grip = screen.getByRole('button', { name: 'kaas verplaatsen' })
    fireEvent.pointerDown(grip, { pointerId: 1, clientY: 200 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 50 })
    expect(screen.queryByRole('button', { name: /hoger|lager/ })).not.toBeInTheDocument()
    fireEvent.pointerUp(grip, { pointerId: 1, clientY: 50 })
    expect(itemTexts()).toEqual(['kaas', 'melk', 'brood'])
    // Klaar met schuiven: de regels staan op hun plek en er staat niets buiten beeld.
    shifted = false
    fireEvent.transitionEnd(screen.getByRole('list', { name: 'Items op Mijn 1e lijstje' }))
    expect(screen.queryByRole('button', { name: /hoger|lager/ })).not.toBeInTheDocument()
  })

  it('toont geen pijltjes als alles in beeld is', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk, brood')
    expect(screen.queryByRole('button', { name: /hoger|lager/ })).not.toBeInTheDocument()
  })
})

describe('AC23: Mijn lijstjes werkt net als een lijstje', () => {
  it('verplaatst een lijstje door de greep vast te pakken en te slepen, en onthoudt de volgorde', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH'), list('b', 'Klussen'), list('c', 'Vakantie')], 'a')
    render(<App />)
    await openMyLists(user)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 48 } as DOMRect)
    const grip = screen.getByRole('button', { name: 'AH verplaatsen' })
    fireEvent.pointerDown(grip, { pointerId: 1, clientY: 100 })
    fireEvent.pointerMove(grip, { pointerId: 1, clientY: 160 })
    expect(grip.closest('li')).toHaveClass('dragging')
    fireEvent.pointerUp(grip, { pointerId: 1, clientY: 160 })
    vi.restoreAllMocks()
    expect(listNames()).toEqual(['Klussen', 'AH', 'Vakantie'])
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!).map((l: { naam: string }) => l.naam)).toEqual([
      'Klussen',
      'AH',
      'Vakantie',
    ])
  })

  it('verplaatst ook met de pijltjestoetsen', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH'), list('b', 'Klussen'), list('c', 'Vakantie')], 'a')
    render(<App />)
    await openMyLists(user)
    screen.getByRole('button', { name: 'Vakantie verplaatsen' }).focus()
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(listNames()).toEqual(['Vakantie', 'AH', 'Klussen'])
    expect(screen.getByRole('button', { name: 'Vakantie verplaatsen' })).toHaveFocus()
  })

  it('toont een lipje met het aantal lijstjes boven en onder het scherm', async () => {
    const user = userEvent.setup()
    storeLists(['a', 'b', 'c', 'd', 'e', 'f'].map((n) => list(n, n.toUpperCase())), 'a')
    render(<App />)
    await openMyLists(user)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('add-row')) return { top: 150, bottom: 200 } as DOMRect
      const rows = Array.from(document.querySelectorAll('li[data-id]'))
      const i = rows.indexOf(this)
      if (i === -1) return { top: 0, bottom: 0, height: 0 } as DOMRect
      return { top: i * 50 - 100, bottom: i * 50 - 50, height: 50 } as DOMRect
    })
    fireEvent.scroll(window)
    expect(screen.getByRole('button', { name: '2 lijstjes hoger' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1 lijstje lager' })).toBeInTheDocument()
  })

  it('vraagt bevestiging onderaan in beeld, ook als je omlaag gescrold bent', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk']), list('b', 'Klussen')], 'a')
    render(<App />)
    await openMyLists(user)
    await user.click(screen.getByRole('button', { name: 'Lijstje AH weggooien' }))
    expect(screen.getByRole('alertdialog').closest('.bottom')).not.toBeNull()
  })
})
