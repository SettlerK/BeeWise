// Eigene und automatisch ausgelöste Aufgaben.
// =============================================================================
// Der Regelkatalog deckt den Jahreslauf ab. Daneben braucht es zwei Dinge:
//   – selbst angelegte Aufgaben ("Zäune reparieren", "Mittelwände bestellen")
//   – Aufgaben, die aus erfassten Werten entstehen (Milbenfall über der Schwelle)
// Beides landet im selben Store und wird von der Engine mitgeplant.

import { uid, iso, heute, addDays, parseISO, diffTage } from './util.js';
import * as db from './db.js';
import { AUSLOESER } from './regeln.js';

/**
 * Prüft erfasste Werte gegen die Auslöser und legt fehlende Aufgaben an.
 * @returns Anzahl neu erzeugter Aufgaben
 */
export async function ausloeserPruefen({ daten, zielTyp, zielId, zielName, datum, kontext = {} }) {
  const d = parseISO(datum || iso(heute()));
  const monat = d.getMonth() + 1;
  const bestehende = (await db.alle('aufgaben')).filter((a) => !a.erledigtAm);
  let neu = 0;

  for (const A of AUSLOESER) {
    let trifft = false;
    try { trifft = A.trifft({ daten: daten || {}, monat, ...kontext }); } catch { trifft = false; }
    if (!trifft) continue;

    // Nicht doppelt anlegen: gleicher Auslöser, gleiches Ziel, noch offen
    const doppelt = bestehende.some((a) => a.ausloeser === A.id && a.zielId === zielId
      && Math.abs(diffTage(parseISO(a.von), d)) < 21);
    if (doppelt) continue;

    const v = A.aufgabe({ daten: daten || {}, monat, ...kontext });
    await db.schreibe('aufgaben', {
      id: uid(),
      titel: v.titel, info: v.info, kategorie: v.kategorie || 'eigene',
      wichtig: !!v.wichtig, hilfe: v.hilfe || null,
      zielTyp, zielId, zielName,
      von: iso(addDays(d, v.fenster?.[0] ?? 0)),
      bis: iso(addDays(d, v.fenster?.[1] ?? 14)),
      quelle: 'auto', ausloeser: A.id, erledigtAm: null,
    });
    neu += 1;
  }
  return neu;
}

/** Eigene Aufgabe anlegen – auf Wunsch gleich für mehrere Ziele. */
export async function eigeneAnlegen({ titel, info, kategorie, wichtig, von, bis, ziele }) {
  const gruppe = uid();
  const angelegt = [];
  for (const z of ziele) {
    angelegt.push(await db.schreibe('aufgaben', {
      id: uid(), titel, info: info || '', kategorie: kategorie || 'eigene',
      wichtig: !!wichtig, von, bis, gruppe,
      zielTyp: z.typ, zielId: z.id, zielName: z.name,
      quelle: 'manuell', erledigtAm: null,
    }));
  }
  return angelegt;
}

export async function abhaken(id, datum = iso(heute()), notiz = '') {
  const a = await db.hole('aufgaben', id);
  if (!a) return;
  return db.schreibe('aufgaben', { ...a, erledigtAm: datum, notizErledigt: notiz });
}

export async function wiederOeffnen(id) {
  const a = await db.hole('aufgaben', id);
  if (!a) return;
  return db.schreibe('aufgaben', { ...a, erledigtAm: null });
}
