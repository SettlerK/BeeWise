// Regelkatalog – das fachliche Herz der App.
// =============================================================================
// Jede Regel beschreibt eine imkerliche Aufgabe und vor allem, WORAN ihr Termin
// hängt. Vier Ankerarten:
//
//   datum        – festes Kalenderfenster (nur wo wirklich der Kalender zählt)
//   bluete       – relativ zum Blühbeginn/-ende einer Trachtpflanze am Standort
//   nachAufgabe  – relativ zum tatsächlichen Erledigungsdatum einer anderen
//                  Aufgabe. Das ist die dynamische Abhängigkeit: verschiebt sich
//                  die Ernte um zehn Tage, verschiebt sich die Behandlung mit.
//   wetter       – relativ zu einem aus Temperaturdaten abgeleiteten Ereignis
//
// `fenster: [a, b]` = frühestens a Tage, spätestens b Tage nach dem Anker.
// `wiederholung` = Abstand zur eigenen letzten Erledigung (nicht zum Kalender).
// `hilfe`        = Suchbegriff für die Videohilfe (siehe js/hilfe.js).

import { t } from './i18n.js';

export const KATEGORIEN = {
  fruehjahr: { name: 'Frühjahr', farbe: '#5E9455' },
  schwarm: { name: 'Schwarm', farbe: '#6D74B8' },
  honig: { name: 'Honig', farbe: '#D9822B' },
  varroa: { name: 'Varroa', farbe: '#C24B3D' },
  winter: { name: 'Einwinterung', farbe: '#4B77A6' },
  koenigin: { name: 'Königinnen', farbe: '#A6789B' },
  betrieb: { name: 'Betrieb', farbe: '#7A7266' },
  eigene: { name: 'Eigene', farbe: '#8A6BA8' },
};

const F = {
  notiz: { key: 'notiz', label: 'Notiz', typ: 'text' },
  kg: (label = 'Menge') => ({ key: 'kg', label, typ: 'zahl', einheit: 'kg', schritt: 0.5 }),
  milben: {
    key: 'milbenProTag', label: 'Natürlicher Milbenfall', typ: 'zahl',
    einheit: 'Milben pro Tag', schritt: 0.5,
    hinweis: 'Gesamtzahl auf der Windel geteilt durch die Zahl der Tage.',
  },
  gassen: { key: 'gassen', label: 'Von Bienen besetzte Wabengassen', typ: 'zahl', einheit: 'Gassen', schritt: 1,
    hinweis: 'Gassen zählen, in denen Bienen sitzen – nicht die Futterwaben.' },
};

// --------------------------------------------------------------- Fütterung
// Der Imker füttert in Litern (oder in Ballons), die Regel rechnet in Kilo
// Winterfutter. Die Umrechnung steht hier, weil sie imkerliches Wissen ist –
// und an genau einer Stelle, damit Aufgabe, Futterkarte und Rechner dieselbe
// Zahl verwenden.
//
// Grundlage: 1 kg Zucker ergibt rund 1 kg Winterfutter.
//   Fertigsirup (Invertzucker) ~73 % Zucker bei 1,4 kg/l  → 1,0 kg je Liter
//   Zuckerwasser 3:2 (3 kg Zucker auf 2 l Wasser)          → 0,77 kg je Liter
//   Zuckerwasser 1:1 (1 kg Zucker auf 1 l Wasser)          → 0,61 kg je Liter
//   Futterteig                                              → 1,0 kg je Kilo
// Ein 2-Liter-Ballon 3:2 bringt also rund 1,5 kg Winterfutter.

/** Übliche Ballongröße. Zwei Liter, weil mehr nicht hineingeht. */
export const BALLON_LITER = 2;

export const FUTTERMITTEL = [
  { name: 'Fertigsirup (Invertzucker)', einheit: 'l', kgJeEinheit: 1.0 },
  { name: 'Zuckerwasser 3:2', einheit: 'l', kgJeEinheit: 0.77 },
  { name: 'Zuckerwasser 1:1', einheit: 'l', kgJeEinheit: 0.61 },
  { name: 'Futterteig', einheit: 'kg', kgJeEinheit: 1.0 },
];

export const futtermittelNach = (name) =>
  FUTTERMITTEL.find((m) => m.name === name) || null;

/** Menge in der Einheit des Futtermittels → kg Winterfutter (Faustwert). */
export function kgAusMenge(mittelName, menge) {
  const m = futtermittelNach(mittelName);
  const z = Number(menge);
  if (!m || !z || Number.isNaN(z)) return null;
  return Math.round(z * m.kgJeEinheit * 10) / 10;
}

/**
 * Felder einer Futtergabe: erfasst wird die MENGE wie gefüttert, die Kilo
 * Winterfutter rechnet die App daraus – überschreibbar, weil Faustwerte
 * Faustwerte sind.
 */
