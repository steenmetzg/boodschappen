import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { formatWanneer, googleUrl, icsBestand, opDatum, outlookUrl } from './agenda'
import { createBackup, parseBackup } from './backup'
import { HERINNERINGEN_KEY, LISTS_KEY, loadLijstjes, parseLijstjes, type Lijstje } from './lists'
import { itemTexts, list, storeLists, typeItem } from './test/helpers'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// "Nu" is zaterdag 7 november 2026, 10:00; alleen de klok, zodat userEvent gewoon werkt.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 7, 10, 0))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

/** Een herinneringslijstje "Afspraken" in de opslag, met apart bewaarde datums. */
function storeAfspraken(items: Record<string, { wanneer?: string; inAgenda?: string }>, agenda?: string) {
  storeLists([list('h', 'Afspraken', ['Tandarts', 'Anne bellen', 'APK']), list('a', 'AH', ['melk'])], 'h')
  const byText: Record<string, string> = { Tandarts: 'h-0', 'Anne bellen': 'h-1', APK: 'h-2' }
  localStorage.setItem(
    HERINNERINGEN_KEY,
    JSON.stringify({
      lijstjes: { h: agenda ? { agenda } : {} },
      items: Object.fromEntries(Object.entries(items).map(([t, v]) => [byText[t], v])),
    }),
  )
}

/** Tikt op het agenda-knopje van een item, of het al in de agenda staat of niet. */
async function agendaButton(user: ReturnType<typeof userEvent.setup>, tekst: string) {
  await user.click(screen.getByRole('button', { name: new RegExp(`^${tekst} (in agenda zetten|staat in je agenda)`) }))
}

/** Opent het vak met datum en tijd (via de datum, of via het agenda-knopje zonder datum) en bewaart. */
async function setDate(user: ReturnType<typeof userEvent.setup>, tekst: string, value: string) {
  await agendaButton(user, tekst)
  const box = screen.getByRole('region', { name: 'Datum en tijd' })
  fireEvent.change(within(box).getByLabelText(`Datum en tijd van ${tekst}`), { target: { value } })
  await user.click(within(box).getByRole('button', { name: 'Alleen in Lijstjes bewaren' }))
}

