// Oberflächen-Bausteine: Bottom-Sheet, Toast, Formularfelder.
import { esc } from './util.js';
import { t, uebersetzeDom } from './i18n.js';

let sheetEl; let dunkelEl; let toastEl; let toastTimer; let aufSchliessen = null;

// ------------------------------------------------------------------ Zurück
// Ein geöffnetes Fenster muss man wieder verlassen können – und zwar auf allen
// Wegen, die jemand erwartet: sichtbarer Knopf, Escape, Tippen daneben, nach
// unten wischen und die Zurück-Taste des Geräts. Letzteres ist am Handy der
// wichtigste: ohne eigenen Eintrag im Verlauf würde sie die App beenden.
//
// Umgesetzt mit GENAU EINEM zusätzlichen Verlaufseintrag, solange irgendetwas
// „offen" ist – ein Fenster oder eine Unteransicht. Ein Eintrag je Ebene wäre
// naheliegender, geht aber schief, sobald ein Fenster im selben Wimpernschlag
// schließt und eine Unteransicht öffnet (Standwahl → Durchgang): dann jagen
// sich Zurückspringen und Hinzufügen gegenseitig. Deshalb wird der Abgleich
// ans Ende der Ereignisschleife gelegt und erst der Endzustand angewandt.
let sheetOffen = false;
let ausPopstate = false;      // Schließen kam von der Zurück-Taste
let erwarteterPop = false;    // wir haben selbst history.back() ausgelöst
let marke = false;            // liegt unser Eintrag im Verlauf?
let abgleichGeplant = false;
let zurueckFallback = null;   // greift, wenn kein Fenster offen ist (z. B. Volk-Ansicht)
let ebenenZaehler = () => 0;  // wie viele Unteransichten die App gerade zeigt

function markeSetzen(soll) {
  if (soll === marke) return;
  marke = soll;
  try {
    if (soll) history.pushState({ beewise: 'ebene' }, '');
    else { erwarteterPop = true; history.back(); }
  } catch { marke = soll ? false : marke; erwarteterPop = false; }   // file://
}

function verlaufAbgleichen() {
  if (abgleichGeplant) return;
  abgleichGeplant = true;
  setTimeout(() => {
    abgleichGeplant = false;
    markeSetzen(sheetOffen || ebenenZaehler() > 0);
  }, 0);
}

/** Wird von der Anwendung gesetzt: was passiert bei „zurück" ohne offenes Fenster? */
export function zurueckFallbackSetzen(fn) { zurueckFallback = fn; }

/** Wird von der Anwendung gesetzt: zeigt sie gerade eine Unteransicht? */
export function ebenenQuelleSetzen(fn) { ebenenZaehler = fn; verlaufAbgleichen(); }

/** Nach jedem Ansichtswechsel aufrufen. */
export { verlaufAbgleichen };

export const sheetIstAuf = () => sheetOffen;

export function uiInit() {
  achsenSperre();
  dunkelEl = document.getElementById('abdunkeln');
  sheetEl = document.getElementById('sheet');
  toastEl = document.getElementById('toast');
  dunkelEl.addEventListener('click', () => sheetZu());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheetOffen) { e.preventDefault(); sheetZu(); }
  });

  window.addEventListener('popstate', () => {
    if (erwarteterPop) { erwarteterPop = false; return; }
    marke = false;                       // unser Eintrag ist soeben verbraucht
    if (sheetOffen) {
      ausPopstate = true;
      try { sheetZu(); } finally { ausPopstate = false; }
    } else if (zurueckFallback) {
      zurueckFallback();
    }
    verlaufAbgleichen();                 // bleibt etwas offen, kommt ein neuer Eintrag
  });

  // Nach unten wischen schließt ebenfalls – das erwartet man bei einem Fenster,
  // das von unten hereinfährt.
  let start = null;
  sheetEl.addEventListener('touchstart', (e) => {
    start = sheetEl.scrollTop <= 0 ? e.touches[0].clientY : null;
  }, { passive: true });
  sheetEl.addEventListener('touchend', (e) => {
    if (start != null && e.changedTouches[0].clientY - start > 90) sheetZu();
    start = null;
  });
}