const FUTTER_FELDER = (mengeLabel = 'Gegebene Menge') => [
  { key: 'futtermittel', label: 'Futtermittel', typ: 'auswahl',
    optionen: FUTTERMITTEL.map((m) => m.name), standard: 'Zuckerwasser 3:2' },
  { key: 'menge', label: mengeLabel, typ: 'zahl', einheit: 'Liter (Teig: kg)', schritt: 0.5,
    hinweis: 'Ein 2-Liter-Ballon: 2 eintragen, zwei Ballons: 4. Nur DIESE Gabe, nicht die '
      + 'Summe – die rechnet BeeWise.' },
  { key: 'kg', label: 'Ergibt Winterfutter', typ: 'zahl', einheit: 'kg', schritt: 0.1,
    abgeleitet: { aus: ['menge', 'futtermittel'],
      rechne: (w) => kgAusMenge(w.futtermittel, w.menge) },
    hinweis: 'Faustwert aus Menge und Futtermittel; lässt sich überschreiben.' },
  F.notiz,
];

/** Ameisensäure-Anwendung: Menge hängt an Verdunster und Beutenvolumen. */
const AS_FELDER = [
  {
    key: 'praeparat', label: 'Präparat', typ: 'auswahl',
    optionen: ['Ameisensäure 60 %', 'Ameisensäure 85 %', 'Milchsäure 15 %', 'Thymol-Präparat', 'anderes'],
  },
  {
    key: 'anwendung', label: 'Verdunster', typ: 'auswahl',
    optionen: ['Schwammtuch von oben', 'Nassenheider professionell', 'Liebig-Dispenser',
      'Universalverdunster', 'Sprühbehandlung'],
  },
  {
    key: 'menge', label: 'Eingesetzte Menge', typ: 'zahl', einheit: 'ml je Volk', schritt: 5,
    hinweis: 'Richtwerte: Schwammtuch 1 ml je Liter Beutenvolumen (Zander-Zarge ≈ 40 ml, '
      + 'zwei Zargen ≈ 80 ml). Liebig-Dispenser 120–180 ml über 3–5 Tage. '
      + 'Verbindlich ist die Packungsbeilage deines Präparats.',
  },
  { key: 'windel', label: 'Stockwindel eingelegt', typ: 'jaNein' },
  F.notiz,
];

