// QR-Code-Erzeugung – ohne Fremdbibliothek.
// =============================================================================
// Gebraucht wird das für die Aufkleber am Volk: ein Aufkleber je Beute, Kamera
// draufhalten, die Stockkarte dieses Volkes ist offen. Genau ein Anwendungsfall,
// deshalb bewusst nur der Teil des Standards, den er braucht:
//
//   * Byte-Modus (URLs, UTF-8)
//   * Fehlerkorrektur M (etwa 15 % – verkraftet Propolisflecken und Kratzer)
//   * Versionen 1 bis 10 (bis 213 Zeichen; eine Adresse mit Kennung passt locker)
//
// Wer mehr braucht, erweitert KAPAZITAET, BLOECKE und AUSRICHTUNG nach der Norm
// ISO/IEC 18004 – der Rest des Codes ist versionsunabhängig geschrieben.

// Nutzbare Zeichen je Version im Byte-Modus bei Fehlerkorrektur M
const KAPAZITAET = [14, 26, 42, 62, 84, 106, 122, 152, 180, 213];

// [Fehlerkorrektur-Wörter je Block, Blöcke Gruppe 1, Datenwörter Gruppe 1,
//  Blöcke Gruppe 2, Datenwörter Gruppe 2]
const BLOECKE = {
  1: [10, 1, 16, 0, 0],
  2: [16, 1, 28, 0, 0],
  3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],
  5: [24, 2, 43, 0, 0],
  6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0],
  8: [22, 2, 38, 2, 39],
  9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
};

// Mittelpunkte der Ausrichtungsmuster je Version
const AUSRICHTUNG = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

// ------------------------------------------------- Rechnen im Galoisfeld GF(256)

const EXP = new Array(512);
const LOG = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;          // Primitivpolynom der Norm
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const mal = (a, b) => ((a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]);

/** Generatorpolynom für n Fehlerkorrekturwörter. */
function generator(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const neu = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      neu[j] ^= g[j];                    // mal x
      neu[j + 1] ^= mal(g[j], EXP[i]);   // mal a^i
    }
    g = neu;
  }
  return g;
}

/** Reed-Solomon-Rest = die Fehlerkorrekturwörter eines Blocks. */
function fehlerkorrektur(daten, n) {
  const g = generator(n);
  const rest = new Array(n).fill(0);
  for (const d of daten) {
    const faktor = d ^ rest[0];
    rest.shift(); rest.push(0);
    if (faktor !== 0) for (let i = 0; i < n; i++) rest[i] ^= mal(g[i + 1], faktor);
  }
  return rest;
}

// ------------------------------------------------------------ Datenstrom bauen

const bitLaenge = (x) => (x === 0 ? 0 : 32 - Math.clz32(x));

function datenwoerter(text, version) {
  const bytes = new TextEncoder().encode(text);
  const [ecPro, b1, d1, b2, d2] = BLOECKE[version];
  const gesamt = b1 * d1 + b2 * d2;

  const bits = [];
  const schiebe = (wert, anzahl) => {
    for (let i = anzahl - 1; i >= 0; i--) bits.push((wert >> i) & 1);
  };

  schiebe(0b0100, 4);                       // Byte-Modus
  schiebe(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) schiebe(b, 8);
  schiebe(0, Math.min(4, gesamt * 8 - bits.length));   // Abschluss
  while (bits.length % 8) bits.push(0);

  const woerter = [];
  for (let i = 0; i < bits.length; i += 8) {
    woerter.push(bits.slice(i, i + 8).reduce((s, b) => (s << 1) | b, 0));
  }
  // Auffüllen mit den in der Norm vorgesehenen Wechselbytes
  const fuell = [0xec, 0x11];
  for (let i = 0; woerter.length < gesamt; i++) woerter.push(fuell[i % 2]);

  // In Blöcke teilen, je Block die Fehlerkorrektur rechnen, dann verschränken
  const bloecke = [];
  let pos = 0;
  for (let i = 0; i < b1; i++) { bloecke.push(woerter.slice(pos, pos + d1)); pos += d1; }
  for (let i = 0; i < b2; i++) { bloecke.push(woerter.slice(pos, pos + d2)); pos += d2; }
  const ecs = bloecke.map((b) => fehlerkorrektur(b, ecPro));

  const strom = [];
  const maxD = Math.max(d1, d2);
  for (let i = 0; i < maxD; i++) {
    for (const b of bloecke) if (i < b.length) strom.push(b[i]);
  }
  for (let i = 0; i < ecPro; i++) for (const e of ecs) strom.push(e[i]);

  const ausgabe = [];
  for (const w of strom) for (let i = 7; i >= 0; i--) ausgabe.push((w >> i) & 1);
  return ausgabe;
}

