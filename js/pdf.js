// Minimaler PDF-Schreiber – ohne Fremdbibliothek.
// =============================================================================
// Warum selbst schreiben statt window.print()? Weil ein Behandlungsprotokoll ein
// Dokument zum Ablegen und Vorzeigen ist. Eine echte Datei kann man am Handy
// teilen, per Mail schicken und archivieren; der Druckdialog kann das nicht
// zuverlässig.
//
// Umfang bewusst klein: A4 hoch, Helvetica, Text, Linien, Tabellen mit
// Seitenumbruch. Umlaute funktionieren über WinAnsi (Latin-1).

const A4 = { breite: 595.28, hoehe: 841.89 };
const RAND = { links: 45, rechts: 45, oben: 52, unten: 48 };

/** Text nach Latin-1 mit den in PDF nötigen Maskierungen. */
function pdfText(s) {
  let out = '';
  for (const z of String(s ?? '')) {
    const c = z.codePointAt(0);
    if (z === '(' || z === ')' || z === '\\') out += '\\' + z;
    else if (c < 128) out += z;
    else if (c <= 255) out += '\\' + c.toString(8).padStart(3, '0');
    else {
      // Zeichen außerhalb von Latin-1 sinnvoll ersetzen
      const ersatz = { '–': '-', '—': '-', '„': '"', '“': '"', '”': '"', '‚': "'", '‘': "'",
        '’': "'", '…': '...', '→': '->', '·': '-', '≈': 'ca. ', '❗': '!', '✓': 'x', '•': '-' };
      out += ersatz[z] ?? '?';
    }
  }
  return out;
}

// grobe Breitenschätzung für Helvetica (reicht zum Umbrechen und Kürzen)
const ZEICHEN = 0.52;
const textBreite = (s, groesse) => String(s ?? '').length * groesse * ZEICHEN;

function umbrechen(s, groesse, maxBreite) {
  const woerter = String(s ?? '').split(/\s+/).filter(Boolean);
  const zeilen = []; let z = '';
  for (const w of woerter) {
    const test = z ? z + ' ' + w : w;
    if (textBreite(test, groesse) > maxBreite && z) { zeilen.push(z); z = w; }
    else z = test;
  }
  if (z) zeilen.push(z);
  return zeilen.length ? zeilen : [''];
}

export class PDF {
  // `schlicht` schaltet Titelkopf und Fußzeile ab – für Bögen, die frei
  // bedruckt werden (Aufkleber).
  constructor({ titel = '', untertitel = '', fusszeile = '', schlicht = false } = {}) {
    this.seiten = [];
    this.strom = [];
    this.y = 0;
    this.titel = titel;
    this.untertitel = untertitel;
    this.fusszeile = fusszeile;
    this.schlicht = schlicht;
    this.neueSeite();
  }

  get innen() { return A4.breite - RAND.links - RAND.rechts; }

  neueSeite() {
    if (this.strom.length) this.seiten.push(this.strom.join('\n'));
    this.strom = [];
    this.y = A4.hoehe - RAND.oben;
    if (this.titel && !this.schlicht) {
      this.text(this.titel, { groesse: 15, fett: true });
      if (this.untertitel) this.text(this.untertitel, { groesse: 9, grau: true });
      this.linie(6);
      this.y -= 4;
    }
  }

  platzPruefen(hoehe) {
    if (this.y - hoehe < RAND.unten) { this.neueSeite(); return true; }
    return false;
  }

  text(s, { groesse = 10, fett = false, grau = false, x = RAND.links, abstand = 4 } = {}) {
    const zeilen = umbrechen(s, groesse, this.innen - (x - RAND.links));
    for (const z of zeilen) {
      this.platzPruefen(groesse + abstand);
      this.strom.push('BT /' + (fett ? 'F2' : 'F1') + ' ' + groesse + ' Tf '
        + (grau ? '0.45 0.42 0.38 rg ' : '0 0 0 rg ')
        + x.toFixed(1) + ' ' + this.y.toFixed(1) + ' Td (' + pdfText(z) + ') Tj ET');
      this.y -= groesse + abstand;
    }
    return this;
  }

  /** Rohe Zeichenbefehle einfügen (für den QR-Code). */
  roh(befehle) { this.strom.push(befehle); return this; }

  /** Dünner Schnittrahmen für Aufkleberbögen. */
  rahmen(x, y, b, h) {
    this.strom.push(`0.4 w 0.82 0.78 0.72 RG ${x.toFixed(1)} ${y.toFixed(1)} `
      + `${b.toFixed(1)} ${h.toFixed(1)} re S`);
    return this;
  }

  /** Text an beliebiger Stelle der Seite. */
  textAn(s, x, y, { groesse = 10, fett = false, grau = false, maxBreite = 400 } = {}) {
    let txt = String(s ?? '');
    while (textBreite(txt, groesse) > maxBreite && txt.length > 1) txt = txt.slice(0, -2) + '…';
    this.strom.push('BT /' + (fett ? 'F2' : 'F1') + ' ' + groesse + ' Tf '
      + (grau ? '0.45 0.42 0.38 rg ' : '0 0 0 rg ')
      + x.toFixed(1) + ' ' + y.toFixed(1) + ' Td (' + pdfText(txt) + ') Tj ET');
    return this;
  }

