// BeeWise – Hauptmodul: Zustand, Ansichten, Interaktionen.
import {
  iso, parseISO, heute, addDays, diffTage, fmtDatum, fmtRelativ, esc, uid, MON_LANG,
} from './util.js';
import * as db from './db.js';
import {
  ARTEN, trachtFuerStandort, wetterEreignisse, waermesummeAm,
  stundenWetter, wetterlage, stundeBewerten, stufeVon,
  wetterZeichen as wetterZeichenVon, wetterText as wetterTextVon,
} from './tracht.js';
import { REGELN, KATEGORIEN, regelNach, futterBedarf, varroaSchwelle } from './regeln.js';
import { planBerechnen, trachtFragen, zusammenfassung } from './engine.js';
import { ausloeserPruefen, eigeneAnlegen, abhaken as eigenAbhaken } from './aufgaben.js';
import { statischesLuftbild, MiniKarte, adresseSuchen, adresseZuKoordinaten } from './karte.js';
import { trachtBild, platzhalter, wikiSeite, bildVerwerfen } from './bilder.js';
import { videoSuche, videoSucheAllgemein, PLAYLIST, KANAL } from './hilfe.js';
import { icsHerunterladen } from './kalenderexport.js';
import {
  SCHNELL, OHNE_BEFUND, standVoelker, offeneFuer, volkSchritt, abschlussSchritt,
  grobWerteLesen, schrittSpeichern,
} from './stand.js';
import { etikettenPDF, grundadresse } from './etiketten.js';
import * as koe from './koeniginnen.js';
import * as fotos from './fotos.js';
import { behandlungsprotokoll, volkHistorie, dateiname } from './berichte.js';
import * as sync from './sync.js';
import {
  uiInit, sheetAuf, sheetZu, toast, bestaetige, feldHTML, felderVerdrahten, werteLesen,
  zurueckFallbackSetzen, ebenenQuelleSetzen, verlaufAbgleichen, sheetIstAuf,
} from './ui.js';
import {
  SPRACHEN, t, uebersetzeDom, spracheErmitteln, spracheSetzen, sprache, spracheName, gebietsschema,
} from './i18n.js';

const S = {
  ansicht: 'heute', volkId: null,
  standorte: [], voelker: [], durchsichten: [], erledigungen: [], trachtObs: [], eigene: [],
  wanderungen: [], koeniginnen: [],
  tracht: {}, wetter: {}, stunden: {}, plan: [], fragen: [],
  stand: null,                  // laufender Durchgang am Bienenstand
  filter: null,                 // Kategorie-Filter
  monat: new Date(),            // Kalenderansicht
  tag: null,                    // gewählter Tag im Kalender
  offen: {},                    // aufgeklappte Bereiche
  ladeTracht: false, ladeWetter: false,
};

// Nichts darf mehr still scheitern: jeder unbehandelte Fehler wird angezeigt
// und gemerkt, damit man ihn unter „Mehr → Diagnose" nachlesen kann.
let letzterAppFehler = null;
function fehlerZeigen(quelle, e) {
  letzterAppFehler = `${new Date().toLocaleTimeString('de-DE')} · ${quelle}: `
    + (e?.message || e?.reason?.message || String(e?.reason || e));
  console.error(quelle, e);
  try { toast('Fehler: ' + letzterAppFehler.split('· ')[1]); } catch { /* UI noch nicht bereit */ }
}
window.addEventListener('error', (e) => fehlerZeigen('Programmfehler', e.error || e));
window.addEventListener('unhandledrejection', (e) => fehlerZeigen('Nicht abgefangen', e));

/** Was BeeWise melden darf. Wird unter „Mehr" eingestellt. */
const MELDUNGEN_STANDARD = {
  faellig: true, warnungen: true, tracht: true, vorwarnung: true, vorlaufTage: 3,
};

const t2 = (s, v) => (s == null ? s : t(s, v));

const AN = document.getElementById('ansicht');
const KOPF = document.getElementById('kopf-titel');
const ZURUECK = document.getElementById('kopf-zurueck');

// ================================================================== Laden

async function datenLaden() {
  [S.standorte, S.voelker, S.durchsichten, S.erledigungen, S.trachtObs, S.eigene, S.wanderungen,
    S.koeniginnen] = await Promise.all([
    db.alle('standorte'), db.alle('voelker'), db.alle('durchsichten'),
    db.alle('erledigungen'), db.alle('tracht'), db.alle('aufgaben'), db.alle('wanderungen'),
    db.alle('koeniginnen'),
  ]);
  S.sync = await sync.einstellungen();
  S.meldungen = { ...MELDUNGEN_STANDARD, ...(await db.metaLies('meldungen', {})) };
  S.imkereiName = await db.metaLies('imkerei', '');
  S.standorte.sort((a, b) => a.name.localeCompare(b.name));
  S.voelker.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { numeric: true }));
  neuRechnen();
}

function neuRechnen() {
  S.plan = planBerechnen({
    datum: heute(), standorte: S.standorte, voelker: S.voelker,
    erledigungen: S.erledigungen, eigene: S.eigene, koeniginnen: S.koeniginnen,
    tracht: S.tracht, wetter: S.wetter,
  });
  S.fragen = trachtFragen(S.tracht, S.standorte, S.trachtObs);
}

async function trachtLaden({ still = false } = {}) {
  if (!S.standorte.length) return;
  S.ladeTracht = true; if (!still) render();
  await Promise.all(S.standorte.map(async (st) => {
    const obs = S.trachtObs.filter((o) => o.standortId === st.id);
    try {
      S.tracht[st.id] = await trachtFuerStandort(st, obs);
      S.wetter[st.id] = await wetterEreignisse(st);
    } catch {
      S.tracht[st.id] = await trachtFuerStandort({ ...st, lat: null, lon: null }, obs);
    }
  }));
  S.ladeTracht = false;
  neuRechnen();
  render();
  wetterLaden();
}

/**
 * Stundenvorhersage je Standort. Läuft getrennt von der Tracht, weil sie
 * stündlich frisch sein soll, während die Trachtdaten den ganzen Tag halten.
 */
async function wetterLaden({ still = true } = {}) {
  if (!S.standorte.length) return;
  S.ladeWetter = true;
  if (!still) render();
  await Promise.all(S.standorte.map(async (st) => {
    try { S.stunden[st.id] = await stundenWetter(st); } catch { S.stunden[st.id] = null; }
  }));
  S.ladeWetter = false;
  lageLeeren();
  render();
}

// ================================================================== Rendern

const TITEL = {
  heute: 'Heute', kalender: 'Kalender', voelker: 'Völker',
  tracht: 'Tracht', mehr: 'Mehr', volk: 'Volk', stand: 'Durchgang',
};

function render() {
  lageLeeren();
  KOPF.textContent = S.ansicht === 'volk'
    ? (S.voelker.find((v) => v.id === S.volkId)?.name || t('Volk')) : t(TITEL[S.ansicht]);
  document.body.classList.toggle('imstand', S.ansicht === 'stand');
  document.getElementById('kopf-datum').textContent =
    heute().toLocaleDateString(gebietsschema(), { weekday: 'short', day: 'numeric', month: 'long' });
  if (ZURUECK) ZURUECK.hidden = !UNTERANSICHT[S.ansicht];
  document.querySelectorAll('#tabbar button').forEach((b) =>
    b.classList.toggle('an', b.dataset.tab === (S.ansicht === 'volk' ? 'voelker' : S.ansicht)));
  const warnung = db.nurFluechtig?.()
    ? `<div class="karte" style="border-color:var(--ueberfaellig)"><div class="karte-inhalt">
        <b style="color:var(--ueberfaellig)">Achtung: nichts wird dauerhaft gespeichert.</b>
        <div class="mini" style="margin-top:5px">Dieser Browser erlaubt keine lokale Datenbank –
        das passiert, wenn die Datei direkt von der Festplatte geöffnet wird (Adresse beginnt
        mit <code>file://</code>). Alles ist beim Schließen weg. Lege die App über eine
        Web-Adresse ab (siehe HOSTING.md), dann bleiben die Daten erhalten.</div>
      </div></div>` : '';
  AN.innerHTML = warnung + ({
    heute: ansichtHeute, kalender: ansichtKalender, voelker: ansichtVoelker,
    volk: ansichtVolk, tracht: ansichtTracht, mehr: ansichtMehr, stand: ansichtStand,
  }[S.ansicht])();
  uebersetzeDom(document.body);
  verdrahten();
  nachladen();
}

/** Ansichten, die „unter" einem Tab liegen und einen Zurück-Weg brauchen. */
const UNTERANSICHT = { volk: 'voelker', stand: 'heute' };

function gehe(tab, volkId = null) {
  S.ansicht = tab; S.volkId = volkId;
  if (tab !== 'stand') S.stand = null;
  render(); window.scrollTo(0, 0);
  verlaufAbgleichen();      // ui.js hält genau einen Eintrag, solange etwas offen ist
}

/** Eine Ebene zurück: Unteransicht schließen, sonst auf „Heute". */
function zurueck() {
  const ziel = UNTERANSICHT[S.ansicht];
  if (!ziel) return false;
  gehe(ziel);
  return true;
}

const offeneAufgaben = () => S.plan.filter((a) =>
  ['ueberfaellig', 'faellig', 'bald', 'wartet'].includes(a.zustand));

const gefiltert = (liste) => (S.filter ? liste.filter((a) => a.kategorie === S.filter) : liste);

// ------------------------------------------------------------------ Heute

function ansichtHeute() {
  if (!S.standorte.length) {
    return `<div class="karte"><div class="karte-inhalt leer">
      <span class="gross">🐝</span>
      <b>Willkommen bei BeeWise.</b><br>
      Lege zuerst einen Bienenstand an – über Adresse, GPS oder Langdruck im Luftbild.
      Aus seiner Lage berechnet die App die örtliche Tracht und daraus deine Termine.
      <div class="knopfreihe" style="margin-top:18px"><button class="knopf" data-neu-standort>Bienenstand anlegen</button></div>
      <div style="margin-top:12px"><button class="knopf leise klein" data-demo>Beispieldaten laden</button></div>
    </div></div>`;
  }

  const z = zusammenfassung(S.plan);
  const t = [];

  t.push(`<div class="uebersicht">
    <div><b class="${z.ueberfaellig ? 'z-ueberfaellig' : ''}">${z.ueberfaellig}</b><span>überfällig</span></div>
    <div><b class="${z.faellig ? 'z-faellig' : ''}">${z.faellig}</b><span>jetzt fällig</span></div>
    <div><b class="${z.bald ? 'z-bald' : ''}">${z.bald}</b><span>in Kürze</span></div>
    <div><b>${S.voelker.length}</b><span>Völker</span></div>
  </div>`);

  t.push(wetterUebersichtHTML());
  if (S.voelker.length) {
    t.push(`<div class="knopfreihe" style="margin:0 0 12px">
      <button class="knopf" data-standmodus>${esc(t2('Durchgang am Bienenstand'))}</button></div>`);
  }
  t.push(filterLeiste());

  if (S.fragen.length && !S.filter) {
    t.push('<h2 class="abschnitt">Kurze Rückfrage zur Tracht</h2>');
    for (const f of S.fragen) {
      t.push(`<div class="karte frage"><div class="karte-inhalt">
        <div class="text">${esc(f.text)}</div>
        <div class="quelle">Das Modell erwartet den Blühbeginn um den ${fmtDatum(f.modellStart)}.
          Deine Antwort zählt mehr – und macht das Modell im nächsten Jahr genauer.</div>
        <div class="knopfreihe">
          <button class="knopf klein" style="flex:1" data-bluete="start" data-art="${f.art}" data-st="${f.standortId}">Ja, blüht</button>
          <button class="knopf leise klein" style="flex:1" data-bluete="nochNicht" data-art="${f.art}" data-st="${f.standortId}">Noch nicht</button>
        </div>
      </div></div>`);
    }
  }

  const bloecke = [
    ['ueberfaellig', 'Überfällig'], ['faellig', 'Jetzt fällig'],
    ['bald', 'Die nächsten drei Wochen'], ['wartet', 'Wartet auf eine Vorarbeit'],
  ];
  let etwas = false;
  for (const [zust, label] of bloecke) {
    const liste = gefiltert(S.plan.filter((a) => a.zustand === zust));
    if (!liste.length) continue;
    etwas = true;
    t.push(`<h2 class="abschnitt">${t2(label)} · ${liste.length}</h2><div class="karte">`);
    t.push(gruppieren(liste).map(gruppeHTML).join(''));
    t.push('</div>');
  }
  if (!etwas) {
    t.push(`<div class="karte"><div class="karte-inhalt leer"><span class="gross">✓</span>
      ${S.filter ? 'In dieser Kategorie ist nichts offen.' : 'Nichts zu tun. Alles im Plan.'}</div></div>`);
  }

  t.push(`<div class="knopfreihe" style="margin-top:14px">
    <button class="knopf leise" data-eigene-neu>+ Eigene Aufgabe</button>
    <button class="knopf leise" data-ics>In Kalender exportieren</button>
  </div>`);

  const verpasst = S.plan.filter((a) => a.zustand === 'verpasst').length;
  if (verpasst) {
    t.push(`<div class="mini" style="padding:8px 6px">${t2('{n} Aufgaben sind für dieses Jahr durch – die App mahnt sie nicht weiter an.', { n: verpasst })}</div>`);
  }
  if (S.ladeTracht) t.push('<div class="mini rechts">Trachtdaten werden geladen …</div>');

  t.push(aufgabenkatalogHTML());
  return t.join('');
}

function filterLeiste() {
  const zaehl = {};
  for (const a of offeneAufgaben()) zaehl[a.kategorie] = (zaehl[a.kategorie] || 0) + 1;
  const kats = Object.entries(KATEGORIEN).filter(([k]) => zaehl[k]);
  if (kats.length < 2) return '';
  return `<div class="filter">
    <button class="${S.filter ? '' : 'an'}" data-filter="">Alle</button>
    ${kats.map(([k, kat]) => `<button class="${S.filter === k ? 'an' : ''}" data-filter="${k}"
      style="${S.filter === k ? `background:${kat.farbe};border-color:${kat.farbe};color:#fff` : ''}">
      <i class="punkt" style="background:${S.filter === k ? '#fff' : kat.farbe}"></i>${esc(t2(kat.name))} ${zaehl[k]}</button>`).join('')}
  </div>`;
}

function aufgabenkatalogHTML() {
  const auf = S.offen.katalog;
  return `<h2 class="abschnitt">Aufgabenkatalog</h2>
  <div class="karte">
    <div class="klapper" data-klapp="katalog">
      <span>${t2('Alle {n} Regeln und woran ihr Termin hängt', { n: REGELN.length })}</span>
      <span class="pfeil">${auf ? '⌄' : '›'}</span></div>
    ${auf ? Object.entries(KATEGORIEN).map(([k, kat]) => {
      const rs = REGELN.filter((r) => r.kategorie === k);
      if (!rs.length) return '';
      return `<div class="karte-inhalt" style="border-top:1px solid var(--rand)">
        <div style="font-weight:650;font-size:13px;color:${kat.farbe};margin-bottom:6px">${esc(t2(kat.name))}</div>
        ${rs.map((r) => `<div class="mini" style="padding:3px 0;color:var(--text-schwach)">
          ${esc(t2(r.titel))} <span style="color:var(--text-zart)">— ${esc(ankerText(r))}</span></div>`).join('')}
      </div>`;
    }).join('') : ''}
  </div>`;
}

function gruppieren(liste) {
  const map = new Map();
  for (const a of liste) {
    const k = (a.gruppierung || a.regelId || a.schluessel) + '|' + a.zustand;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(a);
  }
  return [...map.values()];
}

const streifen = (z) => (z === 'ueberfaellig' ? 'ueberfaellig'
  : z === 'faellig' ? 'faellig' : z === 'wartet' ? 'wartet' : 'bald');

function aufgabeHTML(a, kompakt = false) {
  const kat = KATEGORIEN[a.kategorie] || KATEGORIEN.eigene;
  const zeit = a.zustand === 'wartet'
    ? (a.von ? t2('voraussichtlich {d}', { d: fmtDatum(a.von) }) : t2('Termin offen'))
    : a.zustand === 'ueberfaellig' ? t2('{n} Tage überfällig', { n: -diffTage(a.bis, heute()) })
      : a.zustand === 'faellig' ? t2('bis {d}', { d: fmtDatum(a.bis) })
        : t2('ab {d} · {rel}', { d: fmtDatum(a.von), rel: fmtRelativ(a.von) });
  return `<div class="aufgabe" data-auf="${esc(a.schluessel)}">
    <div class="streifen b-${streifen(a.zustand)}"></div>
    <div class="haken"><svg viewBox="0 0 24 24"><path d="m5 13 4 4 10-10"/></svg></div>
    <div class="mitte">
      <div class="titel">${esc(t2(a.titel))}${a.wichtig ? ' <span class="marke wichtig">wichtig</span>' : ''}${a.quelle === 'auto' ? ' <span class="marke auto">automatisch</span>' : ''}</div>
      <div class="zeile2">
        <span class="marke" style="background:${kat.farbe}22;color:${kat.farbe}">
          <i class="punkt" style="background:${kat.farbe}"></i>${esc(t2(kat.name))}</span>
        ${a.ziel.typ !== 'imkerei' ? `<span>${esc(a.ziel.name)}${a.ziel.typ === 'volk' && a.ziel.standortName ? ' · ' + esc(a.ziel.standortName) : ''}</span>` : ''}
        <span class="z-${a.zustand === 'ueberfaellig' ? 'ueberfaellig' : a.zustand === 'faellig' ? 'faellig' : ''}">${esc(zeit)}</span>
      </div>
      ${a.bezug && !kompakt ? `<div class="warum">${esc(a.wartetAuf
        ? t2('wartet auf: {was}', { was: t2(a.wartetAuf) }) : t2(a.bezug))}</div>` : ''}
      ${wetterWinkHTML(a)}
    </div>
  </div>`;
}

function gruppeHTML(g) {
  if (g.length === 1) return aufgabeHTML(g[0]);
  const a = g[0];
  const kat = KATEGORIEN[a.kategorie] || KATEGORIEN.eigene;
  const frueh = g.map((x) => x.von).filter(Boolean).sort((x, y) => x - y)[0];
  const spaet = g.map((x) => x.bis).filter(Boolean).sort((x, y) => x - y)[0];
  const zeit = a.zustand === 'wartet' ? t2('Termin hängt an einer Vorarbeit')
    : a.zustand === 'ueberfaellig' ? t2('{n} Tage überfällig', { n: -diffTage(spaet, heute()) })
      : a.zustand === 'faellig' ? t2('bis {d}', { d: fmtDatum(spaet) })
        : t2('ab {d} · {rel}', { d: fmtDatum(frueh), rel: fmtRelativ(frueh) });
  return `<div class="aufgabe" data-gruppe="${esc((a.gruppierung || a.regelId) + '|' + a.zustand)}">
    <div class="streifen b-${streifen(a.zustand)}"></div>
    <div class="haken mehrfach"></div>
    <div class="mitte">
      <div class="titel">${esc(t2(a.titel))}${a.wichtig ? ' <span class="marke wichtig">wichtig</span>' : ''}</div>
      <div class="zeile2">
        <span class="marke" style="background:${kat.farbe}22;color:${kat.farbe}">
          <i class="punkt" style="background:${kat.farbe}"></i>${esc(t2(kat.name))}</span>
        <span><b>${a.ziel.typ === 'stand' ? t2('{n} Stände', { n: g.length }) : t2('{n} Völker', { n: g.length })}</b></span>
        <span class="z-${a.zustand === 'ueberfaellig' ? 'ueberfaellig' : a.zustand === 'faellig' ? 'faellig' : ''}">${esc(zeit)}</span>
      </div>
      <div class="warum">${esc(g.map((x) => x.ziel.name).join(', '))}</div>
      ${wetterWinkGruppeHTML(g)}
    </div>
  </div>`;
}


// ------------------------------------------------------------------- Wetter
// Die Bewertung hängt am Zeitpunkt und an der Art der Arbeit. Sie wird deshalb
// nicht gespeichert, sondern bei Bedarf gerechnet und nur innerhalb eines
// Bildaufbaus zwischengehalten.

let lageCache = new Map();
const lageLeeren = () => { lageCache = new Map(); };

const EIGNUNG = { gut: 'gut', maessig: 'mäßig', schlecht: 'ungünstig' };

