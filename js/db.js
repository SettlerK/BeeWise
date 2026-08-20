// Persistenz auf IndexedDB.
//
// Jeder Datensatz trägt eine Sync-Hülle: id, updatedAt, deletedAt, rev, dirty.
// Damit kann später ein Server-Sync ergänzt werden, ohne das Datenmodell zu ändern:
// - dirty = lokal geändert, noch nicht übertragen
// - deletedAt = Tombstone statt echtem Löschen (sonst kämen gelöschte Sätze beim Sync zurück)
// - rev = vom Server vergebene Revision (bleibt lokal null)

import { uid, nowISO } from './util.js';

// Name der lokalen Datenbank. Bleibt bewusst 'stockkarte', damit bereits
// erfasste Testdaten beim Umbenennen der App nicht verloren gehen.
const DB_NAME = 'stockkarte';
const DB_VERSION = 4;

/** true, sobald nur noch im Arbeitsspeicher gearbeitet wird (nichts bleibt erhalten). */
export const nurFluechtig = () => !!_speicher;

export const STORES = [
  'standorte',      // Bienenstände
  'voelker',        // Bienenvölker
  'durchsichten',   // Durchsichtsprotokolle (Stockkarte im engeren Sinn)
  'erledigungen',   // abgehakte Aufgaben  -> Grundlage der dynamischen Terminierung
  'tracht',         // bestätigte/verneinte Blühbeobachtungen des Nutzers
  'aufgaben',       // eigene und automatisch ausgelöste Aufgaben (außerhalb des Regelkatalogs)
  'wanderungen',    // Standortwechsel eines Volkes (Wanderung, Umzug beim Auflösen eines Standes)
  'koeniginnen',    // Königinnen mit Herkunft, Jahrgang und Abstammung
  'bilder',         // Fotos zu Durchsichten (bleiben auf dem Gerät, siehe exportAlles)
  'meta',           // Einstellungen, Caches (Klimatologie, Wetter)
];

/**
 * Speicher, die beim Geräteabgleich ausgelassen werden.
 * Fotos sind einzeln klein, in Summe aber das Vielfache aller übrigen Daten –
 * und jeder Abgleich schreibt die komplette Datei neu. Sie bleiben deshalb auf
 * dem Gerät und wandern nur über die Sicherung mit.
 */
export const NICHT_ABGLEICHEN = ['bilder'];

let _db = null;
let _speicher = null;   // Notfall: reiner Arbeitsspeicher, wenn IndexedDB fehlt

/** Minimaler Ersatz mit derselben Schnittstelle wie ein ObjectStore. */
function speicherShim() {
  if (!_speicher) _speicher = Object.fromEntries(STORES.map((s) => [s, new Map()]));
  return (store) => ({
    getAll() { const r = { result: [..._speicher[store].values()] }; sofort(r); return r; },
    get(id) { const r = { result: _speicher[store].get(id) }; sofort(r); return r; },
    put(o) { _speicher[store].set(o.id, o); const r = {}; sofort(r); return r; },
    delete(id) { _speicher[store].delete(id); const r = {}; sofort(r); return r; },
    clear() { _speicher[store].clear(); const r = {}; sofort(r); return r; },
  });
  function sofort(r) { setTimeout(() => r.onsuccess && r.onsuccess(), 0); }
}

let _oeffnend = null;
let _letzterFehler = null;
export const letzterFehler = () => _letzterFehler;

