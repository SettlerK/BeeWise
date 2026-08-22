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

export const KANTEN = [800, 1024, 1600, 2048];
const VORSCHAU = 220;
// Güte: 0,72 reichte, solange Bilder nur angesehen wurden. Zum Hineinzoomen auf
// Zellen ist das zu wenig – dort werden die Artefakte sichtbar, bevor die
// Auflösung endet. Deshalb 0,82 für das Bild und weiterhin sparsam für die
// Vorschau, die nie vergrößert wird.
const GUETE = 0.82;
const GUETE_VORSCHAU = 0.7;

// Die eingestellte Bildgröße wird beim Start EINMAL gelesen und hier gehalten.
// Grund: `fotoAufnehmen()` muss ohne jedes `await` auskommen (siehe dort).
let aktuelleKante = 1024;

export async function kanteLaden() {
  try {
    const k = await db.metaLies('fotoKante', 1024);
    aktuelleKante = KANTEN.includes(Number(k)) ? Number(k) : 1024;
  } catch { aktuelleKante = 1024; }
  return aktuelleKante;
}

export const kante = () => aktuelleKante;

export async function kanteSchreiben(k) {
  aktuelleKante = KANTEN.includes(Number(k)) ? Number(k) : 1024;
  return db.metaSchreibe('fotoKante', aktuelleKante);
}

/**
 * Bild aus Kamera oder Galerie holen und auf zwei Größen bringen.
 *
 * Diese Funktion MUSS unmittelbar aus dem Antippen heraus aufgerufen werden –
 * ohne ein `await` davor. Am Handy erlauben die Browser das Öffnen des
 * Dateidialogs nur innerhalb der Nutzergeste; wartet der Code vorher auch nur
 * eine Runde auf die Datenbank, gilt die Geste als verbraucht und der Dialog
 * öffnet sich ohne Fehlermeldung einfach nicht. Genau daran lag es.
 *
 * Zwei weitere Fallen, die hier umgangen werden:
 *   * Das Feld wird kurz in die Seite gehängt. Ein nur im Speicher erzeugtes
 *     Feld ignoriert Safari gelegentlich.
 *   * Kein `capture`-Attribut. Es erzwingt die Kamera und nimmt einem damit die
 *     Wahl, ein vorhandenes Bild aus der Galerie zu nehmen.
 */
export function fotoAufnehmen() {
  const max = aktuelleKante;
  return new Promise((fertig) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(inp);
    let erledigt = false;
    const schluss = (wert) => {
      if (erledigt) return;
      erledigt = true;
      try { inp.remove(); } catch { /* egal */ }
      fertig(wert);
    };

    inp.onchange = () => {
      const datei = inp.files?.[0];
      if (!datei) return schluss(null);
      const url = URL.createObjectURL(datei);
      const bild = new Image();
      bild.onload = () => {
        const mal = (kanteMax) => {
          const s = Math.min(1, kanteMax / Math.max(bild.width, bild.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(bild.width * s));
          c.height = Math.max(1, Math.round(bild.height * s));
          c.getContext('2d').drawImage(bild, 0, 0, c.width, c.height);
          return c.toDataURL('image/jpeg', kanteMax <= VORSCHAU ? GUETE_VORSCHAU : GUETE);
        };
        try {
          const daten = mal(max);
          const klein = mal(VORSCHAU);
          URL.revokeObjectURL(url);
          schluss({ daten, klein, bytes: Math.round(daten.length * 0.75) });
        } catch (e) {
          URL.revokeObjectURL(url);
          schluss({ fehler: e?.message || 'Bild konnte nicht verkleinert werden' });
        }
      };
      bild.onerror = () => {
        URL.revokeObjectURL(url);
        schluss({ fehler: 'Bild konnte nicht gelesen werden' });
      };
      bild.src = url;
    };
    // Bricht der Nutzer ab, meldet das nur ein Teil der Browser.
    inp.oncancel = () => schluss(null);
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
