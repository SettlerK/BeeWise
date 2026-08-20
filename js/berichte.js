// Berichte als PDF: Behandlungsprotokoll und Volkshistorie.
import { PDF } from './pdf.js';
import { fmtDatum, parseISO, iso, heute } from './util.js';
import { t } from './i18n.js';
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
    titel: t('Behandlungsprotokoll {jahr}', { jahr }),
    untertitel: [imkerei,
      t('{v} Völker an {s} Standorten', { v: S.voelker.length, s: S.standorte.length }),
      t('erstellt am {d}', { d: dat(heute()) })].filter(Boolean).join(' · '),
    fusszeile: 'BeeWise · ' + t('Behandlungsprotokoll {jahr}', { jahr }),
  });

  p.text(t('Dokumentiert werden alle durchgeführten Varroabehandlungen, biotechnischen '
    + 'Maßnahmen und Befallskontrollen. Angaben zu Präparat und Menge stammen aus den '
    + 'Eintragungen des Imkers.'), { groesse: 8.5, grau: true });

  // ---- Behandlungen
  const behandlungen = erl.filter((e) => BEHANDLUNGEN.includes(e.regelId));
  p.ueberschrift(t('Varroabehandlungen ({n})', { n: behandlungen.length }));
  if (behandlungen.length) {
    p.tabelle([
      { titel: t('Datum'), breite: 62, schluessel: 'datum' },
      { titel: t('Volk'), breite: 48, schluessel: 'volk' },
      { titel: t('Standort'), breite: 70, schluessel: 'standort' },
      { titel: t('Maßnahme'), breite: 92, schluessel: 'massnahme' },
      { titel: t('Präparat'), breite: 90, schluessel: 'mittel' },
      { titel: t('Menge'), breite: 46, schluessel: 'menge' },
      { titel: t('Bemerkung'), breite: 84, schluessel: 'notiz' },
    ], behandlungen.map((e) => ({
      datum: dat(e.datum),
      volk: volkName(S, e.zielId),
      standort: stand(S, e.zielId),
      massnahme: t((regelNach(e.regelId)?.titel || e.regelId).replace(' – Ameisensäure', '')),
      mittel: e.daten?.praeparat || '–',
      menge: e.daten?.menge ? `${e.daten.menge} ml` : '–',
      notiz: [e.daten?.anwendung, e.daten?.gassen ? `${e.daten.gassen} Gassen` : '', e.daten?.notiz]
        .filter(Boolean).join(', '),
    })));
  } else {
    p.text(t('Keine Einträge in diesem Jahr.'), { groesse: 9, grau: true });
  }

  // ---- Befallskontrollen
  const kontrollen = erl.filter((e) => KONTROLLEN.includes(e.regelId));
  p.ueberschrift(t('Befallskontrollen ({n})', { n: kontrollen.length }));
  if (kontrollen.length) {
    p.tabelle([
      { titel: t('Datum'), breite: 70, schluessel: 'datum' },
      { titel: t('Volk'), breite: 55, schluessel: 'volk' },
      { titel: t('Standort'), breite: 80, schluessel: 'standort' },
      { titel: t('Art'), breite: 105, schluessel: 'art' },
      { titel: t('Milben/Tag'), breite: 60, schluessel: 'wert' },
      { titel: t('Bemerkung'), breite: 90, schluessel: 'notiz' },
    ], kontrollen.map((e) => ({
      datum: dat(e.datum),
      volk: volkName(S, e.zielId),
      standort: stand(S, e.zielId),
      art: t(e.regelId === 'befallskontrolle' ? 'Gemülldiagnose' : 'Erfolgskontrolle'),
      wert: e.daten?.milbenProTag != null ? String(e.daten.milbenProTag) : '–',
      notiz: e.daten?.notiz || '',
    })));
  } else {
    p.text(t('Keine Einträge in diesem Jahr.'), { groesse: 9, grau: true });
  }

  // ---- Biotechnik
  const bio = erl.filter((e) => BIOTECHNIK.includes(e.regelId));
  if (bio.length) {
    p.ueberschrift(t('Biotechnische Maßnahmen ({n})', { n: bio.length }));
    p.tabelle([
      { titel: t('Datum'), breite: 70, schluessel: 'datum' },
      { titel: t('Volk'), breite: 60, schluessel: 'volk' },
      { titel: t('Standort'), breite: 85, schluessel: 'standort' },
      { titel: t('Maßnahme'), breite: 145, schluessel: 'massnahme' },
      { titel: t('Bemerkung'), breite: 100, schluessel: 'notiz' },
    ], bio.map((e) => ({
      datum: dat(e.datum),
      volk: volkName(S, e.zielId),
      standort: stand(S, e.zielId),
      massnahme: t(regelNach(e.regelId)?.titel || e.regelId),
      notiz: e.daten?.notiz || '',
    })));
  }

  p.abstand(14);
  p.text(t('Die Angaben beruhen auf den Eintragungen in BeeWise. Für Zulassung, Dosierung und '
    + 'Wartezeiten der eingesetzten Mittel gilt die jeweilige Packungsbeilage.'),
  { groesse: 7.5, grau: true });

  return p;
}