// --------------------------------------------------------------- Muster setzen

function grundmuster(version) {
  const groesse = 17 + 4 * version;
  const m = Array.from({ length: groesse }, () => new Array(groesse).fill(0));
  const fest = Array.from({ length: groesse }, () => new Array(groesse).fill(false));
  const setz = (r, c, wert) => { m[r][c] = wert; fest[r][c] = true; };

  // Suchmuster mit Trennlinien
  const sucher = (r0, c0) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const r1 = r0 + r; const c1 = c0 + c;
        if (r1 < 0 || c1 < 0 || r1 >= groesse || c1 >= groesse) continue;
        const rand = (r >= 0 && r <= 6 && (c === 0 || c === 6))
          || (c >= 0 && c <= 6 && (r === 0 || r === 6));
        const kern = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setz(r1, c1, rand || kern ? 1 : 0);
      }
    }
  };
  sucher(0, 0); sucher(0, groesse - 7); sucher(groesse - 7, 0);

  // Taktlinien
  for (let i = 8; i < groesse - 8; i++) {
    setz(6, i, i % 2 === 0 ? 1 : 0);
    setz(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Ausrichtungsmuster
  const mitten = AUSRICHTUNG[version];
  for (const r0 of mitten) {
    for (const c0 of mitten) {
      if ((r0 === 6 && c0 === 6) || (r0 === 6 && c0 === groesse - 7)
        || (r0 === groesse - 7 && c0 === 6)) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const aussen = Math.max(Math.abs(r), Math.abs(c));
          setz(r0 + r, c0 + c, aussen === 1 ? 0 : 1);
        }
      }
    }
  }

  // Platz für die Formatangaben freihalten
  for (let i = 0; i <= 8; i++) {
    if (!fest[8][i]) setz(8, i, 0);
    if (!fest[i][8]) setz(i, 8, 0);
  }
  for (let i = 0; i < 8; i++) {
    setz(8, groesse - 1 - i, 0);
    setz(groesse - 1 - i, 8, 0);
  }
  setz(groesse - 8, 8, 1);          // immer dunkel

  // Versionsangabe ab Version 7
  if (version >= 7) {
    let rest = version << 12;
    while (bitLaenge(rest) >= 13) rest ^= 0x1f25 << (bitLaenge(rest) - 13);
    const info = (version << 12) | rest;
    for (let i = 0; i < 18; i++) {
      const b = (info >> i) & 1;
      const r = Math.floor(i / 3); const c = i % 3;
      setz(r, groesse - 11 + c, b);
      setz(groesse - 11 + c, r, b);
    }
  }

  return { m, fest, groesse };
}

const MASKEN = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => ((((r * c) % 2) + ((r * c) % 3)) % 2) === 0,
  (r, c) => ((((r + c) % 2) + ((r * c) % 3)) % 2) === 0,
];

