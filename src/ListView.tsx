import { useRef, useState, type FormEvent, type ReactNode, type TouchEvent } from 'react'
import { ArrowLeft, Bell, BellOff, CalendarCheck, CalendarPlus, Check, GripVertical, Mic, Pencil, Trash2, X } from 'lucide-react'
import { AGENDAS, formatWanneer, isVoorbij, opDatum, type Agenda } from './agenda'
import { limitTyped, MAX_NAAM, MAX_TEKST, type Item, type Lijstje } from './lists'
import { MoreAbove, MoreBelow } from './MoreItems'
import { useScrollList, type Grip } from './scrollList'

// Zo ver (in pixels) veeg je een item naar links om het weg te gooien (F7).
const SWIPE_DELETE = 80
// Pas na zoveel pixels beslissen we of de vinger horizontaal (vegen) of verticaal (scrollen) beweegt.
const SWIPE_LOCK = 10

/** Een melding onderaan; `vast` blijft staan tot je hem sluit (F35). */
export type Notice = { kind: 'ok' | 'error'; text: string; vast?: boolean }

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
  /** Gooit de items én het lijstje zelf weg; `null` als dit het laatste lijstje is (F8). */
  onDeleteList: (() => void) | null
  onBack: () => void
  mic: { show: boolean; listening: boolean; start: () => void; stop: () => void }
  /** Herinneringslijstje: datum en tijd van een item wijzigen, of weghalen met `null` (F33). */
  onWhen: (id: string, wanneer: string | null) => void
  /** Herinneringslijstje: de agenda van het lijstje kiezen en, met een item, dat item erin zetten (F34). */
  onAgenda: (agenda: Agenda | null, itemId: string | null, wanneer?: string) => void
  /** Van een gewoon lijstje een herinneringslijstje maken, of de herinnering uitzetten (F38). */
  onHerinnering: (aan: boolean) => void
  /** De melding met herinneringen (F36). */
  reminders?: ReactNode
  /** Nieuwe naam voor het lijstje; `false` als die niet kan (de melding staat dan onderaan) (F37). */
  onRename: (naam: string) => boolean
}

interface RowProps {
  item: Item
  /** Hoeveel pixels de regel omhoog of omlaag staat tijdens het verslepen. */
  shift: number
  dragging: boolean
  onToggle: () => void
  onEdit: (text: string) => void
  onRemove: () => void
  grip: Grip
  /** In een herinneringslijstje: datum en tijd onder de tekst en een agenda-knopje (F33, F34). */
  herinnering: boolean
  /** Opent het vak met datum en tijd (F33). */
  onDate: () => void
}

/**
 * Eén item: vastpakken om te verplaatsen (F28), het rondje om af te vinken (F6), de tekst om aan te passen (F27),
 * het kruisje of naar links vegen om weg te gooien (F7).
 */
