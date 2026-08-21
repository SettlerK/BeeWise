// Fütterung: viele kleine Gaben, eine Summe.
// =============================================================================
// Wer mit 2-Liter-Ballons und Zuckerwasser füttert, gibt nicht einmal 16 kg,
// sondern zehnmal anderthalb. Daraus folgen drei Dinge:
//
//   1. **Eine Gabe ist ein Datensatz mit Datum und Menge** – geschrieben als
//      Erledigung der Futterregel, genau wie beim Abhaken. Es gibt also nicht
//      „Aufgaben hier, Nachträge dort", sondern eine Reihe, in die beide Wege
//      schreiben. Sonst wäre die Summe irgendwann falsch, und die Summe ist das
//      Einzige, worauf es beim Einwintern ankommt.
//   2. **Gerechnet wird in kg Winterfutter, erfasst in Litern.** Der Imker denkt
//      in Ballons, die Regel denkt in Kilo. Die Umrechnung steht hier an einer
//      Stelle – mit offen benannten Faustwerten, nicht als Scheingenauigkeit.
//   3. **Anfüttern zählt getrennt.** Die kleine Gabe vor der ersten Behandlung
//      wird zum Teil wieder verbraucht; sie auf den Zielvorrat anzurechnen wäre
//      geschönt. Sie steht deshalb neben, nicht in der Wintersumme.
//
// Faustwerte für die Umrechnung (Zucker ≈ Winterfutter, 1 kg Zucker ergibt rund
// 1 kg Futter im Volk):
//   Fertigsirup (Invertzucker) ~73 % Zucker, 1,4 kg/l   → 1,0 kg je Liter
//   Zuckerwasser 3:2 (3 kg Zucker auf 2 l Wasser)        → 0,77 kg je Liter
//   Zuckerwasser 1:1 (1 kg Zucker auf 1 l Wasser)        → 0,61 kg je Liter
//   Futterteig                                            → 1,0 kg je Kilo
// Ein 2-Liter-Ballon 3:2 bringt also rund 1,5 kg Winterfutter.

import { parseISO, heute, fmtDatum } from './util.js';
import { futterBedarf, FUTTERMITTEL, BALLON_LITER, futtermittelNach,
  kgAusMenge } from './regeln.js';

// Die Umrechnungstabelle steht in js/regeln.js – dort, wo das imkerliche Wissen
// liegt – und wird hier nur weitergegeben, damit die Oberfläche einen Ort hat.
export { FUTTERMITTEL, BALLON_LITER };

/** Regeln, deren Erledigung eine Futtergabe ist – mit ihrem Zweck. */
export const FUTTER_REGELN = {
  anfuettern: 'anfuettern',
  auffuettern: 'winter',
  auffuettern_ende: 'winter',
};

const futterLebt = (r) => r && !r.deletedAt && r.status !== 'uebersprungen';
const eins = (x) => Math.round(x * 10) / 10;

export const mittelNach = futtermittelNach;
export const kgAus = kgAusMenge;

/** Liter aus einer Zahl Ballons. */
export const literAusBallons = (n) => eins((Number(n) || 0) * BALLON_LITER);

/** „1 Ballon" statt „1 Ballons" – sonst liest sich die Liste schief. */
export const ballonText = (n, t = (x) => x) =>
  (Number(n) === 1 ? t('1 Ballon') : t('{n} Ballons', { n }));

/**
 * Alle Futtergaben eines Volkes in einem Jahr, jüngste zuletzt.
 * `kg` ist die maßgebliche Zahl; `menge`/`einheit`/`mittel` merken sich, was
 * eingegeben wurde, damit die Karte „2 Ballons 3:2" zeigen kann und nicht nur
 * eine umgerechnete Kommazahl.
 */
export function futterGaben(S, volkId, jahr = heute().getFullYear()) {
  return (S.erledigungen || [])
    .filter((e) => futterLebt(e) && e.zielId === volkId && FUTTER_REGELN[e.regelId]
      && parseISO(e.datum).getFullYear() === jahr)
    .map((e) => {
      const mittel = e.daten?.futtermittel || null;
      const menge = e.daten?.menge != null ? Number(e.daten.menge) : null;
      const m = mittelNach(mittel);
      return {
        id: e.id,
        regelId: e.regelId,
        zweck: FUTTER_REGELN[e.regelId],
        datum: e.datum,
        kg: e.daten?.kg != null ? Number(e.daten.kg) : (menge != null ? kgAus(mittel, menge) : null),
        mittel,
        menge,
        einheit: m?.einheit || null,
        ballons: m?.einheit === 'l' && menge != null && menge % BALLON_LITER === 0
          ? menge / BALLON_LITER : null,
        notiz: e.daten?.notiz || '',
      };
    })
    .filter((g) => g.kg != null && g.kg > 0)
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));
}

