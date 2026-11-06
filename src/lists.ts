// De lijstjes en hun items: de gegevens, bewaren en ophalen, en de regels voor toevoegen (F3 t/m F5).

export interface Item {
  id: string
  tekst: string
  /** Afgevinkt (F6): doorgestreept, maar het item blijft op zijn plek staan. */
  af: boolean
}

export interface Lijstje {
  id: string
  naam: string
  items: Item[]
}

/** Alle sleutels beginnen met "lijstjes-", omdat WoonWerk dezelfde opslag van de browser deelt (AC16). */
export const LISTS_KEY = 'lijstjes-data'
export const CURRENT_KEY = 'lijstjes-huidig'

export const MAX_NAAM = 30
export const MAX_TEKST = 60
export const MAX_LIJSTJES = 20

/** Een nieuwe installatie begint met één leeg lijstje (F13). */
export const DEFAULT_LIJSTJES: Lijstje[] = [{ id: 'l1', naam: 'Mijn 1e lijstje', items: [] }]

let counter = 0
export function newId(): string {
  counter += 1
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Vergelijken zonder hoofdletters en spaties aan begin en eind (F5, F10). */
export function sameText(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('nl') === b.trim().toLocaleLowerCase('nl')
}

/** "melk" wordt "Melk", voor het begin van een melding. */
export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('nl') + text.slice(1)
}

export function openCount(lijstje: Lijstje): number {
  return lijstje.items.filter((i) => !i.af).length
}

export function itemsText(n: number): string {
  return n === 1 ? '1 item' : `${n} items`
}

/** Bijv. "melk, brood en kaas". */
export function joinNl(parts: string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} en ${parts[parts.length - 1]}`
}

/** Getypte tekst wordt bij komma's opgesplitst in items (F4). */
export function splitTyped(text: string): string[] {
  return text
    .split(',')
    .map((t) => t.trim().slice(0, MAX_TEKST).trim())
    .filter((t) => t.length > 0)
}

export interface AddResult {
  lijstje: Lijstje
  /** Nieuw op het lijstje gezet. */
  added: string[]
  /** Stond er al op (niet afgevinkt). */
  already: string[]
  /** Was afgevinkt en is weer aangevinkt, op dezelfde plek. */
  revived: string[]
}

/** Zet items onderaan het lijstje, zonder dubbele (F3, F5). */
export function addItems(lijstje: Lijstje, texts: string[]): AddResult {
  const items = [...lijstje.items]
  const added: string[] = []
  const already: string[] = []
  const revived: string[] = []
  for (const tekst of texts) {
    const index = items.findIndex((i) => sameText(i.tekst, tekst))
    if (index === -1) {
      items.push({ id: newId(), tekst, af: false })
      added.push(tekst)
    } else if (items[index].af) {
      items[index] = { ...items[index], af: false }
      revived.push(items[index].tekst)
    } else if (!already.some((t) => sameText(t, tekst)) && !added.some((t) => sameText(t, tekst))) {
      already.push(items[index].tekst)
    }
  }
  return { lijstje: { ...lijstje, items }, added, already, revived }
}

/** De melding na het toevoegen van items, of `null` als er niets te melden is. */
export function addMessage(result: AddResult, spoken: boolean): string | null {
  const parts: string[] = []
  if (spoken && result.added.length > 0) parts.push(`Toegevoegd: ${result.added.join(', ')}.`)
  if (result.revived.length > 0) {
    parts.push(`${capitalize(joinNl(result.revived))} ${result.revived.length === 1 ? 'staat' : 'staan'} weer op je lijstje.`)
  }
  if (result.already.length > 0) {
    parts.push(`${capitalize(joinNl(result.already))} ${result.already.length === 1 ? 'staat' : 'staan'} er al op.`)
  }
  return parts.length > 0 ? parts.join(' ') : null
}

/** Een foutmelding voor een naam van een lijstje, of `null` als de naam goed is (F10, F11). */
export function nameError(lijstjes: readonly Lijstje[], naam: string, exceptId?: string): string | null {
  const trimmed = naam.trim()
  if (!trimmed) return 'Geef het lijstje een naam.'
  const existing = lijstjes.find((l) => l.id !== exceptId && sameText(l.naam, trimmed))
  return existing ? `Er is al een lijstje ${existing.naam}.` : null
}

function parseItem(value: unknown): Item | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Partial<Item>
  if (typeof v.id !== 'string' || typeof v.tekst !== 'string' || !v.tekst.trim()) return null
  return { id: v.id, tekst: v.tekst.trim().slice(0, MAX_TEKST), af: v.af === true }
}

/** Haalt geldige lijstjes uit willekeurige gegevens; `null` als het geen bruikbare lijst is. */
export function parseLijstjes(value: unknown): Lijstje[] | null {
  if (!Array.isArray(value)) return null
  const result: Lijstje[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return null
    const l = entry as Partial<Lijstje>
    if (typeof l.id !== 'string' || typeof l.naam !== 'string' || !l.naam.trim() || !Array.isArray(l.items)) return null
    if (result.some((r) => r.id === l.id)) return null
    const items = l.items.map(parseItem)
    if (items.some((i) => i === null)) return null
    result.push({ id: l.id, naam: l.naam.trim().slice(0, MAX_NAAM), items: items as Item[] })
  }
  return result.length > 0 ? result : null
}

export function loadLijstjes(): Lijstje[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY)
    if (!raw) return DEFAULT_LIJSTJES
    return parseLijstjes(JSON.parse(raw)) ?? DEFAULT_LIJSTJES
  } catch {
    return DEFAULT_LIJSTJES
  }
}

export function saveLijstjes(lijstjes: Lijstje[]): void {
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lijstjes))
  } catch {
    // Opslag niet beschikbaar (bijv. privévenster); de app werkt dan zonder onthouden.
  }
}

/** Het laatst geopende lijstje (F1, F14); `null` als er nog nooit een lijstje is geopend. */
export function loadCurrent(lijstjes: readonly Lijstje[]): string | null {
  try {
    const id = localStorage.getItem(CURRENT_KEY)
    if (!id) return null
    // Bestaat het lijstje niet meer (bijv. na een backup), dan het eerste.
    return lijstjes.some((l) => l.id === id) ? id : lijstjes[0].id
  } catch {
    return null
  }
}

export function saveCurrent(id: string): void {
  try {
    localStorage.setItem(CURRENT_KEY, id)
  } catch {
    // Opslag niet beschikbaar.
  }
}