export const REGELN = [
  // ------------------------------------------------------------------ Frühjahr
  {
    id: 'winterkontrolle',
    titel: 'Stand kontrollieren, Flugloch frei räumen',
    kategorie: 'winter', ziel: 'stand',
    info: 'Nicht öffnen. Nur Flugloch frei machen, Beute auf Sturm- und Spechtschäden ansehen, kurz an die Zarge klopfen.',
    checkliste: ['Flugloch frei', 'Beute unbeschädigt', 'Klopfprobe: Antwort?', 'Totenfall am Boden'],
    anker: { typ: 'datum', von: [11, 1], bis: [3, 1] },
    wiederholung: { min: 21, max: 35 },
    felder: [F.notiz],
  },
  {
    id: 'gewichtskontrolle',
    titel: 'Futtervorrat prüfen (anheben oder wiegen)',
    kategorie: 'winter', ziel: 'volk',
    info: 'Hinten anheben. Wird es leicht, im Spätwinter Futterteig direkt über den Sitz legen – nicht Zuckerwasser.',
    anker: { typ: 'datum', von: [11, 1], bis: [3, 20] },
    wiederholung: { min: 25, max: 40 },
    hilfe: 'Futterkontrolle Winter Bienen',
    felder: [{ key: 'futter', label: 'Geschätzter Vorrat', typ: 'zahl', einheit: 'kg', schritt: 1 },
      { key: 'gewicht', label: 'Gewicht gewogen', typ: 'zahl', einheit: 'kg', schritt: 0.5,
        hinweis: 'Kofferwaage an der Hinterkante. Aus zwei Wägungen rechnet BeeWise die '
          + 'Zehrung und sagt, wie lange der Vorrat reicht.' },
      F.notiz],
  },
  {
    id: 'reinigungsflug',
    titel: 'Reinigungsflug beobachten',
    kategorie: 'fruehjahr', ziel: 'stand',
    info: 'Der erste warme Tag zeigt ohne Eingriff, welches Volk lebt. Flugbild je Volk notieren.',
    anker: { typ: 'wetter', ereignis: 'ersterWarmtag', ersatz: [2, 20] },
    fenster: [0, 21],
    felder: [F.notiz],
  },
  {
    id: 'erste_durchsicht',
    titel: 'Erste Durchsicht: Futter, Brut, Weiselrichtigkeit',
    kategorie: 'fruehjahr', ziel: 'volk', wichtig: true,
    info: 'Kurz und zügig, höchstens fünf Minuten. Ziel: lebt die Königin, ist Brut in allen Stadien da, reicht das Futter?',
    checkliste: ['Brut in allen Stadien', 'Futterkranz vorhanden', 'Stockwindel gereinigt', 'Totenfall entfernt'],
    anker: { typ: 'wetter', ereignis: 'durchsichtWetter', ersatz: [3, 10] },
    fenster: [0, 28],
    hilfe: 'erste Durchsicht Frühjahr Auswinterung',
    felder: [
      F.gassen,
      { key: 'brut', label: 'Brutbild', typ: 'chips', optionen: ['Stifte', 'offene Brut', 'verdeckelte Brut', 'brutfrei'] },
      { key: 'koenigin', label: 'Weiselzustand', typ: 'chips', optionen: ['weiselrichtig', 'unsicher', 'weisellos'] },
      { key: 'futter', label: 'Futter geschätzt', typ: 'zahl', einheit: 'kg', schritt: 1 },
      F.notiz,
    ],
  },
  {
    id: 'boden_waben',
    titel: 'Boden reinigen, alte Waben entnehmen',
    kategorie: 'fruehjahr', ziel: 'volk',
    info: 'Dunkle Waben aus dem Randbereich raus. Beim selben Eingriff wie das erste Erweitern.',
    anker: { typ: 'nachAufgabe', regel: 'erste_durchsicht' },
    fenster: [0, 28],
    benoetigt: ['erste_durchsicht'],
    hilfe: 'Wabenhygiene alte Waben ausmustern',
    felder: [{ key: 'waben', label: 'Entnommene Waben', typ: 'zahl', einheit: 'Stück',
      schritt: 1 }, F.notiz],
  },
  {
    id: 'erweitern',
    titel: 'Erweitern: Zarge aufsetzen',
    kategorie: 'fruehjahr', ziel: 'volk', wichtig: true,
    info: 'Auslöser: 7–8 Waben dicht besetzt und der Löwenzahn beginnt. Lieber eine Woche zu früh als zu spät – Enge erzeugt Schwarmstimmung.',
    anker: { typ: 'bluete', art: 'loewenzahn', ereignis: 'start' },
    fenster: [-10, 21],
    benoetigt: ['erste_durchsicht'],
    hilfe: 'Volk erweitern Zarge aufsetzen',
    felder: [{ key: 'zargen', label: 'Zargen danach', typ: 'zahl', einheit: 'Zargen', schritt: 1 },
      F.notiz],
  },
  {
    id: 'baurahmen',
    titel: 'Baurahmen geben',
    kategorie: 'varroa', ziel: 'volk',
    info: 'Der Baurahmen ist Wachsbau, Schwarmbremse und Varroafalle in einem.',
    anker: { typ: 'nachAufgabe', regel: 'erweitern' },
    fenster: [0, 14],
    benoetigt: ['erweitern'],
    hilfe: 'Baurahmen Drohnenrahmen einsetzen',
    felder: [F.notiz],
  },

  // -------------------------------------------------------------- Schwarmzeit
  {
    id: 'schwarmkontrolle',
    titel: 'Schwarmkontrolle – Weiselzellen brechen',
    kurz: 'Schwarmkontrolle',
    kategorie: 'schwarm', ziel: 'volk', wichtig: true,
    info: 'Alle 7 bis 9 Tage, lückenlos. Neun Tage ist die Obergrenze: danach kann eine übersehene Zelle bereits verdeckelt sein und das Volk zieht ab.',
    checkliste: ['Alle Waben gezogen', 'Weiselzellen gebrochen', 'Platz ausreichend', 'Baurahmen geschnitten'],
    anker: { typ: 'bluete', art: 'obstbluete', ereignis: 'start' },
    fenster: [-7, 0],
    saisonEnde: [7, 5],
    wiederholung: { min: 7, max: 9 },
    hilfe: 'Schwarmkontrolle Weiselzellen brechen',
    felder: [
      { key: 'zellen', label: 'Weiselzellen gefunden', typ: 'zahl', einheit: 'Stück', schritt: 1 },
      { key: 'stimmung', label: 'Schwarmstimmung', typ: 'chips', optionen: ['keine', 'Spielnäpfchen', 'bestiftet', 'verdeckelt'] },
      F.notiz,
    ],
  },
  {
    id: 'ableger',
    titel: 'Ableger oder Kunstschwarm bilden',
    kategorie: 'schwarm', ziel: 'volk', freiwillig: true,
    info: 'Aus der Schwarmstimmung heraus. Den brutfreien Ableger sofort mit Oxalsäure behandeln – die einzige Gelegenheit im Sommer.',
    anker: { typ: 'bluete', art: 'raps', ereignis: 'start' },
    fenster: [0, 45],
    aktion: 'ableger',
    hilfe: 'Ableger bilden Anleitung',
    felder: [
      { key: 'anzahl', label: 'Gebildete Ableger', typ: 'zahl', einheit: 'Stück', schritt: 1 },
      { key: 'behandelt', label: 'Ableger mit Oxalsäure behandelt', typ: 'jaNein' },
      F.notiz,
    ],
  },

  // -------------------------------------------------------------------- Honig
  {
    id: 'honigraum',
    titel: 'Honigraum aufsetzen (mit Absperrgitter)',
    kategorie: 'honig', ziel: 'volk', wichtig: true,
    info: 'Zum Blühbeginn der ersten Massentracht. Zweiter Honigraum, sobald der erste zu zwei Dritteln gefüllt ist.',
    anker: { typ: 'bluete', art: 'raps', ereignis: 'start' },
    fenster: [-10, 14],
    benoetigt: ['erweitern'],
    hilfe: 'Honigraum aufsetzen Absperrgitter',
    felder: [{ key: 'honigraeume', label: 'Honigräume danach', typ: 'zahl', einheit: 'Stück',
      schritt: 1 }, F.notiz],
  },
  {
    id: 'fruehtracht',
    titel: 'Frühtracht ernten und schleudern',
    kategorie: 'honig', ziel: 'volk',
    info: 'Auslöser: Raps ist verblüht. Erst ernten, wenn zwei Drittel verdeckelt sind oder die Spritzprobe nichts hergibt (unter 18 % Wasser). Rapshonig zügig verarbeiten, er kristallisiert im Rähmchen.',
    checkliste: ['2/3 verdeckelt oder Spritzprobe negativ', 'Wassergehalt gemessen', 'Bienen abgekehrt/abgeblasen'],
    anker: { typ: 'bluete', art: 'raps', ereignis: 'ende' },
    fenster: [-3, 21],
    benoetigt: ['honigraum'],
    // Mehrfach ernten ist der Normalfall, nicht die Ausnahme: Raps, dann
    // Robinie oder Frühsommerblüte. Nach der ersten Ernte kommt die Aufgabe
    // deshalb wieder – aber als Angebot (siehe wiederholungFreiwillig), damit
    // sie niemanden drängt, der nur einmal schleudert.
    wiederholung: { min: 12, max: 40 },
    wiederholungFreiwillig: true,
    saisonEnde: [7, 10],
    hilfe: 'Honig ernten schleudern Wassergehalt',
    felder: [
      F.kg('Erntemenge'),
      { key: 'wasser', label: 'Wassergehalt', typ: 'zahl', einheit: '% (Refraktometer)', schritt: 0.1 },
      F.notiz,
    ],
  },
  {
    id: 'sommertracht',
    titel: 'Sommertracht ernten → LETZTE ERNTE',
    kategorie: 'honig', ziel: 'volk', wichtig: true,
    info: 'Der Stichtag des Jahres. Sobald die Lindentracht endet, wird abgeerntet – und damit startet unmittelbar die Varroabehandlung und die Einfütterung. Alles Weitere hängt an diesem Datum.',
    anker: { typ: 'bluete', art: 'linde', ereignis: 'ende' },
    fenster: [-5, 21],
    // Auch im Sommer wird oft zweimal geschleudert (Juni-Tracht und späte
    // Linde/Wald). Jede weitere Ernte verschiebt die Sommerbehandlung
    // automatisch nach hinten, weil die Folgetermine an der JÜNGSTEN Ernte
    // hängen – genau so soll es sein: behandelt wird nach der letzten Ernte.
    wiederholung: { min: 12, max: 40 },
    wiederholungFreiwillig: true,
    saisonEnde: [8, 10],
    hilfe: 'Sommertracht ernten letzte Ernte',
    felder: [
      F.kg('Erntemenge'),
      { key: 'wasser', label: 'Wassergehalt', typ: 'zahl', einheit: '% (Refraktometer)', schritt: 0.1 },
      F.notiz,
    ],
  },
  {
    id: 'abfuellen',
    titel: 'Rühren, abfüllen, etikettieren',
    kategorie: 'honig', ziel: 'imkerei',
    info: 'Rühren ab zwei bis drei Tagen nach dem Schleudern, bis der Honig cremig steht.',
    anker: { typ: 'nachAufgabe', regel: 'fruehtracht', regelAlternativ: 'sommertracht' },
    fenster: [2, 30],
    hilfe: 'Honig rühren abfüllen cremig',
    felder: [
      F.kg('Abgefüllte Menge'),
      {
        key: 'glasgroesse', label: 'Glasgröße', typ: 'auswahl', einheit: 'g Inhalt',
        optionen: ['250', '500', '1000'], standard: '500',
      },
      {
        key: 'glaeser', label: 'Anzahl Gläser', typ: 'zahl', einheit: 'Stück', schritt: 1,
        abgeleitet: { aus: ['kg', 'glasgroesse'], rechne: (w) => (w.kg && w.glasgroesse
          ? Math.floor((w.kg * 1000) / parseFloat(w.glasgroesse)) : null) },
        hinweis: 'Wird aus Menge und Glasgröße berechnet, lässt sich aber überschreiben.',
      },
      F.notiz,
    ],
  },

  // ------------------------------------------------------------------- Varroa
  {
    id: 'drohnenbrut',
    titel: 'Drohnenbrut schneiden',
    kategorie: 'varroa', ziel: 'volk',
    info: 'Alle drei Wochen, sobald der Baurahmen verdeckelt ist. Ende Juni einstellen. Niemals verdeckelte Drohnenbrut im Volk vergessen – das wäre eine Milbenvermehrung mit Ansage.',
    anker: { typ: 'nachAufgabe', regel: 'baurahmen' },
    fenster: [18, 24],
    saisonEnde: [6, 30],
    wiederholung: { min: 18, max: 24 },
    benoetigt: ['baurahmen'],
    hilfe: 'Drohnenbrut schneiden Varroa',
    felder: [F.notiz],
  },
  {
    id: 'befallskontrolle',
    titel: 'Varroa-Befall messen (Gemülldiagnose)',
    kategorie: 'varroa', ziel: 'volk',
    info: 'Stockwindel drei Tage einlegen, Milben zählen, Summe durch drei teilen. Die Schwelle hängt vom Monat ab – die App rechnet sie beim Eintragen gegen und legt bei Überschreitung selbstständig eine Behandlungsaufgabe an.',
    anker: { typ: 'datum', von: [5, 1], bis: [10, 15] },
    wiederholung: { min: 25, max: 40 },
    hilfe: 'Gemülldiagnose Varroa Windel auszählen',
    felder: [
      F.milben,
      { key: 'tage', label: 'Liegezeit der Stockwindel', typ: 'zahl', einheit: 'Tage', schritt: 1 },
      F.notiz,
    ],
  },
  {
    id: 'anfuettern',
    titel: 'Wenn nötig: erste kleine Futtergabe',
    kurz: 'Erste Futtergabe',
    kategorie: 'winter', ziel: 'volk', freiwillig: true,
    info: 'Nach der Ernte ist der Vorrat aus dem Volk heraus und draußen herrscht meist '
      + 'Trachtlücke. Wiegt ein Volk auffällig leicht, ist eine kleine Gabe von etwa zwei bis '
      + 'fünf Kilo VOR der ersten Behandlung üblich – ein hungerndes Volk verträgt die '
      + 'Ameisensäure schlechter. Nicht voll auffüttern: die Säure braucht Platz zum Verdunsten, '
      + 'und die Hauptmenge kommt ohnehin erst nach der ersten Behandlung. Abends geben, nichts '
      + 'verschütten – in der Trachtlücke ist Räuberei schnell da. Und das Wichtigste: die '
      + 'Behandlung deswegen nicht verschieben.',
    checkliste: ['Volk angehoben – wirkt es leicht?', 'Abends gefüttert', 'Nichts verschüttet',
      'Futtergeschirr dicht'],
    anker: { typ: 'nachAufgabe', regel: 'sommertracht' },
    fenster: [0, 4],
    benoetigt: ['sommertracht'],
    // Mit 2-Liter-Ballons sind mehrere Gaben der Normalfall, nicht die Ausnahme.
    wiederholung: { min: 2, max: 10 },
    wetterbedarf: 'trocken',
    hilfe: 'Anfüttern nach der letzten Ernte vor der Behandlung',
    // Richtwert 2–5 kg insgesamt; mit 2-Liter-Ballons sind das zwei bis drei Gaben.
    felder: FUTTER_FELDER('Diese Gabe'),
  },
  {
    id: 'sommerbehandlung1',
    titel: 'Sommerbehandlung 1 – Ameisensäure',
    kategorie: 'varroa', ziel: 'volk', wichtig: true,
    info: 'Ein bis drei Tage nach der letzten Honigernte. Jede Woche Verzug kostet Winterbienen. Nicht in Hitze über 25 °C ansetzen, abends starten.',
    checkliste: ['Honigräume ab', 'Stockwindel eingelegt', 'Menge nach Beutenvolumen',
      'Wetter passt (15–25 °C)', 'Volk hungert nicht (sonst vorher 2–3 kg geben)'],
    anker: { typ: 'nachAufgabe', regel: 'sommertracht' },
    fenster: [1, 10],
    benoetigt: ['sommertracht'],
    hilfe: 'Ameisensäure Behandlung Schwammtuch Dosierung',
    felder: AS_FELDER,
  },
  {
    id: 'sommerbehandlung2',
    titel: 'Sommerbehandlung 2 – Ameisensäure',
    kategorie: 'varroa', ziel: 'volk', wichtig: true,
    info: 'Zwei bis drei Wochen nach der ersten Behandlung. Erst dieser zweite Durchgang erwischt die Milben, die beim ersten Mal in der verdeckelten Brut saßen.',
    anker: { typ: 'nachAufgabe', regel: 'sommerbehandlung1' },
    fenster: [14, 21],
    benoetigt: ['sommerbehandlung1'],
    hilfe: 'Ameisensäure zweite Behandlung',
    felder: AS_FELDER,
  },
  {
    id: 'behandlungserfolg',
    titel: 'Behandlungserfolg kontrollieren',
    kategorie: 'varroa', ziel: 'volk',
    info: 'Ziel: unter einer Milbe natürlicher Fall pro Tag. Wird der Wert überschritten, muss vor dem Einwintern nachbehandelt werden.',
    anker: { typ: 'nachAufgabe', regel: 'sommerbehandlung2' },
    fenster: [7, 24],
    benoetigt: ['sommerbehandlung2'],
    felder: [F.milben, { key: 'tage', label: 'Liegezeit der Stockwindel', typ: 'zahl', einheit: 'Tage', schritt: 1 }, F.notiz],
  },
  {
    id: 'restentmilbung',
    titel: 'Restentmilbung mit Oxalsäure',
    kategorie: 'varroa', ziel: 'volk', wichtig: true,
    info: 'Nur im brutfreien Volk, sonst wirkungslos. Etwa drei Wochen nach Beginn der ersten längeren Frostperiode. Einmalig und gründlich, bei 3 bis 8 °C.',
    checkliste: ['Volk brutfrei geprüft', 'Lösung auf ca. 30 °C angewärmt', 'Menge je besetzter Wabengasse'],
    anker: { typ: 'wetter', ereignis: 'brutfrei', ersatz: [12, 10] },
    fenster: [0, 40],
    benoetigt: ['sommerbehandlung2'],
    hilfe: 'Oxalsäure träufeln Restentmilbung',
    felder: [
      {
        key: 'praeparat', label: 'Präparat', typ: 'auswahl',
        optionen: ['Oxalsäure 3,5 % Träufellösung', 'Oxalsäure sprühen', 'Oxalsäure verdampfen', 'anderes'],
      },
      F.gassen,
      {
        key: 'menge', label: 'Aufgebrachte Menge', typ: 'zahl', einheit: 'ml je Volk', schritt: 5,
        abgeleitet: { aus: ['gassen'], rechne: (w) => (w.gassen ? Math.min(50, w.gassen * 5) : null) },
        hinweis: 'Richtwert Träufelverfahren: 5 ml je besetzter Wabengasse, höchstens 50 ml. '
          + 'Verbindlich ist die Packungsbeilage.',
      },
      F.notiz,
    ],
  },

  // ------------------------------------------------------------- Einwinterung
  {
    id: 'auffuettern',
    titel: 'Auffüttern beginnen',
    kategorie: 'winter', ziel: 'volk', wichtig: true,
    info: 'Direkt im Anschluss an die erste Sommerbehandlung. In großen Gaben, nicht tröpfchenweise – das reizt zur Räuberei und verbraucht Bienen. Wie viel nötig ist, hängt von Beute, Volksstärke und vorhandenem Vorrat ab – der Rechner unten schlägt eine Menge vor.',
    anker: { typ: 'nachAufgabe', regel: 'sommerbehandlung1' },
    fenster: [0, 14],
    benoetigt: ['sommerbehandlung1'],
    rechner: 'futter',
    hilfe: 'Auffüttern einfüttern Winterfutter Menge',
    // Wer in Ballons füttert, gibt zehnmal anderthalb Kilo statt einmal sechzehn.
    // Die Aufgabe kommt deshalb nach jeder Gabe wieder – als Angebot, nicht als
    // Mahnung –, bis die Saison zu ist. Die Summe steht in der Futterkarte des
    // Volkes und in „Auffütterung abschließen".
    wiederholung: { min: 3, max: 21 },
    wiederholungFreiwillig: true,
    saisonEnde: [9, 20],
    felder: FUTTER_FELDER('Diese Gabe'),
  },
  {
    id: 'auffuettern_ende',
    titel: 'Auffütterung abschließen',
    kategorie: 'winter', ziel: 'volk', wichtig: true,
    info: 'Bis Mitte September muss das Winterfutter drin sein. Später eingetragenes Futter wird nicht mehr sauber invertiert und verbraucht die Winterbienen.',
    anker: { typ: 'nachAufgabe', regel: 'auffuettern' },
    fenster: [14, 35],
    haerteFrist: [9, 20],
    benoetigt: ['auffuettern'],
    rechner: 'futter',
    // Wichtig: hier steht die LETZTE Gabe, nicht die Summe. Die Summe rechnet die
    // App aus allen Gaben – „insgesamt" als Eingabefeld hätte jede Bilanz doppelt
    // gezählt.
    felder: [
      ...FUTTER_FELDER('Letzte Gabe'),
      { key: 'endgewicht', label: 'Beutengewicht danach', typ: 'zahl', einheit: 'kg',
        schritt: 0.5 },
    ],
  },
  {
    id: 'wintersitz',
    titel: 'Wintersitz prüfen, schwache Völker vereinigen',
    kategorie: 'winter', ziel: 'volk',
    info: 'Unter fünf von Bienen besetzten Wabengassen nicht einwintern, sondern auflösen oder vereinigen. Ein schwaches Volk wird über Winter nicht stärker.',
    anker: { typ: 'datum', von: [9, 15], bis: [10, 20] },
    hilfe: 'Völker vereinigen Zeitungsmethode',
    felder: [
      F.gassen,
      { key: 'massnahme', label: 'Maßnahme', typ: 'chips', optionen: ['bleibt', 'vereinigt', 'aufgelöst'] },
      F.notiz,
    ],
  },
  {
    id: 'mauseschutz',
    titel: 'Mäusegitter, Fluglochkeil, Specht- und Sturmschutz',
    kategorie: 'winter', ziel: 'stand',
    info: 'Vor dem ersten Nachtfrost erledigt haben.',
    anker: { typ: 'wetter', ereignis: 'ersterNachtfrost', ersatz: [10, 15] },
    fenster: [-21, 14],
    felder: [F.notiz],
  },

  // -------------------------------------------------------------- Königinnen
  {
    id: 'umweiseln',
    titel: 'Königin ersetzen (Umweiseln)',
    kurz: 'Umweiseln',
    kategorie: 'koenigin', ziel: 'volk', freiwillig: true,
    info: 'Diese Königin geht in ihre dritte Saison. Ältere Königinnen legen weniger, das Volk '
      + 'neigt stärker zum Schwärmen und die Weiselrichtigkeit wird unsicherer. Wer planmäßig '
      + 'umweiselt, hat ruhigere und stärkere Völker – und weiß, was er im Volk hat. '
      + 'Zeitfenster: solange Drohnen fliegen und der Anpaarung noch Sommer bleibt.',
    checkliste: ['Alte Königin gefunden und entnommen', 'Zusetzverfahren vorbereitet',
      'Nach 9 Tagen Nachschaffungszellen brechen', 'Legebeginn nach 3 Wochen prüfen'],
    anker: { typ: 'datum', von: [5, 20], bis: [8, 10] },
    // Nur dort anbieten, wo die Königin wirklich alt ist – sonst stünde die
    // Aufgabe bei jedem Volk und würde ignoriert.
    bedingung: (ziel, ctx) => {
      const eigene = (ctx.koeniginnen || [])
        .filter((k) => k.volkId === ziel.id && !k.bis && !k.deletedAt)
        .sort((a, b) => ((a.seit || '') < (b.seit || '') ? 1 : -1))[0];
      const jahr = Number(eigene?.jahr || ziel.obj?.koeniginJahr || 0);
      if (!jahr) return false;
      return (ctx.datum || new Date()).getFullYear() - jahr >= 2;
    },
    aktion: 'umweiseln',
    hilfe: 'Umweiseln Königin zusetzen Verfahren',
    felder: [F.notiz],
  },

  // ------------------------------------------------------------------ Betrieb
  {
    id: 'werkstatt',
    titel: 'Werkstatt: Wachs schmelzen, Rähmchen, Beuten',
    kategorie: 'betrieb', ziel: 'imkerei',
    info: 'Löten, reinigen, desinfizieren, Mittelwände gießen. Jetzt ist Zeit dafür.',
    anker: { typ: 'datum', von: [11, 1], bis: [2, 28] },
    wiederholung: { min: 30, max: 60 },
    hilfe: 'Wachs umarbeiten Mittelwände Rähmchen',
    felder: [F.notiz],
  },
  {
    id: 'melden',
    titel: 'Völker melden, bestellen, Jahr planen',
    kategorie: 'betrieb', ziel: 'imkerei',
    info: 'Meldung an die Tierseuchenkasse – Stichtag je nach Bundesland, meist zum Jahreswechsel. Gleich Material und Königinnen bestellen.',
    anker: { typ: 'datum', von: [12, 1], bis: [1, 15] },
    felder: [{ key: 'anzahl', label: 'Gemeldete Völker', typ: 'zahl', einheit: 'Völker', schritt: 1 }, F.notiz],
  },
];