/** Blüht am Standort gerade etwas Nektarträchtiges? Sonst: Trachtlücke. */
function trachtluecke(standortId) {
  const tr = S.tracht[standortId];
  if (!tr) return false;
  return !tr.arten.some((a) => a.status === 'blueht' && a.typ !== 'pollen' && !a.unsicher);
}

function lage(standortId, profil = 'oeffnen') {
  const k = standortId + '|' + profil;
  if (lageCache.has(k)) return lageCache.get(k);
  const sw = S.stunden[standortId];
  const l = sw ? wetterlage(sw, { profil, trachtluecke: standortId ? trachtluecke(standortId) : false }) : null;
  lageCache.set(k, l);
  return l;
}

const grad = (x) => (x == null ? '–' : `${Math.round(x)} °C`);

/** „morgen früh, 9–12 Uhr" */
function fensterText(f) {
  if (!f) return '';
  const tage = diffTage(f.von, heute());
  const tag = tage === 0 ? t2('heute') : tage === 1 ? t2('morgen')
    : f.von.toLocaleDateString(gebietsschema(), { weekday: 'long' });
  const h = f.von.getHours();
  const teil = h < 11 ? t2('früh') : h < 14 ? t2('mittags') : h < 18 ? t2('nachmittags') : t2('abends');
  // Ein sehr langes Fenster als „6–21 Uhr" zu nennen hilft niemandem – dann
  // genügt der Beginn.
  const stunden = Math.round((f.bis - f.von) / 3600e3);
  if (stunden > 5) return t('{tag} {teil}, ab {von} Uhr', { tag, teil, von: h });
  return t('{tag} {teil}, {von}–{bis} Uhr',
    { tag, teil, von: f.von.getHours(), bis: f.bis.getHours() });
}

const eignungMarke = (l) => (l.stufe === 'gut' && l.gereizt
  ? `<span class="eignung gereizt">${esc(t2('gereizt'))}</span>`
  : `<span class="eignung ${l.stufe}">${esc(t2(EIGNUNG[l.stufe]))}</span>`);

/** Eine Zeile Wetter für einen Bienenstand – kompakt, antippbar. */
function wetterZeileHTML(st, { mitName = false } = {}) {
  const l = lage(st.id);
  if (!l) {
    if (st.lat == null) return '';
    return `<div class="wetterzeile"><span class="zeichen">·</span><span class="rest">${
      esc(mitName ? st.name + ' · ' : '')}${
      esc(S.ladeWetter ? t2('Wetter wird geladen …') : t2('Wetter nicht verfügbar'))}</span></div>`;
  }
  const j = l.jetzt;
  const teile = [];
  if (mitName) teile.push(st.name);
  teile.push(t2(l.text));
  if (j.wind != null) teile.push(t2('Wind {n} km/h', { n: Math.round(j.wind) }));
  if (l.tag?.max != null) teile.push(`${Math.round(l.tag.min)}/${Math.round(l.tag.max)} °C`);
  return `<div class="wetterzeile" data-wetter="${st.id}">
    <span class="zeichen">${l.zeichen}</span>
    <span class="grad">${grad(j.temp)}</span>
    <span class="rest">${esc(teile.join(' · '))}</span>
    ${eignungMarke(l)}
    <span class="pfeil">›</span>
  </div>`;
}

/**
 * Überschrift der Wetterlage. Bewusst EIN Satz, der Eignung und Reizlage
 * zusammen bewertet – sonst stünde „das Wetter passt" direkt über „die Bienen
 * sind gereizt", und der Imker müsste sich aussuchen, was gilt.
 */
function lageKopf(l) {
  if (l.stufe === 'schlecht') {
    return l.gereizt ? 'Ungünstig – und die Bienen dürften gereizt sein.'
      : 'Das Wetter passt für diese Arbeit gerade nicht.';
  }
  if (l.gereizt) {
    return l.stufe === 'gut'
      ? 'Das Wetter selbst wäre in Ordnung – die Bienen dürften aber gereizt sein.'
      : 'Nur mäßig geeignet, dazu dürften die Bienen gereizt sein.';
  }
  return l.stufe === 'gut' ? 'Gute Bedingungen für diese Arbeit.'
    : 'Nur mäßig geeignet.';
}

/** Kurzfassung für das Aufgabenkärtchen. */
function lageKurz(l) {
  if (l.stufe === 'schlecht') return t2('Wetter ungünstig');
  if (l.gereizt) return t2('Bienen wahrscheinlich gereizt');
  return t2('Wetter nur mäßig');
}

/** Wetterhinweis zu einer Aufgabe – nur wenn es etwas zu sagen gibt. */
function wetterWink(a) {
  if (!a.wetterbedarf) return null;
  const stId = a.ziel?.standortId;
  if (!stId) return null;
  const l = lage(stId, a.wetterbedarf);
  if (!l) return null;
  if (l.stufe === 'gut' && !l.gereizt) return null;
  return { l, kurz: lageKurz(l) };
}

function wetterWinkHTML(a, { mitName = false } = {}) {
  if (!a || !['faellig', 'ueberfaellig'].includes(a.zustand)) return '';
  const w = wetterWink(a);
  if (!w) return '';
  // Ein besserer Zeitpunkt wird nur genannt, wenn er die Lage auch wirklich
  // verbessert – bei einer Trachtlücke hilft Warten nicht.
  const besser = w.l.bestes ? ' · ' + t2('besser {wann}', { wann: fensterText(w.l.bestes) }) : '';
  const name = mitName ? esc((standortName(a.ziel.standortId) || '') + ': ') : '';
  return `<div class="wetterwink"><span>${w.l.zeichen}</span><span>${name}${esc(w.kurz + besser)}</span></div>`;
}

/** Bei Sammelaufgaben je betroffenem Stand eine Zeile – das Wetter ist örtlich. */
function wetterWinkGruppeHTML(g) {
  const ids = [...new Set(g.map((x) => x.ziel.standortId).filter(Boolean))];
  if (ids.length <= 1) return wetterWinkHTML(g[0]);
  return ids.slice(0, 3)
    .map((id) => wetterWinkHTML(g.find((x) => x.ziel.standortId === id), { mitName: true }))
    .join('');
}

/**
 * Der ausführliche Block. Wird für das Aufgabenfenster und für das Wetterfenster
 * verwendet, damit beide dasselbe sagen.
 */
function lageBlockHTML(l, name = null) {
  const zeilen = [];
  if (name) zeilen.push(`<b>${esc(name)}:</b>`);
  zeilen.push(`<b>${esc(t2(lageKopf(l)))}</b>`);
  // Bei guter Eignung die Einzelabzüge weglassen – sie widersprächen sonst
  // scheinbar der Überschrift.
  if (l.gruende.length && l.stufe !== 'gut') zeilen.push(esc(l.gruende.join(', ') + '.'));
  if (l.gereizt) {
    zeilen.push(esc(t2('Grund für die Reizlage: {gruende}. Ruhig arbeiten, Schleier auf, '
      + 'Rauch bereithalten.', { gruende: l.reizGruende.join(', ') })));
  }
  if (l.bestes) {
    zeilen.push(esc(t2('Günstiger wäre es {wann}.', { wann: fensterText(l.bestes) })));
  } else if (l.gereizt) {
    zeilen.push(esc(t2('Das gibt sich in den nächsten Tagen nicht – kurz arbeiten, nichts offen '
      + 'stehen lassen, keine Waben herumtragen.')));
  }
  return `<div class="wetterhinweis"><span style="font-size:17px">${l.zeichen}</span>
    <span>${zeilen.join(' ')}</span></div>`;
}

function wetterBlockHTML(a, { mitName = false } = {}) {
  if (!a?.wetterbedarf) return '';
  const stId = a.ziel?.standortId;
  const l = stId ? lage(stId, a.wetterbedarf) : null;
  if (!l) return '';
  return lageBlockHTML(l, mitName ? standortName(stId) : null);
}

/** Sammelaufgabe: je betroffenem Stand ein Block. */
function wetterBlockGruppeHTML(g) {
  const ids = [...new Set(g.map((x) => x.ziel.standortId).filter(Boolean))];
  if (ids.length <= 1) return wetterBlockHTML(g[0]);
  return ids.slice(0, 3)
    .map((id) => wetterBlockHTML(g.find((x) => x.ziel.standortId === id), { mitName: true }))
    .join('');
}

/** Alle Bienenstände auf einen Blick – Kopf der Heute-Ansicht. */
function wetterUebersichtHTML() {
  const mit = S.standorte.filter((st) => st.lat != null);
  if (!mit.length) return '';
  const zeilen = mit.map((st) => wetterZeileHTML(st, { mitName: mit.length > 1 }))
    .filter(Boolean).join('');
  if (!zeilen) return '';
  return `<div class="karte" style="margin-bottom:12px">${zeilen}</div>`;
}

function wetterSheet(standortId) {
  const st = S.standorte.find((x) => x.id === standortId);
  const sw = S.stunden[standortId];
  const l = lage(standortId);
  if (!st || !l) { toast('Für diesen Standort liegen keine Wetterdaten vor.'); return; }

  const band = l.stunden.slice(0, 24).map((h) => {
    const p = stundeBewerten(h, 'oeffnen').punkte;
    const d = new Date(h.zeit);
    return `<div class="h"><div>${String(d.getHours()).padStart(2, '0')}</div>
      <div class="z">${wetterZeichenVon(h.code)}</div>
      <b>${Math.round(h.temp)}°</b>
      <div>${h.regenP != null ? h.regenP + '%' : ''}</div>
      <div class="balken ${stufeVon(p)}"></div></div>`;
  }).join('');

  const betroffen = S.plan.filter((x) => x.wetterbedarf && x.ziel.standortId === standortId
    && ['faellig', 'ueberfaellig'].includes(x.zustand));

  sheetAuf({
    titel: t2('Wetter · {ort}', { ort: st.name }),
    unter: t2('{was}, {grad} · Wind {wind} km/h, Böen {boen} km/h',
      { was: t2(l.text), grad: grad(l.jetzt.temp),
        wind: Math.round(l.jetzt.wind ?? 0), boen: Math.round(l.jetzt.boen ?? 0) }),
    inhalt: `
      <div class="stundenband">${band}</div>
      <div class="mini" style="margin:-4px 0 12px">Der Balken zeigt, wie gut sich in dieser Stunde
        am offenen Volk arbeiten lässt: Temperatur, Wind, Niederschlag, Bewölkung und Tageslicht.</div>
      ${lageBlockHTML(l)}
      ${(sw?.tage || []).length ? `<h4 style="margin:14px 0 6px;font-size:14px">Die nächsten Tage</h4>
        <div class="karte" style="box-shadow:none;border:1px solid var(--rand)">
        ${sw.tage.filter((x) => x.datum >= iso(heute())).map((x) => `<div class="wetterzeile">
          <span class="zeichen">${wetterZeichenVon(x.code)}</span>
          <span class="grad">${Math.round(x.max)}°</span>
          <span class="rest">${esc(fmtDatum(x.datum, true))} · ${esc(t2(wetterTextVon(x.code)))}${
            x.regen ? ' · ' + x.regen + ' mm' : ''}</span></div>`).join('')}</div>` : ''}
      ${betroffen.length ? `<h4 style="margin:14px 0 6px;font-size:14px">${
        esc(t2('Betroffene Aufgaben ({n})', { n: betroffen.length }))}</h4>
        <div class="karte" style="box-shadow:none;border:1px solid var(--rand)">
        ${betroffen.map((x) => aufgabeHTML(x, true)).join('')}</div>` : ''}
      <div class="mini" style="margin-top:10px">Quelle: Open-Meteo, stündlich aktualisiert.
        Die Bewertung ist eine Faustregel – der Blick zum Flugloch bleibt die bessere Auskunft.</div>`,
    danach(root) {
      root.querySelectorAll('[data-auf]').forEach((n) => {
        n.addEventListener('click', () => {
          const a = S.plan.find((x) => x.schluessel === n.dataset.auf);
          if (a) { sheetZu(); setTimeout(() => aufgabeOeffnen(a), 60); }
        });
      });
    },
  });
}


// ============================================================ Stand-Modus
// Ein Volk je Bildschirm, große Flächen, sofort gespeichert. Die Bausteine
// liegen in js/stand.js – hier steht nur, was mit dem Zustand der App zu tun hat.

function standStarten(standortId) {
  S.stand = { standortId, i: 0, bilanz: { voelker: 0, aufgaben: 0, neu: 0 }, erfasst: new Set() };
  gehe('stand');
}

/**
 * Waagerechtes Wischen blättert wie die Pfeile. Bewusst mit deutlichem Mindestweg
 * und Vorrang für die Senkrechte: beim Scrollen durch den Kurzbefund darf nicht
 * versehentlich das Volk wechseln.
 */
