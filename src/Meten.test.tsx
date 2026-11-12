import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { countUrl, setMetenVoorTest, startMeten, tel } from './meten'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

const ECHT = { hostname: 'steenmetzg.github.io' }

function tellingen(send: ReturnType<typeof vi.fn>) {
  return send.mock.calls.map(([url]) => new URL(url as string).searchParams.get('p'))
}

afterEach(() => {
  setMetenVoorTest(null, null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('AC35 (F39): tellen bij starten en installeren', () => {
  it('telt één start in de browser, met alleen de naam van de telling', () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    startMeten()
    render(<App />)
    expect(tellingen(send)).toEqual(['lijstjes-start-browser'])
  })

  it('telt een start van de geïnstalleerde app apart', () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(display-mode: standalone)' }))
    startMeten()
    expect(tellingen(send)).toEqual(['lijstjes-start-geinstalleerd'])
  })

  it('telt een installatie', () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    startMeten()
    window.dispatchEvent(new Event('appinstalled'))
    expect(tellingen(send)).toContain('lijstjes-installatie')
  })

  it('stuurt alleen naam, titel, gebeurtenis en een willekeurig getal naar GoatCounter', () => {
    const url = new URL(countUrl('installatie', false, 'abc'))
    expect(url.origin + url.pathname).toBe('https://steenmetzg.goatcounter.com/count')
    expect([...url.searchParams.entries()]).toEqual([
      ['p', 'lijstjes-installatie'],
      ['t', 'Lijstjes geïnstalleerd'],
      ['e', 'true'],
      ['rnd', 'abc'],
    ])
  })

  it('de testversie telt apart, met lijstjes-test-', () => {
    const url = new URL(countUrl('start-browser', true, 'abc'))
    expect(url.searchParams.get('p')).toBe('lijstjes-test-start-browser')
    expect(url.searchParams.get('t')).toBe('Lijstjes gestart (browser) (testversie)')
  })

  it('telt niet bij gewoon gebruik van de app (lijstjes en items)', async () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Informatie' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(send).not.toHaveBeenCalled()
  })
})

describe('AC35 (F39): zonder internet, bij een fout of in de tests gebeurt er niets', () => {
  it('telt niet zonder internet, ook niet later', () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    tel('start-browser')
    online.mockReturnValue(true)
    expect(send).not.toHaveBeenCalled()
  })

  it('geeft geen foutmelding als versturen mislukt', () => {
    setMetenVoorTest(ECHT, () => {
      throw new Error('geen verbinding')
    })
    expect(() => tel('start-browser')).not.toThrow()
  })

  it('telt niet in de tests zelf (localhost)', () => {
    const send = vi.fn(() => true)
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { sendBeacon: send }))
    tel('start-browser')
    expect(send).not.toHaveBeenCalled()
  })
})

describe('AC36 (F40): de informatiepagina vertelt het, uitzetten kan niet', () => {
  it('noemt het anoniem tellen bij Instellingen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Informatie' }))
    expect(
      screen.getByText(
        'Lijstjes telt anoniem hoe vaak de app wordt geïnstalleerd en geopend; wat je op je lijstjes zet, wordt nooit verstuurd.',
      ),
    ).toBeInTheDocument()
  })

  it('heeft geen knop om het tellen uit te zetten', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(screen.queryByText(/meten|tellen/i)).not.toBeInTheDocument()
  })
})
