// Volksvergleich am Stand.
// =============================================================================
// Die Zahlen dafür fallen bei jeder Durchsicht ohnehin an – nur sieht man sie
// bisher einzeln und nie nebeneinander. Genau der Vergleich ist aber die Frage
// des Imkers: Welches Volk trägt den Stand, welches hängt hinterher, und ist das
// erklärbar (Jungvolk, gerade umgeweiselt) oder ein Grund zum Handeln?
//
// Gestaltung: EIN Maß bekommt Balken (besetzte Wabengassen – das beste
// Einzelmaß für Volksstärke), alles andere steht als Zahl daneben. Alle Balken
// tragen dieselbe Farbe: eine Färbung nach Rang würde suggerieren, die App
// bewerte die Völker. Bezugslinie ist der Median des Standes, nicht der
// Mittelwert – ein einzelnes sehr schwaches Volk soll die Messlatte nicht
// verschieben.

import { parseISO, heute, diffTage } from './util.js';

const ERNTE_REGELN = ['fruehtracht', 'sommertracht'];

/** Jüngster Wert eines Feldes aus Durchsichten und Erledigungen. */
function jüngster(S, volkId, aus) {
  const kandidaten = [];
  for (const d of S.durchsichten) {
    if (d.volkId !== volkId || d.deletedAt) continue;
    const w = aus.durchsicht(d);
    if (w != null && w !== '') kandidaten.push({ datum: d.datum, wert: w });
  }
  for (const e of S.erledigungen) {
    if (e.zielId !== volkId || e.deletedAt || e.status === 'uebersprungen') continue;
    const w = aus.erledigung(e);
    if (w != null && w !== '') kandidaten.push({ datum: e.datum, wert: w });
  }
  kandidaten.sort((a, b) => (a.datum < b.datum ? 1 : -1));
  return kandidaten[0] || null;
}

const mittelwert = (zahlen) => {
  if (!zahlen.length) return null;
  const s = [...zahlen].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Vergleichsdaten für einen Bienenstand.
 * @returns {{zeilen: object[], median: number|null, hoechst: number, jahr: number,
 *            schwach: object[], stark: object[]}}
 */
export function standVergleich(S, standortId, datum = heute()) {
  const jahr = datum.getFullYear();
  const voelker = S.voelker
    .filter((v) => v.standortId === standortId && v.status !== 'aufgeloest')
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { numeric: true }));

  const zeilen = voelker.map((v) => {
    const gassen = jüngster(S, v.id, {
      durchsicht: (d) => (d.wabengassen != null ? Number(d.wabengassen) : null),
      erledigung: (e) => (e.daten?.gassen != null ? Number(e.daten.gassen) : null),
    });
    const milben = jüngster(S, v.id, {
      durchsicht: (d) => (d.milbenProTag != null ? Number(d.milbenProTag) : null),
      erledigung: (e) => (e.daten?.milbenProTag != null ? Number(e.daten.milbenProTag) : null),
    });
    const sanft = jüngster(S, v.id, {
      durchsicht: (d) => (d.sanftmut != null ? Number(d.sanftmut) : null),
      erledigung: () => null,
    });
    const ernte = S.erledigungen
      .filter((e) => e.zielId === v.id && ERNTE_REGELN.includes(e.regelId)
        && e.status !== 'uebersprungen' && !e.deletedAt
        && parseISO(e.datum).getFullYear() === jahr && e.daten?.kg)
      .reduce((s, e) => s + Number(e.daten.kg), 0);

    return {
      volk: v,
      gassen: gassen?.wert ?? null,
      gassenAlter: gassen ? diffTage(datum, parseISO(gassen.datum)) : null,
      milben: milben?.wert ?? null,
      milbenAlter: milben ? diffTage(datum, parseISO(milben.datum)) : null,
      sanftmut: sanft?.wert ?? null,
      ernte: Math.round(ernte * 10) / 10,
    };
  });

  const werte = zeilen.map((z) => z.gassen).filter((x) => x != null);
  const mitte = mittelwert(werte);
  const hoechst = werte.length ? Math.max(...werte, 1) : 1;

  // Ausreißer nur benennen, wenn der Stand überhaupt eine belastbare Mitte hat.
  const belastbar = werte.length >= 3 && mitte != null && mitte >= 4;
  const einordnen = (z) => {
    if (!belastbar || z.gassen == null) return null;
    if (z.gassen <= mitte * 0.7) return 'schwach';
    if (z.gassen >= mitte * 1.3) return 'stark';
    return 'mittel';
  };
  for (const z of zeilen) z.lage = einordnen(z);

  return {
    zeilen,
    median: mitte,
    hoechst,
    jahr,
    belastbar,
    schwach: zeilen.filter((z) => z.lage === 'schwach'),
    stark: zeilen.filter((z) => z.lage === 'stark'),
    mitDaten: werte.length,
  };
}

/** Einordnung eines einzelnen Volkes an seinem Stand (für die Volksansicht). */
export function volkEinordnen(S, volk, datum = heute()) {
  if (!volk?.standortId) return null;
  const v = standVergleich(S, volk.standortId, datum);
  const eigen = v.zeilen.find((z) => z.volk.id === volk.id);
  if (!eigen || eigen.gassen == null || !v.belastbar) return null;
  return { ...eigen, median: v.median, anzahl: v.mitDaten };
}
