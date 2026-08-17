// Stand-Modus: der Durchgang am Bienenstand.
// =============================================================================
// Die übrige App ist zum Auswerten gebaut – hier geht es ums Erfassen, und zwar
// unter erschwerten Bedingungen: Handschuhe, Rauch, eine Hand am Rähmchen, Sonne
// auf dem Bildschirm. Daraus folgen drei Regeln für diesen Teil der Oberfläche:
//
//   1. Ein Volk je Bildschirm. Kein Suchen, kein Zurückspringen in Listen.
//      Die App führt der Reihe nach durch alle Völker des Standes.
//   2. Große Flächen, wenige Angaben. Nur das, was man beim Öffnen ohnehin
//      beurteilt und was hinterher Termine steuert.
//   3. Sofort speichern. Jedes Volk wird beim Weiterblättern geschrieben –
//      ein leerer Akku darf nicht den halben Durchgang kosten.
//
// Freitext geht über die Mikrofontaste der Bildschirmtastatur (Android und iOS
// bringen ihre eigene Diktierfunktion mit; sie arbeitet inzwischen meist direkt
// auf dem Gerät und damit auch ohne Netz). Die App fängt Sprache bewusst nicht
// selbst ab: Fachwörter wie „Wabengassen" oder „Spielnäpfchen" erkennt keine
// allgemeine Spracherkennung zuverlässig, und am Stand ist oft kein Netz.

import { esc, iso, uid, heute, fmtDatum, diffTage, parseISO } from './util.js';
import { t } from './i18n.js';
import * as db from './db.js';
import { ausloeserPruefen, abhaken } from './aufgaben.js';

/** Was im Durchgang abgefragt wird – bewusst kurz gehalten. */
export const SCHNELL = [
  {
    key: 'wabengassen', label: 'Besetzte Wabengassen', typ: 'zahl',
    hinweis: 'Gassen, in denen Bienen sitzen – nicht die Futterwaben',
  },
  {
    key: 'koenigin', label: 'Weiselzustand', typ: 'wahl',
    optionen: ['weiselrichtig', 'Königin gesehen', 'unsicher', 'weisellos'],
  },
  {
    key: 'stimmung', label: 'Schwarmstimmung', typ: 'wahl',
    optionen: ['keine', 'Spielnäpfchen', 'bestiftet', 'verdeckelt'],
  },
  { key: 'futter', label: 'Futter geschätzt', typ: 'zahl', einheit: 'kg' },
  { key: 'sanftmut', label: 'Sanftmut', typ: 'wahl', optionen: ['1', '2', '3', '4', '5'],
    hinweis: '1 stechlustig … 5 sanft' },
];

/** Was „ohne Befund" bedeutet – ausdrücklich, damit niemand raten muss. */
export const OHNE_BEFUND = { koenigin: 'weiselrichtig', stimmung: 'keine', zellen: 0 };

export const standVoelker = (S, standortId) => S.voelker
  .filter((v) => v.standortId === standortId)
  .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { numeric: true }));

export const offeneFuer = (S, zielId) => S.plan.filter((a) => a.ziel.id === zielId
  && ['ueberfaellig', 'faellig'].includes(a.zustand));

const letzteSicht = (S, volkId) => S.durchsichten
  .filter((d) => d.volkId === volkId)
  .sort((a, b) => (a.datum < b.datum ? 1 : -1))[0];

// ------------------------------------------------------------------- Ansicht

const grobFeldHTML = (f) => {
  if (f.typ === 'zahl') {
    return `<div class="grobfeld" data-key="${f.key}" data-typ="zahl">
      <span class="grobtitel">${esc(t(f.label))}${f.einheit ? ` <em>${esc(t(f.einheit))}</em>` : ''}</span>
      <div class="grobzahl">
        <button type="button" data-minus aria-label="weniger">−</button>
        <input type="number" inputmode="numeric" step="1" value="" placeholder="–">
        <button type="button" data-plus aria-label="mehr">+</button>
      </div>
      ${f.hinweis ? `<small>${esc(t(f.hinweis))}</small>` : ''}
    </div>`;
  }
  return `<div class="grobfeld" data-key="${f.key}" data-typ="wahl">
    <span class="grobtitel">${esc(t(f.label))}</span>
    <div class="grobchips">${f.optionen.map((o) =>
      `<button type="button" data-wert="${esc(o)}">${esc(t(o))}</button>`).join('')}</div>
    ${f.hinweis ? `<small>${esc(t(f.hinweis))}</small>` : ''}
  </div>`;
};