/**
 * Futterbilanz eines Volkes: was ist für den Winter drin, was fehlt noch?
 * Der Zielvorrat kommt aus derselben Rechnung wie im Futterrechner, damit in
 * der App nicht zwei verschiedene Ziele herumlaufen.
 */
export function futterBilanz(S, volk, jahr = heute().getFullYear()) {
  const gaben = futterGaben(S, volk.id, jahr);
  const winter = eins(gaben.filter((g) => g.zweck === 'winter')
    .reduce((s, g) => s + g.kg, 0));
  const vorher = eins(gaben.filter((g) => g.zweck === 'anfuettern')
    .reduce((s, g) => s + g.kg, 0));

  const gassen = letzteGassen(S, volk.id);
  // Der Zielvorrat gilt für das Winterfutter; das Anfüttern wird bewusst nicht
  // angerechnet (es wird zum Teil vor dem Winter verbraucht).
  const bedarf = futterBedarf({ beute: volk.beute, gassen, vorhanden: winter,
    jungvolk: !!volk.gebildetAm });

  return {
    jahr,
    gaben,
    winter,
    anfuettern: vorher,
    gesamt: eins(winter + vorher),
    ziel: bedarf.ziel,
    fehlt: bedarf.fehlt,
    warnung: bedarf.warnung,
    gassen,
    letzte: gaben[gaben.length - 1] || null,
    fertig: bedarf.fehlt <= 0 && winter > 0,
  };
}

const letzteGassen = (S, volkId) => {
  const d = (S.durchsichten || [])
    .filter((x) => !x.deletedAt && x.volkId === volkId
      && x.wabengassen != null && x.wabengassen !== '')
    .sort((a, b) => (a.datum < b.datum ? 1 : -1))[0];
  return d ? Number(d.wabengassen) : null;
};

/** Eine Gabe als Text: „12.08. · 2 Ballons Zuckerwasser 3:2 · 3,1 kg". */
export function gabeText(g, t = (x) => x) {
  const menge = g.ballons
    ? ballonText(g.ballons, t)
    : (g.menge != null ? `${String(g.menge).replace('.', ',')} ${t(g.einheit || 'kg')}` : '');
  return [fmtDatum(g.datum), [menge, g.mittel ? t(g.mittel) : ''].filter(Boolean).join(' '),
    `${String(g.kg).replace('.', ',')} kg`].filter(Boolean).join(' · ');
}

/** Sätze zur Lage – knapp, und keiner erfunden. */
export function futterSaetze(b, t = (x) => x) {
  const raus = [];
  const kg = (x) => String(eins(x)).replace('.', ',');
  if (!b.gaben.length) {
    raus.push(t('Noch keine Futtergabe erfasst. Ziel für diese Beute: {ziel} kg Winterfutter.',
      { ziel: b.ziel }));
    return raus;
  }
  raus.push(t('{n} Gaben, zusammen {kg} kg Winterfutter.',
    { n: b.gaben.filter((g) => g.zweck === 'winter').length, kg: kg(b.winter) }));
  if (b.anfuettern) {
    raus.push(t('Dazu {kg} kg beim Anfüttern – die zählen nicht zum Wintervorrat, weil sie '
      + 'vorher zum Teil verbraucht werden.', { kg: kg(b.anfuettern) }));
  }
  if (b.fehlt > 0) {
    raus.push(t('Ziel {ziel} kg, es fehlen noch {fehlt} kg – das sind etwa {ballons} Ballons '
      + '3:2-Zuckerwasser.', { ziel: b.ziel, fehlt: kg(b.fehlt),
      ballons: Math.ceil(b.fehlt / (BALLON_LITER * 0.77)) }));
  } else {
    raus.push(t('Ziel {ziel} kg ist erreicht.', { ziel: b.ziel }));
  }
  if (b.warnung) raus.push(t(b.warnung));
  return raus;
}
