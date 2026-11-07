import { basisLijstjes, itemsText, mergeHerinneringen, parseLijstjes, splitHerinneringen, type Herinneringen, type Lijstje } from './lists'

const APP_ID = 'lijstjes'

export interface Backup {
  app: typeof APP_ID
  versie: 1
  gemaakt: string
  lijstjes: Lijstje[]
  /** Het id van het huidige lijstje. */
  huidig: string
  /** Herinneringslijstjes (F32): apart, zodat een oudere versie de backup ook kan terugzetten (§8). */
  herinneringen?: Herinneringen
}

function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Bijvoorbeeld 2026-11-06-lijstjes.json (F19). */
export function backupFileName(now: Date): string {
  return `${dateKey(now)}-lijstjes.json`
}

export function createBackup(lijstjes: Lijstje[], huidig: string, now: Date): string {
  const backup: Backup = {
    app: APP_ID,
    versie: 1,
    gemaakt: now.toISOString(),
    lijstjes: basisLijstjes(lijstjes),
    huidig,
    herinneringen: splitHerinneringen(lijstjes),
  }
  return JSON.stringify(backup, null, 2)
}

/** Bijv. "3 lijstjes en 12 items". */
export function contentCount(lijstjes: readonly Lijstje[]): string {
  const items = lijstjes.reduce((n, l) => n + l.items.length, 0)
  return `${lijstjes.length === 1 ? '1 lijstje' : `${lijstjes.length} lijstjes`} en ${itemsText(items)}`
}

/** Leest een backupbestand. Gooit een fout met een Nederlandse melding als het geen geldige backup is. */
export function parseBackup(text: string): { gemaakt: Date | null; lijstjes: Lijstje[]; huidig: string } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Dit bestand is geen backup van Lijstjes.')
  }
  const backup = data as Partial<Backup> | null
  if (!backup || backup.app !== APP_ID) throw new Error('Dit bestand is geen backup van Lijstjes.')
  if (backup.versie !== 1) throw new Error('Deze backup is gemaakt met een onbekende versie van de app.')
  const basis = parseLijstjes(backup.lijstjes)
  if (!basis) throw new Error('Deze backup is beschadigd.')
  const lijstjes = mergeHerinneringen(basis, backup.herinneringen)
  const gemaakt = backup.gemaakt ? new Date(backup.gemaakt) : null
  const huidig = typeof backup.huidig === 'string' && lijstjes.some((l) => l.id === backup.huidig) ? backup.huidig : lijstjes[0].id
  return { gemaakt: gemaakt && !isNaN(gemaakt.getTime()) ? gemaakt : null, lijstjes, huidig }
}
