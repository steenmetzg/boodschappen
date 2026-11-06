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
          Met Lijstjes maak je snel lijstjes: boodschappen, klusjes, dingen om in te pakken of wat je maar wilt. Een nieuw
          item typ je op de onderste regel van het lijstje. Met een tik op het rondje vink je een item af; het blijft dan
          doorgestreept staan. Tik op de tekst om hem aan te passen, en met het kruisje gooi je een item weg. Pak een item
          vast aan de puntjes links om het hoger of lager te zetten.
        </p>
      </section>

      <section className="setting info">
        <h2>Lijstjes</h2>
        <p>
          Op Mijn lijstjes maak je zoveel lijstjes als je wilt, elk met een eigen naam, en geef je ze een andere naam of
          gooi je ze weg. Tik op een lijstje om het te openen. De app start altijd met het lijstje dat je het laatst
          gebruikte.
        </p>
      </section>

      {speechSupported() && (
        <section className="setting info">
          <h2>Inspreken</h2>
          <p>
            Met de microfoon spreek je items in, ook meerdere tegelijk door "komma" te zeggen: "melk komma brood komma twee pakken koffie". Het woordje "en" splitst niet, dus "Jan en Piet ophalen" blijft één item. Inspreken
            werkt alleen met internet.
          </p>
        </section>
      )}
    </main>
  )
}
