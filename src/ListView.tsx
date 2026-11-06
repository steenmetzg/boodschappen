import { useRef, useState, type FormEvent, type TouchEvent } from 'react'
import { ArrowLeft, Check, Mic, Plus, Trash2, X } from 'lucide-react'
import { MAX_TEKST, type Item, type Lijstje } from './lists'

// Zo ver (in pixels) veeg je een item naar links om het weg te gooien (F7).
const SWIPE_DELETE = 80
// Pas na zoveel pixels beslissen we of de vinger horizontaal (vegen) of verticaal (scrollen) beweegt.
const SWIPE_LOCK = 10

export type Notice = { kind: 'ok' | 'error'; text: string }

interface Props {
  lijstje: Lijstje
  notice: Notice | null
  onCloseNotice: () => void
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onClear: (which: 'af' | 'alles') => void
  onBack: () => void
  mic: { show: boolean; listening: boolean; start: () => void; stop: () => void }
}

/** Eén item: tik om af te vinken (F6), kruisje of naar links vegen om weg te gooien (F7). */
function ItemRow({ item, onToggle, onRemove }: { item: Item; onToggle: () => void; onRemove: () => void }) {
  const [dx, setDx] = useState(0)
  const touch = useRef<{ x: number; y: number; dir: 'h' | 'v' | null } | null>(null)

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY, dir: null }
  }

  function onTouchMove(e: TouchEvent) {
    const start = touch.current
    if (!start) return
    const t = e.touches[0]
    const x = t.clientX - start.x
    const y = t.clientY - start.y
    if (!start.dir) {
      if (Math.abs(x) < SWIPE_LOCK && Math.abs(y) < SWIPE_LOCK) return
      start.dir = Math.abs(x) > Math.abs(y) ? 'h' : 'v'
    }
    if (start.dir === 'h') setDx(Math.min(0, x))
  }

  function onTouchEnd() {
    const swiped = touch.current?.dir === 'h' && dx <= -SWIPE_DELETE
    touch.current = null
    setDx(0)
    if (swiped) onRemove()
  }

  return (
    <li
      className={item.af ? 'item done' : 'item'}
      style={dx ? { transform: `translateX(${dx}px)`, transition: 'none' } : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touch.current = null
        setDx(0)
      }}
    >
      <button type="button" className="item-toggle" aria-pressed={item.af} onClick={onToggle}>
        <span className="check" aria-hidden>
          {item.af && <Check size={16} strokeWidth={2.5} />}
        </span>
        <span className="item-text">{item.tekst}</span>
      </button>
      <button type="button" className="item-delete" aria-label={`${item.tekst} weggooien`} onClick={onRemove}>
        <X size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </li>
  )
}

/** Het scherm van één lijstje (F1 t/m F8, F15). */
export default function ListView({
  lijstje,
  notice,
  onCloseNotice,
  onAdd,
  onToggle,
  onRemove,
  onClear,
  onBack,
  mic,
}: Props) {
  const [text, setText] = useState('')
  const [clearing, setClearing] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const hasDone = lijstje.items.some((i) => i.af)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (text.trim()) onAdd(text)
    setText('')
    // Het veld blijft geselecteerd, zodat je meteen het volgende item typt (F3).
    input.current?.focus()
  }

  function clear(which: 'af' | 'alles') {
    onClear(which)
    setClearing(false)
  }

  return (
    <main className="app list-screen">
      <header className="list-header">
        <button type="button" className="back-button" aria-label="Terug naar Mijn lijstjes" onClick={onBack}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>{lijstje.naam}</h1>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Lijstje leegmaken"
            aria-expanded={clearing}
            disabled={lijstje.items.length === 0}
            onClick={() => setClearing(!clearing)}
          >
            <Trash2 size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </header>

      {clearing && (
        <section className="confirm clear-choice" aria-label="Lijstje leegmaken">
          <strong>Lijstje {lijstje.naam} leegmaken</strong>
          <div className="confirm-buttons">
            <button type="button" disabled={!hasDone} onClick={() => clear('af')}>
              Afgevinkte weggooien
            </button>
            <button type="button" className="confirm-yes" onClick={() => clear('alles')}>
              Alles weggooien
            </button>
            <button type="button" className="cancel" onClick={() => setClearing(false)}>
              Annuleren
            </button>
          </div>
        </section>
      )}

      {lijstje.items.length === 0 ? (
        <p className="muted empty">Nog niets op dit lijstje. Typ of spreek hieronder een item in.</p>
      ) : (
        <ul className="items" aria-label={`Items op ${lijstje.naam}`}>
          {lijstje.items.map((item) => (
            <ItemRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onRemove={() => onRemove(item.id)} />
          ))}
        </ul>
      )}

      <div className="bottom">
        {mic.listening ? (
          <section className="voice" aria-live="polite">
            <p>
              <strong>Luisteren…</strong> Zeg bijvoorbeeld: melk, brood en twee pakken koffie
            </p>
          </section>
        ) : (
          notice && (
            <section className={notice.kind === 'error' ? 'voice error' : 'voice'} aria-live="polite">
              <p role="status">{notice.text}</p>
              <button type="button" className="voice-close" aria-label="Melding sluiten" onClick={onCloseNotice}>
                <X size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </section>
          )
        )}
        <form className="add-item" onSubmit={submit}>
          <input
            ref={input}
            type="text"
            aria-label="Item toevoegen"
            placeholder="Item toevoegen"
            enterKeyHint="enter"
            autoComplete="off"
            maxLength={MAX_TEKST * 10}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            className="icon-button add"
            aria-label="Toevoegen"
            // Het toetsenbord blijft open als je op de plusknop tikt.
            onPointerDown={(e) => e.preventDefault()}
          >
            <Plus size={20} strokeWidth={1.75} aria-hidden />
          </button>
          {mic.show && (
            <button
              type="button"
              className={mic.listening ? 'icon-button mic listening' : 'icon-button mic'}
              aria-label={mic.listening ? 'Stoppen met luisteren' : 'Inspreken'}
              aria-pressed={mic.listening}
              onClick={mic.listening ? mic.stop : mic.start}
            >
              <Mic size={20} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </form>
      </div>
    </main>
  )
}
