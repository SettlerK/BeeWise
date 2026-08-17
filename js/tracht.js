// Trachtmodul
// =============================================================================
// Frage: Woher weiß die App, was gerade blüht?
//
// Drei Ebenen, in dieser Rangfolge:
//   1. BESTÄTIGUNG DURCH DEN IMKER  – schlägt alles andere. Der Mensch am Stand
//      sieht mehr als jedes Modell.
//   2. WÄRMESUMMEN-MODELL aus echten Temperaturdaten des Standortes
//      (Open-Meteo, kostenlos, ohne Schlüssel, CORS-fähig).
//      Selbstkalibrierend: Für jeden Standort wird aus 10 Jahren Wetterarchiv die
//      örtliche Klimatologie berechnet. Die Wärmesumme, die dort im langjährigen
//      Mittel bis zum typischen Blühbeginn einer Art zusammenkommt, ist die
//      Schwelle dieser Art AN DIESEM ORT. Dadurch stimmen Höhenlage, Nord-Süd-
//      Gefälle und Stadtwärme automatisch – ohne Tabellenpflege.
//   3. KALENDERMITTEL als Notnagel, wenn kein Netz verfügbar ist.
//
// Erweiterbar: `TrachtQuelle` ist eine Schnittstelle. Ein späterer Server-Proxy
// auf die DWD-Sofortmelder (opendata.dwd.de, tagesaktuelle echte Blühmeldungen
// für Salweide, Löwenzahn, Robinie, Linde, Raps) kann sich hier einhängen und
// Ebene 2 ersetzen. Direkt aus dem Browser geht das nicht – der DWD-Server
// schickt keine CORS-Header.

import { iso, parseISO, doy, vonDoy, addDays, heute, diffTage } from './util.js';
import { metaLies, metaSchreibe } from './db.js';
import { t } from './i18n.js';

const GDD_BASIS = 5;            // °C – übliche Basis für phänologische Wärmesummen
const KLIMA_JAHRE = 10;
const CACHE_STUNDEN = 6;

/** Trachtpflanzen. `doyMittel` = typischer Blühbeginn im deutschen Tiefland. */
export const ARTEN = [
  { id: 'hasel', name: 'Hasel', doyMittel: 41, dauer: 30, art: 'pollen', keinModell: true, hinweis: 'erster Pollen – Blüte steuert die Tageslänge, nicht die Wärme' },
  { id: 'erle', name: 'Erle', doyMittel: 46, dauer: 28, art: 'pollen', keinModell: true },
  { id: 'salweide', name: 'Salweide', doyMittel: 84, dauer: 20, art: 'beides', hinweis: 'Startschuss für die Entwicklung' },
  { id: 'obstbluete', name: 'Obstblüte', doyMittel: 108, dauer: 21, art: 'beides' },
  { id: 'loewenzahn', name: 'Löwenzahn', doyMittel: 110, dauer: 30, art: 'beides', hinweis: 'Signal zum Erweitern' },
  { id: 'raps', name: 'Raps', doyMittel: 118, dauer: 28, art: 'nektar', hinweis: 'Frühtracht – zügig ernten' },
  { id: 'robinie', name: 'Robinie', doyMittel: 145, dauer: 16, art: 'nektar' },
  { id: 'linde', name: 'Linde', doyMittel: 173, dauer: 20, art: 'nektar', hinweis: 'Ende = letzte Ernte' },
  { id: 'phacelia', name: 'Phacelia / Senf', doyMittel: 201, dauer: 35, art: 'beides', unsicher: true, hinweis: 'nur wo ausgesät wurde' },
  { id: 'heide', name: 'Heide', doyMittel: 217, dauer: 35, art: 'nektar', unsicher: true },
  { id: 'springkraut', name: 'Springkraut', doyMittel: 222, dauer: 40, art: 'beides', unsicher: true },
  { id: 'waldtracht', name: 'Waldtracht / Honigtau', doyMittel: 165, dauer: 45, art: 'nektar', unsicher: true, keinModell: true, hinweis: 'Läusehonig – nicht vorhersagbar, nie fest einplanen' },
];

export const artNach = (id) => ARTEN.find((a) => a.id === id);

