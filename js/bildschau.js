// Bilder ansehen: zoomen, schieben, sichern.
// =============================================================================
// Ein Brutbild ist nur dann etwas wert, wenn man hineingehen kann – auf die
// Zelle, auf die Made, auf den Zellrand. Ein Bild in fester Größe in einem
// Fenster anzuzeigen ist dafür wertlos.
//
// Warum das eine eigene Bedienung braucht und nicht der Browser das macht:
// Die App fängt waagerechte Wischgesten ab (sonst zieht die Zurück-Geste des
// Systems das ganze Bild zur Seite) und hat das Doppeltipp-Zoom abgeschaltet
// (sonst zoomt man beim schnellen Tippen versehentlich hinein). Beides ist in
// der Liste richtig – im Bild wäre es falsch. Deshalb hat die Bildschau
// `touch-action: none`, ist von der Achsensperre ausgenommen (`data-gesten`)
// und bringt Zoom, Verschieben und Doppeltippen selbst mit.
//
// Bedienung:
//   * zwei Finger auseinander/zusammen  – stufenlos zoomen (1× bis 6×)
//   * doppelt tippen                    – zwischen 1× und 2,5× springen
//   * ziehen                            – im gezoomten Bild verschieben
//   * nach unten ziehen (bei 1×)        – schließen
//   * Mausrad / Doppelklick             – dasselbe am Rechner
//
// „Sichern" reicht das Bild an das Teilen-Menü des Geräts weiter. Auf dem
// iPhone steht dort „Bild sichern" (landet in Fotos), auf Android „Speichern".
// Eine App im Browser darf nicht selbst in die Galerie schreiben – das ist der
// einzige Weg dorthin, und er ist ein Fingertipp lang.

import { esc } from './util.js';
import { t } from './i18n.js';

const MAX = 6;
const DOPPEL = 2.5;

let schauEl = null;    // Wurzelelement der Bildschau (Name eindeutig: Bündel!)
let schauZust = null;       // aktueller Zustand

const grenze = (x, min, max) => Math.min(max, Math.max(min, x));

/**
 * Bild bildschirmfüllend zeigen.
 * @param bild   {daten, klein, datum, bytes}
 * @param opt    {titel, unter, beimLoeschen}
 */
export function bildZeigen(bild, opt = {}) {
  schliessen();

  schauEl = document.createElement('div');
  schauEl.className = 'bildschau';
  schauEl.setAttribute('data-gesten', '');
  schauEl.innerHTML = `
    <div class="bskopf">
      <button type="button" class="bsknopf" data-bs-zu
        aria-label="${esc(t('Schließen'))}">✕</button>
      <div class="bstitel">${esc(opt.titel || '')}<small>${esc(opt.unter || '')}</small></div>
      <div class="bsmasse" data-bs-masse></div>
    </div>
    <div class="bsflaeche" data-bs-flaeche>
      <img data-bs-bild src="${bild.daten}" alt="${esc(opt.titel || t('Foto'))}" draggable="false">
    </div>
    <div class="bsfuss">
      <button type="button" class="knopf leise klein" data-bs-sichern>${
  esc(t('Sichern / Teilen'))}</button>
      <button type="button" class="knopf leise klein" data-bs-passend>${
  esc(t('Ansicht zurücksetzen'))}</button>
      ${opt.beimLoeschen ? `<button type="button" class="knopf leise klein loeschen"
        data-bs-loeschen>${esc(t('Löschen'))}</button>` : ''}
    </div>`;
  document.body.appendChild(schauEl);
  document.body.classList.add('bildoffen');

  const flaeche = schauEl.querySelector('[data-bs-flaeche]');
  const img = schauEl.querySelector('[data-bs-bild]');
  schauZust = { s: 1, x: 0, y: 0, img, flaeche };

  img.addEventListener('load', () => {
    const m = schauEl.querySelector('[data-bs-masse]');
    if (m) m.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
    basisMessen();
  });
  if (img.complete) setTimeout(basisMessen, 0);
  window.addEventListener('resize', basisMessen);

  gestenVerdrahten(flaeche, img);

  schauEl.querySelectorAll('[data-bs-zu]').forEach((b) => { b.onclick = schliessen; });
  schauEl.querySelector('[data-bs-passend]').onclick = () => setzen(1, 0, 0);
  schauEl.querySelector('[data-bs-sichern]').onclick = () => sichern(bild, opt);
  const weg = schauEl.querySelector('[data-bs-loeschen]');
  if (weg) weg.onclick = () => { const f = opt.beimLoeschen; schliessen(); f(); };

  const taste = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); schliessen(); }
  };
  document.addEventListener('keydown', taste);
  schauEl._taste = taste;
}

