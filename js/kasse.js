// Honigbilanz und Kassenbuch.
// =============================================================================
// Der Weg des Honigs hat vier Stationen: geerntet → abgefüllt → verkauft →
// was übrig ist, liegt im Lager. Drei davon erfasst die App schon oder kann sie
// erfassen, die vierte ist reine Rechnung. Genau so ist dieses Modul gebaut:
//
//   Ernte      kommt aus den Erledigungen der Ernteregeln (kg je Volk).
//   Abfüllen   ist ein eigener Datensatz je Charge – mit Los-Nummer und MHD,
//              denn beides gehört zur Charge und nicht zum Glas.
//   Verkauf    bucht Gläser ab und Geld zu.
//   Lager      = abgefüllt minus verkauft, je Sorte und Glasgröße.
//
// Zwei Rechenregeln, die man leicht falsch macht:
//   1. Der **Lagerbestand ist nicht jahresbezogen.** Honig aus dem Vorjahr steht
//      im Januar noch im Regal. Bestände werden deshalb über alle Jahre gerechnet,
//      Erlöse und Ausgaben jahresweise.
//   2. **Kilo und Gläser sind nicht dasselbe.** Ein 500-g-Glas enthält 500 g Honig;
//      gerechnet wird immer über die Füllmenge, nie über das Bruttogewicht.
//
// Bewusst keine Buchhaltung: kein Konto, keine Umsatzsteuer, keine Abschreibung.
// Das Ziel ist, am Jahresende belastbare Zahlen zu haben – was daraus steuerlich
// folgt, entscheidet niemand in dieser App.

import { parseISO, iso, heute } from './util.js';

/** Übliche Gläser. Freie Eingabe bleibt möglich. */
export const GLASGROESSEN = ['250', '500', '1000'];

/** Sorten für Abfüllung und Verkauf – die beiden Ernten plus die üblichen Namen. */
export const HONIGSORTEN = ['Frühtracht', 'Sommertracht', 'Blütenhonig', 'Rapshonig',
  'Lindenhonig', 'Waldhonig', 'Mischung'];

/** Woher die Ernte kommt: Regel → Sorte. */
export const ERNTE_SORTE = { fruehtracht: 'Frühtracht', sommertracht: 'Sommertracht' };

export const VERKAUF_ARTEN = ['Haustür', 'Markt', 'Wiederverkauf', 'Verschenkt', 'Eigenbedarf'];

/**
 * Ausgabenarten. Absichtlich imkerlich benannt und nicht nach Steuerrecht:
 * beim Erfassen weiß man, dass man Zucker gekauft hat, nicht welche Kontenklasse
 * das ist. Zuordnen kann man später immer noch.
 */
export const AUSGABE_ARTEN = ['Zucker und Futter', 'Behandlungsmittel', 'Gläser und Deckel',
  'Mittelwände und Wachs', 'Rähmchen und Beuten', 'Geräte', 'Gebühren und Beiträge',
  'Fahrtkosten', 'Sonstiges'];

const zahl = (x) => (x == null || x === '' ? 0 : Number(x) || 0);
const lebt = (r) => r && !r.deletedAt;
const imJahr = (r, jahr) => parseISO(r.datum).getFullYear() === jahr;

/** Füllmenge einer Buchung in kg. */
export const kgVon = (r) => (zahl(r.anzahl) * zahl(r.glasgroesse)) / 1000;

/** Schlüssel eines Lagerpostens: Sorte und Glasgröße zusammen. */
const postenKey = (r) => `${r.sorte || '–'}|${r.glasgroesse}`;

// ------------------------------------------------------------------- Ernte

/**
 * Ernte eines Jahres aus den Erledigungen: je Volk, je Stand, je Sorte.
 * Die Erledigungen sind die Wahrheit – dieselbe Quelle, aus der auch die
 * Terminierung rechnet. Nichts wird doppelt erfasst.
 */
