// Gewicht über das Jahr – Stockwaage von Hand.
// =============================================================================
// Eine Kofferwaage an der Hinterkante („Kippprobe") ist die billigste
// Stockwaage, die es gibt. Sie taugt aber nur für eine Sorte Aussage:
// **Differenzen zwischen zwei Wägungen.** Absolutwerte sind wertlos, weil die
// Kippprobe je nach Ansatzpunkt und Kippwinkel grob die Hälfte des
// Gesamtgewichts misst – und weil niemand weiß, was seine leere Beute wiegt.
//
// Daraus folgen die drei Regeln dieses Moduls:
//
//   1. **Nullpunkt statt Tara-Tabelle.** Direkt nach der letzten Ernte ist im
//      Volk fast kein Vorrat. Dieses Gewicht wird der Bezugspunkt; alles, was
//      danach dazukommt, ist Futter. Eine Tabelle mit Leergewichten je Zarge
//      wäre Scheingenauigkeit: Beuten wiegen je nach Holz und Alter anders.
//   2. **Nur gleiche Wägeart vergleichen.** Kippprobe und ganze Beute sind zwei
//      verschiedene Maßstäbe. Wechselt die Art, ist die Reihe unterbrochen –
//      das wird angezeigt und nicht stillschweigend verrechnet.
//   3. **Rauschen nicht deuten.** Die Methode streut rund ein Kilo (nasses Holz,
//      fliegende Bienen, Ansatzpunkt). Unterschiede unter `RAUSCHEN` bleiben
//      unkommentiert; erst darüber wird ein Satz daraus.
//
// Was hier bewusst NICHT passiert: eine Trachtprognose. Dafür bräuchte es
// tägliche Werte, also eine echte Stockwaage. Vier bis sechs Wägungen im Jahr
// beantworten die Futterfrage – und nur die.

import { parseISO, iso, heute, diffTage, fmtDatum } from './util.js';
import { futterBedarf } from './regeln.js';

export const WIEGEARTEN = ['Kippprobe hinten', 'ganze Beute'];

/** Unterhalb dieser Differenz (kg) sagt die App nichts. */
export const RAUSCHEN = 1;

/**
 * Sirup wird im Volk eingedickt: aus der gegebenen Menge wird weniger
 * Winterfutter. Fertigsirup rechnet praktisch 1:1 (siehe futterBedarf), die
 * Waage sieht davon aber nur, was nach dem Verdunsten übrig bleibt.
 */
export const SIRUP_FAKTOR = 0.85;

/**
 * Die Kippprobe hebt die Beute nur an einer Kante an und zeigt deshalb grob die
 * HÄLFTE einer Gewichtsänderung. Ohne Umrechnung wäre der Vergleich mit dem
 * Zielvorrat irreführend („es fehlen 14 kg", obwohl drei fehlen).
 *
 * Zwei ist ein Näherungswert; die Hebelverhältnisse hängen von Beute und
 * Ansatzpunkt ab. Wer es genauer will, wiegt einmal am selben Tag beides –
 * dann rechnet die App mit dem eigenen Verhältnis (siehe kippFaktor).
 */
export const KIPP_FAKTOR = 2;

/**
 * Eigenes Verhältnis zwischen ganzer Beute und Kippprobe, falls am selben Tag
 * beides gewogen wurde. Median über alle solchen Tage – ein einzelner Tag kann
 * daneben liegen.
 */
export function kippFaktor(S, volkId) {
  const je = new Map();
  for (const w of (S.wiegungen || [])) {
    if (!gewLebt(w) || w.volkId !== volkId || gewZahl(w.kg) == null) continue;
    const tag = je.get(w.datum) || {};
    tag[w.art || WIEGEARTEN[0]] = Number(w.kg);
    je.set(w.datum, tag);
  }
  const paare = [...je.values()]
    .filter((tag) => tag[WIEGEARTEN[0]] > 0 && tag[WIEGEARTEN[1]] > 0)
    .map((tag) => tag[WIEGEARTEN[1]] / tag[WIEGEARTEN[0]])
    .sort((a, b) => a - b);
  if (!paare.length) return { faktor: KIPP_FAKTOR, eigen: false };
  const m = Math.floor(paare.length / 2);
  const median = paare.length % 2 ? paare[m] : (paare[m - 1] + paare[m]) / 2;
  return { faktor: Math.round(median * 100) / 100, eigen: true };
}