export function schliessen() {
  if (!schauEl) return;
  document.removeEventListener('keydown', schauEl._taste);
  window.removeEventListener('resize', basisMessen);
  schauEl.remove();
  schauEl = null;
  schauZust = null;
  document.body.classList.remove('bildoffen');
}

export const istOffen = () => !!schauEl;

// --------------------------------------------------------------- Bewegung

function setzen(s, x, y) {
  if (!schauZust) return;
  schauZust.s = grenze(s, 1, MAX);
  // Begrenzt wird gegen die Bildgröße bei Maßstab 1 (`basis`), die beim Laden
  // einmal gemessen wird. Aus der laufenden Größe zurückzurechnen wäre fehler-
  // anfällig, weil sie schon die aktuelle Skalierung enthält.
  const r = schauZust.flaeche.getBoundingClientRect();
  const bw = (schauZust.basis?.w || r.width) * schauZust.s;
  const bh = (schauZust.basis?.h || r.height) * schauZust.s;
  const restX = Math.max(0, (bw - r.width) / 2);
  const restY = Math.max(0, (bh - r.height) / 2);
  schauZust.x = schauZust.s <= 1 ? 0 : grenze(x, -restX, restX);
  schauZust.y = schauZust.s <= 1 ? 0 : grenze(y, -restY, restY);
  schauZust.img.style.transform =
    `translate(${schauZust.x.toFixed(1)}px, ${schauZust.y.toFixed(1)}px) scale(${schauZust.s.toFixed(3)})`;
  schauZust.img.classList.toggle('gezoomt', schauZust.s > 1.01);
}

/** Bildgröße bei Maßstab 1 merken – Grundlage fürs Begrenzen. */
function basisMessen() {
  if (!schauZust) return;
  const vorher = schauZust.img.style.transform;
  schauZust.img.style.transform = 'none';
  const b = schauZust.img.getBoundingClientRect();
  schauZust.basis = { w: b.width, h: b.height };
  schauZust.img.style.transform = vorher;
}

