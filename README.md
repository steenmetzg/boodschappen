# Lijstjes

Snel lijstjes maken door items te typen of in te spreken: boodschappen, klusjes, dingen om in te pakken of wat je maar
wilt. Een item vink je met één tik af of gooi je weg, en je kunt meerdere lijstjes met een eigen naam bijhouden.
De specificatie staat in [SPEC.md](SPEC.md). Lijstjes is gebaseerd op [WoonWerk](https://github.com/steenmetzg/woon-werkvervoer)
en heeft dezelfde vormgeving en werking.

De app staat online op https://steenmetzg.github.io/lijstjes/

## Starten op je computer

Je hebt [Node.js](https://nodejs.org) nodig (versie 20 of nieuwer). Open een terminal in deze map en typ:

```
npm install
npm run dev
```

Open daarna het adres dat verschijnt (meestal http://localhost:5173).

## Handige opdrachten

| Opdracht | Wat het doet |
|----------|--------------|
| `npm run dev` | Start de app om te bekijken en aan te werken. |
| `npm test` | Draait de automatische tests van alle acceptatiecriteria. |
| `npm run build` | Maakt de versie om online te zetten, in de map `dist`. |

## Op je telefoon

De app is een progressive web app. Open https://steenmetzg.github.io/lijstjes/ in Chrome en kies in het menu
(drie puntjes) **App installeren**, of tik op **Installeren** in de balk onderaan die de app zelf toont zolang hij nog
niet geïnstalleerd is. De app staat daarna tussen je andere apps en werkt ook zonder internet (behalve inspreken).

Elke wijziging op de branch `main` wordt automatisch getest en online gezet via GitHub Pages. De app haalt een nieuwe
versie op de achtergrond op; die is actief de volgende keer dat je de app opent.

Je lijstjes worden alleen op die telefoon bewaard. Maak daarom af en toe een backup via het tandwiel rechtsboven.

## Opbouw

- `src/App.tsx`: wisselt tussen de schermen en houdt de lijstjes bij
- `src/ListView.tsx`: het hoofdscherm met één lijstje: typen, inspreken, afvinken, weggooien, leegmaken
- `src/Lists.tsx`: het scherm Mijn lijstjes: maken, andere naam geven, weggooien met ongedaan maken
- `src/lists.ts`: de gegevens, bewaren en ophalen, dubbele items herkennen
- `src/speech.ts`: inspreken (het luisteren komt uit WoonWerk) en een zin opsplitsen in items
- `src/Settings.tsx`: het scherm Instellingen en backup
- `src/Info.tsx`: het scherm Over Lijstjes
- `src/installPrompt.ts`: de vraag om de app te installeren (uit WoonWerk)
- `src/backup.ts`, `src/files.ts` en `src/folderStore.ts`: backups maken, inlezen en de backupmap onthouden (uit WoonWerk)
- `src/ConfirmDialog.tsx`: de bevestigingsvraag in de app zelf (uit WoonWerk)
- `src/index.css`: de vormgeving
- `src/*.test.tsx`: de tests, per acceptatiecriterium
- `public/`: app-icoon en manifest voor het installeren
- `vite.config.ts`: bouwinstellingen, inclusief de service worker voor offline gebruik
