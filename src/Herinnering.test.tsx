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

function setDate(tekst: string, value: string) {
  fireEvent.change(screen.getByLabelText(`Datum en tijd van ${tekst}`), { target: { value } })
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
    expect(screen.getByText('Datum kiezen')).toBeInTheDocument()
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
  it('toont de datum onder het item, sorteert op datum en kleurt een voorbije datum rood', () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30' } })
    render(<App />)
    expect(itemTexts()).toEqual(['Tandarts', 'Anne bellen', 'APK'])
    setDate('APK', '2026-11-08T14:00')
    expect(screen.getByText('zo 8 nov 14:00')).toBeInTheDocument()
    expect(screen.getByText('do 12 nov 09:30')).toBeInTheDocument()
    // APK is eerder dan de tandarts en staat nu bovenaan; Anne bellen heeft geen datum en staat onderaan.
    expect(itemTexts()).toEqual(['APK', 'Tandarts', 'Anne bellen'])
    setDate('Anne bellen', '2026-11-06T19:00')
    expect(itemTexts()).toEqual(['Anne bellen', 'APK', 'Tandarts'])
    expect(screen.getByText('vr 6 nov 19:00').parentElement).toHaveClass('past')
    expect(screen.getByText('zo 8 nov 14:00').parentElement).not.toHaveClass('past')
    // Datum weghalen: weer "Datum kiezen", onderaan.
    setDate('Anne bellen', '')
    expect(itemTexts()).toEqual(['APK', 'Tandarts', 'Anne bellen'])
    expect(screen.getByText('Datum kiezen')).toBeInTheDocument()
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
    // Zonder datum kan het item niet in de agenda.
    expect(screen.getByRole('button', { name: 'APK in agenda zetten' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Tandarts in agenda zetten' }))
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
    const placed = await screen.findByRole('button', { name: 'Tandarts staat in je agenda; opnieuw in agenda zetten' })
    expect(placed).toHaveClass('placed')

    // Volgende keer geen keuze meer: meteen naar Google Agenda.
    setDate('APK', '2026-11-20T08:00')
    await user.click(screen.getByRole('button', { name: 'APK in agenda zetten' }))
    expect(screen.queryByRole('region', { name: 'Agenda kiezen' })).not.toBeInTheDocument()
    expect(open).toHaveBeenCalledTimes(2)
    expect(new URL(open.mock.calls[1][0]).searchParams.get('text')).toBe('APK')

    // Met het belletje kies je een andere agenda voor het lijstje.
    await user.click(screen.getByRole('button', { name: 'Agenda van dit lijstje' }))
    const change = screen.getByRole('region', { name: 'Agenda kiezen' })
    expect(within(change).getByText('Agenda voor Afspraken')).toBeInTheDocument()
    expect(within(change).getByRole('button', { name: 'Google Agenda' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(change).getByRole('button', { name: 'Outlook (werk)' }))
    // Alleen kiezen zet niets in de agenda.
    expect(open).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: 'APK staat in je agenda; opnieuw in agenda zetten' }))
    expect(new URL(open.mock.calls[2][0]).hostname).toBe('outlook.office.com')
    // De keuze is bewaard.
    expect(JSON.parse(localStorage.getItem(HERINNERINGEN_KEY)!).lijstjes.h.agenda).toBe('outlook-werk')
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
  it('waarschuwt dat het oude agenda-item blijft staan', () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30', inAgenda: '2026-11-12T09:30' } }, 'google')
    render(<App />)
    expect(screen.getByRole('button', { name: 'Tandarts staat in je agenda; opnieuw in agenda zetten' })).toBeInTheDocument()
    setDate('Tandarts', '2026-11-13T09:30')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tandarts staat nog met de oude datum en tijd in je agenda. Verwijder dat agenda-item zelf.',
    )
    expect(screen.getByRole('button', { name: 'Tandarts in agenda zetten' })).not.toHaveClass('placed')
  })

  it('waarschuwt niet bij een item dat niet in de agenda staat', () => {
    storeAfspraken({ Tandarts: { wanneer: '2026-11-12T09:30' } })
    render(<App />)
    setDate('Tandarts', '2026-11-13T09:30')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
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
