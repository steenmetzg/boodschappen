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
          maar wilt. Je zet items snel op een lijstje, vinkt ze af als ze klaar zijn, past ze aan of gooit ze weg. De
          volgorde van de items bepaal je zelf. Lijstjes werkt ook zonder internet en bewaart alles alleen op je
          telefoon.
        </p>
      </section>

      <section className="setting info">
        <h2>Mijn lijstjes</h2>
        <p>
          Je kunt zoveel lijstjes bijhouden als je wilt, elk met een eigen naam. Ook de volgorde van je lijstjes bepaal je zelf. Lijstjes onthoudt welk lijstje je het
          laatst gebruikte en opent dat meteen. Een lijstje kun je helemaal verwijderen of je verwijdert alleen de
          afgevinkte items.
        </p>
      </section>

      {speechSupported() && (
        <section className="setting info">
          <h2>Inspreken</h2>
          <p>
            Je kunt de naam van nieuwe lijstjes inspreken. Je kunt in een lijstje ook items inspreken, meerdere
            tegelijk. Lijstjes maakt van alles wat tussen het woord "komma" staat een apart item, dus "melk komma brood
            komma twee pakken koffie" wordt drie items. Inspreken werkt alleen met internet.
          </p>
        </section>
      )}

      <section className="setting info">
        <h2>Instellingen</h2>
        {speechSupported() && <p>Zet de microfoon voor inspreken aan of uit.</p>}
        <p>Met een backup bewaar je al je lijstjes in een bestand en zet je ze terug, ook op een andere telefoon.</p>
        <p>
          Lijstjes telt anoniem hoe vaak de app wordt geïnstalleerd en geopend; wat je op je lijstjes zet, wordt nooit
          verstuurd.
        </p>
      </section>
    </main>
  )
}