export function ernteJahr(S, jahr) {
  const jeVolk = new Map();
  const jeStand = new Map();
  const jeSorte = new Map();
  let gesamt = 0;

  for (const e of S.erledigungen) {
    if (!lebt(e) || e.status === 'uebersprungen') continue;
    const sorte = ERNTE_SORTE[e.regelId];
    if (!sorte || !imJahr(e, jahr)) continue;
    const kg = zahl(e.daten?.kg);
    if (!kg) continue;
    gesamt += kg;
    jeSorte.set(sorte, (jeSorte.get(sorte) || 0) + kg);

    const volk = S.voelker.find((v) => v.id === e.zielId);
    const volkName = volk?.name || '?';
    jeVolk.set(e.zielId, { name: volkName, standortId: volk?.standortId || null,
      kg: (jeVolk.get(e.zielId)?.kg || 0) + kg });

    const standId = volk?.standortId || 'ohne';
    const standName = S.standorte.find((s) => s.id === standId)?.name || 'ohne Standort';
    jeStand.set(standId, { name: standName, kg: (jeStand.get(standId)?.kg || 0) + kg,
      voelker: (jeStand.get(standId)?.voelker || new Set()).add(e.zielId) });
  }

  const nachKg = (a, b) => b.kg - a.kg;
  return {
    gesamt: runde(gesamt),
    jeVolk: [...jeVolk.values()].map(rundeKg).sort(nachKg),
    jeStand: [...jeStand.values()].map((s) => ({ ...s, anzahl: s.voelker.size, kg: runde(s.kg) }))
      .sort(nachKg),
    jeSorte: [...jeSorte.entries()].map(([sorte, kg]) => ({ sorte, kg: runde(kg) })).sort(nachKg),
  };
}

/**
 * Ernten eines Jahres nach Tagen: mehrfaches Schleudern ist der Normalfall
 * (Raps, dann Robinie; Juni-Tracht, dann späte Linde). Die Termine getrennt zu
 * zeigen ist der einzige Weg, versehentliches Überschreiben sichtbar zu machen.
 */
export function ernteTermine(S, jahr) {
  const je = new Map();
  for (const e of S.erledigungen) {
    if (!lebt(e) || e.status === 'uebersprungen') continue;
    const sorte = ERNTE_SORTE[e.regelId];
    if (!sorte || !imJahr(e, jahr)) continue;
    const kg = zahl(e.daten?.kg);
    if (!kg) continue;
    const k = `${e.datum}|${e.regelId}`;
    const t = je.get(k) || { datum: e.datum, regelId: e.regelId, sorte, kg: 0, voelker: 0 };
    t.kg += kg;
    t.voelker += 1;
    je.set(k, t);
  }
  return [...je.values()].map((t) => ({ ...t, kg: runde(t.kg) }))
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));
}

const runde = (x) => Math.round(x * 10) / 10;
const rundeKg = (o) => ({ ...o, kg: runde(o.kg) });
const cent = (x) => Math.round(x * 100) / 100;

// ------------------------------------------------------------------- Lager

/**
 * Lagerbestand über alle Jahre: abgefüllt minus verkauft, je Sorte und Glasgröße.
 * Negative Bestände werden nicht versteckt – sie zeigen, dass eine Abfüllung
 * fehlt, und das ist eine nützliche Information, kein Anzeigefehler.
 */
export function lagerbestand(S) {
  const posten = new Map();
  const nehmen = (r) => {
    const k = postenKey(r);
    if (!posten.has(k)) {
      posten.set(k, { sorte: r.sorte || '–', glasgroesse: zahl(r.glasgroesse),
        abgefuellt: 0, verkauft: 0 });
    }
    return posten.get(k);
  };
  for (const a of S.abfuellungen || []) {
    if (lebt(a)) nehmen(a).abgefuellt += zahl(a.anzahl);
  }
  for (const v of S.verkaeufe || []) {
    if (lebt(v)) nehmen(v).verkauft += zahl(v.anzahl);
  }

  const zeilen = [...posten.values()]
    .map((p) => ({ ...p, bestand: p.abgefuellt - p.verkauft,
      kg: runde(((p.abgefuellt - p.verkauft) * p.glasgroesse) / 1000) }))
    .filter((p) => p.abgefuellt || p.verkauft)
    .sort((a, b) => (a.sorte === b.sorte ? a.glasgroesse - b.glasgroesse
      : a.sorte.localeCompare(b.sorte, 'de')));

  return {
    zeilen,
    glaeser: zeilen.reduce((s, p) => s + p.bestand, 0),
    kg: runde(zeilen.reduce((s, p) => s + (p.bestand * p.glasgroesse) / 1000, 0)),
  };
}