// ------------------------------------------------------------- Achsensperre
// Beim Blättern soll sich NUR senkrecht etwas bewegen. Dagegen arbeiten zwei
// Dinge, die beide nicht von der App kommen:
//
//   1. Das Wischen von der Bildschirmkante („zurück"): sobald ein Eintrag im
//      Verlauf liegt – und den legt die App an, solange ein Fenster offen ist –,
//      zieht das Betriebssystem beim seitlichen Wischen das GANZE Bild mit,
//      samt feststehendem Fenster. Genau das sieht aus wie „das Fenster
//      verrutscht", und `overscroll-behavior` hilft dagegen nicht.
//   2. Das Verschieben der Anzeige im hineingezoomten Zustand.
//
// Gegenmittel: eine Achsenentscheidung nach den ersten acht Pixeln. Überwiegt
// die waagerechte Richtung, wird die Geste abgefangen (`preventDefault`) – das
// Betriebssystem bekommt sie nicht mehr, und nichts verrutscht. Überwiegt die
// senkrechte, bleibt alles unberührt und die Seite scrollt wie immer.
//
// Der Zuhörer muss dafür `passive: false` sein. Das kostet einen Hauch
// Scrollleistung, aber nur bis zur Entscheidung – danach greift die Sperre nicht
// mehr ein.
//
// Ausgenommen sind Eingabefelder (Textmarkierung, Datumsrad) und Bereiche, die
// ausdrücklich waagerecht blättern sollen (`[data-querscroll]`). Der Durchgang
// braucht keine Ausnahme: sein Wischen wertet `touchend` aus und funktioniert
// auch dann, wenn die Geste unterwegs abgefangen wurde.
const AUSNAHME = 'input,textarea,select,[data-querscroll],[data-gesten]';

function achsenSperre() {
  let x0 = null;
  let y0 = null;
  let entschieden = false;
  let sperren = false;

  const frei = () => { x0 = null; entschieden = false; sperren = false; };

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || e.target.closest?.(AUSNAHME)) { frei(); return; }
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    entschieden = false;
    sperren = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (x0 == null || e.touches.length !== 1) return;
    const dx = Math.abs(e.touches[0].clientX - x0);
    const dy = Math.abs(e.touches[0].clientY - y0);
    if (!entschieden) {
      if (dx < 8 && dy < 8) return;         // noch nicht eindeutig
      entschieden = true;
      sperren = dx > dy;                    // waagerecht überwiegt
    }
    if (sperren && e.cancelable) e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', frei, { passive: true });
  document.addEventListener('touchcancel', frei, { passive: true });
}

// ----------------------------------------------------- Hintergrund festhalten
// Ist ein Fenster offen und man wischt darüber hinaus, scrollt sonst die Seite
// dahinter mit – man verliert seine Stelle in der Liste und es wirkt kaputt.
// Zuverlässig verhindern lässt sich das nur, indem der Rumpf für die Dauer
// festgesetzt wird; `overflow:hidden` allein genügt auf iOS nicht. Die
// Scrollhöhe wird gemerkt und danach wiederhergestellt.
let gemerktesY = 0;
let gesperrt = false;

function hintergrundSperren() {
  if (gesperrt) return;
  gesperrt = true;
  gemerktesY = window.scrollY || document.documentElement.scrollTop || 0;
  const b = document.body;
  b.style.position = 'fixed';
  b.style.top = `-${gemerktesY}px`;
  b.style.left = '0';
  b.style.right = '0';
  b.style.width = '100%';
  b.classList.add('festgehalten');
}

function hintergrundFreigeben() {
  if (!gesperrt) return;
  gesperrt = false;
  const b = document.body;
  b.style.position = '';
  b.style.top = '';
  b.style.left = '';
  b.style.right = '';
  b.style.width = '';
  b.classList.remove('festgehalten');
  window.scrollTo(0, gemerktesY);
}

export function sheetAuf({ titel, unter = '', inhalt = '', danach = null, beimSchliessen = null }) {
  sheetEl.innerHTML = `<div class="sheetkopf">
      <button type="button" class="sheetzurueck" data-sheet-zu aria-label="${esc(t('Zurück'))}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>
        <span>${esc(t('Zurück'))}</span>
      </button>
      <div class="griff"></div>
      <button type="button" class="sheetschliessen" data-sheet-zu aria-label="${esc(t('Schließen'))}">✕</button>
    </div>
    <h3>${esc(t(titel))}</h3>`
    + (unter ? `<div class="unter">${esc(t(unter))}</div>` : '')
    + inhalt;
  uebersetzeDom(sheetEl);
  sheetEl.querySelectorAll('[data-sheet-zu]').forEach((b) => { b.onclick = () => sheetZu(); });
  sheetEl.classList.add('auf');
  dunkelEl.classList.add('auf');
  sheetEl.scrollTop = 0;
  sheetOffen = true;
  hintergrundSperren();
  verlaufAbgleichen();
  aufSchliessen = beimSchliessen;
  if (danach) {
    try {
      danach(sheetEl);
    } catch (e) {
      // Ein Fehler beim Verdrahten eines einzelnen Bedienelements darf nicht
      // dazu führen, dass anschließend gar nichts mehr reagiert.
      console.error('Fehler beim Aufbau des Fensters:', e);
      toast('Teile dieses Fensters konnten nicht aufgebaut werden.');
    }
  }
}

