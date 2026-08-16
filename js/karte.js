// Luftbildkarte ohne Fremdbibliothek.
// =============================================================================
// Bewusst kein Leaflet oder Google Maps: die App soll ohne Build, ohne CDN und
// ohne API-Schlüssel laufen. Was hier steht, sind rund 150 Zeilen Kachelmathematik –
// genug für Verschieben, Zoomen, Langdruck-Marker und statische Vorschaubilder.
//
// KACHELQUELLE – eine Stelle, die man für die Veröffentlichung umstellt.
// Warum überhaupt? Nicht technisch, sondern rechtlich: Luftbilder sind teuer
// erhoben, und jeder Anbieter regelt in seinen Nutzungsbedingungen, wer sie in
// welchem Rahmen einbinden darf. Fürs Entwickeln und den privaten Gebrauch ist
// der Esri-Dienst unproblematisch; sobald die App öffentlich verteilt wird,
// braucht sie einen Anbieter mit eigenem (kostenlosem) Konto. Umstellen heisst:
// ANBIETER ändern, gegebenenfalls SCHLUESSEL eintragen – sonst nichts.
//
//   esri       ohne Schlüssel, gut zum Entwickeln
//   maptiler   kostenloses Konto, 100.000 Kacheln im Monat frei, für Veröffentlichung geeignet
//   osm        keine Luftbilder, dafür ohne jede Auflage – Rückfall
//
// Adresssuche: Nominatim (OpenStreetMap), kostenfrei, ohne Schlüssel.
// Fair-Use-Regel: höchstens eine Anfrage pro Sekunde – die App fragt nur auf
// Knopfdruck an.

export const ANBIETER = 'esri';
export const SCHLUESSEL = '';        // nur für maptiler nötig

const QUELLEN = {
  esri: {
    url: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    attribution: 'Luftbild: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  maptiler: {
    url: (z, x, y) => `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${SCHLUESSEL}`,
    attribution: 'Luftbild: MapTiler, © OpenStreetMap-Mitwirkende',
    maxZoom: 20,
  },
  osm: {
    url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    attribution: 'Karte: © OpenStreetMap-Mitwirkende',
    maxZoom: 19,
  },
};

const QUELLE = QUELLEN[ANBIETER] || QUELLEN.esri;

export const KACHEL_URL = (z, x, y) => QUELLE.url(z, x, y);
export const MAX_ZOOM = QUELLE.maxZoom;
export const ATTRIBUTION = `${QUELLE.attribution} · Suche: OpenStreetMap`;

import { t } from './i18n.js';

const K = 256;

export function weltPixel(lat, lon, z) {
  const n = K * 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}

export function ausWeltPixel(x, y, z) {
  const n = K * 2 ** z;
  const lon = (x / n) * 360 - 180;
  const k = Math.PI - (2 * Math.PI * y) / n;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(k) - Math.exp(-k)));
  return { lat, lon };
}

/** Statisches Luftbild als HTML – für Listen und Kopfzeilen. */
export function statischesLuftbild(lat, lon, { z = 17, w = 56, h = 56, radius = 10 } = {}) {
  if (lat == null || lon == null) {
    return `<div class="luftbild leer" style="width:${w}px;height:${h}px;border-radius:${radius}px"></div>`;
  }
  const p = weltPixel(lat, lon, z);
  const links = p.x - w / 2; const oben = p.y - h / 2;
  const x0 = Math.floor(links / K); const y0 = Math.floor(oben / K);
  const x1 = Math.floor((links + w) / K); const y1 = Math.floor((oben + h) / K);
  let inhalt = '';
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      inhalt += `<img src="${KACHEL_URL(z, tx, ty)}" alt="" loading="lazy" style="`
        + `position:absolute;left:${tx * K - links}px;top:${ty * K - oben}px;width:${K}px;height:${K}px">`;
    }
  }
  return `<div class="luftbild" style="width:${w}px;height:${h}px;border-radius:${radius}px">`
    + inhalt + '<i class="nadel"></i></div>';
}

/**
 * Verschiebbare Luftbildkarte mit Langdruck-Marker.
 * @param {HTMLElement} wurzel  Container (Größe kommt aus dem CSS)
 * @param {object} opt  {lat, lon, z, beiWahl(lat, lon)}
 */