describe('AC25: herinneringslijstje maken', () => {
  it('maakt met het belletje een herinneringslijstje, met een belletje in Mijn lijstjes', async () => {
    const user = userEvent.setup()
    render(<App />)
    const bell = screen.getByRole('button', { name: 'Herinneringslijstje' })
    expect(bell).toHaveAttribute('aria-pressed', 'false')
    await user.click(bell)
    expect(bell).toHaveAttribute('aria-pressed', 'true')
    const field = screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' })
    expect(field).toHaveAttribute('placeholder', 'Nieuw herinneringslijstje')
    await user.type(field, 'Afspraken{Enter}')
    // Het lijstje is open, met het belletje voor de agenda in de titelbalk en een datumregel bij elk item.
    expect(screen.getByRole('heading', { name: 'Afspraken' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agenda van dit lijstje' })).toBeInTheDocument()
    await typeItem(user, 'tandarts')
    // Nog geen datum: geen datumregel, wel het agenda-knopje.
    expect(screen.queryByRole('button', { name: /^Datum en tijd van tandarts/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'tandarts in agenda zetten' })).toBeEnabled()
    // Een herinneringslijstje staat op datum: geen greep om te verplaatsen.
    expect(screen.queryByRole('button', { name: 'tandarts verplaatsen' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug naar Mijn lijstjes' }))
    const row = screen.getByRole('button', { name: 'Afspraken, 1 open' })
    expect(within(row).getByLabelText('Herinneringslijstje')).toBeInTheDocument()
    // Het volgende nieuwe lijstje is weer gewoon.
    expect(screen.getByRole('button', { name: 'Herinneringslijstje' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('maakt zonder belletje een gewoon lijstje', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'Naam van het nieuwe lijstje' }), 'AH{Enter}')
    await typeItem(user, 'melk')
    expect(screen.queryByText('Datum kiezen')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agenda van dit lijstje' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'melk verplaatsen' })).toBeInTheDocument()
  })
})

describe('AC26: datum en tijd', () => {
  it('toont de datum onder het item, sorteert op datum en kleurt een voorbije datum rood', async () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30' } })
    const user = userEvent.setup()
    render(<App />)
    expect(itemTexts()).toEqual(['Tandarts', 'Anne bellen', 'APK'])
    await setDate(user, 'APK', '2026-11-08T14:00')
    expect(screen.getByText('zo 8 nov 14:00')).toBeInTheDocument()
    expect(screen.getByText('do 12 nov 09:30')).toBeInTheDocument()
    // APK is eerder dan de tandarts en staat nu bovenaan; Anne bellen heeft geen datum en staat onderaan.
    expect(itemTexts()).toEqual(['APK', 'Tandarts', 'Anne bellen'])
    await setDate(user, 'Anne bellen', '2026-11-06T19:00')
    expect(itemTexts()).toEqual(['Anne bellen', 'APK', 'Tandarts'])
    const items = screen.getByRole('list', { name: 'Items op Afspraken' })
    expect(within(items).getByText('vr 6 nov 19:00')).toHaveClass('past')
    expect(screen.getByText('zo 8 nov 14:00')).not.toHaveClass('past')
    // Datum weghalen (veld leeg en Bewaren): geen datumregel meer, onderaan.
    await setDate(user, 'Anne bellen', '')
    expect(itemTexts()).toEqual(['APK', 'Tandarts', 'Anne bellen'])
    expect(screen.queryByRole('button', { name: /^Datum en tijd van Anne bellen/ })).not.toBeInTheDocument()
  })

  it('formatteert datum en tijd in het Nederlands, met het jaar als dat anders is', () => {
    const now = new Date(2026, 10, 7)
    expect(formatWanneer('2026-11-08T14:00', now)).toBe('zo 8 nov 14:00')
    expect(formatWanneer('2027-01-01T09:05', now)).toBe('vr 1 jan 2027 09:05')
  })

  it('zet items met datum op volgorde en items zonder datum onderaan', () => {
    const items = [{ id: 'a' }, { id: 'b', wanneer: '2026-12-01T10:00' }, { id: 'c' }, { id: 'd', wanneer: '2026-11-20T10:00' }]
    expect(opDatum(items).map((i) => i.id)).toEqual(['d', 'b', 'a', 'c'])
  })
})

describe('AC27: in de agenda zetten', () => {
  it('vraagt de eerste keer welke agenda, onthoudt die per lijstje en opent hem daarna meteen', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30' } })
    const user = userEvent.setup()
    render(<App />)
    // Zonder datum opent het agenda-knopje eerst het vak met datum en tijd, zonder keuze van de agenda.
    await user.click(screen.getByRole('button', { name: 'APK in agenda zetten' }))
    const box = screen.getByRole('region', { name: 'Datum en tijd' })
    expect(within(box).getByRole('button', { name: 'In agenda zetten' })).toBeDisabled()
    expect(screen.queryByRole('region', { name: 'Agenda kiezen' })).not.toBeInTheDocument()
    await user.click(within(box).getByRole('button', { name: 'Annuleren' }))
    expect(screen.queryByRole('region', { name: 'Datum en tijd' })).not.toBeInTheDocument()
    expect(open).not.toHaveBeenCalled()
    // Met een datum opent het knopje ook het vak, met de datum al ingevuld; datum zelf is niet aan te tikken.
    expect(screen.queryByRole('button', { name: /do 12 nov/ })).not.toBeInTheDocument()
    await agendaButton(user, 'Tandarts')
    const box2 = screen.getByRole('region', { name: 'Datum en tijd' })
    expect(within(box2).getByLabelText('Datum en tijd van Tandarts')).toHaveValue('2026-11-12T09:30')
    await user.click(within(box2).getByRole('button', { name: 'In agenda zetten' }))
    const choice = screen.getByRole('region', { name: 'Agenda kiezen' })
    expect(within(choice).getByText('In welke agenda?')).toBeInTheDocument()
    expect(within(choice).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Google Agenda',
      'Outlook (privé)',
      'Outlook (werk)',
      'Andere agenda',
      'Delen…',
      'Annuleren',
    ])
    await user.click(within(choice).getByRole('button', { name: 'Google Agenda' }))
    expect(open).toHaveBeenCalledTimes(1)
    const url = new URL(open.mock.calls[0][0])
    expect(url.hostname).toBe('calendar.google.com')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('Tandarts')
    expect(url.searchParams.get('dates')).toBe('20261112T093000/20261112T100000')
    // Het item staat nu in de agenda (blauw agenda-knopje).
    expect(await screen.findByRole('button', { name: 'Tandarts staat in je agenda; datum wijzigen' })).toHaveClass('placed')

    // Nog eens: het vak zegt dat het er al in staat, en met dezelfde datum kan het er niet nog eens in.
    await agendaButton(user, 'Tandarts')
    const box3 = screen.getByRole('region', { name: 'Datum en tijd' })
    expect(within(box3).getByText('Staat al in je agenda op do 12 nov 09:30.')).toBeInTheDocument()
    expect(within(box3).getByRole('button', { name: 'In agenda zetten' })).toBeDisabled()
    await user.click(within(box3).getByRole('button', { name: 'Annuleren' }))

    // Volgende item: geen keuze meer, meteen naar Google Agenda.
    await agendaButton(user, 'APK')
    fireEvent.change(screen.getByLabelText('Datum en tijd van APK'), { target: { value: '2026-11-20T08:00' } })
    await user.click(screen.getByRole('button', { name: 'In agenda zetten' }))
    expect(screen.queryByRole('region', { name: 'Agenda kiezen' })).not.toBeInTheDocument()
    expect(open).toHaveBeenCalledTimes(2)
    expect(new URL(open.mock.calls[1][0]).searchParams.get('text')).toBe('APK')

    // Met het belletje kies je een andere agenda voor het lijstje.
    await user.click(screen.getByRole('button', { name: 'Agenda van dit lijstje' }))
    const change = screen.getByRole('region', { name: 'Agenda kiezen' })
    expect(within(change).getByText('Herinneringen voor Afspraken')).toBeInTheDocument()
    expect(within(change).getByRole('button', { name: 'Google Agenda' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(change).getByRole('button', { name: 'Outlook (werk)' }))
    // Alleen kiezen zet niets in de agenda.
    expect(open).toHaveBeenCalledTimes(2)
    await agendaButton(user, 'Anne bellen')
    fireEvent.change(screen.getByLabelText('Datum en tijd van Anne bellen'), { target: { value: '2026-11-21T10:00' } })
    await user.click(screen.getByRole('button', { name: 'In agenda zetten' }))
    expect(new URL(open.mock.calls[2][0]).hostname).toBe('outlook.office.com')
    // De keuze is bewaard.
    expect(JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!).lijstjes.h.agenda).toBe('outlook-werk')
  })

  it('zet een item zonder datum vanuit het vak met datum en tijd meteen in de agenda', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    storeAfspraken({}, 'outlook')
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'APK in agenda zetten' }))
    const box = screen.getByRole('region', { name: 'Datum en tijd' })
    fireEvent.change(within(box).getByLabelText('Datum en tijd van APK'), { target: { value: '2026-11-20T08:00' } })
    await user.click(within(box).getByRole('button', { name: 'In agenda zetten' }))
    expect(open).toHaveBeenCalledTimes(1)
    const url = new URL(open.mock.calls[0][0])
    expect(url.hostname).toBe('outlook.live.com')
    expect(url.searchParams.get('subject')).toBe('APK')
    expect(screen.getByText('vr 20 nov 08:00')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'APK staat in je agenda; datum wijzigen' })).toHaveClass('placed')
  })

  it('maakt goede links en een agenda-bestand', () => {
    const a = { id: 'x', titel: 'Tandarts, controle', lijstje: 'Afspraken', wanneer: '2026-11-12T09:30' }
    const google = new URL(googleUrl(a))
    expect(google.searchParams.get('details')).toBe('Uit Lijstjes: Afspraken')
    const prive = new URL(outlookUrl(a, false))
    expect(prive.hostname).toBe('outlook.live.com')
    expect(prive.pathname).toBe('/calendar/0/deeplink/compose')
    expect(prive.searchParams.get('subject')).toBe('Tandarts, controle')
    expect(prive.searchParams.get('startdt')).toBe(new Date(2026, 10, 12, 9, 30).toISOString())
    expect(prive.searchParams.get('enddt')).toBe(new Date(2026, 10, 12, 10, 0).toISOString())
    expect(new URL(outlookUrl(a, true)).hostname).toBe('outlook.office.com')
    const ics = icsBestand(a, new Date(Date.UTC(2026, 10, 7, 9, 0)))
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('SUMMARY:Tandarts\\, controle')
    expect(ics).toContain(`DTSTART:${new Date(2026, 10, 12, 9, 30).toISOString().replace(/[-:]/g, '').replace('.000', '')}`)
    expect(ics.split('\r\n').length).toBeGreaterThan(10)
  })
})

