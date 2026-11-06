# Specificatie: Lijstjes

Status: **goedgekeurd door Greco op 6 november 2026**
Versie: 1.3 (6 november 2026): Mijn lijstjes werkt net als een lijstje: de titel blijft bovenaan staan, de lijstjes staan in één wit vlak met als laatste regel een tekstveld voor een nieuw lijstje dat onderaan in beeld blijft, lipjes tonen hoeveel lijstjes boven en onder het scherm staan, en je verplaatst een lijstje met de greep; er is geen maximum meer aan het aantal lijstjes (was 20); de naam van een nieuw lijstje kun je inspreken (zonder te splitsen bij "komma"); een nieuwe naam typ je in de regel zelf; de bevestigingsvraag bij weggooien staat onderaan in beeld; de keuze bij het prullenbakje van een lijstje staat in de vaste titelbalk, zodat hij ook in beeld komt als je omlaag gescrold bent de informatie (tekst van Greco) vertelt dat je ook de volgorde van je lijstjes bepaalt en de naam van nieuwe lijstjes kunt inspreken (F8, F9, F10, F11, F12, F16, F21, F30, F31, AC7, AC8, AC23, AC24, §6; op verzoek van Greco, app-versie Lijstjes 1.3.0)
Versie 1.2.4 (6 november 2026): het woord "komma" wordt bij inspreken vaker herkend: ook als Chrome het als "comma", "koma" of "coma" schrijft, en de app kiest uit wat Chrome mogelijk verstaan heeft de versie met de meeste items (F15, AC13; op verzoek van Greco, app-versie Lijstjes 1.2.4)
Vorige versie: 1.2.3 (6 november 2026): na het verplaatsen van een item verscheen soms een lipje "↑ 1" of "↓ 1" terwijl alles in beeld stond; nu telt de app pas als de items op hun plek staan; sleep je een item tot bij de titel of de invoerregel, dan scrolt het lijstje mee, zodat je het ook naar plek 1 of helemaal onderaan kunt zetten als die buiten beeld staan (F28, F29, AC21, AC22; fout gemeld door Greco, app-versie Lijstjes 1.2.3)
Versie 1.2.2 (6 november 2026): de titelbalk van een lijstje blijft bovenaan staan; alleen de items scrollen (F1, F29, §6; op verzoek van Greco, app-versie Lijstjes 1.2.2)
Versie 1.2.1 (6 november 2026): je kunt per item niet meer dan 60 tekens typen of plakken, ook niet als je er meerdere met komma's typt; daarvoor viel de rest ongemerkt weg; bij een vol scherm schuift het lijstje omhoog als je een item toevoegt, zodat je het nieuwe item onderaan ziet; inspreken splitst alleen nog bij "komma", niet meer bij "en"; de informatie vertelt wát Lijstjes kan in plaats van hoe je iets doet (F3, F4, F15, F21, F29, AC3, AC13, AC22; fouten en wensen van Greco, app-versie Lijstjes 1.2.1)
Versie 1.2 (6 november 2026): de invoerregel staat als laatste regel in het lijstje, zonder plusknop en met rechts een kleine microfoon; tik op de tekst van een item om hem aan te passen; items verplaats je door ze vast te pakken en te verschuiven; bij een lang lijstje blijft de invoerregel onderaan in beeld en toont een lipje in de grijze scheidingslijn met een blauw pijltje en getal hoeveel items er boven en onder het scherm staan (F1, F3, F6, F15, F27, F28, F29; op verzoek van Greco, app-versie Lijstjes 1.2.0)
Versie 1.1 (6 november 2026): het scherm Mijn lijstjes is het hoofdscherm, met de informatieknop en het tandwiel; een lijstje open je door erop te tikken en met Terug ga je weer naar Mijn lijstjes; de app start in het laatst gebruikte lijstje; een lijstje met items weggooien vraagt eerst om bevestiging, zoals een rubriek in WoonWerk (F1, F2, F9, F12, F17, F21, F23; op verzoek van Greco, app-versie Lijstjes 1.1.0)
Versie 1.0 (6 november 2026): eerste versie; items kun je afvinken (ze blijven doorgestreept op hun plek staan) en weggooien (zonder bevestiging of ongedaan maken), een heel lijstje weggooien kun je wel ongedaan maken (op verzoek van Greco), op basis van het plan "Plan Lijstjes PWA" en de werking en vormgeving van WoonWerk; de app heet Lijstjes (op verzoek van Greco, eerder "Boodschappen"; app-versie Lijstjes 1.0.0)