const gewLebt = (r) => r && !r.deletedAt;
const gewZahl = (x) => (x == null || x === '' ? null : Number(x));
const einsRunden = (x) => Math.round(x * 10) / 10;

/** Ereignisse, die einen Sprung in der Kurve erklären. */
const EREIGNIS_REGELN = {
  fruehtracht: 'Ernte',
  sommertracht: 'Ernte',
  honigraum: 'Honigraum',
  erweitern: 'Zarge',
  auffuettern: 'Futter',
  auffuettern_ende: 'Futter',
  anfuettern: 'Futter',
};

/**
 * Wägungen eines Volkes samt Differenzen, Nullpunkt und Ereignismarken.
 */
export function gewichtsVerlauf(S, volkId, { jetzt = heute() } = {}) {
  const alle = (S.wiegungen || [])
    .filter((w) => gewLebt(w) && w.volkId === volkId && gewZahl(w.kg) != null)
    .sort((a, b) => (a.datum < b.datum ? -1 : 1))
    .map((w) => ({ ...w, kg: Number(w.kg), art: w.art || WIEGEARTEN[0] }));

  // Differenzen nur innerhalb derselben Wägeart
  const punkte = alle.map((w, i) => {
    const vorher = [...alle.slice(0, i)].reverse().find((x) => x.art === w.art);
    if (!vorher) return { ...w, diff: null, tage: null, proMonat: null, bruch: i > 0 };
    const tage = diffTage(parseISO(w.datum), parseISO(vorher.datum));
    const diff = einsRunden(w.kg - vorher.kg);
    return {
      ...w,
      diff,
      tage,
      proMonat: tage > 0 ? einsRunden((diff / tage) * 30) : null,
      deutbar: Math.abs(diff) >= RAUSCHEN,
      bruch: alle[i - 1] && alle[i - 1].art !== w.art,
    };
  });

  const letzte = punkte[punkte.length - 1] || null;
  // Nullpunkt: ausdrücklich gesetzt, sonst die jüngste Wägung nach der letzten
  // Ernte des Jahres – dann ist der Honig raus und der Rest ist Futter.
  const gesetzt = [...punkte].reverse().find((p) => p.nullpunkt);
  const letzteErnte = (S.erledigungen || [])
    .filter((e) => gewLebt(e) && e.status !== 'uebersprungen'
      && ['fruehtracht', 'sommertracht'].includes(e.regelId) && e.zielId === volkId)
    .map((e) => e.datum).sort().pop() || null;
  const abgeleitet = letzteErnte
    ? punkte.find((p) => p.datum >= letzteErnte) : null;
  const nullpunkt = gesetzt || abgeleitet || null;

  const ereignisse = (S.erledigungen || [])
    .filter((e) => gewLebt(e) && e.zielId === volkId && e.status !== 'uebersprungen'
      && EREIGNIS_REGELN[e.regelId] && punkte.length
      && e.datum >= punkte[0].datum && e.datum <= (letzte?.datum || ''))
    .map((e) => ({ datum: e.datum, was: EREIGNIS_REGELN[e.regelId],
      kg: gewZahl(e.daten?.kg) }))
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));

  return {
    punkte,
    letzte,
    nullpunkt,
    nullpunktAbgeleitet: !gesetzt && !!abgeleitet,
    ereignisse,
    erfasst: punkte.length > 0,
    arten: [...new Set(punkte.map((p) => p.art))],
    jetzt: iso(jetzt),
  };
}

/**
 * Futterstand aus dem Nullpunkt: alles über dem Bezugspunkt ist Vorrat.
 * Zusätzlich, was laut Erledigungen gegeben wurde – die beiden Zahlen
 * nebeneinander sind der eigentliche Nutzen: sie zeigen, ob das Volk das Futter
 * auch angenommen hat.
 */