describe('AC28: datum wijzigen van een item in de agenda', () => {
  it('waarschuwt dat het oude agenda-item blijft staan', async () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30', inAgenda: '2026-11-12T09:30' } }, 'google')
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Tandarts staat in je agenda; datum wijzigen' })).toBeInTheDocument()
    await setDate(user, 'Tandarts', '2026-11-13T09:30')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tandarts staat nog met de oude datum en tijd in je agenda. Verwijder dat agenda-item zelf.',
    )
    expect(screen.getByRole('button', { name: 'Tandarts in agenda zetten' })).not.toHaveClass('placed')
  })

  it('waarschuwt niet bij een item dat niet in de agenda staat', async () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30' } })
    const user = userEvent.setup()
    render(<App />)
    await setDate(user, 'Tandarts', '2026-11-13T09:30')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('AC30: herinneringen in de app', () => {
  it('toont bij het openen de items van vandaag en eerder, niet afgevinkte, de oudste eerst', async () => {
    storeAfspraken({
      Tandarts: { wanneer: '2026-11-07T16:00' },
      'Anne bellen': { wanneer: '2026-11-05T09:00' },
      APK: { wanneer: '2026-11-08T08:00' },
    })
    const user = userEvent.setup()
    render(<App />)
    const box = screen.getByRole('region', { name: 'Herinneringen' })
    const lines = within(box).getAllByRole('button').filter((b) => b.classList.contains('reminder'))
    expect(lines.map((b) => b.textContent)).toEqual(['do 5 nov 09:00 Anne bellen (Afspraken)', 'Vandaag 16:00 Tandarts (Afspraken)'])
    expect(lines[0]).toHaveClass('past')
    expect(lines[1]).not.toHaveClass('past')
    // Afvinken in de melding vinkt het item af op het lijstje en haalt het uit de melding.
    await user.click(within(box).getByRole('button', { name: 'Tandarts afvinken' }))
    expect(within(box).queryByText('Tandarts')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tandarts' })).toHaveAttribute('aria-pressed', 'true')
    // Een afgevinkt item kan niet in de agenda.
    expect(screen.getByRole('button', { name: 'Tandarts in agenda zetten' })).toBeDisabled()
    // Afvinken op het lijstje haalt het ook uit de melding.
    await user.click(screen.getByRole('button', { name: 'Anne bellen' }))
    expect(within(box).queryByText('Anne bellen')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anne bellen' }))
    // Sluiten: weg, tot je de app weer opent of terugkomt in de app.
    // Anne bellen staat weer in de melding (die opnieuw verscheen toen hij even leeg was).
    const again = screen.getByRole('region', { name: 'Herinneringen' })
    expect(within(again).getByText('Anne bellen')).toBeInTheDocument()
    await user.click(within(again).getByRole('button', { name: 'Herinneringen sluiten' }))
    expect(screen.queryByRole('region', { name: 'Herinneringen' })).not.toBeInTheDocument()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    fireEvent(document, new Event('visibilitychange'))
    expect(await screen.findByRole('region', { name: 'Herinneringen' })).toBeInTheDocument()
  })

  it('opent het lijstje als je op een herinnering tikt, ook vanaf Mijn lijstjes', async () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-07T16:00' } })
    localStorage.removeItem('lijstjes-huidig')
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Mijn lijstjes' })).toBeInTheDocument()
    await user.click(within(screen.getByRole('region', { name: 'Herinneringen' })).getByRole('button', { name: /^Vandaag/ }))
    expect(screen.getByRole('heading', { name: 'Afspraken' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Herinneringen' })).not.toBeInTheDocument()
  })

  it('toont niets zonder items van vandaag of eerder', () => {
    storeAfspraken({ APK: { wanneer: '2026-11-08T08:00' } })
    render(<App />)
    expect(screen.queryByRole('region', { name: 'Herinneringen' })).not.toBeInTheDocument()
  })
})

describe('AC31: datum weghalen met het kruisje', () => {
  it('maakt het datumveld leeg; bewaren haalt de datum weg', async () => {
    storeAfspraken({ APK: { wanneer: '2026-11-20T08:00' } })
    const user = userEvent.setup()
    render(<App />)
    await agendaButton(user, 'APK')
    const box = screen.getByRole('region', { name: 'Datum en tijd' })
    await user.click(within(box).getByRole('button', { name: 'Datum weghalen' }))
    expect(within(box).getByLabelText('Datum en tijd van APK')).toHaveValue('')
    expect(within(box).getByRole('button', { name: 'Datum weghalen' })).toBeDisabled()
    expect(within(box).getByRole('button', { name: 'In agenda zetten' })).toBeDisabled()
    await user.click(within(box).getByRole('button', { name: 'Alleen in Lijstjes bewaren' }))
    expect(screen.queryByText('vr 20 nov 08:00')).not.toBeInTheDocument()
  })
})

describe('AC29: terug naar een oudere versie kan', () => {
  it('bewaart de lijstjes zoals versie 1.3 ze kent, en de herinneringen apart', async () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30', inAgenda: '2026-11-12T09:30' } }, 'google')
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'kapper')
    const saved = JSON.parse(localStorage.getItem(LISTS_KEY)!)
    // Alleen id, naam en items met id, tekst en af: precies wat versie 1.3 leest.
    for (const l of saved) {
      expect(Object.keys(l).sort()).toEqual(['id', 'items', 'naam'])
      for (const i of l.items) expect(Object.keys(i).sort()).toEqual(['af', 'id', 'tekst'])
    }
    expect(saved.find((l: Lijstje) => l.id === 'h').items.map((i: { tekst: string }) => i.tekst)).toEqual([
      'Tandarts',
      'Anne bellen',
      'APK',
      'kapper',
    ])
    expect(JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!)).toEqual({
      lijstjes: { h: { agenda: 'google' } },
      items: { 'h-0': { wanneer: '2026-11-12T09:30', inAgenda: '2026-11-12T09:30' } },
    })
  })

  it('zet de datums terug als een oudere versie de lijstjes intussen heeft gewijzigd', () => {
    // Na teruggaan heeft versie 1.3 een item weggegooid en een item toegevoegd; de herinneringen staan er nog.
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30' }, APK: { wanneer: '2026-11-20T08:00' } })
    storeLists([{ id: 'h', naam: 'Afspraken', items: [{ id: 'h-0', tekst: 'Tandarts', af: false }, { id: 'n', tekst: 'kapper', af: false }] }])
    const lijstjes = loadLijstjes()
    expect(lijstjes[0]).toEqual({
      id: 'h',
      naam: 'Afspraken',
      herinnering: true,
      items: [
        { id: 'h-0', tekst: 'Tandarts', af: false, wanneer: '2026-11-12T09:30' },
        { id: 'n', tekst: 'kapper', af: false },
      ],
    })
  })

  it('leest lijstjes van versie 1.3 zonder herinneringen gewoon', () => {
    storeLists([list('a', 'AH', ['melk'])])
    expect(loadLijstjes()).toEqual([list('a', 'AH', ['melk'])])
    localStorage.setItem(HERINNERINGEN_KEY, 'kapot')
    expect(loadLijstjes()).toEqual([list('a', 'AH', ['melk'])])
  })

  it('maakt een backup die versie 1.3 kan terugzetten en die de herinneringen bewaart', () => {
    const lijstjes: Lijstje[] = [
      { id: 'h', naam: 'Afspraken', herinnering: true, agenda: 'ics', items: [{ id: 't', tekst: 'Tandarts', af: false, wanneer: '2026-11-12T09:30' }] },
    ]
    const text = createBackup(lijstjes, 'h', new Date())
    const data = JSON.parse(text)
    expect(data.versie).toBe(1)
    // Zoals versie 1.3 de backup leest:
    expect(parseLijstjes(data.lijstjes)).toEqual([{ id: 'h', naam: 'Afspraken', items: [{ id: 't', tekst: 'Tandarts', af: false }] }])
    expect(parseBackup(text).lijstjes).toEqual(lijstjes)
  })
})

describe('AC33: herinnering aan- en uitzetten op het lijstje', () => {
  it('maakt van een gewoon lijstje een herinneringslijstje; items zonder datum tonen "Geen datum"', async () => {
    const user = userEvent.setup()
    storeLists([list('a', 'AH', ['melk', 'brood'])], 'a')
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Agenda van dit lijstje' })).not.toBeInTheDocument()
    expect(screen.queryByText('Geen datum')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Herinneringslijstje maken' }))
    expect(screen.getByRole('region', { name: 'Agenda kiezen' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Herinnering' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Agenda van dit lijstje' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('button', { name: 'Herinneringslijstje maken' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Geen datum')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('AH is nu een herinneringslijstje.')
    expect(JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!).lijstjes).toEqual({ a: {} })
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!)[0]).toEqual(list('a', 'AH', ['melk', 'brood']))
  })

  it('het schuifje zet de herinnering uit; datums en agenda blijven bewaard en komen terug', async () => {
    const user = userEvent.setup()
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30', inAgenda: '2026-11-12T09:30' } }, 'google')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Agenda van dit lijstje' }))
    await user.click(screen.getByRole('switch', { name: 'Herinnering' }))
    expect(screen.queryByRole('region', { name: 'Agenda kiezen' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Herinneringslijstje maken' })).toBeInTheDocument()
    expect(screen.queryByText('do 12 nov 09:30')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /in agenda zetten|staat in je agenda/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tandarts verplaatsen' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Afspraken is weer een gewoon lijstje.')
    expect(screen.getByRole('status')).toHaveTextContent('1 item staat nog in je agenda')
    expect(JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!).lijstjes.h).toEqual({ agenda: 'google', uit: true })
    expect(loadLijstjes()[0].herinnering).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Herinneringslijstje maken' }))
    expect(screen.getByText('do 12 nov 09:30')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tandarts staat in je agenda; datum wijzigen' })).toBeInTheDocument()
    expect(loadLijstjes()[0].agenda).toBe('google')
  })

  it('een uitgezet herinneringslijstje staat niet in de melding Herinneringen', async () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-07T16:00' } })
    const h = JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!)
    h.lijstjes.h = { uit: true }
    localStorage.setItem(HERINNERINGEN_KEY, JSON.stringify(h))
    render(<App />)
    expect(screen.queryByRole('region', { name: 'Herinneringen' })).not.toBeInTheDocument()
  })
})

describe('AC34: per item kiezen', () => {
  it('de bel toont zes keuzes, de eerste keer zonder keuze; Per item kiezen vraagt bij elk item welke agenda', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30' }, APK: { wanneer: '2026-11-20T08:00' } })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Agenda van dit lijstje' }))
    const choice = screen.getByRole('region', { name: 'Agenda kiezen' })
    expect(within(choice).getByRole('switch', { name: 'Herinnering' })).toBeChecked()
    const keuzes = within(choice).getAllByRole('button')
    expect(keuzes.map((b) => b.textContent)).toEqual([
      'Google Agenda',
      'Outlook (privé)',
      'Outlook (werk)',
      'Andere agenda',
      'Delen…',
      'Per item kiezen',
    ])
    expect(keuzes.every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
    await user.click(within(choice).getByRole('button', { name: 'Per item kiezen' }))
    expect(screen.queryByRole('region', { name: 'Agenda kiezen' })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!).lijstjes.h.agenda).toBe('per-item')

    for (const [tekst, agenda, host] of [
      ['Tandarts', 'Google Agenda', 'calendar.google.com'],
      ['APK', 'Outlook (privé)', 'outlook.live.com'],
    ]) {
      await agendaButton(user, tekst)
      await user.click(screen.getByRole('button', { name: 'In agenda zetten' }))
      const vraag = screen.getByRole('region', { name: 'Agenda kiezen' })
      expect(within(vraag).getByText('In welke agenda?')).toBeInTheDocument()
      expect(within(vraag).getByText('Kies waar je dit item ook op wilt nemen.')).toBeInTheDocument()
      await user.click(within(vraag).getByRole('button', { name: agenda }))
      expect(new URL(open.mock.lastCall![0]).hostname).toBe(host)
    }
    expect(JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!).lijstjes.h.agenda).toBe('per-item')
    await user.click(screen.getByRole('button', { name: 'Agenda van dit lijstje' }))
    expect(screen.getByRole('button', { name: 'Per item kiezen' })).toHaveAttribute('aria-pressed', 'true')
  })
})
