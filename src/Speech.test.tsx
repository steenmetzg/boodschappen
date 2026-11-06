import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { SPEECH_KEY, splitSpoken } from './speech'
import { itemTexts, rememberFirstList, typeItem } from './test/helpers'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// Nagemaakte spraakherkenning van Chrome: de test bepaalt wat er "gehoord" wordt.
class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ''
  interimResults = true
  maxAlternatives = 1
  continuous = true
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  start() {
    FakeRecognition.last = this
  }
  abort() {
    this.onerror?.({ error: 'aborted' })
    this.onend?.()
  }
  hear(...alternatives: string[]) {
    act(() => {
      this.onresult?.({ results: [alternatives.map((transcript) => ({ transcript }))] })
      this.onend?.()
    })
  }
  fail(error: string) {
    act(() => {
      this.onerror?.({ error })
      this.onend?.()
    })
  }
}

const win = window as unknown as { webkitSpeechRecognition?: unknown }

beforeEach(() => {
  rememberFirstList()
  FakeRecognition.last = null
  win.webkitSpeechRecognition = FakeRecognition
})

afterEach(() => {
  delete win.webkitSpeechRecognition
})

describe('splitSpoken', () => {
  it('splitst bij "komma" en komma\'s, en begint elk item met een kleine letter', () => {
    expect(splitSpoken('Melk komma brood komma kaas')).toEqual(['melk', 'brood', 'kaas'])
    expect(splitSpoken('Melk, brood, 2 pakken koffie.')).toEqual(['melk', 'brood', '2 pakken koffie'])
    expect(splitSpoken('wc-papier')).toEqual(['wc-papier'])
  })

  it('splitst niet bij "en"', () => {
    expect(splitSpoken('Jan en Piet ophalen van Schiphol')).toEqual(['jan en Piet ophalen van Schiphol'])
    expect(splitSpoken('bananen en tomaten komma kaas')).toEqual(['bananen en tomaten', 'kaas'])
  })
})

describe('AC13: items inspreken', () => {
  it('zet "melk komma brood komma kaas" als drie items op het huidige lijstje', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    expect(FakeRecognition.last?.lang).toBe('nl-NL')
    expect(screen.getByText('Luisteren…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stoppen met luisteren' })).toHaveAttribute('aria-pressed', 'true')
    FakeRecognition.last!.hear('Melk komma brood komma kaas')
    expect(itemTexts()).toEqual(['melk', 'brood', 'kaas'])
    expect(screen.getByRole('status')).toHaveTextContent('Toegevoegd: melk, brood, kaas.')
  })

  it('voegt een ingesproken item dat er al op staat niet nog eens toe', async () => {
    const user = userEvent.setup()
    render(<App />)
    await typeItem(user, 'melk')
    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    FakeRecognition.last!.hear('melk komma eieren')
    expect(itemTexts()).toEqual(['melk', 'eieren'])
    expect(screen.getByRole('status')).toHaveTextContent('Toegevoegd: eieren. Melk staat er al op.')
  })

  it('stopt met luisteren bij nog een tik op de knop', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    await user.click(screen.getByRole('button', { name: 'Stoppen met luisteren' }))
    expect(screen.getByRole('button', { name: 'Inspreken' })).toHaveAttribute('aria-pressed', 'false')
    expect(itemTexts()).toEqual([])
  })

  it('geeft een melding in gewone taal als er niets gehoord is', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    FakeRecognition.last!.fail('no-speech')
    expect(screen.getByRole('status')).toHaveTextContent('Ik hoorde niets. Tik op de microfoon en probeer het opnieuw.')
  })
})

describe('AC14: microfoon aan en uit', () => {
  it('haalt de microfoonknop weg als de microfoon in de instellingen uit staat', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Terug naar Mijn lijstjes' }))
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    await user.click(screen.getByRole('button', { name: 'Microfoon' }))
    expect(localStorage.getItem(SPEECH_KEY)).toBe('nee')
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Mijn 1e lijstje' }))
    expect(screen.queryByRole('button', { name: 'Inspreken' })).not.toBeInTheDocument()
  })

  it('heeft geen microfoonknop als de browser geen spraak kent', () => {
    delete win.webkitSpeechRecognition
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Inspreken' })).not.toBeInTheDocument()
  })
})
