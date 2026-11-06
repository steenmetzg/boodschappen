import { useEffect, useState } from 'react'
import Info from './Info'
import { useInstallPrompt } from './installPrompt'
import Lists, { type Deleted } from './Lists'
import ListView, { type Notice } from './ListView'
import {
  addItems,
  addMessage,
  loadCurrent,
  loadLijstjes,
  newId,
  saveCurrent,
  saveLijstjes,
  splitTyped,
  type Lijstje,
} from './lists'
import Settings from './Settings'
import { loadSpeechEnabled, saveSpeechEnabled, speechSupported, splitSpoken, useSpeech } from './speech'

// Zo lang blijft een melding onderaan het lijstje staan, in milliseconden.
const NOTICE_MS = 5000

export default function App() {
  const [lijstjes, setLijstjes] = useState<Lijstje[]>(loadLijstjes)
  const [huidig, setHuidig] = useState(() => loadCurrent(lijstjes))
  const [screen, setScreen] = useState<'lijst' | 'lijstjes' | 'settings' | 'info'>('lijst')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [speechEnabled, setSpeechEnabled] = useState(loadSpeechEnabled)
  const installPrompt = useInstallPrompt()
  const speech = useSpeech(
    (alternatives) => addTexts(splitSpoken(alternatives[0]), true),
    (text) => setNotice({ kind: 'error', text }),
  )
  const lijstje = lijstjes.find((l) => l.id === huidig) ?? lijstjes[0]

  useEffect(() => saveLijstjes(lijstjes), [lijstjes])
  useEffect(() => saveCurrent(huidig), [huidig])
  useEffect(() => saveSpeechEnabled(speechEnabled), [speechEnabled])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  function update(id: string, change: (l: Lijstje) => Lijstje) {
    setLijstjes((all) => all.map((l) => (l.id === id ? change(l) : l)))
  }

  function addTexts(texts: string[], spoken: boolean) {
    if (texts.length === 0) {
      if (spoken) setNotice({ kind: 'error', text: 'Ik verstond geen item. Probeer het opnieuw.' })
      return
    }
    const result = addItems(lijstje, texts)
    update(lijstje.id, () => result.lijstje)
    const text = addMessage(result, spoken)
    setNotice(text ? { kind: 'ok', text } : null)
  }

  function openList(id: string) {
    setHuidig(id)
    setNotice(null)
    setScreen('lijst')
  }

  function create(naam: string) {
    const id = newId()
    setLijstjes((all) => [...all, { id, naam, items: [] }])
    openList(id)
  }

  function remove(id: string): Deleted | null {
    const index = lijstjes.findIndex((l) => l.id === id)
    if (index === -1 || lijstjes.length <= 1) return null
    const rest = lijstjes.filter((l) => l.id !== id)
    setLijstjes(rest)
    // Gooi je het huidige lijstje weg, dan wordt het eerste lijstje het huidige.
    if (id === huidig) setHuidig(rest[0].id)
    return { lijstje: lijstjes[index], index, wasCurrent: id === huidig }
  }

  function undoRemove({ lijstje: back, index, wasCurrent }: Deleted) {
    setLijstjes((all) => {
      if (all.some((l) => l.id === back.id)) return all
      const copy = [...all]
      copy.splice(Math.min(index, copy.length), 0, back)
      return copy
    })
    if (wasCurrent) setHuidig(back.id)
  }

  if (screen === 'settings') {
    return (
      <Settings
        lijstjes={lijstjes}
        huidig={lijstje.id}
        speechEnabled={speechEnabled}
        onChangeSpeechEnabled={setSpeechEnabled}
        onRestore={(restored, current) => {
          setLijstjes(restored)
          setHuidig(current)
        }}
        onClose={() => setScreen('lijst')}
      />
    )
  }

  if (screen === 'info') return <Info onClose={() => setScreen('lijst')} />

  if (screen === 'lijstjes') {
    return (
      <Lists
        lijstjes={lijstjes}
        huidig={lijstje.id}
        onSelect={openList}
        onCreate={create}
        onRename={(id, naam) => update(id, (l) => ({ ...l, naam }))}
        onDelete={remove}
        onUndoDelete={undoRemove}
        onClose={() => setScreen('lijst')}
      />
    )
  }

  return (
    <ListView
      // Een ander lijstje begint met een leeg tekstveld en zonder open keuze om leeg te maken.
      key={lijstje.id}
      lijstje={lijstje}
      notice={notice}
      onCloseNotice={() => setNotice(null)}
      onAdd={(text) => addTexts(splitTyped(text), false)}
      onToggle={(id) => update(lijstje.id, (l) => ({ ...l, items: l.items.map((i) => (i.id === id ? { ...i, af: !i.af } : i)) }))}
      onRemove={(id) => update(lijstje.id, (l) => ({ ...l, items: l.items.filter((i) => i.id !== id) }))}
      onClear={(which) =>
        update(lijstje.id, (l) => ({ ...l, items: which === 'alles' ? [] : l.items.filter((i) => !i.af) }))
      }
      onOpenLists={() => {
        setNotice(null)
        setScreen('lijstjes')
      }}
      onOpenInfo={() => setScreen('info')}
      onOpenSettings={() => setScreen('settings')}
      install={installPrompt}
      mic={{
        show: speechEnabled && speechSupported(),
        listening: speech.listening,
        start: () => {
          setNotice(null)
          speech.start()
        },
        stop: speech.stop,
      }}
    />
  )
}