// ----------------------------------------------------------------- Datenabruf

async function holeJSON(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

const key = (s, p) => `wetter:${p}:${(+s.lat).toFixed(2)},${(+s.lon).toFixed(2)}`;
// Die Klimatologie bekommt die Jahreszahl in den Schlüssel: im Januar rechnet die
// App sie automatisch mit dem dann aktuellen 10-Jahres-Fenster neu. So veraltet
// die Datengrundlage nicht, ohne dass jemand daran denken muss.
const klimaKey = (s) => key(s, 'klima') + ':' + new Date().getFullYear();

async function ausCache(k, maxStunden) {
  const c = await metaLies(k, null);
  if (!c) return null;
  if (maxStunden && (Date.now() - new Date(c.geholt).getTime()) > maxStunden * 3600e3) return null;
  return c.daten;
}

/** Langjährige Klimatologie: mittlere Wärmesummen-Kurve über das Jahr. */
async function klimatologie(standort) {
  const k = klimaKey(standort);
  const cached = await ausCache(k, null);
  if (cached) return cached;

  const jetzt = new Date();
  const bis = new Date(jetzt.getFullYear() - 1, 11, 31);
  const von = new Date(jetzt.getFullYear() - KLIMA_JAHRE, 0, 1);
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${standort.lat}`
    + `&longitude=${standort.lon}&start_date=${iso(von)}&end_date=${iso(bis)}`
    + `&daily=temperature_2m_mean&timezone=Europe%2FBerlin`;
  const j = await holeJSON(url);

  // mittlerer Tageszuwachs der Wärmesumme je Tag im Jahr
  const summe = new Array(367).fill(0);
  const zaehler = new Array(367).fill(0);
  j.daily.time.forEach((t, i) => {
    const temp = j.daily.temperature_2m_mean[i];
    if (temp == null) return;
    const dd = doy(parseISO(t));
    summe[dd] += Math.max(0, temp - GDD_BASIS);
    zaehler[dd] += 1;
  });
  const zuwachs = summe.map((s, i) => (zaehler[i] ? s / zaehler[i] : 0));
  const kumuliert = [];
  let acc = 0;
  for (let i = 0; i <= 366; i++) { acc += zuwachs[i]; kumuliert[i] = acc; }

  const daten = { zuwachs, kumuliert };
  await metaSchreibe(k, { geholt: new Date().toISOString(), daten });
  return daten;
}

/** Laufendes Jahr: gemessen bis heute plus 16 Tage Vorhersage. */
async function jahresWetter(standort) {
  const k = key(standort, 'jahr');
  const cached = await ausCache(k, CACHE_STUNDEN);
  if (cached) return cached;

  const jetzt = new Date();
  const jahresstart = iso(new Date(jetzt.getFullYear(), 0, 1));
  const archivBis = iso(addDays(jetzt, -7));
  const felder = 'temperature_2m_mean,temperature_2m_max,temperature_2m_min';

  const reihen = new Map(); // 'YYYY-MM-DD' -> {mean,max,min}
  const uebernehmen = (j) => {
    (j.daily?.time || []).forEach((t, i) => {
      const m = j.daily.temperature_2m_mean?.[i];
      if (m == null) return;
      reihen.set(t, {
        mean: m,
        max: j.daily.temperature_2m_max?.[i],
        min: j.daily.temperature_2m_min?.[i],
      });
    });
  };

  if (diffTage(parseISO(archivBis), parseISO(jahresstart)) > 0) {
    uebernehmen(await holeJSON(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${standort.lat}`
      + `&longitude=${standort.lon}&start_date=${jahresstart}&end_date=${archivBis}`
      + `&daily=${felder}&timezone=Europe%2FBerlin`));
  }
  uebernehmen(await holeJSON(
    `https://api.open-meteo.com/v1/forecast?latitude=${standort.lat}`
    + `&longitude=${standort.lon}&daily=${felder}&past_days=92&forecast_days=16`
    + `&timezone=Europe%2FBerlin`));

  const tage = [...reihen.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1)
    .map(([datum, w]) => ({ datum, ...w }));
  const daten = { tage };
  await metaSchreibe(k, { geholt: new Date().toISOString(), daten });
  return daten;
}

