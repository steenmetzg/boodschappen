# Specificatie: Boodschappen

Status: **concept, ter goedkeuring door Greco**
Versie: 1.0 (6 november 2026): eerste versie, op basis van het plan "Plan Boodschappen PWA" en de werking en vormgeving van WoonWerk (app-versie Boodschappen 1.0.0)

## 1. Doel

Een eenvoudige webapp waarmee je snel boodschappen invoert die je moet halen, door ze te typen of in te spreken.
Een boodschap die je hebt, tik je met één tik weg; een heel lijstje maak je in één keer leeg. Je kunt meerdere lijstjes
met een eigen naam bijhouden, bijvoorbeeld "AH", "Markt" of "Bouwmarkt".
De app heeft dezelfde vormgeving en werking als WoonWerk. Greco gaat de app echt gebruiken, vooral op zijn telefoon.

## 2. Gebruiker

Eén persoon (Greco) die de app op zijn telefoon gebruikt, via een snelkoppeling op het beginscherm. Geen accounts of inlog.

## 3. Begrippen

- **Lijstje**: een verzameling boodschappen met een naam die je zelf kiest (maximaal 30 tekens). Twee lijstjes mogen
  niet dezelfde naam hebben (hoofdletters tellen niet mee). Maximaal 20 lijstjes.
- **Boodschap**: één regel tekst op een lijstje, bijvoorbeeld "melk" of "2 pakken koffie" (maximaal 60 tekens).
  Een aantal is gewoon deel van de tekst; er is geen apart veld voor aantal of categorie.
- **Weghalen**: een boodschap verdwijnt van het lijstje. Er is geen afgevinkte toestand: weg is weg, met de
  mogelijkheid om het direct ongedaan te maken (F7).
- **Huidig lijstje**: het lijstje dat je het laatst hebt geopend. De app opent daarmee.

## 4. Functies

