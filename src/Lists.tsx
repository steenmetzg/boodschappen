import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Bell, BellOff, GripVertical, Info as InfoIcon, Mic, Pencil, Settings as SettingsIcon, Trash2, Undo2, X } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import type { Notice } from './ListView'
import { itemsText, MAX_NAAM, nameError, openCount, type Lijstje } from './lists'
import { MoreAbove, MoreBelow } from './MoreItems'
import { useScrollList, type Grip } from './scrollList'

// Zo lang (in milliseconden) kun je het weggooien van een lijstje ongedaan maken (F12).
export const UNDO_MS = 10000

/** Wat nodig is om een weggegooid lijstje terug te zetten. */
export interface Deleted {
  lijstje: Lijstje
  index: number
  wasCurrent: boolean
}

interface Props {
  lijstjes: Lijstje[]
  huidig: string
  onSelect: (id: string) => void
  onCreate: (naam: string) => void
  onRename: (id: string, naam: string) => void
  onDelete: (id: string) => Deleted | null
  onMove: (from: number, to: number) => void
  onUndoDelete: (deleted: Deleted) => void
  onOpenInfo: () => void
  onOpenSettings: () => void
  install: { show: boolean; install: () => void; notNow: () => void }
  /** Een lijstje dat net vanuit dat lijstje is weggegooid, om ongedaan te maken (F8, F12). */
  justDeleted: Deleted | null
  notice: Notice | null
  onCloseNotice: () => void
  mic: { show: boolean; listening: boolean; start: () => void; stop: () => void }
  /** Het belletje bij Nieuw lijstje staat aan: het nieuwe lijstje wordt een herinneringslijstje (F32). */
  nieuwHerinnering: boolean
  onToggleHerinnering: () => void
  /** De melding met herinneringen (F36). */
  reminders?: ReactNode
}

interface RowProps {
  lijstje: Lijstje
  current: boolean
  editing: boolean
  canDelete: boolean
  style: CSSProperties | undefined
  dragging: boolean
  grip: Grip
  check: (naam: string) => string | null
  onOpen: () => void
  onStartEdit: () => void
  onRename: (naam: string) => void
  onStopEdit: () => void
  onError: (error: string | null) => void
  onDelete: () => void
}

/**
 * Eén lijstje op Mijn lijstjes: vastpakken om te verplaatsen (F30), tikken om te openen (F9), het potlood om de naam
 * te wijzigen (F11) en de prullenbak om weg te gooien (F12).
 */
