import { useEffect, useState } from 'react'
import Info from './Info'
import { useInstallPrompt } from './installPrompt'
import Lists, { type Deleted } from './Lists'
import ListView, { type Notice } from './ListView'
import {
  addItems,
  addMessage,
  editItem,
  loadCurrent,
  loadLijstjes,
  move,
  nameError,
  moveItem,
  newId,
  saveCurrent,
  saveLijstjes,
  setWanneer,
  splitTyped,
  type Lijstje,
} from './lists'
import { zetInAgenda, type Agenda } from './agenda'
import Settings from './Settings'
import { loadSpeechEnabled, saveSpeechEnabled, speechSupported, bestSpoken, spokenName, useSpeech } from './speech'

// Zo lang blijft een melding onderaan het lijstje staan, in milliseconden.
const NOTICE_MS = 5000

export default function App() {
  const [lijstjes, setLijstjes] = useState<Lijstje[]>(loadLijstjes)
  // Het laatst geopende lijstje; `null` zolang er nog nooit een lijstje is geopend.
  const [huidig, setHuidig] = useState<string | null>(() => loadCurrent(lijstjes))
  // De app start met het laatst gebruikte lijstje, of met Mijn lijstjes als er nog geen is (F1).
  const [screen, setScreen] = useState<'lijst' | 'lijstjes' | 'settings' | 'info'>(() => (huidig ? 'lijst' : 'lijstjes'))
  const [notice, setNotice] = useState<Notice | null>(null)
  // Een lijstje dat vanuit dat lijstje zelf is weggegooid; Mijn lijstjes toont dan Ongedaan maken (F8, F12).
  const [justDeleted, setJustDeleted] = useState<Deleted | null>(null)
  const [speechEnabled, setSpeechEnabled] = useState(loadSpeechEnabled)
  // Het belletje bij Nieuw lijstje: het volgende lijstje wordt een herinneringslijstje (F32).
  const [nieuwHerinnering, setNieuwHerinnering] = useState(false)
  const installPrompt = useInstallPrompt()
  const speech = useSpeech(
    // Op Mijn lijstjes is wat je zegt de naam van een nieuw lijstje (F31), op een lijstje zijn het items (F15).
    (alternatives) => (screen === 'lijstjes' ? createSpoken(spokenName(alternatives)) : addTexts(bestSpoken(alternatives), true)),
    (text) => setNotice({ kind: 'error', text }),
  )
  const lijstje = lijstjes.find((l) => l.id === huidig) ?? lijstjes[0]

  useEffect(() => saveLijstjes(lijstjes), [lijstjes])
  useEffect(() => {
    if (huidig) saveCurrent(huidig)
  }, [huidig])
  useEffect(() => saveSpeechEnabled(speechEnabled), [speechEnabled])

  useEffect(() => {
    if (!notice || notice.vast) return
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
    setJustDeleted(null)
    setHuidig(id)
    setNotice(null)
    setScreen('lijst')
  }

  function create(naam: string) {
    const id = newId()
    setLijstjes((all) => [...all, { id, naam, items: [], ...(nieuwHerinnering && { herinnering: true }) }])
    setNieuwHerinnering(false)
    openList(id)
  }

  /** Maakt een lijstje met de ingesproken naam, of meldt waarom dat niet kan (F31). */
  function createSpoken(naam: string) {
    const problem = nameError(lijstjes, naam)
    if (problem) setNotice({ kind: 'error', text: naam ? problem : 'Ik verstond geen naam. Probeer het opnieuw.' })
    else create(naam)
  }

  function remove(id: string): Deleted | null {
    const index = lijstjes.findIndex((l) => l.id === id)
    if (index === -1 || lijstjes.length <= 1) return null
    const rest = lijstjes.filter((l) => l.id !== id)
    setLijstjes(rest)
    const wasCurrent = id === lijstje.id
    // Gooi je het huidige lijstje weg, dan wordt het eerste lijstje het huidige.
    if (wasCurrent && huidig) setHuidig(rest[0].id)
    return { lijstje: lijstjes[index], index, wasCurrent }
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

  /** Een andere datum of tijd; stond het item al in de agenda, dan moet je dat oude agenda-item zelf weghalen (F35). */
  function changeWhen(id: string, wanneer: string | null) {
    const item = lijstje.items.find((i) => i.id === id)
    update(lijstje.id, (l) => setWanneer(l, id, wanneer))
    if (item?.inAgenda && item.inAgenda !== wanneer) {
      setNotice({
        kind: 'error',
        vast: true,
        text: `${item.tekst} staat nog met de oude datum en tijd in je agenda. Verwijder dat agenda-item zelf.`,
      })
    }
  }

  /** Kiest de agenda van het lijstje en zet zo nodig een item erin (F34). */
  function agenda(keuze: Agenda | null, itemId: string | null, nieuweDatum?: string) {
    const l = lijstje
    if (keuze && keuze !== l.agenda) update(l.id, (x) => ({ ...x, agenda: keuze }))
    const item = l.items.find((i) => i.id === itemId)
    const welke = keuze ?? l.agenda
    // Net bewaard in het vak met datum en tijd: die datum, ook al staat hij nog niet in `lijstje`.
    const wanneer = nieuweDatum ?? item?.wanneer
    if (!item || !wanneer || !welke) return
    // Niet wachten vóór het openen: anders houdt de browser het nieuwe venster tegen.
    void zetInAgenda(welke, { id: item.id, titel: item.tekst, lijstje: l.naam, wanneer }).then((ok) => {
      if (ok) {
        update(l.id, (x) => ({ ...x, items: x.items.map((i) => (i.id === item.id && i.wanneer === wanneer ? { ...i, inAgenda: wanneer } : i)) }))
      } else if (welke === 'delen' && typeof navigator.share !== 'function') {
        setNotice({ kind: 'error', text: 'Delen kan niet op deze telefoon. Kies een andere agenda met het belletje.' })
      }
    })
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
        onClose={() => setScreen('lijstjes')}
      />
    )
  }

  if (screen === 'info') return <Info onClose={() => setScreen('lijstjes')} />

  if (screen === 'lijstjes') {
    return (
      <Lists
        lijstjes={lijstjes}
        huidig={huidig ?? ''}
        onSelect={openList}
        onCreate={create}
        onRename={(id, naam) => update(id, (l) => ({ ...l, naam }))}
        onDelete={remove}
        onMove={(from, to) => setLijstjes((all) => move(all, from, to))}
        onUndoDelete={undoRemove}
        onOpenInfo={() => {
          setJustDeleted(null)
          setScreen('info')
        }}
        onOpenSettings={() => {
          setJustDeleted(null)
          setScreen('settings')
        }}
        install={installPrompt}
        justDeleted={justDeleted}
        notice={notice}
        onCloseNotice={() => setNotice(null)}
        nieuwHerinnering={nieuwHerinnering}
        onToggleHerinnering={() => setNieuwHerinnering(!nieuwHerinnering)}
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

  return (
    <ListView
      // Een ander lijstje begint met een leeg tekstveld en zonder open keuze om leeg te maken.
      key={lijstje.id}
      lijstje={lijstje}
      notice={notice}
      onCloseNotice={() => setNotice(null)}
      onAdd={(text) => addTexts(splitTyped(text), false)}
      onToggle={(id) => update(lijstje.id, (l) => ({ ...l, items: l.items.map((i) => (i.id === id ? { ...i, af: !i.af } : i)) }))}
      onEdit={(id, text) => {
        const result = editItem(lijstje, id, text)
        update(lijstje.id, () => result.lijstje)
        setNotice(result.error ? { kind: 'error', text: result.error } : null)
      }}
      onMove={(from, to) => update(lijstje.id, (l) => moveItem(l, from, to))}
      onRemove={(id) => update(lijstje.id, (l) => ({ ...l, items: l.items.filter((i) => i.id !== id) }))}
      onClear={(which) =>
        update(lijstje.id, (l) => ({ ...l, items: which === 'alles' ? [] : l.items.filter((i) => !i.af) }))
      }
      onDeleteList={
        lijstjes.length > 1
          ? () => {
              setNotice(null)
              setJustDeleted(remove(lijstje.id))
              setScreen('lijstjes')
            }
          : null
      }
      onBack={() => {
        setNotice(null)
        setScreen('lijstjes')
      }}
      onWhen={changeWhen}
      onAgenda={agenda}
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