| Nr | Functie | Omschrijving |
|----|---------|--------------|
| F1 | Lijstje tonen | Het hoofdscherm toont één lijstje: bovenaan de naam van het lijstje (de titel), daaronder de boodschappen onder elkaar in de volgorde waarin ze zijn toegevoegd (de nieuwste onderaan), met dunne lijnen ertussen. Bij openen is dat het huidige lijstje. Een leeg lijstje toont in grijs: "Nog niets op dit lijstje. Typ of spreek hieronder een boodschap in." |
| F2 | Wisselen van lijstje | Links van de titel staat een knop met een lijsticoon die het scherm "Lijstjes" opent (F9). Tik je daar op een lijstje, dan wordt dat het huidige lijstje en ga je terug naar het hoofdscherm. |
| F3 | Boodschap typen | Onderaan het hoofdscherm staat altijd een tekstveld "Boodschap toevoegen" met rechts een plusknop. Enter op het toetsenbord of de plusknop zet de tekst als boodschap onderaan het lijstje. Het veld wordt leeg en blijft geselecteerd (het toetsenbord blijft open), zodat je meteen de volgende typt. Spaties aan het begin en eind tellen niet mee; een leeg veld doet niets. |
| F4 | Meerdere tegelijk typen | Typ je een komma, dan wordt het meerdere boodschappen: "melk, brood, kaas" zet er drie op. |
| F5 | Dubbele boodschap | Staat een boodschap al op het lijstje (hoofdletters en spaties aan begin en eind tellen niet mee), dan komt hij er niet nog eens op. Onderaan staat dan kort de melding "Melk staat er al op". |
| F6 | Boodschap weghalen | Elke boodschap heeft links een rondje (aanraakgebied minstens 44 pixels). Tik je op het rondje, of veeg je de regel naar links, dan verdwijnt de boodschap van het lijstje. |
| F7 | Ongedaan maken | Na weghalen (F6) of leegmaken (F8) staat onderaan, boven het tekstveld, 5 seconden een melding, bijvoorbeeld "Melk weggehaald" of "7 boodschappen weggehaald", met de knop **Ongedaan maken**. Die zet de boodschappen terug op hun oude plek. Haal je in die 5 seconden nog iets weg, dan geldt de melding voor de laatste actie. |
| F8 | Lijstje leegmaken | Rechts in de titelbalk staat een knop met een prullenbakje "Lijstje leegmaken". Na de bevestigingsmelding "Lijstje AH leegmaken? Er staan 7 boodschappen op." met **Annuleren** en **Leegmaken** gaan alle boodschappen van dat lijstje weg. Het lijstje zelf blijft bestaan. Bij een leeg lijstje is de knop inactief. |
| F9 | Scherm Lijstjes | Het scherm "Lijstjes" toont al je lijstjes onder elkaar, in de volgorde waarin je ze hebt gemaakt, elk met de naam en rechts het aantal boodschappen in een lichtblauw rondje (zoals het label "vandaag" in WoonWerk). Het huidige lijstje heeft een blauwe streep links. Een knop "Terug" brengt je terug naar het hoofdscherm. |
| F10 | Lijstje maken | Onderaan het scherm Lijstjes staat de knop **Nieuw lijstje**. Die toont een tekstveld met de knoppen **Annuleren** en **Maken**. Na Maken wordt het nieuwe lijstje het huidige lijstje en ga je naar het hoofdscherm. Een lege naam of een naam die al bestaat, geeft een melding onder het veld ("Geef het lijstje een naam" of "Er is al een lijstje AH"). |
| F11 | Naam wijzigen | Bij elk lijstje op het scherm Lijstjes staat een potloodknop. Die maakt van de naam een tekstveld met **Annuleren** en **Bewaren**, met dezelfde controles als F10. |
| F12 | Lijstje verwijderen | Bij elk lijstje op het scherm Lijstjes staat een prullenbakknop. Een leeg lijstje gaat meteen weg. Staan er boodschappen op, dan eerst de bevestigingsmelding "Lijstje AH verwijderen? Er staan 7 boodschappen op." met **Annuleren** en **Verwijderen**. Verwijder je het huidige lijstje, dan wordt het eerste lijstje van de lijst het huidige. Het laatste lijstje kun je niet verwijderen (de knop is inactief); maak het leeg met F8 of geef het een andere naam. |
| F13 | Eerste keer | Een nieuwe installatie begint met één leeg lijstje "Boodschappen". |
| F14 | Onthouden | Alle lijstjes, boodschappen en het huidige lijstje blijven bewaard na verversen of het sluiten van de browser (opslag op de telefoon zelf). |
| F15 | Inspreken | Rechts naast het tekstveld (F3) staat een ronde, gevulde blauwe microfoonknop met een wit microfoonicoon, zoals in WoonWerk. Tik je erop, dan luistert de app (de knop wordt wit met een blauwe rand en boven het tekstveld staat "Luisteren… Zeg bijvoorbeeld: melk, brood en twee pakken koffie"). Wat je zegt, wordt opgesplitst bij "en", "komma" en pauzes die Chrome als komma schrijft, en elke boodschap komt op het huidige lijstje (met F5 voor dubbele). Daarna staat onderaan "Toegevoegd: melk, brood, twee pakken koffie" met de knop **Ongedaan maken**, die alleen die boodschappen weer weghaalt. De eerste letter van een boodschap wordt een kleine letter. Tik je tijdens het luisteren nog eens op de knop, dan stopt het luisteren. Foutmeldingen zoals in WoonWerk (geen internet, geen toestemming, niets gehoord). |
| F16 | Microfoon aan/uit | In de instellingen staat het onderdeel "Spraak" met één knop "Microfoon" (icoon met naam), zoals in WoonWerk F30. Standaard aan. Kan de browser geen spraak herkennen, dan is er nergens een microfoonknop. |
| F17 | Instellingen | Een tandwielknop rechtsboven op het hoofdscherm opent het scherm "Instellingen en backup". Een knop "Terug" brengt je terug. |
| F18 | Backupmap kiezen | Zoals WoonWerk F10: met de mappenkiezer van de telefoon kies je een map voor backups; de app onthoudt die map en toont de naam. |
| F19 | Backup maken | Zoals WoonWerk F11: de knop "Backup maken" slaat alle lijstjes op als één bestand, bijvoorbeeld `2026-11-06-boodschappen.json`. Zonder map gaat het bestand naar Downloads. |
| F20 | Backup inlezen | Zoals WoonWerk F12: de knop "Backup inlezen" opent de bestandskiezer; na de bevestigingsmelding "Backup inlezen?" met de datum van de backup vervangt de inhoud alle huidige lijstjes. |
| F21 | Informatie | Een knop met een i-icoon rechtsboven, links naast het tandwiel, opent het scherm "Over Boodschappen" met een korte uitleg van wat je met de app kunt, in de onderdelen: Wat doet Boodschappen?, Lijstjes, Inspreken (alleen als de browser spraak kent). |
| F22 | Installeren | Zoals WoonWerk F8: de app is een progressive web app die je kunt installeren en die schermvullend opent. |
| F23 | Vraag om te installeren | Zoals WoonWerk F18 en F19: zolang de app niet is geïnstalleerd, staat onderaan een balk "Boodschappen als app installeren?" met **Niet nu** en **Installeren**; na "Niet nu" komt de vraag na 30 dagen terug of via **Vraag weer tonen** in de instellingen. |
| F24 | Offline gebruiken | Na de eerste keer openen werkt de app zonder internet, behalve inspreken. |
| F25 | Updates | Zoals WoonWerk F14: een nieuwe versie wordt op de achtergrond opgehaald en is actief de volgende keer dat je de app opent. |
| F26 | Versienummer | Helemaal onderaan de instellingen staat "Versie: n.n.n" in kleine grijze tekst, uit `package.json`. |

