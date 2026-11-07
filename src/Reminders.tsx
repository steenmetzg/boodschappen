import { Bell, Check, X } from 'lucide-react'
import { formatWanneer } from './agenda'
import type { Due } from './reminders'

interface Props {
  due: Due[]
  onOpen: (lijstjeId: string) => void
  /** Vinkt het item af; het verdwijnt dan uit de melding (F36). */
  onToggle: (lijstjeId: string, itemId: string) => void
  onClose: () => void
}

/** De melding met herinneringen van vandaag en eerder, onderaan het scherm (F36). */
export default function Reminders({ due, onOpen, onToggle, onClose }: Props) {
  return (
    <section className="voice reminders" aria-label="Herinneringen">
      <div className="reminders-body">
        <strong>
          <Bell size={15} strokeWidth={2} aria-hidden /> Herinneringen
        </strong>
        <ul>
          {due.map((d) => (
            <li key={d.item.id} className="reminder-row">
              <button
                type="button"
                className="reminder-check"
                aria-label={`${d.item.tekst} afvinken`}
                onClick={() => onToggle(d.lijstjeId, d.item.id)}
              >
                <span className="check" aria-hidden>
                  <Check size={14} strokeWidth={2.5} />
                </span>
              </button>
              <button type="button" className={d.voorbij ? 'reminder past' : 'reminder'} onClick={() => onOpen(d.lijstjeId)}>
                <span className="reminder-when">
                  {d.voorbij ? formatWanneer(d.item.wanneer) : `Vandaag ${d.item.wanneer.slice(11)}`}
                </span>{' '}
                <span className="reminder-text">{d.item.tekst}</span>{' '}
                <span className="reminder-list">({d.lijstjeNaam})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="voice-close" aria-label="Herinneringen sluiten" onClick={onClose}>
        <X size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </section>
  )
}