export function sheetZu() {
  sheetOffen = false;
  sheetEl.classList.remove('auf');
  dunkelEl.classList.remove('auf');
  hintergrundFreigeben();
  if (!ausPopstate) verlaufAbgleichen();
  if (aufSchliessen) { const f = aufSchliessen; aufSchliessen = null; f(); }
}

/**
 * Kurze Rückmeldung. Mit `aktion` bekommt sie einen Knopf und steht länger.
 *
 * Die längere Standzeit ist kein Detail: Draußen, mit Handschuh und Sonne auf
 * dem Bildschirm, sind knapp drei Sekunden für etwas, das man antippen soll,
 * schlicht nicht erreichbar. Und angetippt wird nur der Knopf, nicht die
 * Fläche – sonst nimmt ein Streifschuss beim Weiterarbeiten die Eingabe
 * zurück.
 */
export function toast(text, opt = {}) {
  toastEl.textContent = '';
  const wort = document.createElement('span');
  wort.textContent = t(text);
  toastEl.appendChild(wort);
  toastEl.classList.toggle('mitknopf', !!opt.aktion);
  if (opt.aktion) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'toastknopf';
    knopf.textContent = t(opt.knopf || 'Rückgängig');
    knopf.onclick = () => { toastWeg(); opt.aktion(); };
    toastEl.appendChild(knopf);
  }
  toastEl.classList.add('auf');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(toastWeg, opt.dauer || (opt.aktion ? 10000 : 2800));
}

function toastWeg() {
  toastEl.classList.remove('auf');
  toastEl.classList.remove('mitknopf');
}

export function bestaetige(frage, jaText = 'Ja, löschen') {
  return new Promise((res) => {
    // Achtung: sheetZu() ruft beimSchliessen auf. Ohne diese Sperre hätte das
    // Schliessen die Antwort "nein" gesetzt, bevor das "ja" ankommt – dann wird
    // nie etwas gelöscht.
    let beantwortet = false;
    const antwort = (wert) => { if (beantwortet) return; beantwortet = true; res(wert); };
    sheetAuf({
      titel: frage,
      inhalt: `<div class="knopfreihe">
        <button class="knopf leise" data-nein>Abbrechen</button>
        <button class="knopf gefahr" data-ja>${esc(t(jaText))}</button></div>`,
      danach(root) {
        root.querySelector('[data-ja]').onclick = () => { antwort(true); sheetZu(); };
        root.querySelector('[data-nein]').onclick = () => { antwort(false); sheetZu(); };
      },
      beimSchliessen: () => antwort(false),
    });
  });
}

// ------------------------------------------------------------------ Formular

const kopfZeile = (f) => `<span>${esc(t(f.label))}`
  + (f.einheit ? ` <em>${esc(t(f.einheit))}</em>` : '') + '</span>';
const fussZeile = (f) => (f.hinweis ? `<small class="feldhinweis">${esc(t(f.hinweis))}</small>` : '');