/** Bewertung nach den vier Regeln der Norm – kleiner ist besser. */
function strafpunkte(m) {
  const n = m.length;
  let punkte = 0;

  const reihe = (holen) => {
    for (let a = 0; a < n; a++) {
      let lauf = 1;
      for (let b = 1; b < n; b++) {
        if (holen(a, b) === holen(a, b - 1)) {
          lauf++;
          if (lauf === 5) punkte += 3; else if (lauf > 5) punkte += 1;
        } else lauf = 1;
      }
    }
  };
  reihe((a, b) => m[a][b]);
  reihe((a, b) => m[b][a]);

  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const s = m[r][c] + m[r][c + 1] + m[r + 1][c] + m[r + 1][c + 1];
      if (s === 0 || s === 4) punkte += 3;
    }
  }

  const muster = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const musterUmgekehrt = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const passt = (holen, a, b, muster2) => muster2.every((x, i) => holen(a, b + i) === x);
  for (let a = 0; a < n; a++) {
    for (let b = 0; b + 10 < n; b++) {
      if (passt((x, y) => m[x][y], a, b, muster) || passt((x, y) => m[x][y], a, b, musterUmgekehrt)) punkte += 40;
      if (passt((x, y) => m[y][x], a, b, muster) || passt((x, y) => m[y][x], a, b, musterUmgekehrt)) punkte += 40;
    }
  }

  let dunkel = 0;
  for (const zeile of m) for (const x of zeile) dunkel += x;
  const anteil = (dunkel * 100) / (n * n);
  punkte += Math.floor(Math.abs(anteil - 50) / 5) * 10;
  return punkte;
}

function formatSetzen(m, maske) {
  const groesse = m.length;
  const daten = (0b00 << 3) | maske;          // Fehlerkorrektur M = 00
  let rest = daten << 10;
  while (bitLaenge(rest) >= 11) rest ^= 0x537 << (bitLaenge(rest) - 11);
  const format = ((daten << 10) | rest) ^ 0x5412;
  const bit = (i) => (format >> i) & 1;

  // Beide Kopien der Formatangabe. Die Reihenfolge ist in der Norm festgelegt:
  // Bit 0 steht oben links senkrecht ganz außen und rechts oben waagerecht ganz
  // außen – nicht spiegelbildlich, wie man vermuten würde.
  for (let i = 0; i < 15; i++) {
    const b = bit(i);
    if (i < 6) m[i][8] = b;
    else if (i < 8) m[i + 1][8] = b;
    else m[groesse - 15 + i][8] = b;

    if (i < 8) m[8][groesse - 1 - i] = b;
    else if (i === 8) m[8][7] = b;
    else m[8][14 - i] = b;
  }
  m[groesse - 8][8] = 1;
}

/**
 * Erzeugt die Modulmatrix zu einem Text.
 * @returns {number[][]} Zeilen mit 0 (hell) und 1 (dunkel), ohne Ruhezone
 */
export function qrMatrix(text) {
  const laenge = new TextEncoder().encode(text).length;
  const version = KAPAZITAET.findIndex((k) => laenge <= k) + 1;
  if (!version) throw new Error('Text zu lang für diesen QR-Erzeuger.');

  const { m, fest, groesse } = grundmuster(version);
  const bits = datenwoerter(text, version);

  // Zickzack von rechts unten nach oben, spaltenweise zu zweit
  let i = 0; let aufwaerts = true;
  for (let spalte = groesse - 1; spalte > 0; spalte -= 2) {
    if (spalte === 6) spalte--;                       // Taktspalte auslassen
    for (let k = 0; k < groesse; k++) {
      const zeile = aufwaerts ? groesse - 1 - k : k;
      for (let s = 0; s < 2; s++) {
        const sp = spalte - s;
        if (fest[zeile][sp]) continue;
        m[zeile][sp] = i < bits.length ? bits[i++] : 0;
      }
    }
    aufwaerts = !aufwaerts;
  }

  // Beste Maske suchen
  let besteMaske = 0; let bestePunkte = Infinity; let bestesBild = null;
  for (let maske = 0; maske < 8; maske++) {
    const probe = m.map((zeile) => zeile.slice());
    for (let r = 0; r < groesse; r++) {
      for (let c = 0; c < groesse; c++) {
        if (!fest[r][c] && MASKEN[maske](r, c)) probe[r][c] ^= 1;
      }
    }
    formatSetzen(probe, maske);
    const p = strafpunkte(probe);
    if (p < bestePunkte) { bestePunkte = p; besteMaske = maske; bestesBild = probe; }
  }
  bestesBild.maske = besteMaske;
  bestesBild.version = version;
  return bestesBild;
}