/**
 * Wetteransprüche je Aufgabe. Die Profile stecken in js/tracht.js:
 *   oeffnen – Volk aufmachen, Waben ziehen  (12 °C aufwärts, trocken, windarm, hell)
 *   as      – Ameisensäure                   (15–25 °C, sonst wirkungslos oder zu scharf)
 *   os      – Oxalsäure im brutfreien Volk   (kalt, aber trocken)
 *   trocken – Arbeit an der Beute von außen  (nur Regen und Sturm stören)
 * Aufgaben ohne Eintrag (Werkstatt, Abfüllen, Meldungen) sind wetterunabhängig.
 */
const WETTERBEDARF = {
  winterkontrolle: 'trocken', gewichtskontrolle: 'trocken',
  erste_durchsicht: 'oeffnen', boden_waben: 'oeffnen', erweitern: 'oeffnen', baurahmen: 'oeffnen',
  schwarmkontrolle: 'oeffnen', ableger: 'oeffnen',
  honigraum: 'oeffnen', fruehtracht: 'oeffnen', sommertracht: 'oeffnen',
  drohnenbrut: 'oeffnen', befallskontrolle: 'trocken',
  sommerbehandlung1: 'as', sommerbehandlung2: 'as', behandlungserfolg: 'trocken',
  restentmilbung: 'os',
  anfuettern: 'trocken', auffuettern: 'trocken', auffuettern_ende: 'trocken',
  umweiseln: 'oeffnen',
  wintersitz: 'oeffnen', mauseschutz: 'trocken',
};
for (const r of REGELN) if (WETTERBEDARF[r.id]) r.wetterbedarf = WETTERBEDARF[r.id];