const aufgabeZeile = (a) => `<div class="standaufgabe" data-saufgabe="${esc(a.schluessel)}">
  <span class="kasten"></span>
  <span class="txt">${esc(t(a.titel))}
    ${a.zustand === 'ueberfaellig' ? `<small class="z-ueberfaellig">${esc(t('überfällig'))}</small>` : ''}</span>
  <button type="button" class="mehrknopf" data-sdetail="${esc(a.schluessel)}"
    aria-label="${esc(t('Details'))}">···</button>
</div>`;

/** Ein Volk im Durchgang. */
export function volkSchritt(S, volk, stand, nummer, anzahl) {
  const letzte = letzteSicht(S, volk.id);
  const aufgaben = offeneFuer(S, volk.id);
  return `
  <div class="standkopf">
    <button class="standpfeil" data-sschritt="-1" aria-label="${esc(t('vorheriges Volk'))}">‹</button>
    <div class="standtitel">
      <b>${esc(volk.name)}</b>
      <small>${esc(stand.name)} · ${esc(t('Volk {i} von {n}', { i: nummer, n: anzahl }))}</small>
    </div>
    <button class="standpfeil" data-sschritt="1" aria-label="${esc(t('nächstes Volk'))}">›</button>
  </div>
  <div class="standbalken"><i style="width:${Math.round((nummer - 1) / anzahl * 100)}%"></i></div>

  <div class="karte"><div class="karte-inhalt">
    <div class="mini">${letzte
      ? esc(t('zuletzt durchgesehen {d} (vor {n} Tagen)',
        { d: fmtDatum(letzte.datum), n: diffTage(heute(), parseISO(letzte.datum)) }))
      : esc(t('noch keine Durchsicht erfasst'))}${volk.koeniginJahr
      ? ' · ' + esc(t('Königin {jahr}', { jahr: volk.koeniginJahr })) : ''}</div>
  </div></div>

  ${aufgaben.length ? `<h2 class="abschnitt">${esc(t('Offen an diesem Volk'))} · ${aufgaben.length}</h2>
    <div class="karte">${aufgaben.map(aufgabeZeile).join('')}</div>
    <div class="mini" style="padding:2px 6px 0">${esc(t('Antippen hakt ab. Für Angaben wie '
      + 'Erntemenge oder Präparat den Knopf rechts nehmen.'))}</div>` : ''}

  <h2 class="abschnitt">${esc(t('Kurzbefund'))}</h2>
  <div class="karte"><div class="karte-inhalt">
    ${SCHNELL.map(grobFeldHTML).join('')}
    <div class="grobfeld" data-key="notiz" data-typ="text">
      <span class="grobtitel">${esc(t('Notiz'))}</span>
      <textarea rows="2" placeholder="${esc(t('frei diktierbar über die Mikrofontaste der Tastatur'))}"></textarea>
    </div>
  </div></div>

  <div class="standknoepfe">
    <button class="knopf gross" data-sweiter>${esc(t('Speichern und weiter'))}</button>
    <button class="knopf leise gross" data-sohne>${esc(t('Ohne Befund'))}</button>
  </div>
  <div class="mini" style="padding:6px 6px 0">${esc(t('„Ohne Befund" trägt ein: weiselrichtig, '
    + 'keine Schwarmstimmung, keine Weiselzellen – und geht weiter.'))}</div>
  <div class="knopfreihe"><button class="knopf leise klein" data-sende>${esc(t('Durchgang beenden'))}</button></div>`;
}