## 1. Doel

Een eenvoudige webapp waarmee je snel lijstjes maakt, door items te typen of in te spreken: items, klusjes,
dingen om in te pakken of wat je maar wilt. Een item vink je met één tik af of gooi je weg; een heel lijstje maak je in
één keer leeg. Je kunt meerdere lijstjes met een eigen naam bijhouden, bijvoorbeeld "AH", "Klussen" of "Vakantie".
De app heeft dezelfde vormgeving en werking als WoonWerk. Greco gaat de app echt gebruiken, vooral op zijn telefoon.

## 2. Gebruiker

Eén persoon (Greco) die de app op zijn telefoon gebruikt, via een snelkoppeling op het beginscherm. Geen accounts of inlog.

## 3. Begrippen

- **Lijstje**: een verzameling items met een naam die je zelf kiest (maximaal 30 tekens). Twee lijstjes mogen
  niet dezelfde naam hebben (hoofdletters tellen niet mee). Je kunt zoveel lijstjes maken als je wilt.
- **Item**: één regel tekst op een lijstje, bijvoorbeeld "melk" of "2 pakken koffie" (maximaal 60 tekens).
  Een aantal is gewoon deel van de tekst; er is geen apart veld voor aantal of categorie.
- **Afvinken**: een item dat klaar is (gekocht, gedaan, ingepakt), vink je af. Het blijft op het lijstje staan,
  doorgestreept op dezelfde plek, tot je het weer aanvinkt of weggooit.
- **Weggooien**: een item verdwijnt meteen van het lijstje, zonder bevestiging en zonder ongedaan maken.
- **Huidig lijstje**: het lijstje dat je het laatst hebt geopend. De app start daarmee (F1).
- **Mijn lijstjes**: het hoofdscherm met al je lijstjes (F9). Vanaf hier open je een lijstje.

## 4. Functies

