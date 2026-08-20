// Ein- und Auswinterung: Verluste ehrlich zählen.
// =============================================================================
// Die Winterverlustrate ist die einzige Zahl, an der man über Jahre sieht, ob
// die eigene Betriebsweise trägt. Sie ist auch die Zahl, die man am liebsten
// vergisst: im März zählt man die Völker, ärgert sich und macht weiter.
//
// Deshalb hier zwei Grundsätze:
//   1. **Ein Datensatz je Volk und Winter.** Nur so lässt sich später fragen,
//      woran die Völker gestorben sind – eine Verlustquote ohne Ursachen ist
//      eine Zahl zum Ärgern, keine zum Lernen.
//   2. **Erfassung fällt möglichst nebenbei an.** Wer im Herbst „Auffüttern
//      abschließen", „Wintersitz" oder „Mäusegitter" abhakt, hat eingewintert –
//      das genügt als Eintrag. Und wer im Frühjahr die erste Durchsicht macht,
//      sagt damit: dieses Volk lebt.
//
// Eine Saison heißt nach ihrem Anfangsjahr: `2026` ist der Winter 2026/27.
// Umgestellt wird im August, weil dann die Einwinterung beginnt (letzte Ernte,
// Behandlung, Auffüttern) – nicht im Januar.

import { parseISO, heute } from './util.js';

/** Woran Völker im Winter eingehen. Bewusst die Gründe, die man wirklich sieht. */
export const VERLUST_GRUENDE = [
  'Varroa / Zusammenbruch',
  'verhungert',
  'weisellos',
  'Nosema / Ruhr',
  'Räuberei',
  'Mäuse oder Umsturz',
  'zu schwach eingewintert',
  'unbekannt',
];

export const AUSGANG = ['durchgekommen', 'schwach', 'verloren'];

/** Aufgaben, deren Erledigung „eingewintert" bedeutet. */
export const EINWINTERUNG_REGELN = ['auffuettern_ende', 'wintersitz', 'mauseschutz',
  'restentmilbung'];

/** Aufgaben, deren Erledigung im Frühjahr „lebt" bedeutet. */
export const AUSWINTERUNG_REGELN = ['erste_durchsicht', 'boden_waben'];

const winterLebt = (r) => r && !r.deletedAt;

