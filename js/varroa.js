// Milbenverlauf eines Volkes.
// =============================================================================
// Die Zahlen stehen bisher einzeln im Verlauf, und genau dort nützen sie am
// wenigsten: Ob eine Behandlung gewirkt hat, erkennt man erst im Vergleich
// vorher/nachher – und im Verhältnis zur Schwelle, die im Jahresverlauf
// wandert (Mai 1, Juli 5, August 10 Milben je Tag).
//
// Deshalb drei Dinge in einem Bild:
//   1. die Messwerte als Linie mit Punkten,
//   2. die Monatsschwelle als Stufe im Hintergrund – Kurve darüber heißt Handeln,
//   3. die Behandlungen als senkrechte Marken mit Mittel und Menge.
//
// Bewusst eine einzige Datenreihe mit Bezugslinie statt zweier Achsen: Milben
// je Tag und Milliliter Säure haben nichts miteinander zu tun, also bekommt die
// Menge auch keine Achse, sondern steht als Text an der Marke.

import { parseISO, iso, heute, fmtDatum } from './util.js';
import { varroaSchwelle } from './regeln.js';
import { t } from './i18n.js';

const VARROA_MITTEL = ['sommerbehandlung1', 'sommerbehandlung2', 'restentmilbung'];
const VARROA_BIOTECHNIK = ['drohnenbrut', 'ableger'];

/** Alle Milbenwerte und Behandlungen eines Volkes in einem Jahr. */
export function varroaVerlauf(S, volkId, jahr = heute().getFullYear()) {
  const imJahr = (d) => parseISO(d).getFullYear() === jahr;

  const messungen = [];
  for (const d of S.durchsichten) {
    if (d.volkId !== volkId || d.deletedAt || !imJahr(d.datum)) continue;
    if (d.milbenProTag == null || d.milbenProTag === '') continue;
    messungen.push({ datum: d.datum, wert: Number(d.milbenProTag), quelle: 'durchsicht' });
  }
  for (const e of S.erledigungen) {
    if (e.zielId !== volkId || e.deletedAt || !imJahr(e.datum)) continue;
    if (e.status === 'uebersprungen') continue;
    if (e.daten?.milbenProTag != null && e.daten.milbenProTag !== '') {
      messungen.push({ datum: e.datum, wert: Number(e.daten.milbenProTag), quelle: e.regelId });
    }
  }
  messungen.sort((a, b) => (a.datum < b.datum ? -1 : 1));

  const behandlungen = S.erledigungen
    .filter((e) => e.zielId === volkId && !e.deletedAt && e.status !== 'uebersprungen'
      && imJahr(e.datum) && (VARROA_MITTEL.includes(e.regelId) || VARROA_BIOTECHNIK.includes(e.regelId)))
    .map((e) => ({
      datum: e.datum,
      regelId: e.regelId,
      biotechnisch: VARROA_BIOTECHNIK.includes(e.regelId),
      mittel: e.daten?.praeparat || '',
      menge: e.daten?.menge != null ? `${e.daten.menge} ml` : '',
      kurz: kurzname(e.regelId),
    }))
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));

  // Bewertung: der jüngste Wert gegen die Schwelle seines Monats
  const letzte = messungen[messungen.length - 1] || null;
  let lage = null;
  if (letzte) {
    const monat = parseISO(letzte.datum).getMonth() + 1;
    const schwelle = varroaSchwelle(monat);
    lage = {
      wert: letzte.wert,
      datum: letzte.datum,
      schwelle,
      ueber: letzte.wert >= schwelle,
      // Hat die letzte Behandlung gewirkt? Nur beantwortbar, wenn davor und
      // danach gemessen wurde.
      nachBehandlung: null,
    };
    const letzteBeh = behandlungen[behandlungen.length - 1];
    if (letzteBeh) {
      const davor = messungen.filter((m) => m.datum < letzteBeh.datum).pop();
      const danach = messungen.filter((m) => m.datum > letzteBeh.datum)[0];
      if (davor && danach) {
        lage.nachBehandlung = {
          von: davor.wert, auf: danach.wert, behandlung: letzteBeh.kurz,
          wirkung: davor.wert > 0 ? Math.round((1 - danach.wert / davor.wert) * 100) : null,
        };
      }
    }
  }

  return { jahr, messungen, behandlungen, lage };
}

function kurzname(regelId) {
  return {
    sommerbehandlung1: 'Sommerbehandlung 1',
    sommerbehandlung2: 'Sommerbehandlung 2',
    restentmilbung: 'Restentmilbung',
    drohnenbrut: 'Drohnenbrut',
    ableger: 'Ableger',
  }[regelId] || regelId;
}

/**
 * Zeichnung als SVG. Bewusst ohne Legendenkasten: die drei Elemente sind direkt
 * beschriftet, das spart auf dem Handy die halbe Höhe.
 */
