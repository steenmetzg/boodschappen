// Herinneringen (F32 t/m F35): datum en tijd van een item tonen, en een item in je agenda zetten.
// Lijstjes zelf stuurt geen meldingen; de herinnering komt van je agenda.

/** De agenda's waar een herinneringslijstje zijn items in kan zetten (F34). */
export type Agenda = 'google' | 'outlook' | 'outlook-werk' | 'ics' | 'delen'

export const AGENDAS: readonly { id: Agenda; label: string }[] = [
  { id: 'google', label: 'Google Agenda' },
  { id: 'outlook', label: 'Outlook (privé)' },
  { id: 'outlook-werk', label: 'Outlook (werk)' },
  { id: 'ics', label: 'Andere agenda' },
  { id: 'delen', label: 'Delen…' },
]

export function isAgenda(value: unknown): value is Agenda {
  return AGENDAS.some((a) => a.id === value)
}

/**
 * De keuze van een herinneringslijstje: een vaste agenda, of per item kiezen (F34). Zonder keuze is er nog niets
 * gekozen; de eerste keer in de agenda zetten vraagt dan welke agenda.
 */
export type AgendaKeuze = Agenda | 'per-item'

export const PER_ITEM = 'per-item' as const

export function isAgendaKeuze(value: unknown): value is AgendaKeuze {
  return value === PER_ITEM || isAgenda(value)
}

export function agendaLabel(agenda: Agenda): string {
  return AGENDAS.find((a) => a.id === agenda)?.label ?? agenda
}

/** Zo lang duurt een agenda-item, in minuten. */
export const DUUR_MINUTEN = 30

/** Datum en tijd zoals het datumveld ze geeft: "2026-11-08T14:00" (lokale tijd). */
const WANNEER = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function isWanneer(value: unknown): value is string {
  return typeof value === 'string' && WANNEER.test(value) && !isNaN(toDate(value).getTime())
}

/** "2026-11-08T14:00" als datum in de tijdzone van de telefoon. */
export function toDate(wanneer: string): Date {
  const [d, t] = wanneer.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [h, min] = t.split(':').map(Number)
  return new Date(y, m - 1, day, h, min)
}

const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/** Bijv. "za 8 nov 14:00"; in een ander jaar met het jaartal erbij: "vr 1 jan 2027 09:30" (F33). */
export function formatWanneer(wanneer: string, now: Date = new Date()): string {
  const d = toDate(wanneer)
  const jaar = d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`
  const tijd = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${DAGEN[d.getDay()]} ${d.getDate()} ${MAANDEN[d.getMonth()]}${jaar} ${tijd}`
}

/** Is het moment al voorbij? Dan staat de datum in rood (F33). */
export function isVoorbij(wanneer: string, now: Date = new Date()): boolean {
  return toDate(wanneer).getTime() < now.getTime()
}

/**
 * Items van een herinneringslijstje op datum: de eerstvolgende bovenaan, items zonder datum onderaan
 * in hun eigen volgorde (F33).
 */
export function opDatum<T extends { wanneer?: string }>(items: readonly T[]): T[] {
  const met = items.filter((i) => i.wanneer).sort((a, b) => a.wanneer!.localeCompare(b.wanneer!))
  return [...met, ...items.filter((i) => !i.wanneer)]
}

export interface Afspraak {
  id: string
  titel: string
  /** De naam van het lijstje, in de omschrijving van het agenda-item. */
  lijstje: string
  wanneer: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "20261108T140000" in lokale tijd. */
function compactLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

/** "20261108T130000Z" in UTC. */
function compactUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function times(wanneer: string): { start: Date; eind: Date } {
  const start = toDate(wanneer)
  return { start, eind: new Date(start.getTime() + DUUR_MINUTEN * 60000) }
}

function omschrijving(a: Afspraak): string {
  return `Uit Lijstjes: ${a.lijstje}`
}

function tijdzone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam'
  } catch {
    return 'Europe/Amsterdam'
  }
}

/** Een ingevuld nieuw afspraak-scherm in Google Agenda. */
export function googleUrl(a: Afspraak): string {
  const { start, eind } = times(a.wanneer)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: a.titel,
    dates: `${compactLocal(start)}/${compactLocal(eind)}`,
    ctz: tijdzone(),
    details: omschrijving(a),
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Een ingevuld nieuw afspraak-scherm in Outlook op het web: privé (outlook.com) of werk (Microsoft 365). */
export function outlookUrl(a: Afspraak, werk: boolean): string {
  const { start, eind } = times(a.wanneer)
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: a.titel,
    startdt: start.toISOString(),
    enddt: eind.toISOString(),
    body: omschrijving(a),
  })
  const host = werk ? 'outlook.office.com' : 'outlook.live.com'
  return `https://${host}/calendar/0/deeplink/compose?${params}`
}

function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Een agenda-bestand (.ics) dat elke agenda-app kan openen. */
export function icsBestand(a: Afspraak, now: Date = new Date()): string {
  const { start, eind } = times(a.wanneer)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lijstjes//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${a.id}-${compactUtc(start)}@lijstjes`,
    `DTSTAMP:${compactUtc(now)}`,
    `DTSTART:${compactUtc(start)}`,
    `DTEND:${compactUtc(eind)}`,
    `SUMMARY:${icsText(a.titel)}`,
    `DESCRIPTION:${icsText(omschrijving(a))}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

/** De tekst voor het deelmenu van de telefoon, bijv. voor Google Tasks. */
export function deelTekst(a: Afspraak): string {
  return `${a.titel}, ${formatWanneer(a.wanneer)}`
}

/** Bestandsnaam van het agenda-bestand: alleen letters, cijfers en streepjes. */
export function icsNaam(a: Afspraak): string {
  const naam = a.titel
    .toLocaleLowerCase('nl')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${naam || 'herinnering'}.ics`
}

/**
 * Zet het item in de gekozen agenda (F34). Geeft `false` als dat op deze telefoon niet kan
 * (bijv. Delen zonder deelmenu); het agenda-scherm of deelmenu zelf opent buiten de app.
 */
export async function zetInAgenda(agenda: Agenda, a: Afspraak): Promise<boolean> {
  switch (agenda) {
    case 'google':
      window.open(googleUrl(a), '_blank', 'noopener')
      return true
    case 'outlook':
    case 'outlook-werk':
      window.open(outlookUrl(a, agenda === 'outlook-werk'), '_blank', 'noopener')
      return true
    case 'ics': {
      const url = URL.createObjectURL(new Blob([icsBestand(a)], { type: 'text/calendar' }))
      const link = document.createElement('a')
      link.href = url
      link.download = icsNaam(a)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      return true
    }
    case 'delen': {
      if (typeof navigator.share !== 'function') return false
      try {
        await navigator.share({ title: a.titel, text: deelTekst(a) })
        return true
      } catch {
        // Deelmenu gesloten zonder te kiezen.
        return false
      }
    }
  }
}