## 5. Acceptatiecriteria

| Nr | Criterium |
|----|-----------|
| AC1 | Bij de eerste keer openen staat er één leeg lijstje "Boodschappen" met de grijze tekst voor een leeg lijstje (F1, F13). |
| AC2 | "melk" typen en Enter drukken zet "melk" onderaan het lijstje; het veld is daarna leeg en heeft de focus (F3). |
| AC3 | "melk, brood, kaas" typen zet drie boodschappen op het lijstje (F4). |
| AC4 | "Melk" toevoegen terwijl "melk" er al op staat, voegt niets toe en toont "Melk staat er al op" (F5). |
| AC5 | Tikken op het rondje van "melk" haalt hem weg; de melding "Melk weggehaald" verschijnt (F6, F7). |
| AC6 | Na weghalen zet **Ongedaan maken** de boodschap terug op dezelfde plek; na 5 seconden is de melding weg (F7). |
| AC7 | Leegmaken vraagt eerst om bevestiging; **Annuleren** laat alles staan, **Leegmaken** haalt alles weg en het lijstje blijft bestaan; **Ongedaan maken** zet alles terug (F7, F8). |
| AC8 | Een nieuw lijstje "AH" maken maakt het het huidige lijstje; een tweede "ah" geeft "Er is al een lijstje AH" (F10). |
| AC9 | De naam van een lijstje wijzigen werkt, met dezelfde controles als maken (F11). |
| AC10 | Een leeg lijstje verwijderen gaat zonder vraag; een lijstje met boodschappen pas na bevestiging; het laatste lijstje kan niet weg (F12). |
| AC11 | Op het scherm Lijstjes kiezen van een ander lijstje toont dat lijstje op het hoofdscherm (F2, F9). |
| AC12 | Na verversen staan alle lijstjes en boodschappen er nog en is hetzelfde lijstje open (F14). |
| AC13 | Inspreken van "melk en brood komma kaas" zet drie boodschappen op het huidige lijstje; **Ongedaan maken** haalt alleen die drie weer weg (F15). |
| AC14 | Staat de microfoon uit in de instellingen, of kent de browser geen spraak, dan is er geen microfoonknop (F16). |
| AC15 | Een backup maken en weer inlezen geeft precies dezelfde lijstjes en boodschappen terug; een ongeldig bestand geeft een melding en verandert niets (F19, F20). |
| AC16 | Alle sleutels in `localStorage` en de database voor de backupmap beginnen met `boodschappen-`, zodat de app nooit gegevens van WoonWerk leest of overschrijft (§8). |
| AC17 | De vraag om te installeren verschijnt niet als de app al geïnstalleerd is, en na "Niet nu" pas weer na 30 dagen (F23). |
| AC18 | Onderaan de instellingen staat het versienummer uit `package.json` (F26). |
| AC19 | Het hoofdscherm past op een telefoonscherm van 360 × 640 pixels zonder dat je zijwaarts moet scrollen, en het tekstveld blijft in beeld als het toetsenbord open is (§6). |