export function open() {
  if (_db) return Promise.resolve(_db);
  if (_speicher) return Promise.resolve('speicher');
  if (typeof indexedDB === 'undefined') {
    _letzterFehler = 'IndexedDB steht in diesem Browser nicht zur Verfügung.';
    speicherShim();
    return Promise.resolve('speicher');
  }
  // Mehrfachaufrufe bündeln: beim Start laufen sieben Abfragen gleichzeitig los,
  // die sonst sieben Öffnungsanfragen erzeugen würden.
  if (_oeffnend) return _oeffnend;

  _oeffnend = new Promise((resolve) => {
    let fertig = false;
    const abschliessen = (wert) => { if (!fertig) { fertig = true; resolve(wert); } };

    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      // Firefox und Safari verbieten IndexedDB bei Dateien von der Festplatte
      _letzterFehler = 'Datenbank nicht erlaubt: ' + (e?.message || e);
      speicherShim();
      abschliessen('speicher');
      return;
    }

    // Notbremse: hängt das Öffnen – typisch, wenn eine ältere Fassung der App in
    // einem anderen Tab die Datenbank belegt –, darf die App nicht stehenbleiben.
    // Sonst reagiert später kein einziger Knopf mehr, ohne dass man sieht warum.
    const wecker = setTimeout(() => {
      _letzterFehler = 'Die Datenbank ließ sich nicht öffnen. Vermutlich ist BeeWise noch '
        + 'in einem anderen Tab oder Fenster offen. Bitte alle anderen schließen und '
        + 'diese Seite neu laden.';
      speicherShim();
      abschliessen('speicher');
    }, 5000);

    req.onupgradeneeded = () => {
      const dbx = req.result;
      for (const st of STORES) {
        if (!dbx.objectStoreNames.contains(st)) {
          const os = dbx.createObjectStore(st, { keyPath: 'id' });
          if (st !== 'meta') os.createIndex('updatedAt', 'updatedAt');
          // Fotos werden nie am Stück geladen, sondern immer je Volk – dafür
          // braucht es einen eigenen Schlüssel.
          if (st === 'bilder') os.createIndex('volkId', 'volkId');
        }
      }
    };
    req.onblocked = () => {
      _letzterFehler = 'BeeWise ist noch in einem anderen Tab geöffnet und blockiert die '
        + 'Aktualisierung der Datenbank. Bitte die anderen Tabs schließen.';
    };
    req.onsuccess = () => {
      clearTimeout(wecker);
      _db = req.result;
      // Fordert ein anderer Tab eine neuere Fassung an, geben wir die Datenbank frei,
      // statt ihn zu blockieren.
      _db.onversionchange = () => {
        try { _db.close(); } catch { /* egal */ }
        _db = null; _oeffnend = null;
      };
      abschliessen(_db);
    };
    req.onerror = () => {
      clearTimeout(wecker);
      _letzterFehler = 'Datenbank nicht nutzbar: ' + (req.error?.message || req.error);
      speicherShim();
      abschliessen('speicher');
    };
  });
  return _oeffnend;
}

function tx(store, mode = 'readonly') {
  return open().then((dbx) => {
    if (dbx === 'speicher') return speicherShim()(store);
    try {
      return dbx.transaction(store, mode).objectStore(store);
    } catch (e) {
      // Fehlt ein Bereich (etwa weil die Aktualisierung der Datenbank blockiert
      // war), lieber flüchtig weiterarbeiten als jede Eingabe stumm verwerfen.
      _letzterFehler = `Bereich „${store}" fehlt in der Datenbank (${e?.message || e}). `
        + 'Bitte alle BeeWise-Tabs schließen und die Seite neu laden.';
      speicherShim();
      return speicherShim()(store);
    }
  });
}

/** Datenbank vollständig verwerfen – letzter Ausweg, vorher sichern! */
export function zuruecksetzen() {
  return new Promise((resolve) => {
    try { _db?.close(); } catch { /* egal */ }
    _db = null; _oeffnend = null; _speicher = null;
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = () => resolve(true);
    r.onerror = () => resolve(false);
    r.onblocked = () => resolve(false);
  });
}

export async function alle(store, { mitGeloeschten = false } = {}) {
  const os = await tx(store);
  const rows = await new Promise((res, rej) => {
    const r = os.getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });
  return mitGeloeschten ? rows : rows.filter((r) => !r.deletedAt);
}