export function futterStand(S, volk, verlauf, { jetzt = heute() } = {}) {
  if (!verlauf.nullpunkt || !verlauf.letzte) return null;
  // Verglichen wird mit der jüngsten Wägung DERSELBEN Art wie der Nullpunkt –
  // nicht stur mit der letzten: sonst verschwindet die Aussage, sobald einmal
  // anders gewogen wurde.
  const bezug = [...verlauf.punkte].reverse().find((p) => p.art === verlauf.nullpunkt.art);
  if (!bezug || bezug.datum === verlauf.nullpunkt.datum) return null;

  const gemessen = einsRunden(bezug.kg - verlauf.nullpunkt.kg);
  const kipp = bezug.art === WIEGEARTEN[0];
  const { faktor, eigen } = kippFaktor(S, volk.id);
  // Bei der Kippprobe ist die gemessene Differenz nur ein Teil der wirklichen.
  const imVolk = kipp ? einsRunden(gemessen * faktor) : gemessen;

  const gegeben = (S.erledigungen || [])
    .filter((e) => gewLebt(e) && e.zielId === volk.id && e.status !== 'uebersprungen'
      && ['auffuettern', 'auffuettern_ende', 'anfuettern'].includes(e.regelId)
      && e.datum >= verlauf.nullpunkt.datum && gewZahl(e.daten?.kg) != null)
    .reduce((s, e) => s + Number(e.daten.kg), 0);

  const gassen = letzterWert(S, volk.id, 'wabengassen');
  const bedarf = futterBedarf({ beute: volk.beute, gassen,
    vorhanden: Math.max(0, imVolk), jungvolk: !!volk.gebildetAm });

  return {
    imVolk,
    gemessen,
    faktor: kipp ? faktor : 1,
    eigenerFaktor: kipp && eigen,
    gegeben: einsRunden(gegeben),
    erwartet: einsRunden(gegeben * SIRUP_FAKTOR),
    ziel: bedarf.ziel,
    fehlt: bedarf.fehlt,
    gassen,
    kipp,
    stand: bezug.datum,
  };
}

const letzterWert = (S, volkId, feld) => {
  const d = (S.durchsichten || [])
    .filter((x) => gewLebt(x) && x.volkId === volkId && x[feld] != null && x[feld] !== '')
    .sort((a, b) => (a.datum < b.datum ? 1 : -1))[0];
  return d ? Number(d[feld]) : null;
};

/**
 * Winterzehrung: aus den letzten beiden Wägungen derselben Art.
 * Rechnet hoch, wie lange der Vorrat noch reicht – die eine Auskunft, für die
 * es im Dezember keinen anderen Weg gibt, weil man nicht öffnen darf.
 */
export function zehrung(S, volk, verlauf, { jetzt = heute(), bisMonat = 3 } = {}) {
  // Die jüngste Wägung, die überhaupt eine Differenz hat: wer zuletzt die ganze
  // Beute gewogen hat, verliert sonst die Zehrungsrechnung aus der Kippprobe.
  const letzte = [...verlauf.punkte].reverse().find((p) => p.proMonat != null);
  if (!letzte || letzte.diff >= 0 || !letzte.deutbar) return null;

  const stand = futterStand(S, volk, verlauf, { jetzt });
  const rest = stand ? Math.max(0, stand.imVolk) : null;
  const proMonat = Math.abs(letzte.proMonat);
  const monate = rest != null && proMonat > 0 ? rest / proMonat : null;

  // Bis wann muss es reichen? Bis zur ersten eigenen Tracht, grob Mitte März.
  const ziel = new Date(jetzt.getFullYear(), bisMonat - 1, 15);
  if (ziel < jetzt) ziel.setFullYear(ziel.getFullYear() + 1);
  const monateBis = (ziel - jetzt) / (30 * 86400000);

  return {
    proMonat: einsRunden(proMonat),
    rest: rest != null ? einsRunden(rest) : null,
    monate: monate != null ? Math.round(monate * 10) / 10 : null,
    reicht: monate != null ? monate >= monateBis : null,
    bis: iso(ziel),
    fehlt: monate != null && monate < monateBis
      ? einsRunden((monateBis - monate) * proMonat) : 0,
  };
}

