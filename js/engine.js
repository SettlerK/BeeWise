// Fälligkeits-Engine
// =============================================================================
// Aufgaben werden NICHT gespeichert, sondern jedes Mal neu berechnet. Gespeichert
// werden nur Erledigungen. Dadurch verschiebt sich der ganze Rest des Jahres
// automatisch mit, sobald sich eine Arbeit verzögert – genau das ist die
// dynamische Abhängigkeit.

import { addDays, diffTage, heute, iso, parseISO } from './util.js';
import { t } from './i18n.js';
import { REGELN, regelNach } from './regeln.js';

export const ZUSTAND_RANG = {
  ueberfaellig: 0, faellig: 1, bald: 2, wartet: 3, spaeter: 4, erledigt: 5, verpasst: 6,
};

const VORSCHAU_TAGE = 21;   // ab wann eine Aufgabe als "bald" auftaucht
const VERPASST_TAGE = 21;   // so lange mahnt die App; danach ist der Zug abgefahren

function datumImJahr(jahr, [m, d]) { return new Date(jahr, m - 1, d); }

/** Kalenderfenster auflösen, auch über den Jahreswechsel hinweg. */
function datumsFenster(anker, datum) {
  const j = datum.getFullYear();
  const kandidaten = [];
  for (const jj of [j - 1, j, j + 1]) {
    const von = datumImJahr(jj, anker.von);
    let bis = datumImJahr(jj, anker.bis);
    if (bis < von) bis = datumImJahr(jj + 1, anker.bis);
    kandidaten.push({ von, bis });
  }
  return kandidaten.find((k) => datum >= k.von && datum <= k.bis)
    || kandidaten.find((k) => k.von > datum)
    || kandidaten[kandidaten.length - 1];
}

/**
 * @param {object} ctx
 *  datum, standorte[], voelker[], erledigungen[],
 *  koeniginnen[] (für Regeln mit Bedingung),
 *  tracht: {standortId: {arten:[...]}},
 *  wetter: {standortId: {ersterWarmtag, durchsichtWetter, brutfrei, ersterNachtfrost}}
 */