export const regelNach = (id) => REGELN.find((r) => r.id === id);

/**
 * Welche Aufgaben hängen an dieser? Zwei Wege führen dorthin:
 *   * Anker `nachAufgabe` – der Termin rechnet direkt vom Erledigungsdatum aus.
 *     Nur hier gibt es einen Abstand in Tagen, den man nennen kann.
 *   * `benoetigt` – die Aufgabe ist Voraussetzung, ihr Termin kommt aber aus
 *     einer anderen Quelle (Blüte, Wetter). Dann ohne Tagesangabe.
 */
export function folgeRegeln(regelId) {
  const direkt = REGELN.filter((r) => r.anker?.typ === 'nachAufgabe'
    && (r.anker.regel === regelId || r.anker.regelAlternativ === regelId));
  const weitere = REGELN.filter((r) => (r.benoetigt || []).includes(regelId)
    && !direkt.includes(r));
  // Reihenfolge nach Wichtigkeit, dann nach Nähe: die Sommerbehandlung gehört
  // vor das Abfüllen, auch wenn sie im Katalog weiter unten steht.
  const sortiert = [...direkt, ...weitere].sort((a, b) => (b.wichtig ? 1 : 0) - (a.wichtig ? 1 : 0)
    || ((a.fenster?.[0] ?? 99) - (b.fenster?.[0] ?? 99)));
  return sortiert.map((r) => ({
    id: r.id,
    kurz: r.kurz || r.titel,
    wichtig: !!r.wichtig,
    // Abstand nur, wenn er sich wirklich von dieser Aufgabe aus rechnet
    fenster: (r.anker?.typ === 'nachAufgabe'
      && (r.anker.regel === regelId || r.anker.regelAlternativ === regelId)) ? r.fenster : null,
  }));
}