  /** Text an fester x-Position, ohne den Zeilenzeiger zu bewegen. */
  zelle(s, x, { groesse = 9, fett = false, grau = false, maxBreite = 200 } = {}) {
    let t = String(s ?? '');
    while (textBreite(t, groesse) > maxBreite && t.length > 1) t = t.slice(0, -2) + '…';
    this.strom.push('BT /' + (fett ? 'F2' : 'F1') + ' ' + groesse + ' Tf '
      + (grau ? '0.45 0.42 0.38 rg ' : '0 0 0 rg ')
      + x.toFixed(1) + ' ' + this.y.toFixed(1) + ' Td (' + pdfText(t) + ') Tj ET');
  }

  linie(abstand = 8, staerke = 0.6) {
    this.platzPruefen(abstand + 2);
    this.y -= abstand * 0.6;
    this.strom.push(`${staerke} w 0.80 0.76 0.70 RG ${RAND.links} ${this.y.toFixed(1)} m `
      + `${(A4.breite - RAND.rechts).toFixed(1)} ${this.y.toFixed(1)} l S`);
    this.y -= abstand * 0.4;
    return this;
  }

  abstand(h = 8) { this.y -= h; return this; }

  ueberschrift(s) {
    this.platzPruefen(30);
    this.abstand(6);
    this.text(s, { groesse: 11.5, fett: true, abstand: 3 });
    this.linie(5);
    return this;
  }

  /**
   * Tabelle mit Kopfzeile und Seitenumbruch.
   * @param spalten [{titel, breite, schluessel}]
   */
  tabelle(spalten, zeilen, { groesse = 8.6 } = {}) {
    const gesamt = spalten.reduce((s, c) => s + c.breite, 0);
    const faktor = this.innen / gesamt;
    const xs = []; let x = RAND.links;
    for (const c of spalten) { xs.push(x); x += c.breite * faktor; }

    const kopf = () => {
      this.y -= 2;
      spalten.forEach((c, i) => this.zelle(c.titel, xs[i],
        { groesse: groesse - 0.6, fett: true, grau: true, maxBreite: c.breite * faktor - 6 }));
      this.y -= groesse + 3;
      this.linie(3, 0.5);
    };
    kopf();

    for (const zeile of zeilen) {
      // Zeilenhöhe aus der längsten umgebrochenen Spalte
      const teile = spalten.map((c, i) =>
        umbrechen(zeile[c.schluessel] ?? '', groesse, c.breite * faktor - 6));
      const hoehe = Math.max(...teile.map((t) => t.length)) * (groesse + 2.4) + 3;
      if (this.platzPruefen(hoehe)) kopf();
      const start = this.y;
      teile.forEach((t, i) => {
        this.y = start;
        for (const z of t) {
          this.zelle(z, xs[i], { groesse, maxBreite: spalten[i].breite * faktor - 4 });
          this.y -= groesse + 2.4;
        }
      });
      this.y = start - hoehe;
      this.strom.push(`0.3 w 0.90 0.87 0.82 RG ${RAND.links} ${(this.y + 4).toFixed(1)} m `
        + `${(A4.breite - RAND.rechts).toFixed(1)} ${(this.y + 4).toFixed(1)} l S`);
    }
    return this;
  }

  bauen() {
    this.seiten.push(this.strom.join('\n'));
    const objekte = [];
    const seitenAnzahl = this.seiten.length;

    // Fußzeile mit Seitenzahl auf jede Seite
    const inhalte = this.schlicht ? this.seiten : this.seiten.map((s, i) => s + '\nBT /F1 7.5 Tf 0.5 0.48 0.44 rg '
      + `${RAND.links} ${(RAND.unten - 18).toFixed(1)} Td (`
      + pdfText(`${this.fusszeile}`) + ') Tj ET'
      + '\nBT /F1 7.5 Tf 0.5 0.48 0.44 rg '
      + `${(A4.breite - RAND.rechts - 60).toFixed(1)} ${(RAND.unten - 18).toFixed(1)} Td (`
      + pdfText(`Seite ${i + 1} von ${seitenAnzahl}`) + ') Tj ET');

    const seitenIds = inhalte.map((_, i) => 4 + i * 2);
    objekte[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objekte[2] = `<< /Type /Pages /Kids [${seitenIds.map((n) => `${n} 0 R`).join(' ')}] `
      + `/Count ${inhalte.length} >>`;
    objekte[3] = '<< /Font << /F1 ' + (4 + inhalte.length * 2) + ' 0 R /F2 '
      + (5 + inhalte.length * 2) + ' 0 R >> >>';
    inhalte.forEach((inhalt, i) => {
      objekte[seitenIds[i]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.breite} ${A4.hoehe}] `
        + `/Resources 3 0 R /Contents ${seitenIds[i] + 1} 0 R >>`;
      objekte[seitenIds[i] + 1] = `<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`;
    });
    objekte[4 + inhalte.length * 2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica '
      + '/Encoding /WinAnsiEncoding >>';
    objekte[5 + inhalte.length * 2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold '
      + '/Encoding /WinAnsiEncoding >>';

    let pdf = '%PDF-1.4\n';
    const posen = [];
    for (let i = 1; i < objekte.length; i++) {
      if (!objekte[i]) continue;
      posen[i] = pdf.length;
      pdf += `${i} 0 obj\n${objekte[i]}\nendobj\n`;
    }
    const xrefPos = pdf.length;
    const anzahl = objekte.length;
    pdf += `xref\n0 ${anzahl}\n0000000000 65535 f \n`;
    for (let i = 1; i < anzahl; i++) {
      pdf += posen[i] != null
        ? `${String(posen[i]).padStart(10, '0')} 00000 n \n`
        : '0000000000 65535 f \n';
    }
    pdf += `trailer\n<< /Size ${anzahl} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  herunterladen(dateiname) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(this.bauen());
    a.download = dateiname;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }
}
