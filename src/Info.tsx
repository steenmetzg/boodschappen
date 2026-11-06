import { ArrowLeft } from 'lucide-react'
import { speechSupported } from './speech'

interface Props {
  onClose: () => void
}

/** Informatiepagina met een korte uitleg van wat je met de app kunt (F21). */
export default function Info({ onClose }: Props) {
  return (
    <main className="app">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Over Lijstjes</h1>
      </header>

      <section className="setting info">
        <h2>Wat doet Lijstjes?</h2>
        <p>
          Met Lijstjes maak je snel lijstjes: boodschappen, klusjes, dingen om in te pakken of wat je maar wilt. Een item
          vink je met één tik af; het blijft dan doorgestreept staan. Met het kruisje gooi je een item weg.
        </p>
      </section>

      <section className="setting info">
        <h2>Lijstjes</h2>
        <p>
          Je kunt zoveel lijstjes maken als je wilt, elk met een eigen naam. Met de knop linksboven ga je naar Mijn
          lijstjes, waar je lijstjes maakt, een andere naam geeft of weggooit. De app opent altijd het lijstje dat je het
          laatst gebruikte.
        </p>
      </section>

      {speechSupported() && (
        <section className="setting info">
          <h2>Inspreken</h2>
          <p>
            Met de microfoon spreek je items in, ook meerdere tegelijk: "melk, brood en twee pakken koffie". Inspreken
            werkt alleen met internet.
          </p>
        </section>
      )}
    </main>
  )
}