// ------------------------------------------------------------------- Rechnung

function kumulierteWaermesumme(tage, jahr) {
  const kum = new Array(367).fill(null);
  let acc = 0; let letzterTag = 0;
  for (const t of tage) {
    const d = parseISO(t.datum);
    if (d.getFullYear() !== jahr) continue;
    acc += Math.max(0, t.mean - GDD_BASIS);
    kum[doy(d)] = acc;
    letzterTag = Math.max(letzterTag, doy(d));
  }
  return { kum, letzterTag };
}

/**
 * Blühzeiten für einen Standort im laufenden Jahr.
 * @returns [{art, name, start, ende, status, quelle, prognose, verschiebung}]
 */
export async function trachtFuerStandort(standort, beobachtungen = [], datum = heute()) {
  const jahr = datum.getFullYear();
  let klima = null; let jahrW = null; let netzFehler = null;

  if (standort?.lat != null && standort?.lon != null && navigator.onLine !== false) {
    try {
      [klima, jahrW] = await Promise.all([klimatologie(standort), jahresWetter(standort)]);
    } catch (e) { netzFehler = e.message; }
  }

  let kum = null; let letzterTag = 0; let verschiebung = null;
  if (klima && jahrW) {
    ({ kum, letzterTag } = kumulierteWaermesumme(jahrW.tage, jahr));
    // Über den bekannten Zeitraum hinaus mit der örtlichen Klimatologie fortschreiben
    for (let i = letzterTag + 1; i <= 366; i++) {
      kum[i] = (kum[i - 1] ?? 0) + klima.zuwachs[i];
    }
    for (let i = 1; i <= 366; i++) if (kum[i] == null) kum[i] = kum[i - 1] ?? 0;

  }

  const ergebnis = [];
  for (const a of ARTEN) {
    const b = beobachtungen.filter((o) => o.art === a.id && o.jahr === jahr);
    const bStart = b.find((o) => o.status === 'start');
    const bEnde = b.find((o) => o.status === 'ende');
    const nochNicht = b.filter((o) => o.status === 'nochNicht')
      .sort((x, y) => x.datum < y.datum ? 1 : -1)[0];

    let start = null; let quelle = 'kalender'; let prognose = true; let kalibriertAus = 0;

    if (bStart) {
      start = parseISO(bStart.datum); quelle = 'imker'; prognose = false;
    } else if (kum && !a.keinModell && klima.kumuliert[a.doyMittel] >= 5) {
      // Wärmesummen-Modell nur dort, wo bis zum Blühbeginn überhaupt Wärme
      // zusammenkommt. Hasel und Erle sind ausgenommen (keinModell): ihre Blüte
      // steuert die Tageslänge, nicht die Temperatur.
      // Wenn der Imker in früheren Jahren den Blühbeginn bestätigt hat, ist die
      // damals erreichte Wärmesumme die bessere Schwelle als das Kalendermittel.
      // Die App lernt also mit jedem Jahr dazu, statt ungenauer zu werden.
      const kalibrierung = beobachtungen.filter((o) => o.art === a.id
        && o.status === 'start' && typeof o.gdd === 'number' && o.jahr !== jahr);
      const schwelle = kalibrierung.length
        ? kalibrierung.reduce((s, o) => s + o.gdd, 0) / kalibrierung.length
        : klima.kumuliert[a.doyMittel];
      let tag = null;
      for (let i = 1; i <= 366; i++) { if (kum[i] >= schwelle) { tag = i; break; } }
      if (tag) {
        start = vonDoy(jahr, tag);
        quelle = kalibrierung.length ? 'modell-kalibriert' : 'modell';
        kalibriertAus = kalibrierung.length;
        prognose = tag > letzterTag;
      }
    } else {
      start = vonDoy(jahr, a.doyMittel);
      quelle = a.id === 'waldtracht' ? 'erfahrung' : 'kalender';
    }

    // "Blüht noch nicht" vom Imker schiebt das Modell nach hinten
    if (start && nochNicht && !bStart && parseISO(nochNicht.datum) >= start) {
      start = addDays(parseISO(nochNicht.datum), 3);
      quelle = quelle + '+imker';
      prognose = true;
    }

    const ende = bEnde ? parseISO(bEnde.datum) : (start ? addDays(start, a.dauer) : null);

    let status = 'spaeter';
    if (start && ende) {
      if (datum > ende) status = 'vorbei';
      else if (datum >= start) status = 'blueht';
      else if (diffTage(start, datum) <= 21) status = 'bevorstehend';
    }

    ergebnis.push({
      art: a.id, name: a.name, hinweis: a.hinweis, unsicher: !!a.unsicher, typ: a.art,
      start, ende, status, quelle, prognose, kalibriertAus,
      bestaetigt: !!bStart,
    });
  }

  // Wie früh oder spät ist das Jahr? Mittlere Abweichung der modellierten
  // Blühtermine von ihrem langjährigen Kalendermittel.
  if (kum) {
    const abw = ergebnis
      .filter((r) => r.quelle.startsWith('modell') && r.start)
      .map((r) => doy(r.start) - artNach(r.art).doyMittel)
      .sort((a, b) => a - b);
    if (abw.length) verschiebung = -abw[Math.floor(abw.length / 2)];
  }

  return {
    standortId: standort?.id, jahr, arten: ergebnis,
    verschiebung, netzFehler,
    modellAktiv: !!kum,
  };
}

