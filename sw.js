// Service Worker: App-Hülle offline verfügbar halten.
// Wetterabrufe laufen "network first" mit Rückfall auf den Cache – am Bienenstand
// ist Funkloch der Normalfall, die App muss trotzdem starten.

const VERSION = 'beewise-v14';
const HUELLE = [
  './', './index.html', './css/app.css', './manifest.webmanifest',
  './js/app.js', './js/db.js', './js/engine.js', './js/regeln.js',
  './js/tracht.js', './js/ui.js', './js/util.js', './js/aufgaben.js',
  './js/karte.js', './js/bilder.js', './js/hilfe.js', './js/kalenderexport.js',
  './js/pdf.js', './js/berichte.js', './js/sync.js', './js/i18n.js', './js/lang/en.js',
  './js/qr.js', './js/etiketten.js', './js/stand.js', './js/koeniginnen.js',
  './js/fotos.js', './js/vergleich.js', './js/varroa.js', './js/packliste.js', './js/kasse.js', './js/waben.js', './js/winter.js', './js/gewicht.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(HUELLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Wetter- und Trachtdaten: erst Netz, dann Cache
  if (/open-meteo\.com$/.test(url.hostname)) {
    e.respondWith(
      fetch(e.request).then((r) => {
        const kopie = r.clone();
        caches.open(VERSION + '-daten').then((c) => c.put(e.request, kopie));
        return r;
      }).catch(() => caches.match(e.request)),
    );
    return;
  }

  // Bilder und andere fremde Quellen: nur Netz, kein Rückfall auf index.html
  if (url.origin !== location.origin) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)
      .then((t) => t || Response.error())));
    return;
  }

  // App-Hülle: aus dem Zwischenspeicher ausliefern und parallel erneuern.
  // Beim nächsten Start ist dann die neue Fassung da – ohne dass alte und neue
  // Dateien vermischt werden.
  e.respondWith(caches.match(e.request).then((tref) => {
    const frisch = fetch(e.request).then((r) => {
      if (r.ok) {
        const kopie = r.clone();
        caches.open(VERSION).then((c) => c.put(e.request, kopie));
      }
      return r;
    }).catch(() => tref || (e.request.mode === 'navigate'
      ? caches.match('./index.html') : Response.error()));
    return tref || frisch;
  }));
});