function ListRow({
  lijstje,
  current,
  editing,
  canDelete,
  style,
  dragging,
  grip,
  check,
  onOpen,
  onStartEdit,
  onRename,
  onStopEdit,
  onError,
  onDelete,
}: RowProps) {
  const [naam, setNaam] = useState(lijstje.naam)
  const open = openCount(lijstje)

  /** Bewaart de nieuwe naam; bij een fout blijft het veld open met de melding onderaan (F11). */
  function save(e: FormEvent) {
    e.preventDefault()
    const problem = check(naam)
    if (problem) {
      onError(problem)
      return
    }
    onError(null)
    if (naam.trim() !== lijstje.naam) onRename(naam.trim())
    onStopEdit()
  }

  return (
    <li
      className={['item', 'list-row', current && 'current', dragging && 'dragging'].filter(Boolean).join(' ')}
      data-id={lijstje.id}
      style={style}
    >
      <button
        type="button"
        className="item-grip"
        aria-label={`${lijstje.naam} verplaatsen`}
        aria-description="Sleep omhoog of omlaag, of gebruik de pijltjestoetsen"
        {...grip}
      >
        <GripVertical size={18} strokeWidth={1.75} aria-hidden />
      </button>
      {editing ? (
        <form className="item-edit" onSubmit={save}>
          <input
            type="text"
            aria-label={`Nieuwe naam voor ${lijstje.naam}`}
            enterKeyHint="done"
            autoComplete="off"
            autoFocus
            maxLength={MAX_NAAM}
            value={naam}
            onChange={(e) => {
              setNaam(e.target.value.slice(0, MAX_NAAM))
              onError(null)
            }}
            onBlur={() => {
              // Weg uit het veld: een goede naam wordt bewaard, anders blijft de oude naam staan.
              if (!check(naam) && naam.trim() !== lijstje.naam) onRename(naam.trim())
              onError(null)
              onStopEdit()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onError(null)
                onStopEdit()
              }
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          className="list-open"
          aria-label={open > 0 ? `${lijstje.naam}, ${open} open` : lijstje.naam}
          aria-current={current ? 'true' : undefined}
          onClick={onOpen}
        >
          {lijstje.herinnering ? (
            <Bell className="list-bell" size={15} strokeWidth={2} aria-label="Herinneringslijstje" />
          ) : (
            // Grijs en zonder actie: een herinneringslijstje maak je op het lijstje zelf (F38).
            <BellOff className="list-bell off" size={15} strokeWidth={2} aria-hidden />
          )}
          <span className="list-name">{lijstje.naam}</span>
          {open > 0 && (
            <span className="count" aria-hidden>
              {open}
            </span>
          )}
        </button>
      )}
      <button
        type="button"
        className="item-delete"
        aria-label={`Naam van ${lijstje.naam} wijzigen`}
        onClick={() => {
          setNaam(lijstje.naam)
          onStartEdit()
        }}
      >
        <Pencil size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        className="item-delete"
        aria-label={`Lijstje ${lijstje.naam} weggooien`}
        disabled={!canDelete}
        onClick={onDelete}
      >
        <Trash2 size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </li>
  )
}

/** Het hoofdscherm "Mijn lijstjes" (F9 t/m F12, F30). */
export default function Lists({
  lijstjes,
  huidig,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onMove,
  onUndoDelete,
  onOpenInfo,
  onOpenSettings,
  install,
  justDeleted,
  notice,
  onCloseNotice,
  mic,
  nieuwHerinnering,
  onToggleHerinnering,
  reminders,
}: Props) {
  const [naam, setNaam] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  // Een naam die niet kan (leeg of al bestaand), onderaan het scherm (F10, F11).
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState<Deleted | null>(justDeleted)
  // Een lijstje met items dat na bevestiging wordt weggegooid (F12).
  const [confirmDelete, setConfirmDelete] = useState<Lijstje | null>(null)
  const scroll = useScrollList(lijstjes, onMove)
  const { header, list, addRow, bottom, hidden } = scroll

  // De melding met Ongedaan maken verdwijnt na 10 seconden; dan is het weggooien definitief. De melding telt de
  // seconden af (F12).
  const [left, setLeft] = useState(UNDO_MS / 1000)
  useEffect(() => {
    if (!deleted) return
    setLeft(UNDO_MS / 1000)
    const start = Date.now()
    const tick = setInterval(() => setLeft(Math.max(0, Math.ceil((UNDO_MS - (Date.now() - start)) / 1000))), 250)
    const timer = setTimeout(() => setDeleted(null), UNDO_MS)
    return () => {
      clearInterval(tick)
      clearTimeout(timer)
    }
  }, [deleted])

  function askRemove(l: Lijstje) {
    // Staan er items op, dan eerst vragen of die ook weg mogen, zoals bij een rubriek in WoonWerk.
    if (l.items.length > 0) setConfirmDelete(l)
    else remove(l.id)
  }

  function remove(id: string) {
    setConfirmDelete(null)
    const result = onDelete(id)
    if (result) setDeleted(result)
    if (editing === id) setEditing(null)
  }

  /** Maakt een nieuw lijstje met de getypte naam (F10). */
  function create(e: FormEvent) {
    e.preventDefault()
    const problem = nameError(lijstjes, naam)
    if (problem) {
      setError(problem)
      return
    }
    onCreate(naam.trim())
  }

  return (
    <main className="app lists-screen">
      <header ref={header} className="main-header">
        <h1>Mijn lijstjes</h1>
        <div className="header-actions">
          <button type="button" className="icon-button" aria-label="Informatie" onClick={onOpenInfo}>
            <InfoIcon size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <button type="button" className="icon-button" aria-label="Instellingen en backup" onClick={onOpenSettings}>
            <SettingsIcon size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </header>

      <MoreAbove
        count={hidden.above}
        words={['lijstje', 'lijstjes']}
        headerHeight={scroll.headerHeight}
        onClick={() => scroll.scrollPage(-1)}
      />

      <ul ref={list} className="items lists" aria-label="Mijn lijstjes" onTransitionEnd={scroll.measure}>
        {lijstjes.map((l, index) => (
          <ListRow
            key={l.id}
            lijstje={l}
            current={l.id === huidig}
            editing={editing === l.id}
            canDelete={lijstjes.length > 1}
            style={scroll.dragStyle(index)}
            dragging={scroll.draggingId === l.id}
            grip={scroll.gripFor(l.id, index)}
            check={(n) => nameError(lijstjes, n, l.id)}
            onOpen={() => onSelect(l.id)}
            onStartEdit={() => {
              setEditing(l.id)
              setError(null)
            }}
            onRename={(n) => onRename(l.id, n)}
            onStopEdit={() => setEditing(null)}
            onError={setError}
            onDelete={() => askRemove(l)}
          />
        ))}
        {/* De invoerregel voor een nieuw lijstje staat als laatste regel, zoals bij items (F10). */}
        <li
          ref={addRow}
          className={hidden.below > 0 ? 'item add-row covering' : 'item add-row'}
          style={{ bottom: scroll.bottomHeight }}
        >
          <MoreBelow count={hidden.below} words={['lijstje', 'lijstjes']} onClick={() => scroll.scrollPage(1)} />
          {/* Het belletje staat links, op de plek van de greep (F32). */}
          <span className="item-grip bell-slot">
            <button
              type="button"
              className={nieuwHerinnering ? 'icon-button bell on' : 'icon-button bell'}
              aria-label="Herinneringslijstje"
              aria-pressed={nieuwHerinnering}
              onClick={onToggleHerinnering}
            >
              <Bell size={15} strokeWidth={2} aria-hidden />
            </button>
          </span>
          <form className="add-item" onSubmit={create}>
            <input
              type="text"
              aria-label="Naam van het nieuwe lijstje"
              placeholder={nieuwHerinnering ? 'Nieuw herinneringslijstje' : 'Nieuw lijstje'}
              enterKeyHint="go"
              autoComplete="off"
              maxLength={MAX_NAAM}
              value={naam}
              onChange={(e) => {
                setNaam(e.target.value.slice(0, MAX_NAAM))
                setError(null)
              }}
            />
            {mic.show && (
              // Inspreken: wat je zegt, wordt de naam van het nieuwe lijstje (F31).
              <button
                type="button"
                className={mic.listening ? 'icon-button mic listening' : 'icon-button mic'}
                aria-label={mic.listening ? 'Stoppen met luisteren' : 'Naam inspreken'}
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
        {confirmDelete && (
          <ConfirmDialog
            title="Dit lijstje bevat items"
            text={`${confirmDelete.naam} heeft ${itemsText(confirmDelete.items.length)}. Lijstje en items weggooien?`}
            confirmLabel="Weggooien"
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => remove(confirmDelete.id)}
          />
        )}
        {mic.listening ? (
          <section className="voice" aria-live="polite">
            <p>
              <strong>Luisteren…</strong> Zeg de naam van het nieuwe lijstje
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
        {error && (
          // Net als de meldingen op een lijstje (F5): onderaan, wit met een streep links.
          <section className="voice error">
            <p role="alert">{error}</p>
          </section>
        )}
        {install.show && (
          <section className="install" aria-label="App installeren">
            <p>Lijstjes als app installeren?</p>
            <button type="button" onClick={install.notNow}>
              Niet nu
            </button>
            <button type="button" className="install-now" onClick={install.install}>
              Installeren
            </button>
          </section>
        )}
        {deleted && (
          <section className="voice" aria-live="polite">
            <p role="status">Lijstje {deleted.lijstje.naam} weggegooid</p>
            <button
              type="button"
              className="undo-button"
              onClick={() => {
                onUndoDelete(deleted)
                setDeleted(null)
              }}
            >
              <Undo2 size={18} strokeWidth={1.75} aria-hidden />
              Ongedaan maken
              <span className="undo-count" aria-hidden>
                {left}
              </span>
            </button>
          </section>
        )}
      </div>
    </main>
  )
}
