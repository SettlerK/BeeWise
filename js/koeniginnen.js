// Königinnen und Abstammung.
// =============================================================================
// Bisher stand am Volk nur ein Jahrgang. Das reicht für den Farbpunkt, aber
// nicht für die Fragen, die sich nach zwei Saisons stellen: Von welcher Mutter
// stammt die Königin? Wie alt ist sie wirklich? Welche Völker leisten etwas –
// und von welchen lohnt es, weiterzuziehen?
//
// Deshalb ein eigener Datensatz je Königin, mit Anfang und Ende. Das Volk
// verweist nicht auf die Königin, sondern die Königin auf das Volk: so bleibt
// die Reihe der Vorgängerinnen von selbst erhalten, wenn umgeweiselt wird.
//
// Rückwärtsverträglichkeit: `volk.koeniginJahr` wird weiter mitgeschrieben.
// Farbpunkt, Aufkleber und PDF-Berichte lesen es, ohne etwas zu wissen von
// diesem Modul – und alte Daten funktionieren unverändert weiter.

import * as db from './db.js';
import { uid, iso, heute, parseISO } from './util.js';

export const HERKUNFT = [
  'Standbegattung', 'Belegstelle', 'künstlich besamt', 'gekauft',
  'Nachschaffung', 'Schwarm', 'unbekannt',
];

export const RASSEN = ['Carnica', 'Buckfast', 'Dunkle Biene', 'Ligustica', 'Mischling', 'unbekannt'];

export const ENDE_GRUND = [
  'umgeweiselt', 'verloren', 'abgeschwärmt', 'drohnenbrütig', 'Volk aufgelöst', 'unbekannt',
];

/** Internationaler Farbcode: 1/6 weiß, 2/7 gelb, 3/8 rot, 4/9 grün, 5/0 blau. */
export function zeichenFarbe(jahr) {
  const f = {
    1: '#F2EFE6', 6: '#F2EFE6', 2: '#F2D24B', 7: '#F2D24B', 3: '#E27B6B', 8: '#E27B6B',
    4: '#93C48D', 9: '#93C48D', 5: '#8AB4E8', 0: '#8AB4E8',
  };
  return f[String(jahr || '').slice(-1)] || 'var(--rand)';
}

export const FARBNAME = {
  1: 'weiß', 6: 'weiß', 2: 'gelb', 7: 'gelb', 3: 'rot', 8: 'rot',
  4: 'grün', 9: 'grün', 5: 'blau', 0: 'blau',
};
export const zeichenName = (jahr) => FARBNAME[String(jahr || '').slice(-1)] || '';

export const alleVomVolk = (S, volkId) => (S.koeniginnen || [])
  .filter((k) => k.volkId === volkId && !k.deletedAt)
  .sort((a, b) => ((a.seit || '') < (b.seit || '') ? 1 : -1));

/** Die aktuell im Volk sitzende Königin, falls erfasst. */
export const aktuelle = (S, volkId) => alleVomVolk(S, volkId).find((k) => !k.bis) || null;

/** Alter in Saisons – eine Königin von 2024 ist 2026 zwei Jahre alt. */
export const alter = (jahr, datum = heute()) => (jahr ? datum.getFullYear() - Number(jahr) : null);

/**
 * Königin anlegen. Schreibt den Jahrgang zusätzlich ans Volk, damit alles
 * Bestehende (Farbpunkt, Aufkleber, PDF) unverändert weiterläuft.
 */
export async function anlegen({ volkId, jahr, herkunft, rasse, zuechter, mutterVolkId, seit, notiz }) {
  const k = await db.schreibe('koeniginnen', {
    id: uid(),
    volkId,
    jahr: String(jahr || new Date().getFullYear()),
    herkunft: herkunft || 'unbekannt',
    rasse: rasse || '',
    zuechter: zuechter || '',
    mutterVolkId: mutterVolkId || null,
    seit: seit || iso(heute()),
    bis: null,
    grund: null,
    notiz: notiz || '',
  });
  const v = await db.hole('voelker', volkId);
  if (v) await db.schreibe('voelker', { ...v, koeniginJahr: k.jahr });
  return k;
}

/** Alte Königin abschließen und die neue eintragen. */
export async function umweiseln({ volkId, alteId, grund, datum, neue }) {
  const wann = datum || iso(heute());
  if (alteId) {
    const alt = await db.hole('koeniginnen', alteId);
    if (alt) await db.schreibe('koeniginnen', { ...alt, bis: wann, grund: grund || 'umgeweiselt' });
  }
  if (!neue) return null;
  return anlegen({ ...neue, volkId, seit: wann });
}

export async function beenden({ id, grund, datum }) {
  const k = await db.hole('koeniginnen', id);
  if (!k) return null;
  return db.schreibe('koeniginnen', { ...k, bis: datum || iso(heute()), grund: grund || 'unbekannt' });
}

/**
 * Jahrgang eines Volkes – aus dem Königinnendatensatz, sonst aus dem alten Feld.
 * So funktioniert alles auch für Völker, deren Königin nie erfasst wurde.
 */
export function jahrgang(S, volk) {
  const k = aktuelle(S, volk?.id);
  return k?.jahr || volk?.koeniginJahr || null;
}

/** Ist das Volk ein Jungvolk dieses Jahres? Zählt für Futterbedarf und Einwinterung. */
export function istJungvolk(volk, datum = heute()) {
  if (!volk?.gebildetAm) return false;
  return parseISO(volk.gebildetAm).getFullYear() === datum.getFullYear();
}