function wischenVerdrahten() {
  const flaeche = AN;
  let x0 = null; let y0 = null; let gesperrt = false;
  flaeche.addEventListener('touchstart', (e) => {
    if (S.ansicht !== 'stand' || e.touches.length !== 1) { x0 = null; return; }
    // In Eingabefeldern und auf Chips nicht wischen
    gesperrt = !!e.target.closest('input,textarea,select,button,.grobchips');
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  flaeche.addEventListener('touchend', (e) => {
    if (x0 == null || gesperrt || S.ansicht !== 'stand') { x0 = null; return; }
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    standWechseln(dx < 0 ? 1 : -1);
  });
}

function ansichtStand() {
  const stand = S.standorte.find((x) => x.id === S.stand?.standortId);
  if (!stand) return `<div class="karte"><div class="karte-inhalt leer">
    ${t2('Kein Bienenstand ausgewählt.')}</div></div>`;
  const liste = standVoelker(S, stand.id);
  if (!liste.length) {
    return `<div class="karte"><div class="karte-inhalt leer"><span class="gross">🗂</span>
      ${t2('An diesem Bienenstand steht noch kein Volk.')}
      <div class="knopfreihe" style="margin-top:16px">
        <button class="knopf" data-neu-volk>Volk anlegen</button></div></div></div>`;
  }
  if (S.stand.i >= liste.length) return abschlussSchritt(S, stand, S.stand.bilanz);
  return volkSchritt(S, liste[S.stand.i], stand, S.stand.i + 1, liste.length);
}

/** Was gerade auf dem Bildschirm eingetragen ist. */
function standSammeln(ohneBefund = false) {
  const werte = grobWerteLesen(AN);
  if (ohneBefund) {
    for (const [k, v] of Object.entries(OHNE_BEFUND)) if (werte[k] == null) werte[k] = v;
  }
  const abgehakt = [...AN.querySelectorAll('.standaufgabe.an')]
    .map((el) => S.plan.find((a) => a.schluessel === el.dataset.saufgabe))
    .filter(Boolean);
  return { werte, abgehakt };
}

/**
 * Den aktuellen Schritt festschreiben. Wird auch beim Blättern aufgerufen –
 * niemand soll Eingaben verlieren, nur weil er den Pfeil statt des Knopfes trifft.
 */
async function standSpeichern({ ohneBefund = false } = {}) {
  const stand = S.standorte.find((x) => x.id === S.stand?.standortId);
  if (!stand) return { leer: true };
  const liste = standVoelker(S, stand.id);
  const volk = liste[S.stand.i];
  const { werte, abgehakt } = standSammeln(ohneBefund && !!volk);
  const bilder = fotoPuffer.length;
  if (!Object.keys(werte).length && !abgehakt.length && !bilder) return { leer: true };

  try {
    if (volk) {
      const b = await schrittSpeichern({
        S, volk, werte, abgehakt, fotosAblegen: fotoPufferSpeichern, hatFotos: bilder > 0,
      });
      if (b.durchsicht) S.stand.erfasst.add(volk.id);
      S.stand.bilanz.voelker = S.stand.erfasst.size;
      S.stand.bilanz.aufgaben += b.aufgaben;
      S.stand.bilanz.neu += b.neu;
    } else {
      // Abschlussseite: dort hängen nur noch die Aufgaben des Standes selbst
      for (const a of abgehakt) {
        await db.schreibe('erledigungen', {
          id: uid(), regelId: a.regelId, zielTyp: a.ziel.typ, zielId: a.ziel.id,
          datum: iso(heute()), status: 'erledigt', daten: {},
          jahr: heute().getFullYear(),
        });
        S.stand.bilanz.aufgaben += 1;
      }
    }
    await datenLaden();
    return { leer: false };
  } catch (e) {
    fehlerZeigen('Durchgang speichern', e);
    return { fehler: true };
  }
}

function standBlaettern(richtung) {
  fotoPufferLeeren();     // nicht gespeicherte Bilder gehören nicht zum nächsten Volk
  const stand = S.standorte.find((x) => x.id === S.stand?.standortId);
  const liste = stand ? standVoelker(S, stand.id) : [];
  S.stand.i = Math.max(0, Math.min(liste.length, S.stand.i + richtung));
  render();
  window.scrollTo(0, 0);
}

/** Pfeiltasten: erst sichern, dann blättern. */
async function standWechseln(richtung) {
  await standSpeichern();
  standBlaettern(richtung);
}

async function standWeiter({ ohneBefund = false } = {}) {
  const r = await standSpeichern({ ohneBefund });
  if (r.fehler) return;
  if (r.leer && !ohneBefund) toast('Nichts eingetragen – trotzdem weiter.');
  standBlaettern(1);
}

async function standBeenden() {
  const r = await standSpeichern();
  const b = S.stand?.bilanz || { voelker: 0, aufgaben: 0, neu: 0 };
  gehe('heute');
  if (!r.fehler) {
    toast(b.voelker || b.aufgaben
      ? t('Durchgang gespeichert: {v} Völker, {a} Aufgaben.', { v: b.voelker, a: b.aufgaben })
      : 'Durchgang beendet.');
  }
}

/** Auswahl des Bienenstandes – entfällt, wenn es nur einen gibt. */
function standWaehlen() {
  const mitVoelkern = S.standorte.filter((st) => standVoelker(S, st.id).length);
  if (!mitVoelkern.length) return toast('Erst Völker anlegen.');
  if (mitVoelkern.length === 1) return standStarten(mitVoelkern[0].id);
  sheetAuf({
    titel: 'Durchgang starten',
    unter: 'An welchem Bienenstand stehst du?',
    inhalt: `<div class="standwahl">${mitVoelkern.map((st) => {
      const n = standVoelker(S, st.id).length;
      const offen = S.plan.filter((a) => a.ziel.standortId === st.id
        && ['faellig', 'ueberfaellig'].includes(a.zustand)).length;
      return `<button class="knopf leise gross" data-swahl="${st.id}">
        <b>${esc(st.name)}</b><small>${esc(t2('{n} Völker', { n }))}${offen
        ? ' · ' + esc(t2('{n} offen', { n: offen })) : ''}</small></button>`;
    }).join('')}</div>`,
    danach(root) {
      root.querySelectorAll('[data-swahl]').forEach((b) => {
        b.onclick = () => { sheetZu(); standStarten(b.dataset.swahl); };
      });
    },
  });
}

// ---------------------------------------------------------------- Kalender

/**
 * Der eine Tag, an dem eine offene Aufgabe im Kalender steht.
 * Bewusst nicht das ganze Zeitfenster: sonst klebt jede offene Aufgabe an jedem
 * Tag und der Monat ist zugepflastert. Stattdessen der nächste Arbeitstag –
 * frühestens morgen, denn der heutige Tag läuft schon. Wird die Aufgabe nicht
 * erledigt, wandert sie von selbst einen Tag weiter, weil sich „morgen" jeden
 * Tag neu berechnet.
 */
function aktionstag(a) {
  const von = a.von || a.bis;
  if (!von) return null;
  const morgen = addDays(heute(), 1);
  return von > morgen ? von : morgen;
}

function ansichtKalender() {
  const jahr = S.monat.getFullYear(); const monat = S.monat.getMonth();
  const erster = new Date(jahr, monat, 1);
  const versatz = (erster.getDay() + 6) % 7;          // Woche beginnt am Montag
  const tage = new Date(jahr, monat + 1, 0).getDate();
  const liste = gefiltert(offeneAufgaben());

  const proTag = new Map();
  for (const a of liste) {
    const d = aktionstag(a);
    if (!d || d.getMonth() !== monat || d.getFullYear() !== jahr) continue;
    const k = d.getDate();
    if (!proTag.has(k)) proTag.set(k, []);
    proTag.get(k).push(a);
  }

  const rang = { ueberfaellig: 0, faellig: 1, bald: 2, wartet: 3 };
  let zellen = '';
  for (let i = 0; i < versatz; i++) zellen += '<div class="tag leer"></div>';
  for (let d = 1; d <= tage; d++) {
    const datum = iso(new Date(jahr, monat, d));
    const eintraege = (proTag.get(d) || []).slice().sort((a, b) => rang[a.zustand] - rang[b.zustand]);
    zellen += `<div class="tag${datum === iso(heute()) ? ' heute' : ''}${S.tag === datum ? ' gewaehlt' : ''}"
      data-tag="${datum}">
      <span class="zahl">${d}</span>
      ${eintraege.length ? `<span class="anz b-${streifen(eintraege[0].zustand)}">${eintraege.length}</span>` : ''}
    </div>`;
  }

  const gewaehlt = S.tag ? liste.filter((a) => {
    const d = aktionstag(a);
    return d && iso(d) === S.tag;
  }) : [];

  return `
    ${filterLeiste()}
    <div class="karte"><div class="karte-inhalt">
      <div class="monatskopf">
        <button data-monat="-1" aria-label="zurück">‹</button>
        <b>${MON_LANG[monat]} ${jahr}</b>
        <button data-monat="1" aria-label="vor">›</button>
      </div>
      <div class="wochentage">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="monat">${zellen}</div>
      <div class="mini" style="margin-top:8px">Jede offene Aufgabe steht genau einmal im Kalender:
        an ihrem nächsten Arbeitstag. Bleibt sie liegen, rückt sie mit jedem vergangenen Tag
        einen Tag weiter. Tippen für die Liste.</div>
    </div></div>
    ${S.tag ? `<h2 class="abschnitt">${fmtDatum(parseISO(S.tag), true)} · ${gewaehlt.length}</h2>
      <div class="karte">${gewaehlt.length
        ? gewaehlt.map((a) => aufgabeHTML(a, true)).join('')
        : '<div class="karte-inhalt leer" style="padding:20px">Nichts an diesem Tag.</div>'}</div>` : ''}
    <div class="knopfreihe"><button class="knopf leise" data-ics>Offene Aufgaben exportieren (.ics)</button></div>`;
}

// ------------------------------------------------------------------ Völker

function ansichtVoelker() {
  if (!S.voelker.length) {
    return `<div class="karte"><div class="karte-inhalt leer"><span class="gross">🗂</span>
      ${S.standorte.length ? t2('Noch keine Völker angelegt.')
        : t2('Zuerst einen Bienenstand anlegen – aus seiner Lage rechnet BeeWise Tracht und Termine.')}
      <div class="knopfreihe" style="margin-top:16px">
        ${S.standorte.length ? '<button class="knopf" data-neu-volk>Volk anlegen</button>' : ''}
        <button class="knopf${S.standorte.length ? ' leise' : ''}" data-neu-standort-hier>Bienenstand anlegen</button>
      </div></div></div>`;
  }
  const t = [];
  for (const st of S.standorte) {
    const liste = S.voelker.filter((v) => v.standortId === st.id);
    if (!liste.length) continue;
    t.push(`<h2 class="abschnitt">${esc(st.name)} · ${t2('{n} Völker', { n: liste.length })}</h2><div class="karte">`);
    for (const v of liste) {
      const offen = S.plan.filter((a) => a.ziel.id === v.id
        && ['ueberfaellig', 'faellig'].includes(a.zustand)).length;
      const letzte = letzteDurchsicht(v.id);
      t.push(`<div class="volkzeile" data-volk="${v.id}">
        ${bildFuerVolk(v, st, 52)}
        <div class="info">
          <b>${esc(v.name)}</b>
          <div>${koe.jahrgang(S, v) ? `<i class="koenigin" style="background:${koe.zeichenFarbe(koe.jahrgang(S, v))}"></i>${esc(koe.jahrgang(S, v))} · ` : ''}${letzte ? t2('Durchsicht {d}', { d: fmtDatum(letzte.datum) }) : t2('noch keine Durchsicht')}</div>
        </div>
        ${offen ? `<span class="marke" style="background:#F3DAD5;color:#8E2E22">${t2('{n} offen', { n: offen })}</span>` : ''}
        <span class="pfeil">›</span></div>`);
    }
    t.push(wetterZeileHTML(st));
    t.push('</div>');
    t.push(`<div class="knopfreihe" style="margin-top:-4px">
      <button class="knopf leise klein" data-standmodus="${st.id}">${
      esc(t2('Durchgang an diesem Stand'))}</button>
      <button class="knopf leise klein" data-stand-bearbeiten="${st.id}">${
      esc(t2('Stand bearbeiten'))}</button></div>`);
  }
  const ohne = S.voelker.filter((v) => !S.standorte.some((s) => s.id === v.standortId));
  if (ohne.length) {
    t.push('<h2 class="abschnitt">Ohne Standort</h2><div class="karte">'
      + ohne.map((v) => `<div class="volkzeile" data-volk="${v.id}">
        <div class="luftbild leer" style="width:52px;height:52px;border-radius:10px"></div>
        <div class="info"><b>${esc(v.name)}</b></div><span class="pfeil">›</span></div>`).join('') + '</div>');
  }
  t.push(`<div class="knopfreihe">
    <button class="knopf" data-neu-volk>Volk anlegen</button>
    <button class="knopf leise" data-neu-standort-hier>Bienenstand anlegen</button>
  </div>`);
  return t.join('');
}

const standortName = (id) => S.standorte.find((s) => s.id === id)?.name || null;
// Achtung: nicht `volkName` – so heißt schon ein Helfer in js/berichte.js, und in
// der Einzeldatei teilen sich alle Module einen Namensraum.
const volkNameVon = (id) => S.voelker.find((v) => v.id === id)?.name || '?';

const letzteDurchsicht = (volkId) => S.durchsichten.filter((d) => d.volkId === volkId)
  .sort((a, b) => (a.datum < b.datum ? 1 : -1))[0];

/** Eigenes Foto, sonst Luftbild des Standortes, sonst grauer Platzhalter. */
function bildFuerVolk(v, st, groesse = 52) {
  if (v.foto) {
    return `<img class="luftbild" src="${v.foto}" alt=""
      style="width:${groesse}px;height:${groesse}px;border-radius:10px;object-fit:cover">`;
  }
  return statischesLuftbild(st?.lat, st?.lon, { w: groesse, h: groesse, z: 17, radius: 10 });
}

// Farbcode und Jahrgang kommen aus js/koeniginnen.js – dort liegt auch die Historie.

function ansichtVolk() {
  const v = S.voelker.find((x) => x.id === S.volkId);
  if (!v) return '<div class="leer">Volk nicht gefunden.</div>';
  const st = S.standorte.find((s) => s.id === v.standortId);
  const aufgaben = S.plan.filter((a) => a.ziel.id === v.id
    && ['ueberfaellig', 'faellig', 'bald', 'wartet'].includes(a.zustand));

  const ereignisse = [
    ...S.durchsichten.filter((d) => d.volkId === v.id).map((d) => ({
      datum: d.datum, titel: t2('Durchsicht'), notiz: durchsichtKurz(d), id: d.id, art: 'durchsicht',
    })),
    ...S.erledigungen.filter((e) => e.zielId === v.id).map((e) => ({
      datum: e.datum, titel: t2(regelNach(e.regelId)?.titel) || e.regelId,
      notiz: datenKurz(e.daten, e.regelId) + (e.status === 'uebersprungen' ? ' (übersprungen)' : ''),
      id: e.id, art: 'erledigung',
    })),
    ...S.wanderungen.filter((w) => w.volkId === v.id).map((w) => ({
      datum: w.datum, titel: t2('Umzug / Wanderung'),
      notiz: `${standortName(w.vonStandortId) || w.vonName || '?'} → `
        + `${standortName(w.nachStandortId) || w.nachName || '?'}${w.notiz ? ' · ' + w.notiz : ''}`,
      id: w.id, art: 'wanderung',
    })),
    ...koe.alleVomVolk(S, v.id).map((k) => ({
      datum: k.seit, titel: t2('Königin {jahr} eingesetzt', { jahr: k.jahr }),
      notiz: [t2(k.herkunft), k.rasse, k.zuechter,
        k.mutterVolkId ? t2('von Volk {name}', { name: volkNameVon(k.mutterVolkId) }) : '',
        k.notiz].filter(Boolean).join(' · '),
      id: k.id, art: 'koenigin',
    })),
    ...koe.alleVomVolk(S, v.id).filter((k) => k.bis).map((k) => ({
      datum: k.bis, titel: t2('Königin {jahr} beendet: {grund}', { jahr: k.jahr, grund: t2(k.grund) }),
      notiz: '', id: k.id, art: 'koenigin',
    })),
  ].sort((a, b) => (a.datum < b.datum ? 1 : -1));

  return `
  <div class="karte"><div class="karte-inhalt">
    <div style="display:flex;gap:12px;align-items:center">
      <button class="bildknopf" data-foto="${v.id}">${bildFuerVolk(v, st, 64)}
        <span class="bildstift">✎</span></button>
      <div style="flex:1;min-width:0">
        <div style="font-size:18px;font-weight:650">${esc(v.name)}</div>
        <div class="mini">${esc(st?.name || 'ohne Standort')}${v.beute ? ' · ' + esc(v.beute) : ''}${v.zargen ? ' · ' + esc(v.zargen) + ' Zargen' : ''}</div>
        ${koe.istJungvolk(v) ? `<div class="mini">${esc(t2('Jungvolk {jahr}', { jahr: parseISO(v.gebildetAm).getFullYear() }))}${
          v.mutterVolkId ? ' · ' + esc(t2('von Volk {name}', { name: volkNameVon(v.mutterVolkId) })) : ''}</div>` : ''}
      </div>
    </div>
    <div class="knopfreihe">
      <button class="knopf" data-durchsicht="${v.id}">Durchsicht erfassen</button>
      <button class="knopf leise klein" data-volk-bearbeiten="${v.id}">Bearbeiten</button>
    </div>
    <div class="knopfreihe">
      <button class="knopf leise klein" data-umzug="${v.id}">Umziehen / wandern</button>
      <button class="knopf leise klein" data-volk-pdf="${v.id}">Stockkarte als PDF</button>
    </div>
  </div></div>

  ${koeniginKarteHTML(v)}

  ${aufgaben.length ? `<h2 class="abschnitt">Anstehend</h2><div class="karte">
    ${aufgaben.map((a) => aufgabeHTML(a, true)).join('')}</div>` : ''}

  ${historieHTML(v)}

  <h2 class="abschnitt">Verlauf</h2>
  <div class="karte"><div class="karte-inhalt">
    ${ereignisse.length ? `<div class="zeitstrahl">${ereignisse.slice(0, 60).map((e) => `
      <div class="e" data-eintrag="${e.art}:${e.id}">
        <div class="d">${fmtDatum(e.datum, true)}</div>
        <div class="t">${esc(e.titel)}</div>
        ${e.notiz ? `<div class="n">${esc(e.notiz)}</div>` : ''}
        ${e.art === 'durchsicht' ? `<div class="fotoleiste" data-fotos="${e.id}"></div>` : ''}
      </div>`).join('')}</div>`
      : '<div class="leer" style="padding:16px">Noch nichts erfasst.</div>'}
  </div></div>`;
}

/** Jahresbilanz je Saison: Ernte, Behandlungen, Durchsichten, Stärke. */
function historieHTML(v) {
  const jahre = new Map();
  const holen = (j) => {
    if (!jahre.has(j)) jahre.set(j, { ernte: 0, ernten: 0, behandlungen: 0, durchsichten: 0, gassen: [] });
    return jahre.get(j);
  };
  for (const e of S.erledigungen.filter((x) => x.zielId === v.id && x.status !== 'uebersprungen')) {
    const b = holen(parseISO(e.datum).getFullYear());
    if (['fruehtracht', 'sommertracht'].includes(e.regelId) && e.daten?.kg) {
      b.ernte += Number(e.daten.kg); b.ernten += 1;
    }
    if (['sommerbehandlung1', 'sommerbehandlung2', 'restentmilbung'].includes(e.regelId)) b.behandlungen += 1;
    if (e.daten?.gassen) b.gassen.push({ datum: e.datum, wert: Number(e.daten.gassen) });
  }
  for (const d of S.durchsichten.filter((x) => x.volkId === v.id)) {
    const b = holen(parseISO(d.datum).getFullYear());
    b.durchsichten += 1;
    if (d.wabengassen) b.gassen.push({ datum: d.datum, wert: Number(d.wabengassen) });
  }
  if (!jahre.size) return '';

  const jetzt = new Date().getFullYear();
  const punkte = (jahre.get(jetzt)?.gassen || []).sort((a, b) => (a.datum < b.datum ? -1 : 1));
  const reihen = [...jahre.entries()].sort((a, b) => b[0] - a[0]).map(([j, b]) => `
    <tr><td><b>${j}</b></td>
      <td>${b.ernte ? String(b.ernte.toFixed(1)).replace('.', ',') + ' kg' : '–'}${b.ernten > 1 ? ` <span class="mini">(${b.ernten}×)</span>` : ''}</td>
      <td>${b.behandlungen || '–'}</td>
      <td>${b.durchsichten || '–'}</td>
      <td>${b.gassen.length ? Math.max(...b.gassen.map((g) => g.wert)) : '–'}</td></tr>`).join('');

  return `<h2 class="abschnitt">Historie</h2>
  <div class="karte"><div class="karte-inhalt">
    <table class="bilanz">
      <thead><tr><th>Saison</th><th>Ernte</th><th>Behandl.</th><th>Durchs.</th><th>max. Gassen</th></tr></thead>
      <tbody>${reihen}</tbody>
    </table>
    ${punkte.length > 1 ? `<div class="mini" style="margin-top:12px">${t2('Volksstärke {jahr} – besetzte Wabengassen', { jahr: jetzt })}</div>${sparkline(punkte)}` : ''}
  </div></div>`;
}

function sparkline(punkte) {
  const w = 300; const h = 54;
  const max = Math.max(...punkte.map((p) => p.wert), 12);
  const t0 = parseISO(punkte[0].datum).getTime();
  const t1 = Math.max(parseISO(punkte[punkte.length - 1].datum).getTime(), t0 + 86400000);
  const xy = punkte.map((p) => [
    ((parseISO(p.datum).getTime() - t0) / (t1 - t0)) * (w - 8) + 4,
    h - 6 - (p.wert / max) * (h - 18),
  ]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px">
    <path d="${d}" fill="none" stroke="var(--honig)" stroke-width="2" stroke-linejoin="round"/>
    ${xy.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="var(--honig)"/>`).join('')}
    <text x="4" y="11" font-size="9" fill="var(--text-zart)">max ${max}</text>
  </svg>`;
}

const durchsichtKurz = (d) => [
  d.wabengassen ? t2('{n} Gassen', { n: d.wabengassen }) : null,
  d.brut ? d.brut.split(', ').map((x) => t2(x)).join(', ') : null,
  d.koenigin ? d.koenigin.split(', ').map((x) => t2(x)).join(', ') : null,
  d.zellen ? t2('{n} Weiselzellen', { n: d.zellen }) : null,
  d.futter ? t2('{n} kg Futter', { n: d.futter }) : null,
  d.milbenProTag ? t2('{n} Milben/Tag', { n: d.milbenProTag }) : null,
  d.notiz,
].filter(Boolean).join(' · ');

let _feldLabel = null;
function feldLabel() {
  if (_feldLabel) return _feldLabel;
  _feldLabel = {};
  for (const r of REGELN) for (const f of r.felder || []) _feldLabel[f.key] = f.label;
  for (const f of DURCHSICHT_FELDER) _feldLabel[f.key] = f.label;
  return _feldLabel;
}

const datenKurz = (d, regelId) => {
  const felder = regelNach(regelId)?.felder || [];
  const label = (k) => felder.find((f) => f.key === k)?.label || feldLabel()[k] || k;
  const einheit = (k) => (felder.find((f) => f.key === k)?.einheit || '').split(' ')[0];
  return Object.entries(d || {})
    .filter(([k]) => k !== 'notiz')
    .map(([k, val]) => `${t2(label(k))}: ${val}${einheit(k) ? ' ' + t2(einheit(k)) : ''}`)
    .concat(d?.notiz ? [d.notiz] : []).join(' · ');
};


// ------------------------------------------------------------- Königinnen

/** Karte im Volk: wer sitzt drin, seit wann, woher – und die Vorgängerinnen. */
function koeniginKarteHTML(v) {
  const jetzt = koe.aktuelle(S, v.id);
  const frueher = koe.alleVomVolk(S, v.id).filter((k) => k.bis);
  const jahr = koe.jahrgang(S, v);
  const j = koe.alter(jahr);

  if (!jetzt) {
    return `<h2 class="abschnitt">Königin</h2>
    <div class="karte"><div class="karte-inhalt">
      <div class="mini">${jahr
        ? esc(t2('Bisher ist nur der Jahrgang {jahr} vermerkt. Erfasse die Königin, dann führt '
          + 'BeeWise Alter, Herkunft und Abstammung mit – und meldet sich, wenn Umweiseln ansteht.',
        { jahr }))
        : esc(t2('Noch keine Königin erfasst.'))}</div>
      <div class="knopfreihe">
        <button class="knopf leise" data-koe-neu="${v.id}">${esc(t2('Königin erfassen'))}</button>
      </div>
    </div></div>`;
  }

  const zeile = (schluessel, wert) => (wert
    ? `<div class="kzeile"><span>${esc(t2(schluessel))}</span><b>${esc(wert)}</b></div>` : '');

  return `<h2 class="abschnitt">Königin</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="koekopf">
      <i class="koeniginGross" style="background:${koe.zeichenFarbe(jetzt.jahr)}"></i>
      <div>
        <b>${esc(t2('Jahrgang {jahr}', { jahr: jetzt.jahr }))}</b>
        <div class="mini">${esc(t2('Zeichenfarbe {farbe}', { farbe: t2(koe.zeichenName(jetzt.jahr)) }))}
          · ${esc(j === 0 ? t2('dieses Jahr') : j === 1 ? t2('zweite Saison')
            : t2('{n}. Saison', { n: j + 1 }))}</div>
      </div>
      ${j >= 2 ? `<span class="marke wichtig">${esc(t2('Umweiseln prüfen'))}</span>` : ''}
    </div>
    ${zeile('Herkunft', t2(jetzt.herkunft))}
    ${zeile('Rasse', jetzt.rasse)}
    ${zeile('Züchter oder Belegstelle', jetzt.zuechter)}
    ${zeile('Muttervolk', jetzt.mutterVolkId ? volkNameVon(jetzt.mutterVolkId) : '')}
    ${zeile('Im Volk seit', fmtDatum(jetzt.seit))}
    ${jetzt.notiz ? `<div class="mini" style="margin-top:6px">${esc(jetzt.notiz)}</div>` : ''}
    <div class="knopfreihe">
      <button class="knopf leise klein" data-koe-bearbeiten="${jetzt.id}">Bearbeiten</button>
      <button class="knopf leise klein" data-koe-umweiseln="${v.id}">${esc(t2('Umweiseln'))}</button>
    </div>
    ${frueher.length ? `<div class="mini" style="margin-top:10px">${esc(t2('Vorgängerinnen'))}:
      ${frueher.map((k) => esc(`${k.jahr} (${fmtDatum(k.seit)}–${fmtDatum(k.bis)}, ${t2(k.grund || '')})`)).join(' · ')}</div>` : ''}
  </div></div>`;
}

const KOE_FELDER = (k = null, jahre = []) => [
  { key: 'jahr', label: 'Jahrgang', typ: 'auswahl', optionen: jahre,
    hinweis: 'Bestimmt die Zeichenfarbe nach dem internationalen Code.' },
  { key: 'herkunft', label: 'Herkunft', typ: 'auswahl', optionen: koe.HERKUNFT },
  { key: 'rasse', label: 'Rasse', typ: 'auswahl', optionen: koe.RASSEN },
  { key: 'zuechter', label: 'Züchter oder Belegstelle', platzhalter: 'Name, Nummer, Linie' },
  { key: 'notiz', label: 'Notiz' },
];

function koeniginSheet(volkId, vorhanden = null) {
  const v = S.voelker.find((x) => x.id === volkId) || S.voelker.find((x) => x.id === vorhanden?.volkId);
  if (!v) return;
  const jetztJahr = new Date().getFullYear();
  const jahre = [jetztJahr, jetztJahr - 1, jetztJahr - 2, jetztJahr - 3, jetztJahr - 4].map(String);
  const k = vorhanden;
  const andere = S.voelker.filter((x) => x.id !== v.id);

  sheetAuf({
    titel: k ? 'Königin bearbeiten' : 'Königin erfassen',
    unter: v.name,
    inhalt: `
      ${KOE_FELDER(k, jahre).map((f) => feldHTML(f, k ? k[f.key] : (f.key === 'jahr'
        ? (v.koeniginJahr || String(jetztJahr)) : ''))).join('')}
      <label class="feld" data-key="mutterVolkId" data-typ="wert"><span>Muttervolk (Abstammung)</span>
        <select><option value="">${esc(t2('unbekannt'))}</option>
        ${andere.map((x) => `<option value="${x.id}"${k?.mutterVolkId === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}
        </select></label>
      ${feldHTML({ key: 'seit', label: 'Im Volk seit', typ: 'datum' }, k?.seit || iso(heute()))}
      <div class="knopfreihe">
        ${k ? '<button class="knopf gefahr" data-del>Löschen</button>' : ''}
        <button class="knopf" data-ok>Speichern</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root);
      root.querySelector('[data-ok]').onclick = async () => {
        const w = werteLesen(root);
        const mutter = root.querySelector('[data-key=mutterVolkId] select').value || null;
        if (k) {
          await db.schreibe('koeniginnen', { ...k, ...w, mutterVolkId: mutter });
          const volk = S.voelker.find((x) => x.id === k.volkId);
          if (volk && !k.bis) await db.schreibe('voelker', { ...volk, koeniginJahr: w.jahr || k.jahr });
        } else {
          await koe.anlegen({ volkId: v.id, ...w, mutterVolkId: mutter });
        }
        sheetZu(); await datenLaden(); render(); toast('Königin gespeichert.');
      };
      root.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (!await bestaetige('Diesen Königinnen-Eintrag löschen?')) return;
        await db.loesche('koeniginnen', k.id);
        sheetZu(); await datenLaden(); render(); toast('Eintrag gelöscht.');
      });
    },
  });
}