/** Sätze zur Lage – jeder einzeln entbehrlich, keiner erfunden. */
export function gewichtSaetze(S, volk, verlauf, t = (x) => x) {
  const raus = [];
  const letzte = verlauf.letzte;
  if (!letzte) return raus;

  if (letzte.diff == null) {
    raus.push(t('Erste Wägung: {kg} kg am {d}. Ab der zweiten Wägung rechnet BeeWise die '
      + 'Differenz.', { kg: kgText(letzte.kg), d: fmtDatum(letzte.datum) }));
  } else if (!letzte.deutbar) {
    raus.push(t('Seit {d} nahezu unverändert ({diff} kg in {n}) – das liegt im Rauschen '
      + 'der Methode.', { d: fmtDatum(vorherDatum(verlauf)), diff: kgText(letzte.diff),
      n: tageText(letzte.tage, t) }));
  } else {
    raus.push(letzte.diff > 0
      ? t('Seit {d} plus {diff} kg in {n}.',
        { d: fmtDatum(vorherDatum(verlauf)), diff: kgText(Math.abs(letzte.diff)),
          n: tageText(letzte.tage, t) })
      : t('Seit {d} minus {diff} kg in {n}, also gut {m} kg im Monat.',
        { d: fmtDatum(vorherDatum(verlauf)), diff: kgText(Math.abs(letzte.diff)),
          n: tageText(letzte.tage, t), m: kgText(Math.abs(letzte.proMonat)) }));
  }

  const stand = futterStand(S, volk, verlauf);
  if (stand) {
    raus.push(stand.kipp
      ? t('Über dem Nullpunkt vom {d}: {gem} kg an der Kippprobe, umgerechnet etwa {kg} kg '
        + 'Vorrat{eigen}.', { d: fmtDatum(verlauf.nullpunkt.datum), gem: kgText(stand.gemessen),
        kg: kgText(stand.imVolk),
        eigen: stand.eigenerFaktor ? ' ' + t('(mit deinem eigenen Verhältnis gerechnet)')
          : ' ' + t('(Faustwert: Kippprobe × 2)') })
      : t('Über dem Nullpunkt vom {d}: {kg} kg Vorrat.',
        { d: fmtDatum(verlauf.nullpunkt.datum), kg: kgText(stand.imVolk) }));
    if (stand.gegeben) {
      raus.push(t('Gegeben wurden {g} kg, davon dürften rund {e} kg als Winterfutter hängen '
        + 'bleiben.', { g: kgText(stand.gegeben), e: kgText(stand.erwartet) }));
    }
    if (stand.fehlt > 0) {
      raus.push(t('Ziel für diese Beute: {ziel} kg – rechnerisch fehlen {fehlt} kg.',
        { ziel: stand.ziel, fehlt: kgText(stand.fehlt) }));
    }
  }

  const z = zehrung(S, volk, verlauf);
  if (z && z.monate != null) {
    raus.push(z.reicht
      ? t('Bei diesem Verbrauch reicht der Vorrat noch etwa {m} Monate – bis zur Weide genügt '
        + 'das.', { m: kgText(z.monate) })
      : t('Bei diesem Verbrauch reicht der Vorrat nur noch etwa {m} Monate. Bis Mitte März '
        + 'fehlen rund {f} kg – Futterteig auflegen.', { m: kgText(z.monate),
        f: kgText(z.fehlt) }));
  }

  if (verlauf.arten.length > 1) {
    raus.push(t('Achtung: es wurde auf zwei Arten gewogen. Verglichen wird nur innerhalb '
      + 'derselben Art.'));
  }
  return raus;
}

const vorherDatum = (verlauf) => {
  const letzte = verlauf.letzte;
  const vorher = [...verlauf.punkte].reverse().find((p) => p.art === letzte.art
    && p.datum < letzte.datum);
  return vorher ? vorher.datum : letzte.datum;
};

const kgText = (x) => String(einsRunden(Number(x))).replace('.', ',');

/** „1 Tag" statt „1 Tagen" – die Sätze werden sonst schief. */
const tageText = (n, t) => (Math.abs(n) === 1 ? t('1 Tag') : t('{n} Tagen', { n }));

/**
 * Völker, deren Vorrat rechnerisch nicht bis zur Weide reicht.
 * Nur im Winterhalbjahr – im Juni ist die Frage sinnlos.
 */
export function futterWarnungen(S, { jetzt = heute() } = {}) {
  const monat = jetzt.getMonth() + 1;
  if (monat > 3 && monat < 10) return [];
  const raus = [];
  for (const v of (S.voelker || [])) {
    if (v.status === 'aufgeloest') continue;
    const verlauf = gewichtsVerlauf(S, v.id, { jetzt });
    if (!verlauf.erfasst) continue;
    const z = zehrung(S, v, verlauf, { jetzt });
    if (z && z.reicht === false) raus.push({ volk: v, ...z });
  }
  return raus.sort((a, b) => (a.monate ?? 99) - (b.monate ?? 99));
}

/**
 * Kurve mit Ereignismarken. Eine Datenreihe, eine Farbe; die Marken sind
 * beschriftet, damit ein Sprung erklärt ist statt rätselhaft.
 */