function ItemRow({ item, shift, dragging, onToggle, onEdit, onRemove, grip, herinnering, onDate }: RowProps) {
  // Staat het item met deze datum en tijd in de agenda (F34)?
  const inAgenda = Boolean(item.wanneer && item.inAgenda === item.wanneer)
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
      {herinnering ? (
        // Een herinneringslijstje staat op datum; verplaatsen kan daar niet (F33).
        <span className="item-grip" aria-hidden />
      ) : (
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
      )}
      <button type="button" className="item-check" aria-label={item.tekst} aria-pressed={item.af} onClick={onToggle}>
        <span className="check" aria-hidden>
          {item.af && <Check size={16} strokeWidth={2.5} />}
        </span>
      </button>
      <div className="item-body">
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
              // Ook hier zelf afkappen: het toetsenbord van Android houdt zich niet altijd aan maxLength (F27).
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEKST))}
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
        {herinnering &&
          // Alleen tonen; wijzigen gaat via het agenda-knopje (F33). Rechts op deze regel is ruimte gelaten voor een
          // microfoon, om later datum en tijd in te spreken.
          (item.wanneer ? (
            <span className={isVoorbij(item.wanneer) ? 'item-when past' : 'item-when'}>{formatWanneer(item.wanneer)}</span>
          ) : (
            <span className="item-when none">Geen datum</span>
          ))}
      </div>
      {herinnering && (
        <button
          type="button"
          className={inAgenda ? 'item-delete item-agenda placed' : 'item-delete item-agenda'}
          aria-label={inAgenda ? `${item.tekst} staat in je agenda; datum wijzigen` : `${item.tekst} in agenda zetten`}
          // Altijd eerst het vak met datum en tijd; van daaruit in de agenda (F34). Afgevinkt: niet meer nodig.
          disabled={item.af}
          onClick={onDate}
        >
          {inAgenda ? (
            <CalendarCheck size={18} strokeWidth={1.75} aria-hidden />
          ) : (
            <CalendarPlus size={18} strokeWidth={1.75} aria-hidden />
          )}
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
  onDeleteList,
  onBack,
  mic,
  onWhen,
  onAgenda,
  reminders,
  onRename,
  onHerinnering,
}: Props) {
  const [text, setText] = useState('')
  const [clearing, setClearing] = useState(false)
  // De naam van het lijstje aanpassen door op de titel te tikken (F37).
  const [naam, setNaam] = useState<string | null>(null)
  // De keuze van de agenda: `voor` is het item dat daarna in de agenda gaat, of `null` bij het belletje (F34).
  const [choosing, setChoosing] = useState<{ voor: string | null } | null>(null)
  // Het vak met datum en tijd van een item (F33): het item en de datum in het veld.
  const [dating, setDating] = useState<{ id: string; waarde: string } | null>(null)
  const datingItem = dating ? lijstje.items.find((i) => i.id === dating.id) : undefined
  const herinnering = lijstje.herinnering === true
  // Een herinneringslijstje staat op datum (F33).
  const items = herinnering ? opDatum(lijstje.items) : lijstje.items
  const hasDone = items.some((i) => i.af)
  const input = useRef<HTMLInputElement>(null)
  const scroll = useScrollList(items, herinnering ? () => {} : onMove)
  const { header, list, addRow, bottom, hidden } = scroll

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

  function openDate(item: Item) {
    setClearing(false)
    setChoosing(null)
    setDating({ id: item.id, waarde: item.wanneer ?? '' })
  }

  /** Bewaart de datum uit het vak en zet het item zo nodig meteen in de agenda (F33, F34). */
  function saveDate(enAgenda: boolean) {
    if (!dating) return
    const { id, waarde } = dating
    setDating(null)
    onWhen(id, waarde || null)
    if (enAgenda && waarde) {
      if (lijstje.agenda) onAgenda(lijstje.agenda, id, waarde)
      else setChoosing({ voor: id })
    }
  }

  function choose(agenda: Agenda) {
    const voor = choosing?.voor ?? null
    setChoosing(null)
    onAgenda(agenda, voor)
  }

  return (
    <main className="app list-screen">
      <header ref={header} className="list-header">
        <button type="button" className="back-button" aria-label="Terug naar Mijn lijstjes" onClick={onBack}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        {naam === null ? (
          <h1>
            <button
              type="button"
              className="title-button"
              aria-label={`Naam van ${lijstje.naam} wijzigen`}
              onClick={() => setNaam(lijstje.naam)}
            >
              <span className="title-text">{lijstje.naam}</span>
              <Pencil className="title-pencil" size={15} strokeWidth={1.75} aria-hidden />
            </button>
          </h1>
        ) : (
          <form
            className="title-edit"
            onSubmit={(e) => {
              e.preventDefault()
              // Enter: een goede naam bewaren; anders blijft het veld open met de melding onderaan (F37).
              if (naam.trim() === lijstje.naam || onRename(naam)) setNaam(null)
            }}
          >
            <input
              type="text"
              aria-label={`Nieuwe naam voor ${lijstje.naam}`}
              enterKeyHint="done"
              autoComplete="off"
              autoFocus
              maxLength={MAX_NAAM}
              value={naam}
              onChange={(e) => setNaam(e.target.value.slice(0, MAX_NAAM))}
              onBlur={() => {
                // Ergens anders tikken: een goede naam wordt bewaard, anders blijft de oude naam staan.
                if (naam.trim() !== lijstje.naam) onRename(naam)
                setNaam(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setNaam(null)
              }}
            />
          </form>
        )}
        <div className="header-actions">
          {herinnering ? (
            <button
              type="button"
              className="icon-button"
              aria-label="Agenda van dit lijstje"
              aria-expanded={choosing !== null}
              onClick={() => {
                setClearing(false)
                setDating(null)
                setChoosing(choosing ? null : { voor: null })
              }}
            >
              <Bell size={20} strokeWidth={1.75} aria-hidden />
            </button>
          ) : (
            // Een gewoon lijstje: met de doorgestreepte bel wordt het een herinneringslijstje (F38).
            <button
              type="button"
              className="icon-button bell-off"
              aria-label="Herinneringslijstje maken"
              onClick={() => {
                setClearing(false)
                setDating(null)
                onHerinnering(true)
                // Meteen de agenda-keuze, met het schuifje om het weer uit te zetten (F38).
                setChoosing({ voor: null })
              }}
            >
              <BellOff size={20} strokeWidth={1.75} aria-hidden />
            </button>
          )}
          <button
            type="button"
            className="icon-button"
            aria-label="Lijstje weggooien"
            aria-expanded={clearing}
            disabled={items.length === 0 && !onDeleteList}
            onClick={() => {
              setChoosing(null)
              setDating(null)
              setClearing(!clearing)
            }}
          >
            <Trash2 size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {/* De keuze staat in de vaste titelbalk, zodat hij ook in beeld komt als je omlaag gescrold bent (F8). */}
        {clearing && (
          <section className="confirm clear-choice" aria-label="Lijstje weggooien">
            <strong>Lijstje {lijstje.naam} weggooien</strong>
            <div className="confirm-buttons">
              <button type="button" disabled={!hasDone} onClick={() => clear('af')}>
                Afgevinkte weggooien
              </button>
              <button type="button" className="confirm-yes" disabled={items.length === 0} onClick={() => clear('alles')}>
                Alle items weggooien
              </button>
              <button type="button" className="wide" disabled={!onDeleteList} onClick={() => onDeleteList?.()}>
                Items én het lijstje weggooien
              </button>
              <button type="button" className="cancel" onClick={() => setClearing(false)}>
                Annuleren
              </button>
            </div>
          </section>
        )}
        {dating && datingItem && (
          <section className="confirm clear-choice date-choice" aria-label="Datum en tijd">
            <strong>{datingItem.tekst}</strong>
            {datingItem.inAgenda && datingItem.inAgenda === datingItem.wanneer && (
              <p>Staat al in je agenda op {formatWanneer(datingItem.inAgenda)}.</p>
            )}
            <div className="date-field">
              <input
                type="datetime-local"
                aria-label={`Datum en tijd van ${datingItem.tekst}`}
                value={dating.waarde}
                onChange={(e) => setDating({ ...dating, waarde: e.target.value })}
              />
              <button
                type="button"
                className="date-clear"
                aria-label="Datum weghalen"
                disabled={!dating.waarde}
                onClick={() => setDating({ ...dating, waarde: '' })}
              >
                <X size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <div className="confirm-buttons">
              <button type="button" disabled={dating.waarde === (datingItem.wanneer ?? '')} onClick={() => saveDate(false)}>
                Alleen in Lijstjes bewaren
              </button>
              <button
                type="button"
                className="confirm-yes"
                // Met dezelfde datum en tijd zou er een tweede agenda-item komen (F34).
                disabled={!dating.waarde || dating.waarde === datingItem.inAgenda}
                onClick={() => saveDate(true)}
              >
                In agenda zetten
              </button>
              <button type="button" className="cancel" onClick={() => setDating(null)}>
                Annuleren
              </button>
            </div>
          </section>
        )}
        {choosing && (
          <section className="confirm clear-choice agenda-choice" aria-label="Agenda kiezen">
            <strong>{choosing.voor ? 'In welke agenda?' : `Agenda voor ${lijstje.naam}`}</strong>
            <p>
              Herinneringen worden altijd in Lijstjes getoond. Kies hieronder waar je ze ook op wilt nemen. Je keuze geldt alleen
              voor deze lijst ({lijstje.naam}).
            </p>
            {!choosing.voor && (
              // De herinnering uitzetten maakt er weer een gewoon lijstje van (F38).
              <label className="herinnering-switch">
                <span>Herinnering</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked
                  onChange={() => {
                    setChoosing(null)
                    onHerinnering(false)
                  }}
                />
              </label>
            )}
            <div className="confirm-buttons">
              {AGENDAS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={lijstje.agenda === a.id ? 'confirm-yes' : undefined}
                  aria-pressed={lijstje.agenda === a.id}
                  onClick={() => choose(a.id)}
                >
                  {a.label}
                </button>
              ))}
              <button type="button" className="cancel-half" onClick={() => setChoosing(null)}>
                Annuleren
              </button>
            </div>
          </section>
        )}
      </header>

      <MoreAbove
        count={hidden.above}
        words={['item', 'items']}
        headerHeight={scroll.headerHeight}
        onClick={() => scroll.scrollPage(-1)}
      />

      <ul
        ref={list}
        className="items"
        aria-label={`Items op ${lijstje.naam}`}
        // Na verplaatsen schuiven de regels nog even naar hun plek; daarna opnieuw tellen (F29).
        onTransitionEnd={scroll.measure}
      >
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            shift={scroll.shiftFor(index)}
            dragging={scroll.draggingId === item.id}
            onToggle={() => onToggle(item.id)}
            onEdit={(t) => onEdit(item.id, t)}
            onRemove={() => onRemove(item.id)}
            grip={scroll.gripFor(item.id, index)}
            herinnering={herinnering}
            onDate={() => openDate(item)}
          />
        ))}
        {/* De invoerregel staat als laatste regel in het lijstje (F3, F15). */}
        <li
          ref={addRow}
          className={hidden.below > 0 ? 'item add-row covering' : 'item add-row'}
          style={{ bottom: scroll.bottomHeight }}
        >
          <MoreBelow count={hidden.below} words={['item', 'items']} onClick={() => scroll.scrollPage(1)} />
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
              value={text}
              // Elk item mag maximaal 60 tekens hebben, ook als je er meerdere met komma's typt (F3, F4).
              onChange={(e) => setText(limitTyped(e.target.value))}
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
        {reminders}
        {mic.listening ? (
          <section className="voice" aria-live="polite">
            <p>
              <strong>Luisteren…</strong> Zeg bijvoorbeeld: melk komma brood komma twee pakken koffie
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
