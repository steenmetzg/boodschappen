import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
  type TouchEvent,
} from 'react'
import { ArrowLeft, Check, ChevronDown, ChevronUp, GripVertical, Mic, Trash2, X } from 'lucide-react'
import { dropIndex, MAX_TEKST, type Item, type Lijstje } from './lists'
import { countHidden, type Hidden } from './visibility'

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
  onEdit: (id: string, text: string) => void
  onRemove: (id: string) => void
  onMove: (from: number, to: number) => void
  onClear: (which: 'af' | 'alles') => void
  onBack: () => void
  mic: { show: boolean; listening: boolean; start: () => void; stop: () => void }
}

/** Een item dat je aan het verslepen bent (F28). */
interface Drag {
  id: string
  from: number
  to: number
  dy: number
  startY: number
  heights: number[]
}

interface RowProps {
  item: Item
  /** Hoeveel pixels de regel omhoog of omlaag staat tijdens het verslepen. */
  shift: number
  dragging: boolean
  onToggle: () => void
  onEdit: (text: string) => void
  onRemove: () => void
  grip: {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void
    onPointerUp: () => void
    onPointerCancel: () => void
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  }
}

/**
 * Eén item: vastpakken om te verplaatsen (F28), het rondje om af te vinken (F6), de tekst om aan te passen (F27),
 * het kruisje of naar links vegen om weg te gooien (F7).
 */
function ItemRow({ item, shift, dragging, onToggle, onEdit, onRemove, grip }: RowProps) {
  const [dx, setDx] = useState(0)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.tekst)
  const touch = useRef<{ x: number; y: number; dir: 'h' | 'v' | null } | null>(null)

  function onTouchStart(e: TouchEvent) {
    if (editing) return
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

  function startEditing() {
    setText(item.tekst)
    setEditing(true)
  }

  function save(e?: FormEvent) {
    e?.preventDefault()
    if (!editing) return
    setEditing(false)
    if (text.trim() !== item.tekst) onEdit(text)
  }

  const style = dx
    ? { transform: `translateX(${dx}px)`, transition: 'none' }
    : dragging
      ? { transform: `translateY(${shift}px)`, transition: 'none' }
      : shift
        ? { transform: `translateY(${shift}px)` }
        : undefined

  return (
    <li
      className={['item', item.af && 'done', dragging && 'dragging'].filter(Boolean).join(' ')}
      data-id={item.id}
      style={style}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touch.current = null
        setDx(0)
      }}
    >
      <button
        type="button"
        className="item-grip"
        aria-label={`${item.tekst} verplaatsen`}
        aria-description="Sleep omhoog of omlaag, of gebruik de pijltjestoetsen"
        // Vastpakken is geen vegen om weg te gooien.
        onTouchStart={(e) => e.stopPropagation()}
        {...grip}
      >
        <GripVertical size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <button type="button" className="item-check" aria-label={item.tekst} aria-pressed={item.af} onClick={onToggle}>
        <span className="check" aria-hidden>
          {item.af && <Check size={16} strokeWidth={2.5} />}
        </span>
      </button>
      {editing ? (
        <form className="item-edit" onSubmit={save}>
          <input
            type="text"
            aria-label="Item aanpassen"
            enterKeyHint="done"
            autoComplete="off"
            autoFocus
            maxLength={MAX_TEKST}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => save()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        </form>
      ) : (
        <button type="button" className="item-text" aria-label={`${item.tekst} aanpassen`} onClick={startEditing}>
          {item.tekst}
        </button>
      )}
      <button type="button" className="item-delete" aria-label={`${item.tekst} weggooien`} onClick={onRemove}>
        <X size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </li>
  )
}