/** Umweiseln: alte Königin abschließen, neue eintragen – in einem Gang. */
function umweiselnSheet(volkId) {
  const v = S.voelker.find((x) => x.id === volkId);
  const alt = koe.aktuelle(S, volkId);
  const jetztJahr = new Date().getFullYear();
  sheetAuf({
    titel: 'Umweiseln',
    unter: `${v.name}${alt ? ' · ' + t2('bisher Jahrgang {jahr}', { jahr: alt.jahr }) : ''}`,
    inhalt: `
      <div class="hinweis">Die alte Königin wird mit Datum und Grund abgeschlossen und bleibt im
        Verlauf stehen. Die neue kommt als eigener Eintrag dazu – so bleibt die Reihe
        nachvollziehbar. Nach etwa drei Wochen prüfen, ob die neue Königin legt.</div>
      ${feldHTML({ key: 'grund', label: 'Was ist mit der alten Königin', typ: 'auswahl',
        optionen: koe.ENDE_GRUND }, 'umgeweiselt')}
      ${feldHTML({ key: 'datum', label: 'Datum', typ: 'datum' }, iso(heute()))}
      <div class="trenner"></div>
      <div class="mini" style="margin-bottom:8px">${esc(t2('Die neue Königin'))}</div>
      ${feldHTML({ key: 'jahr', label: 'Jahrgang', typ: 'auswahl',
        optionen: [jetztJahr, jetztJahr - 1].map(String) }, String(jetztJahr))}
      ${feldHTML({ key: 'herkunft', label: 'Herkunft', typ: 'auswahl', optionen: koe.HERKUNFT },
        'Standbegattung')}
      ${feldHTML({ key: 'rasse', label: 'Rasse', typ: 'auswahl', optionen: koe.RASSEN }, alt?.rasse || '')}
      ${feldHTML({ key: 'zuechter', label: 'Züchter oder Belegstelle' })}
      ${feldHTML({ key: 'notiz', label: 'Notiz' })}
      <div class="knopfreihe">
        <button class="knopf leise" data-nurende>${esc(t2('Nur alte beenden'))}</button>
        <button class="knopf" data-ok>${esc(t2('Umweiseln eintragen'))}</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root);
      const lauf = async (mitNeuer) => {
        const w = werteLesen(root);
        await koe.umweiseln({
          volkId, alteId: alt?.id, grund: w.grund, datum: w.datum || iso(heute()),
          neue: mitNeuer ? {
            jahr: w.jahr, herkunft: w.herkunft, rasse: w.rasse, zuechter: w.zuechter, notiz: w.notiz,
          } : null,
        });
        if (mitNeuer) {
          await eigeneAnlegen({
            titel: t('Legebeginn prüfen ({volk})', { volk: v.name }),
            info: t('Etwa drei Wochen nach dem Umweiseln: legt die neue Königin? Sonst Weiselprobe '
              + 'mit offener Brut aus einem anderen Volk.'),
            kategorie: 'koenigin', wichtig: true,
            von: iso(addDays(parseISO(w.datum || iso(heute())), 18)),
            bis: iso(addDays(parseISO(w.datum || iso(heute())), 32)),
            ziele: [{ typ: 'volk', id: volkId, name: v.name }],
          });
        }
        sheetZu(); await datenLaden(); render();
        toast(mitNeuer ? 'Umweiselung eingetragen.' : 'Königin beendet.');
      };
      root.querySelector('[data-ok]').onclick = () => lauf(true);
      root.querySelector('[data-nurende]').onclick = () => lauf(false);
    },
  });
}

// ------------------------------------------------------------------ Tracht

/**
 * Wie sieht der Pollen dieser Art in der Zelle aus?
 * Fotos einzelner Pollenfarben in der Wabe gibt es frei lizenziert praktisch
 * nicht – und ein falsch zugeordnetes Foto wäre schlimmer als keines. Deshalb
 * der Farbwert aus den Bestimmungstafeln plus eine Beschreibung zum Wiedererkennen.
 */
function pollenHTML(meta) {
  if (!meta) return '';
  if (!meta.pollen) {
    return `<div class="pollenzeile"><span class="pollenklecks leer"></span>
      <div><b>${esc(t2('Pollen'))}:</b> ${esc(t2('kein Pollen – Honigtau wird von Läusen '
      + 'abgegeben und nur als Nektar eingetragen.'))}</div></div>`;
  }
  return `<div class="pollenzeile">
    <span class="pollenklecks" style="background:${meta.pollen.farbe}"></span>
    <div><b>${esc(t2('Pollen in der Zelle'))}:</b> ${esc(t2(meta.pollen.text))}</div>
  </div>`;
}

function ansichtTracht() {
  if (!S.standorte.length) return '<div class="leer">Erst einen Standort anlegen.</div>';
  const t = [];
  for (const st of S.standorte) {
    const tr = S.tracht[st.id];
    const auf = S.offen['tracht:' + st.id] ?? (S.standorte.length === 1);
    const bluehen = tr ? tr.arten.filter((a) => a.status === 'blueht').map((a) => a.name) : [];
    t.push(`<div class="karte">
      <div class="klapper" data-klapp="tracht:${st.id}">
        <span><b>${esc(st.name)}</b>${bluehen.length ? `<br><small class="mini">${t2('blüht: {liste}', { liste: esc(bluehen.slice(0, 3).map((x) => t2(x)).join(', ')) })}${bluehen.length > 3 ? ' …' : ''}</small>` : ''}</span>
        <span class="pfeil">${auf ? '⌄' : '›'}</span></div>`);
    if (auf) {
      if (!tr) t.push('<div class="karte-inhalt mini">Wird geladen …</div>');
      else {
        const quelle = !tr.modellAktiv
          ? t2('Kalendermittel – keine Wetterdaten verfügbar, Werte sind grob')
          : tr.verschiebung == null ? t2('Wärmesummen-Modell für diesen Standort')
            : tr.verschiebung === 0 ? t2('Wärmesummen-Modell · Jahr liegt im langjährigen Mittel')
              : tr.verschiebung > 0
                ? t2('Wärmesummen-Modell · Jahr liegt {n} Tage vor dem langjährigen Mittel', { n: tr.verschiebung })
                : t2('Wärmesummen-Modell · Jahr liegt {n} Tage hinter dem langjährigen Mittel', { n: -tr.verschiebung });
        t.push(`<div class="karte-inhalt" style="padding:8px 14px 4px;border-top:1px solid var(--rand)">
          <div class="mini">${esc(quelle)}</div></div>`);
        const rang = { blueht: 0, bevorstehend: 1, spaeter: 2, vorbei: 3 };
        for (const a of [...tr.arten].sort((x, y) => (rang[x.status] - rang[y.status])
          || ((x.start || 0) - (y.start || 0)))) {
          const farbe = { blueht: 'var(--ok)', bevorstehend: 'var(--faellig)' }[a.status] || 'var(--text-zart)';
          const txt = a.status === 'blueht' ? t2('blüht seit {d}', { d: fmtDatum(a.start) })
            : a.status === 'bevorstehend' ? t2('erwartet {d} · {rel}', { d: fmtDatum(a.start), rel: fmtRelativ(a.start) })
              : a.status === 'vorbei' ? t2('vorbei seit {d}', { d: fmtDatum(a.ende) })
                : `${fmtDatum(a.start)} – ${fmtDatum(a.ende)}`;
          const qm = a.bestaetigt ? t2('von dir bestätigt')
            : a.quelle === 'modell-kalibriert' ? t2('Modell, kalibriert an {n} Beobachtungen', { n: a.kalibriertAus })
              : a.quelle === 'modell' ? (a.prognose ? t2('Prognose') : t2('Modell'))
                : a.quelle === 'erfahrung' ? t2('Erfahrungswert') : t2('Kalender');
          const offenId = `art:${st.id}:${a.art}`;
          const offen = !!S.offen[offenId];
          const meta = ARTEN.find((x) => x.id === a.art);
          t.push(`<div class="trachtzeile" data-klapp="${offenId}">
            <i class="punkt" style="background:${farbe};width:10px;height:10px"></i>
            <img class="trachtthumb" data-bild-klein="${a.art}"
              src="${platzhalter(a.name)}" alt="">
            <div class="name"><b style="font-weight:600">${esc(t2(a.name))}</b>
              <small>${esc(txt)} · ${esc(qm)}${a.unsicher ? ' · ' + t2('unsicher') : ''}</small></div>
            <span class="pfeil">${offen ? '⌄' : '›'}</span></div>`);
          if (offen) {
            t.push(`<div class="trachtdetail">
              <img class="trachtbild" data-bild-art="${a.art}" src="${platzhalter(a.name)}" alt="">
              <div class="bildtext" data-bild-text="${a.art}">${esc(t2(meta?.hinweis) || '')}</div>
              <div class="mini" style="margin:6px 0 10px">
                ${meta?.art === 'pollen' ? t2('liefert Pollen')
                  : meta?.art === 'nektar' ? t2('liefert Nektar') : t2('liefert Nektar und Pollen')}
                ${wikiSeite(a.art) ? ` · <a href="${wikiSeite(a.art)}" target="_blank" rel="noopener">Wikipedia</a>` : ''}
              </div>
              ${pollenHTML(meta)}
              <label class="feld" data-typ="wert"><span>Datum</span>
                <input type="date" id="td-${a.art}-${st.id}" value="${iso(heute())}"></label>
              <div class="knopfreihe">
                <button class="knopf klein" style="flex:1" data-melden="start" data-art="${a.art}" data-st="${st.id}">Blüht seit diesem Datum</button>
              </div>
              <div class="knopfreihe">
                <button class="knopf leise klein" style="flex:1" data-melden="nochNicht" data-art="${a.art}" data-st="${st.id}">Blüht noch nicht</button>
                <button class="knopf leise klein" style="flex:1" data-melden="ende" data-art="${a.art}" data-st="${st.id}">Blüte vorbei</button>
                ${a.bestaetigt ? `<button class="knopf leise klein" data-melden="loeschen" data-art="${a.art}" data-st="${st.id}">zurücknehmen</button>` : ''}
              </div>
            </div>`);
          }
        }
      }
    }
    t.push('</div>');
  }
  t.push(`<div class="mini" style="padding:4px 6px 0">
    Quelle: Open-Meteo (Archiv und Vorhersage, kostenfrei, ohne Schlüssel). Das Modell kalibriert
    sich pro Standort an zehn Jahren örtlicher Klimatologie und lernt aus jeder Blüte, die du
    bestätigst. Bilder und Beschreibungen: Wikipedia.
    Die Pollenfarben folgen den gängigen Bestimmungstafeln und schwanken mit Alter und
    Feuchte des Höschens – als Anhaltspunkt auf der Wabe und am Flugloch reichen sie.</div>`);
  return t.join('');
}

// -------------------------------------------------------------------- Mehr

function ansichtMehr() {
  return `
  <h2 class="abschnitt">Bienenstände</h2>
  <div class="karte">
    ${S.standorte.map((s) => `<div class="volkzeile" data-standort="${s.id}">
      ${statischesLuftbild(s.lat, s.lon, { w: 52, h: 52, z: 16, radius: 10 })}
      <div class="info"><b>${esc(s.name)}</b>
        <div>${esc(s.adresse || (s.lat != null ? `${(+s.lat).toFixed(4)}, ${(+s.lon).toFixed(4)}` : 'keine Koordinaten'))}
        · ${S.voelker.filter((v) => v.standortId === s.id).length} Völker</div></div>
      <span class="pfeil">›</span></div>`).join('')
    || '<div class="karte-inhalt leer" style="padding:20px">Noch kein Standort.</div>'}
  </div>
  <div class="knopfreihe"><button class="knopf" data-neu-standort>Bienenstand anlegen</button></div>

  <h2 class="abschnitt">Völker verwalten</h2>
  <div class="karte">
    ${S.voelker.map((v) => `<div class="volkzeile">
      <div class="info"><b>${esc(v.name)}</b>
        <div>${esc(S.standorte.find((s) => s.id === v.standortId)?.name || 'ohne Standort')}</div></div>
      <button class="knopf leise klein" data-volk-bearbeiten="${v.id}">Bearbeiten</button>
      <button class="knopf leise klein loeschen" data-volk-loeschen="${v.id}">Löschen</button>
    </div>`).join('') || '<div class="karte-inhalt leer" style="padding:20px">Noch keine Völker.</div>'}
  </div>

  <h2 class="abschnitt">Berichte</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="mini" style="margin-bottom:10px">Zum Ablegen, Ausdrucken und Vorzeigen.</div>
    <div class="knopfreihe">
      <button class="knopf leise" data-protokoll>Behandlungsprotokoll (PDF)</button>
    </div>
    <div class="mini" style="margin-top:9px">Die Stockkarte eines einzelnen Volkes als PDF
      gibt es auf der Seite des jeweiligen Volkes.
      <a href="#" data-etiketten>QR-Aufkleber für die Beuten</a>.</div>
  </div></div>

  <h2 class="abschnitt">Abgleich zwischen Geräten</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="mini" id="syncinfo">${S.sync?.token
      ? `Eingerichtet: ${esc(S.sync.repo)}${S.sync.letzter
        ? ` · zuletzt ${fmtDatum(S.sync.letzter.slice(0, 10))}` : ' · noch nie abgeglichen'}`
      : 'Noch nicht eingerichtet. Am Handy erfassen, am PC auswerten – über ein privates GitHub-Repository, kostenlos.'}</div>
    <div class="knopfreihe">
      ${S.sync?.token ? '<button class="knopf" data-sync-jetzt>Jetzt abgleichen</button>' : ''}
      <button class="knopf ${S.sync?.token ? 'leise' : ''}" data-sync-einrichten>
        ${S.sync?.token ? 'Einstellungen' : 'Einrichten'}</button>
    </div>
  </div></div>

  <h2 class="abschnitt">Daten</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="mini" style="margin-bottom:10px">Alles liegt nur auf diesem Gerät.
      Sichere regelmäßig – und vor jedem Gerätewechsel.</div>
    <div class="knopfreihe">
      <button class="knopf leise" data-export>Sicherung exportieren</button>
      <button class="knopf leise" data-import>Sicherung einspielen</button>
    </div>
    <div class="knopfreihe">
      <button class="knopf leise klein" data-ics>Kalenderdatei (.ics)</button>
    </div>
    <div class="knopfreihe">
      <button class="knopf leise klein" data-demo>Beispieldaten laden</button>
      <button class="knopf leise klein loeschen" data-reset>Alles löschen</button>
    </div>
    <div class="trenner"></div>
    <div class="mini" id="fotobilanz">Fotos werden gezählt …</div>
    <label class="feld" data-typ="wert" style="margin-top:8px"><span>Bildgröße neuer Fotos</span>
      <select data-fotokante>
        <option value="800">${esc(t2('sparsam (800 Punkte, ca. 60 kB)'))}</option>
        <option value="1024">${esc(t2('normal (1024 Punkte, ca. 100 kB)'))}</option>
        <option value="1600">${esc(t2('genau (1600 Punkte, ca. 250 kB)'))}</option>
      </select></label>
    <div class="knopfreihe">
      <button class="knopf leise klein" data-fotos-aufraeumen>${esc(t2('Alte Fotos löschen'))}</button>
    </div>
    <div class="mini" style="margin-top:8px">Fotos liegen nur auf diesem Gerät: sie gehen in die
      Sicherungsdatei mit, nicht in den Geräteabgleich. Sonst würde das Abgleich-Repository mit
      jeder Woche wachsen.</div>
  </div></div>

  <h2 class="abschnitt">Sprache</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="chips" id="sprachwahl">
      ${SPRACHEN.map((s) => `<button type="button" data-sprache="${s.code}"
        class="${sprache() === s.code ? 'an' : ''}">${esc(s.eigen)}</button>`).join('')}
    </div>
    <div class="mini" style="margin-top:8px">Weitere Sprachen lassen sich als Textdatei
      ergänzen, ohne am Programm etwas zu ändern – siehe <code>js/lang/</code>.</div>
  </div></div>

  <h2 class="abschnitt">Benachrichtigungen</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="mini" style="margin-bottom:10px"><span>Wofür BeeWise sich melden darf.</span>
      <span>${'Notification' in window && Notification.permission === 'granted'
        ? 'Meldungen sind erlaubt.'
        : 'Meldungen sind noch nicht erlaubt – unten freigeben.'}</span></div>
    ${[['faellig', 'Fällige und überfällige Aufgaben', 'Eine Zusammenfassung dessen, was ansteht oder liegengeblieben ist.'],
       ['warnungen', 'Automatische Warnungen', 'Varroabefall über der Schwelle, weiselloses Volk, Schwarmstimmung, Futter knapp.'],
       ['tracht', 'Trachtfragen', 'Rückfragen wie „Blüht der Raps schon?“, die das Modell genauer machen.'],
       ['vorwarnung', 'Wichtige Termine vorab', 'Vorwarnung vor kritischen Terminen wie letzter Ernte oder Auffütterungsschluss.']]
      .map(([k, titel, text]) => `<label class="schalter">
        <span><b>${esc(titel)}</b><small>${esc(text)}</small></span>
        <input type="checkbox" data-meldung="${k}" ${S.meldungen?.[k] ? 'checked' : ''}>
      </label>`).join('')}
    <label class="feld" data-typ="wert" style="margin-top:10px"><span>Vorwarnzeit</span>
      <select data-vorlauf>${[1, 2, 3, 5, 7].map((n) =>
        `<option value="${n}" ${Number(S.meldungen?.vorlaufTage) === n ? 'selected' : ''}>${t2('{n} Tage', { n })}</option>`).join('')}</select></label>
    <div class="knopfreihe">
      <button class="knopf leise klein" data-benachrichtigung>Meldungen erlauben</button>
      <button class="knopf leise klein" data-melde-test>Probemeldung</button>
    </div>
    <div class="mini" style="margin-top:9px">Im Browser kann BeeWise nur melden, solange die
      App zwischendurch geöffnet wird. Für Meldungen bei geschlossener App braucht es die
      Android-Fassung.</div>
  </div></div>

  <h2 class="abschnitt">Als App installieren</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="mini">BeeWise lässt sich als App auf den Startbildschirm legen – mit eigenem
      Symbol, im Vollbild, ohne Browserleiste und ohne Play Store.</div>
    <div id="installieren" hidden class="knopfreihe">
      <button class="knopf" data-install>Jetzt installieren</button></div>
    <div class="mini" style="margin-top:9px">
      <b>Android/Chrome:</b> Menü ⋮ → „App installieren“.<br>
      <b>iPhone/Safari:</b> Teilen-Symbol → „Zum Home-Bildschirm“.
    </div>
  </div></div>

  <h2 class="abschnitt">Hilfe</h2>
  <div class="karte"><div class="karte-inhalt">
    <div class="mini">Zu vielen Aufgaben gibt es Videohilfe direkt im Aufgabenfenster.
      Bevorzugte Quelle ist die Playlist „Tipps und Tricks für Imker“ von ${esc(KANAL)}.</div>
    <div class="knopfreihe"><a class="knopf leise klein" href="${PLAYLIST}" target="_blank" rel="noopener">Playlist öffnen</a></div>
  </div></div>

  <h2 class="abschnitt">Diagnose</h2>
  <div class="karte"><div class="karte-inhalt mini">
    <span>Speicherung:</span> <b>${db.nurFluechtig?.() ? t2('nur im Arbeitsspeicher – nichts bleibt erhalten')
      : t2('lokale Datenbank (IndexedDB)')}</b><br>
    ${t2('Datensätze: {st} Stände · {vo} Völker · {du} Durchsichten · {er} Erledigungen · {wa} Umzüge',
      { st: S.standorte.length, vo: S.voelker.length, du: S.durchsichten.length,
        er: S.erledigungen.length, wa: S.wanderungen.length })}<br>
    <span>Adresse:</span> <code>${esc(location.protocol)}//…</code>
    ${db.letzterFehler?.() ? `<div style="color:var(--ueberfaellig);margin-top:8px">
      <b>Datenbank:</b> ${esc(db.letzterFehler())}</div>` : ''}
    ${letzterAppFehler ? `<div style="color:var(--ueberfaellig);margin-top:6px">
      <b>Letzter Fehler:</b> ${esc(letzterAppFehler)}</div>` : ''}
    <div class="knopfreihe">
      <button class="knopf leise klein" data-selbsttest>Selbsttest ausführen</button>
      <button class="knopf leise klein loeschen" data-db-reset>Datenbank zurücksetzen</button>
    </div>
    <div id="testausgabe" style="margin-top:8px"></div>
  </div></div>

  <h2 class="abschnitt">Über</h2>
  <div class="karte"><div class="karte-inhalt mini">
    BeeWise · Prototyp.<br>
    Die Termine sind eine Orientierung. Zulassung, Dosierung und Wartezeiten von
    Behandlungsmitteln richten sich nach der Packungsbeilage und den Empfehlungen des
    zuständigen Bienengesundheitsdienstes. Melde- und Anzeigepflichten sind Ländersache.
  </div></div>`;
}

function ankerText(r) {
  const a = r.anker;
  if (a.typ === 'datum') {
    return t2('Kalender {von} – {bis}',
      { von: `${a.von[1]}.${a.von[0]}.`, bis: `${a.bis[1]}.${a.bis[0]}.` });
  }
  if (a.typ === 'bluete') {
    const art = t2(ARTEN.find((x) => x.id === a.art)?.name);
    return a.ereignis === 'ende' ? t2('{art} Blühende', { art }) : t2('{art} Blühbeginn', { art });
  }
  if (a.typ === 'wetter') {
    return t2({ ersterWarmtag: 'erster warmer Tag', durchsichtWetter: 'erstes durchsichtstaugliches Wetter',
      brutfrei: 'Brutfreiheit nach Frost', ersterNachtfrost: 'erster Nachtfrost' }[a.ereignis]);
  }
  if (a.typ === 'nachAufgabe') {
    return t2('{a}–{b} Tage nach „{regel}“', { a: r.fenster?.[0], b: r.fenster?.[1],
      regel: t2(regelNach(a.regel)?.kurz || regelNach(a.regel)?.titel) });
  }
  return '';
}

// ================================================================== Verdrahten

function verdrahten() {
  const on = (sel, ev, fn) => AN.querySelectorAll(sel).forEach((n) => n.addEventListener(ev, fn));

  on('[data-auf]', 'click', (e) => {
    const a = S.plan.find((x) => x.schluessel === e.currentTarget.dataset.auf);
    if (a) aufgabeOeffnen(a);
  });
  on('[data-gruppe]', 'click', (e) => {
    const [g, zustand] = e.currentTarget.dataset.gruppe.split('|');
    gruppeOeffnen(S.plan.filter((a) => (a.gruppierung || a.regelId) === g && a.zustand === zustand));
  });
  on('[data-klapp]', 'click', (e) => {
    const k = e.currentTarget.dataset.klapp;
    const standard = k.startsWith('tracht:') && S.standorte.length === 1;
    S.offen[k] = !(S.offen[k] ?? standard);
    render();
  });
  on('[data-filter]', 'click', (e) => { S.filter = e.currentTarget.dataset.filter || null; render(); });
  on('[data-monat]', 'click', (e) => {
    S.monat = new Date(S.monat.getFullYear(), S.monat.getMonth() + Number(e.currentTarget.dataset.monat), 1);
    render();
  });
  on('[data-tag]', 'click', (e) => {
    S.tag = S.tag === e.currentTarget.dataset.tag ? null : e.currentTarget.dataset.tag;
    render();
  });
  on('[data-wetter]', 'click', (e) => { e.stopPropagation(); wetterSheet(e.currentTarget.dataset.wetter); });
  on('[data-standmodus]', 'click', (e) => {
    const id = e.currentTarget.dataset.standmodus;
    if (id) standStarten(id); else standWaehlen();
  });
  on('[data-sschritt]', 'click', (e) => standWechseln(Number(e.currentTarget.dataset.sschritt)));
  on('[data-sweiter]', 'click', () => standWeiter());
  on('[data-sohne]', 'click', () => standWeiter({ ohneBefund: true }));
  on('[data-sende]', 'click', () => standBeenden());
  on('[data-saufgabe]', 'click', (e) => e.currentTarget.classList.toggle('an'));
  on('[data-sdetail]', 'click', (e) => {
    e.stopPropagation();
    const a = S.plan.find((x) => x.schluessel === e.currentTarget.dataset.sdetail);
    if (a) aufgabeOeffnen(a);
  });
  AN.querySelectorAll('.grobfeld[data-typ="wahl"]').forEach((f) => {
    f.querySelectorAll('button').forEach((b) => {
      b.onclick = () => {
        const anVorher = b.classList.contains('an');
        f.querySelectorAll('button').forEach((x) => x.classList.remove('an'));
        if (!anVorher) b.classList.add('an');       // nochmal tippen hebt auf
      };
    });
  });
  const fotoplatz = AN.querySelector('[data-fotoplatz]');
  if (fotoplatz) {
    fotoplatz.innerHTML = fotoFeldHTML();
    fotoFeldVerdrahten(fotoplatz);
  }

  AN.querySelectorAll('.grobfeld[data-typ="zahl"]').forEach((f) => {
    const inp = f.querySelector('input');
    const um = (r) => {
      const jetzt = inp.value === '' ? (r > 0 ? 0 : 1) : parseFloat(inp.value) || 0;
      inp.value = Math.max(0, jetzt + r);
    };
    f.querySelector('[data-minus]').onclick = () => um(-1);
    f.querySelector('[data-plus]').onclick = () => um(1);
  });
  on('[data-volk]', 'click', (e) => gehe('volk', e.currentTarget.dataset.volk));
  on('[data-neu-volk]', 'click', () => volkSheet());
  on('[data-volk-bearbeiten]', 'click', (e) => {
    e.stopPropagation();
    volkSheet(S.voelker.find((v) => v.id === e.currentTarget.dataset.volkBearbeiten));
  });
  on('[data-volk-loeschen]', 'click', async (e) => {
    const v = S.voelker.find((x) => x.id === e.currentTarget.dataset.volkLoeschen);
    if (!await bestaetige(t('„{name}“ wirklich löschen? Der Verlauf geht mit verloren.', { name: v.name }))) return;
    await db.loesche('voelker', v.id);
    await datenLaden(); render(); toast('Volk gelöscht.');
  });
  on('[data-foto]', 'click', (e) => volksbildWaehlen(e.currentTarget.dataset.foto));
  on('[data-koe-neu]', 'click', (e) => koeniginSheet(e.currentTarget.dataset.koeNeu));
  on('[data-koe-bearbeiten]', 'click', (e) => koeniginSheet(null,
    S.koeniginnen.find((k) => k.id === e.currentTarget.dataset.koeBearbeiten)));
  on('[data-koe-umweiseln]', 'click', (e) => umweiselnSheet(e.currentTarget.dataset.koeUmweiseln));
  on('[data-neu-standort-hier]', 'click', () => standortSheet());
  on('[data-stand-bearbeiten]', 'click', (e) => standortSheet(
    S.standorte.find((x) => x.id === e.currentTarget.dataset.standBearbeiten)));
  on('[data-umzug]', 'click', (e) => umzugSheet(e.currentTarget.dataset.umzug));
  on('[data-volk-pdf]', 'click', (e) => {
    const p = volkHistorie(S, e.currentTarget.dataset.volkPdf);
    const v = S.voelker.find((x) => x.id === e.currentTarget.dataset.volkPdf);
    if (p) { p.herunterladen(`stockkarte-${dateiname(v.name)}-${iso(heute())}.pdf`); toast('PDF erstellt.'); }
  });
  on('[data-protokoll]', 'click', () => protokollSheet());
  on('[data-etiketten]', 'click', (e) => { e.preventDefault(); etikettenSheet(); });
  on('[data-sync-einrichten]', 'click', () => syncSheet());
  on('[data-sync-jetzt]', 'click', () => syncAusfuehren());
  on('[data-neu-standort]', 'click', () => standortSheet());
  on('[data-standort]', 'click', (e) =>
    standortSheet(S.standorte.find((s) => s.id === e.currentTarget.dataset.standort)));
  on('[data-durchsicht]', 'click', (e) => durchsichtSheet(e.currentTarget.dataset.durchsicht));
  on('[data-bluete]', 'click', async (e) => {
    const { bluete, art, st } = e.currentTarget.dataset;
    await bluetenAntwort(st, art, bluete);
  });
  on('[data-melden]', 'click', async (e) => {
    e.stopPropagation();
    const { melden, art, st } = e.currentTarget.dataset;
    const feld = document.getElementById(`td-${art}-${st}`);
    await bluetenAntwort(st, art, melden, feld?.value || iso(heute()));
  });
  on('[data-eintrag]', 'click', (e) => eintragMenu(e.currentTarget.dataset.eintrag));
  on('[data-eigene-neu]', 'click', eigeneAufgabeSheet);
  on('[data-ics]', 'click', () => {
    const liste = gefiltert(offeneAufgaben());
    if (!liste.length) return toast('Nichts zu exportieren.');
    icsHerunterladen(liste);
    toast(t('{n} Termine als .ics – in den Kalender importieren.', { n: liste.length }));
  });
  fotobilanzZeigen();
  on('[data-fotokante]', 'change', async (e) => {
    await fotos.kanteSchreiben(e.currentTarget.value);
    toast('Bildgröße gespeichert.');
  });
  on('[data-fotos-aufraeumen]', 'click', fotosAufraeumenSheet);
  on('[data-export]', 'click', exportieren);
  on('[data-import]', 'click', importieren);
  on('[data-demo]', 'click', beispieldaten);
  on('[data-reset]', 'click', allesLoeschen);
  on('[data-benachrichtigung]', 'click', benachrichtigungenAnfragen);
  on('[data-sprache]', 'click', async (e) => {
    spracheSetzen(e.currentTarget.dataset.sprache);
    // Bezugstexte („zuletzt am …", „hängt an …") entstehen beim Rechnen des
    // Plans. Ohne Neuberechnung blieben sie in der vorherigen Sprache stehen.
    neuRechnen();
    render();
    toast('Sprache geändert.');
  });
  on('[data-meldung]', 'change', async (e) => {
    S.meldungen = { ...S.meldungen, [e.currentTarget.dataset.meldung]: e.currentTarget.checked };
    await db.metaSchreibe('meldungen', S.meldungen);
  });
  on('[data-vorlauf]', 'change', async (e) => {
    S.meldungen = { ...S.meldungen, vorlaufTage: Number(e.currentTarget.value) };
    await db.metaSchreibe('meldungen', S.meldungen);
  });
  on('[data-melde-test]', 'click', () => erinnern({ erzwingen: true }));
  on('[data-db-reset]', 'click', async () => {
    if (!await bestaetige('Datenbank zurücksetzen? Alle Daten auf diesem Gerät gehen verloren. '
      + 'Vorher am besten eine Sicherung exportieren.', 'Ja, zurücksetzen')) return;
    await db.zuruecksetzen();
    location.reload();
  });
  on('[data-selbsttest]', 'click', async (e) => {
    const aus = AN.querySelector('#testausgabe');
    aus.innerHTML = esc(t('Test läuft …'));
    const zeilen = [];
    try {
      await db.schreibe('meta', { id: 'selbsttest', wert: Date.now() });
      zeilen.push(t('Schreiben: ok'));
      const zurueck = await db.hole('meta', 'selbsttest');
      zeilen.push(zurueck ? t('Lesen: ok') : t('Lesen: FEHLGESCHLAGEN'));
      await db.entferne('meta', 'selbsttest');
      zeilen.push(t('Löschen: ok'));
      zeilen.push(db.nurFluechtig?.() ? t('ACHTUNG: nur Arbeitsspeicher') : t('Dauerhafte Speicherung: ok'));
    } catch (f) {
      zeilen.push(t('FEHLER: {grund}', { grund: f?.message || f }));
    }
    aus.innerHTML = zeilen.map((z) => `<div>${esc(z)}</div>`).join('');
  });
  if (installAufforderung) {
    const box = AN.querySelector('#installieren');
    if (box) {
      box.hidden = false;
      box.querySelector('[data-install]').onclick = async () => {
        installAufforderung.prompt();
        const { outcome } = await installAufforderung.userChoice;
        if (outcome === 'accepted') { installAufforderung = null; render(); toast('BeeWise wurde installiert.'); }
      };
    }
  }
}

/** Nachträglich geladene Inhalte (Trachtbilder, Fotos der Durchsichten). */
function nachladen() {
  const leisten = [...document.querySelectorAll('[data-fotos]')];
  if (leisten.length && S.volkId) {
    fotos.fotosVomVolk(S.volkId).then((bilder) => {
      const nach = new Map();
      for (const b of bilder) {
        if (!nach.has(b.durchsichtId)) nach.set(b.durchsichtId, []);
        nach.get(b.durchsichtId).push(b);
      }
      for (const el of leisten) {
        const liste = nach.get(el.dataset.fotos) || [];
        el.innerHTML = liste.map((b) =>
          `<img class="fotoklein" src="${b.klein}" data-foto-gross="${b.id}" alt="">`).join('');
        el.querySelectorAll('[data-foto-gross]').forEach((x) => {
          x.onclick = (ev) => { ev.stopPropagation(); fotoAnsehen(x.dataset.fotoGross); };
        });
      }
    }).catch(() => { /* ohne Bilder halt ohne */ });
  }

  const arten = new Set();
  document.querySelectorAll('[data-bild-art],[data-bild-klein]').forEach((el) =>
    arten.add(el.dataset.bildArt || el.dataset.bildKlein));
  for (const art of arten) {
    trachtBild(art).then((b) => {
      if (!b) return;
      const setzen = (el, url, name) => {
        if (!url) return;
        el.referrerPolicy = 'no-referrer';
        // Lädt das Bild nicht, wird der Zwischenspeicher verworfen und der
        // Platzhalter gezeigt – statt eines kaputten Bildsymbols.
        el.onerror = () => {
          el.onerror = null;
          el.classList.remove('geladen');
          el.src = platzhalter(name);
          bildVerwerfen(art);
        };
        el.onload = () => el.classList.add('geladen');
        el.src = url;
      };
      const name = ARTEN.find((x) => x.id === art)?.name || art;
      document.querySelectorAll(`[data-bild-art="${art}"]`).forEach((el) => setzen(el, b.bild, name));
      document.querySelectorAll(`[data-bild-klein="${art}"]`).forEach((el) => setzen(el, b.klein || b.bild, name));
      const tx = document.querySelector(`[data-bild-text="${art}"]`);
      if (tx && b.text) tx.textContent = b.text;
    });
  }
}


// ---------------------------------------------------------------- Fotos

// Zwischenablage für Bilder, die im gerade offenen Fenster aufgenommen wurden.
// Gespeichert werden sie erst, wenn die Durchsicht selbst geschrieben ist –
// vorher gibt es keine Kennung, an der sie hängen könnten.
let fotoPuffer = [];
const fotoPufferLeeren = () => { fotoPuffer = []; };

function fotoFeldHTML() {
  return `<div class="fotofeld">
    <span class="grobtitel">${esc(t2('Fotos'))}</span>
    <div class="fotoreihe" id="fotoreihe"></div>
    <button type="button" class="knopf leise klein" data-foto-neu>${esc(t2('+ Foto aufnehmen'))}</button>
    <small>${esc(t2('Bleibt auf diesem Gerät und wandert nicht in den Geräteabgleich.'))}</small>
  </div>`;
}

function fotoFeldVerdrahten(root) {
  const knopf = root.querySelector('[data-foto-neu]');
  if (!knopf) return;
  const reihe = root.querySelector('#fotoreihe');
  const zeichnen = () => {
    reihe.innerHTML = fotoPuffer.map((b, i) =>
      `<span class="fotoklein"><img src="${b.klein}" alt="">
        <button type="button" data-foto-weg="${i}" aria-label="${esc(t2('entfernen'))}">✕</button></span>`).join('');
    reihe.querySelectorAll('[data-foto-weg]').forEach((x) => {
      x.onclick = () => { fotoPuffer.splice(Number(x.dataset.fotoWeg), 1); zeichnen(); };
    });
  };
  knopf.onclick = async () => {
    const kante = await fotos.kanteLesen();
    const bild = await fotos.fotoAufnehmen({ kante });
    if (!bild) return;
    fotoPuffer.push(bild);
    zeichnen();
  };
  zeichnen();
}

async function fotoPufferSpeichern(volkId, durchsichtId, datum) {
  for (const bild of fotoPuffer) {
    await fotos.fotoSpeichern({ volkId, durchsichtId, datum, bild });
  }
  const n = fotoPuffer.length;
  fotoPufferLeeren();
  return n;
}

/** Bild groß ansehen und bei Bedarf löschen. */
function fotoAnsehen(id) {
  const zeigen = async () => {
    const alle = await fotos.fotosVomVolk(S.volkId);
    const b = alle.find((x) => x.id === id);
    if (!b) return toast('Foto nicht gefunden.');
    sheetAuf({
      titel: 'Foto',
      unter: fmtDatum(b.datum, true),
      inhalt: `<img class="fotogross" src="${b.daten}" alt="">
        <div class="knopfreihe">
          <button class="knopf gefahr" data-del>Foto löschen</button>
        </div>`,
      danach(root) {
        root.querySelector('[data-del]').onclick = async () => {
          await fotos.fotoLoeschen(id);
          sheetZu(); render(); toast('Foto gelöscht.');
        };
      },
    });
  };
  zeigen();
}

// ---------------------------------------------------------- Aufgaben-Sheets

function hilfeBlock(a) {
  const begriff = a.hilfe || a.titel;
  return `<div class="hilfezeile">
    <a class="knopf leise klein" href="${videoSuche(begriff)}" target="_blank" rel="noopener">▶ Video (${esc(KANAL)})</a>
    <a class="knopf leise klein" href="${videoSucheAllgemein(begriff)}" target="_blank" rel="noopener">▶ andere Quellen</a>
  </div>`;
}

function futterRechnerHTML(volkId) {
  const v = S.voelker.find((x) => x.id === volkId);
  const d = letzteDurchsicht(volkId);
  return `<div class="rechner" id="futterrechner">
    <div class="rechnerkopf">Futterbedarf abschätzen</div>
    <div class="mini" style="margin:-4px 0 9px">Gezählt werden die Wabengassen, in denen
      <b>Bienen sitzen</b> – nicht die Futterwaben.</div>
    <div class="rechnerfelder">
      <label><span>Beute</span><select data-r="beute">
        ${['Zander', 'Deutsch Normal', 'Dadant', 'Langstroth', 'Segeberger', 'anderes']
          .map((o) => `<option${v?.beute === o ? ' selected' : ''}>${o}</option>`).join('')}
      </select></label>
      <label><span>Von Bienen besetzte Wabengassen</span>
        <input type="number" data-r="gassen" value="${d?.wabengassen ?? ''}" step="1" inputmode="numeric"></label>
      <label><span>Vorhandenes Futter im Volk (kg)</span>
        <input type="number" data-r="vorhanden" value="${d?.futter ?? ''}" step="0.5" inputmode="decimal"></label>
      <label><span>Jungvolk (dieses Jahr gebildet, &lt; 1 Jahr)</span>
        <select data-r="jungvolk"><option value="">nein</option>
        <option value="1"${koe.istJungvolk(v) ? ' selected' : ''}>ja</option></select></label>
    </div>
    <div class="rechnerergebnis" id="futterergebnis"></div>
    <div class="mini">${d ? `Vorbelegt aus der Durchsicht vom ${fmtDatum(d.datum)}.`
      : 'Noch keine Durchsicht – Werte bitte selbst eintragen.'}
      Faustwerte, kein Ersatz für den Blick ins Volk.</div>
  </div>`;
}

function futterRechnerVerdrahten(root) {
  const box = root.querySelector('#futterrechner');
  if (!box) return;
  const aus = box.querySelector('#futterergebnis');
  const rechne = () => {
    const g = (k) => box.querySelector(`[data-r="${k}"]`)?.value;
    const r = futterBedarf({
      beute: g('beute'),
      gassen: g('gassen') ? Number(g('gassen')) : null,
      vorhanden: g('vorhanden') ? Number(g('vorhanden')) : 0,
      jungvolk: !!g('jungvolk'),
    });
    const komma = (x) => String(x).replace('.', ',');
    aus.innerHTML = `
      <div class="ergebniszeile"><span>Zielvorrat für den Winter</span><b>${r.ziel} kg</b></div>
      <div class="ergebniszeile gross"><span>Noch zu füttern</span><b>${komma(r.fehlt)} kg</b></div>
      <div class="ergebniszeile"><span>als Fertigsirup</span><b>≈ ${komma(r.fertigsirup)} kg</b></div>
      <div class="ergebniszeile"><span>oder Zuckerwasser 3:2</span><b>${komma(r.zucker)} kg Zucker + ${komma(r.wasser)} l Wasser</b></div>
      ${r.warnung ? `<div class="warnung">${esc(r.warnung)}</div>` : ''}`;
    const kg = root.querySelector('[data-key="kg"] input');
    if (kg && !kg.dataset.manuell && !kg.value) kg.value = r.fehlt || '';
  };
  box.querySelectorAll('[data-r]').forEach((i) => { i.oninput = rechne; i.onchange = rechne; });
  const kg = root.querySelector('[data-key="kg"] input');
  if (kg) kg.addEventListener('input', () => { kg.dataset.manuell = '1'; });
  rechne();
}

function aufgabeOeffnen(a) {
  const zeit = a.von && a.bis ? t2('{von} bis {bis}', { von: fmtDatum(a.von), bis: fmtDatum(a.bis) }) : t2('Termin noch offen');
  sheetAuf({
    titel: a.titel,
    unter: `${a.ziel.typ === 'imkerei' ? t2('Ganze Imkerei') : a.ziel.name}${a.ziel.typ === 'volk' && a.ziel.standortName ? ' · ' + a.ziel.standortName : ''} · ${zeit}`,
    inhalt: `
      ${a.info ? `<div class="hinweis">${esc(a.info)}</div>` : ''}
      ${wetterBlockHTML(a)}
      ${hilfeBlock(a)}
      ${a.bezug ? `<div class="mini" style="margin:2px 0 12px">Terminbezug: ${esc(a.bezug)}</div>` : ''}
      ${a.wartetAuf ? `<div class="hinweis" style="border-color:var(--wartet)">Wartet auf: ${esc(a.wartetAuf)}.
        Sobald das erledigt ist, rückt dieser Termin automatisch nach.</div>` : ''}
      ${a.checkliste.length ? `<ul class="checkliste">${a.checkliste.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${a.aktion === 'umweiseln' && a.ziel.typ === 'volk' ? `<div class="knopfreihe">
        <button class="knopf leise" data-koe-umweiseln="${a.ziel.id}">${esc(t2('Umweiseln eintragen'))}</button>
        </div>` : ''}
      ${a.rechner === 'futter' && a.ziel.typ === 'volk' ? futterRechnerHTML(a.ziel.id) : ''}
      <div class="trenner"></div>
      <label class="feld" data-key="datum" data-typ="wert"><span>Erledigt am</span>
        <input type="date" value="${iso(heute())}"></label>
      ${a.felder.map((f) => feldHTML(f)).join('')}
      <div class="knopfreihe">
        ${a.eigenId ? '<button class="knopf gefahr" data-del>Löschen</button>'
          : '<button class="knopf leise" data-skip>Überspringen</button>'}
        <button class="knopf" data-ok>Erledigt</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root, a.felder);
      futterRechnerVerdrahten(root);
      root.querySelector('[data-koe-umweiseln]')?.addEventListener('click', (e) => {
        sheetZu();
        setTimeout(() => umweiselnSheet(e.currentTarget.dataset.koeUmweiseln), 60);
      });
      root.querySelector('[data-ok]').onclick = () => aufgabeSpeichern(a, root, 'erledigt');
      root.querySelector('[data-skip]')?.addEventListener('click', () => aufgabeSpeichern(a, root, 'uebersprungen'));
      root.querySelector('[data-del]')?.addEventListener('click', async () => {
        await db.loesche('aufgaben', a.eigenId);
        sheetZu(); await datenLaden(); render(); toast('Aufgabe gelöscht.');
      });
    },
  });
}

async function aufgabeSpeichern(a, root, status) {
  const werte = werteLesen(root);
  const datum = werte.datum || iso(heute());
  delete werte.datum;

  if (a.eigenId) {
    await eigenAbhaken(a.eigenId, datum, werte.notiz || '');
  } else {
    await db.schreibe('erledigungen', {
      id: uid(), regelId: a.regelId, zielTyp: a.ziel.typ, zielId: a.ziel.id,
      datum, status, daten: werte, jahr: parseISO(datum).getFullYear(),
    });
  }

  let neu = 0;
  if (status === 'erledigt' && a.ziel.typ === 'volk') {
    neu = await ausloeserPruefen({
      daten: werte, zielTyp: 'volk', zielId: a.ziel.id, zielName: a.ziel.name, datum,
      kontext: { nachBehandlung: a.regelId === 'behandlungserfolg' },
    });
  }

  sheetZu();
  await datenLaden();
  render();
  toast(neu ? t('Erledigt. {n} neue Aufgaben automatisch angelegt.', { n: neu })
    : (status === 'erledigt' ? 'Erledigt – Folgetermine neu berechnet.' : 'Übersprungen.'));

  // Aus „Ableger gebildet" werden echte Völker – mit Abstammung und Jungvolkstatus.
  if (status === 'erledigt' && a.aktion === 'ableger' && a.ziel.typ === 'volk'
    && Number(werte.anzahl) > 0) {
    setTimeout(() => ablegerSheet(a.ziel.id, Number(werte.anzahl), datum), 250);
  }
}

/**
 * Ableger als eigene Völker anlegen.
 * Ohne das bleibt „3 Ableger gebildet" eine Zahl im Protokoll – mit ihm hat man
 * drei Stockkarten, die Abstammung und ab sofort eigene Termine.
 */
function ablegerSheet(mutterId, anzahl, datum) {
  const mutter = S.voelker.find((x) => x.id === mutterId);
  if (!mutter) return;
  const vorschlag = (i) => `${mutter.name}-${String.fromCharCode(97 + i)}`;
  sheetAuf({
    titel: t2('{n} Ableger als Völker anlegen', { n: anzahl }),
    unter: t2('gebildet aus {name} am {d}', { name: mutter.name, d: fmtDatum(datum) }),
    inhalt: `
      <div class="hinweis">Jeder Ableger bekommt seine eigene Stockkarte, den Verweis auf das
        Muttervolk und den Jungvolkstatus – dadurch rechnet BeeWise weniger Winterfutter und
        legt in drei Wochen die Kontrolle auf Legebeginn an.</div>
      <div id="ablegernamen">
        ${Array.from({ length: anzahl }, (_, i) => feldHTML(
        { key: 'n' + i, label: t2('Bezeichnung {i}', { i: i + 1 }) }, vorschlag(i))).join('')}
      </div>
      ${feldHTML({ key: 'beute', label: 'Beute / Rähmchenmaß', typ: 'auswahl',
        optionen: ['Zander', 'Deutsch Normal', 'Dadant', 'Langstroth', 'Segeberger', 'anderes'] },
      mutter.beute)}
      <div class="knopfreihe">
        <button class="knopf leise" data-spaeter>Später</button>
        <button class="knopf" data-ok>Anlegen</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root);
      root.querySelector('[data-spaeter]').onclick = () => sheetZu();
      root.querySelector('[data-ok]').onclick = async () => {
        const w = werteLesen(root);
        const jahr = parseISO(datum).getFullYear();
        let gemacht = 0;
        for (let i = 0; i < anzahl; i++) {
          const name = w['n' + i];
          if (!name) continue;
          const neuV = await db.schreibe('voelker', {
            id: uid(), name, standortId: mutter.standortId, status: 'aktiv',
            beute: w.beute || mutter.beute || '', zargen: 1,
            herkunft: 'Ableger', mutterVolkId: mutter.id, gebildetAm: datum,
            koeniginJahr: String(jahr),
          });
          await eigeneAnlegen({
            titel: t('Legebeginn prüfen ({volk})', { volk: name }),
            info: t('Drei bis vier Wochen nach der Bildung: legt die junge Königin? Wenn nicht, '
              + 'Weiselprobe mit offener Brut aus einem anderen Volk.'),
            kategorie: 'koenigin', wichtig: true,
            von: iso(addDays(parseISO(datum), 21)),
            bis: iso(addDays(parseISO(datum), 35)),
            ziele: [{ typ: 'volk', id: neuV.id, name }],
          });
          gemacht += 1;
        }
        sheetZu(); await datenLaden(); render();
        toast(t('{n} Ableger angelegt.', { n: gemacht }));
      };
    },
  });
}