/** Abschluss: was gelaufen ist, plus die Aufgaben, die dem Stand selbst gelten. */
export function abschlussSchritt(S, stand, bilanz) {
  const standAufgaben = offeneFuer(S, stand.id);
  return `
  <div class="standkopf">
    <button class="standpfeil" data-sschritt="-1" aria-label="${esc(t('zurück'))}">‹</button>
    <div class="standtitel"><b>${esc(t('Durchgang fertig'))}</b><small>${esc(stand.name)}</small></div>
    <span class="standpfeil" style="visibility:hidden">›</span>
  </div>
  <div class="standbalken"><i style="width:100%"></i></div>

  <div class="karte"><div class="karte-inhalt">
    <div class="uebersicht">
      <div><b>${bilanz.voelker}</b><span>${esc(t('Völker erfasst'))}</span></div>
      <div><b>${bilanz.aufgaben}</b><span>${esc(t('Aufgaben erledigt'))}</span></div>
      <div><b>${bilanz.neu}</b><span>${esc(t('neu ausgelöst'))}</span></div>
    </div>
  </div></div>

  ${standAufgaben.length ? `<h2 class="abschnitt">${esc(t('Am Stand selbst'))}</h2>
    <div class="karte">${standAufgaben.map(aufgabeZeile).join('')}</div>` : ''}

  <div class="standknoepfe">
    <button class="knopf gross" data-sende>${esc(t('Fertig'))}</button>
  </div>`;
}

// ------------------------------------------------------------------ Speichern

/** Werte aus den groben Feldern lesen. */
export function grobWerteLesen(wurzel) {
  const werte = {};
  wurzel.querySelectorAll('.grobfeld').forEach((f) => {
    const key = f.dataset.key;
    if (f.dataset.typ === 'wahl') {
      const an = f.querySelector('button.an');
      if (an) werte[key] = an.dataset.wert;
    } else {
      const el = f.querySelector('input,textarea');
      const v = el?.value?.trim();
      if (v) werte[key] = f.dataset.typ === 'zahl' ? parseFloat(v) : v;
    }
  });
  // „Königin gesehen" ist beides: Weiselrichtigkeit und eine Beobachtung
  if (werte.koenigin === 'Königin gesehen') werte.koenigin = 'gesehen, weiselrichtig';
  if (werte.sanftmut) werte.sanftmut = Number(werte.sanftmut);
  return werte;
}

/**
 * Ein Volk im Durchgang festschreiben: Kurzbefund als Durchsicht, angehakte
 * Aufgaben als Erledigungen, danach die automatischen Auslöser prüfen.
 * @returns {{durchsicht: boolean, aufgaben: number, neu: number}}
 */
export async function schrittSpeichern({ S, volk, werte, abgehakt, datum = iso(heute()) }) {
  const bilanz = { durchsicht: false, aufgaben: 0, neu: 0 };
  const hatWerte = Object.keys(werte || {}).length > 0;

  if (hatWerte) {
    await db.schreibe('durchsichten', {
      id: uid(), volkId: volk.id, datum, quelle: 'stand', ...werte,
    });
    bilanz.durchsicht = true;
  }

  for (const a of abgehakt) {
    if (a.eigenId) { await abhaken(a.eigenId, datum, ''); bilanz.aufgaben += 1; continue; }
    await db.schreibe('erledigungen', {
      id: uid(), regelId: a.regelId, zielTyp: a.ziel.typ, zielId: a.ziel.id,
      datum, status: 'erledigt', daten: {}, jahr: parseISO(datum).getFullYear(),
    });
    bilanz.aufgaben += 1;
  }

  // Eine Durchsicht in der Schwarmzeit ist zugleich die Schwarmkontrolle –
  // dieselbe Regel wie im ausführlichen Durchsichtsfenster.
  const sk = S.plan.find((a) => a.regelId === 'schwarmkontrolle' && a.ziel.id === volk.id
    && ['faellig', 'ueberfaellig', 'bald'].includes(a.zustand));
  if (sk && werte?.stimmung && !abgehakt.some((a) => a.regelId === 'schwarmkontrolle')) {
    await db.schreibe('erledigungen', {
      id: uid(), regelId: 'schwarmkontrolle', zielTyp: 'volk', zielId: volk.id,
      datum, status: 'erledigt',
      daten: { stimmung: werte.stimmung, ...(werte.zellen != null ? { zellen: werte.zellen } : {}) },
      jahr: parseISO(datum).getFullYear(),
    });
    bilanz.aufgaben += 1;
  }

  if (hatWerte) {
    bilanz.neu = await ausloeserPruefen({
      daten: werte, zielTyp: 'volk', zielId: volk.id, zielName: volk.name, datum,
    });
  }
  return bilanz;
}
