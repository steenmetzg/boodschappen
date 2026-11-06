import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Pencil, Plus, Trash2, Undo2 } from 'lucide-react'
import { MAX_LIJSTJES, MAX_NAAM, nameError, openCount, type Lijstje } from './lists'

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
  onUndoDelete: (deleted: Deleted) => void
  onClose: () => void
}

/** Een naam invullen, met Annuleren en een knop om te bewaren; met de foutmelding eronder (F10, F11). */
function NameForm({
  label,
  initial,
  confirmLabel,
  check,
  onSave,
  onCancel,
}: {
  label: string
  initial: string
  confirmLabel: string
  check: (naam: string) => string | null
  onSave: (naam: string) => void
  onCancel: () => void
}) {
  const [naam, setNaam] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = check(naam)
    if (problem) {
      setError(problem)
      return
    }
    onSave(naam.trim())
  }

  return (
    <form className="name-form" onSubmit={submit}>
      <input
        type="text"
        aria-label={label}
        value={naam}
        maxLength={MAX_NAAM}
        autoFocus
        onChange={(e) => {
          setNaam(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel()
        }}
      />
      <div className="confirm-buttons">
        <button type="button" onClick={onCancel}>
          Annuleren
        </button>
        <button type="submit" className="confirm-yes">
          {confirmLabel}
        </button>
      </div>
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

/** Het scherm "Mijn lijstjes" (F9 t/m F12). */
export default function Lists({ lijstjes, huidig, onSelect, onCreate, onRename, onDelete, onUndoDelete, onClose }: Props) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleted, setDeleted] = useState<Deleted | null>(null)

  // De melding met Ongedaan maken verdwijnt na 10 seconden; dan is het weggooien definitief.
  useEffect(() => {
    if (!deleted) return
    const timer = setTimeout(() => setDeleted(null), UNDO_MS)
    return () => clearTimeout(timer)
  }, [deleted])

  function remove(id: string) {
    const result = onDelete(id)
    if (result) setDeleted(result)
    if (editing === id) setEditing(null)
  }

  return (
    <main className="app lists-screen">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Mijn lijstjes</h1>
      </header>

      <ul className="lists" aria-label="Mijn lijstjes">
        {lijstjes.map((l) => {
          const open = openCount(l)
          return (
            <li key={l.id} className={l.id === huidig ? 'list-row current' : 'list-row'}>
              {editing === l.id ? (
                <NameForm
                  label={`Nieuwe naam voor ${l.naam}`}
                  initial={l.naam}
                  confirmLabel="Bewaren"
                  check={(naam) => nameError(lijstjes, naam, l.id)}
                  onSave={(naam) => {
                    onRename(l.id, naam)
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <button
                    type="button"
                    className="list-open"
                    aria-label={open > 0 ? `${l.naam}, ${open} open` : l.naam}
                    aria-current={l.id === huidig ? 'true' : undefined}
                    onClick={() => onSelect(l.id)}
                  >
                    <span className="list-name">{l.naam}</span>
                    {open > 0 && (
                      <span className="count" aria-hidden>
                        {open}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Naam van ${l.naam} wijzigen`}
                    onClick={() => {
                      setEditing(l.id)
                      setCreating(false)
                    }}
                  >
                    <Pencil size={18} strokeWidth={1.75} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Lijstje ${l.naam} weggooien`}
                    disabled={lijstjes.length <= 1}
                    onClick={() => remove(l.id)}
                  >
                    <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {creating ? (
        <NameForm
          label="Naam van het nieuwe lijstje"
          initial=""
          confirmLabel="Maken"
          check={(naam) => nameError(lijstjes, naam)}
          onSave={(naam) => {
            onCreate(naam)
            setCreating(false)
          }}
          onCancel={() => setCreating(false)}
        />
      ) : lijstjes.length < MAX_LIJSTJES ? (
        <button
          type="button"
          className="wide-button"
          onClick={() => {
            setCreating(true)
            setEditing(null)
          }}
        >
          <Plus size={20} strokeWidth={1.75} aria-hidden />
          Nieuw lijstje
        </button>
      ) : (
        <p className="muted">Je hebt het maximum van {MAX_LIJSTJES} lijstjes.</p>
      )}

      {deleted && (
        <div className="bottom">
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
        </div>
      )}
    </main>
  )
}