function gruppeOeffnen(gruppe) {
  if (!gruppe.length) return;
  if (gruppe.length === 1) return aufgabeOeffnen(gruppe[0]);
  const a = gruppe[0];
  sheetAuf({
    titel: a.titel,
    unter: a.ziel.typ === 'stand' ? t2('{n} Stände betroffen', { n: gruppe.length })
      : t2('{n} Völker betroffen', { n: gruppe.length }),
    inhalt: `
      ${a.info ? `<div class="hinweis">${esc(a.info)}</div>` : ''}
      ${wetterBlockGruppeHTML(gruppe)}
      ${hilfeBlock(a)}
      ${a.checkliste.length ? `<ul class="checkliste">${a.checkliste.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${a.rechner === 'futter' ? `<div class="hinweis" style="border-color:var(--faellig)">
        Die Futtermenge hängt an Volksstärke und vorhandenem Vorrat und ist je Volk verschieden.
        Für den Rechner die Aufgabe einzeln über das jeweilige Volk öffnen.</div>` : ''}
      <label class="feld" data-typ="auswahlZiele"><span>Für welche erledigt?</span>
        <div class="chips" id="zielchips">${gruppe.map((x) =>
          `<button type="button" class="an" data-z="${x.ziel.id}">${esc(x.ziel.name)}</button>`).join('')}</div></label>
      <div class="trenner"></div>
      <label class="feld" data-key="datum" data-typ="wert"><span>Erledigt am</span>
        <input type="date" value="${iso(heute())}"></label>
      ${a.felder.map((f) => feldHTML(f)).join('')}
      <div class="mini" style="margin-bottom:10px">Die Werte gelten für alle ausgewählten.
        Einzeln erfassen? Dann über das jeweilige Volk gehen.</div>
      <div class="knopfreihe">
        <button class="knopf leise" data-skip>Überspringen</button>
        <button class="knopf" data-ok>Erledigt</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root, a.felder);
      root.querySelectorAll('#zielchips button').forEach((b) => {
        b.onclick = () => b.classList.toggle('an');
      });
      const speichern = async (status) => {
        const ids = [...root.querySelectorAll('#zielchips button.an')].map((b) => b.dataset.z);
        if (!ids.length) return toast('Nichts ausgewählt.');
        const werte = werteLesen(root);
        const datum = werte.datum || iso(heute());
        delete werte.datum;
        let neu = 0;
        for (const a2 of gruppe.filter((x) => ids.includes(x.ziel.id))) {
          if (a2.eigenId) { await eigenAbhaken(a2.eigenId, datum, werte.notiz || ''); continue; }
          await db.schreibe('erledigungen', {
            id: uid(), regelId: a2.regelId, zielTyp: a2.ziel.typ, zielId: a2.ziel.id,
            datum, status, daten: werte, jahr: parseISO(datum).getFullYear(),
          });
          if (status === 'erledigt' && a2.ziel.typ === 'volk') {
            neu += await ausloeserPruefen({
              daten: werte, zielTyp: 'volk', zielId: a2.ziel.id, zielName: a2.ziel.name, datum,
              kontext: { nachBehandlung: a2.regelId === 'behandlungserfolg' },
            });
          }
        }
        sheetZu(); await datenLaden(); render();
        toast(neu ? t('{k} × erledigt, {n} neue Aufgaben.', { k: ids.length, n: neu })
          : t('{k} × erledigt.', { k: ids.length }));
      };
      root.querySelector('[data-ok]').onclick = () => speichern('erledigt');
      root.querySelector('[data-skip]').onclick = () => speichern('uebersprungen');
    },
  });
}

