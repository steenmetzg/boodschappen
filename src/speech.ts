import { useEffect, useRef, useState } from 'react'
import { MAX_NAAM, MAX_TEKST } from './lists'
import { KEY_PREFIX } from './storageKey'

// Inspreken (F15): met de microfoonknop zeg je bijvoorbeeld "melk komma brood komma twee pakken koffie".
// Alles van de spraakbediening staat in dit bestand, zodat het makkelijk weer weg kan.
// Het luisteren zelf (useSpeech) komt uit WoonWerk.

// Het woord "komma" zoals Chrome het soms verstaat: komma, comma, koma of coma.
const KOMMA = /\b[kc]omm?a\b[.!?]?/gi

/**
 * Een ingesproken zin wordt opgesplitst bij het woord "komma" en bij komma's, niet bij "en", zodat
 * "Jan en Piet ophalen" één item blijft; de eerste letter wordt een kleine letter.
 */
export function splitSpoken(text: string): string[] {
  return text
    .replace(KOMMA, ',')
    .split(/[,;]/)
    .map((t) => t.replace(/[.!?]+$/, '').trim())
    .filter((t) => t.length > 0)
    .map((t) => (t.charAt(0).toLocaleLowerCase('nl') + t.slice(1)).slice(0, MAX_TEKST).trim())
}

interface RecognitionResultList {
  length: number
  [index: number]: { length: number; [index: number]: { transcript: string } }
}

interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((event: { results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type RecognitionConstructor = new () => Recognition

function recognitionConstructor(): RecognitionConstructor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Kan deze browser spraak herkennen? Zo niet, dan is er geen microfoonknop. */
export function speechSupported(): boolean {
  return recognitionConstructor() !== null
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Lijstjes mag de microfoon niet gebruiken. Geef toestemming in Chrome en probeer het opnieuw.',
  'service-not-allowed': 'Lijstjes mag de microfoon niet gebruiken. Geef toestemming in Chrome en probeer het opnieuw.',
  network: 'Spraakherkenning werkt alleen met internet. Probeer het later opnieuw.',
  'no-speech': 'Ik hoorde niets. Tik op de microfoon en probeer het opnieuw.',
  'audio-capture': 'Er is geen microfoon gevonden.',
}

export const SPEECH_KEY = `${KEY_PREFIX}spraak-aan`

/** Staat de microfoonknop aan in de instellingen (F16)? Standaard wel. */
export function loadSpeechEnabled(): boolean {
  try {
    return localStorage.getItem(SPEECH_KEY) !== 'nee'
  } catch {
    return true
  }
}

export function saveSpeechEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(SPEECH_KEY)
    else localStorage.setItem(SPEECH_KEY, 'nee')
  } catch {
    // Opslag niet beschikbaar; de instelling geldt dan alleen zolang de app open is.
  }
}

/**
 * De naam van een ingesproken nieuw lijstje (F31): de hele zin, niet opgesplitst bij "komma", zonder punt
 * aan het eind en met een hoofdletter, zoals "Verjaardag Anne".
 */
export function spokenName(alternatives: string[]): string {
  const text = (alternatives[0] ?? '').trim().replace(/[.!?]+$/, '').trim()
  return (text.charAt(0).toLocaleUpperCase('nl') + text.slice(1)).slice(0, MAX_NAAM).trim()
}

/**
 * Kiest uit wat Chrome mogelijk heeft verstaan (beste eerst) de versie met de meeste items, zodat een
 * "komma" die alleen in een andere versie goed verstaan is, toch telt (F15).
 */
export function bestSpoken(alternatives: string[]): string[] {
  let best: string[] = []
  for (const alternative of alternatives) {
    const items = splitSpoken(alternative)
    if (items.length > best.length) best = items
  }
  return best
}

/**
 * Luisteren met de microfoon. `onHeard` krijgt de mogelijke zinnen (beste eerst),
 * `onError` een foutmelding in gewone taal.
 */
export function useSpeech(onHeard: (alternatives: string[]) => void, onError: (message: string) => void) {
  const [listening, setListening] = useState(false)
  const recognition = useRef<Recognition | null>(null)
  const handlers = useRef({ onHeard, onError })
  useEffect(() => {
    handlers.current = { onHeard, onError }
  })

  useEffect(() => () => recognition.current?.abort(), [])

  function start() {
    const Ctor = recognitionConstructor()
    if (!Ctor || recognition.current) return
    const r = new Ctor()
    r.lang = 'nl-NL'
    r.interimResults = false
    r.maxAlternatives = 3
    r.continuous = false
    r.onresult = (event) => {
      const result = event.results[0]
      const alternatives: string[] = []
      for (let i = 0; result && i < result.length; i++) alternatives.push(result[i].transcript)
      if (alternatives.length > 0) handlers.current.onHeard(alternatives)
    }
    r.onerror = (event) => {
      if (event.error !== 'aborted') handlers.current.onError(ERRORS[event.error] ?? 'Spraakherkenning lukte niet. Probeer het opnieuw.')
    }
    r.onend = () => {
      recognition.current = null
      setListening(false)
    }
    recognition.current = r
    setListening(true)
    try {
      r.start()
    } catch {
      recognition.current = null
      setListening(false)
      handlers.current.onError('Spraakherkenning lukte niet. Probeer het opnieuw.')
    }
  }

  function stop() {
    recognition.current?.abort()
  }

  return { listening, start, stop }
}