export function varroaBild(verlauf, { breite = 320, hoehe = 132 } = {}) {
  const { messungen, behandlungen, jahr } = verlauf;
  if (!messungen.length) return '';

  const randL = 26; const randR = 8; const randO = 12; const randU = 18;
  const innenB = breite - randL - randR;
  const innenH = hoehe - randO - randU;

  // Zeitachse: vom ersten Messmonat bis zum letzten Ereignis, mindestens 60 Tage
  const tage = [...messungen, ...behandlungen].map((x) => parseISO(x.datum).getTime());
  let t0 = Math.min(...tage);
  let t1 = Math.max(...tage);
  if (t1 - t0 < 60 * 86400000) t1 = t0 + 60 * 86400000;
  const x = (d) => randL + ((parseISO(d).getTime() - t0) / (t1 - t0)) * innenB;

  const hoechst = Math.max(...messungen.map((m) => m.wert), 3);
  const obergrenze = Math.max(hoechst * 1.15, 3);
  const y = (w) => randO + innenH - (Math.min(w, obergrenze) / obergrenze) * innenH;

  // Schwellen-Stufenlinie über den dargestellten Zeitraum
  const stufen = [];
  const von = new Date(t0); const bis = new Date(t1);
  for (let m = von.getMonth(); ; m++) {
    const anfang = new Date(von.getFullYear(), m, 1);
    const ende = new Date(von.getFullYear(), m + 1, 1);
    const a = Math.max(anfang.getTime(), t0);
    const b = Math.min(ende.getTime(), t1);
    if (a < b) {
      const s = varroaSchwelle(anfang.getMonth() + 1);
      stufen.push({
        x1: randL + ((a - t0) / (t1 - t0)) * innenB,
        x2: randL + ((b - t0) / (t1 - t0)) * innenB,
        y: y(s), s,
      });
    }
    if (ende.getTime() >= bis.getTime()) break;
  }

  const punkte = messungen.map((m) => [x(m.datum), y(m.wert)]);
  const linie = punkte.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');

  const schwellenPfad = stufen.map((st, i) => {
    const anfang = i === 0 ? `M${st.x1.toFixed(1)} ${st.y.toFixed(1)}`
      : `L${st.x1.toFixed(1)} ${st.y.toFixed(1)}`;
    return `${anfang} L${st.x2.toFixed(1)} ${st.y.toFixed(1)}`;
  }).join(' ');

  // Beschriftung der Marken: rechts von der Linie, außer die Marke liegt selbst
  // schon rechts – dann links davon, sonst läuft der Text aus dem Bild.
  const marken = behandlungen.map((b, i) => {
    const bx = x(b.datum);
    const beschriftung = [b.kurz.replace('Sommerbehandlung ', 'SB'), b.menge].filter(Boolean).join(' ');
    const rechts = bx > randL + innenB * 0.6;
    // Mehrere Marken dicht beieinander: abwechselnd zwei Zeilen tief setzen
    const zeile = randO + 6 + (i % 2) * 9;
    return `<line x1="${bx.toFixed(1)}" y1="${randO - 4}" x2="${bx.toFixed(1)}" y2="${randO + innenH}"
        stroke="var(--ueberfaellig)" stroke-width="1.2"
        stroke-dasharray="${b.biotechnisch ? '2 3' : '4 3'}" opacity=".55"/>
      <text x="${(rechts ? bx - 2 : bx + 2).toFixed(1)}" y="${zeile}" font-size="7.5"
        text-anchor="${rechts ? 'end' : 'start'}"
        fill="var(--text-schwach)">${beschriftung}</text>`;
  }).join('');

  const letzter = messungen[messungen.length - 1];
  const beschriftung = stufen.length
    ? `<text x="${randL + 2}" y="${(stufen[0].y - 3).toFixed(1)}" font-size="7.5"
        fill="var(--text-zart)">${t('Schwelle')}</text>` : '';

  return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%;height:${hoehe}px"
      role="img" aria-label="${t('Milbenverlauf {jahr}', { jahr })}">
    <line x1="${randL}" y1="${randO + innenH}" x2="${breite - randR}" y2="${randO + innenH}"
      stroke="var(--rand)" stroke-width="1"/>
    <path d="${schwellenPfad}" fill="none" stroke="var(--faellig)" stroke-width="1.4"
      stroke-dasharray="6 4" opacity=".75"/>
    ${beschriftung}
    ${marken}
    <path d="${linie}" fill="none" stroke="var(--honig)" stroke-width="2"
      stroke-linejoin="round" stroke-linecap="round"/>
    ${punkte.map(([px, py], i) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3"
      fill="var(--honig)" stroke="var(--karte)" stroke-width="1.5"/>`).join('')}
    <text x="2" y="${(randO + 4).toFixed(1)}" font-size="8" fill="var(--text-zart)">${
  Math.round(obergrenze)}</text>
    <text x="2" y="${(randO + innenH).toFixed(1)}" font-size="8" fill="var(--text-zart)">0</text>
    <text x="${randL}" y="${hoehe - 4}" font-size="8" fill="var(--text-zart)">${
  fmtDatum(iso(new Date(t0)))}</text>
    <text x="${breite - randR}" y="${hoehe - 4}" font-size="8" fill="var(--text-zart)"
      text-anchor="end">${fmtDatum(letzter.datum)}</text>
  </svg>`;
}
