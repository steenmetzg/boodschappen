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
          Lijstjes is een eenvoudige app voor al je lijstjes: boodschappen, klusjes, dingen om in te pakken of wat je
          maar wilt. Je zet items snel op een lijstje, vinkt ze af als ze klaar zijn en past ze aan of gooit ze weg. Een
          afgevinkt item blijft doorgestreept op zijn plek staan. De volgorde van de items bepaal je zelf. Lijstjes werkt
          ook zonder internet en bewaart alles op je telefoon.
        </p>
      </section>

      <section className="setting info">
        <h2>Lijstjes</h2>
        <p>
          Je kunt zoveel lijstjes bijhouden als je wilt, elk met een eigen naam. Lijstjes onthoudt welk lijstje je het
          laatst gebruikte en opent dat meteen. Met een backup bewaar je al je lijstjes in een bestand en zet je ze terug,
          ook op een andere telefoon.
        </p>
      </section>

      {speechSupported() && (
        <section className="setting info">
          <h2>Inspreken</h2>
          <p>
            Je kunt items ook inspreken, meerdere tegelijk. Lijstjes maakt van alles tussen het woord "komma" een apart
            item, dus "melk komma brood komma twee pakken koffie" wordt drie items. Het woordje "en" splitst niet, dus
            "Jan en Piet ophalen van Schiphol" blijft één item. Inspreken werkt alleen met internet.
          </p>
        </section>
      )}
    </main>
  )
}