/**
 * Chargen, deren Mindesthaltbarkeit näher rückt – und von denen noch etwas da
 * sein dürfte. Zugeordnet wird nach dem Grundsatz „wer zuerst abgefüllt wurde,
 * geht zuerst weg" (FIFO); eine glasgenaue Verfolgung wäre Scheingenauigkeit,
 * weil beim Verkauf niemand die Charge notiert.
 */
export function mhdBald(S, { monate = 6, jetzt = heute() } = {}) {
  const grenze = new Date(jetzt.getFullYear(), jetzt.getMonth() + monate, 1);
  const jeSorte = new Map();
  for (const v of S.verkaeufe || []) {
    if (!lebt(v)) continue;
    const k = postenKey(v);
    jeSorte.set(k, (jeSorte.get(k) || 0) + zahl(v.anzahl));
  }

  const raus = [];
  const chargen = (S.abfuellungen || []).filter((a) => lebt(a) && a.mhd)
    .sort((a, b) => (a.datum < b.datum ? -1 : 1));
  for (const a of chargen) {
    const k = postenKey(a);
    const offen = jeSorte.get(k) || 0;
    const rest = Math.max(0, zahl(a.anzahl) - offen);      // FIFO: Verkäufe zuerst abziehen
    jeSorte.set(k, Math.max(0, offen - zahl(a.anzahl)));
    if (!rest) continue;
    const [j, m] = String(a.mhd).split('-').map(Number);
    if (!j) continue;
    const faellig = new Date(j, (m || 12) - 1, 1);
    if (faellig <= grenze) raus.push({ ...a, rest, faellig });
  }
  return raus.sort((a, b) => a.faellig - b.faellig);
}

// ------------------------------------------------------------------ Bilanz

/** Alles, was die Kassenbuch-Ansicht für ein Jahr braucht. */
export function kassenBilanz(S, jahr = heute().getFullYear()) {
  const ernte = ernteJahr(S, jahr);

  const abfuellungen = (S.abfuellungen || []).filter((a) => lebt(a) && imJahr(a, jahr))
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));
  const verkaeufe = (S.verkaeufe || []).filter((v) => lebt(v) && imJahr(v, jahr))
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));
  const ausgaben = (S.ausgaben || []).filter((a) => lebt(a) && imJahr(a, jahr))
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));

  const einnahmen = cent(verkaeufe.reduce((s, v) => s + zahl(v.betrag), 0));
  const kosten = cent(ausgaben.reduce((s, a) => s + zahl(a.betrag), 0));

  const ausgabenJeArt = [...ausgaben.reduce((m, a) => {
    const k = a.art || 'Sonstiges';
    return m.set(k, cent((m.get(k) || 0) + zahl(a.betrag)));
  }, new Map())].map(([art, betrag]) => ({ art, betrag })).sort((a, b) => b.betrag - a.betrag);

  const verkaufteGlaeser = verkaeufe.reduce((s, v) => s + zahl(v.anzahl), 0);
  const abgefuellteGlaeser = abfuellungen.reduce((s, a) => s + zahl(a.anzahl), 0);
  const abgefuelltKg = runde(abfuellungen.reduce((s, a) => s + kgVon(a), 0));
  const verkauftKg = runde(verkaeufe.reduce((s, v) => s + kgVon(v), 0));

  // Erlös je Kilo: die Zahl, die man beim Preisgespräch am Stand braucht.
  const proKg = verkauftKg ? cent(einnahmen / verkauftKg) : null;

  return {
    jahr,
    ernte,
    abfuellungen,
    verkaeufe,
    ausgaben,
    ausgabenJeArt,
    einnahmen,
    kosten,
    saldo: cent(einnahmen - kosten),
    abgefuellteGlaeser,
    abgefuelltKg,
    verkaufteGlaeser,
    verkauftKg,
    proKg,
    lager: lagerbestand(S),
    // Wie viel der Ernte ist noch nicht abgefüllt? Zeigt vergessene Buchungen.
    nichtAbgefuellt: runde(ernte.gesamt - abgefuelltKg),
  };
}

