// English language pack.
// Keys are the original German texts – see js/i18n.js for why.
// A new language: copy this file, translate the right-hand side, register it
// in i18n.js. Missing entries simply fall back to German.

export const en = {
  // ---------------------------------------------------------------- Navigation
  Heute: 'Today',
  Kalender: 'Calendar',
  Völker: 'Colonies',
  Tracht: 'Forage',
  Mehr: 'More',
  Volk: 'Colony',
  Diagnose: 'Diagnostics',
  Über: 'About',
  Hilfe: 'Help',
  Daten: 'Data',
  Berichte: 'Reports',
  Sprache: 'Language',
  Benachrichtigungen: 'Notifications',
  Historie: 'History',
  Verlauf: 'Timeline',
  Anstehend: 'Coming up',
  Bienenstände: 'Apiaries',
  'Völker verwalten': 'Manage colonies',
  Aufgabenkatalog: 'Task catalogue',
  'Als App installieren': 'Install as an app',
  'Abgleich zwischen Geräten': 'Sync between devices',

  // ------------------------------------------------------------------ Zustände
  überfällig: 'overdue',
  'jetzt fällig': 'due now',
  'in Kürze': 'coming up',
  Überfällig: 'Overdue',
  'Jetzt fällig': 'Due now',
  'Die nächsten drei Wochen': 'The next three weeks',
  'Wartet auf eine Vorarbeit': 'Waiting on earlier work',
  'Kurze Rückfrage zur Tracht': 'A quick question about the forage',
  wichtig: 'important',
  automatisch: 'automatic',
  'Nichts zu tun. Alles im Plan.': 'Nothing to do. All on track.',
  'In dieser Kategorie ist nichts offen.': 'Nothing open in this category.',
  Alle: 'All',

  // ------------------------------------------------------------- Kategorien
  Frühjahr: 'Spring',
  Schwarm: 'Swarming',
  Honig: 'Honey',
  Varroa: 'Varroa',
  Einwinterung: 'Wintering',
  Betrieb: 'Operations',
  Eigene: 'Own',

  // -------------------------------------------------------- Aufgabentitel
  'Stand kontrollieren, Flugloch frei räumen': 'Check the apiary, clear the entrance',
  'Futtervorrat prüfen (anheben oder wiegen)': 'Check stores (heft or weigh)',
  'Reinigungsflug beobachten': 'Watch for the cleansing flight',
  'Erste Durchsicht: Futter, Brut, Weiselrichtigkeit':
    'First inspection: stores, brood, queenrightness',
  'Boden reinigen, alte Waben entnehmen': 'Clean the floor, remove old combs',
  'Erweitern: Zarge aufsetzen': 'Expand: add a box',
  'Baurahmen geben': 'Insert the drone frame',
  'Schwarmkontrolle – Weiselzellen brechen': 'Swarm inspection – remove queen cells',
  Schwarmkontrolle: 'Swarm inspection',
  'Ableger oder Kunstschwarm bilden': 'Make a nucleus colony or artificial swarm',
  'Honigraum aufsetzen (mit Absperrgitter)': 'Add the honey super (with queen excluder)',
  'Frühtracht ernten und schleudern': 'Harvest and extract the spring flow',
  'Sommertracht ernten → LETZTE ERNTE': 'Harvest the summer flow → LAST HARVEST',
  'Rühren, abfüllen, etikettieren': 'Stir, jar and label',
  'Drohnenbrut schneiden': 'Cut out drone brood',
  'Varroa-Befall messen (Gemülldiagnose)': 'Measure varroa levels (natural mite drop)',
  'Sommerbehandlung 1 – Ameisensäure': 'Summer treatment 1 – formic acid',
  'Sommerbehandlung 2 – Ameisensäure': 'Summer treatment 2 – formic acid',
  'Behandlungserfolg kontrollieren': 'Check treatment success',
  'Restentmilbung mit Oxalsäure': 'Winter treatment with oxalic acid',
  'Auffüttern beginnen': 'Start feeding for winter',
  'Auffütterung abschließen': 'Finish feeding for winter',
  'Wintersitz prüfen, schwache Völker vereinigen':
    'Check the winter cluster, unite weak colonies',
  'Mäusegitter, Fluglochkeil, Specht- und Sturmschutz':
    'Mouse guard, entrance reducer, woodpecker and storm protection',
  'Werkstatt: Wachs schmelzen, Rähmchen, Beuten': 'Workshop: render wax, frames, hives',
  'Völker melden, bestellen, Jahr planen': 'Register colonies, order supplies, plan the year',
  'Varroa: Befall über der Schwelle – jetzt behandeln':
    'Varroa: infestation above threshold – treat now',
  'Varroa: Behandlungserfolg zu gering – nachbehandeln':
    'Varroa: treatment not effective enough – treat again',
  'Weiselzustand klären – Volk ohne Königin': 'Resolve queen status – colony without a queen',
  'Schwarmstimmung – in wenigen Tagen nachschauen':
    'Swarm preparations – check again in a few days',
  'Futter knapp – nachfüttern': 'Stores running low – feed',

  // --------------------------------------------------------- Aufgabentexte
  'Nicht öffnen. Nur Flugloch frei machen, Beute auf Sturm- und Spechtschäden ansehen, kurz an die Zarge klopfen.':
    'Do not open. Just clear the entrance, look the hive over for storm and woodpecker damage, '
    + 'and give the box a short knock.',
  'Hinten anheben. Wird es leicht, im Spätwinter Futterteig direkt über den Sitz legen – nicht Zuckerwasser.':
    'Heft the back. If it feels light, place fondant directly above the cluster in late winter – '
    + 'not syrup.',
  'Der erste warme Tag zeigt ohne Eingriff, welches Volk lebt. Flugbild je Volk notieren.':
    'The first warm day shows you which colonies are alive without opening anything. Note the '
    + 'flight pattern of each colony.',
  'Kurz und zügig, höchstens fünf Minuten. Ziel: lebt die Königin, ist Brut in allen Stadien da, reicht das Futter?':
    'Short and brisk, five minutes at most. The questions: is the queen alive, is there brood in '
    + 'all stages, are the stores sufficient?',
  'Dunkle Waben aus dem Randbereich raus. Beim selben Eingriff wie das erste Erweitern.':
    'Take dark combs out of the outer positions. Do it during the same visit as the first expansion.',
  'Auslöser: 7–8 Waben dicht besetzt und der Löwenzahn beginnt. Lieber eine Woche zu früh als zu spät – Enge erzeugt Schwarmstimmung.':
    'Trigger: 7–8 combs densely covered and dandelion starting. Better a week early than a week '
    + 'late – crowding brings on swarming.',
  'Der Baurahmen ist Wachsbau, Schwarmbremse und Varroafalle in einem.':
    'The drone frame is fresh comb building, a brake on swarming and a varroa trap in one.',
  'Alle 7 bis 9 Tage, lückenlos. Neun Tage ist die Obergrenze: danach kann eine übersehene Zelle bereits verdeckelt sein und das Volk zieht ab.':
    'Every 7 to 9 days, without gaps. Nine days is the limit: after that a missed cell may already '
    + 'be capped and the colony leaves.',
  'Aus der Schwarmstimmung heraus. Den brutfreien Ableger sofort mit Oxalsäure behandeln – die einzige Gelegenheit im Sommer.':
    'Take it out of swarm preparations. Treat the broodless nucleus with oxalic acid straight away – '
    + 'the only chance to do so in summer.',
  'Zum Blühbeginn der ersten Massentracht. Zweiter Honigraum, sobald der erste zu zwei Dritteln gefüllt ist.':
    'At the start of the first main flow. Add a second super as soon as the first is two thirds full.',
  'Auslöser: Raps ist verblüht. Erst ernten, wenn zwei Drittel verdeckelt sind oder die Spritzprobe nichts hergibt (unter 18 % Wasser). Rapshonig zügig verarbeiten, er kristallisiert im Rähmchen.':
    'Trigger: oilseed rape has finished flowering. Only harvest once two thirds is capped or the '
    + 'shake test gives nothing (below 18 % water). Process rape honey quickly – it sets in the comb.',
  'Der Stichtag des Jahres. Sobald die Lindentracht endet, wird abgeerntet – und damit startet unmittelbar die Varroabehandlung und die Einfütterung. Alles Weitere hängt an diesem Datum.':
    'The key date of the year. Once the lime flow ends you take the crop off – and that immediately '
    + 'starts varroa treatment and winter feeding. Everything else hangs off this date.',
  'Rühren ab zwei bis drei Tagen nach dem Schleudern, bis der Honig cremig steht.':
    'Start stirring two to three days after extracting, until the honey stands creamy.',
  'Alle drei Wochen, sobald der Baurahmen verdeckelt ist. Ende Juni einstellen. Niemals verdeckelte Drohnenbrut im Volk vergessen – das wäre eine Milbenvermehrung mit Ansage.':
    'Every three weeks, as soon as the drone frame is capped. Stop at the end of June. Never leave '
    + 'capped drone brood in the colony – that is breeding mites on purpose.',
  'Stockwindel drei Tage einlegen, Milben zählen, Summe durch drei teilen. Die Schwelle hängt vom Monat ab – die App rechnet sie beim Eintragen gegen und legt bei Überschreitung selbstständig eine Behandlungsaufgabe an.':
    'Insert the monitoring board for three days, count the mites, divide the total by three. The '
    + 'threshold depends on the month – BeeWise checks your entry against it and creates a treatment '
    + 'task by itself if it is exceeded.',
  'Ein bis drei Tage nach der letzten Honigernte. Jede Woche Verzug kostet Winterbienen. Nicht in Hitze über 25 °C ansetzen, abends starten.':
    'One to three days after the last honey harvest. Every week of delay costs winter bees. Do not '
    + 'start in heat above 25 °C; begin in the evening.',
  'Zwei bis drei Wochen nach der ersten Behandlung. Erst dieser zweite Durchgang erwischt die Milben, die beim ersten Mal in der verdeckelten Brut saßen.':
    'Two to three weeks after the first treatment. Only this second round catches the mites that '
    + 'were sitting in capped brood the first time.',
  'Ziel: unter einer Milbe natürlicher Fall pro Tag. Wird der Wert überschritten, muss vor dem Einwintern nachbehandelt werden.':
    'Target: below one mite of natural drop per day. If the count is higher, treat again before '
    + 'wintering.',
  'Nur im brutfreien Volk, sonst wirkungslos. Etwa drei Wochen nach Beginn der ersten längeren Frostperiode. Einmalig und gründlich, bei 3 bis 8 °C.':
    'Only in a broodless colony, otherwise it does nothing. About three weeks after the start of the '
    + 'first longer frost period. Once, thoroughly, at 3 to 8 °C.',
  'Direkt im Anschluss an die erste Sommerbehandlung. In großen Gaben, nicht tröpfchenweise – das reizt zur Räuberei und verbraucht Bienen. Wie viel nötig ist, hängt von Beute, Volksstärke und vorhandenem Vorrat ab – der Rechner unten schlägt eine Menge vor.':
    'Straight after the first summer treatment. In large portions, not drop by drop – that invites '
    + 'robbing and wears the bees out. How much is needed depends on the hive, colony strength and '
    + 'the stores already present – the calculator below suggests an amount.',
  'Bis Mitte September muss das Winterfutter drin sein. Später eingetragenes Futter wird nicht mehr sauber invertiert und verbraucht die Winterbienen.':
    'The winter stores must be in by mid-September. Feed taken later is no longer properly inverted '
    + 'and wears out the winter bees.',
  'Unter fünf von Bienen besetzten Wabengassen nicht einwintern, sondern auflösen oder vereinigen. Ein schwaches Volk wird über Winter nicht stärker.':
    'Do not winter a colony covering fewer than five seams of bees – unite it or shake it out. A weak '
    + 'colony does not get stronger over winter.',
  'Vor dem ersten Nachtfrost erledigt haben.': 'Have this done before the first night frost.',
  'Löten, reinigen, desinfizieren, Mittelwände gießen. Jetzt ist Zeit dafür.':
    'Wiring, cleaning, disinfecting, casting foundation. Now is the time.',
  'Meldung an die Tierseuchenkasse – Stichtag je nach Bundesland, meist zum Jahreswechsel. Gleich Material und Königinnen bestellen.':
    'Registration with the animal disease fund – the cut-off date depends on the federal state, '
    + 'usually around the new year. Order equipment and queens at the same time.',
  'Gemessen wurden {ist} Milben pro Tag. Die Schwelle für diesen Monat liegt bei {soll}. Behandlungsverfahren nach Jahreszeit wählen (im Sommer Ameisensäure, im brutfreien Volk Oxalsäure) und danach erneut messen.':
    'You measured {ist} mites per day. The threshold for this month is {soll}. Choose a treatment to '
    + 'suit the season (formic acid in summer, oxalic acid in a broodless colony) and measure again '
    + 'afterwards.',
  'Weiselprobe mit offener Brut aus einem anderen Volk. Bauen die Bienen Nachschaffungszellen, ist das Volk weisellos: Königin zusetzen oder mit einem weiselrichtigen Volk vereinigen. Nicht warten – ein weiselloses Volk wird schnell drohnenbrütig.':
    'Test with a frame of open brood from another colony. If the bees build emergency cells the '
    + 'colony is queenless: introduce a queen or unite it with a queenright colony. Do not wait – a '
    + 'queenless colony soon turns to laying workers.',
  'Bei der letzten Kontrolle: {befund}. Jetzt engmaschiger kontrollieren oder das Volk durch einen Ableger entlasten.':
    'At the last inspection: {befund}. Inspect more closely now, or relieve the colony by taking a '
    + 'nucleus.',
  'Geschätzter Vorrat: {kg} kg. Im Winterhalbjahr Futterteig direkt über den Sitz legen, im Sommerhalbjahr Futtersirup geben. Ein verhungertes Volk ist der häufigste vermeidbare Verlust.':
    'Estimated stores: {kg} kg. In the winter half of the year place fondant directly above the '
    + 'cluster; in summer give syrup. Starvation is the most common avoidable loss.',

  // ----------------------------------------------------------- Checklisten
  'Flugloch frei': 'Entrance clear',
  'Beute unbeschädigt': 'Hive undamaged',
  'Klopfprobe: Antwort?': 'Knock test: any response?',
  'Totenfall am Boden': 'Dead bees on the floor',
  'Brut in allen Stadien': 'Brood in all stages',
  'Futterkranz vorhanden': 'Ring of stores present',
  'Stockwindel gereinigt': 'Monitoring board cleaned',
  'Totenfall entfernt': 'Dead bees removed',
  'Alle Waben gezogen': 'Every comb pulled',
  'Weiselzellen gebrochen': 'Queen cells removed',
  'Platz ausreichend': 'Enough room',
  'Baurahmen geschnitten': 'Drone frame cut out',
  '2/3 verdeckelt oder Spritzprobe negativ': 'Two thirds capped or shake test negative',
  'Wassergehalt gemessen': 'Water content measured',
  'Bienen abgekehrt/abgeblasen': 'Bees brushed or blown off',
  'Honigräume ab': 'Supers removed',
  'Stockwindel eingelegt': 'Monitoring board inserted',
  'Menge nach Beutenvolumen': 'Dose according to hive volume',
  'Wetter passt (15–25 °C)': 'Weather suitable (15–25 °C)',
  'Volk brutfrei geprüft': 'Colony checked to be broodless',
  'Lösung auf ca. 30 °C angewärmt': 'Solution warmed to about 30 °C',
  'Menge je besetzter Wabengasse': 'Dose per occupied seam',

  // -------------------------------------------------------------- Feldnamen
  Datum: 'Date',
  Notiz: 'Note',
  Bezeichnung: 'Name',
  Standort: 'Apiary',
  Herkunft: 'Origin',
  Zargen: 'Boxes',
  'Zargen danach': 'Boxes afterwards',
  'Beute / Rähmchenmaß': 'Hive / frame size',
  'Königin Jahrgang': 'Queen year',
  'Von Bienen besetzte Wabengassen': 'Seams covered by bees',
  Gassen: 'seams',
  Brutbild: 'Brood pattern',
  Königin: 'Queen',
  Weiselzustand: 'Queen status',
  Weiselzellen: 'Queen cells',
  'Weiselzellen gefunden': 'Queen cells found',
  Schwarmstimmung: 'Swarm preparations',
  Sanftmut: 'Temperament',
  '1 stechlustig … 5 sanft': '1 defensive … 5 gentle',
  Futtervorrat: 'Stores',
  'Futter geschätzt': 'Stores, estimated',
  'Geschätzter Vorrat': 'Estimated stores',
  'kg (geschätzt)': 'kg (estimated)',
  Honigräume: 'Honey supers',
  'Honigräume danach': 'Supers afterwards',
  'Natürlicher Milbenfall': 'Natural mite drop',
  'Milben pro Tag': 'mites per day',
  'Milben/Tag': 'Mites/day',
  'Liegezeit der Stockwindel': 'Days the board was in',
  Tage: 'days',
  Präparat: 'Product',
  Verdunster: 'Dispenser',
  'Eingesetzte Menge': 'Amount used',
  'Aufgebrachte Menge': 'Amount applied',
  'ml je Volk': 'ml per colony',
  Menge: 'Amount',
  Erntemenge: 'Harvest',
  'Abgefüllte Menge': 'Amount jarred',
  Wassergehalt: 'Water content',
  '% (Refraktometer)': '% (refractometer)',
  Glasgröße: 'Jar size',
  'g Inhalt': 'g content',
  'Anzahl Gläser': 'Number of jars',
  Stück: 'pcs',
  kg: 'kg',
  'Erste Gabe': 'First feed',
  'Insgesamt gegeben': 'Total given',
  'Beutengewicht danach': 'Hive weight afterwards',
  Futtermittel: 'Feed',
  'Fertigsirup (Invertzucker)': 'Ready-made syrup (inverted sugar)',
  'Zuckerwasser 3:2': 'Sugar syrup 3:2',
  Futterteig: 'Fondant',
  Maßnahme: 'Action',
  'Gebildete Ableger': 'Nucleus colonies made',
  'Ableger mit Oxalsäure behandelt': 'Nucleus treated with oxalic acid',
  'Entnommene Waben': 'Combs removed',
  'Gemeldete Völker': 'Colonies registered',
  Kategorie: 'Category',
  Beschreibung: 'Description',
  Aufgabe: 'Task',
  Wichtig: 'Important',
  Ab: 'From',
  Bis: 'To',
  Wofür: 'What for',
  'Wofür?': 'What for?',
  Vorgehen: 'How to proceed',
  Adresse: 'Address',
  Breitengrad: 'Latitude',
  Längengrad: 'Longitude',
  Name: 'Name',
  Repository: 'Repository',
  Zugriffsschlüssel: 'Access token',
  'Name dieses Geräts': 'Name of this device',
  'Dateipfad im Repository': 'File path in the repository',
  Branch: 'Branch',
  'Weitere Einstellungen': 'More settings',
  'Erledigt am': 'Completed on',
  'Datum des Umzugs': 'Date of the move',
  'Neuer Standort': 'New apiary',
  'Neuer Standort für alle': 'New apiary for all of them',
  'Für welche erledigt?': 'Done for which ones?',
  Saison: 'Season',
  Ernte: 'Harvest',
  'Behandl.': 'Treat.',
  'Durchs.': 'Insp.',
  'max. Gassen': 'max. seams',
  Behandlungen: 'Treatments',
  Durchsichten: 'Inspections',
  'max. besetzte Wabengassen': 'max. seams covered',
  Bemerkung: 'Remark',
  Art: 'Type',
  Angaben: 'Details',
  Vorgang: 'Event',
  Stammdaten: 'Basic data',
  Saisonbilanz: 'Season summary',
  'Imkerei (erscheint im Kopf)': 'Apiary name (appears in the header)',
  Vorwarnzeit: 'Advance warning',
  'Erledigt am ': 'Completed on ',

  // ----------------------------------------------------- Auswahlwerte
  Stifte: 'eggs',
  'offene Brut': 'open brood',
  'verdeckelte Brut': 'capped brood',
  brutfrei: 'broodless',
  lückig: 'patchy',
  drohnenbrütig: 'drone-laying',
  gesehen: 'seen',
  'nicht gesehen': 'not seen',
  weiselrichtig: 'queenright',
  weisellos: 'queenless',
  unsicher: 'uncertain',
  keine: 'none',
  Spielnäpfchen: 'play cups',
  bestiftet: 'with eggs',
  verdeckelt: 'capped',
  bleibt: 'stays',
  vereinigt: 'united',
  aufgelöst: 'shaken out',
  Ja: 'Yes',
  Nein: 'No',
  anderes: 'other',
  'Ameisensäure 60 %': 'Formic acid 60 %',
  'Ameisensäure 85 %': 'Formic acid 85 %',
  'Milchsäure 15 %': 'Lactic acid 15 %',
  'Thymol-Präparat': 'Thymol product',
  'Oxalsäure 3,5 % Träufellösung': 'Oxalic acid 3.5 % trickling solution',
  'Oxalsäure sprühen': 'Oxalic acid, sprayed',
  'Oxalsäure verdampfen': 'Oxalic acid, vaporised',
  'Schwammtuch von oben': 'Sponge cloth from above',
  'Nassenheider professionell': 'Nassenheider professional',
  'Liebig-Dispenser': 'Liebig dispenser',
  Universalverdunster: 'Universal evaporator',
  Sprühbehandlung: 'Spray treatment',
  'ganze Imkerei': 'whole apiary',
  'alle Stände': 'all apiaries',
  'alle Völker': 'all colonies',
  'bestimmte Völker': 'selected colonies',

  // ------------------------------------------------------------ Trachtpflanzen
  Hasel: 'Hazel',
  Erle: 'Alder',
  Salweide: 'Goat willow',
  Obstblüte: 'Fruit blossom',
  Löwenzahn: 'Dandelion',
  Raps: 'Oilseed rape',
  Robinie: 'Black locust',
  Linde: 'Lime',
  'Phacelia / Senf': 'Phacelia / mustard',
  Heide: 'Heather',
  Springkraut: 'Himalayan balsam',
  'Waldtracht / Honigtau': 'Forest flow / honeydew',
  'erster Pollen – Blüte steuert die Tageslänge, nicht die Wärme':
    'first pollen – flowering is driven by day length, not warmth',
  'Startschuss für die Entwicklung': 'the starting gun for colony build-up',
  'Signal zum Erweitern': 'the signal to expand',
  'Frühtracht – zügig ernten': 'spring flow – harvest promptly',
  'Ende = letzte Ernte': 'end of it = last harvest',
  'nur wo ausgesät wurde': 'only where it has been sown',
  'Läusehonig – nicht vorhersagbar, nie fest einplanen':
    'aphid honey – unpredictable, never count on it',
  'liefert Pollen': 'provides pollen',
  'liefert Nektar': 'provides nectar',
  'liefert Nektar und Pollen': 'provides nectar and pollen',
  'blüht: {liste}': 'in flower: {liste}',
  'blüht seit {d}': 'in flower since {d}',
  'erwartet {d} · {rel}': 'expected {d} · {rel}',
  'vorbei seit {d}': 'over since {d}',
  'von dir bestätigt': 'confirmed by you',
  Modell: 'model',
  Prognose: 'forecast',
  Erfahrungswert: 'rule of thumb',
  'Modell, kalibriert an {n} Beobachtungen': 'model, calibrated on {n} observations',
  'Wärmesummen-Modell für diesen Standort': 'Growing-degree-day model for this apiary',
  'Wärmesummen-Modell · Jahr liegt im langjährigen Mittel':
    'Growing-degree-day model · the year is on the long-term average',
  'Wärmesummen-Modell · Jahr liegt {n} Tage vor dem langjährigen Mittel':
    'Growing-degree-day model · the year is {n} days ahead of the long-term average',
  'Wärmesummen-Modell · Jahr liegt {n} Tage hinter dem langjährigen Mittel':
    'Growing-degree-day model · the year is {n} days behind the long-term average',
  'Kalendermittel – keine Wetterdaten verfügbar, Werte sind grob':
    'Calendar averages – no weather data available, figures are rough',
  'Blüht {art} am Stand „{ort}“ schon?': 'Is {art} already in flower at “{ort}”?',
  'Ja, blüht': 'Yes, in flower',
  'Noch nicht': 'Not yet',
  'Blüht seit diesem Datum': 'In flower since this date',
  'Blüht noch nicht': 'Not in flower yet',
  'Blüte vorbei': 'Flowering over',
  'Meine Meldungen zurücknehmen': 'Withdraw my reports',
  'Trachtfrage offen': 'Forage question open',
  'Trachtdaten für {art}': 'forage data for {art}',
  '{art} Blühbeginn': 'start of {art} flowering',
  '{art} Blühende': 'end of {art} flowering',

  // ------------------------------------------------------------ Terminbezüge
  'bis {d}': 'until {d}',
  'ab {d} · {rel}': 'from {d} · {rel}',
  '{von} bis {bis}': '{von} to {bis}',
  'voraussichtlich {d}': 'expected {d}',
  '{n} Tage überfällig': '{n} days overdue',
  'Termin offen': 'no date yet',
  'Termin noch offen': 'no date yet',
  'Termin hängt an einer Vorarbeit': 'date depends on earlier work',
  'wartet auf: {was}': 'waiting on: {was}',
  'hängt an: {regel}': 'depends on: {regel}',
  '{regel} am {datum}': '{regel} on {datum}',
  'zuletzt am {datum}': 'last done on {datum}',
  'zuletzt {d} (vor {n} Tagen)': 'last on {d} ({n} days ago)',
  'Kalender {von} – {bis}': 'calendar {von} – {bis}',
  '{a}–{b} Tage nach „{regel}“': '{a}–{b} days after “{regel}”',
  'erster warmer Tag': 'first warm day',
  'erstes durchsichtstaugliches Wetter': 'first weather fit for an inspection',
  'Brutfreiheit nach Frost': 'broodless after frost',
  'erster Nachtfrost': 'first night frost',
  'erster Tag über 10 °C': 'first day above 10 °C',
  'drei Tage über 12 °C': 'three days above 12 °C',
  'brutfrei nach der ersten Frostperiode': 'broodless after the first frost period',
  'Erfahrungswert (kein Wetterbezug verfügbar)': 'rule of thumb (no weather data available)',
  'Terminbezug:': 'Based on:',

  // ------------------------------------------------------------------ Zeit
  heute: 'today',
  morgen: 'tomorrow',
  gestern: 'yesterday',
  'in {n} Tagen': 'in {n} days',
  'vor {n} Tagen': '{n} days ago',
  'in {n} Wochen': 'in {n} weeks',
  'vor {n} Wochen': '{n} weeks ago',

  // ------------------------------------------------------------------ Knöpfe
  Speichern: 'Save',
  Abbrechen: 'Cancel',
  Löschen: 'Delete',
  Bearbeiten: 'Edit',
  Anlegen: 'Create',
  Erledigt: 'Done',
  Überspringen: 'Skip',
  Suchen: 'Search',
  Einrichten: 'Set up',
  Einstellungen: 'Settings',
  'Jetzt abgleichen': 'Sync now',
  'Verbindung prüfen': 'Test connection',
  'Abgleich abschalten': 'Turn sync off',
  'Volk anlegen': 'Add colony',
  'Volk bearbeiten': 'Edit colony',
  'Bienenstand anlegen': 'Add apiary',
  'Bienenstand bearbeiten': 'Edit apiary',
  'Durchsicht erfassen': 'Record inspection',
  'Umziehen / wandern': 'Move / migrate',
  'Umzug eintragen': 'Record the move',
  'Umziehen und löschen': 'Move them and delete',
  'Völker umziehen': 'Move the colonies',
  'Völker mitlöschen': 'Delete the colonies too',
  'Stockkarte als PDF': 'Hive record as PDF',
  'Behandlungsprotokoll (PDF)': 'Treatment record (PDF)',
  'Behandlungsprotokoll als PDF': 'Treatment record as PDF',
  'PDF erstellen': 'Create PDF',
  '+ Eigene Aufgabe': '+ Own task',
  'Eigene Aufgabe': 'Own task',
  'In Kalender exportieren': 'Export to calendar',
  'Offene Aufgaben exportieren (.ics)': 'Export open tasks (.ics)',
  'Kalenderdatei (.ics)': 'Calendar file (.ics)',
  'Sicherung exportieren': 'Export backup',
  'Sicherung einspielen': 'Restore backup',
  'Beispieldaten laden': 'Load sample data',
  'Alles löschen': 'Delete everything',
  'Meldungen erlauben': 'Allow notifications',
  Probemeldung: 'Test notification',
  'Jetzt installieren': 'Install now',
  'Playlist öffnen': 'Open the playlist',
  'Selbsttest ausführen': 'Run self-test',
  'Datenbank zurücksetzen': 'Reset database',
  'Aktuelle Position': 'Current position',
  'Adresse zur Markierung': 'Address for the marker',
  'Ja, löschen': 'Yes, delete',
  'Ja, alles löschen': 'Yes, delete everything',
  'Ja, zurücksetzen': 'Yes, reset',
  '▶ Video (Land.Schafft.Bayern)': '▶ Video (Land.Schafft.Bayern)',
  '▶ andere Quellen': '▶ other sources',
  zurück: 'back',
  weiter: 'forward',
  näher: 'zoom in',
  vor: 'zoom out',

  // ------------------------------------------------------------- Platzhalter
  'z. B. Hausgarten': 'e.g. home garden',
  'z. B. 1 oder Blaue Beute': 'e.g. 1 or Blue hive',
  'z. B. Mittelwände bestellen': 'e.g. order foundation',
  'z. B. Wanderung zur Lindentracht': 'e.g. migration to the lime flow',
  'Straße, PLZ Ort': 'Street, postcode, town',
  'Zufahrt, Trachtangebot, Besonderheiten': 'Access, forage, anything special',
  'Ableger 2025, Schwarm, gekauft …': 'Nuc 2025, swarm, bought …',
  'Handy oder PC': 'Phone or PC',
  'Name, Ort': 'Name, place',
  'benutzername/beewise-daten': 'username/beewise-data',

  // ---------------------------------------------------------------- Meldungen
  'Standort gespeichert.': 'Apiary saved.',
  'Standort gesetzt.': 'Position set.',
  'Volk gespeichert.': 'Colony saved.',
  'Volk gelöscht.': 'Colony deleted.',
  'Bienenstand gelöscht.': 'Apiary deleted.',
  'Gelöscht.': 'Deleted.',
  'Eintrag gelöscht.': 'Entry deleted.',
  'Aufgabe gelöscht.': 'Task deleted.',
  'Durchsicht gespeichert.': 'Inspection saved.',
  'Foto gespeichert.': 'Photo saved.',
  'Erledigt – Folgetermine neu berechnet.': 'Done – follow-up dates recalculated.',
  'Übersprungen.': 'Skipped.',
  'Notiert – abhängige Termine wurden nachgezogen.':
    'Noted – the dependent dates have been moved.',
  'Notiert.': 'Noted.',
  'Beispieldaten geladen.': 'Sample data loaded.',
  'Alles gelöscht.': 'Everything deleted.',
  'Sicherung erstellt.': 'Backup created.',
  'Sicherung eingespielt.': 'Backup restored.',
  'Datei konnte nicht gelesen werden.': 'The file could not be read.',
  'PDF erstellt.': 'PDF created.',
  'Sprache geändert.': 'Language changed.',
  'Abgleich eingerichtet.': 'Sync configured.',
  'Abgleich abgeschaltet.': 'Sync turned off.',
  'Abgleich läuft …': 'Syncing …',
  'Hole Stand von GitHub …': 'Fetching from GitHub …',
  'Führe zusammen …': 'Merging …',
  'Übertrage …': 'Uploading …',
  'Erste Übertragung abgeschlossen.': 'First upload complete.',
  'Abgeglichen: {neu} neu, {alt} aktualisiert.': 'Synced: {neu} new, {alt} updated.',
  'Abgleich fehlgeschlagen: {grund}': 'Sync failed: {grund}',
  'Speichern fehlgeschlagen: {grund}': 'Saving failed: {grund}',
  'Bitte einen Namen vergeben.': 'Please enter a name.',
  'Bitte eine Bezeichnung vergeben.': 'Please enter a name.',
  'Bitte einen Titel eingeben.': 'Please enter a title.',
  'Bitte zuerst einen Standort anlegen.': 'Please create an apiary first.',
  'Nichts ausgewählt.': 'Nothing selected.',
  'Kein Volk ausgewählt.': 'No colony selected.',
  'Nichts zu exportieren.': 'Nothing to export.',
  'Erst eine Position setzen.': 'Set a position first.',
  'Keine Ortung verfügbar.': 'Location services are not available.',
  'Position wird ermittelt …': 'Getting your position …',
  'Position übernommen.': 'Position taken over.',
  'Position konnte nicht ermittelt werden.': 'Your position could not be determined.',
  'Adresse übernommen.': 'Address taken over.',
  'Adressdienst nicht erreichbar.': 'The address service cannot be reached.',
  'Dieses Gerät unterstützt keine Benachrichtigungen.':
    'This device does not support notifications.',
  'Erinnerungen sind aktiv.': 'Reminders are active.',
  'Erinnerungen wurden nicht erlaubt.': 'Reminders were not allowed.',
  'Meldungen sind nicht erlaubt.': 'Notifications are not allowed.',
  'Im Moment gibt es nichts zu melden.': 'There is nothing to report right now.',
  'BeeWise wurde installiert.': 'BeeWise has been installed.',
  'Teile dieses Fensters konnten nicht aufgebaut werden.':
    'Parts of this dialog could not be built.',
  'Fehler: ': 'Error: ',
  'Erledigt. {n} neue Aufgaben automatisch angelegt.':
    'Done. {n} new tasks created automatically.',
  'Durchsicht gespeichert. {n} neue Aufgaben angelegt.':
    'Inspection saved. {n} new tasks created.',
  '{k} × erledigt.': '{k} × done.',
  '{k} × erledigt, {n} neue Aufgaben.': '{k} × done, {n} new tasks.',
  'Aufgabe für {n} Ziele angelegt.': 'Task created for {n} targets.',
  'Umgezogen nach {ort}.': 'Moved to {ort}.',
  '{n} Völker umgezogen, Bienenstand gelöscht.': '{n} colonies moved, apiary deleted.',
  'Bienenstand und {n} Völker gelöscht.': 'Apiary and {n} colonies deleted.',
  '{n} Termine als .ics – in den Kalender importieren.':
    '{n} events as .ics – import them into your calendar.',
  '{n} Aufgaben am Bienenstand': '{n} tasks at the apiary',
  '{n} Aufgaben fällig': '{n} tasks due',
  '{n} Warnungen': '{n} warnings',
  'Bald wichtig': 'Important soon',

  // ------------------------------------------------------------- Rückfragen
  'Volk wirklich löschen? Der Verlauf geht mit verloren.':
    'Really delete this colony? Its whole history goes with it.',
  '„{name}“ wirklich löschen? Der Verlauf geht mit verloren.':
    'Really delete “{name}”? Its whole history goes with it.',
  'Bienenstand „{name}“ wirklich löschen?': 'Really delete the apiary “{name}”?',
  'Bienenstand „{name}“ löschen': 'Delete the apiary “{name}”',
  'Wirklich {n} Völker mit ihrer gesamten Historie löschen?':
    'Really delete {n} colonies together with their entire history?',
  'Wirklich alle Daten auf diesem Gerät löschen?':
    'Really delete all data on this device?',
  'Datenbank zurücksetzen? Alle Daten auf diesem Gerät gehen verloren. Vorher am besten eine Sicherung exportieren.':
    'Reset the database? All data on this device will be lost. Best export a backup first.',
  '{n} Völker stehen hier: {liste}': '{n} colonies are kept here: {liste}',
  'Was soll mit den Völkern passieren? Beim Umziehen bleibt die gesamte Historie erhalten – der Wechsel wird als Wanderung eingetragen.':
    'What should happen to the colonies? If you move them, their entire history is kept – the '
    + 'change is recorded as a migration.',
  'Die gesamte Historie bleibt beim Volk – Durchsichten, Behandlungen, Ernten. Ab dem Umzugsdatum rechnet BeeWise Tracht und Wetter für den neuen Standort.':
    'The whole history stays with the colony – inspections, treatments, harvests. From the date of '
    + 'the move BeeWise calculates forage and weather for the new apiary.',

  // ----------------------------------------------------------------- Mengen
  '{n} Völker': '{n} colonies',
  '{n} Stände': '{n} apiaries',
  '{n} Völker betroffen': '{n} colonies affected',
  '{n} Stände betroffen': '{n} apiaries affected',
  '{n} offen': '{n} open',
  '{n} Gassen': '{n} seams',
  '{n} besetzte Wabengassen': '{n} seams covered',
  '{n} Weiselzellen': '{n} queen cells',
  '{n} kg Futter': '{n} kg of stores',
  '{n} Milben/Tag': '{n} mites/day',
  'Durchsicht {d}': 'inspected {d}',
  'noch keine Durchsicht': 'not inspected yet',
  'Volksstärke {jahr} – besetzte Wabengassen': 'Colony strength {jahr} – seams covered',
  'Alle {n} Regeln und woran ihr Termin hängt': 'All {n} rules and what their timing depends on',
  '{n} Aufgaben sind für dieses Jahr durch – die App mahnt sie nicht weiter an.':
    '{n} tasks are done for this year – BeeWise will not keep nagging about them.',
  'Alarmschwelle Milbenfall in diesem Monat: {n} pro Tag.':
    'Alarm threshold for mite drop this month: {n} per day.',
  'steht auf „{ort}“': 'kept at “{ort}”',
  'Ganze Imkerei': 'Whole apiary',
  Durchsicht: 'Inspection',
  'Umzug / Wanderung': 'Move / migration',

  // -------------------------------------------------------------- Erklärtexte
  'Willkommen bei BeeWise.': 'Welcome to BeeWise.',
  'Lege zuerst einen Bienenstand an – über Adresse, GPS oder Langdruck im Luftbild. Aus seiner Lage berechnet die App die örtliche Tracht und daraus deine Termine.':
    'Start by adding an apiary – by address, by GPS or by long-pressing on the aerial image. From '
    + 'its location BeeWise works out the local forage and from that your dates.',
  'Noch keine Völker angelegt.': 'No colonies yet.',
  'Erst einen Standort anlegen.': 'Create an apiary first.',
  'Volk nicht gefunden.': 'Colony not found.',
  'Noch nichts erfasst.': 'Nothing recorded yet.',
  'Nichts an diesem Tag.': 'Nothing on this day.',
  'Noch kein Standort.': 'No apiary yet.',
  'Noch keine Völker.': 'No colonies yet.',
  'Die Zahl zeigt, wie viele Aufgaben an diesem Tag im Zeitfenster liegen. Tippen für die Liste.':
    'The number shows how many tasks fall within their window on that day. Tap for the list.',
  'Die Werte gelten für alle ausgewählten. Einzeln erfassen? Dann über das jeweilige Volk gehen.':
    'The values apply to all selected colonies. To record them individually, go via each colony.',
  'Gilt für ein Volk, einen Stand oder die ganze Imkerei.':
    'Applies to one colony, one apiary or the whole operation.',
  'Alles liegt nur auf diesem Gerät. Sichere regelmäßig – und vor jedem Gerätewechsel.':
    'Everything lives on this device only. Back up regularly – and before changing devices.',
  'Zum Ablegen, Ausdrucken und Vorzeigen.': 'For filing, printing and showing to others.',
  'Die Stockkarte eines einzelnen Volkes als PDF gibt es auf der Seite des jeweiligen Volkes.':
    'The hive record of an individual colony as a PDF is on that colony’s own page.',
  'Varroabehandlungen, Befallskontrollen und biotechnische Maßnahmen eines Jahres.':
    'Varroa treatments, mite counts and biotechnical measures for one year.',
  'Noch nicht eingerichtet. Am Handy erfassen, am PC auswerten – über ein privates GitHub-Repository, kostenlos.':
    'Not set up yet. Record on your phone, review on your PC – via a private GitHub repository, '
    + 'free of charge.',
  'Über ein privates GitHub-Repository – kostenlos, ohne eigenen Server.':
    'Via a private GitHub repository – free, without a server of your own.',
  'Wofür BeeWise sich melden darf.': 'What BeeWise may notify you about.',
  'Meldungen sind erlaubt.': 'Notifications are allowed.',
  'Meldungen sind noch nicht erlaubt – unten freigeben.':
    'Notifications are not allowed yet – enable them below.',
  'Fällige und überfällige Aufgaben': 'Due and overdue tasks',
  'Eine Zusammenfassung dessen, was ansteht oder liegengeblieben ist.':
    'A summary of what is coming up or has been left undone.',
  'Automatische Warnungen': 'Automatic warnings',
  'Varroabefall über der Schwelle, weiselloses Volk, Schwarmstimmung, Futter knapp.':
    'Varroa above the threshold, a queenless colony, swarm preparations, stores running low.',
  Trachtfragen: 'Forage questions',
  'Rückfragen wie „Blüht der Raps schon?“, die das Modell genauer machen.':
    'Questions such as “Is the rape in flower yet?” that make the model more accurate.',
  'Wichtige Termine vorab': 'Important dates in advance',
  'Vorwarnung vor kritischen Terminen wie letzter Ernte oder Auffütterungsschluss.':
    'Advance warning of critical dates such as the last harvest or the end of feeding.',
  'Im Browser kann BeeWise nur melden, solange die App zwischendurch geöffnet wird. Für Meldungen bei geschlossener App braucht es die Android-Fassung.':
    'In the browser BeeWise can only notify you as long as the app is opened from time to time. For '
    + 'notifications while the app is closed you need the Android build.',
  'Weitere Sprachen lassen sich als Textdatei ergänzen, ohne am Programm etwas zu ändern – siehe':
    'Further languages can be added as a text file without changing any code – see',
  'BeeWise lässt sich als App auf den Startbildschirm legen – mit eigenem Symbol, im Vollbild, ohne Browserleiste und ohne Play Store.':
    'BeeWise can be placed on your home screen as an app – with its own icon, full screen, without '
    + 'a browser bar and without the Play Store.',
  'Menü ⋮ → „App installieren“.': 'Menu ⋮ → “Install app”.',
  'Teilen-Symbol → „Zum Home-Bildschirm“.': 'Share icon → “Add to Home Screen”.',
  'Zu vielen Aufgaben gibt es Videohilfe direkt im Aufgabenfenster. Bevorzugte Quelle ist die Playlist „Tipps und Tricks für Imker“ von Land.Schafft.Bayern.':
    'Many tasks have video help right in the task dialog. The preferred source is the playlist '
    + '“Tipps und Tricks für Imker” by Land.Schafft.Bayern (in German).',
  'Quelle: Open-Meteo (Archiv und Vorhersage, kostenfrei, ohne Schlüssel). Das Modell kalibriert sich pro Standort an zehn Jahren örtlicher Klimatologie und lernt aus jeder Blüte, die du bestätigst. Bilder und Beschreibungen: Wikipedia.':
    'Source: Open-Meteo (archive and forecast, free, no key needed). The model calibrates itself per '
    + 'apiary against ten years of local climate and learns from every bloom you confirm. Images and '
    + 'descriptions: Wikipedia.',
  'Was du hier meldest, überschreibt das Modell, verschiebt die davon abhängigen Aufgaben – und macht die Vorhersage im nächsten Jahr an diesem Standort genauer.':
    'What you report here overrides the model, moves the tasks that depend on it – and makes next '
    + 'year’s forecast for this apiary more accurate.',
  'Das Modell erwartet den Blühbeginn um den': 'The model expects flowering to start around',
  'Deine Antwort zählt mehr – und macht das Modell im nächsten Jahr genauer.':
    'Your answer counts for more – and makes the model better next year.',
  'Adresse eingeben, Position übernehmen oder im Luftbild lange tippen.':
    'Enter an address, take your current position, or long-press on the aerial image.',
  'Karte schieben · lange tippen oder doppelklicken setzt den Standort':
    'Drag the map · long-press or double-click to set the position',
  'Luftbild: Esri, Maxar, Earthstar Geographics · Suche: OpenStreetMap':
    'Aerial imagery: Esri, Maxar, Earthstar Geographics · Search: OpenStreetMap',
  'Adresssuche nicht erreichbar – bitte die Position im Luftbild setzen oder GPS verwenden.':
    'Address search unavailable – please set the position on the aerial image or use GPS.',
  'Nichts gefunden.': 'Nothing found.',
  'Suche läuft …': 'Searching …',
  'Luftbild nicht verfügbar. Koordinaten unten von Hand eintragen oder GPS verwenden.':
    'Aerial image unavailable. Enter the coordinates by hand below or use GPS.',
  'Die Termine sind eine Orientierung. Zulassung, Dosierung und Wartezeiten von Behandlungsmitteln richten sich nach der Packungsbeilage und den Empfehlungen des zuständigen Bienengesundheitsdienstes. Melde- und Anzeigepflichten sind Ländersache.':
    'The dates are guidance, not instructions. Approval, dosage and withdrawal periods for treatment '
    + 'products follow the package insert and the recommendations of your regional bee health '
    + 'service. Registration and notification duties differ by region.',
  'BeeWise · Prototyp.': 'BeeWise · prototype.',
  'Gassen zählen, in denen Bienen sitzen – nicht die Futterwaben. Grundlage für Erweitern, Einwintern und den Futterbedarf.':
    'Count the seams the bees are sitting in – not the combs of stores. This drives expansion, '
    + 'wintering and the feed calculation.',
  'Gassen zählen, in denen Bienen sitzen – nicht die Futterwaben.':
    'Count the seams the bees are sitting in – not the combs of stores.',
  'Voll verdeckelte Zanderwabe ≈ 2 kg, halbe ≈ 1 kg.':
    'A fully capped Zander comb holds about 2 kg, half a comb about 1 kg.',
  'Über der Monatsschwelle legt die App selbstständig eine Behandlungsaufgabe an.':
    'Above the monthly threshold BeeWise creates a treatment task by itself.',
  'Gesamtzahl auf der Windel geteilt durch die Zahl der Tage.':
    'Total on the board divided by the number of days.',
  'Richtwerte: Schwammtuch 1 ml je Liter Beutenvolumen (Zander-Zarge ≈ 40 ml, zwei Zargen ≈ 80 ml). Liebig-Dispenser 120–180 ml über 3–5 Tage. Verbindlich ist die Packungsbeilage deines Präparats.':
    'Guide values: sponge cloth 1 ml per litre of hive volume (a Zander box ≈ 40 ml, two boxes '
    + '≈ 80 ml). Liebig dispenser 120–180 ml over 3–5 days. The package insert of your product is '
    + 'what counts.',
  'Richtwert Träufelverfahren: 5 ml je besetzter Wabengasse, höchstens 50 ml. Verbindlich ist die Packungsbeilage.':
    'Guide value for trickling: 5 ml per occupied seam, at most 50 ml. The package insert is what '
    + 'counts.',
  'Wird aus Menge und Glasgröße berechnet, lässt sich aber überschreiben.':
    'Calculated from the amount and the jar size, but you can overwrite it.',
  'monatlich · Alarm im Juli: über 5–10 Milben Fall pro Tag':
    'monthly · alarm in July: more than 5–10 mites dropping per day',

  // ------------------------------------------------------------ Futterrechner
  'Futterbedarf abschätzen': 'Estimate the feed required',
  'Gezählt werden die Wabengassen, in denen Bienen sitzen – nicht die Futterwaben.':
    'Count the seams the bees are sitting in – not the combs of stores.',
  'Vorhandenes Futter im Volk (kg)': 'Stores already in the colony (kg)',
  'Jungvolk (dieses Jahr gebildet, < 1 Jahr)': 'Young colony (made this year, < 1 year)',
  Beute: 'Hive',
  nein: 'no',
  ja: 'yes',
  'Zielvorrat für den Winter': 'Target stores for winter',
  'Noch zu füttern': 'Still to feed',
  'als Fertigsirup': 'as ready-made syrup',
  'oder Zuckerwasser 3:2': 'or sugar syrup 3:2',
  'Unter fünf besetzten Wabengassen lohnt das Einwintern nicht – besser vereinigen.':
    'Below five occupied seams wintering is not worth it – better to unite.',
  'Faustwerte, kein Ersatz für den Blick ins Volk.':
    'Rules of thumb, no substitute for looking into the colony.',
  'Noch keine Durchsicht – Werte bitte selbst eintragen.':
    'No inspection yet – please enter the values yourself.',
  'Die Futtermenge hängt an Volksstärke und vorhandenem Vorrat und ist je Volk verschieden. Für den Rechner die Aufgabe einzeln über das jeweilige Volk öffnen.':
    'The amount of feed depends on colony strength and stores already present, so it differs per '
    + 'colony. Open the task from the individual colony to use the calculator.',

  // ------------------------------------------------------------------ Berichte
  'Behandlungsprotokoll {jahr}': 'Treatment record {jahr}',
  'Stockkarte – Volk {name}': 'Hive record – colony {name}',
  'Volk {name}': 'Colony {name}',
  'Königin {jahr}': 'Queen {jahr}',
  'erstellt am {d}': 'created on {d}',
  '{v} Völker an {s} Standorten': '{v} colonies at {s} apiaries',
  'Varroabehandlungen ({n})': 'Varroa treatments ({n})',
  'Befallskontrollen ({n})': 'Mite counts ({n})',
  'Biotechnische Maßnahmen ({n})': 'Biotechnical measures ({n})',
  'Chronologie ({n} Einträge)': 'Chronology ({n} entries)',
  'Keine Einträge in diesem Jahr.': 'No entries this year.',
  Gemülldiagnose: 'Natural mite drop',
  Erfolgskontrolle: 'Success check',
  'Dokumentiert werden alle durchgeführten Varroabehandlungen, biotechnischen Maßnahmen und Befallskontrollen. Angaben zu Präparat und Menge stammen aus den Eintragungen des Imkers.':
    'This document records all varroa treatments, biotechnical measures and mite counts carried out. '
    + 'Product and quantity are as entered by the beekeeper.',
  'Die Angaben beruhen auf den Eintragungen in BeeWise. Für Zulassung, Dosierung und Wartezeiten der eingesetzten Mittel gilt die jeweilige Packungsbeilage.':
    'The information is based on the entries made in BeeWise. Approval, dosage and withdrawal '
    + 'periods for the products used are governed by the respective package insert.',

  // ----------------------------------------------------------------- Diagnose
  'Speicherung:': 'Storage:',
  '{n} Tage': '{n} days',
  'Datensätze: {st} Stände · {vo} Völker · {du} Durchsichten · {er} Erledigungen · {wa} Umzüge':
    'Records: {st} apiaries · {vo} colonies · {du} inspections · {er} completions · {wa} moves',
  'nur im Arbeitsspeicher – nichts bleibt erhalten': 'in memory only – nothing is kept',
  'lokale Datenbank (IndexedDB)': 'local database (IndexedDB)',
  'Adresse:': 'Address:',
  'Schreiben: ok': 'Write: ok',
  'Lesen: FEHLGESCHLAGEN': 'Read: FAILED',
  'FEHLER: {grund}': 'ERROR: {grund}',
  'Lesen: ok': 'Read: ok',
  'Löschen: ok': 'Delete: ok',
  'Dauerhafte Speicherung: ok': 'Persistent storage: ok',
  'ACHTUNG: nur Arbeitsspeicher': 'WARNING: memory only',
  'Test läuft …': 'Test running …',
  'Datenbank:': 'Database:',
  'Letzter Fehler:': 'Last error:',
  'Achtung: nichts wird dauerhaft gespeichert.': 'Warning: nothing is being saved permanently.',
  'Dieser Browser erlaubt keine lokale Datenbank – das passiert, wenn die Datei direkt von der Festplatte geöffnet wird (Adresse beginnt mit':
    'This browser does not allow a local database – that happens when the file is opened straight '
    + 'from disk (the address starts with',
  'Trachtdaten werden geladen …': 'Loading forage data …',
  'Wird geladen …': 'Loading …',

  // --------------------------------------------------------------- Abgleich
  'So richtest du es ein:': 'How to set this up:',
  'Repository anlegen, z. B.': 'Create a repository, e.g.',
  privates: 'private',
  'Fine-grained personal access token': 'Fine-grained personal access token',
  'Contents: Read and write': 'Contents: Read and write',
  'Der Schlüssel liegt unverschlüsselt auf diesem Gerät. Deshalb nur ein fein abgestufter Schlüssel für genau dieses eine private Repository. Bei Verlust des Geräts auf github.com widerrufen.':
    'The token is stored unencrypted on this device. So use a fine-grained token for exactly this '
    + 'one private repository. If you lose the device, revoke it on github.com.',
  'Repository bitte als "benutzer/repo" angeben.': 'Please give the repository as "user/repo".',
  'Zugriffsschlüssel wird nicht akzeptiert.': 'The access token was rejected.',
  'Repository nicht gefunden oder Schlüssel ohne Zugriff darauf.':
    'Repository not found, or the token has no access to it.',
  'Der Schlüssel darf in dieses Repository nicht schreiben.':
    'The token is not allowed to write to this repository.',
  'Abgleich ist noch nicht eingerichtet.': 'Sync has not been set up yet.',
  'Auf GitHub liegt ein neuerer Stand – bitte erneut abgleichen.':
    'There is a newer state on GitHub – please sync again.',
  'Verbindung steht:': 'Connection works:',
  'Android/Chrome:': 'Android/Chrome:',
  'iPhone/Safari:': 'iPhone/Safari:',
};