/** Het scherm van één lijstje (F1 t/m F8, F15, F27, F28). */
export default function ListView({
  lijstje,
  notice,
  onCloseNotice,
  onAdd,
  onToggle,
  onEdit,
  onRemove,
  onMove,
  onClear,
  onBack,
  mic,
}: Props) {
  const [text, setText] = useState('')
  const [clearing, setClearing] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  // Het item dat met de pijltjestoetsen is verplaatst; de focus blijft op dat item.
  const [moved, setMoved] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Hidden>({ above: 0, below: 0 })
  // Hoe hoog de meldingen onderaan zijn: daarboven blijft de invoerregel staan (F3).
  const [bottomHeight, setBottomHeight] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const addRow = useRef<HTMLLIElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const items = lijstje.items
  const hasDone = items.some((i) => i.af)

  useEffect(() => {
    if (!moved) return
    list.current?.querySelector<HTMLElement>(`li[data-id="${moved}"] .item-grip`)?.focus()
  }, [moved, items])

  /** Kijkt welke items buiten beeld staan, na elke wijziging, bij scrollen en als het scherm verandert (F29). */
  function measure() {
    const rows = list.current?.querySelectorAll<HTMLElement>('li[data-id]') ?? []
    const rects = Array.from(rows, (row) => row.getBoundingClientRect())
    const limit = addRow.current?.getBoundingClientRect().top ?? window.innerHeight
    const next = countHidden(rects, 0, limit)
    setHidden((prev) => (prev.above === next.above && prev.below === next.below ? prev : next))
    setBottomHeight(bottom.current?.offsetHeight ?? 0)
  }

  useLayoutEffect(measure)

  useEffect(() => {
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  })

  /** Schuift het lijstje een flink stuk omhoog of omlaag, naar de items buiten beeld (F29). */
  function scrollPage(direction: 1 | -1) {
    const limit = addRow.current?.getBoundingClientRect().top ?? window.innerHeight
    window.scrollBy({ top: direction * Math.max(100, limit - 120), behavior: 'smooth' })
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (text.trim()) onAdd(text)
    setText('')
    // Het veld blijft geselecteerd en in beeld, zodat je meteen het volgende item typt (F3).
    input.current?.focus()
    requestAnimationFrame(() => input.current?.scrollIntoView?.({ block: 'nearest' }))
  }

  function clear(which: 'af' | 'alles') {
    onClear(which)
    setClearing(false)
  }

  function gripFor(item: Item, index: number): RowProps['grip'] {
    return {
      onPointerDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        const rows = list.current?.querySelectorAll<HTMLElement>('li[data-id]') ?? []
        const heights = Array.from(rows, (row) => row.getBoundingClientRect().height)
        setDrag({ id: item.id, from: index, to: index, dy: 0, startY: e.clientY, heights })
      },
      onPointerMove(e) {
        if (!drag || drag.id !== item.id) return
        const dy = e.clientY - drag.startY
        setDrag({ ...drag, dy, to: dropIndex(drag.from, dy, drag.heights) })
      },
      onPointerUp() {
        if (!drag) return
        setDrag(null)
        if (drag.to !== drag.from) onMove(drag.from, drag.to)
      },
      onPointerCancel() {
        setDrag(null)
      },
      onKeyDown(e) {
        const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null
        if (to === null) return
        e.preventDefault()
        if (to < 0 || to >= items.length) return
        setMoved(item.id)
        onMove(index, to)
      },
    }
  }

  /** Hoe ver een regel opzij schuift tijdens het verslepen, om plaats te maken voor het versleepte item. */
  function shiftFor(index: number): number {
    if (!drag) return 0
    if (index === drag.from) return drag.dy
    const h = drag.heights[drag.from] ?? 0
    if (drag.from < index && index <= drag.to) return -h
    if (drag.to <= index && index < drag.from) return h
    return 0
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
            disabled={items.length === 0}
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

      {hidden.above > 0 && (
        <button
          type="button"
          className="more-items above"
          aria-label={hidden.above === 1 ? '1 item hoger' : `${hidden.above} items hoger`}
          onClick={() => scrollPage(-1)}
        >
          <ChevronUp size={14} strokeWidth={2} aria-hidden />
          {hidden.above}
        </button>
      )}

      <ul ref={list} className="items" aria-label={`Items op ${lijstje.naam}`}>
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            shift={shiftFor(index)}
            dragging={drag?.id === item.id}
            onToggle={() => onToggle(item.id)}
            onEdit={(t) => onEdit(item.id, t)}
            onRemove={() => onRemove(item.id)}
            grip={gripFor(item, index)}
          />
        ))}
        {/* De invoerregel staat als laatste regel in het lijstje (F3, F15). */}
        <li
          ref={addRow}
          className={hidden.below > 0 ? 'item add-row covering' : 'item add-row'}
          style={{ bottom: bottomHeight }}
        >
          {hidden.below > 0 && (
            <button
              type="button"
              className="more-items below"
              aria-label={hidden.below === 1 ? '1 item lager' : `${hidden.below} items lager`}
              onClick={() => scrollPage(1)}
            >
              <ChevronDown size={14} strokeWidth={2} aria-hidden />
              {hidden.below}
            </button>
          )}
          <span className="item-grip" aria-hidden />
          <span className="item-check" aria-hidden>
            <span className="check" />
          </span>
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
            {mic.show && (
              <button
                type="button"
                className={mic.listening ? 'icon-button mic listening' : 'icon-button mic'}
                aria-label={mic.listening ? 'Stoppen met luisteren' : 'Inspreken'}
                aria-pressed={mic.listening}
                onClick={mic.listening ? mic.stop : mic.start}
              >
                <Mic size={16} strokeWidth={2} aria-hidden />
              </button>
            )}
          </form>
        </li>
      </ul>

      <div ref={bottom} className="bottom">
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
      </div>
    </main>
  )
}