export function gewichtBild(verlauf, { breite = 320, hoehe = 140 } = {}) {
  const punkte = verlauf.punkte;
  if (punkte.length < 2) return '';

  const randL = 26; const randR = 8; const randO = 12; const randU = 18;
  const innenB = breite - randL - randR;
  const innenH = hoehe - randO - randU;

  const zeiten = punkte.map((p) => parseISO(p.datum).getTime());
  const t0 = Math.min(...zeiten);
  const t1 = Math.max(...zeiten, t0 + 30 * 86400000);
  const x = (d) => randL + ((parseISO(d).getTime() - t0) / (t1 - t0)) * innenB;

  const werte = punkte.map((p) => p.kg);
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const spanne = Math.max(max - min, 4);
  const unten = min - spanne * 0.15;
  const oben = max + spanne * 0.15;
  const y = (kg) => randO + innenH - ((kg - unten) / (oben - unten)) * innenH;

  // Getrennte Linien je Wägeart: zwei Maßstäbe gehören nicht verbunden.
  const linien = verlauf.arten.map((art) => {
    const teil = punkte.filter((p) => p.art === art);
    if (teil.length < 2) return '';
    const d = teil.map((p, i) => `${i ? 'L' : 'M'}${x(p.datum).toFixed(1)} ${y(p.kg).toFixed(1)}`)
      .join(' ');
    return `<path d="${d}" fill="none" stroke="var(--honig)" stroke-width="2"
      stroke-linejoin="round" stroke-linecap="round"
      ${art === WIEGEARTEN[0] ? '' : 'stroke-dasharray="5 3"'}/>`;
  }).join('');

  // Marken entzerren: liegen zwei Ereignisse dichter als 14 Punkte beieinander,
  // überdeckt die Beschriftung sich gegenseitig – dann bleibt das erste stehen.
  const sichtbar = [];
  for (const e of verlauf.ereignisse) {
    const mx = x(e.datum);
    if (sichtbar.length >= 6) break;
    const vorher = sichtbar[sichtbar.length - 1];
    if (vorher && Math.abs(x(vorher.datum) - mx) < 14 && vorher.was === e.was) continue;
    sichtbar.push(e);
  }

  const marken = sichtbar.map((e, i) => {
    const mx = x(e.datum);
    return `<line x1="${mx.toFixed(1)}" y1="${randO - 4}" x2="${mx.toFixed(1)}"
        y2="${randO + innenH}" stroke="var(--rand-stark)" stroke-width="1"
        stroke-dasharray="3 3" opacity=".7"/>
      <text x="${(mx + 2).toFixed(1)}" y="${randO + 6 + (i % 2) * 9}" font-size="7.5"
        fill="var(--text-zart)">${e.was}</text>`;
  }).join('');

  const nullLinie = verlauf.nullpunkt ? `<line x1="${randL}" y1="${y(verlauf.nullpunkt.kg)
    .toFixed(1)}" x2="${breite - randR}" y2="${y(verlauf.nullpunkt.kg).toFixed(1)}"
      stroke="var(--faellig)" stroke-width="1.2" stroke-dasharray="6 4" opacity=".8"/>
    <text x="${randL + 2}" y="${(y(verlauf.nullpunkt.kg) - 3).toFixed(1)}" font-size="7.5"
      fill="var(--text-zart)">Nullpunkt</text>` : '';

  return `<svg viewBox="0 0 ${breite} ${hoehe}" style="width:100%;height:${hoehe}px"
      role="img" aria-label="Gewichtsverlauf">
    <line x1="${randL}" y1="${randO + innenH}" x2="${breite - randR}" y2="${randO + innenH}"
      stroke="var(--rand)" stroke-width="1"/>
    ${nullLinie}
    ${marken}
    ${linien}
    ${punkte.map((p) => `<circle cx="${x(p.datum).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3"
      fill="var(--honig)" stroke="var(--karte)" stroke-width="1.5"/>`).join('')}
    <text x="2" y="${(randO + 4).toFixed(1)}" font-size="8" fill="var(--text-zart)">${
  Math.round(oben)}</text>
    <text x="2" y="${(randO + innenH).toFixed(1)}" font-size="8" fill="var(--text-zart)">${
  Math.round(unten)}</text>
    <text x="${randL}" y="${hoehe - 4}" font-size="8" fill="var(--text-zart)">${
  fmtDatum(punkte[0].datum)}</text>
    <text x="${breite - randR}" y="${hoehe - 4}" font-size="8" fill="var(--text-zart)"
      text-anchor="end">${fmtDatum(punkte[punkte.length - 1].datum)}</text>
  </svg>`;
}