// --------------------------------------------------- abgeleitete Wetterereignisse
// Auslöser, die nicht am Kalender, sondern am Wetter hängen.

export async function wetterEreignisse(standort, datum = heute()) {
  const jahr = datum.getFullYear();
  const leer = {
    ersterWarmtag: null, durchsichtWetter: null,
    ersterNachtfrost: null, frostbeginn: null, brutfrei: null, geschaetzt: true,
  };
  if (standort?.lat == null || standort?.lon == null) return leer;

  let tage;
  try { tage = (await jahresWetter(standort)).tage; } catch { return leer; }

  const imJahr = tage.filter((t) => parseISO(t.datum).getFullYear() === jahr);
  const nach = (mm, dd) => imJahr.filter((t) => parseISO(t.datum) >= new Date(jahr, mm - 1, dd));

  const ersterWarmtag = nach(2, 1).find((t) => t.max >= 10)?.datum || null;

  // drei Tage in Folge über 12 °C – dann ist eine erste Durchsicht vertretbar
  let durchsichtWetter = null;
  const fruehjahr = nach(3, 1);
  for (let i = 0; i + 2 < fruehjahr.length; i++) {
    if (fruehjahr[i].max >= 12 && fruehjahr[i + 1].max >= 12 && fruehjahr[i + 2].max >= 12) {
      durchsichtWetter = fruehjahr[i].datum; break;
    }
  }

  const ersterNachtfrost = imJahr
    .filter((t) => parseISO(t.datum) >= new Date(jahr, 8, 15))
    .find((t) => t.min <= 0)?.datum || null;

  // Frostperiode: drei Tage in Folge mit Höchstwert unter 3 °C
  let frostbeginn = null;
  const herbst = nach(11, 1);
  for (let i = 0; i + 2 < herbst.length; i++) {
    if (herbst[i].max < 3 && herbst[i + 1].max < 3 && herbst[i + 2].max < 3) {
      frostbeginn = herbst[i].datum; break;
    }
  }

  return {
    ersterWarmtag, durchsichtWetter, ersterNachtfrost, frostbeginn,
    // Nach etwa drei Wochen Frostruhe ist das Volk brutfrei
    brutfrei: frostbeginn ? iso(addDays(parseISO(frostbeginn), 21)) : null,
    geschaetzt: false,
  };
}


// ============================================================================
// Stundenwetter und imkerliche Bewertung
// ----------------------------------------------------------------------------
// Zwei Fragen beantwortet dieser Abschnitt:
//   1. Wie ist das Wetter am Bienenstand gerade und in den nächsten Stunden?
//   2. Taugt es für die anstehende Arbeit – und wenn nicht, wann wäre es besser?
//
// Die zweite Frage ist die eigentlich imkerliche. Bienen sind bei Gewitterneigung,
// fallendem Luftdruck, Kälte, Wind und in der Trachtlücke wehrhafter; bei
// bedecktem, kühlem Wetter sitzt die gesamte Flugbiene im Stock, was jeden
// Eingriff unangenehmer macht. Diese Zusammenhänge stecken unten in Zahlen.

