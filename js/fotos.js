// Fotos zu den Durchsichten.
// =============================================================================
// Ein Bild sagt bei Brutbildern, Weiselzellen und Krankheitsverdacht mehr als
// jede Notiz. Der Preis ist Speicherplatz, deshalb drei Vorkehrungen:
//
//   1. VERKLEINERN. Aufgenommen wird mit 12 Megapixeln, gespeichert wird die
//      längste Kante mit 1024 Punkten als JPEG. Aus 4 MB werden rund 100 kB –
//      genug, um ein Brutbild später noch beurteilen zu können.
//   2. EIGENER SPEICHER, VOM ABGLEICH AUSGENOMMEN. Die Bilder bleiben auf dem
//      Gerät (siehe db.js, NICHT_ABGLEICHEN); in die Sicherungsdatei kommen sie
//      mit. Sonst würde das Abgleich-Repository mit jeder Woche wachsen.
//   3. SICHTBAR UND AUFRÄUMBAR. Unter „Mehr → Daten" steht, wie viele Bilder
//      wie viel Platz belegen, und alte Jahrgänge lassen sich löschen.
//
// Rechenbeispiel für die Größenordnung: zehn Völker, acht Durchsichten im Jahr,
// je ein Bild = 80 Bilder ≈ 10 MB im Jahr. Nach zehn Jahren rund 100 MB. Das
// ist für IndexedDB unkritisch (Browser geben in der Regel Gigabytes frei),
// aber genug, dass man es sehen und begrenzen können muss.

import * as db from './db.js';
import { uid, iso, heute } from './util.js';

export const KANTEN = [800, 1024, 1600];
const VORSCHAU = 220;
const GUETE = 0.72;

export async function kanteLesen() {
  const k = await db.metaLies('fotoKante', 1024);
  return KANTEN.includes(Number(k)) ? Number(k) : 1024;
}
export const kanteSchreiben = (k) => db.metaSchreibe('fotoKante', Number(k));

/** Bild aus Datei oder Kamera holen und auf zwei Größen bringen. */
export function fotoAufnehmen({ kante = 1024 } = {}) {
  return new Promise((fertig) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.capture = 'environment';
    inp.onchange = () => {
      const datei = inp.files?.[0];
      if (!datei) return fertig(null);
      const url = URL.createObjectURL(datei);
      const bild = new Image();
      bild.onload = () => {
        const mal = (max) => {
          const s = Math.min(1, max / Math.max(bild.width, bild.height));
          const c = document.createElement('canvas');
          c.width = Math.round(bild.width * s);
          c.height = Math.round(bild.height * s);
          c.getContext('2d').drawImage(bild, 0, 0, c.width, c.height);
          return c.toDataURL('image/jpeg', GUETE);
        };
        const daten = mal(kante);
        const klein = mal(VORSCHAU);
        URL.revokeObjectURL(url);
        fertig({ daten, klein, bytes: Math.round(daten.length * 0.75) });
      };
      bild.onerror = () => { URL.revokeObjectURL(url); fertig(null); };
      bild.src = url;
    };
    inp.click();
  });
}

export async function fotoSpeichern({ volkId, durchsichtId, datum, bild }) {
  return db.schreibe('bilder', {
    id: uid(), volkId, durchsichtId, datum: datum || iso(heute()),
    daten: bild.daten, klein: bild.klein, bytes: bild.bytes,
  });
}

export const fotosVomVolk = (volkId) => db.nachIndex('bilder', 'volkId', volkId);

export const fotoLoeschen = (id) => db.loesche('bilder', id);

/** Wie viel Platz belegen die Bilder? */
export async function bilanz() {
  const alle = await db.alle('bilder');
  const bytes = alle.reduce((s, b) => s + (b.bytes || Math.round((b.daten || '').length * 0.75)), 0);
  const jahre = {};
  for (const b of alle) {
    const j = String(b.datum || '').slice(0, 4) || '?';
    jahre[j] = (jahre[j] || 0) + 1;
  }
  return { anzahl: alle.length, bytes, jahre };
}

/** Alle Bilder aus Jahren vor `grenze` löschen. */
export async function aufraeumen(grenze) {
  const alle = await db.alle('bilder');
  let weg = 0;
  for (const b of alle) {
    if (Number(String(b.datum || '').slice(0, 4)) < grenze) { await db.loesche('bilder', b.id); weg += 1; }
  }
  return weg;
}

/** Lesbare Größe: unter einem Megabyte in Kilobyte, darüber mit einer Stelle. */
export function groesse(bytes) {
  if (!bytes) return '0 kB';
  if (bytes < 1048576) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / 1048576).toFixed(bytes > 10485760 ? 0 : 1)} MB`;
}
