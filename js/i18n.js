// Mehrsprachigkeit.
// =============================================================================
// Besonderheit dieser Umsetzung: Schlüssel sind die deutschen Originaltexte.
// Das hat zwei Vorteile – der Quelltext bleibt lesbar (kein `t('mehr.tab.42')`),
// und eine vergessene Stelle zeigt Deutsch statt eines kryptischen Schlüssels.
//
// Zwei Wege ins Ziel:
//   1. t('Speichern')             – für Meldungen und zusammengesetzte Sätze
//   2. uebersetzeDom(document)    – läuft nach jedem Aufbau über die Seite und
//      ersetzt Textknoten sowie Platzhalter- und Vorlesetexte. Damit sind auch
//      die vielen Beschriftungen in den HTML-Vorlagen erfasst, ohne dass jede
//      einzeln angefasst werden muss.
//
// Neue Sprache ergänzen: Datei nach dem Muster von `lang/en.js` anlegen, in
// PAKETE eintragen, fertig. Fehlt ein Eintrag, erscheint der deutsche Text.

import { en } from './lang/en.js';

export const SPRACHEN = [
  { code: 'en', name: 'English', eigen: 'English' },
  { code: 'de', name: 'Deutsch', eigen: 'Deutsch' },
];

const PAKETE = { en, de: {} };      // de = Original, braucht keine Übersetzung

// Im HTML stehen lange Texte oft über mehrere Zeilen. Für den Abgleich werden
// deshalb alle Leerraumfolgen zu einem Leerzeichen zusammengezogen – sonst
// findet ein umbrochener Absatz seine Übersetzung nicht.
const glatt = (s) => String(s).replace(/\s+/g, ' ').trim();
const NORMAL = {};
for (const [code, paket] of Object.entries(PAKETE)) {
  NORMAL[code] = {};
  for (const [k, v] of Object.entries(paket)) NORMAL[code][glatt(k)] = v;
}

const SPEICHER = 'beewise:sprache';
let aktuell = 'en';

/** Sprache aus Speicher oder Systemeinstellung bestimmen. */
export function spracheErmitteln() {
  let s = null;
  try { s = localStorage.getItem(SPEICHER); } catch { /* egal */ }
  if (s && PAKETE[s]) { aktuell = s; return { code: s, gewaehlt: true }; }
  const system = (navigator.language || 'en').slice(0, 2).toLowerCase();
  aktuell = PAKETE[system] ? system : 'en';
  return { code: aktuell, gewaehlt: false };
}

export const sprache = () => aktuell;
export const spracheName = () => SPRACHEN.find((s) => s.code === aktuell)?.eigen || aktuell;

export function spracheSetzen(code) {
  if (!PAKETE[code]) return false;
  aktuell = code;
  try { localStorage.setItem(SPEICHER, code); } catch { /* egal */ }
  document.documentElement.lang = code;
  return true;
}

/**
 * Text übersetzen. Platzhalter in geschweiften Klammern werden ersetzt:
 *   t('{n} Völker', { n: 5 })
 */
export function t(text, werte) {
  if (text == null) return text;
  const roh = String(text);
  let out = PAKETE[aktuell]?.[roh] ?? NORMAL[aktuell]?.[glatt(roh)] ?? roh;
  if (werte) {
    for (const [k, v] of Object.entries(werte)) out = out.split('{' + k + '}').join(String(v));
  }
  return out;
}

/** Gibt es für diesen Text überhaupt eine Übersetzung? (für Prüfzwecke) */
export const bekannt = (text) => aktuell === 'de' || PAKETE[aktuell]?.[String(text)] != null;

// ---------------------------------------------------------------- DOM-Durchlauf

const UEBERSPRINGEN = new Set(['SCRIPT', 'STYLE', 'CODE', 'TEXTAREA']);
const ATTRIBUTE = ['placeholder', 'title', 'aria-label', 'alt'];

/**
 * Übersetzt alle Textknoten und ausgewählte Attribute unterhalb von `wurzel`.
 * Nicht gefundene Texte bleiben unverändert – Zahlen, Namen und Datumsangaben
 * sind also nie in Gefahr.
 */
export function uebersetzeDom(wurzel = document.body) {
  if (aktuell === 'de' || !wurzel) return;
  const paket = PAKETE[aktuell];
  if (!paket) return;

  const lauf = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT, {
    acceptNode(k) {
      if (UEBERSPRINGEN.has(k.parentNode?.nodeName)) return NodeFilter.FILTER_REJECT;
      return k.nodeValue && k.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const knoten = [];
  for (let k = lauf.nextNode(); k; k = lauf.nextNode()) knoten.push(k);

  for (const k of knoten) {
    const roh = k.nodeValue;
    const kern = roh.trim();
    const ersatz = paket[kern] ?? NORMAL[aktuell][glatt(kern)];
    if (ersatz == null) continue;
    // umgebende Leerzeichen erhalten, damit das Layout gleich bleibt
    const vorn = roh.slice(0, roh.length - roh.trimStart().length);
    const hinten = roh.slice(roh.trimEnd().length);
    k.nodeValue = vorn + ersatz + hinten;
  }

  for (const attr of ATTRIBUTE) {
    for (const el of wurzel.querySelectorAll(`[${attr}]`)) {
      const wert = el.getAttribute(attr);
      const ersatz = paket[String(wert).trim()] ?? NORMAL[aktuell][glatt(wert)];
      if (ersatz != null) el.setAttribute(attr, ersatz);
    }
  }
}

/** Datums- und Zahlenformate folgen der gewählten Sprache. */
export const gebietsschema = () => (aktuell === 'de' ? 'de-DE' : 'en-GB');
