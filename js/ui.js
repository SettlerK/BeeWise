// Oberflächen-Bausteine: Bottom-Sheet, Toast, Formularfelder.
import { esc } from './util.js';
import { t, uebersetzeDom } from './i18n.js';

let sheetEl; let dunkelEl; let toastEl; let toastTimer; let aufSchliessen = null;

export function uiInit() {
  dunkelEl = document.getElementById('abdunkeln');
  sheetEl = document.getElementById('sheet');
  toastEl = document.getElementById('toast');
  dunkelEl.addEventListener('click', () => sheetZu());
}

export function sheetAuf({ titel, unter = '', inhalt = '', danach = null, beimSchliessen = null }) {
  sheetEl.innerHTML = `<div class="griff"></div><h3>${esc(t(titel))}</h3>`
    + (unter ? `<div class="unter">${esc(t(unter))}</div>` : '')
    + inhalt;
  uebersetzeDom(sheetEl);
  sheetEl.classList.add('auf');
  dunkelEl.classList.add('auf');
  sheetEl.scrollTop = 0;
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
  sheetEl.classList.remove('auf');
  dunkelEl.classList.remove('auf');
  if (aufSchliessen) { const f = aufSchliessen; aufSchliessen = null; f(); }
}

export function toast(text) {
  toastEl.textContent = t(text);
  toastEl.classList.add('auf');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('auf'), 2800);
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
    return `<label class="feld" data-key="${f.key}" data-typ="chips"${f.typ === 'jaNein' ? ' data-einfach="1"' : ''}>${kopf}
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