function eigeneAufgabeSheet() {
  sheetAuf({
    titel: 'Eigene Aufgabe',
    unter: 'Gilt für ein Volk, einen Stand oder die ganze Imkerei.',
    inhalt: `
      ${feldHTML({ key: 'titel', label: 'Aufgabe', platzhalter: 'z. B. Mittelwände bestellen' })}
      ${feldHTML({ key: 'info', label: 'Beschreibung', typ: 'mehrzeilig' })}
      ${feldHTML({ key: 'kategorie', label: 'Kategorie', typ: 'auswahl',
        optionen: Object.values(KATEGORIEN).map((k) => k.name), standard: 'Eigene' })}
      <label class="feld" data-typ="ziele"><span>Wofür?</span>
        <div class="chips" id="zielart">
          <button type="button" class="an" data-za="imkerei">ganze Imkerei</button>
          <button type="button" data-za="staende">alle Stände</button>
          <button type="button" data-za="voelker">alle Völker</button>
          <button type="button" data-za="auswahl">bestimmte Völker</button>
        </div></label>
      <div id="volkauswahl" hidden><div class="chips">
        ${S.voelker.map((v) => `<button type="button" data-v="${v.id}">${esc(v.name)}</button>`).join('')}
      </div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${feldHTML({ key: 'von', label: 'Ab', typ: 'datum' }, iso(heute()))}
        ${feldHTML({ key: 'bis', label: 'Bis', typ: 'datum' }, iso(addDays(heute(), 14)))}
      </div>
      ${feldHTML({ key: 'wichtig', label: 'Wichtig', typ: 'jaNein' })}
      <div class="knopfreihe"><button class="knopf" data-ok>Anlegen</button></div>`,
    danach(root) {
      felderVerdrahten(root);
      const auswahl = root.querySelector('#volkauswahl');
      root.querySelectorAll('#zielart button').forEach((b) => {
        b.onclick = () => {
          root.querySelectorAll('#zielart button').forEach((x) => x.classList.remove('an'));
          b.classList.add('an');
          auswahl.hidden = b.dataset.za !== 'auswahl';
        };
      });
      root.querySelectorAll('#volkauswahl button').forEach((b) => {
        b.onclick = () => b.classList.toggle('an');
      });
      root.querySelector('[data-ok]').onclick = async () => {
        const w = werteLesen(root);
        if (!w.titel) return toast('Bitte einen Titel eingeben.');
        const art = root.querySelector('#zielart button.an').dataset.za;
        let ziele = [{ typ: 'imkerei', id: 'imkerei', name: 'Imkerei' }];
        if (art === 'staende') ziele = S.standorte.map((s) => ({ typ: 'stand', id: s.id, name: s.name }));
        if (art === 'voelker') ziele = S.voelker.map((v) => ({ typ: 'volk', id: v.id, name: v.name }));
        if (art === 'auswahl') {
          const ids = [...root.querySelectorAll('#volkauswahl button.an')].map((b) => b.dataset.v);
          if (!ids.length) return toast('Kein Volk ausgewählt.');
          ziele = S.voelker.filter((v) => ids.includes(v.id)).map((v) => ({ typ: 'volk', id: v.id, name: v.name }));
        }
        const katKey = Object.entries(KATEGORIEN).find(([, k]) => k.name === w.kategorie)?.[0] || 'eigene';
        await eigeneAnlegen({
          titel: w.titel, info: w.info, kategorie: katKey, wichtig: w.wichtig === 'ja',
          von: w.von || iso(heute()), bis: w.bis || iso(addDays(heute(), 14)), ziele,
        });
        sheetZu(); await datenLaden(); render();
        toast(t('Aufgabe für {n} Ziele angelegt.', { n: ziele.length }));
      };
    },
  });
}


// ------------------------------------------------------- Umzug / Wanderung

/** Ein Volk auf einen anderen Stand setzen und den Wechsel festhalten. */
export async function volkUmziehen(volkId, nachStandortId, datum, notiz = '') {
  const v = S.voelker.find((x) => x.id === volkId);
  if (!v || v.standortId === nachStandortId) return null;
  const w = await db.schreibe('wanderungen', {
    id: uid(), volkId, vonStandortId: v.standortId, nachStandortId, datum, notiz,
    // Namen mitschreiben, damit der Verlauf lesbar bleibt, auch wenn ein
    // Standort später gelöscht wird
    vonName: standortName(v.standortId) || '', nachName: standortName(nachStandortId) || '',
  });
  await db.schreibe('voelker', { ...v, standortId: nachStandortId });
  return w;
}

function umzugSheet(volkId) {
  const v = S.voelker.find((x) => x.id === volkId);
  const andere = S.standorte.filter((s) => s.id !== v.standortId);
  if (!andere.length) {
    return sheetAuf({
      titel: 'Umziehen',
      unter: 'Es gibt nur einen Bienenstand.',
      inhalt: `<div class="hinweis">Lege zuerst einen zweiten Bienenstand an, dann kannst du
        Völker dorthin umziehen.</div>
        <div class="knopfreihe"><button class="knopf" data-neu>Bienenstand anlegen</button></div>`,
      danach(root) { root.querySelector('[data-neu]').onclick = () => standortSheet(); },
    });
  }
  const frueher = S.wanderungen.filter((w) => w.volkId === volkId)
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));
  sheetAuf({
    titel: 'Umziehen / wandern',
    unter: `${v.name} · ` + t2('steht auf „{ort}“', { ort: standortName(v.standortId) || '–' }),
    inhalt: `
      <div class="hinweis">Die gesamte Historie bleibt beim Volk – Durchsichten, Behandlungen,
        Ernten. Ab dem Umzugsdatum rechnet BeeWise Tracht und Wetter für den neuen Standort.</div>
      <label class="feld" data-key="ziel" data-typ="wert"><span>Neuer Standort</span>
        <select>${andere.map((st) => `<option value="${st.id}">${esc(st.name)}</option>`).join('')}</select></label>
      ${feldHTML({ key: 'datum', label: 'Datum des Umzugs', typ: 'datum' }, iso(heute()))}
      ${feldHTML({ key: 'notiz', label: 'Notiz', platzhalter: 'z. B. Wanderung zur Lindentracht' })}
      ${frueher.length ? `<div class="mini" style="margin-top:6px">Bisherige Umzüge:
        ${frueher.map((w) => `${fmtDatum(w.datum)} ${esc(w.vonName || '?')} → ${esc(w.nachName || '?')}`).join(' · ')}</div>` : ''}
      <div class="knopfreihe"><button class="knopf" data-ok>Umzug eintragen</button></div>`,
    danach(root) {
      felderVerdrahten(root);
      root.querySelector('[data-ok]').onclick = async () => {
        const w = werteLesen(root);
        const ziel = root.querySelector('[data-key=ziel] select').value;
        await volkUmziehen(volkId, ziel, w.datum || iso(heute()), w.notiz || '');
        sheetZu(); await datenLaden(); render(); trachtLaden({ still: true });
        toast(t('Umgezogen nach {ort}.', { ort: standortName(ziel) }));
      };
    },
  });
}