## 6. Ontwerp

Precies de stijl van WoonWerk (SPEC WoonWerk §6): strak, modern en minimalistisch.

- **Rustig en modern**: lichtgrijze achtergrond (`#f5f6f8`), witte vlakken en knoppen zonder rand met een smalle, zachte schaduw, donkergrijze tekst en één accentkleur (diep blauw). Geen animaties, alleen een subtiele overgang bij tikken en het wegschuiven bij vegen (F6).
- **Typografie**: het systeemlettertype van het apparaat, in twee groottes.
- **Iconen**: Lucide-lijniconen, zoals in WoonWerk. Het app-icoon is een winkelmandje in dezelfde lijnstijl en kleuren als het WoonWerk-icoon.
- **Indeling hoofdscherm**: bovenaan de lijstjesknop, de naam van het lijstje, en rechts de prullenbak, de informatieknop en het tandwiel. Daaronder de boodschappen in één wit vlak met dunne scheidingslijnen. Onderaan, vast in beeld, het tekstveld met plusknop en microfoon; daarboven de meldingen (F5, F7, F15) en eventueel de installatievraag (F23).
- **Meldingen en bevestigingen**: wit met een blauwe streep links, zoals in WoonWerk; geen vensters van de browser.
- **Mobiel eerst**: grote knoppen voor je duim (minstens 44 pixels hoog); op een groot scherm een smalle kolom in het midden.

## 7. Buiten scope (versie 1)

Afvinken en laten staan, aantallen of categorieën als apart veld, sorteren op winkelvolgorde, suggesties uit eerdere
boodschappen, delen of synchroniseren met een ander of tussen apparaten, accounts, foto's.

## 8. Techniek

- Dezelfde techniek als WoonWerk: **React** en **Vite**, **Vitest** en **React Testing Library**, **Lucide** (`lucide-react`) voor de iconen, gewone CSS, geen andere bibliotheken.
- Opslag via `localStorage`: de lijstjes onder `boodschappen-lijstjes` (een lijst van `{ id, naam, items: [{ id, tekst }] }`), het huidige lijstje onder `boodschappen-huidig`, de microfoon onder `boodschappen-spraak-aan` en "Niet nu" bij de installatievraag onder `boodschappen-installatievraag-later`. Let op: de gegevens staan alleen op die ene telefoon.
- Gedeelde opslag: WoonWerk en Boodschappen staan allebei op `steenmetzg.github.io` en delen daardoor de opslag van de browser. Daarom begint elke sleutel en de IndexedDB-database voor de backupmap met `boodschappen-` (AC16).
- Backupmap: via de File System Access API, zoals WoonWerk; de map wordt onthouden in IndexedDB (`boodschappen-backupmap`).
- Backupbestand: JSON met `app` (`"boodschappen"`), `versie` (1), `gemaakt` (datum en tijd), `lijstjes` (zoals in de opslag) en `huidig` (id van het huidige lijstje).
- Spraak: de spraakherkenning van Chrome (Web Speech API, `nl-NL`), zoals WoonWerk; alle code daarvoor in `src/speech.ts`. Werkt alleen met internet.
- Offline en installeren: **vite-plugin-pwa**, zoals WoonWerk.
- Online zetten: GitHub Pages via GitHub Actions bij elke wijziging op `main`, na het draaien van alle tests, op https://steenmetzg.github.io/boodschappen/.

## 9. Oplevering

- Broncode in de repository `steenmetzg/boodschappen`.
- Een `README.md` met uitleg hoe je de app start.
- Alle acceptatiecriteria hebben een geslaagde automatische test.
