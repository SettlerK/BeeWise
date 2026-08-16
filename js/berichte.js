// Berichte als PDF: Behandlungsprotokoll und Volkshistorie.
import { PDF } from './pdf.js';
import { fmtDatum, parseISO, iso, heute } from './util.js';
import { regelNach } from './regeln.js';

const BEHANDLUNGEN = ['sommerbehandlung1', 'sommerbehandlung2', 'restentmilbung'];
const BIOTECHNIK = ['drohnenbrut', 'baurahmen', 'ableger'];
const KONTROLLEN = ['befallskontrolle', 'behandlungserfolg'];
const ERNTEN = ['fruehtracht', 'sommertracht'];

const stand = (S, volkId) => {
  const v = S.voelker.find((x) => x.id === volkId);
  return S.standorte.find((s) => s.id === v?.standortId)?.name || '–';
};
const volkName = (S, id) => S.voelker.find((x) => x.id === id)?.name || '–';
const dat = (d) => fmtDatum(d, true);

/**
 * Behandlungsprotokoll für ein Jahr – das Dokument für die Bestandsdokumentation.
 */
export function behandlungsprotokoll(S, { jahr = new Date().getFullYear(), imkerei = '' } = {}) {
  const imJahr = (e) => parseISO(e.datum).getFullYear() === jahr && e.status !== 'uebersprungen';
  const erl = S.erledigungen.filter(imJahr).sort((a, b) => (a.datum < b.datum ? -1 : 1));

  const p = new PDF({
    titel: `Behandlungsprotokoll ${jahr}`,
    untertitel: [imkerei, `${S.voelker.length} Völker an ${S.standorte.length} Standorten`,
      `erstellt am ${dat(heute())}`].filter(Boolean).join(' · '),
    fusszeile: 'BeeWise · Behandlungsprotokoll ' + jahr,
  });

  p.text('Dokumentiert werden alle durchgeführten Varroabehandlungen, biotechnischen '
    + 'Maßnahmen und Befallskontrollen. Angaben zu Präparat und Menge stammen aus den '
    + 'Eintragungen des Imkers.', { groesse: 8.5, grau: true });

  // ---- Behandlungen
  const behandlungen = erl.filter((e) => BEHANDLUNGEN.includes(e.regelId));
  p.ueberschrift(`Varroabehandlungen (${behandlungen.length})`);
  if (behandlungen.length) {
    p.tabelle([
      { titel: 'Datum', breite: 62, schluessel: 'datum' },
      { titel: 'Volk', breite: 48, schluessel: 'volk' },
      { titel: 'Standort', breite: 70, schluessel: 'standort' },
      { titel: 'Maßnahme', breite: 92, schluessel: 'massnahme' },
      { titel: 'Präparat', breite: 90, schluessel: 'mittel' },
      { titel: 'Menge', breite: 46, schluessel: 'menge' },
      { titel: 'Bemerkung', breite: 84, schluessel: 'notiz' },
    ], behandlungen.map((e) => ({
      datum: dat(e.datum),
      volk: volkName(S, e.zielId),
      standort: stand(S, e.zielId),
      massnahme: (regelNach(e.regelId)?.titel || e.regelId).replace(' – Ameisensäure', ''),
      mittel: e.daten?.praeparat || '–',
      menge: e.daten?.menge ? `${e.daten.menge} ml` : '–',
      notiz: [e.daten?.anwendung, e.daten?.gassen ? `${e.daten.gassen} Gassen` : '', e.daten?.notiz]
        .filter(Boolean).join(', '),
    })));
  } else {
    p.text('Keine Einträge in diesem Jahr.', { groesse: 9, grau: true });
  }

  // ---- Befallskontrollen
  const kontrollen = erl.filter((e) => KONTROLLEN.includes(e.regelId));
  p.ueberschrift(`Befallskontrollen (${kontrollen.length})`);
  if (kontrollen.length) {
    p.tabelle([
      { titel: 'Datum', breite: 70, schluessel: 'datum' },
      { titel: 'Volk', breite: 55, schluessel: 'volk' },
      { titel: 'Standort', breite: 80, schluessel: 'standort' },
      { titel: 'Art', breite: 105, schluessel: 'art' },
      { titel: 'Milben/Tag', breite: 60, schluessel: 'wert' },
      { titel: 'Bemerkung', breite: 90, schluessel: 'notiz' },
    ], kontrollen.map((e) => ({
      datum: dat(e.datum),
      volk: volkName(S, e.zielId),
      standort: stand(S, e.zielId),
      art: e.regelId === 'befallskontrolle' ? 'Gemülldiagnose' : 'Erfolgskontrolle',
      wert: e.daten?.milbenProTag != null ? String(e.daten.milbenProTag) : '–',
      notiz: e.daten?.notiz || '',
    })));
  } else {
    p.text('Keine Einträge in diesem Jahr.', { groesse: 9, grau: true });
  }

  // ---- Biotechnik
  const bio = erl.filter((e) => BIOTECHNIK.includes(e.regelId));
  if (bio.length) {
    p.ueberschrift(`Biotechnische Maßnahmen (${bio.length})`);
    p.tabelle([
      { titel: 'Datum', breite: 70, schluessel: 'datum' },
      { titel: 'Volk', breite: 60, schluessel: 'volk' },
      { titel: 'Standort', breite: 85, schluessel: 'standort' },
      { titel: 'Maßnahme', breite: 145, schluessel: 'massnahme' },
      { titel: 'Bemerkung', breite: 100, schluessel: 'notiz' },
    ], bio.map((e) => ({
      datum: dat(e.datum),
      volk: volkName(S, e.zielId),
      standort: stand(S, e.zielId),
      massnahme: regelNach(e.regelId)?.titel || e.regelId,
      notiz: e.daten?.notiz || '',
    })));
  }

  p.abstand(14);
  p.text('Die Angaben beruhen auf den Eintragungen in BeeWise. Für Zulassung, Dosierung und '
    + 'Wartezeiten der eingesetzten Mittel gilt die jeweilige Packungsbeilage.',
  { groesse: 7.5, grau: true });

  return p;
}