export function feldHTML(f, wert) {
  const w = wert ?? f.standard ?? '';
  const kopf = kopfZeile(f);
  const fuss = fussZeile(f);
  if (f.typ === 'zahl') {
    return `<label class="feld" data-key="${f.key}" data-typ="zahl">${kopf}
      <div class="stepper">
        <button type="button" data-minus>−</button>
        <input type="number" inputmode="decimal" step="${f.schritt || 1}" value="${esc(w)}">
        <button type="button" data-plus>+</button>
      </div>${fuss}</label>`;
  }
  if (f.typ === 'chips' || f.typ === 'jaNein') {
    const opt = f.typ === 'jaNein' ? ['ja', 'nein'] : (f.optionen || []);
    // `einfach` = nur eine Auswahl gleichzeitig. Ohne das würde aus zwei Tippern
    // ein Wert wie „durchgekommen, schwach" – bei Mehrfachbefunden (Brutbild)
    // gewollt, bei Entweder-oder-Feldern ein Fehler.
    return `<label class="feld" data-key="${f.key}" data-typ="chips"${
  f.typ === 'jaNein' || f.einfach ? ' data-einfach="1"' : ''}>${kopf}
      <div class="chips">${opt.map((o) =>
        `<button type="button" data-wert="${esc(o)}"${String(w).split(', ').includes(String(o)) ? ' class="an"' : ''}>${esc(o === 'ja' ? t('Ja') : o === 'nein' ? t('Nein') : t(o))}</button>`).join('')}
      </div>${fuss}</label>`;
  }
  if (f.typ === 'auswahl') {
    return `<label class="feld" data-key="${f.key}" data-typ="wert">${kopf}
      <select><option value=""></option>${(f.optionen || []).map((o) =>
        `<option value="${esc(o)}"${String(o) === String(w) ? ' selected' : ''}>${esc(t(o))}</option>`).join('')}</select>${fuss}</label>`;
  }
  if (f.typ === 'datum') {
    return `<label class="feld" data-key="${f.key}" data-typ="wert">${kopf}
      <input type="date" value="${esc(w)}">${fuss}</label>`;
  }
  if (f.key === 'notiz' || f.typ === 'mehrzeilig') {
    return `<label class="feld" data-key="${f.key}" data-typ="wert">${kopf}
      <textarea placeholder="${esc(f.platzhalter || '')}">${esc(w)}</textarea>${fuss}</label>`;
  }
  return `<label class="feld" data-key="${f.key}" data-typ="wert">${kopf}
    <input type="text" value="${esc(w)}" placeholder="${esc(f.platzhalter || '')}">${fuss}</label>`;
}

export function felderVerdrahten(root, felder = []) {
  root.querySelectorAll('[data-typ="zahl"]').forEach((l) => {
    const inp = l.querySelector('input');
    const s = parseFloat(inp.step) || 1;
    const um = (richtung) => {
      inp.value = Math.max(0, Math.round(((parseFloat(inp.value) || 0) + richtung * s) * 100) / 100);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    };
    l.querySelector('[data-minus]').onclick = () => um(-1);
    l.querySelector('[data-plus]').onclick = () => um(1);
  });

  root.querySelectorAll('[data-typ="chips"]').forEach((l) => {
    l.querySelectorAll('button').forEach((b) => {
      b.onclick = () => {
        if (l.dataset.einfach) l.querySelectorAll('button').forEach((x) => x.classList.remove('an'));
        b.classList.toggle('an');
        l.dispatchEvent(new Event('input', { bubbles: true }));
      };
    });
  });

  // Abgeleitete Felder (z. B. Anzahl Gläser aus Menge und Glasgröße)
  const abgeleitet = felder.filter((f) => f.abgeleitet);
  if (abgeleitet.length) {
    const felderEl = new Map(abgeleitet.map((f) =>
      [f.key, root.querySelector(`[data-key="${f.key}"] input`)]));
    const rechne = () => {
      const w = werteLesen(root);
      for (const f of abgeleitet) {
        const el = felderEl.get(f.key);
        if (!el || el.dataset.manuell) continue;
        let v = null;
        try { v = f.abgeleitet.rechne(w); } catch { v = null; }
        el.value = (v == null || Number.isNaN(v)) ? '' : v;
      }
    };
    root.addEventListener('input', (e) => {
      const key = e.target.closest('.feld')?.dataset.key;
      if (felderEl.has(key)) { felderEl.get(key).dataset.manuell = '1'; return; }
      rechne();
    });
    rechne();
  }
}

export function werteLesen(root) {
  const out = {};
  root.querySelectorAll('.feld').forEach((l) => {
    const key = l.dataset.key;
    if (!key) return;
    if (l.dataset.typ === 'chips') {
      const an = [...l.querySelectorAll('button.an')].map((b) => b.dataset.wert);
      if (an.length) out[key] = an.join(', ');
    } else {
      const inp = l.querySelector('input,select,textarea');
      const v = inp?.value?.trim();
      if (v) out[key] = l.dataset.typ === 'zahl' ? parseFloat(v) : v;
    }
  });
  return out;
}