/** Vollständige Historie eines Volkes. */
export function volkHistorie(S, volkId) {
  const v = S.voelker.find((x) => x.id === volkId);
  if (!v) return null;
  const st = S.standorte.find((s) => s.id === v.standortId);

  const p = new PDF({
    titel: t('Stockkarte – Volk {name}', { name: v.name }),
    untertitel: [st?.name, v.beute, v.koeniginJahr ? t('Königin {jahr}', { jahr: v.koeniginJahr }) : '',
      v.gebildetAm ? t('gebildet am {d}', { d: dat(v.gebildetAm) }) : '',
      t('erstellt am {d}', { d: dat(heute()) })].filter(Boolean).join(' · '),
    fusszeile: `BeeWise · ${t('Volk {name}', { name: v.name })}`,
  });

  // ---- Stammdaten
  p.ueberschrift(t('Stammdaten'));
  const zeilen = [
    [t('Bezeichnung'), v.name],
    [t('Standort'), st?.name || '–'],
    [t('Beute / Rähmchenmaß'), v.beute || '–'],
    [t('Zargen'), v.zargen ? String(v.zargen) : '–'],
    [t('Königin Jahrgang'), v.koeniginJahr || '–'],
    [t('Herkunft'), v.herkunft || '–'],
    [t('Notiz'), v.notiz || '–'],
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
    p.ueberschrift(t('Saisonbilanz'));
    p.tabelle([
      { titel: t('Saison'), breite: 60, schluessel: 'jahr' },
      { titel: t('Ernte'), breite: 70, schluessel: 'ernte' },
      { titel: t('Behandlungen'), breite: 80, schluessel: 'beh' },
      { titel: t('Durchsichten'), breite: 80, schluessel: 'dur' },
      { titel: t('max. besetzte Wabengassen'), breite: 120, schluessel: 'gassen' },
    ], [...jahre.entries()].sort((a, b) => b[0] - a[0]).map(([j, b]) => ({
      jahr: String(j),
      ernte: b.ernte ? `${b.ernte.toFixed(1).replace('.', ',')} kg` : '–',
      beh: String(b.behandlungen || '–'),
      dur: String(b.durchsichten || '–'),
      gassen: b.gassen.length ? String(Math.max(...b.gassen)) : '–',
    })));
  }

  // ---- Königinnen
  const koeniginnen = (S.koeniginnen || []).filter((k) => k.volkId === volkId && !k.deletedAt)
    .sort((a, b) => ((a.seit || '') < (b.seit || '') ? 1 : -1));
  if (koeniginnen.length) {
    p.ueberschrift(t('Königinnen ({n})', { n: koeniginnen.length }));
    p.tabelle([
      { titel: t('Jahrgang'), breite: 50, schluessel: 'jahr' },
      { titel: t('Im Volk'), breite: 105, schluessel: 'zeit' },
      { titel: t('Herkunft'), breite: 90, schluessel: 'herkunft' },
      { titel: t('Rasse'), breite: 70, schluessel: 'rasse' },
      { titel: t('Züchter / Belegstelle'), breite: 95, schluessel: 'zuechter' },
      { titel: t('Ende'), breite: 80, schluessel: 'grund' },
    ], koeniginnen.map((k) => ({
      jahr: k.jahr,
      zeit: `${dat(k.seit)} – ${k.bis ? dat(k.bis) : t('heute')}`,
      herkunft: t(k.herkunft || ''),
      rasse: k.rasse || '',
      zuechter: k.zuechter || '',
      grund: k.bis ? t(k.grund || '') : '',
    })));
  }

  // ---- Chronologie
  const ereignisse = [
    ...S.durchsichten.filter((d) => d.volkId === volkId).map((d) => ({
      datum: d.datum, art: t('Durchsicht'),
      text: [
        d.wabengassen ? t('{n} besetzte Wabengassen', { n: d.wabengassen }) : '',
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
      art: t(regelNach(e.regelId)?.titel || e.regelId),
      text: Object.entries(e.daten || {}).filter(([k]) => k !== 'notiz')
        .map(([k, w]) => `${k}: ${w}`).concat(e.daten?.notiz ? [e.daten.notiz] : [])
        .join(' · ') + (e.status === 'uebersprungen' ? '  (übersprungen)' : ''),
    })),
    ...koeniginnen.map((k) => ({
      datum: k.seit, art: t('Königin eingesetzt'),
      text: [k.jahr, t(k.herkunft || ''), k.rasse, k.zuechter, k.notiz].filter(Boolean).join(' · '),
    })),
    ...(S.wanderungen || []).filter((w) => w.volkId === volkId).map((w) => ({
      datum: w.datum, art: t('Umzug / Wanderung'),
      text: `${S.standorte.find((s) => s.id === w.vonStandortId)?.name || w.vonName || '?'}`
        + ` -> ${S.standorte.find((s) => s.id === w.nachStandortId)?.name || w.nachName || '?'}`
        + (w.notiz ? ` · ${w.notiz}` : ''),
    })),
  ].sort((a, b) => (a.datum < b.datum ? 1 : -1));

  p.ueberschrift(t('Chronologie ({n} Einträge)', { n: ereignisse.length }));
  if (ereignisse.length) {
    p.tabelle([
      { titel: t('Datum'), breite: 70, schluessel: 'datum' },
      { titel: t('Vorgang'), breite: 150, schluessel: 'art' },
      { titel: t('Angaben'), breite: 240, schluessel: 'text' },
    ], ereignisse.map((e) => ({ datum: dat(e.datum), art: e.art, text: e.text })));
  } else {
    p.text(t('Noch nichts erfasst.'), { groesse: 9, grau: true });
  }

  return p;
}

/**
 * Jahresübersicht des Kassenbuchs.
 * Ein Blatt, das man dem Steuerberater oder sich selbst im Januar hinlegen kann:
 * oben die Summen, darunter jede Buchung einzeln. Bewusst keine Auswertung nach
 * Konten – das ist nicht die Aufgabe einer Imkerei-App.
 */
export function kassenbuchPDF(S, b, { imkerei = '' } = {}) {
  const zwei = (x) => `${(Math.round((Number(x) || 0) * 100) / 100).toFixed(2)
    .replace('.', ',')}`;
  const eins = (x) => `${(Math.round((Number(x) || 0) * 10) / 10).toFixed(1).replace('.', ',')}`;
  const mhdKurz = (m) => (m && String(m).includes('-')
    ? `${String(m).slice(5, 7)}/${String(m).slice(0, 4)}` : (m || ''));

  const p = new PDF({
    titel: t('Honigbilanz und Kassenbuch {jahr}', { jahr: b.jahr }),
    untertitel: [imkerei, t('erstellt am {d}', { d: dat(heute()) })].filter(Boolean).join(' · '),
    fusszeile: 'BeeWise · ' + t('Kassenbuch {jahr}', { jahr: b.jahr }),
  });

  p.ueberschrift(t('Das Jahr in Zahlen'));
  p.tabelle([
    { titel: t('Kennzahl'), breite: 200, schluessel: 'was' },
    { titel: t('Wert'), breite: 100, schluessel: 'wert' },
  ], [
    { was: t('geerntet'), wert: `${eins(b.ernte.gesamt)} kg` },
    { was: t('abgefüllt'), wert: `${b.abgefuellteGlaeser} ${t('Gläser')} · ${eins(b.abgefuelltKg)} kg` },
    { was: t('verkauft'), wert: `${b.verkaufteGlaeser} ${t('Gläser')} · ${eins(b.verkauftKg)} kg` },
    { was: t('Einnahmen'), wert: `${zwei(b.einnahmen)} EUR` },
    { was: t('Ausgaben'), wert: `${zwei(b.kosten)} EUR` },
    { was: t('Überschuss'), wert: `${zwei(b.saldo)} EUR` },
    ...(b.proKg != null ? [{ was: t('Erlös je Kilo'), wert: `${zwei(b.proKg)} EUR` }] : []),
    { was: t('im Lager'), wert: `${b.lager.glaeser} ${t('Gläser')} · ${eins(b.lager.kg)} kg` },
  ]);

  if (b.ernte.jeVolk.length) {
    p.ueberschrift(t('Ernte je Volk'));
    p.tabelle([
      { titel: t('Volk'), breite: 120, schluessel: 'volk' },
      { titel: t('Menge'), breite: 80, schluessel: 'kg' },
    ], b.ernte.jeVolk.map((v) => ({ volk: v.name, kg: `${eins(v.kg)} kg` })));
  }

  if (b.abfuellungen.length) {
    p.ueberschrift(t('Abfüllungen ({n})', { n: b.abfuellungen.length }));
    p.tabelle([
      { titel: t('Datum'), breite: 62, schluessel: 'datum' },
      { titel: t('Sorte'), breite: 80, schluessel: 'sorte' },
      { titel: t('Glas'), breite: 44, schluessel: 'glas' },
      { titel: t('Stück'), breite: 40, schluessel: 'anzahl' },
      { titel: t('Menge'), breite: 50, schluessel: 'kg' },
      { titel: t('Los'), breite: 70, schluessel: 'los' },
      { titel: t('MHD'), breite: 50, schluessel: 'mhd' },
    ], b.abfuellungen.map((a) => ({
      datum: dat(a.datum), sorte: t(a.sorte || ''), glas: `${a.glasgroesse} g`,
      anzahl: String(a.anzahl), kg: `${eins((a.anzahl * a.glasgroesse) / 1000)} kg`,
      los: a.losnummer || '', mhd: mhdKurz(a.mhd),
    })));
  }

  if (b.verkaeufe.length) {
    p.ueberschrift(t('Verkäufe ({n})', { n: b.verkaeufe.length }));
    p.tabelle([
      { titel: t('Datum'), breite: 62, schluessel: 'datum' },
      { titel: t('Sorte'), breite: 76, schluessel: 'sorte' },
      { titel: t('Glas'), breite: 40, schluessel: 'glas' },
      { titel: t('Stück'), breite: 36, schluessel: 'anzahl' },
      { titel: t('Art'), breite: 60, schluessel: 'art' },
      { titel: t('Kunde'), breite: 80, schluessel: 'kunde' },
      { titel: t('Betrag'), breite: 50, schluessel: 'betrag' },
    ], b.verkaeufe.map((v) => ({
      datum: dat(v.datum), sorte: t(v.sorte || ''), glas: `${v.glasgroesse} g`,
      anzahl: String(v.anzahl), art: t(v.art || ''), kunde: v.kunde || '',
      betrag: `${zwei(v.betrag)} EUR`,
    })));
  }

  if (b.ausgaben.length) {
    p.ueberschrift(t('Ausgaben ({n})', { n: b.ausgaben.length }));
    p.tabelle([
      { titel: t('Datum'), breite: 62, schluessel: 'datum' },
      { titel: t('Wofür'), breite: 110, schluessel: 'art' },
      { titel: t('Bezeichnung'), breite: 160, schluessel: 'was' },
      { titel: t('Betrag'), breite: 56, schluessel: 'betrag' },
    ], b.ausgaben.map((a) => ({
      datum: dat(a.datum), art: t(a.art || ''), was: a.was || a.notiz || '',
      betrag: `${zwei(a.betrag)} EUR`,
    })));
    if (b.ausgabenJeArt.length > 1) {
      p.ueberschrift(t('Ausgaben nach Art'));
      p.tabelle([
        { titel: t('Wofür'), breite: 160, schluessel: 'art' },
        { titel: t('Betrag'), breite: 60, schluessel: 'betrag' },
      ], b.ausgabenJeArt.map((a) => ({ art: t(a.art), betrag: `${zwei(a.betrag)} EUR` })));
    }
  }

  p.abstand(6);
  p.text(t('Diese Übersicht ist keine Buchhaltung und keine Steuererklärung: sie enthält '
    + 'keine Umsatzsteuer, keine Abschreibungen und keine Bewertung des Lagerbestands. '
    + 'Sie sammelt die Zahlen so, wie sie beim Imkern anfallen.'), { groesse: 8, grau: true });

  return p;
}

export const dateiname = (s) => s.replace(/[^\wäöüÄÖÜß -]/g, '').replace(/\s+/g, '-').toLowerCase();
export const heuteKurz = () => iso(heute());