/** Standort löschen – vorher entscheiden, was mit den Völkern passiert. */
function standortLoeschenSheet(st) {
  const voelker = S.voelker.filter((v) => v.standortId === st.id);
  const andere = S.standorte.filter((s) => s.id !== st.id);

  if (!voelker.length) {
    return bestaetige(t2('Bienenstand „{name}“ wirklich löschen?', { name: st.name })).then(async (ja) => {
      if (!ja) return;
      await db.loesche('standorte', st.id);
      await datenLaden(); render(); toast('Bienenstand gelöscht.');
    });
  }

  sheetAuf({
    titel: t2('Bienenstand „{name}“ löschen', { name: st.name }),
    unter: t2('{n} Völker stehen hier: {liste}', { n: voelker.length, liste: voelker.map((v) => v.name).join(', ') }),
    inhalt: `
      <div class="hinweis">Was soll mit den Völkern passieren? Beim Umziehen bleibt die
        gesamte Historie erhalten – der Wechsel wird als Wanderung eingetragen.</div>
      <label class="feld" data-typ="wahl"><span>Vorgehen</span>
        <div class="chips" id="wahl">
          ${andere.length ? '<button type="button" class="an" data-w="umziehen">Völker umziehen</button>' : ''}
          <button type="button" ${andere.length ? '' : 'class="an"'} data-w="mit">Völker mitlöschen</button>
        </div></label>
      ${andere.length ? `<div id="zielbox">
        <label class="feld" data-key="ziel" data-typ="wert"><span>Neuer Standort für alle</span>
          <select>${andere.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
        ${feldHTML({ key: 'datum', label: 'Datum des Umzugs', typ: 'datum' }, iso(heute()))}
      </div>` : `<div class="hinweis" style="border-color:var(--ueberfaellig)">
        Es gibt keinen zweiten Bienenstand. Lege erst einen an, wenn du die Völker behalten willst.</div>`}
      <div class="knopfreihe">
        <button class="knopf leise" data-abbruch>Abbrechen</button>
        <button class="knopf gefahr" data-ok>Löschen</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root);
      const box = root.querySelector('#zielbox');
      let wahl = andere.length ? 'umziehen' : 'mit';
      root.querySelectorAll('#wahl button').forEach((b) => {
        b.onclick = () => {
          root.querySelectorAll('#wahl button').forEach((x) => x.classList.remove('an'));
          b.classList.add('an');
          wahl = b.dataset.w;
          if (box) box.hidden = wahl !== 'umziehen';
          root.querySelector('[data-ok]').textContent =
            wahl === 'umziehen' ? t2('Umziehen und löschen') : t2('Völker mitlöschen');
        };
      });
      root.querySelector('[data-ok]').textContent =
        wahl === 'umziehen' ? t2('Umziehen und löschen') : t2('Völker mitlöschen');
      root.querySelector('[data-abbruch]').onclick = () => sheetZu();
      root.querySelector('[data-ok]').onclick = async () => {
        if (wahl === 'umziehen') {
          const ziel = root.querySelector('[data-key=ziel] select').value;
          const datum = root.querySelector('[data-key=datum] input').value || iso(heute());
          for (const v of voelker) await volkUmziehen(v.id, ziel, datum, `Auflösung ${st.name}`);
          await db.loesche('standorte', st.id);
          sheetZu(); await datenLaden(); render(); trachtLaden({ still: true });
          toast(t('{n} Völker umgezogen, Bienenstand gelöscht.', { n: voelker.length }));
        } else {
          sheetZu();
          if (!await bestaetige(t('Wirklich {n} Völker mit ihrer gesamten Historie löschen?', { n: voelker.length }),
            'Ja, alles löschen')) return;
          for (const v of voelker) await db.loesche('voelker', v.id);
          await db.loesche('standorte', st.id);
          await datenLaden(); render();
          toast(t('Bienenstand und {n} Völker gelöscht.', { n: voelker.length }));
        }
      };
    },
  });
}

// ------------------------------------------------------------------ Berichte

function protokollSheet() {
  const jahre = [...new Set(S.erledigungen.map((e) => parseISO(e.datum).getFullYear()))]
    .sort((a, b) => b - a);
  if (!jahre.length) jahre.push(new Date().getFullYear());
  sheetAuf({
    titel: 'Behandlungsprotokoll als PDF',
    unter: 'Varroabehandlungen, Befallskontrollen und biotechnische Maßnahmen eines Jahres.',
    inhalt: `
      ${feldHTML({ key: 'jahr', label: 'Saison', typ: 'auswahl', optionen: jahre.map(String) }, String(jahre[0]))}
      ${feldHTML({ key: 'imkerei', label: 'Imkerei (erscheint im Kopf)', platzhalter: 'Name, Ort' },
        S.imkereiName || '')}
      <div class="knopfreihe"><button class="knopf" data-ok>PDF erstellen</button></div>`,
    danach(root) {
      felderVerdrahten(root);
      root.querySelector('[data-ok]').onclick = async () => {
        const w = werteLesen(root);
        const jahr = Number(w.jahr) || jahre[0];
        if (w.imkerei) { S.imkereiName = w.imkerei; await db.metaSchreibe('imkerei', w.imkerei); }
        behandlungsprotokoll(S, { jahr, imkerei: w.imkerei || '' })
          .herunterladen(`behandlungsprotokoll-${jahr}.pdf`);
        sheetZu(); toast('PDF erstellt.');
      };
    },
  });
}


/** QR-Aufkleber für die Beuten – bewusst unauffällig unter „Berichte". */
function etikettenSheet() {
  const basis = grundadresse();
  const staende = S.standorte.filter((st) => S.voelker.some((v) => v.standortId === st.id));
  sheetAuf({
    titel: 'QR-Aufkleber für die Beuten',
    unter: 'Kamera des Handys darauf halten – die Stockkarte dieses Volkes geht auf.',
    inhalt: `
      <div class="hinweis">Ein Aufkleber je Volk, zwei Spalten auf A4. Am besten auf
        Klebefolie drucken oder einschweißen – im Stockbereich wird alles feucht.
        Gescannt wird mit der normalen Kamera-App, die App braucht dafür keine Rechte.</div>
      ${basis ? '' : `<div class="hinweis" style="border-color:var(--ueberfaellig)">
        Die App läuft gerade nicht unter einer Web-Adresse. Trage unten die Adresse ein,
        unter der du BeeWise am Handy öffnest – sonst zeigt der Aufkleber ins Leere.</div>`}
      ${feldHTML({ key: 'wo', label: 'Welche Völker', typ: 'auswahl',
        optionen: ['alle Völker', ...staende.map((st) => st.name)] }, 'alle Völker')}
      ${feldHTML({ key: 'basis', label: 'Adresse der App',
        platzhalter: 'https://benutzername.github.io/BeeWise/',
        hinweis: 'Diese Adresse öffnet der Aufkleber. Muss die veröffentlichte sein, '
          + 'nicht die Datei auf dem PC.' }, basis)}
      <div class="knopfreihe"><button class="knopf" data-ok>PDF erstellen</button></div>`,
    danach(root) {
      felderVerdrahten(root);
      root.querySelector('[data-ok]').onclick = () => {
        const w = werteLesen(root);
        const adresse = String(w.basis || '').trim();
        if (!/^https?:\/\//.test(adresse)) return toast('Bitte eine vollständige Web-Adresse eintragen.');
        const st = staende.find((x) => x.name === w.wo);
        const liste = st ? S.voelker.filter((v) => v.standortId === st.id) : S.voelker;
        if (!liste.length) return toast('Keine Völker ausgewählt.');
        try {
          etikettenPDF(liste, {
            basis: adresse,
            standortName: (v) => standortName(v.standortId) || '',
          }).herunterladen(`beewise-aufkleber-${iso(heute())}.pdf`);
          sheetZu();
          toast(t('{n} Aufkleber erstellt.', { n: liste.length }));
        } catch (f) {
          fehlerZeigen('Aufkleber', f);
        }
      };
    },
  });
}

/**
 * Aufkleber gescannt: die Adresse trägt die Kennung des Volkes im Ankerteil.
 * Der Anker wird danach entfernt, damit ein späteres Neuladen nicht wieder
 * dorthin springt.
 */
function tiefenlinkPruefen() {
  const treffer = String(location.hash || '').match(/volk=([\w-]+)/);
  if (!treffer) return false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* egal */ }
  const v = S.voelker.find((x) => x.id === treffer[1]);
  if (!v) {
    toast('Zu diesem Aufkleber gibt es auf diesem Gerät kein Volk – fehlt der Abgleich?');
    return false;
  }
  gehe('volk', v.id);
  return true;
}

// -------------------------------------------------------------------- Abgleich

function syncSheet() {
  sync.einstellungen().then((e) => {
    sheetAuf({
      titel: 'Abgleich zwischen Geräten',
      unter: 'Über ein privates GitHub-Repository – kostenlos, ohne eigenen Server.',
      inhalt: `
        <div class="hinweis">So richtest du es ein:<br>
          <b>1.</b> Auf github.com ein <b>privates</b> Repository anlegen, z. B. <code>beewise-daten</code>.
          Nicht dasselbe wie die veröffentlichte App – dort lägen deine Daten sonst offen.<br>
          <b>2.</b> Schlüssel erzeugen. Achtung: das geschieht in den <b>Kontoeinstellungen</b>,
          nicht im Repository. Direkter Weg:
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">
          github.com/settings/personal-access-tokens/new</a> – oder Profilbild oben rechts →
          Settings → ganz unten <b>Developer settings</b> → Personal access tokens →
          <b>Fine-grained tokens</b> → Generate new token.<br>
          Dort einstellen: <b>Only select repositories</b> → dein Datenrepository,
          und unter Repository permissions <b>Contents: Read and write</b>.<br>
          <b>3.</b> Schlüssel hier eintragen, Verbindung prüfen, speichern.
          Danach auf dem zweiten Gerät dasselbe eintragen.</div>
        ${feldHTML({ key: 'repo', label: 'Repository', platzhalter: 'benutzername/beewise-daten' }, e.repo)}
        ${feldHTML({ key: 'token', label: 'Zugriffsschlüssel', platzhalter: 'github_pat_…' }, e.token)}
        ${feldHTML({ key: 'geraet', label: 'Name dieses Geräts', platzhalter: 'Handy oder PC' }, e.geraet)}
        <details><summary class="mini">Weitere Einstellungen</summary>
          ${feldHTML({ key: 'pfad', label: 'Dateipfad im Repository' }, e.pfad)}
          ${feldHTML({ key: 'zweig', label: 'Branch' }, e.zweig)}
        </details>
        <div class="mini" style="margin:8px 0">Der Schlüssel liegt unverschlüsselt auf diesem Gerät.
          Deshalb nur ein fein abgestufter Schlüssel für genau dieses eine private Repository.
          Bei Verlust des Geräts auf github.com widerrufen.</div>
        <div class="knopfreihe">
          <button class="knopf leise" data-pruefen>Verbindung prüfen</button>
          <button class="knopf" data-ok>Speichern</button>
        </div>
        ${e.token ? '<div class="knopfreihe"><button class="knopf leise klein loeschen" data-aus>Abgleich abschalten</button></div>' : ''}
        <div id="syncstatus" class="mini" style="margin-top:8px"></div>`,
      danach(root) {
        felderVerdrahten(root);
        const status = root.querySelector('#syncstatus');
        const lesen = () => {
          const w = werteLesen(root);
          return { ...e, ...w };
        };
        root.querySelector('[data-pruefen]').onclick = async () => {
          status.textContent = 'Prüfe …';
          try {
            const r = await sync.pruefen(lesen());
            status.innerHTML = `Verbindung steht: <b>${esc(r.name)}</b>`
              + (r.privat ? ' (privat)' : ' <b style="color:var(--ueberfaellig)">– Achtung, öffentlich!</b>');
          } catch (f) { status.innerHTML = `<b style="color:var(--ueberfaellig)">${esc(f.message)}</b>`; }
        };
        root.querySelector('[data-ok]').onclick = async () => {
          await sync.einstellungenSpeichern({ ...lesen(), aktiv: true });
          sheetZu(); render(); toast('Abgleich eingerichtet.');
        };
        root.querySelector('[data-aus]')?.addEventListener('click', async () => {
          await sync.einstellungenSpeichern({ aktiv: false, token: '' });
          sheetZu(); render(); toast('Abgleich abgeschaltet.');
        });
      },
    });
  });
}

async function syncAusfuehren() {
  toast('Abgleich läuft …');
  try {
    const r = await sync.abgleichen({ beiSchritt: (t) => toast(t) });
    await datenLaden(); render();
    toast(r.erstmalig ? 'Erste Übertragung abgeschlossen.'
      : t('Abgeglichen: {neu} neu, {alt} aktualisiert.', { neu: r.neu, alt: r.aktualisiert }));
  } catch (f) {
    toast(t('Abgleich fehlgeschlagen: {grund}', { grund: f.message }));
  }
}

// ------------------------------------------------------------ Standort-Sheet

function standortSheet(st = null) {
  sheetAuf({
    titel: st ? 'Bienenstand bearbeiten' : 'Bienenstand anlegen',
    unter: 'Adresse eingeben, Position übernehmen oder im Luftbild lange tippen.',
    inhalt: `
      ${feldHTML({ key: 'name', label: 'Name', platzhalter: 'z. B. Hausgarten' }, st?.name)}
      <label class="feld" data-key="adresse" data-typ="wert"><span>Adresse</span>
        <div class="suchzeile">
          <input type="text" value="${esc(st?.adresse || '')}" placeholder="Straße, PLZ Ort">
          <button type="button" class="knopf klein" data-suchen>Suchen</button>
        </div></label>
      <div id="treffer"></div>
      <div class="minikarte" id="minikarte"></div>
      <div class="knopfreihe">
        <button class="knopf leise klein" data-gps>Aktuelle Position</button>
        <button class="knopf leise klein" data-adresse-aus-karte>Adresse zur Markierung</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
        ${feldHTML({ key: 'lat', label: 'Breitengrad' }, st?.lat)}
        ${feldHTML({ key: 'lon', label: 'Längengrad' }, st?.lon)}
      </div>
      ${feldHTML({ key: 'notiz', label: 'Notiz', platzhalter: 'Zufahrt, Trachtangebot, Besonderheiten' }, st?.notiz)}
      <div class="knopfreihe">
        ${st ? '<button class="knopf gefahr" data-del>Löschen</button>' : ''}
        <button class="knopf" data-ok>Speichern</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root);
      const latEl = root.querySelector('[data-key=lat] input');
      const lonEl = root.querySelector('[data-key=lon] input');
      const adrEl = root.querySelector('[data-key=adresse] input');

      // Speichern wird als ERSTES verdrahtet. Sollte weiter unten etwas
      // schiefgehen (Karte, Adressdienst), bleibt der Knopf trotzdem bedienbar.
      root.querySelector('[data-ok]').onclick = async () => {
        try {
          const w = werteLesen(root);
          if (!w.name) { toast('Bitte einen Namen vergeben.'); return; }
          await db.schreibe('standorte', {
            ...(st || {}), id: st?.id || uid(), name: w.name, adresse: w.adresse || '',
            lat: w.lat ? parseFloat(String(w.lat).replace(',', '.')) : null,
            lon: w.lon ? parseFloat(String(w.lon).replace(',', '.')) : null,
            notiz: w.notiz || '',
          });
          sheetZu(); await datenLaden(); render(); trachtLaden({ still: true });
          toast('Standort gespeichert.');
        } catch (f) {
          console.error(f);
          toast(t('Speichern fehlgeschlagen: {grund}', { grund: f?.message || f }));
        }
      };

      let karte = null;
      try {
        karte = MiniKarte(root.querySelector('#minikarte'), {
          lat: st?.lat ?? null, lon: st?.lon ?? null,
          beiWahl: (lat, lon) => {
            latEl.value = lat.toFixed(5); lonEl.value = lon.toFixed(5);
            toast('Standort gesetzt.');
          },
        });
      } catch (f) {
        console.error('Karte konnte nicht aufgebaut werden:', f);
        root.querySelector('#minikarte').innerHTML =
          '<div class="mini" style="padding:14px">Luftbild nicht verfügbar. '
          + 'Koordinaten unten von Hand eintragen oder GPS verwenden.</div>';
      }

      root.querySelector('[data-suchen]').onclick = async () => {
        const q = adrEl.value.trim();
        if (!q) return;
        const box = root.querySelector('#treffer');
        box.innerHTML = '<div class="mini">Suche läuft …</div>';
        try {
          const treffer = await adresseSuchen(q);
          if (!treffer.length) { box.innerHTML = '<div class="mini">Nichts gefunden.</div>'; return; }
          box.innerHTML = treffer.map((tr, i) =>
            `<button type="button" class="treffer" data-i="${i}">${esc(tr.name)}</button>`).join('');
          box.querySelectorAll('.treffer').forEach((bt) => {
            bt.onclick = () => {
              const tr = treffer[Number(bt.dataset.i)];
              latEl.value = tr.lat.toFixed(5); lonEl.value = tr.lon.toFixed(5);
              adrEl.value = tr.name;
              karte?.setzen(tr.lat, tr.lon, 17);
              box.innerHTML = '';
            };
          });
        } catch {
          box.innerHTML = '<div class="mini">Adresssuche nicht erreichbar – bitte die Position '
            + 'im Luftbild setzen oder GPS verwenden.</div>';
        }
      };

      root.querySelector('[data-gps]').onclick = () => {
        if (!navigator.geolocation) return toast('Keine Ortung verfügbar.');
        toast('Position wird ermittelt …');
        navigator.geolocation.getCurrentPosition((pos) => {
          latEl.value = pos.coords.latitude.toFixed(5);
          lonEl.value = pos.coords.longitude.toFixed(5);
          karte?.setzen(pos.coords.latitude, pos.coords.longitude, 18);
          toast('Position übernommen.');
        }, () => toast('Position konnte nicht ermittelt werden.'),
        { timeout: 8000, enableHighAccuracy: true });
      };

      root.querySelector('[data-adresse-aus-karte]').onclick = async () => {
        if (!latEl.value) return toast('Erst eine Position setzen.');
        try {
          const gefunden = await adresseZuKoordinaten(latEl.value, lonEl.value);
          if (gefunden) { adrEl.value = gefunden; toast('Adresse übernommen.'); }
        } catch { toast('Adressdienst nicht erreichbar.'); }
      };

      root.querySelector('[data-del]')?.addEventListener('click', () => {
        sheetZu();
        standortLoeschenSheet(st);
      });
    },
  });
}

// ---------------------------------------------------------------- Volk-Sheet