export function MiniKarte(wurzel, opt = {}) {
  const zustand = {
    lat: opt.lat ?? 51.16, lon: opt.lon ?? 10.45, z: opt.z ?? (opt.lat ? 17 : 6),
    marke: opt.lat != null ? { lat: opt.lat, lon: opt.lon } : null,
  };

  wurzel.innerHTML = `
    <div class="mk-flaeche"></div>
    <i class="mk-nadel" hidden></i>
    <div class="mk-zoom">
      <button type="button" data-zoom="1" aria-label="näher">+</button>
      <button type="button" data-zoom="-1" aria-label="weiter">−</button>
    </div>
    <div class="mk-hinweis">${t('Karte schieben · lange tippen oder doppelklicken setzt den Standort')}</div>
    <div class="mk-quelle">${t(ATTRIBUTION)}</div>`;
  const flaeche = wurzel.querySelector('.mk-flaeche');
  const nadel = wurzel.querySelector('.mk-nadel');

  function zeichnen() {
    const w = wurzel.clientWidth || 320; const h = wurzel.clientHeight || 220;
    const c = weltPixel(zustand.lat, zustand.lon, zustand.z);
    const links = c.x - w / 2; const oben = c.y - h / 2;
    const max = 2 ** zustand.z;
    let html = '';
    for (let ty = Math.floor(oben / K); ty <= Math.floor((oben + h) / K); ty++) {
      for (let tx = Math.floor(links / K); tx <= Math.floor((links + w) / K); tx++) {
        if (ty < 0 || ty >= max) continue;
        const xx = ((tx % max) + max) % max;
        html += `<img src="${KACHEL_URL(zustand.z, xx, ty)}" alt="" draggable="false" style="`
          + `position:absolute;left:${tx * K - links}px;top:${ty * K - oben}px;width:${K}px;height:${K}px">`;
      }
    }
    flaeche.innerHTML = html;

    if (zustand.marke) {
      const m = weltPixel(zustand.marke.lat, zustand.marke.lon, zustand.z);
      nadel.hidden = false;
      nadel.style.left = `${m.x - links}px`;
      nadel.style.top = `${m.y - oben}px`;
    } else nadel.hidden = true;
  }

  // ---- Schieben und Langdruck
  // Bewusst OHNE setPointerCapture: wird die Maustaste außerhalb des Fensters
  // losgelassen, bleibt eine Erfassung hängen und schluckt anschließend jeden
  // Klick auf der Seite. Stattdessen Zuhörer am Fenster, die garantiert wieder
  // abgeräumt werden.
  let druckTimer = null;
  let zieht = false;

  const beenden = () => {
    zieht = false;
    clearTimeout(druckTimer);
    window.removeEventListener('pointermove', bewegen);
    window.removeEventListener('pointerup', beenden);
    window.removeEventListener('pointercancel', beenden);
    window.removeEventListener('blur', beenden);
  };

  let letzteX = 0; let letzteY = 0; let strecke = 0;

  function bewegen(e) {
    if (!zieht) return;
    const dx = e.clientX - letzteX; const dy = e.clientY - letzteY;
    strecke += Math.abs(dx) + Math.abs(dy);
    if (strecke > 10) clearTimeout(druckTimer);
    letzteX = e.clientX; letzteY = e.clientY;
    const c = weltPixel(zustand.lat, zustand.lon, zustand.z);
    const neuPos = ausWeltPixel(c.x - dx, c.y - dy, zustand.z);
    zustand.lat = Math.max(-85, Math.min(85, neuPos.lat));
    zustand.lon = neuPos.lon;
    zeichnen();
  }

  flaeche.addEventListener('pointerdown', (e) => {
    zieht = true; strecke = 0;
    letzteX = e.clientX; letzteY = e.clientY;
    window.addEventListener('pointermove', bewegen);
    window.addEventListener('pointerup', beenden);
    window.addEventListener('pointercancel', beenden);
    window.addEventListener('blur', beenden);

    clearTimeout(druckTimer);
    druckTimer = setTimeout(() => {
      if (strecke > 10) return;
      const r = wurzel.getBoundingClientRect();
      const w = wurzel.clientWidth; const h = wurzel.clientHeight;
      const c = weltPixel(zustand.lat, zustand.lon, zustand.z);
      const pos = ausWeltPixel(c.x - w / 2 + (e.clientX - r.left),
        c.y - h / 2 + (e.clientY - r.top), zustand.z);
      zustand.marke = pos;
      zeichnen();
      if (navigator.vibrate) navigator.vibrate(30);
      opt.beiWahl?.(pos.lat, pos.lon);
    }, 550);
  });

  // Doppelklick/Doppeltipp setzt den Standort ebenfalls – schneller als warten
  flaeche.addEventListener('dblclick', (e) => {
    const r = wurzel.getBoundingClientRect();
    const c = weltPixel(zustand.lat, zustand.lon, zustand.z);
    const pos = ausWeltPixel(c.x - wurzel.clientWidth / 2 + (e.clientX - r.left),
      c.y - wurzel.clientHeight / 2 + (e.clientY - r.top), zustand.z);
    zustand.marke = pos;
    zeichnen();
    opt.beiWahl?.(pos.lat, pos.lon);
  });

  wurzel.querySelectorAll('[data-zoom]').forEach((b) => {
    b.onclick = () => {
      zustand.z = Math.max(3, Math.min(MAX_ZOOM, zustand.z + Number(b.dataset.zoom)));
      zeichnen();
    };
  });

  requestAnimationFrame(zeichnen);

  return {
    setzen(lat, lon, z) {
      zustand.lat = lat; zustand.lon = lon; zustand.marke = { lat, lon };
      if (z) zustand.z = z; else if (zustand.z < 15) zustand.z = 17;
      zeichnen();
    },
    marke: () => zustand.marke,
    zeichnen,
  };
}

// ------------------------------------------------------------- Adresssuche

export async function adresseSuchen(text) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5'
    + '&accept-language=de&countrycodes=de,at,ch&q=' + encodeURIComponent(text);
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('Suche nicht erreichbar');
  const j = await r.json();
  return j.map((t) => ({ name: t.display_name, lat: parseFloat(t.lat), lon: parseFloat(t.lon) }));
}

export async function adresseZuKoordinaten(lat, lon) {
  const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=de'
    + `&lat=${lat}&lon=${lon}`;
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('nicht erreichbar');
  const j = await r.json();
  return j.display_name || null;
}