function gestenVerdrahten(flaeche, img) {
  let modus = null;            // 'ziehen' | 'kneifen'
  let startX = 0; let startY = 0; let startTx = 0; let startTy = 0;
  let startAbstand = 0; let startS = 1;
  let letzterTipp = 0;

  const abstand = (t1, t2) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  flaeche.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      modus = 'kneifen';
      startAbstand = abstand(e.touches[0], e.touches[1]);
      startS = schauZust.s;
    } else if (e.touches.length === 1) {
      modus = 'ziehen';
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      startTx = schauZust.x; startTy = schauZust.y;
    }
  }, { passive: true });

  flaeche.addEventListener('touchmove', (e) => {
    if (!schauZust) return;
    if (modus === 'kneifen' && e.touches.length === 2) {
      e.preventDefault();
      const jetzt = abstand(e.touches[0], e.touches[1]);
      if (startAbstand > 0) setzen(startS * (jetzt / startAbstand), schauZust.x, schauZust.y);
    } else if (modus === 'ziehen' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (schauZust.s > 1.01) {
        e.preventDefault();
        setzen(schauZust.s, startTx + dx, startTy + dy);
      } else if (dy > 0) {
        // Bei 1× nach unten ziehen heißt schließen – mit sichtbarer Rückmeldung.
        e.preventDefault();
        img.style.transform = `translateY(${Math.min(dy, 220).toFixed(0)}px) scale(1)`;
        img.style.opacity = String(Math.max(0.35, 1 - dy / 400));
      }
    }
  }, { passive: false });

  const ende = (e) => {
    if (!schauZust) return;
    if (modus === 'ziehen' && schauZust.s <= 1.01) {
      const dy = (e.changedTouches?.[0]?.clientY ?? startY) - startY;
      img.style.opacity = '';
      if (dy > 110) { schliessen(); return; }
      setzen(1, 0, 0);
    }
    modus = null;
  };
  flaeche.addEventListener('touchend', ende, { passive: true });
  flaeche.addEventListener('touchcancel', ende, { passive: true });

  // Doppeltippen: hinein und wieder heraus
  flaeche.addEventListener('click', (e) => {
    const jetzt = Date.now();
    if (jetzt - letzterTipp < 320) {
      letzterTipp = 0;
      if (schauZust.s > 1.01) setzen(1, 0, 0);
      else zoomAn(e.clientX, e.clientY, DOPPEL);
    } else {
      letzterTipp = jetzt;
    }
  });

  // Am Rechner: Mausrad
  flaeche.addEventListener('wheel', (e) => {
    if (!schauZust) return;
    e.preventDefault();
    const faktor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomAn(e.clientX, e.clientY, schauZust.s * faktor);
  }, { passive: false });

  // Am Rechner: ziehen mit gedrückter Maustaste
  let mausAn = false; let mx = 0; let my = 0; let mtx = 0; let mty = 0;
  flaeche.addEventListener('mousedown', (e) => {
    if (schauZust.s <= 1.01) return;
    mausAn = true; mx = e.clientX; my = e.clientY; mtx = schauZust.x; mty = schauZust.y;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!mausAn || !schauZust) return;
    setzen(schauZust.s, mtx + (e.clientX - mx), mty + (e.clientY - my));
  });
  window.addEventListener('mouseup', () => { mausAn = false; });
}

/** Auf einen Punkt zoomen: der Punkt unter dem Finger bleibt, wo er ist. */
function zoomAn(px, py, ziel) {
  if (!schauZust) return;
  const r = schauZust.flaeche.getBoundingClientRect();
  const mitteX = r.left + r.width / 2;
  const mitteY = r.top + r.height / 2;
  const neu = grenze(ziel, 1, MAX);
  const f = neu / schauZust.s;
  const x = (schauZust.x - (px - mitteX)) * f + (px - mitteX);
  const y = (schauZust.y - (py - mitteY)) * f + (py - mitteY);
  setzen(neu, x, y);
}

// ----------------------------------------------------------------- Sichern

/**
 * Bild an das Teilen-Menü des Geräts geben.
 * Der Browser darf nicht in die Galerie schreiben; über das Teilen-Menü kann es
 * der Nutzer mit einem Tipp („Bild sichern"). Kann das Gerät keine Dateien
 * teilen, bleibt der Rückfall: herunterladen.
 */
export async function sichern(bild, opt = {}) {
  const name = `beewise-${(opt.unter || bild.datum || '').replace(/[^0-9]/g, '') || 'foto'}.jpg`;
  try {
    const blob = await (await fetch(bild.daten)).blob();
    const datei = new File([blob], name, { type: blob.type || 'image/jpeg' });
    if (navigator.canShare?.({ files: [datei] })) {
      await navigator.share({ files: [datei], title: opt.titel || 'BeeWise' });
      return 'geteilt';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'abgebrochen';
  }
  try {
    const a = document.createElement('a');
    a.href = bild.daten;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'geladen';
  } catch {
    return 'fehler';
  }
}
