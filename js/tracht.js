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
// `pollen` beschreibt, wie der eingetragene Pollen in der Zelle aussieht: Farbwert
// für den Farbtupfer in der App und ein Satz zum Wiedererkennen. Die Farben folgen
// den gängigen Pollenbestimmungstafeln; sie schwanken mit Alter, Feuchte und Herkunft
// des Höschens – als Anhaltspunkt am Flugloch und auf der Wabe reichen sie gut.
export const ARTEN = [
  { id: 'hasel', name: 'Hasel', doyMittel: 41, dauer: 30, art: 'pollen', keinModell: true, hinweis: 'erster Pollen – Blüte steuert die Tageslänge, nicht die Wärme',
    pollen: { farbe: '#D9CE72', text: 'blassgelb bis grünlichgelb. Meist die erste Farbe des Jahres, in schmalen Kränzen am Rand des Brutnestes.' } },
  { id: 'erle', name: 'Erle', doyMittel: 46, dauer: 28, art: 'pollen', keinModell: true,
    pollen: { farbe: '#BFA14A', text: 'ockergelb bis gelbbraun, oft direkt neben dem helleren Haselpollen in derselben Wabe.' } },
  { id: 'salweide', name: 'Salweide', doyMittel: 84, dauer: 20, art: 'beides', hinweis: 'Startschuss für die Entwicklung',
    pollen: { farbe: '#E8B923', text: 'kräftig chromgelb – das erste satte Gelb im Kranz um die Brut. Wird sofort verfüttert, liegt also selten lange.' } },
  { id: 'obstbluete', name: 'Obstblüte', doyMittel: 108, dauer: 21, art: 'beides',
    pollen: { farbe: '#C7C25E', text: 'gelblich-grün bei Apfel, graubraun bei Kirsche und Pflaume. In der Obstblüte liegen deshalb oft mehrere Farben nebeneinander.' } },
  { id: 'loewenzahn', name: 'Löwenzahn', doyMittel: 110, dauer: 30, art: 'beides', hinweis: 'Signal zum Erweitern',
    pollen: { farbe: '#E8952A', text: 'leuchtend orange – die auffälligste Frühjahrsfarbe. Ganze Wabenseiten können orange leuchten, die Höschen an den Bienen ebenso.' } },
  { id: 'raps', name: 'Raps', doyMittel: 118, dauer: 28, art: 'beides', hinweis: 'Frühtracht – zügig ernten',
    pollen: { farbe: '#EBC53A', text: 'kräftig gelb, feucht glänzend. Kommt in Massen herein, wird zügig festgestampft und verdeckelt.' } },
  { id: 'robinie', name: 'Robinie', doyMittel: 145, dauer: 16, art: 'nektar',
    pollen: { farbe: '#CFC4A0', text: 'blass bräunlich-weiß und unauffällig – Robinie liefert vor allem Nektar, wenig Pollen.' } },
  { id: 'linde', name: 'Linde', doyMittel: 173, dauer: 20, art: 'nektar', hinweis: 'Ende = letzte Ernte',
    pollen: { farbe: '#D5D57A', text: 'blassgelb bis hellgrün, meist nur in kleinen Mengen zwischen dem vielen Nektar.' } },
  { id: 'phacelia', name: 'Phacelia / Senf', doyMittel: 201, dauer: 35, art: 'beides', unsicher: true, hinweis: 'nur wo ausgesät wurde',
    pollen: { farbe: '#6E7BA8', text: 'Phacelia dunkelblau bis graublau-violett – die auffälligste Pollenfarbe überhaupt, in der Zelle fast schiefergrau. Senf dagegen hellgelb.' } },
  { id: 'heide', name: 'Heide', doyMittel: 217, dauer: 35, art: 'nektar', unsicher: true,
    pollen: { farbe: '#B98A50', text: 'gelbbraun bis rotbraun, spät im Jahr eingetragen und oft die letzte frische Farbe vor dem Winter.' } },
  { id: 'springkraut', name: 'Springkraut', doyMittel: 222, dauer: 40, art: 'beides', unsicher: true,
    pollen: { farbe: '#EFECE5', text: 'weiß bis hellgrau. Am sichersten am Flugloch zu erkennen: die Bienen kommen weiß bestäubt heim.' } },
  { id: 'waldtracht', name: 'Waldtracht / Honigtau', doyMittel: 165, dauer: 45, art: 'nektar', unsicher: true, keinModell: true, hinweis: 'Läusehonig – nicht vorhersagbar, nie fest einplanen',
    pollen: null },
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
  if (profil === 'oeffnen' && (s.temp ?? 0) >= 22 && (s.feuchte ?? 0) >= 75) {
    weg(14, t('schwül'));
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
  if (!sw?.stunden?.length) return { gereizt: false, gruende, wetterbedingt: false };
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
  // Die Trachtlücke steht bewusst am Ende: sie geht nicht mit dem nächsten
  // Wetterumschwung vorbei, also darf die App deswegen auch keinen besseren
  // Zeitpunkt versprechen.
  const wetterbedingt = gruende.length > 0;
  if (trachtluecke) gruende.push(t('Trachtlücke – Räubereigefahr'));

  return { gereizt: gruende.length > 0, gruende, wetterbedingt };
}

/**
 * Steht in dieser Stunde eine Reizlage an? Dieselben Kriterien wie in
 * `gereiztheit`, nur auf eine beliebige Stunde der Vorhersage angewandt –
 * damit die App als „besser" nur Zeiten vorschlägt, in denen die Völker
 * voraussichtlich auch umgänglich sind.
 */
function stundeGereizt(alle, i) {
  const s = alle[i];
  if (!s) return false;
  if (alle.slice(Math.max(0, i - 2), i + 3).some((x) => x.code >= 95)) return true;
  if ((s.temp ?? 0) >= 22 && (s.feuchte ?? 0) >= 75) return true;
  if ((s.wind ?? 0) > 25) return true;
  if (s.regen > 0.2 || (s.regenP ?? 0) >= 70) return true;
  if (s.temp != null && s.temp < 14 && (s.wolken ?? 0) > 70) return true;
  const vorher = alle.slice(Math.max(0, i - 6), i + 1).map((x) => x.druck).filter((x) => x != null);
  if (vorher.length >= 4 && vorher[0] - vorher[vorher.length - 1] >= 3) return true;
  return false;
}

/**
 * Bestes Arbeitsfenster in den nächsten Tagen: der früheste zusammenhängende
 * Abschnitt von mindestens zwei Stunden mit guter Bewertung.
 * `ohneReiz` schließt zusätzlich alle Stunden aus, in denen mit gereizten
 * Völkern zu rechnen ist.
 */
export function bestesFenster(sw, {
  jetzt = new Date(), profil = 'oeffnen', minPunkte = 70, ohneReiz = false,
} = {}) {
  if (!sw?.stunden?.length) return null;
  const alle = sw.stunden;
  const start = jetztIndex(alle, jetzt);
  const ab = alle.slice(start);
  // Eine Stunde taugt nur dann als Fenster, wenn auch zwei Stunden davor und
  // danach kein Gewitter steht – vor und nach einem Gewitter sind die Völker
  // erfahrungsgemäß am wehrhaftesten.
  const gewitterNah = (i) => alle.slice(Math.max(0, i - 2), i + 3).some((x) => x.code >= 95);
  let lauf = null; let bestes = null;
  for (let k = 0; k < ab.length; k++) {
    const s = ab[k];
    const raus = gewitterNah(start + k) || (ohneReiz && stundeGereizt(alle, start + k));
    const p = raus ? 0 : stundeBewerten(s, profil).punkte;
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
  // Auch bei formal gutem Wetter lohnt der Blick auf einen besseren Zeitpunkt,
  // wenn die Bienen gerade wetterbedingt gereizt sind.
  const bestes = (b.punkte >= 70 && !g.wetterbedingt)
    ? null
    : bestesFenster(sw, { jetzt, profil, ohneReiz: g.wetterbedingt });

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
    reizWetterbedingt: g.wetterbedingt,
    bestes,
    stunden: sw.stunden.slice(i, i + 24),
  };
}

/**
 * Wetterwarnungen mit Handlungsbezug.
 * Nicht „es wird stürmisch", sondern „Deckel beschweren" – eine Warnung ohne
 * Handlung ist am Bienenstand nur Beunruhigung. Geprüft wird die Stundenvorhersage
 * der nächsten 48 Stunden, beim Frost die Tagesübersicht.
 */
export function wetterwarnungen(sw, { jetzt = new Date() } = {}) {
  const warnungen = [];
  if (!sw?.stunden?.length) return warnungen;

  const grenze = jetzt.getTime() - 3600e3;
  const kommend = sw.stunden.filter((x) => {
    const z = new Date(x.zeit).getTime();
    return z > grenze && z <= jetzt.getTime() + 48 * 3600e3;
  });
  if (!kommend.length) return warnungen;

  const wann = (s) => new Date(s.zeit);

  // ---- Sturm
  const boeig = kommend.filter((x) => (x.boen ?? 0) >= 60)
    .sort((a, b) => (b.boen ?? 0) - (a.boen ?? 0));
  if (boeig.length) {
    const spitze = boeig[0];
    warnungen.push({
      art: 'sturm',
      wann: wann(boeig.map((x) => x).sort((a, b) => new Date(a.zeit) - new Date(b.zeit))[0]),
      titel: t('Sturm angekündigt: Böen bis {n} km/h', { n: Math.round(spitze.boen) }),
      handlung: t('Deckel beschweren, Beuten gegen Umfallen sichern, lose Teile wegräumen.'),
      aufgabe: 'Beuten gegen Sturm sichern',
    });
  }

  // ---- erster Nachtfrost im Herbst
  const monat = jetzt.getMonth() + 1;
  if (monat >= 9 || monat <= 2) {
    const frost = (sw.tage || []).find((x) => x.min != null && x.min <= 0 && x.datum >= iso(jetzt));
    if (frost) {
      warnungen.push({
        art: 'frost',
        wann: parseISO(frost.datum),
        titel: t('Frost angekündigt: {n} °C in der Nacht zum {d}',
          { n: Math.round(frost.min), d: `${frost.datum.slice(8, 10)}.${frost.datum.slice(5, 7)}.` }),
        handlung: t('Mäusegitter und Fluglochkeil einhängen, Futtergeschirr raus, '
          + 'Volk nicht mehr öffnen.'),
        aufgabe: 'Mäusegitter einhängen',
      });
    }
  }

  // ---- Hitze
  const heiss = kommend.filter((x) => (x.temp ?? 0) >= 34)
    .sort((a, b) => (b.temp ?? 0) - (a.temp ?? 0));
  if (heiss.length) {
    warnungen.push({
      art: 'hitze',
      wann: wann(heiss[0]),
      titel: t('Hitze angekündigt: bis {n} °C', { n: Math.round(heiss[0].temp) }),
      handlung: t('Für Schatten und Wasser in der Nähe sorgen, Flugloch weit offen lassen, '
        + 'volle Honigräume nicht in der Sonne stehen lassen.'),
      aufgabe: 'Schatten und Wasser am Stand prüfen',
    });
  }

  // ---- Dauerregen
  const regen = (sw.tage || []).filter((x) => (x.regen ?? 0) >= 25 && x.datum >= iso(jetzt));
  if (regen.length) {
    warnungen.push({
      art: 'regen',
      wann: parseISO(regen[0].datum),
      titel: t('Starkregen angekündigt: {n} mm am {d}',
        { n: Math.round(regen[0].regen), d: `${regen[0].datum.slice(8, 10)}.${regen[0].datum.slice(5, 7)}.` }),
      handlung: t('Standplatz auf Staunässe ansehen, Beuten leicht nach vorn neigen, '
        + 'Fluglöcher frei halten.'),
      aufgabe: 'Standplatz nach Starkregen prüfen',
    });
  }

  return warnungen.sort((a, b) => a.wann - b.wann);
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