| Nr | Functie | Omschrijving |
|----|---------|--------------|
| F1 | Lijstje tonen | Het scherm van een lijstje toont: bovenaan de naam van het lijstje (de titel), die bij scrollen op zijn plek blijft staan, daaronder de items onder elkaar in de volgorde waarin ze zijn toegevoegd (de nieuwste onderaan) of waarin je ze hebt gezet (F28), met dunne lijnen ertussen. De laatste regel is de invoerregel (F3). Afgevinkte items (F6) blijven op hun plek staan, doorgestreept. Start je de app, dan opent hij met het huidige lijstje (het lijstje dat je het laatst gebruikte); is er nog nooit een lijstje geopend, dan start de app met Mijn lijstjes (F9). Een leeg lijstje toont alleen de invoerregel. |
| F2 | Wisselen van lijstje | Links van de titel van een lijstje staat de terugknop (pijltje, zoals in WoonWerk) naar Mijn lijstjes (F9). Tik je daar op een lijstje, dan opent het scherm van dat lijstje en wordt het het huidige lijstje. |
| F3 | Item typen | De laatste regel van het lijstje is de invoerregel. Die ziet eruit als een item: links een gestippeld rondje dat (nog) niets doet, dan het tekstveld "Item toevoegen" en helemaal rechts, waar bij een item het kruisje staat, een kleine microfoon (F15). Er is geen plusknop. Past het lijstje niet op het scherm, dan blijft de invoerregel onderaan in beeld staan en schuiven de items erachter langs (F29) Voeg je dan een item toe (getypt of ingesproken), dan schuift het lijstje omhoog, zodat het nieuwe item net boven de invoerregel te zien is; bovenaan verschijnt dan het lipje (F29). Enter op het toetsenbord zet de tekst als item onderaan het lijstje. Het veld wordt leeg en blijft geselecteerd (het toetsenbord blijft open), en in beeld, zodat je meteen de volgende typt. Spaties aan het begin en eind tellen niet mee; een leeg veld doet niets. Per item kun je niet meer dan 60 tekens typen of plakken: wat je meer typt, verschijnt niet in het veld (F4 voor meerdere items). |
| F4 | Meerdere tegelijk typen | Typ je een komma, dan wordt het meerdere items: "melk, brood, kaas" zet er drie op. Elk van die items mag 60 tekens hebben. |
| F5 | Dubbel item | Staat een item al op het lijstje (hoofdletters en spaties aan begin en eind tellen niet mee), dan komt het er niet nog eens op. Onderaan staat dan kort de melding "Melk staat er al op". Is dat item afgevinkt, dan wordt het weer aangevinkt op dezelfde plek, met de melding "Melk staat weer op je lijstje". |
| F6 | Afvinken | Elk item heeft links een rondje (aanraakgebied minstens 44 pixels). Tik je op het rondje, dan wordt het rondje blauw met een wit vinkje, de tekst grijs en doorgestreept. Het item blijft op zijn plek staan en schuift niet naar onderen. Nog eens tikken vinkt het weer aan, ook op dezelfde plek. |
| F7 | Item weggooien | Elk item heeft rechts een klein kruisje "Weggooien" (aanraakgebied minstens 44 pixels). Tik je erop, of veeg je de regel naar links, dan is het item meteen weg: geen bevestiging en geen ongedaan maken. Dit werkt voor open en afgevinkte items. |
| F8 | Lijstje leegmaken | Rechts in de titelbalk staat een knop met een prullenbakje. Die opent een kleine keuze met **Afgevinkte weggooien** (gooit alle afgevinkte items weg) en **Alles weggooien** (gooit alle items weg), en **Annuleren**. De keuze staat in de vaste titelbalk (F29), direct onder de titel, zodat je hem ook ziet als je in een lang lijstje omlaag gescrold bent. Het lijstje zelf blijft bestaan. Er is geen bevestiging en geen ongedaan maken, net als bij F7. Een keuze waarvoor niets op het lijstje staat, is inactief; bij een leeg lijstje is de prullenbakknop inactief. |
| F9 | Scherm Mijn lijstjes | Het hoofdscherm "Mijn lijstjes" toont al je lijstjes onder elkaar in één wit vlak met dunne scheidingslijnen, net als de items van een lijstje, in de volgorde waarin je ze hebt gemaakt (of verplaatst, F30), elk met links de greep, de naam en rechts het aantal open (niet afgevinkte) items in een lichtblauw rondje (zoals het label "vandaag" in WoonWerk). Het huidige lijstje heeft een blauwe streep links. Rechtsboven staan de informatieknop (F21) en het tandwiel (F17); de titelbalk blijft bovenaan staan als je scrolt. Er is geen terugknop: dit is het eerste scherm. |
| F10 | Lijstje maken | De laatste regel van Mijn lijstjes is een tekstveld "Nieuw lijstje", net als de invoerregel van een lijstje (F3); bij veel lijstjes blijft die onderaan in beeld. Typ een naam en druk op Enter: het nieuwe lijstje opent meteen en wordt het huidige lijstje. Een lege naam of een naam die al bestaat, geeft onderaan een melding ("Geef het lijstje een naam" of "Er is al een lijstje AH"). |
| F11 | Naam wijzigen | Bij elk lijstje op het scherm Mijn lijstjes staat een potloodknop. Die maakt van de naam een tekstveld in de regel zelf, zoals bij een item (F27). Enter of ergens anders tikken bewaart de nieuwe naam, Escape laat de naam zoals hij was. Dezelfde controles als F10: bij Enter blijft het veld dan open met de melding onderaan, en ergens anders tikken laat de oude naam staan. |
| F12 | Lijstje weggooien | Bij elk lijstje op het scherm Mijn lijstjes staat een prullenbakknop. Is het lijstje leeg, dan is het meteen weg. Staan er items op (ook afgevinkte), dan eerst de bevestigingsvraag in de app, zoals bij een rubriek in WoonWerk: titel "Dit lijstje bevat items", tekst "AH heeft 7 items. Lijstje en items weggooien?", met **Annuleren** en **Weggooien**, onderaan in beeld. Na het weggooien staat onderaan het scherm staat dan 10 seconden de melding "Lijstje AH weggegooid" met de knop **Ongedaan maken**, die het lijstje met al zijn items terugzet op zijn oude plek (en weer het huidige lijstje maakt als het dat was). Gooi je in die 10 seconden nog een lijstje weg, dan geldt de melding voor het laatste. Ga je naar een ander scherm, dan verdwijnt de melding en is het weggooien definitief. Gooi je het huidige lijstje weg, dan wordt het eerste lijstje van de lijst het huidige. Het laatste lijstje kun je niet weggooien (de knop is inactief); maak het leeg met F8 of geef het een andere naam. |
| F13 | Eerste keer | Een nieuwe installatie begint met één leeg lijstje "Mijn 1e lijstje". |
| F14 | Onthouden | Alle lijstjes, items en het huidige lijstje blijven bewaard na verversen of het sluiten van de browser (opslag op de telefoon zelf). |
| F15 | Inspreken | Rechts op de invoerregel (F3) staat een kleine ronde, gevulde blauwe microfoonknop met een wit microfoonicoon, zoals in WoonWerk maar kleiner, zodat hij op de regel past. Tik je erop, dan luistert de app (de knop wordt wit met een blauwe rand en onderaan het scherm staat "Luisteren… Zeg bijvoorbeeld: melk komma brood komma twee pakken koffie"). Wat je zegt, wordt opgesplitst bij het woord "komma" (ook als Chrome het als "comma", "koma" of "coma" schrijft) en bij pauzes die Chrome als komma schrijft; Chrome geeft tot drie mogelijke versies van wat het verstond, en de app neemt de versie met de meeste items, maar niet bij "en", zodat "Jan en Piet ophalen van Schiphol" één item blijft; en elk item komt op het huidige lijstje (met F5 voor dubbele). Daarna staat onderaan kort "Toegevoegd: melk, brood, twee pakken koffie". Is er iets verkeerd verstaan, dan gooi je dat item weg met F7. De eerste letter van een item wordt een kleine letter. Tik je tijdens het luisteren nog eens op de knop, dan stopt het luisteren. Foutmeldingen zoals in WoonWerk (geen internet, geen toestemming, niets gehoord). |
| F16 | Microfoon aan/uit | In de instellingen staat het onderdeel "Spraak" met één knop "Microfoon" (icoon met naam), zoals in WoonWerk F30. Standaard aan. Kan de browser geen spraak herkennen, dan is er nergens een microfoonknop. |
| F17 | Instellingen | Een tandwielknop rechtsboven op Mijn lijstjes opent het scherm "Instellingen en backup". Een knop "Terug" brengt je terug naar Mijn lijstjes. |
| F18 | Backupmap kiezen | Zoals WoonWerk F10: met de mappenkiezer van de telefoon kies je een map voor backups; de app onthoudt die map en toont de naam. |
| F19 | Backup maken | Zoals WoonWerk F11: de knop "Backup maken" slaat alle lijstjes op als één bestand, bijvoorbeeld `2026-11-06-lijstjes.json`. Zonder map gaat het bestand naar Downloads. |
| F20 | Backup inlezen | Zoals WoonWerk F12: de knop "Backup inlezen" opent de bestandskiezer; na de bevestigingsmelding "Backup inlezen?" met de datum van de backup vervangt de inhoud alle huidige lijstjes. |
| F21 | Informatie | Een knop met een i-icoon rechtsboven op Mijn lijstjes, links naast het tandwiel, opent het scherm "Over Lijstjes" met een korte uitleg van wát de app kan (niet hoe je iets doet), in de onderdelen: Wat doet Lijstjes?, Mijn lijstjes, Inspreken (alleen als de browser spraak kent) en Instellingen (de zin over spraak alleen als de browser spraak kent); de tekst is door Greco geschreven. |
| F22 | Installeren | Zoals WoonWerk F8: de app is een progressive web app die je kunt installeren en die schermvullend opent. |
| F23 | Vraag om te installeren | Zoals WoonWerk F18 en F19: zolang de app niet is geïnstalleerd, staat onderaan Mijn lijstjes een balk "Lijstjes als app installeren?" met **Niet nu** en **Installeren**; na "Niet nu" komt de vraag na 30 dagen terug of via **Vraag weer tonen** in de instellingen. |
| F24 | Offline gebruiken | Na de eerste keer openen werkt de app zonder internet, behalve inspreken. |
| F25 | Updates | Zoals WoonWerk F14: een nieuwe versie wordt op de achtergrond opgehaald en is actief de volgende keer dat je de app opent. |
| F26 | Versienummer | Helemaal onderaan de instellingen staat "Versie: n.n.n" in kleine grijze tekst, uit `package.json`. |
| F27 | Item aanpassen | Tik je op de tekst van een item (open of afgevinkt), dan wordt de tekst een tekstveld met de tekst erin en gaat het toetsenbord open. Enter of ergens anders tikken bewaart de nieuwe tekst; het item blijft op zijn plek en blijft afgevinkt of open. Escape laat de tekst zoals hij was. Een lege tekst laat het item zoals het was. Staat de nieuwe tekst al als ander item op het lijstje, dan blijft de oude tekst staan met de melding "Brood staat er al op" (F5). Een komma maakt hier geen twee items. |
| F28 | Items verplaatsen | Links op elke regel staat een greep (zes puntjes). Pak je die vast en schuif je omhoog of omlaag, dan schuift het item mee en maken de andere items plaats; laat je los, dan staat het item op die plek. Ook met het toetsenbord: de greep met pijltje omhoog of omlaag. De invoerregel blijft altijd de laatste regel. Sleep je een item tot bij de titel of de invoerregel, dan scrolt het lijstje mee (sneller naarmate je dichter bij de rand komt), zodat je het ook naar een plek buiten beeld kunt verplaatsen. |
| F29 | Items buiten beeld | Past het lijstje niet op het scherm, dan kun je gewoon scrollen. Staan er items boven het scherm, dan is direct onder de titelbalk de bovenrand van het lijstje een grijze scheidingslijn met in het midden een wit lipje naar boven, met daarin een blauw pijltje omhoog en het aantal in blauw, bijvoorbeeld "↑ 3". Staan er items onder de invoerregel, dan heeft de grijze scheidingslijn boven de invoerregel net zo'n lipje naar beneden, bijvoorbeeld "↓ 2". Tik je op een lipje, dan schuift het lijstje een flink stuk die kant op. Een item telt als buiten beeld als minder dan de helft te zien is. |
| F30 | Mijn lijstjes zoals een lijstje | Mijn lijstjes werkt net als een lijstje: de titelbalk blijft bovenaan staan (F1), de regel voor een nieuw lijstje blijft onderaan in beeld (F10), lipjes tonen hoeveel lijstjes boven en onder het scherm staan, bijvoorbeeld "↑ 3" (F29), en een nieuw lijstje schuift in beeld. Met de greep links verplaats je een lijstje, ook met de pijltjestoetsen en met meescrollen bij de rand (F28). De volgorde wordt onthouden. |
| F31 | Naam inspreken | Rechts op de regel "Nieuw lijstje" (F10) staat dezelfde kleine microfoonknop als op een lijstje (F15). Tik je erop, dan luistert de app (onderaan "Luisteren… Zeg de naam van het nieuwe lijstje"). Wat je zegt, wordt in zijn geheel de naam, ook als je "komma" of "en" zegt; zonder punt aan het eind, met een hoofdletter en hoogstens 30 tekens. Het nieuwe lijstje opent meteen, net als bij F10. Bestaat de naam al, dan staat onderaan de melding ("Er is al een lijstje AH") en wordt er niets gemaakt. Staat de microfoon uit (F16), dan is er geen knop. |