export function planBerechnen(ctx) {
  const datum = ctx.datum || heute();
  const standorte = ctx.standorte || [];
  const voelker = (ctx.voelker || []).filter((v) => v.status !== 'aufgeloest');
  const erledigungen = ctx.erledigungen || [];
  const jahr = datum.getFullYear();

  const standortNach = new Map(standorte.map((s) => [s.id, s]));

  // Ziele je Regelart
  const zieleFuer = (regel) => {
    if (regel.ziel === 'volk') {
      return voelker.map((v) => ({
        typ: 'volk', id: v.id, name: v.name,
        standortId: v.standortId,
        standortName: standortNach.get(v.standortId)?.name || '–',
        obj: v,
      }));
    }
    if (regel.ziel === 'stand') {
      return standorte.map((s) => ({
        typ: 'stand', id: s.id, name: s.name, standortId: s.id, standortName: s.name, obj: s,
      }));
    }
    return [{ typ: 'imkerei', id: 'imkerei', name: 'Imkerei', standortId: null, standortName: '' }];
  };

  const erledigungenVon = (regelId, ziel) => erledigungen
    .filter((e) => e.regelId === regelId && !e.deletedAt)
    .filter((e) => {
      if (ziel.typ === 'imkerei') return true;              // Betriebsaufgaben: alle zählen
      if (e.zielTyp === ziel.typ) return e.zielId === ziel.id;
      // Vorgänger auf Volksebene für eine Imkerei-Aufgabe (z. B. Abfüllen nach Ernte)
      return ziel.typ === 'imkerei';
    })
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));

  const inSaison = (e, regel) => {
    const d = parseISO(e.datum);
    if (regel.anker.typ === 'datum') {
      const f = datumsFenster(regel.anker, datum);
      return d >= addDays(f.von, -20) && d <= addDays(f.bis, 20);
    }
    return d.getFullYear() === jahr;
  };

  const memo = new Map();

  /** Terminfenster einer Regel für ein Ziel – rekursiv über Vorgänger. */
  function fenster(regel, ziel, tiefe = 0) {
    const k = regel.id + '|' + ziel.id;
    if (memo.has(k)) return memo.get(k);
    if (tiefe > 6) return { fehler: 'Regelkette zu tief' };

    let res;
    const a = regel.anker;

    if (a.typ === 'datum') {
      const f = datumsFenster(a, datum);
      res = { von: f.von, bis: f.bis, quelle: 'kalender' };

    } else if (a.typ === 'bluete') {
      const tr = ctx.tracht?.[ziel.standortId];
      const art = tr?.arten?.find((x) => x.art === a.art);
      const basis = art ? (a.ereignis === 'ende' ? art.ende : art.start) : null;
      if (!basis) {
        res = { wartetAuf: t('Trachtdaten für {art}', { art: a.art }), quelle: 'unbekannt' };
      } else {
        res = {
          von: addDays(basis, regel.fenster?.[0] ?? 0),
          bis: addDays(basis, regel.fenster?.[1] ?? 14),
          quelle: art.bestaetigt ? 'bluete-bestaetigt' : (art.prognose ? 'bluete-prognose' : 'bluete'),
          bezug: a.ereignis === 'ende' ? t('{art} Blühende', { art: t(art.name) })
            : t('{art} Blühbeginn', { art: t(art.name) }),
          bezugDatum: basis,
        };
      }

    } else if (a.typ === 'wetter') {
      const w = ctx.wetter?.[ziel.standortId];
      const treffer = w?.[a.ereignis];
      const basis = treffer ? parseISO(treffer) : (a.ersatz ? datumImJahr(jahr, a.ersatz) : null);
      res = {
        von: addDays(basis, regel.fenster?.[0] ?? 0),
        bis: addDays(basis, regel.fenster?.[1] ?? 21),
        quelle: treffer ? 'wetter' : 'wetter-ersatz',
        bezug: treffer ? t(WETTER_TEXT[a.ereignis]) : t('Erfahrungswert (kein Wetterbezug verfügbar)'),
        bezugDatum: basis,
      };

    } else if (a.typ === 'nachAufgabe') {
      const vorRegel = regelNach(a.regel);
      const vorZiel = vorRegel.ziel === ziel.typ ? ziel
        : (vorRegel.ziel === 'volk' ? ziel : { ...ziel, typ: vorRegel.ziel });
      let genutzt = vorRegel;
      let erl = erledigungenVon(a.regel, ziel).filter((e) => inSaison(e, vorRegel))[0];
      if (!erl && a.regelAlternativ) {
        const alt = regelNach(a.regelAlternativ);
        erl = erledigungenVon(a.regelAlternativ, ziel).filter((e) => inSaison(e, alt))[0];
        if (erl) genutzt = alt;
      }
      if (erl) {
        const basis = parseISO(erl.datum);
        res = {
          von: addDays(basis, regel.fenster?.[0] ?? 0),
          bis: addDays(basis, regel.fenster?.[1] ?? 14),
          quelle: 'nachAufgabe',
          bezug: t('{regel} am {datum}', { regel: t(genutzt.titel),
            datum: `${erl.datum.slice(8, 10)}.${erl.datum.slice(5, 7)}.` }),
          bezugDatum: basis,
        };
      } else {
        // Vorgänger noch offen: geschätzten Termin des Vorgängers weiterreichen
        const vf = fenster(vorRegel, vorZiel, tiefe + 1);
        const basis = vf.von || vf.bis;
        res = {
          von: basis ? addDays(basis, regel.fenster?.[0] ?? 0) : null,
          bis: basis ? addDays(basis, regel.fenster?.[1] ?? 14) : null,
          quelle: 'nachAufgabe-prognose',
          wartetAuf: vorRegel.kurz || vorRegel.titel,
          bezug: t('hängt an: {regel}', { regel: t(vorRegel.kurz || vorRegel.titel) }),
          bezugDatum: basis,
        };
      }
    } else {
      res = { fehler: 'unbekannter Anker' };
    }

    // Saisonklammer und harte Fristen
    if (res.bis && regel.saisonEnde) {
      const ende = datumImJahr(jahr, regel.saisonEnde);
      if (res.bis > ende) res.bis = ende;
      if (res.von && res.von > ende) res.abgelaufen = true;
    }
    if (res.bis && regel.haerteFrist) {
      const frist = datumImJahr(jahr, regel.haerteFrist);
      if (res.bis > frist) { res.bis = frist; res.frist = true; }
    }

    memo.set(k, res);
    return res;
  }

  const aufgaben = [];

  for (const regel of REGELN) {
    for (const ziel of zieleFuer(regel)) {
      // Manche Regeln gelten nur für bestimmte Ziele – etwa das Umweiseln, das
      // nur dort auftauchen soll, wo die Königin wirklich alt ist.
      if (regel.bedingung) {
        let gilt = false;
        try { gilt = !!regel.bedingung(ziel, ctx); } catch { gilt = false; }
        if (!gilt) continue;
      }
      const eigene = erledigungenVon(regel.id, ziel)
        .filter((e) => (ziel.typ === 'imkerei' ? e.zielId === 'imkerei' : e.zielId === ziel.id))
        .filter((e) => inSaison(e, regel));
      const f = fenster(regel, ziel);
      if (f.fehler) continue;

      let von = f.von; let bis = f.bis; let wartetAuf = f.wartetAuf;
      let bezug = f.bezug; let quelle = f.quelle;
      let letzte = eigene[0] || null;

      if (regel.wiederholung) {
        if (letzte) {
          const basis = parseISO(letzte.datum);
          von = addDays(basis, regel.wiederholung.min);
          bis = addDays(basis, regel.wiederholung.max);
          quelle = 'wiederholung';
          bezug = t('zuletzt am {datum}', { datum: `${letzte.datum.slice(8, 10)}.${letzte.datum.slice(5, 7)}.` });
          wartetAuf = null;
          if (regel.saisonEnde) {
            const ende = datumImJahr(jahr, regel.saisonEnde);
            if (von > ende) continue;                    // Saison durch
            if (bis > ende) bis = ende;
          }
          if (regel.anker.typ === 'datum') {
            const fw = datumsFenster(regel.anker, datum);
            if (von > fw.bis) continue;
            if (bis > fw.bis) bis = fw.bis;
          }
        }
      } else if (letzte) {
        aufgaben.push(bauen(regel, ziel, von, bis, 'erledigt', { bezug, quelle, letzte }));
        continue;
      }

      if (!von && !bis) {
        aufgaben.push(bauen(regel, ziel, null, null, 'wartet', { bezug, quelle, wartetAuf, letzte }));
        continue;
      }
      if (f.abgelaufen) continue;

      // Vorgänger explizit gefordert?
      let blockiert = null;
      for (const vid of regel.benoetigt || []) {
        const vr = regelNach(vid);
        const erl = erledigungenVon(vid, ziel).filter((e) => inSaison(e, vr))[0];
        if (!erl) { blockiert = vr.kurz || vr.titel; break; }
      }

      let zustand;
      const bisTage = bis ? diffTage(bis, datum) : null;
      const vonTage = von ? diffTage(von, datum) : null;

      if (bisTage != null && (bisTage < -VERPASST_TAGE || (regel.freiwillig && bisTage < 0))) {
        zustand = 'verpasst';                       // Fenster endgültig vorbei
      } else if (blockiert) zustand = 'wartet';
      else if (bisTage != null && bisTage < 0) zustand = 'ueberfaellig';
      else if (vonTage != null && vonTage <= 0) zustand = 'faellig';
      else if (vonTage != null && vonTage <= VORSCHAU_TAGE) zustand = 'bald';
      else zustand = 'spaeter';

      aufgaben.push(bauen(regel, ziel, von, bis, zustand, {
        bezug, quelle, wartetAuf: blockiert || wartetAuf, letzte,
      }));
    }
  }

  // ---- eigene und automatisch ausgelöste Aufgaben dazunehmen
  const volkNach = new Map(voelker.map((v) => [v.id, v]));
  for (const e of ctx.eigene || []) {
    if (e.deletedAt) continue;
    const von = e.von ? parseISO(e.von) : null;
    const bis = e.bis ? parseISO(e.bis) : von;
    const bisTage = bis ? diffTage(bis, datum) : null;
    const vonTage = von ? diffTage(von, datum) : null;
    let zustand;
    if (e.erledigtAm) zustand = 'erledigt';
    else if (bisTage != null && bisTage < -VERPASST_TAGE) zustand = 'verpasst';
    else if (bisTage != null && bisTage < 0) zustand = 'ueberfaellig';
    else if (vonTage == null || vonTage <= 0) zustand = 'faellig';
    else if (vonTage <= VORSCHAU_TAGE) zustand = 'bald';
    else zustand = 'spaeter';

    const volk = volkNach.get(e.zielId);
    aufgaben.push({
      schluessel: 'eigen|' + e.id,
      gruppierung: e.gruppe || ('eigen|' + e.id),
      eigenId: e.id, regelId: null,
      titel: e.titel, kurz: e.titel,
      kategorie: e.kategorie || 'eigene',
      info: e.info || '', checkliste: [],
      felder: [{ key: 'notiz', label: 'Notiz', typ: 'text' }],
      wichtig: !!e.wichtig, freiwillig: false, hilfe: e.hilfe || null,
      wetterbedarf: e.wetterbedarf || null,
      ziel: {
        typ: e.zielTyp || 'imkerei', id: e.zielId || 'imkerei',
        name: e.zielName || 'Imkerei',
        standortId: volk?.standortId || e.zielId,
        standortName: standortNach.get(volk?.standortId)?.name || '',
      },
      von, bis, zustand,
      bezug: e.quelle === 'auto' ? 'automatisch ausgelöst' : 'eigene Aufgabe',
      quelle: e.quelle,
    });
  }

  aufgaben.sort((a, b) => (ZUSTAND_RANG[a.zustand] - ZUSTAND_RANG[b.zustand])
    || (b.wichtig - a.wichtig)
    || ((a.von?.getTime() || 0) - (b.von?.getTime() || 0))
    || a.titel.localeCompare(b.titel));

  return aufgaben;
}

