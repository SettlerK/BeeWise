// Offene Aufgaben als Kalenderdatei (.ics) ausgeben.
// =============================================================================
// Bewusst NICHT ein Termin je Aufgabe – bei zwanzig Völkern wäre der Kalender
// sonst unbenutzbar. Stattdessen ein Sammeltermin je Stichtag:
// „Imkereiaufgaben offen (3)". Was genau ansteht, steht in der App.

import { iso, addDays, parseISO, heute, fmtDatum } from './util.js';

const maskieren = (s) => String(s || '')
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

const falten = (zeile) => {
  const out = [];
  let rest = zeile;
  while (rest.length > 73) { out.push(rest.slice(0, 73)); rest = ' ' + rest.slice(73); }
  out.push(rest);
  return out.join('\r\n');
};

const tagsform = (d) => iso(d).replace(/-/g, '');

/**
 * Aufgaben nach Stichtag bündeln.
 * Überfällige landen auf heute – sie sind ja jetzt zu tun.
 */
function buendeln(aufgaben, datum = heute()) {
  const nach = new Map();
  for (const a of aufgaben) {
    const stich = a.bis && a.bis > datum ? a.bis : (a.von && a.von > datum ? a.von : datum);
    const k = iso(stich);
    if (!nach.has(k)) nach.set(k, []);
    nach.get(k).push(a);
  }
  return [...nach.entries()].sort((x, y) => (x[0] < y[0] ? -1 : 1));
}

export function icsBauen(aufgaben, { name = 'Imkerei', datum = heute() } = {}) {
  const jetzt = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BeeWise//DE',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${maskieren(name)}`];

  for (const [tag, liste] of buendeln(aufgaben, datum)) {
    const d = parseISO(tag);
    // Kurzübersicht: Titel ohne Volksnamen, gleiche Aufgaben zusammengefasst
    const zaehler = new Map();
    for (const a of liste) zaehler.set(a.titel, (zaehler.get(a.titel) || 0) + 1);
    const zeilen = [...zaehler.entries()]
      .map(([t, n]) => `• ${t}${n > 1 ? ` (${n}×)` : ''}`);

    z.push('BEGIN:VEVENT');
    z.push(`UID:beewise-${tagsform(d)}@beewise`);
    z.push(`DTSTAMP:${jetzt}`);
    z.push(`DTSTART;VALUE=DATE:${tagsform(d)}`);
    z.push(`DTEND;VALUE=DATE:${tagsform(addDays(d, 1))}`);
    z.push(falten(`SUMMARY:${maskieren(`Imkereiaufgaben offen (${liste.length})`)}`));
    z.push(falten(`DESCRIPTION:${maskieren(
      `Stichtag ${fmtDatum(d, true)}\n${zeilen.join('\n')}\n\nDetails und Abhaken in BeeWise.`)}`));
    z.push('CATEGORIES:Imkerei');
    z.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-P1D',
      'DESCRIPTION:Imkereiaufgaben stehen an', 'END:VALARM');
    z.push('END:VEVENT');
  }
  z.push('END:VCALENDAR');
  return z.join('\r\n');
}

export function icsHerunterladen(aufgaben, dateiname = 'beewise-aufgaben.ics') {
  const blob = new Blob([icsBauen(aufgaben)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dateiname;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return buendeln(aufgaben).length;
}
