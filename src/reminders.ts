// Herinneringen in de app (F36): bij het openen van de app een melding met de items die vandaag zijn of waarvan
// de datum voorbij is. Alleen de dag telt, niet de tijd.

import { toDate } from './agenda'
import type { Item, Lijstje } from './lists'

export interface Due {
  lijstjeId: string
  lijstjeNaam: string
  item: Item & { wanneer: string }
  /** `true` als de dag voorbij is, `false` als het vandaag is. */
  voorbij: boolean
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Open (niet afgevinkte) items van herinneringslijstjes met een datum van vandaag of eerder, de oudste eerst. */
export function dueItems(lijstjes: readonly Lijstje[], now: Date = new Date()): Due[] {
  const today = dayKey(now)
  const result: Due[] = []
  for (const l of lijstjes) {
    if (!l.herinnering) continue
    for (const item of l.items) {
      if (item.af || !item.wanneer) continue
      const day = dayKey(toDate(item.wanneer))
      if (day > today) continue
      result.push({ lijstjeId: l.id, lijstjeNaam: l.naam, item: item as Due['item'], voorbij: day < today })
    }
  }
  return result.sort((a, b) => a.item.wanneer.localeCompare(b.item.wanneer))
}
