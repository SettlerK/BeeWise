// Kleine Helfer. Einzige Abhängigkeit: die Sprachwahl für Datumsformate.
import { t, gebietsschema } from './i18n.js';

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));

export const nowISO = () => new Date().toISOString();

/** Datum -> 'YYYY-MM-DD' in lokaler Zeit (nicht UTC!) */
export function iso(d) {
  const x = d instanceof Date ? d : new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

export function parseISO(s) {
  if (s instanceof Date) return s;
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const heute = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export function addDays(d, n) {
  const x = new Date(d instanceof Date ? d.getTime() : parseISO(d).getTime());
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function diffTage(a, b) {
  const A = (a instanceof Date ? a : parseISO(a)); const B = (b instanceof Date ? b : parseISO(b));
  return Math.round((A.setHours(12, 0, 0, 0) - B.setHours(12, 0, 0, 0)) / 86400000);
}

/** Tag im Jahr, 1 = 1. Januar */
export function doy(d) {
  const x = d instanceof Date ? d : parseISO(d);
  return Math.round((new Date(x.getFullYear(), x.getMonth(), x.getDate()) -
    new Date(x.getFullYear(), 0, 0)) / 86400000);
}

export function vonDoy(jahr, tag) {
  const d = new Date(jahr, 0, 1);
  d.setDate(tag);
  d.setHours(0, 0, 0, 0);
  return d;
}

const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MON_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export { MON, MON_LANG };

export function fmtDatum(d, lang = false) {
  if (!d) return '–';
  const x = d instanceof Date ? d : parseISO(d);
  return x.toLocaleDateString(gebietsschema(), lang
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short' });
}

export function fmtRelativ(d) {
  const n = diffTage(d, heute());
  if (n === 0) return t('heute');
  if (n === 1) return t('morgen');
  if (n === -1) return t('gestern');
  if (n > 0 && n < 14) return t('in {n} Tagen', { n });
  if (n < 0 && n > -14) return t('vor {n} Tagen', { n: -n });
  if (n > 0) return t('in {n} Wochen', { n: Math.round(n / 7) });
  return t('vor {n} Wochen', { n: Math.round(-n / 7) });
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Tag-Template: html`<b>${x}</b>` maskiert eingesetzte Werte automatisch. */
export function html(strings, ...vals) {
  return strings.reduce((acc, s, i) => acc + s + (i < vals.length
    ? (vals[i] && vals[i].__raw ? vals[i].__raw : esc(vals[i])) : ''), '');
}
export const raw = (s) => ({ __raw: s });

export function el(sel, root = document) { return root.querySelector(sel); }
export function els(sel, root = document) { return [...root.querySelectorAll(sel)]; }

export function debounce(fn, ms = 250) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
