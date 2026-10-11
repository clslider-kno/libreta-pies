/* Deja la app funcionando sin internet una vez instalada desde Safari.
   Responde con lo guardado y, si hay red, lo renueva para la próxima vez. */
const CACHE = 'libreta-pies';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'iconos/icono-180.png', 'iconos/icono-192.png',
  'iconos/icono-512.png', 'fuentes/unbounded.woff2', 'fuentes/nunito-sans.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // La página misma: primero la versión nueva (así los cambios se ven al tiro);
  // si no hay internet o tarda más de 3 s, la guardada.
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const guardado = () => c.match('index.html');
      const red = fetch(e.request, { cache: 'no-cache' }).then((r) => {
        if (r.ok) c.put('index.html', r.clone());
        return r;
      });
      const plazo = new Promise((ok) => setTimeout(ok, 3000)).then(guardado);
      try { return (await Promise.race([red, plazo])) || await red; } catch { return (await guardado()) || Response.error(); }
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const guardado = await c.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request, { cache: 'no-cache' }).then((r) => {
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }).catch(() => guardado);
    if (guardado) { e.waitUntil(red); return guardado; }
    return red;
  }));
});
