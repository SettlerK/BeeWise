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
  'Auf github.com ein': 'On github.com create a',
  'Repository anlegen, z. B.': 'repository, e.g.',
  'Nicht dasselbe wie die veröffentlichte App – dort lägen deine Daten sonst offen.':
    'Not the same one as the published app – your data would be public there.',
  'Schlüssel erzeugen. Achtung: das geschieht in den': 'Create a token. Note: this happens in your',
  'Kontoeinstellungen': 'account settings',
  ', nicht im Repository. Direkter Weg:': ', not in the repository. Direct link:',
  '– oder Profilbild oben rechts → Settings → ganz unten':
    '– or profile picture top right → Settings → at the very bottom',
  '→ Personal access tokens →': '→ Personal access tokens →',
  '→ Generate new token.': '→ Generate new token.',
  'Dort einstellen:': 'There set:',
  '→ dein Datenrepository, und unter Repository permissions':
    '→ your data repository, and under Repository permissions',
  'Schlüssel hier eintragen, Verbindung prüfen, speichern. Danach auf dem zweiten Gerät dasselbe eintragen.':
    'Enter the token here, test the connection, save. Then enter the same on your second device.',
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
// ------------------------------------------------------------------- Wetter
  Zurück: 'Back',
  Schließen: 'Close',
  'Wetter wird geladen …': 'Loading weather …',
  'Wetter nicht verfügbar': 'Weather unavailable',
  'Wind {n} km/h': 'wind {n} kph',
  'Wetter · {ort}': 'Weather · {ort}',
  '{was}, {grad} · Wind {wind} km/h, Böen {boen} km/h':
    '{was}, {grad} · wind {wind} kph, gusts {boen} kph',
  'Der Balken zeigt, wie gut sich in dieser Stunde am offenen Volk arbeiten lässt: Temperatur, Wind, Niederschlag, Bewölkung und Tageslicht.':
    'The bar shows how well you can work on an open colony in that hour: temperature, wind, '
    + 'precipitation, cloud cover and daylight.',
  'Die nächsten Tage': 'The next few days',
  'Betroffene Aufgaben ({n})': 'Affected tasks ({n})',
  'Quelle: Open-Meteo, stündlich aktualisiert. Die Bewertung ist eine Faustregel – der Blick zum Flugloch bleibt die bessere Auskunft.':
    'Source: Open-Meteo, updated hourly. The rating is a rule of thumb – watching the entrance '
    + 'still tells you more.',
  'Für diesen Standort liegen keine Wetterdaten vor.': 'No weather data for this apiary.',
  // Eignung
  gut: 'good',
  mäßig: 'fair',
  ungünstig: 'poor',
  gereizt: 'edgy',
  'Wetter ungünstig': 'Weather unsuitable',
  'Bienen wahrscheinlich gereizt': 'Bees likely to be edgy',
  'Wetter nur mäßig': 'Weather only fair',
  'besser {wann}': 'better {wann}',
  'Günstiger wäre es {wann}.': 'It would be better {wann}.',
  'Gute Bedingungen für diese Arbeit.': 'Good conditions for this job.',
  'Nur mäßig geeignet.': 'Only moderately suitable.',
  'Das Wetter passt für diese Arbeit gerade nicht.':
    'The weather is not right for this job at the moment.',
  'Ungünstig – und die Bienen dürften gereizt sein.':
    'Unsuitable – and the bees are likely to be edgy.',
  'Das Wetter selbst wäre in Ordnung – die Bienen dürften aber gereizt sein.':
    'The weather itself would be fine – but the bees are likely to be edgy.',
  'Nur mäßig geeignet, dazu dürften die Bienen gereizt sein.':
    'Only moderately suitable, and the bees are likely to be edgy on top of that.',
  'Grund für die Reizlage: {gruende}. Ruhig arbeiten, Schleier auf, Rauch bereithalten.':
    'Why they are edgy: {gruende}. Work calmly, veil on, smoker at hand.',
  'Das gibt sich in den nächsten Tagen nicht – kurz arbeiten, nichts offen stehen lassen, keine Waben herumtragen.':
    'This will not pass in the next few days – work briefly, leave nothing open, do not carry combs around.',
  'Pollen': 'Pollen',
  'Pollen in der Zelle': 'Pollen in the cell',
  'kein Pollen – Honigtau wird von Läusen abgegeben und nur als Nektar eingetragen.':
    'no pollen – honeydew is excreted by aphids and brought in as nectar only.',
  'Die Pollenfarben folgen den gängigen Bestimmungstafeln und schwanken mit Alter und Feuchte des Höschens – als Anhaltspunkt auf der Wabe und am Flugloch reichen sie.':
    'The pollen colours follow the usual identification charts and vary with the age and moisture '
    + 'of the pellet – as a pointer on the comb and at the entrance they are good enough.',
  // Pollenfarben je Art
  'blassgelb bis grünlichgelb. Meist die erste Farbe des Jahres, in schmalen Kränzen am Rand des Brutnestes.':
    'pale yellow to greenish yellow. Usually the first colour of the year, in narrow rims at the '
    + 'edge of the brood nest.',
  'ockergelb bis gelbbraun, oft direkt neben dem helleren Haselpollen in derselben Wabe.':
    'ochre to yellow-brown, often right next to the paler hazel pollen in the same comb.',
  'kräftig chromgelb – das erste satte Gelb im Kranz um die Brut. Wird sofort verfüttert, liegt also selten lange.':
    'strong chrome yellow – the first rich yellow in the rim around the brood. It is fed straight '
    + 'away, so it rarely sits for long.',
  'gelblich-grün bei Apfel, graubraun bei Kirsche und Pflaume. In der Obstblüte liegen deshalb oft mehrere Farben nebeneinander.':
    'yellowish green from apple, greyish brown from cherry and plum. During the fruit bloom you '
    + 'will often see several colours side by side.',
  'leuchtend orange – die auffälligste Frühjahrsfarbe. Ganze Wabenseiten können orange leuchten, die Höschen an den Bienen ebenso.':
    'bright orange – the most conspicuous spring colour. Whole comb faces can glow orange, and so '
    + 'do the pellets on the bees.',
  'kräftig gelb, feucht glänzend. Kommt in Massen herein, wird zügig festgestampft und verdeckelt.':
    'strong yellow with a moist sheen. It comes in by the load, is packed down quickly and capped.',
  'blass bräunlich-weiß und unauffällig – Robinie liefert vor allem Nektar, wenig Pollen.':
    'pale brownish white and inconspicuous – black locust yields mostly nectar, little pollen.',
  'blassgelb bis hellgrün, meist nur in kleinen Mengen zwischen dem vielen Nektar.':
    'pale yellow to light green, usually only in small amounts amid all the nectar.',
  'Phacelia dunkelblau bis graublau-violett – die auffälligste Pollenfarbe überhaupt, in der Zelle fast schiefergrau. Senf dagegen hellgelb.':
    'Phacelia is dark blue to greyish blue-violet – the most striking pollen colour there is, almost '
    + 'slate grey in the cell. Mustard, by contrast, is pale yellow.',
  'gelbbraun bis rotbraun, spät im Jahr eingetragen und oft die letzte frische Farbe vor dem Winter.':
    'yellow-brown to red-brown, brought in late in the year and often the last fresh colour before winter.',
  'weiß bis hellgrau. Am sichersten am Flugloch zu erkennen: die Bienen kommen weiß bestäubt heim.':
    'white to light grey. Easiest to spot at the entrance: the bees come home dusted white.',
  // Zeitfenster
  früh: 'morning',
  mittags: 'midday',
  nachmittags: 'afternoon',
  abends: 'evening',
  '{tag} {teil}, {von}–{bis} Uhr': '{tag} {teil}, {von}:00–{bis}:00',
  '{tag} {teil}, ab {von} Uhr': '{tag} {teil}, from {von}:00',
  // Bewertungsgründe
  Dunkelheit: 'darkness',
  'zu kalt ({t} °C)': 'too cold ({t} °C)',
  'kühl ({t} °C)': 'chilly ({t} °C)',
  'zu heiß ({t} °C)': 'too hot ({t} °C)',
  'sehr warm ({t} °C)': 'very warm ({t} °C)',
  Niederschlag: 'precipitation',
  'Regenrisiko {n} %': '{n} % chance of rain',
  'starker Wind ({n} km/h)': 'strong wind ({n} kph)',
  'windig ({n} km/h)': 'windy ({n} kph)',
  'Böen bis {n} km/h': 'gusts up to {n} kph',
  Gewitter: 'thunderstorm',
  'bedeckt – die Flugbienen sitzen zu Hause': 'overcast – the foragers are all at home',
  'Gewitter in den nächsten Stunden': 'thunderstorms in the next few hours',
  'rasch fallender Luftdruck': 'rapidly falling air pressure',
  'kühl und bedeckt – die ganze Flugbiene sitzt im Stock':
    'chilly and overcast – every forager is inside the hive',
  'starker Wind': 'strong wind',
  Regen: 'rain',
  schwül: 'muggy',
  'Trachtlücke – Räubereigefahr': 'forage gap – risk of robbing',
  // Wetterlagen (WMO)
  klar: 'clear',
  'überwiegend klar': 'mostly clear',
  'teils bewölkt': 'partly cloudy',
  bedeckt: 'overcast',
  Nebel: 'fog',
  Reifnebel: 'rime fog',
  'leichter Niesel': 'light drizzle',
  Niesel: 'drizzle',
  'starker Niesel': 'heavy drizzle',
  'gefrierender Niesel': 'freezing drizzle',
  'leichter Regen': 'light rain',
  'starker Regen': 'heavy rain',
  'gefrierender Regen': 'freezing rain',
  'leichter Schneefall': 'light snow',
  Schneefall: 'snow',
  'starker Schneefall': 'heavy snow',
  Schneegriesel: 'snow grains',
  Regenschauer: 'rain showers',
  'kräftige Schauer': 'heavy showers',
  Schneeschauer: 'snow showers',
  'Gewitter mit Hagel': 'thunderstorm with hail',
  unbestimmt: 'unsettled',
  // Kalender
  'Jede offene Aufgabe steht genau einmal im Kalender: an ihrem nächsten Arbeitstag. Bleibt sie liegen, rückt sie mit jedem vergangenen Tag einen Tag weiter. Tippen für die Liste.':
    'Every open task appears exactly once in the calendar: on its next working day. If it is left '
    + 'undone, it moves on by one day for every day that passes. Tap for the list.',
  // --------------------------------------------------------------- Stand-Modus
  Durchgang: 'Round',
  'Durchgang am Bienenstand': 'Round at the apiary',
  'Durchgang an diesem Stand': 'Round at this apiary',
  'Durchgang starten': 'Start a round',
  'An welchem Bienenstand stehst du?': 'Which apiary are you at?',
  'Kein Bienenstand ausgewählt.': 'No apiary selected.',
  'An diesem Bienenstand steht noch kein Volk.': 'There is no colony at this apiary yet.',
  'Volk {i} von {n}': 'Colony {i} of {n}',
  'vorheriges Volk': 'previous colony',
  'nächstes Volk': 'next colony',
  'zuletzt durchgesehen {d} (vor {n} Tagen)': 'last inspected {d} ({n} days ago)',
  'noch keine Durchsicht erfasst': 'no inspection recorded yet',
  'Offen an diesem Volk': 'Open for this colony',
  'Antippen hakt ab. Für Angaben wie Erntemenge oder Präparat den Knopf rechts nehmen.':
    'Tap to tick off. For details such as yield or product use the button on the right.',
  Kurzbefund: 'Quick findings',
  'Besetzte Wabengassen': 'Seams of bees',
  'Gassen, in denen Bienen sitzen – nicht die Futterwaben':
    'seams the bees are sitting in – not the stores',
  'Königin gesehen': 'queen seen',
  'frei diktierbar über die Mikrofontaste der Tastatur':
    'dictate freely with the microphone key on your keyboard',
  'Speichern und weiter': 'Save and continue',
  'Ohne Befund': 'Nothing to report',
  '„Ohne Befund" trägt ein: weiselrichtig, keine Schwarmstimmung, keine Weiselzellen – und geht weiter.':
    '"Nothing to report" records: queenright, no swarming mood, no queen cells – and moves on.',
  'Durchgang beenden': 'End the round',
  'Durchgang fertig': 'Round complete',
  'Völker erfasst': 'colonies recorded',
  'Aufgaben erledigt': 'tasks done',
  'neu ausgelöst': 'newly triggered',
  'Am Stand selbst': 'At the apiary itself',
  Fertig: 'Done',
  Details: 'Details',
  'Nichts eingetragen – trotzdem weiter.': 'Nothing entered – moving on anyway.',
  'Durchgang gespeichert: {v} Völker, {a} Aufgaben.': 'Round saved: {v} colonies, {a} tasks.',
  'Durchgang beendet.': 'Round ended.',
  'Erst Völker anlegen.': 'Add colonies first.',
  // ----------------------------------------------------------------- Aufkleber
  'QR-Aufkleber für die Beuten': 'QR labels for the hives',
  'Kamera des Handys darauf halten – die Stockkarte dieses Volkes geht auf.':
    'Point your phone camera at it – the record for that colony opens.',
  'Ein Aufkleber je Volk, zwei Spalten auf A4. Am besten auf Klebefolie drucken oder einschweißen – im Stockbereich wird alles feucht. Gescannt wird mit der normalen Kamera-App, die App braucht dafür keine Rechte.':
    'One label per colony, two columns on A4. Print on adhesive film or laminate them – '
    + 'everything around a hive gets damp. Scanning is done with the ordinary camera app, '
    + 'so BeeWise needs no camera permission.',
  'Die App läuft gerade nicht unter einer Web-Adresse. Trage unten die Adresse ein, unter der du BeeWise am Handy öffnest – sonst zeigt der Aufkleber ins Leere.':
    'The app is not running under a web address right now. Enter below the address you use to '
    + 'open BeeWise on your phone – otherwise the label leads nowhere.',
  'Welche Völker': 'Which colonies',
  'Adresse der App': 'Address of the app',
  'Diese Adresse öffnet der Aufkleber. Muss die veröffentlichte sein, nicht die Datei auf dem PC.':
    'This is the address the label opens. It must be the published one, not the file on your PC.',
  'Bitte eine vollständige Web-Adresse eintragen.': 'Please enter a complete web address.',
  'Keine Völker ausgewählt.': 'No colonies selected.',
  '{n} Aufkleber erstellt.': '{n} labels created.',
  'Zu diesem Aufkleber gibt es auf diesem Gerät kein Volk – fehlt der Abgleich?':
    'There is no colony for this label on this device – is the sync missing?',

  // ------------------------------- Königinnen, Ableger, Fotos, Anfütterung
  'Wenn nötig: erste kleine Futtergabe': 'If needed: a first small feed',
  'Erste Futtergabe': 'First feed',
  'Nach der Ernte ist der Vorrat aus dem Volk heraus und draußen herrscht meist Trachtlücke. Wiegt ein Volk auffällig leicht, ist eine kleine Gabe von etwa zwei bis fünf Kilo VOR der ersten Behandlung üblich – ein hungerndes Volk verträgt die Ameisensäure schlechter. Nicht voll auffüttern: die Säure braucht Platz zum Verdunsten, und die Hauptmenge kommt ohnehin erst nach der ersten Behandlung. Abends geben, nichts verschütten – in der Trachtlücke ist Räuberei schnell da. Und das Wichtigste: die Behandlung deswegen nicht verschieben.':
    'After the harvest the stores are out of the hive and outside there is usually a forage gap. '
    + 'If a colony feels noticeably light, a small feed of roughly two to five kilos BEFORE the '
    + 'first treatment is common practice – a starving colony tolerates formic acid less well. Do '
    + 'not feed up fully: the acid needs room to evaporate, and the bulk of the winter feed comes '
    + 'after the first treatment anyway. Feed in the evening, spill nothing – in a forage gap '
    + 'robbing starts quickly. And most importantly: do not delay the treatment because of it.',
  'Volk angehoben – wirkt es leicht?': 'Hive lifted – does it feel light?',
  'Abends gefüttert': 'Fed in the evening',
  'Nichts verschüttet': 'Nothing spilled',
  'Futtergeschirr dicht': 'Feeder tight',
  'Gegebene Menge': 'Amount given',
  'Richtwert 2–5 kg. Die große Menge kommt nach der ersten Behandlung.':
    'Guide value 2–5 kg. The large amount comes after the first treatment.',
  'Anfüttern nach der letzten Ernte vor der Behandlung':
    'feeding after the last harvest before treatment',
  'Volk hungert nicht (sonst vorher 2–3 kg geben)':
    'Colony is not starving (otherwise give 2–3 kg first)',
  'Königinnen': 'Queens',
  'Königin ersetzen (Umweiseln)': 'Replace the queen (requeening)',
  'Diese Königin geht in ihre dritte Saison. Ältere Königinnen legen weniger, das Volk neigt stärker zum Schwärmen und die Weiselrichtigkeit wird unsicherer. Wer planmäßig umweiselt, hat ruhigere und stärkere Völker – und weiß, was er im Volk hat. Zeitfenster: solange Drohnen fliegen und der Anpaarung noch Sommer bleibt.':
    'This queen is entering her third season. Older queens lay less, the colony is more inclined '
    + 'to swarm and queenrightness becomes less reliable. Requeening on a plan gives calmer, '
    + 'stronger colonies – and you know what you have. Window: while drones are still flying and '
    + 'there is enough summer left for mating.',
  'Alte Königin gefunden und entnommen': 'Old queen found and removed',
  'Zusetzverfahren vorbereitet': 'Introduction method prepared',
  'Nach 9 Tagen Nachschaffungszellen brechen': 'Break emergency cells after 9 days',
  'Legebeginn nach 3 Wochen prüfen': 'Check for eggs after 3 weeks',
  'Umweiseln Königin zusetzen Verfahren': 'requeening introducing a queen method',
  'Standbegattung': 'open mating',
  'Belegstelle': 'mating station',
  'künstlich besamt': 'instrumentally inseminated',
  'Nachschaffung': 'emergency queen',
  'umgeweiselt': 'requeened',
  'verloren': 'lost',
  'abgeschwärmt': 'swarmed off',
  'Volk aufgelöst': 'colony dissolved',
  'Carnica': 'Carnica',
  'Buckfast': 'Buckfast',
  'Dunkle Biene': 'Dark bee',
  'Ligustica': 'Ligustica',
  'Mischling': 'crossbred',
  'weiß': 'white',
  'gelb': 'yellow',
  'rot': 'red',
  'grün': 'green',
  'blau': 'blue',
  'Königin {jahr} eingesetzt': 'Queen {jahr} introduced',
  'von Volk {name}': 'from colony {name}',
  'Königin {jahr} beendet: {grund}': 'Queen {jahr} ended: {grund}',
  'Jungvolk {jahr}': 'Nucleus colony {jahr}',
  'Bisher ist nur der Jahrgang {jahr} vermerkt. Erfasse die Königin, dann führt BeeWise Alter, Herkunft und Abstammung mit – und meldet sich, wenn Umweiseln ansteht.':
    'So far only the year {jahr} is noted. Record the queen and BeeWise keeps track of age, '
    + 'origin and parentage – and speaks up when requeening is due.',
  'Noch keine Königin erfasst.': 'No queen recorded yet.',
  'Königin erfassen': 'Record the queen',
  'Jahrgang {jahr}': 'Year {jahr}',
  'Zeichenfarbe {farbe}': 'marking colour {farbe}',
  'dieses Jahr': 'this year',
  'zweite Saison': 'second season',
  '{n}. Saison': 'season {n}',
  'Umweiseln prüfen': 'consider requeening',
  'Züchter oder Belegstelle': 'Breeder or mating station',
  'Muttervolk': 'Mother colony',
  'Im Volk seit': 'In the colony since',
  'Vorgängerinnen': 'Predecessors',
  'Jahrgang': 'Year',
  'Bestimmt die Zeichenfarbe nach dem internationalen Code.':
    'Determines the marking colour under the international code.',
  'Muttervolk (Abstammung)': 'Mother colony (parentage)',
  'Königin bearbeiten': 'Edit queen',
  'Königin gespeichert.': 'Queen saved.',
  'Diesen Königinnen-Eintrag löschen?': 'Delete this queen entry?',
  'bisher Jahrgang {jahr}': 'previously year {jahr}',
  'Die alte Königin wird mit Datum und Grund abgeschlossen und bleibt im Verlauf stehen. Die neue kommt als eigener Eintrag dazu – so bleibt die Reihe nachvollziehbar. Nach etwa drei Wochen prüfen, ob die neue Königin legt.':
    'The old queen is closed off with a date and a reason and stays in the history. The new one '
    + 'is added as her own entry, so the succession stays traceable. Check after about three weeks '
    + 'whether the new queen is laying.',
  'Was ist mit der alten Königin': 'What happened to the old queen',
  'Die neue Königin': 'The new queen',
  'Nur alte beenden': 'Only close the old one',
  'Umweiseln eintragen': 'Record requeening',
  'Umweiselung eingetragen.': 'Requeening recorded.',
  'Königin beendet.': 'Queen closed.',
  'Legebeginn prüfen ({volk})': 'Check for eggs ({volk})',
  'Etwa drei Wochen nach dem Umweiseln: legt die neue Königin? Sonst Weiselprobe mit offener Brut aus einem anderen Volk.':
    'About three weeks after requeening: is the new queen laying? If not, test with open brood '
    + 'from another colony.',
  'Drei bis vier Wochen nach der Bildung: legt die junge Königin? Wenn nicht, Weiselprobe mit offener Brut aus einem anderen Volk.':
    'Three to four weeks after making it up: is the young queen laying? If not, test with open '
    + 'brood from another colony.',
  '{n} Ableger als Völker anlegen': 'Create {n} nucleus colonies',
  'gebildet aus {name} am {d}': 'made up from {name} on {d}',
  'Jeder Ableger bekommt seine eigene Stockkarte, den Verweis auf das Muttervolk und den Jungvolkstatus – dadurch rechnet BeeWise weniger Winterfutter und legt in drei Wochen die Kontrolle auf Legebeginn an.':
    'Each nucleus gets its own record, a link to the mother colony and nucleus status – so '
    + 'BeeWise calculates less winter feed and schedules the laying check in three weeks.',
  'Bezeichnung {i}': 'Name {i}',
  'Später': 'Later',
  '{n} Ableger angelegt.': '{n} nucleus colonies created.',
  'Kunstschwarm': 'package / artificial swarm',
  'Wirtschaftsvolk': 'production colony',
  'Gebildet am': 'Made up on',
  'Nur bei Ablegern und Schwärmen. Im Jahr der Bildung rechnet die App mit Jungvolk – weniger Winterfutter, kein Honigraum.':
    'Only for nuclei and swarms. In the year it was made up the app treats it as a nucleus – '
    + 'less winter feed, no supers.',
  'gebildet am {d}': 'made up on {d}',
  'Fotos': 'Photos',
  '+ Foto aufnehmen': '+ Take a photo',
  'Bleibt auf diesem Gerät und wandert nicht in den Geräteabgleich.':
    'Stays on this device and is not carried into the device sync.',
  'entfernen': 'remove',
  'Foto': 'Photo',
  'Foto löschen': 'Delete photo',
  'Foto nicht gefunden.': 'Photo not found.',
  'Foto gelöscht.': 'Photo deleted.',
  'Fotos werden gezählt …': 'Counting photos …',
  'Bildgröße neuer Fotos': 'Size of new photos',
  'sparsam (800 Punkte, ca. 60 kB)': 'frugal (800 px, approx. 60 kB)',
  'normal (1024 Punkte, ca. 100 kB)': 'normal (1024 px, approx. 100 kB)',
  'genau (1600 Punkte, ca. 250 kB)': 'detailed (1600 px, approx. 250 kB)',
  'Alte Fotos löschen': 'Delete old photos',
  'Fotos liegen nur auf diesem Gerät: sie gehen in die Sicherungsdatei mit, nicht in den Geräteabgleich. Sonst würde das Abgleich-Repository mit jeder Woche wachsen.':
    'Photos live on this device only: they go into the backup file, but not into the device '
    + 'sync. Otherwise the sync repository would grow week by week.',
  'Fotos: {n} · etwa {gr}': 'Photos: {n} · about {gr}',
  'Noch keine Fotos gespeichert.': 'No photos stored yet.',
  'Es gibt noch keine Fotos.': 'There are no photos yet.',
  'Gelöscht werden alle Fotos VOR dem gewählten Jahr. Die Durchsichten selbst bleiben vollständig erhalten – nur die Bilder verschwinden.':
    'All photos BEFORE the selected year are deleted. The inspections themselves stay complete – '
    + 'only the images go.',
  '{jahr}: {n} Bilder': '{jahr}: {n} images',
  'Behalten ab Jahr': 'Keep from year',
  '{n} Fotos gelöscht.': '{n} photos deleted.',
  'Bildgröße gespeichert.': 'Image size saved.',
  'Stand bearbeiten': 'Edit apiary',
  'Zuerst einen Bienenstand anlegen – aus seiner Lage rechnet BeeWise Tracht und Termine.':
    'Add an apiary first – BeeWise derives forage and timing from its location.',
};