// ============================================================================
// Automatische Auslöser
// ----------------------------------------------------------------------------
// Aus erfassten Werten entstehen neue Aufgaben. Beispiel: Milbenfall über der
// Schwelle -> sofort eine Behandlungsaufgabe, ohne dass jemand daran denken muss.

/** Monatsabhängige Alarmschwelle für den natürlichen Milbenfall (Milben/Tag). */
export function varroaSchwelle(monat) {
  if (monat >= 4 && monat <= 6) return 1;    // Mai/Juni: schon 1 pro Tag ist viel
  if (monat === 7) return 5;
  if (monat === 8) return 10;
  return 1;                                   // nach der Behandlung muss es unter 1 sein
}

export const AUSLOESER = [
  {
    id: 'varroa_alarm',
    trifft: ({ daten, monat }) => daten.milbenProTag != null
      && Number(daten.milbenProTag) >= varroaSchwelle(monat),
    aufgabe: ({ daten, monat, nachBehandlung }) => ({
      titel: nachBehandlung
        ? 'Varroa: Behandlungserfolg zu gering – nachbehandeln'
        : 'Varroa: Befall über der Schwelle – jetzt behandeln',
      kategorie: 'varroa', wichtig: true, fenster: [0, 10], wetterbedarf: 'oeffnen',
      info: t('Gemessen wurden {ist} Milben pro Tag. Die Schwelle für diesen Monat liegt bei '
        + '{soll}. Behandlungsverfahren nach Jahreszeit wählen (im Sommer Ameisensäure, im '
        + 'brutfreien Volk Oxalsäure) und danach erneut messen.',
      { ist: daten.milbenProTag, soll: varroaSchwelle(monat) }),
      hilfe: 'Varroabehandlung Notfall Befall zu hoch',
    }),
  },
  {
    id: 'weisellos',
    trifft: ({ daten }) => /weisellos/i.test(String(daten.koenigin || '')),
    aufgabe: () => ({
      titel: 'Weiselzustand klären – Volk ohne Königin',
      kategorie: 'schwarm', wichtig: true, fenster: [0, 9], wetterbedarf: 'oeffnen',
      info: 'Weiselprobe mit offener Brut aus einem anderen Volk. Bauen die Bienen Nachschaffungszellen, '
        + 'ist das Volk weisellos: Königin zusetzen oder mit einem weiselrichtigen Volk vereinigen. '
        + 'Nicht warten – ein weiselloses Volk wird schnell drohnenbrütig.',
      hilfe: 'weiselloses Volk Königin zusetzen',
    }),
  },
  {
    id: 'schwarmalarm',
    trifft: ({ daten }) => /verdeckelt|bestiftet/i.test(String(daten.stimmung || ''))
      || Number(daten.zellen || 0) >= 3,
    aufgabe: ({ daten }) => ({
      titel: 'Schwarmstimmung – in wenigen Tagen nachschauen',
      kategorie: 'schwarm', wichtig: true, fenster: [4, 7], wetterbedarf: 'oeffnen',
      info: t('Bei der letzten Kontrolle: {befund}. Jetzt engmaschiger kontrollieren oder das '
        + 'Volk durch einen Ableger entlasten.',
      { befund: [daten.stimmung ? t(daten.stimmung) : '',
        daten.zellen ? t('{n} Weiselzellen', { n: daten.zellen }) : ''].filter(Boolean).join(', ') }),
      hilfe: 'Schwarmverhinderung Ableger bilden',
    }),
  },
  {
    id: 'futter_knapp',
    trifft: ({ daten, monat }) => daten.futter != null
      && ((monat >= 11 || monat <= 3) ? Number(daten.futter) < 6 : Number(daten.futter) < 3),
    aufgabe: ({ daten }) => ({
      titel: 'Futter knapp – nachfüttern',
      kategorie: 'winter', wichtig: true, fenster: [0, 7], wetterbedarf: 'trocken',
      info: t('Geschätzter Vorrat: {kg} kg. Im Winterhalbjahr Futterteig direkt über den Sitz '
        + 'legen, im Sommerhalbjahr Futtersirup geben. Ein verhungertes Volk ist der häufigste '
        + 'vermeidbare Verlust.', { kg: daten.futter }),
      hilfe: 'Notfütterung Futterteig auflegen',
    }),
  },
];

