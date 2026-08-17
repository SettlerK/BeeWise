// Aufkleber für die Beuten: QR-Code je Volk.
// =============================================================================
// Kamera des Handys auf den Aufkleber halten – die Stockkarte dieses Volkes ist
// offen. Das Scannen übernimmt bewusst die eingebaute Kamera-App (Android wie
// iPhone erkennen QR-Codes von sich aus und bieten den Link an); die App braucht
// dafür weder Kamerarechte noch eine eigene Scan-Funktion.
//
// Wichtig ist die Adresse im Code: sie muss auf die veröffentlichte App zeigen,
// nicht auf eine lokale Datei. Deshalb ist sie im Fenster sichtbar und änderbar.

import { PDF } from './pdf.js';
import { qrMatrix } from './qr.js';
import { t } from './i18n.js';

const MM = 72 / 25.4;

/** Adresse, die der Aufkleber öffnen soll. */
export function grundadresse() {
  const l = window.location;
  if (!String(l.protocol).startsWith('http')) return '';
  return l.origin + l.pathname;
}

export const volkAdresse = (basis, volkId) =>
  `${String(basis).replace(/#.*$/, '')}#volk=${volkId}`;

/** QR-Code als PDF-Zeichenbefehle – waagerechte Läufe werden zusammengefasst. */
function qrZeichnen(p, text, x, y, kante) {
  const m = qrMatrix(text);
  const n = m.length;
  const s = kante / n;
  const teile = ['0 0 0 rg'];
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!m[r][c]) { c++; continue; }
      let ende = c;
      while (ende + 1 < n && m[r][ende + 1]) ende++;
      const breite = (ende - c + 1) * s;
      teile.push(`${(x + c * s).toFixed(2)} ${(y + kante - (r + 1) * s).toFixed(2)} `
        + `${breite.toFixed(2)} ${(s + 0.2).toFixed(2)} re f`);
      c = ende + 1;
    }
  }
  p.roh(teile.join('\n'));
}

/**
 * Aufkleberbogen für eine Auswahl von Völkern.
 * Raster 2 × 6 auf A4 – groß genug, dass der Code auch mit Handschuhen und
 * schrägem Licht noch erkannt wird, und passend zum Zuschneiden.
 */
export function etikettenPDF(voelker, { basis, standortName = (v) => '' } = {}) {
  const p = new PDF({ schlicht: true });
  const spalten = 2; const zeilen = 6;
  const randX = 14 * MM; const randY = 12 * MM;
  const breite = (595.28 - 2 * randX) / spalten;
  const hoehe = (841.89 - 2 * randY) / zeilen;
  const kante = Math.min(hoehe - 14 * MM, 30 * MM);

  voelker.forEach((v, i) => {
    const platz = i % (spalten * zeilen);
    if (i && platz === 0) p.neueSeite();
    const sp = platz % spalten;
    const ze = Math.floor(platz / spalten);
    const x = randX + sp * breite;
    const y = 841.89 - randY - (ze + 1) * hoehe;

    p.rahmen(x, y, breite, hoehe);
    qrZeichnen(p, volkAdresse(basis, v.id), x + 7 * MM, y + (hoehe - kante) / 2, kante);

    const tx = x + 7 * MM + kante + 6 * MM;
    const maxB = breite - (tx - x) - 5 * MM;
    p.textAn(v.name, tx, y + hoehe / 2 + 10, { groesse: 20, fett: true, maxBreite: maxB });
    p.textAn(standortName(v), tx, y + hoehe / 2 - 6, { groesse: 9, grau: true, maxBreite: maxB });
    if (v.koeniginJahr) {
      p.textAn(t('Königin {jahr}', { jahr: v.koeniginJahr }), tx, y + hoehe / 2 - 19,
        { groesse: 9, grau: true, maxBreite: maxB });
    }
    p.textAn('BeeWise', tx, y + 8 * MM, { groesse: 7, grau: true, maxBreite: maxB });
  });

  return p;
}