/** Saison zu einem Datum: ab August zählt das laufende Jahr. */
export function saisonVon(datum = heute()) {
  const d = datum instanceof Date ? datum : parseISO(datum);
  return d.getMonth() + 1 >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

/** `2026` → „2026/27" */
export const saisonName = (saison) => `${saison}/${String((saison + 1) % 100).padStart(2, '0')}`;

const saetze = (S, saison, art) => (S.winterung || [])
  .filter((w) => winterLebt(w) && w.saison === saison && (!art || (w.art || 'volk') === art));

/** Der Eintrag eines Volkes für eine Saison, falls vorhanden. */
export const winterSatz = (S, volkId, saison) =>
  saetze(S, saison, 'volk').find((w) => w.volkId === volkId) || null;

/**
 * Bilanz einer Saison.
 * Handeinträge früherer Jahre (`art: 'sammel'`) werden mitgezählt, aber getrennt
 * ausgewiesen – man soll sehen, welche Zahl aus Erfassung und welche aus
 * Erinnerung stammt.
 */
export function winterBilanz(S, saison = saisonVon()) {
  const proVolk = saetze(S, saison, 'volk');
  const sammel = saetze(S, saison, 'sammel');

  const zeilen = proVolk.map((w) => ({
    ...w,
    volk: (S.voelker || []).find((v) => v.id === w.volkId) || null,
    stand: (S.standorte || []).find((s) => s.id === w.standortId) || null,
  }));

  const zaehl = (art) => zeilen.filter((z) => z.ausgang === art).length;
  const ein = zeilen.length + sammel.reduce((s, x) => s + (Number(x.anzahlEin) || 0), 0);
  const verloren = zaehl('verloren') + sammel.reduce((s, x) => s + (Number(x.anzahlVerloren) || 0), 0);
  const durch = zaehl('durchgekommen') + zaehl('schwach')
    + sammel.reduce((s, x) => s + Math.max(0, (Number(x.anzahlEin) || 0)
      - (Number(x.anzahlVerloren) || 0)), 0);
  const offen = zeilen.filter((z) => !z.ausgang).length;

  // Je Stand: nur die volksgenauen Sätze, Sammelzahlen haben keinen Stand
  const jeStand = new Map();
  for (const z of zeilen) {
    const key = z.standortId || 'ohne';
    const e = jeStand.get(key) || { name: z.stand?.name || 'ohne Standort', ein: 0, verloren: 0 };
    e.ein += 1;
    if (z.ausgang === 'verloren') e.verloren += 1;
    jeStand.set(key, e);
  }

  const gruende = new Map();
  for (const z of zeilen) {
    if (z.ausgang !== 'verloren') continue;
    const g = z.grund || 'unbekannt';
    gruende.set(g, (gruende.get(g) || 0) + 1);
  }

  // Rate erst rechnen, wenn die Saison ausgewertet ist – sonst wären offene
  // Völker stillschweigend „durchgekommen".
  const bewertet = ein - offen;
  return {
    saison,
    name: saisonName(saison),
    zeilen: zeilen.sort((a, b) => (a.volk?.name || '').localeCompare(b.volk?.name || '', 'de',
      { numeric: true })),
    sammel,
    ein,
    durch,
    schwach: zaehl('schwach'),
    verloren,
    offen,
    bewertet,
    rate: bewertet > 0 ? Math.round((verloren / bewertet) * 1000) / 10 : null,
    jeStand: [...jeStand.values()].map((s) => ({ ...s,
      rate: s.ein ? Math.round((s.verloren / s.ein) * 1000) / 10 : null })),
    gruende: [...gruende.entries()].map(([grund, anzahl]) => ({ grund, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl),
  };
}

/** Alle Saisons mit Einträgen, neueste zuerst. */
export function winterSaisons(S) {
  const set = new Set((S.winterung || []).filter(winterLebt).map((w) => w.saison));
  set.add(saisonVon());
  return [...set].sort((a, b) => b - a);
}

/** Mehrjahresvergleich für die Balken: nur ausgewertete Saisons. */
export function winterReihe(S) {
  return winterSaisons(S)
    .map((s) => winterBilanz(S, s))
    .filter((b) => b.bewertet > 0)
    .sort((a, b) => a.saison - b.saison);
}

/** Völker, die eingewintert sind, aber noch keinen Ausgang haben. */
export const offeneAuswinterung = (S, saison = saisonVon()) =>
  winterBilanz(S, saison).zeilen.filter((z) => !z.ausgang && z.volk);

/** Völker im Bestand, für die diese Saison noch kein Eintrag existiert. */
export function nichtEingewintert(S, saison = saisonVon()) {
  const drin = new Set(saetze(S, saison, 'volk').map((w) => w.volkId));
  return (S.voelker || []).filter((v) => v.status !== 'aufgeloest' && !drin.has(v.id));
}

/** Ein Satz zur Lage – oder null, wenn es nichts zu sagen gibt. */
export function winterSatzText(b, t = (x) => x) {
  if (!b.ein) return null;
  if (b.offen === b.ein) {
    return t('{n} Völker eingewintert. Im Frühjahr die Auswinterung erfassen – dann steht hier '
      + 'die Verlustrate.', { n: b.ein });
  }
  if (b.offen) {
    return t('{n} von {g} Völkern sind noch nicht ausgewertet. Die Rate wird erst aus den '
      + 'bewerteten Völkern gerechnet.', { n: b.offen, g: b.ein });
  }
  if (!b.verloren) {
    return t('Alle {n} Völker sind durch den Winter gekommen.', { n: b.ein });
  }
  return t('{v} von {n} Völkern verloren – {r} %.',
    { v: b.verloren, n: b.bewertet, r: String(b.rate).replace('.', ',') });
}