const STUNDEN_CACHE = 1;    // Stunden – die Vorhersage wird stündlich neu geholt

/** Weltwetter-Schlüssel (WMO) → Klartext und Zeichen. */
const WMO = {
  0: ['klar', '☀'], 1: ['überwiegend klar', '🌤'], 2: ['teils bewölkt', '⛅'], 3: ['bedeckt', '☁'],
  45: ['Nebel', '🌫'], 48: ['Reifnebel', '🌫'],
  51: ['leichter Niesel', '🌦'], 53: ['Niesel', '🌦'], 55: ['starker Niesel', '🌦'],
  56: ['gefrierender Niesel', '🌧'], 57: ['gefrierender Niesel', '🌧'],
  61: ['leichter Regen', '🌧'], 63: ['Regen', '🌧'], 65: ['starker Regen', '🌧'],
  66: ['gefrierender Regen', '🌧'], 67: ['gefrierender Regen', '🌧'],
  71: ['leichter Schneefall', '🌨'], 73: ['Schneefall', '🌨'], 75: ['starker Schneefall', '🌨'],
  77: ['Schneegriesel', '🌨'], 80: ['Regenschauer', '🌦'], 81: ['Regenschauer', '🌦'],
  82: ['kräftige Schauer', '🌧'], 85: ['Schneeschauer', '🌨'], 86: ['Schneeschauer', '🌨'],
  95: ['Gewitter', '⛈'], 96: ['Gewitter mit Hagel', '⛈'], 99: ['Gewitter mit Hagel', '⛈'],
};
export const wetterText = (code) => (WMO[code] || ['unbestimmt', '·'])[0];
export const wetterZeichen = (code) => (WMO[code] || ['unbestimmt', '·'])[1];