export async function hole(store, id) {
  const os = await tx(store);
  return new Promise((res, rej) => {
    const r = os.get(id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}

export async function schreibe(store, obj) {
  const rec = {
    ...obj,
    id: obj.id || uid(),
    updatedAt: nowISO(),
    deletedAt: obj.deletedAt || null,
    rev: obj.rev ?? null,
    dirty: true,
  };
  const os = await tx(store, 'readwrite');
  await new Promise((res, rej) => {
    const r = os.put(rec);
    r.onsuccess = () => res(); r.onerror = () => rej(r.error);
  });
  return rec;
}

export async function loesche(store, id) {
  const vorhanden = await hole(store, id);
  if (!vorhanden) return;
  return schreibe(store, { ...vorhanden, deletedAt: nowISO() });
}

/** Hartes Löschen – nur für Caches und beim Import. */
export async function entferne(store, id) {
  const os = await tx(store, 'readwrite');
  return new Promise((res, rej) => {
    const r = os.delete(id);
    r.onsuccess = () => res(); r.onerror = () => rej(r.error);
  });
}

export async function leere(store) {
  const os = await tx(store, 'readwrite');
  return new Promise((res, rej) => {
    const r = os.clear();
    r.onsuccess = () => res(); r.onerror = () => rej(r.error);
  });
}

/** Datensätze über einen Index holen (für Fotos je Volk). */
export async function nachIndex(store, index, wert) {
  const os = await tx(store);
  return new Promise((res, rej) => {
    let r;
    try {
      r = os.index(index).getAll(wert);
    } catch {
      // Arbeitsspeicher-Ersatz kennt keine Indizes
      r = os.getAll();
    }
    // Der Vergleich läuft in beiden Fällen – gefiltert ist gefiltert.
    r.onsuccess = () => res((r.result || []).filter((x) => !x.deletedAt && x[index] === wert));
    r.onerror = () => rej(r.error);
  });
}

// ---------------------------------------------------------------- meta / cache

export async function metaLies(key, fallback = null) {
  const r = await hole('meta', key);
  return r ? r.wert : fallback;
}

export async function metaSchreibe(key, wert) {
  const os = await tx('meta', 'readwrite');
  return new Promise((res, rej) => {
    const r = os.put({ id: key, wert, updatedAt: nowISO() });
    r.onsuccess = () => res(); r.onerror = () => rej(r.error);
  });
}

// ------------------------------------------------------------- Export / Import

export async function exportAlles({ ohneBilder = false } = {}) {
  const daten = {};
  for (const s of STORES) {
    if (ohneBilder && NICHT_ABGLEICHEN.includes(s)) continue;
    daten[s] = await alle(s, { mitGeloeschten: true });
  }
  // Wetter- und Klimazwischenspeicher gehören nicht in die Sicherung: sie sind
  // jederzeit neu abrufbar, ändern sich stündlich und würden den Abgleich
  // unnötig aufblähen.
  daten.meta = (daten.meta || []).filter((r) => !String(r.id).startsWith('wetter:'));
  return {
    format: 'beewise-export',
    version: 1,
    erstellt: nowISO(),
    daten,
  };
}

export async function importAlles(dump, { ersetzen = false } = {}) {
  if (!dump || !['beewise-export', 'stockkarte-export'].includes(dump.format)) {
    throw new Error('Keine gültige Sicherungsdatei.');
  }
  const bericht = {};
  for (const s of STORES) {
    // Fehlt ein Speicher in der Datei (ältere Sicherung, Abgleichdatei ohne
    // Bilder), bleibt der örtliche Bestand unangetastet.
    if (dump.daten && !(s in dump.daten)) continue;
    const rows = dump.daten?.[s] || [];
    if (ersetzen) await leere(s);
    const os = await tx(s, 'readwrite');
    for (const row of rows) {
      if (!row?.id) continue;
      await new Promise((res, rej) => {
        const r = os.put(row);
        r.onsuccess = () => res(); r.onerror = () => rej(r.error);
      });
    }
    bericht[s] = rows.length;
  }
  return bericht;
}

/**
 * Fremde Datensätze einmischen – Grundlage jedes Abgleichs.
 * Regel: jüngeres `updatedAt` gewinnt, Löschmarken zählen wie Änderungen.
 * @returns Bericht {store: {neu, aktualisiert, uebersprungen}}
 */
export async function mischeEin(dump) {
  if (!dump?.daten) throw new Error('Keine gültigen Daten.');
  const bericht = {};
  for (const store of STORES) {
    const rows = dump.daten[store] || [];
    const b = { neu: 0, aktualisiert: 0, uebersprungen: 0 };
    for (const row of rows) {
      if (!row?.id) continue;
      const lokal = await hole(store, row.id);
      if (!lokal) {
        const os = await tx(store, 'readwrite');
        await new Promise((res) => { const r = os.put({ ...row, dirty: false }); r.onsuccess = res; });
        b.neu += 1;
      } else if (new Date(row.updatedAt || 0) > new Date(lokal.updatedAt || 0)) {
        const os = await tx(store, 'readwrite');
        await new Promise((res) => { const r = os.put({ ...row, dirty: false }); r.onsuccess = res; });
        b.aktualisiert += 1;
      } else {
        b.uebersprungen += 1;
      }
    }
    bericht[store] = b;
  }
  return bericht;
}

// ------------------------------------------------------------------ Sync-Stub
//
// Vorbereitet, aber bewusst noch nicht angeschlossen. Ein Server-Adapter muss nur
// diese beiden Methoden implementieren; die App ruft syncNow() auf.

export const Sync = {
  adapter: null,           // { push(records), pull(seit) }
  async ausstehend() {
    const out = {};
    for (const s of STORES.filter((x) => x !== 'meta')) {
      out[s] = (await alle(s, { mitGeloeschten: true })).filter((r) => r.dirty);
    }
    return out;
  },
  async syncNow() {
    if (!this.adapter) return { ok: false, grund: 'kein Sync-Adapter konfiguriert' };
    const seit = await metaLies('sync:letzter', null);
    const raus = await this.ausstehend();
    await this.adapter.push(raus);
    const rein = await this.adapter.pull(seit);
    for (const [store, rows] of Object.entries(rein || {})) {
      const os = await tx(store, 'readwrite');
      for (const row of rows) {
        const lokal = await hole(store, row.id);
        // Konfliktregel: jüngeres updatedAt gewinnt (Last-Write-Wins, feldweise wäre besser)
        if (!lokal || new Date(row.updatedAt) > new Date(lokal.updatedAt)) {
          await new Promise((res) => { const r = os.put({ ...row, dirty: false }); r.onsuccess = res; });
        }
      }
    }
    await metaSchreibe('sync:letzter', nowISO());
    return { ok: true };
  },
};
