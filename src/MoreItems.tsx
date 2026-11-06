import { ChevronDown, ChevronUp } from 'lucide-react'

// Zoveel pixels schuift de lijn met het lipje voor regels erboven over de ruimte onder de titel (F29).
const ABOVE_OVERLAP = 10

interface Props {
  /** Hoeveel regels buiten beeld staan. */
  count: number
  /** Hoe je één en meer regels noemt, bijvoorbeeld ['item', 'items'] of ['lijstje', 'lijstjes']. */
  words: [string, string]
  onClick: () => void
}

function label(count: number, [one, many]: [string, string], where: string) {
  return count === 1 ? `1 ${one} ${where}` : `${count} ${many} ${where}`
}

/** Een grijze lijn bovenaan het scherm, net onder de titel, met een lipje met het pijltje en het aantal (F29). */
export function MoreAbove({ count, words, onClick, headerHeight }: Props & { headerHeight: number }) {
  if (count === 0) return null
  return (
    <div className="more-items above" style={{ top: Math.max(0, headerHeight - ABOVE_OVERLAP) }}>
      <button type="button" aria-label={label(count, words, 'hoger')} onClick={onClick}>
        <ChevronUp size={14} strokeWidth={2.5} aria-hidden />
        {count}
      </button>
    </div>
  )
}

/** De bovenrand van de invoerregel, met een lipje naar beneden met het pijltje en het aantal (F29). */
export function MoreBelow({ count, words, onClick }: Props) {
  if (count === 0) return null
  return (
    <div className="more-items below">
      <button type="button" aria-label={label(count, words, 'lager')} onClick={onClick}>
        <ChevronDown size={14} strokeWidth={2.5} aria-hidden />
        {count}
      </button>
    </div>
  )
}