## 5. Acceptatiecriteria

| Nr | Criterium |
|----|-----------|
| AC1 | Bij de eerste keer openen start de app met Mijn lijstjes, met één leeg lijstje "Mijn 1e lijstje"; tik je erop, dan zie je een lijstje met alleen de invoerregel (F1, F3, F9, F13). |
| AC2 | De invoerregel is de laatste regel van het lijstje, zonder plusknop en met rechts de microfoon. "melk" typen en Enter drukken zet "melk" onderaan het lijstje, boven de invoerregel; het veld is daarna leeg en heeft de focus (F3, F15). |
| AC3 | "melk, brood, kaas" typen zet drie items op het lijstje; per item kun je niet meer dan 60 tekens typen of plakken, ook na een komma (F3, F4). |
| AC4 | "Melk" toevoegen terwijl "melk" er al op staat, voegt niets toe en toont "Melk staat er al op" (F5). |
| AC5 | Tikken op het rondje van "melk" vinkt het af: doorgestreept en op dezelfde plek in het lijstje; nog eens tikken maakt het weer gewoon, ook op dezelfde plek. "Melk" toevoegen terwijl "melk" is afgevinkt, vinkt het weer aan (F5, F6). |
| AC6 | Tikken op het kruisje van "melk" gooit het meteen weg, zonder vraag of melding om ongedaan te maken (F7). |
| AC7 | **Afgevinkte weggooien** gooit alleen de afgevinkte items weg; **Alles weggooien** gooit alles weg en het lijstje blijft bestaan; **Annuleren** laat alles staan. De keuze staat in de titelbalk, zodat hij ook in beeld is als het lijstje omlaag gescrold is (F8). |
| AC8 | "AH" typen in de onderste regel "Nieuw lijstje" en Enter maakt een nieuw lijstje en maakt het het huidige lijstje; een tweede "ah" geeft "Er is al een lijstje AH" (F10). |
| AC9 | De naam van een lijstje wijzigen werkt, met dezelfde controles als maken (F11). |
| AC10 | Een leeg lijstje weggooien gaat zonder vraag; een lijstje met items pas na de vraag "Dit lijstje bevat items" (Annuleren laat het staan); **Ongedaan maken** zet het met alle items terug op dezelfde plek; na 10 seconden is de melding weg en het lijstje definitief weg; het laatste lijstje kan niet weg (F12). |
| AC11 | Tikken op een lijstje op Mijn lijstjes opent dat lijstje; Terug brengt je naar Mijn lijstjes; na opnieuw starten opent de app met het laatst geopende lijstje (F1, F2, F9). |
| AC12 | Na verversen staan alle lijstjes en items er nog en is hetzelfde lijstje open (F14). |
| AC13 | Inspreken van "melk komma brood komma kaas" zet drie items op het huidige lijstje; "Jan en Piet ophalen van Schiphol" wordt één item (F15). |
| AC14 | Staat de microfoon uit in de instellingen, of kent de browser geen spraak, dan is er geen microfoonknop (F16). |
| AC15 | Een backup maken en weer inlezen geeft precies dezelfde lijstjes en items terug; een ongeldig bestand geeft een melding en verandert niets (F19, F20). |
| AC16 | Alle sleutels in `localStorage` en de database voor de backupmap beginnen met `lijstjes-`, zodat de app nooit gegevens van WoonWerk leest of overschrijft (§8). |
| AC17 | De vraag om te installeren verschijnt niet als de app al geïnstalleerd is, en na "Niet nu" pas weer na 30 dagen (F23). |
| AC18 | Onderaan de instellingen staat het versienummer uit `package.json` (F26). |
| AC19 | Elk scherm past op een telefoonscherm van 360 × 640 pixels zonder dat je zijwaarts moet scrollen, en het tekstveld blijft in beeld als het toetsenbord open is (§6). |
| AC20 | Tikken op de tekst "melk" maakt er een tekstveld van; "halfvolle melk" en Enter bewaart dat op dezelfde plek; Escape of een lege tekst verandert niets; "Brood" terwijl "brood" er al op staat, geeft "Brood staat er al op". Het rondje vinkt af en het kruisje gooit weg, zoals voorheen (F6, F7, F27). |
| AC21 | "melk" aan de greep naar beneden slepen tot voorbij "brood" zet het onder "brood"; met de pijltjestoetsen op de greep werkt het ook; slepen tot bij de titel of de invoerregel scrolt het lijstje mee; een afgevinkt item blijft afgevinkt (F28). |
| AC22 | Bij een lijstje dat niet op het scherm past, blijft de invoerregel onderaan in beeld; met 2 items boven het scherm en 1 onder de invoerregel staan er de lipjes "↑ 2" (naar boven) en "↓ 1" (naar beneden) in de scheidingslijnen, en tikken scrolt die kant op; een nieuw item schuift het lijstje omhoog tot het net boven de invoerregel te zien is; als alles in beeld is, zijn er geen lijnen of lipjes (F29). |
| AC23 | Op Mijn lijstjes zet "AH" aan de greep onder "Klussen" slepen het daar neer, ook na opnieuw openen; de pijltjestoetsen op de greep werken ook; met 2 lijstjes boven het scherm en 1 onder de invoerregel staan de lipjes "↑ 2" en "↓ 1"; de vraag "Dit lijstje bevat items" staat onderaan in beeld (F12, F30). |
| AC24 | Op Mijn lijstjes "verjaardag Anne" inspreken maakt en opent het lijstje "Verjaardag Anne"; "komma" splitst de naam niet; "ah" inspreken terwijl er al een lijstje AH is, geeft "Er is al een lijstje AH"; met de microfoon uit is er geen knop (F16, F31). |