// ============================================================================
// Futterbedarfsrechner
// ----------------------------------------------------------------------------
// Faustwerte, keine Norm. Zielvorrat nach Rähmchenmaß, korrigiert nach
// Volksstärke; abgezogen wird, was das Volk schon hat.

export const ZIELVORRAT = {
  'Zander': 16, 'Deutsch Normal': 16, 'Dadant': 20, 'Langstroth': 18, 'Segeberger': 16, 'anderes': 16,
};

export function futterBedarf({ beute, gassen, vorhanden, jungvolk }) {
  let ziel = ZIELVORRAT[beute] ?? 16;
  if (jungvolk) ziel = Math.round(ziel * 0.7);
  if (gassen != null) {
    if (gassen < 5) ziel = Math.round(ziel * 0.6);
    else if (gassen <= 7) ziel -= 2;
    else if (gassen >= 11) ziel += 2;
  }
  const fehlt = Math.max(0, Math.round((ziel - (vorhanden || 0)) * 2) / 2);
  return {
    ziel,
    fehlt,
    // Faustregeln: Fertigsirup rechnet praktisch 1:1 in Winterfutter,
    // bei 3:2-Zuckerwasser braucht es rund 1 kg Zucker je Kilo Winterfutter.
    fertigsirup: fehlt,
    zucker: fehlt,
    wasser: Math.round(fehlt * 0.66 * 10) / 10,
    warnung: gassen != null && gassen < 5
      ? 'Unter fünf besetzten Wabengassen lohnt das Einwintern nicht – besser vereinigen.'
      : null,
  };
}