const WETTER_TEXT = {
  ersterWarmtag: 'erster Tag über 10 °C',
  durchsichtWetter: 'drei Tage über 12 °C',
  ersterNachtfrost: 'erster Nachtfrost',
  brutfrei: 'brutfrei nach der ersten Frostperiode',
};

function bauen(regel, ziel, von, bis, zustand, extra) {
  return {
    schluessel: regel.id + '|' + ziel.id,
    gruppierung: regel.id,
    regelId: regel.id,
    hilfe: regel.hilfe || null,
    rechner: regel.rechner || null,
    titel: regel.titel,
    kurz: regel.kurz || regel.titel,
    kategorie: regel.kategorie,
    info: regel.info,
    checkliste: regel.checkliste || [],
    felder: regel.felder || [],
    wichtig: !!regel.wichtig,
    freiwillig: !!regel.freiwillig,
    wetterbedarf: regel.wetterbedarf || null,
    aktion: regel.aktion || null,
    ziel,
    von, bis, zustand,
    ...extra,
  };
}

/**
 * Welche Trachtfrage soll dem Imker gerade gestellt werden?
 * Nur wenn das Modell den Blühbeginn in der Nähe sieht und noch keine
 * Bestätigung vorliegt – sonst nervt die App.
 */
export function trachtFragen(trachtProStandort, standorte, beobachtungen, datum = heute()) {
  const fragen = [];
  // Nur nach Arten fragen, von denen tatsächlich ein Termin abhängt – sonst wird
  // die App zum Fragebogen.
  const relevant = new Set(REGELN.filter((r) => r.anker.typ === 'bluete').map((r) => r.anker.art));
  const standortNach = new Map(standorte.map((s) => [s.id, s]));
  for (const [standortId, t] of Object.entries(trachtProStandort || {})) {
    for (const a of t.arten || []) {
      if (a.bestaetigt || !a.start || !relevant.has(a.art)) continue;
      const dTage = diffTage(a.start, datum);
      if (dTage > 10 || dTage < -21) continue;
      const letzteAntwort = (beobachtungen || [])
        .filter((o) => o.standortId === standortId && o.art === a.art && o.jahr === datum.getFullYear())
        .sort((x, y) => (x.datum < y.datum ? 1 : -1))[0];
      if (letzteAntwort && diffTage(datum, parseISO(letzteAntwort.datum)) < 5) continue;
      fragen.push({
        standortId, standortName: standortNach.get(standortId)?.name || '',
        art: a.art, name: a.name,
        modellStart: a.start,
        text: t('Blüht {art} am Stand „{ort}“ schon?',
          { art: t(a.name), ort: standortNach.get(standortId)?.name || '' }),
      });
    }
  }
  return fragen.sort((a, b) => (a.modellStart - b.modellStart)).slice(0, 4);
}

/** Kurzstatistik für den Kopf der Heute-Ansicht. */
export function zusammenfassung(aufgaben) {
  const z = { ueberfaellig: 0, faellig: 0, bald: 0, wartet: 0 };
  for (const a of aufgaben) if (z[a.zustand] != null) z[a.zustand]++;
  return z;
}

export function erledigungSchluessel(regelId, ziel, datum) {
  return `${regelId}|${ziel.typ}:${ziel.id}|${iso(datum)}`;
}
