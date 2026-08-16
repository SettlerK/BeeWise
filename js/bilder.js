// Bilder zu den Trachtpflanzen.
// =============================================================================
// Keine fest verdrahteten Bild-URLs (die sind irgendwann tot), sondern zwei
// Wikipedia-Schnittstellen:
//   summary    -> Kurzbeschreibung
//   media-list -> alle Bilder des Artikels; daraus wird ein ECHTES FOTO gewählt
//
// Warum media-list und nicht einfach das Vorschaubild aus summary? Weil das bei
// vielen Pflanzenartikeln eine botanische Zeichnung aus dem 19. Jahrhundert ist
// (Koehler, Thomé, Sturm). Zum Wiedererkennen am Feldrand taugt die nicht.
// Deshalb: Zeichnungen, Karten und Grafiken werden aussortiert und Bilder
// bevorzugt, deren Beschreibung nach Blüte aussieht.

import { metaLies, metaSchreibe } from './db.js';

const ARTIKEL = {
  hasel: 'Gemeine_Hasel',
  erle: 'Schwarz-Erle',
  salweide: 'Salweide',
  obstbluete: 'Kulturapfel',
  loewenzahn: 'Gewöhnlicher_Löwenzahn',
  raps: 'Raps',
  robinie: 'Robinie',
  linde: 'Sommer-Linde',
  phacelia: 'Rainfarn-Phazelie',
  heide: 'Besenheide',
  springkraut: 'Drüsiges_Springkraut',
  waldtracht: 'Honigtau',
};

// Alles, was keine Pflanzenfotografie ist
const AUSSORTIEREN = new RegExp([
  'koehler', 'thome', 'thomé', 'sturm', 'flora von', 'illustration', 'zeichnung', 'drawing',
  'plate', 'tafel', 'karte', 'map', 'verbreitung', 'distribution', 'range', 'diagram',
  'logo', 'icon', 'wappen', 'briefmarke', 'stamp', 'schema', 'svg',
].join('|'), 'i');
// Hinweise auf eine Blütenaufnahme
const BEVORZUGEN = /blüte|bluete|blossom|flower|inflorescence|kätzchen|kaetzchen|catkin|blühend|feld|bestand/i;

export function wikiSeite(art) {
  return ARTIKEL[art] ? `https://de.wikipedia.org/wiki/${ARTIKEL[art]}` : null;
}

// Wikimedia-Vorschaubilder haben die Form .../thumb/a/ab/Datei.jpg/320px-Datei.jpg
// Die Breite in dieser URL einfach hochzuschreiben ist unzuverlässig: ist das Original
// kleiner als die gewünschte Breite, antwortet der Server mit einem Fehler – dann steht
// in der App ein kaputtes Bild. Special:FilePath macht das richtig: es leitet auf die
// passende Größe um und begrenzt selbst auf die Originalgröße.
const dateiPfad = (dateiname, px) =>
  'https://de.wikipedia.org/wiki/Special:FilePath/'
  + encodeURIComponent(String(dateiname).replace(/^(File|Datei|Bild):/i, '').replace(/ /g, '_'))
  + `?width=${px}`;

const istRasterbild = (name) => /\.(jpe?g|png)$/i.test(String(name).split('?')[0]);

/** @returns Dateiname (ohne "File:") eines möglichst echten Fotos, sonst null */
async function fotoSuchen(titel) {
  const r = await fetch(
    `https://de.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(titel)}`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();

  const kandidaten = (j.items || [])
    .filter((i) => i.type === 'image' && i.title)
    .map((i) => ({
      datei: String(i.title).replace(/^(File|Datei):/i, ''),
      text: [i.title, i.caption?.text].filter(Boolean).join(' '),
    }))
    .filter((i) => istRasterbild(i.datei))
    .filter((i) => !AUSSORTIEREN.test(i.text));

  if (!kandidaten.length) return null;
  const treffer = kandidaten.find((i) => BEVORZUGEN.test(i.text)) || kandidaten[0];
  return treffer.datei;
}

/** @returns {Promise<{bild, klein, text, quelle}|null>} */
export async function trachtBild(art) {
  const titel = ARTIKEL[art];
  if (!titel) return null;
  const k = 'bild2:' + art;
  const cache = await metaLies(k, null);
  if (cache?.bild) return cache;

  const daten = { bild: null, klein: null, text: '', quelle: wikiSeite(art) };

  // 1) Kurztext und Rückfallbild aus der Zusammenfassung
  try {
    const r = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titel)}`);
    if (r.ok) {
      const j = await r.json();
      daten.text = j.extract || '';
      daten.quelle = j.content_urls?.desktop?.page || daten.quelle;
      // unverändert übernehmen – diese URL liefert der Server garantiert aus
      daten.bild = j.thumbnail?.source || null;
      daten.klein = daten.bild;
    }
  } catch { /* offline – dann bleibt der Platzhalter */ }

  // 2) Möglichst ein echtes Foto statt einer botanischen Zeichnung
  try {
    const datei = await fotoSuchen(titel);
    if (datei) {
      daten.bild = dateiPfad(datei, 900);
      daten.klein = dateiPfad(datei, 200);
      daten.datei = datei;
    }
  } catch { /* Vorschaubild aus der Zusammenfassung bleibt */ }

  if (daten.bild) await metaSchreibe(k, daten);
  return daten.bild ? daten : null;
}

/**
 * Zwischenspeicher für eine Art verwerfen.
 * Wird aufgerufen, wenn ein Bild im Browser nicht lädt – beim nächsten Aufruf
 * wird dann neu gesucht, statt dauerhaft ein kaputtes Bild anzuzeigen.
 */
export async function bildVerwerfen(art) {
  await metaSchreibe('bild2:' + art, null);
}

/** Rückfallbild ohne Netz – als Zeichnung erkennbar, nicht als Foto missverständlich. */
export function platzhalter(name, farbe = '#E0A02C') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">
    <rect width="120" height="80" fill="#F3EDE1"/>
    <g fill="${farbe}" opacity=".8" transform="translate(60 34)">
      <circle r="6"/>
      ${[0, 60, 120, 180, 240, 300].map((a) =>
        `<ellipse rx="6" ry="12" cy="-15" transform="rotate(${a})"/>`).join('')}
    </g>
    <text x="60" y="70" font-family="sans-serif" font-size="8" text-anchor="middle"
      fill="#9A9285">${name} – kein Bild geladen</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
