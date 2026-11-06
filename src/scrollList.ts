// Gedeelde werking van een lang lijstje met een vaste titelbalk en een vaste invoerregel onderaan:
// tellen wat buiten beeld staat (F29) en regels verslepen (F28). Gebruikt door een lijstje en Mijn lijstjes (F30).
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { dropIndex } from './lists'
import { countHidden, type Hidden } from './visibility'

/** Een regel die je aan het verslepen bent (F28). */
interface Drag {
  id: string
  from: number
  to: number
  dy: number
  startY: number
  /** Hoe ver de pagina gescrold was bij het vastpakken; het lijstje scrolt mee tijdens het slepen. */
  startScroll: number
  heights: number[]
}

/** Wat de greep van een regel nodig heeft om te verslepen (F28). */
export interface Grip {
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
}

/** Zo dicht (in pixels) bij de boven- of onderrand scrolt het lijstje mee tijdens het slepen (F28). */
const EDGE_ZONE = 56
/** Zo snel (in pixels per beeldje) scrolt het lijstje hoogstens mee tijdens het slepen. */
const EDGE_SPEED = 14

/** De nieuwe stand van een versleepte regel, voor de vinger op hoogte `pointerY` (F28). */
function dragTo(drag: Drag, pointerY: number): Drag {
  const dy = pointerY - drag.startY + window.scrollY - drag.startScroll
  return { ...drag, dy, to: dropIndex(drag.from, dy, drag.heights) }
}

/**
 * De regels `rows` staan in `list` (elk als `li[data-id]`), onder de vaste titelbalk `header` en boven de vaste
 * invoerregel `addRow` en de meldingen `bottom`. `onMove` verplaatst een regel van plek `from` naar `to`.
 */
export function useScrollList(rows: readonly { id: string }[], onMove: (from: number, to: number) => void) {
  const header = useRef<HTMLElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const addRow = useRef<HTMLLIElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  // Waar de vinger is tijdens het slepen, voor het meescrollen bij de rand (F28).
  const pointerY = useRef(0)
  // De regel die met de pijltjestoetsen is verplaatst; de focus blijft op die regel.
  const [moved, setMoved] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Hidden>({ above: 0, below: 0 })
  // Hoe hoog de meldingen onderaan zijn: daarboven blijft de invoerregel staan (F3).
  const [bottomHeight, setBottomHeight] = useState(0)
  // Hoe hoog de vaste titelbalk is: daaronder staat de lijn met het lipje voor regels erboven (F29).
  const [headerHeight, setHeaderHeight] = useState(0)
  const dragId = drag?.id

  // Sleep je een regel tot bij de titel of de invoerregel, dan scrolt het lijstje mee, zodat je hem
  // ook naar regels buiten beeld kunt verplaatsen (F28).
  useEffect(() => {
    if (!dragId) return
    let frame = 0
    function step() {
      const top = header.current?.getBoundingClientRect().bottom ?? 0
      const limit = addRow.current?.getBoundingClientRect().top ?? window.innerHeight
      const y = pointerY.current
      let speed = 0
      if (y < top + EDGE_ZONE) speed = -EDGE_SPEED * Math.min(1, (top + EDGE_ZONE - y) / EDGE_ZONE)
      else if (y > limit - EDGE_ZONE) speed = EDGE_SPEED * Math.min(1, (y - limit + EDGE_ZONE) / EDGE_ZONE)
      if (speed !== 0) {
        const before = window.scrollY
        window.scrollBy(0, speed)
        if (window.scrollY !== before) setDrag((d) => (d ? dragTo(d, y) : d))
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [dragId])

  useEffect(() => {
    if (!moved) return
    list.current?.querySelector<HTMLElement>(`li[data-id="${moved}"] .item-grip`)?.focus()
  }, [moved, rows])

  /** Kijkt welke regels buiten beeld staan, na elke wijziging, bij scrollen en als het scherm verandert (F29). */
  function measure() {
    // De regel die je versleept, telt niet mee: die is altijd onder je vinger (F28, F29).
    const lis = list.current?.querySelectorAll<HTMLElement>('li[data-id]:not(.dragging)') ?? []
    const rects = Array.from(lis, (li) => li.getBoundingClientRect())
    const limit = addRow.current?.getBoundingClientRect().top ?? window.innerHeight
    // Staat de grijze lijn met het lipje bovenaan in beeld, dan telt alles daarachter als buiten beeld.
    const top =
      document.querySelector('.more-items.above')?.getBoundingClientRect().bottom ??
      header.current?.getBoundingClientRect().bottom ??
      0
    const next = countHidden(rects, top, limit)
    setHidden((prev) => (prev.above === next.above && prev.below === next.below ? prev : next))
    setBottomHeight(bottom.current?.offsetHeight ?? 0)
    setHeaderHeight(header.current?.offsetHeight ?? 0)
  }

  useLayoutEffect(measure)

  // Komen er regels bij, dan schuift het lijstje omhoog tot de laatste regel net boven de invoerregel
  // in beeld staat (F3, F29).
  const count = useRef(rows.length)
  useLayoutEffect(() => {
    const added = rows.length > count.current
    count.current = rows.length
    if (!added) return
    const lis = list.current?.querySelectorAll<HTMLElement>('li[data-id]')
    const last = lis?.[lis.length - 1]
    const limit = addRow.current?.getBoundingClientRect().top
    if (!last || limit === undefined) return
    const overlap = last.getBoundingClientRect().bottom - limit
    if (overlap > 0) window.scrollBy({ top: overlap })
  }, [rows.length])

  useEffect(() => {
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  })

  /** Schuift het lijstje een flink stuk omhoog of omlaag, naar de regels buiten beeld (F29). */
  function scrollPage(direction: 1 | -1) {
    const limit = addRow.current?.getBoundingClientRect().top ?? window.innerHeight
    window.scrollBy({ top: direction * Math.max(100, limit - 120), behavior: 'smooth' })
  }

  /** De greep van de regel `id` op plek `index` (F28). */
  function gripFor(id: string, index: number): Grip {
    return {
      onPointerDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        const lis = list.current?.querySelectorAll<HTMLElement>('li[data-id]') ?? []
        const heights = Array.from(lis, (li) => li.getBoundingClientRect().height)
        pointerY.current = e.clientY
        setDrag({ id, from: index, to: index, dy: 0, startY: e.clientY, startScroll: window.scrollY, heights })
      },
      onPointerMove(e) {
        if (!drag || drag.id !== id) return
        pointerY.current = e.clientY
        setDrag(dragTo(drag, e.clientY))
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
        if (to < 0 || to >= rows.length) return
        setMoved(id)
        onMove(index, to)
      },
    }
  }

  /** Hoe ver een regel opzij schuift tijdens het verslepen, om plaats te maken voor de versleepte regel. */
  function shiftFor(index: number): number {
    if (!drag) return 0
    if (index === drag.from) return drag.dy
    const h = drag.heights[drag.from] ?? 0
    if (drag.from < index && index <= drag.to) return -h
    if (drag.to <= index && index < drag.from) return h
    return 0
  }

  /** De stijl van een regel: opzij geschoven tijdens het verslepen. */
  function dragStyle(index: number) {
    const shift = shiftFor(index)
    if (drag && index === drag.from) return { transform: `translateY(${shift}px)`, transition: 'none' }
    return shift ? { transform: `translateY(${shift}px)` } : undefined
  }

  return {
    header,
    list,
    addRow,
    bottom,
    hidden,
    headerHeight,
    bottomHeight,
    draggingId: dragId ?? null,
    measure,
    scrollPage,
    gripFor,
    shiftFor,
    dragStyle,
  }
}
