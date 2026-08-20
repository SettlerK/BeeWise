// Wabenalter je Volk.
// =============================================================================
// Alte Waben sind dunkel, eng und tragen Krankheitskeime; Wabenerneuerung ist
// die billigste Hygienemaßnahme, die es in der Imkerei gibt. Sie scheitert nur
// daran, dass niemand weiß, welche Wabe wie alt ist.
//
// Erfassungstiefe ist deshalb die entscheidende Entscheidung – und die fällt
// hier bewusst grob: **je Volk und Jahr eine Stückzahl.** „2026: sechs neue
// Rähmchen." Das ist in zehn Sekunden erfasst, auch mit Handschuhen, und
// beantwortet die Frage, die wirklich gestellt wird: Wie viele Waben in diesem
// Volk sind zu alt, und wie viele muss ich im Frühjahr ausschmelzen?
//
// Wabengenaue Verfolgung (jedes Rähmchen ein Datensatz mit Position) wäre
// genauer, aber am offenen Volk nicht durchzuhalten: entweder wird sie nicht
// geführt, oder sie wird falsch geführt – und eine falsche Genauigkeit ist
// schlechter als eine ehrliche Schätzung.
//
// Rechnung: Zugänge je Jahrgang, Abgänge (ausgeschmolzen) von den ÄLTESTEN
// Jahrgängen abgezogen. Wer Waben ausschmilzt, nimmt die dunkelsten – nicht die
// hellsten.

import { parseISO, heute } from './util.js';

/** Ab diesem Alter wird zum Ausschmelzen geraten (Jahre). */
export const WABEN_GRENZE = 3;

// Eigene kleine Helfer mit sprechenden Namen: in der Einzeldatei teilen sich
// alle Module einen Namensraum, deshalb keine Allerweltsnamen wie `zahl`.
const wabenZahl = (x) => (x == null || x === '' ? 0 : Number(x) || 0);
const wabenLebt = (r) => r && !r.deletedAt;

/**
 * Wabenlage eines Volkes.
 * @returns {{jahrgaenge: object[], gesamt: number, alt: number, jung: number,
 *            erfasst: boolean, letzte: object|null, grenzjahr: number}}
 */
export function wabenLage(S, volkId, jetzt = heute()) {
  const jahr = jetzt.getFullYear();
  const saetze = (S.waben || []).filter((w) => wabenLebt(w) && w.volkId === volkId)
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));

  const zugang = new Map();
  let abgang = 0;
  for (const w of saetze) {
    const jg = Number(w.jahrgang) || parseISO(w.datum).getFullYear();
    if (w.art === 'ausgeschmolzen') abgang += wabenZahl(w.anzahl);
    else zugang.set(jg, (zugang.get(jg) || 0) + wabenZahl(w.anzahl));
  }

  // Abgänge von den ältesten Jahrgängen abziehen
  const jahrgaenge = [...zugang.entries()]
    .map(([jg, anzahl]) => ({ jahrgang: jg, anzahl }))
    .sort((a, b) => a.jahrgang - b.jahrgang);
  let rest = abgang;
  for (const j of jahrgaenge) {
    if (rest <= 0) break;
    const weg = Math.min(rest, j.anzahl);
    j.anzahl -= weg;
    rest -= weg;
  }

  const uebrig = jahrgaenge.filter((j) => j.anzahl > 0)
    .map((j) => ({ ...j, alter: jahr - j.jahrgang, zuAlt: jahr - j.jahrgang >= WABEN_GRENZE }));

  const gesamt = uebrig.reduce((s, j) => s + j.anzahl, 0);
  const alt = uebrig.filter((j) => j.zuAlt).reduce((s, j) => s + j.anzahl, 0);

  return {
    jahrgaenge: uebrig,
    gesamt,
    alt,
    jung: gesamt - alt,
    erfasst: saetze.length > 0,
    letzte: saetze[saetze.length - 1] || null,
    ausgeschmolzen: abgang,
    grenzjahr: jahr - WABEN_GRENZE,
  };
}

/** Wie viele Waben sind im ganzen Betrieb zu alt? Für den Hinweis unter „Mehr". */
export function wabenUebersicht(S, jetzt = heute()) {
  const zeilen = (S.voelker || [])
    .filter((v) => v.status !== 'aufgeloest')
    .map((v) => ({ volk: v, ...wabenLage(S, v.id, jetzt) }))
    .filter((z) => z.erfasst);
  return {
    zeilen: zeilen.sort((a, b) => b.alt - a.alt),
    voelkerMitDaten: zeilen.length,
    alt: zeilen.reduce((s, z) => s + z.alt, 0),
    gesamt: zeilen.reduce((s, z) => s + z.gesamt, 0),
  };
}

/**
 * Regeln, aus deren Erledigung sich neue Waben ergeben – mit dem Feld, in dem
 * die Stückzahl steht. So wird beim Erweitern einmal erfasst und nicht zweimal.
 */
export const WABEN_AUS_AUFGABE = {
  erweitern: 'raehmchen',
  boden_waben: 'raehmchen',
  honigraum: 'raehmchen',
};

/** Ein Satz Text zur Lage – null, wenn nichts zu sagen ist. */
export function wabenSatz(lage, t = (x) => x) {
  if (!lage.erfasst) return null;
  if (!lage.gesamt) return t('Alle erfassten Waben sind ausgeschmolzen.');
  if (!lage.alt) {
    return t('Keine Wabe ist älter als {n} Jahre – die Erneuerung läuft.',
      { n: WABEN_GRENZE });
  }
  return t('{n} von {g} Waben sind {j} Jahre und älter. Im Frühjahr ausschmelzen und durch '
    + 'Mittelwände ersetzen.', { n: lage.alt, g: lage.gesamt, j: WABEN_GRENZE });
}
