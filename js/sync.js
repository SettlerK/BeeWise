// Abgleich zwischen Geräten – über ein privates GitHub-Repository.
// =============================================================================
// Der Anwendungsfall: am Handy am Bienenstand erfassen, am PC auswerten.
//
// Warum GitHub und nicht ein eigener Server?
//   * kostet nichts und läuft ohne eigene Infrastruktur
//   * die Programmierschnittstelle erlaubt Zugriffe direkt aus dem Browser
//     (CORS ist freigeschaltet) – deshalb braucht es kein Zwischenstück
//   * jede Übertragung ist ein Commit: eine Versionsgeschichte mit
//     Wiederherstellungspunkten gibt es gratis dazu
//   * du hast ohnehin ein Konto
//
// Was übertragen wird: eine einzige JSON-Datei mit allen Datensätzen – ohne die
// Fotos zu den Durchsichten. Die sind einzeln klein, in Summe aber das
// Vielfache aller übrigen Daten, und jede Übertragung schreibt die Datei
// komplett neu; das Repository würde sonst mit jeder Woche wachsen.
// Zusammengeführt wird datensatzweise – der jüngere Stand gewinnt, gelöschte
// Sätze tragen eine Löschmarke und bleiben gelöscht.
//
// Sicherheit: der Zugriffsschlüssel liegt unverschlüsselt auf dem Gerät. Deshalb
// unbedingt einen fein abgestuften Schlüssel verwenden, der nur auf dieses eine
// private Repository und nur auf "Contents" Schreibrechte hat. Geht ein Gerät
// verloren, reicht es, den Schlüssel auf github.com zu widerrufen.

import * as db from './db.js';
import { nowISO } from './util.js';

const EINSTELLUNG = 'sync:github';

export async function einstellungen() {
  return (await db.metaLies(EINSTELLUNG, null)) || {
    aktiv: false, token: '', repo: '', pfad: 'beewise/daten.json', zweig: 'main',
    letzter: null, letzterSha: null, geraet: '',
  };
}

export async function einstellungenSpeichern(neu) {
  const alt = await einstellungen();
  const wert = { ...alt, ...neu };
  await db.metaSchreibe(EINSTELLUNG, wert);
  return wert;
}

const b64kodieren = (text) => {
  const bytes = new TextEncoder().encode(text);
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s);
};

const b64dekodieren = (b64) => {
  const roh = atob(String(b64).replace(/\s/g, ''));
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

function url(e) {
  const [besitzer, name] = String(e.repo).split('/');
  if (!besitzer || !name) throw new Error('Repository bitte als "benutzer/repo" angeben.');
  return `https://api.github.com/repos/${besitzer}/${name}/contents/`
    + e.pfad.split('/').map(encodeURIComponent).join('/');
}

const kopf = (e) => ({
  Authorization: `Bearer ${e.token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

/** Prüft Schlüssel und Repository, ohne etwas zu schreiben. */
export async function pruefen(e) {
  const [besitzer, name] = String(e.repo).split('/');
  if (!besitzer || !name) throw new Error('Repository bitte als "benutzer/repo" angeben.');
  const r = await fetch(`https://api.github.com/repos/${besitzer}/${name}`, { headers: kopf(e) });
  if (r.status === 401) throw new Error('Zugriffsschlüssel wird nicht akzeptiert.');
  if (r.status === 404) throw new Error('Repository nicht gefunden oder Schlüssel ohne Zugriff darauf.');
  if (!r.ok) throw new Error('GitHub antwortet mit Fehler ' + r.status);
  const j = await r.json();
  if (!j.permissions?.push) throw new Error('Der Schlüssel darf in dieses Repository nicht schreiben.');
  return { privat: j.private, name: j.full_name };
}

async function fernLesen(e) {
  const r = await fetch(`${url(e)}?ref=${encodeURIComponent(e.zweig)}`, { headers: kopf(e) });
  if (r.status === 404) return { daten: null, sha: null };
  if (!r.ok) throw new Error('Lesen fehlgeschlagen (' + r.status + ')');
  const j = await r.json();
  return { daten: JSON.parse(b64dekodieren(j.content)), sha: j.sha };
}

async function fernSchreiben(e, dump, sha) {
  const r = await fetch(url(e), {
    method: 'PUT',
    headers: { ...kopf(e), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `BeeWise-Abgleich ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
        + (e.geraet ? ` (${e.geraet})` : ''),
      content: b64kodieren(JSON.stringify(dump)),
      branch: e.zweig,
      ...(sha ? { sha } : {}),
    }),
  });
  if (r.status === 409) throw new Error('Auf GitHub liegt ein neuerer Stand – bitte erneut abgleichen.');
  if (!r.ok) throw new Error('Schreiben fehlgeschlagen (' + r.status + ')');
  return (await r.json()).content?.sha || null;
}

/**
 * Vollständiger Abgleich: holen, zusammenführen, zurückschreiben.
 * Bewusst in dieser Reihenfolge – so gehen Änderungen des anderen Gerätes
 * nie verloren, auch wenn beide am selben Tag etwas eingetragen haben.
 */
export async function abgleichen({ beiSchritt = () => {} } = {}) {
  const e = await einstellungen();
  if (!e.token || !e.repo) throw new Error('Abgleich ist noch nicht eingerichtet.');

  beiSchritt('Hole Stand von GitHub …');
  const { daten: fern, sha } = await fernLesen(e);

  let bericht = null;
  if (fern) {
    beiSchritt('Führe zusammen …');
    bericht = await db.mischeEin(fern);
  }

  beiSchritt('Übertrage …');
  const eigener = await db.exportAlles({ ohneBilder: true });
  eigener.geraet = e.geraet || '';
  const neuerSha = await fernSchreiben(e, eigener, sha);

  await einstellungenSpeichern({ letzter: nowISO(), letzterSha: neuerSha });

  const summe = bericht
    ? Object.values(bericht).reduce((s, b) => ({
      neu: s.neu + b.neu, aktualisiert: s.aktualisiert + b.aktualisiert }), { neu: 0, aktualisiert: 0 })
    : { neu: 0, aktualisiert: 0 };
  return { ...summe, erstmalig: !fern };
}