## 6. Ontwerp

Precies de stijl van WoonWerk (SPEC WoonWerk §6): strak, modern en minimalistisch.

- **Rustig en modern**: lichtgrijze achtergrond (`#f5f6f8`), witte vlakken en knoppen zonder rand met een smalle, zachte schaduw, donkergrijze tekst en één accentkleur (diep blauw). Geen animaties, alleen een subtiele overgang bij tikken, het wegschuiven bij vegen (F7) en het opzij schuiven bij verplaatsen (F28).
- **Typografie**: het systeemlettertype van het apparaat, in twee groottes.
- **Iconen**: Lucide-lijniconen, zoals in WoonWerk. Het app-icoon is een lijstje met vinkjes in dezelfde lijnstijl en kleuren als het WoonWerk-icoon.
- **Indeling Mijn lijstjes** (hoofdscherm): bovenaan de titel "Mijn lijstjes" met rechts de informatieknop en het tandwiel, de titelbalk vast in beeld. Daaronder de lijstjes in één wit vlak met dunne scheidingslijnen, zoals de items van een lijstje. Elke regel: links de greep, de naam met het aantal open items, rechts het potlood en de prullenbak. De laatste regel is het tekstveld Nieuw lijstje met rechts een kleine microfoon (F31); bij veel lijstjes blijft die onderaan in beeld, met lipjes voor lijstjes boven en onder het scherm (F30). Onderaan eventueel de installatievraag (F23) en de melding na het weggooien van een lijstje (F12).
- **Indeling van een lijstje**: bovenaan, vast in beeld, de terugknop, de naam van het lijstje en rechts de prullenbak. Daaronder de items in één wit vlak met dunne scheidingslijnen. Elke regel: links de greep (F28), het rondje (F6), de tekst (F27) en rechts het kruisje (F7). De laatste regel is de invoerregel met het tekstveld en rechts een kleine microfoon (F3, F15); bij een lang lijstje blijft die onderaan in beeld, met pijltjes voor items boven en onder het scherm (F29). Onderaan, vast in beeld, de meldingen (F5, F15).
- **Meldingen en bevestigingen**: wit met een blauwe streep links, zoals in WoonWerk; geen vensters van de browser.
- **Mobiel eerst**: grote knoppen voor je duim (minstens 44 pixels hoog); op een groot scherm een smalle kolom in het midden.