/** Jahre, in denen überhaupt etwas passiert ist – für den Jahreswähler. */
export function kassenJahre(S) {
  const jahre = new Set([heute().getFullYear()]);
  const sammeln = (liste) => (liste || []).filter(lebt)
    .forEach((r) => jahre.add(parseISO(r.datum).getFullYear()));
  sammeln(S.abfuellungen); sammeln(S.verkaeufe); sammeln(S.ausgaben);
  for (const e of S.erledigungen) {
    if (lebt(e) && ERNTE_SORTE[e.regelId] && e.daten?.kg) jahre.add(parseISO(e.datum).getFullYear());
  }
  return [...jahre].sort((a, b) => b - a);
}

// -------------------------------------------------------- Los-Nummer und MHD

/**
 * Vorschlag für die Los-Nummer: Datum plus laufende Nummer des Tages.
 * Der Sinn einer Los-Nummer ist die Rückverfolgbarkeit – man muss von einem
 * Glas auf den Abfülltag und damit auf die Eimer kommen. Deshalb steht das
 * Datum drin und nicht ein Zufallsschlüssel.
 */
export function losVorschlag(S, datum = iso(heute())) {
  const d = String(datum).slice(2, 10).replace(/-/g, '');      // JJMMTT
  const amTag = (S.abfuellungen || []).filter((a) => lebt(a) && a.datum === datum).length;
  return `L${d}-${amTag + 1}`;
}

/**
 * Mindesthaltbarkeit: zwei Jahre ab Abfüllung, angegeben als Monat und Jahr.
 * Honig verdirbt bei richtiger Lagerung nicht, aber ein Datum ist Pflicht; zwei
 * Jahre sind das übliche Maß. Gespeichert wird JJJJ-MM, damit sich sortieren lässt.
 */
export function mhdVorschlag(datum = iso(heute()), jahre = 2) {
  const d = parseISO(datum);
  const j = d.getFullYear() + jahre;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${j}-${m}`;
}

/** JJJJ-MM → „08/2028“. */
export const mhdText = (mhd) => (mhd && String(mhd).includes('-')
  ? `${String(mhd).slice(5, 7)}/${String(mhd).slice(0, 4)}` : (mhd || ''));

// ------------------------------------------------------------------- Export

/** Buchungen eines Jahres als CSV (Semikolon, damit Excel sie ohne Rückfrage öffnet). */
export function kassenCSV(b) {
  const zeilen = [['Art', 'Datum', 'Bezeichnung', 'Sorte', 'Glas g', 'Stueck', 'kg',
    'Betrag EUR', 'Los', 'MHD', 'Notiz']];
  const zwei = (x) => (x == null || x === '' ? '' : Number(x).toFixed(2).replace('.', ','));
  const eins = (x) => (x == null || x === '' ? '' : Number(x).toFixed(1).replace('.', ','));

  for (const v of b.ernte.jeVolk) {
    zeilen.push(['Ernte', String(b.jahr), v.name, '', '', '', eins(v.kg), '', '', '', '']);
  }
  for (const a of b.abfuellungen) {
    zeilen.push(['Abfuellung', a.datum, '', a.sorte || '', a.glasgroesse || '', a.anzahl || '',
      eins(kgVon(a)), '', a.losnummer || '', mhdText(a.mhd), a.notiz || '']);
  }
  for (const v of b.verkaeufe) {
    zeilen.push(['Verkauf', v.datum, [v.art, v.kunde].filter(Boolean).join(' – '), v.sorte || '',
      v.glasgroesse || '', v.anzahl || '', eins(kgVon(v)), zwei(v.betrag), '', '', v.notiz || '']);
  }
  for (const a of b.ausgaben) {
    zeilen.push(['Ausgabe', a.datum, [a.art, a.was].filter(Boolean).join(' – '), '', '', '', '',
      zwei(-a.betrag), '', '', a.notiz || '']);
  }
  zeilen.push([]);
  zeilen.push(['Summe Einnahmen', '', '', '', '', '', '', zwei(b.einnahmen), '', '', '']);
  zeilen.push(['Summe Ausgaben', '', '', '', '', '', '', zwei(-b.kosten), '', '', '']);
  zeilen.push(['Saldo', '', '', '', '', '', '', zwei(b.saldo), '', '', '']);

  return zeilen.map((z) => z.map((feld) => {
    const s = String(feld ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(';')).join('\r\n');
}
