import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { INSTALL_LATER_KEY } from './installPrompt'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// "Vandaag" is in alle tests vrijdag 6 november 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 6, 9, 0))
})

afterEach(() => {
  // Ruim een opgevangen signaal op, zodat elke test schoon begint.
  window.dispatchEvent(new Event('appinstalled'))
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/** Doet na wat Chrome doet als de app installeerbaar is. */
function chromeOffersInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function installQuestion() {
  return screen.queryByRole('region', { name: 'App installeren' })
}

describe('AC17: vraag om te installeren', () => {
  it('toont geen vraag zonder melding van Chrome', () => {
    render(<App />)
    expect(installQuestion()).not.toBeInTheDocument()
  })

  it('toont de vraag met Installeren en Niet nu als Chrome de app installeerbaar vindt', () => {
    render(<App />)
    const event = chromeOffersInstall()
    expect(event.defaultPrevented).toBe(true)
    expect(installQuestion()).toHaveTextContent('Lijstjes als app installeren?')
  })

  it('toont geen vraag in de geïnstalleerde app', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(display-mode: standalone)' }))
    render(<App />)
    chromeOffersInstall()
    expect(installQuestion()).not.toBeInTheDocument()
  })

  it('opent bij Installeren het venster van Chrome', async () => {
    const user = userEvent.setup()
    render(<App />)
    const event = chromeOffersInstall('accepted')
    await user.click(screen.getByRole('button', { name: 'Installeren' }))
    expect(event.prompt).toHaveBeenCalledOnce()
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(installQuestion()).not.toBeInTheDocument()
  })

  it('vraagt na "Niet nu" pas na 30 dagen opnieuw', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    chromeOffersInstall()
    await user.click(screen.getByRole('button', { name: 'Niet nu' }))
    expect(installQuestion()).not.toBeInTheDocument()
    unmount()

    vi.setSystemTime(new Date(2026, 11, 5, 9, 0))
    const second = render(<App />)
    chromeOffersInstall()
    expect(installQuestion()).not.toBeInTheDocument()
    second.unmount()

    vi.setSystemTime(new Date(2026, 11, 6, 9, 1))
    render(<App />)
    chromeOffersInstall()
    expect(installQuestion()).toBeInTheDocument()
  })

  it('brengt de vraag terug met Vraag weer tonen in de instellingen', async () => {
    const user = userEvent.setup()
    render(<App />)
    chromeOffersInstall()
    await user.click(screen.getByRole('button', { name: 'Niet nu' }))
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(screen.getByText(/komt terug op 6 december/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vraag weer tonen' }))
    expect(localStorage.getItem(INSTALL_LATER_KEY)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(installQuestion()).toBeInTheDocument()
  })
})