## 7. Buiten scope (versie 1)

Aantallen of categorieën als apart veld, automatisch sorteren, suggesties uit eerdere
items, delen of synchroniseren met een ander of tussen apparaten, accounts, foto's.

## 8. Techniek

- Dezelfde techniek als WoonWerk: **React** en **Vite**, **Vitest** en **React Testing Library**, **Lucide** (`lucide-react`) voor de iconen, gewone CSS, geen andere bibliotheken.
- Opslag via `localStorage`: de lijstjes onder `lijstjes-data` (een lijst van `{ id, naam, items: [{ id, tekst, af }] }`, waarbij `af` aangeeft of het item is afgevinkt), het huidige lijstje onder `lijstjes-huidig`, de microfoon onder `lijstjes-spraak-aan` en "Niet nu" bij de installatievraag onder `lijstjes-installatievraag-later`. Let op: de gegevens staan alleen op die ene telefoon.
- Gedeelde opslag: WoonWerk en Lijstjes staan allebei op `steenmetzg.github.io` en delen daardoor de opslag van de browser. Daarom begint elke sleutel en de IndexedDB-database voor de backupmap met `lijstjes-` (AC16).
- Backupmap: via de File System Access API, zoals WoonWerk; de map wordt onthouden in IndexedDB (`lijstjes-backupmap`).
- Backupbestand: JSON met `app` (`"lijstjes"`), `versie` (1), `gemaakt` (datum en tijd), `lijstjes` (zoals in de opslag) en `huidig` (id van het huidige lijstje).
- Spraak: de spraakherkenning van Chrome (Web Speech API, `nl-NL`), zoals WoonWerk; alle code daarvoor in `src/speech.ts`. Werkt alleen met internet.
- Offline en installeren: **vite-plugin-pwa**, zoals WoonWerk.
- Online zetten: GitHub Pages via GitHub Actions bij elke wijziging op `main`, na het draaien van alle tests, op https://steenmetzg.github.io/lijstjes/.

## 9. Oplevering

- Broncode in de repository `steenmetzg/lijstjes`.
- Een `README.md` met uitleg hoe je de app start.
- Alle acceptatiecriteria hebben een geslaagde automatische test.
