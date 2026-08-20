// Packliste für die Fahrt zum Stand.
// =============================================================================
// Die Angaben dafür liegen längst vor: welche Aufgaben an diesem Stand fällig
// sind, weiß die App. Das Ärgerliche am Bienenstand ist selten die Arbeit selbst,
// sondern die vergessene Zarge – also wird aus den Aufgaben abgeleitet, was
// mitmuss.
//
// `jeVolk: true` heißt: die Stückzahl wächst mit der Zahl der betroffenen
// Völker. Bei „Schutzbrille" wäre das albern, bei „Zarge" ist es der ganze Witz.
// Die Haken sind bewusst flüchtig und werden nicht gespeichert: die Liste ist
// eine Ladehilfe, kein Protokoll.

import { KATEGORIEN } from './regeln.js';

/** Kommt immer mit, egal was ansteht. */
export const GRUNDAUSRUESTUNG = [
  'Stockmeißel',
  'Smoker und Brennmaterial',
  'Schleier',
  'Handschuhe',
  'Wasser oder Sprühflasche',
  'Stift und Stockkarte (oder Handy)',
];

/** Was eine Aufgabe an Material braucht. */
const JE_AUFGABE = {
  winterkontrolle: [{ was: 'Handfeger' }, { was: 'Ersatz-Fluglochkeil' }],
  gewichtskontrolle: [{ was: 'Kofferwaage, falls vorhanden' }],
  erste_durchsicht: [{ was: 'saubere Stockwindel', jeVolk: true }, { was: 'Kehrblech' }],
  boden_waben: [{ was: 'sauberer Boden', jeVolk: true }, { was: 'Wabentasche' },
    { was: 'Rähmchen mit Mittelwänden', jeVolk: true }],
  erweitern: [{ was: 'Zarge', jeVolk: true }, { was: 'Rähmchen mit Mittelwänden', jeVolk: true }],
  baurahmen: [{ was: 'leerer Baurahmen', jeVolk: true }],
  schwarmkontrolle: [{ was: 'Wabenknecht' }, { was: 'Ersatzrähmchen' }],
  ableger: [{ was: 'Ablegerkasten', jeVolk: true }, { was: 'Rähmchen' },
    { was: 'Fluglochkeil' }, { was: 'Futterteig für die Ableger' }],
  honigraum: [{ was: 'Honigraum-Zarge', jeVolk: true }, { was: 'Absperrgitter', jeVolk: true },
    { was: 'Rähmchen mit Mittelwänden', jeVolk: true }],
  fruehtracht: [{ was: 'Fluchtbrett oder Abkehrbesen' }, { was: 'Transportkiste mit Deckel' },
    { was: 'Refraktometer' }, { was: 'Leerzarge für die abgeschleuderten Waben' }],
  sommertracht: [{ was: 'Fluchtbrett oder Abkehrbesen' }, { was: 'Transportkiste mit Deckel' },
    { was: 'Refraktometer' }, { was: 'Leerzarge für die abgeschleuderten Waben' }],
  drohnenbrut: [{ was: 'Wabenmesser' }, { was: 'Eimer für die Drohnenbrut' }],
  befallskontrolle: [{ was: 'saubere Stockwindel', jeVolk: true }, { was: 'Lupe' }],
  sommerbehandlung1: [{ was: 'Ameisensäure' }, { was: 'Verdunster (Schwammtuch, Dispenser)', jeVolk: true },
    { was: 'Schutzbrille und säurefeste Handschuhe' }, { was: 'Wasser zum Nachspülen' },
    { was: 'Stockwindel', jeVolk: true }],
  sommerbehandlung2: [{ was: 'Ameisensäure' }, { was: 'Verdunster (Schwammtuch, Dispenser)', jeVolk: true },
    { was: 'Schutzbrille und säurefeste Handschuhe' }, { was: 'Wasser zum Nachspülen' },
    { was: 'Stockwindel', jeVolk: true }],
  behandlungserfolg: [{ was: 'saubere Stockwindel', jeVolk: true }, { was: 'Lupe' }],
  restentmilbung: [{ was: 'Oxalsäure-Träufellösung' }, { was: 'Spritze oder Dosierer' },
    { was: 'warmes Wasser zum Anwärmen' }, { was: 'Schutzbrille und Handschuhe' }],
  anfuettern: [{ was: 'Futter (Sirup oder Teig)' }, { was: 'Futtergeschirr', jeVolk: true }],
  auffuettern: [{ was: 'Futter (Sirup oder Teig)' }, { was: 'Futtergeschirr', jeVolk: true },
    { was: 'Kanne oder Trichter' }],
  auffuettern_ende: [{ was: 'Futter (Sirup oder Teig)' }, { was: 'Futtergeschirr', jeVolk: true }],
  wintersitz: [{ was: 'Schied oder Leerrähmchen' }, { was: 'Zeitungspapier zum Vereinigen' }],
  mauseschutz: [{ was: 'Mäusegitter', jeVolk: true }, { was: 'Fluglochkeil', jeVolk: true },
    { was: 'Spanngurt oder Stein' }],
  umweiseln: [{ was: 'neue Königin' }, { was: 'Zusetzkäfig', jeVolk: true }, { was: 'Lupe' }],
};

/**
 * Packliste für einen Stand aus den dort fälligen Aufgaben.
 * @param plan  alle berechneten Aufgaben (S.plan)
 * @param standortId
 * @returns {{grund: string[], posten: object[], aufgaben: object[]}}
 */
export function packliste(plan, standortId) {
  const relevant = (plan || []).filter((a) => a.ziel?.standortId === standortId
    && ['ueberfaellig', 'faellig'].includes(a.zustand));

  // Gleiche Aufgabe an mehreren Völkern: Anzahl merken
  const jeRegel = new Map();
  for (const a of relevant) {
    if (!a.regelId) continue;
    // Der Anzeigetext der Aufgabe trägt Zusätze wie „→ letzte Ernte"; in einer
    // Ladeliste ist das Beiwerk, also nur der Titel.
    const titel = (a.titel || a.kurz || '').split('→')[0].trim();
    const eintrag = jeRegel.get(a.regelId) || { regelId: a.regelId, titel,
      kategorie: a.kategorie, anzahl: 0 };
    eintrag.anzahl += 1;
    jeRegel.set(a.regelId, eintrag);
  }

  const posten = new Map();
  for (const { regelId, titel, kategorie, anzahl } of jeRegel.values()) {
    for (const p of JE_AUFGABE[regelId] || []) {
      const vorhanden = posten.get(p.was);
      const stueck = p.jeVolk ? anzahl : 1;
      if (vorhanden) {
        vorhanden.stueck = Math.max(vorhanden.stueck, stueck);
        if (!vorhanden.wofuer.includes(titel)) vorhanden.wofuer.push(titel);
      } else {
        posten.set(p.was, {
          was: p.was,
          stueck,
          zaehlbar: !!p.jeVolk,
          kategorie,
          farbe: KATEGORIEN[kategorie]?.farbe || 'var(--rand-stark)',
          wofuer: [titel],
        });
      }
    }
  }

  return {
    grund: GRUNDAUSRUESTUNG,
    posten: [...posten.values()],
    aufgaben: [...jeRegel.values()],
  };
}