/** Vollständige Historie eines Volkes. */
export function volkHistorie(S, volkId) {
  const v = S.voelker.find((x) => x.id === volkId);
  if (!v) return null;
  const st = S.standorte.find((s) => s.id === v.standortId);

  const p = new PDF({
    titel: `Stockkarte – Volk ${v.name}`,
    untertitel: [st?.name, v.beute, v.koeniginJahr ? `Königin ${v.koeniginJahr}` : '',
      `erstellt am ${dat(heute())}`].filter(Boolean).join(' · '),
    fusszeile: `BeeWise · Volk ${v.name}`,
  });

  // ---- Stammdaten
  p.ueberschrift('Stammdaten');
  const zeilen = [
    ['Bezeichnung', v.name],
    ['Standort', st?.name || '–'],
    ['Beute / Rähmchenmaß', v.beute || '–'],
    ['Zargen', v.zargen ? String(v.zargen) : '–'],
    ['Königin Jahrgang', v.koeniginJahr || '–'],
    ['Herkunft', v.herkunft || '–'],
    ['Notiz', v.notiz || '–'],
  ];
  for (const [k, w] of zeilen) {
    p.zelle(k, 45, { groesse: 9, grau: true, maxBreite: 130 });
    p.zelle(w, 180, { groesse: 9, maxBreite: 330 });
    p.y -= 13;
  }

  // ---- Saisonbilanz
  const jahre = new Map();
  const holen = (j) => {
    if (!jahre.has(j)) jahre.set(j, { ernte: 0, behandlungen: 0, durchsichten: 0, gassen: [] });
    return jahre.get(j);
  };
  for (const e of S.erledigungen.filter((x) => x.zielId === volkId && x.status !== 'uebersprungen')) {
    const b = holen(parseISO(e.datum).getFullYear());
    if (ERNTEN.includes(e.regelId) && e.daten?.kg) b.ernte += Number(e.daten.kg);
    if (BEHANDLUNGEN.includes(e.regelId)) b.behandlungen += 1;
    if (e.daten?.gassen) b.gassen.push(Number(e.daten.gassen));
  }
  for (const d of S.durchsichten.filter((x) => x.volkId === volkId)) {
    const b = holen(parseISO(d.datum).getFullYear());
    b.durchsichten += 1;
    if (d.wabengassen) b.gassen.push(Number(d.wabengassen));
  }
  if (jahre.size) {
    p.ueberschrift('Saisonbilanz');
    p.tabelle([
      { titel: 'Saison', breite: 60, schluessel: 'jahr' },
      { titel: 'Ernte', breite: 70, schluessel: 'ernte' },
      { titel: 'Behandlungen', breite: 80, schluessel: 'beh' },
      { titel: 'Durchsichten', breite: 80, schluessel: 'dur' },
      { titel: 'max. besetzte Wabengassen', breite: 120, schluessel: 'gassen' },
    ], [...jahre.entries()].sort((a, b) => b[0] - a[0]).map(([j, b]) => ({
      jahr: String(j),
      ernte: b.ernte ? `${b.ernte.toFixed(1).replace('.', ',')} kg` : '–',
      beh: String(b.behandlungen || '–'),
      dur: String(b.durchsichten || '–'),
      gassen: b.gassen.length ? String(Math.max(...b.gassen)) : '–',
    })));
  }

  // ---- Chronologie
  const ereignisse = [
    ...S.durchsichten.filter((d) => d.volkId === volkId).map((d) => ({
      datum: d.datum, art: 'Durchsicht',
      text: [
        d.wabengassen ? `${d.wabengassen} besetzte Wabengassen` : '',
        d.brut, d.koenigin,
        d.zellen ? `${d.zellen} Weiselzellen` : '',
        d.stimmung ? `Schwarmstimmung: ${d.stimmung}` : '',
        d.futter ? `${d.futter} kg Futter` : '',
        d.milbenProTag ? `${d.milbenProTag} Milben/Tag` : '',
        d.notiz,
      ].filter(Boolean).join(' · '),
    })),
    ...S.erledigungen.filter((e) => e.zielId === volkId).map((e) => ({
      datum: e.datum,
      art: regelNach(e.regelId)?.titel || e.regelId,
      text: Object.entries(e.daten || {}).filter(([k]) => k !== 'notiz')
        .map(([k, w]) => `${k}: ${w}`).concat(e.daten?.notiz ? [e.daten.notiz] : [])
        .join(' · ') + (e.status === 'uebersprungen' ? '  (übersprungen)' : ''),
    })),
    ...(S.wanderungen || []).filter((w) => w.volkId === volkId).map((w) => ({
      datum: w.datum, art: 'Umzug / Wanderung',
      text: `${S.standorte.find((s) => s.id === w.vonStandortId)?.name || w.vonName || '?'}`
        + ` -> ${S.standorte.find((s) => s.id === w.nachStandortId)?.name || w.nachName || '?'}`
        + (w.notiz ? ` · ${w.notiz}` : ''),
    })),
  ].sort((a, b) => (a.datum < b.datum ? 1 : -1));

  p.ueberschrift(`Chronologie (${ereignisse.length} Einträge)`);
  if (ereignisse.length) {
    p.tabelle([
      { titel: 'Datum', breite: 70, schluessel: 'datum' },
      { titel: 'Vorgang', breite: 150, schluessel: 'art' },
      { titel: 'Angaben', breite: 240, schluessel: 'text' },
    ], ereignisse.map((e) => ({ datum: dat(e.datum), art: e.art, text: e.text })));
  } else {
    p.text('Noch nichts erfasst.', { groesse: 9, grau: true });
  }

  return p;
}

export const dateiname = (s) => s.replace(/[^\wäöüÄÖÜß -]/g, '').replace(/\s+/g, '-').toLowerCase();
export const heuteKurz = () => iso(heute());
