import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { LISTS_KEY } from './lists'
import { itemButton, itemTexts, list, storeLists } from './test/helpers'

// Een opgeslagen backupmap leeft in de tests in het geheugen in plaats van IndexedDB.
const folderMemory = vi.hoisted(() => ({ handle: null as unknown }))
vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => folderMemory.handle,
  storeFolder: async (handle: unknown) => {
    folderMemory.handle = handle
  },
}))

/** Een nagebootste map op de telefoon die bijhoudt welke bestanden erin worden geschreven. */
function fakeFolder(name: string) {
  const files: Record<string, string> = {}
  return {
    files,
    handle: {
      name,
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
      getFileHandle: async (fileName: string) => ({
        createWritable: async () => ({
          write: async (text: string) => {
            files[fileName] = text
          },
          close: async () => {},
        }),
      }),
    },
  }
}

const win = window as unknown as { showDirectoryPicker?: unknown }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 6, 9, 0))
  folderMemory.handle = null
})

afterEach(() => {
  vi.useRealTimers()
  delete win.showDirectoryPicker
})

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  // De app kan met een lijstje starten; het tandwiel staat op Mijn lijstjes.
  const back = screen.queryByRole('button', { name: 'Terug naar Mijn lijstjes' })
  if (back) await user.click(back)
  await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
}

function backupFile(text: string, name = '2026-11-06-lijstjes.json') {
  return new File([text], name, { type: 'application/json' })
}

describe('AC15: backup maken en inlezen', () => {
  it('slaat een backup op in de gekozen map en leest hem terug in, met precies dezelfde lijstjes', async () => {
    const user = userEvent.setup()
    const folder = fakeFolder('Lijstjes')
    win.showDirectoryPicker = vi.fn(async () => folder.handle)
    storeLists([list('a', 'AH', ['melk', ['brood', true]]), list('b', 'Klussen', ['lamp'])], 'b')
    const { unmount } = render(<App />)
    await openSettings(user)
    await user.click(screen.getByRole('button', { name: 'Map kiezen' }))
    expect(await screen.findByTestId('backupmap')).toHaveTextContent('Map: Lijstjes')
    await user.click(screen.getByRole('button', { name: 'Backup maken' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Backup van 2 lijstjes en 3 items opgeslagen als 2026-11-06-lijstjes.json in de map "Lijstjes".',
    )
    const saved = folder.files['2026-11-06-lijstjes.json']
    const backup = JSON.parse(saved)
    expect(backup).toMatchObject({ app: 'lijstjes', versie: 1, huidig: 'b' })

    unmount()

    // Op een "andere telefoon" met andere lijstjes de backup inlezen.
    localStorage.clear()
    storeLists([list('x', 'Iets anders')])
    render(<App />)
    await openSettings(user)
    await user.upload(screen.getByLabelText('Backupbestand'), backupFile(saved))
    await user.click(within(await screen.findByRole('alertdialog', { name: 'Backup inlezen?' })).getByRole('button', { name: 'Inlezen' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getByRole('button', { name: 'Klussen, 1 open' })).toHaveAttribute('aria-current', 'true')
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!)).toEqual(backup.lijstjes)
  })

  it('leest een backup in na bevestiging en vervangt alle lijstjes', async () => {
    const user = userEvent.setup()
    const backup = JSON.stringify({
      app: 'lijstjes',
      versie: 1,
      gemaakt: new Date(2026, 9, 1, 12, 0).toISOString(),
      lijstjes: [list('a', 'AH', ['melk', ['brood', true]]), list('b', 'Klussen', ['lamp'])],
      huidig: 'a',
    })
    storeLists([list('x', 'Iets anders', ['weg'])])
    render(<App />)
    await openSettings(user)
    await user.upload(screen.getByLabelText('Backupbestand'), backupFile(backup))
    const question = await screen.findByRole('alertdialog', { name: 'Backup inlezen?' })
    expect(question).toHaveTextContent('Backup van 1 oktober 2026 met 2 lijstjes en 3 items inlezen? Dit vervangt al je huidige lijstjes.')
    await user.click(within(question).getByRole('button', { name: 'Inlezen' }))
    expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen: 2 lijstjes en 3 items.')
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'AH, 1 open' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AH')
    expect(itemTexts()).toEqual(['melk', 'brood'])
    expect(itemButton('brood')).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem(LISTS_KEY)!)).toHaveLength(2)
  })

  it('verandert niets bij Annuleren', async () => {
    const user = userEvent.setup()
    const backup = JSON.stringify({ app: 'lijstjes', versie: 1, gemaakt: '', lijstjes: [list('a', 'AH')], huidig: 'a' })
    storeLists([list('x', 'Iets anders', ['blijft'])])
    render(<App />)
    await openSettings(user)
    await user.upload(screen.getByLabelText('Backupbestand'), backupFile(backup))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Annuleren' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Iets anders, 1 open' }))
    expect(itemTexts()).toEqual(['blijft'])
  })

  it('geeft een melding bij een ongeldig bestand en verandert niets', async () => {
    const user = userEvent.setup()
    storeLists([list('x', 'Iets anders', ['blijft'])])
    render(<App />)
    await openSettings(user)
    await user.upload(screen.getByLabelText('Backupbestand'), backupFile('{"app": "woon-werkvervoer", "versie": 2}', 'woonwerk.json'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Dit bestand is geen backup van Lijstjes.'))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Iets anders, 1 open' }))
    expect(itemTexts()).toEqual(['blijft'])
  })

  it('slaat de backup op in Downloads als er geen map gekozen kan worden', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:backup')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }))
    render(<App />)
    await openSettings(user)
    await user.click(screen.getByRole('button', { name: 'Backup maken' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Backup van 1 lijstje en 0 items opgeslagen als 2026-11-06-lijstjes.json in Downloads.',
    )
    expect(createObjectURL).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})

describe('AC18: versienummer', () => {
  it('staat onderaan de instellingen, uit package.json', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    expect(screen.getByText('Versie: 1.2.5')).toBeInTheDocument()
  })
})
