// Gebruik meten (F39): anoniem tellen met GoatCounter, zonder cookies en zonder script van GoatCounter.
// Alleen de naam van de telling gaat weg, nooit wat je invult. Lijstjes gebruikt hetzelfde GoatCounter-account
// als WoonWerk (code steenmetzg); elke telling begint met "lijstjes-" (de testversie met "lijstjes-test-"),
// zodat je de apps uit elkaar houdt. Alles hierover staat in dit bestand, zodat de functie makkelijk weer weg kan.
import { IS_TEST } from './storageKey'

const COUNT_URL = 'https://steenmetzg.goatcounter.com/count'
/** Alleen de app online telt; de tests en de computer van de ontwikkelaar niet. */
const LIVE_HOST = 'steenmetzg.github.io'

export type Telling = 'start-geinstalleerd' | 'start-browser' | 'installatie'

const TITELS: Record<Telling, string> = {
  'start-geinstalleerd': 'Lijstjes gestart (geïnstalleerd)',
  'start-browser': 'Lijstjes gestart (browser)',
  installatie: 'Lijstjes geïnstalleerd',
}

interface Plek {
  hostname: string
}

/** Of er geteld mag worden: alleen online op steenmetzg.github.io en alleen met internet. */
export function mayCount(plek: Plek, online: boolean): boolean {
  return online && plek.hostname === LIVE_HOST
}

/** Het adres van één telling, met alleen de naam en de titel. */
export function countUrl(telling: Telling, test = IS_TEST, rnd = Math.random().toString(36).slice(2)): string {
  const params = new URLSearchParams({
    p: `${test ? 'lijstjes-test-' : 'lijstjes-'}${telling}`,
    t: `${TITELS[telling]}${test ? ' (testversie)' : ''}`,
    e: 'true',
    rnd,
  })
  return `${COUNT_URL}?${params}`
}

function verstuur(url: string) {
  if (navigator.sendBeacon?.(url)) return
  // Lukt het niet via sendBeacon, dan een onzichtbaar plaatje.
  new Image().src = url
}

// Voor de tests: een andere plek en een andere manier van versturen.
let plekVoorTest: Plek | null = null
let verstuurVoorTest: ((url: string) => void) | null = null
export function setMetenVoorTest(plek: Plek | null, send: ((url: string) => void) | null) {
  plekVoorTest = plek
  verstuurVoorTest = send
}

/** Telt één keer; geen internet of een fout: dan gebeurt er niets, ook niet later. */
export function tel(telling: Telling) {
  try {
    if (!mayCount(plekVoorTest ?? window.location, navigator.onLine)) return
    ;(verstuurVoorTest ?? verstuur)(countUrl(telling))
  } catch {
    // Tellen is nooit belangrijker dan de app zelf.
  }
}

function isInstalled(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}

/** Eén keer bij het openen van de app: telt de start en luistert naar een installatie. */
export function startMeten() {
  tel(isInstalled() ? 'start-geinstalleerd' : 'start-browser')
  window.addEventListener('appinstalled', () => tel('installatie'))
}
