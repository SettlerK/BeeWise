// Videohilfe zu den Aufgaben.
// =============================================================================
// Primärquelle ist die Playlist „Tipps und Tricks für Imker" des Kanals
// Land.Schafft.Bayern (Bayerisches Staatsministerium / LWG Veitshöchheim) –
// fachlich solide und werbefrei.
//
// Bewusst KEINE fest verdrahteten Video-IDs: eine einzelne Video-URL kann
// jederzeit tot sein, und dann steht in der App ein Link, der ins Leere führt.
// Stattdessen kanalgebundene Suchlinks – die funktionieren dauerhaft und finden
// auch neu hinzugekommene Folgen.

export const KANAL = 'Land.Schafft.Bayern';
export const PLAYLIST = 'https://www.youtube.com/playlist?list=PLhc8kW_Ed3uySubel_bDcKraPPsqQ0RCL';

/** Suchlink innerhalb des bevorzugten Kanals. */
export function videoSuche(begriff) {
  return 'https://www.youtube.com/results?search_query='
    + encodeURIComponent(`${begriff} ${KANAL}`);
}

/** Allgemeine Suche, falls der Kanal nichts Passendes hat. */
export function videoSucheAllgemein(begriff) {
  return 'https://www.youtube.com/results?search_query='
    + encodeURIComponent(`${begriff} Imkerei Anleitung`);
}

/** Weiterführende Fachquellen (kein Video, aber verlässlich). */
export const FACHQUELLEN = {
  varroa: { titel: 'Varroawetter & Behandlungsempfehlung (LWG Bayern)', url: 'https://www.lwg.bayern.de/bienen/' },
  allgemein: { titel: 'Die Honigmacher – Lernprogramm', url: 'https://www.die-honigmacher.de/' },
  behandlung: { titel: 'Zugelassene Tierarzneimittel (Vetidata/BVL)', url: 'https://www.bvl.bund.de/' },
};
