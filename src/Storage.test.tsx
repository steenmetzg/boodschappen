import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import folderStoreSource from './folderStore.ts?raw'
import { rememberFirstList, typeItem } from './test/helpers'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

describe('AC16: eigen opslag naast WoonWerk', () => {
  it('gebruikt alleen sleutels die met "lijstjes-" beginnen', async () => {
    vi.stubGlobal('webkitSpeechRecognition', class {})
    rememberFirstList()
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(screen.getByRole('button', { name: 'Terug naar Mijn lijstjes' }))
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    await user.click(screen.getByRole('button', { name: 'Microfoon' }))
    const keys = Object.keys(localStorage)
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) expect(key).toMatch(/^lijstjes-/)
    vi.unstubAllGlobals()
  })

  it('leest of overschrijft de gegevens van WoonWerk nooit', async () => {
    localStorage.setItem('vervoer-registraties', '{"2026-11-06":["fiets"]}')
    localStorage.setItem('spraak-aan', 'nee')
    rememberFirstList()
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    expect(localStorage.getItem('vervoer-registraties')).toBe('{"2026-11-06":["fiets"]}')
    expect(localStorage.getItem('spraak-aan')).toBe('nee')
  })

  it('bewaart de backupmap in een eigen database', () => {
    expect(folderStoreSource).toContain('const DB_NAME = `${KEY_PREFIX}backupmap`')
  })
})

describe('Testversie: eigen opslag naast de echte app', () => {
  it('gebruikt "lijstjes-test-" in de testversie en "lijstjes-" in de echte app', async () => {
    vi.stubEnv('VITE_TEST', '')
    vi.resetModules()
    const echt = await import('./storageKey')
    expect(echt.IS_TEST).toBe(false)
    expect(echt.KEY_PREFIX).toBe('lijstjes-')
    vi.stubEnv('VITE_TEST', '1')
    vi.resetModules()
    const test = await import('./storageKey')
    const lists = await import('./lists')
    expect(test.IS_TEST).toBe(true)
    expect(lists.LISTS_KEY).toBe('lijstjes-test-data')
    expect(lists.CURRENT_KEY).toBe('lijstjes-test-huidig')
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})