/** Stundenvorhersage für einen Standort (Open-Meteo, kostenfrei, ohne Schlüssel). */
export async function stundenWetter(standort) {
  if (standort?.lat == null || standort?.lon == null) return null;
  const k = key(standort, 'stunden');
  const cached = await ausCache(k, STUNDEN_CACHE);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${standort.lat}`
    + `&longitude=${standort.lon}`
    + '&hourly=temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,'
    + 'cloud_cover,wind_speed_10m,wind_gusts_10m,weather_code,surface_pressure,is_day'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum'
    + '&past_days=1&forecast_days=3&timezone=auto';
  const j = await holeJSON(url);

  const h = j.hourly || {};
  const stunden = (h.time || []).map((zeit, i) => ({
    zeit,
    temp: h.temperature_2m?.[i] ?? null,
    feuchte: h.relative_humidity_2m?.[i] ?? null,
    regen: h.precipitation?.[i] ?? 0,
    regenP: h.precipitation_probability?.[i] ?? null,
    wolken: h.cloud_cover?.[i] ?? null,
    wind: h.wind_speed_10m?.[i] ?? null,
    boen: h.wind_gusts_10m?.[i] ?? null,
    code: h.weather_code?.[i] ?? null,
    druck: h.surface_pressure?.[i] ?? null,
    hell: h.is_day?.[i] ?? 1,
  })).filter((s) => s.temp != null);
  if (!stunden.length) return null;

  const d = j.daily || {};
  const tage = (d.time || []).map((datum, i) => ({
    datum,
    code: d.weather_code?.[i] ?? null,
    max: d.temperature_2m_max?.[i] ?? null,
    min: d.temperature_2m_min?.[i] ?? null,
    regen: d.precipitation_sum?.[i] ?? null,
  }));

  const daten = { stunden, tage, geholt: new Date().toISOString() };
  await metaSchreibe(k, { geholt: new Date().toISOString(), daten });
  return daten;
}

/**
 * Anforderungsprofile. Die Zahlen sind die üblichen imkerlichen Faustwerte.
 *   oeffnen  – Volk aufmachen, Waben ziehen
 *   as       – Ameisensäure: unter 15 °C wirkt sie kaum, über 30 °C zu scharf
 *   os       – Oxalsäure im brutfreien Volk: kalt, aber nicht klirrend
 *   trocken  – Arbeit an der Beute von außen, nur Regen und Sturm stören
 */
const PROFILE = {
  oeffnen: { minTemp: 12, gut: [15, 30], maxTemp: 33, maxWind: 25, maxBoen: 45, tagsueber: true },
  as: { minTemp: 12, gut: [15, 25], maxTemp: 30, maxWind: 30, maxBoen: 55, tagsueber: false },
  os: { minTemp: -8, gut: [0, 8], maxTemp: 12, maxWind: 30, maxBoen: 55, tagsueber: false },
  trocken: { minTemp: -30, gut: [-30, 40], maxTemp: 45, maxWind: 35, maxBoen: 65, tagsueber: true },
};
export const wetterProfile = () => Object.keys(PROFILE);

const rund = (x) => Math.round(x);

/** Punktbewertung einer einzelnen Stunde: 100 = ideal, 0 = unmöglich. */
export function stundeBewerten(s, profil = 'oeffnen') {
  const p = PROFILE[profil] || PROFILE.oeffnen;
  let punkte = 100;
  const gruende = [];
  const weg = (n, grund) => { punkte -= n; if (grund) gruende.push(grund); };

  if (p.tagsueber && !s.hell) weg(55, t('Dunkelheit'));
  if (s.temp != null) {
    if (s.temp < p.minTemp) weg(60, t('zu kalt ({t} °C)', { t: rund(s.temp) }));
    else if (s.temp < p.gut[0]) weg(22, t('kühl ({t} °C)', { t: rund(s.temp) }));
    else if (s.temp > p.maxTemp) weg(40, t('zu heiß ({t} °C)', { t: rund(s.temp) }));
    else if (s.temp > p.gut[1]) weg(15, t('sehr warm ({t} °C)', { t: rund(s.temp) }));
  }
  if (s.regen > 0.2) weg(50, t('Niederschlag'));
  else if (s.regenP != null && s.regenP >= 60) weg(18, t('Regenrisiko {n} %', { n: s.regenP }));
  if (s.wind != null) {
    if (s.wind > p.maxWind) weg(35, t('starker Wind ({n} km/h)', { n: rund(s.wind) }));
    else if (s.wind > p.maxWind * 0.6) weg(12, t('windig ({n} km/h)', { n: rund(s.wind) }));
  }
  if (s.boen != null && s.boen > p.maxBoen) weg(18, t('Böen bis {n} km/h', { n: rund(s.boen) }));
  if (s.code >= 95) weg(45, t('Gewitter'));
  if (profil === 'oeffnen' && s.wolken != null && s.wolken > 85 && punkte > 40) {
    weg(10, t('bedeckt – die Flugbienen sitzen zu Hause'));
  }
  return { punkte: Math.max(0, Math.min(100, punkte)), gruende };
}

export const stufeVon = (punkte) => (punkte >= 70 ? 'gut' : punkte >= 45 ? 'maessig' : 'schlecht');

const zeitVon = (s) => new Date(s.zeit);

/** Index der Stunde, die gerade läuft. */
function jetztIndex(stunden, jetzt) {
  const grenze = jetzt.getTime() - 3600e3;
  const i = stunden.findIndex((s) => zeitVon(s).getTime() > grenze);
  return i < 0 ? stunden.length - 1 : i;
}

/**
 * Sind die Bienen gerade wahrscheinlich gereizt?
 * Bewusst getrennt von der Arbeitseignung: es kann trocken und mild sein und
 * die Völker trotzdem stechlustig, etwa vor einem Gewitter oder in der
 * Trachtlücke.
 */
export function gereiztheit(sw, { jetzt = new Date(), trachtluecke = false } = {}) {
  const gruende = [];
  if (!sw?.stunden?.length) return { gereizt: false, gruende };
  const i = jetztIndex(sw.stunden, jetzt);
  const s = sw.stunden[i];
  const naechste = sw.stunden.slice(i, i + 7);
  const vorher = sw.stunden.slice(Math.max(0, i - 6), i + 1);

  if (naechste.some((x) => x.code >= 95)) gruende.push(t('Gewitter in den nächsten Stunden'));
  const drucke = vorher.map((x) => x.druck).filter((x) => x != null);
  if (drucke.length >= 4 && drucke[0] - drucke[drucke.length - 1] >= 3) {
    gruende.push(t('rasch fallender Luftdruck'));
  }
  if (s.temp != null && s.temp < 14 && (s.wolken ?? 0) > 70) {
    gruende.push(t('kühl und bedeckt – die ganze Flugbiene sitzt im Stock'));
  }
  if ((s.wind ?? 0) > 25) gruende.push(t('starker Wind'));
  if (s.regen > 0.2 || (s.regenP ?? 0) >= 70) gruende.push(t('Regen'));
  if ((s.temp ?? 0) >= 22 && (s.feuchte ?? 0) >= 75) gruende.push(t('schwül'));
  if (trachtluecke) gruende.push(t('Trachtlücke – Räubereigefahr'));

  return { gereizt: gruende.length > 0, gruende };
}

/**
 * Bestes Arbeitsfenster in den nächsten Tagen: der früheste zusammenhängende
 * Abschnitt von mindestens zwei Stunden mit guter Bewertung.
 */
export function bestesFenster(sw, { jetzt = new Date(), profil = 'oeffnen', minPunkte = 70 } = {}) {
  if (!sw?.stunden?.length) return null;
  const ab = sw.stunden.slice(jetztIndex(sw.stunden, jetzt));
  let lauf = null; let bestes = null;
  for (const s of ab) {
    const p = stundeBewerten(s, profil).punkte;
    if (p >= minPunkte) {
      if (!lauf) lauf = { von: zeitVon(s), bis: zeitVon(s), summe: 0, n: 0 };
      lauf.bis = new Date(zeitVon(s).getTime() + 3600e3);
      lauf.summe += p; lauf.n += 1;
    } else if (lauf) {
      if (lauf.n >= 2 && !bestes) bestes = lauf;
      lauf = null;
    }
    if (bestes) break;
  }
  if (!bestes && lauf && lauf.n >= 2) bestes = lauf;
  if (!bestes) return null;
  return { von: bestes.von, bis: bestes.bis, punkte: Math.round(bestes.summe / bestes.n) };
}

/**
 * Gesamtlage für einen Standort: aktuelles Wetter, Eignung für eine Arbeit,
 * Reizlage und – falls es gerade nicht passt – der nächste günstige Zeitraum.
 */
export function wetterlage(sw, { jetzt = new Date(), profil = 'oeffnen', trachtluecke = false } = {}) {
  if (!sw?.stunden?.length) return null;
  const i = jetztIndex(sw.stunden, jetzt);
  const s = sw.stunden[i];
  const b = stundeBewerten(s, profil);
  const heuteIso = iso(jetzt);
  const tag = (sw.tage || []).find((x) => x.datum === heuteIso) || null;
  const g = gereiztheit(sw, { jetzt, trachtluecke });
  const bestes = b.punkte >= 70 ? null : bestesFenster(sw, { jetzt, profil });

  return {
    jetzt: s,
    zeichen: wetterZeichen(s.code),
    text: wetterText(s.code),
    tag,
    profil,
    punkte: b.punkte,
    stufe: stufeVon(b.punkte),
    gruende: b.gruende,
    gereizt: g.gereizt,
    reizGruende: g.gruende,
    bestes,
    stunden: sw.stunden.slice(i, i + 24),
  };
}

/**
 * Wärmesumme (Gradtage über 5 °C seit 1. Januar) an einem bestimmten Tag.
 * Wird beim Bestätigen eines Blühbeginns mitgespeichert und dient in den
 * Folgejahren als standortgenaue Schwelle für diese Art.
 */
export async function waermesummeAm(standort, datum) {
  if (standort?.lat == null) return null;
  try {
    const { tage } = await jahresWetter(standort);
    const d = datum instanceof Date ? datum : parseISO(datum);
    const { kum } = kumulierteWaermesumme(tage, d.getFullYear());
    const tag = doy(d);
    for (let i = tag; i >= 1; i--) if (kum[i] != null) return Math.round(kum[i]);
    return null;
  } catch { return null; }
}