function volkSheet(v = null) {
  if (!S.standorte.length) { toast('Bitte zuerst einen Standort anlegen.'); return standortSheet(); }
  const j = new Date().getFullYear();
  sheetAuf({
    titel: v ? 'Volk bearbeiten' : 'Volk anlegen',
    inhalt: `
      ${feldHTML({ key: 'name', label: 'Bezeichnung', platzhalter: 'z. B. 1 oder Blaue Beute' }, v?.name)}
      <label class="feld" data-key="standortId" data-typ="wert"><span>Standort</span>
        <select>${S.standorte.map((s) => `<option value="${s.id}"${v?.standortId === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${feldHTML({ key: 'koeniginJahr', label: 'Königin Jahrgang', typ: 'auswahl', optionen: [j, j - 1, j - 2, j - 3, j - 4].map(String) }, v?.koeniginJahr)}
        ${feldHTML({ key: 'zargen', label: 'Zargen', typ: 'zahl', einheit: 'Stück', schritt: 1 }, v?.zargen)}
      </div>
      ${feldHTML({ key: 'beute', label: 'Beute / Rähmchenmaß', typ: 'auswahl', optionen: ['Zander', 'Deutsch Normal', 'Dadant', 'Langstroth', 'Segeberger', 'anderes'] }, v?.beute)}
      ${feldHTML({ key: 'herkunft', label: 'Herkunft', typ: 'auswahl',
        optionen: ['Ableger', 'Kunstschwarm', 'Schwarm', 'gekauft', 'Wirtschaftsvolk', 'unbekannt'] }, v?.herkunft)}
      <label class="feld" data-key="mutterVolkId" data-typ="wert"><span>Muttervolk (Abstammung)</span>
        <select><option value="">${esc(t2('unbekannt'))}</option>
        ${S.voelker.filter((x) => x.id !== v?.id).map((x) =>
          `<option value="${x.id}"${v?.mutterVolkId === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}
        </select></label>
      ${feldHTML({ key: 'gebildetAm', label: 'Gebildet am', typ: 'datum',
        hinweis: 'Nur bei Ablegern und Schwärmen. Im Jahr der Bildung rechnet die App mit '
          + 'Jungvolk – weniger Winterfutter, kein Honigraum.' }, v?.gebildetAm)}
      ${feldHTML({ key: 'notiz', label: 'Notiz' }, v?.notiz)}
      <div class="knopfreihe">
        ${v ? '<button class="knopf gefahr" data-del>Löschen</button>' : ''}
        <button class="knopf" data-ok>Speichern</button>
      </div>`,
    danach(root) {
      felderVerdrahten(root);
      root.querySelector('[data-ok]').onclick = async () => {
        const w = werteLesen(root);
        if (!w.name) return toast('Bitte eine Bezeichnung vergeben.');
        const mutter = root.querySelector('[data-key=mutterVolkId] select').value || null;
        const gespeichert = await db.schreibe('voelker', {
          ...(v || {}), id: v?.id || uid(), status: 'aktiv', ...w, mutterVolkId: mutter,
        });
        sheetZu(); await datenLaden();
        // Beim neuen Volk gleich die Königin erfassen – dort steckt der Jahrgang,
        // die Herkunft und später das Umweiseln dran.
        if (!v && w.koeniginJahr) {
          koeniginSheet(gespeichert.id);
        } else { render(); }
        toast('Volk gespeichert.');
      };
      root.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (!await bestaetige('Volk wirklich löschen? Der Verlauf geht mit verloren.')) return;
        await db.loesche('voelker', v.id);
        sheetZu(); gehe('voelker'); await datenLaden(); render(); toast('Gelöscht.');
      });
    },
  });
}

/** Foto aufnehmen oder wählen, verkleinert speichern. */
function volksbildWaehlen(volkId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = () => {
    const datei = inp.files?.[0];
    if (!datei) return;
    const bild = new Image();
    bild.onload = async () => {
      const kante = 640;
      const s = Math.min(1, kante / Math.max(bild.width, bild.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bild.width * s); c.height = Math.round(bild.height * s);
      c.getContext('2d').drawImage(bild, 0, 0, c.width, c.height);
      const v = S.voelker.find((x) => x.id === volkId);
      await db.schreibe('voelker', { ...v, foto: c.toDataURL('image/jpeg', 0.72) });
      URL.revokeObjectURL(bild.src);
      await datenLaden(); render(); toast('Foto gespeichert.');
    };
    bild.src = URL.createObjectURL(datei);
  };
  inp.click();
}

// ----------------------------------------------------------------- Durchsicht

const DURCHSICHT_FELDER = [
  { key: 'wabengassen', label: 'Von Bienen besetzte Wabengassen', typ: 'zahl', einheit: 'Gassen', schritt: 1,
    hinweis: 'Gassen zählen, in denen Bienen sitzen – nicht die Futterwaben. '
      + 'Grundlage für Erweitern, Einwintern und den Futterbedarf.' },
  { key: 'brut', label: 'Brutbild', typ: 'chips', optionen: ['Stifte', 'offene Brut', 'verdeckelte Brut', 'brutfrei', 'lückig', 'drohnenbrütig'] },
  { key: 'koenigin', label: 'Königin', typ: 'chips', optionen: ['gesehen', 'nicht gesehen', 'weiselrichtig', 'weisellos'] },
  { key: 'zellen', label: 'Weiselzellen', typ: 'zahl', einheit: 'Stück', schritt: 1 },
  { key: 'stimmung', label: 'Schwarmstimmung', typ: 'chips', optionen: ['keine', 'Spielnäpfchen', 'bestiftet', 'verdeckelt'] },
  { key: 'sanftmut', label: 'Sanftmut', typ: 'zahl', einheit: '1 stechlustig … 5 sanft', schritt: 1 },
  { key: 'futter', label: 'Futtervorrat', typ: 'zahl', einheit: 'kg (geschätzt)', schritt: 1,
    hinweis: 'Voll verdeckelte Zanderwabe ≈ 2 kg, halbe ≈ 1 kg.' },
  { key: 'honigraeume', label: 'Honigräume', typ: 'zahl', einheit: 'Stück', schritt: 1 },
  { key: 'milbenProTag', label: 'Natürlicher Milbenfall', typ: 'zahl', einheit: 'Milben pro Tag', schritt: 0.5,
    hinweis: 'Über der Monatsschwelle legt die App selbstständig eine Behandlungsaufgabe an.' },
  { key: 'notiz', label: 'Notiz' },
];

function durchsichtSheet(volkId) {
  const v = S.voelker.find((x) => x.id === volkId);
  const letzte = letzteDurchsicht(volkId);
  const monat = new Date().getMonth() + 1;
  sheetAuf({
    titel: 'Durchsicht',
    unter: `${v.name}${letzte ? ' · ' + t2('zuletzt {d} (vor {n} Tagen)', { d: fmtDatum(letzte.datum), n: diffTage(heute(), parseISO(letzte.datum)) }) : ''}`,
    inhalt: `
      <div class="mini" style="margin-bottom:10px">${t2('Alarmschwelle Milbenfall in diesem Monat: {n} pro Tag.', { n: varroaSchwelle(monat) })}</div>
      <label class="feld" data-key="datum" data-typ="wert"><span>Datum</span>
        <input type="date" value="${iso(heute())}"></label>
      ${DURCHSICHT_FELDER.map((f) => feldHTML(f)).join('')}
      ${fotoFeldHTML()}
      <div class="knopfreihe"><button class="knopf" data-ok>Speichern</button></div>`,
    beimSchliessen: fotoPufferLeeren,
    danach(root) {
      felderVerdrahten(root, DURCHSICHT_FELDER);
      fotoFeldVerdrahten(root);
      root.querySelector('[data-ok]').onclick = async () => {
        const w = werteLesen(root);
        const datum = w.datum || iso(heute());
        const d = await db.schreibe('durchsichten', { id: uid(), volkId, ...w, datum });
        await fotoPufferSpeichern(volkId, d.id, datum);

        // Eine Durchsicht in der Schwarmzeit ist zugleich die Schwarmkontrolle.
        const sk = S.plan.find((a) => a.regelId === 'schwarmkontrolle' && a.ziel.id === volkId
          && ['faellig', 'ueberfaellig', 'bald'].includes(a.zustand));
        if (sk && (w.zellen != null || w.stimmung)) {
          await db.schreibe('erledigungen', {
            id: uid(), regelId: 'schwarmkontrolle', zielTyp: 'volk', zielId: volkId,
            datum, status: 'erledigt',
            daten: { zellen: w.zellen, stimmung: w.stimmung }, jahr: parseISO(datum).getFullYear(),
          });
        }
        const neu = await ausloeserPruefen({
          daten: w, zielTyp: 'volk', zielId: volkId, zielName: v.name, datum,
        });
        sheetZu(); await datenLaden(); render();
        toast(neu ? t('Durchsicht gespeichert. {n} neue Aufgaben angelegt.', { n: neu })
          : 'Durchsicht gespeichert.');
      };
    },
  });
}

// ------------------------------------------------------------- Tracht-Sheet

async function bluetenAntwort(standortId, art, status, datum = iso(heute())) {
  const jahr = parseISO(datum).getFullYear();
  const standort = S.standorte.find((s) => s.id === standortId);
  const vorhanden = S.trachtObs.filter((o) => o.standortId === standortId
    && o.art === art && o.jahr === jahr);

  if (status === 'loeschen') {
    for (const o of vorhanden) await db.loesche('tracht', o.id);
  } else {
    for (const o of vorhanden.filter((x) => x.status === status)) await db.loesche('tracht', o.id);
    // Wärmesumme mitspeichern: daraus lernt das Modell für die Folgejahre.
    const gdd = status === 'start' ? await waermesummeAm(standort, datum) : null;
    await db.schreibe('tracht', {
      id: uid(), standortId, art, status, datum, jahr, quelle: 'imker',
      ...(gdd != null ? { gdd } : {}),
    });
  }
  S.trachtObs = await db.alle('tracht');
  await trachtLaden({ still: true });
  await datenLaden();
  render();
  toast(status === 'start' ? 'Notiert – abhängige Termine wurden nachgezogen.' : 'Notiert.');
}

function eintragMenu(ref) {
  const [art, id] = ref.split(':');
  sheetAuf({
    titel: 'Eintrag',
    inhalt: '<div class="knopfreihe"><button class="knopf gefahr" data-del>Eintrag löschen</button></div>',
    danach(root) {
      root.querySelector('[data-del]').onclick = async () => {
        const store = { durchsicht: 'durchsichten', erledigung: 'erledigungen',
          wanderung: 'wanderungen', koenigin: 'koeniginnen' }[art] || 'erledigungen';
        await db.loesche(store, id);
        sheetZu(); await datenLaden(); render(); toast('Eintrag gelöscht.');
      };
    },
  });
}


/** Speicherverbrauch der Fotos anzeigen – nachträglich, weil er gelesen werden muss. */
function fotobilanzZeigen() {
  const el = AN.querySelector('#fotobilanz');
  if (!el) return;
  const wahl = AN.querySelector('[data-fotokante]');
  fotos.kanteLesen().then((k) => { if (wahl) wahl.value = String(k); });
  fotos.bilanz().then((b) => {
    el.textContent = b.anzahl
      ? t('Fotos: {n} · etwa {gr}', { n: b.anzahl, gr: fotos.groesse(b.bytes) })
      : t('Noch keine Fotos gespeichert.');
  }).catch(() => { el.textContent = ''; });
}

function fotosAufraeumenSheet() {
  fotos.bilanz().then((b) => {
    const jahre = Object.keys(b.jahre).sort();
    if (!jahre.length) return toast('Es gibt noch keine Fotos.');
    sheetAuf({
      titel: 'Alte Fotos löschen',
      unter: t2('Fotos: {n} · etwa {gr}', { n: b.anzahl, gr: fotos.groesse(b.bytes) }),
      inhalt: `
        <div class="hinweis">Gelöscht werden alle Fotos VOR dem gewählten Jahr. Die Durchsichten
          selbst bleiben vollständig erhalten – nur die Bilder verschwinden.</div>
        <div class="mini" style="margin-bottom:10px">${jahre.map((j) =>
        esc(t2('{jahr}: {n} Bilder', { jahr: j, n: b.jahre[j] }))).join(' · ')}</div>
        ${feldHTML({ key: 'grenze', label: 'Behalten ab Jahr', typ: 'auswahl', optionen: jahre },
        jahre[jahre.length - 1])}
        <div class="knopfreihe"><button class="knopf gefahr" data-ok>Löschen</button></div>`,
      danach(root) {
        felderVerdrahten(root);
        root.querySelector('[data-ok]').onclick = async () => {
          const grenze = Number(werteLesen(root).grenze);
          const weg = await fotos.aufraeumen(grenze);
          sheetZu(); render();
          toast(t('{n} Fotos gelöscht.', { n: weg }));
        };
      },
    });
  });
}

// ------------------------------------------------------------ Daten/Service

async function exportieren() {
  const dump = await db.exportAlles();
  const blob = new Blob([JSON.stringify(dump, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `beewise-${iso(heute())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Sicherung erstellt.');
}

function importieren() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const txt = await inp.files[0].text();
      await db.importAlles(JSON.parse(txt), { ersetzen: true });
      await datenLaden(); render(); trachtLaden({ still: true });
      toast('Sicherung eingespielt.');
    } catch { toast('Datei konnte nicht gelesen werden.'); }
  };
  inp.click();
}

async function allesLoeschen() {
  if (!await bestaetige('Wirklich alle Daten auf diesem Gerät löschen?')) return;
  for (const s of db.STORES) await db.leere(s);
  S.tracht = {}; S.wetter = {};
  await datenLaden(); gehe('heute'); toast('Alles gelöscht.');
}

async function benachrichtigungenAnfragen() {
  if (!('Notification' in window)) return toast('Dieses Gerät unterstützt keine Benachrichtigungen.');
  const r = await Notification.requestPermission();
  toast(r === 'granted' ? 'Erinnerungen sind aktiv.' : 'Erinnerungen wurden nicht erlaubt.');
  if (r === 'granted') erinnern();
}

function erinnern({ erzwingen = false } = {}) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') {
    if (erzwingen) toast('Meldungen sind nicht erlaubt.');
    return;
  }
  const m = S.meldungen || MELDUNGEN_STANDARD;
  const zeilen = [];

  if (m.faellig) {
    const z = zusammenfassung(S.plan);
    const n = z.ueberfaellig + z.faellig;
    if (n) {
      const erste = S.plan.find((a) => ['ueberfaellig', 'faellig'].includes(a.zustand));
      zeilen.push(t('{n} Aufgaben fällig', { n }) + ': ' + t(erste.titel)
        + (erste.ziel.typ === 'volk' ? ' – ' + erste.ziel.name : ''));
    }
  }
  if (m.warnungen) {
    const w = S.plan.filter((a) => a.quelle === 'auto'
      && ['ueberfaellig', 'faellig'].includes(a.zustand));
    if (w.length) zeilen.push(t('{n} Warnungen', { n: w.length }) + ': ' + t(w[0].titel));
  }
  if (m.tracht && S.fragen.length) {
    zeilen.push(t('Trachtfrage offen') + ': ' + t(S.fragen[0].name));
  }
  if (m.vorwarnung) {
    const grenze = Number(m.vorlaufTage) || 3;
    const bald = S.plan.filter((a) => a.wichtig && a.zustand === 'bald'
      && a.von && diffTage(a.von, heute()) <= grenze);
    if (bald.length) zeilen.push(t('Bald wichtig') + ': ' + t(bald[0].titel));
  }

  if (!zeilen.length) {
    if (erzwingen) toast('Im Moment gibt es nichts zu melden.');
    return;
  }
  if (!erzwingen) {
    // höchstens eine Meldung pro Tag, sonst wird die App zur Nervensäge
    try {
      if (localStorage.getItem('letzteErinnerung') === iso(heute())) return;
      localStorage.setItem('letzteErinnerung', iso(heute()));
    } catch { /* ohne localStorage halt jedes Mal */ }
  }
  new Notification('BeeWise', {
    body: zeilen.join('\n'),
    icon: 'icons/icon-192.png', tag: 'beewise-heute',
  });
}

async function beispieldaten() {
  const st1 = await db.schreibe('standorte', {
    id: uid(), name: 'Hausgarten', lat: 48.137, lon: 11.575,
    adresse: 'Marienplatz 1, 80331 München', notiz: 'Streuobst, Linden in der Allee',
  });
  const st2 = await db.schreibe('standorte', {
    id: uid(), name: 'Rapsacker Nord', lat: 48.31, lon: 11.41,
    adresse: 'Feldweg, 85375 Neufahrn', notiz: 'Wanderstand, Raps und Waldrand',
  });
  const j = new Date().getFullYear();
  const v = [];
  for (const [name, stId, kj] of [['1', st1.id, j - 1], ['2', st1.id, j], ['3', st1.id, j - 2],
    ['Nord 1', st2.id, j - 1], ['Nord 2', st2.id, j]]) {
    v.push(await db.schreibe('voelker', {
      id: uid(), name, standortId: stId, koeniginJahr: String(kj), zargen: 2,
      beute: 'Zander', status: 'aktiv', herkunft: 'Ableger ' + kj,
    }));
  }
  const erl = (regelId, zielId, tageZurueck, daten = {}) => db.schreibe('erledigungen', {
    id: uid(), regelId, zielTyp: 'volk', zielId, datum: iso(addDays(heute(), -tageZurueck)),
    status: 'erledigt', daten, jahr: j,
  });
  for (const volk of v.slice(0, 3)) {
    await erl('erste_durchsicht', volk.id, 150, { gassen: 6, brut: 'Stifte, offene Brut' });
    await erl('erweitern', volk.id, 120, { zargen: 2 });
    await erl('baurahmen', volk.id, 118);
    await erl('honigraum', volk.id, 110, { honigraeume: 1 });
    await erl('fruehtracht', volk.id, 80, { kg: 11.5, wasser: 16.8 });
    await erl('schwarmkontrolle', volk.id, 12, { zellen: 0, stimmung: 'keine' });
    await db.schreibe('durchsichten', {
      id: uid(), volkId: volk.id, datum: iso(addDays(heute(), -40)),
      wabengassen: 9, brut: 'Stifte, offene Brut, verdeckelte Brut', koenigin: 'gesehen', futter: 6,
    });
    await db.schreibe('durchsichten', {
      id: uid(), volkId: volk.id, datum: iso(addDays(heute(), -12)),
      wabengassen: 8, brut: 'verdeckelte Brut', koenigin: 'weiselrichtig', futter: 4,
    });
  }
  await erl('sommertracht', v[0].id, 9, { kg: 14 });
  await erl('sommerbehandlung1', v[0].id, 7, { praeparat: 'Ameisensäure 60 %', menge: 80 });
  await erl('auffuettern', v[0].id, 5, { kg: 8 });
  await datenLaden(); gehe('heute'); trachtLaden({ still: true });
  toast('Beispieldaten geladen.');
}

// ================================================================== Start

// Android/Chrome bietet die Installation über dieses Ereignis an; wir heben es
// auf und zeigen stattdessen einen eigenen Knopf unter „Mehr".
let installAufforderung = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installAufforderung = e;
  if (S.ansicht === 'mehr') render();
});

// Kommt die App nach längerer Pause wieder in den Vordergrund, ist die
// Stundenvorhersage meist veraltet. Der Abruf selbst ist billig: liegt ein
// frischer Stand im Zwischenspeicher, geht gar keine Anfrage ins Netz.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S.standorte.length) wetterLaden();
});

document.getElementById('tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (b) gehe(b.dataset.tab);
});

ZURUECK?.addEventListener('click', () => zurueck());

// Einmal anmelden, nicht bei jedem Bildaufbau: der Bereich bleibt derselbe,
// sonst würden sich die Zuhörer stapeln und ein Wisch mehrere Schritte machen.
wischenVerdrahten();

/** Beim allerersten Start nach der Sprache fragen – zweisprachig beschriftet. */
function spracheAbfragen() {
  return new Promise((fertig) => {
    const box = document.createElement('div');
    box.className = 'sprachstart';
    box.innerHTML = `<div class="sprachkarte">
      <img src="icons/icon-192.png" alt="" width="64" height="64">
      <h1>BeeWise</h1>
      <p>Choose your language<br><span>Sprache wählen</span></p>
      ${SPRACHEN.map((s) => `<button class="knopf${s.code === 'en' ? '' : ' leise'}"
        data-s="${s.code}">${s.eigen}</button>`).join('')}
      <small>Can be changed any time under „More“ · Jederzeit unter „Mehr“ änderbar</small>
    </div>`;
    document.body.appendChild(box);
    box.querySelectorAll('[data-s]').forEach((b) => {
      b.onclick = () => {
        spracheSetzen(b.dataset.s);
        box.remove();
        fertig();
      };
    });
  });
}

(async function start() {
  const { code, gewaehlt } = spracheErmitteln();
  document.documentElement.lang = code;
  uiInit();
  // Zurück-Taste: erst Fenster schließen (macht ui.js selbst), dann Unteransicht.
  zurueckFallbackSetzen(() => zurueck());
  ebenenQuelleSetzen(() => (UNTERANSICHT[S.ansicht] ? 1 : 0));
  if (!gewaehlt) await spracheAbfragen();
  await datenLaden();
  render();
  tiefenlinkPruefen();
  window.addEventListener('hashchange', tiefenlinkPruefen);
  trachtLaden({ still: true }).then(() => setTimeout(erinnern, 1200));
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

window.__beewise = { S, db, planBerechnen, datenLaden, render, trachtLaden, wetterLaden,
  gehe, zurueck, lage, aktionstag, sheetIstAuf, stundeBewerten, fensterText,
  standStarten, standWeiter, standBeenden, etikettenSheet, aufgabeOeffnen,
  get fotoPuffer() { return fotoPuffer; } };
