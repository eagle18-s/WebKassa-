const CACHE = "webkassa-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/main.css",
  "./css/animations.css",
  "./js/config.js",
  "./js/github-api.js",
  "./js/auth.js",
  "./js/scanner.js",
  "./js/kassa.js",
  "./js/ui.js",
  "./js/app.js",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // GitHub API yazma — keçməsin
  if (e.request.url.includes("api.github.com")) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (e.request.method === "GET" && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
