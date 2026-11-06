import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { GripVertical, Info as InfoIcon, Pencil, Settings as SettingsIcon, Trash2, Undo2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import { itemsText, MAX_LIJSTJES, MAX_NAAM, nameError, openCount, type Lijstje } from './lists'
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
              setNaam(e.target.value)
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
}: Props) {
  const [naam, setNaam] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  // Een naam die niet kan (leeg of al bestaand), onderaan het scherm (F10, F11).
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState<Deleted | null>(null)
  // Een lijstje met items dat na bevestiging wordt weggegooid (F12).
  const [confirmDelete, setConfirmDelete] = useState<Lijstje | null>(null)
  const scroll = useScrollList(lijstjes, onMove)
  const { header, list, addRow, bottom, hidden } = scroll

  // De melding met Ongedaan maken verdwijnt na 10 seconden; dan is het weggooien definitief.
  useEffect(() => {
    if (!deleted) return
    const timer = setTimeout(() => setDeleted(null), UNDO_MS)
    return () => clearTimeout(timer)
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
          <span className="item-grip" aria-hidden />
          {lijstjes.length < MAX_LIJSTJES ? (
            <form className="add-item" onSubmit={create}>
              <input
                type="text"
                aria-label="Naam van het nieuwe lijstje"
                placeholder="Nieuw lijstje"
                enterKeyHint="go"
                autoComplete="off"
                maxLength={MAX_NAAM}
                value={naam}
                onChange={(e) => {
                  setNaam(e.target.value)
                  setError(null)
                }}
              />
            </form>
          ) : (
            <p className="muted max-lists">Je hebt het maximum van {MAX_LIJSTJES} lijstjes.</p>
          )}
        </li>
      </ul>

      <div ref={bottom} className="bottom">
        {confirmDelete && (
          <ConfirmDialog
            title="Dit lijstje bevat items"
            text={`${confirmDelete.naam} heeft ${itemsText(confirmDelete.items.length)}. Lijstje en items weggooien?`}
            confirmLabel="Weggooien"
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => remove(confirmDelete.id)}
          />
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
            </button>
          </section>
        )}
      </div>
    </main>
  )
}
